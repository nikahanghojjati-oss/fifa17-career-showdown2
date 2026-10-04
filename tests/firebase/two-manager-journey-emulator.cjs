"use strict";

const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,collection,doc,getDoc,getDocs,setDoc,serverTimestamp}=firestoreSdk;
const {initializeTestEnvironment,assertFails,assertSucceeds}=require("@firebase/rules-unit-testing");

global.window=globalThis;
require("../../data/transferOptions.js");

const Setup=require("../../js/sparkSharedShowdownSetup.js");
const Career=require("../../js/sparkSharedCareerStart.js");
const Transfer=require("../../js/sparkSharedTransferChallenge.js");
const Results=require("../../js/sparkSharedSeasonResults.js");
const Commit=require("../../js/sparkSharedSeasonCommit.js");
const Scoring=require("../../js/sparkSharedCanonicalScoring.js");
const History=require("../../js/sparkSharedHistoryConvergence.js");
const Multi=require("../../js/sparkSharedMultiSeasonProgression.js");
const Final=require("../../js/sharedFinalReconciliation.js");
const Terminal=require("../../js/sharedTerminalClose.js");
const TerminalProvider=require("../../js/sparkTerminalClose.js");
const Sessions=require("../../js/sparkPrivateSession.js");
const StandardSessions=require("../../js/sparkStandardAuthPrivateSession.js");
const RemoteJoining=require("../../js/sparkRemoteJoining.js");
const Reconnect=require("../../js/sharedJourneyReconnect.js");
const MultiProtocol=require("../../js/sharedMultiSeasonProgression.js");
const Pairing=require("../../js/sparkPrivatePairing.js");
const PersistentPair=require("../../js/persistentNikDanielPair.js");
const CompletedReader=require("../../js/sparkCompletedShowdownReader.js");

const PROJECT_ID="demo-cms-two-manager-journey";
const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const TOTAL_SEASONS=Number(process.env.CMS_SHOWDOWN_LENGTH||3);
assert.ok([1,3,5,10].includes(TOTAL_SEASONS),`Unsupported journey length: ${TOTAL_SEASONS}`);

const A="acct_game_a",B="acct_game_b",C="acct_game_c";
const R1=`pair_${"1".repeat(64)}`,R2=`pair_${"2".repeat(64)}`,R3=`pair_${"3".repeat(64)}`;
const S1=`session_${"b".repeat(64)}`,S2=`session_${"c".repeat(64)}`,S3=`session_${"d".repeat(64)}`,S4=`session_${"e".repeat(64)}`,S4_STRICT=`session_${"f".repeat(64)}`;
// Job 31: a long (5 or 10 season) game outlives the 4-hour private session. Mid-journey, inside a transfer window, the
// first session expires for real, Daniel hosts a fresh one with the production host lifetime and Nik joins it; the game
// then carries on to the final season and Terminal Close on the fresh session without a reset or a redraw.
const ROTATE_SEASON=TOTAL_SEASONS>=3?Math.floor(TOTAL_SEASONS/2)+1:null;
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`,DC=`device_${"c".repeat(32)}`;
const PA=`profile_${"1".repeat(24)}`,PB=`profile_${"2".repeat(24)}`;
const SA=`save_${"3".repeat(24)}`,SB=`save_${"4".repeat(24)}`;

function sdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp};}
function canonical(value){if(value===undefined||value===null)return null;if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};if(Array.isArray(value))return value.map(canonical);if(typeof value==="object"){const out={};for(const key of Object.keys(value).sort())out[key]=canonical(value[key]);return out;}return value;}
function hex(bytes){return Array.from(bytes,value=>value.toString(16).padStart(2,"0")).join("");}
async function digest(value){const bytes=new TextEncoder().encode(JSON.stringify(canonical(value)));const hash=await crypto.webcrypto.subtle.digest("SHA-256",bytes);return `sha256:${hex(new Uint8Array(hash))}`;}
async function envelope(objectType,objectId,revision,data,{accountId=A,deviceId=DA,updatedAt=Timestamp.fromMillis(Date.now()),priorHash=null}={}){return {schemaVersion:1,objectType,objectId,revision,parentRevision:revision===0?null:revision-1,lifecycleState:"live",contentHash:await digest({objectType,objectId,revision,data}),priorContentHash:revision===0?null:(priorHash||`sha256:${"0".repeat(64)}`),updatedAt,updatedByAccountId:accountId,updatedByDeviceId:deviceId,data,tombstone:null};}
async function account(uid){const now=Timestamp.fromMillis(Date.now()-120000);return envelope("account",uid,0,{status:"active",createdAt:now,deletionRequestedAt:null},{accountId:uid,deviceId:null,updatedAt:now});}
async function device(uid,id,seed){const now=Timestamp.fromMillis(Date.now()-120000);return envelope("device",id,0,{deviceId:id,installationId:`installation_${seed.repeat(32).slice(0,32)}`,displayLabel:null,state:"active",registeredAt:now,lastSeenAt:now,revokedAt:null},{accountId:uid,deviceId:id,updatedAt:now});}
function slots(){return [
  {slotId:"playerOne",accountId:A,profileId:PA,saveId:SA,displayLabel:"Daniel",entitlementState:"active",deletionConsent:false},
  {slotId:"playerTwo",accountId:B,profileId:PB,saveId:SB,displayLabel:"Nik",entitlementState:"active",deletionConsent:false}
];}
async function rivalry(id){const now=Timestamp.fromMillis(Date.now()-90000),data={connectionState:"active",connectionStateBeforeDeletion:null,managerSlots:slots(),authorizedAccountIds:[A,B],createdByAccountId:A,createdAt:now};return envelope("rivalry",id,0,data,{accountId:A,deviceId:DA,updatedAt:now});}
async function pairLink(uid,id,role,managerId,deviceId){const now=Timestamp.fromMillis(Date.now()-80000),data={rivalryId:id,managerRole:role,managerId,linkedAt:now,lastConfirmedAt:now};return envelope("pairLink","current",0,data,{accountId:uid,deviceId,updatedAt:now});}
async function session(id,sid,nowMs){const createdAt=Timestamp.fromMillis(nowMs-60000),lastActivityAt=Timestamp.fromMillis(nowMs-1000);return Sessions.buildEnvelope({sessionId:sid,revision:1,parentRevision:0,priorContentHash:`sha256:${"9".repeat(64)}`,updatedAt:lastActivityAt,accountId:A,deviceId:DA,data:{rivalryId:id,state:"active",hostAccountId:A,memberAccountIds:[A,B],createdAt,expiresAt:Timestamp.fromMillis(nowMs+4*60*60*1000),lastActivityAt,revokedAt:null},cryptoImpl:crypto.webcrypto});}
function op(prefix,n){return prefix+Number(n).toString(16).padStart(32,"0");}
function base(db,uid,deviceId,rivalryId,sessionId,now){return {user:{uid},firestore:db,firebaseSdk:sdk(),rivalryId,sessionId,deviceId,nowEpochMs:now,cryptoImpl:crypto.webcrypto};}
function localAuthority(role){const slot=slots().find(item=>item.slotId===role);return {phase:"REMOTE_OBSERVED",canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,binding:{saveId:slot.saveId,profileId:slot.profileId,managerRole:role}};}
function resultFor(role,season){if(role==="playerOne")return {leaguePosition:season===1?1:2,leaguePoints:season===1?102:90+season,leagueGoals:88+season,domesticCup:season===2,championsLeague:season===3,topScorer:season===1,topAssist:false};return {leaguePosition:season===2?1:3,leaguePoints:87+season,leagueGoals:84+season,domesticCup:false,championsLeague:false,topScorer:false,topAssist:season===3};}
function expectedScore(role,season){if(role==="playerOne"){if(season===1)return 5;if(season===2)return 1;if(season===3)return 5;if(season===10)return 1;return 0;}if(season===2)return 3;if(season===3)return 1;return 0;}
function expectedWinner(season){return season===2?"playerTwo":"playerOne";}

async function seedAccountsAndMainRivalry(env,now){await env.withSecurityRulesDisabled(async context=>{const db=context.firestore();for(const [uid,id,seed] of [[A,DA,"a"],[B,DB,"b"],[C,DC,"c"]]){await setDoc(doc(db,"accounts",uid),await account(uid));await setDoc(doc(db,"accounts",uid,"devices",id),await device(uid,id,seed));}await setDoc(doc(db,"rivalries",R1),await rivalry(R1));await setDoc(doc(db,"rivalries",R1,"sessions",S1),await session(R1,S1,now));await setDoc(doc(db,"accounts",A,"pairLinks","current"),await pairLink(A,R1,"playerOne","daniel",DA));await setDoc(doc(db,"accounts",B,"pairLinks","current"),await pairLink(B,R1,"playerTwo","nik",DB));});}

async function assertStrangerDenied(env,dbA,dbB,label){
  const dbC=env.authenticatedContext(C).firestore();
  const paths=[
    ["rivalry root",doc(dbC,"rivalries",R1)],
    ["shared setup",doc(dbC,"rivalries",R1,"sharedSetup","authoritative")],
    ["season 1 commit",doc(dbC,"rivalries",R1,"seasonCommits","season_1")],
    ["season 1 results",doc(dbC,"rivalries",R1,"seasonResults","season_1")],
    ["season 1 Daniel result",doc(dbC,"rivalries",R1,"seasonResults","season_1","roles","playerOne")],
    ["season 1 transfer",doc(dbC,"rivalries",R1,"transferChallenges","season_1")],
    ["season 1 Daniel transfer",doc(dbC,"rivalries",R1,"transferChallenges","season_1","roles","playerOne")],
    ["season 1 Nik transfer",doc(dbC,"rivalries",R1,"transferChallenges","season_1","roles","playerTwo")],
    ["Daniel pair link",doc(dbC,"accounts",A,"pairLinks","current")]
  ];
  for(const [name,ref] of paths)await assertFails(getDoc(ref),`${label}: stranger must not read ${name}`);
  for(const [who,db] of [["Daniel",dbA],["Nik",dbB],["stranger",dbC]])await assertFails(getDocs(collection(db,"rivalries",R1,"seasonCommits")),`${label}: ${who} must not list season commits`);
}


function pairingIdentity(deviceId,seed,nowMs){return {schemaVersion:1,installationId:`installation_${seed.repeat(32).slice(0,32)}`,deviceId,createdAtEpochMs:nowMs-180000};}
function bindingFor(role){return role==="playerOne"?{saveId:SA,profileId:PA,managerRole:role,displayLabel:"Daniel"}:{saveId:SB,profileId:PB,managerRole:role,displayLabel:"Nik"};}
function managerIdFor(role){return role==="playerOne"?"daniel":"nik";}

function pairLinkWitness(db,uid,deviceId,role){
  return async({transaction,binding,capability,now})=>{
    const ref=doc(db,"accounts",uid,"pairLinks","current"),snapshot=await transaction.get(ref);
    let revision=0,parentRevision=null,priorHash=null,linkedAt=now;
    if(snapshot.exists()){const prior=snapshot.data();revision=prior.revision+1;parentRevision=prior.revision;priorHash=prior.contentHash;linkedAt=prior.data.linkedAt;}
    const data={rivalryId:capability,managerRole:role,managerId:managerIdFor(role),linkedAt,lastConfirmedAt:now};
    const next=await envelope("pairLink","current",revision,data,{accountId:uid,deviceId,updatedAt:now,priorHash});
    if(parentRevision!==null)next.parentRevision=parentRevision;
    transaction.set(ref,next);
    return {ok:true,rivalryId:capability,managerRole:role,managerId:managerIdFor(role),providerSaveId:binding.saveId,providerProfileId:binding.profileId};
  };
}

async function pairFreshRivalry(env,{rivalryId,sessionId,nowMs}){
  const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
  const created=await Pairing.createPairing({user:{uid:A},firestore:dbA,firebaseSdk:sdk(),identity:pairingIdentity(DA,"a",nowMs),binding:bindingFor("playerOne"),capability:rivalryId,nowEpochMs:nowMs,cryptoImpl:crypto.webcrypto,durableWitness:PersistentPair.createDurableCreationWitness({services:{firestoreSdk:sdk(),firestore:dbA},accountId:A,deviceId:DA},"playerOne",PersistentPair.managerByRole.playerOne)});
  assert.equal(created.ok,true,`Daniel provider createPairing failed: ${JSON.stringify(created)}`);
  const redeemed=await Pairing.redeemPairing({user:{uid:B},firestore:dbB,firebaseSdk:sdk(),identity:pairingIdentity(DB,"b",nowMs),binding:bindingFor("playerTwo"),capability:rivalryId,nowEpochMs:nowMs+1000,cryptoImpl:crypto.webcrypto,durableWitness:PersistentPair.createDurableRedemptionWitness({services:{firestoreSdk:sdk(),firestore:dbB},accountId:B,deviceId:DB},"playerTwo",PersistentPair.managerByRole.playerTwo,rivalryId)});
  assert.equal(redeemed.ok,true,`Nik provider redeemPairing failed: ${JSON.stringify(redeemed)}`);
  const rootA=await assertSucceeds(getDoc(doc(dbA,"rivalries",rivalryId))),rootB=await assertSucceeds(getDoc(doc(dbB,"rivalries",rivalryId)));
  assert.equal(rootA.data().data.connectionState,"active");assert.deepEqual(rootA.data().data.managerSlots,rootB.data().data.managerSlots);
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    // JOB-02 fallback: real pairing is proved above; seed the paired gameplay root exactly like the lifecycle template before provider gameplay.
    await setDoc(doc(db,"rivalries",rivalryId),await rivalry(rivalryId));
    await setDoc(doc(db,"rivalries",rivalryId,"sessions",sessionId),await session(rivalryId,sessionId,nowMs+2000));
  });
  return {dbA,dbB};
}

async function seedGameplayBridge(env,{rivalryId,sessionId,nowMs}){
  // JOB-02 F/G fallback: real create/redeem is proven first, then gameplay starts
  // from the template-equivalent paired root because the provider harness does
  // not carry the browser runtime bridge between pairing and gameplay.
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    await setDoc(doc(db,"rivalries",rivalryId),await rivalry(rivalryId));
    await setDoc(doc(db,"rivalries",rivalryId,"sessions",sessionId),await session(rivalryId,sessionId,nowMs));
  });
}

async function playFreshSingleSeason(env,{rivalryId,sessionId,nowMs,closeAtEnd=false}){
  const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
  const a=t=>base(dbA,A,DA,rivalryId,sessionId,nowMs+t),b=t=>base(dbB,B,DB,rivalryId,sessionId,nowMs+t);
  for(const [type,baseRevision,n,extra] of [["open",0,101,{}],["commit-league",1,102,{}],["commit-clubs",2,103,{}],["commit-length",3,104,{totalSeasons:1}]]){const value=await Setup.mutate({...a(n),type,baseRevision,operationId:op("setup_op_",n),...extra});assert.equal(value.ok,true,JSON.stringify(value));}
  let setup=await Setup.mutate({...a(105),type:"confirm",baseRevision:4,operationId:op("setup_op_",105)});assert.equal(setup.ok,true,JSON.stringify(setup));
  setup=await Setup.mutate({...b(106),type:"confirm",baseRevision:5,operationId:op("setup_op_",106)});assert.equal(setup.ok,true,JSON.stringify(setup));assert.equal(setup.state.phase,"SHOWDOWN_CONFIRMED");assert.equal(setup.state.totalSeasons,1);
  let career=await Career.acknowledge({...a(110),operationId:op("career_start_op_",101),baseRevision:0});assert.equal(career.ok,true,JSON.stringify(career));
  career=await Career.acknowledge({...b(120),operationId:op("career_start_op_",102),baseRevision:1});assert.equal(career.ok,true,JSON.stringify(career));assert.equal(career.state.phase,"CAREER_START_READY");
  let transfer=await Transfer.startWindow({...a(200),seasonNumber:1,operationId:op("transfer_op_",101),baseRevision:0});assert.equal(transfer.ok,true,JSON.stringify(transfer));
  transfer=await Transfer.requestEndWindow({...a(210),seasonNumber:1,operationId:op("transfer_op_",102),baseRevision:1});assert.equal(transfer.ok,true,JSON.stringify(transfer));
  transfer=await Transfer.requestEndWindow({...b(220),seasonNumber:1,operationId:op("transfer_op_",103),baseRevision:2});assert.equal(transfer.ok,true,JSON.stringify(transfer));
  transfer=await Transfer.lockGuesses({...a(230),seasonNumber:1,operationId:op("transfer_op_",104),baseRevision:3,guesses:[{slot:1,type:"league",valueId:"england-premier-league"}]});assert.equal(transfer.ok,true,JSON.stringify(transfer));
  transfer=await Transfer.lockGuesses({...b(240),seasonNumber:1,operationId:op("transfer_op_",105),baseRevision:4,guesses:[{slot:1,type:"nationality",valueId:"brazil"}]});assert.equal(transfer.ok,true,JSON.stringify(transfer));
  transfer=await Transfer.lockSignings({...a(250),seasonNumber:1,operationId:op("transfer_op_",106),baseRevision:5,signings:[{slot:1,name:"Daniel fresh signing",leagueId:"spain-primera-division",nationalityId:"england"}]});assert.equal(transfer.ok,true,JSON.stringify(transfer));
  transfer=await Transfer.lockSignings({...b(260),seasonNumber:1,operationId:op("transfer_op_",107),baseRevision:6,signings:[{slot:1,name:"Nik fresh signing",leagueId:"england-premier-league",nationalityId:"brazil"}]});assert.equal(transfer.ok,true,JSON.stringify(transfer));assert.equal(transfer.state.phase,"COMPLETED");
  let results=await Results.publishResult({...a(300),seasonNumber:1,operationId:op("season_result_op_",101),baseRevision:0,result:resultFor("playerOne",1)});assert.equal(results.ok,true,JSON.stringify(results));
  results=await Results.publishResult({...b(310),seasonNumber:1,operationId:op("season_result_op_",102),baseRevision:1,result:resultFor("playerTwo",1)});assert.equal(results.ok,true,JSON.stringify(results));assert.equal(results.state.phase,"RESULTS_READY");
  let commit=await Commit.commitSeason({...a(320),seasonNumber:1,operationId:op("season_commit_op_",101),baseRevision:0});assert.equal(commit.ok,true,JSON.stringify(commit));
  commit=await Commit.acknowledgeSeason({...b(330),seasonNumber:1,operationId:op("season_commit_op_",102),baseRevision:1});assert.equal(commit.ok,true,JSON.stringify(commit));
  commit=await Commit.acknowledgeSeason({...a(340),seasonNumber:1,operationId:op("season_commit_op_",103),baseRevision:2});assert.equal(commit.ok,true,JSON.stringify(commit));assert.equal(commit.phase,"ACKNOWLEDGED");
  const scoreA=await Scoring.read({...a(350),seasonNumber:1,teamCount:20}),scoreB=await Scoring.read({...b(350),seasonNumber:1,teamCount:20});assert.deepEqual(scoreA.scoring,scoreB.scoring);assert.equal(scoreA.winner,scoreB.winner);
  const historyA=await History.read({...a(360),throughSeason:1}),historyB=await History.read({...b(360),throughSeason:1});assert.deepEqual(historyA.projection,historyB.projection);assert.equal(historyA.projection.seasonHistory.length,1);
  const multiA=await Multi.read(a(370)),multiB=await Multi.read(b(370));assert.deepEqual(multiA.state,multiB.state);
  const finalA=Final.reconcile({sharedActive:true,multiSeason:multiA,history:historyA,localReconciliation:localAuthority("playerOne")}),finalB=Final.reconcile({sharedActive:true,multiSeason:multiB,history:historyB,localReconciliation:localAuthority("playerTwo")});assert.deepEqual(finalA,finalB);assert.equal(finalA.phase,"FINAL_SEASON_RECONCILED");
  if(closeAtEnd){const intent=Terminal.prepare(finalA,{sessionId});const closed=await TerminalProvider.close({...a(400),intent});assert.equal(closed.ok,true,JSON.stringify(closed));assert.equal(closed.rivalryState,"closed");}
  return {dbA,dbB,a,b,history:historyA,multi:multiA,final:finalA};
}

async function assertCareerIndex(main,expected,label){
  for(const [who,db,uid] of [["Daniel",main.dbA,A],["Nik",main.dbB,B]]){
    const index=await PersistentPair.readCareerIndex({firestore:db,firebaseSdk:firestoreSdk,accountId:uid});
    assert.equal(index.status,"ready",`${label}: ${who} index must be ready`);
    assert.deepEqual(index.rivalryIds,expected,`${label}: ${who} index`);
    assert.equal(index.rivalryIds.includes(R1),false,`${label}: ${who} index never contains pre-index R1`);
  }
}

async function assertCompletedShowdowns(env,expected,label,{indexed=null}={}){
  const seen={};
  for(const [who,uid] of [["Daniel",A],["Nik",B]]){
    const db=env.authenticatedContext(uid).firestore();
    let ids=Object.keys(expected);
    if(indexed){const index=await PersistentPair.readCareerIndex({firestore:db,firebaseSdk:firestoreSdk,accountId:uid});assert.equal(index.status,"ready",`${label}: ${who} index`);assert.deepEqual(index.rivalryIds,indexed,`${label}: ${who} index ids`);ids=[...new Set([...index.rivalryIds,...ids])];}
    for(const id of ids){
      const result=await CompletedReader.readCompletedShowdown({firestore:db,firebaseSdk:firestoreSdk,user:{uid},rivalryId:id,cryptoImpl:crypto.webcrypto});
      const want=expected[id];
      assert.equal(result.status,want.status,`${label}: ${who} ${id.slice(0,9)} status ${JSON.stringify(result)}`);
      if(want.status==="completed"){assert.deepEqual(result.final.totals,want.totals,`${label}: ${who} totals`);assert.equal(result.final.seasonsPlayed,want.seasonsPlayed);assert.equal(result.projection.seasonHistory.length,want.seasonsPlayed);}
      else assert.equal(result.projection,null,`${label}: ${who} abandoned Showdown carries no seasons`);
      if(seen[id])assert.deepEqual({projection:result.projection,final:result.final},seen[id],`${label}: both managers read the same ${id.slice(0,9)}`);
      else seen[id]={projection:result.projection,final:result.final};
    }
  }
}

async function runSecondShowdownAndAbandon(env,main){
  const now2=Date.now();
  await pairFreshRivalry(env,{rivalryId:R2,sessionId:S2,nowMs:now2});
  await seedGameplayBridge(env,{rivalryId:R2,sessionId:S2,nowMs:now2+2000});
  const pairA2=(await assertSucceeds(getDoc(doc(main.dbA,"accounts",A,"pairLinks","current")))).data(),pairB2=(await assertSucceeds(getDoc(doc(main.dbB,"accounts",B,"pairLinks","current")))).data();
  assert.equal(pairA2.data.rivalryId,R2,"Daniel current pair link moves to the new rivalry");
  await assertCareerIndex(main,[R2],"G-7 after Showdown 2 pairing (R1 predates the index: never backfilled)");
  assert.equal(pairB2.data.rivalryId,R2,"Nik current pair must also move to the new rivalry");
  for(const [who,db] of [["Daniel",main.dbA],["Nik",main.dbB]]){
    await assertSucceeds(getDoc(doc(db,"rivalries",R1,"sharedSetup","authoritative")),`G-8: ${who} reads closed Showdown 1 setup without a session`);
    await assertSucceeds(getDoc(doc(db,"rivalries",R1,"seasonCommits","season_1")),`G-8: ${who} reads closed Showdown 1 season 1 without a session`);
  }
  await assertCompletedShowdowns(env,{[R1]:{status:"completed",totals:main.finalA.managerTotals,seasonsPlayed:TOTAL_SEASONS}},"G-8 after Showdown 2 pairing");
  await playFreshSingleSeason(env,{rivalryId:R2,sessionId:S2,nowMs:now2+5000,closeAtEnd:true});

  const now3=Date.now();
  await pairFreshRivalry(env,{rivalryId:R3,sessionId:S3,nowMs:now3});
  await seedGameplayBridge(env,{rivalryId:R3,sessionId:S3,nowMs:now3+2000});
  await assertCareerIndex(main,[R2,R3],"G-7 after Showdown 3 pairing (closed R2 kept, order kept)");
  const fresh=await playFreshSingleSeason(env,{rivalryId:R3,sessionId:S3,nowMs:now3+5000,closeAtEnd:false});
  globalThis.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:A}},firestore:fresh.dbA,firestoreSdk:sdk()})};
  globalThis.CareerModeSparkConnectedAccount={initialize:async()=>{},getState:()=>({connected:true,accountId:A})};
  globalThis.CareerModeSparkPrivatePairing={initialize:async()=>{},getState:()=>({registered:true,deviceId:DA})};
  globalThis.CareerModeOnlinePlayerIdentity={getState:()=>({managerId:"daniel"})};
  const abandoned=await PersistentPair.abandonCurrentShowdown({expectedRivalryId:R3,expectedSaveId:SA,cryptoImpl:crypto.webcrypto});
  assert.equal(abandoned.ok,true,JSON.stringify(abandoned));assert.equal(abandoned.status,"closed");
  const abandonedRoot=(await assertSucceeds(getDoc(doc(fresh.dbA,"rivalries",R3)))).data();
  assert.equal(abandonedRoot.data.connectionState,"closed","Abandon must close the rivalry root");
  assert.equal(Object.hasOwn(abandonedRoot.data,"terminalClose"),false,"Abandon must not create a terminalClose witness");
  const denied=await Results.publishResult({...fresh.a(500),seasonNumber:1,operationId:op("season_result_op_",199),baseRevision:2,result:resultFor("playerOne",1)});
  assert.equal(denied.ok,false,"Further season writes must be denied after abandon");
  let storedCommit;
  await env.withSecurityRulesDisabled(async context=>{storedCommit=(await getDoc(doc(context.firestore(),"rivalries",R3,"seasonCommits","season_1"))).data();});
  await assertFails(setDoc(doc(fresh.dbA,"rivalries",R3,"seasonCommits","season_1"),storedCommit),"Further direct season writes must be denied after abandon");
  // G-8: from fresh authenticated clients, the career index leads to R2 completed and R3 abandoned; closed R1 stays completed.
  await assertCompletedShowdowns(env,{[R1]:{status:"completed",totals:main.finalA.managerTotals,seasonsPlayed:TOTAL_SEASONS},[R2]:{status:"completed",totals:{playerOne:5,playerTwo:0},seasonsPlayed:1},[R3]:{status:"abandoned"}},"G-8 after Showdown 3 abandon",{indexed:[R2,R3]});
}

function sessionOptions(db,uid,deviceId,sessionId,nowEpochMs,ttlMs){const value={user:{uid},firestore:db,firebaseSdk:sdk(),deviceId,rivalryId:R1,sessionId,nowEpochMs,cryptoImpl:crypto.webcrypto};if(ttlMs!==undefined)value.ttlMs=ttlMs;return value;}
function remoteFor(uid,deviceId,sessionId,expiresAtEpochMs){return {sessionId,rivalryId:R1,accountId:uid,deviceId,sessionState:"active",pendingAction:null,expiresAtEpochMs};}
async function journeyAuthority(ctx,t,sessionId){const setup=await Setup.read(ctx(t));assert.equal(setup.ok,true,JSON.stringify(setup));const multi=await Multi.read(ctx(t));assert.equal(multi.ok,true,JSON.stringify(multi));return {setup:setup.state,progression:multi.state};}

// Job 31 rotation: called after Daniel locked his guesses in ROTATE_SEASON, so one role document carries the old session.
async function expireAndRejoin(env,{dbA,dbB,a,season}){
  const protocol=Reconnect.createProtocol({multiSeasonModule:MultiProtocol});
  const authorityA={rivalryId:R1,accountId:A,deviceId:DA,managerRole:"playerOne"};
  const before=await journeyAuthority(a,season*10000+410,S1);
  const oldExpiry=(await assertSucceeds(getDoc(doc(dbA,"rivalries",R1,"sessions",S1)))).data().data.expiresAt.toMillis();
  let observed=protocol.observe({authority:authorityA,previous:null,nowEpochMs:Date.now(),networkOnline:true,remote:remoteFor(A,DA,S1,oldExpiry),...before});
  assert.equal(observed.phase,"ACTIVE_RECOVERED");assert.equal(observed.acceptedSeasons,season-1);assert.equal(observed.activeSeason,season);
  // Four hours pass: the stored session reaches its expiry boundary (time travel is seeded; the expiry write below is a real Rules check).
  const realNow=Date.now();
  await env.withSecurityRulesDisabled(async context=>{const lastActivityAt=Timestamp.fromMillis(realNow-60000);await setDoc(doc(context.firestore(),"rivalries",R1,"sessions",S1),await Sessions.buildEnvelope({sessionId:S1,revision:1,parentRevision:0,priorContentHash:`sha256:${"9".repeat(64)}`,updatedAt:lastActivityAt,accountId:A,deviceId:DA,data:{rivalryId:R1,state:"active",hostAccountId:A,memberAccountIds:[A,B],createdAt:Timestamp.fromMillis(realNow-4*60*60*1000-120000),expiresAt:Timestamp.fromMillis(realNow-1000),lastActivityAt,revokedAt:null},cryptoImpl:crypto.webcrypto}));});
  observed=protocol.observe({authority:authorityA,previous:observed,nowEpochMs:Date.now(),networkOnline:true,remote:remoteFor(A,DA,S1,realNow-1000)});
  assert.equal(observed.phase,"FRESH_SESSION_REQUIRED","an expired session must ask for a fresh one");assert.equal(observed.resumable,true,"the verified journey stays resumable across the expiry");assert.equal(observed.activeAuthorization,false);
  const expired=await StandardSessions.expireSession(sessionOptions(dbB,B,DB,S1,Date.now()));
  assert.equal(expired.ok,true,`Nik records the 4-hour expiry: ${JSON.stringify(expired)}`);assert.equal(expired.state,"expired");
  const stale=await Transfer.lockGuesses({...base(dbB,B,DB,R1,S1,Date.now()),seasonNumber:season,operationId:op("transfer_op_",season*10+8),baseRevision:4,guesses:[{slot:1,type:"league",valueId:"spain-primera-division"}]});
  assert.equal(stale.ok,false,"no shared write may use the expired session");
  // Daniel re-hosts. A browser clock a few seconds fast must not break HOST: the full 4 hours is refused by the Rules, the production host lifetime is not.
  const strict=await StandardSessions.openSession(sessionOptions(dbA,A,DA,S4_STRICT,Date.now()+20000,4*60*60*1000));
  assert.equal(strict.ok,false,"Rules boundary: a 4h lifetime from a clock 20s fast is refused");assert.equal(strict.code,"permission-denied",JSON.stringify(strict));
  assert.ok(RemoteJoining.hostSessionTtlMs<4*60*60*1000&&RemoteJoining.hostSessionTtlMs>=4*60*60*1000-5*60*1000,"the production host lifetime keeps a small clock margin under 4 hours");
  const hosted=await StandardSessions.openSession(sessionOptions(dbA,A,DA,S4,Date.now()+20000,RemoteJoining.hostSessionTtlMs));
  assert.equal(hosted.ok,true,`Daniel hosts a fresh session from a slightly fast clock: ${JSON.stringify(hosted)}`);assert.equal(hosted.state,"open");
  const joined=await StandardSessions.joinSession(sessionOptions(dbB,B,DB,S4,Date.now()));
  assert.equal(joined.ok,true,`Nik joins the fresh session: ${JSON.stringify(joined)}`);assert.equal(joined.state,"active");
  const hostView=await StandardSessions.readSession(sessionOptions(dbA,A,DA,S4,Date.now()));
  assert.equal(hostView.ok,true,JSON.stringify(hostView));assert.equal(hostView.state,"active","the host reads the peer's join");
  const fresh=t=>base(dbA,A,DA,R1,S4,Date.now()+t);
  const after=await journeyAuthority(fresh,0,S4);
  observed=protocol.observe({authority:authorityA,previous:observed,nowEpochMs:Date.now(),networkOnline:true,remote:remoteFor(A,DA,S4,hosted.expiresAtEpochMs),...after});
  assert.equal(observed.phase,"ACTIVE_RECOVERED","the fresh session recovers the same journey");assert.equal(observed.sessionChanged,true);
  assert.equal(observed.acceptedSeasons,season-1,"no accepted season is lost or replayed");assert.equal(observed.activeSeason,season);assert.deepEqual(after.setup.clubs,before.setup.clubs,"no league or club redraw");assert.equal(after.setup.leagueId,before.setup.leagueId);
}

async function playMainJourney(env){
  const now=Date.now();
  await seedAccountsAndMainRivalry(env,now);
  const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
  let sid=S1;const a=t=>base(dbA,A,DA,R1,sid,now+t),b=t=>base(dbB,B,DB,R1,sid,now+t);

  for(const [type,baseRevision,n,extra] of [["open",0,1,{}],["commit-league",1,2,{}],["commit-clubs",2,3,{}],["commit-length",3,4,{totalSeasons:TOTAL_SEASONS}]]){const result=await Setup.mutate({...a(n*10),type,baseRevision,operationId:op("setup_op_",n),...extra});assert.equal(result.ok,true,`Setup ${type} failed: ${JSON.stringify(result)}`);}
  let setup=await Setup.mutate({...a(50),type:"confirm",baseRevision:4,operationId:op("setup_op_",5)});assert.equal(setup.ok,true,JSON.stringify(setup));
  setup=await Setup.mutate({...b(60),type:"confirm",baseRevision:5,operationId:op("setup_op_",6)});assert.equal(setup.ok,true,JSON.stringify(setup));assert.equal(setup.state.phase,"SHOWDOWN_CONFIRMED");assert.equal(setup.state.totalSeasons,TOTAL_SEASONS);await assertStrangerDenied(env,dbA,dbB,"after setup confirmation");
  let career=await Career.acknowledge({...a(70),operationId:op("career_start_op_",1),baseRevision:0});assert.equal(career.ok,true,JSON.stringify(career));career=await Career.acknowledge({...b(80),operationId:op("career_start_op_",2),baseRevision:1});assert.equal(career.ok,true,JSON.stringify(career));assert.equal(career.state.phase,"CAREER_START_READY");

  let lastHistory=null,lastMulti=null;const totals={playerOne:0,playerTwo:0};
  for(let season=1;season<=TOTAL_SEASONS;season+=1){const offset=season*10000;
    let transfer=await Transfer.startWindow({...a(offset+100),seasonNumber:season,operationId:op("transfer_op_",season*10+1),baseRevision:0});assert.equal(transfer.ok,true,JSON.stringify(transfer));
    transfer=await Transfer.requestEndWindow({...a(offset+200),seasonNumber:season,operationId:op("transfer_op_",season*10+2),baseRevision:1});assert.equal(transfer.ok,true,JSON.stringify(transfer));
    transfer=await Transfer.requestEndWindow({...b(offset+300),seasonNumber:season,operationId:op("transfer_op_",season*10+3),baseRevision:2});assert.equal(transfer.ok,true,JSON.stringify(transfer));assert.equal(transfer.state.phase,"GUESS_ENTRY");
    transfer=await Transfer.lockGuesses({...a(offset+400),seasonNumber:season,operationId:op("transfer_op_",season*10+4),baseRevision:3,guesses:[{slot:1,type:"league",valueId:"england-premier-league"},{slot:2,type:"nationality",valueId:"brazil"},{slot:3,type:"league",valueId:"germany-bundesliga"}]});assert.equal(transfer.ok,true,JSON.stringify(transfer));await assertFails(getDoc(doc(dbB,"rivalries",R1,"transferChallenges",`season_${season}`,"roles","playerOne")),`S${season}: Nik must not read Daniel unfinished transfer inputs`);
    if(season===ROTATE_SEASON){await expireAndRejoin(env,{dbA,dbB,a,season});sid=S4;}
    transfer=await Transfer.lockGuesses({...b(offset+500),seasonNumber:season,operationId:op("transfer_op_",season*10+5),baseRevision:4,guesses:[{slot:1,type:"league",valueId:"spain-primera-division"},{slot:2,type:"nationality",valueId:"germany"},{slot:3,type:"nationality",valueId:"albania"}]});assert.equal(transfer.ok,true,JSON.stringify(transfer));assert.equal(transfer.state.phase,"SIGNING_ENTRY");await assertFails(getDoc(doc(dbA,"rivalries",R1,"transferChallenges",`season_${season}`,"roles","playerTwo")),`S${season}: Daniel must not read Nik unfinished transfer inputs`);
    transfer=await Transfer.lockSignings({...a(offset+600),seasonNumber:season,operationId:op("transfer_op_",season*10+6),baseRevision:5,signings:[{slot:1,name:`Daniel S${season} A`,leagueId:"spain-primera-division",nationalityId:"england"},{slot:2,name:`Daniel S${season} B`,leagueId:"australia-a-league",nationalityId:"albania"},{slot:3,name:`Daniel S${season} C`,leagueId:"germany-bundesliga",nationalityId:"france"}]});assert.equal(transfer.ok,true,JSON.stringify(transfer));
    transfer=await Transfer.lockSignings({...b(offset+700),seasonNumber:season,operationId:op("transfer_op_",season*10+7),baseRevision:6,signings:[{slot:1,name:`Nik S${season} A`,leagueId:"england-premier-league",nationalityId:"brazil"},{slot:2,name:`Nik S${season} B`,leagueId:"italy-serie-a",nationalityId:"germany"},{slot:3,name:`Nik S${season} C`,leagueId:"france-ligue-1",nationalityId:"albania"}]});assert.equal(transfer.ok,true,JSON.stringify(transfer));assert.equal(transfer.state.phase,"COMPLETED");await assertSucceeds(getDoc(doc(dbB,"rivalries",R1,"transferChallenges",`season_${season}`,"roles","playerOne")));await assertSucceeds(getDoc(doc(dbA,"rivalries",R1,"transferChallenges",`season_${season}`,"roles","playerTwo")));
    const transferA=await Transfer.read({...a(offset+750),seasonNumber:season}),transferB=await Transfer.read({...b(offset+750),seasonNumber:season});assert.deepEqual(transferA.verdicts,transferB.verdicts,`S${season} transfer state must converge`);

    let results;
    if(TOTAL_SEASONS>1&&season===2){
      const opA=op("season_result_op_",season*10+1),opB=op("season_result_op_",season*10+2);
      const simultaneous=await Promise.all([
        Results.publishResult({...a(offset+800),seasonNumber:season,operationId:opA,baseRevision:0,result:resultFor("playerOne",season)}),
        Results.publishResult({...b(offset+800),seasonNumber:season,operationId:opB,baseRevision:0,result:resultFor("playerTwo",season)})
      ]);
      const accepted=simultaneous.map((result,index)=>({result,index})).filter(item=>item.result.ok===true);
      const stale=simultaneous.map((result,index)=>({result,index})).filter(item=>item.result.ok!==true);
      assert.equal(accepted.length,1,"Simultaneous result taps must accept exactly one first writer");
      assert.equal(stale.length,1,"Simultaneous result taps must leave exactly one stale writer to retry");
      assert.equal(stale[0].result.code,"SEASON_RESULTS_STALE_BASE_REVISION",JSON.stringify(simultaneous));
      results=stale[0].index===0
        ?await Results.publishResult({...a(offset+900),seasonNumber:season,operationId:opA,baseRevision:1,result:resultFor("playerOne",season)})
        :await Results.publishResult({...b(offset+900),seasonNumber:season,operationId:opB,baseRevision:1,result:resultFor("playerTwo",season)});
      assert.equal(results.ok,true,JSON.stringify(results));assert.equal(results.state.phase,"RESULTS_READY");
      const publicResults=(await assertSucceeds(getDoc(doc(dbA,"rivalries",R1,"seasonResults",`season_${season}`)))).data();
      assert.equal(publicResults.phase,"RESULTS_READY");assert.equal(publicResults.revision,2);
      assert.equal(new Set(publicResults.publishedRoles).size,2);assert.deepEqual([...publicResults.publishedRoles].sort(),["playerOne","playerTwo"]);
      assert.equal(new Set(publicResults.operationIds).size,2,"Simultaneous taps must not duplicate result operations");
      await assertSucceeds(getDoc(doc(dbB,"rivalries",R1,"seasonResults",`season_${season}`,"roles","playerOne")));
      await assertSucceeds(getDoc(doc(dbA,"rivalries",R1,"seasonResults",`season_${season}`,"roles","playerTwo")));
    }else{
      results=await Results.publishResult({...a(offset+800),seasonNumber:season,operationId:op("season_result_op_",season*10+1),baseRevision:0,result:resultFor("playerOne",season)});assert.equal(results.ok,true,JSON.stringify(results));await assertFails(getDoc(doc(dbB,"rivalries",R1,"seasonResults",`season_${season}`,"roles","playerOne")),`S${season}: Nik must not read Daniel unpublished-to-both result`);await assertFails(getDoc(doc(dbA,"rivalries",R1,"seasonResults",`season_${season}`,"roles","playerTwo")),`S${season}: Daniel must not read Nik unpublished result before Nik publishes`);
      results=await Results.publishResult({...b(offset+900),seasonNumber:season,operationId:op("season_result_op_",season*10+2),baseRevision:1,result:resultFor("playerTwo",season)});assert.equal(results.ok,true,JSON.stringify(results));assert.equal(results.state.phase,"RESULTS_READY");await assertSucceeds(getDoc(doc(dbB,"rivalries",R1,"seasonResults",`season_${season}`,"roles","playerOne")));await assertSucceeds(getDoc(doc(dbA,"rivalries",R1,"seasonResults",`season_${season}`,"roles","playerTwo")));
    }
    const commitOperationId=op("season_commit_op_",season*10+1);
    let commit=await Commit.commitSeason({...a(offset+1000),seasonNumber:season,operationId:commitOperationId,baseRevision:0});assert.equal(commit.ok,true,JSON.stringify(commit));
    if(season===1){
      const commitRef=doc(dbA,"rivalries",R1,"seasonCommits","season_1");
      const beforeRetry=(await assertSucceeds(getDoc(commitRef))).data();
      const replay=await Commit.commitSeason({...a(offset+1000),seasonNumber:season,operationId:commitOperationId,baseRevision:0});
      assert.equal(replay.ok,true,JSON.stringify(replay));assert.equal(replay.replayed,true,"Same operationId/baseRevision must replay idempotently");assert.equal(replay.revision,1);
      const afterRetry=(await assertSucceeds(getDoc(commitRef))).data();
      assert.deepEqual(afterRetry,beforeRetry,"Idempotent retry must not change the stored season commit");
    }
    commit=await Commit.acknowledgeSeason({...b(offset+1100),seasonNumber:season,operationId:op("season_commit_op_",season*10+2),baseRevision:1});assert.equal(commit.ok,true,JSON.stringify(commit));
    commit=await Commit.acknowledgeSeason({...a(offset+1200),seasonNumber:season,operationId:op("season_commit_op_",season*10+3),baseRevision:2});assert.equal(commit.ok,true,JSON.stringify(commit));assert.equal(commit.phase,"ACKNOWLEDGED");if(season===1)await assertStrangerDenied(env,dbA,dbB,"after season 1 commit");

    const scoreA=await Scoring.read({...a(offset+1300),seasonNumber:season,teamCount:20}),scoreB=await Scoring.read({...b(offset+1300),seasonNumber:season,teamCount:20});assert.deepEqual(scoreA.scoring,scoreB.scoring,`S${season} scoring must converge`);assert.equal(scoreA.scoring.playerOne.total,expectedScore("playerOne",season));assert.equal(scoreA.scoring.playerTwo.total,expectedScore("playerTwo",season));assert.equal(scoreA.winner,expectedWinner(season));totals.playerOne+=scoreA.scoring.playerOne.total;totals.playerTwo+=scoreA.scoring.playerTwo.total;
    lastHistory=await History.read({...a(offset+1400),throughSeason:season});const historyB=await History.read({...b(offset+1400),throughSeason:season});assert.deepEqual(lastHistory.projection,historyB.projection,`S${season} history must converge`);assert.equal(lastHistory.projection.seasonHistory.length,season);if(season===1)assert.equal(lastHistory.projection.seasonHistory.filter(item=>item.roundNumber===1).length,1,"Idempotent retry must leave exactly one season 1 history row");
    lastMulti=await Multi.read(a(offset+1500));const multiB=await Multi.read(b(offset+1500));assert.deepEqual(lastMulti.state,multiB.state,`S${season} progression must converge`);
  }

  const finalA=Final.reconcile({sharedActive:true,multiSeason:lastMulti,history:lastHistory,localReconciliation:localAuthority("playerOne")});
  const finalB=Final.reconcile({sharedActive:true,multiSeason:lastMulti,history:lastHistory,localReconciliation:localAuthority("playerTwo")});
  assert.deepEqual(finalA,finalB,"Both managers must derive the same final Showdown");assert.deepEqual(finalA.managerTotals,totals);assert.equal(finalA.phase,"FINAL_SEASON_RECONCILED");
  const intent=Terminal.prepare(finalA,{sessionId:sid});
  const closed=await TerminalProvider.close({...a(TOTAL_SEASONS*10000+2000),intent});assert.equal(closed.ok,true,JSON.stringify(closed));assert.equal(closed.rivalryState,"closed");assert.equal(closed.sessionState,"closed");
  const rootA=await assertSucceeds(getDoc(doc(dbA,"rivalries",R1))),rootB=await assertSucceeds(getDoc(doc(dbB,"rivalries",R1)));assert.deepEqual(rootA.data().data.terminalClose,rootB.data().data.terminalClose);assert.equal(rootA.data().data.connectionState,"closed");await assertStrangerDenied(env,dbA,dbB,"after Terminal Close");
  return {now,dbA,dbB,finalA};
}

(async()=>{const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});try{await env.clearFirestore();const main=await playMainJourney(env);await runSecondShowdownAndAbandon(env,main);process.stdout.write(`PASS two-manager journey Sections A-G (${TOTAL_SEASONS} season${TOTAL_SEASONS===1?"":"s"} main${ROTATE_SEASON?`, session expired and re-joined in season ${ROTATE_SEASON}`:""}): main journey, stranger denial, privacy, idempotent retry, simultaneous taps, second Showdown, completed-only reads of closed Showdowns, and persistent-provider abandon all proved.\n`);}finally{await env.cleanup();}})().catch(error=>{console.error(error.stack||error);process.exit(1);});

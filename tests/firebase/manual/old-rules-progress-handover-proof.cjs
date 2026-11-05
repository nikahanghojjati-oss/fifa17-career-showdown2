// Rules headroom (r89), manual proof, not part of CI: Terminal Progress records written by the real r87 (2.0.0) and r88
// (2.1.0) Rules advance and close on the current Rules, and a season after a sacked one is still refused. It reuses the
// Sacked emulator's helpers (this file is that suite with its runner replaced).
//   git worktree add /tmp/wt-r87 00ae2b72 && git worktree add /tmp/wt-r88 ae808444
//   (cd /tmp/wt-r87 && node scripts/build-production-firestore-rules.mjs && node scripts/build-production-firestore-rules-with-persistent-pair.mjs)
//   (same for /tmp/wt-r88; expected sha256 4520bfda... and 3c0e2e3e...)
//   OLD_RULES_R87=/tmp/wt-r87/firestore.spark.generated.rules OLD_RULES_R88=/tmp/wt-r88/firestore.spark.generated.rules \
//     npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-old-records "node tests/firebase/manual/old-rules-progress-handover-proof.cjs"
"use strict";
// r89 Sacked (Nik 2026-11-03) in the composed production Rules (firestore.spark.generated.rules).
// Nik's rule: on Season Results either manager may tick "I was sacked" for himself. Any sacking ends the Showdown after
// that season; the points so far decide (equal = DRAW) and it counts everywhere as a COMPLETED Showdown.
// Storage: the private result carries `sacked` only when that manager was sacked, and then exactly `true` (sparse key).
// The Terminal Progress records sacked:{playerOne,playerTwo} for the season that had a sacking; nothing is accepted after it,
// and the close then carries endedBy:'sacked', the same map and completedSeason = that season.
// Proven here:
//   1. Season Results: sacked:true is accepted (real provider, beside EL); false, "true", 1 and null are refused.
//      Season Commit binds the key: dropping it or adding it against the private result is refused.
//   2. Transfer War: the first roulette mark of the season after a sacked season is refused (START needs both marks); the
//      control, the same commit without the key, marks and starts.
//   3. Terminal Close, a 3-season Showdown with Nik sacked in season 2: progress without the map, with a wrong map, or a
//      map on a season with no sacking is refused; the exact map is accepted; season 3 is never accepted after it; a
//      full-length close, a sacked close with a wrong map or a wrong completedSeason are refused; the provider closes it as
//      endedBy 'sacked' after 2 seasons; completed reads give seasons 1-2 and refuse season 3; the career summary create
//      binds the witness. Also both managers sacked in season 1 of 1 (full length, no endedBy needed: the Golden case) and
//      Daniel sacked in season 1 of 10.
//   4. Every write stays under the 1,000-expression limit (every refusal is an ordinary permission-denied).
// Run inside the Firestore emulator (after both Rules build steps, as the deploy runs them):
//   node scripts/build-production-firestore-rules.mjs && node scripts/build-production-firestore-rules-with-persistent-pair.mjs
//   npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-sacked-rules \
//     "node tests/firebase/sacked-rules-emulator.cjs"
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,getDoc,setDoc,serverTimestamp,writeBatch}=firestoreSdk;
const {initializeTestEnvironment,assertSucceeds}=require("@firebase/rules-unit-testing");

global.window=globalThis;
require("../../../data/transferOptions.js");
const Setup=require("../../../js/sparkSharedShowdownSetup.js");
const Career=require("../../../js/sparkSharedCareerStart.js");
const Transfer=require("../../../js/sparkSharedTransferChallenge.js");
const Results=require("../../../js/sparkSharedSeasonResults.js");
const Commit=require("../../../js/sparkSharedSeasonCommit.js");
const Terminal=require("../../../js/sharedTerminalClose.js");
const Provider=require("../../../js/sparkTerminalClose.js");
const Sessions=require("../../../js/sparkPrivateSession.js");

const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const LIMIT=/maximum of 1000 expressions/;
// A refused rivalry close made before any Terminal Progress exists also falls through to the redeem branch of the rivalry's
// update rule (it is only skipped once 'terminalProgress' is present), which can reach the 1,000-expression limit: still a
// refusal (permission-denied), but not a plain one. To show the END SHOWDOWN rule itself refuses, those cases are run again
// on a test-only copy whose redeem branch is skipped for closing writes (redeem only ever writes 'active').
const REDEEM_BRANCH="|| (!('terminalProgress' in request.resource.data.data) && validRivalryRedeem())";
const RULES_REDEEM_GATED=RULES.replace(REDEEM_BRANCH,"|| (request.resource.data.data.connectionState == 'active' && !('terminalProgress' in request.resource.data.data) && validRivalryRedeem())");
async function assertDenied(promise,label){
  let error=null;
  try{await promise;}catch(caught){error=caught;}
  assert.ok(error,`${label}: must be refused`);
  assert.equal(error.code,"permission-denied",`${label}: expected permission-denied, got ${error.code}: ${error.message}`);
}
const PROJECT="demo-cms-sacked-rules";
let projectSeq=0;
const nextProject=label=>`${PROJECT}-${label}-${projectSeq++}`;
function op(prefix,n){return prefix+Number(n).toString(16).padStart(32,"0");}
const hex64=seed=>crypto.createHash("sha256").update(String(seed)).digest("hex");

async function assertPlainDenial(promise,label){
  let error=null;
  try{await promise;}catch(caught){error=caught;}
  assert.ok(error,`${label}: must be refused`);
  assert.equal(error.code,"permission-denied",`${label}: expected permission-denied, got ${error.code}: ${error.message}`);
  assert.doesNotMatch(String(error.message||""),LIMIT,`${label}: refused by the Rules evaluation limit, not by the Rules`);
}
async function assertAccepted(promise,label){
  try{return await promise;}
  catch(error){throw new assert.AssertionError({message:`${label}: must be accepted, got ${error.code}: ${String(error.message||"").trim().split("\n")[0]}`});}
}

// ---------------------------------------------------------------------------------------------------------------
// 1 + 2. Season Results, Season Commit and the next Transfer War START (rivalry built by the real providers).
// ---------------------------------------------------------------------------------------------------------------
const A="acct_sacked_daniel",B="acct_sacked_nik";// playerOne = Daniel (coordinator), playerTwo = Nik
const RID=`pair_${"6".repeat(64)}`;
const SID=`session_${"e".repeat(64)}`;
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`;
function plainSdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp};}
// Swaps the result inside the private role document the provider writes, so the Rules alone judge a bad value.
function injectingSdk(result){
  return {Timestamp,doc,serverTimestamp,runTransaction:(db,callback)=>firestoreSdk.runTransaction(db,transaction=>callback(new Proxy(transaction,{
    get(target,property){
      if(property==="set")return (ref,data,...rest)=>{
        if(/\/seasonResults\/season_[0-9]+\/roles\/(playerOne|playerTwo)$/.test(ref.path))data={...data,result:JSON.parse(JSON.stringify(result))};
        return target.set(ref,data,...rest);
      };
      const value=target[property];
      return typeof value==="function"?value.bind(target):value;
    }
  })))};
}
function account(id){return {objectType:"account",objectId:id,lifecycleState:"live",data:{status:"active"}};}
function device(id){return {objectType:"device",objectId:id,lifecycleState:"live",data:{deviceId:id,state:"active"}};}
function rivalryDoc(){return {objectType:"rivalry",objectId:RID,lifecycleState:"live",data:{connectionState:"active",authorizedAccountIds:[A,B],managerSlots:[
  {slotId:"playerOne",accountId:A,profileId:`profile_${"1".repeat(24)}`,saveId:`save_${"3".repeat(24)}`,entitlementState:"active"},
  {slotId:"playerTwo",accountId:B,profileId:`profile_${"2".repeat(24)}`,saveId:`save_${"4".repeat(24)}`,entitlementState:"active"}
]}};}
function sessionDoc(now){
  const createdAt=Timestamp.fromMillis(now-60_000),lastActivityAt=Timestamp.fromMillis(now-1_000),expiresAt=Timestamp.fromMillis(now+4*60*60*1000);
  return {schemaVersion:1,objectType:"session",objectId:SID,revision:1,parentRevision:0,lifecycleState:"live",contentHash:`sha256:${"0".repeat(64)}`,priorContentHash:`sha256:${"1".repeat(64)}`,updatedAt:lastActivityAt,updatedByAccountId:A,updatedByDeviceId:DA,data:{rivalryId:RID,state:"active",hostAccountId:A,memberAccountIds:[A,B],createdAt,expiresAt,lastActivityAt,revokedAt:null},tombstone:null};
}
function base(db,uid,deviceId,now,sdk=plainSdk()){return {user:{uid},firestore:db,firebaseSdk:sdk,rivalryId:RID,sessionId:SID,deviceId,nowEpochMs:now,cryptoImpl:crypto.webcrypto};}
const DANIEL={leaguePosition:1,leaguePoints:102,leagueGoals:92,domesticCup:true,championsLeague:false,topScorer:true,topAssist:false};
const NIK_SACKED={leaguePosition:17,leaguePoints:31,leagueGoals:28,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false,europaLeague:true,sacked:true};

async function prepareJourney(env,now){
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    await setDoc(doc(db,"accounts",A),account(A));await setDoc(doc(db,"accounts",B),account(B));
    await setDoc(doc(db,"accounts",A,"devices",DA),device(DA));await setDoc(doc(db,"accounts",B,"devices",DB),device(DB));
    await setDoc(doc(db,"rivalries",RID),rivalryDoc());await setDoc(doc(db,"rivalries",RID,"sessions",SID),sessionDoc(now));
  });
  const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
  const a=t=>base(dbA,A,DA,now+t),b=t=>base(dbB,B,DB,now+t);
  const must=(label,value)=>{if(!value||!value.ok)throw new Error(`${label} failed: ${JSON.stringify(value)}`);};
  for(const [type,baseRevision,n,extra] of [["open",0,1,{}],["commit-league",1,2,{}],["commit-clubs",2,3,{}],["commit-length",3,4,{totalSeasons:3}]])must(`setup ${type}`,await Setup.mutate({...a(n*10),type,baseRevision,operationId:op("setup_op_",n),...extra}));
  must("setup confirm A",await Setup.mutate({...a(50),type:"confirm",baseRevision:4,operationId:op("setup_op_",5)}));
  must("setup confirm B",await Setup.mutate({...b(60),type:"confirm",baseRevision:5,operationId:op("setup_op_",6)}));
  must("career A",await Career.acknowledge({...a(70),operationId:op("career_start_op_",1),baseRevision:0}));
  must("career B",await Career.acknowledge({...b(80),operationId:op("career_start_op_",2),baseRevision:1}));
  for(const role of ["playerOne","playerTwo"])must(`spun ${role}`,await Transfer.markSpun({...(role==="playerOne"?a(90):b(90)),seasonNumber:1,managerRole:role}));
  must("transfer start",await Transfer.startWindow({...a(100),seasonNumber:1,operationId:op("transfer_op_",11),baseRevision:0}));
  must("transfer end A",await Transfer.requestEndWindow({...a(200),seasonNumber:1,operationId:op("transfer_op_",12),baseRevision:1}));
  must("transfer end B",await Transfer.requestEndWindow({...b(300),seasonNumber:1,operationId:op("transfer_op_",13),baseRevision:2}));
  must("guess A",await Transfer.lockGuesses({...a(400),seasonNumber:1,operationId:op("transfer_op_",14),baseRevision:3,guesses:[{slot:1,type:"league",valueId:"england-premier-league"},{slot:2,type:"nationality",valueId:"brazil"}]}));
  must("guess B",await Transfer.lockGuesses({...b(500),seasonNumber:1,operationId:op("transfer_op_",15),baseRevision:4,guesses:[{slot:1,type:"league",valueId:"spain-primera-division"},{slot:2,type:"nationality",valueId:"germany"}]}));
  must("signing A",await Transfer.lockSignings({...a(600),seasonNumber:1,operationId:op("transfer_op_",16),baseRevision:5,signings:[{slot:1,name:"Daniel Sacked",leagueId:"spain-primera-division",nationalityId:"england"}]}));
  must("signing B",await Transfer.lockSignings({...b(700),seasonNumber:1,operationId:op("transfer_op_",17),baseRevision:6,signings:[{slot:1,name:"Nik Sacked",leagueId:"england-premier-league",nationalityId:"brazil"}]}));
  return {dbA,dbB,a,b,must};
}

async function seasonResultsCommitAndTransfer(){
  const env=await initializeTestEnvironment({projectId:nextProject("results"),firestore:{rules:RULES}});
  const checks=[];
  try{
    const now=Date.now(),{dbA,dbB,a,b,must}=await prepareJourney(env,now);
    const publicRef=db=>doc(db,"rivalries",RID,"seasonResults","season_1");
    let n=20;
    const publishAs=(db,uid,deviceId,result,baseRevision,t,inject)=>Results.publishResult({...base(db,uid,deviceId,now+t,inject?injectingSdk(result):plainSdk()),seasonNumber:1,operationId:op("season_result_op_",n++),baseRevision,result:inject?DANIEL:result});

    for(const [label,value] of [["sacked false",false],["sacked as the string \"true\"","true"],["sacked as the number 1",1],["sacked null",null]]){
      const out=await publishAs(dbB,B,DB,{...NIK_SACKED,sacked:value},0,800,true);
      assert.equal(out.ok,false,`${label}: ${JSON.stringify(out)}`);
      assert.equal(out.code,"permission-denied",`${label}: expected a Rules denial, got ${JSON.stringify(out)}`);
      assert.equal((await getDoc(publicRef(dbB))).exists(),false,`${label}: nothing may be written`);
      checks.push(`Season Results: ${label} is refused (only true is ever stored)`);
    }
    const first=await publishAs(dbB,B,DB,NIK_SACKED,0,900,false);
    assert.equal(first.ok,true,`Nik's sacked result (real provider): ${JSON.stringify(first)}`);
    const second=await publishAs(dbA,A,DA,DANIEL,1,1000,false);
    assert.equal(second.ok,true,`Daniel's plain result: ${JSON.stringify(second)}`);
    let storedOne,storedTwo;
    await env.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      storedOne=(await getDoc(doc(db,"rivalries",RID,"seasonResults","season_1","roles","playerOne"))).data().result;
      storedTwo=(await getDoc(doc(db,"rivalries",RID,"seasonResults","season_1","roles","playerTwo"))).data().result;
    });
    assert.deepEqual(storedTwo,NIK_SACKED);assert.equal("sacked" in storedOne,false);
    checks.push("Season Results: Nik's own sacked:true (beside an EL win) is accepted through the real provider; Daniel's plain result has no sacked key");

    const commitRef=season=>doc(dbA,"rivalries",RID,"seasonCommits",`season_${season}`);
    const forged=(results,k)=>({schemaVersion:1,objectType:"sharedSeasonCommit",rivalryId:RID,seasonNumber:1,runtimeRevision:"1.9.1-r10",phase:"COMMITTED",revision:1,resultsRevision:2,results,acknowledgedRoles:[],operationIds:[op("season_commit_op_",k)],operationHashes:[`sha256:${hex64(`sacked-${k}`)}`],baseRevisions:[0],actorRoles:["playerOne"],activeSessionId:SID,updatedAt:serverTimestamp(),updatedByDeviceId:DA});
    const {sacked:_drop,...nikPlain}=storedTwo;
    await assertPlainDenial(setDoc(commitRef(1),forged({playerOne:storedOne,playerTwo:nikPlain},1)),"a commit that drops Nik's sacked key");
    await assertPlainDenial(setDoc(commitRef(1),forged({playerOne:{...storedOne,sacked:true},playerTwo:storedTwo},2)),"a commit that sacks Daniel too");
    checks.push("Season Commit: dropping the sacked key, or adding one the manager never ticked, is refused");
    let commit=await Commit.commitSeason({...a(1100),seasonNumber:1,operationId:op("season_commit_op_",11),baseRevision:0});
    assert.equal(commit.ok,true,`commit: ${JSON.stringify(commit)}`);
    commit=await Commit.acknowledgeSeason({...b(1200),seasonNumber:1,operationId:op("season_commit_op_",12),baseRevision:1});
    assert.equal(commit.ok,true,`Nik acknowledges: ${JSON.stringify(commit)}`);
    commit=await Commit.acknowledgeSeason({...a(1300),seasonNumber:1,operationId:op("season_commit_op_",13),baseRevision:2});
    assert.equal(commit.ok,true,`Daniel acknowledges: ${JSON.stringify(commit)}`);
    const stored=(await getDoc(commitRef(1))).data();
    assert.equal(stored.phase,"ACKNOWLEDGED");assert.deepEqual(stored.results,{playerOne:DANIEL,playerTwo:NIK_SACKED});
    checks.push("Season Commit: the real commit and both acknowledgements carry Nik's sacked:true exactly");

    // 2. Transfer War for season 2 never opens after a sacked season: the first roulette mark of season 2 is refused (START
    // needs both marks). Control: the same commit without the key lets both marks and START through.
    const refusedMark=await Transfer.markSpun({...a(1400),seasonNumber:2,managerRole:"playerOne"});
    assert.equal(refusedMark.ok,false,`season 2 first mark after a sacking must be refused: ${JSON.stringify(refusedMark)}`);
    assert.equal(refusedMark.code,"permission-denied",`season 2 first mark: expected a Rules denial, got ${JSON.stringify(refusedMark)}`);
    const refusedNik=await Transfer.markSpun({...b(1400),seasonNumber:2,managerRole:"playerTwo"});
    assert.equal(refusedNik.ok,false,`season 2 first mark by Nik after a sacking must be refused: ${JSON.stringify(refusedNik)}`);
    assert.equal((await getDoc(doc(dbA,"rivalries",RID,"transferChallenges","season_2"))).exists(),false,"no season 2 Transfer War document exists");
    checks.push("Transfer War: after a season with a sacking, neither manager can write the first roulette mark of season 2, so no season 2 window can open");
    await env.withSecurityRulesDisabled(async context=>{await setDoc(doc(context.firestore(),"rivalries",RID,"seasonCommits","season_1"),{...stored,results:{playerOne:DANIEL,playerTwo:nikPlain}});});
    for(const role of ["playerOne","playerTwo"])must(`control: season 2 mark ${role}`,await Transfer.markSpun({...(role==="playerOne"?a(1500):b(1500)),seasonNumber:2,managerRole:role}));
    must("control: season 2 START with the same commit minus the sacked key",await Transfer.startWindow({...a(1600),seasonNumber:2,operationId:op("transfer_op_",22),baseRevision:0}));
    checks.push("Transfer War control: the same acknowledged commit without the sacked key lets both marks and START through");
  }finally{await env.cleanup();}
  return checks;
}

// ---------------------------------------------------------------------------------------------------------------
// 3. Terminal Close (envelope documents, as the r18 Terminal Close matrix builds them).
// ---------------------------------------------------------------------------------------------------------------
const uid1="terminal_host",uid2="terminal_peer";
const device1=`device_${"1".repeat(32)}`,device2=`device_${"2".repeat(32)}`;
function canonical(value){if(value===undefined||value===null)return null;if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};if(Array.isArray(value))return value.map(canonical);if(typeof value==="object"){const out={};for(const key of Object.keys(value).sort())out[key]=canonical(value[key]);return out;}return value;}
async function digest(value){const hash=await crypto.webcrypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(canonical(value))));return `sha256:${Buffer.from(hash).toString("hex")}`;}
async function envelope(objectType,objectId,revision,data,{accountId=uid1,deviceId=device1,updatedAt=Timestamp.fromMillis(Date.now()),priorHash=null}={}){return {schemaVersion:1,objectType,objectId,revision,parentRevision:revision===0?null:revision-1,lifecycleState:"live",contentHash:await digest({objectType,objectId,revision,data}),priorContentHash:revision===0?null:(priorHash||`sha256:${"0".repeat(64)}`),updatedAt,updatedByAccountId:accountId,updatedByDeviceId:deviceId,data,tombstone:null};}
async function envelopeAccount(uid){const now=Timestamp.fromMillis(Date.now());return envelope("account",uid,0,{status:"active",createdAt:now,deletionRequestedAt:null},{accountId:uid,deviceId:null,updatedAt:now});}
async function envelopeDevice(uid,id,seed){const now=Timestamp.fromMillis(Date.now());return envelope("device",id,0,{deviceId:id,installationId:`installation_${seed.repeat(32).slice(0,32)}`,displayLabel:null,state:"active",registeredAt:now,lastSeenAt:now,revokedAt:null},{accountId:uid,deviceId:id,updatedAt:now});}
async function envelopeRivalry(id){const now=Timestamp.fromMillis(Date.now()-60_000);return envelope("rivalry",id,2,{connectionState:"active",connectionStateBeforeDeletion:null,managerSlots:[{slotId:"playerOne",accountId:uid1,profileId:`profile_${"4".repeat(24)}`,saveId:`save_${"6".repeat(24)}`,displayLabel:"Manager One",entitlementState:"active",deletionConsent:false},{slotId:"playerTwo",accountId:uid2,profileId:`profile_${"5".repeat(24)}`,saveId:`save_${"7".repeat(24)}`,displayLabel:"Manager Two",entitlementState:"active",deletionConsent:false}],authorizedAccountIds:[uid1,uid2],createdByAccountId:uid1,createdAt:now},{updatedAt:now});}
async function envelopeSession(id,sid){const createdAt=Timestamp.fromMillis(Date.now()-120_000),lastActivityAt=Timestamp.fromMillis(Date.now()-10_000);return Sessions.buildEnvelope({sessionId:sid,revision:5,parentRevision:4,priorContentHash:`sha256:${"2".repeat(64)}`,updatedAt:lastActivityAt,accountId:uid2,deviceId:device2,data:{createdAt,expiresAt:Timestamp.fromMillis(Date.now()+20*60_000),hostAccountId:uid1,lastActivityAt,memberAccountIds:[uid1,uid2],revokedAt:null,rivalryId:id,state:"active"},cryptoImpl:crypto.webcrypto});}
function result(overrides={}){return {leaguePosition:2,leaguePoints:80,leagueGoals:70,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false,...overrides};}
function score(value){return (Number.isInteger(value.primePack)?value.primePack:0)+(value.championsLeague===true?5:0)+(value.europaLeague===true?3:0)+(value.leaguePosition===1?3:0)+(value.domesticCup===true?1:0)+((value.leaguePoints>=100||value.leagueGoals>=100)?1:0)+((value.topScorer===true||value.topAssist===true)?1:0);}
function sdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction};}
function sackedMap(one,two){return {playerOne:one.sacked===true,playerTwo:two.sacked===true};}
// The Final Reconciliation projection the app builds (completedSeason = the seasons played; endedBy only when short).
function projection(id,totalSeasons,played,managerTotals,sacked){return {schemaVersion:1,runtimeRevision:"1.9.1-r17",phase:"FINAL_SEASON_RECONCILED",rivalryId:id,leagueId:"premier-league",totalSeasons,acceptedSeasons:played,completedSeason:played,acceptedRevisionKey:Array.from({length:played},(_,i)=>`${i+1}:2:sha256:${hex64(i)}`).join("|"),fixedClubs:{playerOne:"Arsenal",playerTwo:"Chelsea"},managerTotals,winner:managerTotals.playerOne>managerTotals.playerTwo?"playerOne":managerTotals.playerTwo>managerTotals.playerOne?"playerTwo":"draw",terminal:true,finalSeasonReconciled:true,nextSeason:null,extraSeasonAllowed:false,terminalCloseRequired:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false,...(sacked?{endedBy:"sacked",sacked}:{})};}

async function seedTerminal(env,id,sid,totalSeasons,seasons){
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    for(const uid of [uid1,uid2])await setDoc(doc(db,"accounts",uid),await envelopeAccount(uid));
    await setDoc(doc(db,"accounts",uid1,"devices",device1),await envelopeDevice(uid1,device1,"1"));await setDoc(doc(db,"accounts",uid2,"devices",device2),await envelopeDevice(uid2,device2,"2"));
    await setDoc(doc(db,"rivalries",id),await envelopeRivalry(id));
    for(const [uid,role,managerId,deviceId] of [[uid1,"playerOne","daniel",device1],[uid2,"playerTwo","nik",device2]]){const at=Timestamp.fromMillis(Date.now()-80_000);await setDoc(doc(db,"accounts",uid,"pairLinks","current"),await envelope("pairLink","current",0,{rivalryId:id,managerRole:role,managerId,linkedAt:at,lastConfirmedAt:at},{accountId:uid,deviceId,updatedAt:at}));}
    await setDoc(doc(db,"rivalries",id,"sharedSetup","authoritative"),{schemaVersion:1,objectType:"sharedSetupLedger",rivalryId:id,revision:6,phase:"SHOWDOWN_CONFIRMED",coordinatorRole:"playerOne",totalSeasons,confirmedRoles:["playerOne","playerTwo"]});
    await setDoc(doc(db,"rivalries",id,"sessions",sid),await envelopeSession(id,sid));
    for(let i=0;i<seasons.length;i++)await setDoc(doc(db,"rivalries",id,"seasonCommits",`season_${i+1}`),{schemaVersion:1,objectType:"sharedSeasonCommit",rivalryId:id,seasonNumber:i+1,runtimeRevision:"1.9.1-r10",phase:"ACKNOWLEDGED",revision:3,results:{playerOne:seasons[i][0],playerTwo:seasons[i][1]},acknowledgedRoles:["playerOne","playerTwo"]});
  });
}
// The exact rivalry write stcAdvanceProgress makes for the next season; `extra` adds (or, with sacked:undefined, omits) keys.
async function progressWrite(prior,totalSeasons,managerTotals,extra={}){
  const before=prior.data.terminalProgress,season=before?before.acceptedThroughSeason+1:1;
  const terminalProgress={schemaVersion:1,runtimeRevision:"1.9.1-r18",totalSeasons,acceptedThroughSeason:season,managerTotals,closedSessionRevision:null,...extra};
  for(const key of Object.keys(terminalProgress))if(terminalProgress[key]===undefined)delete terminalProgress[key];
  return envelope("rivalry",prior.objectId,prior.revision+1,{...prior.data,terminalProgress},{priorHash:prior.contentHash});
}
// The END SHOWDOWN write (pairAbandonCurrentShowdown): the rivalry closed, optionally with the ended-early mark, by uid's own device.
async function abandonWrite(prior,uid,endedEarly){
  const data={...prior.data,connectionState:"closed",...(endedEarly?{endedEarly}:{})};
  return envelope("rivalry",prior.objectId,prior.revision+1,data,{accountId:uid,deviceId:uid===uid1?device1:device2,priorHash:prior.contentHash});
}
// What stcFinalize writes in one commit (session + rivalry).
async function finalClose(id,sid,rivalryPrior,sessionPrior,intent){
  const now=Timestamp.fromMillis(Date.now());
  const nextSession=await Sessions.buildEnvelope({sessionId:sid,revision:sessionPrior.revision+1,parentRevision:sessionPrior.revision,priorContentHash:sessionPrior.contentHash,updatedAt:now,accountId:uid1,deviceId:device1,data:{...sessionPrior.data,state:"closed",lastActivityAt:now,revokedAt:null},cryptoImpl:crypto.webcrypto});
  const data={...rivalryPrior.data,connectionState:"closed",terminalProgress:{...rivalryPrior.data.terminalProgress,closedSessionRevision:nextSession.revision},terminalClose:JSON.parse(JSON.stringify(intent))};
  return {session:nextSession,rivalry:await envelope("rivalry",id,rivalryPrior.revision+1,data,{updatedAt:now,priorHash:rivalryPrior.contentHash})};
}

async function terminalClose(){
  const checks=[];
  // 3a. 3 seasons, Nik sacked in season 2 (Daniel ahead): ends after season 2 of 3.
  {
    const env=await initializeTestEnvironment({projectId:nextProject("terminal3"),firestore:{rules:RULES}});
    const id=`pair_${"a".repeat(64)}`,sid=`session_${"b".repeat(64)}`;
    try{
      const seasons=[[result({championsLeague:true}),result({domesticCup:true})],[result({leaguePosition:1}),result({leaguePosition:18,sacked:true})],[result(),result()]];
      await seedTerminal(env,id,sid,3,seasons);
      const host=env.authenticatedContext(uid1).firestore(),peer=env.authenticatedContext(uid2).firestore();
      const rivalryRef=doc(host,"rivalries",id),sessionRef=doc(host,"rivalries",id,"sessions",sid);
      const read=async()=>(await assertSucceeds(getDoc(rivalryRef))).data();
      // Season 1 (no sacking): a sacked map is refused, the plain progress is accepted.
      let prior=await read();
      const s1={playerOne:score(seasons[0][0]),playerTwo:score(seasons[0][1])};
      await assertPlainDenial(setDoc(rivalryRef,await progressWrite(prior,3,s1,{sacked:{playerOne:false,playerTwo:true}})),"season 1 progress with a sacked map although nobody was sacked");
      await assertAccepted(setDoc(rivalryRef,await progressWrite(prior,3,s1)),"season 1 plain progress");
      checks.push("progress: a sacked map on a season with no sacking is refused; the plain progress is accepted");
      // Season 2 (Nik sacked): no map, a wrong map, or a non-bool map is refused; the exact map is accepted.
      prior=await read();
      const s2={playerOne:s1.playerOne+score(seasons[1][0]),playerTwo:s1.playerTwo+score(seasons[1][1])};
      await assertPlainDenial(setDoc(rivalryRef,await progressWrite(prior,3,s2)),"season 2 progress without the sacked map");
      await assertPlainDenial(setDoc(rivalryRef,await progressWrite(prior,3,s2,{sacked:{playerOne:true,playerTwo:true}})),"season 2 progress that sacks Daniel too");
      await assertPlainDenial(setDoc(rivalryRef,await progressWrite(prior,3,s2,{sacked:{playerOne:false,playerTwo:"yes"}})),"season 2 progress with a non-bool map");
      await assertPlainDenial(setDoc(rivalryRef,await progressWrite(prior,3,s2,{sacked:{playerTwo:true}})),"season 2 progress with a half map");
      await assertAccepted(setDoc(rivalryRef,await progressWrite(prior,3,s2,{sacked:{playerOne:false,playerTwo:true}})),"season 2 progress with the exact sacked map");
      checks.push("progress: the sacked season needs the exact map (missing, wrong, half or non-bool maps are refused)");
      // Season 3 is never accepted after a sacking, with or without the map.
      prior=await read();
      const s3={playerOne:s2.playerOne+score(seasons[2][0]),playerTwo:s2.playerTwo+score(seasons[2][1])};
      await assertPlainDenial(setDoc(rivalryRef,await progressWrite(prior,3,s3,{sacked:undefined})),"season 3 progress after a sacked season (map dropped)");
      await assertPlainDenial(setDoc(rivalryRef,await progressWrite(prior,3,s3)),"season 3 progress after a sacked season (map kept)");
      checks.push("progress: no season is accepted after the sacked season (map kept or dropped)");
      // Codex C3: once a sacked season is accepted, END SHOWDOWN can no longer end it early (with or without the mark, either manager).
      prior=await read();
      for(const [uid,label] of [[uid1,"Daniel"],[uid2,"Nik"]]){
        const db=uid===uid1?host:peer;
        await assertPlainDenial(setDoc(doc(db,"rivalries",id),await abandonWrite(prior,uid,{seasonsPlayed:2})),`${label} ends the sacked Showdown early (with the mark)`);
        await assertPlainDenial(setDoc(doc(db,"rivalries",id),await abandonWrite(prior,uid,null)),`${label} ends the sacked Showdown early (no mark)`);
      }
      checks.push("END SHOWDOWN: after the sacked season is accepted, neither manager can end it early (with or without the mark)");
      // Close: a full-length witness, a wrong map, a wrong completedSeason, or endedBy without a map is refused.
      prior=await read();const sessionPrior=(await assertSucceeds(getDoc(sessionRef))).data();
      const sackedNik={playerOne:false,playerTwo:true};
      const good=Terminal.prepare(projection(id,3,2,s2,sackedNik),{sessionId:sid});
      assert.equal(good.completedSeason,2);assert.equal(good.endedBy,"sacked");
      const fullLength={...Terminal.prepare(projection(id,3,3,s2,null),{sessionId:sid})};
      const bad=[
        ["a full-length close (completedSeason 3, no endedBy)",fullLength],
        ["a full-length close that keeps completedSeason 2 but drops endedBy",(()=>{const {endedBy:_e,sacked:_s,...rest}=good;return {...rest,completedSeason:2};})()],
        ["a sacked close with the wrong map",{...good,sacked:{playerOne:true,playerTwo:false}}],
        ["a sacked close with completedSeason 1",{...good,completedSeason:1}],
        ["a sacked close with completedSeason 3",{...good,completedSeason:3}],
        ["a close with endedBy but no map",(()=>{const {sacked:_s,...rest}=good;return rest;})()],
        ["a close with endedBy 'quit'",{...good,endedBy:"quit"}]
      ];
      for(const [label,intent] of bad){
        const w=await finalClose(id,sid,prior,sessionPrior,intent);
        await assertPlainDenial((()=>{const batch=writeBatch(host);batch.set(sessionRef,w.session);batch.set(rivalryRef,w.rivalry);return batch.commit();})(),label);
      }
      checks.push(`close: ${bad.length} wrong witnesses (full length, endedBy dropped, wrong map, wrong completedSeason, map missing, other endedBy) are refused`);
      const closed=await Provider.close({user:{uid:uid1},firestore:host,firebaseSdk:sdk(),rivalryId:id,sessionId:sid,deviceId:device1,intent:good,nowEpochMs:Date.now(),cryptoImpl:crypto.webcrypto});
      assert.equal(closed.ok,true,`the sacked close is accepted: ${JSON.stringify(closed)}`);assert.equal(closed.rivalryState,"closed");
      const after=(await assertSucceeds(getDoc(doc(peer,"rivalries",id)))).data();
      assert.equal(after.data.connectionState,"closed");assert.equal(after.data.terminalClose.endedBy,"sacked");assert.deepEqual(after.data.terminalClose.sacked,sackedNik);
      assert.equal(after.data.terminalClose.completedSeason,2);assert.equal(after.data.terminalClose.totalSeasons,3);assert.deepEqual(after.data.terminalClose.managerTotals,s2);
      const witnessRead=await Provider.read({user:{uid:uid2},firestore:peer,firebaseSdk:sdk(),rivalryId:id,deviceId:device2,cryptoImpl:crypto.webcrypto});
      assert.equal(witnessRead.ok,true,JSON.stringify(witnessRead));assert.equal(witnessRead.terminal,true);assert.equal(witnessRead.terminalWitness.endedBy,"sacked");
      checks.push(`close: the provider closes it as endedBy 'sacked' after 2 of 3 seasons (${s2.playerOne}-${s2.playerTwo}); the partner reads the same witness`);
      // Completed reads: seasons 1-2 are readable to the members, season 3 (never played) is not.
      for(const db of [host,peer])for(const season of [1,2])await assertAccepted(getDoc(doc(db,"rivalries",id,"seasonCommits",`season_${season}`)),`completed read of season ${season}`);
      for(const db of [host,peer])await assertPlainDenial(getDoc(doc(db,"rivalries",id,"seasonCommits","season_3")),"completed read of season 3 (never played)");
      checks.push("completed reads: seasons 1 and 2 are readable by both managers, season 3 is refused");
      // Career summary: the create binds to the witness (planned length 3, the totals and winner).
      const payload=JSON.stringify({status:"completed",rivalryId:id});
      const summary=extra=>({schemaVersion:1,objectType:"careerSummary",rivalryId:id,status:"completed",totalSeasons:3,managerTotals:s2,winner:after.data.terminalClose.winner,payload,payloadHash:`sha256:${hex64(payload)}`,...extra});
      await assertPlainDenial(setDoc(doc(peer,"accounts",uid2,"careerSummary",id),summary({totalSeasons:2})),"a career summary with the played count as totalSeasons");
      await assertAccepted(setDoc(doc(peer,"accounts",uid2,"careerSummary",id),summary({})),"the career summary of the sacked Showdown");
      checks.push("career summary: the create is accepted with the witness's planned length, totals and winner (a changed length is refused)");
    }finally{await env.cleanup();}
  }
  // 3b. 1 season, both managers sacked in it: full length (Golden is possible), endedBy is optional and both map bools true.
  {
    const env=await initializeTestEnvironment({projectId:nextProject("terminal1"),firestore:{rules:RULES}});
    const id=`pair_${"c".repeat(64)}`,sid=`session_${"d".repeat(64)}`;
    try{
      const seasons=[[result({leaguePosition:1,sacked:true}),result({leaguePosition:1,sacked:true})]];
      await seedTerminal(env,id,sid,1,seasons);
      const host=env.authenticatedContext(uid1).firestore(),peer=env.authenticatedContext(uid2).firestore();
      const totals={playerOne:score(seasons[0][0]),playerTwo:score(seasons[0][1])},both={playerOne:true,playerTwo:true};
      const intent=Terminal.prepare(projection(id,1,1,totals,both),{sessionId:sid});
      const closed=await Provider.close({user:{uid:uid1},firestore:host,firebaseSdk:sdk(),rivalryId:id,sessionId:sid,deviceId:device1,intent,nowEpochMs:Date.now(),cryptoImpl:crypto.webcrypto});
      assert.equal(closed.ok,true,`both sacked in season 1 of 1: ${JSON.stringify(closed)}`);
      const after=(await assertSucceeds(getDoc(doc(peer,"rivalries",id)))).data();
      assert.deepEqual(after.data.terminalProgress.sacked,both);assert.equal(after.data.terminalClose.completedSeason,1);assert.equal(after.data.terminalClose.winner,"draw");
      checks.push("both managers sacked in season 1 of 1: the close (full length, level = DRAW) is accepted with both bools true");
    }finally{await env.cleanup();}
  }
  // 3c. 10 seasons, Daniel sacked in season 1: ends after 1 of 10 through the provider, no write at the expression limit.
  {
    const env=await initializeTestEnvironment({projectId:nextProject("terminal10"),firestore:{rules:RULES}});
    const id=`pair_${"e".repeat(64)}`,sid=`session_${"f".repeat(64)}`;
    try{
      const max={leaguePosition:1,leaguePoints:104,leagueGoals:101,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true,primePack:4};
      const seasons=[[{...result({europaLeague:true}),sacked:true},max],...Array.from({length:9},()=>[max,max])];
      await seedTerminal(env,id,sid,10,seasons);
      const host=env.authenticatedContext(uid1).firestore();
      const totals={playerOne:score(seasons[0][0]),playerTwo:score(seasons[0][1])};
      const intent=Terminal.prepare(projection(id,10,1,totals,{playerOne:true,playerTwo:false}),{sessionId:sid});
      const closed=await Provider.close({user:{uid:uid1},firestore:host,firebaseSdk:sdk(),rivalryId:id,sessionId:sid,deviceId:device1,intent,nowEpochMs:Date.now(),cryptoImpl:crypto.webcrypto});
      assert.equal(closed.ok,true,`Daniel sacked in season 1 of 10: ${JSON.stringify(closed)}`);
      const after=(await assertSucceeds(getDoc(doc(host,"rivalries",id)))).data();
      assert.equal(after.data.terminalProgress.acceptedThroughSeason,1);assert.equal(after.data.terminalClose.completedSeason,1);assert.equal(after.data.terminalClose.totalSeasons,10);
      assert.deepEqual(after.data.terminalClose.managerTotals,{playerOne:3,playerTwo:15});assert.equal(after.data.terminalClose.winner,"playerTwo");
      checks.push("Daniel sacked in season 1 of 10 (EL beside the sacking, Nik at the 15 maximum): the provider closes after 1 of 10 (3-15)");
    }finally{await env.cleanup();}
  }
  // 3d. Control: a normal full-length 3-season close is unchanged (no map, no endedBy).
  {
    const env=await initializeTestEnvironment({projectId:nextProject("control"),firestore:{rules:RULES}});
    const id=`pair_${"9".repeat(64)}`,sid=`session_${"8".repeat(64)}`;
    try{
      const seasons=[[result({championsLeague:true}),result()],[result(),result({domesticCup:true})],[result({leaguePosition:1}),result()]];
      await seedTerminal(env,id,sid,3,seasons);
      const host=env.authenticatedContext(uid1).firestore();
      const totals={playerOne:seasons.reduce((n,[one])=>n+score(one),0),playerTwo:seasons.reduce((n,[,two])=>n+score(two),0)};
      const intent=Terminal.prepare(projection(id,3,3,totals,null),{sessionId:sid});
      assert.equal("endedBy" in intent,false);
      const closed=await Provider.close({user:{uid:uid1},firestore:host,firebaseSdk:sdk(),rivalryId:id,sessionId:sid,deviceId:device1,intent,nowEpochMs:Date.now(),cryptoImpl:crypto.webcrypto});
      assert.equal(closed.ok,true,`control close: ${JSON.stringify(closed)}`);
      const after=(await assertSucceeds(getDoc(doc(host,"rivalries",id)))).data();
      assert.equal("sacked" in after.data.terminalProgress,false);assert.equal("endedBy" in after.data.terminalClose,false);
      checks.push("control: a normal 3-season close is unchanged (no sacked map, no endedBy)");
    }finally{await env.cleanup();}
  }
  // 3e. Control: END SHOWDOWN still ends a Showdown early after an accepted season with no sacking (Ended early, as before),
  // and only with the exact accepted count (k = 1 here); a wrong, missing or null count is refused.
  {
    const env=await initializeTestEnvironment({projectId:nextProject("endearly"),firestore:{rules:RULES}});
    const id=`pair_${"7".repeat(64)}`,sid=`session_${"6".repeat(64)}`;
    try{
      const seasons=[[result({championsLeague:true}),result()]];
      await seedTerminal(env,id,sid,3,seasons);
      const host=env.authenticatedContext(uid1).firestore(),peer=env.authenticatedContext(uid2).firestore();
      let prior=(await assertSucceeds(getDoc(doc(host,"rivalries",id)))).data();
      await assertAccepted(setDoc(doc(host,"rivalries",id),await progressWrite(prior,3,{playerOne:score(seasons[0][0]),playerTwo:score(seasons[0][1])})),"season 1 plain progress");
      prior=(await assertSucceeds(getDoc(doc(peer,"rivalries",id)))).data();
      for(const [mark,label] of [[{seasonsPlayed:0},"0 (season 1 is accepted)"],[{seasonsPlayed:2},"2 (season 2 was never played)"],[{seasonsPlayed:null},"null"],[null,"no mark"]])
        await assertPlainDenial(setDoc(doc(peer,"rivalries",id),await abandonWrite(prior,uid2,mark)),`END with seasonsPlayed ${label}`);
      await assertAccepted(setDoc(doc(peer,"rivalries",id),await abandonWrite(prior,uid2,{seasonsPlayed:1})),"Nik ends a Showdown with no sacking early after season 1");
      checks.push("control: END SHOWDOWN still ends an unsacked Showdown early, only with the exact accepted count (0, 2, null or no mark are refused)");
    }finally{await env.cleanup();}
  }
  // 3f. Codex C3 re-check: the sacked season is ACKNOWLEDGED but Terminal Progress has not recorded it yet (absent, or covering
  // only the earlier unsacked season). END SHOWDOWN is refused for any count, so Settings hands the Showdown to Terminal Close.
  assert.ok(RULES.includes(REDEEM_BRANCH)&&RULES_REDEEM_GATED!==RULES,"the redeem branch is where this suite expects it");
  for(const [rules,gated] of [[RULES,false],[RULES_REDEEM_GATED,true]]){
    const env=await initializeTestEnvironment({projectId:nextProject(gated?"sackedgapplain":"sackedgap"),firestore:{rules}});
    const id=`pair_${"5".repeat(64)}`,sid=`session_${"4".repeat(64)}`;
    try{
      const seasons=[[result(),result({domesticCup:true})],[result({leaguePosition:1}),result({leaguePosition:18,sacked:true})]];
      await seedTerminal(env,id,sid,3,seasons);
      const host=env.authenticatedContext(uid1).firestore(),peer=env.authenticatedContext(uid2).firestore();
      const refuseAll=async(prior,stage,plain)=>{for(const [uid,db,who] of [[uid1,host,"Daniel"],[uid2,peer,"Nik"]])for(const [mark,label] of [[{seasonsPlayed:2},"2"],[{seasonsPlayed:1},"1"],[{seasonsPlayed:0},"0"],[{seasonsPlayed:null},"null"],[null,"no mark"]])
        await (plain?assertPlainDenial:assertDenied)(setDoc(doc(db,"rivalries",id),await abandonWrite(prior,uid,mark)),`${who} ends the sacked Showdown early (${stage}, seasonsPlayed ${label})`);};
      // Before any Terminal Progress exists, every refused closing write (this one too) also evaluates the redeem branch and
      // reaches the 1,000-expression limit (pre-existing; still permission-denied). On the real Rules the SDK log is silenced
      // for that stage so the composed gate sees the phrase only where a suite reaches it unexpectedly; the gated copy run
      // shows the same cases as plain refusals of the END SHOWDOWN rule.
      if(!gated)firestoreSdk.setLogLevel("silent");
      try{await refuseAll((await assertSucceeds(getDoc(doc(host,"rivalries",id)))).data(),"no Terminal Progress",gated);}
      finally{if(!gated)firestoreSdk.setLogLevel("warn");}
      const prior=(await assertSucceeds(getDoc(doc(host,"rivalries",id)))).data();
      await assertAccepted(setDoc(doc(host,"rivalries",id),await progressWrite(prior,3,{playerOne:score(seasons[0][0]),playerTwo:score(seasons[0][1])})),"season 1 plain progress");
      await refuseAll((await assertSucceeds(getDoc(doc(host,"rivalries",id)))).data(),"progress covers only season 1",true);
      checks.push(gated
        ?"END SHOWDOWN (redeem branch skipped, test-only copy): the same cases are plain Rules refusals"
        :"END SHOWDOWN: a sacked season ACKNOWLEDGED with no Terminal Progress yet, or with progress covering only the earlier unsacked season, is never ended early (either manager, counts 0-2, null, no mark)");
    }finally{await env.cleanup();}
  }
  // 3g. Control: before any Terminal Progress exists, END SHOWDOWN with the exact count still ends an unsacked Showdown early.
  {
    const env=await initializeTestEnvironment({projectId:nextProject("endearlyfresh"),firestore:{rules:RULES}});
    const id=`pair_${"3".repeat(64)}`,sid=`session_${"2".repeat(64)}`;
    try{
      await seedTerminal(env,id,sid,3,[[result(),result()],[result(),result({championsLeague:true})]]);
      const host=env.authenticatedContext(uid1).firestore();
      const prior=(await assertSucceeds(getDoc(doc(host,"rivalries",id)))).data();
      firestoreSdk.setLogLevel("silent");
      try{await assertDenied(setDoc(doc(host,"rivalries",id),await abandonWrite(prior,uid1,{seasonsPlayed:1})),"END with seasonsPlayed 1 when 2 seasons are accepted");}
      finally{firestoreSdk.setLogLevel("warn");}
      await assertAccepted(setDoc(doc(host,"rivalries",id),await abandonWrite(prior,uid1,{seasonsPlayed:2})),"Daniel ends an unsacked Showdown early after season 2 with no Terminal Progress");
      checks.push("control: with no Terminal Progress yet, END SHOWDOWN ends an unsacked Showdown early with the exact count (a lower count is refused)");
    }finally{await env.cleanup();}
  }
  return checks;
}


// ---------------------------------------------------------------------------------------------------------------
// 4. Expression budget of the sacked progress writes (the same calibrated padding as the Europa League emulator).
// ---------------------------------------------------------------------------------------------------------------
function padFunctions(n,prefix){
  const functions=[];let leaves=[];
  for(let left=n,i=0;left>0;left-=10,i++){const k=Math.min(10,left);functions.push(`    function ${prefix}L${i}() { return ${Array.from({length:k},()=>"true").join(" && ")}; }`);leaves.push(`${prefix}L${i}()`);}
  for(let depth=0;leaves.length>1;depth++){const next=[];for(let j=0;j<leaves.length;j+=10){const name=`${prefix}N${depth}x${j}`;functions.push(`    function ${name}() { return ${leaves.slice(j,j+10).join(" && ")}; }`);next.push(`${name}()`);}leaves=next;}
  return {functions:functions.join("\n"),call:leaves[0]||"true"};
}
// The entry point is parameterized in the reviewed fragment and parameterless once the localize build step has moved it
// into its match block (r88 Rules slimming); the needle takes either form at any indentation (as the Europa League test).
const PAD_NEEDLE=(RULES.match(/^ *function ssjrTerminalValidRivalryUpdate\([^)]*\) \{\n *return \(/m)||[""])[0];
function paddedRules(n){
  assert.ok(PAD_NEEDLE,"the Terminal Close rivalry update entry point must be found");
  assert.equal(RULES.split(PAD_NEEDLE).length,2,"the Terminal Close rivalry update entry point must exist exactly once");
  const pad=padFunctions(n,"sackedBudgetPad");
  return RULES.replace(PAD_NEEDLE,`${pad.functions}\n${PAD_NEEDLE.replace("return (",`return ${pad.call} && (`)}`);
}
async function largestPassing(attempt,high){
  let low=0;
  if(!await attempt(0))return -1;
  while(low<high){const mid=Math.ceil((low+high)/2);if(await attempt(mid))low=mid;else high=mid-1;}
  return low;
}
async function calibrationPad(){
  return largestPassing(async n=>{
    const pad=padFunctions(n,"calibrationPad");
    const rules=`rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n${pad.functions}\n    match /budget/{id} { allow get: if ${pad.call}; }\n  }\n}\n`;
    const env=await initializeTestEnvironment({projectId:nextProject("calibrate"),firestore:{rules}});
    try{try{await getDoc(doc(env.unauthenticatedContext().firestore(),"budget","probe"));return true;}catch(error){if(!LIMIT.test(String(error.message)))throw error;return false;}}
    finally{await env.cleanup();}
  },600);
}
// The heaviest sacked progress: every season at the 15 maximum with an EL win beside it, the sacking in `season`.
async function progressPad(season){
  const heavy={leaguePosition:1,leaguePoints:104,leagueGoals:101,domesticCup:true,championsLeague:false,topScorer:true,topAssist:true,europaLeague:true,primePack:4};
  const seasons=Array.from({length:10},(_,i)=>i+1===season?[{...heavy,sacked:true},{...heavy,sacked:true}]:[heavy,heavy]);
  const per=score(heavy);
  return largestPassing(async n=>{
    const env=await initializeTestEnvironment({projectId:nextProject(`budget${season}`),firestore:{rules:paddedRules(n)}});
    try{
      const id=`pair_${"c".repeat(64)}`;await seedTerminal(env,id,`session_${"c".repeat(64)}`,10,seasons);
      if(season>1)await env.withSecurityRulesDisabled(async context=>{
        const db=context.firestore(),prior=(await getDoc(doc(db,"rivalries",id))).data();
        const terminalProgress={schemaVersion:1,runtimeRevision:"1.9.1-r18",totalSeasons:10,acceptedThroughSeason:season-1,managerTotals:{playerOne:per*(season-1),playerTwo:per*(season-1)},closedSessionRevision:null};
        await setDoc(doc(db,"rivalries",id),await envelope("rivalry",id,prior.revision+1,{...prior.data,terminalProgress},{priorHash:prior.contentHash}));
      });
      const host=env.authenticatedContext(uid1).firestore(),prior=(await getDoc(doc(host,"rivalries",id))).data();
      try{await setDoc(doc(host,"rivalries",id),await progressWrite(prior,10,{playerOne:per*season,playerTwo:per*season},{sacked:{playerOne:true,playerTwo:true}}));return true;}
      catch(error){if(!LIMIT.test(String(error.message)))throw new Error(`budget probe season ${season} pad ${n}: ${error.message}`);return false;}
    }finally{await env.cleanup();}
  },600);
}
async function expressionBudget(){
  // The padded probes hit the limit on purpose, on a padded copy of the Rules that is never deployed; the SDK log is
  // silenced so the composed regression's 1,000-expression gate sees the phrase only where a real suite reaches it.
  firestoreSdk.setLogLevel("silent");
  const calibration=await calibrationPad();
  assert.ok(calibration>100,`calibration pad must be large (got ${calibration})`);
  const used=pad=>Math.round(1000*(1-(pad+1)/(calibration+1)));
  const initial=await progressPad(1),advance=await progressPad(10);
  process.stdout.write(`SACKED_RULES_EXPRESSION_BUDGET calibration=${calibration} initialPad=${initial} advancePad=${advance} initialUsed~${initial<0?">1000":used(initial)} advanceUsed~${advance<0?">1000":used(advance)} (of 1000, +/-${Math.ceil(1000/(calibration+1))})\n`);
  assert.ok(initial>=0,"the season-1 sacked progress write (both sacked, 15-point seasons with EL) must pass without padding");
  assert.ok(advance>=0,"the season-10 sacked progress write (both sacked, 15-point seasons with EL) must pass without padding");
  return [`expression budget measured: sacked season-1 progress ~${used(initial)}/1000, sacked season-10 progress ~${used(advance)}/1000 (both managers sacked, 15-point seasons with EL)`];
}

(async()=>{
  const NEW=RULES,olds=[["r87 (2.0.0)",process.env.OLD_RULES_R87],["r88 (2.1.0)",process.env.OLD_RULES_R88]].map(([label,file])=>{
    if(!file)throw new Error("set OLD_RULES_R87 and OLD_RULES_R88 to the composed Rules built at 00ae2b72 and ae808444 (see the header)");
    const text=fs.readFileSync(file,"utf8");return [`${label}, ${require("node:crypto").createHash("sha256").update(text).digest("hex").slice(0,8)}`,text];
  });
  let n=0;
  for(const [label,OLD] of olds){
    for(const sackedAt of [null,2]){
      const project=`demo-old-records-${n++}`,id=`pair_${String(n).repeat(64).slice(0,64)}`,sid=`session_${"b".repeat(64)}`;
      const seasons=[[result({championsLeague:true}),result({domesticCup:true})],[result({leaguePosition:1}),result(sackedAt===2?{leaguePosition:18,sacked:true}:{})],[result(),result({leaguePosition:1})]];
      const oldEnv=await initializeTestEnvironment({projectId:project,firestore:{rules:OLD}});
      await seedTerminal(oldEnv,id,sid,3,seasons);
      let host=oldEnv.authenticatedContext(uid1).firestore();
      const read=async db=>(await assertSucceeds(getDoc(doc(db,"rivalries",id)))).data();
      const s1={playerOne:score(seasons[0][0]),playerTwo:score(seasons[0][1])};
      await assertAccepted(setDoc(doc(host,"rivalries",id),await progressWrite(await read(host),3,s1)),`${label}: season 1 progress written by the old Rules`);
      const s2={playerOne:s1.playerOne+score(seasons[1][0]),playerTwo:s1.playerTwo+score(seasons[1][1])};
      if(sackedAt===null)await assertAccepted(setDoc(doc(host,"rivalries",id),await progressWrite(await read(host),3,s2)),`${label}: season 2 progress written by the old Rules`);
      await oldEnv.cleanup();
      const newEnv=await initializeTestEnvironment({projectId:project,firestore:{rules:NEW}});
      try{
        host=newEnv.authenticatedContext(uid1).firestore();const peer=newEnv.authenticatedContext(uid2).firestore();
        const stored=await read(host);
        if(sackedAt===null){
          assert.equal(stored.data.terminalProgress.acceptedThroughSeason,2,"the old Rules' record is stored");
          const s3={playerOne:s2.playerOne+score(seasons[2][0]),playerTwo:s2.playerTwo+score(seasons[2][1])};
          await assertPlainDenial(setDoc(doc(host,"rivalries",id),await progressWrite(stored,3,{...s3,playerOne:s3.playerOne+1})),`${label}: a wrong total on the advance is still refused`);
          await assertPlainDenial(setDoc(doc(host,"rivalries",id),await progressWrite(stored,3,s3,{runtimeRevision:"1.9.1-r17"})),`${label}: a new record with the wrong runtime is still refused`);
          await assertAccepted(setDoc(doc(host,"rivalries",id),await progressWrite(await read(host),3,s3)),`${label}: the new Rules advance the old record to season 3`);
          const prior=await read(host),sessionPrior=(await assertSucceeds(getDoc(doc(host,"rivalries",id,"sessions",sid)))).data();
          const intent=Terminal.prepare(projection(id,3,3,s3,null),{sessionId:sid});
          const closed=await Provider.close({user:{uid:uid1},firestore:host,firebaseSdk:sdk(),rivalryId:id,sessionId:sid,deviceId:device1,intent,nowEpochMs:Date.now(),cryptoImpl:crypto.webcrypto});
          assert.equal(closed.ok,true,JSON.stringify(closed));
          console.log(`ok ${label}: records written by the old Rules for seasons 1-2 advance to season 3 on the new Rules (a wrong total or runtime still refused) and close as completed`);
        }else{
          assert.equal(stored.data.terminalProgress.acceptedThroughSeason,1,"the old Rules' record is stored");
          await assertPlainDenial(setDoc(doc(host,"rivalries",id),await progressWrite(stored,3,s2)),`${label}: the sacked season without the map is refused`);
          await assertAccepted(setDoc(doc(host,"rivalries",id),await progressWrite(stored,3,s2,{sacked:{playerOne:false,playerTwo:true}})),`${label}: the new Rules advance the old record to the sacked season 2`);
          const s3={playerOne:s2.playerOne+score(seasons[2][0]),playerTwo:s2.playerTwo+score(seasons[2][1])};
          const after=await read(host);
          await assertPlainDenial(setDoc(doc(host,"rivalries",id),await progressWrite(after,3,s3)),`${label}: no season after the sacked one (map dropped)`);
          await assertPlainDenial(setDoc(doc(host,"rivalries",id),await progressWrite(after,3,s3,{sacked:{playerOne:false,playerTwo:true}})),`${label}: no season after the sacked one (map kept)`);
          const intent=Terminal.prepare(projection(id,3,2,s2,{playerOne:false,playerTwo:true}),{sessionId:sid});
          const closed=await Provider.close({user:{uid:uid1},firestore:host,firebaseSdk:sdk(),rivalryId:id,sessionId:sid,deviceId:device1,intent,nowEpochMs:Date.now(),cryptoImpl:crypto.webcrypto});
          assert.equal(closed.ok,true,JSON.stringify(closed));
          console.log(`ok ${label}: a season-1 record written by the old Rules advances to a sacked season 2 on the new Rules, nothing after it, and closes as sacked`);
        }
      }finally{await newEnv.cleanup();}
    }
  }
  console.log("PASS old-records proof");
})().catch(error=>{console.error(error);process.exitCode=1;});

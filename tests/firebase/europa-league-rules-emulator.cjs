"use strict";
// r80 Europa League (EL) in the composed production Rules (firestore.spark.generated.rules).
// Nik's rule: a club plays the Champions League (CL) or the EL in a season, never both. That is checked per manager per
// season only. A CL season followed by an EL season counts both, and the two managers play different FIFA saves, so
// both may win the CL, the EL, the league or the cup in the same season. Nothing compares one manager's result with
// the other's, or one season with another. Only winning scores:
// EL winner +3 (CL +5, league +3, cup +1, performance +1, awards +1). A season still scores at most 11.
// Storage: `europaLeague` is present only when the EL was won, and then it is exactly `true` (sparse key).
// Proven here, on the Rules alone (the app does not send the key until the protocol PR):
//   1. Season Results private result: the old 7-key result and the 8-key EL result are accepted; europaLeague false,
//      a non-boolean value, null, CL and EL both true, and an unknown 9th key are refused.
//   2. Season Commit: the commit binds the exact private result (EL key included) and refuses CL+EL or EL false even
//      when the private document holds them.
//   3. Terminal Close: the per-season Rules score adds EL +3 (0 or +5 refused), a mixed 7/8-key history closes, and a
//      10-season close with EL wins in every season closes with no write hitting the 1,000-expression limit.
//   4. Budget: the remaining headroom of the two Terminal Close progress writes is measured in the emulator by
//      padding them with a calibrated number of extra terms (EL_RULES_EXPRESSION_BUDGET line).
// Run inside the Firestore emulator:
//   npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-terminal \
//     "node tests/firebase/europa-league-rules-emulator.cjs"
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,getDoc,setDoc,serverTimestamp}=firestoreSdk;
const {initializeTestEnvironment,assertSucceeds,assertFails}=require("@firebase/rules-unit-testing");

global.window=globalThis;
require("../../data/transferOptions.js");
const Setup=require("../../js/sparkSharedShowdownSetup.js");
const Career=require("../../js/sparkSharedCareerStart.js");
const Transfer=require("../../js/sparkSharedTransferChallenge.js");
// r87 RT5-FLOW-02: in a roulette-eligible Showdown START needs both managers' spun marks, so each manager writes his own first.
async function startAfterSpins(start,partner){for(const [options,role] of [[start,"playerOne"],[partner,"playerTwo"]]){const mark=await Transfer.markSpun({...options,managerRole:role});if(!mark||mark.ok!==true)return mark;}return Transfer.startWindow(start);}
const Results=require("../../js/sparkSharedSeasonResults.js");
const Terminal=require("../../js/sharedTerminalClose.js");
const Provider=require("../../js/sparkTerminalClose.js");
const Sessions=require("../../js/sparkPrivateSession.js");

const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const LIMIT=/maximum of 1000 expressions/;
const PROJECT="demo-cms-europa-league-rules";
let projectSeq=0;
const nextProject=label=>`${PROJECT}-${label}-${projectSeq++}`;
function op(prefix,n){return prefix+Number(n).toString(16).padStart(32,"0");}
const hex64=seed=>crypto.createHash("sha256").update(String(seed)).digest("hex");

// Every expected refusal must be an ordinary Rules denial, never the evaluation limit.
async function assertPlainDenial(promise,label){
  let error=null;
  try{await promise;}catch(caught){error=caught;}
  assert.ok(error,`${label}: must be refused`);
  assert.equal(error.code,"permission-denied",`${label}: expected permission-denied, got ${error.code}: ${error.message}`);
  assert.doesNotMatch(String(error.message||""),LIMIT,`${label}: refused by the Rules evaluation limit, not by the Rules`);
}
async function assertAccepted(promise,label){
  try{await promise;}
  catch(error){throw new assert.AssertionError({message:`${label}: must be accepted, got ${error.code}: ${String(error.message||"").trim().split("\n")[0]}`});}
}

// ---------------------------------------------------------------------------------------------------------------
// 1 + 2. Season Results and Season Commit (rivalry built by the real providers, as the Results diagnostic does).
// ---------------------------------------------------------------------------------------------------------------
const A="acct_el_rules_a",B="acct_el_rules_b";
const RID=`pair_${"7".repeat(64)}`;
const SID=`session_${"d".repeat(64)}`;
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`;
function plainSdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp};}
// The Results provider validates the 7-key result it is given (the EL key is the protocol PR). To test the Rules alone,
// this SDK swaps the result inside the private role document the provider writes, right at transaction.set.
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
const SEVEN={leaguePosition:1,leaguePoints:102,leagueGoals:92,domesticCup:true,championsLeague:false,topScorer:true,topAssist:false};

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
  must("transfer start",await startAfterSpins({...a(100),seasonNumber:1,operationId:op("transfer_op_",11),baseRevision:0},{...b(100),seasonNumber:1}));
  must("transfer end A",await Transfer.requestEndWindow({...a(200),seasonNumber:1,operationId:op("transfer_op_",12),baseRevision:1}));
  must("transfer end B",await Transfer.requestEndWindow({...b(300),seasonNumber:1,operationId:op("transfer_op_",13),baseRevision:2}));
  must("guess A",await Transfer.lockGuesses({...a(400),seasonNumber:1,operationId:op("transfer_op_",14),baseRevision:3,guesses:[{slot:1,type:"league",valueId:"england-premier-league"},{slot:2,type:"nationality",valueId:"brazil"}]}));
  must("guess B",await Transfer.lockGuesses({...b(500),seasonNumber:1,operationId:op("transfer_op_",15),baseRevision:4,guesses:[{slot:1,type:"league",valueId:"spain-primera-division"},{slot:2,type:"nationality",valueId:"germany"}]}));
  must("signing A",await Transfer.lockSignings({...a(600),seasonNumber:1,operationId:op("transfer_op_",16),baseRevision:5,signings:[{slot:1,name:"Daniel Europa",leagueId:"spain-primera-division",nationalityId:"england"}]}));
  must("signing B",await Transfer.lockSignings({...b(700),seasonNumber:1,operationId:op("transfer_op_",17),baseRevision:6,signings:[{slot:1,name:"Nik Europa",leagueId:"england-premier-league",nationalityId:"brazil"}]}));
  return {dbA,dbB};
}

async function seasonResultsAndCommit(){
  const env=await initializeTestEnvironment({projectId:nextProject("results"),firestore:{rules:RULES}});
  const checks=[];
  try{
    const now=Date.now(),{dbA,dbB}=await prepareJourney(env,now);
    const publicRef=db=>doc(db,"rivalries",RID,"seasonResults","season_1");
    const publish=async(db,uid,deviceId,result,n,baseRevision,t)=>Results.publishResult({...base(db,uid,deviceId,now+t,injectingSdk(result)),seasonNumber:1,operationId:op("season_result_op_",n),baseRevision,result:SEVEN});
    const elWin={leaguePosition:2,leaguePoints:81,leagueGoals:70,domesticCup:true,championsLeague:false,topScorer:false,topAssist:false,europaLeague:true};

    // 1. Refused private results: nothing is written, the public document is still absent.
    let n=20;
    for(const [label,result] of [
      ["europaLeague false is refused (only `true` is ever stored)",{...SEVEN,europaLeague:false}],
      ["Champions League and Europa League both true is refused",{...SEVEN,championsLeague:true,europaLeague:true}],
      ["europaLeague as a string is refused",{...SEVEN,europaLeague:"true"}],
      ["europaLeague as a number is refused",{...SEVEN,europaLeague:1}],
      ["europaLeague null is refused",{...SEVEN,europaLeague:null}],
      ["an unknown 9th result key is refused",{...SEVEN,europaLeague:true,superCup:true}]
    ]){
      const value=await publish(dbA,A,DA,result,n++,0,800);
      assert.equal(value.ok,false,`${label}: ${JSON.stringify(value)}`);
      assert.equal(value.code,"permission-denied",`${label}: expected a Rules denial, got ${JSON.stringify(value)}`);
      assert.equal((await getDoc(publicRef(dbA))).exists(),false,`${label}: no Season Results document may be written`);
      checks.push(label);
    }
    // 2. Accepted: playerOne's EL win (8 keys), playerTwo's old 7-key result.
    const first=await publish(dbA,A,DA,elWin,n++,0,900);
    assert.equal(first.ok,true,`an EL win (europaLeague: true, CL false) is accepted: ${JSON.stringify(first)}`);checks.push("an EL win (europaLeague: true, CL false) is accepted");
    const second=await publish(dbB,B,DB,SEVEN,n++,1,1000);
    assert.equal(second.ok,true,`an old 7-key result is accepted: ${JSON.stringify(second)}`);checks.push("an old 7-key result is accepted next to an EL result");
    let storedOne,storedTwo,publicDoc,setupDoc;
    await env.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      storedOne=(await getDoc(doc(db,"rivalries",RID,"seasonResults","season_1","roles","playerOne"))).data();
      storedTwo=(await getDoc(doc(db,"rivalries",RID,"seasonResults","season_1","roles","playerTwo"))).data();
      publicDoc=(await getDoc(doc(db,"rivalries",RID,"seasonResults","season_1"))).data();
      setupDoc=(await getDoc(doc(db,"rivalries",RID,"sharedSetup","authoritative"))).data();
    });
    assert.equal(publicDoc.phase,"RESULTS_READY");
    assert.deepEqual(storedOne.result,elWin,"the EL key is stored exactly as true");
    assert.deepEqual(Object.keys(storedTwo.result).sort(),Object.keys(SEVEN).sort(),"the 7-key result stays 7 keys");
    assert.equal(setupDoc.coordinatorRole,"playerOne","Daniel's slot (A) coordinates the commit in this fixture");

    // 3. Season Commit binds the exact private results, the EL key included.
    const commitRef=(db,season)=>doc(db,"rivalries",RID,"seasonCommits",`season_${season}`);
    const commit=(season,playerOne,playerTwo,k)=>({schemaVersion:1,objectType:"sharedSeasonCommit",rivalryId:RID,seasonNumber:season,runtimeRevision:"1.9.1-r10",phase:"COMMITTED",revision:1,resultsRevision:2,results:{playerOne,playerTwo},acknowledgedRoles:[],operationIds:[op("season_commit_op_",k)],operationHashes:[`sha256:${hex64(`commit-${season}-${k}`)}`],baseRevisions:[0],actorRoles:["playerOne"],activeSessionId:SID,updatedAt:serverTimestamp(),updatedByDeviceId:DA});
    const {europaLeague:_dropped,...elDropped}=elWin;
    await assertPlainDenial(setDoc(commitRef(dbA,1),commit(1,elDropped,storedTwo.result,1)),"a commit that drops the EL key from the private result");checks.push("a commit that drops the EL key is refused");
    await assertPlainDenial(setDoc(commitRef(dbA,1),commit(1,{...elWin,europaLeague:false},storedTwo.result,1)),"a commit that turns the EL key into false");checks.push("a commit that turns the EL key into false is refused");
    await assertAccepted(setDoc(commitRef(dbA,1),commit(1,storedOne.result,storedTwo.result,1)),"the commit of an EL win plus a 7-key result");checks.push("the commit of an EL win plus a 7-key result is accepted");
    assert.deepEqual((await getDoc(commitRef(dbB,1))).data().results,{playerOne:elWin,playerTwo:SEVEN});

    // 4. Private documents forged outside the Rules (admin seeding) still cannot reach a commit.
    const seed=async(season,playerOne,playerTwo)=>env.withSecurityRulesDisabled(async context=>{
      const db=context.firestore(),seasonId=`season_${season}`;
      await setDoc(doc(db,"rivalries",RID,"seasonResults",seasonId),{...publicDoc,seasonNumber:season,operationIds:[op("season_result_op_",season*10+1),op("season_result_op_",season*10+2)]});
      await setDoc(doc(db,"rivalries",RID,"seasonResults",seasonId,"roles","playerOne"),{...storedOne,seasonNumber:season,operationId:op("season_result_op_",season*10+1),result:playerOne});
      await setDoc(doc(db,"rivalries",RID,"seasonResults",seasonId,"roles","playerTwo"),{...storedTwo,seasonNumber:season,operationId:op("season_result_op_",season*10+2),result:playerTwo});
    });
    const both={...SEVEN,championsLeague:true,europaLeague:true},elFalse={...SEVEN,europaLeague:false};
    await seed(2,both,SEVEN);
    await assertPlainDenial(setDoc(commitRef(dbA,2),commit(2,both,SEVEN,2)),"a commit of a forged CL+EL private result");checks.push("a commit of a forged CL+EL result is refused");
    // Nik (05:25 UTC): the two managers play different FIFA saves, so both may win the EL, the league and the cup in the
    // same season. The control commit has both managers on the same EL win, league title and cup: never refused.
    const elBoth={...both,championsLeague:false};
    await seed(2,elBoth,elBoth);
    await assertAccepted(setDoc(commitRef(dbA,2),commit(2,elBoth,elBoth,2)),"control: CL cleared, both managers win the EL, the league and the cup");checks.push("control: both managers winning the EL, the league and the cup in one season is accepted");
    await seed(3,SEVEN,elFalse);
    await assertPlainDenial(setDoc(commitRef(dbA,3),commit(3,SEVEN,elFalse,3)),"a commit of a forged europaLeague:false private result");checks.push("a commit of a forged europaLeague:false result is refused");
    const clBoth={...SEVEN,championsLeague:true};
    await seed(3,clBoth,clBoth);
    await assertAccepted(setDoc(commitRef(dbA,3),commit(3,clBoth,clBoth,3)),"control: old 7-key results, both managers win the CL, the league and the cup");checks.push("control: both managers winning the CL, the league and the cup (7-key) is accepted");
  }finally{await env.cleanup();}
  return checks;
}

// ---------------------------------------------------------------------------------------------------------------
// 3 + 4. Terminal Close (envelope documents, as the r18 Terminal Close matrix builds them).
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
// Nik's scoring with the EL term: the expected per-season score every Rules write is checked against.
function score(value){return (value.championsLeague===true?5:0)+(value.europaLeague===true?3:0)+(value.leaguePosition===1?3:0)+(value.domesticCup===true?1:0)+((value.leaguePoints>=100||value.leagueGoals>=100)?1:0)+((value.topScorer===true||value.topAssist===true)?1:0);}
const EL_MAX=result({leaguePosition:1,leaguePoints:100,leagueGoals:95,domesticCup:true,topScorer:true,europaLeague:true});
const CL_MAX=result({leaguePosition:1,leaguePoints:104,leagueGoals:101,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true});
const EL_ONLY=result({europaLeague:true});
function sdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction};}
function projection(id,totalSeasons,managerTotals){return {schemaVersion:1,runtimeRevision:"1.9.1-r17",phase:"FINAL_SEASON_RECONCILED",rivalryId:id,leagueId:"premier-league",totalSeasons,acceptedSeasons:totalSeasons,completedSeason:totalSeasons,acceptedRevisionKey:Array.from({length:totalSeasons},(_,i)=>`${i+1}:2:sha256:${hex64(i)}`).join("|"),fixedClubs:{playerOne:"Arsenal",playerTwo:"Chelsea"},managerTotals,winner:managerTotals.playerOne>managerTotals.playerTwo?"playerOne":managerTotals.playerTwo>managerTotals.playerOne?"playerTwo":"draw",terminal:true,finalSeasonReconciled:true,nextSeason:null,extraSeasonAllowed:false,terminalCloseRequired:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false};}

async function seedTerminal(env,id,sid,seasons){
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    for(const uid of [uid1,uid2])await setDoc(doc(db,"accounts",uid),await envelopeAccount(uid));
    await setDoc(doc(db,"accounts",uid1,"devices",device1),await envelopeDevice(uid1,device1,"1"));await setDoc(doc(db,"accounts",uid2,"devices",device2),await envelopeDevice(uid2,device2,"2"));
    await setDoc(doc(db,"rivalries",id),await envelopeRivalry(id));
    await setDoc(doc(db,"rivalries",id,"sharedSetup","authoritative"),{schemaVersion:1,objectType:"sharedSetupLedger",rivalryId:id,revision:6,phase:"SHOWDOWN_CONFIRMED",coordinatorRole:"playerOne",totalSeasons:seasons.length,confirmedRoles:["playerOne","playerTwo"]});
    await setDoc(doc(db,"rivalries",id,"sessions",sid),await envelopeSession(id,sid));
    for(let i=0;i<seasons.length;i++)await setDoc(doc(db,"rivalries",id,"seasonCommits",`season_${i+1}`),{schemaVersion:1,objectType:"sharedSeasonCommit",rivalryId:id,seasonNumber:i+1,runtimeRevision:"1.9.1-r10",phase:"ACKNOWLEDGED",revision:3,results:{playerOne:seasons[i][0],playerTwo:seasons[i][1]},acknowledgedRoles:["playerOne","playerTwo"]});
  });
}
// The exact rivalry write stcAdvanceProgress makes for the next season, with the totals the caller chooses.
async function progressWrite(prior,totalSeasons,managerTotals,uid=uid1,deviceId=device1){
  const before=prior.data.terminalProgress,season=before?before.acceptedThroughSeason+1:1;
  const terminalProgress={schemaVersion:1,runtimeRevision:"1.9.1-r18",totalSeasons,acceptedThroughSeason:season,managerTotals,closedSessionRevision:null};
  return envelope("rivalry",prior.objectId,prior.revision+1,{...prior.data,terminalProgress},{accountId:uid,deviceId,priorHash:prior.contentHash});
}
// Walk every season: forged totals are refused, the exact totals (EL +3) are accepted, then the provider closes.
async function closeShowdown(env,id,sid,seasons,forgeries,label){
  await seedTerminal(env,id,sid,seasons);
  const host=env.authenticatedContext(uid1).firestore(),peer=env.authenticatedContext(uid2).firestore();
  const rivalryRef=doc(host,"rivalries",id);
  const totals={playerOne:0,playerTwo:0};let refused=0;
  for(let i=0;i<seasons.length;i++){
    const season=i+1,[one,two]=seasons[i];
    const prior=(await assertSucceeds(getDoc(rivalryRef))).data();
    for(const [role,delta,why] of forgeries(season,one,two)){
      const forged={...totals};forged.playerOne+=score(one);forged.playerTwo+=score(two);forged[role]+=delta;
      await assertPlainDenial(setDoc(rivalryRef,await progressWrite(prior,seasons.length,forged)),`${label} season ${season}: ${why}`);refused++;
    }
    totals.playerOne+=score(one);totals.playerTwo+=score(two);
    await assertAccepted(setDoc(rivalryRef,await progressWrite(prior,seasons.length,{...totals})),`${label} season ${season} progress with EL scored +3`);
    const after=(await assertSucceeds(getDoc(rivalryRef))).data();
    assert.equal(after.data.terminalProgress.acceptedThroughSeason,season);assert.deepEqual(after.data.terminalProgress.managerTotals,totals);
  }
  const intent=Terminal.prepare(projection(id,seasons.length,{...totals}),{sessionId:sid});
  const closed=await Provider.close({user:{uid:uid1},firestore:host,firebaseSdk:sdk(),rivalryId:id,sessionId:sid,deviceId:device1,intent,nowEpochMs:Date.now(),cryptoImpl:crypto.webcrypto});
  assert.equal(closed.ok,true,`${label}: the final close is accepted: ${JSON.stringify(closed)}`);assert.equal(closed.rivalryState,"closed");
  const read=(await assertSucceeds(getDoc(doc(peer,"rivalries",id)))).data();
  assert.equal(read.data.connectionState,"closed");assert.deepEqual(read.data.terminalProgress.managerTotals,totals);assert.deepEqual(read.data.terminalClose.managerTotals,totals);
  return {totals,refused};
}

async function terminalClose(){
  const checks=[];
  // Mixed 3-season history: old 7-key seasons next to EL seasons, the EL max season (9) included.
  {
    const env=await initializeTestEnvironment({projectId:nextProject("terminal3"),firestore:{rules:RULES}});
    try{
      const seasons=[
        [result({domesticCup:true,europaLeague:true}),result({leaguePosition:1})],
        [result({championsLeague:true}),EL_MAX],
        [CL_MAX,CL_MAX]
      ];
      assert.deepEqual(seasons.map(([one,two])=>[score(one),score(two)]),[[4,3],[5,9],[11,11]]);
      const {totals,refused}=await closeShowdown(env,`pair_${"a".repeat(64)}`,`session_${"b".repeat(64)}`,seasons,(season,one,two)=>[
        ...(one.europaLeague?[["playerOne",-3,"EL scored 0 is refused"],["playerOne",2,"EL scored +5 is refused"]]:[]),
        ...(two.europaLeague?[["playerTwo",-3,"EL scored 0 is refused"],["playerTwo",2,"EL scored +5 is refused"]]:[]),
        ...(!one.europaLeague&&!two.europaLeague?[["playerOne",3,"+3 for a season without an EL win is refused"]]:[])
      ],"mixed 7/8-key 3-season Showdown");
      assert.deepEqual(totals,{playerOne:20,playerTwo:23});assert.equal(refused,5);
      checks.push("initial progress: EL win scored +3 accepted, 0 and +5 refused","advance progress: EL max season (9) accepted, 0 and +5 refused","a 7-key season gets no EL points","both managers winning the CL, the league and the cup in one season (11-11) is accepted","a mixed 7/8-key 3-season Showdown closes (20-23)");
    }finally{await env.cleanup();}
  }
  // Nik (06:38 UTC): the CL-or-EL rule is per manager AND per season. One manager wins the CL in season 1 and the EL in
  // season 2; the other wins the EL in season 1. No Rules check compares seasons, so every win counts.
  {
    const env=await initializeTestEnvironment({projectId:nextProject("terminalmix"),firestore:{rules:RULES}});
    try{
      const seasons=[
        [result({championsLeague:true}),result({europaLeague:true})],
        [result({europaLeague:true}),result()],
        [result(),result()]
      ];
      assert.deepEqual(seasons.map(([one,two])=>[score(one),score(two)]),[[5,3],[3,0],[0,0]]);
      const {totals,refused}=await closeShowdown(env,`pair_${"b".repeat(64)}`,`session_${"a".repeat(64)}`,seasons,(season,one,two)=>[
        ...(one.championsLeague?[["playerOne",-5,"the CL win scored 0 is refused"]]:[]),
        ...(one.europaLeague?[["playerOne",-3,"the EL win after a CL season scored 0 is refused"]]:[]),
        ...(two.europaLeague?[["playerTwo",-3,"EL scored 0 is refused"]]:[])
      ],"CL in season 1 then EL in season 2 Showdown");
      assert.deepEqual(totals,{playerOne:8,playerTwo:3});assert.equal(refused,3);
      checks.push("one manager's CL in season 1 and EL in season 2 both count, the other's EL in season 1 counts: the 3-season close is accepted (8-3)");
    }finally{await env.cleanup();}
  }
  // 10 seasons with an EL win in every season (both managers on even seasons), CL max seasons (11) in between.
  {
    const env=await initializeTestEnvironment({projectId:nextProject("terminal10"),firestore:{rules:RULES}});
    try{
      const seasons=Array.from({length:10},(_,i)=>(i%2===0)?[EL_MAX,CL_MAX]:[EL_ONLY,EL_MAX]);
      const {totals}=await closeShowdown(env,`pair_${"d".repeat(64)}`,`session_${"e".repeat(64)}`,seasons,season=>season===10?[["playerOne",-3,"EL scored 0 in the last season is refused"]]:[],"10-season EL Showdown");
      assert.deepEqual(totals,{playerOne:5*9+5*3,playerTwo:5*11+5*9});
      checks.push("a 10-season close with EL wins in every season (both managers win the EL in 5 of them) closes (60-100) with no write at the 1,000-expression limit");
    }finally{await env.cleanup();}
  }
  return checks;
}

// Budget: pad the progress write with N extra `true` terms (in small nested functions, 10 per leaf) and find the largest
// N that still passes. The same pad alone on a one-line rule calibrates how many pad terms make 1,000 expressions.
function padFunctions(n,prefix){
  const functions=[];let leaves=[];
  for(let left=n,i=0;left>0;left-=10,i++){const k=Math.min(10,left);functions.push(`    function ${prefix}L${i}() { return ${Array.from({length:k},()=>"true").join(" && ")}; }`);leaves.push(`${prefix}L${i}()`);}
  for(let depth=0;leaves.length>1;depth++){const next=[];for(let j=0;j<leaves.length;j+=10){const name=`${prefix}N${depth}x${j}`;functions.push(`    function ${name}() { return ${leaves.slice(j,j+10).join(" && ")}; }`);next.push(`${name}()`);}leaves=next;}
  return {functions:functions.join("\n"),call:leaves[0]||"true"};
}
const PAD_NEEDLE="    function ssjrTerminalValidRivalryUpdate(rivalryId) {\n      return (";
function paddedRules(n){
  assert.equal(RULES.split(PAD_NEEDLE).length,2,"the Terminal Close rivalry update entry point must exist exactly once");
  const pad=padFunctions(n,"elBudgetPad");
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
async function progressPad(season){
  const seasons=Array.from({length:10},()=>[EL_MAX,EL_MAX]);
  return largestPassing(async n=>{
    const env=await initializeTestEnvironment({projectId:nextProject(`budget${season}`),firestore:{rules:paddedRules(n)}});
    try{
      const id=`pair_${"c".repeat(64)}`;await seedTerminal(env,id,`session_${"c".repeat(64)}`,seasons);
      if(season>1)await env.withSecurityRulesDisabled(async context=>{
        const db=context.firestore(),prior=(await getDoc(doc(db,"rivalries",id))).data();
        const terminalProgress={schemaVersion:1,runtimeRevision:"1.9.1-r18",totalSeasons:10,acceptedThroughSeason:season-1,managerTotals:{playerOne:9*(season-1),playerTwo:9*(season-1)},closedSessionRevision:null};
        await setDoc(doc(db,"rivalries",id),await envelope("rivalry",id,prior.revision+1,{...prior.data,terminalProgress},{priorHash:prior.contentHash}));
      });
      const host=env.authenticatedContext(uid1).firestore(),prior=(await getDoc(doc(host,"rivalries",id))).data();
      try{await setDoc(doc(host,"rivalries",id),await progressWrite(prior,10,{playerOne:9*season,playerTwo:9*season}));return true;}
      catch(error){if(!LIMIT.test(String(error.message)))throw new Error(`budget probe season ${season} pad ${n}: ${error.message}`);return false;}
    }finally{await env.cleanup();}
  },600);
}
async function expressionBudget(){
  // The padded probes hit the evaluation limit on purpose, on a padded copy of the Rules that is never deployed. The SDK
  // would log each of those refusals; this section runs last and silences the SDK log so the composed regression's
  // qualified 1,000-expression gate (E1) still sees the phrase only where a real suite reaches the limit. Every probe
  // still checks the refusal itself: anything but the limit fails the test, and the unpadded writes must pass.
  firestoreSdk.setLogLevel("silent");
  const calibration=await calibrationPad();
  assert.ok(calibration>100,`calibration pad must be large (got ${calibration})`);
  const used=pad=>Math.round(1000*(1-(pad+1)/(calibration+1)));
  const initial=await progressPad(1),advance=await progressPad(10);
  assert.ok(initial>=0,"the initial progress write with EL wins for both managers must pass without padding");
  assert.ok(advance>=0,"the season-10 progress write with EL wins for both managers must pass without padding");
  const line=`EL_RULES_EXPRESSION_BUDGET calibration=${calibration} initialPad=${initial} advancePad=${advance} initialUsed~${used(initial)} advanceUsed~${used(advance)} (of 1000, +/-${Math.ceil(1000/(calibration+1))})`;
  process.stdout.write(`${line}\n`);
  return [`expression budget measured: initial progress ~${used(initial)}/1000, season-10 progress ~${used(advance)}/1000 with EL wins for both managers`];
}

(async()=>{
  const failures=[],passed=[];
  for(const [name,section] of [["Season Results and Season Commit",seasonResultsAndCommit],["Terminal Close",terminalClose],["Expression budget",expressionBudget]]){
    try{passed.push(...(await section()));}
    catch(error){failures.push(`${name}: ${error.message}`);}
  }
  for(const check of passed)process.stdout.write(`ok ${check}\n`);
  if(failures.length){for(const failure of failures)process.stderr.write(`FAIL ${failure}\n`);process.exitCode=1;return;}
  process.stdout.write(`PASS r80 Europa League Rules emulator: ${passed.length} checks. The sparse europaLeague key is accepted only as true, one manager's season never has CL and EL both true (both managers may win the same trophy), the old 7-key result is unchanged, the commit binds the exact private result, Terminal Close scores EL +3 within the 11-point season cap, and a 10-season EL close stays under the 1,000-expression limit.\n`);
})().catch(error=>{console.error(error);process.exitCode=1;});

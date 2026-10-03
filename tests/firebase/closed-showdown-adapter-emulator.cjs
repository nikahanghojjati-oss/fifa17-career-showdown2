"use strict";
// JOB-09: closed-Showdown adapter on the composed production Rules.
// Journey: Showdown 1 (3 seasons) closed by a real Terminal Close, Showdown 2 abandoned after one season
// (Nik had an 11-point season), Showdown 3 live with one accepted season. All three are paired through the
// provider, so the G-7 career index names them. Every career read runs from fresh authenticated clients
// through the loader: career index -> session-free reader -> pure adapter -> career model.

const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,getDoc,setDoc,serverTimestamp}=firestoreSdk;
const {initializeTestEnvironment,assertSucceeds}=require("@firebase/rules-unit-testing");

global.window=globalThis;
require("../../data/transferOptions.js");

const Setup=require("../../js/sparkSharedShowdownSetup.js");
const CareerStart=require("../../js/sparkSharedCareerStart.js");
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
const Pairing=require("../../js/sparkPrivatePairing.js");
const Catalog=require("../../js/sharedShowdownCatalog.js");
const PersistentPair=require("../../js/persistentNikDanielPair.js");
const Reader=require("../../js/sparkCompletedShowdownReader.js");
const Active=require("../../js/sharedActiveShowdownAdapter.js");
const Loader=require("../../js/sparkClosedShowdownCareerLoader.js");

const PROJECT_ID=process.env.GCLOUD_PROJECT||"demo-cms-closed-adapter";
const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const A="acct_game_a",B="acct_game_b",C="acct_game_c";
const R1=`pair_${"1".repeat(64)}`,R2=`pair_${"2".repeat(64)}`,R3=`pair_${"3".repeat(64)}`;
const S1=`session_${"b".repeat(64)}`,S2=`session_${"c".repeat(64)}`,S3=`session_${"d".repeat(64)}`;
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`,DC=`device_${"c".repeat(32)}`;
const PA=`profile_${"1".repeat(24)}`,PB=`profile_${"2".repeat(24)}`;
const SA=`save_${"3".repeat(24)}`,SB=`save_${"4".repeat(24)}`;

let checks=0;
async function ok(id,label,fn){await fn();checks+=1;process.stdout.write(`ok ${checks} ${id} ${label}\n`);}

function sdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp};}
function canonical(value){if(value===undefined||value===null)return null;if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};if(Array.isArray(value))return value.map(canonical);if(typeof value==="object"){const out={};for(const key of Object.keys(value).sort())out[key]=canonical(value[key]);return out;}return value;}
function hex(bytes){return Array.from(bytes,value=>value.toString(16).padStart(2,"0")).join("");}
async function digest(value){const bytes=new TextEncoder().encode(JSON.stringify(canonical(value)));const hash=await crypto.webcrypto.subtle.digest("SHA-256",bytes);return `sha256:${hex(new Uint8Array(hash))}`;}
async function envelope(objectType,objectId,revision,data,{accountId=A,deviceId=DA,updatedAt=Timestamp.fromMillis(Date.now())}={}){return {schemaVersion:1,objectType,objectId,revision,parentRevision:revision===0?null:revision-1,lifecycleState:"live",contentHash:await digest({objectType,objectId,revision,data}),priorContentHash:revision===0?null:`sha256:${"0".repeat(64)}`,updatedAt,updatedByAccountId:accountId,updatedByDeviceId:deviceId,data,tombstone:null};}
async function account(uid){const now=Timestamp.fromMillis(Date.now()-120000);return envelope("account",uid,0,{status:"active",createdAt:now,deletionRequestedAt:null},{accountId:uid,deviceId:null,updatedAt:now});}
async function device(uid,id,seed){const now=Timestamp.fromMillis(Date.now()-120000);return envelope("device",id,0,{deviceId:id,installationId:`installation_${seed.repeat(32).slice(0,32)}`,displayLabel:null,state:"active",registeredAt:now,lastSeenAt:now,revokedAt:null},{accountId:uid,deviceId:id,updatedAt:now});}
function slots(){return [
  {slotId:"playerOne",accountId:A,profileId:PA,saveId:SA,displayLabel:"Daniel",entitlementState:"active",deletionConsent:false},
  {slotId:"playerTwo",accountId:B,profileId:PB,saveId:SB,displayLabel:"Nik",entitlementState:"active",deletionConsent:false}
];}
async function rivalry(id){const now=Timestamp.fromMillis(Date.now()-90000),data={connectionState:"active",connectionStateBeforeDeletion:null,managerSlots:slots(),authorizedAccountIds:[A,B],createdByAccountId:A,createdAt:now};return envelope("rivalry",id,0,data,{accountId:A,deviceId:DA,updatedAt:now});}
async function session(id,sid,nowMs){const createdAt=Timestamp.fromMillis(nowMs-60000),lastActivityAt=Timestamp.fromMillis(nowMs-1000);return Sessions.buildEnvelope({sessionId:sid,revision:1,parentRevision:0,priorContentHash:`sha256:${"9".repeat(64)}`,updatedAt:lastActivityAt,accountId:A,deviceId:DA,data:{rivalryId:id,state:"active",hostAccountId:A,memberAccountIds:[A,B],createdAt,expiresAt:Timestamp.fromMillis(nowMs+4*60*60*1000),lastActivityAt,revokedAt:null},cryptoImpl:crypto.webcrypto});}
function op(prefix,n){return prefix+Number(n).toString(16).padStart(32,"0");}
function base(db,uid,deviceId,rivalryId,sessionId,now){return {user:{uid},firestore:db,firebaseSdk:sdk(),rivalryId,sessionId,deviceId,nowEpochMs:now,cryptoImpl:crypto.webcrypto};}
function localAuthority(role){const slot=slots().find(item=>item.slotId===role);return {phase:"REMOTE_OBSERVED",canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,binding:{saveId:slot.saveId,profileId:slot.profileId,managerRole:role}};}
function pairingIdentity(deviceId,seed,nowMs){return {schemaVersion:1,installationId:`installation_${seed.repeat(32).slice(0,32)}`,deviceId,createdAtEpochMs:nowMs-180000};}
function bindingFor(role){return role==="playerOne"?{saveId:SA,profileId:PA,managerRole:role,displayLabel:"Daniel"}:{saveId:SB,profileId:PB,managerRole:role,displayLabel:"Nik"};}
const neutral={leaguePosition:5,leaguePoints:60,leagueGoals:55,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false};
const perfect={leaguePosition:1,leaguePoints:101,leagueGoals:101,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true};
// Showdown 1 (same numbers as the JOB-02 journey): Daniel 5+1+5 = 11, Nik 0+3+1 = 4.
function journeyResult(role,season){if(role==="playerOne")return {leaguePosition:season===1?1:2,leaguePoints:season===1?102:90+season,leagueGoals:88+season,domesticCup:season===2,championsLeague:season===3,topScorer:season===1,topAssist:false};return {leaguePosition:season===2?1:3,leaguePoints:87+season,leagueGoals:84+season,domesticCup:false,championsLeague:false,topScorer:false,topAssist:season===3};}

async function seedAccounts(env){await env.withSecurityRulesDisabled(async context=>{const db=context.firestore();for(const [uid,id,seed] of [[A,DA,"a"],[B,DB,"b"],[C,DC,"c"]]){await setDoc(doc(db,"accounts",uid),await account(uid));await setDoc(doc(db,"accounts",uid,"devices",id),await device(uid,id,seed));}});}

// Real provider pairing (writes both career indexes), then the JOB-02 gameplay bridge (template-equivalent paired root + session).
async function pairThroughProvider(env,{rivalryId,sessionId,nowMs}){
  const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
  const created=await Pairing.createPairing({user:{uid:A},firestore:dbA,firebaseSdk:sdk(),identity:pairingIdentity(DA,"a",nowMs),binding:bindingFor("playerOne"),capability:rivalryId,nowEpochMs:nowMs,cryptoImpl:crypto.webcrypto,durableWitness:PersistentPair.createDurableCreationWitness({services:{firestoreSdk:sdk(),firestore:dbA},accountId:A,deviceId:DA},"playerOne",PersistentPair.managerByRole.playerOne)});
  assert.equal(created.ok,true,`Daniel createPairing: ${JSON.stringify(created)}`);
  const redeemed=await Pairing.redeemPairing({user:{uid:B},firestore:dbB,firebaseSdk:sdk(),identity:pairingIdentity(DB,"b",nowMs),binding:bindingFor("playerTwo"),capability:rivalryId,nowEpochMs:nowMs+1000,cryptoImpl:crypto.webcrypto,durableWitness:PersistentPair.createDurableRedemptionWitness({services:{firestoreSdk:sdk(),firestore:dbB},accountId:B,deviceId:DB},"playerTwo",PersistentPair.managerByRole.playerTwo,rivalryId)});
  assert.equal(redeemed.ok,true,`Nik redeemPairing: ${JSON.stringify(redeemed)}`);
  await env.withSecurityRulesDisabled(async context=>{const db=context.firestore();await setDoc(doc(db,"rivalries",rivalryId),await rivalry(rivalryId));await setDoc(doc(db,"rivalries",rivalryId,"sessions",sessionId),await session(rivalryId,sessionId,nowMs+2000));});
}

// Plays `play` of `totalSeasons` seasons through the real providers; closes with a real Terminal Close when asked.
async function playShowdown(env,{rivalryId,sessionId,nowMs,totalSeasons,play,results,opBase,close=false}){
  const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
  const a=t=>base(dbA,A,DA,rivalryId,sessionId,nowMs+t),b=t=>base(dbB,B,DB,rivalryId,sessionId,nowMs+t),n=k=>opBase+k;
  for(const [type,baseRevision,k,extra] of [["open",0,1,{}],["commit-league",1,2,{}],["commit-clubs",2,3,{}],["commit-length",3,4,{totalSeasons}]]){const value=await Setup.mutate({...a(k*10),type,baseRevision,operationId:op("setup_op_",n(k)),...extra});assert.equal(value.ok,true,`setup ${type}: ${JSON.stringify(value)}`);}
  let setup=await Setup.mutate({...a(50),type:"confirm",baseRevision:4,operationId:op("setup_op_",n(5))});assert.equal(setup.ok,true,JSON.stringify(setup));
  setup=await Setup.mutate({...b(60),type:"confirm",baseRevision:5,operationId:op("setup_op_",n(6))});assert.equal(setup.ok,true,JSON.stringify(setup));assert.equal(setup.state.phase,"SHOWDOWN_CONFIRMED");
  const teamCount=Catalog.catalog[setup.state.leagueId].length;
  let career=await CareerStart.acknowledge({...a(70),operationId:op("career_start_op_",n(1)),baseRevision:0});assert.equal(career.ok,true,JSON.stringify(career));
  career=await CareerStart.acknowledge({...b(80),operationId:op("career_start_op_",n(2)),baseRevision:1});assert.equal(career.ok,true,JSON.stringify(career));
  let history=null,multi=null;
  for(let season=1;season<=play;season+=1){
    const t=season*10000,k=x=>n(season*10+x),step=async(value,label)=>{assert.equal(value.ok,true,`S${season} ${label}: ${JSON.stringify(value)}`);return value;};
    await step(await Transfer.startWindow({...a(t+100),seasonNumber:season,operationId:op("transfer_op_",k(1)),baseRevision:0}),"transfer start");
    await step(await Transfer.requestEndWindow({...a(t+200),seasonNumber:season,operationId:op("transfer_op_",k(2)),baseRevision:1}),"end window A");
    await step(await Transfer.requestEndWindow({...b(t+300),seasonNumber:season,operationId:op("transfer_op_",k(3)),baseRevision:2}),"end window B");
    await step(await Transfer.lockGuesses({...a(t+400),seasonNumber:season,operationId:op("transfer_op_",k(4)),baseRevision:3,guesses:[{slot:1,type:"league",valueId:"england-premier-league"}]}),"guesses A");
    await step(await Transfer.lockGuesses({...b(t+500),seasonNumber:season,operationId:op("transfer_op_",k(5)),baseRevision:4,guesses:[{slot:1,type:"nationality",valueId:"brazil"}]}),"guesses B");
    await step(await Transfer.lockSignings({...a(t+600),seasonNumber:season,operationId:op("transfer_op_",k(6)),baseRevision:5,signings:[{slot:1,name:`Daniel S${season}`,leagueId:"spain-primera-division",nationalityId:"england"}]}),"signings A");
    await step(await Transfer.lockSignings({...b(t+700),seasonNumber:season,operationId:op("transfer_op_",k(7)),baseRevision:6,signings:[{slot:1,name:`Nik S${season}`,leagueId:"england-premier-league",nationalityId:"brazil"}]}),"signings B");
    await step(await Results.publishResult({...a(t+800),seasonNumber:season,operationId:op("season_result_op_",k(1)),baseRevision:0,result:results("playerOne",season)}),"result A");
    const ready=await step(await Results.publishResult({...b(t+900),seasonNumber:season,operationId:op("season_result_op_",k(2)),baseRevision:1,result:results("playerTwo",season)}),"result B");assert.equal(ready.state.phase,"RESULTS_READY");
    await step(await Commit.commitSeason({...a(t+1000),seasonNumber:season,operationId:op("season_commit_op_",k(1)),baseRevision:0}),"commit");
    await step(await Commit.acknowledgeSeason({...b(t+1100),seasonNumber:season,operationId:op("season_commit_op_",k(2)),baseRevision:1}),"ack B");
    const acked=await step(await Commit.acknowledgeSeason({...a(t+1200),seasonNumber:season,operationId:op("season_commit_op_",k(3)),baseRevision:2}),"ack A");assert.equal(acked.phase,"ACKNOWLEDGED");
    const scored=await Scoring.read({...a(t+1300),seasonNumber:season,teamCount});assert.equal(scored.ok,true,JSON.stringify(scored));
    history=await History.read({...a(t+1400),throughSeason:season});assert.equal(history.ok,true,JSON.stringify(history));
    multi=await Multi.read(a(t+1500));assert.equal(multi.ok,true,JSON.stringify(multi));
  }
  let final=null;
  if(close){
    final=Final.reconcile({sharedActive:true,multiSeason:multi,history,localReconciliation:localAuthority("playerOne")});assert.equal(final.phase,"FINAL_SEASON_RECONCILED");
    const closed=await TerminalProvider.close({...a(play*10000+2000),intent:Terminal.prepare(final,{sessionId})});assert.equal(closed.ok,true,JSON.stringify(closed));assert.equal(closed.rivalryState,"closed");
  }
  return {history,multi,final,a,b,dbA};
}

// Live provider snapshot for the JOB-05 adapter, read from a fresh client: real pair link + root, real history/multi when given.
// Pair status mirrors persistentNikDanielPair.js:148 (active -> "paired", otherwise "waiting").
async function liveCareerInput(env,uid,{history=null,multi=null}={}){
  const db=env.authenticatedContext(uid).firestore(),link=(await assertSucceeds(getDoc(doc(db,"accounts",uid,"pairLinks","current")))).data().data;
  const root=(await assertSucceeds(getDoc(doc(db,"rivalries",link.rivalryId)))).data().data;
  const managerId=link.managerRole==="playerOne"?"daniel":"nik";
  return Active.careerInput({identity:{status:"ready",initialized:true,managerId},pair:{status:root.connectionState==="active"?"paired":"waiting",initialized:true,busy:false,managerRole:link.managerRole,managerId,rivalryId:link.rivalryId,connectionState:root.connectionState},multiSeason:multi,history,finalReconciliation:null,terminalClose:null,seasonResults:null});
}
// Fresh authenticated client per load; every exact get is counted.
async function load(env,uid,current){
  const db=env.authenticatedContext(uid).firestore(),counter={gets:0};
  const counted={doc:firestoreSdk.doc,getDoc:async ref=>{counter.gets+=1;return firestoreSdk.getDoc(ref);}};
  const value=await Loader.loadClosedShowdownCareer({firestore:db,firebaseSdk:counted,user:{uid},cryptoImpl:crypto.webcrypto,current});
  return {value,gets:counter.gets};
}
const rows=v=>v.model.history.showdowns.map(row=>row.status);
const classes=v=>v.careerInput.showdowns.map(entry=>entry.classification);
const plain=x=>JSON.parse(JSON.stringify(x));
function noIds(x){if(x&&typeof x==="object"){for(const key of Object.keys(x))assert.ok(!["accountId","profileId","saveId","terminalWitness","sessionId"].includes(key),`model carries ${key}`);Object.values(x).forEach(noIds);}}

async function main(env){
  await seedAccounts(env);
  await ok("I0","composed Rules carry the career index and the completed-only grant",async()=>{
    assert.match(RULES,/match \/accounts\/\{accountId\}\/careerIndex\/\{indexId\}/,"career index match");
    assert.equal((RULES.match(/cmsCompletedSeasonReadable\(rivalryId, seasonId\)/g)||[]).length,4,"completed grant");
  });

  // Showdown 1: 3 seasons, real Terminal Close.
  const now1=Date.now();
  await pairThroughProvider(env,{rivalryId:R1,sessionId:S1,nowMs:now1});
  const one=await playShowdown(env,{rivalryId:R1,sessionId:S1,nowMs:now1+5000,totalSeasons:3,play:3,results:journeyResult,opBase:0});
  await ok("A1","before Terminal Close the live Showdown is completion-pending for both managers",async()=>{
    for(const uid of [A,B]){
      const {value}=await load(env,uid,await liveCareerInput(env,uid,{history:one.history,multi:one.multi}));
      assert.equal(value.status,"ready");assert.deepEqual(classes(value),["completion-pending"]);assert.equal(value.entries[0].source,"current");
      assert.equal(value.model.managers.daniel.showdowns.completed,0,"the outcome waits for Terminal Close");assert.equal(value.model.managers.daniel.careerPoints,11);
    }
  });
  const final1=Final.reconcile({sharedActive:true,multiSeason:one.multi,history:one.history,localReconciliation:localAuthority("playerOne")});
  const closed1=await TerminalProvider.close({...one.a(32000),intent:Terminal.prepare(final1,{sessionId:S1})});assert.equal(closed1.ok,true,JSON.stringify(closed1));
  let witness1;await env.withSecurityRulesDisabled(async context=>{witness1=(await getDoc(doc(context.firestore(),"rivalries",R1))).data().data.terminalClose;});
  await ok("A2","after Terminal Close both managers read Showdown 1 completed with the witness totals",async()=>{
    assert.deepEqual(witness1.managerTotals,{playerOne:11,playerTwo:4});
    for(const uid of [A,B]){
      const {value}=await load(env,uid,await liveCareerInput(env,uid));
      assert.deepEqual(classes(value),["completed"]);assert.equal(value.entries[0].source,"reader");
      assert.deepEqual(value.careerInput.showdowns[0].final,{totals:witness1.managerTotals,winner:witness1.winner});
      assert.equal(value.model.managers.daniel.careerPoints,witness1.managerTotals.playerOne);assert.equal(value.model.managers.nik.careerPoints,witness1.managerTotals.playerTwo);
      assert.deepEqual(value.model.history.showdowns[0].totals,{daniel:11,nik:4});assert.equal(value.model.history.showdowns[0].winner,"daniel");
    }
  });

  // Showdown 2: paired, one of three seasons (Nik scores a perfect 11), then abandoned by the provider.
  const now2=Date.now();
  await pairThroughProvider(env,{rivalryId:R2,sessionId:S2,nowMs:now2});
  const two=await playShowdown(env,{rivalryId:R2,sessionId:S2,nowMs:now2+5000,totalSeasons:3,play:1,results:role=>role==="playerTwo"?perfect:neutral,opBase:200});
  await ok("B1","while Showdown 2 is live its 11-point Nik season counts",async()=>{
    const {value}=await load(env,B,await liveCareerInput(env,B,{history:two.history,multi:two.multi}));
    assert.deepEqual(classes(value),["completed","active"]);assert.equal(value.model.managers.nik.careerPoints,4+11);assert.equal(value.model.managers.nik.perfectSeasons,1);
  });
  globalThis.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:A}},firestore:two.dbA,firestoreSdk:sdk()})};
  globalThis.CareerModeSparkConnectedAccount={initialize:async()=>{},getState:()=>({connected:true,accountId:A})};
  globalThis.CareerModeSparkPrivatePairing={initialize:async()=>{},getState:()=>({registered:true,deviceId:DA})};
  globalThis.CareerModeOnlinePlayerIdentity={getState:()=>({managerId:"daniel"})};
  const abandoned=await PersistentPair.abandonCurrentShowdown({expectedRivalryId:R2,expectedSaveId:SA,cryptoImpl:crypto.webcrypto});
  assert.equal(abandoned.ok,true,JSON.stringify(abandoned));
  await ok("B2","after abandon the career is rebuilt without Showdown 2's seasons",async()=>{
    for(const uid of [A,B]){
      const {value}=await load(env,uid,await liveCareerInput(env,uid));
      assert.deepEqual(classes(value),["completed","abandoned"]);assert.deepEqual(rows(value),["completed","abandoned"]);
      assert.equal(value.model.managers.nik.careerPoints,4);assert.equal(value.model.managers.nik.perfectSeasons,0);assert.equal(value.model.managers.nik.bestSeasonScore,3);
      const row=value.model.history.showdowns[1];assert.equal(row.totals,null);assert.equal(row.winner,null);assert.deepEqual(row.seasons,[]);
    }
  });

  // Showdown 3: paired and live with one accepted season (Daniel 3, Nik 0).
  const now3=Date.now();
  await pairThroughProvider(env,{rivalryId:R3,sessionId:S3,nowMs:now3});
  const three=await playShowdown(env,{rivalryId:R3,sessionId:S3,nowMs:now3+5000,totalSeasons:3,play:1,results:role=>role==="playerOne"?{...neutral,leaguePosition:1}:neutral,opBase:400});

  const views={};
  await ok("C1","both career indexes name the three Showdowns in order",async()=>{
    for(const uid of [A,B]){const index=await PersistentPair.readCareerIndex({firestore:env.authenticatedContext(uid).firestore(),firebaseSdk:firestoreSdk,accountId:uid});assert.equal(index.status,"ready");assert.deepEqual(index.rivalryIds,[R1,R2,R3]);}
  });
  await ok("C2","Daniel: completed, abandoned and live Showdowns from a fresh client",async()=>{
    Loader.clearClosedShowdownCache();
    const {value,gets}=await load(env,A,await liveCareerInput(env,A,{history:three.history,multi:three.multi}));
    assert.equal(value.status,"ready");assert.deepEqual(classes(value),["completed","abandoned","active"]);assert.deepEqual(rows(value),["completed","abandoned","in-progress"]);
    assert.deepEqual(value.entries.map(e=>e.source),["reader","reader","current"]);
    assert.equal(gets,1+(2+4*3)+1+1,"index head + completed (2+4N) + abandoned root + live root");
    views.daniel=value;
  });
  await ok("C3","Daniel again: completed and abandoned Showdowns come from the memory cache",async()=>{
    const {value,gets}=await load(env,A,await liveCareerInput(env,A,{history:three.history,multi:three.multi}));
    assert.equal(gets,2,"index head + live root only");assert.deepEqual(plain(value.model),plain(views.daniel.model));
  });
  await ok("C4","Nik: identical career from his own fresh client and index",async()=>{
    const {value,gets}=await load(env,B,await liveCareerInput(env,B,{history:three.history,multi:three.multi}));
    assert.equal(gets,17,"account change clears the cache");assert.deepEqual(plain(value.model),plain(views.daniel.model));
    views.nik=value;
  });
  await ok("C5","career numbers: totals equal the witness, abandoned counts nothing, live season counts, no ids",async()=>{
    const m=views.daniel.model;
    assert.deepEqual(m.coverage,{readable:3,indexed:3});
    assert.equal(m.managers.daniel.careerPoints,witness1.managerTotals.playerOne+3);assert.equal(m.managers.nik.careerPoints,witness1.managerTotals.playerTwo);
    assert.equal(m.managers.daniel.seasons,4);assert.equal(m.managers.nik.perfectSeasons,0);
    assert.deepEqual(m.managers.daniel.showdowns,{completed:1,wins:1,draws:0,losses:0});assert.deepEqual(m.managers.nik.showdowns,{completed:1,wins:0,draws:0,losses:1});
    assert.deepEqual(m.biggestShowdownWin,{manager:"daniel",margin:7,showdownRef:R1});assert.equal(m.interimLabel,null);
    noIds(m);
  });
  await ok("D1","the stranger has no career index and reads nothing",async()=>{
    Loader.clearClosedShowdownCache();
    const {value}=await load(env,C,null);assert.equal(value.status,"empty");assert.deepEqual(value.model.coverage,{readable:0,indexed:0});
    const direct=await Reader.readCompletedShowdown({firestore:env.authenticatedContext(C).firestore(),firebaseSdk:firestoreSdk,user:{uid:C},rivalryId:R1,cryptoImpl:crypto.webcrypto});
    assert.equal(direct.status,"unavailable");assert.equal(direct.code,"permission-denied");
  });
  await ok("D2","an unknown live state never hides the live Showdown: it is unavailable and the career is partial",async()=>{
    const {value}=await load(env,A,null);assert.equal(value.status,"partial");assert.deepEqual(classes(value),["completed","abandoned","unavailable"]);assert.equal(value.entries[2].code,"CLOSED_CURRENT_UNKNOWN");
  });
}

(async()=>{
  const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{await env.clearFirestore();await main(env);process.stdout.write(`PASS closed-Showdown adapter emulator: ${checks} numbered checks (I0, A Terminal Close, B abandon rebuild, C three-Showdown career for both managers with cache, D stranger and unknown live state).\n`);}
  finally{await env.cleanup();}
})().catch(error=>{console.error(error.stack||error);process.exit(1);});

"use strict";
// JOB-08 completed-only read grant + session-free reader, against the COMPOSED production Rules
// (firestore.spark.generated.rules built by BOTH scripts). One `ok <n> <id> <label>` line per check.
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,collection,deleteDoc,doc,getDoc,getDocs,setDoc,serverTimestamp}=firestoreSdk;
const {initializeTestEnvironment,assertFails,assertSucceeds}=require("@firebase/rules-unit-testing");

global.window=globalThis;
require("../../data/transferOptions.js");

const Setup=require("../../js/sparkSharedShowdownSetup.js");
const Career=require("../../js/sparkSharedCareerStart.js");
const Transfer=require("../../js/sparkSharedTransferChallenge.js");
const Results=require("../../js/sparkSharedSeasonResults.js");
const Commit=require("../../js/sparkSharedSeasonCommit.js");
const History=require("../../js/sparkSharedHistoryConvergence.js");
const HistoryProtocol=require("../../js/sharedHistoryConvergence.js");
const Multi=require("../../js/sparkSharedMultiSeasonProgression.js");
const Final=require("../../js/sharedFinalReconciliation.js");
const Terminal=require("../../js/sharedTerminalClose.js");
const TerminalProvider=require("../../js/sparkTerminalClose.js");
const Sessions=require("../../js/sparkPrivateSession.js");
// Loaded only for section P, so sections I0-F report on the Rules before the client exists (tests-first).
const loadReader=()=>require("../../js/sparkCompletedShowdownReader.js");

const PROJECT_ID="demo-cms-completed-read";
const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const A="acct_daniel",B="acct_nik",C="acct_stranger",D="acct_inactive";
const X=`pair_${"a".repeat(64)}`,Y=`pair_${"b".repeat(64)}`,Z=`pair_${"c".repeat(64)}`;
const SX=`session_${"a".repeat(64)}`,SY=`session_${"b".repeat(64)}`,SZ=`session_${"c".repeat(64)}`;
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`,DC=`device_${"c".repeat(32)}`,DD=`device_${"d".repeat(32)}`;
const PA=`profile_${"1".repeat(24)}`,PB=`profile_${"2".repeat(24)}`,PD=`profile_${"5".repeat(24)}`;
const SA=`save_${"3".repeat(24)}`,SB=`save_${"4".repeat(24)}`,SD=`save_${"6".repeat(24)}`;
const forgedId=n=>`pair_${"e".repeat(62)}${String(n).padStart(2,"0")}`;

let checks=0;
async function check(id,label,fn){await fn();checks+=1;process.stdout.write(`ok ${checks} ${id} ${label}\n`);}

function sdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp};}
function readerSdk(counter){return {doc,getDoc:(...args)=>{if(counter)counter.reads+=1;return getDoc(...args);}};}
function canonical(value){if(value===undefined||value===null)return null;if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};if(Array.isArray(value))return value.map(canonical);if(typeof value==="object"){const out={};for(const key of Object.keys(value).sort())out[key]=canonical(value[key]);return out;}return value;}
function hex(bytes){return Array.from(bytes,value=>value.toString(16).padStart(2,"0")).join("");}
async function digest(value){const bytes=new TextEncoder().encode(JSON.stringify(canonical(value)));const hash=await crypto.webcrypto.subtle.digest("SHA-256",bytes);return `sha256:${hex(new Uint8Array(hash))}`;}
async function envelope(objectType,objectId,revision,data,{accountId=A,deviceId=DA,updatedAt=Timestamp.fromMillis(Date.now()),priorHash=null}={}){return {schemaVersion:1,objectType,objectId,revision,parentRevision:revision===0?null:revision-1,lifecycleState:"live",contentHash:await digest({objectType,objectId,revision,data}),priorContentHash:revision===0?null:(priorHash||`sha256:${"0".repeat(64)}`),updatedAt,updatedByAccountId:accountId,updatedByDeviceId:deviceId,data,tombstone:null};}
async function account(uid,status="active"){const now=Timestamp.fromMillis(Date.now()-120000);return envelope("account",uid,0,{status,createdAt:now,deletionRequestedAt:null},{accountId:uid,deviceId:null,updatedAt:now});}
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
const RESULT={playerOne:{leaguePosition:1,leaguePoints:102,leagueGoals:89,domesticCup:false,championsLeague:false,topScorer:true,topAssist:false},playerTwo:{leaguePosition:3,leaguePoints:88,leagueGoals:85,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false}};

async function seed(env,now){await env.withSecurityRulesDisabled(async context=>{const db=context.firestore();
  for(const [uid,id,seedChar,status] of [[A,DA,"a","active"],[B,DB,"b","active"],[C,DC,"c","active"],[D,DD,"d","deletion-requested"]]){await setDoc(doc(db,"accounts",uid),await account(uid,status));await setDoc(doc(db,"accounts",uid,"devices",id),await device(uid,id,seedChar));}
  for(const [id,sid] of [[X,SX],[Y,SY],[Z,SZ]]){await setDoc(doc(db,"rivalries",id),await rivalry(id));await setDoc(doc(db,"rivalries",id,"sessions",sid),await session(id,sid,now));}
  await setDoc(doc(db,"accounts",A,"pairLinks","current"),await pairLink(A,Y,"playerOne","daniel",DA));
});}

// One-season Showdown through the real providers, up to Daniel publishing his season result (COLLECTING).
async function playToCollecting(env,rivalryId,sessionId,nowMs){
  const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
  const a=t=>base(dbA,A,DA,rivalryId,sessionId,nowMs+t),b=t=>base(dbB,B,DB,rivalryId,sessionId,nowMs+t);
  for(const [type,baseRevision,n,extra] of [["open",0,1,{}],["commit-league",1,2,{}],["commit-clubs",2,3,{}],["commit-length",3,4,{totalSeasons:1}]]){const v=await Setup.mutate({...a(n*10),type,baseRevision,operationId:op("setup_op_",n),...extra});assert.equal(v.ok,true,JSON.stringify(v));}
  let v=await Setup.mutate({...a(50),type:"confirm",baseRevision:4,operationId:op("setup_op_",5)});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Setup.mutate({...b(60),type:"confirm",baseRevision:5,operationId:op("setup_op_",6)});assert.equal(v.ok,true,JSON.stringify(v));assert.equal(v.state.phase,"SHOWDOWN_CONFIRMED");
  v=await Career.acknowledge({...a(70),operationId:op("career_start_op_",1),baseRevision:0});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Career.acknowledge({...b(80),operationId:op("career_start_op_",2),baseRevision:1});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Transfer.startWindow({...a(100),seasonNumber:1,operationId:op("transfer_op_",1),baseRevision:0});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Transfer.requestEndWindow({...a(110),seasonNumber:1,operationId:op("transfer_op_",2),baseRevision:1});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Transfer.requestEndWindow({...b(120),seasonNumber:1,operationId:op("transfer_op_",3),baseRevision:2});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Transfer.lockGuesses({...a(130),seasonNumber:1,operationId:op("transfer_op_",4),baseRevision:3,guesses:[{slot:1,type:"league",valueId:"england-premier-league"}]});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Transfer.lockGuesses({...b(140),seasonNumber:1,operationId:op("transfer_op_",5),baseRevision:4,guesses:[{slot:1,type:"nationality",valueId:"brazil"}]});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Transfer.lockSignings({...a(150),seasonNumber:1,operationId:op("transfer_op_",6),baseRevision:5,signings:[{slot:1,name:"Daniel signing",leagueId:"spain-primera-division",nationalityId:"england"}]});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Transfer.lockSignings({...b(160),seasonNumber:1,operationId:op("transfer_op_",7),baseRevision:6,signings:[{slot:1,name:"Nik signing",leagueId:"england-premier-league",nationalityId:"brazil"}]});assert.equal(v.ok,true,JSON.stringify(v));assert.equal(v.state.phase,"COMPLETED");
  v=await Results.publishResult({...a(200),seasonNumber:1,operationId:op("season_result_op_",1),baseRevision:0,result:RESULT.playerOne});assert.equal(v.ok,true,JSON.stringify(v));
  return {dbA,dbB,a,b};
}
async function finishAndClose(game,sessionId){
  const {a,b}=game;
  let v=await Results.publishResult({...b(210),seasonNumber:1,operationId:op("season_result_op_",2),baseRevision:1,result:RESULT.playerTwo});assert.equal(v.ok,true,JSON.stringify(v));assert.equal(v.state.phase,"RESULTS_READY");
  v=await Commit.commitSeason({...a(220),seasonNumber:1,operationId:op("season_commit_op_",1),baseRevision:0});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Commit.acknowledgeSeason({...b(230),seasonNumber:1,operationId:op("season_commit_op_",2),baseRevision:1});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Commit.acknowledgeSeason({...a(240),seasonNumber:1,operationId:op("season_commit_op_",3),baseRevision:2});assert.equal(v.ok,true,JSON.stringify(v));assert.equal(v.phase,"ACKNOWLEDGED");
  const history=await History.read({...a(250),throughSeason:1});assert.equal(history.ok,true,JSON.stringify(history));
  const multi=await Multi.read(a(260));
  const final=Final.reconcile({sharedActive:true,multiSeason:multi,history,localReconciliation:localAuthority("playerOne")});assert.equal(final.phase,"FINAL_SEASON_RECONCILED");
  const closed=await TerminalProvider.close({...a(300),intent:Terminal.prepare(final,{sessionId})});assert.equal(closed.ok,true,JSON.stringify(closed));assert.equal(closed.rivalryState,"closed");
  return {sessionHistory:history.projection};
}
async function abandonAsDaniel(db,rivalryId){
  const before=(await getDoc(doc(db,"rivalries",rivalryId))).data();
  const data={...before.data,connectionState:"closed"};
  const after=await envelope("rivalry",rivalryId,before.revision+1,data,{accountId:A,deviceId:DA,priorHash:before.contentHash});
  await assertSucceeds(setDoc(doc(db,"rivalries",rivalryId),after));
}
async function forge(env,id,mutate){
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore(),real=(await getDoc(doc(db,"rivalries",X))).data();
    const data=JSON.parse(JSON.stringify({...real.data,createdAt:null}));data.createdAt=real.data.createdAt;data.terminalClose.rivalryId=id;
    let lifecycleState="live";mutate(data,{setLifecycle:value=>{lifecycleState=value;}});
    const value=await envelope("rivalry",id,real.revision,data,{accountId:A,deviceId:DA,priorHash:real.priorContentHash});value.lifecycleState=lifecycleState;
    await setDoc(doc(db,"rivalries",id),value);
  });
}

async function run(env){
  const now=Date.now();
  await seed(env,now);
  const anon=env.unauthenticatedContext().firestore();
  const dbC=env.authenticatedContext(C).firestore();

  // Showdown X: completed with a real Terminal Close. Showdown Y: abandoned mid-season. Showdown Z: active, season COLLECTING.
  const gameX=await playToCollecting(env,X,SX,now);const {sessionHistory}=await finishAndClose(gameX,SX);
  const gameY=await playToCollecting(env,Y,SY,now+1000);await abandonAsDaniel(gameY.dbA,Y);
  await playToCollecting(env,Z,SZ,now+2000);
  const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();

  await check("I0","composed Rules carry the completed-only grant on exactly setup, season results, result roles and season commits",async()=>{
    assert.equal((RULES.match(/allow get: if ssjrEntitled\(rivalryId\) \|\| cmsCompletedShowdownReadable\(rivalryId\);/g)||[]).length,1);
    assert.equal((RULES.match(/allow get: if ssjrEntitled\(rivalryId\) \|\| cmsCompletedSeasonReadable\(rivalryId, seasonId\);/g)||[]).length,2);
    assert.match(RULES,/allow get: if ssjrResultsPrivateReadable\(rivalryId, seasonId, managerRole\)\n\s+\|\| \(managerRole in \['playerOne', 'playerTwo'\] && cmsCompletedSeasonReadable\(rivalryId, seasonId\)\);/);
    assert.equal(/allow (create|update|delete|list|write)[^\n]*cmsCompleted/.test(RULES),false);
    for(const marker of ["match /accounts/{accountId}/pairLinks/{pairId}","match /accounts/{accountId}/careerIndex/{indexId}","function ssjrTerminalValidIntent(rivalryId, intent)"])assert.ok(RULES.includes(marker),marker);
  });

  // A. Completed Showdown X: both managers read the final, already-shared results without a session.
  await check("A1","Daniel reads X setup with no live session (X session is closed)",async()=>{
    let sessionState;await env.withSecurityRulesDisabled(async context=>{sessionState=(await getDoc(doc(context.firestore(),"rivalries",X,"sessions",SX))).data().data.state;});
    assert.equal(sessionState,"closed");
    const snap=await assertSucceeds(getDoc(doc(dbA,"rivalries",X,"sharedSetup","authoritative")));assert.equal(snap.data().phase,"SHOWDOWN_CONFIRMED");
  });
  await check("A2","Nik reads X setup",async()=>{await assertSucceeds(getDoc(doc(dbB,"rivalries",X,"sharedSetup","authoritative")));});
  await check("A3","Daniel reads X season_1 commit",async()=>{const snap=await assertSucceeds(getDoc(doc(dbA,"rivalries",X,"seasonCommits","season_1")));assert.equal(snap.data().phase,"ACKNOWLEDGED");});
  await check("A4","Nik reads X season_1 commit",async()=>{await assertSucceeds(getDoc(doc(dbB,"rivalries",X,"seasonCommits","season_1")));});
  await check("A5","Nik reads X season_1 public results",async()=>{await assertSucceeds(getDoc(doc(dbB,"rivalries",X,"seasonResults","season_1")));});
  await check("A6","Daniel reads Nik's final season_1 result (shared at RESULTS_READY)",async()=>{await assertSucceeds(getDoc(doc(dbA,"rivalries",X,"seasonResults","season_1","roles","playerTwo")));});
  await check("A7","Nik reads Daniel's final season_1 result",async()=>{await assertSucceeds(getDoc(doc(dbB,"rivalries",X,"seasonResults","season_1","roles","playerOne")));});

  // B. Still denied on the completed Showdown.
  await check("B1","stranger cannot read X setup",async()=>{await assertFails(getDoc(doc(dbC,"rivalries",X,"sharedSetup","authoritative")));});
  await check("B2","stranger cannot read X season_1 commit",async()=>{await assertFails(getDoc(doc(dbC,"rivalries",X,"seasonCommits","season_1")));});
  await check("B3","stranger cannot read X result roles",async()=>{await assertFails(getDoc(doc(dbC,"rivalries",X,"seasonResults","season_1","roles","playerOne")));});
  await check("B4","unauthenticated read of X setup is denied",async()=>{await assertFails(getDoc(doc(anon,"rivalries",X,"sharedSetup","authoritative")));});
  await check("B5","season_2 of a 1-season Showdown is outside the grant",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",X,"seasonCommits","season_2")));});
  await check("B6","malformed season id season_01 is outside the grant",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",X,"seasonResults","season_01")));});
  await check("B7","listing X season commits is denied",async()=>{await assertFails(getDocs(collection(dbA,"rivalries",X,"seasonCommits")));});
  await check("B8","X transfer challenge is readable through the G-10 completed transfer grant",async()=>{const snap=await assertSucceeds(getDoc(doc(dbA,"rivalries",X,"transferChallenges","season_1")));assert.equal(snap.data().phase,"COMPLETED");});
  await check("B9","X transfer role is readable through the G-10 grant only because season_1 is COMPLETED",async()=>{const snap=await assertSucceeds(getDoc(doc(dbB,"rivalries",X,"transferChallenges","season_1","roles","playerOne")));assert.equal(snap.data().managerRole,"playerOne");});
  await check("B10","X career start stays outside the grant",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",X,"careerStart","authoritative")));});
  await check("B11","X league projection stays outside the grant",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",X,"sharedSetup","leagueProjection")));});
  await check("B12","unknown role id playerThree is outside the grant",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",X,"seasonResults","season_1","roles","playerThree")));});

  // C. Closed writes stay denied.
  let stored;await env.withSecurityRulesDisabled(async context=>{const db=context.firestore();stored={setup:(await getDoc(doc(db,"rivalries",X,"sharedSetup","authoritative"))).data(),commit:(await getDoc(doc(db,"rivalries",X,"seasonCommits","season_1"))).data(),role:(await getDoc(doc(db,"rivalries",X,"seasonResults","season_1","roles","playerTwo"))).data()};});
  await check("C1","Daniel cannot rewrite X setup",async()=>{await assertFails(setDoc(doc(dbA,"rivalries",X,"sharedSetup","authoritative"),{...stored.setup,revision:7}));});
  await check("C2","Nik cannot create X season_2 commit",async()=>{await assertFails(setDoc(doc(dbB,"rivalries",X,"seasonCommits","season_2"),{...stored.commit,seasonNumber:2}));});
  await check("C3","Daniel cannot update X season_1 commit",async()=>{await assertFails(setDoc(doc(dbA,"rivalries",X,"seasonCommits","season_1"),{...stored.commit}));});
  await check("C4","Daniel cannot delete X setup",async()=>{await assertFails(deleteDoc(doc(dbA,"rivalries",X,"sharedSetup","authoritative")));});
  await check("C5","Nik cannot rewrite his X result role",async()=>{await assertFails(setDoc(doc(dbB,"rivalries",X,"seasonResults","season_1","roles","playerTwo"),{...stored.role}));});

  // D. Abandoned Showdown Y (closed without Terminal Close): nothing below the root is readable.
  await check("D1","Daniel cannot read abandoned Y setup",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",Y,"sharedSetup","authoritative")));});
  await check("D2","Nik cannot read abandoned Y season results",async()=>{await assertFails(getDoc(doc(dbB,"rivalries",Y,"seasonResults","season_1")));});
  await check("D3","Nik cannot read Daniel's unfinished Y result",async()=>{await assertFails(getDoc(doc(dbB,"rivalries",Y,"seasonResults","season_1","roles","playerOne")));});
  await check("D4","Daniel cannot read his own Y result after abandon",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",Y,"seasonResults","season_1","roles","playerOne")));});
  await check("D5","Daniel still reads the Y root (History status row)",async()=>{const snap=await assertSucceeds(getDoc(doc(dbA,"rivalries",Y)));assert.equal(snap.data().data.connectionState,"closed");assert.equal(Object.hasOwn(snap.data().data,"terminalClose"),false);});
  await check("D6","Daniel cannot read Nik's Y transfer role",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",Y,"transferChallenges","season_1","roles","playerTwo")));});

  // E. Forged or partial terminal witnesses (roots seeded with Rules disabled; children absent, so an allowed get returns not-found).
  await forge(env,forgedId(0),()=>{});
  await forge(env,forgedId(1),data=>{delete data.terminalClose;});
  await forge(env,forgedId(2),data=>{data.terminalClose.winner=data.terminalClose.winner==="playerOne"?"playerTwo":"playerOne";});
  await forge(env,forgedId(3),data=>{data.terminalProgress.closedSessionRevision=null;});
  await forge(env,forgedId(4),data=>{for(const t of [data.terminalClose,data.terminalProgress])t.totalSeasons=3;data.terminalClose.completedSeason=3;data.terminalProgress.acceptedThroughSeason=1;});
  await forge(env,forgedId(5),data=>{data.terminalProgress.managerTotals={...data.terminalProgress.managerTotals,playerTwo:data.terminalProgress.managerTotals.playerTwo+1};});
  await forge(env,forgedId(6),data=>{data.terminalClose.rivalryId=X;});
  await forge(env,forgedId(7),data=>{data.terminalClose.extra=true;});
  await forge(env,forgedId(8),(data,tools)=>{tools.setLifecycle("tombstoned");});
  await forge(env,forgedId(9),data=>{data.authorizedAccountIds=[A,D];data.managerSlots=[data.managerSlots[0],{...data.managerSlots[1],accountId:D,profileId:PD,saveId:SD}];});
  await forge(env,forgedId(10),data=>{delete data.terminalProgress;});
  const setupOf=(db,id)=>getDoc(doc(db,"rivalries",id,"sharedSetup","authoritative"));
  const dbD=env.authenticatedContext(D).firestore();
  await check("E0","control: a correctly witnessed forged copy is readable (grant keys on the witness, not on the id)",async()=>{await assertSucceeds(setupOf(dbA,forgedId(0)));});
  await check("E1","closed with terminalProgress but no terminalClose is denied",async()=>{await assertFails(setupOf(dbA,forgedId(1)));});
  await check("E2","witness whose winner contradicts its totals is denied",async()=>{await assertFails(setupOf(dbA,forgedId(2)));});
  await check("E3","witness without a closed session revision is denied",async()=>{await assertFails(setupOf(dbA,forgedId(3)));});
  await check("E4","witness with fewer accepted seasons than configured is denied",async()=>{await assertFails(setupOf(dbA,forgedId(4)));});
  await check("E5","intent totals that differ from progress totals are denied",async()=>{await assertFails(setupOf(dbA,forgedId(5)));});
  await check("E6","witness naming another rivalry is denied",async()=>{await assertFails(setupOf(dbA,forgedId(6)));});
  await check("E7","witness with an extra key is denied",async()=>{await assertFails(setupOf(dbA,forgedId(7)));});
  await check("E8","tombstoned root is denied",async()=>{await assertFails(setupOf(dbA,forgedId(8)));});
  await check("E9","member whose account is not active is denied",async()=>{await assertFails(setupOf(dbD,forgedId(9)));});
  await check("E10","closed with terminalClose but no terminalProgress is denied",async()=>{await assertFails(setupOf(dbA,forgedId(10)));});

  // F. Active Showdown Z regressions: the existing session-free active reads and privacy are unchanged.
  await check("F1","Daniel reads active Z setup (existing rule)",async()=>{await assertSucceeds(getDoc(doc(dbA,"rivalries",Z,"sharedSetup","authoritative")));});
  await check("F2","Nik cannot read Daniel's COLLECTING Z result",async()=>{await assertFails(getDoc(doc(dbB,"rivalries",Z,"seasonResults","season_1","roles","playerOne")));});
  await check("F3","Daniel reads his own COLLECTING Z result",async()=>{await assertSucceeds(getDoc(doc(dbA,"rivalries",Z,"seasonResults","season_1","roles","playerOne")));});
  await check("F4","stranger cannot read active Z setup",async()=>{await assertFails(getDoc(doc(dbC,"rivalries",Z,"sharedSetup","authoritative")));});

  // P. Session-free provider reader.
  const Reader=loadReader();
  const read=(db,uid,id,counter)=>Reader.readCompletedShowdown({firestore:db,firebaseSdk:readerSdk(counter),user:{uid},rivalryId:id,cryptoImpl:crypto.webcrypto});
  let danielX;
  await check("P1","Daniel's reader: X completed, totals equal the Terminal Close witness, one season",async()=>{
    danielX=await read(dbA,A,X);
    assert.equal(danielX.status,"completed",JSON.stringify(danielX));assert.equal(danielX.code,null);assert.equal(danielX.managerRole,"playerOne");
    assert.equal(Object.isFrozen(danielX),true);HistoryProtocol.verifyProjection(danielX.projection);
    assert.deepEqual(danielX.final.totals,danielX.terminalWitness.managerTotals);assert.equal(danielX.final.winner,danielX.terminalWitness.winner);assert.equal(danielX.final.seasonsPlayed,1);
    assert.deepEqual(danielX.final,{totals:{playerOne:5,playerTwo:0},winner:"playerOne",margin:5,seasonsPlayed:1});
  });
  await check("P2","Nik's reader returns the identical projection and final result",async()=>{const nikX=await read(dbB,B,X);assert.equal(nikX.status,"completed");assert.equal(nikX.managerRole,"playerTwo");assert.deepEqual(nikX.projection,danielX.projection);assert.deepEqual(nikX.final,danielX.final);});
  await check("P3","fresh authenticated client, no session or device input: same projection",async()=>{const fresh=env.authenticatedContext(A).firestore();const again=await read(fresh,A,X);assert.equal(again.status,"completed");assert.deepEqual(again.projection,danielX.projection);});
  await check("P4","session-free projection equals the session-bound history projection taken before close",async()=>{assert.deepEqual(danielX.projection,sessionHistory);});
  await check("P5","abandoned Y: status only, exactly one read (the root)",async()=>{const counter={reads:0};const y=await read(dbB,B,Y,counter);assert.equal(y.status,"abandoned");assert.equal(y.projection,null);assert.equal(y.final,null);assert.equal(counter.reads,1);});
  await check("P6","active Z: not-closed, exactly one read",async()=>{const counter={reads:0};const z=await read(dbA,A,Z,counter);assert.equal(z.status,"not-closed");assert.equal(counter.reads,1);});
  await check("P7","stranger: unavailable with the Firestore denial code, never empty",async()=>{const s=await read(dbC,C,X);assert.equal(s.status,"unavailable");assert.equal(s.code,"permission-denied");assert.equal(s.projection,null);});
  await check("P8","forged winner witness: unavailable before any child read",async()=>{const counter={reads:0};const f=await read(dbA,A,forgedId(2),counter);assert.equal(f.status,"unavailable");assert.equal(f.code,"COMPLETED_TERMINAL_WITNESS_INVALID");assert.equal(counter.reads,1);});
  await check("P9","witness totals that disagree with the rebuilt seasons: unavailable",async()=>{
    await env.withSecurityRulesDisabled(async context=>{const db=context.firestore(),real=(await getDoc(doc(db,"rivalries",X))).data();const data={...real.data,terminalClose:{...real.data.terminalClose,managerTotals:{playerOne:6,playerTwo:0}},terminalProgress:{...real.data.terminalProgress,managerTotals:{playerOne:6,playerTwo:0}}};await setDoc(doc(db,"rivalries",X),{...real,data,contentHash:await digest({objectType:"rivalry",objectId:X,revision:real.revision,data})});});
    await assertSucceeds(getDoc(doc(dbA,"rivalries",X,"seasonCommits","season_1")));
    const t=await read(dbA,A,X);assert.equal(t.status,"unavailable");assert.equal(t.code,"COMPLETED_TOTALS_MISMATCH");
  });
  await check("P10","a missing season commit makes the Showdown unavailable, never shorter",async()=>{
    await env.withSecurityRulesDisabled(async context=>{await deleteDoc(doc(context.firestore(),"rivalries",X,"seasonCommits","season_1"));});
    const m=await read(dbB,B,X);assert.equal(m.status,"unavailable");assert.equal(m.code,"COMPLETED_SEASON_MISSING");assert.equal(m.projection,null);
  });
}

(async()=>{const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});try{await env.clearFirestore();await run(env);assert.equal(checks,56);process.stdout.write(`PASS completed-only read emulator: ${checks} numbered checks (I0, A completed reads, B denials, C closed writes, D abandoned, E forged witnesses, F active regressions, P session-free reader).\n`);}finally{await env.cleanup();}})().catch(error=>{console.error(error.stack||error);process.exit(1);});

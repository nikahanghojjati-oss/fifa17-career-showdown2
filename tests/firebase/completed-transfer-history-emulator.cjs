"use strict";
// JOB-10 completed-only transfer history, against the COMPOSED production Rules
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
const Scoring=require("../../js/sparkSharedCanonicalScoring.js");
const History=require("../../js/sparkSharedHistoryConvergence.js");
const Multi=require("../../js/sparkSharedMultiSeasonProgression.js");
const Final=require("../../js/sharedFinalReconciliation.js");
const Terminal=require("../../js/sharedTerminalClose.js");
const TerminalProvider=require("../../js/sparkTerminalClose.js");
const Sessions=require("../../js/sparkPrivateSession.js");
const Catalog=require("../../js/sharedShowdownCatalog.js");
const CompletedReader=require("../../js/sparkCompletedShowdownReader.js");
// Loaded only for section P, so sections I0-F report on the Rules before the client exists (tests-first).
const loadReader=()=>require("../../js/sparkCompletedTransferHistoryReader.js");

const PROJECT_ID=process.env.GCLOUD_PROJECT||"demo-cms-completed-transfer";
const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const A="acct_daniel",B="acct_nik",C="acct_stranger",D="acct_inactive";
const X=`pair_${"a".repeat(64)}`,Y=`pair_${"b".repeat(64)}`,W=`pair_${"d".repeat(64)}`,Z=`pair_${"c".repeat(64)}`;
const SX=`session_${"a".repeat(64)}`,SY=`session_${"b".repeat(64)}`,SW=`session_${"d".repeat(64)}`,SZ=`session_${"c".repeat(64)}`;
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
// Daniel 5+1+5 = 11, Nik 0+3+1 = 4 (JOB-02 journey numbers).
function journeyResult(role,season){if(role==="playerOne")return {leaguePosition:season===1?1:2,leaguePoints:season===1?102:90+season,leagueGoals:88+season,domesticCup:season===2,championsLeague:season===3,topScorer:season===1,topAssist:false};return {leaguePosition:season===2?1:3,leaguePoints:87+season,leagueGoals:84+season,domesticCup:false,championsLeague:false,topScorer:false,topAssist:season===3};}
// Season 1: Nik guesses Daniel's signing nationality (released). Season 2: two Nik signings, one released. Season 3: empty rows.
const INPUTS=[
  {guesses:{playerOne:[{slot:1,type:"league",valueId:"england-premier-league"}],playerTwo:[{slot:1,type:"league",valueId:"germany-bundesliga"},{slot:2,type:"nationality",valueId:"england"}]},signings:{playerOne:[{slot:1,name:"Daniel S1",leagueId:"spain-primera-division",nationalityId:"england"}],playerTwo:[{slot:1,name:"Nik S1",leagueId:"italy-serie-a",nationalityId:"brazil"}]}},
  {guesses:{playerOne:[{slot:1,type:"nationality",valueId:"brazil"}],playerTwo:[{slot:1,type:"league",valueId:"france-ligue-1"}]},signings:{playerOne:[{slot:1,name:"Daniel S2",leagueId:"germany-bundesliga",nationalityId:"france"}],playerTwo:[{slot:1,name:"Nik S2",leagueId:"england-premier-league",nationalityId:"brazil"},{slot:2,name:"Nik S2 B",leagueId:"italy-serie-a",nationalityId:"germany"}]}},
  {guesses:{playerOne:[],playerTwo:[]},signings:{playerOne:[],playerTwo:[]}}
];

async function seed(env,now){await env.withSecurityRulesDisabled(async context=>{const db=context.firestore();
  for(const [uid,id,seedChar,status] of [[A,DA,"a","active"],[B,DB,"b","active"],[C,DC,"c","active"],[D,DD,"d","deletion-requested"]]){await setDoc(doc(db,"accounts",uid),await account(uid,status));await setDoc(doc(db,"accounts",uid,"devices",id),await device(uid,id,seedChar));}
  for(const [id,sid] of [[X,SX],[Y,SY],[W,SW],[Z,SZ]]){await setDoc(doc(db,"rivalries",id),await rivalry(id));await setDoc(doc(db,"rivalries",id,"sessions",sid),await session(id,sid,now));}
});}
async function setPairLink(env,rivalryId){await env.withSecurityRulesDisabled(async context=>{await setDoc(doc(context.firestore(),"accounts",A,"pairLinks","current"),await pairLink(A,rivalryId,"playerOne","daniel",DA));});}

// One Showdown through the real providers: setup + career start, then `seasons` scripted per season.
async function startShowdown(env,{rivalryId,sessionId,nowMs,totalSeasons,opBase}){
  const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
  const a=t=>base(dbA,A,DA,rivalryId,sessionId,nowMs+t),b=t=>base(dbB,B,DB,rivalryId,sessionId,nowMs+t),n=k=>opBase+k;
  for(const [type,baseRevision,k,extra] of [["open",0,1,{}],["commit-league",1,2,{}],["commit-clubs",2,3,{}],["commit-length",3,4,{totalSeasons}]]){const v=await Setup.mutate({...a(k*10),type,baseRevision,operationId:op("setup_op_",n(k)),...extra});assert.equal(v.ok,true,`setup ${type}: ${JSON.stringify(v)}`);}
  let v=await Setup.mutate({...a(50),type:"confirm",baseRevision:4,operationId:op("setup_op_",n(5))});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Setup.mutate({...b(60),type:"confirm",baseRevision:5,operationId:op("setup_op_",n(6))});assert.equal(v.ok,true,JSON.stringify(v));assert.equal(v.state.phase,"SHOWDOWN_CONFIRMED");
  const teamCount=Catalog.catalog[v.state.leagueId].length;
  v=await Career.acknowledge({...a(70),operationId:op("career_start_op_",n(1)),baseRevision:0});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Career.acknowledge({...b(80),operationId:op("career_start_op_",n(2)),baseRevision:1});assert.equal(v.ok,true,JSON.stringify(v));
  return {dbA,dbB,a,b,n,teamCount,rivalryId,sessionId};
}
const STOP={COMPLETED:7,DANIEL_SIGNED:6};
async function transferSeason(game,season,inputs,stopAfter=STOP.COMPLETED){
  const {a,b,n}=game,t=season*10000,k=x=>n(season*10+x);
  const steps=[
    ()=>Transfer.startWindow({...a(t+100),seasonNumber:season,operationId:op("transfer_op_",k(1)),baseRevision:0}),
    ()=>Transfer.requestEndWindow({...a(t+200),seasonNumber:season,operationId:op("transfer_op_",k(2)),baseRevision:1}),
    ()=>Transfer.requestEndWindow({...b(t+300),seasonNumber:season,operationId:op("transfer_op_",k(3)),baseRevision:2}),
    ()=>Transfer.lockGuesses({...a(t+400),seasonNumber:season,operationId:op("transfer_op_",k(4)),baseRevision:3,guesses:inputs.guesses.playerOne}),
    ()=>Transfer.lockGuesses({...b(t+500),seasonNumber:season,operationId:op("transfer_op_",k(5)),baseRevision:4,guesses:inputs.guesses.playerTwo}),
    ()=>Transfer.lockSignings({...a(t+600),seasonNumber:season,operationId:op("transfer_op_",k(6)),baseRevision:5,signings:inputs.signings.playerOne}),
    ()=>Transfer.lockSignings({...b(t+700),seasonNumber:season,operationId:op("transfer_op_",k(7)),baseRevision:6,signings:inputs.signings.playerTwo})
  ];
  let v;for(let i=0;i<stopAfter;i+=1){v=await steps[i]();assert.equal(v.ok,true,`S${season} transfer step ${i+1}: ${JSON.stringify(v)}`);}
  if(stopAfter===STOP.COMPLETED)assert.equal(v.state.phase,"COMPLETED");
  return v;
}
async function seasonResults(game,season,{danielOnly=false}={}){
  const {a,b,n}=game,t=season*10000,k=x=>n(season*10+x);
  let v=await Results.publishResult({...a(t+800),seasonNumber:season,operationId:op("season_result_op_",k(1)),baseRevision:0,result:journeyResult("playerOne",season)});assert.equal(v.ok,true,JSON.stringify(v));
  if(danielOnly)return;
  v=await Results.publishResult({...b(t+900),seasonNumber:season,operationId:op("season_result_op_",k(2)),baseRevision:1,result:journeyResult("playerTwo",season)});assert.equal(v.ok,true,JSON.stringify(v));assert.equal(v.state.phase,"RESULTS_READY");
  v=await Commit.commitSeason({...a(t+1000),seasonNumber:season,operationId:op("season_commit_op_",k(1)),baseRevision:0});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Commit.acknowledgeSeason({...b(t+1100),seasonNumber:season,operationId:op("season_commit_op_",k(2)),baseRevision:1});assert.equal(v.ok,true,JSON.stringify(v));
  v=await Commit.acknowledgeSeason({...a(t+1200),seasonNumber:season,operationId:op("season_commit_op_",k(3)),baseRevision:2});assert.equal(v.ok,true,JSON.stringify(v));assert.equal(v.phase,"ACKNOWLEDGED");
  const scored=await Scoring.read({...a(t+1300),seasonNumber:season,teamCount:game.teamCount});assert.equal(scored.ok,true,JSON.stringify(scored));
}
async function abandonAsDaniel(env,rivalryId){
  await setPairLink(env,rivalryId);
  const db=env.authenticatedContext(A).firestore(),before=(await getDoc(doc(db,"rivalries",rivalryId))).data();
  const after=await envelope("rivalry",rivalryId,before.revision+1,{...before.data,connectionState:"closed"},{accountId:A,deviceId:DA,priorHash:before.contentHash});
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
// Seeds transferChallenges/season_k under a forged (correctly witnessed) root from X's real season_k ledger, then mutates it.
async function forgeChallenge(env,id,seasonNumber,mutate,{fromSeason=seasonNumber}={}){
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore(),real=(await getDoc(doc(db,"rivalries",X,"transferChallenges",`season_${fromSeason}`))).data();
    const value={...real,rivalryId:id,seasonNumber};if(mutate)mutate(value);
    await setDoc(doc(db,"rivalries",id,"transferChallenges",`season_${seasonNumber}`),value);
  });
}

async function run(env){
  const now=Date.now();
  await seed(env,now);
  const anon=env.unauthenticatedContext().firestore();
  const dbC=env.authenticatedContext(C).firestore();

  // X: 3 seasons, transfers varied per season, closed by a real Terminal Close. Session-bound verdicts captured before close.
  const gx=await startShowdown(env,{rivalryId:X,sessionId:SX,nowMs:now,totalSeasons:3,opBase:0});
  const sessionVerdicts=[];let history=null,multi=null;
  for(let season=1;season<=3;season+=1){
    await transferSeason(gx,season,INPUTS[season-1]);
    const ta=await Transfer.read({...gx.a(season*10000+750),seasonNumber:season}),tb=await Transfer.read({...gx.b(season*10000+750),seasonNumber:season});
    assert.equal(ta.ok,true,JSON.stringify(ta));assert.deepEqual(ta.verdicts,tb.verdicts);sessionVerdicts.push(ta.verdicts);
    await seasonResults(gx,season);
    history=await History.read({...gx.a(season*10000+1400),throughSeason:season});assert.equal(history.ok,true,JSON.stringify(history));
    multi=await Multi.read(gx.a(season*10000+1500));assert.equal(multi.ok,true,JSON.stringify(multi));
  }
  const final=Final.reconcile({sharedActive:true,multiSeason:multi,history,localReconciliation:localAuthority("playerOne")});assert.equal(final.phase,"FINAL_SEASON_RECONCILED");
  const closed=await TerminalProvider.close({...gx.a(32000),intent:Terminal.prepare(final,{sessionId:SX})});assert.equal(closed.ok,true,JSON.stringify(closed));assert.equal(closed.rivalryState,"closed");

  // Y: 1 season, transfer COMPLETED and Daniel's result published, then abandoned. While active, Nik could read Daniel's COMPLETED role.
  const gy=await startShowdown(env,{rivalryId:Y,sessionId:SY,nowMs:now+1000,totalSeasons:1,opBase:1000});
  await transferSeason(gy,1,INPUTS[0]);await seasonResults(gy,1,{danielOnly:true});
  await assertSucceeds(getDoc(doc(gy.dbB,"rivalries",Y,"transferChallenges","season_1","roles","playerOne")));
  await abandonAsDaniel(env,Y);
  // W: 1 season, abandoned during SIGNING_ENTRY after Daniel locked his signings (unfinished challenge).
  const gw=await startShowdown(env,{rivalryId:W,sessionId:SW,nowMs:now+2000,totalSeasons:1,opBase:2000});
  const signed=await transferSeason(gw,1,INPUTS[1],STOP.DANIEL_SIGNED);assert.equal(signed.state.phase,"SIGNING_ENTRY");
  await abandonAsDaniel(env,W);
  // Z: 3 seasons, active. Season 1 acknowledged; season 2 transfer in SIGNING_ENTRY with Daniel's signings locked.
  const gz=await startShowdown(env,{rivalryId:Z,sessionId:SZ,nowMs:now+3000,totalSeasons:3,opBase:3000});
  await transferSeason(gz,1,INPUTS[0]);await seasonResults(gz,1);
  const zSigned=await transferSeason(gz,2,INPUTS[1],STOP.DANIEL_SIGNED);assert.equal(zSigned.state.phase,"SIGNING_ENTRY");
  const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
  const T=(db,id,k,role)=>role?doc(db,"rivalries",id,"transferChallenges",`season_${k}`,"roles",role):doc(db,"rivalries",id,"transferChallenges",`season_${k}`);

  await check("I0","composed Rules carry the transfer grant on exactly the challenge get and the COMPLETED-gated role get",async()=>{
    assert.equal((RULES.match(/allow get: if ssjrEntitled\(rivalryId\) \|\| cmsCompletedSeasonReadable\(rivalryId, transferId\);/g)||[]).length,1);
    assert.match(RULES,/allow get: if ssjrTransferPrivateReadable\(rivalryId, transferId, managerRole\)\n\s+\|\| \(managerRole in \['playerOne', 'playerTwo'\] && cmsCompletedTransferRoleReadable\(rivalryId, transferId\)\);/);
    assert.ok(RULES.includes("function cmsCompletedTransferRoleReadable(rivalryId, transferId)"));
    assert.equal(/allow (create|update|delete|list|write)[^\n]*cmsCompleted/.test(RULES),false);
    for(const marker of ["match /accounts/{accountId}/pairLinks/{pairId}","match /accounts/{accountId}/careerIndex/{indexId}","function cmsCompletedSeasonReadable(rivalryId, seasonId)","function ssjrTransferPrivateReadable(rivalryId, transferId, managerRole)"])assert.ok(RULES.includes(marker),marker);
  });

  // A. Completed Showdown X: both managers read the finished transfer history without a session.
  await check("A1","Daniel reads X season_1 challenge with no live session (X session is closed)",async()=>{
    let sessionState;await env.withSecurityRulesDisabled(async context=>{sessionState=(await getDoc(doc(context.firestore(),"rivalries",X,"sessions",SX))).data().data.state;});
    assert.equal(sessionState,"closed");
    const snap=await assertSucceeds(getDoc(T(dbA,X,1)));assert.equal(snap.data().phase,"COMPLETED");
  });
  await check("A2","Nik reads X season_3 challenge",async()=>{await assertSucceeds(getDoc(T(dbB,X,3)));});
  await check("A3","Daniel reads Nik's X season_1 transfer role (COMPLETED)",async()=>{const snap=await assertSucceeds(getDoc(T(dbA,X,1,"playerTwo")));assert.equal(snap.data().signings[0].name,"Nik S1");});
  await check("A4","Nik reads Daniel's X season_1 transfer role",async()=>{await assertSucceeds(getDoc(T(dbB,X,1,"playerOne")));});
  await check("A5","Daniel reads his own X season_2 transfer role",async()=>{await assertSucceeds(getDoc(T(dbA,X,2,"playerOne")));});
  await check("A6","Nik reads Daniel's X season_3 transfer role (empty rows)",async()=>{const snap=await assertSucceeds(getDoc(T(dbB,X,3,"playerOne")));assert.deepEqual(snap.data().signings,[]);});

  // B. Still denied on the completed Showdown.
  await check("B1","stranger cannot read X season_1 challenge",async()=>{await assertFails(getDoc(T(dbC,X,1)));});
  await check("B2","stranger cannot read Nik's X season_1 role",async()=>{await assertFails(getDoc(T(dbC,X,1,"playerTwo")));});
  await check("B3","unauthenticated read of an X transfer role is denied",async()=>{await assertFails(getDoc(T(anon,X,1,"playerOne")));});
  await check("B4","season_4 challenge of a 3-season Showdown is outside the grant",async()=>{await assertFails(getDoc(T(dbA,X,4)));});
  await check("B5","season_4 role of a 3-season Showdown is outside the grant",async()=>{await assertFails(getDoc(T(dbA,X,4,"playerTwo")));});
  await check("B6","malformed id transferChallenges/season_01 is outside the grant",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",X,"transferChallenges","season_01")));});
  await check("B7","unknown role id playerThree is outside the grant",async()=>{await assertFails(getDoc(T(dbA,X,1,"playerThree")));});
  await check("B8","listing X transfer challenges is denied",async()=>{await assertFails(getDocs(collection(dbA,"rivalries",X,"transferChallenges")));});
  await check("B9","listing X season_1 transfer roles is denied",async()=>{await assertFails(getDocs(collection(dbA,"rivalries",X,"transferChallenges","season_1","roles")));});
  await check("B10","an unmatched draft path under the challenge is denied",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",X,"transferChallenges","season_1","drafts","playerTwo")));});
  await check("B11","X career start stays outside every completed grant",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",X,"careerStart","authoritative")));});
  await check("B12","X league projection stays outside every completed grant",async()=>{await assertFails(getDoc(doc(dbA,"rivalries",X,"sharedSetup","leagueProjection")));});

  // C. Closed transfer writes stay denied.
  let stored;await env.withSecurityRulesDisabled(async context=>{const db=context.firestore();stored={challenge:(await getDoc(T(db,X,1))).data(),role:(await getDoc(T(db,X,1,"playerTwo"))).data()};});
  await check("C1","Daniel cannot update X season_1 challenge",async()=>{await assertFails(setDoc(T(dbA,X,1),{...stored.challenge,revision:8}));});
  await check("C2","Nik cannot rewrite his X season_1 role",async()=>{await assertFails(setDoc(T(dbB,X,1,"playerTwo"),{...stored.role,signings:[]}));});
  await check("C3","Daniel cannot create X season_4 challenge",async()=>{await assertFails(setDoc(T(dbA,X,4),{...stored.challenge,seasonNumber:4}));});
  await check("C4","Daniel cannot delete X season_1 challenge",async()=>{await assertFails(deleteDoc(T(dbA,X,1)));});
  await check("C5","Nik cannot delete Daniel's X season_2 role",async()=>{await assertFails(deleteDoc(T(dbB,X,2,"playerOne")));});

  // D. Abandoned Showdowns (closed without Terminal Close): no transfer history, finished or unfinished.
  await check("D1","Daniel cannot read abandoned Y season_1 challenge",async()=>{await assertFails(getDoc(T(dbA,Y,1)));});
  await check("D2","Nik cannot read Daniel's COMPLETED Y role after abandon (it was readable while active)",async()=>{await assertFails(getDoc(T(dbB,Y,1,"playerOne")));});
  await check("D3","Daniel cannot read his own Y role after abandon",async()=>{await assertFails(getDoc(T(dbA,Y,1,"playerOne")));});
  await check("D4","Nik cannot read Daniel's unfinished W role (SIGNING_ENTRY, Daniel signed)",async()=>{await assertFails(getDoc(T(dbB,W,1,"playerOne")));});
  await check("D5","Daniel cannot read his own W role after abandon",async()=>{await assertFails(getDoc(T(dbA,W,1,"playerOne")));});
  await check("D6","Daniel cannot read abandoned W challenge",async()=>{await assertFails(getDoc(T(dbA,W,1)));});
  await check("D7","Daniel still reads the Y root (History status row): closed, no terminalClose",async()=>{const snap=await assertSucceeds(getDoc(doc(dbA,"rivalries",Y)));assert.equal(snap.data().data.connectionState,"closed");assert.equal(Object.hasOwn(snap.data().data,"terminalClose"),false);});

  // E. Forged or partial terminal witnesses (roots seeded with Rules disabled; children absent, so an allowed get returns not-found).
  await forge(env,forgedId(0),()=>{});
  await forge(env,forgedId(1),data=>{delete data.terminalClose;});
  await forge(env,forgedId(2),data=>{data.terminalClose.winner=data.terminalClose.winner==="playerOne"?"playerTwo":"playerOne";});
  await forge(env,forgedId(3),data=>{data.terminalProgress.closedSessionRevision=null;});
  await forge(env,forgedId(4),data=>{data.terminalProgress.acceptedThroughSeason=2;});
  await forge(env,forgedId(5),data=>{data.terminalProgress.managerTotals={...data.terminalProgress.managerTotals,playerTwo:data.terminalProgress.managerTotals.playerTwo+1};});
  await forge(env,forgedId(6),data=>{data.terminalClose.rivalryId=X;});
  await forge(env,forgedId(7),data=>{data.terminalClose.extra=true;});
  await forge(env,forgedId(8),(data,tools)=>{tools.setLifecycle("tombstoned");});
  await forge(env,forgedId(9),data=>{data.authorizedAccountIds=[A,D];data.managerSlots=[data.managerSlots[0],{...data.managerSlots[1],accountId:D,profileId:PD,saveId:SD}];});
  await forge(env,forgedId(10),data=>{delete data.terminalProgress;});
  const dbD=env.authenticatedContext(D).firestore();
  await check("E0","control: a correctly witnessed forged copy grants the challenge get (keyed on the witness)",async()=>{await assertSucceeds(getDoc(T(dbA,forgedId(0),1)));});
  await check("E1","closed with terminalProgress but no terminalClose is denied",async()=>{await assertFails(getDoc(T(dbA,forgedId(1),1)));});
  await check("E2","witness whose winner contradicts its totals is denied",async()=>{await assertFails(getDoc(T(dbA,forgedId(2),1)));});
  await check("E3","witness without a closed session revision is denied",async()=>{await assertFails(getDoc(T(dbA,forgedId(3),1)));});
  await check("E4","witness with fewer accepted seasons than configured is denied",async()=>{await assertFails(getDoc(T(dbA,forgedId(4),1)));});
  await check("E5","intent totals that differ from progress totals are denied",async()=>{await assertFails(getDoc(T(dbA,forgedId(5),1)));});
  await check("E6","witness naming another rivalry is denied",async()=>{await assertFails(getDoc(T(dbA,forgedId(6),1)));});
  await check("E7","witness with an extra key is denied",async()=>{await assertFails(getDoc(T(dbA,forgedId(7),1)));});
  await check("E8","tombstoned root is denied",async()=>{await assertFails(getDoc(T(dbA,forgedId(8),1)));});
  await check("E9","member whose account is not active is denied",async()=>{await assertFails(getDoc(T(dbD,forgedId(9),1)));});
  await check("E10","closed with terminalClose but no terminalProgress is denied",async()=>{await assertFails(getDoc(T(dbA,forgedId(10),1)));});

  // G. Forged challenge states under correctly witnessed roots: a role needs a publicly COMPLETED challenge of that exact season.
  const G1=forgedId(20),G2=forgedId(21),G3=forgedId(22);
  for(const id of [G1,G2,G3])await forge(env,id,()=>{});
  await forgeChallenge(env,G1,1);
  await forgeChallenge(env,G1,2,v=>{v.phase="SIGNING_ENTRY";v.signingLockedRoles=["playerOne"];});
  await forgeChallenge(env,G1,3,v=>{v.signingLockedRoles=["playerOne"];});
  await forgeChallenge(env,G1,4,null,{fromSeason:1});
  await forgeChallenge(env,G2,1,v=>{v.guessLockedRoles=["playerTwo"];});
  await forgeChallenge(env,G2,2,v=>{v.rivalryId=X;});
  await forgeChallenge(env,G2,3,v=>{v.seasonNumber=2;});
  await forgeChallenge(env,G3,1,v=>{v.objectType="sharedTransferChallengeRole";});
  await forgeChallenge(env,G3,3,v=>{v.schemaVersion=2;});
  await check("G0","control: COMPLETED challenge under a witnessed root grants the role get",async()=>{await assertSucceeds(getDoc(T(dbA,G1,1,"playerTwo")));});
  await check("G1","challenge in SIGNING_ENTRY: rival role denied",async()=>{await assertFails(getDoc(T(dbA,G1,2,"playerTwo")));});
  await check("G2","challenge in SIGNING_ENTRY: own role denied after close too",async()=>{await assertFails(getDoc(T(dbA,G1,2,"playerOne")));});
  await check("G3","COMPLETED but only one signing locked: denied",async()=>{await assertFails(getDoc(T(dbA,G1,3,"playerTwo")));});
  await check("G4","season_4 of a 3-season Showdown, even if a COMPLETED challenge exists: denied",async()=>{await assertFails(getDoc(T(dbA,G1,4,"playerTwo")));});
  await check("G5","COMPLETED but only one guess locked: denied",async()=>{await assertFails(getDoc(T(dbA,G2,1,"playerTwo")));});
  await check("G6","challenge naming another rivalry: denied",async()=>{await assertFails(getDoc(T(dbA,G2,2,"playerTwo")));});
  await check("G7","challenge whose seasonNumber differs from its id: denied",async()=>{await assertFails(getDoc(T(dbA,G2,3,"playerTwo")));});
  await check("G8","challenge with the wrong objectType: denied",async()=>{await assertFails(getDoc(T(dbA,G3,1,"playerTwo")));});
  await check("G9","no challenge document for the season: role denied",async()=>{await assertFails(getDoc(T(dbA,G3,2,"playerTwo")));});
  await check("G10","challenge with an unknown schemaVersion: denied",async()=>{await assertFails(getDoc(T(dbA,G3,3,"playerTwo")));});
  await check("G11","non-canonical role id on a COMPLETED challenge: denied",async()=>{await assertFails(getDoc(T(dbA,G1,1,"playerone")));});

  // F. Active Showdown Z regressions: the existing COMPLETED condition and privacy are unchanged.
  await check("F1","Daniel reads active Z season_1 challenge (existing rule)",async()=>{await assertSucceeds(getDoc(T(dbA,Z,1)));});
  await check("F2","Nik reads Daniel's COMPLETED Z season_1 role (existing rule)",async()=>{await assertSucceeds(getDoc(T(dbB,Z,1,"playerOne")));});
  await check("F3","Nik cannot read Daniel's unfinished Z season_2 role (SIGNING_ENTRY)",async()=>{await assertFails(getDoc(T(dbB,Z,2,"playerOne")));});
  await check("F4","Daniel reads his own Z season_2 role",async()=>{await assertSucceeds(getDoc(T(dbA,Z,2,"playerOne")));});
  await check("F5","Daniel cannot read Nik's unfinished Z season_2 role",async()=>{await assertFails(getDoc(T(dbA,Z,2,"playerTwo")));});
  await check("F6","stranger cannot read a Z transfer role",async()=>{await assertFails(getDoc(T(dbC,Z,1,"playerOne")));});

  // P. Session-free transfer history reader.
  const Reader=loadReader();
  const read=(db,uid,id,counter)=>Reader.readCompletedTransferHistory({firestore:db,firebaseSdk:readerSdk(counter),user:{uid},rivalryId:id,cryptoImpl:crypto.webcrypto});
  let danielX,danielReads={reads:0},untampered=null;
  await check("P1","Daniel's reader: X completed, 3 seasons keyed daniel/nik, ready",async()=>{
    danielX=await read(dbA,A,X,danielReads);
    assert.equal(danielX.status,"completed",JSON.stringify(danielX));assert.equal(danielX.code,null);assert.equal(danielX.managerRole,"playerOne");assert.equal(Object.isFrozen(danielX),true);
    assert.equal(danielX.transfers.status,"ready");assert.deepEqual(danielX.transfers.seasons.map(s=>s.season),[1,2,3]);
    assert.deepEqual(Object.keys(danielX.transfers.seasons[0]),["season","daniel","nik"]);
    assert.equal(danielX.transfers.seasons[0].daniel.released,1);assert.equal(danielX.transfers.seasons[1].nik.released,1);assert.equal(danielX.transfers.seasons[1].nik.kept,1);
    assert.deepEqual(danielX.transfers.seasons[2].nik,{guesses:[],signings:[],released:0,kept:0});
  });
  await check("P2","Nik's reader returns the identical history",async()=>{const nikX=await read(dbB,B,X);assert.equal(nikX.status,"completed");assert.equal(nikX.managerRole,"playerTwo");assert.deepEqual(nikX.transfers,danielX.transfers);});
  await check("P3","fresh authenticated client, no session or device input: identical history",async()=>{const again=await read(env.authenticatedContext(A).firestore(),A,X);assert.deepEqual(again.transfers,danielX.transfers);});
  await check("P4","verdicts equal the session-bound provider's verdicts taken before close, every season",async()=>{
    for(let k=1;k<=3;k+=1){const season=danielX.transfers.seasons[k-1],v=sessionVerdicts[k-1];assert.deepEqual(JSON.parse(JSON.stringify(season.daniel.signings)),JSON.parse(JSON.stringify(v.playerOne)),`S${k} Daniel`);assert.deepEqual(JSON.parse(JSON.stringify(season.nik.signings)),JSON.parse(JSON.stringify(v.playerTwo)),`S${k} Nik`);}
  });
  await check("P5","exact gets: 2 + 3N = 11 for a 3-season Showdown",async()=>{assert.equal(danielReads.reads,11);});
  await check("P6","abandoned Y: status only, no transfers, exactly one read",async()=>{const c={reads:0};const y=await read(dbB,B,Y,c);assert.equal(y.status,"abandoned");assert.equal(y.transfers,null);assert.equal(c.reads,1);});
  await check("P7","abandoned W (unfinished challenge): status only, exactly one read",async()=>{const c={reads:0};const w=await read(dbB,B,W,c);assert.equal(w.status,"abandoned");assert.equal(w.transfers,null);assert.equal(c.reads,1);});
  await check("P8","active Z: not-closed, exactly one read",async()=>{const c={reads:0};const z=await read(dbA,A,Z,c);assert.equal(z.status,"not-closed");assert.equal(z.transfers,null);assert.equal(c.reads,1);});
  await check("P9","stranger: unavailable with the Firestore denial code, never empty",async()=>{const s=await read(dbC,C,X);assert.equal(s.status,"unavailable");assert.equal(s.code,"permission-denied");assert.deepEqual(s.transfers,{status:"unavailable",seasons:null});});
  await check("P10","forged winner witness: unavailable before any child read",async()=>{const c={reads:0};const f=await read(dbA,A,forgedId(2),c);assert.equal(f.code,"TRANSFER_HISTORY_TERMINAL_WITNESS_INVALID");assert.equal(c.reads,1);});
  await check("P11","a signing edited after lock: unavailable (provenance), never a partial list",async()=>{
    await env.withSecurityRulesDisabled(async context=>{const ref=T(context.firestore(),X,2,"playerTwo"),value=(await getDoc(ref)).data();untampered=value;await setDoc(ref,{...value,signings:value.signings.map(s=>s.slot===1?{...s,name:"Someone else"}:s)});});
    const t=await read(dbA,A,X);assert.equal(t.status,"unavailable");assert.equal(t.code,"TRANSFER_HISTORY_PROVENANCE_MISMATCH");assert.deepEqual(t.transfers,{status:"unavailable",seasons:null});
  });
  await check("P12","separate availability: the completed-only reader still returns X completed while transfers are unavailable",async()=>{const c=await CompletedReader.readCompletedShowdown({firestore:dbA,firebaseSdk:firestoreSdk,user:{uid:A},rivalryId:X,cryptoImpl:crypto.webcrypto});assert.equal(c.status,"completed",JSON.stringify(c));assert.deepEqual(c.final.totals,{playerOne:11,playerTwo:4});});
  await check("P13","a missing season_3 role makes the history unavailable, never shorter",async()=>{
    // Restore the P11 edit first, so the only fault left is the missing season_3 role.
    await env.withSecurityRulesDisabled(async context=>{await setDoc(T(context.firestore(),X,2,"playerTwo"),untampered);await deleteDoc(T(context.firestore(),X,3,"playerOne"));});
    const m=await read(dbB,B,X);assert.equal(m.status,"unavailable");assert.equal(m.code,"TRANSFER_HISTORY_SEASON_MISSING");assert.deepEqual(m.transfers,{status:"unavailable",seasons:null});
  });
}

(async()=>{const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});try{await env.clearFirestore();await run(env);assert.equal(checks,73);process.stdout.write(`PASS completed-only transfer history emulator: ${checks} numbered checks (I0, A completed reads, B denials, C closed writes, D abandoned, E forged witnesses, G forged challenge states, F active regressions, P session-free reader).\n`);}finally{await env.cleanup();}})().catch(error=>{console.error(error.stack||error);process.exit(1);});

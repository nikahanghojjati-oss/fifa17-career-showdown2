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

const PROJECT_ID="demo-cms-two-manager-journey";
const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const TOTAL_SEASONS=Number(process.env.CMS_SHOWDOWN_LENGTH||3);
assert.ok([1,3,5,10].includes(TOTAL_SEASONS),`Unsupported journey length: ${TOTAL_SEASONS}`);

const A="acct_game_a",B="acct_game_b",C="acct_game_c";
const R1=`pair_${"1".repeat(64)}`;
const S1=`session_${"b".repeat(64)}`;
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

async function playMainJourney(env){
  const now=Date.now();
  await seedAccountsAndMainRivalry(env,now);
  const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
  const a=t=>base(dbA,A,DA,R1,S1,now+t),b=t=>base(dbB,B,DB,R1,S1,now+t);

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
    transfer=await Transfer.lockGuesses({...b(offset+500),seasonNumber:season,operationId:op("transfer_op_",season*10+5),baseRevision:4,guesses:[{slot:1,type:"league",valueId:"spain-primera-division"},{slot:2,type:"nationality",valueId:"germany"},{slot:3,type:"nationality",valueId:"albania"}]});assert.equal(transfer.ok,true,JSON.stringify(transfer));assert.equal(transfer.state.phase,"SIGNING_ENTRY");await assertFails(getDoc(doc(dbA,"rivalries",R1,"transferChallenges",`season_${season}`,"roles","playerTwo")),`S${season}: Daniel must not read Nik unfinished transfer inputs`);
    transfer=await Transfer.lockSignings({...a(offset+600),seasonNumber:season,operationId:op("transfer_op_",season*10+6),baseRevision:5,signings:[{slot:1,name:`Daniel S${season} A`,leagueId:"spain-primera-division",nationalityId:"england"},{slot:2,name:`Daniel S${season} B`,leagueId:"australia-a-league",nationalityId:"albania"},{slot:3,name:`Daniel S${season} C`,leagueId:"germany-bundesliga",nationalityId:"france"}]});assert.equal(transfer.ok,true,JSON.stringify(transfer));
    transfer=await Transfer.lockSignings({...b(offset+700),seasonNumber:season,operationId:op("transfer_op_",season*10+7),baseRevision:6,signings:[{slot:1,name:`Nik S${season} A`,leagueId:"england-premier-league",nationalityId:"brazil"},{slot:2,name:`Nik S${season} B`,leagueId:"italy-serie-a",nationalityId:"germany"},{slot:3,name:`Nik S${season} C`,leagueId:"france-ligue-1",nationalityId:"albania"}]});assert.equal(transfer.ok,true,JSON.stringify(transfer));assert.equal(transfer.state.phase,"COMPLETED");await assertSucceeds(getDoc(doc(dbB,"rivalries",R1,"transferChallenges",`season_${season}`,"roles","playerOne")));await assertSucceeds(getDoc(doc(dbA,"rivalries",R1,"transferChallenges",`season_${season}`,"roles","playerTwo")));
    const transferA=await Transfer.read({...a(offset+750),seasonNumber:season}),transferB=await Transfer.read({...b(offset+750),seasonNumber:season});assert.deepEqual(transferA.verdicts,transferB.verdicts,`S${season} transfer state must converge`);

    let results=await Results.publishResult({...a(offset+800),seasonNumber:season,operationId:op("season_result_op_",season*10+1),baseRevision:0,result:resultFor("playerOne",season)});assert.equal(results.ok,true,JSON.stringify(results));await assertFails(getDoc(doc(dbB,"rivalries",R1,"seasonResults",`season_${season}`,"roles","playerOne")),`S${season}: Nik must not read Daniel unpublished-to-both result`);await assertFails(getDoc(doc(dbA,"rivalries",R1,"seasonResults",`season_${season}`,"roles","playerTwo")),`S${season}: Daniel must not read Nik unpublished result before Nik publishes`);
    results=await Results.publishResult({...b(offset+900),seasonNumber:season,operationId:op("season_result_op_",season*10+2),baseRevision:1,result:resultFor("playerTwo",season)});assert.equal(results.ok,true,JSON.stringify(results));assert.equal(results.state.phase,"RESULTS_READY");await assertSucceeds(getDoc(doc(dbB,"rivalries",R1,"seasonResults",`season_${season}`,"roles","playerOne")));await assertSucceeds(getDoc(doc(dbA,"rivalries",R1,"seasonResults",`season_${season}`,"roles","playerTwo")));
    let commit=await Commit.commitSeason({...a(offset+1000),seasonNumber:season,operationId:op("season_commit_op_",season*10+1),baseRevision:0});assert.equal(commit.ok,true,JSON.stringify(commit));
    commit=await Commit.acknowledgeSeason({...b(offset+1100),seasonNumber:season,operationId:op("season_commit_op_",season*10+2),baseRevision:1});assert.equal(commit.ok,true,JSON.stringify(commit));
    commit=await Commit.acknowledgeSeason({...a(offset+1200),seasonNumber:season,operationId:op("season_commit_op_",season*10+3),baseRevision:2});assert.equal(commit.ok,true,JSON.stringify(commit));assert.equal(commit.phase,"ACKNOWLEDGED");if(season===1)await assertStrangerDenied(env,dbA,dbB,"after season 1 commit");

    const scoreA=await Scoring.read({...a(offset+1300),seasonNumber:season,teamCount:20}),scoreB=await Scoring.read({...b(offset+1300),seasonNumber:season,teamCount:20});assert.deepEqual(scoreA.scoring,scoreB.scoring,`S${season} scoring must converge`);assert.equal(scoreA.scoring.playerOne.total,expectedScore("playerOne",season));assert.equal(scoreA.scoring.playerTwo.total,expectedScore("playerTwo",season));assert.equal(scoreA.winner,expectedWinner(season));totals.playerOne+=scoreA.scoring.playerOne.total;totals.playerTwo+=scoreA.scoring.playerTwo.total;
    lastHistory=await History.read({...a(offset+1400),throughSeason:season});const historyB=await History.read({...b(offset+1400),throughSeason:season});assert.deepEqual(lastHistory.projection,historyB.projection,`S${season} history must converge`);assert.equal(lastHistory.projection.seasonHistory.length,season);
    lastMulti=await Multi.read(a(offset+1500));const multiB=await Multi.read(b(offset+1500));assert.deepEqual(lastMulti.state,multiB.state,`S${season} progression must converge`);
  }

  const finalA=Final.reconcile({sharedActive:true,multiSeason:lastMulti,history:lastHistory,localReconciliation:localAuthority("playerOne")});
  const finalB=Final.reconcile({sharedActive:true,multiSeason:lastMulti,history:lastHistory,localReconciliation:localAuthority("playerTwo")});
  assert.deepEqual(finalA,finalB,"Both managers must derive the same final Showdown");assert.deepEqual(finalA.managerTotals,totals);assert.equal(finalA.phase,"FINAL_SEASON_RECONCILED");
  const intent=Terminal.prepare(finalA,{sessionId:S1});
  const closed=await TerminalProvider.close({...a(TOTAL_SEASONS*10000+2000),intent});assert.equal(closed.ok,true,JSON.stringify(closed));assert.equal(closed.rivalryState,"closed");assert.equal(closed.sessionState,"closed");
  const rootA=await assertSucceeds(getDoc(doc(dbA,"rivalries",R1))),rootB=await assertSucceeds(getDoc(doc(dbB,"rivalries",R1)));assert.deepEqual(rootA.data().data.terminalClose,rootB.data().data.terminalClose);assert.equal(rootA.data().data.connectionState,"closed");await assertStrangerDenied(env,dbA,dbB,"after Terminal Close");
  return {now,dbA,dbB,finalA};
}

(async()=>{const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});try{await env.clearFirestore();await playMainJourney(env);process.stdout.write(`PASS two-manager journey Section A (${TOTAL_SEASONS} season${TOTAL_SEASONS===1?"":"s"}): Daniel and Nik converged through setup, Career Start, transfer challenge, results, commit, canonical scoring, history, multi-season final reconciliation and Terminal Close.\n`);}finally{await env.cleanup();}})().catch(error=>{console.error(error.stack||error);process.exit(1);});

"use strict";

const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,getDoc,setDoc,serverTimestamp,writeBatch}=firestoreSdk;
const {initializeTestEnvironment,assertFails}=require("@firebase/rules-unit-testing");

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

const PROJECT_ID="demo-career-mode-showdown-gameplay-lifecycle";
const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const TOTAL_SEASONS=Number(process.env.CMS_SHOWDOWN_LENGTH||3);
assert.ok([1,3,5,10].includes(TOTAL_SEASONS),`Unsupported lifecycle length: ${TOTAL_SEASONS}`);

const A="acct_game_a",B="acct_game_b";
const R=`pair_${"1".repeat(64)}`;
const S=`session_${"b".repeat(64)}`;
const FRESH=`session_${"c".repeat(64)}`;
const FRESH_RESULTS=`session_${"d".repeat(64)}`;
const FRESH_COMMIT=`session_${"e".repeat(64)}`;
let activeSessionId=S;
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`;
const PA=`profile_${"1".repeat(24)}`,PB=`profile_${"2".repeat(24)}`;
const SA=`save_${"3".repeat(24)}`,SB=`save_${"4".repeat(24)}`;

function sdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp};}
function account(id){return {objectType:"account",objectId:id,lifecycleState:"live",data:{status:"active"}};}
function device(id){return {objectType:"device",objectId:id,lifecycleState:"live",data:{deviceId:id,state:"active"}};}
function slots(){return [
  {slotId:"playerOne",accountId:A,profileId:PA,saveId:SA,entitlementState:"active"},
  {slotId:"playerTwo",accountId:B,profileId:PB,saveId:SB,entitlementState:"active"}
];}
function rivalry(){return {objectType:"rivalry",objectId:R,lifecycleState:"live",data:{connectionState:"active",authorizedAccountIds:[A,B],managerSlots:slots()}};}
function session(now,id=S,expiresAtEpochMs=now+4*60*60*1000){
  const createdAt=Timestamp.fromMillis(now-60_000),lastActivityAt=Timestamp.fromMillis(now-1_000),expiresAt=Timestamp.fromMillis(expiresAtEpochMs);
  return {schemaVersion:1,objectType:"session",objectId:id,revision:1,parentRevision:0,lifecycleState:"live",contentHash:`sha256:${"0".repeat(64)}`,priorContentHash:`sha256:${"1".repeat(64)}`,updatedAt:lastActivityAt,updatedByAccountId:A,updatedByDeviceId:DA,data:{rivalryId:R,state:"active",hostAccountId:A,memberAccountIds:[A,B],createdAt,expiresAt,lastActivityAt,revokedAt:null},tombstone:null};
}
function op(prefix,n){return prefix+Number(n).toString(16).padStart(32,"0");}
function base(db,uid,deviceId,now){return {user:{uid},firestore:db,firebaseSdk:sdk(),rivalryId:R,sessionId:activeSessionId,deviceId,nowEpochMs:now,cryptoImpl:crypto.webcrypto};}
function localAuthority(role){const slot=slots().find(item=>item.slotId===role);return {phase:"REMOTE_OBSERVED",canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,binding:{saveId:slot.saveId,profileId:slot.profileId,managerRole:role}};}
function resultFor(role,season){
  if(role==="playerOne")return {leaguePosition:season===1?1:2,leaguePoints:season===1?102:90+season,leagueGoals:88+season,domesticCup:season===2,championsLeague:season===3,topScorer:season===1,topAssist:false};
  return {leaguePosition:season===2?1:3,leaguePoints:87+season,leagueGoals:84+season,domesticCup:false,championsLeague:false,topScorer:false,topAssist:season===3};
}
function expectedScore(role,season){
  if(role==="playerOne"){if(season===1)return 5;if(season===2)return 1;if(season===3)return 5;if(season===10)return 1;return 0;}
  if(season===2)return 3;if(season===3)return 1;return 0;
}
function expectedWinner(season){return season===2?"playerTwo":"playerOne";}

async function assertImpossibleBundesligaResultDenied(db,season){
  const operationId=op("season_result_op_",900+season),seasonId=`season_${season}`,hash=`sha256:${"9".repeat(64)}`,commandHash=`sha256:${"8".repeat(64)}`;
  const batch=writeBatch(db);
  batch.set(doc(db,"rivalries",R,"seasonResults",seasonId),{schemaVersion:1,objectType:"sharedSeasonResults",rivalryId:R,seasonNumber:season,runtimeRevision:"1.9.1-r9",phase:"COLLECTING",revision:1,publishedRoles:["playerOne"],operationIds:[operationId],operationHashes:[hash],baseRevisions:[0],actorRoles:["playerOne"],activeSessionId,updatedAt:serverTimestamp(),updatedByDeviceId:DA});
  batch.set(doc(db,"rivalries",R,"seasonResults",seasonId,"roles","playerOne"),{schemaVersion:1,objectType:"sharedSeasonResultRole",rivalryId:R,seasonNumber:season,managerRole:"playerOne",result:{...resultFor("playerOne",season),leaguePoints:103},operationId,commandHash,activeSessionId,publishedAt:serverTimestamp(),updatedByDeviceId:DA});
  await assertFails(batch.commit());
}
async function assertImpossibleBundesligaCommitDenied(env,db,season){
  const seasonId=`season_${season}`,p1Path=doc(db,"rivalries",R,"seasonResults",seasonId,"roles","playerOne"),p2Path=doc(db,"rivalries",R,"seasonResults",seasonId,"roles","playerTwo");
  let p1,p2;
  await env.withSecurityRulesDisabled(async context=>{const raw=context.firestore(),one=await getDoc(doc(raw,"rivalries",R,"seasonResults",seasonId,"roles","playerOne")),two=await getDoc(doc(raw,"rivalries",R,"seasonResults",seasonId,"roles","playerTwo"));p1=one.data();p2=two.data();await setDoc(doc(raw,"rivalries",R,"seasonResults",seasonId,"roles","playerOne"),{...p1,result:{...p1.result,leaguePoints:103}});});
  try{
    await assertFails(setDoc(doc(db,"rivalries",R,"seasonCommits",seasonId),{schemaVersion:1,objectType:"sharedSeasonCommit",rivalryId:R,seasonNumber:season,runtimeRevision:"1.9.1-r10",phase:"COMMITTED",revision:1,resultsRevision:2,results:{playerOne:{...p1.result,leaguePoints:103},playerTwo:p2.result},acknowledgedRoles:[],operationIds:[`season_commit_op_${"f".repeat(32)}`],operationHashes:[`sha256:${"7".repeat(64)}`],baseRevisions:[0],actorRoles:["playerOne"],activeSessionId,updatedAt:serverTimestamp(),updatedByDeviceId:DA}));
  }finally{
    await env.withSecurityRulesDisabled(async context=>{await setDoc(doc(context.firestore(),"rivalries",R,"seasonResults",seasonId,"roles","playerOne"),p1);});
  }
}

(async()=>{
  const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    await env.clearFirestore();
    activeSessionId=S;
    const now=Date.now();
    await env.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      await setDoc(doc(db,"accounts",A),account(A));
      await setDoc(doc(db,"accounts",B),account(B));
      await setDoc(doc(db,"accounts",A,"devices",DA),device(DA));
      await setDoc(doc(db,"accounts",B,"devices",DB),device(DB));
      await setDoc(doc(db,"rivalries",R),rivalry());
      await setDoc(doc(db,"rivalries",R,"sessions",S),session(now));
    });

    const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
    const a=t=>base(dbA,A,DA,now+t),b=t=>base(dbB,B,DB,now+t);

    const setupOps=[
      ["open",0,1,{}],
      ["commit-league",1,2,{}],
      ["commit-clubs",2,3,{}],
      ["commit-length",3,4,{totalSeasons:TOTAL_SEASONS}]
    ];
    let setupResult=null;
    for(const [type,baseRevision,n,extra] of setupOps){
      setupResult=await Setup.mutate({...a(n*10),type,baseRevision,operationId:op("setup_op_",n),...extra});
      assert.equal(setupResult.ok,true,`Setup ${type} failed: ${JSON.stringify(setupResult)}`);
    }
    setupResult=await Setup.mutate({...a(50),type:"confirm",baseRevision:4,operationId:op("setup_op_",5)});
    assert.equal(setupResult.ok,true,JSON.stringify(setupResult));
    setupResult=await Setup.mutate({...b(60),type:"confirm",baseRevision:5,operationId:op("setup_op_",6)});
    assert.equal(setupResult.ok,true,JSON.stringify(setupResult));
    assert.equal(setupResult.state.phase,"SHOWDOWN_CONFIRMED");
    assert.equal(setupResult.state.totalSeasons,TOTAL_SEASONS);
    assert.ok(setupResult.state.leagueId&&setupResult.state.clubs?.playerOne&&setupResult.state.clubs?.playerTwo);
    assert.equal(setupResult.state.leagueId,"bundesliga","r44 lifecycle fixture must deterministically exercise the 18-team league");

    let career=await Career.acknowledge({...a(70),operationId:op("career_start_op_",1),baseRevision:0});
    assert.equal(career.ok,true,JSON.stringify(career));
    career=await Career.acknowledge({...b(80),operationId:op("career_start_op_",2),baseRevision:1});
    assert.equal(career.ok,true,JSON.stringify(career));
    assert.equal(career.state.phase,"CAREER_START_READY");

    let lastHistory=null,lastMulti=null;
    const expectedTotals={playerOne:0,playerTwo:0};
    for(let season=1;season<=TOTAL_SEASONS;season+=1){
      const offset=season*10_000;
      let transfer=await Transfer.startWindow({...a(offset+100),seasonNumber:season,operationId:op("transfer_op_",season*10+1),baseRevision:0});
      assert.equal(transfer.ok,true,`S${season} start transfer failed: ${JSON.stringify(transfer)}`);
      transfer=await Transfer.requestEndWindow({...a(offset+200),seasonNumber:season,operationId:op("transfer_op_",season*10+2),baseRevision:1});
      assert.equal(transfer.ok,true,`S${season} first early end failed: ${JSON.stringify(transfer)}`);
      transfer=await Transfer.requestEndWindow({...b(offset+300),seasonNumber:season,operationId:op("transfer_op_",season*10+3),baseRevision:2});
      assert.equal(transfer.ok,true,`S${season} second early end failed: ${JSON.stringify(transfer)}`);
      assert.equal(transfer.state.phase,"GUESS_ENTRY");

      transfer=await Transfer.lockGuesses({...a(offset+400),seasonNumber:season,operationId:op("transfer_op_",season*10+4),baseRevision:3,guesses:[
        {slot:1,type:"league",valueId:"england-premier-league"},
        {slot:2,type:"nationality",valueId:"brazil"},
        {slot:3,type:"league",valueId:"germany-bundesliga"}
      ]});
      assert.equal(transfer.ok,true,`S${season} Daniel guesses failed: ${JSON.stringify(transfer)}`);
      transfer=await Transfer.lockGuesses({...b(offset+500),seasonNumber:season,operationId:op("transfer_op_",season*10+5),baseRevision:4,guesses:[
        {slot:1,type:"league",valueId:"spain-primera-division"},
        {slot:2,type:"nationality",valueId:"germany"},
        {slot:3,type:"nationality",valueId:"albania"}
      ]});
      assert.equal(transfer.ok,true,`S${season} Nik guesses failed: ${JSON.stringify(transfer)}`);
      assert.equal(transfer.state.phase,"SIGNING_ENTRY");

      transfer=await Transfer.lockSignings({...a(offset+600),seasonNumber:season,operationId:op("transfer_op_",season*10+6),baseRevision:5,signings:[
        {slot:1,name:`Daniel S${season} A`,leagueId:"spain-primera-division",nationalityId:"england"},
        {slot:2,name:`Daniel S${season} B`,leagueId:"australia-a-league",nationalityId:"albania"},
        {slot:3,name:`Daniel S${season} C`,leagueId:"germany-bundesliga",nationalityId:"france"}
      ]});
      assert.equal(transfer.ok,true,`S${season} Daniel signings failed: ${JSON.stringify(transfer)}`);
      transfer=await Transfer.lockSignings({...b(offset+700),seasonNumber:season,operationId:op("transfer_op_",season*10+7),baseRevision:6,signings:[
        {slot:1,name:`Nik S${season} A`,leagueId:"england-premier-league",nationalityId:"brazil"},
        {slot:2,name:`Nik S${season} B`,leagueId:"italy-serie-a",nationalityId:"germany"},
        {slot:3,name:`Nik S${season} C`,leagueId:"france-ligue-1",nationalityId:"albania"}
      ]});
      assert.equal(transfer.ok,true,`S${season} Nik signings failed: ${JSON.stringify(transfer)}`);
      assert.equal(transfer.state.phase,"COMPLETED");
      const transferA=await Transfer.read({...a(offset+750),seasonNumber:season});
      const transferB=await Transfer.read({...b(offset+750),seasonNumber:season});
      assert.equal(transferA.ok,true,`S${season} Daniel completed transfer read failed: ${JSON.stringify(transferA)}`);
      assert.equal(transferB.ok,true,`S${season} Nik completed transfer read failed: ${JSON.stringify(transferB)}`);
      assert.deepEqual(transferA.verdicts,transferB.verdicts,`S${season} both managers must derive identical transfer verdicts`);
      assert.deepEqual(transferA.verdicts.playerOne.map(row=>row.release),[true,true,false],`S${season} Daniel release verdicts must match Nik's locked league/nationality guesses`);
      assert.deepEqual(transferA.verdicts.playerTwo.map(row=>row.release),[true,false,false],`S${season} Nik release verdicts must match Daniel's locked league/nationality guesses`);
      assert.equal(transferA.opponentInputs.signings.length,3,`S${season} completed transfer reveal must contain all three rival signings`);
      assert.equal(transferB.opponentInputs.guesses.length,3,`S${season} completed transfer reveal must contain all three rival guesses`);

      if(season===1)await assertImpossibleBundesligaResultDenied(dbA,season);
      let results=await Results.publishResult({...a(offset+800),seasonNumber:season,operationId:op("season_result_op_",season*10+1),baseRevision:0,result:resultFor("playerOne",season)});
      assert.equal(results.ok,true,`S${season} Daniel result failed: ${JSON.stringify(results)}`);
      assert.equal(results.opponentResult,null,"First publication must remain private.");
      if(TOTAL_SEASONS===3&&season===1){
        const freshNow=now+offset+850,currentSession=activeSessionId;
        await env.withSecurityRulesDisabled(async context=>{
          const db=context.firestore();
          await setDoc(doc(db,"rivalries",R,"sessions",currentSession),session(now,currentSession,freshNow-1));
          await setDoc(doc(db,"rivalries",R,"sessions",FRESH_RESULTS),session(freshNow,FRESH_RESULTS));
        });
        activeSessionId=FRESH_RESULTS;
        const resumed=await Setup.read(a(offset+875));
        assert.equal(resumed.ok,true,`S${season} mid-results fresh-session setup resume failed: ${JSON.stringify(resumed)}`);
      }
      results=await Results.publishResult({...b(offset+900),seasonNumber:season,operationId:op("season_result_op_",season*10+2),baseRevision:1,result:resultFor("playerTwo",season)});
      assert.equal(results.ok,true,`S${season} Nik result failed: ${JSON.stringify(results)}`);
      assert.equal(results.state.phase,"RESULTS_READY");
      results=await Results.read({...b(offset+950),seasonNumber:season});
      assert.equal(results.ok,true,`S${season} revealed results read failed: ${JSON.stringify(results)}`);
      assert.equal(results.state.phase,"RESULTS_READY");
      assert.ok(results.allResults?.playerOne&&results.allResults?.playerTwo);
      if(season===1)await assertImpossibleBundesligaCommitDenied(env,dbA,season);

      let commit=await Commit.commitSeason({...a(offset+1000),seasonNumber:season,operationId:op("season_commit_op_",season*10+1),baseRevision:0});
      assert.equal(commit.ok,true,`S${season} commit failed: ${JSON.stringify(commit)}`);
      if(TOTAL_SEASONS===3&&season===2){
        const freshNow=now+offset+1050,currentSession=activeSessionId;
        await env.withSecurityRulesDisabled(async context=>{
          const db=context.firestore();
          await setDoc(doc(db,"rivalries",R,"sessions",currentSession),session(now,currentSession,freshNow-1));
          await setDoc(doc(db,"rivalries",R,"sessions",FRESH_COMMIT),session(freshNow,FRESH_COMMIT));
        });
        activeSessionId=FRESH_COMMIT;
        const resumed=await Setup.read(b(offset+1075));
        assert.equal(resumed.ok,true,`S${season} mid-commit fresh-session setup resume failed: ${JSON.stringify(resumed)}`);
      }
      commit=await Commit.acknowledgeSeason({...b(offset+1100),seasonNumber:season,operationId:op("season_commit_op_",season*10+2),baseRevision:1});
      assert.equal(commit.ok,true,`S${season} Nik acknowledgement failed: ${JSON.stringify(commit)}`);
      commit=await Commit.acknowledgeSeason({...a(offset+1200),seasonNumber:season,operationId:op("season_commit_op_",season*10+3),baseRevision:2});
      assert.equal(commit.ok,true,`S${season} Daniel acknowledgement failed: ${JSON.stringify(commit)}`);
      assert.equal(commit.phase,"ACKNOWLEDGED");
      assert.equal(commit.revision,3);

      const scoreA=await Scoring.read({...a(offset+1300),seasonNumber:season,teamCount:20});
      const scoreB=await Scoring.read({...b(offset+1300),seasonNumber:season,teamCount:20});
      assert.equal(scoreA.ok,true,JSON.stringify(scoreA));assert.equal(scoreB.ok,true,JSON.stringify(scoreB));
      assert.deepEqual(scoreA.scoring,scoreB.scoring,`S${season} canonical scoring must converge`);
      assert.equal(scoreA.winner,scoreB.winner);
      assert.equal(scoreA.scoring.playerOne.total,expectedScore("playerOne",season),`S${season} Daniel canonical season score must be exact`);
      assert.equal(scoreA.scoring.playerTwo.total,expectedScore("playerTwo",season),`S${season} Nik canonical season score must be exact`);
      assert.equal(scoreA.winner,expectedWinner(season),`S${season} season winner/tiebreak must be exact`);
      expectedTotals.playerOne+=scoreA.scoring.playerOne.total;
      expectedTotals.playerTwo+=scoreA.scoring.playerTwo.total;

      lastHistory=await History.read({...a(offset+1400),throughSeason:season});
      const historyB=await History.read({...b(offset+1400),throughSeason:season});
      assert.equal(lastHistory.ok,true,`S${season} history failed: ${JSON.stringify(lastHistory)}`);
      assert.equal(historyB.ok,true,JSON.stringify(historyB));
      assert.deepEqual(lastHistory.projection,historyB.projection,`S${season} shared history must converge`);
      assert.equal(lastHistory.projection.acceptedSeasons,season);
      assert.equal(lastHistory.projection.seasonHistory.length,season,`S${season} history must retain every accepted season exactly once`);
      assert.equal(lastHistory.projection.seasonHistory[season-1].winner,expectedWinner(season),`S${season} stored season winner must match canonical scoring`);
      assert.equal(lastHistory.projection.managerRecords.playerOne.totalPoints,expectedTotals.playerOne,`S${season} Daniel accumulated Showdown score must be exact`);
      assert.equal(lastHistory.projection.managerRecords.playerTwo.totalPoints,expectedTotals.playerTwo,`S${season} Nik accumulated Showdown score must be exact`);
      assert.equal(lastHistory.projection.managerRecords.playerOne.seasonWins,season-(season>=2?1:0),`S${season} Daniel season-win history must accumulate exactly`);
      assert.equal(lastHistory.projection.managerRecords.playerTwo.seasonWins,season>=2?1:0,`S${season} Nik season-win history must accumulate exactly`);
      assert.equal(lastHistory.projection.managerRecords.playerOne.seasonDraws,0);
      assert.equal(lastHistory.projection.managerRecords.playerTwo.seasonDraws,0);
      assert.equal(lastHistory.projection.trophyAttribution.playerOne.leagueTitles,1,`S${season} Daniel league-title history must persist`);
      assert.equal(lastHistory.projection.trophyAttribution.playerOne.domesticCups,season>=2?1:0,`S${season} Daniel domestic-cup history must accumulate`);
      assert.equal(lastHistory.projection.trophyAttribution.playerOne.championsLeagues,season>=3?1:0,`S${season} Daniel Champions League history must accumulate`);
      assert.equal(lastHistory.projection.trophyAttribution.playerTwo.leagueTitles,season>=2?1:0,`S${season} Nik league-title history must accumulate`);

      lastMulti=await Multi.read(a(offset+1500));
      const multiB=await Multi.read(b(offset+1500));
      assert.equal(lastMulti.ok,true,`S${season} multi-season failed: ${JSON.stringify(lastMulti)}`);
      assert.equal(multiB.ok,true,JSON.stringify(multiB));
      assert.deepEqual(lastMulti.state,multiB.state,`S${season} progression must converge`);
      if(season<TOTAL_SEASONS){assert.equal(lastMulti.state.activeSeason,season+1);assert.equal(lastMulti.state.terminal,false);}
      else{assert.equal(lastMulti.state.activeSeason,null);assert.equal(lastMulti.state.terminal,true);assert.equal(lastMulti.state.phase,"SHOWDOWN_COMPLETE");}

      if(TOTAL_SEASONS===10&&season===5){
        const freshNow=now+offset+1600;
        await env.withSecurityRulesDisabled(async context=>{
          const db=context.firestore();
          await setDoc(doc(db,"rivalries",R,"sessions",S),session(now,S,freshNow-1));
          await setDoc(doc(db,"rivalries",R,"sessions",FRESH),session(freshNow,FRESH));
        });
        activeSessionId=FRESH;
        const resumedA=await Setup.read(a(offset+1700)),resumedB=await Setup.read(b(offset+1700));
        assert.equal(resumedA.ok,true,`S${season} fresh-session setup resume A failed: ${JSON.stringify(resumedA)}`);
        assert.equal(resumedB.ok,true,`S${season} fresh-session setup resume B failed: ${JSON.stringify(resumedB)}`);
        assert.equal(resumedA.state.totalSeasons,TOTAL_SEASONS);
        assert.deepEqual(resumedA.state.clubs,resumedB.state.clubs,"Fresh session must preserve fixed clubs.");
      }
    }

    const finalA=Final.reconcile({sharedActive:true,multiSeason:lastMulti,history:lastHistory,localReconciliation:localAuthority("playerOne")});
    const finalB=Final.reconcile({sharedActive:true,multiSeason:lastMulti,history:lastHistory,localReconciliation:localAuthority("playerTwo")});
    assert.deepEqual(finalA,finalB,"Both managers must derive the same final Showdown.");
    assert.equal(finalA.phase,"FINAL_SEASON_RECONCILED");
    assert.equal(finalA.completedSeason,TOTAL_SEASONS);
    assert.equal(finalA.nextSeason,null);
    assert.equal(finalA.extraSeasonAllowed,false);
    assert.deepEqual(finalA.managerTotals,expectedTotals,"Final reconciliation must use the accumulated canonical score from every accepted season.");
    assert.equal(finalA.winner,"playerOne","Final winner must be derived from the accumulated canonical totals.");

    process.stdout.write(`PASS production gameplay provider lifecycle (${TOTAL_SEASONS} season${TOTAL_SEASONS===1?"":"s"}): real generated Firestore Rules carried one exact two-manager Showdown through shared setup, Career Start, ${TOTAL_SEASONS} complete Transfer/Guess/Signing cycles, private Season Results with Bundesliga 102 accepted / direct-SDK 103 denied, league-bounded coordinator commit + dual acknowledgement, canonical scoring with exact numeric assertions, accumulated history/trophies/records, exact next-season progression, and final reconciliation from stored cumulative totals with fixed clubs and no reset${TOTAL_SEASONS===3?"; fresh sessions also took over after Daniel published Season 1 and after the Season 2 coordinator commit without losing accepted state":""}${TOTAL_SEASONS===10?"; the original private session expired after Season 5 and a fresh four-hour session resumed the same rivalry through Season 10":""}. Terminal Close remains independently production-emulator gated.\n`);
  }finally{await env.cleanup();}
})().catch(error=>{console.error(error.stack||error);process.exit(1);});

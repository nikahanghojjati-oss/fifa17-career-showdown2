"use strict";

const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,setDoc,serverTimestamp}=firestoreSdk;
const {initializeTestEnvironment}=require("@firebase/rules-unit-testing");

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

const A="acct_game_a",B="acct_game_b";
const R=`pair_${"a".repeat(64)}`;
const S=`session_${"b".repeat(64)}`;
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
function session(now){
  const createdAt=Timestamp.fromMillis(now-60_000),lastActivityAt=Timestamp.fromMillis(now-1_000),expiresAt=Timestamp.fromMillis(now+4*60*60*1000);
  return {schemaVersion:1,objectType:"session",objectId:S,revision:1,parentRevision:0,lifecycleState:"live",contentHash:`sha256:${"0".repeat(64)}`,priorContentHash:`sha256:${"1".repeat(64)}`,updatedAt:lastActivityAt,updatedByAccountId:A,updatedByDeviceId:DA,data:{rivalryId:R,state:"active",hostAccountId:A,memberAccountIds:[A,B],createdAt,expiresAt,lastActivityAt,revokedAt:null},tombstone:null};
}
function op(prefix,n){return prefix+Number(n).toString(16).padStart(32,"0");}
function base(db,uid,deviceId,now){return {user:{uid},firestore:db,firebaseSdk:sdk(),rivalryId:R,sessionId:S,deviceId,nowEpochMs:now,cryptoImpl:crypto.webcrypto};}
function localAuthority(role){const slot=slots().find(item=>item.slotId===role);return {phase:"REMOTE_OBSERVED",canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,binding:{saveId:slot.saveId,profileId:slot.profileId,managerRole:role}};}
function resultFor(role,season){
  if(role==="playerOne")return {leaguePosition:season===1?1:2,leaguePoints:90+season,leagueGoals:88+season,domesticCup:season===2,championsLeague:season===3,topScorer:season===1,topAssist:false};
  return {leaguePosition:season===2?1:3,leaguePoints:87+season,leagueGoals:84+season,domesticCup:false,championsLeague:false,topScorer:false,topAssist:season===3};
}

(async()=>{
  const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    await env.clearFirestore();
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
      ["commit-length",3,4,{totalSeasons:3}]
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
    assert.equal(setupResult.state.totalSeasons,3);
    assert.ok(setupResult.state.leagueId&&setupResult.state.clubs?.playerOne&&setupResult.state.clubs?.playerTwo);

    let career=await Career.acknowledge({...a(70),operationId:op("career_start_op_",1),baseRevision:0});
    assert.equal(career.ok,true,JSON.stringify(career));
    career=await Career.acknowledge({...b(80),operationId:op("career_start_op_",2),baseRevision:1});
    assert.equal(career.ok,true,JSON.stringify(career));
    assert.equal(career.state.phase,"CAREER_START_READY");

    let lastHistory=null,lastMulti=null;
    for(let season=1;season<=3;season+=1){
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
        {slot:2,type:"nationality",valueId:"brazil"}
      ]});
      assert.equal(transfer.ok,true,`S${season} Daniel guesses failed: ${JSON.stringify(transfer)}`);
      transfer=await Transfer.lockGuesses({...b(offset+500),seasonNumber:season,operationId:op("transfer_op_",season*10+5),baseRevision:4,guesses:[
        {slot:1,type:"league",valueId:"spain-primera-division"},
        {slot:2,type:"nationality",valueId:"germany"}
      ]});
      assert.equal(transfer.ok,true,`S${season} Nik guesses failed: ${JSON.stringify(transfer)}`);
      assert.equal(transfer.state.phase,"SIGNING_ENTRY");

      transfer=await Transfer.lockSignings({...a(offset+600),seasonNumber:season,operationId:op("transfer_op_",season*10+6),baseRevision:5,signings:[
        {slot:1,name:`Daniel S${season} A`,leagueId:"spain-primera-division",nationalityId:"england"}
      ]});
      assert.equal(transfer.ok,true,`S${season} Daniel signings failed: ${JSON.stringify(transfer)}`);
      transfer=await Transfer.lockSignings({...b(offset+700),seasonNumber:season,operationId:op("transfer_op_",season*10+7),baseRevision:6,signings:[
        {slot:1,name:`Nik S${season} A`,leagueId:"england-premier-league",nationalityId:"brazil"}
      ]});
      assert.equal(transfer.ok,true,`S${season} Nik signings failed: ${JSON.stringify(transfer)}`);
      assert.equal(transfer.state.phase,"COMPLETED");

      let results=await Results.publishResult({...a(offset+800),seasonNumber:season,operationId:op("season_result_op_",season*10+1),baseRevision:0,result:resultFor("playerOne",season)});
      assert.equal(results.ok,true,`S${season} Daniel result failed: ${JSON.stringify(results)}`);
      assert.equal(results.opponentResult,null,"First publication must remain private.");
      results=await Results.publishResult({...b(offset+900),seasonNumber:season,operationId:op("season_result_op_",season*10+2),baseRevision:1,result:resultFor("playerTwo",season)});
      assert.equal(results.ok,true,`S${season} Nik result failed: ${JSON.stringify(results)}`);
      assert.equal(results.state.phase,"RESULTS_READY");
      results=await Results.read({...b(offset+950),seasonNumber:season});
      assert.equal(results.ok,true,`S${season} revealed results read failed: ${JSON.stringify(results)}`);
      assert.equal(results.state.phase,"RESULTS_READY");
      assert.ok(results.allResults?.playerOne&&results.allResults?.playerTwo);

      let commit=await Commit.commitSeason({...a(offset+1000),seasonNumber:season,operationId:op("season_commit_op_",season*10+1),baseRevision:0});
      assert.equal(commit.ok,true,`S${season} commit failed: ${JSON.stringify(commit)}`);
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

      lastHistory=await History.read({...a(offset+1400),throughSeason:season});
      const historyB=await History.read({...b(offset+1400),throughSeason:season});
      assert.equal(lastHistory.ok,true,`S${season} history failed: ${JSON.stringify(lastHistory)}`);
      assert.equal(historyB.ok,true,JSON.stringify(historyB));
      assert.deepEqual(lastHistory.projection,historyB.projection,`S${season} shared history must converge`);
      assert.equal(lastHistory.projection.acceptedSeasons,season);

      lastMulti=await Multi.read(a(offset+1500));
      const multiB=await Multi.read(b(offset+1500));
      assert.equal(lastMulti.ok,true,`S${season} multi-season failed: ${JSON.stringify(lastMulti)}`);
      assert.equal(multiB.ok,true,JSON.stringify(multiB));
      assert.deepEqual(lastMulti.state,multiB.state,`S${season} progression must converge`);
      if(season<3){assert.equal(lastMulti.state.activeSeason,season+1);assert.equal(lastMulti.state.terminal,false);}
      else{assert.equal(lastMulti.state.activeSeason,null);assert.equal(lastMulti.state.terminal,true);assert.equal(lastMulti.state.phase,"SHOWDOWN_COMPLETE");}
    }

    const finalA=Final.reconcile({sharedActive:true,multiSeason:lastMulti,history:lastHistory,localReconciliation:localAuthority("playerOne")});
    const finalB=Final.reconcile({sharedActive:true,multiSeason:lastMulti,history:lastHistory,localReconciliation:localAuthority("playerTwo")});
    assert.deepEqual(finalA,finalB,"Both managers must derive the same final Showdown.");
    assert.equal(finalA.phase,"FINAL_SEASON_RECONCILED");
    assert.equal(finalA.completedSeason,3);
    assert.equal(finalA.nextSeason,null);
    assert.equal(finalA.extraSeasonAllowed,false);

    process.stdout.write("PASS production gameplay provider lifecycle: real generated Firestore Rules carried one exact two-manager Showdown through shared setup, Career Start, three complete Transfer/Guess/Signing cycles, private Season Results, coordinator commit + dual acknowledgement, canonical scoring, converged history, exact next-season progression, and final reconciliation with fixed clubs and no reset. Terminal Close remains independently production-emulator gated.\n");
  }finally{await env.cleanup();}
})().catch(error=>{console.error(error.stack||error);process.exit(1);});

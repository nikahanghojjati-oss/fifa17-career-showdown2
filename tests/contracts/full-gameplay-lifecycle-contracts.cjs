const assert=require("node:assert/strict");
const {webcrypto}=require("node:crypto");
const career=require("../../js/sharedCareerStart.js");
const transferFactory=require("../../js/sharedTransferChallenge.js");
const resultsFactory=require("../../js/sharedSeasonResults.js");
const commitFactory=require("../../js/sharedSeasonCommit.js");
const scoringFactory=require("../../js/sharedCanonicalScoring.js");
const history=require("../../js/sharedHistoryConvergence.js");
const multiFactory=require("../../js/sharedMultiSeasonProgression.js");
const finalModule=require("../../js/sharedFinalReconciliation.js");
const terminal=require("../../js/sharedTerminalClose.js");

const rivalryId=`pair_${"a".repeat(64)}`;
const sessionId=`session_${"b".repeat(64)}`;
const managerSlots=[
  {slotId:"playerOne",accountId:"daniel-account",profileId:`profile_${"1".repeat(24)}`,saveId:`save_${"3".repeat(24)}`,entitlementState:"active"},
  {slotId:"playerTwo",accountId:"nik-account",profileId:`profile_${"2".repeat(24)}`,saveId:`save_${"4".repeat(24)}`,entitlementState:"active"}
];
const leagueIds=["germany-bundesliga","england-premier-league","spain-primera-division"];
const nationalityIds=["germany","england","spain","brazil"];
let serial=0;

function operation(prefix){
  serial+=1;
  return prefix+serial.toString(16).padStart(32,"0");
}
function stripScore(value){
  return {
    championsLeague:value.championsLeague,
    leagueTitle:value.leagueTitle,
    domesticCup:value.domesticCup,
    performanceBonus:value.performanceBonus,
    individualAwardsBonus:value.individualAwardsBonus,
    total:value.total
  };
}
function seasonResults(seasonNumber){
  return {
    playerOne:{
      leaguePosition:seasonNumber%4===0?1:2+(seasonNumber%3),
      leaguePoints:88+seasonNumber,
      leagueGoals:84+seasonNumber*2,
      domesticCup:seasonNumber%3===0,
      championsLeague:seasonNumber%5===0,
      topScorer:seasonNumber%2===0,
      topAssist:seasonNumber%4===0
    },
    playerTwo:{
      leaguePosition:seasonNumber%3===0?1:3+(seasonNumber%2),
      leaguePoints:86+seasonNumber,
      leagueGoals:82+seasonNumber*2,
      domesticCup:seasonNumber%4===0,
      championsLeague:seasonNumber%6===0,
      topScorer:seasonNumber%5===0,
      topAssist:seasonNumber%2===1
    }
  };
}
function setupFor(totalSeasons){
  return {
    schemaVersion:1,
    objectType:"sharedSetupLedger",
    rivalryId,
    phase:"SHOWDOWN_CONFIRMED",
    revision:6,
    coordinatorRole:"playerOne",
    leagueId:"bundesliga",
    clubs:{playerOne:"SC Freiburg",playerTwo:"Hertha BSC"},
    totalSeasons,
    confirmedRoles:["playerOne","playerTwo"]
  };
}
function localAuthority(role){
  const slot=managerSlots.find(item=>item.slotId===role);
  return {
    phase:"REMOTE_OBSERVED",
    canonicalStorageMutation:false,
    providerWriteRequired:false,
    automaticLocalApply:false,
    candidateCOnly:true,
    binding:{saveId:slot.saveId,profileId:slot.profileId,managerRole:role}
  };
}

async function runOnePlan(totalSeasons){
  const setup=setupFor(totalSeasons);

  let careerState=null;
  careerState=career.apply({
    state:careerState,
    setup,
    actorRole:"playerOne",
    command:{type:"acknowledge-career-start",operationId:operation("career_start_op_"),baseRevision:0}
  }).state;
  assert.equal(careerState.phase,"ONE_MANAGER_ACKNOWLEDGED");
  careerState=career.apply({
    state:careerState,
    setup,
    actorRole:"playerTwo",
    command:{type:"acknowledge-career-start",operationId:operation("career_start_op_"),baseRevision:1}
  }).state;
  assert.equal(careerState.phase,"CAREER_START_READY");
  assert.deepEqual([...careerState.acknowledgedRoles],["playerOne","playerTwo"]);

  const transfer=await transferFactory.createProtocol({leagueIds,nationalityIds,cryptoImpl:webcrypto});
  const results=await resultsFactory.createProtocol({teamCount:18,cryptoImpl:webcrypto});
  const commit=await commitFactory.createProtocol({teamCount:18,cryptoImpl:webcrypto,seasonResultsModule:resultsFactory});
  const scoring=await scoringFactory.createProtocol({teamCount:18,cryptoImpl:webcrypto,seasonCommitModule:commitFactory});
  const multi=multiFactory.createProtocol({historyModule:history});

  let progression=multi.derive({rivalryId,setup,history:null});
  assert.equal(progression.phase,"SEASON_READY");
  assert.equal(progression.activeSeason,1);
  assert.deepEqual(progression.fixedClubs,setup.clubs);

  const sources=[];
  let latestHistory=null;

  for(let seasonNumber=1;seasonNumber<=totalSeasons;seasonNumber+=1){
    assert.equal(progression.activeSeason,seasonNumber,`plan ${totalSeasons}: expected Season ${seasonNumber} to be active`);

    let transferState=null;
    const now=1_000_000+seasonNumber*10_000;
    transferState=(await transfer.apply({
      state:null,setup,careerStart:careerState,seasonNumber,actorRole:"playerOne",nowEpochMs:now,
      command:{type:"start-window",operationId:operation("transfer_op_"),baseRevision:0}
    })).state;
    transferState=(await transfer.apply({
      state:transferState,setup,careerStart:careerState,seasonNumber,actorRole:"playerOne",nowEpochMs:now+100,
      command:{type:"request-end-window",operationId:operation("transfer_op_"),baseRevision:1}
    })).state;
    transferState=(await transfer.apply({
      state:transferState,setup,careerStart:careerState,seasonNumber,actorRole:"playerTwo",nowEpochMs:now+200,
      command:{type:"request-end-window",operationId:operation("transfer_op_"),baseRevision:2}
    })).state;
    assert.equal(transferState.phase,"GUESS_ENTRY");

    transferState=(await transfer.apply({
      state:transferState,setup,careerStart:careerState,seasonNumber,actorRole:"playerOne",nowEpochMs:now+300,
      command:{type:"lock-guesses",operationId:operation("transfer_op_"),baseRevision:3,guesses:[
        {slot:1,type:"league",valueId:"england-premier-league"},
        {slot:2,type:"nationality",valueId:"brazil"}
      ]}
    })).state;
    transferState=(await transfer.apply({
      state:transferState,setup,careerStart:careerState,seasonNumber,actorRole:"playerTwo",nowEpochMs:now+400,
      command:{type:"lock-guesses",operationId:operation("transfer_op_"),baseRevision:4,guesses:[
        {slot:1,type:"league",valueId:"spain-primera-division"},
        {slot:2,type:"nationality",valueId:"germany"}
      ]}
    })).state;
    assert.equal(transferState.phase,"SIGNING_ENTRY");

    transferState=(await transfer.apply({
      state:transferState,setup,careerStart:careerState,seasonNumber,actorRole:"playerOne",nowEpochMs:now+500,
      command:{type:"lock-signings",operationId:operation("transfer_op_"),baseRevision:5,signings:[
        {slot:1,name:`Daniel Signing S${seasonNumber}`,leagueId:"spain-primera-division",nationalityId:"england"}
      ]}
    })).state;
    transferState=(await transfer.apply({
      state:transferState,setup,careerStart:careerState,seasonNumber,actorRole:"playerTwo",nowEpochMs:now+600,
      command:{type:"lock-signings",operationId:operation("transfer_op_"),baseRevision:6,signings:[
        {slot:1,name:`Nik Signing S${seasonNumber}`,leagueId:"england-premier-league",nationalityId:"brazil"}
      ]}
    })).state;
    assert.equal(transferState.phase,"COMPLETED");
    assert.equal(transfer.projectForRole(transferState,"playerOne").verdicts.playerTwo.length,1);
    assert.equal(transfer.projectForRole(transferState,"playerTwo").verdicts.playerOne.length,1);

    const raw=seasonResults(seasonNumber);
    let resultState=(await results.apply({
      state:null,setup,careerStart:careerState,transferChallenge:transferState,seasonNumber,actorRole:"playerOne",
      command:{type:"publish-result",operationId:operation("season_result_op_"),baseRevision:0,result:raw.playerOne}
    })).state;
    assert.equal(results.projectForRole(resultState,"playerTwo").opponentResult,null,"first result must remain private");
    resultState=(await results.apply({
      state:resultState,setup,careerStart:careerState,transferChallenge:transferState,seasonNumber,actorRole:"playerTwo",
      command:{type:"publish-result",operationId:operation("season_result_op_"),baseRevision:1,result:raw.playerTwo}
    })).state;
    assert.equal(resultState.phase,"RESULTS_READY");

    let commitState=(await commit.apply({
      state:null,setup,seasonResults:resultState,seasonNumber,actorRole:"playerOne",
      command:{type:"commit-season",operationId:operation("season_commit_op_"),baseRevision:0}
    })).state;
    commitState=(await commit.apply({
      state:commitState,setup,seasonResults:resultState,seasonNumber,actorRole:"playerOne",
      command:{type:"acknowledge-season",operationId:operation("season_commit_op_"),baseRevision:1}
    })).state;
    commitState=(await commit.apply({
      state:commitState,setup,seasonResults:resultState,seasonNumber,actorRole:"playerTwo",
      command:{type:"acknowledge-season",operationId:operation("season_commit_op_"),baseRevision:2}
    })).state;
    assert.equal(commitState.phase,"ACKNOWLEDGED");
    assert.equal(commitState.revision,3);

    const scoringState=await scoring.reconcile({seasonCommit:commitState});
    assert.equal(scoringState.phase,"SCORING_RECONCILED");
    await scoring.verifyState(scoringState,{seasonCommit:commitState});

    sources.push({
      commit:{
        ok:true,committed:true,phase:commitState.phase,revision:commitState.revision,
        resultsRevision:commitState.resultsRevision,resultsContentHash:commitState.resultsContentHash,
        seasonNumber,rivalryId,results:commitState.results
      },
      scoring:{
        ok:true,authoritative:true,phase:scoringState.phase,revision:scoringState.revision,
        seasonCommitRevision:scoringState.seasonCommitRevision,
        resultsRevision:commitState.resultsRevision,resultsContentHash:commitState.resultsContentHash,
        seasonNumber,rivalryId,
        scoring:{
          playerOne:stripScore(scoringState.scoring.playerOne),
          playerTwo:stripScore(scoringState.scoring.playerTwo)
        },
        winner:scoringState.winner
      }
    });

    latestHistory=history.buildProjection({rivalryId,setup,managerSlots,seasons:sources});
    assert.equal(latestHistory.acceptedSeasons,seasonNumber);
    assert.equal(latestHistory.seasonHistory.length,seasonNumber);
    assert.deepEqual(latestHistory.managerRecords.playerOne.club,"SC Freiburg");
    assert.deepEqual(latestHistory.managerRecords.playerTwo.club,"Hertha BSC");

    progression=multi.observe({previous:progression,rivalryId,setup,history:latestHistory});
    assert.equal(progression.acceptedSeasons,seasonNumber);
    assert.deepEqual(progression.fixedClubs,setup.clubs);
    if(seasonNumber<totalSeasons){
      assert.equal(progression.phase,"SEASON_READY");
      assert.equal(progression.activeSeason,seasonNumber+1);
      assert.equal(progression.terminal,false);
    }else{
      assert.equal(progression.phase,"SHOWDOWN_COMPLETE");
      assert.equal(progression.activeSeason,null);
      assert.equal(progression.terminal,true);
    }
  }

  const historyAuthority={ok:true,authoritative:true,phase:"HISTORY_CONVERGED",rivalryId,projection:latestHistory};
  const multiAuthority={ok:true,authoritative:true,phase:"SHOWDOWN_COMPLETE",rivalryId,state:progression};

  const finalOne=finalModule.reconcile({
    sharedActive:true,
    multiSeason:multiAuthority,
    history:historyAuthority,
    localReconciliation:localAuthority("playerOne")
  });
  const finalTwo=finalModule.reconcile({
    sharedActive:true,
    multiSeason:multiAuthority,
    history:historyAuthority,
    localReconciliation:localAuthority("playerTwo")
  });
  assert.deepEqual(finalOne,finalTwo,`plan ${totalSeasons}: both managers must derive one final Showdown`);
  assert.equal(finalOne.phase,"FINAL_SEASON_RECONCILED");
  assert.equal(finalOne.completedSeason,totalSeasons);
  assert.equal(finalOne.nextSeason,null);
  assert.equal(finalOne.extraSeasonAllowed,false);
  assert.deepEqual(finalOne.fixedClubs,setup.clubs);
  assert.deepEqual(finalOne.managerTotals,{
    playerOne:latestHistory.managerRecords.playerOne.totalPoints,
    playerTwo:latestHistory.managerRecords.playerTwo.totalPoints
  });

  const closeIntent=terminal.prepare(finalOne,{sessionId});
  assert.equal(closeIntent.phase,"TERMINAL_CLOSE_READY");
  const closed=terminal.closeResult(closeIntent,{
    ok:true,rivalryId,sessionId,rivalryState:"closed",sessionState:"closed",
    rivalryRevision:20+totalSeasons,sessionRevision:10+totalSeasons,replayed:false
  });
  assert.equal(closed.phase,"TERMINAL_CLOSED");
  assert.equal(closed.nextSeason,null);
  assert.equal(closed.extraSeasonAllowed,false);
  assert.deepEqual(closed.managerTotals,finalOne.managerTotals);

  return {
    totalSeasons,
    careerPhase:careerState.phase,
    completedSeasons:latestHistory.acceptedSeasons,
    finalWinner:finalOne.winner,
    managerTotals:finalOne.managerTotals,
    terminalPhase:closed.phase
  };
}

(async()=>{
  const summaries=[];
  for(const totalSeasons of [1,3,5,10])summaries.push(await runOnePlan(totalSeasons));
  assert.deepEqual(summaries.map(item=>item.totalSeasons),[1,3,5,10]);
  assert.ok(summaries.every(item=>item.careerPhase==="CAREER_START_READY"));
  assert.ok(summaries.every(item=>item.completedSeasons===item.totalSeasons));
  assert.ok(summaries.every(item=>item.terminalPhase==="TERMINAL_CLOSED"));
  process.stdout.write(`PASS Full gameplay lifecycle: one continuous deterministic authority chain completed 1/3/5/10-season Showdowns from Career Start through every season's Transfer Challenge, private Results, dual-ack Season Commit, canonical scoring, converged history, exact next-season progression, Final Reconciliation and Terminal Close while preserving Bundesliga + SC Freiburg/Hertha BSC. ${JSON.stringify(summaries)}\n`);
})().catch(error=>{console.error("FULL GAMEPLAY LIFECYCLE CONTRACT FAILED");console.error(error.stack||error);process.exit(1);});

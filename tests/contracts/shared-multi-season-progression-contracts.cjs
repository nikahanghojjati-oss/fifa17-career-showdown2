const assert=require("node:assert/strict");
const multi=require("../../js/sharedMultiSeasonProgression.js");
const history=require("../../js/sharedHistoryConvergence.js");

const rivalryId=`pair_${"a".repeat(64)}`;
const managerSlots=[
  {slotId:"playerOne",accountId:"uid-one",profileId:`profile_${"1".repeat(24)}`,saveId:`save_${"3".repeat(24)}`,entitlementState:"active"},
  {slotId:"playerTwo",accountId:"uid-two",profileId:`profile_${"2".repeat(24)}`,saveId:`save_${"4".repeat(24)}`,entitlementState:"active"}
];
const resultOne={leaguePosition:1,leaguePoints:90,leagueGoals:90,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false};
const resultTwo={leaguePosition:2,leaguePoints:80,leagueGoals:80,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false};
const score=result=>({championsLeague:result.championsLeague?5:0,leagueTitle:result.leaguePosition===1?3:0,domesticCup:result.domesticCup?1:0,performanceBonus:result.leaguePoints>=100||result.leagueGoals>=100?1:0,individualAwardsBonus:result.topScorer||result.topAssist?1:0,total:(result.championsLeague?5:0)+(result.leaguePosition===1?3:0)+(result.domesticCup?1:0)+(result.leaguePoints>=100||result.leagueGoals>=100?1:0)+(result.topScorer||result.topAssist?1:0)});
const hex="123456789a";
const source=seasonNumber=>{
  const hash=`sha256:${hex[seasonNumber-1].repeat(64)}`;
  const results={playerOne:{...resultOne},playerTwo:{...resultTwo}};
  return {
    commit:{ok:true,committed:true,phase:"ACKNOWLEDGED",revision:3,resultsRevision:2,resultsContentHash:hash,seasonNumber,rivalryId,results},
    scoring:{ok:true,authoritative:true,phase:"SCORING_RECONCILED",revision:1,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:hash,seasonNumber,rivalryId,scoring:{playerOne:score(results.playerOne),playerTwo:score(results.playerTwo)},winner:"playerOne"}
  };
};
const setupFor=(totalSeasons,clubs={playerOne:"Arsenal",playerTwo:"Chelsea"})=>({schemaVersion:1,objectType:"sharedSetupLedger",rivalryId,phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",leagueId:"premier_league",clubs,totalSeasons});
const historyFor=(totalSeasons,acceptedSeasons,clubs)=>acceptedSeasons===0?null:history.buildProjection({rivalryId,setup:setupFor(totalSeasons,clubs),managerSlots,seasons:Array.from({length:acceptedSeasons},(_,index)=>source(index+1))});

assert.equal(multi.feature,"ssjr-shared-multi-season-progression-factory");
assert.equal(multi.runtimeRevision,"1.9.1-r13");
assert.deepEqual([...multi.supportedLengths],[1,3,5,10]);
assert.equal(multi.fixedClubs,true);
assert.equal(multi.exactOnceProgression,true);
assert.equal(multi.resumableFromContiguousHistory,true);
assert.equal(multi.canonicalStorageMutation,false);
assert.equal(multi.providerWriteRequired,false);
assert.equal(multi.listPermissionRequired,false);
assert.equal(multi.billingRequired,false);

const protocol=multi.createProtocol({historyModule:history});
for(const totalSeasons of [1,3,5,10]){
  const setup=setupFor(totalSeasons);
  let state=protocol.derive({rivalryId,setup,history:null});
  assert.equal(state.revision,0);
  assert.equal(state.acceptedSeasons,0);
  assert.equal(state.activeSeason,1);
  assert.equal(state.completedSeason,null);
  assert.equal(state.phase,"SEASON_READY");
  assert.equal(state.terminal,false);
  assert.deepEqual(state.fixedClubs,setup.clubs);
  assert.ok(Object.isFrozen(state)&&Object.isFrozen(state.fixedClubs));
  assert.deepEqual(protocol.verifyState(state),state);

  for(let accepted=1;accepted<=totalSeasons;accepted+=1){
    const projection=historyFor(totalSeasons,accepted);
    const next=protocol.observe({previous:state,rivalryId,setup,history:projection});
    assert.equal(next.revision,accepted);
    assert.equal(next.acceptedSeasons,accepted);
    assert.equal(next.completedSeason,accepted);
    assert.deepEqual(next.fixedClubs,setup.clubs,`clubs must remain fixed through ${totalSeasons}-season plan at accepted season ${accepted}`);
    if(accepted===totalSeasons){
      assert.equal(next.phase,"SHOWDOWN_COMPLETE");
      assert.equal(next.activeSeason,null);
      assert.equal(next.terminal,true);
    }else{
      assert.equal(next.phase,"SEASON_READY");
      assert.equal(next.activeSeason,accepted+1);
      assert.equal(next.terminal,false);
    }
    assert.equal(protocol.observe({previous:next,rivalryId,setup,history:projection}).acceptedRevisionKey,next.acceptedRevisionKey,"same accepted history must replay idempotently");
    state=next;
  }
}

const setup3=setupFor(3);
const initial=protocol.derive({rivalryId,setup:setup3,history:null});
assert.throws(()=>protocol.observe({previous:initial,rivalryId,setup:setup3,history:historyFor(3,2)}),/MULTI_SEASON_SKIPPED_ADVANCE/,"a live observer must not jump over a season");
const one=protocol.observe({previous:initial,rivalryId,setup:setup3,history:historyFor(3,1)});
const two=protocol.observe({previous:one,rivalryId,setup:setup3,history:historyFor(3,2)});
assert.throws(()=>protocol.observe({previous:two,rivalryId,setup:setup3,history:historyFor(3,1)}),/MULTI_SEASON_REGRESSION/,"accepted history must never move backward");
const full=protocol.derive({rivalryId,setup:setup3,history:historyFor(3,3)});
assert.throws(()=>protocol.observe({previous:full,rivalryId,setup:setup3,history:historyFor(3,2)}),/MULTI_SEASON_TERMINAL_RESURRECTION/,"terminal completion must never reopen an earlier season");

const alteredSource=source(1);alteredSource.commit.resultsContentHash=`sha256:${"b".repeat(64)}`;alteredSource.scoring.resultsContentHash=alteredSource.commit.resultsContentHash;
const alteredHistory=history.buildProjection({rivalryId,setup:setup3,managerSlots,seasons:[alteredSource]});
assert.throws(()=>protocol.observe({previous:one,rivalryId,setup:setup3,history:alteredHistory}),/MULTI_SEASON_REPLAY_ALTERED/,"same progression revision cannot silently swap accepted history");

const otherClubs={playerOne:"Liverpool",playerTwo:"Manchester City"};
const driftHistory=historyFor(3,1,otherClubs);
assert.throws(()=>protocol.derive({rivalryId,setup:setup3,history:driftHistory}),/MULTI_SEASON_CLUB_DRIFT/,"history from different clubs cannot drive this progression plan");
assert.throws(()=>protocol.observe({previous:one,rivalryId,setup:setupFor(5),history:historyFor(5,1)}),/MULTI_SEASON_PLAN_DRIFT/,"season length cannot change after progression begins");

const tampered=JSON.parse(JSON.stringify(one));tampered.activeSeason=3;
assert.throws(()=>protocol.verifyState(tampered),/MULTI_SEASON_STATE_INVALID/);
const malformedHistory=JSON.parse(JSON.stringify(historyFor(3,2)));malformedHistory.seasonHistory[1].roundNumber=3;
assert.throws(()=>protocol.derive({rivalryId,setup:setup3,history:malformedHistory}),/MULTI_SEASON_HISTORY_INVALID|MULTI_SEASON_HISTORY_GAP/);

console.log("PASS Shared Multi Season Progression core: all supported 1/3/5/10 plans begin at Season 1, advance exactly one accepted contiguous season at a time, replay idempotently, keep league and clubs fixed, reconstruct a valid contiguous prefix on resume, close exactly at the configured final season, and reject skipped advance, regression, replay alteration, plan/club drift and terminal resurrection without canonical local-save mutation, provider writes, list permission or billing.");

const assert=require('node:assert/strict');
const fs=require('node:fs');
const production=require('../../js/productionSharedHistoryConvergence.js');

assert.equal(production.feature,'ssjr-production-shared-history-convergence');
assert.equal(production.productionEnabled,true);assert.equal(production.runtimeRevision,'1.9.1-r12');
assert.equal(production.requiresAcknowledgedSeasonCommit,true);assert.equal(production.requiresCanonicalScoring,true);assert.equal(production.providerEnforcedSource,true);
assert.equal(production.readOnlyDerivedProjection,true);assert.equal(production.identitySafe,true);assert.equal(production.exactSeasonAddressing,true);
assert.equal(production.canonicalStorageMutation,false);assert.equal(production.providerWriteRequired,false);assert.equal(production.listPermissionRequired,false);
assert.equal(production.billingRequired,false);assert.equal(production.blazeRequired,false);assert.equal(production.cloudRunRequired,false);assert.equal(production.cloudFunctionsRequired,false);
assert.equal(production.pollIntervalMs,15000);assert.equal(typeof production.install,'function');assert.equal(typeof production.refresh,'function');assert.equal(typeof production.getState,'function');

const source=fs.readFileSync('js/productionSharedHistoryConvergence.js','utf8');
assert.match(source,/productionSharedShowdownSetup\.js/);assert.match(source,/productionSharedSeasonCommit\.js/);assert.match(source,/productionSharedCanonicalScoring\.js/);
assert.match(source,/sharedHistoryConvergence\.js/);assert.match(source,/sharedShowdownCatalog\.js/);assert.match(source,/sparkSharedHistoryConvergence\.js/);assert.match(source,/productionFirebaseRuntime\.js/);
assert.ok(source.indexOf('js/sharedShowdownCatalog.js')<source.indexOf('js/sparkSharedSeasonCommit.js'),'history cold-load path must initialize the catalog before the r10 provider factory.');
assert.ok(source.indexOf('js/sparkSharedSeasonCommit.js')<source.indexOf('js/sparkSharedHistoryConvergence.js'),'r10 provider must load before r12 History Convergence provider factory.');
assert.ok(source.indexOf('js/sparkSharedCanonicalScoring.js')<source.indexOf('js/sparkSharedHistoryConvergence.js'),'r11 provider must load before r12 History Convergence provider factory.');
const cachedGate=source.indexOf('if(!phcCachedTerminal(request))return phcClear(request);');
const commitRefresh=source.indexOf('await commitApi.refresh()');
const scoringRefresh=source.indexOf('await scoringApi.refresh()');
const providerRead=source.indexOf('provider.read(await phcProviderOptions(request))');
assert.ok(cachedGate>=0&&commitRefresh>cachedGate&&scoringRefresh>commitRefresh&&providerRead>scoringRefresh,'r12 must remain dormant until cached terminal r10/r11 authority exists, then refresh upstream authority before reading exact history.');
assert.match(source,/commit\.phase==="ACKNOWLEDGED"/);assert.match(source,/commit\.revision===3/);assert.match(source,/scoring\.phase==="SCORING_RECONCILED"/);assert.match(source,/scoring\.revision===1/);
assert.match(source,/resultsContentHash/);assert.match(source,/resultsRevision/);assert.match(source,/throughSeason:request\.throughSeason/);
assert.match(source,/ensureAccountServices\(\)/);assert.match(source,/setup\.sessionId/);assert.match(source,/setup\.deviceId/);assert.match(source,/setup\.accountId/);
assert.match(source,/sharedHistoryConvergencePanel/);assert.match(source,/SHOWDOWN SO FAR/);assert.match(source,/managerRecords/);assert.match(source,/trophyAttribution/);
assert.match(source,/ leads by /);assert.match(source,/"Level"/);assert.match(source,/p1Total-p2Total|p2Total-p1Total/,'Accepted history must show the cumulative Showdown score and current point gap after every season.');
assert.doesNotMatch(source,/saveCurrentShowdown|persistCompletedSeason|localStorage\.setItem|sessionStorage\.setItem/);
assert.doesNotMatch(source,/runTransaction|\.set\(|\.update\(|\.delete\(/);
assert.doesNotMatch(source,/calculatePlayerSeasonScore|determineSeasonWinner/);
assert.match(source,/billingRequired:false/);assert.match(source,/blazeRequired:false/);assert.match(source,/cloudRunRequired:false/);assert.match(source,/cloudFunctionsRequired:false/);

// r80: a page that finished one Showdown and starts the next without a reload still holds the finished Showdown's
// ACKNOWLEDGED Commit and SCORING_RECONCILED views for season 1. They must not count as the new Showdown's season 1:
// no provider read, no fast-poll wait, no "Unable to converge Shared History" report.
async function historyAcrossShowdowns(){
  const vm=require('node:vm');
  const terminal=(rivalryId,seasonNumber)=>({
    commit:{rivalryId,committed:true,phase:'ACKNOWLEDGED',revision:3,seasonNumber,resultsRevision:2,resultsContentHash:`hash-${rivalryId}`},
    scoring:{rivalryId,authoritative:true,phase:'SCORING_RECONCILED',revision:1,seasonNumber,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:`hash-${rivalryId}`}
  });
  const setupFor=rivalryId=>({ready:true,rivalryId,sessionId:`session-${rivalryId}`,deviceId:'device-1',accountId:'uid-1',managerRole:'playerOne',setup:{phase:'SHOWDOWN_CONFIRMED',revision:6,totalSeasons:1}});
  const state={setup:setupFor('R1'),...terminal('R1',1)},reads=[],reports=[];
  const sandbox={
    console,Date,Promise,Error,Object,String,Number,Boolean,
    currentShowdown:{id:'save-r1',currentRound:1,sharedJourney:{mode:'shared',rivalryId:'R1'}},
    CareerModeProductionSharedShowdownSetup:{refresh:async()=>state.setup,getState:()=>state.setup},
    CareerModeProductionSharedSeasonCommit:{refresh:async()=>state.commit,getState:()=>state.commit},
    CareerModeProductionSharedCanonicalScoring:{refresh:async()=>state.scoring,getState:()=>state.scoring},
    CareerModeSharedHistoryConvergence:{},CareerModeSharedShowdownCatalog:{},CareerModeSparkSharedSeasonCommit:{},CareerModeSharedCanonicalScoring:{},CareerModeSparkSharedCanonicalScoring:{},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({auth:{currentUser:{uid:'uid-1'}},firestore:{},firestoreSdk:{}})},
    CareerModeSparkSharedHistoryConvergence:{read:async options=>{
      reads.push(options.rivalryId);
      // The provider only converges a rivalry whose season both managers have published and committed.
      if(state.commit.rivalryId!==options.rivalryId){const error=new Error('Both managers must publish their season before Shared History converges.');error.code='HISTORY_CONVERGENCE_SEASON_NOT_ACCEPTED';throw error;}
      return {ok:true,authoritative:true,phase:'HISTORY_CONVERGED',revision:1,rivalryId:options.rivalryId,throughSeason:options.throughSeason,acceptedRevisionKey:`k-${options.rivalryId}`,projection:{phase:'HISTORY_CONVERGED',acceptedSeasons:options.throughSeason}};
    }},
    reportApplicationError:(context,error)=>reports.push(`${context}: ${error?.message||error}`)
  };
  sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync('js/productionSharedHistoryConvergence.js','utf8'),sandbox,{filename:'productionSharedHistoryConvergence.js'});
  const history=sandbox.CareerModeProductionSharedHistoryConvergence;
  // Showdown 1 (R1) finishes its only season: History converges once for R1.
  const first=await history.refresh();
  assert.equal(first?.phase,'HISTORY_CONVERGED','R1 season 1 converges');assert.deepEqual(reads,['R1']);
  // Same page, no reload: Showdown 2 (R2) is confirmed and on season 1; Commit and Scoring still hold R1's season 1.
  sandbox.currentShowdown={id:'save-r2',currentRound:1,sharedJourney:{mode:'shared',rivalryId:'R2'}};
  state.setup=setupFor('R2');
  assert.equal(history.isWaitingForRival(),false,'R1 cached Commit/Scoring never put R2 season 1 in the Shared History fast-poll wait');
  for(let i=0;i<3;i++)assert.equal(await history.refresh(),null,'R2 season 1 stays dormant while only R1 authority is cached');
  assert.deepEqual(reads,['R1'],'no Shared History provider read for R2 until R2 has its own ACKNOWLEDGED Commit and SCORING_RECONCILED Scoring');
  assert.deepEqual(reports,[],'no "Unable to converge Shared History" report on the next Showdown');
  // R2's own season 1 is accepted: exactly one read converges it.
  Object.assign(state,terminal('R2',1));
  assert.equal(history.isWaitingForRival(),true,'R2 season 1 waits for History once its own authority is cached');
  const second=await history.refresh();
  assert.equal(second?.rivalryId,'R2');assert.equal(second?.phase,'HISTORY_CONVERGED');assert.deepEqual(reads,['R1','R2']);assert.deepEqual(reports,[]);
}

historyAcrossShowdowns().then(()=>{
process.stdout.write('PASS Shared History Convergence production contracts: r12 remains dormant until exact cached r10 ACKNOWLEDGED and r11 SCORING_RECONCILED authority exists for the same season, refreshes those predecessors before one exact read-only provider projection, renders converged season history/manager records/trophies plus cumulative Showdown totals and lead without a second scoring policy, preserves stable account/device/rivalry/session identity, and exposes no write/list/billing authority. R1-then-R2 on one page: cached Commit/Scoring must match the request rivalry, so a finished Showdown season never stands in for the next Showdown season.\n');
}).catch(error=>{console.error(error);process.exitCode=1;});

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const adapter=read('js/productionSharedSeasonResults.js');
const route=read('js/productionSharedSeasonResultsRoute.js');
const bootstrap=read('js/ssjr.js');
const screens=read('js/screens.js');
const seasonEngine=read('js/seasonEngine.js');
const transfer=read('js/productionSharedTransferChallenge.js');

assert.match(adapter,/feature:\"ssjr-production-shared-season-results\"/);
assert.match(adapter,/productionEnabled:true/);
assert.match(adapter,/requiresCompletedSharedTransfer:true/);
assert.match(adapter,/privateUntilBothPublished:true/);
assert.match(adapter,/reusesSeasonEntry:true/);
assert.match(adapter,/interceptsLocalSeasonPersistence:true/);
assert.match(adapter,/authoritativeScoring:false/);
assert.match(adapter,/canonicalStorageMutation:false/);
assert.match(adapter,/billingRequired:false/);
assert.match(adapter,/blazeRequired:false/);
assert.match(adapter,/cloudRunRequired:false/);
assert.match(adapter,/cloudFunctionsRequired:false/);
assert.match(adapter,/canRoute:pssrCanRoute/,'shared Season Results must expose a bounded router capability after refreshed authority is proven');
assert.match(adapter,/contextKey===request\.key[\s\S]*pssrTransferComplete\(request\)/,'shared route authority must be bound to the exact current Save, rivalry, season and completed remote Transfer Challenge');
assert.match(adapter,/sharedShowdownCatalog\.js/);
assert.ok(adapter.indexOf('js/sharedShowdownCatalog.js')<adapter.indexOf('js/sparkSharedSeasonResults.js'),'Season Results must load the authoritative catalog before provider factory initialization');
assert.match(adapter,/provider\.publishResult/);
assert.match(adapter,/provider\.read/);
assert.match(adapter,/try\{await transferApi\.refresh\(\);\}catch\(error\)\{if\(!\(pssrContextMatches\(request\)&&pssrTransferComplete\(request\)\)\)throw error;\}if\(!pssrContextMatches\(request\)\)pssrFail\("SEASON_RESULTS_CONTEXT_STALE"\)/,'a failed Transfer Challenge refresh may be ignored only for a matching completed season; other failures must be rethrown and the context rechecked');
assert.match(adapter,/pssrFingerprint\(currentResult\)!==draft\.fingerprint/,'reviewed payload must be revalidated immediately before publication');
assert.match(adapter,/draft&&draft\.contextKey===contextKey[\s\S]*pssrRenderReview\(draft\.result\)/,'ordinary provider refresh must preserve an unpublished local Review draft');
assert.doesNotMatch(adapter,/current\.finally\(/,'refresh cleanup must not create an ignored rejecting finally child promise');
assert.match(adapter,/Your rival cannot see this result until they publish their own/);
// Job 33 (R8): the duplicate RESULTS_READY banners are gone; the Shared Season Commit status is the one line that directs the player onward.
assert.match(adapter,/if\(warning\)\{pssrHidden\(warning,ready\);/,'RESULTS_READY must hand the next-step banner to Shared Season Commit instead of repeating it');
assert.match(read('js/productionSharedSeasonCommit.js'),/BOTH RESULTS ARE READY · AS COORDINATOR, COMMIT THE IMMUTABLE SHARED SEASON SNAPSHOT[\s\S]*BOTH RESULTS ARE READY · WAITING FOR \$\{psscManagerName\(coordinator\)\} TO COMMIT/,'RESULTS_READY must direct the real player into the next authoritative capability (Shared Season Commit) instead of presenting r9 as a terminal step');
for(const field of ['leaguePosition','leaguePoints','leagueGoals','domesticCup','championsLeague','topScorer','topAssist'])assert.match(adapter,new RegExp(`${field}:`),`production adapter must use canonical field ${field}`);
assert.doesNotMatch(adapter,/persistCompletedSeason\s*\(/,'shared publication adapter must not call local season persistence');
assert.doesNotMatch(adapter,/saveCurrentShowdown\s*\(/,'shared publication adapter must not write canonical local save authority');
assert.doesNotMatch(adapter,/calculatePlayerSeasonScore\s*\(/,'r9 publication must not make local scoring authoritative');
assert.doesNotMatch(adapter,/determineSeasonWinner\s*\(/,'r9 publication must not make local winner calculation authoritative');

assert.match(screens,/if\(screenName===\"seasonEntry\"\)try\{if\(window\.CareerModeProductionSharedSeasonResults\?\.canRoute\?\.\(\)\)return true\}catch\(_\)\{\}/,'core navigation must directly authorize seasonEntry only through the refreshed r9 production adapter capability');
const sharedSeasonGate=screens.indexOf('CareerModeProductionSharedSeasonResults?.canRoute?.()');
const localClubGate=screens.indexOf('const clubsValid = getClubPairRouteState(showdown);');
assert.ok(sharedSeasonGate>=0&&localClubGate>=0&&sharedSeasonGate<localClubGate,'shared Season Results authority must be evaluated before local league/club/challenge gates without mutating local state');

assert.match(route,/feature:\"ssjr-production-shared-season-results-route\"/);
assert.match(route,/requiresCompletedSharedTransfer:true/);
assert.match(route,/preservesTransferRuntime:true/);
assert.match(route,/directDashboardRoute:true/);
assert.match(route,/sharedReviewEscape:true/);
assert.match(route,/sharedRouteAuthority:true/);
assert.match(route,/coreNavigationAuthority:true/,'the route bridge must declare that core screens.js owns navigation authority');
assert.doesNotMatch(route,/root\.isRouteStateValid\s*=/,'r9 must not monkeypatch a non-exported router binding');
assert.doesNotMatch(route,/routeInstallNavigationGate|ROUTE_GATE|ssjrOriginal/,'obsolete route monkeypatch machinery must remain retired');
assert.match(route,/!screen\.dataset\.sharedTransferReplay/,'historical full-screen replay must not fall through into live Season Results');
assert.match(route,/CONTINUE TO SHARED SEASON RESULTS/);
assert.match(route,/ENTER SHARED SEASON RESULTS/);
assert.match(route,/seasonPrimaryAction/,'completed shared Transfer Challenge must route directly from Showdown Home');
assert.match(route,/sharedSeasonResultsRouteStyle/,'shared review must preserve a visible escape to Showdown Home while local complete action stays hidden');
assert.match(route,/productionSharedSeasonResults\.js/);
assert.match(route,/api\.install\(\);const opened=await api\.open\(\)/);
assert.match(route,/POST_RESULTS_MODULES/,'real Results routing must define one bounded downstream bootstrap list');
for(const expected of ['productionSharedSeasonCommit.js','productionSharedCanonicalScoring.js','productionSharedHistoryConvergence.js','productionSharedMultiSeasonProgression.js','productionSharedJourneyReconnect.js','productionSharedLocalReconciliation.js','productionSharedFinalReconciliation.js','productionSharedTerminalClose.js'])assert.match(route,new RegExp(expected.replace(/\./g,'\\.')), `real Results routing must bootstrap ${expected}`);
assert.match(route,/sharedLocalReconciliation\.js/,'Local Reconciliation protocol must be available before its production adapter installs');
assert.match(route,/await routeBootstrapPostResults\(\)/,'opening the real Results route must activate the post-results chain before returning control to the player');
assert.match(route,/canonicalStorageMutation:false/);
assert.match(route,/authoritativeScoring:false/);
assert.match(route,/billingRequired:false/);

const routeInstall=bootstrap.indexOf('ssjr-production-season-results-route');
const transferInstall=bootstrap.indexOf('ssjr-production-transfer-challenge');
assert.ok(routeInstall>=0,'Shared Season Results route must be installed by the Shared Journey bootstrap');
assert.ok(transferInstall>=0,'Shared Transfer Challenge must remain installed');
assert.ok(routeInstall<transferInstall,'Season Results route capture must install before the inherited Transfer Challenge capture');
assert.doesNotMatch(bootstrap,/await install\("ssjr-production-season-results-route"/,'r9 route loading must not serially block paired-first entry/guard startup');
assert.match(bootstrap,/const seasonResultsRoute=install\("ssjr-production-season-results-route"[\s\S]*await Promise\.all\(\[[\s\S]*ssjr-production-entry[\s\S]*ssjr-production-guard[\s\S]*async\(\)=>\{await seasonResultsRoute;return install\("ssjr-production-transfer-challenge"/,'paired-first entry and guard must start in parallel while only Transfer Challenge waits for r9 capture ordering');
assert.match(bootstrap,/CareerModeProductionSharedSeasonResults/);
assert.match(seasonEngine,/function confirmCurrentSeason\(\)[\s\S]*persistCompletedSeason\(roundRecord, seasonNumber\)/,'ordinary local Season Results persistence must remain intact behind the shared capture boundary');
assert.match(transfer,/SHARED SEASON RESULTS COMING NEXT/,'r8 remains fail-closed when the r9 route is unavailable');

console.log('PASS Shared Season Results production contracts: core navigation grants seasonEntry only from refreshed shared authority; the real Results route bootstraps the bounded post-results production chain; completed Shared Transfer Challenge routes from verdicts and Showdown Home into the existing Season Results shell; paired-first startup remains nonblocking; each manager reviews and immutably publishes only their own canonical payload; opponent data stays private until both publish; Results now hands off to Shared Season Commit instead of presenting stale r9 dead-end copy; local persistence/scoring authority remains unchanged; and the r8 fallback stays fail-closed.');


// JOB-1579: a completed provider read may not override a later navigation choice.
const vm=require('node:vm');
async function verifySharedSeasonResultsNewerNavigationWins(){
  function createDeferredOpen(){
    let revision=1,releaseRead,notifyReadStarted;
    const readStarted=new Promise(resolve=>{notifyReadStarted=resolve;});
    const providerRead=new Promise(resolve=>{releaseRead=resolve;});
    const navigations=[];
    const setupState={
      ready:true,
      setup:{phase:'SHOWDOWN_CONFIRMED',revision:6},
      managerRole:'playerOne',
      rivalryId:'job-1579-rivalry',
      sessionId:'job-1579-session',
      deviceId:'job-1579-device'
    };
    const sandbox={
      module:{exports:{}},
      currentShowdown:{
        id:'job-1579-save',
        currentRound:1,
        sharedJourney:{mode:'shared',rivalryId:'job-1579-rivalry'}
      },
      getNavigationRevision:()=>revision,
      navigateTo:async screen=>{navigations.push(screen);return true;},
      CareerModeProductionSharedShowdownSetup:{
        refresh:async()=>{},getState:()=>setupState
      },
      CareerModeProductionSharedTransferChallenge:{
        refresh:async()=>{},
        getState:()=>({seasonNumber:1,state:{phase:'COMPLETED'}})
      },
      CareerModeSharedShowdownCatalog:{},
      CareerModeSharedShowdownSetup:{},
      CareerModeSharedSeasonResults:{},
      CareerModeSparkSharedSeasonResults:{
        read:()=>{notifyReadStarted();return providerRead;},
        publishResult:async()=>({ok:true})
      },
      CareerModeProductionFirebaseRuntime:{
        ensureAccountServices:async()=>({
          ok:true,auth:{currentUser:{uid:'job-1579-player'}},
          firestore:{},firestoreSdk:{}
        })
      }
    };
    vm.runInNewContext(adapter,sandbox,{filename:'productionSharedSeasonResults.js'});
    return {
      api:sandbox.module.exports,
      readStarted,
      moveAway:()=>{revision=2;},
      completeRead:()=>releaseRead({
        ok:true,managerRole:'playerOne',
        seasonNumber:1,state:{phase:'RESULTS_ENTRY'}
      }),
      navigations
    };
  }

  const moved=createDeferredOpen();
  const movedOpen=moved.api.open();
  await moved.readStarted;
  moved.moveAway();
  moved.completeRead();
  assert.equal(await movedOpen,false,'newer navigation must cancel the old results open');
  assert.deepEqual(moved.navigations,[],'late provider read must never navigate after a newer tap');

  const unchanged=createDeferredOpen();
  const unchangedOpen=unchanged.api.open();
  await unchanged.readStarted;
  unchanged.completeRead();
  assert.equal(await unchangedOpen,true,'unchanged navigation revision permits opening results');
  assert.deepEqual(unchanged.navigations,['seasonEntry'],'unchanged revision navigates to results exactly once');
}
verifySharedSeasonResultsNewerNavigationWins().then(
  ()=>console.log('PASS JOB-1579 shared Season Results navigation revision regression: newer tap wins; unchanged revision opens seasonEntry once.'),
  error=>{console.error(error);process.exitCode=1;}
);

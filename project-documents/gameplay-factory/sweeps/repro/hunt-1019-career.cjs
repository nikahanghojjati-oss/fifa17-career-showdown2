const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../../../..');
const Analytics=require(path.join(ROOT,'js/sharedCareerAnalytics.js'));
const Screens=require(path.join(ROOT,'js/careerScreensV10.js'));
const Seam=require(path.join(ROOT,'js/careerScreenSeam.js'));
const {result,projection}=require(path.join(ROOT,'tests/support/career-fixture-helpers.cjs'));
const rid='pair_'+'1'.repeat(64);
const model=n=>Analytics.buildCareerModel({indexStatus:'ready',showdowns:[{rivalryId:rid,classification:'active',
  projection:projection({totalSeasons:3,seasons:Array.from({length:n},()=>[result({domesticCup:true}),result()])}),final:null}]});
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {resolve,promise};}
(async()=>{
  const pending=[];
  const c=vm.createContext({console,
    CareerModeOnlinePlayerIdentity:{getState:()=>({status:'ready',registered:true,managerId:'daniel'})},
    CareerModeSparkConnectedAccount:{getState:()=>({connected:true,accountId:'Daniel'})},
    CareerModePersistentNikDanielPair:{getState:()=>({rivalryId:rid})},
    CareerModeSharedActiveShowdownAdapter:{buildActiveShowdownViews:()=>({careerInput:{}})},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:'Daniel'}},firestoreSdk:{getDoc(){}}})},
    CareerModeSparkClosedShowdownCareerLoader:{loadClosedShowdownCareer(){const d=deferred();pending.push(d);return d.promise;}},
    loadRuntimeScript:async()=>{}});
  vm.runInContext(fs.readFileSync(path.join(ROOT,'js/rivalryLegacyV10.js'),'utf8'),c,{filename:'js/rivalryLegacyV10.js'});
  const api=c.CareerModeRivalryLegacyV10;
  const old=api.loadCareerModel();while(pending.length<1)await new Promise(r=>setImmediate(r));
  const newer=api.loadCareerModel();while(pending.length<2)await new Promise(r=>setImmediate(r));
  pending[1].resolve({model:model(2)});await newer;
  assert.equal(api.cachedCareerModel().managers.daniel.seasons,2);
  pending[0].resolve({model:model(1)});await old;
  assert.equal(api.cachedCareerModel().managers.daniel.seasons,1);
  console.log('H1019-4 CONFIRMED: overlapping career loads settle 2 then 1; cached accepted seasons regress from 2 to 1');

  const abandoned=Analytics.buildCareerModel({indexStatus:'ready',showdowns:[{rivalryId:rid,classification:'abandoned',projection:null,final:null}]});
  assert.equal(abandoned.status,'ready');assert.equal(abandoned.managers.daniel.careerPoints,0);
  assert.equal(Seam.careerScreenView('careerStatistics',abandoned).status,'ready');
  assert.equal(Screens.toV10Frame(abandoned,'careerStatistics').status,'unavailable');
  assert.equal(Screens.toV10Frame(abandoned,'trophyRoom').status,'ready');
  console.log('H1019-5 CONFIRMED: abandoned-only career, Stats=unavailable versus Trophy Room=ready and zero totals');
})().catch(e=>{console.error(e);process.exitCode=1;});

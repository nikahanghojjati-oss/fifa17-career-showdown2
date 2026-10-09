// Public production adapter, fake form controls and read-only provider responses.
// No browser or Firebase; any publish is recorded in memory only.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const ROOT=path.resolve(__dirname,'../../../..');
function node(){const classes=new Set();return {value:'',checked:false,disabled:false,dataset:{},textContent:'',
  classList:{contains:s=>classes.has(s),toggle(s,on){on?classes.add(s):classes.delete(s);}},
  setAttribute(){},closest(){return null;},append(){},replaceChildren(){}};}
const fields={};
for(const role of ['p1','p2'])for(const suffix of ['LeaguePosition','LeaguePoints','LeagueGoals','DomesticCup','ChampionsLeague','TopScorer','TopAssist'])fields[role+suffix]=node();
for(const id of ['seasonEntry','completeSeason','seasonReviewPanel','seasonReviewOne','seasonReviewTwo','confirmSeasonCompletion','editSeasonResults','seasonEntryError','seasonReviewError'])fields[id]=node();
let season=1,own=null,published=null,capture;
const rid='pair_'+'1'.repeat(64);
const setup={ready:true,managerRole:'playerOne',rivalryId:rid,sessionId:'session',deviceId:'device',
  setup:{phase:'SHOWDOWN_CONFIRMED',revision:6,leagueId:'premier_league'}};
const c=vm.createContext({console,crypto:webcrypto,TextEncoder,
  currentShowdown:{id:1,currentRound:1,sharedJourney:{mode:'shared',rivalryId:rid},managers:{playerOne:'Daniel',playerTwo:'Nik'}},
  document:{getElementById:id=>fields[id]??null,querySelector:()=>null,createElement:node,createDocumentFragment:node,
    addEventListener:(_type,fn)=>{capture=fn;}},
  CareerModeProductionSharedShowdownSetup:{refresh:async()=>{},getState:()=>setup},
  CareerModeProductionSharedTransferChallenge:{refresh:async()=>{},getState:()=>({seasonNumber:season,state:{phase:'COMPLETED'}})},
  CareerModeSharedShowdownCatalog:{catalog:{premier_league:Array(20).fill('club')}},
  CareerModeSharedShowdownSetup:{},CareerModeSharedSeasonResults:{},
  CareerModeProductionSharedMultiSeasonProgression:{resolveSeason:()=>season},
  CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:'Daniel'}},firestore:{},firestoreSdk:{}})},
  CareerModeSparkSharedSeasonResults:{read:async()=>({ok:true,managerRole:'playerOne',seasonNumber:season,revision:own?1:0,ownResult:own,state:own?{phase:'COLLECTING'}:null}),
    publishResult:async opts=>{published=opts;own=opts.result;return {ok:true};}},
  navigateTo:async()=>true,loadRuntimeScript:async()=>{},addEventListener(){}});
vm.runInContext(fs.readFileSync(path.join(ROOT,'js/productionSharedSeasonResults.js'),'utf8'),c,{filename:'js/productionSharedSeasonResults.js'});
(async()=>{
  const api=c.CareerModeProductionSharedSeasonResults; api.install();
  own={leaguePosition:1,leaguePoints:102,leagueGoals:120,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true};
  await api.open();
  assert.equal(fields.p1LeaguePoints.value,'102');
  season=2;own=null;
  await api.open();
  assert.equal(api.getState().seasonNumber,2);assert.equal(api.canRoute(),true);
  assert.equal(fields.p1LeaguePoints.value,'102');assert.equal(fields.p1ChampionsLeague.checked,true);
  assert.equal(fields.p1LeaguePoints.disabled,false);
  function click(id){capture({target:{closest:()=>({id})},preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}});}
  for(const suffix of ['LeaguePosition','LeaguePoints','LeagueGoals']) {
    const field=fields['p1'+suffix],original=field.value;
    for(const value of ['', '-1', '0.5', '100000000000000000000', 'text']) {
      field.value=value;click('completeSeason');click('confirmSeasonCompletion');
      assert.ok(fields.seasonEntryError.textContent || fields.seasonReviewError.textContent);
      assert.equal(published,null);
    }
    field.value=original;
  }
  console.log('CONTROLS: shared form rejects empty, negative, decimal, huge and text numeric inputs before publish');
  click('completeSeason');click('confirmSeasonCompletion');
  for(let i=0;i<20&&!published;i++)await new Promise(resolve=>setImmediate(resolve));
  assert.equal(published.seasonNumber,2);assert.equal(published.result.leaguePoints,102);
  console.log('H1019-3 CONFIRMED: opening empty season 2 retains season 1 values and checked trophies; two taps republish them as season 2');
})().catch(e=>{console.error(e);process.exitCode=1;});

const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const {chromium}=require('playwright');
const root=process.cwd();
fs.mkdirSync(path.join(root,'work/codex-1006-1301'),{recursive:true});
const Results=require(path.join(root,'js/sharedSeasonResults.js'));
const Scoring=require(path.join(root,'js/sharedCanonicalScoring.js'));
const states=new Map();
let protocol,scoring,totalSeasons=3;
const setupFacts=()=>({phase:'SHOWDOWN_CONFIRMED',revision:6,totalSeasons,confirmedRoles:['playerOne','playerTwo']});
function projection(role,seasonNumber){
  const state=states.get(seasonNumber)||null;
  const projected=state?protocol.projectForRole(state,role):{revision:0,managerRole:role,seasonNumber,ownResult:null,opponentResult:null,allResults:null};
  return {ok:true,...projected,state:state?{phase:state.phase}:null};
}
async function prepare(page,role,season=1,total=3){
  await page.goto(process.env.CMS_BASE_URL||'http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
  await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:15000});
  await page.evaluate(async({role,season,total})=>{
    await ensureGameplayModules();
    await loadRuntimeScript('area09-catalog','js/sharedShowdownCatalog.js',()=>window.CareerModeSharedShowdownCatalog);
    const rivalryId='pair_'+('9'.repeat(64)),sessionId='session_'+('8'.repeat(64));
    currentShowdown={id:'area09-showdown',name:'Daniel vs Nik',currentRound:season,totalRounds:total,status:'Ready',sharedJourney:{mode:'shared',rivalryId},managers:{playerOne:'Daniel',playerTwo:'Nik'},selectedLeague:null,clubs:{playerOne:null,playerTwo:null},transferChallenges:[],rounds:[],score:{playerOne:0,playerTwo:0}};
    const setup={ready:true,rivalryId,sessionId,deviceId:'device_'+('1'.repeat(32)),accountId:role,managerRole:role,setup:{phase:'SHOWDOWN_CONFIRMED',revision:6,leagueId:'premier_league',clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'},totalSeasons:total,confirmedRoles:['playerOne','playerTwo']}};
    const transfer=()=>({ok:true,seasonNumber:window.CareerModeProductionSharedMultiSeasonProgression?.resolveSeason(currentShowdown.currentRound)||currentShowdown.currentRound,state:{phase:'COMPLETED'},setup:setup.setup});
    window.CareerModeProductionSharedShowdownSetup={getState:()=>setup,refresh:async()=>setup};
    window.CareerModeProductionSharedTransferChallenge={getState:transfer,refresh:async()=>transfer()};
    window.CareerModeSparkSharedSeasonResults={read:async o=>window.__area09Read({role,season:o.seasonNumber}),publishResult:async o=>window.__area09Publish({role,season:o.seasonNumber,result:o.result,baseRevision:o.baseRevision,operationId:o.operationId})};
    window.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:role}},firestore:{},firestoreSdk:{}})};
    // Keep the full game screen and Results route. Supply completed transfer and
    // ordinary game reads locally; sign-in and service setup are outside this sweep.
    window.CareerModeSharedLocalReconciliation={contractVersion:1};
    for(const name of ['CareerModeProductionSharedSeasonCommit','CareerModeProductionSharedCanonicalScoring','CareerModeProductionSharedHistoryConvergence','CareerModeProductionSharedJourneyReconnect','CareerModeProductionSharedLocalReconciliation','CareerModeProductionSharedFinalReconciliation','CareerModeProductionSharedTerminalClose'])window[name]={install:()=>true,getState:()=>null,refresh:async()=>null};
    window.CareerModeProductionSharedMultiSeasonProgression={install:()=>true,resolveSeason:()=>currentShowdown.currentRound,getState:()=>null,refresh:async()=>null};
    if(season===1){
      window.__area09Accepted=0;
      const history=()=>window.__area09Accepted?{authoritative:true,phase:'HISTORY_CONVERGED',throughSeason:window.__area09Accepted,projection:{acceptedSeasons:window.__area09Accepted}}:null;
      window.CareerModeProductionSharedHistoryConvergence={install:()=>true,getState:history,refresh:async()=>history()};
      window.CareerModeSparkSharedMultiSeasonProgression={read:async()=>{
        const n=window.__area09Accepted;
        return {ok:true,authoritative:true,runtimeRevision:'1.9.1-r13',rivalryId,phase:'SEASON_READY',state:{runtimeRevision:'1.9.1-r13',rivalryId,totalSeasons:total,acceptedSeasons:n,terminal:false},dashboard:{acceptedSeasons:n,managerTotals:{playerOne:n*11,playerTwo:0},lastSeason:n?{seasonNumber:n,winner:'playerOne',playerOne:{leaguePosition:1,score:11},playerTwo:{leaguePosition:2,score:0}}:null}};
      }};
      delete window.CareerModeProductionSharedMultiSeasonProgression;
      await loadRuntimeScript('area09-progression','js/productionSharedMultiSeasonProgression.js',()=>window.CareerModeProductionSharedMultiSeasonProgression);
      CareerModeProductionSharedMultiSeasonProgression.install();
      await CareerModeProductionSharedMultiSeasonProgression.refresh();
    }
    await loadRuntimeScript('area09-results','js/productionSharedSeasonResults.js',()=>window.CareerModeProductionSharedSeasonResults);
    await loadRuntimeScript('area09-route','js/productionSharedSeasonResultsRoute.js',()=>window.CareerModeProductionSharedSeasonResultsRoute);
    CareerModeProductionSharedSeasonResults.install();CareerModeProductionSharedSeasonResultsRoute.install();
    await navigateTo('dashboard',{addToHistory:false});CareerModeProductionSharedSeasonResultsRoute.decorate();
  },{role,season,total});
  await page.locator('#seasonPrimaryAction').click();
  await page.locator('#seasonEntry').waitFor({state:'visible'});
}
async function fill(page,role,result){
  const prefix=role==='playerOne'?'p1':'p2';
  for(const [suffix,key] of [['LeaguePosition','leaguePosition'],['LeaguePoints','leaguePoints'],['LeagueGoals','leagueGoals']])await page.locator('#'+prefix+suffix).fill(String(result[key]));
  for(const [suffix,key] of [['DomesticCup','domesticCup'],['ChampionsLeague','championsLeague'],['TopScorer','topScorer'],['TopAssist','topAssist']])await page.locator('#'+prefix+suffix).setChecked(result[key]);
}
async function publish(page){
  await page.locator('#completeSeason').click();
  await page.locator('#confirmSeasonCompletion').click();
  await page.waitForFunction(()=>/YOUR RESULT IS PUBLISHED|BOTH MANAGERS PUBLISHED/.test(document.getElementById('seasonReviewHeading')?.textContent||''));
}
async function form(page){return page.evaluate(()=>Object.fromEntries(['LeaguePosition','LeaguePoints','LeagueGoals','DomesticCup','ChampionsLeague','TopScorer','TopAssist'].map(k=>{const e=document.getElementById('p1'+k);return [k,e.type==='checkbox'?e.checked:e.value]})));}
(async()=>{
  protocol=await Results.createProtocol({teamCount:20,cryptoImpl:webcrypto});scoring=await Scoring.createProtocol({teamCount:20,cryptoImpl:webcrypto});
  const local={};vm.createContext(local);vm.runInContext(fs.readFileSync(path.join(root,'js/scoring.js'),'utf8'),local);
  let combinations=0;
  for(const teamCount of [18,20]){
    const p=await Scoring.createProtocol({teamCount,cryptoImpl:webcrypto});
    for(const position of [1,2])for(const points of [0,99,100])for(const goals of [0,99,100])for(let mask=0;mask<16;mask++){
      const r={leaguePosition:position,leaguePoints:points,leagueGoals:goals,domesticCup:!!(mask&1),championsLeague:!!(mask&2),topScorer:!!(mask&4),topAssist:!!(mask&8)};
      const expected=(r.championsLeague?5:0)+(position===1?3:0)+(r.domesticCup?1:0)+(points>=100||goals>=100?1:0)+(r.topScorer||r.topAssist?1:0);
      assert.equal(p.scoreAuthoritativeResults({playerOne:r,playerTwo:r}).scoring.playerOne.total,expected);
      assert.equal(local.calculatePlayerSeasonScore(r).total,expected);combinations++;
    }
  }
  console.log('PASS '+combinations+' season-score combinations in 18/20-club leagues: 0/99/100 boundaries and every trophy/award combination.');
  const browser=await chromium.launch({executablePath:process.env.CMS_CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  try{
    const one=await browser.newPage({viewport:{width:1280,height:800}}),two=await browser.newPage({viewport:{width:390,height:844},isMobile:true});
    for(const page of [one,two]){
      await page.exposeFunction('__area09Read',({role,season})=>projection(role,season));
      await page.exposeFunction('__area09Publish',async({role,season,result,baseRevision,operationId})=>{
        try{const applied=await protocol.apply({state:states.get(season)||null,setup:setupFacts(),careerStart:{phase:'CAREER_START_READY',revision:2,acknowledgedRoles:['playerOne','playerTwo']},transferChallenge:{phase:'COMPLETED',seasonNumber:season,revision:7},seasonNumber:season,actorRole:role,command:{type:'publish-result',operationId,baseRevision,result}});states.set(season,applied.state);return projection(role,season);}catch(e){return {ok:false,code:e.code};}
      });
    }
    const full={leaguePosition:1,leaguePoints:100,leagueGoals:100,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true};
    const zero={leaguePosition:2,leaguePoints:0,leagueGoals:0,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false};
    await prepare(one,'playerOne');await prepare(two,'playerTwo');
    await one.locator('#completeSeason').click();
    assert.match(await one.locator('#seasonEntryError').innerText(),/Enter league position/);assert.equal(states.has(1),false);
    await fill(one,'playerOne',full);await one.locator('#completeSeason').click();assert.equal(states.has(1),false,'Review must not publish.');
    await one.locator('#editSeasonResults').click();assert.equal((await form(one)).LeaguePoints,'100');
    await publish(one);
    assert.equal(await one.locator('#seasonReviewTwo').isVisible(),false);
    await one.reload();await prepare(one,'playerOne');
    assert.match(await one.locator('#seasonReviewHeading').innerText(),/YOUR RESULT IS PUBLISHED/);
    assert.equal(states.get(1).revision,1,'Reload must not publish twice.');
    await fill(two,'playerTwo',zero);await publish(two);
    await one.evaluate(()=>CareerModeProductionSharedSeasonResults.refresh());
    assert.equal(await one.locator('#seasonReviewTwo').isVisible(),true);
    const s1=scoring.scoreAuthoritativeResults(states.get(1).results);
    assert.equal(s1.scoring.playerOne.total,11);assert.equal(s1.scoring.playerTwo.total,0);
    console.log('PASS season 1 of 3: 11-0; both shared bonuses capped; published result survives halfway reload; no duplicate season.');
    // Move to the next completed transfer in the same page, as normal progression
    // does. Do not replace the form or reset its values in the fixture.
    await one.evaluate(async()=>{
      window.__area09Accepted=1;
      const panel=document.createElement('section');panel.id='sharedHistoryConvergencePanel';document.getElementById('seasonReviewPanel').appendChild(panel);
      await CareerModeProductionSharedMultiSeasonProgression.refresh();
    });
    // Advance through the actual season-advance function. Its page-level entry
    // gate is outside this results-only fixture; Results buttons are played normally.
    assert.equal(await one.evaluate(()=>CareerModeProductionSharedMultiSeasonProgression.canContinue()),true);
    assert.equal(await one.evaluate(()=>CareerModeProductionSharedMultiSeasonProgression.continueToNextSeason()),true);
    await one.waitForFunction(()=>CareerModeProductionSharedMultiSeasonProgression.resolveSeason()===2,null,{timeout:5000});
    assert.equal(await one.evaluate(()=>CareerModeProductionSharedMultiSeasonProgression.resolveSeason()),2);
    assert.equal(await one.evaluate(()=>currentShowdown.currentRound),1,'Use the real shared season advance, leaving the local round unchanged.');
    await one.locator('#seasonPrimaryAction').click();
    await one.locator('#seasonEntry').waitFor({state:'visible'});
    const carried=await form(one);
    console.log('Season 2 before any new results were entered: '+JSON.stringify(carried));
    const stale=Object.values(carried).some(value=>value!==false&&value!=='');
    await one.locator('#completeSeason').click();
    if(stale){
      console.log('Season 2 review: '+(await one.locator('#seasonReviewOne').innerText()).replace(/\s+/g,' '));
      await one.screenshot({path:path.join(root,'work/codex-1006-1301/season2-review.png'),fullPage:true});
      await one.locator('#confirmSeasonCompletion').click();
      await one.waitForFunction(()=>/YOUR RESULT IS PUBLISHED/.test(document.getElementById('seasonReviewHeading')?.textContent||''));
      assert.deepEqual(states.get(2).results.playerOne,full);
      console.log('WRONG RESULT: season 2 published all seven season 1 facts without a new result being entered (worth 11 points).');
    }else{
      assert.match(await one.locator('#seasonEntryError').innerText(),/Enter league position/);
      assert.equal(states.has(2),false);
    }
    totalSeasons=10;states.clear();
    await prepare(one,'playerOne',10,10);await prepare(two,'playerTwo',10,10);
    await fill(one,'playerOne',zero);await fill(two,'playerTwo',{...zero,leagueGoals:99});await publish(one);await publish(two);
    const s10=scoring.scoreAuthoritativeResults(states.get(10).results);
    assert.equal(s10.scoring.playerOne.total,0);assert.equal(s10.scoring.playerTwo.total,0);assert.equal(s10.winner,'draw');
    console.log('PASS season 10 of 10: 0-0; equal position and points draw despite different goals.');
    const tb=scoring.scoreAuthoritativeResults({playerOne:{...zero,leaguePosition:3,leaguePoints:80},playerTwo:{...zero,leaguePosition:2,leaguePoints:70}});assert.equal(tb.winner,'playerTwo');
    const pt=scoring.scoreAuthoritativeResults({playerOne:{...zero,leaguePoints:80},playerTwo:{...zero,leaguePoints:70}});assert.equal(pt.winner,'playerOne');
    console.log('PASS season tiebreak: league position, then league points.');
    assert.deepEqual(carried,{LeaguePosition:'',LeaguePoints:'',LeagueGoals:'',DomesticCup:false,ChampionsLeague:false,TopScorer:false,TopAssist:false},'A new season must not inherit last season results or trophy checks.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

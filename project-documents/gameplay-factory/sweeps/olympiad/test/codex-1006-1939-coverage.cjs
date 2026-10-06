"use strict";
// Area 05: game rules and actual local screens. The screen checks supply valid
// game snapshots at the existing game boundary; they do not test connection setup.
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../../../../..");
const fromRoot=p=>require(path.join(ROOT,p));
const F=fromRoot("tests/support/active-showdown-fixtures.cjs");
const History=fromRoot("js/sharedHistoryConvergence.js");
const Multi=fromRoot("js/sharedMultiSeasonProgression.js").createProtocol();
const Final=fromRoot("js/sharedFinalReconciliation.js");
const Terminal=fromRoot("js/sharedTerminalClose.js");
const Career=fromRoot("js/sharedCareerAnalytics.js");
const Adapter=fromRoot("js/sharedActiveShowdownAdapter.js");
const Visual=fromRoot("js/seasonFinalV10.js");
const clone=x=>JSON.parse(JSON.stringify(x));
const result=(o={})=>F.result(o);
const zero=()=>[result({leaguePosition:4,leaguePoints:60}),result({leaguePosition:5,leaguePoints:55})];
const tiedSeasons=[
  [result({domesticCup:true,leaguePosition:4}),result({leaguePosition:5})],
  [result({domesticCup:true,leaguePosition:4}),result({leaguePosition:5})],
  [result({domesticCup:true,leaguePosition:4}),result({leaguePosition:1,leaguePoints:90})]
];
function projection(total,seasons,seed="1"){
  // Use the real history builder with recognised clubs, not fabricated totals.
  const base=F.projection({totalSeasons:total,seasons,seed});
  const setup={phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",totalSeasons:total,leagueId:"premier_league",clubs:{playerOne:"Arsenal",playerTwo:"Liverpool"}};
  return History.buildProjection({rivalryId:base.rivalryId,setup,managerSlots:base.managerSlots.map(s=>({...s,entitlementState:"active"})),seasons:base.seasonHistory.map(s=>({
    commit:{ok:true,committed:true,phase:"ACKNOWLEDGED",revision:3,resultsRevision:2,resultsContentHash:s.acceptedResultContentHash,seasonNumber:s.roundNumber,results:{playerOne:Object.fromEntries(["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"].map(k=>[k,s.playerOne[k]])),playerTwo:Object.fromEntries(["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"].map(k=>[k,s.playerTwo[k]]))}},
    scoring:{ok:true,authoritative:true,phase:"SCORING_RECONCILED",revision:1,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:s.acceptedResultContentHash,seasonNumber:s.roundNumber,scoring:{playerOne:s.playerOne.scoring,playerTwo:s.playerTwo.scoring},winner:s.winner}
  }))});
}
function authority(p){
  const setup={phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",totalSeasons:p.totalSeasons,leagueId:p.leagueId,clubs:{playerOne:p.managerRecords.playerOne.club,playerTwo:p.managerRecords.playerTwo.club}};
  const m=Multi.derive({rivalryId:p.rivalryId,setup,history:p});
  const h=F.history(p),multi={ok:true,authoritative:true,phase:m.phase,rivalryId:p.rivalryId,state:m};
  const local=role=>{const s=p.managerSlots.find(s=>s.slotId===role);return {phase:"REMOTE_OBSERVED",canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,binding:{saveId:s.saveId,profileId:s.profileId,managerRole:role}};};
  const final=role=>Final.reconcile({sharedActive:true,multiSeason:multi,history:h,localReconciliation:local(role)});
  const f=final("playerOne");assert.deepEqual(f,final("playerTwo"));
  const c=f.finalSeasonReconciled?{phase:"CLOSED",rivalryId:p.rivalryId,terminal:true,terminalWitness:Terminal.prepare(f,{sessionId:F.SESSION})}:null;
  return {p,h,multi,f,c,identity:F.identity(),pair:F.pair(p.rivalryId)};
}
function nodeCoverage(){
  const env={window:{},console,Intl};vm.createContext(env);
  for(const file of ["js/scoring.js","js/showdown.js","js/legacy.js"]){
    if(file==="js/legacy.js")env.document={};
    vm.runInContext(fs.readFileSync(path.join(ROOT,file),"utf8"),env,{filename:file});
  }
  const fixtures=[
    {label:"0-0 final despite a season win",total:1,seasons:[zero()],expected:[0,0,"draw"]},
    {label:"3-3 draw despite Daniel winning two seasons and Nik the last",total:3,seasons:tiedSeasons,expected:[3,3,"draw"]},
    {label:"Daniel wins overall although Nik wins season 10",total:10,seasons:Array.from({length:10},(_,i)=>i===0?[result({championsLeague:true}),result()]:i===9?[result(),result({domesticCup:true})]:zero()),expected:[5,1,"playerOne"]},
    {label:"Nik wins overall although Daniel wins season 10",total:10,seasons:Array.from({length:10},(_,i)=>i===0?[result(),result({championsLeague:true})]:i===9?[result({domesticCup:true}),result()]:zero()),expected:[1,5,"playerTwo"]},
    {label:"Five-season totals",total:5,seasons:Array.from({length:5},(_,i)=>i===0?[result({leaguePosition:1,leaguePoints:101,leagueGoals:101,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true}),result()]:zero()),expected:[11,0,"playerOne"]}
  ];
  for(const x of fixtures){
    const p=projection(x.total,x.seasons),a=authority(p);
    assert.deepEqual([a.f.managerTotals.playerOne,a.f.managerTotals.playerTwo,a.f.winner],x.expected);
    assert.equal(a.f.nextSeason,null);assert.equal(a.f.extraSeasonAllowed,false);
    Terminal.verifyIntent(a.c.terminalWitness);
    const model=Career.buildCareerModel({indexStatus:"ready",showdowns:[{rivalryId:p.rivalryId,classification:"completed",projection:clone(p),final:F.finalFor(p)}]});
    assert.equal(model.history.showdowns[0].winner,x.expected[2]==="playerOne"?"daniel":x.expected[2]==="playerTwo"?"nik":"draw");
    for(const manager of ["daniel","nik"])assert.equal(model.managers[manager].showdowns.draws,x.expected[2]==="draw"?1:0);
    env.fixture={score:{playerOne:900,playerTwo:900},rounds:clone(p.seasonHistory)};
    vm.runInContext("recalculateShowdownScores(fixture)",env);
    assert.deepEqual([env.fixture.score.playerOne,env.fixture.score.playerTwo],x.expected.slice(0,2));
    assert.equal(vm.runInContext("getShowdownWinner(fixture)",env),x.expected[2]);
    assert.equal(vm.runInContext("getArchivedShowdownWinner(fixture)",env),x.expected[2]);
    const resumed=authority(History.verifyProjection(clone(p)));
    assert.deepEqual(resumed.f,a.f);
    const frame=Visual.finalFrame(a.f,a.c,a.h);
    assert.equal(frame.outcomeHeadline,x.expected[2]==="draw"?"DRAW":x.expected[2]==="playerOne"?"Daniel WINS":"Nik WINS");
    assert.equal(frame.margin,Math.abs(x.expected[0]-x.expected[1]));
    console.log("PASS",x.label,JSON.stringify(x.expected));
  }
  const first=authority(projection(3,tiedSeasons.slice(0,1)));
  assert.equal(first.f.phase,"BLOCKED");assert.equal(first.f.winner,undefined);
  assert.equal(first.multi.state.activeSeason,2);assert.equal(first.p.acceptedSeasons,1);
  const halfway=projection(10,Array.from({length:5},zero));
  assert.equal(authority(History.verifyProjection(clone(halfway))).multi.state.activeSeason,6);
  console.log("PASS Season 1 of 3 stays unfinished; a saved halfway history resumes at Season 6 of 10");
}
async function openGame(page){
  await page.goto(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/",{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:20000});
}
async function supplyScreen(page,a,{closed=false,season=null}={}){
  await page.evaluate(async({a,closed,season})=>{
    await ensureGameplayModules();
    const n=season||a.p.totalSeasons;
    currentShowdown={schemaVersion:2,id:1759780800,name:"Daniel vs Nik",managers:{playerOne:"Daniel",playerTwo:"Nik"},status:"Ready",currentRound:n,totalRounds:a.p.totalSeasons,selectedLeague:{id:"premier_league",name:"Premier League"},clubs:{playerOne:"Arsenal",playerTwo:"Liverpool"},score:{playerOne:a.p.managerRecords.playerOne.totalPoints,playerTwo:a.p.managerRecords.playerTwo.totalPoints},rounds:[],transferChallenges:[{seasonNumber:n,status:"completed"}],integrityWarnings:[],sharedJourney:{mode:"shared",rivalryId:a.p.rivalryId}};
    const api=value=>({getState:()=>value,refresh:async()=>value,install:()=>true});
    window.CareerModeOnlinePlayerIdentity=api(a.identity);
    window.CareerModePersistentNikDanielPair={...api(a.pair),subscribe:()=>()=>{}};
    window.CareerModeProductionSharedMultiSeasonProgression={...api(a.multi),getCurrentSeason:()=>n,isActive:()=>true};
    window.CareerModeProductionSharedHistoryConvergence=api(a.h);
    window.CareerModeProductionSharedFinalReconciliation=api(closed?null:a.f);
    window.CareerModeProductionSharedTerminalClose=api(closed?a.c:null);
    window.CareerModeProductionSharedSeasonResults={...api(null),canRoute:()=>true,isActive:()=>false};
    await loadRuntimeScript("v10-screens","js/v10Screens.js",()=>window.CareerModeV10Screens);
    window.CareerModeV10Screens.install();
    await loadRuntimeScript("v10-season-final","js/seasonFinalV10.js",()=>window.CareerModeSeasonFinalV10);
    await window.CareerModeSeasonFinalV10.install();
    if(!await navigateTo("seasonEntry",{allowCanonicalFallback:false}))throw Error("Season screen did not open");
    window.CareerModeV10Screens.invalidate("seasonEntry");
    await window.CareerModeV10Screens.show("seasonEntry");
  },{a,closed,season});
}
async function readFinal(page){return page.evaluate(()=>Object.fromEntries(["outcomeHeadline","danielTotal","nikTotal","panelSeasons","panelMargin","panelDanielCup","panelNikCup","panelDanielTrophies","panelNikTrophies","finalWinnerPartialMessage"].map(id=>[id,document.getElementById(id)?.textContent??null])));}
async function browserCoverage(){
  const {chromium}=fromRoot("node_modules/playwright");
  const browser=await chromium.launch({executablePath:process.env.CMS_CHROMIUM_PATH||"/usr/bin/chromium",headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:"reduce"});
  try{
    await openGame(page);
    const unfinished=authority(projection(3,tiedSeasons.slice(0,1)));
    await supplyScreen(page,unfinished,{season:1});
    assert.equal(await page.locator("#outcomeHeadline").count(),0);
    // Enter the ordinary fields, then reload the game halfway through the plan.
    await page.locator("#p1LeaguePosition").fill("4");
    await page.locator("#p1LeaguePoints").fill("60");
    await page.locator("#p1LeagueGoals").fill("55");
    await page.screenshot({path:"/tmp/codex-1006-1939-season1.png"});
    const saved=clone(unfinished);
    await page.reload({waitUntil:"domcontentloaded"});
    await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:20000});
    await supplyScreen(page,saved,{season:2});
    assert.equal(await page.locator("#outcomeHeadline").count(),0);
    console.log("PASS Chromium Season 1 of 3, normal result fields, reload, Season 2, no premature final winner (saved game snapshots supplied)");
    for(const [total,seasons,expected] of [
      [1,[zero()],"DRAW"],
      [3,tiedSeasons,"DRAW"],
      [10,Array.from({length:10},(_,i)=>i===0?[result({championsLeague:true}),result()]:i===9?[result(),result({domesticCup:true})]:zero()),"Daniel WINS"],
      [10,Array.from({length:10},(_,i)=>i===0?[result(),result({championsLeague:true})]:i===9?[result({domesticCup:true}),result()]:zero()),"Nik WINS"]
    ]){
      const a=authority(projection(total,seasons));
      await supplyScreen(page,a);
      await page.locator("#outcomeHeadline").waitFor({state:"visible"});
      let shown=await readFinal(page);assert.equal(shown.outcomeHeadline,expected);
      assert.equal(shown.danielTotal,String(a.f.managerTotals.playerOne));
      assert.equal(shown.nikTotal,String(a.f.managerTotals.playerTwo));
      assert.equal(shown.panelSeasons,String(total));
      await supplyScreen(page,a,{closed:true});
      shown=await readFinal(page);assert.equal(shown.outcomeHeadline,expected);
      assert.equal(shown.panelMargin,String(Math.abs(a.f.managerTotals.playerOne-a.f.managerTotals.playerTwo)));
      console.log("PASS Chromium final",total,"seasons",expected,shown.danielTotal+"-"+shown.nikTotal,"before and after finishing");
    }
    await page.screenshot({path:"/tmp/codex-1006-1939-final.png"});
  }finally{await browser.close();}
}
module.exports={ROOT,F,History,Final,Terminal,Adapter,Visual,clone,result,zero,tiedSeasons,projection,authority,openGame,supplyScreen,readFinal};
if(require.main===module)(async()=>{nodeCoverage();if(process.argv.includes("--browser"))await browserCoverage();})().catch(e=>{console.error(e.stack);process.exitCode=1;});

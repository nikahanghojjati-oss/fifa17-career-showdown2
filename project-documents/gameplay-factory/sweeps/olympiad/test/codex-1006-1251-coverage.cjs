'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createRequire}=require('node:module');
const root=path.resolve(__dirname,'../../../../..');
const {webcrypto}=require('node:crypto');
const {chromium}=require('playwright');
const {resolveChromiumRuntime}=require(root+'/tests/support/chromium-runtime.cjs');
const Scoring=require(root+'/js/sharedCanonicalScoring.js');
const neutral=more=>({leaguePosition:5,leaguePoints:60,leagueGoals:55,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false,...more});
const perfect=neutral({leaguePosition:1,leaguePoints:100,leagueGoals:100,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true});
const original=path.resolve(root,'tests/browser/shared-canonical-scoring-audit.cjs');
function helpers(scenario){
 let source=fs.readFileSync(original,'utf8');source=source.slice(0,source.lastIndexOf('(async()=>{'));
 source=source.replace(/const resultOne=.*?;\n/,'const resultOne=scenario.first;\n').replace(/const resultTwo=.*?;\n/,'const resultTwo=scenario.second;\n').replace(/const scoreOne=.*?;\n/,'const scoreOne=scenario.scored.scoring.playerOne;\n').replace(/const scoreTwo=.*?;\n/,'const scoreTwo=scenario.scored.scoring.playerTwo;\n');
 source=source.replace('canonicalKeys,resultOne,resultTwo,scoreOne,scoreTwo})=>','canonicalKeys,resultOne,resultTwo,scoreOne,scoreTwo,seasonNumber,totalSeasons,seasonWinner})=>');
 source=source.replace('canonicalKeys,resultOne,resultTwo,scoreOne,scoreTwo});','canonicalKeys,resultOne,resultTwo,scoreOne,scoreTwo,seasonNumber:scenario.seasonNumber,totalSeasons:scenario.totalSeasons,seasonWinner:scenario.scored.winner});');
 source=source.replace(/seasonNumber:1/g,'seasonNumber').replace('currentRound:1,totalRounds:3','currentRound:seasonNumber,totalRounds:totalSeasons').replace('totalSeasons:3','totalSeasons').replace("winner:'playerOne'","winner:seasonWinner");
 return new Function('require','scenario',source+'\nreturn {prepare};')(createRequire(original),scenario);
}
(async()=>{
 const protocol=await Scoring.createProtocol({teamCount:20,cryptoImpl:webcrypto});
 let checks=0;
 for(let mask=0;mask<128;mask++){
  const r=neutral({championsLeague:!!(mask&1),leaguePosition:mask&2?1:5,domesticCup:!!(mask&4),leaguePoints:mask&8?100:99,leagueGoals:mask&16?100:99,topScorer:!!(mask&32),topAssist:!!(mask&64)});
  const total=(r.championsLeague?5:0)+(r.leaguePosition===1?3:0)+(r.domesticCup?1:0)+(r.leaguePoints>=100||r.leagueGoals>=100?1:0)+(r.topScorer||r.topAssist?1:0);
  const actual=protocol.scoreAuthoritativeResults({playerOne:r,playerTwo:neutral({})});assert.equal(actual.scoring.playerOne.total,total);assert.ok(total<=11);checks++;
 }
 console.log('PASS '+checks+' score combinations: both bonuses cap at one point and maximum score is 11');
 const cases=[
  {label:'season 1 of 3: tied maximum score',seasonNumber:1,totalSeasons:3,first:perfect,second:perfect,winner:'draw'},
  {label:'0-0 season: fully tied',seasonNumber:1,totalSeasons:3,first:neutral({}),second:neutral({}),winner:'draw'},
  {label:'0-0 season: league position decides',seasonNumber:1,totalSeasons:3,first:neutral({}),second:neutral({leaguePosition:4}),winner:'playerTwo'},
  {label:'0-0 season: league points decide',seasonNumber:1,totalSeasons:3,first:neutral({leaguePoints:61}),second:neutral({}),winner:'playerOne'},
  {label:'same score, position and points: goals do not break the tie',seasonNumber:1,totalSeasons:3,first:neutral({domesticCup:true,leagueGoals:99}),second:neutral({topScorer:true}),winner:'draw'},
  {label:'season 10 of 10: 0-11',seasonNumber:10,totalSeasons:10,first:neutral({}),second:perfect,winner:'playerTwo'}
 ];
 const browser=await chromium.launch({...(await resolveChromiumRuntime()),headless:true});
 try{
  for(const c of cases){
   c.scored=protocol.scoreAuthoritativeResults({playerOne:c.first,playerTwo:c.second});assert.equal(c.scored.winner,c.winner);
   const context=await browser.newContext({viewport:c.seasonNumber===10?{width:390,height:844}:{width:1440,height:1000},reducedMotion:'reduce'});const page=await context.newPage();
   try{
    await helpers(c).prepare(page,{role:'playerOne',saveId:'area09_'+c.seasonNumber});
    const expected='Daniel: '+c.scored.scoring.playerOne.total+' · Nik: '+c.scored.scoring.playerTwo.total;
    assert.equal(await page.locator('#sharedCanonicalScoringTotals').textContent(),expected);
    const winnerText=c.winner==='draw'?'Season result: Draw':'Season winner: '+(c.winner==='playerOne'?'Daniel':'Nik');
    assert.equal(await page.locator('#sharedCanonicalScoringWinner').textContent(),winnerText);
    assert.match(await page.locator('#seasonEntryTitle').textContent(),new RegExp('SEASON '+c.seasonNumber+' '));
    console.log('PASS Chromium '+c.label+' '+expected+'; '+winnerText);
   }finally{await context.close();}
  }
  // One manager has published, the rival has not: reload and reopen the same season.
  const resultsOriginal=path.resolve(root,'tests/browser/shared-season-results-audit.cjs');
  let resultsSource=fs.readFileSync(resultsOriginal,'utf8');resultsSource=resultsSource.slice(0,resultsSource.lastIndexOf('(async()=>{'));
  resultsSource=resultsSource.replace("managers:{playerOne:'Nik',playerTwo:'Daniel'}","managers:{playerOne:'Daniel',playerTwo:'Nik'}");
  const resultsHelpers=new Function('require',resultsSource+'\nreturn {prepare,exposeServer,enterResults,server};')(createRequire(resultsOriginal));
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const page=await context.newPage();
  try{
   await resultsHelpers.exposeServer(page);await resultsHelpers.prepare(page,{role:'playerOne',saveId:'area09_reload',entry:'verdicts'});await resultsHelpers.enterResults(page,'verdicts');
   for(const [suffix,value] of [['LeaguePosition','5'],['LeaguePoints','60'],['LeagueGoals','55']])await page.locator('#p1'+suffix).fill(value);
   await page.locator('#completeSeason').click();await page.locator('#confirmSeasonCompletion').click();await page.waitForFunction(()=>CareerModeProductionSharedSeasonResults.getState()?.ownResult);
   assert.equal(resultsHelpers.server.revision,1);assert.deepEqual(resultsHelpers.server.results.playerOne,neutral({}));
   await page.reload({waitUntil:'domcontentloaded'});
   await resultsHelpers.prepare(page,{role:'playerOne',saveId:'area09_reload',entry:'dashboard'});await resultsHelpers.enterResults(page,'dashboard');
   assert.equal(await page.locator('#seasonReviewHeading').textContent(),'YOUR RESULT IS PUBLISHED');
   assert.equal(await page.locator('#seasonReviewTwo').isVisible(),false);assert.equal(resultsHelpers.server.publishes.length,1);
   assert.deepEqual(await page.evaluate(()=>CareerModeProductionSharedSeasonResults.getState().ownResult),neutral({}));
   console.log('PASS Chromium reload halfway: the published facts return once, waiting for the rival');
  }finally{await context.close();}
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

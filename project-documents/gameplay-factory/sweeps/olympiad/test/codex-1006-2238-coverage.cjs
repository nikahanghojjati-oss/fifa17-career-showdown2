'use strict';
const h=require('./codex-1006-2238-harness.cjs');
const {assert,chromium,beginPair,guess,signing,lock,refresh,prepare,fixture,createGame,leagues,nationalities}=h;
const rows=[
 {slot:1,name:'Daniel league hit',leagueId:'england-premier-league',nationalityId:'brazil'},
 {slot:2,name:'Daniel nationality hit',leagueId:'italy-serie-a',nationalityId:'england'},
 {slot:3,name:'Daniel keep',leagueId:'spain-primera-division',nationalityId:'spain'}
];
const nikRows=[
 {slot:1,name:'Nik double hit',leagueId:'spain-primera-division',nationalityId:'france'},
 {slot:2,name:'Nik league hit',leagueId:'spain-primera-division',nationalityId:'brazil'},
 {slot:3,name:'Nik keep',leagueId:'italy-serie-a',nationalityId:'italy'}
];
async function browserCase(browser,total,season){
 const {game,pages:[d,n],contexts}=await beginPair(browser,total,season);
 try{
  assert.equal(await d.locator('#p1Signing1Name').isDisabled(),true);
  assert.equal(await d.locator('.transferGuessCard:not(.hidden)').count(),1);
  await guess(d,'p2',1,'league','spain-primera-division');await guess(d,'p2',2,'nationality','france');await guess(d,'p2',3,'league','germany-bundesliga');
  await guess(n,'p1',1,'league','england-premier-league');await guess(n,'p1',2,'nationality','england');await guess(n,'p1',3,'nationality','germany');
  await lock(d,game,'playerOne','guesses');assert.equal(game.state.phase,'GUESS_ENTRY');
  await prepare(d,game,'playerOne',{reload:true});await refresh(d);
  assert.equal(await d.locator('#p2Guess1Value').inputValue(),'Primera División');assert.equal(await d.locator('#p2Guess1Value').isDisabled(),true);
  await lock(n,game,'playerTwo','guesses');await refresh(d);await refresh(n);
  assert.equal(game.state.phase,'SIGNING_ENTRY');
  await d.locator('#p1Signing1Name').fill('Incomplete test');await d.locator('#completeTransferChallenge').click();
  await d.waitForFunction(()=>document.getElementById('transferChallengeError').textContent.includes('Complete signing 1'));
  assert.equal(game.state.signingLockedRoles.length,0,'Incomplete signing cannot become final.');
  await d.locator('#p1Signing1Name').fill('');
  await signing(d,'p1',rows[0]);await d.waitForTimeout(800);
  await refresh(d);assert.equal(await d.locator('#p1Signing1Name').inputValue(),rows[0].name,'Normal refresh retains draft.');
  await d.screenshot({path:`/tmp/codex-1006-2238-s${season}-before-reload.png`,fullPage:true});
  await prepare(d,game,'playerOne',{reload:true});await refresh(d);
  const lost=await d.locator('#p1Signing1Name').inputValue();
  assert.equal(lost,'','Observed defect: unlocked signing entry disappears after reload.');
  console.log(`OBSERVED S${season}/${total}: signing draft after reload = ${JSON.stringify(lost)}; locked guesses retained`);
  for(const row of rows)await signing(d,'p1',row);
  for(const row of nikRows)await signing(n,'p2',row);
  await lock(d,game,'playerOne','signings');assert.equal(game.state.phase,'SIGNING_ENTRY');
  assert.equal(game.view('playerTwo').opponentInputs,null,'No reveal before both signing sides lock.');
  await prepare(d,game,'playerOne',{reload:true});await refresh(d);
  assert.equal(await d.locator('#p1Signing1Name').inputValue(),rows[0].name,'Locked signings survive reload.');assert.equal(await d.locator('#p1Signing1Name').isDisabled(),true);
  await lock(n,game,'playerTwo','signings');await refresh(d);await refresh(n);
  assert.equal(game.state.phase,'COMPLETED');
  for(const role of ['playerOne','playerTwo']){
   const verdict=game.view(role).verdicts;
   assert.deepEqual(verdict.playerOne.map(x=>x.release),[true,true,false]);
   assert.deepEqual(verdict.playerTwo.map(x=>x.release),[true,true,false]);
   assert.equal(verdict.playerTwo[0].matchedBy.length,2,'A signing hit twice is one released signing.');
  }
  const textD=await d.locator('#transferChallengeResults').innerText(),textN=await n.locator('#transferChallengeResults').innerText();assert.equal(textD,textN);
  assert.equal((textD.match(/RELEASE ·/g)||[]).length,4);assert.equal((textD.match(/KEEP ·/g)||[]).length,2);
  assert.equal(await d.locator('#p1Signing1Name').isDisabled(),true);assert.equal(await n.locator('#p2Signing1Name').isDisabled(),true);
  await n.waitForTimeout(1500);
  const visibleWords=await n.locator('.tw-host .vr-word').allTextContents();
  assert.equal(visibleWords.filter(x=>x==='RELEASE').length,4);assert.equal(visibleWords.filter(x=>x==='KEEP').length,2);
  await n.screenshot({path:`/tmp/codex-1006-2238-s${season}-verdict.png`,fullPage:true});
  await prepare(n,game,'playerTwo',{reload:true});await refresh(n);
  assert.equal(await n.locator('#transferChallengeResults').innerText(),textN);
  assert.match(await n.locator('#transferChallengeTitle').innerText(),new RegExp(`SEASON ${season}`));
  console.log(`PASS S${season}/${total}: 3 signings each, league/nationality hits, multiple releases, double hit, KEEP, both reveals, locked reload`);
 }finally{await Promise.all(contexts.map(c=>c.close()))}
}
async function emptyBrowserCase(browser){
 const {game,pages:[d,n],contexts}=await beginPair(browser,1,1);
 try{
  await lock(d,game,'playerOne','guesses');await lock(n,game,'playerTwo','guesses');await refresh(d);await refresh(n);
  await lock(d,game,'playerOne','signings');await lock(n,game,'playerTwo','signings');await refresh(d);await refresh(n);
  await n.waitForTimeout(1000);
  assert.equal(await n.locator('.tw-host .verdict-empty').count(),2);
  for(const page of [d,n]){
   assert.equal(await page.evaluate(()=>calculatePlayerSeasonScore({leaguePosition:8,leaguePoints:0,leagueGoals:0}).total),0);
   assert.equal(await page.evaluate(()=>getShowdownWinner(currentShowdown)),'draw');
   assert.equal(await page.locator('#continueFromTransfers').isEnabled(),true);
  }
  console.log('PASS empty signing reveal, both players may continue, 0-0 season score and tied-total DRAW rule in Chromium');
 }finally{await Promise.all(contexts.map(c=>c.close()))}
}
async function nodeCases(){
 let matrix=0;
 const g=await createGame(10,10);
 for(const kind of ['league','nationality']){
  const list=kind==='league'?leagues:nationalities;
  for(const a of list)for(const b of list){
   const signing={slot:1,name:'Normal signing',leagueId:kind==='league'?a.id:leagues[0].id,nationalityId:kind==='nationality'?a.id:nationalities[0].id};
   const state={phase:'COMPLETED',inputs:{playerOne:{signings:[signing],guesses:[]},playerTwo:{signings:[],guesses:[{slot:1,type:kind,valueId:b.id}]}}};
   assert.equal(g.protocol.evaluateRole('playerOne',state)[0].release,a.id===b.id);matrix++;
  }
 }
 console.log(`PASS ${matrix} league/nationality match and miss pairs`);
 for(const total of [1,3,5,10])for(let season=1;season<=total;season++){
  const game=await createGame(total,season);
  assert.equal((await game.apply('playerOne','startWindow')).ok,true);
  const blocked=await game.apply('playerOne','lockSignings',{signings:[]});assert.equal(blocked.ok,false);
  await game.apply('playerOne','advanceExpiredWindow',{nowEpochMs:game.state.startedAtEpochMs+900000});
  await game.apply('playerOne','lockGuesses',{guesses:[]});await game.apply('playerTwo','lockGuesses',{guesses:[]});
  await game.apply('playerOne','lockSignings',{signings:[]});await game.apply('playerTwo','lockSignings',{signings:[]});
  assert.equal(game.state.phase,'COMPLETED');assert.deepEqual(game.view('playerOne').verdicts,{playerOne:[],playerTwo:[]});
 }
 console.log('PASS no-signing seasons at every season of 1, 3, 5, 10; 15-minute expiry; signing phase order');
 const result=fixture.result({leaguePosition:8,leaguePoints:0,leagueGoals:0});
 const p=fixture.projection({totalSeasons:3,seasons:[[result,result],[result,result],[result,result]]});
 assert.deepEqual(fixture.finalFor(p),{totals:{playerOne:0,playerTwo:0},winner:'draw'});
 assert.equal(p.acceptedSeasons,3);assert.equal(p.seasonHistory.length,3);
 const ctx=require('node:vm').createContext({window:{}});require('node:vm').runInContext(require('node:fs').readFileSync(h.root+'/js/scoring.js','utf8'),ctx);
 assert.equal(require('node:vm').runInContext('calculatePlayerSeasonScore({leaguePosition:8,leaguePoints:0,leagueGoals:0}).total',ctx),0);
 console.log('PASS 0-0 season, three saved seasons, tied career total => draw');
}
(async()=>{
 await nodeCases();
 const browser=await chromium.launch({executablePath:process.env.CMS_CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{await browserCase(browser,3,1);await browserCase(browser,10,10);await emptyBrowserCase(browser)}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

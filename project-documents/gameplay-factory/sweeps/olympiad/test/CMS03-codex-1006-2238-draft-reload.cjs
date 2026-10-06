'use strict';
// Run from the repository root, with node tests/support/static-server.cjs running.
// Uses the real transfer rules and game screens; the already-started game is a fixture.
const h=require('./codex-1006-2238-harness.cjs');
(async()=>{
 const browser=await h.chromium.launch({executablePath:process.env.CMS_CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const {game,pages:[d,n]}=await h.beginPair(browser,3,1);
  await h.lock(d,game,'playerOne','guesses');await h.lock(n,game,'playerTwo','guesses');await h.refresh(d);
  const row={slot:1,name:'Paulo Dybala',leagueId:'italy-serie-a',nationalityId:'argentina'};
  await h.signing(d,'p1',row);await d.waitForTimeout(1000);
  const before=await d.locator('#p1Signing1Name').inputValue();
  await h.refresh(d);h.assert.equal(await d.locator('#p1Signing1Name').inputValue(),before,'Manual refresh keeps the entry.');
  await h.prepare(d,game,'playerOne',{reload:true});await h.refresh(d);
  const after={name:await d.locator('#p1Signing1Name').inputValue(),league:await d.locator('#p1Signing1League').inputValue(),nationality:await d.locator('#p1Signing1Nationality').inputValue()};
  console.log(JSON.stringify({season:'1 of 3',expected:row,actual:after,phase:game.state.phase,guessesStillLocked:game.state.guessLockedRoles},null,2));
  h.assert.equal(after.name,row.name,'Reload halfway through signing entry should restore the unfinished signing.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

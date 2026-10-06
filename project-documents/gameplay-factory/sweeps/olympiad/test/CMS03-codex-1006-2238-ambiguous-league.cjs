'use strict';
// Run from the repository root, with node tests/support/static-server.cjs running.
// Typing an exact league label is normal entry. Shared labels need an explicit country choice.
const h=require('./codex-1006-2238-harness.cjs');
(async()=>{
 const browser=await h.chromium.launch({executablePath:process.env.CMS_CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const {game,pages:[d,n]}=await h.beginPair(browser,3,1);
  await h.guess(n,'p1',1,'league','spain-primera-division');
  await h.lock(d,game,'playerOne','guesses');await h.lock(n,game,'playerTwo','guesses');await h.refresh(d);await h.refresh(n);
  await d.locator('#p1Signing1Name').fill('Spanish league signing');
  await d.locator('#p1Signing1League').fill('Primera División');
  const candidates=await d.locator('#p1Signing1League').locator('..').locator('[role=option]').evaluateAll(nodes=>nodes.map(n=>({id:n.dataset.optionId,text:n.textContent})));
  h.assert.ok(candidates.some(x=>x.id==='argentina-primera-division'));h.assert.ok(candidates.some(x=>x.id==='spain-primera-division'));
  await h.choose(d,'p1Signing1Nationality','brazil','nationality');
  await d.locator('#p1Signing1Name').click();
  const canonicalBeforeLock=await d.locator('#p1Signing1League').getAttribute('data-canonical-id');
  await h.lock(d,game,'playerOne','signings');
  const accepted=game.state.signingLockedRoles.includes('playerOne');
  await h.lock(n,game,'playerTwo','signings');await h.refresh(d);
  console.log(JSON.stringify({typed:'Primera División',countryChoiceMade:false,candidates,canonicalBeforeLock,signingAccepted:accepted,savedLeague:game.state.inputs.playerOne.signings[0].leagueId,rivalGuess:game.state.inputs.playerTwo.guesses[0],verdict:game.view('playerOne').verdicts.playerOne[0],screen:await d.locator('#transferResultsOne').innerText()},null,2));
  h.assert.equal(accepted,false,'A league name shared by Spain and Argentina must require a country choice before it locks.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

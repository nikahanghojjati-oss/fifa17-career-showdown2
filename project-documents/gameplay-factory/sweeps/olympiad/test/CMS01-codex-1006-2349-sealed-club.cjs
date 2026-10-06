'use strict';
// Run the local server first: node tests/support/static-server.cjs
// Expected exit on the checked game: 1. No game file is changed.
const assert=require('node:assert/strict');
const {game,launch,attach,boot,snapshot}=require('./codex-1006-2349-harness.cjs');
(async()=>{
  const g=await game(3,'1');
  // Enter Club Assignment with a real, rule-picked league; no clubs drawn yet.
  assert.equal((await g.mutate('playerOne','open')).ok,true);
  assert.equal((await g.mutate('playerOne','commit-league')).ok,true);
  const browser=await launch();
  try{
    const page=await browser.newPage({viewport:{width:1366,height:900}});
    await attach(page,g,'playerOne');await boot(page,g,'playerOne');
    await page.locator('#clubWheelScreen').waitFor({state:'visible'});
    await page.locator('#openClubPack').click();
    // Freeze no clocks and alter no reveal code. Observe the real first-pack stage.
    await page.waitForFunction(()=>document.getElementById('clubWheelScreen').dataset.clubRevealStage==='manager-one');
    // Let the first-pack entrance settle; Nik's own reveal is still at 1750 ms.
    await page.waitForTimeout(350);
    const halfway=await snapshot(page);
    await page.screenshot({path:'/tmp/codex-1006-2349-sealed-club.png'});
    console.log('HALFWAY '+JSON.stringify({stage:halfway.stage,packNames:halfway.clubs,sealed:halfway.sealed,summaryVisible:halfway.summaryVisible,summaryNames:halfway.summaryClubs,draw:g.read().clubs}));
    // Verify the existing completion handling before retaining this finding.
    await page.waitForFunction(()=>CareerModeProductionSharedShowdownPresentation.getState().clubRevealComplete);
    const complete=await snapshot(page);
    assert.deepEqual(complete.clubs,Object.values(g.read().clubs));
    assert.equal(complete.confirmDisabled,false);
    console.log('AFTER BOTH PACKS '+JSON.stringify({stage:complete.stage,clubs:complete.clubs,confirmEnabled:!complete.confirmDisabled}));
    assert.equal(halfway.sealed[1],true,'Nik must still have a sealed pack at the observed stage.');
    assert.equal(halfway.summaryVisible&&halfway.summaryClubs[1]===g.read().clubs.playerTwo,false,
      "Nik's club must remain unrevealed on the visible screen until his pack opens.");
  }finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});

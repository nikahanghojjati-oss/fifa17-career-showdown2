"use strict";
process.env.CMS_CHROMIUM_MULTI_CONTEXT="1";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../../../../../tests/support/chromium-runtime.cjs");
const {openManager,shot}=require("./codex-1007-0342-full-game.cjs");

// Continue the completed ten-season game in fresh Chromium pages. The game is
// the one played by full-game.cjs; no results or history are supplied as fixtures.
(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  try{
    for(const [user,label,width] of [["daniel","Daniel",393],["nik","Nik",360]]){
      const m=await openManager(browser,user,{width,height:660});
      await m.page.evaluate(()=>ensureOnlinePlayerIdentitySurface());
      await m.page.locator("#newShowdown").click();
      await m.page.getByRole("button",{name:"SIGN IN WITH GOOGLE"}).click({timeout:30000});
      await m.page.waitForFunction(()=>["ready","choose-manager"].includes(window.CareerModeOnlinePlayerIdentity?.getState?.()?.status),null,{timeout:30000});
      if(await m.page.evaluate(()=>CareerModeOnlinePlayerIdentity.getState().status)==="choose-manager"){
        await m.page.getByRole("button",{name:new RegExp(`^${label} · PLAYER`,"i")}).click();
      }
      await m.page.waitForFunction(()=>window.CareerModeOnlinePlayerIdentity?.getState?.()?.status==="ready");
      console.log(`Ready to reopen ${label}'s completed game`);
      await m.page.locator("#legacyButton").click();
      await m.page.locator("#legacy").waitFor({state:"visible",timeout:30000});
      await m.page.waitForFunction(()=>window.CareerModeRivalryLegacyV10?.cachedCareerModel?.()?.history?.showdowns?.some(r=>r.status==="completed"),null,{timeout:60000});
      const model=await m.page.evaluate(()=>CareerModeRivalryLegacyV10.cachedCareerModel());
      const row=model.history.showdowns.find(r=>r.status==="completed");
      assert.equal(row.seasons.length,10);
      assert.equal(row.seasonsPlayed,10);
      assert.equal(row.totalSeasons,10);
      assert.equal(row.winner,"draw");
      assert.deepEqual(row.totals,{daniel:3,nik:3});
      assert.deepEqual(row.seasons.map(r=>r.season),[1,2,3,4,5,6,7,8,9,10]);
      for(const manager of ["daniel","nik"]){
        assert.equal(model.managers[manager].careerPoints,3);
        assert.equal(model.managers[manager].seasons,10);
        assert.equal(model.managers[manager].leagueTitles,1);
        assert.equal(model.managers[manager].totalTrophies,1);
        assert.equal(model.managers[manager].bestSeasonScore,3);
        assert.equal(model.managers[manager].showdowns.completed,1);
        assert.equal(model.managers[manager].showdowns.draws,1);
      }
      assert.equal(model.managers.daniel.seasonWins,9);
      assert.equal(model.managers.nik.seasonWins,1);
      const witnessed=JSON.parse(fs.readFileSync("work/codex-1007-0342/ten-season/season-10.json","utf8"))[0].multi.state.fixedClubs;
      assert.deepEqual(row.clubs,{daniel:witnessed.playerOne,nik:witnessed.playerTwo});
      fs.mkdirSync("work/codex-1007-0342/ten-season",{recursive:true});
      fs.writeFileSync(`work/codex-1007-0342/ten-season/career-${user}.json`,JSON.stringify(model,null,2));
      await m.page.locator('.legacyWinner[data-winner="draw"]').waitFor({state:"visible"});
      assert.match(await m.page.locator('.legacyWinner[data-winner="draw"]').innerText(),/DRAW/i);
      assert.match(await m.page.locator('.legacyCardFooter').innerText(),/10\s*\/\s*10/);
      // Let the normal card entrance finish before capturing what players see.
      await m.page.waitForTimeout(2200);
      await shot(m,"legacy-after-reload");
      await m.page.locator("#viewSeasonHistory").click();
      await m.page.locator("#legacySeasonHistory").waitFor({state:"visible"});
      assert.equal(await m.page.locator(".legacyHistoryRow").count(),10);
      assert.match(await m.page.locator(".legacyHistoryRow").last().innerText(),/Season 10/i);
      await shot(m,"ten-saved-seasons");
      await m.page.locator(".legacyHistoryRow").last().scrollIntoViewIfNeeded();
      await shot(m,"saved-season-10");
      console.log(`PASS ${label}: all 10 seasons, original clubs, 3-3 DRAW, one league title each, records and career totals survive closing and fresh pages`);
      await m.context.close();
    }
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

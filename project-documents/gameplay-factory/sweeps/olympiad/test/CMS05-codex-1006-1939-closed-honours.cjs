"use strict";
const assert=require("node:assert/strict");
const {ROOT,Adapter,Visual,clone,tiedSeasons,projection,authority,openGame,supplyScreen,readFinal}=require("./codex-1006-1939-coverage.cjs");
(async()=>{
  const a=authority(projection(3,tiedSeasons));
  const before=Visual.finalFrame(a.f,null,a.h);
  const saved=clone(a); // Normal game history and finished result after a reload.
  const after=Visual.finalFrame(null,saved.c,saved.h);
  const handledElsewhere=Adapter.finalWinnerView({identity:a.identity,pair:a.pair,history:a.h,terminalClose:a.c});
  assert.equal(before.status,"ready");assert.equal(before.outcomeHeadline,"DRAW");
  assert.equal(handledElsewhere.status,"ready");
  assert.equal(handledElsewhere.trophies.daniel.domesticCups,3);
  assert.equal(handledElsewhere.trophies.nik.leagueTitles,1);
  console.log("Before finishing:",JSON.stringify({status:before.status,winner:before.outcomeHeadline,totals:before.totals,trophies:before.trophies}));
  console.log("After finishing and reading the same saved history:",JSON.stringify({status:after.status,winner:after.outcomeHeadline,totals:after.totals,trophies:after.trophies??null,message:after.message}));
  console.log("Existing final-result helper still finds:",JSON.stringify(handledElsewhere.trophies));
  if(process.argv.includes("--browser")){
    const {chromium}=require(ROOT+"/node_modules/playwright");
    const browser=await chromium.launch({executablePath:process.env.CMS_CHROMIUM_PATH||"/usr/bin/chromium",headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
    const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:"reduce"});
    try{
      await openGame(page);await supplyScreen(page,a);
      await page.locator("#outcomeHeadline").waitFor({state:"visible"});
      console.log("Chromium before:",JSON.stringify(await readFinal(page)));
      await page.evaluate(()=>document.fonts.ready);
      await page.screenshot({path:"/tmp/CMS05-codex-1006-1939-before.png",animations:"disabled"});
      await page.reload({waitUntil:"domcontentloaded"});
      await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:20000});
      await supplyScreen(page,saved,{closed:true});
      await page.locator("#outcomeHeadline").waitFor({state:"visible"});
      await page.evaluate(()=>document.fonts.ready);
      console.log("Chromium after reload:",JSON.stringify(await readFinal(page)));
      await page.screenshot({path:"/tmp/CMS05-codex-1006-1939-after.png",animations:"disabled"});
    }finally{await browser.close();}
  }
  assert.deepEqual(after.trophies,before.trophies,"Finishing/reloading a Showdown must keep its known trophy counts on the final screen");
})().catch(e=>{console.error(e.message);process.exitCode=1;});

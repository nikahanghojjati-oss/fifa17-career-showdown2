// r78 small fixes (JOB-1844), browser proof:
// 1. On Home, before any Showdown is loaded into memory, the top-bar CAREER tab reaches the same destination as the
//    CONTINUE CAREER tile (#continueCareer) and does so through that tile's own click path. It writes nothing to
//    browser storage and does not load or change the Showdown.
// 2. Showdown Home (#dashboard) has no pale DELETE CURRENT SHOWDOWN button (#deleteActiveShowdown).
// Standalone: CMS_BASE_URL=http://127.0.0.1:4511/ node tests/browser/r78-small-fixes-audit.cjs
const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");
const SAVED_SHOWDOWN=JSON.stringify({
  id:"sd_r78_fixture",name:"Daniel vs Nik",managers:{playerOne:"Daniel",playerTwo:"Nik"},totalRounds:3,currentRound:1,status:"Active",
  selectedLeague:null,clubs:{playerOne:null,playerTwo:null},score:{playerOne:0,playerTwo:0},transferChallenges:[],rounds:[]
});

async function openHome(runtime){
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  // Fixture only: one saved Showdown in this throwaway browser profile, seeded once before the app boots.
  await context.addInitScript(saved=>{try{if(!sessionStorage.getItem("r78Seeded")){localStorage.setItem("careerModeShowdown.activeShowdown",saved);sessionStorage.setItem("r78Seeded","1");}}catch(_error){}},SAVED_SHOWDOWN);
  const page=await context.newPage();
  const pageErrors=[];
  page.on("pageerror",error=>pageErrors.push(error.stack||error.message));
  await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:15000});
  await page.waitForFunction(()=>window.SDNav&&document.querySelector('.sd-nav-top [data-nav-key="career"]')&&typeof window.getActiveScreenName==="function",null,{timeout:15000});
  await page.waitForTimeout(1200);
  await page.evaluate(()=>{
    window.__r78TileClicks=0;
    // Window capture runs before the app's document listeners, so it sees every click that reaches the tile.
    window.addEventListener("click",event=>{if(event.target instanceof Element&&event.target.closest("#continueCareer"))window.__r78TileClicks+=1;},true);
  });
  return {browser,page,pageErrors};
}

const snapshot=page=>page.evaluate(()=>({
  screen:window.getActiveScreenName(),
  identityGate:Boolean(document.getElementById("onlinePlayerIdentityOverlay")),
  tileClicks:window.__r78TileClicks,
  showdownLoaded:typeof currentShowdown!=="undefined"&&Boolean(currentShowdown),
  storage:Object.keys(localStorage).sort().map(key=>[key,localStorage.getItem(key)])
}));

(async()=>{
  const runtime=await resolveChromiumRuntime();

  // The tile's own destination from Home.
  const tileRun=await openHome(runtime);
  let tileAfter;
  try{
    const before=await snapshot(tileRun.page);
    assert.equal(before.screen,"mainMenu");
    assert.equal(before.showdownLoaded,false,"Home starts with no Showdown loaded into memory");
    assert.equal(await tileRun.page.locator("#continueCareer").isEnabled(),true,"a saved Showdown enables CONTINUE CAREER");
    await tileRun.page.locator("#continueCareer").click();
    await tileRun.page.waitForTimeout(1500);
    tileAfter=await snapshot(tileRun.page);
    assert.deepEqual(tileRun.pageErrors,[],"tile run has no page errors");
  }finally{await tileRun.browser.close();}

  // The CAREER tab from Home must land in the same place, by way of the tile.
  const tabRun=await openHome(runtime);
  try{
    const before=await snapshot(tabRun.page);
    assert.equal(before.screen,"mainMenu");
    assert.equal(before.showdownLoaded,false);
    await tabRun.page.locator('.sd-nav-top [data-nav-key="career"]').click();
    await tabRun.page.waitForTimeout(1500);
    const after=await snapshot(tabRun.page);
    assert.equal(after.tileClicks,1,"the CAREER tab runs the CONTINUE CAREER tile's own click path once");
    assert.equal(after.screen,tileAfter.screen,"the CAREER tab reaches the tile's screen");
    assert.equal(after.identityGate,tileAfter.identityGate,"the CAREER tab reaches the tile's destination");
    assert.equal(after.identityGate||after.screen!=="mainMenu",true,"the CAREER tab does not leave the player on Home with nothing opened");
    assert.deepEqual(after.storage,before.storage,"the CAREER tab writes nothing to browser storage");
    assert.equal(after.showdownLoaded,false,"the CAREER tab does not load or change the Showdown on its own");

    // Showdown Home: only Settings keeps a DELETE CURRENT SHOWDOWN button. Showdown Home's script (js/showdownUI.js)
    // arrives with the gameplay modules, so load them (script loading only) before looking.
    await tabRun.page.evaluate(()=>window.ensureGameplayModules());
    const dashboardDelete=await tabRun.page.evaluate(()=>({
      dashboard:Boolean(document.getElementById("dashboard")),
      deleteButton:Boolean(document.getElementById("deleteActiveShowdown")),
      dashboardDeleteCopy:[...document.querySelectorAll("#dashboard button")].some(button=>/DELETE CURRENT SHOWDOWN/i.test(button.textContent||"")),
      deleteHandlerKept:typeof deleteCurrentShowdownFromDashboard==="function"
    }));
    assert.equal(dashboardDelete.dashboard,true,"Showdown Home exists");
    assert.equal(dashboardDelete.deleteButton,false,"Showdown Home has no #deleteActiveShowdown");
    assert.equal(dashboardDelete.dashboardDeleteCopy,false,"Showdown Home shows no DELETE CURRENT SHOWDOWN copy");
    assert.equal(dashboardDelete.deleteHandlerKept,true,"deleteCurrentShowdownFromDashboard stays available");
    assert.deepEqual(tabRun.pageErrors,[],"tab run has no page errors");
  }finally{await tabRun.browser.close();}

  console.log("r78 small fixes browser audit passed: CAREER tab follows CONTINUE CAREER; Showdown Home has no DELETE copy.");
})().catch(error=>{console.error(error);process.exitCode=1;});

const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:"en-US"});
  const storedShowdown={
    schemaVersion:2,
    integrityWarnings:[],
    id:1789686612000,
    name:"Daniel vs Nik",
    managers:{playerOne:"Daniel",playerTwo:"Nik"},
    totalRounds:10,
    currentRound:1,
    status:"Created",
    selectedLeague:null,
    clubs:{playerOne:null,playerTwo:null},
    score:{playerOne:0,playerTwo:0},
    transferChallenges:[],
    rounds:[],
    createdAt:"2026-09-17T23:10:12.000Z",
    updatedAt:"2026-09-17T23:10:12.000Z",
    completedAt:null,
    archivedAt:null
  };
  await context.addInitScript(({key,value})=>localStorage.setItem(key,value),{
    key:"careerModeShowdown.activeShowdown",
    value:JSON.stringify(storedShowdown)
  });
  const page=await context.newPage();
  page.on("dialog",dialog=>void dialog.accept());
  const pageErrors=[];
  page.on("pageerror",error=>pageErrors.push(error.stack||error.message));

  try{
    await page.addInitScript(()=>{
      window.requestIdleCallback=callback=>window.setTimeout(()=>callback({didTimeout:false,timeRemaining:()=>50}),4200);
    });
    await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
    await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
    await page.locator("#settingsButton").waitFor({state:"visible",timeout:12000});

    // Reproduce the production race seen on the installed mobile app: Settings opens
    // before the deliberately deferred production Firebase runtime installs its bridge.
    await page.locator("#settingsButton").click();
    await page.locator("#settingsOverlay").waitFor({state:"visible",timeout:12000});
    const recoveryPanel=page.locator("#saveLibraryProductPanel");
    await recoveryPanel.waitFor({state:"attached",timeout:12000});
    const onlinePanel=page.locator("#onlinePlayerIdentitySettingsPanel");
    await onlinePanel.waitFor({state:"visible",timeout:12000});
    const internalPanel=page.locator("#sparkConnectedAccountPanel");
    await internalPanel.waitFor({state:"attached",timeout:12000});
    const dataPanel=page.locator(".settingsDataPanel");
    await dataPanel.waitFor({state:"visible",timeout:12000});

    assert.equal(await recoveryPanel.isHidden(),true,"Save Library recovery must stay internal in ordinary Settings.");
    assert.equal(await recoveryPanel.getAttribute("data-product-surface"),"internal","Save Library recovery must remain classified as an internal product surface.");
    assert.match(await onlinePanel.innerText(),/ACCOUNT/);
    assert.match(await onlinePanel.innerText(),/DANIEL & NIK|WELCOME (?:DANIEL|NIK)/);
    assert.match(await onlinePanel.innerText(),/YOUR PLAYER IDENTITY AND THIS BROWSER/i);
    assert.equal(await internalPanel.isHidden(),true,"The engineering Connected Account panel must stay out of ordinary Settings.");
    assert.match(await internalPanel.innerText(),/CONNECTED ACCOUNT/,"The late Firebase bridge must still mount its retained backend panel.");
    assert.equal(await internalPanel.locator(".settingsConnectedAccountButton").count(),1);
    assert.match(await dataPanel.innerText(),/SHOWDOWN DATA/,"Ordinary Settings must expose Showdown Data management.");
    assert.match(await dataPanel.innerText(),/CURRENT SHOWDOWN/,"Showdown Data must report the current local Showdown state.");
    assert.match(await dataPanel.innerText(),/Daniel vs Nik/,"Showdown Data must expose the current Showdown name.");
    assert.equal(await dataPanel.isHidden(),false,"Showdown Data must remain player-facing even while engineering recovery panels stay internal.");
    const deleteCurrent=dataPanel.locator(".settingsDeleteCurrentShowdown");
    assert.equal(await deleteCurrent.count(),1,"A current Showdown must expose exactly one safe delete action.");
    await deleteCurrent.click();
    await page.waitForFunction(()=>{
      const singleton=localStorage.getItem("careerModeShowdown.activeShowdown");
      const raw=localStorage.getItem("careerModeShowdown.saveLibrary");
      if(singleton!==null||!raw)return false;
      const library=JSON.parse(raw);
      return library.activeSaveId===null&&Array.isArray(library.saves)&&library.saves.length===0;
    },null,{timeout:12000});
    assert.match(await dataPanel.innerText(),/CURRENT SHOWDOWN\s*None/i,"Successful deletion must immediately render no current Showdown.");
    assert.equal((await page.locator("#settingsTitle").textContent()).trim(),"SETTINGS","Late backend mounting must not reclaim the Settings heading.");
    assert.deepEqual(pageErrors,[],"Connected Account Settings regression audit emitted page errors.");
    process.stdout.write(`PASS clean Settings survives late Firebase runtime installation while recovery and engineering account UI stay internal at ${baseUrl.href}\n`);
  }finally{
    await context.close();
    await browser.close();
  }
})().catch(error=>{
  console.error("CONNECTED ACCOUNT SETTINGS AUDIT FAILED");
  console.error(error.stack||error);
  process.exit(1);
});
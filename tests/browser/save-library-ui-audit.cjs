const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const{chromium}=require("playwright");
const{resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");
const runLabel=process.env.CMS_AUDIT_RUN||"save-library-internal-recovery";
const resultsDirectory=path.resolve(process.env.CMS_TEST_RESULTS||"test-results");
const singletonKey="careerModeShowdown.activeShowdown";
const libraryKey="careerModeShowdown.saveLibrary";
fs.mkdirSync(resultsDirectory,{recursive:true});

function showdownFixture(id){
  return {schemaVersion:2,integrityWarnings:[],id,name:"Pre-release Test Rivalry",managers:{playerOne:"Old One",playerTwo:"Old Two"},totalRounds:3,currentRound:1,status:"Created",selectedLeague:null,clubs:{playerOne:null,playerTwo:null},score:{playerOne:0,playerTwo:0},transferChallenges:[],rounds:[],createdAt:"2026-08-14T00:00:00.000Z",updatedAt:"2026-08-14T00:00:00.000Z",completedAt:null,archivedAt:null};
}

function collectErrors(page,{allowCorruptSaveParse=false}={}){
  const errors=[];
  page.on("pageerror",error=>errors.push(`page: ${error.message}`));
  page.on("console",message=>{
    if(message.type()!=="error")return;
    const text=message.text();
    if(/^Failed to load resource/.test(text))return;
    if(allowCorruptSaveParse&&text.startsWith("[Career Mode Showdown] Unable to parse the Save Library active showdown:"))return;
    errors.push(`console: ${text}`);
  });
  return errors;
}

async function openSettingsAndInternalPanel(page,expectedMode){
  await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:15000});
  await page.locator("#settingsButton").click();
  await page.locator("#settingsOverlay").waitFor({state:"visible",timeout:15000});
  const panel=page.locator("#saveLibraryProductPanel");
  await panel.waitFor({state:"attached",timeout:15000});
  await page.waitForFunction(mode=>document.getElementById("saveLibraryProductPanel")?.dataset.libraryMode===mode,expectedMode,{timeout:15000});
  assert.equal(await panel.getAttribute("data-library-mode"),expectedMode);
  assert.equal(await panel.getAttribute("data-product-surface"),"internal","Save Library must be classified as internal recovery architecture.");
  assert.equal(await panel.isHidden(),true,"Save Library must not reappear as a normal player-facing Settings mode.");
  return panel;
}

async function compatibilityIsContained(runtime){
  const browser=await chromium.launch(runtime);
  const context=await browser.newContext({viewport:{width:1100,height:720}});
  const singleton=JSON.stringify(showdownFixture("compatibility-one"));
  await context.addInitScript(({key,value})=>{try{localStorage.setItem(key,value);}catch(_error){}},{key:singletonKey,value:singleton});
  const page=await context.newPage(),errors=collectErrors(page);
  try{
    const panel=await openSettingsAndInternalPanel(page,"compatibility");
    const text=await panel.textContent();
    assert.match(text||"",/READY FOR SAFE SAVE LIBRARY ACTIVATION/i,"Compatibility diagnosis must remain available internally.");
    const after=await page.evaluate(({singletonKey,libraryKey})=>({singleton:localStorage.getItem(singletonKey),library:localStorage.getItem(libraryKey)}),{singletonKey,libraryKey});
    assert.equal(after.singleton,singleton,"Compatibility data must remain byte-identical while the internal panel is diagnosed.");
    assert.equal(after.library,null,"Merely opening Settings must not create Save Library authority from pre-release compatibility data.");
    assert.deepEqual(errors,[],`Compatibility containment emitted errors: ${errors.join(" | ")}`);
    return {mode:"compatibility",hidden:true,storageUnchanged:true};
  }finally{await context.close();await browser.close();}
}

async function corruptStateFailsClosed(runtime){
  const browser=await chromium.launch(runtime);
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:"reduce"});
  const corrupt="{broken-save-library";
  await context.addInitScript(({libraryKey,singletonKey,value})=>{try{localStorage.setItem(libraryKey,value);localStorage.removeItem(singletonKey);}catch(_error){}},{libraryKey,singletonKey,value:corrupt});
  const page=await context.newPage(),errors=collectErrors(page,{allowCorruptSaveParse:true});
  try{
    const panel=await openSettingsAndInternalPanel(page,"blocked");
    const text=await panel.textContent();
    assert.match(text||"",/SAVE LIBRARY UNAVAILABLE/i);
    assert.match(text||"",/NO LOCAL DATA WAS CHANGED/i);
    assert.equal(await panel.locator(".saveLibrarySelectButton,.saveLibraryDeleteButton,.saveLibraryProfileEditButton").count(),0,"Blocked recovery state must expose no mutation controls.");
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),libraryKey),corrupt,"Blocked recovery diagnosis must preserve corrupt bytes exactly.");
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),singletonKey),null,"Blocked recovery diagnosis must not fabricate singleton authority.");
    assert.deepEqual(errors,[],`Blocked recovery containment emitted unexpected errors: ${errors.join(" | ")}`);
    return {mode:"blocked",hidden:true,failClosed:true,expectedParseDiagnostics:true};
  }finally{await context.close();await browser.close();}
}

async function emptyStateStaysInternal(runtime){
  const browser=await chromium.launch(runtime);
  const context=await browser.newContext({viewport:{width:1100,height:720}});
  const page=await context.newPage(),errors=collectErrors(page);
  try{
    const panel=await openSettingsAndInternalPanel(page,"empty");
    assert.match(await panel.textContent()||"",/YOUR SAVE LIBRARY IS EMPTY/i);
    assert.equal(await page.evaluate(({singletonKey,libraryKey})=>localStorage.getItem(singletonKey)===null&&localStorage.getItem(libraryKey)===null,{singletonKey,libraryKey}),true,"Internal empty-state diagnosis must not create storage authority.");
    assert.deepEqual(errors,[],`Empty recovery containment emitted errors: ${errors.join(" | ")}`);
    return {mode:"empty",hidden:true,storageUnchanged:true};
  }finally{await context.close();await browser.close();}
}

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const evidence=[];
  evidence.push(await compatibilityIsContained(runtime));
  evidence.push(await corruptStateFailsClosed(runtime));
  evidence.push(await emptyStateStaysInternal(runtime));
  const resultPath=path.join(resultsDirectory,`save-library-ui-${runLabel}.json`);
  fs.writeFileSync(resultPath,JSON.stringify({runLabel,baseUrl:baseUrl.href,evidence},null,2));
  console.log("Save Library internal recovery audit passed: compatibility, corrupt and empty storage states remain diagnosable and non-mutating while Save Library stays hidden from the normal player-facing Settings surface; expected corrupt-byte parse diagnostics remain visible without being misclassified as unrelated failures.");
})().catch(error=>{console.error(error);process.exitCode=1;});

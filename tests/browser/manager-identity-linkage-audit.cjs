const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const{chromium}=require("playwright");
const{resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");
const runLabel=process.env.CMS_AUDIT_RUN||"manager-identity-linkage";
const resultsDirectory=path.resolve(process.env.CMS_TEST_RESULTS||"test-results");
const libraryKey="careerModeShowdown.saveLibrary";
const singletonKey="careerModeShowdown.activeShowdown";
const legacyKey="careerModeShowdown.legacyShowdowns";
const preferencesKey="careerModeShowdown.preferences";
fs.mkdirSync(resultsDirectory,{recursive:true});

const ids={
  saveA:"save_aaaaaaaaaaaaaaaaaaaaaaaa",
  saveB:"save_bbbbbbbbbbbbbbbbbbbbbbbb",
  saveHistory:"save_cccccccccccccccccccccccc",
  profileA1:"profile_111111111111111111111111",
  profileA2:"profile_222222222222222222222222",
  profileB1:"profile_333333333333333333333333",
  profileB2:"profile_444444444444444444444444"
};

function showdown(id,name,saveId,playerOne,playerTwo,status="Created"){
  return {schemaVersion:2,integrityWarnings:[],id,name,managers:{playerOne:"Same Name",playerTwo:"Same Name"},identity:{schemaVersion:1,saveId,managerProfileIds:{playerOne,playerTwo}},totalRounds:3,currentRound:1,status,selectedLeague:null,clubs:{playerOne:null,playerTwo:null},score:{playerOne:0,playerTwo:0},transferChallenges:[],rounds:[],createdAt:"2026-08-14T00:00:00.000Z",updatedAt:"2026-08-14T00:00:00.000Z",completedAt:status==="Completed"?"2026-08-14T01:00:00.000Z":null,archivedAt:status==="Completed"?"2026-08-14T01:05:00.000Z":null};
}

function seededState(){
  const profiles=[
    {schemaVersion:1,profileId:ids.profileA1,displayName:"Same Name",source:{kind:"browser-fixture",saveId:ids.saveA,role:"playerOne"}},
    {schemaVersion:1,profileId:ids.profileA2,displayName:"Same Name",source:{kind:"browser-fixture",saveId:ids.saveA,role:"playerTwo"}},
    {schemaVersion:1,profileId:ids.profileB1,displayName:"Same Name",source:{kind:"browser-fixture",saveId:ids.saveB,role:"playerOne"}},
    {schemaVersion:1,profileId:ids.profileB2,displayName:"Same Name",source:{kind:"browser-fixture",saveId:ids.saveB,role:"playerTwo"}}
  ];
  const first=showdown("browser-save-a","First Same-Name Rivalry",ids.saveA,ids.profileA1,ids.profileA2);
  const second=showdown("browser-save-b","Second Same-Name Rivalry",ids.saveB,ids.profileB1,ids.profileB2,"Completed");
  const historical=showdown("browser-history","Historical Same-Name Rivalry",ids.saveHistory,null,null,"Completed");
  return {
    library:{schemaVersion:1,activeSaveId:ids.saveA,profiles,saves:[{saveId:ids.saveA,showdown:first},{saveId:ids.saveB,showdown:second}],migration:{source:"browser-fixture",exactLegacyDuplicatesRemoved:0,legacyIdentityMappingRequired:1}},
    legacy:[JSON.parse(JSON.stringify(second)),historical],
    preferences:{schemaVersion:2,reducedMotion:false,menuFeedback:true}
  };
}

function collectErrors(page){
  const errors=[];
  page.on("pageerror",error=>errors.push(`page: ${error.message}`));
  page.on("console",message=>{if(message.type()==="error"&&!/^Failed to load resource/.test(message.text()))errors.push(`console: ${message.text()}`);});
  return errors;
}

async function waitForHome(page){
  await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:15000});
  await page.locator("#settingsButton").waitFor({state:"visible",timeout:15000});
}

async function openLibrary(page){
  await page.locator("#settingsButton").click();
  await page.locator("#settingsOverlay").waitFor({state:"visible",timeout:15000});
  await page.locator("#saveLibraryProductPanel").waitFor({state:"visible",timeout:15000});
  await page.waitForFunction(()=>document.getElementById("saveLibraryProductPanel")?.dataset.libraryMode==="ready",null,{timeout:15000});
}

async function readCanonical(page){
  return page.evaluate(({libraryKey,legacyKey})=>({library:JSON.parse(localStorage.getItem(libraryKey)),legacy:JSON.parse(localStorage.getItem(legacyKey))}),{libraryKey,legacyKey});
}

async function applyLink(page,kind,sourceId,role,profileId){
  const row=page.locator(`.saveLibraryIdentityLinkRow[data-link-kind="${kind}"][data-source-id="${sourceId}"][data-role="${role}"]`);
  await row.waitFor({state:"visible",timeout:10000});
  const select=row.locator("select");
  await select.selectOption(profileId||"");
  page.once("dialog",dialog=>dialog.accept());
  await row.locator(".saveLibraryIdentityApply").click();
  await page.waitForFunction(({kind,sourceId,role,profileId})=>{
    const library=JSON.parse(localStorage.getItem("careerModeShowdown.saveLibrary"));
    const legacy=JSON.parse(localStorage.getItem("careerModeShowdown.legacyShowdowns"));
    if(kind==="save"){
      const save=library.saves.find(entry=>entry.saveId===sourceId);
      return save?.showdown?.identity?.managerProfileIds?.[role]===profileId;
    }
    const record=legacy.find(item=>String(item.id)===String(sourceId));
    return (record?.identity?.managerProfileIds?.[role]??null)===(profileId||null);
  },{kind,sourceId,role,profileId:profileId||null},{timeout:10000});
}

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch(runtime);
  const context=await browser.newContext({viewport:{width:1366,height:768}});
  const seeded=seededState();
  await context.addInitScript(({libraryKey,singletonKey,legacyKey,preferencesKey,seeded})=>{
    try{
      localStorage.setItem(libraryKey,JSON.stringify(seeded.library));
      localStorage.removeItem(singletonKey);
      localStorage.setItem(legacyKey,JSON.stringify(seeded.legacy));
      localStorage.setItem(preferencesKey,JSON.stringify(seeded.preferences));
    }catch(error){}
  },{libraryKey,singletonKey,legacyKey,preferencesKey,seeded});
  const page=await context.newPage();
  const errors=collectErrors(page);
  try{
    await waitForHome(page);
    await openLibrary(page);
    assert.equal(await page.locator(".saveLibraryProfileCard").count(),4,"Four same-name fixture profiles must begin as four visible identities.");
    assert.match(await page.locator("#saveLibraryProductPanel").innerText(),/NO NAMES ARE MATCHED AUTOMATICALLY/i);
    assert.match(await page.locator("#saveLibraryProductPanel").innerText(),/HISTORICAL-ONLY LEGACY ROLES/i);

    await applyLink(page,"save",ids.saveB,"playerOne",ids.profileA1);
    let state=await readCanonical(page);
    let second=state.library.saves.find(entry=>entry.saveId===ids.saveB).showdown;
    let matchingLegacy=state.legacy.find(record=>record.identity&&record.identity.saveId===ids.saveB);
    assert.equal(second.identity.managerProfileIds.playerOne,ids.profileA1,"Explicit UI linkage must reuse one stable profile across Saves.");
    assert.equal(second.identity.managerProfileIds.playerTwo,ids.profileB2,"The second same-name rival must remain distinct.");
    assert.equal(matchingLegacy.identity.managerProfileIds.playerOne,ids.profileA1,"Matching Legacy must inherit by stable Save identity.");
    assert.equal(second.managers.playerOne,"Same Name");
    assert.equal(matchingLegacy.managers.playerOne,"Same Name","Identity linkage must not rewrite historical display labels.");
    assert.equal(state.library.profiles.length,4,"Explicit linkage must retain the original profile rather than merge/delete it.");

    const secondCard=page.locator(`.saveLibraryCard[data-save-id="${ids.saveB}"]`);
    await secondCard.locator(".saveLibrarySelectButton").click();
    await page.waitForFunction(saveId=>JSON.parse(localStorage.getItem("careerModeShowdown.saveLibrary")).activeSaveId===saveId,ids.saveB,{timeout:10000});
    await page.waitForFunction(saveId=>document.querySelector(`.saveLibraryCard[data-save-id="${saveId}"]`)?.classList.contains("isActive")===true,ids.saveB,{timeout:10000});

    await applyLink(page,"legacy","browser-history","playerOne",ids.profileA2);
    state=await readCanonical(page);
    let historical=state.legacy.find(record=>String(record.id)==="browser-history");
    assert.equal(historical.identity.managerProfileIds.playerOne,ids.profileA2,"Historical-only role must accept an explicit Local Profile map.");
    await applyLink(page,"legacy","browser-history","playerOne",null);
    state=await readCanonical(page);
    historical=state.legacy.find(record=>String(record.id)==="browser-history");
    assert.equal(historical.identity.managerProfileIds.playerOne,null,"Historical role must be explicitly returnable to unresolved.");
    await applyLink(page,"legacy","browser-history","playerOne",ids.profileA2);

    const restoreProof=await page.evaluate(async({libraryKey})=>{
      const runtime=window.CareerModeSaveLibraryRuntime;
      const projection=runtime.createBackupProjection();
      const active=JSON.parse(projection.raw.activeShowdown);
      const prepared=JSON.parse(await runtime.prepareRestoreLibraryRaw(active,localStorage.getItem(libraryKey)));
      const restored=prepared.saves.find(entry=>entry.saveId===prepared.activeSaveId)?.showdown;
      return {projected:active.identity.managerProfileIds,restored:restored.identity.managerProfileIds};
    },{libraryKey});
    assert.deepEqual(restoreProof.projected,{playerOne:ids.profileA1,playerTwo:ids.profileB2},"Candidate A must project the explicitly cross-linked active Save identity.");
    assert.deepEqual(restoreProof.restored,restoreProof.projected,"Browser restore preparation must preserve explicit active profile identity refs.");

    const firstCard=page.locator(`.saveLibraryCard[data-save-id="${ids.saveA}"]`);
    page.once("dialog",dialog=>dialog.accept());
    await firstCard.locator(".saveLibraryDeleteButton").click();
    await page.waitForFunction(saveId=>!JSON.parse(localStorage.getItem("careerModeShowdown.saveLibrary")).saves.some(entry=>entry.saveId===saveId),ids.saveA,{timeout:10000});
    state=await readCanonical(page);
    assert.equal(state.library.profiles.length,4,"Deleting the original Save must retain all profile identities after linkage.");
    assert.ok(state.library.profiles.some(profile=>profile.profileId===ids.profileA1));
    second=state.library.saves.find(entry=>entry.saveId===ids.saveB).showdown;
    historical=state.legacy.find(record=>String(record.id)==="browser-history");
    assert.equal(second.identity.managerProfileIds.playerOne,ids.profileA1,"Cross-Save linkage must survive deletion of the profile's original Save.");
    assert.equal(historical.identity.managerProfileIds.playerOne,ids.profileA2,"Historical mapping must survive unrelated Save deletion.");
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),singletonKey),null,"Identity operations and deletion must never resurrect singleton authority.");

    const focusedInside=await page.locator("#settingsDialog").evaluate(dialog=>dialog.contains(document.activeElement));
    assert.equal(focusedInside,true,"Identity-link rerenders and deletion must keep focus inside Settings ownership.");
    const screenshotPath=path.join(resultsDirectory,`manager-identity-linkage-${runLabel}.png`);
    await page.screenshot({path:screenshotPath,fullPage:true});
    const result={runLabel,baseUrl:baseUrl.href,linkedProfile:ids.profileA1,remainingDistinctProfile:ids.profileB2,historicalProfile:ids.profileA2,profilesRetained:state.library.profiles.length,screenshot:screenshotPath};
    fs.writeFileSync(path.join(resultsDirectory,`manager-identity-linkage-${runLabel}.json`),JSON.stringify(result,null,2));
    assert.deepEqual(errors,[],`Manager identity linkage emitted page/console errors: ${errors.join(" | ")}`);
    console.log("Manager identity browser audit passed: explicit same-person cross-Save linkage, same-name separation, stable Legacy propagation, unresolved historical mapping, restore preparation and deletion retention are protected.");
  }finally{
    await context.close();
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});

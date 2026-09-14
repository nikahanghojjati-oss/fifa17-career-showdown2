const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const{chromium}=require("playwright");
const{resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");
const axePath=require.resolve("axe-core/axe.min.js");
const runLabel=process.env.CMS_AUDIT_RUN||"run-1";
const resultsDirectory=path.resolve(process.env.CMS_TEST_RESULTS||"test-results");
const appSource=fs.readFileSync(path.resolve(__dirname,"../../js/app.js"),"utf8");
const expectedAppVersion=(appSource.match(/const APP_VERSION = "([^"]+)"/)||[])[1];
const activeStorageKey="careerModeShowdown.activeShowdown";
const saveLibraryStorageKey="careerModeShowdown.saveLibrary";
const legacyStorageKey="careerModeShowdown.legacyShowdowns";
const preferencesStorageKey="careerModeShowdown.preferences";
const pendingKey="careerModeShowdown.sharedJourneyPending.v1";
assert.ok(expectedAppVersion,"Stability audit must resolve the current application version.");
fs.mkdirSync(resultsDirectory,{recursive:true});

const report={run:runLabel,baseUrl:baseUrl.href,browserVersion:"",checkpoints:[],axeScans:[],layouts:[],requestFailures:[]};
const checkpoint=(name,detail="")=>{report.checkpoints.push({name,detail});process.stdout.write(`PASS  ${name}${detail?` :: ${detail}`:""}\n`);};
const normalizeText=value=>String(value||"").replace(/\s+/g," ").trim();
const isFirstParty=url=>String(url||"").startsWith(baseUrl.href);
const productionOrigin="https://nikahanghojjati-oss.github.io",productionPathPrefix="/fifa17-career-showdown2/";

function isExpectedProductionProviderNoise(message){
  if(baseUrl.origin!==productionOrigin||!baseUrl.pathname.startsWith(productionPathPrefix))return false;
  const text=message.text();
  if(text.startsWith("Framing 'https://www.google.com/' violates the following report-only Content Security Policy directive: \"frame-ancestors 'self'\"."))return true;
  if(text==="requestStorageAccess: Permission denied."){const sourceUrl=message.location()?.url||"";return !sourceUrl||!sourceUrl.startsWith(baseUrl.origin);}
  return false;
}
function createPageMonitors(page,expectedConsoleErrors=[]){
  const pageErrors=[],severeConsole=[],localFailures=[];
  page.on("pageerror",error=>pageErrors.push(error.stack||error.message));
  page.on("console",message=>{if(message.type()!=="error"||/^Failed to load resource/.test(message.text()))return;if(expectedConsoleErrors.some(pattern=>pattern.test(message.text()))||isExpectedProductionProviderNoise(message))return;severeConsole.push(message.text());});
  page.on("requestfailed",request=>{const entry=`${request.method()} ${request.url()} :: ${request.failure()?.errorText||"failed"}`;report.requestFailures.push(entry);if(isFirstParty(request.url()))localFailures.push(entry);});
  page.on("response",response=>{if(isFirstParty(response.url())&&response.status()>=400)localFailures.push(`${response.status()} ${response.url()}`);});
  return{assertClean(label){assert.deepEqual(pageErrors,[],`${label} emitted page errors.`);assert.deepEqual(severeConsole,[],`${label} emitted unexpected console errors.`);assert.deepEqual(localFailures,[],`${label} had failed local assets or requests.`);}};
}
async function installAuditRuntime(page){
  await page.addInitScript(()=>{window.__cmsRouteEvents=[];document.addEventListener("DOMContentLoaded",()=>{const observer=new MutationObserver(records=>records.forEach(record=>{if(record.type==="attributes"&&record.attributeName==="data-route-state"&&record.target instanceof Element&&record.target.getAttribute("data-route-state")==="entering")window.__cmsRouteEvents.push({id:record.target.id,direction:record.target.getAttribute("data-route-direction")});}));observer.observe(document.body,{subtree:true,attributes:true});},{once:true});});
  await page.addInitScript({path:axePath});
}
async function waitForApplication(page){
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
  await page.locator("#newShowdown").waitFor({state:"visible",timeout:12000});
  assert.equal(await page.locator("#app").getAttribute("aria-hidden"),null);
  assert.equal(await page.locator("#app").evaluate(element=>element.inert),false);
}
async function openApplication(page){await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});await waitForApplication(page);}
async function installAuthorizedOnlineIdentityFixture(page){
  await page.waitForFunction(()=>typeof window.loadRuntimeScript==="function",null,{timeout:12000});
  await page.evaluate(async()=>{
    if(!window.CareerModeOnlinePlayerIdentity?.initialize)await window.loadRuntimeScript("stability-online-player-identity","js/onlinePlayerIdentity.js",()=>window.CareerModeOnlinePlayerIdentity);
    window.CareerModeOnlinePlayerIdentity={getState:()=>({status:"ready",initialized:true,busy:false,online:true,accountId:"account_stability_fixture",managerId:"nik",managerLabel:"Nik",deviceId:"device_stability_fixture",registered:true})};
    document.getElementById("onlinePlayerIdentityOverlay")?.remove();
  });
}
async function assertStableProductSurface(page,label){
  await page.waitForTimeout(200);
  const footer=normalizeText(await page.locator("#app > footer").innerText());
  assert.equal(footer,`Career Mode Showdown v${expectedAppVersion}`,`${label} clean product footer changed.`);
  const tile=await page.locator("#settingsButton").evaluate(button=>({code:button.querySelector(".menuTileCode")?.textContent?.trim()||"",label:button.querySelector(".menuTileLabel")?.textContent?.trim()||"",meta:button.querySelector(".menuTileMeta")?.textContent?.trim()||""}));
  assert.deepEqual(tile,{code:"SETTINGS",label:"SETTINGS",meta:"Account, device and preferences"},`${label} Settings tile regressed to architecture language.`);
  const homeText=await page.locator("#mainMenu").innerText();
  assert.doesNotMatch(homeText,/online-only|local-only|Shared Showdown|Private Remote Joining|Save Library/i);
  checkpoint(`${label} clean product identity`,`v${expectedAppVersion} · Settings`);
}
async function activeScreens(page){return page.locator(".screen:not(.hidden)").evaluateAll(elements=>elements.map(element=>element.id));}
async function waitForScreen(page,screenId,options={}){
  await page.locator(`#${screenId}`).waitFor({state:"visible",timeout:options.timeout||12000});
  await page.waitForTimeout(options.settle===false?20:290);
  assert.deepEqual(await activeScreens(page),[screenId],`Expected only ${screenId} to be active.`);
  const a11y=await page.locator(`#${screenId}`).evaluate(element=>({ariaHidden:element.getAttribute("aria-hidden"),labelledBy:element.getAttribute("aria-labelledby"),headingId:element.querySelector("h2")?.id||""}));
  assert.equal(a11y.ariaHidden,"false");assert.ok(a11y.labelledBy);assert.equal(a11y.labelledBy,a11y.headingId);
}
async function assertLayout(page,label){
  await page.waitForTimeout(40);
  const layout=await page.evaluate(()=>({viewportWidth:innerWidth,viewportHeight:innerHeight,documentWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}));
  report.layouts.push({label,...layout});assert.ok(layout.documentWidth<=layout.clientWidth+1,`${label} has horizontal document overflow.`);checkpoint(`${label} responsive containment`,`${layout.viewportWidth} × ${layout.viewportHeight}`);
}
async function runAxe(page,label){
  const violations=await page.evaluate(async()=>{const result=await window.axe.run(document,{resultTypes:["violations"],rules:{region:{enabled:false}}});return result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(node=>node.target)}));});
  report.axeScans.push({label,violations});assert.deepEqual(violations,[],`${label} has automated accessibility violations.`);checkpoint(`${label} accessibility scan`);
}
async function assertNoDuplicateIds(page,label){const duplicates=await page.evaluate(()=>{const counts=new Map();document.querySelectorAll("[id]").forEach(element=>counts.set(element.id,(counts.get(element.id)||0)+1));return [...counts.entries()].filter(([,count])=>count>1);});assert.deepEqual(duplicates,[],`${label} has duplicate IDs.`);}
async function readActiveSave(page){
  const state=await page.evaluate(({singletonKey,libraryKey})=>{const singletonRaw=localStorage.getItem(singletonKey),libraryRaw=localStorage.getItem(libraryKey);let active=null,activeSaveId=null,saveCount=0;if(libraryRaw){const library=JSON.parse(libraryRaw);saveCount=Array.isArray(library.saves)?library.saves.length:0;activeSaveId=library.activeSaveId||null;if(activeSaveId){const match=library.saves.find(entry=>entry&&entry.saveId===activeSaveId);active=match?.showdown||null;}}return{singletonRaw,libraryRaw,active,activeSaveId,saveCount};},{singletonKey:activeStorageKey,libraryKey:saveLibraryStorageKey});
  assert.equal(state.singletonRaw,null,"The retired singleton key must remain absent.");assert.ok(state.libraryRaw);assert.ok(state.activeSaveId);assert.ok(state.active);return state.active;
}

async function releasePairedFirstGateForGameplayStability(page,prefix){
  await page.waitForFunction(()=>window.CareerModeProductionSharedJourneyEntry?.isPending?.()===true,null,{timeout:12000});
  const proof=await page.evaluate(({pendingKey})=>{
    if(typeof currentShowdown==="undefined"||!currentShowdown)throw new Error("Prepared Showdown unavailable.");
    if(!window.CareerModeSaveLibraryRuntime?.isReady?.())throw new Error("Save Library authority unavailable.");
    currentShowdown.sharedJourney={contractVersion:1,mode:"shared",setupPending:false};
    if(window.CareerModeSaveLibraryRuntime.saveCurrentShowdown()!==true)throw new Error("Could not persist test-only paired-first completion.");
    sessionStorage.removeItem(pendingKey);
    document.getElementById("productionSharedJourneyEntryOverlay")?.classList.add("hidden");
    for(const id of ["spinLeague","openClubPack"]){const button=document.getElementById(id);if(button){button.disabled=false;button.removeAttribute("aria-disabled");delete button.dataset.sharedJourneyLocked;button.removeAttribute("title");}}
    document.getElementById("continueSharedSetupGate")?.remove();document.getElementById("sharedJourneyLeagueLockNote")?.remove();
    return{pending:window.CareerModeProductionSharedJourneyEntry.isPending(),name:currentShowdown.name,managers:currentShowdown.managers,marker:currentShowdown.sharedJourney};
  },{pendingKey});
  assert.equal(proof.pending,false,"Gameplay stability may proceed only after explicitly satisfying the paired-first precondition in the test harness.");
  assert.equal(proof.name,"Daniel vs Nik");assert.deepEqual(proof.managers,{playerOne:"Daniel",playerTwo:"Nik"});assert.equal(proof.marker.setupPending,false);
  checkpoint(`${prefix} paired-first precondition isolated`,`Daniel/P1 · Nik/P2`);
}
async function resumeSavedUnderStability(page,expectedScreen,prefix){
  await installAuthorizedOnlineIdentityFixture(page);
  const resumed=await page.evaluate(async()=>{
    await loadRuntimeScript("stability-save-library","js/saveLibraryCutover.js",()=>typeof window.ensureSaveLibraryRuntimeAuthority==="function");
    await window.ensureSaveLibraryRuntimeAuthority();
    if(typeof window.ensureGameplayModules==="function")await window.ensureGameplayModules();
    if(typeof window.resumeSavedShowdown!=="function")throw new Error("Saved Showdown resume helper unavailable.");
    await window.resumeSavedShowdown();return true;
  });
  assert.equal(resumed,true);await waitForScreen(page,expectedScreen);checkpoint(`${prefix} direct stability resume`,expectedScreen);
}
async function createShowdownWithRapidActivation(page,prefix){
  await installAuthorizedOnlineIdentityFixture(page);
  await page.locator("#newShowdown").click();await waitForScreen(page,"createShowdown");await runAxe(page,`${prefix} Create Showdown`);
  assert.deepEqual(await page.evaluate(()=>["showdownName","managerOne","managerTwo"].map(id=>{const input=document.getElementById(id);return{id,value:input.value,hidden:input.hidden,ariaHidden:input.getAttribute("aria-hidden")};})),[
    {id:"showdownName",value:"Daniel vs Nik",hidden:true,ariaHidden:"true"},{id:"managerOne",value:"Daniel",hidden:true,ariaHidden:"true"},{id:"managerTwo",value:"Nik",hidden:true,ariaHidden:"true"}
  ],"Setup must preserve the canonical Daniel/P1 and Nik/P2 mapping without exposing editable manager fields.");
  await page.locator("#roundAmount").selectOption("1");
  await page.evaluate(({singletonKey,libraryKey})=>{window.__cmsOriginalSetItem=Storage.prototype.setItem;window.__cmsSingletonWrites=0;window.__cmsLibraryWrites=0;Storage.prototype.setItem=function(storageKey,value){if(storageKey===singletonKey)window.__cmsSingletonWrites+=1;if(storageKey===libraryKey)window.__cmsLibraryWrites+=1;return window.__cmsOriginalSetItem.call(this,storageKey,value);};const button=document.getElementById("startShowdown");button.click();button.click();},{singletonKey:activeStorageKey,libraryKey:saveLibraryStorageKey});
  await waitForScreen(page,"leagueWheelScreen");
  const writes=await page.evaluate(({singletonKey,libraryKey})=>{const result={singletonWrites:window.__cmsSingletonWrites,libraryWrites:window.__cmsLibraryWrites,singletonRaw:localStorage.getItem(singletonKey),library:JSON.parse(localStorage.getItem(libraryKey)||"null")};Storage.prototype.setItem=window.__cmsOriginalSetItem;delete window.__cmsOriginalSetItem;delete window.__cmsSingletonWrites;delete window.__cmsLibraryWrites;return result;},{singletonKey:activeStorageKey,libraryKey:saveLibraryStorageKey});
  assert.equal(writes.singletonWrites,0);assert.equal(writes.singletonRaw,null);assert.ok(writes.libraryWrites>=1);assert.ok(writes.library?.activeSaveId);assert.ok(writes.library.saves.length>=1);
  const active=await readActiveSave(page);assert.equal(active.name,"Daniel vs Nik");assert.deepEqual(active.managers,{playerOne:"Daniel",playerTwo:"Nik"});assert.deepEqual(active.sharedJourney,{contractVersion:1,mode:"shared",setupPending:true});
  assert.equal(await page.locator("#spinLeague").isDisabled(),true,"League draw must be locked before both players are connected.");
  checkpoint(`${prefix} canonical rapid Start`,`paired-first lock active · 0 singleton writes`);
  await releasePairedFirstGateForGameplayStability(page,prefix);
}
async function selectAndConfirmLeague(page,prefix){
  await page.locator("#spinLeague").click();await page.locator("#spinLeague").filter({hasText:/CONTINUE TO CLUB ASSIGNMENT/i}).waitFor({state:"visible",timeout:8000});
  const selectedLeague=normalizeText(await page.locator("#selectedLeague").textContent());assert.ok(selectedLeague&&!/spin/i.test(selectedLeague));
  await page.waitForTimeout(700);assert.deepEqual(await activeScreens(page),["leagueWheelScreen"]);assert.equal((await readActiveSave(page)).status,"League Selected");await runAxe(page,`${prefix} League Selected`);await assertLayout(page,`${prefix} League Selected`);
  await page.reload({waitUntil:"domcontentloaded"});await waitForApplication(page);await resumeSavedUnderStability(page,"leagueWheelScreen",prefix);assert.equal(normalizeText(await page.locator("#selectedLeague").textContent()),selectedLeague);assert.match(await page.locator("#spinLeague").innerText(),/CONTINUE TO CLUB ASSIGNMENT/i);
  await page.locator("#spinLeague").click();await waitForScreen(page,"clubWheelScreen");assert.equal((await readActiveSave(page)).status,"League Confirmed");
  await page.locator("#clubAssignmentBack").click();await waitForScreen(page,"leagueWheelScreen");await page.locator("#spinLeague").click();await waitForScreen(page,"clubWheelScreen");checkpoint(`${prefix} league confirmation recovery`,selectedLeague);
}
async function revealPermanentClubs(page,prefix){
  await page.locator("#openClubPack").click();await page.locator("#continueClubAssignment").waitFor({state:"visible",timeout:6000});
  const one=normalizeText(await page.locator("#clubNameOne").innerText()),two=normalizeText(await page.locator("#clubNameTwo").innerText());assert.ok(one&&two&&one!=="?"&&two!=="?");assert.notEqual(one,two);
  const save=await readActiveSave(page);assert.equal(save.status,"Clubs Assigned");assert.deepEqual([save.clubs.playerOne,save.clubs.playerTwo],[one,two]);await runAxe(page,`${prefix} Club Confirmation`);
  await page.locator("#continueClubAssignment").click();await waitForScreen(page,"dashboard");await runAxe(page,`${prefix} Showdown Home`);await assertLayout(page,`${prefix} Showdown Home`);checkpoint(`${prefix} permanent club assignment`,`${one} vs ${two}`);
}
async function verifyDashboardShellAndRecovery(page,prefix){
  const before=await readActiveSave(page);
  assert.equal(before.name,"Daniel vs Nik");assert.deepEqual(before.managers,{playerOne:"Daniel",playerTwo:"Nik"});assert.ok(before.selectedLeague);assert.ok(before.clubs?.playerOne);assert.ok(before.clubs?.playerTwo);assert.equal(Array.isArray(before.rounds)?before.rounds.length:0,0);
  assert.equal(await page.locator("#transferChallenge").isHidden(),true,"General shell stability must not bypass the provider-owned Transfer route.");
  assert.equal(await page.locator("#seasonEntry").isHidden(),true,"General shell stability must not bypass the provider-owned Season route.");
  assert.equal(await page.locator("#seasonPrimaryAction").isVisible(),true,"Dashboard must retain the canonical season entry action while provider-specific execution is validated separately.");
  checkpoint(`${prefix} provider-owned career boundary`,`dashboard stable · transfer/season remain gated`);

  await page.locator("#dashboard [data-smart-back]").click();await waitForScreen(page,"mainMenu");
  await page.reload({waitUntil:"domcontentloaded"});await waitForApplication(page);await resumeSavedUnderStability(page,"dashboard",prefix);
  let recovered=await readActiveSave(page);assert.equal(recovered.name,"Daniel vs Nik");assert.deepEqual(recovered.managers,{playerOne:"Daniel",playerTwo:"Nik"});assert.deepEqual(recovered.selectedLeague,before.selectedLeague);assert.deepEqual(recovered.clubs,before.clubs);assert.equal(Array.isArray(recovered.rounds)?recovered.rounds.length:0,0);

  await page.goto("about:blank");await page.goBack({waitUntil:"domcontentloaded"});await waitForApplication(page);await page.goForward({waitUntil:"load"});assert.equal(page.url(),"about:blank");await page.goBack({waitUntil:"domcontentloaded"});await waitForApplication(page);await resumeSavedUnderStability(page,"dashboard",prefix);
  recovered=await readActiveSave(page);assert.equal(recovered.name,"Daniel vs Nik");assert.deepEqual(recovered.managers,{playerOne:"Daniel",playerTwo:"Nik"});assert.deepEqual(recovered.selectedLeague,before.selectedLeague);assert.deepEqual(recovered.clubs,before.clubs);assert.equal(Array.isArray(recovered.rounds)?recovered.rounds.length:0,0);
  checkpoint(`${prefix} reload and browser-history recovery`,`pre-season dashboard retained without legacy local progression`);
}
async function smokeDestinations(page,prefix){
  await page.locator("#rivalryStatisticsButton").click();await waitForScreen(page,"statistics");await runAxe(page,`${prefix} Rivalry Statistics`);await page.locator("#statistics .backButton").click();await waitForScreen(page,"dashboard");await page.locator("#dashboard [data-smart-back]").click();await waitForScreen(page,"mainMenu");
  await page.locator("#legacyButton").click();await waitForScreen(page,"legacy");await page.locator("#legacy .backButton").click();await waitForScreen(page,"mainMenu");
  await page.locator("#careerStatisticsButton").click();await waitForScreen(page,"careerStatistics");await page.locator("#careerStatistics .backButton").click();await waitForScreen(page,"mainMenu");
  await page.locator("#ruleBookButton").click();await waitForScreen(page,"ruleBook");await runAxe(page,`${prefix} Rule Book`);await page.locator("#ruleBook .backButton").click();await waitForScreen(page,"mainMenu");
  await page.locator("#settingsButton").click();
  await page.locator("#settingsOverlay").waitFor({state:"visible"});
  await page.waitForFunction(()=>{
    const ids=["saveLibraryProductPanel","sparkConnectedAccountPanel","sparkPrivatePairingPanel","sparkConnectedRivalryPanel"];
    const hiddenByProduct=ids.every(id=>{const element=document.getElementById(id);return !element||element.hidden||getComputedStyle(element).display==="none";});
    const extra=[...document.querySelectorAll("#settingsContent .settingsOfflinePanel,#settingsContent .settingsDataPanel")];
    return hiddenByProduct&&extra.every(element=>element.hidden||getComputedStyle(element).display==="none")&&document.getElementById("settingsTitle")?.textContent?.trim()==="SETTINGS";
  },null,{timeout:5000});
  const settingsContainment=await page.evaluate(()=>({
    saveLibrary:document.getElementById("saveLibraryProductPanel")?getComputedStyle(document.getElementById("saveLibraryProductPanel")).display:"absent",
    offline:[...document.querySelectorAll("#settingsContent .settingsOfflinePanel")].every(element=>element.hidden||getComputedStyle(element).display==="none"),
    data:[...document.querySelectorAll("#settingsContent .settingsDataPanel")].every(element=>element.hidden||getComputedStyle(element).display==="none"),
    title:document.getElementById("settingsTitle")?.textContent?.trim()||""
  }));
  assert.notEqual(settingsContainment.saveLibrary,"block",`${prefix} Save Library recovery panel leaked into normal Settings.`);
  assert.equal(settingsContainment.offline,true,`${prefix} offline recovery panel leaked into normal Settings.`);
  assert.equal(settingsContainment.data,true,`${prefix} data-recovery panel leaked into normal Settings.`);
  assert.equal(settingsContainment.title,"SETTINGS",`${prefix} Settings heading was reclaimed by recovery machinery.`);
  await runAxe(page,`${prefix} Settings`);await page.locator("#settingsClose").click();await assertNoDuplicateIds(page,`${prefix} loaded DOM`);checkpoint(`${prefix} optional destinations and clean Settings`);
}
async function runProductScenario(browser,config){
  const context=await browser.newContext({viewport:config.viewport,deviceScaleFactor:config.deviceScaleFactor||1,isMobile:Boolean(config.isMobile),hasTouch:Boolean(config.hasTouch),reducedMotion:config.reducedMotion,locale:"en-US"});
  const page=await context.newPage(),monitors=createPageMonitors(page);await installAuditRuntime(page);
  try{
    await openApplication(page);await installAuthorizedOnlineIdentityFixture(page);await assertStableProductSurface(page,config.prefix);assert.equal(normalizeText(await page.locator("#seasonIndicator").textContent()),"No Active Showdown");assert.equal(await page.locator("#continueCareer").isEnabled(),false);await runAxe(page,`${config.prefix} Empty Home`);await assertLayout(page,`${config.prefix} Empty Home`);
    await createShowdownWithRapidActivation(page,config.prefix);await selectAndConfirmLeague(page,config.prefix);await revealPermanentClubs(page,config.prefix);await verifyDashboardShellAndRecovery(page,config.prefix);
    if(config.fullOptional)await smokeDestinations(page,config.prefix);else{await runAxe(page,`${config.prefix} Dashboard Recovery`);await assertLayout(page,`${config.prefix} Dashboard Recovery`);}
    await assertNoDuplicateIds(page,`${config.prefix} final DOM`);monitors.assertClean(config.prefix);checkpoint(`${config.prefix} clean runtime and local assets`);
  }finally{await context.close();}
}
async function runCorruptStorageFixture(browser){
  const context=await browser.newContext({viewport:{width:1366,height:768},locale:"en-US"});
  await context.addInitScript(({origin,activeKey,legacyKey,preferencesKey})=>{if(location.origin!==origin)return;localStorage.setItem(activeKey,"{corrupt active");localStorage.setItem(legacyKey,"{corrupt legacy");localStorage.setItem(preferencesKey,"[]");},{origin:baseUrl.origin,activeKey:activeStorageKey,legacyKey:legacyStorageKey,preferencesKey:preferencesStorageKey});
  const page=await context.newPage(),monitors=createPageMonitors(page,[/Unable to parse the active showdown/,/Unable to parse Legacy history/,/Unable to parse application preferences/,/Unable to prepare local Save Library authority/,/Save Library activation failed/,/Unable to prepare Showdown/]);await installAuditRuntime(page);
  try{
    await openApplication(page);await installAuthorizedOnlineIdentityFixture(page);assert.equal(await page.locator("#continueCareer").isEnabled(),false);assert.equal(await page.evaluate(key=>localStorage.getItem(key),activeStorageKey),"{corrupt active");
    await page.locator("#newShowdown").click();await waitForScreen(page,"createShowdown");await page.locator("#startShowdown").click();await page.waitForFunction(()=>!document.getElementById("startShowdown").disabled);assert.deepEqual(await activeScreens(page),["createShowdown"]);assert.equal(await page.evaluate(key=>localStorage.getItem(key),activeStorageKey),"{corrupt active","Unreadable legacy singleton bytes must remain byte-for-byte untouched when canonical Start fails closed.");assert.equal(await page.evaluate(key=>localStorage.getItem(key),saveLibraryStorageKey),null,"Corrupt singleton failure must not fabricate Save Library authority.");monitors.assertClean("Corrupt storage fixture");checkpoint("Corrupt singleton bytes fail closed at canonical Start");
  }finally{await context.close();}
}
async function runQuotaFailureFixture(browser){
  const context=await browser.newContext({viewport:{width:1366,height:768},locale:"en-US"});const page=await context.newPage(),monitors=createPageMonitors(page,[/Unable to write local save data/,/Unable to prepare local Save Library authority/,/Save Library/,/Unable to prepare Showdown/]);await installAuditRuntime(page);
  try{
    await openApplication(page);await installAuthorizedOnlineIdentityFixture(page);await page.locator("#newShowdown").click();await waitForScreen(page,"createShowdown");
    await page.evaluate(key=>{window.__cmsQuotaOriginalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(storageKey,value){if(storageKey===key)throw new DOMException("Simulated quota exhaustion","QuotaExceededError");return window.__cmsQuotaOriginalSetItem.call(this,storageKey,value);};},saveLibraryStorageKey);
    await page.locator("#startShowdown").click();await page.waitForFunction(()=>!document.getElementById("startShowdown").disabled);assert.deepEqual(await activeScreens(page),["createShowdown"]);assert.equal(await page.evaluate(key=>localStorage.getItem(key),saveLibraryStorageKey),null,"Failed Save Library write must roll back without accepting authority.");
    await page.evaluate(()=>{Storage.prototype.setItem=window.__cmsQuotaOriginalSetItem;delete window.__cmsQuotaOriginalSetItem;document.getElementById("startShowdown").click();});await waitForScreen(page,"leagueWheelScreen");assert.equal((await readActiveSave(page)).name,"Daniel vs Nik");monitors.assertClean("Quota failure fixture");checkpoint("Save Library quota rejection rolls back before canonical retry");
  }finally{await context.close();}
}

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const tasks=[runCorruptStorageFixture,runQuotaFailureFixture,browser=>runProductScenario(browser,{prefix:"Chromebook",viewport:{width:1366,height:768},reducedMotion:"no-preference",fullOptional:true}),browser=>runProductScenario(browser,{prefix:"Mobile",viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:"reduce",fullOptional:false})];
  for(const task of tasks){const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});if(!report.browserVersion){report.browserVersion=await browser.version();process.stdout.write(`Chromium ${report.browserVersion} · ${runLabel}\n`);}try{await task(browser);}finally{if(browser.isConnected())await browser.close();}}
  const reportPath=path.join(resultsDirectory,`stability-audit-${runLabel}.json`);fs.writeFileSync(reportPath,`${JSON.stringify(report,null,2)}\n`);process.stdout.write(`REPORT ${reportPath}\nCHECKPOINTS ${report.checkpoints.length}\nAXE_SCANS ${report.axeScans.length}\n`);
})().catch(error=>{const reportPath=path.join(resultsDirectory,`stability-audit-${runLabel}-failed.json`);fs.writeFileSync(reportPath,`${JSON.stringify({...report,failure:error.stack||error.message},null,2)}\n`);console.error("STABILITY BROWSER AUDIT FAILED");console.error(error.stack||error);process.exit(1);});
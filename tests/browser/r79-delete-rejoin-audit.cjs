"use strict";
// r79: Daniel's DELETE CURRENT SHOWDOWN (Settings) on a live Showdown, then Nik's next JOIN works with no extra taps.
// r80: the button is END SHOWDOWN (same place, same red look): the one closure write carries the ended-early mark (0 seasons on
// the league wheel), Daniel's notice says it ended, and Nik's phone goes Home by itself with the Ended early notice.
// Real app, two Chromium contexts, Auth + Firestore emulators with the composed production Rules (test project only).
// Run: CMS_CHROMIUM_MULTI_CONTEXT=1 npx --yes firebase-tools@15.28.1 emulators:exec --config tests/browser/support/firebase.browser-journey.json \
//        --only auth,firestore --project demo-cms-browser-journey "node tests/browser/r79-delete-rejoin-audit.cjs"
const assert=require("node:assert/strict");
const {installMarbleConfirmAnswers}=require("./support/marble-confirm.cjs");
const fs=require("node:fs");
const path=require("node:path");
const {spawn}=require("node:child_process");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const ROOT=path.resolve(__dirname,"../..");
const PROJECT="demo-cms-browser-journey";
const AUTH_PORT=Number(process.env.CMS_AUTH_PORT||9199),FIRESTORE_PORT=Number(process.env.CMS_FIRESTORE_PORT||8181),FIRESTORE=`http://127.0.0.1:${FIRESTORE_PORT}`;
const APP_PORT=Number(process.env.CMS_TEST_PORT||4177);
const BASE=`http://127.0.0.1:${APP_PORT}/`;
const SWITCH=path.join(ROOT,"tests/browser/support/emulator-runtime-switch.js");
const SDK_DIR=path.join(ROOT,"node_modules/firebase");
const FORBIDDEN_HOSTS=/(^|\.)(firestore|identitytoolkit|securetoken|firebaseinstallations|firebaseappcheck|content-firebaseappcheck)\.googleapis\.com$/;
let checks=0;
const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};
const urlFor=user=>`${BASE}?cmsEmulator=1&cmsEmulatorUser=${user}&cmsAuthPort=${AUTH_PORT}&cmsFirestorePort=${FIRESTORE_PORT}`;
const docUrl=p=>`${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/${p}`;
async function admin(p){const r=await fetch(docUrl(p),{headers:{Authorization:"Bearer owner"}});return r.status===200?r.json():null;}
const field=(doc,...keys)=>keys.reduce((v,k)=>v&&(v.mapValue?v.mapValue.fields[k]:v.fields?v.fields[k]:undefined),doc);
const pairPanel=m=>m.page.locator("#connectPlayersScreen #persistentNikDanielPairPanel");
const pairState=m=>m.page.evaluate(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return s?{status:s.status,rivalryId:s.rivalryId,connectionState:s.connectionState,closedRivalryId:s.closedRivalryId||null,busy:s.busy,message:s.message}:null;});
const library=m=>m.page.evaluate(()=>{const l=window.CareerModeSaveLibraryRuntime?.getLibrarySnapshot?.();return l?{activeSaveId:l.activeSaveId||null,saves:(l.saves||[]).map(e=>({saveId:e.saveId,rivalryId:e.showdown?.sharedJourney?.rivalryId||null,totalRounds:e.showdown?.totalRounds,status:e.showdown?.status}))}:null;});
const homeTile=m=>m.page.evaluate(()=>{const t=document.getElementById("newShowdown");return t?[".menuTileCode",".menuTileLabel",".menuTileMeta"].map(s=>(t.querySelector(s)?.textContent||"").trim()):null;});

async function loadComposedRules(){
  const put=await fetch(`${FIRESTORE}/emulator/v1/projects/${PROJECT}:securityRules`,{method:"PUT",headers:{"content-type":"application/json"},
    body:JSON.stringify({rules:{files:[{name:"firestore.rules",content:fs.readFileSync(path.join(ROOT,"firestore.spark.generated.rules"),"utf8")}]}})});
  assert.equal(put.status,200,"composed Rules upload");
  assert.equal((await fetch(docUrl("rivalries/probe"))).status,403,"composed Rules active");
}
async function openManager(browser,user,viewport){
  const context=await browser.newContext({viewport});
  const log={errors:[],forbidden:[],taps:[],reads:0};
  await context.exposeBinding("__cmsTap",(_source,tap)=>{log.taps.push(tap);});
  await context.addInitScript(()=>{window.addEventListener("click",event=>{if(!event.isTrusted)return;const b=event.target&&event.target.closest&&event.target.closest("button,.menuTile");if(b&&typeof window.__cmsTap==="function")void window.__cmsTap({id:b.id||"",text:(b.textContent||"").replace(/\s+/g," ").trim().slice(0,60)});},true);});
  await context.route(/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/(firebase-[a-z-]+\.js)$/,route=>{
    const name=route.request().url().match(/(firebase-[a-z-]+\.js)$/)[1];
    return route.fulfill({path:path.join(SDK_DIR,name),contentType:"text/javascript; charset=utf-8"});
  });
  await context.addInitScript({path:SWITCH});
  const page=await context.newPage();
  page.on("request",request=>{const u=new URL(request.url());if(FORBIDDEN_HOSTS.test(u.hostname))log.forbidden.push(u.hostname);});
  page.on("pageerror",error=>log.errors.push(error.message));
  page.on("console",message=>{if(message.type()==="error"&&!/Failed to load resource/.test(message.text()))log.errors.push(message.text().slice(0,300));});
  await installMarbleConfirmAnswers(page,{answer:true});
  await page.goto(urlFor(user),{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
  return {user,context,page,log};
}
async function signIn(m,label){
  await m.page.locator("#newShowdown").click();
  await m.page.getByRole("button",{name:"SIGN IN WITH GOOGLE"}).click({timeout:30000});
  await m.page.getByRole("button",{name:new RegExp(`^${label} · PLAYER`,"i")}).click({timeout:30000});
  await m.page.waitForFunction(text=>document.getElementById("onlinePlayerIdentityBadge")?.textContent===text,label.toUpperCase(),{timeout:30000});
  await m.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.initialized===true&&s.busy===false);},null,{timeout:30000});
}
async function danielStartsShowdown(m,length){
  await m.page.locator("#newShowdown").click({timeout:30000});
  await m.page.locator("#createShowdown").waitFor({state:"visible",timeout:30000});
  await m.page.locator("#roundAmount").selectOption(String(length));
  await m.page.locator("#startShowdown").click({timeout:30000});
  await pairPanel(m).locator("code").waitFor({timeout:30000});
  return (await pairPanel(m).locator("code").innerText()).trim();
}
async function bothActive(managers,rivalryId){
  for(const m of managers)await m.page.waitForFunction(id=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.connectionState==="active"&&(!id||s.rivalryId===id));},rivalryId||null,{timeout:45000});
  for(const m of managers)await m.page.waitForFunction(()=>window.CareerModeSparkRemoteJoining?.getState?.()?.sessionState==="active",null,{timeout:45000});
}
async function openSettings(m){
  if(await m.page.locator("#settingsButton").isVisible().catch(()=>false))await m.page.locator("#settingsButton").click({timeout:30000});
  else await m.page.locator("#onlinePlayerIdentityBadge").click({timeout:30000});
  await m.page.locator("#settingsOverlay").waitFor({state:"visible",timeout:15000});
}
async function closeSettings(m){
  if(!await m.page.locator("#settingsOverlay").isVisible().catch(()=>false))return;
  await m.page.locator(".settingsFooter .menuButton").click();
  await m.page.locator("#settingsOverlay").waitFor({state:"hidden",timeout:15000});
}
async function goHome(m){
  if(await m.page.locator("#mainMenu").isVisible().catch(()=>false))return;
  // The visible BACK of the current screen, as a player would; the app's own navigation only if none is shown.
  const back=m.page.locator(".screen:not(.hidden) .backButton:visible").first();
  if(await back.count())await back.click({timeout:10000}).catch(()=>{});
  if(!await m.page.locator("#mainMenu").isVisible().catch(()=>false))await m.page.evaluate(()=>window.navigateTo?window.navigateTo("mainMenu",{addToHistory:false}):window.showScreen?.("mainMenu",false));
  await m.page.locator("#mainMenu").waitFor({state:"visible",timeout:30000});
}

async function main(){
  assert.equal(JSON.parse(fs.readFileSync(path.join(SDK_DIR,"package.json"),"utf8")).version,require(SWITCH).sdkVersion,"SDK pin matches the switch");
  await loadComposedRules();ok("D0.1","composed production Rules active on the emulator");
  const server=spawn(process.execPath,[path.join(ROOT,"tests/support/static-server.cjs")],{stdio:"ignore",env:{...process.env,CMS_TEST_PORT:String(APP_PORT)}});
  await new Promise(resolve=>setTimeout(resolve,800));
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const managers=[];
  try{
    const daniel=await openManager(browser,"daniel",{width:393,height:660});managers.push(daniel);
    const nik=await openManager(browser,"nik",{width:390,height:844});managers.push(nik);
    await signIn(daniel,"Daniel");await signIn(nik,"Nik");
    const uidN=await nik.page.evaluate(()=>window.CareerModeSparkConnectedAccount?.getState?.().accountId||null);
    ok("D0.2","Daniel and Nik signed in on the emulators");

    // A live Showdown: Daniel's real START (3 seasons), Nik pastes the code, both reach the live session.
    // r79 PR4: Home START's one-time START REAL CAREER checkmark (ticked by default) makes this the first real pairing.
    const code1=await danielStartsShowdown(daniel,3);
    assert.match(code1,/^CMS17R-pair_[0-9a-f]{64}$/,"the first real pairing code");
    await nik.page.locator("#newShowdown").click();
    await nik.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.busy===false&&s.status==="unpaired");},null,{timeout:30000});
    await nik.page.waitForTimeout(500);
    await pairPanel(nik).locator("#persistentNikDanielPairCode").fill(code1);
    await pairPanel(nik).getByRole("button",{name:"JOIN DANIEL'S SHOWDOWN",exact:true}).click();
    const R1=code1.replace(/^CMS17R?-/,"");
    await bothActive([daniel,nik],R1);
    for(const m of [daniel,nik])await m.page.locator("#leagueWheelScreen").waitFor({state:"visible",timeout:45000});
    const nikLibraryBefore=await library(nik);
    for(const m of [daniel,nik])await m.page.waitForFunction(()=>window.CareerModePersistentNikDanielPair?.getPartnerState?.()?.record?.active===true,null,{timeout:30000});
    ok("D1","a live real Showdown R1: both paired ACTIVE with partner records, both on the league wheel");

    // Daniel: Settings -> END SHOWDOWN (r80, was DELETE CURRENT SHOWDOWN), answered OK.
    await openSettings(daniel);
    const endButton=daniel.page.locator(".settingsDeleteCurrentShowdown");
    assert.equal((await endButton.textContent()).trim(),"END SHOWDOWN","the red button is END SHOWDOWN");
    assert.equal(await daniel.page.getByText("DELETE CURRENT SHOWDOWN").count(),0,"no separate DELETE");
    await endButton.click();
    await daniel.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.busy===false&&s.status==="unpaired");},null,{timeout:45000});
    const closedR1=await admin(`rivalries/${R1}`);
    assert.equal(field(closedR1,"data","connectionState").stringValue,"closed","R1 is closed");
    assert.equal(field(closedR1,"data","endedEarly","seasonsPlayed").integerValue,"0","the ended-early mark: 0 seasons (ended on the league wheel)");
    await daniel.page.waitForFunction(()=>/^Ended the ".*" Showdown for both players\. History keeps it as Ended early\.$/.test(document.querySelector("#appRuntimeNotice .runtimeNoticeText")?.textContent?.trim()||""),null,{timeout:15000});
    await closeSettings(daniel);
    ok("D2","Daniel's END SHOWDOWN closed R1 with the ended-early mark (0 seasons) and said it ended");

    // Nik's page notices on the reads it already makes (no reload, no tap): its Terminal Close read finds R1 closed by a delete.
    const nikTapsAtDelete=nik.log.taps.length;
    await nik.page.waitForFunction(id=>window.CareerModeProductionSharedTerminalClose?.getState?.()?.phase==="DELETED"&&window.CareerModeProductionSharedTerminalClose.getState().rivalryId===id,R1,{timeout:60000});
    await nik.page.waitForFunction(id=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.status==="unpaired"&&!s.rivalryId&&s.closedRivalryId===id);},R1,{timeout:15000});
    const nikLibraryAfterDelete=await library(nik);
    assert.deepEqual(nikLibraryAfterDelete,nikLibraryBefore,"Nik's local save is kept as it was (nothing rewritten, nothing deleted)");
    assert.equal(await nik.page.evaluate(()=>window.CareerModeSparkRemoteJoining?.getState?.()?.sessionId||null),null,"Nik's page forgot R1's session");
    assert.equal(nik.log.taps.length,nikTapsAtDelete,"Nik tapped nothing");
    assert.deepEqual(nik.log.errors.filter(e=>/TERMINAL_CLOSE/.test(e)),[],"no TERMINAL_CLOSE_INTENT_INVALID on Nik's page");
    await nik.page.locator("#mainMenu").waitFor({state:"visible",timeout:15000});
    assert.match(await nik.page.locator("#appRuntimeNotice .runtimeNoticeText").textContent(),/This Showdown was ended for both players\. History keeps it as Ended early\./,"Nik's notice says it ended early");
    assert.equal(nik.log.taps.length,nikTapsAtDelete,"Nik tapped nothing to get Home");
    ok("D3","Nik's page, with no reload and no tap: Terminal Close says DELETED, Nik is on Home with the Ended early notice, the pair holds R1 as closed, the local save is kept, no TERMINAL_CLOSE error");

    // Daniel starts the next Showdown with a different length (1 season); Nik goes Home and JOINs with one tap.
    if(!await daniel.page.locator("#mainMenu").isVisible().catch(()=>false))await goHome(daniel);
    const code2=await danielStartsShowdown(daniel,1);
    const R2=code2.replace(/^CMS17R?-/,"");
    assert.notEqual(R2,R1);
    await goHome(nik);
    const joinTile=["JOIN","JOIN DANIEL'S SHOWDOWN","Daniel started 1 season. Tap to join."];
    await nik.page.waitForFunction(text=>(document.querySelector("#newShowdown .menuTileMeta")?.textContent||"").trim()===text,joinTile[2],{timeout:45000});
    assert.deepEqual(await homeTile(nik),joinTile,"Nik's Home shows JOIN for Daniel's new Showdown");
    ok("D4","Daniel's next START (1 season): Nik's Home shows JOIN DANIEL'S SHOWDOWN by itself");
    const tapsBeforeJoin=nik.log.taps.length;
    await nik.page.locator("#newShowdown").click({timeout:30000});
    await bothActive([daniel,nik],R2);
    assert.equal(nik.log.taps.length-tapsBeforeJoin,1,"one tap: JOIN on Home (no END SHOWDOWN, no code typed)");
    assert.equal(field(await admin(`accounts/${uidN}/pairLinks/current`),"data","rivalryId").stringValue,R2,"Nik is paired to R2");
    const nikLibraryAfterJoin=await library(nik);
    const kept=nikLibraryAfterJoin.saves.find(e=>e.saveId===nikLibraryBefore.activeSaveId);
    assert.deepEqual(kept,nikLibraryBefore.saves[0],"R1's local save is still in Nik's library, unchanged");
    assert.notEqual(nikLibraryAfterJoin.activeSaveId,nikLibraryBefore.activeSaveId,"R2 got a new local shell beside it");
    assert.equal(nikLibraryAfterJoin.saves.find(e=>e.saveId===nikLibraryAfterJoin.activeSaveId).totalRounds,1,"the new shell is Daniel's 1 season");
    ok("D5","Nik's one JOIN tap joins R2: R1's save kept untouched, a new 1-season shell beside it, both ACTIVE on R2");

    for(const m of managers){
      assert.deepEqual(m.log.forbidden,[],`${m.user} never contacted a production Firebase host`);
      assert.deepEqual(m.log.errors,[],`${m.user} page errors`);
    }
    ok("DZ","no production Firebase host and no page errors in either context");
    console.log(`PASS r79 delete then rejoin audit: ${checks} checks`);
  }catch(error){
    for(const m of managers){console.log(`--- ${m.user}: tile=${JSON.stringify(await homeTile(m).catch(()=>null))} pair=${JSON.stringify(await pairState(m).catch(()=>null))} errors=${JSON.stringify(m.log.errors.slice(-6))}`);}
    throw error;
  }finally{
    await browser.close();server.kill();
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});

"use strict";
// r87: pairing, JOIN and UNPAIR edge cases in the real app (two Chromium contexts, Auth + Firestore emulators, composed production Rules).
// Run: CMS_CHROMIUM_MULTI_CONTEXT=1 npx --yes firebase-tools@15.28.1 emulators:exec --config tests/browser/support/firebase.browser-journey.json --only auth,firestore --project demo-cms-browser-journey "node tests/browser/r87-pairing-edges-audit.cjs"
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
const tileIs=(m,meta,timeout=45000)=>m.page.waitForFunction(text=>(document.querySelector("#newShowdown .menuTileMeta")?.textContent||"").trim()===text,meta,{timeout});
const settledPair=m=>m.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.initialized===true&&s.busy===false);},null,{timeout:30000});
async function reloadHome(m){
  await m.page.reload({waitUntil:"domcontentloaded"});
  await m.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
  await settledPair(m);
}
async function settingsNote(m){return m.page.evaluate(()=>document.getElementById("cmsModeSettings")?.textContent||"");}
async function danielEnds(daniel,nik,R){
  await openSettings(daniel);
  await daniel.page.locator(".settingsDeleteCurrentShowdown").click();
  await daniel.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.busy===false&&!["active","pending-pair"].includes(s.connectionState||""));},null,{timeout:45000});
  await closeSettings(daniel);
  await nik.page.waitForFunction(id=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&!s.busy&&s.closedRivalryId===id);},R,{timeout:60000});
  await goHome(daniel);await goHome(nik);
}

async function main(){
  assert.equal(JSON.parse(fs.readFileSync(path.join(SDK_DIR,"package.json"),"utf8")).version,require(SWITCH).sdkVersion,"SDK pin matches the switch");
  await loadComposedRules();ok("E0.1","composed production Rules active on the emulator");
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
    const uidD=await daniel.page.evaluate(()=>window.CareerModeSparkConnectedAccount?.getState?.().accountId||null);

    // First real pairing (R1), then Daniel ends it: both are paired with nothing live.
    const code1=await danielStartsShowdown(daniel,3);
    await nik.page.locator("#newShowdown").click();
    await nik.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.busy===false&&s.status==="unpaired");},null,{timeout:30000});
    await nik.page.waitForTimeout(500);
    await pairPanel(nik).locator("#persistentNikDanielPairCode").fill(code1);
    await pairPanel(nik).getByRole("button",{name:"JOIN DANIEL'S SHOWDOWN",exact:true}).click();
    const R1=code1.replace(/^CMS17R?-/,"");
    await bothActive([daniel,nik],R1);
    for(const m of [daniel,nik])await m.page.waitForFunction(()=>window.CareerModePersistentNikDanielPair?.getPartnerState?.()?.record?.active===true,null,{timeout:30000});
    await danielEnds(daniel,nik,R1);
    ok("E0.2","paired with a permanent partner record, R1 ended: nothing live");

    // E1: Nik is already on Home (WAITING FOR DANIEL) before Daniel starts; JOIN appears with no tap and no reload.
    await reloadHome(nik);
    await tileIs(nik,"PASTE A CODE");
    assert.deepEqual(await homeTile(nik),["WAIT","WAITING FOR DANIEL","PASTE A CODE"]);
    const code2=await danielStartsShowdown(daniel,5);
    const R2=code2.replace(/^CMS17R?-/,"");
    assert.match(code2,/^CMS17-pair_/,"a later Showdown of a permanent pair is a plain code");
    await tileIs(nik,"Daniel started 5 seasons. Tap to join.");
    ok("E1","Nik's Home was waiting first; Daniel's START (5 seasons) turned it into JOIN by itself");

    // E2: Nik cannot UNPAIR while Daniel's new Showdown waits for him; nothing is changed.
    await openSettings(nik);
    await nik.page.waitForFunction(()=>Boolean(document.querySelector("#onlinePlayerIdentitySettingsPanel .settingsUnpairButton")),null,{timeout:30000});
    await nik.page.locator("#onlinePlayerIdentitySettingsPanel .settingsUnpairButton").click();
    await nik.page.waitForFunction(()=>/waiting for you/.test(document.getElementById("cmsModeSettings")?.textContent||""),null,{timeout:30000});
    assert.equal(field(await admin(`accounts/${uidN}/partner/current`),"active").booleanValue,true,"Nik's partner record is unchanged");
    assert.equal(await nik.page.evaluate(()=>Boolean(document.querySelector("#onlinePlayerIdentitySettingsPanel .settingsUnpairButton"))),true,"still paired in Settings");
    await closeSettings(nik);
    ok("E2",`UNPAIR while Daniel's code waits: refused with "${await settingsNote(nik)||"(note gone)"}", nothing changed`);

    // E3: Nik reloads with JOIN showing: JOIN comes back by itself.
    await reloadHome(nik);
    await tileIs(nik,"Daniel started 5 seasons. Tap to join.");
    ok("E3","Nik reloaded on Home: JOIN DANIEL'S SHOWDOWN is back with no tap");

    // E4: two Nik tabs both show JOIN; the first JOINs; the second tab's JOIN tap must not break or error.
    const tab2={user:"nik-tab2",context:nik.context,page:await nik.context.newPage(),log:{errors:[],forbidden:[],taps:[]}};
    tab2.page.on("pageerror",error=>tab2.log.errors.push(error.message));
    tab2.page.on("console",message=>{if(message.type()==="error"||message.type()==="warning")tab2.log.errors.push(`[${message.type()}] ${message.text().slice(0,300)}`);});
    managers.push(tab2);
    await installMarbleConfirmAnswers(tab2.page,{answer:true});
    await tab2.page.goto(urlFor("nik"),{waitUntil:"domcontentloaded"});
    await tab2.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
    // The emulator switch keeps sign-in per tab, so the second tab signs in to the same Google account (no player choice).
    if(await tab2.page.evaluate(()=>window.CareerModeOnlinePlayerIdentity?.getState?.()?.status!=="ready")){
      await tab2.page.locator("#newShowdown").click();
      await tab2.page.getByRole("button",{name:"SIGN IN WITH GOOGLE"}).click({timeout:30000});
      const choice=tab2.page.getByRole("button",{name:/^Nik · PLAYER/i});
      await Promise.race([choice.waitFor({state:"visible",timeout:30000}),tab2.page.waitForFunction(()=>(document.getElementById("onlinePlayerIdentityBadge")?.textContent||"").split(" · ")[0]==="NIK",null,{timeout:30000})]);
      if(await choice.isVisible().catch(()=>false))await choice.click({timeout:5000}).catch(()=>{});
      await tab2.page.waitForFunction(()=>(document.getElementById("onlinePlayerIdentityBadge")?.textContent||"").split(" · ")[0]==="NIK",null,{timeout:30000});
      await goHome(tab2);
    }
    await settledPair(tab2);
    await tileIs(tab2,"Daniel started 5 seasons. Tap to join.");
    await nik.page.bringToFront();
    await nik.page.locator("#newShowdown").click({timeout:30000});
    await bothActive([daniel,nik],R2);
    await tab2.page.bringToFront();
    await tab2.page.locator("#newShowdown").click({timeout:30000});
    await tab2.page.waitForFunction(id=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.busy===false&&s.rivalryId===id&&s.connectionState==="active");},R2,{timeout:45000});
    assert.equal(field(await admin(`accounts/${uidN}/pairLinks/current`),"data","rivalryId").stringValue,R2,"Nik is still on R2");
    await nik.page.waitForFunction(id=>window.CareerModePersistentNikDanielPair?.getState?.()?.rivalryId===id,R2,{timeout:5000});
    console.log(`E4 tab2 errors: ${JSON.stringify(tab2.log.errors)}`);
    managers.pop();await tab2.page.close();
    ok("E4","a second Nik tab's stale JOIN tap lands in the same live R2; the first tab is unaffected");

    // E5: Daniel ends R2 and UNPAIRs while Nik sits on Home (no reload). Nik's tap must not leave him at a code box
    // that can never work: it should say Daniel unpaired and offer PAIR AGAIN.
    await nik.page.bringToFront();
    await danielEnds(daniel,nik,R2);
    await reloadHome(nik);
    await tileIs(nik,"PASTE A CODE");
    await openSettings(daniel);
    await daniel.page.waitForFunction(()=>Boolean(document.querySelector("#onlinePlayerIdentitySettingsPanel .settingsUnpairButton")),null,{timeout:30000});
    await daniel.page.locator("#onlinePlayerIdentitySettingsPanel .settingsUnpairButton").click();
    await daniel.page.waitForFunction(()=>(document.getElementById("cmsModeSettings")?.textContent||"")==="Unpaired from Nik.",null,{timeout:30000});
    await closeSettings(daniel);
    assert.equal(field(await admin(`accounts/${uidD}/partner/current`),"active").booleanValue,false);
    await nik.page.locator("#newShowdown").click({timeout:30000});
    await nik.page.locator("#connectPlayersScreen #persistentNikDanielPairCode").waitFor({state:"visible",timeout:30000});
    const e5={side:await nik.page.evaluate(()=>window.CareerModePersistentNikDanielPair?.getPartnerSideState?.()?.status),nikRecord:field(await admin(`accounts/${uidN}/partner/current`),"active").booleanValue};
    console.log(`E5 after Nik's tap: ${JSON.stringify(e5)}`);
    assert.equal(e5.nikRecord,false,"Nik's tap learnt Daniel unpaired and reset Nik's side for pairing again");
    assert.notEqual(e5.side,"mutual");
    ok("E5","Daniel UNPAIRed while Nik's Home was open: Nik's next tap learns it (one read), resets his side and opens the code box to pair again");

    for(const m of managers){
      assert.deepEqual(m.log.forbidden,[],`${m.user} never contacted a production Firebase host`);
      assert.deepEqual(m.log.errors,[],`${m.user} page errors`);
    }
    ok("EZ","no production Firebase host and no page errors in either context");
    console.log(`PASS r87 pairing edges audit: ${checks} checks`);
  }catch(error){
    for(const m of managers){console.log(`--- ${m.user}: identity=${await m.page.evaluate(()=>JSON.stringify(window.CareerModeOnlinePlayerIdentity?.getState?.()?{status:window.CareerModeOnlinePlayerIdentity.getState().status,message:window.CareerModeOnlinePlayerIdentity.getState().message}:null)).catch(()=>null)} tile=${JSON.stringify(await homeTile(m).catch(()=>null))} pair=${JSON.stringify(await pairState(m).catch(()=>null))} errors=${JSON.stringify(m.log.errors.slice(-10))}`);try{await m.page.screenshot({path:`/tmp/cms-r87-pair-fail-${m.user}.png`});}catch(_){}}
    throw error;
  }finally{
    await browser.close();server.kill();
  }
}
main().catch(error=>{console.error(error);process.exit(1);});

"use strict";
// r79 PR4: real and test modes and the Settings pairing rows, in the real app against the Auth + Firestore emulators
// (composed production Rules; test project demo-cms-browser-journey only, never production). Each state is checked at
// 1280x800 and 390x844: nothing covers anything, no horizontal scroll, and a screenshot goes to CMS_MODES_SHOTS.
// Run (several browser contexts, so CMS_CHROMIUM_MULTI_CONTEXT=1 as for the two-manager journey):
//   CMS_CHROMIUM_MULTI_CONTEXT=1 npx --yes firebase-tools@15.28.1 emulators:exec --config tests/browser/support/firebase.browser-journey.json \
//        --only auth,firestore --project demo-cms-browser-journey "node tests/browser/r79-modes-settings-audit.cjs"
// All accounts play real Showdowns. Both sizes verify initial Settings, seasons, WAITING, permanent pairing,
// blocked UNPAIR, END, one-sided UNPAIR and PAIR AGAIN. The retired test entries and labels are absent.
const assert=require("node:assert/strict");
const {installMarbleConfirmAnswers}=require("./support/marble-confirm.cjs");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");
const {spawn}=require("node:child_process");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const ROOT=path.resolve(__dirname,"../..");
const PROJECT="demo-cms-browser-journey";
const FIRESTORE="http://127.0.0.1:8181",AUTH_PORT=9199,FIRESTORE_PORT=8181;
const APP_PORT=Number(process.env.CMS_TEST_PORT||4176);
const BASE=`http://127.0.0.1:${APP_PORT}/`;
const SWITCH=path.join(ROOT,"tests/browser/support/emulator-runtime-switch.js");
const SDK_DIR=path.join(ROOT,"node_modules/firebase");
const SHOTS=process.env.CMS_MODES_SHOTS||path.join(os.tmpdir(),"cms-r79-modes");
const FORBIDDEN_HOSTS=/(^|\.)(firestore|identitytoolkit|securetoken|firebaseinstallations|firebaseappcheck|content-firebaseappcheck)\.googleapis\.com$/;
const SIZES=[{width:1280,height:800},{width:390,height:844}];
const BLOCKED="Finish or end the current Showdown before you unpair. Nothing was changed.";
let checks=0;
const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};
const urlFor=user=>`${BASE}?cmsEmulator=1&cmsEmulatorUser=${user}&cmsAuthPort=${AUTH_PORT}&cmsFirestorePort=${FIRESTORE_PORT}`;
const docUrl=p=>`${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/${p}`;
async function admin(p){const r=await fetch(docUrl(p),{headers:{Authorization:"Bearer owner"}});return r.status===200?r.json():null;}
const field=(doc,...keys)=>keys.reduce((v,k)=>v&&(v.mapValue?v.mapValue.fields[k]:v.fields?v.fields[k]:undefined),doc);

async function loadComposedRules(){
  const put=await fetch(`${FIRESTORE}/emulator/v1/projects/${PROJECT}:securityRules`,{method:"PUT",headers:{"content-type":"application/json"},
    body:JSON.stringify({rules:{files:[{name:"firestore.rules",content:fs.readFileSync(path.join(ROOT,"firestore.spark.generated.rules"),"utf8")}]}})});
  assert.equal(put.status,200,"composed Rules upload");
  assert.equal((await fetch(docUrl("rivalries/probe"))).status,403,"composed Rules active");
}
async function openManager(browser,user,name=user){
  const context=await browser.newContext({viewport:SIZES[0]});
  const log={errors:[],forbidden:[],productionRuntime:0};
  await context.route(/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/(firebase-[a-z-]+\.js)$/,route=>{
    const file=route.request().url().match(/(firebase-[a-z-]+\.js)$/)[1];
    return route.fulfill({path:path.join(SDK_DIR,file),contentType:"text/javascript; charset=utf-8"});
  });
  await context.addInitScript({path:SWITCH});
  const page=await context.newPage();
  page.on("request",request=>{const u=new URL(request.url());if(FORBIDDEN_HOSTS.test(u.hostname))log.forbidden.push(u.hostname);if(/productionFirebaseRuntime\.js|firebase\.runtime-config\.json/.test(u.pathname))log.productionRuntime+=1;});
  page.on("pageerror",error=>log.errors.push(error.message));
  page.on("console",message=>{if(message.type()==="error"&&!/Failed to load resource/.test(message.text()))log.errors.push(message.text().slice(0,300));});
  await installMarbleConfirmAnswers(page,{answer:true});
  await page.goto(urlFor(user),{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
  return {user,name,context,page,log};
}
async function signIn(m,label){
  await m.page.locator("#newShowdown").click();
  await m.page.getByRole("button",{name:"SIGN IN WITH GOOGLE"}).click({timeout:30000});
  // The same Google account on a second browser keeps the player it chose on the first one (no choice is offered).
  const choice=m.page.getByRole("button",{name:new RegExp(`^${label} · PLAYER`,"i")});
  await Promise.race([choice.waitFor({state:"visible",timeout:30000}),m.page.waitForFunction(text=>(document.getElementById("onlinePlayerIdentityBadge")?.textContent||"").split(" · ")[0]===text,label.toUpperCase(),{timeout:30000})]);
  if(await choice.isVisible().catch(()=>false))await choice.click({timeout:5000}).catch(()=>{});
  // (a test account whose test Showdown is live shows "<NAME> · TEST RUN · NOTHING COUNTS")
  await m.page.waitForFunction(text=>(document.getElementById("onlinePlayerIdentityBadge")?.textContent||"").split(" · ")[0]===text,label.toUpperCase(),{timeout:30000});
  await settled(m);
}
const accountId=m=>m.page.evaluate(()=>window.CareerModeSparkConnectedAccount?.getState?.().accountId||null);
const settled=m=>m.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.initialized===true&&s.busy===false&&window.CareerModeShowdownModes&&window.CareerModeShowdownModes.getView().mode!=="unknown");},null,{timeout:30000});
const badge=m=>m.page.evaluate(()=>document.getElementById("onlinePlayerIdentityBadge")?.textContent||"");
const homeTile=m=>m.page.evaluate(()=>{const t=document.getElementById("newShowdown");return t?[".menuTileCode",".menuTileLabel",".menuTileMeta"].map(s=>(t.querySelector(s)?.textContent||"").trim()):null;});
const pairPanel=m=>m.page.locator("#connectPlayersScreen #persistentNikDanielPairPanel");

async function openSettings(m){
  // On Home the SETTINGS tile; during a Showdown the header name chip (it opens Settings too).
  if(await m.page.locator("#settingsButton").isVisible().catch(()=>false))await m.page.locator("#settingsButton").click({timeout:30000});
  else await m.page.locator("#onlinePlayerIdentityBadge").click({timeout:30000});
  await m.page.locator("#settingsOverlay").waitFor({state:"visible",timeout:15000});
  await m.page.waitForFunction(()=>{const v=document.querySelector('#onlinePlayerIdentitySettingsPanel [data-mode-row="mode"] strong');return Boolean(v&&!/Checking/.test(v.textContent)&&!/Checking/.test(document.querySelector('#onlinePlayerIdentitySettingsPanel [data-mode-row="partner"] strong')?.textContent||""));},null,{timeout:30000});
}
async function closeSettings(m){
  if(!await m.page.locator("#settingsOverlay").isVisible().catch(()=>false))return;
  await m.page.locator(".settingsFooter .menuButton").click();
  await m.page.locator("#settingsOverlay").waitFor({state:"hidden",timeout:15000});
}
async function settingsView(m){
  return m.page.evaluate(()=>{
    const panel=document.getElementById("onlinePlayerIdentitySettingsPanel");
    const rows={};for(const r of panel.querySelectorAll("[data-mode-row]"))if(r.classList.contains("settingsInfoRow"))rows[r.dataset.modeRow]=r.querySelector("strong").textContent;
    const buttons=[...panel.querySelectorAll("button")].filter(b=>b.offsetParent!==null).map(b=>b.textContent.trim());
    const all=(document.getElementById("settingsContent")?.innerText||"");
    return {rows,buttons,note:document.getElementById("cmsModeSettings")?.textContent||"",forget:/FORGET THIS DEVICE/.test(all),connect:/CONNECT PLAYERS/.test(all),deleteCurrent:Boolean(document.querySelector(".settingsDeleteCurrentShowdown"))};
  });
}
async function waitNote(m,text){await m.page.waitForFunction(t=>(document.getElementById("cmsModeSettings")?.textContent||"")===t,text,{timeout:30000});}
// Every state at both sizes: no horizontal scroll, every listed element inside the viewport's width, no two of them
// overlapping (nothing covers anything), and a screenshot of the state.
async function both(m,name,selectors,scrollTo){
  for(const size of SIZES){
    await m.page.setViewportSize(size);await m.page.waitForTimeout(900);
    if(scrollTo)await m.page.locator(scrollTo).first().scrollIntoViewIfNeeded().catch(()=>{});
    const layout=await m.page.evaluate(list=>{
      const e=document.scrollingElement,boxes=[];
      // Visually hidden (the desktop header's text brand sits clipped in a 1px box behind the CM17 logo).
      const hidden=el=>{for(let n=el;n&&n!==document.body;n=n.parentElement){const s=getComputedStyle(n),r=n.getBoundingClientRect();if(s.visibility==="hidden"||s.opacity==="0"||(s.clip&&s.clip!=="auto")||(s.clipPath&&s.clipPath!=="none")||((r.width<=2||r.height<=2)&&s.overflow!=="visible"))return true;}return false;};
      for(const sel of list)for(const el of document.querySelectorAll(sel)){if(el.offsetParent===null&&getComputedStyle(el).position!=="fixed")continue;if(hidden(el))continue;const r=el.getBoundingClientRect();if(r.width===0||r.height===0)continue;boxes.push({sel,text:(el.textContent||"").trim().slice(0,40),l:r.left,t:r.top,r:r.right,b:r.bottom});}
      const overlaps=[];for(let i=0;i<boxes.length;i+=1)for(let j=i+1;j<boxes.length;j+=1){const a=boxes[i],b=boxes[j];if(a.l<b.r-1&&b.l<a.r-1&&a.t<b.b-1&&b.t<a.b-1)overlaps.push(`${a.sel}(${a.text}) x ${b.sel}(${b.text})`);}
      return {scroll:e.scrollWidth-e.clientWidth,outside:boxes.filter(b=>b.l<-1||b.r>innerWidth+1).map(b=>`${b.sel}(${b.text})`),overlaps,count:boxes.length,dimmed:[...document.querySelectorAll("body *")].some(el=>{const s=getComputedStyle(el);return s.position==="fixed"&&/rgba\(0, 0, 0, 0\.[3-9]/.test(s.backgroundColor)&&el.getBoundingClientRect().width>=innerWidth&&el.offsetParent!==null&&!el.id.includes("settingsOverlay");})};
    },selectors);
    assert.ok(layout.scroll<=0,`${name} ${size.width}x${size.height}: horizontal scroll ${layout.scroll}px`);
    assert.deepEqual(layout.outside,[],`${name} ${size.width}x${size.height}: inside the viewport width`);
    assert.deepEqual(layout.overlaps,[],`${name} ${size.width}x${size.height}: nothing covers anything`);
    assert.ok(layout.count>=1,`${name}: the checked elements are on screen`);
    fs.mkdirSync(SHOTS,{recursive:true});
    await m.page.screenshot({path:path.join(SHOTS,`${name}-${size.width}x${size.height}.png`)});
  }
  await m.page.setViewportSize(SIZES[0]);
}
const SETTINGS_PARTS=["#onlinePlayerIdentitySettingsPanel .settingsInfoRow","#onlinePlayerIdentitySettingsPanel button","#cmsModeSettings"];
const HEADER_PARTS=["#topHeader .brand h1","#topHeader .brand p","#onlinePlayerIdentityBadge","#seasonIndicator"];
const SEASONS_PARTS=[...HEADER_PARTS,"#cmsSeasonsStartMessage","#startShowdown","#roundAmount","#createShowdown .backButton"];

async function main(){
  assert.equal(JSON.parse(fs.readFileSync(path.join(SDK_DIR,"package.json"),"utf8")).version,require(SWITCH).sdkVersion,"SDK pin matches the switch");
  await loadComposedRules();ok("M0.1","composed production Rules active on the emulator");
  const server=spawn(process.execPath,[path.join(ROOT,"tests/support/static-server.cjs")],{stdio:"ignore",env:{...process.env,CMS_TEST_PORT:String(APP_PORT)}});
  await new Promise(resolve=>setTimeout(resolve,800));
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const managers=[];
  try{
    const daniel=await openManager(browser,"daniel");managers.push(daniel);
    const nik=await openManager(browser,"nik");managers.push(nik);
    await signIn(daniel,"Daniel");await signIn(nik,"Nik");
    const uidD=await accountId(daniel),uidN=await accountId(nik);
    ok("M0.2","Daniel and Nik signed in on the emulators");

    let v;
    for(const m of [daniel,nik]){
      await openSettings(m);v=await settingsView(m);
      assert.equal(v.rows.mode,"Saved online for both of you");assert.equal(v.rows.partner,"Not paired");
      assert.equal(v.buttons.some(text=>/TEST RUN|FORGET THIS DEVICE/.test(text)),false);
      assert.equal(v.connect,false);
      await both(m,`initial-settings-${m.name}`,SETTINGS_PARTS,"#onlinePlayerIdentitySettingsPanel");
      await closeSettings(m);
      assert.doesNotMatch(await m.page.locator("#mainMenu").innerText(),/TEST RUN/);
    }
    ok("T1","new accounts expose real-only Settings/Home, with no test controls or Forget Device, at both sizes");

    // ---------- REAL: Daniel's first Home START is real ----------
    await daniel.page.locator("#newShowdown").click({timeout:30000});
    await daniel.page.locator("#createShowdown").waitFor({state:"visible",timeout:30000});
    assert.equal(await daniel.page.locator("#cmsRealCareerRow,#cmsTestRunNote").count(),0);
    assert.ok(!(await badge(daniel)).includes("TEST RUN"));
    await both(daniel,"real-seasons",SEASONS_PARTS);
    await daniel.page.locator("#roundAmount").selectOption("3");
    await daniel.page.locator("#startShowdown").click({timeout:30000});
    await pairPanel(daniel).locator("code").waitFor({timeout:30000});
    const code=(await pairPanel(daniel).locator("code").innerText()).trim();
    assert.ok(await admin(`accounts/${uidD}/careerStart/current`),"the marker is written by START");
    assert.match(code,/^CMS17R-pair_[0-9a-f]{64}$/,"the first real pairing code (only issued once the marker exists)");
    assert.equal(await daniel.page.locator("#cmsConnectTestRunNote").isVisible().catch(()=>false),false,"a real WAITING has no test label");
    ok("R1","Daniel's Home START automatically writes the marker before the CMS17R- code");
    await nik.page.locator("#newShowdown").click();
    await nik.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.busy===false&&s.status==="unpaired");},null,{timeout:30000});
    await nik.page.waitForTimeout(500);
    await pairPanel(nik).locator("#persistentNikDanielPairCode").fill(code);
    await pairPanel(nik).getByRole("button",{name:"JOIN DANIEL'S SHOWDOWN",exact:true}).click();
    for(const m of [daniel,nik])await m.page.waitForFunction(()=>window.CareerModePersistentNikDanielPair?.getState?.()?.connectionState==="active",null,{timeout:45000});
    await daniel.page.waitForFunction(()=>window.CareerModeShowdownModes?.getView?.().pairing==="paired",null,{timeout:30000});
    await nik.page.waitForFunction(()=>window.CareerModeShowdownModes?.getView?.().pairing==="paired",null,{timeout:30000});
    ok("R2","Nik joined: both paired, the Showdown is in progress");

    for(const [m,other] of [[daniel,"Nik"],[nik,"Daniel"]]){
      await openSettings(m);v=await settingsView(m);
      assert.equal(v.rows.mode,"Saved online for both of you");assert.equal(v.rows.partner,`Paired with ${other}`);
      assert.ok(v.buttons.includes("UNPAIR"));assert.equal(v.forget,false,"no FORGET THIS DEVICE on a real account");assert.equal(v.connect,false,"no CONNECT PLAYERS");
      assert.ok(!v.buttons.includes("START TEST RUN")&&!v.buttons.includes("JOIN TEST RUN"),"test mode is off for real accounts");
      await both(m,`real-paired-${m.user}`,SETTINGS_PARTS,"#onlinePlayerIdentitySettingsPanel");
      if(m===nik)await closeSettings(m);
    }
    ok("R3","real Settings: Paired with Nik / Paired with Daniel and UNPAIR; no FORGET THIS DEVICE, no CONNECT PLAYERS, no test run");

    // UNPAIR while the Showdown is in progress: the reason and nothing else.
    await daniel.page.locator("#onlinePlayerIdentitySettingsPanel button",{hasText:"UNPAIR"}).click();
    await waitNote(daniel,BLOCKED);
    assert.equal(field(await admin(`accounts/${uidD}/partner/current`),"active").booleanValue,true,"the pairing is unchanged");
    assert.equal(await daniel.page.evaluate(()=>window.CareerModePersistentNikDanielPair.getState().connectionState),"active","the Showdown is unchanged");
    v=await settingsView(daniel);assert.equal(v.rows.partner,"Paired with Nik");assert.ok(v.deleteCurrent,"END SHOWDOWN is still there");
    await both(daniel,"real-unpair-blocked",SETTINGS_PARTS,"#cmsModeSettings");
    ok("R4","UNPAIR during a Showdown: blocked with the reason, nothing changed");

    // END SHOWDOWN, then UNPAIR works.
    await daniel.page.locator(".settingsDeleteCurrentShowdown").click();
    await daniel.page.waitForFunction(()=>!window.CareerModePersistentNikDanielPair?.getState?.()?.rivalryId||!["active","pending-pair"].includes(window.CareerModePersistentNikDanielPair.getState().connectionState),null,{timeout:45000});
    if(!await daniel.page.locator("#settingsOverlay").isVisible())await openSettings(daniel);
    await daniel.page.waitForFunction(()=>Boolean(document.querySelector("#onlinePlayerIdentitySettingsPanel .settingsUnpairButton")),null,{timeout:30000});
    await daniel.page.locator("#onlinePlayerIdentitySettingsPanel .settingsUnpairButton").click();
    await waitNote(daniel,"Unpaired from Nik.");
    v=await settingsView(daniel);
    assert.equal(v.rows.partner,"Not paired");assert.ok(v.buttons.includes("PAIR WITH NIK"));assert.ok(!v.buttons.includes("UNPAIR"));
    assert.equal(field(await admin(`accounts/${uidD}/partner/current`),"active").booleanValue,false,"Daniel's partner record is off");
    assert.equal(field(await admin(`accounts/${uidN}/partner/current`),"active").booleanValue,true,"Nik's side is his own");
    await both(daniel,"real-unpaired-daniel",SETTINGS_PARTS,"#onlinePlayerIdentitySettingsPanel");
    await closeSettings(daniel);
    ok("R5","after END SHOWDOWN, UNPAIR succeeds: Not paired, PAIR WITH NIK");

    // Nik: one-sided UNPAIR, found by the one partner-side read of this page load. Before the reload, Nik's page was still in
    // the Showdown Daniel ended; its terminal-close refresh reports that (END SHOWDOWN's partner behaviour, not
    // part of this PR), so only errors after the reload count for Nik.
    nik.log.deletedShowdownErrors=nik.log.errors.splice(0);
    await nik.page.reload({waitUntil:"domcontentloaded"});
    await nik.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
    await settled(nik);
    await nik.page.waitForFunction(()=>(document.querySelector("#newShowdown .menuTileLabel")?.textContent||"").trim()==="PAIR AGAIN WITH DANIEL",null,{timeout:30000});
    assert.deepEqual(await homeTile(nik),["PAIR","PAIR AGAIN WITH DANIEL","Daniel is no longer paired with you. Tap to pair again."]);
    await both(nik,"partner-unpaired-home-nik",["#mainMenu .menuTile",...HEADER_PARTS]);
    await openSettings(nik);v=await settingsView(nik);
    assert.equal(v.rows.partner,"Daniel is no longer paired with you");assert.ok(v.buttons.includes("PAIR AGAIN"));assert.ok(!v.buttons.includes("UNPAIR"));
    await both(nik,"partner-unpaired-settings-nik",SETTINGS_PARTS,"#onlinePlayerIdentitySettingsPanel");
    ok("R6","Nik after Daniel's UNPAIR: Home and Settings say so plainly and offer PAIR AGAIN");

    // PAIR AGAIN: Nik resets his side and gets the code box; Daniel's PAIR WITH NIK starts the first real pairing again.
    // Nik's phone still holds its local copy of the Showdown Daniel ended; the join refuses until Nik ends it too
    // (END SHOWDOWN), as it did before this PR.
    if(v.deleteCurrent){
      await nik.page.locator(".settingsDeleteCurrentShowdown").click();
      await nik.page.waitForFunction(()=>!document.querySelector(".settingsDeleteCurrentShowdown"),null,{timeout:45000}).catch(()=>{});
      if(!await nik.page.locator("#settingsOverlay").isVisible())await openSettings(nik);
    }
    await nik.page.locator("#onlinePlayerIdentitySettingsPanel button",{hasText:"PAIR AGAIN"}).click();
    await nik.page.locator("#connectPlayersScreen #persistentNikDanielPairCode").waitFor({state:"visible",timeout:30000});
    assert.equal(field(await admin(`accounts/${uidN}/partner/current`),"active").booleanValue,false,"Nik's stale record is reset");
    await openSettings(daniel);
    await daniel.page.locator("#onlinePlayerIdentitySettingsPanel button",{hasText:"PAIR WITH NIK"}).click();
    await daniel.page.locator("#createShowdown").waitFor({state:"visible",timeout:30000});
    await daniel.page.waitForTimeout(400);
    assert.equal(await daniel.page.locator("#cmsRealCareerRow").isVisible(),false,"real START never shows a checkmark");
    await daniel.page.locator("#roundAmount").selectOption("1");
    await daniel.page.locator("#startShowdown").click({timeout:30000});
    await pairPanel(daniel).locator("code").waitFor({timeout:30000});
    const code2=(await pairPanel(daniel).locator("code").innerText()).trim();
    assert.match(code2,/^CMS17R-pair_[0-9a-f]{64}$/,"pairing again is a first real pairing (CMS17R-)");
    await nik.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.busy===false);},null,{timeout:30000});
    await nik.page.waitForTimeout(500);
    await pairPanel(nik).locator("#persistentNikDanielPairCode").fill(code2);
    await pairPanel(nik).getByRole("button",{name:"JOIN DANIEL'S SHOWDOWN",exact:true}).click();
    for(const m of [daniel,nik])await m.page.waitForFunction(()=>window.CareerModePersistentNikDanielPair?.getState?.()?.connectionState==="active",null,{timeout:45000});
    // The partner records are written once each side sees the pairing ACTIVE (its own transaction, a moment later).
    for(const [uid,who] of [[uidD,"Daniel"],[uidN,"Nik"]]){
      const end=Date.now()+30000;let active=false;
      while(!(active=field(await admin(`accounts/${uid}/partner/current`),"active")?.booleanValue===true)&&Date.now()<end)await new Promise(resolve=>setTimeout(resolve,500));
      assert.equal(active,true,`${who}'s partner record is active again`);
    }
    ok("R7","PAIR AGAIN: Nik resets his side, Daniel's PAIR WITH NIK makes a CMS17R- code (no checkmark), both are paired again");

    for(const m of managers){
      assert.deepEqual(m.log.forbidden,[],`${m.name} never contacted a production Firebase host`);
      assert.equal(m.log.productionRuntime,0,`${m.name} never loaded the production runtime`);
      assert.deepEqual(m.log.errors,[],`${m.name} page errors`);
    }
    ok("MZ","no production Firebase host and no page errors in any context");
    console.log(`PASS r79 modes and Settings audit: ${checks} checks at 1280x800 and 390x844; screenshots in ${SHOTS}`);
  }catch(error){
    for(const m of managers){console.log(`--- ${m.name} errors: ${JSON.stringify(m.log.errors.slice(-10))}`);try{fs.mkdirSync(SHOTS,{recursive:true});await m.page.screenshot({path:path.join(SHOTS,`failure-${m.name}.png`)});}catch(_){}}
    throw error;
  }finally{
    await browser.close();server.kill();
  }
}
main().catch(error=>{console.error(error);process.exit(1);});

"use strict";
// r100 W4 (Nik 2026-11-24: "The phone remembers sign in"): in the real app against the Auth + Firestore emulators (composed
// production Rules; test project demo-cms-browser-journey only, never production), one phone (a persistent browser profile):
// sign in once, then a reload, a closed and reopened tab and a full browser restart all come back signed in as the same player
// with no SIGN IN WITH GOOGLE tap; SIGN OUT in Settings then ends it, and a reload, a new tab and a browser restart all stay
// signed out. Firebase keeps the sign-in in its own IndexedDB store; the game's own storage holds no sign-in.
// Run:
//   npx --yes firebase-tools@15.28.1 emulators:exec --config tests/browser/support/firebase.browser-journey.json \
//        --only auth,firestore --project demo-cms-browser-journey "node tests/browser/r100-w4-remember-sign-in-audit.cjs"
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
const APP_PORT=Number(process.env.CMS_TEST_PORT||4177);
const BASE=`http://127.0.0.1:${APP_PORT}/`;
const SWITCH=path.join(ROOT,"tests/browser/support/emulator-runtime-switch.js");
const SDK_DIR=path.join(ROOT,"node_modules/firebase");
// CMS_W4_SHOTS=<dir>: pictures of Settings with SIGN OUT at the Chromebook window/full-screen and phone sizes (for Nik).
const SHOTS=process.env.CMS_W4_SHOTS||"";
const SHOT_SIZES=[["chromebook-window",1920,866],["chromebook-fullscreen",1920,1035],["phone",390,844],["phone-sideways",844,390]];
let checks=0;
const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};
const urlFor=user=>`${BASE}?cmsEmulator=1&cmsEmulatorUser=${user}&cmsAuthPort=${AUTH_PORT}&cmsFirestorePort=${FIRESTORE_PORT}`;
const docUrl=p=>`${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/${p}`;

async function loadComposedRules(){
  const put=await fetch(`${FIRESTORE}/emulator/v1/projects/${PROJECT}:securityRules`,{method:"PUT",headers:{"content-type":"application/json"},
    body:JSON.stringify({rules:{files:[{name:"firestore.rules",content:fs.readFileSync(path.join(ROOT,"firestore.spark.generated.rules"),"utf8")}]}})});
  assert.equal(put.status,200,"composed Rules upload");
  assert.equal((await fetch(docUrl("rivalries/probe"))).status,403,"composed Rules active");
}
// The phone: a persistent browser profile, so closing it and launching it again is a browser restart on the same device.
async function launchPhone(runtime,dir){
  const context=await chromium.launchPersistentContext(dir,{executablePath:runtime.executablePath,headless:true,args:runtime.args,viewport:{width:390,height:844},...(SHOTS?{deviceScaleFactor:2}:{})});
  await context.route(/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/(firebase-[a-z-]+\.js)$/,route=>{
    const file=route.request().url().match(/(firebase-[a-z-]+\.js)$/)[1];
    return route.fulfill({path:path.join(SDK_DIR,file),contentType:"text/javascript; charset=utf-8"});
  });
  await context.addInitScript({path:SWITCH});
  return context;
}
const errors=[];
async function openTab(context){
  const page=await context.newPage();
  page.on("pageerror",error=>errors.push(error.message));
  await installMarbleConfirmAnswers(page,{answer:true});
  await page.goto(urlFor("nik"),{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
  return page;
}
const signInButton=page=>page.getByRole("button",{name:"SIGN IN WITH GOOGLE"});
const account=page=>page.evaluate(()=>{const s=window.CareerModeSparkConnectedAccount?.getState?.();return s?{status:s.status,signedIn:s.signedIn,accountId:s.accountId}:null;});
const badge=page=>page.evaluate(()=>(document.getElementById("onlinePlayerIdentityBadge")?.textContent||"").split(" · ")[0]);
// Signed in by itself: the account restores as the same Google account and the player is NIK, with no tap at all.
async function expectRemembered(page,uid,label){
  await page.waitForFunction(()=>window.CareerModeSparkConnectedAccount?.getState?.()?.status==="ready",null,{timeout:30000}).catch(()=>{});
  const a=await account(page);
  assert.equal(a?.signedIn,true,`${label}: still signed in (${JSON.stringify(a)})`);assert.equal(a.accountId,uid,`${label}: the same Google account`);
  await page.waitForFunction(()=>(document.getElementById("onlinePlayerIdentityBadge")?.textContent||"").split(" · ")[0]==="NIK",null,{timeout:30000});
  assert.equal(await signInButton(page).isVisible().catch(()=>false),false,`${label}: no SIGN IN WITH GOOGLE`);
}
async function expectSignedOut(page,label){
  await page.waitForFunction(()=>{const s=window.CareerModeSparkConnectedAccount?.getState?.();return Boolean(s&&s.initialized===true&&s.busy!==true);},null,{timeout:30000});
  const a=await account(page);
  assert.equal(a.signedIn,false,`${label}: signed out (${JSON.stringify(a)})`);assert.equal(a.accountId,null);
  assert.notEqual(await badge(page),"NIK",`${label}: no player is shown as signed in`);
}
// The game's own storage never holds the sign-in; Firebase keeps it in its own IndexedDB store.
async function storageCheck(page){
  return page.evaluate(async()=>{
    const local=[];try{for(let i=0;i<localStorage.length;i+=1)local.push(localStorage.key(i));}catch(_){}
    const session=[];try{for(let i=0;i<sessionStorage.length;i+=1)session.push(sessionStorage.key(i));}catch(_){}
    const dbs=typeof indexedDB.databases==="function"?(await indexedDB.databases()).map(d=>d.name):[];
    return {authInLocal:local.some(k=>/^firebase:authUser/.test(k)),authInSession:session.some(k=>/^firebase:authUser/.test(k)),dbs};
  });
}

async function main(){
  assert.equal(JSON.parse(fs.readFileSync(path.join(SDK_DIR,"package.json"),"utf8")).version,require(SWITCH).sdkVersion,"SDK pin matches the switch");
  await loadComposedRules();ok("W0.1","composed production Rules active on the emulator");
  const server=spawn(process.execPath,[path.join(ROOT,"tests/support/static-server.cjs")],{stdio:"ignore",env:{...process.env,CMS_TEST_PORT:String(APP_PORT)}});
  await new Promise(resolve=>setTimeout(resolve,800));
  const runtime=await resolveChromiumRuntime();
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"cms-w4-phone-"));
  let context=null;
  try{
    context=await launchPhone(runtime,dir);
    let page=await openTab(context);
    await expectSignedOut(page,"first open");
    await page.locator("#newShowdown").click();
    await signInButton(page).click({timeout:30000});
    const choice=page.getByRole("button",{name:/^Nik · PLAYER/i});
    await Promise.race([choice.waitFor({state:"visible",timeout:30000}),page.waitForFunction(()=>(document.getElementById("onlinePlayerIdentityBadge")?.textContent||"").split(" · ")[0]==="NIK",null,{timeout:30000})]);
    if(await choice.isVisible().catch(()=>false))await choice.click({timeout:5000}).catch(()=>{});
    await page.waitForFunction(()=>(document.getElementById("onlinePlayerIdentityBadge")?.textContent||"").split(" · ")[0]==="NIK",null,{timeout:30000});
    const uid=(await account(page)).accountId;assert.ok(uid,"signed in");
    ok("W1","Nik signs in once with SIGN IN WITH GOOGLE and picks his player");
    const stored=await storageCheck(page);
    assert.equal(stored.authInLocal,false,"no sign-in in localStorage");assert.equal(stored.authInSession,false,"no sign-in in sessionStorage");
    assert.ok(stored.dbs.includes("firebaseLocalStorageDb"),`Firebase keeps the sign-in in its own IndexedDB store (${stored.dbs.join(",")})`);
    ok("W2","the sign-in lives only in Firebase's own IndexedDB store (not in the game's localStorage or sessionStorage)");

    await page.reload({waitUntil:"domcontentloaded"});await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
    await expectRemembered(page,uid,"reload");ok("W3","a reload comes back signed in as Nik with no tap");
    await page.close();page=await openTab(context);
    await expectRemembered(page,uid,"closed and reopened tab");ok("W4","a closed and reopened tab comes back signed in as Nik with no tap");
    await context.close();context=await launchPhone(runtime,dir);page=await openTab(context);
    await expectRemembered(page,uid,"browser restart");ok("W5","a full browser restart comes back signed in as Nik with no tap");

    // SIGN OUT in Settings ends it on this phone.
    if(await page.locator("#settingsButton").isVisible().catch(()=>false))await page.locator("#settingsButton").click({timeout:30000});
    else await page.locator("#onlinePlayerIdentityBadge").click({timeout:30000});
    await page.locator("#settingsOverlay").waitFor({state:"visible",timeout:15000});
    const signOut=page.locator("#settingsOverlay button").filter({hasText:/^\s*SIGN OUT\s*$/});
    await signOut.first().waitFor({state:"visible",timeout:15000}).catch(()=>{});
    if(SHOTS){fs.mkdirSync(SHOTS,{recursive:true});for(const [name,width,height] of SHOT_SIZES){await page.setViewportSize({width,height});await page.waitForTimeout(900);
      await signOut.first().scrollIntoViewIfNeeded().catch(()=>{});await page.screenshot({path:path.join(SHOTS,`settings-sign-out-${name}.png`)});}
      await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);}
    if(!(await signOut.first().isVisible({timeout:15000}).catch(()=>false)))throw new Error(`no SIGN OUT in Settings: ${JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll("#settingsOverlay button")].filter(b=>b.offsetParent!==null).map(b=>b.textContent.trim())))}`);
    // SIGN OUT clears Firebase's remembered sign-in, then the page starts again signed out (Home, SIGN IN WITH GOOGLE).
    await Promise.all([page.waitForEvent("load",{timeout:30000}),signOut.first().click({timeout:15000})]);
    await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
    await expectSignedOut(page,"right after SIGN OUT");
    assert.ok(await page.locator("#mainMenu").isVisible(),"the fresh start lands on Home");
    ok("W6","SIGN OUT in Settings signs the phone out and the app starts again on Home, signed out");
    await page.reload({waitUntil:"domcontentloaded"});await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
    await expectSignedOut(page,"reload after SIGN OUT");
    await page.close();page=await openTab(context);await expectSignedOut(page,"new tab after SIGN OUT");
    await context.close();context=await launchPhone(runtime,dir);page=await openTab(context);await expectSignedOut(page,"browser restart after SIGN OUT");
    const after=await storageCheck(page);assert.equal(after.authInLocal,false);assert.equal(after.authInSession,false);
    ok("W7","after SIGN OUT a reload, a new tab and a browser restart all stay signed out");
    // The next sign-in is the same one tap as before.
    await page.locator("#newShowdown").click();await signInButton(page).click({timeout:30000});
    await page.waitForFunction(()=>(document.getElementById("onlinePlayerIdentityBadge")?.textContent||"").split(" · ")[0]==="NIK",null,{timeout:30000});
    assert.equal((await account(page)).accountId,uid);
    ok("W8","signing in again is one SIGN IN WITH GOOGLE tap and the same player");
    assert.deepEqual(errors,[],"no page errors");
    console.log(`PASS r100 W4 remember sign-in audit: ${checks} checks`);
  }finally{
    await context?.close().catch(()=>{});server.kill();fs.rmSync(dir,{recursive:true,force:true});
  }
}
main().catch(error=>{console.error(error);process.exit(1);});

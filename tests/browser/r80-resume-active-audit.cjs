"use strict";
// r80 resume (G7 + Home items 5/6): from Home, an ACTIVE Showdown always resumes to the screen the game is on, the same place a
// reload takes the player, on Daniel's and Nik's phones, with no frame of GET READY, Career Start or Remote Joining on the way.
// Before: a page that already held the ACTIVE private session answered Home START / CONTINUE CAREER with GET READY, and its
// START CAREER reopened Career Start for a game still in season 1, whose automatic move to the Transfer Challenge had already
// fired once on that page, so the player was stuck on Career Start; a reload fixed it.
// Real app, two Chromium contexts, Auth + Firestore emulators with the composed production Rules (demo project only; a
// production Firebase host fails the run). Current gameplay uses taps and typing; emulator admin restores historical markerless metadata.
//   T1  test mode (no marker yet): an emulator fixture restores an old unjoined markerless code; on Home (same page and after a
//       reload) the START tile never shows WAITING FOR NIK, not even for one frame, and the header chip never shows
//       "Season 1 / 1" for that leftover, and the CONTINUE CAREER tile's line never describes it (items 5, 6, 2).
//   R1  Daniel's first real Home START (automatic marker) makes the CMS17R- code; Home shows WAITING FOR NIK and the chip describes
//       that real Showdown (Season 1 / 3); Nik pastes the code; both reach the league wheel ACTIVE.
//   G7w both go Home from the league wheel and tap START: back on the league wheel.
//   G7a both reach the Transfer Challenge (season 1, Career Start done). Each reloads first (the reference landing), then goes
//       Home and taps START (Daniel) / START and CONTINUE CAREER (Nik): each lands where the reload landed, in the same
//       session, and no frame between the tap and the landing shows GET READY, Career Start or Remote Joining; on every Home
//       frame of a resume (CONTINUE CAREER too) the START tile keeps the live wording, never START A SHOWDOWN or JOIN.
//   G7b the transfer window is open on the server: Daniel reloads (reference), then goes Home and taps START: the same landing.
//   G7c both on Season Results: each reloads (reference), then goes Home and taps START: the same landing.
// Run (two browser contexts):
//   CMS_CHROMIUM_MULTI_CONTEXT=1 npx --yes firebase-tools@15.28.1 emulators:exec --config tests/browser/support/firebase.browser-journey.json \
//        --only auth,firestore --project demo-cms-browser-journey "node tests/browser/r80-resume-active-audit.cjs"
// Optional: CMS_TEST_PORT (app, default 4178), CMS_AUTH_PORT / CMS_FIRESTORE_PORT (emulators, default 9199 / 8181),
// CMS_R79_JOURNEY_SHOTS (screenshots), CMS_RESUME_GALLERY=<dir> (desktop 1440x900 and phone 390x844 PNGs of the Home states).
const assert=require("node:assert/strict");
const {restoreHistoricalMarkerlessAccounts}=require("./support/historical-markerless-account.cjs");
const {installMarbleConfirmAnswers}=require("./support/marble-confirm.cjs");
const {installFirestoreMeter,createMeter}=require("./support/firestore-meter.cjs");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");
const {spawn}=require("node:child_process");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const ROOT=path.resolve(__dirname,"../..");
const PROJECT="demo-cms-browser-journey";
const AUTH_PORT=Number(process.env.CMS_AUTH_PORT||9199),FIRESTORE_PORT=Number(process.env.CMS_FIRESTORE_PORT||8181),FIRESTORE=`http://127.0.0.1:${FIRESTORE_PORT}`;
const APP_PORT=Number(process.env.CMS_TEST_PORT||4178);
const BASE=`http://127.0.0.1:${APP_PORT}/`;
const SWITCH=path.join(ROOT,"tests/browser/support/emulator-runtime-switch.js");
const SDK_DIR=path.join(ROOT,"node_modules/firebase");
const SHOTS=process.env.CMS_R79_JOURNEY_SHOTS||path.join(os.tmpdir(),"cms-r80-resume-active");
const GALLERY=process.env.CMS_RESUME_GALLERY||"";
const FORBIDDEN_HOSTS=/(^|\.)(firestore|identitytoolkit|securetoken|firebaseinstallations|firebaseappcheck|content-firebaseappcheck)\.googleapis\.com$/;
const FRAME_PROBE="r80ResumeFrameProbe";
// The layers that must never show on the way back into a live game from Home.
const NEVER_ON_RESUME=["productionSharedJourneyEntryOverlay","productionSharedCareerStartOverlay","sparkRemoteJoiningOverlay","connectPlayersScreen"];
let checks=0;
const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};
const urlFor=user=>`${BASE}?cmsEmulator=1&cmsEmulatorUser=${user}&cmsAuthPort=${AUTH_PORT}&cmsFirestorePort=${FIRESTORE_PORT}`;
const docUrl=p=>`${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/${p}`;
async function admin(p){const r=await fetch(docUrl(p),{headers:{Authorization:"Bearer owner"}});return r.status===200?r.json():null;}
const meter=createMeter();

async function loadComposedRules(){
  const put=await fetch(`${FIRESTORE}/emulator/v1/projects/${PROJECT}:securityRules`,{method:"PUT",headers:{"content-type":"application/json"},
    body:JSON.stringify({rules:{files:[{name:"firestore.rules",content:fs.readFileSync(path.join(ROOT,"firestore.spark.generated.rules"),"utf8")}]}})});
  assert.equal(put.status,200,"composed Rules upload");
  assert.equal((await fetch(docUrl("rivalries/probe"))).status,403,"composed Rules active");
}
// Every animation frame while recording is on: loading screen, Home, shown screens, the resume-forbidden layers, the Home START
// tile's label and the header chip (text and whether it shows). Started by a page load with the probe flag set in this tab
// (a reload), or on demand (window.__r80StartFrames()) before a tap.
function frameRecorder({probeKey,never}){
  const shown=el=>Boolean(el&&!el.hidden&&!el.classList.contains("hidden")&&el.getClientRects().length&&getComputedStyle(el).display!=="none"&&getComputedStyle(el).visibility!=="hidden"&&Number(getComputedStyle(el).opacity)>0);
  window.__r80StartFrames=()=>{
    window.__r80Frames=[];const run=++window.__r80FrameRun||(window.__r80FrameRun=1);
    const tick=()=>{
      if(window.__r80FrameRun!==run)return;
      const chip=document.getElementById("seasonIndicator");
      window.__r80Frames.push({t:Math.round(performance.now()),loading:shown(document.getElementById("loadingScreen")),home:shown(document.getElementById("mainMenu")),
        screens:[...document.querySelectorAll(".screen")].filter(shown).map(s=>s.id).join(","),layers:never.filter(id=>shown(document.getElementById(id))),
        tile:(document.querySelector("#newShowdown .menuTileLabel")?.textContent||"").trim(),chip:shown(chip)?(chip.textContent||"").trim():null,
        cont:(meta=>shown(meta)?(meta.textContent||"").trim():null)(document.querySelector("#continueCareer .menuTileMeta"))});
      if(window.__r80Frames.length<20000)requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  window.__r80StopFrames=()=>{window.__r80FrameRun=(window.__r80FrameRun||0)+1;return window.__r80Frames||[];};
  let probe=null;try{probe=sessionStorage.getItem(probeKey);}catch(_error){probe=null;}
  if(probe==="1")window.__r80StartFrames();
}
async function openManager(browser,user,viewport){
  const context=await browser.newContext({viewport});
  const log={errors:[],forbidden:[],productionRuntime:0};
  await context.route(/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/(firebase-[a-z-]+\.js)$/,route=>{
    const name=route.request().url().match(/(firebase-[a-z-]+\.js)$/)[1];
    return route.fulfill({path:path.join(SDK_DIR,name),contentType:"text/javascript; charset=utf-8"});
  });
  await installFirestoreMeter(context,{sdkDir:SDK_DIR,user,sink:meter.events,firestoreOrigin:FIRESTORE});
  await context.addInitScript({path:SWITCH});
  await context.addInitScript(frameRecorder,{probeKey:FRAME_PROBE,never:NEVER_ON_RESUME});
  const page=await context.newPage();
  page.on("request",request=>{const u=new URL(request.url());if(FORBIDDEN_HOSTS.test(u.hostname))log.forbidden.push(u.hostname);if(/productionFirebaseRuntime\.js|firebase\.runtime-config\.json/.test(u.pathname))log.productionRuntime+=1;});
  page.on("pageerror",error=>log.errors.push(error.message));
  page.on("console",message=>{if(message.type()==="error"&&!/Failed to load resource/.test(message.text()))log.errors.push(message.text().slice(0,300));});
  page.on("dialog",dialog=>{void dialog.accept().catch(()=>{});});
  await installMarbleConfirmAnswers(page,{answer:true});
  await page.goto(urlFor(user),{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
  return {user,context,page,log};
}
async function shot(m,name){
  try{fs.mkdirSync(SHOTS,{recursive:true});await m.page.screenshot({path:path.join(SHOTS,`${name}-${m.user}.png`),timeout:15000});}
  catch(error){console.log(`screenshot skipped ${name}-${m.user}: ${error.message.split("\n")[0]}`);}
}
async function describe(m){
  return m.page.evaluate(()=>{
    const screens=[...document.querySelectorAll(".screen:not(.hidden)")].map(s=>s.id).join(",");
    const overlays=[...document.querySelectorAll("[id$='Overlay']")].filter(o=>{const st=getComputedStyle(o);return !o.classList.contains("hidden")&&st.display!=="none"&&st.visibility!=="hidden";}).map(o=>`${o.id}: ${o.innerText.replace(/\s+/g," ").slice(0,300)}`);
    const pair=window.CareerModePersistentNikDanielPair?.getState?.();
    return `screens=${screens} | badge=${document.getElementById("onlinePlayerIdentityBadge")?.textContent||""} | pair=${pair?`${pair.status}/${pair.connectionState}/${pair.rivalryId}`:"-"} | session=${window.CareerModeSparkRemoteJoining?.getState?.()?.sessionState||"-"} | transfer=${document.getElementById("transferChallenge")?.dataset.transferPhase||"-"} | tile=${document.querySelector("#newShowdown .menuTileLabel")?.textContent||""} | overlays=${overlays.join(" ## ")}`;
  });
}
const accountId=m=>m.page.evaluate(()=>window.CareerModeSparkConnectedAccount?.getState?.().accountId||null);
const pairPanel=m=>m.page.locator("#connectPlayersScreen #persistentNikDanielPairPanel");
const sessionOf=m=>m.page.evaluate(()=>window.CareerModeSparkRemoteJoining?.getState?.()?.sessionId||null);
const tileLabel=m=>m.page.evaluate(()=>(document.querySelector("#newShowdown .menuTileLabel")?.textContent||"").trim());
const contMetaShown=m=>m.page.evaluate(()=>{const e=document.querySelector("#continueCareer .menuTileMeta");const s=e&&getComputedStyle(e);return e&&e.getClientRects().length&&s.display!=="none"&&s.visibility!=="hidden"?(e.textContent||"").trim():null;});
const chipShown=m=>m.page.evaluate(()=>{const c=document.getElementById("seasonIndicator");const s=c&&getComputedStyle(c);return c&&!c.hidden&&c.getClientRects().length&&s.display!=="none"&&s.visibility!=="hidden"?(c.textContent||"").trim():null;});

async function signIn(m,label){
  await m.page.locator("#newShowdown").click();
  await m.page.getByRole("button",{name:"SIGN IN WITH GOOGLE"}).click({timeout:30000});
  await m.page.getByRole("button",{name:new RegExp(`^${label} · PLAYER`,"i")}).click({timeout:30000});
  await m.page.waitForFunction(text=>document.getElementById("onlinePlayerIdentityBadge")?.textContent===text,label.toUpperCase(),{timeout:30000});
  await m.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.initialized===true&&s.busy===false);},null,{timeout:30000});
}
async function openSettings(m){
  if(await m.page.locator("#settingsButton").isVisible().catch(()=>false))await m.page.locator("#settingsButton").click({timeout:30000});
  else await m.page.locator("#onlinePlayerIdentityBadge").click({timeout:30000});
  await m.page.locator("#settingsOverlay").waitFor({state:"visible",timeout:15000});
}
async function closeLayer(m){
  for(let i=0;i<4;i++){
    if(!await m.page.locator("#connectPlayersScreen").isVisible().catch(()=>false))return;
    const back=m.page.locator("#connectPlayersScreen button:visible").filter({hasText:/^\s*(BACK|CLOSE|×)\s*$/i}).first();
    if(await back.count())await back.click({timeout:5000}).catch(()=>{});else await m.page.keyboard.press("Escape");
    await m.page.waitForTimeout(800);
  }
}
// Real navigation only: press the visible SHOWDOWN HOME / BACK button until Showdown Home (#mainMenu) shows. Bounded to 20 s.
async function backToShowdownHome(m){
  await closeLayer(m);
  const deadline=Date.now()+20000;
  while(Date.now()<deadline){
    if(await m.page.locator("#mainMenu").isVisible().catch(()=>false))return;
    for(const label of [/^\s*(SHOWDOWN HOME|BACK TO HOME|BACK TO MAIN MENU|BACK TO SHOWDOWN HOME)\s*$/i,/^\s*HOME\s*$/i,/^\s*BACK\s*$/i]){
      const back=m.page.locator("button:visible").filter({hasText:label}).first();
      if(await back.count()){await back.click({timeout:5000}).catch(()=>{});break;}
    }
    await m.page.waitForTimeout(500);
  }
  throw new Error(`${m.user}: could not reach Showdown Home within 20 s: ${await describe(m)}`);
}
async function bothActive(managers,rivalryId){
  for(const m of managers)await m.page.waitForFunction(id=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.connectionState==="active"&&(!id||s.rivalryId===id));},rivalryId||null,{timeout:45000});
  for(const m of managers)await m.page.waitForFunction(()=>window.CareerModeSparkRemoteJoining?.getState?.()?.sessionState==="active",null,{timeout:45000});
}
const waitSharedTransferPhase=(m,phase)=>m.page.waitForFunction(value=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.phase===value,phase,{timeout:45000});
const waitTransferPhase=(m,phase)=>m.page.waitForFunction(value=>document.getElementById("transferChallenge")?.dataset.transferPhase===value,phase,{timeout:45000});
const waitTransferState=(m,key,role)=>m.page.waitForFunction(([k,v])=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.[k]?.includes(v)===true,[key,role],{timeout:45000});
async function fillTransferCombo(m,id,value){
  await m.page.locator(`#${id}`).fill(value);
  await m.page.waitForFunction(fieldId=>Boolean(document.getElementById(fieldId)?.dataset.canonicalId),id,{timeout:5000});
}
// The rest of the Transfer Challenge after the window (as r79-two-player-journey-audit.cjs): guesses, signings, Season Results.
async function finishTransferSeason(daniel,nik){
  await daniel.page.locator("#endTransferTimer").click({timeout:30000});
  await daniel.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.endRequestedRoles?.includes("playerOne")===true,null,{timeout:30000});
  await nik.page.locator("#endTransferTimer").click({timeout:30000});
  await waitTransferPhase(nik,"guess_entry");await waitTransferPhase(daniel,"guess_entry");
  await daniel.page.locator("#p2Guess1Type").selectOption("league");await fillTransferCombo(daniel,"p2Guess1Value","Premier League");
  await nik.page.locator("#p1Guess1Type").selectOption("nationality");await fillTransferCombo(nik,"p1Guess1Value","Brazil");
  await daniel.page.getByRole("button",{name:"LOCK MY GUESSES",exact:true}).click({timeout:30000});
  await daniel.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.guessLockedRoles?.includes("playerOne")===true,null,{timeout:30000});
  await nik.page.getByRole("button",{name:"LOCK MY GUESSES",exact:true}).click({timeout:30000});
  await waitTransferPhase(nik,"signing_entry");await waitTransferPhase(daniel,"signing_entry");
  await daniel.page.locator("#p1Signing1Name").fill("QWX Resume Daniel");await daniel.page.locator("#p1Signing1Overall").fill("71");await fillTransferCombo(daniel,"p1Signing1League","Premier League");await fillTransferCombo(daniel,"p1Signing1Nationality","England");
  await daniel.page.getByRole("button",{name:"LOCK MY SIGNINGS",exact:true}).click({timeout:30000});
  await daniel.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.signingLockedRoles?.includes("playerOne")===true,null,{timeout:30000});
  await waitTransferState(nik,"signingLockedRoles","playerOne");
  await nik.page.locator("#p2Signing1Name").fill("ZPV Resume Nik");await nik.page.locator("#p2Signing1Overall").fill("71");await fillTransferCombo(nik,"p2Signing1League","TIM Serie A");await fillTransferCombo(nik,"p2Signing1Nationality","Brazil");
  await nik.page.getByRole("button",{name:"LOCK MY SIGNINGS",exact:true}).click({timeout:30000});
  await waitTransferPhase(nik,"completed");await waitTransferPhase(daniel,"completed");
  for(const m of [daniel,nik]){
    await m.page.getByRole("button",{name:"CONTINUE TO SEASON RESULTS",exact:true}).click({timeout:30000});
    await m.page.locator("#seasonEntry").waitFor({state:"visible",timeout:30000});
  }
}
async function playSetupToTransferChallenge(daniel,nik){
  for(const m of [daniel,nik])await m.page.locator("#clubWheelScreen").waitFor({state:"visible",timeout:45000});
  await daniel.page.locator("#openClubPack").click({timeout:30000});
  await daniel.page.waitForFunction(()=>document.getElementById("clubCardTwo")?.classList.contains("is-revealed")&&document.getElementById("clubNameOne")?.textContent!=="?"&&document.getElementById("clubNameTwo")?.textContent!=="?",null,{timeout:30000});
  const clubs=await daniel.page.evaluate(()=>[document.getElementById("clubNameOne")?.textContent?.trim(),document.getElementById("clubNameTwo")?.textContent?.trim()]);
  await nik.page.waitForFunction(c=>document.getElementById("clubNameOne")?.textContent?.trim()===c[0]&&document.getElementById("clubNameTwo")?.textContent?.trim()===c[1],clubs,{timeout:30000});
  for(const m of [daniel,nik])await m.page.getByRole("button",{name:"CONFIRM SHOWDOWN"}).waitFor({state:"visible",timeout:30000});
  await daniel.page.getByRole("button",{name:"CONFIRM SHOWDOWN"}).click({timeout:30000});
  await nik.page.getByRole("button",{name:"CONFIRM SHOWDOWN"}).click({timeout:30000});
  for(const m of [daniel,nik])await m.page.locator("#productionSharedCareerStartOverlay").waitFor({state:"visible",timeout:30000});
  await daniel.page.getByRole("button",{name:`I STARTED AT ${clubs[0].toUpperCase()}`,exact:true}).click({timeout:30000});
  await nik.page.getByRole("button",{name:`I STARTED AT ${clubs[1].toUpperCase()}`,exact:true}).click({timeout:30000});
  for(const m of [daniel,nik]){
    await m.page.locator("#transferChallenge").waitFor({state:"visible",timeout:45000});
    await m.page.locator("#productionSharedCareerStartOverlay").waitFor({state:"hidden",timeout:30000});
  }
  return clubs;
}
// Where the player is, as a short key: the shown screen plus the Transfer Challenge's local phase.
async function landing(m){
  return m.page.evaluate(()=>{const shown=[...document.querySelectorAll(".screen:not(.hidden)")].map(s=>s.id);const transfer=shown.includes("transferChallenge")?`:${document.getElementById("transferChallenge")?.dataset.transferPhase||"-"}`:"";return `${shown.join(",")}${transfer}`;});
}
const settleOn=async(m,screens,timeout=45000)=>m.page.locator(screens).filter({visible:true}).first().waitFor({state:"visible",timeout});
// The reference: a reload (reduced motion) mid-Showdown, recorded until the page settles on one of the given screens.
async function reloadLanding(m,screens){
  await m.page.evaluate(key=>sessionStorage.setItem(key,"1"),FRAME_PROBE);
  await m.page.emulateMedia({reducedMotion:"reduce"});
  try{
    await m.page.reload({waitUntil:"domcontentloaded"});
    await m.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
    await m.page.waitForFunction(()=>window.CareerModeSparkRemoteJoining?.getState?.()?.sessionState==="active",null,{timeout:45000});
    await settleOn(m,screens);
    await m.page.waitForTimeout(2500);
  }finally{await m.page.emulateMedia({reducedMotion:null});}
  await m.page.evaluate(key=>{sessionStorage.removeItem(key);window.__r80StopFrames?.();},FRAME_PROBE);
  return landing(m);
}
// G7: Home, then one tap on the given tile; every frame from the tap until the page settles is recorded. The landing must equal
// the reload's, the session must stay the same, and no frame may show a resume-forbidden layer or a screen other than Home and
// the landing screen. Reads during the tap are counted (meter) and returned.
async function homeTapResumes(m,tile,{expect,session,screens,label}){
  await backToShowdownHome(m);
  await m.page.waitForTimeout(800);
  const homeTile=await tileLabel(m);
  const readsOf=()=>meter.events.filter(e=>e.user===m.user&&e.k==="read").reduce((n,e)=>n+(e.n||1),0);
  const before=readsOf();
  await m.page.evaluate(()=>window.__r80StartFrames());
  await m.page.locator(`#${tile}`).click({timeout:30000});
  let settled=true;
  try{await m.page.waitForFunction(([sel,exp])=>{const shown=[...document.querySelectorAll(".screen:not(.hidden)")].map(s=>s.id);const transfer=shown.includes("transferChallenge")?`:${document.getElementById("transferChallenge")?.dataset.transferPhase||"-"}`:"";return `${shown.join(",")}${transfer}`===exp;},[screens,expect],{timeout:30000});}
  catch(_error){settled=false;}
  await m.page.waitForTimeout(2500);
  const frames=await m.page.evaluate(()=>window.__r80StopFrames());
  const reads=readsOf()-before;
  const landed=await landing(m);
  const seen=[...new Set(frames.map(f=>`${f.screens}|${f.layers.join("+")}`))];
  console.log(`PROBE ${label} ${m.user} tile="${homeTile}" tiles=${JSON.stringify([...new Set(frames.filter(f=>f.home).map(f=>f.tile))])} tap=${tile} landed=${landed} expect=${expect} reads=${reads} frames=${frames.length} seen=${JSON.stringify(seen)}`);
  if(!settled||landed!==expect){await shot(m,`${label}-stuck`);throw new Error(`${label} ${m.user}: Home ${tile} landed on "${landed}", the reload landed on "${expect}": ${await describe(m)}`);}
  const forbidden=frames.filter(f=>f.layers.length);
  assert.equal(forbidden.length,0,`${label} ${m.user}: ${forbidden.length} frame(s) showed ${JSON.stringify(forbidden[0]?.layers)} on the way back (first at ${forbidden[0]?.t})`);
  // r80 resume (item 3): while the resume runs Home's START tile keeps the live Showdown's wording (or its CHECKING…), never START or JOIN.
  const wrongTile=frames.filter(f=>f.home&&/^(START A SHOWDOWN|JOIN DANIEL'S SHOWDOWN)$/i.test(f.tile));
  assert.equal(wrongTile.length,0,`${label} ${m.user}: ${wrongTile.length} Home frame(s) read "${wrongTile[0]?.tile}" on the START tile during the ${tile} resume`);
  const target=expect.split(":")[0];
  const stray=frames.filter(f=>f.screens&&f.screens!=="mainMenu"&&f.screens!==target);
  assert.equal(stray.length,0,`${label} ${m.user}: ${stray.length} frame(s) showed another screen (${JSON.stringify(stray[0])})`);
  assert.equal(await sessionOf(m),session,`${label} ${m.user}: the same private session`);
  return {reads,frames:frames.length};
}
// Home after a reload: every frame from the page load until the pair has settled plus 3 s. Returns the frames.
async function reloadHomeFrames(m){
  await m.page.evaluate(key=>sessionStorage.setItem(key,"1"),FRAME_PROBE);
  await m.page.reload({waitUntil:"domcontentloaded"});
  await m.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
  await m.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.initialized===true&&s.busy===false);},null,{timeout:30000});
  await m.page.waitForTimeout(3000);
  return m.page.evaluate(key=>{sessionStorage.removeItem(key);return window.__r80StopFrames?.()||[];},FRAME_PROBE);
}
async function galleryShot(m,name){
  if(!GALLERY)return;fs.mkdirSync(GALLERY,{recursive:true});
  const before=m.page.viewportSize();
  for(const [label,size] of [["desktop",{width:1440,height:900}],["phone",{width:390,height:844}]]){
    await m.page.setViewportSize(size);await m.page.waitForTimeout(1500);
    await m.page.screenshot({path:path.join(GALLERY,`resume-${name}-${label}.png`)});
  }
  if(before)await m.page.setViewportSize(before);await m.page.waitForTimeout(600);
}

async function main(){
  assert.equal(JSON.parse(fs.readFileSync(path.join(SDK_DIR,"package.json"),"utf8")).version,require(SWITCH).sdkVersion,"SDK pin matches the switch");
  await loadComposedRules();ok("R0.1","composed production Rules active on the emulator (demo project)");
  const server=spawn(process.execPath,[path.join(ROOT,"tests/support/static-server.cjs")],{stdio:"ignore",env:{...process.env,CMS_TEST_PORT:String(APP_PORT)}});
  await new Promise(resolve=>setTimeout(resolve,800));
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const managers=[];
  try{
    const daniel=await openManager(browser,"daniel",{width:393,height:660});managers.push(daniel);
    const nik=await openManager(browser,"nik",{width:390,height:844});managers.push(nik);
    for(const m of managers)assert.equal(await m.page.evaluate(()=>window.__cmsEmulatorSwitch?.active===true),true,`${m.user} emulator switch active`);
    await signIn(daniel,"Daniel");await signIn(nik,"Nik");
    const uidD=await accountId(daniel);
    assert.equal(await admin(`accounts/${uidD}/careerStart/current`),null,"Daniel has not started a career yet (no marker)");
    ok("R0.2","both signed in on the emulators, no career marker yet");

    // ---------- T1 a historical markerless unused code ----------
    await daniel.page.locator("#newShowdown").click({timeout:30000});
    await daniel.page.locator("#createShowdown").waitFor({state:"visible",timeout:30000});
    await daniel.page.locator("#roundAmount").selectOption("1");
    await daniel.page.locator("#startShowdown").click({timeout:30000});
    await pairPanel(daniel).locator("code").waitFor({timeout:30000});
    const testCode=(await pairPanel(daniel).locator("code").innerText()).trim();
    assert.match(testCode,/^CMS17R-pair_[0-9a-f]{64}$/,"Home START creates a real first-pairing code");
    // An old unused markerless code is a migration fixture, never a current UI path.
    await restoreHistoricalMarkerlessAccounts([daniel],{firestorePort:FIRESTORE_PORT});
    await backToShowdownHome(daniel);
    await daniel.page.waitForTimeout(1500);
    assert.doesNotMatch(await tileLabel(daniel),/WAITING FOR NIK/i,"T1 same page: the tile never says WAITING FOR NIK for the leftover test code");
    assert.equal(await chipShown(daniel),null,"T1 same page: no Season chip for the leftover test code");
    assert.equal(await contMetaShown(daniel),null,"T1 same page: the CONTINUE CAREER tile does not describe the leftover test code");
    await galleryShot(daniel,"home-leftover-test");
    for(let i=0;i<3;i++){
      const frames=await reloadHomeFrames(daniel);
      const shownHome=frames.filter(f=>!f.loading&&f.home);
      assert.ok(shownHome.length>0,"T1 reload: Home frames were recorded");
      const waiting=shownHome.filter(f=>/WAITING FOR NIK/i.test(f.tile));
      const chips=shownHome.filter(f=>f.chip!==null);
      const described=shownHome.filter(f=>f.cont!==null&&/Daniel vs Nik|Season \d+ of/i.test(f.cont));
      console.log(`PROBE T1-reload-${i} tiles=${JSON.stringify([...new Set(shownHome.map(f=>f.tile))])} chips=${JSON.stringify([...new Set(shownHome.map(f=>f.chip))])} cont=${JSON.stringify([...new Set(shownHome.map(f=>f.cont))])}`);
      assert.equal(waiting.length,0,`T1 reload ${i}: ${waiting.length} Home frame(s) showed WAITING FOR NIK before the mode resolved (first at ${waiting[0]?.t})`);
      assert.equal(described.length,0,`T1 reload ${i}: ${described.length} Home frame(s) described the leftover on CONTINUE CAREER ("${described[0]?.cont}")`);
      assert.equal(chips.length,0,`T1 reload ${i}: ${chips.length} Home frame(s) showed the chip "${chips[0]?.chip}" for the leftover test code`);
    }
    ok("T1","historical markerless code never shows WAITING FOR NIK, a Season chip or a CONTINUE CAREER line describing it on Home (same page and three reloads, every frame)");

    // ---------- R1 the first real Showdown (3 seasons) ----------
    await daniel.page.locator("#newShowdown").click({timeout:30000});
    await daniel.page.locator("#createShowdown").waitFor({state:"visible",timeout:30000});
    assert.equal(await daniel.page.locator("#cmsRealCareerRow,#cmsRealCareerCheck,#cmsTestRunNote").count(),0,"real START has no mode UI");
    await daniel.page.locator("#roundAmount").selectOption("3");
    await daniel.page.locator("#startShowdown").click({timeout:30000});
    await daniel.page.waitForFunction(()=>/^CMS17R-/.test((document.querySelector("#connectPlayersScreen #persistentNikDanielPairPanel code")?.textContent||"").trim()),null,{timeout:30000});
    assert.ok(await admin(`accounts/${uidD}/careerStart/current`),"START automatically writes the career marker before the code");
    const code1=(await pairPanel(daniel).locator("code").innerText()).trim();
    const R1=code1.slice(7);
    await backToShowdownHome(daniel);
    await daniel.page.waitForFunction(()=>/WAITING FOR NIK/i.test(document.querySelector("#newShowdown .menuTileLabel")?.textContent||""),null,{timeout:30000});
    await daniel.page.waitForFunction(()=>{const c=document.getElementById("seasonIndicator");return Boolean(c&&c.getClientRects().length&&getComputedStyle(c).display!=="none"&&/Season 1 \/ 3/i.test(c.textContent||""));},null,{timeout:30000});
    await galleryShot(daniel,"home-real-waiting");
    ok("R1.1","Daniel's real code: Home says WAITING FOR NIK and the chip describes it (Season 1 / 3)");
    await nik.page.locator("#newShowdown").click({timeout:30000});
    await pairPanel(nik).locator("#persistentNikDanielPairCode").waitFor({state:"visible",timeout:30000});
    await pairPanel(nik).locator("#persistentNikDanielPairCode").fill(code1);
    await pairPanel(nik).getByRole("button",{name:"JOIN DANIEL'S SHOWDOWN",exact:true}).click();
    // Daniel's page is on Home: his tile follows the pair (CONTINUE SHOWDOWN); his tap takes him in.
    await bothActive([nik],R1);
    for(let i=0;i<30&&!await daniel.page.locator("#leagueWheelScreen").isVisible().catch(()=>false);i++){
      if(await daniel.page.locator("#mainMenu").isVisible().catch(()=>false)&&await daniel.page.locator("#newShowdown").isEnabled().catch(()=>false)&&/CONTINUE SHOWDOWN/i.test(await tileLabel(daniel)))await daniel.page.locator("#newShowdown").click({timeout:5000}).catch(()=>{});
      await daniel.page.waitForTimeout(1000);
    }
    await bothActive([daniel,nik],R1);
    for(const m of managers)await m.page.locator("#leagueWheelScreen").waitFor({state:"visible",timeout:45000});
    const session=await sessionOf(daniel);
    assert.equal(await sessionOf(nik),session,"one private session");
    ok("R1.2","Nik joined the real code; both on the league wheel in one ACTIVE session");

    // ---------- G7w the league wheel ----------
    for(const m of managers){
      await homeTapResumes(m,"newShowdown",{expect:"leagueWheelScreen",session,screens:"#leagueWheelScreen",label:"G7w"});
    }
    ok("G7w","both: Home START with the ACTIVE session goes straight back to the league wheel");
    await daniel.page.locator("#spinLeague").click({timeout:30000});
    await daniel.page.waitForFunction(()=>document.getElementById("spinLeague")?.textContent==="CONTINUE TO CLUB PACKS",null,{timeout:30000});
    await playSetupToTransferChallenge(daniel,nik);
    ok("R2","setup confirmed, both started their careers and reached the Transfer Challenge (season 1)");

    // ---------- G7a the Transfer Challenge right after Career Start ----------
    const transferScreens="#transferChallenge, #dashboard";
    for(const m of managers){
      const reference=await reloadLanding(m,transferScreens);
      console.log(`PROBE G7a-reload ${m.user} landed=${reference}`);
      assert.equal(await m.page.locator("#productionSharedCareerStartOverlay").isVisible().catch(()=>false),false,`${m.user}: the reload does not stop on Career Start`);
      assert.equal(await m.page.locator("#productionSharedJourneyEntryOverlay").isVisible().catch(()=>false),false,`${m.user}: no GET READY after the reload`);
      const taps=m.user==="nik"?["newShowdown","continueCareer"]:["newShowdown","newShowdown","continueCareer"];
      for(const tile of taps)await homeTapResumes(m,tile,{expect:reference,session,screens:transferScreens,label:"G7a"});
    }
    await shot(daniel,"g7a-landed");
    await galleryShot(daniel,"transfer-after-home-start");
    ok("G7a","both: Home START (twice on one page) and CONTINUE CAREER land where a reload lands (Transfer Challenge), same session, no GET READY / Career Start / Remote Joining frame, and the START tile never reads START or JOIN on the way");

    // ---------- G7b the live transfer window ----------
    await settleOn(daniel,"#transferChallenge");
    await daniel.page.locator("#startTransferTimer").click({timeout:30000});
    await waitTransferPhase(daniel,"window");await waitTransferPhase(nik,"window");
    await waitSharedTransferPhase(daniel,"WINDOW_OPEN");await waitSharedTransferPhase(nik,"WINDOW_OPEN");
    {
      const reference=await reloadLanding(daniel,transferScreens);
      console.log(`PROBE G7b-reload daniel landed=${reference}`);
      await homeTapResumes(daniel,"newShowdown",{expect:reference,session,screens:transferScreens,label:"G7b"});
      if(reference!=="transferChallenge:window"){await daniel.page.locator("#seasonPrimaryAction").click({timeout:30000});await waitTransferPhase(daniel,"window");}
      await daniel.page.locator("#endTransferTimer").waitFor({state:"visible",timeout:30000});
    }
    ok("G7b","Daniel: Home START during the live transfer window lands where a reload lands, back on the window");

    // ---------- G7c Season Results ----------
    await finishTransferSeason(daniel,nik);
    const resultScreens="#seasonEntry, #transferChallenge, #dashboard";
    for(const m of managers){
      const reference=await reloadLanding(m,resultScreens);
      console.log(`PROBE G7c-reload ${m.user} landed=${reference}`);
      await homeTapResumes(m,"newShowdown",{expect:reference,session,screens:resultScreens,label:"G7c"});
    }
    ok("G7c","both: Home START at Season Results lands where a reload lands, same session, no GET READY / Career Start / Remote Joining frame");

    for(const m of managers){assert.deepEqual(m.log.forbidden,[],`${m.user} never contacted a production Firebase host`);assert.equal(m.log.productionRuntime,0);}
    for(const m of managers)if(m.log.errors.length)console.log(`PROBE Z-errors-${m.user} ${JSON.stringify(m.log.errors.slice(-8))}`);
    ok("Z","no production Firebase host; emulator only");
    console.log(`PASS r80 resume-active audit: ${checks} checks`);
  }catch(error){
    for(const m of managers){console.log(`--- ${m.user}: ${await describe(m).catch(e=>e.message)}`);console.log(`--- ${m.user} errors: ${JSON.stringify(m.log.errors.slice(-10))}`);await shot(m,"failure");}
    throw error;
  }finally{
    await browser.close();server.kill();
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});

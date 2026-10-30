"use strict";
const rosterRoulette=require("./support/roster-roulette.cjs");
// r80: Nik's first real game on r79 never showed in History, Legacy, Career Statistics or the Trophy Room.
// The sequence, on two accounts whose real career had not started (test mode), as the r79 emulator reproduction found it:
//   1. an older code of Daniel's (an r78 CREATE CODE FOR NIK, or a shell with seasons chosen and no code yet) is still open;
//   2. r79's reload recovery / Home START / CONTINUE CAREER reopened WAITING with it (or made a code for the code-less shell)
//      WITHOUT the one-time START REAL CAREER checkmark: a CMS17- test code; Nik typed it in and both played to the end
//      (badges "TEST RUN · NOTHING COUNTS"); the game showed in History right after it finished;
//   3. Daniel's next Home START ticked the checkmark: his marker named every Showdown in his career index, that game too, and
//      Nik's first CMS17R- join wrote his own marker the same way. The list never changes, so the game was gone for good.
// This audit runs the r80 code through that sequence. Real app, two Chromium contexts, Auth + Firestore emulators with the
// composed production Rules (demo project only; production Firebase hosts fail the run). Current UI gameplay is real.
// Emulator admin restores historical markerless metadata after the first finished game and unused code, the stored
// shape of r79's leaked game. Both markers' startedAt is set to an r79 time (2026-10-18 20:00 UTC), as Nik and
// Daniel had it (js/careerStartMarker.js reveals the hidden game only for markers made before r80's cutoff).
//   H1  a 1-season real Showdown is played to the end, then restored as a historical markerless fixture.
//   H2  Daniel's leftover code (CMS17-, never used, still OPEN: Codex #936, unexpired); Daniel reloads: nothing reopens it
//       (no WAITING, no code; he is on Home); on r79 WAITING came back over the wheel with that test code.
//   H3  Daniel's Home START opens the seasons screen with no checkmark; its START closes the
//       leftover (nobody joined it), writes the marker (it names the finished game and the leftover), then makes a NEW real
//       code (CMS17R-), never the leftover. Before Codex #936 the marker refused here ("Finish or end the current Showdown").
//   H3b Nik types the leftover code (Home > JOIN): refused, it is closed; nothing of his changes.
//   H4  Nik types the code once and joins; his marker is written before the join (it names the finished game).
//   H5  the real 1-season Showdown is played to the end and closed by itself.
//   H6  History (Legacy), Career Statistics and the Trophy Room show BOTH finished games on both phones (the one the marker
//       names was finished on r79 or later, so js/careerStartMarker.js shows it again); the leftover never shows; the same
//       after both reload.
// Run (two browser contexts):
//   CMS_CHROMIUM_MULTI_CONTEXT=1 npx --yes firebase-tools@15.28.1 emulators:exec --config tests/browser/support/firebase.browser-journey.json \
//        --only auth,firestore --project demo-cms-browser-journey "node tests/browser/r80-first-real-game-history-audit.cjs"
// Optional: CMS_TEST_PORT (app, default 4178), CMS_AUTH_PORT / CMS_FIRESTORE_PORT (emulators, default 9199 / 8181),
// CMS_R79_JOURNEY_SHOTS (screenshots).
const assert=require("node:assert/strict");
const {restoreHistoricalMarkerlessAccounts}=require("./support/historical-markerless-account.cjs");
const {installMarbleConfirmAnswers,marbleConfirmMessages}=require("./support/marble-confirm.cjs");
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
const SHOTS=process.env.CMS_R79_JOURNEY_SHOTS||path.join(os.tmpdir(),"cms-r79-two-player-journey");
const METER_OUT=process.env.CMS_R79_METER_OUT||"";
const PARK_MS=Number(process.env.CMS_R79_PARK_MS||60000);
const BUDGET=Object.freeze({readsPerSeason:800,writesPerSeason:600});
const FORBIDDEN_HOSTS=/(^|\.)(firestore|identitytoolkit|securetoken|firebaseinstallations|firebaseappcheck|content-firebaseappcheck)\.googleapis\.com$/;
// The 1-season result the scripted season produces (as two-manager-browser-journey.cjs with CMS_SHOWDOWN_LENGTH=1).
const FINAL_EXPECTED={daniel:9,nik:3,winner:"playerOne",winnerName:"Daniel"};
const FRAME_PROBE="r79JourneyFrameProbe";
let checks=0;
const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};
const urlFor=user=>`${BASE}?cmsEmulator=1&cmsEmulatorUser=${user}&cmsAuthPort=${AUTH_PORT}&cmsFirestorePort=${FIRESTORE_PORT}`;
const docUrl=p=>`${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/${p}`;
async function admin(p){const r=await fetch(docUrl(p),{headers:{Authorization:"Bearer owner"}});return r.status===200?r.json():null;}
async function adminUntil(p,test,label,timeout=30000){const end=Date.now()+timeout;for(;;){const doc=await admin(p);if(doc&&test(doc))return doc;if(Date.now()>end)throw new Error(`${label}: ${JSON.stringify(doc).slice(0,400)}`);await new Promise(resolve=>setTimeout(resolve,500));}}
const field=(doc,...keys)=>keys.reduce((v,k)=>v&&(v.mapValue?v.mapValue.fields[k]:v.fields?v.fields[k]:undefined),doc);
const ids=arr=>(arr&&arr.arrayValue&&arr.arrayValue.values||[]).map(v=>v.stringValue);
const meter=createMeter();

// ---------- shared helpers (as in two-manager-browser-journey.cjs, r79-delete-rejoin-audit.cjs, r79-modes-settings-audit.cjs) ----------
async function loadComposedRules(){
  const put=await fetch(`${FIRESTORE}/emulator/v1/projects/${PROJECT}:securityRules`,{method:"PUT",headers:{"content-type":"application/json"},
    body:JSON.stringify({rules:{files:[{name:"firestore.rules",content:fs.readFileSync(path.join(ROOT,"firestore.spark.generated.rules"),"utf8")}]}})});
  assert.equal(put.status,200,"composed Rules upload");
  assert.equal((await fetch(docUrl("rivalries/probe"))).status,403,"composed Rules active");
}
// Records every animation frame of a page load while the probe flag is set in this tab: loading screen, Home, active screen.
function frameRecorder(probeKey){
  let probe=null;try{probe=sessionStorage.getItem(probeKey);}catch(_error){probe=null;}
  if(probe!=="1")return;
  window.__r79Frames=[];
  const shown=el=>Boolean(el&&!el.classList.contains("hidden")&&el.getClientRects().length&&getComputedStyle(el).display!=="none"&&getComputedStyle(el).visibility!=="hidden"&&Number(getComputedStyle(el).opacity)>0);
  const tick=()=>{
    window.__r79Frames.push({t:Math.round(performance.now()),loading:shown(document.getElementById("loadingScreen")),home:shown(document.getElementById("mainMenu")),
      screens:[...document.querySelectorAll(".screen")].filter(shown).map(s=>s.id).join(",")});
    if(window.__r79Frames.length<20000)requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
async function openManager(browser,user,viewport){
  const context=await browser.newContext({viewport});
  const log={errors:[],forbidden:[],productionRuntime:0,taps:[]};
  await context.exposeBinding("__cmsTap",(_source,tap)=>{log.taps.push(tap);});
  await context.addInitScript(()=>{window.addEventListener("click",event=>{if(!event.isTrusted)return;const b=event.target&&event.target.closest&&event.target.closest("button,.menuTile");if(b&&typeof window.__cmsTap==="function")void window.__cmsTap({id:b.id||"",text:(b.textContent||"").replace(/\s+/g," ").trim().slice(0,60)});},true);});
  await context.route(/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/(firebase-[a-z-]+\.js)$/,route=>{
    const name=route.request().url().match(/(firebase-[a-z-]+\.js)$/)[1];
    return route.fulfill({path:path.join(SDK_DIR,name),contentType:"text/javascript; charset=utf-8"});
  });
  // Registered after the SDK route, so it answers firebase-firestore.js first (Playwright runs the newest matching route first).
  await installFirestoreMeter(context,{sdkDir:SDK_DIR,user,sink:meter.events,firestoreOrigin:FIRESTORE});
  await context.addInitScript({path:SWITCH});
  await context.addInitScript(frameRecorder,FRAME_PROBE);
  const page=await context.newPage();
  wirePage({user,context,page,log},page);
  await installMarbleConfirmAnswers(page,{answer:true});
  await page.goto(urlFor(user),{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
  return {user,context,page,log};
}
function wirePage(m,page){
  page.on("request",request=>{const u=new URL(request.url());if(FORBIDDEN_HOSTS.test(u.hostname))m.log.forbidden.push(u.hostname);if(/productionFirebaseRuntime\.js|firebase\.runtime-config\.json/.test(u.pathname))m.log.productionRuntime+=1;});
  page.on("pageerror",error=>m.log.errors.push(error.message));
  page.on("console",message=>{if(message.type()==="error"&&!/Failed to load resource/.test(message.text()))m.log.errors.push(message.text().slice(0,300));});
  // LOCK MY GUESSES / LOCK MY SIGNINGS ask "Lock N of 3 ...?" when a form is partly filled; this journey fills one row.
  page.on("dialog",dialog=>{void dialog.accept().catch(()=>{});});
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
    return `screens=${screens} | badge=${document.getElementById("onlinePlayerIdentityBadge")?.textContent||""} | pair=${pair?`${pair.status}/${pair.connectionState}/${pair.rivalryId}`:"-"} | session=${window.CareerModeSparkRemoteJoining?.getState?.()?.sessionState||"-"} | transfer=${document.getElementById("transferChallenge")?.dataset.transferPhase||"-"} | overlays=${overlays.join(" ## ")}`;
  });
}
const accountId=m=>m.page.evaluate(()=>window.CareerModeSparkConnectedAccount?.getState?.().accountId||null);
const pairPanel=m=>m.page.locator("#connectPlayersScreen #persistentNikDanielPairPanel");
const sessionOf=m=>m.page.evaluate(()=>window.CareerModeSparkRemoteJoining?.getState?.()?.sessionId||null);
// The active local save of the Showdown Home/library (as r79-delete-rejoin-audit.cjs reads it): save id, rivalry, seasons.
const showdownOf=m=>m.page.evaluate(()=>{const l=window.CareerModeSaveLibraryRuntime?.getLibrarySnapshot?.();const e=l&&(l.saves||[]).find(x=>x.saveId===l.activeSaveId);const p=window.CareerModePersistentNikDanielPair?.getState?.();return e?{saveId:e.saveId,totalRounds:e.showdown?.totalRounds??null,savedRivalryId:e.showdown?.sharedJourney?.rivalryId||null,pairRivalryId:p?.rivalryId||null}:null;});
const homeTile=m=>m.page.evaluate(()=>{const t=document.getElementById("newShowdown");return t?[".menuTileCode",".menuTileLabel",".menuTileMeta"].map(s=>(t.querySelector(s)?.textContent||"").trim()):null;});
const pairState=m=>m.page.evaluate(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return s?{status:s.status,rivalryId:s.rivalryId,connectionState:s.connectionState,closedRivalryId:s.closedRivalryId||null,busy:s.busy}:null;});

async function signIn(m,label){
  await m.page.locator("#newShowdown").click();
  await m.page.getByRole("button",{name:"SIGN IN WITH GOOGLE"}).click({timeout:30000});
  await m.page.getByRole("button",{name:new RegExp(`^${label} · PLAYER`,"i")}).click({timeout:30000});
  await m.page.waitForFunction(text=>document.getElementById("onlinePlayerIdentityBadge")?.textContent===text,label.toUpperCase(),{timeout:30000});
  await m.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.initialized===true&&s.busy===false);},null,{timeout:30000});
}
// Home START -> the seasons screen -> START: WAITING over the locked league wheel with the code (r79 one start flow).
async function danielStartsShowdown(m,length,{firstRealStart=false}={}){
  await m.page.locator("#newShowdown").click({timeout:30000});
  await m.page.locator("#createShowdown").waitFor({state:"visible",timeout:30000});
  assert.equal(await m.page.locator("#cmsRealCareerRow,#cmsRealCareerCheck,#cmsTestRunNote").count(),0,"START has no checkmark, mode choice or test label");
  if(firstRealStart)assert.equal(await m.page.evaluate(async()=>{await window.loadRuntimeScript("career-start-marker","js/careerStartMarker.js",()=>Boolean(window.CareerModeCareerStartMarker));return (await window.CareerModeCareerStartMarker.readCurrentMarker()).status;}),"none","the first START begins without a career marker");
  await m.page.locator("#roundAmount").selectOption(String(length));
  await m.page.locator("#startShowdown").click({timeout:30000});
  await pairPanel(m).locator("code").waitFor({timeout:30000});
  const marker=await m.page.evaluate(async()=>{await window.loadRuntimeScript("career-start-marker","js/careerStartMarker.js",()=>Boolean(window.CareerModeCareerStartMarker));return window.CareerModeCareerStartMarker.readCurrentMarker();});
  assert.equal(marker.status,"ready","START automatically wrote the career-start marker before showing the code");
  assert.equal(marker.active,true,"this Showdown counts toward the real career");
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
// Real navigation only: press the visible SHOWDOWN HOME / BACK button until Showdown Home (#mainMenu) shows. Bounded to 20 s.
async function backToShowdownHome(m){
  const deadline=Date.now()+20000;
  while(Date.now()<deadline){
    if(await m.page.locator("#mainMenu").isVisible().catch(()=>false))return;
    for(const label of [/^\s*(SHOWDOWN HOME|BACK TO HOME|BACK TO MAIN MENU|BACK TO SHOWDOWN HOME)\s*$/i,/^\s*HOME\s*$/i,/^\s*BACK\s*$/i]){
      const back=m.page.locator("button:visible").filter({hasText:label}).first();
      if(await back.count()){await back.click({timeout:5000}).catch(()=>{});break;}
    }
    await m.page.waitForTimeout(500);
  }
  const diag=await m.page.evaluate(()=>({screens:[...document.querySelectorAll(".screen:not(.hidden)")].map(s=>s.id),buttons:[...document.querySelectorAll("button")].filter(b=>b.offsetParent!==null).map(b=>(b.innerText||b.id||"").replace(/\s+/g," ").trim()).slice(0,30)}));
  throw new Error(`${m.user}: could not reach Showdown Home within 20 s ${JSON.stringify(diag)}`);
}

// ---------- season play (as in two-manager-browser-journey.cjs) ----------
// The shared (server) phase of the Transfer Challenge: READY, WINDOW_OPEN, GUESS_ENTRY, SIGNING_ENTRY, COMPLETED.
const waitSharedTransferPhase=(m,phase)=>m.page.waitForFunction(value=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.phase===value,phase,{timeout:45000});
const waitTransferPhase=(m,phase)=>m.page.waitForFunction(value=>document.getElementById("transferChallenge")?.dataset.transferPhase===value,phase,{timeout:45000});
const waitTransferState=(m,key,role)=>m.page.waitForFunction(([k,v])=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.[k]?.includes(v)===true,[key,role],{timeout:45000});
async function fillTransferCombo(m,id,value){
  await m.page.locator(`#${id}`).fill(value);
  await m.page.waitForFunction(fieldId=>Boolean(document.getElementById(fieldId)?.dataset.canonicalId),id,{timeout:5000});
}
async function assertPrivateTokenAbsent(m,token,label){
  const leak=await m.page.evaluate(value=>({text:(document.body.innerText||"").includes(value),inputs:[...document.querySelectorAll("input")].filter(node=>String(node.value||"").includes(value)).map(node=>node.id)}),token);
  assert.equal(leak.text,false,`${label}: page text leaked ${token}`);
  assert.deepEqual(leak.inputs,[],`${label}: input values leaked ${token}`);
}
async function fillSeasonResult(m,prefix,result){
  await m.page.locator(`#${prefix}LeaguePosition`).fill(String(result.leaguePosition));
  await m.page.locator(`#${prefix}LeaguePoints`).fill(String(result.leaguePoints));
  await m.page.locator(`#${prefix}LeagueGoals`).fill(String(result.leagueGoals));
  for(const [suffix,key] of [["DomesticCup","domesticCup"],["ChampionsLeague","championsLeague"],["TopScorer","topScorer"],["TopAssist","topAssist"]])await m.page.locator(`#${prefix}${suffix}`).setChecked(Boolean(result[key]));
}
async function publishSeasonResult(m){
  await m.page.locator("#completeSeason").click({timeout:30000});
  await m.page.waitForFunction(()=>document.getElementById("seasonReviewHeading")?.textContent==="REVIEW YOUR SEASON RESULT",null,{timeout:30000});
  await m.page.locator("#confirmSeasonCompletion").click({timeout:30000});
  await m.page.waitForFunction(()=>/YOUR RESULT IS PUBLISHED|BOTH MANAGERS PUBLISHED/.test(document.getElementById("seasonReviewHeading")?.textContent||""),null,{timeout:30000});
}
// The final season's commit: Daniel's COMMIT & ACKNOWLEDGE, Nik's ACKNOWLEDGE; the close is automatic (no CLOSE tap).
async function commitFinalSeasonViaUi(daniel,nik,p1,p2,seasonNumber){
  await daniel.page.waitForFunction(()=>document.getElementById("sharedSeasonCommitAction")?.textContent==="LOCK & CONFIRM SEASON",null,{timeout:45000});
  await nik.page.waitForFunction(()=>/^(WAITING FOR DANIEL|CONFIRM SEASON)$/.test(document.getElementById("sharedSeasonCommitAction")?.textContent||""),null,{timeout:45000});
  if(await nik.page.locator("#sharedSeasonCommitAction").textContent()==="WAITING FOR DANIEL")assert.equal(await nik.page.locator("#sharedSeasonCommitAction").isDisabled(),true,"Nik cannot commit");
  await daniel.page.locator("#sharedSeasonCommitAction").click({timeout:30000});
  await daniel.page.waitForFunction(()=>/^(CONFIRMED ✓ · WAITING FOR RIVAL|SEASON CONFIRMED ✓)$/.test(document.getElementById("sharedSeasonCommitAction")?.textContent||""),null,{timeout:30000});
  await nik.page.waitForFunction(()=>document.getElementById("sharedSeasonCommitAction")?.textContent==="CONFIRM SEASON",null,{timeout:45000});
  await nik.page.locator("#sharedSeasonCommitAction").click({timeout:30000});
  for(const m of [daniel,nik]){
    await m.page.waitForFunction(()=>document.getElementById("sharedSeasonCommitAction")?.textContent==="SEASON CONFIRMED ✓"||window.CareerModeProductionSharedTerminalClose?.getState?.()?.phase==="CLOSED",null,{timeout:45000});
    await m.page.waitForFunction(()=>{const shown=id=>{const el=document.getElementById(id);return Boolean(el&&el.getClientRects().length&&getComputedStyle(el).visibility!=="hidden");};return shown("sharedCanonicalScoringPanel")||shown("finalWinnerScreen");},null,{timeout:45000});
    await m.page.waitForFunction(({n,s1,s2})=>{const t=id=>document.getElementById(id)?.textContent?.trim();return t("panelLastSeasonLabel")===`FINAL SEASON ${n}`&&t("panelLastSeasonDaniel")===String(s1)&&t("panelLastSeasonNik")===String(s2);},{n:seasonNumber,s1:p1,s2:p2},{timeout:60000});
  }
}
// After a reload the manager is back in the Showdown; if the app parks on the season dashboard, the player taps its primary
// action (OPEN SHARED ... / VIEW TRANSFER VERDICTS) as in two-manager-browser-journey.cjs J9.3.
// r79 gallery (fix 4): the reload runs with reduced motion, whose 220 ms splash minimum (js/app.js) cannot hide a Home frame the
// way the 2.7 s one did: only the startup hold (js/ssjr.js, live-game resume) keeps Home off screen.
async function reloadMidShowdown(m,{expectSession,expectShowdown,landing,button,screens="#dashboard, #transferChallenge, #seasonEntry"}){
  await m.page.evaluate(key=>sessionStorage.setItem(key,"1"),FRAME_PROBE);
  await m.page.emulateMedia({reducedMotion:"reduce"});
  try{
    await m.page.reload({waitUntil:"domcontentloaded"});
    await m.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
    await m.page.waitForFunction(()=>window.CareerModeSparkRemoteJoining?.getState?.()?.sessionState==="active",null,{timeout:45000});
    await m.page.locator(screens).filter({visible:true}).first().waitFor({state:"visible",timeout:45000});
    await m.page.waitForTimeout(1500);
  }finally{await m.page.emulateMedia({reducedMotion:null});}
  const frames=await m.page.evaluate(key=>{sessionStorage.removeItem(key);return window.__r79Frames||[];},FRAME_PROBE);
  const after=frames.filter(f=>!f.loading);
  const homeFrames=after.filter(f=>f.home);
  assert.ok(after.length>0,`${m.user}: frames were recorded after the loading screen`);
  assert.equal(homeFrames.length,0,`${m.user}: ${homeFrames.length} frame(s) after the loading screen showed Home (first ${JSON.stringify(homeFrames[0]||null)}; first shown ${JSON.stringify(after[0])})`);
  assert.equal(await sessionOf(m),expectSession,`${m.user} is back in the same private session`);
  assert.deepEqual(await showdownOf(m),expectShowdown,`${m.user} is back in the same Showdown (same local save and rivalry)`);
  assert.equal(await m.page.locator("#productionSharedCareerStartOverlay").isVisible().catch(()=>false),false,`${m.user}: the reload does not replay Career Start`);
  assert.equal(await m.page.locator("#productionSharedJourneyEntryOverlay").isVisible().catch(()=>false),false,`${m.user}: no GET READY after the reload`);
  const firstScreens=after[0].screens;
  const landed=await m.page.evaluate(()=>({screens:[...document.querySelectorAll(".screen:not(.hidden)")].map(s=>s.id).join(","),replay:document.getElementById("transferChallenge")?.dataset.sharedTransferReplay||null,primary:(document.getElementById("continueFromTransfers")?.textContent||"").trim()}));
  await shot(m,`reload-landed`);
  if(await m.page.locator("#dashboard").isVisible().catch(()=>false)){
    // Wait for the dashboard's button to name the step the Showdown is on (it is decorated once the shared state is read).
    try{await m.page.waitForFunction(re=>new RegExp(re).test(document.getElementById("seasonPrimaryAction")?.textContent||""),button,{timeout:45000});}
    catch(error){throw new Error(`${m.user}: after the reload the dashboard button says "${await m.page.locator("#seasonPrimaryAction").textContent().catch(()=>"?")}", expected /${button}/`,{cause:error});}
    await m.page.locator("#seasonPrimaryAction").click({timeout:30000});
    await m.page.locator(landing).waitFor({state:"visible",timeout:30000});
  }
  return {firstScreens,frames:after.length,landed};
}

// r80: the Transfer Challenge's historical replay after a reload is tapped through (CONTINUE REPLAY, as in the two-manager journey
// J9.3) until CONTINUE TO SEASON RESULTS shows; returns the taps.
async function tapThroughReplayToSeasonResults(m){
  let replayTaps=0;
  if(await m.page.locator("#transferChallenge").isVisible().catch(()=>false)){
    const cont=m.page.getByRole("button",{name:"CONTINUE TO SEASON RESULTS",exact:true});
    for(let i=0;i<12&&!(await cont.isVisible().catch(()=>false));i++){
      const replay=m.page.locator("#continueFromTransfers");
      if(await replay.isVisible().catch(()=>false)&&await replay.isEnabled().catch(()=>false)&&!/SEASON RESULTS/.test(await replay.textContent())){await replay.click({timeout:10000}).catch(()=>{});replayTaps+=1;}
      await m.page.waitForTimeout(700);
    }
    await cont.click({timeout:30000});
    await m.page.locator("#seasonEntry").waitFor({state:"visible",timeout:30000});
  }
  return replayTaps;
}
// r80: the player moves to a fresh browser (same Google account, nothing stored): the old context is closed, a new one opens the
// app, signs in, and taps START / CONTINUE on Home until the live Showdown opens. Nothing is copied between the contexts.
async function moveToFreshBrowser(browser,managers,retired,old,label,viewport,{expectSession,expectSaveId,screens,button,landing}){
  retired.push(old);await old.context.close();
  const m=await openManager(browser,old.user,viewport);managers[managers.indexOf(old)]=m;
  assert.equal(await m.page.evaluate(()=>{try{return localStorage.length;}catch(_){return -1;}}),0,`${m.user}: the fresh browser starts with empty storage`);
  // Same Google account: the player was already chosen on the account, so the fresh browser may skip the player choice.
  await m.page.locator("#newShowdown").click();
  await m.page.getByRole("button",{name:"SIGN IN WITH GOOGLE"}).click({timeout:30000});
  const choose=m.page.getByRole("button",{name:new RegExp(`^${label} · PLAYER`,"i")});
  await m.page.waitForFunction(text=>document.getElementById("onlinePlayerIdentityBadge")?.textContent===text||[...document.querySelectorAll("button")].some(b=>b.offsetParent!==null&&/· PLAYER/i.test(b.textContent||"")),label.toUpperCase(),{timeout:30000});
  // The chooser can show for a moment and then close by itself once the account's player loads (seen in CI), so a click on it
  // may find it detached: tap it only while it is still there, until the badge names the player.
  const chosenBy=Date.now()+30000;
  while(await m.page.evaluate(()=>document.getElementById("onlinePlayerIdentityBadge")?.textContent||"")!==label.toUpperCase()){
    if(Date.now()>chosenBy)throw new Error(`${m.user}: the fresh browser never named the player ${label}: ${await describe(m)}`);
    if(await choose.isVisible().catch(()=>false))await choose.click({timeout:3000}).catch(()=>{});
    await m.page.waitForTimeout(500);
  }
  await m.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.initialized===true&&s.busy===false&&s.connectionState==="active");},null,{timeout:30000});
  const pair=await pairState(m);
  assert.equal(pair.status,"paired",`${m.user}: the fresh browser's pair read is paired (the shell was rebuilt), not ${pair.status}`);
  const deadline=Date.now()+45000;
  while(!await m.page.locator(screens).filter({visible:true}).first().isVisible().catch(()=>false)){
    if(Date.now()>deadline)throw new Error(`${m.user}: the fresh browser never opened the live Showdown: ${await describe(m)}`);
    if(await m.page.locator("#mainMenu").isVisible().catch(()=>false)&&await m.page.locator("#newShowdown").isEnabled().catch(()=>false))await m.page.locator("#newShowdown").click({timeout:5000}).catch(()=>{});
    await m.page.waitForTimeout(1000);
  }
  await m.page.waitForFunction(()=>window.CareerModeSparkRemoteJoining?.getState?.()?.sessionState==="active",null,{timeout:45000});
  assert.equal(await sessionOf(m),expectSession,`${m.user}: the fresh browser is in the same private session`);
  const saved=await showdownOf(m);
  assert.equal(saved&&saved.saveId,expectSaveId,`${m.user}: the fresh browser's active save is the pair link's exact save`);
  const library=await m.page.evaluate(()=>window.CareerModeSaveLibraryRuntime.getLibrarySnapshot());
  assert.equal(library.saves.length,1,`${m.user}: exactly one save was rebuilt`);
  assert.deepEqual(library.saves[0].showdown.sharedJourney,{contractVersion:1,mode:"shared",setupPending:true},`${m.user}: the rebuilt shell carries the shared marker`);
  if(await m.page.locator("#dashboard").isVisible().catch(()=>false)){
    await m.page.waitForFunction(re=>new RegExp(re).test(document.getElementById("seasonPrimaryAction")?.textContent||""),button,{timeout:45000});
    await m.page.locator("#seasonPrimaryAction").click({timeout:30000});
    await m.page.locator(landing).waitFor({state:"visible",timeout:30000});
  }
  return m;
}

async function assertCareerScreensShowCompletedShowdown(managers,id,{endedEarly=false}={}){
  const read=async(m,hostId,ready)=>{const deadline=Date.now()+20000;let text="";while(Date.now()<deadline){text=await m.page.evaluate(i=>{const h=document.getElementById(i);return h&&!h.classList.contains("hidden")?(h.innerText||"").replace(/\s+/g," ").trim():"";},hostId);if(text&&ready(text))return text;await m.page.waitForTimeout(250);}return text;};
  const bad=/unavailable|could not be read|could not be loaded|failed to|loading your showdown history|loading career history/i;
  for(const m of managers){
    const fail=(screen,text,why)=>new Error(`${id} ${m.user}: ${screen} ${why}. Screen text: ${text.slice(0,600)||"(screen did not appear)"}`);
    await backToShowdownHome(m);
    await m.page.locator("#careerStatisticsButton").click({timeout:20000});
    // The headline (COMPLETED SHOWDOWNS 1) is the count, also on the first visit after a reload (two mounts in a row
    // count up the same tiles; the count-up's target is the tile's data-count-value, never the 0 it starts from).
    const oneCompleted=t=>/(COMPLETED SHOWDOWNS\s*1(?!\d)|(?<![\d.])1\s*COMPLETED SHOWDOWNS)/i.test(t);
    let text=await read(m,"careerStatistics",t=>!bad.test(t)&&oneCompleted(t));
    if(bad.test(text)||!oneCompleted(text))throw fail("Career Statistics",text,"does not show COMPLETED SHOWDOWNS 1");
    await m.page.locator("#trophyRoomButton").click({timeout:20000});
    text=await read(m,"trophyRoom",t=>!bad.test(t)&&/Showdown Champion/i.test(t));
    if(bad.test(text)||!/Showdown Champion/i.test(text))throw fail("Trophy Room",text,"does not show the Showdown Champion trophy");
    const champions=()=>m.page.evaluate(()=>{const card=document.querySelector('#trophyRoom .trophyCard[data-trophy="showdown"]');const r=side=>{const el=card?.querySelector(`[data-side="${side}"] strong`);return el?(el.dataset.countValue||(el.textContent||"").trim()):null;};return {daniel:r("daniel"),nik:r("nik")};});
    let seen=await champions();const end=Date.now()+20000;
    while(seen.daniel!=="1"&&Date.now()<end){await m.page.waitForTimeout(250);seen=await champions();}
    if(seen.daniel!=="1"||seen.nik==="1")throw fail("Trophy Room",text,`does not award the Showdown Champion trophy to Daniel only (${JSON.stringify(seen)})`);
    await backToShowdownHome(m);
    await m.page.locator("#legacyButton").click({timeout:20000});
    text=await read(m,"legacy",t=>!bad.test(t)&&/Showdown #1\b/i.test(t));
    // r80: an Ended early Showdown (#2) is a status-only row, never a completed one.
    if(bad.test(text)||!/Showdown #1\b/i.test(text)||(endedEarly?/Showdown #3\b/i:/Showdown #2\b/i).test(text))throw fail("Legacy",text,`does not list exactly one completed Showdown (#1)${endedEarly?" and one Ended early Showdown (#2)":""}`);
    if(!/Daniel WINS/i.test(text))throw fail("Legacy",text,"does not show Daniel as the Showdown winner");
    await shot(m,`p7-legacy`);
    await backToShowdownHome(m);
  }
}
// ---------- r80 END SHOWDOWN helpers ----------
// A season that is not the last: Daniel's COMMIT & ACKNOWLEDGE, Nik's ACKNOWLEDGE, then both see the season's canonical score
// and Shared History; CONTINUE TO SEASON N then opens the next season's Transfer Challenge (as two-manager-browser-journey.cjs).
async function commitSeasonViaUi(daniel,nik,p1,p2,seasonNumber){
  await daniel.page.waitForFunction(()=>document.getElementById("sharedSeasonCommitAction")?.textContent==="LOCK & CONFIRM SEASON",null,{timeout:45000});
  await nik.page.waitForFunction(()=>/^(WAITING FOR DANIEL|CONFIRM SEASON)$/.test(document.getElementById("sharedSeasonCommitAction")?.textContent||""),null,{timeout:45000});
  await daniel.page.locator("#sharedSeasonCommitAction").click({timeout:30000});
  await daniel.page.waitForFunction(()=>/^(CONFIRMED ✓ · WAITING FOR RIVAL|SEASON CONFIRMED ✓)$/.test(document.getElementById("sharedSeasonCommitAction")?.textContent||""),null,{timeout:30000});
  await nik.page.waitForFunction(()=>document.getElementById("sharedSeasonCommitAction")?.textContent==="CONFIRM SEASON",null,{timeout:45000});
  await nik.page.locator("#sharedSeasonCommitAction").click({timeout:30000});
  for(const m of [daniel,nik]){
    await m.page.waitForFunction(()=>document.getElementById("sharedSeasonCommitAction")?.textContent==="SEASON CONFIRMED ✓",null,{timeout:45000});
    await m.page.waitForFunction(n=>{const s=window.CareerModeProductionSharedCanonicalScoring?.getState?.();return s?.phase==="SCORING_RECONCILED"&&s.seasonNumber===n;},seasonNumber,{timeout:60000});
    assert.equal((await m.page.locator("#sharedCanonicalScoringTotals").textContent()).trim(),`Daniel: ${p1} · Nik: ${p2}`,`${m.user}: season ${seasonNumber} canonical score`);
    await m.page.locator("#sharedHistoryConvergencePanel").waitFor({state:"visible",timeout:45000});
  }
}
async function continueToSeason(daniel,nik,season,total){
  for(const m of [daniel,nik]){
    await m.page.waitForFunction(next=>document.getElementById("sharedMultiSeasonContinueAction")?.textContent===`CONTINUE TO SEASON ${next}`,season,{timeout:45000});
    await m.page.locator("#sharedMultiSeasonContinueAction").click({timeout:30000});
    await m.page.waitForFunction(value=>document.getElementById("seasonIndicator")?.textContent===value,`Season ${season} / ${total}`,{timeout:30000});
    await rosterRoulette.waitForTransfer(m.page,30000);
  }
}
// One season's Transfer Challenge through the real UI: window, guesses, signings, then both open Season Results.
async function playTransferSeason(daniel,nik,tokenD,tokenN){
  await daniel.page.waitForFunction(()=>document.getElementById("startTransferTimer")&&!document.getElementById("startTransferTimer").classList.contains("hidden"),null,{timeout:30000});
  await daniel.page.locator("#startTransferTimer").click({timeout:30000});
  await waitTransferPhase(daniel,"window");await waitTransferPhase(nik,"window");
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
  await daniel.page.locator("#p1Signing1Name").fill(tokenD);await daniel.page.locator("#p1Signing1Overall").fill("71");await fillTransferCombo(daniel,"p1Signing1League","Premier League");await fillTransferCombo(daniel,"p1Signing1Nationality","England");
  await daniel.page.getByRole("button",{name:"LOCK MY SIGNINGS",exact:true}).click({timeout:30000});
  await daniel.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.signingLockedRoles?.includes("playerOne")===true,null,{timeout:30000});
  await waitTransferState(nik,"signingLockedRoles","playerOne");
  await nik.page.locator("#p2Signing1Name").fill(tokenN);await nik.page.locator("#p2Signing1Overall").fill("71");await fillTransferCombo(nik,"p2Signing1League","TIM Serie A");await fillTransferCombo(nik,"p2Signing1Nationality","Brazil");
  await nik.page.getByRole("button",{name:"LOCK MY SIGNINGS",exact:true}).click({timeout:30000});
  await waitTransferPhase(nik,"completed");await waitTransferPhase(daniel,"completed");
  for(const m of [daniel,nik]){
    await m.page.getByRole("button",{name:"CONTINUE TO SEASON RESULTS",exact:true}).click({timeout:30000});
    await m.page.locator("#seasonEntry").waitFor({state:"visible",timeout:30000});
  }
}
// The shared setup through the real UI (as P2, without its reload): league, clubs, both confirm, both start their careers.
async function playSetupToTransferChallenge(daniel,nik){
  for(const m of [daniel,nik])await m.page.locator("#leagueWheelScreen").waitFor({state:"visible",timeout:45000});
  await daniel.page.locator("#spinLeague").click({timeout:30000});
  await daniel.page.waitForFunction(()=>document.getElementById("spinLeague")?.textContent==="CONTINUE TO CLUB PACKS",null,{timeout:30000});
  for(const m of [daniel,nik])await m.page.locator("#clubWheelScreen").waitFor({state:"visible",timeout:30000});
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
    await rosterRoulette.waitForTransfer(m.page,45000);
    await m.page.locator("#productionSharedCareerStartOverlay").waitFor({state:"hidden",timeout:30000});
  }
  return clubs;
}
const noticeText=m=>m.page.evaluate(()=>{const n=document.getElementById("appRuntimeNotice");return n?{kind:n.className,text:(n.querySelector(".runtimeNoticeText")?.textContent||"").trim()}:null;});
// History (Legacy) cards as drawn: the Ended early rows (status-only cards) and the completed ones. Opening History
// keeps the last drawn frame while it reloads, so this waits for the reloaded frame with both kinds of row.
async function legacyCards(m){
  await backToShowdownHome(m);
  await m.page.locator("#legacyButton").click({timeout:20000});
  const deadline=Date.now()+20000;let cards=[];
  while(Date.now()<deadline){
    cards=await m.page.evaluate(()=>[...document.querySelectorAll("#legacy .legacyCard")].map(c=>({status:c.dataset.status,text:(c.textContent||"").replace(/\s+/g," ").trim()})));
    if(cards.some(c=>c.status==="completed")&&cards.some(c=>c.status==="abandoned"))break;
    await m.page.waitForTimeout(250);
  }
  await shot(m,"r80d-legacy");
  await backToShowdownHome(m);
  return cards;
}

function printMeter(label,w){
  const per=Object.entries(w.byUser).map(([u,v])=>`${u} ${v.reads}r/${v.writes}w`).join(", ");
  console.log(`METER ${label}: ${Math.round(w.ms/1000)} s, reads ${w.reads} (SDK document reads ${w.sdkReads} + listener deliveries ${w.listenReads}), writes ${w.writes} [${per}]; network: ${w.net.batchGetDocs} batchGet docs, ${w.net.commits} commits writing ${w.net.committedDocs} docs (+${w.net.verifies} verify entries); ${w.failedTransactions} transactions ended without commit (the budget layer's read-only reads end that way on purpose)`);
}


// ---------- r80 first-real-game helpers ----------
const DANIEL_RESULT={leaguePosition:1,leaguePoints:87,leagueGoals:93,domesticCup:false,championsLeague:true,topScorer:true,topAssist:false};
const NIK_RESULT={leaguePosition:2,leaguePoints:84,leagueGoals:101,domesticCup:true,championsLeague:false,topScorer:false,topAssist:true};
// One whole 1-season Showdown through the real UI (league, clubs, Transfer Challenge, Season Results, commit, automatic close).
async function playOneSeasonShowdown(daniel,nik,rivalryId,tokens){
  await playSetupToTransferChallenge(daniel,nik);
  await playTransferSeason(daniel,nik,tokens[0],tokens[1]);
  await fillSeasonResult(daniel,"p1",DANIEL_RESULT);await publishSeasonResult(daniel);
  await fillSeasonResult(nik,"p2",NIK_RESULT);await publishSeasonResult(nik);
  for(const m of [daniel,nik])await m.page.waitForFunction(()=>document.getElementById("seasonReviewHeading")?.textContent==="BOTH MANAGERS PUBLISHED",null,{timeout:45000});
  await commitFinalSeasonViaUi(daniel,nik,FINAL_EXPECTED.daniel,FINAL_EXPECTED.nik,1);
  for(const m of [daniel,nik]){
    await m.page.locator("#finalWinnerScreen").waitFor({state:"visible",timeout:60000});
    await m.page.waitForFunction(id=>{const s=window.CareerModeProductionSharedTerminalClose?.getState?.();return s?.phase==="CLOSED"&&s.rivalryId===id;},rivalryId,{timeout:60000});
  }
  const closed=await adminUntil(`rivalries/${rivalryId}`,doc=>field(doc,"data","connectionState")?.stringValue==="closed","closed");
  assert.ok(field(closed,"data","terminalClose"),`${rivalryId} is closed with its Terminal Close`);
}
const TWO_COMPLETED=/(COMPLETED SHOWDOWNS\s*2(?!\d)|(?<![\d.])2\s*COMPLETED SHOWDOWNS)/i;
// What the career screens show, from the screens themselves (taps only) plus the model they drew (read).
async function careerScreens(m){
  const read=async(hostId,ready)=>{const deadline=Date.now()+20000;let text="";while(Date.now()<deadline){text=await m.page.evaluate(i=>{const h=document.getElementById(i);return h&&!h.classList.contains("hidden")?(h.innerText||"").replace(/\s+/g," ").trim():"";},hostId);if(text&&ready(text))return text;await m.page.waitForTimeout(250);}return text;};
  const loaded=t=>!/loading/i.test(t);
  await backToShowdownHome(m);
  await m.page.locator("#legacyButton").click({timeout:20000});
  await read("legacy",t=>loaded(t)&&/Showdown #\d/i.test(t));
  await m.page.waitForTimeout(1200);
  const legacy=await m.page.evaluate(()=>[...document.querySelectorAll("#legacy .legacyCard")].map(c=>({status:c.dataset.status,text:(c.textContent||"").replace(/\s+/g," ").trim()})));
  const model=await m.page.evaluate(()=>{const v=window.CareerModeRivalryLegacyV10?.cachedCareerModel?.();return v?{status:v.status,rows:(v.history?.showdowns||[]).map(r=>({rivalryId:r.rivalryId,status:r.status,number:r.number}))}:null;});
  await shot(m,"h6-legacy");
  await backToShowdownHome(m);
  await m.page.locator("#careerStatisticsButton").click({timeout:20000});
  // The headline counts up from 0 to the tile's value, so the read waits for the value itself (bounded).
  const stats=await read("careerStatistics",t=>loaded(t)&&TWO_COMPLETED.test(t));
  await m.page.locator("#trophyRoomButton").click({timeout:20000});
  await read("trophyRoom",t=>loaded(t)&&/Showdown Champion/i.test(t));
  const champion=async()=>m.page.evaluate(()=>{const card=document.querySelector('#trophyRoom .trophyCard[data-trophy="showdown"]');const r=side=>{const el=card?.querySelector(`[data-side="${side}"] strong`);return el?(el.dataset.countValue||(el.textContent||"").trim()):null;};return {daniel:r("daniel"),nik:r("nik")};});
  let trophies=await champion();const end=Date.now()+20000;while(trophies.daniel!=="2"&&Date.now()<end){await m.page.waitForTimeout(250);trophies=await champion();}
  await backToShowdownHome(m);
  return {legacy,model,stats,trophies};
}
async function assertBothGamesShown(managers,games,leftover,label){
  for(const m of managers){
    const v=await careerScreens(m);
    const completed=v.legacy.filter(c=>c.status==="completed");
    assert.equal(completed.length,2,`${label} ${m.user}: Legacy lists both finished games ${JSON.stringify(v.legacy).slice(0,600)}`);
    assert.deepEqual(v.model&&v.model.rows.filter(r=>r.status==="completed").map(r=>r.rivalryId),games,`${label} ${m.user}: History holds the game r79 hid, then the real one`);
    assert.ok(!v.model.rows.some(r=>r.rivalryId===leftover),`${label} ${m.user}: the leftover code never shows`);
    assert.match(v.stats,TWO_COMPLETED,`${label} ${m.user}: Career Statistics counts both: ${v.stats.slice(0,300)}`);
    assert.equal(v.trophies.daniel,"2",`${label} ${m.user}: the Trophy Room has both Showdown Champion trophies (Daniel won both) ${JSON.stringify(v.trophies)}`);
    assert.ok(!/^[1-9]/.test(String(v.trophies.nik)),`${label} ${m.user}: and none for Nik ${JSON.stringify(v.trophies)}`);
  }
}
// The markers r79 wrote for Nik and Daniel were made on 2026-10-18 after 17:17:45 UTC; r80 shows the leaked game again only for
// markers made before its cutoff (js/careerStartMarker.js R80_PREVENTION_MS, 2026-10-19 12:00 UTC).
const R79_MARKER_MS=Date.UTC(2026,9,18,20,0,0),R80_CUTOFF_MS=Date.UTC(2026,9,19,12,0,0);
async function setMarkerStartedAt(uid,ms){
  const before=await admin(`accounts/${uid}/careerStart/current`);assert.ok(before,`${uid} has a marker`);
  const url=`${docUrl(`accounts/${uid}/careerStart/current`)}?updateMask.fieldPaths=data.startedAt`;
  const r=await fetch(url,{method:"PATCH",headers:{Authorization:"Bearer owner","content-type":"application/json"},body:JSON.stringify({fields:{data:{mapValue:{fields:{startedAt:{timestampValue:new Date(ms).toISOString()}}}}}})});
  assert.equal(r.status,200,`the marker's startedAt is set to an r79 time (${r.status})`);
  assert.deepEqual(ids(field(await admin(`accounts/${uid}/careerStart/current`),"data","hiddenRivalryIds")),ids(field(before,"data","hiddenRivalryIds")),"only startedAt changed");
}

async function main(){
  assert.equal(JSON.parse(fs.readFileSync(path.join(SDK_DIR,"package.json"),"utf8")).version,require(SWITCH).sdkVersion,"SDK pin matches the switch");
  await loadComposedRules();ok("H0.1","composed production Rules active on the emulator");
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
    const uidD=await accountId(daniel),uidN=await accountId(nik);
    assert.ok(uidD&&uidN&&uidD!==uidN,"two distinct accounts");
    ok("H0.2","Daniel and Nik signed in on the emulators; neither has started the real career");

    // ---------- H1 the game r79 left behind ----------
    await daniel.page.locator("#newShowdown").click({timeout:30000});
    await daniel.page.locator("#createShowdown").waitFor({state:"visible",timeout:30000});
    await daniel.page.locator("#roundAmount").selectOption("1");
    await daniel.page.locator("#startShowdown").click({timeout:30000});
    await pairPanel(daniel).locator("code").waitFor({timeout:30000});
    const gameCode=(await pairPanel(daniel).locator("code").innerText()).trim();
    assert.match(gameCode,/^CMS17R-pair_[0-9a-f]{64}$/,"the current UI creates a real first-pairing code");
    const G=gameCode.slice("CMS17R-".length);
    await backToShowdownHome(nik);
    await nik.page.locator("#newShowdown").click({timeout:30000});
    await pairPanel(nik).locator("#persistentNikDanielPairCode").waitFor({state:"visible",timeout:30000});
    await pairPanel(nik).locator("#persistentNikDanielPairCode").fill(gameCode);
    await pairPanel(nik).getByRole("button",{name:"JOIN DANIEL'S SHOWDOWN",exact:true}).click();
    await bothActive([daniel,nik],G);
    await playOneSeasonShowdown(daniel,nik,G,["QWX Daniel Signing","ZPV Nik Signing"]);
    for(const m of managers)await backToShowdownHome(m);
    // The completed real gameplay supplies the same stored shape as r79's leaked game. Restore only historical
    // account metadata, through emulator admin, so the migration assertions below still exercise both old markers.
    await restoreHistoricalMarkerlessAccounts(managers,{firestorePort:FIRESTORE_PORT});
    for(const m of managers){await m.page.reload({waitUntil:"domcontentloaded"});await m.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});}
    for(const uid of [uidD,uidN])assert.equal(await admin(`accounts/${uid}/careerStart/current`),null,"no marker yet");
    ok("H1",`the game r79's leak left behind: ${G.slice(0,14)}… played to the end by both, then restored as historical markerless data`);

    // ---------- H2 Daniel's leftover code, then a reload ----------
    await daniel.page.locator("#newShowdown").click({timeout:30000});
    await daniel.page.locator("#createShowdown").waitFor({state:"visible",timeout:30000});
    await daniel.page.locator("#roundAmount").selectOption("1");
    await daniel.page.locator("#startShowdown").click({timeout:30000});
    await pairPanel(daniel).locator("code").waitFor({timeout:30000});
    const currentCode=(await pairPanel(daniel).locator("code").innerText()).trim();
    assert.match(currentCode,/^CMS17R-pair_[0-9a-f]{64}$/);
    // Restore an unused markerless code left by an old release; the current UI cannot create one.
    await restoreHistoricalMarkerlessAccounts([daniel],{firestorePort:FIRESTORE_PORT});
    const leftoverCode=currentCode.replace("CMS17R-","CMS17-");
    const L=leftoverCode.slice("CMS17-".length);
    const leftoverInvite=await admin(`rivalries/${L}/invites/${L}`);
    const leftoverExpires=Date.parse(field(leftoverInvite,"data","expiresAt").timestampValue);
    assert.equal(field(leftoverInvite,"data","state").stringValue,"open");assert.ok(leftoverExpires>Date.now()+10*60_000,"the leftover code is open and unexpired");
    await daniel.page.reload({waitUntil:"domcontentloaded"});
    await daniel.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
    await daniel.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.initialized===true&&s.busy===false);},null,{timeout:30000});
    await daniel.page.waitForTimeout(4000);
    assert.equal((await pairState(daniel)).rivalryId,L,"the leftover is still Daniel's open (pending) pairing");
    assert.equal(await pairPanel(daniel).locator("code").isVisible().catch(()=>false),false,"no WAITING with the leftover test code after the reload");
    assert.equal(await daniel.page.locator("#mainMenu").isVisible(),true,"Daniel is on Home");
    const tile=await homeTile(daniel);
    ok("H2",`the leftover CMS17- code (unexpired, never used) is not reopened after the reload (Home tile ${JSON.stringify(tile)})`);

    // ---------- H3 Daniel's Home START: automatic marker, then a new real code ----------
    // Every code the pair panel ever shows on screen from here on is recorded (no flash of the leftover code while the new one is made).
    await daniel.page.evaluate(()=>{window.__h3Codes=[];const seen=()=>{for(const c of document.querySelectorAll("#connectPlayersScreen #persistentNikDanielPairPanel code")){const t=(c.textContent||"").trim(),shown=c.getClientRects().length>0&&getComputedStyle(c).visibility!=="hidden";if(t&&shown&&!window.__h3Codes.includes(t))window.__h3Codes.push(t);}};new MutationObserver(seen).observe(document.body,{subtree:true,childList:true,characterData:true});seen();});
    assert.ok(leftoverExpires>Date.now()+60_000,"the leftover is still unexpired when START is pressed (Nik could still join it)");
    await danielStartsShowdown(daniel,1,{firstRealStart:true});
    await daniel.page.waitForFunction(()=>/^CMS17R-/.test((document.querySelector("#connectPlayersScreen #persistentNikDanielPairPanel code")?.textContent||"").trim()),null,{timeout:30000});
    const code1=(await pairPanel(daniel).locator("code").innerText()).trim();
    assert.match(code1,/^CMS17R-pair_[0-9a-f]{64}$/,"the first real pairing code (not the leftover test code)");
    assert.deepEqual(await daniel.page.evaluate(()=>window.__h3Codes),[code1],"WAITING only ever showed the new real code (the leftover test code never flashed)");
    const R=code1.slice("CMS17R-".length);
    assert.notEqual(R,L);assert.notEqual(R,G);
    const markerD=await admin(`accounts/${uidD}/careerStart/current`);
    assert.ok(markerD,"START wrote Daniel's marker");
    const hiddenD=ids(field(markerD,"data","hiddenRivalryIds"));
    assert.ok(hiddenD.includes(G)&&hiddenD.includes(L)&&!hiddenD.includes(R),`Daniel's marker names the finished game and the leftover, not the new one: ${JSON.stringify(hiddenD)}`);
    assert.equal(field(await admin(`accounts/${uidD}/pairLinks/current`),"data","rivalryId").stringValue,R,"Daniel's pairing is the new real one");
    const leftoverAfter=await admin(`rivalries/${L}`);
    assert.equal(field(leftoverAfter,"data","connectionState").stringValue,"closed","the leftover code was closed before the marker (nobody can join it any more)");
    assert.equal(field(leftoverAfter,"data","terminalClose"),undefined,"closed without a Terminal Close (an unused code, never a finished game)");
    ok("H3","Home START opened the seasons screen (no checkmark); its START closed the unexpired leftover, wrote the marker, then made a new CMS17R- code");

    // ---------- H3b Nik types the leftover code ----------
    await backToShowdownHome(nik);
    await nik.page.locator("#newShowdown").click({timeout:30000});
    await pairPanel(nik).locator("#persistentNikDanielPairCode").waitFor({state:"visible",timeout:30000});
    // The real prefix reaches the closed-capability check; plain legacy codes are refused even before that check.
    await pairPanel(nik).locator("#persistentNikDanielPairCode").fill(leftoverCode.replace("CMS17-","CMS17R-"));
    await pairPanel(nik).getByRole("button",{name:"JOIN DANIEL'S SHOWDOWN",exact:true}).click();
    await nik.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.busy===false&&s.status!=="joining");},null,{timeout:30000});
    await nik.page.waitForTimeout(1500);
    const refused=await pairState(nik);
    assert.notEqual(refused&&refused.connectionState,"active",`Nik could not join the closed leftover ${JSON.stringify(refused)}`);
    assert.equal(field(await admin(`rivalries/${L}`),"data","connectionState").stringValue,"closed","the leftover stays closed");
    assert.equal(await admin(`accounts/${uidN}/careerStart/current`),null,"no marker for Nik from that attempt");
    const refusedText=(await pairPanel(nik).innerText().catch(()=>"")).replace(/\s+/g," ").slice(0,240);
    await nik.page.reload({waitUntil:"domcontentloaded"});
    await nik.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
    await nik.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.initialized===true&&s.busy===false);},null,{timeout:30000});
    ok("H3b",`Nik's join of the closed leftover was refused ("${refusedText}"); Nik reloads`);

    // ---------- H4 Nik types the code once ----------
    await nik.page.locator("#newShowdown").click();
    await nik.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.busy===false);},null,{timeout:30000});
    await pairPanel(nik).locator("#persistentNikDanielPairCode").waitFor({state:"visible",timeout:30000});
    await pairPanel(nik).locator("#persistentNikDanielPairCode").fill(code1);
    await pairPanel(nik).getByRole("button",{name:"JOIN DANIEL'S SHOWDOWN",exact:true}).click();
    await bothActive([daniel,nik],R);
    const markerN=await admin(`accounts/${uidN}/careerStart/current`);
    assert.ok(markerN,"Nik's real join wrote his marker");
    const hiddenN=ids(field(markerN,"data","hiddenRivalryIds"));
    assert.ok(hiddenN.includes(G)&&!hiddenN.includes(R),`Nik's marker names the finished game, not the new one: ${JSON.stringify(hiddenN)}`);
    for(const m of managers)assert.ok(!(await m.page.locator("#onlinePlayerIdentityBadge").textContent()).includes("TEST RUN"),`${m.user}: the real game is not a test run`);
    // Stand-in (see the top): the markers r79 wrote carry an r79 startedAt; this run's own press time may be after r80's cutoff.
    for(const uid of [uidD,uidN])await setMarkerStartedAt(uid,R79_MARKER_MS);
    ok("H4","Nik typed the code once and joined; both markers name the finished game; no TEST RUN badge");

    // ---------- H5 the real game ----------
    await playOneSeasonShowdown(daniel,nik,R,["QWY Daniel Real","ZPW Nik Real"]);
    ok("H5","the real 1-season Showdown was played to the end and closed by itself");

    // ---------- H6 History, Career Statistics, Trophy Room ----------
    // Each page still holds the marker it wrote, with this run's own press time. Before r80's cutoff that is an r79-window
    // marker, so the screens are checked right away; after it, the pages read the (r79-dated) markers again first.
    const pressedAfterCutoff=Date.now()>=R80_CUTOFF_MS;
    if(pressedAfterCutoff)for(const m of managers){await m.page.reload({waitUntil:"domcontentloaded"});await m.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});await m.page.waitForTimeout(2000);}
    await assertBothGamesShown(managers,[G,R],L,"H6.1");
    ok("H6.1",`History (Legacy), Career Statistics and the Trophy Room show both finished games on both phones; the leftover never shows${pressedAfterCutoff?" (after a reload: this run is past r80's cutoff)":""}`);
    for(const m of managers){await m.page.reload({waitUntil:"domcontentloaded"});await m.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});await m.page.waitForTimeout(2000);}
    await assertBothGamesShown(managers,[G,R],L,"H6.2");
    for(const uid of [uidD,uidN])assert.deepEqual(ids(field(await admin(`accounts/${uid}/careerStart/current`),"data","hiddenRivalryIds")),uid===uidD?hiddenD:hiddenN,"the markers are unchanged (nothing rewritten)");
    ok("H6.2","the same after both reload; both markers unchanged");

    for(const m of managers){
      assert.deepEqual(m.log.forbidden,[],`${m.user} never contacted a production Firebase host`);
      assert.equal(m.log.productionRuntime,0,`${m.user} never loaded the production runtime`);
      assert.deepEqual(m.log.errors,[],`${m.user} page errors`);
    }
    ok("HZ","no production Firebase host, no production runtime and no page errors in either context");
    console.log(`PASS r80 first real game history audit: ${checks} checks; screenshots in ${SHOTS}`);
  }catch(error){
    for(const m of managers){
      console.log(`--- ${m.user}: ${await describe(m).catch(e=>e.message)} tile=${JSON.stringify(await homeTile(m).catch(()=>null))} pair=${JSON.stringify(await pairState(m).catch(()=>null))}`);
      console.log(`--- ${m.user} errors: ${JSON.stringify(m.log.errors.slice(-10))}`);
      await shot(m,"failure");
    }
    throw error;
  }finally{
    await browser.close();server.kill();
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});

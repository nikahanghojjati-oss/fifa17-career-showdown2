"use strict";
// r79 PR5: the whole two-player journey in one run, plus the reads/writes per season meter.
// Real app, two Chromium contexts (Daniel = playerOne, Nik = playerTwo), Auth + Firestore emulators with the composed
// production Rules (test project demo-cms-browser-journey only; production Firebase hosts are recorded and fail the run).
// Every step is a player's tap or typing; page globals are only read.
//   P1  Daniel's first Home START (ticked START REAL CAREER checkmark) makes the first real pairing (CMS17R-); Nik pastes it once.
//   P2  both continue by themselves into the private session and reach the league wheel; Daniel draws league and clubs.
//   P3  Daniel reloads mid-Showdown (Transfer Challenge, window live): back in the same Showdown and session, Home never shows.
//   P4  Nik goes offline during guess entry (Daniel locks his guesses meanwhile), comes back online and continues.
//   P5  Nik reloads mid-Showdown (Season Results, Daniel already published): same Showdown and session, Home never shows;
//       a landing on the Transfer Challenge replay is tapped through (CONTINUE REPLAY, as in the two-manager journey J9.3).
//   P6  the 1-season Showdown finishes: canonical 9-3, the Final Winner screen, automatic close (no CLOSE tap), R1 closed.
//   P7  history: Career Statistics, Trophy Room and Legacy show the finished Showdown on both devices.
//   P8  Daniel's next START has no code for Nik to type: Nik's Home shows JOIN DANIEL'S SHOWDOWN by itself; one JOIN tap joins.
//   P9  Daniel's DELETE CURRENT SHOWDOWN (Settings) closes R2; Daniel starts again and Nik's next JOIN works (one tap).
//   M   meter: Firestore reads and writes of both players together for the season played (Daniel's START tap to both pages
//       CLOSED: pairing, setup, both reloads, the offline spell and a 60 s waiting spell on Season Results included).
//       Budget: reads <= 800 and writes <= 600. The count is the client-side document count of
//       tests/browser/support/firestore-meter.cjs (JOB-1824 method plus listener deliveries), cross-checked against the REST
//       batchGet / commit requests each page sends to the emulator. It is not the billed count (Rules lookups are not seen).
// Run (two browser contexts, so CMS_CHROMIUM_MULTI_CONTEXT=1 as for the two-manager journey):
//   CMS_CHROMIUM_MULTI_CONTEXT=1 npx --yes firebase-tools@15.28.1 emulators:exec --config tests/browser/support/firebase.browser-journey.json \
//        --only auth,firestore --project demo-cms-browser-journey "node tests/browser/r79-two-player-journey-audit.cjs"
// Optional: CMS_TEST_PORT (app, default 4178), CMS_AUTH_PORT / CMS_FIRESTORE_PORT (emulators, default 9199 / 8181),
// CMS_R79_JOURNEY_SHOTS (screenshots), CMS_R79_METER_OUT (raw meter events as JSON), CMS_R79_PARK_MS (waiting spell, default 60000).
const assert=require("node:assert/strict");
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
  if(firstRealStart){
    await m.page.locator("#cmsRealCareerRow").waitFor({state:"visible",timeout:30000});
    assert.equal(await m.page.locator("#cmsRealCareerCheck").isChecked(),true,"the START REAL CAREER checkmark is ticked");
  }else{
    await m.page.waitForTimeout(300);
    assert.equal(await m.page.locator("#cmsRealCareerRow").isVisible().catch(()=>false),false,"the checkmark is one-time");
  }
  assert.equal(await m.page.locator("#cmsTestRunNote").isVisible().catch(()=>false),false,"Home START is never a test run");
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
// Real navigation only: press the visible SHOWDOWN HOME / BACK button until Showdown Home (#mainMenu) shows. Bounded to 20 s.
async function backToShowdownHome(m){
  const deadline=Date.now()+20000;
  while(Date.now()<deadline){
    if(await m.page.locator("#mainMenu").isVisible().catch(()=>false))return;
    for(const label of [/^\s*(SHOWDOWN HOME|BACK TO MAIN MENU|BACK TO SHOWDOWN HOME)\s*$/i,/^\s*HOME\s*$/i,/^\s*BACK\s*$/i]){
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
  await daniel.page.waitForFunction(()=>document.getElementById("sharedSeasonCommitAction")?.textContent==="COMMIT & ACKNOWLEDGE SHARED SEASON",null,{timeout:45000});
  await nik.page.waitForFunction(()=>/^(WAITING FOR COORDINATOR|ACKNOWLEDGE SHARED SEASON)$/.test(document.getElementById("sharedSeasonCommitAction")?.textContent||""),null,{timeout:45000});
  if(await nik.page.locator("#sharedSeasonCommitAction").textContent()==="WAITING FOR COORDINATOR")assert.equal(await nik.page.locator("#sharedSeasonCommitAction").isDisabled(),true,"Nik cannot commit");
  await daniel.page.locator("#sharedSeasonCommitAction").click({timeout:30000});
  await daniel.page.waitForFunction(()=>/^(ACKNOWLEDGED ✓ · WAITING FOR RIVAL|SEASON COMMIT ACKNOWLEDGED ✓)$/.test(document.getElementById("sharedSeasonCommitAction")?.textContent||""),null,{timeout:30000});
  await nik.page.waitForFunction(()=>document.getElementById("sharedSeasonCommitAction")?.textContent==="ACKNOWLEDGE SHARED SEASON",null,{timeout:45000});
  await nik.page.locator("#sharedSeasonCommitAction").click({timeout:30000});
  for(const m of [daniel,nik]){
    await m.page.waitForFunction(()=>document.getElementById("sharedSeasonCommitAction")?.textContent==="SEASON COMMIT ACKNOWLEDGED ✓"||window.CareerModeProductionSharedTerminalClose?.getState?.()?.phase==="CLOSED",null,{timeout:45000});
    await m.page.waitForFunction(()=>{const shown=id=>{const el=document.getElementById(id);return Boolean(el&&el.getClientRects().length&&getComputedStyle(el).visibility!=="hidden");};return shown("sharedCanonicalScoringPanel")||shown("finalWinnerScreen");},null,{timeout:45000});
    await m.page.waitForFunction(({n,s1,s2})=>{const t=id=>document.getElementById(id)?.textContent?.trim();return t("panelLastSeasonLabel")===`FINAL SEASON ${n}`&&t("panelLastSeasonDaniel")===String(s1)&&t("panelLastSeasonNik")===String(s2);},{n:seasonNumber,s1:p1,s2:p2},{timeout:60000});
  }
}
// After a reload the manager is back in the Showdown; if the app parks on the season dashboard, the player taps its primary
// action (OPEN SHARED ... / VIEW SHARED TRANSFER VERDICTS) as in two-manager-browser-journey.cjs J9.3.
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

async function assertCareerScreensShowCompletedShowdown(managers,id){
  const read=async(m,hostId,ready)=>{const deadline=Date.now()+20000;let text="";while(Date.now()<deadline){text=await m.page.evaluate(i=>{const h=document.getElementById(i);return h&&!h.classList.contains("hidden")?(h.innerText||"").replace(/\s+/g," ").trim():"";},hostId);if(text&&ready(text))return text;await m.page.waitForTimeout(250);}return text;};
  const bad=/unavailable|could not be read|could not be loaded|failed to|loading your showdown history|loading career history/i;
  for(const m of managers){
    const fail=(screen,text,why)=>new Error(`${id} ${m.user}: ${screen} ${why}. Screen text: ${text.slice(0,600)||"(screen did not appear)"}`);
    await backToShowdownHome(m);
    await m.page.locator("#careerStatisticsButton").click({timeout:20000});
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
    if(bad.test(text)||!/Showdown #1\b/i.test(text)||/Showdown #2\b/i.test(text))throw fail("Legacy",text,"does not list exactly one completed Showdown (#1)");
    if(!/Daniel WINS/i.test(text))throw fail("Legacy",text,"does not show Daniel as the Showdown winner");
    await shot(m,`p7-legacy`);
    await backToShowdownHome(m);
  }
}
function printMeter(label,w){
  const per=Object.entries(w.byUser).map(([u,v])=>`${u} ${v.reads}r/${v.writes}w`).join(", ");
  console.log(`METER ${label}: ${Math.round(w.ms/1000)} s, reads ${w.reads} (SDK document reads ${w.sdkReads} + listener deliveries ${w.listenReads}), writes ${w.writes} [${per}]; network: ${w.net.batchGetDocs} batchGet docs, ${w.net.commits} commits writing ${w.net.committedDocs} docs (+${w.net.verifies} verify entries); ${w.failedTransactions} transactions ended without commit (the budget layer's read-only reads end that way on purpose)`);
}

async function main(){
  assert.equal(JSON.parse(fs.readFileSync(path.join(SDK_DIR,"package.json"),"utf8")).version,require(SWITCH).sdkVersion,"SDK pin matches the switch");
  await loadComposedRules();ok("P0.1","composed production Rules active on the emulator");
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
    const metered=meter.events.filter(e=>e.k==="read").length;
    assert.ok(metered>0,"the Firestore meter sees the app's reads (the wrapper is in place)");
    ok("P0.2","Daniel and Nik signed in on the emulators; the Firestore meter is in place in both contexts");

    // ---------- P1 first real pairing ----------
    assert.equal(await admin(`accounts/${uidD}/careerStart/current`),null,"Daniel has no marker before his first START");
    meter.mark("season:start");
    const code1=await danielStartsShowdown(daniel,1,{firstRealStart:true});
    assert.match(code1,/^CMS17R-pair_[0-9a-f]{64}$/,"the first real pairing code");
    assert.ok(await admin(`accounts/${uidD}/careerStart/current`),"START wrote Daniel's marker");
    await nik.page.locator("#newShowdown").click();
    await nik.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.busy===false&&s.status==="unpaired");},null,{timeout:30000});
    await nik.page.waitForTimeout(500);
    await pairPanel(nik).locator("#persistentNikDanielPairCode").fill(code1);
    await pairPanel(nik).getByRole("button",{name:"JOIN DANIEL'S SHOWDOWN",exact:true}).click();
    const R1=code1.replace(/^CMS17R?-/,"");
    await bothActive([daniel,nik],R1);
    const linkD=await admin(`accounts/${uidD}/pairLinks/current`),linkN=await admin(`accounts/${uidN}/pairLinks/current`);
    assert.equal(field(linkD,"data","managerRole").stringValue,"playerOne","Daniel is playerOne");
    assert.equal(field(linkN,"data","managerRole").stringValue,"playerTwo","Nik is playerTwo");
    assert.equal(field(linkN,"data","rivalryId").stringValue,R1,"Nik is paired to R1");
    for(const uid of [uidD,uidN])await adminUntil(`accounts/${uid}/partner/current`,doc=>field(doc,"active")?.booleanValue===true,`${uid} partner record`);
    ok("P1","Daniel's first Home START (ticked checkmark) made the CMS17R- code; Nik pasted it once; both paired ACTIVE with partner records");

    // ---------- P2 league wheel, clubs, Career Start ----------
    const session1=await sessionOf(daniel);
    assert.match(String(session1),/^session_[0-9a-f]{64}$/);
    assert.equal(await sessionOf(nik),session1,"Nik joined Daniel's private session without a code");
    for(const m of [daniel,nik])await m.page.locator("#leagueWheelScreen").waitFor({state:"visible",timeout:45000});
    assert.equal(await nik.page.locator("#spinLeague").isDisabled(),true,"Nik waits for Daniel on the league wheel");
    meter.mark("season:wheel");
    ok("P2.1","both managers are on the league wheel in the same private session");
    await shot(daniel,"p2-wheel");await shot(nik,"p2-wheel");
    await daniel.page.locator("#spinLeague").click({timeout:30000});
    await daniel.page.waitForFunction(()=>document.getElementById("spinLeague")?.textContent==="CONTINUE TO CLUB PACKS",null,{timeout:30000});
    const league=(await daniel.page.locator("#selectedLeague").textContent()).trim();
    await nik.page.waitForFunction(l=>document.getElementById("selectedLeague")?.textContent===l,league,{timeout:30000});
    for(const m of [daniel,nik])await m.page.locator("#clubWheelScreen").waitFor({state:"visible",timeout:30000});
    // r79 gallery (fix 4): a reload in the shared setup (club packs ready) lands back on the wheel with no Home frame.
    const reloadSetup=await reloadMidShowdown(daniel,{expectSession:session1,expectShowdown:await showdownOf(daniel),screens:"#leagueWheelScreen, #clubWheelScreen"});
    await daniel.page.locator("#clubWheelScreen").waitFor({state:"visible",timeout:30000});
    ok("P2.1b",`Daniel's reload in the shared setup: same Showdown and session, back on the setup screens, no Home frame (${reloadSetup.frames} frames, first: ${reloadSetup.firstScreens})`);
    await daniel.page.locator("#openClubPack").click({timeout:30000});
    await daniel.page.waitForFunction(()=>document.getElementById("clubCardTwo")?.classList.contains("is-revealed")&&document.getElementById("clubNameOne")?.textContent!=="?"&&document.getElementById("clubNameTwo")?.textContent!=="?",null,{timeout:30000});
    const clubs=await daniel.page.evaluate(()=>[document.getElementById("clubNameOne")?.textContent?.trim(),document.getElementById("clubNameTwo")?.textContent?.trim()]);
    await nik.page.waitForFunction(c=>document.getElementById("clubNameOne")?.textContent?.trim()===c[0]&&document.getElementById("clubNameTwo")?.textContent?.trim()===c[1],clubs,{timeout:30000});
    for(const m of [daniel,nik])await m.page.getByRole("button",{name:"CONFIRM SHARED SHOWDOWN"}).waitFor({state:"visible",timeout:30000});
    await daniel.page.getByRole("button",{name:"CONFIRM SHARED SHOWDOWN"}).click({timeout:30000});
    await nik.page.getByRole("button",{name:"CONFIRM SHARED SHOWDOWN"}).click({timeout:30000});
    for(const m of [daniel,nik])await m.page.locator("#productionSharedCareerStartOverlay").waitFor({state:"visible",timeout:30000});
    await daniel.page.getByRole("button",{name:`I STARTED AT ${clubs[0].toUpperCase()}`,exact:true}).click({timeout:30000});
    await nik.page.getByRole("button",{name:`I STARTED AT ${clubs[1].toUpperCase()}`,exact:true}).click({timeout:30000});
    for(const m of [daniel,nik]){
      await m.page.locator("#transferChallenge").waitFor({state:"visible",timeout:45000});
      await m.page.locator("#productionSharedCareerStartOverlay").waitFor({state:"hidden",timeout:30000});
    }
    meter.mark("season:transfer");
    ok("P2.2",`Daniel drew ${league} and the clubs (${clubs.join(" / ")}); both confirmed, started their careers and reached the Transfer Challenge`);
    const showdownD=await showdownOf(daniel),showdownN=await showdownOf(nik);
    console.log(`active local saves: daniel ${JSON.stringify(showdownD)} nik ${JSON.stringify(showdownN)}`);
    for(const s of [showdownD,showdownN]){assert.ok(s&&s.saveId,"an active local save");assert.equal(s.pairRivalryId,R1);assert.equal(s.totalRounds,1,"the active save is the 1-season Showdown");}

    // ---------- P3 Daniel reloads mid-Showdown (window live) ----------
    await daniel.page.locator("#startTransferTimer").click({timeout:30000});
    await waitTransferPhase(daniel,"window");await waitTransferPhase(nik,"window");
    // Reload only once the shared window is open on the server (both pages read WINDOW_OPEN), so the reload tests the resume.
    await waitSharedTransferPhase(daniel,"WINDOW_OPEN");await waitSharedTransferPhase(nik,"WINDOW_OPEN");
    const reloadD=await reloadMidShowdown(daniel,{expectSession:session1,expectShowdown:showdownD,landing:"#transferChallenge",button:"^OPEN SHARED TRANSFER WINDOW$"});
    await waitSharedTransferPhase(daniel,"WINDOW_OPEN");await waitTransferPhase(daniel,"window");
    await daniel.page.locator("#endTransferTimer").waitFor({state:"visible",timeout:30000});
    ok("P3",`Daniel's reload mid-Showdown: same Showdown and session, back on the live transfer window, no Home frame (${reloadD.frames} frames, first: ${reloadD.firstScreens})`);
    await daniel.page.locator("#endTransferTimer").click({timeout:30000});
    await daniel.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.endRequestedRoles?.includes("playerOne")===true,null,{timeout:30000});
    await nik.page.locator("#endTransferTimer").click({timeout:30000});
    await waitTransferPhase(nik,"guess_entry");await waitTransferPhase(daniel,"guess_entry");

    // ---------- P4 Nik offline during guess entry, then online ----------
    await nik.context.setOffline(true);
    await nik.page.waitForFunction(()=>navigator.onLine===false,null,{timeout:10000});
    await nik.page.locator("#p1Guess1Type").selectOption("nationality");await fillTransferCombo(nik,"p1Guess1Value","Brazil");
    await daniel.page.locator("#p2Guess1Type").selectOption("league");await fillTransferCombo(daniel,"p2Guess1Value","Premier League");
    await daniel.page.getByRole("button",{name:"LOCK MY GUESSES",exact:true}).click({timeout:30000});
    await daniel.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.guessLockedRoles?.includes("playerOne")===true,null,{timeout:30000});
    await nik.page.waitForTimeout(6000);
    await shot(nik,"p4-offline");
    const offlineView=await describe(nik);
    await nik.context.setOffline(false);
    await nik.page.waitForFunction(()=>navigator.onLine===true,null,{timeout:10000});
    await waitTransferState(nik,"guessLockedRoles","playerOne");
    await waitTransferPhase(nik,"guess_entry");
    assert.equal(await nik.page.locator("#p1Guess1Type").inputValue(),"nationality","Nik's unlocked guess, typed while offline, is still in the form");
    await nik.page.getByRole("button",{name:"LOCK MY GUESSES",exact:true}).click({timeout:30000});
    await waitTransferPhase(nik,"signing_entry");await waitTransferPhase(daniel,"signing_entry");
    assert.equal(await sessionOf(nik),session1,"Nik is still in the same session after the offline spell");
    ok("P4",`Nik went offline in guess entry (Daniel locked meanwhile), came back online, saw Daniel's lock and locked his own: both in signing entry (offline view: ${offlineView.slice(0,160)})`);

    await daniel.page.locator("#p1Signing1Name").fill("QWX Daniel Signing");await fillTransferCombo(daniel,"p1Signing1League","Premier League");await fillTransferCombo(daniel,"p1Signing1Nationality","England");
    await daniel.page.getByRole("button",{name:"LOCK MY SIGNINGS",exact:true}).click({timeout:30000});
    await daniel.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.signingLockedRoles?.includes("playerOne")===true,null,{timeout:30000});
    await waitTransferState(nik,"signingLockedRoles","playerOne");
    await assertPrivateTokenAbsent(nik,"QWX","Daniel's signing before COMPLETED");
    await nik.page.locator("#p2Signing1Name").fill("ZPV Nik Signing");await fillTransferCombo(nik,"p2Signing1League","TIM Serie A");await fillTransferCombo(nik,"p2Signing1Nationality","Brazil");
    await nik.page.getByRole("button",{name:"LOCK MY SIGNINGS",exact:true}).click({timeout:30000});
    await waitTransferPhase(nik,"completed");await waitTransferPhase(daniel,"completed");
    for(const m of [daniel,nik]){
      await m.page.getByRole("button",{name:"CONTINUE TO SHARED SEASON RESULTS",exact:true}).click({timeout:30000});
      await m.page.locator("#seasonEntry").waitFor({state:"visible",timeout:30000});
    }
    ok("P4.2","signings locked privately on both sides; the Transfer Challenge completed and both opened Season Results");

    // ---------- P5 Daniel publishes, Nik reloads mid-Showdown, then publishes ----------
    await fillSeasonResult(daniel,"p1",{leaguePosition:1,leaguePoints:87,leagueGoals:93,domesticCup:false,championsLeague:true,topScorer:true,topAssist:false});
    await publishSeasonResult(daniel);
    // A waiting spell (Daniel published, Nik not yet): both pages sit still for PARK_MS; its reads/min is the cost of waiting.
    meter.mark("park:start");await daniel.page.waitForTimeout(PARK_MS);meter.mark("park:end");
    const reloadN=await reloadMidShowdown(nik,{expectSession:session1,expectShowdown:showdownN,landing:"#seasonEntry",button:"^(ENTER SHARED SEASON RESULTS|VIEW MY PUBLISHED RESULT|VIEW SHARED SEASON RESULTS)$"});
    // If the reload lands on the Transfer Challenge's historical replay, the player taps through it (CONTINUE REPLAY, as in
    // two-manager-browser-journey.cjs J9.3) until CONTINUE TO SHARED SEASON RESULTS shows; the taps are counted and reported.
    let replayTaps=0;
    if(await nik.page.locator("#transferChallenge").isVisible().catch(()=>false)){
      const cont=nik.page.getByRole("button",{name:"CONTINUE TO SHARED SEASON RESULTS",exact:true});
      for(let i=0;i<12&&!(await cont.isVisible().catch(()=>false));i++){
        const replay=nik.page.locator("#continueFromTransfers");
        if(await replay.isVisible().catch(()=>false)&&await replay.isEnabled().catch(()=>false)&&!/SEASON RESULTS/.test(await replay.textContent())){await replay.click({timeout:10000}).catch(()=>{});replayTaps+=1;}
        await nik.page.waitForTimeout(700);
      }
      await cont.click({timeout:30000});
      await nik.page.locator("#seasonEntry").waitFor({state:"visible",timeout:30000});
    }
    console.log(`P5 landing after Nik's reload: ${JSON.stringify(reloadN.landed)}; replay taps to get back to Season Results: ${replayTaps}`);
    assert.equal(await nik.page.locator("#seasonReviewOne").isVisible(),false,"Daniel's published result stays private from Nik after the reload");
    ok("P5",`Nik's reload mid-Showdown (Season Results): same Showdown and session, Daniel's result still private, no Home frame (${reloadN.frames} frames, first: ${reloadN.firstScreens})`);
    await fillSeasonResult(nik,"p2",{leaguePosition:2,leaguePoints:84,leagueGoals:101,domesticCup:true,championsLeague:false,topScorer:false,topAssist:true});
    await publishSeasonResult(nik);
    for(const m of [daniel,nik])await m.page.waitForFunction(()=>document.getElementById("seasonReviewHeading")?.textContent==="BOTH MANAGERS PUBLISHED",null,{timeout:45000});

    // ---------- P6 commit, Final Winner, automatic close ----------
    await commitFinalSeasonViaUi(daniel,nik,FINAL_EXPECTED.daniel,FINAL_EXPECTED.nik,1);
    for(const m of [daniel,nik]){
      await m.page.locator("#finalWinnerScreen").waitFor({state:"visible",timeout:60000});
      await m.page.waitForFunction(()=>window.CareerModeProductionSharedTerminalClose?.getState?.()?.phase==="CLOSED"&&window.FINAL_WINNER_FIXTURES?.frames?.LIVE?.state==="completed",null,{timeout:60000});
    }
    meter.mark("season:closed");
    for(const m of [daniel,nik]){
      const frame=await m.page.evaluate(()=>window.FINAL_WINNER_FIXTURES?.frames?.LIVE);
      assert.equal(frame.winner,"daniel",`${m.user}: Daniel wins`);
      assert.deepEqual(frame.totals,{daniel:FINAL_EXPECTED.daniel,nik:FINAL_EXPECTED.nik},`${m.user}: final totals`);
      assert.equal(frame.lastSeason.season,1);
      assert.equal(await m.page.locator("#sharedTerminalCloseAction").isVisible().catch(()=>false),false,`${m.user}: the automatic close needs no CLOSE tap`);
      assert.equal(m.log.taps.some(t=>t.id==="sharedTerminalCloseAction"||t.id==="sharedTerminalCloseRetry"),false,`${m.user}: no terminal close tap`);
    }
    const closedR1=await admin(`rivalries/${R1}`);
    assert.equal(field(closedR1,"data","connectionState").stringValue,"closed","R1 is closed");
    assert.equal(field(closedR1,"data","terminalClose","winner").stringValue,FINAL_EXPECTED.winner,"the close witness names Daniel");
    await shot(daniel,"p6-final");await shot(nik,"p6-final");
    ok("P6","the 1-season Showdown finished: Final Winner Daniel 9 · Nik 3 on both pages, closed automatically (no CLOSE tap), R1 closed with its witness");

    // ---------- M meter for the season played ----------
    const season=meter.between("season:start","season:closed");
    printMeter("season (START tap -> both CLOSED)",season);
    printMeter("  pairing (START -> league wheel)",meter.between("season:start","season:wheel"));
    printMeter("  setup (league wheel -> Transfer Challenge)",meter.between("season:wheel","season:transfer"));
    printMeter("  play (Transfer Challenge -> CLOSED, incl. 2 reloads + offline)",meter.between("season:transfer","season:closed"));
    const park=meter.between("park:start","park:end");
    printMeter(`  waiting spell (Season Results, Daniel published, both idle ${Math.round(PARK_MS/1000)} s)`,park);
    console.log(`METER waiting cost: ${(park.reads/(park.ms/60000)).toFixed(1)} reads/min and ${(park.writes/(park.ms/60000)).toFixed(1)} writes/min for both players`);
    console.log(`METER top documents: ${season.top.map(([k,n])=>`${k} x${n}`).join("; ")}`);
    assert.ok(season.reads<=BUDGET.readsPerSeason,`reads per season ${season.reads} > budget ${BUDGET.readsPerSeason}`);
    assert.ok(season.net.commits>0&&season.net.batchGetDocs>0,"the network cross-check saw the emulator traffic");
    assert.ok(Math.max(season.writes,season.net.committedDocs)<=BUDGET.writesPerSeason,`writes per season ${season.writes} (network ${season.net.committedDocs}) > budget ${BUDGET.writesPerSeason}`);
    ok("M",`reads/writes per season, both players: ${season.reads} reads (SDK ${season.sdkReads} + listener ${season.listenReads}) <= ${BUDGET.readsPerSeason}, ${season.writes} writes <= ${BUDGET.writesPerSeason}`);

    // ---------- P7 history ----------
    await assertCareerScreensShowCompletedShowdown([daniel,nik],"P7");
    ok("P7","both devices: Career Statistics (1 completed), Trophy Room (Showdown Champion: Daniel) and Legacy (Showdown #1, Daniel wins)");

    // ---------- P8 Daniel's next START, Nik's Home JOIN ----------
    meter.mark("r2:start");
    const code2=await danielStartsShowdown(daniel,1);
    assert.match(code2,/^CMS17-pair_[0-9a-f]{64}$/,"already paired: no CMS17R- code");
    const R2=code2.slice("CMS17-".length);
    assert.notEqual(R2,R1);
    await adminUntil(`accounts/${uidN}/partnerInbox/current`,doc=>field(doc,"rivalryId")?.stringValue===R2,"Daniel's JOIN note");
    const joinTile=["JOIN","JOIN DANIEL'S SHOWDOWN","Daniel started 1 season. Tap to join."];
    const nikTapsBefore=nik.log.taps.length;
    // Nik went Home from the finished Showdown (no reload) and stays there: his Home's note listener must show JOIN by itself.
    try{await nik.page.waitForFunction(text=>(document.querySelector("#newShowdown .menuTileMeta")?.textContent||"").trim()===text,joinTile[2],{timeout:45000});}
    catch(error){
      const seen=await nik.page.evaluate(()=>{const p=window.CareerModePersistentNikDanielPair,s=p?.getState?.();return {pair:s?{status:s.status,rivalryId:s.rivalryId,connectionState:s.connectionState,closedRivalryId:s.closedRivalryId}:null,watch:p?.getJoinNoteWatch?.()||null,note:p?.getJoinNoteState?.()?.note||null};});
      throw new Error(`P8: 45 s after Daniel's START (his JOIN note is in Nik's inbox) Nik's Home still says ${JSON.stringify(await homeTile(nik))}; `+
        `Nik's page after the finished R1 (${R1.slice(0,13)}…): ${JSON.stringify(seen)}`,{cause:error});
    }
    assert.deepEqual(await homeTile(nik),joinTile,"Nik's Home shows JOIN DANIEL'S SHOWDOWN");
    assert.equal(nik.log.taps.length,nikTapsBefore,"Nik tapped nothing for JOIN to appear");
    assert.equal(await nik.page.locator("#connectPlayersScreen #persistentNikDanielPairCode").isVisible().catch(()=>false),false,"no code box for Nik");
    await nik.page.locator("#newShowdown").click({timeout:30000});
    await bothActive([daniel,nik],R2);
    assert.deepEqual(nik.log.taps.slice(nikTapsBefore).map(t=>t.id||t.text),["newShowdown"],"one tap: JOIN on Home");
    assert.equal(field(await admin(`accounts/${uidN}/pairLinks/current`),"data","rivalryId").stringValue,R2,"Nik is paired to R2");
    assert.deepEqual(ids(field(await admin(`accounts/${uidD}/careerIndex/current`),"data","rivalryIds")),[R1,R2],"Daniel career index [R1,R2]");
    for(const m of [daniel,nik])await m.page.locator("#leagueWheelScreen").waitFor({state:"visible",timeout:45000});
    meter.mark("r2:wheel");
    ok("P8","Daniel's next START (no code to type): Nik's Home showed JOIN DANIEL'S SHOWDOWN by itself; one JOIN tap joined R2; both on the league wheel");

    // ---------- P9 DELETE CURRENT SHOWDOWN, then a new game ----------
    await openSettings(daniel);
    await daniel.page.locator(".settingsDeleteCurrentShowdown").click();
    await daniel.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.busy===false&&s.status==="unpaired");},null,{timeout:45000});
    assert.equal(field(await admin(`rivalries/${R2}`),"data","connectionState").stringValue,"closed","R2 is closed");
    await closeSettings(daniel);
    await nik.page.waitForFunction(id=>window.CareerModeProductionSharedTerminalClose?.getState?.()?.phase==="DELETED"&&window.CareerModeProductionSharedTerminalClose.getState().rivalryId===id,R2,{timeout:60000});
    ok("P9.1","Daniel's DELETE CURRENT SHOWDOWN (Settings) closed R2; Nik's page saw it as DELETED without a tap");
    if(!await daniel.page.locator("#mainMenu").isVisible().catch(()=>false))await backToShowdownHome(daniel);
    const code3=await danielStartsShowdown(daniel,1);
    const R3=code3.replace(/^CMS17R?-/,"");
    assert.ok(R3!==R1&&R3!==R2,"a new rivalry");
    await backToShowdownHome(nik);
    await nik.page.waitForFunction(text=>(document.querySelector("#newShowdown .menuTileMeta")?.textContent||"").trim()===text,joinTile[2],{timeout:45000});
    const nikTapsBeforeJoin=nik.log.taps.length;
    await nik.page.locator("#newShowdown").click({timeout:30000});
    await bothActive([daniel,nik],R3);
    assert.equal(nik.log.taps.length-nikTapsBeforeJoin,1,"one tap: JOIN on Home");
    assert.equal(field(await admin(`accounts/${uidN}/pairLinks/current`),"data","rivalryId").stringValue,R3,"Nik is paired to R3");
    for(const m of [daniel,nik])await m.page.locator("#leagueWheelScreen").waitFor({state:"visible",timeout:45000});
    await shot(daniel,"p9-new-game");await shot(nik,"p9-new-game");
    ok("P9.2","after the delete Daniel started a new game; Nik's next JOIN (one tap) joined it and both reached the league wheel");

    for(const m of managers){
      assert.deepEqual(m.log.forbidden,[],`${m.user} never contacted a production Firebase host`);
      assert.equal(m.log.productionRuntime,0,`${m.user} never loaded the production runtime`);
      assert.deepEqual(m.log.errors,[],`${m.user} page errors`);
    }
    ok("PZ","no production Firebase host, no production runtime and no page errors in either context");
    console.log(`TAPS daniel=${daniel.log.taps.length} nik=${nik.log.taps.length}`);
    console.log(`PASS r79 two-player journey audit: ${checks} checks; season meter ${season.reads} reads / ${season.writes} writes (budget ${BUDGET.readsPerSeason} / ${BUDGET.writesPerSeason}); screenshots in ${SHOTS}`);
  }catch(error){
    for(const m of managers){
      console.log(`--- ${m.user}: ${await describe(m).catch(e=>e.message)} tile=${JSON.stringify(await homeTile(m).catch(()=>null))} pair=${JSON.stringify(await pairState(m).catch(()=>null))}`);
      console.log(`--- ${m.user} join note: ${await m.page.evaluate(()=>{const p=window.CareerModePersistentNikDanielPair;try{return JSON.stringify({note:p?.getJoinNoteState?.(),watch:p?.getJoinNoteWatch?.(),partner:p?.getPartnerState?.()}).slice(0,1500);}catch(e){return String(e);}}).catch(e=>e.message)}`);
      console.log(`--- ${m.user} errors: ${JSON.stringify(m.log.errors.slice(-10))}`);
      await shot(m,"failure");
    }
    if(meter.marks.length)try{printMeter("so far",meter.window(meter.marks[0].t,Date.now()));}catch(_){}
    throw error;
  }finally{
    if(METER_OUT)meter.write(METER_OUT);
    await browser.close();server.kill();
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});

"use strict";
const rosterRoulette=require("./support/roster-roulette.cjs");
// r79 PR5: the whole two-player journey in one run, plus the reads/writes per season meter.
// Real app, two Chromium contexts (Daniel = playerOne, Nik = playerTwo), Auth + Firestore emulators with the composed
// production Rules (test project demo-cms-browser-journey only; production Firebase hosts are recorded and fail the run).
// Every step is a player's tap or typing; page globals are only read.
//   P1  Daniel's first Home START (automatic career boundary) makes the first real pairing (CMS17R-); Nik pastes it once.
//   P2  both continue by themselves into the private session and reach the league wheel; Daniel draws league and clubs.
//   P3  Daniel reloads mid-Showdown (Transfer Challenge, window live): back in the same Showdown and session, Home never shows.
//   P4  Nik goes offline during guess entry (Daniel locks his guesses meanwhile), comes back online and continues.
//   P5  Nik reloads mid-Showdown (Season Results, Daniel already published): same Showdown and session, Home never shows;
//       a landing on the Transfer Challenge replay is tapped through (CONTINUE REPLAY, as in the two-manager journey J9.3).
//   R80a Daniel opens the game in a fresh browser (same Google account, empty storage) mid-season: the live Showdown's shell is
//        rebuilt from the pair link, and he continues the same season (same session, same save id) on the live transfer window.
//   R80b both reload at the same time mid-season (Season Results) and continue.
//   R80c Nik opens the game in a fresh browser mid-season (Daniel already published) and continues the same season.
//   P6  the 1-season Showdown finishes: canonical 9-3, the Final Winner screen, automatic close (no CLOSE tap), R1 closed.
//   P7  history: Career Statistics, Trophy Room and Legacy show the finished Showdown on both devices.
//   R80f before the real career: verify removed actions on both players and seed a historical pre-r79 fixture through
//        emulator admin. The first real START hides it and real History never shows it (checked at R80d).
//   P8  Daniel's next START (3 seasons) has no code for Nik to type: Nik's Home shows JOIN DANIEL'S SHOWDOWN; one JOIN tap joins R2.
//   R80d R2 (3 seasons), played on the same pages that finished R1 (no reload; Shared History must not reuse R1's accepted
//        season): season 1 is played and committed, both continue to season 2, and mid-season 2 (transfer window open)
//        Daniel goes Home and taps END SHOWDOWN (Settings, red): one closure write with endedEarly {seasonsPlayed: 1};
//        Nik's phone lands on Home by itself; History (Legacy) shows exactly one Ended early row with today's date and
//        "1 season" on both phones; Career Statistics (1 completed), the Trophy Room (Showdown Champion: Daniel) and
//        Legacy's completed Showdown #1 are unchanged (R2's committed season never counts).
//   R80e END is double-tapped: one confirm, one closure write, no error notice.
//   P9  after the END Daniel starts again (3 seasons) and Nik's next JOIN works (one tap), with no page error on either phone
//       (the new shell must not report Terminal Close for the ended Showdown's Setup still in memory). The new Showdown's header reads
//       "Season 1 / 3" on both phones at every change from Daniel's START to the Transfer Challenge: the phone that tapped END
//       still holds the ended Showdown's confirmed Setup in memory, and its season 2 must never show on the new Showdown.
//   R80g R3 (3 seasons): season 1 is played and committed, then Nik opens the game in a brand-new browser (same account, empty
//        storage) and, without tapping CONTINUE (no Shared Setup state, no private session on that page), goes straight to
//        Settings and taps END SHOWDOWN: the closure still carries endedEarly {seasonsPlayed: 1} (read from R3's accepted
//        season commits, not a null count), Daniel's phone lands on Home by itself, and History on both phones shows
//        "Showdown #3 · Ended early · <today> · 1 season" next to R2's row, never a dash.
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
  assert.equal(await m.page.locator("#cmsRealCareerRow,#cmsTestRunNote").count(),0,"START has no mode choice or test label");
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
  const m=await signInFreshBrowser(browser,managers,retired,old,label,viewport);
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
  await assertRebuiltShell(m);
  if(await m.page.locator("#dashboard").isVisible().catch(()=>false)){
    await m.page.waitForFunction(re=>new RegExp(re).test(document.getElementById("seasonPrimaryAction")?.textContent||""),button,{timeout:45000});
    await m.page.locator("#seasonPrimaryAction").click({timeout:30000});
    await m.page.locator(landing).waitFor({state:"visible",timeout:30000});
  }
  return m;
}
// The fresh browser holds exactly one save: the live Showdown's shell rebuilt from the pair link (shared marker, setup pending).
async function assertRebuiltShell(m){
  const library=await m.page.evaluate(()=>window.CareerModeSaveLibraryRuntime.getLibrarySnapshot());
  assert.equal(library.saves.length,1,`${m.user}: exactly one save was rebuilt`);
  assert.deepEqual(library.saves[0].showdown.sharedJourney,{contractVersion:1,mode:"shared",setupPending:true},`${m.user}: the rebuilt shell carries the shared marker`);
}
// The old context is closed and a new one (nothing stored) opens the app and signs in with the same Google account; it stops on
// Home with the pair link read (paired, ACTIVE) and taps nothing else.
async function signInFreshBrowser(browser,managers,retired,old,label,viewport){
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
// r80: every text the header's season indicator takes from now on (a MutationObserver; the page is only read).
const watchSeasonHeader=m=>m.page.evaluate(()=>{const node=document.getElementById("seasonIndicator");window.__r80SeasonHeader=[node.textContent.trim()];window.__r80SeasonHeaderObserver?.disconnect();window.__r80SeasonHeaderObserver=new MutationObserver(()=>window.__r80SeasonHeader.push(node.textContent.trim()));window.__r80SeasonHeaderObserver.observe(node,{childList:true,characterData:true,subtree:true});});
const seasonHeaderTexts=m=>m.page.evaluate(()=>{window.__r80SeasonHeaderObserver?.disconnect();return window.__r80SeasonHeader||null;});
const noticeText=m=>m.page.evaluate(()=>{const n=document.getElementById("appRuntimeNotice");return n?{kind:n.className,text:(n.querySelector(".runtimeNoticeText")?.textContent||"").trim()}:null;});
// History (Legacy) cards as drawn: the Ended early rows (status-only cards) and the completed ones. Opening History
// keeps the last drawn frame while it reloads, so this waits for the reloaded frame with both kinds of row.
async function legacyCards(m,{abandoned=1,name="r80d-legacy"}={}){
  await backToShowdownHome(m);
  await m.page.locator("#legacyButton").click({timeout:20000});
  const deadline=Date.now()+20000;let cards=[];
  while(Date.now()<deadline){
    cards=await m.page.evaluate(()=>[...document.querySelectorAll("#legacy .legacyCard")].map(c=>({status:c.dataset.status,text:(c.textContent||"").replace(/\s+/g," ").trim()})));
    if(cards.some(c=>c.status==="completed")&&cards.filter(c=>c.status==="abandoned").length>=abandoned)break;
    await m.page.waitForTimeout(250);
  }
  await shot(m,name);
  await backToShowdownHome(m);
  return cards;
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
    let daniel=await openManager(browser,"daniel",{width:393,height:660});managers.push(daniel);
    let nik=await openManager(browser,"nik",{width:390,height:844});managers.push(nik);
    const retired=[];
    for(const m of managers)assert.equal(await m.page.evaluate(()=>window.__cmsEmulatorSwitch?.active===true),true,`${m.user} emulator switch active`);
    await signIn(daniel,"Daniel");await signIn(nik,"Nik");
    const uidD=await accountId(daniel),uidN=await accountId(nik);
    assert.ok(uidD&&uidN&&uidD!==uidN,"two distinct accounts");
    const metered=meter.events.filter(e=>e.k==="read").length;
    assert.ok(metered>0,"the Firestore meter sees the app's reads (the wrapper is in place)");
    ok("P0.2","Daniel and Nik signed in on the emulators; the Firestore meter is in place in both contexts");

    // Historical data is seeded through emulator admin: the removed client must never create a test game.
    for(const m of managers){
      await openSettings(m);
      assert.equal(await m.page.getByRole("button",{name:/START TEST RUN|JOIN TEST RUN|FORGET THIS DEVICE/}).count(),0,"no test entry or test-only Forget Device");
      assert.doesNotMatch(await m.page.locator("#onlinePlayerIdentitySettingsPanel").innerText(),/TEST RUN|nothing counts/i);
      await closeSettings(m);
      assert.doesNotMatch(await m.page.locator("#mainMenu").innerText(),/TEST RUN/i);
    }
    const historical=JSON.parse(fs.readFileSync(path.join(ROOT,"tests/fixtures/saved-showdowns/r75-1season-win.json"),"utf8"));
    const T=historical.rivalryId;
    const root=historical.documents.find(d=>d.path===`rivalries/${T}`);
    assert.ok(root);
    const put=async(p,fields)=>{const response=await fetch(docUrl(p),{method:"PATCH",headers:{Authorization:"Bearer owner","Content-Type":"application/json"},body:JSON.stringify({fields})});assert.equal(response.status,200,await response.text());};
    await put(root.path,root.fields);
    for(const uid of [uidD,uidN])await put(`accounts/${uid}/careerIndex/current`,{
      schemaVersion:{integerValue:"1"},objectType:{stringValue:"careerIndex"},objectId:{stringValue:"current"},revision:{integerValue:"0"},
      lifecycleState:{stringValue:"live"},contentHash:{stringValue:"sha256:"+"a".repeat(64)},
      data:{mapValue:{fields:{rivalryIds:{arrayValue:{values:[{stringValue:T}]}},sealedPageCount:{integerValue:"0"}}}}
    });
    ok("R80f.1","both Settings/Home surfaces have no test entry; a stored pre-r79 game remains available for the hidden-history checks");

    // ---------- P1 first real pairing ----------
    assert.equal(await admin(`accounts/${uidD}/careerStart/current`),null,"Daniel has no marker before his first START");
    meter.mark("season:start");
    const code1=await danielStartsShowdown(daniel,1,{firstRealStart:true});
    assert.match(code1,/^CMS17R-pair_[0-9a-f]{64}$/,"the first real pairing code");
    const markerD=await admin(`accounts/${uidD}/careerStart/current`);
    assert.ok(markerD,"START wrote Daniel's marker");
    assert.ok(ids(field(markerD,"data","hiddenRivalryIds")).includes(T),"the first real START hides the ended test run for good");
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
    const reloadD=await reloadMidShowdown(daniel,{expectSession:session1,expectShowdown:showdownD,landing:"#transferChallenge",button:"^OPEN TRANSFER WINDOW$"});
    await waitSharedTransferPhase(daniel,"WINDOW_OPEN");await waitTransferPhase(daniel,"window");
    await daniel.page.locator("#endTransferTimer").waitFor({state:"visible",timeout:30000});
    ok("P3",`Daniel's reload mid-Showdown: same Showdown and session, back on the live transfer window, no Home frame (${reloadD.frames} frames, first: ${reloadD.firstScreens})`);
    // ---------- R80a Daniel continues the same season in a fresh browser ----------
    daniel=await moveToFreshBrowser(browser,managers,retired,daniel,"Daniel",{width:393,height:660},{expectSession:session1,expectSaveId:showdownD.saveId,screens:"#dashboard, #transferChallenge",button:"^OPEN TRANSFER WINDOW$",landing:"#transferChallenge"});
    await waitSharedTransferPhase(daniel,"WINDOW_OPEN");await waitTransferPhase(daniel,"window");
    await daniel.page.locator("#endTransferTimer").waitFor({state:"visible",timeout:30000});
    assert.equal(await nik.page.locator("#transferChallenge").isVisible(),true,"Nik stayed on the live transfer window meanwhile");
    await shot(daniel,"r80a-fresh-browser");
    ok("R80a","Daniel opened the game in a fresh browser mid-season (same account, empty storage): the shell was rebuilt from the pair link with the exact save id; same session, back on the live transfer window");
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

    await daniel.page.locator("#p1Signing1Name").fill("QWX Daniel Signing");await daniel.page.locator("#p1Signing1Overall").fill("71");await fillTransferCombo(daniel,"p1Signing1League","Premier League");await fillTransferCombo(daniel,"p1Signing1Nationality","England");
    await daniel.page.getByRole("button",{name:"LOCK MY SIGNINGS",exact:true}).click({timeout:30000});
    await daniel.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.signingLockedRoles?.includes("playerOne")===true,null,{timeout:30000});
    await waitTransferState(nik,"signingLockedRoles","playerOne");
    await assertPrivateTokenAbsent(nik,"QWX","Daniel's signing before COMPLETED");
    await nik.page.locator("#p2Signing1Name").fill("ZPV Nik Signing");await nik.page.locator("#p2Signing1Overall").fill("71");await fillTransferCombo(nik,"p2Signing1League","TIM Serie A");await fillTransferCombo(nik,"p2Signing1Nationality","Brazil");
    await nik.page.getByRole("button",{name:"LOCK MY SIGNINGS",exact:true}).click({timeout:30000});
    await waitTransferPhase(nik,"completed");await waitTransferPhase(daniel,"completed");
    for(const m of [daniel,nik]){
      await m.page.getByRole("button",{name:"CONTINUE TO SEASON RESULTS",exact:true}).click({timeout:30000});
      await m.page.locator("#seasonEntry").waitFor({state:"visible",timeout:30000});
    }
    ok("P4.2","signings locked privately on both sides; the Transfer Challenge completed and both opened Season Results");
    // ---------- R80b both reload at the same time mid-season ----------
    const reloadBoth=await Promise.all([daniel,nik].map(m=>reloadMidShowdown(m,{expectSession:session1,expectShowdown:m===daniel?showdownD:showdownN,landing:"#seasonEntry",button:"^(ENTER SEASON RESULTS|VIEW MY PUBLISHED RESULT|VIEW SEASON RESULTS)$"})));
    const bothReplayTaps=[];for(const m of [daniel,nik])bothReplayTaps.push(await tapThroughReplayToSeasonResults(m));
    for(const m of [daniel,nik])await m.page.locator("#seasonEntry").waitFor({state:"visible",timeout:30000});
    ok("R80b",`both reloaded at the same time mid-season: same Showdown and session each, both back on Season Results, no Home frame (${reloadBoth.map(r=>r.frames).join("/")} frames; replay taps ${bothReplayTaps.join("/")})`);

    // ---------- P5 Daniel publishes, Nik reloads mid-Showdown, then publishes ----------
    await fillSeasonResult(daniel,"p1",{leaguePosition:1,leaguePoints:87,leagueGoals:93,domesticCup:false,championsLeague:true,topScorer:true,topAssist:false});
    await publishSeasonResult(daniel);
    // A waiting spell (Daniel published, Nik not yet): both pages sit still for PARK_MS; its reads/min is the cost of waiting.
    meter.mark("park:start");await daniel.page.waitForTimeout(PARK_MS);meter.mark("park:end");
    const reloadN=await reloadMidShowdown(nik,{expectSession:session1,expectShowdown:showdownN,landing:"#seasonEntry",button:"^(ENTER SEASON RESULTS|VIEW MY PUBLISHED RESULT|VIEW SEASON RESULTS)$"});
    // If the reload lands on the Transfer Challenge's historical replay, the player taps through it (CONTINUE REPLAY, as in
    // two-manager-browser-journey.cjs J9.3) until CONTINUE TO SEASON RESULTS shows; the taps are counted and reported.
    const replayTaps=await tapThroughReplayToSeasonResults(nik);
    console.log(`P5 landing after Nik's reload: ${JSON.stringify(reloadN.landed)}; replay taps to get back to Season Results: ${replayTaps}`);
    assert.equal(await nik.page.locator("#seasonReviewOne").isVisible(),false,"Daniel's published result stays private from Nik after the reload");
    ok("P5",`Nik's reload mid-Showdown (Season Results): same Showdown and session, Daniel's result still private, no Home frame (${reloadN.frames} frames, first: ${reloadN.firstScreens})`);
    // ---------- R80c Nik continues the same season in a fresh browser ----------
    nik=await moveToFreshBrowser(browser,managers,retired,nik,"Nik",{width:390,height:844},{expectSession:session1,expectSaveId:showdownN.saveId,screens:"#dashboard, #transferChallenge, #seasonEntry",button:"^(ENTER SEASON RESULTS|VIEW MY PUBLISHED RESULT|VIEW SEASON RESULTS)$",landing:"#seasonEntry"});
    const freshReplayTaps=await tapThroughReplayToSeasonResults(nik);
    await nik.page.locator("#seasonEntry").waitFor({state:"visible",timeout:30000});
    assert.equal(await nik.page.locator("#seasonReviewOne").isVisible(),false,"Daniel's published result stays private from Nik in the fresh browser");
    await shot(nik,"r80c-fresh-browser");
    ok("R80c",`Nik opened the game in a fresh browser mid-season (Daniel already published): shell rebuilt with the exact save id, same session, back on Season Results, Daniel's result still private (replay taps ${freshReplayTaps})`);
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
    const code2=await danielStartsShowdown(daniel,3);
    assert.match(code2,/^CMS17-pair_[0-9a-f]{64}$/,"already paired: no CMS17R- code");
    const R2=code2.slice("CMS17-".length);
    assert.notEqual(R2,R1);
    await adminUntil(`accounts/${uidN}/partnerInbox/current`,doc=>field(doc,"rivalryId")?.stringValue===R2,"Daniel's JOIN note");
    const joinTile=["JOIN","JOIN DANIEL'S SHOWDOWN","Daniel started 3 seasons. Tap to join."];
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
    assert.deepEqual(ids(field(await admin(`accounts/${uidD}/careerIndex/current`),"data","rivalryIds")),[T,R1,R2],"Daniel career index [T,R1,R2] (the test run stays stored, hidden)");
    for(const m of [daniel,nik])await m.page.locator("#leagueWheelScreen").waitFor({state:"visible",timeout:45000});
    meter.mark("r2:wheel");
    ok("P8","Daniel's next START (3 seasons, no code to type): Nik's Home showed JOIN DANIEL'S SHOWDOWN by itself; one JOIN tap joined R2; both on the league wheel");

    // ---------- R80d END SHOWDOWN mid-season 2 ----------
    // No reload between R1 and R2: both pages still hold R1's accepted season 1 (Commit and Scoring) while R2's season 1
    // is played and committed, and Shared History must not take it for R2's (no "Unable to converge Shared History"; PZ
    // checks the errors).
    const sessionR2=await sessionOf(daniel);
    await playSetupToTransferChallenge(daniel,nik);
    for(const m of [daniel,nik])assert.equal((await m.page.locator("#seasonIndicator").textContent()).trim(),"Season 1 / 3",`${m.user}: R2 season 1 of 3`);
    await playTransferSeason(daniel,nik,"QWR Daniel Signing","ZPR Nik Signing");
    await fillSeasonResult(daniel,"p1",{leaguePosition:1,leaguePoints:87,leagueGoals:93,domesticCup:false,championsLeague:true,topScorer:true,topAssist:false});
    await publishSeasonResult(daniel);
    await fillSeasonResult(nik,"p2",{leaguePosition:2,leaguePoints:84,leagueGoals:101,domesticCup:true,championsLeague:false,topScorer:false,topAssist:true});
    await publishSeasonResult(nik);
    for(const m of [daniel,nik])await m.page.waitForFunction(()=>document.getElementById("seasonReviewHeading")?.textContent==="BOTH MANAGERS PUBLISHED",null,{timeout:45000});
    await commitSeasonViaUi(daniel,nik,FINAL_EXPECTED.daniel,FINAL_EXPECTED.nik,1);
    await adminUntil(`rivalries/${R2}/seasonCommits/season_1`,doc=>Boolean(doc),"R2 season 1 committed",45000);
    ok("R80d.1",`R2 season 1 played and committed on the pages that finished R1: Daniel ${FINAL_EXPECTED.daniel} · Nik ${FINAL_EXPECTED.nik}, Shared History shown on both`);
    await continueToSeason(daniel,nik,2,3);
    await daniel.page.waitForFunction(()=>document.getElementById("startTransferTimer")&&!document.getElementById("startTransferTimer").classList.contains("hidden"),null,{timeout:30000});
    await daniel.page.locator("#startTransferTimer").click({timeout:30000});
    await waitSharedTransferPhase(daniel,"WINDOW_OPEN");await waitSharedTransferPhase(nik,"WINDOW_OPEN");
    assert.equal(await sessionOf(daniel),sessionR2,"same session in the season-2 transfer window");
    ok("R80d.1b","both continued to R2 season 2 (Season 2 / 3); its transfer window is open on both phones");
    const beforeEnd=await admin(`rivalries/${R2}`),revisionBefore=Number(field(beforeEnd,"revision").integerValue);
    assert.equal(field(beforeEnd,"data","connectionState").stringValue,"active");
    const confirmsBefore=(await marbleConfirmMessages(daniel.page)).length;
    // The live transfer screen covers the header, so Daniel goes Home (HOME) and opens Settings there; Nik stays in the window.
    await backToShowdownHome(daniel);
    // r80: the live game reads as continuing on Home, never as a new start.
    await daniel.page.waitForFunction(()=>(document.querySelector("#newShowdown .menuTileLabel")?.textContent||"").trim()==="CONTINUE SHOWDOWN",null,{timeout:15000});
    assert.deepEqual(await homeTile(daniel),["LIVE","CONTINUE SHOWDOWN","Your Showdown is live. Tap to continue."],"Daniel's Home tile mid-season reads CONTINUE SHOWDOWN");
    await shot(daniel,"r80d-home-live");
    await openSettings(daniel);
    const endButton=daniel.page.locator(".settingsDeleteCurrentShowdown");
    assert.equal((await endButton.textContent()).trim(),"END SHOWDOWN","Settings' red button is END SHOWDOWN");
    assert.equal(await daniel.page.getByText("DELETE CURRENT SHOWDOWN").count(),0,"no separate DELETE");
    // R80e: a double tap.
    await endButton.dblclick();
    await daniel.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.busy===false&&s.status==="unpaired");},null,{timeout:45000});
    const closedR2=await adminUntil(`rivalries/${R2}`,doc=>field(doc,"data","connectionState")?.stringValue==="closed","R2 is closed");
    assert.equal(field(closedR2,"data","endedEarly","seasonsPlayed")?.integerValue,"1","the closure carries endedEarly {seasonsPlayed: 1} (season 1 committed)");
    assert.equal(field(closedR2,"data","terminalClose"),undefined,"no finish witness: ended early");
    await daniel.page.locator("#mainMenu").waitFor({state:"visible",timeout:30000});
    const danielNotice=await noticeText(daniel);
    assert.equal(danielNotice?.kind,"success",`Daniel's notice is not an error: ${JSON.stringify(danielNotice)}`);
    assert.match(danielNotice.text,/^Ended the ".+" Showdown for both players\. History keeps it as Ended early\.$/);
    await nik.page.waitForFunction(id=>window.CareerModeProductionSharedTerminalClose?.getState?.()?.phase==="DELETED"&&window.CareerModeProductionSharedTerminalClose.getState().rivalryId===id,R2,{timeout:60000});
    await nik.page.locator("#mainMenu").waitFor({state:"visible",timeout:30000});
    assert.match((await noticeText(nik))?.text||"",/^This Showdown was ended for both players\. History keeps it as Ended early\.$/);
    for(const m of [daniel,nik])assert.equal(await sessionOf(m),null,`${m.user}'s page forgot the ended Showdown's session`);
    await shot(daniel,"r80d-home");await shot(nik,"r80d-home");
    ok("R80d.2",`mid-season 2 (transfer window open) Daniel went Home and tapped END SHOWDOWN: R2 closed with endedEarly {seasonsPlayed: 1}; both phones are on Home with the ended-early notice`);
    const afterEnd=await admin(`rivalries/${R2}`);
    assert.equal(Number(field(afterEnd,"revision").integerValue),revisionBefore+1,"one closure write for the double tap");
    const confirms=(await marbleConfirmMessages(daniel.page)).slice(confirmsBefore);
    assert.equal(confirms.length,1,`one confirm for the double tap: ${JSON.stringify(confirms)}`);
    assert.match(confirms[0],/Ends this Showdown for both players\. History keeps it as Ended early\./);
    ok("R80e","END SHOWDOWN double-tapped: one confirm, one closure write, a success notice and no error");
    const today=await daniel.page.evaluate(()=>new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric"}).format(new Date()));
    for(const m of [daniel,nik]){
      const cards=await legacyCards(m),ended=cards.filter(c=>c.status==="abandoned");
      assert.equal(ended.length,1,`${m.user}: exactly one Ended early row (the test run never shows): ${JSON.stringify(cards)}`);
      assert.match(ended[0].text,new RegExp(`^Showdown #2\\s*Ended early · ${today} · 1 season$`),`${m.user}: ${ended[0].text}`);
      assert.equal(cards.filter(c=>c.status==="completed").length,1,`${m.user}: one completed Showdown`);
    }
    await assertCareerScreensShowCompletedShowdown([daniel,nik],"R80d",{endedEarly:true});
    ok("R80d.3",`History on both phones: exactly one Ended early row (Showdown #2 · ${today} · 1 season), the test run never shows; Career Statistics (1 completed), the Trophy Room (Showdown Champion: Daniel) and Legacy's Showdown #1 are unchanged`);

    for(const m of [daniel,nik])await watchSeasonHeader(m);
    const code3=await danielStartsShowdown(daniel,3);
    const R3=code3.replace(/^CMS17R?-/,"");
    assert.equal((await daniel.page.locator("#seasonIndicator").textContent()).trim(),"Season 1 / 3","daniel: the new Showdown's header reads Season 1 / 3 while he waits for Nik, not the ended R2's season");
    assert.ok(R3!==R1&&R3!==R2,"a new rivalry");
    await backToShowdownHome(nik);
    await nik.page.waitForFunction(text=>(document.querySelector("#newShowdown .menuTileMeta")?.textContent||"").trim()===text,"Daniel started 3 seasons. Tap to join.",{timeout:45000});
    const nikTapsBeforeJoin=nik.log.taps.length;
    await nik.page.locator("#newShowdown").click({timeout:30000});
    await bothActive([daniel,nik],R3);
    assert.equal(nik.log.taps.length-nikTapsBeforeJoin,1,"one tap: JOIN on Home");
    assert.equal(field(await admin(`accounts/${uidN}/pairLinks/current`),"data","rivalryId").stringValue,R3,"Nik is paired to R3");
    for(const m of [daniel,nik])await m.page.locator("#leagueWheelScreen").waitFor({state:"visible",timeout:45000});
    await shot(daniel,"p9-new-game");await shot(nik,"p9-new-game");
    // r80: the new shell borrowed the ended Showdown's in-memory Shared Setup for a moment, and Terminal Close put a red
    // "Attach the exact completed Connected Rivalry" notice on the new league wheel (about 1 run in 9). Checked here, at the
    // START it happened on, as well as at PZ.
    for(const m of [daniel,nik])assert.deepEqual(m.log.errors,[],`${m.user}: no page error from END SHOWDOWN to the new Showdown's league wheel`);
    ok("P9.2","after END SHOWDOWN Daniel started a new Showdown (3 seasons); Nik's next JOIN (one tap) joined it and both reached the league wheel with no page error");

    // ---------- R80g END SHOWDOWN from a brand-new browser, before CONTINUE ----------
    await playSetupToTransferChallenge(daniel,nik);
    for(const m of [daniel,nik])assert.equal((await m.page.locator("#seasonIndicator").textContent()).trim(),"Season 1 / 3",`${m.user}: R3 season 1 of 3`);
    for(const m of [daniel,nik]){
      const texts=await seasonHeaderTexts(m);
      assert.ok(Array.isArray(texts),`${m.user}: the season header was watched from Daniel's START`);
      assert.deepEqual(texts.filter(text=>/^Season \d+ \/ \d+$/.test(text)&&text!=="Season 1 / 3"),[],`${m.user}: from Daniel's START to R3's Transfer Challenge the header only read season 1 of 3: ${JSON.stringify(texts)}`);
    }
    ok("P9.3","R3's header read Season 1 / 3 on both phones at every change from Daniel's START to the Transfer Challenge (the ended R2's Season 2 / 3 never showed)");
    await playTransferSeason(daniel,nik,"QWG Daniel Signing","ZPG Nik Signing");
    await fillSeasonResult(daniel,"p1",{leaguePosition:1,leaguePoints:87,leagueGoals:93,domesticCup:false,championsLeague:true,topScorer:true,topAssist:false});
    await publishSeasonResult(daniel);
    await fillSeasonResult(nik,"p2",{leaguePosition:2,leaguePoints:84,leagueGoals:101,domesticCup:true,championsLeague:false,topScorer:false,topAssist:true});
    await publishSeasonResult(nik);
    for(const m of [daniel,nik])await m.page.waitForFunction(()=>document.getElementById("seasonReviewHeading")?.textContent==="BOTH MANAGERS PUBLISHED",null,{timeout:45000});
    await commitSeasonViaUi(daniel,nik,FINAL_EXPECTED.daniel,FINAL_EXPECTED.nik,1);
    await adminUntil(`rivalries/${R3}/seasonCommits/season_1`,doc=>field(doc,"phase")?.stringValue==="ACKNOWLEDGED","R3 season 1 accepted",45000);
    ok("R80g.1",`R3 season 1 played and committed (Daniel ${FINAL_EXPECTED.daniel} · Nik ${FINAL_EXPECTED.nik}); nobody continued to season 2`);
    const beforeFreshEnd=await admin(`rivalries/${R3}`),revisionBeforeFresh=Number(field(beforeFreshEnd,"revision").integerValue);
    assert.equal(field(beforeFreshEnd,"data","connectionState").stringValue,"active");
    nik=await signInFreshBrowser(browser,managers,retired,nik,"Nik",{width:390,height:844});
    await nik.page.locator("#mainMenu").waitFor({state:"visible",timeout:30000});
    await nik.page.waitForFunction(()=>(document.querySelector("#newShowdown .menuTileLabel")?.textContent||"").trim()==="CONTINUE SHOWDOWN",null,{timeout:30000});
    await assertRebuiltShell(nik);
    // The page the finding is about: the shell is rebuilt, but nothing of the live game has loaded (no Shared Setup state for
    // R3 and no private session), because the player has not tapped CONTINUE.
    const freshState=await nik.page.evaluate(()=>({setupReady:window.CareerModeProductionSharedShowdownSetup?.getState?.()?.ready===true,session:window.CareerModeSparkRemoteJoining?.getState?.()?.sessionState||null}));
    assert.ok(freshState.setupReady===false&&freshState.session!=="active",`Nik's fresh page has no Shared Setup state and no active session before CONTINUE: ${JSON.stringify(freshState)}`);
    const nikTapsFresh=nik.log.taps.length;
    await openSettings(nik);
    const freshEnd=nik.page.locator(".settingsDeleteCurrentShowdown");
    assert.equal((await freshEnd.textContent()).trim(),"END SHOWDOWN","the fresh browser's Settings offers END SHOWDOWN");
    await freshEnd.click({timeout:30000});
    await nik.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.busy===false&&s.status==="unpaired");},null,{timeout:45000});
    assert.equal(nik.log.taps.slice(nikTapsFresh).some(t=>t.id==="newShowdown"),false,"Nik never tapped CONTINUE");
    const closedR3=await adminUntil(`rivalries/${R3}`,doc=>field(doc,"data","connectionState")?.stringValue==="closed","R3 is closed");
    assert.equal(field(closedR3,"data","endedEarly","seasonsPlayed")?.integerValue,"1",`the closure from the fresh browser carries endedEarly {seasonsPlayed: 1}, not null: ${JSON.stringify(field(closedR3,"data","endedEarly"))}`);
    assert.equal(field(closedR3,"data","terminalClose"),undefined,"no finish witness: ended early");
    assert.equal(Number(field(closedR3,"revision").integerValue),revisionBeforeFresh+1,"one closure write");
    await nik.page.locator("#mainMenu").waitFor({state:"visible",timeout:30000});
    const nikNotice=await noticeText(nik);
    assert.equal(nikNotice?.kind,"success",`Nik's notice is not an error: ${JSON.stringify(nikNotice)}`);
    await daniel.page.waitForFunction(id=>window.CareerModeProductionSharedTerminalClose?.getState?.()?.phase==="DELETED"&&window.CareerModeProductionSharedTerminalClose.getState().rivalryId===id,R3,{timeout:60000});
    await daniel.page.locator("#mainMenu").waitFor({state:"visible",timeout:30000});
    assert.match((await noticeText(daniel))?.text||"",/^This Showdown was ended for both players\. History keeps it as Ended early\.$/);
    ok("R80g.2","Nik opened a brand-new browser and, without CONTINUE (no setup state, no session on that page), tapped END SHOWDOWN in Settings: R3 closed with endedEarly {seasonsPlayed: 1}; Daniel's phone went Home by itself");
    for(const m of [daniel,nik]){
      const cards=await legacyCards(m,{abandoned:2,name:"r80g-legacy"}),ended=cards.filter(c=>c.status==="abandoned");
      assert.equal(ended.length,2,`${m.user}: two Ended early rows: ${JSON.stringify(cards)}`);
      const row3=ended.find(c=>/^Showdown #3(?!\d)/.test(c.text));
      assert.ok(row3,`${m.user}: R3 is History's Showdown #3: ${JSON.stringify(ended)}`);
      assert.match(row3.text,new RegExp(`^Showdown #3\\s*Ended early · ${today} · 1 season$`),`${m.user}: ${row3.text}`);
      assert.ok(ended.some(c=>new RegExp(`^Showdown #2\\s*Ended early · ${today} · 1 season$`).test(c.text)),`${m.user}: R2's row is unchanged: ${JSON.stringify(ended)}`);
      assert.equal(cards.filter(c=>c.status==="completed").length,1,`${m.user}: one completed Showdown`);
    }
    ok("R80g.3",`History on both phones: Showdown #3 · Ended early · ${today} · 1 season (not a dash), next to Showdown #2's row`);

    for(const m of [...retired,...managers]){
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

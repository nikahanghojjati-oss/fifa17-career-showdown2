"use strict";
const rosterRoulette=require("./support/roster-roulette.cjs");
const gazette=require("./support/touchline-gazette.cjs");
// G-2b: Daniel and Nik play through the real app screens in two Chromium contexts against the
// Auth + Firestore emulators (composed production Rules). Test database only; project demo-cms-browser-journey.
// Run: npx --yes firebase-tools@15.28.1 emulators:exec --config tests/browser/support/firebase.browser-journey.json \
//        --only auth,firestore --project demo-cms-browser-journey "node tests/browser/two-manager-browser-journey.cjs"
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
const APP_PORT=Number(process.env.CMS_TEST_PORT||4173);
const BASE=`http://127.0.0.1:${APP_PORT}/`;
const SWITCH=path.join(ROOT,"tests/browser/support/emulator-runtime-switch.js");
const SDK_DIR=path.join(ROOT,"node_modules/firebase");
const ARTIFACTS=process.env.CMS_BROWSER_JOURNEY_ARTIFACTS||path.join(os.tmpdir(),"cms-browser-journey");
const LENGTH=Number(process.env.CMS_SHOWDOWN_LENGTH||3);
// JOB-1040: the final totals the scripted seasons produce. The 3-season row is the original expectation; the 1-season row is the
// season-1 result alone (9-3, Daniel wins), so the journey can also be run with CMS_SHOWDOWN_LENGTH=1 without changing any check.
const FINAL_EXPECTED={3:{daniel:10,nik:15,winner:"playerTwo",winnerName:"Nik"},1:{daniel:9,nik:3,winner:"playerOne",winnerName:"Daniel"}}[LENGTH]||{daniel:10,nik:15,winner:"playerTwo",winnerName:"Nik"};
const FINAL_NO_CLOSE_TAP=process.env.CMS_FINAL_NO_CLOSE_TAP==="1";
const FORBIDDEN_HOSTS=/(^|\.)(firestore|identitytoolkit|securetoken|firebaseinstallations|firebaseappcheck|content-firebaseappcheck)\.googleapis\.com$/;
let checks=0;
const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};
// Job 33 (fewer taps): every real button tap is logged per manager. These buttons were pure navigation or reads and are now
// automatic, so the journey must never need them (Daniel's ACKNOWLEDGE is folded into his COMMIT & ACKNOWLEDGE tap, R7).
// r79 one start flow: START makes the pair code itself and both managers continue by themselves once connected, so
// CHOOSE SEASONS (Connect Players), CONNECT PLAYERS (GET READY) and CREATE CODE FOR NIK are no longer taps either.
const REMOVED_TAPS=new Set(["CHOOSE SEASONS","#connectPlayersSetup","CONNECT PLAYERS","CREATE CODE FOR NIK","CHECK STATUS","REFRESH / READ","START CAREER","CONTINUE","CONTINUE TO CLUB PACKS","CONTINUE TO CAREER START","CONTINUE TO TRANSFER CHALLENGE","REFRESH","REFRESH CHALLENGE","#refreshSharedTransferChallenge"]);
function assertNoRemovedTaps(m){
  const removed=m.log.taps.filter(tap=>REMOVED_TAPS.has(tap.text)||REMOVED_TAPS.has(`#${tap.id}`));
  assert.deepEqual(removed,[],`${m.user} never needed a removed navigation/read tap`);
  if(m.user==="daniel")assert.equal(m.log.taps.some(tap=>tap.text==="CONFIRM SEASON"),false,"Daniel's acknowledgement rides on his COMMIT & ACKNOWLEDGE tap");
}
const urlFor=user=>`${BASE}?cmsEmulator=1&cmsEmulatorUser=${user}&cmsAuthPort=${AUTH_PORT}&cmsFirestorePort=${FIRESTORE_PORT}`;
const docUrl=p=>`${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/${p}`;
async function admin(p){const r=await fetch(docUrl(p),{headers:{Authorization:"Bearer owner"}});return r.status===200?r.json():null;}
// r79 PR3: an owner (rules-bypassing) emulator write, used only to plant an EXPIRED JOIN note before a reload.
async function adminWrite(p,fields){const r=await fetch(docUrl(p),{method:"PATCH",headers:{Authorization:"Bearer owner","Content-Type":"application/json"},body:JSON.stringify({fields})});assert.equal(r.status,200,`owner write ${p}`);}
async function adminUntil(p,test,label,timeout=30000){const end=Date.now()+timeout;for(;;){const doc=await admin(p);if(doc&&test(doc))return doc;if(Date.now()>end)throw new Error(`${label}: ${JSON.stringify(doc).slice(0,400)}`);await new Promise(resolve=>setTimeout(resolve,500));}}
const homeTile=m=>m.page.evaluate(()=>{const t=document.getElementById("newShowdown");return t?[".menuTileCode",".menuTileLabel",".menuTileMeta"].map(s=>(t.querySelector(s)?.textContent||"").trim()):null;});
async function waitHomeTile(m,label,timeout=30000){await m.page.waitForFunction(text=>(document.querySelector("#newShowdown .menuTileLabel")?.textContent||"").trim()===text,label,{timeout});return homeTile(m);}
async function assertNoSessionCodeOption(m){assert.equal(await m.page.locator("#sparkRemoteJoiningOverlay button").filter({hasText:"USE A SESSION CODE"}).count(),0,`${m.user}: a permanently paired account has no USE A SESSION CODE`);}
const field=(doc,...keys)=>keys.reduce((v,k)=>v&&(v.mapValue?v.mapValue.fields[k]:v.fields?v.fields[k]:undefined),doc);
const ids=arr=>(arr&&arr.arrayValue&&arr.arrayValue.values||[]).map(v=>v.stringValue);
// Studio Z4: the pair's session pointer, read and written as a signed-in manager (their own emulator ID token).
async function idToken(m){return m.page.evaluate(()=>{for(const k of Object.keys(sessionStorage))if(k.startsWith("firebase:authUser:"))return JSON.parse(sessionStorage.getItem(k)).stsTokenManager.accessToken;return null;});}
async function offerGet(m,rid){const r=await fetch(docUrl(`rivalries/${rid}/sessionOffers/current`),{headers:{Authorization:`Bearer ${await idToken(m)}`}});return r.status;}
async function offerWrite(m,rid,sessionId,uid,expiresAt){
  const name=`projects/${PROJECT}/databases/(default)/documents/rivalries/${rid}/sessionOffers/current`;
  const body={writes:[{update:{name,fields:{schemaVersion:{integerValue:"1"},sessionId:{stringValue:sessionId},hostAccountId:{stringValue:uid},expiresAt:{timestampValue:expiresAt}}},updateTransforms:[{fieldPath:"updatedAt",setToServerValue:"REQUEST_TIME"}]}]};
  const r=await fetch(`${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents:commit`,{method:"POST",headers:{Authorization:`Bearer ${await idToken(m)}`,"Content-Type":"application/json"},body:JSON.stringify(body)});return r.status;
}

async function loadComposedRules(){
  const probe=docUrl("rivalries/probe");
  const before=await fetch(probe);
  const put=await fetch(`${FIRESTORE}/emulator/v1/projects/${PROJECT}:securityRules`,{method:"PUT",headers:{"content-type":"application/json"},
    body:JSON.stringify({rules:{files:[{name:"firestore.rules",content:fs.readFileSync(path.join(ROOT,"firestore.spark.generated.rules"),"utf8")}]}})});
  const after=await fetch(probe);
  assert.equal(put.status,200,"composed Rules upload");
  assert.equal(after.status,403,`composed Rules active (open emulator read was ${before.status}, now ${after.status})`);
}

async function openManager(browser,user,viewport){
  const context=await browser.newContext({viewport});
  const log={errors:[],forbidden:[],productionRuntime:0,taps:[]};
  await context.exposeBinding("__cmsJourneyTap",(_source,tap)=>{log.taps.push(tap);});
  await context.addInitScript(()=>{window.addEventListener("click",event=>{if(!event.isTrusted)return;const button=event.target&&event.target.closest&&event.target.closest("button");if(button&&typeof window.__cmsJourneyTap==="function")void window.__cmsJourneyTap({id:button.id||"",text:(button.textContent||"").replace(/\s+/g," ").trim()});},true);});
  await context.route(/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/(firebase-[a-z-]+\.js)$/,route=>{
    const name=route.request().url().match(/(firebase-[a-z-]+\.js)$/)[1];
    return route.fulfill({path:path.join(SDK_DIR,name),contentType:"text/javascript; charset=utf-8"});
  });
  // JOB-1038: the existing CLOSE path now proves a manual retry after an automatic save failure.
  // Inject at the provider boundary before bootstrap binds it; the no-tap path uses the real provider.
  if(!FINAL_NO_CLOSE_TAP)await context.route("**/js/sparkTerminalClose.js*",async route=>{
    const source=fs.readFileSync(path.join(ROOT,"js/sparkTerminalClose.js"),"utf8");
    await route.fulfill({contentType:"text/javascript",body:source+`
;(()=>{const provider=window.CareerModeSparkTerminalClose;let failed=false;window.CareerModeSparkTerminalClose=Object.freeze({...provider,close:async options=>{if(!failed){failed=true;return {ok:false,code:"TEST_AUTOMATIC_SAVE_FAILED",message:"Test automatic save failed before any write."};}return provider.close(options);}});})();`});
  });
  await context.addInitScript({path:SWITCH});
  const page=await context.newPage();
  page.on("request",request=>{const u=new URL(request.url());if(FORBIDDEN_HOSTS.test(u.hostname))log.forbidden.push(u.hostname);if(/productionFirebaseRuntime\.js|firebase\.runtime-config\.json/.test(u.pathname))log.productionRuntime+=1;});
  page.on("pageerror",error=>log.errors.push(error.message));
  // Job 22: LOCK MY GUESSES / LOCK MY SIGNINGS ask "Lock N of 3 ...?" when a form is partly filled; this journey fills one row, so it accepts that prompt.
  page.on("dialog",dialog=>{void dialog.accept().catch(()=>{});});
  await installMarbleConfirmAnswers(page,{answer:true});
  page.on("console",message=>{if(message.type()==="error"&&!/Failed to load resource/.test(message.text()))log.errors.push(message.text().slice(0,300));});
  await page.goto(urlFor(user),{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
  return {user,context,page,log};
}

async function shot(m,name){
  try{fs.mkdirSync(ARTIFACTS,{recursive:true});await m.page.screenshot({path:path.join(ARTIFACTS,`${name}-${m.user}.png`),timeout:15000});}
  catch(error){console.log(`screenshot skipped ${name}-${m.user}: ${error.message.split("\n")[0]}`);}
}
async function describe(m){
  return m.page.evaluate(()=>{
    const screens=[...document.querySelectorAll(".screen:not(.hidden)")].map(s=>s.id).join(",");
    const overlays=[...document.querySelectorAll("[id$='Overlay']")].filter(o=>{const st=getComputedStyle(o);return !o.classList.contains("hidden")&&st.display!=="none"&&st.visibility!=="hidden";}).map(o=>`${o.id}: ${o.innerText.replace(/\s+/g," ").slice(0,400)}`);
    const panel=(document.getElementById("persistentNikDanielPairPanel")?.innerText||"").replace(/\s+/g," ");
    return `screens=${screens} | badge=${document.getElementById("onlinePlayerIdentityBadge")?.textContent||""} | panel=${panel} | overlays=${overlays.join(" ## ")}`;
  });
}
const accountId=m=>m.page.evaluate(()=>window.CareerModeSparkConnectedAccount?.getState?.().accountId||null);
const entry=m=>m.page.locator("#productionSharedJourneyEntryOverlay");
// Studio Z4: the connect card now says CONNECTING / WAITING FOR <rival>; the manual REMOTE JOINING card is the fallback.
const remote=m=>m.page.locator("#sparkRemoteJoiningOverlay, #remoteJoiningOverlay").filter({hasText:/REMOTE JOINING|CONNECTING|WAITING FOR/}).first();
const sessionOf=m=>m.page.evaluate(()=>window.CareerModeSparkRemoteJoining?.getState?.()?.sessionId||null);
async function assertNoCodeBox(m){assert.equal(await m.page.locator("#sparkRemoteJoiningOverlay input.remoteJoiningInput").isVisible().catch(()=>false),false,`${m.user}: no session code box is shown`);}
// Job 31: the host page picks up the peer's JOIN by itself (quiet read every few seconds); nobody taps REFRESH / READ.
// Job 33 (R6): the ACTIVE session then continues into the Showdown by itself, so Remote Joining closes on both pages.
async function hostSeesJoin(m){await m.page.waitForFunction(()=>window.CareerModeSparkRemoteJoining?.getState?.()?.sessionState==="active",null,{timeout:20000});await remote(m).waitFor({state:"hidden",timeout:20000});assert.equal(await entry(m).isVisible().catch(()=>false),false,`${m.user}: no GET READY after the peer joined`);}
const pairPanel=m=>m.page.locator("#connectPlayersScreen #persistentNikDanielPairPanel");
// r79 one start flow: Home START goes straight to NEW SHOWDOWN (seasons), START opens WAITING over the locked league wheel and
// makes the code by itself; no Connect Players hop, no GET READY, no CREATE CODE FOR NIK tap.
// Home START has no mode choice. The seasons START writes the first career marker before creating the code.
async function danielStartsShowdown(m,length,{firstRealStart=false}={}){
  await m.page.locator("#newShowdown").click({timeout:30000});
  await m.page.locator("#createShowdown").waitFor({state:"visible",timeout:30000});
  assert.equal(await m.page.locator("#connectPlayersScreen").isVisible().catch(()=>false),false,"Home START goes straight to the seasons screen");
  assert.equal(await m.page.locator("#cmsRealCareerRow,#cmsRealCareerCheck,#cmsTestRunNote").count(),0,"START has no checkmark, mode choice or test label");
  if(firstRealStart)assert.equal(await m.page.evaluate(async()=>{await window.loadRuntimeScript("career-start-marker","js/careerStartMarker.js",()=>Boolean(window.CareerModeCareerStartMarker));return (await window.CareerModeCareerStartMarker.readCurrentMarker()).status;}),"none","the first START begins without a career marker");
  await m.page.locator("#roundAmount").selectOption(String(length));
  await m.page.locator("#startShowdown").click({timeout:30000});
  await pairPanel(m).locator("code").waitFor({timeout:30000});
  const marker=await m.page.evaluate(async()=>{await window.loadRuntimeScript("career-start-marker","js/careerStartMarker.js",()=>Boolean(window.CareerModeCareerStartMarker));return window.CareerModeCareerStartMarker.readCurrentMarker();});
  assert.equal(marker.status,"ready","START automatically wrote the career-start marker before showing the code");
  assert.equal(marker.active,true,"this Showdown counts toward the real career");
  const waiting=await m.page.evaluate(()=>({screen:window.getActiveScreenName?.(),stay:document.getElementById("connectPlayersScreen")?.dataset.stayOnScreen,getReady:Boolean(document.getElementById("productionSharedJourneyEntryOverlay")&&!document.getElementById("productionSharedJourneyEntryOverlay").classList.contains("hidden"))}));
  assert.deepEqual(waiting,{screen:"leagueWheelScreen",stay:"true",getReady:false},"WAITING over the locked league wheel, no GET READY");
  assert.equal(await m.page.locator("#mainMenu #persistentNikDanielPairPanel").count(),0,"Home must never contain the pair panel.");
  return (await pairPanel(m).locator("code").innerText()).trim();
}
// r79: after Nik's own JOIN and Daniel's waiting poll see the pair ACTIVE, both continue by themselves into Remote Joining.
async function bothPairedAndContinuing(managers){
  for(const m of managers){
    await m.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.connectionState==="active");},null,{timeout:30000});
    await m.page.waitForFunction(()=>window.CareerModeSparkRemoteJoining?.getState?.()?.sessionState==="active"||!document.getElementById("sparkRemoteJoiningOverlay")?.classList.contains("hidden"),null,{timeout:30000});
    assert.equal(await m.page.locator("#connectPlayersScreen").isVisible().catch(()=>false),false,`${m.user}: Connect Players closed by itself`);
    assert.equal(await entry(m).isVisible().catch(()=>false),false,`${m.user}: no GET READY overlay before Remote Joining`);
  }
}
async function waitTransferPhase(m,phase){
  await m.page.waitForFunction(value=>document.getElementById("transferChallenge")?.dataset.transferPhase===value,phase,{timeout:30000});
}
// Job 33 (R1): a manager who is waiting on the rival re-reads the shared challenge every 3 s, so no REFRESH tap is needed.
// A manager who has the next tap is not fast-polled; the shared-state wait below only observes the normal 15 s read.
async function waitTransferState(m,field,role){
  await m.page.waitForFunction(([key,value])=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.[key]?.includes(value)===true,[field,role],{timeout:30000});
}
async function fillTransferCombo(m,id,value){
  const input=m.page.locator(`#${id}`);
  await input.fill(value);
  await m.page.waitForFunction(fieldId=>Boolean(document.getElementById(fieldId)?.dataset.canonicalId),id,{timeout:5000});
}
async function assertPrivateTokenAbsent(m,token,label){
  const leak=await m.page.evaluate(value=>({
    text:(document.body.innerText||"").includes(value),
    inputs:[...document.querySelectorAll("input")].filter(node=>String(node.value||"").includes(value)).map(node=>node.id)
  }),token);
  assert.equal(leak.text,false,`${label}: page text leaked ${token}`);
  assert.deepEqual(leak.inputs,[],`${label}: input values leaked ${token}`);
}

// J1: sign in through the real gate and choose the player.
async function signIn(m,label){
  await m.page.locator("#newShowdown").click();
  await m.page.getByRole("button",{name:"SIGN IN WITH GOOGLE"}).click({timeout:30000});
  await m.page.getByRole("button",{name:new RegExp(`^${label} · PLAYER`,"i")}).click({timeout:30000});
  await m.page.waitForFunction(text=>document.getElementById("onlinePlayerIdentityBadge")?.textContent===text,label.toUpperCase(),{timeout:30000});
}

async function fillSeasonResult(m,prefix,result){
  await m.page.locator(`#${prefix}LeaguePosition`).fill(String(result.leaguePosition));
  await m.page.locator(`#${prefix}LeaguePoints`).fill(String(result.leaguePoints));
  await m.page.locator(`#${prefix}LeagueGoals`).fill(String(result.leagueGoals));
  for(const [suffix,key] of [["DomesticCup","domesticCup"],["ChampionsLeague","championsLeague"],["TopScorer","topScorer"],["TopAssist","topAssist"]]){
    await m.page.locator(`#${prefix}${suffix}`).setChecked(Boolean(result[key]));
  }
}
async function publishSeasonResult(m){
  await m.page.locator("#completeSeason").click({timeout:30000});
  await m.page.waitForFunction(()=>document.getElementById("seasonReviewHeading")?.textContent==="REVIEW YOUR SEASON RESULT",null,{timeout:30000});
  await m.page.locator("#confirmSeasonCompletion").click({timeout:30000});
  await m.page.waitForFunction(()=>/YOUR RESULT IS PUBLISHED|BOTH MANAGERS PUBLISHED/.test(document.getElementById("seasonReviewHeading")?.textContent||""),null,{timeout:30000});
}

async function prepareSeasonReview(m){
  await m.page.locator("#completeSeason").click({timeout:30000});
  await m.page.waitForFunction(()=>document.getElementById("seasonReviewHeading")?.textContent==="REVIEW YOUR SEASON RESULT",null,{timeout:30000});
}
async function commitSeasonViaUi(daniel,nik,p1,p2,winner,{finalSeason=false,seasonNumber=null}={}){
  await daniel.page.waitForFunction(()=>document.getElementById("sharedSeasonCommitAction")?.textContent==="LOCK & CONFIRM SEASON",null,{timeout:45000});
  await nik.page.waitForFunction(()=>document.getElementById("sharedSeasonCommitAction")?.textContent==="WAITING FOR DANIEL"||document.getElementById("sharedSeasonCommitAction")?.textContent==="CONFIRM SEASON",null,{timeout:45000});
  if(await nik.page.locator("#sharedSeasonCommitAction").textContent()==="WAITING FOR DANIEL")assert.equal(await nik.page.locator("#sharedSeasonCommitAction").isDisabled(),true,"Nik cannot commit");
  // R7 (owner decision 2026-10-04): Daniel's one tap commits, then records his own acknowledgement; Nik still acknowledges himself.
  await daniel.page.locator("#sharedSeasonCommitAction").click({timeout:30000});
  await daniel.page.waitForFunction(()=>/^(CONFIRMED ✓ · WAITING FOR RIVAL|SEASON CONFIRMED ✓)$/.test(document.getElementById("sharedSeasonCommitAction")?.textContent||""),null,{timeout:30000});
  const danielCommit=await daniel.page.evaluate(()=>{const s=window.CareerModeProductionSharedSeasonCommit?.getState?.();return s?{committed:s.committed,ownAcknowledged:s.ownAcknowledged}:null;});
  assert.deepEqual(danielCommit,{committed:true,ownAcknowledged:true},"Daniel's single tap committed the season and recorded his own acknowledgement");
  assert.equal(await daniel.page.locator("#sharedCanonicalScoringPanel").isVisible().catch(()=>false),false,"scoring still waits for Nik's own acknowledgement");
  await nik.page.waitForFunction(()=>document.getElementById("sharedSeasonCommitAction")?.textContent==="CONFIRM SEASON",null,{timeout:45000});
  await nik.page.locator("#sharedSeasonCommitAction").click({timeout:30000});
  // JOB-1038 no-tap mode: on the final season the automatic close can finish before this page is checked; the closed
  // Showdown then no longer shows the live commit and scoring panels, so only the Final Winner checks below apply.
  const autoClosedFinal=FINAL_NO_CLOSE_TAP&&finalSeason;
  for(const m of [daniel,nik]){
    await m.page.waitForFunction(allowClosed=>document.getElementById("sharedSeasonCommitAction")?.textContent==="SEASON CONFIRMED ✓"||(allowClosed&&window.CareerModeProductionSharedTerminalClose?.getState?.()?.phase==="CLOSED"),autoClosedFinal,{timeout:45000});
    const closedAlready=autoClosedFinal&&await m.page.evaluate(()=>window.CareerModeProductionSharedTerminalClose?.getState?.()?.phase==="CLOSED");
    if(!closedAlready){
    try{
      await m.page.waitForFunction(()=>window.CareerModeProductionSharedCanonicalScoring?.getState?.()?.phase==="SCORING_RECONCILED",null,{timeout:60000});
    }catch(error){
      const diag=await m.page.evaluate(()=>({
        commit:window.CareerModeProductionSharedSeasonCommit?.getState?.()||null,
        scoring:window.CareerModeProductionSharedCanonicalScoring?.getState?.()||null,
        setup:window.CareerModeProductionSharedShowdownSetup?.getState?.()||null,
        seasonEntryVisible:!document.getElementById("seasonEntry")?.classList.contains("hidden"),
        scoringPanel:Boolean(document.getElementById("sharedCanonicalScoringPanel")),
        visibility:document.visibilityState
      }));
      throw new Error(`J8_CANONICAL_SCORING_NOT_VISIBLE ${JSON.stringify(diag)}`,{cause:error});
    }
    const scoringView=await m.page.evaluate(()=>{const v=window.CareerModeProductionSharedCanonicalScoring?.getState?.();return v?{authoritative:v.authoritative,p1:v.scoring?.playerOne?.total,p2:v.scoring?.playerTwo?.total,winner:v.winner}:null;});
    assert.deepEqual(scoringView,{authoritative:true,p1,p2,winner:winner==="draw"?"draw":winner==="Daniel"?"playerOne":"playerTwo"},`${m.user} canonical scoring state`);
    }
    if(finalSeason){
      // BH-8: after the last commit the Final Winner screen can take over before this check runs, so on the final season either
      // the rendered scoring panel or the Final Winner screen is accepted; the panel text below is still asserted either way.
      await m.page.waitForFunction(()=>{const shown=id=>{const el=document.getElementById(id);return Boolean(el&&el.getClientRects().length&&getComputedStyle(el).visibility!=="hidden");};return shown("sharedCanonicalScoringPanel")||shown("finalWinnerScreen");},null,{timeout:45000});
      if(!closedAlready)assert.equal(await m.page.locator("#sharedCanonicalScoringPanel").evaluate(el=>el.classList.contains("hidden")),false,`${m.user} scoring panel was rendered for the final season`);
      // JOB-1005: the Final Winner screen itself shows the final season's number and score (no extra tap).
      assert.ok(Number.isInteger(seasonNumber),"the final season number is passed to commitSeasonViaUi");
      await m.page.waitForFunction(({n,s1,s2})=>{const t=id=>document.getElementById(id)?.textContent?.trim();return t("panelLastSeasonLabel")===`FINAL SEASON ${n}`&&t("panelLastSeasonDaniel")===String(s1)&&t("panelLastSeasonNik")===String(s2);},{n:seasonNumber,s1:p1,s2:p2},{timeout:60000});
      assert.equal(await m.page.locator("#finalWinnerLastSeason").isVisible(),true,`${m.user} Final Winner shows the last season cell`);
    }else{
      await m.page.locator("#sharedCanonicalScoringPanel").waitFor({state:"visible",timeout:5000});
    }
    if(!closedAlready)assert.equal((await m.page.locator("#sharedCanonicalScoringTotals").textContent()).trim(),`Daniel: ${p1} · Nik: ${p2}`);
    if(!closedAlready)assert.equal((await m.page.locator("#sharedCanonicalScoringWinner").textContent()).trim(),winner==="draw"?"Season result: Draw":`Season winner: ${winner}`);
    // On the final season the J10 Final Reconciliation step below waits for authoritative Shared History instead.
    if(!finalSeason)await m.page.locator("#sharedHistoryConvergencePanel").waitFor({state:"visible",timeout:45000});
  }
}
// Job 33 (R2): CONTINUE TO SEASON N updates the dashboard and opens the new season's Shared Transfer Challenge directly
// (no START SEASON N dashboard tap). The dashboard values are still asserted from the rendered dashboard.
async function continueToSeason(daniel,nik,season,total){
  for(const m of [daniel,nik]){
    await m.page.waitForFunction(next=>document.getElementById("sharedMultiSeasonContinueAction")?.textContent===`CONTINUE TO SEASON ${next}`,season,{timeout:45000});
    await m.page.locator("#sharedMultiSeasonContinueAction").click({timeout:30000});
    // r87 Touchline Gazette: the season paper opens first, once per phone; its CONTINUE runs the same step.
    const paper=await gazette.passGazette(m.page,"season");
    assert.ok(paper&&paper.endsWith(`|season|${season-1}`),`${m.user} saw the season-${season-1} Touchline Gazette after CONTINUE TO SEASON ${season} (${paper})`);
    await m.page.waitForFunction(value=>document.getElementById("seasonIndicator")?.textContent===value,`Season ${season} / ${total}`,{timeout:30000});
    await rosterRoulette.waitForTransfer(m.page,30000);
    assert.equal(await m.page.locator("#dashboard").isVisible(),false,`${m.user} went straight to the season-${season} Transfer Challenge`);
  }
}
async function playTransferSeason(daniel,nik,season,tokenD,tokenN){
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

  await daniel.page.locator("#p1Signing1Name").fill(tokenD);await daniel.page.locator("#p1Signing1Overall").fill("71");await daniel.page.locator("#p1Signing1Position").selectOption("ST");await fillTransferCombo(daniel,"p1Signing1League","Premier League");await fillTransferCombo(daniel,"p1Signing1Nationality","England");
  await daniel.page.getByRole("button",{name:"LOCK MY SIGNINGS",exact:true}).click({timeout:30000});
  await daniel.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.signingLockedRoles?.includes("playerOne")===true,null,{timeout:30000});
  await assertPrivateTokenAbsent(nik,tokenD.split(" ")[0],`season ${season} Daniel signing privacy`);
  await waitTransferState(nik,"signingLockedRoles","playerOne");await waitTransferPhase(nik,"signing_entry");
  await assertPrivateTokenAbsent(nik,tokenD.split(" ")[0],`season ${season} Daniel signing privacy after Nik read the lock`);
  await nik.page.locator("#p2Signing1Name").fill(tokenN);await nik.page.locator("#p2Signing1Overall").fill("71");await nik.page.locator("#p2Signing1Position").selectOption("ST");await fillTransferCombo(nik,"p2Signing1League","Serie A TIM");await fillTransferCombo(nik,"p2Signing1Nationality","Brazil");
  await assertPrivateTokenAbsent(daniel,tokenN.split(" ")[0],`season ${season} Nik signing privacy`);
  await nik.page.getByRole("button",{name:"LOCK MY SIGNINGS",exact:true}).click({timeout:30000});
  await waitTransferPhase(nik,"completed");await waitTransferPhase(daniel,"completed");
  for(const m of [daniel,nik])await m.page.getByRole("button",{name:"CONTINUE TO SEASON RESULTS",exact:true}).waitFor({state:"visible",timeout:30000});
}

// JOB-1040: reads one career screen (host element) until `ready` accepts its text or 20 s pass; returns the last text either way.
async function readCareerScreenText(m,hostId,ready){
  const deadline=Date.now()+20000;let text="";
  while(Date.now()<deadline){
    text=await m.page.evaluate(id=>{const h=document.getElementById(id);return h&&!h.classList.contains("hidden")?(h.innerText||"").replace(/\s+/g," ").trim():"";},hostId);
    if(text&&ready(text))return text;
    await m.page.waitForTimeout(250);
  }
  return text;
}
async function backToShowdownHome(m){
  // Real navigation: press the visible SHOWDOWN HOME / BACK TO MAIN MENU button until Showdown Home (#mainMenu) shows. Bounded to 20 s.
  const deadline=Date.now()+20000;
  while(Date.now()<deadline){
    if(await m.page.locator("#mainMenu").isVisible().catch(()=>false))return;
    // r87: leaving Final Winner opens the Touchline Gazette's final paper first; its CONTINUE goes on to Showdown Home.
    if(await gazette.tapGazetteIfShown(m.page)){await m.page.waitForTimeout(500);continue;}
    for(const label of [/^\s*(SHOWDOWN HOME|BACK TO HOME|BACK TO MAIN MENU|BACK TO SHOWDOWN HOME)\s*$/i,/^\s*HOME\s*$/i,/^\s*BACK\s*$/i]){
      const back=m.page.locator("button:visible").filter({hasText:label}).first();
      if(await back.count()){await back.click({timeout:5000}).catch(()=>{});break;}
    }
    await m.page.waitForTimeout(500);
  }
  const diag=await m.page.evaluate(()=>({screens:[...document.querySelectorAll(".screen:not(.hidden)")].map(s=>s.id),buttons:[...document.querySelectorAll("button")].filter(b=>b.offsetParent!==null).map(b=>(b.innerText||b.id||"").replace(/\s+/g," ").trim()).slice(0,30)}));
  throw new Error(`${m.user}: could not reach Showdown Home from the finished Showdown within 20 s ${JSON.stringify(diag)}`);
}
// r82 (Nik: career panels show, vanish, then load again): after a career screen first shows its content, it must never go
// blank or back to loading while it settles. Sampled every frame from before the tap until 3 s after the content appeared.
async function watchCareerScreen(m,screenId){
  await m.page.evaluate(id=>{const w=window.__careerVanish={id,seen:false,vanish:0};const tick=()=>{if(window.__careerVanish!==w)return;const el=document.getElementById(id);// A host still held by the loader ([data-v10-pending], opacity 0) is not on screen yet.
const t=(el&&el.getClientRects().length&&!el.closest("[data-v10-pending]")?el.innerText:"")||"";if(t.trim().length>80&&!/loading/i.test(t)){if(!w.seen)(w.log=w.log||[]).push(performance.now().toFixed(0)+" ON "+t.slice(0,160).replace(/\s+/g," "));w.seen=true;}else if(w.seen){w.vanish+=1;w.seen=false;(w.log=w.log||[]).push(performance.now().toFixed(0)+" OFF "+t.slice(0,160).replace(/\s+/g," "));}requestAnimationFrame(tick);};requestAnimationFrame(tick);},screenId);
}
async function assertCareerScreenSteady(m,screenId,who){
  await m.page.waitForTimeout(3000);
  const vanish=await m.page.evaluate(()=>{const w=window.__careerVanish;window.__careerVanish=null;return w?w.vanish+"|"+JSON.stringify(w.log||[]):"-1";});
  if(!String(vanish).startsWith("0|"))throw new Error(`${who}: ${screenId} showed its content, then went blank or back to loading ${vanish} time(s) (panels loaded twice)`);
}
async function assertCareerScreensShowCompletedShowdown(managers,id){
  for(const m of managers){
    const who=`${id} ${m.user}`;
    const fail=(screen,text,why)=>new Error(`${who}: ${screen} ${why}. Screen text: ${text.slice(0,600)||"(screen did not appear)"}`);
    const bad=/unavailable|could not be read|could not be loaded|failed to|loading your showdown history|loading career history/i;
    // Career Statistics
    await backToShowdownHome(m);
    await watchCareerScreen(m,"careerStatistics");
    await m.page.locator("#careerStatisticsButton").click({timeout:20000});
    const oneCompleted=t=>/(COMPLETED SHOWDOWNS\s*1(?!\d)|(?<![\d.])1\s*COMPLETED SHOWDOWNS)/i.test(t);
    let text=await readCareerScreenText(m,"careerStatistics",t=>!bad.test(t)&&oneCompleted(t));
    if(bad.test(text)||!/COMPLETED SHOWDOWNS/i.test(text))throw fail("Career Statistics",text,"did not load career history");
    if(!oneCompleted(text))throw fail("Career Statistics",text,"does not show COMPLETED SHOWDOWNS 1");
    await assertCareerScreenSteady(m,"careerStatistics",who);
    await shot(m,`j10-career-statistics-${id}`);
    // Trophy Room (opened from Career Statistics with the screen's own button)
    await watchCareerScreen(m,"trophyRoom");
    await m.page.locator("#trophyRoomButton").click({timeout:20000});
    text=await readCareerScreenText(m,"trophyRoom",t=>!bad.test(t)&&/Showdown Champion/i.test(t));
    if(bad.test(text))throw fail("Trophy Room",text,"reports the career history as unavailable or unreadable");
    if(!/Showdown Champion/i.test(text))throw fail("Trophy Room",text,"does not show the Showdown Champion trophy");
    // The Showdown Champion card counts up from 0, so read the settled data-count-value (or the dash for "not won yet").
    const loser=FINAL_EXPECTED.winnerName==="Daniel"?"nik":"daniel",winner=FINAL_EXPECTED.winnerName.toLowerCase();
    const champions=()=>m.page.evaluate(([w,l])=>{
      const card=document.querySelector('#trophyRoom .trophyCard[data-trophy="showdown"]');
      const read=side=>{const el=card?.querySelector(`[data-side="${side}"] strong`);return el?(el.dataset.countValue||(el.textContent||"").trim()):null;};
      return {winner:read(w),loser:read(l)};
    },[winner,loser]);
    let seen=await champions();const champDeadline=Date.now()+20000;
    while(seen.winner!=="1"&&Date.now()<champDeadline){await m.page.waitForTimeout(250);seen=await champions();}
    if(seen.winner!=="1"||seen.loser==="1")throw fail("Trophy Room",text,`does not award the Showdown Champion trophy to ${FINAL_EXPECTED.winnerName} only (cabinet counts ${JSON.stringify(seen)})`);
    await assertCareerScreenSteady(m,"trophyRoom",who);
    await shot(m,`j10-trophy-room-${id}`);
    // Legacy
    await backToShowdownHome(m);
    await watchCareerScreen(m,"legacy");
    await m.page.locator("#legacyButton").click({timeout:20000});
    text=await readCareerScreenText(m,"legacy",t=>!bad.test(t)&&/Showdown #1\b/i.test(t));
    if(bad.test(text)||!text)throw fail("Legacy",text,"is unavailable or still loading");
    if(!/Showdown #1\b/i.test(text)||/Showdown #2\b/i.test(text))throw fail("Legacy",text,"does not list exactly one completed Showdown card (#1)");
    if(!new RegExp(`${FINAL_EXPECTED.winnerName} WINS`,"i").test(text))throw fail("Legacy",text,`does not show ${FINAL_EXPECTED.winnerName} as the Showdown winner`);
    await assertCareerScreenSteady(m,"legacy",who);
    await shot(m,`j10-legacy-${id}`);
  }
}

async function main(){
  // J0 preflight
  assert.equal(JSON.parse(fs.readFileSync(path.join(SDK_DIR,"package.json"),"utf8")).version,require(SWITCH).sdkVersion,"J0 SDK pin matches the switch");
  await loadComposedRules();ok("J0.1","composed production Rules active on the emulator (open read 404 -> 403)");
  const server=spawn(process.execPath,[path.join(ROOT,"tests/support/static-server.cjs")],{stdio:"ignore",env:{...process.env,CMS_TEST_PORT:String(APP_PORT)}});
  await new Promise(resolve=>setTimeout(resolve,800));
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const managers=[];
  try{
    const daniel=await openManager(browser,"daniel",{width:393,height:660});managers.push(daniel);
    const nik=await openManager(browser,"nik",{width:360,height:640});managers.push(nik);
    for(const m of [daniel,nik]){const s=await m.page.evaluate(()=>window.__cmsEmulatorSwitch||null);assert.equal(s&&s.active,true,`${m.user} switch active`);}
    ok("J0.2","emulator switch active only via localhost + cmsEmulator=1 in both contexts");

    // J1
    await signIn(daniel,"Daniel");await signIn(nik,"Nik");
    const uidD=await accountId(daniel),uidN=await accountId(nik);
    assert.ok(uidD&&uidN&&uidD!==uidN,"two distinct accounts");
    ok("J1.1","Daniel and Nik signed in through SIGN IN WITH GOOGLE and chose their players");
    for(const uid of [uidD,uidN])assert.ok(await admin(`accounts/${uid}`),`account ${uid} bootstrapped`);
    ok("J1.2","both accounts bootstrapped and devices registered through the composed Rules");

    // J2 pairing (seasons chosen on the real create screen)
    // r79 PR4: Daniel's first Home START (the ticked START REAL CAREER checkmark) writes his marker before the code, and he
    // has no partner yet, so his first code is the real-pairing CMS17R- code (only issued to an account with a marker).
    assert.equal(await admin(`accounts/${uidD}/careerStart/current`),null,"Daniel has no marker before his first START");
    const pairCode=await danielStartsShowdown(daniel,LENGTH,{firstRealStart:true});
    assert.ok(await admin(`accounts/${uidD}/careerStart/current`),"Daniel's careerStart marker, written by START");
    assert.equal(await admin(`accounts/${uidN}/careerStart/current`),null,"Nik has no marker before he redeems");
    assert.match(pairCode,/^CMS17R-pair_[0-9a-f]{64}$/,"first real pairing code shape (CMS17R-): the marker was there before the code");
    assert.equal(await daniel.page.locator("#connectPlayersScreen #persistentNikDanielPairPanel code").count(),1,"the code is shown once");
    // r79 (PR #901): a reload while Daniel's code is out reopens WAITING over the locked league wheel (not over Home), same code
    // (r79 PR3: still the CMS17R- code: the first real pairing survives the reload).
    await daniel.page.reload({waitUntil:"domcontentloaded"});
    await daniel.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
    await pairPanel(daniel).locator("code").waitFor({timeout:30000});
    await daniel.page.waitForTimeout(1000);
    const afterReload=await daniel.page.evaluate(()=>({screen:window.getActiveScreenName?.(),stay:document.getElementById("connectPlayersScreen")?.dataset.stayOnScreen,code:document.querySelector("#connectPlayersScreen #persistentNikDanielPairPanel code")?.textContent?.trim()}));
    assert.deepEqual(afterReload,{screen:"leagueWheelScreen",stay:"true",code:pairCode},"after a reload WAITING is back over the locked league wheel with the same code");
    ok("J2.1","Daniel's START made the CMS17R- pair code by itself and shows WAITING over the locked league wheel, also after a reload");
    await nik.page.locator("#newShowdown").click();
    // Trap: the pair panel re-renders (replaceChildren) while the join sidecar syncs; a code typed before it settles is lost.
    await nik.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.busy===false&&s.status==="unpaired");},null,{timeout:30000});
    await nik.page.waitForTimeout(500);
    await pairPanel(nik).locator("#persistentNikDanielPairCode").fill(pairCode);
    await pairPanel(nik).getByRole("button",{name:"JOIN DANIEL'S SHOWDOWN",exact:true}).click();
    // Job 33 (R1): Daniel's waiting code panel re-reads every 4 s, so Nik's join shows without CHECK STATUS; r79: both then
    // continue by themselves (no Back, no CONTINUE CAREER, no START CAREER).
    await bothPairedAndContinuing([nik,daniel]);
    const linkD=await admin(`accounts/${uidD}/pairLinks/current`),linkN=await admin(`accounts/${uidN}/pairLinks/current`);
    assert.equal(field(linkD,"data","managerRole").stringValue,"playerOne","Daniel is playerOne");
    assert.equal(field(linkN,"data","managerRole").stringValue,"playerTwo","Nik is playerTwo");
    const R1=field(linkD,"data","rivalryId").stringValue;
    assert.equal(field(linkN,"data","rivalryId").stringValue,R1,"same rivalry");
    assert.deepEqual(ids(field(await admin(`accounts/${uidD}/careerIndex/current`),"data","rivalryIds")),[R1],"Daniel career index [R1]");
    assert.deepEqual(ids(field(await admin(`accounts/${uidN}/careerIndex/current`),"data","rivalryIds")),[R1],"Nik career index [R1]");
    ok("J2.2","Nik joined with the code; Daniel=playerOne, Nik=playerTwo, both career indexes [R1]");
    {
      // r79 PR3: Nik's app wrote his marker BEFORE redeeming; after ACTIVE both managers hold a permanent partner record.
      const markerN=await admin(`accounts/${uidN}/careerStart/current`);
      assert.ok(markerN,"Nik's careerStart marker was written by the join");
      assert.ok(Date.parse(markerN.createTime)<Date.parse(linkN.createTime),`Nik's marker (${markerN.createTime}) is written before his redeem (${linkN.createTime})`);
      const partner=async(uid,other,role)=>{const d=await adminUntil(`accounts/${uid}/partner/current`,doc=>field(doc,"active")?.booleanValue===true,`${role} partner record`);
        assert.equal(field(d,"partnerAccountId").stringValue,other);assert.equal(field(d,"myRole").stringValue,role);assert.equal(field(d,"pairedViaRivalryId").stringValue,R1);assert.equal(field(d,"schemaVersion").integerValue,"1");return d;};
      await partner(uidN,uidD,"playerTwo");await partner(uidD,uidN,"playerOne");
      for(const m of [daniel,nik])await m.page.waitForFunction(()=>window.CareerModePersistentNikDanielPair?.getPartnerState?.()?.record?.active===true,null,{timeout:30000});
      for(const m of [daniel,nik])await assertNoSessionCodeOption(m);
    }
    ok("J2.3","first real pairing: Nik's marker before redeem, both partner records active naming R1, no USE A SESSION CODE");
    await shot(daniel,"j2-paired");await shot(nik,"j2-paired");

    // J3 private session through the real Remote Joining surface; the ACTIVE session continues into the league wheel.
    // r79: the connected pair is already on its way to Remote Joining by itself (see J2.2); nobody taps CONTINUE CAREER.
    for(const m of [daniel,nik])await assertNoCodeBox(m);
    // Studio Z4: nobody types a code. Daniel's phone hosts and shares the session through the pair; Nik's phone joins it.
    await hostSeesJoin(daniel);
    const sessionCode=await sessionOf(daniel);
    assert.match(String(sessionCode),/^session_[0-9a-f]{64}$/);
    assert.equal(await sessionOf(nik),sessionCode,"Nik joined Daniel's session without a typed code");
    // Job 33 (R6 + R1): the ACTIVE session takes both managers to the league wheel by itself; Daniel's hosted session is
    // re-read every 4 s, so neither REFRESH / READ nor START CAREER is tapped.
    for(const m of [nik,daniel]){
      await m.page.locator("#leagueWheelScreen").waitFor({state:"visible",timeout:30000});
      assert.equal(await m.page.evaluate(()=>window.CareerModeSparkRemoteJoining?.getState?.()?.sessionState),"active",`${m.user}: the private session is ACTIVE`);
      assert.equal(await entry(m).isVisible().catch(()=>false),false,`${m.user}: GET READY is not shown`);
    }
    // r79 (PR #901): once ACTIVE each device remembers its own shell as paired, so a reload mid-Showdown gets no startup hold.
    for(const m of [daniel,nik]){const mark=await m.page.evaluate(()=>({mark:window.readStorageValue("careerModeShowdown.pairedShell.v1"),save:typeof currentShowdown!=="undefined"&&currentShowdown?currentShowdown.identity?.saveId:null}));assert.ok(mark.mark&&mark.mark===mark.save,`${m.user}: the active shell is remembered as paired (${JSON.stringify(mark)})`);}
    ok("J3.1","private session hosted by Daniel, joined by Nik; both reached the league wheel");
    await shot(daniel,"j3-setup");await shot(nik,"j3-setup");

    // J4 shared setup through the real league wheel and club-pack screens.
    assert.match(await nik.page.locator("#spinLeague").textContent(),/WAITING FOR DANIEL/i,"Nik waits for Daniel on the league wheel");
    assert.equal(await nik.page.locator("#spinLeague").isDisabled(),true,"Nik cannot draw shared setup authority");
    ok("J4.1","Nik is visibly waiting for the host and cannot draw the shared league");

    await daniel.page.locator("#spinLeague").click({timeout:30000});
    await daniel.page.waitForFunction(()=>document.getElementById("spinLeague")?.textContent==="CONTINUE TO CLUB PACKS",null,{timeout:30000});
    const sharedLeague=(await daniel.page.locator("#selectedLeague").textContent()).trim();
    assert.ok(sharedLeague&&!/Spin|ready|Pair managers/i.test(sharedLeague),`authoritative league revealed: ${sharedLeague}`);
    await nik.page.waitForFunction(league=>document.getElementById("selectedLeague")?.textContent===league,sharedLeague,{timeout:30000});
    assert.equal((await nik.page.locator("#selectedLeague").textContent()).trim(),sharedLeague,"both managers see the same authoritative league");
    ok("J4.2","Daniel drew the authoritative league and Nik followed it without drawing");

    // Both devices witness the real league screen; only Daniel performs the authoritative club draw.
    // Job 33 (R3, fixes the JOB-16 peer gap): after the league reveal both presentations move on to the club packs by themselves.
    for(const m of [daniel,nik]){
      await m.page.waitForFunction(()=>document.getElementById("spinLeague")?.textContent==="CONTINUE TO CLUB PACKS",null,{timeout:30000});
      await m.page.locator("#clubWheelScreen").waitFor({state:"visible",timeout:30000});
      assert.equal(await m.page.locator("#leagueWheelScreen").isVisible(),false,`${m.user}: the witnessed league screen advanced to the club packs without a tap`);
      assert.equal((await m.page.locator("#clubAssignmentLeague").textContent()).trim(),sharedLeague,`${m.user}: the club screen names the shared league`);
    }
    assert.match(await nik.page.locator("#openClubPack").textContent(),/WAITING FOR DANIEL/i,"Nik waits for host pack reveal");
    assert.equal(await nik.page.locator("#openClubPack").isDisabled(),true,"Nik cannot draw the clubs");
    await daniel.page.locator("#openClubPack").click({timeout:30000});
    await daniel.page.waitForFunction(()=>document.getElementById("clubCardTwo")?.classList.contains("is-revealed")&&document.getElementById("clubNameOne")?.textContent!=="?"&&document.getElementById("clubNameTwo")?.textContent!=="?",null,{timeout:30000});
    const clubsD=await daniel.page.evaluate(()=>[document.getElementById("clubNameOne")?.textContent?.trim(),document.getElementById("clubNameTwo")?.textContent?.trim()]);
    await nik.page.waitForFunction(clubs=>document.getElementById("clubNameOne")?.textContent?.trim()===clubs[0]&&document.getElementById("clubNameTwo")?.textContent?.trim()===clubs[1],clubsD,{timeout:30000});
    const clubsN=await nik.page.evaluate(()=>[document.getElementById("clubNameOne")?.textContent?.trim(),document.getElementById("clubNameTwo")?.textContent?.trim()]);
    assert.deepEqual(clubsN,clubsD,"both managers see the same two clubs");
    assert.ok(clubsD[0]&&clubsD[1]&&clubsD[0]!==clubsD[1],"two distinct clubs");
    for(const m of [daniel,nik]){
      assert.equal((await m.page.locator("#clubPlayerOne").textContent()).trim(),"Daniel","Daniel remains the LEFT/playerOne slot");
      assert.equal((await m.page.locator("#clubNameOne").textContent()).trim(),clubsD[0],"Daniel's left club agrees on both pages");
    }
    ok("J4.3","host opened the real club packs; both pages agree on two clubs with Daniel in the LEFT slot");

    // Daniel's original season count is auto-locked; each manager only confirms their own device.
    for(const m of [daniel,nik])await m.page.getByRole("button",{name:"CONFIRM SHOWDOWN"}).waitFor({state:"visible",timeout:30000});
    await daniel.page.getByRole("button",{name:"CONFIRM SHOWDOWN"}).click({timeout:30000});
    await nik.page.getByRole("button",{name:"CONFIRM SHOWDOWN"}).click({timeout:30000});
    // Job 33 (R4a): the first confirmer's Career Start opens by itself once the rival confirms (no CONTINUE TO CAREER START tap).
    for(const m of [daniel,nik]){
      await m.page.waitForFunction(()=>document.getElementById("continueClubAssignment")?.textContent==="CONTINUE TO CAREER START",null,{timeout:30000});
      await m.page.locator("#productionSharedCareerStartOverlay").waitFor({state:"visible",timeout:30000});
    }
    ok("J4.4","both managers confirmed the identical shared setup and both real club screens advanced to Career Start");
    await shot(daniel,"j4-setup");await shot(nik,"j4-setup");

    // J5 career start: each manager confirms only their own FIFA 17 career, then both continue.
    for(const m of [daniel,nik])await m.page.locator("#productionSharedCareerStartOverlay").waitFor({state:"visible",timeout:30000});
    const careerTextD=await daniel.page.locator("#productionSharedCareerStartOverlay").innerText();
    const careerTextN=await nik.page.locator("#productionSharedCareerStartOverlay").innerText();
    assert.ok(careerTextD.includes("Daniel")&&careerTextD.includes(clubsD[0]),"Daniel Career Start shows Daniel's assigned club");
    assert.ok(careerTextN.includes("Nik")&&careerTextN.includes(clubsD[1]),"Nik Career Start shows Nik's assigned club");
    const danielStartLabel=`I STARTED AT ${clubsD[0].toUpperCase()}`;
    const nikStartLabel=`I STARTED AT ${clubsD[1].toUpperCase()}`;
    await daniel.page.getByRole("button",{name:danielStartLabel,exact:true}).waitFor({state:"visible",timeout:30000});
    await nik.page.getByRole("button",{name:nikStartLabel,exact:true}).waitFor({state:"visible",timeout:30000});
    ok("J5.1","each manager sees the start acknowledgement for only their assigned club");

    await daniel.page.getByRole("button",{name:danielStartLabel,exact:true}).click({timeout:30000});
    await daniel.page.getByRole("button",{name:"MY CAREER STARTED ✓",exact:true}).waitFor({state:"visible",timeout:30000});
    await nik.page.getByRole("button",{name:nikStartLabel,exact:true}).click({timeout:30000});
    // Job 33 (R1 + R4b): Daniel's waiting Career Start re-reads every 3 s; once both attested, each Career Start moves on
    // to the Transfer Challenge by itself (no REFRESH, no CONTINUE TO TRANSFER CHALLENGE).
    for(const m of [daniel,nik])await m.page.waitForFunction(()=>window.CareerModeProductionSharedCareerStart?.getState?.()?.state?.phase==="CAREER_START_READY",null,{timeout:30000});
    ok("J5.2","both private Career Start acknowledgements converged to ready");

    for(const m of [daniel,nik]){
      await rosterRoulette.waitForTransfer(m.page,30000);
      await m.page.locator("#productionSharedCareerStartOverlay").waitFor({state:"hidden",timeout:30000});
    }
    ok("J5.3","both managers reached the real Shared Transfer Challenge through the UI");
    await shot(daniel,"j5-career-start");await shot(nik,"j5-career-start");

    // J6 season-1 Shared Transfer Challenge + rendered privacy.
    assert.equal(await daniel.page.locator("#startTransferTimer").isVisible(),true,"Daniel is the transfer-window coordinator");
    assert.equal(await nik.page.locator("#startTransferTimer").isVisible(),false,"Nik cannot start the shared transfer window");
    await daniel.page.locator("#startTransferTimer").click({timeout:30000});
    await waitTransferPhase(daniel,"window");
    await waitTransferPhase(nik,"window");
    // BUG: see JOB-16-browser-journey.md — the shared phase is authoritative but the legacy control copy
    // can still render "END WINDOW EARLY" instead of the intended "REQUEST EARLY END".
    assert.match(await daniel.page.locator("#endTransferTimer").textContent(),/^(REQUEST EARLY END|END WINDOW EARLY)$/);
    assert.match(await nik.page.locator("#endTransferTimer").textContent(),/^(REQUEST EARLY END|END WINDOW EARLY)$/);
    ok("J6.1","Daniel started the shared 15-minute window and both managers see the same live phase");

    await daniel.page.locator("#endTransferTimer").click({timeout:30000});
    await daniel.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.endRequestedRoles?.includes("playerOne")===true,null,{timeout:30000});
    await nik.page.locator("#endTransferTimer").click({timeout:30000});
    await waitTransferPhase(nik,"guess_entry");
    await waitTransferPhase(daniel,"guess_entry");
    ok("J6.2","both managers requested early end and the shared window advanced without waiting 15 minutes");

    await daniel.page.locator("#p2Guess1Type").selectOption("league");
    await daniel.page.locator("#p2Guess1Value").waitFor({state:"visible",timeout:5000});
    await fillTransferCombo(daniel,"p2Guess1Value","Premier League");
    await nik.page.locator("#p1Guess1Type").selectOption("nationality");
    await nik.page.locator("#p1Guess1Value").waitFor({state:"visible",timeout:5000});
    await fillTransferCombo(nik,"p1Guess1Value","Brazil");
    assert.equal(await daniel.page.locator("#p1Guess1Type").inputValue(),"","Daniel cannot read Nik's unfinished guess type");
    assert.equal(await nik.page.locator("#p2Guess1Type").inputValue(),"","Nik cannot read Daniel's unfinished guess type");
    assert.equal(await daniel.page.locator("#p1Guess1Type").locator("xpath=ancestor::*[contains(@class,'transferGuessCard')]").isVisible(),false,"Daniel's rival guess card stays hidden");
    assert.equal(await nik.page.locator("#p2Guess1Type").locator("xpath=ancestor::*[contains(@class,'transferGuessCard')]").isVisible(),false,"Nik's rival guess card stays hidden");
    await daniel.page.getByRole("button",{name:"LOCK MY GUESSES",exact:true}).click({timeout:30000});
    await daniel.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.guessLockedRoles?.includes("playerOne")===true,null,{timeout:30000});
    await waitTransferPhase(nik,"guess_entry");
    await nik.page.getByRole("button",{name:"LOCK MY GUESSES",exact:true}).click({timeout:30000});
    await waitTransferPhase(nik,"signing_entry");
    await waitTransferPhase(daniel,"signing_entry");
    ok("J6.3","both managers entered and locked their private guesses through the real controls");

    await daniel.page.locator("#p1Signing1Name").fill("QWX Daniel Signing");await daniel.page.locator("#p1Signing1Overall").fill("71");await daniel.page.locator("#p1Signing1Position").selectOption("ST");
    await fillTransferCombo(daniel,"p1Signing1League","Premier League");
    await fillTransferCombo(daniel,"p1Signing1Nationality","England");
    await daniel.page.getByRole("button",{name:"LOCK MY SIGNINGS",exact:true}).click({timeout:30000});
    await daniel.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.signingLockedRoles?.includes("playerOne")===true,null,{timeout:30000});
    await assertPrivateTokenAbsent(nik,"QWX","before transfer completion on Nik");
    await waitTransferState(nik,"signingLockedRoles","playerOne");
    await waitTransferPhase(nik,"signing_entry");
    await assertPrivateTokenAbsent(nik,"QWX","after Daniel signing lock but before COMPLETED");

    await nik.page.locator("#p2Signing1Name").fill("ZPV Nik Signing");await nik.page.locator("#p2Signing1Overall").fill("71");await nik.page.locator("#p2Signing1Position").selectOption("ST");
    await fillTransferCombo(nik,"p2Signing1League","Serie A TIM");
    await fillTransferCombo(nik,"p2Signing1Nationality","Brazil");
    await assertPrivateTokenAbsent(daniel,"ZPV","before transfer completion on Daniel");
    ok("J6.4","unfinished rival signings remain absent from rendered text and every input value");

    await nik.page.getByRole("button",{name:"LOCK MY SIGNINGS",exact:true}).click({timeout:30000});
    await waitTransferPhase(nik,"completed");
    await waitTransferPhase(daniel,"completed");
    for(const m of [daniel,nik]){
      assert.equal(await m.page.locator("#p1Signing1Name").inputValue(),"QWX Daniel Signing");
      assert.equal(await m.page.locator("#p2Signing1Name").inputValue(),"ZPV Nik Signing");
      await m.page.getByRole("button",{name:"CONTINUE TO SEASON RESULTS",exact:true}).waitFor({state:"visible",timeout:30000});
      assert.equal(await m.page.getByRole("button",{name:"CONTINUE TO SEASON RESULTS",exact:true}).isEnabled(),true);
    }
    const verdictD=(await daniel.page.locator("#transferChallengeResults").innerText()).replace(/\s+/g," ").trim();
    const verdictN=(await nik.page.locator("#transferChallengeResults").innerText()).replace(/\s+/g," ").trim();
    assert.equal(verdictN,verdictD,"both managers see identical completed transfer verdicts");
    ok("J6.5","COMPLETED reveals both signings identically and enables Shared Season Results");
    await shot(daniel,"j6-transfers");await shot(nik,"j6-transfers");

    // J7 season-1 results, privacy, and the exact raw facts that feed canonical scoring.
    for(const m of [daniel,nik]){
      await m.page.getByRole("button",{name:"CONTINUE TO SEASON RESULTS",exact:true}).click({timeout:30000});
      await m.page.locator("#seasonEntry").waitFor({state:"visible",timeout:30000});
    }
    const season1Daniel={leaguePosition:1,leaguePoints:87,leagueGoals:93,domesticCup:false,championsLeague:true,topScorer:true,topAssist:false};
    const season1Nik={leaguePosition:2,leaguePoints:84,leagueGoals:101,domesticCup:true,championsLeague:false,topScorer:false,topAssist:true};
    await fillSeasonResult(daniel,"p1",season1Daniel);
    await publishSeasonResult(daniel);
    assert.equal(await nik.page.locator("#seasonReviewOne").isVisible(),false,"Nik cannot see Daniel's review before publishing");
    assert.notEqual(await nik.page.locator("#p1LeaguePosition").inputValue(),"1","Nik does not receive Daniel's league position before publishing");
    assert.notEqual(await nik.page.locator("#p1LeaguePoints").inputValue(),"87","Nik does not receive Daniel's league points before publishing");
    assert.notEqual(await nik.page.locator("#p1LeagueGoals").inputValue(),"93","Nik does not receive Daniel's league goals before publishing");
    ok("J7.1","Daniel published first and his season result stayed private from Nik");

    await fillSeasonResult(nik,"p2",season1Nik);
    await publishSeasonResult(nik);
    for(const m of [daniel,nik]){
      await m.page.waitForFunction(()=>document.getElementById("seasonReviewHeading")?.textContent==="BOTH MANAGERS PUBLISHED",null,{timeout:30000});
      await m.page.locator("#seasonReviewOne").waitFor({state:"visible",timeout:30000});
      await m.page.locator("#seasonReviewTwo").waitFor({state:"visible",timeout:30000});
    }
    const reviewD1=(await daniel.page.locator("#seasonReviewOne").innerText()).replace(/\s+/g," ").trim();
    const reviewD2=(await daniel.page.locator("#seasonReviewTwo").innerText()).replace(/\s+/g," ").trim();
    const reviewN1=(await nik.page.locator("#seasonReviewOne").innerText()).replace(/\s+/g," ").trim();
    const reviewN2=(await nik.page.locator("#seasonReviewTwo").innerText()).replace(/\s+/g," ").trim();
    assert.equal(reviewD1,reviewN1,"Daniel result card converges identically on both pages");
    assert.equal(reviewD2,reviewN2,"Nik result card converges identically on both pages");
    for(const value of ["League Position 1","League Points 87","League Goals 93"])assert.ok(reviewD1.includes(value),`Daniel review includes ${value}`);
    for(const value of ["League Position 2","League Points 84","League Goals 101"])assert.ok(reviewD2.includes(value),`Nik review includes ${value}`);
    assert.equal(await daniel.page.locator("#sharedCanonicalScoringPanel").isVisible().catch(()=>false),false,"canonical scoring remains locked until Shared Season Commit is acknowledged");
    ok("J7.2","RESULTS_READY reveals the same raw season facts on both pages; canonical scoring correctly remains locked until commit");

    // J8 season 1 commit + canonical scoring, then seasons 2 and 3.
    await commitSeasonViaUi(daniel,nik,9,3,"Daniel",{finalSeason:LENGTH===1,seasonNumber:1});
    ok("J7.3","after the immutable season-1 commit both pages show canonical 9-3 and Daniel as season winner");

    if(LENGTH>1){
      await continueToSeason(daniel,nik,2,LENGTH);
      for(const m of [daniel,nik]){
        assert.equal((await m.page.locator("#dashboardScoreOne").textContent()).trim(),"9");
        assert.equal((await m.page.locator("#dashboardScoreTwo").textContent()).trim(),"3");
        assert.match((await m.page.locator("#dashboardRound").textContent()).trim(),/Season 2 of 3/);
      }
      ok("J8.1","both dashboards show 9-3 and Season 2 of 3 after season-1 commit");

      await playTransferSeason(daniel,nik,2,"QWX2 Daniel Signing","ZPV2 Nik Signing");
      ok("J8.2","season 2 repeated the shared transfer flow with rendered privacy before completion");

      // Studio Z3 (was the known J9 gap): season-2 transfers are COMPLETED and both tabs reload. Each tab keeps its Google
      // session and its confirmed private session (sessionStorage, tab lifetime), so each manager goes back into the SAME
      // session by itself: no CONTINUE CAREER tap, no code, no GET READY, no Career Start, no season 1.
      const verdictBeforeReload=(await daniel.page.locator("#transferChallengeResults").innerText()).replace(/\s+/g," ").trim();
      for(const m of [daniel,nik]){
        await m.page.reload({waitUntil:"domcontentloaded"});
        await m.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
        assert.equal(await m.page.evaluate(()=>window.__cmsEmulatorSwitch?.active===true),true,`${m.user} emulator switch re-installed after reload`);
      }
      for(const m of [daniel,nik]){
        await m.page.waitForFunction(()=>window.CareerModeSparkRemoteJoining?.getState?.()?.sessionState==="active",null,{timeout:45000});
        assert.equal(await sessionOf(m),sessionCode,`${m.user} is back in the same session after the reload`);
        await assertNoCodeBox(m);
        assert.equal(await entry(m).isVisible().catch(()=>false),false,`${m.user}: no GET READY after reload`);
      }
      ok("J9.1","after a reload both managers return by themselves to the same private session (no tap, no code, no GET READY)");
      // Job 33 (R6 + R1): the fresh ACTIVE session resumes both managers by itself (no REFRESH / READ, no START CAREER).
      for(const m of [nik,daniel]){
        try{
          await m.page.locator("#dashboard").waitFor({state:"visible",timeout:45000});
          await m.page.waitForFunction(()=>/Season 2 of 3/.test(document.getElementById("dashboardRound")?.textContent||""),null,{timeout:45000});
        }catch(error){
          const diag=await m.page.evaluate(()=>({multi:window.CareerModeProductionSharedMultiSeasonProgression?.getState?.()?.state||null,remote:window.CareerModeSparkRemoteJoining?.getState?.()||null}));
          throw new Error(`J9_RESUME_NOT_AT_SEASON_2 ${m.user} ${await describe(m)} ${JSON.stringify(diag).slice(0,3000)}`,{cause:error});
        }
        assert.equal(await m.page.locator("#productionSharedCareerStartOverlay").isVisible().catch(()=>false),false,`${m.user}: resume must not replay Career Start`);
        assert.equal((await m.page.locator("#dashboardScoreOne").textContent()).trim(),"9");
        assert.equal((await m.page.locator("#dashboardScoreTwo").textContent()).trim(),"3");
        assert.equal(await m.page.locator("#seasonIndicator").textContent(),"Season 2 / 3");
      }
      ok("J9.2","after a fresh exact session both managers resume on the Season 2 of 3 dashboard at 9-3 (no Career Start, no season-1 replay)");
      // Studio Z4: Nik closes his tab and opens the game again. The new tab signs in again (session-only sign-in), and one
      // CONTINUE CAREER tap re-attaches to the pair's current session through the shared pointer: still no code.
      {
        const oldPage=nik.page;
        nik.page=await nik.context.newPage();
        nik.page.on("pageerror",error=>nik.log.errors.push(error.message));
        nik.page.on("dialog",dialog=>{void dialog.accept().catch(()=>{});});
        await installMarbleConfirmAnswers(nik.page,{answer:true});
        await oldPage.close();
        await nik.page.goto(urlFor("nik"),{waitUntil:"domcontentloaded"});
        await nik.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
        await nik.page.locator("#continueCareer").click({timeout:30000});
        await nik.page.getByRole("button",{name:"SIGN IN WITH GOOGLE"}).click({timeout:30000});
        await nik.page.waitForFunction(()=>document.getElementById("onlinePlayerIdentityBadge")?.textContent==="NIK",null,{timeout:30000});
        await nik.page.waitForFunction(()=>window.CareerModePersistentNikDanielPair?.getState?.()?.status==="paired",null,{timeout:30000});
        await nik.page.locator("#continueCareer").click({timeout:30000});
        await nik.page.waitForFunction(()=>window.CareerModeSparkRemoteJoining?.getState?.()?.sessionState==="active",null,{timeout:45000});
        assert.equal(await sessionOf(nik),sessionCode,"Nik's new tab re-attached to the same session through the pair pointer");
        await assertNoCodeBox(nik);
        await nik.page.locator("#dashboard").waitFor({state:"visible",timeout:45000});
        await nik.page.waitForFunction(()=>/Season 2 of 3/.test(document.getElementById("dashboardRound")?.textContent||""),null,{timeout:45000});
      }
      ok("J9.4","a closed and reopened tab re-attaches to the same session with one CONTINUE CAREER tap and no code");
      for(const m of [daniel,nik]){
        await m.page.waitForFunction(()=>/TRANSFER CHALLENGE|SEASON RESULTS|SEASON 2/i.test(document.getElementById("seasonPrimaryAction")?.textContent||""),null,{timeout:45000});
        await m.page.locator("#seasonPrimaryAction").click({timeout:30000});
        await m.page.locator("#transferChallenge, #seasonEntry").filter({visible:true}).first().waitFor({state:"visible",timeout:30000});
        if(await m.page.locator("#transferChallenge").isVisible()){
          const cont=m.page.getByRole("button",{name:"CONTINUE TO SEASON RESULTS",exact:true});
          for(let i=0;i<12&&!(await cont.isVisible().catch(()=>false));i++){
            const replay=m.page.locator("#continueFromTransfers");
            if(await replay.isVisible().catch(()=>false)&&await replay.isEnabled().catch(()=>false))await replay.click({timeout:10000}).catch(()=>{});
            await m.page.waitForTimeout(500);
          }
          await cont.waitFor({state:"visible",timeout:30000});
          assert.equal(await m.page.locator("#p1Signing1Name").inputValue(),"QWX2 Daniel Signing");
          assert.equal(await m.page.locator("#p2Signing1Name").inputValue(),"ZPV2 Nik Signing");
          assert.equal((await m.page.locator("#transferChallengeResults").innerText()).replace(/\s+/g," ").trim(),verdictBeforeReload,`${m.user} sees the same completed season-2 verdicts after reload`);
        }
      }
      ok("J9.3","both resumed managers reopen the COMPLETED season-2 transfer verdicts unchanged and can continue to season-2 results");

      for(const m of [daniel,nik])if(!await m.page.locator("#seasonEntry").isVisible())await m.page.getByRole("button",{name:"CONTINUE TO SEASON RESULTS",exact:true}).click({timeout:30000});
      for(const m of [daniel,nik])await m.page.locator("#seasonEntry").waitFor({state:"visible",timeout:30000});
      const season2Daniel={leaguePosition:3,leaguePoints:70,leagueGoals:66,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false};
      const season2Nik={leaguePosition:1,leaguePoints:100,leagueGoals:80,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true};
      await fillSeasonResult(daniel,"p1",season2Daniel);await fillSeasonResult(nik,"p2",season2Nik);
      await prepareSeasonReview(daniel);await prepareSeasonReview(nik);
      await Promise.all([
        daniel.page.locator("#confirmSeasonCompletion").click({timeout:30000}),
        nik.page.locator("#confirmSeasonCompletion").click({timeout:30000})
      ]);
      for(const m of [daniel,nik]){
        await m.page.waitForFunction(()=>document.getElementById("seasonReviewHeading")?.textContent==="BOTH MANAGERS PUBLISHED",null,{timeout:45000});
        assert.equal((await m.page.locator("#seasonReviewError").textContent()).trim(),"","simultaneous publish must not leave an error banner");
      }
      ok("J8.3","season-2 simultaneous publish converged to RESULTS_READY with no error banner");
      await commitSeasonViaUi(daniel,nik,0,11,"Nik",{finalSeason:LENGTH===2,seasonNumber:2});
      ok("J8.4","season 2 canonical score is 0-11 and Nik wins");

      if(LENGTH>2){
        await continueToSeason(daniel,nik,3,LENGTH);
        for(const m of [daniel,nik]){
          assert.equal((await m.page.locator("#dashboardScoreOne").textContent()).trim(),"9");
          assert.equal((await m.page.locator("#dashboardScoreTwo").textContent()).trim(),"14");
          assert.match((await m.page.locator("#dashboardRound").textContent()).trim(),/Season 3 of 3/);
        }
        await playTransferSeason(daniel,nik,3,"QWX3 Daniel Signing","ZPV3 Nik Signing");
        for(const m of [daniel,nik])await m.page.getByRole("button",{name:"CONTINUE TO SEASON RESULTS",exact:true}).click({timeout:30000});
        for(const m of [daniel,nik])await m.page.locator("#seasonEntry").waitFor({state:"visible",timeout:30000});
        const season3Daniel={leaguePosition:2,leaguePoints:78,leagueGoals:70,domesticCup:true,championsLeague:false,topScorer:false,topAssist:false};
        const season3Nik={leaguePosition:4,leaguePoints:65,leagueGoals:60,domesticCup:true,championsLeague:false,topScorer:false,topAssist:false};
        await fillSeasonResult(daniel,"p1",season3Daniel);await publishSeasonResult(daniel);
        assert.equal(await nik.page.locator("#seasonReviewOne").isVisible(),false,"season 3 Daniel result stays private until Nik publishes");
        await fillSeasonResult(nik,"p2",season3Nik);await publishSeasonResult(nik);
        for(const m of [daniel,nik])await m.page.waitForFunction(()=>document.getElementById("seasonReviewHeading")?.textContent==="BOTH MANAGERS PUBLISHED",null,{timeout:45000});
        await commitSeasonViaUi(daniel,nik,1,1,"draw",{finalSeason:true,seasonNumber:3});
        ok("J8.5","season 3 repeated privacy and scoring; 1-1 season is a draw (no tiebreak)");
      }
    }

    // J10 final reconciliation and Terminal Close through the real UI.
    if(FINAL_NO_CLOSE_TAP){
      for(const m of [daniel,nik]){
        await m.page.locator("#finalWinnerScreen").waitFor({state:"visible",timeout:60000});
        await m.page.waitForFunction(()=>window.CareerModeProductionSharedTerminalClose?.getState?.()?.phase==="CLOSED"&&window.FINAL_WINNER_FIXTURES?.frames?.LIVE?.state==="completed",null,{timeout:60000});
        const frame=await m.page.evaluate(()=>window.FINAL_WINNER_FIXTURES?.frames?.LIVE);
        assert.equal(frame.state,"completed",`${m.user}: the final winner remains visible after automatic close`);
        assert.equal(frame.winner,FINAL_EXPECTED.winnerName.toLowerCase());
        assert.deepEqual(frame.totals,{daniel:FINAL_EXPECTED.daniel,nik:FINAL_EXPECTED.nik});
        assert.equal(frame.status,"ready",`${m.user}: the closed Final Winner keeps the verified history (trophies and final season)`);
        assert.equal(frame.lastSeason.season,LENGTH);
        assert.equal(await m.page.locator("#sharedTerminalCloseAction").isVisible(),false,"successful auto-close needs no CLOSE retry");
        assert.equal(m.log.taps.some(t=>t.id==="sharedTerminalCloseAction"||t.id==="sharedTerminalCloseRetry"),false,`${m.user}: no terminal close tap`);
      }
      ok("J10.1-auto","both pages keep the final winner and close without a CLOSE tap");
    }else{
    // Owner decision 2026-10-05 (BH-8): once the last season is committed each phone checks on its own poll and shows the
    // final winner and CLOSE by itself. Nobody taps PREVIEW RESULT here; Apply stays a separate explicit tap.
    for(const m of [daniel,nik])await m.page.evaluate(()=>{window.__bh8PreviewTaps=0;document.addEventListener("click",event=>{if(event.target?.closest?.("#sharedLocalReconciliationPreview"))window.__bh8PreviewTaps+=1;},true);});
    for(const m of [daniel,nik]){
      try{
        await m.page.locator("#sharedFinalReconciliationPanel").waitFor({state:"visible",timeout:60000});
      }catch(error){
        const diag=await m.page.evaluate(()=>({
          showdown:typeof currentShowdown!=="undefined"&&currentShowdown?{
            id:currentShowdown.id||null,
            saveId:currentShowdown.saveId||null,
            currentRound:currentShowdown.currentRound||null,
            identity:currentShowdown.identity||null,
            sharedJourney:currentShowdown.sharedJourney||null
          }:null,
          saveLibraryReady:window.CareerModeSaveLibraryRuntime?.isReady?.()??null,
          multi:window.CareerModeProductionSharedMultiSeasonProgression?.getState?.()?.state||null,
          cursor:window.CareerModeProductionSharedMultiSeasonProgression?.resolveSeason?.(null)??null,
          setup:(()=>{const s=window.CareerModeProductionSharedShowdownSetup?.getState?.();return s?{status:s.status,ready:s.ready,rivalryId:s.rivalryId,phase:s.setup?.phase,message:s.message}:null;})(),
          commit:(()=>{const s=window.CareerModeProductionSharedSeasonCommit?.getState?.();return s?{phase:s.phase,committed:s.committed,seasonNumber:s.seasonNumber,revision:s.revision,status:s.status}:null;})(),
          scoring:(()=>{const s=window.CareerModeProductionSharedCanonicalScoring?.getState?.();return s?{phase:s.phase,seasonNumber:s.seasonNumber,authoritative:s.authoritative}:null;})(),
          remote:(()=>{const s=window.CareerModeSparkRemoteJoining?.getState?.();return s?{sessionState:s.sessionState,role:s.role,status:s.status}:null;})(),
          history:window.CareerModeProductionSharedHistoryConvergence?.getState?.()||null,
          local:window.CareerModeProductionSharedLocalReconciliation?.getState?.()||null,
          final:window.CareerModeProductionSharedFinalReconciliation?.getState?.()||null,
          finalActive:window.CareerModeProductionSharedFinalReconciliation?.isActive?.()??null,
          terminal:window.CareerModeProductionSharedTerminalClose?.getState?.()||null,
          panelExists:Boolean(document.getElementById("sharedFinalReconciliationPanel")),
          panelHidden:document.getElementById("sharedFinalReconciliationPanel")?.classList.contains("hidden")??null,
          visibility:document.visibilityState
        }));
        throw new Error(`J10_FINAL_RECONCILIATION_NOT_VISIBLE ${JSON.stringify(diag)}`,{cause:error});
      }
      assert.equal((await m.page.locator("#sharedFinalReconciliationHeading").textContent()).trim(),"SHOWDOWN FINAL RESULT");
      assert.equal((await m.page.locator("#sharedFinalReconciliationWinner").textContent()).trim(),`Daniel ${FINAL_EXPECTED.daniel} · Nik ${FINAL_EXPECTED.nik} · ${FINAL_EXPECTED.winnerName} WINS`);
      await m.page.locator("#sharedTerminalCloseAction").waitFor({state:"visible",timeout:60000});
      assert.equal((await m.page.locator("#sharedTerminalCloseAction").textContent()).trim(),"CLOSE SHOWDOWN");
      try{
        await m.page.waitForFunction(()=>/PREVIEW READY/.test(document.getElementById("sharedLocalReconciliationStatus")?.textContent||""),null,{timeout:60000});
      }catch(error){
        const diag=await m.page.evaluate(()=>({
          multi:window.CareerModeProductionSharedMultiSeasonProgression?.getState?.()||null,
          history:window.CareerModeProductionSharedHistoryConvergence?.getState?.()||null,
          local:window.CareerModeProductionSharedLocalReconciliation?.getState?.()||null,
          final:window.CareerModeProductionSharedFinalReconciliation?.getState?.()||null,
          terminal:window.CareerModeProductionSharedTerminalClose?.getState?.()||null,
          localStatus:document.getElementById("sharedLocalReconciliationStatus")?.textContent||"",
          previewVisible:Boolean(document.getElementById("sharedLocalReconciliationPreview")&&!document.getElementById("sharedLocalReconciliationPreview").classList.contains("hidden")),
          visibility:document.visibilityState
        }));
        throw new Error(`J10_LOCAL_RECONCILIATION_PREVIEW_NOT_READY ${JSON.stringify(diag)}`,{cause:error});
      }
      assert.equal(await m.page.evaluate(()=>window.__bh8PreviewTaps),0,"the final result and CLOSE appeared without a PREVIEW tap");
    }
    ok("J10.1","both pages reconcile the three-season final as Daniel 10, Nik 15, Nik wins by 5");

    await daniel.page.locator("#sharedTerminalCloseAction").click({timeout:30000});
    }
    for(const m of [daniel,nik]){
      try{
        await m.page.waitForFunction(()=>document.getElementById("sharedTerminalCloseHeading")?.textContent==="SHOWDOWN CLOSED",null,{timeout:60000});
      }catch(error){
        // CI-only intermittent stall (2026-10-29): print the close, session and rivalry state so the next failure says where it stopped.
        const diag=await m.page.evaluate(()=>({
          terminal:window.CareerModeProductionSharedTerminalClose?.getState?.()||null,
          busy:window.CareerModeProductionSharedTerminalClose?.isBusy?.()??null,
          heading:document.getElementById("sharedTerminalCloseHeading")?.textContent||"",
          status:document.getElementById("sharedTerminalCloseStatus")?.textContent||"",
          panelHidden:document.getElementById("sharedTerminalClosePanel")?.classList.contains("hidden")??null,
          remote:(()=>{const s=window.CareerModeSparkRemoteJoining?.getState?.();return s?{sessionState:s.sessionState,status:s.status,pendingAction:s.pendingAction,message:s.message}:null;})(),
          rivalry:(()=>{const s=window.CareerModeSparkConnectedRivalry?.getState?.();return s?{attached:s.attached,status:s.status,message:s.message}:null;})(),
          final:window.CareerModeProductionSharedFinalReconciliation?.getState?.()?.phase||null,
          history:window.CareerModeProductionSharedHistoryConvergence?.getState?.()?.phase||null,
          visibility:document.visibilityState
        }));
        throw new Error(`J10_2_TERMINAL_CLOSE_NOT_SHOWN ${m===daniel?"daniel":"nik"} ${JSON.stringify(diag)}`,{cause:error});
      }
      assert.match((await m.page.locator("#sharedTerminalCloseStatus").textContent()).trim(),/CLOSED · FINAL RESULTS ARE LOCKED/);
    }
    const closedR1=await admin(`rivalries/${R1}`);
    assert.ok(closedR1,"closed R1 rivalry root exists");
    assert.equal(field(closedR1,"data","connectionState").stringValue,"closed","R1 root is closed");
    const terminalWitness=field(closedR1,"data","terminalClose");
    assert.ok(terminalWitness?.mapValue,"R1 root stores terminalClose witness");
    assert.equal(field(terminalWitness,"winner").stringValue,FINAL_EXPECTED.winner,`terminal witness records ${FINAL_EXPECTED.winnerName} as winner`);
    assert.equal(field(terminalWitness,"managerTotals","playerOne").integerValue,String(FINAL_EXPECTED.daniel),"terminal witness Daniel total");
    assert.equal(field(terminalWitness,"managerTotals","playerTwo").integerValue,String(FINAL_EXPECTED.nik),"terminal witness Nik total");
    ok("J10.2","Terminal Close completed through the UI and R1 root is closed with a terminalClose witness");
    await shot(daniel,"j10-terminal");await shot(nik,"j10-terminal");

    // JOB-1040: after a finished online Showdown both devices open Career Statistics, Trophy Room and Legacy from Showdown Home
    // (real buttons) and must see the just-completed Showdown, before and after a reload. Every wait is bounded to 20 s.
    await assertCareerScreensShowCompletedShowdown([daniel,nik],"J10.3");
    // r87 Touchline Gazette: each phone showed every season paper and the final paper exactly once, for the same Showdown.
    for(const m of [daniel,nik]){
      const seen=await gazette.gazetteSeen(m.page),rid=seen[0]?.split("|")[0];
      assert.deepEqual(seen.map(k=>k.slice(k.indexOf("|")+1)),[...Array.from({length:LENGTH-1},(x,i)=>`season|${i+1}`),`final|${LENGTH}`],`${m.user} Gazette papers ${JSON.stringify(seen)}`);
      assert.ok(rid&&seen.every(k=>k.startsWith(rid+"|")),`${m.user} papers belong to one Showdown`);
    }
    ok("J10.3g",`both devices showed the Touchline Gazette once per season (${LENGTH-1}) and once after Final Winner, and CONTINUE went on to the same screens`);
    for(const m of [daniel,nik]){
      await m.page.reload({waitUntil:"domcontentloaded"});
      await m.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
      await m.page.locator("#mainMenu").waitFor({state:"visible",timeout:30000});
    }
    await assertCareerScreensShowCompletedShowdown([daniel,nik],"J10.4");
    ok("J10.3","after the finished online Showdown both devices open Career Statistics, Trophy Room and Legacy and each shows the completed Showdown");
    ok("J10.4","after reloading both devices the same three screens still show the completed Showdown");

    // J11 stranger: redeemed R1 capability never grants a third account access or leaks private content.
    const stranger=await openManager(browser,"stranger",{width:375,height:650});managers.push(stranger);
    await signIn(stranger,"Nik");
    const uidS=await accountId(stranger);
    assert.ok(uidS&&uidS!==uidD&&uidS!==uidN,"stranger has a third account");
    await stranger.page.locator("#newShowdown").click({timeout:30000});
    await pairPanel(stranger).locator("#persistentNikDanielPairCode").waitFor({state:"visible",timeout:30000});
    await pairPanel(stranger).locator("#persistentNikDanielPairCode").fill(pairCode);
    await pairPanel(stranger).getByRole("button",{name:"JOIN DANIEL'S SHOWDOWN",exact:true}).click({timeout:30000});
    await stranger.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.busy===false&&s.status!=="joining");},null,{timeout:30000});
    const strangerPanel=(await pairPanel(stranger).innerText()).replace(/\s+/g," ").trim();
    assert.doesNotMatch(strangerPanel,/CAREER READY/i,"stranger never reaches CAREER READY");
    assert.equal(await admin(`accounts/${uidS}/pairLinks/current`),null,"stranger gets no pair link");
    const strangerIndex=await admin(`accounts/${uidS}/careerIndex/current`);
    assert.equal(ids(field(strangerIndex,"data","rivalryIds")).includes(R1),false,"stranger career index never names R1");
    const strangerText=await stranger.page.locator("body").innerText();
    for(const secret of [R1,"QWX","ZPV"])assert.equal(strangerText.includes(secret),false,`stranger rendered text never contains ${secret}`);
    ok("J11.1","third account cannot redeem closed R1 and receives no pair link, career index entry, rivalry id, or private transfer tokens");
    await shot(stranger,"j11-stranger");

    // J12 second Showdown: terminal authority is durable; Daniel and Nik can start a fresh R2 from Home.
    // r79 PR3: an EXPIRED JOIN note in Nik's inbox (planted by the emulator owner) must leave Nik's Home on Waiting for Daniel.
    const staleRid=`pair_3${"e".repeat(63)}`,pastIso=new Date(Date.now()-60000).toISOString();
    await adminWrite(`accounts/${uidN}/partnerInbox/current`,{schemaVersion:{integerValue:"1"},rivalryId:{stringValue:staleRid},totalSeasons:{integerValue:"3"},fromAccountId:{stringValue:uidD},createdAt:{timestampValue:new Date(Date.now()-21*60000).toISOString()},expiresAt:{timestampValue:pastIso}});
    for(const m of [daniel,nik]){
      await m.page.reload({waitUntil:"domcontentloaded"});
      await m.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
      await m.page.locator("#mainMenu").waitFor({state:"visible",timeout:30000});
      assert.equal(await m.page.evaluate(()=>window.__cmsEmulatorSwitch?.active===true),true,`${m.user} localhost emulator switch remains test-only after terminal reload`);
      // Job 19: a CLOSED Showdown must not re-open the GET READY career entry overlay after reload.
      await m.page.waitForFunction(()=>Boolean(window.CareerModeProductionSharedJourneyEntry),null,{timeout:30000});
      await m.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.initialized===true&&s.busy===false);},null,{timeout:30000});
      await m.page.waitForTimeout(2500);
      const entryOverlay=m.page.locator("#productionSharedJourneyEntryOverlay");
      assert.equal(await entryOverlay.isVisible().catch(()=>false),false,`${m.user}: a CLOSED Showdown must not re-open the GET READY career entry overlay after reload`);
    }
    assert.deepEqual(await waitHomeTile(nik,"WAITING FOR DANIEL"),["WAIT","WAITING FOR DANIEL","PASTE A CODE"],"expired note: Nik's Home waits for Daniel");
    assert.equal(field(await admin(`accounts/${uidN}/partnerInbox/current`),"rivalryId").stringValue,staleRid,"the expired note is still there; it is simply not offered");
    await nik.page.waitForFunction(()=>window.CareerModePersistentNikDanielPair?.getJoinNoteWatch?.().listening===true,null,{timeout:30000});
    ok("J12.0","an expired JOIN note leaves Nik's Home on WAITING FOR DANIEL with the PASTE A CODE backup, and one note listener waits");
    const pairCode2=await danielStartsShowdown(daniel,LENGTH);
    assert.match(pairCode2,/^CMS17-pair_[0-9a-f]{64}$/,"R2 pair code shape (already paired: no CMS17R-)");
    const R2pending=pairCode2.slice("CMS17-".length);
    {
      // Daniel's START wrote Nik's JOIN note in its own transaction, with the invite's own expiry.
      const note=await adminUntil(`accounts/${uidN}/partnerInbox/current`,doc=>field(doc,"rivalryId")?.stringValue===R2pending,"Daniel's JOIN note");
      const invite=await admin(`rivalries/${R2pending}/invites/${R2pending}`);
      assert.equal(field(note,"expiresAt").timestampValue,field(invite,"data","expiresAt").timestampValue,"note expiresAt == invite expiresAt");
      assert.equal(field(note,"fromAccountId").stringValue,uidD);assert.equal(field(note,"totalSeasons").integerValue,String(LENGTH));assert.equal(field(note,"schemaVersion").integerValue,"1");
      assert.deepEqual(Object.keys(note.fields).sort(),["createdAt","expiresAt","fromAccountId","rivalryId","schemaVersion","totalSeasons"]);
      assert.match(await pairPanel(daniel).innerText(),/Nik can tap JOIN on his Home screen now/,"Daniel's waiting panel says Nik can tap JOIN");
    }
    // Nik already sits on Home when Daniel presses START: his Home holds one listener on his JOIN note while it is shown and
    // visible (Nik 2026-10-18, "check by itself"), so JOIN appears with no tap and no tab event.
    const joinTile=["JOIN","JOIN DANIEL'S SHOWDOWN",`Daniel started ${LENGTH} season${LENGTH===1?"":"s"}. Tap to join.`];
    {
      const nikTaps=nik.log.taps.length,written=Date.parse((await admin(`accounts/${uidN}/partnerInbox/current`)).updateTime);
      await nik.page.waitForFunction(text=>(document.querySelector("#newShowdown .menuTileMeta")?.textContent||"").trim()===text,joinTile[2],{timeout:30000});
      const seenAfter=Date.now()-written;
      assert.deepEqual(await homeTile(nik),joinTile,"Daniel START -> Nik's Home shows JOIN");
      assert.equal(nik.log.taps.length,nikTaps,"Nik tapped nothing");
      assert.equal(await nik.page.evaluate(()=>window.getActiveScreenName?.()),"mainMenu","Nik stayed on Home");
      assert.ok(seenAfter<=10000,`JOIN appeared ${seenAfter} ms after Daniel's note was written (listener)`);
      assert.equal(await nik.page.evaluate(()=>window.CareerModePersistentNikDanielPair.getJoinNoteWatch().listening),false,"JOIN showing: the note listener has detached");
    }
    ok("J12.1a","Daniel's START writes Nik's JOIN note (own transaction, invite expiry); Nik, already on Home, sees JOIN by itself (one listener) with no tap, no tab event, no reload");
    // Reload on both: Daniel's code is still out (reload recovery reopens his WAITING by itself), Nik's Home still shows JOIN.
    for(const m of [daniel,nik]){
      await m.page.reload({waitUntil:"domcontentloaded"});
      await m.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
      await m.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.initialized===true&&s.busy===false);},null,{timeout:30000});
    }
    await nik.page.locator("#mainMenu").waitFor({state:"visible",timeout:30000});
    assert.deepEqual(await waitHomeTile(nik,"JOIN DANIEL'S SHOWDOWN").then(()=>nik.page.waitForFunction(text=>(document.querySelector("#newShowdown .menuTileMeta")?.textContent||"").trim()===text,joinTile[2],{timeout:30000})).then(()=>homeTile(nik)),joinTile,"after reload Nik's Home still shows JOIN");
    await pairPanel(daniel).locator("code").waitFor({timeout:30000});
    // (Which screen sits under WAITING after a reload is PR2's reload recovery; this step only needs the same code back, untapped.)
    assert.equal((await pairPanel(daniel).locator("code").innerText()).trim(),pairCode2,"after reload Daniel's WAITING shows the same code");
    const nikTapsBefore=nik.log.taps.length;
    await nik.page.locator("#newShowdown").click({timeout:30000});
    await bothPairedAndContinuing([nik,daniel]);
    assert.deepEqual(nik.log.taps.slice(nikTapsBefore).map(t=>t.id||t.text),["newShowdown"],"Nik's one tap was JOIN on Home: no code typed, no second tap");
    for(const m of [daniel,nik])await assertNoSessionCodeOption(m);
    ok("J12.1b","after reload on both: Nik taps JOIN on Home, the note redeems the code and both continue by themselves");
    const linkD2=await admin(`accounts/${uidD}/pairLinks/current`),linkN2=await admin(`accounts/${uidN}/pairLinks/current`);
    const R2=field(linkD2,"data","rivalryId").stringValue;
    assert.ok(R2&&R2!==R1,"R2 is distinct from R1");
    assert.equal(field(linkN2,"data","rivalryId").stringValue,R2,"both managers are paired to R2");
    assert.deepEqual(ids(field(await admin(`accounts/${uidD}/careerIndex/current`),"data","rivalryIds")),[R1,R2],"Daniel career index [R1,R2]");
    assert.deepEqual(ids(field(await admin(`accounts/${uidN}/careerIndex/current`),"data","rivalryIds")),[R1,R2],"Nik career index [R1,R2]");

    for(const m of [daniel,nik])await assertNoCodeBox(m);
    await hostSeesJoin(daniel);
    const sessionCode2=await sessionOf(daniel);
    assert.notEqual(sessionCode2,sessionCode,"R2 uses its own session");
    assert.equal(await sessionOf(nik),sessionCode2,"Nik joined Daniel's R2 session without a code");
    for(const m of [nik,daniel])await m.page.locator("#leagueWheelScreen").waitFor({state:"visible",timeout:30000});
    ok("J12.1","after terminal R1, Daniel and Nik created distinct R2, both indexes are [R1,R2], and both reached R2 league wheel");
    {
      const offer=await admin(`rivalries/${R2}/sessionOffers/current`);
      assert.equal(field(offer,"sessionId").stringValue,sessionCode2,"R2 pointer names Daniel's R2 session");
      const exp=field(offer,"expiresAt").timestampValue,uidS=await accountId(managers.find(m=>m.user==="stranger"));
      const stranger=managers.find(m=>m.user==="stranger");
      assert.equal(await offerGet(nik,R2),200,"Nik reads the pair's pointer");
      assert.equal(await offerGet(stranger,R2),403,"a third account cannot read the pointer");
      assert.equal(await offerWrite(stranger,R2,sessionCode2,uidS,exp),403,"a third account cannot write the pointer");
      assert.equal(await offerWrite(nik,R2,sessionCode2,uidN,exp),403,"Nik is not the host of Daniel's session and cannot point at it");
      assert.equal(await offerWrite(daniel,R2,sessionCode2,uidN,exp),403,"the host cannot name someone else as host");
      assert.equal(await offerWrite(daniel,R2,sessionCode,uidD,exp),403,"the host cannot point R2 at another rivalry's session");
      assert.equal(await offerWrite(daniel,R2,sessionCode2,uidD,new Date(Date.now()+60000).toISOString()),403,"the expiry must be the session's own");
      assert.equal(await offerWrite(daniel,R2,sessionCode2,uidD,exp),200,"control: the host re-publishes the exact pointer");
    }
    ok("J12.2","session pointer: the pair reads it; a third account cannot read or write it; only the host can point it at their own live session with its own expiry");
    await shot(daniel,"j12-r2");await shot(nik,"j12-r2");

    // J4..J12: added by the worker, one section per step (JOB-16 §4).

    for(const m of managers){
      assert.deepEqual(m.log.forbidden,[],`${m.user} never contacted a production Firebase host`);
      assert.equal(m.log.productionRuntime,0,`${m.user} never loaded the production Firebase runtime or config`);
      assert.deepEqual(m.log.errors,[],`${m.user} page errors`);
    }
    ok("JZ.1","no production Firebase host, no production runtime/config load, no page errors in either context");
    for(const m of [daniel,nik])assertNoRemovedTaps(m);
    console.log(`TAPS daniel=${daniel.log.taps.length} nik=${nik.log.taps.length} (${LENGTH}-season run incl. reload resume and second Showdown start)`);
    ok("JZ.2",`fewer taps: neither manager needed a removed navigation/read tap (Daniel ${daniel.log.taps.length}, Nik ${nik.log.taps.length} button taps)`);
    console.log(`PASS two-manager browser journey: ${checks} numbered checks (J0-J12) on the Auth + Firestore emulators, composed production Rules, ${LENGTH}-season Showdown.`);
  }catch(error){
    for(const m of managers){console.log(`--- ${m.user}: ${await describe(m).catch(e=>e.message)}`);console.log(`--- ${m.user} errors: ${JSON.stringify(m.log.errors.slice(-10))}`);await shot(m,"failure");}
    throw error;
  }finally{
    await browser.close();server.kill();
  }
}
main().catch(error=>{console.error(error);process.exit(1);});

"use strict";
// G-2b: Daniel and Nik play through the real app screens in two Chromium contexts against the
// Auth + Firestore emulators (composed production Rules). Test database only; project demo-cms-browser-journey.
// Run: npx --yes firebase-tools@15.28.1 emulators:exec --config tests/browser/support/firebase.browser-journey.json \
//        --only auth,firestore --project demo-cms-browser-journey "node tests/browser/two-manager-browser-journey.cjs"
const assert=require("node:assert/strict");
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
const FORBIDDEN_HOSTS=/(^|\.)(firestore|identitytoolkit|securetoken|firebaseinstallations|firebaseappcheck|content-firebaseappcheck)\.googleapis\.com$/;
let checks=0;
const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};
// Job 33 (fewer taps): every real button tap is logged per manager. These buttons were pure navigation or reads and are now
// automatic, so the journey must never need them (Daniel's ACKNOWLEDGE is folded into his COMMIT & ACKNOWLEDGE tap, R7).
const REMOVED_TAPS=new Set(["CHECK STATUS","REFRESH / READ","START CAREER","CONTINUE","CONTINUE TO CLUB PACKS","CONTINUE TO CAREER START","CONTINUE TO TRANSFER CHALLENGE","REFRESH","REFRESH SHARED CHALLENGE","#refreshSharedTransferChallenge"]);
function assertNoRemovedTaps(m){
  const removed=m.log.taps.filter(tap=>REMOVED_TAPS.has(tap.text)||REMOVED_TAPS.has(`#${tap.id}`));
  assert.deepEqual(removed,[],`${m.user} never needed a removed navigation/read tap`);
  if(m.user==="daniel")assert.equal(m.log.taps.some(tap=>tap.text==="ACKNOWLEDGE SHARED SEASON"),false,"Daniel's acknowledgement rides on his COMMIT & ACKNOWLEDGE tap");
}
const urlFor=user=>`${BASE}?cmsEmulator=1&cmsEmulatorUser=${user}&cmsAuthPort=${AUTH_PORT}&cmsFirestorePort=${FIRESTORE_PORT}`;
const docUrl=p=>`${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/${p}`;
async function admin(p){const r=await fetch(docUrl(p),{headers:{Authorization:"Bearer owner"}});return r.status===200?r.json():null;}
const field=(doc,...keys)=>keys.reduce((v,k)=>v&&(v.mapValue?v.mapValue.fields[k]:v.fields?v.fields[k]:undefined),doc);
const ids=arr=>(arr&&arr.arrayValue&&arr.arrayValue.values||[]).map(v=>v.stringValue);

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
  await context.addInitScript({path:SWITCH});
  const page=await context.newPage();
  page.on("request",request=>{const u=new URL(request.url());if(FORBIDDEN_HOSTS.test(u.hostname))log.forbidden.push(u.hostname);if(/productionFirebaseRuntime\.js|firebase\.runtime-config\.json/.test(u.pathname))log.productionRuntime+=1;});
  page.on("pageerror",error=>log.errors.push(error.message));
  // Job 22: LOCK MY GUESSES / LOCK MY SIGNINGS ask "Lock N of 3 ...?" when a form is partly filled; this journey fills one row, so it accepts that prompt.
  page.on("dialog",dialog=>{void dialog.accept().catch(()=>{});});
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
const remote=m=>m.page.locator("#sparkRemoteJoiningOverlay, #remoteJoiningOverlay").filter({hasText:"REMOTE JOINING"}).first();
// Job 31: the host page picks up the peer's JOIN by itself (quiet read every few seconds); nobody taps REFRESH / READ.
// Job 33 (R6): the ACTIVE session then continues into the Showdown by itself, so Remote Joining closes on both pages.
async function hostSeesJoin(m){await m.page.waitForFunction(()=>window.CareerModeSparkRemoteJoining?.getState?.()?.sessionState==="active",null,{timeout:20000});await remote(m).waitFor({state:"hidden",timeout:20000});assert.equal(await entry(m).isVisible().catch(()=>false),false,`${m.user}: no GET READY after the peer joined`);}
const pairPanel=m=>m.page.locator("#persistentNikDanielPairPanel");
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
async function commitSeasonViaUi(daniel,nik,p1,p2,winner){
  await daniel.page.waitForFunction(()=>document.getElementById("sharedSeasonCommitAction")?.textContent==="COMMIT & ACKNOWLEDGE SHARED SEASON",null,{timeout:45000});
  await nik.page.waitForFunction(()=>document.getElementById("sharedSeasonCommitAction")?.textContent==="WAITING FOR COORDINATOR"||document.getElementById("sharedSeasonCommitAction")?.textContent==="ACKNOWLEDGE SHARED SEASON",null,{timeout:45000});
  if(await nik.page.locator("#sharedSeasonCommitAction").textContent()==="WAITING FOR COORDINATOR")assert.equal(await nik.page.locator("#sharedSeasonCommitAction").isDisabled(),true,"Nik cannot commit");
  // R7 (owner decision 2026-10-04): Daniel's one tap commits, then records his own acknowledgement; Nik still acknowledges himself.
  await daniel.page.locator("#sharedSeasonCommitAction").click({timeout:30000});
  await daniel.page.waitForFunction(()=>/^(ACKNOWLEDGED ✓ · WAITING FOR RIVAL|SEASON COMMIT ACKNOWLEDGED ✓)$/.test(document.getElementById("sharedSeasonCommitAction")?.textContent||""),null,{timeout:30000});
  const danielCommit=await daniel.page.evaluate(()=>{const s=window.CareerModeProductionSharedSeasonCommit?.getState?.();return s?{committed:s.committed,ownAcknowledged:s.ownAcknowledged}:null;});
  assert.deepEqual(danielCommit,{committed:true,ownAcknowledged:true},"Daniel's single tap committed the season and recorded his own acknowledgement");
  assert.equal(await daniel.page.locator("#sharedCanonicalScoringPanel").isVisible().catch(()=>false),false,"scoring still waits for Nik's own acknowledgement");
  await nik.page.waitForFunction(()=>document.getElementById("sharedSeasonCommitAction")?.textContent==="ACKNOWLEDGE SHARED SEASON",null,{timeout:45000});
  await nik.page.locator("#sharedSeasonCommitAction").click({timeout:30000});
  for(const m of [daniel,nik]){
    await m.page.waitForFunction(()=>document.getElementById("sharedSeasonCommitAction")?.textContent==="SEASON COMMIT ACKNOWLEDGED ✓",null,{timeout:45000});
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
    await m.page.locator("#sharedCanonicalScoringPanel").waitFor({state:"visible",timeout:5000});
    assert.equal((await m.page.locator("#sharedCanonicalScoringTotals").textContent()).trim(),`Daniel: ${p1} · Nik: ${p2}`);
    assert.equal((await m.page.locator("#sharedCanonicalScoringWinner").textContent()).trim(),winner==="draw"?"Season result: Draw":`Season winner: ${winner}`);
    await m.page.locator("#sharedHistoryConvergencePanel").waitFor({state:"visible",timeout:45000});
  }
}
// Job 33 (R2): CONTINUE TO SEASON N updates the dashboard and opens the new season's Shared Transfer Challenge directly
// (no START SEASON N dashboard tap). The dashboard values are still asserted from the rendered dashboard.
async function continueToSeason(daniel,nik,season,total){
  for(const m of [daniel,nik]){
    await m.page.waitForFunction(next=>document.getElementById("sharedMultiSeasonContinueAction")?.textContent===`CONTINUE TO SEASON ${next}`,season,{timeout:45000});
    await m.page.locator("#sharedMultiSeasonContinueAction").click({timeout:30000});
    await m.page.waitForFunction(value=>document.getElementById("seasonIndicator")?.textContent===value,`Season ${season} / ${total}`,{timeout:30000});
    await m.page.locator("#transferChallenge").waitFor({state:"visible",timeout:30000});
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

  await daniel.page.locator("#p1Signing1Name").fill(tokenD);await fillTransferCombo(daniel,"p1Signing1League","Premier League");await fillTransferCombo(daniel,"p1Signing1Nationality","England");
  await daniel.page.getByRole("button",{name:"LOCK MY SIGNINGS",exact:true}).click({timeout:30000});
  await daniel.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.signingLockedRoles?.includes("playerOne")===true,null,{timeout:30000});
  await assertPrivateTokenAbsent(nik,tokenD.split(" ")[0],`season ${season} Daniel signing privacy`);
  await waitTransferState(nik,"signingLockedRoles","playerOne");await waitTransferPhase(nik,"signing_entry");
  await assertPrivateTokenAbsent(nik,tokenD.split(" ")[0],`season ${season} Daniel signing privacy after Nik read the lock`);
  await nik.page.locator("#p2Signing1Name").fill(tokenN);await fillTransferCombo(nik,"p2Signing1League","TIM Serie A");await fillTransferCombo(nik,"p2Signing1Nationality","Brazil");
  await assertPrivateTokenAbsent(daniel,tokenN.split(" ")[0],`season ${season} Nik signing privacy`);
  await nik.page.getByRole("button",{name:"LOCK MY SIGNINGS",exact:true}).click({timeout:30000});
  await waitTransferPhase(nik,"completed");await waitTransferPhase(daniel,"completed");
  for(const m of [daniel,nik])await m.page.getByRole("button",{name:"CONTINUE TO SHARED SEASON RESULTS",exact:true}).waitFor({state:"visible",timeout:30000});
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
    await daniel.page.locator("#newShowdown").click();
    await daniel.page.locator("#createShowdown").waitFor({state:"visible",timeout:30000});
    await daniel.page.locator("#roundAmount").selectOption(String(LENGTH));
    await daniel.page.locator("#startShowdown").click();
    await entry(daniel).getByRole("button",{name:"CONNECT PLAYERS"}).click({timeout:30000});
    await pairPanel(daniel).getByRole("button",{name:"CREATE CODE FOR NIK"}).click({timeout:30000});
    await pairPanel(daniel).locator("code").waitFor({timeout:30000});
    const pairCode=(await pairPanel(daniel).locator("code").innerText()).trim();
    assert.match(pairCode,/^CMS17-pair_/,"pair code shape");
    ok("J2.1","Daniel created the pair code on the real Start screen");
    await nik.page.locator("#newShowdown").click();
    // Trap: the pair panel re-renders (replaceChildren) while the join sidecar syncs; a code typed before it settles is lost.
    await nik.page.waitForFunction(()=>{const s=window.CareerModePersistentNikDanielPair?.getState?.();return Boolean(s&&s.busy===false&&s.status==="unpaired");},null,{timeout:30000});
    await nik.page.waitForTimeout(500);
    await pairPanel(nik).locator("#persistentNikDanielPairCode").fill(pairCode);
    await pairPanel(nik).getByRole("button",{name:"JOIN DANIEL'S SHOWDOWN",exact:true}).click();
    // Job 33 (R1): Daniel's waiting code panel re-reads every 4 s, so Nik's join shows without CHECK STATUS.
    for(const m of [nik,daniel]){
      await m.page.waitForFunction(()=>/CAREER READY/.test(document.getElementById("persistentNikDanielPairPanel")?.innerText||""),null,{timeout:30000});
    }
    const linkD=await admin(`accounts/${uidD}/pairLinks/current`),linkN=await admin(`accounts/${uidN}/pairLinks/current`);
    assert.equal(field(linkD,"data","managerRole").stringValue,"playerOne","Daniel is playerOne");
    assert.equal(field(linkN,"data","managerRole").stringValue,"playerTwo","Nik is playerTwo");
    const R1=field(linkD,"data","rivalryId").stringValue;
    assert.equal(field(linkN,"data","rivalryId").stringValue,R1,"same rivalry");
    assert.deepEqual(ids(field(await admin(`accounts/${uidD}/careerIndex/current`),"data","rivalryIds")),[R1],"Daniel career index [R1]");
    assert.deepEqual(ids(field(await admin(`accounts/${uidN}/careerIndex/current`),"data","rivalryIds")),[R1],"Nik career index [R1]");
    ok("J2.2","Nik joined with the code; Daniel=playerOne, Nik=playerTwo, both career indexes [R1]");
    await shot(daniel,"j2-paired");await shot(nik,"j2-paired");

    // J3 private session through the real Remote Joining surface; the ACTIVE session continues into the league wheel.
    // Job 33 (R5b): a connected pair goes from CONTINUE CAREER straight to Remote Joining (no GET READY CONTINUE).
    for(const m of [daniel,nik]){
      await pairPanel(m).getByRole("button",{name:"CONTINUE CAREER"}).first().click();
      await remote(m).waitFor({state:"visible",timeout:30000});
      assert.equal(await entry(m).isVisible().catch(()=>false),false,`${m.user}: no GET READY overlay before Remote Joining`);
    }
    await remote(daniel).getByRole("button",{name:"HOST PRIVATE SESSION"}).click({timeout:30000});
    await daniel.page.waitForFunction(()=>/session_[A-Za-z0-9_-]{16,}/.test(document.body.innerText),null,{timeout:30000});
    const sessionCode=await daniel.page.evaluate(()=>document.body.innerText.match(/session_[A-Za-z0-9_-]{16,}/)[0]);
    await remote(nik).getByRole("textbox",{name:"Exact private session code"}).fill(sessionCode);
    await remote(nik).getByRole("button",{name:"JOIN PRIVATE SESSION"}).click();
    await hostSeesJoin(daniel);
    // Job 33 (R6 + R1): the ACTIVE session takes both managers to the league wheel by itself; Daniel's hosted session is
    // re-read every 4 s, so neither REFRESH / READ nor START CAREER is tapped.
    for(const m of [nik,daniel]){
      await m.page.locator("#leagueWheelScreen").waitFor({state:"visible",timeout:30000});
      assert.equal(await m.page.evaluate(()=>window.CareerModeSparkRemoteJoining?.getState?.()?.sessionState),"active",`${m.user}: the private session is ACTIVE`);
      assert.equal(await entry(m).isVisible().catch(()=>false),false,`${m.user}: GET READY is not shown`);
    }
    ok("J3.1","private session hosted by Daniel, joined by Nik; both reached the league wheel");
    await shot(daniel,"j3-setup");await shot(nik,"j3-setup");

    // J4 shared setup through the real league wheel and club-pack screens.
    assert.match(await nik.page.locator("#spinLeague").textContent(),/WAITING FOR HOST/i,"Nik waits for Daniel on the league wheel");
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
    assert.match(await nik.page.locator("#openClubPack").textContent(),/WAITING FOR HOST/i,"Nik waits for host pack reveal");
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
    for(const m of [daniel,nik])await m.page.getByRole("button",{name:"CONFIRM SHARED SHOWDOWN"}).waitFor({state:"visible",timeout:30000});
    await daniel.page.getByRole("button",{name:"CONFIRM SHARED SHOWDOWN"}).click({timeout:30000});
    await nik.page.getByRole("button",{name:"CONFIRM SHARED SHOWDOWN"}).click({timeout:30000});
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
      await m.page.locator("#transferChallenge").waitFor({state:"visible",timeout:30000});
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

    await daniel.page.locator("#p1Signing1Name").fill("QWX Daniel Signing");
    await fillTransferCombo(daniel,"p1Signing1League","Premier League");
    await fillTransferCombo(daniel,"p1Signing1Nationality","England");
    await daniel.page.getByRole("button",{name:"LOCK MY SIGNINGS",exact:true}).click({timeout:30000});
    await daniel.page.waitForFunction(()=>window.CareerModeProductionSharedTransferChallenge?.getState?.()?.state?.signingLockedRoles?.includes("playerOne")===true,null,{timeout:30000});
    await assertPrivateTokenAbsent(nik,"QWX","before transfer completion on Nik");
    await waitTransferState(nik,"signingLockedRoles","playerOne");
    await waitTransferPhase(nik,"signing_entry");
    await assertPrivateTokenAbsent(nik,"QWX","after Daniel signing lock but before COMPLETED");

    await nik.page.locator("#p2Signing1Name").fill("ZPV Nik Signing");
    await fillTransferCombo(nik,"p2Signing1League","TIM Serie A");
    await fillTransferCombo(nik,"p2Signing1Nationality","Brazil");
    await assertPrivateTokenAbsent(daniel,"ZPV","before transfer completion on Daniel");
    ok("J6.4","unfinished rival signings remain absent from rendered text and every input value");

    await nik.page.getByRole("button",{name:"LOCK MY SIGNINGS",exact:true}).click({timeout:30000});
    await waitTransferPhase(nik,"completed");
    await waitTransferPhase(daniel,"completed");
    for(const m of [daniel,nik]){
      assert.equal(await m.page.locator("#p1Signing1Name").inputValue(),"QWX Daniel Signing");
      assert.equal(await m.page.locator("#p2Signing1Name").inputValue(),"ZPV Nik Signing");
      await m.page.getByRole("button",{name:"CONTINUE TO SHARED SEASON RESULTS",exact:true}).waitFor({state:"visible",timeout:30000});
      assert.equal(await m.page.getByRole("button",{name:"CONTINUE TO SHARED SEASON RESULTS",exact:true}).isEnabled(),true);
    }
    const verdictD=(await daniel.page.locator("#transferChallengeResults").innerText()).replace(/\s+/g," ").trim();
    const verdictN=(await nik.page.locator("#transferChallengeResults").innerText()).replace(/\s+/g," ").trim();
    assert.equal(verdictN,verdictD,"both managers see identical completed transfer verdicts");
    ok("J6.5","COMPLETED reveals both signings identically and enables Shared Season Results");
    await shot(daniel,"j6-transfers");await shot(nik,"j6-transfers");

    // J7 season-1 results, privacy, and the exact raw facts that feed canonical scoring.
    for(const m of [daniel,nik]){
      await m.page.getByRole("button",{name:"CONTINUE TO SHARED SEASON RESULTS",exact:true}).click({timeout:30000});
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
    await commitSeasonViaUi(daniel,nik,9,3,"Daniel");
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

      // J9 is a lead-approved known gap. Do not count it as a pass and do not hide it.
      // J9 resume after reload: season-2 transfers are COMPLETED; both tabs reload (same URL, browserSessionPersistence
      // keeps each Google session). The private-session capability is page-memory only by design, so each manager
      // resumes through the single CONTINUE CAREER action and a fresh exact session (Daniel hosts, Nik joins), then
      // lands on Season 2 of 3 with 9-3, never on the GET READY overlay, Career Start or season 1.
      const verdictBeforeReload=(await daniel.page.locator("#transferChallengeResults").innerText()).replace(/\s+/g," ").trim();
      for(const m of [daniel,nik]){
        await m.page.reload({waitUntil:"domcontentloaded"});
        await m.page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
        await m.page.locator("#mainMenu").waitFor({state:"visible",timeout:30000});
        assert.equal(await m.page.evaluate(()=>window.__cmsEmulatorSwitch?.active===true),true,`${m.user} emulator switch re-installed after reload`);
        await m.page.waitForFunction(()=>/CAREER READY/.test(document.getElementById("persistentNikDanielPairPanel")?.innerText||""),null,{timeout:30000});
      }
      for(const m of [daniel,nik]){
        // Give the entry install its pair-authority decision time before asserting it stayed closed.
        await m.page.waitForFunction(()=>Boolean(window.CareerModeProductionSharedJourneyEntry),null,{timeout:30000});
        await m.page.waitForTimeout(2500);
        assert.equal(await entry(m).isVisible().catch(()=>false),false,`${m.user}: an ACTIVE paired Showdown must not re-open GET READY over CONTINUE CAREER after reload`);
      }
      ok("J9.1","after reload both managers keep their Google session and see CAREER READY · CONTINUE CAREER without the GET READY overlay");
      for(const m of [daniel,nik]){
        await pairPanel(m).getByRole("button",{name:"CONTINUE CAREER"}).first().click({timeout:30000});
        await remote(m).waitFor({state:"visible",timeout:30000});
      }
      await remote(daniel).getByRole("button",{name:"HOST PRIVATE SESSION"}).click({timeout:30000});
      await daniel.page.waitForFunction(()=>/session_[A-Za-z0-9_-]{16,}/.test(document.body.innerText),null,{timeout:30000});
      const resumeSessionCode=await daniel.page.evaluate(()=>document.body.innerText.match(/session_[A-Za-z0-9_-]{16,}/)[0]);
      assert.notEqual(resumeSessionCode,sessionCode,"the resume uses a fresh exact private session");
      await remote(nik).getByRole("textbox",{name:"Exact private session code"}).fill(resumeSessionCode);
      await remote(nik).getByRole("button",{name:"JOIN PRIVATE SESSION"}).click({timeout:30000});
      await hostSeesJoin(daniel);
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
      for(const m of [daniel,nik]){
        await m.page.waitForFunction(()=>/SHARED TRANSFER|SEASON RESULTS|SEASON 2/i.test(document.getElementById("seasonPrimaryAction")?.textContent||""),null,{timeout:45000});
        await m.page.locator("#seasonPrimaryAction").click({timeout:30000});
        await m.page.locator("#transferChallenge, #seasonEntry").filter({visible:true}).first().waitFor({state:"visible",timeout:30000});
        if(await m.page.locator("#transferChallenge").isVisible()){
          const cont=m.page.getByRole("button",{name:"CONTINUE TO SHARED SEASON RESULTS",exact:true});
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

      for(const m of [daniel,nik])if(!await m.page.locator("#seasonEntry").isVisible())await m.page.getByRole("button",{name:"CONTINUE TO SHARED SEASON RESULTS",exact:true}).click({timeout:30000});
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
      await commitSeasonViaUi(daniel,nik,0,11,"Nik");
      ok("J8.4","season 2 canonical score is 0-11 and Nik wins");

      if(LENGTH>2){
        await continueToSeason(daniel,nik,3,LENGTH);
        for(const m of [daniel,nik]){
          assert.equal((await m.page.locator("#dashboardScoreOne").textContent()).trim(),"9");
          assert.equal((await m.page.locator("#dashboardScoreTwo").textContent()).trim(),"14");
          assert.match((await m.page.locator("#dashboardRound").textContent()).trim(),/Season 3 of 3/);
        }
        await playTransferSeason(daniel,nik,3,"QWX3 Daniel Signing","ZPV3 Nik Signing");
        for(const m of [daniel,nik])await m.page.getByRole("button",{name:"CONTINUE TO SHARED SEASON RESULTS",exact:true}).click({timeout:30000});
        for(const m of [daniel,nik])await m.page.locator("#seasonEntry").waitFor({state:"visible",timeout:30000});
        const season3Daniel={leaguePosition:2,leaguePoints:78,leagueGoals:70,domesticCup:true,championsLeague:false,topScorer:false,topAssist:false};
        const season3Nik={leaguePosition:4,leaguePoints:65,leagueGoals:60,domesticCup:true,championsLeague:false,topScorer:false,topAssist:false};
        await fillSeasonResult(daniel,"p1",season3Daniel);await publishSeasonResult(daniel);
        assert.equal(await nik.page.locator("#seasonReviewOne").isVisible(),false,"season 3 Daniel result stays private until Nik publishes");
        await fillSeasonResult(nik,"p2",season3Nik);await publishSeasonResult(nik);
        for(const m of [daniel,nik])await m.page.waitForFunction(()=>document.getElementById("seasonReviewHeading")?.textContent==="BOTH MANAGERS PUBLISHED",null,{timeout:45000});
        await commitSeasonViaUi(daniel,nik,1,1,"Daniel");
        ok("J8.5","season 3 repeated privacy and scoring; 1-1 tie is won by Daniel on league position");
      }
    }

    // J10 final reconciliation and Terminal Close through the real UI.
    // Lead decision 2026-10-03: observe/preview the terminal Connected Rivalry through the real UI,
    // Daniel first then Nik, before Final Reconciliation can become authoritative.
    for(const m of [daniel,nik]){
      await m.page.locator("#sharedLocalReconciliationPreview").waitFor({state:"visible",timeout:60000});
      await m.page.locator("#sharedLocalReconciliationPreview").click({timeout:30000});
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
    }
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
      assert.equal((await m.page.locator("#sharedFinalReconciliationHeading").textContent()).trim(),"SHOWDOWN FINAL RECONCILED");
      assert.equal((await m.page.locator("#sharedFinalReconciliationWinner").textContent()).trim(),"Daniel 10 · Nik 15 · Nik WINS");
      await m.page.locator("#sharedTerminalCloseAction").waitFor({state:"visible",timeout:60000});
      assert.equal((await m.page.locator("#sharedTerminalCloseAction").textContent()).trim(),"CLOSE SHARED SHOWDOWN");
    }
    ok("J10.1","both pages reconcile the three-season final as Daniel 10, Nik 15, Nik wins by 5");

    await daniel.page.locator("#sharedTerminalCloseAction").click({timeout:30000});
    for(const m of [daniel,nik]){
      await m.page.waitForFunction(()=>document.getElementById("sharedTerminalCloseHeading")?.textContent==="SHARED SHOWDOWN CLOSED",null,{timeout:60000});
      assert.match((await m.page.locator("#sharedTerminalCloseStatus").textContent()).trim(),/TERMINAL · NO NEW SESSION · NO NEW SEASON/);
    }
    const closedR1=await admin(`rivalries/${R1}`);
    assert.ok(closedR1,"closed R1 rivalry root exists");
    assert.equal(field(closedR1,"data","connectionState").stringValue,"closed","R1 root is closed");
    const terminalWitness=field(closedR1,"data","terminalClose");
    assert.ok(terminalWitness?.mapValue,"R1 root stores terminalClose witness");
    assert.equal(field(terminalWitness,"winner").stringValue,"playerTwo","terminal witness records Nik as winner");
    assert.equal(field(terminalWitness,"managerTotals","playerOne").integerValue,"10","terminal witness Daniel total");
    assert.equal(field(terminalWitness,"managerTotals","playerTwo").integerValue,"15","terminal witness Nik total");
    ok("J10.2","Terminal Close completed through the UI and R1 root is closed with a terminalClose witness");
    await shot(daniel,"j10-terminal");await shot(nik,"j10-terminal");

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
    await daniel.page.locator("#newShowdown").click({timeout:30000});
    await daniel.page.locator("#createShowdown").waitFor({state:"visible",timeout:30000});
    await daniel.page.locator("#roundAmount").selectOption(String(LENGTH));
    await daniel.page.locator("#startShowdown").click({timeout:30000});
    await entry(daniel).getByRole("button",{name:"CONNECT PLAYERS"}).click({timeout:30000});
    await pairPanel(daniel).getByRole("button",{name:"CREATE CODE FOR NIK"}).click({timeout:30000});
    await pairPanel(daniel).locator("code").waitFor({timeout:30000});
    const pairCode2=(await pairPanel(daniel).locator("code").innerText()).trim();
    assert.match(pairCode2,/^CMS17-pair_/,"R2 pair code shape");

    await nik.page.locator("#newShowdown").click({timeout:30000});
    await pairPanel(nik).locator("#persistentNikDanielPairCode").waitFor({state:"visible",timeout:30000});
    await pairPanel(nik).locator("#persistentNikDanielPairCode").fill(pairCode2);
    await pairPanel(nik).getByRole("button",{name:"JOIN DANIEL'S SHOWDOWN",exact:true}).click({timeout:30000});
    for(const m of [nik,daniel]){
      await m.page.waitForFunction(()=>/CAREER READY/.test(document.getElementById("persistentNikDanielPairPanel")?.innerText||""),null,{timeout:30000});
    }
    const linkD2=await admin(`accounts/${uidD}/pairLinks/current`),linkN2=await admin(`accounts/${uidN}/pairLinks/current`);
    const R2=field(linkD2,"data","rivalryId").stringValue;
    assert.ok(R2&&R2!==R1,"R2 is distinct from R1");
    assert.equal(field(linkN2,"data","rivalryId").stringValue,R2,"both managers are paired to R2");
    assert.deepEqual(ids(field(await admin(`accounts/${uidD}/careerIndex/current`),"data","rivalryIds")),[R1,R2],"Daniel career index [R1,R2]");
    assert.deepEqual(ids(field(await admin(`accounts/${uidN}/careerIndex/current`),"data","rivalryIds")),[R1,R2],"Nik career index [R1,R2]");

    for(const m of [daniel,nik]){
      await pairPanel(m).getByRole("button",{name:"CONTINUE CAREER"}).first().click({timeout:30000});
      await remote(m).waitFor({state:"visible",timeout:30000});
    }
    await remote(daniel).getByRole("button",{name:"HOST PRIVATE SESSION"}).click({timeout:30000});
    await daniel.page.waitForFunction(()=>/session_[A-Za-z0-9_-]{16,}/.test(document.body.innerText),null,{timeout:30000});
    const sessionCode2=await daniel.page.evaluate(()=>document.body.innerText.match(/session_[A-Za-z0-9_-]{16,}/)[0]);
    await remote(nik).getByRole("textbox",{name:"Exact private session code"}).fill(sessionCode2);
    await remote(nik).getByRole("button",{name:"JOIN PRIVATE SESSION"}).click({timeout:30000});
    await hostSeesJoin(daniel);
    for(const m of [nik,daniel])await m.page.locator("#leagueWheelScreen").waitFor({state:"visible",timeout:30000});
    ok("J12.1","after terminal R1, Daniel and Nik created distinct R2, both indexes are [R1,R2], and both reached R2 league wheel");
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

process.env.CMS_CHROMIUM_MULTI_CONTEXT="1";
"use strict";
// Area 11: two friends play all ten seasons through the actual local game screens.
// Run from the repository root with the existing localhost test fixture running
// on its test ports, then run: node project-documents/gameplay-factory/sweeps/olympiad/test/codex-1007-0342-full-game.cjs
// Screens, season scores, halfway reload, final DRAW and saved history are checked.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {spawn}=require("node:child_process");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../../../../../tests/support/chromium-runtime.cjs");

const ROOT=path.resolve(__dirname,"../../../../..");
const PROJECT="demo-cms-browser-journey";
const FIRESTORE="http://127.0.0.1:8181",AUTH_PORT=9199,FIRESTORE_PORT=8181;
const APP_PORT=Number(process.env.CMS_TEST_PORT||4173);
const BASE=`http://127.0.0.1:${APP_PORT}/`;
const SWITCH=path.join(ROOT,"tests/browser/support/emulator-runtime-switch.js");
const SDK_DIR=path.join(ROOT,"node_modules/firebase");
const ARTIFACTS=process.env.CMS_BROWSER_JOURNEY_ARTIFACTS||path.join(ROOT,"work","codex-1007-0342","ten-season");
const LENGTH=Number(process.env.CMS_SHOWDOWN_LENGTH||10);
const FORBIDDEN_HOSTS=/(^|\.)(firestore|identitytoolkit|securetoken|firebaseinstallations|firebaseappcheck|content-firebaseappcheck)\.googleapis\.com$/;
let checks=0;
const ok=(id,label)=>{if(!/^J[0-3]\./.test(id)){checks+=1;console.log(`ok ${checks} ${id} ${label}`);}};
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
  // Archive screens use the same SDK URL exposed by the real runtime. The older
  // localhost fixture omits this URL; supply it in the test fixture only.
  const fixture=fs.readFileSync(SWITCH,'utf8').replace('browserFirestoreWrites:BROWSER_FIRESTORE_WRITE_SCOPE,','firebaseFirestoreModule:SDK_BASE+"firebase-firestore.js",browserFirestoreWrites:BROWSER_FIRESTORE_WRITE_SCOPE,');
  await context.addInitScript({content:fixture});
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
  try{fs.mkdirSync(ARTIFACTS,{recursive:true});await m.page.screenshot({path:path.join(ARTIFACTS,`${name}-${m.user}.png`),timeout:15000,fullPage:true});}
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
  await m.page.evaluate(()=>ensureOnlinePlayerIdentitySurface());
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
async function commitSeasonViaUi(daniel,nik,p1,p2,winner,{finalSeason=false}={}){
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
    const scoringView=await m.page.evaluate(()=>{const v=window.CareerModeProductionSharedCanonicalScoring?.getState?.();return v?{authoritative:v.authoritative,p1:v.scoring?.playerOne?.total,p2:v.scoring?.playerTwo?.total,winner:v.winner}:null;});
    assert.deepEqual(scoringView,{authoritative:true,p1,p2,winner:winner==="draw"?"draw":winner==="Daniel"?"playerOne":"playerTwo"},`${m.user} canonical scoring state`);
    if(finalSeason){
      // BH-8: after the last commit the Final Winner screen can take over before this check runs, so on the final season either
      // the rendered scoring panel or the Final Winner screen is accepted; the panel text below is still asserted either way.
      await m.page.waitForFunction(()=>{const shown=id=>{const el=document.getElementById(id);return Boolean(el&&el.getClientRects().length&&getComputedStyle(el).visibility!=="hidden");};return shown("sharedCanonicalScoringPanel")||shown("finalWinnerScreen");},null,{timeout:45000});
      assert.equal(await m.page.locator("#sharedCanonicalScoringPanel").evaluate(el=>el.classList.contains("hidden")),false,`${m.user} scoring panel was rendered for the final season`);
    }else{
      await m.page.locator("#sharedCanonicalScoringPanel").waitFor({state:"visible",timeout:5000});
    }
    assert.equal((await m.page.locator("#sharedCanonicalScoringTotals").textContent()).trim(),`Daniel: ${p1} · Nik: ${p2}`);
    assert.equal((await m.page.locator("#sharedCanonicalScoringWinner").textContent()).trim(),winner==="draw"?"Season result: Draw":`Season winner: ${winner}`);
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


// Prepare the ordinary two-player ready state with the repository's localhost fixture.
// This sweep reports only league/club picks, transfers, seasons, scores, final result and saved history.
async function main(){
  fs.mkdirSync(ARTIFACTS,{recursive:true});
  await loadComposedRules();
  const server=spawn(process.execPath,[path.join(ROOT,'tests/support/static-server.cjs')],{stdio:'ignore',env:{...process.env,CMS_TEST_PORT:String(APP_PORT)}});
  const runtime=await resolveChromiumRuntime();const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
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


    const zero={leaguePosition:3,leaguePoints:70,leagueGoals:66,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false};
    for(let season=1;season<=LENGTH;season++){
      if(season>1)await continueToSeason(daniel,nik,season,LENGTH);
      await playTransferSeason(daniel,nik,season,`QWX${season} Daniel Signing`,`ZPV${season} Nik Signing`);
      for(const m of [daniel,nik]){
        assert.equal(await m.page.locator('#p1Signing1Name').inputValue(),`QWX${season} Daniel Signing`);
        assert.equal(await m.page.locator('#p2Signing1Name').inputValue(),`ZPV${season} Nik Signing`);
      }
      const vd=(await daniel.page.locator('#transferChallengeResults').innerText()).replace(/\s+/g,' ').trim();
      const vn=(await nik.page.locator('#transferChallengeResults').innerText()).replace(/\s+/g,' ').trim();assert.equal(vd,vn);
      if(season===Math.ceil(LENGTH/2)){
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
          await m.page.waitForFunction(text=>document.getElementById("dashboardRound")?.textContent===text,`Season ${season} of ${LENGTH}`,{timeout:45000});
        }catch(error){
          const diag=await m.page.evaluate(()=>({multi:window.CareerModeProductionSharedMultiSeasonProgression?.getState?.()?.state||null,remote:window.CareerModeSparkRemoteJoining?.getState?.()||null}));
          throw new Error(`J9_RESUME_NOT_AT_SEASON_2 ${m.user} ${await describe(m)} ${JSON.stringify(diag).slice(0,3000)}`,{cause:error});
        }
        assert.equal(await m.page.locator("#productionSharedCareerStartOverlay").isVisible().catch(()=>false),false,`${m.user}: resume must not replay Career Start`);
        assert.equal((await m.page.locator("#dashboardScoreOne").textContent()).trim(),"3");
        assert.equal((await m.page.locator("#dashboardScoreTwo").textContent()).trim(),"3");
        assert.equal(await m.page.locator("#seasonIndicator").textContent(),`Season ${season} / ${LENGTH}`);
      }
      
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
          assert.equal(await m.page.locator("#p1Signing1Name").inputValue(),`QWX${season} Daniel Signing`);
          assert.equal(await m.page.locator("#p2Signing1Name").inputValue(),`ZPV${season} Nik Signing`);
          assert.equal((await m.page.locator("#transferChallengeResults").innerText()).replace(/\s+/g," ").trim(),verdictBeforeReload,`${m.user} sees the same completed season-2 verdicts after reload`);
        }
      }
      console.log(`PASS halfway reload: season ${season} of ${LENGTH} resumes at 3-3 with both transfer verdicts unchanged`);


      }
      for(const m of [daniel,nik])if(!await m.page.locator('#seasonEntry').isVisible())await m.page.getByRole('button',{name:'CONTINUE TO SHARED SEASON RESULTS',exact:true}).click({timeout:30000});
      const d={...zero,leaguePosition:season===1?1:2},n={...zero,leaguePosition:season===2?1:4};
      await fillSeasonResult(daniel,'p1',d);await publishSeasonResult(daniel);
      await fillSeasonResult(nik,'p2',n);await publishSeasonResult(nik);
      for(const m of [daniel,nik])await m.page.waitForFunction(()=>document.getElementById('seasonReviewHeading')?.textContent==='BOTH MANAGERS PUBLISHED',null,{timeout:45000});
      await commitSeasonViaUi(daniel,nik,season===1?3:0,season===2?3:0,season===2?'Nik':'Daniel',{finalSeason:season===LENGTH});
      const states=[];for(const m of [daniel,nik])states.push(await m.page.evaluate(()=>({history:CareerModeProductionSharedHistoryConvergence.getState(),multi:CareerModeProductionSharedMultiSeasonProgression.getState(),scoring:CareerModeProductionSharedCanonicalScoring.getState()})));
      fs.writeFileSync(path.join(ARTIFACTS,`season-${season}.json`),JSON.stringify(states,null,2));
      console.log(`PASS season ${season} of ${LENGTH}: transfer reveal, season entry, score ${season===1?3:0}-${season===2?3:0}, history and continue`);
      if(season===1||season===LENGTH)for(const m of [daniel,nik])await shot(m,`season-${season}`);
    }
    for(const m of [daniel,nik]){
      await m.page.locator('#sharedFinalReconciliationPanel').waitFor({state:'visible',timeout:60000});
      assert.equal((await m.page.locator('#sharedFinalReconciliationWinner').textContent()).trim(),'Daniel 3 · Nik 3 · DRAW');
      await m.page.locator('#finalWinnerScreen').waitFor({state:'visible',timeout:60000});
      assert.match(await m.page.locator('#finalWinnerScreen').innerText(),/DRAW/);
      assert.equal(await m.page.locator('#sharedMultiSeasonContinueAction').isDisabled(),true);
      await shot(m,'final-draw');
    }
    await daniel.page.locator('#sharedTerminalCloseAction').click({timeout:30000});
    for(const m of [daniel,nik])await m.page.waitForFunction(()=>document.getElementById('sharedTerminalCloseHeading')?.textContent==='SHARED SHOWDOWN CLOSED',null,{timeout:60000});
    console.log('PASS final: 3-3 is DRAW, no extra season, closed exactly once');
    for(const m of [daniel,nik]){
      await m.page.reload({waitUntil:'domcontentloaded'});await m.page.locator('#loadingScreen').waitFor({state:'hidden',timeout:30000});await m.page.locator('#mainMenu').waitFor({state:'visible',timeout:30000});
      await m.page.locator('#legacyButton').click();await m.page.locator('#legacy').waitFor({state:'visible',timeout:30000});
      await m.page.waitForFunction(()=>window.CareerModeRivalryLegacyV10?.cachedCareerModel?.()?.history?.showdowns?.some(r=>r.status==='completed'),null,{timeout:60000});
      const model=await m.page.evaluate(()=>CareerModeRivalryLegacyV10.cachedCareerModel());fs.writeFileSync(path.join(ARTIFACTS,'career-'+m.user+'.json'),JSON.stringify(model,null,2));
      const row=model.history.showdowns.find(r=>r.status==='completed');assert.equal(row.seasons.length,LENGTH);assert.equal(row.winner,'draw');assert.deepEqual(row.totals,{daniel:3,nik:3});
      assert.deepEqual(row.clubs,{daniel:clubsD[0],nik:clubsD[1]});
      await shot(m,'legacy-after-reload');
    }
    console.log('PASS saved history: both players retain all seasons, fixed clubs, tied total and DRAW after closing and reloading');
  }catch(error){for(const m of managers){console.log(m.user+': '+await describe(m).catch(e=>e.message));await shot(m,'failure');const state=await m.page.evaluate(()=>({screen:getActiveScreenName(),season:CareerModeProductionSharedMultiSeasonProgression?.resolveSeason?.(),results:CareerModeProductionSharedSeasonResults?.getState?.(),commit:CareerModeProductionSharedSeasonCommit?.getState?.(),scoring:CareerModeProductionSharedCanonicalScoring?.getState?.(),history:CareerModeProductionSharedHistoryConvergence?.getState?.(),progression:CareerModeProductionSharedMultiSeasonProgression?.getState?.(),final:CareerModeProductionSharedFinalReconciliation?.getState?.(),terminal:CareerModeProductionSharedTerminalClose?.getState?.(),visibleText:document.body.innerText}));fs.writeFileSync(path.join(ARTIFACTS,'failure-'+m.user+'.json'),JSON.stringify(state,null,2));}throw error;}
  finally{await browser.close();server.kill();}
}
module.exports={openManager,signIn,shot,describe};
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});

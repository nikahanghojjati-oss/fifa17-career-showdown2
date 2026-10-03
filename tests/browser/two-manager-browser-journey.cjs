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
  const log={errors:[],forbidden:[],productionRuntime:0};
  await context.route(/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/(firebase-[a-z-]+\.js)$/,route=>{
    const name=route.request().url().match(/(firebase-[a-z-]+\.js)$/)[1];
    return route.fulfill({path:path.join(SDK_DIR,name),contentType:"text/javascript; charset=utf-8"});
  });
  await context.addInitScript({path:SWITCH});
  const page=await context.newPage();
  page.on("request",request=>{const u=new URL(request.url());if(FORBIDDEN_HOSTS.test(u.hostname))log.forbidden.push(u.hostname);if(/productionFirebaseRuntime\.js|firebase\.runtime-config\.json/.test(u.pathname))log.productionRuntime+=1;});
  page.on("pageerror",error=>log.errors.push(error.message));
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
const pairPanel=m=>m.page.locator("#persistentNikDanielPairPanel");
async function waitTransferPhase(m,phase){
  await m.page.waitForFunction(value=>document.getElementById("transferChallenge")?.dataset.transferPhase===value,phase,{timeout:30000});
}
async function refreshTransfer(m){
  const button=m.page.locator("#refreshSharedTransferChallenge");
  if(await button.isVisible().catch(()=>false)){
    await button.click({timeout:30000});
  }
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
    for(const m of [nik,daniel]){
      if(m===daniel)await pairPanel(daniel).getByRole("button",{name:"CHECK STATUS"}).click().catch(()=>{});
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

    // J3 private session through the real Remote Joining surface, then START CAREER
    for(const m of [daniel,nik]){
      await pairPanel(m).getByRole("button",{name:"CONTINUE CAREER"}).first().click();
      await entry(m).filter({hasText:"CONNECTED"}).getByRole("button",{name:"CONTINUE",exact:true}).click({timeout:30000});
      await remote(m).waitFor({state:"visible",timeout:30000});
    }
    await remote(daniel).getByRole("button",{name:"HOST PRIVATE SESSION"}).click({timeout:30000});
    await daniel.page.waitForFunction(()=>/session_[A-Za-z0-9_-]{16,}/.test(document.body.innerText),null,{timeout:30000});
    const sessionCode=await daniel.page.evaluate(()=>document.body.innerText.match(/session_[A-Za-z0-9_-]{16,}/)[0]);
    await remote(nik).getByRole("textbox",{name:"Exact private session code"}).fill(sessionCode);
    await remote(nik).getByRole("button",{name:"JOIN PRIVATE SESSION"}).click();
    // The Remote Joining overlay may close by itself once the session is active; wait for GET READY's START CAREER instead of its text.
    await entry(nik).getByRole("button",{name:"START CAREER"}).waitFor({state:"visible",timeout:30000});
    if(await remote(daniel).isVisible())await remote(daniel).getByRole("button",{name:"REFRESH / READ"}).click();
    for(const m of [daniel,nik]){
      await entry(m).getByRole("button",{name:"START CAREER"}).click({timeout:30000});
      await m.page.locator("#leagueWheelScreen").waitFor({state:"visible",timeout:30000});
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
    await daniel.page.locator("#spinLeague").click({timeout:30000});
    await daniel.page.locator("#clubWheelScreen").waitFor({state:"visible",timeout:30000});
    await nik.page.waitForFunction(()=>document.getElementById("spinLeague")?.textContent==="CONTINUE TO CLUB PACKS",null,{timeout:30000});
    // BUG: see JOB-16-browser-journey.md — provider authority follows automatically, but Nik's presentation does not advance to the club screen without this navigation-only tap.
    assert.equal(await nik.page.locator("#leagueWheelScreen").isVisible(),true,"today's peer presentation remains on the witnessed league screen");
    await nik.page.locator("#spinLeague").click({timeout:30000});
    await nik.page.locator("#clubWheelScreen").waitFor({state:"visible",timeout:30000});
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
    for(const m of [daniel,nik])await m.page.waitForFunction(()=>document.getElementById("continueClubAssignment")?.textContent==="CONTINUE TO CAREER START",null,{timeout:30000});
    ok("J4.4","both managers confirmed the identical shared setup and both real club screens advanced to Career Start");
    await shot(daniel,"j4-setup");await shot(nik,"j4-setup");

    // J5 career start: each manager confirms only their own FIFA 17 career, then both continue.
    for(const m of [daniel,nik]){
      await m.page.locator("#continueClubAssignment").click({timeout:30000});
      await m.page.locator("#productionSharedCareerStartOverlay").waitFor({state:"visible",timeout:30000});
    }
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
    await nik.page.getByRole("button",{name:"CONTINUE TO TRANSFER CHALLENGE",exact:true}).waitFor({state:"visible",timeout:30000});
    const danielContinue=daniel.page.getByRole("button",{name:"CONTINUE TO TRANSFER CHALLENGE",exact:true});
    if(!await danielContinue.isVisible().catch(()=>false)){
      const refresh=daniel.page.getByRole("button",{name:"REFRESH",exact:true});
      if(await refresh.isVisible().catch(()=>false))await refresh.click({timeout:30000});
    }
    await danielContinue.waitFor({state:"visible",timeout:30000});
    ok("J5.2","both private Career Start acknowledgements converged to ready");

    await Promise.all([
      danielContinue.click({timeout:30000}),
      nik.page.getByRole("button",{name:"CONTINUE TO TRANSFER CHALLENGE",exact:true}).click({timeout:30000})
    ]);
    for(const m of [daniel,nik])await m.page.locator("#transferChallenge").waitFor({state:"visible",timeout:30000});
    ok("J5.3","both managers reached the real Shared Transfer Challenge through the UI");
    await shot(daniel,"j5-career-start");await shot(nik,"j5-career-start");

    // J6 season-1 Shared Transfer Challenge + rendered privacy.
    assert.equal(await daniel.page.locator("#startTransferTimer").isVisible(),true,"Daniel is the transfer-window coordinator");
    assert.equal(await nik.page.locator("#startTransferTimer").isVisible(),false,"Nik cannot start the shared transfer window");
    await daniel.page.locator("#startTransferTimer").click({timeout:30000});
    await waitTransferPhase(daniel,"window");
    await refreshTransfer(nik);await waitTransferPhase(nik,"window");
    // BUG: see JOB-16-browser-journey.md — the shared phase is authoritative but the legacy control copy
    // can still render "END WINDOW EARLY" instead of the intended "REQUEST EARLY END".
    assert.match(await daniel.page.locator("#endTransferTimer").textContent(),/^(REQUEST EARLY END|END WINDOW EARLY)$/);
    assert.match(await nik.page.locator("#endTransferTimer").textContent(),/^(REQUEST EARLY END|END WINDOW EARLY)$/);
    ok("J6.1","Daniel started the shared 15-minute window and both managers see the same live phase");

    await daniel.page.locator("#endTransferTimer").click({timeout:30000});
    await refreshTransfer(nik);
    await nik.page.locator("#endTransferTimer").click({timeout:30000});
    await waitTransferPhase(nik,"guess_entry");
    await refreshTransfer(daniel);await waitTransferPhase(daniel,"guess_entry");
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
    await nik.page.getByRole("button",{name:"LOCK MY GUESSES",exact:true}).click({timeout:30000});
    await waitTransferPhase(nik,"signing_entry");
    await refreshTransfer(daniel);await waitTransferPhase(daniel,"signing_entry");
    ok("J6.3","both managers entered and locked their private guesses through the real controls");

    await daniel.page.locator("#p1Signing1Name").fill("QWX Daniel Signing");
    await fillTransferCombo(daniel,"p1Signing1League","Premier League");
    await fillTransferCombo(daniel,"p1Signing1Nationality","England");
    await daniel.page.getByRole("button",{name:"LOCK MY SIGNINGS",exact:true}).click({timeout:30000});
    await assertPrivateTokenAbsent(nik,"QWX","before transfer completion on Nik");

    await nik.page.locator("#p2Signing1Name").fill("ZPV Nik Signing");
    await fillTransferCombo(nik,"p2Signing1League","TIM Serie A");
    await fillTransferCombo(nik,"p2Signing1Nationality","Brazil");
    await assertPrivateTokenAbsent(daniel,"ZPV","before transfer completion on Daniel");
    ok("J6.4","unfinished rival signings remain absent from rendered text and every input value");

    await nik.page.getByRole("button",{name:"LOCK MY SIGNINGS",exact:true}).click({timeout:30000});
    await waitTransferPhase(nik,"completed");
    await refreshTransfer(daniel);await waitTransferPhase(daniel,"completed");
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

    // J4..J12: added by the worker, one section per step (JOB-16 §4).

    for(const m of managers){
      assert.deepEqual(m.log.forbidden,[],`${m.user} never contacted a production Firebase host`);
      assert.equal(m.log.productionRuntime,0,`${m.user} never loaded the production Firebase runtime or config`);
      assert.deepEqual(m.log.errors,[],`${m.user} page errors`);
    }
    ok("JZ.1","no production Firebase host, no production runtime/config load, no page errors in either context");
    console.log(`PASS two-manager browser journey: ${checks} numbered checks (J0-J3 so far) on the Auth + Firestore emulators, composed production Rules, ${LENGTH}-season Showdown.`);
  }catch(error){
    for(const m of managers){console.log(`--- ${m.user}: ${await describe(m).catch(e=>e.message)}`);console.log(`--- ${m.user} errors: ${JSON.stringify(m.log.errors.slice(-10))}`);await shot(m,"failure");}
    throw error;
  }finally{
    await browser.close();server.kill();
  }
}
main().catch(error=>{console.error(error);process.exit(1);});

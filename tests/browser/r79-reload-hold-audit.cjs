// Codex #904 (P1), r79: a reload with Daniel's unfinished pre-pair shell while the player identity is still restoring. js/ssjr.js
// used to give the reload recovery at most 3 s behind the loading screen; when the identity took longer, Home showed and then the
// app jumped to the locked league wheel and WAITING. This audit makes the identity restore take 9 s, reloads, records every
// animation frame from the start of the load and fails on any frame that shows Home (or the bare wheel) once the loading screen
// has gone: the loading screen must stay until WAITING is back over the wheel (bounded by js/app.js's 15 s startup cap).
// The pair and the player identity are page fixtures (no Firebase), as in shared-showdown-paired-first-entry-audit.cjs.
const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");
const RESTORE_MS=9000;
const RIVALRY="pair_5"+"d".repeat(63);

// The fixtures for the reloaded page, installed before any app script (only once the probe flag is set).
function reloadFixtures({restoreMs,rivalryId}){
  let probe=null;try{probe=sessionStorage.getItem("r79ReloadHoldProbe");}catch(_error){probe=null;}
  if(probe!=="1")return;
  const listeners=new Set(),ready=()=>performance.now()>=restoreMs;
  const identityState=()=>ready()
    ?{status:"ready",initialized:true,busy:false,online:true,accountId:"account_daniel_fixture",managerId:"daniel",managerLabel:"Daniel",deviceId:"device_daniel_fixture",registered:true}
    :{status:"connecting",initialized:false,busy:true,online:true,accountId:null,managerId:null,managerLabel:null,deviceId:null,registered:false,message:"Connecting…"};
  setTimeout(()=>{for(const fn of [...listeners])try{fn(identityState());}catch(_error){}},restoreMs-performance.now()+5);
  const pairState=()=>({status:"waiting",initialized:true,busy:false,managerRole:"playerOne",connectionState:"pending-pair",rivalryId,capability:"CMS17-"+rivalryId,message:"Send this code to Nik. It is needed only once."});
  window.CareerModePersistentNikDanielPair={getState:pairState,initialize:async()=>pairState(),startPairing:async()=>pairState(),continuePair:async()=>pairState(),
    render:()=>{const slot=document.getElementById("connectPlayersPairSlot");if(!slot)return null;let panel=document.getElementById("persistentNikDanielPairPanel");if(!panel){panel=document.createElement("section");panel.id="persistentNikDanielPairPanel";slot.append(panel);}panel.textContent="WAITING FOR THE OTHER PLAYER";return panel;}};
  window.CareerModeOnlinePlayerIdentity={getState:identityState,initialize:async()=>identityState(),subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},
    openGate:()=>false,syncPair:async()=>(ready()?pairState():null),openStart:async()=>null,openJoin:async()=>null};
  window.__frames=[];
  const shown=el=>Boolean(el&&!el.classList.contains("hidden")&&el.getClientRects().length&&getComputedStyle(el).display!=="none"&&getComputedStyle(el).visibility!=="hidden"&&Number(getComputedStyle(el).opacity)>0);
  const tick=()=>{const layer=document.getElementById("connectPlayersScreen");
    window.__frames.push({t:Math.round(performance.now()),loading:shown(document.getElementById("loadingScreen")),home:shown(document.getElementById("mainMenu")),wheel:shown(document.getElementById("leagueWheelScreen")),waiting:shown(layer)&&Boolean(layer&&layer.querySelector("#persistentNikDanielPairPanel"))});
    if(window.__frames.length<20000)requestAnimationFrame(tick);};
  requestAnimationFrame(tick);
}

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await context.addInitScript(reloadFixtures,{restoreMs:RESTORE_MS,rivalryId:RIVALRY});
  const page=await context.newPage();
  const pageErrors=[];page.on("pageerror",error=>pageErrors.push(error.stack||error.message));
  try{
    // 1. Daniel taps START: his pre-pair shell is saved with the shared marker (as in the real app) and WAITING shows his code.
    await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
    await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:20000});
    await page.waitForFunction(()=>window.CareerModeOnlinePlayerIdentity&&document.getElementById("newShowdown")&&document.getElementById("startShowdown"),null,{timeout:12000});
    await page.evaluate(rivalryId=>{
      window.__pairState="unpaired";
      const pairState=()=>window.__pairState==="waiting"
        ?{status:"waiting",initialized:true,busy:false,managerRole:"playerOne",connectionState:"pending-pair",rivalryId,capability:"CMS17-"+rivalryId,message:"Send this code to Nik."}
        :{status:"unpaired",initialized:true,busy:false,managerRole:null,connectionState:null,rivalryId:null,message:"Daniel and Nik need to connect before the first Showdown."};
      window.CareerModePersistentNikDanielPair={getState:pairState,initialize:async()=>pairState(),startPairing:async()=>{window.__pairState="waiting";return pairState();},continuePair:async()=>pairState(),
        render:()=>{const slot=document.getElementById("connectPlayersPairSlot");if(!slot)return null;let panel=document.getElementById("persistentNikDanielPairPanel");if(!panel){panel=document.createElement("section");panel.id="persistentNikDanielPairPanel";slot.append(panel);}panel.textContent=window.__pairState==="waiting"?"WAITING FOR THE OTHER PLAYER":"CONNECT PLAYERS";return panel;}};
      // r79 PR4 (Nik): every Home START is real, so START first asks whether this account's real career has started
      // (js/showdownModes.js) and refuses while that cannot be checked. This fixture Daniel has already started his real career.
      window.CareerModeCareerStartMarker={readCurrentMarker:async()=>({status:"ready",hiddenRivalryIds:[],active:true,revision:0}),startRealCareer:async()=>{throw new Error("the fixture marker already exists");},hiddenRivalryIds:()=>[],epoch:()=>0,getState:()=>({status:"ready",accountId:"account_daniel_fixture"})};
      window.CareerModeOnlinePlayerIdentity={getState:()=>({status:"ready",initialized:true,online:true,accountId:"account_daniel_fixture",managerId:"daniel",managerLabel:"Daniel",deviceId:"device_daniel_fixture",registered:true}),openGate:()=>false,syncPair:async()=>pairState()};
      document.getElementById("startShowdown").textContent="";
    },RIVALRY);
    await page.waitForFunction(()=>document.getElementById("startShowdown")?.textContent==="START A SHOWDOWN",null,{timeout:8000});
    await page.locator("#newShowdown").click();
    await page.locator("#createShowdown").waitFor({state:"visible",timeout:8000});
    await page.locator("#startShowdown").click();
    await page.locator("#connectPlayersScreen #persistentNikDanielPairPanel",{hasText:"WAITING FOR THE OTHER PLAYER"}).waitFor({state:"visible",timeout:20000});
    assert.equal(await page.evaluate(()=>sessionStorage.getItem("careerModeShowdown.sharedJourneyPending.v1")),"1","the pre-pair shell is pending in this tab");
    // 2. Reload while the identity takes 9 s to restore.
    await page.evaluate(()=>sessionStorage.setItem("r79ReloadHoldProbe","1"));
    await page.reload({waitUntil:"domcontentloaded"});
    await page.locator("#connectPlayersScreen #persistentNikDanielPairPanel",{hasText:"WAITING FOR THE OTHER PLAYER"}).waitFor({state:"visible",timeout:30000});
    await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
    await page.waitForTimeout(500);
    const result=await page.evaluate(()=>({frames:window.__frames,screen:window.getActiveScreenName?.(),stay:document.getElementById("connectPlayersScreen")?.dataset.stayOnScreen}));
    const after=result.frames.filter(frame=>!frame.loading);
    assert.ok(after.length>0,"frames were recorded after the loading screen");
    const firstShown=after[0];
    const flashes=after.filter(frame=>!frame.waiting||(frame.home&&!frame.waiting));
    assert.deepEqual({screen:result.screen,stay:result.stay},{screen:"leagueWheelScreen",stay:"true"},"after the reload WAITING is back over the locked league wheel");
    assert.ok(firstShown.t>=RESTORE_MS,`the loading screen stayed while the identity restored (it left at ${firstShown.t} ms, identity ready at ${RESTORE_MS} ms)`);
    assert.equal(flashes.length,0,`${flashes.length} frame(s) after the loading screen showed something other than WAITING (first: ${JSON.stringify(flashes[0]||null)})`);
    assert.ok(firstShown.t<15000+1000,"and it never outlasts js/app.js's 15 s startup cap");
    assert.deepEqual(pageErrors,[],"page errors");
    console.log(`ok reload: loading screen held until ${firstShown.t} ms (identity ready at ${RESTORE_MS} ms), ${after.length} frames after it, all WAITING over the wheel`);
    console.log("PASS r79 reload hold: a slow identity restore keeps the loading screen up until WAITING is back; Home never flashes first.");
  }finally{
    await context.close().catch(()=>{});
    await browser.close().catch(()=>{});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});

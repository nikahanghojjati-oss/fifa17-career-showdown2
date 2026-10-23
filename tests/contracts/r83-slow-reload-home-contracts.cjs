"use strict";
// F2, docs/codex-reports-r83/966-JOB-1-continue-reload-2026-10-21.md.
// Real app startup, identity restoration, Home rendering and tab auto-resume in Chromium.
// Provider/entry fixtures retain an ACTIVE session; only a successful SDK response is delayed.
const assert=require("node:assert/strict");
const path=require("node:path");
const net=require("node:net");
const {spawn}=require("node:child_process");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");
const ROOT=path.resolve(__dirname,"../.."),RESTORE_MS=19000;
const RIVALRY=`pair_${"a".repeat(64)}`,SESSION=`session_${"b".repeat(64)}`;

function fixtures({manager,rivalryId,sessionId,restoreMs}){
  const reloading=sessionStorage.getItem("slowReloadProbe")==="1";
  const role=manager==="daniel"?"playerOne":"playerTwo",accountId=`fixture_${manager}`;
  const subscribers=new Set();
  let pair={status:"idle",initialized:false,busy:false,rivalryId:null,connectionState:null};
  const publish=next=>{pair=next;for(const fn of subscribers)fn(pair);return pair;};
  window.__resumeCalls=0;
  window.__fixturePair=publish;
  // Like Firebase's SDK import, this request succeeds after 19 s on the reloaded page.
  let sdk=null;
  const loadSdk=()=>sdk||(sdk=(async()=>{window.__sdkStarted=performance.now();if(reloading)await import(`/__slow-firebase-sdk.mjs?ms=${restoreMs}`);window.__sdkReady=performance.now();})());
  window.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>{await loadSdk();return {ok:true};}};
  window.CareerModeSparkConnectedAccount={initialize:async()=>{await loadSdk();},getState:()=>({connected:true,accountId})};
  window.CareerModeSparkPrivatePairing={initialize:async()=>{},getState:()=>({registered:true,deviceId:`device_${manager}`})};
  window.CareerModeShowdownModes={install(){},resolve:async()=>({mode:"real"}),getView:()=>({mode:"real"}),badgeSuffix:()=>""};
  window.CareerModePersistentNikDanielPair={
    getState:()=>pair,subscribe:fn=>{subscribers.add(fn);return()=>subscribers.delete(fn);},render(){},
    initialize:async()=>{
      await loadSdk();
      // Identity is ready before its current pair check finishes.
      if(reloading&&pair.initialized!==true)await new Promise(resolve=>setTimeout(resolve,700));
      return publish({status:"paired",initialized:true,busy:false,rivalryId,connectionState:"active",managerRole:role,managerId:manager});
    },
    continuePair:async()=>{
      window.__resumeCalls++;
      await new Promise(resolve=>setTimeout(resolve,400));
      window.__resumedSession=sessionId;
      // Entry fixture supplies the shell normally restored from the provider before routing.
      currentShowdown={id:"slow-reload",currentRound:1,totalRounds:3,status:"Ready",managers:{playerOne:"Daniel",playerTwo:"Nik"},sharedJourney:{mode:"shared",rivalryId},rounds:[],transferChallenges:[],score:{playerOne:0,playerTwo:0}};
      if(!window.showScreen("transferChallenge"))throw new Error("Fixture could not enter the active Transfer Challenge");
      return pair;
    }
  };
  // Journey entry is outside this presentation contract; no provider mutation is allowed.
  window.CareerModeProductionSharedJourneyEntry={install(){},startupResume:async()=>null};
  window.CareerModeProductionSharedTransferChallenge={install(){},canRoute:()=>Boolean(window.__resumedSession)};
  if(!reloading)return;
  window.__frames=[];
  const shown=el=>Boolean(el&&!el.hidden&&!el.classList.contains("hidden")&&el.getClientRects().length&&getComputedStyle(el).display!=="none"&&getComputedStyle(el).visibility!=="hidden"&&Number(getComputedStyle(el).opacity)>0);
  const tick=()=>{
    const tile=document.getElementById("newShowdown");
    window.__frames.push({t:Math.round(performance.now()),loading:shown(document.getElementById("loadingScreen")),home:shown(document.getElementById("mainMenu")),label:tile?.querySelector(".menuTileLabel")?.textContent,identity:window.CareerModeOnlinePlayerIdentity?.getState?.().status,pair:pair.status,busy:tile?.getAttribute("aria-busy")});
    if(!window.__resumedSession)requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

async function freePort(){return new Promise(resolve=>{const s=net.createServer();s.listen(0,"127.0.0.1",()=>{const port=s.address().port;s.close(()=>resolve(port));});});}
async function scenario(base,manager,runtime){
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:"reduce",serviceWorkers:"block"});
  try{
    await context.route(url=>!url.href.startsWith(base),route=>route.abort());
    await context.route("**/__slow-firebase-sdk.mjs?*",async route=>{
      await new Promise(resolve=>setTimeout(resolve,RESTORE_MS));
      await route.fulfill({status:200,contentType:"text/javascript",body:"export const ready = true;"});
    });
    await context.addInitScript(fixtures,{manager,rivalryId:RIVALRY,sessionId:SESSION,restoreMs:RESTORE_MS});
    const page=await context.newPage();
    const errors=[];page.on("pageerror",error=>errors.push(error.message));
    await page.goto(base,{waitUntil:"domcontentloaded"});
    await page.waitForFunction(()=>window.CareerModeOnlinePlayerIdentity?.getState?.().initialized);
    await page.evaluate(async manager=>{await window.CareerModeOnlinePlayerIdentity.chooseManager(manager);},manager);
    await page.waitForFunction(()=>window.CareerModePersistentNikDanielPair.getState().status==="paired");
    await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:20000});
    await page.locator("#newShowdown").waitFor({state:"visible"});
    // Begin at an ACTIVE Transfer Challenge, with this tab's existing one-bit live-game hint.
    await page.evaluate(async()=>{
      await window.CareerModePersistentNikDanielPair.continuePair();
      sessionStorage.setItem("careerModeShowdown.liveGame.v1","1");
      sessionStorage.setItem("slowReloadProbe","1");
    });
    assert.equal(await page.evaluate(()=>window.getActiveScreenName()),"transferChallenge","player starts inside the active Showdown");
    await page.reload({waitUntil:"domcontentloaded"});
    await page.waitForFunction(()=>window.__resumedSession,null,{timeout:35000});
    await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:5000});
    const result=await page.evaluate(()=>({frames:window.__frames,session:window.__resumedSession,calls:window.__resumeCalls,screen:window.getActiveScreenName(),sdkStarted:window.__sdkStarted,sdkReady:window.__sdkReady}));
    const exposed=result.frames.filter(f=>!f.loading&&f.home);
    const unresolved=exposed.filter(f=>f.identity!=="ready"||f.pair==="idle");
    assert.ok(result.sdkReady-result.sdkStarted>=RESTORE_MS,`successful SDK response really took at least ${RESTORE_MS} ms`);
    assert.ok(unresolved.length>10,`${manager}: bounded cover reveals Home while the successful SDK/pair restore is unresolved; SDK ${result.sdkStarted}-${result.sdkReady}, first exposed ${JSON.stringify(exposed[0])}, exposed count ${exposed.length}`);
    assert.ok(unresolved.some(f=>f.t>=15000&&f.t<RESTORE_MS),"coverage crosses the 15 s startup limit before the 19 s response");
    const wrong=unresolved.filter(f=>f.label!=="CHECKING…"||f.busy!=="true");
    assert.equal(wrong.length,0,`${manager}: unresolved live reload must keep the existing CHECKING state; first bad frame: ${JSON.stringify(wrong[0])}`);
    assert.ok(exposed.every(f=>!["START A SHOWDOWN","JOIN DANIEL'S SHOWDOWN"].includes(f.label)),"no exposed Home frame advertises a new game");
    assert.ok(exposed.some(f=>f.label==="CONTINUE SHOWDOWN"),"resolved ACTIVE pair restores the normal continue tile");
    assert.equal(result.session,SESSION);assert.equal(result.calls,1);assert.equal(result.screen,"transferChallenge");
    // A current positive no-live answer permits the existing START/JOIN presentation.
    await page.evaluate(()=>{
      window.__fixturePair({status:"unpaired",initialized:true,busy:false,rivalryId:null,connectionState:null});
      window.CareerModeOnlinePlayerIdentity.refreshHome();
    });
    assert.equal(await page.locator("#newShowdown .menuTileLabel").textContent(),manager==="daniel"?"START A SHOWDOWN":"JOIN DANIEL'S SHOWDOWN");
    assert.equal(await page.locator("#newShowdown").getAttribute("aria-busy"),null);
    assert.deepEqual(errors,[],"no page errors");
    console.log(`ok ${manager}: ${unresolved.length} honest unresolved frames after bounded startup; same ACTIVE session resumes once`);
  }finally{await context.close();await browser.close();}
}
(async()=>{
  const port=await freePort(),base=`http://127.0.0.1:${port}/`;
  const server=spawn(process.execPath,[path.join(ROOT,"tests/support/static-server.cjs")],{cwd:ROOT,stdio:"ignore",env:{...process.env,CMS_TEST_PORT:String(port)}});
  try{
    for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break;}catch(_){}await new Promise(resolve=>setTimeout(resolve,50));}
    const runtime=await resolveChromiumRuntime(),failures=[];
    for(const manager of ["daniel","nik"]){try{await scenario(base,manager,runtime);}catch(error){failures.push(error);}}
    if(failures.length)throw new AggregateError(failures,"Slow successful reload Home contracts");
    console.log("PASS r83 slow-reload Home contracts: both managers, successful 19 s restore, bounded cover and no-live control");
  }finally{server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});

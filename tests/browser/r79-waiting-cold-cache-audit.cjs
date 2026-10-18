// Codex #904 (P1), r79: Daniel's START A SHOWDOWN on a cold cache. createShowdown() shows the locked league wheel at once; WAITING
// (the Connect Players layer: its script, stylesheet and plate) used to load only afterwards, so Daniel saw, and could tap, the bare
// locked wheel for as long as those files took. This audit makes Connect Players slow to arrive (1.5 s for its script and
// stylesheet), taps START, records every animation frame and fails on any frame that shows the locked league wheel without WAITING
// over it. The pair and the player identity are page fixtures (no Firebase), as in shared-showdown-paired-first-entry-audit.cjs.
const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");
const SLOW_MS=1500;
const viewports=[
  {name:"phone-portrait-390x844",viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},
  {name:"desktop-1280x800",viewport:{width:1280,height:800},deviceScaleFactor:1}
];

async function run(browser,spec){
  const context=await browser.newContext({viewport:spec.viewport,deviceScaleFactor:spec.deviceScaleFactor,isMobile:spec.isMobile,hasTouch:spec.hasTouch});
  const page=await context.newPage();
  const pageErrors=[];page.on("pageerror",error=>pageErrors.push(error.stack||error.message));
  try{
    await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
    await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:20000});
    await page.waitForFunction(()=>window.CareerModeOnlinePlayerIdentity&&document.getElementById("newShowdown")&&document.getElementById("startShowdown"),null,{timeout:12000});
    // Daniel, signed in, nothing live: START makes a new shell and the code.
    await page.evaluate(()=>{
      const rivalryId="pair_5"+"d".repeat(63);window.__pairState="unpaired";window.__codes=0;
      const pairState=()=>window.__pairState==="waiting"
        ?{status:"waiting",initialized:true,busy:false,managerRole:"playerOne",connectionState:"pending-pair",rivalryId,capability:"CMS17-"+rivalryId,message:"Send this code to Nik. It is needed only once."}
        :{status:"unpaired",initialized:true,busy:false,managerRole:null,connectionState:null,rivalryId:null,message:"Daniel and Nik need to connect before the first Showdown."};
      window.CareerModePersistentNikDanielPair={
        getState:pairState,initialize:async()=>pairState(),
        render:()=>{const slot=document.getElementById("connectPlayersPairSlot");if(!slot)return null;let panel=document.getElementById("persistentNikDanielPairPanel");if(!panel){panel=document.createElement("section");panel.id="persistentNikDanielPairPanel";slot.append(panel);}panel.textContent=window.__pairState==="waiting"?"WAITING FOR THE OTHER PLAYER":"CONNECT PLAYERS";return panel;},
        startPairing:async()=>{window.__codes+=1;window.__pairState="waiting";return pairState();},
        continuePair:async()=>pairState()
      };
      // r79 PR4 (Nik): every Home START is real, so START first asks whether this account's real career has started
      // (js/showdownModes.js) and refuses while that cannot be checked. This fixture Daniel has already started his real career.
      window.CareerModeCareerStartMarker={readCurrentMarker:async()=>({status:"ready",hiddenRivalryIds:[],active:true,revision:0}),startRealCareer:async()=>{throw new Error("the fixture marker already exists");},hiddenRivalryIds:()=>[],epoch:()=>0,getState:()=>({status:"ready",accountId:"account_daniel_fixture"})};
      window.CareerModeOnlinePlayerIdentity={
        getState:()=>({status:"ready",initialized:true,online:true,accountId:"account_daniel_fixture",managerId:"daniel",managerLabel:"Daniel",deviceId:"device_daniel_fixture",registered:true}),
        openGate:()=>false,syncPair:async()=>pairState()
      };
      document.getElementById("startShowdown").textContent="";
    });
    await page.waitForFunction(()=>document.getElementById("startShowdown")?.textContent==="START A SHOWDOWN",null,{timeout:8000});
    await page.locator("#newShowdown").click();
    await page.locator("#createShowdown").waitFor({state:"visible",timeout:8000});
    await page.waitForTimeout(400);
    // a cold cache for WAITING: nothing of Connect Players is in the page yet, and its files are slow to arrive
    const cold=await page.evaluate(()=>({layerScript:Boolean(window.CareerModeConnectPlayersScreenV10),layer:Boolean(document.getElementById("connectPlayersScreen")),sheet:Boolean(document.querySelector('link[data-optional-style="connect-players-v10"]'))}));
    assert.deepEqual(cold,{layerScript:false,layer:false,sheet:false},`${spec.name}: WAITING starts cold`);
    await page.route(/\/(js\/connectPlayersScreenV10\.js|css\/connectPlayersV10\.css)(\?|$)/,async route=>{await new Promise(resolve=>setTimeout(resolve,SLOW_MS));await route.continue();});
    // every frame from the START tap on: is the locked wheel shown, and is WAITING over it?
    await page.evaluate(()=>{
      window.__frames=[];const shown=el=>Boolean(el&&!el.classList.contains("hidden")&&el.getClientRects().length&&getComputedStyle(el).display!=="none"&&getComputedStyle(el).visibility!=="hidden");
      const tick=()=>{const wheel=document.getElementById("leagueWheelScreen"),layer=document.getElementById("connectPlayersScreen");window.__frames.push({t:Math.round(performance.now()),wheel:shown(wheel),waiting:shown(layer)&&Boolean(layer.querySelector("#persistentNikDanielPairPanel"))});if(window.__frames.length<4000)requestAnimationFrame(tick);};
      requestAnimationFrame(tick);
    });
    await page.locator("#roundAmount").selectOption("3");
    await page.locator("#startShowdown").click();
    await page.locator("#connectPlayersScreen #persistentNikDanielPairPanel",{hasText:"WAITING FOR THE OTHER PLAYER"}).waitFor({state:"visible",timeout:20000});
    await page.waitForTimeout(300);
    const result=await page.evaluate(()=>({frames:window.__frames,screen:window.getActiveScreenName?.(),stay:document.getElementById("connectPlayersScreen")?.dataset.stayOnScreen,codes:window.__codes}));
    const bare=result.frames.filter(frame=>frame.wheel&&!frame.waiting);
    const wheelFrames=result.frames.filter(frame=>frame.wheel).length;
    assert.ok(wheelFrames>0,`${spec.name}: the locked league wheel was reached`);
    assert.deepEqual({screen:result.screen,stay:result.stay,codes:result.codes},{screen:"leagueWheelScreen",stay:"true",codes:1},`${spec.name}: WAITING over the locked league wheel, one code`);
    assert.equal(bare.length,0,`${spec.name}: ${bare.length} frame(s) showed the bare locked league wheel before WAITING (first at ${bare[0]&&bare[0].t} ms)`);
    assert.deepEqual(pageErrors,[],`${spec.name}: page errors`);
    console.log(`ok ${spec.name}: ${result.frames.length} frames recorded, ${wheelFrames} with the wheel, 0 bare (Connect Players delayed ${SLOW_MS} ms)`);
  }finally{await context.close().catch(()=>{});}
}

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  try{for(const spec of viewports)await run(browser,spec);}
  finally{await browser.close().catch(()=>{});}
  console.log("PASS r79 WAITING cold cache: START never shows the bare locked league wheel; WAITING covers it from the first frame.");
})().catch(error=>{console.error(error);process.exitCode=1;});

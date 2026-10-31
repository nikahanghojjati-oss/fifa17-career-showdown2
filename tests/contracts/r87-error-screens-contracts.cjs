#!/usr/bin/env node
"use strict";
// r87 (2.0.0) error, offline and quota screens. Players see plain words and a way forward, never raw codes or JS errors.
// E1  js/app.js reportApplicationError keeps plain detail and swaps technical detail (codes, JS errors, Firebase strings,
//     camelCase API names) for "Your career is safe. Try again, or reload the game." The detail still goes to the console.
// E2  The runtime boundary's words are plain ("Something went wrong on this screen"), not "A runtime error was detected".
// E3  The Transfer Challenge error text never falls back to a raw provider code.
// E4  The sign-in gate: offline says what to do; quota has BACK TO HOME; a technical error message becomes plain words.
// E5  Offline: the error screens' fonts are served from the precached shell without ?v= (the titles fell back to Times),
//     and the marble tile sits under the room picture so an uncached picture leaves black-and-gold marble, not flat black.
// E6  Browser: the real gate at 390x844 and 1440x900 shows those words and buttons on the marble screen, no dimming.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),net=require("node:net"),vm=require("node:vm");
const {spawn}=require("node:child_process");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
let passed=0;
const check=(name,fn)=>{fn();passed+=1;console.log(`ok ${passed} ${name}`);};

function loadApp(){
  const listeners=new Map(),toasts=[],errors=[];
  const fakeNode=()=>({dataset:{},style:{},classList:{add(){},remove(){}},addEventListener(){},setAttribute(){},appendChild(){},append(){},remove(){},querySelector:()=>null});
  const sandbox={URL,
    document:{readyState:"complete",querySelector:()=>null,getElementById:()=>null,createElement:fakeNode,head:fakeNode(),body:fakeNode(),addEventListener(){}},
    location:{href:"https://example.test/",origin:"https://example.test"},
    console:{debug(){},error:(...args)=>errors.push(args.join(" ")),warn(){},log(){}},
    addEventListener:(type,fn)=>listeners.set(type,fn),
    requestAnimationFrame(){},setTimeout(){return 0;},clearTimeout(){},
    initializeStorageLifecycle(){},initializeScreens(){},initializeMenuExperience(){},initializeOptionalModules(){},
    showScreen:()=>true};
  sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(read("js/app.js"),sandbox);
  sandbox.showAppNotice=(message,type)=>toasts.push(`${type}:${message}`);
  return {sandbox,listeners,toasts,errors};
}

check("E1 toasts keep plain detail and hide technical detail",()=>{
  const {sandbox,toasts,errors}=loadApp();
  const SAFE="Your career is safe. Try again, or reload the game.";
  const technical=["Cannot read properties of undefined (reading 'seasons')","TRANSFER_PROVIDER_FAILED","Firebase: Error (auth/network-request-failed).","Missing or insufficient permissions.","ResizeObserver loop failed","x is not a function()",""];
  for(const detail of technical){
    toasts.length=0;sandbox.reportApplicationError("Season Results did not open",detail?new Error(detail):null);
    assert.equal(toasts[0],`error:Season Results did not open. ${SAFE}`,`technical detail hidden: ${JSON.stringify(detail)}`);
  }
  for(const detail of ["Today's free online limit is used up. It resets at 3 am Boston time. Your saved career is safe.","Nik has not published yet. Tap COMMIT SHARED SEASON when both results are in."]){
    toasts.length=0;sandbox.reportApplicationError("Online play is paused for today",new Error(detail));
    assert.equal(toasts[0],`error:Online play is paused for today. ${detail}`,"plain detail kept");
  }
  assert.ok(errors.some(line=>line.includes("Season Results did not open")),"the detail still reaches the console");
});

check("E2 the runtime boundary and startup use plain words",()=>{
  const app=read("js/app.js");
  for(const old of ["A runtime error was detected","An unexpected application error was detected","The application could not finish initializing"])assert.ok(!app.includes(old),old);
  const {listeners,toasts}=loadApp();
  listeners.get("error")({message:"TypeError: x is not a function",filename:"https://example.test/js/clubScreenV10.js"});
  assert.equal(toasts[0],"error:Something went wrong on this screen. Your career is safe. Try again, or reload the game.");
  const jargon={"js/productionSharedJourneyGuard.js":["Shared Showdown polished presentation action failed","Shared Career Start action failed"],"js/transferChallenge.js":["Transfer Challenge completion failed","Unable to start the transfer window","Unable to open the Transfer Challenge"],"js/seasonEngine.js":["Season saved, but the summary screen failed"],"js/optionalModules.js":["Required football presentation could not be prepared"],"js/footballVisuals.js":["Required football photograph could not be prepared"],"js/diagnostics.js":['reportApplicationError("Application integrity check failed"'],"js/productionSharedSeasonResultsRoute.js":["Unable to open Shared Season Results"]};
  for(const [file,words] of Object.entries(jargon))for(const w of words)assert.ok(!read(file).includes(w),`${file}: ${w}`);
});

check("E3 the Transfer Challenge never shows a raw code",()=>{
  const src=read("js/productionSharedTransferChallenge.js");
  const fn=src.match(/function pstcErrorText\(error,fallback\)\{[^\n]*?return fallback;\}/);
  assert.ok(fn,"pstcErrorText ends on its plain fallback");
  assert.ok(!/return code\|\|message\|\|fallback/.test(src),"no raw code fallback");
  assert.ok(/message!==code&&!\//.test(fn[0]),"a raw message is shown only when it reads as plain words");
});

check("E4 the sign-in gate words and buttons",()=>{
  const src=read("js/onlinePlayerIdentity.js");
  assert.ok(!src.includes("Connection required. Reconnect"),"offline says what to do");
  assert.ok((src.match(/You are offline\. Turn on Wi-Fi or mobile data, then tap TRY AGAIN\. Your career is safe\./g)||[]).length>=3);
  assert.match(src,/ONLINE PLAY PAUSED FOR TODAY";copy\.textContent=quotaPaused;card\.append\(one\(createOnlineIdentityButton\("BACK TO HOME",closeOnlineIdentityGate,"primary"\)\)\);/);
  assert.match(src,/CONNECTION NEEDS ATTENTION";[^\n]*The game could not reach the online server\. Check your connection, then tap TRY AGAIN\. Your career is safe\./);
});

check("E5 offline fonts and the marble fallback",()=>{
  const sw=read("service-worker.js");
  const set=sw.match(/const UNVERSIONED_SHELL_ASSET_PATHS = new Set\(\[([\s\S]*?)\]\);/)[1];
  const shell=sw.match(/const SHELL_PATHS = Object\.freeze\(\[([\s\S]*?)\]\);/)[1];
  for(const font of ["barlow-condensed-latin-600-normal","barlow-condensed-latin-700-normal","barlow-latin-400-normal","barlow-latin-600-normal","kaushan-script-latin-400-normal"]){
    const p=`"visual-assets/v10_1/shared/fonts/${font}.woff2"`;
    assert.ok(set.includes(p),`${font} is served unversioned from the shell`);
    assert.ok(shell.includes(p),`${font} is precached`);
  }
  const css=read("css/r78-marble-surfaces.css");
  assert.match(css,/\.r78-error-screen--plate \{\n  background: image-set\([^\n]*center \/ cover no-repeat,\n    #07080a url\("r78-marble-tile\.webp"\) 0 0 \/ 256px 256px repeat;/);
  assert.match(css,/\.r78-error-screen--plate \{ background-image: url\("\.\.\/visual-assets\/v10_1\/plates-v2\/ENV_SETTINGS_PHONE_V2\.webp"\), url\("r78-marble-tile\.webp"\); \}/);
  assert.match(css,/#onlinePlayerIdentityOverlay \{\n  background: image-set\([^\n]*no-repeat,\n    #07080a url\("r78-marble-tile\.webp"\) 0 0 \/ 256px 256px repeat !important;/);
  assert.match(css,/#onlinePlayerIdentityOverlay \{ background-image: url\("\.\.\/visual-assets\/v10_1\/plates-v2\/ENV_SETTINGS_PHONE_V2\.webp"\), url\("r78-marble-tile\.webp"\) !important; \}/);
});

check("E7 the connection panel and the save check speak plainly (proofread W3-7)",()=>{
  const srj=read("js/sparkRemoteJoining.js");
  const msgs=[...srj.matchAll(/message:(?:"([^"]*)"|`([^`]*)`)/g)].map(m=>m[1]??m[2]);
  assert.ok(msgs.length>20,"messages found");
  for(const m of msgs)assert.doesNotMatch(m,/capability|page.memory|provider acknowledgement|exact (?:same|private|active|open)|private session|authority/i,m);
  assert.match(srj,/function srjPlain\(error,fallback\)/);
  assert.ok(!/error&&error\.message\?error\.message:|error&&error\.message\|\|"/.test(srj),"no raw error.message reaches the panel");
  const S=new Function("error","fallback",srj.match(/function srjPlain\(error,fallback\)\{([^\n]*)\}/)[1]);
  assert.equal(S(new Error("Firebase: Error (auth/network-request-failed)."),"Could not connect. Try again."),"Could not connect. Try again.");
  assert.equal(S(new Error("Nik's phone could not be reached. Check your connection."),"x"),"Nik's phone could not be reached. Check your connection.");
  const lr=read("js/productionSharedLocalReconciliation.js");
  for(const old of ["DOUBLE-CHECK","PREVIEW READY","ADVANCED RECOVERY","APPLY REMAINS DISABLED","Waiting for your rival to finish the last season"])assert.ok(!lr.includes(old),old);
  assert.match(lr,/"Waiting for your rival's result\. It appears here by itself\."/);
});

function freePort(){return new Promise((resolve,reject)=>{const s=net.createServer();s.unref();s.on("error",reject);s.listen(0,"127.0.0.1",()=>{const {port}=s.address();s.close(()=>resolve(port));});});}
async function waitForServer(port){for(let i=0;i<100;i++){const ok=await new Promise(r=>{const c=net.connect(port,"127.0.0.1",()=>{c.end();r(true);});c.on("error",()=>r(false));});if(ok)return;await new Promise(r=>setTimeout(r,100));}throw new Error("static server did not start");}

async function gate(browser,base,opts,state,quota){
  const context=await browser.newContext(opts);
  // Test hook only: expose the gate's own state setter so each state renders through the shipped render path.
  await context.route("**/js/onlinePlayerIdentity.js*",async route=>{const res=await route.fetch();const body=(await res.text()).replace('"use strict";','"use strict";root.__r87SetGate=s=>{gateOpen=true;setOnlineIdentityState(s);renderOnlineIdentityOverlay();};');await route.fulfill({response:res,body});});
  await context.route("https://**/*",route=>route.abort());
  const page=await context.newPage();
  try{
    await page.goto(base,{waitUntil:"domcontentloaded"});
    await page.waitForFunction(()=>document.getElementById("loadingScreen")?.classList.contains("hidden")&&typeof window.__r87SetGate==="function",null,{timeout:30000});
    return await page.evaluate(([state,quota])=>{
      if(quota)window.CareerModeFirestoreBudget.noteError({code:"resource-exhausted"});
      window.__r87SetGate(state);
      const el=document.getElementById("onlinePlayerIdentityOverlay"),cs=getComputedStyle(el);
      const buttons=[...el.querySelectorAll("button")].map(b=>b.textContent.trim()).filter(t=>t!=="×");
      const back=quota?(()=>{[...el.querySelectorAll("button")].find(b=>b.textContent.trim()==="BACK TO HOME").click();return !document.getElementById("onlinePlayerIdentityOverlay");})():null;
      return {title:el.querySelector("h2").textContent,body:el.querySelector(".r78-error-screen__body").textContent,buttons,bg:cs.backgroundImage,filter:cs.backdropFilter,opacity:cs.opacity,back};
    },[state,quota]);
  }finally{await context.close();}
}

(async()=>{
  const {chromium}=require("playwright");
  const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");
  const port=await freePort();
  const server=spawn(process.execPath,[path.join(ROOT,"tests/support/static-server.cjs")],{cwd:ROOT,stdio:"ignore",env:{...process.env,CMS_TEST_PORT:String(port)}});
  let browser=null;
  try{
    await waitForServer(port);
    const runtime=await resolveChromiumRuntime();
    browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args.filter(arg=>arg!=="--single-process")});
    const base=`http://127.0.0.1:${port}/`;
    for(const opts of [{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},{viewport:{width:1440,height:900}}]){
      const tag=`${opts.viewport.width}x${opts.viewport.height}`;
      const err=await gate(browser,base,opts,{status:"error",online:true,busy:false,message:"Firebase: Error (auth/network-request-failed)."},false);
      assert.equal(err.title,"CONNECTION NEEDS ATTENTION",tag);
      assert.equal(err.body,"The game could not reach the online server. Check your connection, then tap TRY AGAIN. Your career is safe.",`${tag} technical sign-in error becomes plain words`);
      assert.deepEqual(err.buttons,["TRY AGAIN"],tag);
      assert.match(err.bg,/r78-marble-tile\.webp/,`${tag} marble under the room picture`);
      assert.equal(err.filter,"none",`${tag} no blur`);assert.equal(err.opacity,"1",`${tag} opaque`);
      const quota=await gate(browser,base,opts,{status:"error",online:true,busy:false,message:"x"},true);
      assert.equal(quota.title,"ONLINE PLAY PAUSED FOR TODAY",tag);
      assert.deepEqual(quota.buttons,["BACK TO HOME"],`${tag} quota has a way back`);
      assert.equal(quota.back,true,`${tag} BACK TO HOME closes the gate`);
      const off=await gate(browser,base,opts,{status:"offline",online:false,busy:false,message:"You are offline. Turn on Wi-Fi or mobile data, then tap TRY AGAIN. Your career is safe."},false);
      assert.equal(off.title,"CONNECTION REQUIRED",tag);assert.deepEqual(off.buttons,["TRY AGAIN"],tag);
    }
    passed+=1;console.log(`ok ${passed} E6 the real sign-in gate at 390x844 and 1440x900: plain words, a way forward, marble, no dimming`);
    console.log(`PASS r87 error screens contracts: ${passed} checks.`);
  }finally{
    if(browser)await browser.close();
    server.kill();
  }
})().catch(error=>{console.error(error);process.exit(1);});

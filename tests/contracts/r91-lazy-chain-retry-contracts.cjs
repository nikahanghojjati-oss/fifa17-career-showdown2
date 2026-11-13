#!/usr/bin/env node
"use strict";
// R92-05 (L1 in the 2.4.0 Fable re-check, P2, also on 2.3.0): one later game file that did not arrive after a reload (seen:
// js/sharedShowdownCatalog.js aborted at the season 6 reload of Daniel's phone in a 10-season CE2PG run) left the phone
// half-working. js/ssjr.js kept the failed Shared Journey chain for the life of the page and only logged a warning: Home looked
// normal, but scoring, History, multi-season, reconnect, final reconciliation and Terminal Close never loaded until a manual reload.
// The fix (js/ssjr.js):
//   L1-1 a lost file is asked for again once, after a short pause, with no reload (files that arrived are not asked for again,
//        and no module is installed twice);
//   L1-2 lost again: index.html's cmsBootFail does one silent reload, and the game loads after it;
//   L1-3 never a loop: a tab mark (cmsChainRetry) means a file lost again after that reload shows the marble RELOAD screen, and
//        the mark is cleared once the chain loads;
//   L1-4 never in the middle of a tap that writes: the reload waits while a write is marked busy.
// On the old code (gameplay/r91 712f6301) L1-1 and L1-2 fail: six game modules never load and the page never reloads.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),net=require("node:net");
const {spawn}=require("node:child_process");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
let passed=0;const ok=name=>{passed+=1;console.log(`ok ${passed} ${name}`);};

// ---- source ----
const ssjr=read("js/ssjr.js"),html=read("index.html");
assert.match(html,/w\.cmsBootFail=function\(what,why\)/,"index.html still defines cmsBootFail (the one-reload guard)");
assert.match(html,/var K="cmsBootRetry"/,"index.html's guard mark is still cmsBootRetry (js/ssjr.js sets it to skip a second reload)");
assert.match(ssjr,/const sharedChain=\(\)=>chainRun\|\|\(chainRun=chainOnce\(\)\.catch\(async error=>\{[^]*?await pause\(CHAIN_RETRY_MS\);return chainOnce\(\);[^]*?\}\)\.catch\(error=>\{chainRun=null;void chainFailed\(error\);throw error;\}\)\);/,"L1-1: one more run after a pause; a second failure forgets the chain and goes to chainFailed");
assert.match(ssjr,/if\(installs\.has\(id\)\)return installs\.get\(id\);/,"L1-1: one install per module (a retry never installs a module twice)");
assert.match(ssjr,/installs\.delete\(id\)/,"L1-1: a failed install is forgotten so it can be asked for again");
assert.match(ssjr,/writeBusy\(\)\|\|Date\.now\(\)-lastTap<CHAIN_QUIET_MS/,"L1-4: the reload waits for writes and recent taps");
assert.match(ssjr,/if\(settled\)return;/,"L1-4: no reload if the game loaded meanwhile");
ok("source: retry once, then cmsBootFail with a tab mark; one install per module; waits for writes");

// ---- browser ----
const GLOBALS=["CareerModeSharedShowdownCatalog","CareerModeProductionSharedCareerStart","CareerModeProductionSharedSeasonResults","CareerModeProductionSharedSeasonCommit","CareerModeProductionSharedTransferChallenge","CareerModeProductionSharedCanonicalScoring","CareerModeProductionSharedHistoryConvergence","CareerModeProductionSharedMultiSeasonProgression","CareerModeProductionSharedJourneyReconnect","CareerModeProductionSharedFinalReconciliation","CareerModeProductionSharedTerminalClose"];
function freePort(){return new Promise((resolve,reject)=>{const s=net.createServer();s.unref();s.on("error",reject);s.listen(0,"127.0.0.1",()=>{const {port}=s.address();s.close(()=>resolve(port));});});}
async function waitForServer(port){for(let i=0;i<100;i+=1){const up=await new Promise(r=>{const c=net.connect(port,"127.0.0.1",()=>{c.end();r(true);});c.on("error",()=>r(false));});if(up)return;await new Promise(r=>setTimeout(r,100));}throw new Error("static server did not start");}
const STATE=async G=>{
  const vis=n=>Boolean(n&&!n.hidden&&n.getClientRects().length>0&&getComputedStyle(n).visibility!=="hidden"&&getComputedStyle(n).display!=="none");
  const home=document.getElementById("mainMenu"),fail=document.getElementById("bootFailScreen");
  let chain="blocked",boot="blocked";try{chain=sessionStorage.getItem("cmsChainRetry");boot=sessionStorage.getItem("cmsBootRetry");}catch(_e){}
  let ready="n/a";try{if(typeof window.CareerModeSharedJourneyReady==="function")ready=await Promise.race([window.CareerModeSharedJourneyReady(),new Promise(r=>setTimeout(()=>r("timeout"),16000))]);}catch(e){ready="threw";}
  return {home:vis(home)&&!home.classList.contains("hidden"),fail:vis(fail),failBg:fail?getComputedStyle(fail).backgroundColor:"",ready,missing:G.filter(g=>!window[g]).map(g=>g.replace("CareerMode","")),chain,boot,
    installs:window.__lazyInstallCount?{...window.__lazyInstallCount}:null};
};

(async()=>{
  const {chromium}=require("playwright");
  const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");
  const port=await freePort();
  const server=spawn(process.execPath,[path.join(ROOT,"tests/support/static-server.cjs")],{cwd:ROOT,stdio:"ignore",env:{...process.env,CMS_TEST_PORT:String(port)}});
  let browser=null;
  try{
    await waitForServer(port);
    const runtime=await resolveChromiumRuntime();
    browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args.filter(a=>a!=="--single-process")});
    const url=`http://127.0.0.1:${port}/?cmsEmulator=1&cmsEmulatorUser=daniel&cmsAuthPort=1&cmsFirestorePort=2`;
    // lose: "once" = only the first request for that file fails; "load" = every request in the first page load fails (the first
    // run and its retry, and any other loader asking for the same file); "always" = it never arrives. busy = a write marked busy.
    async function start(file,lose,{busy=false}={}){
      const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:"block"});
      await context.route(u=>!/^http:\/\/127\.0\.0\.1:/.test(u.href),route=>route.abort());
      let dropped=0,asked=0,loads=0;
      await context.route(u=>u.pathname===`/${file}`,route=>{asked+=1;if(lose==="always"||lose==="load"&&loads<=1||lose==="once"&&dropped<1){dropped+=1;return route.abort("connectionreset");}return route.continue();});
      // Counts install() calls per module, so a retry that installs a module twice shows.
      await context.addInitScript(G=>{window.__lazyInstallCount={};for(const g of G){let v;Object.defineProperty(window,g,{configurable:true,get(){return v;},set(api){
        if(api&&typeof api.install==="function"&&!Object.isFrozen(api)){const own=api.install;api.install=function(...a){window.__lazyInstallCount[g]=(window.__lazyInstallCount[g]||0)+1;return own.apply(this,a);};v=api;return;}
        if(api&&typeof api.install==="function"){const counted=Object.create(api);Object.defineProperty(counted,"install",{value:function(...a){window.__lazyInstallCount[g]=(window.__lazyInstallCount[g]||0)+1;return api.install.apply(api,a);}});
          for(const k of Object.keys(api))if(k!=="install")Object.defineProperty(counted,k,{enumerable:true,get(){return api[k];}});v=counted;return;}v=api;}});}},GLOBALS.filter(g=>g.startsWith("CareerModeProduction")));
      if(busy)await context.addInitScript(()=>{document.addEventListener("DOMContentLoaded",()=>{if(sessionStorage.getItem("lazyBusyDone"))return;const b=document.createElement("div");b.id="lazyBusy";b.setAttribute("data-transaction-busy","true");document.body.appendChild(b);},{once:true});});
      const page=await context.newPage();
      page.on("framenavigated",f=>{if(f===page.mainFrame())loads+=1;});
      await page.goto(url,{waitUntil:"domcontentloaded"});
      return {context,page,loads:()=>loads,asked:()=>asked,dropped:()=>dropped};
    }
    const settle=async(r,ms)=>{const t0=Date.now();let s=null;while(Date.now()-t0<ms){await r.page.waitForTimeout(500);s=await r.page.evaluate(STATE,GLOBALS).catch(()=>null);if(s&&s.fail)break;if(s&&s.home&&s.ready===true&&!s.missing.length)break;}return s;};

    {const r=await start("js/sharedShowdownCatalog.js","none");const s=await settle(r,30000);
      assert.ok(s.home&&s.ready===true&&!s.missing.length&&!s.fail,`good start ${JSON.stringify(s)}`);assert.equal(r.loads(),1);assert.equal(s.chain,null);
      await r.context.close();ok("good start: every game module loads, no reload, no mark");}

    for(const file of ["js/sharedShowdownCatalog.js","js/sharedMultiSeasonProgression.js"]){
      const r=await start(file,"once");const s=await settle(r,30000);
      assert.ok(s&&!s.fail&&s.home,`L1-1 ${file} lost once: Home, no error screen ${JSON.stringify(s)}`);
      assert.deepEqual(s.missing,[],`L1-1 ${file} lost once: every game module loads without a reload ${JSON.stringify(s)}`);
      assert.equal(s.ready,true,`L1-1 ${file} lost once: the Shared Journey is ready`);
      assert.equal(r.loads(),1,`L1-1 ${file} lost once: no reload (got ${r.loads()} page loads)`);
      assert.ok(r.asked()>=2&&r.dropped()===1,`L1-1 ${file}: lost once and asked for again (${r.asked()} asks)`);
      for(const [g,n] of Object.entries(s.installs||{}))assert.equal(n,1,`L1-1 ${g} installed once, not twice (${n})`);
      assert.equal(s.chain,null,"L1-1 no tab mark after a good retry");
      await r.page.waitForTimeout(3000);assert.equal(r.loads(),1,"L1-1 still no reload later");
      await r.context.close();
    }
    ok("a later game file lost once (catalog, multi-season): asked for again, every module loads, no reload, each installed once");

    {const r=await start("js/sharedShowdownCatalog.js","load");
      const t0=Date.now();while(r.loads()<2&&Date.now()-t0<45000)await r.page.waitForTimeout(250);
      assert.equal(r.loads(),2,`L1-2 lost twice: one silent reload (got ${r.loads()} page loads)`);
      const s=await settle(r,30000);
      assert.ok(s&&s.home&&!s.fail,`L1-2 after the reload: Home, no error screen ${JSON.stringify(s)}`);
      assert.deepEqual(s.missing,[],"L1-2 after the reload every game module loads");assert.equal(s.ready,true);
      let mark=s.chain;for(let i=0;i<20&&mark!==null;i+=1){await r.page.waitForTimeout(250);mark=await r.page.evaluate(()=>sessionStorage.getItem("cmsChainRetry"));}
      assert.equal(mark,null,"L1-3 the tab mark is cleared once the chain loads");assert.equal(s.boot,null,"index.html's mark is cleared by the good start");
      await r.page.waitForTimeout(3000);assert.equal(r.loads(),2,"L1-2 exactly one reload");
      await r.context.close();ok("a later game file lost twice: one silent reload, then every module loads; marks cleared");}

    {const r=await start("js/sharedShowdownCatalog.js","always");
      const t0=Date.now();let s=null;while(Date.now()-t0<70000){await r.page.waitForTimeout(500);s=await r.page.evaluate(STATE,GLOBALS).catch(()=>null);if(s&&s.fail)break;}
      assert.ok(s&&s.fail,`L1-3 never arrives: the marble RELOAD screen ${JSON.stringify(s)}`);
      assert.equal(s.failBg,"rgb(7, 8, 10)","L1-3 the error screen is opaque black marble (no dimming)");
      assert.equal(r.loads(),2,`L1-3 never arrives: one reload only (got ${r.loads()})`);
      await r.page.waitForTimeout(6000);assert.equal(r.loads(),2,"L1-3 no further reload while the error screen shows (never a loop)");
      const shot=process.env.CMS_LAZY_SHOTS;if(shot)await r.page.screenshot({path:path.join(shot,"lazy-chain-reload-screen-390x844.png")});
      await r.context.close();ok("a later game file that never arrives: one reload, then the RELOAD screen, never a loop");}

    {const r=await start("js/sharedShowdownCatalog.js","load",{busy:true});
      await r.page.waitForTimeout(9000);
      assert.equal(r.loads(),1,"L1-4 no reload while a write is marked busy");
      await r.page.evaluate(()=>{sessionStorage.setItem("lazyBusyDone","1");document.getElementById("lazyBusy")?.remove();});
      const t0=Date.now();while(r.loads()<2&&Date.now()-t0<10000)await r.page.waitForTimeout(250);
      assert.equal(r.loads(),2,"L1-4 the reload comes once the write is done");
      const s=await settle(r,30000);assert.deepEqual(s.missing,[]);assert.ok(s.home&&!s.fail);
      await r.context.close();ok("lost twice while a write is busy: the reload waits for the write, then the game loads");}

    console.log(`r91-lazy-chain-retry: ${passed} checks passed`);
  }finally{if(browser)await browser.close().catch(()=>{});server.kill();}
})().catch(error=>{console.error(error);process.exit(1);});

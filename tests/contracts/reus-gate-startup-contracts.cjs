#!/usr/bin/env node
"use strict";
// The Reus Gate (r75; owner Nik, 2026-10-13): on a slow or cold start the old Home (and a half-loaded Home) flashed for seconds
// as the Reus loading screen left. The loading screen left on a fixed 2.7 s timer while the Team V Home was still loading (it was
// only requested after two idle callbacks), and Home was not held by data-v10-pending yet because js/v10Screens.js had not loaded.
// The Reus Gate keeps the loading screen up until Home is really ready, judged by ready signals (Team V Home mounted, its sheets
// loaded, fonts ready, its pictures and plate decoded, data-v10-pending cleared), with js/app.js's minimum display time and a
// safety cap. This contract reproduces the slow start in a real browser (throttled CPU, Team V files delayed on the network) and
// fails on any frame where the loading screen no longer fully covers a Home that is not the finished Team V Home.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),net=require("node:net"),zlib=require("node:zlib");
const {spawn}=require("node:child_process");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const OLD_PAGE="rgb(168, 189, 197)";
const DELAY_MS=900;

// ---- source checks ----
const app=read("js/app.js"),ssjr=read("js/ssjr.js"),html=read("index.html");
const finish=(app.match(/function finishStartupPresentation\([^)]*\)\{[^]*?;if\(loadingScreen\)/)||[])[0]||"";
assert.match(finish,/careerModeHomeHold!==0/,"Reus Gate: js/app.js holds the loading screen until Home reports ready (careerModeHomeHold 0)");
assert.match(finish,/15e3/,"Reus Gate: the hold has a safety cap");
assert.match(app,/const STARTUP_SPLASH_MINIMUM_MS = 2700;/,"Reus Gate: the loading screen keeps its minimum display time");
assert.match(app,/window\.careerModeHomeHold=1;/,"Reus Gate: js/app.js marks Home on its way when it requests js/ssjr.js");
assert.match(ssjr,/const reusGate=async\(\)=>/,"Reus Gate: js/ssjr.js checks Home's ready signals");
for(const signal of [/V\.isMounted\("mainMenu"\)/,/fonts\.ready/,/\.decode\(\)/,/data-v10-pending/,/link\[data-v10-style\]/])assert.match(ssjr,signal,`Reus Gate signal ${signal}`);
assert.match(ssjr,/const home=v10\(\)\.then\(reusGate\)[^\n]*careerModeHomeHold=0/,"Reus Gate: Home's look starts at once and always reports back (ready or failed)");
const refs=[...html.matchAll(/(?:src|href)="((?:js|css|data)\/[^"?#]+)(?:\?v=([^"#]+))?/g)].map(m=>m[1]);
const gzip=refs.reduce((total,ref)=>total+zlib.gzipSync(fs.readFileSync(path.join(ROOT,ref)),{level:9}).length,0);
assert.ok(gzip<=37495,`startup gzip ${gzip} must stay <= 37495`);
console.log("ok Reus Gate source: app.js hold with minimum and cap, ssjr.js ready signals, startup budget");

// ---- browser ----
function freePort(){return new Promise((resolve,reject)=>{const server=net.createServer();server.unref();server.on("error",reject);server.listen(0,"127.0.0.1",()=>{const {port}=server.address();server.close(()=>resolve(port));});});}
async function waitForServer(port){for(let i=0;i<100;i+=1){const ok=await new Promise(resolve=>{const socket=net.connect(port,"127.0.0.1",()=>{socket.end();resolve(true);});socket.on("error",()=>resolve(false));});if(ok)return;await new Promise(resolve=>setTimeout(resolve,100));}throw new Error("static server did not start");}

// Every animation frame from the first one: the loading screen's cover, and what of Home shows once it no longer fully covers.
const RECORDER=`(() => {
  const rec = window.__reusGate = { frames: [], hiddenAt: null };
  const visible = el => { if(!el) return false; const r = el.getBoundingClientRect(); if(r.width < 2 || r.height < 2) return false; const s = getComputedStyle(el); return s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0.02; };
  const loop = () => {
    const L = document.getElementById("loadingScreen"), M = document.getElementById("mainMenu"), A = document.getElementById("app");
    if(L && M){
      const ls = getComputedStyle(L), cover = !L.hidden && ls.display !== "none" ? Number(ls.opacity) : 0;
      if(cover < 0.99){
        if(rec.hiddenAt === null) rec.hiddenAt = Math.round(performance.now());
        const shown = Boolean(A && !A.classList.contains("hidden") && !M.classList.contains("hidden") && getComputedStyle(M).display !== "none");
        const header = document.getElementById("topHeader"), hs = header ? getComputedStyle(header) : null;
        rec.frames.push({
          t: Math.round(performance.now()), cover, shown,
          teamV: M.classList.contains("v10Home"), pending: M.hasAttribute("data-v10-pending"),
          screen: document.documentElement.dataset.v10Screen || null, hold: window.careerModeHomeHold === undefined ? null : window.careerModeHomeHold,
          oldHeader: Boolean(hs && visible(header) && /249, 251, 251/.test(hs.backgroundImage)),
          lightPage: getComputedStyle(document.documentElement).backgroundColor === ${JSON.stringify(OLD_PAGE)} || getComputedStyle(document.body).backgroundColor === ${JSON.stringify(OLD_PAGE)},
          fonts: document.fonts ? document.fonts.status : "loaded",
          imgsNotReady: [...M.querySelectorAll("img")].filter(img => visible(img) && !(img.complete && img.naturalWidth > 0)).map(img => (img.currentSrc || img.src || "").split("/").pop()).slice(0, 4)
        });
      }
    }
    if(rec.frames.length < 400) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();`;

async function start(browser,base,{reducedMotion="no-preference",delay=true,stubIdle=false,abortLoader=false,cpu=2}={}){
  const context=await browser.newContext({viewport:{width:1920,height:910},deviceScaleFactor:1,serviceWorkers:"block",reducedMotion});
  await context.route(url=>!/^http:\/\/127\.0\.0\.1:/.test(url.href),route=>route.abort());
  // A slow network for Team V's files only (deterministic): the startup shell itself arrives as fast as before.
  await context.route(/\/(?:visual-assets\/v10_1\/|js\/v10Screens\.js|js\/homeScreensV10\.js)/,async route=>{
    if(abortLoader&&/js\/v10Screens\.js/.test(route.request().url()))return route.abort();
    if(delay)await new Promise(resolve=>setTimeout(resolve,DELAY_MS));
    return route.continue().catch(()=>{});
  });
  if(stubIdle)await context.addInitScript(()=>{window.requestIdleCallback=()=>1;window.cancelIdleCallback=()=>{};});
  await context.addInitScript(RECORDER);
  const page=await context.newPage();
  const cdp=await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate",{rate:cpu});
  await page.goto(base,{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:40000});
  await page.waitForTimeout(400);
  const rec=await page.evaluate(()=>window.__reusGate);
  return {context,page,rec};
}

function exposedOldHome(rec){
  return rec.frames.filter(f=>f.shown).filter(f=>!f.teamV||f.pending||f.screen!=="mainMenu"||f.oldHeader||f.lightPage||f.fonts!=="loaded"||f.imgsNotReady.length)
    .map(f=>`${f.t}ms cover ${f.cover}: teamV=${f.teamV} pending=${f.pending} screen=${f.screen} oldHeader=${f.oldHeader} lightPage=${f.lightPage} fonts=${f.fonts} imgs=${f.imgsNotReady.join("|")}`);
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

    for(const reducedMotion of ["no-preference","reduce"]){
      const {context,page,rec}=await start(browser,base,{reducedMotion});
      assert.ok(rec.frames.length>0,`Reus Gate (${reducedMotion}): frames were recorded after the loading screen left`);
      assert.deepEqual(exposedOldHome(rec),[],`Reus Gate (${reducedMotion}): the loading screen left before the Team V Home was ready (old or half-loaded Home shown)`);
      assert.equal(rec.frames[0].hold,0,`Reus Gate (${reducedMotion}): the loading screen leaves only after Home reported ready`);
      // The plate the gate decodes is the one this 1x screen paints (image-set densities are reported as dppx), never the 2X one.
      const doubles=await page.evaluate(()=>performance.getEntriesByType("resource").map(e=>e.name).filter(name=>/ENV_HOME_PLATE_V2_2X/.test(name)));
      assert.deepEqual(doubles,[],`Reus Gate (${reducedMotion}): a 1x desktop does not fetch Home's 2X plate`);
      console.log(`ok Reus Gate slow start (${reducedMotion}): loading screen handed over at ${rec.hiddenAt} ms to the finished Team V Home, no old Home frame`);
      await context.close();
    }

    // Safety: with no lazy loader at all (idle callbacks never run, as some audits arrange) the loading screen still leaves.
    {
      const {context,rec}=await start(browser,base,{delay:false,stubIdle:true,cpu:1});
      assert.ok(rec.hiddenAt!==null&&rec.hiddenAt<10000,`Reus Gate: without the lazy loader the loading screen still leaves (at ${rec.hiddenAt} ms)`);
      console.log(`ok Reus Gate fallback: no lazy loader, loading screen left at ${rec.hiddenAt} ms`);
      await context.close();
    }
    // Safety: a Team V loader that fails to load reports back at once, so the app's own Home is never lost behind the gate.
    {
      const {context,page,rec}=await start(browser,base,{delay:false,abortLoader:true,cpu:1});
      assert.ok(rec.hiddenAt!==null&&rec.hiddenAt<10000,`Reus Gate: a failed Team V loader releases the loading screen (at ${rec.hiddenAt} ms)`);
      assert.equal(await page.evaluate(()=>window.careerModeHomeHold),0,"Reus Gate: a failed Team V loader still reports back");
      console.log(`ok Reus Gate failure: Team V loader failed, loading screen left at ${rec.hiddenAt} ms`);
      await context.close();
    }
  }finally{
    if(browser)await browser.close().catch(()=>{});
    server.kill();
  }
  console.log("PASS Reus Gate startup contracts: source, slow start (motion and reduced motion), no-loader fallback, failed-loader release.");
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1);});

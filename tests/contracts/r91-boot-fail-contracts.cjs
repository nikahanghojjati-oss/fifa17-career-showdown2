#!/usr/bin/env node
"use strict";
// B1 (2.4.0 bug hunt, P2): one start-up file that does not arrive (a dropped request for js/storage.js, js/app.js, ...) left
// PREPARING CAREER MODE SHOWDOWN up for good, with no message and no button (seen in CE2PG season 6, then 3 of 3 with a dropped
// request). With js/screens.js dropped the loading screen left onto a half dead Home. Same on 2.3.0.
// The fix (index.html inline guard + js/app.js sa()):
//   B1-1 a failed start reloads once by itself; a sessionStorage mark (read and written in try/catch) means it can never loop;
//   B1-2 a second failure shows the black-and-gold marble error screen (.r78-error-screen--plate) with RELOAD, opaque, no dimming;
//   B1-3 the loading screen stays until the game or that screen is ready (Reus Gate); Home is never shown half started;
//   B1-4 a good start clears the mark, so a later failure in the same tab gets its one reload again;
//   B1-5 with sessionStorage blocked there is no reload at all: the error screen shows at once.
// The browser part drops each of the seven deferred start-up files once and twice; on the old code every case fails (the
// loading screen never leaves, or Home shows half started).
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),net=require("node:net");
const {spawn}=require("node:child_process");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
let passed=0;const ok=name=>{passed+=1;console.log(`ok ${passed} ${name}`);};

// ---- source ----
const html=read("index.html"),app=read("js/app.js");
const BOOT=["storage","showdown","scoring","screens","menuExperience","optionalModules","app"];
const scripts=[...html.matchAll(/<script defer src="js\/([A-Za-z]+)\.js\?v=[^"]+"><\/script>/g)].map(m=>m[1]);
assert.deepEqual(scripts,BOOT,"the seven deferred start-up files, in order (the guard's list must match them)");
const guardAt=html.indexOf("w.cmsBootFail=function"),firstBoot=html.indexOf('<script defer src="js/storage.js');
assert.ok(guardAt>0&&guardAt<firstBoot,"B1: the guard is inline in index.html, before the first start-up file (it must work when every file is lost)");
const guard=html.slice(html.lastIndexOf("<script>",guardAt),html.indexOf("</script>",guardAt));
for(const name of BOOT)assert.ok(guard.includes(name),`B1: the guard watches js/${name}.js`);
assert.match(guard,/function mark\(f\)\{try\{return f\(w\.sessionStorage\);\}catch\(e\)\{return null;\}\}/,"B1-1: sessionStorage only inside try/catch");
assert.match(guard,/getItem\(K\);\}\)===null&&mark\(function\(s\)\{s\.setItem\(K,"1"\);return s\.getItem\(K\);\}\)==="1"\)return location\.reload\(\)/,"B1-1/B1-5: reload only when the mark was absent AND could be written");
assert.match(guard,/r78-error-screen r78-error-screen--plate/,"B1-2: the marble error screen, the one the sign-in gate uses");
assert.match(guard,/textContent="RELOAD"/,"B1-2: one RELOAD button");
assert.doesNotMatch(guard,/opacity|rgba\(|backdrop|filter/i,"B1-2: no dimming, no see-through layer");
assert.doesNotMatch(guard,/href="(css|visual-assets)\//,"the error screen's sheets load only on failure (not counted in the start-up budget, never fetched on a good start)");
assert.match(guard,/typeof applicationStarted!=="undefined"&&applicationStarted/,"B1: a start counts once js/app.js's sa() has run");
assert.match(app,/let applicationStarted=false/,"js/app.js still names its start flag applicationStarted (the guard reads it)");
const sa=(app.match(/function sa\(\)\{[^]*?\}\s*document\.readyState/)||[])[0]||"";
assert.match(sa,/catch\(error\)\{return\(window\.cmsBootFail\|\|reportApplicationError\)\("The game did not start",error\);\}/,"B1: a failed sa() goes to the guard and returns (no hand-over to a half started Home)");
assert.ok(sa.indexOf("cmsBootFail")<sa.indexOf("requestAnimationFrame(()=>{ra();"),"B1-3: the loading screen is only handed over after a good start");
ok("source: inline guard before the start-up files, one reload, marble RELOAD screen, sa() hands failures over");

// ---- browser ----
function freePort(){return new Promise((resolve,reject)=>{const s=net.createServer();s.unref();s.on("error",reject);s.listen(0,"127.0.0.1",()=>{const {port}=s.address();s.close(()=>resolve(port));});});}
async function waitForServer(port){for(let i=0;i<100;i+=1){const up=await new Promise(r=>{const c=net.connect(port,"127.0.0.1",()=>{c.end();r(true);});c.on("error",()=>r(false));});if(up)return;await new Promise(r=>setTimeout(r,100));}throw new Error("static server did not start");}

const STATE=`(() => {
  const vis = n => Boolean(n && !n.hidden && n.getClientRects().length > 0 && getComputedStyle(n).visibility !== "hidden" && getComputedStyle(n).display !== "none" && Number(getComputedStyle(n).opacity) > 0.02);
  const l = document.getElementById("loadingScreen"), f = document.getElementById("bootFailScreen"), home = document.getElementById("mainMenu"), app = document.getElementById("app");
  let mark = "blocked"; try { mark = sessionStorage.getItem("cmsBootRetry"); } catch (e) {}
  return { loading: vis(l) && !l.classList.contains("is-exiting"), fail: vis(f), failText: f ? f.innerText.replace(/\\s+/g, " ").trim() : "",
    reloadButton: Boolean(f && [...f.querySelectorAll("button")].some(b => b.textContent.trim() === "RELOAD" && vis(b))),
    failBg: f ? getComputedStyle(f).backgroundColor : "", home: vis(home) && home.classList.contains("v10Home") && !(app && app.inert) && !vis(l), mark };
})()`;

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
    // drops = how many requests for that file fail; blockStorage = sessionStorage throws (Safari private mode, blocked site data).
    async function start(file,drops,{blockStorage=false}={}){
      const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:"block"});
      await context.route(u=>!/^http:\/\/127\.0\.0\.1:/.test(u.href),route=>route.abort());
      let dropped=0;
      if(file)await context.route(u=>u.pathname===`/js/${file}.js`,route=>{if(dropped<drops){dropped+=1;return route.abort("connectionreset");}return route.continue();});
      if(blockStorage)await context.addInitScript(()=>{Object.defineProperty(window,"sessionStorage",{configurable:true,get(){throw new DOMException("blocked","SecurityError");}});});
      const page=await context.newPage();let loads=0;const errors=[];
      page.on("framenavigated",f=>{if(f===page.mainFrame())loads+=1;});
      page.on("console",m=>{if(m.type()==="error")errors.push(m.text());});
      await page.goto(url,{waitUntil:"domcontentloaded"});
      const t0=Date.now();let s=null;
      // Every frame until it settles: the loading screen must never leave onto a Home that did not start.
      while(Date.now()-t0<20000){
        s=await page.evaluate(STATE).catch(()=>null);
        if(s&&!s.loading&&!s.fail&&!s.home){await page.waitForTimeout(300);const again=await page.evaluate(STATE).catch(()=>null);if(again&&!again.loading&&!again.fail&&!again.home)throw new Error(`${file} x${drops}: the loading screen left onto a Home that did not start ${JSON.stringify(again)}`);}
        if(s&&(s.fail||s.home))break;
        await page.waitForTimeout(150);
      }
      return {context,page,s,loads,dropped,errors};
    }

    {const r=await start(null,0);
      assert.ok(r.s.home&&!r.s.fail,`a good start reaches Home ${JSON.stringify(r.s)}`);assert.equal(r.loads,1,"a good start never reloads");assert.equal(r.s.mark,null,"a good start leaves no mark");
      await r.context.close();ok("good start: Home, no reload, no mark");}

    for(const file of BOOT){
      const r=await start(file,1);
      assert.equal(r.dropped,1);
      assert.ok(r.s&&r.s.home&&!r.s.fail,`B1-1 js/${file}.js lost once: one reload by itself into the game ${JSON.stringify(r.s)}`);
      assert.equal(r.loads,2,`B1-1 js/${file}.js lost once: exactly one reload (got ${r.loads} page loads)`);
      assert.equal(r.s.mark,null,`B1-4 js/${file}.js: the good start after the reload clears the mark`);
      await r.context.close();
    }
    ok("each of the seven start-up files lost once: one silent reload, then Home");

    for(const file of BOOT){
      const r=await start(file,2);
      assert.ok(r.s&&r.s.fail&&!r.s.loading&&!r.s.home,`B1-2 js/${file}.js lost twice: the error screen ${JSON.stringify(r.s)}`);
      assert.equal(r.loads,2,`B1-1 js/${file}.js lost twice: one reload only, never a loop (got ${r.loads})`);
      assert.match(r.s.failText,/THE GAME DID NOT START/);assert.match(r.s.failText,/Your career is safe/);
      assert.ok(r.s.reloadButton,"B1-2 RELOAD shows");
      assert.equal(r.s.failBg,"rgb(7, 8, 10)","B1-2 the error screen is opaque black marble (no dimming)");
      await r.page.waitForTimeout(1500);
      const still=await r.page.evaluate(STATE);assert.equal(r.loads,2,"no further reload while the error screen shows");assert.ok(still.fail);
      if(file==="storage"||file==="app"){await r.page.screenshot({path:path.join(process.env.CMS_BOOT_FAIL_SHOTS||require("node:os").tmpdir(),`boot-fail-${file}-390x844.png`)});}
      await Promise.all([r.page.waitForEvent("framenavigated"),r.page.getByRole("button",{name:"RELOAD"}).click()]);
      let after=null;const t0=Date.now();while(Date.now()-t0<20000){after=await r.page.evaluate(STATE).catch(()=>null);if(after&&(after.home||after.fail))break;await r.page.waitForTimeout(150);}
      assert.ok(after&&after.home&&!after.fail,`B1-2 js/${file}.js: RELOAD works once the file arrives ${JSON.stringify(after)}`);
      assert.equal(after.mark,null,"B1-4 the mark is cleared after the good start");
      await r.context.close();
    }
    ok("each of the seven start-up files lost twice: one reload, then the marble error screen; RELOAD brings the game back");

    {const r=await start("storage",1,{blockStorage:true});
      assert.ok(r.s.fail&&r.s.reloadButton,`B1-5 sessionStorage blocked: the error screen at once ${JSON.stringify(r.s)}`);assert.equal(r.loads,1,"B1-5 no reload without a mark");
      await r.context.close();ok("sessionStorage blocked: no reload at all, the error screen with RELOAD");}

    {const r=await start(null,0);
      await r.page.evaluate(()=>sessionStorage.setItem("cmsBootRetry","1"));
      await r.page.reload({waitUntil:"domcontentloaded"});await r.page.waitForTimeout(2500);
      assert.equal(await r.page.evaluate(()=>sessionStorage.getItem("cmsBootRetry")),null,"B1-4 a stale mark is cleared by the next good start");
      await r.context.close();ok("a stale mark is cleared by a good start");}

    console.log(`PASS r91 boot-fail contracts (${passed} checks)`);
  }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e&&e.stack||e);process.exit(1);});

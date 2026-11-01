"use strict";
// r87 upgrade proof: a phone that runs the live r86 build (1.9.10-r86, main) takes the 2.0.0 update the way a real phone does.
// The real r86 tree is served first, then the gameplay/r87 tree with the release PR's edits simulated (every "1.9.10-r86"
// becomes the 2.0.0 revision, APP_VERSION 2.0.0, PREVIOUS_RUNTIME_REVISION = 1.9.10-r86 and the rollback list = the shell
// paths r87 adds to r86's). Checks, in one browser profile:
//   U1  r86 installs and verifies its own shell (the phone before the release).
//   U2  the 2.0.0 worker downloads while the page is OFF Home (a game screen): it waits and never reloads the page there.
//   U3  back on Home it applies by itself; the page reloads straight into 2.0.0: no request of the reload asks for a
//       1.9.10-r86 asset, no r86 markup is painted after the reload (cache bust / no old-design flash).
//   U4  the 2.0.0 worker keeps the r86 shell whole as its rollback (PREVIOUS shell verified) and drops older caches.
//   U5  the phone's own data survives: every localStorage key and value, and the IndexedDB databases (device identity).
//   U6  rollback to 1.9.10 from Home runs the complete r86 shell; clearing it returns to 2.0.0.
// Needs the r86 tree: CMS_UPGRADE_FROM_ROOT=<dir> (for example `git worktree add ../r86 origin/main`). No Firebase: every
// request that is not this local server is refused, so no production host is ever contacted. Not a Gate lane.
// Run: CMS_UPGRADE_FROM_ROOT=../r86 node tests/browser/r87-upgrade-from-r86-audit.cjs
const assert=require("node:assert/strict");
const fs=require("node:fs");
const http=require("node:http");
const path=require("node:path");
const vm=require("node:vm");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const R87_ROOT=path.resolve(__dirname,"../..");
const R86_ROOT=process.env.CMS_UPGRADE_FROM_ROOT?path.resolve(process.env.CMS_UPGRADE_FROM_ROOT):"";
const FROM="1.9.10-r86",TO=process.env.CMS_UPGRADE_TO_REVISION||"2.0.0-r87",TO_APP=TO.split("-")[0];
const PORT=Number(process.env.CMS_UPGRADE_PORT||4631);
const BASE=`http://127.0.0.1:${PORT}/`;
const OUT=path.join(R87_ROOT,"test-results","r87-upgrade-from-r86");
const pass=message=>console.log(`PASS ${message}`);

if(!R86_ROOT||!fs.existsSync(path.join(R86_ROOT,"service-worker.js"))){console.log("SKIP r87 upgrade audit: set CMS_UPGRADE_FROM_ROOT to an r86 (main) tree");process.exit(0);}

function swFacts(source){
  const sandbox={self:{addEventListener(){},location:{href:BASE},registration:{scope:BASE}},URL,console,Response:function(){},caches:{},fetch(){},setTimeout,clearTimeout};
  vm.createContext(sandbox);
  vm.runInContext(`${source}\n;globalThis.__facts={revision:RUNTIME_REVISION,previous:PREVIOUS_RUNTIME_REVISION,shell:[...SHELL_PATHS],previousShell:[...PREVIOUS_SHELL_PATHS]};`,sandbox);
  return JSON.parse(JSON.stringify(sandbox.__facts));
}
const r86Worker=fs.readFileSync(path.join(R86_ROOT,"service-worker.js"),"utf8");
const r86Facts=swFacts(r86Worker);
assert.equal(r86Facts.revision,FROM,`CMS_UPGRADE_FROM_ROOT must hold the live r86 build (${FROM}), found ${r86Facts.revision}`);

// The release PR's edits, applied to what the server sends (the tree on disk is never changed).
const r87Source=fs.readFileSync(path.join(R87_ROOT,"service-worker.js"),"utf8");
const r87Shell=swFacts(r87Source).shell;
const addedSinceR86=r87Shell.filter(p=>!r86Facts.shell.includes(p));
const removedSinceR86=r86Facts.shell.filter(p=>!r87Shell.includes(p));
function releaseWorker(source){
  let out=source.split(FROM).join(TO);
  out=out.replace(/const PREVIOUS_RUNTIME_REVISION = "[^"]*";/,`const PREVIOUS_RUNTIME_REVISION = "${FROM}";`);
  out=out.replace(/const SHELL_PATHS_ADDED_SINCE_PREVIOUS = new Set\(\[[^\]]*\]\);/,`const SHELL_PATHS_ADDED_SINCE_PREVIOUS = new Set(${JSON.stringify(addedSinceR86)});`);
  return out;
}
// U7: a later release on top of 2.0.0 (revision BUMP, PREVIOUS = 2.0.0, nothing added), to check the next update too.
const BUMP=`${TO_APP}-r87-next`;let bumped=false;
function bumpText(rel,text){
  let out=text.split(TO).join(BUMP);
  if(rel==="service-worker.js"){out=out.replace(/const PREVIOUS_RUNTIME_REVISION = "[^"]*";/,`const PREVIOUS_RUNTIME_REVISION = "${TO}";`);out=out.replace(/const SHELL_PATHS_ADDED_SINCE_PREVIOUS = new Set\([^;]*\);/,"const SHELL_PATHS_ADDED_SINCE_PREVIOUS = new Set([]);");}
  return out;
}
function releaseText(rel,text){
  if(bumped)return bumpText(rel,releaseText0(rel,text));
  return releaseText0(rel,text);
}
function releaseText0(rel,text){
  if(rel==="service-worker.js")return releaseWorker(text);
  let out=text.split(FROM).join(TO);
  if(rel==="js/app.js")out=out.replace(/const APP_VERSION = "[^"]+";/,`const APP_VERSION = "${TO_APP}";`);
  return out;
}
const releaseFacts=swFacts(releaseWorker(r87Source));
assert.equal(releaseFacts.revision,TO);assert.equal(releaseFacts.previous,FROM);

const MIME={".css":"text/css; charset=utf-8",".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".mjs":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".webmanifest":"application/manifest+json; charset=utf-8",".png":"image/png",".webp":"image/webp",".jpg":"image/jpeg",".jpeg":"image/jpeg",".svg":"image/svg+xml",".woff2":"font/woff2",".wav":"audio/wav",".txt":"text/plain; charset=utf-8",".md":"text/markdown; charset=utf-8",".avif":"image/avif",".gif":"image/gif"};
const TEXT=new Set([".css",".html",".js",".mjs",".json",".webmanifest",".txt",".md",".svg"]);
let serving="r86";const served={r86:[],r87:[]};
const server=http.createServer((request,response)=>{
  const url=new URL(request.url,BASE);let rel=decodeURIComponent(url.pathname).replace(/^\/+/,"")||"index.html";
  const root=serving==="r86"?R86_ROOT:R87_ROOT,file=path.resolve(root,rel);
  if(file!==root&&!file.startsWith(root+path.sep)){response.writeHead(403);response.end();return;}
  let target=file;try{if(fs.statSync(target).isDirectory()){target=path.join(target,"index.html");rel=path.posix.join(rel,"index.html");}}catch(_e){}
  fs.readFile(target,(error,data)=>{
    if(error){response.writeHead(404,{"cache-control":"no-store"});response.end("Not found");return;}
    const ext=path.extname(target).toLowerCase();
    let body=data;if(serving==="r87"&&TEXT.has(ext))body=Buffer.from(releaseText(rel,data.toString("utf8")));
    served[serving].push(rel);
    response.writeHead(200,{"content-type":MIME[ext]||"application/octet-stream","cache-control":"no-store","x-content-type-options":"nosniff"});
    response.end(request.method==="HEAD"?undefined:body);
  });
});

async function workerMessage(page,type,which="active"){
  return page.evaluate(({type,which})=>new Promise(async(resolve,reject)=>{
    const reg=await navigator.serviceWorker.getRegistration("./"),worker=which==="waiting"?reg?.waiting:(reg?.active||navigator.serviceWorker.controller);
    if(!worker)return reject(new Error(`no ${which} worker`));
    const channel=new MessageChannel(),timer=setTimeout(()=>reject(new Error(`${type} timed out`)),15000);
    channel.port1.onmessage=event=>{clearTimeout(timer);resolve(event.data);};worker.postMessage({type},[channel.port2]);
  }),{type,which});
}
const pageFacts=page=>page.evaluate(()=>({app:typeof APP_VERSION==="string"?APP_VERSION:null,meta:document.querySelector('meta[name="app-asset-revision"]')?.content||null,screen:typeof window.getActiveScreenName==="function"?window.getActiveScreenName():null,controller:Boolean(navigator.serviceWorker.controller)}));
async function phoneData(page){
  return page.evaluate(async()=>{
    const local={};for(let i=0;i<localStorage.length;i+=1){const key=localStorage.key(i);local[key]=localStorage.getItem(key);}
    const dbs=typeof indexedDB.databases==="function"?(await indexedDB.databases()).map(d=>d.name).sort():[];
    return {local,dbs};
  });
}
// Page predicates that return a promise are polled here (page.waitForFunction does not wait for a returned promise).
async function poll(page,predicate,timeout,message){const until=Date.now()+timeout;while(Date.now()<until){if(await page.evaluate(predicate).catch(()=>false))return;await page.waitForTimeout(250);}throw new Error(message);}
// The phone's device identity (IndexedDB, js/sparkPrivatePairing.js): the id pairing and every shared write are bound to.
async function deviceId(page){
  return page.evaluate(async()=>{
    if(!window.CareerModeSparkPrivatePairing)await new Promise((resolve,reject)=>{const s=document.createElement("script");s.src="js/sparkPrivatePairing.js";s.onload=resolve;s.onerror=reject;document.head.append(s);});
    const identity=await window.CareerModeSparkPrivatePairing.getOrCreateDeviceIdentity({indexedDBImpl:indexedDB,cryptoImpl:crypto});
    return identity&&identity.deviceId||null;
  });
}
async function waitHome(page,timeout=60000){await page.waitForFunction(()=>typeof window.getActiveScreenName==="function"&&window.getActiveScreenName()==="mainMenu"&&!document.querySelector("#loadingScreen:not(.hidden)"),null,{timeout});}

async function run(){
  fs.mkdirSync(OUT,{recursive:true});
  await new Promise(resolve=>server.listen(PORT,"127.0.0.1",resolve));
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,args:runtime.args,headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  const refused=new Set();
  await context.route("**/*",route=>{const u=new URL(route.request().url());if(u.hostname==="127.0.0.1"&&Number(u.port)===PORT)return route.continue();refused.add(u.hostname);return route.abort();});
  const page=await context.newPage();
  const pageErrors=[];page.on("pageerror",e=>pageErrors.push(String(e.message||e)));
  try{
    // U1 -------------------------------------------------------------------------------------------------------------------
    await page.goto(BASE,{waitUntil:"domcontentloaded"});
    await waitHome(page);
    await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),null,{timeout:60000}).catch(async()=>{await page.reload({waitUntil:"domcontentloaded"});await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),null,{timeout:60000});});
    await poll(page,()=>navigator.serviceWorker.getRegistration("./").then(r=>Boolean(r&&r.active&&r.active.state==="activated"&&!r.installing&&!r.waiting)),120000,"the r86 worker never activated");
    let status=await workerMessage(page,"CMS_GET_CACHE_STATUS");
    assert.equal(status.revision,FROM);assert.equal(status.current.ok,true,`r86 shell not verified: ${JSON.stringify(status.current.missing||[]).slice(0,300)}`);
    let facts=await pageFacts(page);assert.equal(facts.meta,FROM);
    // A phone with history: a few canonical keys the way the game keeps them (opaque to the update).
    await page.evaluate(()=>{localStorage.setItem("careerModeShowdown.upgradeProbe.v1",JSON.stringify({seasons:[1,2,3],note:"kept"}));});
    const deviceBefore=await deviceId(page);assert.match(String(deviceBefore),/^device_[0-9a-f]{32}$/);
    const before=await phoneData(page);
    pass(`U1 r86 ${FROM} installed and verified (${r86Facts.shell.length} shell paths)`);

    // U2 -------------------------------------------------------------------------------------------------------------------
    serving="r87";
    // Off Home: a game screen (the update boundary must hold it).
    const offHome=await page.evaluate(async()=>{const tried=[];for(const name of ["standings","statistics","trophyRoom","legacy","settings","createShowdown"]){try{if(typeof window.navigateTo==="function"){await window.navigateTo(name,{allowCanonicalFallback:false});const now=window.getActiveScreenName();tried.push(`${name}->${now}`);if(now&&now!=="mainMenu")return now;}}catch(e){tried.push(`${name}:${e.message}`);}}return tried.join(" | ");});
    console.log(`off Home: ${offHome}`);
    assert.ok(offHome&&!["mainMenu","dashboard"].includes(offHome)&&!offHome.includes("->"),`could not leave Home for the boundary check: ${offHome}`);
    let reloadedOffHome=false;page.once("framenavigated",frame=>{if(frame===page.mainFrame())reloadedOffHome=true;});
    await page.evaluate(()=>navigator.serviceWorker.getRegistration("./").then(r=>r.update()));
    await poll(page,()=>navigator.serviceWorker.getRegistration("./").then(r=>Boolean(r&&r.waiting&&!r.installing&&r.waiting.state==="installed")),180000,"the 2.0.0 worker never finished installing");
    const waiting=await workerMessage(page,"CMS_GET_CACHE_STATUS","waiting");
    assert.equal(waiting.revision,TO);assert.equal(waiting.current.ok,true,`2.0.0 shell not verified: ${JSON.stringify(waiting.current.missing||[]).slice(0,300)}`);
    await page.waitForTimeout(20000);
    assert.equal(reloadedOffHome,false,`the update reloaded the page on ${offHome}`);
    facts=await pageFacts(page);assert.equal(facts.meta,FROM);assert.equal(facts.screen,offHome);
    pass(`U2 the 2.0.0 worker waited while the page was on ${offHome} (no reload in 20 s)`);

    // U3 -------------------------------------------------------------------------------------------------------------------
    const afterRequests=[];let navigations=0;
    const onRequest=req=>{if(navigations>0)afterRequests.push(req.url());};
    page.on("request",onRequest);
    page.on("framenavigated",frame=>{if(frame===page.mainFrame())navigations+=1;});
    // r86 painted, recorded per frame after the reload: any element only r86 renders would show here. The page's own revision
    // meta is read on every animation frame from the first script that runs after the reload.
    await context.addInitScript(()=>{const seen=[];window.__cmsRevisionsSeen=seen;const read=()=>{const m=document.querySelector('meta[name="app-asset-revision"]');if(m&&!seen.includes(m.content))seen.push(m.content);};read();document.addEventListener("readystatechange",read);const tick=()=>{read();if(seen.length<4&&performance.now()<15000)requestAnimationFrame(tick);};requestAnimationFrame(tick);});
    await page.evaluate(async()=>{if(typeof window.navigateTo==="function")await window.navigateTo("mainMenu");});
    await page.waitForFunction(()=>true);
    const deadline=Date.now()+90000;while(navigations===0&&Date.now()<deadline)await page.waitForTimeout(250);
    assert.ok(navigations>0,"the 2.0.0 update did not apply on Home within 90 s");
    await page.waitForLoadState("domcontentloaded");await waitHome(page);
    facts=await pageFacts(page);
    assert.equal(facts.meta,TO);assert.equal(facts.app,TO_APP);
    const stale=afterRequests.filter(u=>u.includes(`v=${FROM}`));
    assert.deepEqual(stale,[],"requests after the update still asked for 1.9.10-r86 assets");
    const seen=await page.evaluate(()=>window.__cmsRevisionsSeen||[]);
    assert.deepEqual(seen,[TO],`the page painted another revision after the update: ${seen.join(", ")}`);
    await page.screenshot({path:path.join(OUT,"after-update-home-1280x800.png")});
    pass(`U3 Home applied the update by itself and reloaded straight into ${TO} (${afterRequests.length} requests, none for ${FROM})`);

    // U4 -------------------------------------------------------------------------------------------------------------------
    status=await workerMessage(page,"CMS_GET_CACHE_STATUS");
    assert.equal(status.revision,TO);assert.equal(status.previousRevision,FROM);
    assert.equal(status.current.ok,true);assert.equal(status.previous.ok,true,`r86 rollback shell incomplete: ${JSON.stringify(status.previous.missing||[]).slice(0,300)}`);
    const keys=await page.evaluate(()=>caches.keys());
    assert.ok(keys.some(k=>k.endsWith(TO)),"no 2.0.0 shell cache");assert.ok(keys.some(k=>k.endsWith(FROM)),"the r86 shell cache was dropped");
    assert.ok(!keys.some(k=>/1\.9\.9-r85/.test(k)),`an r85 cache was kept: ${keys.join(", ")}`);
    assert.equal(removedSinceR86.length,0,`r87 dropped shell paths r86 has (${removedSinceR86.join(", ")}): the rollback list cannot be r87's list minus the added paths`);
    pass(`U4 rollback shell ${FROM} verified whole (${releaseFacts.previousShell.length} paths = r86's ${r86Facts.shell.length}); caches: ${keys.join(", ")}`);

    // U5 -------------------------------------------------------------------------------------------------------------------
    const after=await phoneData(page);
    for(const [key,value] of Object.entries(before.local))assert.equal(after.local[key],value,`localStorage ${key} changed across the update`);
    for(const name of before.dbs)assert.ok(after.dbs.includes(name),`IndexedDB ${name} lost across the update`);
    assert.equal(await deviceId(page),deviceBefore,"the device identity changed across the update (pairing would break)");
    pass(`U5 ${Object.keys(before.local).length} localStorage keys, ${before.dbs.length} IndexedDB databases and the device identity kept as they were`);

    // U6 -------------------------------------------------------------------------------------------------------------------
    const rolled=await workerMessage(page,"CMS_ROLLBACK_TO_PREVIOUS");
    assert.equal(rolled.type,"CMS_ROLLBACK_ACCEPTED",JSON.stringify(rolled));
    // offline: nothing is served, so the rollback must come whole from the r86 cache
    await context.setOffline(true);
    await page.reload({waitUntil:"domcontentloaded"});await waitHome(page);
    facts=await pageFacts(page);assert.equal(facts.meta,FROM,"rollback did not run the r86 shell");
    await context.setOffline(false);serving="r87";
    const cleared=await workerMessage(page,"CMS_CLEAR_ROLLBACK");assert.equal(cleared.ok,true);
    await page.reload({waitUntil:"domcontentloaded"});await waitHome(page);
    facts=await pageFacts(page);assert.equal(facts.meta,TO);
    pass(`U6 offline rollback ran the whole ${FROM} shell from cache; clearing it returned to ${TO}`);

    // U7 ------------------------------------------------------------------------------------------------------------------
    // The next release after 2.0.0, on a phone that opens the app and closes it again within a few seconds (before the
    // app's own update check may run), then opens it again: the second open must still end on the new build by itself.
    bumped=true;
    await page.close();
    const quick=await context.newPage();quick.on("pageerror",e=>pageErrors.push(String(e.message||e)));
    await quick.goto(BASE,{waitUntil:"domcontentloaded"});await quick.waitForTimeout(5000);await quick.close();
    const next=await context.newPage();next.on("pageerror",e=>pageErrors.push(String(e.message||e)));
    const opened=Date.now();
    await next.goto(BASE,{waitUntil:"domcontentloaded"});
    const until=Date.now()+180000;let nextMeta=null;
    while(Date.now()<until){nextMeta=await next.evaluate(()=>document.querySelector('meta[name="app-asset-revision"]')?.content||null).catch(()=>null);if(nextMeta===BUMP)break;await next.waitForTimeout(500);}
    assert.equal(nextMeta,BUMP,`the next update did not apply after a 5 s open and a second open (still ${nextMeta})`);
    await waitHome(next);
    pass(`U7 the next release (${BUMP}) applied by itself on the second open, ${Math.round((Date.now()-opened)/1000)} s after it, after a first open closed at 5 s`);

    assert.deepEqual(pageErrors,[],"uncaught page errors");
    console.log(`r87 upgrade audit passed: ${FROM} -> ${TO}; rollback list adds ${addedSinceR86.length} paths: ${addedSinceR86.join(" ")}; refused hosts: ${[...refused].sort().join(", ")||"none"}`);
  }finally{await context.close().catch(()=>{});await browser.close().catch(()=>{});server.close();}
}
run().catch(error=>{console.error(error?.stack||error);process.exitCode=1;});

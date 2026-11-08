"use strict";
// r90 W8 first-load audit (repeatable measurement, not a pass/fail product test unless CMS_FIRST_LOAD_BUDGET=1).
// Cold Home on the local static server, no service worker, no cache, at 1920x906 (windowed Chromebook) and 390x844 (phone).
// Firebase SDK files are served from node_modules/firebase (same version the site pins); every other off-site request is
// aborted, so no run ever reaches production Firebase. Reports, per size:
//   homeReadyMs   - page start to the Reus loading screen handing over (careerModeHomeHold 0 and #loadingScreen hidden)
//   atHome        - requests/bytes (raw and gzip -9 of the same file) fetched by the moment Home is handed over
//   settled       - the same once the network has been quiet for 3 s (everything Home pulls in behind itself)
//   longTasks     - main-thread tasks over 50 ms up to settle (count, total ms, longest)
// CMS_FIRST_LOAD_PROFILE=chromebook adds a slow Chromebook profile (CDP): 10 Mbps down, 40 ms latency, 4x CPU slowdown.
// Container numbers are relative: compare before/after on the same machine and profile.
// Usage: node tests/browser/r90-first-load-audit.cjs [--json out.json] [--list]
const fs=require("node:fs"),path=require("node:path"),zlib=require("node:zlib"),{spawn}=require("node:child_process");
const {chromium}=require("playwright");
const ROOT=path.resolve(__dirname,"../..");const PORT=Number(process.env.CMS_TEST_PORT||4199);
const SDK_DIR=path.join(ROOT,"node_modules/firebase");
const SIZES=(process.env.CMS_FIRST_LOAD_SIZES||"1920x906,390x844").split(",").map(s=>{const [w,h]=s.split("x").map(Number);return {label:s,width:w,height:h};});
const args=process.argv.slice(2);const jsonOut=args.includes("--json")?args[args.indexOf("--json")+1]:null;const list=args.includes("--list");
const gzCache=new Map();
function sizes(rel){
  if(gzCache.has(rel))return gzCache.get(rel);
  let out={raw:0,gzip:0};
  try{const buf=fs.readFileSync(path.join(ROOT,rel));const text=/\.(js|css|html|json|svg|webmanifest|md)$/.test(rel);
    out={raw:buf.length,gzip:text?zlib.gzipSync(buf,{level:9}).length:buf.length};}catch(_e){}
  gzCache.set(rel,out);return out;
}
const kind=rel=>/\.js$/.test(rel)?"js":/\.css$/.test(rel)?"css":/\.(webp|png|jpe?g|svg|avif|gif)$/.test(rel)?"image":/\.(woff2?|ttf|otf)$/.test(rel)?"font":/\.(mp3|ogg|m4a|wav)$/.test(rel)?"audio":/\.(glb|gltf|hdr|bin|ktx2)$/.test(rel)?"3d":"other";
function summarize(entries){
  const by={};let raw=0,gzip=0;
  for(const e of entries){const k=kind(e.rel);by[k]=by[k]||{n:0,raw:0,gzip:0};by[k].n++;by[k].raw+=e.raw;by[k].gzip+=e.gzip;raw+=e.raw;gzip+=e.gzip;}
  return {requests:entries.length,raw,gzip,by};
}
async function measure(browser,size){
  const context=await browser.newContext({viewport:{width:size.width,height:size.height},serviceWorkers:"block",deviceScaleFactor:1});
  const external=[];
  await context.route(/^https?:\/\//,route=>{
    const url=route.request().url();
    if(url.startsWith(`http://127.0.0.1:${PORT}/`))return route.continue();
    const sdk=url.match(/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/(firebase-[a-z-]+\.js)$/);
    if(sdk)return route.fulfill({path:path.join(SDK_DIR,sdk[1]),contentType:"text/javascript"});
    external.push(url.split("?")[0]);return route.abort();
  });
  await context.addInitScript(()=>{window.__cmsLong=[];try{new PerformanceObserver(l=>{for(const e of l.getEntries())window.__cmsLong.push([Math.round(e.startTime),Math.round(e.duration)]);}).observe({type:"longtask",buffered:true});}catch(_e){}});
  const page=await context.newPage();const errors=[];page.on("pageerror",e=>errors.push(e.message));
  if(process.env.CMS_FIRST_LOAD_PROFILE==="chromebook"){const cdp=await context.newCDPSession(page);await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions",{offline:false,latency:40,downloadThroughput:10e6/8,uploadThroughput:5e6/8});
    await cdp.send("Emulation.setCPUThrottlingRate",{rate:4});}
  const seen=[];let last=Date.now();
  page.on("requestfinished",req=>{const u=new URL(req.url());if(u.host!==`127.0.0.1:${PORT}`)return;const rel=decodeURIComponent(u.pathname.replace(/^\/+/,""))||"index.html";seen.push({rel,t:Date.now(),...sizes(rel)});last=Date.now();});
  page.on("request",()=>{last=Date.now();});
  const t0=Date.now();
  await page.goto(`http://127.0.0.1:${PORT}/`,{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>window.careerModeHomeHold===0&&document.getElementById("loadingScreen")?.hidden===true,null,{timeout:30000,polling:25});
  const homeReadyMs=await page.evaluate(()=>Math.round(performance.now()));
  const atHome=seen.slice();
  while(Date.now()-last<3000&&Date.now()-t0<45000)await page.waitForTimeout(250);
  const settledMs=last-t0;
  const longs=await page.evaluate(()=>window.__cmsLong||[]);
  const screen=await page.evaluate(()=>window.getActiveScreenName?.()||null);
  await context.close();
  const dedupe=arr=>[...new Map(arr.map(e=>[e.rel,e])).values()];
  return {size:size.label,homeReadyMs,settledMs,screen,atHome:summarize(dedupe(atHome)),settled:summarize(dedupe(seen)),
    longTasks:{count:longs.length,totalMs:longs.reduce((s,l)=>s+l[1],0),longestMs:longs.reduce((m,l)=>Math.max(m,l[1]),0)},
    externalAborted:[...new Set(external)],errors,files:list?dedupe(seen).map(e=>({rel:e.rel,raw:e.raw,gzip:e.gzip,atHome:atHome.some(a=>a.rel===e.rel)})):undefined};
}
(async()=>{
  const server=spawn(process.execPath,[path.join(ROOT,"tests/support/static-server.cjs")],{stdio:"ignore",env:{...process.env,CMS_TEST_PORT:String(PORT)}});
  await new Promise(r=>setTimeout(r,700));
  const browser=await chromium.launch(process.env.CMS_CHROMIUM_PATH?{executablePath:process.env.CMS_CHROMIUM_PATH}:{});
  const results=[];
  try{for(const size of SIZES){results.push(await measure(browser,size));}}
  finally{await browser.close();server.kill();}
  const kb=n=>`${(n/1024).toFixed(0)} KB`;
  for(const r of results){
    console.log(`${r.size}: Home ready ${r.homeReadyMs} ms (screen ${r.screen}); at Home ${r.atHome.requests} req ${kb(r.atHome.raw)} raw / ${kb(r.atHome.gzip)} gzip; settled ${r.settled.requests} req ${kb(r.settled.raw)} raw / ${kb(r.settled.gzip)} gzip at ${r.settledMs} ms; long tasks ${r.longTasks.count} (${r.longTasks.totalMs} ms, max ${r.longTasks.longestMs})`);
    for(const [k,v] of Object.entries(r.settled.by))console.log(`   ${k.padEnd(6)} ${String(v.n).padStart(3)} req ${kb(v.raw).padStart(8)} raw ${kb(v.gzip).padStart(8)} gzip`);
    if(r.errors.length)console.log("   page errors:",r.errors.slice(0,5));
  }
  if(jsonOut)fs.writeFileSync(jsonOut,JSON.stringify(results,null,1));
  if(process.env.CMS_FIRST_LOAD_BUDGET==="1"){
    const budget=JSON.parse(process.env.CMS_FIRST_LOAD_BUDGET_JSON||"{}");
    let fail=0;for(const r of results){const b=budget[r.size];if(!b)continue;
      if(r.settled.requests>b.requests){console.error(`${r.size}: ${r.settled.requests} requests > ${b.requests}`);fail=1;}
      if(r.settled.raw>b.raw){console.error(`${r.size}: ${r.settled.raw} bytes > ${b.raw}`);fail=1;}}
    process.exit(fail);
  }
})().catch(e=>{console.error(e);process.exit(1);});

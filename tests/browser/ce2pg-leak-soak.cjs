"use strict";
// CE2PG leak soak (W3-9, r87): one long browser session per manager through a 10-season emulator Showdown, measuring what
// stays alive per season: JS heap after a forced GC, DOM nodes (in the document and in the renderer, so detached trees show),
// iframes and canvases, live event listeners, intervals, pending timeouts and animation frames, observers, WebGL and audio
// contexts, and live Firestore onSnapshot listeners (each one bills reads on every update). Everything live is grouped by the
// game module line that created it (tests/browser/support/leak-probe-page.js).
//
// It does NOT change the journey: it runs tests/browser/ce2pg-journey.cjs unchanged (CE2PG_PLAN=single CE2PG_SEASONS=10 by
// default) and only wraps Playwright's browser so every context gets the probe, plus the meter's Firestore wrapper so
// unsubscribes are seen. Reloads are off by default (CE2PG_RELOAD_EVERY=0) so each tab lives for all 10 seasons, as on a phone.
//
// Samples: on both managers, each time the Transfer Challenge screen opens (once per season, the same screen every season)
// and each time Season Summary opens, after a forced garbage collection; one at the very end. Heap snapshots (Daniel, at the
// season-2 and season-10 transfer screen) are reduced to object counts per constructor and the growth between the two.
// Verdict: a series that grows with the season count (season 2 -> 10, the warm-up season 1 left out) is a finding.
//
// Run:  CE2PG_PORT_BASE=9810 CE2PG_APP_PORT=4911 node tests/browser/ce2pg-leak-soak.cjs
//   (needs firebase@12.17.0 in node_modules: npm i --no-save firebase@12.17.0). Emulator only (demo project), never production.
// Output: test-results/ce2pg-leak-soak.json (samples, per-site growth, findings) and test-results/ce2pg-leak-soak.txt (summary).
const fs=require("node:fs");
const path=require("node:path");
const {spawn,spawnSync}=require("node:child_process");
const ROOT=path.resolve(__dirname,"../..");
const OUT_DIR=path.join(ROOT,"test-results");
process.env.CE2PG_PLAN=process.env.CE2PG_PLAN||"single";
process.env.CE2PG_SEASONS=process.env.CE2PG_SEASONS||"10";
if(process.env.CE2PG_RELOAD_EVERY===undefined)process.env.CE2PG_RELOAD_EVERY="0";
process.env.CE2PG_PORT_BASE=process.env.CE2PG_PORT_BASE||"9810";
process.env.CE2PG_APP_PORT=process.env.CE2PG_APP_PORT||"4911";
const PORT_BASE=Number(process.env.CE2PG_PORT_BASE);
const PROJECT="demo-cms-browser-journey";// pinned by the emulator switch (tests/browser/support/emulator-runtime-switch.js)

if(!process.env.FIRESTORE_EMULATOR_HOST){
  fs.mkdirSync(OUT_DIR,{recursive:true});
  if(!fs.existsSync(path.join(ROOT,"firestore.spark.generated.rules"))){
    for(const script of ["build-production-firestore-rules.mjs","build-production-firestore-rules-with-persistent-pair.mjs"]){
      const built=spawnSync(process.execPath,[path.join(ROOT,"scripts",script)],{cwd:ROOT,stdio:"inherit"});
      if(built.status!==0)process.exit(built.status||1);
    }
  }
  const configPath=path.join(OUT_DIR,"ce2pg-leak-soak.emulators.json");
  fs.writeFileSync(configPath,JSON.stringify({emulators:{
    auth:{host:"127.0.0.1",port:PORT_BASE},firestore:{host:"127.0.0.1",port:PORT_BASE+1,websocketPort:PORT_BASE+4},
    hub:{host:"127.0.0.1",port:PORT_BASE+2},logging:{host:"127.0.0.1",port:PORT_BASE+3},ui:{enabled:false},singleProjectMode:true
  }}));
  const child=spawn("npx",["--yes","firebase-tools@15.28.1","emulators:exec","--config",configPath,"--only","auth,firestore","--project",PROJECT,`node ${path.relative(ROOT,__filename)}`],{cwd:ROOT,stdio:"inherit",env:{...process.env,CMS_CHROMIUM_MULTI_CONTEXT:"1"}});
  child.on("exit",code=>process.exit(code===null?1:code));
  return;
}

// ---- inside the emulators ----
const PROBE=path.join(__dirname,"support/leak-probe-page.js");
const REPORT=path.join(OUT_DIR,"ce2pg-leak-soak.json");
const SUMMARY=path.join(OUT_DIR,"ce2pg-leak-soak.txt");
const SNAP_SEASONS=(process.env.LEAK_SNAPSHOT_SEASONS||"2,10").split(",").map(Number).filter(Boolean);
const state={started:new Date().toISOString(),env:{plan:process.env.CE2PG_PLAN,seasons:process.env.CE2PG_SEASONS,reloadEvery:process.env.CE2PG_RELOAD_EVERY,portBase:PORT_BASE},pages:[],samples:[],heapSnapshots:{},errors:[]};

// 1) Firestore wrapper: same meter, plus unsubscribe tracking.
const meterModule=require("./support/firestore-meter.cjs");
const NEEDLE="  return R.onSnapshot(...out);\n}";
if(!meterModule.WRAPPER_SOURCE.includes(NEEDLE))throw new Error("firestore-meter wrapper changed: onSnapshot return not found");
const PATCHED=meterModule.WRAPPER_SOURCE.replace(NEEDLE,"  const __u=R.onSnapshot(...out);\n  const __d=typeof globalThis.__leakProbeSnap===\"function\"?globalThis.__leakProbeSnap(target,(stk().split(\" < \")[0]||\"?\")):null;\n  return ()=>{if(__d)__d();return __u();};\n}");
const originalInstall=meterModule.installFirestoreMeter;
meterModule.installFirestoreMeter=async function(context,opts){
  await originalInstall(context,opts);
  // Registered after the meter's route, so Playwright answers firebase-firestore.js with this one.
  await context.route(/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-firestore\.js$/,route=>route.fulfill({body:PATCHED,contentType:"text/javascript; charset=utf-8"}));
};

// 2) Playwright: every context gets the probe; every page is watched.
const playwright=require("playwright");
const origLaunch=playwright.chromium.launch.bind(playwright.chromium);
const watchers=[];
playwright.chromium.launch=async function(...args){
  const browser=await origLaunch(...args);
  const origNewContext=browser.newContext.bind(browser);
  browser.newContext=async function(...cargs){
    const context=await origNewContext(...cargs);
    await context.addInitScript({path:PROBE});
    const label=`ctx${watchers.length+1}`;
    context.on("page",page=>{watchers.push(watch(page,label,cargs[0]&&cargs[0].viewport));});
    return context;
  };
  const origClose=browser.close.bind(browser);
  browser.close=async function(...a){
    try{for(const w of watchers)if(!w.page.isClosed())await w.sample("end",{gc:true});}catch(e){state.errors.push(String(e.message||e));}
    for(const w of watchers)w.stop();
    finish();
    return origClose(...a);
  };
  return browser;
};

function watch(page,label,viewport){
  const w={page,label,viewport,user:null,cdp:null,stopped:false,count:{transferChallenge:0,seasonSummary:0},prev:"",busy:false};
  state.pages.push({label,viewport});
  w.stop=()=>{w.stopped=true;};
  w.sample=async(tag,{gc=false,season=null}={})=>{
    if(!w.cdp)w.cdp=await page.context().newCDPSession(page);
    const t0=Date.now();
    if(gc){await w.cdp.send("HeapProfiler.collectGarbage");await w.cdp.send("HeapProfiler.collectGarbage");}
    await w.cdp.send("Performance.enable").catch(()=>{});
    const metrics=Object.fromEntries((await w.cdp.send("Performance.getMetrics")).metrics.map(m=>[m.name,m.value]));
    const heap=await w.cdp.send("Runtime.getHeapUsage");
    const dom=await w.cdp.send("Memory.getDOMCounters").catch(()=>null);
    const probe=await page.evaluate(()=>window.__leakProbeRead?window.__leakProbeRead():null).catch(()=>null);
    if(!w.user)w.user=await page.evaluate(()=>{try{return new URL(location.href).searchParams.get("cmsAccount")||document.body.dataset.account||null;}catch(_){return null;}}).catch(()=>null);
    const s={t:new Date().toISOString(),page:label,url:page.url().replace(/^https?:\/\/[^/]+/,""),tag,season,gc,ms:Date.now()-t0,
      heapUsedMB:+(heap.usedSize/1048576).toFixed(2),heapTotalMB:+(heap.totalSize/1048576).toFixed(2),
      rendererNodes:metrics.Nodes,jsEventListeners:metrics.JSEventListeners,documents:metrics.Documents,frames:metrics.Frames,layoutObjects:metrics.LayoutObjects,
      domCounters:dom,probe};
    state.samples.push(s);
    console.log(`LEAK ${label} ${tag}${season?` S${season}`:""}: heap ${s.heapUsedMB} MB, nodes ${s.rendererNodes} (doc ${probe?.docNodes}), listeners ${s.jsEventListeners} (probe ${probe?.live.listeners}), intervals ${probe?.live.intervals}, timeouts ${probe?.live.timeouts}, raf ${probe?.live.raf}, observers ${probe?.live.observers}, onSnapshot ${probe?.live.snapshots}, webgl ${probe?.live.webglAlive}/${probe?.live.webglCreated}, iframes ${probe?.iframes}, docs ${s.documents}`);
    return s;
  };
  const tick=async()=>{
    if(w.stopped||page.isClosed())return;
    if(!w.busy){
      w.busy=true;
      try{
        const screens=await page.evaluate(()=>[...document.querySelectorAll(".screen:not(.hidden)")].map(s=>s.id).join(",")).catch(()=>"");
        for(const anchor of ["transferChallenge","seasonSummary"]){
          if(screens.split(",").includes(anchor)&&!w.prev.split(",").includes(anchor)){
            w.count[anchor]+=1;const season=w.count[anchor];
            await page.waitForTimeout(1500);// let the screen settle
            await w.sample(anchor,{gc:true,season});
            if(anchor==="transferChallenge"&&label==="ctx1"&&SNAP_SEASONS.includes(season))await heapSnapshot(w,`S${season}`);
          }
        }
        w.prev=screens;
      }catch(e){state.errors.push(`${label}: ${String(e.message||e).split("\n")[0]}`);}
      w.busy=false;
    }
    setTimeout(tick,2000);
  };
  setTimeout(tick,2000);
  return w;
}

// Heap snapshot reduced to counts per constructor name (detached DOM shows as "Detached <tag>").
async function heapSnapshot(w,tag){
  const t0=Date.now();
  const chunks=[];
  const onChunk=e=>chunks.push(e.chunk);
  w.cdp.on("HeapProfiler.addHeapSnapshotChunk",onChunk);
  await w.cdp.send("HeapProfiler.enable");
  await w.cdp.send("HeapProfiler.takeHeapSnapshot",{reportProgress:false,captureNumericValue:false});
  w.cdp.off("HeapProfiler.addHeapSnapshotChunk",onChunk);
  const snap=JSON.parse(chunks.join(""));
  const f=snap.snapshot.meta.node_fields,types=snap.snapshot.meta.node_types[0],N=f.length;
  const iType=f.indexOf("type"),iName=f.indexOf("name"),iSize=f.indexOf("self_size");
  const counts={};
  for(let i=0;i<snap.nodes.length;i+=N){
    const type=types[snap.nodes[i+iType]];
    if(type!=="object"&&type!=="native"&&type!=="closure")continue;
    let name=snap.strings[snap.nodes[i+iName]];
    if(type==="closure")name=`(closure) ${name||"anonymous"}`;
    if(name.length>80)name=name.slice(0,80);
    const c=counts[name]||(counts[name]={n:0,bytes:0});c.n+=1;c.bytes+=snap.nodes[i+iSize];
  }
  state.heapSnapshots[tag]={page:w.label,ms:Date.now()-t0,nodes:snap.snapshot.node_count,counts};
  console.log(`LEAK heap snapshot ${tag}: ${snap.snapshot.node_count} nodes, ${Date.now()-t0} ms`);
}

// ---- analysis ----
function finish(){
  try{
    const out={...state,finished:new Date().toISOString()};
    const findings=[],lines=[];
    for(const p of state.pages){
      const series=state.samples.filter(s=>s.page===p.label&&s.tag==="transferChallenge"&&s.probe);
      if(series.length<3){lines.push(`${p.label}: only ${series.length} transfer samples`);continue;}
      const first=series.find(s=>s.season===2)||series[0],last=series.at(-1),span=Math.max(1,last.season-first.season);
      const metric=(name,get,threshold,unit="")=>{
        const vals=series.map(get);const d=get(last)-get(first);const perSeason=d/span;
        const grows=d>=threshold;
        lines.push(`${p.label} ${name}: ${vals.map(v=>Math.round(v*10)/10).join(" ")}  (S${first.season}->S${last.season} ${d>0?"+":""}${Math.round(d*10)/10}${unit}, ${Math.round(perSeason*100)/100}/season)${grows?"  <-- GROWS":""}`);
        if(grows)findings.push({page:p.label,viewport:p.viewport,metric:name,from:get(first),to:get(last),perSeason:+perSeason.toFixed(2),series:vals});
      };
      metric("heapUsedMB",s=>s.heapUsedMB,4," MB");
      metric("rendererNodes",s=>s.rendererNodes,800);
      metric("docNodes",s=>s.probe.docNodes,400);
      metric("detachedNodesEstimate",s=>s.rendererNodes-s.probe.docNodes,800);
      metric("jsEventListeners",s=>s.jsEventListeners,40);
      metric("probeListeners",s=>s.probe.live.listeners,40);
      metric("intervals",s=>s.probe.live.intervals,2);
      metric("timeouts",s=>s.probe.live.timeouts,4);
      metric("raf",s=>s.probe.live.raf,2);
      metric("observers",s=>s.probe.live.observers,2);
      metric("onSnapshot",s=>s.probe.live.snapshots,2);
      metric("webglAlive",s=>s.probe.live.webglAlive,2);
      metric("iframes",s=>s.probe.iframes,2);
      metric("canvases",s=>s.probe.canvases,2);
      metric("documents",s=>s.documents,2);
      metric("localStorageKB",s=>s.probe.localStorageBytes/1024,20," KB");
      // Per creating site: what grew between the two samples.
      for(const kind of ["listeners","intervals","timeouts","raf","observers","snapshots"]){
        const a=first.probe.by[kind],b=last.probe.by[kind];
        const grew=Object.keys({...a,...b}).map(k=>({site:k,from:a[k]||0,to:b[k]||0})).filter(x=>x.to-x.from>=(kind==="listeners"?span:2)).sort((x,y)=>(y.to-y.from)-(x.to-x.from));
        for(const g of grew.slice(0,15)){lines.push(`${p.label}   ${kind} grew: ${g.site}  ${g.from} -> ${g.to}`);findings.push({page:p.label,metric:`${kind} by site`,site:g.site,from:g.from,to:g.to,perSeason:+((g.to-g.from)/span).toFixed(2)});}
      }
      lines.push(`${p.label} live at end of S${last.season}: intervals ${JSON.stringify(last.probe.by.intervals)} | onSnapshot ${JSON.stringify(last.probe.by.snapshots)} | observers ${JSON.stringify(last.probe.by.observers)} | webgl ${JSON.stringify(last.probe.by.webgl)}`);
    }
    const tags=Object.keys(state.heapSnapshots);
    if(tags.length>=2){
      const A=state.heapSnapshots[tags[0]].counts,B=state.heapSnapshots[tags.at(-1)].counts;
      const diff=Object.keys({...A,...B}).map(k=>({name:k,from:A[k]?.n||0,to:B[k]?.n||0,bytesDelta:(B[k]?.bytes||0)-(A[k]?.bytes||0)})).map(x=>({...x,d:x.to-x.from}));
      out.heapDiff={from:tags[0],to:tags.at(-1),top:diff.filter(x=>x.d>0).sort((x,y)=>y.d-x.d).slice(0,40),topBytes:diff.sort((x,y)=>y.bytesDelta-x.bytesDelta).slice(0,25),detached:diff.filter(x=>/^Detached /.test(x.name)&&x.to>0).sort((x,y)=>y.to-x.to).slice(0,25)};
      lines.push(`heap snapshot ${tags[0]} -> ${tags.at(-1)} (ctx1): top count growth ${out.heapDiff.top.slice(0,20).map(x=>`${x.name} +${x.d}`).join(", ")}`);
      lines.push(`detached at ${tags.at(-1)}: ${out.heapDiff.detached.map(x=>`${x.name} ${x.from}->${x.to}`).join(", ")||"none"}`);
      for(const h of Object.values(state.heapSnapshots))delete h.counts;
    }
    out.findings=findings;out.summary=lines;
    fs.writeFileSync(REPORT,JSON.stringify(out,null,1));
    fs.writeFileSync(SUMMARY,lines.join("\n")+`\n\nfindings: ${findings.length}\nerrors: ${state.errors.slice(0,20).join(" | ")}\n`);
    console.log(`LEAK SUMMARY\n${lines.join("\n")}\nLEAK findings: ${findings.length} -> ${path.relative(ROOT,REPORT)}`);
  }catch(e){console.error("leak analysis failed",e);}
}

// 3) Run the unchanged journey.
require("./ce2pg-journey.cjs");

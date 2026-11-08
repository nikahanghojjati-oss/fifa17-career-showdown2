#!/usr/bin/env node
"use strict";
// r90 W8: what a brand-new device does on its first open, service worker included (Nik's Chromebook crashed on first open).
// One fresh browser profile per run on a GitHub-Pages-like local server (gzip, ETag + 304, max-age=600) that shares one
// 10 Mbps link with 40 ms latency between the page AND the worker (CDP throttling only reaches the page), page CPU 4x slower.
// It records Home ready, worker active, offline pack complete, bytes on the wire, requests, the most requests open at once,
// and the browser's peak memory (summed RSS of its processes). Run it on two trees to compare:
//   node tests/browser/r90-first-open-sw-audit.cjs [--root <tree>] [--json out.json]
// Local only: it never touches production.
const fs=require("node:fs"),os=require("node:os"),path=require("node:path"),http=require("node:http"),http2=require("node:http2"),zlib=require("node:zlib"),{execFileSync}=require("node:child_process");
const {chromium}=require("playwright");
const args=process.argv.slice(2),arg=n=>args.includes(n)?args[args.indexOf(n)+1]:null;
const ROOT=path.resolve(arg("--root")||path.resolve(__dirname,"../.."));const PORT=Number(process.env.CMS_TEST_PORT||4231);
const SDK_DIR=path.join(path.resolve(__dirname,"../.."),"node_modules/firebase");
const RATE=Number(process.env.CMS_FIRST_OPEN_BPS||10e6/8),LATENCY=40,CAP_MS=Number(process.env.CMS_FIRST_OPEN_CAP_MS||150000),WINDOW_MS=Number(process.env.CMS_FIRST_OPEN_WINDOW_MS||30000);
const [W,H]=(process.env.CMS_FIRST_OPEN_SIZE||"1920x906").split("x").map(Number);
const TYPES={".html":"text/html",".js":"text/javascript",".css":"text/css",".json":"application/json",".svg":"image/svg+xml",".webmanifest":"application/manifest+json",".webp":"image/webp",".png":"image/png",".jpg":"image/jpeg",".woff2":"font/woff2",".wav":"audio/wav",".glb":"model/gltf-binary",".exr":"image/x-exr",".txt":"text/plain",".mp3":"audio/mpeg"};
const TEXT=/\.(html|js|css|json|svg|webmanifest|txt)$/;
const stats={protocols:{},requests:0,notModified:0,bytes:0,open:0,peakOpen:0,swRequests:0,timeline:[]};
let linkFreeAt=0;
const send=(res,buf)=>new Promise(resolve=>{let at=0;const step=()=>{if(at>=buf.length){res.end();return resolve();}
  const chunk=buf.subarray(at,at+16384);at+=chunk.length;stats.bytes+=chunk.length;
  const now=Date.now();linkFreeAt=Math.max(linkFreeAt,now)+chunk.length/RATE*1000;res.write(chunk);setTimeout(step,Math.max(0,linkFreeAt-now));};step();});
// HTTP/2 like GitHub Pages by default, on a throwaway self-signed certificate the browser is told to accept. Chrome keeps no
// HTTP cache for a certificate it had to be told to accept, so CMS_FIRST_OPEN_HTTP1=1 serves plain HTTP/1.1 instead, where the
// cache works and the install's 304s show.
const PLAIN=process.env.CMS_FIRST_OPEN_HTTP1==="1",SCHEME=PLAIN?"http":"https";
const certDir=fs.mkdtempSync(path.join(os.tmpdir(),"cms-first-open-cert-"));
if(!PLAIN)execFileSync("openssl",["req","-x509","-newkey","rsa:2048","-nodes","-subj","/CN=127.0.0.1","-days","1","-keyout",path.join(certDir,"k.pem"),"-out",path.join(certDir,"c.pem")],{stdio:"ignore"});
const handler=(req,res)=>{
  const url=new URL(req.url,`${SCHEME}://127.0.0.1:${PORT}`);let rel=decodeURIComponent(url.pathname).replace(/^\/+/,"")||"index.html";
  const file=path.resolve(ROOT,rel);if(!file.startsWith(ROOT)){res.writeHead(403);return res.end();}
  stats.protocols[req.httpVersion]=(stats.protocols[req.httpVersion]||0)+1;stats.requests++;stats.open++;stats.peakOpen=Math.max(stats.peakOpen,stats.open);if(url.searchParams.has("v")&&/service-worker/.test(req.headers["service-worker"]||""))stats.swRequests++;
  const done=()=>{stats.open--;};
  setTimeout(()=>fs.stat(file,(e,st)=>{
    if(e||!st.isFile()){res.writeHead(404,{"cache-control":"no-store"});res.end();return done();}
    const etag=`W/"${st.size}-${Math.round(st.mtimeMs)}"`;const sw=/service-worker\.js$/.test(rel);
    const headers={"content-type":TYPES[path.extname(rel).toLowerCase()]||"application/octet-stream","etag":etag,"cache-control":sw?"no-cache":"max-age=600"};
    if(req.headers["if-none-match"]===etag){stats.notModified++;res.writeHead(304,headers);res.end();return done();}
    let buf=fs.readFileSync(file);
    if(TEXT.test(rel)&&/gzip/.test(req.headers["accept-encoding"]||"")){buf=zlib.gzipSync(buf,{level:6});headers["content-encoding"]="gzip";}
    headers["content-length"]=buf.length;res.writeHead(200,headers);stats.timeline.push([Date.now(),rel]);
    if(req.method==="HEAD"){res.end();return done();}
    send(res,buf).then(done);
  }),LATENCY);
};
const server=PLAIN?http.createServer(handler):http2.createSecureServer({key:fs.readFileSync(path.join(certDir,"k.pem")),cert:fs.readFileSync(path.join(certDir,"c.pem")),allowHTTP1:true},handler);
// Peak memory: the browser process (its command line names the fresh profile) and every process under it.
function rssOf(dir){const kids=new Map(),rss=new Map();let rootPids=[];
  for(const pid of fs.readdirSync("/proc")){if(!/^\d+$/.test(pid))continue;try{const st=fs.readFileSync(`/proc/${pid}/status`,"utf8");
    const ppid=(/PPid:\s+(\d+)/.exec(st)||[])[1];const kb=Number((/VmRSS:\s+(\d+)/.exec(st)||[0,0])[1]);rss.set(pid,kb);
    if(!kids.has(ppid))kids.set(ppid,[]);kids.get(ppid).push(pid);if(fs.readFileSync(`/proc/${pid}/cmdline`,"utf8").includes(dir))rootPids.push(pid);}catch(_e){}}
  const seen=new Set(),walk=pid=>{if(seen.has(pid))return;seen.add(pid);for(const k of kids.get(pid)||[])walk(k);};rootPids.forEach(walk);
  let kb=0;for(const pid of seen)kb+=rss.get(pid)||0;return kb;}
(async()=>{
  await new Promise(r=>server.listen(PORT,"127.0.0.1",r));
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"cms-first-open-"));
  const context=await chromium.launchPersistentContext(dir,{executablePath:process.env.CMS_CHROMIUM_PATH||undefined,viewport:{width:W,height:H},deviceScaleFactor:1,ignoreHTTPSErrors:true,args:["--ignore-certificate-errors"]});
  // External requests go through CDP Fetch on the page, not context.route: Playwright routing turns the HTTP cache off, and
  // the cache is what lets the worker's "no-cache" install get 304s for files the page already has.
  const page=context.pages()[0]||await context.newPage();const errors=[];page.on("pageerror",e=>errors.push(e.message));
  const cdp=await context.newCDPSession(page);await cdp.send("Emulation.setCPUThrottlingRate",{rate:4});
  await cdp.send("Fetch.enable",{patterns:[{urlPattern:PLAIN?"https://*":"*"}]});
  cdp.on("Fetch.requestPaused",async({requestId,request})=>{const sdk=request.url.match(/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/(firebase-[a-z-]+\.js)$/);
    try{if(request.url.startsWith(`${SCHEME}://127.0.0.1:${PORT}/`))await cdp.send("Fetch.continueRequest",{requestId});else if(sdk)await cdp.send("Fetch.fulfillRequest",{requestId,responseCode:200,responseHeaders:[{name:"content-type",value:"text/javascript"},{name:"access-control-allow-origin",value:"*"}],body:fs.readFileSync(path.join(SDK_DIR,sdk[1])).toString("base64")});
    else await cdp.send("Fetch.failRequest",{requestId,errorReason:"BlockedByClient"});}catch(_e){}});
  await context.addInitScript(()=>{window.__cmsLong=[];try{new PerformanceObserver(l=>{for(const e of l.getEntries())window.__cmsLong.push(e.duration);}).observe({type:"longtask",buffered:true});}catch(_e){}});
  let peakKb=0,peakAt=0;const samples=[];const t0=Date.now();const sampler=setInterval(()=>{const kb=rssOf(dir);samples.push([Date.now()-t0,kb]);if(kb>peakKb){peakKb=kb;peakAt=Date.now()-t0;}},200);
  await page.goto(`${SCHEME}://127.0.0.1:${PORT}/`,{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>window.careerModeHomeHold===0&&document.getElementById("loadingScreen")?.hidden===true,null,{timeout:60000,polling:50});
  const homeReadyMs=Date.now()-t0;let activeMs=null,packMs=null,status=null;
  while(Date.now()-t0<CAP_MS){
    status=await page.evaluate(()=>new Promise(resolve=>{navigator.serviceWorker.getRegistration("./").then(r=>{const w=r&&r.active;if(!w)return resolve(null);
      const c=new MessageChannel(),t=setTimeout(()=>resolve(null),3000);c.port1.onmessage=e=>{clearTimeout(t);resolve(e.data);};w.postMessage({type:"CMS_GET_CACHE_STATUS"},[c.port2]);}).catch(()=>resolve(null));})).catch(()=>null);
    if(status&&status.current?.ok&&activeMs===null)activeMs=Date.now()-t0;
    if(status&&status.current?.ok&&(!status.pack||status.pack.ok)){packMs=Date.now()-t0;break;}
    await page.waitForTimeout(1000);
  }
  // Memory is compared over the same window both ways (at least WINDOW_MS from the first navigation).
  while(Date.now()-t0<WINDOW_MS)await page.waitForTimeout(500);
  clearInterval(sampler);
  const longs=await page.evaluate(()=>window.__cmsLong||[]);
  const cacheNames=status?.cacheNames||[];
  const result={root:ROOT,size:`${W}x${H}`,homeReadyMs,workerActiveMs:activeMs,allOfflineFilesMs:packMs,capped:packMs===null,
    wire:{protocols:stats.protocols,requests:stats.requests,notModified:stats.notModified,mb:+(stats.bytes/1e6).toFixed(2),peakOpenRequests:stats.peakOpen},
    memory:{peakMb:Math.round(peakKb/1024),peakAtMs:peakAt,peakFirst12sMb:Math.round(samples.filter(x=>x[0]<=12000).reduce((m,x)=>Math.max(m,x[1]),0)/1024),atSecondMb:Object.fromEntries([5,10,15,20,25].map(t=>[t,Math.round(((samples.find(x=>x[0]>=t*1000)||[0,0])[1])/1024)]))},pack:status?.pack||"none",longTasks:{count:longs.length,totalMs:Math.round(longs.reduce((a,b)=>a+b,0))},errors,cacheNames};
  console.log(JSON.stringify(result,null,1));if(arg("--json"))fs.writeFileSync(arg("--json"),JSON.stringify(result,null,1));
  await context.close();server.close();fs.rmSync(dir,{recursive:true,force:true});fs.rmSync(certDir,{recursive:true,force:true});
})().catch(error=>{console.error(error);process.exit(1);});

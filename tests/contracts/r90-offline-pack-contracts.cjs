#!/usr/bin/env node
"use strict";
// r90 W8: the service worker installs a small essential shell and keeps the later screens' files as an offline pack.
// These checks run the real service-worker.js in a sandbox with an in-memory Cache Storage and a fake network.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const SOURCE=read("service-worker.js");let n=0;const ok=(id,msg)=>{n++;console.log(`ok ${n} ${id} ${msg}`);};
const SCOPE="https://cms.test/app/";
function sandbox({deployed,fail=new Set(),delay=5}={}){
  const stores=new Map(),listeners={},log={fetched:[],open:0,peak:0};
  const cacheApi=name=>({async match(key){const r=stores.get(name)?.get(String(key?.url||key));return r?r.clone():undefined;},
    async put(key,res){if(!stores.has(name))stores.set(name,new Map());stores.get(name).set(String(key?.url||key),res.clone());},
    async delete(key){return !!stores.get(name)?.delete(String(key?.url||key));}});
  const caches={async open(name){if(!stores.has(name))stores.set(name,new Map());return cacheApi(name);},async keys(){return [...stores.keys()];},async delete(name){return stores.delete(name);}};
  const self={registration:{scope:SCOPE},clients:{claim:async()=>{}},skipWaiting:async()=>{},addEventListener:(type,fn)=>{listeners[type]=fn;}};
  async function fetchFake(input){const url=new URL(input.url||input);const rel=url.pathname.slice(new URL(SCOPE).pathname.length);
    if(rel==="service-worker.js")return new Response(`const RUNTIME_REVISION = "${deployed()}";`,{status:200});
    log.fetched.push(rel);log.open++;log.peak=Math.max(log.peak,log.open);await new Promise(r=>setTimeout(r,delay));log.open--;
    return fail.has(rel)?new Response("missing",{status:404}):new Response(`bytes of ${rel}`,{status:200});}
  const context=vm.createContext({self,caches,fetch:fetchFake,Request,Response,URL,Headers,AbortController,setTimeout,clearTimeout,console,Date,Promise,Set,Map,Array,Object,String,Number,Boolean,Error,JSON,Math});
  vm.runInContext(`${SOURCE}\n;globalThis.__sw={RUNTIME_REVISION,PREVIOUS_RUNTIME_REVISION,SHELL_PATHS,INSTALL_PATHS,OFFLINE_PACK_PATHS,PREVIOUS_SHELL_PATHS,CACHE_NAME,verifyCache,verifyOfflinePack,fillOfflinePack,populateCurrentCache,findRecoveryRuntime,versionedShellUrl,cacheNameForRevision,INSTALL_LANES,OFFLINE_PACK_LANES};`,context);
  return {sw:context.__sw,listeners,stores,log,caches};
}
const fetchEvent=url=>{const waits=[];let reply=null;return {event:{request:new Request(url),respondWith(p){reply=p;},waitUntil(p){waits.push(p);}},reply:()=>reply,settle:()=>Promise.all(waits)};};
(async()=>{
  const probe=sandbox({deployed:()=>"x"}).sw;const {SHELL_PATHS,INSTALL_PATHS,OFFLINE_PACK_PATHS,RUNTIME_REVISION,PREVIOUS_RUNTIME_REVISION}=probe;
  // P1 the lists
  for(const p of OFFLINE_PACK_PATHS)assert.ok(SHELL_PATHS.includes(p),`${p} is in the offline pack but not in SHELL_PATHS`);
  assert.equal(INSTALL_PATHS.length+OFFLINE_PACK_PATHS.size,SHELL_PATHS.length,"install + pack is exactly SHELL_PATHS");
  const html=read("index.html");const startup=[...html.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css|webp|webmanifest|svg))(?:\?[^"]*)?"/g)].map(m=>m[1].replace(/^\.\//,"")).filter(p=>SHELL_PATHS.includes(p));
  assert.ok(startup.length>=8,"index.html names its startup files");
  const essential=["index.html","manifest.webmanifest","css/offline.css","css/settings.css","js/offlineApp.js","js/settings.js","js/backup.js","js/importAnalysis.js","js/restore.js","js/restoreUI.js","js/storageTransaction.js","js/saveLibraryRuntime.js","js/ssjr.js","js/onlinePlayerIdentity.js","js/persistentNikDanielPair.js","js/connectPlayersScreenV10.js","js/homeScreensV10.js","js/v10Screens.js","js/legacy.js","css/legacy.css","js/careerScreenSeam.js","js/rivalryLegacyV10.js","css/r78-marble-surfaces.css","css/r78-marble-tile.webp","assets/LOADING_REUS_DESKTOP.webp","assets/LOADING_REUS_PHONE.webp",
    "visual-assets/v10_1/shared/fonts/barlow-condensed-latin-600-normal.woff2","visual-assets/v10_1/shared/fonts/barlow-condensed-latin-700-normal.woff2","visual-assets/v10_1/shared/fonts/barlow-latin-400-normal.woff2","visual-assets/v10_1/shared/fonts/barlow-latin-600-normal.woff2","visual-assets/v10_1/shared/fonts/kaushan-script-latin-400-normal.woff2"];
  for(const p of [...startup,...essential])assert.ok(INSTALL_PATHS.includes(p),`${p} is needed for Home, Settings, sign-in, backup/restore, History's recovery tools or the offline/error screens, so the install must hold it`);
  for(const p of ["data/commentaryLines.js","visual-assets/v10_1/roulette/vendor/three-r187.min.js","visual-assets/v10_1/special-player/index.html","js/chamberMenScene3d.js"])assert.ok(OFFLINE_PACK_PATHS.has(p),`${p} belongs to the offline pack`);
  ok("P1",`install ${INSTALL_PATHS.length} essential files + offline pack ${OFFLINE_PACK_PATHS.size} = SHELL_PATHS ${SHELL_PATHS.length}; Home's startup files and the offline/recovery files are all in the install`);
  // P2 install: only the essential shell, a few at a time, all-or-nothing
  {const s=sandbox({deployed:()=>RUNTIME_REVISION});await s.sw.populateCurrentCache();
    assert.deepEqual([...s.log.fetched].sort(),[...INSTALL_PATHS].sort(),"the install fetches exactly the essential shell");
    assert.ok(s.log.peak<=s.sw.INSTALL_LANES,`install keeps at most ${s.sw.INSTALL_LANES} requests open (saw ${s.log.peak})`);
    assert.equal((await s.sw.verifyCache(RUNTIME_REVISION)).ok,true,"activation check passes on the essential shell");
    assert.equal((await s.sw.verifyOfflinePack()).ok,false,"the pack is not part of the install");
    const bad=sandbox({deployed:()=>RUNTIME_REVISION,fail:new Set(["js/settings.js"])});await assert.rejects(bad.sw.populateCurrentCache(),/js\/settings\.js/);
    assert.equal((await bad.caches.keys()).includes(bad.sw.CACHE_NAME),false,"a failed install leaves no half cache");}
  ok("P2","the install fetches only the essential shell, four at a time, and a single failure fails it and removes the cache (as cache.addAll did)");
  // P3 rollback target: a retained revision needs its full list
  {const s=sandbox({deployed:()=>RUNTIME_REVISION});const prev=s.sw.cacheNameForRevision(PREVIOUS_RUNTIME_REVISION);const cache=await s.caches.open(prev);
    const prevPaths=s.sw.PREVIOUS_SHELL_PATHS;const prevInstall=prevPaths.filter(p=>!OFFLINE_PACK_PATHS.has(p));
    for(const p of prevInstall)await cache.put(s.sw.versionedShellUrl(p,PREVIOUS_RUNTIME_REVISION),new Response("x"));
    assert.equal((await s.sw.findRecoveryRuntime()).ok,false,"a retained revision without its later screens is not offered for rollback");
    for(const p of prevPaths)await cache.put(s.sw.versionedShellUrl(p,PREVIOUS_RUNTIME_REVISION),new Response("x"));
    const r=await s.sw.findRecoveryRuntime();assert.equal(r.ok,true);assert.equal(r.revision,PREVIOUS_RUNTIME_REVISION);}
  ok("P3","a retained previous revision is a rollback target only with its whole SHELL_PATHS list (the network cannot refill an older build)");
  // P4 first open of a pack file
  {let live=RUNTIME_REVISION;const s=sandbox({deployed:()=>live});await s.sw.populateCurrentCache();s.log.fetched.length=0;
    const file="data/commentaryLines.js";const one=fetchEvent(s.sw.versionedShellUrl(file));s.listeners.fetch(one.event);const res=await one.reply();await one.settle();
    assert.equal(res.status,200);assert.equal(await res.text(),`bytes of ${file}`);
    const kept=await (await s.caches.open(s.sw.CACHE_NAME)).match(s.sw.versionedShellUrl(file));assert.ok(kept,"a pack file opened first is kept for offline");
    const older=fetchEvent(s.sw.versionedShellUrl("js/chamberMen.js",PREVIOUS_RUNTIME_REVISION));s.listeners.fetch(older.event);assert.equal((await older.reply()).type,"error","another revision's file never comes from today's network");
    const notPack=fetchEvent(s.sw.versionedShellUrl("js/not-a-shell-file.js"));s.listeners.fetch(notPack.event);assert.equal((await notPack.reply()).type,"error","a versioned file outside the shell is still a hard miss");
    live="9.9.9-r999";const second="data/clubs.js";const raced=fetchEvent(s.sw.versionedShellUrl(second));s.listeners.fetch(raced.event);await raced.reply();await raced.settle();
    assert.equal(await (await s.caches.open(s.sw.CACHE_NAME)).match(s.sw.versionedShellUrl(second)),undefined,"a pack file is kept only after a fresh deployed check, never on a memoised answer from before a release");live=RUNTIME_REVISION;
    const s2=sandbox({deployed:()=>live});await s2.sw.populateCurrentCache();live="9.9.9-r999";
    const late=fetchEvent(s2.sw.versionedShellUrl(file));s2.listeners.fetch(late.event);assert.equal((await late.reply()).status,200);await late.settle();
    assert.equal(await (await s2.caches.open(s2.sw.CACHE_NAME)).match(s2.sw.versionedShellUrl(file)),undefined,"once another release is deployed, its bytes are never kept under this revision");}
  ok("P4","a pack file asked for before the pack is in is fetched and kept; never for another revision, never once a newer release is deployed");
  // P5 the idle pack fill
  {let live=RUNTIME_REVISION;const s=sandbox({deployed:()=>live});await s.sw.populateCurrentCache();s.log.fetched.length=0;s.log.peak=0;
    const status=await s.sw.fillOfflinePack();assert.equal(status.ok,true);assert.equal(status.missing.length,0);
    assert.deepEqual([...s.log.fetched].sort(),[...OFFLINE_PACK_PATHS].sort(),"the fill fetches each pack file once");
    assert.ok(s.log.peak<=s.sw.OFFLINE_PACK_LANES,`the fill keeps at most ${s.sw.OFFLINE_PACK_LANES} requests open`);
    s.log.fetched.length=0;await s.sw.fillOfflinePack();assert.equal(s.log.fetched.length,0,"a complete pack fetches nothing");
    const s2=sandbox({deployed:()=>"9.9.9-r999"});await s2.sw.populateCurrentCache().catch(()=>{});s2.log.fetched.length=0;const st=await s2.sw.fillOfflinePack();
    assert.equal(st.ok,false);assert.equal(s2.log.fetched.length,0,"no pack fill once a newer release is deployed");}
  {let live=RUNTIME_REVISION;const s=sandbox({deployed:()=>live,delay:2});await s.sw.populateCurrentCache();s.log.fetched.length=0;
    const run=s.sw.fillOfflinePack();await new Promise(r=>setTimeout(r,8));live="9.9.9-r999";const st=await run;
    assert.equal(st.ok,false,"a release deployed mid-fill leaves the pack incomplete");
    assert.equal(st.missing.length,st.expected,"files kept during a fill that ended under another release are dropped");}
  ok("P5","the idle fill fetches only missing pack files, two at a time, and stops when the deployed worker is another revision");
  // P6 the page asks once, after the worker is ready
  {const off=read("js/offlineApp.js");assert.match(off,/function markUpdateReady\(\)\{ dispatchOfflineState\(\); scheduleAutoApplyUpdate\(\); scheduleOfflinePack\(\); \}/);
    assert.match(off,/if\(offlinePackAsked\)return; offlinePackAsked=true;/);assert.match(off,/worker\.postMessage\(\{type:"CMS_FILL_OFFLINE_PACK"\},\[channel\.port2\]\)/);
    assert.match(SOURCE,/if\(type==="CMS_FILL_OFFLINE_PACK"\)\{ event\.waitUntil\(fillOfflinePack\(\)/);}
  ok("P6","the page asks for the offline pack once per page, at idle after the worker is ready; the worker keeps itself alive for it");
  console.log(`PASS r90 offline pack contracts: ${n} numbered checks (lists, install, rollback target, first open, idle fill, page ask).`);
})().catch(error=>{console.error(error);process.exit(1);});

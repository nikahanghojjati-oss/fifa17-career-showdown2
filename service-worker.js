const RUNTIME_REVISION = "1.7.0-r1";
const PREVIOUS_RUNTIME_REVISION = "1.6.0-r1";
const CACHE_PREFIX = "career-mode-showdown-shell-";
const MODE_CACHE_PREFIX = "career-mode-showdown-runtime-mode-";
const CACHE_NAME = `${CACHE_PREFIX}${RUNTIME_REVISION}`;
const PREVIOUS_CACHE_NAME = PREVIOUS_RUNTIME_REVISION ? `${CACHE_PREFIX}${PREVIOUS_RUNTIME_REVISION}` : "";
const MODE_CACHE_NAME = `${MODE_CACHE_PREFIX}${RUNTIME_REVISION}`;
const NETWORK_PROBE_TIMEOUT_MS = 1800;

const SHELL_PATHS = Object.freeze([
    "index.html",
    "manifest.webmanifest",
    "css/app.css",
    "css/visual-fidelity-r3.css",
    "css/offline.css",
    "css/analytics.css",
    "css/footballVisuals.css",
    "css/footballVisuals-v113.css",
    "css/legacy.css",
    "css/restore.css",
    "css/rulebook.css",
    "css/saveLibrary.css",
    "css/season.css",
    "css/settings.css",
    "css/transfer.css",
    "data/clubs.js",
    "data/footballVisuals.js",
    "data/leagues.js",
    "data/transferOptions.js",
    "js/analytics.js",
    "js/app.js",
    "js/backup.js",
    "js/clubAssignment.js",
    "js/dataEngine.js",
    "js/diagnostics.js",
    "js/footballVisuals.js",
    "js/importAnalysis.js",
    "js/leagueWheel.js",
    "js/legacy.js",
    "js/menuExperience.js",
    "js/menuFeedback.js",
    "js/offlineApp.js",
    "js/optionalModules.js",
    "js/productionFirebaseRuntime.js",
    "js/sparkAccountBootstrap.js",
    "js/sparkConnectedAccount.js",
    "js/sparkPrivatePairing.js",
    "js/sparkConnectedRivalry.js",
    "js/restore.js",
    "js/restoreUI.js",
    "js/ruleBook.js",
    "js/saveLibraryCutover.js",
    "js/saveLibraryFoundation.js",
    "js/saveLibraryPersistence.js",
    "js/saveLibraryRuntime.js",
    "js/saveLibraryUI.js",
    "js/scoring.js",
    "js/screens.js",
    "js/seasonEngine.js",
    "js/settings.js",
    "js/showdown.js",
    "js/showdownUI.js",
    "js/statistics.js",
    "js/storage.js",
    "js/storageTransaction.js",
    "js/transferChallenge.js",
    "js/transferSelector.js",
    "js/trophyRoom.js",
    "js/visualIdentity.js",
    "assets/marco-reus-2015-cc-by.webp",
    "assets/football/anthony-martial-cska-2017-v113.webp",
    "assets/football/antoine-griezmann-atletico-2016-v113.webp",
    "assets/football/cristiano-ronaldo-euro-2016-v113.webp",
    "assets/football/james-rodriguez-world-cup-2014-v113.webp",
    "assets/football/lionel-messi-barcelona-2016-subject-r4.webp",
    "assets/football/marcus-rashford-chelsea-2017-v113.webp",
    "assets/football/mario-balotelli-euro-2012-celebration-v113.webp",
    "assets/football/neymar-brazil-olympic-gold-2016-v113.webp",
    "assets/football/paul-pogba-man-utd-2016-v113.webp",
    "assets/football/philipp-lahm-world-cup-2014-focus-r4.webp",
    "assets/football/radamel-falcao-europa-league-2012-v113.webp",
    "assets/football/zlatan-ibrahimovic-man-utd-2016-v113.webp",
    "assets/icons/showdown-192.svg",
    "assets/icons/showdown-512.svg",
    "assets/icons/showdown-maskable-512.svg"
]);
const SHELL_PATH_SET = new Set(SHELL_PATHS);

function scopeUrl(path = ""){
    return new URL(path, self.registration.scope);
}
function versionedShellUrl(path, revision = RUNTIME_REVISION){
    const url = scopeUrl(path); url.searchParams.set("v", revision); return url.href;
}
function cacheNameForRevision(revision){ return revision ? `${CACHE_PREFIX}${revision}` : ""; }
function requestForShellPath(path){ return new Request(versionedShellUrl(path), { cache: "reload", credentials: "same-origin" }); }
function relativeScopePath(url){
    const scope = scopeUrl();
    if(url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)){ return ""; }
    return url.pathname.slice(scope.pathname.length).replace(/^\/+/, "") || "index.html";
}
async function cacheExists(cacheName){ if(!cacheName){ return false; } return (await caches.keys()).includes(cacheName); }
async function verifyCache(revision = RUNTIME_REVISION){
    const cacheName = cacheNameForRevision(revision);
    if(!revision || !(await cacheExists(cacheName))){ return { ok:false, available:false, cacheName, revision, expected:SHELL_PATHS.length, missing:SHELL_PATHS.slice() }; }
    const cache = await caches.open(cacheName); const missing=[];
    for(const path of SHELL_PATHS){ const response=await cache.match(versionedShellUrl(path,revision)); if(!response||!response.ok){ missing.push(path); } }
    return { ok:missing.length===0, available:true, cacheName, revision, expected:SHELL_PATHS.length, missing };
}
async function populateCurrentCache(){
    const cache=await caches.open(CACHE_NAME);
    try{ await cache.addAll(SHELL_PATHS.map(requestForShellPath)); const status=await verifyCache(RUNTIME_REVISION); if(!status.ok){ throw new Error(`Application shell cache is incomplete: ${status.missing.join(", ")}`); } return status; }
    catch(error){ await caches.delete(CACHE_NAME); throw error; }
}
async function readForcedRevision(){
    if(!(await cacheExists(MODE_CACHE_NAME))){ return ""; }
    const cache=await caches.open(MODE_CACHE_NAME); const response=await cache.match(scopeUrl("__cms_runtime_mode__").href); if(!response){ return ""; }
    try{return(await response.text()).trim();}catch(error){return"";}
}
async function writeForcedRevision(revision){ const cache=await caches.open(MODE_CACHE_NAME); await cache.put(scopeUrl("__cms_runtime_mode__").href,new Response(String(revision||""),{headers:{"content-type":"text/plain; charset=utf-8"}})); }
async function clearForcedRevision(){ await caches.delete(MODE_CACHE_NAME); }
async function chooseNavigationRuntime(){
    const forcedRevision=await readForcedRevision();
    if(forcedRevision){ const forcedStatus=await verifyCache(forcedRevision); if(forcedStatus.ok){return forcedStatus;} await clearForcedRevision(); }
    const currentStatus=await verifyCache(RUNTIME_REVISION); if(currentStatus.ok){return currentStatus;}
    if(PREVIOUS_RUNTIME_REVISION){ const previousStatus=await verifyCache(PREVIOUS_RUNTIME_REVISION); if(previousStatus.ok){return previousStatus;} }
    return null;
}
async function getStatusBundle(){ const current=await verifyCache(RUNTIME_REVISION); const previous=PREVIOUS_RUNTIME_REVISION?await verifyCache(PREVIOUS_RUNTIME_REVISION):{ok:false,available:false,cacheName:"",revision:"",expected:SHELL_PATHS.length,missing:SHELL_PATHS.slice()}; return{current,previous,forcedRevision:await readForcedRevision(),cacheNames:await caches.keys()}; }
async function probeNetwork(){
    const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),NETWORK_PROBE_TIMEOUT_MS); const url=scopeUrl("service-worker.js"); url.searchParams.set("network-probe",`${Date.now()}-${Math.random().toString(36).slice(2)}`);
    try{ const response=await fetch(new Request(url.href,{cache:"no-store",credentials:"same-origin",signal:controller.signal})); return{online:response.ok,status:response.status}; }
    catch(error){ return{online:false,status:0,error:error?.name||error?.message||String(error)}; }
    finally{ clearTimeout(timeout); }
}
function replyToClient(event,payload){ const port=event.ports&&event.ports[0]; if(port){port.postMessage(payload);} }
self.addEventListener("install",event=>{ event.waitUntil(populateCurrentCache()); });
self.addEventListener("message",event=>{
    const type=event.data&&event.data.type;
    if(type==="CMS_PROBE_NETWORK"){ event.waitUntil((async()=>{ const status=await probeNetwork(); replyToClient(event,{type:"CMS_NETWORK_STATUS",ok:true,...status}); })()); return; }
    if(type==="CMS_GET_CACHE_STATUS"){ event.waitUntil((async()=>{ try{ const status=await getStatusBundle(); replyToClient(event,{type:"CMS_CACHE_STATUS",ok:status.current.ok,revision:RUNTIME_REVISION,previousRevision:PREVIOUS_RUNTIME_REVISION,...status}); }catch(error){ replyToClient(event,{type:"CMS_CACHE_STATUS",ok:false,revision:RUNTIME_REVISION,error:error?.message||String(error)}); } })()); return; }
    if(type==="CMS_ACTIVATE_UPDATE"){ event.waitUntil((async()=>{ try{ const status=await verifyCache(RUNTIME_REVISION); if(!status.ok){ replyToClient(event,{type:"CMS_ACTIVATION_REJECTED",ok:false,revision:RUNTIME_REVISION,missing:status.missing}); return; } await self.skipWaiting(); replyToClient(event,{type:"CMS_ACTIVATION_ACCEPTED",ok:true,revision:RUNTIME_REVISION}); }catch(error){ replyToClient(event,{type:"CMS_ACTIVATION_REJECTED",ok:false,revision:RUNTIME_REVISION,error:error?.message||String(error)}); } })()); return; }
    if(type==="CMS_ROLLBACK_TO_PREVIOUS"){ event.waitUntil((async()=>{ try{ if(!PREVIOUS_RUNTIME_REVISION){throw new Error("No previous application shell is available for rollback.");} const previous=await verifyCache(PREVIOUS_RUNTIME_REVISION); if(!previous.ok){throw new Error(`Previous application shell is incomplete: ${previous.missing.join(", ")}`);} await writeForcedRevision(PREVIOUS_RUNTIME_REVISION); replyToClient(event,{type:"CMS_ROLLBACK_ACCEPTED",ok:true,revision:PREVIOUS_RUNTIME_REVISION}); }catch(error){ replyToClient(event,{type:"CMS_ROLLBACK_REJECTED",ok:false,error:error?.message||String(error)}); } })()); return; }
    if(type==="CMS_CLEAR_ROLLBACK"){ event.waitUntil((async()=>{ await clearForcedRevision(); replyToClient(event,{type:"CMS_ROLLBACK_CLEARED",ok:true,revision:RUNTIME_REVISION}); })()); }
});
self.addEventListener("activate",event=>{ event.waitUntil((async()=>{ const status=await verifyCache(RUNTIME_REVISION); if(!status.ok){throw new Error(`Refusing activation with incomplete application shell: ${status.missing.join(", ")}`);} await clearForcedRevision(); const keepShellCaches=new Set([CACHE_NAME,PREVIOUS_CACHE_NAME].filter(Boolean)); const cacheNames=await caches.keys(); await Promise.all(cacheNames.map(name=>{if(name.startsWith(CACHE_PREFIX)&&!keepShellCaches.has(name)){return caches.delete(name);}if(name.startsWith(MODE_CACHE_PREFIX)&&name!==MODE_CACHE_NAME){return caches.delete(name);}return Promise.resolve(false);})); await self.clients.claim(); })()); });
async function cachedShellResponse(path,revision){ const cacheName=cacheNameForRevision(revision); if(!cacheName||!(await cacheExists(cacheName))){return null;} const cache=await caches.open(cacheName); return cache.match(versionedShellUrl(path,revision)); }
self.addEventListener("fetch",event=>{
    const request=event.request; if(request.method!=="GET"){return;} const url=new URL(request.url); const scope=scopeUrl(); if(url.origin!==scope.origin){return;}
    if(request.mode==="navigate"){ event.respondWith((async()=>{ const selected=await chooseNavigationRuntime(); if(selected){const cached=await cachedShellResponse("index.html",selected.revision);if(cached){return cached;}} return fetch(request); })()); return; }
    const path=relativeScopePath(url); if(!path||!SHELL_PATH_SET.has(path)){return;} const requestedRevision=url.searchParams.get("v")||""; if(requestedRevision!==RUNTIME_REVISION&&requestedRevision!==PREVIOUS_RUNTIME_REVISION){return;}
    event.respondWith((async()=>{const cached=await cachedShellResponse(path,requestedRevision);return cached||Response.error();})());
});
self.__CMS_SERVICE_WORKER_DIAGNOSTICS__=Object.freeze({revision:RUNTIME_REVISION,previousRevision:PREVIOUS_RUNTIME_REVISION,cacheName:CACHE_NAME,previousCacheName:PREVIOUS_CACHE_NAME,modeCacheName:MODE_CACHE_NAME,shellPaths:SHELL_PATHS});
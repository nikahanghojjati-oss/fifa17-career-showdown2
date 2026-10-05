const RUNTIME_REVISION = "1.9.1-r60";
const PREVIOUS_RUNTIME_REVISION = "1.9.1-r59";
const CACHE_PREFIX = "career-mode-showdown-shell-";
const MODE_CACHE_PREFIX = "career-mode-showdown-runtime-mode-";
const CACHE_NAME = `${CACHE_PREFIX}${RUNTIME_REVISION}`;
const PREVIOUS_CACHE_NAME = PREVIOUS_RUNTIME_REVISION ? `${CACHE_PREFIX}${PREVIOUS_RUNTIME_REVISION}` : "";
const MODE_CACHE_NAME = `${MODE_CACHE_PREFIX}${RUNTIME_REVISION}`;
// JOB-24: Team V images are not precached on install (about 20 MB in all). They load on first view into
// this cache-first runtime cache, keyed by RUNTIME_REVISION. Activate keeps it and the retained recovery
// revision's image cache (for rollback) and clears the others.
const V10_IMAGE_CACHE_PREFIX = "career-mode-showdown-v10-images-";
const V10_IMAGE_CACHE_NAME = `${V10_IMAGE_CACHE_PREFIX}${RUNTIME_REVISION}`;
function v10ImageCacheName(revision){ return revision ? `${V10_IMAGE_CACHE_PREFIX}${revision}` : ""; }
const V10_IMAGE_PATH = /^visual-assets\/v10_1\/.+\.(?:webp|png|jpe?g|avif|gif|svg)$/i;
const NETWORK_PROBE_TIMEOUT_MS = 1800;
const RUNTIME_CONFIG_PATH = "firebase.runtime-config.json";
const APP_CHECK_BOOTSTRAP_PATH = "js/productionAppCheckBootstrap.js";
const NETWORK_ONLY_NAVIGATION_PATHS = new Set([
    "production-authorization-acceptance.html"
]);
const NETWORK_ONLY_ASSET_PATHS = new Set([
    "js/productionAuthorizationAcceptance.js",
    "js/productionProviderAbuseAcceptance.js"
]);

const SHELL_PATHS = Object.freeze([
    "index.html",
    "manifest.webmanifest",
    "css/app.css",
    "css/visual-fidelity-r3.css",
    "css/offline.css",
    "css/remoteJoining.css",
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
    "js/careerScreenSeam.js",
    "js/careerScreensV10.js",
  "visual-assets/v10_1/legacy/legacy.css",
  "visual-assets/v10_1/legacy/legacy.js",
  "visual-assets/v10_1/legacy/strings.json",
  "visual-assets/v10_1/legacy/assets/platemap.json",
  "visual-assets/v10_1/rivalry-statistics/rivalry-statistics.css",
  "visual-assets/v10_1/rivalry-statistics/rivalry-statistics.js",
  "visual-assets/v10_1/rivalry-statistics/strings.json",
  "visual-assets/v10_1/rivalry-statistics/assets/platemap.json",
  "js/rivalryLegacyV10.js",
  "js/rivalryLegacyV10Markup.js",
  "js/sharedCareerAnalytics.js",
  "js/sharedActiveShowdownAdapter.js",
  "js/sharedClosedShowdownAdapter.js",
  "js/sparkCompletedShowdownReader.js",
  "js/sparkClosedShowdownCareerLoader.js",
  "css/rivalryLegacyV10.css",
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
    "js/onlinePlayerIdentity.js",
    "js/persistentNikDanielPair.js",
    "js/productionFirebaseRuntime.js",
    "js/ssjr.js",
    "js/ssjrProductionAcceptanceRecorder.js",
    "js/ssjrProductionNegativeProbeRunner.js",
    "js/ssjrProductionNegativeEvidence.js",
    "js/stage5fProductionAuthenticatedNegatives.js",
    "js/ssjrAcceptancePolishedBridge.js",
    "js/ssjrPhysicalJourneyAcceptance.js",
    "js/productionSharedJourneyEntry.js",
    "js/productionSharedJourneyGuard.js",
    "js/productionSharedShowdownPresentation.js",
    "js/productionSharedShowdownSetup.js",
    "js/sharedShowdownSetup.js",
    "js/sharedShowdownCatalog.js",
    "js/sparkSharedShowdownSetup.js",
    "js/sharedCareerStart.js",
    "js/sparkSharedCareerStart.js",
    "js/productionSharedCareerStart.js",
    "js/sharedTransferChallenge.js",
    "js/sparkSharedTransferChallenge.js",
    "js/productionSharedTransferChallenge.js",
    "js/sharedSeasonResults.js",
    "js/sparkSharedSeasonResults.js",
    "js/productionSharedSeasonResults.js",
    "js/productionSharedSeasonResultsRoute.js",
    "js/sharedSeasonCommit.js",
    "js/sparkSharedSeasonCommit.js",
    "js/productionSharedSeasonCommit.js",
    "js/sharedCanonicalScoring.js",
    "js/sparkSharedCanonicalScoring.js",
    "js/productionSharedCanonicalScoring.js",
    "js/sharedHistoryConvergence.js",
    "js/sparkSharedHistoryConvergence.js",
    "js/productionSharedHistoryConvergence.js",
    "js/sharedMultiSeasonProgression.js",
    "js/sparkSharedMultiSeasonProgression.js",
    "js/productionSharedMultiSeasonProgression.js",
    "js/sharedJourneyReconnect.js",
    "js/productionSharedJourneyReconnect.js",
    "js/sharedJourneyConflicts.js",
    "js/productionSharedJourneyConflicts.js",
    "js/sharedLocalReconciliation.js",
    "js/productionSharedLocalReconciliation.js",
    "js/sharedFinalReconciliation.js",
    "js/productionSharedFinalReconciliation.js",
    "js/sharedTerminalClose.js",
    "js/sparkTerminalClose.js",
    "js/productionSharedTerminalClose.js",
    "js/remoteJoiningAcceptance.js",
    "js/sparkRemoteJoining.js",
    "js/sparkAccountBootstrap.js",
    "js/sparkConnectedAccount.js",
    "js/sparkPrivatePairing.js",
    "js/sparkConnectedRivalry.js",
    "js/sparkPrivateSession.js",
    "js/sparkStandardAuthPrivateSession.js",
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
    "assets/icons/showdown-maskable-512.svg",
    "visual-assets/v10_1/career-statistics/assets/platemap.json",
    "visual-assets/v10_1/career-statistics/career-statistics.css",
    "visual-assets/v10_1/career-statistics/career-statistics.js",
    "visual-assets/v10_1/shared/fonts/barlow-condensed-latin-600-normal.woff2",
    "visual-assets/v10_1/shared/fonts/barlow-condensed-latin-700-normal.woff2",
    "visual-assets/v10_1/shared/fonts/barlow-latin-400-normal.woff2",
    "visual-assets/v10_1/shared/fonts/barlow-latin-600-normal.woff2",
    "visual-assets/v10_1/shared/fonts/kaushan-script-latin-400-normal.woff2",
    "visual-assets/v10_1/shared/motion.css",
    "visual-assets/v10_1/shared/motion.js",
    "visual-assets/v10_1/shared/showdown-tokens.css",
    "visual-assets/v10_1/shared/showdown-type.css",
    "visual-assets/v10_1/shared/showdown-ui.css",
    "visual-assets/v10_1/shared/stage.css",
    "visual-assets/v10_1/shared/stage.js",
    "visual-assets/v10_1/trophy-room/assets/platemap.json",
    "visual-assets/v10_1/trophy-room/trophy-room.css",
    "visual-assets/v10_1/trophy-room/trophy-room.js",
    "visual-assets/v10_1/season-results/season-results.css",
    "visual-assets/v10_1/season-results/season-results.js",
    "visual-assets/v10_1/season-results/app-shell.html",
    "visual-assets/v10_1/final-winner/final-winner.css",
    "visual-assets/v10_1/final-winner/final-winner.js",
    "visual-assets/v10_1/final-winner/app-shell.html",
    "visual-assets/v10_1/standings/standings.css",
    "visual-assets/v10_1/standings/standings.js",
    "visual-assets/v10_1/standings/app-shell.html",
    "visual-assets/v10_1/final-winner/app-strings.json",
    "visual-assets/v10_1/standings/app-strings.json",
    "js/seasonFinalV10.js",
    "visual-assets/v10_1/season-results/app.css",
    "js/v10Screens.js",
    "js/homeScreensV10.js",
    "visual-assets/v10_1/home/home.css",
    "visual-assets/v10_1/home/soundtrack.js",
    "css/homeV10.css",
    "js/rulesSettingsV10.js",
    "css/rulesSettingsV10.css",
    "visual-assets/v10_1/rule-book/rule-book.css",
    "visual-assets/v10_1/settings/settings.css",
    "js/startJoinViewModel.js",
    "css/v10Shell.css",
    "visual-assets/v10_1/shared/navbar/navbar.css",
    "visual-assets/v10_1/shared/navbar/navbar.js",
    "js/v10Setup.js",
    "css/v10Setup.css",
    "js/transferScreenV10.js",
    "css/v10Transfer.css",
    "visual-assets/v10_1/tr2/slice-02-plate/plate.css",
    "visual-assets/v10_1/tr2/slice-02-plate/plate.js",
    "visual-assets/v10_1/tr2/slice-02-plate/platemap.json",
    "visual-assets/v10_1/tr2/slice-02-plate/assets/fonts/barlow-condensed-latin-600-normal.woff2",
    "visual-assets/v10_1/tr2/slice-02-plate/assets/fonts/barlow-condensed-latin-700-normal.woff2",
    "visual-assets/v10_1/tr2/slice-02-plate/assets/fonts/barlow-latin-400-normal.woff2",
    "visual-assets/v10_1/tr2/slice-02-plate/assets/fonts/barlow-latin-600-normal.woff2",
    "js/clubScreenV10.js",
    "css/v10Club.css",
    "visual-assets/v10_1/club/club.css",
    "visual-assets/v10_1/club/club.js",
    "visual-assets/v10_1/club/assets/platemap.json",
    "visual-assets/v10_1/club/assets/handmap.json",
    "visual-assets/v10_1/tr2/slice-02-plate/assets/fonts/kaushan-script-latin-400-normal.woff2"
]);
const SHELL_PATH_SET = new Set(SHELL_PATHS);

function scopeUrl(path = ""){
    return new URL(path, self.registration.scope);
}
function versionedShellUrl(path, revision = RUNTIME_REVISION){
    const url = scopeUrl(path); url.searchParams.set("v", revision); return url.href;
}
function networkOnlyRequest(request){ return new Request(request,{cache:"reload"}); }
function cacheNameForRevision(revision){ return revision ? `${CACHE_PREFIX}${revision}` : ""; }
function revisionFromCacheName(cacheName){ return cacheName&&cacheName.startsWith(CACHE_PREFIX)?cacheName.slice(CACHE_PREFIX.length):""; }
function compareRuntimeRevisions(a,b){
    const parse=value=>{const match=/^(\d+)\.(\d+)\.(\d+)-r(\d+)$/.exec(value||"");return match?match.slice(1).map(Number):null;};
    const left=parse(a),right=parse(b); if(!left&&!right)return 0;if(!left)return-1;if(!right)return 1;
    for(let index=0;index<left.length;index+=1){if(left[index]!==right[index])return left[index]-right[index];}return 0;
}
async function verifyRetainedRuntime(revision){
    if(!revision)return {ok:false,available:false,cacheName:"",revision:"",expected:0,missing:[]};
    if(revision===RUNTIME_REVISION||revision===PREVIOUS_RUNTIME_REVISION)return verifyCache(revision);
    const cacheName=cacheNameForRevision(revision); if(!(await cacheExists(cacheName)))return {ok:false,available:false,cacheName,revision,expected:0,missing:["index.html"]};
    const cache=await caches.open(cacheName); const index=await cache.match(versionedShellUrl("index.html",revision));
    return {ok:Boolean(index&&index.ok),available:true,cacheName,revision,expected:null,missing:index&&index.ok?[]:["index.html"]};
}
async function findRecoveryRuntime(){
    const names=(await caches.keys()).filter(name=>name.startsWith(CACHE_PREFIX)&&name!==CACHE_NAME);
    const revisions=names.map(revisionFromCacheName).filter(Boolean).sort((a,b)=>compareRuntimeRevisions(b,a));
    if(PREVIOUS_RUNTIME_REVISION){
        const preferred=await verifyRetainedRuntime(PREVIOUS_RUNTIME_REVISION); if(preferred.ok)return preferred;
    }
    for(const revision of revisions){
        if(revision===PREVIOUS_RUNTIME_REVISION)continue;
        const candidate=await verifyRetainedRuntime(revision); if(candidate.ok)return candidate;
    }
    return {ok:false,available:false,cacheName:"",revision:"",expected:0,missing:[]};
}
function requestForShellPath(path){ return new Request(versionedShellUrl(path), { cache: "reload", credentials:"same-origin" }); }
function relativeScopePath(url){
    const scope = scopeUrl();
    if(url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)){ return ""; }
    return url.pathname.slice(scope.pathname.length).replace(/^\/+/, "") || "index.html";
}
async function cacheExists(cacheName){ if(!cacheName){ return false; } return (await caches.keys()).includes(cacheName); }
async function verifyCache(revision = RUNTIME_REVISION){
    const cacheName = cacheNameForRevision(revision);
    if(!revision || !(await cacheExists(cacheName))){ return { ok:false, available:false, cacheName, revision, expected:SHELL_PATHS.length, missing:SHELL_PATHS.slice() }; }
    const cache=await caches.open(cacheName); const missing=[];
    for(const path of SHELL_PATHS){ const response=await cache.match(versionedShellUrl(path,revision)); if(!response||!response.ok){ missing.push(path); } }
    return { ok:missing.length===0, available:true, cacheName, revision,expected:SHELL_PATHS.length, missing };
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
    if(forcedRevision){ const forcedStatus=await verifyRetainedRuntime(forcedRevision); if(forcedStatus.ok){return forcedStatus;} await clearForcedRevision(); }
    const currentStatus=await verifyCache(RUNTIME_REVISION); if(currentStatus.ok){return currentStatus;}
    const recovery=await findRecoveryRuntime(); if(recovery.ok)return recovery;
    return null;
}
async function getStatusBundle(){ const current=await verifyCache(RUNTIME_REVISION); const previous=PREVIOUS_RUNTIME_REVISION?await verifyCache(PREVIOUS_RUNTIME_REVISION):{ok:false,available:false,cacheName:"",revision:"",expected:SHELL_PATHS.length,missing:SHELL_PATHS.slice()}; const recovery=await findRecoveryRuntime(); return{current,previous,recovery,forcedRevision:await readForcedRevision(),cacheNames:await caches.keys()}; }
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
    if(type==="CMS_ROLLBACK_TO_PREVIOUS"){ event.waitUntil((async()=>{ try{ const recovery=await findRecoveryRuntime(); if(!recovery.ok){throw new Error("No verified previous application shell is available for rollback.");} await writeForcedRevision(recovery.revision); replyToClient(event,{type:"CMS_ROLLBACK_ACCEPTED",ok:true,revision:recovery.revision}); }catch(error){ replyToClient(event,{type:"CMS_ROLLBACK_REJECTED",ok:false,error:error?.message||String(error)}); } })()); return; }
    if(type==="CMS_CLEAR_ROLLBACK"){ event.waitUntil((async()=>{ await clearForcedRevision(); replyToClient(event,{type:"CMS_ROLLBACK_CLEARED",ok:true,revision:RUNTIME_REVISION}); })()); }
});
self.addEventListener("activate",event=>{ event.waitUntil((async()=>{ const status=await verifyCache(RUNTIME_REVISION); if(!status.ok){throw new Error(`Refusing activation with incomplete application shell: ${status.missing.join(", ")}`);} await clearForcedRevision(); const recovery=await findRecoveryRuntime(); const keepShellCaches=new Set([CACHE_NAME,recovery.ok?recovery.cacheName:""] .filter(Boolean)); const keepImageCaches=new Set([V10_IMAGE_CACHE_NAME,recovery.ok?v10ImageCacheName(recovery.revision):""].filter(Boolean)); const cacheNames=await caches.keys(); await Promise.all(cacheNames.map(name=>{if(name.startsWith(CACHE_PREFIX)&&!keepShellCaches.has(name)){return caches.delete(name);}if(name.startsWith(MODE_CACHE_PREFIX)&&name!==MODE_CACHE_NAME){return caches.delete(name);}if(name.startsWith(V10_IMAGE_CACHE_PREFIX)&&!keepImageCaches.has(name)){return caches.delete(name);}return Promise.resolve(false);})); await self.clients.claim(); })()); });
async function cachedShellResponse(path,revision){ const cacheName=cacheNameForRevision(revision); if(!cacheName||!(await cacheExists(cacheName))){return null;} const cache=await caches.open(cacheName); return cache.match(versionedShellUrl(path,revision)); }
function isV10ImagePath(path){ return V10_IMAGE_PATH.test(path); }
// Images follow the shell the page runs: after a rollback they come from the retained revision's own image cache
// (or its shell cache, for revisions that precached them), so an offline rollback keeps the art it had viewed. A miss is
// fetched by path: each Team V image path names one generation (_V<n> name, bytes pinned by v10-foundation F9c).
async function v10ImageRevision(){ const forced=await readForcedRevision(); return forced&&forced!==RUNTIME_REVISION&&await cacheExists(cacheNameForRevision(forced))?forced:RUNTIME_REVISION; }
async function v10ImageResponse(event,request,path){
    const revision=await v10ImageRevision(); const cache=await caches.open(v10ImageCacheName(revision)); const key=scopeUrl(path).href;
    const cached=await cache.match(key); if(cached){ return cached; }
    if(revision!==RUNTIME_REVISION){ const retained=await cachedShellResponse(path,revision); if(retained){ return retained; } }
    const response=await fetch(request);
    if(response&&response.ok&&response.type==="basic"){ event.waitUntil(cache.put(key,response.clone()).catch(()=>{})); }
    return response;
}
self.addEventListener("fetch",event=>{
    const request=event.request; if(request.method!=="GET"){return;} const url=new URL(request.url); const scope=scopeUrl(); if(url.origin!==scope.origin){return;}
    if(request.mode==="navigate"){
        const path=relativeScopePath(url);
        if(NETWORK_ONLY_NAVIGATION_PATHS.has(path)){ event.respondWith(fetch(networkOnlyRequest(request))); return; }
        event.respondWith((async()=>{ const selected=await chooseNavigationRuntime(); if(selected){const cached=await cachedShellResponse("index.html",selected.revision);if(cached){return cached;}} return fetch(request); })()); return;
    }
    const path=relativeScopePath(url); if(!path){return;} if(isV10ImagePath(path)){ event.respondWith(v10ImageResponse(event,request,path)); return; } if(NETWORK_ONLY_ASSET_PATHS.has(path)){ event.respondWith(fetch(networkOnlyRequest(request))); return; } if(path===RUNTIME_CONFIG_PATH){return;} if(path===APP_CHECK_BOOTSTRAP_PATH){return;} const requestedRevision=url.searchParams.get("v")||""; if(!requestedRevision){return;}
    event.respondWith((async()=>{const cached=await cachedShellResponse(path,requestedRevision);return cached||Response.error();})());
});
self.__CMS_SERVICE_WORKER_DIAGNOSTICS__=Object.freeze({revision:RUNTIME_REVISION,previousRevision:PREVIOUS_RUNTIME_REVISION,cacheName:CACHE_NAME,previousCacheName:PREVIOUS_CACHE_NAME,modeCacheName:MODE_CACHE_NAME,shellPaths:SHELL_PATHS});
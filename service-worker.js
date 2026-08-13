const RUNTIME_REVISION = "1.1.5-r1";
const PREVIOUS_RUNTIME_REVISION = "1.1.4-r1";
const CACHE_PREFIX = "career-mode-showdown-shell-";
const CACHE_NAME = `${CACHE_PREFIX}${RUNTIME_REVISION}`;
const PREVIOUS_CACHE_NAME = `${CACHE_PREFIX}${PREVIOUS_RUNTIME_REVISION}`;

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
    "js/restore.js",
    "js/restoreUI.js",
    "js/ruleBook.js",
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
function scopeUrl(path = ""){return new URL(path, self.registration.scope);}
function versionedShellUrl(path){const url=scopeUrl(path);url.searchParams.set("v",RUNTIME_REVISION);return url.href;}
function requestForShellPath(path){return new Request(versionedShellUrl(path),{cache:"reload",credentials:"same-origin"});}
function relativeScopePath(url){const scope=scopeUrl();if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return "";return url.pathname.slice(scope.pathname.length).replace(/^\/+/,"")||"index.html";}
async function verifyCache(cacheName=CACHE_NAME){const cache=await caches.open(cacheName),missing=[];for(const path of SHELL_PATHS){const response=await cache.match(versionedShellUrl(path));if(!response||!response.ok)missing.push(path);}return{ok:missing.length===0,cacheName,revision:RUNTIME_REVISION,expected:SHELL_PATHS.length,missing};}
async function populateCurrentCache(){const cache=await caches.open(CACHE_NAME);try{await cache.addAll(SHELL_PATHS.map(requestForShellPath));const status=await verifyCache(CACHE_NAME);if(!status.ok)throw new Error(`Application shell cache is incomplete: ${status.missing.join(", ")}`);return status;}catch(error){await caches.delete(CACHE_NAME);throw error;}}
function replyToClient(event,payload){const port=event.ports&&event.ports[0];if(port)port.postMessage(payload);}
self.addEventListener("install",event=>{event.waitUntil(populateCurrentCache());});
self.addEventListener("message",event=>{const type=event.data&&event.data.type;if(type==="CMS_GET_CACHE_STATUS"){event.waitUntil((async()=>{try{const status=await verifyCache(CACHE_NAME),cacheNames=await caches.keys();replyToClient(event,{type:"CMS_CACHE_STATUS",...status,cacheNames,previousCacheName:PREVIOUS_CACHE_NAME});}catch(error){replyToClient(event,{type:"CMS_CACHE_STATUS",ok:false,revision:RUNTIME_REVISION,error:error?.message||String(error)});}})());return;}if(type==="CMS_ACTIVATE_UPDATE"){event.waitUntil((async()=>{try{const status=await verifyCache(CACHE_NAME);if(!status.ok){replyToClient(event,{type:"CMS_ACTIVATION_REJECTED",ok:false,revision:RUNTIME_REVISION,missing:status.missing});return;}replyToClient(event,{type:"CMS_ACTIVATION_ACCEPTED",ok:true,revision:RUNTIME_REVISION});await self.skipWaiting();}catch(error){replyToClient(event,{type:"CMS_ACTIVATION_REJECTED",ok:false,revision:RUNTIME_REVISION,error:error?.message||String(error)});}})());}});
self.addEventListener("activate",event=>{event.waitUntil((async()=>{const status=await verifyCache(CACHE_NAME);if(!status.ok)throw new Error(`Refusing activation with incomplete application shell: ${status.missing.join(", ")}`);const keep=new Set([CACHE_NAME,PREVIOUS_CACHE_NAME]),cacheNames=await caches.keys();await Promise.all(cacheNames.map(name=>name.startsWith(CACHE_PREFIX)&&!keep.has(name)?caches.delete(name):Promise.resolve(false)));await self.clients.claim();})());});
async function fetchCurrentShellResource(request,path){const cache=await caches.open(CACHE_NAME),cacheKey=versionedShellUrl(path),cached=await cache.match(cacheKey);if(cached)return cached;const network=await fetch(request);if(network&&network.ok)await cache.put(cacheKey,network.clone());return network;}
self.addEventListener("fetch",event=>{const request=event.request;if(request.method!=="GET")return;const url=new URL(request.url),scope=scopeUrl();if(url.origin!==scope.origin)return;if(request.mode==="navigate"){event.respondWith((async()=>{const cache=await caches.open(CACHE_NAME),cached=await cache.match(versionedShellUrl("index.html"));return cached||fetch(request);})());return;}const path=relativeScopePath(url);if(!path||!SHELL_PATH_SET.has(path)||url.searchParams.get("v")!==RUNTIME_REVISION)return;event.respondWith(fetchCurrentShellResource(request,path));});
self.__CMS_SERVICE_WORKER_DIAGNOSTICS__=Object.freeze({revision:RUNTIME_REVISION,previousRevision:PREVIOUS_RUNTIME_REVISION,cacheName:CACHE_NAME,previousCacheName:PREVIOUS_CACHE_NAME,shellPaths:SHELL_PATHS});

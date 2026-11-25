"use strict";
// Phoenix W8 (r100) listener census, asked by the r99 lead on #1588 after B1's listener fault (#1579) stalled Chamber Men.
// A Firestore listener whose stream is down never errors: the SDK only marks its copy fromCache and then stays quiet. Any
// listener that skips or ignores those copies can therefore wait for good, unless something else keeps reading.
// This census lists every listener in js/. Each one is either BRIDGED (while its copy is from cache it reads the document
// from the server at its step's pace, and stops when a server copy is back) or has a REASON it cannot stall (another path
// already reads), pinned to the code that makes the reason true and to the contract that proves it.
// A new listener anywhere in js/, or a new fromCache test, fails here until it is added with a bridge or a reason.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
let passed=0;const ok=label=>{passed+=1;console.log(`ok ${passed} ${label}`);};
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const files=(dir=>{const out=[];const walk=d=>{for(const entry of fs.readdirSync(path.join(ROOT,d),{withFileTypes:true})){const rel=`${d}/${entry.name}`;if(entry.isDirectory())walk(rel);else if(entry.name.endsWith(".js"))out.push(rel);}};walk(dir);return out.sort();})("js");
// Comments are stripped first so a line that only mentions a listener does not count.
const code=source=>source.replace(/\/\*[^]*?\*\//g,"").replace(/(^|[^:"'`\\])\/\/[^\n]*/g,"$1");
// A listener is attached by calling onSnapshot (dot or bracket); onSnapshotsInSync and the like are not document listeners.
const LISTEN=/\.onSnapshot\s*\(|\[\s*["'`]onSnapshot["'`]\s*\]\s*\(|\b(?:const|let|var)\s*\{[^}]*\bonSnapshot\b[^}]*\}\s*=/g;
const FROM_CACHE=/fromCache/g;

const PROOF={
  steps:["tests/contracts/r100-w8-step-listener-contracts.cjs",/W8-1|chamberMenStep\.js/],
  note:["tests/contracts/firestore-budget-contracts.cjs",/check\("FB11w8"/],
  wait:["tests/contracts/firestore-budget-contracts.cjs",/check\("FB6",/],
  waitScreens:["tests/contracts/waiting-reads-contracts.cjs",/cacheDeliver\(watched\);assert\.equal\(w\.budget\.stats\(\)\.watchHealthy,false\)/],
  context:["tests/contracts/r86-unlock-reads-contracts.cjs",/check\("U3"/]
};

const CENSUS={
  "js/chamberMenStep.js":{listeners:1,fromCache:1,sites:[{name:"Chamber Men round record (cmsWatch)",kind:"bridged",proof:"steps",
    pins:[/if\(snap\.metadata\?\.fromCache\)\{live=false;void bridge\(\);return;\}live=true;/,/const BRIDGE_FAST_MS=2500,BRIDGE_FAST_FOR_MS=Infinity,BRIDGE_SLOW_MS=2500,BRIDGE_FAILED_MS=5000;/,/if\(!stopped&&!live\)onData\(data\)/]}]},
  "js/iconGuessStep.js":{listeners:1,fromCache:1,sites:[{name:"Prime Pack round record (igsWatch)",kind:"bridged",proof:"steps",
    pins:[/if\(snap\.metadata\?\.fromCache\)\{live=false;void bridge\(\);return;\}live=true;/,/BRIDGE_FAST_MS=2500,BRIDGE_FAST_FOR_MS=60000,BRIDGE_SLOW_MS=8000,BRIDGE_FAILED_MS=30000/,/if\(revision<seenRevision\)return;seenRevision=revision;/]}]},
  "js/squadSheetStep.js":{listeners:1,fromCache:1,sites:[{name:"Squad Management rival lock (sqsWatch)",kind:"bridged",proof:"steps",
    pins:[/if\(snap\.metadata\?\.fromCache\)\{live=false;void bridge\(\);return;\}live=true;/,/const BRIDGE_FAST_FOR_MS=60000,BRIDGE_SLOW_MS=8000,BRIDGE_FAILED_MS=30000;/]}]},
  "js/persistentNikDanielPair.js":{listeners:1,fromCache:1,sites:[{name:"Nik's Home JOIN note (pairJoinNoteAttach)",kind:"bridged",proof:"note",
    pins:[/if\(snapshot\?\.metadata\?\.fromCache\)\{noteWatch\.live=false;pairJoinNoteBridge\(seq\);return;\}noteWatch\.live=true;/,
      /function pairJoinNoteListening\(accountId\)\{return noteWatch\.mode==="listen"&&noteWatch\.delivered===true&&noteWatch\.live!==false&&/,
      /function pairJoinNoteBridge\(seq\)\{[^\n]*pairReadJoinNote\(\{fresh:true\}\)[^\n]*schedule\(JOIN_NOTE_MEMO_MS\)/,
      /function pairJoinNoteBridge\(seq\)\{[^\n]*root\.navigator\?\.onLine===false/]}]},
  "js/productionSharedSeasonCommit.js":{listeners:1,fromCache:1,sites:[{name:"Season Commit authority listeners (psscWaitContext)",kind:"reason",proof:"context",
    reason:"They only hold back the timed checks while the budget layer's wait listener is healthy (psscWaitHealthy needs watchHealthy, and drops them after a 10 s grace); a read that waits on them gets the server after 5 s (fsbListens). A cached copy marks them not ready, so the timed checks run.",
    pins:[/snapshot\.metadata\?\.fromCache\|\|snapshot\.metadata\?\.hasPendingWrites\)\{held\.ready=false;pending\.add\(path\);return;\}/,
      /function psscWaitHealthy\(\)\{[^\n]*live\?\.watchHealthy&&waited\)/,/WAIT_PENDING_GRACE_MS=10000/]}]},
  "js/sparkPrivatePairing.js":{listeners:2,fromCache:4,sites:[
    {name:"budget context listeners (fsbCtxAttach: rivalry root and current Session)",kind:"reason",proof:"context",
      reason:"They only save reads: a copy is served only while healthy and confirmed in the last window (fsbCtxServe). A cached copy marks the watch unhealthy, so every module reads the server itself as it did before; a read that waits on a returning listener gets the server after 5 s.",
      pins:[/function fsbCtxDelivery\(watch,snapshot\)\{\n\s*if\(fsbCtxWatches\.get\(watch\.path\)!==watch\)return;\n\s*if\(!snapshot\|\|!snapshot\.metadata\|\|snapshot\.metadata\.fromCache\|\|snapshot\.metadata\.hasPendingWrites\)\{watch\.healthy=false;return;\}/,
        /if\(!watch\|\|!watch\.healthy\|\|watch\.dirty\|\|!watch\.snapshot\)return null;/,/root\.setTimeout\(\(\)=>fsbListened\(path,null\),5000\)/]},
    {name:"budget wait listener (fsbWatchWaitPoint: League Roulette/setup, Career Start, Transfer War, Season Results, Season Commit, scoring, presentation)",kind:"reason",proof:"wait",
      reason:"The screens skip their own 3 s and 15 s checks only while watchHealthy is true. A cached copy makes it false at once (fsbWaitLive), so the screens' timed checks read the server again.",
      pins:[/function fsbWaitDelivery\(wait,snapshot\)\{\n\s*if\(fsbWait!==wait\)return;\n\s*if\(!snapshot\|\|!snapshot\.metadata\|\|snapshot\.metadata\.fromCache\|\|snapshot\.metadata\.hasPendingWrites\)\{wait\.healthy=false;return;\}/,
        /if\(!wait\|\|!wait\.healthy\|\|wait\.dirty\)return false;/,/function fsbWaitHealthy\(\)\{return fsbWaitLive\(\)&&fsbNow\(\)-fsbWait\.confirmedAt<=/]}],
    // the read meter's own fromCache tests (a cached delivery bills nothing) are not listeners
    meterOnly:[/if\(meta&&meta\.fromCache===true\)return 0;/,/snapshot\.metadata\.fromCache===false\)served=true/]}
};
// Every screen that asks for the wait listener must hold back its timed checks only on watchHealthy (the reason above).
const WAIT_SCREENS={
  "js/productionSharedCareerStart.js":/function pcstWaitHealthy\(\)\{[^\n]*live\?\.watchHealthy&&live\.watching===path/,
  "js/productionSharedSeasonResults.js":/function pssrWaitHealthy\(\)\{[^\n]*live\?\.watchHealthy&&live\.watching===/,
  "js/productionSharedTransferChallenge.js":/function pstcWaitHealthy\(\)\{[^\n]*live\?\.watchHealthy&&live\.watching===/,
  "js/productionSharedSeasonCommit.js":/function psscWaitHealthy\(\)\{[^\n]*live\?\.watchHealthy&&waited\)/,
  // these two never hold back their checks on the listener: a delivery only wakes them sooner
  "js/productionSharedCanonicalScoring.js":"polls",
  "js/productionSharedShowdownPresentation.js":"polls"
};

// C1: the census matches js/ exactly.
const found={};
for(const file of files){const source=code(read(file));const listeners=(source.match(LISTEN)||[]).length,fromCache=(source.match(FROM_CACHE)||[]).length;if(listeners||fromCache)found[file]={listeners,fromCache};}
for(const [file,counts] of Object.entries(found)){
  const entry=CENSUS[file];
  assert.ok(entry,`${file} has ${counts.listeners} listener(s) and ${counts.fromCache} fromCache test(s) but is not in the listener census: bridge it at its step's pace or give the reason it cannot stall`);
  assert.equal(counts.listeners,entry.listeners,`${file}: ${counts.listeners} listener(s) found, the census lists ${entry.listeners}; add the new one with a bridge or a reason`);
  assert.equal(counts.fromCache,entry.fromCache,`${file}: ${counts.fromCache} fromCache test(s) found, the census lists ${entry.fromCache}`);
  assert.equal(entry.sites.length,entry.listeners,`${file}: one census line per listener`);
}
for(const file of Object.keys(CENSUS))assert.ok(found[file],`${file} is in the census but has no listener any more: take it out`);
// Every listener asks for metadata changes: without includeMetadataChanges the SDK never delivers the fromCache flip, so the
// bridges above would never start and a dead stream would stay silent.
for(const file of Object.keys(found)){const source=code(read(file));for(const match of source.matchAll(/\.onSnapshot\s*\(/g)){const call=source.slice(match.index,match.index+240);assert.match(call,/^\.onSnapshot\s*\([^,]+(?:\([^)]*\)[^,]*)?,\s*\{includeMetadataChanges:true\}/,`${file}: the listener at ${call.slice(0,80)} asks for includeMetadataChanges:true`);}}
ok(`census: ${Object.values(found).reduce((n,c)=>n+c.listeners,0)} listeners in ${Object.keys(found).length} files, every one listed`);

// C2: each line's bridge or reason is still true in the code, and its proof contract is there.
let bridged=0,reasoned=0;
for(const [file,entry] of Object.entries(CENSUS)){
  const source=read(file);
  for(const site of entry.sites){
    assert.ok(["bridged","reason"].includes(site.kind),`${file} ${site.name}: bridged or reason`);
    if(site.kind==="reason")assert.ok(typeof site.reason==="string"&&site.reason.length>40,`${file} ${site.name}: the reason is written down`);
    for(const pin of site.pins)assert.match(source,pin,`${file} ${site.name}: ${site.kind==="bridged"?"its bridge":"its reason"} still holds (${pin})`);
    const [proofFile,proofPin]=PROOF[site.proof];assert.match(read(proofFile),proofPin,`${file} ${site.name}: proved by ${proofFile}`);
    if(site.kind==="bridged")bridged+=1;else reasoned+=1;
  }
  for(const pin of entry.meterOnly||[])assert.match(source,pin,`${file}: the meter's fromCache test is where it was`);
}
ok(`${bridged} bridged, ${reasoned} with a reason, each pinned to its code and proof`);

// C3: a bridged step reads only while its copy is from cache, never while hidden or offline, and never applies a read that
// lands after a server copy is back.
for(const file of ["js/chamberMenStep.js","js/iconGuessStep.js","js/squadSheetStep.js"]){
  const source=read(file);
  assert.match(source,/while\(!stopped&&!live\)/,`${file}: the bridge runs only while not live`);
  assert.match(source,/(?:root\.document|doc0)\?\.visibilityState==="hidden"\|\|root\.navigator\?\.onLine===false/,`${file}: no bridge read hidden or offline`);
  assert.match(source,/return \(\)=>\{stopped=true;/,`${file}: unsubscribing ends the bridge`);
}
ok("the step bridges stop on a server copy or unsubscribe and read nothing hidden or offline");

// C4: every screen that uses the wait listener holds back its checks only on watchHealthy; no screen keeps a listener of its own.
for(const [file,pin] of Object.entries(WAIT_SCREENS)){if(pin==="polls")assert.doesNotMatch(read(file),/watchHealthy|budget\.stats\(\)\??\.watching/,`${file}: its checks never stop for the listener`);else assert.match(read(file),pin,`${file}: its timed checks stop only while the wait listener is healthy`);}
const askers=files.filter(file=>/watchWaitPoint\(/.test(code(read(file)))&&file!=="js/sparkPrivatePairing.js");
for(const file of askers)assert.ok(WAIT_SCREENS[file],`${file} asks for the wait listener but is not in the census's wait screens: say how its checks treat a listener that is not healthy`);
for(const file of Object.keys(WAIT_SCREENS))assert.ok(askers.includes(file),`${file} no longer asks for the wait listener: take it out`);
// Terminal Close asks for the context listeners only to be woken sooner: it never uses their answer to skip a read.
assert.match(read("js/productionSharedTerminalClose.js"),/try\{budget\.watchContext\(id\|\|null,ptcContextWake\);\}catch\(_error\)\{\}/,"Terminal Close ignores whether the context listeners are live");
ok(`${askers.length} screens use the budget wait listener; their timed checks resume as soon as it is not healthy`);

console.log(`PASS r100 listener census contracts: ${passed} checks.`);

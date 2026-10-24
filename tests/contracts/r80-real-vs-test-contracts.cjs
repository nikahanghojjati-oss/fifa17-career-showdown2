"use strict";
// Historic test-data exclusion and real-only creation/JOIN. Failed marker reads still hide every old game.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const fn=(src,name)=>{const i=src.indexOf(`async function ${name}(`);assert.ok(i>=0,`${name} exists`);const j=src.indexOf("\nasync function ",i+10);return src.slice(i,j<0?undefined:j);};
let passed=0;
function check(name,f){f();passed+=1;console.log(`ok ${passed} ${name}`);}

check("RVT1 Home CONTINUE CAREER: Daniel with nothing live asks the START question (never opens his leftover code directly)",()=>{
  const body=fn(read("js/onlinePlayerIdentity.js"),"openCanonicalCareerContinue");
  assert.match(body,/connectionState==="active"&&next\.rivalryId\)return pair\.continuePair\(\);/,"a live game still continues");
  assert.match(body,/if\(state\.managerId==="daniel"\)return openCanonicalStart\(\);\s*await openCanonicalShowdownJoin\(\);/,"Daniel goes through openCanonicalStart (whichShowdownIsLive + needsCareerStart), Nik keeps JOIN");
});
check("RVT2 a markerless account cannot create a non-real code",()=>{
  const src=read("js/persistentNikDanielPair.js"),start=src.slice(src.indexOf("async function pairStartPairing("),src.indexOf("async function pairKnownSaveIds("));
  const gate=start.indexOf('throw pairErrorWithCode("CAREER_START_REQUIRED"');assert.ok(gate>0);assert.ok(gate<start.indexOf("context.pairing.createPairing("));
  assert.match(start,/if\(role==="playerOne"&&!real&&!pairPartnerActiveFor\("playerOne"\)\)/);
});
check("RVT3 every other main-menu entry still goes through the START gate (r80 #936 kept)",()=>{
  const entry=read("js/productionSharedJourneyEntry.js");
  assert.match(entry,/if\(decision\.action==="resume-waiting"&&await needsCareerStart\(decision\)\)return openSeasonsForRealStart\(\);/,"Home START / locked-wheel CONTINUE");
  assert.match(entry,/if\(decision&&decision\.action==="resume-waiting"&&await needsCareerStart\(decision\)\)return false;/,"reload recovery");
});

// ---------------------------------------------------------------------------------------------------------------------
// G2/G3: the career pages (one career model for History, Legacy, Career Statistics, Trophy Room, Standings CAREER and
// Settings HISTORY; Rivalry Statistics) with the real marker module, loader, adapters and analytics; fake Firestore.
const vm=require("node:vm");
const F=require("../support/active-showdown-fixtures.cjs"),{result:R,projection:P}=F;
const Active=require(path.join(ROOT,"js/sharedActiveShowdownAdapter.js")),Seam=require(path.join(ROOT,"js/careerScreenSeam.js"));
const Career=require(path.join(ROOT,"js/sharedCareerAnalytics.js")),History=require(path.join(ROOT,"js/sharedHistoryConvergence.js"));
const Terminal=require(path.join(ROOT,"js/sharedTerminalClose.js")),Final=require(path.join(ROOT,"js/sharedFinalReconciliation.js"));
const clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
const UID="acct_daniel",MARKER=`accounts/${UID}/careerStart/current`;
const completedRead=p=>{const a=p.managerRecords.playerOne.totalPoints,b=p.managerRecords.playerTwo.totalPoints;return {status:"completed",code:null,rivalryId:p.rivalryId,managerRole:"playerOne",terminalWitness:F.closed(p).terminalWitness,projection:p,final:{totals:{playerOne:a,playerTwo:b},winner:a>b?"playerOne":b>a?"playerTwo":"draw",margin:Math.abs(a-b),seasonsPlayed:p.totalSeasons}};};
const markerDoc=ids=>({schemaVersion:1,objectType:"careerStart",objectId:"current",revision:0,parentRevision:null,lifecycleState:"live",contentHash:"sha256:"+"a".repeat(64),priorContentHash:null,updatedAt:{toMillis:()=>Date.UTC(2026,9,19,5)},updatedByAccountId:UID,updatedByDeviceId:"device_"+"d".repeat(32),data:{hiddenRivalryIds:ids,active:true,startedAt:{toMillis:()=>Date.UTC(2026,9,19,5)}},tombstone:null});
// T: a Settings test run (finished), R: the real game Home START made after the checkmark.
const T=P({seed:"7",totalSeasons:1,seasons:[[R({championsLeague:true}),R()]]}),G=P({seed:"8",totalSeasons:1,seasons:[[R(),R({leaguePosition:1,leaguePoints:101})]]});
const offline={identity:F.identity(),pair:F.pair(null,{status:"unpaired",rivalryId:null,connectionState:null}),multiSeason:null,history:null,terminalClose:null};
const justClosed=p=>({identity:F.identity(),pair:F.pair(p.rivalryId,{connectionState:"closed"}),multiSeason:F.multiFor(p),history:F.history(p),terminalClose:F.closed(p)});
function careerPage({docs={},indexIds=[],snapshot=offline,failMarkerReads=0}={}){
  const log=[],events=[],listeners=new Map(),frames=[],definitions=new Map(),loaderOptions=[];let failures=failMarkerReads;
  const reads=Object.fromEntries([T,G].map(p=>[p.rivalryId,completedRead(p)]));
  const sdk={doc:(_db,...parts)=>({path:parts.join("/")}),getDoc:async ref=>{log.push(ref.path);if(ref.path===MARKER&&failures>0){failures-=1;throw Object.assign(new Error("unavailable"),{code:"unavailable"});}const v=docs[ref.path];return {exists:()=>v!==undefined,data:()=>v};}};
  const files={"career-closed-loader":"js/sparkClosedShowdownCareerLoader.js","career-closed-adapter":"js/sharedClosedShowdownAdapter.js","career-start-marker":"js/careerStartMarker.js"};
  const c=vm.createContext({console,URLSearchParams,setTimeout,clearTimeout,TextEncoder,crypto:require("node:crypto").webcrypto,
    CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},
    addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},
    dispatchEvent(event){events.push(event.type);for(const fn of listeners.get(event.type)||[])fn(event);return true;},
    document:{getElementById:()=>null,querySelectorAll:()=>[]},
    CareerModeCareerScreenSeam:Seam,CareerModeSharedHistoryConvergence:History,CareerModeSharedCareerAnalytics:Career,CareerModeSharedTerminalClose:Terminal,CareerModeSharedFinalReconciliation:Final,CareerModeSharedActiveShowdownAdapter:Active,
    CareerModeOnlinePlayerIdentity:{getState:()=>snapshot.identity},CareerModeSparkConnectedAccount:{getState:()=>({connected:true,accountId:UID})},
    CareerModePersistentNikDanielPair:{getState:()=>snapshot.pair,readCareerIndex:async()=>{log.push("careerIndex");return {status:"ready",accountId:UID,rivalryIds:[...indexIds],sealedPageCount:0,code:null};}},
    CareerModeProductionSharedHistoryConvergence:{getState:()=>snapshot.history},CareerModeProductionSharedMultiSeasonProgression:{getState:()=>snapshot.multiSeason},CareerModeProductionSharedFinalReconciliation:{getState:()=>null},CareerModeProductionSharedTerminalClose:{getState:()=>snapshot.terminalClose},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:UID}},firestore:{},firestoreSdk:sdk})},
    CareerModeSparkCompletedShowdownReader:{readCompletedShowdown:async options=>{log.push("rivalries/"+options.rivalryId);return reads[options.rivalryId];}},
    CareerModeV10Screens:{install(){return this;},register:(id,def)=>definitions.set(id,def),invalidate(){},hide(){},isMounted:()=>false,async show(id){frames.push({id,model:definitions.get(id).frame()});return true;}},
    CareerModeRivalryLegacyMarkup:{legacy:"",rivalryStatistics:""},getClubCrestSvg:()=>"",reportApplicationError:()=>{}});
  c.window=c;
  c.loadRuntimeScript=async(key,file,ready)=>{if(ready())return true;if(files[key]){vm.runInContext(read(file),c);}return true;};
  vm.runInContext(read("js/rivalryLegacyV10.js"),c);
  return {c,log,events,docs,loaderOptions,setIndex(ids){indexIds=ids;},
    async model(){await c.loadRuntimeScript("career-closed-loader",files["career-closed-loader"],()=>Boolean(c.CareerModeSparkClosedShowdownCareerLoader));const loader=c.CareerModeSparkClosedShowdownCareerLoader;if(!loader.__wrapped){const original=loader.loadClosedShowdownCareer;c.CareerModeSparkClosedShowdownCareerLoader=Object.freeze({...loader,__wrapped:true,loadClosedShowdownCareer:o=>{loaderOptions.push(Object.keys(o).sort().join(","));return original(o);}});}return c.CareerModeRivalryLegacyV10.loadCareerModel();},
    async rivalry(){await this.model();frames.length=0;await c.CareerModeRivalryLegacyV10.mount("rivalryStatistics");return frames.filter(f=>f.id==="statistics").at(-1).model;}};
}
const rows=model=>(model?.history?.showdowns||[]).map(r=>[r.rivalryId,r.status]);
async function acheck(name,f){await f();passed+=1;console.log(`ok ${passed} ${name}`);}
(async()=>{
await acheck("RVT4 G2(a) a Settings test run never shows: without a marker History/Legacy, Career Statistics, Trophy Room, Standings CAREER and Rivalry Statistics show no Showdown, and nothing but the marker is read",async()=>{
  const page=careerPage({indexIds:[T.rivalryId]});
  const model=await page.model();
  assert.equal(model.status,"empty");assert.deepEqual(rows(model),[]);
  assert.deepEqual(page.log,[MARKER],"no index read, no Showdown read");assert.deepEqual(page.loaderOptions,["current,firebaseSdk,firestore,testRunsOnly,user"]);
  const live=careerPage({indexIds:[T.rivalryId],snapshot:justClosed(T)});
  assert.equal((await live.rivalry()).status,"empty","the test run that just finished is not shown from live state either");
  const Loader=require(path.join(ROOT,"js/sparkClosedShowdownCareerLoader.js"));Loader.clearClosedShowdownCache();
  const direct=await Loader.loadClosedShowdownCareer({firestore:{},firebaseSdk:{doc:()=>{throw new Error("no read");},getDoc:async()=>{throw new Error("no read");}},user:{uid:UID},testRunsOnly:true,current:Active.careerInput(justClosed(T))});
  assert.equal(direct.model.status,"empty","the loader alone: test runs only means an empty career and no read, the live test run included");
});
await acheck("RVT5 G2(b) a real game is never hidden: a fresh account's Home START (marker first) and then its game shows on the same page, on a page that read 'no marker' earlier, and on a new browser",async()=>{
  const page=careerPage({indexIds:[T.rivalryId]});
  assert.equal((await page.model()).status,"empty","before: only the test run, not shown");
  const Marker=page.c.CareerModeCareerStartMarker;
  const started=await Marker.startRealCareer({firestore:{},firebaseSdk:{doc:(_db,...parts)=>({path:parts.join("/")}),Timestamp:{fromMillis:ms=>({toMillis:()=>ms})},serverTimestamp:()=>({toMillis:()=>Date.now()}),
    runTransaction:async(_db,fn)=>{const writes=[];const out=await fn({get:async ref=>{const v=ref.path===`accounts/${UID}/careerIndex/current`?{schemaVersion:1,objectType:"careerIndex",objectId:"current",revision:1,lifecycleState:"live",contentHash:"sha256:"+"0".repeat(64),data:{rivalryIds:[T.rivalryId],sealedPageCount:0}}:page.docs[ref.path];return {exists:()=>v!==undefined,data:()=>v};},set:(ref,value)=>writes.push([ref.path,value])});for(const [p,v] of writes)page.docs[p]=v;return out;}},
    accountId:UID,deviceId:"device_"+"d".repeat(32),cryptoImpl:require("node:crypto").webcrypto});
  assert.deepEqual([...started.hiddenRivalryIds],[T.rivalryId],"the checkmark's marker names the test run");
  page.setIndex([T.rivalryId,G.rivalryId]);
  assert.deepEqual(rows(await page.model()),[[G.rivalryId,"completed"]],"after: the real game shows, the test run stays hidden");
  // Another browser of the same account: this page read "no marker" before the real career started elsewhere.
  const other=careerPage({indexIds:[T.rivalryId]});
  assert.equal((await other.model()).status,"empty");
  other.docs[MARKER]=markerDoc([T.rivalryId]);other.setIndex([T.rivalryId,G.rivalryId]);
  assert.deepEqual(rows(await other.model()),[[G.rivalryId,"completed"]],"'no marker' is asked again, so the real game shows here too");
  assert.ok(other.events.includes("career-mode-career-start-change"),"mounted career screens are told to reload");
  const markerReads=other.log.filter(p=>p===MARKER).length;await other.model();
  assert.equal(other.log.filter(p=>p===MARKER).length,markerReads,"once the marker is known it is not read again");
  const fresh=careerPage({indexIds:[T.rivalryId,G.rivalryId],docs:{[MARKER]:markerDoc([T.rivalryId])}});
  assert.deepEqual(rows(await fresh.model()),[[G.rivalryId,"completed"]],"a new browser: the same career");
  assert.equal((await careerPage({indexIds:[T.rivalryId,G.rivalryId],docs:{[MARKER]:markerDoc([T.rivalryId])},snapshot:justClosed(G)}).rivalry()).status,"ready","Rivalry Statistics shows the real game that just finished");
});
await acheck("RVT6 G3 fail-closed: while the marker cannot be read no career page shows a Showdown (no flash of test games); once a read answers the screens reload with the real career",async()=>{
  const page=careerPage({indexIds:[T.rivalryId,G.rivalryId],docs:{[MARKER]:markerDoc([T.rivalryId])},failMarkerReads:1});
  const unknown=await page.model();
  assert.equal(unknown.status,"unavailable","unknown marker: unavailable, never the test run");assert.deepEqual(page.loaderOptions,[],"nothing else is read");
  const shown=await page.model();
  assert.deepEqual(rows(shown),[[G.rivalryId,"completed"]]);
  assert.ok(page.events.includes("career-mode-career-start-change"),"the recovered read reloads mounted screens");
  const live=careerPage({indexIds:[T.rivalryId],docs:{[MARKER]:markerDoc([T.rivalryId])},snapshot:justClosed(T),failMarkerReads:2});
  assert.notEqual((await live.rivalry()).status,"ready","Rivalry Statistics never shows a just-finished Showdown it cannot check");
});
check("RVT7 a plain code without an active partner always refuses before redemption",()=>{
  const src=read("js/persistentNikDanielPair.js");assert.match(src,/if\(parsed\.real\)return;throw pairErrorWithCode\("REAL_PAIRING_CODE_REQUIRED"/);
  assert.doesNotMatch(src,/TEST_CODE_NOT_ARMED|isTestRunArmed/);
});
check("RVT8 Home waits only for a known career boundary; identity badges have no test label",()=>{
  const identity=read("js/onlinePlayerIdentity.js");assert.match(identity,/getView\?\.\(\)\?\.careerStarted!==false/);assert.doesNotMatch(identity,/TEST RUN|badgeSuffix|dataset\.testRun/);
});
check("RVT9 G6 the seasons START fallback listener runs the real-career gate too (a gate that cannot load refuses)",()=>{
  const entry=read("js/productionSharedJourneyEntry.js");
  assert.match(entry,/start\.addEventListener\("click",event=>\{event\.preventDefault\(\);event\.stopImmediatePropagation\(\);void startShared\(\{beforeCreate:seasonsStartGate\}\);\},true\);/);
  const gate=entry.slice(entry.indexOf("async function seasonsStartGate("),entry.indexOf("function installStartButton("));
  assert.match(gate,/return await modes\.beforeSeasonsStart\(\)===true;/);assert.match(gate,/report\([^\n]*\);\s*return false;\s*\}\s*$/);
  assert.doesNotMatch(entry,/void startShared\(\)/,"no START without the gate");
});
console.log(`PASS r80 real-vs-test contracts: ${passed} checks`);
})().catch(error=>{console.error(error);process.exitCode=1;});

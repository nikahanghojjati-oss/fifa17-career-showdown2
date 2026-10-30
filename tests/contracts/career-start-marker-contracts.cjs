"use strict";
// Career start marker ("real career starts here"): loader option and the career screens' caller. Plain node:assert,
// no Firebase, no emulator. The Rules and the provider writes are proved in tests/firebase/career-start-marker-emulator.cjs.
// L: js/sparkClosedShowdownCareerLoader.js skips hiddenRivalryIds (no read, not in the model); absent or empty is today's
//    behaviour exactly. C: js/rivalryLegacyV10.js reads the marker once per account (js/careerStartMarker.js) and passes
//    the ids whenever the marker exists (r79 PR4: test games stay hidden, whatever the old active switch says), for
//    History, Career Statistics, Trophy Room, Legacy and Rivalry Statistics.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");
const Adapter=require(path.join(root,"js/sharedClosedShowdownAdapter.js"));
const Career=require(path.join(root,"js/sharedCareerAnalytics.js"));
const Active=require(path.join(root,"js/sharedActiveShowdownAdapter.js"));
const History=require(path.join(root,"js/sharedHistoryConvergence.js"));
const Terminal=require(path.join(root,"js/sharedTerminalClose.js"));
const Final=require(path.join(root,"js/sharedFinalReconciliation.js"));
const Seam=require(path.join(root,"js/careerScreenSeam.js"));
const F=require("../support/active-showdown-fixtures.cjs");
const {result:R,projection:P}=F;
const clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
// Values built inside a vm context have that realm's prototypes: compare their JSON shape.
const same=(a,b,message)=>assert.deepEqual(clone(a),clone(b),message);
function deepFreeze(x){if(x&&typeof x==="object"&&!Object.isFrozen(x)){Object.values(x).forEach(deepFreeze);Object.freeze(x);}return x;}
function completedRead(p){
  const witness=F.closed(p).terminalWitness,a=p.managerRecords.playerOne.totalPoints,b=p.managerRecords.playerTwo.totalPoints;
  return deepFreeze({status:"completed",code:null,rivalryId:p.rivalryId,managerRole:"playerOne",terminalWitness:witness,projection:p,final:{totals:{playerOne:a,playerTwo:b},winner:a>b?"playerOne":b>a?"playerTwo":"draw",margin:Math.abs(a-b),seasonsPlayed:p.totalSeasons}});
}
const index=ids=>deepFreeze({status:"ready",accountId:"acct_daniel",rivalryIds:ids,sealedPageCount:0,code:null});
const noCurrent=()=>Active.careerInput({identity:F.identity(),pair:F.pair(null,{status:"unpaired",rivalryId:null,connectionState:null}),multiSeason:null,history:null,finalReconciliation:null,terminalClose:null,seasonResults:null});
// Three finished one-season Showdowns, oldest first. Daniel wins the first two (test games), Nik the third (the real one).
const p1=P({seed:"1",totalSeasons:1,seasons:[[R({championsLeague:true}),R()]]});
const p2=P({seed:"2",totalSeasons:1,seasons:[[R({leaguePosition:1,domesticCup:true}),R()]]});
const p3=P({seed:"3",totalSeasons:1,seasons:[[R(),R({leaguePosition:1,leaguePoints:101})]]});
const ALL=[p1,p2,p3].map(p=>p.rivalryId);
const reads=Object.fromEntries([p1,p2,p3].map(p=>[p.rivalryId,completedRead(p)]));

let cases=0;
async function check(name,fn){try{await fn();cases+=1;console.log(`ok ${cases} ${name}`);}catch(error){error.message=name+": "+error.message;throw error;}}

function loaderWith(){
  const calls={index:0,reader:[]};
  const context=vm.createContext({
    CareerModeSharedHistoryConvergence:History,CareerModeSharedTerminalClose:Terminal,CareerModeSharedCareerAnalytics:Career,
    CareerModePersistentNikDanielPair:{readCareerIndex:async()=>{calls.index+=1;return index(ALL);}},
    CareerModeSparkCompletedShowdownReader:{readCompletedShowdown:async options=>{calls.reader.push(options.rivalryId);return reads[options.rivalryId];}}
  });
  vm.runInContext(read("js/sharedClosedShowdownAdapter.js"),context);
  vm.runInContext(read("js/sparkClosedShowdownCareerLoader.js"),context);
  return {L:context.CareerModeSparkClosedShowdownCareerLoader,calls};
}
const services={firestore:{},firebaseSdk:{doc:()=>({}),getDoc:async()=>({exists:()=>false})},cryptoImpl:{subtle:{}},user:{uid:"acct_daniel"}};

// The career screens' caller in a vm: real loader, adapters, analytics and marker module; fake Firestore documents.
const MARKER_PATH="accounts/acct_daniel/careerStart/current";
// data.startedAt (first press, server time) differs from updatedAt (last write): the shown date comes from data.
const STARTED_AT=Date.UTC(2026,9,15,9),SERVER_NOW=Date.UTC(2026,9,17,8);
// The fake provider applies serverTimestamp() like the server does; timestamps keep their toMillis().
const materialize=v=>v&&v.__serverTimestamp===true?{toMillis:()=>SERVER_NOW}:v&&typeof v.toMillis==="function"?v:Array.isArray(v)?v.map(materialize):v&&typeof v==="object"?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,materialize(x)])):v;
const markerDoc=(ids,active,revision=0)=>({schemaVersion:1,objectType:"careerStart",objectId:"current",revision,parentRevision:revision?revision-1:null,lifecycleState:"live",contentHash:"sha256:"+"a".repeat(64),priorContentHash:revision?"sha256:"+"b".repeat(64):null,updatedAt:{toMillis:()=>Date.UTC(2026,9,16,12)},updatedByAccountId:"acct_daniel",updatedByDeviceId:"device_"+"d".repeat(32),data:{hiddenRivalryIds:ids,active,startedAt:{toMillis:()=>STARTED_AT}},tombstone:null});
function callerWith({docs={},snapshot,markerModule=true}){
  const log=[],loaderOptions=[],frames=[],definitions=new Map(),errors=[];
  const sdk={doc:(_db,...parts)=>({path:parts.join("/")}),getDoc:async ref=>{log.push(ref.path);const v=docs[ref.path];return {exists:()=>v!==undefined,data:()=>v};},
    Timestamp:{fromMillis:ms=>({toMillis:()=>ms})},serverTimestamp:()=>({__serverTimestamp:true}),
    runTransaction:async(_db,fn)=>{const writes=[];const out=await fn({get:async ref=>{log.push("tx:"+ref.path);const v=docs[ref.path];return {exists:()=>v!==undefined,data:()=>v};},set:(ref,value)=>writes.push([ref.path,value])});for(const [p,v] of writes)docs[p]=materialize(v);return out;}};
  const files={"career-closed-loader":"js/sparkClosedShowdownCareerLoader.js","career-closed-adapter":"js/sharedClosedShowdownAdapter.js","career-start-marker":"js/careerStartMarker.js"};
  const c=vm.createContext({console,URLSearchParams,setTimeout,clearTimeout,TextEncoder,crypto:require("node:crypto").webcrypto,
    CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},dispatchEvent(){return true;},addEventListener(){},
    document:{getElementById:()=>null,querySelectorAll:()=>[]},
    CareerModeCareerScreenSeam:Seam,CareerModeSharedHistoryConvergence:History,CareerModeSharedCareerAnalytics:Career,CareerModeSharedTerminalClose:Terminal,CareerModeSharedFinalReconciliation:Final,CareerModeSharedActiveShowdownAdapter:Active,
    CareerModeOnlinePlayerIdentity:{getState:()=>snapshot.identity},CareerModePersistentNikDanielPair:{getState:()=>snapshot.pair,readCareerIndex:async()=>index(ALL)},CareerModeSparkConnectedAccount:{getState:()=>({connected:true,accountId:"acct_daniel"})},
    CareerModeProductionSharedHistoryConvergence:{getState:()=>snapshot.history},CareerModeProductionSharedMultiSeasonProgression:{getState:()=>snapshot.multiSeason},CareerModeProductionSharedFinalReconciliation:{getState:()=>null},CareerModeProductionSharedTerminalClose:{getState:()=>snapshot.terminalClose},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"acct_daniel"}},firestore:{},firestoreSdk:sdk})},
    CareerModeSparkCompletedShowdownReader:{readCompletedShowdown:async options=>{log.push("rivalries/"+options.rivalryId);return reads[options.rivalryId];}},
    CareerModeV10Screens:{install(){return this;},register:(id,def)=>definitions.set(id,def),invalidate(){},hide(){},isMounted:()=>false,async show(id){frames.push({id,model:definitions.get(id).frame()});return true;}},
    CareerModeRivalryLegacyMarkup:{legacy:"",rivalryStatistics:""},getClubCrestSvg:()=>"",
    reportApplicationError:(_m,error)=>errors.push(error)
  });
  c.window=c;
  c.loadRuntimeScript=async(key,file,ready)=>{if(ready())return true;if(files[key]&&(markerModule||key!=="career-start-marker")){assert.equal(file,files[key]);vm.runInContext(read(file),c);}return true;};
  vm.runInContext(read("js/rivalryLegacyV10.js"),c);
  // Record what the career screens hand the loader, then call the real loader.
  const real=()=>c.CareerModeSparkClosedShowdownCareerLoader;
  return {c,log,frames,errors,loaderOptions,sdk,docs,
    async model(){await c.loadRuntimeScript("career-closed-loader","js/sparkClosedShowdownCareerLoader.js",()=>Boolean(c.CareerModeSparkClosedShowdownCareerLoader));const loader=real();if(!loader.__wrapped){const original=loader.loadClosedShowdownCareer;c.CareerModeSparkClosedShowdownCareerLoader=Object.freeze({...loader,__wrapped:true,loadClosedShowdownCareer:options=>{loaderOptions.push(Object.keys(options).sort().join(","));return original(options);}});}return c.CareerModeRivalryLegacyV10.loadCareerModel();},
    async rivalry(){await this.model();frames.length=0;await c.CareerModeRivalryLegacyV10.mount("rivalryStatistics");same(errors,[]);return frames.filter(f=>f.id==="statistics").at(-1).model;}
  };
}
const offline={identity:F.identity(),pair:F.pair(null,{status:"unpaired",rivalryId:null,connectionState:null}),multiSeason:null,history:null,terminalClose:null};
// The newest Showdown (p3) just ended with a verified Terminal Close: Rivalry Statistics would show it from live state.
const justClosed={identity:F.identity(),pair:F.pair(p3.rivalryId,{connectionState:"closed"}),multiSeason:F.multiFor(p3),history:F.history(p3),terminalClose:F.closed(p3)};
const completedRows=model=>model.history.showdowns.filter(row=>row.status==="completed");

(async()=>{
await check("L1 no hiddenRivalryIds: every indexed Showdown is read and counted (today)",async()=>{
  const {L,calls}=loaderWith();
  const v=await L.loadClosedShowdownCareer({...services,current:noCurrent()});
  same(calls.reader,ALL);assert.equal(v.status,"ready");assert.equal(completedRows(v.model).length,3);
  same(v.model.coverage,{readable:3,indexed:3});
});
await check("L2 marker hides the first two: no read for them, the model counts one Showdown",async()=>{
  const {L,calls}=loaderWith();
  const v=await L.loadClosedShowdownCareer({...services,current:noCurrent(),hiddenRivalryIds:[p1.rivalryId,p2.rivalryId]});
  same(calls.reader,[p3.rivalryId],"hidden Showdowns are never read");
  same(v.careerInput.showdowns.map(s=>s.rivalryId),[p3.rivalryId]);
  assert.equal(v.status,"ready");assert.equal(completedRows(v.model).length,1);same(v.model.coverage,{readable:1,indexed:1});
  assert.ok(!v.entries.some(e=>e.rivalryId===p1.rivalryId||e.rivalryId===p2.rivalryId),"hidden Showdowns leave no entry");
  const only=Career.buildCareerModel(Adapter.buildClosedCareerInput({index:index([p3.rivalryId]),reads:{[p3.rivalryId]:reads[p3.rivalryId]},current:noCurrent()}));
  same(clone(v.model),clone(only),"History, Career Statistics, Trophy Room and Legacy see exactly the one real Showdown");
});
await check("L3 absent, empty or malformed hiddenRivalryIds is today's behaviour byte for byte",async()=>{
  const base=loaderWith(),baseline=await base.L.loadClosedShowdownCareer({...services,current:noCurrent()});
  for(const option of [{hiddenRivalryIds:[]},{hiddenRivalryIds:undefined},{hiddenRivalryIds:null},{hiddenRivalryIds:"pair_x"},{hiddenRivalryIds:[42,null]}]){
    const run=loaderWith(),v=await run.L.loadClosedShowdownCareer({...services,current:noCurrent(),...option});
    same(run.calls.reader,base.calls.reader,JSON.stringify(option));assert.equal(JSON.stringify(v),JSON.stringify(baseline),JSON.stringify(option));
  }
});
await check("L4 the real career index client: hidden roots get no provider read, the order of the rest is kept",async()=>{
  const L=require(path.join(root,"js/sparkClosedShowdownCareerLoader.js"));
  const head={schemaVersion:1,objectType:"careerIndex",objectId:"current",revision:2,lifecycleState:"live",contentHash:"sha256:"+"0".repeat(64),data:{rivalryIds:ALL,sealedPageCount:0}};
  const run=async extra=>{L.clearClosedShowdownCache();const log=[];const sdk={doc:(_db,...parts)=>({path:parts.join("/")}),getDoc:async ref=>{log.push(ref.path);const v=ref.path==="accounts/acct_daniel/careerIndex/current"?head:undefined;return {exists:()=>v!==undefined,data:()=>v};}};
    const v=await L.loadClosedShowdownCareer({firestore:{},firebaseSdk:sdk,user:{uid:"acct_daniel"},cryptoImpl:require("node:crypto").webcrypto,current:noCurrent(),...extra});return {log,v};};
  // r86: each Showdown read first asks for its career summary (one exact get, absent here); hidden ones get neither.
  const summaries=log=>log.filter(p=>p.startsWith("accounts/acct_daniel/careerSummary/")),rest=log=>log.filter(p=>!p.startsWith("accounts/acct_daniel/careerSummary/"));
  const today=await run({});
  same(rest(today.log),["accounts/acct_daniel/careerIndex/current",...ALL.map(x=>"rivalries/"+x)]);
  same(summaries(today.log).sort(),ALL.map(x=>"accounts/acct_daniel/careerSummary/"+x).sort());
  const hidden=await run({hiddenRivalryIds:[p1.rivalryId,p2.rivalryId]});
  same(rest(hidden.log),["accounts/acct_daniel/careerIndex/current","rivalries/"+p3.rivalryId]);
  same(summaries(hidden.log),["accounts/acct_daniel/careerSummary/"+p3.rivalryId]);
  same(hidden.v.model.coverage,{readable:0,indexed:1});
  const all=await run({hiddenRivalryIds:ALL});
  same(all.log,["accounts/acct_daniel/careerIndex/current"]);assert.equal(all.v.status,"empty");
  L.clearClosedShowdownCache();
});
await check("L5 a hidden current Showdown never enters the career, even from live state",async()=>{
  const {L}=loaderWith();
  const v=await L.loadClosedShowdownCareer({...services,current:Active.careerInput(justClosed),hiddenRivalryIds:ALL});
  same(v.careerInput.showdowns,[]);assert.equal(v.model.status,"empty");
});

await check("C1 marker active and hiding the first two: History, Career Statistics, Trophy Room and Legacy count one",async()=>{
  const h=callerWith({docs:{[MARKER_PATH]:markerDoc([p1.rivalryId,p2.rivalryId],true)},snapshot:offline});
  const model=await h.model();
  assert.equal(model.status,"ready");assert.equal(completedRows(model).length,1);assert.equal(model.history.showdowns[0].number,1);
  assert.equal(h.c.CareerModeRivalryLegacyV10.cachedCareerModel(),model,"Career Statistics and Trophy Room read the same cached model");
  assert.equal(h.c.CareerModeRivalryLegacyV10.toV10Frame(model,"legacy").showdowns.length,1,"Legacy shows one Showdown");
  same(h.log.filter(p=>p.startsWith("rivalries/")),["rivalries/"+p3.rivalryId],"hidden Showdowns are never read");
  same(h.loaderOptions,["current,firebaseSdk,firestore,hiddenRivalryIds,user"]);
  assert.equal(model.managers.nik.careerPoints,p3.managerRecords.playerTwo.totalPoints);assert.equal(model.managers.daniel.careerPoints,p3.managerRecords.playerOne.totalPoints);
});
// r79 PR4 (Nik): the SHOW TEST SHOWDOWNS AGAIN switch is gone; old test games stay stored but are never shown, so a
// marker left switched off by the old Settings row still hides them (this pin used to expect all three).
await check("C2 a marker left switched off by the old SHOW TEST SHOWDOWNS AGAIN switch still hides the test games",async()=>{
  const h=callerWith({docs:{[MARKER_PATH]:markerDoc([p1.rivalryId,p2.rivalryId],false,1)},snapshot:offline});
  const model=await h.model();
  assert.equal(completedRows(model).length,1);same(h.loaderOptions,["current,firebaseSdk,firestore,hiddenRivalryIds,user"],"an inactive marker still passes the hidden ids");
});
await check("C3 r80 (Nik 2026-10-19, test runs never count): no marker document means every indexed Showdown is a test run, so the career is empty and nothing else is read; a build without the marker module shows nothing (fail-closed)",async()=>{
  const none=callerWith({snapshot:offline}),without=callerWith({snapshot:offline,markerModule:false});
  const a=await none.model(),b=await without.model();
  assert.equal(a.status,"empty","an account whose real career has not started shows no Showdown");
  same(none.loaderOptions,["current,firebaseSdk,firestore,testRunsOnly,user"]);
  same(none.log,[MARKER_PATH],"no index and no Showdown read: only the marker itself");
  assert.equal(b.status,"unavailable","no marker module: the career is unknown, never shown");same(without.loaderOptions,[],"and the loader is not asked");
  await none.model();same(none.log,[MARKER_PATH,MARKER_PATH],"'no marker' is asked again at the next load (a real career started on another browser shows)");
});
await check("C4 the marker is read once per account per page load",async()=>{
  const h=callerWith({docs:{[MARKER_PATH]:markerDoc([p1.rivalryId,p2.rivalryId],true)},snapshot:offline});
  await h.model();await h.model();await h.model();
  assert.equal(h.log.filter(p=>p===MARKER_PATH).length,1);
});
await check("C5 Rivalry Statistics never shows a hidden newest Showdown",async()=>{
  const today=await callerWith({docs:{[MARKER_PATH]:markerDoc([],true)},snapshot:justClosed}).rivalry();
  assert.equal((await callerWith({snapshot:justClosed}).rivalry()).status,"empty","r80: without a marker the just-closed Showdown is a test run and never shows");
  assert.equal(today.status,"ready");assert.equal(today.lifecycle,"completed");same(clone(today.score),{daniel:p3.managerRecords.playerOne.totalPoints,nik:p3.managerRecords.playerTwo.totalPoints});
  const hidden=callerWith({docs:{[MARKER_PATH]:markerDoc(ALL,true)},snapshot:justClosed});
  const model=await hidden.rivalry();
  assert.equal(model.status,"empty","the hidden newest Showdown is not shown");assert.equal(model.score,undefined);
  assert.equal(hidden.c.CareerModeRivalryLegacyV10.toV10Frame(model,"rivalryStatistics").status,"empty");
  const shown=await callerWith({docs:{[MARKER_PATH]:markerDoc([p1.rivalryId,p2.rivalryId],true)},snapshot:justClosed}).rivalry();
  same(clone(shown),clone(today),"a real newest Showdown still shows exactly as today");
  const off=await callerWith({docs:{[MARKER_PATH]:markerDoc(ALL,false,1)},snapshot:justClosed}).rivalry();
  assert.equal(off.status,"empty","r79 PR4: an inactive marker still hides the test Showdown");
});
await check("C6 Rivalry Statistics after a reload (no live state) picks the newest Showdown that is not hidden",async()=>{
  const two=await callerWith({docs:{[MARKER_PATH]:markerDoc([p3.rivalryId],true)},snapshot:offline}).rivalry();
  assert.equal(two.status,"ready");same(clone(two.history.showdowns.map(r=>r.totals)),[{daniel:p2.managerRecords.playerOne.totalPoints,nik:p2.managerRecords.playerTwo.totalPoints}]);
  const none=await callerWith({docs:{[MARKER_PATH]:markerDoc(ALL,true)},snapshot:offline}).rivalry();
  assert.equal(none.status,"empty");
});
await check("C7 a marker change clears the cached career and the next load uses the new marker",async()=>{
  const h=callerWith({docs:{"accounts/acct_daniel/careerIndex/current":{schemaVersion:1,objectType:"careerIndex",objectId:"current",revision:2,lifecycleState:"live",contentHash:"sha256:"+"0".repeat(64),data:{rivalryIds:ALL,sealedPageCount:0}}},snapshot:offline});
  assert.equal((await h.model()).status,"empty","r80: before the real career starts every Showdown is a test run and none shows");
  const Marker=h.c.CareerModeCareerStartMarker,options={firestore:{},firebaseSdk:h.sdk,accountId:"acct_daniel",deviceId:"device_"+"d".repeat(32),cryptoImpl:require("node:crypto").webcrypto};
  const started=await Marker.startRealCareer(options);
  same([...started.hiddenRivalryIds],ALL);assert.equal(h.docs[MARKER_PATH].revision,0);same({hiddenRivalryIds:h.docs[MARKER_PATH].data.hiddenRivalryIds,active:h.docs[MARKER_PATH].data.active},{hiddenRivalryIds:ALL,active:true});
  assert.equal(h.docs[MARKER_PATH].data.startedAt.toMillis(),SERVER_NOW,"startedAt is written as the server time of the press");
  assert.ok(h.log.includes("tx:accounts/acct_daniel/pairLinks/current")&&!h.log.includes("accounts/acct_daniel/pairLinks/current"),"the unfinished-Showdown check reads the pair link inside the write transaction");
  assert.equal(h.c.CareerModeRivalryLegacyV10.cachedCareerModel(),null,"the old career is no longer served");
  assert.equal((await h.model()).status,"empty");
  assert.equal((await Marker.setActive(false,options)).startedAt,SERVER_NOW,"switching keeps the original career-start date");
  assert.equal(h.c.CareerModeRivalryLegacyV10.cachedCareerModel(),null);
  assert.equal((await h.model()).status,"empty","r79 PR4: an old inactive marker still hides every test Showdown");
  assert.equal(h.log.filter(p=>p===MARKER_PATH).length,1,"writes refresh the per-account cache; no extra read");
});
await check("C9 r80 fail-closed: a failed marker read shows no career (not the test games); a read that recovers finds an active marker and mounted Career Statistics and Trophy Room reload without the hidden Showdowns",async()=>{
  const fixture=JSON.parse(read("tests/fixtures/data-contract-v1/multi-showdown-career.json")).career;
  const all={...fixture,label:"all"},real={...fixture,label:"real"};
  const events=[],registrations=new Map(),drawn=new Map(),listeners=new Map();let markerReads=0,loads=0;
  const sdk={doc:(_db,...parts)=>({path:parts.join("/")}),getDoc:async ref=>{if(ref.path!==MARKER_PATH)return {exists:()=>false,data:()=>undefined};markerReads+=1;if(markerReads===1)throw Object.assign(new Error("unavailable"),{code:"unavailable"});return {exists:()=>true,data:()=>markerDoc([p1.rivalryId,p2.rivalryId],true)};}};
  const ctx={console,document:{getElementById:()=>null},
    CareerModeCareerScreenSeam:Seam,CareerModeOnlinePlayerIdentity:{getState:()=>({registered:true,managerId:"daniel"})},
    CareerModeSparkConnectedAccount:{getState:()=>({connected:true,accountId:"acct_daniel"})},CareerModePersistentNikDanielPair:{getState:()=>({rivalryId:null})},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"acct_daniel"}},firestore:{},firestoreSdk:sdk})},
    CareerModeSharedActiveShowdownAdapter:{buildActiveShowdownViews:()=>({careerInput:null})},
    CareerModeSparkClosedShowdownCareerLoader:{loadClosedShowdownCareer:async options=>{loads+=1;return {model:options.hiddenRivalryIds?.length?real:all};}},
    CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},
    addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},
    dispatchEvent(event){events.push(event.type);for(const fn of listeners.get(event.type)||[])fn(event);return true;}};
  for(const name of ["CareerModeSharedHistoryConvergence","CareerModeSharedFinalReconciliation","CareerModeSharedTerminalClose","CareerModeSharedCareerAnalytics","CareerModeSharedClosedShowdownAdapter","CareerModeSparkCompletedShowdownReader"])ctx[name]={};
  ctx.window=ctx;
  ctx.CareerModeV10Screens={install(){return this;},register(id,def){registrations.set(id,def);},isMounted:id=>drawn.has(id),invalidate(id){drawn.delete(id);},hide:id=>drawn.delete(id),
    async show(id){const frame=registrations.get(id).frame();if(frame==null)return false;drawn.set(id,frame);return true;}};
  vm.createContext(ctx);
  ctx.loadRuntimeScript=async(key,file,ready)=>{if(!ready())vm.runInContext(read(file),ctx);return true;};
  vm.runInContext(read("js/careerScreensV10.js"),ctx);
  const settle=async()=>{for(let i=0;i<30;i++)await new Promise(resolve=>setImmediate(resolve));};
  for(const screen of ["careerStatistics","trophyRoom"]){
    drawn.clear();
    if(screen==="careerStatistics"){await ctx.CareerModeCareerScreensV10.mount(screen,()=>null);await settle();}
    else{await ctx.CareerModeCareerScreensV10.mount(screen,()=>null);await settle();drawn.set(screen,all);}
    if(screen==="careerStatistics"){
      assert.equal(markerReads,1);assert.equal(loads,0,"the career is not loaded while the marker is unknown");assert.notEqual(drawn.get(screen),all,"the failed marker read never shows the hidden Showdowns (fail-closed)");
      const Marker=ctx.CareerModeCareerStartMarker,epoch=Marker.epoch();
      // A later read (Settings, or another screen) succeeds and the marker is active.
      const marker=await Marker.readMarker({firestore:{},firebaseSdk:sdk,accountId:"acct_daniel"});
      assert.equal(marker.active,true);assert.equal(Marker.epoch(),epoch+1,"recovery counts as a marker change");
      assert.deepEqual(events.filter(type=>type==="career-mode-career-start-change"),["career-mode-career-start-change"]);
      await settle();
      assert.equal(drawn.get(screen),real,"the mounted screen reloads without the hidden Showdowns");
      await Marker.readMarker({firestore:{},firebaseSdk:sdk,accountId:"acct_daniel"});
      assert.equal(Marker.epoch(),epoch+1,"a cached read after recovery changes nothing");
    }else{
      // Trophy Room mounted on the stale career: the recovery event reloads it too.
      const Marker=ctx.CareerModeCareerStartMarker;Marker.clearCache();markerReads=0;
      drawn.set(screen,all);await Marker.readMarker({firestore:{},firebaseSdk:sdk,accountId:"acct_daniel"}).catch(()=>null);
      await Marker.readMarker({firestore:{},firebaseSdk:sdk,accountId:"acct_daniel"});await settle();
      assert.equal(drawn.get(screen),real,"Trophy Room reloads without the hidden Showdowns");
    }
  }
  // r79 PR4: recovery with an inactive marker still hides the ids, so it counts as a change too.
  const Marker=require(path.join(root,"js/careerStartMarker.js"));Marker.clearCache();
  let n=0;const flaky={doc:sdk.doc,getDoc:async()=>{n+=1;if(n===1)throw new Error("unavailable");return {exists:()=>true,data:()=>markerDoc(ALL,false,1)};}};
  await Marker.readMarker({firestore:{},firebaseSdk:flaky,accountId:"acct_x"}).catch(()=>null);const before=Marker.epoch();
  assert.equal((await Marker.readMarker({firestore:{},firebaseSdk:flaky,accountId:"acct_x"})).active,false);assert.equal(Marker.epoch(),before+1);
  same(Marker.hiddenRivalryIds(await Marker.readMarker({firestore:{},firebaseSdk:flaky,accountId:"acct_x"})),ALL,"an inactive marker still hides every id");
  assert.equal((await Marker.readMarker({firestore:{},firebaseSdk:flaky,accountId:"acct_x"})).startedAt,STARTED_AT,"the shown date is data.startedAt, not updatedAt");
});
await check("C8 the loader source makes no new reads and stays exact-get only",()=>{
  const src=read("js/sparkClosedShowdownCareerLoader.js");
  for(const banned of [/careerStart/,/getState\s*\(/,/Date\.now/,/localStorage|sessionStorage|indexedDB/])assert.doesNotMatch(src,banned,String(banned));
  const marker=read("js/careerStartMarker.js");
  for(const banned of [/getDocs\(/,/collection\(/,/query\(/,/onSnapshot/,/deleteDoc|updateDoc|writeBatch/,/localStorage|sessionStorage|indexedDB/])assert.doesNotMatch(marker,banned,String(banned));
  const html=read("index.html");assert.doesNotMatch(html,/careerStartMarker/,"the marker module is lazily loaded, never in the startup shell");
});
console.log(`PASS career start marker contracts: ${cases} cases (loader skips hidden Showdowns without reads; no marker shows no Showdown and an unknown one shows nothing; History, Career Statistics, Trophy Room, Legacy and Rivalry Statistics honour the marker, active or not).`);
})().catch(error=>{console.error(error);process.exitCode=1;});

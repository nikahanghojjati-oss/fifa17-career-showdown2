"use strict";
// r80: Nik's first real game on r79 (Daniel showed a code, Nik typed it, both played to the end) was in no career screen.
// r79's Home START, CONTINUE CAREER and the reload recovery reopened Daniel's open code, or made a code for a code-less shell,
// without the one-time START REAL CAREER checkmark. On accounts whose real career had not started that was a TEST code, so the
// game was played as a test Showdown; the checkmark at the next START then named it in the marker's hidden list, which never
// changes, and the finished game left History, Legacy, Career Statistics and the Trophy Room for good.
// G: js/productionSharedJourneyEntry.js. On a test-mode account only Settings > START TEST RUN (armed) shows or makes a test
//    code; Home START, CONTINUE CAREER and a reload go to the seasons screen, whose START makes the Showdown through the
//    checkmark. Armed test runs, real accounts and an unknown mode keep their paths.
// R: Nik chose Keep hidden (owner decision, 2026-10-19): the r79 test games, the leaked first real game too, stay hidden.
//    js/careerStartMarker.js has no reveal: the career screens hide exactly hiddenRivalryIds(marker), whenever it was made.
// C: js/rivalryLegacyV10.js hides exactly that list, with no rivalries/{id} read for it, so History, Legacy, Career Statistics
//    and the Trophy Room show only the Showdowns the marker does not name.
// U (Codex #936): when the leftover is a code Nik could still join (unexpired), the seasons START closes it (only while nobody
//    has joined it, and only once the server says the real career has not started) before the marker is written, because
//    the marker refuses while such a code is open.
// Plain node:assert, no Firebase. The browser sequence is tests/browser/r80-first-real-game-history-audit.cjs.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
const same=(a,b,message)=>assert.deepEqual(clone(a),clone(b),message);
let cases=0;
async function check(name,fn){try{await fn();cases+=1;console.log(`ok ${cases} ${name}`);}catch(error){error.message=name+": "+error.message;throw error;}}
async function settle(){for(let pass=0;pass<3;pass+=1){await new Promise(resolve=>setTimeout(resolve,5));for(let i=0;i<40;i+=1)await new Promise(resolve=>setImmediate(resolve));}}

// ------------------------------------------------------------------ G: the start paths
const LEFTOVER="pair_3"+"7".repeat(63),SAVE="save_"+"a".repeat(24),PENDING_KEY="careerModeShowdown.sharedJourneyPending.v1";
function el(id){const node={id,dataset:{},attributes:{},style:{},disabled:false,value:"",textContent:"",classList:{add(){},remove(){},contains:()=>false},
  setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this.attributes[k];},addEventListener(){},remove(){},querySelector:()=>null,focus(){},scrollIntoView(){}};return node;}
function entryHarness({mode="test",armed=false,pair="leftover",manager="daniel",resolveThrows=false}={}){
  const calls={navigate:[],layerOpen:[],startPairing:0,create:0,beforeCreate:0,resolve:0,resume:0,order:[]};
  const nodes=new Map(["startShowdown","roundAmount","connectPlayersScreen"].map(id=>[id,el(id)]));nodes.get("roundAmount").value="1";
  // the leftover: Daniel's open code, or the shell whose seasons he chose with no code yet (both from before r79)
  const pairState=pair==="leftover"?{status:"waiting",initialized:true,busy:false,rivalryId:LEFTOVER,connectionState:"pending-pair",managerRole:"playerOne"}:{status:"unpaired",initialized:true,busy:false,rivalryId:null,connectionState:null};
  const shell={totalRounds:1,status:"Created",selectedLeague:null,clubs:{playerOne:null,playerTwo:null},rounds:[],sharedJourney:{contractVersion:1,mode:"shared",setupPending:true}};
  const library={activeSaveId:SAVE,saves:[{saveId:SAVE,showdown:shell}]};
  const storage=new Map([[PENDING_KEY,"1"]]);
  const sandbox={console,setTimeout,clearTimeout,Promise,Date,
    document:{getElementById:id=>nodes.get(id)||null,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>el(""),documentElement:el("html")},
    MutationObserver:class{observe(){}disconnect(){}},
    sessionStorage:{getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},
    loadRuntimeStyle:async()=>true,loadRuntimeScript:async key=>{throw new Error(`unexpected load ${key}`);},
    ensureSaveLibraryRuntimeAuthority:async()=>true,ensureGameplayModules:async()=>true,
    navigateTo:async name=>{calls.navigate.push(name);return true;},getActiveScreenName:()=>calls.navigate.at(-1)||"mainMenu",
    loadSavedShowdown:()=>shell,resumeSavedShowdown:async()=>{calls.resume+=1;sandbox.currentShowdown=shell;},
    createShowdown:async()=>{calls.create+=1;const created={totalRounds:1,status:"Created",selectedLeague:null,clubs:{playerOne:null,playerTwo:null},rounds:[],managers:{}};sandbox.currentShowdown=created;library.saves.push({saveId:"save_"+"b".repeat(24),showdown:created});library.activeSaveId="save_"+"b".repeat(24);return true;},
    CareerModeSaveLibraryRuntime:{isReady:()=>true,getLibrarySnapshot:()=>library,saveCurrentShowdown:()=>true,clearActiveShowdown(){}},
    CareerModeOnlinePlayerIdentity:{getState:()=>({status:"ready",managerId:manager,registered:true}),subscribe:()=>()=>{},syncPair:async()=>pairState,openJoin:async()=>true},
    CareerModeConnectPlayersScreenV10:{open:async options=>{calls.layerOpen.push(options);calls.order.push("layer-opening");await new Promise(resolve=>setTimeout(resolve,5));calls.order.push("layer-open");return true;},close:()=>true},
    CareerModePersistentNikDanielPair:{getState:()=>pairState,render(){},startPairing:async()=>{calls.startPairing+=1;calls.order.push("code-started");}},
    // js/showdownModes.js as the page has it: memoised mode (marker / partner record) and the START TEST RUN arming
    CareerModeShowdownModes:{install(){},isTestRunArmed:()=>armed,resolve:async()=>{calls.resolve+=1;if(resolveThrows)throw new Error("offline");return {mode,managerId:manager};}},
    reportApplicationError(){}};
  sandbox.currentShowdown=null;
  vm.createContext(sandbox);
  vm.runInContext(read("js/whichShowdownIsLive.js"),sandbox,{filename:"whichShowdownIsLive.js"});
  vm.runInContext(read("js/productionSharedJourneyEntry.js"),sandbox,{filename:"productionSharedJourneyEntry.js"});
  const api=sandbox.CareerModeProductionSharedJourneyEntry;
  const gate=async(answer=true)=>{calls.beforeCreate+=1;if(answer)mode="real";return answer;};
  return {api,calls,gate,pairState};
}
const decisionFor=h=>h.pairState.rivalryId?{action:"resume-waiting",rivalryId:LEFTOVER,totalSeasons:1,reason:"resume-waiting"}:{action:"resume-waiting",rivalryId:null,totalSeasons:1,reason:"shell-without-code"};

// ------------------------------------------------------------------ U: the seasons START over an unexpired leftover code
// js/showdownModes.js beforeSeasonsStart() as the page has it (test account, nothing armed), with the pair and marker modules stubbed.
function modesGate({pending=true,ticked=true,fresh="none",close="closed"}={}){
  const calls=[],check={checked:ticked};let reads=0;
  const pairState=pending?{status:"waiting",rivalryId:LEFTOVER,connectionState:"pending-pair",managerRole:"playerOne"}:{status:"unpaired",rivalryId:null,connectionState:null};
  const none={accountId:"acct_daniel",status:"none",record:null};
  const pair={getState:()=>pairState,getPartnerState:()=>none,getPartnerSideState:()=>null,readPartnerRecord:async()=>none,subscribe:()=>()=>{},
    closeUnjoinedCode:async options=>{calls.push(["close",options&&options.expectedRivalryId]);if(close instanceof Error)throw close;return {ok:true,status:close};}};
  const marker={clearCache:()=>calls.push("clearCache"),
    readCurrentMarker:async()=>{reads+=1;calls.push("readMarker");if(reads===1)return {status:"none"};if(fresh==="unavailable")throw new Error("offline");return {status:fresh};},
    startRealCareer:async()=>{calls.push("startRealCareer");if(pairState.connectionState==="pending-pair"&&!calls.some(c=>Array.isArray(c)&&c[0]==="close"))throw Object.assign(new Error("Finish or end the current Showdown before starting your real career."),{code:"CAREER_START_SHOWDOWN_UNFINISHED"});return {status:"ready"};}};
  const sandbox={console,Promise,setTimeout,
    document:{getElementById:id=>id==="cmsRealCareerCheck"?check:null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){}},
    CareerModePersistentNikDanielPair:pair,CareerModeCareerStartMarker:marker,
    CareerModeOnlinePlayerIdentity:{getState:()=>({status:"ready",registered:true,accountId:"acct_daniel",managerId:"daniel"}),refreshBadge(){},renderSettings(){}},
    getActiveScreenName:()=>"createShowdown",addEventListener(){},loadRuntimeScript:async()=>{throw new Error("preloaded");}};
  sandbox.globalThis=sandbox;vm.createContext(sandbox);
  vm.runInContext(read("js/showdownModes.js"),sandbox,{filename:"showdownModes.js"});
  return {modes:sandbox.CareerModeShowdownModes,calls};
}
const closes=g=>g.calls.filter(c=>Array.isArray(c)&&c[0]==="close");

// ------------------------------------------------------------------ R: the marker module
const Marker=require(path.join(ROOT,"js/careerStartMarker.js"));
const R79_LIVE=Date.UTC(2026,9,18,17,17,45),CUTOFF=Date.UTC(2026,9,19,12,0,0),HOUR=3_600_000;
const id=n=>"pair_1"+String(n).padStart(63,"0");
const ts=ms=>({toMillis:()=>ms});
const markerAt=(ids,startedAt)=>Marker.parseMarker({schemaVersion:1,objectType:"careerStart",objectId:"current",revision:0,parentRevision:null,lifecycleState:"live",contentHash:"sha256:"+String(startedAt%10).repeat(64),priorContentHash:null,updatedAt:ts(startedAt),updatedByAccountId:"acct_daniel",updatedByDeviceId:"device_"+"d".repeat(32),data:{hiddenRivalryIds:ids,active:true,startedAt:ts(startedAt)},tombstone:null});
const rivalryDoc=(rid,{state="closed",terminal=true,at})=>({schemaVersion:1,objectType:"rivalry",objectId:rid,revision:4,lifecycleState:"live",updatedAt:ts(at),data:{connectionState:state,...(terminal?{terminalClose:{intent:"fixture"}}:{})}});

(async()=>{

await check("G1 a test-mode Daniel's Home START over an old open code goes to the seasons screen, not into that test code",async()=>{
  const h=entryHarness();h.api.install();await settle();
  await h.api.followStartDecision(decisionFor(h));
  same(h.calls.navigate,["createShowdown"],"the seasons screen, where the START REAL CAREER checkmark is");
  same([h.calls.layerOpen.length,h.calls.startPairing,h.calls.create],[0,0,0],"no WAITING, no code, no shell");
});
await check("G2 a test-mode Daniel's code-less shell never gets a test code made for it",async()=>{
  const h=entryHarness({pair:"shell"});h.api.install();await settle();
  await h.api.followStartDecision(decisionFor(h));
  same(h.calls.navigate,["createShowdown"]);same([h.calls.layerOpen.length,h.calls.startPairing],[0,0],"no code is made without the checkmark");
});
await check("G3 the seasons START over that leftover runs the checkmark first, then makes the Showdown and its code",async()=>{
  for(const pair of ["leftover","shell"]){
    const h=entryHarness({pair});h.api.install();await settle();
    assert.equal(await h.api.preparePairingShell({beforeCreate:()=>h.gate(true)}),true,`${pair}: START makes the Showdown`);
    same([h.calls.beforeCreate,h.calls.create,h.calls.startPairing],[1,1,1],`${pair}: checkmark (marker) -> shell -> code, once each`);
    same(h.calls.layerOpen.map(o=>o&&o.stayOnScreen),[true],`${pair}: WAITING over the wheel`);
    const refused=entryHarness({pair});refused.api.install();await settle();
    assert.equal(await refused.api.preparePairingShell({beforeCreate:()=>refused.gate(false)}),false,`${pair}: an unticked or refused checkmark`);
    same([refused.calls.beforeCreate,refused.calls.create,refused.calls.startPairing,refused.calls.layerOpen.length],[1,0,0,0],`${pair}: creates nothing`);
  }
});
await check("G4 after a reload a test-mode account's leftover is not reopened by itself (no wheel, no WAITING, no code)",async()=>{
  for(const pair of ["leftover","shell"]){
    const h=entryHarness({pair});h.api.install();await h.api.startupResume();await settle();
    same([h.calls.navigate.length,h.calls.resume,h.calls.layerOpen.length,h.calls.startPairing],[0,0,0,0],pair);
  }
});
await check("G5 unchanged: an armed START TEST RUN, a real account and an unknown mode reopen WAITING as before",async()=>{
  for(const options of [{armed:true},{mode:"real"},{mode:"unknown"},{resolveThrows:true}]){
    // (not installed here: the reload recovery is checked on its own below)
    const h=entryHarness(options);
    await h.api.followStartDecision(decisionFor(h));
    same([h.calls.navigate.includes("createShowdown"),h.calls.layerOpen.length,h.calls.startPairing],[false,1,0],JSON.stringify(options));
    const shell=entryHarness({...options,pair:"shell"});
    await shell.api.followStartDecision(decisionFor(shell));
    same([shell.calls.layerOpen.length,shell.calls.startPairing],[1,1],`${JSON.stringify(options)}: the code-less shell still gets its code`);
    const reload=entryHarness(options);reload.api.install();await reload.api.startupResume();await settle();
    same([reload.calls.layerOpen.length,reload.calls.navigate.at(-1)],[1,"leagueWheelScreen"],`${JSON.stringify(options)}: reload reopens WAITING over the wheel`);
  }
  const nik=entryHarness({manager:"nik"});nik.api.install();await settle();
  await nik.api.followStartDecision(decisionFor(nik));assert.equal(nik.calls.resolve,0,"Nik's paths never ask");
});
await check("G6 no flash: a code that replaces the leftover is begun while WAITING opens, so the old code is never drawn in between",async()=>{
  const h=entryHarness({mode:"real"});
  assert.equal(await h.api.openWaiting({createCode:true}),true);
  same(h.calls.order,["layer-opening","code-started","layer-open"],"replacing: the new code starts before the layer is up");
  const fresh=entryHarness({mode:"real",pair:"shell"});
  assert.equal(await fresh.api.openWaiting({createCode:true}),true);
  same(fresh.calls.order,["layer-opening","layer-open","code-started"],"a first code: unchanged order (layer, then code)");
  const pair=read("js/persistentNikDanielPair.js");
  assert.match(pair,/\}else if\(state\.status==="starting"&&state\.busy\)\{\/\*[^*]*\*\/\}else if\(state\.connectionState==="pending-pair"&&state\.capability\)\{const code=/,"while a code is being made the panel draws no older code");
});
await check("U1 an unexpired leftover code: the seasons START closes it, then writes the marker (the marker refuses while it is open)",async()=>{
  const g=modesGate();
  assert.equal(await g.modes.beforeSeasonsStart(),true,"the real career starts");
  same(g.calls.filter(c=>c!=="clearCache"),["readMarker","readMarker",["close",LEFTOVER],"startRealCareer"],"fresh marker check, the close of exactly that code, then the marker");
});
await check("U2 nothing is closed when START refuses before the marker: unticked, a real career started elsewhere, or no answer",async()=>{
  for(const [label,options] of [["unticked",{ticked:false}],["started on another browser",{fresh:"ready"}],["offline",{fresh:"unavailable"}]]){
    const g=modesGate(options);
    assert.equal(await g.modes.beforeSeasonsStart(),false,label);
    same([closes(g).length,g.calls.includes("startRealCareer")],[0,false],`${label}: no close, no marker`);
  }
});
await check("U3 a code Nik has joined meanwhile (or a close that fails) is never ended from START, and no marker is written",async()=>{
  for(const error of [Object.assign(new Error("Nik has already joined your earlier code, so that test run is being played. Finish or end it first. Nothing was changed."),{code:"PERSISTENT_PAIR_CODE_JOINED"}),Object.assign(new Error("offline"),{code:"unavailable"})]){
    const g=modesGate({close:error});
    assert.equal(await g.modes.beforeSeasonsStart(),false,error.code);
    assert.equal(g.calls.includes("startRealCareer"),false,`${error.code}: no marker`);
  }
});
await check("U4 unchanged: no leftover code means no extra read and no close (a first START, a code-less shell)",async()=>{
  const g=modesGate({pending:false});
  assert.equal(await g.modes.beforeSeasonsStart(),true);
  same(g.calls,["readMarker","startRealCareer"],"one memoised read, then the marker, as before");
});
await check("U5 the close itself: only Daniel's own code, only while it is still pending-pair, inside the close transaction",async()=>{
  const pair=read("js/persistentNikDanielPair.js");
  const tx=pair.slice(pair.indexOf("async function pairAbandonCurrentShowdown("),pair.indexOf("async function pairLoadConnectedRivalry("));
  const guard=tx.indexOf('if(options.unjoinedOnly===true&&(link.managerRole!=="playerOne"||rivalryValue.data?.connectionState!=="pending-pair"))throw pairErrorWithCode("PERSISTENT_PAIR_CODE_JOINED"');
  assert.ok(guard>0,"the joined-code refusal is in the close");
  assert.ok(guard>tx.indexOf("const rivalryRef=pairRivalryReference(context,link.rivalryId),rivalrySnapshot=await transaction.get(rivalryRef);")&&guard<tx.indexOf("transaction.set(rivalryRef,next);"),"read in the same transaction, before the only write");
  assert.match(pair,/closeUnjoinedCode:options=>options&&options\.expectedRivalryId\?pairAbandonCurrentShowdown\(\{expectedRivalryId:options\.expectedRivalryId,unjoinedOnly:true\}\):Promise\.reject\(/,"always for one named code");
});
await check("U6 the marker guard is unchanged: an open pending code, or an active Showdown, still refuses the marker",async()=>{
  const RID="pair_"+"9".repeat(64),now=Date.now();
  async function attempt(rivalryState,inviteExpires){
    const docs={"accounts/acct_daniel/pairLinks/current":{data:{rivalryId:RID}},[`rivalries/${RID}`]:{data:{connectionState:rivalryState}},[`rivalries/${RID}/invites/${RID}`]:{data:{state:"open",expiresAt:ts(inviteExpires)}}};
    const writes=[];
    const sdk={doc:(_db,...parts)=>({path:parts.join("/")}),Timestamp:{fromMillis:ts},serverTimestamp:()=>({sentinel:true}),
      runTransaction:async(_db,fn)=>fn({get:async ref=>({exists:()=>docs[ref.path]!==undefined,data:()=>docs[ref.path]}),set:(ref,value)=>writes.push(ref.path)})};
    Marker.clearCache();
    try{await Marker.startRealCareer({firestore:{},firebaseSdk:sdk,accountId:"acct_daniel",deviceId:"device_"+"d".repeat(32),cryptoImpl:require("node:crypto").webcrypto});return writes;}
    catch(error){return error.code;}
  }
  assert.equal(await attempt("pending-pair",now+3600_000),"CAREER_START_SHOWDOWN_UNFINISHED","an unexpired open code refuses (why the close comes first)");
  assert.equal(await attempt("active",now+3600_000),"CAREER_START_SHOWDOWN_UNFINISHED","an active Showdown refuses");
  same(await attempt("closed",now+3600_000),["accounts/acct_daniel/careerStart/current"],"once closed, the marker is written");
  Marker.clearCache();
});
await check("R1 Keep hidden: the leaked first real game finished on r79 stays hidden with the older test games, whenever the marker was made",async()=>{
  const old1=id(1),old2=id(2),leftover=id(3),game=id(4),hidden=[old1,old2,leftover,game];
  for(const startedAt of [R79_LIVE-HOUR,R79_LIVE+3*HOUR,CUTOFF-1,CUTOFF,CUTOFF+4*HOUR]){
    const marker=markerAt(hidden,startedAt);
    same(Marker.hiddenRivalryIds(marker),hidden,`started ${new Date(startedAt).toISOString()}: every named Showdown stays hidden`);
    same(Marker.hiddenRivalryIds(marker),hidden,"and the list is a copy (the marker is unchanged)");
  }
  same(Marker.hiddenRivalryIds({status:"none",hiddenRivalryIds:[]}),[],"no marker hides nothing");
});
await check("R2 the reveal is gone: no reveal export, no r79 window, no rivalries/{id} scan in the marker module",async()=>{
  for(const key of ["careerHiddenRivalryIds","revealSinceEpochMs","revealBeforeEpochMs"])assert.equal(Object.hasOwn(Marker,key),false,`${key} is not exported`);
  const source=read("js/careerStartMarker.js");
  assert.doesNotMatch(source,/careerHiddenRivalryIds|R79_LIVE_MS|R80_PREVENTION_MS|REVEAL_SCAN_LIMIT|\breveals\b/,"no reveal code or constants");
  assert.match(source,/\/\/ r80: Nik chose Keep hidden \(2026-10-19\): an r79 test game stays hidden, even the leaked first real game\./);
  assert.match(source,/function hiddenRivalryIds\(marker\)\{return marker&&marker\.status==="ready"\?marker\.hiddenRivalryIds\.slice\(\):\[\];\}/,"the plain hidden list, unchanged");
  assert.equal((source.match(/transaction\.set\(/g)||[]).length,1,"the one marker write, unchanged");
  assert.doesNotMatch(source,/deleteDoc|setDoc|updateDoc|writeBatch|transaction\.delete\(/);
  const legacy=read("js/rivalryLegacyV10.js");
  assert.doesNotMatch(legacy,/careerHiddenRivalryIds/,"the career screens never ask for a reveal");
  assert.match(legacy,/return marker\.hiddenRivalryIds\(await marker\.readMarker\(\{firestore:services\.firestore,firebaseSdk:\{\.\.\.services\.firestoreSdk,getDoc\},accountId:user\.uid\}\)\);/,"the career screens hide exactly hiddenRivalryIds(marker)");
});

// ------------------------------------------------------------------ C: the career screens keep it hidden
await check("C1 History, Legacy, Career Statistics and the Trophy Room leave out the leaked r79 game and the old test game, with no read of either",async()=>{
  const Adapter=require(path.join(ROOT,"js/sharedClosedShowdownAdapter.js")),Career=require(path.join(ROOT,"js/sharedCareerAnalytics.js")),Active=require(path.join(ROOT,"js/sharedActiveShowdownAdapter.js"));
  const History=require(path.join(ROOT,"js/sharedHistoryConvergence.js")),Terminal=require(path.join(ROOT,"js/sharedTerminalClose.js")),Final=require(path.join(ROOT,"js/sharedFinalReconciliation.js")),Seam=require(path.join(ROOT,"js/careerScreenSeam.js"));
  const F=require("../support/active-showdown-fixtures.cjs"),{result:R,projection:P}=F;void Adapter;
  const completedRead=p=>{const a=p.managerRecords.playerOne.totalPoints,b=p.managerRecords.playerTwo.totalPoints;return {status:"completed",code:null,rivalryId:p.rivalryId,managerRole:"playerOne",terminalWitness:F.closed(p).terminalWitness,projection:p,final:{totals:{playerOne:a,playerTwo:b},winner:a>b?"playerOne":b>a?"playerTwo":"draw",margin:Math.abs(a-b),seasonsPlayed:p.totalSeasons}};};
  const test=P({seed:"1",totalSeasons:1,seasons:[[R({championsLeague:true}),R()]]}),game=P({seed:"2",totalSeasons:1,seasons:[[R(),R({leaguePosition:1,leaguePoints:101})]]}),real=P({seed:"3",totalSeasons:1,seasons:[[R({leaguePosition:1,leaguePoints:95}),R()]]});
  const HIDDEN=[test.rivalryId,game.rivalryId],ALL=[...HIDDEN,real.rivalryId],reads={[test.rivalryId]:completedRead(test),[game.rivalryId]:completedRead(game),[real.rivalryId]:completedRead(real)};
  const markerDoc=startedAt=>({schemaVersion:1,objectType:"careerStart",objectId:"current",revision:0,parentRevision:null,lifecycleState:"live",contentHash:"sha256:"+"a".repeat(64),priorContentHash:null,updatedAt:ts(startedAt),updatedByAccountId:"acct_daniel",updatedByDeviceId:"device_"+"d".repeat(32),data:{hiddenRivalryIds:HIDDEN,active:true,startedAt:ts(startedAt)},tombstone:null});
  async function career(startedAt){
    const log=[],definitions=new Map();
    // the leaked game was finished on r79 (what the removed reveal looked for); the old test game before r79
    const docs={"accounts/acct_daniel/careerStart/current":markerDoc(startedAt),[`rivalries/${game.rivalryId}`]:rivalryDoc(game.rivalryId,{at:R79_LIVE+HOUR}),[`rivalries/${test.rivalryId}`]:rivalryDoc(test.rivalryId,{at:R79_LIVE-HOUR*30})};
    const sdk={doc:(_db,...parts)=>({path:parts.join("/")}),getDoc:async ref=>{log.push(ref.path);const v=docs[ref.path];return {exists:()=>v!==undefined,data:()=>v};}};
    const files={"career-closed-loader":"js/sparkClosedShowdownCareerLoader.js","career-closed-adapter":"js/sharedClosedShowdownAdapter.js","career-start-marker":"js/careerStartMarker.js"};
    const snapshot={identity:F.identity(),pair:F.pair(null,{status:"unpaired",rivalryId:null,connectionState:null}),multiSeason:null,history:null,terminalClose:null};
    const c=vm.createContext({console,URLSearchParams,setTimeout,clearTimeout,TextEncoder,crypto:require("node:crypto").webcrypto,
      CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},dispatchEvent(){return true;},addEventListener(){},
      document:{getElementById:()=>null,querySelectorAll:()=>[]},
      CareerModeCareerScreenSeam:Seam,CareerModeSharedHistoryConvergence:History,CareerModeSharedCareerAnalytics:Career,CareerModeSharedTerminalClose:Terminal,CareerModeSharedFinalReconciliation:Final,CareerModeSharedActiveShowdownAdapter:Active,
      CareerModeOnlinePlayerIdentity:{getState:()=>snapshot.identity},CareerModePersistentNikDanielPair:{getState:()=>snapshot.pair,readCareerIndex:async()=>({status:"ready",accountId:"acct_daniel",rivalryIds:ALL,sealedPageCount:0,code:null})},CareerModeSparkConnectedAccount:{getState:()=>({connected:true,accountId:"acct_daniel"})},
      CareerModeProductionSharedHistoryConvergence:{getState:()=>null},CareerModeProductionSharedMultiSeasonProgression:{getState:()=>null},CareerModeProductionSharedFinalReconciliation:{getState:()=>null},CareerModeProductionSharedTerminalClose:{getState:()=>null},
      CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"acct_daniel"}},firestore:{},firestoreSdk:sdk})},
      CareerModeSparkCompletedShowdownReader:{readCompletedShowdown:async options=>{log.push("reader:"+options.rivalryId);return reads[options.rivalryId];}},
      CareerModeV10Screens:{install(){return this;},register:(key,def)=>definitions.set(key,def),invalidate(){},hide(){},isMounted:()=>false,async show(){return true;}},
      CareerModeRivalryLegacyMarkup:{legacy:"",rivalryStatistics:""},getClubCrestSvg:()=>"",reportApplicationError(){}});
    c.window=c;
    c.loadRuntimeScript=async(key,file,ready)=>{if(ready())return true;if(files[key]){assert.equal(file,files[key]);vm.runInContext(read(file),c);}return true;};
    vm.runInContext(read("js/rivalryLegacyV10.js"),c);
    await c.loadRuntimeScript("career-closed-loader","js/sparkClosedShowdownCareerLoader.js",()=>Boolean(c.CareerModeSparkClosedShowdownCareerLoader));
    const model=await c.CareerModeRivalryLegacyV10.loadCareerModel();
    return {model,log,legacy:c.CareerModeRivalryLegacyV10.toV10Frame(model,"legacy"),cached:c.CareerModeRivalryLegacyV10.cachedCareerModel()};
  }
  for(const [label,startedAt] of [["a marker made on r79 (Nik's and Daniel's)",R79_LIVE+2*HOUR],["a marker made before r79",R79_LIVE-HOUR],["a marker made on r80",CUTOFF+HOUR]]){
    const v=await career(startedAt);
    assert.equal(v.model.status,"ready",label);
    same(v.model.history.showdowns.filter(row=>row.status==="completed").map(row=>row.rivalryId),[real.rivalryId],`${label}: History shows only the real game; the leaked r79 game and the old test game stay hidden`);
    assert.equal(v.legacy.showdowns.length,1,`${label}: Legacy shows one`);assert.equal(v.cached,v.model,`${label}: Career Statistics and the Trophy Room read the same model`);
    assert.equal(v.model.managers.nik.careerPoints,real.managerRecords.playerTwo.totalPoints,`${label}: the career counts only the real game`);
    same(v.log.filter(p=>p.startsWith("reader:")),["reader:"+real.rivalryId],`${label}: neither hidden Showdown is read`);
    same(v.log.filter(p=>p.startsWith("rivalries/")),[],`${label}: no rivalries/{id} read for the hidden list`);
    same(v.log.filter(p=>!p.startsWith("reader:")),["accounts/acct_daniel/careerStart/current"],`${label}: the one marker get, nothing more`);
  }
});
console.log(`PASS r80 first real game history contracts: ${cases} checks (a test-mode Home START, CONTINUE CAREER or reload never reopens or makes a test code; the seasons START runs the checkmark first; Keep hidden: every Showdown the marker names, the leaked r79 game too, stays hidden with no extra read).`);
})().catch(error=>{console.error(error);process.exitCode=1;});

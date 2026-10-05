"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");

// BH-7 (audit 2026-10-05 items 1, 2, 4, 9): three transient failures hardened without any scoring, Rules or screen change.
const root=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const R="pair_"+"7".repeat(64),S="session_"+"6".repeat(64),S2="session_"+"5".repeat(64),D="device_"+"1".repeat(32),U="account_one";
const SAVE="save_"+"a".repeat(24),P1="profile_"+"b".repeat(24),P2="profile_"+"c".repeat(24);
const flush=async(times=8)=>{for(let i=0;i<times;i+=1)await new Promise(resolve=>setImmediate(resolve));};

function fakeClock(start){
  const clock={now:start};
  class FakeDate extends Date{constructor(...args){super(...(args.length?args:[clock.now]));}static now(){return clock.now;}}
  clock.Date=FakeDate;return clock;
}

// ---------- Fix 1: Shared Setup holds a confirmed state for one poll on a transient context failure ----------
function setupSandbox(){
  const clock=fakeClock(1_800_000_000_000);
  const env={rivalryAttached:true,servicesOk:true,accountConnected:true,readOk:true,remote:null};
  const expiresAtEpochMs=clock.now+3_600_000;
  const remote=()=>env.remote||{sessionState:"active",sessionId:S,expiresAtEpochMs,rivalryId:R,accountId:U,deviceId:D,role:"host",pendingAction:null};
  const sandbox={console,crypto:webcrypto,setTimeout,clearTimeout,Promise,Date:clock.Date};sandbox.globalThis=sandbox;
  sandbox.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>env.servicesOk?{ok:true,auth:{currentUser:{uid:U}},firestore:{},firestoreSdk:{}}:{ok:false}};
  sandbox.CareerModeSparkConnectedAccount={initialize:async()=>true,getState:()=>({connected:env.accountConnected,accountId:U})};
  sandbox.CareerModeSparkPrivatePairing={initialize:async()=>true,getState:()=>({registered:true,deviceId:D})};
  sandbox.CareerModeSparkConnectedRivalry={initialize:async()=>true,getState:()=>env.rivalryAttached?{attached:true,rivalryId:R,binding:{managerRole:"playerOne"},accountId:U,deviceId:D}:{initialized:true,attached:false,status:"unavailable",rivalryId:null,binding:null}};
  sandbox.CareerModeSparkRemoteJoining={getState:()=>remote()};
  sandbox.CareerModeSharedShowdownSetup={};sandbox.CareerModeSharedShowdownCatalog={catalog:{}};
  const confirmed={phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",leagueId:"premier_league",clubs:{playerOne:"A",playerTwo:"B"},totalSeasons:3,confirmedRoles:["playerOne","playerTwo"]};
  sandbox.CareerModeSparkSharedShowdownSetup={read:async()=>env.readOk?{ok:true,status:"ready",revision:6,state:confirmed}:{ok:false,code:"unavailable"},mutate:async()=>({ok:false,code:"UNUSED"})};
  sandbox.CareerModeProductionSharedJourneyConflicts={execute:async(_intent,write)=>write()};
  vm.createContext(sandbox);
  vm.runInContext(read("js/productionSharedShowdownSetup.js"),sandbox,{filename:"productionSharedShowdownSetup.js"});
  return {api:sandbox.CareerModeProductionSharedShowdownSetup,env,clock};
}

async function setupContracts(){
  const healthy=async(api)=>{const s=await api.refresh();assert.equal(s.ready,true);assert.equal(s.setup.phase,"SHOWDOWN_CONFIRMED");return s;};
  for(const [label,breakIt,healIt] of [
    ["SHARED_SETUP_RIVALRY_REQUIRED",env=>{env.rivalryAttached=false;},env=>{env.rivalryAttached=true;}],
    ["SHARED_SETUP_PROVIDER_UNAVAILABLE",env=>{env.servicesOk=false;},env=>{env.servicesOk=true;}]
  ]){
    const {api,env}=setupSandbox();await healthy(api);
    breakIt(env);
    let s=await api.refresh();
    assert.equal(s.ready,true,`${label}: one transient context failure keeps the confirmed Setup for one poll`);
    assert.equal(s.status,"ready");assert.equal(s.setup.phase,"SHOWDOWN_CONFIRMED");assert.equal(s.sessionId,S);
    s=await api.refresh();
    assert.equal(s.ready,false,`${label}: a second consecutive failure still drops ready, as before`);assert.equal(s.status,"locked");
    healIt(env);await healthy(api);
    // A success clears the hold, so the next isolated blip is held again.
    breakIt(env);s=await api.refresh();assert.equal(s.ready,true,`${label}: hold re-arms after a successful read`);
    healIt(env);await healthy(api);
  }

  // The hold only applies while the same private session is still exact-ACTIVE and unexpired.
  const sessionCases=[
    ["expired session",(env,clock)=>{env.remote={sessionState:"active",sessionId:S,expiresAtEpochMs:clock.now-1,rivalryId:R,accountId:U,deviceId:D,role:"host",pendingAction:null};}],
    ["no expiry",(env)=>{env.remote={sessionState:"active",sessionId:S,rivalryId:R,accountId:U,deviceId:D,role:"host",pendingAction:null};}],
    ["closed session",(env,clock)=>{env.remote={sessionState:"closed",sessionId:S,expiresAtEpochMs:clock.now+60_000,rivalryId:R,accountId:U,deviceId:D,role:"host",pendingAction:null};}],
    ["replacement session",(env,clock)=>{env.remote={sessionState:"active",sessionId:S2,expiresAtEpochMs:clock.now+60_000,rivalryId:R,accountId:U,deviceId:D,role:"host",pendingAction:null};}],
    ["pending action",(env,clock)=>{env.remote={sessionState:"active",sessionId:S,expiresAtEpochMs:clock.now+60_000,rivalryId:R,accountId:U,deviceId:D,role:"host",pendingAction:"rejoin"};}],
    ["other device",(env,clock)=>{env.remote={sessionState:"active",sessionId:S,expiresAtEpochMs:clock.now+60_000,rivalryId:R,accountId:U,deviceId:"device_"+"9".repeat(32),role:"host",pendingAction:null};}]
  ];
  for(const [label,mutateRemote] of sessionCases){
    const {api,env,clock}=setupSandbox();await healthy(api);
    env.servicesOk=false;mutateRemote(env,clock);
    const s=await api.refresh();
    assert.equal(s.ready,false,`${label}: a transient context failure without the exact ACTIVE session drops ready at once`);
  }
  // Session expiry passing while the confirmed state is cached also drops at once (the clock moves, the session does not).
  {const {api,env,clock}=setupSandbox();await healthy(api);clock.now+=3_600_000;env.rivalryAttached=false;const s=await api.refresh();assert.equal(s.ready,false,"an expired session never holds");}

  // Non-transient context failures still never hold (logout, mismatch): unchanged behaviour.
  {const {api,env}=setupSandbox();await healthy(api);env.accountConnected=false;const s=await api.refresh();assert.equal(s.ready,false,"SHARED_SETUP_AUTH_REQUIRED never holds");}

  // A failed read and a transient context failure in a row are two consecutive failures: the second drops ready.
  {const {api,env}=setupSandbox();await healthy(api);env.readOk=false;let s=await api.refresh();assert.equal(s.ready,true,"existing one-poll read hold unchanged");env.readOk=true;env.servicesOk=false;s=await api.refresh();assert.equal(s.ready,false,"read failure then context failure drops ready");}
  {const {api,env}=setupSandbox();await healthy(api);env.servicesOk=false;let s=await api.refresh();assert.equal(s.ready,true);env.servicesOk=true;env.readOk=false;s=await api.refresh();assert.equal(s.ready,false,"context failure then read failure drops ready");}

  // A Setup that is not yet confirmed never holds (unchanged).
  {
    const {api,env}=setupSandbox();
    env.servicesOk=false;const s=await api.refresh();assert.equal(s.ready,false,"nothing confirmed, nothing held");
  }

  const source=read("js/productionSharedShowdownSetup.js");
  assert.match(source,/TRANSIENT_CONTEXT_CODES=Object\.freeze\(\["SHARED_SETUP_PROVIDER_UNAVAILABLE","SHARED_SETUP_RIVALRY_REQUIRED"\]\)/);
  assert.match(source,/if\(!readReached&&TRANSIENT_CONTEXT_CODES\.includes\(String\(error&&error\.code\|\|""\)\)&&!heldReadFailure&&state\.ready===true&&state\.setup&&state\.setup\.phase==="SHOWDOWN_CONFIRMED"&&heldSessionStillActive\(\)\)\{heldReadFailure=true;return setState\(\{status:"ready",busy:false\}\);\}/);
  assert.match(source,/Number\.isFinite\(expiry\)&&Date\.now\(\)<expiry/,"the hold requires an unexpired session");
}

// ---------- Fix 2: Terminal Close throttled rivalry retry and lost CLOSE race ----------
const terminalProtocol=require(path.join(root,"js/sharedTerminalClose.js"));
function intentFor(sessionId,totals={playerOne:14,playerTwo:9}){
  return terminalProtocol.verifyIntent({schemaVersion:1,runtimeRevision:"1.9.1-r18",phase:"TERMINAL_CLOSE_READY",rivalryId:R,sessionId,totalSeasons:3,completedSeason:3,managerTotals:totals,winner:totals.playerOne>totals.playerTwo?"playerOne":totals.playerTwo>totals.playerOne?"playerTwo":"draw",terminal:true,finalSeasonReconciled:true,nextSeason:null,extraSeasonAllowed:false,rivalryConnectionState:"closed",sessionTargetState:"closed",terminalReadAllowed:true,canonicalStorageMutation:false,providerWriteRequired:true,listPermissionRequired:false,billingRequired:false});
}
function terminalSandbox(options={}){
  const clock=fakeClock(1_800_000_000_000);
  const listeners=new Map(),reports=[];
  const env={
    rivalry:options.rivalry||{initialized:true,attached:true,status:"saved-link",rivalryId:R,accountId:U,deviceId:D,binding:{saveId:SAVE,managerRole:"playerOne",profileId:P1}},
    initializeCalls:0,initializeImpl:null,readCalls:0,closeCalls:0,forgot:0,
    readImpl:async()=>({ok:true,status:"open",terminal:false}),closeImpl:async()=>({ok:false,code:"permission-denied",message:"Missing or insufficient permissions."})
  };
  const sandbox={console,crypto:webcrypto,Promise,Date:clock.Date,setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0,
    CustomEvent:class{constructor(type,init){this.type=type;this.detail=init&&init.detail;}},
    dispatchEvent:()=>true,
    addEventListener:(type,handler)=>{if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(handler);},
    reportApplicationError:(context,error)=>reports.push({context,error}),
    document:{visibilityState:"visible",getElementById:()=>null,addEventListener:()=>{},querySelector:()=>null},
    currentShowdown:{sharedJourney:{mode:"shared",...(options.markerRivalry===false?{}:{rivalryId:R})},identity:{saveId:SAVE,managerProfileIds:{playerOne:P1,playerTwo:P2}},managers:{playerOne:"Nik",playerTwo:"Daniel"}}
  };
  sandbox.globalThis=sandbox;
  const wake=()=>{for(const handler of listeners.get("career-mode-connected-rivalry-state-change")||[])handler({type:"career-mode-connected-rivalry-state-change"});};
  sandbox.CareerModeSharedTerminalClose={...terminalProtocol,prepare:(_final,{sessionId})=>intentFor(sessionId)};
  sandbox.CareerModeSparkTerminalClose={read:async(opts)=>{env.readCalls+=1;assert.equal(opts.rivalryId,R);return env.readImpl();},close:async(opts)=>{env.closeCalls+=1;assert.equal(opts.intent.sessionId,S);return env.closeImpl();}};
  sandbox.CareerModeProductionSharedFinalReconciliation={getState:()=>({phase:"FINAL_SEASON_RECONCILED",finalSeasonReconciled:true,rivalryId:R}),refresh:async()=>({phase:"FINAL_SEASON_RECONCILED",finalSeasonReconciled:true,rivalryId:R})};
  sandbox.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:U}},firestore:{},firestoreSdk:{}})};
  sandbox.CareerModeSparkConnectedAccount={initialize:async()=>true,getState:()=>({connected:true,accountId:U})};
  sandbox.CareerModeSparkPrivatePairing={initialize:async()=>true,getState:()=>({registered:true,deviceId:D})};
  sandbox.CareerModeSparkConnectedRivalry={
    initialize:()=>{env.initializeCalls+=1;if(env.initializeImpl)return env.initializeImpl();wake();return Promise.resolve(env.rivalry);},
    getState:()=>env.rivalry
  };
  sandbox.CareerModeSparkRemoteJoining={getState:()=>({sessionState:"active",sessionId:S,expiresAtEpochMs:clock.now+3_600_000,rivalryId:R,accountId:U,deviceId:D,role:"host",pendingAction:null}),forgetSession:()=>{env.forgot+=1;}};
  vm.createContext(sandbox);
  vm.runInContext(read("js/productionSharedTerminalClose.js"),sandbox,{filename:"productionSharedTerminalClose.js"});
  return {api:sandbox.CareerModeProductionSharedTerminalClose,sandbox,env,clock,reports,wake};
}

async function terminalRaceContracts(){
  // Both managers tap CLOSE; the rival wins, this phone's write is denied. One re-read shows CLOSED quietly.
  {
    const {api,env,reports}=terminalSandbox();
    let state=await api.refresh();assert.equal(state.phase,"READY");assert.equal(env.readCalls,1);
    env.readImpl=async()=>({ok:true,status:"closed",rivalryId:R,rivalryState:"closed",rivalryRevision:41,sessionRevision:7,terminal:true,terminalWitness:intentFor(S)});
    const result=await api.close();
    assert.equal(result.ok,true,"the lost race resolves as the rival's identical close");
    assert.equal(result.closedByRival,true);assert.equal(result.replayed,true);
    assert.equal(env.closeCalls,1,"no second write");assert.equal(env.readCalls,2,"exactly one re-read");
    state=api.getState();assert.equal(state.phase,"CLOSED","this phone now shows SHARED SHOWDOWN CLOSED");assert.equal(state.terminal,true);assert.equal(state.rivalryRevision,41);
    assert.equal(env.forgot,1,"the closed session is forgotten exactly as on the winning phone");
    assert.equal(reports.length,0,"nothing is reported to the player");
  }
  // Firestore-prefixed denial code is recognised too.
  {
    const {api,env}=terminalSandbox();await api.refresh();
    env.closeImpl=async()=>({ok:false,code:"firestore/permission-denied"});
    env.readImpl=async()=>({ok:true,terminal:true,rivalryRevision:41,terminalWitness:intentFor(S)});
    const result=await api.close();assert.equal(result.ok,true);assert.equal(api.getState().phase,"CLOSED");
  }
  // The rivalry is closed with a DIFFERENT witness: never claimed as ours; the existing rejection path is unchanged.
  {
    const {api,env}=terminalSandbox();await api.refresh();
    env.readImpl=async()=>({ok:true,terminal:true,rivalryRevision:41,terminalWitness:intentFor(S,{playerOne:1,playerTwo:9})});
    const result=await api.close();
    assert.equal(result.ok,false);assert.equal(result.code,"permission-denied");
    assert.equal(api.getState().phase,"READY");assert.equal(env.readCalls,2,"re-read once, no loop");assert.equal(env.forgot,0);
  }
  // The re-read shows the rivalry still open (a real denial): unchanged rejection, one re-read only.
  {
    const {api,env}=terminalSandbox();await api.refresh();
    const result=await api.close();
    assert.equal(result.ok,false);assert.equal(api.getState().phase,"READY");assert.equal(env.readCalls,2);
  }
  // The re-read itself fails or throws: unchanged rejection path, never an exception.
  {
    const {api,env}=terminalSandbox();await api.refresh();
    env.readImpl=async()=>{throw Object.assign(new Error("offline"),{code:"unavailable"});};
    const result=await api.close();assert.equal(result.ok,false);assert.equal(api.getState().phase,"READY");
  }
  // Non-race rejections never trigger the re-read.
  {
    const {api,env}=terminalSandbox();await api.refresh();
    env.closeImpl=async()=>({ok:false,code:"TERMINAL_CLOSE_FINAL_AUTHORITY_MISMATCH"});
    const result=await api.close();assert.equal(result.ok,false);assert.equal(env.readCalls,1,"no re-read for a non-race rejection");
  }
  // Ambiguous outcomes still go to RECOVERY_PENDING (unchanged), and a RETRY that loses the race also re-reads once.
  {
    const {api,env}=terminalSandbox();await api.refresh();
    env.closeImpl=async()=>({ok:false,code:"unavailable"});
    let result=await api.close();assert.equal(result.recoverable,true);assert.equal(api.getState().phase,"RECOVERY_PENDING");
    let reads=0;env.readImpl=async()=>{reads+=1;return reads===1?{ok:true,terminal:false}:{ok:true,terminal:true,rivalryRevision:42,terminalWitness:intentFor(S)};};
    env.closeImpl=async()=>({ok:false,code:"permission-denied"});
    result=await api.retry();
    assert.equal(result.ok,true);assert.equal(result.closedByRival,true);assert.equal(api.getState().phase,"CLOSED");assert.equal(reads,2);
  }
}

async function terminalRetryContracts(){
  const unavailable={initialized:true,attached:false,status:"unavailable",busy:false,rivalryId:null,binding:null};
  // No request (no marker rivalry, Setup not ready, rivalry unattached + unavailable): retried at most once per 30 s.
  {
    const {api,env,clock,wake}=terminalSandbox({rivalry:{...unavailable},markerRivalry:false});
    api.install();await flush();
    assert.equal(env.initializeCalls,1,"the first wake asks once; that attempt's own state-change event does not start another");
    for(let i=0;i<50;i+=1)wake();await flush();
    assert.equal(env.initializeCalls,1,"repeated wakes inside 30 s never re-run initialize (the r52 stall)");
    clock.now+=29_999;wake();await flush();assert.equal(env.initializeCalls,1,"still throttled just under 30 s");
    clock.now+=1;wake();await flush();assert.equal(env.initializeCalls,2,"one retry once 30 s have passed");
    for(let i=0;i<50;i+=1)wake();await flush();assert.equal(env.initializeCalls,2);

    // Single flight: a slow attempt is never overlapped, even after the throttle window; the flag is cleared in finally.
    let release;env.initializeImpl=()=>new Promise(resolve=>{release=resolve;});
    clock.now+=30_000;const before=env.initializeCalls;const returned=wake();await flush();
    assert.equal(returned,undefined,"the wake returns at once; nothing awaits the retry");
    assert.equal(env.initializeCalls,before+1);
    clock.now+=120_000;for(let i=0;i<10;i+=1)wake();await flush();assert.equal(env.initializeCalls,before+1,"no overlapping attempt while one is in flight");
    env.initializeImpl=null;release(unavailable);await flush();
    wake();await flush();assert.equal(env.initializeCalls,before+2,"after the attempt settles the next due retry runs");
    // A rejected attempt also clears the flag.
    env.initializeImpl=()=>Promise.reject(Object.assign(new Error("offline"),{code:"unavailable"}));
    clock.now+=30_000;wake();await flush();assert.equal(env.initializeCalls,before+3);
    clock.now+=30_000;wake();await flush();assert.equal(env.initializeCalls,before+4,"a failed attempt does not wedge the retry");
  }
  // First-ever wake on an uninitialized rivalry: the one-shot ask is unchanged and starts the 30 s clock.
  {
    const {api,env,clock,wake}=terminalSandbox({rivalry:{initialized:false,attached:false,status:"idle",rivalryId:null,binding:null},markerRivalry:false});
    env.initializeImpl=()=>{env.rivalry={...unavailable};wake();return Promise.resolve(env.rivalry);};
    api.install();await flush();
    assert.equal(env.initializeCalls,1,"one-shot first ask");
    for(let i=0;i<20;i+=1)wake();await flush();assert.equal(env.initializeCalls,1,"its unavailable result does not trigger an immediate retry");
    clock.now+=30_000;wake();await flush();assert.equal(env.initializeCalls,2);
  }
  // Never retried while the page is hidden, while rivalry is attached, while it is busy, or when not on a shared Showdown.
  {
    const {api,env,clock,wake,sandbox}=terminalSandbox({rivalry:{...unavailable},markerRivalry:false});
    sandbox.document.visibilityState="hidden";api.install();await flush();
    for(let i=0;i<5;i+=1){clock.now+=31_000;wake();}await flush();assert.equal(env.initializeCalls,0,"hidden page: no retry");
    sandbox.document.visibilityState="visible";env.rivalry={...unavailable,busy:true};clock.now+=31_000;wake();await flush();assert.equal(env.initializeCalls,0,"busy rivalry: no retry");
    env.rivalry={...unavailable,status:"ready"};clock.now+=31_000;wake();await flush();assert.equal(env.initializeCalls,0,"only the unavailable status is retried");
    sandbox.currentShowdown={sharedJourney:{mode:"local"}};env.rivalry={...unavailable};clock.now+=31_000;wake();await flush();assert.equal(env.initializeCalls,0,"local Showdown: no retry");
  }
  // With an exact request (normal play, attached rivalry) the retry never runs: other modules' publishes are untouched.
  {
    const {api,env,clock,wake}=terminalSandbox();
    api.install();await flush();
    for(let i=0;i<5;i+=1){clock.now+=31_000;wake();}await flush();
    assert.ok(env.readCalls>0,"normal refreshes ran");
    assert.equal(env.initializeCalls,env.readCalls,"with an exact request only the existing per-refresh context check calls initialize; the BH-7 retry adds nothing");
  }

  const source=read("js/productionSharedTerminalClose.js");
  assert.match(source,/const RIVALRY_RETRY_MS=30000;/);
  assert.match(source,/rivalryRetryAt=Date\.now\(\);rivalryRetryInFlight=true;\s*void Promise\.resolve\(\)/,"the clock starts before the fire-and-forget attempt");
  assert.match(source,/\.finally\(\(\)=>\{rivalryRetryInFlight=false;\}\)/,"single-flight flag reset in finally");
  assert.match(source,/s\.attached===true\|\|s\.status!=="unavailable"/,"only an unattached, unavailable rivalry is retried");
  assert.doesNotMatch(source,/rivalryState\.status==="unavailable"\)\)\)\{rivalryWakeRequested=true;/,"the reverted r52 every-wake retry must not return");
}

// ---------- Fix 3: Transfer Challenge fallback copy ----------
function transferCopyContracts(){
  const source=read("js/productionSharedTransferChallenge.js");
  assert.doesNotMatch(source,/next shared capability/,"stale capability copy removed");
  assert.doesNotMatch(source,/local-only season authority/,"stale authority jargon removed");
  assert.ok(source.includes('if(id==="continueFromTransfers"){pstcSetError("Season results are not open yet. Tap REFRESH, then try again.");return false;}'),"plain current wording; still fails closed (returns false, no local fallback)");
  assert.match(read("css/v10Transfer.css"),/#refreshSharedTransferChallenge::after \{ content: "REFRESH"; \}/,"the copy names the button the player actually sees");
}

(async()=>{
  await setupContracts();
  await terminalRaceContracts();
  await terminalRetryContracts();
  transferCopyContracts();
  console.log("PASS bh7 transient hardening contracts: Setup one-poll context hold, Terminal Close throttled retry + lost-race CLOSED, plain Transfer copy.");
})().catch(error=>{console.error(error);process.exit(1);});

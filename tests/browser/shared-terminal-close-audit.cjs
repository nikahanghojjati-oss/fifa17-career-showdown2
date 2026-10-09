"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");
const Terminal=require("../../js/sharedTerminalClose.js");

const rivalryId=`pair_${"a".repeat(64)}`;
const sessionId=`session_${"b".repeat(64)}`;
const profile1=`profile_${"1".repeat(24)}`,profile2=`profile_${"2".repeat(24)}`;
const save1=`save_${"3".repeat(24)}`,save2=`save_${"4".repeat(24)}`;
const device1=`device_${"5".repeat(32)}`,device2=`device_${"6".repeat(32)}`;
const account1="manager-one-account",account2="manager-two-account";
const finalProjection={schemaVersion:1,runtimeRevision:"1.9.1-r17",phase:"FINAL_SEASON_RECONCILED",rivalryId,leagueId:"premier-league",totalSeasons:3,acceptedSeasons:3,completedSeason:3,acceptedRevisionKey:"1:2:sha256:"+"1".repeat(64)+"|2:2:sha256:"+"2".repeat(64)+"|3:2:sha256:"+"3".repeat(64),fixedClubs:{playerOne:"Arsenal",playerTwo:"Chelsea"},managerTotals:{playerOne:22,playerTwo:19},winner:"playerOne",terminal:true,finalSeasonReconciled:true,nextSeason:null,extraSeasonAllowed:false,terminalCloseRequired:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false};

function clone(value){return JSON.parse(JSON.stringify(value));}
function showdown(saveId){return {identity:{saveId,managerProfileIds:{playerOne:profile1,playerTwo:profile2}},managers:{playerOne:"Daniel",playerTwo:"Nik"},sharedJourney:{mode:"shared",rivalryId}};}
function makeStore(){return {closed:false,witness:null,rivalryRevision:2,sessionRevision:5,closeCalls:[],readCalls:[],lostAckOnce:false};}
function makeProvider(store){return {
  async read(options){store.readCalls.push({rivalryId:options.rivalryId,deviceId:options.deviceId});if(!store.closed)return {ok:true,status:"open",rivalryId:options.rivalryId,rivalryState:"active",terminal:false};return {ok:true,status:"closed",rivalryId:options.rivalryId,rivalryState:"closed",rivalryRevision:store.rivalryRevision,terminal:true,terminalWitness:clone(store.witness),canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false};},
  async close(options){store.closeCalls.push({rivalryId:options.rivalryId,sessionId:options.sessionId,deviceId:options.deviceId,intent:clone(options.intent)});if(store.closed){if(!Terminal.sameWitness(store.witness,options.intent))return {ok:false,code:"TERMINAL_CLOSE_REPLAY_CONFLICT"};return {ok:true,status:"replayed",replayed:true,rivalryId:options.rivalryId,sessionId:options.sessionId,rivalryState:"closed",sessionState:"closed",rivalryRevision:store.rivalryRevision,sessionRevision:store.sessionRevision};}store.closed=true;store.witness=clone(options.intent);store.rivalryRevision+=1;store.sessionRevision+=1;if(store.lostAckOnce){store.lostAckOnce=false;return {ok:false,code:"unavailable",message:"synthetic lost acknowledgement"};}return {ok:true,status:"accepted",replayed:false,rivalryId:options.rivalryId,sessionId:options.sessionId,rivalryState:"closed",sessionState:"closed",rivalryRevision:store.rivalryRevision,sessionRevision:store.sessionRevision};}
};}
function poisonStorage(){return new Proxy({}, {get(){throw new Error("Terminal Close must not touch browser storage");}});}
function makeContext({role,store,provider=makeProvider(store)}){
  const accountId=role==="playerOne"?account1:account2,deviceId=role==="playerOne"?device1:device2,saveId=role==="playerOne"?save1:save2;
  const listeners=new Map();let remote={status:"ready",sessionId,rivalryId,accountId,deviceId,role:role==="playerOne"?"host":"peer",sessionState:"active",revision:5,expiresAtEpochMs:Date.now()+600000,pendingAction:null};
  const context={console,crypto:webcrypto,currentShowdown:showdown(saveId),localStorage:poisonStorage(),sessionStorage:poisonStorage(),CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},addEventListener(type,fn){listeners.set(type,fn);},dispatchEvent(){},setInterval(){return 1;},setTimeout(){return 1;},clearInterval(){},clearTimeout(){},CareerModeSharedTerminalClose:Terminal,CareerModeSparkTerminalClose:provider,
    CareerModeProductionSharedFinalReconciliation:{async refresh(){return finalProjection;},getState(){return finalProjection;}},
    CareerModeProductionFirebaseRuntime:{async ensureAccountServices(){return {ok:true,auth:{currentUser:{uid:accountId}},firestore:{},firestoreSdk:{}};}},
    CareerModeSparkConnectedAccount:{async initialize(){},getState(){return {connected:true,accountId};}},
    CareerModeSparkPrivatePairing:{async initialize(){},getState(){return {registered:true,deviceId};}},
    CareerModeSparkConnectedRivalry:{async initialize(){},getState(){return {attached:true,rivalryId,accountId,deviceId,binding:{managerRole:role}};}},
    CareerModeSparkRemoteJoining:{getState(){return remote;},subscribe(){return()=>{};},forgetSession(){remote={status:"idle",sessionId:null,rivalryId:null,accountId:null,deviceId:null,role:null,sessionState:null,revision:null,expiresAtEpochMs:null,pendingAction:null};return remote;}},
    loadRuntimeScript(_key,_path,ready){return Promise.resolve(ready());}
  };
  context.window=context;context.globalThis=context;vm.createContext(context);vm.runInContext(fs.readFileSync("js/productionSharedTerminalClose.js","utf8"),context,{filename:"productionSharedTerminalClose.js"});
  return {context,listeners,getRemote:()=>remote,setRemote:value=>{remote=value;}};
}

(async()=>{
  const shared=makeStore(),left=makeContext({role:"playerOne",store:shared}),right=makeContext({role:"playerTwo",store:shared});
  left.context.CareerModeProductionSharedTerminalClose.install();right.context.CareerModeProductionSharedTerminalClose.install();
  const lready=await left.context.CareerModeProductionSharedTerminalClose.refresh(),rready=await right.context.CareerModeProductionSharedTerminalClose.refresh();
  assert.equal(lready.phase,"READY");assert.equal(rready.phase,"READY");assert.equal(lready.sessionId,sessionId);assert.equal(rready.sessionId,sessionId);assert.equal(Terminal.sameWitness(lready.intent,rready.intent),true,"both manager contexts must derive one exact terminal witness");
  const accepted=await left.context.CareerModeProductionSharedTerminalClose.close();assert.equal(accepted.ok,true);assert.equal(accepted.status,"accepted");assert.equal(shared.closed,true);assert.equal(shared.closeCalls.length,1);assert.equal(shared.closeCalls[0].sessionId,sessionId);assert.equal(left.context.CareerModeProductionSharedTerminalClose.getState().phase,"CLOSED");assert.equal(left.getRemote().sessionId,null,"confirmed Terminal Close should forget only page-memory session capability");
  const peerClosed=await right.context.CareerModeProductionSharedTerminalClose.refresh();assert.equal(peerClosed.phase,"CLOSED");assert.equal(peerClosed.terminal,true);assert.equal(Terminal.sameWitness(peerClosed.terminalWitness,shared.witness),true);assert.equal(right.getRemote().sessionId,null,"peer terminal read should clear stale page-memory session state after provider authority confirms CLOSED");
  const duplicate=await right.context.CareerModeProductionSharedTerminalClose.close();assert.equal(duplicate.ok,false);assert.equal(duplicate.code,"TERMINAL_CLOSE_NOT_READY");

  const lost=makeStore();lost.lostAckOnce=true;const recovery=makeContext({role:"playerOne",store:lost});await recovery.context.CareerModeProductionSharedTerminalClose.refresh();const unresolved=await recovery.context.CareerModeProductionSharedTerminalClose.close();assert.equal(unresolved.ok,false);assert.equal(unresolved.recoverable,true);const pending=recovery.context.CareerModeProductionSharedTerminalClose.getState();assert.equal(pending.phase,"RECOVERY_PENDING");const exactWitness=clone(pending.intent);assert.equal(lost.closeCalls.length,1);assert.equal(Terminal.sameWitness(lost.closeCalls[0].intent,exactWitness),true);
  const recovered=await recovery.context.CareerModeProductionSharedTerminalClose.retry();assert.equal(recovered.ok,true);assert.equal(recovered.replayed,true);assert.equal(recovery.context.CareerModeProductionSharedTerminalClose.getState().phase,"CLOSED");assert.equal(lost.closeCalls.length,1,"lost-ack recovery must first read the exact closed witness instead of emitting a replacement mutation");

  const blockedStore=makeStore(),blocked=makeContext({role:"playerTwo",store:blockedStore});blocked.setRemote({...blocked.getRemote(),sessionState:"closed",expiresAtEpochMs:Date.now()-1});const blockedState=await blocked.context.CareerModeProductionSharedTerminalClose.refresh();assert.equal(blockedState.phase,"BLOCKED");assert.match(blockedState.message,/ACTIVE private session/);assert.equal(blockedStore.closeCalls.length,0);

  const raceStore=makeStore();let releaseRead;const raceProvider=makeProvider(raceStore);raceProvider.read=()=>new Promise(resolve=>{releaseRead=()=>resolve({ok:true,status:"open",rivalryId,rivalryState:"active",terminal:false});});const race=makeContext({role:"playerOne",store:raceStore,provider:raceProvider});const stale=race.context.CareerModeProductionSharedTerminalClose.refresh();await new Promise(resolve=>setImmediate(resolve));assert.equal(typeof releaseRead,"function");race.context.currentShowdown={...race.context.currentShowdown,sharedJourney:{mode:"shared",rivalryId:`pair_${"f".repeat(64)}`}};releaseRead();assert.equal(await stale,null);assert.equal(race.context.CareerModeProductionSharedTerminalClose.getState(),null,"a late read from the previous rivalry must never publish into a changed local Showdown context");

  // JOB-1038: exercise installed automatic scheduling with real promise boundaries and a controlled timer queue.
  function automaticContext(options){const c=makeContext(options),timers=[];c.context.setTimeout=fn=>{timers.push(fn);return timers.length;};return {...c,timers};}
  async function settle(c){for(let i=0;i<20;i++){while(c.timers.length)c.timers.shift()();await new Promise(resolve=>setImmediate(resolve));}}
  const autoStore=makeStore(),auto=automaticContext({role:"playerOne",store:autoStore});
  auto.context.CareerModeProductionSharedTerminalClose.install();await auto.context.CareerModeProductionSharedTerminalClose.refresh();await settle(auto);
  assert.equal(auto.context.CareerModeProductionSharedTerminalClose.getState().phase,"CLOSED","READY closes automatically");
  assert.equal(autoStore.closeCalls.length,1);await auto.context.CareerModeProductionSharedTerminalClose.refresh();await settle(auto);assert.equal(autoStore.closeCalls.length,1,"repeated wakes cannot close twice");

  const dualStore=makeStore(),dualLeft=automaticContext({role:"playerOne",store:dualStore}),dualRight=automaticContext({role:"playerTwo",store:dualStore});
  dualLeft.context.CareerModeProductionSharedTerminalClose.install();dualRight.context.CareerModeProductionSharedTerminalClose.install();
  await Promise.all([dualLeft.context.CareerModeProductionSharedTerminalClose.refresh(),dualRight.context.CareerModeProductionSharedTerminalClose.refresh()]);
  await Promise.all([settle(dualLeft),settle(dualRight)]);
  assert.equal(dualLeft.context.CareerModeProductionSharedTerminalClose.getState().phase,"CLOSED");assert.equal(dualRight.context.CareerModeProductionSharedTerminalClose.getState().phase,"CLOSED","both installed devices converge without a close tap");
  for(const id of [device1,device2])assert.ok(dualStore.closeCalls.filter(c=>c.deviceId===id).length<=1,"each device starts at most one automatic close");
  const reloaded=automaticContext({role:"playerOne",store:dualStore});reloaded.context.CareerModeProductionSharedTerminalClose.install();await reloaded.context.CareerModeProductionSharedTerminalClose.refresh();await settle(reloaded);
  assert.equal(reloaded.context.CareerModeProductionSharedTerminalClose.getState().phase,"CLOSED","reload reads the durable closed state");assert.ok(dualStore.closeCalls.length<=2,"reload creates no replacement mutation");

  const restoreStore=makeStore(),restore=automaticContext({role:"playerTwo",store:restoreStore}),active=restore.getRemote();
  restore.setRemote({...active,sessionState:"closed"});restore.context.CareerModeProductionSharedTerminalClose.install();
  await restore.context.CareerModeProductionSharedTerminalClose.refresh();await settle(restore);assert.equal(restoreStore.closeCalls.length,0);
  restore.setRemote(active);await restore.context.CareerModeProductionSharedTerminalClose.refresh();await settle(restore);
  assert.equal(restore.context.CareerModeProductionSharedTerminalClose.getState().phase,"CLOSED","BLOCKED closes as soon as exact private authority returns");assert.equal(restoreStore.closeCalls.length,1,"the peer keeps its existing close entitlement");

  const failStore=makeStore(),realProvider=makeProvider(failStore);let attempts=0;
  const failed=automaticContext({role:"playerOne",store:failStore,provider:{...realProvider,async close(options){attempts++;if(attempts===1)return {ok:false,code:"test-save-failed"};return realProvider.close(options);}}});
  failed.context.CareerModeProductionSharedTerminalClose.install();await failed.context.CareerModeProductionSharedTerminalClose.refresh();await settle(failed);
  assert.equal(failed.context.CareerModeProductionSharedTerminalClose.getState().automaticCloseFailed,true);
  await failed.context.CareerModeProductionSharedTerminalClose.refresh();await settle(failed);assert.equal(attempts,1,"a failed automatic attempt never loops on a poll");
  assert.equal((await failed.context.CareerModeProductionSharedTerminalClose.close()).ok,true,"manual CLOSE retries a failed automatic save");

  const lostAutoStore=makeStore();lostAutoStore.lostAckOnce=true;
  const lostAuto=automaticContext({role:"playerOne",store:lostAutoStore});lostAuto.context.CareerModeProductionSharedTerminalClose.install();
  await lostAuto.context.CareerModeProductionSharedTerminalClose.refresh();await settle(lostAuto);
  assert.equal(lostAuto.context.CareerModeProductionSharedTerminalClose.getState().phase,"RECOVERY_PENDING");
  assert.equal((await lostAuto.context.CareerModeProductionSharedTerminalClose.retry()).ok,true);assert.equal(lostAutoStore.closeCalls.length,1,"automatic lost-ack retry reads the same durable witness");

  const staleAutoStore=makeStore(),staleAuto=automaticContext({role:"playerOne",store:staleAutoStore});
  staleAuto.context.CareerModeProductionSharedTerminalClose.install();await staleAuto.context.CareerModeProductionSharedTerminalClose.refresh();
  staleAuto.context.currentShowdown=null;await settle(staleAuto);assert.equal(staleAutoStore.closeCalls.length,0,"a queued automatic close cannot outlive its Showdown");

  // JOB-1038: the automatic close waits (bounded) for converged Shared History, which the closed Final Winner keeps.
  function stepContext(options){const c=makeContext(options),timers=[];c.context.setTimeout=fn=>{timers.push(fn);return timers.length;};return {...c,timers};}
  async function step(c,rounds){for(let i=0;i<rounds;i++){const due=c.timers.splice(0);for(const fn of due)fn();await new Promise(resolve=>setImmediate(resolve));}}
  const waitStore=makeStore(),waiting=stepContext({role:"playerOne",store:waitStore});let history=null;
  waiting.context.CareerModeProductionSharedHistoryConvergence={getState:()=>history};
  waiting.context.CareerModeProductionSharedTerminalClose.install();await waiting.context.CareerModeProductionSharedTerminalClose.refresh();await step(waiting,10);
  assert.equal(waitStore.closeCalls.length,0,"the automatic close waits while Shared History has not converged");
  history={authoritative:true,phase:"HISTORY_CONVERGED",rivalryId};await step(waiting,10);
  assert.equal(waitStore.closeCalls.length,1,"converged history releases the automatic close");assert.equal(waiting.context.CareerModeProductionSharedTerminalClose.getState().phase,"CLOSED");
  const capStore=makeStore(),capped=stepContext({role:"playerOne",store:capStore});capped.context.CareerModeProductionSharedHistoryConvergence={getState:()=>null};
  capped.context.CareerModeProductionSharedTerminalClose.install();await capped.context.CareerModeProductionSharedTerminalClose.refresh();await step(capped,80);
  assert.equal(capStore.closeCalls.length,1,"history that never converges delays the close only for a bounded time");

  console.log("PASS JOB-1038 automatic close: exactly once, restored session, manual retry, lost acknowledgement, stale-context cancellation and a bounded wait for Shared History.");
  console.log("PASS r18 Terminal Close two-context runtime audit: both managers derive one exact witness, atomic close converges through terminal reads, lost acknowledgement recovers without replacement mutation, inactive-session close is blocked, stale cross-rivalry reads are discarded, and no browser storage authority is touched.");
})().catch(error=>{console.error(error);process.exitCode=1;});

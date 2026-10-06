"use strict";
// Hunt 1018 (JOB-1024): js/productionSharedJourneyReconnect.js must not keep or claim recovered authority it no longer has.
//   H1018-3  signing out (or losing the registered device or attached rivalry) after recovery publishes a held state with
//            recovered=false and activeAuthorization=false; the durable plan and history are kept, and signing back in recovers.
//            A fresh runtime whose identity is still pending stays quiet (no state, no report).
//   H1018-4  going offline while a refresh awaits its reads keeps OFFLINE_HOLD; the late successful read does not overwrite it.
//   H1018-5  a successful read delivered after the held session expired publishes FRESH_SESSION_REQUIRED, not ACTIVE_RECOVERED.
//   Control  offline before the read holds; expired before the read requires a fresh session.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const ROOT=path.resolve(__dirname,"../..");
const RIVALRY="pair_"+"1".repeat(64),DEVICE="device_"+"a".repeat(32),SESSION="session_"+"b".repeat(64);
function load(context,name){vm.runInContext(fs.readFileSync(path.join(ROOT,"js",name),"utf8"),context,{filename:name});}
function environment(){
  let now=1800000000000;
  const events=new Map(),reports=[];
  class Clock extends Date{static now(){return now;}}
  const authState={connected:true,accountId:"daniel"},deviceState={registered:true,deviceId:DEVICE},rivalryState={attached:true,rivalryId:RIVALRY,accountId:"daniel",deviceId:DEVICE,binding:{managerRole:"playerOne"}};
  const context=vm.createContext({console,Date:Clock,TextEncoder,Uint8Array,URL,navigator:{onLine:true},
    document:{visibilityState:"visible",getElementById:()=>null,addEventListener:()=>{}},
    setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0,
    addEventListener:(name,fn)=>{if(!events.has(name))events.set(name,[]);events.get(name).push(fn);},
    dispatchEvent:()=>{},CustomEvent:class{},reportApplicationError:(label,error)=>reports.push(String(error&&error.code||label)),
    CareerModeSparkConnectedAccount:{initialize:async()=>{},getState:()=>authState},
    CareerModeSparkPrivatePairing:{initialize:async()=>{},getState:()=>deviceState},
    CareerModeSparkConnectedRivalry:{initialize:async()=>{},getState:()=>rivalryState},
    CareerModeSharedHistoryConvergence:{verifyProjection:value=>value},
    currentShowdown:{sharedJourney:{mode:"shared",rivalryId:RIVALRY},managers:{playerOne:"Daniel",playerTwo:"Nik"}}
  });
  load(context,"sharedMultiSeasonProgression.js");load(context,"sharedJourneyReconnect.js");
  const setup={rivalryId:RIVALRY,revision:6,phase:"SHOWDOWN_CONFIRMED",totalSeasons:10,leagueId:"premier_league",clubs:{playerOne:"Arsenal",playerTwo:"Chelsea"}};
  const progression=context.CareerModeSharedMultiSeasonProgression.createProtocol().derive({rivalryId:RIVALRY,setup});
  const control={setupRefresh:async()=>true,progressionRefresh:async()=>true,remote:null};
  context.CareerModeProductionSharedShowdownSetup={refresh:()=>control.setupRefresh(),getState:()=>({ready:true,rivalryId:RIVALRY,sessionId:SESSION,setup})};
  context.CareerModeProductionSharedMultiSeasonProgression={refresh:()=>control.progressionRefresh(),getState:()=>({authoritative:true,rivalryId:RIVALRY,state:progression})};
  context.CareerModeSparkRemoteJoining={getState:()=>control.remote,subscribe:()=>()=>{}};
  load(context,"productionSharedJourneyReconnect.js");
  const remote={sessionId:SESSION,rivalryId:RIVALRY,accountId:"daniel",deviceId:DEVICE,sessionState:"active",pendingAction:null,expiresAtEpochMs:now+60000};
  return {context,events,reports,authState,deviceState,rivalryState,control,remote,now:()=>now,advance:ms=>{now+=ms;},reconnect:context.CareerModeProductionSharedJourneyReconnect};
}
async function recovered(e){
  await e.reconnect.refresh();assert.equal(e.reconnect.getState().phase,"FRESH_SESSION_REQUIRED");
  e.control.remote=e.remote;await e.reconnect.refresh();assert.equal(e.reconnect.isRecovered(),true);
  assert.equal(e.reconnect.getState().phase,"ACTIVE_RECOVERED");
}
function assertHeld(e,label){
  const state=e.reconnect.getState();
  assert.ok(state,label+": a held state is published");
  assert.equal(e.reconnect.isRecovered(),false,label);
  assert.equal(state.recovered,false,label);assert.equal(state.activeAuthorization,false,label);
  return state;
}
const cases=[];
function test(name,fn){cases.push([name,fn]);}

test("H1018-3 signing out after recovery drops recovered authority but keeps the durable plan and history",async()=>{
  const e=environment();await recovered(e);
  const before=e.reconnect.getState();
  e.authState.connected=false;e.authState.accountId=null;
  await e.reconnect.refresh();
  const held=assertHeld(e,"signed out");
  assert.equal(held.planKey,before.planKey);assert.equal(held.durableKey,before.durableKey);assert.equal(held.totalSeasons,10);assert.equal(held.resumable,true);
  await e.reconnect.refresh();assertHeld(e,"signed out, second refresh");
  assert.deepEqual(e.reports,[],"authority loss stays quiet");
  e.authState.connected=true;e.authState.accountId="daniel";
  await e.reconnect.refresh();
  assert.equal(e.reconnect.isRecovered(),true,"signing back in with the same account recovers again");
});
test("H1018-3 losing the registered device or the attached rivalry after recovery drops authority too",async()=>{
  const d=environment();await recovered(d);
  d.deviceState.registered=false;await d.reconnect.refresh();assertHeld(d,"device lost");
  const r=environment();await recovered(r);
  r.rivalryState.attached=false;await r.reconnect.refresh();assertHeld(r,"rivalry lost");
});
test("H1018-3 control: identity still pending on a fresh runtime stays quiet",async()=>{
  const e=environment();e.authState.connected=false;e.authState.accountId=null;e.control.remote=e.remote;
  assert.equal(await e.reconnect.refresh(),null);
  assert.equal(e.reconnect.getState(),null);assert.deepEqual(e.reports,[]);
});
test("H1018-3 signing out while a refresh awaits its reads does not publish recovered authority",async()=>{
  const e=environment();await recovered(e);
  e.control.progressionRefresh=async()=>{e.authState.connected=false;e.authState.accountId=null;return true;};
  await e.reconnect.refresh();assertHeld(e,"signed out during read");
});
test("H1018-4 going offline during a refresh keeps OFFLINE_HOLD after the late successful read",async()=>{
  const e=environment();await recovered(e);e.reconnect.install();await e.reconnect.refresh();
  let release,entered;
  const waiting=new Promise(resolve=>{entered=resolve;});
  e.control.setupRefresh=()=>{entered();return new Promise(resolve=>{release=resolve;});};
  const refresh=e.reconnect.refresh();await waiting;
  e.context.navigator.onLine=false;for(const fn of e.events.get("offline")||[])fn();
  assert.equal(e.reconnect.getState().phase,"OFFLINE_HOLD");
  release(true);await refresh;
  const state=assertHeld(e,"offline during read");
  assert.equal(state.phase,"OFFLINE_HOLD");assert.equal(state.networkOnline,false);
});
test("H1018-5 a successful read delivered after expiry requires a fresh session",async()=>{
  const e=environment();await recovered(e);
  e.control.progressionRefresh=async()=>{e.advance(60001);return true;};
  await e.reconnect.refresh();
  const state=assertHeld(e,"expired during read");
  assert.equal(state.phase,"FRESH_SESSION_REQUIRED");
});
test("Control offline before the read holds; expired before the read requires a fresh session",async()=>{
  const e=environment();await recovered(e);
  e.context.navigator.onLine=false;await e.reconnect.refresh();
  assert.equal(e.reconnect.getState().phase,"OFFLINE_HOLD");
  e.context.navigator.onLine=true;await e.reconnect.refresh();
  assert.equal(e.reconnect.isRecovered(),true,"back online the same exact session recovers");
  e.advance(60001);await e.reconnect.refresh();
  assert.equal(e.reconnect.getState().phase,"FRESH_SESSION_REQUIRED");assert.equal(e.reconnect.isRecovered(),false);
});

(async()=>{
  for(const [name,fn] of cases){await fn();console.log("ok "+name);}
  console.log("PASS Hunt 1018 reconnect authority contracts.");
})().catch(error=>{console.error(error);process.exitCode=1;});

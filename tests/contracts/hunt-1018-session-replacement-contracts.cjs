"use strict";
// Hunt 1018 (JOB-1023): NEW SESSION CODE replacement races in js/sparkRemoteJoining.js.
//   H1018-1  a second HOST NEW SESSION (REPLACES CURRENT) tap while the first replacement is still resolving is refused, so
//            exactly one fresh OPEN session exists and it is the one held in page memory.
//   H1018-2  hosting a replacement while the old OPEN session's join watcher is armed cancels that timer and watches the new
//            session, so the other manager's join flips the host to ACTIVE by itself.
//   Control  a normal first host still picks up the join through its watcher.
// Real sparkPrivateSession / sparkStandardAuthPrivateSession run in a VM against a serialized in-memory transaction double.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");

const ROOT=path.resolve(__dirname,"../..");
const RIVALRY="pair_"+"1".repeat(64),DEVICE="device_"+"a".repeat(32);
function load(context,name){vm.runInContext(fs.readFileSync(path.join(ROOT,"js",name),"utf8"),context,{filename:name});}
function environment(){
  let now=1800000000000,counter=0;
  const timers=new Map(),docs=new Map();
  class Clock extends Date{static now(){return now;}}
  class Timestamp{constructor(ms){this.ms=ms;}toMillis(){return this.ms;}static fromMillis(ms){return new Timestamp(ms);}}
  let serial=Promise.resolve();
  const sdk={Timestamp,doc:(_db,...p)=>p.join("/"),runTransaction:(_db,fn)=>{
    const run=serial.then(async()=>{const writes=[];const result=await fn({get:async ref=>({exists:()=>docs.has(ref),data:()=>docs.get(ref)}),set:(ref,value)=>writes.push([ref,value])});for(const [ref,value] of writes)docs.set(ref,value);return result;});
    serial=run.catch(()=>{});return run;
  }};
  const envelope=(type,id,data)=>({schemaVersion:1,objectType:type,objectId:id,revision:0,lifecycleState:"live",contentHash:"sha256:"+"0".repeat(64),data,tombstone:null});
  for(const uid of ["daniel","nik"]){docs.set("accounts/"+uid,envelope("account",uid,{status:"active"}));docs.set("accounts/"+uid+"/devices/"+DEVICE,envelope("device",DEVICE,{deviceId:DEVICE,state:"active"}));}
  docs.set("rivalries/"+RIVALRY,envelope("rivalry",RIVALRY,{connectionState:"active",authorizedAccountIds:["daniel","nik"],managerSlots:["daniel","nik"].map((accountId,i)=>({accountId,slotId:i?"playerTwo":"playerOne",entitlementState:"active"}))}));
  const services={ok:true,auth:{currentUser:{uid:"daniel"}},firestore:{},firestoreSdk:sdk};
  const context=vm.createContext({console,Date:Clock,TextEncoder,Uint8Array,URL,crypto:webcrypto,navigator:{onLine:true},
    document:{visibilityState:"visible",getElementById:()=>null,addEventListener:()=>{}},
    setTimeout:fn=>{const id=++counter;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id),setInterval:()=>0,
    addEventListener:()=>{},dispatchEvent:()=>{},CustomEvent:class{},reportApplicationError:()=>{},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>services},
    CareerModeSparkConnectedAccount:{initialize:async()=>{},getState:()=>({connected:true,accountId:"daniel"})},
    CareerModeSparkPrivatePairing:{initialize:async()=>{},getState:()=>({registered:true,deviceId:DEVICE})},
    CareerModeSparkConnectedRivalry:{initialize:async()=>{},getState:()=>({attached:true,rivalryId:RIVALRY,accountId:"daniel",deviceId:DEVICE,binding:{managerRole:"playerOne"}})}
  });
  load(context,"sparkPrivateSession.js");load(context,"sparkStandardAuthPrivateSession.js");load(context,"sparkRemoteJoining.js");
  const protocol=context.CareerModeSparkStandardAuthPrivateSession;
  const nikJoin=id=>protocol.joinSession({firestore:services.firestore,firebaseSdk:sdk,user:{uid:"nik"},deviceId:DEVICE,rivalryId:RIVALRY,sessionId:id,nowEpochMs:now,cryptoImpl:webcrypto});
  const openSessions=()=>[...docs].filter(([ref,value])=>ref.includes("/sessions/")&&value.data.state==="open").map(([ref])=>ref.split("/").pop());
  const fireTimers=async()=>{const pending=[...timers];timers.clear();for(const [,fn] of pending)await fn();};
  return {timers,nikJoin,openSessions,fireTimers,remote:context.CareerModeSparkRemoteJoining};
}
const cases=[];
function test(name,fn){cases.push([name,fn]);}

test("H1018-1 a second replacement HOST tap is refused; one fresh OPEN session, and it is the held one",async()=>{
  const e=environment();
  const hosted=await e.remote.hostSession();assert.equal(hosted.ok,true);
  assert.equal((await e.nikJoin(hosted.sessionId)).ok,true);
  assert.equal((await e.remote.refreshSession()).state,"active");
  const first=e.remote.hostSession({replaceCurrent:true});
  const second=e.remote.hostSession({replaceCurrent:true});
  const [a,b]=await Promise.all([first,second]);
  assert.equal(a.ok,true);
  assert.equal(b.ok,false);assert.equal(b.code,"REMOTE_JOINING_BUSY");
  assert.deepEqual(e.openSessions(),[a.sessionId]);
  const state=e.remote.getState();
  assert.equal(state.sessionId,a.sessionId);assert.equal(state.sessionState,"open");assert.equal(state.role,"host");assert.equal(state.busy,false);
});
test("H1018-1 a replacement JOIN tap is refused while a replacement HOST is in flight",async()=>{
  const e=environment();
  const hosted=await e.remote.hostSession();assert.equal(hosted.ok,true);
  assert.equal((await e.nikJoin(hosted.sessionId)).ok,true);
  assert.equal((await e.remote.refreshSession()).state,"active");
  const first=e.remote.hostSession({replaceCurrent:true});
  const joined=await e.remote.joinSession("session_"+"c".repeat(64),{replaceCurrent:true});
  assert.equal(joined.ok,false);assert.equal(joined.code,"REMOTE_JOINING_BUSY");
  const a=await first;assert.equal(a.ok,true);assert.deepEqual(e.openSessions(),[a.sessionId]);
  const again=await e.remote.hostSession({replaceCurrent:true});
  assert.equal(again.ok,true,"the lock is released once the first replacement finishes");
});
test("H1018-2 replacing an OPEN hosted session moves the join watcher to the new session",async()=>{
  const e=environment();
  const old=await e.remote.hostSession();assert.equal(old.ok,true);assert.equal(e.timers.size,1);
  const fresh=await e.remote.hostSession({replaceCurrent:true});assert.equal(fresh.ok,true);assert.notEqual(fresh.sessionId,old.sessionId);
  assert.equal(e.timers.size,1,"the old session's watcher timer is cancelled");
  assert.equal((await e.nikJoin(fresh.sessionId)).ok,true);
  await e.fireTimers();
  const state=e.remote.getState();
  assert.equal(state.sessionId,fresh.sessionId);assert.equal(state.sessionState,"active");
});
test("Control a normal first host picks up the join through its watcher",async()=>{
  const e=environment();
  const hosted=await e.remote.hostSession();assert.equal(hosted.ok,true);
  await e.fireTimers();assert.equal(e.remote.getState().sessionState,"open");assert.equal(e.timers.size,1,"the watcher re-arms while still OPEN");
  assert.equal((await e.nikJoin(hosted.sessionId)).ok,true);
  await e.fireTimers();
  assert.equal(e.remote.getState().sessionState,"active");assert.equal(e.timers.size,0);
});

(async()=>{
  for(const [name,fn] of cases){await fn();console.log("ok "+name);}
  console.log("PASS Hunt 1018 session replacement contracts.");
})().catch(error=>{console.error(error);process.exitCode=1;});

"use strict";
// JOB-1 F2: exercise the real Remote Joining controller with delayed browser timers and lifecycle events.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const {test}=require("node:test");
const {webcrypto}=require("node:crypto");
const source=fs.readFileSync(require.resolve("../../js/sparkRemoteJoining.js"),"utf8");
const LIMIT=10*60*1000,SESSION="session_"+"a".repeat(64),RIVALRY="pair_"+"b".repeat(64),DEVICE="device_"+"c".repeat(32);
async function settle(){for(let i=0;i<100;i++)await Promise.resolve();}
function harness(host=false){
  let now=2_000_000,id=0,offer=null,sessionState="open",readBarrier=null,publishFails=false;
  const timers=new Map(),events={window:{},document:{}},calls={offers:0,reads:0,joins:0,hosts:0,writes:0};
  const on=(target,type,fn)=>{(events[target][type]??=[]).push(fn);};
  class Element{
    constructor(tag){this.tag=tag;this.children=[];this.className="";this.textContent="";this.listeners={};this.classList={add(){},remove(){}};}
    append(...nodes){this.children.push(...nodes);} appendChild(node){this.append(node);return node;}
    replaceChildren(){this.children=[];} setAttribute(){} focus(){}
    addEventListener(type,fn){this.listeners[type]=fn;}
    querySelector(selector){return this.all().find(n=>selector==="button"?n.tag==="button":n.className.split(" ").includes(selector.slice(1)))||null;}
    all(){return this.children.flatMap(n=>[n,...n.all()]);}
    get text(){return [this.textContent,...this.children.map(n=>n.text)].join(" ");}
  }
  const body=new Element("body"),document={visibilityState:"visible",body,createElement:tag=>new Element(tag),getElementById:id=>body.all().find(n=>n.id===id)||null,querySelector:()=>null,addEventListener:(type,fn)=>on("document",type,fn)};
  const uid=host?"daniel":"nik",expiresAt=now+4*60*60*1000;
  const result=state=>({ok:true,sessionId:SESSION,state,revision:state==="open"?0:1,expiresAtEpochMs:expiresAt});
  const sdk={doc:(_db,...parts)=>parts.join("/"),Timestamp:{fromMillis:ms=>({toMillis:()=>ms})},serverTimestamp:()=>({}),runTransaction:async(_db,fn)=>fn({get:async()=>{calls.offers++;return {exists:()=>!!offer,data:()=>offer};},set:(_ref,value)=>{calls.writes++;if(publishFails)throw Object.assign(new Error("offline"),{code:"unavailable"});offer=value;}})};
  const s={console,URL,TextEncoder,crypto:webcrypto,Promise,Date:class extends Date{static now(){return now;}},document,navigator:{},
    setTimeout:(fn,ms)=>{timers.set(++id,{fn,ms});return id;},clearTimeout:key=>timers.delete(key),addEventListener:(type,fn)=>on("window",type,fn),
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid}},firestore:{},firestoreSdk:sdk})},
    CareerModeSparkConnectedAccount:{initialize:async()=>{},getState:()=>({connected:true,accountId:uid})},
    CareerModeSparkPrivatePairing:{initialize:async()=>{},getState:()=>({registered:true,deviceId:DEVICE})},
    CareerModeSparkConnectedRivalry:{initialize:async()=>{},getState:()=>({attached:true,rivalryId:RIVALRY,accountId:uid,deviceId:DEVICE})},
    CareerModeOnlinePlayerIdentity:{getState:()=>({managerId:uid})},
    CareerModePersistentNikDanielPair:{getPartnerState:()=>({status:"ready",accountId:uid,record:{active:true}})},
    CareerModeSparkPrivateSession:{},CareerModeSparkStandardAuthPrivateSession:{generateSessionId:()=>SESSION,normalizeSessionId:v=>v,
      openSession:async()=>{calls.hosts++;return result("open");},readSession:async()=>{calls.reads++;if(readBarrier){const barrier=readBarrier;readBarrier=null;await barrier;}return result(sessionState);},joinSession:async()=>{calls.joins++;return result("active");}}};
  s.globalThis=s;vm.createContext(s);vm.runInContext(source,s);
  return {api:s.CareerModeSparkRemoteJoining,calls,timers,document,body,
    failPublish:value=>{publishFails=value;},
    blockNextRead(){let release;readBarrier=new Promise(resolve=>{release=resolve;});return release;},
    elapse:ms=>{now+=ms;},offer:()=>{offer={schemaVersion:1,sessionId:SESSION,hostAccountId:"daniel",expiresAt:{toMillis:()=>expiresAt}};},joined:()=>{sessionState="active";},
    async tick(){const entry=timers.entries().next().value;assert.ok(entry,"a bounded wait is armed");timers.delete(entry[0]);await entry[1].fn();await settle();},
    async fire(type){for(const fn of events[type==="visibilitychange"?"document":"window"][type]||[])fn();await settle();}};
}
for(const host of [false,true])for(const event of ["visibilitychange","online"]){
  test(`${host?"host":"joiner"} resumes after the late ten-minute callback on ${event}`,async()=>{
    const h=harness(host);await h.api.autoConnect();h.document.visibilityState="hidden";
    h.elapse(LIMIT+1);await h.tick();assert.equal(h.timers.size,0,"the background wait stays bounded");
    if(host)h.joined();else h.offer();
    h.document.visibilityState="visible";await h.fire(event);
    assert.equal(h.api.getState().sessionState,"active","the lifecycle event immediately checks and connects");
    assert.equal(h.calls.joins,host?0:1);assert.equal(h.calls.hosts,host?1:0,"recovery keeps the original host session");
  });
}
for(const host of [false,true]){
  test(`${host?"host":"joiner"} offers a working retry after visible timeout and renews the bound`,async()=>{
    const h=harness(host);await h.api.autoConnect();h.api.openPanel();h.elapse(LIMIT+1);await h.tick();
    assert.equal(h.timers.size,0);assert.doesNotMatch(h.body.text,/continues by itself/);
    const retry=h.body.all().find(n=>n.tag==="button"&&n.textContent==="TRY AGAIN");assert.ok(retry,"the waiting card has a plain retry action");
    retry.listeners.click();await settle();assert.equal(h.timers.size,1,"retry starts one fresh bounded wait");
    h.elapse(LIMIT+1);await h.tick();assert.equal(h.timers.size,0,"the renewed wait also stops");
    if(host)h.joined();else h.offer();
    h.body.all().find(n=>n.textContent==="TRY AGAIN").listeners.click();await settle();
    assert.equal(h.api.getState().sessionState,"active","retry checks immediately");
  });
  test(`${host?"host":"joiner"} ignores hidden online and repeated wake events do not duplicate waits`,async()=>{
    const h=harness(host);await h.api.autoConnect();h.document.visibilityState="hidden";h.elapse(LIMIT+1);await h.tick();
    const before=JSON.stringify(h.calls);await h.fire("online");assert.equal(JSON.stringify(h.calls),before);assert.equal(h.timers.size,0);
    h.document.visibilityState="visible";await Promise.all([h.fire("online"),h.fire("visibilitychange")]);
    assert.equal(h.timers.size,1,"one fresh timer after lifecycle events");
    if(host)h.joined();else h.offer();await h.tick();assert.equal(h.api.getState().sessionState,"active");
  });
}
test("autoConnect re-entry re-arms an already published OPEN host session",async()=>{
  const h=harness(true);await h.api.autoConnect();h.elapse(LIMIT+1);await h.tick();
  await h.api.autoConnect();assert.equal(h.timers.size,1);assert.equal(h.calls.hosts,1);assert.equal(h.calls.writes,1);
  h.joined();await h.tick();assert.equal(h.api.getState().sessionState,"active");
});

for(const host of [false,true])test(`${host?"host":"joiner"} retires a read still in flight when the page wakes`,async()=>{
  const h=harness(host);await h.api.autoConnect();if(!host)h.offer();
  const release=h.blockNextRead(),oldTick=h.tick();await settle();assert.equal(h.calls.reads,1);
  if(host)h.joined();await h.fire("online");assert.equal(h.api.getState().sessionState,"active");
  release();await oldTick;assert.equal(h.calls.joins,host?0:1,"the retired check cannot join again");
  assert.equal(h.timers.size,0,"the retired check cannot restart its old window");
});

test("reopening a host whose offer publish timed out renews the waiting card and both bounded waits",async()=>{
  const h=harness(true);h.failPublish(true);await h.api.autoConnect();h.elapse(LIMIT+1);
  await h.tick();await h.tick();assert.equal(h.api.getState().waitRetry,true);assert.equal(h.timers.size,0);
  assert.equal((await h.api.autoConnect()).kind,"held-publishing");
  assert.equal(h.api.getState().waitRetry,false,"a renewed host watch restores the automatic waiting copy");
  assert.equal(h.timers.size,2,"one join watch plus the existing offer publish retry");assert.equal(h.calls.hosts,1);
  h.failPublish(false);await h.tick();await h.tick();h.joined();await h.tick();
  assert.equal(h.api.getState().sessionState,"active");
});

"use strict";
// JOB-1 F1: transient reads must never fork the private two-player session.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const {test}=require("node:test");
const {webcrypto}=require("node:crypto");
const source=fs.readFileSync(require.resolve("../../js/sparkRemoteJoining.js"),"utf8");
const SESSION="session_"+"a".repeat(64),RIVALRY="pair_"+"b".repeat(64),DEVICE="device_"+"c".repeat(32);
async function settle(){for(let i=0;i<100;i++)await Promise.resolve();}
function harness({offerFailure=null,sessionFailure=null,missing=false,publishRace=null,commitRace=null}={}){
  let now=2_000_000,id=0,offer=null,sessionState="active"; // Nik has already joined this shared server session.
  const NEW_SESSION="session_"+"d".repeat(64);
  const unavailable=()=>Object.assign(new Error("recovering connection"),{code:"unavailable"});
  const fail=value=>{if(value==="reject")throw unavailable();return value;};
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
  const uid="daniel",expiresAt=now+4*60*60*1000;
  if(!missing)offer={schemaVersion:1,sessionId:SESSION,hostAccountId:"daniel",expiresAt:{toMillis:()=>expiresAt}};
  const result=(state,sessionId=SESSION)=>({ok:true,sessionId,state,revision:state==="open"?0:1,expiresAtEpochMs:expiresAt});
  const sdk={doc:(_db,...parts)=>parts.join("/"),Timestamp:{fromMillis:ms=>({toMillis:()=>ms})},serverTimestamp:()=>({}),runTransaction:async(_db,fn)=>fn({get:async()=>{calls.offers++;if(commitRace&&calls.offers===3)offer=commitRace();if(offerFailure){const value=offerFailure;offerFailure=null;return fail(value); }return {exists:()=>!!offer,data:()=>offer};},set:(_ref,value)=>{calls.writes++;offer=value;}})};
  const s={console,URL,TextEncoder,crypto:webcrypto,Promise,Date:class extends Date{static now(){return now;}},document,navigator:{},
    setTimeout:(fn,ms)=>{timers.set(++id,{fn,ms,at:now+ms});return id;},clearTimeout:key=>timers.delete(key),addEventListener:(type,fn)=>on("window",type,fn),
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid}},firestore:{},firestoreSdk:sdk})},
    CareerModeSparkConnectedAccount:{initialize:async()=>{},getState:()=>({connected:true,accountId:uid})},
    CareerModeSparkPrivatePairing:{initialize:async()=>{},getState:()=>({registered:true,deviceId:DEVICE})},
    CareerModeSparkConnectedRivalry:{initialize:async()=>{},getState:()=>({attached:true,rivalryId:RIVALRY,accountId:uid,deviceId:DEVICE})},
    CareerModeOnlinePlayerIdentity:{getState:()=>({managerId:uid})},
    CareerModePersistentNikDanielPair:{getPartnerState:()=>({status:"ready",accountId:uid,record:{active:true}})},
    CareerModeSparkPrivateSession:{},CareerModeSparkStandardAuthPrivateSession:{generateSessionId:()=>NEW_SESSION,normalizeSessionId:v=>v,
      openSession:async()=>{calls.hosts++;if(publishRace)offer=publishRace();return result("open",NEW_SESSION);},readSession:async options=>{calls.reads++;if(sessionFailure&&options.sessionId===SESSION){const value=sessionFailure;sessionFailure=null;return fail(value);}if(options.sessionId!==NEW_SESSION&&typeof sessionState==="object")return sessionState;return result(options.sessionId===NEW_SESSION?"open":sessionState,options.sessionId);},joinSession:async()=>{calls.joins++;return result("active");}}};
  s.globalThis=s;vm.createContext(s);vm.runInContext(source,s);
  return {api:s.CareerModeSparkRemoteJoining,calls,timers,document,body,
    now:()=>now, pointer:()=>offer,
    failOffers:value=>{offerFailure=value;},failSession:value=>{sessionFailure=value;},
    setOffer:value=>{offer=value;},setSession:value=>{sessionState=value;},
    async tick(){const entry=[...timers.entries()].sort((a,b)=>a[1].at-b[1].at)[0];assert.ok(entry,"a bounded wait is armed");timers.delete(entry[0]);now=Math.max(now,entry[1].at);void entry[1].fn();await settle();},
    async fire(type){for(const fn of events[type==="visibilitychange"?"document":"window"][type]||[])fn();await settle();}};
}

async function connect(h){
  let done=false,out;
  const pending=h.api.autoConnect().then(value=>{done=true;out=value;});await settle();
  for(let i=0;i<3&&!done&&h.timers.size;i++)await h.tick();
  assert.ok(done,"connection finishes within its bounded read retries");await pending;return out;
}
function sameActive(h){
  assert.equal(h.calls.hosts,0,"Daniel opens no second session while Nik holds ACTIVE");
  assert.equal(h.calls.writes,0,"Daniel never writes the offer pointer");
  assert.equal(h.calls.joins,0,"the ACTIVE session needs no second join");assert.equal(h.pointer().sessionId,SESSION);
  assert.equal(h.api.getState().sessionState,"active");assert.equal(h.api.getState().sessionId,SESSION);
}
for(const field of ["offerFailure","sessionFailure"])test(`${field}: first unavailable read recovers onto Nik's ACTIVE session`,async()=>{
  const h=harness({[field]:"reject"});let done=false;
  const pending=h.api.autoConnect().then(()=>{done=true;});await settle();
  assert.equal(h.calls.hosts,0,"a failed read cannot open a replacement");assert.equal(h.calls.writes,0);
  assert.equal(h.api.getState().auto,"connecting","short backoff keeps CONNECTING");assert.equal(done,false);
  await h.tick();await pending;sameActive(h);
  assert.equal(h.calls.offers,field==="offerFailure"?2:1,"session retry keeps the exact offer already read");
  assert.equal(h.calls.reads,field==="sessionFailure"?2:1);
});
test("a positively missing offer still lets Daniel host and publish",async()=>{
  const h=harness({missing:true});assert.equal((await connect(h)).ok,true);
  assert.equal(h.calls.hosts,1);assert.equal(h.calls.writes,1);assert.equal(h.pointer().sessionId,h.api.getState().sessionId);
  assert.equal(h.api.getState().sessionState,"open");
});
for(const field of ["offerFailure","sessionFailure"])test(`${field}: unreadable result is retried, never treated as absence`,async()=>{
  const h=harness({[field]:field==="offerFailure"?{}:{ok:false,code:"unavailable"}});await connect(h);sameActive(h);
});
for(const field of ["offerFailure","sessionFailure"])test(`${field}: three failed reads stop and TRY AGAIN reruns connection`,async()=>{
  const h=harness({[field]:"reject"});h.api.openPanel();
  const started=h.now(),pending=h.api.autoConnect();await settle();
  for(let i=0;i<2;i++){(field==="offerFailure"?h.failOffers:h.failSession)("reject");await h.tick();}
  await pending;
  assert.equal(h.calls.hosts,0);assert.equal(h.calls.writes,0);assert.equal(h.timers.size,0);
  assert.equal(h.calls[field==="offerFailure"?"offers":"reads"],3);
  assert.ok(h.now()-started>=6000&&h.now()-started<=10000,"three reads use short bounded backoff");
  assert.equal(h.api.getState().auto,"waiting");assert.equal(h.api.getState().waitRetry,true);
  assert.doesNotMatch(h.body.text,/continues by itself/);
  const retry=h.body.all().find(n=>n.tag==="button"&&n.textContent==="TRY AGAIN");assert.ok(retry);
  retry.listeners.click();await settle();sameActive(h);
});
test("hidden backoff performs no reads or hosting, visible return reconnects",async()=>{
  const h=harness({offerFailure:"reject"}),pending=h.api.autoConnect();await settle();
  h.document.visibilityState="hidden";const before=JSON.stringify(h.calls);await h.tick();await pending;
  assert.equal(JSON.stringify(h.calls),before);assert.equal(h.timers.size,0);
  await h.fire("online");assert.equal(JSON.stringify(h.calls),before);
  h.document.visibilityState="visible";await Promise.all([h.fire("visibilitychange"),h.fire("online")]);sameActive(h);
});
for(const state of ["open","active"])for(const life of [30000,4*60*60*1000])test(`new host cannot overwrite a raced ${state} offer with ${life}ms left`,async()=>{
  const h=harness({missing:true,publishRace:()=>({schemaVersion:1,sessionId:SESSION,hostAccountId:"daniel",expiresAt:{toMillis:()=>h.now()+life}})});
  h.setSession(state);await connect(h);
  assert.equal(h.calls.hosts,1,"the other screen published while this session was opening");
  assert.equal(h.calls.writes,0,"compare-before-write protects the live pointer");assert.equal(h.pointer().sessionId,SESSION);
  // Exercise the existing delayed publisher as well as initial publication.
  await h.tick();await h.tick();assert.equal(h.calls.writes,0);
});
for(const state of ["closed","revoked","expired"])test(`positive ${state} read permits a replacement`,async()=>{
  const h=harness();h.setSession(state);await connect(h);assert.equal(h.calls.hosts,1);assert.equal(h.calls.writes,1);
});

test("a pointer that changes inside the final write transaction is preserved",async()=>{
  const h=harness({missing:true,commitRace:()=>({schemaVersion:1,sessionId:SESSION,hostAccountId:"daniel",expiresAt:{toMillis:()=>h.now()+4*60*60*1000}})});
  await connect(h);assert.equal(h.calls.hosts,1);assert.equal(h.calls.writes,0);assert.equal(h.pointer().sessionId,SESSION);
});
test("a session this account is not a member of is a positive answer, not an endless retry",async()=>{
  const h=harness();h.setSession({ok:false,code:"PRIVATE_SESSION_MEMBER_REQUIRED"});await connect(h);
  assert.equal(h.calls.hosts,1,"Daniel hosts a fresh session");assert.equal(h.calls.writes,1,"and publishes it");
  assert.equal(h.api.getState().waitRetry,false,"no TRY AGAIN dead end");
});

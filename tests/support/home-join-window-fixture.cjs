"use strict";
// JOB-2 F2/F3: actual START -> provider invite/note -> Nik's Home and canonical JOIN.
// Only Firestore, browser storage, clock and the downstream gameplay entry are fixtures.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");
const ROOT=require("node:path").resolve(__dirname,"../..");
const MINUTE=60000,OLD=`pair_1${"a".repeat(63)}`,INBOX="accounts/nik/partnerInbox/current";
const ts=ms=>({toMillis:()=>ms});
async function settle(){for(let i=0;i<50;i++)await new Promise(resolve=>setImmediate(resolve));}
class Element{
  constructor(id="",cls=""){this.id=id;this.cls=cls;this.children=[];this.dataset={};this.attrs={};this.style={};this.textContent="";this.disabled=false;this.classList={contains:()=>false,add(){},remove(){}};}
  append(...nodes){this.children.push(...nodes);} appendChild(node){this.append(node);return node;}
  replaceChildren(){this.children=[];} setAttribute(k,v){this.attrs[k]=v;} getAttribute(k){return this.attrs[k]??null;} removeAttribute(k){delete this.attrs[k];}
  addEventListener(){} before(){} focus(){} scrollIntoView(){}
  closest(selector){return selector.split(",").some(s=>s.trim()===`#${this.id}`)?this:null;}
  querySelector(selector){return this.children.find(n=>selector===`.${n.cls}`)||null;} querySelectorAll(){return[];}
}
function world(){
  let now=1_800_000_000_000,serial=0;
  const docs=new Map(),timers=new Map(),listeners=new Set(),reads=[],writes=[];
  const snap=ref=>({metadata:{fromCache:false},exists:()=>docs.has(ref.path),data:()=>docs.get(ref.path)});
  const deliver=path=>{for(const l of [...listeners])if(l.ref.path===path){reads.push(path);l.next(snap(l.ref));}};
  const sdk={doc:(_db,...parts)=>({path:parts.join("/")}),Timestamp:{fromMillis:ts},serverTimestamp:()=>ts(now),
    async runTransaction(_db,fn){const pending=new Map();const result=await fn({get:async ref=>{reads.push(ref.path);return snap(ref);},set:(ref,value)=>pending.set(ref.path,value)});for(const [path,value] of pending){docs.set(path,value);writes.push(path);deliver(path);}return result;},
    onSnapshot(ref,_options,next,error){const l={ref,next,error};listeners.add(l);setImmediate(()=>{if(listeners.has(l)){reads.push(ref.path);next(snap(ref));}});return()=>listeners.delete(l);}
  };
  for(const [id,role,other] of [["daniel","playerOne","nik"],["nik","playerTwo","daniel"]])docs.set(`accounts/${id}/partner/current`,{schemaVersion:1,partnerAccountId:other,myRole:role,pairedViaRivalryId:OLD,pairedAt:ts(now-1),active:true,updatedAt:ts(now-1)});
  function page(id){
    const role=id==="daniel"?"playerOne":"playerTwo",seed=id==="daniel"?"1":"2";
    const device={schemaVersion:1,installationId:`installation_${seed.repeat(32)}`,deviceId:`device_${seed.repeat(32)}`,createdAtEpochMs:now};
    const binding={managerRole:role,saveId:`save_${seed.repeat(24)}`,profileId:`profile_${seed.repeat(24)}`,displayLabel:id};
    const library={activeSaveId:binding.saveId,saves:[{saveId:binding.saveId,showdown:{totalRounds:3,status:"Created",sharedJourney:{mode:"shared",setupPending:true},managers:{playerOne:"Daniel",playerTwo:"Nik"},selectedLeague:null,clubs:{},rounds:[],identity:{managerProfileIds:{[role]:binding.profileId}}}}]};
    const events=new Map(),windowEvents=new Map(),byId=new Map(),tile=new Element("newShowdown");
    for(const cls of ["menuTileCode","menuTileLabel","menuTileMeta"])tile.append(new Element("",cls));byId.set(tile.id,tile);
    const on=(map,type,fn)=>{if(!map.has(type))map.set(type,[]);map.get(type).push(fn);};
    let screen="mainMenu",redeems=0,entered=0,fallbacks=0;
    const document={visibilityState:"visible",head:new Element(),body:new Element(),documentElement:new Element(),getElementById:id=>byId.get(id)||null,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>new Element(),addEventListener:(type,fn)=>on(events,type,fn)};
    const indexedDB={open(){const request={};setImmediate(()=>{request.result={objectStoreNames:{contains:()=>true},close(){},transaction:()=>({objectStore:()=>({get(){const r={};setImmediate(()=>{r.result={accountId:id,managerId:id};r.onsuccess?.();});return r;}})})};request.onsuccess?.();});return request;}};
    const s={console,Promise,TextEncoder,crypto:webcrypto,Date:class extends Date{static now(){return now;}},Element,MutationObserver:class{observe(){}disconnect(){}},document,indexedDB,navigator:{onLine:true},
      setTimeout:(fn,ms)=>{const key=++serial;timers.set(key,{fn,at:now+ms});return key;},clearTimeout:key=>timers.delete(key),
      CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},addEventListener:(type,fn)=>on(windowEvents,type,fn),dispatchEvent:event=>{for(const fn of windowEvents.get(event.type)||[])fn(event);return true;},getActiveScreenName:()=>screen,
      loadRuntimeScript:async(_key,path,ready)=>{assert.ok(ready(),`Unexpected dependency ${path}`);return ready();},reportApplicationError:(_message,error)=>{throw error;},
      CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:id}},firestore:{},firestoreSdk:sdk})},
      CareerModeSparkConnectedAccount:{initialize:async()=>({}),getState:()=>({connected:true,accountId:id})},
      CareerModeSaveLibraryRuntime:{isReady:()=>true,getLibrarySnapshot:()=>library,switchActiveSave:async()=>true},
      CareerModeCareerStartMarker:{readCurrentMarker:async()=>({status:"ready"})},
      CareerModeShowdownModes:{install(){},resolve:async()=>({mode:"real"}),getView:()=>({mode:"real"})},
      CareerModeSparkConnectedRivalry:{attachRivalry:async()=>({ok:true}),initialize:async()=>true},
      CareerModeProductionSharedJourneyEntry:{install(){},openPanel:async()=>{entered++;return true;}},
      CareerModeConnectPlayersScreenV10:{open:async()=>{fallbacks++;},close(){}}
    };
    vm.createContext(s);const load=file=>vm.runInContext(fs.readFileSync(`${ROOT}/js/${file}`,"utf8"),s,{filename:file});
    load("sparkPrivatePairing.js");const provider=s.CareerModeSparkPrivatePairing;
    s.CareerModeSparkPrivatePairing={...provider,initialize:async()=>({}),getState:()=>({registered:true,deviceId:device.deviceId}),localBindingOptions:()=>[binding],getOrCreateDeviceIdentity:async()=>device,redeemPairing:async options=>{redeems++;return provider.redeemPairing(options);}};
    load("persistentNikDanielPair.js");load("whichShowdownIsLive.js");load("onlinePlayerIdentity.js");
    const p={s,provider,device,binding,pair:s.CareerModePersistentNikDanielPair,identity:s.CareerModeOnlinePlayerIdentity,document,
      label:()=>tile.querySelector(".menuTileLabel").textContent,
      async init(){assert.equal((await provider.registerDevice({user:{uid:id},identity:device,firestore:{},firebaseSdk:sdk,cryptoImpl:webcrypto})).ok,true);assert.equal((await this.identity.initialize()).status,"ready");await settle();},
      async tap(){for(const fn of events.get("click")||[])fn({target:tile,preventDefault(){},stopImmediatePropagation(){}});/* Await the tile's existing single-flight operation, including provider hashing. */await this.identity.openStart();await settle();},
      async visibility(visible){document.visibilityState=visible?"visible":"hidden";for(const fn of events.get("visibilitychange")||[])fn();await settle();},
      async screen(value){screen=value;for(const fn of events.get("career-mode-screen-shown")||[])fn({detail:{screen:value}});await settle();},
      get redeems(){return redeems;},get entered(){return entered;},get fallbacks(){return fallbacks;}
    };return p;
  }
  return {page,docs,reads,writes,listeners,sdk,now:()=>now,jump:ms=>{now+=ms;},
    async advance(ms){const end=now+ms;for(;;){const due=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;timers.delete(due[0]);now=due[1].at;await due[1].fn();await settle();}now=end;await settle();},
    failListener(){for(const l of [...listeners])l.error(new Error("offline"));},
    async start(){const daniel=page("daniel");await daniel.init();const waiting=await daniel.pair.startPairing({managerRole:"playerOne"});assert.equal(waiting.connectionState,"pending-pair",waiting.message);daniel.document.visibilityState="hidden";await settle();return waiting.rivalryId;}
  };
}

module.exports={world,MINUTE,INBOX,settle};

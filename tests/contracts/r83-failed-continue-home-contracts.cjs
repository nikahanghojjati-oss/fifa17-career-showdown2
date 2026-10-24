"use strict";
// F1, docs/codex-reports-r83/965-JOB-1-continue-reload-2026-10-21.md.
// Real identity -> pair discovery -> continuation -> attachment transaction -> Home subscription.
// Only the attachment's device read fails; pair state is never assigned by the test.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");
const ROOT=path.resolve(__dirname,"../..");
const RIVALRY=`pair_3${"a".repeat(63)}`,DEVICE=`device_${"1".repeat(32)}`;
const managers=[
  {id:"daniel",role:"playerOne",saveId:`save_${"2".repeat(24)}`,profileId:`profile_${"3".repeat(24)}`},
  {id:"nik",role:"playerTwo",saveId:`save_${"4".repeat(24)}`,profileId:`profile_${"5".repeat(24)}`}
];
const envelope=(objectType,objectId,data)=>({schemaVersion:1,objectType,objectId,revision:1,parentRevision:0,lifecycleState:"live",contentHash:`sha256:${"9".repeat(64)}`,data});
async function settle(){for(let i=0;i<60;i+=1)await new Promise(resolve=>setImmediate(resolve));}
class TileEl{
  constructor(id="",cls=""){this.id=id;this.cls=cls;this.parent=null;this.children=[];this.attrs={};this.dataset={};this.style={};this.textContent="";this.disabled=false;this.hidden=false;
    this.classList={contains:()=>false,add(){},remove(){},toggle(){}};}
  append(...nodes){for(const node of nodes){if(node&&typeof node==="object"){node.parent=this;this.children.push(node);}}}
  appendChild(node){this.append(node);return node;}
  insertBefore(node){this.append(node);return node;}
  before(){} remove(){} replaceChildren(){this.children=[];} addEventListener(){} focus(){} scrollIntoView(){}
  setAttribute(key,value){this.attrs[key]=String(value);}
  getAttribute(key){return Object.prototype.hasOwnProperty.call(this.attrs,key)?this.attrs[key]:null;}
  hasAttribute(key){return Object.prototype.hasOwnProperty.call(this.attrs,key);}
  removeAttribute(key){delete this.attrs[key];}
  closest(selector){const ids=selector.split(",").map(part=>part.trim());for(let node=this;node;node=node.parent)if(node.id&&ids.includes(`#${node.id}`))return node;return null;}
  querySelector(selector){const cls=selector.startsWith(".")?selector.slice(1):null;const walk=node=>{for(const child of node.children){if(cls&&child.cls===cls)return child;const found=walk(child);if(found)return found;}return null;};return cls?walk(this):null;}
  querySelectorAll(){return[];}
}

function harness(manager){
  const accountId=`uid_${manager.id}`,binding={saveId:manager.saveId,profileId:manager.profileId,managerRole:manager.role};
  const docs=new Map([
    [`accounts/${accountId}/pairLinks/current`,envelope("pairLink","current",{rivalryId:RIVALRY,managerRole:manager.role,managerId:manager.id})],
    [`rivalries/${RIVALRY}`,envelope("rivalry",RIVALRY,{connectionState:"active",authorizedAccountIds:managers.map(m=>`uid_${m.id}`),managerSlots:managers.map(m=>({slotId:m.role,accountId:`uid_${m.id}`,saveId:m.saveId,profileId:m.profileId,entitlementState:"active"}))})],
    [`accounts/${accountId}/devices/${DEVICE}`,envelope("device",DEVICE,{deviceId:DEVICE,state:"active"})]
  ]);
  const control={failAttach:true},calls={pairReads:0,attachReads:0,writes:0,entered:0,fallbacks:0},byId=new Map(),events=new Map();
  const tile=new TileEl("newShowdown"),career=new TileEl("continueCareer"),chip=new TileEl("seasonIndicator");
  for(const node of [tile,career])for(const cls of ["menuTileCode","menuTileLabel","menuTileMeta"])node.append(new TileEl("",cls));
  for(const node of [tile,career,chip])byId.set(node.id,node);
  const document={visibilityState:"visible",head:new TileEl(),body:new TileEl(),documentElement:new TileEl(),
    getElementById:id=>byId.get(id)||null,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>new TileEl(),
    addEventListener(type,fn){if(!events.has(type))events.set(type,[]);events.get(type).push(fn);}};
  // Browser identity storage only; the attachment pointer is outside this presentation contract.
  const indexedDB={open:()=>{const request={};setImmediate(()=>{request.result={objectStoreNames:{contains:()=>true},close(){},transaction:()=>({objectStore:()=>({get:()=>{const get={};setImmediate(()=>{get.result={accountId,managerId:manager.id};get.onsuccess?.();});return get;}})})};request.onsuccess?.();});return request;}};
  const firestoreSdk={doc:(_db,...parts)=>({path:parts.join("/")}),Timestamp:{fromMillis:ms=>({toMillis:()=>ms})},
    getDoc:async ref=>({exists:()=>docs.has(ref.path),data:()=>docs.get(ref.path)}),
    runTransaction:async(_db,fn)=>fn({
      get:async ref=>{
        if(ref.path.endsWith("/pairLinks/current"))calls.pairReads+=1;
        if(ref.path.endsWith(`/devices/${DEVICE}`)){
          calls.attachReads+=1;
          if(control.failAttach)throw Object.assign(new Error("The connection dropped before your Showdown could be checked. Check your internet, then try again."),{code:"unavailable"});
        }
        return {exists:()=>docs.has(ref.path),data:()=>docs.get(ref.path)};
      },set(){calls.writes+=1;throw new Error("Unexpected provider write");}
    })};
  const library={activeSaveId:manager.saveId,saves:[{saveId:manager.saveId,showdown:{identity:{managerProfileIds:{[manager.role]:manager.profileId}}}}]};
  const sandbox={console,Promise,Date,TextEncoder,crypto:webcrypto,setTimeout,clearTimeout,document,Element:TileEl,indexedDB,navigator:{onLine:true},
    MutationObserver:class{observe(){}disconnect(){}},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},
    addEventListener(){},dispatchEvent:()=>true,getActiveScreenName:()=>"mainMenu",reportApplicationError(){},
    loadRuntimeScript:async(_key,_path,ready)=>{assert.ok(ready(),`Unexpected dependency: ${_path}`);return ready();},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:accountId}},firestore:{},firestoreSdk})},
    CareerModeSparkConnectedAccount:{initialize:async()=>({}),getState:()=>({connected:true,accountId})},
    CareerModeSparkPrivatePairing:{initialize:async()=>({}),getState:()=>({registered:true,deviceId:DEVICE}),localBindingOptions:()=>[binding]},
    CareerModeSaveLibraryRuntime:{isReady:()=>true,getLibrarySnapshot:()=>library,switchActiveSave:async()=>true},
    CareerModeShowdownModes:{install(){},resolve:async()=>({mode:"real"}),getView:()=>({mode:"real"})},
    CareerModeConnectPlayersScreenV10:{open:async()=>{calls.fallbacks+=1;},close(){}},
  };
  vm.createContext(sandbox);
  const load=file=>vm.runInContext(fs.readFileSync(path.join(ROOT,"js",file),"utf8"),sandbox,{filename:file});
  for(const file of ["sparkConnectedRivalry.js","persistentNikDanielPair.js","whichShowdownIsLive.js","productionSharedJourneyEntry.js","onlinePlayerIdentity.js"])load(file);
  const connected=sandbox.CareerModeSparkConnectedRivalry;
  sandbox.CareerModeSparkConnectedRivalry={attachRivalry:options=>connected.attachRivalry({...options,persistPointer:false}),initialize:async()=>true};
  const entry=sandbox.CareerModeProductionSharedJourneyEntry;
  sandbox.CareerModeProductionSharedJourneyEntry={...entry,install(){},openPanel:async()=>{calls.entered+=1;return true;}};
  return {identity:sandbox.CareerModeOnlinePlayerIdentity,pair:sandbox.CareerModePersistentNikDanielPair,control,calls,chip,tile,docs,
    label:()=>tile.querySelector(".menuTileLabel").textContent,meta:()=>tile.querySelector(".menuTileMeta").textContent,
    async continueCareer(){for(const fn of events.get("click")||[])fn({target:career,preventDefault(){},stopImmediatePropagation(){}});await settle();},
    closeFallback(){sandbox.CareerModeConnectPlayersScreenV10.close();}
  };
}

async function scenario(manager,viaTile){
  const h=harness(manager);
  assert.equal((await h.identity.initialize()).status,"ready");await settle();
  assert.equal(h.pair.getState().status,"paired");
  assert.equal(h.label(),"CONTINUE SHOWDOWN");
  const originalDocs=JSON.stringify([...h.docs]);
  const frames=[];
  h.pair.subscribe(p=>frames.push({status:p.status,label:h.label()}));
  const pairReads=h.calls.pairReads;
  if(viaTile){await h.identity.openStart();h.closeFallback();}else await h.continueCareer();
  await settle();
  assert.ok(h.calls.pairReads>pairReads,"the initial pair recheck succeeded before the attachment read failed");
  assert.equal(h.calls.attachReads,1,"fault reached the actual attachment transaction");
  assert.equal(h.pair.getState().status,"error");
  assert.equal(h.pair.getState().rivalryId,RIVALRY);
  assert.equal(h.pair.getState().connectionState,"active");
  assert.equal(h.calls.entered,0,"an unverified attachment cannot enter gameplay");
  assert.equal(h.calls.fallbacks,viaTile?1:0,"upper-tile failure opens the existing connection fallback");
  assert.ok(frames.some(f=>f.status==="continuing"));
  assert.ok(frames.every(f=>f.label==="CONTINUE SHOWDOWN"),`every Home frame keeps the live action: ${JSON.stringify(frames)}`);
  assert.equal(h.label(),"CONTINUE SHOWDOWN",`${manager.id}: failed CONTINUE must not offer START or JOIN`);
  assert.equal(h.meta(),h.pair.getState().message,"Home carries the same reconnect/retry reason as Connect Players");
  assert.match(h.meta(),/connection|internet/i);assert.match(h.meta(),/try again/i);
  assert.equal(h.chip.dataset.homeShowdown,"current");
  assert.equal(h.tile.disabled,false,"retry remains available");
  h.control.failAttach=false;
  if(viaTile)await h.identity.openStart();else await h.continueCareer();
  await settle();
  assert.equal(h.calls.attachReads,2,"retry reauthorizes through the attachment transaction");
  assert.equal(h.calls.entered,1);
  assert.equal(h.pair.getState().status,"paired");
  assert.equal(h.label(),"CONTINUE SHOWDOWN");
  assert.equal(h.meta(),"Your Showdown is live. Tap to continue.","success clears the retry reason");
  assert.equal(h.calls.writes,0);
  assert.equal(JSON.stringify([...h.docs]),originalDocs,"continuation leaves the stored Showdown unchanged");
  console.log(`ok ${manager.id}: ${viaTile?"Home tile and dismissed fallback":"CONTINUE CAREER"} failure and healthy retry`);
}
(async()=>{
  // Run all four routes even on the unfixed branch, so the failing-first evidence covers both managers.
  const results=await Promise.allSettled(managers.flatMap(m=>[scenario(m,false),scenario(m,true)]));
  const failures=results.filter(r=>r.status==="rejected").map(r=>r.reason);
  if(failures.length)throw new AggregateError(failures,"Failed CONTINUE Home contracts");
  console.log("PASS r83 failed-continue Home contracts: 4 player journeys");
})().catch(error=>{console.error(error);process.exitCode=1;});

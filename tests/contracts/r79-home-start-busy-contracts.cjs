"use strict";
// Codex #904 (P2), r79: Home's START / JOIN tile answers the tap at once. Nik's JOIN tap first waits for a fresh partner/note
// check (up to the JOIN note listener's first delivery) and the pair read before the join itself starts; the tile used to stay
// unchanged and enabled all that time, so the tap looked dead. It now reads "Checking…" and is aria-busy (js/v10Screens.js then
// ignores a repeat tap) from the tap itself, shows "Joining Daniel's Showdown…" while the join runs, and is cleared on every
// exit (joined, refused, failed check). No dimming: the tile is never disabled or greyed. No read and no timer of its own.
// js/onlinePlayerIdentity.js runs in a sandbox with a minimal DOM and stubbed account, device, pair and START decision modules.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const identitySource=read("js/onlinePlayerIdentity.js");
const RIVALRY=`pair_3${"ab".repeat(31)}c`;
let passed=0;
async function check(name,fn){await fn();passed+=1;console.log(`ok ${passed} ${name}`);}
async function settle(){for(let i=0;i<60;i+=1)await new Promise(resolve=>setImmediate(resolve));}
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};}

class El{
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

function harness({manager="nik",account="uid_nik"}={}){
  const byId=new Map(),clicks=[],calls={which:0,watch:0,join:0,reports:[]};
  const tile=new El("newShowdown");
  for(const cls of ["menuTileCode","menuTileLabel","menuTileMeta"])tile.append(new El("",cls));
  byId.set("newShowdown",tile);
  const document={visibilityState:"visible",head:new El("head"),body:new El("body"),documentElement:new El("html"),
    getElementById:id=>byId.get(id)||null,querySelector:()=>null,querySelectorAll:()=>[],createElement:tag=>new El("",tag),
    addEventListener:(type,fn)=>{if(type==="click")clicks.push(fn);}};
  // IndexedDB: the remembered player for this account
  const indexedDB={open:()=>{const request={};setImmediate(()=>{request.result={objectStoreNames:{contains:()=>true},close(){},transaction:()=>({objectStore:()=>({get:()=>{const get={};setImmediate(()=>{get.result={accountId:account,managerId:manager};get.onsuccess?.();});return get;}})})};request.onsuccess?.();});return request;}};
  const ctl={watch:null,which:null,join:null};
  const pair={
    getState:()=>({status:"unpaired",initialized:true,busy:false,rivalryId:null,connectionState:null}),
    getJoinNoteState:()=>({checked:true,partnerActive:true,note:{rivalryId:RIVALRY,totalSeasons:3}}),
    readPartnerRecord:async()=>null,
    watchJoinNote:()=>{calls.watch+=1;ctl.watch=deferred();return ctl.watch.promise;},
    readJoinNote:async()=>null,
    buildPlayerJoinCode:id=>`CMS17-${id}`,
    joinPairing:()=>{calls.join+=1;ctl.join=deferred();return ctl.join.promise;}
  };
  const sandbox={console,Promise,Date,setTimeout,clearTimeout,setImmediate,document,Element:El,indexedDB,navigator:{onLine:true},
    MutationObserver:class{observe(){}disconnect(){}},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init&&init.detail;}},
    addEventListener(){},dispatchEvent:()=>true,getActiveScreenName:()=>"mainMenu",
    reportApplicationError:(label,error)=>calls.reports.push(`${label}: ${error&&error.message}`),
    CareerModeProductionFirebaseRuntime:{},
    CareerModeSparkConnectedAccount:{initialize:async()=>({}),getState:()=>({connected:true,accountId:account})},
    CareerModeSparkPrivatePairing:{initialize:async()=>({}),getState:()=>({registered:true,deviceId:"device_one"})},
    CareerModeWhichShowdownIsLive:{read:()=>{calls.which+=1;ctl.which=deferred();return ctl.which.promise;}},
    CareerModePersistentNikDanielPair:pair};
  vm.createContext(sandbox);
  vm.runInContext(identitySource,sandbox,{filename:"js/onlinePlayerIdentity.js"});
  const api=sandbox.CareerModeOnlinePlayerIdentity;
  const meta=()=>tile.querySelector(".menuTileMeta").textContent;
  const busy=()=>tile.getAttribute("aria-busy")==="true";
  function tap(){const event={target:tile.querySelector(".menuTileLabel"),defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},stopImmediatePropagation(){}};for(const fn of clicks)fn(event);return event;}
  return {api,tile,meta,busy,tap,ctl,calls,sandbox};
}
async function ready(h){const state=await h.api.initialize();assert.equal(state.status,"ready","the player is signed in and chosen");await settle();}

(async()=>{
await check("HB1 Nik's JOIN tap shows Checking… at once, while the fresh note check waits for the listener's first delivery",async()=>{
  const h=harness();await ready(h);
  assert.match(h.meta(),/Daniel started 3 seasons\. Tap to join\./,"Home shows Daniel's note");
  assert.equal(h.busy(),false,"nothing is busy before the tap");
  const event=h.tap();
  assert.equal(event.defaultPrevented,true,"the tap is START's own");
  // synchronously, before any await has settled: the tile already answers
  assert.equal(h.busy(),true,"the tile is aria-busy from the tap itself");
  assert.equal(h.meta(),"Checking…","and says it is checking");
  await settle();
  assert.equal(h.calls.watch,1,"the fresh note check is under way (the listener's first delivery can take up to 5 s)");
  assert.equal(h.busy(),true,"still busy while it waits");assert.equal(h.meta(),"Checking…","still Checking… while it waits");
  h.tap();await settle();
  assert.equal(h.calls.watch,1,"a repeat tap starts nothing new");
  h.ctl.watch.resolve(true);await settle();
  assert.equal(h.calls.which,1,"then START reads the pair once");
  assert.equal(h.busy(),true,"busy through the pair read");assert.equal(h.meta(),"Checking…");
  h.ctl.which.resolve({action:"join",rivalryId:RIVALRY});await settle();
  assert.equal(h.calls.join,1,"the join starts");
  assert.equal(h.busy(),true,"busy through the join");assert.equal(h.meta(),"Joining Daniel's Showdown…","the join shows its own line");
  h.ctl.join.resolve({status:"paired",connectionState:"active",rivalryId:RIVALRY});await settle();
  assert.equal(h.busy(),false,"cleared once the join has settled");
  assert.equal(h.tile.dataset.homeStartChecking,undefined,"no busy marker is left behind");
  assert.match(h.meta(),/Tap to join\./,"the tile is drawn again from page memory");
  assert.equal(h.tile.disabled,false,"never disabled (no dimming)");
});

await check("HB2 the busy state is cleared on every exit: a failed check, a refused join, Daniel's route to the seasons screen",async()=>{
  {const h=harness();await ready(h);h.tap();await settle();
   h.ctl.watch.reject(new Error("offline"));await settle();
   h.ctl.which.reject(new Error("The pair could not be read."));await settle();
   assert.ok(h.calls.reports.some(line=>/Unable to start the Showdown/.test(line)),"a failed check is reported as before");
   assert.equal(h.busy(),false,"a failed check clears the busy tile");assert.match(h.meta(),/Tap to join\./);}
  {const h=harness();await ready(h);h.tap();await settle();h.ctl.watch.resolve(true);await settle();
   h.ctl.which.resolve({action:"join",rivalryId:RIVALRY});await settle();
   h.sandbox.CareerModeConnectPlayersScreenV10={open:async()=>true};h.sandbox.loadRuntimeScript=async()=>true;
   h.ctl.join.reject(Object.assign(new Error("The code could not be joined."),{code:"PERSISTENT_PAIR_JOIN_FAILED"}));await settle();
   assert.equal(h.busy(),false,"a refused join clears the busy tile");assert.equal(h.tile.dataset.homeStartChecking,undefined);}
  {const h=harness({manager:"daniel",account:"uid_daniel"});await ready(h);
   const navigations=[];h.sandbox.navigateTo=async name=>{navigations.push(name);return true;};
   assert.equal(h.meta(),"Choose seasons and create the code","Daniel's tile");
   h.tap();assert.equal(h.busy(),true,"Daniel's START answers at once too");assert.equal(h.meta(),"Checking…");
   await settle();assert.equal(h.calls.watch,0,"Daniel has no note check");
   h.ctl.which.resolve({action:"new"});await settle();
   assert.deepEqual(navigations,["createShowdown"],"Daniel goes to the seasons screen");
   assert.equal(h.busy(),false,"and the tile is cleared");assert.equal(h.meta(),"Choose seasons and create the code");}
});

await check("HB3 the busy tile costs nothing: no read, no timer, never disabled or dimmed; only the Home tile is wrapped",async()=>{
  const helper=identitySource.slice(identitySource.indexOf("let homeStartChecking=false;"),identitySource.indexOf("if(root.document?.addEventListener)root.document.addEventListener(\"click\""));
  assert.ok(helper.length>0,"the helper exists");
  assert.doesNotMatch(helper,/readJoinNote|readPartnerRecord|watchJoinNote|runTransaction|getDoc|onSnapshot|setTimeout|setInterval/,"no read and no timer of its own");
  assert.doesNotMatch(helper,/disabled|opacity|filter|dim/i,"no dimming: the tile is never disabled or greyed");
  assert.match(identitySource,/if\(gameplay\.id==="newShowdown"&&!gameplay\.disabled\)\{e\.preventDefault\(\);e\.stopImmediatePropagation\(\);void openHomeStart\(\);return;\}/,"the Home tile tap goes through the busy wrapper");
  const surface=identitySource.slice(identitySource.indexOf("function configureOnlineProductSurface"),identitySource.indexOf("function ensureOnlineIdentityOverlay"));
  assert.match(surface,/applyHomeStartChecking\(\);\n\}\s*$/,"every redraw of the tile keeps (or clears) the busy state");
  assert.match(read("js/v10Screens.js"),/if\(tile\.getAttribute\("aria-busy"\)==="true"\|\|homeGone/,"js/v10Screens.js ignores a tap on an aria-busy Home tile");
});

console.log(`PASS r79 Home START busy contracts: ${passed} checks (Codex #904 P2: Nik's JOIN and Daniel's START answer the tap at once with Checking…, aria-busy through the check and join, cleared on every exit, no read, no timer, no dimming).`);
})().catch(error=>{console.error(error);process.exitCode=1;});

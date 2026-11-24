"use strict";
// Phoenix B2 (r100), B1's twotabs finding: two tabs of Daniel's on one device; the second tab ends the Showdown (END SHOWDOWN);
// the first tab's Home tile still reads LIVE / CONTINUE SHOWDOWN (its pair state has not heard yet). Tapping it ran a fresh
// START, whose read rightly found nothing live, and opened the seasons screen: CONTINUE landed on a new Showdown's setup. A tap
// on a LIVE tile is a CONTINUE: when the fresh read finds nothing live any more it stays on Home, which redraws as having no live
// Showdown (no read, no timer and no extra tap of its own). The next tap is a normal START. Every other START answer is unchanged.
// js/onlinePlayerIdentity.js runs in a sandbox with a minimal DOM and stubbed account, device, pair and START decision modules.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const identitySource=process.env.R100_LIVE_TILE_SOURCE?fs.readFileSync(process.env.R100_LIVE_TILE_SOURCE,"utf8"):read("js/onlinePlayerIdentity.js");
const RIVALRY=`pair_3${"ab".repeat(31)}c`,NEXT=`pair_3${"cd".repeat(31)}e`;
let passed=0;
async function check(name,fn){await fn();passed+=1;console.log(`ok ${passed} ${name}`);}
async function settle(){for(let i=0;i<60;i+=1)await new Promise(resolve=>setImmediate(resolve));}

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

// A same-origin BroadcastChannel shared by the tabs of one test (one device).
function channelBus(){const members=new Set();return class FakeChannel{constructor(name){this.name=name;members.add(this);this.onmessage=null;}postMessage(data){for(const other of members)if(other!==this&&other.name===this.name)setImmediate(()=>other.onmessage?.({data}));}close(){members.delete(this);}};}
function harness({manager="daniel",live=true,bus=null,screen="mainMenu",rivalry=null}={}){
  const account=manager==="nik"?"uid_nik":"uid_daniel";
  const byId=new Map(),clicks=[],calls={which:0,join:0,follow:[],navigations:[],connect:0,reports:[]};
  const tile=new El("newShowdown");
  for(const cls of ["menuTileCode","menuTileLabel","menuTileMeta"])tile.append(new El("",cls));
  byId.set("newShowdown",tile);
  const document={visibilityState:"visible",head:new El("head"),body:new El("body"),documentElement:new El("html"),
    getElementById:id=>byId.get(id)||null,querySelector:()=>null,querySelectorAll:()=>[],createElement:tag=>new El("",tag),
    addEventListener:(type,fn)=>{if(type==="click")clicks.push(fn);}};
  const indexedDB={open:()=>{const request={};setImmediate(()=>{request.result={objectStoreNames:{contains:()=>true},close(){},transaction:()=>({objectStore:()=>({get:()=>{const get={};setImmediate(()=>{get.result={accountId:account,managerId:manager};get.onsuccess?.();});return get;}})})};request.onsuccess?.();});return request;}};
  const role=manager==="nik"?"playerTwo":"playerOne";
  // The pair state as this tab holds it: a live Showdown, until the fresh read of a tap finds it ended elsewhere.
  let pairState=live?{status:"paired",initialized:true,busy:false,rivalryId:rivalry||RIVALRY,connectionState:"active",managerRole:role}:{status:"unpaired",initialized:true,busy:false,rivalryId:null,connectionState:null};
  const subscribers=new Set();let endedOnServer=false;
  const pair={
    getState:()=>pairState,subscribe:fn=>{subscribers.add(fn);return()=>subscribers.delete(fn);},
    endedElsewhere(){pairState={status:"unpaired",initialized:true,busy:false,rivalryId:null,connectionState:null,closedRivalryId:RIVALRY};for(const fn of subscribers)fn(pairState);},
    getJoinNoteState:()=>({checked:true,partnerActive:true,note:null}),getPartnerSideState:()=>({status:"mutual",accountId:account}),
    // The pair read (syncPair): it finds the Showdown ended once another tab or phone ended it.
    initialize:async()=>{calls.pairReads=(calls.pairReads||0)+1;if(endedOnServer&&pairState.rivalryId)pair.endedElsewhere();return pairState;},serverEnds(){endedOnServer=true;},
    readPartnerRecord:async()=>null,readPartnerSide:async()=>null,readJoinNote:async()=>null,watchJoinNote:async()=>true,
    buildPlayerJoinCode:id=>`CMS17-${id}`,joinPairing:async()=>{calls.join+=1;return{status:"paired",connectionState:"active",rivalryId:NEXT};}
  };
  let nextDecision=null;
  const sandbox={console,Promise,Date,setTimeout,clearTimeout,setImmediate,document,Element:El,indexedDB,navigator:{onLine:true},
    MutationObserver:class{observe(){}disconnect(){}},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init&&init.detail;}},
    addEventListener(){},dispatchEvent:()=>true,getActiveScreenName:()=>typeof screen==="function"?screen():screen,...(bus?{BroadcastChannel:bus}:{}),
    navigateTo:async name=>{calls.navigations.push(name);return true;},
    loadRuntimeScript:async()=>true,
    reportApplicationError:(label,error)=>calls.reports.push(`${label}: ${error&&error.message}`),
    CareerModeProductionFirebaseRuntime:{},
    CareerModeSparkConnectedAccount:{initialize:async()=>({}),getState:()=>({connected:true,accountId:account})},
    CareerModeSparkPrivatePairing:{initialize:async()=>({}),getState:()=>({registered:true,deviceId:"device_one"})},
    // START's fresh read: it is where this tab learns the other tab's END SHOWDOWN (the pair state changes with it).
    CareerModeWhichShowdownIsLive:{read:async()=>{calls.which+=1;const decision=nextDecision;if(decision&&decision.endedElsewhere)pair.endedElsewhere();return decision?decision.value:{action:"continue",rivalryId:RIVALRY};}},
    CareerModeProductionSharedJourneyEntry:{install(){},followStartDecision:async decision=>{calls.follow.push(decision.action);return "entered";}},
    CareerModeConnectPlayersScreenV10:{open:async()=>{calls.connect+=1;return true;}},
    CareerModePersistentNikDanielPair:pair};
  vm.createContext(sandbox);
  vm.runInContext(identitySource,sandbox,{filename:"js/onlinePlayerIdentity.js"});
  const api=sandbox.CareerModeOnlinePlayerIdentity;
  const text=cls=>tile.querySelector(`.${cls}`).textContent;
  function tap(){const event={target:tile.querySelector(".menuTileLabel"),defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},stopImmediatePropagation(){}};for(const fn of clicks)fn(event);return event;}
  return {api,tile,code:()=>text("menuTileCode"),label:()=>text("menuTileLabel"),meta:()=>text("menuTileMeta"),busy:()=>tile.getAttribute("aria-busy")==="true",tap,calls,pair,sandbox,decide:(value,endedElsewhere=false)=>{nextDecision={value,endedElsewhere};}};
}
async function ready(h){const state=await h.api.initialize();assert.equal(state.status,"ready","the player is signed in and chosen");await settle();}

(async()=>{
await check("L1 Daniel's stale LIVE tile, Showdown ended in his other tab: the tap stays on Home, which redraws as START A SHOWDOWN",async()=>{
  const h=harness();await ready(h);
  assert.deepEqual([h.code(),h.label(),h.meta()],["LIVE","CONTINUE SHOWDOWN","Your Showdown is live. Tap to continue."],"the stale tile, as in B1's twotabs run");
  h.decide({action:"new",rivalryId:null,totalSeasons:null,reason:"new"},true);
  h.tap();await settle();
  assert.equal(h.calls.which,1,"the tap reads once, as every START does");
  assert.deepEqual(h.calls.navigations,[],"no seasons screen: CONTINUE never lands on a new Showdown's setup");
  assert.deepEqual(h.calls.follow,[],"nothing is entered");assert.equal(h.calls.connect,0,"no Connect Players either");
  assert.deepEqual([h.code(),h.label()],["NEW","START A SHOWDOWN"],"Home now reads as having no live Showdown");
  assert.equal(h.busy(),false,"the tile is no longer busy");assert.deepEqual(h.calls.reports,[],"and nothing is reported as an error");
  // The next tap is a normal START.
  h.decide({action:"new",rivalryId:null,totalSeasons:null,reason:"new"});
  h.tap();await settle();
  assert.deepEqual(h.calls.navigations,["createShowdown"],"Daniel's next START opens the seasons screen as before");
});

await check("L2 a LIVE tile whose Showdown is still live continues exactly as before",async()=>{
  const h=harness();await ready(h);
  h.decide({action:"continue",rivalryId:RIVALRY,totalSeasons:3,reason:"continue"});
  h.tap();await settle();
  assert.deepEqual(h.calls.follow,["continue"],"the live Showdown is continued");assert.deepEqual(h.calls.navigations,[]);
  const g=harness();await ready(g);
  g.decide({action:"close-then-new",rivalryId:RIVALRY,totalSeasons:3,reason:"ended-not-closed"});
  g.tap();await settle();
  assert.deepEqual(g.calls.follow,["close-then-new"],"an ended but not yet closed Showdown still closes through Showdown entry");
});

await check("L3 a START tile (nothing live shown) still opens the seasons screen on the first tap",async()=>{
  const h=harness({live:false});await ready(h);
  assert.deepEqual([h.code(),h.label()],["NEW","START A SHOWDOWN"]);
  h.decide({action:"new",rivalryId:null,totalSeasons:null,reason:"new"});
  h.tap();await settle();
  assert.deepEqual(h.calls.navigations,["createShowdown"],"unchanged: one tap to the seasons screen");
});

await check("L4 Nik's stale LIVE tile: nothing to join any more stays on Home; Daniel's new code is still joined at once",async()=>{
  const h=harness({manager:"nik"});await ready(h);
  assert.equal(h.code(),"LIVE","Nik's stale tile");
  h.decide({action:"wait-for-daniel",rivalryId:null,totalSeasons:null,reason:"wait-for-daniel"},true);
  h.tap();await settle();
  assert.equal(h.calls.connect,0,"no Connect Players for a CONTINUE tap");assert.deepEqual(h.calls.navigations,[]);
  assert.notEqual(h.code(),"LIVE","Home no longer says LIVE");
  const g=harness({manager:"nik"});await ready(g);
  g.decide({action:"join",rivalryId:NEXT,totalSeasons:3,reason:"note"},true);
  g.tap();await settle();
  assert.equal(g.calls.join,1,"a new Showdown Daniel already started is joined, as before");
});

await check("L5 scope: only the Home tile tap carries the LIVE reading; Rematch and the other START callers are unchanged; no read or timer",async()=>{
  const home=identitySource.slice(identitySource.indexOf("function openHomeStart(){"),identitySource.indexOf("\n",identitySource.indexOf("function openHomeStart(){")));
  assert.match(home,/liveTap=root\.document\?\.getElementById\("newShowdown"\)\?\.querySelector\("\.menuTileCode"\)\?\.textContent==="LIVE"/,"the reading is the tile as Home showed it at the tap");
  assert.ok(home.indexOf("liveTap=root.document")<home.indexOf("applyHomeStartChecking()"),"read before the tile turns to Checking…");
  assert.match(home,/openCanonicalStart\(\{liveTap\}\)/);
  assert.match(identitySource,/const liveTap=options&&options\.liveTap===true&&!rematch;/,"a Rematch never counts as a LIVE tap");
  assert.equal((identitySource.match(/openCanonicalStart\(\{liveTap\}\)/g)||[]).length,1,"only the Home tile passes it");
  const guard=identitySource.slice(identitySource.indexOf("if(liveTap&&("),identitySource.indexOf("return decision;}",identitySource.indexOf("if(liveTap&&(")));
  assert.doesNotMatch(guard,/read|navigateTo|setTimeout|setInterval/,"staying on Home costs no read, no navigation and no timer");
});
await check("L6 the tab that ends the Showdown tells this device's other tabs (no storage, no read of its own); one on Home reads its pair once and drops LIVE",async()=>{
  const bus=channelBus();
  const ender=harness({bus}),home=harness({bus}),busy=harness({bus,screen:"seasonCommit"}),other=harness({bus,rivalry:NEXT});
  for(const tab of [ender,home,busy,other])await ready(tab);
  for(const tab of [ender,home,busy,other])assert.equal(tab.code(),"LIVE","every tab starts with the LIVE tile");
  const before={home:home.calls.pairReads||0,busy:busy.calls.pairReads||0,other:other.calls.pairReads||0};
  for(const tab of [home,busy,other])tab.pair.serverEnds();
  ender.pair.endedElsewhere();await settle();
  assert.equal(home.calls.pairReads-before.home,1,"the other tab on Home reads its pair once");
  assert.notEqual(home.code(),"LIVE","and its tile no longer says LIVE, before any tap");
  assert.deepEqual([home.code(),home.label()],["NEW","START A SHOWDOWN"]);
  assert.equal((busy.calls.pairReads||0)-before.busy,0,"a tab on another screen keeps its own Showdown listeners (no read here)");
  assert.equal((other.calls.pairReads||0)-before.other,0,"a tab holding a different Showdown reads nothing");
  assert.deepEqual(home.calls.navigations,[],"nothing opens by itself");
  const relay=identitySource.slice(identitySource.indexOf("const ENDED_CHANNEL="),identitySource.indexOf("function watchHomeTilePair("));
  assert.doesNotMatch(relay,/localStorage|sessionStorage|indexedDB|setTimeout|setInterval/,"the relay uses no storage and no timer");
});
console.log(`r100 live tile ended elsewhere contracts: ${passed} passed`);
})().catch(error=>{console.error(error);process.exit(1);});

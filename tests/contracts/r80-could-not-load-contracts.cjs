"use strict";
// r80 release gallery (home-live-could-not-load-nik, showdown-could-not-be-loaded-nik): when a live Showdown could not be rebuilt
// on this page (pair ACTIVE, status recovery-required), Nik's Home tile still read JOIN DANIEL'S SHOWDOWN ("Paste Daniel's
// code") for the Showdown this page already holds (Daniel's read START A SHOWDOWN), and the recovery panel said "Reload to try
// again" although its only buttons are RESTORE BACKUP and DELETE OLD SHOWDOWN & START OVER.
// The Home tile tap already is the try-again: it re-reads the pair (js/whichShowdownIsLive.js read -> identity.syncPair ->
// pair.initialize({force:true})), which runs the rebuild again; a rebuild that now works continues the Showdown, one that fails
// again opens the same recovery panel. So the tile names that action and the panel's copy points to it. The panel's two
// buttons, their order, labels, handlers and confirm are unchanged (owner decisions, pinned by qol-1-7 Q1 and BH-11 R2).
//   C1 Home tile, Nik and Daniel, recovery-required: LIVE / LOAD SHOWDOWN, never JOIN DANIEL'S SHOWDOWN, START A SHOWDOWN or
//      CONTINUE SHOWDOWN; it follows the pair to CONTINUE SHOWDOWN once rebuilt; never disabled (no dimming).
//   C2 the recovery panel's copy names only what the screen offers: BACK (the layer's button), LOAD SHOWDOWN (the tile label
//      of C1), restore a backup (RESTORE BACKUP), start over (... START OVER); no reload; the two buttons are unchanged.
//   C3 the try-again is real: the re-read the tile tap makes rebuilds the shell when the rebuild now works (paired, then the
//      decision is continue), and keeps recovery-required (the decision is the recovery panel) when it fails again.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");

const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const identitySource=read("js/onlinePlayerIdentity.js");
const pairSource=read("js/persistentNikDanielPair.js");
const connectSource=read("js/connectPlayersScreenV10.js");
const which=require(path.join(ROOT,"js/whichShowdownIsLive.js"));
const RIVALRY=`pair_3${"ab".repeat(31)}c`;
const SAVE_NEW=`save_${"1".repeat(24)}`,PROFILE_NEW=`profile_${"2".repeat(24)}`;
const DANIEL_SAVE=`save_${"5".repeat(24)}`,DANIEL_PROFILE=`profile_${"6".repeat(24)}`;
let checks=0;
const ok=label=>{checks+=1;console.log(`ok ${checks} ${label}`);};
async function settle(){for(let i=0;i<60;i+=1)await new Promise(resolve=>setImmediate(resolve));}

// ---------- C1: js/onlinePlayerIdentity.js in a sandbox (as r79-home-start-busy-contracts.cjs) ----------
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
function tileHarness({manager,account,pairState}){
  const byId=new Map(),listeners=[];
  const tile=new TileEl("newShowdown");
  for(const cls of ["menuTileCode","menuTileLabel","menuTileMeta"])tile.append(new TileEl("",cls));
  byId.set("newShowdown",tile);
  const document={visibilityState:"visible",head:new TileEl("head"),body:new TileEl("body"),documentElement:new TileEl("html"),
    getElementById:id=>byId.get(id)||null,querySelector:()=>null,querySelectorAll:()=>[],createElement:tag=>new TileEl("",tag),addEventListener(){}};
  const indexedDB={open:()=>{const request={};setImmediate(()=>{request.result={objectStoreNames:{contains:()=>true},close(){},transaction:()=>({objectStore:()=>({get:()=>{const get={};setImmediate(()=>{get.result={accountId:account,managerId:manager};get.onsuccess?.();});return get;}})})};request.onsuccess?.();});return request;}};
  let p=pairState;
  const pair={getState:()=>p,subscribe:fn=>{listeners.push(fn);return()=>{};},
    getJoinNoteState:()=>({checked:true,partnerActive:true,note:null}),readPartnerRecord:async()=>null,watchJoinNote:async()=>null,readJoinNote:async()=>null};
  const sandbox={console,Promise,Date,setTimeout,clearTimeout,setImmediate,document,Element:TileEl,indexedDB,navigator:{onLine:true},
    MutationObserver:class{observe(){}disconnect(){}},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init&&init.detail;}},
    addEventListener(){},dispatchEvent:()=>true,getActiveScreenName:()=>"mainMenu",reportApplicationError(){},
    CareerModeProductionFirebaseRuntime:{},
    CareerModeSparkConnectedAccount:{initialize:async()=>({}),getState:()=>({connected:true,accountId:account})},
    CareerModeSparkPrivatePairing:{initialize:async()=>({}),getState:()=>({registered:true,deviceId:"device_one"})},
    CareerModeWhichShowdownIsLive:{read:async()=>({action:"pair-first"})},
    CareerModePersistentNikDanielPair:pair};
  vm.createContext(sandbox);
  vm.runInContext(identitySource,sandbox,{filename:"js/onlinePlayerIdentity.js"});
  const text=cls=>tile.querySelector(`.${cls}`).textContent;
  return {api:sandbox.CareerModeOnlinePlayerIdentity,tile,code:()=>text("menuTileCode"),label:()=>text("menuTileLabel"),meta:()=>text("menuTileMeta"),
    setPair(next){p=next;for(const fn of listeners)fn(p);}};
}
let tileLabel=null;
async function c1HomeTile(){
  for(const [manager,account,role] of [["nik","uid_nik","playerTwo"],["daniel","uid_daniel","playerOne"]]){
    const h=tileHarness({manager,account,pairState:{status:"recovery-required",initialized:true,busy:false,rivalryId:RIVALRY,connectionState:"active",managerRole:role}});
    assert.equal((await h.api.initialize()).status,"ready");await settle();
    assert.notEqual(h.label(),"JOIN DANIEL'S SHOWDOWN",`C1 ${manager}: Home never offers JOIN for the Showdown this page holds`);
    assert.notEqual(h.label(),"START A SHOWDOWN",`C1 ${manager}: nor a new start`);
    assert.notEqual(h.label(),"CONTINUE SHOWDOWN",`C1 ${manager}: nor claims it continues (it could not be loaded here)`);
    assert.deepEqual([h.code(),h.label(),h.meta()],["LIVE","LOAD SHOWDOWN","It could not be loaded here. Tap to try again."],`C1 ${manager}: the tile names the try-again`);
    assert.equal(h.tile.disabled,false,`C1 ${manager}: never disabled (no dimming)`);
    tileLabel=h.label();
    h.setPair({status:"paired",initialized:true,busy:false,rivalryId:RIVALRY,connectionState:"active",managerRole:role});
    assert.equal(h.label(),"CONTINUE SHOWDOWN",`C1 ${manager}: once rebuilt the tile follows the pair to CONTINUE SHOWDOWN`);
  }
  ok("C1 a live Showdown that could not be loaded here reads LIVE / LOAD SHOWDOWN on Home (Nik and Daniel), never JOIN or START");
}

// ---------- C2/C3: js/persistentNikDanielPair.js in a sandbox (as qol-1-7-recovery-account-contracts.cjs) ----------
function createDom(){
  class El{
    constructor(tag){this.tagName=String(tag).toUpperCase();this.children=[];this.parent=null;this.style={};this.listeners={};this.id="";this.className="";this.ownText="";this.value="";this.disabled=false;this.dataset={};this.attributes={};}
    get textContent(){return this.ownText+this.children.map(c=>c.textContent).join("");}
    set textContent(v){this.ownText=v==null?"":String(v);this.children=[];}
    get isConnected(){let n=this;while(n){if(n===body)return true;n=n.parent;}return false;}
    append(...nodes){for(const n of nodes){if(typeof n==="string"){const t=new El("#text");t.ownText=n;t.parent=this;this.children.push(t);continue;}if(n.parent)n.parent.children=n.parent.children.filter(c=>c!==n);n.parent=this;this.children.push(n);}}
    appendChild(n){this.append(n);return n;}
    insertBefore(n){this.append(n);return n;}
    replaceChildren(...nodes){for(const c of this.children)c.parent=null;this.children=[];this.append(...nodes);}
    setAttribute(k,v){this.attributes[k]=String(v);}
    addEventListener(type,fn){(this.listeners[type]||(this.listeners[type]=[])).push(fn);}
    click(){if(!this.disabled)for(const fn of this.listeners.click||[])fn({preventDefault(){}});}
    focus(){}
    setSelectionRange(){}
    all(){return this.children.flatMap(c=>[c,...c.all()]);}
    querySelector(sel){if(sel.startsWith("."))return this.all().find(n=>String(n.className).split(" ").includes(sel.slice(1)))||null;if(sel==="button")return this.all().find(n=>n.tagName==="BUTTON")||null;return null;}
    scrollIntoView(){}
  }
  const body=new El("body"),connect=new El("section"),slot=new El("div");
  connect.id="connectPlayersScreen";slot.id="connectPlayersPairSlot";body.append(connect);connect.append(slot);
  const document={visibilityState:"visible",body,head:new El("head"),createElement:tag=>new El(tag),
    getElementById:id=>body.all().find(n=>n.id===id)||null,
    querySelector:sel=>sel==="#connectPlayersScreen #connectPlayersPairSlot"?slot:null,
    get activeElement(){return body;}};
  return{document};
}
function envelope(objectType,objectId,data){return{schemaVersion:1,objectType,objectId,revision:1,parentRevision:0,lifecycleState:"live",contentHash:`sha256:${"9".repeat(64)}`,data};}
function pairHarness(adopt){
  const {document}=createDom();
  const docs=new Map(Object.entries({
    "accounts/uid_nik/pairLinks/current":envelope("pairLink","current",{rivalryId:RIVALRY,managerRole:"playerTwo",managerId:"nik",linkedAt:null,lastConfirmedAt:null}),
    [`rivalries/${RIVALRY}`]:envelope("rivalry",RIVALRY,{connectionState:"active",authorizedAccountIds:["uid_daniel","uid_nik"],managerSlots:[{slotId:"playerOne",accountId:"uid_daniel",saveId:DANIEL_SAVE,profileId:DANIEL_PROFILE},{slotId:"playerTwo",accountId:"uid_nik",saveId:SAVE_NEW,profileId:PROFILE_NEW}]}),
    "accounts/uid_nik/devices/device_nik":envelope("device","device_nik",{deviceId:"device_nik",state:"active"})
  }));
  const calls={adopt:0,writes:0};
  const firestoreSdk={doc:(_db,...parts)=>({path:parts.join("/")}),Timestamp:{fromMillis:ms=>({toMillis:()=>ms})},
    runTransaction:async(_db,fn)=>{const tx={get:async ref=>({exists:()=>docs.has(ref.path),data:()=>docs.get(ref.path)}),set:()=>{calls.writes+=1;}};return fn(tx);},
    getDoc:async ref=>({exists:()=>docs.has(ref.path),data:()=>docs.get(ref.path)})};
  const library={activeSaveId:null,saves:[]};
  const control={adopt};
  const sandbox={console,setTimeout:()=>0,clearTimeout:()=>{},TextEncoder,crypto:webcrypto,Promise,Date,document,addEventListener(){},
    CareerModeOnlinePlayerIdentity:{getState:()=>({managerId:"nik"})},
    CareerModeSparkConnectedAccount:{initialize:async()=>({}),getState:()=>({connected:true,accountId:"uid_nik"})},
    CareerModeSparkPrivatePairing:{initialize:async()=>({}),getState:()=>({registered:true,deviceId:"device_nik"}),localBindingOptions:()=>[],getOrCreateDeviceIdentity:async()=>({deviceId:"device_nik"}),pairingJoinErrorMessage:error=>error?.message||"x"},
    CareerModeSaveLibraryRuntime:{isReady:()=>true,getLibrarySnapshot:()=>JSON.parse(JSON.stringify(library)),switchActiveSave:async()=>true,deleteSave:()=>({ok:true}),
      adoptOnlineEntry:async facts=>{calls.adopt+=1;const result=await control.adopt(facts);if(result?.ok&&!library.saves.some(e=>e.saveId===facts.saveId)){library.saves.push({saveId:facts.saveId,showdown:{identity:{saveId:facts.saveId,managerProfileIds:{[facts.role]:facts.profileId}}}});library.activeSaveId=facts.saveId;}return result;}},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"uid_nik"}},firestore:{},firestoreSdk})},
    navigateTo:async()=>true,openOptionalModule:async()=>true};
  vm.createContext(sandbox);
  vm.runInContext(pairSource,sandbox,{filename:"js/persistentNikDanielPair.js"});
  return {pair:sandbox.CareerModePersistentNikDanielPair,control,calls,panel:()=>document.getElementById("persistentNikDanielPairPanel")};
}
const buttonsOf=panel=>panel.all().filter(n=>n.tagName==="BUTTON");
const failing=async()=>({ok:false,code:"FORCED_FAILURE"});
async function c2PanelCopyMatchesItsControls(){
  const h=pairHarness(failing);
  const state=await h.pair.initialize({force:true});
  assert.equal(state.status,"recovery-required");assert.equal(state.connectionState,"active");
  h.pair.render();
  const panel=h.panel(),text=panel.textContent,labels=buttonsOf(panel).map(b=>b.textContent);
  assert.match(text,/OLD SHOWDOWN FOUND/);
  assert.doesNotMatch(text,/reload/i,"C2 no reload is asked for: the screen has no reload button");
  const tryAgain=/Tap BACK, then (.+?) on Home to try again/.exec(text);
  assert.ok(tryAgain,"C2 the copy says how to try again on this screen");
  assert.equal(tryAgain[1],tileLabel,"C2 the copy names the Home tile by its real label (LOAD SHOWDOWN, from C1)");
  assert.match(connectSource,/<button class=\\"connectPlayersBack\\" type=\\"button\\">BACK<\/button>/,"C2 the BACK it names is the Connect Players layer's own button");
  assert.match(text,/restore a backup/);assert.ok(labels.includes("RESTORE BACKUP"),"C2 'restore a backup' is the RESTORE BACKUP button");
  assert.match(text,/or start over\./);assert.ok(labels.some(label=>/START OVER$/.test(label)),"C2 'start over' is the START OVER button");
  assert.deepEqual(labels,["RESTORE BACKUP","DELETE OLD SHOWDOWN & START OVER"],"C2 the two recovery buttons, their order and labels are unchanged (owner decision)");
  assert.equal(h.calls.writes,0,"C2 showing the panel writes nothing");
  ok("C2 the recovery copy names only what the screen offers: BACK then LOAD SHOWDOWN, RESTORE BACKUP, START OVER; no reload");
}
async function c3TryAgainIsReal(){
  // The tile tap: openCanonicalStart -> which.read(root) -> identity.syncPair() -> pair.initialize({force:true}) -> the rebuild.
  const start=identitySource.slice(identitySource.indexOf("function openCanonicalStart"),identitySource.indexOf("async function openCanonicalNoteJoin"));
  assert.match(start,/let decision=await which\.read\(root\);/,"C3 the tile tap asks whichShowdownIsLive");
  const wsl=read("js/whichShowdownIsLive.js");
  assert.match(wsl,/async function wslRead[\s\S]*?const first=await identity\.syncPair\(\)/,"C3 which re-reads the pair through syncPair");
  assert.match(identitySource,/function syncPersistentPairSidecar\(\)\{[\s\S]*?pair\.initialize\(\{force:true,/,"C3 syncPair forces a pair initialize");
  assert.match(pairSource,/await pairAdoptOnlineShell\(link\.managerRole,link\.connectionState,link\.rivalryId,link\.providerSaveId,link\.providerProfileId\)\.catch\(\(\)=>false\)/,"C3 a forced initialize runs the rebuild");
  // Behaviour: the rebuild failed at load; the tap's re-read works now -> paired -> continue.
  const h=pairHarness(failing);
  assert.equal((await h.pair.initialize({force:true})).status,"recovery-required");
  assert.equal(h.calls.adopt,1);
  assert.deepEqual(which.decide({role:"playerTwo",pair:h.pair.getState(),shell:{}}).action,"pair-first","C3 while it cannot be loaded the tap opens the recovery choices");
  h.control.adopt=async facts=>({ok:true,status:"rebuilt",saveId:facts.saveId});
  const again=await h.pair.initialize({force:true});
  assert.equal(h.calls.adopt,2,"C3 the re-read runs the rebuild again");
  assert.equal(again.status,"paired","C3 a rebuild that works now leaves recovery");
  assert.equal(which.decide({role:"playerTwo",pair:again,shell:{}}).action,"continue","C3 and the same tap continues the Showdown");
  // Fails again: still recovery-required, still the same panel, nothing written.
  const still=pairHarness(failing);await still.pair.initialize({force:true});
  assert.equal((await still.pair.initialize({force:true})).status,"recovery-required","C3 a rebuild that fails again keeps the recovery choices");
  assert.equal(still.calls.writes,0,"C3 trying again writes nothing");
  ok("C3 LOAD SHOWDOWN really tries again: the tap's pair re-read reruns the rebuild; success continues, failure keeps the recovery choices");
}

(async()=>{
  await c1HomeTile();
  await c2PanelCopyMatchesItsControls();
  await c3TryAgainIsReal();
  console.log(`PASS r80 could-not-load: Home never offers JOIN for the Showdown it holds; the recovery copy and its controls agree (${checks} checks).`);
})().catch(error=>{console.error(error);process.exitCode=1;});

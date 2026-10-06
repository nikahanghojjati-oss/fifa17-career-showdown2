#!/usr/bin/env node
"use strict";
// G-13 part 2c (job 26) contract: Team V's look (factory/v1-wtt5ye 5e05a1f) on Start/Join, the League wheel and the
// Club packs, as a skin over the app's own markup (js/v10Setup.js + css/v10Setup.css), registered with job 24's
// loader (js/v10Screens.js). The skin keeps every id, button, data-* hook and button text; it never writes product
// text, disabled or hidden; it never picks: the wheel and pack results shown are the ones the shared Setup provider
// gave the product, and the wheel highlight waits for the wheel to stop. Back routes stay as they are and the top bar
// is locked ("setup") during the wheels, also when the shared presentation forces a wheel without showScreen.
// JOB-34: the Club packs moved to Team V's Club Assignment (js/clubScreenV10.js, contract v10-club-contracts.cjs);
// this skin now owns Start/Join and the League wheel only, and the checks below assert that hand-over.
// Browser behaviour runs the real files in a small fake DOM (node:vm), no network.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const zlib=require("node:zlib");
const crypto=require("node:crypto");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const sha256=file=>crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT,file))).digest("hex");
const checks=[];
const check=(name,fn)=>checks.push([name,fn]);
const flush=async(times=12)=>{for(let i=0;i<times;i+=1)await new Promise(resolve=>setImmediate(resolve));};

const EVENT="career-mode-screen-shown";
const SKIN="v26Skin";
const APP_SCREENS=["mainMenu","createShowdown","leagueWheelScreen","clubWheelScreen","dashboard","transferChallenge","seasonEntry","seasonSummary","statistics","careerStatistics","trophyRoom","legacy","ruleBook"];
const LEAGUES=[["premier_league","Premier League"],["laliga","LaLiga"],["bundesliga","Bundesliga"],["serie_a","Serie A"],["ligue_1","Ligue 1"]];
// The element ids start-join/TRUTH.md (Team V 5e05a1f) says must survive the skin.
const TRUTH_MD_IDS=["newShowdown","createShowdown","createShowdownScreenTitle","showdownName","managerOne","managerTwo","roundAmount","onlineShowdownSetupNote","onlinePlayerIdentityOverlay","onlinePlayerIdentityBadge","onlinePlayerIdentitySettingsPanel","startShowdown","productionSharedJourneyEntryOverlay","startSharedShowdown","continueSharedSetupGate","sharedJourneyLeagueLockNote","spinLeague","openClubPack","persistentNikDanielPairPanel","persistentNikDanielPairCode","sparkRemoteJoiningOverlay","settingsContent","settingsOverlay","sparkConnectedAccountPanel","sparkPrivatePairingPanel","sparkPrivatePairingCodeInput"];
// Team V files copied byte for byte from factory/v1-wtt5ye 5e05a1f (sha256 of `git show 5e05a1f:<path>`).
const TEAM_V_FILES={
  "visual-assets/v10_1/shared/wordmarks/TITLE_LEAGUE_V1.webp":"a35299752e9d3cfcc44b21ff882ac7fdd81b727af78002c5ce5d76459b29e322",
  "visual-assets/v10_1/club/assets/ENV_CLUB_PHONE_V1.webp":"b31092d3eac35a9851d9c51406dd0cf7972e2dd9a5a8adb83c78d4a27497ba2a",
  "visual-assets/v10_1/club/assets/ENV_CLUB_PLATE_V1_1X.webp":"398e74faeb18ab2df655122fa0f78e9737aad4c1eff1ba16d019a305f275c255",
  "visual-assets/v10_1/club/assets/ENV_CLUB_PLATE_V1_2X.webp":"fed849bbb2c9f239ae1561f57eb5b145e0e33a518fb7bfd0e424691c00cfd6ca",
  "visual-assets/v10_1/club/assets/OVL_CLUB_DANIEL_PHONE_V1.webp":"6836d6b85c87fdc0d73e18d106b1a6bf98c102d1f8e0fe5eacdb81c7bf95dc2d",
  "visual-assets/v10_1/club/assets/OVL_CLUB_NIK_PHONE_V1.webp":"2f509a89aa6485eac3ae8f7892dfb2c79e7733bed066eb3371dec9a2aa9c28bc",
  "visual-assets/v10_1/league/assets/ENV_LEAGUE_PHONE_V1.webp":"b0eecfe1a5d4f79e847170a787f5c8805b0630b0508732fd19302fdd66804a0b",
  "visual-assets/v10_1/league/assets/ENV_LEAGUE_PLATE_V1_1X.webp":"d9fd67a604ed9e2a1e9dd202826c664aed22061fa53b127a6a6b8cd50060fae9",
  "visual-assets/v10_1/league/assets/ENV_LEAGUE_PLATE_V1_2X.webp":"fcb07fa4c01b07ef86b238d07d7584e476ba3e780bb76ac561cb0167661057b4",
  "visual-assets/v10_1/league/assets/OVL_LEAGUE_DANIEL_PHONE_V1.webp":"0748bd50eed0b6f9267a2368977f43f4706b0692daf642c2f6dddc51708c734f",
  "visual-assets/v10_1/league/assets/OVL_LEAGUE_NIK_PHONE_V1.webp":"c6001bdc93978e24914bdc08f95674d4ecd4d52ccb7dc3ed82846d02fff057b3",
  "visual-assets/v10_1/shared/art/wheel/WHEEL_RIM_V1.webp":"cbc0328e9f8fa03e697e4825a0c5eea24d669faadaf2aa3bc674646290047878",
  "visual-assets/v10_1/start-join/assets/ENV_SJ_PHONE_V1.webp":"b77f010b6b590705b9d031c9e3a00159f0677813d87c81ba2a8a601fb7141a55",
  "visual-assets/v10_1/start-join/assets/ENV_SJ_PLATE_V1_1X.webp":"69170e26033fc39d109a48eeb051f3b361a90d17bc0e462a8939b3b9fdb37bdc",
  "visual-assets/v10_1/start-join/assets/ENV_SJ_PLATE_V1_2X.webp":"d71bf0f4da18fd92b45727e1c1ae955d8bb83fc35c9c16bf9988c938425db003",
  "visual-assets/v10_1/start-join/assets/OVL_SJ_DANIEL_PHONE_V1.webp":"f5fdb5eedc90b83acd5225cc6b18078ddfcf9031c9b40128f91db3314c34a3cd",
  "visual-assets/v10_1/start-join/assets/OVL_SJ_NIK_PHONE_V1.webp":"7564a129eccae2bbaf1a6b5280f0073dbba5770190c2547ae245b1bb07dc5b75",
  "js/visualIdentity.js":"ef390c10b4888e5c68ab22f662a84604c6baa215e15ca85c5c0eece9011d0df3"
};

// ---- a small fake DOM: enough for js/v10Screens.js, Team V's navbar.js and js/v10Setup.js ----
class FakeClassList{
  constructor(el){this.el=el;}
  get tokens(){return this.el.className.split(/\s+/).filter(Boolean);}
  contains(token){return this.tokens.includes(token);}
  add(...tokens){const set=new Set(this.tokens);tokens.forEach(t=>set.add(t));this.el.className=[...set].join(" ");}
  remove(...tokens){this.el.className=this.tokens.filter(t=>!tokens.includes(t)).join(" ");}
  toggle(token,force){const on=force===undefined?!this.contains(token):Boolean(force);if(on)this.add(token);else this.remove(token);return on;}
}
class FakeElement{
  constructor(doc,tag){
    this.ownerDocument=doc;this.tagName=String(tag).toUpperCase();this.children=[];this.parentNode=null;
    this.attrs=new Map();this.dataset={};this.className="";this.classList=new FakeClassList(this);this.listeners=new Map();
    this.hidden=false;this.disabled=false;this.html="";this.textContent="";this.style={};
  }
  get id(){return this.attrs.get("id")||"";}
  set id(value){this.attrs.set("id",String(value));}
  get innerHTML(){return this.html;}
  set innerHTML(value){this.html=String(value);this.children=[];}
  get firstChild(){return this.children[0]||null;}
  get isConnected(){for(let node=this;node;node=node.parentNode)if(node===this.ownerDocument.documentElement)return true;return false;}
  setAttribute(key,value){if(key==="id")this.id=value;else this.attrs.set(key,String(value));}
  getAttribute(key){return this.attrs.has(key)?this.attrs.get(key):null;}
  removeAttribute(key){this.attrs.delete(key);}
  hasAttribute(key){return this.attrs.has(key);}
  appendChild(child){return this.insertBefore(child,null);}
  append(...children){children.forEach(child=>this.appendChild(child));}
  insertBefore(child,ref){
    if(child.parentNode)child.remove();
    const index=ref?this.children.indexOf(ref):-1;
    if(index<0)this.children.push(child);else this.children.splice(index,0,child);
    child.parentNode=this;this.ownerDocument.connected(child);return child;
  }
  removeChild(child){child.remove();return child;}
  remove(){if(!this.parentNode)return;const siblings=this.parentNode.children;siblings.splice(siblings.indexOf(this),1);this.parentNode=null;}
  contains(node){for(let n=node;n;n=n.parentNode)if(n===this)return true;return false;}
  matches(selector){
    if(selector.includes(","))return selector.split(",").some(part=>this.matches(part.trim()));
    if(selector==="main > .screen")return this.classList.contains("screen")&&Boolean(this.parentNode&&this.parentNode.tagName==="MAIN");
    const attr=/^\[([a-z0-9-]+)\]$/.exec(selector);
    if(attr){const key=attr[1].replace(/^data-/,"").replace(/-([a-z0-9])/g,(_m,c)=>c.toUpperCase());return attr[1].startsWith("data-")?this.dataset[key]!==undefined:this.hasAttribute(attr[1]);}
    if(selector.startsWith("#"))return this.id===selector.slice(1);
    if(selector.startsWith("."))return selector.slice(1).split(".").every(token=>this.classList.contains(token));
    return this.tagName===selector.toUpperCase();
  }
  closest(selector){for(let node=this;node instanceof FakeElement;node=node.parentNode)if(node.matches(selector))return node;return null;}
  querySelectorAll(selector){
    if(selector.startsWith(":scope > "))return this.children.filter(child=>child.matches(selector.slice(9)));
    const out=[];const walk=el=>{for(const child of el.children){if(child.matches(selector))out.push(child);walk(child);}};walk(this);return out;
  }
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push(fn);}
  removeEventListener(type,fn){const list=this.listeners.get(type)||[];const index=list.indexOf(fn);if(index>=0)list.splice(index,1);}
  fire(type){for(const fn of [...(this.listeners.get(type)||[])])fn({type,target:this});}
  focus(){}
  scrollIntoView(){}
}
class FakeDocument{
  constructor(){
    this.listeners=new Map();
    this.documentElement=new FakeElement(this,"html");this.head=new FakeElement(this,"head");this.body=new FakeElement(this,"body");
    this.documentElement.appendChild(this.head);this.documentElement.appendChild(this.body);
  }
  connected(node){if(node.tagName==="LINK"&&!node.fired){node.fired=true;queueMicrotask(()=>node.fire("load"));}}
  createElement(tag){return new FakeElement(this,tag);}
  getElementById(id){const walk=el=>{for(const child of el.children){if(child.id===id)return child;const found=walk(child);if(found)return found;}return null;};return walk(this.documentElement);}
  querySelector(selector){return selector==="body"?this.body:this.documentElement.querySelector(selector);}
  querySelectorAll(selector){return this.documentElement.querySelectorAll(selector);}
  addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push(fn);}
  removeEventListener(type,fn){const list=this.listeners.get(type)||[];const index=list.indexOf(fn);if(index>=0)list.splice(index,1);}
  dispatchEvent(event){for(const fn of [...(this.listeners.get(event.type)||[])])fn(event);return true;}
}
const el=(doc,parent,tag,{id,cls,text,attrs,data}={})=>{
  const node=doc.createElement(tag);
  if(id)node.id=id;if(cls)node.className=cls;if(text!==undefined)node.textContent=text;
  for(const [k,v] of Object.entries(attrs||{}))node.setAttribute(k,v);
  Object.assign(node.dataset,data||{});
  parent.appendChild(node);return node;
};
// The setup screens as index.html draws them, plus the Start/Join surfaces product code adds later.
function buildSetupMarkup(doc,main){
  const create=doc.getElementById("createShowdown");
  el(doc,create,"h2",{id:"createShowdownScreenTitle",text:"NEW SHOWDOWN",attrs:{"data-route-focus-target":"true"}});
  const box=el(doc,create,"div",{cls:"setupBox"});
  for(const [id,value] of [["showdownName","Daniel vs Nik"],["managerOne","Daniel"],["managerTwo","Nik"]]){
    const label=el(doc,box,"label",{text:id,attrs:{for:id}});label.hidden=true;
    const input=el(doc,box,"input",{id,attrs:{type:"text",value}});input.hidden=true;
  }
  el(doc,box,"p",{cls:"stateNote",text:"Daniel is Player One. Nik is Player Two."});
  el(doc,box,"p",{id:"onlineShowdownSetupNote",cls:"stateNote",text:"Daniel is Player One. Nik is Player Two."});
  el(doc,box,"label",{text:"NUMBER OF SEASONS",attrs:{for:"roundAmount"}});
  el(doc,box,"select",{id:"roundAmount"});
  el(doc,box,"button",{id:"startShowdown",cls:"menuButton",text:"START A SHOWDOWN",attrs:{type:"button"}});
  el(doc,box,"button",{cls:"backButton",text:"BACK",attrs:{type:"button","data-smart-back":""}});
  el(doc,box,"p",{id:"sharedJourneyLeagueLockNote",cls:"stateNote",text:"Shared setup is waiting."});
  el(doc,box,"button",{id:"startSharedShowdown",cls:"menuButton",text:"START SHARED SHOWDOWN"});
  el(doc,box,"button",{id:"continueSharedSetupGate",cls:"menuButton",text:"CONTINUE"});

  const league=doc.getElementById("leagueWheelScreen");
  el(doc,league,"h2",{text:"SELECT LEAGUE",attrs:{"data-route-focus-target":"true"}});
  const container=el(doc,league,"div",{cls:"wheelContainer"});
  el(doc,container,"div",{cls:"wheelPointer",text:"▼"});
  const wheel=el(doc,container,"div",{id:"leagueWheel",cls:"leagueWheel"});
  const track=el(doc,wheel,"div",{cls:"wheelTrack"});
  LEAGUES.forEach(([,name],index)=>{const item=el(doc,track,"div",{cls:"wheelItem",text:name});item.style.transform=`rotate(${index*72}deg)`;});
  el(doc,container,"div",{id:"selectedLeague",text:"Spin to select league",attrs:{role:"status","aria-live":"polite"}});
  const note=el(doc,container,"div",{id:"leagueStateNote",cls:"stateNote hidden"});note.textContent="";
  el(doc,container,"button",{id:"spinLeague",cls:"menuButton",text:"SPIN WHEEL",attrs:{type:"button"}});
  el(doc,container,"button",{cls:"backButton",text:"BACK",attrs:{type:"button","data-smart-back":""}});

  const club=doc.getElementById("clubWheelScreen");
  club.dataset.clubRevealStage="ready";
  el(doc,club,"h2",{text:"CLUB ASSIGNMENT",attrs:{"data-route-focus-target":"true"}});
  const shell=el(doc,club,"div",{cls:"clubAssignmentShell"});
  el(doc,shell,"strong",{id:"clubAssignmentLeague",text:"LaLiga"});
  el(doc,shell,"p",{id:"clubPackStatus",text:"Two sealed club packs ready"});
  const area=el(doc,shell,"div",{cls:"clubRevealArea"});
  for(const [n,who] of [["One","Daniel"],["Two","Nik"]]){
    const card=el(doc,area,"article",{id:`clubCard${n}`,cls:"clubRevealCard",data:{clubManager:n==="One"?"playerOne":"playerTwo"}});
    el(doc,card,"div",{id:`clubPlayer${n}`,cls:"clubManager",text:who});
    el(doc,card,"strong",{id:`clubName${n}`,text:"?"});
    el(doc,card,"span",{id:`clubCardState${n}`,cls:"clubCardState",text:"SEALED"});
  }
  el(doc,shell,"section",{id:"clubRivalryConfirmation",cls:"clubRivalryConfirmation hidden"});
  el(doc,shell,"button",{id:"openClubPack",cls:"menuButton",text:"OPEN SHOWDOWN PACKS",attrs:{type:"button"}});
  const cont=el(doc,shell,"button",{id:"continueClubAssignment",cls:"menuButton hidden",text:"CONFIRM RIVALRY & START SHOWDOWN",attrs:{type:"button"}});cont.disabled=true;
  el(doc,shell,"button",{id:"clubAssignmentBack",cls:"backButton",text:"BACK",attrs:{type:"button","data-smart-back":""}});

  const menu=doc.getElementById("mainMenu");
  el(doc,menu,"button",{id:"newShowdown",text:"NEW SHOWDOWN"});
  // Start/Join surfaces outside the screens (overlays and panels product code adds).
  const body=doc.body;
  const entry=el(doc,body,"div",{id:"productionSharedJourneyEntryOverlay",cls:"remoteJoiningOverlay hidden"});
  el(doc,entry,"div",{cls:"remoteJoiningShell"});
  const remote=el(doc,body,"div",{id:"sparkRemoteJoiningOverlay",cls:"remoteJoiningOverlay hidden"});
  el(doc,remote,"div",{cls:"remoteJoiningShell"});
  const pair=el(doc,body,"section",{id:"persistentNikDanielPairPanel"});
  el(doc,pair,"code",{id:"persistentNikDanielPairCode",text:"pair_test"});
  const settings=el(doc,body,"div",{id:"settingsOverlay",cls:"hidden"});
  const content=el(doc,settings,"div",{id:"settingsContent"});
  el(doc,content,"section",{id:"sparkConnectedAccountPanel"});
  const pairing=el(doc,content,"section",{id:"sparkPrivatePairingPanel"});
  el(doc,pairing,"input",{id:"sparkPrivatePairingCodeInput"});
  el(doc,content,"section",{id:"onlinePlayerIdentitySettingsPanel"});
  el(doc,body,"div",{id:"onlinePlayerIdentityOverlay",cls:"hidden"});
  el(doc,doc.getElementById("topHeader"),"div",{id:"onlinePlayerIdentityBadge",text:"SIGN IN"});
}

function makeApp(){
  const doc=new FakeDocument();
  const observers=[];
  const root={
    document:doc,console:{warn(...args){root.warnings.push(args);},error(){},log(){}},queueMicrotask,clearTimeout,
    setTimeout:(fn,ms)=>{const timer=setTimeout(fn,ms);if(timer.unref)timer.unref();return timer;},
    CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?init.detail:undefined;}},
    matchMedia:()=>({matches:false}),
    location:{search:""},calls:[],scripts:[],styles:[],errors:[],events:[],warnings:[],canonical:"mainMenu",observers,JSON,Promise
  };
  root.window=root;
  const appShell=doc.createElement("div");appShell.id="app";doc.body.appendChild(appShell);
  const header=doc.createElement("header");header.id="topHeader";appShell.appendChild(header);
  const main=doc.createElement("main");appShell.appendChild(main);
  for(const id of APP_SCREENS){const section=doc.createElement("section");section.id=id;section.className=id==="mainMenu"?"screen":"screen hidden";main.appendChild(section);}
  const loadingScreen=doc.createElement("section");loadingScreen.id="loadingScreen";loadingScreen.hidden=true;loadingScreen.classList.add("hidden");
  doc.body.appendChild(loadingScreen);
  buildSetupMarkup(doc,main);
  root.getActiveScreenName=()=>APP_SCREENS.find(id=>{const node=doc.getElementById(id);return node&&!node.classList.contains("hidden");})||null;
  root.showScreen=function(name){
    root.calls.push(["showScreen",name]);
    const target=doc.getElementById(name);if(!target)return false;
    for(const id of APP_SCREENS)if(id!==name)doc.getElementById(id).classList.add("hidden");
    target.classList.remove("hidden");return true;
  };
  root.navigateTo=async name=>{root.calls.push(["navigateTo",name]);return root.showScreen(name);};
  root.navigateBackSmart=()=>root.calls.push(["navigateBackSmart"]);
  root.openOptionalModule=async name=>{root.calls.push(["openOptionalModule",name]);return true;};
  root.resolveCanonicalShowdownRoute=()=>root.canonical;
  root.ensureGameplayModules=async()=>{};
  root.optionalAssetUrl=p=>`${p}?v=TEST`;
  root.reportApplicationError=(message,error)=>root.errors.push([message,error&&error.message]);
  const store=new Map();
  root.readStorageValue=key=>store.has(key)?store.get(key):null;
  root.writeStorageValue=(key,value)=>{store.set(key,String(value));return true;};
  // MutationObserver that records every target; the test triggers it the way the browser would after a mutation.
  root.MutationObserver=class{
    constructor(cb){this.cb=cb;this.targets=[];observers.push(this);}
    observe(target,options){this.targets.push([target,options||{}]);}
    disconnect(){this.targets=[];}
  };
  root.mutated=node=>{for(const observer of [...observers]){if(observer.targets.some(([target,options])=>target===node||(options.subtree&&target.contains(node))))observer.cb([]);}};
  root.loadRuntimeStyle=(key,href)=>{root.styles.push([key,href]);return Promise.resolve(true);};
  vm.createContext(root);
  root.run=file=>vm.runInContext(read(file),root,{filename:file});
  root.loadRuntimeScript=(key,p,ready)=>{
    if(typeof ready==="function"&&ready())return Promise.resolve(true);
    root.scripts.push(key+"|"+p);
    if(/^js\/[A-Za-z0-9]+\.js$/.test(p)||p.endsWith("navbar/navbar.js"))root.run(p);
    else if(p.endsWith("shared/stage.js"))root.ShowdownStage={};
    else if(p.endsWith("shared/motion.js"))root.sdEnter=()=>{};
    return Promise.resolve(true);
  };
  doc.addEventListener(EVENT,event=>root.events.push(event.detail&&event.detail.screen));
  return root;
}
async function installed(){
  const root=makeApp();
  await root.loadRuntimeScript("v10-screens","js/v10Screens.js",()=>Boolean(root.CareerModeV10Screens));
  root.CareerModeV10Screens.install();
  await flush();
  await root.loadRuntimeScript("v10-setup","js/v10Setup.js",()=>Boolean(root.CareerModeV10Setup));
  root.CareerModeV10Setup.install();
  await flush();
  return root;
}
const byId=(root,id)=>root.document.getElementById(id);
const topBar=root=>root.document.body.children.find(node=>node.classList.contains("sd-nav-top"))||null;
const isDecor=node=>{for(let n=node;n;n=n.parentNode)if(n.dataset&&n.dataset.v26Decor!==undefined)return true;return false;};
// Everything product code and the browser journey read: id, text, disabled, hidden, attributes, data-*, listeners.
function productSnapshot(root,{skipClassOf=[]}={}){
  const out=[];
  const visit=child=>{
    if(isDecor(child))return;
    const attrs=[...child.attrs.entries()].sort();
    const data=Object.entries(child.dataset).filter(([k])=>!/^v26/.test(k)).sort();
    const listeners=[...child.listeners.entries()].filter(([type])=>type!=="transitionend").map(([type,list])=>[type,list.length]);
    out.push(JSON.stringify([child.tagName,child.id,child.textContent,child.disabled,child.hidden,attrs,data,listeners,skipClassOf.includes(child)?null:child.className]));
    child.children.forEach(visit);
  };
  // The setup screens (the screen's own hidden class belongs to showScreen) and every Start/Join surface outside them.
  for(const host of screenHosts(root))host.children.forEach(visit);
  for(const id of Setup.TRUTH_IDS){const node=byId(root,id);if(node&&!screenHosts(root).some(host=>host.contains(node)))visit(node);}
  return out;
}
const screenHosts=root=>["createShowdown","leagueWheelScreen","clubWheelScreen"].map(id=>byId(root,id));
const withoutSkinClasses=root=>screenHosts(root).concat([...root.document.querySelectorAll(".wheelItem")]);
// What the shared presentation does (js/productionSharedShowdownPresentation.js): force a screen by class, no showScreen.
function forceScreen(root,name){
  for(const id of APP_SCREENS){const section=byId(root,id);const hide=id!==name;if(section.classList.contains("hidden")!==hide){section.classList.toggle("hidden",hide);root.mutated(section);}}
}

const Setup=require(path.join(ROOT,"js/v10Setup.js"));
const V10=require(path.join(ROOT,"js/v10Screens.js"));

check("S1 the skin API is small, frozen and points at Team V's copied files",()=>{
  for(const name of ["install","mount","unmount","syncLeague","announceScreen","leagueFromText","topIndex","packResult"])assert.equal(typeof Setup[name],"function",name);
  assert.ok(Object.isFrozen(Setup));
  assert.equal(Setup.BASE,V10.BASE);
  assert.equal(Setup.EVENT,V10.EVENT);
  assert.equal(Setup.SKIN_CLASS,SKIN);
  assert.deepEqual({...Setup.SCREENS},{createShowdown:"start",leagueWheelScreen:"league",dashboard:"start"});
  assert.ok(!Object.hasOwn(Setup.SCREENS,"clubWheelScreen"),"JOB-34: js/clubScreenV10.js owns the Club screen");
  assert.ok(!Object.hasOwn(Setup.HEROES,"club"),"no club heroes in the setup skin");
  assert.deepEqual([...Setup.STYLE],["v10-setup-ui","css/v10Setup.css"]);
  assert.deepEqual([...Setup.TRUTH_IDS],TRUTH_MD_IDS,"TRUTH ids as in start-join/TRUTH.md");
  for(const skin of Object.values(Setup.SCREENS))for(const who of ["daniel","nik"]){
    const file=Setup.BASE+Setup.HEROES[skin][who];
    assert.ok(Object.hasOwn(TEAM_V_FILES,file),file);
  }
  for(const [file,hash] of Object.entries(TEAM_V_FILES)){
    assert.ok(fs.existsSync(path.join(ROOT,file)),file);
    assert.equal(sha256(file),hash,`${file} is Team V's file unchanged`);
  }
  const css=read("css/v10Setup.css");
  const urls=[...css.matchAll(/url\("\.\.\/(visual-assets\/v10_1\/[^"]+)"\)/g)].map(m=>m[1]);
  assert.ok(urls.length>=10);
  for(const url of urls)assert.ok(Object.hasOwn(TEAM_V_FILES,url),`css references only copied Team V art: ${url}`);
});

check("S2 pure helpers: league from shown text, pointer index, pack result",()=>{
  for(const [id,name] of LEAGUES){assert.equal(Setup.leagueFromText(name),id);assert.equal(Setup.leagueFromText(` ${name.toUpperCase()} `),id);}
  for(const text of ["","Spin to select league","SPINNING...","Shared league wheel ready","LaLiga has been selected",null,undefined])assert.equal(Setup.leagueFromText(text),null,String(text));
  LEAGUES.forEach((_league,index)=>{
    assert.equal(Setup.topIndex(`rotate(${-index*72}deg)`),index);
    assert.equal(Setup.topIndex(`rotate(${-(1800+index*72)}deg)`),index,"after full turns");
  });
  assert.equal(Setup.topIndex(""),null);assert.equal(Setup.topIndex("none"),null);
  const card=(revealed)=>({classList:{contains:token=>revealed&&token==="is-revealed"}});
  assert.deepEqual({...Setup.packResult(card(false),{textContent:"?"},card(false),{textContent:"?"})},{playerOne:null,playerTwo:null});
  assert.deepEqual({...Setup.packResult(card(true),{textContent:"Barcelona"},card(false),{textContent:"?"})},{playerOne:"Barcelona",playerTwo:null});
  assert.deepEqual({...Setup.packResult(card(true),{textContent:" Barcelona "},card(true),{textContent:"Real Madrid"})},{playerOne:"Barcelona",playerTwo:"Real Madrid"});
});

check("S3 install registers the two setup screens with the loader (not the Club screen) and loads one stylesheet, once",async()=>{
  const root=await installed();
  root.CareerModeV10Setup.install();await flush();
  assert.deepEqual(root.styles,[["v10-setup-ui","css/v10Setup.css"]]);
  assert.equal(root.scripts.filter(s=>s.startsWith("v10-setup|")).length,1);
  assert.equal(root.CareerModeV10Screens.isMounted("createShowdown"),false,"nothing mounts on the menu");
  for(const id of Object.keys(Setup.SCREENS)){
    assert.throws(()=>root.CareerModeV10Screens.register(id,{frame:()=>({}),mount(){}}),/V10_SCREEN_DUPLICATE/,`${id} registered`);
  }
  // JOB-34: the Club screen is left for js/clubScreenV10.js, so its registration never collides with this skin's.
  assert.doesNotThrow(()=>root.CareerModeV10Screens.register("clubWheelScreen",{frame:()=>null,mount(){}}),"clubWheelScreen is free");
  assert.equal(root.document.documentElement.dataset.v10Setup,undefined);
  assert.deepEqual(root.errors,[]);
});

check("S4 every TRUTH.md id and every setup id survives mount and unmount; product text, state and listeners untouched",async()=>{
  const root=await installed();
  const ids=[...new Set([...Setup.TRUTH_IDS,...Setup.SETUP_IDS])];
  for(const id of ids)assert.ok(byId(root,id),`fixture has #${id}`);
  const skip=withoutSkinClasses(root);
  const before=productSnapshot(root,{skipClassOf:skip});
  for(const [screen,skin] of Object.entries(Setup.SCREENS)){
    assert.equal(root.showScreen(screen),true);await flush();
    const host=byId(root,screen);
    assert.equal(root.CareerModeV10Screens.isMounted(screen),true,`${screen} mounted`);
    assert.equal(host.classList.contains(SKIN),true);
    assert.equal(root.document.documentElement.dataset.v10Setup,skin);
    const art=host.children.filter(child=>child.classList.contains("v26Art"));
    assert.equal(art.length,1,"one decorative art layer");
    assert.equal(art[0].getAttribute("aria-hidden"),"true");
    assert.equal(art[0].children.length,2,"Daniel and Nik");
    assert.match(art[0].children[0].className,/v26Hero--daniel/,"Daniel left");
    assert.match(art[0].children[1].className,/v26Hero--nik/,"Nik right");
    assert.equal(art[0].children[0].children[0].getAttribute("srcset"),Setup.BASE+Setup.HEROES[skin].daniel);
    assert.equal(art[0].children[0].children[0].getAttribute("media"),"(max-width: 900px)","phone-only art; desktop uses the plate");
    for(const id of ids)assert.ok(byId(root,id),`#${id} after mounting ${screen}`);
    assert.deepEqual(productSnapshot(root,{skipClassOf:skip}),before,`${screen}: product nodes untouched`);
    // The second mount of the same frame is a no-op.
    root.showScreen(screen);await flush();
    assert.equal(host.children.filter(child=>child.classList.contains("v26Art")).length,1,"no double mount");
  }
  root.showScreen("mainMenu");await flush();
  for(const host of screenHosts(root)){
    assert.equal(host.classList.contains(SKIN),false);
    assert.equal(host.querySelectorAll("[data-v26-decor]").length,0,"decor removed on leave");
  }
  assert.equal(root.document.documentElement.dataset.v10Setup,undefined,"html attribute cleared on leave");
  for(const id of ids)assert.ok(byId(root,id),`#${id} after unmount`);
  const after=productSnapshot(root,{skipClassOf:skip});
  assert.equal(after.length,before.length,"no product node added or removed");
  assert.deepEqual(after,before,"product nodes identical after a full mount/unmount round");
  for(const host of screenHosts(root))assert.ok(!/v26/.test(host.className),`${host.id} skin classes gone`);
  assert.deepEqual(root.errors,[]);assert.deepEqual(root.warnings,[]);
});

check("S5 the wheel shows the provider's league only after the wheel stops; the skin never picks",async()=>{
  for(const [index,[providerId,providerName]] of LEAGUES.entries()){
    const root=await installed();
    const provider={league:{id:providerId,name:providerName}};// stub Shared Setup provider result
    root.showScreen("leagueWheelScreen");await flush();
    const host=byId(root,"leagueWheelScreen"),result=byId(root,"selectedLeague"),track=host.querySelector(".wheelTrack");
    const items=[...track.children];
    const selected=()=>items.filter(item=>item.classList.contains("v26-selected"));
    assert.deepEqual(selected(),[],"nothing highlighted before a spin");
    assert.equal(host.dataset.v26League,undefined);
    // The local wheel says SPINNING while it turns.
    result.textContent="SPINNING...";root.mutated(result);
    assert.deepEqual(selected(),[]);
    // The shared presentation writes the provider's league at once and animates the track for 4 s.
    track.dataset.leagueWheelAnimating="true";track.style.transform=`rotate(${-(1800+index*72)}deg)`;root.mutated(track);
    result.textContent=provider.league.name;root.mutated(result);
    assert.equal(host.classList.contains("v26-spinning"),true);
    assert.deepEqual(selected(),[],"wait for the result: no highlight while the wheel turns");
    assert.equal(items.filter(item=>item.classList.contains("v26-top")).length,0);
    assert.equal(host.querySelectorAll(".v26Flash").length,0,"no payoff mid-spin");
    // The wheel stops.
    delete track.dataset.leagueWheelAnimating;root.mutated(track);track.fire("transitionend");
    assert.equal(host.classList.contains("v26-spinning"),false);
    assert.deepEqual(selected().map(item=>item.textContent),[provider.league.name],"highlighted league equals the provider value");
    assert.equal(host.dataset.v26League,provider.league.id);
    assert.deepEqual(items.filter(item=>item.classList.contains("v26-top")).map(item=>item.textContent),[provider.league.name],"pointer item matches");
    assert.equal(result.textContent,provider.league.name,"the shown result is the product's own text, unchanged");
    assert.equal(host.querySelectorAll(".v26Flash").length,1,"payoff after the stop");
    assert.equal(host.querySelector(".v26Flash").getAttribute("aria-hidden"),"true");
    // Reload on a selected league (no spin observed): highlight, but no payoff replay.
    root.showScreen("mainMenu");await flush();
    assert.equal(host.querySelectorAll(".v26Flash").length,0,"payoff removed on leave");
    root.showScreen("leagueWheelScreen");await flush();
    assert.deepEqual(selected().map(item=>item.textContent),[provider.league.name]);
    assert.equal(host.querySelectorAll(".v26Flash").length,0,"no payoff without a spin");
    // A reset back to the prompt clears the highlight.
    result.textContent="Spin to select league";root.mutated(result);
    assert.deepEqual(selected(),[]);assert.equal(host.dataset.v26League,undefined);
    assert.deepEqual(root.warnings,[]);
  }
});

check("S6 the Club packs are no longer skinned here (JOB-34): revealing both packs leaves the product's screen to it",async()=>{
  // Updated in JOB-34: this check asserted the old v26 pack payoff (v26-packs-open / data-v26-packs). Team V's Club
  // Assignment (js/clubScreenV10.js) now owns the reveal look; the setup skin must not mount, mark or decorate it.
  const root=await installed();
  const provider={playerOne:"Barcelona",playerTwo:"Real Madrid"};// stub Shared Setup provider clubs (Daniel left, Nik right)
  root.showScreen("clubWheelScreen");await flush();
  const host=byId(root,"clubWheelScreen");
  assert.equal(root.CareerModeV10Screens.isMounted("clubWheelScreen"),false,"the setup skin does not mount the Club screen");
  const reveal=(n,club)=>{const card=byId(root,`clubCard${n}`),name=byId(root,`clubName${n}`);card.classList.add("is-revealed");root.mutated(card);name.textContent=club;root.mutated(name);};
  reveal("One",provider.playerOne);reveal("Two",provider.playerTwo);await flush();
  assert.ok(!/v26/.test(host.className),"no setup skin classes on the Club screen");
  assert.equal(host.dataset.v26Packs,undefined,"no setup pack marker");
  assert.equal(host.querySelectorAll("[data-v26-decor]").length,0,"no setup decoration");
  assert.equal(root.document.documentElement.dataset.v10Setup,undefined,"the setup look is off on the Club screen");
  assert.equal(byId(root,"clubNameOne").textContent,provider.playerOne);
  assert.equal(byId(root,"clubNameTwo").textContent,provider.playerTwo);
  assert.equal(byId(root,"clubPlayerOne").textContent,"Daniel");
  assert.equal(byId(root,"clubPlayerTwo").textContent,"Nik");
  assert.equal(host.dataset.clubRevealStage,"ready","the reveal stage stays the product's");
  // The pure pack helper stays available (and exact) for callers.
  assert.deepEqual({...Setup.packResult(byId(root,"clubCardOne"),byId(root,"clubNameOne"),byId(root,"clubCardTwo"),byId(root,"clubNameTwo"))},provider);
  root.showScreen("mainMenu");await flush();
  assert.ok(!/v26/.test(host.className));
});

check("S7 Back routes unchanged: every Back keeps data-smart-back, its text and the app's listeners",async()=>{
  const root=await installed();
  const backs=root.document.querySelectorAll(".backButton");
  assert.equal(backs.length,3);
  const smart=()=>backs.map(b=>JSON.stringify([b.id,b.textContent,b.getAttribute("data-smart-back"),b.getAttribute("type"),[...b.listeners.keys()],b.disabled,b.hidden]));
  const handler=()=>root.navigateBackSmart();
  for(const b of backs)b.addEventListener("click",handler);
  const before=smart();
  for(const screen of Object.keys(Setup.SCREENS)){root.showScreen(screen);await flush();assert.deepEqual(smart(),before,screen);}
  for(const b of backs){root.calls.length=0;b.fire("click");assert.deepEqual(root.calls,[["navigateBackSmart"]],"Back still runs the app's smart back only");}
  const src=read("js/v10Setup.js");
  for(const banned of ["smart-back","smartBack","navigateBack","navigateTo(","showScreen(","addEventListener(\"click\"","addEventListener('click'","onclick"])assert.ok(!src.includes(banned),`v10Setup.js never touches routing: ${banned}`);
});

check("S8 the top bar is locked (setup) on both wheels, also when the shared presentation forces a wheel",async()=>{
  const root=await installed();
  const StartJoin=require(path.join(ROOT,"js/startJoinViewModel.js"));
  for(const screen of ["leagueWheelScreen","clubWheelScreen"])assert.deepEqual({...StartJoin.navLockState(screen)},{locked:true,reason:"setup"});
  root.showScreen("leagueWheelScreen");await flush();
  assert.equal(topBar(root).dataset.locked,"true");assert.equal(topBar(root).dataset.lockReason,"setup");
  root.showScreen("createShowdown");await flush();
  assert.equal(topBar(root).dataset.locked,"false","Start/Join is not a locked step");
  // Forced by class only, as productionSharedShowdownPresentation.js does: the skin repeats the loader event.
  root.events.length=0;
  forceScreen(root,"leagueWheelScreen");await flush();
  assert.deepEqual(root.events,["leagueWheelScreen"],"one screen event for the forced wheel");
  assert.equal(root.CareerModeV10Screens.isMounted("leagueWheelScreen"),true);
  assert.equal(root.CareerModeV10Screens.isMounted("createShowdown"),false,"the previous screen unmounted");
  assert.equal(topBar(root).dataset.locked,"true","locked during the forced league wheel");
  assert.equal(topBar(root).dataset.lockReason,"setup");
  forceScreen(root,"clubWheelScreen");await flush();
  assert.deepEqual(root.events,["leagueWheelScreen","clubWheelScreen"]);
  // JOB-34: the forced Club screen is Team V's Club Assignment (js/clubScreenV10.js), not this skin.
  assert.equal(root.CareerModeV10Screens.isMounted("clubWheelScreen"),false,"the setup skin leaves the Club screen alone");
  assert.equal(root.CareerModeV10Screens.isMounted("leagueWheelScreen"),false,"the league wheel unmounted");
  assert.equal(byId(root,"leagueWheelScreen").classList.contains(SKIN),false);
  assert.equal(root.document.documentElement.dataset.v10Setup,undefined);
  assert.equal(topBar(root).dataset.locked,"true","locked during the forced club packs");
  // No duplicate event when the class flips without a screen change, nor after a real showScreen.
  root.mutated(byId(root,"clubWheelScreen"));await flush();
  assert.deepEqual(root.events,["leagueWheelScreen","clubWheelScreen"]);
  root.showScreen("dashboard");await flush();
  assert.deepEqual(root.events,["leagueWheelScreen","clubWheelScreen","dashboard"],"showScreen's own event, not repeated");
  assert.equal(topBar(root).dataset.locked,"false");
  // r61: Showdown Home wears the Start skin until Team V draws it.
  assert.equal(root.document.documentElement.dataset.v10Setup,"start");
  assert.equal(byId(root,"clubWheelScreen").classList.contains(SKIN),false);
});

check("S9 static guards: skin only, lazy only, no new storage, Rules, Firestore, scoring or revision change",()=>{
  const src=read("js/v10Setup.js");
  for(const banned of [".textContent=",".textContent =",".innerText",".innerHTML",".disabled=",".hidden=","removeAttribute(\"disabled\")","localStorage","sessionStorage","indexedDB","writeStorageValue","firestore","firebase","Firestore","RUNTIME_REVISION","scoring","Scoring","fetch(","Preview data","FIXTURE","fixture"])assert.ok(!src.includes(banned),`v10Setup.js: ${banned}`);
  const css=read("css/v10Setup.css");
  const rules=css.replace(/\/\*[\s\S]*?\*\//g,"");
  assert.ok(!/text-transform/.test(rules),"no text-transform on product text");
  for(const m of rules.matchAll(/(?:^|[;{\s])content\s*:\s*([^;]+);/g))assert.match(m[1].trim(),/^(""|none)$/,"generated content is empty decoration only");
  assert.ok(!/position\s*:\s*fixed/.test(rules),"nothing fixed over the controls");
  assert.ok(!/\.v26Skin\s+\*/.test(rules),"reduced motion never overrides the app's own motion rules wholesale (the photo audit wants 0s)");
  assert.ok(!/footballVisual(Media|MediaFrame)[^{]*\{[^}]*(transition|animation|opacity|object-fit)/.test(rules),"the licensed photo's image rules stay the app's");
  for(const m of rules.matchAll(/([^{}]*)\{([^{}]*)\}/g)){
    const [,selector,body]=m;
    if(/display\s*:\s*none/.test(body)){
      assert.ok(!/(button|menuButton|backButton|setupBox|wheelContainer|clubAssignmentShell|#spinLeague|#openClubPack|#startShowdown|selectedLeague|footballVisual)/.test(selector)||/(::before|::after|\.v26Art)/.test(selector),`never hides product controls or the licensed photographs: ${selector.trim()}`);
    }
  }
  // Lazy: only js/ssjr.js (idle) loads it; index.html and the startup scripts do not grow.
  const html=read("index.html");
  assert.ok(!html.includes("v10Setup"),"index.html does not load the skin");
  const ssjr=read("js/ssjr.js");
  assert.ok(ssjr.includes('load("v10-setup","js/v10Setup.js"'),"js/ssjr.js loads the skin");
  assert.match(ssjr,/requestIdleCallback\(v10Setup/);
  const sw=read("service-worker.js");
  for(const file of ["js/v10Setup.js","css/v10Setup.css"])assert.ok(sw.includes(`"${file}"`),`${file} in SHELL_PATHS`);
  for(const file of fs.readdirSync(path.join(ROOT,"js")).filter(f=>/^(productionShared|spark|persistentNikDanielPair)/.test(f)))assert.ok(!read(`js/${file}`).includes("v10Setup"),`${file} untouched by the skin`);
  for(const file of ["js/app.js","js/screens.js","js/storage.js","js/showdown.js","js/scoring.js","js/leagueWheel.js"])assert.ok(!read(file).includes("v10Setup"),`${file} untouched`);
  // Startup budget: the skin is not in the startup set.
  const startup=[...html.matchAll(/<script[^>]+src="([^"?]+)/g)].map(m=>m[1]);
  assert.ok(!startup.some(f=>/v10Setup/.test(f)));
  const gz=startup.filter(f=>fs.existsSync(path.join(ROOT,f))).reduce((sum,f)=>sum+zlib.gzipSync(fs.readFileSync(path.join(ROOT,f)),{level:9}).length,0);
  assert.ok(gz>0);
});

(async()=>{
  let n=0;
  for(const [name,fn] of checks){n+=1;await fn();console.log(`ok ${n} ${name}`);}
  console.log(`PASS v10 setup contracts: ${n} checks.`);
})().catch(error=>{console.error(error);process.exit(1);});

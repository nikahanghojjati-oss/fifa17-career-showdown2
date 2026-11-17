#!/usr/bin/env node
"use strict";
// G-13 part 2a (job 24) contract: the shared loader for Team V's screens (js/v10Screens.js), the top
// navigation bar and the image cache rule. The registry loads Team V's kit and each screen's files once,
// mounts a screen when the app shows it, unmounts it when the app leaves and never mounts the same frame
// twice. The bar follows NAV_CONTRACT.md (five tabs and the gear, active tab per screen, the real lock from
// js/startJoinViewModel.js, hidden on Loading). Team V images leave the install precache for a runtime
// cache keyed by RUNTIME_REVISION. index.html, the startup budget and RUNTIME_REVISION stay unchanged.
// Browser behaviour is checked by running the real files in a small fake DOM (node:vm), no network.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const zlib=require("node:zlib");
const crypto=require("node:crypto");
const {spawnSync}=require("node:child_process");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const sha256=file=>crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT,file))).digest("hex");
const checks=[];
const check=(name,fn)=>checks.push([name,fn]);
const flush=async(times=12)=>{for(let i=0;i<times;i+=1)await new Promise(resolve=>setImmediate(resolve));};

const EVENT="career-mode-screen-shown";
const LOCK_TEXT="Finish this step first";
const APP_SCREENS=["mainMenu","createShowdown","leagueWheelScreen","clubWheelScreen","dashboard","transferChallenge","seasonEntry","seasonSummary","statistics","careerStatistics","trophyRoom","legacy","ruleBook"];
// NAV_CONTRACT.md (Team V 5e05a1f): screen -> active key and where the phone bar shows.
const NAV_TABLE={
  mainMenu:["home","hub"],createShowdown:["career","hub"],legacy:["career","hub"],trophyRoom:["career","hub"],
  careerStatistics:["stats","hub"],statistics:["stats","hub"],ruleBook:["rules","hub"],
  leagueWheelScreen:["career","hidden"],clubWheelScreen:["career","hidden"],dashboard:["career","hidden"],
  transferChallenge:["career","hidden"],seasonEntry:["career","hidden"],seasonSummary:["career","hidden"]
};
const LOCKS={transferChallenge:"transfer-window",seasonEntry:"season-entry",leagueWheelScreen:"setup",clubWheelScreen:"setup"};

// ---- a small fake DOM: just enough for js/v10Screens.js, Team V's navbar.js and job 13's binder ----
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
  remove(){if(!this.parentNode)return;const siblings=this.parentNode.children;siblings.splice(siblings.indexOf(this),1);this.parentNode=null;}
  contains(node){for(let n=node;n;n=n.parentNode)if(n===this)return true;return false;}
  matches(selector){
    if(selector==="[data-nav-key]")return this.dataset.navKey!==undefined;
    if(selector.startsWith("#"))return this.id===selector.slice(1);
    if(selector.startsWith("."))return this.classList.contains(selector.slice(1));
    return this.tagName===selector.toUpperCase();
  }
  closest(selector){for(let node=this;node instanceof FakeElement;node=node.parentNode)if(node.matches(selector))return node;return null;}
  querySelectorAll(selector){const out=[];const walk=el=>{for(const child of el.children){if(child.matches(selector))out.push(child);walk(child);}};walk(this);return out;}
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
  connected(node){
    if(node.tagName!=="LINK"||node.fired)return;
    node.fired=true;
    if(!this.slowLinks){node.sheet={};queueMicrotask(()=>node.fire("load"));return;}
    // Like Chromium: a stylesheet disabled while it is still loading drops its request and never loads.
    let disabled=node.disabled;node.sheet=null;node.dropped=false;
    Object.defineProperty(node,"disabled",{get:()=>disabled,set:value=>{if(value&&!node.sheet)node.dropped=true;disabled=Boolean(value);}});
    this.pendingLinks.push(node);
  }
  settleLinks(){const list=this.pendingLinks.splice(0);for(const node of list)if(!node.dropped){node.sheet={};node.fire("load");}return list;}
  createElement(tag){return new FakeElement(this,tag);}
  getElementById(id){const walk=el=>{for(const child of el.children){if(child.id===id)return child;const found=walk(child);if(found)return found;}return null;};return walk(this.documentElement);}
  querySelector(selector){return selector==="body"?this.body:this.documentElement.querySelector(selector);}
  querySelectorAll(selector){return this.documentElement.querySelectorAll(selector);}
  addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push(fn);}
  removeEventListener(type,fn){const list=this.listeners.get(type)||[];const index=list.indexOf(fn);if(index>=0)list.splice(index,1);}
  dispatchEvent(event){for(const fn of [...(this.listeners.get(event.type)||[])])fn(event);return true;}
}

function makeApp({loading=false}={}){
  const doc=new FakeDocument();
  const observers=[];
  const root={
    document:doc,console:{warn(){},error(){},log(){}},queueMicrotask,clearTimeout,
    setTimeout:(fn,ms)=>{const timer=setTimeout(fn,ms);if(timer.unref)timer.unref();return timer;},
    CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?init.detail:undefined;}},
    location:{search:""},calls:[],scripts:[],boots:[],errors:[],events:[],canonical:"mainMenu",observers,JSON,Promise
  };
  root.window=root;
  const appShell=doc.createElement("div");appShell.id="app";doc.body.appendChild(appShell);
  const header=doc.createElement("header");header.id="topHeader";appShell.appendChild(header);
  const main=doc.createElement("main");appShell.appendChild(main);
  for(const id of APP_SCREENS){const section=doc.createElement("section");section.id=id;section.className=id==="mainMenu"?"screen":"screen hidden";main.appendChild(section);}
  const loadingScreen=doc.createElement("section");loadingScreen.id="loadingScreen";
  if(!loading){loadingScreen.hidden=true;loadingScreen.classList.add("hidden");}
  doc.body.appendChild(loadingScreen);
  root.getActiveScreenName=()=>APP_SCREENS.find(id=>{const el=doc.getElementById(id);return el&&!el.classList.contains("hidden");})||null;
  root.showScreen=function(name){
    root.calls.push(["showScreen",name]);
    const target=doc.getElementById(name);if(!target)return false;
    const current=root.getActiveScreenName();
    if(current&&current!==name)doc.getElementById(current).classList.add("hidden");
    target.classList.remove("hidden");return true;
  };
  root.navigateTo=async name=>{root.calls.push(["navigateTo",name]);return root.showScreen(name);};
  root.openOptionalModule=async name=>{root.calls.push(["openOptionalModule",name]);return true;};
  root.resolveCanonicalShowdownRoute=()=>root.canonical;
  root.ensureGameplayModules=async()=>{root.calls.push(["ensureGameplayModules"]);};
  root.openTransferChallenge=()=>{root.calls.push(["openTransferChallenge"]);};
  root.prepareClubAssignment=()=>{root.calls.push(["prepareClubAssignment"]);};
  root.optionalAssetUrl=p=>`${p}?v=TEST`;
  root.reportApplicationError=(message,error)=>root.errors.push([message,error&&error.message]);
  root.fetch=async()=>({ok:true,json:async()=>({plate:"test"})});
  const store=new Map();
  // storage.js's own helpers (startup file): the only storage path js/v10Screens.js may use.
  root.readStorageValue=key=>store.has(key)?store.get(key):null;
  root.writeStorageValue=(key,value)=>{root.calls.push(["writeStorageValue",key]);store.set(key,String(value));return true;};
  root.MutationObserver=class{constructor(cb){this.cb=cb;this.el=null;observers.push(this);}observe(el){this.el=el;}disconnect(){this.el=null;}};
  root.endLoading=()=>{loadingScreen.hidden=true;loadingScreen.classList.add("hidden");for(const o of observers)if(o.el===loadingScreen)o.cb([]);};
  vm.createContext(root);
  root.run=file=>vm.runInContext(read(file),root,{filename:file});
  root.loadRuntimeScript=(key,p,ready)=>{
    if(typeof ready==="function"&&ready())return Promise.resolve(true);
    root.scripts.push(key+"|"+p);
    if(/^js\/[A-Za-z0-9]+\.js$/.test(p)||p.endsWith("navbar/navbar.js"))root.run(p);
    else if(p.endsWith("shared/stage.js"))root.ShowdownStage={};
    else if(p.endsWith("shared/motion.js"))root.sdEnter=()=>{};
    else if(p.endsWith("career-statistics/career-statistics.js"))root.ShowdownCareerStatisticsBoot=()=>root.boots.push(["careerStatistics",JSON.stringify(root.CAREER_STATISTICS_FIXTURES.frames.LIVE)]);
    else if(p.endsWith("trophy-room/trophy-room.js"))root.ShowdownTrophyRoomBoot=()=>root.boots.push(["trophyRoom",JSON.stringify(root.TROPHY_ROOM_FIXTURES.frames.LIVE)]);
    else if(p.endsWith("test/dash.js"))root.V10TestDash=true;
    return Promise.resolve(true);
  };
  doc.addEventListener(EVENT,event=>root.events.push(event.detail&&event.detail.screen));
  return root;
}
async function installed(options){
  const root=makeApp(options);
  await root.loadRuntimeScript("v10-screens","js/v10Screens.js",()=>Boolean(root.CareerModeV10Screens));
  root.CareerModeV10Screens.install();
  await flush();
  return root;
}
const links=root=>root.document.head.children.filter(el=>el.tagName==="LINK");
const linkFor=(root,file)=>links(root).find(el=>el.getAttribute("data-v10-style")===file);
const navButtons=(root,key)=>root.document.querySelectorAll("[data-nav-key]").filter(b=>b.dataset.navKey===key);
const topBar=root=>root.document.body.children.find(el=>el.classList.contains("sd-nav-top"))||null;
async function tap(root,key){
  const target=topBar(root).querySelectorAll("[data-nav-key]").find(b=>b.dataset.navKey===key);
  assert.ok(target,`top bar has ${key}`);
  for(const fn of [...(root.document.listeners.get("click")||[])])fn({target,preventDefault(){}});
  await flush();
}

const V10=require(path.join(ROOT,"js/v10Screens.js"));
const KIT_STYLES=V10.KIT.styles.map(file=>V10.BASE+file);

check("F1 the loader API is small and fixed",()=>{
  for(const name of ["install","ensureKit","register","show","hide","invalidate","isMounted","navFor","navigate","setNavRoute"])assert.equal(typeof V10[name],"function",name);
  assert.equal(V10.BASE,"visual-assets/v10_1/");
  assert.equal(V10.EVENT,EVENT);
  assert.deepEqual([...V10.KIT.styles],["shared/showdown-tokens.css","shared/showdown-type.css","shared/showdown-ui.css","shared/stage.css","shared/motion.css"]);
  assert.deepEqual(V10.KIT.scripts.map(s=>s[1]),["shared/stage.js","shared/motion.js"]);
  assert.deepEqual(V10.NAV.tabs,["home","career","standings","stats","rules"]);
  for(const file of [...V10.KIT.styles,...V10.KIT.scripts.map(s=>s[1]),V10.NAV.style,V10.NAV.script[1]])assert.ok(fs.existsSync(path.join(ROOT,V10.BASE,file)),file);
  assert.ok(fs.existsSync(path.join(ROOT,V10.NAV.shellStyle)));
  assert.ok(Object.isFrozen(V10));
});

check("F2 registry: kit, CSS, JS and prepare load once; mount on screen change, unmount on leave, no double mount",async()=>{
  const root=await installed();
  const V=root.CareerModeV10Screens;
  const mounts=[];let unmounts=0,prepared=0,frame={id:1};
  V.register("dashboard",{css:["test/dash.css"],js:[["v10-test-dash","test/dash.js",()=>Boolean(root.V10TestDash)]],prepare:async()=>{prepared+=1;},frame:()=>frame,mount:(f,host)=>mounts.push([f.id,host.id]),unmount:host=>{unmounts+=1;assert.equal(host.id,"dashboard");}});
  assert.throws(()=>V.register("dashboard",{frame:()=>frame,mount(){}}),/V10_SCREEN_DUPLICATE/);
  assert.throws(()=>V.register("",{frame:()=>frame,mount(){}}),/V10_SCREEN_ID/);
  assert.throws(()=>V.register("legacy",{mount(){}}),/V10_SCREEN_DEFINITION/);
  assert.equal(mounts.length,0,"registering does not mount a hidden screen");
  assert.equal(root.showScreen("dashboard"),true);
  await flush();
  assert.deepEqual(mounts,[[1,"dashboard"]],"mounted when the app shows the screen");
  assert.equal(V.isMounted("dashboard"),true);
  assert.equal(await V.show("dashboard"),true);
  root.showScreen("dashboard");await flush();
  assert.equal(mounts.length,1,"the same frame never mounts twice");
  frame={id:2};
  assert.equal(await V.show("dashboard"),true);
  assert.deepEqual(mounts.at(-1),[2,"dashboard"],"a new frame redraws");
  root.showScreen("mainMenu");await flush();
  assert.equal(unmounts,1,"unmounted when the app leaves");
  assert.equal(V.isMounted("dashboard"),false);
  assert.equal(await V.show("dashboard"),false,"show() never mounts a screen the app is not showing");
  root.showScreen("dashboard");await flush();
  assert.equal(mounts.length,3,"remounted on return");
  V.invalidate("dashboard");
  assert.equal(V.isMounted("dashboard"),false,"invalidate forgets the drawn frame");
  assert.equal(await V.show("dashboard"),true);
  assert.deepEqual(mounts.at(-1),[2,"dashboard"],"after invalidate the same frame draws again");
  assert.equal(mounts.length,4);
  root.showScreen("mainMenu");await flush();
  assert.equal(unmounts,2);
  V.invalidate("dashboard");
  assert.equal(await V.show("dashboard"),false,"invalidate never draws a screen the app is not showing");
  root.showScreen("dashboard");await flush();
  assert.equal(mounts.length,5);
  assert.equal(prepared,1);
  assert.equal(root.scripts.filter(s=>s.startsWith("v10-test-dash|")).length,1,"screen JS loaded once");
  for(const key of ["career-v10-stage","career-v10-motion","v10-navbar","start-join-view-model"])assert.equal(root.scripts.filter(s=>s.startsWith(key+"|")).length,1,`${key} loaded once`);
  const hrefs=links(root).map(l=>l.getAttribute("data-v10-style"));
  assert.equal(new Set(hrefs).size,hrefs.length,"every stylesheet link created once");
  for(const file of [...KIT_STYLES,V10.BASE+"test/dash.css"])assert.ok(hrefs.includes(file),file);
  assert.equal(linkFor(root,V10.BASE+"test/dash.css").href,V10.BASE+"test/dash.css?v=TEST","loader CSS carries the shell revision");
  V.register("seasonSummary",{frame:()=>null,mount:()=>mounts.push(["null"])});
  root.showScreen("seasonSummary");await flush();
  assert.equal(mounts.some(m=>m[0]==="null"),false,"a null frame keeps the app's own screen");
  assert.equal(await V.show("ruleBook"),false,"unregistered screens are left alone");
  assert.deepEqual(root.errors,[]);
});

// JOB-1635 C-1: a Team V sheet is switched off through its loaded CSSStyleSheet (link.sheet.disabled), never link.disabled,
// because Chromium drops a disabled link's sheet and fetches it again on enable (labels blanked on every return to Home).
// A link without a sheet yet is left alone, so link.disabled stays false for it.
const sheetOff=link=>link.sheet?link.sheet.disabled===true:link.disabled===true;

check("F3 Team V styles are on only while a mounted Team V screen is visible",async()=>{
  const root=await installed();
  const V=root.CareerModeV10Screens;
  V.register("dashboard",{css:["test/dash.css"],frame:()=>({}),mount(){},unmount(){}});
  const always=[V10.BASE+"shared/showdown-tokens.css",V10.BASE+V10.NAV.style,V10.NAV.shellStyle];
  for(const file of always)assert.equal(sheetOff(linkFor(root,file)),false,`${file} on with the bar`);
  root.showScreen("dashboard");await flush();
  for(const file of [...KIT_STYLES,V10.BASE+"test/dash.css"])assert.equal(sheetOff(linkFor(root,file)),false,`${file} on while mounted`);
  root.showScreen("mainMenu");await flush();
  for(const file of [...KIT_STYLES.filter(f=>!always.includes(f)),V10.BASE+"test/dash.css"])assert.equal(sheetOff(linkFor(root,file)),true,`${file} off after leaving`);
  for(const file of always)assert.equal(sheetOff(linkFor(root,file)),false,`${file} stays on`);
});

check("F3b a stylesheet toggled while loading is never dropped; it ends with the wanted state and its sheet",async()=>{
  const root=await installed();
  const V=root.CareerModeV10Screens,doc=root.document;
  doc.slowLinks=true;doc.pendingLinks=[];
  V.register("dashboard",{css:["test/dash.css"],frame:()=>({}),mount(){},unmount(){}});
  root.showScreen("dashboard");await flush();
  const kit=KIT_STYLES.filter(file=>file!==V10.BASE+"shared/showdown-tokens.css");
  for(const file of kit)assert.ok(doc.pendingLinks.includes(linkFor(root,file)),`${file} still loading`);
  root.showScreen("mainMenu");await flush();
  root.showScreen("seasonEntry");await flush();
  for(const file of kit){const link=linkFor(root,file);assert.equal(link.dropped,false,`${file} not dropped by a screen change`);assert.equal(link.disabled,false,`${file} left alone while loading`);}
  doc.settleLinks();await flush();
  for(const file of kit){const link=linkFor(root,file);assert.ok(link.sheet,`${file} loaded`);assert.equal(sheetOff(link),true,`${file} off once loaded: no Team V screen shows`);}
  while(doc.pendingLinks.length){doc.settleLinks();await flush();}
  root.showScreen("dashboard");await flush();
  while(doc.pendingLinks.length){doc.settleLinks();await flush();}
  assert.equal(V.isMounted("dashboard"),true);
  for(const file of [...kit,V10.BASE+"test/dash.css"]){const link=linkFor(root,file);assert.equal(link.dropped,false,file);assert.ok(link.sheet,`${file} sheet loaded`);assert.equal(sheetOff(link),false,`${file} on while shown`);}
  assert.deepEqual(root.errors,[]);
});

check("F3c a Team V screen that is still loading keeps Team V's page look: no old header, background or sheets in between",async()=>{
  const root=await installed();
  const V=root.CareerModeV10Screens,html=root.document.documentElement;
  let release=null;
  V.register("dashboard",{css:["test/dash.css"],frame:()=>({}),mount(){},unmount(){}});
  V.register("transferChallenge",{css:["test/transfer.css"],prepare:()=>new Promise(resolve=>{release=resolve;}),frame:()=>({}),mount(){},unmount(){}});
  V.register("seasonSummary",{frame:()=>null,mount(){}});
  root.showScreen("dashboard");await flush();
  assert.equal(html.dataset.v10Screen,"dashboard");
  root.showScreen("transferChallenge");await flush();
  assert.equal(V.isMounted("transferChallenge"),false,"still loading");
  assert.equal(html.dataset.v10Screen,"transferChallenge","the loading screen keeps html[data-v10-screen] (css/v10Shell.css header, footer and page base)");
  for(const file of KIT_STYLES)assert.equal(sheetOff(linkFor(root,file)),false,`${file} stays on while the next Team V screen loads`);
  release();await flush();
  assert.equal(V.isMounted("transferChallenge"),true);
  assert.equal(html.dataset.v10Screen,"transferChallenge");
  root.showScreen("seasonSummary");await flush();
  assert.equal(html.dataset.v10Screen,undefined,"a null frame (app's own screen) ends the Team V page look once settled");
  root.showScreen("mainMenu");await flush();
  assert.equal(html.dataset.v10Screen,undefined,"an unregistered screen has no Team V page look");
  assert.deepEqual(root.errors,[]);
});

check("F4 one showScreen hook dispatches career-mode-screen-shown; the app's result is unchanged",async()=>{
  const root=makeApp();
  const original=root.showScreen;
  await root.loadRuntimeScript("v10-screens","js/v10Screens.js",()=>Boolean(root.CareerModeV10Screens));
  root.CareerModeV10Screens.install();root.CareerModeV10Screens.install();
  assert.notEqual(root.showScreen,original);
  assert.equal(root.showScreen.original,original,"wrapped exactly once");
  assert.equal(root.showScreen("dashboard"),true);
  assert.equal(root.showScreen("noSuchScreen"),false);
  assert.deepEqual(root.events,["dashboard"],"one event per successful screen change, none on failure");
  assert.deepEqual(root.calls.filter(c=>c[0]==="showScreen").map(c=>c[1]),["dashboard","noSuchScreen"]);
  const screens=read("js/screens.js");
  assert.ok(!screens.includes(EVENT)&&!screens.includes("v10"),"screens.js (startup) is not edited");
});

check("F5 the bar has five tabs and the gear; routes call the app's own navigation",async()=>{
  const root=await installed();
  const top=topBar(root);
  assert.ok(top,"desktop bar mounted after start-up");
  assert.equal(root.document.body.firstChild,top,"bar sits at the top of the page, outside the app shell");
  assert.deepEqual(top.querySelectorAll("[data-nav-key]").map(b=>b.dataset.navKey),["home","career","standings","stats","rules","settings"]);
  const bottom=root.document.body.children.find(el=>el.classList.contains("sd-nav-bottom"));
  assert.deepEqual(bottom.querySelectorAll("[data-nav-key]").map(b=>b.dataset.navKey),["home","career","standings","stats","rules"]);
  assert.ok(root.document.body.children.some(el=>el.classList.contains("sd-nav-corner")),"phone gear");
  assert.equal(root.document.getElementById("topHeader").classList.contains("sd-nav"),false,"the app header is not adopted");
  assert.equal(top.getAttribute("role"),"none","the bar is not a second banner next to #topHeader");
  assert.equal(top.getAttribute("aria-label"),null);
  const tabsRow=top.querySelector(".sd-nav-tabs");
  assert.equal(tabsRow.tagName,"NAV");
  assert.equal(tabsRow.getAttribute("aria-label"),"Primary","the tabs stay one navigation landmark");
  const expectRoute=async(key,setup,expected)=>{
    root.showScreen("mainMenu");setup();await flush();root.calls.length=0;
    await tap(root,key);
    assert.deepEqual(root.calls.filter(c=>c[0]!=="showScreen"),expected,key);
  };
  await expectRoute("career",()=>{root.canonical="dashboard";},[["navigateTo","dashboard"]]);
  await expectRoute("career",()=>{root.canonical="mainMenu";},[["navigateTo","mainMenu"]]);
  await expectRoute("career",()=>{root.canonical="transferChallenge";},[["ensureGameplayModules"],["openTransferChallenge"]]);
  await expectRoute("career",()=>{root.canonical="clubWheelScreen";},[["ensureGameplayModules"],["prepareClubAssignment"]]);
  await expectRoute("standings",()=>{root.canonical="dashboard";},[["navigateTo","dashboard"]]);
  await expectRoute("stats",()=>{},[["openOptionalModule","careerStatistics"]]);
  await expectRoute("rules",()=>{},[["openOptionalModule","ruleBook"]]);
  await expectRoute("settings",()=>{},[["openOptionalModule","settings"]]);
  root.showScreen("ruleBook");await flush();root.calls.length=0;
  await tap(root,"home");
  assert.deepEqual(root.calls.filter(c=>c[0]!=="showScreen"),[["navigateTo","mainMenu"]]);
  root.calls.length=0;await tap(root,"home");
  assert.deepEqual(root.calls,[],"the active tab tap does nothing");
  root.CareerModeV10Screens.setNavRoute("standings",app=>app.openOptionalModule("standings"));
  root.showScreen("mainMenu");await flush();root.calls.length=0;
  await tap(root,"standings");
  assert.deepEqual(root.calls,[["openOptionalModule","standings"]],"a later job can point a tab at its own screen");
  assert.throws(()=>root.CareerModeV10Screens.setNavRoute("about",()=>{}),/V10_NAV_ROUTE_UNKNOWN/);
  assert.deepEqual(root.errors,[]);
});

check("F6 the active tab and the phone bar follow NAV_CONTRACT on every app screen",async()=>{
  const root=await installed();
  for(const [screen,[active,mode]] of Object.entries(NAV_TABLE)){
    assert.deepEqual({...V10.navFor(screen)},{active,locked:Boolean(LOCKS[screen]),reason:LOCKS[screen]||null,mode},`navFor ${screen}`);
    root.showScreen(screen);await flush();
    for(const button of root.document.querySelectorAll("[data-nav-key]")){
      assert.equal(button.getAttribute("aria-current"),button.dataset.navKey===active?"page":null,`${screen}: ${button.dataset.navKey}`);
    }
    assert.equal(root.document.documentElement.dataset.nav,mode,`${screen} data-nav`);
  }
  assert.deepEqual(Object.keys(NAV_TABLE).sort(),[...APP_SCREENS].sort(),"every app screen is mapped");
  assert.equal(V10.navFor("standings").active,"standings");
  assert.equal(V10.navFor("standings").mode,"hub");
  assert.equal(V10.navFor("mainMenu",true).mode,"none","Loading hides the bar");
});

check("F7 the lock comes from startJoinViewModel; a locked tap shows the toast and does not navigate",async()=>{
  const StartJoin=require(path.join(ROOT,"js/startJoinViewModel.js"));
  const root=await installed();
  for(const [screen,reason] of Object.entries(LOCKS)){
    assert.deepEqual({...StartJoin.navLockState(screen)},{locked:true,reason});
    root.showScreen(screen);await flush();
    const top=topBar(root);
    assert.equal(top.dataset.locked,"true",screen);
    assert.equal(top.dataset.lockReason,reason,screen);
    for(const button of top.querySelectorAll("[data-nav-key]"))if(button.dataset.navKey!=="career")assert.equal(button.getAttribute("aria-disabled"),"true",`${screen} ${button.dataset.navKey}`);
    root.calls.length=0;
    for(const key of ["home","standings","stats","rules","settings"])await tap(root,key);
    assert.deepEqual(root.calls,[],`${screen}: locked taps never navigate`);
    const toast=root.document.body.children.find(el=>el.classList.contains("sd-nav-toast"));
    assert.equal(toast.textContent,LOCK_TEXT);
    assert.equal(toast.classList.contains("is-on"),true);
  }
  assert.equal(StartJoin.NAV_LOCK_TEXT,LOCK_TEXT);
  root.showScreen("dashboard");await flush();
  assert.equal(topBar(root).dataset.locked,"false","unlocked again outside the locked steps");
});

// r87 (Reus Gate: Loading stays until the next screen is ready): the bar used to load only after Loading had gone, so Home
// showed for a moment without it. It now mounts behind Loading, hidden by html[data-nav="none"], and shows as Loading leaves.
check("F8 the bar mounts hidden behind Loading and shows once Loading leaves",async()=>{
  const root=await installed({loading:true});
  await flush();
  assert.equal(root.document.documentElement.dataset.nav,"none","the bar stays hidden while Loading shows");
  assert.ok(topBar(root),"the bar is mounted behind Loading, so it is ready when Home is handed over");
  assert.equal(typeof V10.mountNav,"function","js/ssjr.js waits on the bar through mountNav()");
  root.endLoading();await flush();
  assert.ok(topBar(root),"the bar is there once Loading is gone");
  assert.equal(root.document.documentElement.dataset.nav,"hub");
  const css=read(V10.NAV.shellStyle);
  assert.match(css,/html\[data-nav="hub"\] #app/,"phone hub screens keep room for the bottom bar");
  assert.match(css,/min-width:\s*901px/,"desktop keeps room for the top bar");
  // The shell CSS never hides app elements. Since r85 this file also styles the music player, which hides its own pieces;
  // every display:none rule must target only the shell's own music dock/sheet/tab or a Team V stage decoration layer.
  const hiding=[...css.replace(/\/\*[\s\S]*?\*\//g,"").matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m=>/display:\s*none/.test(m[2])).map(m=>m[1].trim().replace(/\s+/g," "));
  assert.ok(hiding.length>0,"the music player rules are found");
  // Each hidden target is checked on its own: top-level commas split the rule, the last compound is the element hidden, and
  // an :is() list there is split again (Codex #1115: ".cmsMusicDock, #app" must not pass because one branch is allowed).
  const splitTop=text=>{const out=[];let depth=0,cur="";for(const ch of text){if(ch==="("||ch==="[")depth+=1;else if(ch===")"||ch==="]")depth-=1;if(ch===","&&depth===0){out.push(cur.trim());cur="";}else cur+=ch;}if(cur.trim())out.push(cur.trim());return out;};
  const lastCompound=text=>{let depth=0;for(let i=text.length-1;i>=0;i-=1){const ch=text[i];if(ch===")"||ch==="]")depth+=1;else if(ch==="("||ch==="[")depth-=1;else if(depth===0&&/[\s>+~]/.test(ch))return text.slice(i+1).trim();}return text.trim();};
  const targets=selector=>splitTop(selector).flatMap(branch=>{const last=lastCompound(branch),is=/^:is\((.*)\)$/.exec(last);return is?splitTop(is[1]).map(inner=>`${branch.slice(0,branch.length-last.length)}${lastCompound(inner)}`):[branch];});
  const allowed=/\.cmsMusic(?:Dock|Sheet|SheetShield|Tab)\b|\.sd-stage__layer--|^\.cmsMusicDock(?:Text|Disc|Open)\b/;
  const ownPiece=/(?:^|\s)\.cmsMusic|\.sd-stage__layer--/;
  // Named app-element exceptions, each a reviewed decision (exact selector, so nothing broader slips in):
  // r87 sweep P-01: Home leaves out the redundant "SHOWDOWN COMPLETE" reconnect note that sat under its chips on phones.
  const APPROVED_APP_HIDES=new Set(['html[data-v10-screen="mainMenu"] #app > #sharedJourneyReconnectStatus[data-closed-notice="true"]']);
  for(const selector of hiding)for(const target of targets(selector)){
    if(APPROVED_APP_HIDES.has(target))continue;
    const element=lastCompound(target);
    assert.ok(allowed.test(element)||(ownPiece.test(target)&&/^(?:\.[\w-]+|small|span)(?:\[[^\]]*\])*$/.test(element)),`the shell CSS hides only its own music pieces or Team V decoration, not: ${target} (in ${selector})`);
  }
  for(const bad of [".cmsMusicDock, #app",".cmsMusicDock :is(.cmsMusicDockText, #mainMenu)","#app #careerStatistics.careerScreenV10"])
    assert.ok(targets(bad).some(target=>{const element=lastCompound(target);return !(allowed.test(element)||(ownPiece.test(target)&&/^(?:\.[\w-]+|small|span)(?:\[[^\]]*\])*$/.test(element)));}),`self-check: ${bad} is caught`);
});

check("F9 images use a runtime cache keyed by RUNTIME_REVISION; the precache keeps only kit, fonts, CSS and JS",()=>{
  const sw=read("service-worker.js"),html=read("index.html");
  const revision=/const RUNTIME_REVISION = "([^"]+)";/.exec(sw)[1];
  assert.equal(revision,"2.7.0-r94","RUNTIME_REVISION is the current release (r94, 2.7.0-r94)");
  assert.equal(/const PREVIOUS_RUNTIME_REVISION = "([^"]+)";/.exec(sw)[1],"2.6.0-r93");
  assert.equal(/app-asset-revision"\s+content="([^"]+)/.exec(html)[1],revision);
  const shell=JSON.parse(/const SHELL_PATHS\s*=\s*Object\.freeze\((\[[\s\S]*?\])\);/.exec(sw)[1]);
  const v10=shell.filter(p=>p.startsWith("visual-assets/v10_1/"));
  assert.deepEqual(v10.filter(p=>/\.(webp|png|jpe?g|avif|gif|svg)$/i.test(p)),[],"no Team V image in the install precache");
  for(const file of [...V10.KIT.styles,...V10.KIT.scripts.map(s=>s[1]),V10.NAV.style,V10.NAV.script[1]])assert.ok(shell.includes(V10.BASE+file),`precache ${file}`);
  for(const file of fs.readdirSync(path.join(ROOT,"visual-assets/v10_1/shared/fonts")))assert.ok(shell.includes("visual-assets/v10_1/shared/fonts/"+file),`precache font ${file}`);
  for(const file of ["js/v10Screens.js","js/startJoinViewModel.js","js/careerScreensV10.js",V10.NAV.shellStyle])assert.ok(shell.includes(file),`precache ${file}`);
  assert.match(sw,/const V10_IMAGE_CACHE_PREFIX = "career-mode-showdown-v10-images-";/);
  assert.match(sw,/const V10_IMAGE_CACHE_NAME = `\$\{V10_IMAGE_CACHE_PREFIX\}\$\{RUNTIME_REVISION\}`;/,"runtime cache name includes the revision");
  assert.ok(!"career-mode-showdown-v10-images-".startsWith("career-mode-showdown-shell-"),"image cache is never mistaken for a shell revision");
  const pattern=new RegExp(/const V10_IMAGE_PATH = \/(.+)\/i;/.exec(sw)[1],"i");
  for(const p of ["visual-assets/v10_1/trophy-room/assets/ENV_TR_PHONE_V1.webp","visual-assets/v10_1/shared/trophies/TRO_CONTINENTAL_V1_512.webp","visual-assets/v10_1/home/assets/x.png"])assert.ok(pattern.test(p),p);
  for(const p of ["visual-assets/v10_1/shared/stage.css","visual-assets/v10_1/shared/fonts/barlow-latin-400-normal.woff2","assets/marco-reus-2015-cc-by.webp","visual-assets/v10_1/trophy-room/assets/platemap.json"])assert.ok(!pattern.test(p),p);
  const fetchBlock=/self\.addEventListener\("fetch"[\s\S]*?\n\}\);/.exec(sw)[0];
  assert.ok(fetchBlock.indexOf("isV10ImagePath(path)")>0&&fetchBlock.indexOf("isV10ImagePath(path)")<fetchBlock.indexOf('url.searchParams.get("v")'),"image rule runs before the versioned shell lookup");
  const imageFn=/async function v10ImageResponse[\s\S]*?\n\}/.exec(sw)[0];
  assert.ok(imageFn.indexOf("cache.match(")<imageFn.indexOf("fetch("),"cache-first");
  assert.match(imageFn,/cache\.put\(/,"filled on first view");
  assert.match(imageFn,/response\.ok/,"only good responses are kept");
  const activate=/self\.addEventListener\("activate"[\s\S]*?\n/.exec(sw)[0];
  assert.match(activate,/name\.startsWith\(V10_IMAGE_CACHE_PREFIX\)&&!keepImageCaches\.has\(name\)/,"other revisions' image caches are cleared");
  assert.match(activate,/keepImageCaches=new Set\(\[V10_IMAGE_CACHE_NAME,recovery\.ok\?v10ImageCacheName\(recovery\.revision\):""\]/,"the recovery revision's image cache is kept");
  assert.ok(activate.includes("!keepShellCaches.has(name)"),"shell cleanup unchanged");
  for(const p of shell)assert.ok(fs.existsSync(path.join(ROOT,p)),`shell path exists ${p}`);
});

// Runs the real service worker against in-memory caches.
function swWorld(){
  const SCOPE="https://cms.test/app/",store=new Map(),listeners={},net=new Map();let online=true;
  const keyOf=k=>typeof k==="string"?k:k.url;
  const caches={
    keys:async()=>[...store.keys()],
    delete:async name=>store.delete(name),
    open:async name=>{if(!store.has(name))store.set(name,new Map());const m=store.get(name);return{match:async k=>{const r=m.get(keyOf(k));return r?r.clone():undefined;},put:async(k,r)=>{m.set(keyOf(k),r);}};}
  };
  const fetch=async request=>{if(!online)throw new TypeError("offline");const body=net.get(new URL(keyOf(request)).pathname);const r=body===undefined?new Response("",{status:404}):new Response(body,{status:200});return Object.defineProperty(r,"type",{value:"basic"});};
  const self={registration:{scope:SCOPE},clients:{claim:async()=>{}},addEventListener:(type,fn)=>{listeners[type]=fn;}};
  const context=vm.createContext({self,caches,fetch,URL,Request,Response,console,setTimeout,clearTimeout});
  vm.runInContext(read("service-worker.js"),context,{filename:"service-worker.js"});
  const diag=self.__CMS_SERVICE_WORKER_DIAGNOSTICS__;
  const fill=revision=>{const m=new Map();for(const p of (revision===diag.previousRevision?diag.previousShellPaths:diag.shellPaths)){const u=new URL(p,SCOPE);u.searchParams.set("v",revision);m.set(u.href,new Response(p,{status:200}));}store.set("career-mode-showdown-shell-"+revision,m);return m;};
  const dispatch=async(type,event)=>{const waits=[];listeners[type]({waitUntil:p=>waits.push(p),...event});await Promise.all(waits);};
  const image=async path=>{let reply,waits=[];listeners.fetch({request:new Request(SCOPE+path),respondWith:p=>{reply=p;},waitUntil:p=>waits.push(p)});assert.ok(reply,"the worker answers "+path);const r=await reply;await Promise.all(waits);return r.type==="error"?null:{status:r.status,body:await r.text()};};
  return{SCOPE,store,net,diag,fill,dispatch,image,setOnline:v=>{online=v;}};
}

check("F9b a rollback keeps its own Team V images (offline too); other old image caches are cleared",async()=>{
  const w=swWorld(),cur=w.diag.revision,prev=w.diag.previousRevision,IMG="career-mode-showdown-v10-images-";
  assert.equal(cur,"2.7.0-r94");assert.equal(prev,"2.6.0-r93");
  w.fill(cur);const prevShell=w.fill(prev);
  const art="visual-assets/v10_1/trophy-room/assets/ENV_TR_PHONE_V1.webp",only="visual-assets/v10_1/career-statistics/assets/ENV_CS_PLATE_V1_1X.webp";
  // An older revision precached the art in its shell; the retained shell still has it.
  const legacyKey=new URL(only,w.SCOPE);legacyKey.searchParams.set("v",prev);prevShell.set(legacyKey.href,new Response("prev-shell-art",{status:200}));
  const put=(revision,p,body)=>{if(!w.store.has(IMG+revision))w.store.set(IMG+revision,new Map());w.store.get(IMG+revision).set(w.SCOPE+p,new Response(body,{status:200}));};
  put(cur,art,"r75-art");put(prev,art,"r74-art");put("1.9.1-r50",art,"r50-art");
  await w.dispatch("activate",{});
  const names=[...w.store.keys()];
  assert.ok(names.includes(IMG+cur),"current image cache kept");
  assert.ok(names.includes(IMG+prev),"recovery image cache kept with its retained shell");
  assert.ok(!names.includes(IMG+"1.9.1-r50"),"other old image caches cleared");
  w.net.set("/app/"+art,"network-art");w.net.set("/app/"+only,"network-art");
  assert.deepEqual(await w.image(art),{status:200,body:"r75-art"},"current revision: its own image cache first");
  let reply;await w.dispatch("message",{data:{type:"CMS_ROLLBACK_TO_PREVIOUS"},ports:[{postMessage:m=>{reply=m;}}]});
  assert.equal(reply&&reply.ok,true,"rollback accepted");assert.equal(reply.revision,prev);
  w.setOnline(false);
  assert.deepEqual(await w.image(art),{status:200,body:"r74-art"},"offline rollback: the retained revision's art, not the newer one");
  assert.deepEqual(await w.image(only),{status:200,body:"prev-shell-art"},"offline rollback: art the retained shell precached");
  w.setOnline(true);
  const fresh="visual-assets/v10_1/trophy-room/assets/NEW_ONLY.webp";w.net.set("/app/"+fresh,"net-fresh");
  assert.deepEqual(await w.image(fresh),{status:200,body:"net-fresh"});
  assert.ok(w.store.get(IMG+prev).has(w.SCOPE+fresh),"a rollback fills its own revision's image cache");
  assert.ok(!w.store.get(IMG+cur).has(w.SCOPE+fresh),"generations never mix");
});

// The image cache fills lazily, so a retained revision may later fetch art it never cached. That is only safe
// because a Team V image path names one generation: the file name carries _V<n> and its bytes never change.
// Changed art must ship under a new name (e.g. _V2), and a new image is added here with its hash.
const V10_IMAGES={
    "visual-assets/v10_1/final-winner/assets/OVL_FW_DANIEL_NEAR_ARM_V1_1X.webp":"18a581a0ec32c33d19a08aff36358d5dce9b4dbe0302f0548dd7ddb4ecdb7212",
    "visual-assets/v10_1/final-winner/assets/OVL_FW_DANIEL_NEAR_ARM_V1_2X.webp":"40b7b86bb6c39bfb16c0dc1e319871785b4302b6c95146f2884e4322b4b25b1f",
    "visual-assets/v10_1/final-winner/assets/OVL_FW_DANIEL_NEAR_ARM_V1_RIM_1X.webp":"d54b778870667c5c6d424ad32944aac2f5af497396f510cb73b00d7ad49ab4d5",
    "visual-assets/v10_1/final-winner/assets/OVL_FW_DANIEL_NEAR_ARM_V1_RIM_2X.webp":"26d51d864ed7f0f7657e17f114cc4b71c74f5cd460a42dba1fdd633f8e02c38b",
    "visual-assets/v10_1/final-winner/assets/OVL_FW_NIK_NEAR_ARM_V1_1X.webp":"2dc939ef69db2538f355c76aa44793a94c4e3cd78c6b4dd5fecc262b527ff32d",
    "visual-assets/v10_1/final-winner/assets/OVL_FW_NIK_NEAR_ARM_V1_2X.webp":"e5effdba662ac7c64c6ea708c55480bbc632555dca8177d26cf61e0206a2bbcb",
    "visual-assets/v10_1/final-winner/assets/OVL_FW_NIK_NEAR_ARM_V1_RIM_1X.webp":"bc9dddb26ca68849289adc258f6874b38697240add668b03f1d2a2ce7e0268e3",
    "visual-assets/v10_1/final-winner/assets/OVL_FW_NIK_NEAR_ARM_V1_RIM_2X.webp":"25a80d3776c07ea4f888359d889e0d383876cac8d5a898bfa2b0d96869021d2a",
    "visual-assets/v10_1/rivalry-statistics/assets/ENV_RV_PHONE_V1.webp":"e6ed2862c6afd5861cd2962b856c2e41b0e7499848bf98d19fb017e8968572d0",
    "visual-assets/v10_1/rivalry-statistics/assets/ENV_RV_PLATE_V1_1X.webp":"c207d7a0dce3bc176b1b88b8903ab35bf772acf71c5b30ca4ef92be88e6f4c0c",
    "visual-assets/v10_1/rivalry-statistics/assets/ENV_RV_PLATE_V1_2X.webp":"a599c8e67e8b1c68add7d71a7425b9ddfacc11fb67a420e59624b661e3fca98f",
    "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_DANIEL_PHONE_V1.webp":"5fef27e91d3565f6e69f32facff8039589094d7325afb289bf3d753a546a8bf6",
    "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_NIK_PHONE_V1.webp":"9791dbb9ab97188cce419c0543302e2e36ba53da717a141e757febc00e48282d",
    "visual-assets/v10_1/season-results/assets/ENV_SR_PHONE_V1.webp":"b18b451edca11d75c3f7fbb21bcf2840b1cc6b79f2b593e085858cef0e645ac1",
    "visual-assets/v10_1/season-results/assets/ENV_SR_PLATE_V1_1X.webp":"00d5ae4b55138933d5394530d3dfda8bd644d84b137f552c4bd80ad9e027194d",
    "visual-assets/v10_1/season-results/assets/ENV_SR_PLATE_V1_2X.webp":"65b119a557c1f5f295ecfd957c4ec2642bca095f1625709b3a71473e35d58715",
    "visual-assets/v10_1/season-results/assets/OVL_SR_DANIEL_HAND_V1_1X.webp":"64ac1923c763edd8a4254cbd081c396e96acd9f3873cbab8c0490fff8d0aa480",
    "visual-assets/v10_1/season-results/assets/OVL_SR_DANIEL_HAND_V1_2X.webp":"3b8959027c693cfc48253774a3284188dc68a497aa59d4e7ba90ab1c96760ae9",
    "visual-assets/v10_1/season-results/assets/OVL_SR_DANIEL_PHONE_V1.webp":"bd02b632e6fb01d83af98cf50cf1c644738a1cbc488c1fae7ba39083fa24b3a1",
    "visual-assets/v10_1/season-results/assets/OVL_SR_NIK_HAND_V1_1X.webp":"6d8dc385be64d0deb9218f217c042b8ec50a3ecab0aaf8ef8d2ab98f8a92c736",
    "visual-assets/v10_1/season-results/assets/OVL_SR_NIK_HAND_V1_2X.webp":"80417b11c23b06b911b01c0f3c802bcf5cc7ad519a815522f9f652eea1e1def2",
    "visual-assets/v10_1/season-results/assets/OVL_SR_NIK_PHONE_V1.webp":"b49c2e29e327d4cf5c747f64fa4ae18df31ee001c5c297febe08a03a77850bcb",
    "visual-assets/v10_1/season-results/assets/TITLE_SR_PHONE_V2_480.webp":"8a5de0e115201c4510d684093122e63156d801bbe01f12165baa66378253ed2a",
    "visual-assets/v10_1/season-results/assets/TITLE_SR_PHONE_V2_960.webp":"08eedb7acbd087c39dd767579b31fd1d121a732d42b56650e74e6fe84760c7fd",
    "visual-assets/v10_1/season-results/assets/TITLE_SR_PHONE_V2_1920.webp":"5a8922474e840816782fadc531be3f3763cc7fac38ca23186b25f607d9eb0f08",
    "visual-assets/v10_1/season-results/assets/TITLE_SR_PHONE_V2_3840.webp":"ffd51c8ce1a6d2cce6aea29c7ca515ff5f31217d193f448d3d74f0edca84f90b",
    "visual-assets/v10_1/season-results/assets/TITLE_SR_V2_480.webp":"9964a3f13d7705d7a798794e58838c9cd4395077f340b983d39c77519f67b6b3",
    "visual-assets/v10_1/season-results/assets/TITLE_SR_V2_960.webp":"05baba7fd092da3b8c77d9afd37f82a480a5f3394e24f986a0d45d1cb84d8415",
    "visual-assets/v10_1/season-results/assets/TITLE_SR_V2_1920.webp":"71c37edaefc0dd3d20085d7d30c50a8a4f63d246c8e5237dd0288e8a3ee637fe",
    "visual-assets/v10_1/season-results/assets/TITLE_SR_V2_3840.webp":"1f52478bf22fde2d07ca2828f38ae7c2d69a9114c6e3a170752829c254d4fbd4",
    "visual-assets/v10_1/shared/wordmarks/TITLE_FINAL_WINNER_V2_480.webp":"7ecfef6cd984e4f9e8b2ce680d68caa72c5193febf3b01e37f6666993a32942c",
    "visual-assets/v10_1/shared/wordmarks/TITLE_FINAL_WINNER_V2_960.webp":"b9093ab7e8ae3daa3251d88a99305c2a7a592ba9d3d8c42b782679dd4828b880",
    "visual-assets/v10_1/shared/wordmarks/TITLE_FINAL_WINNER_V2_1920.webp":"9be2f90620d00aa0ff046a34eb30be174eacb0a7a39cabb20e7bba63530d6a12",
    "visual-assets/v10_1/shared/wordmarks/TITLE_FINAL_WINNER_V2_3840.webp":"7395ea62ffe2e4d3294e1a7628679b8f458e6801895d8ec875458e9bd8a19be0",
    "visual-assets/v10_1/shared/wordmarks/TITLE_SHOWDOWN_DRAW_V2_480.webp":"436b9c8d81a4f36f80a12ac4c03279464e7bf1f3c9ecb175a5ec5475fb560379",
    "visual-assets/v10_1/shared/wordmarks/TITLE_SHOWDOWN_DRAW_V2_960.webp":"c8bc57678ef20715e16c50da89d3c3c0ad4dc9c3b81d7c562914f3d96cf3b563",
    "visual-assets/v10_1/shared/wordmarks/TITLE_SHOWDOWN_DRAW_V2_1920.webp":"4dbb4fee70fd6f8930cfe8653878591d0f295b12c22de92417df6334ac32e295",
    "visual-assets/v10_1/shared/wordmarks/TITLE_SHOWDOWN_DRAW_V2_3840.webp":"bf9f9e1d77adca7594884c60f5d0aca77710d0da3c2f82a13e7e32df8507e2a9",
    "visual-assets/v10_1/shared/wordmarks/TITLE_STANDINGS_V1.webp":"adbf6ee3214a535b2d96cd12bd40110178ecae0e01cf53cd5eb17dde646e3807",
    "visual-assets/v10_1/shared/wordmarks/TITLE_STANDINGS_V2_480.webp":"0d0a949a8b8cb9f1872a000d9f8eb63dd96a6d4a515e5d8cb861741c9fed3ee8",
    "visual-assets/v10_1/shared/wordmarks/TITLE_STANDINGS_V2_960.webp":"73801e04bc0cabb7e2268facefa530993e53d608c597c688fe88c575edd2c6bc",
    "visual-assets/v10_1/shared/wordmarks/TITLE_STANDINGS_V2_1920.webp":"6bcef865ae294623ed41b865f0125b788fb30e847ae7700d47c00165e4173fca",
    "visual-assets/v10_1/shared/wordmarks/TITLE_STANDINGS_V2_3840.webp":"6c96f4601ba6ee09f681d93c0a0725708ac9ed4ffcc6da6b35759efd13ed8282",

    "visual-assets/v10_1/career-statistics/assets/ENV_CS_PLATE_V1_1X.webp":"77759cb0ff818bb674ae45f5431f6e5976b3724de98923f47521b0f59fcec352",
    "visual-assets/v10_1/career-statistics/assets/ENV_CS_PLATE_V1_2X.webp":"740e753cd4a6360a42658f5a1cd7c70ba848c05ed580a906f0333ecbd29149b9",
    "visual-assets/v10_1/career-statistics/assets/OVL_CS_DANIEL_CROSSED_ARMS_V1_1X.webp":"a9bf051efc756f37fff4b2836f3f67a2f205e12054779e633f8c0cba4708fbb1",
    "visual-assets/v10_1/career-statistics/assets/OVL_CS_DANIEL_CROSSED_ARMS_V1_2X.webp":"0f4802b0aa50f6f932d2ed18a49b90decb567dfb7d4f9abd73c52e23c52a992d",
    "visual-assets/v10_1/career-statistics/assets/OVL_CS_DANIEL_CROSSED_ARMS_V1_RIM_1X.webp":"e51ce1190a73458dfab2c51e8663834be8e1ff831e8e915c9e3061fea732775a",
    "visual-assets/v10_1/career-statistics/assets/OVL_CS_DANIEL_CROSSED_ARMS_V1_RIM_2X.webp":"a64f2bfebadef2966c59b1f598d0d5abe955888aa5b22c6c17116ee04c936148",
    "visual-assets/v10_1/career-statistics/assets/TITLE_CS_V2_480.webp":"a58df0fab83e2c777c81498d511046b4ba50754965e693f82ddf4dae44299b01",
    "visual-assets/v10_1/career-statistics/assets/TITLE_CS_V2_960.webp":"06b707f708e5eb58dd661261478078c97455ae13051a883ed233f9dcf2774a71",
    "visual-assets/v10_1/career-statistics/assets/TITLE_CS_V2_1920.webp":"6805859a771c0433f5bad7fcc47adec46805051f78fab8b81c3a02bec7e6cd5e",
    "visual-assets/v10_1/career-statistics/assets/TITLE_CS_V2_3840.webp":"615f4a8b7a2ed0a22a4c234682e98b7ee326c01f4bd760fe2289c0b97b1c1991",
    "visual-assets/v10_1/shared/trophies/TRO_CONTINENTAL_V1_512.webp":"15f47694e512f5f1555f3f1b919b0ab0203edd8544cd65b249c98277a28c2175",
    "visual-assets/v10_1/shared/trophies/TRO_CONTINENTAL_V1_1536.webp":"ab2cebbb5913bbe4ac39c4117c86a8f2261a8c23dfbaa5a5a79c886e0f5e760a",
    "visual-assets/v10_1/shared/trophies/TRO_DOMESTIC_CUP_V1_512.webp":"78280e1c2ef82e1945d029f5bccb537c28670fbb92ae19a662fd3611af377d08",
    // r80 Europa League trophy (Team V HO-034, factory/v1-wtt5ye b6928ba4) and the CONNECT PLAYERS title (HO-033).
    "visual-assets/v10_1/shared/trophies/TRO_EUROPA_V1_512.webp":"8dd3147c1100ece7289ab7569a1cbbd20d823193c8ee255eb63cf91fb73d2030",
    "visual-assets/v10_1/shared/trophies/TRO_EUROPA_V1_1536.webp":"9bdfbee3a11c2d725ec477601e58050da5e955d4805eadeff14a1cdf408069c7",
    "visual-assets/v10_1/shared/wordmarks/TITLE_CONNECT_PLAYERS_V2_480.webp":"492ee6110c62fa8bc616638855d47f4682ea11b06af1c2d611c75e1b330843d5",
    "visual-assets/v10_1/shared/wordmarks/TITLE_CONNECT_PLAYERS_V2_960.webp":"73be40e929d82541f4956dd022b6a0da567d196d159de4f704f20c0258f185d5",
    "visual-assets/v10_1/shared/wordmarks/TITLE_CONNECT_PLAYERS_V2_1920.webp":"a778c761aba635d62aaebf5d80f11cdcb4c878f8d1fb6c1e436e5b896e296144",
    "visual-assets/v10_1/shared/wordmarks/TITLE_CONNECT_PLAYERS_V2_3840.webp":"fd93dce4143d4c315c8ac29ba79ea06ecdc432df0a264cddf0b9a56fc41c179f",
    "visual-assets/v10_1/shared/trophies/TRO_DOMESTIC_CUP_V1_1536.webp":"7c34ab65edc761bdea2f34a0b562c5c6296bf224be46ab82dad3ba58d49f1c34",
    "visual-assets/v10_1/shared/trophies/TRO_LEAGUE_TITLE_V1_512.webp":"39c65012fa627c67371fa5676a6d696a81dbb54b80621730d83b2b15ae5b6796",
    "visual-assets/v10_1/shared/trophies/TRO_LEAGUE_TITLE_V1_1536.webp":"863b4a6352de12bfa8e5e3965331b179e5f1890d5f242451088e152ef6f8ac57",
    "visual-assets/v10_1/shared/trophies/TRO_SHOWDOWN_CHAMPION_V1_512.webp":"c3ba71260b758a1a437d32a73fe44d367f05d177a0687468cf28fdb25172bad5",
    "visual-assets/v10_1/shared/trophies/TRO_SHOWDOWN_CHAMPION_V1_1536.webp":"78aade32ab68277c696c93c0a0db965e2b0073349ba95a04b97863997a5bcce1",
    "visual-assets/v10_1/trophy-room/assets/ENV_TR_PHONE_V1.webp":"40eaa9d2ef35dacca131285f4b3a83dcf5556927ff82e6e92dda732daa780fda",
    "visual-assets/v10_1/trophy-room/assets/ENV_TR_PLATE_V1_1X.webp":"abfbcb1884700ee0cddbfb0cbe4384dd31164745ab388d30f8f6128e67260b70",
    "visual-assets/v10_1/trophy-room/assets/ENV_TR_PLATE_V1_2X.webp":"a2c6badc9148094d880ab671e4b35298fe7d5cc65ecc9875f0228b151455f8cc",
    "visual-assets/v10_1/trophy-room/assets/OVL_TR_DANIEL_PHONE_V1.webp":"ba883f14116d1257ba8876fd18b92847b7955536e31c6e3154b743089036d7d6",
    "visual-assets/v10_1/trophy-room/assets/OVL_TR_NIK_PHONE_V1.webp":"850352f3eb1db2f79c0ba8e5df447cde9b5a3371e7fa29e14dee1e3e989e3959",
    "visual-assets/v10_1/trophy-room/assets/TITLE_TR_V2_480.webp":"49e0178b0128d431fd8a2104ea00f9ca69612219dbe47546d8b84c2a2108d43b",
    "visual-assets/v10_1/trophy-room/assets/TITLE_TR_V2_960.webp":"6ceceb76590eae3cad5a495894e5a18639fb88bb560397446d3c8eee9c08eccc",
    "visual-assets/v10_1/trophy-room/assets/TITLE_TR_V2_1920.webp":"2fef444748d61e3db6f471d395a82080d8fea98c34b56e2ad6dec6944d116344",
    "visual-assets/v10_1/trophy-room/assets/TITLE_TR_V2_3840.webp":"d9554a6378676bb5f823e52994f55f0f3d61d05963eb97167e230e40ef22caee",
    // job 25: Team V Home (5e05a1f)
    "visual-assets/v10_1/home/assets/ENV_HOME_PLATE_V1_1X.webp":"3c35391805507bf8910f36f98147cd8383e4944eeb999021661d6d7030d30c39",
    "visual-assets/v10_1/home/assets/ENV_HOME_PLATE_V1_2X.webp":"aed61ed9d6e10cbaead7251539e188101bc1371d83639b2ab6953dae875274f9",
    "visual-assets/v10_1/home/assets/LOGO_CM17_WORDMARK_V1.webp":"d72524228798c02bd9c22750da3743099768a80b3ef904a21d8243a1f6dccda6",
    // HO-005 (V-243, factory 2daf437): phone overlays without the ghost coat
    "visual-assets/v10_1/home/assets/OVL_HOME_DANIEL_PHONE_V2.webp":"9c2bde331c0025b69d9122b0dc8e76200b914e2d10dc4e1f476525562f825193",
    "visual-assets/v10_1/home/assets/OVL_HOME_NIK_PHONE_V2.webp":"8b65513283e570a8a66a6de8762369f33354d751764e2dbf71f715338bddf374",
    // r90 W8: half-size copies of the Home pictures (same art, resized; picked by srcset/sizes in js/homeScreensV10.js).
    "visual-assets/v10_1/home/assets/LOGO_CM17_WORDMARK_V1_640W.webp":"dbf609b9c826e36ad277b74d1bd3f810b7b18a4d3808bfc3274d02d969304729",
    "visual-assets/v10_1/shared/trophies/TRO_LEAGUE_TITLE_V1_512_170W.webp":"f1cc7d72e6eac28e48fa7989c272c20729a79512ad09b77e70f70f2d161ca885",
    // job 26 (Start/Join, League wheel, Club packs): Team V 5e05a1f, unchanged
    "visual-assets/v10_1/club/assets/ENV_CLUB_PHONE_V1.webp":"b31092d3eac35a9851d9c51406dd0cf7972e2dd9a5a8adb83c78d4a27497ba2a",
    "visual-assets/v10_1/club/assets/ENV_CLUB_PLATE_V1_1X.webp":"398e74faeb18ab2df655122fa0f78e9737aad4c1eff1ba16d019a305f275c255",
    "visual-assets/v10_1/club/assets/ENV_CLUB_PLATE_V1_2X.webp":"fed849bbb2c9f239ae1561f57eb5b145e0e33a518fb7bfd0e424691c00cfd6ca",
    // job 34 (Club Assignment hand and seam overlays): Team V 5e05a1f, unchanged
    "visual-assets/v10_1/club/assets/OVL_CLUB_DANIEL_SIDE_HAND_V1_1X.webp":"8cf447697e04040380835f6a30ef4d53260e4f7961cab270ca1581862127c5e4",
    "visual-assets/v10_1/club/assets/OVL_CLUB_DANIEL_SIDE_HAND_V1_2X.webp":"fbfedd9e8d0ad7e897c15a3be5b705ecc3dacf4999e09129752df4888deff401",
    "visual-assets/v10_1/club/assets/OVL_CLUB_DANIEL_TOP_HAND_V1_1X.webp":"37a25414eb5127375b4a935c5cbba2940a0caf6ecb92e1e0317a17708092621f",
    "visual-assets/v10_1/club/assets/OVL_CLUB_DANIEL_TOP_HAND_V1_2X.webp":"bcf8d24932a09082f291dd95ebb718c97c104379ab7a1f61c9bfc197f18201f8",
    "visual-assets/v10_1/club/assets/OVL_CLUB_HAND_CONTACTS_V1_1X.webp":"6c00713b7e5dec204635375345f696071dd9534f18f578ca99ecfa668475861d",
    "visual-assets/v10_1/club/assets/OVL_CLUB_HAND_CONTACTS_V1_2X.webp":"d8a64e75d6333f0696de3777f313ffb40b6be609f9636f242b84429dc7a6ca8b",
    "visual-assets/v10_1/club/assets/OVL_CLUB_HAND_CORES_V1_1X.webp":"5bdbf18b8900bb9d6c080a9ac6fc2b42fdb417ab5af36112af68127cba134a9e",
    "visual-assets/v10_1/club/assets/OVL_CLUB_HAND_CORES_V1_2X.webp":"6b71c92e3fc17a06f5f0197536e0c4342afa229fdfaef32e12cddb4de59b8bb0",
    "visual-assets/v10_1/club/assets/OVL_CLUB_NIK_SIDE_HAND_V1_1X.webp":"fe33377f87fabd6bd268a09c1c4df2e0e17a61fc7f3efbb4750d381b9f1f1b0d",
    "visual-assets/v10_1/club/assets/OVL_CLUB_NIK_SIDE_HAND_V1_2X.webp":"bc23936920cca3332ce6e3c2f2651ff4754b4f2813262b52f88a3c41a99dac0a",
    "visual-assets/v10_1/club/assets/OVL_CLUB_NIK_TOP_HAND_V1_1X.webp":"cccde87a5cd3f90f63bfb9c760cd3d2d029c71d049019a72dfe9576e711059aa",
    "visual-assets/v10_1/club/assets/OVL_CLUB_NIK_TOP_HAND_V1_2X.webp":"8d538cfddfa18b5bd4ed5b5ce906e0dfcbfa563254a892563d98700143a9f480",
    "visual-assets/v10_1/club/assets/OVL_CLUB_SEAM_MENDS_V1_1X.webp":"e6e319db851454ffeda0575cf200ab57f01f5e3c0ac899a31ec3d38aa5440de4",
    "visual-assets/v10_1/club/assets/OVL_CLUB_SEAM_MENDS_V1_2X.webp":"eeb99a2738616e634bf96795209d810f7ac6474556318b2e1975dcaafea9e9a1",
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
    // r78 phone marble: Team V's marble phone plates for Rule Book and Settings (factory/v1-wtt5ye, byte-identical)
    "visual-assets/v10_1/plates-v2/ENV_RULE_BOOK_PHONE_V2.webp":"f96fe2a45130a645ff23a8df9e442cd6b9f6109adc1ea95211ae0c6cc8c28ee1",
    "visual-assets/v10_1/plates-v2/ENV_SETTINGS_PHONE_V2.webp":"231ce815b711bfaef2828d67364da9e96981c9fa5ef0dcdc7bb5324b0ea1c30b",
    "visual-assets/v10_1/plates-v2/ENV_CLUB_PHONE_V2.webp":"f1c490adad469e3f05dde6252b2f0455a11c468b3240f8d6dfebd34146b0c587",
    "visual-assets/v10_1/plates-v2/ENV_CONNECT_PLAYERS_PHONE_V2.webp":"732622aff75137caa540a00067df4350ddf656524bcfb0fbfefe92301ff1c3c5",
    "visual-assets/v10_1/plates-v2/ENV_FINAL_WINNER_PHONE_V2.webp":"88fbfc43316dc1e0fbff0f33b19492c7d08a513570c7c4c2252c982cb40894ee",
    "visual-assets/v10_1/plates-v2/ENV_HOME_PHONE_V2.webp":"cd4b34aabebfb465a3a9c06bf60393c4759cbbd59ebc67717a68960baec7535c",
    "visual-assets/v10_1/plates-v2/ENV_LEGACY_PHONE_V2.webp":"bfead87a57094e6f9cd91f298a75a16b11dd8a366ac04a3f47eb86d6482cef5e",
    "visual-assets/v10_1/plates-v2/ENV_SEASON_RESULTS_PHONE_V2.webp":"ed01d6eb56ced42b1488ff37c88d1d28958b567522432ba3e238b89d0e0d3165",
    "visual-assets/v10_1/plates-v2/ENV_STATISTICS_PHONE_V2.webp":"f7c92fa6efbb3479269ae11813062317945fe408011ac0974dbd2b2d767f8888",
    "visual-assets/v10_1/plates-v2/ENV_TRANSFER_PHONE_V2.webp":"a9018f31d4b4e29323638833ceb813361e60b616f1210b8fd5fa749e7358c325",
    "visual-assets/v10_1/plates-v3/ENV_RIVALRY_PHONE_V3.webp":"c73f720b9d5bb7f594651049e7ba37520b3a27d8a2c655c2dd25a7c3fd85deca",
    "visual-assets/v10_1/plates-v3/ENV_STANDINGS_PHONE_V3.webp":"4650eb4249225ca7f0d78e296f785773aebbe44a5ea14f3623f6ec9eac35211c",
    "visual-assets/v10_1/plates-v3/ENV_TROPHY_ROOM_PHONE_V3.webp":"c28f11124a9a4558b40299f86d9f7f34df37bd47c6576dc1addc05ec17a07504",
    "visual-assets/v10_1/plates-v5/ENV_LEAGUE_PHONE_V5.webp":"b29a53eae630ae198866f1ae59ea6b933f88ba94175b904154365b43df983c75",
    // r86 HO-044: Team V's 9:20 tall phone League plate (PR #1056, byte-identical)
    "visual-assets/v10_1/plates-v5/ENV_LEAGUE_PHONE_TALL_V5.webp":"ba95dad70a228f546bc8c073f0344cec564ec8be8e232eff90e84346e2de82a6",
    "visual-assets/v10_1/shared/plates/ENV_SYS_PLATE_V1_1X.webp":"0342875dca95999886d5bd0b81daf1aca4a86d0b95bb738e2f6cc4548365a2b8",
    "visual-assets/v10_1/shared/plates/ENV_SYS_PLATE_V1_2X.webp":"005420e4c40d42fbe34d7a66ff7e5428cd3b58b15587ad9ca7ef438b2105b9fd",
    "visual-assets/v10_1/shared/wordmarks/TITLE_LEAGUE_V1.webp":"a35299752e9d3cfcc44b21ff882ac7fdd81b727af78002c5ce5d76459b29e322",
    "visual-assets/v10_1/shared/wordmarks/TITLE_LEAGUE_V2_480.webp":"b95f97b9f3cdabc9824bac8566d416145e55df3f9ac30a5b0ec4a04791cf6ca4",
    "visual-assets/v10_1/shared/wordmarks/TITLE_LEAGUE_V2_960.webp":"6bb7cabdc7dca0006dc46f5b05165e353eef5afdb9e565b2cdf252d82b1ab35e",
    "visual-assets/v10_1/shared/wordmarks/TITLE_LEAGUE_V2_1920.webp":"78ec9b7fc62fc6c07732c18a5c0541b71ea122956a0030bbebf4f78b1e0d970b",
    "visual-assets/v10_1/shared/wordmarks/TITLE_LEAGUE_V2_3840.webp":"abe1adeb700677e9c6da1d201f060cb6a376413f55935c0c5c035a0445565afa",
    "visual-assets/v10_1/shared/wordmarks/TITLE_RULE_BOOK_V1.webp":"5624230fbfa10a80a144a730970de12a7510c5f9e71c53f2e59e315eed57daad",
    "visual-assets/v10_1/shared/wordmarks/TITLE_RULE_BOOK_V2_480.webp":"66651c584b091c456d0b85e359a7c72236a3358cf642d58c8ef604ddbcd9b4f1",
    "visual-assets/v10_1/shared/wordmarks/TITLE_RULE_BOOK_V2_960.webp":"f111b21bc4db4489ccedaf84de7a111f8ab63e54382a37c7e7b46df49ab594c7",
    "visual-assets/v10_1/shared/wordmarks/TITLE_RULE_BOOK_V2_1920.webp":"a42765c1f946a7cbda42737f224d4778260f333e75aab201381d6b0d1739d18b",
    "visual-assets/v10_1/shared/wordmarks/TITLE_RULE_BOOK_V2_3840.webp":"05c76ad422c2a9fa124c6b53d10e3d93833ddc2e342da5d0f8317f0fa58acd9d",
    "visual-assets/v10_1/shared/wordmarks/TITLE_SETTINGS_V1.webp":"c4ad45bc0e39c2c38f3257a47e41e1bff657f672a4345a45cf1fb7ed9481dd44",
    "visual-assets/v10_1/shared/wordmarks/TITLE_SETTINGS_V2_480.webp":"704e95dad0396ce51f9903757f0029d530f6667ae1a8fbddd4038a9af48ca8d0",
    "visual-assets/v10_1/shared/wordmarks/TITLE_SETTINGS_V2_960.webp":"3341d5ff00de9569f772c704a516a52d81197dff233bd123b0d17f0cbf70965a",
    "visual-assets/v10_1/shared/wordmarks/TITLE_SETTINGS_V2_1920.webp":"b22d6f9bf94e91fc2a36ca33706d4b5ec128bf5f145e431669a2c4487681949e",
    "visual-assets/v10_1/shared/wordmarks/TITLE_SETTINGS_V2_3840.webp":"44a0b06a99611960df683656a11d6129511c0ee739fff05a772f76ea1b7539e6",
    // Job 27: Transfer War (tr2/slice-02-plate, Team V 5e05a1f).
    "visual-assets/v10_1/shared/wordmarks/TITLE_TRANSFER_V2_480.webp":"a73a62485c52d482916228d99280fe70e6c2fef91fc676686b0f465759f23b57",
    "visual-assets/v10_1/shared/wordmarks/TITLE_TRANSFER_V2_960.webp":"d40abf2d4f45ad9f6e831526fdd116a61049bb9d924d3815c7d76e2b7b34d0fe",
    "visual-assets/v10_1/shared/wordmarks/TITLE_TRANSFER_V2_1920.webp":"349af044418b7473f73439b0370a646065269ba1c90e2c5e4114dee60ed0c9c6",
    "visual-assets/v10_1/shared/wordmarks/TITLE_TRANSFER_V2_3840.webp":"cd04c11532a03e26cc54548ba6d88ec2082eabfbd256a8dec83115fdd8d48730",
    "visual-assets/v10_1/tr2/slice-02-plate/assets/DER_TR2_PLATE_G_GLASS_C_V1.webp":"f32d2be2da963daf45342a7478dd439d3e8f19c2349cf3bd435d642bf6405925",
    "visual-assets/v10_1/tr2/slice-02-plate/assets/ENV_TR2_PLATE_G_LOCKED_V1_1672.webp":"fc982425ed87ed54ccf4d8da1daa3a8530b026a17beb2d7bc4e4262ac967e494",
    "visual-assets/v10_1/tr2/slice-02-plate/assets/ENV_TR2_PLATE_G_LOCKED_V1_3344.webp":"bde994738d4ad3dd78c2cfa05621b780772150e1406304e33175d11916bd0443",
    "visual-assets/v10_1/tr2/slice-02-plate/assets/OVL_NIK_FINGERTIP_V1_1672.png":"09aa42ae27b63157cd89ce61ed75515b48b5c219f5828e27ca2b8b15f6b3cd50",
    "visual-assets/v10_1/tr2/slice-02-plate/assets/OVL_NIK_FINGERTIP_V1_3344.png":"36ebfa43f2a1717be42f8a3e5dc708d1455de5fda4ea1be6f33ac42cd2fa136d",
    "visual-assets/v10_1/legacy/assets/ENV_LG_PHONE_V1.webp":"53832e23888504219270897b8c43ff165fca63d26d25e6d023220ee5c416fda1",
    "visual-assets/v10_1/legacy/assets/ENV_LG_PLATE_V1_1X.webp":"23a0ca4d5754484ed398b484563dd39f06ef889f177cd40cd6c155513aa5c200",
    "visual-assets/v10_1/legacy/assets/ENV_LG_PLATE_V1_2X.webp":"8717d782eb337b4f77f7596a76c36b0ab461a9bc319a8cc149d16d51a7a039a1",
    "visual-assets/v10_1/legacy/assets/OVL_LG_DANIEL_FOREGROUND_V1_1X.webp":"2a8218f98608a66fc678cca2c606065637230094bba472a639abecef05b92a32",
    "visual-assets/v10_1/legacy/assets/OVL_LG_DANIEL_FOREGROUND_V1_2X.webp":"0aa338d5645323d5124d577fe00fb0f032cb5b0f2165059afdb350613a8cd2d6",
    "visual-assets/v10_1/legacy/assets/OVL_LG_DANIEL_FOREGROUND_V1_RIM_1X.webp":"c00563a759b047d94c62232f5775eb7d3dec22c2fde3b24133044171fc1c9cb3",
    "visual-assets/v10_1/legacy/assets/OVL_LG_DANIEL_FOREGROUND_V1_RIM_2X.webp":"bc136cf0dc2bcdb7c3932d4299b9a9fe690c8ecd4234ba64b8df3df76ff994aa",
    "visual-assets/v10_1/legacy/assets/OVL_LG_NIK_FOREGROUND_V1_1X.webp":"c154b8a45e48fe51bb5d3a3bf6ea135f427111fde6746a080e1bd9947b0536a4",
    "visual-assets/v10_1/legacy/assets/OVL_LG_NIK_FOREGROUND_V1_2X.webp":"b2439733700498ea51129509efda96ce5d7f5c0f1416a9ccab9dbe47d6d44e0e",
    "visual-assets/v10_1/legacy/assets/OVL_LG_NIK_FOREGROUND_V1_RIM_1X.webp":"6fdfde884721c092c8ab5409b2a9121a9de0168f766529495c6dbef80f452019",
    "visual-assets/v10_1/legacy/assets/OVL_LG_NIK_FOREGROUND_V1_RIM_2X.webp":"633993683aa5a1eba32a8587520df3edcc5751d85f3fe449b961c1b026e5d777",
    "visual-assets/v10_1/legacy/assets/TITLE_LG_V1.webp":"e480352898b4e30aa42817e005cf3f46ca66fc5716aec9926231d58e82d5f7f6",
    "visual-assets/v10_1/legacy/assets/TITLE_LG_V2_480.webp":"7df088b3478c36c1f560cf69622260a4ebe52c0197af0e8fe90ade4d87ef429d",
    "visual-assets/v10_1/legacy/assets/TITLE_LG_V2_960.webp":"71598dc23f6a9121e2c839d55ba744eb007e77c0246318d1500e27d763581777",
    "visual-assets/v10_1/legacy/assets/TITLE_LG_V2_1920.webp":"977690ed96dd692186397e326bfa5f07cf8968485a7340b47aff319b858bf83e",
    "visual-assets/v10_1/legacy/assets/TITLE_LG_V2_3840.webp":"763605fb8fc17be5c8488cfdbafbf8d9b798dece9c89e5b776189a6ec402292f",
    "visual-assets/v10_1/rivalry-statistics/assets/ENV_RV_PHONE_V1.webp":"e6ed2862c6afd5861cd2962b856c2e41b0e7499848bf98d19fb017e8968572d0",
    "visual-assets/v10_1/rivalry-statistics/assets/ENV_RV_PLATE_V1_1X.webp":"c207d7a0dce3bc176b1b88b8903ab35bf772acf71c5b30ca4ef92be88e6f4c0c",
    "visual-assets/v10_1/rivalry-statistics/assets/ENV_RV_PLATE_V1_2X.webp":"a599c8e67e8b1c68add7d71a7425b9ddfacc11fb67a420e59624b661e3fca98f",
    "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_DANIEL_PHONE_V1.webp":"5fef27e91d3565f6e69f32facff8039589094d7325afb289bf3d753a546a8bf6",
    "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_DANIEL_POINT_V1_1X.webp":"5b881ad882763c80513b985736f8c9902141b7327274e0f5bb8ed32109579c6e",
    "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_DANIEL_POINT_V1_2X.webp":"8a5a288f8c53865fa5440045ae5fe8fb081c9fea3e20958e17bc94de28495cc6",
    "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_DANIEL_POINT_V1_RIM_1X.webp":"1183b32b82432fe82d0bac42bce482501f2ed79a6ce2c922fa138c6e8d7de7e6",
    "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_DANIEL_POINT_V1_RIM_2X.webp":"fb552f49c53d3c71ec9d692490dbb4ffc5ce18baa264320b5a014c6b7df89417",
    "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_NIK_ARMS_V1_1X.webp":"4e93248b05ba8007457d4cc3fbb125f251b3a97068886f1eaa7010586a775def",
    "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_NIK_ARMS_V1_2X.webp":"9f479931019b6c425b640704d34efcb4bca4f81c215420c2c0033ec19ae0ef86",
    "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_NIK_ARMS_V1_RIM_1X.webp":"8a1d6dfcef90da8dbae441383213692483e92291de98aaca5bf9da3480ff00dd",
    "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_NIK_ARMS_V1_RIM_2X.webp":"474affc7f39d8239b24c8df81b09f6afd9a7568762588a1ae8375d7f122a0d2f",
    "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_NIK_PHONE_V1.webp":"9791dbb9ab97188cce419c0543302e2e36ba53da717a141e757febc00e48282d",
    "visual-assets/v10_1/rivalry-statistics/assets/TITLE_RV_V2_480.webp":"34f10b5d1a3d42dacfdda196fd4b33acce7c842e3c364d60be5212d04deaf1ed",
    "visual-assets/v10_1/rivalry-statistics/assets/TITLE_RV_V2_960.webp":"b1884abe8b06577760e2ad33f6a54c755cf04f1a7e9e44ad6e61b402cac8555c",
    "visual-assets/v10_1/rivalry-statistics/assets/TITLE_RV_V2_1920.webp":"ddd6d62e4b9e1b0ae8c036321f0b27cd142534979c8cddb5effa26cd0ea01b03",
    "visual-assets/v10_1/rivalry-statistics/assets/TITLE_RV_V2_3840.webp":"034a0d5ef0214bf0f0c8b5f8ddfcc5dc1affdf61eac5ee63a2c9e0ffba82bee2",
    "visual-assets/v10_1/rivalry-statistics/assets/TITLE_RV_PHONE_V2_480.webp":"0582d484298012903fd22747d1661ec4373ddb40527780ea4f9b0f104e2866bf",
    "visual-assets/v10_1/rivalry-statistics/assets/TITLE_RV_PHONE_V2_960.webp":"f6a08976080c6f1f43419918e6df4d904b727280ca2adee8aa7294a7d55f1f46",
    "visual-assets/v10_1/rivalry-statistics/assets/TITLE_RV_PHONE_V2_1920.webp":"9eeff4e6fca3ea420ea5e84beac3ed6e0eb71669068f0e573e7f9ff0c7ec5711",
    "visual-assets/v10_1/rivalry-statistics/assets/TITLE_RV_PHONE_V2_3840.webp":"6c1b568b9d8284dc445e98c0a3a3234cfb1de02b19d7cf8b221ff477a946cecf",
    // r78 release: the r77 shell still draws these phone images. It runs (from its own cache) on every installed phone until
    // the r78 worker takes over on Home, and it is the rollback copy afterwards, so they stay deployed for one release.
    // r78's own code no longer uses them; remove them in r79, once r78 is the retained previous runtime.
    "visual-assets/v10_1/career-statistics/assets/ENV_CS_PHONE_V1.webp":"6d1610bba1d480681ef5191ac78b9bf8f6f579e3931f26e444985d65e8d582fa",
    "visual-assets/v10_1/club/assets/OVL_CLUB_DANIEL_PHONE_V1.webp":"6836d6b85c87fdc0d73e18d106b1a6bf98c102d1f8e0fe5eacdb81c7bf95dc2d",
    "visual-assets/v10_1/club/assets/OVL_CLUB_NIK_PHONE_V1.webp":"2f509a89aa6485eac3ae8f7892dfb2c79e7733bed066eb3371dec9a2aa9c28bc",
    "visual-assets/v10_1/home/assets/ENV_HOME_PHONE_V1.webp":"55b4c840aad140b95db47bf9a733c1c21c1aaceb25b539a367c5f6ffcb37453e",
    "visual-assets/v10_1/legacy/assets/OVL_LG_DANIEL_PHONE_V1.webp":"92d7f3f1be8d5e343a828e58e9e363b1ac8e8b01271c3c9bac6c46d72882b9f8",
    "visual-assets/v10_1/legacy/assets/OVL_LG_NIK_PHONE_V1.webp":"b3c343ea60650b7eb0a238c528cf85b5239c1bf166f8b939059c6c907d696f1a",
    "visual-assets/v10_1/tr2/slice-02-plate/assets/ENV_TRANSFER_PHONE_V1.webp":"0effe0edb3159888b4417201ffafa806a3435a1f94cf2630408b7b96dd3b6bd1",
    "visual-assets/v10_1/tr2/slice-02-plate/assets/OVL_TRANSFER_DANIEL_PHONE_V2.webp":"739359106c586b8e98640290c5091b97008550f4bebad4919eabde3c0c9c1086",
    "visual-assets/v10_1/tr2/slice-02-plate/assets/OVL_TRANSFER_NIK_PHONE_V2.webp":"d0d59dddf6988f0b24394d2363c30f15445f68dea3840fc4247dbf23ee826316",
    // r87 test gaps (2026-10-31): F9c had not run since r78, so these r84-r87 images were never listed. Pinned at gameplay/r87 73713d75; RR_HAND (r87-only, never shipped) re-pinned at 45c01a72.
    "visual-assets/v10_1/plates-v2/ENV_CLUB_PLATE_V2_1X.webp":"2a9b7b56dc0760ab17ba419676c45cbdd0e94d9601a9ffc32faa52b28ef1fd3c",
    "visual-assets/v10_1/plates-v2/ENV_CLUB_PLATE_V2_2X.webp":"5762425e970db318445d1d54934a69227948387e60d3ccad9744176e5e6ee0f8",
    "visual-assets/v10_1/plates-v2/ENV_CONNECT_PLAYERS_PLATE_V2_1X.webp":"1962b2933408c959ad07ecf9ef9bf8350e52e69bb9c49c223a59531aa6719d59",
    "visual-assets/v10_1/plates-v2/ENV_CONNECT_PLAYERS_PLATE_V2_2X.webp":"2595ee275b6a2ea8258a07bbaddb4caf5504f50994bfe1849d097aa6b30b7306",
    "visual-assets/v10_1/plates-v2/ENV_FINAL_WINNER_PLATE_V2_1X.webp":"89e785b5c8ff03d2eeaed58a71163daf6fd6d3ef45fbdee053fdb3352ff60153",
    "visual-assets/v10_1/plates-v2/ENV_FINAL_WINNER_PLATE_V2_2X.webp":"f1ba8d0f1c4feba538d2863f56701794c590aacc95c074921cce226054c153f8",
    "visual-assets/v10_1/plates-v2/ENV_HOME_PLATE_V2_1X.webp":"ac069f0612bc6f36f5938f217385638ae36663d650e54f8c7b988159c8634b2a",
    "visual-assets/v10_1/plates-v2/ENV_HOME_PLATE_V2_2X.webp":"58e3f15d3c7a802a1dfe6c3e6eed309e6c0f2e089f2ed8eb2235a9b27d6f00e1",
    // HO-068 (2026-11-09): Team V's handcrafted V2 office room (Transfer War), archive room (Trophy Room, Legacy) and slab
    // (Settings, Rule Book; ENV_SLAB_HC_1X / ENV_SLAB_PHONE_HC renamed _V1 for F9c, and a 590W cut of the phone slab made
    // here for Light or Save-Data, since the set has none), claude/project-thread-kxgun9 687598df6.
    // The plates-v2/v3 plates they replace stay as rollback.
    "visual-assets/v10_1/plates-hc/ENV_OFFICE_PLATE_HC_V2_1X.webp":"aa296ae5b206e42f8317c133ff2d2d7c8f1ca6a4f0c5a670b193a9cc8f3b8aa9",
    "visual-assets/v10_1/plates-hc/ENV_OFFICE_PLATE_HC_V2_2X.webp":"f0e395ee4705950485e067f9850032d90ac246c95f62904d77db77ea4ccad75c",
    "visual-assets/v10_1/plates-hc/ENV_OFFICE_PLATE_HC_V2_1920.webp":"e567404e8fb8420c7ce6ae4f2d8d0cdbc2414c8e46e9a92fb616341eefa3bff1",
    "visual-assets/v10_1/plates-hc/ENV_OFFICE_PHONE_HC_V2.webp":"ca81f0f88015c53fa03b3854756efcffd4840ba8b8e36fc1269397f41564be06",
    "visual-assets/v10_1/plates-hc/ENV_OFFICE_PHONE_HC_V2_590W.webp":"4d53f6dfadad65f334d753352e6a5e6c03b9d32f3700fe6aeeaac61b1c3359de",
    "visual-assets/v10_1/plates-hc/ENV_ARCHIVE_PLATE_HC_V2_1X.webp":"445321a35c63f7145c29eefd5d5868b6988427420b33f10b6806592d1615e280",
    "visual-assets/v10_1/plates-hc/ENV_ARCHIVE_PLATE_HC_V2_2X.webp":"590cd8025b971200f860ced27ff050e68d271c7e266556902249973b1fb3c7a5",
    "visual-assets/v10_1/plates-hc/ENV_ARCHIVE_PLATE_HC_V2_1920.webp":"6964feb2d8b177acb35783c0fa9d1c8dd134f73c16f911dd4578ba0cf79cffbf",
    "visual-assets/v10_1/plates-hc/ENV_ARCHIVE_PHONE_HC_V2.webp":"03867ffa3e292915085ed13353b0f2e21598473eb3baaee291afbb9770837cb2",
    "visual-assets/v10_1/plates-hc/ENV_ARCHIVE_PHONE_HC_V2_590W.webp":"a09a57eaedf0824a27cce8b353d477f05fd39e3f3a37574494d641ca14f29201",
    "visual-assets/v10_1/plates-hc/ENV_SLAB_HC_V1_1X.webp":"ebed7be9406625bedd032967276a36ac8298f393bef00b9eb83ac0fefac61d22",
    // HO-077 (2026-11-13): Team V's 2X slab (claude/project-thread-6kfnkn d5eb5d1e, project-documents/hc-art/slab-2x) and its
    // 1920 cut (LANCZOS, WebP q90, art ledger R4).
    "visual-assets/v10_1/plates-hc/ENV_SLAB_HC_V1_2X.webp":"e79e977a48019e5a98771463fdda6b224c279b4945960ee8afd6f57abcc9093d",
    "visual-assets/v10_1/plates-hc/ENV_SLAB_HC_V1_1920.webp":"f954c7b869d54ef46f83ee2fd1088d41e9fcb6f0f00d7f8983eb8bc7362d862c",
    "visual-assets/v10_1/plates-hc/ENV_SLAB_PHONE_HC_V1.webp":"897f5639fe3ac3790594070d0fd55b121094bae70265c9bcc96e7038c152c78c",
    "visual-assets/v10_1/plates-hc/ENV_SLAB_PHONE_HC_V1_590W.webp":"774945d8dee301e6f147f943df9abea1ea3263444853256e6cdf7a8ef2b5ab11",
    "visual-assets/v10_1/plates-hc/TILE_SLAB_HC_V1_512.webp":"76cf5166df341e532ae707615c2daddd49ad8fa83b0db2ca018640658f083e71",
    // HO-074 (2026-11-11): Team V relit HC rooms (hair rim only on the lamp side), Start hall included, and the brushed-brass
    // wheel rim. Wired 2026-11-12 (Team G new-rooms PR); the V2 files stay as rollback until r92.
    "visual-assets/v10_1/plates-hc/ENV_ARCHIVE_PHONE_HC_V3.webp":"75726ad65752665ad0e3b0a06840a52f065a7ecbfd7958844de56a199ccf2a28",
    "visual-assets/v10_1/plates-hc/ENV_ARCHIVE_PHONE_HC_V3_590W.webp":"0cb46ce4a97cf074c0e42217d70e4f719186fb322a481c8d916afecba7ff4991",
    "visual-assets/v10_1/plates-hc/ENV_ARCHIVE_PLATE_HC_V3_1X.webp":"95355a855e6d39b0e4c4a4ad766f1fdccbd98a1f2412121a6e80bef8aebc49dc",
    "visual-assets/v10_1/plates-hc/ENV_ARCHIVE_PLATE_HC_V3_2X.webp":"3cdf27a053cc7c8d30ea06ed1769bc9283df81c951e13393226a3f2399634943",
    "visual-assets/v10_1/plates-hc/ENV_BOARD_PHONE_HC_V3.webp":"246c1d772a60813e276dadba53fa9763b6c22cd8299f7363f5db1d8a091ae23d",
    "visual-assets/v10_1/plates-hc/ENV_BOARD_PHONE_HC_V3_590W.webp":"5b7e849837e15b5473dc8a27c4981874d5caeec5d10aecb675caf2e6c4bda753",
    "visual-assets/v10_1/plates-hc/ENV_BOARD_PLATE_HC_V3_1X.webp":"cb9805325ead1f418e1fa734f3ca3e743dbabf5dd3a461836107f991f9079851",
    "visual-assets/v10_1/plates-hc/ENV_BOARD_PLATE_HC_V3_2X.webp":"cccaaad02cd5eafdd29f87456cc927c9909149c58124913fd8a3749fd505d300",
    "visual-assets/v10_1/plates-hc/ENV_BOX_PHONE_HC_V3.webp":"743e19658a432b6fcf6ff8d6ecdc7e2ccea4a4b6221edf3bdc3dbe1fd391088e",
    "visual-assets/v10_1/plates-hc/ENV_BOX_PHONE_HC_V3_590W.webp":"28a8f08a43ea409b35b02275cfcf6741b23ba5b897432df9e1da56de08d80e75",
    "visual-assets/v10_1/plates-hc/ENV_BOX_PHONE_HC_V3_TALL.webp":"6f74f7503a231edad302bffde9ebdde01578835dcae2b089f9c4408a0918b666",
    "visual-assets/v10_1/plates-hc/ENV_BOX_PHONE_HC_V3_TALL_590W.webp":"c2afbe5ad0edd820bf53c96cd492c97946985418307203a5b62ba592bd93467b",
    "visual-assets/v10_1/plates-hc/ENV_BOX_PLATE_HC_V3_1X.webp":"485d49234ec0cb5d146f159aff45797615059be0549e2b3c6ca02a014b45a4dd",
    "visual-assets/v10_1/plates-hc/ENV_BOX_PLATE_HC_V3_2X.webp":"f6e4309c3a6eb3f1d8ff96431123692966e619435ce4d9f0d46cd727c28ebf93",
    "visual-assets/v10_1/plates-hc/ENV_HALL_PHONE_HC_V3.webp":"7309ab041d465de5d33ee05c6961ec09b7b62d1733259034261ccdf261831d1d",
    "visual-assets/v10_1/plates-hc/ENV_HALL_PHONE_HC_V3_590W.webp":"3f85780b1d1233acdb97b00a354496934eb9a332f308e68d3a9f71a9c6f94f79",
    "visual-assets/v10_1/plates-hc/ENV_HALL_PHONE_HC_V3_TALL.webp":"b4da66f6ae766e8a8f53550781ba0deb1779468912062e5aef133c9cdfb7544a",
    "visual-assets/v10_1/plates-hc/ENV_HALL_PLATE_HC_V3_1X.webp":"00f9645c0ae5d6afc9c243fbb39569b94d4c79c801f8f9d89f7b65df11ee3ba0",
    "visual-assets/v10_1/plates-hc/ENV_HALL_PLATE_HC_V3_2X.webp":"d33edef35518ecc0360e8cec64366c7bfdaa893707574f27c60db406d2b0134d",
    "visual-assets/v10_1/plates-hc/ENV_HOME_PHONE_HC_V3.webp":"96d07f5ff4a89999e0066d307ffd57ddc47b364a22b1737b42b8347ac6c57f34",
    "visual-assets/v10_1/plates-hc/ENV_HOME_PHONE_HC_V3_590W.webp":"b330e8e9aaef2e17f518a8e2055f3294486f688e0a216a66c1db8a0573f4ff4d",
    "visual-assets/v10_1/plates-hc/ENV_HOME_PLATE_HC_V3_1X.webp":"74e481abb5015df7f0de895b9824ab15523d7ac57d874ded72f116f6f993212a",
    "visual-assets/v10_1/plates-hc/ENV_HOME_PLATE_HC_V3_2X.webp":"6b93b6764c8acec75eb914459dadff29f226e5d5f337cecf94b1560cc8ba2de9",
    "visual-assets/v10_1/plates-hc/ENV_OFFICE_PHONE_HC_V3.webp":"b045dc367db20ccb8d28744fcdd0d4e5bd5cdd778975755f6d31e24283144074",
    "visual-assets/v10_1/plates-hc/ENV_OFFICE_PHONE_HC_V3_590W.webp":"266e38209a19347fbfd489a06d79093d81ebe1df1f80fe7892cc88482bcbe49c",
    "visual-assets/v10_1/plates-hc/ENV_OFFICE_PLATE_HC_V3_1X.webp":"be179a183034999a13b5ca72760c37190b79a143a15173cbd1961b45d913044a",
    "visual-assets/v10_1/plates-hc/ENV_OFFICE_PLATE_HC_V3_2X.webp":"6cbf56a6654b09356fc0aaa1e61766666de5820380e68f5f247549393bbabeb8",
    "visual-assets/v10_1/plates-hc/ENV_TUNNEL_PHONE_HC_V3.webp":"47bce169e439fc9746f7835645b81f580b0ed40505392a168cccc7c8b1af9ebe",
    "visual-assets/v10_1/plates-hc/ENV_TUNNEL_PHONE_HC_V3_590W.webp":"241c63a881d0b4587f4f02b6a03e196ba9b5082dad9993b284eb73d7c4a1967e",
    "visual-assets/v10_1/plates-hc/ENV_TUNNEL_PLATE_HC_V3_1X.webp":"a3cff0e1a19d3cdfb4dae88c9ce119d567abf69ac810aea2ff1f369a6811d488",
    "visual-assets/v10_1/plates-hc/ENV_TUNNEL_PLATE_HC_V3_2X.webp":"cd27db4d0f613d2daeb981b04e89f7a1ef08176b3e28dcf91076766caeb9f1c3",
    "visual-assets/v10_1/plates-hc/ENV_COACHES_PLATE_HC_V3_2X.webp":"5fdcce8edc17fba2fee7d3c5c663189ff2593413654f7dd5df2e9f66dc5f7da9",
    "visual-assets/v10_1/plates-hc/ENV_COACHES_PLATE_HC_V3_1X.webp":"2d04dad2a7238149a9f880bcdde9a3023f953980284a406840447358ec844aea",
    "visual-assets/v10_1/plates-hc/ENV_COACHES_PHONE_HC_V3.webp":"c5505eca5b1dbc2149df0ef781899b3824461cff22ea84116b2316b494a8f839",
    "visual-assets/v10_1/plates-hc/ENV_COACHES_PHONE_HC_V3_590W.webp":"9a681e5b58bdbf0408a2969a06bb5d6357b57f8a0ca38ada37986aab4e33f89e",
    "visual-assets/v10_1/plates-hc/ENV_COACHES_PHONE_HC_V3_TALL.webp":"8ccd17f22b9736c75cab24cf269d4f60beca2ce8dd043db1df7499800c59584a",
    // HO-073 (Nik OK'd 2026-11-12): the Home V3 files above are Team V's final crowd stands (claude/project-thread-h23w0d a5af7a35f,
    // ho073/out) on the HO-074 V3 base. Art ledger R4: 1920px cuts of each V3 room, resized from the 3072px 2X (LANCZOS, WebP q90).
    "visual-assets/v10_1/plates-hc/ENV_ARCHIVE_PLATE_HC_V3_1920.webp":"78291f3d62058543854d00ee2645f55463946e0da5a3463f56876bfda54a68b0",
    "visual-assets/v10_1/plates-hc/ENV_BOARD_PLATE_HC_V3_1920.webp":"6d4e034971a04c09a86c480f83634c33d51d58b3fc609463e2919fd2b77b0be1",
    "visual-assets/v10_1/plates-hc/ENV_BOX_PLATE_HC_V3_1920.webp":"e000a6f6c3373efc8d480f8b85d7d1420e8d9cb2ef9d748ace32f9165bb5a67f",
    "visual-assets/v10_1/plates-hc/ENV_HOME_PLATE_HC_V3_1920.webp":"5ada4ba0513d1483cf20564f55e4ffc9d40f6f5b5072e962d7cb05ffeea03a3f",
    "visual-assets/v10_1/plates-hc/ENV_OFFICE_PLATE_HC_V3_1920.webp":"24f7f10128f6a5bdd02be73935b1fb48a3ef9aa8aa59ba1fcc767cdf0e8ade99",
    "visual-assets/v10_1/plates-hc/ENV_TUNNEL_PLATE_HC_V3_1920.webp":"7527251150400c86d9060b896e8759e135b087663c1224967a67a2f7cf7b8786",
    "visual-assets/v10_1/plates-hc/ENV_HALL_PLATE_HC_V3_1920.webp":"811fdb2a8e422dd0f1795c175c541c72a1d7fe8203b11e8a84131d90ad1b0ce6",
    "visual-assets/v10_1/plates-hc/ENV_COACHES_PLATE_HC_V3_1920.webp":"0623c3ebcc0832d094f8844676ff09033122ba09854e4a086dbc61ad1ed85d7b",
    "visual-assets/v10_1/shared/art/wheel/WHEEL_RIM_V2.webp":"08a068706204783ef4f24599f72012f1dd88351556b5879ab7f2260a7ca385a6",
    // HO-068 (2026-11-09): Team V's handcrafted V2 tunnel room (Connect Players, Standings, Rivalry) and box room (League, Club
    // Assignment; TALL for 9:20 phones), from claude/project-thread-kxgun9 687598df6. The plates-v2 plates stay as rollback.
    "visual-assets/v10_1/plates-hc/ENV_TUNNEL_PLATE_HC_V2_1X.webp":"2d68af513bb9c528dea77d99dfdf844c72d2e9cc38a9426d97b169a14eb8b588",
    "visual-assets/v10_1/plates-hc/ENV_TUNNEL_PLATE_HC_V2_2X.webp":"1ae3e25d16648eeff70e49f37324705498b70b8c76e9b72336edbdd8d3a9e638",
    // r91 sharp rooms (art ledger R4): 1920px cuts of the six HO-068 rooms, resized from the 2X plates, for windows over 1536x864
    "visual-assets/v10_1/plates-hc/ENV_TUNNEL_PLATE_HC_V2_1920.webp":"547599ed8af2df84bcc0b24b6987f80ec0be9e5f66c23ba12ffa64d68d6ed644",
    "visual-assets/v10_1/plates-hc/ENV_TUNNEL_PHONE_HC_V2.webp":"486b214b797913a11e8d99246b058b5276067c7c85345ec39bf74f4a97e2cf75",
    "visual-assets/v10_1/plates-hc/ENV_TUNNEL_PHONE_HC_V2_590W.webp":"b9fe46be16198be235cc1a78e0316b9b65c56525a2010087cb5583b6fd57346d",
    "visual-assets/v10_1/plates-hc/ENV_BOX_PLATE_HC_V2_1X.webp":"f78da7395ca80138339403f4b9d2a3bb13f59932485f970a712ff8e1acc991fb",
    "visual-assets/v10_1/plates-hc/ENV_BOX_PLATE_HC_V2_2X.webp":"cc0e47b42a5eb62d16232002b292cf406bfc091b1a85ebede86c75011bedbd29",
    "visual-assets/v10_1/plates-hc/ENV_BOX_PLATE_HC_V2_1920.webp":"90405ea725f3bc29c6945029bda75d1c453f0ab0435d116a9b3e6418103e179f",
    "visual-assets/v10_1/plates-hc/PACK_CLUB_HC_V1_2X.webp":"2da72663a210c524ddce55ae7b4882386f3759c2ccdfb3df77f50574bdec39e9",
    "visual-assets/v10_1/plates-hc/PACK_CLUB_HC_V1_1X.webp":"402daae9c9f13535ed77babc57a79a7f8d0a2735b5be3733d54eecdbbcd5e0bf",
    "visual-assets/v10_1/plates-hc/ENV_BOX_PHONE_HC_V2.webp":"77f9d3ca0ab75ac859429f94e3c394b0b7140953a947b153146cdfa1d7ab967d",
    "visual-assets/v10_1/plates-hc/ENV_BOX_PHONE_HC_V2_590W.webp":"4b4d13629323d32a0023c45172ecd144d32dd299f81efa4b1ca8f8a64f4e7058",
    "visual-assets/v10_1/plates-hc/ENV_BOX_PHONE_HC_V2_TALL.webp":"6b479780883ce5acd51442dceba2e6c2264d22a1a743b9287552783497a7c66e",
    // HO-068 Codex P3: the 590px TALL plate for the lighter picture setting on 9:20 phones (resized from the TALL plate above)
    "visual-assets/v10_1/plates-hc/ENV_BOX_PHONE_HC_V2_TALL_590W.webp":"38cf744789f8abd4d5f54a811c6911be0d3c0971d8ecb2a52129c94986391025",
    // HO-067 Gate B2 (2026-11-09): Team V's handcrafted Home art V2 RICH (HC 01 + HC 02 V2, claude/project-thread-kxgun9
    // 9e334b234, project-documents/hc-art/home/), which Nik picked at Gate A2; the V2 Home plates above stay as rollback.
    "visual-assets/v10_1/plates-hc/ENV_HOME_PLATE_HC_V2_1X.webp":"01c65c91b7fca42b7bebd0b2f8012f3de201efe6cd012ff2059cf2652d3cab6c",
    "visual-assets/v10_1/plates-hc/ENV_HOME_PLATE_HC_V2_2X.webp":"28c6f56205c1fcbf2db3df9b1e0292b02d5c272f4ed11f265774185d53cd37d8",
    "visual-assets/v10_1/plates-hc/ENV_HOME_PLATE_HC_V2_1920.webp":"78854d59f1d275d7d5b8883c6ff0eb4e163657355898c201955d6fe3fa0d56b3",
    "visual-assets/v10_1/plates-hc/ENV_HOME_PHONE_HC_V2.webp":"1b11bb0ceb356c2fca0dbf53be6460f1bb0654d20ca58db6ab8a34ce153e0c26",
    "visual-assets/v10_1/plates-hc/ENV_HOME_PHONE_HC_V2_590W.webp":"10ec8eb21b143385c93e81d006139917f7a84e5c80fd9b0f8862045495527fb9",
    // HO-068 (2026-11-09): Team V's handcrafted V2 rooms (claude/project-thread-kxgun9 687598df6, project-documents/hc-art/),
    // board room; the five HC trophies re-cut at 537234745 (TRO_HC_n renamed _V2). The plates-v2 plates and TRO V1 stay as rollback.
    "visual-assets/v10_1/plates-hc/ENV_BOARD_PHONE_HC_V2.webp":"7bdabb62864e8aff82a73bfde7cc280dff09d4000e4e2057def059d9aad4fa4c",
    "visual-assets/v10_1/plates-hc/ENV_BOARD_PHONE_HC_V2_590W.webp":"29aa17194024b73a994c6102c7d7aeb5e67a543ac32a3d5f06781eff6baa7621",
    "visual-assets/v10_1/plates-hc/ENV_BOARD_PLATE_HC_V2_1X.webp":"1abf37913892043a9f859b9c4162bbb668210ee73f35624142bcc143ad06c444",
    "visual-assets/v10_1/plates-hc/ENV_BOARD_PLATE_HC_V2_2X.webp":"0cbaaa6e56ef0ee2c187bb38e3d654323cda9e3b1f09f15dad1517b0b5558be7",
    "visual-assets/v10_1/plates-hc/ENV_BOARD_PLATE_HC_V2_1920.webp":"3f07c8a425b4085b2e38ada28cffaafb71781514b6270e6c2624ab585934f0c3",
    "visual-assets/v10_1/shared/trophies-hc/TRO_HC_1_V2_256.webp":"30d7faa0f1e26d4c5959869027bc288ad6fe5da8201e9482a0e84d434df88d75",
    "visual-assets/v10_1/shared/trophies-hc/TRO_HC_1_V2_512.webp":"ac3714e2a2f85c283a6055d6902375d65f0dfa534f763cbc2ed2b28643e19fa7",
    // r93 HO-080 (Team V, 2026-11-14): the Golden Showdown trophy is the winner's own cast-gold bust, one per manager.
    "visual-assets/v10_1/shared/trophies-hc/TRO_HC_6_GOLDEN_DANIEL_V1_256.webp":"63eee81d577df25551d3d8fd873f15f959e15fe4b0057a76fd9ac39bb8204914",
    "visual-assets/v10_1/shared/trophies-hc/TRO_HC_6_GOLDEN_DANIEL_V1_512.webp":"2a8d4b6e55abe989a52138dc1541c57bd849e00955348996efbf58bb80184051",
    "visual-assets/v10_1/shared/trophies-hc/TRO_HC_6_GOLDEN_DANIEL_V1_1024.webp":"4b243c950d0913b172965535ad4b1e4fa866a0faf370c421d7371475d122d876",
    "visual-assets/v10_1/shared/trophies-hc/TRO_HC_6_GOLDEN_NIK_V1_256.webp":"1cfce45c97043a0b4d0bd37b96c3cb3da146001cd296b6430f7713bfb7102288",
    "visual-assets/v10_1/shared/trophies-hc/TRO_HC_6_GOLDEN_NIK_V1_512.webp":"88e619da44357ddc89747f6512cffe891cc34053e4c01b6e56d57b1e8d6787a0",
    "visual-assets/v10_1/shared/trophies-hc/TRO_HC_6_GOLDEN_NIK_V1_1024.webp":"0ae4f47477c104cf34b28c2adf6be2331a813beee23a87056282580ee471434d",
    "visual-assets/v10_1/shared/trophies-hc/TRO_HC_2_V2_256.webp":"492ced301dea9ca03a4ce3a69e1db371c099145f73fcee10b7d972fc962b9a1a",
    "visual-assets/v10_1/shared/trophies-hc/TRO_HC_2_V2_512.webp":"d0d16ec20d852dbbe67e4097bd287c81ae209e2be842a87864f327ff36ff4eea",
    "visual-assets/v10_1/shared/trophies-hc/TRO_HC_3_V2_256.webp":"2a688f48b9de06bf49ece63acda96d27812f032c5d0fb1c38ce76af6321eaf51",
    "visual-assets/v10_1/shared/trophies-hc/TRO_HC_3_V2_512.webp":"84a44c3a1febdfb5bdef6dd67866a1080d641bfb50418099adbf1e9a8700702b",
    "visual-assets/v10_1/shared/trophies-hc/TRO_HC_4_V2_256.webp":"33695d4d1867bf038dd3ce83818d2e3d7904139ded414e29e3c90efbb76facd9",
    "visual-assets/v10_1/shared/trophies-hc/TRO_HC_4_V2_512.webp":"e21bf542aa45056ea9fae93e44cebbdc42b916db3268c4a1c0ef81355269f7f5",
    "visual-assets/v10_1/shared/trophies-hc/TRO_HC_5_V2_256.webp":"b266ac7b0937606d1a6565431c055f9879707c8431746fcd21173f3afd108eae",
    "visual-assets/v10_1/shared/trophies-hc/TRO_HC_5_V2_512.webp":"f2298767495804764f3a885294236ed1f6215215a9f6d6bceb1449529689906f",
    "visual-assets/v10_1/plates-v2/ENV_LEAGUE_PLATE_V2_1X.webp":"7f186eaba7fe87b9355c4a188e367a1b5633826fbe501151fb09615a0555699c",
    "visual-assets/v10_1/plates-v2/ENV_LEAGUE_PLATE_V2_2X.webp":"f9b440cf0054d28d0874bbd80139a252ae6d9d310cbb1cfdce3fa62f9c87e2b3",
    "visual-assets/v10_1/plates-v2/ENV_LEGACY_PLATE_V2_1X.webp":"f35969337c19c8cfb2d31e300a10487edf96a60c9154832ff3134c5ca1d0777e",
    "visual-assets/v10_1/plates-v2/ENV_LEGACY_PLATE_V2_2X.webp":"59aadb8537cc15df70e1dacbbb8a3205de39a13e97bc362028318ea0ed4b249c",
    "visual-assets/v10_1/plates-v2/ENV_RIVALRY_PLATE_V2_1X.webp":"3acf6b94f668d975ff47dc0427ae70d18a1b62958d37b81ba520ab2adba0d48c",
    "visual-assets/v10_1/plates-v2/ENV_RIVALRY_PLATE_V2_2X.webp":"2a638beb0ee6517b56a6e56796794535a8211b31e35a0eefd26c07ecdfe300ef",
    "visual-assets/v10_1/plates-v2/ENV_RULE_BOOK_PLATE_V2_1X.webp":"5458ada61fc342a416bece9653e32b189ce1c0a1f81bdf7a66857fbf00f11915",
    "visual-assets/v10_1/plates-v2/ENV_RULE_BOOK_PLATE_V2_2X.webp":"e290e31b61419f12289aaf3e9e1732509e0967de4e01f1379fbfd28dd62bc8c9",
    "visual-assets/v10_1/plates-v2/ENV_SEASON_RESULTS_PLATE_V2_1X.webp":"e09694f2727a0cebee427a8c4bfd4e80a0cd8ef82433994f81b9333a4a24ac7e",
    "visual-assets/v10_1/plates-v2/ENV_SEASON_RESULTS_PLATE_V2_2X.webp":"6421669af483fc747dcf9ee76b194dcf9e928a48d42dd1d59a4b813c5433d6ff",
    "visual-assets/v10_1/plates-v2/ENV_SETTINGS_PLATE_V2_1X.webp":"651807205b505730fc7a20fefe3d69393db0a63fc3f631b91c5c91945bb48908",
    "visual-assets/v10_1/plates-v2/ENV_SETTINGS_PLATE_V2_2X.webp":"31cc72452e11f5ea2bfce066a59dc34a1c2993af3f2ca3d993de600646b3fd44",
    "visual-assets/v10_1/plates-v2/ENV_STANDINGS_PLATE_V2_1X.webp":"0185af62ee977ba6d5dc941cef48a9ca0ff8f843d0263f2609b0821a6e7526f8",
    "visual-assets/v10_1/plates-v2/ENV_STANDINGS_PLATE_V2_2X.webp":"eadb2d001cd0d1098d23c9ea3dc9187a0dd5083545c3850cffea235975e058f0",
    "visual-assets/v10_1/plates-v2/ENV_STATISTICS_PLATE_V2_1X.webp":"01f1da695e3f8a0568033bc3181d64abd76f321dfecfb14581f579ed59e3160f",
    "visual-assets/v10_1/plates-v2/ENV_STATISTICS_PLATE_V2_2X.webp":"6557f4f8a663a9ec07a895927ec2c06acb00a442c27f2556f7fb343bc44d7a26",
    "visual-assets/v10_1/plates-v2/ENV_TRANSFER_PLATE_V2_1X.webp":"1f156657ec806296ceb1d6dc9cb165a03c413a327b70926645a9088d55aa90e2",
    "visual-assets/v10_1/plates-v2/ENV_TRANSFER_PLATE_V2_2X.webp":"af5ae502ee11c10fca963fa8649dbdd617eaa96a6185ee5e8d34208ec008df5b",
    "visual-assets/v10_1/plates-v2/ENV_TROPHY_ROOM_PLATE_V2_1X.webp":"45444347a7f63e51e7f24e9deeb7f2c2af3017f0bf82ad8fb498436c564bb7c6",
    "visual-assets/v10_1/plates-v2/ENV_TROPHY_ROOM_PLATE_V2_2X.webp":"886e0bec255f61619f8aeb33c38ddb6d4d7ad427527561528d3a900c5898e960",
    "visual-assets/v10_1/shared/wordmarks/TITLE_NEW_SHOWDOWN_V2_480.webp":"f012186945878fdf66eaf6a642a47d300ce7af2aaa9434b15d5f2fe88bb2239e",
    "visual-assets/v10_1/shared/wordmarks/TITLE_NEW_SHOWDOWN_V2_960.webp":"2af3ae7e8086a619e9e507e109b035e932e0b87c51d559111e5f239697cbaebb",
    "visual-assets/v10_1/shared/wordmarks/TITLE_NEW_SHOWDOWN_V2_1920.webp":"fb4fbeaa32a5f14cae68037c27768ef1e4582861769b76bab1e8e3f4105fa91b",
    "visual-assets/v10_1/shared/wordmarks/TITLE_NEW_SHOWDOWN_V2_3840.webp":"fbc03feb159b81838c76d0f4bd55c85e8e3f00b8288a35b33680ae222ddb7244",
    // r91 HO-071 (Team V 9c1fe8ab): the V3 "Honours Board" title family, the VS mark and the Home logo, copied byte for byte.
    "visual-assets/v10_1/career-statistics/assets/TITLE_CS_V3_1920.webp":"f49eac263a3384abc3a8f2fde639fba5671460f1ae233a54188b1cf033591654",
    "visual-assets/v10_1/career-statistics/assets/TITLE_CS_V3_3840.webp":"9df7f078498c673b0f93c6bdfcf17f221d369545f6042957f199a7054697a68f",
    "visual-assets/v10_1/career-statistics/assets/TITLE_CS_V3_480.webp":"1e383fd21d7a523b1c77b51202cdd5198082628cbba22c1abf40793928d31c7a",
    "visual-assets/v10_1/career-statistics/assets/TITLE_CS_V3_960.webp":"798adab980215f2e35c28e35188b51fb5f6976dc26a3547d96bff80a4a296adc",
    "visual-assets/v10_1/home/assets/LOGO_CM17_WORDMARK_V3_1040.webp":"8907a752d99b33a94229368e83927a2e25933228371044ce881973da312f39c6",
    "visual-assets/v10_1/home/assets/LOGO_CM17_WORDMARK_V3_2080.webp":"8508dd9713cb0e26c6bdb62192db5af75448da7a4f87073a0c355059cf11b7aa",
    "visual-assets/v10_1/home/assets/LOGO_CM17_WORDMARK_V3_640.webp":"1bd6859ee30751530a794c4936db487fb6547ef622e8864c8c1cec2f7cd4eb62",
    // r93 HO-079 (Team V): the flat Home logo V4, copied byte for byte (the V3 files stay in the repository, no longer referenced).
    "visual-assets/v10_1/home/assets/LOGO_CM17_WORDMARK_V4_1040.webp":"2b02c3bc57688c2ae73ed2fc35a337fed6415682d719db9d17785bb2fc407776",
    "visual-assets/v10_1/home/assets/LOGO_CM17_WORDMARK_V4_2080.webp":"2ba0843e6e9b3a20ca77e5d7b048d18f426bc6d6e39c1bfa171cf6f9c59c59dc",
    "visual-assets/v10_1/home/assets/LOGO_CM17_WORDMARK_V4_640.webp":"07e794e41c1a1700dd3f75ec5f50434ff1b6d3b95f289186eae39ac18ee850a0",
    "visual-assets/v10_1/legacy/assets/TITLE_LG_V3_1920.webp":"a8288dcddcb1ea7f93705345e6efc8644b2b09e64a926c03245ec196eba3e7a4",
    "visual-assets/v10_1/legacy/assets/TITLE_LG_V3_3840.webp":"7b3c90c27d6381b7a3ed9fd6381fa9f5baf509f1a16769bedb8da7af616a1644",
    "visual-assets/v10_1/legacy/assets/TITLE_LG_V3_480.webp":"e57a246685623c6944c87fdc369c96b6b7371c4b4df30a85a64318cf6f145266",
    "visual-assets/v10_1/legacy/assets/TITLE_LG_V3_960.webp":"de1c068d5fd46b6e4b851890c534c8a6927d2b09154afa62e43ee6f3230a4b47",
    "visual-assets/v10_1/rivalry-statistics/assets/TITLE_RV_PHONE_V3_1920.webp":"1d607a8d46da28ebd202bc876ce66cb404294c4c68e95bc8a32d242d4c23c1af",
    "visual-assets/v10_1/rivalry-statistics/assets/TITLE_RV_PHONE_V3_3840.webp":"97b07310e92dbbd2124fd3dc561efc9a083e1a0dd50ca5d754bc1205d75afe12",
    "visual-assets/v10_1/rivalry-statistics/assets/TITLE_RV_PHONE_V3_480.webp":"8f2feca2462177cbbf27d3f695991e9a13cf44d0a39f7ea744e3817d90c1402a",
    "visual-assets/v10_1/rivalry-statistics/assets/TITLE_RV_PHONE_V3_960.webp":"e65d669a0d70c870fb15ab733bea1a9241e98d3007bfa2e269fc46ac254f9f7e",
    "visual-assets/v10_1/rivalry-statistics/assets/TITLE_RV_V3_1920.webp":"1d607a8d46da28ebd202bc876ce66cb404294c4c68e95bc8a32d242d4c23c1af",
    "visual-assets/v10_1/rivalry-statistics/assets/TITLE_RV_V3_3840.webp":"97b07310e92dbbd2124fd3dc561efc9a083e1a0dd50ca5d754bc1205d75afe12",
    "visual-assets/v10_1/rivalry-statistics/assets/TITLE_RV_V3_480.webp":"8f2feca2462177cbbf27d3f695991e9a13cf44d0a39f7ea744e3817d90c1402a",
    "visual-assets/v10_1/rivalry-statistics/assets/TITLE_RV_V3_960.webp":"e65d669a0d70c870fb15ab733bea1a9241e98d3007bfa2e269fc46ac254f9f7e",
    "visual-assets/v10_1/season-results/assets/TITLE_SR_PHONE_V3_1920.webp":"5b4bc1594a4eb6d16d42ea7eb85623a521dee30dbd463399ebcc7831b422ae0a",
    "visual-assets/v10_1/season-results/assets/TITLE_SR_PHONE_V3_3840.webp":"94238e2ce4cb2d707241a0c1f6d0c6860f1d70a84e86563c2b12907c809fee73",
    "visual-assets/v10_1/season-results/assets/TITLE_SR_PHONE_V3_480.webp":"fae396b48df4c50c7a94ff92fe317f11d69490206470c7b64f662ed7cb1dce39",
    "visual-assets/v10_1/season-results/assets/TITLE_SR_PHONE_V3_960.webp":"6cbcb26b4e1606f2b37c9d6b03c46028102d354d2921223adf42ea91ccdbdaf3",
    "visual-assets/v10_1/season-results/assets/TITLE_SR_V3_1920.webp":"5b4bc1594a4eb6d16d42ea7eb85623a521dee30dbd463399ebcc7831b422ae0a",
    "visual-assets/v10_1/season-results/assets/TITLE_SR_V3_3840.webp":"94238e2ce4cb2d707241a0c1f6d0c6860f1d70a84e86563c2b12907c809fee73",
    "visual-assets/v10_1/season-results/assets/TITLE_SR_V3_480.webp":"fae396b48df4c50c7a94ff92fe317f11d69490206470c7b64f662ed7cb1dce39",
    "visual-assets/v10_1/season-results/assets/TITLE_SR_V3_960.webp":"6cbcb26b4e1606f2b37c9d6b03c46028102d354d2921223adf42ea91ccdbdaf3",
    "visual-assets/v10_1/shared/wordmarks/MARK_VS_V3_1040.webp":"7149390b33d25ce9afe66c11f656bae16950c0ff21f339634837b609a0684055",
    "visual-assets/v10_1/shared/wordmarks/MARK_VS_V3_260.webp":"442c0a2d91c62dd32a1af6e67389013bca95840ce91a0e12919fc1e2406da11c",
    "visual-assets/v10_1/shared/wordmarks/MARK_VS_V3_520.webp":"b6babe8dc8248972624dd53d627c0326306745264737b4a4a8162dd86bc30e6d",
    "visual-assets/v10_1/shared/wordmarks/TITLE_CHAMBER_MEN_V3_1920.webp":"7f8c435ee6cdc806c7fd5887944b295f6ca9d0753a09a90e2967134a33980577",
    "visual-assets/v10_1/shared/wordmarks/TITLE_CHAMBER_MEN_V3_3840.webp":"b3c89fa418a0c35bb1dbe1a2560b4aa620ed4981c9760a0f06de4f2bbd3fcace",
    "visual-assets/v10_1/shared/wordmarks/TITLE_CHAMBER_MEN_V3_480.webp":"4aa597e557e543abc301176a39bda31e72e5236635c889fe1aecfbbfed992a67",
    "visual-assets/v10_1/shared/wordmarks/TITLE_CHAMBER_MEN_V3_960.webp":"3ad468f92c62537f872ee6f2dd8ba7c14fa8e797dd369edcb6fba656fc4da37a",
    "visual-assets/v10_1/shared/wordmarks/TITLE_CLUB_ASSIGNMENT_V3_1920.webp":"5dae2a8714c7f05cd53f6f10445b1570cbfd6bab344216a6a11e81cf1e63ea06",
    "visual-assets/v10_1/shared/wordmarks/TITLE_CLUB_ASSIGNMENT_V3_3840.webp":"0e9708e4bbff72348e4729ffb5a1e930a21525f4111d50050189f15e7ec4bdda",
    "visual-assets/v10_1/shared/wordmarks/TITLE_CLUB_ASSIGNMENT_V3_480.webp":"20c73e88d6ece1c2862db8dd8bcc182f07cf8505b2009b2cf86f5073f9190b07",
    "visual-assets/v10_1/shared/wordmarks/TITLE_CLUB_ASSIGNMENT_V3_960.webp":"95ee98de1f13d8b0646d54e51a5e0acf2a9ad8c4157068673686f6797026309d",
    "visual-assets/v10_1/shared/wordmarks/TITLE_CONNECT_PLAYERS_V3_1920.webp":"3025c082f0169f8e7e708202792402bcbd0ecdd70dbc51c57a1ea4f86c969b23",
    "visual-assets/v10_1/shared/wordmarks/TITLE_CONNECT_PLAYERS_V3_3840.webp":"22f92a67429b283b73d360039c86bb954219335d9510205941e64af39b0f6335",
    "visual-assets/v10_1/shared/wordmarks/TITLE_CONNECT_PLAYERS_V3_480.webp":"970c24038feb3abcfb7a6fbf641efd0f08219d6be2c4c8331ecaab962220e44b",
    "visual-assets/v10_1/shared/wordmarks/TITLE_CONNECT_PLAYERS_V3_960.webp":"ad2ecf6a740b2a68a90b1082a4f9843fce3430cd705e0dff83c8b4a363c9ff27",
    "visual-assets/v10_1/shared/wordmarks/TITLE_FINAL_WINNER_V3_1920.webp":"7cf17f7c5a757dfcec36ed0d54a98228d8bc72645c3905e5d3694282ddcb40bb",
    "visual-assets/v10_1/shared/wordmarks/TITLE_FINAL_WINNER_V3_3840.webp":"7266f821d8b0cb7092b1c31e8fc2aeab2d4affa242596f4f647c17f757ae1513",
    "visual-assets/v10_1/shared/wordmarks/TITLE_FINAL_WINNER_V3_480.webp":"6b6032f2a987cfb53d4a47db66fb2529c56aa8ffab692f87a22a5dce37702b44",
    "visual-assets/v10_1/shared/wordmarks/TITLE_FINAL_WINNER_V3_960.webp":"d5bde06a27b332f695ec73a232d4d75202a4ec522cd5c93e2fc170fa0d04267a",
    "visual-assets/v10_1/shared/wordmarks/TITLE_GAZETTE_V3_1920.webp":"f9f92780a4d02f4560158a5784036563122113fabd84d131c2e6872e50e4ac28",
    "visual-assets/v10_1/shared/wordmarks/TITLE_GAZETTE_V3_3840.webp":"57ff05c2fdcfad0704098365485b81f1db18e11060e9ac82daee730b86da8e2f",
    "visual-assets/v10_1/shared/wordmarks/TITLE_GAZETTE_V3_480.webp":"65a95d8be82b77dcb1cf7c36938519969d5efd7c4b8e8364b4e8a38795792519",
    "visual-assets/v10_1/shared/wordmarks/TITLE_GAZETTE_V3_960.webp":"84b6a40a327d37cbd691f1383df29e1f065f20e81959cd6668fb8ebfd769e10d",
    "visual-assets/v10_1/shared/wordmarks/TITLE_HISTORY_V3_1920.webp":"fd5b9a628d737bd0d9fe92149d436dcc8eb636c40754423996dab06226f64f05",
    "visual-assets/v10_1/shared/wordmarks/TITLE_HISTORY_V3_3840.webp":"1efe11dc981aad89c8d2017488eb291eec0fe3b6ee547c882922ae9652b1bdf6",
    "visual-assets/v10_1/shared/wordmarks/TITLE_HISTORY_V3_480.webp":"0528d3bfaf6bbd2688b9fde4dc162a1df6d889163ea76171afa27f8aef1534d5",
    "visual-assets/v10_1/shared/wordmarks/TITLE_HISTORY_V3_960.webp":"a66c1251e489a160682ef1f8e8048e4aef021cd9796afb8a338de729866b4ba4",
    "visual-assets/v10_1/shared/wordmarks/TITLE_LEAGUE_V3_1920.webp":"3f850e37fc0120056827d291ceb50888022f0b900a6fd7f95fd4b86c011d5e3b",
    "visual-assets/v10_1/shared/wordmarks/TITLE_LEAGUE_V3_3840.webp":"e2a9f1f1bba7503ae26d8a68fe955f8b3603301d51ea2c6671214387cf59b6aa",
    "visual-assets/v10_1/shared/wordmarks/TITLE_LEAGUE_V3_480.webp":"f3dea1a90091552d2f3abf31787143c44a33519420b1c22738f443d81f450e6e",
    "visual-assets/v10_1/shared/wordmarks/TITLE_LEAGUE_V3_960.webp":"0289d2b1c3b6df3d5ef161d8aea7c5e7decb7b88518daf9beb45037a4d66ec48",
    "visual-assets/v10_1/shared/wordmarks/TITLE_NEW_SHOWDOWN_V3_1920.webp":"cb0d5c04fd25ecc02787912b371bd7a23142c5b606c4218850116dbfca8aa508",
    "visual-assets/v10_1/shared/wordmarks/TITLE_NEW_SHOWDOWN_V3_3840.webp":"ebc3434c02a2411c8a69e85338a033e8598553cf541ef55c91a883fce5236aba",
    "visual-assets/v10_1/shared/wordmarks/TITLE_NEW_SHOWDOWN_V3_480.webp":"14ee92b1a52bb8afd066170b8bb214c58faa9b14bbf73307f657c2c34b6ae2ae",
    "visual-assets/v10_1/shared/wordmarks/TITLE_NEW_SHOWDOWN_V3_960.webp":"a894e7896a3232c11fb523d05067039a931bea6a5c2b4e397f7678998e599f2a",
    "visual-assets/v10_1/shared/wordmarks/TITLE_PRIME_PACK_V3_1920.webp":"74ca1d92f16d9311e0a76d9f4ac93a70925c94f5326587560e052d7908c9be72",
    "visual-assets/v10_1/shared/wordmarks/TITLE_PRIME_PACK_V3_3840.webp":"79ba16368ebf0766fd9b72cb18e5fb3e2fbe9f194cca09ca8d670241319db4bf",
    "visual-assets/v10_1/shared/wordmarks/TITLE_PRIME_PACK_V3_480.webp":"9db38360ba0acbea42724893d32353c74f6bbdaf44dd41555c2c084402ed08fd",
    "visual-assets/v10_1/shared/wordmarks/TITLE_PRIME_PACK_V3_960.webp":"d5bc14b88fec73529451b4beb7ba3ca695fe21f9ea846f1cf39818791a2274eb",
    "visual-assets/v10_1/shared/wordmarks/TITLE_ROSTER_ROULETTE_V3_1920.webp":"b4d573318ab942969f6ebcc6f256a96cc8998bdb09bedf5b1ce8338fa1f286c1",
    "visual-assets/v10_1/shared/wordmarks/TITLE_ROSTER_ROULETTE_V3_3840.webp":"018086ac384fe933a1096c28c393da4202f560509a5e50170b1de84570a262f0",
    "visual-assets/v10_1/shared/wordmarks/TITLE_ROSTER_ROULETTE_V3_480.webp":"2e62c9844b1ad74c4aafd8c1db16e5a9c8b84e712a2e6ad78a013f54ef3976d5",
    "visual-assets/v10_1/shared/wordmarks/TITLE_ROSTER_ROULETTE_V3_960.webp":"3b1bb9d2a1f025be7caf9364941c7b012fe59390bd6be19e623899ca0b6d8593",
    "visual-assets/v10_1/shared/wordmarks/TITLE_RULE_BOOK_V3_1920.webp":"b20cf2029e52fda4e65f13c6007f249ad135e270da0341565e41f0d62fb3cfec",
    "visual-assets/v10_1/shared/wordmarks/TITLE_RULE_BOOK_V3_3840.webp":"2cc5daa5982668598ce5d8ff389df3632a7590794236139f06e278636924e7a8",
    "visual-assets/v10_1/shared/wordmarks/TITLE_RULE_BOOK_V3_480.webp":"a05e940d65748c5b9783c05926ed9141df72be76a0237c0403f5c8137cd3a20c",
    "visual-assets/v10_1/shared/wordmarks/TITLE_RULE_BOOK_V3_960.webp":"768f025ebf106e9ba557c9c7ea15f621231311b415d41441c87e192922181d50",
    "visual-assets/v10_1/shared/wordmarks/TITLE_SETTINGS_V3_1920.webp":"ca18708dce45ae1404857c8b377d5b568c1861e7d39e499905e16e355fde7eb1",
    "visual-assets/v10_1/shared/wordmarks/TITLE_SETTINGS_V3_3840.webp":"407d41cd81678ddf2a13b7f30dc4199a99b51978ac3a128c4b5d1796e5c433de",
    "visual-assets/v10_1/shared/wordmarks/TITLE_DEVICE_CHECK_V3_1920.webp":"fc8a7678d5559a3a9e1a8534934015c7e417198e01d0cde407a7161dc16c7724",
    "visual-assets/v10_1/shared/wordmarks/TITLE_DEVICE_CHECK_V3_3840.webp":"ae83e83695da2a03e8129024be96335e68fdf0d354cdd9fbc07c0a3b70f2dd84",
    "visual-assets/v10_1/shared/wordmarks/TITLE_DEVICE_CHECK_V3_480.webp":"3f75de18afc17f969cd429cc3a57c0a696481fdfd2251e534b8a8148ceae74b4",
    "visual-assets/v10_1/shared/wordmarks/TITLE_DEVICE_CHECK_V3_960.webp":"e438faaf65b3ca4229a319d60d97aad8cfc52fd92e0f2214bd8efcfa7e5e799a",
    "visual-assets/v10_1/shared/wordmarks/TITLE_SETTINGS_V3_480.webp":"97ece4d34c5bc80f6bae1ac59cb31132bb3439dd3c2a958fa09fef6cc528b73e",
    "visual-assets/v10_1/shared/wordmarks/TITLE_SETTINGS_V3_960.webp":"e3baacf3b1a92af3def903117902a382a9ff68bac83ecfb2de6e44b2f60f3193",
    "visual-assets/v10_1/shared/wordmarks/TITLE_SHOWDOWN_DRAW_V3_1920.webp":"109a0524399893cc79ee23a968c42ec57631bb8a69af564a085a1f6fc8ddd553",
    "visual-assets/v10_1/shared/wordmarks/TITLE_SHOWDOWN_DRAW_V3_3840.webp":"136a2ae85b465e705547c285635d69a689582cb29eeee57fb54c7afe7948c3e4",
    "visual-assets/v10_1/shared/wordmarks/TITLE_SHOWDOWN_DRAW_V3_480.webp":"5da624959483ab554f7fd569ab076592971e9b89ae9a319a571a58c53e74e269",
    "visual-assets/v10_1/shared/wordmarks/TITLE_SHOWDOWN_DRAW_V3_960.webp":"6d18eb558198353ec21351eeb6456526b0fd51af1fb828a12522c38fc7c9d92a",
    "visual-assets/v10_1/shared/wordmarks/TITLE_SPECIAL_PLAYER_V3_1920.webp":"17feb5128027194f35145b76f4c774bbb92745960255a66368a9df7df99be3a5",
    "visual-assets/v10_1/shared/wordmarks/TITLE_SPECIAL_PLAYER_V3_3840.webp":"4dcb3207c797d71aeae1e8bdb8cbc74f947f550b9d119298c7c5abf5e1cffa9d",
    "visual-assets/v10_1/shared/wordmarks/TITLE_SPECIAL_PLAYER_V3_480.webp":"19e77ae252b8dbc570783518cf0227d41f2ae9c33e97e35c41123a3284331efb",
    "visual-assets/v10_1/shared/wordmarks/TITLE_SPECIAL_PLAYER_V3_960.webp":"e370aa2ccabcfed07a7f7948156d4228981cd58ce0d89c737239ab6a7f188a55",
    "visual-assets/v10_1/shared/wordmarks/TITLE_SQUAD_V3_1920.webp":"e9df6150786685232830c8f643e71184708909b06cc546c88ac9e807bda1ce28",
    "visual-assets/v10_1/shared/wordmarks/TITLE_SQUAD_V3_3840.webp":"ea38e547ff73f27d1a40d48502fc049ce00d46c58c8780b09b2ed4794946a4c7",
    "visual-assets/v10_1/shared/wordmarks/TITLE_SQUAD_V3_480.webp":"fc1b65afb867fe4485505fd2836486740b7dad47705e0b48e062987eccee146b",
    "visual-assets/v10_1/shared/wordmarks/TITLE_SQUAD_V3_960.webp":"e13adc32592ee1b60a4bf67f093184dd4ff974235bc9b32c87f5b2b142c44a05",
    "visual-assets/v10_1/shared/wordmarks/TITLE_STANDINGS_V3_1920.webp":"92cee190e8d62b737060a723ac2a82eda6f401536a705ea1a2cfcb276fe40685",
    "visual-assets/v10_1/shared/wordmarks/TITLE_STANDINGS_V3_3840.webp":"ff40d597eeae2227f1690ce3c332ecf5afba0cd07b6bca0f9f6c0bca7cc33d4b",
    "visual-assets/v10_1/shared/wordmarks/TITLE_STANDINGS_V3_480.webp":"d6ace5c8313818ac7535f11913a3fb363340f74959031cee46f2ca18ac251191",
    "visual-assets/v10_1/shared/wordmarks/TITLE_STANDINGS_V3_960.webp":"514d30cd75386fff0d2c1b076a842b02d8d5e077548e11b2da68c1de12dc6458",
    "visual-assets/v10_1/shared/wordmarks/TITLE_START_V3_1920.webp":"ff8f8e03f6746ea41ec795d95f478b0bd40d7c16f2e8450449a8a65eb6d3a078",
    "visual-assets/v10_1/shared/wordmarks/TITLE_START_V3_3840.webp":"a3fdaf77a519b1847de9e4e771cb2633afef0e9ce75e412dcf1ca7028f9a1694",
    "visual-assets/v10_1/shared/wordmarks/TITLE_START_V3_480.webp":"046bf2d1a7a1bb90ad700f6310ea2a1d5f470213477437ef2b9c81465c5e2977",
    "visual-assets/v10_1/shared/wordmarks/TITLE_START_V3_960.webp":"7febcd5901cdbad0121f4d7296880783dd497ab11cb86c05833fd8e9d7aacae4",
    "visual-assets/v10_1/shared/wordmarks/TITLE_TRANSFER_V3_1920.webp":"b4cbeb2314d2174a589958fb85d53596145fa6f6505b1127ebe37e44bda55702",
    "visual-assets/v10_1/shared/wordmarks/TITLE_TRANSFER_V3_3840.webp":"fa145ae525973d1a0f8a6d14d75339999b36928bc59ebbd13fde3e4a346ae0cc",
    "visual-assets/v10_1/shared/wordmarks/TITLE_TRANSFER_V3_480.webp":"38394b5b0f9a2a95dfece22e65b9a9724ddff1344cb384cff2e7571af47e18e1",
    "visual-assets/v10_1/shared/wordmarks/TITLE_TRANSFER_V3_960.webp":"ca05a3b173c0f6e9169d06af49e35186dc39789d6c339975b602dce1e81bc699",
    "visual-assets/v10_1/trophy-room/assets/TITLE_TR_V3_1920.webp":"909a6525552de3f174fb317a1cacba8124dad713cb7f13fccdb66a799805ab74",
    "visual-assets/v10_1/trophy-room/assets/TITLE_TR_V3_3840.webp":"840450bd99429fde7a176e8ac8644e0b03db7dd63e88b1541ccd9d7dfab70401",
    "visual-assets/v10_1/trophy-room/assets/TITLE_TR_V3_480.webp":"feb171dc0f8130a303978878d977f175c044976eb4ec2f518186b9144fc4a9ac",
    "visual-assets/v10_1/trophy-room/assets/TITLE_TR_V3_960.webp":"f8576e660ea233c76c650b2152e3699643db818af16c4efaf62d1622b2631ef8",
    // Unversioned names shipped while F9c was not running (r86 Special Player, r87 roulette room, r87 Gazette). Their bytes are
    // pinned; they are first generations, so nothing older is cached under the same name. A change ships under a new _V<n> name.
    "visual-assets/v10_1/content/gazette/GZ_LEAD_DRAW.webp":"54534295ea82979d7cccee5feb69830a290f29f6bc9f1a2ba8f8860a94b4fead",
    "visual-assets/v10_1/content/gazette/GZ_LEAD_FINAL.webp":"c88e149ae22cf2a43f2fd60e5851500f44da8cc470440ee3ee5a73343438e363",
    "visual-assets/v10_1/content/gazette/GZ_LEAD_GOLD.webp":"2cadac839aa84a4319ec108c15b0cc4bb24477e72c5966184f22b50f078ba026",
    "visual-assets/v10_1/content/gazette/GZ_LEAD_PRESS.webp":"228e11148ab253199590499d3ff1f193648dafae1683719375a5da3a9ba480a7",
    "visual-assets/v10_1/content/gazette/GZ_LEAD_SEASON.webp":"3c33e6823a01b8b977026afd8400e2a432d31433e385023b05bfa64f3e216f8f",
    "visual-assets/v10_1/content/gazette/GZ_THINK_DANIEL.webp":"51dab2234e2477cf403c99d33ba18446a9433d72c255e75547426a7918170a0d",
    "visual-assets/v10_1/content/gazette/GZ_THINK_NIK.webp":"e784ea13d111d71952cc1a19ce1b951728d910b8974ec1e941fd0c75dd3316d7",
    "visual-assets/v10_1/content/gazette/GZ_WIN_DANIEL.webp":"1087e684e01ea45d1d9d4b88c65bb9a841e9f43295cbf6e8bdafff0c56d46a5c",
    "visual-assets/v10_1/content/gazette/GZ_WIN_NIK.webp":"471173df754656a8d6eef7c1a6cd9a10141cc18809709b44464427775a61dab6",
    // HO-068 lead queue 2 (2026-11-09): Team V's handcrafted house Gazette photos (claude/project-thread-kxgun9 a69f324c2,
    // project-documents/hc-art/gazette); js/touchlineGazette.js draws these, the first set above stays as rollback.
    "visual-assets/v10_1/content/gazette/GZ_LEAD_DRAW_HC_V1.webp":"f38de3960516189becabe9f08b7dacb21245f0bcba7cf88b1350c6f2c4e3871d",
    "visual-assets/v10_1/content/gazette/GZ_LEAD_FINAL_HC_V1.webp":"f4d1ab68aa04946d3296a8762ed2c3c164ec538cd7809688ad3d28755a5d2c7d",
    "visual-assets/v10_1/content/gazette/GZ_LEAD_GOLD_HC_V1.webp":"c57e4402d4e090b66a4e0efd2059141e960b728b980c934d9899c9d26ee9be17",
    "visual-assets/v10_1/content/gazette/GZ_LEAD_PRESS_HC_V1.webp":"b111096438431c67e010a71cc5ccfe5c3c5768e40ce19d450f3cf464efadf26d",
    "visual-assets/v10_1/content/gazette/GZ_LEAD_SEASON_HC_V1.webp":"d1aac5a27985a91d7c979d7b91b62cdbc9756223c8ca2ea4b87a5dbab4027f27",
    "visual-assets/v10_1/content/gazette/GZ_THINK_DANIEL_HC_V1.webp":"9d1141300ef7ee0df6e7c0aa55a2dd81bf34db8a5ce31122d5550f3a78f8dddd",
    "visual-assets/v10_1/content/gazette/GZ_THINK_NIK_HC_V1.webp":"ff1895e5747228212f418129fc35f7b65b1b7e01f3004ef304e28bee4dd37c2e",
    "visual-assets/v10_1/content/gazette/GZ_WIN_DANIEL_HC_V1.webp":"92952440339be34e7d3ef3bdba5c73e7ff4ff45086ca7701232576255f78a0ae",
    "visual-assets/v10_1/content/gazette/GZ_WIN_DANIEL_HC_V1_2X.webp":"6dd86855a3f748f8e8ef3f253f9201b6da6f4a74321bbfa27dc227c753f5fb80",
    "visual-assets/v10_1/content/gazette/GZ_WIN_NIK_HC_V1.webp":"3cef2e6ab3b35036556bdcea766e1cb0e7ab7f099050238f21e87d7cdcd5388a",
    "visual-assets/v10_1/content/gazette/GZ_WIN_NIK_HC_V1_2X.webp":"47f5b6de67d6d060455427378c913a770ed604a2cc984d637ed1bcf52a251d24",
    "visual-assets/v10_1/roulette/assets/RR_HAND.webp":"d6e94fed85ed77554e648130ba7169600fd6dd278a90a39b88ccb9dd14c877a2",
    "visual-assets/v10_1/roulette/assets/RR_HAND_POV_P_V1.webp":"32a092db7824bd9f2820bf6660022a949b3bfb30080bb4331a1c7285ff6fcfe3",   // r93 Team V HO-081: the hand from the shooter's eye, upright windows
    "visual-assets/v10_1/roulette/assets/RR_HAND_POV_S_V2.webp":"c8a98fe566fb832ce1a9ae97b00278e21ec2b8f9763a4d14a3e284818a7ee5ad",   // r93 Team V HO-083 (redraw of HO-082 at 40°): the hand from the shooter's eye, sleeve from the side, tall desktop windows
    "visual-assets/v10_1/roulette/assets/RR_HAND_POV_W_V1.webp":"d85b2ef66f512afd2d1845579c08efda9a7c6d25d9cdba5ed114dda5c3cbe088",   // r93 Team V HO-081: the hand from the shooter's eye, landscape windows
    "visual-assets/v10_1/roulette/assets/RR_ROOM_V2_1080.webp":"3a7b0a2f1330e1a163e475ee4955cda5337d9494e8cba62340b4e709b00e4c09",   // r90 Team V HO-059: the café room on Extra (1920 px)
    "visual-assets/v10_1/roulette/assets/RR_ROOM_V2_4K.webp":"81e9927ce81f12ccb258fa49269b11f278d3778c7a351dad92973a24863c48c5",   // r90 Team V HO-059: the café room on Ultra and 8K (3840 px)
    "visual-assets/v10_1/special-player/assets/board.jpg":"e5eff37ae5c37939bb82117b20ee971caae8c3be4cd74f58990f4fabfbd6788e",   // r91: r89's yellow boards back, the same bytes as their 2.2.0 pin
    "visual-assets/v10_1/special-player/assets/board_night_V1.jpg":"86bf0242453d8dcb4eb3dfd8d1f670fd3926c6348b8fb6eaeaa6c62f2e90bbac",
    "visual-assets/v10_1/special-player/assets/card_black.jpg":"44c96b79f9b039d15c060d0a324f30ba03e25a9430f2bfab485685e3875881fb",
    "visual-assets/v10_1/special-player/assets/card_blue.jpg":"aa09951a2b4ada2fa263c539032d0acb4610bc4b30b2924f3fac5359b34eb9fc",
    "visual-assets/v10_1/special-player/assets/card_bronze.jpg":"6b3d9d9851a05cc5e235458d6347d1f8be2627ca9fc7a5ccb2a4b35b5c8e144c",
    "visual-assets/v10_1/special-player/assets/card_gold.jpg":"87530f5dd5aa878d4c18e792a2b1944fddb2ab1eb6fb689696dfa6ed7e8f8b62",
    "visual-assets/v10_1/special-player/assets/card_silver.jpg":"e8d185e723fdb22bec7584b70280e84d5a82cf2f67d0fab0a8eed066e9e061b0",
    "visual-assets/v10_1/special-player/assets/grass.jpg":"c934944069c19292de82af6d02202504cec98012664153ddd57ecbdbcee7d56e",
    "visual-assets/v10_1/special-player/assets/pack.webp":"61abaa0fd3c18c36f98bf5615bd93166b877723d3bc61e92b7b79009f2446eb5",
    "visual-assets/v10_1/special-player/assets/stadium_soft_V1.jpg":"1d53de91a9e99ce848b1fb88fcb246f5ff5601661fa923ae8c3650110d5a00d5",
    "visual-assets/v10_1/special-player/assets/stand_soft_V1.jpg":"7570680160c6124f3024a8a90642f3a0310c009032f9b9d3d7c95cdcd117c5b7",
    "visual-assets/v10_1/special-player/assets/stand_left_soft_V1.jpg":"360280d213e8542e09b0adf20e75c56720ac66a7d257248aa535000a156f0eed",
    "visual-assets/v10_1/special-player/assets/stand_right_soft_V1.jpg":"e760aba470f54a3b84fb9d2b7893b46e79018004af5401b49ce689b914430c12",
    // r87 final (gameplay/r87 9a9667fb): images added after 45c01a72, bytes pinned.
    "visual-assets/v10_1/icon-guess/assets/card_frame.webp":"03c227e9c0e67af579d396b64dc7a97df07cdde9d3e8f5dce71e053c3b29f52c",
    "visual-assets/v10_1/icon-guess/assets/pack_opening.webp":"c45097ef594fb7385b33c77ed2fc62558c9b150408a947da04cfdf80a2cb5a14",
    "visual-assets/v10_1/icon-guess/assets/pack_sealed.webp":"f01705c412f592eb7a8897ead38f157ba0c9b5cb417bf7109910cc37b81ca10e",
    "visual-assets/v10_1/icon-guess/assets/stage_desktop_V2.webp":"9ef6ff0febfcd69e95ccbeb215492fee3f14032c2013bfa4a7d8515c7d9c350f",   // HO-068: Team V house stage (hc-art/prime-pack a69f324c2)
    "visual-assets/v10_1/icon-guess/assets/stage_phone_V2.webp":"ec07ef4fde64dc492d28f8d954adfe8a5f69498f1277f306775d23a391c88f3e",
    "visual-assets/v10_1/icon-guess/assets/token_full.webp":"c92d861a2930b3526c6446d4a9f5275cdcdb4bc37cbf6ecd04a55e253adec82e",
    "visual-assets/v10_1/icon-guess/assets/token_spent.webp":"67935464fe41c4fefa56da9280c3ff18fb953127579138981392dae9f1e2ba93",
    // r90 4K slot of the Prime Pack desktop stage (HO-068: a 3840x2160 Lanczos cut of the house stage stage_desktop_V2.webp): loaded only above 2560 device px.
    "visual-assets/v10_1/icon-guess/assets/card_shadow_V1.webp":"3cdf20976ecac1e43073008b288cbebb15363b68144da0847477c34aa1180591",   // r90 Prime Pack smooth: the card shadow, blurred once offline
    "visual-assets/v10_1/icon-guess/assets/stage_desktop_4k_V3.webp":"3d75519892a1807c2f9994f104ae5fe219b05378b734de06a7cc8d3f00d3eb3d",
    // Team G Chamber Men 3D textures and uv sheets (r89, unshipped first generation): pinned like Team V art.
    "visual-assets/v10_1/chamber-men/assets/concrete_512.webp":"dea059b601bdfbedf1e001ccfb9a6bf2f20b318c2036f1275f279dcee0d0446a",
    "visual-assets/v10_1/chamber-men/assets/crowd_atlas_1k.webp":"685af7f6cca295c6ca93ca8f8eb3d4be8c956212e5aebcceadeba04cb76f4191",
    "visual-assets/v10_1/chamber-men/assets/crowd_atlas_2k.webp":"5aee1df9df63e7a0b41cedc2afc6c1ecb4f0f205628161b6b4ac473b20e4f7c4",
    "visual-assets/v10_1/chamber-men/assets/crowd_tint_1k.webp":"9e861b1b92da282b5f18f2f0f140e845307a93e466260d23bdef21b485f2639d",
    "visual-assets/v10_1/chamber-men/assets/flare_256.webp":"12570cfc16f86f1369119886d212fe46bdf6473c26c710748ad78fa69ee1bd85",
    // r90 ball: Innerscene Soccer ball (CC0) with match wear, one size per level (tools/chamber-men-assets/gen_ball_v3.py).
    "visual-assets/v10_1/chamber-men/assets/ball_color_V3_1k.webp":"794a99052be4578ed9ba26f5190fd277e4cf5fe797a45c6b4acb4d21c2968bbd",
    "visual-assets/v10_1/chamber-men/assets/ball_color_V3_2k.webp":"a333315b3f8ffd12753b3f34446b2b88cd75c872349732dd2ad6fd9971d70971",
    "visual-assets/v10_1/chamber-men/assets/ball_color_V3_512.webp":"1457f70dbda2bddfe825bf07c2b196d10f9192b828dff593852716693683a4b8",
    "visual-assets/v10_1/chamber-men/assets/ball_normal_V3_1k.webp":"311fe033e1fba306d9dba5020bc6b37253673ccd1f50ee6ba1f39c6e329a4967",
    "visual-assets/v10_1/chamber-men/assets/ball_normal_V3_2k.webp":"5c6527cf431b325e76e43ebed7ef28d049ee4174cbaa7aa7b20703536cd5a2b0",
    "visual-assets/v10_1/chamber-men/assets/ball_normal_V3_512.webp":"7d41db484cd5febac7bd63d9f3d4cd1f95e9c3b3ad8fd90cd3701bc6725bc6ba",
    "visual-assets/v10_1/chamber-men/assets/ball_orm_V3_1k.webp":"da644d05cd0a44b0ba89c8fe3aa7367e0b104095a159ff8cac189a1084061ba6",
    "visual-assets/v10_1/chamber-men/assets/ball_orm_V3_2k.webp":"8fdb45e9188d3c0450c526da550e113ef8f968a96c80939d6e8ee690ce39ddf5",
    "visual-assets/v10_1/chamber-men/assets/ball_orm_V3_512.webp":"adce6e0e8ab9bae88956174c057bcd3e88f43b3afe0bf4e993d4cc8ac84657d2",
    "visual-assets/v10_1/chamber-men/assets/grass_color_V2_1k.webp":"352b3c31c3abb1aa508335ad6f180c024bacdc2123c693f8a1637d01dd0e7e3d",
    "visual-assets/v10_1/chamber-men/assets/grass_color_V2_2k.webp":"7e2c5085d7619d9b800a993ad186d597e14a01d2dee917a2fd6b7590b867ac99",
    "visual-assets/v10_1/chamber-men/assets/grass_color_V2_4k.webp":"d17c14b627fd98cda7677f09a5e70322f3495b76d1aba32509c73a45e152c38a",
    "visual-assets/v10_1/chamber-men/assets/grass_normal_V2_1k.webp":"76275aa26f5be1844ae7120dffce943c1514b5dd8606e9f5a31693b3d1f8cd16",
    "visual-assets/v10_1/chamber-men/assets/grass_normal_V2_2k.webp":"ef366c068311fad7ff2709710b3e1f89212a3f6c92723264f9a115d82939e8b4",
    "visual-assets/v10_1/chamber-men/assets/grass_normal_V2_512.webp":"7faaae03ae1beeb7ed22e525a632fb2cc82aa9a2d773f3a33fddae7537fe1be6",
    "visual-assets/v10_1/chamber-men/assets/net_cell_512.webp":"afbb689637ab87b186b9c94dba1f19f3cbe08c52cd7c00e6a68705ef8ada83e5",
    "visual-assets/v10_1/chamber-men/assets/seats_512.webp":"7d9300f95c3395f037324002b79bbdae8111267cc41fa17459efebc91341ac76",
    "visual-assets/v10_1/chamber-men/players/kitmap/ch38.webp":"505196d3708ddbbc5d87740317c58c6769edb8075836efb9c74f749a4f9c9eb3",
    "visual-assets/v10_1/chamber-men/players/kitmap/ch42.webp":"bb33144c964d6ded6352114f4492fcd466fc9a3d29cbe8f1aefd60d25be0305a",
    "visual-assets/v10_1/chamber-men/players/uv/uv_Boots.webp":"4943b6bcfa625b98df2f317b30dc6acfadf940d6c021560ba3a52dbda7d0e043",
    "visual-assets/v10_1/chamber-men/players/uv/uv_Shirt.webp":"351c83b7eff6157addc3e5169ec36aca479df6241cc9d40e4b0c692f1bb22431",
    "visual-assets/v10_1/chamber-men/players/uv/uv_Shorts.webp":"cc81716c55ebbb66c0b0d10598e098461efeba5c43c79c94ec2a73f8c2c74f42",
    "visual-assets/v10_1/chamber-men/players/uv/uv_Socks.webp":"d46d608202e9dc1d8b6fafbe45da624f72bf5d494fa2038ca861e4de2050bbc1",
    "visual-assets/v10_1/chamber-men/players/uv/uv_ch38_Body.webp":"c70c712e364ae79081daee6b50bf579a81ecb28e7b8a9da22086727a3bc3c9b8",
    "visual-assets/v10_1/chamber-men/players/uv/uv_ch38_Boots.webp":"650bab72bf1e02c2998682166af1565b7e92656debdcbc50a9f10fc88beb2f06",
    "visual-assets/v10_1/chamber-men/players/uv/uv_ch38_Shirt.webp":"173aab84407049661a9dd3103fa653ba6142884a4eb281cb5db9a8333ad7c85c",
    "visual-assets/v10_1/chamber-men/players/uv/uv_ch38_Shorts.webp":"060ff7ed1bc6272a936731d533503ad029cebe0bdf84962b5a7115fc2fe24656",
    "visual-assets/v10_1/chamber-men/players/uv/uv_ch38_Socks.webp":"6c22e842c648d2d37aad88d85735df5c5d8e966a6161c3e6fdec57ea3ec0b33c",
    "visual-assets/v10_1/chamber-men/players/uv/uv_ch42_Body.webp":"01b6827e129fb0a55fc540481d22e97826e1387e2b2773077e7fa7c2a6a69c0b",
    "visual-assets/v10_1/chamber-men/players/uv/uv_ch42_Boots.webp":"8019b6e39605ac7d11c95ffa6653652b126c388b73b95341aefc2acd21246f21",
    "visual-assets/v10_1/chamber-men/players/uv/uv_ch42_Shirt.webp":"70f92dd04458b5bd37d9153ce2e087917574f1624596b64f726b0fe593335782",
    "visual-assets/v10_1/chamber-men/players/uv/uv_ch42_Shorts.webp":"34a62c138ff8811462c489ebe12bfbe16265c95e1f6a97c9876d1ab1295507b1",
    "visual-assets/v10_1/chamber-men/players/uv/uv_ch42_Socks.webp":"4576a46e30a2136cbe4133f4bcf8173bcf3ab9ca62e20af0c5ec82cb73533b07",
    "visual-assets/v10_1/chamber-men/players/uv/uv_remy_Body.webp":"ba8ca7f33938ff0a8fdee3dcddc59d0d428766b847c64cafe77792760f090451",
    // r94 Team V HO-084 (Nik OK 2026-11-15 22:02 UTC): the image crest pilot (5 clubs, 64 and 256) and the master shirt shading, WebP made from V's PNGs (tools/crests/HO084_MANIFEST.json).
    "visual-assets/v10_1/crests/CREST_IMG_BARCELONA_V1_256.webp":"4705d322ca811eaa372620428b4812eb8217931dc8399eccefd69b265648a280",
    "visual-assets/v10_1/crests/CREST_IMG_BARCELONA_V1_64.webp":"7b736dd2328c6a4ddab1ad9855eb9c8b6580389ae6a13213192bfb91559c1d83",
    "visual-assets/v10_1/crests/CREST_IMG_CHELSEA_V1_256.webp":"75f97e3106209e20de1a1cd7fe4ac8615cdbd06e6db3d95d5d2dd26860d7882c",
    "visual-assets/v10_1/crests/CREST_IMG_CHELSEA_V1_64.webp":"876259744773e455de376f818084b8d545011adcbb9fadad10bb8278a00faef6",
    "visual-assets/v10_1/crests/CREST_IMG_METZ_V1_256.webp":"1426c9d4cd3f0822bcdf4a03410dbc0a80e76feb6802a3fe859beb694f91099b",
    "visual-assets/v10_1/crests/CREST_IMG_METZ_V1_64.webp":"770c0aa206bbfb679f226a68e8e6b14b28b1056777db4ba19f3d5ec1e8237bd2",
    "visual-assets/v10_1/crests/CREST_IMG_TORINO_V1_256.webp":"bf0219980103fb626ddc9c09dd67412411753e9d58a81fd4c607cf841d16fc9a",
    "visual-assets/v10_1/crests/CREST_IMG_TORINO_V1_64.webp":"9dfcfa4424e403b5130afdffd074f0dd9acacc0a7233cd302c22e9931d5194da",
    "visual-assets/v10_1/crests/CREST_IMG_WESTHAM_V1_256.webp":"af999be652ffb826a5d1893d6f0dd68fd435ec38be330ac5d03e8f35a2d5141f",
    "visual-assets/v10_1/crests/CREST_IMG_WESTHAM_V1_64.webp":"c2f7691ff00e89d9821dd7027180eb83d634d55f4c0892f6ce8cceee5ae88cfb",
    "visual-assets/v10_1/crests/KIT_MASTER_SHIRT_V1_SHADING_768.webp":"7e9821bb99de29315cf48fc3b3dcf5a4d7541e048e278fc2a59218c690a75e80",
    // R94 ball slot: 512 px crests for R94-02's 3D spin, resized from Team V's 1024 masters (HO-084..HO-093).
    "visual-assets/v10_1/crests/CREST_IMG_ALAVES_V1_512.webp":"add321bead527a73558434d332d8f5ae3dc4bb07d03e538511a45990343d3085",
    "visual-assets/v10_1/crests/CREST_IMG_ANGERS_V1_512.webp":"bbf3897454bb4b510c3800f27b381ba15a6d86b19bd2fc190437b06b40470ec1",
    "visual-assets/v10_1/crests/CREST_IMG_ARSENAL_V1_512.webp":"07f8b8e9cfaaa5924b5ed24ac0e34c9df60c90b54eba9262b586a73bb5195bf6",
    "visual-assets/v10_1/crests/CREST_IMG_ATALANTA_V1_512.webp":"e67f190d0446a2b2d772b6de151fa3ca6a46f500f17fa765909e97b21a9abfb2",
    "visual-assets/v10_1/crests/CREST_IMG_ATHLETIC_V1_512.webp":"99f2aeb3a6462d5f9852d5159035b0df663d483d6cf0d0925099deda67d0295e",
    "visual-assets/v10_1/crests/CREST_IMG_ATLETICO_V1_512.webp":"b2e7f24609126185373a1924f18bdc4d4fe79f23142a8a38c4eacdac0cf76c0d",
    "visual-assets/v10_1/crests/CREST_IMG_AUGSBURG_V1_512.webp":"71e9b0d45759a237e1b03eb81675bb6c4b430180fcf6991a3926098efbc96a0e",
    "visual-assets/v10_1/crests/CREST_IMG_BARCELONA_V1_512.webp":"e156f333a2ed4ceb37b225d0cb21d63e2d73a05a455456f9614e9e69de5dbf31",
    "visual-assets/v10_1/crests/CREST_IMG_BASTIA_V1_512.webp":"3f7be0bfa5b0edbc323d55a055c4d90bcfd6d11766546338ddea4cbcc3386a82",
    "visual-assets/v10_1/crests/CREST_IMG_BAYERN_V1_512.webp":"592f3b47bad421caa1ce6ceabea5b15b1ef95a6f76700ed8e43a6d11b5165ee2",
    "visual-assets/v10_1/crests/CREST_IMG_BETIS_V1_512.webp":"f13a68a95acbde516bcd46920996c2486253c13f3dceddb12eb12e3b004821f1",
    "visual-assets/v10_1/crests/CREST_IMG_BOLOGNA_V1_512.webp":"9944418f9a30dc2d7d988a2e4d122bac35e6f3ed584f022c7d9628f31a91d992",
    "visual-assets/v10_1/crests/CREST_IMG_BORDEAUX_V1_512.webp":"a2791f56048bf259596e32e8689ada011ee1f3545c5eee01a9d6103cf678cc1d",
    "visual-assets/v10_1/crests/CREST_IMG_BORO_V1_512.webp":"ea1156b4b2b6761338a3b5f8f236a428be9d9474c8c237d3e19cc2685871203d",
    "visual-assets/v10_1/crests/CREST_IMG_BOURNEMOUTH_V1_512.webp":"8a475a1e9515b2959e5a1807ccd2e4e1dca7283bd91f033fe41bfccca692fb7e",
    "visual-assets/v10_1/crests/CREST_IMG_BREMEN_V1_512.webp":"c80c6ec2a3ce25b8d9f8019951119cca0acae2d071524b21594025390f8d1130",
    "visual-assets/v10_1/crests/CREST_IMG_BURNLEY_V1_512.webp":"894ad84b1cf86da0d5ce8f62561daa9cb3617f22691836608955e4449e98fc54",
    "visual-assets/v10_1/crests/CREST_IMG_CAEN_V1_512.webp":"cd41aa2542f36bed34c7fb15996423b60752cc35cd2b82e65514b7a8fe608c91",
    "visual-assets/v10_1/crests/CREST_IMG_CAGLIARI_V1_512.webp":"5513ba239a786a04a106db5f5ed16f076cd49ff9fa0f3227d1ded8db56a8e303",
    "visual-assets/v10_1/crests/CREST_IMG_CELTA_V1_512.webp":"7ff1d42b483b1a9aa8024a37e2aea522cc511d2c68e437aca18a63a1bdc48933",
    "visual-assets/v10_1/crests/CREST_IMG_CHELSEA_V1_512.webp":"8c1f85295ec8d7ac564c90692f72599e35e0f5958a4d0353b600e0b305f18826",
    "visual-assets/v10_1/crests/CREST_IMG_CROTONE_V1_512.webp":"db092757e442ab895e968da068d21f87d1171be5b1fcdbb7c9bc6ad5b6bfc066",
    "visual-assets/v10_1/crests/CREST_IMG_DARMSTADT_V1_512.webp":"a4300f58a94e562931a8d8c092c3492d47017a55338cf72a95c5f83138e6d910",
    "visual-assets/v10_1/crests/CREST_IMG_DEPOR_V1_512.webp":"5a139a4f46c96b68caf6054a1fc7d1fe973822f46f1ed2d9f6d0d9c724c9226c",
    "visual-assets/v10_1/crests/CREST_IMG_DIJON_V1_512.webp":"758813f1730b641d3b0854772d5330edafdbfb7faf234999733c1e7080447e3e",
    "visual-assets/v10_1/crests/CREST_IMG_DORTMUND_V1_512.webp":"7054bcf5a5f7026adcc19371ff94118727d73f6f5441242a94453c2a91739f55",
    "visual-assets/v10_1/crests/CREST_IMG_EIBAR_V1_512.webp":"6c0fca75798f02dff66ed74a6f640abe0ba10d2bd34a73404fedf37da2677956",
    "visual-assets/v10_1/crests/CREST_IMG_EMPOLI_V1_512.webp":"fdde794c570436fd810663d064b64e2e1f7cf560ebd3377c64a65ac817c7f1bc",
    "visual-assets/v10_1/crests/CREST_IMG_ESPANYOL_V1_512.webp":"6cf5c168f430a70d498f3197809171d837d30670336b0cc8cf00a43b7b05dec0",
    "visual-assets/v10_1/crests/CREST_IMG_EVERTON_V1_512.webp":"810ff2d9276d5ad4a33a1fbbef87399b9c1bc183e5d36f407def6736ac7ff367",
    "visual-assets/v10_1/crests/CREST_IMG_FIORENTINA_V1_512.webp":"0409226cd6f439559d7fdf4126a6a17d6d0e9aff497b0b758b6eccf919119241",
    "visual-assets/v10_1/crests/CREST_IMG_FRANKFURT_V1_512.webp":"49c94153d4f5f5ee97c935f26836ad972a16a0ecef7b72a8dc3c3afa976bde6d",
    "visual-assets/v10_1/crests/CREST_IMG_FREIBURG_V1_512.webp":"71e352b8224b62702cf4ba8543d858729933f95d797c3f5dbd985cee66c1f9b9",
    "visual-assets/v10_1/crests/CREST_IMG_GENOA_V1_512.webp":"4d47bbaa23a029a6976f9bd9da51430c52b3c3a143283ed739ee3b1fabaccad9",
    "visual-assets/v10_1/crests/CREST_IMG_GLADBACH_V1_512.webp":"3800f7f740442ab436ec62f6ce42e9dc28a1b50ef67785414c4f675a18f12ba7",
    "visual-assets/v10_1/crests/CREST_IMG_GRANADA_V1_512.webp":"af1502bf3bf231d1c3d77cfa265253b87176da66a51b6b8ba0e385e130373684",
    "visual-assets/v10_1/crests/CREST_IMG_GUINGAMP_V1_512.webp":"a3f6005462317addcecf3e757f41946c8a23195f713adf0cf6d0bb81420f3d7c",
    "visual-assets/v10_1/crests/CREST_IMG_HAMBURG_V1_512.webp":"1989161f427724bab16ecfc05606ea651cb4b6e0f9cf33a4ffb7d13bd78ba8af",
    "visual-assets/v10_1/crests/CREST_IMG_HERTHA_V1_512.webp":"bb8f433e5864a0719ebc01ffeeb399cf5c57d3d999579459930b8275bd1a34fe",
    "visual-assets/v10_1/crests/CREST_IMG_HOFFENHEIM_V1_512.webp":"ec84df72bd03268f00f7b800bbdf3f84d9dc4e5bcbea8559cb61c6fd4bcb3f87",
    "visual-assets/v10_1/crests/CREST_IMG_HULL_V1_512.webp":"054879c9200ac9cb7e4d5990a166bbd88fe56f5e1bb1bae4fafa3cba8ac63fd9",
    "visual-assets/v10_1/crests/CREST_IMG_INGOLSTADT_V1_512.webp":"6a03317be75a9714c6a23b1655356d702f7d1205e9a13e7997e6da5593d95b28",
    "visual-assets/v10_1/crests/CREST_IMG_INTER_V1_512.webp":"74f80bdb8a3effdd4ca1c9b32d78654dca8361c51f960e9c390a2bbdbf281293",
    "visual-assets/v10_1/crests/CREST_IMG_JUVENTUS_V1_512.webp":"4afec000fe0555565b964213ec97f13fd57086fa8939f97d08d2608bd1f1ea4d",
    "visual-assets/v10_1/crests/CREST_IMG_KOELN_V1_512.webp":"d52df24cbec3de7d6675cce26048c57e1d79eaf73792d04db7f10b034ea63770",
    "visual-assets/v10_1/crests/CREST_IMG_LASPALMAS_V1_512.webp":"55e87a84ebcd985835f63bbab4fd90aef27199b17f0403111e9a1ff950abfff8",
    "visual-assets/v10_1/crests/CREST_IMG_LAZIO_V1_512.webp":"d45389f662e797b3a7d93d88918aec1294e7de59cee36e5f3d84027c1e7eab7d",
    "visual-assets/v10_1/crests/CREST_IMG_LEGANES_V1_512.webp":"db59de4eedb66129614eaf841b409d6f830bda40cd564c74fd9c0d24665ef464",
    "visual-assets/v10_1/crests/CREST_IMG_LEICESTER_V1_512.webp":"5d06fb87128d5b5714a8fdce96273bd566af3b0da1c3b89ea68a0af143c02a0e",
    "visual-assets/v10_1/crests/CREST_IMG_LEIPZIG_V1_512.webp":"931f3a7ca3832bc30ebef7b518347da37073a020c40f81b2c3cd92628fcdb7f8",
    "visual-assets/v10_1/crests/CREST_IMG_LEVERKUSEN_V1_512.webp":"44e8623852735cc8791363a6162c558a13dcf0711052ee65dd8593fa37658900",
    "visual-assets/v10_1/crests/CREST_IMG_LILLE_V1_512.webp":"ce1f1056dc2c8a6e2565a147c715b3f20bcfbb35596711776d2fa0df7b03945c",
    "visual-assets/v10_1/crests/CREST_IMG_LIVERPOOL_V1_512.webp":"61a19347f3e9c4868f6ec28eedd20bfd84ecffc7e3febc2c42b204eadf238353",
    "visual-assets/v10_1/crests/CREST_IMG_LORIENT_V1_512.webp":"b4b72a22cf0b802e390c7212f5127f4b55a9816ca0a72c55889243647e4ed96f",
    "visual-assets/v10_1/crests/CREST_IMG_LYON_V1_512.webp":"847360d99f340c663a1a80f0877fe341ff4d71a860a33b55532d8925502e3fc9",
    "visual-assets/v10_1/crests/CREST_IMG_MAINZ_V1_512.webp":"7df86c9a9eaa37faeb9c66315e1168e558226851f47e998dfd1bb5c486ac350e",
    "visual-assets/v10_1/crests/CREST_IMG_MALAGA_V1_512.webp":"eefd201093b886983843ddbd283c0b7f49a773d9c08538bd4d03aac07c028190",
    "visual-assets/v10_1/crests/CREST_IMG_MANCITY_V1_512.webp":"6abbfd877ea6c8b7dbffe4242de0f95ddbf621e2a31a6235f018bea7c9114fd9",
    "visual-assets/v10_1/crests/CREST_IMG_MANUTD_V1_512.webp":"4c923c4610ec4847e26c26ff22c31e74ca7efa4c1d541cf9b8679c8ba3c00bcd",
    "visual-assets/v10_1/crests/CREST_IMG_MARSEILLE_V1_512.webp":"7ea594d99988cdc4dc78f1939af6f42c4c4b963d2c148eee9fd73bad9f549d3f",
    "visual-assets/v10_1/crests/CREST_IMG_METZ_V1_512.webp":"dd64bfc213a891fe2210e72cd4d77a40fdb5c5fd5e7f943fdb505d9633b0fb83",
    "visual-assets/v10_1/crests/CREST_IMG_MILAN_V1_512.webp":"555699ee435d4922733d9e46f32b3034f293103fecf2dee04c9f86650e819387",
    "visual-assets/v10_1/crests/CREST_IMG_MONACO_V1_512.webp":"d46cb302fa84a25bc309d58f1bc64641f8e340d03342d09a363f0c1c0df040b3",
    "visual-assets/v10_1/crests/CREST_IMG_MONTPELLIER_V1_512.webp":"f5f89d185d5c94ad4b50f3173d77dbe687ed2a26e403c145a15c537e36714163",
    "visual-assets/v10_1/crests/CREST_IMG_NANCY_V1_512.webp":"20f8b0eae50b91a2aa5b2570aad3e0b8d1c49dab04ae8f8c6dd1f4fd1cd7651f",
    "visual-assets/v10_1/crests/CREST_IMG_NANTES_V1_512.webp":"5f33858dde442ecc8d0874834160f43d690f9411886563e013c88fec66ede3c7",
    "visual-assets/v10_1/crests/CREST_IMG_NAPOLI_V1_512.webp":"7b1dba0416375b1b768124540a2551ac584ee483adda9608c307349eda2db5a3",
    "visual-assets/v10_1/crests/CREST_IMG_NICE_V1_512.webp":"b1f02d6890d4037d5f6a49f515b266ddba7e15061538f2dbaf0eef81334e4545",
    "visual-assets/v10_1/crests/CREST_IMG_OSASUNA_V1_512.webp":"ba39b1ac5aeed68ca4935708d27a76f55b81cf3f1442082d7495f3fdc20f7d3f",
    "visual-assets/v10_1/crests/CREST_IMG_PALACE_V1_512.webp":"ac1e311641191e3fd9aef5ec06c5b8ffbccf4b96f7344cdceaf5fd51e5b02c2f",
    "visual-assets/v10_1/crests/CREST_IMG_PALERMO_V1_512.webp":"c1c31919a38b907479f77647e205e890ab3cb8fde8f5c231603a10bfe52d2430",
    "visual-assets/v10_1/crests/CREST_IMG_PESCARA_V1_512.webp":"c216e6879594bc74514242bc66168ba8fd37a0f6bd47e6f1440014df39de2212",
    "visual-assets/v10_1/crests/CREST_IMG_PSG_V1_512.webp":"0a8c993b7647c7c8c930e83cb7984f43a74fa3897593e210456f6d89a7273f36",
    "visual-assets/v10_1/crests/CREST_IMG_REALMADRID_V1_512.webp":"3e22f86757f859d64a6444493c8015748d78b1890fe7b8e098d63afbe325b168",
    "visual-assets/v10_1/crests/CREST_IMG_REALSOCIEDAD_V1_512.webp":"282b1f926bf63a6d305c3fc2c28bc25f594f0735102c4c44ec6862bf0e711e02",
    "visual-assets/v10_1/crests/CREST_IMG_RENNES_V1_512.webp":"3e68192ad030c5a3df8624d712d37b9d9600b62b4ce44737f22704f90254e2bf",
    "visual-assets/v10_1/crests/CREST_IMG_ROMA_V1_512.webp":"7a1c068a25879c452c0259451fea949d35191a271f97ecf2e72f9023985c6449",
    "visual-assets/v10_1/crests/CREST_IMG_SAINTETIENNE_V1_512.webp":"cb686bf4f75b8ccf96055f99f8c8b256350095342f0a6c9f3b9029c8c7f4466a",
    "visual-assets/v10_1/crests/CREST_IMG_SAMPDORIA_V1_512.webp":"a7be4f9665de69ccffcf0ac503a7cbd46efcccb37d38aba1cda1353689abc534",
    "visual-assets/v10_1/crests/CREST_IMG_SASSUOLO_V1_512.webp":"1c294e1c5bcc2b9b872be67d047be1d97fb5016d5311e99e20cf06148a6f1b26",
    "visual-assets/v10_1/crests/CREST_IMG_SCHALKE_V1_512.webp":"2c996c2b36606da4803216f6611faa20de2c2389cca4b2269c6b0a5a23deabf9",
    "visual-assets/v10_1/crests/CREST_IMG_SEVILLA_V1_512.webp":"2438c72f31a1f1d027ae6c8d02f755335a9a13a632d7d199d4d64ae78f683228",
    "visual-assets/v10_1/crests/CREST_IMG_SOUTHAMPTON_V1_512.webp":"4712d4d6afba0573db4dc83033f35a7309be0214a0f51de85b377c597bdb25d3",
    "visual-assets/v10_1/crests/CREST_IMG_SPORTING_V1_512.webp":"65aa6586f693b72b2f37fe0c416548a12afc8989d1c0c982debceb31df89a551",
    "visual-assets/v10_1/crests/CREST_IMG_SPURS_V1_512.webp":"d66fc2b09debec442466e827ffa173c9d636a9fd17a5b31367ecbb984104f5ce",
    "visual-assets/v10_1/crests/CREST_IMG_STOKE_V1_512.webp":"9795910a646a68115de7bf5b0e20c9d5dd72689556c615ca709288edbf9cca1d",
    "visual-assets/v10_1/crests/CREST_IMG_SUNDERLAND_V1_512.webp":"c5af219934ce65d871a192bd02f0559a725cb5608ffa675561b98e4a13babfb3",
    "visual-assets/v10_1/crests/CREST_IMG_SWANSEA_V1_512.webp":"f35583efc460684ba61b253e34066f9f202bcd39d597141945f61e388a9aac29",
    "visual-assets/v10_1/crests/CREST_IMG_TORINO_V1_512.webp":"3edc9ead3928b6f8b10b6f404a18af18b84bc6c4778a971ac0ca6b9ad430dd9c",
    "visual-assets/v10_1/crests/CREST_IMG_TOULOUSE_V1_512.webp":"121689ed5672ca4321af30e69ec60f515e4388ad39dc427b035702006888a737",
    "visual-assets/v10_1/crests/CREST_IMG_UDINESE_V1_512.webp":"4a87eccb189b79aefdc26e6dd032ebd645e371e475b33d901ece40c87da9f13f",
    "visual-assets/v10_1/crests/CREST_IMG_VALENCIA_V1_512.webp":"46394bbeb0f363e483e662639620f6d539d143e8e2683a4c7b3aa5e41a339c87",
    "visual-assets/v10_1/crests/CREST_IMG_VERONA_V1_512.webp":"5df2099ca24a7e6749737d8797a9f3ef03ddc01293412a4b36fa1274e1e50946",
    "visual-assets/v10_1/crests/CREST_IMG_VILLARREAL_V1_512.webp":"7cf2a62ff73de9292290ab4a434d11c5aeba78d3d908c27e8755f17b6d4add97",
    "visual-assets/v10_1/crests/CREST_IMG_WATFORD_V1_512.webp":"2a456340f6e51e472ac74e4706491885ec12747678cf39e6b706053df2ef378c",
    "visual-assets/v10_1/crests/CREST_IMG_WBA_V1_512.webp":"71e49f532e76f9e08ed212b246587c95b8e0eeee4eae05e0f02714180e7732bc",
    "visual-assets/v10_1/crests/CREST_IMG_WESTHAM_V1_512.webp":"c8390c2dcc6df120af07cb6bdc2a83137918dd927f1fa305fa2560dfcebb1db9",
    "visual-assets/v10_1/crests/CREST_IMG_WOLFSBURG_V1_512.webp":"994be3732a266d48e0298e93e26045b39e4f274e4cd25604592cef3a95ac1a0d",
    // HO-093 (Team V, claude/project-thread-vraiao 78ca16060 project-documents/hc-art/ho093/): image crests Fiorentina, Crotone, Chievo, Sampdoria, Osasuna, Angers, Bordeaux, Guingamp, Nancy, Rennes, Saint-Étienne, Toulouse.
    "visual-assets/v10_1/crests/CREST_IMG_ANGERS_V1_256.webp":"9d6e1238fdedda44ac99d0caa4a5f7dcdecaadc960b31f80b75d2655513c0d35",
    "visual-assets/v10_1/crests/CREST_IMG_ANGERS_V1_64.webp":"eb8a11f759ebbb88b6522a9ea550a7ee4c22de2f21aaa99c1d289b712efbea4d",
    "visual-assets/v10_1/crests/CREST_IMG_BORDEAUX_V1_256.webp":"73c61804cc1ae05d1996da25d6cfc875da8fe5330b7df192e58852eed45cdb86",
    "visual-assets/v10_1/crests/CREST_IMG_BORDEAUX_V1_64.webp":"6378a43c71c2a1dd0e5fbbdf9f0419736f8d69b88f916e744092f41bbfae1360",
    "visual-assets/v10_1/crests/CREST_IMG_CROTONE_V1_256.webp":"eb49fbb0cb9d8fcb0686f666421230ca7f758cee1bf6d97a677dc49ef52c4cd7",
    "visual-assets/v10_1/crests/CREST_IMG_CROTONE_V1_64.webp":"7ad4ba19c88ed5fa941d3b42eec5b7d0a1430239613161f444f42f9ad425298a",
    "visual-assets/v10_1/crests/CREST_IMG_FIORENTINA_V1_256.webp":"7646f056faaa3ffa0fd554d220c16b5fd6e049798685641e6f83c6003c06f2b0",
    "visual-assets/v10_1/crests/CREST_IMG_FIORENTINA_V1_64.webp":"8807b71b14304456c53682e8ca7683df0016724142a99cbbafd5578b081bca1b",
    "visual-assets/v10_1/crests/CREST_IMG_GUINGAMP_V1_256.webp":"fb2188dd899478e2db66d7133c74b95979da91b2bf3d2e0f303fe40d74396ff3",
    "visual-assets/v10_1/crests/CREST_IMG_GUINGAMP_V1_64.webp":"4e5dbeb3f395e279dd826df39ac23b04f026d6905f84a9b8d0fcef849520f02c",
    "visual-assets/v10_1/crests/CREST_IMG_NANCY_V1_256.webp":"9468be7d803c3229e2db023795c109ed8987eeb481d1284cd6d6d46709d5c85c",
    "visual-assets/v10_1/crests/CREST_IMG_NANCY_V1_64.webp":"2ac35d1071193894e6401cdf3dbbb291a3cf4d4a97e2c9028186ec368b5bf81e",
    "visual-assets/v10_1/crests/CREST_IMG_OSASUNA_V1_256.webp":"9189238a8ba3b7a00aa470d5ec4e7e5603b5e0ef2a948ca7ec4e2f5393cb4fa7",
    "visual-assets/v10_1/crests/CREST_IMG_OSASUNA_V1_64.webp":"0801d178abd41a863e50ba94ae8dde27826c7c1af3b9cb5d0e257f2bc2045858",
    "visual-assets/v10_1/crests/CREST_IMG_RENNES_V1_256.webp":"9f566f527a1bb99ffbd471cda065eca8806abd9dbdd7bbf03289d7ad737cd96f",
    "visual-assets/v10_1/crests/CREST_IMG_RENNES_V1_64.webp":"c353a9e3219ed828c5d3e8ae133bbc82c743977d977332b107e7d6e09c7b117d",
    "visual-assets/v10_1/crests/CREST_IMG_SAINTETIENNE_V1_256.webp":"810fe73b2638849ed362e8c2f5dba8d342806ddc8c54facef1f23a6e8f454cd1",
    "visual-assets/v10_1/crests/CREST_IMG_SAINTETIENNE_V1_64.webp":"01028aea839f7287efb06a91f8ac932f7d11d62e2a78a700f8ffd4c7c1e2a2de",
    "visual-assets/v10_1/crests/CREST_IMG_SAMPDORIA_V1_256.webp":"64f3129e02f2d11f97f48f7187e54f7df6db9f01a93beacff093e2ddcb476ddc",
    "visual-assets/v10_1/crests/CREST_IMG_SAMPDORIA_V1_64.webp":"ce3ee34ca248a8c380e236ef30230d71652ae38681eca34525ca81dcca996047",
    "visual-assets/v10_1/crests/CREST_IMG_TOULOUSE_V1_256.webp":"470106c6705143bfe37e76bc3ce971481860b2196834605c3c802d9a986ab50d",
    "visual-assets/v10_1/crests/CREST_IMG_TOULOUSE_V1_64.webp":"a450c8a35a0335068eda93b8c09bc52ee8e4bc6ff74e16e8d2964bf9ee79f451",
    "visual-assets/v10_1/crests/CREST_IMG_VERONA_V1_256.webp":"d2b8537c249ec0ba528f965bdbd2367aa869e2251ab11d13b64d9e9e0b5b7a3b",
    "visual-assets/v10_1/crests/CREST_IMG_VERONA_V1_64.webp":"db0148b4d07760b8c7d6f0d33c4cd5dd6b452f493456b1b35096a314fbef2d99",
    // HO-092 (Team V, claude/project-thread-vraiao 78ca16060 project-documents/hc-art/ho092/): image crests Werder Bremen, SC Freiburg, Mainz 05, Darmstadt 98, Hoffenheim, Bologna, Cagliari, Empoli, Sassuolo, Udinese, Leganés.
    "visual-assets/v10_1/crests/CREST_IMG_BOLOGNA_V1_256.webp":"be5f5ed4dcc04cd657d207e9803a1e6bc145b8f1332da5b882db9554765fa942",
    "visual-assets/v10_1/crests/CREST_IMG_BOLOGNA_V1_64.webp":"31aab0b0225927d2970f9d827c7888c291b65d26694371a37e81a838afb586a3",
    "visual-assets/v10_1/crests/CREST_IMG_BREMEN_V1_256.webp":"c10348963ed08901b494d637c777c8ff1c3b6ae0762186b3da9a01f02cadcadc",
    "visual-assets/v10_1/crests/CREST_IMG_BREMEN_V1_64.webp":"7c50961b7dca02c89830cefc55bd3e0ce32b4496757efdc87c3d42264cfaafa8",
    "visual-assets/v10_1/crests/CREST_IMG_CAGLIARI_V1_256.webp":"ddf45478793c955e6e5761a501f221ec1d5fea5e7705a38424a8e57b98ff9089",
    "visual-assets/v10_1/crests/CREST_IMG_CAGLIARI_V1_64.webp":"67386bb7a7bbc653fd406270273baf4448693e7888f1cb349795684c7af4a295",
    "visual-assets/v10_1/crests/CREST_IMG_DARMSTADT_V1_256.webp":"f91d925497dc0324663fe62e516bef078787dd9ff27f06887cb8cf55eb5f278e",
    "visual-assets/v10_1/crests/CREST_IMG_DARMSTADT_V1_64.webp":"a72de7aafe3b0e23e72275a81b8263ad2138108eacf34a16e58fddb143ace8ee",
    "visual-assets/v10_1/crests/CREST_IMG_EMPOLI_V1_256.webp":"4dfd65231f35a9b688e386d96cd22cbc242d28b847d10a001f8824bee50d0524",
    "visual-assets/v10_1/crests/CREST_IMG_EMPOLI_V1_64.webp":"c3d6992403a58b23eeac2adcd717a03db33da1d7725d5eb3ce37f2361b1d4da1",
    "visual-assets/v10_1/crests/CREST_IMG_FREIBURG_V1_256.webp":"4101f9cc218ac16d21ee81c2c6108d27120f68ee9de8c1e3f4f17f5aef7c967a",
    "visual-assets/v10_1/crests/CREST_IMG_FREIBURG_V1_64.webp":"cd1ca3da5fcbc47f2e85d0c1ede1eb0cd6c1fa54aa49a6cd4fabc3df114c6097",
    "visual-assets/v10_1/crests/CREST_IMG_HOFFENHEIM_V1_256.webp":"28dead789b61ac56b52e1d4031d966d1b2bb24809f335e05887afb122428bfe6",
    "visual-assets/v10_1/crests/CREST_IMG_HOFFENHEIM_V1_64.webp":"058f454d7f5aee7b11766c212c781813acf884ff4f52f8d19f31a2ac0b59e0e1",
    "visual-assets/v10_1/crests/CREST_IMG_LEGANES_V1_256.webp":"3fed4fa16aab2f6da40fa615bb6d008a37298fcdfcd4191efb783e857f7f9527",
    "visual-assets/v10_1/crests/CREST_IMG_LEGANES_V1_64.webp":"708e40921e22c625058da9c60218243989bc2453cd5928da47fde0dd1951d6d0",
    "visual-assets/v10_1/crests/CREST_IMG_MAINZ_V1_256.webp":"02b2006d5d8751356a57ec1977909ea8e39202155ed4e040ac5437fe3ff52497",
    "visual-assets/v10_1/crests/CREST_IMG_MAINZ_V1_64.webp":"03429c078135c0a07346011ff4cb29c6f12ebed21d131df54cb2b29f4bc6dd35",
    "visual-assets/v10_1/crests/CREST_IMG_SASSUOLO_V1_256.webp":"9fff7335b9a4b5abf43393cf1e9ec0daac6e951825fb42bec07add666778a40d",
    "visual-assets/v10_1/crests/CREST_IMG_SASSUOLO_V1_64.webp":"04070588ecad0e1381da9fbdbedcab910b277ed0d46a4891a0ddcf905f3305fa",
    "visual-assets/v10_1/crests/CREST_IMG_UDINESE_V1_256.webp":"e5e646469413a841fe9323f615b16defca09f110723d6ea19ea238bf42858586",
    "visual-assets/v10_1/crests/CREST_IMG_UDINESE_V1_64.webp":"b81d2c406669ddf32d5c630cd4f79dbf845cdd961534d3d5019073e200777863",
    // HO-091 (Team V, claude/project-thread-vraiao 652e203d4 project-documents/hc-art/ho091/): image crests Marseille, Montpellier, FC Augsburg, Juventus, Milan, Bayern Munich, Borussia Dortmund, Schalke 04, Hertha BSC, Hamburg.
    "visual-assets/v10_1/crests/CREST_IMG_AUGSBURG_V1_256.webp":"90781a5c6cc8970f8c3fe283924bbb04636c76dcfbae9ad5020a2a483e719490",
    "visual-assets/v10_1/crests/CREST_IMG_AUGSBURG_V1_64.webp":"31913d2bd1e9f8f566e0ba34ca81e46819a9a60bc9437f7612d820d032bfa683",
    "visual-assets/v10_1/crests/CREST_IMG_BAYERN_V1_256.webp":"27386ccec13e5cb5af0c13085093a30ba2e974f084eb8a3751a7046fa5475393",
    "visual-assets/v10_1/crests/CREST_IMG_BAYERN_V1_64.webp":"a148b0d2315d57e2e5ab3acdfe0f54f26d0e1fbe4c0c213e9cbe0059e6cb7469",
    "visual-assets/v10_1/crests/CREST_IMG_DORTMUND_V1_256.webp":"2a9d5a4b0000617666231ce4b53554fab8793832ecaf17f8f261b7a990efd54e",
    "visual-assets/v10_1/crests/CREST_IMG_DORTMUND_V1_64.webp":"aaa0f0141e6653958437dd6ec87d3c5fdfa8a61e0280a778cd6decbd3b856f3c",
    "visual-assets/v10_1/crests/CREST_IMG_HAMBURG_V1_256.webp":"3778f76e8fb0f9650f83aeef79cd3313b44b87f840d753cce93877246c04b720",
    "visual-assets/v10_1/crests/CREST_IMG_HAMBURG_V1_64.webp":"fe2eb8f176183187c746de61a6e753ea666971535e07d5dad2381d891d05f703",
    "visual-assets/v10_1/crests/CREST_IMG_HERTHA_V1_256.webp":"cb95b0511d05b9185b82407b08b2baec703497403febee8b34e4f491ced1b5b0",
    "visual-assets/v10_1/crests/CREST_IMG_HERTHA_V1_64.webp":"b47e2495650e77208dcffe607d88c2b3e1d91672509aa818dd59e9681f26ee96",
    "visual-assets/v10_1/crests/CREST_IMG_JUVENTUS_V1_256.webp":"b7201f22ef1092087d7ea23942ccd3e7ba899ec507d8933b09da727e98d77399",
    "visual-assets/v10_1/crests/CREST_IMG_JUVENTUS_V1_64.webp":"c973de7b88068f264e486e44e3e86088ecec031a937bcf061bc8d2a84d078144",
    "visual-assets/v10_1/crests/CREST_IMG_MARSEILLE_V1_256.webp":"0e857da6d923f9cb6b2d344ec9be067aea69efc4e9e00fd07ef1cb8de8ffc9ec",
    "visual-assets/v10_1/crests/CREST_IMG_MARSEILLE_V1_64.webp":"7dcb9e1f2d66badf75b1b5a2bbd7c36680f4e94257ae30f92d3f6771e14b242c",
    "visual-assets/v10_1/crests/CREST_IMG_MILAN_V1_256.webp":"72a7561e80831a6615376c7e12d15cc985d43890e97a2eff4c9357718c40bef8",
    "visual-assets/v10_1/crests/CREST_IMG_MILAN_V1_64.webp":"21e935b2eb703b0d0663b5220cccdbf80a06c4f52bad73c09a3dd7839fdbbcde",
    "visual-assets/v10_1/crests/CREST_IMG_MONTPELLIER_V1_256.webp":"7012ca0d4af7ef75a1d7600846a0960ac7133db997cd14365cb41b79adc9727d",
    "visual-assets/v10_1/crests/CREST_IMG_MONTPELLIER_V1_64.webp":"2b62ee78aecbe7d6dd39049633076a82ffdf2cecf29de5da113a6a215aa3e202",
    "visual-assets/v10_1/crests/CREST_IMG_SCHALKE_V1_256.webp":"181b084edd924c96fcdc1ed9393f2dacf0d654f6c419d79068e592495f8b9846",
    "visual-assets/v10_1/crests/CREST_IMG_SCHALKE_V1_64.webp":"2ab8a40f9a3db2469f7e9e8ee3ce9f7dd64f511619d9a6953c01da4d2af31afd",
    // HO-090 (Team V, claude/project-thread-vraiao b58b30b0 project-documents/hc-art/ho090/): image crests Villarreal, Valencia, Las Palmas, Athletic Club, Sunderland, Inter Milan, RB Leipzig, Nantes, Paris Saint-Germain, Monaco.
    "visual-assets/v10_1/crests/CREST_IMG_ATHLETIC_V1_256.webp":"8512966a424fcb48f1d9ac326deb8c88fc07dfd5ee255f20291733e8d3e14b70",
    "visual-assets/v10_1/crests/CREST_IMG_ATHLETIC_V1_64.webp":"12bd23114c41eefb68f55a9e84ba514a8fe957f3b1699726557e8ab35c55e5ea",
    "visual-assets/v10_1/crests/CREST_IMG_INTER_V1_256.webp":"44af41e69444c90c2fca4d3c8636cd159c37ee4acbb6c31f8c6cbcf95876f4c1",
    "visual-assets/v10_1/crests/CREST_IMG_INTER_V1_64.webp":"edcfa587c6fb70c5699ce451c1894f39f182e685d52841e4c6d9cb75c9db2a42",
    "visual-assets/v10_1/crests/CREST_IMG_LASPALMAS_V1_256.webp":"719663b6d7c4197f8d1689b052984a7eeca1670c7a4b3e08c4ac96e1a803befb",
    "visual-assets/v10_1/crests/CREST_IMG_LASPALMAS_V1_64.webp":"f8277c07a120c0e127ec08f4f271a4a8dd0ec1e7c57aa613727e9a15ba5df508",
    "visual-assets/v10_1/crests/CREST_IMG_LEIPZIG_V1_256.webp":"5197952a745628c1f8ae899a11de55edd4eafeed79abec30950712a51ed820a8",
    "visual-assets/v10_1/crests/CREST_IMG_LEIPZIG_V1_64.webp":"daef876b4b955ac0e0fecce2436bc99995bd5172b8ce95e6cdb050cc358f8670",
    "visual-assets/v10_1/crests/CREST_IMG_MONACO_V1_256.webp":"c48d16fc9eef05ef4b6e7997e0609c00edfae941cd323ca2492ab50b070b3743",
    "visual-assets/v10_1/crests/CREST_IMG_MONACO_V1_64.webp":"7155161fbbafe5145b34b2bd7608e1d37154fc38488773b5d69f459cb82d8e70",
    "visual-assets/v10_1/crests/CREST_IMG_NANTES_V1_256.webp":"f29e2e701d85fd69c38c0dd6be41bef0aef3564837baff09a570b8fe04ea92b6",
    "visual-assets/v10_1/crests/CREST_IMG_NANTES_V1_64.webp":"146dadeda64afa97aa89f8b353be626b385b51d4ba91e797c61008b0aa29e4ab",
    "visual-assets/v10_1/crests/CREST_IMG_PSG_V1_256.webp":"e8f09eed24261f1268b06da8cdb2a52561270a8619aca95deeffa5d9f24c3eaf",
    "visual-assets/v10_1/crests/CREST_IMG_PSG_V1_64.webp":"2c393de0ffa8e1cc0e08d82b902a1e48a6f68683b1e68e7d5de601417f4dc304",
    "visual-assets/v10_1/crests/CREST_IMG_SUNDERLAND_V1_256.webp":"ace07a69a989f68fa9fb1ee0cbfe641da165b56a3ecc512449c0ce5bb00d70d5",
    "visual-assets/v10_1/crests/CREST_IMG_SUNDERLAND_V1_64.webp":"4c4341d33fc9b78ac165933c46b058b1718a1c2c00ea1e766f68ced42fac35b9",
    "visual-assets/v10_1/crests/CREST_IMG_VALENCIA_V1_256.webp":"5369f372dc115a7fb0bd3e3e72bbd64ef389422dcf6315e260bbcb95f643fab6",
    "visual-assets/v10_1/crests/CREST_IMG_VALENCIA_V1_64.webp":"a0fb1b7d4d641899b3d74c4439d046747a229f8f54956805285182db7d187c5d",
    "visual-assets/v10_1/crests/CREST_IMG_VILLARREAL_V1_256.webp":"97b56c4c31b4eabdf5dde5407bc94ec2ed50632cf6d5309726c3c1187676dcdd",
    "visual-assets/v10_1/crests/CREST_IMG_VILLARREAL_V1_64.webp":"c58179d531db83c233659136e2bb8f3c003ffeb95333e2ab00ebf2b37b72cc86",
    // HO-089 (Team V, claude/project-thread-vraiao b5825f3b project-documents/hc-art/ho089/): image crests Real Madrid, Celta Vigo, Deportivo La Coruña, Eibar, Espanyol, Granada, Málaga, Real Betis, Real Sociedad, Sporting Gijón.
    "visual-assets/v10_1/crests/CREST_IMG_BETIS_V1_256.webp":"eb823932318c4c1165de9a60312407fccfdf811100c3c806bd3bc0948fdf61cf",
    "visual-assets/v10_1/crests/CREST_IMG_BETIS_V1_64.webp":"ebd84583e7ccdd1d66b12c725f2b22911b34915823aa4a4742491e65f6b703dd",
    "visual-assets/v10_1/crests/CREST_IMG_CELTA_V1_256.webp":"9de23cc5d5891c2846cd65c4a5181890895e9a525b063723fa6b6ed642adff9b",
    "visual-assets/v10_1/crests/CREST_IMG_CELTA_V1_64.webp":"fefcd5da96bd59c9cbd63d3c24c1c9818732ed3c1c5505dec5ae4bb04bfcaa54",
    "visual-assets/v10_1/crests/CREST_IMG_DEPOR_V1_256.webp":"280e232fcde08a5baf10db7a85c2ed3b1abda8b1e19eda83e7b12b5444ccb5cc",
    "visual-assets/v10_1/crests/CREST_IMG_DEPOR_V1_64.webp":"36a318e92fa5f4f8e3d3632ce3761e025686fe06a0800cae3203d03ecdd7e551",
    "visual-assets/v10_1/crests/CREST_IMG_EIBAR_V1_256.webp":"263d1df308525d0cf0edcd7712cd7faca948907bf662f5afdf3261a155917551",
    "visual-assets/v10_1/crests/CREST_IMG_EIBAR_V1_64.webp":"1e3ce509af6448dc6bb7abc2f7e8a9d9daac916e9585d607e83ccc49793a6ef3",
    "visual-assets/v10_1/crests/CREST_IMG_ESPANYOL_V1_256.webp":"6dbf31a568ea20af6a1da0eb4c1c53debc1c2756e222d888d953896eafaa4fd9",
    "visual-assets/v10_1/crests/CREST_IMG_ESPANYOL_V1_64.webp":"f0d23d638153e772f4fb7639ae6e1a4d1ada8a6f3dcffdb1870206496ffee188",
    "visual-assets/v10_1/crests/CREST_IMG_GRANADA_V1_256.webp":"933624e55fe5044666f0b1d92bab5a53492a158a261dc617e44e61a62f6e2a8c",
    "visual-assets/v10_1/crests/CREST_IMG_GRANADA_V1_64.webp":"3c59de09abe043d5f18c975a37442ee8cb8fb9ae784469f82d023e9feb54d87a",
    "visual-assets/v10_1/crests/CREST_IMG_MALAGA_V1_256.webp":"438fdc63cadfcf4a0f616d6f6c8b8cab2a33652797f3a0e9c7a33cd3bf60a660",
    "visual-assets/v10_1/crests/CREST_IMG_MALAGA_V1_64.webp":"db056fd6d51aa382e5d61b72d684da58709ef640d079fba297a75c7fdc23701f",
    "visual-assets/v10_1/crests/CREST_IMG_REALMADRID_V1_256.webp":"6f70ae2af944f5d692869de0126889c0b7466e032cd26bdec36f4cc2299f8d5d",
    "visual-assets/v10_1/crests/CREST_IMG_REALMADRID_V1_64.webp":"2e9779e819ebac1e729d8b19e330cfc828d66613a52207c1b87f22761c2a5c2d",
    "visual-assets/v10_1/crests/CREST_IMG_REALSOCIEDAD_V1_256.webp":"289661ca048f629af87728e2f2d0afa4af92804464032a28e6152b3828f8f27d",
    "visual-assets/v10_1/crests/CREST_IMG_REALSOCIEDAD_V1_64.webp":"876b424919ee1da822988deee48e157036c8c008a570f9a4f1885c81a197419f",
    "visual-assets/v10_1/crests/CREST_IMG_SPORTING_V1_256.webp":"0ebf17e43f1351ef5e06dfc155bd11a836e993d557565d8c02473598efb69f1d",
    "visual-assets/v10_1/crests/CREST_IMG_SPORTING_V1_64.webp":"839ac78e82e686668f569ee81fb468fa662cc392d051cca3f384bb3d9d8ae489",
    // HO-088 (Team V, claude/project-thread-vraiao 21bf799f2 project-documents/hc-art/ho088/): image crests Manchester City, Arsenal, Burnley, Stoke City, Southampton, Dijon, Lorient, Alavés, Atlético Madrid, Sevilla.
    "visual-assets/v10_1/crests/CREST_IMG_ALAVES_V1_256.webp":"6f55989b9d0acb4750741dc4fb521e5396613f3f96c94b921394e72b96eccc92",
    "visual-assets/v10_1/crests/CREST_IMG_ALAVES_V1_64.webp":"70504063f975b1fcadd4d3314077c6329eb4bef29a6390d4e82f5ef4e6f2ef5e",
    "visual-assets/v10_1/crests/CREST_IMG_ARSENAL_V1_256.webp":"269b88b9ca830ff6191af6992147ba4ed9caf1ead0b9ceed061344c6810e21a3",
    "visual-assets/v10_1/crests/CREST_IMG_ARSENAL_V1_64.webp":"c2666303f5fa09bd9d377fdedcb198ac7a16d65173243ebcfe63fe570c063139",
    "visual-assets/v10_1/crests/CREST_IMG_ATLETICO_V1_256.webp":"fe9eaadfba84c4fe8c14799a66d921bb69eb0421d636ed367644c2b220042df9",
    "visual-assets/v10_1/crests/CREST_IMG_ATLETICO_V1_64.webp":"76ca0b75cb9ff21b655c21b944886cb556e5368659107e9d2ced0e0e6ef7b8e7",
    "visual-assets/v10_1/crests/CREST_IMG_BURNLEY_V1_256.webp":"ac0c64af4a334bd78f1a093c7ac5dc656f8c1228e99e252378e9ccec3746fb7c",
    "visual-assets/v10_1/crests/CREST_IMG_BURNLEY_V1_64.webp":"f022de0d50f896053544312bfa30ad75993a08132bf40da801977baa243d18be",
    "visual-assets/v10_1/crests/CREST_IMG_DIJON_V1_256.webp":"5f9e8746723008300d6240da1b448d7d80d89891029045ca7933b1b01d7ae793",
    "visual-assets/v10_1/crests/CREST_IMG_DIJON_V1_64.webp":"63ef05a9e07a8df5937f2bfb838edd2acb9c84fc5728a542a7bfc36f51cb9f89",
    "visual-assets/v10_1/crests/CREST_IMG_LORIENT_V1_256.webp":"57f14eeebecbab7fb12bb48e2e8e708bbce7b45451a1636d658f726ec766f1ec",
    "visual-assets/v10_1/crests/CREST_IMG_LORIENT_V1_64.webp":"3279ff052a9918f1300227126a55c82e9dc6052c81df2149ca548c76d917334d",
    "visual-assets/v10_1/crests/CREST_IMG_MANCITY_V1_256.webp":"1adbf64532f365d3902e901e2b5a1728c6d431a47ba614e2967c0083ee1939a1",
    "visual-assets/v10_1/crests/CREST_IMG_MANCITY_V1_64.webp":"46d846b518ec253287c0d42555d43dccadc29efc7fe26b0cc29513b17d3aafae",
    "visual-assets/v10_1/crests/CREST_IMG_SEVILLA_V1_256.webp":"398fdef4089d7371d4e4e7317300091a03a93b8a5f77ed8353bf177069c87e21",
    "visual-assets/v10_1/crests/CREST_IMG_SEVILLA_V1_64.webp":"32b6378c6d5dcee1f26ec181dc9e57888b9875560fe34accc59713833d8d8bf1",
    "visual-assets/v10_1/crests/CREST_IMG_SOUTHAMPTON_V1_256.webp":"1634bfc16876798ec8086448aaaf555004e6668d366b32451d4466a48db9b993",
    "visual-assets/v10_1/crests/CREST_IMG_SOUTHAMPTON_V1_64.webp":"b1c82f35a96390cb12b6815b46ccccba1b90106a22a35adee1b893d06d237107",
    "visual-assets/v10_1/crests/CREST_IMG_STOKE_V1_256.webp":"7181552c884940903fecc0f1e364bdc34b51cc27b0371aea1c2c45488fe79e50",
    "visual-assets/v10_1/crests/CREST_IMG_STOKE_V1_64.webp":"52649ebb905f80796e732430c38fba71f544a469d3808295c9fa18323cafab92",
    // HO-087 (Team V, claude/project-thread-vraiao 652da8f80 project-documents/hc-art/ho087/): image crests Everton, 1. FC Köln, Borussia Mönchengladbach, Napoli, Pescara, Atalanta, Bastia, Watford, Swansea City, West Bromwich Albion.
    "visual-assets/v10_1/crests/CREST_IMG_ATALANTA_V1_256.webp":"5ffa599ca09d112f94b3fb4977672c5bd9f7e350af9d5a9a5b951bb191b5cdf5",
    "visual-assets/v10_1/crests/CREST_IMG_ATALANTA_V1_64.webp":"c1030a67e51de616cbffc443126f175a9e7c1cf657b3c2ea5787e33591ca3086",
    "visual-assets/v10_1/crests/CREST_IMG_BASTIA_V1_256.webp":"9cbb7ef91c08e9b6cb166a5be3876d56089951612f4b6a2189dcac056a9690da",
    "visual-assets/v10_1/crests/CREST_IMG_BASTIA_V1_64.webp":"98963af483d1fc42cca60f9504ea18997143a6859b2b4cfc6cbee00a0b49aaa4",
    "visual-assets/v10_1/crests/CREST_IMG_EVERTON_V1_256.webp":"6dbb32dabf277eab86ea66c95bd6a65c897ea82b8f003a49e2dc2678d62fbe36",
    "visual-assets/v10_1/crests/CREST_IMG_EVERTON_V1_64.webp":"755ce955e97ff31005c92dc388536f81a6f909717d264e6b36d3b35219276e59",
    "visual-assets/v10_1/crests/CREST_IMG_GLADBACH_V1_256.webp":"df4a9d87d9e3662dea695c42a8e63f58d0e3372e9e3575b6a5a2abf0ae0bab9b",
    "visual-assets/v10_1/crests/CREST_IMG_GLADBACH_V1_64.webp":"87ddbe16189ec06ee3b23b6a99f50c84fdd7258932f5bb3cc586c9f5f9ed2d21",
    "visual-assets/v10_1/crests/CREST_IMG_KOELN_V1_256.webp":"29aa4642ba29a6229d63a12082ed08fea75eb1a96cb5f748daa2710c4f5f5358",
    "visual-assets/v10_1/crests/CREST_IMG_KOELN_V1_64.webp":"15b67f5e431a8443bd4733234037769b07ee9fc820d17b7cf7da60346953bf6c",
    "visual-assets/v10_1/crests/CREST_IMG_NAPOLI_V1_256.webp":"6d39290d04c619e74c51aeda7eb0355e756077059dfa02ee486397747859936a",
    "visual-assets/v10_1/crests/CREST_IMG_NAPOLI_V1_64.webp":"503b18329d6bb0a6d66c965b8e997a1ec564987f931285a249ee89ee91d3da5e",
    "visual-assets/v10_1/crests/CREST_IMG_PESCARA_V1_256.webp":"8fee8d04a9df5a577edf71007bdd2e809e534c01a20a85e6c102e5df693b089d",
    "visual-assets/v10_1/crests/CREST_IMG_PESCARA_V1_64.webp":"b7439d27e399dc9ea047839171d70e3f835f81690be146d47644942c288d1100",
    "visual-assets/v10_1/crests/CREST_IMG_SWANSEA_V1_256.webp":"bdf67dff25a5b5adf4d7aa22fec92db87aac27bd7ab58c4aec5b8581fb95597b",
    "visual-assets/v10_1/crests/CREST_IMG_SWANSEA_V1_64.webp":"2a3609b251ab056441f8ddba1badf4b65168fee0b851ba58cdc98c5952335721",
    "visual-assets/v10_1/crests/CREST_IMG_WATFORD_V1_256.webp":"f57c36a8790b73a2d6c4d530f9f5ce3dfee7fee4a804a877a061c9020ecdf9cf",
    "visual-assets/v10_1/crests/CREST_IMG_WATFORD_V1_64.webp":"db2ae8869a1744314575deef58a547aece49ee857bea558bd7f1a139173120de",
    "visual-assets/v10_1/crests/CREST_IMG_WBA_V1_256.webp":"119e9f2fccb97761b8381032ac7b92d5f9bb2ca632c07e490ee5af6e2c78e4c7",
    "visual-assets/v10_1/crests/CREST_IMG_WBA_V1_64.webp":"4997866b9ca0c3dfd4f723500af005579de30787fd85d8b06ba92985b1165ec6",
    // HO-086 (Team V, claude/project-thread-vraiao a311c234a project-documents/hc-art/ho086/): image crests Palermo, Nice, Crystal Palace, FC Ingolstadt, Bournemouth, Caen, Leicester City, Hull City, Wolfsburg, Lille.
    "visual-assets/v10_1/crests/CREST_IMG_BOURNEMOUTH_V1_256.webp":"7d4fdd3a9a4fb509cb60c85a9a821200b94dab7f80b2c0277d6a987331b282df",
    "visual-assets/v10_1/crests/CREST_IMG_BOURNEMOUTH_V1_64.webp":"c3b7991451a51d2270989105f9ac348106e12d723f65a09df4dbb969c14356df",
    "visual-assets/v10_1/crests/CREST_IMG_CAEN_V1_256.webp":"5c457c1e2ca5a95c77c954c66b11cca7957037f22fded2f7aa498c7d37fc100f",
    "visual-assets/v10_1/crests/CREST_IMG_CAEN_V1_64.webp":"88eca2b3b8dcb0517f02e960bede58810015fc605c835684c7ede5e7175ab1a1",
    "visual-assets/v10_1/crests/CREST_IMG_HULL_V1_256.webp":"005825d01655ba3cb0a77850a1b416f779f7ee2b9b9f2a78eb62b631ba34b393",
    "visual-assets/v10_1/crests/CREST_IMG_HULL_V1_64.webp":"89e273a555247a531b86d6281d550ccc28c2d30b3b2ef90a3686ae5e2294d023",
    "visual-assets/v10_1/crests/CREST_IMG_INGOLSTADT_V1_256.webp":"d54f46af20f54d97c0db73264d963e19cc596527959b7f0c0ef6516559354b20",
    "visual-assets/v10_1/crests/CREST_IMG_INGOLSTADT_V1_64.webp":"638eab6b368f97b635056b5802560e4feeccf7d635682a8e97ba8af854a1fbed",
    "visual-assets/v10_1/crests/CREST_IMG_LEICESTER_V1_256.webp":"a852944ac339cec80c9d40e176db7498cc2d523eadc9a328f8c540c06c766081",
    "visual-assets/v10_1/crests/CREST_IMG_LEICESTER_V1_64.webp":"4106238effce17466fdd7abeea34b5bd3196646c315c78b3f27aba0c4f083ea0",
    "visual-assets/v10_1/crests/CREST_IMG_LILLE_V1_256.webp":"cfd5abf62e277228ca22c6c4243f6864604569dc8ab68728750bcbf6d83539e0",
    "visual-assets/v10_1/crests/CREST_IMG_LILLE_V1_64.webp":"37ff68da1fdd01cde21763d92b3671297e772be9a6c36e5d7563197436eae0ae",
    "visual-assets/v10_1/crests/CREST_IMG_NICE_V1_256.webp":"94da6637bfeeec84565b1015047e3eaeb2cdf6963d55b03493ef5cb98f19028d",
    "visual-assets/v10_1/crests/CREST_IMG_NICE_V1_64.webp":"8172eb4a807b6adce716f9de6be69ffd3d6c3504e0762f1753669e477c1583ba",
    "visual-assets/v10_1/crests/CREST_IMG_PALACE_V1_256.webp":"6600b4cf3b96b42659f2f5a3be861a55f2471d2f9d63b2b83e8aaa4d748376e4",
    "visual-assets/v10_1/crests/CREST_IMG_PALACE_V1_64.webp":"f30e04e8af81394a2b80af27ace1f52b7fd48e4c37425b663e5596ee4d86d0f1",
    "visual-assets/v10_1/crests/CREST_IMG_PALERMO_V1_256.webp":"31030e6d9d70479211e0651464470502f844ca36e1bb15f34558b4acd29ce2b0",
    "visual-assets/v10_1/crests/CREST_IMG_PALERMO_V1_64.webp":"39825c00574cacc5a578544c32270b44529d0297e71b974b28480c9d991bf1ea",
    "visual-assets/v10_1/crests/CREST_IMG_WOLFSBURG_V1_256.webp":"7466a318f3b886b35ae9249229b856edaf01dd6af006aac877b0cdbd892fcb0e",
    "visual-assets/v10_1/crests/CREST_IMG_WOLFSBURG_V1_64.webp":"1966bef7f67f9452253209937c4f9cf6dba7f60a3763582627903c0755e74c0a",
    // HO-085 (Team V, claude/project-thread-vraiao 27cf5daf8 project-documents/hc-art/ho085/): image crests Manchester United, Liverpool, Tottenham Hotspur, Roma, Lyon, Bayer Leverkusen, Lazio, Eintracht Frankfurt, Genoa, Middlesbrough.
    "visual-assets/v10_1/crests/CREST_IMG_BORO_V1_256.webp":"141c4869c50e8cf5ef50d7b584add10259e830b8631258433227a4310958bb13",
    "visual-assets/v10_1/crests/CREST_IMG_BORO_V1_64.webp":"7591da62279ed2131d74fd2946d80a4d1d1ca4ef11888f86cc5388465e8bb1d8",
    "visual-assets/v10_1/crests/CREST_IMG_FRANKFURT_V1_256.webp":"04de775e1e75e214afb9d02451e0b8ad5e0563a3da18eb8a5a0086ea85a06403",
    "visual-assets/v10_1/crests/CREST_IMG_FRANKFURT_V1_64.webp":"49ab3ae40c05c47c769c5365ae9eba388ceb3067b23f6e41dd223a94278e4c94",
    "visual-assets/v10_1/crests/CREST_IMG_GENOA_V1_256.webp":"d81861fab314544cd3513e58f4c526802a1d3973fed9a2df25f0d991f588e3c4",
    "visual-assets/v10_1/crests/CREST_IMG_GENOA_V1_64.webp":"1cf0a36d65eb1601276c1f5eeb21f9ed75a137fb14984f965d951d97d2124881",
    "visual-assets/v10_1/crests/CREST_IMG_LAZIO_V1_256.webp":"706cf52a05e7b991f0518f0089b4b8b2b5eb200f76753702287a1bed5ed76792",
    "visual-assets/v10_1/crests/CREST_IMG_LAZIO_V1_64.webp":"4c6e54c76ce5a7d438eaac2a480261baca89226fcf5b0bca478fb39f444307c8",
    "visual-assets/v10_1/crests/CREST_IMG_LEVERKUSEN_V1_256.webp":"ced63daad428bae8c1b99e7f5276b1498713446c358c51ef46f10b70d7b7865e",
    "visual-assets/v10_1/crests/CREST_IMG_LEVERKUSEN_V1_64.webp":"a6bf68d8882a7e0c385a617a891ee1c83455510dc8b6a228a2565e4ed876cb6b",
    "visual-assets/v10_1/crests/CREST_IMG_LIVERPOOL_V1_256.webp":"0b09412a4d6a1b2026d3f757984352f2e7f5567af903bf0eb21a405064d11b07",
    "visual-assets/v10_1/crests/CREST_IMG_LIVERPOOL_V1_64.webp":"fc23301ea9ddfd461fe644f76a5fc43bc378cff325d49894315e20d9c1714304",
    "visual-assets/v10_1/crests/CREST_IMG_LYON_V1_256.webp":"36740d82dcdf06cdadc721af32a5bd6f6113916392c2e28488f840a03e5e01f6",
    "visual-assets/v10_1/crests/CREST_IMG_LYON_V1_64.webp":"55b5d4c12e02c755f7d6a004476a7cfd9fa52ae7dc441a174ce8a0068b8ce5f3",
    "visual-assets/v10_1/crests/CREST_IMG_MANUTD_V1_256.webp":"900b66a8fa1f47f7b1be2d6a4ca35805a0d216b5a51e35646faeb5d960cc188f",
    "visual-assets/v10_1/crests/CREST_IMG_MANUTD_V1_64.webp":"a147c6deb061258aba099d0de6cda07f42c69d273015e6c0d30edd9fe3ceac7b",
    "visual-assets/v10_1/crests/CREST_IMG_ROMA_V1_256.webp":"16e8d62d15b827ec50beca8d5c87976734ba95dc59a12cddbe5aa2ff7b24b630",
    "visual-assets/v10_1/crests/CREST_IMG_ROMA_V1_64.webp":"c3e08eceee8cbc98abac283a75e13c1dc996a450a49916934612c95a6b41a49d",
    "visual-assets/v10_1/crests/CREST_IMG_SPURS_V1_256.webp":"417729674d6a122c14956155cf60afb0eabd368f284a6aadf7a434a41fb3dc8f",
    "visual-assets/v10_1/crests/CREST_IMG_SPURS_V1_64.webp":"903372e834cf1c9151c01e2b0749045b23212f1abc85715e1e0e41619f4a6d98",
    // HO-094 (Team V, Nik OK 2026-11-16): the empty handcrafted club lounge behind the Club Assignment draw. Loaded on demand.
    "visual-assets/v10_1/plates-hc/ENV_CLUB_PLATE_HC_V3_1X.webp":"94ede8cb779c0145d0fdd34366532d7f694a26d244a344d3fd40dea1c3c3d98b",
    "visual-assets/v10_1/plates-hc/ENV_CLUB_PLATE_HC_V3_2X.webp":"e13f759d41020906dc9b1e41604defdf81982b322333d28943e177c49fb74e53",
    "visual-assets/v10_1/plates-hc/ENV_CLUB_PHONE_HC_V3.webp":"e3e8aedb6a904c119da2608d135bae4c0a83c524a692bba863354fb127e64375",
    // HO-095 (Team V, Nik OK 2026-11-17): the phone crops of the same room, upright and sideways. Loaded on demand.
    "visual-assets/v10_1/plates-hc/ENV_CLUB_PHONE_HC_V4.webp":"068c48aa2dec2b11e482aa7e76549ecdd94b96ba71d7cc31f7954da028cb71f0",
    "visual-assets/v10_1/plates-hc/ENV_CLUB_SIDEWAYS_HC_V4.webp":"488bf0e1cef4a27b5171f71504fd1e15ea48c7f9561ee1e6587e845e54c80280",
};
const V10_UNVERSIONED_FIRST_GENERATION=new Set([
  "visual-assets/v10_1/chamber-men/assets/concrete_512.webp",
  "visual-assets/v10_1/chamber-men/assets/crowd_atlas_1k.webp",
  "visual-assets/v10_1/chamber-men/assets/crowd_atlas_2k.webp",
  "visual-assets/v10_1/chamber-men/assets/crowd_tint_1k.webp",
  "visual-assets/v10_1/chamber-men/assets/flare_256.webp",
  "visual-assets/v10_1/chamber-men/assets/net_cell_512.webp",
  "visual-assets/v10_1/chamber-men/assets/seats_512.webp",
  "visual-assets/v10_1/chamber-men/players/kitmap/ch38.webp",
  "visual-assets/v10_1/chamber-men/players/kitmap/ch42.webp",
  "visual-assets/v10_1/chamber-men/players/uv/uv_Boots.webp",
  "visual-assets/v10_1/chamber-men/players/uv/uv_Shirt.webp",
  "visual-assets/v10_1/chamber-men/players/uv/uv_Shorts.webp",
  "visual-assets/v10_1/chamber-men/players/uv/uv_Socks.webp",
  "visual-assets/v10_1/chamber-men/players/uv/uv_ch38_Body.webp",
  "visual-assets/v10_1/chamber-men/players/uv/uv_ch38_Boots.webp",
  "visual-assets/v10_1/chamber-men/players/uv/uv_ch38_Shirt.webp",
  "visual-assets/v10_1/chamber-men/players/uv/uv_ch38_Shorts.webp",
  "visual-assets/v10_1/chamber-men/players/uv/uv_ch38_Socks.webp",
  "visual-assets/v10_1/chamber-men/players/uv/uv_ch42_Body.webp",
  "visual-assets/v10_1/chamber-men/players/uv/uv_ch42_Boots.webp",
  "visual-assets/v10_1/chamber-men/players/uv/uv_ch42_Shirt.webp",
  "visual-assets/v10_1/chamber-men/players/uv/uv_ch42_Shorts.webp",
  "visual-assets/v10_1/chamber-men/players/uv/uv_ch42_Socks.webp",
  "visual-assets/v10_1/chamber-men/players/uv/uv_remy_Body.webp",
  "visual-assets/v10_1/content/gazette/GZ_LEAD_DRAW.webp",
  "visual-assets/v10_1/content/gazette/GZ_LEAD_FINAL.webp",
  "visual-assets/v10_1/content/gazette/GZ_LEAD_GOLD.webp",
  "visual-assets/v10_1/content/gazette/GZ_LEAD_PRESS.webp",
  "visual-assets/v10_1/content/gazette/GZ_LEAD_SEASON.webp",
  "visual-assets/v10_1/content/gazette/GZ_THINK_DANIEL.webp",
  "visual-assets/v10_1/content/gazette/GZ_THINK_NIK.webp",
  "visual-assets/v10_1/content/gazette/GZ_WIN_DANIEL.webp",
  "visual-assets/v10_1/content/gazette/GZ_WIN_NIK.webp",
  "visual-assets/v10_1/roulette/assets/RR_HAND.webp",
  "visual-assets/v10_1/roulette/assets/RR_ROOM_V2_1080.webp",
  "visual-assets/v10_1/roulette/assets/RR_ROOM_V2_4K.webp",
  "visual-assets/v10_1/special-player/assets/board.jpg",
  "visual-assets/v10_1/special-player/assets/card_black.jpg",
  "visual-assets/v10_1/special-player/assets/card_blue.jpg",
  "visual-assets/v10_1/special-player/assets/card_bronze.jpg",
  "visual-assets/v10_1/special-player/assets/card_gold.jpg",
  "visual-assets/v10_1/special-player/assets/card_silver.jpg",
  "visual-assets/v10_1/special-player/assets/grass.jpg",
  "visual-assets/v10_1/special-player/assets/pack.webp",
  "visual-assets/v10_1/icon-guess/assets/card_frame.webp",
  "visual-assets/v10_1/icon-guess/assets/pack_opening.webp",
  "visual-assets/v10_1/icon-guess/assets/pack_sealed.webp",
  "visual-assets/v10_1/icon-guess/assets/token_full.webp",
  "visual-assets/v10_1/icon-guess/assets/token_spent.webp"
]);
// r89 3D engine (2.2.0): every 3D scene (roulette, Special Player, the Chamber Men goal) loads one vendored three.js r187 build
// (tools/three-vendor; the Chamber Men goal loads it into the app page, js/chamberMenScene3d.js) and
// the roulette lights its metal with one CC0 HDRI. Both are fetched without ?v, so both are shell-cached and unversioned-served,
// and their bytes are pinned: a change ships under a new name (three-r<N>.min.js, ENV_LOUNGE_V<n>.exr), never over these.
check("F9d r89 3D engine files: one pinned three.js build and one pinned CC0 lounge HDRI, both shell-cached for offline play",()=>{
  const pins={"visual-assets/v10_1/roulette/vendor/three-r187.min.js":"360929ee240c045d7ed3363da089a2786ea96933015809cd442f08fc1e203c87",
    "visual-assets/v10_1/roulette/assets/ENV_LOUNGE_V1.exr":"205a84e0108d40fb207e077db9bc68a15f329a8af8ee1f82c28524e967963b81"};
  const sw=fs.readFileSync(path.join(ROOT,"service-worker.js"),"utf8");
  const unversioned=sw.slice(sw.indexOf("const UNVERSIONED_SHELL_ASSET_PATHS"),sw.indexOf("]);",sw.indexOf("const UNVERSIONED_SHELL_ASSET_PATHS")));
  const shell=sw.slice(sw.indexOf("const SHELL_PATHS = Object.freeze(["),sw.indexOf("]);",sw.indexOf("const SHELL_PATHS = Object.freeze([")));
  for(const [file,hash] of Object.entries(pins)){
    assert.equal(sha256(file),hash,`${file} bytes changed: ship it under a new name instead`);
    assert.ok(shell.includes(`"${file}"`),`${file} is precached`);
    assert.ok(unversioned.includes(`"${file}"`),`${file} is served from the shell without ?v`);
  }
  const vendor=fs.readdirSync(path.join(ROOT,"visual-assets/v10_1/roulette/vendor")).filter(f=>/^three-.*\.js$/.test(f));
  assert.deepEqual(vendor,["three-r187.min.js"],"one three.js build ships");
  for(const page of ["visual-assets/v10_1/roulette/index.html","visual-assets/v10_1/special-player/index.html"]){
    const html=fs.readFileSync(path.join(ROOT,page),"utf8");
    assert.ok(/<script src="(?:\.\.\/roulette\/)?vendor\/three-r187\.min\.js"><\/script>/.test(html),`${page} loads the vendored r187 build`);
    assert.ok(html.includes("T.cmsLegacyLights()"),`${page} keeps the lights it was tuned with`);
  }
  assert.ok(fs.readFileSync(path.join(ROOT,"visual-assets/v10_1/roulette/vendor/THREE_LICENSE.txt"),"utf8").includes("MIT License"));
});
check("F9c every shipped Team V image path names one generation (versioned name, pinned bytes)",()=>{
  const found=[];
  const walk=dir=>{for(const entry of fs.readdirSync(path.join(ROOT,dir),{withFileTypes:true})){const rel=dir+"/"+entry.name;if(entry.isDirectory())walk(rel);else if(/\.(?:webp|png|jpe?g|avif|gif|svg)$/i.test(entry.name))found.push(rel);}};
  walk("visual-assets/v10_1");
  assert.deepEqual(found.sort(),Object.keys(V10_IMAGES).sort(),"every shipped Team V image is listed with its hash");
  for(const [file,hash] of Object.entries(V10_IMAGES)){
    if(!V10_UNVERSIONED_FIRST_GENERATION.has(file))assert.match(path.basename(file),/_V\d+(?:_[^.]+)?\./,`${file} carries a _V<n> generation in its name`);
    assert.equal(sha256(file),hash,`${file} bytes changed: ship changed art under a new _V<n> name instead`);
  }
});

check("F10 index.html is unchanged and the startup line is not higher",()=>{
  // Re-pinned 2026-11-02 by the 2.0.0 release PR to the shipped index.html (2.0.0-r87 pins on gameplay/r87 bd67147a, after
  // the Transfer War wording #1190). This check had not run since r78 (#1115).
  // Re-pinned 2026-11-03 by the 2.1.0 release PR: the 2.0.0 file with its 2.1.0-r88 pins and v2.1.0 footer, nothing else.
  // Re-pinned 2026-11-06 at the r89 freeze by the 2.2.0 release PR: gameplay/r89 94438bee's file (2.1.0 plus r89's Sacked
  // ticks and the other r89 feature changes) with its 2.2.0-r89 pins and v2.2.0 footer, nothing else.
  // Re-pinned 2026-11-09 by the 2.3.0 release PR: gameplay/r90 ff70b7e's file with its 2.3.0-r90 pins and v2.3.0 footer, nothing
  // else (r90's own index.html changes were already pinned as a384fe22 by their feature PRs).
  // Re-pinned 2026-11-13 by r91 HO-072 (loading cover): the 2.3.0 file with the layered Reus cover in place of the single
  // picture (four first-paint preloads, the room and Reus pictures with their sharp layers, the logo lettering), nothing else.
  // Re-pinned 2026-11-13 by the r91 hunt fixes (B1, PR #1439): the HO-072 file plus the inline boot-fail guard before js/storage.js
  // (one reload by itself, then the marble error screen with RELOAD), nothing else. The guard names three stylesheets, one of them
  // visual-assets/v10_1/shared/showdown-tokens.css, that it loads only after a failed start; the start-up shell loads none of them.
  // Re-pinned 2026-11-13 by the 2.4.0 release PR: gameplay/r91 47cdb505's file (02e01adb above) with its 2.4.0-r91 pins and v2.4.0
  // footer, nothing else.
  // Re-pinned 2026-11-14 by the 2.5.0 release PR: gameplay/r92's file (the 2.4.0 file, which r92 never changed) with its 2.5.0-r92
  // pins and v2.5.0 footer, nothing else.
  // Re-pinned 2026-11-15 by the 2.5.1 hotfix PR (R93-07, LOCK MY SIGNINGS Rules budget), then by the merge of 2.5.1 into r93:
  // r93's file (HO-079 V4 loading logo) with the 2.5.1-r92 pins and v2.5.1 footer.
  // Re-pinned 2026-11-15 by the 2.6.0 release bump: the same r93 file with its 2.6.0-r93 pins and v2.6.0 footer, nothing else.
  // Re-pinned 2026-11-17 by the 2.7.0 release bump: the 2.6.0 file (r94 never changed it) with its 2.7.0-r94 pins and v2.7.0
  // footer, nothing else.
  assert.equal(sha256("index.html"),"034c60100198490cbe86c80520b99c2689d35f02599a3f50920dbc4374c2c144","index.html is 2.7.0 (HO-072 loading cover, HO-079 V4 logo, B1 boot-fail guard, 2.7.0-r94 pins)");
  const html=read("index.html").replace(/<script>(?:(?!<\/script>)[^])*?w\.cmsBootFail=function[^]*?<\/script>/,"");
  assert.notEqual(html,read("index.html"),"the B1 boot-fail guard is there");
  for(const banned of ["v10Screens","navbar","visual-assets/v10_1","startJoinViewModel"])assert.ok(!html.includes(banned),banned);
  const refs=[...html.matchAll(/(?:src|href)="((?:js|css|data)\/[^"?#]+)(?:\?v=([^"#]+))?/g)].map(m=>m[1]);
  const gzip=refs.reduce((total,ref)=>total+zlib.gzipSync(fs.readFileSync(path.join(ROOT,ref)),{level:9}).length,0);
  assert.ok(gzip<=34000,`startup gzip ${gzip} must stay <= 34000 (r90 W8 +87 on js/menuExperience.js: the hidden Reus cover photo (89 KB) is no longer downloaded on every start, lead brief W8 2026-11-07; 2.2.0 version pins +3: the same-length 2.2.0-r89 strings gzip 3 bytes larger, no code change; r88 STORY route +12 on js/screens.js, lead OK 2026-11-02; 2.4.0 version pins +1 (33,998), no code change; everything else STORY needs stays lazy-loaded; r87 2.0.0 candidate 9a9667fb 33900; was 37495 before #1176 removed the Home strip)`);
  const ssjr=read("js/ssjr.js");
  assert.match(ssjr,/load\("v10-screens","js\/v10Screens\.js",\(\)=>root\.CareerModeV10Screens\)/,"loader starts lazily after start-up");
  assert.match(ssjr,/requestIdleCallback/);
  assert.doesNotMatch(ssjr,/localStorage/);
});

check("F11 Team V files are copied unchanged; no docs, previews or images are copied for the bar",()=>{
  const pinned={
    "visual-assets/v10_1/shared/navbar/navbar.css":"19e3aec81f0de27d2a893c1019587c3157952c9ea8801c19276ce942938c208b",
    "visual-assets/v10_1/shared/navbar/navbar.js":"7fbfebd85f7739e32557b4b903e8139b7ec59d28f51abdb0a615d6dfb3295b1c",
    // Re-copied from the final Team V pin (phone layout); job 13's only file that changed upstream. Gameplay has edited it
    // since r78 (r78 look, r84 release, r87 red-team fits D-04/D-05, e3df0019); re-pinned 2026-11-01 to gameplay/r87 45c01a72.
    "visual-assets/v10_1/career-statistics/career-statistics.css":"5bd0356339bd2e7e29a0d5b873c7de971c5c65d73ab92be996cc759624a5711e"
  };
  for(const [file,hash] of Object.entries(pinned))assert.equal(sha256(file),hash,`${file} equals its pinned copy`);
  assert.deepEqual(fs.readdirSync(path.join(ROOT,"visual-assets/v10_1/shared/navbar")).sort(),["navbar.css","navbar.js"]);
  const src=read("js/v10Screens.js");
  assert.ok(!src.includes("fixtures.json")&&!src.includes("Preview data"),"no fixtures in production");
  assert.ok(!/fetch\(/.test(src),"the loader makes no data requests");
});

check("F12 the screen registry keeps no browser storage of its own (r90: the unused UI preference API is gone)",async()=>{
  const src=read("js/v10Screens.js");
  assert.doesNotMatch(src,/\blocalStorage\b/,"storage.js owns browser storage");
  assert.doesNotMatch(src,/root\.(readStorageValue|writeStorageValue|removeStorageValue)\(/,"no UI preference reads or writes");
  const root=await installed();
  assert.equal("getUiPreference" in root.CareerModeV10Screens,false);
});

check("F13 job 13's Career Statistics and Trophy Room run on the registry and show the same frames",async()=>{
  const binder=read("js/careerScreensV10.js");
  assert.match(binder,/CareerModeV10Screens/);
  assert.match(binder,/\.register\(screen,/);
  assert.doesNotMatch(binder,/MutationObserver/,"style switching moved to the registry");
  const root=await installed();
  root.run("js/careerScreenSeam.js");
  // Like the app's renderers, the old renderers rewrite the screen's host.
  const legacy=(id,value)=>function(){const host=root.document.getElementById(id);if(host)host.innerHTML="<p>legacy</p>";return value;};
  root.renderCareerStatistics=legacy("careerStatistics","cs");root.renderTrophyRoom=legacy("trophyRoom","tr");
  root.CareerModeOnlinePlayerIdentity={getState:()=>({registered:true,managerId:"daniel"})};
  await root.loadRuntimeScript("career-screens-v10","js/careerScreensV10.js",()=>Boolean(root.CareerModeCareerScreensV10));
  const CS=root.CareerModeCareerScreensV10,V=root.CareerModeV10Screens;
  const Node10=require(path.join(ROOT,"js/careerScreensV10.js"));
  const model=JSON.parse(read("tests/fixtures/data-contract-v1/finished-three-seasons.json")).career;
  root.showScreen("careerStatistics");await flush();
  assert.equal(await CS.mount("careerStatistics",()=>model),true);
  await flush();
  assert.deepEqual(root.boots,[["careerStatistics",JSON.stringify(Node10.toV10Frame(model,"careerStatistics"))]]);
  assert.equal(root.document.getElementById("careerStatistics").dataset.careerV10,"1");
  assert.equal(V.isMounted("careerStatistics"),true);
  assert.equal(await CS.mount("careerStatistics",()=>model),true);
  assert.equal(root.boots.length,1,"same model and untouched host: no second draw");
  assert.equal(root.renderCareerStatistics(),"cs","the old renderer's result is kept");
  root.showScreen("careerStatistics");await flush();
  assert.equal(root.boots.length,2,"the old renderer rewrote the host: V10 draws once again, even with the same model");
  assert.equal(root.boots[1][1],root.boots[0][1],"same frame");
  assert.notEqual(root.document.getElementById("careerStatistics").innerHTML,"<p>legacy</p>","no legacy markup left in a V10 host");
  assert.equal(V.isMounted("careerStatistics"),true);
  assert.equal(sheetOff(linkFor(root,V10.BASE+"career-statistics/career-statistics.css")),false);
  root.showScreen("trophyRoom");await flush();
  assert.equal(V.isMounted("careerStatistics"),false);
  assert.equal(sheetOff(linkFor(root,V10.BASE+"career-statistics/career-statistics.css")),true);
  assert.equal(await CS.mount("trophyRoom",()=>model),true);
  assert.deepEqual(root.boots.at(-1),["trophyRoom",JSON.stringify(Node10.toV10Frame(model,"trophyRoom"))]);
  assert.equal(root.document.getElementById("careerStatistics"),null,"one Team V stage at a time, as in job 13");
  assert.equal(typeof root.renderTrophyRoom,"function");assert.equal(root.renderTrophyRoom.careerScreensV10,true);
  root.showScreen("mainMenu");await flush();
  assert.equal(V.isMounted("trophyRoom"),false);
  for(const file of [...KIT_STYLES.slice(1),V10.BASE+"trophy-room/trophy-room.css"])assert.equal(sheetOff(linkFor(root,file)),true,file);
  root.showScreen("trophyRoom");await flush();
  assert.equal(root.boots.length,4,"returning to the screen draws it again");
  const loads=root.scripts.filter(s=>/career-v10-trophy-room|career-v10-career-statistics/.test(s));
  assert.equal(loads.length,2,"each screen's JS loaded once");
  assert.deepEqual(root.errors,[]);
  const run=spawnSync(process.execPath,[path.join(ROOT,"tests/contracts/career-screens-v10-contracts.cjs")],{cwd:ROOT,encoding:"utf8"});
  assert.equal(run.status,0,run.stdout+run.stderr);
  assert.match(run.stdout,/PASS career screens V10 contracts/);
});

check("F15 a screen switched without showScreen (Shared Setup's ssjpForceScreen) still updates the bar and mounts",async()=>{
  const root=await installed();
  const V=root.CareerModeV10Screens,doc=root.document,main=doc.querySelector("main");
  const mounts=[];V.register("leagueWheelScreen",{frame:()=>({id:1}),mount:(f,host)=>mounts.push(host.id)});
  const watcher=root.observers.find(o=>o.el===main);
  assert.ok(watcher,"the loader watches the screen sections' class changes");
  const fire=target=>watcher.cb([{type:"attributes",attributeName:"class",target}]);
  fire(doc.getElementById("mainMenu"));await flush();
  assert.equal(mounts.length,0,"no screen change, nothing happens");
  doc.getElementById("mainMenu").classList.add("hidden");
  const wheel=doc.getElementById("leagueWheelScreen");wheel.classList.remove("hidden");
  fire(doc.createElement("div"));await flush();
  assert.equal(mounts.length,0,"class changes outside the .screen sections are ignored");
  fire(wheel);await flush();
  assert.deepEqual(mounts,["leagueWheelScreen"],"mounted after a direct hidden-class switch");
  fire(wheel);await flush();
  assert.equal(mounts.length,1,"repeated class changes on the same screen do not remount");
  assert.deepEqual(root.errors,[]);
});

check("F14 guards: no Rules, scoring, provider or index change; only lazy files load the loader",()=>{
  const src=read("js/v10Screens.js");
  for(const banned of ["firestore","firebase","Firestore","collection(","RUNTIME_REVISION","scoring.js","Scoring"])assert.ok(!src.includes(banned),banned);
  assert.ok(!/console\.(error)/.test(src));
  for(const file of ["js/app.js","js/screens.js","js/storage.js","js/showdown.js","js/scoring.js","js/menuExperience.js","js/optionalModules.js"])assert.ok(!read(file).includes("v10Screens"),`${file} untouched`);
});

// r87 test gaps: the fake page's timers are unref'd, so a check waiting on one let node exit 0 in the middle of F2 and
// F2-F14 never ran (found 2026-10-17, contract-test-gap-r78). A keep-alive holds the process open, every check gets a
// time limit so a hang is a failure, and the run must report every check before it can pass.
(async()=>{
  const keepAlive=setInterval(()=>{},1000);
  let n=0;
  try{
    for(const [name,fn] of checks){
      n+=1;let limit;
      await Promise.race([Promise.resolve().then(fn),new Promise((_,reject)=>{limit=setTimeout(()=>reject(new Error(`${name}: no result in 20 s`)),20000);})]).finally(()=>clearTimeout(limit));
      console.log(`ok ${n} ${name}`);
    }
  }finally{clearInterval(keepAlive);}
  assert.equal(n,checks.length,'every check ran');
  console.log(`PASS v10 foundation contracts: ${n} checks.`);
})().catch(error=>{console.error(error);process.exit(1);});

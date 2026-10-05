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
  for(const name of ["install","ensureKit","register","show","hide","invalidate","isMounted","navFor","navigate","setNavRoute","getUiPreference","setUiPreference"])assert.equal(typeof V10[name],"function",name);
  assert.equal(V10.BASE,"visual-assets/v10_1/");
  assert.equal(V10.EVENT,EVENT);
  assert.equal(V10.UI_KEY,"cms.v10.ui");
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

check("F3 Team V styles are on only while a mounted Team V screen is visible",async()=>{
  const root=await installed();
  const V=root.CareerModeV10Screens;
  V.register("dashboard",{css:["test/dash.css"],frame:()=>({}),mount(){},unmount(){}});
  const always=[V10.BASE+"shared/showdown-tokens.css",V10.BASE+V10.NAV.style,V10.NAV.shellStyle];
  for(const file of always)assert.equal(linkFor(root,file).disabled,false,`${file} on with the bar`);
  root.showScreen("dashboard");await flush();
  for(const file of [...KIT_STYLES,V10.BASE+"test/dash.css"])assert.equal(linkFor(root,file).disabled,false,`${file} on while mounted`);
  root.showScreen("mainMenu");await flush();
  for(const file of [...KIT_STYLES.filter(f=>!always.includes(f)),V10.BASE+"test/dash.css"])assert.equal(linkFor(root,file).disabled,true,`${file} off after leaving`);
  for(const file of always)assert.equal(linkFor(root,file).disabled,false,`${file} stays on`);
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
  for(const file of kit){const link=linkFor(root,file);assert.ok(link.sheet,`${file} loaded`);assert.equal(link.disabled,true,`${file} off once loaded: no Team V screen shows`);}
  while(doc.pendingLinks.length){doc.settleLinks();await flush();}
  root.showScreen("dashboard");await flush();
  while(doc.pendingLinks.length){doc.settleLinks();await flush();}
  assert.equal(V.isMounted("dashboard"),true);
  for(const file of [...kit,V10.BASE+"test/dash.css"]){const link=linkFor(root,file);assert.equal(link.dropped,false,file);assert.ok(link.sheet,`${file} sheet loaded`);assert.equal(link.disabled,false,`${file} on while shown`);}
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

check("F8 the bar is hidden on Loading and appears only after start-up",async()=>{
  const root=await installed({loading:true});
  assert.equal(root.document.documentElement.dataset.nav,"none");
  assert.equal(topBar(root),null,"no bar while Loading shows");
  assert.equal(root.scripts.some(s=>s.includes("navbar.js")),false,"bar code not loaded during Loading");
  root.endLoading();await flush();
  assert.ok(topBar(root),"bar mounts once Loading is gone");
  assert.equal(root.document.documentElement.dataset.nav,"hub");
  const css=read(V10.NAV.shellStyle);
  assert.match(css,/html\[data-nav="hub"\] #app/,"phone hub screens keep room for the bottom bar");
  assert.match(css,/min-width:\s*901px/,"desktop keeps room for the top bar");
  assert.doesNotMatch(css,/display:\s*none/,"the shell CSS never hides app elements");
});

check("F9 images use a runtime cache keyed by RUNTIME_REVISION; the precache keeps only kit, fonts, CSS and JS",()=>{
  const sw=read("service-worker.js"),html=read("index.html");
  const revision=/const RUNTIME_REVISION = "([^"]+)";/.exec(sw)[1];
  assert.equal(revision,"1.9.1-r53","RUNTIME_REVISION unchanged (recovery-v1 r53)");
  assert.equal(/const PREVIOUS_RUNTIME_REVISION = "([^"]+)";/.exec(sw)[1],"1.9.1-r52");
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
  const fill=revision=>{const m=new Map();for(const p of diag.shellPaths){const u=new URL(p,SCOPE);u.searchParams.set("v",revision);m.set(u.href,new Response(p,{status:200}));}store.set("career-mode-showdown-shell-"+revision,m);return m;};
  const dispatch=async(type,event)=>{const waits=[];listeners[type]({waitUntil:p=>waits.push(p),...event});await Promise.all(waits);};
  const image=async path=>{let reply,waits=[];listeners.fetch({request:new Request(SCOPE+path),respondWith:p=>{reply=p;},waitUntil:p=>waits.push(p)});assert.ok(reply,"the worker answers "+path);const r=await reply;await Promise.all(waits);return r.type==="error"?null:{status:r.status,body:await r.text()};};
  return{SCOPE,store,net,diag,fill,dispatch,image,setOnline:v=>{online=v;}};
}

check("F9b a rollback keeps its own Team V images (offline too); other old image caches are cleared",async()=>{
  const w=swWorld(),cur=w.diag.revision,prev=w.diag.previousRevision,IMG="career-mode-showdown-v10-images-";
  assert.equal(cur,"1.9.1-r53");assert.equal(prev,"1.9.1-r52");
  w.fill(cur);const prevShell=w.fill(prev);
  const art="visual-assets/v10_1/trophy-room/assets/ENV_TR_PHONE_V1.webp",only="visual-assets/v10_1/career-statistics/assets/ENV_CS_PLATE_V1_1X.webp";
  // An older revision precached the art in its shell; the retained shell still has it.
  const legacyKey=new URL(only,w.SCOPE);legacyKey.searchParams.set("v",prev);prevShell.set(legacyKey.href,new Response("prev-shell-art",{status:200}));
  const put=(revision,p,body)=>{if(!w.store.has(IMG+revision))w.store.set(IMG+revision,new Map());w.store.get(IMG+revision).set(w.SCOPE+p,new Response(body,{status:200}));};
  put(cur,art,"r53-art");put(prev,art,"r52-art");put("1.9.1-r50",art,"r50-art");
  await w.dispatch("activate",{});
  const names=[...w.store.keys()];
  assert.ok(names.includes(IMG+cur),"current image cache kept");
  assert.ok(names.includes(IMG+prev),"recovery image cache kept with its retained shell");
  assert.ok(!names.includes(IMG+"1.9.1-r50"),"other old image caches cleared");
  w.net.set("/app/"+art,"network-art");w.net.set("/app/"+only,"network-art");
  assert.deepEqual(await w.image(art),{status:200,body:"r53-art"},"current revision: its own image cache first");
  let reply;await w.dispatch("message",{data:{type:"CMS_ROLLBACK_TO_PREVIOUS"},ports:[{postMessage:m=>{reply=m;}}]});
  assert.equal(reply&&reply.ok,true,"rollback accepted");assert.equal(reply.revision,prev);
  w.setOnline(false);
  assert.deepEqual(await w.image(art),{status:200,body:"r52-art"},"offline rollback: the retained revision's art, not the newer one");
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
    "visual-assets/v10_1/season-results/assets/TITLE_SR_PHONE_V1.webp":"90dc95cb4abca3a06c2f08f0468befb2dfb60b49bd98fec8a92aac8bd0620bc4",
    "visual-assets/v10_1/season-results/assets/TITLE_SR_V1.webp":"2f81e4b2f188c98e60d8dbc3c8ba1ff90e6d8a8129b766fe655efc877dcabcfa",
    "visual-assets/v10_1/shared/wordmarks/TITLE_FINAL_WINNER_V1.webp":"c200cad34fccb43d27492037e8a56fb754f30dfee216ac605ae7e5771ba77b71",
    "visual-assets/v10_1/shared/wordmarks/TITLE_STANDINGS_V1.webp":"adbf6ee3214a535b2d96cd12bd40110178ecae0e01cf53cd5eb17dde646e3807",

    "visual-assets/v10_1/career-statistics/assets/ENV_CS_PHONE_V1.webp":"6d1610bba1d480681ef5191ac78b9bf8f6f579e3931f26e444985d65e8d582fa",
    "visual-assets/v10_1/career-statistics/assets/ENV_CS_PLATE_V1_1X.webp":"77759cb0ff818bb674ae45f5431f6e5976b3724de98923f47521b0f59fcec352",
    "visual-assets/v10_1/career-statistics/assets/ENV_CS_PLATE_V1_2X.webp":"740e753cd4a6360a42658f5a1cd7c70ba848c05ed580a906f0333ecbd29149b9",
    "visual-assets/v10_1/career-statistics/assets/OVL_CS_DANIEL_CROSSED_ARMS_V1_1X.webp":"a9bf051efc756f37fff4b2836f3f67a2f205e12054779e633f8c0cba4708fbb1",
    "visual-assets/v10_1/career-statistics/assets/OVL_CS_DANIEL_CROSSED_ARMS_V1_2X.webp":"0f4802b0aa50f6f932d2ed18a49b90decb567dfb7d4f9abd73c52e23c52a992d",
    "visual-assets/v10_1/career-statistics/assets/OVL_CS_DANIEL_CROSSED_ARMS_V1_RIM_1X.webp":"e51ce1190a73458dfab2c51e8663834be8e1ff831e8e915c9e3061fea732775a",
    "visual-assets/v10_1/career-statistics/assets/OVL_CS_DANIEL_CROSSED_ARMS_V1_RIM_2X.webp":"a64f2bfebadef2966c59b1f598d0d5abe955888aa5b22c6c17116ee04c936148",
    "visual-assets/v10_1/career-statistics/assets/OVL_CS_DANIEL_PHONE_V1.webp":"4c6a1a06ea9933d7c695b30dcf1ef1a12be9fa7461356d759f2a9521d793563f",
    "visual-assets/v10_1/career-statistics/assets/OVL_CS_NIK_PHONE_V1.webp":"570e96e38af9be0d4be10f647a3f23cad81fd26bcae7e091f3e61469fed7afeb",
    "visual-assets/v10_1/career-statistics/assets/TITLE_CS_V1.webp":"7dbc3041a3b79684b5d28babfce2bb3aaf51138be820b4f7a4d4fcd7a68b4a04",
    "visual-assets/v10_1/shared/trophies/TRO_CONTINENTAL_V1_512.webp":"15f47694e512f5f1555f3f1b919b0ab0203edd8544cd65b249c98277a28c2175",
    "visual-assets/v10_1/shared/trophies/TRO_DOMESTIC_CUP_V1_512.webp":"78280e1c2ef82e1945d029f5bccb537c28670fbb92ae19a662fd3611af377d08",
    "visual-assets/v10_1/shared/trophies/TRO_LEAGUE_TITLE_V1_512.webp":"39c65012fa627c67371fa5676a6d696a81dbb54b80621730d83b2b15ae5b6796",
    "visual-assets/v10_1/shared/trophies/TRO_SHOWDOWN_CHAMPION_V1_512.webp":"c3ba71260b758a1a437d32a73fe44d367f05d177a0687468cf28fdb25172bad5",
    "visual-assets/v10_1/trophy-room/assets/ENV_TR_PHONE_V1.webp":"40eaa9d2ef35dacca131285f4b3a83dcf5556927ff82e6e92dda732daa780fda",
    "visual-assets/v10_1/trophy-room/assets/ENV_TR_PLATE_V1_1X.webp":"abfbcb1884700ee0cddbfb0cbe4384dd31164745ab388d30f8f6128e67260b70",
    "visual-assets/v10_1/trophy-room/assets/ENV_TR_PLATE_V1_2X.webp":"a2c6badc9148094d880ab671e4b35298fe7d5cc65ecc9875f0228b151455f8cc",
    "visual-assets/v10_1/trophy-room/assets/OVL_TR_DANIEL_PHONE_V1.webp":"ba883f14116d1257ba8876fd18b92847b7955536e31c6e3154b743089036d7d6",
    "visual-assets/v10_1/trophy-room/assets/OVL_TR_NIK_PHONE_V1.webp":"850352f3eb1db2f79c0ba8e5df447cde9b5a3371e7fa29e14dee1e3e989e3959",
    "visual-assets/v10_1/trophy-room/assets/TITLE_TR_V1.webp":"735bc4f176181b418becb54d699c2f19e80ac2e257b541cd5a1f4ebb39637b0c",
    // job 25: Team V Home (5e05a1f)
    "visual-assets/v10_1/home/assets/ENV_HOME_PHONE_V1.webp":"55b4c840aad140b95db47bf9a733c1c21c1aaceb25b539a367c5f6ffcb37453e",
    "visual-assets/v10_1/home/assets/ENV_HOME_PLATE_V1_1X.webp":"3c35391805507bf8910f36f98147cd8383e4944eeb999021661d6d7030d30c39",
    "visual-assets/v10_1/home/assets/ENV_HOME_PLATE_V1_2X.webp":"aed61ed9d6e10cbaead7251539e188101bc1371d83639b2ab6953dae875274f9",
    "visual-assets/v10_1/home/assets/LOGO_CM17_WORDMARK_V1.webp":"d72524228798c02bd9c22750da3743099768a80b3ef904a21d8243a1f6dccda6",
    "visual-assets/v10_1/home/assets/OVL_HOME_DANIEL_PHONE_V1.webp":"fdff22d11059c6c6f4c5f38780cd183b26ae737fecc1f913e74ffe754d53e169",
    "visual-assets/v10_1/home/assets/OVL_HOME_NIK_PHONE_V1.webp":"abeb9551dc5cd8ad11d65b2993dfe5155725397ba42b7ba17020634938c62800",
    "visual-assets/v10_1/shared/art/home-tiles/TILE_HISTORY_V1.webp":"3ad7b30b692ad37f4f366357a7515c7765ec7a11302bcce186b468a7772a68c5",
    "visual-assets/v10_1/shared/art/home-tiles/TILE_RULEBOOK_V1.webp":"e185a67497b0ce0340043ee5bc0e8efd35e8143679b806ad0a48d197885d7cf7",
    "visual-assets/v10_1/shared/art/home-tiles/TILE_SETTINGS_V1.webp":"92364b627bfb2f42dc62610e69c548eef6f51b3a465fc036d962e6cb6f4aa3ff",
    "visual-assets/v10_1/shared/art/home-tiles/TILE_STATISTICS_V1.webp":"e331ed59ebd2d9e8512299a31b4f47b13cc685fd1eb037259a97eca9ec8abac0",
    "visual-assets/v10_1/shared/art/home-tiles/TILE_TACTICS_V1.webp":"148683d7a6ff038176c0f8a9cf599a36645a08f4361e59be25ded2095f5ae153",
    // job 26 (Start/Join, League wheel, Club packs): Team V 5e05a1f, unchanged
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
    "visual-assets/v10_1/shared/plates/ENV_SYS_PHONE_V1.webp":"734d1d147c80e48f3b3a4744f35ea255c47cd23adb5e451c1e2e98fff6b54882",
    "visual-assets/v10_1/shared/plates/ENV_SYS_PLATE_V1_1X.webp":"0342875dca95999886d5bd0b81daf1aca4a86d0b95bb738e2f6cc4548365a2b8",
    "visual-assets/v10_1/shared/plates/ENV_SYS_PLATE_V1_2X.webp":"005420e4c40d42fbe34d7a66ff7e5428cd3b58b15587ad9ca7ef438b2105b9fd",
    "visual-assets/v10_1/shared/wordmarks/TITLE_RULE_BOOK_V1.webp":"5624230fbfa10a80a144a730970de12a7510c5f9e71c53f2e59e315eed57daad",
    "visual-assets/v10_1/shared/wordmarks/TITLE_SETTINGS_V1.webp":"c4ad45bc0e39c2c38f3257a47e41e1bff657f672a4345a45cf1fb7ed9481dd44"
};
check("F9c every shipped Team V image path names one generation (versioned name, pinned bytes)",()=>{
  const found=[];
  const walk=dir=>{for(const entry of fs.readdirSync(path.join(ROOT,dir),{withFileTypes:true})){const rel=dir+"/"+entry.name;if(entry.isDirectory())walk(rel);else if(/\.(?:webp|png|jpe?g|avif|gif|svg)$/i.test(entry.name))found.push(rel);}};
  walk("visual-assets/v10_1");
  assert.deepEqual(found.sort(),Object.keys(V10_IMAGES).sort(),"every shipped Team V image is listed with its hash");
  for(const [file,hash] of Object.entries(V10_IMAGES)){
    assert.match(path.basename(file),/_V\d+(?:_[^.]+)?\./,`${file} carries a _V<n> generation in its name`);
    assert.equal(sha256(file),hash,`${file} bytes changed: ship changed art under a new _V<n> name instead`);
  }
});

check("F10 index.html is unchanged and the startup line is not higher",()=>{
  assert.equal(sha256("index.html"),"234683bf0deb273fc085af78d9c942e1c6a052e8ffb5dc6e2edcae9de55dbc6a","index.html byte-identical to gameplay/recovery-v1 (r53)");
  const html=read("index.html");
  for(const banned of ["v10Screens","navbar","visual-assets/v10_1","startJoinViewModel"])assert.ok(!html.includes(banned),banned);
  const refs=[...html.matchAll(/(?:src|href)="((?:js|css|data)\/[^"?#]+)(?:\?v=([^"#]+))?/g)].map(m=>m[1]);
  const gzip=refs.reduce((total,ref)=>total+zlib.gzipSync(fs.readFileSync(path.join(ROOT,ref)),{level:9}).length,0);
  assert.ok(gzip<=37495,`startup gzip ${gzip} must stay <= 37495`);
  const ssjr=read("js/ssjr.js");
  assert.match(ssjr,/load\("v10-screens","js\/v10Screens\.js",\(\)=>root\.CareerModeV10Screens\)/,"loader starts lazily after start-up");
  assert.match(ssjr,/requestIdleCallback/);
  assert.doesNotMatch(ssjr,/localStorage/);
});

check("F11 Team V files are copied unchanged; no docs, previews or images are copied for the bar",()=>{
  const pinned={
    "visual-assets/v10_1/shared/navbar/navbar.css":"19e3aec81f0de27d2a893c1019587c3157952c9ea8801c19276ce942938c208b",
    "visual-assets/v10_1/shared/navbar/navbar.js":"7fbfebd85f7739e32557b4b903e8139b7ec59d28f51abdb0a615d6dfb3295b1c",
    // Re-copied from the final Team V pin (phone layout); job 13's only file that changed upstream.
    "visual-assets/v10_1/career-statistics/career-statistics.css":"20c472e0da172fc65167c598b890f9e53a057c08276e6e5efb7763161d558323"
  };
  for(const [file,hash] of Object.entries(pinned))assert.equal(sha256(file),hash,`${file} equals Team V 5e05a1f`);
  assert.deepEqual(fs.readdirSync(path.join(ROOT,"visual-assets/v10_1/shared/navbar")).sort(),["navbar.css","navbar.js"]);
  const src=read("js/v10Screens.js");
  assert.ok(!src.includes("fixtures.json")&&!src.includes("Preview data"),"no fixtures in production");
  assert.ok(!/fetch\(/.test(src),"the loader makes no data requests");
});

check("F12 UI preferences use the one key cms.v10.ui, through storage.js, and nothing else",async()=>{
  const src=read("js/v10Screens.js");
  assert.doesNotMatch(src,/\blocalStorage\b/,"storage.js owns browser storage");
  const uses=[...src.matchAll(/root\.(readStorageValue|writeStorageValue|removeStorageValue)\(([^,)]+)/g)].map(m=>m[2].trim());
  assert.ok(uses.length>=2,"reads and writes the UI key");
  assert.ok(uses.every(key=>key==="UI_KEY"),uses.join());
  assert.match(read("js/storage.js"),/function readStorageValue\(key\)[\s\S]*function writeStorageValue\(key,value\)/);
  const root=await installed();
  const V=root.CareerModeV10Screens;
  assert.equal(V.getUiPreference("muted"),null);
  assert.equal(V.setUiPreference("muted",true),true);
  assert.equal(V.getUiPreference("muted"),true);
  assert.deepEqual(root.calls.filter(c=>c[0]==="writeStorageValue").map(c=>c[1]),["cms.v10.ui"],"one key, written only when asked");
  root.writeStorageValue=()=>false;
  assert.equal(V.setUiPreference("muted",false),false,"a failed write reports false");
  root.readStorageValue=()=>"{not json";
  assert.equal(V.getUiPreference("muted"),null,"a broken value reads as unset");
  assert.equal(V.setUiPreference("",1),false);
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
  assert.equal(linkFor(root,V10.BASE+"career-statistics/career-statistics.css").disabled,false);
  root.showScreen("trophyRoom");await flush();
  assert.equal(V.isMounted("careerStatistics"),false);
  assert.equal(linkFor(root,V10.BASE+"career-statistics/career-statistics.css").disabled,true);
  assert.equal(await CS.mount("trophyRoom",()=>model),true);
  assert.deepEqual(root.boots.at(-1),["trophyRoom",JSON.stringify(Node10.toV10Frame(model,"trophyRoom"))]);
  assert.equal(root.document.getElementById("careerStatistics"),null,"one Team V stage at a time, as in job 13");
  assert.equal(typeof root.renderTrophyRoom,"function");assert.equal(root.renderTrophyRoom.careerScreensV10,true);
  root.showScreen("mainMenu");await flush();
  assert.equal(V.isMounted("trophyRoom"),false);
  for(const file of [...KIT_STYLES.slice(1),V10.BASE+"trophy-room/trophy-room.css"])assert.equal(linkFor(root,file).disabled,true,file);
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

(async()=>{
  let n=0;
  for(const [name,fn] of checks){n+=1;await fn();console.log(`ok ${n} ${name}`);}
  console.log(`PASS v10 foundation contracts: ${n} checks.`);
})().catch(error=>{console.error(error);process.exit(1);});

#!/usr/bin/env node
"use strict";
// Season Results and Final Winner (#seasonEntry) must never show the old design on open (JOB-1651 findings).
// seasonEntry is drawn by its own module (js/seasonFinalV10.js, auto:false), which mounts Team V's look on its next tick.
// Before this fix the loader did not expect() it, so the frame the app showed it on had no html[data-v10-screen], the old
// light page, the old white header and footer, and pictures not yet decoded. With hold:true the loader holds the screen
// (data-v10-pending, html[data-v10-screen], Team V sheets live) in the same task as the app's showScreen, before any paint.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../.."),read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const SOURCE=read("js/v10Screens.js");
const flush=async()=>{for(let i=0;i<30;i++)await new Promise(r=>setImmediate(r));};

function makeRoot(options={}){
  const hosts=new Map(),listeners=new Map();
  const host=id=>{if(!hosts.has(id)){const classes=new Set(["hidden"]);hosts.set(id,{id,dataset:{},isConnected:true,ownerDocument:null,querySelectorAll:()=>[],classList:{contains:c=>classes.has(c),add:c=>classes.add(c),remove:c=>classes.delete(c)}});}return hosts.get(id);};
  const link=()=>{const attrs=new Map(),on=new Map();return {tagName:"LINK",sheet:null,setAttribute(k,v){attrs.set(k,String(v));},getAttribute(k){return attrs.has(k)?attrs.get(k):null;},addEventListener(t,fn){on.set(t,fn);},fire(t){this.sheet={disabled:false};on.get(t)?.();}};};
  const doc={
    head:{children:[],appendChild(node){this.children.push(node);return node;}},documentElement:{dataset:{}},
    createElement:()=>link(),getElementById:host,querySelector:()=>null,querySelectorAll:()=>[],
    addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},removeEventListener(){},
    dispatchEvent(event){for(const fn of [...(listeners.get(event.type)||[])])fn(event);return true;}
  };
  class CustomEvent{constructor(type,init){this.type=type;this.detail=init&&init.detail;}}
  // realTimers: the loader's own timings (1500 ms decode wait, 8000 ms picture hold), unref'd so a pending hold never keeps Node alive.
  const later=options.realTimers?(fn,ms)=>{const t=setTimeout(fn,ms);if(t&&t.unref)t.unref();return t;}:(fn,ms)=>setTimeout(fn,Math.min(ms,5));
  const root={document:doc,console:{warn(){},error(){},log(){}},Promise,CustomEvent,setTimeout:later,clearTimeout,matchMedia:()=>({matches:true}),
    MutationObserver:options.observers?class{constructor(fn){this.fn=fn;options.observers.push(this);}observe(target,init){this.target=target;this.init=init;}disconnect(){}}:undefined,
    requestAnimationFrame:fn=>setTimeout(fn,0),loadRuntimeScript:async()=>true,reportApplicationError(){},active:"mainMenu",getActiveScreenName:()=>root.active};
  root.window=root;
  // The app's own showScreen: switches the visible section synchronously and reports success (js/screens.js contract).
  root.showScreen=id=>{for(const h of hosts.values())h.classList.add("hidden");host(id).classList.remove("hidden");root.active=id;return true;};
  host("loadingScreen");
  vm.createContext(root);vm.runInContext(SOURCE,root,{filename:"js/v10Screens.js"});
  const V=root.CareerModeV10Screens;V.install();
  root.mounts=0;
  // Every stylesheet the loader added finishes loading.
  root.deliver=()=>{for(const node of doc.head.children)if(node.sheet===null)node.fire("load");};
  return {root,V,doc,host,html:doc.documentElement};
}
const checks=[];const check=(name,fn)=>checks.push([name,fn]);

check("SE-1 a held module-shown screen has html[data-v10-screen] and its pending hold in the same task the app shows it",async()=>{
  const {root,V,host,html}=makeRoot();
  V.register("seasonEntry",{auto:false,hold:true,css:["final-winner/final-winner.css"],frame:()=>({}),mount(){root.mounts++;},unmount(){}});
  root.showScreen("seasonEntry");
  // No await: this is the state the first frame paints with.
  assert.equal(html.dataset.v10Screen,"seasonEntry","html[data-v10-screen] names seasonEntry before any paint");
  assert.equal(host("seasonEntry").dataset.v10Pending,"1","seasonEntry content is held before any paint");
  assert.equal(root.mounts,0,"the loader itself does not draw an auto:false screen");
  // The module draws it on its own tick; the hold then ends with one reveal.
  await V.show("seasonEntry");await flush();
  assert.equal(root.mounts,1);
  assert.equal(host("seasonEntry").dataset.v10Pending,undefined,"hold released after the module mounted");
  assert.equal(html.dataset.v10Screen,"seasonEntry");
  // Leaving clears the attribute again.
  root.showScreen("plainScreen");
  assert.equal(html.dataset.v10Screen,undefined,"a non-Team-V screen has no html[data-v10-screen]");
});

check("SE-2 the hold never strands the screen: a module that never shows it is released by the style timeout",async()=>{
  const {root,V,host,html}=makeRoot();
  V.register("seasonEntry",{auto:false,hold:true,frame:()=>({}),mount(){},unmount(){}});
  root.showScreen("seasonEntry");
  assert.equal(host("seasonEntry").dataset.v10Pending,"1");
  await new Promise(r=>setTimeout(r,30));await flush();
  assert.equal(host("seasonEntry").dataset.v10Pending,undefined,"released without a mount");
  assert.equal(html.dataset.v10Screen,undefined,"nothing Team V is live once released unmounted");
});

check("SE-3 auto:false without hold keeps its current behaviour (no hold from the loader)",async()=>{
  const {root,V,host,html}=makeRoot();
  V.register("standings",{auto:false,frame:()=>({}),mount(){},unmount(){}});
  root.showScreen("standings");
  assert.equal(host("standings").dataset.v10Pending,undefined);
  assert.equal(html.dataset.v10Screen,undefined);
});

check("SE-4 Season Results / Final Winner registers seasonEntry with the hold",()=>{
  const src=read("js/seasonFinalV10.js");
  assert.match(src,/register\("seasonEntry",\{auto:false,hold:true,/,"js/seasonFinalV10.js registers seasonEntry with hold:true");
});

// Team V's phone hero (js/v10Setup.js v26Art): <picture><source media srcset><img></picture>, no src on the <img>, and no
// currentSrc until the browser has picked the source and loaded it.
function heroPicture(){
  const listeners=new Map();
  const source={getAttribute:k=>k==="media"?"(max-width: 900px)":k==="srcset"?"visual-assets/v10_1/start-join/assets/OVL_SJ_DANIEL_PHONE_V1.webp":null};
  const picture={tagName:"PICTURE",querySelectorAll:selector=>selector==="source[srcset]"?[source]:[]};
  const img={tagName:"IMG",dataset:{},complete:false,naturalWidth:0,currentSrc:"",src:"",parentNode:picture,decodes:0,
    getAttribute:()=>null,addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},
    decode(){this.decodes++;return this.complete&&this.naturalWidth>0?Promise.resolve():Promise.reject(new Error("EncodingError"));},
    load(){this.complete=true;this.naturalWidth=360;this.currentSrc=source.getAttribute("srcset");for(const fn of listeners.get("load")||[])fn({type:"load"});}};
  return img;
}
async function showSetupWith(img,options){
  const ctx=makeRoot(options),{root,V,host}=ctx;
  host("createShowdown").querySelectorAll=selector=>selector==="img"?[img]:[];
  V.register("createShowdown",{frame:()=>({}),mount(){root.mounts++;},unmount(){}});
  root.showScreen("createShowdown");
  for(let i=0;i<4;i++){root.deliver();await flush();}
  // The loader waits one frame (a real timer here) before it looks at the pictures; let that frame run so a check that loads
  // the picture afterwards always finds the loader waiting on it (on a fast runner the flush alone could finish first).
  await new Promise(r=>setTimeout(r,50));await flush();
  return ctx;
}

check("SE-5 Standings (nav bar STANDINGS) registers with the same hold",()=>{
  assert.match(read("js/seasonFinalV10.js"),/register\("standings",\{auto:false,hold:true,/,"js/seasonFinalV10.js registers standings with hold:true");
});

check("SE-6 a phone hero whose <picture> source is still loading (no src, no currentSrc yet) holds the screen until it is decoded",async()=>{
  const img=heroPicture();
  const {root,host}=await showSetupWith(img,{realTimers:true});
  assert.equal(root.mounts,1);
  assert.equal(host("createShowdown").dataset.v10Pending,"1","still held while the hero has not loaded");
  img.load();await flush();
  assert.equal(host("createShowdown").dataset.v10Pending,undefined,"revealed once the hero is decoded");
  assert.ok(img.decodes>=1,"decoded before the reveal");
  assert.equal(img.dataset.v10Decoding,undefined,"no hold left on a ready picture");
});

check("SE-7 a hero still not ready when the screen's decode wait runs out stays hidden on its own until it is decoded",async()=>{
  const img=heroPicture();
  const {host}=await showSetupWith(img,{realTimers:true});
  await new Promise(r=>setTimeout(r,1700));await flush();
  assert.equal(host("createShowdown").dataset.v10Pending,undefined,"the screen is never held past the decode wait");
  assert.equal(img.dataset.v10Decoding,"1","the late picture is held at opacity 0, not painted half-loaded");
  img.load();await flush();
  assert.equal(img.dataset.v10Decoding,undefined,"shown once decoded");
});

check("SE-8 pictures a Team V script adds later are each held for the full wait (not released by their position in the list)",async()=>{
  const observers=[];
  const {root,V,host}=makeRoot({realTimers:true,observers});
  V.register("trophyRoom",{frame:()=>({}),mount(){root.mounts++;},unmount(){}});
  root.showScreen("trophyRoom");
  for(let i=0;i<4;i++){root.deliver();await flush();}
  assert.equal(root.mounts,1);
  const watcher=observers.find(o=>o.target===host("trophyRoom"));
  assert.ok(watcher,"the screen's picture watcher is on");
  // Team V's script inserts a block with several pictures (NodeList.forEach passes each picture's index as a second argument).
  const pictures=[heroPicture(),heroPicture(),heroPicture()];
  pictures.forEach(img=>{img.src="visual-assets/v10_1/trophy-room/assets/ENV_TR_PHONE_V1.webp";});
  watcher.fn([{type:"childList",addedNodes:[{nodeType:1,tagName:"DIV",querySelectorAll:()=>pictures}]}]);
  await new Promise(r=>setTimeout(r,40));await flush();
  pictures.forEach((img,i)=>assert.equal(img.dataset.v10Decoding,"1",`picture ${i} still held while it loads`));
  pictures.forEach(img=>img.load());await flush();
  pictures.forEach((img,i)=>assert.equal(img.dataset.v10Decoding,undefined,`picture ${i} shown once decoded`));
});

(async()=>{
  let n=0;
  for(const [name,fn] of checks){await fn();console.log(`ok ${++n} ${name}`);}
  console.log(`PASS Season Results / Final Winner no-flash contracts: ${n} checks.`);
})().catch(error=>{console.error(error);process.exitCode=1;});

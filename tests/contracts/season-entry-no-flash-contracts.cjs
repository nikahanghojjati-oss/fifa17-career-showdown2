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

function makeRoot(){
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
  const root={document:doc,console:{warn(){},error(){},log(){}},Promise,CustomEvent,setTimeout:(fn,ms)=>setTimeout(fn,Math.min(ms,5)),clearTimeout,
    requestAnimationFrame:fn=>setTimeout(fn,0),loadRuntimeScript:async()=>true,reportApplicationError(){},active:"mainMenu",getActiveScreenName:()=>root.active};
  root.window=root;
  // The app's own showScreen: switches the visible section synchronously and reports success (js/screens.js contract).
  root.showScreen=id=>{for(const h of hosts.values())h.classList.add("hidden");host(id).classList.remove("hidden");root.active=id;return true;};
  host("loadingScreen");
  vm.createContext(root);vm.runInContext(SOURCE,root,{filename:"js/v10Screens.js"});
  const V=root.CareerModeV10Screens;V.install();
  root.mounts=0;
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

(async()=>{
  let n=0;
  for(const [name,fn] of checks){await fn();console.log(`ok ${++n} ${name}`);}
  console.log(`PASS Season Results / Final Winner no-flash contracts: ${n} checks.`);
})().catch(error=>{console.error(error);process.exitCode=1;});

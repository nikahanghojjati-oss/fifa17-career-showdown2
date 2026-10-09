#!/usr/bin/env node
"use strict";
// HO-020 (job 1034): js/v10Screens.js never disables a Team V stylesheet while it is still loading, also after the
// 4000 ms style timeout and when Chromium fetches a re-enabled sheet again. The minimal DOM below behaves like Chromium:
// a loading link has sheet===null; disabling it while it loads drops the request for good; disabling a loaded link
// drops its sheet, and enabling it fetches the sheet again.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../.."),SOURCE=fs.readFileSync(path.join(ROOT,"js/v10Screens.js"),"utf8");

const flush=async()=>{for(let i=0;i<30;i++)await new Promise(r=>setImmediate(r));};
class Link{
  constructor(doc){this.doc=doc;this.tagName="LINK";this.attrs=new Map();this.listeners=new Map();this.sheet=null;this.loading=false;this.dropped=false;this.off=false;this.fetches=0;}
  setAttribute(k,v){this.attrs.set(k,String(v));}
  getAttribute(k){return this.attrs.has(k)?this.attrs.get(k):null;}
  addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push(fn);}
  removeEventListener(type,fn){const list=this.listeners.get(type)||[];const i=list.indexOf(fn);if(i>=0)list.splice(i,1);}
  fire(type){for(const fn of [...(this.listeners.get(type)||[])])fn({type,target:this});}
  fetch(){if(this.dropped)return;this.loading=true;this.fetches++;this.doc.inflight.add(this);}
  get disabled(){return this.off;}
  set disabled(value){
    value=Boolean(value);if(value===this.off)return;this.off=value;
    if(value){if(this.loading){this.loading=false;this.dropped=true;this.doc.inflight.delete(this);}this.sheet=null;}
    else if(!this.sheet)this.fetch();
  }
}
function makeRoot(){
  const timers=new Map();let nextTimer=1;
  const hosts=new Map(),inflight=new Set();
  const host=id=>{if(!hosts.has(id)){const hidden=new Set(["hidden"]);hosts.set(id,{id,dataset:{},isConnected:true,classList:{contains:c=>hidden.has(c),add:c=>hidden.add(c),remove:c=>hidden.delete(c)}});}return hosts.get(id);};
  const doc={
    inflight,head:{children:[],appendChild(node){this.children.push(node);node.fetch();return node;}},documentElement:{dataset:{}},
    createElement:()=>new Link(doc),getElementById:host,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},removeEventListener(){}
  };
  const root={document:doc,console:{warn(){},error(){},log(){}},Promise,
    setTimeout:(fn,ms)=>{const id=nextTimer++;timers.set(id,{fn,ms});return id;},clearTimeout:id=>{timers.delete(id);},
    loadRuntimeScript:async()=>true,reportApplicationError(){},active:"legacy",getActiveScreenName:()=>root.active};
  root.window=root;
  // test helpers
  root.timers=timers;
  root.runStyleTimeouts=()=>{for(const [id,t] of [...timers])if(t.ms===4000){timers.delete(id);t.fn();}};
  root.deliver=()=>{for(const link of [...inflight]){inflight.delete(link);link.loading=false;link.sheet={disabled:false};link.fire("load");}};
  // The kit loads first and the screen's own sheet after it, so each step is repeated until nothing new starts.
  root.timeoutAll=async()=>{for(let i=0;i<3;i++){root.runStyleTimeouts();await flush();}};
  root.deliverAll=async()=>{for(let i=0;i<3;i++){root.deliver();await flush();}};
  root.go=id=>{for(const h of hosts.values())h.classList.add("hidden");host(id).classList.remove("hidden");root.active=id;};
  vm.createContext(root);vm.runInContext(SOURCE,root,{filename:"js/v10Screens.js"});
  const V=root.CareerModeV10Screens;
  root.mounts=0;
  V.register("seasonEntry",{css:["final-winner/final-winner.css"],frame:()=>({}),mount(){root.mounts++;},unmount(){}});
  return {root,V,doc,link:file=>doc.head.children.find(l=>l.getAttribute("data-v10-style")===V.BASE+file)};
}
let n=0;const checks=[];const check=(name,fn)=>checks.push([name,fn]);
const KIT=["shared/showdown-type.css","shared/showdown-ui.css","shared/stage.css","shared/motion.css"];

check("HO20-1 the style timeout releases the screen but a still-loading sheet is not settled: leaving for a non-Team-V screen does not disable it",async()=>{
  const {root,V,link}=makeRoot();
  root.go("seasonEntry");const shown=V.show("seasonEntry");await flush();
  for(const file of KIT)assert.equal(link(file).loading,true,`${file} still loading`);
  await root.timeoutAll();
  assert.equal(await shown,true,"the timeout still releases the screen");
  assert.equal(root.mounts,1);
  root.go("legacy");V.hide("seasonEntry");await flush();
  for(const file of KIT){const l=link(file);assert.equal(l.dropped,false,`${file} not dropped`);assert.equal(l.disabled,false,`${file} left alone while loading`);assert.equal(l.loading,true,`${file} still loading`);}
  await root.deliverAll();
  for(const file of KIT)assert.equal(link(file).disabled,true,`${file} off once its late sheet loaded: no Team V screen shows`);
  root.go("seasonEntry");await V.show("seasonEntry");await root.deliverAll();
  for(const file of KIT){const l=link(file);assert.equal(l.disabled,false,`${file} on for Final Winner`);assert.ok(l.sheet,`${file} has its sheet`);}
});

check("HO20-2 a re-enabled sheet Chromium fetches again is not disabled until it has loaded",async()=>{
  const {root,V,link}=makeRoot();
  root.go("seasonEntry");const first=V.show("seasonEntry");await flush();await root.deliverAll();await first;
  root.go("legacy");V.hide("seasonEntry");await flush();
  for(const file of KIT)assert.equal(link(file).disabled,true,`${file} off away from Team V`);
  root.go("seasonEntry");await V.show("seasonEntry");await flush();
  for(const file of KIT)assert.equal(link(file).loading,true,`${file} fetched again on enable`);
  root.go("legacy");V.hide("seasonEntry");await flush();
  for(const file of KIT)assert.equal(link(file).dropped,false,`${file} re-fetch not dropped`);
  await root.deliverAll();
  root.go("seasonEntry");await V.show("seasonEntry");await root.deliverAll();
  for(const file of KIT){const l=link(file);assert.equal(l.disabled,false,file);assert.ok(l.sheet,`${file} has its sheet on Final Winner`);}
});

check("HO20-3 a sheet that loads in time clears its timer; a late load after the timeout resolves nothing twice",async()=>{
  const {root,V,doc}=makeRoot();
  root.go("seasonEntry");const shown=V.show("seasonEntry");await flush();
  assert.equal([...root.timers.values()].filter(t=>t.ms===4000).length,doc.head.children.length,"one timer per loading sheet");
  await root.deliverAll();assert.equal(await shown,true);
  assert.equal([...root.timers.values()].filter(t=>t.ms===4000).length,0,"no style timer is left running");
  const late=makeRoot();
  late.root.go("seasonEntry");const p=late.V.show("seasonEntry");await flush();await late.root.timeoutAll();
  assert.equal(await p,true);await late.root.deliverAll();
  assert.equal(late.root.mounts,1,"the late load does not mount again");
  for(const file of KIT)assert.ok(late.link(file).sheet,`${file} late sheet applies`);
});

(async()=>{
  for(const [name,fn] of checks){await fn();console.log(`ok ${++n} ${name}`);}
  console.log(`PASS HO-020 style loader timeout contracts: ${n} checks.`);
})().catch(error=>{console.error(error);process.exitCode=1;});

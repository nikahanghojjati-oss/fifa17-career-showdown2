#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const pairing=read("js/sparkPrivatePairing.js"),mark=pairing.indexOf("// Firestore budget layer (r75).");
assert.ok(mark>0,"run only the real budget layer, as in firestore-budget-contracts.cjs");
const TEXT="Today's free online limit is used up. It resets at 3 am Boston time. Your saved career is safe.";

function world(){
  const nodes=new Map(),events=new Map(),timers=new Map();let sequence=0,screen="mainMenu",transactions=0;
  function element(tag){
    return {tagName:tag.toUpperCase(),dataset:{},children:[],textContent:"",isConnected:false,attributes:{},
      classList:{add(){},remove(){},contains(){return false;}},
      setAttribute(key,value){this.attributes[key]=String(value);},addEventListener(){},
      append(...children){for(const child of children){this.children.push(child);child.isConnected=true;if(child.id)nodes.set(child.id,child);}},
      appendChild(child){this.append(child);return child;},
      querySelector(selector){return this.children.find(child=>selector===".runtimeNoticeText"&&child.className==="runtimeNoticeText")||null;},
      querySelectorAll(){return [];},remove(){this.isConnected=false;if(this.id)nodes.delete(this.id);}
    };
  }
  const home=element("section"),heading=element("div"),grid=element("div");home.dataset.homeV10="1";
  home.querySelector=selector=>({".fifaMenuShell":element("div"),".fifaMenuHeading":heading,".fifaMenuGrid":grid})[selector]||null;
  nodes.set("mainMenu",home);nodes.set("homeTrophyRoomButton",element("button"));
  const document={body:element("body"),documentElement:{dataset:{}},visibilityState:"visible",addEventListener(){},getElementById:id=>nodes.get(id)||null,createElement:element};
  const sandbox={console,document,getActiveScreenName:()=>screen,
    addEventListener(type,fn){const handlers=events.get(type)||[];handlers.push(fn);events.set(type,handlers);},
    dispatchEvent(event){for(const fn of events.get(event.type)||[])fn(event);return true;},
    CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},
    setTimeout(fn,ms){const id=++sequence;timers.set(id,{fn,ms});return id;},clearTimeout(id){timers.delete(id);},
    CareerModeV10Screens:{register(id,definition){assert.equal(id,"mainMenu");this.definition=definition;},async show(){screen="mainMenu";this.definition.mount({},home);}}
  };
  sandbox.window=sandbox;vm.createContext(sandbox);
  // Use the existing notice implementation, including its real DOM/status and auto-dismiss behavior.
  const app=read("js/app.js"),noticeStart=app.indexOf("function rn()"),noticeEnd=app.indexOf("function reportApplicationError(");
  assert.ok(noticeStart>0&&noticeEnd>noticeStart);
  vm.runInContext("let runtimeNoticeTimer=null,runtimeNoticeElement=null,runtimeNoticeTextElement=null;"+app.slice(noticeStart,noticeEnd),sandbox,{filename:"app.js#existing-notice"});
  vm.runInContext(pairing.slice(mark),sandbox,{filename:"sparkPrivatePairing.js#budget"});
  vm.runInContext(read("js/homeScreensV10.js"),sandbox,{filename:"homeScreensV10.js"});
  const budget=sandbox.CareerModeFirestoreBudget;
  const services=budget.services({ok:true,auth:{currentUser:{uid:"nik"}},firestore:{},firestoreSdk:{async runTransaction(){transactions+=1;throw Object.assign(new Error("Quota exceeded."),{code:"resource-exhausted"});}}});
  async function trip(){await assert.rejects(services.firestoreSdk.runTransaction(services.firestore,async tx=>tx.get({path:"accounts/nik"})),error=>error.code==="resource-exhausted");assert.equal(budget.paused(),true);assert.equal(document.documentElement.dataset.firestoreQuota,"paused");}
  return {sandbox,budget,trip,open:()=>sandbox.CareerModeHomeScreensV10.install(),reopen:()=>sandbox.CareerModeV10Screens.show(),leave(){screen="settings";},timers,transactions:()=>transactions,
    notice:()=>document.getElementById("appRuntimeNotice"),text:()=>document.getElementById("appRuntimeNotice")?.querySelector(".runtimeNoticeText")?.textContent||null,
    expire(){const timer=[...timers.values()].find(item=>item.ms===budget.pauseStepsMs[0]+50);assert.ok(timer);vm.runInContext(`Date.now=()=>${budget.state().until+100};`,sandbox);timer.fn();}
  };
}

(async()=>{
  let failures=0;
  async function check(name,fn){try{await fn();console.log("PASS "+name);}catch(error){failures+=1;console.error("FAIL "+name+": "+error.message);}}
  await check("pause before Home opens shows the exact line with zero taps",async()=>{
    const w=world();await w.trip();await w.open();
    console.log("Home on open, taps=0: "+(w.text()||"(missing)"));
    assert.equal(w.text(),TEXT);assert.equal(w.notice().attributes.role,"status");assert.equal(w.notice().attributes["aria-live"],"polite");
    assert.equal(w.transactions(),1,"Home makes no additional Firestore transaction");
    assert.equal(w.timers.size,1,"only the existing budget resume timer, no notice auto-dismiss");
    w.expire();assert.equal(w.text(),null,"expired pause clears its notice");
  });
  await check("pause starting on open Home shows the line immediately without taps",async()=>{
    const w=world();await w.open();assert.equal(w.text(),null);await w.trip();
    console.log("Home on quota event, taps=0: "+(w.text()||"(missing)"));
    assert.equal(w.text(),TEXT);assert.equal(w.transactions(),1);assert.equal(w.timers.size,1);
    await w.open();assert.equal(w.text(),TEXT,"reinstall keeps the notice");
    w.budget.reset();assert.equal(w.text(),null,"resume event clears its notice");
  });
  await check("quota on another screen appears when Home reopens; unrelated status survives resume",async()=>{
    const w=world();await w.open();w.leave();await w.trip();assert.equal(w.text(),null,"no Home notice on Settings");
    await w.reopen();assert.equal(w.text(),TEXT);assert.equal(w.transactions(),1);
    w.sandbox.showAppNotice("Another existing status","error",0);w.budget.reset();assert.equal(w.text(),"Another existing status");
  });
  if(failures){console.error(`FAIL free-limit Home message contracts: ${failures} checks`);process.exitCode=1;}
  else console.log("PASS free-limit Home message contracts: opening, live quota, reopening, resume, existing status styling, zero extra Firestore traffic.");
})().catch(error=>{console.error(error);process.exitCode=1;});

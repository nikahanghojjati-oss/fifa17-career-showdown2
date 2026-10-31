#!/usr/bin/env node
"use strict";
// r87 polish (2.0.0), lane C red team findings C-05 and C-08.
// C-05: a double tap on a Home tile sent the second tap to the next screen: on desktop STATISTICS opened the Trophy Room
// (OPEN TROPHY ROOM sits under the finger), on a phone RULE BOOK bounced straight back Home (BACK TO HOME, still pending and
// invisible). js/v10Screens.js now swallows the second tap of a pointer double tap for a short window after a Home tile tap,
// wherever it lands, and a pending (invisible) screen takes no taps at all (css/v10Shell.css). Keyboard and programmatic
// clicks (detail 0) are untouched.
// C-08: the desktop header read "SEASON 1 / 3" during season 3 on a browser that had not entered the game. A shared
// Showdown's local save stays at currentRound 1 (the seasons live in the shared modules), so js/menuExperience.js now names
// a season only once js/productionSharedMultiSeasonProgression.js knows it from the shared state.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../.."),read=f=>fs.readFileSync(path.join(ROOT,f),"utf8");
let n=0;const checks=[];const check=(name,fn)=>checks.push([name,fn]);

class Node_{
  constructor(id,parent=null,cls=""){this.id=id;this.parent=parent;this.cls=cls;this.dataset={};this.attrs={};const hidden=new Set();this.classList={contains:c=>hidden.has(c),add:c=>hidden.add(c),remove:c=>hidden.delete(c),toggle(){}};}
  getAttribute(k){return Object.prototype.hasOwnProperty.call(this.attrs,k)?this.attrs[k]:null;}
  setAttribute(k,v){this.attrs[k]=String(v);}
  // just the selectors js/v10Screens.js asks for in its click guard
  closest(sel){for(const part of sel.split(",").map(s=>s.trim())){const bits=part.split(/\s+/);const own=bits[bits.length-1],anc=bits.length>1?bits[0]:null;
    for(let x=this;x;x=x.parent){const hit=own.startsWith("#")?x.id===own.slice(1):own.startsWith(".")?x.cls===own.slice(1):false;if(hit){if(!anc)return x;for(let y=x.parent;y;y=y.parent)if(anc.startsWith("#")&&y.id===anc.slice(1))return x;}}}return null;}
}
function makeRoot(){
  const listeners=new Map(),byId=new Map();
  const add=(id,parent,cls)=>{const node=new Node_(id,parent,cls);if(id)byId.set(id,node);return node;};
  const home=add("mainMenu",null),statsTile=add("careerStatisticsTile",home,"menuTile"),rulesTile=add("ruleBookButton",home,"menuTile");
  const stats=add("careerStatistics",null),trophyButton=add("openTrophyRoom",stats);
  const rules=add("ruleBook",null),backHome=add("ruleBookBack",rules);
  stats.classList.add("hidden");rules.classList.add("hidden");
  let clock=1000;
  const doc={documentElement:{dataset:{}},head:{appendChild(x){return x;}},body:{},getElementById:id=>byId.get(id)||null,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({setAttribute(){},addEventListener(){},dataset:{}}),
    addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},removeEventListener(){}};
  const root={document:doc,console:{warn(){},error(){},log(){}},Promise,setTimeout:()=>0,clearTimeout(){},MutationObserver:class{observe(){}disconnect(){}},
    Date:{now:()=>clock},loadRuntimeScript:async()=>true,reportApplicationError(){},active:"mainMenu",getActiveScreenName:()=>root.active};
  root.window=root;
  vm.createContext(root);vm.runInContext(read("js/v10Screens.js"),root,{filename:"js/v10Screens.js"});
  try{root.CareerModeV10Screens.install();}catch(_error){/* nav mount needs more DOM; the click guard is installed before it */}
  const go=id=>{for(const h of [home,stats,rules])h.classList.add("hidden");byId.get(id).classList.remove("hidden");root.active=id;};
  // one click: the capture listeners run first, then (unless stopped) the target's own action
  const click=(target,detail=1)=>{let stopped=false;const event={target,detail,isTrusted:true,stopImmediatePropagation(){stopped=true;},preventDefault(){}};for(const fn of [...(listeners.get("click")||[])]){fn(event);if(stopped)break;}return !stopped;};
  return {root,go,click,tick:ms=>{clock+=ms;},statsTile,rulesTile,trophyButton,backHome};
}

check("C-05a desktop: a double tap on STATISTICS never opens the Trophy Room (second tap 250-400 ms later)",()=>{
  for(const gap of [120,250,400]){
    const h=makeRoot();
    assert.equal(h.click(h.statsTile),true,"the first tap opens Career Statistics");
    h.go("careerStatistics");h.tick(gap);
    assert.equal(h.click(h.trophyButton),false,`the second tap ${gap} ms later is swallowed, not sent to OPEN TROPHY ROOM`);
  }
});
check("C-05b phone: a double tap on RULE BOOK never bounces back Home",()=>{
  for(const gap of [120,250,400]){
    const h=makeRoot();
    assert.equal(h.click(h.rulesTile),true);
    h.go("ruleBook");h.tick(gap);
    assert.equal(h.click(h.backHome),false,`BACK TO HOME ignores the second tap ${gap} ms later`);
  }
});
check("C-05c a real tap after the window, and keyboard/programmatic clicks, still work",()=>{
  const h=makeRoot();
  h.click(h.statsTile);h.go("careerStatistics");h.tick(700);
  assert.equal(h.click(h.trophyButton),true,"a deliberate tap 700 ms later opens the Trophy Room");
  const k=makeRoot();
  k.click(k.statsTile);k.go("careerStatistics");k.tick(50);
  assert.equal(k.click(k.trophyButton,0),true,"a keyboard or programmatic click (detail 0) is never swallowed");
});
check("C-05d a pending (still invisible) Team V screen takes no taps",()=>{
  const css=read("css/v10Shell.css");
  assert.match(css,/\[data-v10-pending\] > \* \{[^}]*opacity: 0 !important;[^}]*pointer-events: none !important;/,"pending content is invisible and untappable");
});

// js/menuExperience.js with the real js/productionSharedMultiSeasonProgression.js (no authoritative view: nothing read yet on
// this page), or with a stub progression that already knows the season.
function menuSandbox({shared=true,known=null,pair="active",currentRound=1,total=3,status="Created",realProgression=true}){
  const saved={managers:{playerOne:"Daniel",playerTwo:"Nik"},status,currentRound,totalRounds:total,sharedJourney:shared?{mode:"shared",rivalryId:"pair_r87"}:undefined};
  const window={CareerModeOnlinePlayerIdentity:{getState:()=>({managerId:"nik"})},CareerModePersistentNikDanielPair:{getState:()=>({initialized:true,status:"paired",rivalryId:"pair_r87",connectionState:pair})}};
  window.getShowdownSeason=(s,p=window.CareerModeProductionSharedMultiSeasonProgression)=>s.sharedJourney?.mode==="shared"&&typeof p?.resolveSeason==="function"?p.resolveSeason(s.currentRound):s.currentRound;
  const ctx={window,document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},createElement:()=>({})},currentShowdown:saved,console,setTimeout:()=>0,clearTimeout(){},localStorage:{getItem:()=>null,setItem(){}},navigator:{},matchMedia:()=>({matches:false,addEventListener(){}})};
  ctx.globalThis=ctx;Object.assign(ctx,{CareerModePersistentNikDanielPair:window.CareerModePersistentNikDanielPair});
  vm.createContext(ctx);
  if(realProgression){vm.runInContext(read("js/productionSharedMultiSeasonProgression.js"),ctx,{filename:"js/productionSharedMultiSeasonProgression.js"});window.CareerModeProductionSharedMultiSeasonProgression=ctx.CareerModeProductionSharedMultiSeasonProgression;}
  else window.CareerModeProductionSharedMultiSeasonProgression={resolveSeason:()=>known,seasonUnknown:()=>false};
  vm.runInContext(read("js/menuExperience.js"),ctx,{filename:"js/menuExperience.js"});
  return vm.runInContext("getSavedShowdownMenuMeta()",ctx);
}
check("C-08a a live shared Showdown whose season this page has not read shows no guessed season",()=>{
  const meta=menuSandbox({});
  assert.notEqual(meta.indicator,"Season 1 / 3","never SEASON 1 / 3 from the local save, which stays at round 1");
  assert.equal(meta.indicator,"3-Season Showdown");
  assert.equal(meta.meta,"Daniel vs Nik · 3-Season Showdown");
  assert.equal(menuSandbox({total:1}).indicator,"1-Season Showdown");
});
check("C-08b once the shared state knows the season, the header names it",()=>{
  assert.equal(menuSandbox({realProgression:false,known:3}).indicator,"Season 3 / 3");
  assert.equal(menuSandbox({realProgression:false,known:2,total:5}).meta,"Daniel vs Nik · Season 2 of 5");
});
check("C-08c a code still waiting for Nik is season 1 for certain; a local save and a finished Showdown keep their text",()=>{
  assert.equal(menuSandbox({pair:"pending-pair"}).indicator,"Season 1 / 3","Daniel's waiting code reads Season 1 / 3 (r80 R1.1)");
  assert.equal(menuSandbox({shared:false,currentRound:2}).indicator,"Season 2 / 3");
  assert.equal(menuSandbox({status:"Completed"}).indicator,"Showdown Complete");
});
check("C-08d progression calls a season known only from its authoritative view of the same rivalry",()=>{
  const src=read("js/productionSharedMultiSeasonProgression.js");
  assert.match(src,/seasonUnknown:pmspSeasonUnknown/,"seasonUnknown is exported");
  assert.match(src,/function pmspSeasonUnknown\(\)\{[^\n]*connectionState!=="active"[^\n]*view\.authoritative===true[^\n]*view\.rivalryId/,"unknown = live pair without the authoritative view of its rivalry");
});

(async()=>{
  for(const [name,fn] of checks){await fn();console.log(`ok ${++n} ${name}`);}
  console.log(`PASS r87 polish final contracts (C-05 double tap, C-08 header season): ${n} checks.`);
})().catch(error=>{console.error(error);process.exitCode=1;});

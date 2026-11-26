"use strict";
// r100 (Nik 2026-11-26: "League Roulette always the 3D board, never the old wheel, in every clubhouse"). The League Roulette
// audit (gameplay/r100/threads/lr-audit, real Chrome with WebGL2) found:
//   F1 Daniel's "Waiting for Nik" screen was the old 2D wheel in the V3 room: the board was armed only once both players were
//      connected (js/productionSharedShowdownPresentation.js), so Select League never held for it and drew the plain wheel.
//   F2 on a reload, a resume or a late join the loading screen left before the board and its room were drawn (an empty screen
//      for up to 4 s, the fade frozen by the board's shader compile), and could come back after.
//   F3 a lost WebGL context the browser never gave back left a dead board, and the roulette stalled on it.
// The fixes, run here on the real files in node:vm (no browser; the browser proof is tests/browser/support/ce2pg-league-3d.cjs):
//   G1 js/v10Setup.js arms the board idle as Select League opens in a shared Showdown, connected or not (also Daniel's START,
//      before the entry marks the new shell), fetching its module first; the plain wheel only where 3D cannot run
//   G2 a board built idle takes the ledger later: balls dropped before this page saw the ledger show at once (never roll again),
//      later balls roll once each
//   G3 a lost context given back in time is left to three.js; one never given back is rebuilt on a new canvas on the same ball,
//      the 3D room staying on meanwhile; a rebuild that cannot run falls back to the plain wheel and its text steps
//   G4 the startup loading screen stays while a resume lands on Select League that is not drawn yet (bounded by the 15 s cap)
//   G5 js/v10Screens.js: a slow hold (Select League's board) brings the loading screen up at once and whole, takes it over from
//      the startup splash once that has gone, and never covers a screen already drawn; other screens keep the grace
//   G6 the board asks for that cover before it starts building (not for a rebuild on a drawn screen)
//   G7 nothing here reads or writes Firestore or the device: 0 new reads, 0 new writes; the ledger and the result are untouched
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
let n=0;const ok=(id,label)=>{n+=1;console.log(`ok ${id} ${label}`);};
const flush=async(times=30)=>{for(let i=0;i<times;i+=1)await new Promise(r=>setImmediate(r));};
const pick=(code,re)=>{const m=code.match(re);assert.ok(m,`missing ${re}`);return m[0];};

// ---- a tiny DOM for js/leagueRouletteStep.js ----
function classes(){const set=new Set(),log=[];return {set,log,toggle(t,on){const v=on===undefined?!set.has(t):Boolean(on);if(v)set.add(t);else set.delete(t);log.push([t,v]);return v;},add(t){set.add(t);log.push([t,true]);},remove(t){set.delete(t);log.push([t,false]);},contains:t=>set.has(t)};}
function el(id){const e={id,classList:classes(),style:{removeProperty(){}},children:[],dataset:{},parentNode:null,listeners:{},
  appendChild(c){c.parentNode=this;this.children.push(c);return c;},prepend(c){c.parentNode=this;this.children.unshift(c);},
  remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(x=>x!==this);this.parentNode=null;},
  setAttribute(){},querySelector(sel){if(sel==="canvas")return this.children.find(c=>c.isCanvas)||null;return null;},querySelectorAll(){return [];},
  addEventListener(t,f){(this.listeners[t]||(this.listeners[t]=[])).push(f);},fire(t){for(const f of this.listeners[t]||[])f({type:t,preventDefault(){}});},
  getBoundingClientRect:()=>({left:0,top:0,width:0,height:0})};return e;}
function world(){
  const wheel=el("leagueWheel"),screen=el("leagueWheelScreen"),html=el("html");
  const doc={documentElement:html,head:el("head"),getElementById:id=>id==="leagueWheel"?wheel:id==="leagueWheelScreen"?screen:null,createElement:()=>el("")};
  const mounts=[];let mountResult="scene",mountGate=null;
  const R={mount:async(box,opts)=>{const canvas=el("canvas");canvas.isCanvas=true;box.prepend(canvas);
    const s={alive:true,stage:opts.stage||0,busy:false,plan:opts.winner?{drops:[]}:null,canvas,setPlan(){this.plan={drops:[]};return true;},showStage(k){this.stage=k;},
      async drop(i){this.busy=true;await new Promise(r=>setImmediate(r));this.busy=false;this.stage=i+1;},on(){},dispose(){this.alive=false;}};
    mounts.push({opts,scene:s});await new Promise(r=>setImmediate(r));if(mountGate)await mountGate;return mountResult==="scene"?s:null;}};
  const timers=[];const cover=[];
  return {wheel,screen,html,doc,R,mounts,timers,cover,setMount:v=>{mountResult=v;},holdMount(){let open;mountGate=new Promise(r=>{open=r;});return ()=>{mountGate=null;open();};},
    install(){globalThis.document=doc;globalThis.CareerModeLeagueRoulette3d=R;
      globalThis.CareerModeV10Screens={show:async()=>true,holdNow:id=>{cover.push(id);return true;}};
      this.savedTimeout=globalThis.setTimeout;this.savedClear=globalThis.clearTimeout;
      globalThis.setTimeout=(f,ms)=>{if(ms>=1000){timers.push({f,ms});return timers.length;}return this.savedTimeout(f,ms);};
      globalThis.clearTimeout=id=>{if(typeof id==="number"&&timers[id-1])timers[id-1].f=null;else this.savedClear(id);};
      const file=require.resolve("../../js/leagueRouletteStep.js");delete require.cache[file];return require(file);},
    restore(){globalThis.setTimeout=this.savedTimeout;globalThis.clearTimeout=this.savedClear;for(const k of ["document","CareerModeLeagueRoulette3d","CareerModeV10Screens","CareerModeLeagueRouletteStep"])delete globalThis[k];
      delete require.cache[require.resolve("../../js/leagueRouletteStep.js")];},
    fireTimers(){for(const t of timers.splice(0))if(t.f)t.f();}};
}

// ---- G1: Select League's frame in a shared Showdown ----
const V=read("js/v10Setup.js");
const held=pick(V,/  let leagueStepLoad=null,leagueStepMissing=false;\n[\s\S]*?\n  function v26Install\(\)\{/).replace(/  function v26Install\(\)\{$/,"");
assert.ok(V.includes('slowHold:id==="leagueWheelScreen",frame:()=>id==="leagueWheelScreen"&&screens.HOLD&&v26LeagueHeld()?screens.HOLD:FRAMES[id],'),"Select League's frame asks v26LeagueHeld, and is a slow hold");
function frameWorld({pending=true,starting=false,loads=true}={}){
  const shows=[],loadsAsked=[];
  const ctx={root:null,shows,loadsAsked};
  ctx.root={CareerModeProductionSharedJourneyEntry:{isPending:()=>pending,isStarting:()=>starting},
    loadRuntimeScript:(key,p,ready)=>{loadsAsked.push(`${key}|${p}`);return new Promise((res,rej)=>setImmediate(()=>{if(!loads)return rej(new Error("offline"));ctx.root.CareerModeLeagueRouletteStep=ctx.step;res(true);}));}};
  ctx.v26Screens=()=>({show:id=>{shows.push(id);return Promise.resolve(true);}});
  vm.createContext(ctx);vm.runInContext(held+";globalThis.held=v26LeagueHeld;",ctx);
  return ctx;
}
async function g1(){
  // (a) shared, the board's module not loaded on this page yet (Daniel just tapped START): held while it loads, then shown again
  {const w=world();const step=w.install();try{
    const f=frameWorld({pending:false,starting:true});f.step=step;
    assert.equal(f.held(),true,"START: held while the board's module loads");
    assert.deepEqual(f.loadsAsked,["league-roulette-step|js/leagueRouletteStep.js"],"the same module (and key) the shared presentation loads");
    await flush();assert.deepEqual(f.shows,["leagueWheelScreen"],"Select League is shown again once the module is in");
    assert.equal(f.held(),true,"then held while the board builds");assert.equal(step.armed(),true,"armed idle before both players are connected");
    await flush();
    assert.equal(w.mounts.length,1,"one board");assert.equal(w.mounts[0].opts.stage,0);assert.equal(w.mounts[0].opts.winner,undefined,"no plan: the five sections whatever the league");
    assert.equal(step.holding(),false);assert.equal(f.held(),false,"drawn: the screen opens (Team V's skin mounts on the 3D board)");
    assert.ok(w.html.classList.contains("lr3d-room")&&w.wheel.classList.contains("lr3d-on"),"the 3D board and its V4 room are on");
  }finally{step.arm(false);w.restore();}}
  // (b) not a shared Showdown: nothing is armed, the frame is the screen's own
  {const w=world();const step=w.install();try{
    const f=frameWorld({pending:false});f.step=step;f.root.CareerModeLeagueRouletteStep=step;
    assert.equal(f.held(),false);assert.equal(step.armed(),false);assert.equal(f.loadsAsked.length,0);
  }finally{w.restore();}}
  // (c) where 3D cannot run (no WebGL2: the scene's mount answers null), the plain wheel, at once
  {const w=world();w.setMount(null);const step=w.install();try{
    const f=frameWorld();f.step=step;f.root.CareerModeLeagueRouletteStep=step;
    assert.equal(f.held(),true);await flush();assert.equal(step.failed(),true);assert.equal(f.held(),false,"failed: the screen opens on the plain wheel");
    assert.equal(w.html.classList.contains("lr3d-room"),false,"the 2D wheel keeps its own room");
  }finally{w.restore();}}
  // (d) the module cannot load at all: never held for ever
  {const w=world();const step=w.install();try{
    const f=frameWorld({loads:false});f.step=step;
    assert.equal(f.held(),true);await flush();assert.equal(f.held(),false,"a module that cannot load lets the screen open");assert.deepEqual(f.shows,["leagueWheelScreen"]);
  }finally{w.restore();}}
  ok("G1","Select League in a shared Showdown arms the 3D board idle as it opens, connected or not (START too), fetching its module first; the plain wheel only where 3D cannot run");
}

// ---- G2: a board built idle takes the ledger ----
async function g2(){
  const w=world();const step=w.install();
  try{
    const rolled=[];step.on((type,data)=>{if(type==="rolling")rolled.push(data.index);});
    step.idle();await step.ensure();assert.equal(step.stage(),0);
    // the first ledger this page sees already holds two balls (a reload or a late join while the idle board was building)
    step.sync({seed:"s|r",winner:"laliga",drops:2});await flush();
    assert.equal(step.stage(),2,"the balls in the ledger show at once");assert.deepEqual(rolled,[],"none of them rolls again");
    step.sync({seed:"s|r",winner:"laliga",drops:3});for(let i=0;i<60&&!step.caughtUp();i+=1)await flush(2);
    assert.equal(step.stage(),3);assert.deepEqual(rolled,[2],"a ball dropped after rolls once");
    // (Codex P2 on #1633) the first ledger arrives while the idle board is still building, and the screen syncs the same
    // ledger again as the board opens ("ready"): its balls still show at once
    step.arm(false);step.arm(true);rolled.length=0;
    const off=step.on(type=>{if(type==="ready")step.sync({seed:"s|r",winner:"bundesliga",drops:2});});
    const release=w.holdMount();step.idle();const building=step.ensure();await flush();
    assert.equal(w.mounts[w.mounts.length-1].opts.stage,0,"the idle board is already building");
    step.sync({seed:"s|r",winner:"bundesliga",drops:2});release();await building;
    for(let i=0;i<60&&!step.caughtUp();i+=1)await flush(2);off();
    assert.equal(step.stage(),2);assert.deepEqual(rolled,[],"a ledger synced again before the board caught up rolls nothing again");
    // Daniel waiting: the first ledger has no ball; balls dropped after both are connected roll
    step.arm(false);step.arm(true);rolled.length=0;step.idle();await step.ensure();
    step.sync({seed:"",winner:null,drops:0});await flush();
    step.sync({seed:"s|r",winner:"serie_a",drops:1});for(let i=0;i<60&&!step.caughtUp();i+=1)await flush(2);
    assert.equal(step.stage(),1);assert.deepEqual(rolled,[0],"Daniel's first ball rolls on the idle board");
    // the ledger is the presentation's: idle() never moves the board
    step.idle();await flush();assert.equal(step.stage(),1);
    // a new Showdown on this page (the reset in js/persistentNikDanielPair.js): the next waiting screen builds idle again
    globalThis.CareerModeShowdownClears["league-roulette"]();step.idle();const again=await step.ensure();
    assert.ok(again&&w.mounts.length===4&&w.mounts[3].opts.stage===0,"a new Showdown's waiting screen gets its idle board, never a hold that waits for a ledger");
  }finally{step.arm(false);w.restore();}
  ok("G2","a board built idle shows the balls the first ledger already holds at once (never rolled again), and rolls each later ball once");
}

// ---- G3: a lost WebGL context ----
async function g3(){
  {const w=world();const step=w.install();try{
    step.arm(true);step.sync({seed:"s|r",winner:"ligue_1",drops:2});await step.ensure();
    const first=w.mounts[0].scene;first.canvas.fire("webglcontextlost");assert.equal(w.timers.length,1,"a lost context waits for the browser first");
    first.canvas.fire("webglcontextrestored");w.fireTimers();await flush();
    assert.equal(w.mounts.length,1,"given back in time: three.js restores it in place, no rebuild");assert.equal(first.alive,true);
  }finally{step.arm(false);w.restore();}}
  {const w=world();const step=w.install();try{
    const events=[];step.on(type=>events.push(type));
    step.arm(true);step.sync({seed:"s|r",winner:"ligue_1",drops:2});await step.ensure();
    const first=w.mounts[0].scene;w.html.classList.log.length=0;w.wheel.classList.log.length=0;w.cover.length=0;
    first.canvas.fire("webglcontextlost");w.fireTimers();await flush();
    assert.equal(first.alive,false,"never given back: the dead board is let go");
    assert.equal(w.mounts.length,2,"and built again on a new canvas");assert.equal(w.mounts[1].opts.stage,2,"on the same ball");assert.equal(w.mounts[1].opts.winner,"ligue_1");
    assert.equal(step.stage(),2);assert.equal(step.failed(),false);
    assert.ok(!w.html.classList.log.some(([t,v])=>t==="lr3d-room"&&v===false),"the 3D room never goes off meanwhile");
    assert.ok(!w.wheel.classList.log.some(([t,v])=>t==="lr3d-on"&&v===false),"the plain wheel never shows meanwhile");
    assert.ok(events.includes("lost")&&events.includes("ready"),"the screen hears the loss and the new board");
    assert.deepEqual(w.cover,[],"a rebuild on a drawn screen never brings the loading screen back");
  }finally{step.arm(false);w.restore();}}
  {const w=world();const step=w.install();try{
    step.arm(true);step.sync({seed:"s|r",winner:"ligue_1",drops:1});await step.ensure();
    w.setMount(null);w.mounts[0].scene.canvas.fire("webglcontextlost");w.fireTimers();await flush();
    assert.equal(step.failed(),true,"a board that cannot be built again");assert.equal(w.html.classList.contains("lr3d-room"),false,"falls back to the plain wheel (its text steps), as where 3D never ran");
  }finally{step.arm(false);w.restore();}}
  const S=read("js/leagueRouletteStep.js");
  assert.ok(S.includes("const LOST_WAIT_MS=2500;"));
  ok("G3","a lost context given back in time stays in place; one never given back is rebuilt on the same ball with the 3D room kept on; a rebuild that cannot run falls back to the plain wheel");
}

// ---- G4: the startup loading screen waits for Select League ----
async function g4(){
  const S=read("js/ssjr.js");
  assert.ok(S.includes(".then(liveGameGate).catch(()=>null).then(leagueGate).catch(()=>null).then(()=>{root.careerModeHomeHold=0;});"),"Home is handed over only after the League gate");
  const src=pick(S,/  const leagueHeld=\(\)=>\{[\s\S]*?\n  \};\n  const leagueGate=[^\n]*\n/);
  const ctx={left:15000,active:"leagueWheelScreen",pendingAttr:true,ticks:0};
  ctx.startupCapLeft=()=>ctx.left;
  ctx.root={getActiveScreenName:()=>ctx.active,document:{getElementById:id=>id==="leagueWheelScreen"?{hasAttribute:a=>a==="data-v10-pending"&&ctx.pendingAttr}:null},setTimeout:(f)=>{ctx.ticks+=1;setImmediate(f);}};
  vm.createContext(ctx);vm.runInContext(src+";globalThis.gate=leagueGate;globalThis.heldNow=leagueHeld;",ctx);
  let done=false;const p=ctx.gate().then(()=>{done=true;});
  await flush(10);assert.equal(done,false,"held while Select League is not drawn");
  ctx.pendingAttr=false;await p;assert.equal(done,true,"let go once it is drawn");
  ctx.pendingAttr=true;ctx.left=0;assert.equal(ctx.heldNow(),false,"bounded by the startup cap");
  ctx.left=5000;ctx.active="transferChallenge";assert.equal(ctx.heldNow(),false,"only Select League");
  ok("G4","a resume landing on Select League keeps the startup loading screen until the board and its room are drawn (15 s cap)");
}

// ---- G5: the in-app loading screen for a slow hold ----
function gateWorld(){
  const Vs=read("js/v10Screens.js");
  const src=pick(Vs,/  const gate=\{timer:null,raisedAt:0,lowering:null\};[\s\S]*?\n  function vsGateRelease\(\)\{/).replace(/  function vsGateRelease\(\)\{$/,"");
  const L={hidden:true,cls:new Set(["hidden"]),attrs:{},dataset:{},style:{transition:""},log:[]};
  L.classList={add:(...t)=>{t.forEach(x=>L.cls.add(x));L.log.push(["add",...t]);},remove:(...t)=>{t.forEach(x=>L.cls.delete(x));L.log.push(["remove",...t]);},contains:t=>L.cls.has(t)};
  L.getAttribute=k=>k in L.attrs?L.attrs[k]:null;L.setAttribute=(k,v)=>{L.attrs[k]=String(v);};L.removeAttribute=k=>{delete L.attrs[k];};
  Object.defineProperty(L,"offsetWidth",{get(){L.log.push(["reflow",L.style.transition]);return 1;}});
  const ctx={registry:new Map(),pending:new Map(),mounted:new Map(),shown:new Set(),timers:[],GATE_GRACE_MS:250,L,
    vsIsShown:id=>ctx.shown.has(id),vsHost:id=>id==="loadingScreen"?L:id==="loadingText"?null:{dataset:{}},vsSetNavMode(){},vsSyncStyles(){},vsPendingTimer:()=>0,
    root:{setTimeout:(f,ms)=>{ctx.timers.push({f,ms});return ctx.timers.length;},clearTimeout:id=>{if(ctx.timers[id-1])ctx.timers[id-1].f=null;}},Date};
  vm.createContext(ctx);vm.runInContext(src+";globalThis.holdNow=vsHoldNow;globalThis.hold=vsGateHold;globalThis.gate=gate;",ctx);
  ctx.run=()=>{const list=ctx.timers.splice(0);for(const t of list)if(t.f)t.f();return list;};
  return ctx;
}
async function g5(){
  {const g=gateWorld();g.registry.set("leagueWheelScreen",{slowHold:true});g.shown.add("leagueWheelScreen");
    assert.equal(g.holdNow("leagueWheelScreen"),true);
    assert.equal(g.L.hidden,false,"up at once (no grace)");assert.ok(!g.L.cls.has("is-exiting"),"whole, not fading in");
    assert.ok(g.L.log.some(([k,t])=>k==="reflow"&&t==="none"),"shown with no transition");assert.equal(g.L.dataset.v10Gate,"1","the gate owns it, and lowers it once the screen is drawn");
    assert.equal(g.pending.has("leagueWheelScreen"),true,"the screen is held");}
  {const g=gateWorld();g.registry.set("leagueWheelScreen",{slowHold:true});g.shown.add("leagueWheelScreen");
    g.L.hidden=false;g.L.cls.delete("hidden");g.L.cls.add("is-exiting");// the startup splash on its way out
    g.holdNow("leagueWheelScreen");assert.equal(g.L.dataset.v10Gate,undefined,"another owner's loading screen is left alone");
    assert.equal(g.timers.length,1);assert.equal(g.timers[0].ms,50,"and watched");
    g.L.hidden=true;g.L.cls.add("hidden");g.run();
    assert.equal(g.L.hidden,false,"once it has gone, the gate takes over at once");assert.equal(g.L.dataset.v10Gate,"1");assert.ok(!g.L.cls.has("is-exiting"));}
  {const g=gateWorld();g.registry.set("leagueWheelScreen",{slowHold:true});g.shown.add("leagueWheelScreen");g.mounted.set("leagueWheelScreen",{});
    assert.equal(g.holdNow("leagueWheelScreen"),false,"a drawn screen is never covered again");assert.equal(g.L.hidden,true);}
  {const g=gateWorld();g.registry.set("transferChallenge",{});g.shown.add("transferChallenge");g.pending.set("transferChallenge",{});
    g.hold();assert.equal(g.L.hidden,true,"other screens keep the grace");assert.equal(g.timers[0].ms,250);
    g.L.hidden=false;g.L.cls.delete("hidden");g.run();assert.equal(g.timers.length,0,"and leave another owner's loading screen alone, as before");}
  const Vs=read("js/v10Screens.js");
  assert.ok(Vs.includes("vsGateHold(def.slowHold);vsSyncStyles();}\n        else if(def.slowHold)vsGateHold(true);"),"a HOLD from a slow screen raises it at once");
  assert.ok(Vs.includes("holdNow:vsHoldNow,"));
  ok("G5","a slow hold brings the loading screen up at once and whole, takes it over from the startup splash once that has gone, never covers a drawn screen; other screens unchanged");
}

// ---- G6: the board asks for the cover before it builds ----
async function g6(){
  const w=world();const step=w.install();
  try{
    w.screen.classList.remove("hidden");
    step.arm(true);step.sync({seed:"",winner:null,drops:0});const p=step.ensure();
    assert.deepEqual(w.cover,["leagueWheelScreen"],"the cover is asked for before the board starts building");
    assert.equal(w.mounts.length,0);await p;assert.equal(w.mounts.length,1);
    step.ensure();step.ensure();assert.deepEqual(w.cover,["leagueWheelScreen"],"once: a drawn board asks nothing more");
  }finally{step.arm(false);w.restore();}
  ok("G6","the board brings the loading screen up before it starts building (its compile can hold the page), and only then");
}

// ---- G7: no Firestore, no device storage, the ledger untouched ----
function g7(){
  const strip=s=>s.replace(/\/\/.*$/gm,"");
  for(const [file,start,end] of [["js/v10Setup.js","let leagueStepLoad=null","function v26Install(){"],["js/ssjr.js","const leagueHeld=","root.careerModeHomeHold=1;"],["js/v10Screens.js","const slowNow=new Set();","function vsGateHold(now=false){"]]){
    const s=read(file),a=s.indexOf(start),b=s.indexOf(end,a);assert.ok(a>0&&b>a,file);
    assert.doesNotMatch(strip(s.slice(a,b)),/firestore|firebase|getDoc|setDoc|updateDoc|onSnapshot|runTransaction|localStorage|sessionStorage|indexedDB|fetch\(/i,`${file}: no read, write or storage`);
  }
  const S=strip(read("js/leagueRouletteStep.js"));
  assert.doesNotMatch(S,/firestore|firebase|getDoc|setDoc|updateDoc|onSnapshot|runTransaction|localStorage|sessionStorage|indexedDB/i,"the board's step: no read, write or storage");
  const P=read("js/productionSharedShowdownPresentation.js");
  assert.ok(P.includes("try{const step=await ssjpEnsureRouletteStep();if(step)step.arm(true);}catch(_error){}ssjpForceScreen(\"leagueWheelScreen\");"),"the presentation still arms and owns the ledger (unchanged)");
  assert.ok(P.includes("else step.sync({seed:ssjpRouletteSeed(setup),winner:setup.leagueId,drops:ssjpDrops(),instant:!ssjpRouletteLedger()});"),"the board's ledger is the shared Setup's (unchanged)");
  const E=read("js/productionSharedJourneyEntry.js");assert.ok(E.includes("isPending:pending,isStarting:()=>busy});"),"the entry tells START under way (its own busy flag, no read)");
  ok("G7","no Firestore read, write or listener and no device storage in any changed path; the ledger and the result stay the shared Setup's");
}

(async()=>{await g1();await g2();await g3();await g4();await g5();await g6();g7();console.log(`PASS r100 League Roulette 3D-always contracts (${n} checks)`);})().catch(error=>{console.error(error);process.exit(1);});

"use strict";
// Fable job 16 Prime Pack fixes for 2.0.0 (G Lead 2026-11-02):
//   G1  F16-02 a phone locked after its arrival commits but before the first snapshot still withdraws (nobody plays alone)
//   G2  F16-01 with CMS_PRIME_PACK="off" the season results never block a publish on the Prime Pack: a failed load or read
//       scores 0, a point this phone already saw won still counts; with the switch on nothing changes (F13-04, F14-02)
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ROOT=path.join(__dirname,"..","..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};

global.window=globalThis;
const Icons=require("../../data/icons.js");
globalThis.CareerModeIcons=globalThis.CareerModeIcons||Icons;
const Guess=require("../../js/iconGuess.js");globalThis.CareerModeIconGuess=Guess;
const Names=require("../../js/iconNames.js");globalThis.CareerModeIconNames=globalThis.CareerModeIconNames||Names;
const RID=`pair_${"7".repeat(64)}`;
const ts=ms=>({toMillis:()=>ms});
const flush=async(n=12)=>{for(let i=0;i<n;i+=1)await new Promise(resolve=>setImmediate(resolve));};

// ---------- fakes ----------
const realSetTimeout=globalThis.setTimeout,realSetInterval=globalThis.setInterval,realClearInterval=globalThis.clearInterval,realNow=Date.now;
function harness({holdSnapshots=false}={}){
  const timers=[];let wall=1_900_000_000_000;
  globalThis.setTimeout=(fn,ms)=>{const t={fn,at:wall+ms,done:false};timers.push(t);return t;};
  globalThis.setInterval=(fn,ms)=>{const t={fn,every:ms,next:wall+ms,interval:true,done:false};timers.push(t);return t;};
  globalThis.clearInterval=t=>{if(t)t.done=true;};globalThis.clearTimeout=t=>{if(t)t.done=true;};
  Date.now=()=>wall;
  const advance=async ms=>{const until=wall+ms;for(;;){await flush(4);const due=timers.filter(t=>!t.done&&(t.interval?t.next:t.at)<=until).sort((a,b)=>(a.interval?a.next:a.at)-(b.interval?b.next:b.at))[0];if(!due)break;wall=due.interval?due.next:due.at;if(due.interval)due.next+=due.every;else due.done=true;due.fn();await flush(4);}wall=until;await flush();};
  // DOM
  const created=[],docListeners={},winListeners={};
  const el=tag=>{const node={tag,id:"",className:"",textContent:"",hidden:false,type:"",style:{},children:[],attached:false,listeners:{},
    setAttribute(){},append(...c){for(const child of c){this.children.push(child);child.parent=this;}},remove(){this.attached=false;},
    addEventListener(t,f){(this.listeners[t]=this.listeners[t]||[]).push(f);},click(){for(const f of this.listeners.click||[])f();},focus(){},
    querySelector(){return this.children.flatMap(function walk(n){return [n,...n.children.flatMap(walk)];}).find(n=>n.tag==="button")||null;}};
    if(tag==="iframe")node.contentWindow={posts:[],postMessage(msg){this.posts.push(msg);}};
    created.push(node);return node;};
  const attach=node=>{node.attached=true;for(const c of node.children)attach(c);};
  const document={visibilityState:"visible",createElement:el,body:{append(...c){for(const n of c)attach(n);}},
    getElementById:id=>created.find(n=>n.attached&&n.id===id)||null,
    addEventListener(t,f){(docListeners[t]=docListeners[t]||[]).push(f);},removeEventListener(t,f){docListeners[t]=(docListeners[t]||[]).filter(g=>g!==f);}};
  globalThis.document=document;
  globalThis.addEventListener=(t,f)=>{(winListeners[t]=winListeners[t]||[]).push(f);};
  globalThis.removeEventListener=(t,f)=>{winListeners[t]=(winListeners[t]||[]).filter(g=>g!==f);};
  let closes=0;globalThis.CareerModeRosterRouletteStep={close:()=>{closes+=1;}};
  // Firestore: one round record, transactions, server timestamps, one listener.
  let stored=null,serverNow=wall;const listeners=[];const SERVER_TS={sentinel:"serverTimestamp"};
  const stamp=value=>value===SERVER_TS?ts(serverNow):value;
  const snapOf=()=>({exists:()=>stored!==null,data:()=>stored&&JSON.parse(JSON.stringify(stored,(k,v)=>v&&typeof v.toMillis==="function"?{__ms:v.toMillis()}:v),(k,v)=>v&&typeof v==="object"&&"__ms" in v?ts(v.__ms):v),metadata:{}});
  const notify=()=>{if(holdSnapshots)return;for(const l of listeners)if(!l.stopped)l.next(snapOf());};
  const write=(data)=>{stored=data;notify();};
  let transactions=0;
  const sdk={doc:(_fs,...parts)=>parts.join("/"),serverTimestamp:()=>SERVER_TS,
    runTransaction:async(_fs,fn)=>{transactions+=1;let pending=null;const tx={get:async()=>snapOf(),set:(_ref,data)=>{pending={set:data};},update:(_ref,data)=>{pending={update:data};}};
      const out=await fn(tx);
      if(pending&&pending.set){const d=JSON.parse(JSON.stringify(pending.set));d.arrived={playerOne:stamp(pending.set.arrived.playerOne),playerTwo:stamp(pending.set.arrived.playerTwo)};d.updatedAt=ts(serverNow);write(d);}
      if(pending&&pending.update){const d={...stored,arrived:{...stored.arrived},chipsUsed:{...stored.chipsUsed}};for(const [k,v] of Object.entries(pending.update)){const [a,b]=k.split(".");if(b)d[a][b]=stamp(v);else d[a]=stamp(v);}d.updatedAt=ts(serverNow);write(d);}
      return out;},
    onSnapshot:(_ref,_opts,next,error)=>{const l={next,error,stopped:false};listeners.push(l);if(stored!==null&&!holdSnapshots)Promise.resolve().then(()=>next(snapOf()));return ()=>{l.stopped=true;};}};
  let resyncs=0;
  const io={firestore:{},sdk,rivalryId:RID,sessionId:"s1",deviceId:"d1",now:()=>serverNow,resync:async()=>{resyncs+=1;}};
  const frame=()=>created.find(n=>n.tag==="iframe"&&n.attached);
  const fromPage=data=>{const f=frame();for(const l of winListeners.message||[])l({source:f.contentWindow,data});};
  const posts=type=>frame().contentWindow.posts.filter(p=>p.type===type);
  const back=()=>created.find(n=>n.tag==="button"&&n.attached&&n.textContent==="BACK TO SHOWDOWN HOME"&&n.parent?.tag==="div"&&n.parent.id==="igStage");
  const dialog=()=>created.find(n=>n.attached&&n.id==="igStepPanel");
  const dialogButton=label=>created.filter(n=>n.tag==="button"&&n.attached&&n.textContent===label&&n.parent?.parent?.parent?.id==="igStepPanel").pop();
  const setVisibility=state=>{document.visibilityState=state;for(const f of docListeners.visibilitychange||[])f();};
  return {advance,io,frame,fromPage,posts,back,dialog,dialogButton,setVisibility,listeners,
    get stored(){return stored;},set stored(v){write(v);},get closes(){return closes;},get resyncs(){return resyncs;},get transactions(){return transactions;},
    get serverNow(){return serverNow;},set serverNow(v){serverNow=v;},tick:ms=>{serverNow+=ms;}};
}
function restore(){globalThis.setTimeout=realSetTimeout;globalThis.setInterval=realSetInterval;globalThis.clearInterval=realClearInterval;Date.now=realNow;}
function freshStep(){delete require.cache[require.resolve("../../js/iconGuessStep.js")];return require("../../js/iconGuessStep.js");}
// Confirm times one hour after the release time the tool set (contracts must not depend on today's date).
const ELIGIBLE_MS=Date.parse(require("../../tools/set-release-time.cjs").read()[0].value)+3600000;
const ctx=(role="playerOne")=>({rivalryId:RID,managerRole:role,season:1,confirmedAtMs:Math.max(realNow(),ELIGIBLE_MS)});
const other={playerOne:"playerTwo",playerTwo:"playerOne"};
const arrivedOf=(h,role)=>h.stored&&h.stored.arrived[role]?h.stored.arrived[role].toMillis():null;
// PRIME_PACK_F16_ALL=1 runs every section and lists each failure (used to show each one fails on the code before the fix).
let failed=0;
async function section(id,fn){
  try{await fn();}catch(error){restore();if(!process.env.PRIME_PACK_F16_ALL)throw error;failed+=1;console.log(`not ok ${id} ${error.message.split("\n")[0]}`);}
}

// pssrWithPrimePack from the shipped file, run in a sandbox with a fake setup, loader and step.
function seasonResultsPack({off=false,step=null,loadFails=false,confirmedAtMs=ELIGIBLE_MS}={}){
  const src=read("js/productionSharedSeasonResults.js");
  const from=src.indexOf("  const PRIME_PACK_FROM_MS="),to=src.indexOf("  async function pssrPublish()");
  assert.ok(from>0&&to>from,"pssrWithPrimePack is where it was");
  const notes=[];
  const sandbox={root:{CMS_PRIME_PACK:off?"off":undefined,CareerModeIconGuessStep:loadFails?null:step,loadRuntimeScript:async()=>{if(loadFails)throw new Error("offline");},CareerModeFirestoreBudget:{noteError:e=>notes.push(e)}},
    setupApi:{refresh:async()=>true},pssrSetupState:()=>({setupUpdatedAtMs:confirmedAtMs}),
    pssrFail:(code,message)=>{const e=new Error(message||code);e.code=code;throw e;},Date,Number,Promise,Object};
  vm.createContext(sandbox);
  vm.runInContext(`${src.slice(from,to)};this.fn=pssrWithPrimePack;`,sandbox);
  return {run:()=>sandbox.fn({options:{rivalryId:RID,firestore:{},firebaseSdk:{}},setup:{managerRole:"playerOne"}},{seasonNumber:3},{leaguePosition:2,primePack:9}),notes};
}
const fakeStep=({ensure=true,points=0,readFails=false,memo=null}={})=>({ensure:async()=>ensure,applies:(c,o)=>Boolean(o&&o.ignoreSwitch),
  wonPoints:()=>memo,pointsFor:async()=>{if(readFails)throw Object.assign(new Error("unavailable"),{code:"unavailable"});return points;}});

(async()=>{
  // G1 F16-02: the arrival commits, the phone locks before the first snapshot lands: it still withdraws.
  await section("G1",async()=>{
    const h=harness({holdSnapshots:true}),Step=freshStep();
    const run=Step.run(ctx("playerOne"),h.io);await h.advance(50);
    h.fromPage({type:"cms-ig-ready"});await h.advance(50);
    assert.ok(arrivedOf(h,"playerOne"),"the arrival committed");
    h.setVisibility("hidden");await h.advance(50);
    assert.equal(arrivedOf(h,"playerOne"),null,"locked before the first snapshot, the arrival is withdrawn (the other never plays alone for 4)");
    h.setVisibility("visible");await h.advance(50);
    assert.ok(arrivedOf(h,"playerOne"),"back on screen it arrives again");
    // Hidden before the page is ready: nothing was written, nothing to withdraw (no wasted read).
    restore();
    const h2=harness({holdSnapshots:true}),Step2=freshStep();
    const run2=Step2.run(ctx("playerTwo"),h2.io);await h2.advance(50);
    const before=h2.transactions;h2.setVisibility("hidden");await h2.advance(50);
    assert.equal(h2.transactions,before,"hidden before the page is ready sends no withdraw");
    h2.setVisibility("visible");await h2.advance(50);
    assert.equal(h2.stored,null,"and writes no arrival until the page is ready");
    restore();
    ok("G1","F16-02: a lock between the arrival and the first snapshot withdraws; before the page is ready nothing is written");
    void run;void run2;
  });
  // G2 F16-01: the kill switch is a rescue: the Prime Pack never blocks the publish when it is off.
  await section("G2",async()=>{
    const pub=async opts=>{const s=seasonResultsPack(opts);return {out:await s.run().then(v=>JSON.parse(JSON.stringify(v)),e=>({error:e.code||e.message})),notes:s.notes};};
    let r=await pub({off:true,loadFails:true});
    assert.deepEqual(r.out,{leaguePosition:2},"switch off, the step cannot load: published with no point");
    r=await pub({off:true,step:fakeStep({ensure:false})});
    assert.deepEqual(r.out,{leaguePosition:2},"switch off, ensure() fails: published with no point");
    r=await pub({off:true,step:fakeStep({readFails:true})});
    assert.deepEqual(r.out,{leaguePosition:2},"switch off, the round read fails: noted and scored 0");
    assert.equal(r.notes.length,1,"the failed read is noted");
    r=await pub({off:true,step:fakeStep({readFails:true,memo:3})});
    assert.deepEqual(r.out,{leaguePosition:2,primePack:3},"switch off, a point this phone already saw won still counts");
    r=await pub({off:true,step:fakeStep({points:4})});
    assert.deepEqual(r.out,{leaguePosition:2,primePack:4},"switch off, a won round read from the record still counts (F14-02)");
    // Switch on: unchanged, a failure stops the publish (TRY AGAIN), never a dropped point.
    r=await pub({loadFails:true});assert.equal(r.out.error,"SEASON_RESULTS_PRIME_PACK_UNAVAILABLE");
    r=await pub({step:fakeStep({ensure:false})});assert.equal(r.out.error,"SEASON_RESULTS_PRIME_PACK_UNAVAILABLE");
    r=await pub({step:fakeStep({readFails:true})});assert.equal(r.out.error,"unavailable","switch on, a failed read stops the publish");
    r=await pub({step:fakeStep({points:2})});assert.deepEqual(r.out,{leaguePosition:2,primePack:2});
    r=await pub({off:true,confirmedAtMs:Number.NaN,step:fakeStep()});assert.equal(r.out.error,"SEASON_RESULTS_PRIME_PACK_UNAVAILABLE","an unknown confirm time still fails closed (F13-04)");
    ok("G2","F16-01: with the switch off a failed load or read publishes with 0 (a remembered win still counts); with it on nothing changes");
  });
  if(failed){console.log(`FAIL r87 Prime Pack F16 contracts: ${failed} failed.`);process.exit(1);}
  console.log(`PASS r87 Prime Pack F16 contracts: ${checks} checks.`);
  process.exit(0);
})().catch(error=>{restore();console.error(error);process.exit(1);});

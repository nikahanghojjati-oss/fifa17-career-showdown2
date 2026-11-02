"use strict";
// Fable job 13 Prime Pack fixes for 2.0.0 (G Lead 2026-11-01): the season step (js/iconGuessStep.js) run for real against a
// fake page, a fake Firestore record and a fake clock, plus the season results / Transfer Challenge confirm-time guards.
//   F1  F13-01/07 arrive only once the page says it is ready; the roulette panel stays until then (Reus Gate)
//   F2  F13-01 a fault (listener error) withdraws this manager's arrival when the other has not arrived; page timeout too
//   F3  F13-02 BACK always shows while waiting; a missing own arrival while on screen is sent again, at most every 3 s
//   F4  F13-03 back from a hidden phone: a fresh server clock and the current stage sent again
//   F5  F13-06 the time draw shows only after the Rules' 97 s window, never at 95 s
//   F6  F13-04 an unknown confirm time fails closed (TRY AGAIN) in the season results and the Transfer Challenge
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
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
function harness(){
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
  const notify=()=>{for(const l of listeners)if(!l.stopped)l.next(snapOf());};
  const write=(data)=>{stored=data;notify();};
  let transactions=0;
  const sdk={doc:(_fs,...parts)=>parts.join("/"),serverTimestamp:()=>SERVER_TS,
    runTransaction:async(_fs,fn)=>{transactions+=1;let pending=null;const tx={get:async()=>snapOf(),set:(_ref,data)=>{pending={set:data};},update:(_ref,data)=>{pending={update:data};}};
      const out=await fn(tx);
      if(pending&&pending.set){const d=JSON.parse(JSON.stringify(pending.set));d.arrived={playerOne:stamp(pending.set.arrived.playerOne),playerTwo:stamp(pending.set.arrived.playerTwo)};d.updatedAt=ts(serverNow);write(d);}
      if(pending&&pending.update){const d={...stored,arrived:{...stored.arrived},chipsUsed:{...stored.chipsUsed}};for(const [k,v] of Object.entries(pending.update)){const [a,b]=k.split(".");if(b)d[a][b]=stamp(v);else d[a]=stamp(v);}d.updatedAt=ts(serverNow);write(d);}
      return out;},
    onSnapshot:(_ref,_opts,next,error)=>{const l={next,error,stopped:false};listeners.push(l);if(stored!==null)Promise.resolve().then(()=>next(snapOf()));return ()=>{l.stopped=true;};}};
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
const ctx=(role="playerOne")=>({rivalryId:RID,managerRole:role,season:1,confirmedAtMs:realNow()});
const other={playerOne:"playerTwo",playerTwo:"playerOne"};
const arrivedOf=(h,role)=>h.stored&&h.stored.arrived[role]?h.stored.arrived[role].toMillis():null;

// PRIME_PACK_F13_ALL=1 runs every section and lists each failure (used to show each one fails on the code before the fix).
let failed=0;
async function section(id,fn){
  try{await fn();}catch(error){restore();if(!process.env.PRIME_PACK_F13_ALL)throw error;failed+=1;console.log(`not ok ${id} ${error.message.split("\n")[0]}`);}
}
(async()=>{
  // F1 F13-01 + F13-07: a slow page. Before cms-ig-ready nothing is written (stage 1 is not spent) and the roulette panel
  // stays over the stage (no plain dark screen); on ready the panel goes and this manager arrives.
  await section("F1",async()=>{
    const h=harness(),Step=freshStep();
    const run=Step.run(ctx("playerOne"),h.io);await h.advance(50);
    assert.ok(h.frame(),"the Prime Pack stage is up");
    await h.advance(6000);
    assert.equal(h.stored,null,"no arrival is written before the page is ready (a slow page never burns its own stage 1)");
    assert.equal(h.closes,0,"the roulette panel stays over the loading stage (Reus Gate)");
    h.fromPage({type:"cms-ig-ready"});await h.advance(50);
    assert.equal(h.closes,1,"the roulette panel goes once the page is ready");
    assert.ok(arrivedOf(h,"playerOne"),"this manager arrives once the page is ready");
    assert.equal(h.listeners.length,1,"the round listener starts after the arrival");
    h.back().click();assert.equal(await run,false);
    restore();
    ok("F1","F13-01/07: arrival and the roulette panel's close wait for cms-ig-ready");
  });
  // F2 F13-01: a fault after arriving, while the other manager has not arrived, withdraws the arrival; the dialog follows.
  // A page that never gets ready writes nothing and still closes the panel for the error dialog.
  await section("F2",async()=>{
    const h=harness(),Step=freshStep();
    const run=Step.run(ctx("playerOne"),h.io);await h.advance(50);
    h.fromPage({type:"cms-ig-ready"});await h.advance(50);
    assert.ok(arrivedOf(h,"playerOne"));
    h.listeners[0].error({code:"unavailable"});await h.advance(50);
    assert.equal(arrivedOf(h,"playerOne"),null,"a listener error withdraws this manager's arrival (the other never plays alone for 4)");
    assert.ok(h.dialog(),"the Prime Pack could not load dialog shows");
    h.dialogButton("BACK TO SHOWDOWN HOME").click();assert.equal(await run,false);
    restore();
    const h2=harness(),Step2=freshStep();
    const run2=Step2.run(ctx("playerTwo"),h2.io);await h2.advance(10_500);
    assert.equal(h2.stored,null,"a page timeout writes no arrival");
    assert.equal(h2.closes,1,"a page timeout closes the roulette panel so the error dialog is on top");
    assert.ok(h2.dialog());h2.dialogButton("BACK TO SHOWDOWN HOME").click();assert.equal(await run2,false);
    restore();
    // Both arrived: a fault never tries to withdraw (the Rules refuse it; no wasted read).
    const h3=harness(),Step3=freshStep();
    const run3=Step3.run(ctx("playerOne"),h3.io);await h3.advance(50);
    h3.fromPage({type:"cms-ig-ready"});await h3.advance(50);
    h3.stored={...h3.stored,arrived:{...h3.stored.arrived,playerTwo:ts(h3.serverNow)},revision:2};await h3.advance(50);
    const before=h3.transactions;h3.listeners[0].error({code:"unavailable"});await h3.advance(50);
    assert.equal(h3.transactions,before,"once both have arrived a fault sends no withdraw");
    assert.ok(arrivedOf(h3,"playerOne"));h3.dialogButton("BACK TO SHOWDOWN HOME").click();await run3;
    restore();
    ok("F2","F13-01: a fault withdraws a lone arrival; a page timeout writes nothing and clears the panel for the dialog");
  });
  // F3 F13-02: BACK shows while waiting for either manager. Own arrival missing while on screen: arrive again, once per 3 s.
  await section("F3",async()=>{
    const h=harness(),Step=freshStep();
    const run=Step.run(ctx("playerTwo"),h.io);await h.advance(50);
    h.fromPage({type:"cms-ig-ready"});await h.advance(300);
    assert.equal(h.back().hidden,false,"BACK shows while waiting for the other manager");
    // Daniel arrives, and a late withdraw from this phone's earlier visit lands (Nik's arrival gone while he is on screen).
    h.stored={...h.stored,arrived:{playerOne:ts(h.serverNow),playerTwo:null},revision:5};await h.advance(10);
    assert.equal(h.back().hidden,false,"BACK still shows while this manager's own arrival is missing");
    await h.advance(3000);
    assert.ok(arrivedOf(h,"playerTwo"),"the missing arrival is sent again while he is visibly on screen");
    const writes=()=>h.transactions;
    h.stored={...h.stored,arrived:{...h.stored.arrived,playerTwo:null},revision:7};const t0=writes();await h.advance(1000);
    assert.equal(writes(),t0,"no second arrival inside 3 s");
    await h.advance(2400);
    assert.ok(arrivedOf(h,"playerTwo"),"after 3 s it arrives again");
    h.back().hidden=false;h.back().click();assert.equal(await run,false);
    restore();
    ok("F3","F13-02: BACK never hides while waiting; a missing own arrival on screen is re-sent, throttled to every 3 s");
  });
  // F4 F13-03: hidden after both arrived (a locked phone), then shown: a fresh server clock is taken and the current stage
  // is sent again, so the page follows the server stage.
  await section("F4",async()=>{
    const h=harness(),Step=freshStep();
    const run=Step.run(ctx("playerOne"),h.io);await h.advance(50);
    h.fromPage({type:"cms-ig-ready"});await h.advance(50);
    h.stored={...h.stored,arrived:{...h.stored.arrived,playerTwo:ts(h.serverNow)},revision:2};
    h.tick(Guess.leadMs+Guess.stageStarts[1]+100);await h.advance(250);
    const reveals=()=>h.posts("cms-ig-reveal");
    assert.equal(reveals().at(-1).index,1,"stage 2 is on screen");
    h.setVisibility("hidden");await h.advance(50);
    h.tick(Guess.stageStarts[2]-Guess.stageStarts[1]);
    const n=reveals().length;
    h.setVisibility("visible");await h.advance(10);
    assert.equal(h.resyncs,1,"back on screen, the server clock is taken again");
    assert.ok(reveals().length>n,"the current stage is sent again at once");
    assert.equal(reveals().at(-1).index,2,"the page shows the server's stage 3");
    assert.ok(arrivedOf(h,"playerOne"),"both had arrived: hiding never withdrew");
    await Promise.race([run,h.advance(10)]);
    restore();
    ok("F4","F13-03: a phone back from hidden re-syncs the server clock and re-sends the current stage");
  });
  // F5 F13-06: the Rules take a right guess until 97 s after the later arrival; the client's time draw waits for that.
  await section("F5",async()=>{
    const L=1_900_000_000_000,start=L+Guess.leadMs,end=Guess.endsAt(start);
    const rec={v:1,season:1,arrived:{playerOne:L-4000,playerTwo:L},chipsUsed:{playerOne:0,playerTwo:1},winner:null};
    assert.equal(end-L,95000,"the stage 4 window closes 95 s after the later arrival");
    assert.equal(Guess.outcome(rec,end).state,"live","at 95 s a winner may still land: no draw yet");
    assert.equal(Guess.outcome(rec,L+97000).state,"live","the Rules still take a guess at exactly 97 s");
    assert.equal(Guess.outcome(rec,L+97001).state,"draw","past 97 s the round is a draw");
    assert.equal(Guess.applyGuess(rec,{role:"playerOne",correct:true,atMs:end}).reason,"ROUND_OVER","a guess from 95 s is still refused on the phone");
    assert.equal(Guess.outcome({...rec,chipsUsed:{playerOne:2,playerTwo:2}},start+1000).state,"draw","both out of chips is still a draw at once");
    const rules=read("firestore.season-results-production.fragment.rules");
    assert.match(rules,/request\.time <= \(a > b \? a : b\) \+ duration\.value\(97, 's'\)/,"the Rules window ends at 97 s");
    assert.equal(Guess.leadMs+Guess.roundMs+Guess.drawSlackMs,97000,"the client's draw time is the Rules' 97 s");
    ok("F5","F13-06: the time draw shows only after the Rules' 97 s guess window (no Rules change)");
  });
  // F6 F13-04: an unknown confirm time never publishes a season result without a won Prime Pack point, and never opens the
  // window past a Prime Pack that may apply: it refreshes the setup once, then TRY AGAIN.
  await section("F6",async()=>{
    const pssr=read("js/productionSharedSeasonResults.js"),fn=pssr.slice(pssr.indexOf("async function pssrWithPrimePack"),pssr.indexOf("async function pssrPublish()"));
    assert.doesNotMatch(fn,/!Number\.isFinite\(confirmedAtMs\)\|\|[^\n]*return result/,"an unknown confirm time no longer returns the result without its point");
    assert.match(fn,/if\(!Number\.isFinite\(confirmedAtMs\)\)pssrFail\("SEASON_RESULTS_PRIME_PACK_UNAVAILABLE"/,"an unknown confirm time stops the publish (TRY AGAIN)");
    assert.ok(fn.indexOf("setupApi.refresh()")<fn.indexOf('pssrFail("SEASON_RESULTS_PRIME_PACK_UNAVAILABLE","The Showdown'),"the setup is read once more first");
    // F14-02: the kill switch never drops a point already won; the round record is still read (no record is 0 points).
    assert.doesNotMatch(fn,/CMS_PRIME_PACK/,"the season results never skip the round record for the kill switch");
    assert.match(fn,/step\.applies\(gameCtx,\{ignoreSwitch:true\}\)[\s\S]*step\.pointsFor\([^\n]*gameCtx,\{ignoreSwitch:true\}\)/);
    {
      const h=harness(),Step=freshStep(),L=realNow()-200_000;
      h.stored={schemaVersion:1,objectType:"sharedPrimePackRound",rivalryId:RID,seasonNumber:1,arrived:{playerOne:ts(L-4000),playerTwo:ts(L)},chipsUsed:{playerOne:1,playerTwo:0},namedBy:"playerOne",revision:4,updatedAt:ts(L+Guess.leadMs+1000)};
      globalThis.CMS_PRIME_PACK="off";
      try{
        assert.equal(Step.applies(ctx("playerOne")),false,"the switch still keeps the screen off");
        assert.equal(await Step.pointsFor(h.io,ctx("playerOne"),{ignoreSwitch:true}),4,"a round already won keeps its 4 points with the switch on");
        h.stored=null;assert.equal(await freshStep().pointsFor(h.io,ctx("playerOne"),{ignoreSwitch:true}),0,"no round record: no point");
      }finally{delete globalThis.CMS_PRIME_PACK;restore();}
    }
    const pstc=read("js/productionSharedTransferChallenge.js"),first=pstc.slice(pstc.indexOf("async function pstcPrimePackFirst"),pstc.indexOf("async function pstcPrimePackFirst")+2600);
    assert.doesNotMatch(first,/!Number\.isFinite\(confirmedAtMs\)\|\|[^\n]*return true/,"the window never opens past an unknown confirm time");
    assert.match(first,/if\(!Number\.isFinite\(confirmedAtMs\)\)\{primePackLoadError=true;return false;\}/,"an unknown confirm time keeps the window shut with TRY AGAIN");
    assert.match(first,/resync:\(\)=>\{clockRefreshPerformanceMs=Number\.NaN;return pstcEnsureServerClock\(options\.user,request\);\}/,"the step can take a fresh server clock (F13-03)");
    ok("F6","F13-04/F14-02: an unknown confirm time fails closed; the kill switch never drops a point already won");
  });
  // F7 Sol r5 R5-01: the phone locks while its first arrival is still on its way (no round record seen yet). The arrival
  // lands while the phone is hidden: it is withdrawn, so the other manager can never start the round and win alone; back
  // on screen, this manager arrives again.
  await section("F7",async()=>{
    const h=harness(),Step=freshStep();
    const tx=h.io.sdk.runTransaction;let gate=null;
    h.io.sdk.runTransaction=(...a)=>{if(!gate){let open;gate=new Promise(r=>{open=r;});gate.open=open;return gate.then(()=>tx(...a));}return tx(...a);};
    const run=Step.run(ctx("playerOne"),h.io);await h.advance(50);
    h.fromPage({type:"cms-ig-ready"});await h.advance(50);
    assert.equal(h.stored,null,"the first arrival is still on its way");
    h.setVisibility("hidden");await h.advance(50);
    gate.open();await h.advance(500);
    assert.equal(arrivedOf(h,"playerOne"),null,"an arrival that lands while the phone is hidden is withdrawn (Nik can never play alone)");
    h.stored={...h.stored,arrived:{...h.stored.arrived,playerTwo:ts(h.serverNow)},revision:h.stored.revision+1};await h.advance(50);
    assert.equal(Guess.startMs({arrived:{playerOne:arrivedOf(h,"playerOne"),playerTwo:arrivedOf(h,"playerTwo")}}),null,"the round does not start while Daniel is away");
    h.setVisibility("visible");await h.advance(50);
    assert.ok(arrivedOf(h,"playerOne"),"back on screen, Daniel arrives again");
    h.back().hidden=false;h.back().click();await Promise.race([run,h.advance(10)]);
    restore();
    ok("F7","Sol r5 R5-01: a lock during the first arrival withdraws it once it lands; back on screen it arrives again");
  });
  if(failed){console.log(`FAIL r87 Prime Pack F13 contracts: ${failed} failed.`);process.exit(1);}
  console.log(`PASS r87 Prime Pack F13 contracts: ${checks} checks.`);
  process.exit(0);
})().catch(error=>{restore();console.error(error);process.exit(1);});

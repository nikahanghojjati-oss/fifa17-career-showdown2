"use strict";
// Phoenix B2 (r100, B1's network leg, gameplay/r100 8128c4d0, FIJ_FAULT=network seed 4181106201, spin-mark): Nik tapped I HAVE
// RELEASED HIM as a 27 s network cut began. His Prime Pack could not load, so he was back on Career Start with "Prime Pack could
// not load. Check the connection and tap again" under CONTINUE TO THE TRANSFER WAR, while Daniel waited on "Nik: Not here yet".
// Now the stop is remembered for this season, the button names the Prime Pack, and the phone tries the same path again by
// itself once each time the connection comes back (the button stays as the fallback). Nothing is read while offline.
//   R1 the timing: the load fails while offline: the stop is kept, nothing is tried or read until the connection returns
//   R2 the connection returns: one try, through the screen's own path (Career Start's button path, or the dashboard's open)
//   R3 a second online while that try runs: nothing more
//   R4 the try fails again with no network change: no further automatic try (no loop) until the next return to online
//   R5 the connection came back while the attempt was still failing (its online event found it running): one try at once
//   R6 a hidden tab keeps the return for when it is shown (one try then), and reads nothing while hidden
//   R7 a Prime Pack that loads (or a manager who chose Showdown Home) clears the stop: a later online does nothing
//   R8 another season or Showdown, an offline phone, or the Transfer War already started: nothing
//   R9 the button names the Prime Pack while it is next (Career Start and the dashboard); else the Transfer War as before
//   R10 Career Start continues by itself only with its panel up, not busy and ready, through pcstOpenTransferChallenge
//   R11 the real registrations: offline/online/visibility in the Transfer Challenge install, the retry event in Career Start's
//   The Prime Pack step's own card (iconGuessStep: "Prime Pack could not load", TRY AGAIN / BACK TO SHOWDOWN HOME):
//   R12 the round fails while offline: the card shows; the connection returns: it answers TRY AGAIN by itself, once
//   R13 the connection went and came back while the round was failing: one more try at once, no card
//   R14 no loop: a try that fails with no network change waits on the card (TRY AGAIN, BACK or the next return to online)
//   R15 a hidden tab waits until shown; a quota pause never answers by itself; a tap or the step ending removes the listener
//   R16 (Codex on #1626) a return to online during the failing round on a hidden tab is kept for when it is shown; a return
//       that went offline again before the tab was shown waits for the connection (nothing is tried offline)
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const pstc=fs.readFileSync(path.resolve(__dirname,"../../js/productionSharedTransferChallenge.js"),"utf8");
const pcst=fs.readFileSync(path.resolve(__dirname,"../../js/productionSharedCareerStart.js"),"utf8");
const igs=fs.readFileSync(path.resolve(__dirname,"../../js/iconGuessStep.js"),"utf8");
let n=0;const ok=(id,label)=>{n+=1;console.log(`ok ${id} ${label}`);};
const pick=(code,re)=>{const m=code.match(re);assert.ok(m,`missing ${re}`);return m[0];};
const src=[
  pick(pstc,/  async function pstcPrimePackFirst\(request\)\{[\s\S]*?\n  \}\n/),
  pick(pstc,/  function pstcPrimePackIsNext\(\)\{[^\n]*\}\n/),
  pick(pstc,/  function pstcPrimePackOnline\(\)\{[\s\S]*?\n  \}\n/)
].join("");
const install=pick(pstc,/function pstcInstall\(\)\{if\(installed\)return true;installed=true;if\(typeof root\.addEventListener==="function"\)\{[\s\S]*?visibilitychange",\(\)=>\{[^}]*\}\);/);

function phone({screen="careerStart",season=1,hidden=false}={}){
  const w={tries:[],timers:[],listeners:{},docListeners:{},failNext:true,netGo:null,season};
  const el=id=>({careerStart:"productionSharedCareerStartOverlay",dashboard:"dashboard"}[w.screen]===id)?{classList:{contains:c=>false}}:{classList:{contains:c=>c==="hidden"}};
  w.screen=screen;
  const ctx={
    primePackLoadError:false,primePackStopKey:"",primePackNetSeq:0,primePackOnlineHeld:false,openPromise:null,view:{managerRole:"playerTwo",state:null},
    root:{navigator:{onLine:true},document:{visibilityState:hidden?"hidden":"visible",addEventListener:(t,f)=>{w.docListeners[t]=f;}},
      setTimeout:f=>{w.timers.push(f);return w.timers.length;},addEventListener:(t,f)=>{w.listeners[t]=f;},
      dispatchEvent:e=>{w.tries.push(`event:${e.type}:${e.detail.key}`);return true;},CustomEvent:function(type,init){this.type=type;this.detail=init.detail;}},
    pstcRequestContext:()=>({rivalryId:"r1",seasonNumber:w.season,key:`r1|${w.season}`}),
    pstcField:el,
    pstcOpen:()=>{w.tries.push("dashboard:open");return Promise.resolve(true);},
    // The real body is pstcPrimePackFirstNow; here it fails (as with no network) or loads, and the network may change meanwhile.
    pstcPrimePackFirstNow:async()=>{ctx.primePackLoadError=false;if(w.netGo)w.netGo();if(w.failNext){ctx.primePackLoadError=true;return false;}return true;}
  };
  vm.runInNewContext(src+";globalThis.first=pstcPrimePackFirst;globalThis.isNext=pstcPrimePackIsNext;globalThis.online=pstcPrimePackOnline;"+
    "globalThis.installed=false;globalThis.install=function(){"+install.replace(/^function pstcInstall\(\)\{/,"")+"return true;};",ctx);
  ctx.install();
  w.ctx=ctx;
  w.goOffline=()=>{ctx.root.navigator.onLine=false;w.listeners.offline();};
  w.goOnline=()=>{ctx.root.navigator.onLine=true;w.listeners.online();};
  w.runTimers=()=>{const t=w.timers.splice(0);t.forEach(f=>f());};
  return w;
}
const request=s=>({rivalryId:"r1",seasonNumber:s,key:`r1|${s}`});

(async()=>{
  {
    const w=phone();w.goOffline();
    assert.equal(await w.ctx.first(request(1)),false);w.runTimers();
    assert.equal(w.ctx.primePackStopKey,"r1|1");assert.deepEqual(w.tries,[],"nothing tried while offline");
    assert.equal(w.ctx.online(),false,"an online check while still offline does nothing");assert.deepEqual(w.tries,[]);
    ok("R1","a Prime Pack that fails while offline keeps the stop and tries (reads) nothing until the connection returns");
    w.goOnline();assert.deepEqual(w.tries,["event:career-mode-shared-prime-pack-retry:r1|1"]);
    const d=phone({screen:"dashboard"});d.goOffline();await d.ctx.first(request(1));d.goOnline();assert.deepEqual(d.tries,["dashboard:open"]);
    const none=phone({screen:"other"});none.goOffline();await none.ctx.first(request(1));none.goOnline();assert.deepEqual(none.tries,[],"no screen of its own: nothing");
    ok("R2","the connection returns: one try, through Career Start's button path or the dashboard's open");
    w.ctx.openPromise=Promise.resolve();w.goOnline();assert.equal(w.tries.length,1);w.ctx.openPromise=null;
    ok("R3","a second online while the try runs does nothing more");
    assert.equal(await w.ctx.first(request(1)),false);w.runTimers();assert.equal(w.tries.length,1,"a failed try with no network change is not tried again by itself");
    w.goOnline();assert.equal(w.tries.length,2,"the next return to online tries once more");
    ok("R4","no loop: one try per return to online, and none after a failure with no network change");
  }
  {
    const w=phone();w.netGo=()=>{w.goOffline();w.goOnline();w.netGo=null;};
    await w.ctx.first(request(1));assert.deepEqual(w.tries,[],"its online event found the attempt still running (no stop yet)");
    w.runTimers();assert.deepEqual(w.tries,["event:career-mode-shared-prime-pack-retry:r1|1"]);
    const still=phone();still.netGo=()=>{still.goOffline();still.netGo=null;};await still.ctx.first(request(1));still.runTimers();assert.deepEqual(still.tries,[],"still offline at the failure: wait for online");
    ok("R5","the connection came back during the failing attempt: one try at once; still offline: wait");
  }
  {
    const w=phone({hidden:true});w.goOffline();await w.ctx.first(request(1));w.goOnline();assert.deepEqual(w.tries,[]);assert.equal(w.ctx.primePackOnlineHeld,true);
    w.ctx.root.document.visibilityState="visible";w.docListeners.visibilitychange();assert.equal(w.tries.length,1);
    w.docListeners.visibilitychange();assert.equal(w.tries.length,1,"once");
    ok("R6","a hidden tab keeps the return and tries once when shown");
  }
  {
    const w=phone();w.goOffline();await w.ctx.first(request(1));w.failNext=false;assert.equal(await w.ctx.first(request(1)),true);assert.equal(w.ctx.primePackStopKey,"");w.goOnline();assert.deepEqual(w.tries,[]);
    const h=phone();h.goOffline();await h.ctx.first(request(1));h.ctx.pstcPrimePackFirstNow=async()=>{h.ctx.primePackLoadError=false;return false;};await h.ctx.first(request(1));assert.equal(h.ctx.primePackStopKey,"");h.goOnline();assert.deepEqual(h.tries,[]);
    ok("R7","a Prime Pack that loads, or a manager who went to Showdown Home, clears the stop");
  }
  {
    const w=phone();w.goOffline();await w.ctx.first(request(1));w.season=2;w.goOnline();assert.deepEqual(w.tries,[],"another season");
    const t=phone();t.goOffline();await t.ctx.first(request(1));t.ctx.view.state={phase:"WINDOW_OPEN"};t.goOnline();assert.deepEqual(t.tries,[],"Transfer War started");assert.equal(t.ctx.isNext(),false);
    ok("R8","another season, or a Transfer War already started: nothing");
  }
  {
    const w=phone();assert.equal(w.ctx.isNext(),false);w.goOffline();await w.ctx.first(request(1));assert.equal(w.ctx.isNext(),true);
    assert.ok(/button\.textContent=pstcPrimePackIsNext\(\)\?"CONTINUE TO THE PRIME PACK":`START SEASON \$\{season\} TRANSFER WAR`;/.test(pstc),"dashboard");
    assert.ok(/primeNext=ready&&root\.CareerModeProductionSharedTransferChallenge\?\.primePackIsNext\?\.\(\)===true;[\s\S]{0,200}ready\?\(primeNext\?"CONTINUE TO THE PRIME PACK":"CONTINUE TO THE TRANSFER WAR"\)/.test(pcst),"Career Start");
    assert.ok(/primePackIsNext:pstcPrimePackIsNext,/.test(pstc),"exported");
    ok("R9","the button reads CONTINUE TO THE PRIME PACK while it is next, the Transfer War otherwise");
  }
  {
    const listener=pick(pcst,/root\.addEventListener\("career-mode-shared-prime-pack-retry",\(\)=>\{[^}]*\}\);/);
    for(const [hidden,busy,ready,calls] of [[false,false,true,1],[true,false,true,0],[false,true,true,0],[false,false,false,0]]){
      let opened=0,handler=null;
      vm.runInNewContext(listener,{PANEL_ID:"p",busy,pcstReady:()=>ready,pcstOpenTransferChallenge:()=>{opened+=1;return Promise.resolve(true);},root:{document:{getElementById:()=>({classList:{contains:()=>hidden}})},addEventListener:(t,f)=>{handler=f;}}});
      handler();assert.equal(opened,calls,`hidden ${hidden} busy ${busy} ready ${ready}`);
    }
    ok("R10","Career Start continues by itself only with its panel up, not busy and ready, through its own button path");
  }
  {
    assert.ok(/root\.addEventListener\("offline",\(\)=>\{primePackNetSeq\+=1;\}\);root\.addEventListener\("online",\(\)=>\{primePackNetSeq\+=1;pstcPrimePackOnline\(\);\}\);/.test(install));
    assert.ok(/visibilitychange",\(\)=>\{if\(primePackOnlineHeld&&root\.document\.visibilityState!=="hidden"\)pstcPrimePackOnline\(\);\}/.test(install));
    assert.ok(/function pcstInstall\(\)\{if\(installed\)return true;installed=true;[^\n]*?root\.addEventListener\("career-mode-shared-prime-pack-retry"/.test(pcst));
    assert.ok(/await pstcPrimePackFirst\(request\)/.test(pstc),"the window still waits on the Prime Pack");
    assert.ok(!/openTransferChallenge\s*\(/.test(pstc),"the Transfer Challenge never calls Career Start's open");
    ok("R11","offline/online/visibility registered once in install; Career Start listens for the retry");
  }
  {
    // The Prime Pack step's own loop and card, run with the real igsRunNow and igsAsk.
    const run=pick(igs,/  async function igsRunNow\(ctx,io\)\{[\s\S]*?\n  \}\n/),ask=pick(igs,/  function igsAsk\(\{heading,lines=\[\],buttons,onlineChoice=null,returned=false\}\)\{[\s\S]*?\n  \}\n/);
    const netReg=pick(igs,/  let igsNetSeq=0;\n  if\(typeof root\.addEventListener==="function"\)\{root\.addEventListener\("offline",\(\)=>\{igsNetSeq\+=1;\}\);root\.addEventListener\("online",\(\)=>\{igsNetSeq\+=1;\}\);\}\n/);
    const step=({quota=false,hidden=false}={})=>{
      const w={plays:0,results:[],listeners:{online:[],offline:[]},docListeners:{visibilitychange:[]},panels:0,removed:0,cards:[],during:null};
      const node=()=>({id:"",style:{},children:[],setAttribute(){},append(...c){this.children.push(...c);},querySelector(){return null;},addEventListener(t,f){if(t==="click")this.click=f;},remove(){w.panels-=1;}});
      const doc={visibilityState:hidden?"hidden":"visible",body:{append(o){w.panels+=1;w.cards.push(o);}},createElement:()=>node(),getElementById:id=>id==="igStepPanel"&&w.panels>0?{remove(){w.panels-=1;w.removed+=1;}}:null,
        addEventListener:(t,f)=>w.docListeners[t].push(f),removeEventListener:(t,f)=>{w.docListeners[t]=w.docListeners[t].filter(g=>g!==f);}};
      const root={navigator:{onLine:true},document:doc,addEventListener:(t,f)=>w.listeners[t].push(f),removeEventListener:(t,f)=>{w.listeners[t]=w.listeners[t].filter(g=>g!==f);},
        CareerModeFirestoreBudget:{quotaMessage:r=>quota&&r&&r.code==="quota"?"Daily limit reached.":""},CareerModeIconNames:{defaultIndex:()=>({})}};
      const ctx={root,PANEL_ID:"igStepPanel",DONE_KEY:"d",endGen:0,runGen:0,askEnd:null,wentHome:false,
        igsEnded:()=>ctx.runGen!==ctx.endGen,igsApplies:()=>true,igsEnsure:async()=>true,igsList:()=>[],igsKey:()=>"k",igsMark:()=>{},igsRound:()=>({}),igsGuess:()=>({}),
        igsDoc:()=>doc,igsEl:(t,c,x)=>{const n=node();n.label=x;return n;},igsRemove:id=>{if(id==="igStepPanel"&&w.panels>0){w.panels-=1;w.removed+=1;}},
        igsPlay:async()=>{w.plays+=1;if(w.during)w.during();const r=w.results.shift()||"continue";await null;return r;}};
      vm.runInNewContext(netReg.replace(/^  let /,"var ")+run+ask+";globalThis.runNow=igsRunNow;globalThis.ask=igsAsk;",ctx);
      w.ctx=ctx;w.root=root;
      w.offline=()=>{root.navigator.onLine=false;[...w.listeners.offline].forEach(f=>f({type:"offline"}));};
      w.online=()=>{root.navigator.onLine=true;[...w.listeners.online].forEach(f=>f({type:"online"}));};
      w.show=()=>{doc.visibilityState="visible";[...w.docListeners.visibilitychange].forEach(f=>f({type:"visibilitychange"}));};
      w.flush=async()=>{for(let i=0;i<20;i+=1)await null;};
      w.tap=async id=>{const card=w.cards[w.cards.length-1];const row=card.children[0].children.find(c=>c.children&&c.children.length&&c.children[0].click);row.children.find(b=>b.label===id).click();await w.flush();};
      return w;
    };
    const err={code:"unavailable"};
    {
      const w=step();w.offline();w.results=[err,"continue"];const done=w.ctx.runNow({},{});await w.flush();
      assert.equal(w.plays,1);assert.equal(w.panels,1,"the card shows while offline");
      w.online();await w.flush();assert.equal(w.plays,2,"the return to online tries once");assert.equal(w.panels,0,"the card is gone");
      assert.equal(await done,true);assert.equal(w.listeners.online.length,1,"only the step's own net counter is left listening");
      ok("R12","the round fails while offline: the card shows; the connection returns: TRY AGAIN by itself, once");
    }
    {
      const w=step();w.results=[err,"continue"];w.during=()=>{w.offline();w.online();w.during=null;};
      assert.equal(await w.ctx.runNow({},{}),true);assert.equal(w.plays,2);assert.equal(w.cards.length,0,"no card");
      const s=step();s.results=[err];s.during=()=>{s.offline();s.during=null;};void s.ctx.runNow({},{});await s.flush();assert.equal(s.plays,1);assert.equal(s.panels,1,"still offline at the failure: the card");
      ok("R13","the connection went and came back during the failing round: one more try at once, no card");
    }
    {
      const w=step();w.offline();w.results=[err,err,"continue"];const done=w.ctx.runNow({},{});await w.flush();
      w.online();await w.flush();assert.equal(w.plays,2);assert.equal(w.panels,1,"the second failure with no network change waits on the card");
      await w.flush();assert.equal(w.plays,2,"no loop");
      w.online();await w.flush();assert.equal(w.plays,3,"the next return to online tries once more");assert.equal(await done,true);
      const b=step();b.offline();b.results=[err];const back=b.ctx.runNow({},{});await b.flush();await b.tap("BACK TO SHOWDOWN HOME");assert.equal(await back,false);assert.equal(b.ctx.wentHome,true);
      b.online();await b.flush();assert.equal(b.plays,1,"a manager who chose Showdown Home is not taken back");
      ok("R14","no loop: one try per return to online; TRY AGAIN and BACK stay as they were");
    }
    {
      const h=step({hidden:true});h.offline();h.results=[err,"continue"];const done=h.ctx.runNow({},{});await h.flush();h.online();await h.flush();assert.equal(h.plays,1,"hidden: nothing read");
      h.show();await h.flush();assert.equal(h.plays,2,"shown: one try");assert.equal(await done,true);
      const q=step({quota:true});q.results=[{code:"quota"},"continue"];q.during=()=>{q.offline();q.online();q.during=null;};void q.ctx.runNow({},{});await q.flush();
      q.online();await q.flush();assert.equal(q.plays,1,"a quota pause waits for a tap");assert.equal(q.panels,1);
      const t=step();t.offline();t.results=[err,"continue"];const tapped=t.ctx.runNow({},{});await t.flush();await t.tap("TRY AGAIN");assert.equal(await tapped,true);assert.equal(t.listeners.online.length,1,"the tap removes the card's listener");assert.equal(t.docListeners.visibilitychange.length,0);
      const e=step();e.offline();e.results=[err];const ended=e.ctx.runNow({},{});await e.flush();e.ctx.endGen+=1;e.ctx.askEnd();assert.equal(await ended,false);assert.equal(e.listeners.online.length,1,"the step ending removes it");e.online();await e.flush();assert.equal(e.plays,1);
      ok("R15","a hidden tab waits until shown; a quota pause waits for a tap; a tap or the step ending removes the listener");
    }
    {
      const h=step({hidden:true});h.results=[err,"continue"];h.during=()=>{h.offline();h.online();h.during=null;};const done=h.ctx.runNow({},{});await h.flush();
      assert.equal(h.plays,1,"hidden: no try yet");assert.equal(h.panels,1,"the card waits");h.show();await h.flush();assert.equal(h.plays,2,"shown: the return is not lost");assert.equal(await done,true);
      const o=step({hidden:true});o.offline();o.results=[err,"continue"];const later=o.ctx.runNow({},{});await o.flush();o.online();await o.flush();o.offline();await o.flush();
      o.show();await o.flush();assert.equal(o.plays,1,"offline again when shown: nothing tried");o.online();await o.flush();assert.equal(o.plays,2,"the connection back and shown: one try");assert.equal(await later,true);
      ok("R16","a return during the failing round on a hidden tab is kept until shown; offline again before it is shown waits for the connection");
    }
  }
  console.log(`PASS r100 prime pack retry contracts (${n} checks)`);
})().catch(error=>{console.error(error);process.exit(1);});

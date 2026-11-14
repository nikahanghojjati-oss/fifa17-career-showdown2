#!/usr/bin/env node
"use strict";
// U1 (2.4.0 bug hunt, P2 unsure): right after a 3-season close, Daniel's phone showed "Rivalry statistics are unavailable
// right now." on two visits minutes apart while every other phone showed the figures. A failed answer for the Showdown that
// just finished was kept for the page: the closed-Showdown loader keeps a permanent-failure read for the page's life, and an
// entry that is not in the career index yet was answered from the older entries.
// The fix (js/rivalryLegacyV10.js + js/sparkClosedShowdownCareerLoader.js):
//   U1-1 normal case: the newest finished entry is the Showdown that just finished, one load, no wait, nothing forgotten;
//   U1-2 the just-finished Showdown is not in the index yet: asked once more after a short wait (2.5 s), then shown;
//   U1-3 it reads as unavailable: the loader forgets that read and it is asked once more; still unavailable: forgotten again,
//        so the next visit reads it afresh (never kept for the page);
//   U1-4 an older career (no just-finished Showdown) that reads unavailable is forgotten but not waited on;
//   U1-5 a hidden / test Showdown is never expected (no wait, no extra read);
//   U1-6 the loader's forgetUnavailableShowdown drops only "unavailable" reads, never a finished game (no extra reads).
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
let passed=0;const checks=[];const check=(name,fn)=>checks.push([name,fn]);
const tick=()=>new Promise(resolve=>setImmediate(resolve));

const X="riv_just_finished",OLD="riv_older";
const entry=(rivalryId,classification="completed")=>({rivalryId,classification,final:{totals:{playerOne:17,playerTwo:13},winner:"playerOne"}});
const career=(showdowns,indexStatus="ready")=>({model:{status:"ready"},careerInput:{indexStatus,showdowns}});

function harness({hidden=[],testOnly=false}={}){
  const loads=[],forgotten=[],waits=[];
  const c=vm.createContext({console,
    setTimeout(fn,ms){waits.push(ms);setImmediate(fn);return waits.length;},clearTimeout(){},
    CareerModeOnlinePlayerIdentity:{getState:()=>({status:"ready",managerId:"daniel"})},
    CareerModeSparkConnectedAccount:{getState:()=>({connected:true,accountId:"acct_daniel"})},
    CareerModePersistentNikDanielPair:{getState:()=>({status:"paired",rivalryId:null,closedRivalryId:X})},
    CareerModeSharedActiveShowdownAdapter:{buildActiveShowdownViews:()=>({careerInput:{showdowns:[entry(X)]}})},
    CareerModeSharedCareerAnalytics:{buildCareerModel:input=>({status:"ready",rivalryId:input.showdowns[0].rivalryId})},
    CareerModeCareerStartMarker:{readMarker:async()=>testOnly?{status:"none"}:{status:"ready"},hiddenRivalryIds:()=>hidden,epoch:()=>0},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"acct_daniel"}},firestore:{},firestoreSdk:{getDoc(){}}})},
    CareerModeSparkClosedShowdownCareerLoader:{
      answers:[],
      loadClosedShowdownCareer(options){loads.push(options);return Promise.resolve(this.answers.shift());},
      forgetUnavailableShowdown(id){forgotten.push(id);return true;}},
    loadRuntimeScript:async()=>{},
    CustomEvent:class{constructor(type){this.type=type;}},addEventListener(){},dispatchEvent(){return true;}
  });
  c.window=c;c.globalThis=c;c.root=c;
  vm.runInContext(read("js/rivalryLegacyV10.js"),c,{filename:"js/rivalryLegacyV10.js"});
  const RL=c.CareerModeRivalryLegacyV10,L=c.CareerModeSparkClosedShowdownCareerLoader;
  return {RL,loads,forgotten,waits,answer:(...a)=>L.answers.push(...a),
    rivalry:async expect=>{const p=RL.loadCareerModel(()=>true,expect===undefined?true:{expect});for(let i=0;i<40;i++)await tick();return p;}};
}

check("U1-1 normal case: one load, no wait, nothing forgotten",async()=>{
  const h=harness();h.answer(career([entry(OLD),entry(X)]));
  const model=await h.rivalry(X);
  assert.equal(model.status,"ready");assert.equal(model.rivalryId,X);
  assert.equal(h.loads.length,1,"no extra read");assert.deepEqual(h.waits,[]);assert.deepEqual(h.forgotten,[]);
});
check("U1-2 the just-finished Showdown not in the index yet: once more after 2.5 s, then its figures",async()=>{
  const h=harness();h.answer(career([entry(OLD)]),career([entry(OLD),entry(X)]));
  const model=await h.rivalry(X);
  assert.equal(h.loads.length,2,"asked once more");assert.deepEqual(h.waits,[2500]);
  assert.equal(model.rivalryId,X,"the Showdown that just finished, not the older one");
});
check("U1-3 read as unavailable: forgotten and asked once more; still unavailable: forgotten again, next visit reads afresh",async()=>{
  const h=harness();h.answer(career([entry(OLD),entry(X,"unavailable")]),career([entry(OLD),entry(X)]));
  const ok=await h.rivalry(X);
  assert.equal(ok.rivalryId,X);assert.deepEqual(h.forgotten,[X]);assert.equal(h.loads.length,2);
  const h2=harness();h2.answer(career([entry(X,"unavailable")]),career([entry(X,"unavailable")]),career([entry(X)]));
  const first=await h2.rivalry(X);
  assert.equal(first.status,"unavailable","still unavailable after one retry");
  assert.deepEqual(h2.forgotten,[X,X],"forgotten after each answer, never kept for the page");
  assert.equal(h2.loads.length,2,"only one retry per visit");
  const next=await h2.rivalry(X);
  assert.equal(next.rivalryId,X,"the next visit asks again and shows it");assert.equal(h2.loads.length,3);
});
check("U1-3b the index itself unavailable: asked once more, not kept",async()=>{
  const h=harness();h.answer(career([],"unavailable"),career([entry(X)]));
  const model=await h.rivalry(X);assert.equal(model.rivalryId,X);assert.equal(h.loads.length,2);
});
check("U1-4 no just-finished Showdown: an unavailable answer is forgotten, not waited on",async()=>{
  const h=harness();h.answer(career([entry(OLD,"unavailable")]));
  const model=await h.rivalry();
  assert.equal(model.status,"unavailable");assert.equal(h.loads.length,1);assert.deepEqual(h.waits,[]);assert.deepEqual(h.forgotten,[OLD]);
});
check("U1-5 a hidden or test Showdown is never expected: no wait, no extra read",async()=>{
  for(const opts of [{hidden:[X]},{testOnly:true}]){
    const h=harness(opts);h.answer(career([entry(OLD)]));
    await h.rivalry(X);assert.equal(h.loads.length,1,JSON.stringify(opts));assert.deepEqual(h.waits,[]);
  }
});
check("U1-6 the loader forgets only unavailable reads, never a finished game",async()=>{
  const L=require(path.join(ROOT,"js/sparkClosedShowdownCareerLoader.js"));
  assert.equal(typeof L.forgetUnavailableShowdown,"function");
  const src=read("js/sparkClosedShowdownCareerLoader.js");
  assert.match(src,/function cclForgetUnavailable\(rivalryId\)\{const cached=cclScope\?\.cache\.get\(rivalryId\);if\(cached&&cached\.status==="unavailable"\)\{cclScope\.cache\.delete\(rivalryId\);return true;\}return false;\}/);
  assert.equal(L.forgetUnavailableShowdown("nothing_cached"),false);
});
check("source: Rivalry Statistics passes the just-finished Showdown only when it is completed",async()=>{
  const src=read("js/rivalryLegacyV10.js");
  assert.match(src,/active\.classification==="completed"\?\{expect:active\.careerInput\?\.showdowns\?\.\[0\]\?\.rivalryId\}:true/);
  assert.match(src,/RIVALRY_RETRY_MS=2500/);
});

(async()=>{for(const [name,fn] of checks){await fn();passed+=1;console.log(`ok ${passed} ${name}`);}console.log(`PASS r91 rivalry retry contracts (${passed} checks)`);})().catch(e=>{console.error(e&&e.stack||e);process.exit(1);});

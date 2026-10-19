#!/usr/bin/env node
"use strict";
// HUNT-B10-1: independent shared-cache publications must refresh mounted online career screens.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const EVENT="career-mode-online-career-model-change";
const SCREENS=["careerStatistics","trophyRoom"];
const settle=async()=>{for(let i=0;i<20;i++)await new Promise(resolve=>setImmediate(resolve));};
function model(titles){
  const value=JSON.parse(read("tests/fixtures/data-contract-v1/multi-showdown-career.json")).career;
  value.managers.daniel.leagueTitles=titles;
  value.trophyRoom.cabinet.daniel.leagueTitles=titles;
  return value;
}
function harness(){
  const registrations=new Map(),drawn=new Map(),listeners=new Map();
  const calls={loads:0,invalidations:[],shows:[]};
  let accountId="uid-nik",managerId="nik",next=model(3);
  const ctx={console,document:{getElementById:()=>null},
    CareerModeCareerScreenSeam:require(path.join(ROOT,"js/careerScreenSeam.js")),
    CareerModeOnlinePlayerIdentity:{getState:()=>({registered:true,managerId})},
    CareerModeSparkConnectedAccount:{getState:()=>({connected:true,accountId})},
    CareerModePersistentNikDanielPair:{getState:()=>({rivalryId:"r1"})},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:accountId}},firestore:{},firestoreSdk:{doc(){},getDoc(){}}})},
    // r80 real vs test: a real account (its career-start marker, nothing hidden); career pages show nothing while it is unknown.
    CareerModeCareerStartMarker:{readMarker:async()=>({status:"ready",hiddenRivalryIds:[]}),hiddenRivalryIds:m=>m.hiddenRivalryIds.slice(),epoch:()=>0},
    CareerModeSharedActiveShowdownAdapter:{buildActiveShowdownViews:()=>({careerInput:null})},
    CareerModeSparkClosedShowdownCareerLoader:{loadClosedShowdownCareer:async options=>{
      calls.loads+=1;assert.ok(calls.loads<8,"cache events must not cause a provider reload loop");
      assert.equal(options.user.uid,accountId);return {model:next};
    }},
    CustomEvent:class{constructor(type){this.type=type;}},
    addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},
    dispatchEvent(event){for(const fn of listeners.get(event.type)||[])fn(event);return true;}};
  for(const name of ["CareerModeSharedHistoryConvergence","CareerModeSharedFinalReconciliation","CareerModeSharedTerminalClose","CareerModeSharedCareerAnalytics","CareerModeSharedClosedShowdownAdapter","CareerModeSparkCompletedShowdownReader"])ctx[name]={};
  ctx.window=ctx;
  ctx.CareerModeV10Screens={install(){return this;},register(id,def){registrations.set(id,def);},
    isMounted:id=>drawn.has(id),invalidate(id){calls.invalidations.push(id);drawn.delete(id);},hide:id=>drawn.delete(id),
    async show(id){calls.shows.push(id);const frame=registrations.get(id).frame();if(frame==null)return false;drawn.set(id,frame);return true;}};
  vm.createContext(ctx);
  ctx.loadRuntimeScript=async(key,file,ready)=>{if(!ready())vm.runInContext(read(file),ctx);assert.ok(ready(),file);};
  vm.runInContext(read("js/careerScreensV10.js"),ctx);
  return {ctx,drawn,calls,
    async mount(screen,getModel=()=>null){await ctx.CareerModeCareerScreensV10.mount(screen,getModel);await settle();},
    reset(){calls.invalidations.length=0;calls.shows.length=0;},
    emit(type=EVENT){ctx.dispatchEvent(new ctx.CustomEvent(type));},
    account(id,manager="nik"){accountId=id;managerId=manager;next=model(1);},
    async publish(value){next=value;await ctx.CareerModeRivalryLegacyV10.loadCareerModel();await settle();}
  };
}
let checks=0,failures=0;
async function check(name,run){try{await run();console.log(`ok ${++checks} ${name}`);}catch(error){failures+=1;console.error(`FAIL ${name}: ${error.stack}`);}}
(async()=>{
  for(const screen of SCREENS){
    await check(`${screen} refreshes 3 to 4 titles after an independent cache publication`,async()=>{
      const h=harness();await h.mount(screen);
      assert.equal(h.calls.loads,1);
      assert.equal(h.ctx.CareerModeCareerScreensV10.toV10Frame(h.drawn.get(screen),screen).managers.daniel.leagueTitles,3);
      h.reset();const updated=model(4),loads=h.calls.loads;
      // Real cache producer publishes the event; no mount, open, render or identity event follows.
      await h.publish(updated);
      assert.ok(h.calls.invalidations.includes(screen),`${screen}: cache publication must invalidate the mounted frame (3 -> 4)`);
      assert.ok(h.calls.shows.includes(screen));
      assert.equal(h.drawn.get(screen),updated);
      assert.equal(h.ctx.CareerModeCareerScreensV10.toV10Frame(h.drawn.get(screen),screen).managers.daniel.leagueTitles,4);
      assert.equal(h.calls.loads,loads+1,"only the independent publisher reads the provider");
    });
    await check(`${screen} ignores cache events when unmounted or using a supplied model`,async()=>{
      const h=harness();await h.mount(screen);h.drawn.clear();h.reset();const loads=h.calls.loads;
      await h.publish(model(4));
      assert.deepEqual(h.calls.invalidations,[]);assert.deepEqual(h.calls.shows,[]);assert.equal(h.calls.loads,loads+1);
      const supplied=model(2);await h.mount(screen,()=>supplied);h.reset();
      await h.publish(model(5));
      assert.deepEqual(h.calls.invalidations,[]);assert.deepEqual(h.calls.shows,[]);
      assert.equal(h.drawn.get(screen),supplied);assert.equal(h.calls.loads,loads+2);
    });
    await check(`${screen} ignores another account's cache event and still reloads on identity change`,async()=>{
      const h=harness();await h.mount(screen);const previous=h.drawn.get(screen),loads=h.calls.loads;
      h.account("uid-other");h.reset();
      assert.equal(h.ctx.CareerModeRivalryLegacyV10.cachedCareerModel(),null,"real cache rejects the previous account");
      h.emit();await settle();
      assert.deepEqual(h.calls.invalidations,[]);assert.deepEqual(h.calls.shows,[]);assert.equal(h.calls.loads,loads);
      h.emit("career-mode-online-identity-change");
      assert.notEqual(h.drawn.get(screen),previous,"identity change immediately clears the previous account's frame");
      await settle();assert.equal(h.calls.loads,loads+1);assert.ok(h.calls.invalidations.includes(screen));
      assert.equal(h.drawn.get(screen),h.ctx.CareerModeRivalryLegacyV10.cachedCareerModel());
      assert.notEqual(h.drawn.get(screen),previous,"the new account finishes with its own model");
      h.account("uid-outsider","outsider");h.reset();h.emit();await settle();
      assert.deepEqual(h.calls.invalidations,[]);assert.deepEqual(h.calls.shows,[]);assert.equal(h.calls.loads,loads+1);
    });
  }
  await check("shared refresh leaves a simultaneously mounted supplied-model screen alone",async()=>{
    const h=harness(),supplied=model(2);await h.mount("careerStatistics");await h.mount("trophyRoom",()=>supplied);h.reset();
    const loads=h.calls.loads;await h.publish(model(4));
    assert.deepEqual(h.calls.invalidations,["careerStatistics"]);assert.deepEqual(h.calls.shows,["careerStatistics"]);
    assert.equal(h.drawn.get("trophyRoom"),supplied);assert.equal(h.calls.loads,loads+1);
  });
  assert.equal(failures,0,`${failures} online career live-refresh checks failed`);
  console.log(`PASS online career live refresh contracts: ${checks} checks.`);
})().catch(error=>{console.error(error);process.exitCode=1;});

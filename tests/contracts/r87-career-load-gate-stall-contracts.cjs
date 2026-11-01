#!/usr/bin/env node
'use strict';
// r87 H4 follow-up (Fable job 7, career truth re-audit on 18802b939): the career loader never strands a screen.
//   F7-04  Career Statistics / Trophy Room: a read that stalls (no progress for 15 s) ends as UNAVAILABLE, which the connection
//          coming back retries; a long read that keeps reporting progress is never cut
//   F7-09  History: a read that fails after the pair changed loads again (never stuck on LOADING)
//   F7-10  Career Statistics: a second pair change during the B2 retry loads again and shows the career (never UNAVAILABLE)
//   F7-06  Rivalry Statistics after a close: a newer live or completion-pending Showdown never hides the newest finished one
// The real rivalryLegacyV10.js and careerScreensV10.js in a vm; only the provider, screen infrastructure and clock are faked.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const Seam=require(path.join(ROOT,'js/careerScreenSeam.js'));
const tick=()=>new Promise(resolve=>setImmediate(resolve));

function harness({legacy=false,active=null}={}){
  let pair={status:'paired',rivalryId:'pair_'+'a'.repeat(64),closedRivalryId:null};
  const loads=[],definitions=new Map(),frames=[],errors=[],timers=new Map(),listeners={},docListeners={},drawn=new Set();let now=0,nextTimer=0;
  const host={dataset:{},innerHTML:'',classList:{contains:()=>false},querySelector:()=>null,setAttribute(){}};
  const fixture=JSON.parse(read('tests/fixtures/data-contract-v1/finished-three-seasons.json')).career;
  const c=vm.createContext({console,Date:class extends Date{static now(){return now;}},
    setTimeout(fn,delay){const id=++nextTimer;timers.set(id,{fn,at:now+(delay||0)});return id;},clearTimeout:id=>timers.delete(id),
    document:{getElementById:id=>id==='legacy'?host:null,createElement(){return {style:{},addEventListener(type,fn){this[type]=fn;}};},visibilityState:'visible',addEventListener:(type,fn)=>{(docListeners[type]??=[]).push(fn);}},
    CareerModeCareerScreenSeam:Seam,CareerModeSharedCareerAnalytics:require(path.join(ROOT,'js/sharedCareerAnalytics.js')),
    CareerModeOnlinePlayerIdentity:{getState:()=>({status:'ready',registered:true,managerId:'nik'})},
    CareerModeSparkConnectedAccount:{getState:()=>({connected:true,accountId:'acct_nik'})},
    CareerModePersistentNikDanielPair:{getState:()=>pair},
    CareerModeSharedActiveShowdownAdapter:{buildActiveShowdownViews:()=>active??({careerInput:{}})},
    CareerModeProductionSharedHistoryConvergence:{getState:()=>null,isActive:()=>false},CareerModeProductionSharedShowdownSetup:{getState:()=>({sessionId:null})},
    CareerModeCareerStartMarker:{readMarker:async()=>({status:'ready',hiddenRivalryIds:[]}),hiddenRivalryIds:()=>[],epoch:()=>0},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:'acct_nik'}},firestore:{},firestoreSdk:{getDoc(){}}})},
    CareerModeSparkClosedShowdownCareerLoader:{loadClosedShowdownCareer:options=>new Promise((resolve,reject)=>loads.push({resolve,reject,options}))},
    CareerModeV10Screens:{install(){return this;},register:(id,def)=>definitions.set(id,def),isMounted:id=>drawn.has(id),invalidate(){},hide(id){drawn.delete(id);},
      expect:id=>!drawn.has(id),
      async show(id){const def=definitions.get(id);if(!def)return false;if(def.prepare)await def.prepare();const frame=def.frame();frames.push({id,frame});drawn.add(id);if(def.mount&&legacy)def.mount(frame,host);return true;}},
    ShowdownLegacyBoot(){},renderLegacy(){},loadRuntimeScript:async()=>{},fetch:async()=>({ok:true,json:async()=>({})}),
    reportApplicationError:(_context,error)=>errors.push(error),
    CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}}
  });
  c.addEventListener=(type,fn)=>{(listeners[type]??=[]).push(fn);};c.dispatchEvent=event=>{(listeners[event.type]||[]).forEach(fn=>fn(event));return true;};
  c.window=c;c.globalThis=c;
  vm.runInContext(read('js/rivalryLegacyV10.js'),c,{filename:'js/rivalryLegacyV10.js'});
  vm.runInContext(read('js/careerScreensV10.js'),c,{filename:'js/careerScreensV10.js'});
  const settle=async()=>{for(let i=0;i<40;i++)await tick();};
  async function advance(ms){const target=now+ms;await settle();for(;;){const entry=[...timers].filter(([,t])=>t.at<=target).sort((a,b)=>a[1].at-b[1].at)[0];if(!entry)break;now=entry[1].at;timers.delete(entry[0]);entry[1].fn();await settle();}now=target;await settle();}
  return {c,loads,frames,errors,advance,settle,
    pairChange(){pair=pair.rivalryId?{status:'unpaired',rivalryId:null,closedRivalryId:pair.rivalryId}:{status:'paired',rivalryId:'pair_'+'b'.repeat(64),closedRivalryId:pair.closedRivalryId};},
    online(){(listeners.online||[]).forEach(fn=>fn({}));},
    last:id=>frames.filter(f=>f.id===id).at(-1)?.frame??null,
    resolve:async(i,value)=>{loads[i].resolve(value);await settle();},
    finish:async i=>{loads[i].resolve({model:fixture,careerInput:{indexStatus:'ready',showdowns:[]}});await settle();}};
}
const checks=[];
const check=(name,run)=>checks.push([name,run]);
const Career=require(path.join(ROOT,'js/sharedCareerAnalytics.js'));
const F=require(path.join(ROOT,'tests/support/career-fixture-helpers.cjs'));
const status=frame=>frame?.status??frame?.careerScreenV10??null;

check('F7-04 Career Statistics: a read stalled for 15 s ends as UNAVAILABLE (never LOADING forever), and back online reads again',async()=>{
  for(const screen of ['careerStatistics','trophyRoom']){
    const h=harness();
    void h.c.CareerModeCareerScreensV10.mount(screen,()=>null);await h.settle();
    assert.equal(h.loads.length,1,`${screen}: one read`);
    await h.advance(20000);
    assert.equal(status(h.last(screen)),'unavailable',`${screen}: the stalled read shows UNAVAILABLE`);
    assert.ok(h.errors.some(e=>e?.code==='CAREER_SCREENS_LOAD_TIMEOUT'),`${screen}: the timeout is reported in plain words`);
    h.online();await h.settle();
    assert.equal(h.loads.length,2,`${screen}: back online reads again`);
    await h.finish(1);await h.advance(100);
    assert.equal(status(h.last(screen)),'ready',`${screen}: the career arrives`);
    // the stalled first read answering late changes nothing
    await h.finish(0);await h.advance(100);assert.equal(status(h.last(screen)),'ready');
  }
});
check('F7-04 a long read that keeps reporting progress is never cut',async()=>{
  const h=harness();
  void h.c.CareerModeCareerScreensV10.mount('careerStatistics',()=>null);await h.settle();
  for(let i=0;i<6;i++){await h.advance(10000);h.loads[0].options.onProgress?.({done:i+1,total:10});}
  assert.notEqual(status(h.last('careerStatistics')),'unavailable','60 s with progress every 10 s: still loading');
  await h.finish(0);await h.advance(100);
  assert.equal(status(h.last('careerStatistics')),'ready');
  assert.equal(h.loads.length,1);
});
check('F7-09 History: a read that fails after the pair changed loads again, never stuck on LOADING',async()=>{
  const h=harness({legacy:true});
  void h.c.CareerModeRivalryLegacyV10.mount('legacy',()=>null);await h.settle();
  assert.equal(h.loads.length,1);
  h.pairChange();h.loads[0].reject(Object.assign(new Error('unavailable'),{code:'unavailable'}));await h.settle();
  await h.advance(3000);
  assert.equal(h.loads.length,2,'History loads again under the new pair state');
  await h.finish(1);await h.advance(100);
  assert.equal(status(h.last('legacy')),'ready','History shows the career');
});
check('F7-10 Career Statistics: a second pair change during the B2 retry loads again and shows the career',async()=>{
  const h=harness();
  void h.c.CareerModeCareerScreensV10.mount('careerStatistics',()=>null);await h.settle();
  h.pairChange();await h.finish(0);
  assert.equal(h.loads.length,2,'B2: retried once under the new pair state');
  h.pairChange();await h.finish(1);await h.advance(100);
  assert.equal(h.loads.length,3,'a second change: loads again');
  await h.finish(2);await h.advance(100);
  assert.equal(status(h.last('careerStatistics')),'ready','the career shows, never UNAVAILABLE');
});

check('F7-06 Rivalry Statistics after a Showdown closes: a newer live or completion-pending one never hides the newest finished one',async()=>{
  for(const pending of ['completion-pending','active']){
    const h=harness({active:{classification:'none',rivalry:{status:'unavailable'},careerInput:{showdowns:[]}}});
    void h.c.CareerModeRivalryLegacyV10.mount('rivalryStatistics',()=>null);await h.settle();
    assert.equal(h.loads.length,1);
    const p=F.projection({seed:'7',totalSeasons:1,seasons:[[F.result({championsLeague:true}),F.result()]]});
    const done={rivalryId:p.rivalryId,classification:'completed',projection:p,final:F.finalFor(p)};
    const careerInput={indexStatus:'ready',showdowns:[done,{rivalryId:'pair_'+'9'.repeat(64),classification:pending}]};
    await h.resolve(0,{model:Career.buildCareerModel({indexStatus:'ready',showdowns:[done]}),careerInput});await h.advance(100);
    assert.equal(status(h.last('statistics')),'ready',`${pending}: the finished Showdown shows, not "No season completed yet"`);
  }
});

(async()=>{
  const failures=[];
  for(const [name,run] of checks){try{await run();console.log('ok -',name);}catch(error){failures.push(error);console.log('not ok -',name);console.error(error);}}
  if(failures.length){process.exitCode=1;console.error(`${failures.length} failing`);return;}
  console.log(`PASS r87 career load gate stall contracts: ${checks.length} checks`);
})();

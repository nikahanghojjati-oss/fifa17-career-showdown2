#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const fixture=id=>JSON.parse(read(`tests/fixtures/data-contract-v1/${id}.json`)).career;
const settle=async()=>{await new Promise(resolve=>setImmediate(resolve));};

// Run the real lazy registration, event listeners, frame conversion and renderer binding,
// replacing only screen infrastructure, provider loads, and the clock. No browser or network.
function harness(){
  let now=0,nextTimer=0,mounted=false,accountId='Daniel';
  const timers=new Map(),events=new Map(),definitions=new Map(),loads=[],frames=[],errors=[];
  const banner={children:[],appendChild(child){this.children.push(child);}};
  const host={dataset:{},innerHTML:'original',querySelector:selector=>selector==='#legacyStateBanner'?banner:null,setAttribute(){}};
  const history={phase:'HISTORY_CONVERGED'},terminal={phase:'READY'};
  const c=vm.createContext({console,Date:class extends Date{static now(){return now;}},
    setTimeout(fn,delay){const id=++nextTimer;timers.set(id,{fn,at:now+delay});return id;},clearTimeout:id=>timers.delete(id),
    document:{getElementById:id=>id==='legacy'?host:null,createElement(){return {style:{},addEventListener(type,fn){this[type]=fn;}};}},
    addEventListener:(type,fn)=>events.set(type,fn),dispatchEvent(){},CustomEvent:class{constructor(type){this.type=type;}},
    CareerModeCareerScreenSeam:require('../../js/careerScreenSeam.js'),
    CareerModeOnlinePlayerIdentity:{getState:()=>({status:'ready',registered:true,managerId:'daniel'})},
    CareerModeSparkConnectedAccount:{getState:()=>({status:'connected',connected:true,accountId})},
    CareerModePersistentNikDanielPair:{getState:()=>({rivalryId:'private-pair'})},
    CareerModeProductionSharedHistoryConvergence:{getState:()=>history},CareerModeProductionSharedTerminalClose:{getState:()=>terminal},
    CareerModeSharedActiveShowdownAdapter:{buildActiveShowdownViews:()=>({careerInput:{}})},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:accountId}},firestoreSdk:{getDoc(){}}})},
    CareerModeSparkClosedShowdownCareerLoader:{loadClosedShowdownCareer(){return new Promise((resolve,reject)=>loads.push({resolve,reject,at:now}));}},
    CareerModeV10Screens:{install(){return this;},register:(id,def)=>definitions.set(id,def),isMounted:id=>id==='legacy'&&mounted,invalidate(){},
      async show(id){if(id!=='legacy'||!mounted)return false;const def=definitions.get(id);await def.prepare();def.mount(def.frame(),host);return true;}},
    ShowdownLegacyBoot(){banner.children=[];frames.push(JSON.parse(JSON.stringify(c.LEGACY_BOOT.fixtures.frames.LIVE)));},
    renderLegacy(){return 19;},loadRuntimeScript:async()=>{},fetch:async()=>({ok:true,json:async()=>({})}),
    reportApplicationError:(_message,error)=>errors.push(error)
  });
  vm.runInContext(read('js/rivalryLegacyV10.js'),c,{filename:'js/rivalryLegacyV10.js'});
  async function advance(ms){
    const target=now+ms;await settle();
    for(;;){const entry=[...timers].filter(([,t])=>t.at<=target).sort((a,b)=>a[1].at-b[1].at)[0];if(!entry)break;
      now=entry[1].at;timers.delete(entry[0]);entry[1].fn();await settle();}
    now=target;await settle();
  }
  return {c,loads,frames,errors,banner,advance,
    mount(){mounted=true;return c.CareerModeRivalryLegacyV10.mount('legacy');},hide(){mounted=false;},
    emit(phase,type='history',extra={}){const name=type==='history'?'career-mode-shared-history-convergence-state-change':'career-mode-shared-terminal-close-state-change';Object.assign(type==='history'?history:terminal,{phase},extra);events.get(name)({detail:{phase,...extra}});},
    changeAccount(id){accountId=id;events.get('career-mode-connected-account-state-change')({detail:{status:'connected'}});},
    async finish(index,model=fixture('finished-three-seasons')){loads[index].resolve({model});await settle();}
  };
}
const tests=[];const test=(name,run)=>tests.push([name,run]);

test('20 changed state events in one second share one slow load and one trailing reload',async()=>{
  const h=harness(),first=h.mount();await settle();assert.equal(h.loads.length,1);
  for(let i=0;i<20;i++){h.emit(`PHASE_${i}`);await h.advance(50);}
  assert.equal(h.loads.length,1,'events cannot replace an in-flight load');
  await h.finish(0);await first;assert.equal(h.frames.at(-1).status,'ready','the original result must be displayed');
  await h.advance(999);assert.equal(h.loads.length,1);
  await h.advance(1);assert.equal(h.loads.length,2);assert.equal(h.loads[1].at-h.loads[0].at,2000);
  await h.finish(1);await h.advance(5000);assert.equal(h.loads.length,2,'the burst queues only one follow-up');
});
test('fast loads also coalesce a one-second burst with at least two seconds between starts',async()=>{
  const h=harness(),first=h.mount();await settle();await h.finish(0);await first;
  for(let i=0;i<20;i++){h.emit(`FAST_${i}`,i%2?'history':'terminal');await h.advance(50);}
  assert.equal(h.loads.length,1);await h.advance(1000);assert.equal(h.loads.length,2);
  await h.finish(1);await h.advance(5000);assert.equal(h.loads.length,2);
});
test('ready and partial frames stay visible during reloads, then swap in the new result',async()=>{
  for(const id of ['finished-three-seasons','partial-career']){
    const h=harness(),first=h.mount();await settle();await h.finish(0,fixture(id));await first;
    const displayed=h.frames.at(-1),start=h.frames.length;
    h.emit('CLOSED','terminal');await h.advance(2000);assert.equal(h.loads.length,2);
    assert.deepEqual(h.frames.at(-1),displayed,'last complete frame remains visible');
    assert.ok(h.frames.slice(start).every(frame=>frame.status!=='loading'));
    await h.finish(1);assert.equal(h.frames.at(-1).status,'ready');
    assert.ok(h.frames.slice(start).every(frame=>frame.status!=='loading'));
  }
});
test('an unchanged phase/status never starts or queues a load for either state source',async()=>{
  const h=harness(),first=h.mount();await settle();await h.finish(0);await first;
  for(let i=0;i<20;i++){h.emit('HISTORY_CONVERGED','history',{throughSeason:i});h.emit('READY','terminal',{terminal:false});h.changeAccount('Daniel');}
  await h.advance(4000);assert.equal(h.loads.length,1,'metadata changes alone do not reload');
  h.emit('CLOSED','terminal');await settle();assert.equal(h.loads.length,2);
  for(let i=0;i<20;i++)h.emit('CLOSED','terminal');
  await h.finish(1);await h.advance(4000);assert.equal(h.loads.length,2);
});
test('a hung load shows unavailable at 15 seconds and TRY AGAIN recovers without a late cache write',async()=>{
  const h=harness(),first=h.mount();await settle();await h.advance(14999);
  assert.equal(h.frames.at(-1).status,'loading');await h.advance(1);assert.equal(await first,false);
  assert.equal(h.frames.at(-1).status,'unavailable');assert.equal(h.errors.at(-1).message,'RIVALRY_LEGACY_LOAD_TIMEOUT');
  const retry=h.banner.children.find(child=>child.textContent==='TRY AGAIN');assert.ok(retry,'unavailable offers retry');
  await h.finish(0);assert.equal(h.c.CareerModeRivalryLegacyV10.cachedCareerModel(),null,'timed-out result cannot publish');
  assert.equal(h.frames.at(-1).status,'unavailable');
  retry.click();await settle();assert.equal(h.loads.length,2);
  await h.finish(1);assert.equal(h.frames.at(-1).status,'ready');
});
test('a rejected loader shows unavailable immediately and allows retry',async()=>{
  const h=harness(),first=h.mount();await settle();h.loads[0].reject(new Error('offline'));await first;
  assert.equal(h.frames.at(-1).status,'unavailable');assert.equal(h.errors.length,1);
  h.banner.children.find(child=>child.textContent==='TRY AGAIN').click();await settle();await h.finish(1);
  assert.equal(h.frames.at(-1).status,'ready');
});
test('context changes clear the old frame and stale loads cannot publish into the new account',async()=>{
  const h=harness(),first=h.mount();await settle();await h.finish(0);await first;
  await h.advance(2000);h.emit('CLOSED','terminal');await settle();assert.equal(h.loads.length,2);
  h.changeAccount('Other');await settle();assert.equal(h.frames.at(-1).status,'loading');
  await h.finish(1);assert.equal(h.c.CareerModeRivalryLegacyV10.cachedCareerModel(),null);
  await h.advance(2000);assert.equal(h.loads.length,3);await h.finish(2);assert.equal(h.frames.at(-1).status,'ready');
});
test('a queued event reload is discarded when Legacy is hidden',async()=>{
  const h=harness(),first=h.mount();await settle();h.emit('CLOSED','terminal');h.hide();await h.finish(0);await first;
  await h.advance(4000);assert.equal(h.loads.length,1);
});

(async()=>{
  for(const [name,run] of tests){await run();console.log('PASS '+name);}
  console.log(`PASS Legacy refresh contracts (${tests.length}/${tests.length}).`);
})().catch(error=>{console.error(error);process.exitCode=1;});

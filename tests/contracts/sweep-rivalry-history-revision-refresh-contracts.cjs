#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../..'),read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const fixture=id=>JSON.parse(read(`tests/fixtures/data-contract-v1/${id}.json`)).career;
const clone=value=>JSON.parse(JSON.stringify(value));
const EVENT='career-mode-shared-history-convergence-state-change';
const flush=()=>new Promise(resolve=>setImmediate(resolve));

async function run(screen){
  const id=screen==='legacy'?'legacy':'statistics',registrations=new Map(),drawn=new Map(),prepared=new Set(),listeners=new Map();
  const hosts=Object.fromEntries(['legacy','statistics'].map(key=>[key,{id:key,innerHTML:'original '+key,dataset:{},querySelector:()=>null,querySelectorAll:()=>[],setAttribute(){},contains:()=>false}]));
  let model=fixture('finished-three-seasons'),accountId='account-daniel',managerId='daniel',mounts=0,invalidations=0;
  let history={phase:'HISTORY_CONVERGED',throughSeason:1,acceptedRevisionKey:'revision-1'};
  const errors=[];
  const ctx={console,document:{getElementById:key=>hosts[key]??null,querySelectorAll:()=>[]},
    CareerModeCareerScreenSeam:require('../../js/careerScreenSeam.js'),
    CareerModeOnlinePlayerIdentity:{getState:()=>({registered:true,managerId})},
    CareerModeSparkConnectedAccount:{getState:()=>({connected:true,accountId})},
    CareerModePersistentNikDanielPair:{getState:()=>({rivalryId:'same-pair'})},
    CareerModeProductionSharedHistoryConvergence:{getState:()=>history},getClubCrestSvg(){},
    addEventListener(event,fn){const callbacks=listeners.get(event)??[];callbacks.push(fn);listeners.set(event,callbacks);},
    reportApplicationError(message,error){errors.push([message,error]);}};
  ctx.window=ctx;
  ctx.CareerModeV10Screens={install(){return this;},register(key,def){registrations.set(key,def);},isMounted:key=>drawn.has(key),
    invalidate(key){invalidations++;drawn.delete(key);},hide:key=>drawn.delete(key),
    async show(key){const def=registrations.get(key);if(!prepared.has(key)){await def.prepare();prepared.add(key);}
      if(key!==id)return false;const next=def.frame();if(drawn.get(key)!==next){def.mount(next,hosts[key]);drawn.set(key,next);mounts++;}return true;}};
  ctx.ShowdownRivalryStatisticsBoot=()=>{};ctx.ShowdownLegacyBoot=()=>{};
  ctx.fetch=async file=>({ok:true,json:async()=>JSON.parse(read(file))});
  ctx.loadRuntimeScript=async(key,file,ready)=>assert.ok(ready(),file+' preloaded in harness');
  vm.createContext(ctx);vm.runInContext(read('js/rivalryLegacyV10Markup.js'),ctx);
  vm.runInContext(read('js/rivalryLegacyV10.js'),ctx);
  await ctx.CareerModeRivalryLegacyV10.mount(screen,()=>model);
  const displayed=()=>clone(screen==='legacy'?ctx.LEGACY_BOOT.fixtures.frames.LIVE.showdowns[0].totals:ctx.RIVALRY_BOOT.fixtures.frames.LIVE.score);
  assert.deepEqual(displayed(),model.history.showdowns[0].totals);
  const dispatch=async(event,detail)=>{for(const fn of listeners.get(event)??[])fn({detail});await flush();assert.deepEqual(errors,[]);};
  const change=async(next,label)=>{
    const before=mounts,invalidated=invalidations;
    await dispatch(EVENT,next);
    assert.equal(mounts,before+1,screen+': '+label+' must refresh the mounted screen once');
    assert.equal(invalidations,invalidated+1,screen+': '+label+' invalidates its frame');
    assert.deepEqual(displayed(),model.history.showdowns[0].totals,screen+': displays the new totals');
    await dispatch(EVENT,{...next});
    assert.equal(mounts,before+1,screen+': identical revision must not redraw');
    assert.equal(invalidations,invalidated+1,screen+': identical revision must not invalidate');
  };
  model=fixture('tiebreak-finish');
  assert.notDeepEqual(displayed(),model.history.showdowns[0].totals,'fixtures have distinct visible totals');
  history={...history,throughSeason:2,acceptedRevisionKey:'revision-2'};
  await change(history,'new accepted Season with unchanged phase/status');
  model=fixture('finished-three-seasons');history={...history,acceptedRevisionKey:'revision-2-corrected'};
  await change(history,'new revision at the same Season');
  model=fixture('tiebreak-finish');history={...history,throughSeason:3};
  await change(history,'new Season with the same revision key');
  const beforeIdentity=mounts;
  accountId='account-nik';await dispatch('career-mode-connected-account-state-change',{connected:true,accountId});
  assert.equal(mounts,beforeIdentity+1,screen+': account change still refreshes');
  managerId='nik';await dispatch('career-mode-online-identity-change',{registered:true,managerId});
  assert.equal(mounts,beforeIdentity+2,screen+': manager change still refreshes');
  await dispatch('career-mode-online-identity-change',{registered:true,managerId});
  assert.equal(mounts,beforeIdentity+2,screen+': identical identity does not redraw');
  drawn.clear();const beforeUnmounted=mounts;history={...history,acceptedRevisionKey:'revision-unmounted'};
  await dispatch(EVENT,history);assert.equal(mounts,beforeUnmounted,screen+': unmounted screen is not refreshed');
  console.log('ok '+screen+' refreshes accepted Season/revision changes, coalesces duplicates and preserves identity guards');
}
(async()=>{await run('rivalryStatistics');await run('legacy');console.log('rivalry/history revision refresh contracts passed (2 screens)');})().catch(error=>{console.error(error);process.exitCode=1;});

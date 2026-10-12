"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const A="save_"+"a".repeat(24), B="save_"+"b".repeat(24);
const makeShowdown=(id,points)=>({identity:{saveId:id},rounds:[{roundNumber:1,seasonId:"season_"+id,points}],updatedAt:"2026-01-01T00:00:00.000Z"});
const storage={
  saveLibrary:JSON.stringify({activeSaveId:A,profiles:[],saves:[
    {saveId:A,showdown:makeShowdown(A,1)},
    {saveId:B,showdown:makeShowdown(B,2)}
  ]}),
  activeShowdown:null,legacyShowdowns:null,preferences:null
};
let releaseSwitch=null;
let holdSwitch=false;
const sandbox={console,Promise,Date,Map,Set,JSON,structuredClone,
  currentShowdown:makeShowdown(A,1)};
sandbox.globalThis=sandbox;
sandbox.CareerModeSaveLibraryFoundation={
  buildSingletonMigrationPlan:async()=>{throw new Error("not used");},
  validateSaveLibrary:library=>library&&Array.isArray(library.saves)?[]:["bad saves"],
  migrateShowdownIdentity:async probe=>{
    if(holdSwitch&&probe.identity.saveId===B){
      await new Promise(resolve=>{releaseSwitch=resolve;});
    }
    return probe;
  }
};
sandbox.CareerModeSaveLibraryPersistence={migrate:async()=>({ok:true,status:"ready"})};
sandbox.captureCareerModeRawSaveLibraryMigrationSnapshot=()=>({ok:true,raw:{...storage}});
sandbox.applyCareerModeRawStorageTransaction=(next,expected)=>{
  for(const key of Object.keys(expected)){
    if(storage[key]!==expected[key])return {ok:false,status:"stale"};
  }
  Object.assign(storage,next);
  return {ok:true};
};
sandbox.addEventListener=()=>{};
const code=fs.readFileSync(path.join(__dirname,"../../js/saveLibraryRuntime.js"),"utf8");
vm.createContext(sandbox);
vm.runInContext(code,sandbox,{filename:"saveLibraryRuntime.js"});
const api=sandbox.CareerModeSaveLibraryRuntime;

(async()=>{
  await api.activate();
  holdSwitch=true;
  const switching=api.switchActiveSave(B);
  assert.equal(typeof releaseSwitch,"function","switch must pause while preparing season identities");
  sandbox.currentShowdown.rounds[0].points=9;
  assert.equal(api.saveCurrentShowdown(),true,"a newer active save must be accepted while the switch waits");
  const afterWrite=JSON.parse(storage.saveLibrary);
  assert.equal(afterWrite.saves.find(item=>item.saveId===A).showdown.rounds[0].points,9);
  releaseSwitch();
  await assert.rejects(switching,/Save Library changed in another tab or operation/,"a switch prepared from an older snapshot must not replace a newer save");
  const afterSwitch=JSON.parse(storage.saveLibrary);
  assert.equal(afterSwitch.activeSaveId,A,"a rejected switch must not change the active career");
  assert.equal(afterSwitch.saves.find(item=>item.saveId===A).showdown.rounds[0].points,9,"the latest save must survive");
  assert.equal(api.loadActiveShowdown().rounds[0].points,9,"Continue must load the newest saved progress");
  console.log("PASS Save Library switch does not overwrite a newer save written during preparation.");
})().catch(error=>{console.error(error);process.exitCode=1;});

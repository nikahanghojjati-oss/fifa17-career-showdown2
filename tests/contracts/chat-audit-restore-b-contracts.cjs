"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const restore=fs.readFileSync(path.join(__dirname,"../../js/restore.js"),"utf8");

async function scenario(result){
  const original=JSON.stringify({schemaVersion:1,activeSaveId:null,saves:[],profiles:[]});
  const raw={activeShowdown:null,legacyShowdowns:null,preferences:null,saveLibrary:original};
  const runtime={ready:true,invalidations:0,activations:0,
    isReady(){return this.ready;},
    invalidateAuthority(){this.ready=false;this.invalidations++;},
    async activate(){this.ready=true;this.activations++;}};
  const window={
    CareerModeSaveLibraryRuntime:runtime,
    CareerModeSaveLibraryFoundation:{validateSaveLibrary:()=>[]},
    flushPendingApplicationWrites:()=>true,
    analyzeCareerModeBackupFile:async()=>({ok:true,checksum:{verified:true},migratedPayload:{
      saveLibrary:{schemaVersion:1,activeSaveId:null,saves:[],profiles:[],testRestore:true},
      activeShowdown:null,legacyShowdowns:[],preferences:null}}),
    captureCareerModeRawRestoreSnapshot:()=>({ok:true,raw:{activeShowdown:raw.activeShowdown,legacyShowdowns:raw.legacyShowdowns,preferences:raw.preferences}}),
    captureCareerModeRawSaveLibraryMigrationSnapshot:()=>({ok:true,raw:{...raw}}),
    applyCareerModeRawStorageTransaction:()=>result
  };
  const sandbox={window,console,JSON,TextEncoder,Blob};
  vm.runInNewContext(restore,sandbox,{filename:"js/restore.js"});
  const applied=await window.applyCareerModeRestore({},{
    active:"use-backup",legacy:"keep-current",preferences:"keep-current",saveLibrary:"use-backup"
  });
  return {applied,runtime};
}

(async()=>{
  const clean=await scenario({ok:false,status:"stale-precondition",failurePhase:"precondition",
    rollbackVerified:null,preconditionMismatches:["saveLibrary"]});
  assert.equal(clean.applied.status,"stale-state");
  assert.equal(clean.runtime.isReady(),true,"rejected restore must not disable the existing Save Library");
  assert.equal(clean.runtime.invalidations,0,"unchanged canonical data must keep active authority");

  const critical=await scenario({ok:false,status:"rollback-failed-critical",failurePhase:"verify",
    rollbackVerified:false});
  assert.equal(critical.runtime.isReady(),false,"unverified partial restore must invalidate runtime authority");

  const committed=await scenario({ok:true,status:"success",affectedKeys:["saveLibrary"]});
  assert.equal(committed.applied.ok,true);
  assert.equal(committed.runtime.activations,1,"committed Save Library needs reactivation");
  assert.equal(committed.runtime.isReady(),true);
  console.log("PASS restore rejected, critical and committed Save Library authority contracts");
})().catch(error=>{console.error(error);process.exitCode=1;});

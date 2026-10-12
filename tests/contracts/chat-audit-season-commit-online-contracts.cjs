"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");

const source=fs.readFileSync(path.join(__dirname,"../../js/productionSharedSeasonCommit.js"),"utf8");
const rivalryId="pair_"+"a".repeat(64);
const sessionId="session_"+"b".repeat(64);
const deviceId="device_"+"c".repeat(32);
const nodes=new Map();
const node=id=>({
  id,textContent:"",disabled:false,
  classList:{contains:()=>false,toggle:()=>false},
  setAttribute(){},
  closest(){return this;}
});
for(const id of ["seasonEntry","sharedSeasonCommitStatus","sharedSeasonCommitAction"])nodes.set(id,node(id));
const actions={parentNode:{insertBefore(){}},prepend(){}};
nodes.set("seasonReviewPanel",{querySelector:selector=>selector===".seasonReviewActions"?actions:null});
const action=nodes.get("sharedSeasonCommitAction");
let onClick=null,reads=0,commitCalls=0,ackCalls=0,signalRead,resumeRead;
const readStarted=new Promise(resolve=>{signalRead=resolve;});
const ready=()=>({
  ok:true,committed:false,ready:true,revision:0,phase:"RESULTS_READY",
  managerRole:"playerOne",coordinatorRole:"playerOne",seasonNumber:1
});
const sandbox={
  console,crypto:webcrypto,Uint8Array,Promise,
  document:{
    visibilityState:"visible",
    getElementById:id=>nodes.get(id)||null,
    addEventListener:(type,handler)=>{if(type==="click")onClick=handler;}
  },
  currentShowdown:{id:"save_one",currentRound:1,sharedJourney:{mode:"shared",rivalryId}},
  CareerModeProductionSharedShowdownSetup:{
    refresh:async()=>null,
    getState:()=>({ready:true,managerRole:"playerOne",rivalryId,sessionId,deviceId,
      setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne"}})
  },
  CareerModeProductionSharedSeasonResults:{
    refresh:async()=>null,
    getState:()=>({seasonNumber:1,rivalryId,state:{phase:"RESULTS_READY",revision:2},
      allResults:{playerOne:{},playerTwo:{}}})
  },
  CareerModeSharedShowdownCatalog:{},
  CareerModeSharedShowdownSetup:{},
  CareerModeSharedSeasonResults:{},
  CareerModeSharedSeasonCommit:{},
  CareerModeSparkSharedSeasonCommit:{
    read:async()=>{
      reads+=1;
      if(reads===2)await new Promise(resolve=>{resumeRead=resolve;signalRead();});
      return ready();
    },
    commitSeason:async()=>{commitCalls+=1;return {ok:true};},
    acknowledgeSeason:async()=>{ackCalls+=1;return {ok:true};}
  },
  CareerModeProductionFirebaseRuntime:{
    ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"manager_one"}},firestore:{},firestoreSdk:{}})
  },
  CareerModeProductionSharedJourneyConflicts:{execute:async(_options,invoke)=>invoke()}
};
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:"productionSharedSeasonCommit.js"});
const api=sandbox.CareerModeProductionSharedSeasonCommit;
const settle=async()=>{for(let i=0;i<20;i++)await new Promise(resolve=>setImmediate(resolve));};
(async()=>{
  api.install();
  await api.refresh();
  assert.equal(reads,1,"the season-one commit must be ready to tap");
  assert.equal(action.disabled,false,"the coordinator's commit must be enabled");
  assert.equal(typeof onClick,"function");
  onClick({target:action,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}});
  await readStarted;
  // While the tap's provider read is pending, the player advances to another season.
  sandbox.currentShowdown.currentRound=2;
  resumeRead();
  await settle();
  assert.equal(commitCalls,0,"an old season must not be committed after the player moves to a new season");
  assert.equal(ackCalls,0,"a stale tap must not acknowledge the old season either");
  console.log("PASS Shared Season Commit stale-season contracts: an in-flight tap cannot commit or acknowledge after changing seasons.");
})().catch(error=>{console.error(error);process.exitCode=1;});

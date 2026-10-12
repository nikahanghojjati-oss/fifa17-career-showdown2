"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");

const source=fs.readFileSync(path.join(__dirname,"../../js/productionSharedCanonicalScoring.js"),"utf8");
const currentRivalry="pair_"+"a".repeat(64),previousRivalry="pair_"+"b".repeat(64);
const calls=[];
const oldSetup={
  ready:true,rivalryId:previousRivalry,sessionId:"session_"+"c".repeat(64),
  deviceId:"device_"+"d".repeat(32),
  setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,leagueId:"league_old"}
};
const sandbox={
  console,Promise,crypto:webcrypto,
  currentShowdown:{id:"save_current",currentRound:1,sharedJourney:{mode:"shared",rivalryId:currentRivalry}},
  CareerModeProductionSharedShowdownSetup:{refresh:async()=>oldSetup,getState:()=>oldSetup},
  CareerModeProductionSharedSeasonCommit:{
    refresh:async()=>null,
    getState:()=>({committed:true,phase:"ACKNOWLEDGED",revision:3,seasonNumber:1,rivalryId:currentRivalry})
  },
  CareerModeSharedShowdownCatalog:{catalog:{league_old:Array(20).fill("club")}},
  CareerModeSparkSharedSeasonCommit:{},
  CareerModeSharedCanonicalScoring:{},
  CareerModeSparkSharedCanonicalScoring:{
    read:async options=>{calls.push(options);return {
      ok:true,authoritative:true,phase:"SCORING_RECONCILED",revision:1,
      seasonCommitRevision:3,seasonNumber:1,
      scoring:{playerOne:{total:0},playerTwo:{total:11}},winner:"playerTwo"
    };}
  },
  CareerModeProductionFirebaseRuntime:{
    ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"manager_one"}},firestore:{},firestoreSdk:{}})
  }
};
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:"productionSharedCanonicalScoring.js"});
(async()=>{
  const api=sandbox.CareerModeProductionSharedCanonicalScoring;
  // Setup may hold a previously confirmed rivalry for one poll after a failed refresh.
  // The current game's acknowledged commit must never be scored through that old Setup.
  await assert.rejects(api.refresh(),error=>error.code==="CANONICAL_SCORING_CONTEXT_STALE",
    "scoring must refuse a Setup from another rivalry");
  assert.equal(calls.length,0,"no read must be sent with the previous rivalry's account context");
  assert.equal(api.getState(),null,"the previous rivalry's total and winner must not be shown");
  console.log("PASS Shared Canonical Scoring rivalry context contracts: a held old Setup cannot supply the current rivalry's score.");
})().catch(error=>{console.error(error);process.exitCode=1;});

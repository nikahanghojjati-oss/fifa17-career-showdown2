"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const source=fs.readFileSync(path.join(__dirname,"../../js/productionSharedShowdownSetup.js"),"utf8");
const R="pair_"+"7".repeat(64),S="session_"+"6".repeat(64),D="device_"+"1".repeat(32),U="account_one";
const confirmed={phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",
  leagueId:"premier_league",clubs:{playerOne:"A",playerTwo:"B"},totalSeasons:3,
  confirmedRoles:["playerOne","playerTwo"]};

function setup({expireDuringFailedRead=false}={}){
  let expiry=Date.now()+600000,reads=0;
  const sandbox={console,Promise,setTimeout,clearTimeout};
  sandbox.globalThis=sandbox;
  sandbox.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({
    ok:true,auth:{currentUser:{uid:U}},firestore:{},firestoreSdk:{}
  })};
  sandbox.CareerModeSparkConnectedAccount={initialize:async()=>true,
    getState:()=>({connected:true,accountId:U})};
  sandbox.CareerModeSparkPrivatePairing={initialize:async()=>true,
    getState:()=>({registered:true,deviceId:D})};
  sandbox.CareerModeSparkConnectedRivalry={initialize:async()=>true,
    getState:()=>({attached:true,rivalryId:R,binding:{managerRole:"playerOne"},accountId:U,deviceId:D})};
  sandbox.CareerModeSparkRemoteJoining={getState:()=>({
    sessionState:"active",sessionId:S,expiresAtEpochMs:expiry,rivalryId:R,
    accountId:U,deviceId:D,role:"host",pendingAction:null
  })};
  sandbox.CareerModeSharedShowdownSetup={};
  sandbox.CareerModeSharedShowdownCatalog={catalog:{}};
  sandbox.CareerModeSparkSharedShowdownSetup={
    read:async()=>{
      reads++;
      if(reads===1)return {ok:true,status:"live",revision:6,state:confirmed};
      // The session expires while the provider read is in flight, after resolveContext.
      if(expireDuringFailedRead)expiry=Date.now()-1;
      return {ok:false,code:"SETUP_ACTIVE_SESSION_REQUIRED"};
    },
    mutate:async()=>({ok:false,code:"UNUSED"})
  };
  sandbox.CareerModeProductionSharedJourneyConflicts={execute:async(_intent,write)=>write()};
  vm.createContext(sandbox);
  vm.runInContext(source,sandbox,{filename:"productionSharedShowdownSetup.js"});
  return sandbox.CareerModeProductionSharedShowdownSetup;
}

(async()=>{
  const active=setup();
  await active.refresh();
  const held=await active.refresh();
  assert.equal(held.ready,true,"one failed read may retain a confirmed setup while the exact session is active");

  const expired=setup({expireDuringFailedRead:true});
  await expired.refresh();
  const denied=await expired.refresh();
  assert.equal(denied.ready,false,"an expired session must not keep the previous setup ready after a failed provider read");
  assert.equal(denied.status,"locked","the setup must lock when the session expires during the read");
  console.log("PASS Shared Setup online session-expiry read guard");
})().catch(error=>{console.error(error);process.exitCode=1;});

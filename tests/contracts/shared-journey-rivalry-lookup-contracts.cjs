"use strict";
// Regression: the real app persists currentShowdown.sharedJourney as {contractVersion:1,mode:"shared",setupPending:true}
// (js/productionSharedJourneyEntry.js) and never writes rivalryId into it. Every lazy shared-journey module must
// therefore resolve the rivalry from the CONFIRMED Shared Setup authority, never only from the marker, and must
// stay inert while setup is unconfirmed. Node only; no emulator, network or DOM.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const ROOT=path.resolve(__dirname,"../..");
const RIVALRY="pair_"+"a".repeat(64);
const SESSION="session_"+"b".repeat(64);
const DEVICE="device_"+"c".repeat(32);
const ACCOUNT="uid_daniel";
const SAVE="save_"+"d".repeat(24);
const P1="profile_"+"e".repeat(24),P2="profile_"+"f".repeat(24);
const MARKER=Object.freeze({contractVersion:1,mode:"shared",setupPending:true});
let checks=0;
const ok=label=>{checks+=1;console.log(`ok ${checks} ${label}`);};

function setupState(confirmed){
  return {status:"ready",ready:true,revision:confirmed?6:3,phase:confirmed?"SHOWDOWN_CONFIRMED":"LEAGUE_DRAWN",
    setup:{phase:confirmed?"SHOWDOWN_CONFIRMED":"LEAGUE_DRAWN",revision:confirmed?6:3,totalSeasons:3,leagueId:"premier_league",clubs:{playerOne:"A",playerTwo:"B"}},
    rivalryId:RIVALRY,sessionId:SESSION,accountId:ACCOUNT,deviceId:DEVICE,managerRole:"playerOne",remoteRole:"host"};
}
function showdown(){
  return {id:SAVE,name:"Daniel vs Nik",currentRound:1,totalRounds:3,managers:{playerOne:"Daniel",playerTwo:"Nik"},
    identity:{saveId:SAVE,managerProfileIds:{playerOne:P1,playerTwo:P2}},sharedJourney:{...MARKER}};
}
function load(file,globals){
  const source=fs.readFileSync(path.join(ROOT,file),"utf8");
  const reports=[];
  const sandbox={console:{log(){},warn(){},error(){}},setTimeout,clearTimeout,Promise,Date,JSON,Object,Array,String,Number,Boolean,Error,Symbol,Set,Map,RegExp,Math,
    reportApplicationError:(context,error)=>reports.push(`${context}: ${error&&error.code||""} ${error&&error.message||error}`),
    ensureGameplayModules:async()=>true,
    loadRuntimeScript:async key=>{throw new Error(`unexpected runtime load ${key}`);},
    crypto:{},...globals};
  sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`var currentShowdown=globalThis.__showdown;\n${source}`,sandbox,{filename:file});
  return {sandbox,reports};
}
const services={ok:true,auth:{currentUser:{uid:ACCOUNT}},firestore:{},firestoreSdk:{}};
function base(confirmed){
  return {__showdown:showdown(),
    CareerModeProductionSharedShowdownSetup:{refresh:async()=>true,getState:()=>setupState(confirmed)},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>services}};
}

async function scoring(confirmed){
  const reads=[];
  const {sandbox,reports}=load("js/productionSharedCanonicalScoring.js",{...base(confirmed),
    CareerModeProductionSharedSeasonCommit:{refresh:async()=>true,getState:()=>({committed:true,phase:"ACKNOWLEDGED",revision:3,seasonNumber:1,rivalryId:RIVALRY})},
    CareerModeSharedShowdownCatalog:{catalog:{premier_league:new Array(20).fill("club")}},
    CareerModeSparkSharedSeasonCommit:{},CareerModeSharedCanonicalScoring:{},
    CareerModeSparkSharedCanonicalScoring:{read:async options=>{reads.push(options);return {ok:true,authoritative:true,phase:"SCORING_RECONCILED",revision:1,seasonCommitRevision:3,seasonNumber:1};}}});
  const api=sandbox.CareerModeProductionSharedCanonicalScoring;
  const view=await api.refresh();
  return {view,reads,reports,api};
}
async function history(confirmed){
  const reads=[];
  const {sandbox,reports}=load("js/productionSharedHistoryConvergence.js",{...base(confirmed),
    CareerModeProductionSharedSeasonCommit:{refresh:async()=>true,getState:()=>({committed:true,phase:"ACKNOWLEDGED",revision:3,seasonNumber:1,rivalryId:RIVALRY,resultsRevision:2,resultsContentHash:"hash"})},
    CareerModeProductionSharedCanonicalScoring:{refresh:async()=>true,getState:()=>({authoritative:true,phase:"SCORING_RECONCILED",revision:1,seasonNumber:1,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:"hash"})},
    CareerModeSharedHistoryConvergence:{},CareerModeSharedShowdownCatalog:{catalog:{}},CareerModeSparkSharedSeasonCommit:{},CareerModeSharedCanonicalScoring:{},CareerModeSparkSharedCanonicalScoring:{},
    CareerModeSparkSharedHistoryConvergence:{read:async options=>{reads.push(options);return {ok:true,authoritative:true,phase:"HISTORY_CONVERGED",revision:1,throughSeason:1,rivalryId:options.rivalryId,projection:{phase:"HISTORY_CONVERGED",acceptedSeasons:1}};}}});
  const view=await sandbox.CareerModeProductionSharedHistoryConvergence.refresh();
  return {view,reads,reports};
}
async function multiSeason(confirmed){
  const reads=[];
  const {sandbox,reports}=load("js/productionSharedMultiSeasonProgression.js",{...base(confirmed),
    CareerModeProductionSharedHistoryConvergence:{refresh:async()=>null,getState:()=>null},CareerModeSharedMultiSeasonProgression:{},
    CareerModeSparkSharedMultiSeasonProgression:{read:async options=>{reads.push(options);return {ok:true,authoritative:true,runtimeRevision:"1.9.1-r13",rivalryId:options.rivalryId,phase:"SEASON_READY",state:{runtimeRevision:"1.9.1-r13",rivalryId:options.rivalryId,acceptedSeasons:1,totalSeasons:3,terminal:false}};}}});
  const api=sandbox.CareerModeProductionSharedMultiSeasonProgression;
  const view=await api.refresh();
  return {view,reads,reports,api};
}
function identityApis(){
  return {CareerModeSparkConnectedAccount:{initialize:async()=>true,getState:()=>({connected:true,accountId:ACCOUNT})},
    CareerModeSparkPrivatePairing:{initialize:async()=>true,getState:()=>({registered:true,deviceId:DEVICE})},
    CareerModeSparkConnectedRivalry:{initialize:async()=>true,getState:()=>({attached:true,rivalryId:RIVALRY,accountId:ACCOUNT,deviceId:DEVICE,binding:{managerRole:"playerOne"}})},
    CareerModeSparkRemoteJoining:{getState:()=>null}};
}
const finalView=Object.freeze({phase:"FINAL_SEASON_RECONCILED",finalSeasonReconciled:true,rivalryId:RIVALRY,acceptedSeasons:3,totalSeasons:3,winner:"playerOne",managerTotals:{playerOne:9,playerTwo:3}});
async function terminalClose(confirmed){
  const reads=[];
  const {sandbox,reports}=load("js/productionSharedTerminalClose.js",{...base(confirmed),...identityApis(),
    CareerModeSharedTerminalClose:{prepare(){},closeResult(){},verifyIntent:value=>value,sameWitness:()=>true},
    CareerModeSparkTerminalClose:{close:async()=>({ok:false}),read:async options=>{reads.push(options);return {ok:true,terminal:false};}},
    CareerModeProductionSharedFinalReconciliation:{refresh:async()=>finalView,getState:()=>finalView}});
  const api=sandbox.CareerModeProductionSharedTerminalClose;
  await api.refresh();
  return {state:api.getState(),reads,reports};
}
async function finalReconciliation(confirmed){
  const calls=[];
  const local={phase:"REMOTE_OBSERVED",canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,binding:{managerRole:"playerOne",saveId:SAVE,profileId:P1}};
  const {sandbox,reports}=load("js/productionSharedFinalReconciliation.js",{...base(confirmed),
    CareerModeSaveLibraryRuntime:{isReady:()=>true},
    CareerModeSharedFinalReconciliation:{reconcile:input=>({...finalView,rivalryId:input.multiSeason.rivalryId})},
    CareerModeProductionSharedMultiSeasonProgression:{refresh:async()=>{calls.push("multi");return {rivalryId:RIVALRY};},getState:()=>null},
    CareerModeProductionSharedHistoryConvergence:{refresh:async()=>{calls.push("history");return {rivalryId:RIVALRY};},getState:()=>null},
    CareerModeProductionSharedLocalReconciliation:{refresh:()=>local,getState:()=>local}});
  const api=sandbox.CareerModeProductionSharedFinalReconciliation;
  const view=await api.refresh();
  return {view,state:api.getState(),calls,reports};
}

(async()=>{
  // Shape guard: this contract is only meaningful while the real marker lacks rivalryId.
  const entry=fs.readFileSync(path.join(ROOT,"js/productionSharedJourneyEntry.js"),"utf8");
  assert.match(entry,/showdown\.sharedJourney=\{contractVersion:1,mode:"shared",setupPending:true\}/,"production marker shape changed; revisit this contract");
  ok("production Shared Journey marker is {contractVersion:1,mode:\"shared\",setupPending:true} without rivalryId");

  let r=await scoring(true);
  assert.equal(r.reads.length,1,`canonical scoring must read the provider from confirmed setup; reports=${JSON.stringify(r.reports)}`);
  assert.equal(r.reads[0].rivalryId,RIVALRY);assert.equal(r.reads[0].seasonNumber,1);
  assert.equal(r.view?.rivalryId,RIVALRY);assert.equal(r.api.getState()?.phase,"SCORING_RECONCILED");
  ok("canonical scoring builds its season request from confirmed Shared Setup when the marker has no rivalryId");
  r=await scoring(false);
  assert.equal(r.reads.length,0);assert.equal(r.view,null);
  ok("canonical scoring stays inert while Shared Setup is not SHOWDOWN_CONFIRMED");

  r=await history(true);
  assert.equal(r.reads.length,1,`history convergence must read the provider from confirmed setup; reports=${JSON.stringify(r.reports)}`);
  assert.equal(r.reads[0].rivalryId,RIVALRY);assert.equal(r.reads[0].throughSeason,1);
  assert.equal(r.view?.phase,"HISTORY_CONVERGED");assert.equal(r.view?.rivalryId,RIVALRY);
  ok("history convergence resolves the rivalry before its lazy dependencies load (global Shared Setup fallback)");
  r=await history(false);
  assert.equal(r.reads.length,0);assert.equal(r.view,null);
  ok("history convergence stays inert while Shared Setup is not SHOWDOWN_CONFIRMED");

  r=await multiSeason(true);
  assert.equal(r.reads.length,1,`multi-season must read the provider from confirmed setup; reports=${JSON.stringify(r.reports)}`);
  assert.equal(r.reads[0].rivalryId,RIVALRY);
  assert.equal(r.view?.rivalryId,RIVALRY);assert.equal(r.api.resolveSeason(1),1);
  ok("multi-season progression builds its request and season cursor from confirmed Shared Setup");
  r=await multiSeason(false);
  assert.equal(r.reads.length,0);assert.equal(r.view,null);
  ok("multi-season progression stays inert while Shared Setup is not SHOWDOWN_CONFIRMED");

  r=await terminalClose(true);
  assert.equal(r.reads.length,1,`terminal close must read terminal state from confirmed setup; reports=${JSON.stringify(r.reports)}`);
  assert.equal(r.reads[0].rivalryId,RIVALRY);
  assert.equal(r.state?.rivalryId,RIVALRY);assert.equal(r.state?.phase,"BLOCKED");assert.equal(r.state?.canonicalStorageMutation,false);
  ok("terminal close builds its request from confirmed Shared Setup plus identity.saveId/managerProfileIds (no session -> BLOCKED, no mutation)");
  r=await terminalClose(false);
  assert.equal(r.reads.length,0);assert.equal(r.state,null);
  ok("terminal close stays inert while Shared Setup is not SHOWDOWN_CONFIRMED");

  r=await finalReconciliation(true);
  assert.deepEqual(r.calls,["multi","history"],`final reconciliation must refresh from confirmed setup; reports=${JSON.stringify(r.reports)}`);
  assert.equal(r.view?.rivalryId,RIVALRY);assert.equal(r.state?.phase,"FINAL_SEASON_RECONCILED");
  ok("final reconciliation builds its request from confirmed Shared Setup plus identity.saveId/managerProfileIds");
  r=await finalReconciliation(false);
  assert.deepEqual(r.calls,[]);assert.equal(r.view,null);
  ok("final reconciliation stays inert while Shared Setup is not SHOWDOWN_CONFIRMED");

  // Marker rivalryId, when present, still wins and must match setup (no silent rivalry substitution).
  for(const file of ["js/productionSharedCanonicalScoring.js","js/productionSharedHistoryConvergence.js","js/productionSharedMultiSeasonProgression.js","js/productionSharedTerminalClose.js","js/productionSharedFinalReconciliation.js"]){
    const source=fs.readFileSync(path.join(ROOT,file),"utf8");
    assert.match(source,/sharedJourney\?\.rivalryId\|\|p[a-z]+ConfirmedSetupRivalry\(/,`${file} must prefer the marker rivalry and fall back only to confirmed setup`);
    assert.match(source,/setup\.phase==="SHOWDOWN_CONFIRMED"&&s\.setup\.revision===6/,`${file} fallback must require SHOWDOWN_CONFIRMED revision 6`);
  }
  ok("all five modules prefer the marker rivalry and fall back only to confirmed Shared Setup");
  console.log(`PASS shared journey rivalry lookup contracts (${checks} checks)`);
})().catch(error=>{console.error(error);process.exit(1);});

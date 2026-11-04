"use strict";
// r88: a Terminal Close refresh that meets a dropped connection must not put a red notice on the screen. The r79 two-player
// journey saw, about 1 run in 4 on CI (#1198, #1200), Nik's page log "Unable to refresh Shared Showdown Terminal Close: Error:
// Connection failed." Cause: in step P4 Nik's phone is offline for 6 s; a Terminal Close wake in that window read the rivalry,
// the SDK answered UNAVAILABLE "Connection failed." (a request with no answer), and ptcRefresh reported it at once, as a 10 s red
// notice. The other shared refreshers (Multi Season, Journey Reconnect) already hold a first transient failure.
//   O1 one dropped-connection failure is held quietly (a warning, no report, the state unchanged); the same failure again on the
//      next refresh is reported, with the SDK's own message.
//   O2 a refresh that succeeds clears the hold, so a later single drop is held again.
//   O3 while the browser says it is offline the hold lasts for every refresh; back online, the same failure is reported.
//   O4 not a blanket swallow: a failure that is not a dropped connection is reported at once.
//   O5 a held RECOVERY_PENDING close keeps its exact witness through a held failure (nothing is made up or dropped).
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const ROOT=path.resolve(__dirname,"../..");
const source=fs.readFileSync(path.join(ROOT,"js/productionSharedTerminalClose.js"),"utf8");
const protocol=require(path.join(ROOT,"js/sharedTerminalClose.js"));
const R2=`pair_${"2b".repeat(32)}`;
const R3=`pair_${"3c".repeat(32)}`;
const SESSION_R3=`session_${"3e".repeat(32)}`;
const DEVICE=`device_${"ef".repeat(16)}`;
const SAVE_R2=`save_${"a".repeat(24)}`;
const SAVE_R3=`save_${"b".repeat(24)}`;
const P1=`profile_${"1".repeat(24)}`,P2=`profile_${"2".repeat(24)}`;
const REPORT=/Reconnect this Showdown before closing it/;

function finalFor(rivalryId){
  return {schemaVersion:1,runtimeRevision:"1.9.1-r17",phase:"FINAL_SEASON_RECONCILED",rivalryId,leagueId:"premier_league",totalSeasons:1,acceptedSeasons:1,completedSeason:1,acceptedRevisionKey:"accepted",fixedClubs:{playerOne:"A",playerTwo:"B"},managerTotals:{playerOne:9,playerTwo:3},winner:"playerOne",terminal:true,finalSeasonReconciled:true,nextSeason:null,extraSeasonAllowed:false,terminalCloseRequired:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false};
}
function confirmedSetup(rivalryId){return {status:"ready",ready:true,rivalryId,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6}};}
function shell(saveId,rivalryId){return {id:saveId,identity:{saveId,managerProfileIds:{playerOne:P1,playerTwo:P2}},sharedJourney:rivalryId?{contractVersion:1,mode:"shared",rivalryId}:{contractVersion:1,mode:"shared",setupPending:true}};}
function binding(saveId){return {saveId,managerRole:"playerOne",profileId:P1};}
// Connected Rivalry as initialize() leaves it: an answered pointer store for one save (attached or not), or an outage.
const rivalryFor=(saveId,rivalryId)=>({initialized:true,status:rivalryId?"saved-link":"ready",connected:true,attached:Boolean(rivalryId),rivalryId:rivalryId||null,accountId:"uid_daniel",deviceId:DEVICE,binding:binding(saveId)});
const rivalryUnavailable=saveId=>({initialized:true,status:"unavailable",connected:false,attached:false,rivalryId:null,binding:binding(saveId)});

const pairUnpaired=closedRivalryId=>({initialized:true,busy:false,status:"unpaired",rivalryId:null,connectionState:null,closedRivalryId:closedRivalryId||null});
const pairLive=rivalryId=>({initialized:true,busy:false,status:"paired",rivalryId,connectionState:"active",closedRivalryId:null});

function boot({showdown,setup,before,after,pair=pairLive(R2),readImpl=null}){
  const page={showdown,setup,rivalry:before,afterInitialize:after,reads:[],reports:[],warns:[],navigator:undefined,final:null,remote:null,pair,pairListeners:new Set()};
  page.setPair=next=>{page.pair={...page.pair,...next};for(const listener of page.pairListeners)listener(page.pair);};
  const sandbox={
    console:{...console,warn:(...args)=>page.warns.push(args.join(" "))},setTimeout,clearTimeout,TextEncoder,Promise,Date,get navigator(){return page.navigator;},
    get currentShowdown(){return page.showdown;},
    reportApplicationError:(context,error)=>page.reports.push(`${context}: ${error&&error.message}`),
    CareerModeProductionSharedShowdownSetup:{getState:()=>page.setup},
    CareerModeSharedTerminalClose:protocol,
    CareerModeSparkTerminalClose:{read:async options=>{page.reads.push(options.rivalryId);return readImpl?readImpl(options):{ok:true,terminal:false,deleted:false,rivalryState:"active",rivalryRevision:4};},close:async()=>({ok:false,code:"unavailable"})},
    CareerModePersistentNikDanielPair:{getState:()=>page.pair,subscribe:listener=>{page.pairListeners.add(listener);return ()=>page.pairListeners.delete(listener);}},
    CareerModeProductionSharedFinalReconciliation:{getState:()=>page.final,refresh:async()=>page.final},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"uid_daniel"}},firestore:{},firestoreSdk:{}})},
    CareerModeSparkConnectedAccount:{getState:()=>({connected:true,accountId:"uid_daniel"})},
    CareerModeSparkPrivatePairing:{getState:()=>({registered:true,deviceId:DEVICE})},
    // ptcResolveContext calls initialize(): it re-reads the pointer store for the save shell now active.
    CareerModeSparkConnectedRivalry:{initialize:async()=>{if(page.afterInitialize)page.rivalry=page.afterInitialize;return page.rivalry;},getState:()=>page.rivalry},
    CareerModeSparkRemoteJoining:{getState:()=>page.remote,forgetSession(){}}
  };
  const context=vm.createContext(sandbox);
  vm.runInContext(source,context,{filename:"js/productionSharedTerminalClose.js"});
  return {page,api:context.CareerModeProductionSharedTerminalClose};
}

const DROP={ok:false,code:"unavailable",message:"Connection failed."};
const live=readImpl=>boot({showdown:shell(SAVE_R2),setup:confirmedSetup(R2),before:rivalryFor(SAVE_R2,R2),after:null,pair:pairLive(R2),readImpl});

(async()=>{
  let answer=DROP;
  const o1=live(()=>answer);
  const first=await o1.api.refresh();
  assert.deepEqual(o1.page.reports,[],"O1: one dropped connection puts no red notice on the screen");
  assert.equal(o1.page.warns.length,1,"O1: it is noted as a warning");
  assert.equal(first,null,"O1: the state is unchanged (nothing was held before, nothing is made up)");
  assert.deepEqual(o1.page.reads,[R2],"O1: the read was really tried");
  await o1.api.refresh();
  assert.equal(o1.page.reports.length,1,"O1: the same failure on the next refresh is reported");
  assert.match(o1.page.reports[0],/^Unable to refresh Shared Showdown Terminal Close: Connection failed\.$/);
  console.log("ok O1 one dropped connection is held quietly; the same failure on the next refresh is reported");

  answer=DROP;
  const o2=live(()=>answer);
  await o2.api.refresh();
  answer={ok:true,terminal:false,deleted:false,rivalryState:"active",rivalryRevision:4};
  await o2.api.refresh();
  answer=DROP;
  await o2.api.refresh();
  assert.deepEqual(o2.page.reports,[],"O2: a success between two single drops clears the hold, so neither drop is reported");
  assert.equal(o2.page.reads.length,3);
  console.log("ok O2 a successful refresh clears the hold");

  const o3=live(()=>DROP);
  o3.page.navigator={onLine:false};
  for(let i=0;i<4;i++)await o3.api.refresh();
  assert.deepEqual(o3.page.reports,[],"O3: while the browser says offline no refresh failure is reported");
  o3.page.navigator={onLine:true};
  await o3.api.refresh();
  assert.equal(o3.page.reports.length,1,"O3: back online, the same failure is reported");
  console.log("ok O3 the hold lasts while offline; back online the same failure is reported");

  const o4=live(()=>({ok:false,code:"TERMINAL_CLOSE_RIVALRY_MISMATCH",message:"The rivalry does not match."}));
  await o4.api.refresh();
  assert.equal(o4.page.reports.length,1,"O4: a failure that is not a dropped connection is reported at once");
  const denied=live(()=>({ok:false,code:"permission-denied",message:"Missing or insufficient permissions."}));
  await denied.api.refresh();
  assert.equal(denied.page.reports.length,1,"O4: a permission denial is reported at once");
  console.log("ok O4 other failures are still reported at once");

  // O5: build a RECOVERY_PENDING close (an automatic close whose answer was ambiguous), then a refresh meets a dropped connection.
  answer={ok:true,terminal:false,deleted:false,rivalryState:"active",rivalryRevision:4};
  const o5=live(()=>answer);
  o5.page.final=finalFor(R2);
  o5.page.remote={sessionState:"active",sessionId:`session_${"2e".repeat(32)}`,rivalryId:R2,accountId:"uid_daniel",deviceId:DEVICE,pendingAction:null,expiresAtEpochMs:Date.now()+3600000};
  await o5.api.refresh();
  assert.equal(o5.api.getState()?.phase,"READY","O5: the close is READY");
  await o5.api.close();
  await new Promise(resolve=>setTimeout(resolve,20));
  const pending=o5.api.getState();
  assert.equal(pending?.phase,"RECOVERY_PENDING","O5: an ambiguous close answer holds RECOVERY_PENDING");
  const witness=JSON.stringify(pending.intent);
  answer=DROP;
  const kept=await o5.api.refresh();
  assert.equal(kept?.phase,"RECOVERY_PENDING","O5: a held failure keeps RECOVERY_PENDING");
  assert.equal(JSON.stringify(o5.api.getState().intent),witness,"O5: with the exact same witness");
  assert.deepEqual(o5.page.reports.filter(r=>/Unable to refresh/.test(r)),[],"O5: and no refresh report");
  console.log("ok O5 a held RECOVERY_PENDING close keeps its exact witness through a held failure");
  console.log("r88 Terminal Close dropped-connection contracts: 5 checks passed");
})().catch(error=>{console.error(error);process.exit(1);});

"use strict";
// r80: a new Showdown started right after END SHOWDOWN on the same phone must not show a Terminal Close error. The r79
// two-player journey saw, in about 1 run in 9, Daniel's new league wheel (R3) carry the red notice "Unable to refresh Shared
// Showdown Terminal Close. Attach the exact completed Connected Rivalry before Terminal Close." Cause: Daniel's START opens a
// new save shell before R3 is attached. The shell's marker names no rivalry, so the Terminal Close request borrowed the
// rivalry of the Shared Setup still held in page memory: the ended R2's confirmed Setup. The refresh then re-read Connected
// Rivalry for the new shell, which has nothing attached yet, and reported "Attach the exact completed Connected Rivalry".
// The quiet path needs proof that the borrowed rivalry ENDED on this page (the pair let it go as closed, or this page held it
// CLOSED or DELETED), so a live Showdown that is only missing its pointer here still reports (Codex #940).
//   T1 the ended phone's exact state: END left the pair unpaired with R2 closed, START opens R3's shell (pair "starting"),
//      R2's Setup is still confirmed in memory and Connected Rivalry now answers for the new shell with nothing attached.
//      The refresh reports nothing, holds no state and makes no terminal read; it stays so once the pair names R3.
//   T2 a moment later R3 is attached to the new shell (R2's Setup still in memory): still quiet (the existing path).
//   T3 once R3's own Setup is confirmed the new Showdown's Terminal Close works on R3 (READY, R3's read only).
//   T4 not a blanket swallow: an established live Showdown whose Connected Rivalry pointer is missing on this device (a new
//      browser continuing; same save, connected, nothing attached) still reports, because its rivalry has not ended; so does an
//      outage, an ended rivalry while Connected Rivalry answers for another save, and a rivalry named by the shell's marker.
//   T5 the other phone's case: this page held R2 DELETED itself, then Nik's JOIN opens R3's shell: quiet, no read.
//   T6 a held RECOVERY_PENDING close keeps its exact witness through such a refresh.
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
const REPORT=/Attach the exact completed Connected Rivalry/;

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
  const page={showdown,setup,rivalry:before,afterInitialize:after,reads:[],reports:[],final:null,remote:null,pair,pairListeners:new Set()};
  page.setPair=next=>{page.pair={...page.pair,...next};for(const listener of page.pairListeners)listener(page.pair);};
  const sandbox={
    console,setTimeout,clearTimeout,TextEncoder,Promise,Date,
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

(async()=>{
  // T1: the ended phone, the moment Daniel's START opens R3's shell. Connected Rivalry still holds R2 (bound to R2's save)
  // until the refresh re-reads it for the new shell, which has nothing attached yet.
  const t1=boot({showdown:shell(SAVE_R3),setup:confirmedSetup(R2),before:rivalryFor(SAVE_R2,R2),after:rivalryFor(SAVE_R3,null),pair:pairUnpaired(R2)});
  t1.page.setPair({status:"starting",busy:true});
  const r1=await t1.api.refresh();
  assert.deepEqual(t1.page.reports,[],"T1: the refresh of a borrowed, ended rivalry on a new shell reports nothing (no red notice on R3's league wheel)");
  assert.equal(r1,null,"T1: the new shell holds no Terminal Close state");
  assert.equal(t1.api.getState(),null,"T1: getState() is empty for the new shell");
  assert.deepEqual(t1.page.reads,[],"T1: no terminal read is made for the ended rivalry");
  t1.page.setPair({status:"paired",busy:false,rivalryId:R3,connectionState:"pending-pair",closedRivalryId:null});
  await t1.api.refresh();
  assert.deepEqual(t1.page.reports,[],"T1: still quiet once the pair names R3 (R2's end is kept in page memory)");
  assert.deepEqual(t1.page.reads,[]);
  console.log("ok T1 a new shell that borrowed the ended Showdown's in-memory Setup refreshes quietly, with no read");

  // T2: R3 is attached to the new shell while R2's Setup is still in memory: the existing other-rivalry path stays quiet.
  t1.page.afterInitialize=rivalryFor(SAVE_R3,R3);
  await t1.api.refresh();
  assert.deepEqual(t1.page.reports,[],"T2: still quiet once R3 is attached");
  assert.deepEqual(t1.page.reads,[],"T2: still no read of R2");
  console.log("ok T2 once R3 is attached (R2's Setup still in memory) the refresh stays quiet");

  // T3: R3's own Setup is confirmed, its final season reconciled and its session active: Terminal Close works on R3.
  t1.page.setup=confirmedSetup(R3);
  t1.page.final=finalFor(R3);
  t1.page.remote={sessionState:"active",sessionId:SESSION_R3,rivalryId:R3,accountId:"uid_daniel",deviceId:DEVICE,pendingAction:null,expiresAtEpochMs:Date.now()+3600000};
  await t1.api.refresh();
  assert.equal(t1.api.getState()?.phase,"READY","T3: R3's Terminal Close is READY");
  assert.equal(t1.api.getState()?.rivalryId,R3);
  assert.deepEqual(t1.page.reads,[R3],"T3: the only terminal read is R3's");
  assert.deepEqual(t1.page.reports,[]);
  console.log("ok T3 with R3's own Setup the new Showdown's Terminal Close works on R3");

  // T4: the quiet path is exact, not a blanket swallow.
  const codex=boot({showdown:shell(SAVE_R3),setup:confirmedSetup(R3),before:rivalryFor(SAVE_R3,null),after:null,pair:pairLive(R3)});
  await codex.api.refresh();
  assert.equal(codex.page.reports.length,1,"T4: an established live Showdown whose pointer is missing on this device still reports (it has not ended)");
  assert.match(codex.page.reports[0],REPORT);
  const unprovenEnd=boot({showdown:shell(SAVE_R3),setup:confirmedSetup(R2),before:rivalryFor(SAVE_R2,R2),after:rivalryFor(SAVE_R3,null),pair:pairLive(R3)});
  await unprovenEnd.api.refresh();
  assert.equal(unprovenEnd.page.reports.length,1,"T4: a borrowed rivalry this page never saw end still reports");
  const outage=boot({showdown:shell(SAVE_R2),setup:confirmedSetup(R2),before:rivalryFor(SAVE_R2,R2),after:rivalryUnavailable(SAVE_R2)});
  await outage.api.refresh();
  assert.equal(outage.page.reports.length,1,"T4: a live Showdown whose Connected Rivalry is unavailable still reports");
  assert.match(outage.page.reports[0],REPORT);
  const otherSave=boot({showdown:shell(SAVE_R3),setup:confirmedSetup(R2),before:rivalryFor(SAVE_R2,null),after:null,pair:pairUnpaired(R2)});
  await otherSave.api.refresh();
  assert.equal(otherSave.page.reports.length,1,"T4: Connected Rivalry answering for another save is no proof about this shell: still reported");
  const marker=boot({showdown:shell(SAVE_R2,R2),setup:confirmedSetup(R2),before:rivalryFor(SAVE_R2,null),after:null});
  await marker.api.refresh();
  assert.equal(marker.page.reports.length,1,"T4: a rivalry named by the shell's own marker but not attached is still reported");
  console.log("ok T4 a live Showdown missing its pointer, an unproven end, an outage, another save's answer and the shell's own marker rivalry still report");

  // T5: Nik's phone. R2 was ended by the other phone and this page held it DELETED (its own read); the pair then let it go
  // and names R3 only. Nik's JOIN opens R3's shell with R2's Setup still in memory.
  const nik=boot({showdown:shell(SAVE_R2),setup:confirmedSetup(R2),before:rivalryFor(SAVE_R2,R2),after:null,pair:pairLive(R2),readImpl:()=>({ok:true,deleted:true,terminal:false,rivalryState:"closed",rivalryRevision:5})});
  await nik.api.refresh();
  assert.equal(nik.api.getState()?.phase,"DELETED","T5: Nik's page held R2 DELETED");
  nik.page.pair={...pairLive(R3),connectionState:"active"};
  nik.page.showdown=shell(SAVE_R3);nik.page.afterInitialize=rivalryFor(SAVE_R3,null);
  await nik.api.refresh();
  assert.deepEqual(nik.page.reports,[],"T5: R3's new shell refreshes quietly on Nik's phone too");
  assert.deepEqual(nik.page.reads,[R2],"T5: no further read of R2");
  console.log("ok T5 the other phone's new shell after a DELETED it held refreshes quietly");

  // T6: a held RECOVERY_PENDING close keeps its exact witness when such a refresh runs.
  const held=boot({showdown:shell(SAVE_R3),setup:confirmedSetup(R3),before:rivalryFor(SAVE_R3,R3),after:null,pair:pairLive(R3)});
  held.page.final=finalFor(R3);
  held.page.remote={sessionState:"active",sessionId:SESSION_R3,rivalryId:R3,accountId:"uid_daniel",deviceId:DEVICE,pendingAction:null,expiresAtEpochMs:Date.now()+3600000};
  await held.api.refresh();
  assert.equal(held.api.getState()?.phase,"READY");
  await held.api.close();
  assert.equal(held.api.getState()?.phase,"RECOVERY_PENDING","T6: an ambiguous close is held");
  const witness=JSON.stringify(held.api.getState().intent);
  held.page.afterInitialize=rivalryFor(SAVE_R3,null);
  held.page.setPair({...pairUnpaired(R3)});
  await held.api.refresh();
  assert.equal(held.api.getState()?.phase,"RECOVERY_PENDING","T6: the held close is kept");
  assert.equal(JSON.stringify(held.api.getState().intent),witness,"T6: with its exact witness");
  assert.deepEqual(held.page.reports,[]);
  console.log("ok T6 a held RECOVERY_PENDING close keeps its exact witness");

  console.log("PASS r80 Terminal Close new-shell contracts: 6 checks");
})().catch(error=>{console.error(error);process.exitCode=1;});

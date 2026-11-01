"use strict";
// r80: the Shared Setup held in page memory belongs to the save it was read for. The release lane's r79 two-player journey saw
// Nik's brand-new 3-season Showdown (R3) read "Season 2 / 3" at its Transfer Challenge after Daniel ended R2 mid-season 2.
// Cause: after END, START / JOIN opens a new save shell before anything re-reads the Shared Setup, so the page still holds the
// ended R2's confirmed Setup. Every shared module that takes the rivalry from that Setup while the shell's marker names none
// (Multi Season, Season Results, Transfer Challenge, Season Commit, History, Scoring, Final, Terminal Close) ran the new shell on
// R2: a resume (an ACTIVE session continuing into the Showdown) read R2's one accepted season and moved the new shell's season
// cursor to 2, and the header kept "Season 2 / 3" after R3's own Setup was confirmed. Keying the cursor by save shell (#938) did
// not stop R2's authority being read under the new shell's key. The Setup now reads as locked for any other save.
//   N1 the live R2 (save A) reads its confirmed Setup and Season 2 / 3.
//   N2 after END a new shell (save B) is opened and resumes (session ACTIVE, the Setup refresh still answering for save A): no
//      read of R2 under the new shell, the cursor stays at season 1, the header reads Season 1 / 3 and the dashboard is never
//      decorated with R2.
//   N3 the Setup held for save A reads as locked for the new shell (no rivalry, not ready), so every borrower gets no rivalry;
//      the same save in a new object or a shell without a save id still reads R2's (checked in N1).
//   N4 (Codex P1 on #944) after the switch nothing announces, renders or writes save A's Setup: a refresh that still answers
//      for save A notifies subscribers and renders the panel only with the locked start state, and a write bound to save A is
//      refused before the provider is touched, including when END / JOIN switches the shell during the conflict preflight.
//   N5 once save B's own Setup (R3) is confirmed it is read and used: Season 1 / 3 from R3's authority.
//   N7 (the release lane's failure: Nik's side) Nik's JOIN reuses the ended Showdown's own save shell (it never left
//      setupPending). After END the page still holds R2's confirmed Setup and R2's season-2 cursor for that same save and
//      shell; once Daniel's START makes the pair name R3, the header reads Season 1 / 3 (it read "Season 2 / 3"), nothing
//      borrows R2 and a resume never reads it; R3's own Setup on that same save is then read and used.
//   N6 every shared module that borrows the Setup's rivalry reads it through getState() (so N2 covers all of them).
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");
const {FakeNode}=require("../support/fake-dom.cjs");

const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const R2=`pair_${"2b".repeat(32)}`,R3=`pair_${"3c".repeat(32)}`;
const SESSION_R2=`session_${"2d".repeat(32)}`,SESSION_R3=`session_${"3e".repeat(32)}`;
const DEVICE=`device_${"ef".repeat(16)}`,UID="uid_nik";
const SAVE_A=`save_${"a".repeat(24)}`,SAVE_B=`save_${"b".repeat(24)}`,PROFILE=`profile_${"c".repeat(24)}`;

function slice(source,start,end,label){
  const from=source.indexOf(start),to=source.indexOf(end,from);
  assert.ok(from>=0&&to>from,`${label} is present in the shipped source`);
  return source.slice(from,to);
}
const getShowdownSeasonSource=slice(read("js/showdownUI.js"),"window.getShowdownSeason = ","\n","js/showdownUI.js getShowdownSeason");
const menuMetaSource=slice(read("js/menuExperience.js"),"function isPairClosedSave(","function ensureMarcoReusTreatment(","js/menuExperience.js getSavedShowdownMenuMeta");

function shell(id,saveId){
  return {id,name:"Daniel vs Nik",managers:{playerOne:"Daniel",playerTwo:"Nik"},totalRounds:3,currentRound:1,status:"Created",rounds:[],identity:saveId?{schemaVersion:1,saveId}:undefined,sharedJourney:{contractVersion:1,mode:"shared",setupPending:true}};
}

function boot(){
  const accepted={[R2]:1,[R3]:0};
  // What Connected Rivalry / Remote Joining answer for this page (the binding is the save the rivalry is attached to).
  const env={rivalryId:R2,sessionId:SESSION_R2,saveId:SAVE_A};
  const reads=[];
  const confirmed={phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",leagueId:"premier_league",clubs:{playerOne:"Club A",playerTwo:"Club B"},totalSeasons:3,confirmedRoles:["playerOne","playerTwo"]};
  const sandbox={console,crypto:webcrypto,setTimeout,clearTimeout,Promise,Date,Number,String,Object,Array,Boolean,
    currentShowdown:shell(1700000000001,SAVE_A),
    CustomEvent:class{constructor(type,init){this.type=type;this.detail=init&&init.detail;}},
    dispatchEvent:()=>true,addEventListener(){},
    ensureGameplayModules:async()=>true
  };
  sandbox.globalThis=sandbox;sandbox.window=sandbox;
  sandbox.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:UID}},firestore:{},firestoreSdk:{}})};
  sandbox.CareerModeSparkConnectedAccount={initialize:async()=>true,getState:()=>({connected:true,accountId:UID})};
  sandbox.CareerModeSparkPrivatePairing={initialize:async()=>true,getState:()=>({registered:true,deviceId:DEVICE})};
  sandbox.CareerModeSparkConnectedRivalry={initialize:async()=>true,getState:()=>({connected:true,attached:true,rivalryId:env.rivalryId,binding:{saveId:env.saveId,profileId:PROFILE,managerRole:"playerTwo"},accountId:UID,deviceId:DEVICE})};
  sandbox.CareerModeSparkRemoteJoining={getState:()=>({sessionState:"active",sessionId:env.sessionId,expiresAtEpochMs:Date.now()+3_600_000,rivalryId:env.rivalryId,accountId:UID,deviceId:DEVICE,role:"peer",pendingAction:null})};
  sandbox.CareerModeSharedShowdownSetup={};sandbox.CareerModeSharedShowdownCatalog={catalog:{}};
  const writes=[];
  sandbox.CareerModeSparkSharedShowdownSetup={read:async options=>({ok:true,status:"ready",revision:6,state:{...confirmed,rivalryId:options.rivalryId}}),mutate:async options=>{writes.push(options.rivalryId);return {ok:false,code:"UNUSED"};}};
  // The conflict guard awaits its own preflight (WebCrypto digests) before it calls the write; env.preflight runs in that gap.
  sandbox.CareerModeProductionSharedJourneyConflicts={execute:async(_intent,write)=>{if(env.preflight)await env.preflight();return write();}};
  sandbox.CareerModeProductionSharedHistoryConvergence={refresh:async()=>null,getState:()=>null};
  sandbox.CareerModeSharedMultiSeasonProgression={};
  sandbox.CareerModeSparkSharedMultiSeasonProgression={read:async options=>{
    reads.push({rivalryId:options.rivalryId,shell:sandbox.currentShowdown?.identity?.saveId||null});
    const n=accepted[options.rivalryId];
    return {ok:true,authoritative:true,runtimeRevision:"1.9.1-r13",rivalryId:options.rivalryId,phase:"SEASON_READY",state:{runtimeRevision:"1.9.1-r13",rivalryId:options.rivalryId,acceptedSeasons:n,totalSeasons:3,terminal:false},dashboard:{acceptedSeasons:n,managerTotals:{playerOne:n?9:0,playerTwo:n?3:0},lastSeason:n?{seasonNumber:n,winner:"playerOne",playerOne:{score:9,leaguePosition:1},playerTwo:{score:3,leaguePosition:2}}:null}};
  }};
  const page={pair:{initialized:true,busy:false,status:"paired",rivalryId:R2,connectionState:"active",closedRivalryId:null,closedProviderSaveId:null}};
  sandbox.CareerModePersistentNikDanielPair={getState:()=>page.pair};
  sandbox.CareerModeSaveLibraryRuntime={getLibrarySnapshot:()=>({activeSaveId:sandbox.currentShowdown?.identity?.saveId||null})};
  vm.createContext(sandbox);
  vm.runInContext(read("js/productionSharedShowdownSetup.js"),sandbox,{filename:"js/productionSharedShowdownSetup.js"});
  vm.runInContext(read("js/productionSharedMultiSeasonProgression.js"),sandbox,{filename:"js/productionSharedMultiSeasonProgression.js"});
  vm.runInContext(getShowdownSeasonSource,sandbox,{filename:"js/showdownUI.js"});
  vm.runInContext(menuMetaSource,sandbox,{filename:"js/menuExperience.js"});
  const setup=sandbox.CareerModeProductionSharedShowdownSetup,multi=sandbox.CareerModeProductionSharedMultiSeasonProgression;
  assert.ok(setup&&typeof setup.getState==="function"&&multi&&typeof multi.resumeFromAuthority==="function","the Shared Setup and Multi Season modules load in the sandbox");
  return {setup,multi,sandbox,env,page,reads,writes,indicator:()=>sandbox.getSavedShowdownMenuMeta().indicator};
}

(async()=>{
  const t=boot();
  // N1: R2 is live on save A, one season of three accepted.
  const live=await t.setup.refresh();
  assert.equal(live.ready,true,"N1 R2's Setup is confirmed");
  assert.equal(t.setup.getState().rivalryId,R2,"N1 the live R2 reads its own Setup");
  const resumed=await t.multi.resumeFromAuthority();
  assert.equal(resumed&&resumed.season,2,"N1 R2 resumes on season 2");
  assert.equal(t.indicator(),"Season 2 / 3","N1 the live R2 reads Season 2 / 3");
  const liveShell=t.sandbox.currentShowdown;
  t.sandbox.currentShowdown=JSON.parse(JSON.stringify(liveShell));
  assert.equal(t.setup.getState().rivalryId,R2,"N1 the same save in a new object (the Save Library swaps it) still reads its Setup");
  t.sandbox.currentShowdown=shell(1700000000003,null);
  assert.equal(t.setup.getState().rivalryId,R2,"N1 a shell without a save id is not judged (unchanged)");
  t.sandbox.currentShowdown=liveShell;
  console.log("ok N1 the live R2 reads its confirmed Setup and Season 2 / 3");

  // N2: Daniel ends R2; Nik's JOIN opens a new shell (save B) before anything re-reads the Setup on this page, and the ACTIVE
  // session continues Nik into the Showdown (js/productionSharedJourneyEntry.js resumeAcceptedSeason) while
  // the Setup refresh still answers for the ended save (Connected Rivalry not yet moved to the new save).
  const readsBefore=t.reads.length;
  t.sandbox.currentShowdown=shell(1700000000002,SAVE_B);
  t.page.pair={initialized:true,busy:false,status:"paired",rivalryId:R3,connectionState:"active",closedRivalryId:R2,closedProviderSaveId:SAVE_A};
  const again=await t.multi.resumeFromAuthority();
  assert.equal(again,null,"N2 the new shell does not resume the ended Showdown");
  assert.deepEqual(t.reads.slice(readsBefore),[],`N2 no progression read of the ended R2 under the new shell: ${JSON.stringify(t.reads.slice(readsBefore))}`);
  assert.equal(t.multi.resolveSeason(1),1,"N2 every shared consumer resolves season 1 for the new shell");
  // r87 C-08: the pair is active and this page has not read the new Showdown's own shared state yet, so the header names no
  // season ("3-Season Showdown"), and never the ended one's season.
  assert.equal(t.indicator(),"3-Season Showdown",`N2 the new Showdown never reads the ended one's season (got "${t.indicator()}")`);
  assert.equal(t.multi.decorateDashboard(),false,"N2 the dashboard is never decorated with the ended R2");
  console.log("ok N2 a resume on the new shell never reads the ended R2 (header: 3-Season Showdown)");

  // N3: the Setup held for save A, read for the new shell.
  const other=t.setup.getState();
  assert.equal(other.ready,false,"N3 the Setup read for save A is not ready for the new shell (save B)");
  assert.equal(other.rivalryId,null,`N3 the new shell borrows no rivalry from the ended Showdown's Setup (got ${other.rivalryId})`);
  assert.equal(other.setup,null,"N3 the ended Showdown's league and clubs are not offered to the new shell");
  console.log("ok N3 after END the new shell reads the ended Showdown's Setup as locked");

  // N4: the Setup panel is open on this page and a refresh still answers for save A (Connected Rivalry not yet moved).
  const body=new FakeNode("div"),overlay={querySelector:selector=>selector===".remoteJoiningBody"?body:null,classList:{add(){},remove(){}}};
  t.sandbox.document={getElementById:id=>id==="productionSharedSetupOverlay"?overlay:null,createElement:tag=>new FakeNode(tag)};
  const seen=[];const unsubscribe=t.setup.subscribe(next=>seen.push({ready:next.ready,rivalryId:next.rivalryId,setup:next.setup,body:body.textContent}));
  await t.setup.refresh();
  assert.ok(seen.length>0,"N4 the refresh notified its subscribers");
  assert.deepEqual(seen.filter(next=>next.ready||next.rivalryId||next.setup),[],`N4 no subscriber is handed save A's Setup after the switch: ${JSON.stringify(seen.map(next=>next.rivalryId))}`);
  assert.match(body.textContent,/LOCKED/,"N4 the Setup panel renders the locked start state, not save A's controls");
  assert.equal(t.setup.getState().rivalryId,null,"N4 the refresh for save A leaves nothing for save B to borrow");
  const write=await t.setup.mutate("confirm");
  assert.equal(write.ok,false,"N4 a write bound to save A is refused on save B");
  assert.equal(write.code,"SHARED_SETUP_AUTHORITY_MISMATCH",`N4 the refusal names the authority mismatch (got ${write.code})`);
  assert.deepEqual(t.writes,[],"N4 the provider is never asked to write save A's Setup from save B");
  assert.deepEqual(seen.filter(next=>next.ready||next.rivalryId||next.setup),[],"N4 the refused write announced nothing of save A");
  // Codex P2 on #944: a write that starts on save A, where END (or JOIN) switches the shell to save B during the conflict
  // guard's preflight, never reaches the provider.
  const pairOnB=t.page.pair;
  t.sandbox.currentShowdown=shell(1700000000001,SAVE_A);
  t.page.pair={initialized:true,busy:false,status:"paired",rivalryId:R2,connectionState:"active",closedRivalryId:null,closedProviderSaveId:null};
  t.env.preflight=async()=>{t.sandbox.currentShowdown=shell(1700000000002,SAVE_B);t.page.pair=pairOnB;};
  const seenBeforeRace=seen.length;
  const raced=await t.setup.mutate("confirm");
  t.env.preflight=null;
  assert.equal(t.sandbox.currentShowdown.identity.saveId,SAVE_B,"N4 precondition: the shell switched to save B during the preflight");
  assert.equal(raced.ok,false,"N4 a write whose shell switched during the conflict preflight is refused");
  assert.equal(raced.code,"SHARED_SETUP_AUTHORITY_MISMATCH",`N4 the late refusal names the authority mismatch (got ${raced.code})`);
  assert.deepEqual(t.writes,[],`N4 the provider is never called for save A once the shell is save B: ${JSON.stringify(t.writes)}`);
  const afterRace=seen.slice(seenBeforeRace).at(-1);
  assert.ok(afterRace&&!afterRace.ready&&!afterRace.rivalryId&&!afterRace.setup,`N4 what the refused write announced after the switch is not save A's Setup: ${JSON.stringify(afterRace&&afterRace.rivalryId)}`);
  assert.equal(t.setup.getState().rivalryId,null,"N4 after the race save B still borrows nothing");
  unsubscribe();delete t.sandbox.document;
  console.log("ok N4 after the switch no subscriber, panel or write ever sees save A's Setup");

  // N5: R3 is attached to save B and both players confirmed its Setup.
  Object.assign(t.env,{rivalryId:R3,sessionId:SESSION_R3,saveId:SAVE_B});
  await t.setup.refresh();
  assert.equal(t.setup.getState().ready,true,"N5 R3's own Setup is confirmed for save B");
  assert.equal(t.setup.getState().rivalryId,R3,"N5 the new shell reads R3's Setup");
  const r3=await t.multi.resumeFromAuthority();
  assert.equal(r3&&r3.season,1,"N5 R3 with no accepted season resumes on season 1");
  assert.equal(r3&&r3.acceptedSeasons,0,"N5 R3 has no accepted season (Career Start is next, not the dashboard)");
  assert.equal(t.reads[t.reads.length-1]?.rivalryId,R3,"N5 the progression read is R3's");
  assert.equal(t.multi.resolveSeason(1),1,"N5 R3 is on season 1");
  assert.equal(t.indicator(),"Season 1 / 3","N5 the header reads Season 1 / 3");
  console.log("ok N5 R3's own Setup is read and used: Season 1 / 3");

  // N6: the borrowers all take the Setup through getState(), so N2 holds for each of them.
  for(const file of ["productionSharedMultiSeasonProgression","productionSharedSeasonResults","productionSharedTransferChallenge","productionSharedSeasonCommit","productionSharedHistoryConvergence","productionSharedCanonicalScoring","productionSharedFinalReconciliation","productionSharedTerminalClose"]){
    const source=read(`js/${file}.js`);
    assert.match(source,/sharedJourney\??\.rivalryId\|\|/,`N6 ${file} borrows the Setup's rivalry when the marker names none`);
    assert.match(source,/(setupApi\|\|root\.CareerModeProductionSharedShowdownSetup\)\?\.getState\?\.\(\)|setupApi\?\.getState\?\.\(\)|root\.CareerModeProductionSharedShowdownSetup\?\.getState\?\.\(\))/,`N6 ${file} reads the Setup through getState()`);
    assert.doesNotMatch(source,/CareerModeProductionSharedShowdownSetup[^;]*\.subscribe\(/,`N6 ${file} does not keep its own copy of the Setup state`);
  }
  console.log("ok N6 every shared module that borrows the Setup's rivalry reads it through getState()");

  // N7: Nik's page. R2 is live on save A (season 2); Daniel ends it; Daniel's START makes the pair name R3; Nik's JOIN reuses
  // the same save shell for R3.
  const n=boot();
  await n.setup.refresh();
  assert.equal((await n.multi.resumeFromAuthority())?.season,2,"N7 R2 is live on season 2");
  assert.equal(n.indicator(),"Season 2 / 3","N7 the live R2 reads Season 2 / 3");
  n.page.pair={initialized:true,busy:false,status:"unpaired",rivalryId:null,connectionState:null,closedRivalryId:R2,closedProviderSaveId:SAVE_A};
  assert.equal(n.indicator(),"No Active Showdown","N7 Home after END has no live Showdown");
  n.page.pair={initialized:true,busy:false,status:"unpaired",rivalryId:R3,connectionState:"pending-pair",closedRivalryId:R2,closedProviderSaveId:SAVE_A};
  assert.equal(n.sandbox.currentShowdown.identity.saveId,SAVE_A,"N7 precondition: the same save shell is reused for the next Showdown");
  assert.equal(n.indicator(),"Season 1 / 3",`N7 once the pair names R3 the reused shell reads Season 1 / 3, never the ended R2's season (got "${n.indicator()}")`);
  assert.equal(n.multi.resolveSeason(1),1,"N7 every shared consumer resolves season 1");
  assert.equal(n.setup.getState().rivalryId,null,"N7 nothing borrows the ended R2's Setup once the pair names R3");
  const nReads=n.reads.length;
  assert.equal(await n.multi.resumeFromAuthority(),null,"N7 a resume does not read the ended R2");
  assert.deepEqual(n.reads.slice(nReads),[],"N7 no progression read of R2 after the pair moved on");
  assert.equal(n.multi.decorateDashboard(),false,"N7 the dashboard is never decorated with R2");
  n.page.pair={initialized:true,busy:false,status:"paired",rivalryId:R3,connectionState:"active",closedRivalryId:R2,closedProviderSaveId:SAVE_A};
  Object.assign(n.env,{rivalryId:R3,sessionId:SESSION_R3,saveId:SAVE_A});
  await n.setup.refresh();
  assert.equal(n.setup.getState().rivalryId,R3,"N7 R3's own Setup on the same save is read");
  assert.equal((await n.multi.resumeFromAuthority())?.season,1,"N7 R3 resumes on season 1");
  assert.equal(n.indicator(),"Season 1 / 3","N7 R3 reads Season 1 / 3");
  console.log("ok N7 Nik's reused save shell reads Season 1 / 3 once the pair names R3 (the ended R2's season 2 never shows)");
  console.log("PASS r80 setup other-save contracts");
})().catch(error=>{console.error(error);process.exitCode=1;});

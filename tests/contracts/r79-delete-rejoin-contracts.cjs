"use strict";
// r79: Daniel's DELETE CURRENT SHOWDOWN (Settings, unchanged) on a live Showdown must not leave Nik's phone stuck on it.
// Before: the delete closes the rivalry with no terminal witness; Nik's Terminal Close read then failed with
// TERMINAL_CLOSE_INTENT_INVALID, his pair kept the dead Showdown ACTIVE, and his next JOIN refused ("This phone still has a
// different unfinished Showdown ...") until he ran DELETE CURRENT SHOWDOWN himself.
//   P  the Terminal Close read of a rivalry closed with no witness says "deleted" (ok, not terminal); a forged witness still
//      fails exactly as before, an open rivalry still reads open.
//   T  Production Terminal Close turns that same read into DELETED: the session is forgotten and the drafts swept (as CLOSED
//      does), the final reconciliation is never refreshed, a DELETED Showdown is never read again, and refreshers' failures
//      are no longer reported. A forged witness is still reported.
//   F  Final Reconciliation treats DELETED like CLOSED (no refresh, no view).
//   J  the pair takes DELETED for its own live rivalry as closed with no read (unpaired, closed rivalry + its save), so the
//      next JOIN of a different length makes a new shell beside the closed one (kept, never deleted); the same length still
//      reuses it; a Showdown that is not known closed still refuses with the Settings message; the CLOSED event and another
//      rivalry's DELETED change nothing.
//   E  the joiner shell: the active save of the pair's closed Showdown never blocks a new shell (it stays in the library);
//      any other current Showdown still refuses.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");

const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
let checks=0;
const ok=label=>{checks+=1;console.log(`ok ${checks} ${label}`);};
const flush=async(times=12)=>{for(let i=0;i<times;i+=1)await new Promise(resolve=>setImmediate(resolve));};

// ---------- P: the provider read ----------
const Terminal=require(path.join(ROOT,"js/sharedTerminalClose.js"));
const Provider=require(path.join(ROOT,"js/sparkTerminalClose.js"));
const R="pair_3"+"a".repeat(63),UID1="manager_one",UID2="manager_two",DEV1="device_"+"1".repeat(32),DEV2="device_"+"2".repeat(32);
const ts=millis=>({toMillis:()=>millis});
function canonical(value){
  if(value===undefined||value===null)return null;
  if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};
  if(Array.isArray(value))return value.map(canonical);
  if(typeof value==="object"){const out={};for(const key of Object.keys(value).sort())out[key]=canonical(value[key]);return out;}
  return value;
}
async function hash(value){const digest=await webcrypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(canonical(value))));return `sha256:${Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("")}`;}
async function rivalryEnvelope(data,revision){return {schemaVersion:1,objectType:"rivalry",objectId:R,revision,parentRevision:revision-1,lifecycleState:"live",contentHash:await hash({objectType:"rivalry",objectId:R,revision,data}),priorContentHash:`sha256:${"0".repeat(64)}`,updatedAt:ts(1_000_000),updatedByAccountId:UID1,updatedByDeviceId:DEV1,data,tombstone:null};}
function light(type,id,data){return {schemaVersion:1,objectType:type,objectId:id,revision:0,parentRevision:null,lifecycleState:"live",contentHash:`sha256:${"1".repeat(64)}`,priorContentHash:null,updatedAt:ts(1_000_000),updatedByAccountId:UID1,updatedByDeviceId:DEV1,data,tombstone:null};}
async function providerRead(rivalryData){
  const store=new Map([["accounts/"+UID2,light("account",UID2,{status:"active"})],["accounts/"+UID2+"/devices/"+DEV2,light("device",DEV2,{deviceId:DEV2,state:"active"})],["rivalries/"+R,await rivalryEnvelope(rivalryData,4)]]);
  const sdk={doc:(_db,...parts)=>parts.join("/"),Timestamp:{fromMillis:ts},runTransaction:async(_db,fn)=>fn({get:async ref=>({exists:()=>store.has(ref),data:()=>JSON.parse(JSON.stringify(store.get(ref)))}),set:()=>{throw new Error("a read never writes");}})};
  return Provider.read({user:{uid:UID2},firestore:{},firebaseSdk:sdk,rivalryId:R,deviceId:DEV2,cryptoImpl:webcrypto});
}
const slots=[{slotId:"playerOne",accountId:UID1,profileId:"profile_"+"3".repeat(24),saveId:"save_"+"1".repeat(24),displayLabel:"Daniel",entitlementState:"active",deletionConsent:false},{slotId:"playerTwo",accountId:UID2,profileId:"profile_"+"4".repeat(24),saveId:"save_"+"2".repeat(24),displayLabel:"Nik",entitlementState:"active",deletionConsent:false}];
const liveData={connectionState:"active",connectionStateBeforeDeletion:null,managerSlots:slots,authorizedAccountIds:[UID1,UID2]};
async function providerContracts(){
  // The pair's abandon closure (DELETE CURRENT SHOWDOWN) is {...data, connectionState:"closed"}: no terminalClose.
  const deleted=await providerRead({...liveData,connectionState:"closed"});
  assert.equal(deleted.ok,true,`a rivalry closed by a delete reads ok (was ${deleted.code})`);
  assert.equal(deleted.status,"deleted");assert.equal(deleted.deleted,true);assert.equal(deleted.terminal,false);
  assert.equal(deleted.rivalryState,"closed");assert.equal(deleted.rivalryRevision,4);assert.equal("terminalWitness" in deleted,false,"no witness is claimed");
  ok("P1 a rivalry closed with no terminal witness reads as deleted (ok, not terminal, no witness)");
  const forged=await providerRead({...liveData,connectionState:"closed",terminalClose:{phase:"TERMINAL_CLOSE_READY"}});
  assert.equal(forged.ok,false);assert.equal(forged.code,"TERMINAL_CLOSE_INTENT_INVALID","a forged witness still fails");
  const open=await providerRead(liveData);
  assert.equal(open.ok,true);assert.equal(open.status,"open");assert.equal(open.terminal,false);assert.equal(open.deleted,undefined);
  ok("P2 a forged witness still fails TERMINAL_CLOSE_INTENT_INVALID; an open rivalry still reads open");
}

// ---------- T: Production Terminal Close ----------
const S="session_"+"6".repeat(64),D="device_"+"1".repeat(32),U="account_nik";
const SAVE="save_"+"a".repeat(24),P1="profile_"+"b".repeat(24),P2="profile_"+"c".repeat(24);
function terminalSandbox(){
  const listeners=new Map(),reports=[],events=[],removed=[];
  const env={readCalls:0,finalRefreshes:0,forgot:0,readImpl:async()=>({ok:true,status:"deleted",rivalryId:R,rivalryState:"closed",rivalryRevision:4,terminal:false,deleted:true})};
  const sandbox={console,crypto:webcrypto,Promise,Date,setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0,
    CustomEvent:class{constructor(type,init){this.type=type;this.detail=init&&init.detail;}},
    dispatchEvent:event=>{events.push(event);return true;},
    addEventListener:(type,handler)=>{if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(handler);},
    reportApplicationError:(context,error)=>reports.push({context,error}),
    removeStorageValue:key=>removed.push(key),
    document:{visibilityState:"visible",getElementById:()=>null,addEventListener:()=>{},querySelector:()=>null},
    currentShowdown:{sharedJourney:{mode:"shared",rivalryId:R},identity:{saveId:SAVE,managerProfileIds:{playerOne:P1,playerTwo:P2}},managers:{playerOne:"Daniel",playerTwo:"Nik"}}};
  sandbox.globalThis=sandbox;
  sandbox.CareerModeSharedTerminalClose=Terminal;
  sandbox.CareerModeSparkTerminalClose={read:async opts=>{env.readCalls+=1;assert.equal(opts.rivalryId,R);return env.readImpl();},close:async()=>{throw new Error("a deleted Showdown is never closed");}};
  sandbox.CareerModeProductionSharedFinalReconciliation={getState:()=>null,refresh:async()=>{env.finalRefreshes+=1;return null;}};
  sandbox.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:U}},firestore:{},firestoreSdk:{}})};
  sandbox.CareerModeSparkConnectedAccount={initialize:async()=>true,getState:()=>({connected:true,accountId:U})};
  sandbox.CareerModeSparkPrivatePairing={initialize:async()=>true,getState:()=>({registered:true,deviceId:D})};
  sandbox.CareerModeSparkConnectedRivalry={initialize:async()=>true,getState:()=>({initialized:true,attached:true,rivalryId:R,accountId:U,deviceId:D,binding:{saveId:SAVE,managerRole:"playerTwo",profileId:P2}})};
  sandbox.CareerModeSparkRemoteJoining={getState:()=>({sessionState:"active",sessionId:S,expiresAtEpochMs:Date.now()+3_600_000,rivalryId:R,accountId:U,deviceId:D,role:"guest",pendingAction:null}),forgetSession:()=>{env.forgot+=1;}};
  vm.createContext(sandbox);
  vm.runInContext(read("js/productionSharedTerminalClose.js"),sandbox,{filename:"productionSharedTerminalClose.js"});
  return {api:sandbox.CareerModeProductionSharedTerminalClose,env,reports,events,removed};
}
async function terminalContracts(){
  {
    const {api,env,reports,events,removed}=terminalSandbox();
    const state=await api.refresh();
    assert.equal(state&&state.phase,"DELETED","the deleted Showdown is announced (was an error)");
    assert.equal(state.rivalryId,R);assert.equal(state.terminal,false);assert.equal(state.deleted,true);
    assert.equal(reports.length,0,`nothing is reported (${reports.map(r=>r.error&&r.error.message).join(",")})`);
    assert.equal(env.readCalls,1,"exactly the one read the refresh already makes");
    assert.equal(env.finalRefreshes,0,"no final reconciliation of a deleted Showdown");
    assert.equal(env.forgot,1,"the dead session is forgotten as on CLOSE");
    assert.ok(removed.some(key=>key===`cms.draft.v1:${R}:1:playerTwo:seasonResult`),"the rivalry's drafts are swept as on CLOSE");
    const announced=events.filter(e=>e.type==="career-mode-shared-terminal-close-state-change").map(e=>e.detail);
    assert.deepEqual(JSON.parse(JSON.stringify(announced)),[{phase:"DELETED",rivalryId:R,terminal:false}]);
    ok("T1 the same Terminal Close read turns a deleted rivalry into DELETED: session forgotten, drafts swept, one event, nothing reported");
    await api.refresh();await api.refresh();
    assert.equal(env.readCalls,1,"a DELETED Showdown is never read again (reads do not go up)");
    const reported=await api.reportUnlessClosed("Unable to refresh Shared Season Results",new Error("Missing or insufficient permissions."));
    assert.equal(reported,false);assert.equal(reports.length,0,"a refresher's failure on the deleted Showdown is not reported");
    assert.equal(env.readCalls,1);
    ok("T2 no further read for a DELETED Showdown, and refreshers' failures on it are not reported");
  }
  {
    const {api,env,reports}=terminalSandbox();
    env.readImpl=async()=>({ok:false,code:"TERMINAL_CLOSE_INTENT_INVALID",message:"TERMINAL_CLOSE_INTENT_INVALID"});
    const state=await api.refresh();
    assert.notEqual(state&&state.phase,"DELETED");
    assert.equal(reports.length,1,"an invalid (forged) witness is still reported");
    assert.match(String(reports[0].error&&reports[0].error.code),/TERMINAL_CLOSE_INTENT_INVALID/);
    ok("T3 an invalid terminal witness is still reported exactly as before");
  }
}

// ---------- F: Final Reconciliation ----------
function finalContracts(){
  const source=read("js/productionSharedFinalReconciliation.js");
  assert.match(source,/function pfrTerminalClosed\(\)\{try\{const phase=root\.CareerModeProductionSharedTerminalClose\?\.getState\?\.\(\)\?\.phase;[^}]*return phase==="CLOSED"\|\|phase==="DELETED";/,"pfrTerminalClosed counts DELETED");
  assert.match(source,/event\.detail\?\.phase==="CLOSED"\|\|event\.detail\?\.phase==="DELETED"/,"the DELETED event clears the final view instead of refreshing it");
  ok("F1 Final Reconciliation treats DELETED like CLOSED: the event clears its view, nothing is refreshed");
}

// ---------- J: the persistent pair ----------
const pairSource=read("js/persistentNikDanielPair.js");
const R1="pair_3"+"ab".repeat(31)+"c",R2="pair_1"+"cd".repeat(31)+"e",R2SAME="pair_3"+"ef".repeat(31)+"0";
const SAVE_OLD="save_"+"3".repeat(24),PROFILE_OLD="profile_"+"4".repeat(24),SAVE_NEW="save_"+"1".repeat(24),PROFILE_NEW="profile_"+"2".repeat(24);
const DANIEL_SAVE="save_"+"5".repeat(24),DANIEL_PROFILE="profile_"+"6".repeat(24);
function shell(saveId,profileId,rounds){return{saveId,showdown:{totalRounds:rounds,sharedJourney:{mode:"shared",setupPending:true},managers:{playerOne:"Daniel",playerTwo:"Nik"},selectedLeague:null,clubs:{},rounds:[],identity:{saveId,managerProfileIds:{playerTwo:profileId}}}};}
function pairRivalry(rivalryId,connectionState,nik){return{schemaVersion:1,objectType:"rivalry",objectId:rivalryId,revision:1,parentRevision:0,lifecycleState:"live",contentHash:`sha256:${"9".repeat(64)}`,data:{connectionState,authorizedAccountIds:["uid_daniel","uid_nik"],managerSlots:[{slotId:"playerOne",accountId:"uid_daniel",saveId:DANIEL_SAVE,profileId:DANIEL_PROFILE},{slotId:"playerTwo",accountId:"uid_nik",saveId:nik.saveId,profileId:nik.profileId}]}};}
function pairLink(rivalryId){return{schemaVersion:1,objectType:"pairLink",objectId:"current",revision:0,parentRevision:null,lifecycleState:"live",contentHash:`sha256:${"8".repeat(64)}`,data:{rivalryId,managerRole:"playerTwo",managerId:"nik",linkedAt:null,lastConfirmedAt:null}};}
function deviceDoc(){return{schemaVersion:1,objectType:"device",objectId:"device_nik",revision:0,lifecycleState:"live",contentHash:`sha256:${"7".repeat(64)}`,data:{deviceId:"device_nik",state:"active"}};}
function pairHarness({rivalryState="active",linked=true,rounds=3}={}){
  const docs=new Map();
  if(linked){docs.set("accounts/uid_nik/pairLinks/current",pairLink(R1));docs.set(`rivalries/${R1}`,pairRivalry(R1,rivalryState,{saveId:SAVE_OLD,profileId:PROFILE_OLD}));}
  docs.set("accounts/uid_nik/devices/device_nik",deviceDoc());
  const library={activeSaveId:SAVE_OLD,saves:[shell(SAVE_OLD,PROFILE_OLD,rounds)]};
  const listeners={},calls={redeem:[],provision:0,transactions:0},deleted=[];
  const firestoreSdk={
    doc:(_db,...parts)=>({path:parts.join("/")}),
    Timestamp:{fromMillis:ms=>({toMillis:()=>ms})},
    runTransaction:async(_db,fn)=>{calls.transactions+=1;const writes=[];const result=await fn({get:async ref=>({exists:()=>docs.has(ref.path),data:()=>docs.get(ref.path)}),set:(ref,value)=>{writes.push([ref.path,value]);}});for(const [key,value] of writes)docs.set(key,value);return result;},
    getDoc:async ref=>({exists:()=>docs.has(ref.path),data:()=>docs.get(ref.path)})
  };
  const runtime={isReady:()=>true,getLibrarySnapshot:()=>JSON.parse(JSON.stringify(library)),switchActiveSave:async id=>{library.activeSaveId=id;return true;},
    deleteSave:id=>{deleted.push(id);library.saves=library.saves.filter(entry=>entry.saveId!==id);if(library.activeSaveId===id)library.activeSaveId=null;return{ok:true,deletedSaveId:id,activeSaveId:library.activeSaveId};}};
  const pairing={initialize:async()=>({}),getState:()=>({registered:true,deviceId:"device_nik"}),
    localBindingOptions:()=>{const entry=library.saves.find(item=>item.saveId===library.activeSaveId);const profileId=entry?.showdown?.identity?.managerProfileIds?.playerTwo;return entry&&profileId?[{managerRole:"playerTwo",saveId:entry.saveId,profileId}]:[];},
    getOrCreateDeviceIdentity:async()=>({deviceId:"device_nik"}),
    redeemPairing:async options=>{calls.redeem.push({capability:options.capability,saveId:options.binding.saveId});return firestoreSdk.runTransaction({},async transaction=>{const now=firestoreSdk.Timestamp.fromMillis(Date.now());const witness=await options.durableWitness({transaction,binding:options.binding,capability:options.capability,now,nowEpochMs:Date.now()});transaction.set({path:`rivalries/${options.capability}`},pairRivalry(options.capability,"active",options.binding));return{ok:true,rivalryId:options.capability,durableWitness:witness};});},
    pairingJoinErrorMessage:error=>error?.message||"The code could not be joined."};
  const document={visibilityState:"visible",body:null,createElement:()=>({style:{},classList:{add(){},remove(){},toggle(){}},append(){},appendChild(n){return n;},replaceChildren(){},setAttribute(){},addEventListener(){}}),getElementById:()=>null,querySelector:()=>null};
  const sandbox={console,setTimeout:()=>0,clearTimeout:()=>{},TextEncoder,crypto:webcrypto,Promise,Date,document,
    addEventListener:(type,fn)=>{(listeners[type]||(listeners[type]=[])).push(fn);},
    CareerModeOnlinePlayerIdentity:{getState:()=>({managerId:"nik"})},
    CareerModeSparkConnectedAccount:{initialize:async()=>({}),getState:()=>({connected:true,accountId:"uid_nik"})},
    CareerModeSparkPrivatePairing:pairing,CareerModeSaveLibraryRuntime:runtime,
    CareerModeProductionSharedJourneyEntry:{provisionJoinerShell:async total=>{calls.provision+=1;library.saves.push(shell(SAVE_NEW,PROFILE_NEW,Number(total)));library.activeSaveId=SAVE_NEW;return true;}},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"uid_nik"}},firestore:{},firestoreSdk})},
    navigateTo:async()=>true};
  vm.createContext(sandbox);
  vm.runInContext(pairSource,sandbox,{filename:"js/persistentNikDanielPair.js"});
  const fire=detail=>{for(const fn of listeners["career-mode-shared-terminal-close-state-change"]||[])fn({type:"career-mode-shared-terminal-close-state-change",detail});};
  // Daniel's delete as Firestore sees it: R1 closed (no terminal witness).
  const deleteOnDanielsPhone=()=>docs.set(`rivalries/${R1}`,pairRivalry(R1,"closed",{saveId:SAVE_OLD,profileId:PROFILE_OLD}));
  return {pair:sandbox.CareerModePersistentNikDanielPair,library,calls,deleted,fire,deleteOnDanielsPhone};
}
const plain=value=>JSON.parse(JSON.stringify(value));
async function pairContracts(){
  {
    const h=pairHarness();
    let state=await h.pair.initialize({force:true});
    assert.equal(state.connectionState,"active");assert.equal(state.rivalryId,R1);assert.equal(state.providerSaveId,SAVE_OLD);
    const reads=h.calls.transactions;
    h.fire({phase:"CLOSED",rivalryId:R1,terminal:true});
    h.fire({phase:"DELETED",rivalryId:R2,terminal:false});
    assert.equal(h.pair.getState().connectionState,"active","the CLOSED event and another rivalry's DELETED change nothing");
    h.deleteOnDanielsPhone();h.fire({phase:"DELETED",rivalryId:R1,terminal:false});
    state=h.pair.getState();
    assert.deepEqual(plain({status:state.status,rivalryId:state.rivalryId,connectionState:state.connectionState,closedRivalryId:state.closedRivalryId,closedProviderSaveId:state.closedProviderSaveId,busy:state.busy}),
      {status:"unpaired",rivalryId:null,connectionState:null,closedRivalryId:R1,closedProviderSaveId:SAVE_OLD,busy:false},"the pair holds R1 as closed (what its next pair-link read would say)");
    assert.equal(h.calls.transactions,reads,"no read for it");
    ok("J1 DELETED for the pair's own live rivalry: unpaired with that closed rivalry and its save, no read; CLOSED / other rivalries ignored");
    const joined=await h.pair.joinPairing(`CMS17-${R2}`,{managerRole:"playerTwo",autoContinue:false});
    assert.equal(joined.status,"paired",`the next JOIN works (${joined.message})`);assert.equal(joined.rivalryId,R2,joined.message);
    assert.equal(h.calls.provision,1,"a new shell for the 1-season Showdown");
    assert.deepEqual(h.calls.redeem,[{capability:R2,saveId:SAVE_NEW}],"redeemed with the new shell");
    assert.deepEqual(h.deleted,[],"the deleted Showdown's save is never deleted");
    assert.ok(h.library.saves.some(entry=>entry.saveId===SAVE_OLD&&entry.showdown.totalRounds===3),"it stays in the library as it was");
    ok("J2 after DELETED, a JOIN of a different length makes a new shell beside the closed one (kept) and joins");
  }
  {
    // After a reload (or a normal CLOSE) the pair-link read itself reports R1 closed: same outcome.
    const h=pairHarness({rivalryState:"closed"});
    const state=await h.pair.initialize({force:true});
    assert.equal(state.status,"unpaired");assert.equal(state.closedRivalryId,R1);assert.equal(state.closedProviderSaveId,SAVE_OLD);
    const joined=await h.pair.joinPairing(`CMS17-${R2}`,{managerRole:"playerTwo",autoContinue:false});
    assert.equal(joined.status,"paired",joined.message);assert.equal(h.calls.provision,1);assert.deepEqual(h.deleted,[]);
    ok("J3 a pair-link read that finds R1 closed (reload, or a finished CLOSE) lets the next JOIN of another length through too");
  }
  {
    const h=pairHarness();await h.pair.initialize({force:true});h.deleteOnDanielsPhone();h.fire({phase:"DELETED",rivalryId:R1,terminal:false});
    const joined=await h.pair.joinPairing(`CMS17-${R2SAME}`,{managerRole:"playerTwo",autoContinue:false});
    assert.equal(joined.status,"paired",joined.message);
    assert.equal(h.calls.provision,0,"the empty shell of the same length is reused as before");
    assert.deepEqual(h.calls.redeem,[{capability:R2SAME,saveId:SAVE_OLD}]);
    ok("J4 the same length still reuses the closed Showdown's empty shell (unchanged)");
  }
  {
    // Nothing says the local Showdown is closed: the refusal and its Settings message are unchanged.
    const h=pairHarness({linked:false,rounds:5});
    await h.pair.initialize({force:true});
    const joined=await h.pair.joinPairing(`CMS17-${R2}`,{managerRole:"playerTwo",autoContinue:false});
    assert.notEqual(joined.status,"paired");
    assert.match(joined.message,/This phone still has a different unfinished Showdown\. Delete it in Settings \(DELETE CURRENT SHOWDOWN\)/);
    assert.equal(h.calls.redeem.length,0);assert.equal(h.calls.provision,0);
    ok("J5 a local Showdown not known closed still refuses with the Settings message (not weakened)");
  }
}

// ---------- E: the joiner shell ----------
function entrySandbox({closed}){
  const library={activeSaveId:SAVE_OLD,saves:[{saveId:SAVE_OLD,showdown:{totalRounds:3,status:"Created",sharedJourney:{mode:"shared",setupPending:true},managers:{playerOne:"Daniel",playerTwo:"Nik"},selectedLeague:{id:"x"},clubs:{playerOne:"A",playerTwo:"B"},rounds:[{}]}}]};
  const round={value:"3"},calls={create:0};
  const sandbox={console,Promise,setTimeout:()=>0,clearTimeout:()=>{},MutationObserver:class{observe(){}},
    sessionStorage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},
    document:{getElementById:id=>id==="roundAmount"?round:null,querySelector:()=>null,documentElement:{}},
    ensureSaveLibraryRuntimeAuthority:async()=>true,ensureGameplayModules:async()=>true,showScreen:()=>true,
    CareerModePersistentNikDanielPair:{getState:()=>closed?{status:"unpaired",rivalryId:null,closedRivalryId:R1,closedProviderSaveId:SAVE_OLD}:{status:"unpaired",rivalryId:null,closedRivalryId:null,closedProviderSaveId:null}},
    CareerModeSaveLibraryRuntime:{isReady:()=>true,getLibrarySnapshot:()=>JSON.parse(JSON.stringify(library)),
      saveCurrentShowdown:()=>{const entry=library.saves.find(e=>e.saveId===library.activeSaveId);entry.showdown=JSON.parse(JSON.stringify(sandbox.currentShowdown));return true;}},
    createShowdown:async()=>{calls.create+=1;assert.equal(round.value,"1");const saveId=SAVE_NEW;sandbox.currentShowdown={totalRounds:1,status:"Created",managers:{},selectedLeague:null,clubs:{playerOne:null,playerTwo:null},rounds:[],identity:{saveId}};library.saves.push({saveId,showdown:JSON.parse(JSON.stringify(sandbox.currentShowdown))});library.activeSaveId=saveId;return true;}};
  sandbox.globalThis=sandbox;sandbox.currentShowdown=null;
  vm.createContext(sandbox);
  vm.runInContext(read("js/productionSharedJourneyEntry.js"),sandbox,{filename:"productionSharedJourneyEntry.js"});
  return {api:sandbox.CareerModeProductionSharedJourneyEntry,library,calls};
}
async function entryContracts(){
  {
    const {api,library,calls}=entrySandbox({closed:true});
    assert.equal(await api.provisionJoinerShell(1),true);
    assert.equal(calls.create,1);assert.equal(library.activeSaveId,SAVE_NEW,"the new shell is active");
    const kept=library.saves.find(e=>e.saveId===SAVE_OLD);
    assert.deepEqual(plain(kept.showdown.clubs),{playerOne:"A",playerTwo:"B"},"the closed Showdown's save is kept, unchanged");assert.equal(kept.showdown.rounds.length,1);
    assert.equal(library.saves.find(e=>e.saveId===SAVE_NEW).showdown.sharedJourney.setupPending,true,"the new shell carries the shared marker");
    ok("E1 the closed Showdown's save (even one with local data) never blocks Nik's new shell; it stays in the library unchanged");
  }
  {
    const {api,library,calls}=entrySandbox({closed:false});
    await assert.rejects(api.provisionJoinerShell(1),/This phone already has a different current Showdown\. Delete it in Settings \(DELETE CURRENT SHOWDOWN\)/);
    assert.equal(calls.create,0);assert.equal(library.saves.length,1);
    ok("E2 any other current Showdown still refuses with the Settings message");
  }
}

(async()=>{
  await providerContracts();
  await terminalContracts();
  finalContracts();
  await pairContracts();
  await entryContracts();
  await flush();
  console.log(`r79 delete-then-rejoin contracts passed (${checks} checks)`);
})().catch(error=>{console.error(error);process.exit(1);});

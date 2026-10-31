"use strict";
// F1, audit #966: pending Final Winner save survives expiry and a rival closes via a replacement session.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const test=require("node:test");
const {webcrypto}=require("node:crypto");
const Terminal=require("../../js/sharedTerminalClose.js");
const Provider=require("../../js/sparkTerminalClose.js");
const Sessions=require("../../js/sparkPrivateSession.js");
const StandardSessions=require("../../js/sparkStandardAuthPrivateSession.js");

const rivalryId="pair_"+("a".repeat(64));
const sessionId="session_"+("b".repeat(64));
const freshSessionId="session_"+("c".repeat(64));
const uid1="manager_one";
const uid2="manager_two";
const device1="device_"+("1".repeat(32));
const device2="device_"+("2".repeat(32));
const save1="save_"+("1".repeat(24));
const save2="save_"+("2".repeat(24));
const profile1="profile_"+("3".repeat(24));
const profile2="profile_"+("4".repeat(24));
const ts=millis=>({toMillis:()=>millis});

const finalProjection={schemaVersion:1,runtimeRevision:"1.9.1-r17",phase:"FINAL_SEASON_RECONCILED",rivalryId,leagueId:"premier-league",totalSeasons:3,acceptedSeasons:3,completedSeason:3,acceptedRevisionKey:"season:3:revision:19",fixedClubs:{playerOne:"Arsenal",playerTwo:"Chelsea"},managerTotals:{playerOne:11,playerTwo:9},winner:"playerOne",terminal:true,finalSeasonReconciled:true,nextSeason:null,extraSeasonAllowed:false,terminalCloseRequired:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false};
const intent=Terminal.prepare(finalProjection,{sessionId});

function clone(value){
  if(value===undefined)return undefined;
  const text=JSON.stringify(value,(_key,item)=>item&&typeof item.toMillis==="function"?{__millis:item.toMillis()}:item);
  return JSON.parse(text,(_key,item)=>item&&Number.isFinite(item.__millis)?ts(item.__millis):item);
}
function canonical(value){
  if(value===undefined||value===null)return null;
  if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};
  if(Array.isArray(value))return value.map(canonical);
  if(typeof value==="object"){
    const out={};
    for(const key of Object.keys(value).sort())out[key]=canonical(value[key]);
    return out;
  }
  return value;
}
function hex(bytes){return Array.from(bytes,value=>value.toString(16).padStart(2,"0")).join("");}
async function hash(value){
  const digest=await webcrypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(canonical(value))));
  return `sha256:${hex(new Uint8Array(digest))}`;
}
async function rivalryEnvelope(data,revision=2){
  return {schemaVersion:1,objectType:"rivalry",objectId:rivalryId,revision,parentRevision:revision?revision-1:null,lifecycleState:"live",contentHash:await hash({objectType:"rivalry",objectId:rivalryId,revision,data}),priorContentHash:revision?`sha256:${"0".repeat(64)}`:null,updatedAt:ts(1_000_000),updatedByAccountId:uid1,updatedByDeviceId:device1,data,tombstone:null};
}
function lightEnvelope(type,id,data){
  return {schemaVersion:1,objectType:type,objectId:id,revision:0,parentRevision:null,lifecycleState:"live",contentHash:`sha256:${"1".repeat(64)}`,priorContentHash:null,updatedAt:ts(1_000_000),updatedByAccountId:uid1,updatedByDeviceId:device1,data,tombstone:null};
}
function result(overrides={}){
  return {leaguePosition:2,leaguePoints:80,leagueGoals:70,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false,...overrides};
}
function commit(season,playerOne,playerTwo){
  return {schemaVersion:1,objectType:"sharedSeasonCommit",rivalryId,seasonNumber:season,runtimeRevision:"1.9.1-r10",phase:"ACKNOWLEDGED",revision:3,results:{playerOne,playerTwo}};
}

async function harness({expiresAt=2_100_000}={}){
  const key=(...parts)=>parts.join("/");
  const store=new Map();

  store.set(key("accounts",uid1),lightEnvelope("account",uid1,{status:"active"}));
  store.set(key("accounts",uid2),lightEnvelope("account",uid2,{status:"active"}));
  store.set(key("accounts",uid1,"devices",device1),lightEnvelope("device",device1,{deviceId:device1,state:"active"}));
  store.set(key("accounts",uid2,"devices",device2),lightEnvelope("device",device2,{deviceId:device2,state:"active"}));

  const rivalryData={connectionState:"active",connectionStateBeforeDeletion:null,managerSlots:[{slotId:"playerOne",accountId:uid1,profileId:profile1,saveId:save1,displayLabel:"Manager One",entitlementState:"active",deletionConsent:false},{slotId:"playerTwo",accountId:uid2,profileId:profile2,saveId:save2,displayLabel:"Manager Two",entitlementState:"active",deletionConsent:false}],authorizedAccountIds:[uid1,uid2],createdByAccountId:uid1,createdAt:ts(500_000)};
  store.set(key("rivalries",rivalryId),await rivalryEnvelope(rivalryData));

  const sessionData={createdAt:ts(700_000),expiresAt:ts(expiresAt),hostAccountId:uid1,lastActivityAt:ts(800_000),memberAccountIds:[uid1,uid2],revokedAt:null,rivalryId,state:"active"};
  store.set(key("rivalries",rivalryId,"sessions",sessionId),await Sessions.buildEnvelope({sessionId,revision:5,parentRevision:4,priorContentHash:`sha256:${"2".repeat(64)}`,updatedAt:ts(800_000),accountId:uid2,deviceId:device2,data:sessionData,cryptoImpl:webcrypto}));
  store.set(key("rivalries",rivalryId,"sharedSetup","authoritative"),{schemaVersion:1,objectType:"sharedSetupLedger",rivalryId,revision:6,phase:"SHOWDOWN_CONFIRMED",totalSeasons:3});
  store.set(key("rivalries",rivalryId,"seasonCommits","season_1"),commit(1,result({championsLeague:true}),result({championsLeague:true})));
  store.set(key("rivalries",rivalryId,"seasonCommits","season_2"),commit(2,result({leaguePosition:1}),result({leaguePosition:1})));
  store.set(key("rivalries",rivalryId,"seasonCommits","season_3"),commit(3,result({leaguePosition:1}),result({domesticCup:true})));

  const sdk={
    doc:(_db,...parts)=>key(...parts),
    Timestamp:{fromMillis:ts},
    runTransaction:async(_db,callback)=>{
      const pending=[];
      const tx={
        get:async ref=>({exists:()=>store.has(ref),data:()=>clone(store.get(ref))}),
        set:(ref,value)=>pending.push([ref,clone(value)])
      };
      const outcome=await callback(tx);
      pending.forEach(([ref,value])=>store.set(ref,value));
      return outcome;
    }
  };
  const options=(who=1,overrides={})=>({user:{uid:who===1?uid1:uid2},firestore:{},firebaseSdk:sdk,rivalryId,sessionId,deviceId:who===1?device1:device2,intent,nowEpochMs:2_000_000,cryptoImpl:webcrypto,...overrides});
  return {store,key,sdk,options};
}


function page(h,who,clock,{failClose=false,readOverride=null,terminal=Terminal}={}){
  const timers=[],calls=[],errors=[];let forgets=0,remoteSession=sessionId;
  const options=h.options(who),accountId=options.user.uid,deviceId=options.deviceId;
  const context=vm.createContext({console,TextEncoder,crypto:webcrypto,
    Date:class extends Date{static now(){return clock.now;}},
    setTimeout:fn=>timers.push(fn),setInterval(){},addEventListener(){},
    currentShowdown:{identity:{saveId:who===1?save1:save2,managerProfileIds:{playerOne:profile1,playerTwo:profile2}},sharedJourney:{mode:"shared",rivalryId}},
    CareerModeSharedTerminalClose:terminal,
    CareerModeSparkTerminalClose:{read:o=>readOverride?readOverride(o):Provider.read(o),close:async o=>{
      calls.push(clone(o.intent));
      // Fail before the first close transaction writes anything, using the real provider's error handling.
      if(failClose){failClose=false;const sdk={...o.firebaseSdk,runTransaction:async()=>{throw Object.assign(new Error("connection lost"),{code:"unavailable"});}};return Provider.close({...o,firebaseSdk:sdk});}
      return Provider.close(o);
    }},
    CareerModeProductionSharedFinalReconciliation:{getState:()=>finalProjection,refresh:async()=>finalProjection},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:options.user},firestore:options.firestore,firestoreSdk:h.sdk})},
    CareerModeSparkConnectedAccount:{getState:()=>({connected:true,accountId})},
    CareerModeSparkPrivatePairing:{getState:()=>({registered:true,deviceId})},
    CareerModeSparkConnectedRivalry:{getState:()=>({attached:true,rivalryId,accountId,deviceId})},
    CareerModeSparkRemoteJoining:{getState:()=>({sessionState:"active",sessionId:remoteSession,rivalryId,accountId,deviceId,pendingAction:null,expiresAtEpochMs:remoteSession===sessionId?2_100_000:clock.now+60_000}),forgetSession:()=>{forgets++;}},
    reportApplicationError:(_where,error)=>errors.push(error.code)
  });
  vm.runInContext(fs.readFileSync(require.resolve("../../js/productionSharedTerminalClose.js"),"utf8"),context);
  const api=context.CareerModeProductionSharedTerminalClose;
  return {api,calls,errors,timers,get forgets(){return forgets;},replaceSession(){remoteSession=freshSessionId;},setRead(fn){readOverride=fn;},async automaticSave(){
    api.install();await api.refresh();
    for(let i=0;i<2000&&(timers.length||api.isBusy());i++){
      if(timers.length)timers.shift()();
      await new Promise(resolve=>setTimeout(resolve,1));
    }
    assert.equal(api.isBusy(),false);
  }};
}
const storeSnapshot=h=>JSON.stringify([...h.store]);
async function pendingPage(who){
  const h=await harness(),clock={now:2_000_000},original=page(h,who,clock,{failClose:true});
  const before=storeSnapshot(h);
  await original.automaticSave();
  assert.equal(original.api.getState().phase,"RECOVERY_PENDING");
  assert.equal(original.api.getState().automaticCloseFailed,true);
  assert.equal(storeSnapshot(h),before,"failed pre-write automatic save changes no stored facts");
  assert.equal(original.calls.length,1);
  return {h,clock,original};
}
for(const who of [1,2])for(const action of ["refresh","retry","retry-race"]){
  test(`${who===1?"Daniel":"Nik"}: failed automatic save, ten-minute sleep, replacement session, rival save, ${action}`,async()=>{
    const {h,clock,original}=await pendingPage(who),held=clone(original.api.getState().intent);
    clock.now+=600_000;
    assert.ok(clock.now>2_100_000,"sleep crosses the original session deadline");
    const replacement={sessionId:freshSessionId,nowEpochMs:clock.now,ttlMs:60_000};
    assert.equal((await StandardSessions.openSession(h.options(1,replacement))).ok,true);
    assert.equal((await StandardSessions.joinSession(h.options(2,replacement))).ok,true);
    original.replaceSession();
    const rival=page(h,who===1?2:1,clock);rival.replaceSession();await rival.automaticSave();
    assert.equal(rival.api.getState().phase,"CLOSED","the rival saves normally through the replacement session");
    const stored=clone(rival.api.getState().terminalWitness),before=storeSnapshot(h);
    assert.equal(stored.sessionId,freshSessionId);
    assert.equal(Terminal.sameWitness(held,stored),false,"mutation replay identity remains session-bound");
    // A fresh page already accepts this exact durable closure.
    const fresh=page(h,who,clock);await fresh.api.refresh();assert.equal(fresh.api.getState().phase,"CLOSED");
    const oldReplay=await Provider.close(h.options(who,{intent:held,nowEpochMs:clock.now}));
    assert.equal(oldReplay.code,"TERMINAL_CLOSE_REPLAY_CONFLICT","an old mutation still cannot replay a replacement-session witness");
    if(action==="retry-race"){
      let first=true;
      original.setRead(o=>{if(first){first=false;return {ok:true,terminal:false};}return Provider.read(o);});
    }
    const result=await original.api[action==="retry-race"?"retry":action]();
    assert.equal(original.api.getState().phase,"CLOSED","the original page settles without reloading");
    if(action!=="refresh"){assert.equal(result.ok,true);assert.equal(result.sessionId,freshSessionId,"return the stored session, not the abandoned one");}
    assert.deepEqual(clone(original.api.getState().terminalWitness),stored);
    assert.equal(original.api.getState().sessionId,freshSessionId);
    assert.equal(original.forgets,1);
    if(action==="retry-race"){
      assert.equal(original.calls.length,2,"an open observation retries only the held close before the race-recovery read");
      assert.deepEqual(original.calls[1],held);
    }else assert.equal(original.calls.length,1,"read-only adoption never resends the old close");
    assert.equal(storeSnapshot(h),before,"stored witness, season facts and session documents stay unchanged");
    assert.deepEqual(original.errors,[]);
  });
}
for(const who of [1,2])test(`${who===1?"Daniel":"Nik"}: unresolved retry retains exact mutation identity`,async()=>{
  const {h,original}=await pendingPage(who),held=clone(original.api.getState().intent);
  await original.api.refresh();assert.equal(original.api.getState().phase,"RECOVERY_PENDING");
  const retried=await original.api.retry();assert.equal(retried.ok,true);
  assert.deepEqual(original.calls[1],held);
  assert.equal(original.api.getState().phase,"CLOSED");
  assert.equal((await Provider.read(h.options(who))).terminalWitness.sessionId,sessionId);
});

// Equivalent results may be adopted across sessions; changed facts and unverified reads remain pending.
for(const [label,change] of [
  ["rivalry",{rivalryId:"pair_"+"d".repeat(64)}],
  ["season boundary",{totalSeasons:5,completedSeason:5}],
  ["totals",{managerTotals:{playerOne:12,playerTwo:9}}],
  ["winner",{managerTotals:{playerOne:9,playerTwo:11},winner:"playerTwo"}],
  ["invalid witness",{extraSeasonAllowed:true}]
])test(`reject ${label} on refresh and retry`,async()=>{
  const h=await harness(),clock={now:2_000_000};let read={ok:true,terminal:false};
  const original=page(h,1,clock,{failClose:true,readOverride:async()=>read});await original.automaticSave();
  const held=clone(original.api.getState().intent),before=storeSnapshot(h);
  read={ok:true,terminal:true,rivalryRevision:7,terminalWitness:{...held,sessionId:freshSessionId,...change}};
  await original.api.refresh();assert.equal(original.api.getState().phase,"RECOVERY_PENDING");
  assert.equal((await original.api.retry()).code,"TERMINAL_CLOSE_REPLAY_CONFLICT");
  assert.deepEqual(clone(original.api.getState().intent),held);
  assert.equal(original.forgets,0);assert.equal(original.calls.length,1);assert.equal(storeSnapshot(h),before);
});

// r86 (red team #6): a verified CLOSED Showdown is final. The Champion screen and Showdown Home kept re-reading it every 45 s.
for(const who of [1,2])test(`${who===1?"Daniel":"Nik"}: a closed Showdown is not read again`,async()=>{
  const h=await harness(),clock={now:2_000_000},p=page(h,who,clock);await p.automaticSave();
  assert.equal(p.api.getState().phase,"CLOSED");
  let reads=0;p.setRead(o=>{reads++;return Provider.read(o);});
  for(let i=0;i<5;i++){clock.now+=45_000;await p.api.refresh();}
  assert.equal(reads,0,"no billed rivalry read after a verified close");
  assert.equal(p.api.getState().phase,"CLOSED");
  assert.deepEqual(p.errors,[]);
});

// r87 arch S-05: a throw before the close's own try (the intent check) used to leave the automatic save on
// "Saving this Showdown..." for the page life: no failure state, CLOSE hidden, retry blocked. It now ends as a failed
// automatic save with CLOSE shown, and nothing is written.
test("Daniel: an automatic close that throws before writing shows CLOSE instead of saving forever",async()=>{
  const h=await harness(),clock={now:2_000_000};let armed=false;
  const terminal={...Terminal,verifyIntent(value){if(armed){armed=false;throw Object.assign(new Error("intent check failed"),{code:"TERMINAL_CLOSE_INTENT_INVALID"});}return Terminal.verifyIntent(value);}};
  const p=page(h,1,clock,{terminal});const before=storeSnapshot(h);
  const rejections=[];const onRejection=error=>rejections.push(error);process.on("unhandledRejection",onRejection);
  try{
    p.api.install();await p.api.refresh();armed=true;
    const timers=p.timers;
    for(let i=0;i<200;i++){if(timers.length)timers.shift()();await new Promise(resolve=>setTimeout(resolve,1));}
  }finally{process.off("unhandledRejection",onRejection);}
  assert.equal(armed,false,"the close ran its intent check");
  assert.deepEqual(rejections.map(e=>e?.code),[],"no unhandled rejection");
  const state=p.api.getState();
  assert.equal(state.automaticSaving,false,"not left on Saving this Showdown");
  assert.equal(state.automaticCloseFailed,true,"the failed automatic save is shown, so CLOSE appears");
  assert.equal(p.calls.length,0,"nothing was sent");assert.equal(storeSnapshot(h),before);
});

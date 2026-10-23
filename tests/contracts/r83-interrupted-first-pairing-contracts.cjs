"use strict";
// Audit #969 F1: actual START / real JOIN, lost post-redemption writes, two fresh pages,
// then the next START / Home JOIN. Only storage, account/device registration and the clock are fixtures.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const {test}=require("node:test");
const {webcrypto}=require("node:crypto");
const Provider=require("../../js/sparkPrivatePairing.js");
const UID={playerOne:"daniel-account",playerTwo:"nik-account"};
const ts=ms=>({toMillis:()=>ms});
const env=(type,id,data)=>({schemaVersion:1,objectType:type,objectId:id,revision:0,lifecycleState:"live",contentHash:"sha256:"+"a".repeat(64),data});
const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value,(_k,v)=>v&&typeof v.toMillis==="function"?{__ms:v.toMillis()}:v),(_k,v)=>v&&Number.isFinite(v.__ms)?ts(v.__ms):v);
const partnerPath=role=>`accounts/${UID[role]}/partner/current`;
function game(){
  const docs=new Map(),transactions=[];
  let now=1800000000000,failPartnerWrites=0,failMarkerRead=false;
  const libraries={};
  const save=role=>"save_"+(role==="playerOne"?"1":"2").repeat(24),profile=role=>"profile_"+(role==="playerOne"?"3":"4").repeat(24);
  function prepare(role){const entry={saveId:save(role),showdown:{totalRounds:3,status:"Created",sharedJourney:{mode:"shared",setupPending:true},managers:{playerOne:"Daniel",playerTwo:"Nik"},selectedLeague:null,clubs:{},rounds:[],identity:{managerProfileIds:{[role]:profile(role)}}}};libraries[role]={activeSaveId:entry.saveId,saves:[entry]};}
  function page(role){
    const uid=UID[role],digit=role==="playerOne"?"5":"6",deviceId="device_"+digit.repeat(32);
    const identity={schemaVersion:1,installationId:"installation_"+digit.repeat(32),deviceId,createdAtEpochMs:now};
    docs.set(`accounts/${uid}/devices/${deviceId}`,env("device",deviceId,{deviceId,state:"active"}));
    libraries[role]||={activeSaveId:null,saves:[]};
    const library=libraries[role],timers=new Map();let timerId=0;
    const sdk={doc:(_db,...parts)=>({path:parts.join("/")}),Timestamp:{fromMillis:ts},serverTimestamp:()=>({__server:true}),
      getDoc:async ref=>snapshot(ref),
      runTransaction:async(_db,fn)=>{
        const record={uid,reads:[],writes:[]};transactions.push(record);const pending=[];
        const tx={get:async ref=>{assert.equal(pending.length,0,"all reads precede writes");record.reads.push(ref.path);
          if(failMarkerRead&&ref.path.includes("/careerStart/"))throw Object.assign(new Error("offline"),{code:"unavailable"});
          // Existing Rules permit a foreign partner read only when its record names this account.
          if(ref.path.endsWith("/partner/current")&&!ref.path.startsWith(`accounts/${uid}/`)&&docs.get(ref.path)?.partnerAccountId!==uid)throw Object.assign(new Error("denied"),{code:"permission-denied"});
          return snapshot(ref);},set:(ref,value)=>pending.push([ref.path,value])};
        const result=await fn(tx);
        if(pending.some(([p])=>p.endsWith("/partner/current"))&&failPartnerWrites>0){failPartnerWrites--;throw Object.assign(new Error("connection interrupted"),{code:"unavailable"});}
        for(const [p,v] of pending){docs.set(p,resolveTimes(v));record.writes.push(p);}return result;
      }};
    function snapshot(ref){if(failMarkerRead&&ref.path.includes("/careerStart/"))throw Object.assign(new Error("offline"),{code:"unavailable"});return{exists:()=>docs.has(ref.path),data:()=>clone(docs.get(ref.path))};}
    function resolveTimes(v){if(v&&v.__server)return ts(now);if(v&&typeof v.toMillis==="function")return ts(v.toMillis());if(Array.isArray(v))return v.map(resolveTimes);if(v&&typeof v==="object")return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,resolveTimes(x)]));return v;}
    const pairing={...Provider,createPairing:o=>Provider.createPairing({...o,nowEpochMs:now}),redeemPairing:o=>Provider.redeemPairing({...o,nowEpochMs:now}),initialize:async()=>{},getState:()=>({registered:true,deviceId}),getOrCreateDeviceIdentity:async()=>identity,
      localBindingOptions:()=>library.saves.length?[{managerRole:role,saveId:save(role),profileId:profile(role)}]:[]};
    const root=vm.createContext({console,TextEncoder,crypto:webcrypto,Promise,Date:class extends Date{static now(){return now;}},
      setTimeout:(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId;},clearTimeout:id=>timers.delete(id),
      document:{visibilityState:"visible",getElementById:()=>null,querySelector:()=>null},
      CustomEvent:class{},dispatchEvent(){},
      CareerModeFirestoreBudget:{services:s=>s,wantFresh(){},readServerNext(){},quotaMessage:()=>null},
      CareerModeOnlinePlayerIdentity:{getState:()=>({managerId:role==="playerOne"?"daniel":"nik"})},
      CareerModeSparkConnectedAccount:{initialize:async()=>{},getState:()=>({connected:true,accountId:uid})},
      CareerModeSparkPrivatePairing:pairing,
      CareerModeSaveLibraryRuntime:{isReady:()=>true,getLibrarySnapshot:()=>clone(library),switchActiveSave:async id=>{library.activeSaveId=id;return true;},deleteSave:id=>{library.saves=library.saves.filter(x=>x.saveId!==id);library.activeSaveId=null;return{ok:true,deletedSaveId:id};}},
      CareerModeProductionSharedJourneyEntry:{provisionJoinerShell:async()=>{prepare(role);Object.assign(library,libraries[role]);libraries[role]=library;return true;}},
      CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid}},firestore:{},firestoreSdk:sdk})}
    });
    for(const file of ["careerStartMarker.js","persistentNikDanielPair.js"])vm.runInContext(fs.readFileSync(require.resolve("../../js/"+file),"utf8"),root,{filename:file});
    return{pair:root.CareerModePersistentNikDanielPair,marker:root.CareerModeCareerStartMarker,root,timers};
  }
  async function interrupted(){
    prepare("playerOne");const daniel=page("playerOne");await daniel.marker.startRealCareer();await daniel.pair.initialize({force:true});
    const waiting=await daniel.pair.startPairing({managerRole:"playerOne"});assert.match(waiting.capability,/^CMS17R-/);
    // Daniel closes his page here: no waiting poll / partner writer is run again on it.
    const nik=page("playerTwo");await nik.pair.initialize({force:true});failPartnerWrites=2;
    const joined=await nik.pair.joinPairing(waiting.capability,{managerRole:"playerTwo",autoContinue:false});
    assert.equal(joined.status,"paired",JSON.stringify(joined));assert.equal(joined.connectionState,"active");assert.equal(failPartnerWrites,0,"both automatic partner writes were interrupted");
    assert.equal(docs.has(partnerPath("playerOne")),false);assert.equal(docs.has(partnerPath("playerTwo")),false);
    for(const role of ["playerOne","playerTwo"]){assert.ok(docs.has(`accounts/${UID[role]}/pairLinks/current`));assert.ok(docs.has(`accounts/${UID[role]}/careerIndex/current`));assert.ok(docs.has(`accounts/${UID[role]}/careerStart/current`));}
    return waiting.rivalryId;
  }
  return{docs,transactions,page,prepare,interrupted,advance:ms=>{now+=ms;},setMarkerUnavailable:v=>{failMarkerRead=v;},failWrites:n=>{failPartnerWrites=n;}};
}

for(const first of ["playerOne","playerTwo"])test(`${first} reopens first: interrupted first real pairing recovers both records and next START supplies Home JOIN`,async()=>{
  const g=game(),id=await g.interrupted();
  for(const role of first==="playerOne"?["playerOne","playerTwo"]:["playerTwo","playerOne"]){
    const p=g.page(role);assert.equal((await p.pair.initialize({force:true})).connectionState,"active");
    await p.pair.ensurePartnerRecord();
    assert.equal(g.docs.get(partnerPath(role))?.active,true,`${role}: fresh healthy page restores permanent pairing when neither record existed`);
    assert.equal(g.docs.get(partnerPath(role)).pairedViaRivalryId,id);
    assert.deepEqual(Object.keys(g.docs.get(partnerPath(role))).sort(),["active","myRole","pairedAt","pairedViaRivalryId","partnerAccountId","schemaVersion","updatedAt"]);
  }
  // Finish the accepted Showdown (the terminal provider is outside this client contract).
  g.docs.get(`rivalries/${id}`).data.connectionState="closed";g.advance(1000);g.prepare("playerOne");
  const d=g.page("playerOne"),n=g.page("playerTwo");await d.pair.initialize({force:true});await n.pair.initialize({force:true});
  const next=await d.pair.startPairing({managerRole:"playerOne"});assert.match(next.capability,/^CMS17-pair_/);
  await n.pair.readPartnerRecord();await n.pair.readJoinNote({fresh:true});
  assert.equal(n.pair.getJoinNoteState().note?.rivalryId,next.rivalryId,"Nik's Home has Daniel's next JOIN note");
  assert.equal((await n.pair.joinPairing(next.capability,{managerRole:"playerTwo",autoContinue:false})).connectionState,"active");
});

test("a failed fresh-page repair stays retriable on the same page once the connection returns",async()=>{
  const g=game();await g.interrupted();const n=g.page("playerTwo");await n.pair.initialize({force:true});await n.pair.readPartnerRecord();
  g.failWrites(2);const first=n.pair.ensurePartnerRecord();assert.equal(n.pair.ensurePartnerRecord(),first,"recovery has one flight");await first;assert.equal(g.docs.has(partnerPath("playerTwo")),false);
  const attempts=g.transactions.length;await n.pair.ensurePartnerRecord();assert.equal(g.transactions.length,attempts,"no retry within 30 seconds");
  g.failWrites(0);g.advance(31000);await n.pair.ensurePartnerRecord();assert.equal(g.docs.get(partnerPath("playerTwo"))?.active,true);
  const count=g.transactions.filter(t=>t.writes.includes(partnerPath("playerTwo"))).length;
  await n.pair.ensurePartnerRecord();assert.equal(g.transactions.filter(t=>t.writes.includes(partnerPath("playerTwo"))).length,count,"settled repair never rewrites the record");
});

for(const change of ["test-no-marker","hidden-test","pre-career-test","own-unpair","other-unpair","foreign-membership","wrong-role","closed","unreadable-marker"])test(`recovery guard: ${change}`,async()=>{
  const g=game(),id=await g.interrupted(),role="playerTwo",marker=`accounts/${UID[role]}/careerStart/current`,r=g.docs.get(`rivalries/${id}`);
  if(change==="test-no-marker")g.docs.delete(marker);
  if(change==="unreadable-marker")g.setMarkerUnavailable(true);
  if(change==="hidden-test")g.docs.get(marker).data.hiddenRivalryIds=[id];
  if(change==="pre-career-test")g.docs.get(marker).data.startedAt=ts(r.data.createdAt.toMillis()+36*60000);
  if(change==="own-unpair"||change==="other-unpair"){
    const owner=change==="own-unpair"?role:"playerOne",other=owner===role?"playerOne":role;
    g.docs.set(partnerPath(owner),{schemaVersion:1,partnerAccountId:UID[other],myRole:owner,pairedViaRivalryId:id,pairedAt:ts(1),active:false,updatedAt:ts(1)});
  }
  if(change==="foreign-membership")r.data.managerSlots[1].accountId="stranger";
  if(change==="wrong-role")g.docs.get(`accounts/${UID[role]}/pairLinks/current`).data.managerRole="playerOne";
  if(change==="closed")r.data.connectionState="closed";
  const p=g.page(role);await p.pair.initialize({force:true});const before=g.docs.get(partnerPath(role));
  await p.pair.ensurePartnerRecord();assert.equal(g.docs.get(partnerPath(role)),before,"no permanent partner created or reactivated");
});

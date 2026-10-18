"use strict";
// r79 PR3: the permanent pairing client (js/persistentNikDanielPair.js contractVersion 5). The pair module runs in a sandbox
// with an in-memory Firestore that records every transaction (reads and writes), an in-memory Save Library and stubbed
// pairing / career-start providers. Owner decisions (2026-10-17) proven here:
//   PC1 first real pairing: Daniel (marker, no active partner) gets a CMS17R- code; Nik writes his career start marker BEFORE
//       redeeming; after redeem both write accounts/{uid}/partner/current, Daniel only after reading the rivalry ACTIVE with
//       Nik's account in the playerTwo slot; a refused join keeps the createdShell rollback and never redeems without a marker.
//   PC2 Daniel's START for the permanent pair writes Nik's JOIN note in its OWN transaction after createPairing, with the
//       invite's exact expiry; a note that fails never breaks the Showdown (the code still works).
//   PC3 Nik's note read is memoised: at most once per 30 s (failures count), never while hidden, and only for an active
//       playerTwo partner record; a malformed, foreign or expired note never shows JOIN.
//   PC4 the partner record is read once per page load (a failed read retried at most every 30 s); the record and note shapes
//       are exactly the Rules' keys (cmsPartnerDataValid, cmsPartnerInboxWriteValid).
//   PC5 UNPAIR writes only active:false + updatedAt and is blocked while a Showdown is in progress (finish or delete first).
//   PC6 a paired account has no USE A SESSION CODE path in Remote Joining; reload recovery needs the other record.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");

const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const pairSource=read("js/persistentNikDanielPair.js");
const R3=`pair_3${"ab".repeat(31)}c`,R5=`pair_5${"cd".repeat(31)}e`,OLD=`pair_1${"ef".repeat(31)}0`;
const NIK_SAVE=`save_${"1".repeat(24)}`,NIK_PROFILE=`profile_${"2".repeat(24)}`,DANIEL_SAVE=`save_${"5".repeat(24)}`,DANIEL_PROFILE=`profile_${"6".repeat(24)}`;
const UID={playerOne:"uid_daniel",playerTwo:"uid_nik"};
const SERVER_TIME=Object.freeze({__serverTimestamp:true});
let passed=0;
async function check(name,fn){await fn();passed+=1;console.log(`ok ${passed} ${name}`);}
async function settle(){for(let i=0;i<40;i+=1)await new Promise(resolve=>setImmediate(resolve));}
function providerError(code,message){return Object.assign(new Error(message||code),{code});}
const ts=ms=>({toMillis:()=>ms,__ms:ms});

function shellEntry(saveId,profileId,rounds,role){return{saveId,showdown:{totalRounds:rounds,status:"Created",sharedJourney:{mode:"shared",setupPending:true},managers:{playerOne:"Daniel",playerTwo:"Nik"},selectedLeague:null,clubs:{},rounds:[],identity:{managerProfileIds:{[role]:profileId}}}};}
function envelope(objectType,objectId,data,revision=0){return{schemaVersion:1,objectType,objectId,revision,parentRevision:revision?revision-1:null,lifecycleState:"live",contentHash:`sha256:${"9".repeat(64)}`,data};}
function rivalryDoc(id,connectionState,{nik=true}={}){return envelope("rivalry",id,{connectionState,createdByAccountId:UID.playerOne,authorizedAccountIds:nik?[UID.playerOne,UID.playerTwo]:[UID.playerOne],managerSlots:[{slotId:"playerOne",accountId:UID.playerOne,saveId:DANIEL_SAVE,profileId:DANIEL_PROFILE,entitlementState:"active"},nik?{slotId:"playerTwo",accountId:UID.playerTwo,saveId:NIK_SAVE,profileId:NIK_PROFILE,entitlementState:"active"}:{slotId:"playerTwo",accountId:null,saveId:null,profileId:null,entitlementState:"open"}]},nik?1:0);}
function inviteDoc(id,expiresAtMs,state="open"){return envelope("invite",id,{purpose:"rivalry-pairing",slotId:"playerTwo",createdByAccountId:UID.playerOne,expiresAt:ts(expiresAtMs),state});}
// Daniel's open code as a code holder can read it: pending rivalry (playerTwo slot free) and its open, unexpired invite.
function joinable(id,{expiresAtMs=Date.now()+600000,state="open"}={}){return{[`rivalries/${id}`]:rivalryDoc(id,"pending-pair",{nik:false}),[`rivalries/${id}/invites/${id}`]:inviteDoc(id,expiresAtMs,state)};}
function linkDoc(id,role){return envelope("pairLink","current",{rivalryId:id,managerRole:role,managerId:role==="playerOne"?"daniel":"nik",linkedAt:ts(1),lastConfirmedAt:ts(1)});}
function partnerDoc(partnerAccountId,myRole,rivalryId,active=true){return{schemaVersion:1,partnerAccountId,myRole,pairedViaRivalryId:rivalryId,pairedAt:ts(1000),active,updatedAt:ts(1000)};}
function noteDoc(rivalryId,totalSeasons,fromAccountId,expiresAtMs){return{schemaVersion:1,rivalryId,totalSeasons,fromAccountId,createdAt:ts(Date.now()),expiresAt:ts(expiresAtMs)};}

function harness({role="playerTwo",docs:seed={},saves=[],activeSaveId=null,marker="none",markerError=null,redeem,create}={}){
  const uid=UID[role],deviceId=role==="playerTwo"?"device_nik":"device_daniel";
  const docs=new Map(Object.entries(seed));
  const library={activeSaveId,saves:saves.map(entry=>JSON.parse(JSON.stringify(entry)))};
  const log=[],transactions=[],timers=[],fresh=[],server=[],deleted=[];
  const h={failReads:null,hidden:false,markerStatus:marker};
  const firestoreSdk={
    doc:(_db,...parts)=>({path:parts.join("/")}),
    Timestamp:{fromMillis:ms=>ts(ms)},
    serverTimestamp:()=>SERVER_TIME,
    runTransaction:async(_db,fn)=>{
      const record={reads:[],writes:[]};transactions.push(record);
      const pending=[];
      const tx={get:async ref=>{if(h.failReads&&h.failReads(ref.path))throw providerError(h.failCode||"unavailable",h.failCode==="permission-denied"?"Missing or insufficient permissions.":"offline");record.reads.push(ref.path);return{exists:()=>docs.has(ref.path),data:()=>JSON.parse(JSON.stringify(docs.get(ref.path)),(k,v)=>v&&typeof v==="object"&&"__ms" in v?ts(v.__ms):v)};},set:(ref,value)=>{pending.push([ref.path,value]);}};
      const result=await fn(tx);
      for(const [key,value] of pending){record.writes.push(key);docs.set(key,value);log.push(`write ${key}`);}
      return result;
    }
  };
  const pairing={
    initialize:async()=>({}),getState:()=>({registered:true,deviceId}),
    localBindingOptions:()=>{const entry=library.saves.find(item=>item.saveId===library.activeSaveId),profileId=entry?.showdown?.identity?.managerProfileIds?.[role];return entry&&profileId?[{managerRole:role,saveId:entry.saveId,profileId}]:[];},
    getOrCreateDeviceIdentity:async()=>({deviceId}),
    redeemPairing:async options=>{log.push(`redeem ${options.capability}`);return redeem?redeem(options,h):{ok:false,code:"PAIRING_REDEEM_FAILED",message:"unconfigured"};},
    createPairing:async options=>{log.push(`create ${options.capability}`);return create?create(options,h):{ok:false,code:"PAIRING_CREATE_FAILED",message:"unconfigured"};},
    pairingJoinErrorMessage:error=>error?.message||"The code could not be joined."
  };
  const markerApi={
    readCurrentMarker:async()=>{log.push("marker read");return{status:h.markerStatus};},
    startRealCareer:async()=>{log.push("marker write");if(markerError)throw markerError;h.markerStatus="ready";return{status:"ready",active:true};}
  };
  const sandbox={
    console,TextEncoder,crypto:webcrypto,Promise,Date,
    setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length;},clearTimeout:()=>{},
    document:{get visibilityState(){return h.hidden?"hidden":"visible";},querySelector:()=>null,getElementById:()=>null},
    CustomEvent:class{constructor(type,init){this.type=type;this.detail=init&&init.detail;}},
    dispatchEvent:event=>{log.push(`event ${event.type}`);return true;},
    CareerModeFirestoreBudget:{services:s=>s,wantFresh:p=>fresh.push(p),readServerNext:p=>server.push(p),quotaMessage:()=>null},
    CareerModeOnlinePlayerIdentity:{getState:()=>({managerId:role==="playerTwo"?"nik":"daniel"})},
    CareerModeSparkConnectedAccount:{initialize:async()=>({}),getState:()=>({connected:true,accountId:uid})},
    CareerModeSparkPrivatePairing:pairing,
    CareerModeCareerStartMarker:markerApi,
    CareerModeSaveLibraryRuntime:{isReady:()=>true,getLibrarySnapshot:()=>JSON.parse(JSON.stringify(library)),switchActiveSave:async id=>{library.activeSaveId=id;return true;},deleteSave:id=>{deleted.push(id);library.saves=library.saves.filter(e=>e.saveId!==id);if(library.activeSaveId===id)library.activeSaveId=null;return{ok:true,deletedSaveId:id};}},
    CareerModeProductionSharedJourneyEntry:{provisionJoinerShell:async rounds=>{log.push("provision");library.saves.push(shellEntry(NIK_SAVE,NIK_PROFILE,Number(rounds),"playerTwo"));library.activeSaveId=NIK_SAVE;return true;}},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid}},firestore:{},firestoreSdk})}
  };
  vm.createContext(sandbox);
  vm.runInContext(pairSource,sandbox,{filename:"js/persistentNikDanielPair.js"});
  const pair=sandbox.CareerModePersistentNikDanielPair;
  return Object.assign(h,{pair,docs,library,log,transactions,timers,fresh,server,deleted,uid,firestoreSdk,sandbox});
}
// Nik's redeem: the durable pair-link witness plus the activated rivalry in one transaction (as sparkPrivatePairing does).
async function commitRedeem(options,h){
  return h.firestoreSdk.runTransaction({},async transaction=>{
    const witness=await options.durableWitness({transaction,binding:options.binding,capability:options.capability,now:ts(Date.now()),nowEpochMs:Date.now()});
    transaction.set({path:`rivalries/${options.capability}`},rivalryDoc(options.capability,"active"));
    transaction.set({path:`rivalries/${options.capability}/invites/${options.capability}`},inviteDoc(options.capability,Date.now()+600000,"redeemed"));
    return{ok:true,rivalryId:options.capability,durableWitness:witness};
  });
}
// Daniel's createPairing: witness + pending rivalry + open invite in one transaction; returns the invite expiry.
function commitCreate(expiresAtEpochMs){
  return async(options,h)=>{
    const witness=await h.firestoreSdk.runTransaction({},async transaction=>{
      const w=await options.durableWitness({transaction,binding:options.binding,capability:options.capability,now:ts(Date.now()),nowEpochMs:Date.now()});
      transaction.set({path:`rivalries/${options.capability}`},rivalryDoc(options.capability,"pending-pair",{nik:false}));
      transaction.set({path:`rivalries/${options.capability}/invites/${options.capability}`},inviteDoc(options.capability,expiresAtEpochMs));
      return w;
    });
    return{ok:true,rivalryId:options.capability,capability:options.capability,expiresAtEpochMs,durableWitness:witness};
  };
}
const PARTNER_KEYS=["active","myRole","pairedAt","pairedViaRivalryId","partnerAccountId","schemaVersion","updatedAt"];
const NOTE_KEYS=["createdAt","expiresAt","fromAccountId","rivalryId","schemaVersion","totalSeasons"];
const danielShell=()=>shellEntry(DANIEL_SAVE,DANIEL_PROFILE,3,"playerOne");

(async()=>{
await check("PC1a first real pairing (Nik): CMS17R- writes his marker BEFORE redeeming, then his partner record after the redeem",async()=>{
  const h=harness({docs:joinable(R3),redeem:commitRedeem});
  await h.pair.initialize({force:true});
  const joined=await h.pair.joinPairing(`Daniel: CMS17R-${R3}`,{managerRole:"playerTwo",autoContinue:false});
  assert.equal(joined.status,"paired");assert.equal(joined.connectionState,"active");
  const order=h.log.filter(line=>/^marker write|^redeem|^write accounts\/uid_nik\/partner/.test(line));
  assert.deepEqual(order,["marker write",`redeem ${R3}`,"write accounts/uid_nik/partner/current"],"marker -> redeem -> partner record");
  const record=h.docs.get("accounts/uid_nik/partner/current");
  assert.deepEqual(Object.keys(record).sort(),PARTNER_KEYS,"exactly the Rules' partner keys");
  assert.deepEqual({...record},{schemaVersion:1,partnerAccountId:UID.playerOne,myRole:"playerTwo",pairedViaRivalryId:R3,pairedAt:SERVER_TIME,active:true,updatedAt:SERVER_TIME},"pairedAt and updatedAt are the server's request time");
  const partnerTx=h.transactions.find(t=>t.writes.includes("accounts/uid_nik/partner/current"));
  assert.deepEqual(partnerTx.reads,[`rivalries/${R3}`,"accounts/uid_nik/partner/current"],"the partner write re-reads the ACTIVE rivalry first");
  assert.equal(h.pair.getPartnerState().record.active,true);
});

await check("PC1f Codex #903: the R prefix is only text, so a CMS17R- code that cannot be joined (expired, used, unknown, unreadable, made by Nik, wrong slot) writes nothing: no marker, no shell, no redeem, the normal join error",async()=>{
  const nikMade=joinable(R3);nikMade[`rivalries/${R3}/invites/${R3}`]={...nikMade[`rivalries/${R3}/invites/${R3}`],data:{...nikMade[`rivalries/${R3}/invites/${R3}`].data,createdByAccountId:UID.playerTwo}};
  const wrongSlot=joinable(R3);wrongSlot[`rivalries/${R3}/invites/${R3}`]={...wrongSlot[`rivalries/${R3}/invites/${R3}`],data:{...wrongSlot[`rivalries/${R3}/invites/${R3}`].data,slotId:"playerOne"}};
  const taken={...joinable(R3),[`rivalries/${R3}`]:rivalryDoc(R3,"active")};
  const cases=[
    ["expired invite",joinable(R3,{expiresAtMs:Date.now()-1000}),"PAIRING_CAPABILITY_EXPIRED"],
    ["redeemed invite",joinable(R3,{state:"redeemed"}),"PAIRING_CAPABILITY_ALREADY_USED"],
    ["unknown code",{},"PAIRING_CAPABILITY_NOT_FOUND"],
    ["unreadable (offline)",joinable(R3),"unavailable",path=>path.startsWith(`rivalries/${R3}`)],
    ["refused by Rules (permission-denied)",joinable(R3),"permission-denied",path=>path.startsWith(`rivalries/${R3}`),"permission-denied"],
    ["made by Nik's own account",nikMade,"PAIRING_CREATOR_CANNOT_REDEEM"],
    ["code for Daniel's slot",wrongSlot,"PAIRING_SLOT_MISMATCH"],
    ["playerTwo slot already taken",taken,"PAIRING_RIVALRY_NOT_JOINABLE"]
  ];
  for(const [label,docs,code,failReads,failCode] of cases){
    const h=harness({docs,redeem:commitRedeem});
    await h.pair.initialize({force:true});
    if(failReads)h.failReads=failReads;if(failCode)h.failCode=failCode;
    // a tampered prefix: Daniel's plain CMS17- code edited to CMS17R-
    const refused=await h.pair.joinPairing(`CMS17R-${R3}`,{managerRole:"playerTwo",autoContinue:false});
    assert.equal(refused.status,"error",`${label}: the join is refused`);
    assert.ok(!h.log.includes("marker write"),`${label}: no career start marker is written`);
    assert.ok(!h.log.includes("provision")&&!h.log.some(line=>line.startsWith("redeem")),`${label}: no shell, no redeem`);
    assert.ok(!h.docs.has("accounts/uid_nik/careerStart/current")&&!h.docs.has("accounts/uid_nik/partner/current"),`${label}: nothing is written`);
    assert.equal(h.transactions.filter(t=>t.writes.length).length,0,`${label}: no transaction wrote anything`);
    assert.equal(h.library.saves.length,0,`${label}: no shell is left`);
    assert.ok(typeof refused.message==="string"&&refused.message.length>0,`${label}: the normal join error is shown (${code})`);
  }
  // control: the same tampered prefix on a joinable code still reads the capability first, then writes the marker
  const ok=harness({docs:joinable(R3),redeem:commitRedeem});await ok.pair.initialize({force:true});
  await ok.pair.joinPairing(`CMS17R-${R3}`,{managerRole:"playerTwo",autoContinue:false});
  const checkTx=ok.transactions.findIndex(t=>t.reads.includes(`rivalries/${R3}/invites/${R3}`)&&!t.writes.length);
  assert.ok(checkTx>=0&&ok.log.indexOf("marker write")>=0,"joinable: capability read, then marker");
  assert.deepEqual(ok.transactions[checkTx].reads,[`rivalries/${R3}`,`rivalries/${R3}/invites/${R3}`],"the check reads exactly the rivalry and its invite (what the redeem reads)");
});

await check("PC1b a marker that already exists is not written again; a plain CMS17- code never writes a marker or a partner record",async()=>{
  const real=harness({marker:"ready",docs:joinable(R3),redeem:commitRedeem});
  await real.pair.initialize({force:true});
  await real.pair.joinPairing(`CMS17R-${R3}`,{managerRole:"playerTwo",autoContinue:false});
  assert.ok(!real.log.includes("marker write"),"an existing marker is kept as it is");
  assert.ok(real.docs.has("accounts/uid_nik/partner/current"));
  const test=harness({redeem:commitRedeem});
  await test.pair.initialize({force:true});
  const joined=await test.pair.joinPairing(`CMS17-${R3}`,{managerRole:"playerTwo",autoContinue:false});
  assert.equal(joined.status,"paired");
  assert.ok(!test.log.includes("marker write"),"a test code never writes the marker (it only reads it: Codex #904)");
  assert.ok(!test.docs.has("accounts/uid_nik/partner/current"),"a test code never writes a partner record");
});

await check("PC1h Codex #904 (10-season audit): real vs test fails closed. Nik with a marker and no active record refuses a plain CMS17- code; an unreadable marker or partner record refuses; Daniel's START never makes a test code for a real account it could not check",async()=>{
  const nothingWritten=h=>{assert.ok(!h.log.some(line=>/^(redeem|create|provision|write|marker write)/.test(line)),`nothing is joined, made or written: ${h.log.join(", ")}`);};
  const realNik=harness({marker:"ready",docs:joinable(R3),redeem:commitRedeem});
  await realNik.pair.initialize({force:true});
  const refused=await realNik.pair.joinPairing(`CMS17-${R3}`,{managerRole:"playerTwo",autoContinue:false});
  assert.equal(refused.status,"error");assert.match(refused.message,/test code.*real career has started.*CMS17R-/);nothingWritten(realNik);
  const unpairedNik=harness({marker:"ready",docs:{...joinable(R3),"accounts/uid_nik/partner/current":partnerDoc(UID.playerOne,"playerTwo",OLD,false)},redeem:commitRedeem});
  await unpairedNik.pair.initialize({force:true});
  assert.equal((await unpairedNik.pair.joinPairing(`CMS17-${R3}`,{managerRole:"playerTwo",autoContinue:false})).status,"error","an UNPAIRed real Nik is still real");nothingWritten(unpairedNik);
  const unknownNik=harness({marker:"unknown",docs:joinable(R3),redeem:commitRedeem});
  await unknownNik.pair.initialize({force:true});
  const unknown=await unknownNik.pair.joinPairing(`CMS17-${R3}`,{managerRole:"playerTwo",autoContinue:false});
  assert.equal(unknown.status,"error");assert.match(unknown.message,/could not be checked.*nothing was started/);nothingWritten(unknownNik);
  const flakyNik=harness({docs:joinable(R3),redeem:commitRedeem});
  flakyNik.failReads=p=>p.endsWith("/partner/current");
  await flakyNik.pair.initialize({force:true});
  assert.match((await flakyNik.pair.joinPairing(`CMS17-${R3}`,{managerRole:"playerTwo",autoContinue:false})).message,/could not be checked/);nothingWritten(flakyNik);
  const pairedNik=harness({marker:"ready",docs:{...joinable(R3),"accounts/uid_nik/partner/current":partnerDoc(UID.playerOne,"playerTwo",OLD)},redeem:commitRedeem});
  await pairedNik.pair.initialize({force:true});
  assert.equal((await pairedNik.pair.joinPairing(`CMS17-${R3}`,{managerRole:"playerTwo",autoContinue:false})).status,"paired","the permanent pair's plain code (JOIN note or backup code) still joins");
  assert.ok(!pairedNik.log.includes("marker read"),"an active record answers without reading the marker");
  const strangerDocs=joinable(R3);strangerDocs[`rivalries/${R3}/invites/${R3}`].data.createdByAccountId="uid_stranger";
  const strayNik=harness({marker:"ready",docs:{...strangerDocs,"accounts/uid_nik/partner/current":partnerDoc(UID.playerOne,"playerTwo",OLD)},redeem:commitRedeem});
  await strayNik.pair.initialize({force:true});
  const stray=await strayNik.pair.joinPairing(`CMS17-${R3}`,{managerRole:"playerTwo",autoContinue:false});
  assert.equal(stray.status,"error");assert.match(stray.message,/not made by the account you are paired with/,"Codex #909: a paired Nik never joins a plain code from another account");nothingWritten(strayNik);
  const strayReal=harness({marker:"ready",docs:{...strangerDocs,"accounts/uid_nik/partner/current":partnerDoc(UID.playerOne,"playerTwo",OLD)},redeem:commitRedeem});
  await strayReal.pair.initialize({force:true});
  assert.match((await strayReal.pair.joinPairing(`CMS17R-${R3}`,{managerRole:"playerTwo",autoContinue:false})).message,/not made by the account you are paired with/,"Codex #909: the R prefix is only text, so it never skips the partner checks");nothingWritten(strayReal);
  const swapped=harness({marker:"ready",docs:{...joinable(R3),"accounts/uid_nik/partner/current":partnerDoc(UID.playerOne,"playerOne",OLD)},redeem:commitRedeem});
  await swapped.pair.initialize({force:true});
  const seat=await swapped.pair.joinPairing(`CMS17-${R3}`,{managerRole:"playerTwo",autoContinue:false});
  assert.equal(seat.status,"error");assert.match(seat.message,/other manager's seat/,"Codex #909: a record for the other seat never authorises a join");nothingWritten(swapped);
  for(const [label,setup] of [["marker unknown",{marker:"unknown"}],["partner record unreadable",{marker:"ready",flaky:true}]]){
    const daniel=harness({role:"playerOne",marker:setup.marker,saves:[danielShell()],activeSaveId:DANIEL_SAVE,create:commitCreate(Date.now()+20*60000)});
    if(setup.flaky)daniel.failReads=p=>p.endsWith("/partner/current");
    await daniel.pair.initialize({force:true});
    const started=await daniel.pair.startPairing({managerRole:"playerOne"});
    assert.equal(started.status,"error",label);assert.ok(!started.capability,`${label}: no code at all`);assert.match(started.message,/could not be checked/,label);
    assert.ok(!daniel.log.some(line=>line.startsWith("create ")),`${label}: no Showdown is made`);
  }
  const testDaniel=harness({role:"playerOne",marker:"none",saves:[danielShell()],activeSaveId:DANIEL_SAVE,create:commitCreate(Date.now()+20*60000)});
  await testDaniel.pair.initialize({force:true});
  assert.match((await testDaniel.pair.startPairing({managerRole:"playerOne"})).capability,/^CMS17-pair_/,"a test account (no marker) still gets its test code");
  const reloaded=harness({role:"playerOne",marker:"unknown",saves:[danielShell()],activeSaveId:DANIEL_SAVE,docs:{"accounts/uid_daniel/pairLinks/current":linkDoc(R3,"playerOne"),...joinable(R3)}});
  const shown=await reloaded.pair.initialize({force:true});
  assert.equal(shown.connectionState,"pending-pair");assert.equal(shown.capability,null,"after a reload an unchecked first pairing shows no code (never a plain one)");assert.match(shown.message,/CHECK STATUS/);
  reloaded.markerStatus="ready";
  assert.match((await reloaded.pair.initialize({force:true})).capability,/^CMS17R-/,"CHECK STATUS asks again and shows the real code");
});

await check("PC1c the marker comes first: a marker that cannot be written stops the join before any shell or redeem; a refused redeem keeps the createdShell rollback",async()=>{
  const blocked=harness({markerError:providerError("CAREER_START_SHOWDOWN_UNFINISHED","Finish or delete the current Showdown before starting your real career."),docs:joinable(R3),redeem:commitRedeem});
  await blocked.pair.initialize({force:true});
  const refused=await blocked.pair.joinPairing(`CMS17R-${R3}`,{managerRole:"playerTwo",autoContinue:false});
  assert.equal(refused.status,"error");
  assert.ok(!blocked.log.includes("provision")&&!blocked.log.some(line=>line.startsWith("redeem")),"no shell, no redeem without the marker");
  assert.equal(blocked.library.saves.length,0);
  const denied=harness({docs:joinable(R3),redeem:async()=>({ok:false,code:"permission-denied",message:"denied"})});
  await denied.pair.initialize({force:true});
  await denied.pair.joinPairing(`CMS17R-${R3}`,{managerRole:"playerTwo",autoContinue:false});
  assert.ok(denied.log.indexOf("marker write")<denied.log.indexOf(`redeem ${R3}`));
  assert.deepEqual(denied.deleted,[NIK_SAVE],"the empty shell this attempt created is removed after a definite refusal");
  assert.ok(!denied.docs.has("accounts/uid_nik/partner/current"),"no partner record without an ACTIVE pairing");
  const source=pairSource.slice(pairSource.indexOf("async function pairJoinPairing"),pairSource.indexOf("function pairContextualJoinMessage"));
  assert.match(source,/manager=pairRequireCurrentIdentity\(role\);[^]*?if\(parsed\.real&&role==="playerTwo"\)\{\/\*[^*]*\*\/await pairCheckJoinableBeforeMarker\(context,parsed\.rivalryId,role\);await pairEnsureOwnMarkerBeforeRealJoin\(\);\}const knownSaveIds=/,"the code is checked joinable, then the marker is ensured, before the shell is provisioned");
});

await check("PC1d first real pairing (Daniel): CMS17R- code, no note; his waiting poll writes his record only after reading the rivalry ACTIVE with Nik in playerTwo, then continues",async()=>{
  const expiresAt=Date.now()+20*60000;
  const h=harness({role:"playerOne",marker:"ready",saves:[danielShell()],activeSaveId:DANIEL_SAVE,create:commitCreate(expiresAt)});
  await h.pair.initialize({force:true});
  const waiting=await h.pair.startPairing({managerRole:"playerOne"});
  assert.match(waiting.capability,/^CMS17R-pair_3[0-9a-f]{63}$/,"the first real pairing's code carries CMS17R-");
  const rivalryId=waiting.rivalryId;
  assert.ok(![...h.docs.keys()].some(key=>key.includes("partnerInbox")),"no JOIN note before the pair exists");
  assert.ok(!h.docs.has("accounts/uid_daniel/partner/current"),"no partner record while pending");
  // Daniel reloads while waiting: the code keeps its CMS17R- form (partner memo + marker, no new read of either)
  const reads=h.transactions.length;
  const again=await h.pair.initialize({force:true});
  assert.equal(again.capability,`CMS17R-${rivalryId}`);
  assert.ok(h.transactions.length-reads<=1,"the reload re-reads only the pair link transaction (partner record memoised)");
  // Nik joins: the rivalry is ACTIVE with Nik in playerTwo, then the 4 s waiting poll runs.
  h.docs.set(`rivalries/${rivalryId}`,rivalryDoc(rivalryId,"active"));
  const tick=h.timers.filter(t=>t.ms===4000).pop();
  assert.ok(tick,"the waiting poll is scheduled");
  tick.fn();await settle();
  const record=h.docs.get("accounts/uid_daniel/partner/current");
  assert.deepEqual({...record},{schemaVersion:1,partnerAccountId:UID.playerTwo,myRole:"playerOne",pairedViaRivalryId:rivalryId,pairedAt:SERVER_TIME,active:true,updatedAt:SERVER_TIME});
  const tx=h.transactions.find(t=>t.writes.includes("accounts/uid_daniel/partner/current"));
  assert.equal(tx.reads[0],`rivalries/${rivalryId}`,"the rivalry is read (ACTIVE, Nik in playerTwo) in the same transaction");
  // a pending rivalry or a rivalry without Nik in playerTwo is refused
  await assert.rejects(h.pair.writePartnerRecord({rivalryId:OLD,managerRole:"playerOne"}),/not connected/);
  h.docs.set(`rivalries/${OLD}`,rivalryDoc(OLD,"pending-pair",{nik:false}));
  await assert.rejects(h.pair.writePartnerRecord({rivalryId:OLD,managerRole:"playerOne"}),/not connected/);
  const poll=pairSource.match(/async function pairWaitingPollTick\(\)\{[\s\S]*?\n  \}/)[0];
  assert.match(poll,/const recording=pairRecordRealPairing\(state\.rivalryId,"playerOne"\);await pairAutoContinueAfterConnect\(\);await recording;/,"the record write starts once the tick read ACTIVE and runs alongside the existing auto-continue (never delaying it); the tick waits for both");
});

await check("PC1g #901 merge: Daniel learns Nik joined through any refresh (not only the waiting poll): his record is still written, once, alongside the continue",async()=>{
  const h=harness({role:"playerOne",marker:"ready",saves:[danielShell()],activeSaveId:DANIEL_SAVE,create:commitCreate(Date.now()+20*60000)});
  await h.pair.initialize({force:true});
  const waiting=await h.pair.startPairing({managerRole:"playerOne"});const rivalryId=waiting.rivalryId;
  assert.match(waiting.capability,/^CMS17R-/);
  h.docs.set(`rivalries/${rivalryId}`,rivalryDoc(rivalryId,"active"));
  // an identity / online refresh (or CHECK STATUS) sees ACTIVE first; the 4 s poll never runs
  await h.pair.initialize({force:true});await settle();
  const record=h.docs.get("accounts/uid_daniel/partner/current");
  assert.equal(record?.active,true,"Daniel's record is written");assert.equal(record.pairedViaRivalryId,rivalryId);
  const writes=h.transactions.filter(t=>t.writes.includes("accounts/uid_daniel/partner/current"));
  assert.equal(writes.length,1,"exactly one record write");
  assert.deepEqual(writes[0].reads.slice(0,1),[`rivalries/${rivalryId}`],"after re-reading the rivalry ACTIVE");
  // the waiting poll firing late shares the same single-flight write: nothing more
  const tick=h.timers.filter(t=>t.ms===4000).pop();if(tick){tick.fn();await settle();}
  assert.equal(h.transactions.filter(t=>t.writes.includes("accounts/uid_daniel/partner/current")).length,1,"no second write");
});

await check("PC1e only the rivalry this page paired with CMS17R- writes a record; an existing record for another account is never replaced",async()=>{
  const h=harness({role:"playerOne",docs:{[`rivalries/${R3}`]:rivalryDoc(R3,"active"),"accounts/uid_daniel/partner/current":partnerDoc("uid_someone","playerOne",OLD)}});
  await assert.rejects(h.pair.writePartnerRecord({rivalryId:R3,managerRole:"playerOne"}),/Unpair it/,"PERMANENT_PARTNER_CONFLICT");
  h.docs.set("accounts/uid_daniel/partner/current",partnerDoc(UID.playerTwo,"playerOne",OLD));
  const same=await h.pair.writePartnerRecord({rivalryId:R3,managerRole:"playerOne"});
  assert.equal(same.status,"already-paired");
  assert.equal(h.transactions.at(-1).writes.length,0,"an existing matching record is not rewritten");
  h.docs.set("accounts/uid_daniel/partner/current",partnerDoc(UID.playerTwo,"playerOne",OLD,false));
  assert.equal((await h.pair.writePartnerRecord({rivalryId:R3,managerRole:"playerOne"})).status,"re-paired","re-pair after UNPAIR");
  assert.equal(h.docs.get("accounts/uid_daniel/partner/current").pairedViaRivalryId,R3);
});

await check("PC2a Daniel's START for the permanent pair: plain CMS17- code, then the JOIN note in its OWN transaction with the invite's exact expiry",async()=>{
  const expiresAt=Date.now()+20*60000;
  const h=harness({role:"playerOne",marker:"ready",saves:[danielShell()],activeSaveId:DANIEL_SAVE,docs:{"accounts/uid_daniel/partner/current":partnerDoc(UID.playerTwo,"playerOne",OLD),"accounts/uid_nik/partner/current":partnerDoc(UID.playerOne,"playerTwo",OLD)},create:commitCreate(expiresAt)});
  await h.pair.initialize({force:true});
  const waiting=await h.pair.startPairing({managerRole:"playerOne"});
  assert.match(waiting.capability,/^CMS17-pair_3[0-9a-f]{63}$/,"a permanent pair's code stays CMS17- (the backup)");
  assert.equal(waiting.status,"waiting");assert.match(waiting.message,/JOIN on his Home/);
  const createIndex=h.log.findIndex(line=>line.startsWith("create ")),noteIndex=h.log.indexOf("write accounts/uid_nik/partnerInbox/current");
  assert.ok(createIndex>=0&&noteIndex>createIndex,"the note is written after createPairing");
  const noteTx=h.transactions.find(t=>t.writes.includes("accounts/uid_nik/partnerInbox/current"));
  assert.deepEqual(noteTx.writes,["accounts/uid_nik/partnerInbox/current"],"its own transaction writes only the note");
  assert.deepEqual(noteTx.reads,[],"the expiry comes from createPairing (no extra read)");
  const note=h.docs.get("accounts/uid_nik/partnerInbox/current");
  assert.deepEqual(Object.keys(note).sort(),NOTE_KEYS,"exactly the Rules' note keys");
  assert.equal(note.rivalryId,waiting.rivalryId);assert.equal(note.totalSeasons,3);assert.equal(note.fromAccountId,UID.playerOne);
  assert.equal(note.schemaVersion,1);assert.equal(note.createdAt,SERVER_TIME);assert.equal(note.expiresAt.toMillis(),expiresAt,"expiresAt == the invite's expiresAt");
  assert.equal(h.docs.get(`rivalries/${waiting.rivalryId}/invites/${waiting.rivalryId}`).data.expiresAt.__ms,expiresAt);
  assert.ok(!h.log.includes("marker read"),"a paired Daniel never needs the marker read");
  // without a handed-over expiry the note transaction reads the open invite itself
  await h.pair.writeJoinNote({rivalryId:waiting.rivalryId});
  assert.deepEqual(h.transactions.at(-1).reads,[`rivalries/${waiting.rivalryId}/invites/${waiting.rivalryId}`]);
  h.docs.set(`rivalries/${waiting.rivalryId}/invites/${waiting.rivalryId}`,inviteDoc(waiting.rivalryId,Date.now()-1000));
  await assert.rejects(h.pair.writeJoinNote({rivalryId:waiting.rivalryId}),/expired/,"an expired invite gets no note");
});

await check("PC2b a JOIN note that cannot be written never breaks the Showdown: the waiting code stays, nothing is retried in a loop",async()=>{
  const h=harness({role:"playerOne",saves:[danielShell()],activeSaveId:DANIEL_SAVE,docs:{"accounts/uid_daniel/partner/current":partnerDoc(UID.playerTwo,"playerOne",OLD),"accounts/uid_nik/partner/current":partnerDoc(UID.playerOne,"playerTwo",OLD)},create:commitCreate(Date.now()+20*60000)});
  await h.pair.initialize({force:true});
  const warnings=[];h.sandbox.console={...console,warn:(...args)=>warnings.push(args.join(" "))};
  const original=h.firestoreSdk.runTransaction;let noteAttempts=0;
  h.firestoreSdk.runTransaction=async(db,fn)=>original(db,async tx=>{const set=tx.set;tx.set=(ref,value)=>{if(ref.path.includes("partnerInbox")){noteAttempts+=1;throw providerError("permission-denied","Missing or insufficient permissions.");}return set(ref,value);};return fn(tx);});
  const waiting=await h.pair.startPairing({managerRole:"playerOne"});
  assert.equal(waiting.status,"waiting");assert.equal(waiting.connectionState,"pending-pair");
  assert.match(waiting.capability,/^CMS17-pair_/,"Nik can still paste the code");
  assert.match(waiting.message,/Send this code to Nik/);
  assert.equal(noteAttempts,1,"one attempt, no retry loop (Rules also refuse a same-rivalry rewrite inside 60 s)");
  assert.deepEqual(warnings,["[Career Mode Showdown] JOIN note for Nik could not be written (permission-denied); the code still works."],"Codex #903: the failed note write is one log line (no UI), with its code");
  // test mode (no partner record): no note at all
  const test=harness({role:"playerOne",saves:[danielShell()],activeSaveId:DANIEL_SAVE,create:commitCreate(Date.now()+20*60000)});
  await test.pair.initialize({force:true});
  const plain=await test.pair.startPairing({managerRole:"playerOne"});
  assert.match(plain.capability,/^CMS17-pair_/,"no marker, no partner: a plain test code");
  assert.ok(![...test.docs.keys()].some(key=>key.includes("partnerInbox")));
  assert.equal((await test.pair.writeJoinNote({rivalryId:plain.rivalryId})).status,"not-paired");
});

await check("PC2c Codex #904: the permanent pair's START stays one busy action until the JOIN note write settles: NEW CODE and CHECK STATUS during the note write start no second createPairing",async()=>{
  for(const outcome of ["written","failed"]){
    let releaseNote=null;const noteGate=new Promise(resolve=>{releaseNote=resolve;});
    const create=commitCreate(Date.now()+20*60000);
    const h=harness({role:"playerOne",marker:"ready",saves:[danielShell()],activeSaveId:DANIEL_SAVE,docs:{"accounts/uid_daniel/partner/current":partnerDoc(UID.playerTwo,"playerOne",OLD),"accounts/uid_nik/partner/current":partnerDoc(UID.playerOne,"playerTwo",OLD)},create:async(options,hh)=>{const result=await create(options,hh);hh.created=true;return result;}});
    await h.pair.initialize({force:true});
    const original=h.firestoreSdk.runTransaction;let noteStarted=false;
    h.firestoreSdk.runTransaction=async(db,fn)=>{if(!h.created)return original(db,fn);noteStarted=true;await noteGate;return original(db,async tx=>{if(outcome==="failed"){tx.set=()=>{throw providerError("unavailable","offline");};}return fn(tx);});};
    h.sandbox.console={...console,warn(){}};
    const first=h.pair.startPairing({managerRole:"playerOne"});
    for(let i=0;i<400&&!noteStarted;i+=1)await new Promise(resolve=>setTimeout(resolve,5));/* real time: device crypto runs off the event loop */
    assert.equal(noteStarted,true,`${outcome}: the note write is under way`);
    const during=h.pair.getState();
    assert.equal(during.status,"waiting",`${outcome}: the code is already shown`);assert.match(during.capability,/^CMS17-pair_/);
    assert.equal(during.busy,true,`${outcome}: the START action is still busy while its note is written`);
    const again=await h.pair.startPairing({managerRole:"playerOne"});
    assert.equal(again.rivalryId,during.rivalryId,`${outcome}: NEW CODE during the note write is the same action, not a new one`);
    const check=h.pair.initialize({force:true});
    assert.equal(h.log.filter(line=>line.startsWith("create ")).length,1,`${outcome}: no second createPairing`);
    releaseNote();
    const done=await first;await check;await settle();
    assert.equal(done.busy,false,`${outcome}: busy ends once the note write settles`);
    assert.equal(h.pair.getState().busy,false,`${outcome}: and stays ended`);
    assert.equal(h.log.filter(line=>line.startsWith("create ")).length,1,`${outcome}: still one createPairing`);
    if(outcome==="written")assert.match(done.message,/JOIN on his Home/);else assert.match(done.message,/Send this code to Nik/,"a failed note keeps the code message");
  }
  // a pair that is not permanent yet (no partner record) has no note, so its waiting state is not busy at all
  const plain=harness({role:"playerOne",marker:"ready",saves:[danielShell()],activeSaveId:DANIEL_SAVE,create:commitCreate(Date.now()+20*60000)});
  await plain.pair.initialize({force:true});
  const waiting=await plain.pair.startPairing({managerRole:"playerOne"});
  assert.equal(waiting.busy,false,"no note to write: the code is ready at once");
});

await check("PC2d Codex #915: Daniel's permanent-pair START makes a code only while Nik's record still names him; an UNPAIR on Nik's side or an unanswered check makes no code (START then leads into PAIR AGAIN)",async()=>{
  for(const [label,nik,flaky,message] of [["Nik unpaired",partnerDoc(UID.playerOne,"playerTwo",OLD,false),false,/no longer paired with you.*nothing was started/],["Nik's record gone",null,false,/no longer paired with you/],["Nik's record unreadable",partnerDoc(UID.playerOne,"playerTwo",OLD),true,/could not be checked.*nothing was started/]]){
    const docs={"accounts/uid_daniel/partner/current":partnerDoc(UID.playerTwo,"playerOne",OLD)};if(nik)docs["accounts/uid_nik/partner/current"]=nik;
    const h=harness({role:"playerOne",marker:"ready",saves:[danielShell()],activeSaveId:DANIEL_SAVE,docs,create:commitCreate(Date.now()+20*60000)});
    if(flaky)h.failReads=p=>p==="accounts/uid_nik/partner/current";
    await h.pair.initialize({force:true});
    const started=await h.pair.startPairing({managerRole:"playerOne"});
    assert.equal(started.status,"error",label);assert.ok(!started.capability,`${label}: no code at all`);assert.match(started.message,message,label);
    assert.ok(!h.log.some(line=>/^(create|write)/.test(line)),`${label}: no Showdown and no note: ${h.log.join(", ")}`);
  }
  // Nik unpairs while Daniel chooses the seasons: the page memo still says mutual, the code-creation read is fresh and sees it.
  const late=harness({role:"playerOne",marker:"ready",saves:[danielShell()],activeSaveId:DANIEL_SAVE,docs:{"accounts/uid_daniel/partner/current":partnerDoc(UID.playerTwo,"playerOne",OLD),"accounts/uid_nik/partner/current":partnerDoc(UID.playerOne,"playerTwo",OLD)},create:commitCreate(Date.now()+20*60000)});
  await late.pair.initialize({force:true});
  await late.pair.readPartnerRecord();const tap=await late.pair.readPartnerSide();assert.equal(tap.status,"mutual",`START tap: Nik still names Daniel (${JSON.stringify(tap)})`);
  late.docs.set("accounts/uid_nik/partner/current",partnerDoc(UID.playerOne,"playerTwo",OLD,false));
  const lateStart=await late.pair.startPairing({managerRole:"playerOne"});
  assert.equal(lateStart.status,"error");assert.match(lateStart.message,/no longer paired with you/,"the code-creation read is fresh, not the START tap's memo");
  assert.ok(!late.log.some(line=>/^(create|write)/.test(line)),"no Showdown and no note after a late UNPAIR");
  assert.equal(late.pair.getPartnerSideState().status,"unpaired","the waiting screen knows Nik unpaired");
  // ...so it offers PAIR AGAIN (START's pair-again flow), never a CREATE CODE that repeats the same error.
  const source=fs.readFileSync(path.join(ROOT,"js/persistentNikDanielPair.js"),"utf8");
  assert.match(source,/if\(role==="playerOne"&&partnerSideState\.status==="unpaired"&&pairPartnerRecordFor\(partnerSideState\.accountId\)\?\.active===true\)\{[^}]*pairCreateElement\("button","menuButton","PAIR AGAIN"\)[\s\S]{0,200}addEventListener\("click",\(\)=>void root\.CareerModeOnlinePlayerIdentity\?\.openStart\?\.\(\)\)/,"Codex #915: a late UNPAIR shows PAIR AGAIN, which runs START");
  // PAIR AGAIN's provider half: Daniel's stale record goes inactive, then the same START makes the first-pairing code for Nik.
  const reset=await late.pair.unpair();assert.equal(reset.ok,true,`PAIR AGAIN unpairs Daniel's stale record: ${JSON.stringify(reset)}`);
  const again=await late.pair.startPairing({managerRole:"playerOne"});
  assert.match(again.capability||"",/^CMS17R-pair_/,`after PAIR AGAIN the code is a first-pairing CMS17R- code: ${JSON.stringify({status:again.status,message:again.message})}`);
});
await check("PC2e Codex #904: an UNPAIR made on another device counts at once in a tab that stayed open: code creation and redeem read this account's own record fresh",async()=>{
  // Daniel's old tab: its page memo still says paired, his record is UNPAIRed elsewhere, so START makes a first-pairing code.
  const daniel=harness({role:"playerOne",marker:"ready",saves:[danielShell()],activeSaveId:DANIEL_SAVE,docs:{"accounts/uid_daniel/partner/current":partnerDoc(UID.playerTwo,"playerOne",OLD),"accounts/uid_nik/partner/current":partnerDoc(UID.playerOne,"playerTwo",OLD)},create:commitCreate(Date.now()+20*60000)});
  await daniel.pair.initialize({force:true});
  assert.equal((await daniel.pair.readPartnerRecord()).record.active,true,"the open tab remembers the active pair");
  daniel.docs.set("accounts/uid_daniel/partner/current",partnerDoc(UID.playerTwo,"playerOne",OLD,false));
  const started=await daniel.pair.startPairing({managerRole:"playerOne"});
  assert.match(started.capability||"",/^CMS17R-pair_/,`an UNPAIRed Daniel never makes a permanent-pair code: ${JSON.stringify({status:started.status,message:started.message})}`);
  assert.ok(daniel.server.includes("accounts/uid_daniel/partner/current"),"the code-creation read of his own record goes to the server");
  assert.ok(!daniel.log.some(line=>/^write.*partnerInbox/.test(line)),`no JOIN note for an UNPAIRed pair: ${daniel.log.join(", ")}`);
  // Nik's old tab: his record is UNPAIRed elsewhere, so a plain code is refused like any test code on a real account.
  const nik=harness({marker:"ready",docs:{...joinable(R3),"accounts/uid_nik/partner/current":partnerDoc(UID.playerOne,"playerTwo",OLD)},redeem:commitRedeem});
  await nik.pair.initialize({force:true});
  assert.equal((await nik.pair.readPartnerRecord()).record.active,true);
  nik.docs.set("accounts/uid_nik/partner/current",partnerDoc(UID.playerOne,"playerTwo",OLD,false));
  const joined=await nik.pair.joinPairing(`CMS17-${R3}`,{managerRole:"playerTwo",autoContinue:false});
  assert.equal(joined.status,"error",`an UNPAIRed Nik never redeems a plain code: ${JSON.stringify(joined)}`);
  assert.ok(nik.server.includes("accounts/uid_nik/partner/current"),"the redeem read of his own record goes to the server");
  assert.ok(!nik.log.some(line=>/^(redeem|create|provision|write|marker write)/.test(line)),`nothing is joined or written: ${nik.log.join(", ")}`);
});
await check("PC2f Codex #904 (P1): an UNPAIR from Daniel's other browser that commits after START's fresh reads stops the code inside the code-creation transaction (no open code Nik could still redeem)",async()=>{
  const DANIEL="accounts/uid_daniel/partner/current",NIK="accounts/uid_nik/partner/current";
  // Daniel's real createPairing: errors come back as ok:false (sparkPrivatePairing's asResultError), never thrown.
  const race=create=>async(options,h)=>{if(h.unpairFirst){h.unpairFirst=false;h.docs.set(DANIEL,partnerDoc(UID.playerTwo,"playerOne",OLD,false));}try{return await create(options,h);}catch(error){return{ok:false,code:error.code,message:error.message};}};
  const h=harness({role:"playerOne",marker:"ready",saves:[danielShell()],activeSaveId:DANIEL_SAVE,docs:{[DANIEL]:partnerDoc(UID.playerTwo,"playerOne",OLD),[NIK]:partnerDoc(UID.playerOne,"playerTwo",OLD)},create:race(commitCreate(Date.now()+20*60000))});
  await h.pair.initialize({force:true});
  h.unpairFirst=true;
  const started=await h.pair.startPairing({managerRole:"playerOne"});
  assert.equal(started.status,"error",JSON.stringify({status:started.status,message:started.message}));
  assert.ok(!started.capability,"no code is shown");
  assert.match(started.message,/unpaired on another screen.*nothing was started/);
  assert.ok(!h.log.some(line=>/^write /.test(line)),`no pending Showdown, no link, no note: ${h.log.join(", ")}`);
  const createTx=h.transactions[h.transactions.length-1];
  assert.equal(createTx.reads[0],DANIEL,"the code-creation transaction reads Daniel's own record first, so a concurrent UNPAIR conflicts with it");
  assert.equal(h.pair.getPartnerState().record.active,false,"this tab now knows the pair was unpaired");
  assert.equal(h.pair.getPartnerSideState().status,"not-paired");
  // START again is Daniel's first real pairing: a CMS17R- code (the same flow as PAIR AGAIN).
  const again=await h.pair.startPairing({managerRole:"playerOne"});
  assert.match(again.capability||"",/^CMS17R-pair_/,JSON.stringify({status:again.status,message:again.message}));
  // Control: with the pair still active the same transaction reads the record and the permanent-pair code is made.
  const ok=harness({role:"playerOne",marker:"ready",saves:[danielShell()],activeSaveId:DANIEL_SAVE,docs:{[DANIEL]:partnerDoc(UID.playerTwo,"playerOne",OLD),[NIK]:partnerDoc(UID.playerOne,"playerTwo",OLD)},create:race(commitCreate(Date.now()+20*60000))});
  await ok.pair.initialize({force:true});
  const made=await ok.pair.startPairing({managerRole:"playerOne"});
  assert.match(made.capability||"",/^CMS17-pair_/,JSON.stringify({status:made.status,message:made.message}));
  assert.ok(ok.transactions.some(tx=>tx.reads[0]===DANIEL&&tx.writes.some(path=>/^rivalries\//.test(path))),"the committed code-creation transaction read Daniel's record");
});
await check("PC2g Codex #904 (P1): Nik's UNPAIR racing Daniel's START never leaves Daniel an open code Nik can never join: before the code it conflicts inside the code-creation transaction; between the code and its JOIN note the refused note leads to one fresh check and the code is closed",async()=>{
  const DANIEL="accounts/uid_daniel/partner/current",NIK="accounts/uid_nik/partner/current",INBOX="accounts/uid_nik/partnerInbox/current";
  const refusedId=h=>(h.log.find(line=>line.startsWith("create "))||"").slice(7);
  const asResult=create=>async(options,h)=>{try{return await create(options,h);}catch(error){return{ok:false,code:error.code,message:error.message};}};
  const docs=()=>({[DANIEL]:partnerDoc(UID.playerTwo,"playerOne",OLD),[NIK]:partnerDoc(UID.playerOne,"playerTwo",OLD)});
  // 1. Nik's UNPAIR commits after START's fresh partner-side read, before createPairing commits.
  const before=harness({role:"playerOne",marker:"ready",saves:[danielShell()],activeSaveId:DANIEL_SAVE,docs:docs(),create:asResult(async(options,h)=>{h.docs.set(NIK,partnerDoc(UID.playerOne,"playerTwo",OLD,false));return commitCreate(Date.now()+20*60000)(options,h);})});
  await before.pair.initialize({force:true});
  const refused=await before.pair.startPairing({managerRole:"playerOne"});
  assert.equal(refused.status,"error",JSON.stringify({status:refused.status,message:refused.message}));
  assert.ok(!refused.capability,"no code");assert.match(refused.message,/no longer paired with you.*nothing was started/);
  assert.ok(!before.log.some(line=>/^write /.test(line)),`no pending Showdown, no link, no note: ${before.log.join(", ")}`);
  assert.deepEqual(before.transactions[before.transactions.length-1].reads.slice(0,2),[DANIEL,NIK],"the code-creation transaction reads both records, so either UNPAIR conflicts with it");
  assert.equal(before.pair.getPartnerSideState().status,"unpaired","the waiting screen offers PAIR AGAIN");
  // 2. Nik's UNPAIR commits after the code but before its JOIN note: the note Rules refuse it.
  const after=harness({role:"playerOne",marker:"ready",saves:[danielShell()],activeSaveId:DANIEL_SAVE,docs:{...docs(),"accounts/uid_daniel/devices/device_daniel":{schemaVersion:1,objectType:"device",objectId:"device_daniel",revision:0,lifecycleState:"live",contentHash:`sha256:${"7".repeat(64)}`,data:{deviceId:"device_daniel",state:"active"}}},create:async(options,h)=>{const made=await commitCreate(Date.now()+20*60000)(options,h);h.docs.set(NIK,partnerDoc(UID.playerOne,"playerTwo",OLD,false));return made;}});
  await after.pair.initialize({force:true});
  const original=after.firestoreSdk.runTransaction;
  after.firestoreSdk.runTransaction=async(db,fn)=>original(db,async tx=>{const set=tx.set;tx.set=(ref,value)=>{if(ref.path===INBOX)throw providerError("permission-denied","Missing or insufficient permissions.");return set(ref,value);};return fn(tx);});
  after.sandbox.console={...console,warn:()=>{}};
  const late=await after.pair.startPairing({managerRole:"playerOne"});
  assert.equal(late.status,"error",JSON.stringify({status:late.status,message:late.message}));
  assert.ok(!late.capability,"the code Nik can no longer join is not shown");
  assert.match(late.message,/no longer paired with you.*PAIR AGAIN/);
  const closed=after.docs.get(`rivalries/${refusedId(after)}`);
  assert.equal(closed?.data?.connectionState,"closed","the code is closed again, so Daniel is not left waiting on it");
  assert.equal(after.pair.getPartnerSideState().status,"unpaired");
  assert.equal(after.server.filter(p=>p===NIK).length,2,"one fresh read of Nik's record at START and one only because the note failed");
  // 2b. Codex #923: the close itself fails (here: the device check refuses it): never "nothing was started"; Settings DELETE is the retry.
  const stuck=harness({role:"playerOne",marker:"ready",saves:[danielShell()],activeSaveId:DANIEL_SAVE,docs:docs(),create:async(options,h)=>{const made=await commitCreate(Date.now()+20*60000)(options,h);h.docs.set(NIK,partnerDoc(UID.playerOne,"playerTwo",OLD,false));return made;}});
  await stuck.pair.initialize({force:true});
  const stuckRun=stuck.firestoreSdk.runTransaction;
  stuck.firestoreSdk.runTransaction=async(db,fn)=>stuckRun(db,async tx=>{const set=tx.set;tx.set=(ref,value)=>{if(ref.path===INBOX)throw providerError("permission-denied","Missing or insufficient permissions.");return set(ref,value);};return fn(tx);});
  stuck.sandbox.console={...console,warn:()=>{}};
  const open=await stuck.pair.startPairing({managerRole:"playerOne"});
  assert.equal(open.status,"error");assert.ok(!open.capability);
  assert.doesNotMatch(open.message,/nothing was started/,"an unconfirmed close never claims nothing was started");
  assert.match(open.message,/could not be closed yet.*END SHOWDOWN/);
  assert.equal(stuck.docs.get(`rivalries/${refusedId(stuck)}`)?.data?.connectionState,"pending-pair","the Showdown really is still online");
  // 3. Control: Nik's record still names Daniel and the note is refused for another reason: the code stays (PC2b), no close.
  const keep=harness({role:"playerOne",marker:"ready",saves:[danielShell()],activeSaveId:DANIEL_SAVE,docs:docs(),create:commitCreate(Date.now()+20*60000)});
  await keep.pair.initialize({force:true});
  const kept=keep.firestoreSdk.runTransaction;
  keep.firestoreSdk.runTransaction=async(db,fn)=>kept(db,async tx=>{const set=tx.set;tx.set=(ref,value)=>{if(ref.path===INBOX)throw providerError("unavailable","offline");return set(ref,value);};return fn(tx);});
  keep.sandbox.console={...console,warn:()=>{}};
  const stays=await keep.pair.startPairing({managerRole:"playerOne"});
  assert.equal(stays.status,"waiting");assert.match(stays.capability||"",/^CMS17-pair_/);
});
await check("PC2h the same on Nik's side: an UNPAIR from Nik's other browser that commits after his fresh join check stops the redeem inside its own transaction (no ACTIVE Showdown for an unpaired Nik)",async()=>{
  const NIK="accounts/uid_nik/partner/current";
  const race=redeem=>async(options,h)=>{if(h.unpairFirst){h.unpairFirst=false;h.docs.set(NIK,partnerDoc(UID.playerOne,"playerTwo",OLD,false));}try{return await redeem(options,h);}catch(error){return{ok:false,code:error.code,message:error.message};}};
  const nik=harness({marker:"ready",docs:{...joinable(R3),[NIK]:partnerDoc(UID.playerOne,"playerTwo",OLD)},redeem:race(commitRedeem)});
  await nik.pair.initialize({force:true});
  nik.unpairFirst=true;
  const joined=await nik.pair.joinPairing(`CMS17-${R3}`,{managerRole:"playerTwo",autoContinue:false});
  assert.equal(joined.status,"error",JSON.stringify({status:joined.status,message:joined.message}));
  assert.match(joined.message,/unpaired on another screen.*nothing was joined/);
  assert.ok(!nik.log.some(line=>line===`write rivalries/${R3}`),`the Showdown is not made ACTIVE: ${nik.log.join(", ")}`);
  // the record flipped only inside the redeem, after the fresh join check: only a read inside the redeem transaction sees it
  assert.equal(nik.pair.getPartnerState().record.active,false,"this tab now knows it was unpaired");
  // Control: still paired, the same redeem joins.
  const ok=harness({marker:"ready",docs:{...joinable(R3),[NIK]:partnerDoc(UID.playerOne,"playerTwo",OLD)},redeem:race(commitRedeem)});
  await ok.pair.initialize({force:true});
  const made=await ok.pair.joinPairing(`CMS17-${R3}`,{managerRole:"playerTwo",autoContinue:false});
  assert.equal(made.connectionState,"active",JSON.stringify({status:made.status,message:made.message}));
  assert.ok(ok.transactions.some(tx=>tx.reads[0]===NIK&&tx.writes.includes(`rivalries/${R3}`)),"the committed redeem read Nik's record first");
});
await check("PC3a Nik's note read: one memoised read per 30 s (failures count), none while hidden, only with an active playerTwo record",async()=>{
  const now=Date.now();
  const h=harness({docs:{"accounts/uid_nik/partner/current":partnerDoc(UID.playerOne,"playerTwo",OLD),"accounts/uid_nik/partnerInbox/current":noteDoc(R5,5,UID.playerOne,now+10*60000)}});
  await h.pair.initialize({force:true});
  const inboxReads=()=>h.transactions.filter(t=>t.reads.includes("accounts/uid_nik/partnerInbox/current")).length;
  assert.equal((await h.pair.readJoinNote()).status,"not-paired","no partner record known yet: no inbox read");
  assert.equal(inboxReads(),0);
  await h.pair.readPartnerRecord();
  const first=await h.pair.readJoinNote();
  assert.equal(first.status,"ready");assert.equal(first.note.rivalryId,R5);assert.equal(first.note.totalSeasons,5);
  assert.deepEqual(h.fresh,["accounts/uid_nik/partnerInbox/current"],"the note is always read fresh from the server");
  for(let i=0;i<5;i+=1)await h.pair.readJoinNote();
  assert.equal(inboxReads(),1,"Home shown five more times inside 30 s: still one read");
  const view=h.pair.getJoinNoteState();
  assert.equal(view.checked,true);assert.equal(view.partnerActive,true);assert.equal(view.note.rivalryId,R5);
  // 30 s later the memo expires; while hidden nothing is read
  const realNow=Date.now;h.sandbox.Date.now=()=>realNow()+31000;
  h.hidden=true;await h.pair.readJoinNote();assert.equal(inboxReads(),1,"a hidden tab reads nothing");
  h.hidden=false;h.failReads=p=>p.includes("partnerInbox");
  const failed=await h.pair.readJoinNote();
  assert.equal(failed.status,"unavailable");assert.equal(inboxReads(),1);
  assert.equal(h.pair.getJoinNoteState().checked,false,"an unread inbox never claims Waiting for Daniel");
  h.failReads=null;await h.pair.readJoinNote();
  assert.equal(h.transactions.filter(t=>t.reads.includes("accounts/uid_nik/partnerInbox/current")).length,1,"a failed read counts toward the 30 s memo too");
  h.sandbox.Date.now=()=>realNow()+62000;await h.pair.readJoinNote();assert.equal(inboxReads(),2);
  h.sandbox.Date.now=realNow;
  // Daniel's account never reads an inbox
  const daniel=harness({role:"playerOne",docs:{"accounts/uid_daniel/partner/current":partnerDoc(UID.playerTwo,"playerOne",OLD)}});
  await daniel.pair.initialize({force:true});await daniel.pair.readPartnerRecord();
  assert.equal((await daniel.pair.readJoinNote()).status,"not-paired");
  assert.ok(!daniel.transactions.some(t=>t.reads.some(p=>p.includes("partnerInbox"))));
});

await check("PC3b a foreign, malformed, season-mismatched or expired note never shows JOIN; the note of an already joined or closed Showdown is ignored",async()=>{
  const now=Date.now();
  const cases=[
    [noteDoc(R5,5,"uid_stranger",now+600000),"another account's note"],
    [noteDoc(R5,3,UID.playerOne,now+600000),"seasons that do not match the id"],
    [{...noteDoc(R5,5,UID.playerOne,now+600000),extra:true},"an extra key"],
    [{...noteDoc(R5,5,UID.playerOne,now+600000),schemaVersion:2},"another schema"],
    [noteDoc("pair_bad",5,UID.playerOne,now+600000),"a malformed rivalry"]
  ];
  for(const [value,label] of cases){
    const h=harness({docs:{"accounts/uid_nik/partner/current":partnerDoc(UID.playerOne,"playerTwo",OLD),"accounts/uid_nik/partnerInbox/current":value}});
    await h.pair.initialize({force:true});await h.pair.readPartnerRecord();
    const state=await h.pair.readJoinNote();
    assert.equal(state.status,"ready",label);assert.equal(state.note,null,label);
    assert.equal(h.pair.getJoinNoteState().note,null,label);
  }
  const h=harness({docs:{"accounts/uid_nik/partner/current":partnerDoc(UID.playerOne,"playerTwo",OLD),"accounts/uid_nik/partnerInbox/current":noteDoc(R5,5,UID.playerOne,now+5000)}});
  await h.pair.initialize({force:true});await h.pair.readPartnerRecord();await h.pair.readJoinNote();
  assert.equal(h.pair.getJoinNoteState(now).note.rivalryId,R5);
  assert.equal(h.pair.getJoinNoteState(now+5000).note,null,"expired: Waiting for Daniel");
  assert.ok(h.timers.some(t=>t.ms>=5000&&t.ms<=5100),"one re-render timer at the expiry (no read)");
  const reads=h.transactions.length;h.timers.find(t=>t.ms>=5000&&t.ms<=5100).fn();assert.equal(h.transactions.length,reads,"the expiry timer reads nothing");
  // the note of the Showdown this account already joined and closed never shows JOIN again
  const closed=harness({docs:{"accounts/uid_nik/partner/current":partnerDoc(UID.playerOne,"playerTwo",OLD),"accounts/uid_nik/partnerInbox/current":noteDoc(R5,5,UID.playerOne,now+600000),"accounts/uid_nik/pairLinks/current":linkDoc(R5,"playerTwo"),[`rivalries/${R5}`]:rivalryDoc(R5,"closed")}});
  await closed.pair.initialize({force:true});await closed.pair.readPartnerRecord();await closed.pair.readJoinNote();
  assert.equal(closed.pair.getState().closedRivalryId,R5);
  assert.equal(closed.pair.getJoinNoteState().note,null,"a closed Showdown's note is ignored");
  assert.equal(closed.pair.getJoinNoteState().checked,true,"and Home shows Waiting for Daniel");
  // an inactive (unpaired) record reads no inbox at all
  const unpaired=harness({docs:{"accounts/uid_nik/partner/current":partnerDoc(UID.playerOne,"playerTwo",OLD,false),"accounts/uid_nik/partnerInbox/current":noteDoc(R5,5,UID.playerOne,now+600000)}});
  await unpaired.pair.initialize({force:true});await unpaired.pair.readPartnerRecord();
  assert.equal((await unpaired.pair.readJoinNote()).status,"not-paired");
  assert.equal(unpaired.pair.getJoinNoteState().partnerActive,false);
});

await check("PC4 the partner record is read once per page load; a failed read is tried again at most every 30 s",async()=>{
  const h=harness({docs:{"accounts/uid_nik/partner/current":partnerDoc(UID.playerOne,"playerTwo",OLD)}});
  await h.pair.initialize({force:true});
  const partnerReads=()=>h.transactions.filter(t=>t.reads.includes("accounts/uid_nik/partner/current")).length;
  const [a,b]=await Promise.all([h.pair.readPartnerRecord(),h.pair.readPartnerRecord()]);
  assert.equal(a,b,"concurrent asks share one read");
  for(let i=0;i<5;i+=1)await h.pair.readPartnerRecord();
  assert.equal(partnerReads(),1,"one read for the page");
  assert.equal(h.pair.getPartnerState().record.partnerAccountId,UID.playerOne);
  const none=harness();await none.pair.initialize({force:true});
  await none.pair.readPartnerRecord();await none.pair.readPartnerRecord();
  assert.equal(none.pair.getPartnerState().status,"none");
  assert.equal(none.transactions.filter(t=>t.reads.includes("accounts/uid_nik/partner/current")).length,1,"a missing record is remembered too");
  const flaky=harness();await flaky.pair.initialize({force:true});
  flaky.failReads=p=>p.endsWith("/partner/current");
  await flaky.pair.readPartnerRecord();await flaky.pair.readPartnerRecord();
  assert.equal(flaky.pair.getPartnerState().status,"unavailable");
  flaky.failReads=null;await flaky.pair.readPartnerRecord();
  assert.equal(flaky.pair.getPartnerState().status,"unavailable","no retry inside 30 s");
  const realNow=Date.now;flaky.sandbox.Date.now=()=>realNow()+31000;
  await flaky.pair.readPartnerRecord();flaky.sandbox.Date.now=realNow;
  assert.equal(flaky.pair.getPartnerState().status,"none","retried after 30 s");
  const parsed=harness().pair.parsePlayerJoinCode("CMS17X-"+R3);
  assert.equal(parsed.real,false,"only the exact CMS17R- prefix marks a real pairing");
});

await check("PC5 UNPAIR: active:false + updatedAt only; blocked while a Showdown is in progress (finish or delete first)",async()=>{
  const record=partnerDoc(UID.playerOne,"playerTwo",OLD);
  const active=harness({docs:{"accounts/uid_nik/partner/current":record,"accounts/uid_nik/pairLinks/current":linkDoc(R3,"playerTwo"),[`rivalries/${R3}`]:rivalryDoc(R3,"active")}});
  await assert.rejects(active.pair.unpair(),/Finish or delete the current Showdown before you unpair/);
  assert.equal(active.docs.get("accounts/uid_nik/partner/current").active,true,"nothing written while a Showdown is in progress");
  const pending=harness({role:"playerOne",docs:{"accounts/uid_daniel/partner/current":partnerDoc(UID.playerTwo,"playerOne",OLD),"accounts/uid_daniel/pairLinks/current":linkDoc(R3,"playerOne"),[`rivalries/${R3}`]:rivalryDoc(R3,"pending-pair",{nik:false}),[`rivalries/${R3}/invites/${R3}`]:inviteDoc(R3,Date.now()+600000)}});
  await assert.rejects(pending.pair.unpair(),/Finish or delete/,"a code that is still open counts as in progress");
  pending.docs.set(`rivalries/${R3}/invites/${R3}`,inviteDoc(R3,Date.now()-5*60000));
  await assert.rejects(pending.pair.unpair(),/Finish or delete/,"Codex #908: a code expired only 5 minutes ago still counts (this clock may be ahead)");
  pending.docs.set(`rivalries/${R3}/invites/${R3}`,inviteDoc(R3,Date.now()-15*60000));
  assert.equal((await pending.pair.unpair()).status,"unpaired","an expired code is no Showdown in progress");
  const closed=harness({docs:{"accounts/uid_nik/partner/current":record,"accounts/uid_nik/pairLinks/current":linkDoc(R3,"playerTwo"),[`rivalries/${R3}`]:rivalryDoc(R3,"closed")}});
  const before=JSON.parse(JSON.stringify(closed.docs.get("accounts/uid_nik/partner/current")));
  assert.equal((await closed.pair.unpair()).status,"unpaired");
  const after=closed.docs.get("accounts/uid_nik/partner/current");
  const changed=Object.keys(after).filter(key=>JSON.stringify(after[key])!==JSON.stringify(before[key])).sort();
  assert.deepEqual(changed,["active","updatedAt"],"only active and updatedAt change");
  assert.equal(after.active,false);assert.equal(after.updatedAt,SERVER_TIME);
  assert.deepEqual(Object.keys(after).sort(),PARTNER_KEYS);
  assert.equal(closed.pair.getPartnerState().record.active,false);
  assert.equal(closed.pair.getJoinNoteState().partnerActive,false,"no JOIN note is read after UNPAIR");
  const writes=closed.transactions.reduce((n,t)=>n+t.writes.length,0);
  assert.equal((await closed.pair.unpair()).status,"already-unpaired");
  assert.equal(closed.transactions.reduce((n,t)=>n+t.writes.length,0),writes,"UNPAIR twice writes once");
  const none=harness();assert.equal((await none.pair.unpair()).status,"not-paired");
  // Codex #903: fail closed. A linked Showdown (or its invite) this account cannot read never lets UNPAIR through.
  for(const [label,docs,unreadable,code] of [
    ["active rivalry refused by Rules",{[`rivalries/${R3}`]:rivalryDoc(R3,"active")},`rivalries/${R3}`,"permission-denied"],
    ["rivalry read offline",{[`rivalries/${R3}`]:rivalryDoc(R3,"active")},`rivalries/${R3}`,"unavailable"],
    ["open invite refused by Rules",{[`rivalries/${R3}`]:rivalryDoc(R3,"pending-pair",{nik:false}),[`rivalries/${R3}/invites/${R3}`]:inviteDoc(R3,Date.now()+600000)},`rivalries/${R3}/invites/${R3}`,"permission-denied"]
  ]){
    const h=harness({docs:{"accounts/uid_nik/partner/current":record,"accounts/uid_nik/pairLinks/current":linkDoc(R3,"playerTwo"),...docs}});
    h.failReads=p=>p===unreadable;h.failCode=code;
    await assert.rejects(h.pair.unpair(),error=>error.code==="PERMANENT_PARTNER_UNPAIR_UNVERIFIED"&&/could not be checked, so nothing was unpaired/.test(error.message),`${label}: UNPAIR is refused with a clear reason`);
    assert.equal(h.docs.get("accounts/uid_nik/partner/current").active,true,`${label}: the partner record is unchanged`);
    assert.equal(h.transactions.reduce((n,t)=>n+t.writes.length,0),0,`${label}: nothing is written`);
  }
});

await check("PC5b Codex #904 pairing audit: Nik's UNPAIR also waits for Daniel's next code in his mailbox (his own link still names the last Showdown)",async()=>{
  const record=partnerDoc(UID.playerOne,"playerTwo",OLD),inbox="accounts/uid_nik/partnerInbox/current";
  const base=()=>({"accounts/uid_nik/partner/current":record,"accounts/uid_nik/pairLinks/current":linkDoc(R3,"playerTwo"),[`rivalries/${R3}`]:rivalryDoc(R3,"closed"),...joinable(R5),[inbox]:noteDoc(R5,5,UID.playerOne,Date.now()+600000)});
  const waiting=harness({docs:base()});
  await assert.rejects(waiting.pair.unpair(),error=>error.code==="PERMANENT_PARTNER_UNPAIR_BLOCKED"&&/next Showdown is waiting for you/.test(error.message));
  assert.equal(waiting.docs.get("accounts/uid_nik/partner/current").active,true,"nothing written while Daniel's code waits");
  const used=harness({docs:{...base(),[`rivalries/${R5}/invites/${R5}`]:inviteDoc(R5,Date.now()+600000,"redeemed")}});
  assert.equal((await used.pair.unpair()).status,"unpaired","a used code does not block");
  const stale=harness({docs:{...base(),[inbox]:noteDoc(R5,5,UID.playerOne,Date.now()-15*60000)}});
  assert.equal((await stale.pair.unpair()).status,"unpaired","an expired note does not block");
  const foreign=harness({docs:{...base(),[inbox]:noteDoc(R5,5,"uid_stranger",Date.now()+600000)}});
  assert.equal((await foreign.pair.unpair()).status,"unpaired","a note not from the partner is ignored");
  const offline=harness({docs:base()});offline.failReads=p=>p===inbox;offline.failCode="unavailable";
  await assert.rejects(offline.pair.unpair(),error=>error.code==="PERMANENT_PARTNER_UNPAIR_UNVERIFIED","a mailbox that cannot be read refuses");
  assert.equal(offline.transactions.reduce((n,t)=>n+t.writes.length,0),0);
  const daniel=harness({role:"playerOne",docs:{"accounts/uid_daniel/partner/current":partnerDoc(UID.playerTwo,"playerOne",OLD),"accounts/uid_daniel/pairLinks/current":linkDoc(R3,"playerOne"),[`rivalries/${R3}`]:rivalryDoc(R3,"closed")}});
  assert.equal((await daniel.pair.unpair()).status,"unpaired");assert.ok(!daniel.transactions.some(t=>t.reads.some(r=>r.includes("partnerInbox"))),"Daniel's UNPAIR never reads a mailbox");
});

await check("PC6 reload recovery needs the other manager's record; a paired account has no USE A SESSION CODE path",async()=>{
  const h=harness({role:"playerOne",marker:"ready",saves:[danielShell()],activeSaveId:DANIEL_SAVE,docs:{"accounts/uid_daniel/pairLinks/current":linkDoc(R3,"playerOne"),[`rivalries/${R3}`]:rivalryDoc(R3,"active")}});
  await h.pair.initialize({force:true});
  assert.equal(h.pair.getState().status,"paired");
  assert.equal(await h.pair.ensurePartnerRecord(),null,"Nik's record is missing: Daniel writes nothing");
  assert.ok(!h.docs.has("accounts/uid_daniel/partner/current"));
  const ok=harness({role:"playerOne",marker:"ready",saves:[danielShell()],activeSaveId:DANIEL_SAVE,docs:{"accounts/uid_daniel/pairLinks/current":linkDoc(R3,"playerOne"),[`rivalries/${R3}`]:rivalryDoc(R3,"active"),"accounts/uid_nik/partner/current":partnerDoc(UID.playerOne,"playerTwo",R3)}});
  await ok.pair.initialize({force:true});
  assert.equal((await ok.pair.ensurePartnerRecord()).status,"paired","Nik's record names Daniel: Daniel's own record is written");
  assert.deepEqual(ok.transactions.at(-1).reads,[`rivalries/${R3}`,"accounts/uid_nik/partner/current","accounts/uid_daniel/partner/current"]);
  assert.equal(await ok.pair.ensurePartnerRecord(),null,"at most once per page");
  const test=harness({role:"playerOne",saves:[danielShell()],activeSaveId:DANIEL_SAVE,docs:{"accounts/uid_daniel/pairLinks/current":linkDoc(R3,"playerOne"),[`rivalries/${R3}`]:rivalryDoc(R3,"active"),"accounts/uid_nik/partner/current":partnerDoc(UID.playerOne,"playerTwo",R3)}});
  await test.pair.initialize({force:true});
  assert.equal(await test.pair.ensurePartnerRecord(),null,"no marker (test mode): never a partner record");
  const remote=read("js/sparkRemoteJoining.js"),auto=remote.slice(remote.indexOf("function srjRenderAuto"),remote.indexOf("function srjCreate"));
  assert.match(auto,/if\(!srjPermanentlyPaired\(\)\)\{[\s\S]*"USE A SESSION CODE"[\s\S]*\}/,"USE A SESSION CODE only for an account that is not permanently paired");
  assert.match(remote,/function srjUseManualCode\(\)\{if\(srjPermanentlyPaired\(\)\)return srjState;/,"the manual path cannot be reached for a paired account either");
  assert.match(remote,/root\.addEventListener\("career-mode-permanent-pair-change",\(\)=>\{try\{srjRenderPanel\(\);\}catch\(_error\)\{\}\}\);/,"a partner record that lands while the panel is open re-renders it (render only, no read)");
  assert.match(remote,/partner\.status==="ready"&&partner\.record&&partner\.record\.active===true&&account&&partner\.accountId===account\.accountId/);
});

await check("PC8 Codex #903: Nik's explicit tap reads the JOIN note fresh (bypasses the 30 s memo, still one read in flight); a background Home moment keeps the memo",async()=>{
  const h=harness({docs:{"accounts/uid_nik/partner/current":partnerDoc(UID.playerOne,"playerTwo",OLD)}});
  await h.pair.initialize({force:true});await h.pair.readPartnerRecord();
  await h.pair.readJoinNote();assert.equal(h.pair.getJoinNoteState().note,null,"no note yet: a miss");
  const noteReads=()=>h.transactions.filter(t=>t.reads.includes("accounts/uid_nik/partnerInbox/current")).length,before=noteReads();
  h.docs.set("accounts/uid_nik/partnerInbox/current",noteDoc(R5,5,UID.playerOne,Date.now()+600000));  // Daniel writes right after
  await h.pair.readJoinNote();
  assert.equal(noteReads(),before,"a background Home moment inside 30 s keeps the memoised miss (no read)");
  assert.equal(h.pair.getJoinNoteState().note,null);
  const [a,b]=await Promise.all([h.pair.readJoinNote({fresh:true}),h.pair.readJoinNote({fresh:true})]);
  assert.equal(noteReads(),before+1,"two taps at once: one fresh read in flight");
  assert.equal(a,b);
  assert.equal(h.pair.getJoinNoteState().note?.rivalryId,R5,"the tap sees Daniel's note at once (JOIN, not the paste box)");
});

await check("PC9 Codex #903: Nik's once-per-page record recovery (mirror of Daniel's): no record, real career started, pairing ACTIVE with Nik in playerTwo and Daniel's record naming him",async()=>{
  const nikShell=()=>shellEntry(NIK_SAVE,NIK_PROFILE,3,"playerTwo");
  const base=extra=>({role:"playerTwo",marker:"ready",saves:[nikShell()],activeSaveId:NIK_SAVE,docs:{"accounts/uid_nik/pairLinks/current":linkDoc(R3,"playerTwo"),[`rivalries/${R3}`]:rivalryDoc(R3,"active"),...extra}});
  const ok=harness(base({"accounts/uid_daniel/partner/current":partnerDoc(UID.playerTwo,"playerOne",R3)}));
  await ok.pair.initialize({force:true});
  assert.equal(ok.pair.getState().status,"paired");assert.equal(ok.pair.getState().managerRole,"playerTwo");
  const written=await ok.pair.ensurePartnerRecord();
  assert.equal(written?.status,"paired","Nik's dropped record is written on load");
  assert.deepEqual(ok.transactions.at(-1).reads,[`rivalries/${R3}`,"accounts/uid_daniel/partner/current","accounts/uid_nik/partner/current"],"it re-reads the ACTIVE rivalry and Daniel's record first");
  assert.deepEqual({...ok.docs.get("accounts/uid_nik/partner/current")},{schemaVersion:1,partnerAccountId:UID.playerOne,myRole:"playerTwo",pairedViaRivalryId:R3,pairedAt:SERVER_TIME,active:true,updatedAt:SERVER_TIME});
  const writes=ok.transactions.reduce((n,t)=>n+t.writes.length,0);
  assert.equal(await ok.pair.ensurePartnerRecord(),null,"at most once per page");
  assert.equal(ok.transactions.reduce((n,t)=>n+t.writes.length,0),writes);
  for(const [label,extra,options] of [
    ["Daniel's record is missing",{},{}],
    ["Daniel's record names someone else",{"accounts/uid_daniel/partner/current":partnerDoc("uid_someone","playerOne",R3)},{}],
    ["Nik unpaired (active:false is never undone)",{"accounts/uid_daniel/partner/current":partnerDoc(UID.playerTwo,"playerOne",R3),"accounts/uid_nik/partner/current":partnerDoc(UID.playerOne,"playerTwo",OLD,false)},{}],
    ["no real career on Nik's account",{"accounts/uid_daniel/partner/current":partnerDoc(UID.playerTwo,"playerOne",R3)},{marker:"none"}]
  ]){
    const h=harness({...base(extra),...options});
    const before=extra["accounts/uid_nik/partner/current"]?JSON.stringify(extra["accounts/uid_nik/partner/current"]):null;
    await h.pair.initialize({force:true});
    assert.equal(await h.pair.ensurePartnerRecord(),null,`${label}: nothing is written`);
    assert.equal(h.transactions.reduce((n,t)=>n+t.writes.length,0),0,`${label}: no write at all`);
    assert.equal(h.docs.has("accounts/uid_nik/partner/current")?JSON.stringify(h.docs.get("accounts/uid_nik/partner/current")):null,before,`${label}: Nik's record unchanged`);
  }
});

await check("PC7 the identity sidecar reads the partner record once per load and the note only on Home shown / tab visible, never in render",async()=>{
  const identity=read("js/onlinePlayerIdentity.js");
  assert.match(identity,/pair\.render\?\.\(\);void afterPersistentPairSync\(pair\);return pairState;/);
  assert.match(identity,/async function afterPersistentPairSync\(pair\)\{try\{if\(typeof pair\?\.readPartnerRecord!=="function"\)return;await pair\.readPartnerRecord\(\);await pair\.ensurePartnerRecord\?\.\(\);\/\*[^*]*\*\/if\(state\.managerId!=="daniel"\)await refreshJoinNoteOnHome\(\);/,"after the one partner read: the once-per-page record recovery (both managers), then Nik's note");
  assert.match(identity,/await root\.CareerModePersistentNikDanielPair\.readPartnerRecord\(\);\/\*[^*]*\*\/await refreshJoinNoteOnHome\(\{fresh:true\}\);/,"Nik's explicit tap reads the note fresh");
  assert.match(identity,/await pair\.readJoinNote\(\{fresh:options\.fresh===true\}\)/);
  assert.match(identity,/async function refreshJoinNoteOnHome\(options=\{\}\)\{[^\n]*state\.managerId!=="nik"[^\n]*!onlineHomeShown\(\)\)return null;/);
  assert.match(identity,/function onlineHomeShown\(\)\{if\(root\.document\?\.visibilityState==="hidden"\)return false;[^\n]*screen==="mainMenu"/);
  assert.match(identity,/addEventListener\("career-mode-screen-shown",event=>\{if\(!event\?\.detail\?\.screen\|\|event\.detail\.screen==="mainMenu"\)void refreshJoinNoteOnHome\(\);else root\.CareerModePersistentNikDanielPair\?\.stopJoinNoteWatch\?\.\(\);\}\)/,"leaving Home detaches the note listener at once");
  // Nik 2026-10-18 ("check by itself"): Home shown / tab visible (re)attaches ONE note listener; its first server delivery is the
  // read, and without a live listener the memoised read answers.
  assert.match(identity,/const listening=typeof pair\.watchJoinNote==="function"\?await pair\.watchJoinNote\(\{isHomeShown:onlineHomeShown,resume:options\.resume===true\}\)\.catch\(\(\)=>false\):false;\/\*[^*]*\*\/const note=listening===true\|\|\(listening==="deferred"&&options\.fresh!==true\)\?pair\.getJoinNoteState\(\):await pair\.readJoinNote\(\{fresh:options\.fresh===true\}\)\.catch\(\(\)=>null\);/);
  const pairSource=read("js/persistentNikDanielPair.js");
  assert.match(pairSource,/JOIN_NOTE_WATCH_WINDOW_MS=600000,/,"10 minutes per Home visit");
  assert.match(pairSource,/noteWatch\.unsubscribe=api\.onSnapshot\(ref,\{includeMetadataChanges:true\},/,"the note is watched by one onSnapshot listener; metadata changes deliver the server copy after a cached first snapshot (r79 PR5)");
  assert.match(pairSource,/api\.doc\(context\.services\.firestore,"accounts",context\.accountId,"partnerInbox",PARTNER_DOC_ID\)/,"on exactly the one awaited document");
  assert.match(pairSource,/root\.document\.addEventListener\("visibilitychange",\(\)=>\{if\(root\.document\.visibilityState==="hidden"\)pairJoinNoteWatchStop\(\);\}\)/,"a hidden tab detaches it at once");
  assert.match(pairSource,/if\(pairJoinNoteListening\(accountId\)\)return joinNoteState;/,"no extra read while the listener is live");
  assert.match(pairSource,/\(\)=>\{if\(noteWatch\.seq===seq&&noteWatch\.mode==="listen"\)pairJoinNoteFallback\(\);\}/,"a listener error falls back to the memoised read");
  const surfaceText=identity.slice(identity.indexOf("function configureOnlineProductSurface"),identity.indexOf("function ensureOnlineIdentityOverlay"));
  assert.doesNotMatch(surfaceText,/watchJoinNote|onSnapshot/,"render never attaches the listener");
  assert.match(identity,/addEventListener\("visibilitychange",\(\)=>\{if\(root\.document\.visibilityState==="visible"\)void refreshJoinNoteOnHome\(\{resume:true\}\);\}\)/);
  const surface=identity.slice(identity.indexOf("function configureOnlineProductSurface"),identity.indexOf("function ensureOnlineIdentityOverlay"));
  const tile=identity.slice(identity.indexOf("function nikHomeTile"),identity.indexOf("async function resolveOnlineDependencies"));
  for(const [label,text] of [["render",surface],["tile",tile]])assert.doesNotMatch(text,/readJoinNote|readPartnerRecord|runTransaction|getDoc/,`${label} never reads`);
  assert.match(tile,/pair\.getJoinNoteState\(\)/,"the tile uses the memo only");
  assert.doesNotMatch(tile,/disabled|opacity|dim/i,"no dimming: the tile is never disabled or greyed");
});

console.log(`PASS permanent pairing client contracts: ${passed} checks (first real pairing CMS17R-, marker before redeem, partner records after ACTIVE, JOIN note in its own transaction with the invite expiry, memoised note read, once-per-load partner read, UNPAIR blocked while in progress, no session code for paired accounts).`);
})().catch(error=>{console.error(error);process.exitCode=1;});

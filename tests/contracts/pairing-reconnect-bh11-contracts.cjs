"use strict";
// BH-11: pairing and reconnect fixes from the 2026-10-05 pairing audit.
//   R1  (#1)  a phone that still holds its own confirmed session can replace it: HOST closes an ACTIVE / revokes an OPEN
//             session first, JOIN closes an ACTIVE one first. Unresolved, pending, other-account and OPEN-join cases keep
//             the old guard. The reloaded phone's banner says it is not connected (not "the session has ended"), and a
//             recovered phone gets a NEW SESSION CODE action that waits for a different ACTIVE session.
//   R2  (#2)  navigator.storage.persist() is asked once per page, never when storage is already persisted, never throws;
//             START OVER / DELETE OLD CONNECTION proceed only on an explicit confirm()===true.
//   R3  (#3)  a join whose acknowledgement was lost (or whose retry reads "already used") is recognised from the pair link
//             as a success; a forced refresh waits for the in-flight join instead of re-enabling JOIN.
//   R6  (#6)  a transient startup error shows plain text and a CHECK STATUS retry that recovers.
//   R7  (#7)  a definitely refused join removes only the empty local copy it created; an ambiguous outcome, an unreadable
//             re-check or a pre-existing copy keeps everything; the season mismatch text points to Settings.
//   R10 (#10) wording no longer points to hidden screens; host/join/create permission refusals add the phone-clock hint.
//   R11 (#11) a pasted message holding exactly one code joins with that code.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");

const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const pairSource=read("js/persistentNikDanielPair.js");
const INVALID="Daniel's connection code is invalid.";
const RIVALRY=`pair_3${"ab".repeat(31)}c`,CODE=`CMS17-${RIVALRY}`,OTHER_RIVALRY=`pair_3${"cd".repeat(31)}e`;
const SAVE_NEW=`save_${"1".repeat(24)}`,PROFILE_NEW=`profile_${"2".repeat(24)}`,SAVE_OLD=`save_${"3".repeat(24)}`,PROFILE_OLD=`profile_${"4".repeat(24)}`;
const DANIEL_SAVE=`save_${"5".repeat(24)}`,DANIEL_PROFILE=`profile_${"6".repeat(24)}`;
async function settle(){for(let pass=0;pass<3;pass+=1){await new Promise(resolve=>setTimeout(resolve,2));for(let i=0;i<30;i+=1)await new Promise(resolve=>setImmediate(resolve));}}
function providerError(code,message){return Object.assign(new Error(message||code),{code});}

// Tiny DOM, enough for pairRender and srjRenderPanel.
function createDom(){
  let active=null;
  class El{
    constructor(tag){this.tagName=String(tag).toUpperCase();this.children=[];this.parent=null;this.style={};this.listeners={};this.id="";this.className="";this.ownText="";this.value="";this.disabled=false;this.dataset={};this.attributes={};this.classList={add:()=>{},remove:()=>{},toggle:()=>{},contains:()=>false};}
    get textContent(){return this.ownText+this.children.map(c=>c.textContent).join("");}
    set textContent(v){this.ownText=v==null?"":String(v);this.children=[];}
    get isConnected(){let n=this;while(n){if(n===body)return true;n=n.parent;}return false;}
    append(...nodes){for(const n of nodes){if(typeof n==="string"){const t=new El("#text");t.ownText=n;t.parent=this;this.children.push(t);continue;}if(n.parent)n.parent.children=n.parent.children.filter(c=>c!==n);n.parent=this;this.children.push(n);}}
    appendChild(n){this.append(n);return n;}
    insertBefore(n){this.append(n);return n;}
    replaceChildren(...nodes){for(const c of this.children)c.parent=null;this.children=[];this.append(...nodes);}
    setAttribute(k,v){this.attributes[k]=String(v);}
    addEventListener(type,fn){(this.listeners[type]||(this.listeners[type]=[])).push(fn);}
    click(){if(!this.disabled)for(const fn of this.listeners.click||[])fn({preventDefault(){}});}
    focus(){if(this.isConnected)active=this;}
    setSelectionRange(){}
    all(){return this.children.flatMap(c=>[c,...c.all()]);}
    querySelector(sel){if(sel.startsWith("."))return this.all().find(n=>String(n.className).split(" ").includes(sel.slice(1)))||null;if(sel==="button")return this.all().find(n=>n.tagName==="BUTTON")||null;return null;}
    scrollIntoView(){}
  }
  const body=new El("body"),menu=new El("div"),shell=new El("div");
  menu.id="mainMenu";shell.className="fifaMenuShell";body.append(menu);menu.append(shell);
  const connect=new El("section"),slot=new El("div");connect.id="connectPlayersScreen";slot.id="connectPlayersPairSlot";body.append(connect);connect.append(slot);
  const document={
    visibilityState:"visible",body,head:new El("head"),
    createElement:tag=>new El(tag),
    getElementById:id=>body.all().find(n=>n.id===id)||null,
    querySelector:sel=>sel==="#connectPlayersScreen #connectPlayersPairSlot"?slot:sel==="#mainMenu .fifaMenuShell"?shell:null,
    get activeElement(){return active&&active.isConnected?active:body;}
  };
  return{document,body,El};
}
const buttons=(root,text)=>root.all().filter(n=>n.tagName==="BUTTON"&&(text===undefined||n.textContent===text));

// ---------------------------------------------------------------------------------------------------------------
// Persistent pair harness: vm-loaded module, in-memory Firestore, in-memory Save Library, stubbed pairing provider.
function shell(saveId,profileId,rounds,role="playerTwo"){return{saveId,showdown:{totalRounds:rounds,sharedJourney:{mode:"shared",setupPending:true},managers:{playerOne:"Daniel",playerTwo:"Nik"},selectedLeague:null,clubs:{},rounds:[],identity:{managerProfileIds:{[role]:profileId}}}};}
function pairHarness({role="playerTwo",saves=[],activeSaveId=null,docs:seed={},navigator,confirm,redeem,create}={}){
  const {document}=createDom();
  const uid=role==="playerTwo"?"uid_nik":"uid_daniel",deviceId=role==="playerTwo"?"device_nik":"device_daniel";
  const docs=new Map(Object.entries(seed));
  const library={activeSaveId,saves:saves.map(entry=>JSON.parse(JSON.stringify(entry)))};
  const deleted=[],listeners={},calls={redeem:[],create:[],navigate:[],provision:0};
  const h={failReads:false,servicesError:null};
  const firestoreSdk={
    doc:(_db,...parts)=>({path:parts.join("/")}),
    Timestamp:{fromMillis:ms=>({toMillis:()=>ms})},
    runTransaction:async(_db,fn)=>{if(h.failReads)throw providerError("unavailable","Failed to get document because the client is offline.");const writes=[];const tx={get:async ref=>({exists:()=>docs.has(ref.path),data:()=>docs.get(ref.path)}),set:(ref,value)=>{writes.push([ref.path,value]);}};const result=await fn(tx);for(const [key,value] of writes)docs.set(key,value);return result;},
    getDoc:async ref=>({exists:()=>docs.has(ref.path),data:()=>docs.get(ref.path)})
  };
  const runtime={
    isReady:()=>true,
    getLibrarySnapshot:()=>JSON.parse(JSON.stringify(library)),
    switchActiveSave:async id=>{library.activeSaveId=id;return true;},
    deleteSave:id=>{deleted.push(id);library.saves=library.saves.filter(entry=>entry.saveId!==id);if(library.activeSaveId===id)library.activeSaveId=null;return{ok:true,deletedSaveId:id,activeSaveId:library.activeSaveId};}
  };
  const pairing={
    initialize:async()=>({}),getState:()=>({registered:true,deviceId}),
    localBindingOptions:()=>{const entry=library.saves.find(item=>item.saveId===library.activeSaveId);const profileId=entry?.showdown?.identity?.managerProfileIds?.[role];return entry&&profileId?[{managerRole:role,saveId:entry.saveId,profileId}]:[];},
    getOrCreateDeviceIdentity:async()=>({deviceId}),
    redeemPairing:async options=>{calls.redeem.push(options.capability);return redeem?redeem(options,h):{ok:false,code:"PAIRING_REDEEM_FAILED",message:"unconfigured"};},
    createPairing:async options=>{calls.create.push(options.capability);return create?create(options,h):{ok:false,code:"PAIRING_CREATE_FAILED",message:"unconfigured"};},
    pairingJoinErrorMessage:error=>error?.message||"The code could not be joined."
  };
  const sandbox={
    console,setTimeout:()=>0,clearTimeout:()=>{},TextEncoder,crypto:webcrypto,Promise,Date,document,
    addEventListener:(type,fn)=>{(listeners[type]||(listeners[type]=[])).push(fn);},
    CareerModeOnlinePlayerIdentity:{getState:()=>({managerId:role==="playerTwo"?"nik":"daniel"})},
    CareerModeSparkConnectedAccount:{initialize:async()=>({}),getState:()=>({connected:true,accountId:uid})},
    CareerModeSparkPrivatePairing:pairing,
    CareerModeSaveLibraryRuntime:runtime,
    CareerModeProductionSharedJourneyEntry:{provisionJoinerShell:async rounds=>{calls.provision+=1;library.saves.push(shell(SAVE_NEW,PROFILE_NEW,Number(rounds)));library.activeSaveId=SAVE_NEW;return true;}},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>{if(h.servicesError)throw h.servicesError;return{ok:true,auth:{currentUser:{uid}},firestore:{},firestoreSdk};}},
    navigateTo:async(screen)=>{calls.navigate.push(screen);return true;}
  };
  if(navigator)sandbox.navigator=navigator;
  if(confirm!==undefined)sandbox.confirm=confirm;
  vm.createContext(sandbox);
  vm.runInContext(pairSource,sandbox,{filename:"js/persistentNikDanielPair.js"});
  const pair=sandbox.CareerModePersistentNikDanielPair;
  assert.ok(pair&&typeof pair.joinPairing==="function","the pair module loads in the sandbox");
  return Object.assign(h,{pair,docs,library,deleted,calls,document,sandbox,uid,deviceId,listeners,firestoreSdk,
    panel:()=>document.getElementById("persistentNikDanielPairPanel"),
    input:()=>document.getElementById("persistentNikDanielPairCode")});
}
function rivalryEnvelope(rivalryId,connectionState,nikSlot){return{schemaVersion:1,objectType:"rivalry",objectId:rivalryId,revision:1,parentRevision:0,lifecycleState:"live",contentHash:`sha256:${"9".repeat(64)}`,data:{connectionState,authorizedAccountIds:["uid_daniel","uid_nik"],managerSlots:[{slotId:"playerOne",accountId:"uid_daniel",saveId:DANIEL_SAVE,profileId:DANIEL_PROFILE},{slotId:"playerTwo",accountId:"uid_nik",saveId:nikSlot.saveId,profileId:nikSlot.profileId}]}};}
function linkEnvelope(rivalryId,role){return{schemaVersion:1,objectType:"pairLink",objectId:"current",revision:0,parentRevision:null,lifecycleState:"live",contentHash:`sha256:${"8".repeat(64)}`,data:{rivalryId,managerRole:role,managerId:role==="playerTwo"?"nik":"daniel",linkedAt:null,lastConfirmedAt:null}};}
function deviceEnvelope(deviceId){return{schemaVersion:1,objectType:"device",objectId:deviceId,revision:0,lifecycleState:"live",contentHash:`sha256:${"7".repeat(64)}`,data:{deviceId,state:"active"}};}
// The provider commit Nik's redeem makes: the durable pair-link witness plus the activated rivalry, in one transaction.
async function commitRedeem(options,h){
  return h.firestoreSdk.runTransaction({},async transaction=>{
    const now=h.firestoreSdk.Timestamp.fromMillis(Date.now());
    const witness=await options.durableWitness({transaction,binding:options.binding,capability:options.capability,now,nowEpochMs:Date.now()});
    transaction.set({path:`rivalries/${options.capability}`},rivalryEnvelope(options.capability,"active",options.binding));
    return witness;
  });
}

async function r3LostAcknowledgement(){
  for(const failure of [providerError("unavailable","The operation could not be completed."),providerError("PAIRING_CAPABILITY_ALREADY_USED","This private pairing code is no longer open.")]){
    const h=pairHarness({redeem:async(options,harness)=>{await commitRedeem(options,harness);return{ok:false,code:failure.code,message:failure.message};}});
    await h.pair.initialize({force:true});
    const result=await h.pair.joinPairing(CODE,{managerRole:"playerTwo"});
    assert.equal(result.status,"paired",`R3 a committed join reported as ${failure.code} is recognised as a success`);
    assert.equal(result.connectionState,"active");assert.equal(result.rivalryId,RIVALRY);
    assert.match(result.message,/joined Daniel's Showdown/,"R3 Nik is told he joined, not that the code is used");
    assert.doesNotMatch(result.message,/already used|expired|unavailable/i);
    assert.equal(result.busy,false);
    assert.deepEqual(h.deleted,[],"R3 the local copy bound to the committed join is kept");
    assert.equal(h.library.saves.some(entry=>entry.saveId===SAVE_NEW),true);
  }
  console.log("ok R3 a lost join acknowledgement or an 'already used' retry over a committed join reads as joined");
}

async function r3SingleFlight(){
  let release;const gate=new Promise(resolve=>{release=resolve;});
  const h=pairHarness({redeem:async()=>{await gate;return{ok:false,code:"PAIRING_CAPABILITY_EXPIRED",message:"This private pairing code has expired."};}});
  await h.pair.initialize({force:true});
  const order=[];
  const join=h.pair.joinPairing(CODE,{managerRole:"playerTwo"}).then(value=>{order.push("join");return value;});
  await settle();
  assert.equal(h.pair.getState().status,"joining");
  const forced=h.pair.initialize({force:true}).then(value=>{order.push("refresh");return value;});
  for(const listener of h.listeners.online||[])listener();
  await settle();
  assert.equal(h.pair.getState().busy,true,"R3 a forced refresh while the join is in flight does not clear busy");
  assert.equal(h.pair.getState().status,"joining","R3 the join state is not replaced mid-flight");
  assert.equal(buttons(h.panel(),"JOIN DANIEL'S SHOWDOWN").filter(button=>!button.disabled).length,0,"R3 JOIN is not re-enabled while the first redeem is in flight");
  assert.equal(order.length,0,"R3 the forced refresh waits for the join");
  release();
  await Promise.all([join,forced]);await settle();
  assert.deepEqual(order,["join","refresh"],"R3 the refresh resolves only after the join finished");
  assert.equal(h.calls.redeem.length,1,"R3 only one redeem was sent");
  assert.equal(h.pair.getState().busy,false);
  console.log("ok R3 JOIN is single-flight: a forced refresh waits for the in-flight join");
}

async function r7FailedJoinCleanup(){
  // Definitely refused: the empty copy this attempt created is removed.
  {
    const h=pairHarness({redeem:async()=>({ok:false,code:"PAIRING_CAPABILITY_EXPIRED",message:"This private pairing code has expired."})});
    await h.pair.initialize({force:true});
    const result=await h.pair.joinPairing(CODE,{managerRole:"playerTwo"});
    assert.equal(result.status,"error");
    assert.equal(h.calls.provision,1,"R7 the attempt created Nik's local copy");
    assert.deepEqual(h.deleted,[SAVE_NEW],"R7 a refused join removes the local copy it created");
    assert.equal(h.library.saves.length,0);assert.equal(h.library.activeSaveId,null);
    assert.equal(h.docs.has("accounts/uid_nik/pairLinks/current"),false);
  }
  // Ambiguous outcome: keep the copy (the join may still have landed).
  {
    const h=pairHarness({redeem:async()=>({ok:false,code:"unavailable",message:"The service is currently unavailable."})});
    await h.pair.initialize({force:true});
    await h.pair.joinPairing(CODE,{managerRole:"playerTwo"});
    assert.deepEqual(h.deleted,[],"R7 an ambiguous failure keeps the local copy");
    assert.equal(h.library.saves.length,1);
  }
  // The re-check cannot be read: keep the copy.
  {
    const h=pairHarness({redeem:async(_options,harness)=>{harness.failReads=true;return{ok:false,code:"PAIRING_CAPABILITY_EXPIRED",message:"This private pairing code has expired."};}});
    await h.pair.initialize({force:true});
    await h.pair.joinPairing(CODE,{managerRole:"playerTwo"});
    assert.deepEqual(h.deleted,[],"R7 an unreadable re-check keeps the local copy");
  }
  // A copy that existed before this attempt is never removed.
  {
    const h=pairHarness({saves:[shell(SAVE_OLD,PROFILE_OLD,3)],activeSaveId:SAVE_OLD,redeem:async()=>({ok:false,code:"PAIRING_CAPABILITY_EXPIRED",message:"This private pairing code has expired."})});
    await h.pair.initialize({force:true});
    await h.pair.joinPairing(CODE,{managerRole:"playerTwo"});
    assert.equal(h.calls.provision,0);
    assert.deepEqual(h.deleted,[],"R7 a pre-existing local copy is never removed by a failed join");
    assert.equal(h.library.saves.length,1);
  }
  // A different unfinished Showdown: the message points to Settings.
  {
    const h=pairHarness({saves:[shell(SAVE_OLD,PROFILE_OLD,5)],activeSaveId:SAVE_OLD});
    await h.pair.initialize({force:true});
    const result=await h.pair.joinPairing(CODE,{managerRole:"playerTwo"});
    assert.match(result.message,/Settings \(DELETE CURRENT SHOWDOWN\)/,"R7 the season mismatch says where to delete the old Showdown");
    assert.equal(h.calls.redeem.length,0);assert.deepEqual(h.deleted,[]);
  }
  assert.match(read("js/productionSharedJourneyEntry.js"),/Delete it in Settings \(DELETE CURRENT SHOWDOWN\), then paste Daniel's code again/,"R7 the joiner-shell refusal points to Settings too");
  console.log("ok R7 a refused join removes only the empty copy it created; ambiguous or pre-existing copies are kept");
}

async function r11PastedText(){
  const h=pairHarness({redeem:async()=>({ok:false,code:"PAIRING_CAPABILITY_EXPIRED",message:"expired"})});
  await h.pair.initialize({force:true});
  await h.pair.joinPairing(`Daniel: here is the code -> ${CODE.toUpperCase().replace("CMS17-PAIR_","CMS17-pair_")} (needed once)`,{managerRole:"playerTwo"});
  assert.deepEqual(h.calls.redeem,[RIVALRY],"R11 the code inside a pasted message is extracted and normalised");
  await h.pair.joinPairing(`${CODE}\n${CODE}`,{managerRole:"playerTwo"});
  assert.deepEqual(h.calls.redeem,[RIVALRY,RIVALRY],"R11 the same code pasted twice still joins");
  for(const bad of [`${CODE} and CMS17-${OTHER_RIVALRY}`,`${CODE}0`,"code: CMS17-not-a-code",`xpair_${"a".repeat(64)}`]){
    const before=h.calls.redeem.length;
    const result=await h.pair.joinPairing(bad,{managerRole:"playerTwo"});
    assert.equal(result.message,INVALID,`R11 ${JSON.stringify(bad.slice(0,24))}… stays invalid`);
    assert.equal(h.calls.redeem.length,before,"R11 an ambiguous or malformed paste never redeems");
    assert.doesNotMatch(result.message,/pair_/,"R11 the pasted text is never echoed");
  }
  console.log("ok R11 a pasted message with exactly one code joins with that code; ambiguous pastes stay invalid");
}

async function r6TransientStartup(){
  const cases=[
    [providerError("unavailable","Failed to get document because the client is offline."),/connection dropped/],
    [providerError("permission-denied","Missing or insufficient permissions."),/could not read your Showdown connection/],
    [providerError("resource-exhausted","Quota exceeded."),/limit for now/]
  ];
  for(const [error,expected] of cases){
    const h=pairHarness();h.servicesError=error;
    const failed=await h.pair.initialize({force:true});
    assert.equal(failed.status,"unavailable");
    assert.match(failed.message,expected,`R6 ${error.code} reads as a plain sentence`);
    assert.match(failed.message,/Tap CHECK STATUS to try again\./);
    assert.doesNotMatch(failed.message,/Failed to get document|Missing or insufficient|Quota exceeded/,"R6 raw Firebase text is not shown");
    const retry=buttons(h.panel(),"CHECK STATUS");
    assert.equal(retry.length,1,"R6 the unavailable panel keeps a CHECK STATUS retry");
    assert.equal(retry[0].disabled,false);
    h.servicesError=null;
    retry[0].click();
    await settle();
    assert.equal(h.pair.getState().status,"unpaired","R6 CHECK STATUS recovers once the provider is reachable");
    assert.equal(buttons(h.panel(),"JOIN DANIEL'S SHOWDOWN").length,1);
  }
  const h=pairHarness();h.servicesError=Object.assign(new Error("This browser is not ready yet."),{code:"PERSISTENT_PAIR_DEVICE_REQUIRED"});
  assert.equal((await h.pair.initialize({force:true})).message,"This browser is not ready yet.","R6 product messages are kept as written");
  console.log("ok R6 a transient startup error shows plain text and a working CHECK STATUS retry");
}

async function r10ClockHint(){
  const h=pairHarness({role:"playerOne",saves:[shell(DANIEL_SAVE,DANIEL_PROFILE,3,"playerOne")],activeSaveId:DANIEL_SAVE,create:async()=>({ok:false,code:"permission-denied",message:"Missing or insufficient permissions."})});
  await h.pair.initialize({force:true});
  const result=await h.pair.startPairing({managerRole:"playerOne"});
  assert.equal(h.calls.create.length,1);
  assert.equal(result.status,"error");
  assert.match(result.message,/connection code could not be created/);
  assert.match(result.message,/phone's date and time are set automatically/,"R10 a refused CREATE carries the phone-clock hint");
  assert.doesNotMatch(result.message,/Missing or insufficient/);
  const pairing=read("js/sparkPrivatePairing.js");
  assert.doesNotMatch(pairing,/use Connected Rivalry below if these managers/,"R10 the join error no longer points to the hidden Connected Rivalry panel");
  assert.match(pairing,/go Home and tap CONTINUE CAREER instead/);
  assert.doesNotMatch(pairing,/on your local Showdown to join this rivalry/);
  console.log("ok R10 CREATE permission refusals carry the phone-clock hint; join wording points to Home");
}

async function r2DurableStorage(){
  let persistCalls=0,persistedCalls=0;
  const navigator={storage:{persisted:async()=>{persistedCalls+=1;return false;},persist:async()=>{persistCalls+=1;return true;}}};
  const h=pairHarness({navigator,redeem:async(options,harness)=>{const witness=await commitRedeem(options,harness);return{ok:true,rivalryId:options.capability,durableWitness:witness};}});
  await h.pair.initialize({force:true});
  assert.equal(persistCalls,0,"R2 an unpaired browser is not asked for durable storage");
  const joined=await h.pair.joinPairing(CODE,{managerRole:"playerTwo"});
  assert.equal(joined.status,"paired");
  await h.pair.initialize({force:true});await h.pair.initialize({force:true});await settle();
  assert.equal(persistedCalls,1);assert.equal(persistCalls,1,"R2 persist() is asked exactly once per page");
  let already=0;
  const kept=pairHarness({navigator:{storage:{persisted:async()=>true,persist:async()=>{already+=1;return true;}}},docs:{"accounts/uid_nik/pairLinks/current":linkEnvelope(RIVALRY,"playerTwo"),[`rivalries/${RIVALRY}`]:rivalryEnvelope(RIVALRY,"active",{saveId:SAVE_NEW,profileId:PROFILE_NEW})},saves:[shell(SAVE_NEW,PROFILE_NEW,3)],activeSaveId:SAVE_NEW});
  assert.equal((await kept.pair.initialize({force:true})).status,"paired");await settle();
  assert.equal(already,0,"R2 already-durable storage is not asked again");
  const throwing=pairHarness({navigator:{get storage(){throw new Error("blocked");}},docs:{"accounts/uid_nik/pairLinks/current":linkEnvelope(RIVALRY,"playerTwo"),[`rivalries/${RIVALRY}`]:rivalryEnvelope(RIVALRY,"active",{saveId:SAVE_NEW,profileId:PROFILE_NEW})},saves:[shell(SAVE_NEW,PROFILE_NEW,3)],activeSaveId:SAVE_NEW});
  assert.equal((await throwing.pair.initialize({force:true})).status,"paired","R2 a blocked storage API never breaks the pair");
  console.log("ok R2 navigator.storage.persist() is requested once, best effort");
}

async function r2ExplicitConfirm(){
  const recoveryDocs=()=>({"accounts/uid_nik/pairLinks/current":linkEnvelope(RIVALRY,"playerTwo"),[`rivalries/${RIVALRY}`]:rivalryEnvelope(RIVALRY,"active",{saveId:SAVE_NEW,profileId:PROFILE_NEW}),"accounts/uid_nik/devices/device_nik":deviceEnvelope("device_nik")});
  for(const confirm of [undefined,()=>undefined,()=>"yes",()=>1]){
    const h=pairHarness({docs:recoveryDocs(),confirm});
    assert.equal((await h.pair.initialize({force:true})).status,"recovery-required");
    assert.equal(await h.pair.startOver(),false,"R2 START OVER without an explicit yes does nothing");
    assert.equal(h.docs.get(`rivalries/${RIVALRY}`).data.connectionState,"active","R2 the shared Showdown is not closed");
    assert.deepEqual(h.calls.navigate,[]);
  }
  const yes=pairHarness({docs:recoveryDocs(),confirm:()=>true});
  await yes.pair.initialize({force:true});
  assert.equal(await yes.pair.startOver(),true,"R2 an explicit yes still starts over");
  assert.equal(yes.docs.get(`rivalries/${RIVALRY}`).data.connectionState,"closed");
  assert.deepEqual(yes.calls.navigate,["createShowdown"]);
  const pendingDocs={"accounts/uid_nik/pairLinks/current":linkEnvelope(RIVALRY,"playerTwo"),[`rivalries/${RIVALRY}`]:rivalryEnvelope(RIVALRY,"pending-pair",{saveId:SAVE_NEW,profileId:PROFILE_NEW}),"accounts/uid_nik/devices/device_nik":deviceEnvelope("device_nik")};
  const stale=pairHarness({docs:pendingDocs,saves:[shell(SAVE_NEW,PROFILE_NEW,3)],activeSaveId:SAVE_NEW});
  assert.equal((await stale.pair.initialize({force:true})).connectionState,"pending-pair");
  assert.equal(await stale.pair.discardStalePendingConnection(),false,"R2 DELETE OLD CONNECTION without confirm() does nothing");
  assert.equal(stale.docs.get(`rivalries/${RIVALRY}`).data.connectionState,"pending-pair");assert.deepEqual(stale.deleted,[]);
  const entry=read("js/productionSharedJourneyEntry.js"),fresh=entry.slice(entry.indexOf("async function prepareFreshStart"),entry.indexOf("async function startShared"));
  assert.match(fresh,/const confirmed=root\.confirm\?\.\([\s\S]*if\(confirmed!==true\)return false;[\s\S]*abandonCurrentShowdown/,"R2 START A SHOWDOWN over a live pair closes it only on an explicit yes");
  assert.doesNotMatch(entry+pairSource,/confirmed===false/,"R2 no destructive path treats a missing confirm() as consent");
  assert.match(pairSource,/"DELETE OLD SHOWDOWN & START OVER"\),recover=pairCreateElement\("button","menuButton","RESTORE BACKUP"\)/,"R2 the recovery buttons and their order are unchanged (owner decision)");
  console.log("ok R2 destructive start-over paths need confirm()===true");
}

// ---------------------------------------------------------------------------------------------------------------
// Remote Joining harness.
const RJ_RIVALRY=`pair_${"3".repeat(64)}`,S1=`session_${"1".repeat(64)}`,S2=`session_${"2".repeat(64)}`,S3=`session_${"3".repeat(64)}`,RJ_DEVICE=`device_${"6".repeat(32)}`;
function remoteHarness({withDom=false}={}){
  const calls={open:[],join:[],close:[],revoke:[]},ids=[S2,S3];
  const outcome={open:null,join:null,close:null,revoke:null};
  let account="account_daniel";
  const ok=(options,state,revision)=>({ok:true,sessionId:options.sessionId,state,revision,expiresAtEpochMs:Date.now()+3600000});
  const protocol={
    generateSessionId:()=>ids.shift(),
    normalizeSessionId:value=>{const id=String(value||"").trim().toLowerCase();if(!/^session_[0-9a-f]{64}$/.test(id))throw providerError("PRIVATE_SESSION_ID_INVALID","The private session code is invalid.");return id;},
    openSession:async options=>{calls.open.push(options.sessionId);return outcome.open?outcome.open(options):ok(options,"open",0);},
    joinSession:async options=>{calls.join.push(options.sessionId);return outcome.join?outcome.join(options):ok(options,"active",1);},
    closeSession:async options=>{calls.close.push(options.sessionId);return outcome.close?outcome.close(options):ok(options,"closed",2);},
    revokeSession:async options=>{calls.revoke.push(options.sessionId);return outcome.revoke?outcome.revoke(options):ok(options,"revoked",1);},
    readSession:async options=>ok(options,"active",1)
  };
  const dom=withDom?createDom():null;
  const sandbox={console,URL,Date,TextEncoder,crypto:webcrypto,Promise,clearTimeout,navigator:{},setTimeout:()=>0,
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:account}},firestore:{},firestoreSdk:{}})},
    CareerModeSparkConnectedAccount:{initialize:async()=>{},getState:()=>({connected:true,accountId:account})},
    CareerModeSparkPrivatePairing:{initialize:async()=>{},getState:()=>({registered:true,deviceId:RJ_DEVICE})},
    CareerModeSparkConnectedRivalry:{initialize:async()=>{},getState:()=>({attached:true,rivalryId:RJ_RIVALRY,accountId:account,deviceId:RJ_DEVICE})},
    CareerModeSparkPrivateSession:{},CareerModeSparkStandardAuthPrivateSession:protocol};
  if(dom)sandbox.document=dom.document;
  sandbox.globalThis=sandbox;sandbox.window=sandbox;vm.createContext(sandbox);
  vm.runInContext(read("js/sparkRemoteJoining.js"),sandbox,{filename:"sparkRemoteJoining.js"});
  const api=sandbox.CareerModeSparkRemoteJoining;
  return{api,calls,outcome,dom,switchAccount:value=>{account=value;},sandbox};
}

async function r1HostReplacesOwnSession(){
  const h=remoteHarness();
  assert.equal((await h.api.joinSession(S1)).ok,true);
  assert.equal(h.api.getState().sessionState,"active");
  let result=await h.api.hostSession();
  assert.equal(result.code,"REMOTE_JOINING_SESSION_ALREADY_HELD","R1 a plain HOST still refuses over a held session");
  assert.deepEqual(h.calls.close,[]);assert.deepEqual(h.calls.open,[]);
  result=await h.api.hostSession({replaceCurrent:true});
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.deepEqual(h.calls.close,[S1],"R1 HOST (replace) first closes this phone's own ACTIVE session");
  assert.deepEqual(h.calls.open,[S2],"R1 then opens one fresh session");
  assert.equal(h.api.getState().sessionId,S2);assert.equal(h.api.getState().sessionState,"open");assert.equal(h.api.getState().role,"host");
  result=await h.api.hostSession({replaceCurrent:true});
  assert.equal(result.ok,true);
  assert.deepEqual(h.calls.revoke,[S2],"R1 an OPEN hosted session is revoked before hosting again");
  assert.deepEqual(h.calls.open,[S2,S3]);
  console.log("ok R1 HOST can replace this phone's own ACTIVE or OPEN session; a plain HOST keeps the guard");
}

async function r1ReplaceGuards(){
  // Different account now signed in: the held session is not touched.
  {
    const h=remoteHarness();await h.api.joinSession(S1);h.switchAccount("account_other");
    const result=await h.api.hostSession({replaceCurrent:true});
    assert.equal(result.ok,false);assert.equal(result.code,"REMOTE_JOINING_REPLACE_CONTEXT_CHANGED","R1 only the same account may replace its session");
    assert.deepEqual(h.calls.close,[]);assert.deepEqual(h.calls.open,[]);
  }
  // Unresolved host capability: never replaced.
  {
    const h=remoteHarness();h.outcome.open=()=>({ok:false,code:"unavailable",message:"The service is currently unavailable."});
    assert.equal((await h.api.hostSession()).recoverable,true);
    const result=await h.api.hostSession({replaceCurrent:true});
    assert.equal(result.code,"REMOTE_JOINING_SESSION_ALREADY_HELD","R1 an unresolved capability is never replaced");
    assert.equal(h.calls.open.length,1);assert.deepEqual(h.calls.close,[]);assert.deepEqual(h.calls.revoke,[]);
  }
  // Close outcome unknown: no new session is hosted.
  {
    const h=remoteHarness();await h.api.joinSession(S1);h.outcome.close=()=>({ok:false,code:"unavailable",message:"The service is currently unavailable."});
    const result=await h.api.hostSession({replaceCurrent:true});
    assert.equal(result.ok,false);assert.deepEqual(h.calls.open,[],"R1 an unconfirmed close never hosts a second session");
    assert.equal(h.api.getState().pendingAction,"close");
  }
  // Close refused: the old session is kept and nothing is hosted.
  {
    const h=remoteHarness();await h.api.joinSession(S1);h.outcome.close=()=>({ok:false,code:"PRIVATE_SESSION_TERMINAL",message:"A terminal private session cannot transition again."});
    const result=await h.api.hostSession({replaceCurrent:true});
    assert.equal(result.ok,false);assert.deepEqual(h.calls.open,[]);
  }
  console.log("ok R1 replacement is refused for other accounts, unresolved capabilities and unconfirmed closes");
}

async function r1JoinReplacesActiveSession(){
  const h=remoteHarness();await h.api.joinSession(S1);
  assert.equal((await h.api.joinSession(S2)).code,"REMOTE_JOINING_SESSION_ALREADY_HELD","R1 a plain JOIN still refuses over a held session");
  let result=await h.api.joinSession("not-a-session",{replaceCurrent:true});
  assert.equal(result.ok,false);assert.deepEqual(h.calls.close,[],"R1 a bad code never ends the current session");
  result=await h.api.joinSession(S1,{replaceCurrent:true});
  assert.equal(result.code,"REMOTE_JOINING_SAME_SESSION");assert.deepEqual(h.calls.close,[]);
  result=await h.api.joinSession(` ${S2} `,{replaceCurrent:true});
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.deepEqual(h.calls.close,[S1],"R1 JOIN (replace) closes this phone's ACTIVE session first");
  assert.deepEqual(h.calls.join,[S1,S2]);
  assert.equal(h.api.getState().sessionId,S2);assert.equal(h.api.getState().sessionState,"active");
  // An OPEN hosted session keeps the existing join guard (audit #8 is an owner decision).
  const host=remoteHarness();await host.api.hostSession();
  assert.equal((await host.api.joinSession(S3,{replaceCurrent:true})).code,"REMOTE_JOINING_SESSION_ALREADY_HELD");
  assert.deepEqual(host.calls.revoke,[]);assert.deepEqual(host.calls.join,[]);
  console.log("ok R1 JOIN can end this phone's ACTIVE session for a fresh code; OPEN host sessions keep the guard");
}

async function r1PanelPrompt(){
  const h=remoteHarness({withDom:true});
  h.api.openPanel();
  let body=h.dom.document.getElementById("sparkRemoteJoiningOverlay");
  assert.equal(buttons(body,"HOST PRIVATE SESSION").length,1);
  assert.match(body.textContent,/takes your new code from NEW SESSION CODE on its game banner, or from Home > CONTINUE CAREER > CONNECTED/,"R1 a phone with no session is told where the other phone takes the new code");
  await h.api.joinSession(S1);
  body=h.dom.document.getElementById("sparkRemoteJoiningOverlay");
  const host=buttons(body,"HOST NEW SESSION (REPLACES CURRENT)"),join=buttons(body,"JOIN NEW SESSION (ENDS CURRENT)");
  assert.equal(host.length,1,"R1 a phone holding an ACTIVE session is offered HOST NEW SESSION");
  assert.equal(join.length,1,"R1 and JOIN NEW SESSION for the other phone's fresh code");
  assert.equal(host[0].disabled,false);assert.equal(join[0].disabled,false);
  assert.match(body.textContent,/If the other phone lost this session/,"R1 the panel says when to use them");
  const input=body.all().find(node=>node.tagName==="INPUT");input.value=S2;
  join[0].click();await settle();
  assert.deepEqual(h.calls.close,[S1]);assert.deepEqual(h.calls.join,[S1,S2]);
  console.log("ok R1 the Remote Joining panel offers replace actions on the phone that still holds the session");
}

async function r10RemoteWording(){
  const h=remoteHarness();h.outcome.open=()=>({ok:false,code:"permission-denied",message:"Missing or insufficient permissions."});
  const result=await h.api.hostSession();
  assert.equal(result.ok,false);
  const message=h.api.getState().message;
  assert.match(message,/phone's date and time are set automatically/,"R10 a refused HOST carries the phone-clock hint");
  assert.doesNotMatch(message,/Missing or insufficient/);
  const j=remoteHarness();j.outcome.join=()=>({ok:false,code:"permission-denied",message:"Missing or insufficient permissions."});
  await j.api.joinSession(S1);
  assert.match(j.api.getState().message,/phone's date and time/,"R10 a refused JOIN carries the phone-clock hint");
  const source=read("js/sparkRemoteJoining.js");
  assert.doesNotMatch(source,/from Save Library/,"R10 Remote Joining no longer points to the hidden Save Library");
  console.log("ok R10 HOST/JOIN permission refusals carry the clock hint; no hidden-screen wording");
}

// ---------------------------------------------------------------------------------------------------------------
// Journey Reconnect banner harness (real reconnect + multi-season protocol, stubbed providers).
const PJR_ACCOUNT="account_daniel";
function setupFixture(){return{rivalryId:RJ_RIVALRY,revision:6,phase:"SHOWDOWN_CONFIRMED",leagueId:"premier-league",totalSeasons:3,clubs:{playerOne:"Arsenal",playerTwo:"Chelsea"}};}
function progressionFixture(){return{schemaVersion:1,runtimeRevision:"1.9.1-r13",phase:"SEASON_READY",revision:1,rivalryId:RJ_RIVALRY,setupRevision:6,leagueId:"premier-league",totalSeasons:3,acceptedSeasons:1,activeSeason:2,completedSeason:1,fixedClubs:{playerOne:"Arsenal",playerTwo:"Chelsea"},acceptedRevisionKey:`1:2:sha256:${"1".repeat(64)}`,terminal:false,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false};}
function reconnectHarness(role,remoteInitial){
  const listeners=new Set(),panel={opens:0,closes:0},nodes=[];
  let remote=remoteInitial;
  const status={id:"sharedJourneyReconnectStatus",text:"",dataset:{},hidden:true,children:[],
    classList:{toggle:(name,force)=>{if(name==="hidden")status.hidden=Boolean(force);}},
    replaceChildren(...items){status.children=items;status.text=items.map(item=>typeof item==="string"?item:item.textContent||"").join("");},
    append(...items){status.children.push(...items);status.text+=items.map(item=>typeof item==="string"?item:item.textContent||"").join("");}};
  const document={visibilityState:"visible",getElementById:id=>id==="sharedJourneyReconnectStatus"?status:null,createTextNode:text=>String(text),
    createElement:()=>{const node={textContent:"",dataset:{},listeners:[],addEventListener(type,fn){if(type==="click")node.listeners.push(fn);},click(){for(const fn of node.listeners)fn();}};nodes.push(node);return node;},addEventListener(){}};
  const sandbox={console,Promise,Date,document,navigator:{onLine:true},setTimeout,clearTimeout,setInterval(){return 0;},addEventListener(){},dispatchEvent(){},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init&&init.detail;}},
    currentShowdown:{sharedJourney:{mode:"shared",rivalryId:RJ_RIVALRY},managers:{playerOne:"Daniel",playerTwo:"Nik"}},
    reportApplicationError(){},
    loadRuntimeScript:async()=>true,
    CareerModeSharedMultiSeasonProgression:require("../../js/sharedMultiSeasonProgression.js"),
    CareerModeSharedJourneyReconnect:require("../../js/sharedJourneyReconnect.js"),
    CareerModeProductionSharedShowdownSetup:{refresh:async()=>true,getState:()=>({ready:true,rivalryId:RJ_RIVALRY,sessionId:remote&&remote.sessionId,setup:setupFixture()})},
    CareerModeProductionSharedMultiSeasonProgression:{refresh:async()=>true,getState:()=>({authoritative:true,rivalryId:RJ_RIVALRY,state:progressionFixture()}),lastError:()=>""},
    CareerModeSparkRemoteJoining:{getState:()=>remote,subscribe:listener=>{listeners.add(listener);return()=>listeners.delete(listener);},openPanel:async()=>{panel.opens+=1;return true;},closePanel:()=>{panel.closes+=1;return true;}},
    CareerModeSparkConnectedAccount:{getState:()=>({connected:true,accountId:PJR_ACCOUNT})},
    CareerModeSparkPrivatePairing:{getState:()=>({registered:true,deviceId:RJ_DEVICE})},
    CareerModeSparkConnectedRivalry:{getState:()=>({attached:true,rivalryId:RJ_RIVALRY,binding:{managerRole:role}})}};
  sandbox.globalThis=sandbox;vm.createContext(sandbox);
  vm.runInContext(read("js/productionSharedJourneyReconnect.js"),sandbox,{filename:"productionSharedJourneyReconnect.js"});
  const api=sandbox.CareerModeProductionSharedJourneyReconnect;
  return{api,panel,status,setRemote(next){remote=next;for(const listener of [...listeners])listener(remote);},button:id=>status.children.find(item=>item&&item.id===id)||null};
}
const activeRemote=(sessionId,extra={})=>({sessionId,rivalryId:RJ_RIVALRY,accountId:PJR_ACCOUNT,deviceId:RJ_DEVICE,sessionState:"active",pendingAction:null,expiresAtEpochMs:Date.now()+3600000,...extra});

async function r1ReconnectBanner(){
  for(const [role,other] of [["playerOne","Nik"],["playerTwo","Daniel"]]){
    const reloaded=reconnectHarness(role,{sessionId:null,rivalryId:null,accountId:null,deviceId:null,sessionState:null,pendingAction:null,expiresAtEpochMs:null});
    await reloaded.api.refresh();
    assert.equal(reloaded.api.getState().phase,"FRESH_SESSION_REQUIRED");
    assert.match(reloaded.status.text,/^NOT CONNECTED ON THIS PHONE · /,"R1 a phone with no session in memory says it is not connected");
    assert.doesNotMatch(reloaded.status.text,/has ended/,"R1 a reload is not reported as an ended session");
    assert.match(reloaded.status.text,new RegExp(`Tap RECONNECT SESSION, then HOST and send the code to ${other}, or JOIN ${other}'s new code\\.`),"R1 the banner says to host or join a fresh session");
    const ended=reconnectHarness(role,activeRemote(S1,{expiresAtEpochMs:Date.now()-1000}));await ended.api.refresh();
    assert.ok(reloaded.status.text.length<=ended.status.text.length,"R1 the banner is no longer than the ended-session line (the two-manager journey showed a longer one reflows the game screens)");
    assert.ok(reloaded.button("sharedJourneyReconnectAction"),"R1 RECONNECT SESSION is still offered");
  }
  const expired=reconnectHarness("playerTwo",activeRemote(S1,{expiresAtEpochMs:Date.now()-1000}));
  await expired.api.refresh();
  assert.match(expired.status.text,/FRESH PRIVATE SESSION REQUIRED · The private session has ended \(sessions last up to 4 hours\)/,"R1 a truly expired session keeps its wording");
  console.log("ok R1 the reloaded phone is told it is not connected and how both phones reconnect");
}

async function r1OtherPhonePrompt(){
  const h=reconnectHarness("playerOne",activeRemote(S1,{expiresAtEpochMs:Date.now()-1000}));
  await h.api.refresh();
  h.setRemote(activeRemote(S1));await settle();await h.api.refresh();
  assert.equal(h.api.getState().phase,"ACTIVE_RECOVERED");
  const fresh=h.button("sharedJourneyReconnectNewCode");
  assert.ok(fresh,"R1 a phone that still holds its session gets a NEW SESSION CODE action");
  assert.equal(fresh.textContent,"NEW SESSION CODE");
  assert.equal(h.button("sharedJourneyReconnectAction"),null,"R1 the RECONNECT SESSION action stays for ended sessions only");
  fresh.click();await settle();
  assert.equal(h.panel.opens,1,"R1 NEW SESSION CODE opens Remote Joining");
  h.setRemote(activeRemote(S1,{revision:2}));await settle();
  assert.equal(h.panel.closes,0,"R1 the panel stays open while only the old session is ACTIVE");
  h.setRemote({...activeRemote(S1),sessionState:"closed"});await settle();
  assert.equal(h.panel.closes,0);
  h.setRemote(activeRemote(S2));await settle();
  assert.equal(h.panel.closes,1,"R1 the panel closes once the fresh session is ACTIVE");
  console.log("ok R1 the phone that still holds the old session gets a usable NEW SESSION CODE prompt");
}

(async()=>{
  await r1HostReplacesOwnSession();
  await r1ReplaceGuards();
  await r1JoinReplacesActiveSession();
  await r1PanelPrompt();
  await r1ReconnectBanner();
  await r1OtherPhonePrompt();
  await r2DurableStorage();
  await r2ExplicitConfirm();
  await r3LostAcknowledgement();
  await r3SingleFlight();
  await r6TransientStartup();
  await r7FailedJoinCleanup();
  await r10ClockHint();
  await r10RemoteWording();
  await r11PastedText();
  console.log("PASS BH-11 pairing and reconnect contracts.");
})().catch(error=>{console.error(error);process.exit(1);});

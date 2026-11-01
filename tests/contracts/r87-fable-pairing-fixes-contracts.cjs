"use strict";
// r87 Fable job 4 (Settings and pairing) and the pairing parts of Fable job 3: each fixed finding, driven through the real
// modules in a vm sandbox (in-memory Firestore, fake clock and timers, tiny DOM). F4-01 is proven in
// pairing-reconnect-bh11 (R7) and r79-delete-rejoin (J5b); F4-02's decision in r79-modes-settings.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};
async function settle(){for(let i=0;i<30;i+=1)await new Promise(r=>setImmediate(r));}

const R=`pair_3${"1".repeat(63)}`,RN=`pair_3${"2".repeat(63)}`,SAVE=`save_${"a".repeat(24)}`,PROFILE=`profile_${"b".repeat(24)}`;
const START=1_800_000_000_000,MIN=60_000;
const ts=ms=>({toMillis:()=>ms});
const env=(objectType,objectId,data,revision=1)=>({schemaVersion:1,objectType,objectId,revision,parentRevision:revision-1,lifecycleState:"live",contentHash:`sha256:${"0".repeat(64)}`,data});
const partnerRecord=(partnerAccountId,myRole,{active=true,pairedAt=START,via=R}={})=>({schemaVersion:1,partnerAccountId,myRole,pairedViaRivalryId:via,pairedAt:ts(pairedAt),updatedAt:ts(pairedAt),active});
function denied(){const error=new Error("Missing or insufficient permissions.");error.code="permission-denied";return error;}

function makeClock(start=START){const clock={now:start};class ClockDate extends Date{constructor(...args){super(...(args.length?args:[clock.now]));}static now(){return clock.now;}}clock.Date=ClockDate;return clock;}
function makeTimers(){const list=[];let next=0;return{setTimeout:(fn,ms)=>{const t={id:++next,fn,ms:Number(ms)||0,cleared:false,fired:false};list.push(t);return t.id;},clearTimeout:id=>{const t=list.find(item=>item.id===id);if(t)t.cleared=true;},pending:()=>list.filter(t=>!t.cleared&&!t.fired),async fire(t){t.fired=true;t.fn();await settle();}};}
function createDom(){
  let active=null;
  class El{
    constructor(tag){this.tagName=String(tag).toUpperCase();this.children=[];this.parent=null;this.style={};this.listeners={};this.id="";this.className="";this.ownText="";this.value="";this.disabled=false;this.dataset={};const self=this;this.classList={contains:c=>self.className.split(/\s+/).includes(c),add:c=>{if(!self.classList.contains(c))self.className=`${self.className} ${c}`.trim();},remove:c=>{self.className=self.className.split(/\s+/).filter(x=>x&&x!==c).join(" ");}};}
    get textContent(){return this.ownText+this.children.map(c=>c.textContent).join("");}
    set textContent(v){this.ownText=v==null?"":String(v);this.children=[];}
    get isConnected(){let n=this;while(n){if(n===body)return true;n=n.parent;}return false;}
    get parentNode(){return this.parent;}
    append(...nodes){for(const n of nodes){if(n.parent)n.parent.children=n.parent.children.filter(c=>c!==n);n.parent=this;this.children.push(n);}}
    replaceChildren(...nodes){for(const c of this.children)c.parent=null;this.children=[];this.append(...nodes);}
    addEventListener(type,fn){(this.listeners[type]||(this.listeners[type]=[])).push(fn);}
    click(){if(!this.disabled)for(const fn of this.listeners.click||[])fn({preventDefault(){}});}
    focus(){if(this.isConnected)active=this;}
    setSelectionRange(){}
    all(){return this.children.flatMap(c=>[c,...c.all()]);}
    querySelector(sel){return sel==="code"?this.all().find(n=>n.tagName==="CODE")||null:null;}
    scrollIntoView(){}
  }
  const body=new El("body"),connect=new El("section"),slot=new El("div");connect.id="connectPlayersScreen";connect.className="hidden";slot.id="connectPlayersPairSlot";body.append(connect);connect.append(slot);
  const document={visibilityState:"visible",createElement:tag=>new El(tag),getElementById:id=>body.all().find(n=>n.id===id)||null,querySelector:sel=>sel==="#connectPlayersScreen #connectPlayersPairSlot"?slot:null,get activeElement(){return active&&active.isConnected?active:body;},addEventListener(){}};
  return{document,connect};
}

// ---------------------------------------------------------------- the pair module, in a sandbox
function pairHarness({uid="uid_daniel",managerId="daniel",docs:seed={},deny=[],create=null,library=null,bindings=[]}={}){
  const dom=createDom(),clock=makeClock(),timers=makeTimers();
  const docs=new Map(Object.entries(seed)),denies=new Set(deny),io={gets:[],writes:[]},fresh=[];
  const transaction={get:async ref=>{io.gets.push(ref.path);if(denies.has(ref.path))throw denied();const value=docs.get(ref.path);return{exists:()=>value!==undefined,data:()=>JSON.parse(JSON.stringify(value),(_k,v)=>v)};},set:(ref,value)=>{io.writes.push(ref.path);docs.set(ref.path,value);},update:(ref)=>{io.writes.push(ref.path);},delete:(ref)=>{io.writes.push(ref.path);}};
  // Timestamp-like values survive the JSON copy above as plain objects; give them back their toMillis
  const revive=value=>{if(!value||typeof value!=="object")return value;if(Array.isArray(value))return value.map(revive);if(Number.isFinite(value.__ms))return ts(value.__ms);const out={};for(const [k,v] of Object.entries(value))out[k]=revive(v);return out;};
  transaction.get=(base=>async ref=>{const snap=await base(ref);const raw=docs.get(ref.path);return{exists:snap.exists,data:()=>revive(JSON.parse(JSON.stringify(raw===undefined?null:raw,(_k,v)=>v&&typeof v==="object"&&typeof v.toMillis==="function"?{__ms:v.toMillis()}:v)))};})(transaction.get);
  const firestoreSdk={doc:(_db,...parts)=>({path:parts.join("/")}),runTransaction:async(_db,fn)=>fn(transaction),getDoc:async ref=>transaction.get(ref),Timestamp:{fromMillis:ms=>ts(ms)},serverTimestamp:()=>ts(clock.now)};
  const calls={create:0,openStart:0};
  const lib=library||{activeSaveId:null,saves:[]};
  const sandbox={console:{...console,warn(){}},TextEncoder,crypto:webcrypto,Date:clock.Date,document:dom.document,setTimeout:timers.setTimeout,clearTimeout:timers.clearTimeout,
    getActiveScreenName:()=>h.screen,
    CareerModeFirestoreBudget:{services:s=>s,wantFresh:p=>fresh.push(p===undefined?"<every read of the page>":p),readServerNext(){},quotaMessage:()=>null},
    CareerModeOnlinePlayerIdentity:{getState:()=>({managerId}),openStart:async()=>{calls.openStart+=1;return null;}},
    CareerModeSparkConnectedAccount:{initialize:async()=>({}),getState:()=>({connected:true,accountId:uid})},
    CareerModeSparkPrivatePairing:{initialize:async()=>({}),getState:()=>({registered:true,deviceId:"device_1"}),localBindingOptions:()=>bindings,getOrCreateDeviceIdentity:async()=>({deviceId:"device_1"}),createPairing:async options=>{calls.create+=1;return create?create(options):{ok:false,code:"PAIRING_CREATE_FAILED",message:"unconfigured"};},pairingJoinErrorMessage:error=>error?.message||"The code could not be joined."},
    CareerModeCareerStartMarker:{readCurrentMarker:async()=>({status:"none"})},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid}},firestore:{},firestoreSdk})},
    CareerModeSaveLibraryRuntime:{isReady:()=>true,getLibrarySnapshot:()=>JSON.parse(JSON.stringify(lib)),switchActiveSave:async id=>{lib.activeSaveId=id;return true;},deleteSave:id=>{lib.saves=lib.saves.filter(e=>e.saveId!==id);return{ok:true,deletedSaveId:id};}}};
  vm.createContext(sandbox);vm.runInContext(read("js/persistentNikDanielPair.js"),sandbox,{filename:"js/persistentNikDanielPair.js"});
  const h={pair:sandbox.CareerModePersistentNikDanielPair,dom,clock,timers,docs,io,fresh,calls,sandbox,screen:"mainMenu",
    panel:()=>dom.document.getElementById("persistentNikDanielPairPanel"),
    buttons:()=>(h.panel()?.all()||[]).filter(n=>n.tagName==="BUTTON").map(n=>n.textContent),
    text:()=>h.panel()?.textContent||""};
  return h;
}
function danielDocs({expiresAt=START+20*MIN,inviteState="open",partner=false,nikSide=null}={}){
  const docs={
    "accounts/uid_daniel/pairLinks/current":env("pairLink","current",{managerRole:"playerOne",managerId:"daniel",rivalryId:R}),
    [`rivalries/${R}`]:env("rivalry",R,{connectionState:"pending-pair",managerSlots:[{accountId:"uid_daniel",slotId:"playerOne",saveId:SAVE,profileId:PROFILE},{accountId:null,slotId:"playerTwo",entitlementState:"open"}]}),
    [`rivalries/${R}/invites/${R}`]:env("invite",R,{purpose:"rivalry-pairing",slotId:"playerTwo",state:inviteState,createdByAccountId:"uid_daniel",expiresAt:ts(expiresAt)})
  };
  if(partner)docs["accounts/uid_daniel/partner/current"]=partnerRecord("uid_nik","playerOne");
  if(nikSide)docs["accounts/uid_nik/partner/current"]=nikSide;
  return docs;
}
const danielShell={activeSaveId:SAVE,saves:[{saveId:SAVE,showdown:{totalRounds:3,sharedJourney:{mode:"shared",setupPending:true},managers:{playerOne:"Daniel",playerTwo:"Nik"},selectedLeague:null,clubs:{},rounds:[],identity:{managerProfileIds:{playerOne:PROFILE}}}}]};
const danielBinding=[{managerRole:"playerOne",saveId:SAVE,profileId:PROFILE}];

(async()=>{
// ---------------------------------------------------------------- F4-04 / F4-12: the open code says until when; NEW CODE only once expired
{
  const h=pairHarness({docs:danielDocs()});
  const first=await h.pair.initialize({force:true});
  assert.equal(first.connectionState,"pending-pair","fixture: Daniel's code waits for Nik");
  assert.equal(h.io.gets.filter(p=>p===`rivalries/${R}/invites/${R}`).length,1,"after a reload the code's expiry is read once");
  assert.equal(h.pair.getCodeExpiry?.()?.expired,false,"the code is known to be open");
  assert.ok(h.panel().querySelector("code"),"the open code is shown");
  assert.ok(h.buttons().includes("COPY CODE")&&h.buttons().includes("CHECK STATUS"));
  assert.ok(!h.buttons().includes("NEW CODE"),"no NEW CODE while the code is open (the Rules refuse a second code then)");
  assert.match(h.text(),/THIS CODE WORKS UNTIL /,"the open code says until when it works");
  await h.pair.initialize({force:true});
  assert.equal(h.io.gets.filter(p=>p===`rivalries/${R}/invites/${R}`).length,1,"the expiry is not read again on this page");
  ok("F4-04/F4-12","Daniel's open code: one invite read per page for its expiry, WORKS UNTIL shown, NEW CODE hidden while open");
}
// ---------------------------------------------------------------- F4-03 / F3-04 / F4-04: the waiting poll is bounded
{
  const h=pairHarness({docs:danielDocs({expiresAt:START+10*MIN})});
  await h.pair.initialize({force:true});
  let pending=h.timers.pending();assert.equal(pending.length,1,"one waiting-poll timer");
  let before=h.io.gets.length;await h.timers.fire(pending[0]);
  assert.ok(h.io.gets.length>before,"Home shown: the poll reads");
  assert.ok(!h.fresh.includes("<every read of the page>"),"the poll never makes every read of the page fresh");
  assert.deepEqual([...new Set(h.fresh)].sort(),["accounts/uid_daniel/pairLinks/current",`rivalries/${R}`].sort(),"only the pair link and the rivalry are read fresh");
  h.screen="leagueWheel";pending=h.timers.pending();before=h.io.gets.length;await h.timers.fire(pending[0]);
  assert.equal(h.io.gets.length,before,"another screen (Connect Players closed): no read");
  h.dom.connect.className="";pending=h.timers.pending();before=h.io.gets.length;await h.timers.fire(pending[0]);
  assert.ok(h.io.gets.length>before,"Connect Players shown over that screen: the poll reads");
  h.screen="mainMenu";h.clock.now=START+11*MIN+1;pending=h.timers.pending();assert.equal(pending.length,1);before=h.io.gets.length;await h.timers.fire(pending[0]);
  assert.equal(h.io.gets.length,before,"a minute after the code expired: no read");
  assert.equal(h.timers.pending().length,0,"and the poll stops for good");
  assert.equal(h.pair.getCodeExpiry().expired,true);
  assert.match(h.text(),/Your code expired\. Make a new one\./,"the panel says the code expired");
  assert.equal(h.panel().querySelector("code"),null,"an expired code is not offered for copying");
  assert.ok(h.buttons().includes("NEW CODE"),"NEW CODE is offered once the code expired");
  ok("F4-03/F3-04","the waiting poll reads only on Home or Connect Players, only the two paths fresh, and stops at the code's expiry");
}
{
  // Codex #1146: the poll's last tick at exactly expiry + grace must also show the code as expired (same boundary).
  const h=pairHarness({docs:danielDocs({expiresAt:START+10*MIN})});
  await h.pair.initialize({force:true});
  h.clock.now=START+11*MIN;const pending=h.timers.pending();assert.equal(pending.length,1);await h.timers.fire(pending[0]);
  assert.equal(h.timers.pending().length,0,"the poll stops at exactly expiry + grace");
  assert.equal(h.pair.getCodeExpiry().expired,true,"and the code reads as expired at that same instant");
  assert.ok(h.buttons().includes("NEW CODE"),"so the final redraw offers NEW CODE");
  ok("F4-03b","the poll stop and the expired code share one boundary (no stuck COPY CODE at exactly expiry + grace)");
}
{
  // expiry unreadable: the poll is still capped (30 minutes, the longest an invite lives)
  const docs=danielDocs();delete docs[`rivalries/${R}/invites/${R}`];
  const h=pairHarness({docs});await h.pair.initialize({force:true});
  assert.equal(h.pair.getCodeExpiry().expiresAtEpochMs,null);
  h.clock.now=START+31*MIN;const pending=h.timers.pending();const before=h.io.gets.length;await h.timers.fire(pending[0]);
  assert.equal(h.io.gets.length,before,"after 30 minutes no more reads");assert.equal(h.timers.pending().length,0,"and no more timers");
  ok("F4-03","an unknown expiry still caps the slow phase at 30 minutes");
}
// ---------------------------------------------------------------- F4-02: Nik unpaired, so Daniel's open code shows PAIR AGAIN
{
  const h=pairHarness({docs:danielDocs({partner:true,nikSide:partnerRecord("uid_daniel","playerTwo",{active:false})})});
  await h.pair.initialize({force:true});await h.pair.readPartnerRecord();await h.pair.readPartnerSide({fresh:true});
  assert.equal(h.pair.getPartnerSideState().status,"unpaired","fixture: Nik's record no longer names Daniel");
  h.pair.render();
  assert.ok(h.buttons().includes("PAIR AGAIN"),"the waiting panel offers PAIR AGAIN");assert.ok(!h.buttons().includes("NEW CODE"));
  const again=h.panel().all().find(n=>n.tagName==="BUTTON"&&n.textContent==="PAIR AGAIN");again.click();await settle();
  assert.equal(h.calls.openStart,1,"PAIR AGAIN is START, which now decides pair-again for this dead code");
  const Which=require(path.join(ROOT,"js/whichShowdownIsLive.js"));
  const decided=Which.decide({role:"playerOne",pair:h.pair.getState(),partnerSide:"unpaired",nowEpochMs:h.clock.now});
  assert.equal(decided.action,"pair-again","START no longer loops back to WAITING for a code Nik can never join");
  ok("F4-02","Daniel's dead code (Nik unpaired): PAIR AGAIN on the panel and from START, never WAITING again");
}
{
  // PAIR AGAIN closes the unjoined code before the unpair, so the unpair is not refused for it
  const order=[];
  const pairApi={getState:()=>({connectionState:"pending-pair",managerRole:"playerOne",rivalryId:R}),closeUnjoinedCode:async options=>{order.push(`close:${options.expectedRivalryId===R}`);return{ok:true};},unpair:async()=>{order.push("unpair");return{ok:true};},subscribe(){}};
  const ctx={console,Promise,CareerModePersistentNikDanielPair:pairApi};ctx.globalThis=ctx;vm.createContext(ctx);
  vm.runInContext(read("js/showdownModes.js"),ctx,{filename:"js/showdownModes.js"});
  const result=await ctx.CareerModeShowdownModes.unpairForPairAgain();
  assert.equal(result.ok,true);assert.deepEqual(order,["close:true","unpair"],"the dead code is closed first, then this account unpairs");
  const failing={...pairApi,closeUnjoinedCode:async()=>{throw Object.assign(new Error("Nik has already joined your earlier code."),{code:"PERSISTENT_PAIR_CODE_JOINED"});},unpair:async()=>{order.push("unpair-2");return{ok:true};}};
  ctx.CareerModePersistentNikDanielPair=failing;
  const refused=await ctx.CareerModeShowdownModes.unpairForPairAgain();
  assert.equal(refused.ok,false);assert.ok(!order.includes("unpair-2"),"a code that cannot be closed (Nik joined it) is never unpaired around");
  ok("F4-02","PAIR AGAIN closes Daniel's unjoined code first, and unpairs only after that close");
}
// ---------------------------------------------------------------- F4-12 / F3-05: a failed action keeps the open code; NEW CODE on an open code says why
{
  const h=pairHarness({docs:danielDocs({partner:true,nikSide:partnerRecord("uid_daniel","playerTwo")}),library:danielShell,bindings:danielBinding,create:()=>({ok:false,code:"PAIRING_CREATE_FAILED",message:"The code could not be made."})});
  await h.pair.initialize({force:true});
  const failed=await h.pair.startPairing({managerRole:"playerOne"});
  assert.equal(failed.status,"error");assert.equal(h.calls.create,1,"fixture: createPairing ran and failed");
  assert.ok(h.panel().querySelector("code"),"the open code stays on screen after a failed action");
  assert.match(h.text(),/The code could not be made\./,"with the error above it");
  assert.ok(!h.buttons().includes("CREATE CODE FOR NIK"),"never a generic CREATE CODE over an open code");
  ok("F4-12","a failed action shows the open code and the error together");
}
{
  const h=pairHarness({docs:danielDocs({partner:true,nikSide:partnerRecord("uid_daniel","playerTwo")}),library:danielShell,bindings:danielBinding,create:()=>({ok:false,code:"PERSISTENT_PAIR_PENDING_CONFLICT",message:"An open code exists."})});
  await h.pair.initialize({force:true});
  const refreshed=await h.pair.startPairing({managerRole:"playerOne"});
  assert.equal(refreshed.connectionState,"pending-pair");assert.equal(refreshed.rivalryId,R);
  assert.match(refreshed.message,/still open, so a new one cannot be made yet/,"NEW CODE on an open code says why nothing changed");
  ok("F3-05","NEW CODE while the code is open is refused with a plain reason, not silently");
}
// ---------------------------------------------------------------- F4-09: Daniel's page rewrites a missing JOIN note once
{
  const h=pairHarness({docs:danielDocs({partner:true,nikSide:partnerRecord("uid_daniel","playerTwo")})});
  await h.pair.initialize({force:true});await settle();
  const notes=()=>h.io.writes.filter(p=>p==="accounts/uid_nik/partnerInbox/current").length;
  assert.equal(notes(),1,"the open permanent-pair code gets its JOIN note (once per page)");
  const note=h.docs.get("accounts/uid_nik/partnerInbox/current");
  assert.equal(note.rivalryId,R);assert.equal(note.totalSeasons,3);assert.equal(note.expiresAt.toMillis(),START+20*MIN,"with the code's own expiry");
  await h.pair.initialize({force:true});await settle();
  assert.equal(notes(),1,"never a second write on the same page");
  const expired=pairHarness({docs:danielDocs({partner:true,expiresAt:START+30_000})});await expired.pair.initialize({force:true});await settle();
  assert.equal(expired.io.writes.filter(p=>p==="accounts/uid_nik/partnerInbox/current").length,0,"a code about to expire gets no note");
  const real=pairHarness({docs:danielDocs()});await real.pair.initialize({force:true});await settle();
  assert.equal(real.io.writes.length,0,"no partner (first real pairing): nothing is written");
  ok("F4-09","Daniel's reload with an open permanent-pair code rewrites Nik's JOIN note once (1 write), never for a real first pairing");
}
// ---------------------------------------------------------------- F3-10: a refused pair-link save is not retried
{
  // RETRY CONNECTION whose save the Rules refuse (here the device read): one transaction, not three back to back
  const h=pairHarness({docs:danielDocs(),deny:["accounts/uid_daniel/devices/device_1"],library:danielShell,bindings:danielBinding});
  await h.pair.initialize({force:true});
  let transactions=0;const base=h.sandbox.CareerModeProductionFirebaseRuntime.ensureAccountServices;
  h.sandbox.CareerModeProductionFirebaseRuntime.ensureAccountServices=async()=>{const s=await base();return{...s,firestoreSdk:{...s.firestoreSdk,runTransaction:async(db,fn)=>{transactions+=1;return s.firestoreSdk.runTransaction(db,fn);}}};};
  const refused=await h.pair.retryPairLink();
  assert.equal(refused.status,"pair-link-retry","fixture: the save was refused");
  assert.equal(transactions,1,`a refused save is made once, not retried (made ${transactions})`);
  // a dropped connection is still tried again (after a short wait)
  const flaky=pairHarness({docs:danielDocs(),library:danielShell,bindings:danielBinding});
  await flaky.pair.initialize({force:true});
  let attempts=0;const fbase=flaky.sandbox.CareerModeProductionFirebaseRuntime.ensureAccountServices;
  flaky.sandbox.CareerModeProductionFirebaseRuntime.ensureAccountServices=async()=>{const s=await fbase();return{...s,firestoreSdk:{...s.firestoreSdk,runTransaction:async()=>{attempts+=1;throw Object.assign(new Error("offline"),{code:"unavailable"});}}};};
  const run=flaky.pair.retryPairLink();
  for(let i=0;i<5;i+=1){await settle();for(const t of flaky.timers.pending().filter(t=>t.ms===750))await flaky.timers.fire(t);}
  await run;assert.equal(attempts,3,"an ambiguous failure is still tried three times");
  ok("F3-10","RETRY CONNECTION retries only a dropped connection, after a short wait; a refusal is final");
}
// ---------------------------------------------------------------- F4-05: one denied read of Daniel's record is not "unpaired"
{
  const nikDocs=pairedAt=>({"accounts/uid_nik/partner/current":partnerRecord("uid_daniel","playerTwo",{pairedAt})});
  const young=pairHarness({uid:"uid_nik",managerId:"nik",docs:nikDocs(START-MIN),deny:["accounts/uid_daniel/partner/current"]});
  await young.pair.initialize({force:true});await young.pair.readPartnerRecord();
  const side=await young.pair.readPartnerSide({fresh:true});
  assert.equal(side.status,"unavailable","right after the first pairing Daniel's record may not exist yet: claim nothing");
  const old=pairHarness({uid:"uid_nik",managerId:"nik",docs:nikDocs(START-10*MIN),deny:["accounts/uid_daniel/partner/current"]});
  await old.pair.initialize({force:true});await old.pair.readPartnerRecord();
  assert.equal((await old.pair.readPartnerSide({fresh:true})).status,"unpaired","an own record older than 5 minutes: a refused read means Daniel's record no longer names Nik");
  const seen=pairHarness({uid:"uid_nik",managerId:"nik",docs:{...nikDocs(START-MIN),"accounts/uid_daniel/partner/current":partnerRecord("uid_nik","playerOne")}});
  await seen.pair.initialize({force:true});await seen.pair.readPartnerRecord();
  assert.equal((await seen.pair.readPartnerSide({fresh:true})).status,"mutual");
  seen.sandbox.CareerModeProductionFirebaseRuntime.ensureAccountServices=(base=>async()=>{const s=await base();return{...s,firestoreSdk:{...s.firestoreSdk,runTransaction:async()=>{throw denied();}}};})(seen.sandbox.CareerModeProductionFirebaseRuntime.ensureAccountServices);
  assert.equal((await seen.pair.readPartnerSide({fresh:true})).status,"unpaired","seen naming Nik on this page, then refused: unpaired");
  ok("F4-05","a refused partner read says unpaired only after the record was seen or once the pairing is 5 minutes old");
}
// ---------------------------------------------------------------- F4-08: a JOIN refused for the code itself clears Nik's JOIN tile
{
  const docs={
    "accounts/uid_nik/partner/current":partnerRecord("uid_daniel","playerTwo",{pairedAt:START-60*MIN}),
    "accounts/uid_nik/partnerInbox/current":{schemaVersion:1,rivalryId:RN,totalSeasons:3,fromAccountId:"uid_daniel",createdAt:ts(START-MIN),expiresAt:ts(START+20*MIN)},
    [`rivalries/${RN}`]:env("rivalry",RN,{connectionState:"closed",managerSlots:[{accountId:"uid_daniel",slotId:"playerOne"},{accountId:null,slotId:"playerTwo",entitlementState:"open"}]}),
    [`rivalries/${RN}/invites/${RN}`]:env("invite",RN,{purpose:"rivalry-pairing",slotId:"playerTwo",state:"open",createdByAccountId:"uid_daniel",expiresAt:ts(START+20*MIN)})
  };
  const h=pairHarness({uid:"uid_nik",managerId:"nik",docs});
  await h.pair.initialize({force:true});await h.pair.readPartnerRecord();await h.pair.readJoinNote({fresh:true});
  assert.equal(h.pair.getJoinNoteState().note?.rivalryId,RN,"fixture: Nik's Home has a JOIN for Daniel's code");
  const joined=await h.pair.joinPairing(`CMS17-${RN}`,{managerRole:"playerTwo",autoContinue:false});
  assert.notEqual(joined.status,"paired","Daniel ENDed that code: the join is refused");
  assert.equal(h.pair.getJoinNoteState().note,null,"the JOIN tile no longer points at the dead code");
  ok("F4-08","a JOIN refused because the code is closed hides that note on this page (no read)");
}
// ---------------------------------------------------------------- F3-15: the JOIN invite is made well under the Rules cap
{
  const h=pairHarness({docs:danielDocs({partner:true,nikSide:partnerRecord("uid_daniel","playerTwo")}),library:danielShell,bindings:danielBinding,create:options=>{h.ttl=options.ttlMs;return{ok:false,code:"PAIRING_CREATE_FAILED",message:"x"};}});
  await h.pair.initialize({force:true});await h.pair.startPairing({managerRole:"playerOne"});
  assert.equal(h.ttl,25*MIN,"the permanent pair's JOIN code asks for 25 minutes (Rules cap 30), so a phone clock up to 5 minutes fast is never refused");
  ok("F3-15","JOIN invite TTL is 25 minutes");
}

// ---------------------------------------------------------------- js/onlinePlayerIdentity.js in a sandbox
function identityHarness({managerId="nik",status="ready",decision,note={note:null,checked:true,partnerActive:true,watchPaused:false},stored=null,pairState={initialized:true,status:"unpaired",rivalryId:null,connectionState:null},puts=[]}){
  const calls={which:0,connect:0,joins:[],reads:0};
  const tileText={};const tile={dataset:{},getClientRects:()=>[1],setAttribute(){},removeAttribute(){},querySelector:sel=>{const key=sel.replace(".","");return tileText[key]||(tileText[key]={set textContent(v){this._t=v;},get textContent(){return this._t||"";}});}};
  const listeners={};
  class Element{constructor(id){this.id=id;this.disabled=false;}closest(sel){return sel==="#settingsButton"?null:this;}}
  const document={visibilityState:"visible",getElementById:id=>id==="newShowdown"?tile:null,createElement:()=>({style:{},dataset:{},setAttribute(){},removeAttribute(){},append(){},appendChild(){},replaceChildren(){},addEventListener(){},remove(){},focus(){},querySelector:()=>null,classList:{add(){},remove(){},toggle(){},contains:()=>false}}),querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(type,fn)=>{(listeners[type]||(listeners[type]=[])).push(fn);},head:{append(){},appendChild(){}},body:{append(){},appendChild(){}},documentElement:{}};
  let noteState=note;
  const pairApi={getState:()=>pairState,readPartnerRecord:async()=>{calls.reads+=1;},readPartnerSide:async()=>{calls.reads+=1;},getPartnerSideState:()=>({status:"mutual"}),getJoinNoteState:()=>noteState,readJoinNote:async()=>{noteState={...noteState,watchPaused:false};return noteState;},watchJoinNote:async()=>{noteState={...noteState,watchPaused:false};return false;},subscribe:()=>()=>{},settleOnHome(){},
    buildPlayerJoinCode:id=>`CMS17-${id}`,joinPairing:async code=>{calls.joins.push(code);return{status:"paired",connectionState:"active"};}};
  const indexedDB={open:()=>{const r={result:{objectStoreNames:{contains:()=>true},transaction:()=>{const tx={oncomplete:null,objectStore:()=>({get:()=>{const g={};setImmediate(()=>{g.result=stored;g.onsuccess?.();});return g;},put:value=>{puts.push(value);setImmediate(()=>tx.oncomplete?.());return{};}})};return tx;},close(){}}};setImmediate(()=>r.onsuccess?.());return r;}};
  const ctx={console,setTimeout,clearTimeout,setImmediate,Promise,document,Element,navigator:{onLine:true},indexedDB,getActiveScreenName:()=>"mainMenu",
    CareerModePersistentNikDanielPair:pairApi,
    CareerModeWhichShowdownIsLive:{read:async()=>{calls.which+=1;return decision;}},
    CareerModeConnectPlayersScreenV10:{open:async()=>{calls.connect+=1;return true;}},
    CareerModeShowdownModes:{install(){},resolve:async()=>({}),getView:()=>({mode:"real",careerStarted:true})},
    reportApplicationError(){}};
  ctx.globalThis=ctx;vm.createContext(ctx);
  let src=read("js/onlinePlayerIdentity.js");
  const from='let state=Object.freeze({status:"idle",initialized:false,busy:false,online:!root.navigator||root.navigator.onLine!==false,accountId:null,managerId:null,managerLabel:null,deviceId:null,registered:false,';
  assert.ok(src.includes(from),"identity initial state literal");
  src=src.replace(from,`let state=Object.freeze({status:${JSON.stringify(status)},initialized:true,busy:false,online:true,accountId:"acct",managerId:${status==="ready"?JSON.stringify(managerId):"null"},managerLabel:"M",deviceId:null,registered:${status==="ready"},`);
  vm.runInContext(src,ctx,{filename:"js/onlinePlayerIdentity.js"});
  return{identity:ctx.CareerModeOnlinePlayerIdentity,calls,tileText,click:id=>{for(const fn of listeners.click||[])fn({target:new Element(id),preventDefault(){},stopImmediatePropagation(){}});}};
}
{
  // F4-07: Nik's CONTINUE with nothing live follows START's decision (here: Daniel's JOIN note), not a bare paste box
  const h=identityHarness({decision:{action:"join",rivalryId:RN,totalSeasons:3,reason:"note"}});
  h.click("continueCareer");await settle();
  assert.equal(h.calls.which,1,"Nik's not-live CONTINUE asks the one START decision");
  assert.deepEqual(h.calls.joins,[`CMS17-${RN}`],"and joins Daniel's note");assert.equal(h.calls.connect,0,"no paste box");
  ok("F4-07","Nik's CONTINUE after the other phone ENDED goes through START (JOIN note), like Daniel's");
}
{
  // F4-10: CHECK STATUS with still no note stays on Home and says so
  const h=identityHarness({decision:{action:"wait-for-daniel",rivalryId:null,totalSeasons:null,reason:"wait-for-daniel"},note:{note:null,checked:true,partnerActive:true,watchPaused:true}});
  await h.identity.openStart();await settle();
  assert.equal(h.calls.connect,0,"no Connect Players with a paste box and first-run text");
  assert.equal(h.tileText.menuTileMeta?.textContent,"Nothing to join yet. Checking again.","Home's tile says it is checking again");
  const plain=identityHarness({decision:{action:"wait-for-daniel",rivalryId:null,totalSeasons:null,reason:"wait-for-daniel"}});
  await plain.identity.openStart();await settle();
  assert.equal(plain.calls.connect,1,"WAITING FOR DANIEL / PASTE A CODE still opens the paste box");
  ok("F4-10","Nik's CHECK STATUS with no note stays on Home: Nothing to join yet. Checking again.");
}
{
  // F4-11: before the identity is ready, Nik's Home tile already follows the player this browser chose
  const h=identityHarness({status:"connecting",stored:{managerId:"nik",accountId:"acct"},note:{note:null,checked:false}});
  h.identity.refreshHome();await settle();h.identity.refreshHome();
  assert.equal(h.tileText.menuTileLabel?.textContent,"JOIN DANIEL'S SHOWDOWN","not Daniel's START A SHOWDOWN on Nik's phone while connecting");
  const d=identityHarness({status:"connecting",stored:{managerId:"daniel",accountId:"acct"},note:{note:null,checked:false}});
  d.identity.refreshHome();await settle();d.identity.refreshHome();
  assert.equal(d.tileText.menuTileLabel?.textContent,"START A SHOWDOWN");
  ok("F4-11","Home's START/JOIN label uses the stored player before the identity is ready (IndexedDB, no Firestore read)");
}

{
  // F4-06 (Nik 2026-11-01: "Yes, only before pairing"): CHANGE PLAYER undoes a wrong WHO ARE YOU? tap while no pair link exists
  const puts=[];const h=identityHarness({managerId:"nik",puts});
  assert.equal(typeof h.identity.canChangePlayer,"function","the identity offers CHANGE PLAYER");
  assert.equal(h.identity.canChangePlayer(),true,"no pair link (sidecar says unpaired, no code, no rivalry): CHANGE PLAYER is offered");
  let s=await h.identity.changePlayer();
  assert.equal(s.status,"choose-manager","CHANGE PLAYER reopens WHO ARE YOU?");assert.equal(s.managerId,null);
  s=h.identity.keepPlayer();
  assert.equal(s.status,"ready","KEEP NIK undoes it");assert.equal(s.managerId,"nik");assert.equal(puts.length,0,"KEEP writes nothing");
  await h.identity.changePlayer();s=await h.identity.chooseManager("daniel");
  assert.equal(s.status,"ready");assert.equal(s.managerId,"daniel","the new pick sticks");
  assert.equal(puts.at(-1)?.managerId,"daniel","and is remembered on this browser");
  for(const pairState of [
    {initialized:true,status:"paired",rivalryId:R,connectionState:"active"},
    {initialized:true,status:"waiting",rivalryId:R,connectionState:"pending-pair"},
    {initialized:false,status:"loading",rivalryId:null,connectionState:null},
    {initialized:true,status:"unavailable",rivalryId:null,connectionState:null}]){
    const p=identityHarness({managerId:"nik",pairState});
    assert.equal(p.identity.canChangePlayer(),false,`no CHANGE PLAYER when the pair is ${pairState.status}`);
    const after=await p.identity.changePlayer();
    assert.equal(after.status,"ready");assert.equal(after.managerId,"nik",`a ${pairState.status} pair keeps the player`);
  }
  ok("F4-06","CHANGE PLAYER (with KEEP) only while no pair link exists; a paired, waiting or unknown pair never changes the player");
}
// ---------------------------------------------------------------- F4-13: Data Management that fails to load reopens Settings
{
  const calls={opened:0,notices:[]};
  const ctx={console,Promise,setTimeout,clearTimeout,document:{querySelector:()=>null,getElementById:()=>null,addEventListener(){},createElement:()=>({style:{},classList:{add(){},remove(){}},setAttribute(){},append(){}})},addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})};
  ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
  vm.runInContext(read("js/settings.js"),ctx,{filename:"js/settings.js"});
  ctx.closeSettings=()=>{};ctx.openSettings=()=>{calls.opened+=1;};ctx.showAppNotice=message=>calls.notices.push(message);
  ctx.openOptionalModule=async()=>{throw new Error("Failed to fetch dynamically imported module");};
  let rejected=false;try{await ctx.openSettingsDataManagement();}catch(_error){rejected=true;}
  assert.equal(rejected,false,"a failed load never rejects into nothing");
  assert.equal(calls.opened,1,"Settings is shown again");assert.equal(calls.notices.length,1,"with a message");
  assert.equal(ctx.careerModeLegacyDataTools,false);
  ok("F4-13","DATA MANAGEMENT that cannot load reopens Settings with a message");
}

console.log(`PASS r87 Fable pairing fixes contracts: ${checks} checks.`);
})().catch(error=>{console.error(error);process.exit(1);});

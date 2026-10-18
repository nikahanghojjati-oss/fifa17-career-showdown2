"use strict";
// QoL 1 + 7 (Nik approved 2026-10-12, BH-12): two copy-order changes on the pairing screens.
//   Q1. Recovery screen ("OLD SHOWDOWN FOUND"): RESTORE BACKUP is the first button in the panel, so it leads visually and in
//       focus order; DELETE OLD SHOWDOWN & START OVER stays on the same screen, second, as the smaller secondary button.
//       Nothing is removed, hidden or re-wired: the same two handlers, the same confirm()===true gate, the same note.
//   Q2. The Connect Players adapter styles RESTORE BACKUP as the solid primary button; the smaller delete style is an
//       #app-prefixed rule (Team V sheets load after the adapters) and adds no scroller.
//   Q3. A wrong Google account says what to do: the creator-account refusal and the "unavailable to this account" refusal
//       both tell Nik to sign in with a different Google account than Daniel, in plain words with no raw codes. Every
//       phrase other tests pin is still present.
//   Q4. Out of scope stays out: the same creator guard and error code, no sign-in mechanics (popup, persistence, scopes) in
//       the touched files, no new control.
// Node only; no emulator. Sign-in, pairing, the two-manager rule, the ACTIVE check, Firestore and Rules are untouched.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");

const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const pairSource=read("js/persistentNikDanielPair.js");
const pairingSource=read("js/sparkPrivatePairing.js");
const adapterSource=read("js/connectPlayersScreenV10.js");
const connectCss=read("css/connectPlayersV10.css");
const RIVALRY=`pair_3${"ab".repeat(31)}c`;
const SAVE_NEW=`save_${"1".repeat(24)}`,PROFILE_NEW=`profile_${"2".repeat(24)}`;
const DANIEL_SAVE=`save_${"5".repeat(24)}`,DANIEL_PROFILE=`profile_${"6".repeat(24)}`;
let checks=0;
const ok=label=>{checks+=1;console.log(`ok ${checks} ${label}`);};

// Tiny DOM, enough for pairRender.
function createDom(){
  let active=null;
  class El{
    constructor(tag){this.tagName=String(tag).toUpperCase();this.children=[];this.parent=null;this.style={};this.listeners={};this.id="";this.className="";this.ownText="";this.value="";this.disabled=false;this.dataset={};this.attributes={};}
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
  const body=new El("body"),connect=new El("section"),slot=new El("div");
  connect.id="connectPlayersScreen";slot.id="connectPlayersPairSlot";body.append(connect);connect.append(slot);
  const document={
    visibilityState:"visible",body,head:new El("head"),
    createElement:tag=>new El(tag),
    getElementById:id=>body.all().find(n=>n.id===id)||null,
    querySelector:sel=>sel==="#connectPlayersScreen #connectPlayersPairSlot"?slot:null,
    get activeElement(){return active&&active.isConnected?active:body;}
  };
  return{document,body};
}
const buttons=root=>root.all().filter(n=>n.tagName==="BUTTON");
const classesOf=node=>String(node.className).split(/\s+/).filter(Boolean);
async function settle(){for(let pass=0;pass<3;pass+=1){await new Promise(resolve=>setTimeout(resolve,2));for(let i=0;i<30;i+=1)await new Promise(resolve=>setImmediate(resolve));}}

function envelope(objectType,objectId,data){return{schemaVersion:1,objectType,objectId,revision:1,parentRevision:0,lifecycleState:"live",contentHash:`sha256:${"9".repeat(64)}`,data};}
function recoveryDocs(){
  return{
    "accounts/uid_nik/pairLinks/current":envelope("pairLink","current",{rivalryId:RIVALRY,managerRole:"playerTwo",managerId:"nik",linkedAt:null,lastConfirmedAt:null}),
    [`rivalries/${RIVALRY}`]:envelope("rivalry",RIVALRY,{connectionState:"active",authorizedAccountIds:["uid_daniel","uid_nik"],managerSlots:[{slotId:"playerOne",accountId:"uid_daniel",saveId:DANIEL_SAVE,profileId:DANIEL_PROFILE},{slotId:"playerTwo",accountId:"uid_nik",saveId:SAVE_NEW,profileId:PROFILE_NEW}]}),
    "accounts/uid_nik/devices/device_nik":envelope("device","device_nik",{deviceId:"device_nik",state:"active"})
  };
}
// A phone that lost its local copy: ACTIVE pair on the server, empty Save Library -> recovery-required.
function recoveryHarness({confirm,adopt}={}){
  const {document}=createDom();
  const docs=new Map(Object.entries(recoveryDocs()));
  const deleted=[],calls={navigate:[],openModule:[],adopt:[],reads:0,writes:0};
  const firestoreSdk={
    doc:(_db,...parts)=>({path:parts.join("/")}),
    Timestamp:{fromMillis:ms=>({toMillis:()=>ms})},
    runTransaction:async(_db,fn)=>{const writes=[];const tx={get:async ref=>{calls.reads+=1;return{exists:()=>docs.has(ref.path),data:()=>docs.get(ref.path)};},set:(ref,value)=>{calls.writes+=1;writes.push([ref.path,value]);}};const result=await fn(tx);for(const [p,v] of writes)docs.set(p,v);return result;},
    getDoc:async ref=>{calls.reads+=1;return{exists:()=>docs.has(ref.path),data:()=>docs.get(ref.path)};}
  };
  const library={activeSaveId:null,saves:[]};
  const sandbox={
    console,setTimeout:()=>0,clearTimeout:()=>{},TextEncoder,crypto:webcrypto,Promise,Date,document,
    addEventListener(){},
    CareerModeOnlinePlayerIdentity:{getState:()=>({managerId:"nik"})},
    CareerModeSparkConnectedAccount:{initialize:async()=>({}),getState:()=>({connected:true,accountId:"uid_nik"})},
    CareerModeSparkPrivatePairing:{initialize:async()=>({}),getState:()=>({registered:true,deviceId:"device_nik"}),localBindingOptions:()=>[],getOrCreateDeviceIdentity:async()=>({deviceId:"device_nik"}),pairingJoinErrorMessage:error=>error?.message||"The code could not be joined."},
    CareerModeSaveLibraryRuntime:{isReady:()=>true,getLibrarySnapshot:()=>JSON.parse(JSON.stringify(library)),switchActiveSave:async()=>true,deleteSave:id=>{deleted.push(id);return{ok:true};},...(adopt?{adoptOnlineEntry:async facts=>{calls.adopt.push({...facts});const result=await adopt(facts);if(result?.ok&&!library.saves.some(e=>e.saveId===facts.saveId)){library.saves.push({saveId:facts.saveId,showdown:{identity:{saveId:facts.saveId,managerProfileIds:{[facts.role]:facts.profileId}}}});library.activeSaveId=facts.saveId;}return result;}}:{})},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"uid_nik"}},firestore:{},firestoreSdk})},
    navigateTo:async screen=>{calls.navigate.push(screen);return true;},
    openOptionalModule:async key=>{calls.openModule.push(key);return true;}
  };
  // r78 (HO-029): the native confirm() is now the shared marble box (askShowdownConfirm); the stub answers for it.
  if(confirm!==undefined)sandbox.askShowdownConfirm=async message=>confirm(message);
  vm.createContext(sandbox);
  vm.runInContext(pairSource,sandbox,{filename:"js/persistentNikDanielPair.js"});
  return{pair:sandbox.CareerModePersistentNikDanielPair,document,deleted,calls,docs,sandbox,panel:()=>document.getElementById("persistentNikDanielPairPanel")};
}

async function q1RecoveryLeadsWithTheSafeButton(){
  const h=recoveryHarness();
  const state=await h.pair.initialize({force:true});
  assert.equal(state.status,"recovery-required");
  assert.equal(state.connectionState,"active");
  h.pair.render();
  const panel=h.panel();
  assert.match(panel.textContent,/OLD SHOWDOWN FOUND/);
  const found=buttons(panel);
  assert.deepEqual(found.map(b=>b.textContent),["RESTORE BACKUP","DELETE OLD SHOWDOWN & START OVER"],"Q1 RESTORE BACKUP is first, the delete second, and nothing else was added or removed");
  const [restore,remove]=found;
  assert.equal(restore.disabled,false);assert.equal(remove.disabled,false);
  assert.equal(panel.all().indexOf(restore)<panel.all().indexOf(remove),true,"Q1 RESTORE BACKUP comes first in DOM order, which is focus order");
  assert.equal(classesOf(restore).includes("dangerButton"),false,"Q1 the safe button is not styled as danger");
  assert.equal(classesOf(remove).includes("dangerButton"),true,"Q1 the delete keeps its danger styling");
  assert.equal(classesOf(remove).includes("pairRecoverySecondary"),true,"Q1 the delete carries the smaller-secondary hook");
  assert.equal(classesOf(restore).includes("pairRecoverySecondary"),false);
  assert.match(panel.textContent,/NO LOCAL CAREER DATA ON THIS BROWSER/,"Q1 the explanatory note is still shown");
  const actions=restore.parent;
  assert.equal(actions.children[0],restore,"Q1 the first child of the action row is the safe button");
  assert.equal(actions.children.indexOf(remove),1);
  ok("Q1 the Recovery screen leads with RESTORE BACKUP; the delete stays second as a smaller secondary; the note is kept");
}

async function q1HandlersAreUnchanged(){
  // RESTORE BACKUP still opens the verified recovery surface and does not delete anything.
  {
    const h=recoveryHarness({confirm:()=>{throw new Error("restore must not ask to delete");}});
    await h.pair.initialize({force:true});h.pair.render();
    buttons(h.panel())[0].click();await settle();
    assert.equal(h.deleted.length,0);
    assert.equal(h.docs.get(`rivalries/${RIVALRY}`).data.connectionState,"active","Q1 RESTORE BACKUP never closes the online Showdown");
  }
  // The delete is still gated by an explicit confirm()===true: no confirm, or a declined one, changes nothing.
  for(const confirm of [undefined,()=>false,()=>undefined,()=>"yes"]){
    const h=recoveryHarness({confirm});
    await h.pair.initialize({force:true});h.pair.render();
    const remove=buttons(h.panel())[1];
    assert.equal(remove.textContent,"DELETE OLD SHOWDOWN & START OVER");
    remove.click();await settle();
    assert.equal(h.docs.get(`rivalries/${RIVALRY}`).data.connectionState,"active","Q1 without an explicit yes the old Showdown is not closed");
    assert.equal(h.calls.navigate.length,0);
  }
  // Same handlers as before, in the source: restore -> pairOpenRecoverySurface, delete -> pairStartOverFromRecovery.
  assert.match(pairSource,/startOver\.addEventListener\("click",\(\)=>void pairStartOverFromRecovery\(\)\);recover\.addEventListener\("click",\(\)=>void pairOpenRecoverySurface\(\)\);/);
  assert.match(pairSource,/const confirmed=await pairAskConfirm\("Delete the old Showdown and start over\?/);
  assert.match(pairSource,/if\(confirmed!==true\)return false;/);
  ok("Q1 RESTORE BACKUP and the confirm-gated delete behave exactly as before");
}

function q2StylingAndNoScroller(){
  assert.match(adapterSource,/const PRIMARY=\/\^\(START A SHOWDOWN\|CHOOSE SEASONS\|CREATE CODE FOR NIK\|JOIN DANIEL'S SHOWDOWN\|START CAREER\|TRY CONTINUE AGAIN\|RESTORE BACKUP\)\$\/;/,"Q2 the Connect Players adapter makes RESTORE BACKUP the solid primary button");
  assert.equal(/DELETE OLD/.test(adapterSource.match(/const PRIMARY=[^\n]*/)[0]),false,"Q2 the delete is never a primary button");
  const rule=connectCss.match(/(^|\n)(#app #connectPlayersScreen #persistentNikDanielPairPanel \.menuButton\.pairRecoverySecondary)\{([^}]*)\}/);
  assert.ok(rule,"Q2 the smaller-secondary rule is #app-prefixed so it beats the Team V sheets that load later");
  assert.match(rule[3],/font-size:\s*1[0-3]px/);
  assert.doesNotMatch(rule[3],/overflow|position\s*:\s*(fixed|sticky)|display\s*:\s*none|visibility|opacity|pointer-events|order\s*:/,"Q2 the delete is not hidden, disabled, reordered by CSS or turned into a scroller");
  assert.match(rule[3],/min-height:\s*(?:3[6-9]|4\d)px/,"Q2 the smaller delete is still a tappable size");
  assert.equal((connectCss.match(/\.pairRecoverySecondary/g)||[]).length,1,"Q2 one rule, no stray overrides");
  ok("Q2 RESTORE BACKUP is the primary style; the delete is a smaller #app-prefixed secondary and nothing scrolls or hides");
}

function q3WrongAccountSaysWhatToDo(){
  const pairing=require(path.join(ROOT,"js/sparkPrivatePairing.js"));
  const creator=pairingSource.match(/errorWithCode\("PAIRING_CREATOR_CANNOT_REDEEM","([^"]+)"\)/);
  assert.ok(creator,"Q3 the creator-account refusal keeps its error code");
  const shown=pairing.pairingJoinErrorMessage(Object.assign(new Error(creator[1]),{code:"PAIRING_CREATOR_CANNOT_REDEEM"}));
  assert.equal(shown,creator[1],"Q3 the refusal text reaches the player unchanged");
  assert.match(shown,/Nik must sign in with a different Google account than Daniel/,"Q3 the refusal says what to do");
  assert.match(shown,/paste the code again/i);
  assert.ok(shown.length<=170,`Q3 the instruction stays short (${shown.length} characters)`);
  assert.doesNotMatch(shown,/PAIRING_|permission|redeem|capability|firestore|uid|account id|undefined/i,"Q3 no raw codes or jargon");
  const refused=pairing.pairingJoinErrorMessage(Object.assign(new Error("Missing or insufficient permissions."),{code:"permission-denied"}));
  assert.match(refused,/expired, already used, or unavailable to this account/i,"Q3 the pinned refusal wording is kept");
  assert.match(refused,/create a new code on the other device/i);
  assert.match(refused,/go Home and tap CONTINUE CAREER instead/);
  assert.match(refused,/Nik is signed in with a different Google account than Daniel/,"Q3 the generic refusal also names the account rule");
  assert.doesNotMatch(refused,/missing or insufficient permissions/i);
  assert.equal(pairing.pairingJoinErrorMessage(Object.assign(new Error("Choose Player Two."),{code:"PAIRING_SLOT_MISMATCH"})),"Choose Player Two.","Q3 other refusals pass through untouched");
  ok("Q3 a wrong Google account is told to use a different account than Daniel, in plain words; pinned phrases are kept");
}

function q4NothingElseMoved(){
  assert.match(pairingSource,/if\(invite\.data\.createdByAccountId===accountId\)throw errorWithCode\("PAIRING_CREATOR_CANNOT_REDEEM"/,"Q4 the same creator guard still refuses the same account");
  assert.match(pairingSource,/authorizedAccountIds\.length!==1|authorizedAccountIds:\[invite\.data\.createdByAccountId,accountId\]/,"Q4 the two-manager rule is still in place");
  for(const [file,source] of [["js/persistentNikDanielPair.js",pairSource],["js/sparkPrivatePairing.js",pairingSource],["js/connectPlayersScreenV10.js",adapterSource]]){
    assert.doesNotMatch(source,/signInWithPopup|signInWithRedirect|setPersistence|browserLocalPersistence|addScope|GoogleAuthProvider|signOut\(/,`Q4 ${file} carries no sign-in mechanics`);
  }
  const account=read("js/sparkConnectedAccount.js");
  assert.match(account,/browserSessionPersistence/,"Q4 sign-in stays browserSessionPersistence");
  assert.match(account,/signInWithPopup/,"Q4 sign-in stays popup-only");
  assert.doesNotMatch(account,/addScope|setCustomParameters\(\{[^}]*scope/i,"Q4 sign-in adds no extra scopes");
  const createButtons=(pairSource.match(/pairCreateElement\("button"/g)||[]).length;
  // r79: +1, CHOOSE SEASONS replaces CREATE CODE FOR NIK for Daniel while no seasons are chosen (no more bounce to the seasons screen).
  // r79 Codex #915: +1, PAIR AGAIN replaces CREATE CODE FOR NIK for Daniel when Nik unpaired while he chose the seasons.
  assert.equal(createButtons,15,"Q4 only the r79 CHOOSE SEASONS and PAIR AGAIN buttons were added to the pair panel");
  assert.equal((pairSource.match(/pairCreateElement\("button","menuButton","CHOOSE SEASONS"\)/g)||[]).length,1,"Q4 (r79) the one added button is CHOOSE SEASONS");
  ok("Q4 the creator guard, two-manager rule and sign-in mechanics are untouched and no control was added");
}

// r80: the same phone (ACTIVE pair, empty Save Library) rebuilds the exact shell from the pair link before anything is published:
// paired, not recovery-required, with the same reads and no write. recovery-required stays only for a rebuild that fails.
async function r80RebuildBeforeRecovery(){
  const plain=recoveryHarness();await plain.pair.initialize({force:true});
  const h=recoveryHarness({adopt:async facts=>({ok:true,status:"rebuilt",saveId:facts.saveId})});
  const state=await h.pair.initialize({force:true});
  assert.equal(state.status,"paired","r80 the missing shell is rebuilt, so the live Showdown continues here");
  assert.deepEqual(h.calls.adopt,[{saveId:SAVE_NEW,profileId:PROFILE_NEW,role:"playerTwo",totalRounds:3}],"r80 the rebuild uses the pair link's exact ids, the role and the seasons in the rivalry id");
  assert.equal(h.calls.reads,plain.calls.reads,"r80 the rebuild adds no Firestore read");assert.equal(h.calls.writes,0,"r80 and no write");
  await h.pair.initialize({force:true});assert.equal(h.calls.adopt.length,1,"r80 an exact shell is reused, never rebuilt twice");
  const failed=recoveryHarness({adopt:async()=>{throw new Error("refused");}});
  assert.equal((await failed.pair.initialize({force:true})).status,"recovery-required","r80 recovery-required stays only when the rebuild fails");
  ok("R80 a fresh browser rebuilds the exact shell before recovery is published; a failed rebuild still shows recovery");
}

(async()=>{
  await q1RecoveryLeadsWithTheSafeButton();
  await q1HandlersAreUnchanged();
  q2StylingAndNoScroller();
  q3WrongAccountSaysWhatToDo();
  q4NothingElseMoved();
  await r80RebuildBeforeRecovery();
  console.log(`PASS QoL 1+7 recovery leads with the safe button and a wrong Google account says what to do (${checks} checks).`);
})().catch(error=>{console.error(error);process.exit(1);});

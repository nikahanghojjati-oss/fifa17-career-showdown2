"use strict";
// Deleting Showdown data also clears the unsent private drafts this device kept for it. The drafts (cms.draft.v1:* for Season
// Results and Transfer Guess, cms.signingDraft.v1:* for the signing form) live in localStorage and were only swept when Terminal
// Close reached CLOSED. Every other way to delete Showdown data left them in the browser after the app said the data was gone.
// Every delete path sweeps ALL keys of both prefixes for EVERY rivalry (orphans from older deletions included). It needs no rivalry id,
// so it also works when the saved Showdown carries none and the pair module is not loaded (offline dashboard delete), and when the pair
// module only initializes after the delete starts (Settings). Only one shared Showdown can be active on a device and drafts are private
// to this device, so once the active Showdown is deleted no draft can belong to anything that still exists.
// The sweep is clearAllShowdownDraftKeys in js/diagnostics.js, loaded on demand through ensureDiagnosticsModule, because only storage.js
// (a startup file with a FULL gzip budget) and diagnostics.js may touch localStorage (static-app-release and job-1652 contracts).
// Node only; the real js/storage.js, js/diagnostics.js, js/showdownUI.js, js/legacy.js and js/settings.js run in one page context.
//   D1  DELETE CURRENT SHOWDOWN (dashboard) removes every draft key of every rivalry; preferences, Legacy, the save library and other keys stay.
//       This holds offline: no rivalry id on the Showdown and no pair module.
//   D2  END SHOWDOWN (r80; was DELETE CURRENT SHOWDOWN) in Settings (remote-first, Save Library authority) removes every draft key of every rivalry, also with no
//       rivalry id on the Showdown and a pair module that only initializes later; the rest stays. END records the accepted seasons
//       read from the rivalry's Shared Season Commits, also on a fresh browser before CONTINUE (D2d, D2e).
//   D3  RESET ALL SHOWDOWN DATA removes every draft key of every rivalry, orphans included (raw storage and Save Library authority); preferences
//       and other keys stay.
//   D4  deleting the completed active copy of a Showdown (Legacy cleanup) removes every draft key.
//   D5  a delete that does not complete, or is cancelled, leaves every draft in place.
//   D6  wiring: startup files carry no byte of this, Season Results / Transfer Challenge / Terminal Close still never touch localStorage,
//       only diagnostics.js and storage.js touch localStorage, and every delete path calls the sweep.
//   D7  the sweep helper removes exactly the two prefixes and survives a throwing localStorage.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const RIVALRY="pair_"+"a".repeat(64);
const OTHER="pair_"+"b".repeat(64);
const PAIRED="pair_"+"e".repeat(64);
let checks=0;
const ok=label=>{checks+=1;console.log(`ok ${checks} ${label}`);};

const DRAFTS=[
  `cms.draft.v1:${RIVALRY}:1:playerOne:seasonResult`,`cms.draft.v1:${RIVALRY}:2:playerTwo:seasonResult`,
  `cms.draft.v1:${RIVALRY}:1:playerOne:transferGuess`,`cms.draft.v1:${RIVALRY}:3:playerTwo:transferGuess`,
  `cms.signingDraft.v1:${RIVALRY}:1:playerOne`,`cms.signingDraft.v1:${RIVALRY}:2:playerTwo`,
  `cms.draft.v1:${RIVALRY}:10:playerOne:seasonResult`,`cms.signingDraft.v1:${RIVALRY}:7:playerOne`
];
const OTHER_DRAFTS=[`cms.draft.v1:${OTHER}:1:playerOne:seasonResult`,`cms.signingDraft.v1:${OTHER}:4:playerTwo`];
const PAIRED_DRAFTS=[`cms.draft.v1:${PAIRED}:2:playerOne:seasonResult`,`cms.signingDraft.v1:${PAIRED}:1:playerTwo`,`cms.draft.v1:${PAIRED}:3:playerTwo:transferGuess`];
const KEPT={
  "careerModeShowdown.preferences":'{"schemaVersion":2}',
  "careerModeShowdown.legacyShowdowns":'[{"id":"old"}]',
  "careerModeShowdown.saveLibrary":'{"schemaVersion":1,"entries":[]}',
  "cms.deviceId":"device_x","cms.draftNotes":"not a draft","cms.draft.v2:keep":"other version","other.cms.draft.v1:x":"prefix lookalike","unrelated":"1"
};

function makeStorage(initial){
  const store=new Map(Object.entries(initial));
  return {store,
    get length(){return store.size;},key:index=>[...store.keys()][index]??null,
    getItem:key=>store.has(key)?store.get(key):null,setItem:(key,value)=>{store.set(String(key),String(value));},removeItem:key=>{store.delete(key);},
    draftKeys:()=>[...store.keys()].filter(key=>key.startsWith("cms.draft.v1:")||key.startsWith("cms.signingDraft.v1:")).sort(),
    ownDrafts:()=>[...store.keys()].filter(key=>(key.startsWith("cms.draft.v1:")||key.startsWith("cms.signingDraft.v1:"))&&!OTHER_DRAFTS.includes(key)).sort(),
    otherDrafts:()=>OTHER_DRAFTS.filter(key=>store.has(key))};
}
function node(){
  const listeners={},classes=new Set();
  const element={children:[],dataset:{},style:{},textContent:"",listeners,
    classList:{add:name=>classes.add(name),remove:name=>classes.delete(name),toggle:name=>classes.has(name)?classes.delete(name):classes.add(name),contains:name=>classes.has(name)},
    addEventListener:(type,fn)=>{listeners[type]=fn;},setAttribute(){},removeAttribute(){},focus(){},
    append(...items){element.children.push(...items);},appendChild(item){element.children.push(item);return item;}};
  return element;
}
function harness({initial,confirmAnswer=true,runtime=null,pairRivalry=null}){
  initial={...initial};for(const key of OTHER_DRAFTS)initial[key]="{\"draft\":true}";
  const localStorage=makeStorage(initial);
  const notices=[],screens=[];
  const sandbox={console:{log(){},error(){},warn(){}},localStorage,Intl,Date,JSON,Promise,Map,Set,Array,Object,String,Number,Boolean,Error,
    document:{createElement:node,getElementById:()=>null,querySelector:()=>null,addEventListener(){},visibilityState:"visible"},
    setTimeout,clearTimeout,askShowdownConfirm:async()=>confirmAnswer};
  sandbox.window=sandbox;sandbox.globalThis=sandbox;
  // r78 (HO-029): the native confirm() is now the shared marble box (askShowdownConfirm); the stub answers for it.
  sandbox.askShowdownConfirm=async()=>confirmAnswer;
  sandbox.showAppNotice=(text,kind)=>{notices.push({text,kind});};
  sandbox.CareerModeSaveLibraryRuntime=runtime;
  // The real optionalModules.js loads js/diagnostics.js on demand; here the same real file is evaluated in the page context on first use.
  const diagnostics={loads:0};
  sandbox.ensureDiagnosticsModule=async()=>{if(typeof sandbox.runApplicationDiagnostics!=="function"){diagnostics.loads+=1;vm.runInContext(read("js/diagnostics.js"),ctx,{filename:"js/diagnostics.js"});}};
  if(pairRivalry)sandbox.CareerModePersistentNikDanielPair={getState:()=>({rivalryId:pairRivalry})};
  const ctx=vm.createContext(sandbox);
  vm.runInContext("var currentShowdown=null;var showScreen=function(id){__screens.push(id);return true;};",Object.assign(ctx,{__screens:screens}));
  for(const file of ["js/storage.js","js/showdownUI.js","js/legacy.js","js/settings.js"])vm.runInContext(read(file),ctx,{filename:file});
  // Replace only screen infrastructure and the online pair call; every delete decision and the draft sweep are the real code.
  vm.runInContext("closeSettings=function(){};loadSavedShowdown=function(){return currentShowdown;};hasSavedShowdown=function(){return Boolean(currentShowdown);};",ctx);
  return {ctx,localStorage,notices,screens,diagnostics,settle:()=>new Promise(resolve=>setTimeout(resolve,5))};
}
function commitDoc(rivalryId,seasonNumber,phase){return {schemaVersion:1,objectType:"sharedSeasonCommit",rivalryId,seasonNumber,runtimeRevision:"1.9.1-r10",phase,revision:phase==="ACKNOWLEDGED"?3:2,resultsRevision:2};}
// A connected-services fake: exact document gets inside runTransaction only (a write would throw), every read recorded.
function firestoreFake(rivalryId,docs){
  const db={reads:[],serverNext:[],writes:0,transactions:0,fail:false};
  const firestore={name:"fake"};
  const refuse=()=>{db.writes+=1;throw new Error("no write allowed");};
  const firestoreSdk={doc:(store,...parts)=>{assert.equal(store,firestore);return {path:parts.join("/")};},runTransaction:async(store,fn)=>{assert.equal(store,firestore);db.transactions+=1;return fn({get:async ref=>{if(db.fail){const error=new Error("offline");error.code="unavailable";throw error;}db.reads.push(ref.path);const prefix=`rivalries/${rivalryId}/seasonCommits/`;const data=ref.path.startsWith(prefix)?docs[ref.path.slice(prefix.length)]:undefined;return {exists:()=>Boolean(data),data:()=>data?JSON.parse(JSON.stringify(data)):undefined};},set:refuse,update:refuse,delete:refuse});}};
  db.runtime={ensureAccountServices:async()=>({ok:true,firestore,auth:{currentUser:{uid:"uid_daniel"}},firestoreSdk})};
  db.budget={services:services=>services,readServerNext:path=>{db.serverNext.push(path);}};
  return db;
}
const completed={id:"s1",name:"Nik vs Daniel",status:"Completed",identity:{saveId:"save_1"},sharedJourney:{rivalryId:RIVALRY}};
const active={id:"s1",name:"Nik vs Daniel",status:"In progress",identity:{saveId:"save_1"},sharedJourney:{rivalryId:RIVALRY}};
function libraryRuntime(localStorage,{clearActive=true,clearAll=true}={}){
  const calls=[];
  return {calls,isReady:()=>true,loadActiveShowdown:()=>active,
    clearActiveShowdown(){calls.push("clearActive");if(clearActive)localStorage.removeItem("careerModeShowdown.activeShowdown");return clearActive;},
    clearAllData(){calls.push("clearAll");return clearAll;}};
}
function assertKept(h,extra=[]){for(const key of Object.keys(KEPT))if(!extra.includes(key))assert.equal(h.localStorage.getItem(key),KEPT[key],`${key} untouched`);}

(async()=>{
  const ALL_DRAFTS=[...DRAFTS,...OTHER_DRAFTS,...PAIRED_DRAFTS].sort();
  const withAllDrafts=base=>{const initial={...base};for(const key of [...DRAFTS,...PAIRED_DRAFTS])initial[key]="{\"draft\":true}";return initial;};
  // ---- D1 dashboard delete, raw (pre-Save-Library) storage ----
  {
    const initial=withAllDrafts({...KEPT,"careerModeShowdown.activeShowdown":JSON.stringify(active)});delete initial["careerModeShowdown.saveLibrary"];
    const h=harness({initial});vm.runInContext(`currentShowdown=${JSON.stringify(active)};`,h.ctx);
    assert.equal(h.localStorage.draftKeys().length,ALL_DRAFTS.length);
    await h.ctx.deleteCurrentShowdownFromDashboard();
    assert.equal(h.localStorage.getItem("careerModeShowdown.activeShowdown"),null,"the Showdown itself is deleted");
    await h.settle();
    assert.deepEqual(h.localStorage.draftKeys(),[],"every draft of every rivalry is gone, orphans included");
    assertKept(h,["careerModeShowdown.saveLibrary"]);
    assert.deepEqual(h.screens,["mainMenu"]);
    assert.equal(h.diagnostics.loads,1,"diagnostics.js is loaded on demand, once");
    ok("D1 dashboard delete clears every cms.draft.v1 and cms.signingDraft.v1 key of every rivalry and nothing else");
  }
  // ---- D1b dashboard delete while offline: no rivalry id on the Showdown, pair module not loaded ----
  {
    const bare={id:"s1",name:"Nik vs Daniel",status:"In progress",identity:{saveId:"save_1"}};
    const initial=withAllDrafts({...KEPT,"careerModeShowdown.activeShowdown":JSON.stringify(bare)});delete initial["careerModeShowdown.saveLibrary"];
    const h=harness({initial});vm.runInContext(`currentShowdown=${JSON.stringify(bare)};`,h.ctx);
    assert.equal(h.ctx.CareerModePersistentNikDanielPair,undefined,"pair module is not loaded");
    await h.ctx.deleteCurrentShowdownFromDashboard();
    await h.settle();
    assert.deepEqual(h.localStorage.draftKeys(),[],"no rivalry id is needed to clear the drafts");
    assertKept(h,["careerModeShowdown.saveLibrary"]);
    ok("D1b dashboard delete clears every draft when the Showdown has no rivalry id and the pair module is not loaded");
  }
  // ---- D2 Settings remote-first delete ----
  {
    const initial=withAllDrafts({...KEPT});
    const h=harness({initial});
    const runtime=libraryRuntime(h.localStorage);h.ctx.CareerModeSaveLibraryRuntime=runtime;
    vm.runInContext(`currentShowdown=${JSON.stringify(active)};ensureSettingsShowdownStorageAuthority=async function(){return true;};releaseSettingsCurrentShowdownConnection=async function(){return {ok:true};};`,h.ctx);
    const result=await h.ctx.endSettingsCurrentShowdown(null);
    assert.equal(result,true);assert.deepEqual(runtime.calls,["clearActive"]);
    assert.deepEqual(h.localStorage.draftKeys(),[],"drafts are gone by the time the delete resolves, orphans included");assertKept(h);
    assert.ok(h.notices.some(n=>n.kind==="success"));
    ok("D2 Settings END SHOWDOWN clears every draft after the online connection is closed and the local copy is removed");
  }
  // ---- D2b Settings delete: no rivalry id on the Showdown, pair module initializes only during the delete ----
  {
    const bare={id:"s1",name:"Nik vs Daniel",status:"In progress",identity:{saveId:"save_1"}};
    const h=harness({initial:withAllDrafts({...KEPT})});
    const runtime=libraryRuntime(h.localStorage);runtime.loadActiveShowdown=()=>bare;h.ctx.CareerModeSaveLibraryRuntime=runtime;
    vm.runInContext(`currentShowdown=${JSON.stringify(bare)};ensureSettingsShowdownStorageAuthority=async function(){return true;};releaseSettingsCurrentShowdownConnection=async function(){CareerModePersistentNikDanielPair={getState:()=>({rivalryId:${JSON.stringify(PAIRED)}})};return {ok:true};};`,h.ctx);
    assert.equal(await h.ctx.endSettingsCurrentShowdown(null),true);
    assert.deepEqual(h.localStorage.draftKeys(),[],"drafts of the late-initialized pair rivalry, the old rivalry and orphans are all gone");assertKept(h);
    ok("D2b Settings delete clears every draft without depending on when the pair module initializes");
  }
  // ---- D2c r80: a double tap joins the END in flight; the dashboard path of a two-player Showdown routes to END ----
  {
    const h=harness({initial:withAllDrafts({...KEPT})});
    const runtime=libraryRuntime(h.localStorage);h.ctx.CareerModeSaveLibraryRuntime=runtime;
    vm.runInContext(`currentShowdown=${JSON.stringify(active)};ensureSettingsShowdownStorageAuthority=async function(){return true;};var __releases=0;releaseSettingsCurrentShowdownConnection=async function(){__releases+=1;return {ok:true,status:"already-closed"};};`,h.ctx);
    const [first,second]=await Promise.all([h.ctx.endSettingsCurrentShowdown(null),h.ctx.endSettingsCurrentShowdown(null)]);
    assert.equal(first,true);assert.equal(second,true,"the second tap is the same END");
    assert.equal(vm.runInContext("__releases",h.ctx),1,"one close attempt");assert.deepEqual(runtime.calls,["clearActive"]);
    assert.equal(h.notices.filter(n=>n.kind==="success").length,1);assert.equal(h.notices.filter(n=>n.kind==="error").length,0,"already closed is success, not an error");
    assert.match(h.notices[0].text,/History keeps it as Ended early\./);
    const shared={...active,sharedJourney:{mode:"shared",rivalryId:RIVALRY}};
    const d=harness({initial:withAllDrafts({...KEPT,"careerModeShowdown.activeShowdown":JSON.stringify(shared)})});
    vm.runInContext(`currentShowdown=${JSON.stringify(shared)};var __ends=0;endSettingsCurrentShowdown=async function(){__ends+=1;return true;};`,d.ctx);
    await d.ctx.deleteCurrentShowdownFromDashboard();await d.settle();
    assert.equal(vm.runInContext("__ends",d.ctx),1,"a two-player Showdown ends through END SHOWDOWN");
    assert.ok(d.localStorage.getItem("careerModeShowdown.activeShowdown"),"never removed from this browser alone");
    assert.equal(d.localStorage.draftKeys().length,ALL_DRAFTS.length);
    ok("D2c END SHOWDOWN: a double tap is one END and already-closed is success; the dashboard delete of a two-player Showdown routes to END");
  }
  // ---- D2d r80: END reads the seasons from this rivalry's accepted Shared Season Commits (one read-only transaction, no
  // write, never resumeFromAuthority, which moves the season cursor), marks the abandon with it, and forgets this page's
  // session for the ended rivalry only ----
  {
    const h=harness({initial:withAllDrafts({...KEPT})});
    const db=firestoreFake(RIVALRY,{season_1:commitDoc(RIVALRY,1,"ACKNOWLEDGED"),season_2:commitDoc(RIVALRY,2,"ACKNOWLEDGED"),season_3:commitDoc(RIVALRY,3,"COMMITTED")});
    h.ctx.CareerModeProductionFirebaseRuntime=db.runtime;h.ctx.CareerModeFirestoreBudget=db.budget;
    vm.runInContext(`var __abandon=null,__forgot=0,__resumed=0,__refreshes=0;
      CareerModeProductionSharedShowdownSetup={getState:()=>({ready:true,rivalryId:${JSON.stringify(RIVALRY)},setup:{phase:"SHOWDOWN_CONFIRMED"}})};
      CareerModeProductionSharedMultiSeasonProgression={refresh:async()=>{__refreshes+=1;return null;},resumeFromAuthority:async()=>{__resumed+=1;return null;}};
      CareerModeSparkRemoteJoining={getState:()=>({rivalryId:${JSON.stringify(RIVALRY)}}),forgetSession:()=>{__forgot+=1;return {ok:true};}};
      ensureSettingsPersistentPairAuthority=async function(){return {getState:()=>({rivalryId:${JSON.stringify(RIVALRY)},connectionState:"active"}),abandonCurrentShowdown:async options=>{__abandon=options;return {ok:true,status:"closed"};}};};`,h.ctx);
    const result=await h.ctx.releaseSettingsCurrentShowdownConnection(active);
    assert.equal(result.ok,true);assert.equal(result.endedRivalryId,RIVALRY);
    assert.deepEqual(JSON.parse(JSON.stringify(vm.runInContext("__abandon",h.ctx))),{expectedRivalryId:RIVALRY,expectedSaveId:"save_1",seasonsPlayed:2},"season 3 is committed but not acknowledged: 2 seasons");
    assert.deepEqual(db.reads,[1,2,3].map(n=>`rivalries/${RIVALRY}/seasonCommits/season_${n}`),"exact gets in order, stopping at the first season not accepted");
    assert.deepEqual(db.serverNext,db.reads,"every read goes to the server (no reused copy)");
    assert.equal(db.transactions,1,"one read-only transaction");assert.equal(db.writes,0,"no write");
    assert.equal(vm.runInContext("__refreshes",h.ctx),0,"the count does not depend on the progression module");assert.equal(vm.runInContext("__resumed",h.ctx),0,"the season cursor is never moved");
    assert.equal(vm.runInContext("__forgot",h.ctx),0,"the session stays while this device still holds the Showdown");
    db.fail=true;
    vm.runInContext(`CareerModeSparkRemoteJoining={getState:()=>({rivalryId:"pair_${"b".repeat(64)}"}),forgetSession:()=>{__forgot+=1;}};`,h.ctx);
    await h.ctx.releaseSettingsCurrentShowdownConnection(active);
    assert.equal(vm.runInContext("__abandon",h.ctx).seasonsPlayed,null,"an unreadable count is null");
    h.ctx.forgetSettingsEndedSession(RIVALRY);
    assert.equal(vm.runInContext("__forgot",h.ctx),0,"another rivalry's session is kept");
    const e=harness({initial:withAllDrafts({...KEPT})}),eRuntime=libraryRuntime(e.localStorage);e.ctx.CareerModeSaveLibraryRuntime=eRuntime;
    vm.runInContext(`currentShowdown=${JSON.stringify(active)};ensureSettingsShowdownStorageAuthority=async function(){return true;};var __order=[];
      releaseSettingsCurrentShowdownConnection=async function(){__order.push("release");return {ok:true,status:"closed",endedRivalryId:${JSON.stringify(RIVALRY)}};};
      CareerModeSparkRemoteJoining={getState:()=>({rivalryId:${JSON.stringify(RIVALRY)}}),forgetSession:()=>{__order.push(currentShowdown===null?"forget-after-close":"forget-too-early");}};`,e.ctx);
    assert.equal(await e.ctx.endSettingsCurrentShowdown(null),true);
    assert.deepEqual(Array.from(vm.runInContext("__order",e.ctx)),["release","forget-after-close"],"the ended session is forgotten once, after this device closed the Showdown");
    ok("D2d END SHOWDOWN reads the seasons from the accepted Shared Season Commits (one read-only transaction, no cursor move), marks the abandon with it and forgets only the ended session");
  }
  // ---- D2e r80 (Codex P2): a fresh browser opens Settings before CONTINUE. The live shell was rebuilt from the pair link,
  // but no Shared Setup state, no progression module and no private session exist on this page yet. END still records the
  // accepted seasons (was null, so History showed "- seasons" for good); 0 when no season was ever committed; null only
  // when the count truly cannot be read (offline, denied, malformed, a read that never answers is bounded elsewhere) ----
  {
    const fresh=async(docs,configure)=>{
      const h=harness({initial:withAllDrafts({...KEPT})}),db=firestoreFake(RIVALRY,docs);
      h.ctx.CareerModeProductionFirebaseRuntime=db.runtime;h.ctx.CareerModeFirestoreBudget=db.budget;if(configure)configure(db,h);
      vm.runInContext(`var __abandon=null;
        ensureSettingsPersistentPairAuthority=async function(){return {getState:()=>({rivalryId:${JSON.stringify(RIVALRY)},connectionState:"active"}),abandonCurrentShowdown:async options=>{__abandon=options;return {ok:true,status:"closed"};}};};`,h.ctx);
      for(const name of ["CareerModeProductionSharedShowdownSetup","CareerModeProductionSharedMultiSeasonProgression","CareerModeSparkRemoteJoining","loadRuntimeScript"])assert.equal(h.ctx[name],undefined,`${name} is absent on the fresh page`);
      const result=await h.ctx.releaseSettingsCurrentShowdownConnection({id:"s1",identity:{saveId:"save_1"},sharedJourney:{contractVersion:1,mode:"shared",setupPending:true}});
      assert.equal(result.ok,true);assert.equal(result.endedRivalryId,RIVALRY);
      return {played:vm.runInContext("__abandon",h.ctx).seasonsPlayed,db};
    };
    const one=await fresh({season_1:commitDoc(RIVALRY,1,"ACKNOWLEDGED")});
    assert.equal(one.played,1,"season 1 accepted online: 1 season, not a dash");
    assert.deepEqual(one.db.reads,[1,2].map(n=>`rivalries/${RIVALRY}/seasonCommits/season_${n}`),"two exact gets (season 1, then the missing season 2)");
    assert.equal(one.db.writes,0);assert.equal(one.db.transactions,1);
    const all=await fresh(Object.fromEntries([1,2,3,4,5,6,7,8,9,10].map(n=>[`season_${n}`,commitDoc(RIVALRY,n,"ACKNOWLEDGED")])));
    assert.equal(all.played,10);assert.equal(all.db.reads.length,10,"never more than ten season reads");
    const none=await fresh({});
    assert.equal(none.played,0,"no committed season (league wheel, test run): 0 seasons");assert.equal(none.db.reads.length,1);
    const pending=await fresh({season_1:commitDoc(RIVALRY,1,"ACKNOWLEDGED"),season_2:commitDoc(RIVALRY,2,"COMMITTED")});
    assert.equal(pending.played,1,"a committed but unacknowledged season does not count");
    const foreign=await fresh({season_1:commitDoc(RIVALRY,1,"ACKNOWLEDGED"),season_2:commitDoc("pair_"+"c".repeat(64),2,"ACKNOWLEDGED")});
    assert.equal(foreign.played,null,"a malformed commit makes the count unknown");
    const torn=await fresh({season_1:{...commitDoc(RIVALRY,1,"ACKNOWLEDGED"),revision:2}});
    assert.equal(torn.played,null,"an acknowledged commit that is not revision 3 makes the count unknown");
    const offline=await fresh({season_1:commitDoc(RIVALRY,1,"ACKNOWLEDGED")},db=>{db.fail=true;});
    assert.equal(offline.played,null,"offline: END still closes, with null");
    const signedOut=await fresh({season_1:commitDoc(RIVALRY,1,"ACKNOWLEDGED")},(db,h)=>{h.ctx.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:false,code:"offline"})};});
    assert.equal(signedOut.played,null,"no connected services: null");assert.equal(signedOut.db.reads.length,0);
    const noRuntime=await fresh({season_1:commitDoc(RIVALRY,1,"ACKNOWLEDGED")},(db,h)=>{delete h.ctx.CareerModeProductionFirebaseRuntime;});
    assert.equal(noRuntime.played,null,"no runtime: null");
    ok("D2e a fresh browser that opens Settings before CONTINUE records the accepted seasons at END (1, not a dash) from the season commits, with no setup, progression or session on the page; 0 when none, null when unreadable");
  }
  // ---- D3 reset all ----
  for(const mode of ["raw","library"]){
    const initial=withAllDrafts({...KEPT,"careerModeShowdown.activeShowdown":JSON.stringify(active)});
    if(mode==="raw")delete initial["careerModeShowdown.saveLibrary"];
    const h=harness({initial});
    if(mode==="library")h.ctx.CareerModeSaveLibraryRuntime=libraryRuntime(h.localStorage);
    vm.runInContext(`currentShowdown=${JSON.stringify(active)};`,h.ctx);
    const controls=h.ctx.createLegacyDataControls([]);
    const buttons=controls.children.find(child=>child.children.length>=3&&child.children.some(b=>b.textContent==="RESET ALL SHOWDOWN DATA"));
    const reset=buttons.children.find(b=>b.textContent==="RESET ALL SHOWDOWN DATA");
    reset.listeners.click();
    await h.settle();
    assert.deepEqual(h.localStorage.draftKeys(),[],`${mode}: every draft is gone`);
    assert.deepEqual(h.localStorage.otherDrafts(),[],`${mode}: orphans from older deletions are gone too`);
    assert.equal(h.localStorage.getItem("careerModeShowdown.preferences"),KEPT["careerModeShowdown.preferences"],"preferences kept");
    for(const key of ["cms.deviceId","cms.draftNotes","cms.draft.v2:keep","other.cms.draft.v1:x","unrelated"])assert.equal(h.localStorage.getItem(key),KEPT[key],key);
    if(mode==="raw")assert.equal(h.localStorage.getItem("careerModeShowdown.legacyShowdowns"),null,"raw reset still removes Legacy as before");
    assert.ok(h.notices.some(n=>n.kind==="success"),`${mode}: success notice`);
    ok(`D3 RESET ALL SHOWDOWN DATA (${mode} storage) clears every draft of every rivalry; preferences and unrelated keys stay`);
  }
  {
    const initial=withAllDrafts({...KEPT,"careerModeShowdown.activeShowdown":JSON.stringify({id:"s1",status:"In progress"})});
    const h=harness({initial,pairRivalry:PAIRED});h.ctx.CareerModeSaveLibraryRuntime=libraryRuntime(h.localStorage);
    vm.runInContext('currentShowdown={id:"s1",status:"In progress"};',h.ctx);
    const reset=h.ctx.createLegacyDataControls([]).children.find(c=>c.children.length>=3).children.find(b=>b.textContent==="RESET ALL SHOWDOWN DATA");
    reset.listeners.click();
    await h.settle();
    assert.deepEqual(h.localStorage.draftKeys(),[],"a record with no rivalry id still loses every rivalry's drafts, orphans included");
    ok("D3 RESET ALL clears the paired, the Showdown's and every orphaned rivalry's drafts even when the Showdown record has no rivalry id");
  }
  // ---- D4 completed active copy cleanup ----
  {
    const initial=withAllDrafts({...KEPT,"careerModeShowdown.activeShowdown":JSON.stringify(completed)});delete initial["careerModeShowdown.saveLibrary"];
    const h=harness({initial});
    vm.runInContext(`currentShowdown=${JSON.stringify(completed)};`,h.ctx);
    assert.equal(h.ctx.clearMatchingCompletedActiveShowdown("s1"),true);
    await h.settle();
    assert.deepEqual(h.localStorage.draftKeys(),[]);assertKept(h,["careerModeShowdown.saveLibrary"]);
    ok("D4 removing the completed active copy clears every draft");
  }
  // ---- D5 failure or cancel keeps drafts ----
  {
    const initial=withAllDrafts({...KEPT,"careerModeShowdown.activeShowdown":JSON.stringify(active)});
    // Save Library present but its authority is not ready: clearSavedShowdown refuses.
    let h=harness({initial});vm.runInContext(`currentShowdown=${JSON.stringify(active)};`,h.ctx);
    await h.ctx.deleteCurrentShowdownFromDashboard();await h.settle();
    assert.equal(h.localStorage.draftKeys().length,ALL_DRAFTS.length,"failed dashboard delete keeps drafts");
    assert.ok(h.notices.some(n=>n.kind==="error"));
    assert.equal(h.diagnostics.loads,0,"no sweep is even started");
    // Cancelled confirm.
    h=harness({initial,confirmAnswer:false});vm.runInContext(`currentShowdown=${JSON.stringify(active)};`,h.ctx);
    await h.ctx.deleteCurrentShowdownFromDashboard();await h.settle();
    assert.equal(h.localStorage.draftKeys().length,ALL_DRAFTS.length,"cancelled dashboard delete keeps drafts");
    // Settings: local removal fails after the online close.
    h=harness({initial});const runtime=libraryRuntime(h.localStorage,{clearActive:false});h.ctx.CareerModeSaveLibraryRuntime=runtime;
    vm.runInContext(`currentShowdown=${JSON.stringify(active)};ensureSettingsShowdownStorageAuthority=async function(){return true;};releaseSettingsCurrentShowdownConnection=async function(){return {ok:true};};`,h.ctx);
    assert.equal(await h.ctx.endSettingsCurrentShowdown(null),false);
    assert.equal(h.localStorage.draftKeys().length,ALL_DRAFTS.length,"failed Settings delete keeps drafts");
    // Reset all that fails.
    h=harness({initial});h.ctx.CareerModeSaveLibraryRuntime=libraryRuntime(h.localStorage,{clearAll:false});
    vm.runInContext(`currentShowdown=${JSON.stringify(active)};`,h.ctx);
    const controls=h.ctx.createLegacyDataControls([]);
    const reset=controls.children.find(c=>c.children.length>=3).children.find(b=>b.textContent==="RESET ALL SHOWDOWN DATA");
    reset.listeners.click();await h.settle();
    assert.equal(h.localStorage.draftKeys().length,ALL_DRAFTS.length,"failed reset keeps drafts");
    ok("D5 a failed or cancelled delete leaves every draft in place");
  }
  // ---- D5b the sweep module cannot load: the delete itself still completes ----
  {
    const initial=withAllDrafts({...KEPT,"careerModeShowdown.activeShowdown":JSON.stringify(active)});delete initial["careerModeShowdown.saveLibrary"];
    const h=harness({initial});h.ctx.ensureDiagnosticsModule=async()=>{throw new Error("Unable to load js/diagnostics.js.");};
    vm.runInContext(`currentShowdown=${JSON.stringify(active)};`,h.ctx);
    await h.ctx.deleteCurrentShowdownFromDashboard();await h.settle();
    assert.equal(h.localStorage.getItem("careerModeShowdown.activeShowdown"),null,"the Showdown is still deleted");
    assert.deepEqual(h.screens,["mainMenu"]);
    ok("D5b an unavailable sweep module never blocks or breaks the delete");
  }
  // ---- D6 wiring ----
  {
    for(const file of ["js/storage.js","js/showdown.js","js/scoring.js","js/screens.js","js/menuExperience.js","js/optionalModules.js","js/app.js","css/app.css","index.html"])
      assert.ok(!/cms\.(draft|signingDraft)\.v1|DraftKeys/.test(read(file)),`${file} is a startup file and carries none of this`);
    for(const file of ["js/productionSharedSeasonResults.js","js/productionSharedTransferChallenge.js","js/productionSharedTerminalClose.js","js/showdownUI.js","js/legacy.js","js/settings.js"])
      assert.ok(!/\blocalStorage\b/.test(read(file)),`${file} never touches localStorage directly`);
    for(const [file,name,calls] of [["js/showdownUI.js","sweepDashboardShowdownDrafts",1],["js/legacy.js","sweepLegacyShowdownDrafts",2],["js/settings.js","sweepSettingsShowdownDrafts",1]]){
      const source=read(file);
      assert.equal((source.match(new RegExp(`\\b${name}\\(`,"g"))||[]).length,calls+1,`${file} defines ${name} once and calls it ${calls} time(s)`);
      assert.ok(!/\bget\w*DraftKeys|cms\.(draft|signingDraft)\.v1/.test(source),`${file} derives no per-rivalry draft keys`);
    }
    assert.ok(/await sweepSettingsShowdownDrafts\(\);\s*finishSettingsCurrentShowdownDeletion\(\);/.test(read("js/settings.js")),"Settings finishes the delete only after the sweep");
    assert.ok(/window\.clearAllShowdownDraftKeys\s*=\s*clearAllShowdownDraftKeys/.test(read("js/diagnostics.js")));
    assert.ok(read("service-worker.js").includes('"js/diagnostics.js"'),"diagnostics.js is available offline");
    ok("D6 startup files untouched; only storage.js and diagnostics.js touch localStorage; the sweep is wired into every delete path");
  }
  // ---- D7 the sweep helper itself ----
  {
    const store=new Map([...DRAFTS,...OTHER_DRAFTS,...PAIRED_DRAFTS,...Object.keys(KEPT)].map(key=>[key,"x"]));
    const fake={get length(){return store.size;},key:index=>[...store.keys()][index]??null,getItem:key=>store.get(key)??null,removeItem:key=>{store.delete(key);}};
    const sandbox={console,localStorage:fake,document:{}};sandbox.window=sandbox;
    const ctx=vm.createContext(sandbox);vm.runInContext(read("js/diagnostics.js"),ctx,{filename:"js/diagnostics.js"});
    assert.equal(sandbox.clearAllShowdownDraftKeys(),true);
    assert.deepEqual([...store.keys()].sort(),Object.keys(KEPT).sort(),"exactly the two prefixes are removed; lookalikes and everything else stay");
    assert.equal(sandbox.clearAllShowdownDraftKeys(),true,"idempotent on an empty set");
    const throwing={get length(){throw new Error("denied");},key(){throw new Error("denied");},removeItem(){throw new Error("denied");}};
    const sandbox2={console,localStorage:throwing,document:{}};sandbox2.window=sandbox2;
    const ctx2=vm.createContext(sandbox2);vm.runInContext(read("js/diagnostics.js"),ctx2,{filename:"js/diagnostics.js"});
    assert.equal(sandbox2.clearAllShowdownDraftKeys(),false,"blocked storage reports failure instead of throwing");
    ok("D7 clearAllShowdownDraftKeys removes exactly the two prefixes and reports failure on blocked storage");
  }
  console.log(`showdown-delete-clears-drafts contracts passed (${checks} checks)`);
})().catch(error=>{console.error(error);process.exit(1);});

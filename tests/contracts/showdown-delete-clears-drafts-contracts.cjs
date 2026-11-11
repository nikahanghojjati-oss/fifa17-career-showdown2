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
// Node only; the real js/storage.js, js/diagnostics.js, js/showdownUI.js and js/settings.js run in one page context.
//   (D1 was the unbound Showdown Home delete; r90 deleted it as dead code. Settings END SHOWDOWN is the one live path.)
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
  for(const file of ["js/storage.js","js/showdownUI.js","js/settings.js"])vm.runInContext(read(file),ctx,{filename:file});
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
    ok("D2c END SHOWDOWN: a double tap is one END and already-closed is success");
  }
  // ---- D2d r80 (r89, Codex C3 re-check): the seasons count is made by the pair provider inside its own closing transaction
  // (the Rules check it against the same commits), so Settings reads no commits: an active Showdown's END passes no count,
  // a pending-pair code passes 0. It forgets this page's session for the ended rivalry only ----
  {
    const h=harness({initial:withAllDrafts({...KEPT})});
    const db=firestoreFake(RIVALRY,{season_1:commitDoc(RIVALRY,1,"ACKNOWLEDGED"),season_2:commitDoc(RIVALRY,2,"ACKNOWLEDGED"),season_3:commitDoc(RIVALRY,3,"COMMITTED")});
    h.ctx.CareerModeProductionFirebaseRuntime=db.runtime;h.ctx.CareerModeFirestoreBudget=db.budget;
    vm.runInContext(`var __abandon=null,__forgot=0,__state="active";
      CareerModeSparkRemoteJoining={getState:()=>({rivalryId:${JSON.stringify(RIVALRY)}}),forgetSession:()=>{__forgot+=1;return {ok:true};}};
      ensureSettingsPersistentPairAuthority=async function(){return {getState:()=>({rivalryId:${JSON.stringify(RIVALRY)},connectionState:__state}),abandonCurrentShowdown:async options=>{__abandon=options;return {ok:true,status:"closed"};}};};`,h.ctx);
    const result=await h.ctx.releaseSettingsCurrentShowdownConnection(active);
    assert.equal(result.ok,true);assert.equal(result.endedRivalryId,RIVALRY);
    assert.deepEqual(JSON.parse(JSON.stringify(vm.runInContext("__abandon",h.ctx))),{expectedRivalryId:RIVALRY,expectedSaveId:"save_1"},"an active END leaves the count to the pair provider");
    assert.deepEqual(db.reads,[],"Settings reads no Season Commit");assert.equal(db.transactions,0);assert.equal(db.writes,0);
    assert.equal(vm.runInContext("__forgot",h.ctx),0,"the session stays while this device still holds the Showdown");
    vm.runInContext(`__state="pending-pair";`,h.ctx);
    await h.ctx.releaseSettingsCurrentShowdownConnection(active);
    assert.equal(vm.runInContext("__abandon",h.ctx).seasonsPlayed,0,"a pending-pair code ends with 0 seasons");
    vm.runInContext(`CareerModeSparkRemoteJoining={getState:()=>({rivalryId:"pair_${"b".repeat(64)}"}),forgetSession:()=>{__forgot+=1;}};`,h.ctx);
    h.ctx.forgetSettingsEndedSession(RIVALRY);
    assert.equal(vm.runInContext("__forgot",h.ctx),0,"another rivalry's session is kept");
    const e=harness({initial:withAllDrafts({...KEPT})}),eRuntime=libraryRuntime(e.localStorage);e.ctx.CareerModeSaveLibraryRuntime=eRuntime;
    vm.runInContext(`currentShowdown=${JSON.stringify(active)};ensureSettingsShowdownStorageAuthority=async function(){return true;};var __order=[];
      releaseSettingsCurrentShowdownConnection=async function(){__order.push("release");return {ok:true,status:"closed",endedRivalryId:${JSON.stringify(RIVALRY)}};};
      CareerModeSparkRemoteJoining={getState:()=>({rivalryId:${JSON.stringify(RIVALRY)}}),forgetSession:()=>{__order.push(currentShowdown===null?"forget-after-close":"forget-too-early");}};`,e.ctx);
    assert.equal(await e.ctx.endSettingsCurrentShowdown(null),true);
    assert.deepEqual(Array.from(vm.runInContext("__order",e.ctx)),["release","forget-after-close"],"the ended session is forgotten once, after this device closed the Showdown");
    ok("D2d END SHOWDOWN leaves the seasons count to the pair provider (no Settings read; pending-pair is 0) and forgets only the ended session");
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
    // r89 (Codex C3 re-check): the count moved into the pair provider's closing transaction (counted there from the same
    // commits, then checked by the Rules), so a fresh page's Settings passes no count for an active Showdown and reads nothing.
    const one=await fresh({season_1:commitDoc(RIVALRY,1,"ACKNOWLEDGED")});
    assert.equal(one.played,undefined,"an active END leaves the count to the pair provider");
    assert.deepEqual(one.db.reads,[],"Settings reads no Season Commit");assert.equal(one.db.writes,0);assert.equal(one.db.transactions,0);
    {
      // Codex #933: END while Daniel's code is still waiting (pending-pair): 0 seasons with no read (the Rules deny it before ACTIVE).
      const h=harness({initial:withAllDrafts({...KEPT})}),db=firestoreFake(RIVALRY,{});
      h.ctx.CareerModeProductionFirebaseRuntime=db.runtime;h.ctx.CareerModeFirestoreBudget=db.budget;
      vm.runInContext(`var __abandon=null;
        ensureSettingsPersistentPairAuthority=async function(){return {getState:()=>({rivalryId:${JSON.stringify(RIVALRY)},connectionState:"pending-pair"}),abandonCurrentShowdown:async options=>{__abandon=options;return {ok:true,status:"closed"};}};};`,h.ctx);
      const result=await h.ctx.releaseSettingsCurrentShowdownConnection({id:"s1",identity:{saveId:"save_1"},sharedJourney:{contractVersion:1,mode:"shared",setupPending:true}});
      assert.equal(result.ok,true);
      assert.equal(vm.runInContext("__abandon",h.ctx).seasonsPlayed,0,"a waiting code records 0 seasons, not a dash");
      assert.equal(db.reads.length,0,"no season-commit read for a waiting code");
    }
    ok("D2e a fresh browser that opens Settings before CONTINUE ends an active Showdown with no Settings read (the pair provider counts the accepted seasons in its closing transaction); a waiting code records 0 with no read");
  }
  // ---- D5 failure or cancel keeps drafts ----
  {
    const initial=withAllDrafts({...KEPT,"careerModeShowdown.activeShowdown":JSON.stringify(active)});
    // Settings: local removal fails after the online close.
    let h=harness({initial});const runtime=libraryRuntime(h.localStorage,{clearActive:false});h.ctx.CareerModeSaveLibraryRuntime=runtime;
    vm.runInContext(`currentShowdown=${JSON.stringify(active)};ensureSettingsShowdownStorageAuthority=async function(){return true;};releaseSettingsCurrentShowdownConnection=async function(){return {ok:true};};`,h.ctx);
    assert.equal(await h.ctx.endSettingsCurrentShowdown(null),false);
    assert.equal(h.localStorage.draftKeys().length,ALL_DRAFTS.length,"failed Settings delete keeps drafts");
    ok("D5 a failed or cancelled delete leaves every draft in place");
  }
  // ---- D6 wiring ----
  {
    for(const file of ["js/storage.js","js/showdown.js","js/scoring.js","js/screens.js","js/menuExperience.js","js/optionalModules.js","js/app.js","css/app.css","index.html"])
      assert.ok(!/cms\.(draft|signingDraft)\.v1|DraftKeys/.test(read(file)),`${file} is a startup file and carries none of this`);
    for(const file of ["js/productionSharedSeasonResults.js","js/productionSharedTransferChallenge.js","js/productionSharedTerminalClose.js","js/showdownUI.js","js/legacy.js","js/settings.js"])
      assert.ok(!/\blocalStorage\b/.test(read(file)),`${file} never touches localStorage directly`);
    for(const [file,name,calls] of [["js/settings.js","sweepSettingsShowdownDrafts",1]]){
      const source=read(file);
      assert.equal((source.match(new RegExp(`\\b${name}\\(`,"g"))||[]).length,calls+1,`${file} defines ${name} once and calls it ${calls} time(s)`);
      assert.ok(!/\bget\w*DraftKeys|cms\.(draft|signingDraft)\.v1/.test(source),`${file} derives no per-rivalry draft keys`);
    }
    assert.ok(/await sweepSettingsShowdownDrafts\(\);\s*finishSettingsCurrentShowdownDeletion\(\);/.test(read("js/settings.js")),"Settings finishes the delete only after the sweep");
    assert.ok(/window\.clearAllShowdownDraftKeys\s*=\s*clearAllShowdownDraftKeys/.test(read("js/diagnostics.js")));
    assert.ok(read("service-worker.js").includes('"js/diagnostics.js"'),"diagnostics.js is available offline");
    ok("D6 startup files untouched; only storage.js and diagnostics.js touch localStorage; the sweep is wired into the Settings delete path (r91: Legacy reset and delete were cut)");
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

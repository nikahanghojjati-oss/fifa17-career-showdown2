"use strict";
// Deleting Showdown data also clears the unsent private drafts this device kept for it. The drafts (cms.draft.v1:* for Season
// Results and Transfer Guess, cms.signingDraft.v1:* for the signing form) live in localStorage and were only swept when Terminal
// Close reached CLOSED. Every other way to delete Showdown data left them in the browser after the app said the data was gone.
// The sweep removes the keys of the deleted Showdown's own rivalry (and the paired rivalry) through storage.js removeStorageValue,
// because only storage.js and diagnostics.js may touch localStorage (static-app-release and job-1652 contracts).
// Node only; the real js/storage.js, js/showdownUI.js, js/legacy.js and js/settings.js run in one page context.
//   D1  DELETE CURRENT SHOWDOWN (dashboard) removes every draft key of that rivalry; preferences, Legacy, the save library and other keys stay.
//   D2  DELETE CURRENT SHOWDOWN in Settings (remote-first, Save Library authority) removes every draft key; the rest stays.
//   D3  RESET ALL SHOWDOWN DATA removes every draft key of the active rivalry (raw storage and Save Library authority); preferences and other keys stay.
//       The paired rivalry's drafts are removed even when the Showdown record itself carries no rivalry id.
//   D4  deleting the completed active copy of a Showdown (Legacy cleanup) removes every draft key.
//   D5  a delete that does not complete, or is cancelled, leaves every draft in place.
//   D6  wiring: startup files carry no byte of this, Season Results / Transfer Challenge / Terminal Close still never touch localStorage.
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
    draftKeys:()=>[...store.keys()].filter(key=>(key.startsWith("cms.draft.v1:")||key.startsWith("cms.signingDraft.v1:"))&&!OTHER_DRAFTS.includes(key)).sort(),
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
    setTimeout,clearTimeout,confirm:()=>confirmAnswer};
  sandbox.window=sandbox;sandbox.globalThis=sandbox;
  sandbox.confirm=()=>confirmAnswer;
  sandbox.showAppNotice=(text,kind)=>{notices.push({text,kind});};
  sandbox.CareerModeSaveLibraryRuntime=runtime;
  if(pairRivalry)sandbox.CareerModePersistentNikDanielPair={getState:()=>({rivalryId:pairRivalry})};
  const ctx=vm.createContext(sandbox);
  vm.runInContext("var currentShowdown=null;var showScreen=function(id){__screens.push(id);return true;};",Object.assign(ctx,{__screens:screens}));
  for(const file of ["js/storage.js","js/showdownUI.js","js/legacy.js","js/settings.js"])vm.runInContext(read(file),ctx,{filename:file});
  // Replace only screen infrastructure and the online pair call; every delete decision and the draft sweep are the real code.
  vm.runInContext("closeSettings=function(){};loadSavedShowdown=function(){return currentShowdown;};hasSavedShowdown=function(){return Boolean(currentShowdown);};",ctx);
  return {ctx,localStorage,notices,screens};
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
  // ---- D1 dashboard delete, raw (pre-Save-Library) storage ----
  {
    const initial={...KEPT,"careerModeShowdown.activeShowdown":JSON.stringify(active)};delete initial["careerModeShowdown.saveLibrary"];
    for(const key of DRAFTS)initial[key]="{\"draft\":true}";
    const h=harness({initial});h.ctx.currentShowdown=null;vm.runInContext(`currentShowdown=${JSON.stringify(active)};`,h.ctx);
    assert.equal(h.localStorage.draftKeys().length,DRAFTS.length);
    h.ctx.deleteCurrentShowdownFromDashboard();
    assert.equal(h.localStorage.getItem("careerModeShowdown.activeShowdown"),null,"the Showdown itself is deleted");
    assert.deepEqual(h.localStorage.draftKeys(),[],"every draft is gone");
    assert.deepEqual(h.localStorage.otherDrafts(),OTHER_DRAFTS,"another rivalry's drafts are not this Showdown's");
    assertKept(h,["careerModeShowdown.saveLibrary"]);
    assert.deepEqual(h.screens,["mainMenu"]);
    ok("D1 dashboard delete clears every cms.draft.v1 and cms.signingDraft.v1 key and nothing else");
  }
  // ---- D2 Settings remote-first delete ----
  {
    const initial={...KEPT};for(const key of DRAFTS)initial[key]="{\"draft\":true}";
    const h=harness({initial});
    const runtime=libraryRuntime(h.localStorage);h.ctx.CareerModeSaveLibraryRuntime=runtime;
    vm.runInContext(`currentShowdown=${JSON.stringify(active)};ensureSettingsShowdownStorageAuthority=async function(){return true;};releaseSettingsCurrentShowdownConnection=async function(){return {ok:true};};`,h.ctx);
    const result=await h.ctx.deleteSettingsCurrentShowdown(null);
    assert.equal(result,true);assert.deepEqual(runtime.calls,["clearActive"]);
    assert.deepEqual(h.localStorage.draftKeys(),[]);assertKept(h);
    assert.ok(h.notices.some(n=>n.kind==="success"));
    ok("D2 Settings DELETE CURRENT SHOWDOWN clears every draft after the online connection is closed and the local copy is removed");
  }
  // ---- D3 reset all ----
  for(const mode of ["raw","library"]){
    const initial={...KEPT,"careerModeShowdown.activeShowdown":JSON.stringify(active)};
    if(mode==="raw")delete initial["careerModeShowdown.saveLibrary"];
    for(const key of DRAFTS)initial[key]="{\"draft\":true}";
    const h=harness({initial});
    if(mode==="library")h.ctx.CareerModeSaveLibraryRuntime=libraryRuntime(h.localStorage);
    vm.runInContext(`currentShowdown=${JSON.stringify(active)};`,h.ctx);
    const controls=h.ctx.createLegacyDataControls([]);
    const buttons=controls.children.find(child=>child.children.length>=3&&child.children.some(b=>b.textContent==="RESET ALL SHOWDOWN DATA"));
    const reset=buttons.children.find(b=>b.textContent==="RESET ALL SHOWDOWN DATA");
    reset.listeners.click();
    assert.deepEqual(h.localStorage.draftKeys(),[],`${mode}: every draft is gone`);
    assert.equal(h.localStorage.getItem("careerModeShowdown.preferences"),KEPT["careerModeShowdown.preferences"],"preferences kept");
    for(const key of ["cms.deviceId","cms.draftNotes","cms.draft.v2:keep","other.cms.draft.v1:x","unrelated"])assert.equal(h.localStorage.getItem(key),KEPT[key],key);
    if(mode==="raw")assert.equal(h.localStorage.getItem("careerModeShowdown.legacyShowdowns"),null,"raw reset still removes Legacy as before");
    assert.ok(h.notices.some(n=>n.kind==="success"),`${mode}: success notice`);
    ok(`D3 RESET ALL SHOWDOWN DATA (${mode} storage) clears every draft; preferences and unrelated keys stay`);
  }
  {
    const initial={...KEPT,"careerModeShowdown.activeShowdown":JSON.stringify({id:"s1",status:"In progress"})};
    for(const key of [...DRAFTS,...PAIRED_DRAFTS])initial[key]="{\"draft\":true}";
    const h=harness({initial,pairRivalry:PAIRED});h.ctx.CareerModeSaveLibraryRuntime=libraryRuntime(h.localStorage);
    vm.runInContext('currentShowdown={id:"s1",status:"In progress"};',h.ctx);
    const reset=h.ctx.createLegacyDataControls([]).children.find(c=>c.children.length>=3).children.find(b=>b.textContent==="RESET ALL SHOWDOWN DATA");
    reset.listeners.click();
    assert.deepEqual(h.localStorage.draftKeys().filter(key=>PAIRED_DRAFTS.includes(key)),[],"paired rivalry drafts are gone");
    assert.equal(h.localStorage.draftKeys().length,DRAFTS.length,"a record with no rivalry id does not guess other rivalries");
    ok("D3 RESET ALL clears the paired rivalry's drafts even when the Showdown record has no rivalry id");
  }
  // ---- D4 completed active copy cleanup ----
  {
    const initial={...KEPT,"careerModeShowdown.activeShowdown":JSON.stringify(completed)};delete initial["careerModeShowdown.saveLibrary"];
    for(const key of DRAFTS)initial[key]="{\"draft\":true}";
    const h=harness({initial});
    vm.runInContext(`currentShowdown=${JSON.stringify(completed)};`,h.ctx);
    assert.equal(h.ctx.clearMatchingCompletedActiveShowdown("s1"),true);
    assert.deepEqual(h.localStorage.draftKeys(),[]);assertKept(h,["careerModeShowdown.saveLibrary"]);
    ok("D4 removing the completed active copy clears every draft");
  }
  // ---- D5 failure or cancel keeps drafts ----
  {
    const initial={...KEPT,"careerModeShowdown.activeShowdown":JSON.stringify(active)};
    for(const key of DRAFTS)initial[key]="{\"draft\":true}";
    // Save Library present but its authority is not ready: clearSavedShowdown refuses.
    let h=harness({initial});vm.runInContext(`currentShowdown=${JSON.stringify(active)};`,h.ctx);
    h.ctx.deleteCurrentShowdownFromDashboard();
    assert.equal(h.localStorage.draftKeys().length,DRAFTS.length,"failed dashboard delete keeps drafts");
    assert.ok(h.notices.some(n=>n.kind==="error"));
    // Cancelled confirm.
    h=harness({initial,confirmAnswer:false});vm.runInContext(`currentShowdown=${JSON.stringify(active)};`,h.ctx);
    h.ctx.deleteCurrentShowdownFromDashboard();
    assert.equal(h.localStorage.draftKeys().length,DRAFTS.length,"cancelled dashboard delete keeps drafts");
    // Settings: local removal fails after the online close.
    h=harness({initial});const runtime=libraryRuntime(h.localStorage,{clearActive:false});h.ctx.CareerModeSaveLibraryRuntime=runtime;
    vm.runInContext(`currentShowdown=${JSON.stringify(active)};ensureSettingsShowdownStorageAuthority=async function(){return true;};releaseSettingsCurrentShowdownConnection=async function(){return {ok:true};};`,h.ctx);
    assert.equal(await h.ctx.deleteSettingsCurrentShowdown(null),false);
    assert.equal(h.localStorage.draftKeys().length,DRAFTS.length,"failed Settings delete keeps drafts");
    // Reset all that fails.
    h=harness({initial});h.ctx.CareerModeSaveLibraryRuntime=libraryRuntime(h.localStorage,{clearAll:false});
    vm.runInContext(`currentShowdown=${JSON.stringify(active)};`,h.ctx);
    const controls=h.ctx.createLegacyDataControls([]);
    const reset=controls.children.find(c=>c.children.length>=3).children.find(b=>b.textContent==="RESET ALL SHOWDOWN DATA");
    reset.listeners.click();
    assert.equal(h.localStorage.draftKeys().length,DRAFTS.length,"failed reset keeps drafts");
    ok("D5 a failed or cancelled delete leaves every draft in place");
  }
  // ---- D6 wiring ----
  {
    for(const file of ["js/storage.js","js/showdown.js","js/scoring.js","js/screens.js","js/menuExperience.js","js/optionalModules.js","js/app.js","css/app.css","index.html"])
      assert.ok(!/cms\.(draft|signingDraft)\.v1|DraftKeys/.test(read(file)),`${file} is a startup file and carries none of this`);
    for(const file of ["js/productionSharedSeasonResults.js","js/productionSharedTransferChallenge.js","js/productionSharedTerminalClose.js"])
      assert.ok(!/\blocalStorage\b/.test(read(file)),`${file} never touches localStorage directly`);
    for(const [file,name,calls] of [["js/showdownUI.js","getShowdownDashboardDraftKeys",1],["js/legacy.js","getLegacyShowdownDraftKeys",2],["js/settings.js","getSettingsShowdownDraftKeys",1]]){
      const source=read(file);
      assert.equal((source.match(new RegExp(`\\b${name}\\(`,"g"))||[]).length,calls+1,`${file} defines ${name} once and calls it ${calls} time(s)`);
      assert.equal((source.match(/draftKeys\.forEach\(key => removeStorageValue\(key\)\)/g)||[]).length,calls,`${file} removes the keys after each successful delete`);
    }
    ok("D6 startup files untouched; Season Results, Transfer Challenge and Terminal Close still never touch localStorage; the sweep is wired into every delete path");
  }
  console.log(`showdown-delete-clears-drafts contracts passed (${checks} checks)`);
})().catch(error=>{console.error(error);process.exit(1);});

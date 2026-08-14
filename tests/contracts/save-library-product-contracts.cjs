const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");
const {TextEncoder}=require("node:util");
const read=file=>fs.readFileSync(file,"utf8");
const source={
  storage:read("js/storage.js"),transaction:read("js/storageTransaction.js"),foundation:read("js/saveLibraryFoundation.js"),persistence:read("js/saveLibraryPersistence.js"),runtime:read("js/saveLibraryRuntime.js"),cutover:read("js/saveLibraryCutover.js"),ui:read("js/saveLibraryUI.js"),css:read("css/saveLibrary.css"),showdown:read("js/showdown.js"),worker:read("service-worker.js")
};
const keys={saveLibrary:"careerModeShowdown.saveLibrary",activeShowdown:"careerModeShowdown.activeShowdown",legacyShowdowns:"careerModeShowdown.legacyShowdowns",preferences:"careerModeShowdown.preferences"};

assert.ok(!/\blocalStorage\b/.test(source.ui),"Visible Save Library UI must never access raw browser storage directly.");
assert.ok(source.cutover.includes('loadRuntimeStyle("save-library-ui","css/saveLibrary.css")')&&source.cutover.includes('loadRuntimeScript("save-library-ui","js/saveLibraryUI.js"'),"Save Library product assets must stay behind the existing lazy local-data boundary.");
assert.ok(source.ui.includes("captureCareerModeRawSaveLibraryMigrationSnapshot"),"The visible product must use the established exact read authority when deciding empty, compatibility, ready or blocked state.");
assert.ok(source.ui.includes("Names are labels, not identity keys"),"Local Profiles must explain that equal display names do not merge stable identity.");
assert.ok(source.ui.includes("DELETE THIS SAVE")&&source.ui.includes("Other local Saves, Local Profiles, Legacy history and app settings remain"),"Single-Save deletion must be visibly distinct from full reset.");
assert.ok(!source.showdown.includes("replace the active save"),"New Showdown creation must no longer present the retired destructive singleton-replacement model.");
assert.ok(source.runtime.includes("runtimeAppendSaveEntry")&&source.runtime.includes("switchActiveSave:runtimeSwitchActiveSave")&&source.runtime.includes("deleteSave:runtimeDeleteSave"),"The visible product must consume one established Save Library runtime rather than inventing UI persistence.");
assert.ok(source.worker.includes('"css/saveLibrary.css"')&&source.worker.includes('"js/saveLibraryUI.js"'),"Visible Save Library lazy assets must belong to the verified Installable Offline App shell.");
assert.ok(source.css.includes("@media(max-width:760px)")&&source.css.includes("@media(prefers-reduced-motion:reduce)"),"Save Library presentation must retain explicit phone and reduced-motion containment.");

function showdown(id,name,managerOne="Same Name",managerTwo="Same Name"){
  return {schemaVersion:2,integrityWarnings:[],id,name,managers:{playerOne:managerOne,playerTwo:managerTwo},totalRounds:3,currentRound:1,status:"Created",selectedLeague:null,clubs:{playerOne:null,playerTwo:null},score:{playerOne:0,playerTwo:0},transferChallenges:[],rounds:[],createdAt:"2026-08-14T00:00:00.000Z",updatedAt:"2026-08-14T00:00:00.000Z",completedAt:null,archivedAt:null};
}
function createRuntime(){
  const values=new Map([[keys.legacyShowdowns,"[]"],[keys.preferences,JSON.stringify({schemaVersion:2,reducedMotion:false,menuFeedback:true})]]),writes=[];
  const storage={getItem(key){return values.has(key)?values.get(key):null;},setItem(key,value){writes.push({type:"set",key,value:String(value)});values.set(key,String(value));},removeItem(key){writes.push({type:"remove",key,value:null});values.delete(key);}};
  const listeners=new Map();
  const context={console:{error(){},warn(){},log(){}},currentShowdown:null,localStorage:storage,structuredClone,crypto:webcrypto,TextEncoder,setTimeout,clearTimeout,CustomEvent:class{},document:{documentElement:{dataset:{}},addEventListener(){},visibilityState:"visible"},matchMedia(){return{matches:false,addEventListener(){},addListener(){}};},addEventListener(type,handler){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(handler);},dispatchEvent(){},showAppNotice(){}};
  context.window=context;vm.createContext(context);
  for(const file of [source.foundation,source.transaction,source.storage,source.persistence,source.runtime])vm.runInContext(file,context);
  return {context,api:context.CareerModeSaveLibraryRuntime,values,writes,raw(name){return values.has(keys[name])?values.get(keys[name]):null;},clearWrites(){writes.length=0;}};
}

async function additiveCreateSwitchDeleteAndProfileIdentity(){
  const runtime=createRuntime();
  assert.equal((await runtime.api.activate()).ok,true);
  const first=await runtime.api.createShowdown(showdown("first-visible-save","First Rivalry"));
  const firstId=first.identity.saveId;
  const firstProfiles=structuredClone(first.identity.managerProfileIds);
  const second=await runtime.api.createShowdown(showdown("second-visible-save","Second Rivalry"));
  const secondId=second.identity.saveId;
  const secondProfiles=structuredClone(second.identity.managerProfileIds);
  let library=runtime.api.getLibrarySnapshot();
  assert.equal(library.saves.length,2,"Creating a second Showdown must retain the first local Save.");
  assert.equal(library.activeSaveId,secondId,"The newly created Showdown becomes active.");
  assert.ok(library.saves.some(entry=>entry.saveId===firstId)&&library.saves.some(entry=>entry.saveId===secondId));
  assert.equal(library.profiles.length,4,"Each Showdown creates two stable Local Profiles in this first visible candidate.");
  assert.notEqual(firstProfiles.playerOne,firstProfiles.playerTwo);
  assert.notEqual(secondProfiles.playerOne,secondProfiles.playerTwo);
  assert.equal(new Set([firstProfiles.playerOne,firstProfiles.playerTwo,secondProfiles.playerOne,secondProfiles.playerTwo]).size,4,"Identical visible manager names must remain four distinct identities across two saves.");
  assert.equal(runtime.raw("activeShowdown"),null,"Post-cutover product operations must never resurrect singleton authority.");

  const detached=runtime.api.getLibrarySnapshot();
  detached.saves.length=0;
  assert.equal(runtime.api.getLibrarySnapshot().saves.length,2,"UI snapshots must be detached clones, never live authority objects.");

  const switched=await runtime.api.switchActiveSave(firstId);
  assert.equal(switched.identity.saveId,firstId);
  assert.equal(runtime.context.currentShowdown.identity.saveId,firstId);
  library=runtime.api.getLibrarySnapshot();
  assert.equal(library.activeSaveId,firstId);
  assert.equal(library.saves.length,2);
  assert.equal(runtime.raw("activeShowdown"),null);

  const deletedNonActive=runtime.api.deleteSave(secondId);
  assert.equal(deletedNonActive.ok,true);
  library=runtime.api.getLibrarySnapshot();
  assert.equal(library.saves.length,1);
  assert.equal(library.activeSaveId,firstId,"Deleting a non-active Save must not change active ownership.");
  assert.equal(library.profiles.length,4,"Single-Save deletion must not garbage-collect stable Local Profiles implicitly.");

  const deletedActive=runtime.api.deleteSave(firstId);
  assert.equal(deletedActive.ok,true);
  library=runtime.api.getLibrarySnapshot();
  assert.equal(library.saves.length,0);
  assert.equal(library.activeSaveId,null,"Deleting the active Save must require a future explicit selection rather than silently choosing another Save.");
  assert.equal(runtime.context.currentShowdown,null);
  assert.equal(library.profiles.length,4);
  assert.equal(runtime.raw("activeShowdown"),null);
}

async function productMutationsFailClosedOnAuthorityDrift(){
  const runtime=createRuntime();
  await runtime.api.activate();
  const first=await runtime.api.createShowdown(showdown("drift-first","Drift First","A","B"));
  const second=await runtime.api.createShowdown(showdown("drift-second","Drift Second","C","D"));
  const external=JSON.parse(runtime.raw("saveLibrary"));external.externalRevision="another-tab";runtime.values.set(keys.saveLibrary,JSON.stringify(external));runtime.clearWrites();
  await assert.rejects(()=>runtime.api.switchActiveSave(first.identity.saveId),/changed in another tab or operation/i);
  assert.deepEqual(runtime.writes,[],"A stale switch must not write over external authority.");
  assert.equal(runtime.api.isReady(),false);

  const fresh=createRuntime();await fresh.api.activate();const only=await fresh.api.createShowdown(showdown("delete-drift","Delete Drift","E","F"));const changed=JSON.parse(fresh.raw("saveLibrary"));changed.externalRevision="another-tab";fresh.values.set(keys.saveLibrary,JSON.stringify(changed));fresh.clearWrites();
  assert.throws(()=>fresh.api.deleteSave(only.identity.saveId),/changed in another tab or operation/i);
  assert.deepEqual(fresh.writes,[],"A stale deletion must not write over external authority.");
  assert.equal(fresh.api.isReady(),false);
  assert.equal(second.identity.saveId!==first.identity.saveId,true);
}

(async()=>{
  await additiveCreateSwitchDeleteAndProfileIdentity();
  await productMutationsFailClosedOnAuthorityDrift();
  console.log("Save Library product contracts passed: additive multi-save creation, explicit active switching, scoped deletion, detached UI snapshots, same-name identity separation, singleton non-resurrection and stale-authority fail-closed behavior are protected.");
})().catch(error=>{console.error(error);process.exit(1);});
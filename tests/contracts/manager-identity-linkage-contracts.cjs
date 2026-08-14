const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");
const {TextEncoder}=require("node:util");
const read=file=>fs.readFileSync(file,"utf8");
const source={
  storage:read("js/storage.js"),transaction:read("js/storageTransaction.js"),foundation:read("js/saveLibraryFoundation.js"),persistence:read("js/saveLibraryPersistence.js"),runtime:read("js/saveLibraryRuntime.js"),ui:read("js/saveLibraryUI.js"),analytics:read("js/analytics.js"),trophy:read("js/trophyRoom.js")
};
const keys={saveLibrary:"careerModeShowdown.saveLibrary",activeShowdown:"careerModeShowdown.activeShowdown",legacyShowdowns:"careerModeShowdown.legacyShowdowns",preferences:"careerModeShowdown.preferences"};

assert.ok(source.runtime.includes("assignSaveManagerProfile:runtimeAssignSaveManagerProfile")&&source.runtime.includes("assignLegacyManagerProfile:runtimeAssignLegacyManagerProfile"),"Explicit identity linkage must remain inside Save Library runtime authority.");
assert.ok(source.runtime.includes("runtimeFlushBeforeIdentityMutation")&&source.runtime.includes("runtimeCommitIdentityState"),"Identity linkage must flush pending writes and use the existing guarded raw transaction boundary.");
assert.ok(source.runtime.includes("record.identity&&record.identity.saveId===saveId"),"Save-to-Legacy propagation must use stable Save identity, never visible-name equality.");
assert.ok(source.ui.includes("No names are matched automatically")&&source.ui.includes("Historical roles can stay explicitly unresolved"),"Visible identity controls must explain explicit-only mapping and unresolved history.");
assert.ok(!/\blocalStorage\b/.test(source.ui),"Identity linkage UI must not create a raw browser-storage writer.");
assert.ok(source.analytics.includes("analyticsNormalizeName")&&source.trophy.includes("buildCareerAnalytics"),"This foundation candidate must not silently replace the separately bounded Analytics/Trophy aggregation layer.");

function showdown(id,name="Rivalry",one="Same Name",two="Same Name",status="Created"){
  return {schemaVersion:2,integrityWarnings:[],id,name,managers:{playerOne:one,playerTwo:two},totalRounds:3,currentRound:1,status,selectedLeague:null,clubs:{playerOne:null,playerTwo:null},score:{playerOne:0,playerTwo:0},transferChallenges:[],rounds:[],createdAt:"2026-08-14T00:00:00.000Z",updatedAt:"2026-08-14T00:00:00.000Z",completedAt:status==="Completed"?"2026-08-14T01:00:00.000Z":null,archivedAt:null};
}

function seed({active=showdown("first-save","First Rivalry"),legacy=[showdown("historical-only","Historical Rivalry","Same Name","Same Name","Completed")],preferences={schemaVersion:2,reducedMotion:false,menuFeedback:true},saveLibrary=null}={}){
  return {saveLibrary:saveLibrary===null?null:typeof saveLibrary==="string"?saveLibrary:JSON.stringify(saveLibrary),activeShowdown:active===null?null:typeof active==="string"?active:JSON.stringify(active),legacyShowdowns:legacy===null?null:typeof legacy==="string"?legacy:JSON.stringify(legacy),preferences:preferences===null?null:typeof preferences==="string"?preferences:JSON.stringify(preferences)};
}

function createRuntime(rawSeed=seed()){
  const values=new Map();
  for(const [name,value] of Object.entries(rawSeed))if(value!==null)values.set(keys[name],String(value));
  const writes=[];
  const hooks={beforeGet:null};
  const storage={
    getItem(key){if(hooks.beforeGet)hooks.beforeGet(key,values);return values.has(key)?values.get(key):null;},
    setItem(key,value){writes.push({type:"set",key,value:String(value)});values.set(key,String(value));},
    removeItem(key){writes.push({type:"remove",key,value:null});values.delete(key);}
  };
  const listeners=new Map();
  const context={console:{error(){},warn(){},log(){}},currentShowdown:null,localStorage:storage,structuredClone,crypto:webcrypto,TextEncoder,setTimeout,clearTimeout,CustomEvent:class{},document:{documentElement:{dataset:{}},addEventListener(){},visibilityState:"visible"},matchMedia(){return{matches:false,addEventListener(){},addListener(){}};},addEventListener(type,handler){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(handler);},dispatchEvent(){},showAppNotice(){}};
  context.window=context;
  vm.createContext(context);
  for(const file of [source.foundation,source.transaction,source.storage,source.persistence,source.runtime])vm.runInContext(file,context);
  return {context,api:context.CareerModeSaveLibraryRuntime,values,writes,hooks,raw(name){return values.has(keys[name])?values.get(keys[name]):null;},snapshot(){return Object.fromEntries(Object.entries(keys).map(([name,key])=>[name,values.has(key)?values.get(key):null]));},clearWrites(){writes.length=0;}};
}

async function explicitCrossSaveAndHistoricalMapping(){
  const runtime=createRuntime();
  assert.equal((await runtime.api.activate()).ok,true);
  const firstLibrary=runtime.api.getLibrarySnapshot();
  const first=firstLibrary.saves[0];
  const firstRefs=structuredClone(first.showdown.identity.managerProfileIds);
  assert.notEqual(firstRefs.playerOne,firstRefs.playerTwo,"Same visible names must remain separate identities before explicit linkage.");
  const historicalBefore=JSON.parse(runtime.raw("legacyShowdowns"))[0];
  assert.equal(historicalBefore.identity.managerProfileIds.playerOne,null,"Unproven historical identity must remain unresolved after migration.");

  const second=await runtime.api.createShowdown(showdown("second-save","Second Rivalry"));
  const secondInitialRefs=structuredClone(second.identity.managerProfileIds);
  assert.equal(new Set([firstRefs.playerOne,firstRefs.playerTwo,secondInitialRefs.playerOne,secondInitialRefs.playerTwo]).size,4,"Fresh same-name roles across Saves must remain four distinct profiles until explicitly linked.");

  const linked=await runtime.api.assignSaveManagerProfile(second.identity.saveId,"playerOne",firstRefs.playerOne);
  assert.equal(linked.ok,true);
  assert.equal(linked.changed,true);
  let library=runtime.api.getLibrarySnapshot();
  let secondStored=library.saves.find(entry=>entry.saveId===second.identity.saveId).showdown;
  assert.equal(secondStored.identity.managerProfileIds.playerOne,firstRefs.playerOne,"One real manager must be able to share one stable profile across multiple Saves after explicit linkage.");
  assert.equal(secondStored.identity.managerProfileIds.playerTwo,secondInitialRefs.playerTwo,"The other same-name manager must remain a distinct stable identity.");
  assert.equal(library.profiles.length,4,"Linking must retain the now-orphaned original profile instead of destructively merging or deleting identity.");
  assert.equal(secondStored.managers.playerOne,"Same Name");
  assert.equal(secondStored.managers.playerTwo,"Same Name","Identity linkage must not rewrite Showdown display labels.");

  runtime.clearWrites();
  await assert.rejects(()=>runtime.api.assignSaveManagerProfile(second.identity.saveId,"playerTwo",firstRefs.playerOne),/both manager roles/i,"One profile must not be assignable to both rival roles in one Showdown.");
  assert.deepEqual(runtime.writes,[],"Rejected same-Showdown identity collapse must write nothing.");

  runtime.context.currentShowdown=runtime.context.loadSavedShowdown();
  runtime.context.currentShowdown.status="Completed";
  runtime.context.currentShowdown.completedAt="2026-08-14T02:00:00.000Z";
  assert.equal(runtime.context.saveCurrentShowdown(),true);
  assert.equal(runtime.context.archiveShowdown(runtime.context.currentShowdown),true);
  const remapped=await runtime.api.assignSaveManagerProfile(second.identity.saveId,"playerOne",firstRefs.playerTwo);
  assert.equal(remapped.propagatedLegacy,true,"A matching archived copy must inherit an explicit Save-role reassignment by stable save identity.");
  const historyAfterPropagation=JSON.parse(runtime.raw("legacyShowdowns"));
  const matching=historyAfterPropagation.find(record=>record.identity&&record.identity.saveId===second.identity.saveId);
  assert.equal(matching.identity.managerProfileIds.playerOne,firstRefs.playerTwo);
  assert.equal(matching.managers.playerOne,"Same Name","Stable-ID propagation must leave historical labels frozen.");

  const historicalMapped=await runtime.api.assignLegacyManagerProfile("historical-only","playerOne",firstRefs.playerOne);
  assert.equal(historicalMapped.ok,true);
  assert.match(historicalMapped.saveId,/^save_[0-9a-f]{24}$/,"Historical-only mapping must derive stable Showdown identity without using manager names.");
  let historical=JSON.parse(runtime.raw("legacyShowdowns")).find(record=>String(record.id)==="historical-only");
  assert.equal(historical.identity.managerProfileIds.playerOne,firstRefs.playerOne);
  assert.equal(historical.managers.playerOne,"Same Name");

  const unresolved=await runtime.api.assignLegacyManagerProfile("historical-only","playerOne",null);
  assert.equal(unresolved.ok,true);
  historical=JSON.parse(runtime.raw("legacyShowdowns")).find(record=>String(record.id)==="historical-only");
  assert.equal(historical.identity.managerProfileIds.playerOne,null,"Historical identity must remain explicitly clearable back to unresolved.");
  await runtime.api.assignLegacyManagerProfile("historical-only","playerOne",firstRefs.playerOne);

  const deleted=runtime.api.deleteSave(first.saveId);
  assert.equal(deleted.ok,true);
  library=runtime.api.getLibrarySnapshot();
  assert.equal(library.profiles.length,4,"Deleting a Save after linkage must preserve all stable Local Profiles.");
  assert.ok(library.profiles.some(profile=>profile.profileId===firstRefs.playerOne));
  assert.ok(library.profiles.some(profile=>profile.profileId===firstRefs.playerTwo));
  secondStored=library.saves.find(entry=>entry.saveId===second.identity.saveId).showdown;
  assert.equal(secondStored.identity.managerProfileIds.playerOne,firstRefs.playerTwo,"Deleting the original Save must not break a cross-Save profile reference retained by another Save.");
  historical=JSON.parse(runtime.raw("legacyShowdowns")).find(record=>String(record.id)==="historical-only");
  assert.equal(historical.identity.managerProfileIds.playerOne,firstRefs.playerOne,"Deleting a Save must not erase an explicit historical mapping to a retained profile.");

  const projection=runtime.api.createBackupProjection();
  const projectedActive=JSON.parse(projection.raw.activeShowdown);
  const projectedRefs=structuredClone(projectedActive.identity.managerProfileIds);
  const restoredSameDevice=JSON.parse(await runtime.api.prepareRestoreLibraryRaw(projectedActive,runtime.raw("saveLibrary")));
  const restoredActive=restoredSameDevice.saves.find(entry=>entry.saveId===restoredSameDevice.activeSaveId).showdown;
  assert.deepEqual(restoredActive.identity.managerProfileIds,projectedRefs,"Candidate C Save Library preparation must preserve explicit active profile linkage rather than regenerate role profiles.");

  const emptyLibrary={...structuredClone(restoredSameDevice),activeSaveId:null,profiles:[],saves:[]};
  const restoredFresh=JSON.parse(await runtime.api.prepareRestoreLibraryRaw(projectedActive,JSON.stringify(emptyLibrary)));
  const freshActive=restoredFresh.saves.find(entry=>entry.saveId===restoredFresh.activeSaveId).showdown;
  assert.deepEqual(freshActive.identity.managerProfileIds,projectedRefs,"Fresh-device active restore preparation must preserve stable profile IDs carried by Candidate A.");
  for(const profileId of Object.values(projectedRefs))assert.ok(restoredFresh.profiles.some(profile=>profile.profileId===profileId),"Fresh-device active restore must reconstruct the minimum referenced Local Profile registry entries.");
}


async function legacyDriftDuringSaveLinkFailsClosed(){
  const runtime=createRuntime();
  await runtime.api.activate();
  const first=runtime.api.getLibrarySnapshot();
  const firstProfile=first.profiles[0].profileId;
  const second=await runtime.api.createShowdown(showdown("guarded-link","Guarded Link","Alpha","Beta"));
  const externalLegacy=JSON.stringify([...JSON.parse(runtime.raw("legacyShowdowns")),showdown("external-archive","External Archive","Outside","Writer","Completed")]);
  let legacyReads=0;
  runtime.hooks.beforeGet=(key,values)=>{
    if(key!==keys.legacyShowdowns)return;
    legacyReads+=1;
    if(legacyReads===2)values.set(keys.legacyShowdowns,externalLegacy);
  };
  runtime.clearWrites();
  await assert.rejects(()=>runtime.api.assignSaveManagerProfile(second.identity.saveId,"playerOne",firstProfile),/transaction failed|stale/i);
  assert.deepEqual(runtime.writes,[],"A Legacy change at the transaction boundary must block Save-role linkage before any owned write.");
  assert.equal(runtime.raw("legacyShowdowns"),externalLegacy,"Fail-closed linkage must preserve the externally written Legacy bytes.");
}

async function linkageFailsClosedOnAuthorityDrift(){
  const runtime=createRuntime();
  await runtime.api.activate();
  const library=runtime.api.getLibrarySnapshot();
  const save=library.saves[0];
  const target=library.profiles[1].profileId;
  const external=JSON.parse(runtime.raw("saveLibrary"));
  external.externalRevision="another-tab";
  runtime.values.set(keys.saveLibrary,JSON.stringify(external));
  runtime.clearWrites();
  await assert.rejects(()=>runtime.api.assignSaveManagerProfile(save.saveId,"playerOne",target),/changed in another tab or operation/i);
  assert.deepEqual(runtime.writes,[],"Stale identity linkage must fail closed before any canonical write.");
  assert.equal(runtime.api.isReady(),false);
}

(async()=>{
  await explicitCrossSaveAndHistoricalMapping();
  await legacyDriftDuringSaveLinkFailsClosed();
  await linkageFailsClosedOnAuthorityDrift();
  console.log("Manager identity linkage contracts passed: explicit cross-Save reuse, same-name separation, stable-only Legacy propagation, unresolved history, profile retention, restore identity preservation and stale-authority fail-closed behavior are protected.");
})().catch(error=>{console.error(error);process.exit(1);});

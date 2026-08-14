const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");
const {TextEncoder}=require("node:util");

const read=file=>fs.readFileSync(file,"utf8");
const source={
  storage:read("js/storage.js"),
  transaction:read("js/storageTransaction.js"),
  foundation:read("js/saveLibraryFoundation.js"),
  persistence:read("js/saveLibraryPersistence.js"),
  runtime:read("js/saveLibraryRuntime.js"),
  app:read("js/app.js"),
  html:read("index.html"),
  worker:read("service-worker.js"),
  backup:read("js/backup.js"),
  restore:read("js/restore.js"),
  restoreUI:read("js/restoreUI.js"),
  showdown:read("js/showdown.js")
};
const keys={saveLibrary:"careerModeShowdown.saveLibrary",activeShowdown:"careerModeShowdown.activeShowdown",legacyShowdowns:"careerModeShowdown.legacyShowdowns",preferences:"careerModeShowdown.preferences"};

assert.ok(!/\blocalStorage\b/.test(source.runtime),"Save Library runtime orchestration must never access localStorage directly.");
assert.ok(!source.html.includes("js/saveLibraryFoundation.js")&&!source.html.includes("js/saveLibraryPersistence.js")&&!source.html.includes("js/saveLibraryRuntime.js"),"Save Library authority modules must remain outside eager production HTML.");
assert.ok(source.storage.includes('loadRuntimeScript("save-library-foundation","js/saveLibraryFoundation.js"'),"The canonical storage boundary must lazy-load the identity foundation.");
assert.ok(source.storage.includes('loadRuntimeScript("save-library-persistence","js/saveLibraryPersistence.js"'),"The canonical storage boundary must lazy-load the proven persistence transition.");
assert.ok(source.storage.includes('loadRuntimeScript("save-library-runtime","js/saveLibraryRuntime.js"'),"The canonical storage boundary must lazy-load runtime authority.");
assert.ok(source.showdown.includes('await window.ensureSaveLibraryRuntimeAuthority()'),"Start and Continue must activate Save Library only at the confirmed user action boundary.");
assert.ok(!source.storage.includes('window.ensureGameplayModules=wrapped'),"Predictive gameplay warm-up must remain non-mutating and must not activate Save Library authority.");
assert.ok(!source.app.includes('save-library-foundation')&&!source.app.includes('save-library-runtime'),"The protected startup app shell must remain free of Save Library cutover loading logic.");
assert.ok(source.worker.includes('"js/saveLibraryFoundation.js"')&&source.worker.includes('"js/saveLibraryPersistence.js"')&&source.worker.includes('"js/saveLibraryRuntime.js"'),"All Save Library cutover modules must belong to the verified offline whole shell.");
assert.ok(source.restore.includes("captureCareerModeRawRestoreSnapshot"),"Candidate C must retain the mandatory strict destructive restore snapshot authority.");
assert.ok(source.restore.includes("captureCareerModeRawSaveLibraryMigrationSnapshot"),"Candidate C must additionally protect exact Save Library bytes after cutover.");
assert.ok(source.restoreUI.includes("captureCareerModeRawRestoreSnapshot")&&source.restoreUI.includes("captureCareerModeRawSaveLibraryMigrationSnapshot"),"Restore review must confirm both exact raw authority views after cutover.");
assert.ok(source.backup.includes("createBackupProjection"),"Candidate A must project the authoritative active save without changing the v1 envelope.");
assert.ok(source.showdown.includes("await runtime.createShowdown(candidate)"),"New Showdowns must receive Save Library identity before becoming current runtime state.");
assert.ok(!/currentShowdown\s*=\s*candidate[\s\S]{0,400}saveCurrentShowdown\(\)/.test(source.showdown),"New Showdown creation must not persist through the retired singleton facade.");

function showdown(id="active-one",name="Current Showdown",managerOne="Alex",managerTwo="Jordan"){
  return {schemaVersion:2,integrityWarnings:[],id,name,managers:{playerOne:managerOne,playerTwo:managerTwo},totalRounds:3,currentRound:1,status:"Created",selectedLeague:null,clubs:{playerOne:null,playerTwo:null},score:{playerOne:0,playerTwo:0},transferChallenges:[],rounds:[],createdAt:"2026-08-13T10:00:00.000Z",updatedAt:"2026-08-13T10:00:00.000Z",completedAt:null,archivedAt:null};
}
function seed({active=showdown(),legacy=[],preferences={schemaVersion:2,reducedMotion:false,menuFeedback:true},saveLibrary=null}={}){
  return {saveLibrary:saveLibrary===null?null:typeof saveLibrary==="string"?saveLibrary:JSON.stringify(saveLibrary),activeShowdown:active===null?null:typeof active==="string"?active:JSON.stringify(active),legacyShowdowns:legacy===null?null:typeof legacy==="string"?legacy:JSON.stringify(legacy),preferences:preferences===null?null:typeof preferences==="string"?preferences:JSON.stringify(preferences)};
}
function createRuntime(rawSeed=seed()){
  const values=new Map();
  for(const [name,value] of Object.entries(rawSeed))if(value!==null)values.set(keys[name],String(value));
  const writes=[];
  const hooks={beforeGet:null,beforeSet:null,afterSet:null,beforeRemove:null,afterRemove:null};
  const storage={
    getItem(key){if(hooks.beforeGet)hooks.beforeGet(key,values);return values.has(key)?values.get(key):null;},
    setItem(key,value){const next=String(value);if(hooks.beforeSet)hooks.beforeSet(key,next,values);writes.push({type:"set",key,value:next});values.set(key,next);if(hooks.afterSet)hooks.afterSet(key,next,values);},
    removeItem(key){if(hooks.beforeRemove)hooks.beforeRemove(key,values);writes.push({type:"remove",key,value:null});values.delete(key);if(hooks.afterRemove)hooks.afterRemove(key,values);}
  };
  const notices=[];
  const listeners=new Map();
  const context={
    console:{error(){},warn(){},log(){}},currentShowdown:null,localStorage:storage,structuredClone,crypto:webcrypto,TextEncoder,setTimeout,clearTimeout,
    CustomEvent:class{},document:{documentElement:{dataset:{}},addEventListener(){},visibilityState:"visible"},
    matchMedia(){return{matches:false,addEventListener(){},addListener(){}};},
    addEventListener(type,handler){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(handler);},
    dispatchEvent(event){for(const handler of listeners.get(event&&event.type)||[])handler(event);},
    showAppNotice(message){notices.push(String(message));}
  };
  context.window=context;
  vm.createContext(context);
  vm.runInContext(source.foundation,context);
  vm.runInContext(source.transaction,context);
  vm.runInContext(source.storage,context);
  vm.runInContext(source.persistence,context);
  vm.runInContext(source.runtime,context);
  return {
    context,values,writes,hooks,notices,api:context.CareerModeSaveLibraryRuntime,foundation:context.CareerModeSaveLibraryFoundation,
    snapshot(){return Object.fromEntries(Object.entries(keys).map(([name,key])=>[name,values.has(key)?values.get(key):null]));},
    clearWrites(){writes.length=0;},
    emitStorage(key){for(const handler of listeners.get("storage")||[])handler({type:"storage",key});}
  };
}
function writeNames(runtime){return runtime.writes.map(write=>`${write.type}:${Object.entries(keys).find(([,key])=>key===write.key)?.[0]||write.key}`);}

async function migrationThenRuntimeWritesNeverRecreateSingleton(){
  const runtime=createRuntime();
  const activated=await runtime.api.activate();
  assert.equal(activated.ok,true);
  let raw=runtime.snapshot();
  assert.equal(raw.activeShowdown,null,"Runtime activation must retire singleton authority before gameplay writes.");
  const initialLibrary=JSON.parse(raw.saveLibrary);
  const saveId=initialLibrary.activeSaveId;
  const profileIds=initialLibrary.saves[0].showdown.identity.managerProfileIds;
  assert.match(saveId,/^save_[0-9a-f]{24}$/);
  assert.match(profileIds.playerOne,/^profile_[0-9a-f]{24}$/);
  assert.match(profileIds.playerTwo,/^profile_[0-9a-f]{24}$/);

  runtime.context.currentShowdown=runtime.context.loadSavedShowdown();
  runtime.context.currentShowdown.status="League Selected";
  runtime.clearWrites();
  assert.equal(runtime.context.saveCurrentShowdown(),true,"The global gameplay save facade must be cut over to Save Library runtime authority.");
  raw=runtime.snapshot();
  assert.equal(raw.activeShowdown,null);
  assert.ok(!writeNames(runtime).some(name=>name==="set:activeShowdown"),"A normal runtime save must never recreate singleton active bytes.");
  const saved=JSON.parse(raw.saveLibrary).saves[0].showdown;
  assert.equal(saved.identity.saveId,saveId);
  assert.deepEqual(saved.identity.managerProfileIds,profileIds,"Manager identity must remain stable across ongoing saves.");
}

async function seasonAndArchivePreserveIdentity(){
  const runtime=createRuntime();
  await runtime.api.activate();
  runtime.context.currentShowdown=runtime.context.loadSavedShowdown();
  const saveId=runtime.context.currentShowdown.identity.saveId;
  const profiles=structuredClone(runtime.context.currentShowdown.identity.managerProfileIds);
  runtime.context.currentShowdown.rounds.push({roundNumber:1,winner:"draw",playerOne:{scoring:{total:0}},playerTwo:{scoring:{total:0}}});
  assert.equal(runtime.context.saveCurrentShowdown(),true);
  const seasonId=runtime.context.currentShowdown.rounds[0].seasonId;
  assert.match(seasonId,/^season_[0-9a-f]{24}$/,"The synchronous Season save boundary must receive a precomputed stable seasonId.");
  runtime.context.currentShowdown.status="Completed";
  runtime.context.currentShowdown.completedAt="2026-08-13T12:00:00.000Z";
  assert.equal(runtime.context.saveCurrentShowdown(),true);
  runtime.clearWrites();
  assert.equal(runtime.context.archiveShowdown(runtime.context.currentShowdown),true);
  const raw=runtime.snapshot();
  assert.equal(raw.activeShowdown,null);
  const archived=JSON.parse(raw.legacyShowdowns)[0];
  assert.equal(archived.identity.saveId,saveId);
  assert.deepEqual(archived.identity.managerProfileIds,profiles);
  assert.equal(archived.rounds[0].seasonId,seasonId);
  assert.ok(!writeNames(runtime).includes("set:activeShowdown"));
}

async function newShowdownGetsIdentityBeforeFirstWrite(){
  const runtime=createRuntime(seed({active:null,legacy:[]}));
  await runtime.api.activate();
  runtime.clearWrites();
  const prepared=await runtime.api.createShowdown(showdown("new-one","New Rivalry","Same Name","Same Name"));
  assert.match(prepared.identity.saveId,/^save_[0-9a-f]{24}$/);
  assert.match(prepared.identity.managerProfileIds.playerOne,/^profile_[0-9a-f]{24}$/);
  assert.match(prepared.identity.managerProfileIds.playerTwo,/^profile_[0-9a-f]{24}$/);
  assert.notEqual(prepared.identity.managerProfileIds.playerOne,prepared.identity.managerProfileIds.playerTwo,"Identical display names must remain distinct manager identities.");
  const raw=runtime.snapshot();
  assert.equal(raw.activeShowdown,null);
  const library=JSON.parse(raw.saveLibrary);
  assert.equal(library.activeSaveId,prepared.identity.saveId);
  assert.equal(library.saves.length,1);
  assert.ok(!writeNames(runtime).includes("set:activeShowdown"));
}

async function reloadIsIdempotentAndResumesSameIdentity(){
  const first=createRuntime();
  await first.api.activate();
  const firstActive=first.context.loadSavedShowdown();
  const migrated=first.snapshot();
  const second=createRuntime(migrated);
  second.clearWrites();
  const activated=await second.api.activate();
  assert.equal(activated.ok,true);
  assert.equal(activated.status,"already-migrated");
  assert.deepEqual(second.writes,[],"Reload after completed migration must not duplicate or rewrite Save Library state.");
  const resumed=second.context.loadSavedShowdown();
  assert.equal(resumed.identity.saveId,firstActive.identity.saveId);
  assert.deepEqual(resumed.identity.managerProfileIds,firstActive.identity.managerProfileIds);
}

async function staleLibraryAndSingletonReappearanceFailClosed(){
  const stale=createRuntime();
  await stale.api.activate();
  stale.context.currentShowdown=stale.context.loadSavedShowdown();
  const external=JSON.parse(stale.snapshot().saveLibrary);
  external.externalRevision="another-tab";
  stale.values.set(keys.saveLibrary,JSON.stringify(external));
  stale.clearWrites();
  assert.equal(stale.context.saveCurrentShowdown(),false,"A stale tab must not overwrite newer Save Library bytes.");
  assert.deepEqual(stale.writes,[]);
  assert.equal(stale.snapshot().activeShowdown,null);
  assert.equal(stale.api.isReady(),false,"Cross-tab drift must invalidate runtime authority until a fresh activation.");

  const singleton=createRuntime();
  await singleton.api.activate();
  singleton.context.currentShowdown=singleton.context.loadSavedShowdown();
  const recreated=JSON.stringify(showdown("stale-singleton","Stale tab singleton"));
  singleton.values.set(keys.activeShowdown,recreated);
  singleton.clearWrites();
  assert.equal(singleton.context.saveCurrentShowdown(),false,"A stale singleton recreation must block rather than be silently reconciled by normal runtime save.");
  assert.deepEqual(singleton.writes,[]);
  assert.equal(singleton.snapshot().activeShowdown,recreated,"Fail-closed runtime must preserve unowned singleton bytes for explicit migration/recovery handling.");
}

async function transactionBoundaryDriftRollsBackOwnedLibraryOnly(){
  const runtime=createRuntime();
  await runtime.api.activate();
  runtime.context.currentShowdown=runtime.context.loadSavedShowdown();
  runtime.context.currentShowdown.status="Ready";
  const before=runtime.snapshot();
  const externalSingleton=JSON.stringify(showdown("external","External singleton"));
  let injected=false;
  runtime.hooks.afterSet=(key,value,values)=>{
    if(!injected&&key===keys.saveLibrary){injected=true;values.set(keys.activeShowdown,externalSingleton);}
  };
  runtime.clearWrites();
  assert.equal(runtime.context.saveCurrentShowdown(),false);
  const after=runtime.snapshot();
  assert.equal(after.saveLibrary,before.saveLibrary,"The transaction-owned Save Library write must roll back exactly after last-moment cross-slot drift.");
  assert.equal(after.activeShowdown,externalSingleton,"Rollback must not clobber an external singleton write it never owned.");
}

async function corruptLibraryAndBackupProjectionAreFailClosed(){
  const corrupt=createRuntime(seed({active:null,saveLibrary:"{broken-library"}));
  const before=corrupt.snapshot();
  await assert.rejects(()=>corrupt.api.activate(),/Save Library activation failed|unreadable|corrupt/i);
  assert.deepEqual(corrupt.snapshot(),before);
  assert.deepEqual(corrupt.writes,[]);

  const runtime=createRuntime();
  await runtime.api.activate();
  const projectionBefore=runtime.snapshot();
  runtime.clearWrites();
  const projection=runtime.api.createBackupProjection();
  assert.equal(projection.ok,true);
  assert.equal(JSON.parse(projection.raw.activeShowdown).identity.saveId,JSON.parse(projectionBefore.saveLibrary).activeSaveId);
  assert.deepEqual(runtime.writes,[],"Candidate A compatibility projection must remain strictly non-mutating.");
  assert.deepEqual(runtime.snapshot(),projectionBefore);
}

async function resetUsesCanonicalTransactionAndKeepsPreferences(){
  const runtime=createRuntime();
  await runtime.api.activate();
  const preferences=runtime.snapshot().preferences;
  runtime.clearWrites();
  assert.equal(runtime.api.clearAllData(),true);
  const raw=runtime.snapshot();
  assert.equal(raw.activeShowdown,null);
  assert.equal(raw.saveLibrary,null);
  assert.equal(raw.legacyShowdowns,null);
  assert.equal(raw.preferences,preferences);
}

(async()=>{
  await migrationThenRuntimeWritesNeverRecreateSingleton();
  await seasonAndArchivePreserveIdentity();
  await newShowdownGetsIdentityBeforeFirstWrite();
  await reloadIsIdempotentAndResumesSameIdentity();
  await staleLibraryAndSingletonReappearanceFailClosed();
  await transactionBoundaryDriftRollsBackOwnedLibraryOnly();
  await corruptLibraryAndBackupProjectionAreFailClosed();
  await resetUsesCanonicalTransactionAndKeepsPreferences();
  console.log("Save Library runtime authority cutover contracts: PASS");
})().catch(error=>{console.error(error);process.exitCode=1;});

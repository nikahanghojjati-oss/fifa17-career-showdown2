const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");

// Hunt 1019 (JOB-1027): H1019-1 keep-current restore keeps the Save Library, H1019-2 restore validates the
// complete library before writing and rolls back exactly when activation still fails, H1019-4 an older
// overlapping career load never overwrites the newer shared career cache.
const root=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const LIBRARY_KEY="careerModeShowdown.saveLibrary";

function runtime(){
  const values=new Map();
  const c=vm.createContext({console:{...console,error(){},warn(){}},TextEncoder,Blob,URL,structuredClone,
    crypto:webcrypto,setTimeout,clearTimeout,currentShowdown:null,
    localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)},
    document:{documentElement:{dataset:{}},querySelector:()=>null,addEventListener(){}},
    addEventListener(){},dispatchEvent(){},matchMedia:()=>({matches:false})});
  vm.runInContext("window=globalThis",c);
  for(const f of ["storage","storageTransaction","saveLibraryFoundation","saveLibraryPersistence","saveLibraryRuntime","backup","importAnalysis","restore"])
    vm.runInContext(read("js/"+f+".js"),c,{filename:"js/"+f+".js"});
  return {c,values};
}
function showdown(id){
  return {schemaVersion:2,id,name:"Showdown "+id,managers:{playerOne:"Daniel",playerTwo:"Nik"},
    totalRounds:3,currentRound:1,status:"Active",selectedLeague:{id:"premier_league"},
    clubs:{playerOne:"Arsenal",playerTwo:"Chelsea"},score:{playerOne:0,playerTwo:0},
    transferChallenges:[],rounds:[],integrityWarnings:[],createdAt:null,updatedAt:null,completedAt:null,archivedAt:null};
}
async function library(c,id){
  c.fixture=showdown(id);
  return (await vm.runInContext("CareerModeSaveLibraryFoundation.buildSingletonMigrationPlan({activeShowdown:fixture,legacyShowdowns:[]})",c)).library;
}
async function envelope(c,payload){
  c.envelope={formatId:"career-mode-showdown-backup",formatVersion:2,checksumAlgorithm:"SHA-256",
    counts:{activeShowdowns:payload.activeShowdown?1:0,legacyShowdowns:payload.legacyShowdowns?.length??0,preferenceRecords:payload.preferences?1:0},payload};
  c.envelope.checksum=await vm.runInContext("sha256Hex(checksumInputForEnvelope(envelope))",c);
  c.file={name:"backup.json",size:JSON.stringify(c.envelope).length,text:async()=>JSON.stringify(c.envelope)};
  return vm.runInContext("analyzeCareerModeBackupFile(file)",c);
}
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {resolve,promise};}

const tests=[];
const test=(name,fn)=>tests.push([name,fn]);

test("H1019-1 keep-current preview and apply agree and the populated Save Library is kept",async()=>{
  const a=runtime(),current=await library(a.c,1),backup=await library(a.c,2);
  a.values.set(LIBRARY_KEY,JSON.stringify(current));
  await a.c.CareerModeSaveLibraryRuntime.activate();
  const before=a.values.get(LIBRARY_KEY);
  const analysis=await envelope(a.c,{saveLibrary:backup,activeShowdown:backup.saves[0].showdown,legacyShowdowns:[],preferences:null});
  assert.equal(analysis.ok,true);
  a.c.analysis=analysis;a.c.reviewed=a.c.captureCareerModeRawSaveLibraryMigrationSnapshot().raw;
  assert.equal(a.c.reviewed.activeShowdown,null,"migrated library clears the singleton active slot");
  a.c.choices={active:"keep-current",legacy:"keep-current",preferences:"keep-current",saveLibrary:"keep-current"};
  const preview=vm.runInContext("createCareerModeRestorePlan(analysis,reviewed,choices)",a.c);
  assert.equal(preview.summary.saveLibrary,"keep-current");
  const applied=await vm.runInContext("applyCareerModeRestore(file,choices,{expectedRaw:reviewed})",a.c);
  assert.equal(applied.ok,true);
  assert.equal(applied.plan.summary.saveLibrary,"keep-current","apply must not turn keep-current into a clean full restore");
  assert.equal(applied.plan.summary.active,"keep-current");
  assert.equal(a.values.get(LIBRARY_KEY),before,"keep-current never rewrites the Save Library bytes");
  assert.equal(JSON.parse(a.values.get(LIBRARY_KEY)).activeSaveId,current.activeSaveId);
});

test("H1019-1 a truly clean destination still plans a full clean restore",async()=>{
  const a=runtime(),backup=await library(a.c,4);
  const analysis=await envelope(a.c,{saveLibrary:backup,activeShowdown:backup.saves[0].showdown,legacyShowdowns:[],preferences:null});
  a.c.choices={active:"keep-current",legacy:"keep-current",preferences:"keep-current",saveLibrary:"keep-current"};
  a.c.reviewed=a.c.captureCareerModeRawSaveLibraryMigrationSnapshot().raw;
  const applied=await vm.runInContext("applyCareerModeRestore(file,choices,{expectedRaw:reviewed})",a.c);
  assert.equal(analysis.ok,true);
  assert.equal(applied.ok,true);
  assert.equal(applied.plan.summary.saveLibrary,"full-restore-clean");
  assert.equal(JSON.parse(a.values.get(LIBRARY_KEY)).activeSaveId,backup.activeSaveId);
});

test("H1019-2 a library the foundation rejects is blocked in analysis and before any write",async()=>{
  const b=runtime(),good=await library(b.c,3);
  b.values.set(LIBRARY_KEY,JSON.stringify(good));
  await b.c.CareerModeSaveLibraryRuntime.activate();
  const before=b.values.get(LIBRARY_KEY);
  const malformed={schemaVersion:1,activeSaveId:"save_"+"f".repeat(24),profiles:[],saves:[]};
  assert.ok(b.c.CareerModeSaveLibraryFoundation.validateSaveLibrary(malformed).length);
  const analysis=await envelope(b.c,{saveLibrary:malformed,activeShowdown:null,legacyShowdowns:[],preferences:null});
  assert.equal(analysis.ok,false,"analysis reuses the real foundation validation");
  assert.ok(analysis.errors.some(message=>message.startsWith("Save Library: ")&&/activeSaveId/.test(message)));
  b.c.choices={active:"use-backup",legacy:"keep-current",preferences:"keep-current",saveLibrary:"use-backup"};
  const applied=await vm.runInContext("applyCareerModeRestore(file,choices)",b.c);
  assert.equal(applied.ok,false);
  assert.equal(applied.status,"analysis-blocked");
  assert.equal(b.values.get(LIBRARY_KEY),before,"previous library bytes are preserved");
  assert.equal(b.c.CareerModeSaveLibraryRuntime.isReady(),true);
  assert.ok(b.c.loadSavedShowdown());
});

test("H1019-2 the complete candidate is validated again at apply even if analysis was not authoritative",async()=>{
  const b=runtime(),good=await library(b.c,5);
  b.values.set(LIBRARY_KEY,JSON.stringify(good));
  await b.c.CareerModeSaveLibraryRuntime.activate();
  const before=b.values.get(LIBRARY_KEY);
  const malformed={schemaVersion:1,activeSaveId:"save_"+"e".repeat(24),profiles:[],saves:[]};
  await envelope(b.c,{saveLibrary:malformed,activeShowdown:null,legacyShowdowns:[],preferences:null});
  const realAnalyze=b.c.analyzeCareerModeBackupFile;
  b.c.analyzeCareerModeBackupFile=async file=>{const result=await realAnalyze(file);return {...result,ok:true,errors:[],migratedPayload:{...result.migratedPayload,saveLibrary:malformed}};};
  b.c.choices={active:"use-backup",legacy:"keep-current",preferences:"keep-current",saveLibrary:"use-backup"};
  const applied=await vm.runInContext("applyCareerModeRestore(file,choices)",b.c);
  assert.equal(applied.ok,false);
  assert.equal(applied.status,"analysis-blocked");
  assert.equal(b.values.get(LIBRARY_KEY),before);
});

test("H1019-2 activation failure after commit rolls back to the exact previous snapshot and reports failure",async()=>{
  const b=runtime(),good=await library(b.c,6),backup=await library(b.c,7);
  b.values.set(LIBRARY_KEY,JSON.stringify(good));
  b.values.set("careerModeShowdown.legacyShowdowns","[]");
  await b.c.CareerModeSaveLibraryRuntime.activate();
  const before=new Map(b.values);
  const analysis=await envelope(b.c,{saveLibrary:backup,activeShowdown:backup.saves[0].showdown,legacyShowdowns:[],preferences:null});
  assert.equal(analysis.ok,true);
  const realRuntime=b.c.CareerModeSaveLibraryRuntime;
  let calls=0;
  b.c.CareerModeSaveLibraryRuntime={...realRuntime,activate:async()=>{calls+=1;if(calls===1)throw new Error("forced activation failure");return realRuntime.activate();}};
  b.c.choices={active:"use-backup",legacy:"keep-current",preferences:"keep-current",saveLibrary:"use-backup"};
  const applied=await vm.runInContext("applyCareerModeRestore(file,choices)",b.c);
  assert.equal(applied.ok,false);
  assert.notEqual(applied.status,"success");
  assert.equal(applied.status,"rolled-back");
  assert.deepEqual([...b.values.entries()].sort(),[...before.entries()].sort(),"every canonical key is byte-identical to the previous snapshot");
  assert.equal(realRuntime.isReady(),true,"previous library is re-activated after rollback");
});

test("H1019-4 an older overlapping career load never overwrites the newer career cache",async()=>{
  const pending=[];const rid="pair_"+"1".repeat(64);const events=[];
  const c=vm.createContext({console,
    CustomEvent:class{constructor(type){this.type=type;}},dispatchEvent:event=>events.push(event.type),
    CareerModeOnlinePlayerIdentity:{getState:()=>({status:"ready",registered:true,managerId:"daniel"})},
    CareerModeSparkConnectedAccount:{getState:()=>({connected:true,accountId:"Daniel"})},
    CareerModePersistentNikDanielPair:{getState:()=>({rivalryId:rid})},
    CareerModeSharedActiveShowdownAdapter:{buildActiveShowdownViews:()=>({careerInput:{}})},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"Daniel"}},firestoreSdk:{getDoc(){}}})},
    CareerModeSparkClosedShowdownCareerLoader:{loadClosedShowdownCareer(){const d=deferred();pending.push(d);return d.promise;}},
    loadRuntimeScript:async()=>{}});
  vm.runInContext(read("js/rivalryLegacyV10.js"),c,{filename:"js/rivalryLegacyV10.js"});
  const api=c.CareerModeRivalryLegacyV10;
  const older=api.loadCareerModel();while(pending.length<1)await new Promise(r=>setImmediate(r));
  const newer=api.loadCareerModel();while(pending.length<2)await new Promise(r=>setImmediate(r));
  const newModel={status:"ready",seasons:2},oldModel={status:"ready",seasons:1};
  pending[1].resolve({model:newModel});assert.equal(await newer,newModel);
  assert.equal(api.cachedCareerModel(),newModel);
  pending[0].resolve({model:oldModel});assert.equal(await older,oldModel,"the older caller still receives its own result");
  assert.equal(api.cachedCareerModel(),newModel,"stale load must not replace the newer cache");
  assert.equal(events.length,1,"only the newest load announces a career model change");
  // Sequential loads still refresh the cache normally.
  const third=api.loadCareerModel();while(pending.length<3)await new Promise(r=>setImmediate(r));
  const thirdModel={status:"ready",seasons:3};pending[2].resolve({model:thirdModel});await third;
  assert.equal(api.cachedCareerModel(),thirdModel);
});

(async()=>{
  for(const [name,fn] of tests){
    try{await fn();console.log("PASS "+name);}
    catch(error){console.error("FAIL "+name);console.error(error);process.exitCode=1;}
  }
})();

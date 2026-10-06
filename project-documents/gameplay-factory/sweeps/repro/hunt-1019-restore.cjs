// Run from the repository root. Real backup/analyzer/restore/transaction/runtime code,
// isolated Map-backed localStorage; no browser, network, Firebase or production data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const ROOT = path.resolve(__dirname, '../../../..');
function runtime() {
  const values = new Map();
  const c = vm.createContext({console, TextEncoder, Blob, URL, structuredClone,
    crypto: webcrypto, setTimeout, clearTimeout, currentShowdown: null,
    localStorage: {getItem:k=>values.get(k)??null, setItem:(k,v)=>values.set(k,String(v)), removeItem:k=>values.delete(k)},
    document:{documentElement:{dataset:{}}, querySelector:()=>null, addEventListener(){}},
    addEventListener(){}, dispatchEvent(){}, matchMedia:()=>({matches:false})});
  vm.runInContext('window=globalThis', c);
  for (const f of ['storage','storageTransaction','saveLibraryFoundation','saveLibraryPersistence','saveLibraryRuntime','backup','importAnalysis','restore'])
    vm.runInContext(fs.readFileSync(path.join(ROOT,'js',f+'.js'),'utf8'),c,{filename:'js/'+f+'.js'});
  return {c,values};
}
function showdown(id) {
  return {schemaVersion:2,id,name:'Showdown '+id,managers:{playerOne:'Daniel',playerTwo:'Nik'},
    totalRounds:3,currentRound:1,status:'Active',selectedLeague:{id:'premier_league'},
    clubs:{playerOne:'Arsenal',playerTwo:'Chelsea'},score:{playerOne:0,playerTwo:0},
    transferChallenges:[],rounds:[],integrityWarnings:[],createdAt:null,updatedAt:null,completedAt:null,archivedAt:null};
}
async function library(c,id) {
  c.fixture=showdown(id);
  return (await vm.runInContext('CareerModeSaveLibraryFoundation.buildSingletonMigrationPlan({activeShowdown:fixture,legacyShowdowns:[]})',c)).library;
}
async function envelope(c,payload) {
  c.envelope={formatId:'career-mode-showdown-backup',formatVersion:2,checksumAlgorithm:'SHA-256',
    counts:{activeShowdowns:payload.activeShowdown?1:0,legacyShowdowns:payload.legacyShowdowns?.length??0,preferenceRecords:payload.preferences?1:0},payload};
  c.envelope.checksum=await vm.runInContext('sha256Hex(checksumInputForEnvelope(envelope))',c);
  c.file={name:'backup.json',size:JSON.stringify(c.envelope).length,text:async()=>JSON.stringify(c.envelope)};
  return vm.runInContext('analyzeCareerModeBackupFile(file)',c);
}
(async()=>{
  const a=runtime(), current=await library(a.c,1), backup=await library(a.c,2);
  a.values.set('careerModeShowdown.saveLibrary',JSON.stringify(current));
  await a.c.CareerModeSaveLibraryRuntime.activate();
  const analysis=await envelope(a.c,{saveLibrary:backup,activeShowdown:backup.saves[0].showdown,legacyShowdowns:[],preferences:null});
  assert.equal(analysis.ok,true);
  a.c.analysis=analysis; a.c.reviewed=a.c.captureCareerModeRawSaveLibraryMigrationSnapshot().raw;
  a.c.choices={active:'keep-current',legacy:'keep-current',preferences:'keep-current',saveLibrary:'keep-current'};
  const preview=vm.runInContext('createCareerModeRestorePlan(analysis,reviewed,choices)',a.c);
  assert.equal(preview.summary.saveLibrary,'keep-current');
  assert.equal(Object.keys(preview.candidateRaw).length,0);
  const applied=await vm.runInContext('applyCareerModeRestore(file,choices,{expectedRaw:reviewed})',a.c);
  assert.equal(applied.ok,true);
  assert.equal(JSON.parse(a.values.get('careerModeShowdown.saveLibrary')).activeSaveId,backup.activeSaveId);
  console.log('H1019-1 CONFIRMED: preview=keep-current, apply='+applied.plan.summary.saveLibrary+', local save 1 replaced by backup save 2');

  const b=runtime(), good=await library(b.c,3);
  b.values.set('careerModeShowdown.saveLibrary',JSON.stringify(good));
  await b.c.CareerModeSaveLibraryRuntime.activate();
  const malformed={schemaVersion:1,activeSaveId:'save_'+'f'.repeat(24),profiles:[],saves:[]};
  const badAnalysis=await envelope(b.c,{saveLibrary:malformed,activeShowdown:null,legacyShowdowns:[],preferences:null});
  assert.equal(badAnalysis.ok,true);
  assert.ok(b.c.CareerModeSaveLibraryFoundation.validateSaveLibrary(malformed).length);
  b.c.choices={active:'use-backup',legacy:'keep-current',preferences:'keep-current',saveLibrary:'use-backup'};
  const badApplied=await vm.runInContext('applyCareerModeRestore(file,choices)',b.c);
  assert.equal(badApplied.ok,true);
  assert.equal(b.c.CareerModeSaveLibraryRuntime.isReady(),false);
  assert.equal(JSON.parse(b.values.get('careerModeShowdown.saveLibrary')).saves.length,0);
  assert.equal(b.c.loadSavedShowdown(),null);
  console.log('H1019-2 CONFIRMED: invalid library analysis=ready, restore=success, previous save lost, runtimeReady=false');
})().catch(e=>{console.error(e);process.exitCode=1;});

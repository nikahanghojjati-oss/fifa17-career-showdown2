'use strict';
// r86 reads accuracy (Nik 2026-10-28): the Settings counter shows what Google bills against the free 50,000, which is every
// document read PLUS every document the Security Rules look up to allow a read or a write. r84/r85 multiplied this phone's
// document reads by 2.8; js/sparkPrivatePairing.js now prices each request by its own path from a table generated from the
// composed production Rules, the same derivation the CE2PG billed meter uses (tests/browser/support/billed-meter.cjs).
// B1 the client table matches the Rules (and the Rules pin) for every path, so a Rules change cannot leave it stale;
// B2 a career-page get is billed at the finished-Showdown price and counted as a career page;
// B3 a listener's lookups are billed once, at its first server delivery; later deliveries are document reads only;
// B4 a transaction that writes is billed its write lookups once per request; a read-only one none;
// B5 a direct setDoc (the career summary) is billed its write lookups as a career page;
// B6 seasons left: a season's cost is game reads only, today's use counts career pages too, both devices;
// B7 Settings shows both devices' total and this device's games / career pages split.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {spawnSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
for(const script of ['build-production-firestore-rules.mjs','build-production-firestore-rules-with-persistent-pair.mjs']){
  const built=spawnSync(process.execPath,[path.join(ROOT,'scripts',script)],{cwd:ROOT,encoding:'utf8'});
  assert.equal(built.status,0,`${script} failed: ${built.stderr||built.stdout}`);
}
const billedMeter=require(path.join(ROOT,'tests/browser/support/billed-meter.cjs'));
const lookups=require(path.join(ROOT,'tests/browser/support/rules-lookups.cjs'));
const source=read('js/sparkPrivatePairing.js');
const budgetSource=source.slice(source.indexOf('// Firestore budget layer (r75).'));
let checks=0;
async function check(label,fn){await fn();checks+=1;console.log(`ok ${checks} ${label}`);}

function page(){
  const storage=new Map();
  const c=vm.createContext({console,setTimeout,clearTimeout,readStorageValue:key=>storage.has(key)?storage.get(key):null,writeStorageValue:(key,value)=>{storage.set(key,value);return true;}});
  vm.runInContext(budgetSource,c);
  return {c,budget:c.CareerModeFirestoreBudget,storage};
}
const snap=(extra={})=>({exists:()=>true,data:()=>({}),metadata:{fromCache:false,hasPendingWrites:false},...extra});
const RID='pair_'+'a'.repeat(64);

(async()=>{
  const model=billedMeter.loadModel();
  const {budget}=page();

  await check('B1 the client lookup table matches the composed production Rules for every path (reads live and finished, write documents)',()=>{
    const rulesText=read('firestore.spark.generated.rules');
    assert.equal(budget.rulesLookups.rulesSha256,lookups.hashRules(rulesText),'regenerate FSB_RULES_LOOKUPS from the current Rules');
    assert.equal(budget.rulesLookups.rulesSha256,JSON.parse(read('tests/browser/support/billed-reads-table.json')).rulesSha256,'the client table and the CE2PG billed meter are pinned to the same Rules');
    const templates=lookups.templates(model.analysis).filter(template=>!template.includes('=**'));
    assert.ok(templates.length>=20,'every Rules path is covered');
    for(const template of templates){
      const docPath=template.replace(/^\//,'').replace(/\{[^}]+\}/g,'x1');
      assert.equal(budget.rulesLookups.read(docPath,false),model.readDocs(template,true).length,`${template}: live read`);
      assert.equal(budget.rulesLookups.read(docPath,true),model.readDocs(template,false).length,`${template}: finished read`);
      assert.equal(budget.rulesLookups.write([docPath]),model.writeDocs(template).length,`${template}: write`);
    }
    assert.equal(budget.rulesLookups.read('',false),1,'a query is one lookup (the signed-in account)');
    // One request that writes two documents looks each Rules document up once.
    const two=[`rivalries/${RID}/seasonResults/s1`,`rivalries/${RID}/seasonResults/s1/roles/playerOne`];
    assert.equal(budget.rulesLookups.write(two),new Set([...model.writeDocs('/rivalries/{rivalryId}/seasonResults/{seasonId}'),...model.writeDocs('/rivalries/{rivalryId}/seasonResults/{seasonId}/roles/{managerRole}')]).size);
  });

  await check('B2 a career-page get of a finished Showdown is billed its document plus the finished lookups, as a career page',async()=>{
    const {budget:b}=page();
    const sdk=b.meterSdk({doc:(_db,...parts)=>({path:parts.join('/')}),getDoc:async()=>snap()});
    const docPath=`rivalries/${RID}/state/authoritative`;
    await sdk.getDoc({path:docPath});
    const today=b.readsToday();
    assert.equal(today.reads,1,'one document read');
    assert.equal(today.career,1+model.readDocs('/rivalries/{rivalryId}/state/authoritative',false).length,'document + finished lookups (rivalry and account)');
    assert.equal(today.game,0,'not a game read');
    assert.equal(today.billedEstimate,today.thisPhone*2,'both devices');
  });

  await check('B3 a listener is billed its lookups once, at the first server delivery; later deliveries are documents only',()=>{
    const {budget:b}=page();let next=null;
    const sdk=b.meterSdk({doc:()=>null,onSnapshot:(_ref,_options,onNext)=>{next=onNext;return ()=>{};}});
    sdk.onSnapshot({path:`rivalries/${RID}/sessions/s1`},{includeMetadataChanges:true},()=>{},()=>{});
    next(snap({metadata:{fromCache:true,hasPendingWrites:false}}));
    assert.equal(b.readsToday().game,0,'a cached delivery costs nothing');
    next(snap());
    const live=model.readDocs('/rivalries/{rivalryId}/sessions/{sessionId}',true).length;
    assert.equal(b.readsToday().game,1+live,'first server delivery: document + lookups');
    next(snap());next(snap());
    assert.equal(b.readsToday().game,3+live,'later deliveries: one document each');
  });

  await check('B4 a transaction that writes is billed its write lookups once per request; a read-only one none',async()=>{
    const {budget:b}=page();
    const store=new Map();
    const runTransaction=async(_db,fn)=>{const writes=[];const value=await fn({get:async ref=>snap({data:()=>store.get(ref.path)||{}}),set:(ref,data)=>{writes.push([ref.path,data]);},update:(ref,data)=>{writes.push([ref.path,data]);},delete:()=>{}});for(const [p,d] of writes)store.set(p,d);return value;};
    const services=b.services({ok:true,firestoreSdk:{runTransaction},auth:{currentUser:{uid:'u1'}}});
    const db={};
    const rivalry={path:`rivalries/${RID}`},results={path:`rivalries/${RID}/seasonResults/s1`},role={path:`rivalries/${RID}/seasonResults/s1/roles/playerOne`};
    await services.firestoreSdk.runTransaction(db,async tx=>{await tx.get(rivalry);});
    const afterRead=b.readsToday().game;
    assert.equal(afterRead,1+model.readDocs('/rivalries/{rivalryId}',true).length,'read-only: document + live lookups, no write lookups');
    b.wantFresh();
    await services.firestoreSdk.runTransaction(db,async tx=>{await tx.get(results);tx.set(results,{a:1});tx.set(role,{b:1});});
    const writeDocs=b.rulesLookups.write([results.path,role.path]);
    const readCost=b.readsToday().game-afterRead-writeDocs;
    assert.ok(readCost>=1+model.readDocs('/rivalries/{rivalryId}/seasonResults/{seasonId}',true).length,'the transaction read is billed');
    assert.equal((b.readsToday().game-afterRead-readCost),writeDocs,'the two writes are one request: each Rules document once');
  });

  await check('B5 a direct setDoc (the career summary) is billed its write lookups as a career page',async()=>{
    const {budget:b}=page();
    const sdk=b.meterSdk({doc:()=>null,setDoc:async()=>undefined,getDoc:async()=>snap()});
    await sdk.setDoc({path:`accounts/u1/careerSummary/${RID}`},{});
    assert.equal(b.readsToday().career,model.writeDocs('/accounts/{accountId}/careerSummary/{rivalryId}').length);
    await assert.rejects(b.meterSdk({doc:()=>null,setDoc:async()=>{throw Object.assign(new Error('offline'),{code:'unavailable'});}}).setDoc({path:`accounts/u1/careerSummary/${RID}`},{}));
    assert.equal(b.readsToday().career,model.writeDocs('/accounts/{accountId}/careerSummary/{rivalryId}').length,'an unanswered write is not billed');
  });

  await check('B6 seasons left: a season costs its game reads only; today\'s use counts career pages too, for both devices',async()=>{
    const {budget:b}=page();
    const DEFAULT=Number(/FSB_DEFAULT_SEASON_BILLED=(\d+);/.exec(source)[1]);
    assert.ok(DEFAULT>=200&&DEFAULT<=2000,`the measured default (${DEFAULT}) is a real season cost`);
    assert.equal(b.seasonsLeftToday().billedPerSeason,DEFAULT*2);
    for(let i=0;i<300;i+=1)b.countListenerRead();
    const sdk=b.meterSdk({doc:()=>null,getDoc:async()=>snap()});
    for(let i=0;i<50;i+=1)await sdk.getDoc({path:`accounts/u1/careerSummary/${RID}`});
    b.noteSeasonDone(`${RID}|1`,true);
    const left=b.seasonsLeftToday(),today=b.readsToday();
    assert.equal(left.billedPerSeason,300*2,'career pages opened during the season are not part of its cost');
    assert.equal(left.billedToday,(300+today.career)*2,'but they are part of today\'s use');
    assert.equal(left.seasons,Math.floor((50000-left.billedToday)/left.billedPerSeason));
  });

  await check('B7 Settings shows both devices\' total and this device\'s games / career pages split',()=>{
    const settings=read('js/settings.js');
    assert.match(settings,/· both devices`/);
    assert.match(settings,/"COUNTED HERE TODAY"/);
    assert.match(settings,/`Games \$\{getSettingsRoundedReads\(today\.game\)\} · career pages \$\{getSettingsRoundedReads\(today\.career\)\}`/);
  });

  console.log(`PASS r86 billed counter contracts: ${checks} checks`);
})().catch(error=>{console.error(error);process.exit(1);});

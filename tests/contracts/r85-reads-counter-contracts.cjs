'use strict';
// r85 audit F04: the Settings "About N reads today / estimate" counter must see every Firestore read route, not only the
// budget layer's transactions. Based on the independent auditor's meter probe (Showdown_Independent_Deep_Audit_R84.md,
// "The quota counter misses career-history reads": 100 finished Showdowns, 601 getDoc calls, readsToday = 0).
// Real budget layer, career index, completed reader, loader, adapter and career model; only SDK IO is fake.
// What is counted (js/sparkPrivatePairing.js, "ONE read meter"): requested server document reads. One per returned
// document (a missing document is still one), a query answer at least one, a cache-sourced snapshot (metadata.fromCache)
// or a listener's pending-write echo 0, a request the server answered with an error (denied...) 1, an unanswered one 0.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {webcrypto,createHash}=require('node:crypto');
const ROOT=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const raw=read('tests/fixtures/saved-showdowns/r79-1season-win.json');
const original=JSON.parse(raw).rivalryId;
const rid=n=>'pair_'+n.toString(16).padStart(64,'0');
const budgetSource=(source=>source.slice(source.indexOf('// Firestore budget layer (r75).')))(read('js/sparkPrivatePairing.js'));
let checks=0;const check=(label,fn)=>{fn();checks++;};

// ---- fixture (same construction as r83-cold-career-reads-contracts) ----
function decode(value){
  const kind=Object.keys(value)[0];
  switch(kind){
    case 'nullValue':return null;
    case 'booleanValue':return value.booleanValue;
    case 'stringValue':return value.stringValue;
    case 'integerValue':return Number(value.integerValue);
    case 'doubleValue':return value.doubleValue;
    case 'timestampValue':return {toMillis:()=>Date.parse(value.timestampValue)};
    case 'arrayValue':return (value.arrayValue.values||[]).map(decode);
    case 'mapValue':return Object.fromEntries(Object.entries(value.mapValue.fields||{}).map(([k,v])=>[k,decode(v)]));
    default:throw new Error(kind);
  }
}
function canonical(value){
  if(value&&typeof value.toMillis==='function')return {$timestamp:value.toMillis()};
  if(Array.isArray(value))return value.map(canonical);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));
  return value;
}
function game(n,total=1){
  const f=JSON.parse(raw.replaceAll(original,rid(n)));
  const docs=Object.fromEntries(f.documents.map(d=>[d.path,decode({mapValue:{fields:d.fields}})]));
  const root=docs['rivalries/'+rid(n)];
  if(total!==1){
    docs[`rivalries/${rid(n)}/sharedSetup/authoritative`].totalSeasons=total;
    Object.assign(root.data.terminalClose,{totalSeasons:total,completedSeason:total,managerTotals:{playerOne:5*total,playerTwo:total}});
    Object.assign(root.data.terminalProgress,{totalSeasons:total,acceptedThroughSeason:total,managerTotals:{playerOne:5*total,playerTwo:total}});
    for(let season=2;season<=total;season++)for(const suffix of ['seasonResults/season_1','seasonResults/season_1/roles/playerOne','seasonResults/season_1/roles/playerTwo','seasonCommits/season_1']){
      const value=docs[`rivalries/${rid(n)}/${suffix}`];
      docs[`rivalries/${rid(n)}/${suffix.replace('season_1',`season_${season}`)}`]={...value,seasonNumber:season};
    }
  }
  root.contentHash='sha256:'+createHash('sha256').update(JSON.stringify(canonical({objectType:'rivalry',objectId:rid(n),revision:root.revision,data:root.data}))).digest('hex');
  return docs;
}
const accounts=game(1)['rivalries/'+rid(1)].data.managerSlots.map(s=>s.accountId);
const envelope=(type,id,data)=>({schemaVersion:1,objectType:type,objectId:id,revision:0,lifecycleState:'live',contentHash:'sha256:fixture',data});
function index(docs,uid,ids){docs[`accounts/${uid}/careerIndex/current`]=envelope('careerIndex','current',{rivalryIds:ids,sealedPageCount:0});}
function complete(result,count,total){
  assert.equal(result.status,'ready');
  assert.equal(result.model.coverage.readable,count);
  assert.equal(result.model.history.showdowns.length,count);
  assert.equal(result.model.managers.daniel.careerPoints,5*count*total);
  assert.equal(result.model.managers.nik.careerPoints,count*total);
}
// One fresh page: the real modules plus the real budget layer in one realm; `log` holds every server get the SDK received.
function page(docs){
  const db={},log=[];let active=0,peak=0;
  const rawSdk={doc:(_db,...p)=>p.join('/'),getDoc:async ref=>{
    log.push(ref);active++;peak=Math.max(peak,active);
    try{await new Promise(resolve=>setImmediate(resolve));const value=docs[ref];return {exists:()=>value!==undefined,data:()=>value,metadata:{fromCache:false,hasPendingWrites:false}};}
    finally{active--;}
  }};
  const c=vm.createContext({console,TextEncoder,crypto:webcrypto,setTimeout,clearTimeout});
  vm.runInContext(read('js/persistentNikDanielPair.js'),c);
  for(const [key,file] of Object.entries({CareerModeSparkCompletedShowdownReader:'sparkCompletedShowdownReader',CareerModeSharedClosedShowdownAdapter:'sharedClosedShowdownAdapter',CareerModeSharedCareerAnalytics:'sharedCareerAnalytics'}))c[key]=require(path.join(ROOT,'js',file+'.js'));
  vm.runInContext(read('js/sparkClosedShowdownCareerLoader.js'),c);
  vm.runInContext(budgetSource,c);
  const budget=c.CareerModeFirestoreBudget;
  return {c,db,log,rawSdk,budget,peak:()=>peak,reads:()=>budget.readsToday().reads};
}
const noTransaction=async()=>{throw new Error('archive reads use getDoc, never a transaction');};

// ---- 1. archives: 1/10/100 finished Showdowns, one and ten seasons, both managers, cold then warm ----
const measured={};
async function archives(){
  for(const total of [1,10])for(const count of [1,10,100])for(const uid of (count===100&&total===10?[accounts[0]]:accounts)){
    const docs=Object.assign({},...Array.from({length:count},(_,i)=>game(i+1,total)));
    index(docs,uid,Array.from({length:count},(_,i)=>rid(i+1)));
    const p=page(docs);
    // The runtime path: services(...) hands out the metered SDK (the auditor's probe used exactly this route).
    const services=p.budget.services({ok:true,auth:{currentUser:{uid}},firestore:p.db,firestoreSdk:{...p.rawSdk,runTransaction:noTransaction}});
    const options={firestore:p.db,firebaseSdk:services.firestoreSdk,user:{uid},cryptoImpl:webcrypto};
    const load=()=>p.c.CareerModeSparkClosedShowdownCareerLoader.loadClosedShowdownCareer(options);
    complete(await load(),count,total);
    const cold=p.log.length;
    assert.equal(cold,1+(2+4*total)*count,`cold ${count}x${total}: one index head plus 2 + 4 per season for every Showdown`);
    assert.equal(p.reads(),cold,`cold ${count}x${total}: readsToday equals the server gets (was 0 before r85)`);
    assert.ok(p.peak()>1&&p.peak()<=12,'metering leaves the loader concurrency unchanged');
    complete(await load(),count,total);
    const warm=p.log.length-cold;
    assert.equal(warm,1,'warm visit asks the server for the mutable index head only');
    assert.equal(p.reads()-cold,warm,'warm visit: finished Showdowns served from memory count 0 new reads');
    assert.equal(p.budget.stats().directReads,p.log.length);
    if(uid===accounts[0])measured[`${count}x${total}`]={cold,coldReads:cold,warm,warmReads:warm};
  }
  checks++;
}

// ---- 2. the module-import path (rivalryLegacyV10, seasonFinalV10, careerStartMarker) counts once, never twice ----
async function importPath(){
  const uid=accounts[1],docs=Object.assign({},game(1),game(2));index(docs,uid,[rid(1),rid(2)]);
  const p=page(docs),M=p.budget.meterSdk;
  // runtime services expose no getDoc: the screens import it from the Firestore module and pass it through meterSdk.
  const services=p.budget.services({ok:true,auth:{currentUser:{uid}},firestore:p.db,firestoreSdk:{doc:p.rawSdk.doc,runTransaction:noTransaction}});
  assert.equal(typeof services.firestoreSdk.getDoc,'undefined');
  const sdk=M(services.firestoreSdk?.getDoc?services.firestoreSdk:p.rawSdk);
  assert.equal(M(sdk),sdk,'meterSdk is idempotent');
  assert.equal(M(sdk).getDoc,p.budget.meterGet(sdk.getDoc),'a metered function is never wrapped again');
  const twice=p.budget.services({ok:true,auth:{currentUser:{uid}},firestore:p.db,firestoreSdk:{...sdk,runTransaction:noTransaction}});
  assert.equal(twice.firestoreSdk.getDoc,sdk.getDoc,'services(...) keeps an already metered getDoc');
  const result=await p.c.CareerModeSparkClosedShowdownCareerLoader.loadClosedShowdownCareer({firestore:p.db,firebaseSdk:{...twice.firestoreSdk,getDoc:sdk.getDoc},user:{uid},cryptoImpl:webcrypto});
  complete(result,2,1);
  assert.equal(p.reads(),p.log.length,'one count per server get through the import path');
  assert.equal(p.log.length,13);
  // Career index read on its own (career marker / Home path) is metered the same way.
  const before=p.reads(),gets=p.log.length;
  await p.c.CareerModePersistentNikDanielPair.readCareerIndex({firestore:p.db,firebaseSdk:sdk,accountId:uid});
  assert.equal(p.reads()-before,p.log.length-gets);
  checks++;
}

// ---- 3. what one request counts ----
async function units(){
  const p=page({}),b=p.budget,snap=(fromCache,pending=false)=>({exists:()=>true,data:()=>({}),metadata:{fromCache,hasPendingWrites:pending}});
  check('server document 1, cache 0',()=>{assert.equal(b.readUnits(snap(false)),1);assert.equal(b.readUnits(snap(true)),0);assert.equal(b.readUnits({exists:()=>false,data:()=>undefined,metadata:{fromCache:false}}),1);});
  check('query: 1 per document, at least 1',()=>{assert.equal(b.readUnits({docs:[],metadata:{fromCache:false}}),1);assert.equal(b.readUnits({docs:[1,2,3],metadata:{fromCache:false}}),3);assert.equal(b.readUnits({docs:[1,2],metadata:{fromCache:true}}),0);});
  check('listener pending-write echo 0',()=>{assert.equal(b.readUnits(snap(false,true),true),0);assert.equal(b.readUnits(snap(false,true)),1);});
  const error=code=>Object.assign(new Error(code),{code});
  const answers=[snap(true),snap(false),{docs:[1,2,3,4],metadata:{fromCache:false}},error('permission-denied'),error('unavailable'),error('resource-exhausted'),error('cancelled'),new Error('client side')];
  const sdk=b.meterSdk({doc:()=>'x',getDoc:async()=>{const a=answers.shift();if(a instanceof Error)throw a;return a;},getDocs:async()=>{const a=answers.shift();if(a instanceof Error)throw a;return a;}});
  const start=b.readsToday().reads;
  await sdk.getDoc('x');assert.equal(b.readsToday().reads-start,0,'cache-sourced get counts 0');
  await sdk.getDoc('x');assert.equal(b.readsToday().reads-start,1,'server get counts 1');
  await sdk.getDocs('q');assert.equal(b.readsToday().reads-start,5,'query of 4 documents counts 4');
  await assert.rejects(sdk.getDoc('x'));assert.equal(b.readsToday().reads-start,6,'denied get counts 1, as Firestore bills it');
  for(let i=0;i<4;i++)await assert.rejects(sdk.getDoc('x'));
  assert.equal(b.readsToday().reads-start,6,'unanswered (offline, quota, cancelled) or client-side failures count 0');
  checks++;
}

// ---- 4. listeners: unowned listeners metered through meterSdk; both callback shapes ----
async function listeners(){
  const p=page({}),b=p.budget;let next=null,fail=null;
  const sdk=b.meterSdk({doc:()=>'x',onSnapshot:(ref,options,a,e)=>{if(typeof a==='object'){next=v=>a.next(v);fail=v=>a.error(v);}else{next=a;fail=e;}return ()=>{};}});
  const start=b.readsToday().reads;let seen=0;
  sdk.onSnapshot('x',{includeMetadataChanges:true},()=>{seen++;},()=>{seen++;});
  next({exists:()=>true,data:()=>({}),metadata:{fromCache:true,hasPendingWrites:false}});
  next({exists:()=>true,data:()=>({}),metadata:{fromCache:false,hasPendingWrites:false}});
  next({exists:()=>true,data:()=>({}),metadata:{fromCache:false,hasPendingWrites:true}});
  fail(Object.assign(new Error('denied'),{code:'permission-denied'}));
  assert.equal(seen,4,'every callback still runs');
  assert.equal(b.readsToday().reads-start,2,'cache 0 + server 1 + own pending write 0 + denied listen 1');
  sdk.onSnapshot('x',{includeMetadataChanges:true},{next:()=>{seen++;},error:()=>{seen++;}});
  next({exists:()=>true,data:()=>({}),metadata:{fromCache:false,hasPendingWrites:false}});
  fail(Object.assign(new Error('offline'),{code:'unavailable'}));
  assert.equal(seen,6);assert.equal(b.readsToday().reads-start,3,'observer form metered the same way');
  // countListenerRead stays (public API) and still counts one.
  b.countListenerRead();assert.equal(b.readsToday().reads-start,4);
  checks++;
}

// ---- 5. source census: every getDoc/getDocs/onSnapshot call site in js/ is covered or explicitly excluded ----
function census(){
  const covered={
    'sparkPrivatePairing.js':'budget layer: services() meters getDoc/getDocs/onSnapshot; owned listeners count in fsbCtxDelivery/fsbWaitDelivery',
    'rivalryLegacyV10.js':'career marker + index + loader: getDoc via meterSdk',
    'seasonFinalV10.js':'completed history reader: getDoc via meterSdk',
    'careerStartMarker.js':'resolveServices: getDoc via meterSdk; readMarker/careerHiddenRivalryIds use the sdk they are given',
    'productionSharedSeasonCommit.js':'season-commit wait context listeners: onSnapshot via meterSdk',
    'persistentNikDanielPair.js':'Home JOIN note listener via meterSdk; readCareerIndex uses the sdk it is given (metered by callers)',
    'sparkClosedShowdownCareerLoader.js':'uses options.firebaseSdk.getDoc (metered by callers); its cancel wrapper calls the metered function',
    'sparkCompletedShowdownReader.js':'uses options.firebaseSdk.getDoc (metered by callers)',
    'careerSummaryStore.js':'r86 career summary: uses the firebaseSdk.getDoc the loader gives it (metered by callers)',
    'ssjrPhysicalJourneyAcceptance.js':'SSJR test panel closed-Showdown check (index + one exact read): getDoc via meterSdk',
    'sparkSharedSeasonResults.js':'uses sdk.getDoc only when the given (budget-wrapped, metered) services expose it; else a counted transaction'
  };
  const excluded={
    'sparkSharedShowdownSetup.js':'mentions getDoc in a comment only; its preflight read is a counted transaction',
    'sparkCompletedTransferHistoryReader.js':'no caller in js/; any caller passing budget services gets a metered getDoc',
    'productionAuthorizationAcceptance.js':'operator acceptance page (network-only, never loaded by the app page or its counter)',
    'productionProviderAbuseAcceptance.js':'operator acceptance page (network-only, never loaded by the app page or its counter)'
  };
  const pattern=/\b(?:getDocs?|getDocFromServer|getDocsFromServer|onSnapshot)\b/;
  const found=fs.readdirSync(path.join(ROOT,'js')).filter(f=>f.endsWith('.js')&&pattern.test(read('js/'+f).replace(/captureCareerModeRawSaveLibraryMigrationSnapshot|captureLibraryMigrationSnapshot/g,'')));
  assert.deepEqual(found.sort(),Object.keys({...covered,...excluded}).sort(),'a new Firestore read call site must be metered and listed here');
  for(const file of ['rivalryLegacyV10.js','seasonFinalV10.js','careerStartMarker.js','productionSharedSeasonCommit.js','persistentNikDanielPair.js','ssjrPhysicalJourneyAcceptance.js']){
    const source=read('js/'+file);
    assert.ok(source.includes('CareerModeFirestoreBudget?.meterSdk')||source.includes('budget?.meterSdk'),`${file} meters the SDK it takes`);
    assert.ok(!/countListenerRead/.test(source),`${file} no longer counts listener deliveries by hand (would count twice)`);
  }
  for(const line of read('js/rivalryLegacyV10.js').split('\n').concat(read('js/seasonFinalV10.js').split('\n'),read('js/careerStartMarker.js').split('\n')))
    if(/import\(runtime\.firebaseFirestoreModule\)/.test(line))assert.match(line,/meterSdk/,'every getDoc taken from the Firestore module is metered');
  const settings=read('js/settings.js');
  assert.match(settings,/`About \$\{getSettingsRoundedReads\(today\.billedEstimate\)/);assert.match(settings,/estimate until a season is played today/);
  assert.match(budgetSource,/FSB_BILLED_PER_READ=2\.8/,'r86: the 2.8 factor only prices a day first counted before r86 (document reads only)');
  checks++;
}

(async()=>{
  await archives();await importPath();await units();await listeners();census();
  const m=measured['100x1'],t=measured['100x10'];
  console.log(`PASS r85 reads counter contracts: ${checks} checks; 100 one-season cold ${m.cold} gets -> readsToday ${m.coldReads} (was 0), warm ${m.warm}/${m.warmReads}; 100 ten-season cold ${t.cold} -> ${t.coldReads}, warm ${t.warm}/${t.warmReads}`);
})().catch(error=>{console.error(error);process.exitCode=1;});

'use strict';
// r86 reads at scale (Nik 2026-10-27, "both": phone copy first, the Firebase career summary only when the copy is missing).
// Real career index, completed reader, loader, career summary store, adapter and career model; only SDK IO and the
// phone's IndexedDB are fake (in memory, create-only summaries like the Rules). For 10, 30 and 100 finished ten-season
// Showdowns (1,000 with CMS_SCALE_1000=1) and both managers it measures:
//   first r86 open (no summaries yet: full read + one summary write per game, the one-time backfill),
//   a known phone on a fresh page (phone copy: the index only),
//   a new phone or wiped copy (index + one summary per game),
//   and the time to build the career from the phone copy.
// Hard ceilings (Gate): known phone <= index docs; new phone <= index docs + N; one write per game per manager, once.
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
function index(docs,uid,ids){docs[`accounts/${uid}/careerIndex/current`]=envelope('careerIndex','current',{rivalryIds:ids,sealedPageCount:0});}function complete(result,count,total){
  assert.equal(result.status,'ready');
  assert.equal(result.model.coverage.readable,count);
  assert.equal(result.model.history.showdowns.length,count);
  assert.equal(result.model.managers.daniel.careerPoints,5*count*total);
  assert.equal(result.model.managers.nik.careerPoints,count*total);
}
// More than 500 Showdowns spill into sealed index pages, as js/persistentNikDanielPair.js does.
function pagedIndex(docs,uid,ids){
  const pages=[];for(let i=0;i+500<ids.length;i+=500)pages.push(ids.slice(i,i+500));
  pages.forEach((page,i)=>{docs[`accounts/${uid}/careerIndex/page_${i+1}`]={...envelope('careerIndexPage',`page_${i+1}`,{pageNumber:i+1,rivalryIds:page})};});
  docs[`accounts/${uid}/careerIndex/current`]=envelope('careerIndex','current',{rivalryIds:ids.slice(pages.length*500),sealedPageCount:pages.length});
  return 1+pages.length;
}
// Minimal IndexedDB: one database, one object store, string keys, put + a bounded cursor. Survives "page loads".
function fakeIndexedDB(){
  const data=new Map();
  const later=fn=>setImmediate(fn);
  const store={
    put(value,key){data.set(key,JSON.parse(JSON.stringify(value)));},
    openCursor(range){
      const keys=[...data.keys()].filter(k=>!range||(k>=range.lower&&k<=range.upper)).sort();let i=0;
      const request={result:null,onsuccess:null,onerror:null};
      const step=()=>later(()=>{request.result=i<keys.length?{key:keys[i],value:data.get(keys[i]),continue(){i++;step();}}:null;request.onsuccess?.();});
      step();return request;
    }
  };
  const db={objectStoreNames:{contains:()=>true},createObjectStore(){},transaction(){const tx={objectStore:()=>store,oncomplete:null,onerror:null,onabort:null};later(()=>tx.oncomplete?.());return tx;}};
  return {data,open(){const request={result:db,onsuccess:null,onerror:null,onupgradeneeded:null,onblocked:null};later(()=>request.onsuccess?.());return request;}};
}
const keyRange={bound:(lower,upper)=>({lower,upper})};
// One fresh page load: the real modules in one realm; `log` holds every server get, `writes` every summary create.
function page(docs,phone,{hang=false}={}){
  const log=[],writes=[];
  const sdk={doc:(_db,...p)=>p.join('/'),
    getDoc:async ref=>{log.push(ref);await new Promise(resolve=>setImmediate(resolve));const value=docs[ref];return {exists:()=>value!==undefined,data:()=>value};},
    setDoc:async(ref,value)=>{if(hang)return new Promise(()=>{});await new Promise(resolve=>setImmediate(resolve));if(docs[ref]!==undefined)throw Object.assign(new Error('PERMISSION_DENIED'),{code:'permission-denied'});writes.push(ref);docs[ref]=JSON.parse(JSON.stringify(value));}};
  const c=vm.createContext({console,TextEncoder,crypto:webcrypto,setTimeout,clearTimeout,IDBKeyRange:keyRange});
  vm.runInContext(read('js/persistentNikDanielPair.js'),c);
  for(const [key,file] of Object.entries({CareerModeSparkCompletedShowdownReader:'sparkCompletedShowdownReader',CareerModeSharedClosedShowdownAdapter:'sharedClosedShowdownAdapter',CareerModeSharedCareerAnalytics:'sharedCareerAnalytics'}))c[key]=require(path.join(ROOT,'js',file+'.js'));
  vm.runInContext(read('js/careerSummaryStore.js'),c);
  vm.runInContext(read('js/sparkClosedShowdownCareerLoader.js'),c);
  const db={};
  return {log,writes,settled:()=>c.CareerModeCareerSummaryStore.writesSettled(),load:uid=>c.CareerModeSparkClosedShowdownCareerLoader.loadClosedShowdownCareer({firestore:db,firebaseSdk:sdk,user:{uid},cryptoImpl:webcrypto,phoneStorage:phone})};
}
const strip=model=>JSON.stringify(model);
// The production runtime's firestoreSdk carries no setDoc, so the History caller must hand the loader the imported SDK's
// setDoc, or every summary write is silently skipped (Codex P1 on #1026).
{
  const runtime=read('js/productionFirebaseRuntime.js').match(/firestoreSdk:Object\.freeze\(\{([^}]*)\}\)/);
  assert.ok(runtime&&!/setDoc/.test(runtime[1]),'production runtime firestoreSdk shape changed: recheck the History caller');
  const call=read('js/rivalryLegacyV10.js').match(/loadClosedShowdownCareer\(\{[^]*?firebaseSdk:\{([^}]*)\}/);
  assert.ok(call&&/setDoc:sdk\.setDoc/.test(call[1]),'History hands the career loader the SDK setDoc for summary writes');
}
// A summary write that never answers (offline: Firestore keeps it pending) never holds History up: the career is ready
// and the phone copy is kept (Codex P2 on #1026).
async function pendingWrite(){
  const docs=Object.assign({},game(1,3),game(2,3)),uid=accounts[0],phone=fakeIndexedDB();index(docs,uid,[rid(1),rid(2)]);
  const hung=page(docs,phone,{hang:true});
  const result=await Promise.race([hung.load(uid),new Promise(resolve=>setTimeout(()=>resolve('timeout'),5000))]);
  assert.notEqual(result,'timeout','a pending summary write never blocks the load');complete(result,2,3);
  assert.equal(hung.writes.length,0);
  const next=page(docs,phone);complete(await next.load(uid),2,3);
  assert.deepEqual(next.log,[`accounts/${uid}/careerIndex/current`],'the phone copy was kept although the write never finished');
}
// Red team #7: a finished game damaged in its own documents (a season missing) fails the same way on every read. It is kept
// for the page like a finished game, so a second career-screen open re-reads only the index head, not the whole game again.
async function damagedGame(){
  const docs=Object.assign({},game(1,3),game(2,3)),uid=accounts[0],phone=fakeIndexedDB();index(docs,uid,[rid(1),rid(2)]);
  docs[`rivalries/${rid(2)}/seasonCommits/season_2`]={...docs[`rivalries/${rid(2)}/seasonCommits/season_2`],phase:'PENDING'};
  const p=page(docs,phone),a=await p.load(uid);
  assert.equal(a.model.coverage.readable,1,'the damaged game is left out, the good one counts');
  const before=p.log.length;const b=await p.load(uid);
  assert.equal(p.log.length-before,1,'second open on the same page rechecks the index head only');
  assert.equal(strip(b.model),strip(a.model));
  // Codex P2 on #1047: a Setup document that is missing for a moment is retried on the next open of the same page.
  const late=game(3,3);index(late,uid,[rid(3)]);
  const setup=`rivalries/${rid(3)}/sharedSetup/authoritative`,held=late[setup];delete late[setup];
  const q=page(late,fakeIndexedDB());assert.equal((await q.load(uid)).model.coverage.readable,0);
  late[setup]=held;assert.equal((await q.load(uid)).model.coverage.readable,1,'the restored Setup is read again');
}
const counts=[10,30,100,...(process.env.CMS_SCALE_1000==='1'?[1000]:[])];
const results=[];
(async()=>{
  await pendingWrite();
  await damagedGame();
  const TOTAL=10;
  for(const count of counts){
    const docs=Object.assign({},...Array.from({length:count},(_,i)=>game(i+1,TOTAL)));
    const ids=Array.from({length:count},(_,i)=>rid(i+1));
    const row={count};
    for(const uid of accounts){
      const indexDocs=pagedIndex(docs,uid,ids);
      const phone=fakeIndexedDB();
      // 1. First r86 open: no summary anywhere yet (the backfill); every game read in full, then summarised once.
      const first=page(docs,phone),t1=Date.now(),a=await first.load(uid),firstMs=Date.now()-t1;await first.settled();
      complete(a,count,TOTAL);
      assert.equal(first.writes.length,count,'one summary write per game');
      assert.equal(first.log.length,indexDocs+count*(1+2+4*TOTAL),'first open: index, then per game one summary check and the full read');
      // 2. The same phone on a fresh page: its copy answers every game; only the index is read.
      const known=page(docs,phone),t2=Date.now(),b=await known.load(uid),knownMs=Date.now()-t2;
      complete(b,count,TOTAL);assert.equal(strip(b.model),strip(a.model),'phone copy career = full read career');
      const knownGets=known.log.length;assert.equal(knownGets,indexDocs,'known phone reads only the career index');assert.equal(known.writes.length,0);
      // 3. A new phone (or a wiped copy): one summary per game, no full read, no write; afterwards it is a known phone.
      const fresh=fakeIndexedDB(),newPhone=page(docs,fresh),t3=Date.now(),c3=await newPhone.load(uid),newMs=Date.now()-t3;
      complete(c3,count,TOTAL);assert.equal(strip(c3.model),strip(a.model),'summary career = full read career');
      assert.equal(newPhone.log.length,indexDocs+count,'new phone reads the index plus one summary per game');
      assert.ok(newPhone.log.every(ref=>ref.startsWith(`accounts/${uid}/`)),'a new phone never touches a game document');
      assert.equal(newPhone.writes.length,0);
      const again=page(docs,fresh);await again.load(uid);assert.equal(again.log.length,indexDocs,'after one open the new phone is a known phone');
      // 4. Same page, second visit: the in-memory cache, index head only (unchanged from r85).
      const before=known.log.length;complete(await known.load(uid),count,TOTAL);assert.equal(known.log.length-before,1,'warm visit rechecks the index head only');
      const bytes=Object.entries(docs).filter(([k])=>k.startsWith(`accounts/${uid}/careerSummary/`)).reduce((n,[,v])=>n+Buffer.byteLength(JSON.stringify(v)),0);
      const phoneBytes=[...phone.data.values()].reduce((n,v)=>n+Buffer.byteLength(JSON.stringify(v)),0);
      if(uid===accounts[0])Object.assign(row,{index:indexDocs,first:first.log.length,firstWrites:first.writes.length,known:knownGets,newPhone:newPhone.log.length,today:indexDocs+count*(2+4*TOTAL),firebaseKB:Math.round(bytes/1024),phoneKB:Math.round(phoneBytes/1024),firstMs,knownMs,newMs});
    }
    results.push(row);
  }
  console.log('games x10 seasons | today per open | first r86 open (once) | known phone | new phone (once) | summary KB per manager | phone KB | known-phone load ms');
  for(const r of results)console.log(`${r.count} | ${r.today} | ${r.first} reads + ${r.firstWrites} writes | ${r.known} | ${r.newPhone} | ${r.firebaseKB} | ${r.phoneKB} | ${r.knownMs}`);
  fs.mkdirSync(path.join(ROOT,'test-results'),{recursive:true});
  fs.writeFileSync(path.join(ROOT,'test-results','r86-career-summary-scale.json'),JSON.stringify(results,null,2));
  console.log(`PASS r86 career summary scale contracts: ${counts.join('/')} ten-season Showdowns x both managers; known phone = index only, new phone = index + 1 per game, one summary write per game, careers identical.`);
})().catch(error=>{console.error(error);process.exit(1);});

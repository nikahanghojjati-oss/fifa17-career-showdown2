'use strict';
// JOB-15 / JOB-8 F2: fresh page -> one career visit -> warm visit -> reload.
// Real index, completed reader, integrity checks, adapter and career model; only SDK IO is fake.
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
  root.contentHash='sha256:' +createHash('sha256').update(JSON.stringify(canonical({objectType:'rivalry',objectId:rid(n),revision:root.revision,data:root.data}))).digest('hex');
  return docs;
}
const base=game(1)['rivalries/'+rid(1)];
const accounts=base.data.managerSlots.map(s=>s.accountId);
const envelope=(type,id,data)=>({schemaVersion:1,objectType:type,objectId:id,revision:0,lifecycleState:'live',contentHash:'sha256:fixture',data});
function page(docs,uid,{pause=false}={}){
  const db={},log=[],releases=[];let active=0,peak=0;
  const sdk={doc:(_db,...p)=>p.join('/'),getDoc:async ref=>{
    log.push(ref);active++;peak=Math.max(peak,active);
    try{
      if(pause&&ref.startsWith('rivalries/'))await new Promise(resolve=>releases.push(resolve));
      else await new Promise(resolve=>setImmediate(resolve));
      const value=docs[ref];return {exists:()=>value!==undefined,data:()=>value};
    }finally{active--;}
  }};
  const c=vm.createContext({console,TextEncoder,crypto:webcrypto});
  vm.runInContext(read('js/persistentNikDanielPair.js'),c);
  for(const [key,file] of Object.entries({CareerModeSparkCompletedShowdownReader:'sparkCompletedShowdownReader',CareerModeSharedClosedShowdownAdapter:'sharedClosedShowdownAdapter',CareerModeSharedCareerAnalytics:'sharedCareerAnalytics'}))c[key]=require(path.join(ROOT,'js',file+'.js'));
  vm.runInContext(read('js/sparkClosedShowdownCareerLoader.js'),c);
  const options={firestore:db,firebaseSdk:sdk,user:{uid},cryptoImpl:webcrypto};
  return {c,log,releases,options,resume:()=>{pause=false;releases.splice(0).forEach(resolve=>resolve());},peak:()=>peak,load:extra=>c.CareerModeSparkClosedShowdownCareerLoader.loadClosedShowdownCareer({...options,...extra})};
}
function index(docs,uid,ids){docs[`accounts/${uid}/careerIndex/current`]=envelope('careerIndex','current',{rivalryIds:ids,sealedPageCount:0});}
function complete(result,count,total=1){
  assert.equal(result.status,'ready');
  assert.equal(result.model.coverage.readable,count);
  assert.equal(result.model.history.showdowns.length,count,'History / Legacy contains every finished Showdown');
  assert.equal(result.model.managers.daniel.careerPoints,5*count*total,'Career Statistics totals');
  assert.equal(result.model.managers.nik.careerPoints,count*total);
  assert.equal(result.model.managers.daniel.seasons,count*total);
  for(const row of result.model.history.showdowns){assert.equal(row.status,'completed');assert.equal(row.seasons.length,total);}
}
async function archives(){
  for(const count of [1,10,100])for(const uid of accounts){
    const docs=Object.assign({},...Array.from({length:count},(_,i)=>game(i+1)));
    index(docs,uid,Array.from({length:count},(_,i)=>rid(i+1)));
    const ticks=[],first=page(docs,uid),result=await first.load({onProgress:tick=>ticks.push(tick)});complete(result,count);
    // r86 (S61-r85-04): one progress tick at the index, then one per Showdown read, ending at total; red team #10: plus one
    // per season read inside each full read (same count), so one long Showdown keeps History's inactivity limit alive.
    assert.equal(ticks.length,1+count*2);assert.equal(JSON.stringify(ticks[0]),JSON.stringify({done:0,total:count}));assert.equal(JSON.stringify(ticks.at(-1)),JSON.stringify({done:count,total:count}));
    assert.ok(ticks.every((t,i)=>t.total===count&&(i===0||t.done===ticks[i-1].done||t.done===ticks[i-1].done+1)),'progress counts up by one');
    assert.equal(first.log.length,1+6*count,'cold loads verify every required source document');
    assert.ok(first.peak()>1,'a cold career must not fetch every season document serially');
    assert.ok(first.peak()<=12,'bounded cold reads: at most 3 Showdowns x 4 documents');
    const reads=first.log.length;
    complete(await first.load(),count);
    assert.equal(first.log.length-reads,1,'warm visit rechecks the mutable index head only');
    // Real data changes on the other phone must be discovered by this page.
    Object.assign(docs,game(count+1));index(docs,uid,Array.from({length:count+1},(_,i)=>rid(i+1)));
    complete(await first.load(),count+1);
    const reloaded=page(docs,uid);complete(await reloaded.load(),count+1);
    assert.ok(reloaded.peak()>1,'fresh-page loads retain bounded concurrency');
    assert.deepEqual(JSON.parse(JSON.stringify((await first.load()).model)),JSON.parse(JSON.stringify((await reloaded.load()).model)),'both cached and reloaded screens converge');
  }
}
async function sealedPages(){
  const uid=accounts[0],docs={};
  const ids=Array.from({length:500},(_,i)=>rid(i+1));
  docs[`accounts/${uid}/careerIndex/page_1`]=envelope('careerIndexPage','page_1',{pageNumber:1,rivalryIds:ids});
  docs[`accounts/${uid}/careerIndex/current`]=envelope('careerIndex','current',{rivalryIds:[rid(501)],sealedPageCount:1});
  const p=page(docs,uid),pair=p.c.CareerModePersistentNikDanielPair;
  const opts={...p.options,accountId:uid};
  assert.equal((await pair.readCareerIndex(opts)).rivalryIds.length,501);
  assert.equal((await pair.readCareerIndex(opts)).rivalryIds.length,501);
  assert.equal(p.log.filter(x=>x.endsWith('/page_1')).length,1,'immutable sealed page is read once per account/page');
  docs[`accounts/${uid}/careerIndex/current`].data.rivalryIds.push(rid(502));
  assert.equal((await pair.readCareerIndex(opts)).rivalryIds.length,502,'head remains fresh');
  const other=accounts[1];index(docs,other,[rid(900)]);
  assert.deepEqual(Array.from((await pair.readCareerIndex({...opts,accountId:other})).rivalryIds),[rid(900)],'other account never receives cached pages');
}
async function navigation(){
  const uid=accounts[0],docs=Object.assign({},...Array.from({length:10},(_,i)=>game(i+1)));
  index(docs,uid,Array.from({length:10},(_,i)=>rid(i+1)));
  const p=page(docs,uid,{pause:true});let visible=true;
  const loading=p.load({shouldContinue:()=>visible});
  while(!p.releases.length)await new Promise(resolve=>setImmediate(resolve));
  visible=false;p.resume();
  const result=await loading;
  assert.ok(['partial','unavailable'].includes(result.status),'cancelled traversal never presents a shorter complete career');
  assert.ok(p.log.filter(x=>x.startsWith('rivalries/')).length<=3,'leaving stops queued detail reads');
  // A real reopen must retry; cancellation is not a terminal cached result.
  visible=true;
  // Reopen this same runtime after resuming SDK IO.
  complete(await p.load(),10);
}
async function integrityAndInvitations(){
  for(const total of [3,5,10])for(const uid of accounts){
    const docs=game(1,total);index(docs,uid,[rid(1)]);
    const p=page(docs,uid);complete(await p.load(),1,total);
    const missing=`rivalries/${rid(1)}/seasonResults/season_${total}/roles/playerTwo`;
    const value=docs[missing];delete docs[missing];
    const reload=page(docs,uid),partial=await reload.load();
    assert.equal(partial.status,'partial','a missing last-season role cannot shorten a finished Showdown');
    assert.equal(partial.model.managers.daniel.careerPoints,0,'unverified seasons never count');
    docs[missing]=value;complete(await reload.load(),1,total);
  }
  const uid=accounts[0],docs=game(1),root=docs['rivalries/'+rid(1)];
  delete root.data.terminalClose;delete root.data.terminalProgress;
  root.data.connectionState='pending-pair';root.data.createdByAccountId=uid;root.data.authorizedAccountIds=[uid];
  root.data.managerSlots[1]={...root.data.managerSlots[1],accountId:null,profileId:null,saveId:null,entitlementState:'open'};
  root.contentHash='sha256:'+createHash('sha256').update(JSON.stringify(canonical({objectType:'rivalry',objectId:rid(1),revision:root.revision,data:root.data}))).digest('hex');
  index(docs,uid,[rid(1)]);
  const p=page(docs,uid);
  assert.equal((await p.load()).status,'empty','unused code adds no career totals');
  assert.equal((await p.load()).status,'empty');
  assert.equal(p.log.filter(x=>x==='rivalries/'+rid(1)).length,2,'an unused invitation can still be joined: never freeze its status');
  Object.assign(docs,game(1));complete(await p.load(),1);
  // A replaced/expired code actually closed by the provider cannot be joined later.
  const closed={...root,objectId:rid(2),data:{...root.data,connectionState:'closed'}};
  closed.contentHash='sha256:'+createHash('sha256').update(JSON.stringify(canonical({objectType:'rivalry',objectId:rid(2),revision:closed.revision,data:closed.data}))).digest('hex');
  docs['rivalries/'+rid(2)]=closed;index(docs,uid,[rid(1),rid(2)]);
  complete(await p.load(),1);complete(await p.load(),1);
  assert.equal(p.log.filter(x=>x==='rivalries/'+rid(2)).length,1,'closed unused codes are immutable and need no warm reread');
}
async function concurrentConsumers(){
  const uid=accounts[0],docs=Object.assign({},game(1),game(2),game(3),game(4));index(docs,uid,[1,2,3,4].map(rid));
  const p=page(docs,uid,{pause:true});let visible=true;
  const a=p.load({shouldContinue:()=>visible}),b=p.load();
  while(p.releases.length<3)await new Promise(resolve=>setImmediate(resolve));
  await new Promise(resolve=>setImmediate(resolve));
  visible=false;p.resume();
  const [left,right]=await Promise.all([a,b]);
  assert.equal(left.status,'partial','one consumer can leave while the other finishes');complete(right,4);
  assert.ok(p.peak()<=12,'concurrent career consumers share one bounded queue');
  for(let i=1;i<=4;i++)assert.equal(p.log.filter(x=>x==='rivalries/'+rid(i)).length,1,'concurrent consumers share each verified record');
}
async function reopenDuringCancellation(){
  const uid=accounts[0],docs=game(1);index(docs,uid,[rid(1)]);
  const p=page(docs,uid);let visible=true,release;
  p.options.firebaseSdk.getDoc=async ref=>{
    p.log.push(ref);
    if(ref.endsWith('/seasonResults/season_1')&&visible){
      // Navigation after the first get in a season batch; its siblings are cancelled.
      visible=false;await new Promise(resolve=>{release=resolve;});
    }
    const value=docs[ref];return {exists:()=>value!==undefined,data:()=>value};
  };
  const old=p.load({shouldContinue:()=>visible});
  while(!release)await new Promise(resolve=>setImmediate(resolve));
  const fresh=p.load();await new Promise(resolve=>setImmediate(resolve));release();
  assert.equal((await old).status,'partial');
  complete(await fresh,1);
}
async function screenLifetime(){
  let mounted=true,shows=0,loadOptions,finish;
  const definitions=new Map(),host={dataset:{},innerHTML:'',querySelector:()=>null};
  const c=vm.createContext({console,TextEncoder,setTimeout,clearTimeout,
    document:{getElementById:id=>id==='legacy'?host:null},
    CareerModeCareerScreenSeam:require('../../js/careerScreenSeam.js'),
    CareerModeOnlinePlayerIdentity:{getState:()=>({status:'ready',registered:true,managerId:'daniel'})},
    CareerModeSparkConnectedAccount:{getState:()=>({connected:true,accountId:accounts[0]})},
    CareerModePersistentNikDanielPair:{getState:()=>({rivalryId:null})},
    CareerModeSharedActiveShowdownAdapter:{buildActiveShowdownViews:()=>({careerInput:{}})},
    CareerModeCareerStartMarker:{readMarker:async()=>({status:'ready',hiddenRivalryIds:[]}),hiddenRivalryIds:()=>[],epoch:()=>0},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:accounts[0]}},firestore:{},firestoreSdk:{getDoc(){}}})},
    CareerModeSparkClosedShowdownCareerLoader:{loadClosedShowdownCareer:(options,shouldContinue)=>{loadOptions={...options,shouldContinue};return new Promise(resolve=>{finish=resolve;});}},
    CareerModeV10Screens:{install(){return this;},register:(id,def)=>definitions.set(id,def),isMounted:()=>mounted,invalidate(){},show:async()=>{shows++;return true;}},
    loadRuntimeScript:async()=>{},fetch:async()=>({ok:true,json:async()=>({})})
  });
  vm.runInContext(read('js/rivalryLegacyV10.js'),c);
  const opening=c.CareerModeRivalryLegacyV10.mount('legacy');
  while(!finish)await new Promise(resolve=>setImmediate(resolve));
  assert.equal(loadOptions.shouldContinue(),true);
  mounted=false;definitions.get('legacy').unmount(host);assert.equal(loadOptions.shouldContinue(),false,'the real History screen passes its navigation lifetime to the loader');
  const before=shows;finish({model:{status:'partial'}});await opening;
  assert.equal(shows,before,'an abandoned request cannot reopen History after navigation');
  assert.equal(c.CareerModeRivalryLegacyV10.cachedCareerModel(),null,'cancelled history is never published to Stats or Trophy Room');
}
async function reopenAfterLeaving(){
  // Codex #985: leaving History mid-load and opening it again before the old reads settle must still load History.
  let mounted=true,loads=0;const finishes=[];
  const definitions=new Map(),host={dataset:{},innerHTML:'',querySelector:()=>null};
  const c=vm.createContext({console,TextEncoder,setTimeout,clearTimeout,
    document:{getElementById:id=>id==='legacy'?host:null},
    CareerModeCareerScreenSeam:require('../../js/careerScreenSeam.js'),
    CareerModeOnlinePlayerIdentity:{getState:()=>({status:'ready',registered:true,managerId:'daniel'})},
    CareerModeSparkConnectedAccount:{getState:()=>({connected:true,accountId:accounts[0]})},
    CareerModePersistentNikDanielPair:{getState:()=>({rivalryId:null})},
    CareerModeSharedActiveShowdownAdapter:{buildActiveShowdownViews:()=>({careerInput:{}})},
    CareerModeCareerStartMarker:{readMarker:async()=>({status:'ready',hiddenRivalryIds:[]}),hiddenRivalryIds:()=>[],epoch:()=>0},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:accounts[0]}},firestore:{},firestoreSdk:{getDoc(){}}})},
    CareerModeSparkClosedShowdownCareerLoader:{loadClosedShowdownCareer:()=>{loads++;return new Promise(resolve=>finishes.push(resolve));}},
    CareerModeV10Screens:{install(){return this;},register:(id,def)=>definitions.set(id,def),isMounted:()=>mounted,invalidate(){},show:async()=>true},
    loadRuntimeScript:async()=>{},fetch:async()=>({ok:true,json:async()=>({})})
  });
  vm.runInContext(read('js/rivalryLegacyV10.js'),c);
  const opening=c.CareerModeRivalryLegacyV10.mount('legacy');
  while(!finishes.length)await new Promise(resolve=>setImmediate(resolve));
  mounted=false;definitions.get('legacy').unmount(host);
  mounted=true;const reopening=c.CareerModeRivalryLegacyV10.mount('legacy');
  finishes[0]({model:{status:'partial'}});await opening;await reopening;
  const deadline=Date.now()+5000;
  while(loads<2&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,50));
  assert.equal(loads,2,'reopened History starts a fresh load once the departed one drains');
}
async function statsAndTrophyLifetime(){
  for(const screen of ['careerStatistics','trophyRoom']){
    const definitions=new Map();let interested,finish,hidden=false;
    const c=vm.createContext({console,document:{getElementById:()=>({classList:{contains:()=>hidden}})},
      CareerModeCareerScreenSeam:require('../../js/careerScreenSeam.js'),
      CareerModeOnlinePlayerIdentity:{getState:()=>({status:'ready',registered:true,managerId:'daniel'})},
      CareerModeV10Screens:{install(){return this;},register:(id,def)=>definitions.set(id,def),isMounted:()=>false,show:async()=>true},
      CareerModeRivalryLegacyV10:{cachedCareerModel:()=>null,loadCareerModel:callback=>{interested=callback;return new Promise(resolve=>{finish=resolve;});}},
      loadRuntimeScript:async()=>{}
    });
    vm.runInContext(read('js/careerScreensV10.js'),c);
    await c.CareerModeCareerScreensV10.mount(screen,()=>null);
    while(!finish)await new Promise(resolve=>setImmediate(resolve));
    assert.equal(interested(),true,screen+': preparing a screen must not cancel its own cold load');
    hidden=true;assert.equal(interested(),false,screen+': navigation during screen preparation cancels reads');
    hidden=false;definitions.get(screen).unmount();
    assert.equal(interested(),false,screen+': unmount cancels further archive reads');finish();
  }
}
(async()=>{
  await archives();await sealedPages();await navigation();await integrityAndInvitations();await concurrentConsumers();await reopenDuringCancellation();await screenLifetime();await reopenAfterLeaving();await statsAndTrophyLifetime();
  console.log('PASS r83 cold career: 1/10/100 Showdowns; 1/3/5/10 seasons; both managers; reload/warm/new finish; missing-season retry; unused invitation; sealed-page reuse; concurrent consumers; navigation cancellation.');
})().catch(error=>{console.error(error);process.exitCode=1;});

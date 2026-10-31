#!/usr/bin/env node
'use strict';
// r87 career fixes (red team lanes A and B, 2026-10-31): B1 History & Backup, B2 pair change mid-load, B3 Golden draw paper,
// B4 ended-early-only career, B5 records nobody holds, A-03 IndexedDB timeout, A-04 UTC ended-early date, A-05 coverage
// without the live Showdown, A-08 plain timeout wording and self-retry, and History opening on the newest Showdown.
// Real modules in Node (vm where the browser binding is needed); only Firestore, IndexedDB, screen infrastructure and the
// clock are faked. The layout items (A-01, A-06, A-07, the long-career pager) are in r87-career-fixes-browser-contracts.cjs.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {spawnSync}=require('node:child_process');
const {webcrypto}=require('node:crypto');
const ROOT=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const History=require(path.join(ROOT,'js/sharedHistoryConvergence.js'));
const Career=require(path.join(ROOT,'js/sharedCareerAnalytics.js'));
const Seam=require(path.join(ROOT,'js/careerScreenSeam.js'));
const V10=require(path.join(ROOT,'js/careerScreensV10.js'));
const RL=require(path.join(ROOT,'js/rivalryLegacyV10.js'));
const {score,winner,result}=require(path.join(ROOT,'tests/support/career-fixture-helpers.cjs'));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
let passed=0;const groups=[];
const check=(name,run)=>groups.push([name,run]);

// ---- fixtures: verified projections through the real History verifier and the real career model ----
const hash=n=>'sha256:'+String(n).padStart(64,'0');
const PERFECT=result({leaguePosition:1,leaguePoints:101,leagueGoals:100,championsLeague:true,domesticCup:true,topScorer:true,topAssist:true}); // 11
const CL=result({championsLeague:true}),Z=result({leaguePosition:9});
const idFor=n=>'pair_'+(0xd0000+n).toString(16).padStart(64,'0');
function projectionFor(rivalryId,totalSeasons,seasons){
  return History.buildProjection({rivalryId,setup:{phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',totalSeasons,leagueId:'premier_league',clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'}},
    managerSlots:[{slotId:'playerOne',accountId:'acct_daniel',profileId:'profile_'+'a'.repeat(24),saveId:'save_'+'a'.repeat(24),entitlementState:'active'},{slotId:'playerTwo',accountId:'acct_nik',profileId:'profile_'+'b'.repeat(24),saveId:'save_'+'b'.repeat(24),entitlementState:'active'}],
    seasons:seasons.map(([p1,p2],i)=>{const n=i+1,h=hash(n);return {commit:{ok:true,committed:true,phase:'ACKNOWLEDGED',revision:3,resultsRevision:2,resultsContentHash:h,seasonNumber:n,results:{playerOne:p1,playerTwo:p2}},scoring:{ok:true,authoritative:true,phase:'SCORING_RECONCILED',revision:1,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:h,seasonNumber:n,scoring:{playerOne:score(p1),playerTwo:score(p2)},winner:winner(p1,p2)}};})});
}
const finalFor=p=>{const a=p.managerRecords.playerOne.totalPoints,b=p.managerRecords.playerTwo.totalPoints;return {totals:{playerOne:a,playerTwo:b},winner:a>b?'playerOne':b>a?'playerTwo':'draw'};};
function completed(n,totalSeasons,seasons){const p=projectionFor(idFor(n),totalSeasons,seasons);return {rivalryId:idFor(n),classification:'completed',projection:p,final:finalFor(p)};}
function active(n,seasons){const p=projectionFor(idFor(n),3,seasons);return {rivalryId:idFor(n),classification:'active',projection:p,final:null};}
const abandoned=(n,endedAt=Date.parse('2026-10-30T22:45:00Z'),seasonsPlayed=2)=>({rivalryId:idFor(n),classification:'abandoned',projection:null,final:null,ended:{endedAt,seasonsPlayed}});
const unavailable=n=>({rivalryId:idFor(n),classification:'unavailable',projection:null,final:null});
const model=showdowns=>Career.buildCareerModel({indexStatus:'ready',showdowns});

// ---- B3: a 110-110 ten-season draw gets the Golden paper, told as a draw ----
check('B3 a 110-110 Golden draw prints the Golden edition as a draw, with no winner and no tiebreak wording',()=>{
  const ctx={console};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
  for(const file of ['data/gazetteCopy.js','data/frontPages.js','js/touchlineGazette.js'])if(fs.existsSync(path.join(ROOT,file)))vm.runInContext(read(file),ctx,{filename:file});
  const G=ctx.CareerModeTouchlineGazette||require(path.join(ROOT,'js/touchlineGazette.js'));
  const p=projectionFor(idFor(1),10,Array.from({length:10},()=>[PERFECT,PERFECT]));
  assert.equal(p.managerRecords.playerOne.totalPoints,110);assert.equal(p.managerRecords.playerTwo.totalPoints,110);
  assert.deepEqual(Seam.goldenShowdownManagers({status:'completed',totalSeasons:10,seasonsPlayed:10,totals:{daniel:110,nik:110}}),['daniel','nik'],'the seam: Golden for both');
  const edition=G.finalEdition({projection:p,final:{winner:'draw',totals:{daniel:110,nik:110}}});
  assert.ok(edition,'the final paper prints');
  assert.equal(edition.golden,true,'the Gazette agrees with every other career screen');
  assert.equal(edition.paper.variant,'gold');assert.equal(edition.paper.photo.name,'GZ_LEAD_GOLD');
  assert.equal(edition.winner,'draw');assert.equal(edition.situation,'showdown-drawn','told with the drawn pages');
  assert.equal(edition.paper.kicker,'GOLDEN DRAW');assert.equal(edition.paper.dateline,'Golden edition');assert.equal(edition.paper.numbersTitle,'The Golden Showdown');
  assert.equal(edition.paper.portrait,null,'no winner portrait');
  const words=[edition.paper.headline,edition.paper.subhead,edition.paper.kicker,...edition.paper.story.paragraphs,...edition.paper.briefs.map(b=>b.head+' '+b.text)].join(' ');
  assert.doesNotMatch(words,/tie-?break|first to|reach(es|ed)? .*first|wins the Golden/i,'a draw: no tiebreak, nobody first');
  // a 110 win is unchanged, and a 109-109 draw is an ordinary draw
  const win=G.finalEdition({projection:projectionFor(idFor(2),10,Array.from({length:10},(_,i)=>[PERFECT,i?PERFECT:CL]))});
  assert.equal(win.golden,true);assert.equal(win.situation,'golden-showdown-won');
  const nearly=G.finalEdition({projection:projectionFor(idFor(3),10,Array.from({length:10},(_,i)=>i?[PERFECT,PERFECT]:[CL,CL]))});
  assert.equal(nearly.golden,false);assert.equal(nearly.paper.variant,'draw');
});

// ---- B4: a career of only ended-early Showdowns is the empty state ----
check('B4 a career whose only Showdowns ended early shows Career Statistics and Trophy Room empty, not #1 at 0-0',()=>{
  const m=model([abandoned(1),abandoned(2)]);
  assert.equal(m.status,'ready','the model still lists both rows for History');
  const fresh=model([]);assert.equal(fresh.status,'empty');
  for(const screen of ['careerStatistics','trophyRoom']){
    const frame=V10.toV10Frame(m,screen),newCareer=V10.toV10Frame(fresh,screen);
    assert.equal(frame.status,'empty',`${screen} is the new-career empty state`);
    assert.deepEqual(JSON.parse(JSON.stringify(frame)),JSON.parse(JSON.stringify(newCareer)),`${screen}: the same frame as a brand-new career (no table, no leader cards)`);
    assert.equal(frame.expectedCareerTableRows,undefined,`${screen}: no crowns, no ranks`);
  }
  const legacy=RL.toV10Frame(m,'legacy');
  assert.deepEqual(legacy.showdowns.map(r=>r.status),['abandoned','abandoned'],'History still lists them as their own cards');
  // one finished Showdown is a real career again
  assert.equal(V10.toV10Frame(model([abandoned(1),completed(2,1,[[CL,Z]])]),'careerStatistics').status,'ready');
});

// ---- B5: a record nobody holds is a dash, never "0 Shared" ----
check('B5 Trophy Room shows no holder ("—") for a record nobody holds, never "0 Shared"',()=>{
  const m=model([completed(1,1,[[Z,Z]])]);
  const byLabel=Object.fromEntries(m.trophyRoom.records.map(r=>[r.label,r]));
  for(const label of ['Highest season score','Most perfect seasons'])if(byLabel[label]){assert.equal(byLabel[label].value,null,`${label}: no best at 0`);}
  const frame=V10.toV10Frame(m,'trophyRoom');
  assert.ok(frame.records.length>=4);
  for(const record of frame.records){
    assert.ok(!(record.manager==='shared'&&record.value===0),`${record.label}: never 0 Shared`);
    if(record.value==='—')assert.equal(record.manager,'','no holder named');
  }
  assert.ok(frame.records.some(r=>/PERFECT/.test(r.label)&&r.value==='—'),'MOST PERFECT SEASONS reads —');
  assert.ok(frame.records.some(r=>/SEASON SCORE/.test(r.label)&&r.value==='—'),'HIGHEST SEASON SCORE reads — after a 0-0');
  // a record somebody holds is unchanged
  const held=V10.toV10Frame(model([completed(2,1,[[PERFECT,Z]])]),'trophyRoom');
  assert.ok(held.records.some(r=>/PERFECT/.test(r.label)&&r.value===1&&r.manager==='daniel'));
});

// ---- A-04: the ended-early date is the same on both phones ----
check('A-04 the ended-early date is the UTC day on every phone (London and Tehran agree)',()=>{
  const code=`const S=require(${JSON.stringify(path.join(ROOT,'js/careerScreenSeam.js'))});process.stdout.write(S.endedEarlyText({endedAt:Date.parse('2026-10-30T22:45:00Z'),seasonsPlayed:2}));`;
  const out=['Europe/London','Asia/Tehran','America/Los_Angeles','Pacific/Kiritimati'].map(TZ=>spawnSync(process.execPath,['-e',code],{env:{...process.env,TZ},encoding:'utf8'}).stdout);
  assert.deepEqual(new Set(out).size,1,out.join(' | '));
  assert.equal(out[0],'Ended early · 30 Oct 2026 · 2 seasons');
});

// ---- A-05: the partial banner counts finished Showdowns only ----
check('A-05 the partial banner does not count the live Showdown History never lists',()=>{
  const m=model([completed(1,1,[[CL,Z]]),completed(2,1,[[Z,CL]]),unavailable(3),active(4,[[CL,Z]])]);
  assert.equal(m.status,'partial');
  assert.deepEqual(m.coverage,{readable:2,indexed:3},'"Showing 2 of 3", not "3 of 4" above 2 cards');
  const frame=RL.toV10Frame(m,'legacy');
  assert.equal(frame.showdowns.length,2);assert.deepEqual(frame.coverage,{readable:2,indexed:3});
  assert.equal(frame.coverage.readable,frame.showdowns.length,'the count matches the cards');
});

// ---- History opens on the newest Showdown (Nik 2026-10-31) ----
check('History keeps oldest-to-newest order but opens on the newest Showdown (its page on desktop, its card on a phone)',()=>{
  const rows=Array.from({length:30},(_,i)=>completed(i+1,1,[[i%2?CL:Z,i%2?Z:CL]]));
  const frame=RL.toV10Frame(model(rows),'legacy');
  assert.deepEqual(frame.showdowns.map(r=>r.number).slice(0,3),[1,2,3],'order unchanged');
  assert.equal(frame.ui.selectedShowdown,30,'the newest is selected');
  assert.equal(frame.ui.page,8,'desktop opens on the last page (30 Showdowns, 4 per page)');
  const withEnded=RL.toV10Frame(model([completed(1,1,[[CL,Z]]),abandoned(2)]),'legacy');
  assert.equal(withEnded.ui.selectedShowdown,2,'a newest Ended early Showdown is the one shown');
});

// ---- A-03: an IndexedDB open that never answers does not stall career opens ----
check('A-03 the phone copy lookup gives up after about 2 s, falls through to the Firebase summary, and the hung open is not kept',async()=>{
  const Store=require(path.join(ROOT,'js/careerSummaryStore.js'));Store.forgetPhoneCopies();
  assert.ok(Store.phoneTimeoutMs>=1000&&Store.phoneTimeoutMs<=3000,'about 2 s');
  const state={status:'abandoned',rivalryId:idFor(9),ended:{endedAt:1,seasonsPlayed:1}};
  const payload=JSON.stringify(state);
  const bytes=new Uint8Array(await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(payload)));
  const payloadHash='sha256:'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  const doc={schemaVersion:Store.readerVersion,objectType:'careerSummary',rivalryId:idFor(9),status:'abandoned',totalSeasons:null,managerTotals:null,winner:null,payload,payloadHash};
  let gets=0,opens=0;
  const hung={open(){opens++;return {};}}; // never fires success, error or blocked
  const sdk={doc:(...parts)=>parts.slice(1).join('/'),getDoc:async()=>{gets++;return {exists:()=>true,data:()=>doc};}};
  const options={firestore:{},firebaseSdk:sdk,uid:'uid-nik',rivalryId:idFor(9),cryptoImpl:webcrypto,phoneStorage:hung};
  const started=Date.now();
  const first=await Promise.race([Store.loadSummary(options),new Promise(resolve=>setTimeout(()=>resolve('stalled'),6000))]);
  assert.notEqual(first,'stalled','the lookup must not wait forever');
  assert.equal(first.source,'firebase');assert.equal(first.state.status,'abandoned');assert.equal(gets,1,'one exact get, as a phone without a copy');
  assert.ok(Date.now()-started<4000,'gave up after about 2 s');
  const again=Date.now();
  const second=await Promise.race([Store.loadSummary(options),new Promise(resolve=>setTimeout(()=>resolve('stalled'),6000))]);
  assert.notEqual(second,'stalled','a reopen on the same page does not wait on the hung promise');
  assert.equal(second.source,'firebase');assert.ok(Date.now()-again<1000,'no second 2 s wait while the hung open is pending');
  Store.forgetPhoneCopies();
});

// ---- B2 + A-08: the browser binding, run in a vm with the real rivalryLegacyV10.js and careerScreensV10.js ----
function harness({legacy=false}={}){
  let pair={status:'paired',rivalryId:'pair_'+'a'.repeat(64),closedRivalryId:null},hidden=false;
  const loads=[],definitions=new Map(),frames=[],errors=[],timers=new Map(),listeners={},docListeners={};let now=0,nextTimer=0;
  const host={dataset:{},innerHTML:'',classList:{contains:()=>false},querySelector:()=>null,setAttribute(){}};
  const fixture=JSON.parse(read('tests/fixtures/data-contract-v1/finished-three-seasons.json')).career;
  const c=vm.createContext({console,TextEncoder,crypto:webcrypto,Date:class extends Date{static now(){return now;}},
    setTimeout(fn,delay){const id=++nextTimer;timers.set(id,{fn,at:now+delay});return id;},clearTimeout:id=>timers.delete(id),
    document:{getElementById:id=>id==='legacy'?host:null,createElement(){return {style:{},addEventListener(type,fn){this[type]=fn;}};},get visibilityState(){return hidden?'hidden':'visible';},addEventListener:(type,fn)=>{(docListeners[type]??=[]).push(fn);}},
    CareerModeCareerScreenSeam:Seam,
    CareerModeOnlinePlayerIdentity:{getState:()=>({status:'ready',registered:true,managerId:'nik'})},
    CareerModeSparkConnectedAccount:{getState:()=>({connected:true,accountId:'acct_nik'})},
    CareerModePersistentNikDanielPair:{getState:()=>pair},
    CareerModeSharedActiveShowdownAdapter:{buildActiveShowdownViews:()=>({careerInput:{}})},
    CareerModeCareerStartMarker:{readMarker:async()=>({status:'ready',hiddenRivalryIds:[]}),hiddenRivalryIds:()=>[],epoch:()=>0},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:'acct_nik'}},firestore:{},firestoreSdk:{getDoc(){}}})},
    CareerModeSparkClosedShowdownCareerLoader:{loadClosedShowdownCareer:(options,canPublish)=>new Promise(resolve=>loads.push({resolve,options,canPublish}))},
    CareerModeV10Screens:{install(){return this;},register:(id,def)=>definitions.set(id,def),isMounted:id=>legacy?id==='legacy':id==='careerStatistics',invalidate(){},
      async show(id){const def=definitions.get(id);if(!def)return false;if(def.prepare)await def.prepare();const frame=def.frame();frames.push({id,frame});if(def.mount&&legacy)def.mount(frame,host);return true;}},
    ShowdownLegacyBoot(){},renderLegacy(){},loadRuntimeScript:async()=>{},fetch:async()=>({ok:true,json:async()=>({})}),
    reportApplicationError:(_context,error)=>errors.push(error),
    CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}}
  });
  c.addEventListener=(type,fn)=>{(listeners[type]??=[]).push(fn);};c.dispatchEvent=event=>{(listeners[event.type]||[]).forEach(fn=>fn(event));return true;};
  c.window=c;c.globalThis=c;
  vm.runInContext(read('js/rivalryLegacyV10.js'),c,{filename:'js/rivalryLegacyV10.js'});
  vm.runInContext(read('js/careerScreensV10.js'),c,{filename:'js/careerScreensV10.js'});
  async function advance(ms){const target=now+ms;await tick();for(;;){const entry=[...timers].filter(([,t])=>t.at<=target).sort((a,b)=>a[1].at-b[1].at)[0];if(!entry)break;now=entry[1].at;timers.delete(entry[0]);entry[1].fn();await tick();await tick();}now=target;for(let i=0;i<10;i++)await tick();}
  const settle=async()=>{for(let i=0;i<30;i++)await tick();};
  return {c,loads,definitions,frames,errors,advance,settle,fixture,
    endShowdown(){pair={status:'unpaired',rivalryId:null,closedRivalryId:pair.rivalryId};},
    hide(){hidden=true;},show(){hidden=false;(docListeners.visibilitychange||[]).forEach(fn=>fn({}));},online(){(listeners.online||[]).forEach(fn=>fn({}));},
    finish:async(i)=>{loads[i].resolve({model:fixture,careerInput:{indexStatus:'ready',showdowns:[]}});await settle();}};
}
check('B2 a pair change while Career Statistics loads runs the load once more and shows the career, never a stuck UNAVAILABLE',async()=>{
  const h=harness();
  const opening=h.c.CareerModeCareerScreensV10.mount('careerStatistics',()=>null);
  await h.settle();assert.equal(h.loads.length,1);
  h.endShowdown(); // the other phone ends the live Showdown: rivalryId -> null, closedRivalryId -> the old id
  await h.finish(0);
  assert.equal(h.loads.length,2,'retried once under the new pair state');
  await h.finish(1);await opening;await h.settle();
  const cached=h.c.CareerModeRivalryLegacyV10.cachedCareerModel();
  assert.ok(cached&&cached.status==='ready','the finished career is kept for the new key');
  const frame=h.definitions.get('careerStatistics').frame();
  assert.equal(frame?.status,'ready','Career Statistics shows the career');
  assert.equal(h.loads.length,2,'only one retry');
});
check('B2 History on the same race also shows the career',async()=>{
  const h=harness({legacy:true});
  const opening=h.c.CareerModeRivalryLegacyV10.mount('legacy',()=>null);
  await h.settle();assert.equal(h.loads.length,1);
  h.endShowdown();await h.finish(0);assert.equal(h.loads.length,2);await h.finish(1);await opening;await h.settle();
  const last=h.frames.filter(f=>f.id==='legacy').at(-1).frame;
  assert.equal(last.status,'ready','History draws the career, not UNAVAILABLE');
});
check('A-08 a timed-out History says so in plain words and loads again by itself when the page is shown or back online',async()=>{
  const h=harness({legacy:true});
  const opening=h.c.CareerModeRivalryLegacyV10.mount('legacy',()=>null);
  await h.settle();await h.advance(15000);assert.equal(await opening,false);
  assert.equal(h.frames.at(-1).frame.status,'unavailable');
  const error=h.errors.at(-1);
  assert.equal(error.code,'RIVALRY_LEGACY_LOAD_TIMEOUT','the code stays for diagnostics');
  assert.doesNotMatch(error.message,/RIVALRY_|TIMEOUT|_/,'the toast is plain words');
  assert.match(error.message,/again by itself/i);
  h.hide();h.c.document.addEventListener; // hidden: nothing loads
  (h.c.document.visibilityState==='hidden')&&h.online();await h.settle();
  assert.equal(h.loads.length,1,'nothing loads while the page is hidden');
  h.show();await h.settle();
  assert.equal(h.loads.length,2,'showing the page again retries');
  await h.finish(1);assert.equal(h.frames.at(-1).frame.status,'ready');
  // and coming back online after another timeout
  const h2=harness({legacy:true});const o2=h2.c.CareerModeRivalryLegacyV10.mount('legacy',()=>null);await h2.settle();await h2.advance(15000);await o2;
  h2.online();await h2.settle();assert.equal(h2.loads.length,2,'back online retries');
});

// ---- B1: History & Backup shows the online career, one figure per manager ----
check('B1 History & Backup shows the online career Settings counts, never added-together points, with a way to the real History',()=>{
  const source=read('js/legacy.js');
  assert.doesNotMatch(source,/playerOne\)\s*\|\|\s*0\)\s*\+\s*\(Number\(showdown\.score/,'points are never added across managers');
  // run the page builder in a vm with a minimal DOM
  class El{constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.className='';this._text='';this.listeners={};}
    append(...xs){for(const x of xs)this.appendChild(x);}appendChild(x){if(x&&x.isFragment){for(const k of x.children)this.children.push(k);}else this.children.push(x);return x;}
    replaceChildren(...xs){this.children=[];this.append(...xs);}addEventListener(t,f){this.listeners[t]=f;}setAttribute(){}
    get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}set textContent(v){this._text=String(v);this.children=[];}
    get childElementCount(){return this.children.length;}all(){return this.children.flatMap(c=>[c,...c.all()]);}}
  const box=new El('div');
  const twelve=model(Array.from({length:12},(_,i)=>completed(i+1,1,[[i%3?CL:Z,i%3?Z:CL]])));
  const ctx={console,Date,JSON,Number,String,Array,Object,Math,
    document:{createElement:t=>new El(t),createDocumentFragment:()=>Object.assign(new El('#f'),{isFragment:true}),querySelector:s=>s==='#legacy .legacyBox'?box:null,getElementById:()=>null,documentElement:{dataset:{}},addEventListener(){}},
    CareerModeCareerScreenSeam:Seam,CareerModeOnlinePlayerIdentity:{getState:()=>({registered:true,managerId:'daniel'})},
    CareerModeRivalryLegacyV10:{cachedCareerModel:()=>twelve,careerModelLoading:()=>false},
    loadLegacyShowdowns:()=>[],getLegacyStorageRevision:()=>1,addEventListener(){},careerModeLegacyDataTools:true};
  ctx.window=ctx;vm.createContext(ctx);
  vm.runInContext(source+'\n;this.__render=renderLegacy;this.__totals=getLegacyTotals;',ctx,{filename:'js/legacy.js'});
  ctx.archiveCompletedSaveBeforeLegacy=()=>{};vm.runInContext('archiveCompletedSaveBeforeLegacy=function(){};createLegacyDataControls=function(){return document.createElement("section");};',ctx);
  ctx.__render();
  const stats=box.all().filter(e=>e.className==='legacyStat').map(e=>e.textContent);
  const D=twelve.managers.daniel.careerPoints,N=twelve.managers.nik.careerPoints;
  assert.deepEqual(stats,['SHOWDOWNS COMPLETED12',`DANIEL · CAREER POINTS${D}`,`NIK · CAREER POINTS${N}`],'the same online career as Settings ("12 completed showdowns")');
  assert.ok(!stats.some(s=>s.includes(String(D+N))&&D&&N),'no added-together figure');
  assert.ok(!box.textContent.includes('No completed Showdowns yet. Finish one and it appears here.'),'not the empty local list');
  const open=box.all().find(e=>e.className==='compactButton legacyOpenHistory');
  assert.ok(open&&open.textContent==='OPEN HISTORY','a way to the real History screen');
  // the local fallback keeps one figure per manager too
  const totals=ctx.__totals([{score:{playerOne:7,playerTwo:4},rounds:[]},{score:{playerOne:2,playerTwo:9},rounds:[]}]);
  assert.deepEqual(JSON.parse(JSON.stringify(totals.points)),{daniel:9,nik:13});
});

(async()=>{
  for(const [name,run] of groups){
    try{await run();passed++;console.log(`ok - ${name}`);}
    catch(error){console.error(`not ok - ${name}`);console.error(error);process.exitCode=1;}
  }
  if(!process.exitCode)console.log(`r87 career fixes contracts: ${passed} groups passed`);
  else console.error(`r87 career fixes contracts: ${groups.length-passed} of ${groups.length} groups failed`);
})();

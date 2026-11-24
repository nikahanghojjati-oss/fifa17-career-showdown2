'use strict';
// r100 Phoenix B5: the Flight Recorder and Phoenix Rebirth (js/flightRecorder.js, tapped by the budget layer in
// js/sparkPrivatePairing.js). The privacy proof Fable packet FB4 attacks: at every step of a played 3-season Showdown, before
// and after each reveal, the recorder's journal, its saved copy and the page it draws hold none of either manager's private
// values (guesses, signings, roulette spins, results, scores, totals), because it never reads those fields at all.
//   FR1 route(): only the six public ledger documents of a rivalry are kept; per-manager role documents, sessions, accounts,
//       meters, Prime Pack, the league projection and anything outside rivalries/ are refused before data() is called.
//   FR2 whitelist: every property the recorder reads from any document is one of the public ledger fields (proxy-recorded over
//       a whole Showdown), and a refused path never calls data().
//   FR3 privacy: a 3-season Showdown played step by step with a sentinel in every private field (both managers' role
//       documents, the season commit's results, the rivalry's terminal totals, the setup's league and clubs, the roulette's
//       spins): after each step the journal, localStorage and the rendered Flight Recorder contain no sentinel; the page
//       names only Daniel, Nik and the step wording.
//   FR4 truth: each step appears once, in game order, with who did it; a step seen at its own revision carries that revision's
//       server time exactly; a step seen only later shows "by" the later time; the Transfer War's opening uses startedAt;
//       copies with this phone's own unsent writes, malformed shapes, wrong lengths and unknown step names are ignored and
//       nothing throws (2,000 fuzzed documents).
//   FR5 one Showdown: History reading an older, closed Showdown never replaces the live journal; a new live Showdown starts a
//       fresh one; the close is recorded and the journal is kept after it; a reload restores the journal.
//   FR6 Phoenix Rebirth: a page that starts with this browser's mark for the live rivalry arms once; a cold first open (no mark),
//       another rivalry's mark, or a closed rivalry never arms; the close clears the mark; it rises at most once per page.
//   FR7 the budget layer's tap: real fsbRunTransaction / listener deliveries reach observe(); the read meter, the copies and
//       the transaction result are identical with and without the recorder, and a recorder that throws changes nothing.
//   FR9 review fixes (Opus privacy review of #1581): public-path-only tap queue with back-off, the phoenix never over an open
//       overlay and armed 15 s, quiet storage only, the Flight Recorder page keeps focus and scroll.
//   FR8 zero reads and writes: the recorder source names no Firestore call, no fetch, and the module flags say so.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const ROOT=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const RECORDER_SOURCE=read('js/flightRecorder.js');
const BUDGET_SOURCE=(source=>source.slice(source.indexOf('// Firestore budget layer (r75).')))(read('js/sparkPrivatePairing.js'));
let checks=0;
async function check(label,fn){await fn();checks+=1;console.log(`ok ${checks} ${label}`);}

// ---- a fresh recorder realm (its own localStorage behind storage.js's helpers), as a page load ----
// storage.js's quiet helpers (they never raise the save notice); the loud ones count calls so a test can prove they are unused
function storageHelpers(storage){const quiet=q=>{if(q!==true)throw new Error('the recorder called a storage helper without quiet=true (it could raise the save notice)');};
  return {readStorageValue:(k,q)=>{quiet(q);return storage.getItem(k);},writeStorageValue:(k,v,q)=>{quiet(q);if(storage.blocked)return false;storage.setItem(k,v);return true;},
    removeStorageValue:(k,q)=>{quiet(q);if(storage.blocked)return false;storage.removeItem(k);return true;}};}
function memoryStorage(seed){const map=new Map(Object.entries(seed||{}));return {getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),dump:()=>Object.fromEntries(map)};}
function realm(storage=memoryStorage()){
  const timers=[];
  const c=vm.createContext({console,...storageHelpers(storage),setTimeout:(fn)=>{timers.push(fn);return timers.length;},clearTimeout:()=>{},Date,JSON,Math,Number,Object,Array,String,Boolean,Intl,Promise});
  vm.runInContext(RECORDER_SOURCE,c,{filename:'js/flightRecorder.js'});
  return {c,api:c.CareerModeFlightRecorder,storage,timers};
}
const RID='pair_'+'3'.repeat(64),OLD='pair_'+'1'.repeat(64),NEXT='pair_'+'5'.repeat(64);
const T0=Date.UTC(2026,10,26,19,0,0);
const {ts}=require('../support/flight-recorder-fixture.cjs');
function snap(data,{pending=false,exists=true}={}){return {exists:()=>exists,data:()=>data,metadata:{fromCache:false,hasPendingWrites:pending}};}

// ---- a fake DOM, enough for render() ----
class FakeNode{constructor(doc,tag){this.ownerDocument=doc;this.tagName=tag;this.children=[];this.className='';this._text='';this.dataset={};this.attributes={};}
  set textContent(v){this._text=String(v);this.children=[];}get textContent(){return [this._text,...this.children.map(n=>n.textContent)].join(' ');}
  append(...nodes){for(const n of nodes)this.children.push(typeof n==='string'?Object.assign(new FakeNode(this.ownerDocument,'#text'),{_text:n}):n);}
  setAttribute(k,v){this.attributes[k]=String(v);}
  serialize(){return `<${this.tagName} class="${this.className}" ${JSON.stringify(this.dataset)} ${JSON.stringify(this.attributes)} ${this.dateTime||''}>${this._text}${this.children.map(n=>n.serialize()).join('')}</${this.tagName}>`;}}
function fakeContainer(){const doc={createElement:tag=>new FakeNode(doc,tag)};return new FakeNode(doc,'div');}

const {SECRET,showdown}=require('../support/flight-recorder-fixture.cjs');
function assertClean(label,r,container){
  const journal=JSON.stringify(r.api.steps());
  assert.doesNotMatch(journal,SECRET,`${label}: the journal holds no private value`);
  for(const [key,value] of Object.entries(r.storage.dump()))assert.doesNotMatch(String(value),SECRET,`${label}: localStorage ${key} holds no private value`);
  const page=container.serialize();
  assert.doesNotMatch(page,SECRET,`${label}: the Flight Recorder page holds no private value`);
  assert.doesNotMatch(page,/pair_|op_|sha256|session_|device_|acct-/,`${label}: no ids or hashes on the page`);
}

(async()=>{
await check('FR1 only the six public ledger documents of a rivalry are routed',()=>{
  const {api}=realm();
  const ok=[`rivalries/${RID}`,`rivalries/${RID}/sharedSetup/authoritative`,`rivalries/${RID}/careerStart/authoritative`,`rivalries/${RID}/transferChallenges/season_1`,`rivalries/${RID}/seasonResults/season_10`,`rivalries/${RID}/seasonCommits/season_3`];
  for(const p of ok)assert.ok(api.route(p),p);
  const refused=[`rivalries/${RID}/transferChallenges/season_1/roles/playerTwo`,`rivalries/${RID}/seasonResults/season_1/roles/playerOne`,`rivalries/${RID}/sessions/session_1`,`rivalries/${RID}/meters/playerOne`,
    `rivalries/${RID}/invites/x`,`rivalries/${RID}/seasonResults/leagueProjection`,`rivalries/${RID}/transferChallenges/season_11`,`rivalries/${RID}/transferChallenges/season_0`,`rivalries/${RID}/sharedSetup/other`,
    `rivalries/${RID}/primePack/season_1`,`accounts/u/careerStart/current`,`rivalries/pair_short`,`rivalries`,'',null,undefined,42];
  for(const p of refused)assert.equal(api.route(p),null,String(p));
  let touched=0;const spy={exists:()=>{touched+=1;return true;},data:()=>{touched+=1;return {revision:1};},metadata:{hasPendingWrites:false}};
  for(const p of refused)assert.equal(api.observe(p,spy),false);
  assert.equal(touched,0,'a refused document is never opened (no exists(), no data())');
});

await check('FR2 every field the recorder reads is a public ledger field (proxy-recorded over a whole Showdown)',()=>{
  const {api}=realm();const seen=new Set();
  const ALLOWED=new Set(['data','connectionState','updatedAt','revision','actorRoles','operationTypes','startedAt','toMillis']);
  const spyOn=(value,prefix)=>value&&typeof value==='object'?new Proxy(value,{get(t,k){if(typeof k==='string'&&!/^\d+$/.test(k)&&k!=='length')seen.add(k);const v=Reflect.get(t,k);return v&&typeof v==='object'&&!Array.isArray(v)?spyOn(v,k):v;}}):value;
  const {steps}=showdown(3);
  for(const step of steps)api.observe(step.path,snap(spyOn(step.data)));
  const extra=[...seen].filter(k=>!ALLOWED.has(k));
  assert.deepEqual(extra,[],`fields outside the public ledger were read: ${extra.join(', ')}`);
  for(const k of ['actorRoles','operationTypes','updatedAt','revision','connectionState'])assert.ok(seen.has(k),`reads ${k}`);
});

await check('FR3 privacy at every step: journal, saved copy and page hold no guess, signing, spin, result, score or total',()=>{
  const r=realm();const {steps}=showdown(3);let n=0;
  for(const step of steps){
    r.api.observe(step.path,snap(step.data));
    const container=fakeContainer();r.api.render(container);
    assertClean(`step ${++n} (${step.path.split('/').slice(2).join('/')||'rivalry'})`,r,container);
    const words=container.textContent.replace(/[^A-Za-z]+/g,' ').trim().split(' ').filter(Boolean);
    const vocabulary=new Set(('Daniel Nik SET UP SEASON THE END No steps on this phone yet Each step of the Showdown appears here with its server time as it happens '+
      'Opened Locked league clubs season count Confirmed Started career Transfer War guesses signings Asked to end Closed when clock ran out Published s results and confirmed '+
      'The closed by Server times shown in your local time marks a that arrived a little later Picks guesses signings scores are never kept here PM AM Mon Tue Wed Thu Fri Sat Sun Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec').split(' '));
    for(const w of words)assert.ok(vocabulary.has(w),`step ${n}: unexpected word on the page: ${w}`);
  }
  assert.ok(n>60,'a whole 3-season Showdown was played');
});

await check('FR4 truth: each step once, in order, with who did it; exact server time at its own revision, "by" otherwise',()=>{
  const r=realm();const {steps}=showdown(3);const seen=new Set();
  for(const step of steps){if(!seen.has(step.path)){seen.add(step.path);r.api.observe(step.path,snap(null,{exists:false}));}r.api.observe(step.path,snap(step.data));}
  const list=r.api.steps().steps;
  const shape=Array.from(list,s=>`${s.season??'-'} ${s.who||'·'} ${s.text}`);
  assert.equal(list.length,6+2+3*(5+2+3)+1,'six set-up steps, two career starts, ten per season, the close');
  assert.deepEqual(shape.slice(0,8),['- Daniel Opened the Showdown','- Daniel Locked the league','- Daniel Locked the clubs','- Daniel Locked the season count','- Daniel Confirmed the Showdown','- Nik Confirmed the Showdown','- Daniel Started the career','- Nik Started the career']);
  assert.deepEqual(shape.slice(8,18),['1 Daniel Opened the Transfer War','1 Nik Locked guesses','1 Daniel Locked guesses','1 Daniel Locked signings','1 Nik Locked signings','1 Nik Published the season\'s results','1 Daniel Published the season\'s results','1 Daniel Locked and confirmed the season','1 Nik Confirmed the season','1 Daniel Confirmed the season']);
  assert.equal(shape.at(-1),'- · The Showdown closed');
  assert.ok(list.every(s=>s.exact&&Number.isFinite(s.at)),'seen at every revision: every time is exact');
  // a phone that saw only the last copy of each document: the last step exact, the rest "by" that time
  const late=realm();const last=new Map();for(const step of steps)last.set(step.path,step.data);
  late.api.observe(`rivalries/${RID}`,snap(steps[0].data));
  for(const [p,d] of last)if(p!==`rivalries/${RID}`)late.api.observe(p,snap(d));
  late.api.observe(`rivalries/${RID}`,snap(last.get(`rivalries/${RID}`)));
  const tw=late.api.steps().steps.filter(s=>s.kind==='transfer'&&s.season===2);
  assert.equal(tw.length,5);
  assert.equal(tw[0].exact,true,'the opening of the Transfer War uses startedAt');
  assert.ok(tw.slice(1).every(s=>!s.exact&&s.at===tw[4].at),'a first look at a document gives "by" its time, its last step included');
  // an envelope rewrite that moves updatedAt with no new step changes nothing; the next real step is exact
  const env=realm();const doc=`rivalries/${RID}/seasonCommits/season_1`;
  env.api.observe(`rivalries/${RID}`,snap(steps[0].data));
  env.api.observe(doc,snap({revision:1,actorRoles:['playerOne'],updatedAt:ts(T0+100)}));
  env.api.observe(doc,snap({revision:1,actorRoles:['playerOne'],updatedAt:ts(T0+900)}));
  let cs=env.api.steps().steps;assert.equal(cs[0].exact,false);assert.equal(cs[0].at,T0+100,'a later updatedAt at the same revision never moves the time');
  env.api.observe(doc,snap({revision:2,actorRoles:['playerOne','playerTwo'],updatedAt:ts(T0+2000)}));
  cs=env.api.steps().steps;assert.equal(cs[1].exact,true,'a step whose revision grew in front of this page is exact');assert.equal(cs[1].at,T0+2000);
  env.api.observe(`rivalries/${RID}`,snap({data:{connectionState:'closed'},updatedAt:ts(T0+3000)}));
  assert.equal(env.api.steps().steps.at(-1).exact,true,'a close this page saw happen is exact');
  const c=fakeContainer();late.api.render(c);assert.match(c.textContent,/by /,'the page says "by"');
  // an own unsent write, malformed shapes and fuzz
  const f=realm();f.api.observe(`rivalries/${RID}`,snap({data:{connectionState:'active'},updatedAt:ts(T0)}));
  const base=f.api.steps().steps.length;
  f.api.observe(`rivalries/${RID}/seasonResults/season_1`,snap({revision:1,actorRoles:['playerOne'],updatedAt:ts(T0)},{pending:true}));
  assert.equal(f.api.steps().steps.length,base,'a copy with this phone\'s own unsent write is skipped');
  const bad=[null,1,'x',[],{revision:2,actorRoles:['playerOne']},{revision:1,actorRoles:['playerThree']},{revision:1,actorRoles:['playerOne'],operationTypes:['steal-guesses']},{revision:-1,actorRoles:[]},{revision:1.5,actorRoles:['playerOne']},{revision:65,actorRoles:Array(65).fill('playerOne')}];
  for(const b of bad)for(const p of b&&b.operationTypes?['sharedSetup/authoritative','transferChallenges/season_1']:['sharedSetup/authoritative','transferChallenges/season_1','seasonCommits/season_1'])assert.doesNotThrow(()=>f.api.observe(`rivalries/${RID}/${p}`,snap(b)));
  assert.equal(f.api.steps().steps.length,base,'malformed ledgers add nothing');
  let seed=20261126;const rnd=()=>(seed=(seed*1103515245+12345)%2147483648)/2147483648;
  const pick=a=>a[Math.floor(rnd()*a.length)];
  const values=[null,undefined,0,1,2,-1,'',{},[],['playerOne'],['playerTwo','playerOne'],['start-window'],['lock-guesses','x'],ts(T0),{seconds:1e9},{seconds:'x'},{toMillis(){throw new Error('x');}},NaN,'active','closed',{connectionState:'active'}];
  for(let i=0;i<2000;i+=1){
    const doc={};for(const k of ['revision','actorRoles','operationTypes','updatedAt','startedAt','data','connectionState'])if(rnd()<.7)doc[k]=pick(values);
    const p=pick([`rivalries/${RID}`,`rivalries/${RID}/sharedSetup/authoritative`,`rivalries/${RID}/careerStart/authoritative`,`rivalries/${RID}/transferChallenges/season_2`,`rivalries/${RID}/seasonResults/season_2`,`rivalries/${RID}/seasonCommits/season_2`]);
    assert.doesNotThrow(()=>f.api.observe(p,rnd()<.1?{exists(){throw new Error('x');}}:snap(doc)));
  }
  const c2=fakeContainer();assert.doesNotThrow(()=>f.api.render(c2));
  for(const s of f.api.steps().steps)assert.ok(s.text&&(s.at===null||Number.isFinite(s.at)),'every kept step is well formed');
});

await check('FR5 one Showdown: an older closed Showdown never replaces the live journal; a new live one starts fresh; reload restores',()=>{
  const storage=memoryStorage();const r=realm(storage);const {steps}=showdown(1);
  for(const step of steps.slice(0,20))r.api.observe(step.path,snap(step.data));
  const before=JSON.stringify(r.api.steps());
  // History opens an older, closed Showdown: its rivalry and its ledgers are read
  r.api.observe(`rivalries/${OLD}`,snap({data:{connectionState:'closed'},updatedAt:ts(T0-9e8)}));
  r.api.observe(`rivalries/${OLD}/seasonCommits/season_1`,snap({revision:1,actorRoles:['playerOne'],updatedAt:ts(T0-9e8)}));
  assert.equal(JSON.stringify(r.api.steps()),before,'the live journal is unchanged');
  for(const step of steps.slice(20))r.api.observe(step.path,snap(step.data));
  const closed=r.api.steps();assert.equal(closed.steps.at(-1).kind,'close');
  const reload=realm(storage);
  assert.equal(JSON.stringify(reload.api.steps()),JSON.stringify(closed),'a reload restores the journal, the close included');
  reload.api.observe(`rivalries/${NEXT}`,snap({data:{connectionState:'active'},updatedAt:ts(T0+9e8)}));
  assert.equal(reload.api.steps().rivalryId,NEXT);assert.equal(reload.api.steps().steps.length,0,'a new live Showdown starts a fresh journal');
  storage.setItem('careerModeShowdown.flightRecorder','{"schemaVersion":1,"rivalryId":"'+RID+'","steps":[{"kind":"results","season":1,"index":0,"type":"publish","actor":"playerOne","at":1,"exact":true,"result":9799},{"kind":"x"}]}');
  const odd=realm(storage);
  assert.equal(odd.api.steps().steps.length,0,'a saved step with an out-of-range time (1 ms after 1970) is dropped');
  storage.setItem('careerModeShowdown.flightRecorder','{"schemaVersion":1,"rivalryId":"'+RID+'","steps":[{"kind":"results","season":1,"index":0,"type":"publish","actor":"playerOne","at":'+(T0+5)+',"exact":true,"result":9799},{"kind":"x"},{"kind":"results","season":1,"index":1,"type":"publish","actor":"playerTwo","at":1e300,"exact":true}]}');
  const odd2=realm(storage);
  assert.equal(odd2.api.steps().steps.length,1,'a saved step of an unknown kind, or with an absurd time, is dropped');
  {const c=fakeContainer();odd2.api.render(c);assert.match(c.textContent,/Published/,'and the page still draws');}
  // blocked or full storage: no save notice, the journal lives on in memory, and no write is tried again
  const blocked=memoryStorage();blocked.blocked=true;const quiet=realm(blocked);
  quiet.api.observe(`rivalries/${NEXT}`,snap({data:{connectionState:'active'},updatedAt:ts(T0)}));
  quiet.api.observe(`rivalries/${NEXT}/seasonCommits/season_1`,snap({revision:1,actorRoles:['playerOne'],updatedAt:ts(T0+1)}));
  assert.equal(quiet.api.steps().steps.length,1,'kept in memory');assert.deepEqual(Object.keys(blocked.dump()),[],'nothing was written');
  assert.doesNotMatch(JSON.stringify(odd.api.steps()),SECRET,'only known fields of a saved step are shown');
});

await check('FR6 Phoenix Rebirth: arms once on a resumed live Showdown, never on a cold first open, another rivalry or a closed one',()=>{
  const live=snap({data:{connectionState:'active'},updatedAt:ts(T0)}),closed=snap({data:{connectionState:'closed'},updatedAt:ts(T0+1)});
  const storage=memoryStorage();
  const cold=realm(storage);cold.api.observe(`rivalries/${RID}`,live);
  assert.equal(cold.api.phoenixState().armed,false,'cold first open: no mark, no phoenix');
  assert.equal(JSON.parse(storage.getItem(cold.api.markKey)).rivalryId,RID,'the live Showdown leaves this browser\'s mark');
  cold.api.observe(`rivalries/${RID}/seasonCommits/season_1`,snap({revision:1,actorRoles:['playerOne'],updatedAt:ts(T0)}));
  assert.equal(cold.api.phoenixState().armed,false,'still no phoenix in the page that played on');
  const resumed=realm(storage);
  assert.equal(resumed.api.phoenixState().resumeMark,RID);
  resumed.api.observe(`rivalries/${RID}/seasonCommits/season_1`,snap({revision:1,actorRoles:['playerOne'],updatedAt:ts(T0)}));
  assert.equal(resumed.api.phoenixState().armed,false,'arms on the rivalry itself, not on a ledger alone');
  resumed.api.observe(`rivalries/${RID}`,live);
  assert.equal(resumed.api.phoenixState().armed,true,'reload / tab kill / evict: the page starts with the mark and sees the same live rivalry');
  resumed.api.observe(`rivalries/${RID}`,live);resumed.api.observe(`rivalries/${RID}`,live);
  assert.equal(resumed.timers.length,1,'armed once: one status-line watch');
  const other=realm(memoryStorage({[cold.api.markKey]:JSON.stringify({schemaVersion:1,rivalryId:OLD})}));
  other.api.observe(`rivalries/${RID}`,live);
  assert.equal(other.api.phoenixState().armed,false,'a mark of another Showdown never arms');
  const end=realm(storage);end.api.observe(`rivalries/${RID}`,closed);
  assert.equal(end.api.phoenixState().armed,false,'a Showdown that closed while away never arms');
  assert.equal(JSON.parse(storage.getItem(end.api.markKey)).rivalryId,null,'the close clears the mark');
  const after=realm(storage);after.api.observe(`rivalries/${RID}`,live);
  assert.equal(after.api.phoenixState().armed,false,'after the close the next open is a first open again');
  for(const r of [cold,resumed,other,end,after])r.api._resetForTests();
  // the rise itself is drawn once per page, over the status line only (browser gallery: tests/browser/r100-flight-recorder-gallery.cjs)
  assert.match(RECORDER_SOURCE,/if\(phoenix\.rose\|\|phoenix\.armed\|\|resumeMark!==rivalryId\)return;/);
  assert.match(RECORDER_SOURCE,/pointerEvents:"none"/,'the phoenix never takes a tap');
});

await check('FR7 the budget layer taps server copies into observe(); meter, copies and results unchanged; a throwing recorder changes nothing',async()=>{
  const {steps}=showdown(1);const store=new Map();for(const step of steps)store.set(step.path,step.data);store.set(`rivalries/${RID}`,steps[0].data);
  async function play(recorder){
    const c=vm.createContext({console,TextEncoder,crypto:webcrypto,setTimeout:(fn,ms)=>{const t=setTimeout(fn,ms);t.unref?.();return t;},clearTimeout,Date});
    if(recorder==='real'){Object.assign(c,storageHelpers(memoryStorage()));vm.runInContext(RECORDER_SOURCE,c);}
    if(recorder==='throws')c.CareerModeFlightRecorder={observe(){throw new Error('recorder broke');}};
    vm.runInContext(BUDGET_SOURCE,c);
    const db={},gets=[];
    const sdk={doc:(_db,...p)=>({path:p.join('/')}),runTransaction:async(_db,fn)=>fn({get:async ref=>{gets.push(ref.path);const v=store.get(ref.path);return {exists:()=>v!==undefined,data:()=>v,metadata:{fromCache:false,hasPendingWrites:false}};},set(){},update(){},delete(){}})};
    const services=c.CareerModeFirestoreBudget.services({ok:true,auth:{currentUser:{uid:'acct-daniel'}},firestore:db,firestoreSdk:sdk});
    const out=[];
    for(const p of [`rivalries/${RID}`,`rivalries/${RID}/sharedSetup/authoritative`,`rivalries/${RID}/careerStart/authoritative`,`rivalries/${RID}/transferChallenges/season_1`,`rivalries/${RID}/transferChallenges/season_1/roles/playerTwo`,`rivalries/${RID}/seasonResults/season_1`,`rivalries/${RID}/seasonCommits/season_1`])
      out.push(await services.firestoreSdk.runTransaction(db,async tx=>{const s=await tx.get(sdk.doc(db,...p.split('/')));return s.exists()?s.data().revision??null:null;}));
    const stats=c.CareerModeFirestoreBudget.stats();
    return {out,gets,reads:c.CareerModeFirestoreBudget.readsToday().reads,serverReads:stats.serverReads,remembered:stats.remembered,recorder:c.CareerModeFlightRecorder};
  }
  const none=await play(null),real=await play('real'),broken=await play('throws');
  for(const run of [real,broken]){
    assert.deepEqual(run.out,none.out,'transaction results unchanged');
    assert.deepEqual(run.gets,none.gets,'the same server reads, no extra read');
    assert.equal(run.reads,none.reads,'the read meter is unchanged');
    assert.equal(run.serverReads,none.serverReads);assert.equal(run.remembered,none.remembered,'the same copies are kept');
  }
  const kinds=real.recorder.steps().steps.map(s=>s.kind);
  assert.ok(kinds.includes('setup')&&kinds.includes('transfer')&&kinds.includes('results')&&kinds.includes('commit'),`transaction reads reach the recorder (${kinds.join(',')})`);
  const budget=read('js/sparkPrivatePairing.js');
  for(const site of ['function fsbRemember(db,ref,snapshot){','function fsbCtxDelivery(watch,snapshot){','function fsbWaitDelivery(wait,snapshot){'])
    assert.match(budget.slice(budget.indexOf(site),budget.indexOf(site)+900),/fsbTap\(/,`${site} taps the recorder`);
  assert.match(budget,/function fsbTap\(path,snapshot\)\{\s*try\{/,'the tap is guarded');
});

await check('FR9 review fixes: the tap hands on only the six public documents and backs off after a failed load; the phoenix checks nothing is over the chip; the Flight Recorder page keeps focus and scroll on refreshes',()=>{
  const pairing=read('js/sparkPrivatePairing.js');
  const rx=new RegExp(/const fsbFlightPath=\/(.*)\/;/.exec(pairing)[1].replace(/\\\//g,'/'));
  for(const p of [`rivalries/${RID}`,`rivalries/${RID}/sharedSetup/authoritative`,`rivalries/${RID}/careerStart/authoritative`,`rivalries/${RID}/transferChallenges/season_3`,`rivalries/${RID}/seasonResults/season_10`,`rivalries/${RID}/seasonCommits/season_1`])assert.ok(rx.test(p),p);
  for(const p of [`rivalries/${RID}/roles/playerOne`,`rivalries/${RID}/primePack/season_1`,`rivalries/${RID}/sessions/x`,`rivalries/${RID}/seasonResults/season_11`,`rivalries/${RID}/transferChallenges/season_1/roles/playerTwo`,`accounts/x`])assert.equal(rx.test(p),false,p);
  assert.match(pairing,/fsbFlightAsked=false;fsbFlightQueue\.length=0;fsbFlightRetryAt=Date\.now\(\)\+60000;/,'a failed load drops the queue and backs off');
  assert.match(RECORDER_SOURCE,/if\(!onTop\(chip,box\)\)return null;/,'the phoenix rises only where the chip is what is painted');
  assert.match(RECORDER_SOURCE,/#settingsOverlay:not\(\.hidden\), dialog\[open\]/,'never with Settings, a dialog or a modal open');
  assert.match(RECORDER_SOURCE,/ARM_MS=15000/,'armed for 15 s, never long after the resume');
  assert.match(RECORDER_SOURCE,/if\(loading\)phoenix\.armedAt=Date\.now\(\);\n  if\(Date\.now\(\)-phoenix\.armedAt>ARM_MS\)/,'the 15 s start when the loading screen has gone');
  for(const m of RECORDER_SOURCE.matchAll(/root\.(?:read|write|remove)StorageValue\(((?:[^()]|\([^()]*\))*)\)/g))assert.match(m[1],/,true$/,'every storage call is the quiet one: '+m[0]);
  assert.match(read('js/storage.js'),/function readStorageValue\(key,quiet\)\{try\{return localStorage\.getItem\(key\);\}catch\(error\)\{if\(!quiet\)reportStorageError/,'storage.js keeps the notice for every loud call');
  const settings=read('js/settings.js');
  assert.match(settings,/function refreshSettingsOfflinePanel\(\)\{\n    if\(!settingsContent\)\{ return false; \}\n[^\n]*\n    if\(settingsView === "flight"\)\{ return false; \}/,'an offline-state change leaves the Flight Recorder page alone');
  assert.match(settings,/if\(settingsView === "flight"\)\{ return; \}\n                renderSettings\(\);/,'so does a preferences change');
  assert.match(settings,/"\.settingsFlightRecorderBack",/,'BACK TO SETTINGS keeps focus across a redraw');
  // until POS1M seals a build the shipped seal file is an unsealed placeholder: fetched without a 404 and never a plaque
  const placeholder=JSON.parse(read('data/pos1m-seal.json'));
  assert.equal(placeholder.schemaVersion,1);assert.equal(placeholder.engine,'POS1M');assert.equal(placeholder.sealed,false);
  for(const key of ['build','commit','sealedAt','stories','laws','plantedBugs'])assert.equal(Object.hasOwn(placeholder,key),false,`the placeholder has no ${key}, so settingsProofSealValid rejects it`);
  assert.match(settings,/seal\.schemaVersion === 1 && seal\.engine === "POS1M" && seal\.sealed === true\s*&& typeof seal\.build === "string"/,'the plaque needs a build');
  // Codex #1581: only a run POS1M itself sealed (tests/pos1m/seal.cjs: whole shard set, replays run and passed) becomes a plaque
  {
    const fn=/function settingsProofSealValid\(seal\)\{[\s\S]*?\n\}/.exec(settings)[0];
    const valid=new Function('getSettingsApplicationVersion',fn+'\nreturn settingsProofSealValid;')(()=> '3.0.0');
    const good={schemaVersion:1,engine:'POS1M',sealed:true,build:'3.0.0',commit:'a'.repeat(40),sealedAt:'2026-11-28T03:00:00Z',stories:{survived:9,run:9},laws:{held:3,total:3},plantedBugs:{caught:2,total:2}};
    assert.equal(valid(good),true,'a whole seal for this build shows');
    assert.equal(valid({...good,sealed:false}),false,'counts that match but a run POS1M did not seal (shards missing, replays failed) show nothing');
    const {sealed,...noFlag}=good;assert.equal(valid(noFlag),false,'no sealed flag, no plaque');
    assert.equal(valid({...good,sealed:'true'}),false,'only the boolean true seals');
    assert.equal(valid({...good,build:'2.11.0'}),false);assert.equal(valid({...good,laws:{held:2,total:3}}),false);
  }
});

await check('FR8 zero Firebase reads or writes: the recorder names no Firestore call and no fetch',()=>{
  const code=RECORDER_SOURCE.replace(/\/\/[^\n]*/g,'');
  assert.doesNotMatch(code,/getDoc|getDocs|onSnapshot|runTransaction|setDoc|updateDoc|firestore|fetch\(|XMLHttpRequest|sendBeacon/i);
  const {api}=realm();assert.equal(api.providerReadRequired,false);assert.equal(api.providerWriteRequired,false);
});

console.log(`PASS r100 Flight Recorder + Phoenix Rebirth contracts (${checks} checks)`);
})().catch(error=>{console.error(error);process.exitCode=1;});

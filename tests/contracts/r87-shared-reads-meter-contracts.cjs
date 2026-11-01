'use strict';
// r87 shared reads meter (B2, READS_ESTIMATE_CONSISTENCY.md): Daniel's and Nik's phones showed different "free online use today"
// and "seasons left" because each phone doubled (or scaled) its OWN reads. Now each phone writes one small document,
// rivalries/{rid}/meters/{its role}, once a season at ACKNOWLEDGED and reads the partner's once, and both compute the same numbers
// from the same two documents. Two pages run the REAL budget layer (js/sparkPrivatePairing.js) and the REAL Settings text
// (js/settings.js) over one fake Firestore with a shared fake clock. No emulator, no network.
//   M1 both phones show the same total, cost per season and seasons left from the same two documents (any argument order);
//      this phone's part on one is the partner's part on the other; the documents have exactly the Rules' shape.
//   M2 the second acknowledger reads 8 s later; a partner later than that is read again at +45 s; until then "estimated". A
//      partner whose document exists but is behind (a phone locked at ACKNOWLEDGED) is read again at +3 and +10 min.
//   M3 fallback: no partner document (an older build), one from another day, or one behind this phone's season -> the B1
//      role-share estimate, labelled "estimated"; four reads at most a season (+8 s, +45 s, +3 min, +10 min), missing or behind.
//   M4 Rules not deployed yet: the refused write never throws, stops the meter for the day, no partner read. A write or read
//      refused after a write succeeded today (a Showdown closed under it) skips only that season.
//   M5 RE-05: season 1 is measured from Career Start ready; what came before goes to setup; without the mark season 1 only
//      moves the mark (RS-07).
//   M6 RE-08: the client lookup table names no document twice (root./after., the written rivalryId, the signed-in account in
//      the pair), and the meter document costs one lookup to read (two once the Showdown is closed) and one to write.
//   M7 the meter's own cost: one write (1 lookup) and one read (1 document + 1 lookup) per phone per season, billed as game reads.
//   M8 a season that crosses Pacific midnight keeps its start mark, so its whole cost is measured (live and after a reload).
//   M9 a reload between the meter write and the partner read resumes the bounded read once, with no second write.
//   M10 C-04: a missing partner document (season 1, the partner's phone locked at ACKNOWLEDGED) is read on the same bounded schedule
//      as a behind one (+8 s, +45 s, +3 min, +10 min), so both phones end on the same shared total.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const source=read('js/sparkPrivatePairing.js');
const BUDGET_SOURCE=source.slice(source.indexOf('// Firestore budget layer (r75).'));
const settingsSource=read('js/settings.js');
const SETTINGS_FUNCTIONS=settingsSource.slice(settingsSource.indexOf('function getSettingsRoundedReads('),settingsSource.indexOf('function createApplicationPanel('));
assert.ok(SETTINGS_FUNCTIONS.includes('function getSettingsReadsTodayText(')&&SETTINGS_FUNCTIONS.includes('function getSettingsSeasonsLeftText('),'the Settings reads rows are found');
const RID='pair_'+'a'.repeat(64);
const DAY_KEY='careerModeFirestoreReadsDay';
const RULES_KEYS=['schemaVersion','objectType','rivalryId','role','day','season','game','career','costs','updatedAt'];
let checks=0;
async function check(label,fn){await fn();checks+=1;console.log(`ok ${checks} ${label}`);}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
async function settle(){for(let i=0;i<10;i+=1)await flush();}

// One fake Firestore and one clock (with one timer queue) for both phones.
function createPair({now=1_800_000_000_000}={}){
  const world={clock:{now},timers:[],store:new Map(),seq:0};
  world.advance=async function advance(ms){
    const end=world.clock.now+ms;
    for(;;){await settle();world.timers.sort((a,b)=>a.at-b.at||a.id-b.id);const next=world.timers[0];if(!next||next.at>end)break;world.timers.shift();world.clock.now=Math.max(world.clock.now,next.at);next.fn();}
    world.clock.now=end;await settle();
  };
  return world;
}
function dayOf(at){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at));}
// A phone whose saved day (localStorage) already holds this bill when the budget layer first reads it.
function phone(world,{uid,role,game,career=0,markGame,costs=[],lastCost=0,denyWrites=false}){
  const seed={day:dayOf(world.clock.now),reads:0,markReads:0,seasons:[],costs:[],lastCost:0,bill:{game,career,markGame:markGame===undefined?game:markGame,costs,lastCost,role}};
  return pageWithStorage(world,{uid,denyWrites,storage:new Map([[DAY_KEY,JSON.stringify(seed)]])});
}
function pageWithStorage(world,{uid,denyWrites=false,storage}){
  const {clock,timers,store}=world;
  const ops={gets:[],sets:[]};
  const snapshot=p=>{const value=store.get(p);return {exists:()=>value!==undefined,data:()=>value===undefined?undefined:JSON.parse(JSON.stringify(value)),metadata:{fromCache:false,hasPendingWrites:false}};};
  const sandbox={console,document:{visibilityState:'visible',documentElement:{dataset:{}},addEventListener(){}},addEventListener(){},dispatchEvent(){return true;},
    CustomEvent:class{constructor(type,init){this.type=type;this.detail=init&&init.detail;}},
    setTimeout(fn,ms){const id=++world.seq;timers.push({id,at:clock.now+Math.max(0,Number(ms)||0),fn});return id;},
    clearTimeout(id){const i=timers.findIndex(t=>t.id===id);if(i>=0)timers.splice(i,1);},
    readStorageValue:key=>storage.has(key)?storage.get(key):null,writeStorageValue:(key,value)=>{storage.set(key,String(value));return true;}};
  sandbox.globalThis=sandbox;sandbox.window=sandbox;
  vm.createContext(sandbox);
  vm.runInContext('Date.now=()=>__clockNow();',Object.assign(sandbox,{__clockNow:()=>clock.now}));
  vm.runInContext(BUDGET_SOURCE,sandbox,{filename:'sparkPrivatePairing.js#budget'});
  vm.runInContext(SETTINGS_FUNCTIONS,sandbox,{filename:'settings.js#reads'});
  const budget=sandbox.CareerModeFirestoreBudget;
  const db={kind:'fake-firestore'};
  // The raw SDK the meter uses (a runtime that hands out getDoc/setDoc); the meter bills these by hand.
  const sdk={
    doc:(_db,...segments)=>({path:segments.join('/')}),
    serverTimestamp:()=>({__serverTimestamp:true}),
    async getDoc(ref){ops.gets.push(ref.path);if(world.denyReads)throw Object.assign(new Error('Missing or insufficient permissions.'),{code:'permission-denied'});return snapshot(ref.path);},
    async setDoc(ref,data){ops.sets.push({path:ref.path,data:JSON.parse(JSON.stringify(data))});if(denyWrites||world.denyWrites)throw Object.assign(new Error('Missing or insufficient permissions.'),{code:'permission-denied'});store.set(ref.path,{...JSON.parse(JSON.stringify(data)),updatedAt:{ms:clock.now}});},
    async runTransaction(_db,fn){return fn({get:async ref=>snapshot(ref.path),set(){},update(){},delete(){}});}
  };
  budget.services({ok:true,firestore:db,firestoreSdk:sdk,auth:{currentUser:{uid}}});
  return {sandbox,budget,storage,ops,db,uid,
    acknowledge(season,{live=true,role}={}){return budget.noteSeasonDone(`${RID}|${season}`,live,{role,season,rivalryId:RID,firestore:db});},
    settings(){return {reads:sandbox.getSettingsReadsTodayText(),left:sandbox.getSettingsSeasonsLeftText()};}};
}
const plain=value=>JSON.parse(JSON.stringify(value));
// Mirror of ssjrMeterValidWrite's data checks (the emulator test proves the Rules themselves).
function rulesShape(doc,role){
  assert.deepEqual(Object.keys(doc).sort(),[...RULES_KEYS].sort(),'exactly the Rules keys');
  assert.equal(doc.schemaVersion,1);assert.equal(doc.objectType,'readsMeter');assert.equal(doc.rivalryId,RID);assert.equal(doc.role,role);
  assert.match(doc.day,/^20[0-9]{2}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/);
  assert.ok(Number.isInteger(doc.season)&&doc.season>=1&&doc.season<=10);
  for(const key of ['game','career'])assert.ok(Number.isInteger(doc[key])&&doc[key]>=0&&doc[key]<=1000000,key);
  assert.ok(Array.isArray(doc.costs)&&doc.costs.length<=3&&doc.costs.every(cost=>Number.isInteger(cost)&&cost>0&&cost<=100000),'costs');
  assert.deepEqual(doc.updatedAt,{__serverTimestamp:true},'updatedAt is the server time (request.time)');
}
const reads=p=>p.ops.gets.length;

(async()=>{
  await check('M1 both phones show the same total, cost per season and seasons left from the same two documents; the documents have the Rules shape',async()=>{
    const world=createPair();
    // Measured-like split (READS_ESTIMATE_CONSISTENCY.md): Daniel's phone reads more (coordinator), Nik opened career pages.
    const daniel=phone(world,{uid:'daniel',role:'playerOne',game:1716,career:12,markGame:1390,costs:[323,317]});
    const nik=phone(world,{uid:'nik',role:'playerTwo',game:1301,career:141,markGame:1010,costs:[288,292]});
    const before={daniel:daniel.budget.readsToday(),nik:nik.budget.readsToday()};
    assert.equal(before.daniel.estimated,true);assert.notEqual(before.daniel.billedEstimate,before.nik.billedEstimate,'before: each phone estimates from its own reads');
    // Nik acknowledges second (his write makes the commit ACKNOWLEDGED), Daniel's page sees it 2 s later.
    assert.equal(nik.acknowledge(3,{role:'playerTwo'}),true);
    await world.advance(2000);
    assert.equal(daniel.acknowledge(3,{role:'playerOne'}),true);
    await world.advance(10000);
    const a=daniel.budget.readsToday(),b=nik.budget.readsToday(),la=daniel.budget.seasonsLeftToday(),lb=nik.budget.seasonsLeftToday();
    assert.equal(a.estimated,false);assert.equal(b.estimated,false);
    assert.equal(a.billedEstimate,b.billedEstimate,'the same both-phones total');
    assert.equal(a.billedEstimate,(1716+12)+(1301+141),'the two phones\' own meters added up, career pages of both included');
    assert.equal(a.shared.thisPhone,b.shared.partner);assert.equal(a.shared.partner,b.shared.thisPhone);
    assert.deepEqual(plain(la),plain(lb),'the same seasons left, cost per season and basis');
    assert.equal(la.basis,'shared');assert.equal(la.season,3);
    const perPhone=costs=>Math.round(costs.reduce((x,y)=>x+y,0)/costs.length);
    assert.equal(la.billedPerSeason,perPhone([323,317,1716-1390])+perPhone([288,292,1301-1010]),'each phone\'s last three season costs, added');
    assert.equal(la.seasons,Math.floor((50000-a.billedEstimate)/la.billedPerSeason));
    // Settings: identical rows except this phone / partner, which swap.
    const sa=daniel.settings(),sb=nik.settings();
    assert.equal(sa.left,sb.left,'SEASONS LEFT TODAY is the same text on both phones');
    assert.match(sa.left,/, both phones$/);
    assert.match(sa.reads,/^3,170 of 50,000 · both phones after season 3 · 1,730 here · partner 1,440$/);
    assert.match(sb.reads,/^3,170 of 50,000 · both phones after season 3 · 1,440 here · partner 1,730$/);
    // The same two documents give the same answer in either order, on either phone.
    const own=daniel.budget.meterDocuments(),theirs=nik.budget.meterDocuments();
    assert.deepEqual(plain(own.own),plain(theirs.partner));assert.deepEqual(plain(own.partner),plain(theirs.own));
    const day=a.day;
    assert.deepEqual(plain(daniel.budget.sharedEstimate(own.own,own.partner,day)),plain(nik.budget.sharedEstimate(theirs.partner,theirs.own,day)));
    rulesShape(daniel.ops.sets[0].data,'playerOne');rulesShape(nik.ops.sets[0].data,'playerTwo');
    assert.deepEqual(daniel.ops.sets.map(s=>s.path),[`rivalries/${RID}/meters/playerOne`],'Daniel writes only his own role\'s document');
    assert.deepEqual(nik.ops.sets.map(s=>s.path),[`rivalries/${RID}/meters/playerTwo`]);
    assert.deepEqual(daniel.ops.gets,[`rivalries/${RID}/meters/playerTwo`],'and reads only the partner\'s, once');
    assert.deepEqual(nik.ops.gets,[`rivalries/${RID}/meters/playerOne`]);
    // A reload keeps both documents (they are part of today's saved day).
    const reloaded=pageWithStorage(world,{uid:'nik',storage:nik.storage});
    assert.deepEqual(plain(reloaded.budget.seasonsLeftToday()),plain(lb),'a reload shows the same until the next season');
    // Reads made after the season show as "this phone +N since" on that phone only; the shared total stays the documents'.
    for(let i=0;i<40;i+=1)daniel.budget.countListenerRead();
    assert.equal(daniel.budget.readsToday().billedEstimate,a.billedEstimate);
    assert.match(daniel.settings().reads,/ · \+40 here since$/);
  });

  await check('M2 a partner seen later than 8 s is read again at +45 s (+3 and +10 min when its document is behind); until then "estimated"',async()=>{
    const world=createPair();
    const daniel=phone(world,{uid:'daniel',role:'playerOne',game:900,markGame:600,costs:[]});
    const nik=phone(world,{uid:'nik',role:'playerTwo',game:700,markGame:450,costs:[]});
    nik.acknowledge(2,{role:'playerTwo'});
    await world.advance(9000);
    assert.equal(reads(nik),1,'first read at +8 s');
    assert.equal(nik.budget.readsToday().estimated,true,'Daniel\'s page has not seen it yet: estimated');
    assert.match(nik.settings().reads,/^About [\d,]+ of 50,000 · estimated for both phones · [\d,]+ here$/);
    assert.match(nik.settings().left,/estimated/);
    await world.advance(11000);
    daniel.acknowledge(2,{role:'playerOne'});
    await world.advance(40000);
    assert.equal(reads(daniel),1);assert.equal(reads(nik),2,'the one retry at +45 s');
    assert.equal(daniel.budget.readsToday().billedEstimate,nik.budget.readsToday().billedEstimate);
    assert.deepEqual(plain(daniel.budget.seasonsLeftToday()),plain(nik.budget.seasonsLeftToday()));
    await world.advance(10*60000);
    assert.equal(reads(nik)+reads(daniel),3,'no further reads that season');
    // A partner locked at ACKNOWLEDGED (its season-1 document exists) and acknowledging 2 min later: caught by the +3 min read.
    const late=createPair();
    const d2=phone(late,{uid:'daniel',role:'playerOne',game:900,markGame:600,costs:[]});
    const n2=phone(late,{uid:'nik',role:'playerTwo',game:700,markGame:450,costs:[]});
    late.store.set(`rivalries/${RID}/meters/playerOne`,{schemaVersion:1,objectType:'readsMeter',rivalryId:RID,role:'playerOne',day:dayOf(late.clock.now),season:1,game:400,career:0,costs:[300]});
    n2.acknowledge(2,{role:'playerTwo'});
    await late.advance(60000);
    assert.equal(reads(n2),2);assert.equal(n2.budget.readsToday().estimated,true);
    await late.advance(60000);
    d2.acknowledge(2,{role:'playerOne'});
    await late.advance(9000);
    assert.equal(d2.budget.readsToday().estimated,false,'the late phone reads the partner\'s season-2 document at once');
    assert.equal(n2.budget.readsToday().estimated,true,'still estimated until the +3 min read');
    await late.advance(3*60000);
    assert.equal(reads(n2),3,'read again at +3 min');
    assert.equal(n2.budget.readsToday().billedEstimate,d2.budget.readsToday().billedEstimate,'and now both phones agree');
    assert.deepEqual(plain(n2.budget.seasonsLeftToday()),plain(d2.budget.seasonsLeftToday()));
    await late.advance(20*60000);
    assert.equal(reads(n2),3,'no read after the match');
  });

  await check('M3 fallback: missing (older build), another day, or behind -> B1 role-share estimate labelled "estimated"; four reads at most a season when missing',async()=>{
    const world=createPair();
    const nik=phone(world,{uid:'nik',role:'playerTwo',game:1000,career:50,markGame:700,costs:[280]});
    nik.acknowledge(2,{role:'playerTwo'});
    await world.advance(60000);
    assert.equal(reads(nik),2,'a missing partner document: +8 s and +45 s within the first minute');
    const today=nik.budget.readsToday(),left=nik.budget.seasonsLeftToday();
    assert.equal(today.estimated,true);assert.equal(today.shared,null);
    // The write and two missing-document reads are billed too (M7): 1 + 2 x (1 + 1).
    assert.equal(today.game,1000+1+4);
    assert.equal(today.billedEstimate,Math.round(today.game/0.45+today.career),'game reads over playerTwo\'s 0.45 share, plus career pages once');
    assert.equal(left.estimated,true);assert.equal(left.basis,'today');
    assert.equal(left.billedPerSeason,Math.round(((280+300)/2)/0.45),'this phone\'s season cost over its share');
    assert.match(nik.settings().reads,/estimated for both phones/);assert.match(nik.settings().left,/estimated at today's pace/);
    await world.advance(20*60000);
    assert.equal(reads(nik),4,'then +3 and +10 min (C-04: a season-1 partner locked at ACKNOWLEDGED writes late), and no polling after that');
    await world.advance(60*60000);
    assert.equal(reads(nik),4,'bounded: never a fifth read that season');
    // A document from another Pacific day counts as missing.
    const world2=createPair();
    const nik2=phone(world2,{uid:'nik',role:'playerTwo',game:500,markGame:250});
    world2.store.set(`rivalries/${RID}/meters/playerOne`,{schemaVersion:1,objectType:'readsMeter',rivalryId:RID,role:'playerOne',day:'2020-01-01',season:2,game:900,career:0,costs:[300]});
    nik2.acknowledge(2,{role:'playerTwo'});await world2.advance(60000);
    assert.equal(nik2.budget.meterDocuments().partner,null,'yesterday\'s document is not kept');
    assert.equal(nik2.budget.readsToday().estimated,true);
    // A partner document behind this phone's season is kept but not used.
    const world3=createPair();
    const nik3=phone(world3,{uid:'nik',role:'playerTwo',game:500,markGame:250});
    world3.store.set(`rivalries/${RID}/meters/playerOne`,{schemaVersion:1,objectType:'readsMeter',rivalryId:RID,role:'playerOne',day:dayOf(world3.clock.now),season:1,game:400,career:0,costs:[300]});
    nik3.acknowledge(2,{role:'playerTwo'});await world3.advance(60000);
    assert.equal(nik3.budget.meterDocuments().partner.season,1);
    assert.equal(nik3.budget.readsToday().estimated,true,'season 1 vs season 2: estimated');
    assert.equal(reads(nik3),2);
    await world3.advance(20*60000);
    assert.equal(reads(nik3),4,'a partner document that stays behind: read at +3 and +10 min, then not again that season');
    assert.equal(nik3.budget.readsToday().estimated,true);
    // A malformed partner document is ignored.
    assert.equal(nik3.budget.sharedEstimate({...nik3.budget.meterDocuments().own},{schemaVersion:1,objectType:'readsMeter',rivalryId:RID,role:'playerOne',day:dayOf(world3.clock.now),season:2,game:-5,career:0,costs:[]}),null);
  });

  await check('M4 Rules not deployed: the refused write never throws, stops the meter for the day, and nothing reads the partner; later refusals skip one season',async()=>{
    const world=createPair();
    const daniel=phone(world,{uid:'daniel',role:'playerOne',game:800,markGame:500,denyWrites:true});
    assert.equal(daniel.acknowledge(2,{role:'playerOne'}),true);
    await world.advance(60000);
    assert.equal(daniel.ops.sets.length,1);assert.equal(reads(daniel),0,'no partner read after a refused write');
    assert.equal(daniel.budget.meterDocuments().off,true);
    assert.equal(daniel.budget.readsToday().game,800+daniel.budget.rulesLookups.write([`rivalries/${RID}/meters/playerOne`]),'a refused write is still billed its lookup');
    assert.equal(daniel.budget.readsToday().estimated,true);
    daniel.acknowledge(3,{role:'playerOne'});await world.advance(60000);
    assert.equal(daniel.ops.sets.length,1,'no second try that day');
    // Without Firestore (an older Season Commit adapter) noteSeasonDone works as before and writes nothing.
    const world2=createPair();const old=phone(world2,{uid:'nik',role:'playerTwo',game:300,markGame:0});
    assert.equal(old.budget.noteSeasonDone(`${RID}|2`,true),true);await world2.advance(60000);
    assert.equal(old.ops.sets.length+reads(old),0);
    // Rules deployed (a write succeeded today), then refusals: only that season is skipped, never the rest of the day.
    const world3=createPair();
    const d3=phone(world3,{uid:'daniel',role:'playerOne',game:900,markGame:600});
    const n3=phone(world3,{uid:'nik',role:'playerTwo',game:700,markGame:450});
    d3.acknowledge(2,{role:'playerOne'});n3.acknowledge(2,{role:'playerTwo'});await world3.advance(60000);
    assert.equal(d3.budget.readsToday().estimated,false);
    world3.denyReads=true;
    d3.acknowledge(3,{role:'playerOne'});n3.acknowledge(3,{role:'playerTwo'});await world3.advance(60000);
    assert.equal(reads(d3),2,'a refused read: no retry that season');
    assert.equal(d3.budget.meterDocuments().off,false,'and the meter stays on');
    world3.denyReads=false;world3.denyWrites=true;
    d3.acknowledge(4,{role:'playerOne'});await world3.advance(60000);
    assert.equal(d3.ops.sets.length,3);assert.equal(reads(d3),2,'a refused write: no partner read that season');
    assert.equal(d3.budget.meterDocuments().off,false,'a write refused after one succeeded today does not stop the day');
    world3.denyWrites=false;
    d3.acknowledge(5,{role:'playerOne'});n3.acknowledge(5,{role:'playerTwo'});await world3.advance(60000);
    assert.equal(d3.ops.sets.length,4);assert.equal(d3.budget.readsToday().estimated,false,'the next season is shared again');
    assert.equal(d3.budget.readsToday().billedEstimate,n3.budget.readsToday().billedEstimate);
  });

  await check('M5 RE-05/RS-07: season 1 counts from Career Start ready; setup, idle and the previous tail go to setup; no mark, no season-1 cost',async()=>{
    const world=createPair();
    const nik=phone(world,{uid:'nik',role:'playerTwo',game:0,markGame:0});
    for(let i=0;i<300;i+=1)nik.budget.countListenerRead();
    assert.equal(nik.budget.noteSeasonStart(`${RID}|1`),true);
    assert.equal(nik.budget.noteSeasonStart(`${RID}|1`),false,'once per season');
    for(let i=0;i<250;i+=1)nik.budget.countListenerRead();
    nik.budget.noteSeasonDone(`${RID}|1`,true,{role:'playerTwo',season:1});
    const saved=JSON.parse(nik.storage.get(DAY_KEY)).bill;
    assert.deepEqual(saved.costs,[250],'season 1 is Career Start ready -> ACKNOWLEDGED');
    assert.deepEqual(saved.setupCosts,[300],'what came before is setup');
    for(let i=0;i<200;i+=1)nik.budget.countListenerRead();
    nik.budget.noteSeasonDone(`${RID}|2`,true,{role:'playerTwo',season:2});
    assert.deepEqual(JSON.parse(nik.storage.get(DAY_KEY)).bill.costs,[250,200]);
    // A page that never saw Career Start ready (a reload mid-season): season 1 only moves the mark.
    const other=phone(world,{uid:'nik2',role:'playerTwo',game:0,markGame:0});
    for(let i=0;i<400;i+=1)other.budget.countListenerRead();
    other.budget.noteSeasonDone(`pair_${'b'.repeat(64)}|1`,true,{role:'playerTwo',season:1});
    assert.deepEqual(JSON.parse(other.storage.get(DAY_KEY)).bill.costs,[],'no start mark: no season-1 cost');
    assert.equal(other.budget.seasonsLeftToday().basis,'estimate');
  });

  await check('M6 RE-08: no document is named twice in one write request; the meter document costs one lookup to read and to write',()=>{
    const billedMeter=require(path.join(ROOT,'tests/browser/support/billed-meter.cjs'));
    const table=/BEGIN generated Rules lookup table[\s\S]*?Object\.freeze\(\[\n([\s\S]*?)\n  \]\.map/.exec(source);
    assert.ok(table,'the generated table is found');
    const rows=JSON.parse(`[${table[1]}]`);
    for(const [pattern,,,docs] of rows){
      assert.equal(new Set(docs).size,docs.length,`${pattern}: a document listed twice`);
      assert.ok(!docs.some(d=>/\{root\./.test(d)),`${pattern}: root.* is after.* (request.resource.data)`);
      assert.ok(!docs.includes('rivalries/{after.rivalryId}'),`${pattern}: the written rivalryId is the match's {rivalryId}`);
      if(docs.includes('accounts/{@pair0}')||docs.includes('accounts/{@pair1}'))assert.ok(!docs.includes('accounts/{@self}'),`${pattern}: the signed-in account is one of the pair`);
    }
    // Live: the rivalry only; after Terminal Close (the final season's read) the completed-only grant also checks the account.
    assert.deepEqual(rows.find(r=>r[0]==='rivalries/*/meters/*'),['rivalries/*/meters/*',1,2,['rivalries/{rivalryId}']]);
    const world=createPair();const p=phone(world,{uid:'u',role:'playerOne',game:0});
    assert.equal(p.budget.rulesLookups.write([`rivalries/${RID}/sharedSetup/authoritative`]),5,'Shared Setup write: the pair\'s two accounts, the device, the rivalry, the Session');
    assert.equal(p.budget.rulesLookups.write([`rivalries/${RID}/transferChallenges/season_1`,`rivalries/${RID}/transferChallenges/season_1/roles/playerOne`]),8,'Transfer + own role in one request: the 7 of the public write once each, plus the public document the role rule looks up');
    assert.equal(billedMeter.writeRequestDocs(['accounts/{@self}','accounts/{@pair0}','accounts/{@pair1}','rivalries/{after.rivalryId}','rivalries/{rivalryId}','accounts/{@self}/devices/{root.updatedByDeviceId}','accounts/{@self}/devices/{after.updatedByDeviceId}']).length,4);
    assert.equal(billedMeter.writeRequestDocs(['rivalries/{before.data.rivalryId}','rivalries/{after.data.rivalryId}']).length,2,'an update that moves a pointer can reach two rivalries: not folded');
  });

  await check('M7 the meter\'s own cost: one write (1 lookup) and one read (document + 1 lookup) per phone per season, billed as game reads',async()=>{
    const world=createPair();
    const daniel=phone(world,{uid:'daniel',role:'playerOne',game:1000,career:7,markGame:700});
    const nik=phone(world,{uid:'nik',role:'playerTwo',game:800,career:9,markGame:500});
    daniel.acknowledge(2,{role:'playerOne'});nik.acknowledge(2,{role:'playerTwo'});
    await world.advance(60000);
    for(const [p,game,career] of [[daniel,1000,7],[nik,800,9]]){
      const t=p.budget.readsToday();
      assert.equal(t.game-game,3,'1 write lookup + 1 document + 1 lookup');
      assert.equal(t.career,career,'never a career page');
      assert.equal(t.shared.sinceThisPhone,3,'counted after the document was written');
    }
  });

  await check('M8 a season that starts before Pacific midnight and finishes after it keeps its measured cost (live page and a page reloaded after midnight)',async()=>{
    // The test clock starts at 2027-01-15 00:00 Pacific; one minute before it is the previous Pacific day.
    const world=createPair({now:1_800_000_000_000-60000});
    const nik=phone(world,{uid:'nik',role:'playerTwo',game:0,markGame:0});
    const before=dayOf(world.clock.now);
    assert.equal(nik.budget.noteSeasonStart(`${RID}|1`),true);
    for(let i=0;i<100;i+=1)nik.budget.countListenerRead();
    const savedBefore=JSON.parse(nik.storage.get(DAY_KEY));
    assert.equal(savedBefore.day,before);assert.equal(savedBefore.bill.startKey,`${RID}|1`);
    // A page reloaded after midnight rebuilds the new day from the saved old one.
    const reloadStorage=new Map(nik.storage);
    await world.advance(2*60000);
    assert.notEqual(dayOf(world.clock.now),before,'past Pacific midnight');
    for(let i=0;i<50;i+=1)nik.budget.countListenerRead();
    nik.budget.noteSeasonDone(`${RID}|1`,true,{role:'playerTwo',season:1});
    assert.deepEqual(JSON.parse(nik.storage.get(DAY_KEY)).bill.costs,[150],'100 before midnight + 50 after: the whole season (was dropped)');
    const reloaded=pageWithStorage(world,{uid:'nik',storage:reloadStorage});
    for(let i=0;i<50;i+=1)reloaded.budget.countListenerRead();
    reloaded.budget.noteSeasonDone(`${RID}|1`,true,{role:'playerTwo',season:1});
    assert.deepEqual(JSON.parse(reloadStorage.get(DAY_KEY)).bill.costs,[150],'the same after a reload past midnight');
    // A season that never started (no mark) still records no season-1 cost across midnight.
    const other=phone(createPair({now:1_800_000_000_000-60000}),{uid:'nik2',role:'playerTwo',game:0,markGame:0});
    for(let i=0;i<100;i+=1)other.budget.countListenerRead();
    other.budget.noteSeasonDone(`pair_${'c'.repeat(64)}|1`,true,{role:'playerTwo',season:1});
    assert.deepEqual(JSON.parse(other.storage.get(DAY_KEY)).bill.costs,[]);
  });

  await check('M9 a reload after the meter write and before the partner read resumes the bounded partner read without writing again',async()=>{
    const world=createPair();
    const daniel=phone(world,{uid:'daniel',role:'playerOne',game:900,markGame:600});
    const nik=phone(world,{uid:'nik',role:'playerTwo',game:700,markGame:450});
    daniel.acknowledge(2,{role:'playerOne'});
    await world.advance(1000);
    assert.equal(daniel.ops.sets.length,1);assert.equal(reads(daniel),0,'written, partner read still pending');
    assert.equal(daniel.budget.meterDocuments().own.season,2,'the own document is saved with the day');
    // Reload: the page and its timers are gone; the saved day (own document, season key) stays.
    world.timers.length=0;
    const again=pageWithStorage(world,{uid:'daniel',storage:daniel.storage});
    assert.equal(again.budget.meterDocuments().own.season,2);
    nik.acknowledge(2,{role:'playerTwo'});
    // The Season Commit screen may report the same ACKNOWLEDGED season again: no second write, no second sequence.
    assert.equal(again.acknowledge(2,{role:'playerOne'}),false,'the saved season key: no new snapshot');
    await world.advance(9000);
    assert.equal(again.ops.sets.length,0,'no rewrite of the own document');
    assert.equal(reads(again),1,'the resumed partner read');
    assert.equal(again.budget.readsToday().estimated,false,'both documents: shared again (was estimated for the rest of the season)');
    assert.equal(again.budget.readsToday().billedEstimate,nik.budget.readsToday().billedEstimate);
    assert.deepEqual(plain(again.budget.seasonsLeftToday()),plain(nik.budget.seasonsLeftToday()));
    await world.advance(20*60000);
    again.acknowledge(2,{role:'playerOne'});await world.advance(20*60000);
    assert.equal(reads(again),1,'matched: no further reads that season');
    // Partner never arrives after a reload: still bounded (four reads for a missing document), and only once per page.
    const world2=createPair();
    const lone=phone(world2,{uid:'daniel',role:'playerOne',game:900,markGame:600});
    lone.acknowledge(2,{role:'playerOne'});await world2.advance(1000);
    world2.timers.length=0;
    const lone2=pageWithStorage(world2,{uid:'daniel',storage:lone.storage});
    for(let i=0;i<3;i+=1){lone2.acknowledge(2,{role:'playerOne'});await world2.advance(20*60000);}
    assert.equal(reads(lone2),4,'a missing partner document after a reload: four reads, then none');
    assert.equal(lone2.ops.sets.length,0);
    // A page that already ran its sequence does not run another when the screen reports the season again.
    const world3=createPair();
    const d3=phone(world3,{uid:'daniel',role:'playerOne',game:900,markGame:600});
    d3.acknowledge(2,{role:'playerOne'});await world3.advance(20*60000);
    assert.equal(reads(d3),4);
    d3.acknowledge(2,{role:'playerOne'});await world3.advance(20*60000);
    assert.equal(reads(d3),4,'no second sequence on the same page');
  });

  await check('M10 C-04: a phone locked as season 1 is confirmed (no partner document exists yet) still ends on the same shared total as its partner',async()=>{
    // Lane C repro: Nik acknowledges season 1 first; Daniel's phone was locked and acknowledges 75 s later. In season 1 there is no
    // partner document at all (rivalries/{rid}/meters/{role} is per rivalry), so before the fix Nik read it at +8 s and +53 s only,
    // never again that season: Nik "About ... estimated", Daniel "... both phones", until season 2 (never, in a 1-season Showdown).
    const world=createPair();
    const daniel=phone(world,{uid:'daniel',role:'playerOne',game:900,markGame:0});
    const nik=phone(world,{uid:'nik',role:'playerTwo',game:700,markGame:0});
    nik.acknowledge(1,{role:'playerTwo'});
    await world.advance(75000);
    daniel.acknowledge(1,{role:'playerOne'});
    await world.advance(30*60000);
    const a=daniel.budget.readsToday(),b=nik.budget.readsToday();
    assert.equal(a.estimated,false,'Daniel: both documents');
    assert.equal(b.estimated,false,'Nik: both documents too (read again after the partner wrote)');
    assert.equal(b.billedEstimate,a.billedEstimate,'the same both-phones total');
    assert.deepEqual(plain(nik.budget.seasonsLeftToday()),plain(daniel.budget.seasonsLeftToday()),'the same seasons left');
    assert.equal(nik.settings().reads.replace(/ · \+[\d,]+ here since$/,'').replace(/ · [\d,]+ here · partner [\d,]+/,''),daniel.settings().reads.replace(/ · \+[\d,]+ here since$/,'').replace(/ · [\d,]+ here · partner [\d,]+/,''),'Settings shows the same FREE ONLINE USE TODAY total');
    assert.ok(reads(nik)<=4,'still bounded: at most four partner reads a season');
    // Locked for 12 minutes: the +10 min read (13.9 min after the first write) still catches it.
    const slow=createPair();
    const d2=phone(slow,{uid:'daniel',role:'playerOne',game:900,markGame:0});
    const n2=phone(slow,{uid:'nik',role:'playerTwo',game:700,markGame:0});
    n2.acknowledge(1,{role:'playerTwo'});await slow.advance(12*60000);
    d2.acknowledge(1,{role:'playerOne'});await slow.advance(30*60000);
    assert.equal(n2.budget.readsToday().billedEstimate,d2.budget.readsToday().billedEstimate,'locked 12 min: the phones agree');
  });

  console.log(`PASS r87 shared reads meter contracts: ${checks} checks`);
})().catch(error=>{console.error(error);process.exit(1);});

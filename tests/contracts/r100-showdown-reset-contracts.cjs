#!/usr/bin/env node
'use strict';
// Phoenix W5 (r100): the page never reloads between Showdowns. One "new Showdown" reset (the first block of
// js/persistentNikDanielPair.js, window.CareerModeShowdownReset; modules add their clear to window.CareerModeShowdownClears) runs every registered clear when a rivalry this page has not seen before appears and when the
// ended Showdown is let go on Home. This contract proves the reset itself, runs every real clear in a sandbox, and keeps the
// census: a js/ module that keeps Showdown data (mentions rivalryId and holds module-level mutable state) must register, or be
// listed below as exempt with the reason. A new module that does neither fails here.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
let passed=0;const ok=label=>{passed+=1;console.log(`PASS ${label}`);};

// Every module that registers, with the name it registers under (audited at gameplay/r100 cbd4ddea).
const REGISTERED=Object.freeze({
  productionSharedShowdownSetup:'shared-setup',
  productionSharedShowdownPresentation:'setup-presentation',
  leagueRouletteStep:'league-roulette',
  clubDrawStep:'ball-game',
  specialPlayerChip:'special-player-chip',
  productionSharedCareerStart:'career-start',
  productionSharedTransferChallenge:'transfer-war',
  iconGuessStep:'prime-pack',
  chamberMenStep:'chamber-men',
  squadSheetStep:'squad-sheet',
  productionSharedSeasonResults:'season-results',
  productionSharedSeasonCommit:'season-commit',
  productionSharedCanonicalScoring:'canonical-scoring',
  productionSharedHistoryConvergence:'history-convergence',
  productionSharedMultiSeasonProgression:'multi-season',
  productionSharedJourneyReconnect:'journey-reconnect',
  productionSharedJourneyConflicts:'journey-conflicts',
  productionSharedLocalReconciliation:'local-reconciliation',
  productionSharedFinalReconciliation:'final-reconciliation',
  productionSharedTerminalClose:'terminal-close',
  seasonFinalV10:'showdown-champion'
});
// Modules that mention rivalryId and keep module-level state but hold no Showdown data to forget, and why.
const EXEMPT=Object.freeze({
  persistentNikDanielPair:'hosts the reset and is the source of which Showdown is live; its ended-rivalry guards must outlive a Showdown (pairing, never cleared)',
  rosterRouletteStep:'the Russian Roulette no-WebGL skip is a fact about this device for this visit (M9), kept; its runs are work in flight',
  sparkConnectedRivalry:'pairing/joining: the attached rivalry and its binding are account level and re-read for each Showdown (cleanup safety: never cleared)',
  sparkRemoteJoining:'pairing/joining: the private session is keyed by rivalry and session and retires ended rivalries itself (never cleared)',
  sparkPrivatePairing:'pairing/joining and the reads meter: device registration and account level, never Showdown data',
  onlinePlayerIdentity:'sign-in and Home tile: account level; the live tile is keyed by rivalry and redrawn from the pair',
  productionSharedJourneyEntry:'navigation flow only: in-flight promises and once-per-rivalry guards that must outlive the Showdown',
  specialPlayerReveal:'an in-flight reveal run only, no Showdown data',
  careerStartMarker:'the real-career marker is account level (History and career), not one Showdown',
  careerSummaryStore:'career totals for History, Trophy Room and Legacy: they must keep every finished Showdown',
  sparkClosedShowdownCareerLoader:'finished Showdowns for History: kept so moving through History stays fast',
  rivalryLegacyV10:'career pages cache (History, Legacy): every finished Showdown, not the live one',
  touchlineGazette:'bounded caches keyed by rivalry and season (one squad ask per paper, warmed papers) or by picture URL; a closed rivalry refuses a re-ask, so forgetting would only add refused reads',
  showdownModes:'Settings: the account career marker and Settings messages',
  settings:'Settings dialog handles and messages, no Showdown data',
  menuExperience:'Home menu handles and feedback flags, no Showdown data',
  restore:'a backup restore in flight only, no Showdown data',
  rosterRoulette:'pure rules: a name-normalising cache, no Showdown data',
  ssjrPhysicalJourneyAcceptance:'the physical-run recorder: its own stored record per run, never game state'
});
const clearBody=(source,name)=>{const head=`["${name}"]=()=>{`,at=source.indexOf(head);if(at<0)return '';const from=at+head.length,to=source.indexOf('};}catch(_error){}',from);return to>from?source.slice(from,to):'';};
const REGISTERS=/CareerModeShowdownClears=\{\}\)\)\["/;
function holdsShowdownState(source){
  if(!/rivalryId/.test(source))return false;
  return /^ {2}let |^let /m.test(source)||/^ {2}const [A-Za-z_$][\w$]*=new (?:Map|Set|WeakMap)\(\)/m.test(source);
}

// 1. The reset itself, as js/persistentNikDanielPair.js defines it.
function resetBlock(){
  const text=read('js/persistentNikDanielPair.js'),start=text.indexOf('/* showdown-reset:begin */'),end=text.indexOf('/* showdown-reset:end */');
  assert.ok(start===0&&end>start,'the reset is the first block of js/persistentNikDanielPair.js (it exists before the pair first sets its state)');
  return text.slice(start,end);
}
function resetWorld(){
  const events=new Map(),sandbox={Date,addEventListener:(type,fn)=>events.set(type,fn)};sandbox.window=sandbox;
  vm.runInNewContext(resetBlock(),sandbox);
  const api=sandbox.CareerModeShowdownReset;
  return {api:{...api,register:(name,clear)=>{sandbox.CareerModeShowdownClears[name]=clear;return true;}},fire:type=>events.get(type)?.({detail:{}}),sandbox};
}
const X='pair_'+'a'.repeat(64),Y='pair_'+'b'.repeat(64),Z='pair_'+'c'.repeat(64);
{
  const {api,fire}=resetWorld(),calls=[];
  assert.equal(api.register('one',reason=>calls.push(`one:${reason}`)),true);
  assert.equal(api.register('two',reason=>{calls.push(`two:${reason}`);throw new Error('boom');}),true);
  assert.equal(api.register('three',reason=>calls.push(`three:${reason}`)),true);
  api.register('not-a-clear',null);
  assert.deepEqual([...api.registered()],['one','two','three','not-a-clear']);
  assert.equal(api.noteRivalry(X),false,'the first rivalry on a page resets nothing (a fresh page has nothing earlier)');assert.equal(calls.length,0);
  assert.equal(api.noteRivalry(X),false,'the same rivalry again resets nothing');
  for(const bad of [null,undefined,'','pair_xyz','session_'+'a'.repeat(64)])assert.equal(api.noteRivalry(bad),false,`${bad} is ignored`);
  assert.equal(calls.length,0);
  assert.equal(api.noteRivalry(Y.toUpperCase().replace('PAIR_','pair_')),true,'a rivalry never seen on this page is a new Showdown');
  assert.deepEqual(calls,['one:new-showdown','two:new-showdown','three:new-showdown'],'every clear runs, in order, and one that throws never stops the rest');
  assert.deepEqual([...api.lastRun().cleared],['one','three']);assert.deepEqual([...api.lastRun().failed],['two']);
  calls.length=0;assert.equal(api.noteRivalry(X),false,'an earlier rivalry seen again never resets (no flapping)');assert.equal(api.noteRivalry(Y),false);assert.equal(calls.length,0);
  fire('career-mode-permanent-pair-ended');assert.deepEqual(calls,['one:showdown-ended','two:showdown-ended','three:showdown-ended'],'the ended Showdown let go on Home clears too');
  calls.length=0;assert.equal(api.noteRivalry(Z),true);assert.equal(calls.length,3);assert.equal(api.runs(),3);
  ok('R1 the reset runs every clear for a new rivalry and for the ended Showdown, never for the first or an earlier rivalry');
}
{
  // A module that loads before the pair file has already put its clear in the Map; the reset keeps it.
  const sandbox={Date,addEventListener(){}},early=[];sandbox.CareerModeShowdownClears={early:()=>early.push(1)};
  vm.runInNewContext(resetBlock(),sandbox);sandbox.CareerModeShowdownReset.noteRivalry(X);sandbox.CareerModeShowdownReset.noteRivalry(Y);
  assert.equal(early.length,1,'a clear added before the reset loaded still runs');
}
{
  const {api}=resetWorld();let inner=null;
  api.register('reenter',()=>{inner=api.reset('inner');});api.noteRivalry(X);api.noteRivalry(Y);
  assert.equal(inner,null,'a clear that asks for another reset is ignored (no re-entry)');assert.equal(api.runs(),1);
  ok('R2 the reset never re-enters itself, and a clear added before it loaded still runs');
}
{
  const pair=read('js/persistentNikDanielPair.js');
  const set=/function pairSetState\(next\)\{state=pairFreezeDeep\(pairHeldIfEnded\(\{\.\.\.state,\.\.\.next\}\)\);pairRememberActiveShell\(\);([^]*?)for\(const listener of pairListeners\)/.exec(pair);
  assert.ok(set,'pairSetState is where the live rivalry changes');
  assert.match(set[1],/const reset=root\.CareerModeShowdownReset;reset\?\.noteRivalry\?\.\(state\.closedRivalryId\);/);
  assert.match(set[1],/reset\?\.noteRivalry\?\.\(state\.rivalryId\);/,'the pair tells the reset about the live rivalry before its listeners run');
  for(const file of ['js/sparkConnectedRivalry.js','js/sparkRemoteJoining.js'])assert.doesNotMatch(read(file),/noteRivalry/,`${file} does not drive the reset (one source only: an attached earlier rivalry would flap)`);
  ok('R3 one source drives the reset: the permanent pair, before its listeners');
}

// 2. Every real clear runs in a sandbox: it never throws, never leaks a global, never reads, writes or renders.
function sandboxFor(touches){
  const stub=()=>new Proxy(function(){},{get:(_t,k)=>k===Symbol.toPrimitive?()=>'':k==='then'?undefined:stub(),apply:()=>stub(),construct:()=>stub()});
  const doc={getElementById:id=>{touches.push(`getElementById:${id}`);return null;},querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>stub(),addEventListener(){},removeEventListener(){},documentElement:stub(),head:stub(),body:stub(),visibilityState:'visible'};
  const storage={getItem:()=>null,setItem:()=>touches.push('storage-write'),removeItem:()=>touches.push('storage-write')};
  const sandbox={console:{log(){},warn(){},error(){}},document:doc,navigator:{onLine:true,userAgent:''},location:{search:'',href:'http://localhost/',hostname:'localhost'},
    setTimeout:()=>0,clearTimeout(){},setInterval:()=>{touches.push('setInterval');return 0;},clearInterval(){},requestAnimationFrame:()=>0,cancelAnimationFrame(){},addEventListener(){},removeEventListener(){},dispatchEvent:()=>{touches.push('event');return true;},
    MutationObserver:class{observe(){}disconnect(){}},CustomEvent:class{},Event:class{},matchMedia:()=>({matches:false,addEventListener(){}}),localStorage:storage,sessionStorage:storage,crypto:{getRandomValues:b=>b},performance:{now:()=>0}};
  sandbox.window=sandbox;sandbox.self=sandbox;sandbox.globalThis=sandbox;return sandbox;
}
for(const [module,name] of Object.entries(REGISTERED)){
  const file=`js/${module}.js`,source=read(file),touches=[],regs=new Map(),sandbox=sandboxFor(touches);
  const marks=source.match(/\(root\.CareerModeShowdownClears\|\|\(root\.CareerModeShowdownClears=\{\}\)\)\["([a-z0-9-]+)"\]=/g)||[];
  assert.deepEqual(marks,[`(root.CareerModeShowdownClears||(root.CareerModeShowdownClears={}))["${name}"]=`],`${file} registers exactly once, as ${name}`);
  const regsObject={};sandbox.CareerModeShowdownClears=regsObject;
  vm.runInNewContext(source,sandbox,{filename:file});
  for(const [n,fn] of Object.entries(regsObject))regs.set(n,fn);
  assert.equal(typeof regs.get(name),'function',`${file} registered ${name} when it loaded`);
  const keys=new Set(Object.keys(sandbox));touches.length=0;
  for(const reason of ['new-showdown','showdown-ended','new-showdown'])regs.get(name)(reason);
  assert.deepEqual(Object.keys(sandbox).filter(k=>!keys.has(k)),[],`${name}: the clear leaks no global (every name it resets is the module's own)`);
  assert.deepEqual(touches.filter(t=>t!=='setInterval'&&!/^getElementById:/.test(t)),[],`${name}: the clear writes no storage and sends no event`);
  const body=clearBody(source,name);
  assert.ok(body,`${name}: the clear is one line beside the registration`);
  assert.doesNotMatch(body,/\b(getDocs?|runTransaction|setDoc|onSnapshot|refresh\w*|read\w*|write\w*|publish\w*|\w*[rR]ender\w*|dispatchEvent|commit\w*)\(/,`${name}: the clear never reads, writes or renders`);
}
ok(`R4 all ${Object.keys(REGISTERED).length} clears load, run three times without a throw, leak no global, write nothing and read nothing`);

// 3. The census.
{
  const files=fs.readdirSync(path.join(ROOT,'js')).filter(f=>f.endsWith('.js')).sort();
  const holders=files.map(f=>f.replace(/\.js$/,'')).filter(m=>holdsShowdownState(read(`js/${m}.js`)));
  const unlisted=holders.filter(m=>!Object.hasOwn(REGISTERED,m)&&!Object.hasOwn(EXEMPT,m));
  assert.deepEqual(unlisted,[],`these modules keep Showdown state and neither register with CareerModeShowdownReset nor are exempt with a reason: ${unlisted.join(', ')}`);
  for(const m of Object.keys(EXEMPT)){assert.ok(files.includes(`${m}.js`),`exempt ${m} still exists`);assert.ok(EXEMPT[m].length>20,`${m} has a reason`);assert.ok(holders.includes(m),`exempt ${m} still keeps rivalry state (otherwise drop it from the list)`);assert.doesNotMatch(read(`js/${m}.js`),REGISTERS,`exempt ${m} does not also register`);}
  const registering=files.filter(f=>REGISTERS.test(read(`js/${f}`))).map(f=>f.replace(/\.js$/,'')).sort();
  assert.deepEqual(registering,Object.keys(REGISTERED).sort(),'the registered list is exactly the modules that register');
  assert.equal(new Set(Object.values(REGISTERED)).size,Object.keys(REGISTERED).length,'every clear has its own name');
  ok(`R5 census: ${holders.length} modules keep rivalry state; ${Object.keys(REGISTERED).length} register, ${Object.keys(EXEMPT).length} are exempt with a reason, none is unlisted`);
}
// 4. What the clears must keep: History, career and pairing data, and the once-per-rivalry close guards.
{
  const clear=clearBody(read('js/productionSharedTerminalClose.js'),'terminal-close');assert.ok(clear);
  assert.doesNotMatch(clear,/endedRivalryIds|automaticAttempts/,'Terminal Close keeps its once-per-rivalry guards (no second close of an ended Showdown)');
  for(const module of Object.keys(REGISTERED)){const body=clearBody(read(`js/${module}.js`),REGISTERED[module]);assert.ok(body,module);
    assert.doesNotMatch(body,/\b(installed|setupApi|provider|unsubscribe\w*|pollTimer|timerLoop|providerChain|operationTail|busy)\s*=/,`${module}: the clear leaves install flags, API handles, listeners, timers and work in flight alone`);}
  const champion=clearBody(read('js/seasonFinalV10.js'),'showdown-champion');assert.ok(champion);
  assert.doesNotMatch(champion,/closedHistoryReads|golden/,'History reads of finished Showdowns and the Golden marks stay');
  ok('R6 the clears keep History, career and pairing data, the close guards and every install/listener/timer');
}
console.log(`r100 showdown reset contracts: ${passed} passed`);

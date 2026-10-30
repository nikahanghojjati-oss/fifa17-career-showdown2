'use strict';
// r87 one-tap Rematch (Nik 2026-10-29): a REMATCH button on the Final Winner of a CLOSED Showdown. Daniel's starts a new
// Showdown with the same length and pairing through the normal START: the seasons screen opens with that length picked (Nik
// 2026-10-29 "Show it, preset"), and its own START leads to the usual league wheel with WAITING; Nik's takes him to Showdown Home, where his JOIN tile picks up Daniel's code. No new
// Firestore path, no Rules change, no polling, the same reads as a normal START, and nothing about scoring changes.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const Season=require('../../js/seasonFinalV10.js');
const fixtures=require('../support/active-showdown-fixtures.cjs');
const {projection,result}=require('../support/career-fixture-helpers.cjs');
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};

(async()=>{
// R1 the button's frame: only a CLOSED Showdown's completed Final Winner, the closed witness's own length, Daniel starts.
{
  for(const totalSeasons of [1,3,5,10]){
    const seasons=Array.from({length:totalSeasons},(_,i)=>[result({leaguePosition:1+(i%3),championsLeague:i===0}),result({leaguePosition:2})]);
    const p=projection({seed:({1:"1",3:"3",5:"5",10:"a"})[totalSeasons],totalSeasons,seasons});
    const reconciliation=fixtures.finalReconciliation(p),closed=fixtures.closed(p);
    const final=Season.finalFrame(reconciliation,closed,fixtures.history(p));
    assert.equal(final.state,'completed');
    assert.deepEqual({...Season.rematchFrame(final,closed,fixtures.identity('daniel'))},{seasons:totalSeasons,starter:true},`${totalSeasons}: Daniel starts`);
    assert.deepEqual({...Season.rematchFrame(final,closed,fixtures.identity('nik'))},{seasons:totalSeasons,starter:false},`${totalSeasons}: Nik waits for Daniel`);
    // not yet closed: the existing CLOSE SHOWDOWN path stays the only action (no rematch before the close)
    assert.equal(Season.rematchFrame(Season.finalFrame(reconciliation,null,fixtures.history(p)),null,fixtures.identity('daniel')),null);
    assert.equal(Season.rematchFrame(final,{...closed,phase:'READY'},fixtures.identity('daniel')),null);
    assert.equal(Season.rematchFrame(final,{...closed,terminal:false},fixtures.identity('daniel')),null);
    assert.equal(Season.rematchFrame(final,{...closed,rivalryId:'pair_'+'0'.repeat(64)},fixtures.identity('daniel')),null,'another rivalry\'s close never counts');
    assert.equal(Season.rematchFrame(final,closed,{...fixtures.identity('daniel'),status:'connecting'}),null,'no player yet: no button');
    assert.equal(Season.rematchFrame({status:'unavailable'},closed,fixtures.identity('daniel')),null);
  }
  const p=projection({seed:'e',totalSeasons:3,seasons:[[result(),result()],[result(),result()],[result(),result()]]}),closed=fixtures.closed(p);
  const final=Season.finalFrame(fixtures.finalReconciliation(p),closed,fixtures.history(p));
  for(const bad of [0,2,4,7,11,'3',null])assert.equal(Season.rematchFrame(final,{...closed,terminalWitness:{...closed.terminalWitness,totalSeasons:bad}},fixtures.identity('daniel')),null,`length ${bad}`);
  ok('R1','REMATCH only on a CLOSED Final Winner, with the closed length (1/3/5/10); Daniel starts, Nik waits');
}

// R2 the Final Winner wiring: one more button in the same exit row, Daniel's runs openRematch, Nik's goes Home; nothing moves.
{
  const src=read('js/seasonFinalV10.js');
  assert.match(src,/const rematch=rematchFrame\(final,closed,s\.identity\);[\s\S]{0,600}if\(!sp\)return \{final,rematch\};\n\s*return \{[^\n]*,rematch\};/,'the rematch frame comes from states the page already holds, with or without the r86 Special Player chips');
  assert.match(src,/renderFinal\(host,frame\.final,frame\.rematch\);/);
  const button=src.slice(src.indexOf('const REMATCH_ID="finalWinnerRematch"'),src.indexOf('function renderFinal('));
  assert.match(button,/if\(!rematch\.starter\)\{if\(typeof root\.navigateTo==="function"\)void Promise\.resolve\(root\.navigateTo\("mainMenu"\)\)/,'Nik: Showdown Home (the existing JOIN tile)');
  assert.match(button,/identity\.openRematch\(rematch\.seasons\)/,'Daniel: the canonical START with the closed length');
  assert.match(button,/if\(rematchBusy\|\|typeof identity\?\.openRematch!=="function"\)return;/,'a second tap while starting does nothing');
  assert.match(button,/const back=actions\.querySelector\(":scope > \.backButton"\);actions\.insertBefore\(button,back\|\|null\);/,'between REVIEW SEASON and BACK TO SHOWDOWN HOME');
  assert.doesNotMatch(button,/getDoc|setDoc|onSnapshot|runTransaction|collection\(|fetch\(|setInterval|setTimeout/,'no read, write, poll or timer');
  assert.match(src,/if\(final\)\{root\.document\.getElementById\(REMATCH_ID\)\?\.remove\(\);/,'the button leaves with the Final Winner (the product action row goes back clean)');
  assert.match(src,/sfRematchButton\(actions,rematch\);/);
  assert.match(src,/\.seasonEntryActions:has\(> #finalWinnerRematch\) \{ grid-template-columns:repeat\(3,minmax\(0,1fr\)\); \}/,'phones split the same row in three');
  assert.doesNotMatch(src.slice(src.indexOf('/* r87 Rematch: a third exit')),/rgba\(0, ?0, ?0, ?\.[1-9]\)\s*;?\s*\}|backdrop-filter|inset:0;[^}]*background/,'no dimming layer');
  ok('R2','one REMATCH button in the Final Winner exit row; Daniel -> openRematch, Nik -> Home; removed with the screen; no IO');
}

// R3 Daniel's rematch is the same START: same reads, then the seasons screen with the closed length picked (no auto-start).
async function identityRun({managerId='daniel',decision,call,seasons=3}){
  const calls={reads:0,which:0,nav:[],prepare:[],follow:[],errors:[]};
  const round={_v:'1',get value(){return this._v;},set value(v){if(['1','3','5','10'].includes(String(v)))this._v=String(v);}};
  const node=()=>({style:{},dataset:{},classList:{add(){},remove(){},contains:()=>false,toggle(){}},setAttribute(){},getAttribute:()=>null,removeAttribute(){},append(){},appendChild(){},querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},remove(){},replaceChildren(){},textContent:''});
  const document={getElementById:id=>id==='roundAmount'?round:null,createElement:()=>node(),querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},head:node(),body:node(),documentElement:node()};
  const pairApi={getState:()=>({initialized:true,status:'paired'}),readPartnerRecord:async()=>{calls.reads+=1;},readPartnerSide:async()=>{calls.reads+=1;},getPartnerSideState:()=>({status:'mutual'}),getJoinNoteState:()=>({note:null}),subscribe:()=>()=>{}};
  const ctx={console,setTimeout,clearTimeout,Promise,document,navigator:{onLine:true},
    CareerModePersistentNikDanielPair:pairApi,
    CareerModeWhichShowdownIsLive:{read:async()=>{calls.which+=1;return decision;}},
    CareerModeShowdownModes:{install(){},beforeSeasonsStart:async()=>true,resolve:async()=>({}),getView:()=>({mode:'real'})},
    CareerModeProductionSharedJourneyEntry:{install(){},preparePairingShell:async options=>{calls.prepare.push({seasons:round.value,gate:typeof options?.beforeCreate});return true;},followStartDecision:async(d,options)=>{calls.follow.push(options===undefined?'none':JSON.stringify(options));return options&&options.openSeasons===false&&d.action==='close-then-new'?'seasons':true;}},
    navigateTo:async id=>{calls.nav.push(id);return true;},
    reportApplicationError:(_c,e)=>calls.errors.push(e&&e.message)};
  ctx.globalThis=ctx;vm.createContext(ctx);
  // The module's private player is set as a signed-in, ready manager (initialize() needs Firebase); nothing else changes.
  let src=read('js/onlinePlayerIdentity.js');
  const from='let state=Object.freeze({status:"idle",initialized:false,busy:false,online:!root.navigator||root.navigator.onLine!==false,accountId:null,managerId:null,managerLabel:null,deviceId:null,registered:false,';
  assert.ok(src.includes(from),'identity initial state literal');
  src=src.replace(from,`let state=Object.freeze({status:"ready",initialized:true,busy:false,online:true,accountId:"acct",managerId:${JSON.stringify(managerId)},managerLabel:"M",deviceId:null,registered:true,`);
  vm.runInContext(src,ctx,{filename:'onlinePlayerIdentity.js'});
  const identity=ctx.CareerModeOnlinePlayerIdentity;ctx.CareerModeOnlinePlayerIdentity=identity;
  const out=await (call==='rematch'?identity.openRematch(seasons):identity.openStart());
  return {calls,out,round:round.value};
}
{
  const fresh={action:'new',rivalryId:null,totalSeasons:null,reason:'new'};
  const normal=await identityRun({decision:fresh,call:'start'}),rematch=await identityRun({decision:fresh,call:'rematch',seasons:5});
  assert.deepEqual(normal.calls.nav,['createShowdown'],'Home START opens the seasons screen');assert.equal(normal.calls.prepare.length,0);
  assert.deepEqual(rematch.calls.nav,['createShowdown'],'the rematch shows the seasons screen');
  assert.deepEqual(rematch.calls.prepare,[],'nothing starts until Daniel taps the seasons screen\'s START');
  assert.equal(rematch.round,'5');
  assert.ok(normal.calls.reads>0&&normal.calls.which===1,'the harness sees START\'s reads');
  assert.equal(rematch.calls.reads,normal.calls.reads,'same partner reads as a normal START');assert.equal(rematch.calls.which,normal.calls.which,'same START decision read');
  assert.deepEqual(rematch.calls.errors,[]);
  for(const seasons of [1,3,10]){const r=await identityRun({decision:fresh,call:'rematch',seasons});assert.equal(r.round,String(seasons));assert.deepEqual(r.calls.nav,['createShowdown']);assert.equal(r.calls.prepare.length,0);}
  // the ended Showdown is closed first by the entry (the final-screen terminal close), then the seasons screen, preset
  const ended={action:'close-then-new',rivalryId:'pair_'+'a'.repeat(64),totalSeasons:3,reason:'ended-not-closed'};
  const endedNormal=await identityRun({decision:ended,call:'start'}),endedRematch=await identityRun({decision:ended,call:'rematch',seasons:3});
  assert.deepEqual(endedNormal.calls.follow,['none']);assert.equal(endedNormal.calls.prepare.length,0);
  assert.deepEqual(endedRematch.calls.follow,['{"openSeasons":false}']);assert.deepEqual(endedRematch.calls.nav,['createShowdown']);assert.equal(endedRematch.round,'3');assert.equal(endedRematch.calls.prepare.length,0);
  assert.equal(endedRematch.calls.reads,endedNormal.calls.reads);assert.equal(endedRematch.calls.which,endedNormal.calls.which);
  // any other START answer is followed exactly as from Home (no create)
  const live={action:'continue',rivalryId:'pair_'+'b'.repeat(64),totalSeasons:3,reason:'continue'};
  const cont=await identityRun({decision:live,call:'rematch'});assert.equal(cont.calls.prepare.length,0);assert.deepEqual(cont.calls.nav,[]);
  // Nik never starts one; bad lengths start nothing
  const nik=await identityRun({managerId:'nik',decision:fresh,call:'rematch'});
  assert.equal(nik.out,null);assert.equal(nik.calls.which,0);assert.equal(nik.calls.reads,0);assert.equal(nik.calls.prepare.length,0);
  for(const bad of [0,2,'x',null,11]){const r=await identityRun({decision:fresh,call:'rematch',seasons:bad});assert.equal(r.out,null);assert.equal(r.calls.which,0);assert.equal(r.calls.prepare.length,0);}
  // a Home START after a rematch is a plain START again (the length is handed over once)
  const src=read('js/onlinePlayerIdentity.js');
  assert.match(src,/async function openCanonicalStart\(\)\{if\(canonicalStartFlowPromise\)return canonicalStartFlowPromise;const rematch=rematchSeasonsNext;rematchSeasonsNext=null;/);
  assert.match(src,/if\(canonicalStartFlowPromise\)return canonicalStartFlowPromise;rematchSeasonsNext=seasons;return openCanonicalStart\(\);\}/,'a tap during a running START joins it and hands nothing over');
  ok('R3','Daniel\'s REMATCH = Home START\'s reads, then the seasons screen with the closed length picked (new or after the close); Nik and bad lengths start nothing');
}

// R4 the entry hands the seasons step back instead of opening it, only when asked; the close itself is unchanged.
{
  const calls={nav:[],settled:0,close:0,refresh:0};
  const ctx={console,setTimeout,clearTimeout,Promise,
    document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},createElement:()=>({})},
    CareerModePersistentNikDanielPair:{settleOnHome:()=>{calls.settled+=1;}},
    CareerModeProductionSharedTerminalClose:{install(){},getState:()=>({phase:'CLOSED'}),refresh:async()=>{calls.refresh+=1;return {phase:'CLOSED'};},close:async()=>{calls.close+=1;return {ok:true};}},
    navigateTo:async id=>{calls.nav.push(id);return true;},reportApplicationError(){}};
  ctx.globalThis=ctx;vm.createContext(ctx);
  vm.runInContext(read('js/productionSharedJourneyEntry.js'),ctx,{filename:'productionSharedJourneyEntry.js'});
  const entry=ctx.CareerModeProductionSharedJourneyEntry,decision={action:'close-then-new',rivalryId:'pair_'+'c'.repeat(64)};
  assert.equal(await entry.followStartDecision(decision,{openSeasons:false}),'seasons');
  assert.deepEqual(calls.nav,[],'no seasons screen for the rematch');assert.equal(calls.settled,1,'the closed Showdown is let go first');
  assert.equal(calls.close,0,'already CLOSED: no second close write');assert.equal(calls.refresh,0,'already CLOSED: no read');
  assert.equal(await entry.followStartDecision(decision),true);
  assert.deepEqual(calls.nav,['createShowdown'],'a normal START still opens the seasons screen');
  ok('R4','the entry answers "seasons" for the rematch after the same close and settle; a normal START still opens the seasons screen');
}

// R5 no new Firebase surface: no Firestore path, no Rules change, no polling, and the deadline-free shared modules are untouched.
{
  const identity=read('js/onlinePlayerIdentity.js'),entry=read('js/productionSharedJourneyEntry.js');
  const identityAdded=identity.slice(identity.indexOf('// r87 one-tap Rematch'),identity.indexOf('async function openCanonicalStart(){'));
  const followAt=entry.indexOf('async function followStartDecision(decision,options){');
  const entryAdded=entry.slice(followAt,entry.indexOf('if(!decision)return false;',followAt));
  assert.match(identityAdded,/function openRematch\(totalSeasons\)/);assert.match(identityAdded,/async function showSeasonsPreset\(seasons\)/);
  assert.match(entryAdded,/seasonsHandOff=true;try\{return await followStartDecision\(decision\);\}finally\{seasonsHandOff=false;\}/);
  const added=identityAdded+'\n'+entryAdded;
  assert.doesNotMatch(added,/getDoc|setDoc|updateDoc|onSnapshot|runTransaction|collection\(|doc\(|setInterval/,'the rematch adds no Firestore call or poll');
  assert.doesNotMatch(read('firestore.rules'),/rematch/i,'no Rules change for the rematch');
  ok('R5','no new Firestore call, path, Rules entry or poll');
}
console.log(`r87 rematch contracts: ${checks} groups passed`);
})().catch(error=>{console.error(error);process.exit(1);});

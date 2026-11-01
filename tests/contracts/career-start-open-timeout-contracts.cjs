#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('js/productionSharedCareerStart.js','utf8');
const ERROR='Career Start took too long. Check your connection and tap again.';
const flush=async()=>{for(let i=0;i<80;i++)await Promise.resolve();};
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
function world(opts={}){
  const nodes=[],timers=new Map(),calls=[];let now=0,seq=0;
  class Node{
    constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.attributes={};this.listeners={};this.disabled=false;this.textContent='';const classes=new Set();this.classList={contains:x=>classes.has(x),add:x=>classes.add(x),remove:x=>classes.delete(x)};nodes.push(this);}
    append(...children){this.children.push(...children);} replaceChildren(){this.children=[];}
    setAttribute(k,v){this.attributes[k]=v;} getAttribute(k){return this.attributes[k];} hasAttribute(k){return k in this.attributes;} removeAttribute(k){delete this.attributes[k];}
    addEventListener(k,fn){this.listeners[k]=fn;} querySelector(selector){return this.descendants().find(n=>selector==='.remoteJoiningBody'&&n.className==='remoteJoiningBody');}
    descendants(){return this.children.flatMap(n=>[n,...n.descendants()]);}
    tap(){assert.equal(this.disabled,false,'button is enabled');return this.listeners.click?.();}
  }
  const body=new Node('body'),button=new Node('button');button.id='continueClubAssignment';body.append(button);
  const state={ready:true,rivalryId:'r',sessionId:'s',deviceId:'d',managerRole:'playerOne',setup:{phase:'SHOWDOWN_CONFIRMED',revision:6,clubs:{playerOne:'Club A',playerTwo:'Club B'},totalSeasons:3}};
  const result=(revision=0)=>({ok:true,revision,managerRole:'playerOne',state:{phase:'CAREER_START_PENDING',revision,acknowledgedRoles:[]}});
  const controls={read:async()=>result(),ack:async()=>result(1),setup:async()=>{},account:async()=>({auth:{currentUser:{uid:'u'}},firestore:{},firestoreSdk:{}}),style:async()=>{}};
  const sandbox={console:{error(){}},document:{body,visibilityState:'visible',createElement:t=>new Node(t),getElementById:id=>nodes.find(n=>n.id===id)},crypto:{getRandomValues:b=>b.fill(1)},loadRuntimeStyle:()=>controls.style(),setTimeout(fn,ms){const id=++seq;timers.set(id,{at:now+ms,fn});return id;},clearTimeout:id=>timers.delete(id),CareerModeProductionSharedShowdownSetup:{getState:()=>state,refresh:()=>{calls.push('setup');return controls.setup();}},CareerModeSparkSharedCareerStart:{read:()=>{calls.push('read');return controls.read();},acknowledge:()=>{calls.push('ack');return controls.ack();}},CareerModeProductionFirebaseRuntime:{ensureAccountServices:()=>{calls.push('account');return controls.account();}}};
  for(const name of ['SharedShowdownSetup','SharedShowdownCatalog','SparkSharedShowdownSetup','SharedCareerStart','ProductionSharedTransferChallenge'])sandbox['CareerMode'+name]={};
  if(opts.extend)opts.extend(sandbox);
  vm.runInNewContext(source,sandbox);
  const api=sandbox.CareerModeProductionSharedCareerStart;
  async function advance(ms){await flush();now+=ms;for(const [id,t] of [...timers])if(t.at<=now){timers.delete(id);t.fn();await flush();}await flush();}
  const action=text=>body.descendants().find(n=>n.tagName==='button'&&n.textContent.startsWith(text));
  const status=()=>body.descendants().find(n=>n.dataset.careerStatus)?.textContent;
  return {api,controls,calls,button,result,advance,action,status,timers,sandbox,state,panel:()=>sandbox.document.getElementById('productionSharedCareerStartOverlay')};
}
async function timedOpen(stage){
  const w=world(),late=deferred();w.controls[stage]=()=>late.promise;
  let settled=false;const opening=w.api.openPanel().catch(()=>false).then(v=>{settled=true;return v;});await flush();
  assert.equal(w.button.disabled,true);assert.equal(w.button.textContent,'OPENING CAREER START…');
  await w.advance(25000);
  assert.equal(w.button.disabled,false,`${stage}: timed-out open restores the button`);
  assert.equal(w.button.textContent,'CONTINUE TO CAREER START');assert.equal(settled,true);assert.equal(await opening,false);assert.equal(w.status(),ERROR);
  const reads=w.calls.length;await w.advance(25000);assert.equal(w.calls.length,reads,'timeout never starts a read');
  w.controls[stage]=world().controls[stage];
  assert.equal(await w.api.openPanel(),true);const current=w.api.getState();const calls=w.calls.length;
  late.resolve(w.result(99));await flush();assert.equal(w.api.getState(),current,'late open cannot overwrite a retry');assert.equal(w.calls.length,calls,'expired work starts no further reads');
  console.log(`PASS open timeout/retry/late response at ${stage}`);
}
async function main(){
  const normal=world();assert.equal(await normal.api.openPanel(),true);assert.deepEqual(normal.calls,['setup','account','read']);assert.equal(normal.button.disabled,false);assert.equal(normal.timers.size,0);console.log('PASS normal open preserves reads and order');
  for(const stage of ['read','setup','account','style'])await timedOpen(stage);
  {const w=world(),late=deferred();w.controls.read=()=>late.promise;const run=w.api.refresh().catch(()=>false);await flush();await w.advance(25000);await run;
    assert.equal(w.button.disabled,false,'background refresh timeout leaves the button usable');
    assert.equal(Boolean(w.panel()),false,'background refresh timeout opens no Career Start panel');console.log('PASS background refresh timeout opens no panel');}
  for(const action of ['refresh','ack-read','ack']){
    const w=world();await w.api.openPanel();const late=deferred();w.controls[action==='ack'?'ack':'read']=()=>late.promise;
    if(action==='refresh')w.action('REFRESH').tap();else w.action('I STARTED AT').tap();await flush();await w.advance(25000);
    assert.equal(w.status(),ERROR,`${action}: timeout is visible`);assert.equal(w.action('REFRESH').disabled,false);assert.equal(w.action('I STARTED AT').disabled,false);
    const reads=w.calls.length;await w.advance(25000);assert.equal(w.calls.length,reads,'timeout never retries automatically');
    w.controls[action==='ack'?'ack':'read']=async()=>w.result(2);
    if(action==='ack-read')w.controls.ack=async()=>w.result(2);
    w.action(action==='refresh'?'REFRESH':'I STARTED AT').tap();await flush();assert.equal(w.api.getState().revision,2,'queue allows retry');
    const current=w.api.getState();late.resolve(w.result(99));await flush();assert.equal(w.api.getState(),current,'late result is discarded');assert.equal(w.timers.size,0);
    console.log(`PASS ${action} timeout/retry/late response`);
  }
}
// r87 Fable job 6. A world where Career Start is READY (both managers acknowledged) and the Transfer Challenge open runs the
// season's Russian Roster Roulette (a fake step and a fake transfer module; the real Career Start module).
function rouletteWorld(){
  const step={home:false,on:false,active:()=>step.on,wentHome:()=>step.home,forgetHome(){step.home=false;return true;}};
  const transfer={opens:0,gate:null,next:null,install(){},rouletteError:()=>transfer.reason||"",open:async()=>{transfer.opens+=1;step.home=false;if(transfer.gate)await transfer.gate.promise;return transfer.next?transfer.next():true;}};
  const navs=[];
  const w=world({extend:sandbox=>{sandbox.CareerModeRosterRouletteStep=step;sandbox.CareerModeProductionSharedTransferChallenge=transfer;sandbox.navigateTo=id=>{navs.push(id);return true;};}});
  w.controls.read=async()=>({ok:true,revision:2,managerRole:'playerOne',state:{phase:'CAREER_START_READY',revision:2,acknowledgedRoles:['playerOne','playerTwo']}});
  return {...w,step,transfer,navs,shown:()=>Boolean(w.panel()&&!w.panel().classList.contains('hidden'))};
}
async function fable6(){
  // F6-01 (P1): READY, the roulette runs, BACK TO SHOWDOWN HOME; then CONTINUE CAREER opens Career Start again, the roulette runs
  // again (never skipped) and BACK again: the manager stays on Home. The Career Start panel never shows over a forced Club screen.
  {
    const w=rouletteWorld();w.transfer.next=()=>{w.step.home=true;return false;};
    await w.api.openPanel();await w.advance(0);
    assert.equal(w.transfer.opens,1,'F6-01 READY continues to the roulette once');assert.equal(w.shown(),false,'F6-01 BACK closes Career Start');
    const back=await w.api.openPanel();await w.advance(0);
    assert.equal(w.transfer.opens,2,'F6-01 CONTINUE CAREER runs the roulette again (never skipped)');
    assert.equal(w.shown(),false,'F6-01 a second BACK TO SHOWDOWN HOME stays on Home: no Career Start panel');
    assert.notEqual(back,false,'F6-01 leaving for Home is not a failure');assert.doesNotMatch(String(w.status()),/took too long|could not|unavailable/i,'F6-01 no error line');
    // ...and a roulette that could not start still shows Career Start with its own reason (Fable F2-05).
    w.transfer.next=()=>false;w.transfer.reason='The Showdown Setup could not be read just now.';
    await w.api.openPanel();await w.advance(0);
    assert.equal(w.shown(),true,'F6-01 a roulette error shows Career Start');assert.equal(w.status(),w.transfer.reason,'F6-01 with the roulette\'s own reason');
    console.log('PASS F6-01 BACK TO SHOWDOWN HOME from a resumed roulette stays on Home; a roulette error still shows its reason');
  }
  // F6-09 (P3): a slow (cold cache) Transfer Challenge open before the roulette is on screen is not a Career Start timeout.
  {
    const w=rouletteWorld();await w.api.openPanel();await w.advance(0);w.api.closePanel();
    w.transfer.gate=deferred();
    let settled=null;const run=w.api.openPanel().then(v=>{settled=v;},()=>{settled='rejected';});
    await w.advance(25000);await w.advance(25000);
    assert.notEqual(w.status(),ERROR,'F6-09 no "took too long" while the open is still in flight');assert.equal(settled,null,'F6-09 the open is still running');
    w.transfer.gate.resolve();await w.advance(0);await run;
    assert.equal(settled,true,'F6-09 the slow open succeeds');assert.equal(w.shown(),false,'F6-09 Career Start is not left on screen');assert.notEqual(w.status(),ERROR);
    console.log('PASS F6-09 the 25 s limit waits while the Transfer Challenge open is in flight');
  }
}
main().then(fable6).catch(error=>{console.error(error);process.exitCode=1;});

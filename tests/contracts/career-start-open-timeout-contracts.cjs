#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('js/productionSharedCareerStart.js','utf8');
const ERROR='Career Start took too long. Check your connection and tap again.';
const flush=async()=>{for(let i=0;i<80;i++)await Promise.resolve();};
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
function world(){
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
  vm.runInNewContext(source,sandbox);
  const api=sandbox.CareerModeProductionSharedCareerStart;
  async function advance(ms){await flush();now+=ms;for(const [id,t] of [...timers])if(t.at<=now){timers.delete(id);t.fn();await flush();}await flush();}
  const action=text=>body.descendants().find(n=>n.tagName==='button'&&n.textContent.startsWith(text));
  const status=()=>body.descendants().find(n=>n.dataset.careerStatus)?.textContent;
  return {api,controls,calls,button,result,advance,action,status,timers};
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
main().catch(error=>{console.error(error);process.exitCode=1;});

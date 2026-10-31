"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {FakeNode}=require("../support/fake-dom.cjs");
const read=file=>fs.readFileSync(path.resolve(__dirname,"../..",file),"utf8");
const settle=()=>new Promise(resolve=>setImmediate(resolve));

// Fresh page globals/DOM on every load; only device storage and provider facts survive.
// Dispatch models document capture -> selector target -> document bubble synchronously.
// Use the complete production adapter, selector, FIFA options and storage helpers.
async function page(device,role,{season=1,rivalry="pair_1",locked=false}={}){
  const handlers=[],nodes=new Map(),body=new FakeNode("body"),calls={writes:0};
  class Node extends FakeNode{
    constructor(tag){super(tag);this.value="";this.listeners=[];}
    get parentNode(){return this.parent;}
    addEventListener(type,fn,capture=false){this.listeners.push({type,fn,capture});}
    removeAttribute(key){delete this.attributes[key];}
    hasAttribute(key){return key in this.attributes;}
    scrollIntoView(){}
    querySelectorAll(selector){return this.all().filter(node=>selector==="input,select"?node.tagName==="INPUT"||node.tagName==="SELECT":node.getAttribute("role")==="option");}
    closest(selector){let node=this;while(node){if(selector==="button"?node.tagName==="BUTTON":node.classList.contains(selector.slice(1)))return node;node=node.parent;}return null;}
    dispatchEvent(event){
      event.target=this;
      for(const h of handlers)if(h.type===event.type&&h.capture){event.currentTarget=document;h.fn(event);}
      event.currentTarget=this;
      for(const h of this.listeners)if(h.type===event.type)h.fn(event);
      if(event.bubbles)for(const h of handlers)if(h.type===event.type&&!h.capture){event.currentTarget=document;h.fn(event);}
      return true;
    }
  }
  function node(id,tag="div",parent=body){if(!nodes.has(id)){const element=new Node(tag);element.id=id;parent.appendChild(element);nodes.set(id,element);}return nodes.get(id);}
  const screen=node("transferChallenge");screen.classList.add("hidden");
  for(const prefix of ["p1","p2"]){
    const card=node(`${prefix}Card`);card.classList.add("transferManagerCard");
    for(let slot=1;slot<=3;slot++)for(const suffix of ["Name","League","Nationality"])node(`${prefix}Signing${slot}${suffix}`,"input",card);
  }
  for(const id of ["continueFromTransfers","completeTransferChallenge"])node(id,"button");
  const document={visibilityState:"visible",getElementById:id=>nodes.get(id)||null,querySelector:()=>null,querySelectorAll:()=>[],
    createElement:tag=>new Node(tag),createDocumentFragment:()=>new FakeNode("#fragment",true),
    addEventListener(type,fn,capture=false){handlers.push({type,fn,capture});}};
  class Event{constructor(type,options={}){this.type=type;this.bubbles=Boolean(options.bubbles);this.detail=options.detail;}preventDefault(){}stopPropagation(){}stopImmediatePropagation(){}}
  const forbidden=async()=>{calls.writes++;throw new Error("Draft/reload must never publish signing facts");};
  const sandbox={console,document,Event,CustomEvent:Event,performance:{now:()=>0},setTimeout,clearTimeout,addEventListener(){},
    localStorage:{getItem:key=>device.get(key)||null,setItem:(key,value)=>device.set(key,String(value)),removeItem:key=>device.delete(key)},
    currentShowdown:{id:"save_1",currentRound:season,sharedJourney:{mode:"shared",rivalryId:rivalry}},
    CareerModeProductionSharedShowdownSetup:{refresh:async()=>{},getState:()=>({ready:true,managerRole:role,rivalryId:rivalry,sessionId:"session_1",deviceId:"device_1",setupUpdatedAtMs:Date.parse("2026-09-01T00:00:00Z"),setup:{phase:"SHOWDOWN_CONFIRMED",revision:6}})},
    CareerModeRosterRouletteStep:{decide:()=>false,runBeforeTransfers:async()=>true,close(){},ensureDraw:async()=>true}, // Fable F2-05: a Setup read carries the confirm time
    CareerModeProductionSharedCareerStart:{refresh:async()=>{},getState:()=>({state:{phase:"CAREER_START_READY",revision:2}})},
    CareerModeSharedTransferChallenge:{},
    CareerModeSparkSharedTransferChallenge:{read:async()=>({ok:true,revision:5,managerRole:role,seasonNumber:season,state:{phase:"SIGNING_ENTRY",guessLockedRoles:["playerOne","playerTwo"],signingLockedRoles:locked?[role]:[]},ownInputs:{signings:null}}),startWindow:forbidden,requestEndWindow:forbidden,advanceExpiredWindow:forbidden,lockGuesses:forbidden,lockSignings:forbidden},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({auth:{currentUser:{getIdTokenResult:async()=>({issuedAtTime:"2026-10-23T12:00:00Z"})}},firestore:{},firestoreSdk:{}})},
    navigateTo:async()=>{screen.classList.remove("hidden");return true;}};
  sandbox.window=sandbox;sandbox.globalThis=sandbox;
  vm.createContext(sandbox);
  for(const file of ["data/transferOptions.js","js/storage.js","js/transferSelector.js","js/productionSharedTransferChallenge.js"])vm.runInContext(read(file),sandbox,{filename:file});
  // Phases this device already witnessed are stored (r83 Job 5) and are not replayed after a reload.
  const witnessed=[...device.keys()].some(key=>key.includes(`cms.transferViews.v1:${rivalry}:${season}:${role}`));
  const api=sandbox.CareerModeProductionSharedTransferChallenge;api.install();await api.open();
  if(!witnessed){
    // First visit: return through the historical transfer window and guess replay.
    assert.equal(screen.dataset.sharedTransferReplay,"WINDOW_OPEN");
    for(const phase of ["GUESS_ENTRY",undefined]){node("continueFromTransfers").dispatchEvent(new Event("click",{bubbles:true}));await settle();assert.equal(screen.dataset.sharedTransferReplay,phase);}
  }else assert.equal(screen.dataset.sharedTransferReplay,undefined);
  assert.equal(api.getState().state.phase,"SIGNING_ENTRY");
  const prefix=role==="playerOne"?"p1":"p2";
  return {api,calls,sandbox,field:suffix=>node(`${prefix}Signing1${suffix}`),
    input(suffix,text){const field=node(`${prefix}Signing1${suffix}`);field.value=text;field.dispatchEvent(new Event("input",{bubbles:true}));},
    select(suffix,id){const field=node(`${prefix}Signing1${suffix}`),kind=suffix==="League"?"league":"nationality";sandbox.chooseTransferSelectorOption(field,sandbox.resolveFifa17TransferOption(kind,id));},
    rivalInput(){const other=prefix==="p1"?"p2":"p1",field=node(`${other}Signing1Name`);field.value="Rival";field.dispatchEvent(new Event("input",{bubbles:true}));}};
}

(async()=>{
  let checks=0;
  for(const role of ["playerOne","playerTwo"]){
    for(const correction of [
      {field:"Nationality",text:"England",id:"england"},
      {field:"League",text:"Premier League",id:"england-premier-league"},
      {field:"Nationality",text:"Eng",id:""},
      {field:"League",text:"Prem",id:""},
      {field:"Nationality",text:"",id:""},
      {field:"League",text:"",id:""}
    ]){
      const device=new Map(),first=await page(device,role);
      first.input("Name","N'Golo Kante");first.select("League","france-ligue-1");first.select("Nationality","france");
      // A single replacement input event, like pasting over the selected text.
      // No blur/change/suggestion event and no timer turn before the reload.
      first.input(correction.field,correction.text);
      assert.equal(first.field(correction.field).value,correction.text);
      assert.equal(first.field(correction.field).dataset.canonicalId||"",correction.id);
      // Freeze storage at the reload boundary; discarded-page timers cannot repair it.
      const reloaded=await page(new Map(device),role);
      assert.equal(reloaded.field(correction.field).value,correction.text,`${role} pasted ${correction.field} survives immediate reload`);
      assert.equal(reloaded.field(correction.field).dataset.canonicalId||"",correction.id);
      assert.equal(reloaded.field("Name").value,"N'Golo Kante");
      const otherField=correction.field==="League"?"Nationality":"League";
      assert.equal(reloaded.field(otherField).dataset.canonicalId,otherField==="Nationality"?"france":"france-ligue-1");
      assert.equal(first.calls.writes+reloaded.calls.writes,0);
      checks++;
    }
    const device=new Map(),first=await page(device,role);
    first.input("Name","Kante");first.select("League","france-ligue-1");first.select("Nationality","england");
    const saved=JSON.stringify([...device]);first.rivalInput();assert.equal(JSON.stringify([...device]),saved,"rival fields cannot overwrite the own draft");
    for(const options of [{season:2},{rivalry:"pair_2"}]){const scoped=await page(device,role,options);assert.equal(scoped.field("Name").value,"");assert.equal(scoped.field("Nationality").value,"");}
    const opposite=await page(device,role==="playerOne"?"playerTwo":"playerOne");assert.equal(opposite.field("Name").value,"");
    const reloaded=await page(device,role);assert.equal(reloaded.field("Nationality").dataset.canonicalId,"england","suggestion change survives reload too");
    const locked=await page(device,role,{locked:true});assert.equal(locked.field("Name").value,"");assert.equal([...device.keys()].filter(key=>key.includes("cms.signingDraft.v1:")).length,0,"authoritative lock clears every signing draft");
    checks++;
  }
  console.log(`PASS r83 signing paste/reload: ${checks} behavioral cases for Daniel/playerOne and Nik/playerTwo.`);
})().catch(error=>{console.error(error);process.exitCode=1;});

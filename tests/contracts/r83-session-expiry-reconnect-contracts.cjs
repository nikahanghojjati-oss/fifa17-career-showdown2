"use strict";
// F4 / Job 13: the actual in-game action must reuse automatic permanent-pair connection.
// The session provider and Firestore SDK are fixtures; both UI controllers and recovery verifiers are real.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const {test}=require("node:test");
const {webcrypto}=require("node:crypto");
const RIVALRY="pair_"+"a".repeat(64),OLD="session_"+"b".repeat(64),FRESH="session_"+"c".repeat(64),HOUR=3600000;
const load=(root,file)=>vm.runInContext(fs.readFileSync(require.resolve("../../js/"+file),"utf8"),root,{filename:file});
async function settle(){for(let i=0;i<300;i++)await Promise.resolve();}
function dom(){
  class Element{
    constructor(tag){this.tag=tag;this.children=[];this.className="";this.ownText="";this.listeners={};this.dataset={};this.classes=new Set();this.classList={add:n=>this.classes.add(n),remove:n=>this.classes.delete(n),toggle:(n,on)=>on?this.classes.add(n):this.classes.delete(n)};}
    get textContent(){return this.ownText+this.children.map(n=>n.textContent).join(" ");}
    set textContent(value){this.ownText=String(value);this.children=[];}
    append(...nodes){for(const n of nodes){n.parentNode=this;this.children.push(n);}}
    appendChild(n){this.append(n);return n;} prepend(...nodes){for(const n of nodes)n.parentNode=this;this.children.unshift(...nodes);}
    replaceChildren(...nodes){this.children=[];this.append(...nodes);} setAttribute(){} focus(){}
    addEventListener(type,fn){this.listeners[type]=fn;}
    click(){assert.equal(Boolean(this.disabled),false,"the player action is enabled");this.listeners.click?.();}
    all(){return this.children.flatMap(n=>[n,...n.all()]);}
    querySelector(s){return this.all().find(n=>s==="button"?n.tag==="button":n.className.split(" ").includes(s.slice(1)))||null;}
  }
  const body=new Element("body"),app=new Element("main");app.id="app";body.append(app);
  return {body,visibilityState:"visible",createElement:tag=>new Element(tag),createTextNode:text=>{const n=new Element("#text");n.textContent=text;return n;},getElementById:id=>body.all().find(n=>n.id===id)||null,querySelector:()=>null,addEventListener(){}};
}
function game(){
  let now=1800000000000,offer={schemaVersion:1,sessionId:OLD,hostAccountId:"daniel",expiresAt:{toMillis:()=>1800000000000+4*HOUR}};
  const sessions=new Map([[OLD,{state:"active",expiry:now+4*HOUR}]]),players=[];
  function player(role,permanent=true){
    const uid=role==="playerOne"?"daniel":"nik",deviceId="device_"+(role==="playerOne"?"d":"e").repeat(32),document=dom(),timers=new Map(),reports=[];
    const calls={auto:0,hosts:0,joins:0};let timerId=0;
    const account={connected:true,accountId:uid},rivalry={attached:true,rivalryId:RIVALRY,accountId:uid,deviceId,binding:{managerRole:role}};
    const setup={rivalryId:RIVALRY,revision:6,phase:"SHOWDOWN_CONFIRMED",leagueId:"premier-league",totalSeasons:3,clubs:{playerOne:"Arsenal",playerTwo:"Chelsea"}};
    const progression={schemaVersion:1,runtimeRevision:"1.9.1-r13",phase:"SEASON_READY",revision:1,rivalryId:RIVALRY,setupRevision:6,leagueId:setup.leagueId,totalSeasons:3,acceptedSeasons:1,activeSeason:2,completedSeason:1,fixedClubs:setup.clubs,acceptedRevisionKey:"1:2:sha256:"+"1".repeat(64),terminal:false,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false};
    const result=id=>{const s=sessions.get(id);return {ok:true,sessionId:id,state:s.state,revision:s.state==="active"?1:0,expiresAtEpochMs:s.expiry};};
    const sdk={doc:(_db,...parts)=>parts.join("/"),Timestamp:{fromMillis:ms=>({toMillis:()=>ms})},serverTimestamp:()=>({}),runTransaction:async(_db,fn)=>fn({get:async()=>({exists:()=>Boolean(offer),data:()=>offer}),set:(_ref,value)=>{offer=value;}})};
    const root=vm.createContext({console,URL,TextEncoder,crypto:webcrypto,Promise,Date:class extends Date{static now(){return now;}},document,navigator:{onLine:true},
      setTimeout:(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId;},clearTimeout:id=>timers.delete(id),addEventListener(){},dispatchEvent(){},CustomEvent:class{},
      reportApplicationError:(label,error)=>reports.push([label,error.code]),
      currentShowdown:{sharedJourney:{mode:"shared",rivalryId:RIVALRY},managers:{playerOne:"Daniel",playerTwo:"Nik"},rounds:[{season:1,accepted:true}]},
      CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid}},firestore:{},firestoreSdk:sdk})},
      CareerModeSparkConnectedAccount:{initialize:async()=>{},getState:()=>account},
      CareerModeSparkPrivatePairing:{initialize:async()=>{},getState:()=>({registered:true,deviceId})},
      CareerModeSparkConnectedRivalry:{initialize:async()=>{},getState:()=>rivalry},
      CareerModeOnlinePlayerIdentity:{getState:()=>({managerId:uid})},
      CareerModePersistentNikDanielPair:{getPartnerState:()=>({status:"ready",accountId:uid,record:{active:permanent}})},
      CareerModeSharedMultiSeasonProgression:require("../../js/sharedMultiSeasonProgression.js"),
      CareerModeSharedJourneyReconnect:require("../../js/sharedJourneyReconnect.js"),
      CareerModeSparkPrivateSession:{},CareerModeSparkStandardAuthPrivateSession:{generateSessionId:()=>FRESH,normalizeSessionId:v=>v,
        readSession:async({sessionId})=>result(sessionId),
        openSession:async({sessionId,ttlMs})=>{calls.hosts++;sessions.set(sessionId,{state:"open",expiry:now+ttlMs});return result(sessionId);},
        joinSession:async({sessionId})=>{calls.joins++;sessions.get(sessionId).state="active";return result(sessionId);}},
      CareerModeProductionSharedShowdownSetup:{refresh:async()=>true,getState:()=>({ready:true,rivalryId:RIVALRY,sessionId:root.CareerModeSparkRemoteJoining.getState().sessionId,setup})},
      CareerModeProductionSharedMultiSeasonProgression:{refresh:async()=>true,getState:()=>({authoritative:true,rivalryId:RIVALRY,state:progression})}
    });
    load(root,"sparkRemoteJoining.js");
    const remote=root.CareerModeSparkRemoteJoining;
    root.CareerModeSparkRemoteJoining={...remote,autoConnect:()=>{calls.auto++;return remote.autoConnect();}};
    load(root,"productionSharedJourneyReconnect.js");
    const reconnect=root.CareerModeProductionSharedJourneyReconnect;
    const p={root,remote,reconnect,document,calls,reports,account,rivalry,
      status:()=>document.getElementById("sharedJourneyReconnectStatus"),
      panel:()=>document.getElementById("sparkRemoteJoiningOverlay"),
      async tap(id="sharedJourneyReconnectAction"){const button=document.getElementById(id);assert.ok(button,"the in-game recovery action exists");button.click();await settle();},
      async tick(){const entries=[...timers];timers.clear();for(const [,timer] of entries)await timer.fn();await settle();}
    };players.push(p);return p;
  }
  return {player,advance:ms=>{now+=ms;},async playing(p){await p.reconnect.refresh();await p.remote.autoConnect();await p.reconnect.refresh();assert.equal(p.reconnect.isRecovered(),true,JSON.stringify({reports:p.reports,state:p.reconnect.getState(),remote:p.remote.getState()}));return JSON.stringify(p.reconnect.getState());}};
}
function assertAutomatic(p){
  assert.ok(p.calls.auto>0,"RECONNECT SESSION must invoke the existing automatic connection operation");
  assert.doesNotMatch(p.remote.getState().open?p.panel()?.textContent||"":"",/HOST PRIVATE SESSION|JOIN PRIVATE SESSION|USE A SESSION CODE|Paste the full code/);
  assert.doesNotMatch(p.status().textContent,/paste|send.*code|HOST PRIVATE SESSION|JOIN PRIVATE SESSION/i);
}
for(const first of ["playerOne","playerTwo"])for(const pause of [4*HOUR+1,12*HOUR])test(`${first} reconnects first after ${pause>5*HOUR?"overnight":"four-hour expiry"}: both paired players reconnect without codes`,async()=>{
  const g=game(),daniel=g.player("playerOne"),nik=g.player("playerTwo");
  const before=new Map();for(const p of [daniel,nik]){await g.playing(p);before.set(p,{state:p.reconnect.getState(),save:JSON.stringify(p.root.currentShowdown)});}
  g.advance(pause);
  for(const p of [daniel,nik]){await p.reconnect.refresh();assert.equal(p.reconnect.getState().phase,"FRESH_SESSION_REQUIRED");assert.equal(p.reconnect.isRecovered(),false);}
  const order=first==="playerOne"?[daniel,nik]:[nik,daniel];
  await order[0].tap();assertAutomatic(order[0]);assert.equal(order[0].reconnect.isRecovered(),false,"waiting for the partner is not ACTIVE authority");
  await order[1].tap();assertAutomatic(order[1]);
  for(let round=0;round<2;round++)for(const p of [daniel,nik])await p.tick();
  for(const p of [daniel,nik]){
    await p.reconnect.refresh();assert.equal(p.remote.getState().sessionId,FRESH);assert.equal(p.reconnect.isRecovered(),true);
    assert.equal(p.remote.getState().open,false,"the connection panel closes when the exact ACTIVE session arrives");
    for(const key of ["acceptedSeasons","activeSeason","acceptedRevisionKey","durableKey","planKey"])assert.equal(p.reconnect.getState()[key],before.get(p).state[key],key);
    assert.equal(JSON.stringify(p.root.currentShowdown),before.get(p).save,"reconnection leaves the saved game intact");assert.deepEqual(p.reports,[]);
  }
  assert.equal(daniel.calls.hosts,1);assert.equal(nik.calls.joins,1);
});
test("the recovered paired player's second recovery action also uses automatic connection",async()=>{
  const g=game(),p=g.player("playerOne");await g.playing(p);
  await p.tap("sharedJourneyReconnectNewCode");assertAutomatic(p);
  assert.equal(p.calls.hosts,0,"a healthy exact session is reused");assert.equal(p.remote.getState().open,false,"an already ACTIVE result cannot leave the panel stranded");
  assert.doesNotMatch(p.status().textContent,/NEW SESSION CODE/);
});
test("unpaired recovery keeps the existing manual host/join fallback",async()=>{
  const g=game(),p=g.player("playerTwo",false);await g.playing(p);g.advance(5*HOUR);await p.reconnect.refresh();await p.tap();
  assert.equal(p.calls.auto,0);assert.match(p.panel().textContent,/HOST PRIVATE SESSION/);assert.match(p.panel().textContent,/JOIN PRIVATE SESSION/);
});
test("recovery return ignores ACTIVE notifications for a different account, device, rivalry or changed identity",async()=>{
  for(const changed of ["accountId","deviceId","rivalryId","identity"]){
    const g=game(),p=g.player("playerOne");await g.playing(p);g.advance(5*HOUR);await p.reconnect.refresh();
    let held=p.remote.getState(),listener,closes=0;
    p.root.CareerModeSparkRemoteJoining={getState:()=>held,subscribe:fn=>{listener=fn;return()=>{};},autoConnect:async()=>({ok:true}),openPanel:async()=>true,closePanel:()=>{closes++;}};
    await p.reconnect.openSessionRecovery();
    held={...held,sessionId:FRESH,expiresAtEpochMs:1800000000000+9*HOUR,sessionState:"active"};
    if(changed==="identity")p.account.accountId="other";else held={...held,[changed]:"other"};
    listener(held);await settle();assert.equal(closes,0,changed+": a different context cannot complete this recovery");assert.equal(p.reconnect.isRecovered(),false);
  }
});

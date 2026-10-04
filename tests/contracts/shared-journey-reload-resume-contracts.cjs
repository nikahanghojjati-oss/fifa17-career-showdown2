"use strict";
// Job 19: resume after reload. A reloaded tab keeps its Google session (browserSessionPersistence) but loses the
// page-memory private-session capability and the page-memory season cursor. These contracts lock the fix:
//   A. GET READY auto-opens after load only for a pre-pair shell; never over an ACTIVE paired or CLOSED Showdown.
//   B. After a fresh exact session, the multi-season cursor resumes at the provider-authoritative active season
//      (acceptedSeasons+1, or the final season once all are accepted), forward-only.
//   C. Continue Career with a confirmed setup and >=1 accepted season resumes on the dashboard, not Career Start;
//      with no accepted season it still resumes into Career Start.
//   D. The session capability stays page-memory only (no storage persistence was added to Remote Joining).
//   E. The persistent pair reports the remembered CLOSED rivalry so Home can recognise a finished Showdown.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const entrySource=read("js/productionSharedJourneyEntry.js");
const multiSource=read("js/productionSharedMultiSeasonProgression.js");
const remoteSource=read("js/sparkRemoteJoining.js");
const pairSource=read("js/persistentNikDanielPair.js");
const PENDING_KEY="careerModeShowdown.sharedJourneyPending.v1";
const RIVALRY=`pair_${"ab".repeat(32)}`;
const SESSION=`session_${"cd".repeat(32)}`;
const DEVICE=`device_${"ef".repeat(16)}`;

async function settle(rounds=40){for(let pass=0;pass<3;pass+=1){await new Promise(resolve=>setTimeout(resolve,15));for(let i=0;i<rounds;i+=1)await new Promise(resolve=>setImmediate(resolve));}}

function createDom(){
  class El{
    constructor(tag){this.tagName=String(tag).toUpperCase();this.children=[];this.parent=null;this.id="";this.className="";this.ownText="";this.dataset={};this.attributes={};this.listeners={};this.disabled=false;this.type="";this.title="";
      const self=this;this.classList={add:(...c)=>{const s=new Set(self.className.split(/\s+/).filter(Boolean));c.forEach(x=>s.add(x));self.className=[...s].join(" ");},remove:(...c)=>{self.className=self.className.split(/\s+/).filter(x=>x&&!c.includes(x)).join(" ");},contains:c=>self.className.split(/\s+/).includes(c),toggle:(c,force)=>{const has=self.classList.contains(c),want=force===undefined?!has:Boolean(force);if(want)self.classList.add(c);else self.classList.remove(c);return want;}};}
    get textContent(){return this.ownText+this.children.map(c=>c.textContent).join("");}
    set textContent(v){this.ownText=v==null?"":String(v);this.children=[];}
    append(...nodes){for(const n of nodes){if(typeof n==="string"){const t=new El("#text");t.ownText=n;n=t;}if(n.parent)n.parent.children=n.parent.children.filter(c=>c!==n);n.parent=this;this.children.push(n);}}
    insertBefore(n){this.append(n);return n;}
    replaceChildren(...nodes){for(const c of this.children)c.parent=null;this.children=[];this.append(...nodes);}
    remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);this.parent=null;}
    addEventListener(type,fn){(this.listeners[type]||(this.listeners[type]=[])).push(fn);}
    setAttribute(k,v){this.attributes[k]=String(v);}
    removeAttribute(k){delete this.attributes[k];}
    all(){return this.children.flatMap(c=>[c,...c.all()]);}
    querySelector(sel){if(sel===".remoteJoiningBody")return this.all().find(n=>n.classList.contains("remoteJoiningBody"))||null;return null;}
  }
  const documentElement=new El("html"),body=new El("body");documentElement.append(body);
  const document={documentElement,body,createElement:tag=>new El(tag),getElementById:id=>documentElement.all().find(n=>n.id===id)||null,querySelector:()=>null,addEventListener(){}};
  return document;
}

function memoryStorage(initial={}){const map=new Map(Object.entries(initial));return{getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};}

function bootEntry({pending=true,pairState=null,knownPair=null,extra={}}={}){
  const document=createDom();
  const calls={syncPair:0,navigate:[],careerStart:0};
  const identityListeners=new Set();
  const sandbox={
    console,setTimeout,clearTimeout,Promise,Date,Number,
    document,
    MutationObserver:class{observe(){}disconnect(){}},
    sessionStorage:memoryStorage(pending?{[PENDING_KEY]:"1"}:{}),
    loadRuntimeStyle:async()=>true,
    loadRuntimeScript:async()=>{throw new Error("runtime scripts are not loaded in this contract");},
    CareerModeOnlinePlayerIdentity:{
      getState:()=>({status:"ready",managerId:"daniel",registered:true}),
      subscribe:fn=>{identityListeners.add(fn);return()=>identityListeners.delete(fn);},
      syncPair:async()=>{calls.syncPair+=1;return pairState;}
    },
    ...extra
  };
  if(knownPair)sandbox.CareerModePersistentNikDanielPair={getState:()=>knownPair};
  sandbox.navigateTo=async(name)=>{calls.navigate.push(name);return true;};
  vm.createContext(sandbox);
  vm.runInContext(entrySource,sandbox,{filename:"js/productionSharedJourneyEntry.js"});
  const api=sandbox.CareerModeProductionSharedJourneyEntry;
  assert.ok(api&&typeof api.install==="function","entry module loads in the sandbox");
  const overlayOpen=()=>{const overlay=document.getElementById("productionSharedJourneyEntryOverlay");return Boolean(overlay&&!overlay.classList.contains("hidden"));};
  return{api,sandbox,document,calls,overlayOpen};
}

function multiSandbox({accepted,total=3,terminal=false}){
  const events=[];
  const providerState={value:{accepted,total,terminal}};
  const setupState={ready:true,rivalryId:RIVALRY,sessionId:SESSION,deviceId:DEVICE,accountId:"uid_daniel",managerRole:"playerOne",setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,leagueId:"premier_league",totalSeasons:total,clubs:{playerOne:"Club A",playerTwo:"Club B"}}};
  const sandbox={
    console,setTimeout,clearTimeout,Promise,Date,Number,String,Object,
    currentShowdown:{id:"save_aaaaaaaaaaaaaaaaaaaaaaaa",currentRound:1,sharedJourney:{contractVersion:1,mode:"shared",setupPending:true}},
    CustomEvent:class{constructor(type,init){this.type=type;this.detail=init&&init.detail;}},
    dispatchEvent:event=>{events.push(event);return true;},
    addEventListener(){},
    ensureGameplayModules:async()=>true,
    CareerModeProductionSharedShowdownSetup:{refresh:async()=>setupState,getState:()=>setupState},
    CareerModeProductionSharedHistoryConvergence:{refresh:async()=>null,getState:()=>null},
    CareerModeSharedMultiSeasonProgression:{},
    CareerModeSparkSharedMultiSeasonProgression:{read:async()=>{const v=providerState.value;return{ok:true,authoritative:true,runtimeRevision:"1.9.1-r13",rivalryId:RIVALRY,phase:v.terminal?"SHOWDOWN_COMPLETE":"SEASON_READY",state:{runtimeRevision:"1.9.1-r13",rivalryId:RIVALRY,acceptedSeasons:v.accepted,totalSeasons:v.total,terminal:v.terminal},dashboard:null};}},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"uid_daniel"}},firestore:{},firestoreSdk:{}})}
  };
  vm.createContext(sandbox);
  vm.runInContext(multiSource,sandbox,{filename:"js/productionSharedMultiSeasonProgression.js"});
  const api=sandbox.CareerModeProductionSharedMultiSeasonProgression;
  assert.ok(api&&typeof api.refresh==="function","multi-season module loads in the sandbox");
  return{api,events,providerState};
}

(async()=>{
  // A. GET READY auto-open decision after load.
  {
    // Real post-Terminal-Close shape: the remembered pair link resolves to no current pair, with the closed rivalry named.
    const t=bootEntry({pairState:{status:"unpaired",initialized:true,busy:false,rivalryId:null,connectionState:null,closedRivalryId:RIVALRY}});
    t.api.install();await settle();
    assert.equal(t.overlayOpen(),false,"A1 a CLOSED Showdown must not re-open the GET READY overlay after reload");
    const t2=bootEntry({knownPair:{status:"unpaired",initialized:true,busy:false,rivalryId:null,connectionState:null,closedRivalryId:RIVALRY},pairState:null});
    t2.api.install();await settle();
    assert.equal(t2.overlayOpen(),false,"A1 an already-known CLOSED pair state keeps GET READY closed");
    assert.equal(t2.calls.syncPair,0,"A1 no extra provider read when the closed pair state is already known");
    console.log("ok A1 closed Showdown keeps GET READY closed after reload");
  }
  {
    const t=bootEntry({pairState:{status:"paired",rivalryId:RIVALRY,connectionState:"active"}});
    t.api.install();await settle();
    assert.equal(t.overlayOpen(),false,"A2 an ACTIVE paired Showdown resumes through CONTINUE CAREER, not an auto-opened GET READY overlay");
    console.log("ok A2 active paired Showdown keeps GET READY closed after reload");
  }
  {
    const t=bootEntry({knownPair:{initialized:true,busy:false,status:"paired",rivalryId:RIVALRY,connectionState:"active"},pairState:null});
    t.api.install();await settle();
    assert.equal(t.overlayOpen(),false,"A3 an already-initialized ACTIVE pair state is honoured without another provider sync");
    assert.equal(t.calls.syncPair,0,"A3 no extra pair sync when the pair state is already known");
    console.log("ok A3 initialized pair state decides without an extra provider read");
  }
  {
    const t=bootEntry({pairState:{status:"unpaired",rivalryId:null,connectionState:null}});
    t.api.install();await settle();
    assert.equal(t.overlayOpen(),true,"A4 a pre-pair shell still re-opens GET READY after reload");
    console.log("ok A4 pre-pair shell still re-opens GET READY");
  }
  for(const unresolved of [{status:"unavailable",rivalryId:null,connectionState:null},{status:"error",rivalryId:null,connectionState:null}]){
    const t=bootEntry({pairState:unresolved});
    t.api.install();await settle();
    assert.equal(t.overlayOpen(),false,`A6 unresolved pair authority (${unresolved.status}) keeps GET READY closed after reload`);
  }
  {
    const t=bootEntry({pairState:null});
    t.api.install();await settle();
    assert.equal(t.overlayOpen(),false,"A6 a failed pair lookup keeps GET READY closed after reload");
  }
  console.log("ok A6 unresolved pair authority never reopens GET READY");
  {
    const t=bootEntry({pending:false,pairState:{status:"unpaired"}});
    t.api.install();await settle();
    assert.equal(t.overlayOpen(),false,"A5 no shared marker, no overlay");
    console.log("ok A5 no shared marker keeps GET READY closed");
  }

  // B. Season cursor resumes from provider authority after a fresh exact session.
  {
    const t=multiSandbox({accepted:1});
    assert.equal(typeof t.api.resumeFromAuthority,"function","B0 multi-season exposes resumeFromAuthority");
    await t.api.refresh();
    assert.equal(t.api.resolveSeason(1),1,"B1 a fresh runtime cursor starts at season 1 (page memory)");
    const resumed=await t.api.resumeFromAuthority();
    assert.equal(resumed.season,2,"B1 one accepted season of three resumes at season 2");
    assert.equal(resumed.acceptedSeasons,1);
    assert.equal(t.api.resolveSeason(1),2,"B1 every shared consumer now resolves season 2");
    const change=t.events.find(e=>e.type==="career-mode-shared-season-cursor-change");
    assert.ok(change&&change.detail.previousSeason===1&&change.detail.activeSeason===2&&change.detail.resumed===true,"B1 consumers are told the cursor moved so they drop season-1 caches");
    const again=await t.api.resumeFromAuthority();
    assert.equal(again.season,2,"B2 resume is idempotent");
    assert.equal(t.events.filter(e=>e.type==="career-mode-shared-season-cursor-change").length,1,"B2 an idempotent resume does not re-announce the cursor");
    console.log("ok B1 fresh runtime resumes at acceptedSeasons+1 and announces the cursor once");
  }
  {
    const t=multiSandbox({accepted:3,total:3,terminal:true});
    const resumed=await t.api.resumeFromAuthority();
    assert.equal(resumed.season,3,"B3 a fully accepted Showdown resumes on its final season");
    assert.equal(resumed.terminal,true);
    console.log("ok B3 terminal plan resumes on the final season");
  }
  {
    const t=multiSandbox({accepted:0});
    const resumed=await t.api.resumeFromAuthority();
    assert.equal(resumed.season,1,"B4 no accepted season stays on season 1");
    assert.equal(t.events.length,0,"B4 no cursor change is announced");
    console.log("ok B4 no accepted season keeps season 1");
  }

  // C. Continue Career routing after the fresh session is ACTIVE.
  for(const [accepted,expectDashboard] of [[1,true],[0,false]]){
    const setup={ready:true,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6}};
    let careerStartOpened=0;
    const t=bootEntry({pending:true,pairState:{status:"paired",rivalryId:RIVALRY,connectionState:"active"},extra:{
      ensureSaveLibraryRuntimeAuthority:async()=>true,
      ensureGameplayModules:async()=>true,
      CareerModeProductionSharedShowdownSetup:{refresh:async()=>setup,getState:()=>setup},
      CareerModeProductionSharedMultiSeasonProgression:{install(){},decorateDashboard(){},resumeFromAuthority:async()=>({season:accepted+1,acceptedSeasons:accepted,totalSeasons:3,terminal:false})},
      CareerModeProductionSharedCareerStart:{openPanel:async()=>{careerStartOpened+=1;return true;}}
    }});
    const ok=await t.api.openSharedExperience();
    assert.equal(ok,true,`C accepted=${accepted} resume succeeds`);
    if(expectDashboard){
      assert.deepEqual(t.calls.navigate,["dashboard"],"C1 an accepted season resumes on the shared dashboard");
      assert.equal(careerStartOpened,0,"C1 Career Start is not replayed mid-Showdown");
    }else{
      assert.equal(careerStartOpened,1,"C2 with no accepted season the confirmed setup still resumes into Career Start");
      assert.deepEqual(t.calls.navigate,[],"C2 no dashboard jump before season 1 is accepted");
    }
  }
  console.log("ok C1 accepted season resumes on the dashboard; C2 season 1 still resumes into Career Start");

  // D. Static locks: capability stays page-memory, marker shape unchanged, Career Start route literal kept.
  assert.equal(remoteSource.includes("sessionStorage"),false,"D1 the private-session capability is never persisted by Remote Joining");
  assert.equal(remoteSource.includes("localStorage"),false,"D1 the private-session capability is never persisted by Remote Joining");
  assert.match(entrySource,/showdown\.sharedJourney=\{contractVersion:1,mode:"shared",setupPending:true\}/,"D2 the permanent shared-mode marker shape is unchanged (it is the local draw lock)");
  assert.match(entrySource,/if\(confirmed&&await resumeAcceptedSeason\(\)\)\{applyLocalDrawLock\(\);return true;\}\s*if\(confirmed\)\{await openCareerStart\(\);applyLocalDrawLock\(\);return true;\}/,"D3 resume is checked before the unchanged Career Start route");
  assert.doesNotMatch(entrySource,/if\(pending\(\)\)setTimeout\(\(\)=>void openPanel\(\),0\)/,"D4 install no longer opens GET READY from the marker alone");
  assert.doesNotMatch(multiSource,/\blocalStorage\b|sessionStorage/,"D5 the season cursor stays page memory; resume reads provider authority");
  console.log("ok D page-memory capability, marker shape and Career Start route locks hold");

  // E. Persistent pair: a remembered link whose rivalry is CLOSED resolves as unpaired + closedRivalryId.
  for(const [connectionState,expectedStatus,expectedClosed] of [["closed","unpaired",RIVALRY],["active","paired",null]]){
    const docs={
      "accounts/uid_daniel/pairLinks/current":{schemaVersion:1,objectType:"pairLink",objectId:"current",lifecycleState:"live",revision:0,contentHash:"sha256:link",data:{managerRole:"playerOne",managerId:"daniel",rivalryId:RIVALRY}},
      [`rivalries/${RIVALRY}`]:{schemaVersion:1,objectType:"rivalry",objectId:RIVALRY,lifecycleState:"live",revision:4,contentHash:"sha256:rivalry",data:{connectionState,authorizedAccountIds:["uid_daniel","uid_nik"],managerSlots:[{slotId:"playerOne",accountId:"uid_daniel",saveId:"save_aaaaaaaaaaaaaaaaaaaaaaaa",profileId:"profile_aaaaaaaaaaaaaaaaaaaaaaaa"},{slotId:"playerTwo",accountId:"uid_nik",saveId:"save_bbbbbbbbbbbbbbbbbbbbbbbb",profileId:"profile_bbbbbbbbbbbbbbbbbbbbbbbb"}]}}
    };
    const snap=ref=>({exists:()=>Object.hasOwn(docs,ref.path),data:()=>docs[ref.path]});
    const firestoreSdk={doc:(_db,...parts)=>({path:parts.join("/")}),runTransaction:async(_db,fn)=>fn({get:async ref=>snap(ref)}),getDoc:async ref=>snap(ref)};
    const sandbox={console,setTimeout,clearTimeout,TextEncoder,
      CareerModeOnlinePlayerIdentity:{getState:()=>({managerId:"daniel"})},
      CareerModeSparkConnectedAccount:{initialize:async()=>({}),getState:()=>({connected:true,accountId:"uid_daniel"})},
      CareerModeSparkPrivatePairing:{initialize:async()=>({}),getState:()=>({registered:true,deviceId:DEVICE}),localBindingOptions:()=>[]},
      CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"uid_daniel"}},firestore:{},firestoreSdk})},
      ensureSaveLibraryRuntimeAuthority:async()=>true,
      CareerModeSaveLibraryRuntime:{isReady:()=>true,getLibrarySnapshot:()=>({activeSaveId:null,saves:[]})}
    };
    vm.createContext(sandbox);
    vm.runInContext(pairSource,sandbox,{filename:"js/persistentNikDanielPair.js"});
    const pairState=await sandbox.CareerModePersistentNikDanielPair.initialize({force:true});
    if(connectionState==="closed"){
      assert.equal(pairState.status,expectedStatus,"E1 a CLOSED remembered pair is no current pair");
      assert.equal(pairState.rivalryId,null,"E1 a CLOSED remembered pair grants no current rivalry");
      assert.equal(pairState.closedRivalryId,expectedClosed,"E1 the CLOSED rivalry is named so Home can recognise a finished Showdown");
    }else{
      assert.equal(pairState.closedRivalryId,expectedClosed,"E2 an ACTIVE pair carries no closed rivalry");
      assert.equal(pairState.rivalryId,RIVALRY,"E2 an ACTIVE pair keeps its rivalry");
    }
  }
  console.log("ok E persistent pair names the remembered CLOSED rivalry and never treats it as current");

  {
    const reconnect=read("js/productionSharedJourneyReconnect.js");
    assert.match(reconnect,/let heldTransientCode="";/,"F1 Reconnect keeps a held transient progression failure");
    assert.match(reconnect,/const PJR_HELD_CODES=Object\.freeze\(\["JOURNEY_RECONNECT_PROGRESSION_NOT_AUTHORITATIVE","JOURNEY_RECONNECT_SETUP_NOT_CONFIRMED"\]\);/,"F1 progression and new-setup failures are the held one-poll codes");
    assert.match(reconnect,/PJR_HELD_CODES\.includes\(error\?\.code\)&&code!==heldTransientCode&&code!==lastReportedCode\)\{heldTransientCode=code;return state;\}heldTransientCode="";if\(code!==lastReportedCode\)pjrReport\(/,"F1 a one-poll progression denial is held once, and the same failure on the next poll is reported");
    assert.match(reconnect,/then\(value=>\{lastReportedCode="";heldTransientCode="";return value;\}/,"F1 a successful refresh clears the held failure");
  }
    const multi=read("js/productionSharedMultiSeasonProgression.js");
    assert.match(multi,/if\(key!==lastErrorKey&&key!==heldErrorKey\)\{heldErrorKey=key;return null;\}heldErrorKey="";if\(key!==lastErrorKey\)pmspReport\(/,"F2 Multi Season holds a first refresh failure for one poll");
    assert.match(multi,/lastErrorCode="";lastErrorKey="";heldErrorKey="";\}return value;/,"F2 a successful Multi Season refresh clears the held failure");
    const history=read("js/productionSharedHistoryConvergence.js");
    assert.match(history,/if\(key!==heldErrorKey\)\{heldErrorKey=key;return null;\}heldErrorKey="";phcReport\("Unable to converge Shared History",error\);/,"F3 Shared History holds a first convergence failure for one poll");
    assert.match(history,/phcRefreshNow\(request\)\.then\(value=>\{heldErrorKey="";return value;\}/,"F3 a successful History refresh clears the held failure");
  console.log("ok F Reconnect, Multi Season and Shared History report a failure only when it repeats on the next poll");

  console.log("PASS shared journey reload resume contracts: closed/active Showdowns never re-open GET READY, pre-pair shells still do, the season cursor resumes at provider authority after a fresh exact session, and Continue Career resumes on the dashboard instead of replaying Career Start.");
})().catch(error=>{console.error(error);process.exit(1);});

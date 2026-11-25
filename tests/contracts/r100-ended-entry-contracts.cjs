"use strict";
// Phoenix r100 (B2), Showdown Gate twotabs leg on #1579 (seed 2540913475, attempt 2): Nik's tab stayed on Career Start for
// 90 s after Daniel's END SHOWDOWN. CONTINUE was tapped on Home as the END landed. Terminal Close had seen the Showdown DELETED
// (ended early) while Home showed, so ptcLeaveEndedShowdown left nothing; the resume found no season to continue;
// showdownClosedNow counts only a finished (CLOSED) Showdown; and openSharedExperience opened the ended Showdown's Career
// Start, which nothing took away.
//   E1 Terminal Close holds this Setup's rivalry DELETED: CONTINUE goes Home (via Terminal Close's leaveEnded), never Career Start.
//   E2 nothing held yet, but this save already played a season: one Terminal Close read; DELETED -> Home.
//   E3 the pair says this rivalry closed: one Terminal Close read decides (the pair is never the answer): DELETED -> Home; a
//      live read -> Career Start as before.
//   E4 a fresh Showdown's first Career Start: no extra read, Career Start opens.
//   E5 DELETED lands while Career Start opens: the page leaves it for Home right after.
//   E6 a finished (CLOSED) Showdown keeps its Champion path (Season Results host), never straight Home.
//   E8 an entry that fails because the Showdown ended under it (Career Start's read, the resume) goes Home, not GET READY over
//      the ended Showdown's Career Start: the Gate's exact stuck screen (both overlays). A live Showdown still gets GET READY.
//   E7 Terminal Close: the ended notice shows once per Showdown on the page, whichever path leaves; the automatic leave still
//      does nothing on Home; leaveEnded acts only on a held DELETED of that exact rivalry.
// Run: node tests/contracts/r100-ended-entry-contracts.cjs
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const RIVALRY="pair_3"+"7".repeat(63),OTHER="pair_4"+"8".repeat(63),SESSION="session_"+"6".repeat(64),DEVICE="device_"+"1".repeat(32);
let passed=0;
async function check(name,f){await f();passed+=1;console.log(`ok ${passed} ${name}`);}
async function settle(){for(let pass=0;pass<3;pass+=1){await new Promise(resolve=>setTimeout(resolve,5));for(let i=0;i<40;i+=1)await new Promise(resolve=>setImmediate(resolve));}}

// The small DOM of tests/contracts/r80-resume-active-contracts.cjs.
// A small DOM: ids are registered when a node joins the document; querySelector finds a descendant by class or id.
function createDom(){
  const byId=new Map();
  class El{
    constructor(tag){this.tagName=String(tag).toUpperCase();this.children=[];this.parent=null;this._id="";this.className="";this.textContent="";this.dataset={};this.attributes={};this.listeners={};this.disabled=false;this.type="";this.style={};
      const self=this;this.classList={add:(...c)=>{const s=new Set(self.className.split(/\s+/).filter(Boolean));c.forEach(x=>s.add(x));self.className=[...s].join(" ");},remove:(...c)=>{self.className=self.className.split(/\s+/).filter(x=>x&&!c.includes(x)).join(" ");},contains:c=>self.className.split(/\s+/).includes(c)};}
    get id(){return this._id;}set id(v){this._id=String(v);if(this.connected())byId.set(this._id,this);}
    connected(){let n=this;while(n){if(n===body)return true;n=n.parent;}return false;}
    register(){if(this._id)byId.set(this._id,this);for(const c of this.children)c.register();}
    append(...nodes){for(const n of nodes){if(typeof n==="string")continue;n.parent=this;this.children.push(n);if(this.connected())n.register();}}
    replaceChildren(...nodes){this.children=[];this.append(...nodes);}
    remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);this.parent=null;if(byId.get(this._id)===this)byId.delete(this._id);}
    insertBefore(n){this.append(n);return n;}
    addEventListener(type,fn){(this.listeners[type]||(this.listeners[type]=[])).push(fn);}
    setAttribute(k,v){this.attributes[k]=String(v);}getAttribute(k){return Object.hasOwn(this.attributes,k)?this.attributes[k]:null;}
    removeAttribute(k){delete this.attributes[k];}hasAttribute(k){return Object.hasOwn(this.attributes,k);}
    querySelector(selector){const m=/^([.#])([\w-]+)$/.exec(selector);if(!m)return null;const hit=n=>m[1]==="."?n.classList.contains(m[2]):n._id===m[2];const walk=n=>{for(const c of n.children){if(hit(c))return c;const deep=walk(c);if(deep)return deep;}return null;};return walk(this);}
    get innerText(){return [this.textContent,...this.children.map(c=>c.innerText)].filter(Boolean).join(" ");}
  }
  const body=new El("body");
  const document={visibilityState:"visible",body,documentElement:body,createElement:tag=>new El(tag),getElementById:id=>byId.get(id)||null,querySelector:selector=>body.querySelector(selector),addEventListener(){}};
  return {document,shown:id=>{const n=byId.get(id);return Boolean(n&&n.connected()&&!n.classList.contains("hidden"));}};
}


// js/productionSharedJourneyEntry.js with the services it asks (as r80-resume-active's entryHarness), entered through
// openSharedExperience (Home CONTINUE with an ACTIVE session: openPanel({resumeActive:true})).
function entryHarness({terminal=null,refreshTo=undefined,played=false,pair=null,deletedDuringOpen=false,openThrows=false,resumeThrows=false}={}){
  const dom=createDom();
  const calls={careerStart:0,refresh:0,leaveEnded:[],navigate:[],errors:[],seasonResults:0};
  const remoteState={sessionState:"active",sessionId:SESSION,pendingAction:null,rivalryId:RIVALRY,accountId:"uid_nik",deviceId:DEVICE,expiresAtEpochMs:Date.now()+3_600_000};
  const setupState={ready:true,rivalryId:RIVALRY,managerRole:"playerTwo",setup:{phase:"SHOWDOWN_CONFIRMED",revision:6}};
  let held=terminal;
  const close={install(){},getState:()=>held,refresh:async()=>{calls.refresh+=1;if(refreshTo!==undefined)held=refreshTo;return held;},
    leaveEnded:id=>{if(!held||held.phase!=="DELETED"||held.rivalryId!==id)return false;calls.leaveEnded.push(id);return true;}};
  const sandbox={console,setTimeout,clearTimeout,Promise,Date,document:dom.document,MutationObserver:class{observe(){}disconnect(){}},
    sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},
    loadRuntimeStyle:async()=>true,loadRuntimeScript:async key=>{throw new Error(`unexpected load ${key}`);},
    ensureSaveLibraryRuntimeAuthority:async()=>true,ensureGameplayModules:async()=>true,
    navigateTo:async name=>{calls.navigate.push(name);return true;},
    CareerModeSaveLibraryRuntime:{isReady:()=>true,getLibrarySnapshot:()=>({activeSaveId:null,saves:[]}),saveCurrentShowdown:()=>true,clearActiveShowdown(){}},
    CareerModeOnlinePlayerIdentity:{getState:()=>({status:"ready",managerId:"nik",registered:true}),subscribe:()=>()=>{}},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true})},
    CareerModeSparkConnectedAccount:{initialize:async()=>true,getState:()=>({connected:true,accountId:"uid_nik"})},
    CareerModeSparkPrivatePairing:{initialize:async()=>true,getState:()=>({registered:true,deviceId:DEVICE})},
    CareerModeSparkConnectedRivalry:{initialize:async()=>true,getState:()=>({attached:true,rivalryId:RIVALRY})},
    CareerModeSparkRemoteJoining:{getState:()=>remoteState,openPanel:async()=>true,closePanel(){},subscribe:()=>()=>{}},
    CareerModePersistentNikDanielPair:pair?{getState:()=>pair,subscribe:()=>()=>{}}:undefined,
    CareerModeProductionSharedShowdownSetup:{refresh:async()=>setupState,getState:()=>setupState},
    // The resume finds no season to continue (the rivalry is closed under it).
    CareerModeProductionSharedMultiSeasonProgression:{install(){},resumeFromAuthority:async()=>{if(resumeThrows)throw new Error("rivalry closed");return null;},lastError:()=>null,decorateDashboard(){}},
    CareerModeProductionSharedCareerStart:{openPanel:async()=>{calls.careerStart+=1;if(deletedDuringOpen)held={phase:"DELETED",rivalryId:RIVALRY,terminal:false,deleted:true};if(openThrows)throw new Error("Career Start could not be read");return true;},closePanel(){}},
    CareerModeProductionSharedTerminalClose:close,
    CareerModeProductionSharedSeasonResults:{install(){}},
    CareerModeProductionSharedShowdownPresentation:{activate:async()=>true,isPresentationActive:()=>false},
    reportApplicationError:(context)=>{calls.errors.push(context);}};
  sandbox.globalThis=sandbox;sandbox.currentShowdown=played?{rounds:[{round:1}],currentRound:2}:{rounds:[],currentRound:1};
  vm.createContext(sandbox);vm.runInContext(read("js/productionSharedJourneyEntry.js"),sandbox,{filename:"productionSharedJourneyEntry.js"});
  const api=sandbox.CareerModeProductionSharedJourneyEntry;
  assert.ok(api&&typeof api.openPanel==="function","the entry loads in the harness");
  return {api,calls,careerStartShown:()=>calls.careerStart,getReady:()=>dom.shown("productionSharedJourneyEntryOverlay")};
}
const DELETED={phase:"DELETED",rivalryId:RIVALRY,terminal:false,deleted:true};
const CLOSED={phase:"CLOSED",rivalryId:RIVALRY,terminal:true};

async function main(){
  await check("E1 Terminal Close holds this Setup's rivalry DELETED: CONTINUE goes Home, never Career Start (no read)",async()=>{
    const h=entryHarness({terminal:DELETED});
    await h.api.openPanel({resumeActive:true});await settle();
    assert.equal(h.calls.careerStart,0,"Career Start of an ended Showdown never opens");
    assert.deepEqual(h.calls.leaveEnded,[RIVALRY],"Terminal Close leaves it for Home (with its once-only notice)");
    assert.equal(h.calls.refresh,0,"what this page already holds answers: no read");
    // Another rivalry's DELETED is not this Showdown's end.
    const other=entryHarness({terminal:{...DELETED,rivalryId:OTHER}});
    await other.api.openPanel({resumeActive:true});await settle();
    assert.equal(other.calls.careerStart,1,"another rivalry's end changes nothing");
  });
  await check("E2 this save already played a season: one Terminal Close read; DELETED goes Home",async()=>{
    const h=entryHarness({played:true,refreshTo:DELETED});
    await h.api.openPanel({resumeActive:true});await settle();
    assert.equal(h.calls.refresh,1,"one read");
    assert.equal(h.calls.careerStart,0,"no Career Start");
    assert.deepEqual(h.calls.leaveEnded,[RIVALRY]);
  });
  await check("E3 the pair says this rivalry closed: the read decides (DELETED: Home; live: Career Start as before)",async()=>{
    const closedPair={status:"unpaired",rivalryId:null,closedRivalryId:RIVALRY,connectionState:null};
    const h=entryHarness({pair:closedPair,refreshTo:DELETED});
    await h.api.openPanel({resumeActive:true});await settle();
    assert.deepEqual([h.calls.refresh,h.calls.careerStart,h.calls.leaveEnded.length],[1,0,1],"read, then Home");
    const live=entryHarness({pair:closedPair,refreshTo:null});
    await live.api.openPanel({resumeActive:true});await settle();
    assert.deepEqual([live.calls.refresh,live.calls.careerStart,live.calls.leaveEnded.length],[1,1,0],"the pair alone never ends a Showdown");
    const otherPair=entryHarness({pair:{...closedPair,closedRivalryId:OTHER},refreshTo:DELETED});
    await otherPair.api.openPanel({resumeActive:true});await settle();
    assert.deepEqual([otherPair.calls.refresh,otherPair.calls.careerStart],[0,1],"another rivalry's close is no reason to read");
  });
  await check("E4 a fresh Showdown's first Career Start: no extra read, Career Start opens",async()=>{
    const h=entryHarness({refreshTo:DELETED});
    await h.api.openPanel({resumeActive:true});await settle();
    assert.deepEqual([h.calls.refresh,h.calls.careerStart,h.calls.leaveEnded.length],[0,1,0]);
  });
  await check("E5 DELETED lands while Career Start opens: the page leaves it for Home right after",async()=>{
    const h=entryHarness({deletedDuringOpen:true});
    await h.api.openPanel({resumeActive:true});await settle();
    assert.equal(h.calls.careerStart,1);
    assert.deepEqual(h.calls.leaveEnded,[RIVALRY],"Home after the open");
    assert.equal(h.calls.refresh,0,"no read");
  });
  await check("E8 the entry fails because the Showdown ended under it: Home, not GET READY over its Career Start (the Gate's stuck screen)",async()=>{
    const h=entryHarness({deletedDuringOpen:true,openThrows:true});
    await h.api.openPanel({resumeActive:true});await settle();
    assert.deepEqual(h.calls.leaveEnded,[RIVALRY],"Home");
    assert.equal(h.getReady(),false,"no GET READY");
    assert.equal(h.calls.errors.length,0,"an ended Showdown is not reported as a failure");
    const resume=entryHarness({played:true,resumeThrows:true,refreshTo:DELETED});
    await resume.api.openPanel({resumeActive:true});await settle();
    assert.deepEqual([resume.calls.refresh,resume.calls.leaveEnded.length,resume.getReady()],[1,1,false],"a resume that failed on the ended Showdown: one read, Home");
    const live=entryHarness({played:true,resumeThrows:true,refreshTo:null});
    await live.api.openPanel({resumeActive:true});await settle();
    assert.deepEqual([live.calls.leaveEnded.length,live.getReady()],[0,true],"a live Showdown's failed entry still falls back to GET READY");
  });
  await check("E6 a finished (CLOSED) Showdown keeps its Champion path, never Home first",async()=>{
    const h=entryHarness({terminal:CLOSED,played:true});
    await h.api.openPanel({resumeActive:true});await settle();
    assert.equal(h.calls.careerStart,0);
    assert.equal(h.calls.leaveEnded.length,0,"not the ended-early path");
    assert.equal(h.calls.navigate[0],"seasonEntry","the Champion screen (Season Results host) first");
  });
  await check("E7 Terminal Close: the ended notice once per Showdown; the automatic leave still does nothing on Home; leaveEnded needs a held DELETED",async()=>{
    const src=read("js/productionSharedTerminalClose.js");
    const a=src.indexOf("  const endedNoticeShown=new Set();"),b=src.indexOf("  function ptcClear(");
    assert.ok(a>0&&b>a,"the leave functions are where they were");
    assert.match(src,/if\(state\.phase==="DELETED"&&previousPhase!=="DELETED"\)ptcLeaveEndedShowdown\(state\.rivalryId\|\|request\.rivalryId\);/,"the automatic leave is unchanged");
    assert.match(src,/getState:ptcCurrentState,isBusy:\(\)=>busy,leaveEnded:ptcLeaveEnded/,"leaveEnded is exported");
    const run=({home,held})=>{
      const notices=[],shown=[];const homeEl={classList:{contains:c=>c==="hidden"?!home:false}};
      const sandbox={root:{document:{getElementById:id=>id==="mainMenu"?homeEl:null},showAppNotice:(...a)=>notices.push(a[0]),showScreen:name=>shown.push(name),refreshMainMenuExperience(){},stopTransferTimerLoop(){},resetTransientSelectionOperations(){},resetNavigationState(){}},ptcCurrentState:()=>held};
      vm.createContext(sandbox);vm.runInContext(src.slice(a,b),sandbox);
      return {sandbox,notices,shown};
    };
    const onHome=run({home:true,held:DELETED});
    vm.runInContext(`ptcLeaveEndedShowdown(${JSON.stringify(RIVALRY)})`,onHome.sandbox);
    assert.deepEqual([onHome.shown,onHome.notices.length],[[],0],"the automatic leave on Home: nothing (as before)");
    assert.equal(vm.runInContext(`ptcLeaveEnded(${JSON.stringify(RIVALRY)})`,onHome.sandbox),true,"Journey Entry's leave acts on Home under its layers");
    assert.deepEqual([onHome.shown,onHome.notices.length],[["mainMenu"],1],"Home, and the notice");
    vm.runInContext(`ptcLeaveEnded(${JSON.stringify(RIVALRY)})`,onHome.sandbox);
    assert.equal(onHome.notices.length,1,"the notice shows once per Showdown");
    const away=run({home:false,held:DELETED});
    vm.runInContext(`ptcLeaveEndedShowdown(${JSON.stringify(RIVALRY)});ptcLeaveEnded(${JSON.stringify(RIVALRY)})`,away.sandbox);
    assert.equal(away.notices.length,1,"the automatic leave and the entry's leave share the one notice");
    const none=run({home:true,held:null});
    assert.equal(vm.runInContext(`ptcLeaveEnded(${JSON.stringify(RIVALRY)})`,none.sandbox),false,"nothing held: nothing");
    const otherHeld=run({home:true,held:{...DELETED,rivalryId:OTHER}});
    assert.equal(vm.runInContext(`ptcLeaveEnded(${JSON.stringify(RIVALRY)})`,otherHeld.sandbox),false,"another rivalry's DELETED: nothing");
    const closedHeld=run({home:true,held:CLOSED});
    assert.equal(vm.runInContext(`ptcLeaveEnded(${JSON.stringify(RIVALRY)})`,closedHeld.sandbox),false,"a finished Showdown is never left this way");
  });
  console.log(`PASS r100 ended entry contracts: ${passed} checks`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});

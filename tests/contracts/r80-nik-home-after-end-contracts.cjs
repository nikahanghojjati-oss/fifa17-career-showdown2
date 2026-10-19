"use strict";
// r80: right after Daniel's END SHOWDOWN, Nik's Home (and History) must be the normal Home with no active Showdown and the
// ended-early notice, never the reconnect banner. The r80 release gallery (home-after-end-showdown-nik, history-ended-early-nik)
// showed "NOT CONNECTED ON THIS PHONE · A reload ends the session. Tap RECONNECT SESSION ... or JOIN Daniel's new code" with
// a RECONNECT SESSION button over Nik's Home, on a Showdown that had ended (on the phone it overlapped the NIK / NO ACTIVE
// SHOWDOWN badges and pushed Home down; on desktop the plate layer covered it). The emulator replay showed it stays for good.
// Cause: Nik's page learns of the END from its own Terminal Close read (phase DELETED: closed, no finish witness), forgets the
// private session and goes Home, but it still holds the ended Showdown's shared save shell. The forgotten session woke Shared
// Journey Reconnect, which saw a shared marker and no session and published FRESH_SESSION_REQUIRED: "not connected". Only a
// finished Showdown (CLOSED) was treated as over; an ended one (DELETED) was not.
//   E1 Nik's page after the other phone's END (Terminal Close DELETED, session forgotten): no state, banner hidden, no
//      RECONNECT SESSION; for both roles and for the shell with or without its rivalry id.
//   E2 the order race: the forgotten session wakes the banner first (the old Showdown, no session: NOT CONNECTED), then
//      Terminal Close announces DELETED: the banner hides at once and stays hidden on later wakes.
//   E4 (Codex #942) END lands while a refresh is in flight (stalled on a network-backed read): the banner and its action clear
//      at once, before that refresh settles, and the stalled refresh can no longer publish or report when it finally does.
//   E3 not a blanket hide: a live Showdown with no session on this phone (a reload) still says NOT CONNECTED with RECONNECT
//      SESSION, and a finished Showdown (CLOSED) keeps its SHOWDOWN COMPLETE line with no button.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const ROOT=path.resolve(__dirname,"../..");
const source=fs.readFileSync(path.join(ROOT,"js/productionSharedJourneyReconnect.js"),"utf8");
const RIVALRY=`pair_${"5e".repeat(32)}`;
const DEVICE=`device_${"ab".repeat(16)}`;
const NO_SESSION=Object.freeze({sessionId:null,rivalryId:null,accountId:null,deviceId:null,sessionState:null,pendingAction:null,expiresAtEpochMs:null});

function harness({role="playerTwo",terminal=null,marker={contractVersion:1,mode:"shared",rivalryId:RIVALRY}}={}){
  const remoteListeners=new Set(),events=new Map(),reports=[];
  const page={terminal,remote:NO_SESSION,stall:null};
  const status={id:"sharedJourneyReconnectStatus",text:"",dataset:{},hidden:true,children:[],
    classList:{toggle:(name,force)=>{if(name==="hidden")status.hidden=Boolean(force);}},
    replaceChildren(...items){status.children=items;status.text=items.map(item=>typeof item==="string"?item:item.textContent||"").join("");},
    append(...items){status.children.push(...items);status.text+=items.map(item=>typeof item==="string"?item:item.textContent||"").join("");}};
  const document={visibilityState:"visible",getElementById:id=>id==="sharedJourneyReconnectStatus"?status:null,createTextNode:text=>String(text),
    createElement:()=>{const node={textContent:"",dataset:{},addEventListener(){}};return node;},addEventListener(){}};
  const sandbox={console,Promise,Date,document,navigator:{onLine:true},setTimeout,clearTimeout,setInterval(){return 0;},
    addEventListener:(name,fn)=>{if(!events.has(name))events.set(name,[]);events.get(name).push(fn);},
    dispatchEvent(){},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init&&init.detail;}},
    currentShowdown:{sharedJourney:marker,managers:{playerOne:"Daniel",playerTwo:"Nik"}},
    reportApplicationError:(context,error)=>reports.push(`${context}: ${error&&error.message}`),
    loadRuntimeScript:async()=>true,
    CareerModeSharedMultiSeasonProgression:require("../../js/sharedMultiSeasonProgression.js"),
    CareerModeSharedJourneyReconnect:require("../../js/sharedJourneyReconnect.js"),
    CareerModeProductionSharedShowdownSetup:{refresh:async()=>true,getState:()=>({ready:false})},
    CareerModeProductionSharedMultiSeasonProgression:{refresh:async()=>true,getState:()=>({authoritative:false}),lastError:()=>""},
    CareerModeProductionSharedTerminalClose:{getState:()=>page.terminal},
    CareerModeSparkRemoteJoining:{getState:()=>page.remote,subscribe:listener=>{remoteListeners.add(listener);return ()=>remoteListeners.delete(listener);},openPanel:async()=>true,closePanel:()=>true},
    CareerModeSparkConnectedAccount:{initialize:()=>page.stall?page.stall.promise:undefined,getState:()=>({connected:true,accountId:role==="playerTwo"?"uid_nik":"uid_daniel"})},
    CareerModeSparkPrivatePairing:{getState:()=>({registered:true,deviceId:DEVICE})},
    // The ended rivalry is still the attached one on this page (as on Nik's phone right after END).
    CareerModeSparkConnectedRivalry:{getState:()=>({attached:true,rivalryId:RIVALRY,binding:{managerRole:role}})}};
  sandbox.globalThis=sandbox;vm.createContext(sandbox);
  vm.runInContext(source,sandbox,{filename:"js/productionSharedJourneyReconnect.js"});
  const api=sandbox.CareerModeProductionSharedJourneyReconnect;
  api.install();
  return {api,page,status,reports,
    fire:name=>{for(const fn of events.get(name)||[])fn({type:name,detail:page.terminal});},
    button:()=>status.children.find(item=>item&&item.id==="sharedJourneyReconnectAction")||null};
}
async function settle(){for(let pass=0;pass<3;pass+=1){await new Promise(resolve=>setTimeout(resolve,2));for(let i=0;i<30;i+=1)await new Promise(resolve=>setImmediate(resolve));}}
const deleted=()=>({phase:"DELETED",rivalryId:RIVALRY,terminal:false});
const assertNoBanner=(h,label)=>{
  assert.equal(h.api.getState(),null,`${label}: no reconnect state is held for an ended Showdown`);
  assert.equal(h.status.hidden,true,`${label}: the banner is hidden`);
  assert.doesNotMatch(h.status.text,/NOT CONNECTED|RECONNECT SESSION/,`${label}: no NOT CONNECTED / RECONNECT SESSION text`);
  assert.equal(h.button(),null,`${label}: no RECONNECT SESSION button`);
  assert.deepEqual(h.reports,[],`${label}: nothing is reported`);
};

(async()=>{
  // E1: the page already holds the END (Terminal Close DELETED) when the banner refreshes.
  for(const role of ["playerTwo","playerOne"]){
    for(const marker of [{contractVersion:1,mode:"shared",rivalryId:RIVALRY},{contractVersion:1,mode:"shared",setupPending:true}]){
      const h=harness({role,terminal:deleted(),marker});
      await h.api.refresh();await settle();
      assertNoBanner(h,`E1 ${role} ${marker.rivalryId?"marker with rivalry":"save shell"}`);
    }
  }
  console.log("ok E1 after the other phone's END the banner stays hidden: no NOT CONNECTED, no RECONNECT SESSION");

  // E2: the forgotten session wakes the banner before Terminal Close publishes DELETED.
  const race=harness();
  await race.api.refresh();await settle();
  assert.equal(race.api.getState()?.phase,"FRESH_SESSION_REQUIRED","E2 precondition: the live Showdown with no session reads not connected");
  assert.equal(race.status.hidden,false);
  race.page.terminal=deleted();
  race.fire("career-mode-shared-terminal-close-state-change");await settle();
  assertNoBanner(race,"E2 Terminal Close announced DELETED");
  for(const name of ["career-mode-connected-account-state-change","online","career-mode-shared-setup-state-change"])race.fire(name);
  await race.api.refresh();await settle();
  assertNoBanner(race,"E2 later wakes and refreshes");
  console.log("ok E2 a banner raised by the forgotten session hides as soon as Terminal Close announces the END");

  // E4: the refresh is stalled in a network-backed read when Terminal Close announces DELETED.
  const stalled=harness();
  await stalled.api.refresh();await settle();
  assert.equal(stalled.api.getState()?.phase,"FRESH_SESSION_REQUIRED","E4 precondition: the banner shows");
  assert.equal(stalled.status.hidden,false);
  let release;stalled.page.stall={promise:new Promise(resolve=>{release=resolve;})};
  const inFlight=stalled.api.refresh();await settle();
  assert.equal(stalled.api.isBusy(),true,"E4 precondition: a refresh is in flight");
  stalled.page.terminal=deleted();
  stalled.fire("career-mode-shared-terminal-close-state-change");
  assertNoBanner(stalled,"E4 at once, while the refresh is still in flight");
  stalled.page.stall=null;release();await inFlight;await settle();
  assertNoBanner(stalled,"E4 after the stalled refresh settles");
  console.log("ok E4 END during an in-flight refresh clears the banner at once; the stalled refresh cannot bring it back");

  // E3: controls.
  const reload=harness({terminal:null});
  await reload.api.refresh();await settle();
  assert.equal(reload.api.getState()?.phase,"FRESH_SESSION_REQUIRED");
  assert.equal(reload.status.hidden,false,"E3 a live Showdown without a session on this phone still shows the banner");
  assert.match(reload.status.text,/^NOT CONNECTED ON THIS PHONE · /);
  assert.ok(reload.button(),"E3 RECONNECT SESSION is still offered for a live Showdown");
  for(const phase of ["READY","RECOVERY_PENDING","BLOCKED"]){
    const live=harness({terminal:{phase,rivalryId:RIVALRY,terminal:false}});
    await live.api.refresh();await settle();
    assert.equal(live.status.hidden,false,`E3 Terminal Close ${phase} is not an END: the banner still shows`);
    assert.ok(live.button(),`E3 Terminal Close ${phase}: RECONNECT SESSION is still offered`);
  }
  const finished=harness({terminal:{phase:"CLOSED",rivalryId:RIVALRY,terminal:true}});
  await finished.api.refresh();await settle();
  assert.equal(finished.status.hidden,false);
  assert.match(finished.status.text,/^SHOWDOWN COMPLETE · /,"E3 a finished Showdown keeps its SHOWDOWN COMPLETE line");
  assert.equal(finished.button(),null,"E3 a finished Showdown offers no RECONNECT SESSION");
  console.log("ok E3 a live Showdown without a session still offers RECONNECT SESSION; a finished one keeps SHOWDOWN COMPLETE");
  console.log("PASS r80 Nik's Home after END: no reconnect banner for an ended Showdown");
})().catch(error=>{console.error(error);process.exitCode=1;});

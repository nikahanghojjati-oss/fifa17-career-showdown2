#!/usr/bin/env node
"use strict";
// R92-02 (2.4.0 hunt R1): js/productionSharedMultiSeasonProgression.js runs a 15 s season-progress poll whenever the season-commit
// waiting listener is not healthy. Each pass re-reads the setup and every season commit (with their Rules lookups). The two Squad
// Management screens made a middle season about 50 s longer, so the poll ran about 3 more times per phone each season while
// nothing on the Squad screen needs season progress, and no season can be accepted or end while a phone is on it.
//   SP-1 no poll read while the Squad screen (#sqStage, pre or post) is the active screen;
//   SP-2 the moment it closes (removed, or data-state=leaving under the next screen) one pass runs at once, then the poll resumes;
//   SP-3 a Squad screen shorter than one poll interval costs no extra read when it closes;
//   SP-4 the pass on close is the same check as every pass (no read while the listener is healthy, none while the page is hidden);
//   SP-5 events still wake a refresh while the Squad screen is up (the live paths are not touched).
// On the old code (gameplay/r91 712f6301) SP-1 fails: every pass reads while the Squad screen is up.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
let passed=0;const ok=name=>{passed+=1;console.log(`ok ${passed} ${name}`);};

const rivalryId="pair_test";
let reads=0,healthy=false,stage=null;
const intervals=[],timeouts=[],listeners={};
const setup={ready:true,rivalryId,sessionId:"session_test",deviceId:"device_test",accountId:"uid_test",managerRole:"playerOne",setup:{phase:"SHOWDOWN_CONFIRMED",revision:6}};
const result=accepted=>({ok:true,authoritative:true,runtimeRevision:"1.9.1-r13",rivalryId,phase:"SEASON_READY",
  state:{runtimeRevision:"1.9.1-r13",rivalryId,acceptedSeasons:accepted,totalSeasons:3,terminal:false},
  dashboard:{acceptedSeasons:accepted,managerTotals:{playerOne:0,playerTwo:0},lastSeason:null}});
const document={visibilityState:"visible",getElementById:id=>id==="sqStage"?stage:null,addEventListener:()=>{}};
const sandbox={
  currentShowdown:{id:"save_test",currentRound:2,sharedJourney:{mode:"shared",rivalryId}},
  document,
  CareerModeProductionSharedShowdownSetup:{refresh:async()=>setup,getState:()=>setup},
  CareerModeProductionSharedHistoryConvergence:{refresh:async()=>null,getState:()=>null},
  CareerModeSharedMultiSeasonProgression:{},
  CareerModeSparkSharedMultiSeasonProgression:{read:async()=>{reads+=1;return result(1);}},
  CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({auth:{currentUser:{uid:"uid_test"}},firestore:{},firestoreSdk:{}})},
  CareerModeProductionSharedSeasonCommit:{waitingListenerHealthy:()=>healthy},
  CustomEvent:class{constructor(type,{detail}={}){this.type=type;this.detail=detail;}},
  dispatchEvent:()=>true,navigateTo:async()=>true,
  addEventListener:(type,fn)=>{(listeners[type]=listeners[type]||[]).push(fn);},
  setInterval:(fn,ms)=>{const h={fn,ms,live:true};intervals.push(h);return h;},
  clearInterval:h=>{if(h)h.live=false;},
  setTimeout:(fn,ms)=>{timeouts.push({fn,ms});return timeouts.length;},
  clearTimeout:()=>{}
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT,"js/productionSharedMultiSeasonProgression.js"),"utf8"),sandbox);
const api=sandbox.CareerModeProductionSharedMultiSeasonProgression;
const settle=async()=>{for(let i=0;i<6;i+=1){await new Promise(r=>setImmediate(r));while(timeouts.length){const t=timeouts.shift();t.fn();await new Promise(r=>setImmediate(r));}}};
const poll=()=>intervals.find(h=>h.ms===15000);
const watchers=()=>intervals.filter(h=>h.ms!==15000&&h.live);
const pass=async()=>{poll().fn();await settle();};
const tickWatchers=async()=>{for(const h of watchers())h.fn();await settle();};
const squad=state=>{stage={id:"sqStage",isConnected:true,dataset:{state}};};

(async()=>{
  api.install();await settle();
  assert.ok(poll(),"the 15 s poll is installed");
  const start=reads;
  await pass();assert.equal(reads,start+1,"a poll pass reads when the waiting listener is not healthy (unchanged)");

  // SP-1
  squad("ready");let before=reads;
  for(let i=0;i<4;i+=1)await pass();
  assert.equal(reads,before,`SP-1 no poll read while the Squad screen is up (got ${reads-before} in 4 passes = 60 s)`);
  assert.equal(watchers().length,1,"SP-1 one light watcher (no reads) waits for the Squad screen to close");
  await tickWatchers();assert.equal(reads,before,"SP-1 the watcher itself never reads while the screen is up");
  ok("SP-1 no season-progress poll read while the Squad screen is up");

  // SP-2: leaving (the next screen draws over it), then removed.
  stage.dataset.state="leaving";await tickWatchers();
  assert.equal(reads,before+1,"SP-2 one pass at once when the Squad screen moves aside for the next screen");
  assert.equal(watchers().length,0,"SP-2 the watcher stops");
  await pass();assert.equal(reads,before+2,"SP-2 the normal poll resumes");
  squad("ready");before=reads;await pass();await pass();assert.equal(reads,before);
  stage=null;await tickWatchers();assert.equal(reads,before+1,"SP-2 one pass at once when the Squad screen is removed");
  await tickWatchers();assert.equal(reads,before+1,"SP-2 exactly one");
  ok("SP-2 the moment the Squad screen closes one pass runs, then the poll resumes");

  // SP-3: the screen came and went between two passes.
  before=reads;squad("ready");stage=null;await pass();
  assert.equal(reads,before+1,"SP-3 a short Squad screen: the next pass is a normal one");
  assert.equal(watchers().length,0,"SP-3 no watcher");
  ok("SP-3 a Squad screen shorter than one pass costs nothing extra");

  // SP-4: the pass on close is the normal check.
  squad("ready");await pass();healthy=true;before=reads;stage=null;await tickWatchers();
  assert.equal(reads,before,"SP-4 healthy listener: no read on close (as every pass)");
  healthy=false;squad("ready");await pass();document.visibilityState="hidden";before=reads;stage=null;await tickWatchers();
  assert.equal(reads,before,"SP-4 hidden page: no read on close");
  document.visibilityState="visible";await pass();assert.equal(reads,before+1,"SP-4 visible again: the poll reads");
  ok("SP-4 the pass on close is the same check as every poll pass");

  // SP-5: events are not paused.
  squad("ready");await pass();before=reads;
  for(const fn of listeners["career-mode-shared-history-convergence-state-change"]||[])fn();await settle();
  assert.equal(reads,before+1,"SP-5 a Shared History event still refreshes while the Squad screen is up");
  stage=null;await tickWatchers();
  ok("SP-5 events still wake a refresh while the Squad screen is up");

  console.log(`r91-squad-poll-pause: ${passed} checks passed`);
})().catch(error=>{console.error(error);process.exit(1);});

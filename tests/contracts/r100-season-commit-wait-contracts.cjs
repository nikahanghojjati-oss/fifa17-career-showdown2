"use strict";
// Phoenix r100, B6's one-off stall (lead thread): in 1 of 5 CE2PG runs, Daniel's LOCK & CONFIRM landed but Nik's button did not
// turn into CONFIRM SEASON within 45 s. Both Season Commit timers stop while psscWaitHealthy() is true, and that needs only the
// budget layer's wait listener to look healthy (stats().watchHealthy = fsbWaitLive(): a cached copy ends it at once, silence
// never does). In a normal run that listener watches the commit itself, so one late or lost delivery held Nik until a touch.
// Fix: while this phone waits on the rival, the 15 s check keeps running and reads the commit from the server (readServerNext),
// every 15 s for 3 minutes, then every 60 s; the 3 s check stays held back. Live proof: FIJ_FAULT=silentcommit FIJ_PHONE=nik (tests/browser/support/fij-silent-commit.js).
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const source=fs.readFileSync(path.join(ROOT,"js/productionSharedSeasonCommit.js"),"utf8");
let passed=0;const ok=label=>{passed+=1;console.log(`ok ${passed} ${label}`);};

// S1: the 15 s check runs the wait check while the wait looks healthy; the 3 s check is unchanged.
assert.match(source,/root\.setInterval\(\(\)=>\{if\(!psscWaitHealthy\(\)\)void psscTick\(\);else psscWaitCheck\(\);\},POLL_MS\);/,"the 15 s check runs the wait check while the wait looks healthy");
assert.match(source,/function psscFastTick\(\)\{psscWatchWait\(\);psscRefreshWaitLine\(\);if\(psscWaitHealthy\(\)\|\|/,"the 3 s check still stops while the wait looks healthy");
assert.match(source,/const POLL_MS=15000\b|POLL_MS=15000/,"the slow check is 15 s");
const check=source.match(/  function psscWaitCheck\(\)\{[^\n]*\n/);assert.ok(check,"psscWaitCheck is where it was");
assert.match(check[0],/if\(busy\|\|root\.document\?\.visibilityState==="hidden"\|\|root\.navigator\?\.onLine===false\)return;/,"nothing while busy, hidden or offline");
assert.match(source,/const WAIT_CHECK_SLOW_MS=60000;/,"after the first 3 minutes the wait check runs once a minute");
assert.match(check[0],/readServerNext\?\.\(path\);[^\n]*void psscTick\(\);/,"the commit read goes to the server, then the full check runs");
ok("Season Commit: during the wait the 15 s check reads the commit from the server even while the listener looks healthy; the 3 s check stays held back");

// S2: psscWaitCheckPath and psscWaitCheck, run on their own.
const line=source.match(/  function psscWaitCheckPath\(\)\{[^\n]*\n/);assert.ok(line,"psscWaitCheckPath is where it was");
assert.doesNotMatch(line[0]+check[0],/runTransaction|getDoc|setDoc|wantFresh|onSnapshot/,"the wait check makes no read of its own");
const slow=source.match(/  const WAIT_CHECK_SLOW_MS=60000;[^\n]*\n/)[0];
const world=()=>{
  const state={waiting:true,hidden:false,offline:false,busy:false,request:{rivalryId:"pair_x",seasonNumber:2},throwKey:false,now:0,asked:[],ticks:0};
  const sandbox={FAST_POLL_WINDOW_MS:180000,Date:{now:()=>state.now},get busy(){return state.busy;},
    root:{get document(){return {visibilityState:state.hidden?"hidden":"visible"};},get navigator(){return {onLine:!state.offline};},CareerModeFirestoreBudget:{readServerNext:path=>state.asked.push(path)}},
    psscWaitingKey:()=>{if(state.throwKey)throw new Error("x");return state.waiting?"pair_x|2|commit":"";},psscRequestContext:()=>state.request,psscTick:()=>{state.ticks+=1;}};
  vm.createContext(sandbox);vm.runInContext(`${line[0]}${slow}${check[0]}`,sandbox);
  return {state,tick:()=>vm.runInContext("psscWaitCheck()",sandbox)};
};
const run=options=>{const w=world();Object.assign(w.state,options);w.tick();return {asked:w.state.asked,ticks:w.state.ticks};};
const commit="rivalries/pair_x/seasonCommits/season_2";
assert.deepEqual(run({waiting:false}),{asked:[],ticks:0},"not waiting: nothing extra");
assert.deepEqual(run({waiting:true}),{asked:[commit],ticks:1},"waiting: this season's commit goes to the server, then one check");
assert.deepEqual(run({waiting:true,hidden:true}),{asked:[],ticks:0},"hidden: nothing");
assert.deepEqual(run({waiting:true,busy:true}),{asked:[],ticks:0},"busy: nothing");
assert.deepEqual(run({waiting:true,offline:true}),{asked:[],ticks:0},"offline: nothing (the read would only fail; the check runs again once online)");
assert.deepEqual(run({waiting:true,request:{rivalryId:"",seasonNumber:2}}),{asked:[],ticks:0},"no rivalry: nothing");
assert.deepEqual(run({waiting:true,throwKey:true}),{asked:[],ticks:0},"a throw changes nothing");
// Cost: the 15 s timer for 10 minutes of one wait: every 15 s for 3 minutes (12), then every 60 s (7): 19 reads.
{const w=world();for(let t=15000;t<=600000;t+=15000){w.state.now=t;w.tick();}
  assert.equal(w.state.ticks,19,`a 10-minute wait costs ${w.state.ticks} wait checks; the lead's budget is about 19`);
  w.state.waiting=false;w.state.now+=15000;w.tick();w.state.waiting=true;w.state.now+=15000;w.tick();
  assert.equal(w.state.ticks,20,"a new wait starts at 15 s again");
  w.state.now+=15000;w.tick();assert.equal(w.state.ticks,21,"and keeps 15 s during its first 3 minutes");}
ok("psscWaitCheck: one server read of this season's commit per 15 s for 3 minutes, then per 60 s (19 in 10 minutes), only while this phone waits, visible, online and not busy");

// S3: the live fault point exists and is wired only for its own run.
const fij=fs.readFileSync(path.join(ROOT,"tests/browser/fault-injection-journey.cjs"),"utf8"),hook=fs.readFileSync(path.join(ROOT,"tests/browser/support/fij-silent-commit.js"),"utf8");
assert.match(fij,/if\(FAULT==="silentcommit"\)\{[^]*?await context\.addInitScript\(\{path:SILENT_COMMIT\}\);\n  \}/,"the silent-listener hook loads only for FIJ_FAULT=silentcommit");
assert.match(fij,/case "silentcommit":\{[^]*?pass:shown&&waited<=20000/,"the fault point fails when CONFIRM SEASON takes over 20 s");
assert.match(hook,/\/\\\/seasonCommits\\\/season_\\d\+\$\//,"only the commit listeners go silent");
assert.match(hook,/if\(served&&window\.__fijSilentCommits===true\)/,"silent only after the listener's first server copy");
assert.match(fij,/globalThis\.__fijWrapListen\(R\.onSnapshot,out,target\)/,"the hook sits in the served Firestore module, so the budget layer's wait listener goes silent too");
ok("FIJ_FAULT=silentcommit: every commit listener on the waiting phone goes silent after its first server copy; CONFIRM SEASON must show within 20 s");

console.log(`PASS r100 Season Commit wait contracts: ${passed} checks.`);

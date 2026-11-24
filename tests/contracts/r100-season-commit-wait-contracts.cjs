"use strict";
// Phoenix r100, B6's one-off stall (lead thread): in 1 of 5 CE2PG runs, Daniel's LOCK & CONFIRM landed but Nik's button did not
// turn into CONFIRM SEASON within 45 s. Both Season Commit timers stop while psscWaitHealthy() is true, and that needs only the
// budget layer's wait listener to look healthy (stats().watchHealthy = fsbWaitLive(): a cached copy ends it at once, silence
// never does). In a normal run that listener watches the commit itself, so one late or lost delivery held Nik until a touch.
// Fix: while this phone waits on the rival, the 15 s check keeps running and reads the commit from the server (readServerNext);
// the 3 s check stays held back. Live proof: FIJ_FAULT=silentcommit FIJ_PHONE=nik (tests/browser/support/fij-silent-commit.js).
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const source=fs.readFileSync(path.join(ROOT,"js/productionSharedSeasonCommit.js"),"utf8");
let passed=0;const ok=label=>{passed+=1;console.log(`ok ${passed} ${label}`);};

// S1: the 15 s check runs the wait check while the wait looks healthy; the 3 s check is unchanged.
assert.match(source,/root\.setInterval\(\(\)=>\{if\(!psscWaitHealthy\(\)\)void psscTick\(\);else psscWaitCheck\(\);\},POLL_MS\);/,"the 15 s check runs the wait check while the wait looks healthy");
assert.match(source,/function psscFastTick\(\)\{psscWatchWait\(\);psscRefreshWaitLine\(\);if\(psscWaitHealthy\(\)\|\|/,"the 3 s check still stops while the wait looks healthy");
assert.match(source,/const POLL_MS=15000\b|POLL_MS=15000/,"the slow check is 15 s");
const check=source.match(/  function psscWaitCheck\(\)\{[^\n]*\n/);assert.ok(check,"psscWaitCheck is where it was");
assert.match(check[0],/if\(!path\|\|busy\|\|root\.document\?\.visibilityState==="hidden"\)return;/,"nothing while not waiting, busy or hidden");
assert.match(check[0],/readServerNext\?\.\(path\);[^\n]*void psscTick\(\);/,"the commit read goes to the server, then the full check runs");
ok("Season Commit: during the wait the 15 s check reads the commit from the server even while the listener looks healthy; the 3 s check stays held back");

// S2: psscWaitCheckPath and psscWaitCheck, run on their own.
const line=source.match(/  function psscWaitCheckPath\(\)\{[^\n]*\n/);assert.ok(line,"psscWaitCheckPath is where it was");
assert.doesNotMatch(line[0]+check[0],/runTransaction|getDoc|setDoc|wantFresh|onSnapshot/,"the wait check makes no read of its own");
const run=({waiting,hidden=false,busy=false,request={rivalryId:"pair_x",seasonNumber:2},throwKey=false})=>{
  const asked=[];let ticks=0;
  const sandbox={busy,root:{document:{visibilityState:hidden?"hidden":"visible"},CareerModeFirestoreBudget:{readServerNext:path=>asked.push(path)}},
    psscWaitingKey:()=>{if(throwKey)throw new Error("x");return waiting?"pair_x|2|commit":"";},psscRequestContext:()=>request,psscTick:()=>{ticks+=1;}};
  vm.runInNewContext(`${line[0]}${check[0]};psscWaitCheck()`,sandbox);return {asked,ticks};
};
const commit="rivalries/pair_x/seasonCommits/season_2";
assert.deepEqual(run({waiting:false}),{asked:[],ticks:0},"not waiting: nothing extra");
assert.deepEqual(run({waiting:true}),{asked:[commit],ticks:1},"waiting: this season's commit goes to the server, then one check");
assert.deepEqual(run({waiting:true,hidden:true}),{asked:[],ticks:0},"hidden: nothing");
assert.deepEqual(run({waiting:true,busy:true}),{asked:[],ticks:0},"busy: nothing");
assert.deepEqual(run({waiting:true,request:{rivalryId:"",seasonNumber:2}}),{asked:[],ticks:0},"no rivalry: nothing");
assert.deepEqual(run({waiting:true,throwKey:true}),{asked:[],ticks:0},"a throw changes nothing");
// Cost: one check per 15 s only while waiting (the 3 s check makes none while the wait looks healthy).
ok("psscWaitCheck: one server read of this season's commit per 15 s, only while this phone waits, visible and not busy");

// S3: the live fault point exists and is wired only for its own run.
const fij=fs.readFileSync(path.join(ROOT,"tests/browser/fault-injection-journey.cjs"),"utf8"),hook=fs.readFileSync(path.join(ROOT,"tests/browser/support/fij-silent-commit.js"),"utf8");
assert.match(fij,/if\(FAULT==="silentcommit"\)\{[^]*?await context\.addInitScript\(\{path:SILENT_COMMIT\}\);\n  \}/,"the silent-listener hook loads only for FIJ_FAULT=silentcommit");
assert.match(fij,/case "silentcommit":\{[^]*?pass:shown&&waited<=20000/,"the fault point fails when CONFIRM SEASON takes over 20 s");
assert.match(hook,/\/\\\/seasonCommits\\\/season_\\d\+\$\//,"only the commit listeners go silent");
assert.match(hook,/if\(served&&window\.__fijSilentCommits===true\)/,"silent only after the listener's first server copy");
assert.match(fij,/globalThis\.__fijWrapListen\(R\.onSnapshot,out,target\)/,"the hook sits in the served Firestore module, so the budget layer's wait listener goes silent too");
ok("FIJ_FAULT=silentcommit: every commit listener on the waiting phone goes silent after its first server copy; CONFIRM SEASON must show within 20 s");

console.log(`PASS r100 Season Commit wait contracts: ${passed} checks.`);

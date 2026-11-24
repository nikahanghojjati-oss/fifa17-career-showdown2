"use strict";
// r87 W3-6: the end-of-Showdown atomic session close (js/productionSharedTerminalClose.js ptcCloseOptions) must take server time
// from the connection's clock (js/sparkRemoteJoining.js), not the phone's Date.now(): the Rules check its
// lastActivityAt with freshSessionActivity (server - 5 min .. server + 1 min), so a phone 5 minutes fast was refused.
// Phoenix W7 (r100): it asks for the time measured for this write (serverNow, measured again after a clock jump), then the
// running connection clock (clockNow), then the phone clock.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=fs.readFileSync(path.resolve(__dirname,"../../js/productionSharedTerminalClose.js"),"utf8");
const pick=(re,name)=>{const m=source.match(re);assert.ok(m,`productionSharedTerminalClose.js must define ${name}`);return m[0];};
const code=[pick(/^  function ptcNow\(\)[^\n]*$/m,"ptcNow"),pick(/^  async function ptcServerNow\(context\)[^\n]*$/m,"ptcServerNow"),pick(/^  async function ptcCloseOptions\(context,intent\)[^\n]*$/m,"ptcCloseOptions")].join("\n");
assert.equal((source.match(/const options=await ptcCloseOptions\(context,intent\);if\(!ptcStillCurrent\(request,generation\)\)return [^;]+;const result=await provider\.close\(options\);/g)||[]).length,2,"both close paths wait for the measured time, then check the Showdown is still current before closing (verify on #1586)");
const SERVER=Date.parse("2026-11-01T06:30:00Z"),FAST=SERVER+5*60*1000,STALE=SERVER+5*60*1000-40;
async function options(remote){
  class PhoneDate extends Date{static now(){return FAST;}}
  const api=vm.runInNewContext(`${code}\n({ptcCloseOptions})`,{root:{CareerModeSparkRemoteJoining:remote,crypto:{}},Date:PhoneDate,Number});
  return (await api.ptcCloseOptions({user:{uid:"u"},services:{firestore:{},firestoreSdk:{}},request:{rivalryId:"r"},deviceId:"d"},{sessionId:"s"})).nowEpochMs;
}
(async()=>{
  assert.equal(await options({clockNow:()=>SERVER}),SERVER,"a phone 5 min fast must close with server time");
  console.log("ok 1 TC-CLOCK-1 end-of-Showdown session close uses the connection's server clock with the phone 5 min fast");
  assert.equal(await options(undefined),FAST);
  assert.equal(await options({clockNow:()=>Number.NaN}),FAST);
  assert.equal(await options({clockNow:()=>{throw new Error("x");}}),FAST);
  console.log("ok 2 TC-CLOCK-2 without a connection clock it falls back to the phone clock, as before");
  let asked=null;
  assert.equal(await options({serverNow:async user=>{asked=user;return SERVER;},clockNow:()=>STALE}),SERVER,"the time measured for this write wins over the running clock");
  assert.deepEqual(asked,{uid:"u"},"measured for the signed-in user");
  assert.equal(await options({serverNow:async()=>{throw new Error("offline");},clockNow:()=>SERVER}),SERVER);
  assert.equal(await options({serverNow:async()=>Number.NaN,clockNow:()=>SERVER}),SERVER);
  console.log("ok 3 TC-CLOCK-3 (Phoenix W7) the close waits for the time measured for this write (if that fails, the running connection clock), then re-checks the Showdown is still current");
  console.log("PASS r87 terminal close clock contracts: 3 checks");
})().catch(error=>{console.error(error);process.exit(1);});

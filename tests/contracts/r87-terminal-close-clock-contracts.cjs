"use strict";
// r87 W3-6: the end-of-Showdown atomic session close (js/productionSharedTerminalClose.js ptcCloseOptions) must take server time
// from the connection's clock (js/sparkRemoteJoining.js clockNow), not the phone's Date.now(): the Rules check its
// lastActivityAt with freshSessionActivity (server - 5 min .. server + 1 min), so a phone 5 minutes fast was refused.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=fs.readFileSync(path.resolve(__dirname,"../../js/productionSharedTerminalClose.js"),"utf8");
const pick=(re,name)=>{const m=source.match(re);assert.ok(m,`productionSharedTerminalClose.js must define ${name}`);return m[0];};
const code=[pick(/^  function ptcNow\(\)[^\n]*$/m,"ptcNow"),pick(/^  function ptcCloseOptions\(context,intent\)[^\n]*$/m,"ptcCloseOptions")].join("\n");
const SERVER=Date.parse("2026-11-01T06:30:00Z"),FAST=SERVER+5*60*1000;
function options(remote){
  class PhoneDate extends Date{static now(){return FAST;}}
  const api=vm.runInNewContext(`${code}\n({ptcCloseOptions})`,{root:{CareerModeSparkRemoteJoining:remote,crypto:{}},Date:PhoneDate,Number});
  return api.ptcCloseOptions({user:{uid:"u"},services:{firestore:{},firestoreSdk:{}},request:{rivalryId:"r"},deviceId:"d"},{sessionId:"s"});
}
assert.equal(options({clockNow:()=>SERVER}).nowEpochMs,SERVER,"a phone 5 min fast must close with server time");
console.log("ok 1 TC-CLOCK-1 end-of-Showdown session close uses the connection's server clock with the phone 5 min fast");
assert.equal(options(undefined).nowEpochMs,FAST);
assert.equal(options({clockNow:()=>Number.NaN}).nowEpochMs,FAST);
assert.equal(options({clockNow:()=>{throw new Error("x");}}).nowEpochMs,FAST);
console.log("ok 2 TC-CLOCK-2 without a connection clock it falls back to the phone clock, as before");
console.log("PASS r87 terminal close clock contracts: 2 checks");

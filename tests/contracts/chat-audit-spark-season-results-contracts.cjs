"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const source=fs.readFileSync(path.join(__dirname,"../../js/sparkSharedSeasonResults.js"),"utf8");
const start=source.indexOf("  function ssrpAssertSession(");
const end=source.indexOf("  function ssrpAssertSetupLedger(",start);
assert.ok(start>=0&&end>start,"the Season Results session guard must be present");
assert.match(source,/ssrpAssertSession\(ssrpSnapshot\(await transaction\.get\(refs\.session\)\),rivalryId,sessionId,rivalry\.authorized,now\)/,
  "both result reads and publications must call the session guard with their current time");

const sandbox={};
vm.createContext(sandbox);
vm.runInContext(
  'function ssrpFail(code){const error=new Error(code);error.code=code;throw error;}\n'+
  'function ssrpTimestampMillis(value){return value&&typeof value.toMillis==="function"?value.toMillis():Number.NaN;}\n'+
  source.slice(start,end)+'\nthis.checkSession=ssrpAssertSession;',
  sandbox
);

const rivalryId="pair_"+"a".repeat(64),sessionId="session_"+"b".repeat(64);
const managers=["manager_one","manager_two"],now=2_000_000;
const session=expires=>({
  objectType:"session",objectId:sessionId,lifecycleState:"live",
  data:{rivalryId,state:"active",memberAccountIds:[...managers],
    expiresAt:{toMillis:()=>expires}}
});

assert.doesNotThrow(()=>sandbox.checkSession(session(now+1),rivalryId,sessionId,managers,now),
  "an active unexpired private session must allow a Season Results read");
for(const expired of [now-1,now]){
  assert.throws(()=>sandbox.checkSession(session(expired),rivalryId,sessionId,managers,now),
    error=>error&&error.code==="SEASON_RESULTS_ACTIVE_SESSION_REQUIRED",
    "an expired private session must not permit a Season Results read or result publication");
}
console.log("PASS Season Results exact active session expiry guard");

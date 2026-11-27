"use strict";
// r100 B4 read cut B (Transfer War): two waiting/check reads stop repeating; no play read, write or publish changes.
//   T1 a manager's private Transfer War document that holds both locks (signings + signingLockedAt) is kept as immutable
//   T2 the same document after LOCK MY GUESSES only (signings / signingLockedAt still empty) is NOT kept: it can still change
//   T3 a missing document, a wrong objectType or another path is not kept; the earlier immutable rules are unchanged
//   T4 the Rules really make it final: update only while signings and signingLockedAt are empty, list and delete refused
//   T5 waiting on the partner's lock: strict 30 s listener confirmation during the fast lane's first 3 min, relaxed after
//   T6 no wait and no live screen: no path, never relaxed; a live (open) screen stays relaxed as before
//   T7 a hidden page watches nothing; an error while deciding falls back to strict
//   T8 the budget layer still drops a relaxed listener that goes to cache or has pending writes (unhealthy at once)
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const read=file=>fs.readFileSync(path.resolve(__dirname,"../..",file),"utf8");
const pairing=read("js/sparkPrivatePairing.js"),transfer=read("js/productionSharedTransferChallenge.js"),rules=read("firestore.transfer-challenge-production.fragment.rules");
let n=0;const ok=(id,label)=>{n+=1;console.log(`ok ${id} ${label}`);};
const pick=(code,re)=>{const m=code.match(re);assert.ok(m,`missing ${re}`);return m[0];};

const immutableSrc=pick(pairing,/function fsbImmutable\(path,snapshot\)\{[\s\S]*?\n    return false;\n  \}\n/);
const immutable=(()=>{const ctx={};vm.runInNewContext(immutableSrc+";globalThis.f=fsbImmutable;",ctx);return ctx.f;})();
const snap=value=>({exists:()=>value!==null,data:()=>value});
const ROLE="rivalries/rivalry_a/transferChallenges/season_2/roles/playerOne";
const locked={schemaVersion:1,objectType:"sharedTransferChallengeRole",guesses:[1,2,3],signings:[4,5],guessLockedAt:{s:1},signingLockedAt:{s:2}};
assert.equal(immutable(ROLE,snap(locked)),true);assert.equal(immutable(ROLE.replace("playerOne","playerTwo"),snap({...locked,signings:[]})),true);
ok("T1","a private document holding both locks is kept like the COMPLETED season");
assert.equal(immutable(ROLE,snap({...locked,signings:null,signingLockedAt:null})),false);
assert.equal(immutable(ROLE,snap({...locked,signingLockedAt:undefined})),false);
assert.equal(immutable(ROLE,snap({...locked,signings:null})),false);
ok("T2","after LOCK MY GUESSES only, the private document is read again (it can still change once)");
assert.equal(immutable(ROLE,snap(null)),false);
assert.equal(immutable(ROLE,snap({...locked,objectType:"other"})),false);
assert.equal(immutable(ROLE.replace("playerOne","referee"),snap(locked)),false);
assert.equal(immutable("rivalries/rivalry_a/transferChallenges/season_2/roulette/spins",snap(locked)),false);
assert.equal(immutable("rivalries/rivalry_a/transferChallenges/season_2",snap({phase:"GUESS_ENTRY"})),false);
assert.equal(immutable("rivalries/rivalry_a/transferChallenges/season_2",snap({phase:"COMPLETED"})),true);
ok("T3","missing, foreign and other documents are not kept; the COMPLETED rule is unchanged");
{
  const roles=pick(rules,/match \/roles\/\{managerRole\} \{[\s\S]*?\n {8}\}/);
  assert.ok(/allow list, delete: if false;/.test(roles),"role documents can never be listed or deleted");
  const update=pick(rules,/function ssjrTransferPrivateUpdateValid\([\s\S]*?\n    \}/);
  assert.ok(update.includes("&& before.signings == null")&&update.includes("&& before.signingLockedAt == null"),"an update needs empty signings and signingLockedAt before it");
  assert.ok(/affectedKeys\(\)\.hasOnly\(\['signings','signingLockedAt'/.test(update),"the only update writes the signings lock");
  ok("T4","the Rules allow one update (the signings lock) and no delete, so a doubly locked document is final");
}
const watchSrc=pick(transfer,/function pstcWatchWait\(\)\{[^\n]*\n/);
function watch({hidden=false,waiting="",fastDue=false,live=false,request={rivalryId:"rivalry_a",seasonNumber:2},throwFast=false}={}){
  const calls=[];
  const ctx={root:{document:{visibilityState:hidden?"hidden":"visible"},CareerModeFirestoreBudget:{watchWaitPoint:(owner,p,wake,options)=>calls.push({owner,p,options})}},
    pstcWaitingKey:()=>waiting,pstcLiveScreen:()=>live,pstcRequestContext:()=>request,pstcWaitWake:()=>{},
    pstcFastPollDue:()=>{if(throwFast)throw new Error("boom");return fastDue;}};
  vm.runInNewContext(watchSrc+";pstcWatchWait();",ctx);assert.equal(calls.length,1);assert.equal(calls[0].owner,"transfer");return calls[0];
}
{
  const strict=watch({waiting:"k|signings",fastDue:true});assert.equal(strict.p,"rivalries/rivalry_a/transferChallenges/season_2");assert.equal(strict.options.relaxed,false);
  const relaxed=watch({waiting:"k|signings",fastDue:false});assert.equal(relaxed.p,strict.p);assert.equal(relaxed.options.relaxed,true);
  assert.equal(watch({waiting:"k|guesses",fastDue:true,live:true}).options.relaxed,false,"the waiting key decides, not the live screen");
  ok("T5","waiting on the partner: strict for the fast lane's first 3 min, relaxed after");
}
{
  const none=watch({});assert.equal(none.p,null);assert.equal(none.options.relaxed,false);
  const live=watch({live:true});assert.equal(live.p,"rivalries/rivalry_a/transferChallenges/season_2");assert.equal(live.options.relaxed,true);
  ok("T6","no wait and no live screen: nothing watched; an open live screen stays relaxed as before");
}
{
  const hidden=watch({hidden:true,waiting:"k|signings"});assert.equal(hidden.p,null);assert.equal(hidden.options.relaxed,false);
  assert.equal(watch({waiting:"k|signings",throwFast:true}).options.relaxed,false);
  ok("T7","a hidden page watches nothing; an error while deciding stays strict");
}
{
  assert.ok(/FSB_WAIT_CONFIRM_MS=30000/.test(pairing)&&/FSB_RELAXED_CONFIRM_MS=120000/.test(pairing),"confirm windows 30 s strict, 2 min relaxed");
  assert.ok(/fromCache/.test(pairing)&&/hasPendingWrites/.test(pairing),"the wait listener checks fromCache and pending writes");
  assert.ok(/const FAST_POLL_WINDOW_MS=180000|FAST_POLL_WINDOW_MS=180000/.test(transfer),"the fast lane lasts 3 min");
  ok("T8","the relaxed listener keeps the budget layer's health checks (cache or pending writes = unhealthy)");
}
console.log(`r100 transfer reads contracts: ${n}/8 passed`);
assert.equal(n,8);

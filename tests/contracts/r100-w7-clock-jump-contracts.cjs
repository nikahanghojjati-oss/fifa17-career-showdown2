"use strict";
// Phoenix W7 (r100): js/sparkRemoteJoining.js keeps this phone's offset from server time (measured from a fresh ID token) for
// up to 10 minutes. B1's skew fault (#1579) set the phone clock 5 minutes off in the middle of a Showdown: the old offset then
// stamped session writes 5 minutes off (the Rules take server - 5 min .. + 1 min) and the Showdown did not close by itself.
// The clock block now notices when the wall clock and the steady page clock (performance.now) drift apart and measures again.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=fs.readFileSync(path.resolve(__dirname,"../../js/sparkRemoteJoining.js"),"utf8");
const start=source.indexOf("  const SRJ_CLOCK_REFRESH_MS="),end=source.indexOf("  function srjOperationOptions(");
assert.ok(start>0&&end>start,"the clock block is where it was");
const block=source.slice(start,end);
assert.doesNotMatch(block,/getDoc|getDocs|onSnapshot|runTransaction|setDoc|updateDoc/,"measuring the clock costs no Firestore read or write");
const SERVER=Date.parse("2026-11-24T08:00:00Z"),MIN=60000;let passed=0;const ok=label=>{passed+=1;console.log(`ok ${passed} ${label}`);};
function phone(){
  const t={wall:SERVER,steady:1000,server:SERVER,tokens:0,offline:false};
  class PhoneDate extends Date{static now(){return t.wall;}static parse(s){return Date.parse(s);}}
  const user={async getIdTokenResult(force){assert.equal(force,true);if(t.offline)throw new Error("offline");t.tokens+=1;return {issuedAtTime:new Date(t.server).toUTCString()};}};
  const api=vm.runInNewContext(`${block}\n({srjClockNow,srjServerNow})`,{root:{performance:{now:()=>t.steady}},Date:PhoneDate,Number,Math,String,Promise,Infinity});
  const pass=ms=>{t.wall+=ms;t.steady+=ms;t.server+=ms;};
  return {t,user,api,pass};
}
const near=(a,b,label)=>assert.ok(Math.abs(a-b)<=1500,`${label}: ${a-b} ms off`);
(async()=>{
  // 1. A phone 5 minutes fast from the start is corrected (the r87 case still holds).
  {const {t,user,api,pass}=phone();t.wall+=5*MIN;near(await api.srjServerNow(user),t.server,"fast from the start");pass(4*MIN);near(await api.srjServerNow(user),t.server,"4 min later");assert.equal(t.tokens,1,"no new measure while the clock runs evenly");ok("W7-1 a phone fast from the start writes server time; one measure per 10 minutes while its clock runs evenly");}
  // 2. The clock jumps 5 minutes fast (or slow) after the measure: the next write measures again and stamps server time.
  for(const jump of [5*MIN,-5*MIN]){const {t,user,api,pass}=phone();near(await api.srjServerNow(user),t.server,"first");pass(30000);t.wall+=jump;
    near(await api.srjServerNow(user),t.server,`after a ${jump/MIN} min jump`);assert.equal(t.tokens,2,"measured again after the jump");
    pass(MIN);near(await api.srjServerNow(user),t.server,"a minute later");assert.equal(t.tokens,2,"and not again while the clock runs evenly");}
  ok("W7-2 a clock that jumps 5 minutes fast or slow mid-Showdown is measured again before the next session write");
  // 3. The running clock (reads, expiry, the close's fallback) starts its own measure after a jump and is right a moment later.
  {const {t,user,api,pass}=phone();await api.srjServerNow(user);pass(30000);t.wall+=5*MIN;
    api.srjClockNow();await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));near(api.srjClockNow(),t.server,"running clock after its check");assert.equal(t.tokens,2);ok("W7-3 the running clock starts one quick measure after a jump and then reads server time");}
  // 4. Offline after a jump: the writes keep the last offset (as before), and the running clock tries at most every 30 s.
  {const {t,user,api,pass}=phone();await api.srjServerNow(user);pass(30000);t.wall+=5*MIN;t.offline=true;
    const before=t.tokens;for(let i=0;i<50;i+=1){api.srjClockNow();await new Promise(r=>setImmediate(r));pass(100);}
    assert.equal(t.tokens,before,"offline: no token counted");
    let tries=0;user.getIdTokenResult=async()=>{tries+=1;throw new Error("offline");};
    for(let i=0;i<50;i+=1){api.srjClockNow();await new Promise(r=>setImmediate(r));pass(100);}
    assert.ok(tries<=1,`the running clock retried ${tries} times in 5 s (at most once per 30 s)`);
    ok("W7-4 offline after a jump: writes keep the last offset (as before) and the running clock retries at most every 30 s");}
  // 5. No steady clock (very old browsers): exactly the r87 behaviour.
  {const t={wall:SERVER+5*MIN,tokens:0};class PhoneDate extends Date{static now(){return t.wall;}}
    const user={async getIdTokenResult(){t.tokens+=1;return {issuedAtTime:new Date(SERVER).toUTCString()};}};
    const api=vm.runInNewContext(`${block}\n({srjClockNow,srjServerNow})`,{root:{},Date:PhoneDate,Number,Math,String,Promise,Infinity});
    near(await api.srjServerNow(user),SERVER,"no performance");t.wall+=5*MIN;near(await api.srjServerNow(user),SERVER+5*MIN,"no performance after a jump: the offset is kept, as in r87");assert.equal(t.tokens,1);
  }
  ok("W7-5 without performance.now the clock behaves as in r87");
  console.log(`PASS r100 W7 clock jump contracts: ${passed} checks`);
})().catch(error=>{console.error(error);process.exit(1);});

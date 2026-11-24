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
    // Writes too (verify on #1586): while measuring keeps failing, a write does not wait on a forced refresh more than once per 30 s.
    let writeTries=0;user.getIdTokenResult=async()=>{writeTries+=1;throw new Error("offline");};pass(31000);
    for(let i=0;i<20;i+=1){near(await api.srjServerNow(user),t.server+5*MIN,"offline write keeps the last offset");pass(500);}
    assert.equal(writeTries,1,`writes forced ${writeTries} refreshes in 10 s while offline (at most one per 30 s)`);
    pass(30000);await api.srjServerNow(user);assert.equal(writeTries,2,"tried again after 30 s");
    user.getIdTokenResult=async()=>{t.tokens+=1;return {issuedAtTime:new Date(t.server).toUTCString()};};t.offline=false;pass(31000);
    near(await api.srjServerNow(user),t.server,"back online: measured again");
    ok("W7-4 offline after a jump: writes keep the last offset (as before); the running clock and the writes each try at most every 30 s, then heal");}
  // 5. No steady clock (very old browsers): exactly the r87 behaviour.
  {const t={wall:SERVER+5*MIN,tokens:0};class PhoneDate extends Date{static now(){return t.wall;}}
    const user={async getIdTokenResult(){t.tokens+=1;return {issuedAtTime:new Date(SERVER).toUTCString()};}};
    const api=vm.runInNewContext(`${block}\n({srjClockNow,srjServerNow})`,{root:{},Date:PhoneDate,Number,Math,String,Promise,Infinity});
    near(await api.srjServerNow(user),SERVER,"no performance");t.wall+=5*MIN;near(await api.srjServerNow(user),SERVER+5*MIN,"no performance after a jump: the offset is kept, as in r87");assert.equal(t.tokens,1);
    // r87 without a steady clock: a failed measure is tried again on a write after 30 s by the phone clock.
    let tries=0;user.getIdTokenResult=async()=>{tries+=1;throw new Error("offline");};t.wall+=11*MIN;await api.srjServerNow(user);await api.srjServerNow(user);assert.equal(tries,1);t.wall+=31000;await api.srjServerNow(user);assert.equal(tries,2);
  }
  ok("W7-5 without performance.now the clock behaves as in r87");
  // 6. Verify on #1586: a write made while a measure is still on its way (the running clock started it right after a wake with
  // a jumped clock) waits for that measure and stamps server time; it neither starts a second refresh nor takes the old offset.
  {const {t,user,api,pass}=phone();await api.srjServerNow(user);pass(30000);t.wall+=5*MIN;
    let release;const answered=new Promise(r=>{release=r;});let refreshes=0;
    user.getIdTokenResult=async()=>{refreshes+=1;await answered;return {issuedAtTime:new Date(t.server).toUTCString()};};
    api.srjClockNow();await new Promise(r=>setImmediate(r));assert.equal(refreshes,1,"the running clock started one measure");
    const write=api.srjServerNow(user),second=api.srjServerNow(user);let settled=false;write.then(()=>{settled=true;});
    await new Promise(r=>setImmediate(r));assert.equal(settled,false,"the write waits for the measure on its way");
    pass(300);release();near(await write,t.server,"the write made during the measure");near(await second,t.server,"a second write during it");
    assert.equal(refreshes,1,"one shared refresh");
    // A measure that fails while a write waits: the write keeps the last offset (as before) and the next tries wait 30 s.
    pass(31000);t.wall+=5*MIN;let fail;const failing=new Promise((_r,j)=>{fail=j;});user.getIdTokenResult=async()=>{refreshes+=1;await failing;};
    const waiting=api.srjServerNow(user);await new Promise(r=>setImmediate(r));fail(new Error("offline"));
    near(await waiting,t.server+5*MIN,"a failed measure leaves the last offset");assert.equal(refreshes,2);
    await api.srjServerNow(user);assert.equal(refreshes,2,"held off for 30 s after a real failure");
    ok("W7-6 a write during a measure on its way waits for it (one shared refresh); only a real failure holds measures off for 30 s");}
  // 7. Verify on #1586: a write waits at most 8 s for a slow measure, then stamps with the last offset (as a 30 s Auth timeout
  // would have); the measure that lands later still sets the offset for the writes after it.
  {const t={wall:SERVER,steady:1000,server:SERVER};const timers=[];
    class PhoneDate extends Date{static now(){return t.wall;}}
    const root={performance:{now:()=>t.steady},setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length;},clearTimeout:()=>{}};
    const api=vm.runInNewContext(`${block}\n({srjClockNow,srjServerNow})`,{root,Date:PhoneDate,Number,Math,String,Promise,Infinity});
    let release=null,refreshes=0;const user={async getIdTokenResult(){refreshes+=1;if(refreshes>1)await new Promise(r=>{release=r;});return {issuedAtTime:new Date(t.server).toUTCString()};}};
    const pass=ms=>{t.wall+=ms;t.steady+=ms;t.server+=ms;};
    near(await api.srjServerNow(user),t.server,"first");pass(30000);t.wall+=5*MIN;
    const write=api.srjServerNow(user);let settled=false;write.then(()=>{settled=true;});await new Promise(r=>setImmediate(r));
    assert.equal(settled,false,"the write waits for the measure");const wait=timers[timers.length-1];assert.equal(wait?.ms,8000);assert.ok(wait,"bounded by an 8 s timer");
    pass(8000);wait.fn();near(await write,t.server+5*MIN,"after 8 s the write goes with the last offset");
    release();await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));
    // (a slow 8 s round trip measures to within half of it: far inside the Rules' server + 1 min / - 5 min)
    const within=(a,b,label)=>assert.ok(Math.abs(a-b)<=4600,`${label}: ${a-b} ms off`);
    within(api.srjClockNow(),t.server,"the late measure still sets the offset");within(await api.srjServerNow(user),t.server,"and the next write uses it");assert.equal(refreshes,2);
    ok("W7-7 a write waits at most 8 s for a slow measure; a measure landing later still sets the offset for the next writes");}
  console.log(`PASS r100 W7 clock jump contracts: ${passed} checks`);
})().catch(error=>{console.error(error);process.exit(1);});

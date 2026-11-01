"use strict";
// r87 W3-6 proof lane: US clocks go back on Sunday 1 Nov 2026 (Boston 02:00 EDT -> 01:00 EST at 06:00 UTC; Los Angeles at
// 09:00 UTC). Every game timer runs on epoch milliseconds (Date.now, performance.now, Firestore timestamps), so it cannot see
// the change; only text shown in a local time zone can. This file proves that, and records the two places where local
// time shows up. No network, no Firebase. Run: node tests/contracts/r87-dst-clock-change-contracts.cjs
const assert=require("node:assert/strict");
const {execFileSync}=require("node:child_process");
const path=require("node:path");
let checks=0;
const ok=(id,text)=>{checks+=1;process.stdout.write(`ok ${checks} ${id} ${text}\n`);};
const fmt=(ms,timeZone)=>new Intl.DateTimeFormat("en-US",{timeZone,month:"short",day:"numeric",hour:"numeric",minute:"2-digit",timeZoneName:"short"}).format(ms);
const pacificDay=ms=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(ms));

// 1. Epoch time keeps running straight through the change: 01:59 EDT to 01:00 EST is one minute, not minus 59.
{
  const before=Date.parse("2026-11-01T05:59:00Z"),after=Date.parse("2026-11-01T06:00:00Z");
  assert.equal(fmt(before,"America/New_York"),"Nov 1, 1:59 AM EDT");
  assert.equal(fmt(after,"America/New_York"),"Nov 1, 1:00 AM EST");
  assert.equal(after-before,60000);
  ok("DST-1","local Boston time jumps back an hour while epoch time moves on one minute");
}

// 2. A 15-minute transfer window that spans the change still lasts 15:00 on the timer (js/productionSharedTransferChallenge.js
// line ~367: deadline = startedAtEpochMs + 15 min, remaining = deadline - server-anchored now; Rules: request.time >= startedAt + 15m).
{
  const startedAt=Date.parse("2026-11-01T05:55:00Z");
  const remainingAt=now=>Math.max(0,Math.ceil((startedAt+15*60*1000-now)/1000));
  const shown=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  assert.equal(shown(remainingAt(startedAt)),"15:00");
  assert.equal(shown(remainingAt(Date.parse("2026-11-01T06:00:00Z"))),"10:00");
  assert.equal(shown(remainingAt(Date.parse("2026-11-01T06:10:00Z"))),"00:00");
  ok("DST-2","transfer timer started 01:55 EDT reads 10:00 at 01:00 EST and closes at 01:10 EST, 15 minutes later");
}

// 3. Auto-JOIN (js/persistentNikDanielPair.js JOIN_NOTE_WATCH_WINDOW_MS, Date.now() deltas) and the remote-joining 10-minute
// limits (js/sparkRemoteJoining.js SRJ_*_LIMIT_MS) are elapsed epoch time, so a 10-minute window across the change is 10 minutes.
{
  const start=Date.parse("2026-11-01T05:55:00Z"),until=start+10*60*1000;
  assert.equal(fmt(until,"America/New_York"),"Nov 1, 1:05 AM EST");
  ok("DST-3","a 10-minute auto-JOIN window from 01:55 EDT ends at 01:05 EST (10 real minutes)");
}

// 4. The free daily limit day is the Pacific day (js/sparkPrivatePairing.js fsbPacificDay). 1 Nov in Los Angeles is 25 hours
// long and nothing in the meter assumes 24 hours. The day starts at 3 am Boston on most days, but at 2 am Boston on 1 Nov,
// because Boston changes 3 hours before Los Angeles. The quota text says "It resets at 3 am Boston time" (FSB_QUOTA_MESSAGE)
// and settings.js says "Resets at 3 am Boston": wrong by one hour for the reset at the start of Sunday 1 Nov only.
{
  const resets=["2026-10-31","2026-11-01","2026-11-02"].map(day=>{
    let ms=Date.parse(`${day}T00:00:00Z`);
    while(pacificDay(ms)!==day)ms+=60*1000;
    return {day,utc:new Date(ms).toISOString(),boston:fmt(ms,"America/New_York")};
  });
  assert.deepEqual(resets.map(r=>r.boston),["Oct 31, 3:00 AM EDT","Nov 1, 2:00 AM EST","Nov 2, 3:00 AM EST"]);
  const length=(Date.parse(resets[2].utc)-Date.parse(resets[1].utc))/3600000;
  assert.equal(length,25);
  ok("DST-4",`Pacific day 1 Nov is ${length} h; its reset is ${resets[1].boston} (text says 3 am: cosmetic, that night only)`);
  // The fallback used only when Intl cannot do time zones (never on current Chrome/Safari) is fixed UTC-8, an hour off in PDT.
  const at=Date.parse("2026-10-31T07:30:00Z");
  assert.equal(pacificDay(at),"2026-10-31");
  assert.equal(new Date(at-8*3600000).toISOString().slice(0,10),"2026-10-30");
  ok("DST-5","fsbPacificDay fallback (UTC-8) is an hour off during PDT; unreachable on browsers with Intl time zones");
}

// 5. History "Ended early" date (js/careerScreenSeam.js endedEarlyText) is formatted in the phone's own time zone. Across the
// change in Boston it is right; two phones in different time zones can show different dates near midnight.
{
  const run=(tz,endedAt)=>execFileSync(process.execPath,["-e",
    `const s=require(${JSON.stringify(path.join(__dirname,"../../js/careerScreenSeam.js"))});process.stdout.write(s.endedEarlyText({endedAt:${endedAt},seasonsPlayed:1}))`],
    {env:{...process.env,TZ:tz}}).toString();
  for(const iso of ["2026-11-01T05:30:00Z","2026-11-01T06:30:00Z"])assert.match(run("America/New_York",Date.parse(iso)),/1 Nov 2026/);
  ok("DST-6","Ended early date reads 1 Nov in Boston for both 01:30 EDT and 01:30 EST");
  const late=Date.parse("2026-11-01T03:30:00Z");
  const boston=run("America/New_York",late),london=run("Europe/London",late);
  assert.match(boston,/31 Oct 2026/);assert.match(london,/1 Nov 2026/);
  ok("DST-7","same Showdown ended 23:30 Boston shows 31 Oct in Boston and 1 Nov in London (only matters if phones are in different zones)");
}

// 6. Wrong phone clock on the transfer timer: the production clock helpers (extracted as in job-1058-transfer-clock-contracts)
// anchor to the Firebase token's server issue time plus performance.now(), so a phone 5 minutes fast or slow shows the same timer.
{
  const fs=require("node:fs"),vm=require("node:vm");
  const source=fs.readFileSync(path.resolve(__dirname,"../../js/productionSharedTransferChallenge.js"),"utf8");
  const pick=(re,name)=>{const m=source.match(re);assert.ok(m,`missing ${name}`);return m[0];};
  const helpers=[pick(/^  function pstcMonotonicNow\(\)[^\n]*$/m,"pstcMonotonicNow"),pick(/^  function pstcClockReady\(request\)[^\n]*$/m,"pstcClockReady"),
    pick(/^  function pstcAuthoritativeNow\(request=pstcRequestContext\(\)\)[^\n]*$/m,"pstcAuthoritativeNow"),
    pick(/^  async function pstcEnsureServerClock\(user,request\)\{[\s\S]*?^  \}/m,"pstcEnsureServerClock")].join("\n");
  const SERVER=Date.parse("2026-11-01T06:00:00.250Z"),REQUEST={key:"r87-clock:season-1"};
  const nowFor=async skew=>{
    let perf=1000;
    class SkewedDate extends Date{static now(){return SERVER+skew+perf;}}
    const sandbox={root:{performance:{now:()=>perf}},pstcRequestMatches:r=>r&&r.key===REQUEST.key,pstcFail:code=>{throw new Error(code);},Date:SkewedDate};
    const api=vm.runInNewContext(["const CLOCK_REFRESH_MS=5*60*1000;","let clockContextKey=\"\",clockServerEpochMs=0,clockPerformanceMs=0,clockRefreshPerformanceMs=0;",helpers,
      "({ensure:pstcEnsureServerClock,now:pstcAuthoritativeNow})"].join("\n"),sandbox);
    await api.ensure({async getIdTokenResult(){perf+=200;return {issuedAtTime:new Date(SERVER).toISOString()};}},REQUEST);
    perf+=60000;
    return api.now(REQUEST);
  };
  module.exports.transferClockSkew=(async()=>{
    const right=await nowFor(0);
    for(const skew of [5*60000,-5*60000,3600000])assert.equal(await nowFor(skew),right,`transfer clock moved with a ${skew} ms phone clock`);
    ok("DST-8","transfer timer clock is identical with the phone 5 min fast, 5 min slow or 1 h off (server token time wins)");
  })();
}
Promise.resolve(module.exports.transferClockSkew).then(()=>process.stdout.write(`ok r87-dst-clock-change ${checks} checks\n`),error=>{console.error(error);process.exitCode=1;});

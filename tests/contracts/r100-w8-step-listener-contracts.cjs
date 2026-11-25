"use strict";
// Phoenix W8 (r100), found by B1's listener fault (#1579, chamber-kick point): Chamber Men and the Prime Pack watch their round
// record with one listener and skip snapshots served from cache. When that listener's stream is down, the SDK keeps quiet
// apart from marking its copy fromCache, so a shootout waited on the rival's kick for good. Each watch now reads the record
// from the server every POLL_MS while its copy is from cache, and stops those reads as soon as a server copy is back.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
let passed=0;const ok=label=>{passed+=1;console.log(`ok ${passed} ${label}`);};
function pick(source,name){
  const start=source.indexOf(`  async function ${name}(io,ctx,onData,onError){`);assert.ok(start>0,`${name} is where it was`);
  const end=source.indexOf("\n  }\n",start);return source.slice(start,end+4);
}
function harness(file,watch,wait){
  const source=fs.readFileSync(path.resolve(__dirname,"../../js",file),"utf8");const body=pick(source,watch);
  assert.doesNotMatch(body,/getDocs?\(|getDocFromServer|setDoc|updateDoc|tx\.(set|update)\(/,`${watch}: the bridge only reads the one record`);
  const timers=[],reads={n:0,asks:[],unasked:0},state={snap:null,unsubscribed:0,server:{kicks:1}};
  const prefix=watch.slice(0,3),helper=source.match(new RegExp(`  function ${prefix}ServerNext\\(io,season\\)\\{[^\\n]*\\n`));assert.ok(helper,`${file}: each bridge read asks the budget layer for a server read`);
  const sdk={
    onSnapshot:(ref,opts,next,error)=>{assert.deepEqual({...opts},{includeMetadataChanges:true});state.snap=next;return ()=>{state.unsubscribed+=1;};},
    runTransaction:async(_fs,fn)=>fn({get:async()=>{reads.n+=1;if(reads.asks.length<reads.n)reads.unasked+=1;return {exists:()=>true,data:()=>({...state.server})};}})
  };
  const clock={now:Date.parse("2026-11-24T09:00:00Z")};class FakeDate extends Date{static now(){return clock.now;}}
  const root={document:{visibilityState:"visible"},navigator:{onLine:true},CareerModeFirestoreBudget:{readServerNext:path=>{reads.asks.push(path);}}};
  const line=source.match(/const BRIDGE_FAST_MS=[^;]+;/);assert.ok(line,`${file} sets its bridge pace`);
  const pace=vm.runInNewContext(`${line[0].replace("const ","var ")}({BRIDGE_FAST_MS,BRIDGE_FAST_FOR_MS,BRIDGE_SLOW_MS,BRIDGE_FAILED_MS})`,{Infinity});
  const first=source.match(/const BRIDGE_FIRST_MS=(\d+);/);assert.ok(first,`${file} waits before its first bridge read until a server copy has arrived`);
  const sandbox={root,Promise,Date:FakeDate,POLL_MS:2500,...pace,BRIDGE_FIRST_MS:Number(first[1]),COLLECTION:"x",setTimeout:(fn,ms)=>{timers.push({fn,ms});}};
  const code=`const ${wait}=ms=>new Promise(r=>setTimeout(r,ms));
    async function ${watch.replace("Watch","SnapshotApi")}(io){return io.sdk;}
    function ${watch.replace("Watch","Ref")}(io,season){return {season};}
    function ${watch.replace("Watch","SeasonId")}(s){return "season_"+s;}
    ${helper[0]}${body}
    ({watch:${watch}})`;
  const api=vm.runInNewContext(code,sandbox);
  const snap=(fromCache,data,pending=false)=>({metadata:{fromCache,hasPendingWrites:pending},exists:()=>Boolean(data),data:()=>data});
  const tick=async()=>{for(let i=0;i<6;i+=1)await new Promise(r=>setImmediate(r));};
  const fire=async(ms=2500)=>{const t=timers.shift();assert.ok(t,"a bridge read is scheduled");assert.equal(t.ms,ms);clock.now+=t.ms;t.fn();await tick();};
  return {api,state,reads,timers,snap,tick,fire,root,clock,pace,source,io:{sdk,firestore:{},rivalryId:"r"}};
}
(async()=>{
  // Pace per step (verify on #1588): Chamber Men's kick clock needs 2.5 s all along (5 s after a failure); the Prime Pack slows
  // to 8 s after a minute and waits 30 s after a failure.
  const PACE={"chamberMenStep.js":{BRIDGE_FAST_MS:2500,BRIDGE_FAST_FOR_MS:Infinity,BRIDGE_SLOW_MS:2500,BRIDGE_FAILED_MS:5000,max5:120,firstMinute:24},
    "iconGuessStep.js":{BRIDGE_FAST_MS:2500,BRIDGE_FAST_FOR_MS:60000,BRIDGE_SLOW_MS:8000,BRIDGE_FAILED_MS:30000,max5:54,firstMinute:24}};
  for(const [file,watch,wait] of [["chamberMenStep.js","cmsWatch","cmsWait"],["iconGuessStep.js","igsWatch","igsWait"]]){
    const want=PACE[file];
    const h=harness(file,watch,wait);const got=[];let errors=0;
    for(const k of ["BRIDGE_FAST_MS","BRIDGE_FAST_FOR_MS","BRIDGE_SLOW_MS","BRIDGE_FAILED_MS"])assert.equal(h.pace[k],want[k],`${file} ${k}`);
    const stop=await h.api.watch(h.io,{season:1},data=>got.push(data),()=>{errors+=1;});
    // A healthy listener: server copies are delivered, no read is made.
    h.state.snap(h.snap(false,{kicks:1}));await h.tick();assert.deepEqual(got,[{kicks:1}]);assert.equal(h.reads.n,0);assert.equal(h.timers.length,0);
    h.state.snap(h.snap(false,{kicks:2},true));await h.tick();assert.equal(got.length,1,"own pending write still skipped");
    // The stream dies: the SDK marks the copy fromCache. That copy is not shown; the record is read every 2.5 s instead.
    h.state.snap(h.snap(true,{kicks:1}));await h.tick();assert.equal(got.length,1,"a cached copy is never shown");
    h.state.server={kicks:3};await h.fire();assert.equal(h.reads.n,1);assert.deepEqual(h.reads.asks,["rivalries/r/x/season_1"],"the bridge read asked for the server first (Codex #1588)");assert.deepEqual(got.at(-1),{kicks:3},"the rival's kick arrives by the read");
    h.state.snap(h.snap(true,{kicks:1}));await h.tick();assert.equal(h.timers.length,1,"one bridge at a time");
    h.state.server={kicks:4};await h.fire();assert.equal(h.reads.n,2);assert.deepEqual(got.at(-1),{kicks:4});
    // The listener is back with a server copy: the reads stop.
    h.state.snap(h.snap(false,{kicks:5}));await h.tick();assert.deepEqual(got.at(-1),{kicks:5});
    await h.fire();assert.equal(h.reads.n,2,"no read once the listener is live again");assert.equal(h.timers.length,0);
    // Down again, then the step ends: the unsubscribe stops the listener and the reads.
    h.state.snap(h.snap(true,null));await h.tick();stop();assert.equal(h.state.unsubscribed,1);await h.fire();assert.equal(h.reads.n,2,"no read after the step ends");
    h.state.snap(h.snap(false,{kicks:9}));await h.tick();assert.notDeepEqual(got.at(-1),{kicks:9},"nothing delivered after the step ends");
    // A failed bridge read is tried again 2.5 s later; it never ends the step.
    const g=harness(file,watch,wait);const seen=[];let ended=0;await g.api.watch(g.io,{season:1},d=>seen.push(d),()=>{ended+=1;});
    g.state.snap(g.snap(true,null));await g.tick();const real=g.io.sdk.runTransaction;g.io.sdk.runTransaction=async()=>{throw Object.assign(new Error("offline"),{code:"unavailable"});};
    await g.fire(5000);assert.equal(ended,0);assert.equal(g.timers.length,1,"tried again");assert.equal(g.timers[0].ms,want.BRIDGE_FAILED_MS,"the hold-off after a failed read");g.io.sdk.runTransaction=real;g.state.server={kicks:7};await g.fire(want.BRIDGE_FAILED_MS);assert.deepEqual(seen.at(-1),{kicks:7});
    // A failed read waits 30 s before the next (offline does not spin failed reads), then goes on.
    assert.equal(g.timers.length,1);
    // Budget (Spark): 2.5 s for the first minute, then 8 s; hidden or offline pages make no read; worst case for 5 minutes.
    const b=harness(file,watch,wait);await b.api.watch(b.io,{season:1},()=>{},()=>{});b.state.snap(b.snap(true,null));await b.tick();
    let elapsed=0;const at=[];while(elapsed<300000){const t=b.timers[0];if(!t)break;const before=b.reads.n;await b.fire(t.ms);elapsed+=t.ms;if(b.reads.n>before)at.push(elapsed);}
    assert.ok(at.filter(x=>x<=60000).length<=want.firstMinute,"at most 24 reads in the first minute");
    assert.ok(at.filter(x=>x>60000).every((x,i,a)=>i===0||x-a[i-1]===want.BRIDGE_SLOW_MS),"the slow pace after the first minute");
    assert.equal(b.reads.unasked,0,"every bridge read in 5 minutes asked for the server first");
    console.log(`  ${file}: reads for a stream dead 5 minutes on a visible page = ${b.reads.n}`);assert.ok(b.reads.n<=want.max5,`a stream dead for 5 minutes costs ${b.reads.n} reads (at most ${want.max5})`);
    b.root.document.visibilityState="hidden";const hiddenBefore=b.reads.n;for(let i=0;i<20;i+=1)await b.fire(b.timers[0].ms);assert.equal(b.reads.n,hiddenBefore,"no read while hidden");assert.equal(b.timers[0].ms,1000);
    b.root.document.visibilityState="visible";b.root.navigator.onLine=false;for(let i=0;i<20;i+=1)await b.fire(1000);assert.equal(b.reads.n,hiddenBefore,"no read while offline");
    b.root.navigator.onLine=true;await b.fire(1000);assert.equal(b.reads.n,hiddenBefore+1,"reads again within a second of coming back");
    assert.equal(errors,0);
    // Verify on #1588: a bridge read still on its way when the listener is back is dropped (it may be older than the server copy).
    {const d=harness(file,watch,wait);const seen=[];await d.api.watch(d.io,{season:1},x=>seen.push(x),()=>{});d.state.snap(d.snap(true,null));await d.tick();
      let answer;const real=d.io.sdk.runTransaction;d.io.sdk.runTransaction=()=>new Promise(r=>{answer=r;});const t=d.timers.shift();t.fn();await d.tick();
      d.state.snap(d.snap(false,{kicks:6,revision:6}));await d.tick();answer({kicks:5,revision:5});await d.tick();
      assert.deepEqual(seen,[{kicks:6,revision:6}],"the older read is never applied after the newer server copy");d.io.sdk.runTransaction=real;}
    // Lead on #1588: a healthy listener that starts with a cached copy and gets its server copy within 5 s makes no bridge read;
    // a stream refused from the start is bridged 5 s in, then at the step's pace.
    {const c=harness(file,watch,wait);const seen=[];await c.api.watch(c.io,{season:1},x=>seen.push(x),()=>{});
      c.state.snap(c.snap(true,{kicks:1}));await c.tick();assert.equal(c.timers[0].ms,5000,"the first bridge read waits 5 s until a server copy has arrived");
      c.state.snap(c.snap(false,{kicks:2}));await c.tick();await c.fire(5000);assert.equal(c.reads.n,0,"cached copy, then the server copy: no bridge read on a healthy start");
      assert.equal(c.timers.length,0);assert.deepEqual(seen,[{kicks:2}]);
      const r=harness(file,watch,wait);await r.api.watch(r.io,{season:1},()=>{},()=>{});r.state.snap(r.snap(true,null));await r.tick();
      await r.fire(5000);assert.equal(r.reads.n,1,"a stream refused from the start: first bridge read at 5 s");assert.equal(r.timers[0].ms,want.BRIDGE_FAST_MS,"then the step's pace");}
    ok(`${file}: a listener whose stream is down is bridged by server reads (${want.BRIDGE_FAST_MS/1000} s, ${want.BRIDGE_SLOW_MS/1000} s after the first minute; none hidden or offline; ${want.BRIDGE_FAILED_MS/1000} s after a failure; at most ${want.max5} in 5 minutes); a read in flight when it is back is dropped; reads stop when it is live again or the step ends`);
  }
  // The Prime Pack never steps back: an older revision of the round is ignored (the step's own guard, like Chamber Men's).
  {const src=fs.readFileSync(path.resolve(__dirname,"../../js/iconGuessStep.js"),"utf8");
    assert.match(src,/const revision=Number\(data&&data\.revision\);if\(Number\.isFinite\(revision\)\)\{if\(revision<seenRevision\)return;seenRevision=revision;\}\n\s*record=next;/,"Prime Pack onData ignores an older revision");
    assert.match(src,/let seenRevision=-Infinity,record=null,/);
    ok("iconGuessStep.js: the Prime Pack screen never steps back to an older revision of the round");}
  // Squad Management waits once for the rival's locked "pre" document (the next step after Chamber Men in B1's replay).
  {const source=fs.readFileSync(path.resolve(__dirname,"../../js/squadSheetStep.js"),"utf8");
    const start=source.indexOf("  async function sqsWatch(io,ctx,onDoc,onError){");const end=source.indexOf("\n  }\n",start);assert.ok(start>0);
    const body=source.slice(start,end+4);const line=source.match(/const BRIDGE_FAST_FOR_MS=[^;]+;/);assert.ok(line);
    const timers=[],state={snap:null,gets:0,data:null,fail:false,asks:[],unasked:0};const clock={now:Date.parse("2026-11-24T09:00:00Z")};class FakeDate extends Date{static now(){return clock.now;}}
    const doc={visibilityState:"visible"},root={navigator:{onLine:true},CareerModeFirestoreBudget:{readServerNext:path=>{state.asks.push(path);}}};
    const firstLine=source.match(/const BRIDGE_FIRST_MS=\d+;/);assert.ok(firstLine);
    const code=`${line[0]}${firstLine[0]}const POLL_MS=4000,COLLECTION="x";const sqsWait=ms=>new Promise(r=>setTimeout(r,ms));
      function sqsOther(r){return r==="playerOne"?"playerTwo":"playerOne";}function sqsPointKey(){return "k";}function sqsKept(){return null;}function sqsKeep(){}
      function sqsParse(raw){return raw;}async function sqsSnapshotApi(io){return io.sdk;}function sqsRef(){return {};}function sqsDocId(s,st,r){return s+"_"+st+"_"+r;}function sqsDoc(){return doc;}
      ${(source.match(/  function sqsServerNext\(io,season,stage,role\)\{[^\n]*\n/)||[""])[0]}
      async function sqsGet(){state.gets+=1;if(state.asks.length<state.gets)state.unasked+=1;if(state.fail)return {ok:false,error:{code:"unavailable"}};return {ok:true,data:state.data};}
      ${body}({watch:sqsWatch})`;
    const api=vm.runInNewContext(code,{root,doc,state,Promise,Date:FakeDate,setTimeout:(fn,ms)=>{timers.push({fn,ms});}});
    const tick=async()=>{for(let i=0;i<6;i+=1)await new Promise(r=>setImmediate(r));};
    const fire=async ms=>{const t=timers.shift();assert.ok(t,"a bridge read is scheduled");if(ms!==undefined)assert.equal(t.ms,ms);clock.now+=t.ms;t.fn();await tick();};
    const io={sdk:{onSnapshot:(ref,opts,next)=>{state.snap=next;return ()=>{};}},firestore:{},rivalryId:"r"};
    const got=[];let errors=0;await api.watch(io,{managerRole:"playerOne",season:1},d=>got.push(d),()=>{errors+=1;});
    const snap=(fromCache,data)=>({metadata:{fromCache},exists:()=>Boolean(data),data:()=>data});
    state.snap(snap(false,null));await tick();assert.equal(timers.length,0,"a healthy listener: no read");
    state.snap(snap(true,null));await tick();await fire(4000);assert.equal(state.gets,1);assert.equal(got.length,0);
    state.fail=true;await fire(4000);assert.equal(timers[0].ms,30000,"30 s after a failed read");state.fail=false;
    doc.visibilityState="hidden";await fire(30000);assert.equal(state.gets,2);assert.equal(timers[0].ms,1000);const g=state.gets;await fire(1000);assert.equal(state.gets,g,"no read while hidden");doc.visibilityState="visible";
    let n=0;while(clock.now<Date.parse("2026-11-24T09:05:00Z")&&timers.length){await fire();n+=1;}
    assert.ok(/function sqsServerNext\(io,season,stage,role\)/.test(source),"Squad Management's bridge asks for a server read");
    assert.equal(state.unasked,0,"every bridge read asked for the server first");assert.equal(state.asks[0],"rivalries/r/x/1_pre_playerTwo","the rival's locked document");
    assert.ok(state.gets<=45,`a stream dead for 5 minutes costs ${state.gets} reads (at most 45)`);
    state.data={locked:true};await fire();assert.deepEqual(got,[{locked:true}],"the rival's lock arrives by the read");assert.equal(timers.length,0,"and the reads stop");assert.equal(errors,0);
    {const t0=timers.length;state.gets=0;const got2=[];await api.watch(io,{managerRole:"playerOne",season:1},d=>got2.push(d),()=>{});
      state.snap(snap(true,null));await tick();assert.equal(timers.at(-1).ms,5000,"Squad Management: the first bridge read waits 5 s until a server copy has arrived");
      state.snap(snap(false,null));await tick();const t=timers.pop();clock.now+=t.ms;t.fn();await tick();assert.equal(state.gets,0,"cached copy, then the server copy: no bridge read on a healthy start");assert.equal(timers.length,t0);}
    ok("squadSheetStep.js: the wait for the rival's lock is bridged by reads while the listener is down (4 s, 8 s after a minute, none hidden or offline, 30 s after a failure, at most 45 in 5 minutes) and stops once the lock is in");}
  console.log(`PASS r100 W8 step listener contracts: ${passed} checks`);
})().catch(error=>{console.error(error);process.exit(1);});

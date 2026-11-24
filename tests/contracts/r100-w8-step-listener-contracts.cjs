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
  const timers=[],reads={n:0},state={snap:null,unsubscribed:0,server:{kicks:1}};
  const sdk={
    onSnapshot:(ref,opts,next,error)=>{assert.deepEqual({...opts},{includeMetadataChanges:true});state.snap=next;return ()=>{state.unsubscribed+=1;};},
    runTransaction:async(_fs,fn)=>fn({get:async()=>{reads.n+=1;return {exists:()=>true,data:()=>({...state.server})};}})
  };
  const clock={now:Date.parse("2026-11-24T09:00:00Z")};class FakeDate extends Date{static now(){return clock.now;}}
  const root={document:{visibilityState:"visible"},navigator:{onLine:true}};
  const sandbox={root,Promise,Date:FakeDate,POLL_MS:2500,BRIDGE_FAST_MS:2500,BRIDGE_FAST_FOR_MS:60000,BRIDGE_SLOW_MS:8000,BRIDGE_FAILED_MS:30000,COLLECTION:"x",setTimeout:(fn,ms)=>{timers.push({fn,ms});}};
  const code=`const ${wait}=ms=>new Promise(r=>setTimeout(r,ms));
    async function ${watch.replace("Watch","SnapshotApi")}(io){return io.sdk;}
    function ${watch.replace("Watch","Ref")}(io,season){return {season};}
    function ${watch.replace("Watch","SeasonId")}(s){return "season_"+s;}
    ${body}
    ({watch:${watch}})`;
  const api=vm.runInNewContext(code,sandbox);
  const snap=(fromCache,data,pending=false)=>({metadata:{fromCache,hasPendingWrites:pending},exists:()=>Boolean(data),data:()=>data});
  const tick=async()=>{for(let i=0;i<6;i+=1)await new Promise(r=>setImmediate(r));};
  const fire=async(ms=2500)=>{const t=timers.shift();assert.ok(t,"a bridge read is scheduled");assert.equal(t.ms,ms);clock.now+=t.ms;t.fn();await tick();};
  for(const name of ["BRIDGE_FAST_MS=2500","BRIDGE_FAST_FOR_MS=60000","BRIDGE_SLOW_MS=8000","BRIDGE_FAILED_MS=30000"])assert.ok(source.includes(name),`${file} sets ${name}`);
  return {api,state,reads,timers,snap,tick,fire,root,clock,io:{sdk,firestore:{},rivalryId:"r"}};
}
(async()=>{
  for(const [file,watch,wait] of [["chamberMenStep.js","cmsWatch","cmsWait"],["iconGuessStep.js","igsWatch","igsWait"]]){
    const h=harness(file,watch,wait);const got=[];let errors=0;
    const stop=await h.api.watch(h.io,{season:1},data=>got.push(data),()=>{errors+=1;});
    // A healthy listener: server copies are delivered, no read is made.
    h.state.snap(h.snap(false,{kicks:1}));await h.tick();assert.deepEqual(got,[{kicks:1}]);assert.equal(h.reads.n,0);assert.equal(h.timers.length,0);
    h.state.snap(h.snap(false,{kicks:2},true));await h.tick();assert.equal(got.length,1,"own pending write still skipped");
    // The stream dies: the SDK marks the copy fromCache. That copy is not shown; the record is read every 2.5 s instead.
    h.state.snap(h.snap(true,{kicks:1}));await h.tick();assert.equal(got.length,1,"a cached copy is never shown");
    h.state.server={kicks:3};await h.fire();assert.equal(h.reads.n,1);assert.deepEqual(got.at(-1),{kicks:3},"the rival's kick arrives by the read");
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
    await g.fire();assert.equal(ended,0);assert.equal(g.timers.length,1,"tried again");assert.equal(g.timers[0].ms,30000,"30 s after a failed read");g.io.sdk.runTransaction=real;g.state.server={kicks:7};await g.fire(30000);assert.deepEqual(seen.at(-1),{kicks:7});
    // A failed read waits 30 s before the next (offline does not spin failed reads), then goes on.
    assert.equal(g.timers.length,1);
    // Budget (Spark): 2.5 s for the first minute, then 8 s; hidden or offline pages make no read; worst case for 5 minutes.
    const b=harness(file,watch,wait);await b.api.watch(b.io,{season:1},()=>{},()=>{});b.state.snap(b.snap(true,null));await b.tick();
    let elapsed=0;const at=[];while(elapsed<300000){const t=b.timers[0];if(!t)break;const before=b.reads.n;await b.fire(t.ms);elapsed+=t.ms;if(b.reads.n>before)at.push(elapsed);}
    assert.ok(at.filter(x=>x<=60000).length<=24,"at most 24 reads in the first minute");
    assert.ok(at.filter(x=>x>60000).every((x,i,a)=>i===0||x-a[i-1]===8000),"8 s apart after the first minute");
    console.log(`  ${file}: reads for a stream dead 5 minutes on a visible page = ${b.reads.n}`);assert.ok(b.reads.n<=54,`a stream dead for 5 minutes costs ${b.reads.n} reads (at most 54)`);
    b.root.document.visibilityState="hidden";const hiddenBefore=b.reads.n;for(let i=0;i<20;i+=1)await b.fire(b.timers[0].ms);assert.equal(b.reads.n,hiddenBefore,"no read while hidden");assert.equal(b.timers[0].ms,1000);
    b.root.document.visibilityState="visible";b.root.navigator.onLine=false;for(let i=0;i<20;i+=1)await b.fire(1000);assert.equal(b.reads.n,hiddenBefore,"no read while offline");
    b.root.navigator.onLine=true;await b.fire(1000);assert.equal(b.reads.n,hiddenBefore+1,"reads again within a second of coming back");
    assert.equal(errors,0);
    ok(`${file}: a listener whose stream is down is bridged by server reads (2.5 s for a minute, then 8 s; none hidden or offline; 30 s after a failure; at most 54 in 5 minutes); they stop when it is live again or the step ends`);
  }
  console.log(`PASS r100 W8 step listener contracts: ${passed} checks`);
})().catch(error=>{console.error(error);process.exit(1);});

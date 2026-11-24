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
  const sandbox={root:{},Promise,POLL_MS:2500,COLLECTION:"x",setTimeout:(fn,ms)=>{timers.push({fn,ms});}};
  const code=`const ${wait}=ms=>new Promise(r=>setTimeout(r,ms));
    async function ${watch.replace("Watch","SnapshotApi")}(io){return io.sdk;}
    function ${watch.replace("Watch","Ref")}(io,season){return {season};}
    function ${watch.replace("Watch","SeasonId")}(s){return "season_"+s;}
    ${body}
    ({watch:${watch}})`;
  const api=vm.runInNewContext(code,sandbox);
  const snap=(fromCache,data,pending=false)=>({metadata:{fromCache,hasPendingWrites:pending},exists:()=>Boolean(data),data:()=>data});
  const tick=async()=>{for(let i=0;i<6;i+=1)await new Promise(r=>setImmediate(r));};
  const fire=async()=>{const t=timers.shift();assert.ok(t,"a bridge read is scheduled");assert.equal(t.ms,2500);t.fn();await tick();};
  return {api,state,reads,timers,snap,tick,fire,io:{sdk,firestore:{},rivalryId:"r"}};
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
    await g.fire();assert.equal(ended,0);assert.equal(g.timers.length,1,"tried again");g.io.sdk.runTransaction=real;g.state.server={kicks:7};await g.fire();assert.deepEqual(seen.at(-1),{kicks:7});
    assert.equal(errors,0);
    ok(`${file}: a listener whose stream is down is bridged by one server read every 2.5 s; reads stop when it is live again or the step ends`);
  }
  console.log(`PASS r100 W8 step listener contracts: ${passed} checks`);
})().catch(error=>{console.error(error);process.exit(1);});

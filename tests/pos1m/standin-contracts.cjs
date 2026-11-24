"use strict";
// POS1M stand-in harshness contracts. Each check proves one way the stand-in is at least as harsh as Firestore
// (tests/pos1m/standin.cjs header). If one of these goes green on a kinder stand-in, POS1M stops meaning anything.
// Node only, no emulator. The nightly differential (Ring 2) checks the same stories against the real emulator.
const assert=require("node:assert/strict");
const {Sim}=require("./sim.cjs");
const {Server,sdk,Timestamp}=require("./standin.cjs");
const {doc,getDoc,setDoc,updateDoc,onSnapshot,runTransaction,serverTimestamp,deleteField,writeBatch}=sdk;

let checks=0;
const ok=label=>{checks+=1;console.log(`ok ${checks} ${label}`);};
async function inSim(seed,faults,body){
  const sim=new Sim(seed);sim.install();
  const server=new Server(sim,faults);
  let done=false,error=null,value;
  Promise.resolve().then(()=>body({sim,server})).then(v=>{value=v;done=true;},e=>{error=e;done=true;});
  try{await sim.run(()=>done);}finally{sim.uninstall();}
  if(error)throw error;
  assert.ok(done,"story finished");
  return {value,server,sim};
}
async function rejects(promise,code,label){let caught=null;try{await promise;}catch(error){caught=error;}assert.ok(caught,`${label}: must fail`);assert.equal(caught.code,code,`${label}: code ${caught.code} (${caught.message})`);return caught;}
const increment=(db,ref)=>runTransaction(db,async tx=>{const snap=await tx.get(ref);const n=snap.exists()?snap.data().n:0;tx.set(ref,{n:n+1});return n+1;});

(async()=>{
  // 1. Optimistic transactions: concurrent increments from two phones never lose an update, and contention really happens.
  {
    let retries=0,denied=0,lost=0;
    for(let seed=1;seed<=30;seed+=1){
      const {server}=await inSim(seed,{contentionDenied:0},async({server})=>{
        const a=server.client({uid:"a",label:"A"}),b=server.client({uid:"b",label:"B"});
        await Promise.all([1,2,3,4].map(i=>increment(i%2?a:b,doc(i%2?a:b,"c/x"))));
      });
      retries+=server.meter.retries;
      if(server.adminGet("c/x").n!==4)lost+=1;
      void denied;
    }
    assert.equal(lost,0,"no lost update under contention");
    assert.ok(retries>0,"the scheduler really forced contention and SDK retries");
    ok(`optimistic transactions: 30 seeds x 4 concurrent increments, none lost, ${retries} SDK retries forced`);
  }
  // 2. CONTENTION_DENIED: a raced transactional write can come back permission-denied and is NOT retried.
  {
    let deniedSeen=0;
    for(let seed=1;seed<=30&&!deniedSeen;seed+=1){
      await inSim(seed,{contentionDenied:1},async({server})=>{
        const a=server.client({uid:"a",label:"A"}),b=server.client({uid:"b",label:"B"});
        const outcomes=await Promise.allSettled([increment(a,doc(a,"c/x")),increment(b,doc(b,"c/x")),increment(a,doc(a,"c/x"))]);
        deniedSeen+=outcomes.filter(o=>o.status==="rejected"&&o.reason.code==="permission-denied").length;
        const final=server.adminGet("c/x").n,landed=outcomes.filter(o=>o.status==="fulfilled").length;
        assert.equal(final,landed,"every success landed exactly once, every denial wrote nothing");
      });
    }
    assert.ok(deniedSeen>0,"a raced write was answered permission-denied");
    ok("contention can surface as permission-denied (not retried), as production does under the Rules");
  }
  // 3. Read after write inside a transaction throws invalid-argument.
  await inSim(1,{},async({server})=>{
    const a=server.client({uid:"a"});
    await rejects(runTransaction(a,async tx=>{tx.set(doc(a,"c/y"),{v:1});await tx.get(doc(a,"c/y"));}),"invalid-argument","read after write");
    assert.equal(server.adminGet("c/y"),null,"nothing was written");
  });
  ok("read after write inside a transaction throws invalid-argument and writes nothing");
  // 4. tx.update of a document read as missing throws; tx.update of an unread missing document fails at commit.
  await inSim(1,{},async({server})=>{
    const a=server.client({uid:"a"});
    await rejects(runTransaction(a,async tx=>{await tx.get(doc(a,"c/none"));tx.update(doc(a,"c/none"),{v:1});}),"invalid-argument","update after missing read");
    await rejects(runTransaction(a,async tx=>{tx.update(doc(a,"c/none"),{v:1});}),"not-found","blind update of a missing doc");
  });
  ok("transaction update of a missing document is refused");
  // 5. At most 5 attempts: a commit that always aborts fails after exactly 5 runs of the update function.
  await inSim(1,{phantomAbort:1},async({server})=>{
    const a=server.client({uid:"a"});let runs=0;
    await rejects(runTransaction(a,async tx=>{runs+=1;await tx.get(doc(a,"c/z"));tx.set(doc(a,"c/z"),{v:runs});}),"aborted","always aborting");
    assert.equal(runs,5,"the update function ran 5 times");
    assert.equal(server.adminGet("c/z"),null);
  });
  ok("a transaction gives up after 5 attempts (SDK default maxAttempts)");
  // 6. Network errors inside a transaction are retried by the SDK (non-permanent codes), permanent ones are not.
  await inSim(3,{callError:0.4,contentionDenied:0},async({server})=>{
    const a=server.client({uid:"a"});let landed=0,failed=0;
    for(let i=0;i<20;i+=1){try{await increment(a,doc(a,"c/n"));landed+=1;}catch(error){assert.ok(["unavailable","deadline-exceeded","resource-exhausted"].includes(error.code),error.code);failed+=1;}}
    assert.ok(server.meter.retries>0,"network errors were retried");
    const n=server.adminGet("c/n")?server.adminGet("c/n").n:0;
    assert.ok(n>=landed,"every reported success landed");
  });
  ok("unavailable / deadline-exceeded / resource-exhausted are retried inside transactions, up to the limit");
  // 7. LANDED BUT LOST: a plain write lands and still answers an error; inside a transaction the re-run sees its own write.
  await inSim(2,{lostAck:1},async({server})=>{
    const a=server.client({uid:"a"});let caught=null;
    try{await setDoc(doc(a,"c/lost"),{v:1});}catch(e){caught=e;}
    assert.ok(caught&&["unavailable","deadline-exceeded"].includes(caught.code),"the phone heard an error");
    assert.deepEqual(server.adminGet("c/lost"),{v:1},"but the write landed");
    const seen=[];
    let txError=null;
    try{await runTransaction(a,async tx=>{const snap=await tx.get(doc(a,"c/tx"));seen.push(snap.exists()?snap.data().op:null);if(!snap.exists())tx.set(doc(a,"c/tx"),{op:"mine"});});}catch(e){txError=e;}
    assert.ok(seen.length>=2,"the SDK re-ran the update function after the lost answer");
    assert.equal(seen[0],null);assert.equal(seen[1],"mine","the re-run reads its own landed write");
    assert.equal(txError,null,"the re-run writes nothing, so its commit has no answer to lose: the call succeeds as a replay");
    assert.deepEqual(server.adminGet("c/tx"),{op:"mine"},"written exactly once");
  });
  ok("landed but lost: the write is on the server while the phone hears unavailable; a transaction re-run sees its own write");
  // 8. serverTimestamp resolves at commit time on the server clock; phone clocks are skewed.
  await inSim(4,{latencyMs:[400,400]},async({server,sim})=>{
    const a=server.client({uid:"a",skewMs:-300_000});
    const calledAt=sim.now;
    await setDoc(doc(a,"c/t"),{at:serverTimestamp()});
    const stored=server.adminGet("c/t").at;
    assert.ok(stored instanceof Timestamp);
    assert.equal(stored.toMillis(),calledAt+400,"stamped when the request reached the server, not when the phone called");
    assert.equal(a.now(),sim.now-300_000,"the phone's own clock is 5 minutes slow");
    const snap=await getDoc(doc(a,"c/t"));assert.ok(snap.data().at instanceof Timestamp,"read back as a Timestamp");
    assert.throws(()=>setDoc(doc(a,"c/bad"),{list:[serverTimestamp()]}),e=>e.code==="invalid-argument","serverTimestamp inside an array (thrown synchronously, as the SDK does)");
  });
  ok("serverTimestamp is the server's commit time; each phone's clock is skewed; inside arrays it is refused");
  // 9. Listeners: local write first with hasPendingWrites and null timestamp; updates merged; never older; can die.
  await inSim(5,{listenerDelayMs:3_000},async({server,sim})=>{
    const a=server.client({uid:"a",label:"A"}),b=server.client({uid:"b",label:"B"});
    server.adminSet("c/l",{v:0});
    const seenA=[],seenB=[];
    onSnapshot(doc(a,"c/l"),{includeMetadataChanges:true},snap=>seenA.push({v:snap.data()&&snap.data().v,pending:snap.metadata.hasPendingWrites,at:snap.data()&&snap.data().at}));
    onSnapshot(doc(b,"c/l"),snap=>seenB.push(snap.data().v));
    await new Promise(r=>setTimeout(r,2_000));
    await updateDoc(doc(a,"c/l"),{v:1,at:serverTimestamp()});
    for(let v=2;v<=6;v+=1)await setDoc(doc(b,"c/l"),{v});
    await new Promise(r=>setTimeout(r,20_000));
    const pendingFirst=seenA.find(s=>s.v===1);
    assert.ok(pendingFirst&&pendingFirst.pending===true&&pendingFirst.at===null,"own write shows first, pending, timestamp null");
    for(let i=1;i<seenB.length;i+=1)assert.ok(seenB[i]>seenB[i-1],"never older, never the same twice");
    assert.equal(seenB[seenB.length-1],6,"ends on the newest");
    assert.ok(seenB.length<7,`updates were merged (B saw ${seenB.join(",")})`);
    void sim;
  });
  await inSim(6,{listenerDeath:1},async({server})=>{
    const a=server.client({uid:"a"});server.adminSet("c/d",{v:0});
    let died=null,count=0;
    onSnapshot(doc(a,"c/d"),()=>{count+=1;},error=>{died=error;});
    await new Promise(r=>setTimeout(r,1_000));
    server.adminSet("c/d",{v:1});
    await new Promise(r=>setTimeout(r,5_000));
    assert.ok(died&&died.code,"the error callback ran");
    server.adminSet("c/d",{v:2});
    await new Promise(r=>setTimeout(r,5_000));
    assert.equal(count,1,"a dead listener hears nothing more");
  });
  ok("listeners: own write first (pending, timestamp null), merged and in order, and a listener can die");
  // 10. Offline: reads fail (or come from a live listener's cache), writes queue and land on reconnect, a kill loses them.
  await inSim(7,{},async({server})=>{
    const a=server.client({uid:"a"});server.adminSet("c/o",{v:1});
    a.goOffline();
    await rejects(getDoc(doc(a,"c/o")),"unavailable","offline getDoc without cache");
    await rejects(runTransaction(a,async tx=>{await tx.get(doc(a,"c/o"));}),"unavailable","offline transaction after 5 attempts");
    a.goOnline();
    onSnapshot(doc(a,"c/o"),()=>{});
    await new Promise(r=>setTimeout(r,1_000));
    a.goOffline();
    server.adminSet("c/o",{v:2});
    const cached=await getDoc(doc(a,"c/o"));
    assert.equal(cached.metadata.fromCache,true);assert.equal(cached.data().v,1,"offline getDoc answers the stale cached copy");
    let landed=false;setDoc(doc(a,"c/q"),{v:1}).then(()=>{landed=true;});
    await new Promise(r=>setTimeout(r,5_000));
    assert.equal(server.adminGet("c/q"),null,"queued while offline");
    a.goOnline();
    await new Promise(r=>setTimeout(r,5_000));
    assert.equal(landed,true);assert.deepEqual(server.adminGet("c/q"),{v:1},"sent on reconnect");
    const c=server.client({uid:"c"});c.goOffline();
    setDoc(doc(c,"c/k"),{v:1});c.kill();c.goOnline();
    await new Promise(r=>setTimeout(r,5_000));
    assert.equal(server.adminGet("c/k"),null,"a killed tab's queued write is gone");
  });
  ok("offline: reads fail or answer the stale cached copy, writes queue and send on reconnect, a killed tab loses them");
  // 11. A killed tab never hears back; a request already in flight may still land.
  {
    let landedSome=0,lostSome=0;
    for(let seed=1;seed<=20;seed+=1){
      await inSim(seed,{},async({server})=>{
        const a=server.client({uid:"a"});let heard=false;
        setDoc(doc(a,"c/k"),{v:1}).then(()=>{heard=true;},()=>{heard=true;});
        await new Promise(r=>setTimeout(r,1));
        a.kill();
        await new Promise(r=>setTimeout(r,10_000));
        assert.equal(heard,false,"a killed tab never resolves or rejects");
        if(server.adminGet("c/k"))landedSome+=1;else lostSome+=1;
      });
    }
    assert.ok(landedSome>0&&lostSome>0,`in-flight writes sometimes land (${landedSome}) and sometimes do not (${lostSome})`);
  }
  ok("a killed tab hears nothing; its in-flight write sometimes lands, sometimes not");
  // 12. Data: the SDK's refusals.
  await inSim(8,{},async({server})=>{
    const a=server.client({uid:"a"});const r=doc(a,"c/data");
    await assert.rejects(async()=>setDoc(r,{v:undefined}),e=>e.code==="invalid-argument");
    await assert.rejects(async()=>setDoc(r,{v:[[1]]}),e=>e.code==="invalid-argument");
    class Custom{constructor(){this.x=1;}}
    await assert.rejects(async()=>setDoc(r,{v:new Custom()}),e=>e.code==="invalid-argument");
    await assert.rejects(async()=>setDoc(r,{v:deleteField()}),e=>e.code==="invalid-argument");
    await assert.rejects(async()=>setDoc(r,{v:"x".repeat(1_100_000)}),e=>e.code==="invalid-argument");
    assert.throws(()=>doc(a,"c"),e=>e.code==="invalid-argument");
    await setDoc(r,{when:new Date(Date.UTC(2026,0,1)),nested:{a:1,b:2}});
    const snap=await getDoc(r);
    assert.ok(snap.data().when instanceof Timestamp,"a Date comes back as a Timestamp");
    const copy=snap.data();copy.nested.a=99;assert.equal(snap.data().nested.a,1,"every read is a fresh copy");
    await updateDoc(r,{"nested.b":deleteField(),"nested.c":3});
    assert.deepEqual((await getDoc(r)).data().nested,{a:1,c:3},"dotted update paths and deleteField");
    const batch=writeBatch(a);batch.set(doc(a,"c/b1"),{v:1});batch.update(doc(a,"c/missing"),{v:1});
    await rejects(batch.commit(),"not-found","a batch is atomic");
    assert.equal(server.adminGet("c/b1"),null,"nothing from a failed batch lands");
  });
  ok("data: undefined, nested arrays, custom objects, misplaced deleteField and >1 MiB are refused; Date -> Timestamp; fresh copies; atomic batches");
  // 13. Same seed, same story (the replay rule).
  {
    const run=async seed=>{const {server,sim}=await inSim(seed,{callError:0.1,lostAck:0.1,listenerDelayMs:2_000},async({server})=>{const a=server.client({uid:"a",label:"A"}),b=server.client({uid:"b",label:"B"});const out=await Promise.allSettled([1,2,3,4,5,6].map(i=>increment(i%2?a:b,doc(i%2?a:b,"c/x"))));return out.map(o=>o.status);});return JSON.stringify([server.snapshot(),server.meter,server.writeLog.map(w=>[w.at,w.client,w.path]),sim.now]);};
    assert.equal(await run(77),await run(77),"identical");
    assert.notEqual(await run(77),await run(78),"a different seed explores a different story");
  }
  ok("same seed gives the same story, byte for byte");
  console.log(`PASS POS1M stand-in harshness contracts (${checks} checks)`);
})().catch(error=>{console.error(error.stack||error);process.exit(1);});

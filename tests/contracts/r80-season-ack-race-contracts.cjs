#!/usr/bin/env node
"use strict";
// r80 Season Commit acknowledgement race (node only, deterministic). A manager tapped ACKNOWLEDGE before the rival's
// acknowledgement had reached his page: the tap read the commit from the page's wait-point listener (revision 1), the
// write met revision 2 on the server and came back STALE, and the adapter's one bounded re-read was answered AGAIN by
// that listener although the budget layer had just seen the newer server copy (it only marks the listener as lagging
// for up to 5 s). The retry repeated the stale base and the page showed "Your shared season acknowledgement could not
// be recorded" with ACKNOWLEDGE back on screen.
//
// K1 the real budget layer (end of js/sparkPrivatePairing.js) never answers a read with the listener's copy once a
//    server read on this page returned a newer one; it answers with that newer copy and costs no extra read.
// K2 once the listener delivers the newer copy it serves the document again (the r75 read savings are kept).
// K5 a write refused because the rival's write landed first (permission-denied) is followed by a server read of that
//    document, even if the listener delivers an older copy in between (the provider's proven-advance check needs it).
// K3 the adapter keeps its single bounded STALE retry after a re-read (unchanged), and the provider its proven-advance remap.
// K4 the emulator proof (both orders, same-instant taps, tap during COMMIT & ACKNOWLEDGE) runs in the Gate and in
//    Validate Gameplay Fast next to the r52 concurrent-acknowledge proof.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const pairing=read("js/sparkPrivatePairing.js");
const MARK="// Firestore budget layer (r75).";
assert.ok(pairing.indexOf(MARK)>0,"the Firestore budget layer lives at the end of js/sparkPrivatePairing.js");
const BUDGET_SOURCE=pairing.slice(pairing.indexOf(MARK));
const COMMIT="rivalries/pair_x/seasonCommits/season_1",SETUP="rivalries/pair_x/sharedSetup/authoritative";
let checks=0;const ok=label=>{checks+=1;console.log(`ok ${checks} ${label}`);};
const settle=async()=>{for(let i=0;i<10;i+=1)await new Promise(resolve=>setImmediate(resolve));};

function createWorld(){
  const document={visibilityState:"visible",documentElement:{dataset:{}},addEventListener(){}};
  const sandbox={console,document,addEventListener(){},dispatchEvent(){return true;},CustomEvent:class{},setTimeout:()=>0,clearTimeout(){}};
  sandbox.globalThis=sandbox;vm.createContext(sandbox);
  vm.runInContext(BUDGET_SOURCE,sandbox,{filename:"sparkPrivatePairing.js#budget"});
  const budget=sandbox.CareerModeFirestoreBudget;
  const server=new Map();let version=0;const hooks={beforeCommit:null};const meter={serverReads:0};const listeners=[];
  const snapshotOf=(p,fromCache=false)=>{const record=server.get(p);const data=record?JSON.parse(JSON.stringify(record.data)):null;const stamp=record?record.version:0;
    return {ref:{path:p},exists:()=>Boolean(record),data:()=>data&&JSON.parse(JSON.stringify(data)),metadata:{fromCache,hasPendingWrites:false},_document:{version:{timestamp:{seconds:stamp,nanoseconds:0}}}};};
  const write=(p,data)=>{version+=1;server.set(p,{data,version});};
  const db={kind:"fake"};
  const sdk={
    doc:(_db,...parts)=>({path:parts.join("/")}),
    async runTransaction(_db,update){const writes=new Map();const tx={async get(ref){meter.serverReads+=1;return snapshotOf(ref.path);},set(ref,data){writes.set(ref.path,data);return tx;},update(){return tx;},delete(){return tx;}};
      const value=await update(tx);if(writes.size&&hooks.beforeCommit){const hook=hooks.beforeCommit;hooks.beforeCommit=null;hook();}for(const [p,data] of writes)write(p,data);return value;},
    // Deliveries are manual: deliver(path) hands the listener the server copy as it is now.
    onSnapshot(ref,_options,next){const listener={path:ref.path,next,active:true};listeners.push(listener);return ()=>{listener.active=false;};}
  };
  const services=budget.services({ok:true,firestore:db,firestoreSdk:sdk,auth:{currentUser:{uid:"nik"}}});
  const deliver=(p,snapshot=snapshotOf(p))=>{for(const listener of listeners)if(listener.active&&listener.path===p)listener.next(snapshot);};
  const readOnly=p=>services.firestoreSdk.runTransaction(db,async tx=>(await tx.get(sdk.doc(db,...p.split("/")))).data());
  return {budget,services,sdk,db,server,meter,write,deliver,readOnly,hooks,snapshotOf};
}

(async()=>{
  // K1 + K2
  {
    const w=createWorld();
    w.write(COMMIT,{revision:1,acknowledgedRoles:[]});w.write(SETUP,{revision:6});
    assert.equal((await w.readOnly(COMMIT)).revision,1);                       // first read: sets the page's Firestore
    w.budget.watchWaitPoint("season-commit",COMMIT,()=>{});
    w.deliver(COMMIT);await settle();
    assert.equal(w.budget.stats().watching,COMMIT);assert.equal(w.budget.stats().watchHealthy,true,"the wait-point listener is healthy");
    // Daniel acknowledges: revision 2 is on the server, but not yet on Nik's page.
    w.write(COMMIT,{revision:2,acknowledgedRoles:["playerOne"]});
    let before=w.meter.serverReads;
    assert.equal((await w.readOnly(COMMIT)).revision,1,"the page cannot know about revision 2 yet: the listener answers");
    assert.equal(w.meter.serverReads,before,"served by the listener");
    // Nik's acknowledgement transaction reads revision 2 on the server and refuses its stale base (no write).
    const STALE=Object.assign(new Error("stale"),{code:"SEASON_COMMIT_STALE_BASE_REVISION"});
    await assert.rejects(w.services.firestoreSdk.runTransaction(w.db,async tx=>{const snap=await tx.get(w.sdk.doc(w.db,...COMMIT.split("/")));if(snap.data().revision!==1)throw STALE;tx.set(w.sdk.doc(w.db,...COMMIT.split("/")),{});}),error=>error===STALE);
    // The adapter's bounded re-read must see revision 2: the page has already seen it on the server.
    before=w.meter.serverReads;
    const again=await w.readOnly(COMMIT);
    assert.equal(again.revision,2,"the re-read after a STALE write answers the newer server copy, never the lagging listener's");
    assert.equal(w.meter.serverReads,before,"and costs no extra server read (the copy the write transaction read)");
    ok("K1 a listener behind a server read this page made never answers; the newer server copy does, with no extra read");
    // The listener catches up: it serves the document again.
    w.deliver(COMMIT);await settle();
    const served=w.budget.stats().listenerServed;before=w.meter.serverReads;
    assert.equal((await w.readOnly(COMMIT)).revision,2);
    assert.equal(w.budget.stats().listenerServed,served+1,"served by the listener again once it has caught up");
    assert.equal(w.meter.serverReads,before);
    ok("K2 once the listener delivers the newer copy it serves the watched document again (r75 savings kept)");
  }
  // K5
  {
    const w=createWorld();
    w.write(COMMIT,{revision:1,acknowledgedRoles:[]});
    assert.equal((await w.readOnly(COMMIT)).revision,1);
    w.budget.watchWaitPoint("season-commit",COMMIT,()=>{});
    w.deliver(COMMIT);await settle();
    assert.equal(w.budget.stats().watchHealthy,true);
    const old=w.snapshotOf(COMMIT);
    // Nik's acknowledgement reads revision 1; Daniel's lands before Nik's commit and the Rules refuse Nik's write.
    const denied=Object.assign(new Error("Missing or insufficient permissions."),{code:"permission-denied"});
    w.hooks.beforeCommit=()=>{w.write(COMMIT,{revision:2,acknowledgedRoles:["playerOne"]});throw denied;};
    await assert.rejects(w.services.firestoreSdk.runTransaction(w.db,async tx=>{const ref=w.sdk.doc(w.db,...COMMIT.split("/"));const snap=await tx.get(ref);tx.set(ref,{revision:snap.data().revision+1});}),error=>error===denied);
    // The listener, still behind, re-delivers revision 1 before the provider's check reads the commit.
    w.deliver(COMMIT,old);await settle();
    const before=w.meter.serverReads;
    assert.equal((await w.readOnly(COMMIT)).revision,2,"the check after a refused write reads what the server holds now");
    assert.equal(w.meter.serverReads,before+1,"exactly one server read");
    ok("K5 after a refused write the next read of that document reaches the server even if the listener re-delivers an older copy");
  }
  // K3
  {
    const adapter=read("js/productionSharedSeasonCommit.js"),provider=read("js/sparkSharedSeasonCommit.js");
    assert.match(adapter,/for\(let attempt=0;attempt<2;attempt\+=1\)/,"the adapter keeps a two-attempt ceiling");
    assert.match(adapter,/result\?\.code==="SEASON_COMMIT_STALE_BASE_REVISION"&&attempt===0\)\{current=psscResultError\(await provider\.read\(ctx\.options\)\)/,"the adapter retries STALE once, after a re-read");
    assert.match(provider,/fresh\.revision>seenRevision/,"the provider remaps a denial only after proving the commit advanced");
    assert.match(BUDGET_SOURCE,/fsbWaitLive\(\)&&!fsbWait\.lagUntil\)/,"a lagging listener is skipped in fsbReusable");
    assert.match(BUDGET_SOURCE,/if\(wrote\)\{fsbMarkWritten\(db,written\);for\(const path of written\)if\(path\)\{fsbServerNext\.set\(path/,"a refused write sends the next read of its documents to the server");
    ok("K3 the adapter's single bounded STALE retry and the provider's proven-advance remap are unchanged");
  }
  // K4
  {
    for(const file of [".github/workflows/showdown-gate.yml",".github/workflows/validate-gameplay-fast.yml"]){
      const line=read(file).split("\n").find(text=>text.includes("shared-season-commit-concurrent-acknowledge-emulator.cjs")&&text.includes("emulators:exec"));
      assert.ok(line,`${file} runs the season acknowledgement emulator proofs`);
      assert.match(line,/node tests\/firebase\/shared-season-commit-concurrent-acknowledge-emulator\.cjs && node tests\/firebase\/shared-season-commit-ack-race-emulator\.cjs/,`${file} runs the acknowledgement race proof with it`);
    }
    const proof=read("tests/firebase/shared-season-commit-ack-race-emulator.cjs");
    for(const scenario of ["A1","A2","A3","A4"])assert.ok(proof.includes(`"${scenario} `)||proof.includes(`\`${scenario}.`),`emulator scenario ${scenario}`);
    assert.match(proof,/js\/productionSharedSeasonCommit\.js/);assert.match(proof,/Firestore budget layer \(r75\)/);
    ok("K4 the two-page emulator proof (real adapter, budget layer and Rules; both orders and same-instant taps) runs in the Gate and Validate Gameplay Fast");
  }
  console.log(`PASS r80 Season Commit acknowledgement race (${checks} checks): a lagging wait-point listener never answers the re-read of a stale acknowledgement, so a tap made before the rival's acknowledgement reaches the page is recorded on the bounded retry.`);
})().catch(error=>{console.error(error);process.exitCode=1;});

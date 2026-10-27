"use strict";
// R85 (#1009) Season Commit acknowledgement: second proving read after a short pause.
//
// When an ACKNOWLEDGE write is refused with permission-denied, js/sparkSharedSeasonCommit.js remaps it to the retryable
// SEASON_COMMIT_STALE_BASE_REVISION only after a fresh authority-checked read proves the stored commit advanced past the
// revision the write read. R85 adds: if that first proving read does not show the advance (still the old revision, or the
// read itself failed), wait 400 ms and do exactly one second proving read before calling the denial unproven.
//
// This contract drives that new branch deterministically (node only, no emulator, no real time): a fake Firestore that
// denies like the Rules, and a controlled clock that replaces the provider's 400 ms setTimeout so the rival's write can be
// placed exactly inside the pause. The production adapter's bounded acknowledgement loop (psscWrite in
// js/productionSharedSeasonCommit.js) is replayed step for step and pinned to the adapter's source text, and every case
// asserts the exact number of write attempts, proving reads, adapter reads and pauses, in both manager orders.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {webcrypto}=require("node:crypto");
const Results=require("../../js/sharedSeasonResults.js");
const Provider=require("../../js/sparkSharedSeasonCommit.js");

const rivalryId="pair_"+("6".repeat(64));
const sessionId="session_"+("c".repeat(64));
const DEVICE={playerOne:"device_"+("1".repeat(32)),playerTwo:"device_"+("2".repeat(32))};
const UID={playerOne:"manager_daniel",playerTwo:"manager_nik"};
const resultOp=n=>`season_result_op_${Number(n).toString(16).padStart(32,"0")}`;
const commitOp=n=>`season_commit_op_${Number(n).toString(16).padStart(32,"0")}`;
const hash=n=>`sha256:${Number(n).toString(16).padStart(64,"0")}`;
const ts=millis=>({toMillis:()=>millis});
const p1={leaguePosition:1,leaguePoints:87,leagueGoals:93,domesticCup:false,championsLeague:true,topScorer:true,topAssist:false};
const p2={leaguePosition:2,leaguePoints:84,leagueGoals:101,domesticCup:true,championsLeague:false,topScorer:false,topAssist:true};
const ORDERS=[["playerTwo","playerOne"],["playerOne","playerTwo"]];
let checks=0;const ok=label=>{checks+=1;console.log(`ok ${checks} ${label}`);};
let opSeq=100;const nextOp=()=>commitOp(++opSeq);

function clone(value){if(value===undefined)return undefined;const text=JSON.stringify(value,(_key,item)=>item&&typeof item.toMillis==="function"?{__millis:item.toMillis()}:item);return JSON.parse(text,(_key,item)=>item&&Number.isFinite(item.__millis)?ts(item.__millis):item);}
function codeError(code,message){const error=new Error(message||code);error.code=code;return error;}
const denied=()=>codeError("permission-denied","Missing or insufficient permissions.");

async function createHarness(){
  const store=new Map(),versions=new Map();let clock=0;
  const key=(...parts)=>parts.join("/");
  const put=(p,value)=>{store.set(p,clone(value));versions.set(p,++clock);};
  for(const role of ["playerOne","playerTwo"]){
    put(key("accounts",UID[role]),{objectType:"account",objectId:UID[role],lifecycleState:"live",data:{status:"active"}});
    put(key("accounts",UID[role],"devices",DEVICE[role]),{objectType:"device",objectId:DEVICE[role],lifecycleState:"live",data:{deviceId:DEVICE[role],state:"active"}});
  }
  put(key("rivalries",rivalryId),{objectType:"rivalry",objectId:rivalryId,lifecycleState:"live",data:{connectionState:"active",authorizedAccountIds:[UID.playerOne,UID.playerTwo],managerSlots:[{slotId:"playerOne",accountId:UID.playerOne,profileId:"profile_"+("1".repeat(24)),saveId:"save_"+("3".repeat(24)),entitlementState:"active"},{slotId:"playerTwo",accountId:UID.playerTwo,profileId:"profile_"+("2".repeat(24)),saveId:"save_"+("4".repeat(24)),entitlementState:"active"}]}});
  put(key("rivalries",rivalryId,"sessions",sessionId),{objectType:"session",objectId:sessionId,lifecycleState:"live",data:{rivalryId,state:"active",hostAccountId:UID.playerOne,memberAccountIds:[UID.playerOne,UID.playerTwo],expiresAt:ts(9_000_000)}});
  const setup={schemaVersion:1,objectType:"sharedSetupLedger",rivalryId,revision:6,phase:"SHOWDOWN_CONFIRMED",coordinatorRole:"playerOne",operationIds:[1,2,3,4,5,6].map(n=>"setup_op_"+n.toString(16).padStart(32,"0")),operationTypes:["open","commit-league","commit-clubs","commit-length","confirm","confirm"],baseRevisions:[0,1,2,3,4,5],actorRoles:["playerOne","playerOne","playerOne","playerOne","playerOne","playerTwo"],totalSeasons:3,confirmedRoles:["playerOne","playerTwo"],activeSessionId:sessionId,updatedAt:ts(1_000_000),updatedByDeviceId:DEVICE.playerTwo};
  put(key("rivalries",rivalryId,"sharedSetup","authoritative"),setup);
  const protocol=await Results.createProtocol({teamCount:20,cryptoImpl:webcrypto});
  const careerStart={phase:"CAREER_START_READY",revision:2,acknowledgedRoles:["playerOne","playerTwo"]},transferChallenge={phase:"COMPLETED",seasonNumber:1,revision:7};
  let ready=(await protocol.apply({state:null,setup,careerStart,transferChallenge,seasonNumber:1,actorRole:"playerOne",command:{type:"publish-result",operationId:resultOp(1),baseRevision:0,result:p1}})).state;
  ready=(await protocol.apply({state:ready,setup,careerStart,transferChallenge,seasonNumber:1,actorRole:"playerTwo",command:{type:"publish-result",operationId:resultOp(2),baseRevision:1,result:p2}})).state;
  const publicPath=key("rivalries",rivalryId,"seasonResults","season_1"),commitPath=key("rivalries",rivalryId,"seasonCommits","season_1");
  put(publicPath,{schemaVersion:1,objectType:"sharedSeasonResults",rivalryId,seasonNumber:1,runtimeRevision:"1.9.1-r9",phase:"RESULTS_READY",revision:2,publishedRoles:[...ready.publishedRoles],operationIds:ready.receipts.map(r=>r.operationId),operationHashes:[hash(10),hash(11)],baseRevisions:ready.receipts.map(r=>r.baseRevision),actorRoles:ready.receipts.map(r=>r.actorRole)});
  for(const role of ["playerOne","playerTwo"]){const receipt=ready.receipts.find(r=>r.actorRole===role);put(key("rivalries",rivalryId,"seasonResults","season_1","roles",role),{schemaVersion:1,objectType:"sharedSeasonResultRole",rivalryId,seasonNumber:1,managerRole:role,result:ready.results[role],operationId:receipt.operationId,commandHash:receipt.commandHash});}

  // Per-manager counters. Inside one provider write call (h.write), the first transaction is the write attempt and every
  // later transaction is a provider-internal proving read; transactions outside a write call are adapter reads (h.read).
  const counts={playerOne:{writes:0,proofReads:0,adapterReads:0,committed:0},playerTwo:{writes:0,proofReads:0,adapterReads:0,committed:0}};
  const inWrite={playerOne:null,playerTwo:null};
  const roleOf=uid=>uid===UID.playerOne?"playerOne":uid===UID.playerTwo?"playerTwo":null;
  // hooks:
  //  afterCommitRead(role)  runs once, after `role`'s write transaction reads the commit document (to interleave a rival);
  //  denyNextWrite[role]    deny `role`'s next commit unconditionally (the Rules saw a change the client cannot yet see);
  //  failProofRead[role]    Set of proving-read ordinals (1-based, within the current write call) that fail with `unavailable`;
  //  lostResponse[role]     apply `role`'s next commit on the server, then throw this error code to the client.
  const hooks={afterCommitRead:null,denyNextWrite:{},failProofRead:{playerOne:new Set(),playerTwo:new Set()},lostResponse:{}};
  const sdk={doc:(_db,...parts)=>key(...parts),serverTimestamp:()=>ts(2_000_000),runTransaction:async(_db,callback)=>{
    const pending=[],seen=new Map();let role=null,kind=null;
    const tx={get:async ref=>{
      if(role===null){
        const match=/^accounts\/([^/]+)$/.exec(ref);role=match?roleOf(match[1]):null;assert.ok(role,`first transactional read must identify the manager, got ${ref}`);
        if(inWrite[role]){if(inWrite[role].first){inWrite[role].first=false;kind="write";counts[role].writes+=1;}else{kind="proof";counts[role].proofReads+=1;inWrite[role].proofs+=1;if(hooks.failProofRead[role].has(inWrite[role].proofs))throw codeError("unavailable","The service is currently unavailable.");}}
        else{kind="adapter";counts[role].adapterReads+=1;}
      }
      seen.set(ref,versions.get(ref)||0);const present=store.has(ref),value=clone(store.get(ref));
      if(ref===commitPath&&kind==="write"&&hooks.afterCommitRead&&hooks.afterCommitRead.role===role){const hook=hooks.afterCommitRead;hooks.afterCommitRead=null;await hook.run();}
      return {exists:()=>present,data:()=>clone(value)};
    },set:(ref,value)=>pending.push([ref,clone(value)])};
    const result=await callback(tx);
    if(pending.length){
      assert.equal(kind,"write","only a write call may queue a write");
      if(hooks.denyNextWrite[role]){hooks.denyNextWrite[role]=false;throw denied();}
      // Rules: a revoked actor device can never write.
      if(store.get(key("accounts",UID[role],"devices",DEVICE[role]))?.data?.state!=="active")throw denied();
      // Rules see the stored document at commit time: a write from a superseded revision is denied (not aborted).
      for(const [ref] of pending)if((versions.get(ref)||0)!==seen.get(ref))throw denied();
      for(const [ref,value] of pending)put(ref,value);
      counts[role].committed+=1;
      if(hooks.lostResponse[role]){const code=hooks.lostResponse[role];hooks.lostResponse[role]=null;throw codeError(code,"response lost after the server applied the write");}
    }
    return result;
  }};
  const options=role=>({user:{uid:UID[role]},firestore:{},firebaseSdk:sdk,rivalryId,sessionId,deviceId:DEVICE[role],seasonNumber:1,cryptoImpl:webcrypto,nowEpochMs:2_000_000});
  const write=async(method,role,operationId,baseRevision)=>{const outer=inWrite[role];inWrite[role]={first:true,proofs:0};try{return await Provider[method]({...options(role),operationId,baseRevision});}finally{inWrite[role]=outer;}};
  const read=role=>Provider.read(options(role));
  const revoke=role=>{store.get(key("accounts",UID[role],"devices",DEVICE[role])).data.state="revoked";versions.set(key("accounts",UID[role],"devices",DEVICE[role]),++clock);};
  const reset=()=>{for(const role of ["playerOne","playerTwo"])counts[role]={writes:0,proofReads:0,adapterReads:0,committed:0};};
  return {store,commitPath,hooks,counts,write,read,revoke,reset};
}
async function committed(){
  const h=await createHarness();
  const commit=await h.write("commitSeason","playerOne",nextOp(),0);
  assert.equal(commit.ok,true,JSON.stringify(commit));assert.equal(commit.revision,1);
  h.reset();return h;
}

// Controlled clock: every setTimeout the provider schedules is recorded and released at once (no real time passes);
// onPause runs inside the pause, before the provider's second proving read.
async function withClock(onPause,run){
  const real=globalThis.setTimeout,pauses=[];let pauseError=null;
  globalThis.setTimeout=(fn,ms,...args)=>{pauses.push(ms);Promise.resolve().then(()=>onPause?onPause(pauses.length,ms):undefined).catch(error=>{pauseError=error;}).then(()=>fn(...args));return {controlled:true};};
  const started=process.hrtime.bigint();
  try{const value=await run();if(pauseError)throw pauseError;return {value,pauses,elapsedMs:Number(process.hrtime.bigint()-started)/1e6};}
  finally{globalThis.setTimeout=real;}
}

// Step-for-step replay of psscWrite("acknowledge") in js/productionSharedSeasonCommit.js (pinned to its source in A0):
// read; if not yet acknowledged, up to two attempts with one operationId; on STALE at attempt 0 re-read, stop if
// satisfied, else retry from the fresh revision; any other failure throws (shown to the manager as an error).
const satisfied=current=>Boolean(current.ownAcknowledged||current.phase==="ACKNOWLEDGED");
async function adapterAcknowledge(h,role,operationId=nextOp()){
  let current=await h.read(role);if(!current.ok)throw codeError(current.code);
  if(satisfied(current))return {acknowledged:true,attempts:0};
  for(let attempt=0;attempt<2;attempt+=1){
    const baseRevision=Number(current.revision||0);
    const result=await h.write("acknowledgeSeason",role,operationId,baseRevision);
    if(result&&result.ok===true)return {acknowledged:true,attempts:attempt+1,result};
    if(result?.code==="SEASON_COMMIT_STALE_BASE_REVISION"&&attempt===0){current=await h.read(role);if(!current.ok)throw codeError(current.code);if(satisfied(current))return {acknowledged:true,attempts:1,viaRead:true};continue;}
    throw codeError(result?.code||"SEASON_COMMIT_PROVIDER_FAILED");
  }
  return {acknowledged:false,attempts:2};
}
function ceilings(h,role,expected,label){assert.deepEqual({...h.counts[role]},expected,`${label}: exact ceilings for ${role}`);}

(async()=>{
  // A0 the replay above is the adapter's real loop, and the provider's pause is exactly one 400 ms wait between two reads.
  {
    const adapter=fs.readFileSync(path.join(__dirname,"../../js/productionSharedSeasonCommit.js"),"utf8");
    const loop=/async function psscWrite\(kind,ctx,request,current\)\{[\s\S]*?for\(let attempt=0;attempt<2;attempt\+=1\)\{[\s\S]*?if\(result&&result\.ok===true\)return true;\s*if\(result\?\.code==="SEASON_COMMIT_STALE_BASE_REVISION"&&attempt===0\)\{current=psscResultError\(await provider\.read\(ctx\.options\)\);if\(psscSatisfied\(kind,current\)\)return true;continue;\}\s*psscResultError\(result,[^\n]*\n\s*\}\s*return false;\s*\}/;
    assert.match(adapter,loop,"adapter keeps one operationId, two attempts, one STALE re-read and throws on any other failure");
    assert.match(adapter,/function psscSatisfied\(kind,current\)\{if\(kind==="commit"\)return Boolean\(current\.committed\);return Boolean\(current\.ownAcknowledged\|\|current\.phase==="ACKNOWLEDGED"\);\}/);
    const provider=fs.readFileSync(path.join(__dirname,"../../js/sparkSharedSeasonCommit.js"),"utf8");
    const proof=/async function scpConcurrentAdvance\(error,seenRevision,options\)\{([\s\S]*?)\n  \}/.exec(provider);
    assert.ok(proof,"scpConcurrentAdvance present");
    assert.equal((proof[1].match(/await scpRead\(options\)/g)||[]).length,2,"exactly two proving reads");
    assert.equal((proof[1].match(/setTimeout\(resolve,400\)/g)||[]).length,1,"exactly one 400 ms pause");
    assert.match(proof[1],/fresh\.revision>seenRevision/,"proof still requires a strictly newer stored revision");
    ok("A0 adapter loop replay and provider proof shape (two reads, one 400 ms pause, strict advance) are pinned to source");
  }

  for(const [actor,rival] of ORDERS){
    const tag=`[${actor} acknowledges, ${rival} is the rival]`;

    // A1 first proving read sees the advance at once: no pause, one proving read (pre-R85 path unchanged).
    {
      const h=await committed();let rivalResult=null;
      h.hooks.afterCommitRead={role:actor,run:async()=>{rivalResult=await h.write("acknowledgeSeason",rival,nextOp(),1);}};
      const {value,pauses}=await withClock(null,()=>adapterAcknowledge(h,actor));
      assert.equal(rivalResult?.ok,true,JSON.stringify(rivalResult));
      assert.equal(value.acknowledged,true);assert.equal(value.attempts,2);assert.deepEqual(pauses,[]);
      assert.equal(h.store.get(h.commitPath).phase,"ACKNOWLEDGED");assert.deepEqual(h.store.get(h.commitPath).acknowledgedRoles,[rival,actor]);
      ceilings(h,actor,{writes:2,proofReads:1,adapterReads:2,committed:1},"A1");ceilings(h,rival,{writes:1,proofReads:0,adapterReads:0,committed:1},"A1");
      ok(`A1 ${tag} advance visible on the first proving read: STALE with no pause, one retry reaches ACKNOWLEDGED`);
    }

    // A2 the new branch: first proving read still shows revision 1, the rival's write lands during the 400 ms pause,
    // the second proving read proves the advance, and the adapter's one bounded retry converges.
    {
      const h=await committed();let rivalResult=null,storeAtPause=null;
      h.hooks.denyNextWrite[actor]=true;
      const {value,pauses,elapsedMs}=await withClock(async()=>{storeAtPause=h.store.get(h.commitPath).revision;rivalResult=await h.write("acknowledgeSeason",rival,nextOp(),1);},()=>adapterAcknowledge(h,actor));
      assert.equal(storeAtPause,1,"the first proving read ran against an unadvanced commit");
      assert.equal(rivalResult?.ok,true,JSON.stringify(rivalResult));assert.equal(rivalResult.revision,2);
      assert.deepEqual(pauses,[400],"exactly one 400 ms pause, on the controlled clock");
      assert.ok(elapsedMs<5000,"no real 400 ms timer gates the test");
      assert.equal(value.acknowledged,true);assert.equal(value.attempts,2);assert.equal(value.result.revision,3);assert.equal(value.result.phase,"ACKNOWLEDGED");
      assert.deepEqual(h.store.get(h.commitPath).acknowledgedRoles,[rival,actor]);
      ceilings(h,actor,{writes:2,proofReads:2,adapterReads:2,committed:1},"A2");ceilings(h,rival,{writes:1,proofReads:0,adapterReads:0,committed:1},"A2");
      ok(`A2 ${tag} first proving read unadvanced, rival lands during the pause, second read proves it, one bounded retry converges`);
    }

    // A3 first proving read fails (unavailable); the rival had already advanced; the second read proves it.
    {
      const h=await committed();
      h.hooks.afterCommitRead={role:actor,run:async()=>{const r=await h.write("acknowledgeSeason",rival,nextOp(),1);assert.equal(r.ok,true);}};
      h.hooks.failProofRead[actor]=new Set([1]);
      const {value,pauses}=await withClock(null,()=>adapterAcknowledge(h,actor));
      assert.deepEqual(pauses,[400]);assert.equal(value.acknowledged,true);assert.equal(value.attempts,2);
      assert.equal(h.store.get(h.commitPath).phase,"ACKNOWLEDGED");
      ceilings(h,actor,{writes:2,proofReads:2,adapterReads:2,committed:1},"A3");
      ok(`A3 ${tag} first proving read unavailable, second read proves the advance, one bounded retry converges`);
    }

    // A3b first proving read fails AND the rival only lands during the pause.
    {
      const h=await committed();h.hooks.denyNextWrite[actor]=true;h.hooks.failProofRead[actor]=new Set([1]);
      const {value,pauses}=await withClock(async()=>{const r=await h.write("acknowledgeSeason",rival,nextOp(),1);assert.equal(r.ok,true);},()=>adapterAcknowledge(h,actor));
      assert.deepEqual(pauses,[400]);assert.equal(value.acknowledged,true);assert.equal(value.result.phase,"ACKNOWLEDGED");
      ceilings(h,actor,{writes:2,proofReads:2,adapterReads:2,committed:1},"A3b");
      ok(`A3b ${tag} first proving read unavailable and rival lands during the pause: still converges with the same ceilings`);
    }

    // A4 no advance at all: both proving reads unadvanced; the genuine denial surfaces, no false success, no second write.
    {
      const h=await committed();h.hooks.denyNextWrite[actor]=true;
      const direct=await withClock(null,()=>h.write("acknowledgeSeason",actor,nextOp(),1));
      assert.deepEqual(direct.pauses,[400]);assert.equal(direct.value.ok,false);assert.equal(direct.value.code,"permission-denied","an unproven denial is never remapped to STALE");
      ceilings(h,actor,{writes:1,proofReads:2,adapterReads:0,committed:0},"A4 provider");
      h.reset();h.hooks.denyNextWrite[actor]=true;
      const viaAdapter=await withClock(null,()=>adapterAcknowledge(h,actor).then(()=>({threw:false}),error=>({threw:true,code:error.code})));
      assert.deepEqual(viaAdapter.value,{threw:true,code:"permission-denied"},"the adapter shows the error instead of a success");
      assert.deepEqual(viaAdapter.pauses,[400]);
      assert.equal(h.store.get(h.commitPath).revision,1);assert.deepEqual(h.store.get(h.commitPath).acknowledgedRoles,[]);
      ceilings(h,actor,{writes:1,proofReads:2,adapterReads:1,committed:0},"A4 adapter");
      ok(`A4 ${tag} no advance on either proving read: permission-denied surfaces, no false success, one write, two proving reads`);
    }

    // A4b both proving reads fail (unavailable) with no advance: the original denial surfaces, still bounded.
    {
      const h=await committed();h.hooks.denyNextWrite[actor]=true;h.hooks.failProofRead[actor]=new Set([1,2]);
      const {value,pauses}=await withClock(null,()=>h.write("acknowledgeSeason",actor,nextOp(),1));
      assert.deepEqual(pauses,[400]);assert.equal(value.code,"permission-denied");
      ceilings(h,actor,{writes:1,proofReads:2,adapterReads:0,committed:0},"A4b");
      ok(`A4b ${tag} both proving reads unavailable: the original permission-denied surfaces after exactly two reads`);
    }

    // A5 genuine revocation: the actor's device is revoked between its read and its commit. The Rules deny, both proving
    // reads fail authority (device inactive), the denial surfaces and nothing loops.
    {
      const h=await committed();
      h.hooks.afterCommitRead={role:actor,run:async()=>{h.revoke(actor);}};
      const {value,pauses}=await withClock(null,()=>adapterAcknowledge(h,actor).then(()=>({threw:false}),error=>({threw:true,code:error.code})));
      assert.deepEqual(value,{threw:true,code:"permission-denied"},"a revoked device is never told to retry or shown success");
      assert.deepEqual(pauses,[400]);assert.equal(h.store.get(h.commitPath).revision,1);
      ceilings(h,actor,{writes:1,proofReads:2,adapterReads:1,committed:0},"A5");
      ok(`A5 ${tag} revoked device: permission-denied surfaces after one write and two proving reads, no retry loop`);
    }

    // A5b revocation plus a real rival advance during the pause: the revoked actor cannot prove anything, denial stays.
    {
      const h=await committed();
      h.hooks.afterCommitRead={role:actor,run:async()=>{h.revoke(actor);}};
      const {value,pauses}=await withClock(async()=>{const r=await h.write("acknowledgeSeason",rival,nextOp(),1);assert.equal(r.ok,true);},()=>h.write("acknowledgeSeason",actor,nextOp(),1));
      assert.deepEqual(pauses,[400]);assert.equal(value.ok,false);assert.equal(value.code,"permission-denied");
      assert.equal(h.store.get(h.commitPath).revision,2);
      ceilings(h,actor,{writes:1,proofReads:2,adapterReads:0,committed:0},"A5b");
      ok(`A5b ${tag} revoked device with a rival advance during the pause: still permission-denied, never STALE`);
    }

    // A6 lost write response surfaced as a transport error: the server applied the acknowledgement. No proving read runs
    // (not a denial), and the next tap converges idempotently: the adapter's first read sees it acknowledged, and a replay
    // of the same operation is a no-op.
    {
      const h=await committed();const operationId=nextOp();h.hooks.lostResponse[actor]="unavailable";
      const first=await withClock(null,()=>h.write("acknowledgeSeason",actor,operationId,1));
      assert.equal(first.value.ok,false);assert.equal(first.value.code,"unavailable","a transport error is not reported as success or STALE");
      assert.deepEqual(first.pauses,[]);
      ceilings(h,actor,{writes:1,proofReads:0,adapterReads:0,committed:1},"A6 lost");
      assert.equal(h.store.get(h.commitPath).revision,2);assert.deepEqual(h.store.get(h.commitPath).acknowledgedRoles,[actor]);
      h.reset();
      const replay=await withClock(null,()=>h.write("acknowledgeSeason",actor,operationId,1));
      assert.equal(replay.value.ok,true,JSON.stringify(replay.value));assert.equal(replay.value.replayed,true);assert.equal(replay.value.revision,2);
      ceilings(h,actor,{writes:1,proofReads:0,adapterReads:0,committed:0},"A6 replay");
      h.reset();
      const tap=await withClock(null,()=>adapterAcknowledge(h,actor));
      assert.deepEqual(tap.value,{acknowledged:true,attempts:0});
      ceilings(h,actor,{writes:0,proofReads:0,adapterReads:1,committed:0},"A6 next tap");
      assert.deepEqual(h.store.get(h.commitPath).acknowledgedRoles,[actor]);
      ok(`A6 ${tag} lost response (unavailable) after a server-side write: no false STALE, same-operation replay and next tap are no-ops`);
    }

    // A6b lost response surfaced as permission-denied: the first proving read already sees the actor's own write
    // (revision 2), so the adapter's STALE re-read finds it acknowledged and stops without a second write or a pause.
    {
      const h=await committed();h.hooks.lostResponse[actor]="permission-denied";
      const {value,pauses}=await withClock(null,()=>adapterAcknowledge(h,actor));
      assert.deepEqual(pauses,[]);assert.equal(value.acknowledged,true);assert.equal(value.viaRead,true);
      assert.equal(h.store.get(h.commitPath).revision,2);assert.deepEqual(h.store.get(h.commitPath).acknowledgedRoles,[actor]);
      ceilings(h,actor,{writes:1,proofReads:1,adapterReads:2,committed:1},"A6b");
      ok(`A6b ${tag} lost response surfaced as permission-denied converges after one write and one re-read, no duplicate write`);
    }

    // A6c lost response, then the rival lands; the actor's next tap (fresh operation) sees its own acknowledgement.
    {
      const h=await committed();h.hooks.lostResponse[actor]="deadline-exceeded";
      const lost=await withClock(null,()=>adapterAcknowledge(h,actor).then(()=>({threw:false}),error=>({threw:true,code:error.code})));
      assert.deepEqual(lost.value,{threw:true,code:"deadline-exceeded"});assert.deepEqual(lost.pauses,[]);
      const rivalTap=await withClock(null,()=>adapterAcknowledge(h,rival));assert.equal(rivalTap.value.acknowledged,true);assert.equal(rivalTap.value.result.phase,"ACKNOWLEDGED");
      h.reset();
      const again=await withClock(null,()=>adapterAcknowledge(h,actor));
      assert.deepEqual(again.value,{acknowledged:true,attempts:0});
      ceilings(h,actor,{writes:0,proofReads:0,adapterReads:1,committed:0},"A6c");
      assert.deepEqual(h.store.get(h.commitPath).acknowledgedRoles,[actor,rival]);
      ok(`A6c ${tag} lost response then rival acknowledgement: the actor's next tap sees ACKNOWLEDGED with no extra write`);
    }
  }

  console.log(`PASS R85 acknowledgement second proving read (${checks} checks): an unproven first read waits 400 ms (controlled clock) and reads exactly once more; a late rival advance converges in one bounded retry, unproven or unauthorized denials surface, lost responses converge idempotently, in both manager orders.`);
})().catch(error=>{console.error(error);process.exitCode=1;});

"use strict";

// R95-01 PR 1: the Ball Game (draw 3, six clubs per ball) against the COMPOSED production Rules on the emulator.
//  - accept/refuse matrix for the new ledger key `draw`: only the int 3, only at create, only beside `stops`, and it can
//    never be added, dropped or changed later (so draw 1 and draw 2 ledgers keep their shapes);
//  - the provider: draw 3 end to end (twelve distinct candidates, the stop picks a 60 degree slice), first tap wins,
//    an open replayed as another draw conflicts, and a draw 2 Showdown still runs exactly as in 2.7.0.
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,getDoc,setDoc,serverTimestamp}=firestoreSdk;
const {initializeTestEnvironment,assertFails,assertSucceeds}=require("@firebase/rules-unit-testing");
const CATALOG=require("../../js/sharedShowdownCatalog.js").catalog;
const provider=require("../../js/sparkSharedShowdownSetup.js");

const PROJECT_ID="demo-cms-r95-ball-game";
if(!fs.existsSync("firestore.spark.generated.rules"))require("node:child_process").execFileSync(process.execPath,["scripts/build-production-firestore-rules.mjs"],{stdio:"inherit"});
const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const A="acct_ball_a",B="acct_ball_b";
const S1=`session_${"1".repeat(64)}`;
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`;
const PA=`profile_${"1".repeat(24)}`,PB=`profile_${"2".repeat(24)}`;
const SA=`save_${"1".repeat(24)}`,SB=`save_${"2".repeat(24)}`;
const RAW=`pair_${"3".repeat(64)}`,TWO=`pair_${"2".repeat(64)}`,PROV=`pair_${"6".repeat(64)}`,PROV2=`pair_${"7".repeat(64)}`;
const COST2=`pair_${"8".repeat(64)}`,COST3=`pair_${"9".repeat(64)}`;
const TYPES=["open","commit-league","commit-clubs","commit-length","confirm","confirm"];
const PHASES=["SHARED_SETUP_OPEN","LEAGUE_WHEEL_COMMITTED","CLUB_ASSIGNMENTS_COMMITTED","SEASON_LENGTH_COMMITTED","SEASON_LENGTH_COMMITTED","SHOWDOWN_CONFIRMED"];
let checks=0;
function ok(label){checks+=1;process.stdout.write(`ok ${checks} ${label}\n`);}
function sdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp};}
// Firebase cost meter (Nik 2026-11-17: the Ball Game must never push Firebase toward the limit). Counts every transaction,
// document read and document write the provider makes through the SDK it is given; a draw 3 setup must cost exactly what a
// draw 2 setup costs (same reads, the same 6 setup writes, no retry).
function meteredSdk(meter){
  return {Timestamp,doc,serverTimestamp,runTransaction:(db,body)=>{meter.transactions+=1;return firestoreSdk.runTransaction(db,transaction=>{
    meter.attempts+=1;
    const metered=new Proxy(transaction,{get(target,key){
      const value=target[key];if(typeof value!=="function")return value;
      const tag=ref=>ref.path.replace(/pair_[0-9a-f]{64}/,"pair_*");
      if(key==="get")return (...args)=>{meter.reads+=1;meter.readPaths.add(tag(args[0]));return value.apply(target,args);};
      if(key==="set"||key==="update"||key==="delete")return (...args)=>{meter.writes+=1;meter.writePaths.add(tag(args[0]));const out=value.apply(target,args);return out===target?metered:out;};
      return value.bind(target);
    }});
    return body(metered);
  });}};
}
function account(id){return {objectType:"account",objectId:id,lifecycleState:"live",data:{status:"active"}};}
function device(id){return {objectType:"device",objectId:id,lifecycleState:"live",data:{deviceId:id,state:"active"}};}
function rivalry(id){return {objectType:"rivalry",objectId:id,lifecycleState:"live",data:{connectionState:"active",authorizedAccountIds:[A,B],managerSlots:[
  {slotId:"playerOne",accountId:A,profileId:PA,saveId:SA,entitlementState:"active"},
  {slotId:"playerTwo",accountId:B,profileId:PB,saveId:SB,entitlementState:"active"}]}};}
function session(id,rivalryId,expiresAt){
  const ms=expiresAt.toMillis();
  return {schemaVersion:1,objectType:"session",objectId:id,revision:1,parentRevision:0,lifecycleState:"live",contentHash:`sha256:${"0".repeat(64)}`,priorContentHash:`sha256:${"1".repeat(64)}`,
    updatedAt:Timestamp.fromMillis(ms-60000),updatedByAccountId:A,updatedByDeviceId:DA,
    data:{rivalryId,state:"active",hostAccountId:A,memberAccountIds:[A,B],createdAt:Timestamp.fromMillis(ms-300000),expiresAt,lastActivityAt:Timestamp.fromMillis(ms-60000),revokedAt:null},tombstone:null};
}
function op(n){return `setup_op_${n.toString(16).padStart(32,"0")}`;}
let opCounter=1;
// The valid next ledger for step `revision` (what the real adapter writes; the ledger itself never stores a league or a
// club, so a valid raw write is byte-identical to the adapter's).
function nextLedger(prior,rivalryId,{draw=null,stop=null,role=null}={}){
  const revision=prior?prior.revision+1:1,index=revision-1,actor=role||"playerOne";
  const actorRoles=prior?[...prior.actorRoles,actor]:[actor];
  const ledger={schemaVersion:1,objectType:"sharedSetupLedger",rivalryId,revision,phase:PHASES[index],coordinatorRole:"playerOne",
    operationIds:[...(prior?prior.operationIds:[]),op(opCounter++)],operationTypes:TYPES.slice(0,revision),baseRevisions:Array.from({length:revision},(_,i)=>i),
    actorRoles,totalSeasons:revision>=4?3:null,confirmedRoles:actorRoles.slice(4),activeSessionId:S1,updatedAt:serverTimestamp(),updatedByDeviceId:actor==="playerOne"?DA:DB};
  if(prior?Object.hasOwn(prior,"stops"):draw)ledger.stops=index>=4?[...prior.stops,stop]:[];
  if(prior?Object.hasOwn(prior,"draw"):draw===3)ledger.draw=3;
  return ledger;
}
function options(db,uid,rivalryId,now,type,baseRevision,operationId,extra={}){
  return {user:{uid},firestore:db,firebaseSdk:sdk(),deviceId:uid===A?DA:DB,rivalryId,sessionId:S1,nowEpochMs:now,type,baseRevision,operationId,cryptoImpl:crypto.webcrypto,...extra};
}

(async()=>{
  const testEnv=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    const now=Date.now();
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async context=>{
      const db=context.firestore(),future=Timestamp.fromMillis(now+30*60*1000);
      for(const id of [A,B])await setDoc(doc(db,"accounts",id),account(id));
      await setDoc(doc(db,"accounts",A,"devices",DA),device(DA));
      await setDoc(doc(db,"accounts",B,"devices",DB),device(DB));
      for(const id of [RAW,TWO,PROV,PROV2,COST2,COST3]){await setDoc(doc(db,"rivalries",id),rivalry(id));await setDoc(doc(db,"rivalries",id,"sessions",S1),session(S1,id,future));}
    });
    const dbA=testEnv.authenticatedContext(A).firestore(),dbB=testEnv.authenticatedContext(B).firestore();
    const ref=(db,id)=>doc(db,"rivalries",id,"sharedSetup","authoritative");
    const stored=async id=>{let value;await testEnv.withSecurityRulesDisabled(async context=>{value=(await getDoc(doc(context.firestore(),"rivalries",id,"sharedSetup","authoritative"))).data();});return value;};
    const write=(db,id,value)=>setDoc(ref(db,id),value);
    const without=(value,key)=>{const copy={...value};delete copy[key];return copy;};

    // ---- Draw 3, raw writes: every refusal next to the one valid shape ------------------------------------------------
    const open=nextLedger(null,RAW,{draw:3});
    for(const bad of [2,4,0,"3",3.5,null,[3],true])await assertFails(write(dbA,RAW,{...open,draw:bad}));
    await assertFails(write(dbA,RAW,without(open,"stops")));
    await assertFails(write(dbA,RAW,{...open,stops:[7]}));
    await assertSucceeds(write(dbA,RAW,open));
    let prior=await stored(RAW);assert.equal(prior.draw,3);assert.deepEqual(prior.stops,[]);
    ok("draw 3 create: only draw == 3 beside stops == [] (2, 4, 0, '3', 3.5, null, [3], true, no stops, a stop at open all refused)");
    for(let step=2;step<=6;step+=1){
      const role=step===6?"playerTwo":"playerOne",db=role==="playerOne"?dbA:dbB;
      const next=nextLedger(prior,RAW,{stop:step===5?10:step===6?300:null,role});
      await assertFails(write(db,RAW,without(next,"draw")));
      for(const bad of [2,4,"3"])await assertFails(write(db,RAW,{...next,draw:bad}));
      await assertSucceeds(write(db,RAW,next));
      prior=await stored(RAW);assert.equal(prior.revision,step);assert.equal(prior.draw,3);
    }
    assert.deepEqual(prior.stops,[10,300]);assert.equal(prior.phase,"SHOWDOWN_CONFIRMED");
    ok("steps 2-6 keep draw == 3: dropping it or changing it to 2, 4 or '3' is refused at every step; the stops rules are unchanged");

    // ---- A draw 2 ledger can never gain the key -----------------------------------------------------------------------
    let two=nextLedger(null,TWO,{draw:2});
    await assertSucceeds(write(dbA,TWO,two));
    two=await stored(TWO);assert.equal(Object.hasOwn(two,"draw"),false);
    for(let step=2;step<=6;step+=1){
      const role=step===6?"playerTwo":"playerOne",db=role==="playerOne"?dbA:dbB;
      const next=nextLedger(two,TWO,{stop:step===5?20:step===6?40:null,role});
      await assertFails(write(db,TWO,{...next,draw:3}));
      await assertSucceeds(write(db,TWO,next));
      two=await stored(TWO);assert.equal(Object.hasOwn(two,"draw"),false);
    }
    ok("a draw 2 ledger (stops, no draw) is accepted at every step exactly as in 2.7.0 and can never gain draw: 3");

    // ---- Provider: draw 3 end to end, first tap wins ------------------------------------------------------------------
    const P=(db,uid,type,base,n,extra)=>provider.mutate(options(db,uid,PROV,now+n,type,base,op(3000+n),extra));
    let result=await P(dbA,A,"open",0,1,{draw:3});assert.equal(result.ok,true,JSON.stringify(result));
    assert.deepEqual((await stored(PROV)).stops,[]);assert.equal((await stored(PROV)).draw,3);
    assert.equal((await P(dbA,A,"open",0,1,{draw:2})).code,"SETUP_IDEMPOTENCY_CONFLICT","the same open cannot be replayed as draw 2");
    assert.equal((await P(dbA,A,"open",0,1,{})).code,"SETUP_IDEMPOTENCY_CONFLICT","nor as the old draw");
    assert.equal((await P(dbA,A,"open",0,1,{draw:3})).status,"replayed","the same draw 3 open is idempotent");
    assert.equal((await provider.mutate(options(dbA,A,PROV2,now,"open",0,op(3900),{draw:4}))).code,"SETUP_COMMAND_INVALID","draw 4 does not exist");
    result=await P(dbA,A,"commit-league",1,2);assert.equal(result.ok,true,JSON.stringify(result));
    result=await P(dbA,A,"commit-clubs",2,3);assert.equal(result.ok,true,JSON.stringify(result));
    const candidates=result.state.candidates;
    assert.equal(candidates.playerOne.length,6);assert.equal(candidates.playerTwo.length,6);
    assert.equal(new Set([...candidates.playerOne,...candidates.playerTwo]).size,12,"twelve distinct clubs");
    assert.ok([...candidates.playerOne,...candidates.playerTwo].every(club=>CATALOG[result.state.leagueId].includes(club)));
    result=await P(dbA,A,"commit-length",3,4,{totalSeasons:3});assert.equal(result.ok,true,JSON.stringify(result));
    assert.equal((await P(dbA,A,"confirm",4,5,{})).code,"SETUP_DRAW_VERSION_MISMATCH","a draw 3 confirm without a stop is refused before any write");
    result=await P(dbA,A,"confirm",4,7,{stop:200});assert.equal(result.ok,true,JSON.stringify(result));assert.deepEqual(result.state.stops,[200]);
    assert.equal((await P(dbA,A,"confirm",4,7,{stop:200})).status,"replayed","resending the pending stop is idempotent");
    assert.equal((await P(dbA,A,"confirm",4,7,{stop:201})).code,"SETUP_IDEMPOTENCY_CONFLICT","the same operation can never carry another stop");
    result=await P(dbB,B,"confirm",5,9,{stop:119});assert.equal(result.ok,true,JSON.stringify(result));
    assert.equal(result.state.phase,"SHOWDOWN_CONFIRMED");
    assert.deepEqual(result.state.clubs,{playerOne:candidates.playerOne[3],playerTwo:candidates.playerTwo[1]},"stop 200 is slice 3, stop 119 is slice 1");
    const final=await stored(PROV);assert.deepEqual(final.stops,[200,119]);assert.equal(final.draw,3);
    const reread=await provider.read({user:{uid:B},firestore:dbB,firebaseSdk:sdk(),deviceId:DB,rivalryId:PROV,sessionId:S1,nowEpochMs:now,cryptoImpl:crypto.webcrypto});
    assert.equal(reread.ok,true,JSON.stringify(reread));assert.deepEqual(reread.state.clubs,result.state.clubs,"the other phone rebuilds the same clubs");
    ok("provider draw 3: twelve candidates at commit-clubs, the stop picks a 60 degree slice, resend idempotent, both phones rebuild the same clubs");

    // ---- Provider: a draw 2 Showdown still runs as in 2.7.0 -------------------------------------------------------------
    const Q=(db,uid,type,base,n,extra)=>provider.mutate(options(db,uid,PROV2,now+n,type,base,op(4000+n),extra));
    for(const [type,base,n,extra] of [["open",0,1,{draw:2}],["commit-league",1,2],["commit-clubs",2,3],["commit-length",3,4,{totalSeasons:1}],["confirm",4,5,{stop:130}]]){
      const db=n===5?dbB:dbA,uid=n===5?B:A;result=await Q(db,uid,type,base,n,extra);assert.equal(result.ok,true,JSON.stringify(result));
    }
    result=await Q(dbA,A,"confirm",5,6,{stop:359});assert.equal(result.ok,true,JSON.stringify(result));
    assert.equal(result.state.candidates.playerOne.length,3);assert.equal(Object.hasOwn(await stored(PROV2),"draw"),false);
    assert.deepEqual(result.state.clubs,{playerOne:result.state.candidates.playerOne[2],playerTwo:result.state.candidates.playerTwo[1]},"draw 2 keeps 120 degree sections");
    ok("provider draw 2 is unchanged: three candidates, 120 degree sections, no draw key");

    // ---- Firebase cost: a draw 3 setup costs exactly what a draw 2 setup costs ---------------------------------------
    const cost=async(rivalryId,draw,base)=>{
      const meter={transactions:0,attempts:0,reads:0,writes:0,readPaths:new Set(),writePaths:new Set()};
      const run=(db,uid,type,baseRevision,n,extra)=>provider.mutate({...options(db,uid,rivalryId,now+n,type,baseRevision,op(base+n),extra),firebaseSdk:meteredSdk(meter)});
      for(const [type,baseRevision,n,extra,phone] of [["open",0,1,{draw},"A"],["commit-league",1,2,{},"A"],["commit-clubs",2,3,{},"A"],["commit-length",3,4,{totalSeasons:1},"A"],["confirm",4,5,{stop:200},"A"],["confirm",5,6,{stop:119},"B"]]){
        const out=await run(phone==="A"?dbA:dbB,phone==="A"?A:B,type,baseRevision,n,extra);assert.equal(out.ok,true,JSON.stringify(out));
      }
      for(const [db,uid,deviceId] of [[dbA,A,DA],[dbB,B,DB]]){
        const out=await provider.read({user:{uid},firestore:db,firebaseSdk:meteredSdk(meter),deviceId,rivalryId,sessionId:S1,nowEpochMs:now,cryptoImpl:crypto.webcrypto});
        assert.equal(out.ok,true,JSON.stringify(out));
      }
      return {transactions:meter.transactions,attempts:meter.attempts,reads:meter.reads,writes:meter.writes,readPaths:[...meter.readPaths].sort(),writePaths:[...meter.writePaths].sort()};
    };
    const cost2=await cost(COST2,2,5000),cost3=await cost(COST3,3,6000);
    assert.deepEqual(cost3,cost2,"a draw 3 setup makes exactly the Firebase calls a draw 2 setup makes");
    // Under the Rules budget sweep the recorder runs every transaction body twice (a dry run to measure, then the real
    // one), so the per-body counts double there; the draw 2 = draw 3 equality above holds either way.
    const runs=process.env.RULES_BUDGET_SWEEP_OUT?2:1;
    assert.equal(cost3.writes,6*runs,"six setup writes, one per step");assert.deepEqual(cost3.writePaths,["rivalries/pair_*/sharedSetup/authoritative"]);
    assert.equal(cost3.attempts,cost3.transactions*runs,"no transaction retried");
    ok(`Firebase cost: draw 3 setup = draw 2 setup (${cost3.transactions} transactions, ${cost3.reads} document reads, ${cost3.writes} writes, no retry; same documents)`);
    process.stdout.write(`R95_FIREBASE_COST ${JSON.stringify({draw2:cost2,draw3:cost3})}\n`);

    process.stdout.write(`R95-01 Ball Game Rules emulator proof passed: ${checks} checks.\n`);
  }finally{await testEnv.cleanup();}
})().catch(error=>{console.error(error.stack||error);process.exit(1);});

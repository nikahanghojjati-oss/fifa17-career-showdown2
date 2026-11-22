"use strict";

// R98-01 PR 1: the League Roulette (Nik 2026-11-20, option A: Daniel and Nik each drop their own two balls, taking turns)
// against the COMPOSED production Rules on the emulator.
//  - accept/refuse matrix for the new ledger key `drops`: only on a draw 3 ledger, 0 at create, 1 with commit-league, then
//    one ball at a time by the manager whose ball it is (coordinator odd balls, rival even balls), never twice, never
//    skipped, nothing else changed; commit-clubs needs all 4; it can never be added, dropped or changed later;
//  - the provider: a roulette Showdown end to end, a double tap or a retry never drops twice, the wrong manager is refused
//    before any write, and an ordinary draw 3 Showdown still runs exactly as in 2.10.0;
//  - Firebase cost: a roulette setup = a draw 3 setup + 3 small writes and 0 reads (the plain update path).
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,getDoc,setDoc,updateDoc,serverTimestamp}=firestoreSdk;
const {initializeTestEnvironment,assertFails,assertSucceeds}=require("@firebase/rules-unit-testing");
const provider=require("../../js/sparkSharedShowdownSetup.js");

const PROJECT_ID="demo-cms-r98-league-roulette";
if(!fs.existsSync("firestore.spark.generated.rules"))require("node:child_process").execFileSync(process.execPath,["scripts/build-production-firestore-rules.mjs"],{stdio:"inherit"});
const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const A="acct_roul_a",B="acct_roul_b";
const S1=`session_${"1".repeat(64)}`;
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`;
const PA=`profile_${"1".repeat(24)}`,PB=`profile_${"2".repeat(24)}`;
const SA=`save_${"1".repeat(24)}`,SB=`save_${"2".repeat(24)}`;
const RAW=`pair_${"3".repeat(64)}`,PLAIN3=`pair_${"4".repeat(64)}`,PROV=`pair_${"6".repeat(64)}`,PROV3=`pair_${"7".repeat(64)}`;
const COST3=`pair_${"8".repeat(64)}`,COSTR=`pair_${"9".repeat(64)}`;
const TYPES=["open","commit-league","commit-clubs","commit-length","confirm","confirm"];
const PHASES=["SHARED_SETUP_OPEN","LEAGUE_WHEEL_COMMITTED","CLUB_ASSIGNMENTS_COMMITTED","SEASON_LENGTH_COMMITTED","SEASON_LENGTH_COMMITTED","SHOWDOWN_CONFIRMED"];
let checks=0;
function ok(label){checks+=1;process.stdout.write(`ok ${checks} ${label}\n`);}
function sdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp,updateDoc};}
// Counts every transaction, document read and write (transaction writes and plain updates) the provider makes.
function meteredSdk(meter){
  return {Timestamp,doc,serverTimestamp,
    updateDoc:(ref,data)=>{meter.writes+=1;meter.plain+=1;meter.writePaths.add(ref.path.replace(/pair_[0-9a-f]{64}/,"pair_*"));return updateDoc(ref,data);},
    runTransaction:(db,body)=>{meter.transactions+=1;return firestoreSdk.runTransaction(db,transaction=>{
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
// The valid next ledger for step `revision` (what the real adapter writes). Coordinator = playerOne (A).
function nextLedger(prior,rivalryId,{roulette=false,stop=null,role=null}={}){
  const revision=prior?prior.revision+1:1,index=revision-1,actor=role||"playerOne";
  const actorRoles=prior?[...prior.actorRoles,actor]:[actor];
  const ledger={schemaVersion:1,objectType:"sharedSetupLedger",rivalryId,revision,phase:PHASES[index],coordinatorRole:"playerOne",
    operationIds:[...(prior?prior.operationIds:[]),op(opCounter++)],operationTypes:TYPES.slice(0,revision),baseRevisions:Array.from({length:revision},(_,i)=>i),
    actorRoles,totalSeasons:revision>=4?3:null,confirmedRoles:actorRoles.slice(4),activeSessionId:S1,updatedAt:serverTimestamp(),updatedByDeviceId:actor==="playerOne"?DA:DB,
    stops:prior?(index>=4?[...prior.stops,stop]:[...prior.stops]):[],draw:3};
  if(prior?Object.hasOwn(prior,"drops"):roulette)ledger.drops=prior?(revision===2?1:prior.drops):0;
  return ledger;
}
function options(db,uid,rivalryId,now,type,baseRevision,operationId,extra={}){
  return {user:{uid},firestore:db,firebaseSdk:sdk(),deviceId:uid===A?DA:DB,rivalryId,sessionId:S1,nowEpochMs:now,type,baseRevision,operationId,cryptoImpl:crypto.webcrypto,...extra};
}
function dropOptions(db,uid,rivalryId,now,ball,known,extra={}){
  return {user:{uid},firestore:db,firebaseSdk:sdk(),deviceId:uid===A?DA:DB,rivalryId,sessionId:S1,nowEpochMs:now,ball,managerRole:uid===A?"playerOne":"playerTwo",known,...extra};
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
      for(const id of [RAW,PLAIN3,PROV,PROV3,COST3,COSTR]){await setDoc(doc(db,"rivalries",id),rivalry(id));await setDoc(doc(db,"rivalries",id,"sessions",S1),session(S1,id,future));}
    });
    const dbA=testEnv.authenticatedContext(A).firestore(),dbB=testEnv.authenticatedContext(B).firestore();
    const ref=(db,id)=>doc(db,"rivalries",id,"sharedSetup","authoritative");
    const stored=async id=>{let value;await testEnv.withSecurityRulesDisabled(async context=>{value=(await getDoc(doc(context.firestore(),"rivalries",id,"sharedSetup","authoritative"))).data();});return value;};
    const write=(db,id,value)=>setDoc(ref(db,id),value);
    const without=(value,key)=>{const copy={...value};delete copy[key];return copy;};
    const ball=(db,id,drops,extra={})=>updateDoc(ref(db,id),{drops,updatedAt:serverTimestamp(),updatedByDeviceId:db===dbA?DA:DB,activeSessionId:S1,...extra});

    // ---- Raw writes: create ------------------------------------------------------------------------------------------
    const open=nextLedger(null,RAW,{roulette:true});
    for(const bad of [1,4,-1,"0",0.5,null,[0],true])await assertFails(write(dbA,RAW,{...open,drops:bad}));
    await assertFails(write(dbA,RAW,without(without(open,"draw"),"stops")));
    await assertFails(write(dbA,RAW,without(open,"draw")));
    await assertSucceeds(write(dbA,RAW,open));
    let prior=await stored(RAW);assert.equal(prior.drops,0);
    await assertFails(ball(dbB,RAW,1));await assertFails(ball(dbA,RAW,1));
    ok("create: drops only 0 and only on a draw 3 ledger (1, 4, -1, '0', 0.5, null, [0], true, no draw all refused); no ball before the league is drawn");

    // ---- commit-league is ball 1 -------------------------------------------------------------------------------------
    let next=nextLedger(prior,RAW);
    for(const bad of [0,2,4])await assertFails(write(dbA,RAW,{...next,drops:bad}));
    await assertFails(write(dbA,RAW,without(next,"drops")));
    await assertSucceeds(write(dbA,RAW,next));
    prior=await stored(RAW);assert.equal(prior.drops,1);assert.equal(prior.phase,"LEAGUE_WHEEL_COMMITTED");
    ok("commit-league moves drops from 0 to exactly 1 (0, 2, 4 or dropping the key refused)");

    // ---- Balls 2-4: turn, count, nothing else -----------------------------------------------------------------------
    await assertFails(write(dbA,RAW,nextLedger(prior,RAW)),"commit-clubs after 1 ball");
    await assertFails(ball(dbA,RAW,2),"ball 2 is the rival's");
    await assertFails(ball(dbB,RAW,3),"no skipping");
    await assertFails(ball(dbB,RAW,1),"no standing still");
    await assertFails(ball(dbB,RAW,2,{totalSeasons:3}),"nothing else may change");
    await assertFails(ball(dbB,RAW,2,{revision:3}),"the revision stays");
    await assertFails(ball(dbB,RAW,2,{updatedByDeviceId:DA}),"the stamp is the actor's own device");
    await assertSucceeds(ball(dbB,RAW,2));
    await assertFails(ball(dbB,RAW,2),"a ball never drops twice");
    await assertFails(ball(dbB,RAW,3),"ball 3 is the coordinator's");
    await assertFails(write(dbA,RAW,nextLedger(await stored(RAW),RAW)),"commit-clubs after 2 balls");
    await assertSucceeds(ball(dbA,RAW,3));
    await assertFails(ball(dbA,RAW,4),"ball 4 is the rival's");
    await assertFails(write(dbA,RAW,nextLedger(await stored(RAW),RAW)),"commit-clubs after 3 balls");
    await assertSucceeds(ball(dbB,RAW,4));
    await assertFails(ball(dbA,RAW,5));await assertFails(ball(dbB,RAW,5));
    prior=await stored(RAW);assert.equal(prior.drops,4);assert.equal(prior.revision,2);
    ok("balls 2-4: rival, coordinator, rival; never the wrong manager, never skipped, never twice, never a 5th, nothing else changes; commit-clubs refused before ball 4");

    // ---- commit-clubs and every later step keep drops == 4 ---------------------------------------------------------
    for(let step=3;step<=6;step+=1){
      const role=step===6?"playerTwo":"playerOne",db=role==="playerOne"?dbA:dbB;
      next=nextLedger(prior,RAW,{stop:step===5?10:step===6?300:null,role});
      await assertFails(write(db,RAW,without(next,"drops")));
      for(const bad of [3,5,0])await assertFails(write(db,RAW,{...next,drops:bad}));
      await assertSucceeds(write(db,RAW,next));
      prior=await stored(RAW);assert.equal(prior.revision,step);assert.equal(prior.drops,4);
      await assertFails(ball(dbA,RAW,5));await assertFails(ball(dbB,RAW,5));
    }
    assert.equal(prior.phase,"SHOWDOWN_CONFIRMED");assert.deepEqual(prior.stops,[10,300]);
    ok("steps 3-6 keep drops == 4 (dropping it or 3, 5, 0 refused) and no ball drops after commit-clubs");

    // ---- A draw 3 ledger without the roulette can never gain it ----------------------------------------------------
    let plain=nextLedger(null,PLAIN3);
    await assertSucceeds(write(dbA,PLAIN3,plain));plain=await stored(PLAIN3);
    next=nextLedger(plain,PLAIN3);
    for(const bad of [1,-1,0,4])await assertFails(write(dbA,PLAIN3,{...next,drops:bad}),"commit-league never adds drops (-1 is the absent sentinel, Codex #1562)");
    await assertSucceeds(write(dbA,PLAIN3,next));plain=await stored(PLAIN3);assert.equal(Object.hasOwn(plain,"drops"),false);
    await assertFails(ball(dbB,PLAIN3,2));
    await assertSucceeds(write(dbA,PLAIN3,nextLedger(plain,PLAIN3)));
    assert.equal(Object.hasOwn(await stored(PLAIN3),"drops"),false);
    ok("a draw 3 ledger without drops runs as in 2.10.0 (commit-clubs right after commit-league) and can never gain drops");

    // ---- Provider: a roulette Showdown end to end -------------------------------------------------------------------
    const P=(db,uid,type,base,n,extra)=>provider.mutate(options(db,uid,PROV,now+n,type,base,op(3000+n),extra));
    let result=await P(dbA,A,"open",0,1,{draw:3,roulette:true});assert.equal(result.ok,true,JSON.stringify(result));assert.equal(result.drops,0);
    assert.equal((await P(dbA,A,"open",0,1,{draw:3})).code,"SETUP_IDEMPOTENCY_CONFLICT","the same open cannot be replayed without the roulette");
    assert.equal((await P(dbA,A,"open",0,1,{draw:3,roulette:true})).status,"replayed");
    assert.equal((await provider.mutate(options(dbA,A,PROV3,now,"open",0,op(3900),{draw:2,roulette:true}))).code,"SETUP_COMMAND_INVALID","roulette needs draw 3");
    result=await P(dbA,A,"commit-league",1,2);assert.equal(result.ok,true,JSON.stringify(result));assert.equal(result.drops,1);
    const leagueId=result.state.leagueId;
    assert.equal((await P(dbA,A,"commit-clubs",2,3)).code,"SETUP_ROULETTE_UNFINISHED","clubs wait for the 4 balls");
    const known=async()=>{const v=await stored(PROV);return {drops:v.drops,revision:v.revision,coordinatorRole:v.coordinatorRole};};
    const D=(db,uid,n,b,k)=>provider.drop(dropOptions(db,uid,PROV,now+n,b,k));
    assert.equal((await D(dbA,A,10,2,await known())).code,"SETUP_ROULETTE_NOT_YOUR_BALL","Daniel cannot drop Nik's ball");
    assert.equal((await D(dbB,B,11,3,await known())).code,"SETUP_ROULETTE_NOT_OPEN","ball 3 before ball 2");
    assert.equal((await provider.drop(dropOptions(dbB,B,PROV,now,6,null))).code,"SETUP_ROULETTE_BALL_INVALID");
    assert.equal((await provider.drop(dropOptions(dbB,B,PROV,now,1,null))).code,"SETUP_ROULETTE_BALL_INVALID","ball 1 is commit-league");
    const k2=await known();
    result=await D(dbB,B,12,2,k2);assert.deepEqual({...result},{ok:true,status:"accepted",replayed:false,drops:2});
    result=await D(dbB,B,13,2,k2);assert.equal(result.status,"replayed","a double tap on the stale copy: the update is refused and one read sees ball 2 landed");
    result=await D(dbB,B,14,2,null);assert.equal(result.status,"replayed","a retry without a copy");
    assert.equal((await stored(PROV)).drops,2);
    result=await D(dbA,A,15,3,null);assert.equal(result.status,"accepted","ball 3 through the transaction (no copy on this phone)");
    result=await D(dbB,B,16,4,await known());assert.equal(result.status,"accepted");
    assert.equal((await D(dbA,A,17,4,null)).status,"replayed");
    const reread=await provider.read({user:{uid:B},firestore:dbB,firebaseSdk:sdk(),deviceId:DB,rivalryId:PROV,sessionId:S1,nowEpochMs:now,cryptoImpl:crypto.webcrypto});
    assert.equal(reread.ok,true,JSON.stringify(reread));assert.equal(reread.drops,4);assert.equal(reread.state.leagueId,leagueId,"the league never changes");
    result=await P(dbA,A,"commit-clubs",2,18);assert.equal(result.ok,true,JSON.stringify(result));assert.equal(result.drops,4);
    result=await P(dbA,A,"commit-length",3,19,{totalSeasons:3});assert.equal(result.ok,true,JSON.stringify(result));
    result=await P(dbA,A,"confirm",4,20,{stop:200});assert.equal(result.ok,true,JSON.stringify(result));
    result=await P(dbB,B,"confirm",5,21,{stop:119});assert.equal(result.ok,true,JSON.stringify(result));
    assert.equal(result.state.phase,"SHOWDOWN_CONFIRMED");assert.equal(result.state.leagueId,leagueId);
    const final=await stored(PROV);assert.equal(final.drops,4);assert.equal(final.revision,6);
    ok("provider roulette: open -> league (ball 1) -> balls 2, 3, 4 in turn -> clubs -> confirmed; wrong manager and out-of-turn refused before any write; double tap and retries replay; league unchanged");

    // ---- Firebase cost: roulette setup = draw 3 setup + 3 plain writes, 0 reads -----------------------------------------
    const cost=async(rivalryId,roulette,base)=>{
      const meter={transactions:0,attempts:0,reads:0,writes:0,plain:0,readPaths:new Set(),writePaths:new Set()};
      const run=(db,uid,type,baseRevision,n,extra)=>provider.mutate({...options(db,uid,rivalryId,now+n,type,baseRevision,op(base+n),extra),firebaseSdk:meteredSdk(meter)});
      const steps=[["open",0,1,{draw:3,...(roulette?{roulette:true}:{})},"A"],["commit-league",1,2,{},"A"]];
      for(const [type,baseRevision,n,extra,phone] of steps){const out=await run(phone==="A"?dbA:dbB,phone==="A"?A:B,type,baseRevision,n,extra);assert.equal(out.ok,true,JSON.stringify(out));}
      if(roulette){
        let k={drops:1,revision:2,coordinatorRole:"playerOne"};
        for(const [b,phone] of [[2,"B"],[3,"A"],[4,"B"]]){
          const out=await provider.drop({...dropOptions(phone==="A"?dbA:dbB,phone==="A"?A:B,rivalryId,now+10+b,b,k),firebaseSdk:meteredSdk(meter)});
          assert.equal(out.status,"accepted",JSON.stringify(out));k={...k,drops:b};
        }
      }
      for(const [type,baseRevision,n,extra,phone] of [["commit-clubs",2,3,{},"A"],["commit-length",3,4,{totalSeasons:1},"A"],["confirm",4,5,{stop:200},"A"],["confirm",5,6,{stop:119},"B"]]){
        const out=await run(phone==="A"?dbA:dbB,phone==="A"?A:B,type,baseRevision,n,extra);assert.equal(out.ok,true,JSON.stringify(out));
      }
      return {transactions:meter.transactions,attempts:meter.attempts,reads:meter.reads,writes:meter.writes,plain:meter.plain,readPaths:[...meter.readPaths].sort(),writePaths:[...meter.writePaths].sort()};
    };
    const cost3=await cost(COST3,false,5000),costR=await cost(COSTR,true,6000);
    const runs=process.env.RULES_BUDGET_SWEEP_OUT?2:1;
    assert.equal(costR.reads,cost3.reads,"the roulette adds no read");
    assert.equal(costR.transactions,cost3.transactions,"and no transaction");
    assert.equal(costR.writes,cost3.writes+3,"exactly 3 more writes (balls 2-4)");
    assert.equal(costR.plain,3,"each one a plain update");
    assert.deepEqual(costR.writePaths,cost3.writePaths,"to the same setup document");
    assert.equal(cost3.writes,6*runs);
    ok(`Firebase cost: roulette setup = draw 3 setup + 3 plain writes (${costR.transactions} transactions, ${costR.reads} document reads, ${costR.writes} writes; draw 3: ${cost3.writes} writes)`);
    process.stdout.write(`R98_FIREBASE_COST ${JSON.stringify({draw3:cost3,roulette:costR})}\n`);

    process.stdout.write(`R98-01 League Roulette Rules emulator proof passed: ${checks} checks.\n`);
  }finally{await testEnv.cleanup();}
})().catch(error=>{console.error(error.stack||error);process.exit(1);});

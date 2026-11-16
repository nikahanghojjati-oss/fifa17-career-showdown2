"use strict";

// R94-02 PR 1: the club draw "spin and stop" (draw 2) against the COMPOSED production Rules on the emulator.
//  - accept/refuse matrix for the new ledger key `stops` (study 5.3): out of range, wrong step, shape flip between
//    revisions, first stop rewritten, second stop by the same manager, anything after revision 6;
//  - a ledger written before R94-02 (no `stops`) is still valid end to end and can never gain the key;
//  - the provider: draw 2 end to end, first tap wins (idempotent resend, a different stop on the same operation is a
//    conflict), both managers stopping in the same moment (one wins, the other resends its SAME stop on the new base).
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,getDoc,setDoc,serverTimestamp}=firestoreSdk;
const {initializeTestEnvironment,assertFails,assertSucceeds}=require("@firebase/rules-unit-testing");
const CATALOG=require("../../js/sharedShowdownCatalog.js").catalog;
const provider=require("../../js/sparkSharedShowdownSetup.js");

const PROJECT_ID="demo-cms-r94-club-draw";
if(!fs.existsSync("firestore.spark.generated.rules"))require("node:child_process").execFileSync(process.execPath,["scripts/build-production-firestore-rules.mjs"],{stdio:"inherit"});
const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const A="acct_draw_a",B="acct_draw_b";
const S1=`session_${"1".repeat(64)}`;
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`;
const PA=`profile_${"1".repeat(24)}`,PB=`profile_${"2".repeat(24)}`;
const SA=`save_${"1".repeat(24)}`,SB=`save_${"2".repeat(24)}`;
const RAW=`pair_${"d".repeat(64)}`,OLD=`pair_${"e".repeat(64)}`,PROV=`pair_${"f".repeat(64)}`,RACE=`pair_${"9".repeat(64)}`;
const TYPES=["open","commit-league","commit-clubs","commit-length","confirm","confirm"];
const PHASES=["SHARED_SETUP_OPEN","LEAGUE_WHEEL_COMMITTED","CLUB_ASSIGNMENTS_COMMITTED","SEASON_LENGTH_COMMITTED","SEASON_LENGTH_COMMITTED","SHOWDOWN_CONFIRMED"];
let checks=0;
function ok(label){checks+=1;process.stdout.write(`ok ${checks} ${label}\n`);}
function sdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp};}
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
function nextLedger(prior,rivalryId,{draw=false,stop=null,role=null}={}){
  const revision=prior?prior.revision+1:1,index=revision-1,actor=role||"playerOne";
  const actorRoles=prior?[...prior.actorRoles,actor]:[actor];
  const ledger={schemaVersion:1,objectType:"sharedSetupLedger",rivalryId,revision,phase:PHASES[index],coordinatorRole:"playerOne",
    operationIds:[...(prior?prior.operationIds:[]),op(opCounter++)],operationTypes:TYPES.slice(0,revision),baseRevisions:Array.from({length:revision},(_,i)=>i),
    actorRoles,totalSeasons:revision>=4?3:null,confirmedRoles:actorRoles.slice(4),activeSessionId:S1,updatedAt:serverTimestamp(),updatedByDeviceId:actor==="playerOne"?DA:DB};
  if(prior?Object.hasOwn(prior,"stops"):draw)ledger.stops=index>=4?[...prior.stops,stop]:[];
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
      for(const id of [RAW,OLD,PROV,RACE]){await setDoc(doc(db,"rivalries",id),rivalry(id));await setDoc(doc(db,"rivalries",id,"sessions",S1),session(S1,id,future));}
    });
    const dbA=testEnv.authenticatedContext(A).firestore(),dbB=testEnv.authenticatedContext(B).firestore();
    const ref=(db,id)=>doc(db,"rivalries",id,"sharedSetup","authoritative");
    const stored=async id=>{let value;await testEnv.withSecurityRulesDisabled(async context=>{value=(await getDoc(doc(context.firestore(),"rivalries",id,"sharedSetup","authoritative"))).data();});return value;};
    const write=(db,id,value)=>setDoc(ref(db,id),value);

    // ---- Draw 2, raw writes: every refusal next to the one valid shape ------------------------------------------------
    let open=nextLedger(null,RAW,{draw:true});
    await assertFails(write(dbA,RAW,{...open,stops:[5]}));
    await assertFails(write(dbA,RAW,{...open,stops:"none"}));
    await assertFails(write(dbA,RAW,{...open,stops:[null]}));
    await assertSucceeds(write(dbA,RAW,open));
    let prior=await stored(RAW);
    for(const step of [2,3,4]){
      const next=nextLedger(prior,RAW);
      const {stops,...without}=next;
      await assertFails(write(dbA,RAW,without));
      await assertFails(write(dbA,RAW,{...next,stops:[7]}));
      await assertSucceeds(write(dbA,RAW,next));
      prior=await stored(RAW);assert.equal(prior.revision,step);assert.deepEqual(prior.stops,[]);
    }
    ok("draw 2 create needs stops == [], and steps 2-4 keep stops == [] (dropping the key or a stop before a confirm is refused)");
    let first=nextLedger(prior,RAW,{role:"playerTwo",stop:10});
    for(const stops of [[360],[-1],[1.5],["12"],[10,20],[],[null]])await assertFails(write(dbB,RAW,{...first,stops}));
    {const {stops,...without}=first;await assertFails(write(dbB,RAW,without));}
    await assertFails(write(dbA,RAW,{...first,updatedByDeviceId:DA}));
    await assertSucceeds(write(dbB,RAW,first));
    prior=await stored(RAW);assert.deepEqual(prior.stops,[10]);
    ok("first confirm: one int 0..359 only (360, -1, 1.5, '12', two stops, none, missing key all refused)");
    const second=nextLedger(prior,RAW,{role:"playerOne",stop:300});
    for(const stops of [[11,300],[10],[10,360],[10,-5],[10,2.5],[10,"300"],[300,10]])await assertFails(write(dbA,RAW,{...second,stops}));
    await assertFails(write(dbB,RAW,{...nextLedger(prior,RAW,{role:"playerTwo",stop:300})}));
    await assertSucceeds(write(dbA,RAW,second));
    prior=await stored(RAW);assert.deepEqual(prior.stops,[10,300]);assert.equal(prior.phase,"SHOWDOWN_CONFIRMED");
    const after={...prior,revision:7,updatedAt:serverTimestamp(),stops:[10,301]};
    await assertFails(write(dbA,RAW,after));
    await assertFails(write(dbA,RAW,{...prior,updatedAt:serverTimestamp(),stops:[11,300]}));
    ok("second confirm keeps the first stop and adds one valid stop; the same manager cannot stop twice; nothing changes after revision 6");
    // Both phones rebuild the same clubs from the raw draw 2 ledger.
    const readA=await provider.read({user:{uid:A},firestore:dbA,firebaseSdk:sdk(),deviceId:DA,rivalryId:RAW,sessionId:S1,nowEpochMs:now,cryptoImpl:crypto.webcrypto});
    const readB=await provider.read({user:{uid:B},firestore:dbB,firebaseSdk:sdk(),deviceId:DB,rivalryId:RAW,sessionId:S1,nowEpochMs:now,cryptoImpl:crypto.webcrypto});
    assert.equal(readA.ok,true,JSON.stringify(readA));assert.deepEqual(readA.state,readB.state);
    assert.equal(readA.state.clubs.playerTwo,readA.state.candidates.playerTwo[0],"stop 10 = section 0");
    assert.equal(readA.state.clubs.playerOne,readA.state.candidates.playerOne[2],"stop 300 = section 2");
    ok("both managers rebuild the same candidates and clubs from the stored stops");

    // ---- Old shape (no stops): still valid end to end, can never gain the key -----------------------------------------
    prior=null;
    for(let step=1;step<=6;step+=1){
      const role=step===6?"playerTwo":"playerOne",db=role==="playerOne"?dbA:dbB;
      const next=nextLedger(prior,OLD,{role});
      // (At step 1 a create with stops == [] IS the draw 2 open, so the flip is tested from step 2 on.)
      if(step>=2)await assertFails(write(db,OLD,{...next,stops:step===5?[10]:step===6?[10,20]:[]}));
      await assertSucceeds(write(db,OLD,next));
      prior=await stored(OLD);assert.equal(Object.hasOwn(prior,"stops"),false);
    }
    const oldRead=await provider.read({user:{uid:A},firestore:dbA,firebaseSdk:sdk(),deviceId:DA,rivalryId:OLD,sessionId:S1,nowEpochMs:now,cryptoImpl:crypto.webcrypto});
    assert.equal(oldRead.ok,true,JSON.stringify(oldRead));assert.equal(Object.hasOwn(oldRead.state,"stops"),false);
    assert.ok(CATALOG[oldRead.state.leagueId].includes(oldRead.state.clubs.playerOne));
    ok("a ledger written the old way (15 keys) is accepted at every step, can never gain stops later, and replays to seeded clubs");

    // ---- Provider: draw 2 end to end, first tap wins ------------------------------------------------------------------
    const P=(db,uid,type,base,n,extra)=>provider.mutate(options(db,uid,PROV,now+n,type,base,op(1000+n),extra));
    let result=await P(dbA,A,"open",0,1,{draw:2});assert.equal(result.ok,true,JSON.stringify(result));assert.deepEqual((await stored(PROV)).stops,[]);
    assert.equal((await provider.mutate(options(dbA,A,PROV,now,"open",0,op(1001),{}))).code,"SETUP_IDEMPOTENCY_CONFLICT","the same open cannot be replayed as the old draw");
    result=await P(dbA,A,"commit-league",1,2);assert.equal(result.ok,true,JSON.stringify(result));
    result=await P(dbA,A,"commit-clubs",2,3);assert.equal(result.ok,true,JSON.stringify(result));
    const candidates=result.state.candidates;assert.equal(new Set([...candidates.playerOne,...candidates.playerTwo]).size,6);assert.equal(result.state.clubs,null);
    result=await P(dbA,A,"commit-length",3,4,{totalSeasons:5});assert.equal(result.ok,true,JSON.stringify(result));
    assert.equal((await P(dbA,A,"confirm",4,5,{})).code,"SETUP_DRAW_VERSION_MISMATCH","a draw 2 confirm without a stop is refused before any write");
    assert.equal((await P(dbA,A,"confirm",4,6,{stop:360})).code,"SETUP_STOP_INVALID");
    result=await P(dbA,A,"confirm",4,7,{stop:200});assert.equal(result.ok,true,JSON.stringify(result));assert.deepEqual(result.state.stops,[200]);
    const resent=await P(dbA,A,"confirm",4,7,{stop:200});assert.equal(resent.ok,true);assert.equal(resent.status,"replayed","resending the pending stop is idempotent");
    assert.equal((await P(dbA,A,"confirm",4,7,{stop:201})).code,"SETUP_IDEMPOTENCY_CONFLICT","the same operation can never carry another stop");
    assert.equal((await P(dbA,A,"confirm",5,8,{stop:15})).ok,false,"a second stop by the same manager is refused");
    result=await P(dbB,B,"confirm",5,9,{stop:119});assert.equal(result.ok,true,JSON.stringify(result));
    assert.equal(result.state.phase,"SHOWDOWN_CONFIRMED");
    assert.deepEqual(result.state.clubs,{playerOne:candidates.playerOne[1],playerTwo:candidates.playerTwo[0]});
    assert.deepEqual((await stored(PROV)).stops,[200,119]);
    ok("provider draw 2: candidates at commit-clubs, stop rides on the confirm, resend is idempotent, another stop on the same operation conflicts");
    // An old ledger refuses a stop at the adapter.
    const oldStop=await provider.mutate(options(dbB,B,OLD,now,"confirm",6,op(5000),{stop:20}));assert.equal(oldStop.ok,false);

    // ---- Both managers stop in the same moment -----------------------------------------------------------------------
    const R=(db,uid,type,base,n,extra)=>provider.mutate(options(db,uid,RACE,now+n,type,base,op(2000+n),extra));
    for(const [type,base,n,extra] of [["open",0,1,{draw:2}],["commit-league",1,2],["commit-clubs",2,3],["commit-length",3,4,{totalSeasons:1}]]){result=await R(dbA,A,type,base,n,extra);assert.equal(result.ok,true,JSON.stringify(result));}
    const [raceA,raceB]=await Promise.all([R(dbA,A,"confirm",4,10,{stop:44}),R(dbB,B,"confirm",4,11,{stop:333})]);
    const winner=raceA.ok?"A":"B";
    assert.equal([raceA.ok,raceB.ok].filter(Boolean).length,1,`exactly one of two simultaneous stops lands first (${JSON.stringify([raceA,raceB])})`);
    const loser=winner==="A"?raceB:raceA;assert.ok(["SETUP_STALE_BASE_REVISION","permission-denied","aborted"].includes(loser.code)||/STALE/.test(loser.code),loser.code);
    const retry=winner==="A"?await R(dbB,B,"confirm",5,11,{stop:333}):await R(dbA,A,"confirm",5,10,{stop:44});
    assert.equal(retry.ok,true,JSON.stringify(retry));
    const race=await stored(RACE);
    assert.deepEqual(race.stops,race.confirmedRoles.map(role=>role==="playerOne"?44:333),"each stop stays with its own manager, in confirm order");
    assert.equal(retry.state.clubs.playerOne,retry.state.candidates.playerOne[0]);assert.equal(retry.state.clubs.playerTwo,retry.state.candidates.playerTwo[2]);
    ok("two simultaneous stops: one lands, the other resends the SAME stop on the new base; stops stay aligned with confirmedRoles");

    process.stdout.write(`R94-02 club draw Rules emulator proof passed: ${checks} checks.\n`);
  }finally{await testEnv.cleanup();}
})().catch(error=>{console.error(error.stack||error);process.exit(1);});

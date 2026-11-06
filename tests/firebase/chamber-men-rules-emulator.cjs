"use strict";
// r88 Chamber Men (Nik 2026-11-02, turn by turn 2026-11-03) in the composed production Rules (firestore.spark.generated.rules).
// One shared round record per season, rivalries/{rid}/chamberMenRounds/season_N, written only by the two managers through
// js/chamberMenStep.js (the real step code runs here against the emulator). 14 kicks: Daniel shoots / Nik keeps, then Nik
// shoots / Daniel keeps, 7 times.
//   1. Each manager owns only his own pick string: one letter a kick (his shot on his kick, his dive on the rival's; L M R
//      or - for his own timeout).
//   2. A write adds exactly one letter to his own string and never changes what is there; the other string never moves.
//   3. Nobody runs ahead: a manager sends kick n+1 only once the other has sent kick n. At most 14 letters each.
//   4. No list, no delete; the record's id and season match; reads only for the two managers; the old two-letters-a-round
//      record (schemaVersion 1) is refused.
// The full 14 kicks then give the two roulette cylinders (js/chamberMen.js).
// Run inside the Firestore emulator:
//   npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-chamber-men \
//     "node tests/firebase/chamber-men-rules-emulator.cjs"
const assert=require("node:assert/strict");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,getDoc,setDoc,updateDoc,deleteDoc,getDocs,collection,serverTimestamp}=firestoreSdk;
const {initializeTestEnvironment}=require("@firebase/rules-unit-testing");
const Step=require("../../js/chamberMenStep.js");
const Engine=require("../../js/chamberMen.js");

const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const LIMIT=/maximum of 1000 expressions/;
const A="acct_chamber_rules_a",B="acct_chamber_rules_b",C="acct_chamber_rules_outsider";
const RID=`pair_${"8".repeat(64)}`;
const SID=`session_${"e".repeat(64)}`;
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`;

async function assertPlainDenial(promise,label){
  let error=null;
  try{await promise;}catch(caught){error=caught;}
  assert.ok(error,`${label}: must be refused`);
  assert.equal(error.code,"permission-denied",`${label}: expected permission-denied, got ${error.code}: ${error.message}`);
  assert.doesNotMatch(String(error.message||""),LIMIT,`${label}: refused by the Rules evaluation limit, not by the Rules`);
}
function account(id){return {objectType:"account",objectId:id,lifecycleState:"live",data:{status:"active"}};}
function device(id){return {objectType:"device",objectId:id,lifecycleState:"live",data:{deviceId:id,state:"active"}};}
function rivalryDoc(){return {objectType:"rivalry",objectId:RID,lifecycleState:"live",data:{connectionState:"active",authorizedAccountIds:[A,B],managerSlots:[
  {slotId:"playerOne",accountId:A,profileId:`profile_${"1".repeat(24)}`,saveId:`save_${"3".repeat(24)}`,entitlementState:"active"},
  {slotId:"playerTwo",accountId:B,profileId:`profile_${"2".repeat(24)}`,saveId:`save_${"4".repeat(24)}`,entitlementState:"active"}
]}};}
function sessionDoc(now){
  const createdAt=Timestamp.fromMillis(now-60_000),lastActivityAt=Timestamp.fromMillis(now-1_000),expiresAt=Timestamp.fromMillis(now+4*60*60*1000);
  return {schemaVersion:1,objectType:"session",objectId:SID,revision:1,parentRevision:0,lifecycleState:"live",contentHash:`sha256:${"0".repeat(64)}`,priorContentHash:`sha256:${"1".repeat(64)}`,updatedAt:lastActivityAt,updatedByAccountId:A,updatedByDeviceId:DA,data:{rivalryId:RID,state:"active",hostAccountId:A,memberAccountIds:[A,B],createdAt,expiresAt,lastActivityAt,revokedAt:null},tombstone:null};
}
const plainSdk=()=>({Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp});
const io=(db,deviceId)=>({firestore:db,sdk:plainSdk(),rivalryId:RID,sessionId:SID,deviceId,now:()=>Date.now()});
const ctx=(role,season=1)=>({rivalryId:RID,managerRole:role,season,confirmedAtMs:Date.now()});
const stamp=deviceId=>({activeSessionId:SID,updatedByDeviceId:deviceId,updatedAt:serverTimestamp()});
const fresh=(season,kicks,revision=1,schemaVersion=2)=>({schemaVersion,objectType:"sharedChamberMenRound",rivalryId:RID,seasonNumber:season,kicks,revision});

(async()=>{
  const checks=[];
  const env=await initializeTestEnvironment({projectId:"demo-cms-chamber-men-rules",firestore:{rules:RULES}});
  try{
    const now=Date.now();
    await env.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      await setDoc(doc(db,"accounts",A),account(A));await setDoc(doc(db,"accounts",B),account(B));
      await setDoc(doc(db,"accounts",A,"devices",DA),device(DA));await setDoc(doc(db,"accounts",B,"devices",DB),device(DB));
      await setDoc(doc(db,"rivalries",RID),rivalryDoc());await setDoc(doc(db,"rivalries",RID,"sessions",SID),sessionDoc(now));
    });
    const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore(),dbC=env.authenticatedContext(C).firestore();
    const ref=(db,season=1)=>doc(db,"rivalries",RID,"chamberMenRounds",typeof season==="number"?`season_${season}`:season);
    const read=async(season=1)=>{let data;await env.withSecurityRulesDisabled(async context=>{data=(await getDoc(ref(context.firestore(),season))).data();});return data;};

    // Creation.
    await assertPlainDenial(setDoc(ref(dbB),{...fresh(1,{playerOne:"L",playerTwo:""}),...stamp(DB)}),"Nik creates the round with Daniel's shot");
    await assertPlainDenial(setDoc(ref(dbA),{...fresh(1,{playerOne:"",playerTwo:""}),...stamp(DA)}),"a round created with no pick");
    await assertPlainDenial(setDoc(ref(dbA),{...fresh(1,{playerOne:"LR",playerTwo:""}),...stamp(DA)}),"a round created with two letters (a shot and a dive at once)");
    await assertPlainDenial(setDoc(ref(dbA),{...fresh(1,{playerOne:"X",playerTwo:""}),...stamp(DA)}),"a pick that is not L, M, R or -");
    await assertPlainDenial(setDoc(ref(dbA),{...fresh(1,{playerOne:"L",playerTwo:""},1,1),...stamp(DA)}),"the old two-letters-a-round record (schemaVersion 1)");
    await assertPlainDenial(setDoc(ref(dbA),{...fresh(1,{playerOne:"L",playerTwo:""}),activeSessionId:SID,updatedByDeviceId:DA,updatedAt:Timestamp.fromMillis(Date.now()-60_000)}),"a phone-clock updatedAt");
    await assertPlainDenial(setDoc(ref(dbA,2),{...fresh(3,{playerOne:"L",playerTwo:""}),...stamp(DA)}),"a record whose season does not match its id");
    await assertPlainDenial(setDoc(ref(dbA,"x"),{...fresh(1,{playerOne:"L",playerTwo:""}),...stamp(DA)}),"a record outside season_N");
    await assertPlainDenial(setDoc(ref(dbA),{...fresh(1,{playerOne:"L",playerTwo:""}),extra:true,...stamp(DA)}),"a record with an extra field");
    checks.push("a round is created only by its manager, with exactly one letter of his own, server time, a matching season, schemaVersion 2 and nothing else");
    // Kick 1: Daniel shoots, Nik keeps. Either may lock in first; here Daniel's shot creates the record.
    assert.equal(Engine.roleOn(1,"playerOne"),"shot");assert.equal(Engine.roleOn(1,"playerTwo"),"dive");
    const first=await Step.send(io(dbA,DA),ctx("playerOne"),"L",1);
    assert.equal(first.ok,true,`Daniel's shot on kick 1 (the step): ${JSON.stringify(first)}`);
    assert.deepEqual((await read()).kicks,{playerOne:"L",playerTwo:""});
    checks.push("Daniel's shot on kick 1 (the step) creates the record");

    // No running ahead, no rewriting, no touching the other string.
    // A late or repeated kick-1 send (a second tab, a transaction retry) is refused, never stored as kick 2 (Codex #1205).
    const repeat=await Step.send(io(dbA,DA),ctx("playerOne"),"M",1);
    assert.equal(repeat.ok,false);assert.equal(repeat.reason,"NOT_THIS_KICK");assert.deepEqual((await read()).kicks,{playerOne:"L",playerTwo:""});
    const ahead=await Step.send(io(dbA,DA),ctx("playerOne"),"M",2);
    assert.equal(ahead.ok,false);assert.equal(ahead.reason,"NOT_YOUR_KICK");
    await assertPlainDenial(updateDoc(ref(dbA),{"kicks.playerOne":"LM",revision:2,...stamp(DA)}),"Daniel dives on kick 2 before Nik's dive on kick 1 is in");
    checks.push("a manager cannot send kick n+1 before the other has sent kick n (step and Rules)");
    await assertPlainDenial(updateDoc(ref(dbA),{"kicks.playerTwo":"R",revision:2,...stamp(DA)}),"Daniel writes Nik's dive");
    await assertPlainDenial(updateDoc(ref(dbB),{"kicks.playerOne":"M",revision:2,...stamp(DB)}),"Nik rewrites Daniel's shot");
    await assertPlainDenial(updateDoc(ref(dbB),{"kicks.playerTwo":"RL",revision:2,...stamp(DB)}),"Nik sends his dive on kick 1 and his shot on kick 2 at once");
    await assertPlainDenial(updateDoc(ref(dbB),{"kicks.playerTwo":"R",revision:3,...stamp(DB)}),"a write that skips the revision");
    await assertPlainDenial(updateDoc(ref(dbB),{"kicks.playerTwo":"x",revision:2,...stamp(DB)}),"a bad letter");
    checks.push("a manager cannot write the other's picks, send two kicks at once, skip the revision or send a bad letter");
    const second=await Step.send(io(dbB,DB),ctx("playerTwo"),"R",1);
    assert.equal(second.ok,true,`Nik's dive on kick 1 (the step): ${JSON.stringify(second)}`);
    let kick1=Engine.kicksOf(Step.record(await read(),1));
    assert.equal(kick1.length,1);assert.deepEqual({shooter:kick1[0].shooter,shot:kick1[0].shotSide,dive:kick1[0].dive,goal:kick1[0].goal},{shooter:"playerOne",shot:"L",dive:"R",goal:true});
    await assertPlainDenial(updateDoc(ref(dbB),{"kicks.playerTwo":"ML",revision:3,...stamp(DB)}),"Nik changes his kick-1 dive while sending his kick-2 shot");
    checks.push("kick 1 is Daniel's shot against Nik's dive, and a sent letter is never changed");

    // The other 13 kicks, either manager locking in first, through the step; a timed-out shot or dive is "-".
    // Kick n: the shooter's letter is his shot, the keeper's his dive.
    const shots="LMRL-RMLLRMRM",dives="RMLMLRRLMRLR-";
    const sent={playerOne:1,playerTwo:1};
    for(let i=0;i<13;i+=1){
      const n=i+2,k=Engine.kick(n),order=i%3===0?[k.keeper,k.shooter]:[k.shooter,k.keeper];
      for(const role of order){
        sent[role]+=1;assert.equal(sent[role],n);
        const letter=role===k.shooter?shots[i]:dives[i];
        const result=await Step.send(io(role==="playerOne"?dbA:dbB,role==="playerOne"?DA:DB),ctx(role),letter,n);
        assert.equal(result.ok,true,`kick ${n} ${role} ${letter}: ${JSON.stringify(result)}`);
      }
    }
    const done=await read();
    assert.equal(done.kicks.playerOne.length,14);assert.equal(done.kicks.playerTwo.length,14);assert.equal(done.revision,28);
    checks.push("all 14 kicks go in through the step, one letter per write, either manager first, including a timed-out shot and dive");
    await assertPlainDenial(updateDoc(ref(dbA),{"kicks.playerOne":done.kicks.playerOne+"L",revision:29,...stamp(DA)}),"a 15th letter");
    checks.push("there is no 15th kick: 7 shots and 7 dives each");
    const record=Step.record(done,1),cylinders=Engine.cylinders(record),score=Engine.score(record),kicks=Engine.kicksOf(record);
    assert.deepEqual(kicks.map(k=>k.shooter),Array.from({length:14},(_,i)=>i%2?"playerTwo":"playerOne"),"Daniel, Nik, Daniel, ... (turn by turn)");
    for(const role of ["playerOne","playerTwo"])assert.equal(kicks.filter(k=>k.shooter===role).length,7,"exactly 7 shots each");
    assert.ok(cylinders&&Engine.validCylinder(cylinders.playerOne)&&Engine.validCylinder(cylinders.playerTwo));
    assert.equal(Engine.bullets(cylinders.playerOne),score.playerTwo,"Daniel's cylinder holds Nik's goals");
    assert.equal(Engine.bullets(cylinders.playerTwo),score.playerOne,"Nik's cylinder holds Daniel's goals");
    const fromRead=await Step.cylinders({...ctx("playerTwo"),rivalryId:RID},io(dbB,DB));
    assert.equal(fromRead.ok,true);assert.deepEqual(fromRead.chambers,cylinders);
    checks.push(`the record reads back as the two cylinders (Daniel ${score.playerOne} goals, Nik ${score.playerTwo}): each holds the rival's goals`);

    // Reads, list, delete.
    await assertPlainDenial(getDoc(ref(dbC)),"an outsider reads the round");
    await assertPlainDenial(getDocs(collection(dbA,"rivalries",RID,"chamberMenRounds")),"a manager lists the rounds");
    await assertPlainDenial(deleteDoc(ref(dbA)),"a manager deletes the round");
    assert.ok((await getDoc(ref(dbB))).exists(),"a manager reads the round");
    checks.push("only the two managers read the round; nobody lists or deletes it");

    // A second season starts clean, and the step refuses an unfinished one for the roulette.
    assert.equal((await Step.send(io(dbB,DB),ctx("playerTwo",2),"M",1)).ok,true,"Nik may lock in his kick-1 dive first in season 2");
    const unfinished=await Step.cylinders(ctx("playerOne",2),io(dbA,DA));
    assert.equal(unfinished.ok,false);assert.equal(unfinished.reason,"NOT_FINISHED");
    checks.push("each season has its own record, and the roulette never takes the cylinders of an unfinished shootout");

    // Both managers lock in at the same moment on every kick (both phones' transactions race on one record): the loser's
    // write is refused by the Rules against the record the winner just changed, and the step tries it once more on the
    // record as it is now. All 14 kicks go in, each letter once, in its own place.
    for(let n=1;n<=14;n+=1){
      const k=Engine.kick(n);
      const both=await Promise.all([Step.send(io(dbA,DA),ctx("playerOne",3),k.shooter==="playerOne"?"L":"M",n),Step.send(io(dbB,DB),ctx("playerTwo",3),k.shooter==="playerTwo"?"R":"M",n)]);
      assert.ok(both.every(r=>r.ok),`kick ${n} with both locking in at once: ${JSON.stringify(both)}`);
    }
    const raced=await read(3);
    assert.deepEqual(raced.kicks,{playerOne:"LM".repeat(7),playerTwo:"MR".repeat(7)});assert.equal(raced.revision,28);
    checks.push("both managers locking in at the same moment on every kick: every letter goes in once, in its own place (kick 1's double create included)");

    // Codex C2 (2.2.0): once the rival has locked in, a kick's clock runs from his lock-in on the server. A letter that lands
    // more than 16.6 s later (10 s clock, 4.6 s reveal, 2 s network) is the timeout '-' only: a side picked late is refused,
    // and the step (checking again inside its transaction) stores '-' instead. Before the rival locks in there is no clock.
    const seed=async(season,kicks,agoMs)=>env.withSecurityRulesDisabled(async context=>{await setDoc(ref(context.firestore(),season),{...fresh(season,kicks,kicks.playerOne.length+kicks.playerTwo.length),activeSessionId:SID,updatedByDeviceId:DA,updatedAt:Timestamp.fromMillis(Date.now()-agoMs)});});
    await seed(4,{playerOne:"L",playerTwo:""},20_000);
    await assertPlainDenial(updateDoc(ref(dbB,4),{"kicks.playerTwo":"R",revision:2,...stamp(DB)}),"Nik's dive lands 20 s after Daniel locked in");
    const lateSend=await Step.send(io(dbB,DB),ctx("playerTwo",4),"R",1);
    assert.equal(lateSend.ok,true,`the step's late send goes in as the timeout: ${JSON.stringify(lateSend)}`);
    assert.deepEqual((await read(4)).kicks,{playerOne:"L",playerTwo:"-"},"stored as '-', not the side picked late");
    await seed(5,{playerOne:"L",playerTwo:""},20_000);
    await updateDoc(ref(dbB,5),{"kicks.playerTwo":"-",revision:2,...stamp(DB)});
    checks.push("a pick that lands past the rival's lock-in + 16.6 s is the timeout '-': a late side is refused by the Rules, and the step stores '-'");
    await seed(6,{playerOne:"L",playerTwo:""},3_000);
    await updateDoc(ref(dbB,6),{"kicks.playerTwo":"R",revision:2,...stamp(DB)});
    const onTime=await Step.send(io(dbA,DA),ctx("playerOne",7),"M",1);assert.equal(onTime.ok,true);
    await seed(8,{playerOne:"L",playerTwo:"R"},60_000);
    await updateDoc(ref(dbB,8),{"kicks.playerTwo":"RL",revision:3,...stamp(DB)});
    assert.deepEqual((await read(8)).kicks,{playerOne:"L",playerTwo:"RL"});
    checks.push("in time (3 s after the rival) a side goes in; with no rival lock-in yet there is no clock, however old the record");
  }finally{await env.cleanup();}
  for(const [i,check] of checks.entries())console.log(`ok ${i+1} ${check}`);
  console.log(`PASS Chamber Men Rules emulator: ${checks.length} checks.`);
})().catch(error=>{console.error(error);process.exit(1);});

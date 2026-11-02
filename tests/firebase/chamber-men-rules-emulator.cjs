"use strict";
// r88 Chamber Men (Nik 2026-11-02) in the composed production Rules (firestore.spark.generated.rules).
// One shared round record per season, rivalries/{rid}/chamberMenRounds/season_N, written only by the two managers through
// js/chamberMenStep.js (the real step code runs here against the emulator):
//   1. Each manager owns only his own pick string (two letters a round: shot, dive; L M R or - for his own timeout).
//   2. A write adds exactly one round to his own string and never changes what is there; the other string never moves.
//   3. Nobody runs ahead: a manager sends round k+1 only once the other has sent round k. At most 7 rounds.
//   4. No list, no delete; the record's id and season match; reads only for the two managers.
// The full 7 rounds then give the two roulette cylinders (js/chamberMen.js).
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
const fresh=(season,kicks,revision=1)=>({schemaVersion:1,objectType:"sharedChamberMenRound",rivalryId:RID,seasonNumber:season,kicks,revision});

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
    await assertPlainDenial(setDoc(ref(dbB),{...fresh(1,{playerOne:"LR",playerTwo:""}),...stamp(DB)}),"Nik creates the round with Daniel's pick");
    await assertPlainDenial(setDoc(ref(dbA),{...fresh(1,{playerOne:"",playerTwo:""}),...stamp(DA)}),"a round created with no pick");
    await assertPlainDenial(setDoc(ref(dbA),{...fresh(1,{playerOne:"LRMM",playerTwo:""}),...stamp(DA)}),"a round created with two rounds");
    await assertPlainDenial(setDoc(ref(dbA),{...fresh(1,{playerOne:"LX",playerTwo:""}),...stamp(DA)}),"a pick that is not L, M, R or -");
    await assertPlainDenial(setDoc(ref(dbA),{...fresh(1,{playerOne:"LR",playerTwo:""}),activeSessionId:SID,updatedByDeviceId:DA,updatedAt:Timestamp.fromMillis(Date.now()-60_000)}),"a phone-clock updatedAt");
    await assertPlainDenial(setDoc(ref(dbA,2),{...fresh(3,{playerOne:"LR",playerTwo:""}),...stamp(DA)}),"a record whose season does not match its id");
    await assertPlainDenial(setDoc(ref(dbA,"x"),{...fresh(1,{playerOne:"LR",playerTwo:""}),...stamp(DA)}),"a record outside season_N");
    await assertPlainDenial(setDoc(ref(dbA),{...fresh(1,{playerOne:"LR",playerTwo:""}),extra:true,...stamp(DA)}),"a record with an extra field");
    checks.push("a round is created only by its manager, with exactly his own first round, server time, a matching season and nothing else");
    const first=await Step.send(io(dbA,DA),ctx("playerOne"),"LR",1);
    assert.equal(first.ok,true,`Daniel's first round (the step): ${JSON.stringify(first)}`);
    assert.deepEqual((await read()).kicks,{playerOne:"LR",playerTwo:""});
    checks.push("Daniel's first round (the step) creates the record");

    // No running ahead, no rewriting, no touching the other string.
    // A late or repeated round-1 send (a second tab, a transaction retry) is refused, never stored as round 2 (Codex #1205).
    const repeat=await Step.send(io(dbA,DA),ctx("playerOne"),"MM",1);
    assert.equal(repeat.ok,false);assert.equal(repeat.reason,"NOT_THIS_ROUND");assert.deepEqual((await read()).kicks,{playerOne:"LR",playerTwo:""});
    const ahead=await Step.send(io(dbA,DA),ctx("playerOne"),"MM",2);
    assert.equal(ahead.ok,false);assert.equal(ahead.reason,"NOT_YOUR_ROUND");
    await assertPlainDenial(updateDoc(ref(dbA),{"kicks.playerOne":"LRMM",revision:2,...stamp(DA)}),"Daniel sends round 2 before Nik sent round 1");
    checks.push("a manager cannot send round k+1 before the other has sent round k (step and Rules)");
    await assertPlainDenial(updateDoc(ref(dbA),{"kicks.playerTwo":"RL",revision:2,...stamp(DA)}),"Daniel writes Nik's pick");
    await assertPlainDenial(updateDoc(ref(dbB),{"kicks.playerOne":"MM",revision:2,...stamp(DB)}),"Nik rewrites Daniel's pick");
    await assertPlainDenial(updateDoc(ref(dbB),{"kicks.playerTwo":"RLRL",revision:2,...stamp(DB)}),"Nik sends two rounds at once");
    await assertPlainDenial(updateDoc(ref(dbB),{"kicks.playerTwo":"RL",revision:3,...stamp(DB)}),"a write that skips the revision");
    await assertPlainDenial(updateDoc(ref(dbB),{"kicks.playerTwo":"Rx",revision:2,...stamp(DB)}),"a bad letter");
    checks.push("a manager cannot write the other's picks, send two rounds at once, skip the revision or send a bad letter");
    const second=await Step.send(io(dbB,DB),ctx("playerTwo"),"RL",1);
    assert.equal(second.ok,true,`Nik's first round (the step): ${JSON.stringify(second)}`);
    await assertPlainDenial(updateDoc(ref(dbB),{"kicks.playerTwo":"MMLL",revision:3,...stamp(DB)}),"Nik changes his round 1 while sending round 2");
    checks.push("a sent round is never changed");

    // The other 6 rounds, in either order, through the step; a timed-out round is "--".
    const plan=[["playerTwo","LM"],["playerOne","RR"],["playerOne","--"],["playerTwo","MR"],["playerOne","ML"],["playerTwo","RR"],["playerTwo","LL"],["playerOne","LM"],["playerOne","RM"],["playerTwo","MM"],["playerTwo","R-"],["playerOne","LR"]];
    const sent={playerOne:1,playerTwo:1};
    for(const [role,pick] of plan){
      sent[role]+=1;
      const result=await Step.send(io(role==="playerOne"?dbA:dbB,role==="playerOne"?DA:DB),ctx(role),pick,sent[role]);
      assert.equal(result.ok,true,`${role} ${pick}: ${JSON.stringify(result)}`);
    }
    const done=await read();
    assert.equal(done.kicks.playerOne.length,14);assert.equal(done.kicks.playerTwo.length,14);assert.equal(done.revision,14);
    checks.push("all 7 rounds both ways go in through the step, one round per write, including a timed-out round");
    await assertPlainDenial(updateDoc(ref(dbA),{"kicks.playerOne":done.kicks.playerOne+"LR",revision:15,...stamp(DA)}),"an 8th round");
    checks.push("there is no 8th round");
    const record=Step.record(done,1),cylinders=Engine.cylinders(record),score=Engine.score(record);
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
    assert.equal((await Step.send(io(dbB,DB),ctx("playerTwo",2),"ML",1)).ok,true,"Nik may start season 2 first");
    const unfinished=await Step.cylinders(ctx("playerOne",2),io(dbA,DA));
    assert.equal(unfinished.ok,false);assert.equal(unfinished.reason,"NOT_FINISHED");
    checks.push("each season has its own record, and the roulette never takes the cylinders of an unfinished shootout");
  }finally{await env.cleanup();}
  for(const [i,check] of checks.entries())console.log(`ok ${i+1} ${check}`);
  console.log(`PASS Chamber Men Rules emulator: ${checks.length} checks.`);
})().catch(error=>{console.error(error);process.exit(1);});

"use strict";

const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,getDoc,setDoc}=firestoreSdk;
const {initializeTestEnvironment}=require("@firebase/rules-unit-testing");

global.window=globalThis;
require("../../data/transferOptions.js");
const provider=require("../../js/sparkSharedTransferChallenge.js");

const PROJECT_ID="demo-career-mode-showdown-transfer-fresh-session";
const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const A="acct_transfer_a",B="acct_transfer_b";
const R=`pair_${"a".repeat(64)}`;
const OLD=`session_${"1".repeat(64)}`,FRESH=`session_${"2".repeat(64)}`;
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`;
const PA=`profile_${"1".repeat(24)}`,PB=`profile_${"2".repeat(24)}`;
const SA=`save_${"1".repeat(24)}`,SB=`save_${"2".repeat(24)}`;
const OP1=`transfer_op_${"1".repeat(32)}`,OP2=`transfer_op_${"2".repeat(32)}`,OP3=`transfer_op_${"3".repeat(32)}`,OP4=`transfer_op_${"4".repeat(32)}`;
const HASH=`sha256:${"a".repeat(64)}`;

function sdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp:firestoreSdk.serverTimestamp};}
function account(id){return {objectType:"account",objectId:id,lifecycleState:"live",data:{status:"active"}};}
function device(id){return {objectType:"device",objectId:id,lifecycleState:"live",data:{deviceId:id,state:"active"}};}
function rivalry(){return {objectType:"rivalry",objectId:R,lifecycleState:"live",data:{connectionState:"active",authorizedAccountIds:[A,B],managerSlots:[
  {slotId:"playerOne",accountId:A,profileId:PA,saveId:SA,entitlementState:"active"},
  {slotId:"playerTwo",accountId:B,profileId:PB,saveId:SB,entitlementState:"active"}
]}};}
function session(now){
  const createdAt=Timestamp.fromMillis(now-60_000),expiresAt=Timestamp.fromMillis(now+4*60*60*1000),lastActivityAt=Timestamp.fromMillis(now-1000);
  return {schemaVersion:1,objectType:"session",objectId:FRESH,revision:1,parentRevision:0,lifecycleState:"live",contentHash:`sha256:${"0".repeat(64)}`,priorContentHash:`sha256:${"1".repeat(64)}`,updatedAt:lastActivityAt,updatedByAccountId:A,updatedByDeviceId:DA,data:{rivalryId:R,state:"active",hostAccountId:A,memberAccountIds:[A,B],createdAt,expiresAt,lastActivityAt,revokedAt:null},tombstone:null};
}
function setup(){return {schemaVersion:1,objectType:"sharedSetupLedger",rivalryId:R,revision:6,phase:"SHOWDOWN_CONFIRMED",coordinatorRole:"playerOne",leagueId:"bundesliga",clubs:{playerOne:"SC Freiburg",playerTwo:"Hertha BSC"},totalSeasons:1,confirmedRoles:["playerOne","playerTwo"]};}
function career(){return {schemaVersion:1,objectType:"sharedCareerStart",rivalryId:R,setupRevision:6,totalSeasons:1,revision:2,phase:"CAREER_START_READY",acknowledgedRoles:["playerOne","playerTwo"]};}
function transferLedger(activeSessionId,startedAt,now){return {schemaVersion:1,objectType:"sharedTransferChallenge",rivalryId:R,seasonNumber:1,runtimeRevision:"1.9.1-r8",coordinatorRole:"playerOne",phase:"WINDOW_OPEN",revision:1,startedAt,endedAt:null,endRequestedRoles:[],guessLockedRoles:[],signingLockedRoles:[],operationIds:[OP1],operationTypes:["start-window"],operationHashes:[HASH],baseRevisions:[0],actorRoles:["playerOne"],activeSessionId,updatedAt:Timestamp.fromMillis(now-16*60*1000),updatedByDeviceId:DA};}

(async()=>{
  const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    const now=Date.now(),startedSeconds=Math.floor((now-16*60*1000)/1000),startedNanos=123456000;
    const startedAt=new Timestamp(startedSeconds,startedNanos);
    await env.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      await setDoc(doc(db,"accounts",A),account(A));
      await setDoc(doc(db,"accounts",B),account(B));
      await setDoc(doc(db,"accounts",A,"devices",DA),device(DA));
      await setDoc(doc(db,"accounts",B,"devices",DB),device(DB));
      await setDoc(doc(db,"rivalries",R),rivalry());
      await setDoc(doc(db,"rivalries",R,"sessions",FRESH),session(now));
      await setDoc(doc(db,"rivalries",R,"sharedSetup","authoritative"),setup());
      await setDoc(doc(db,"rivalries",R,"careerStart","authoritative"),career());
      await setDoc(doc(db,"rivalries",R,"transferChallenges","season_1"),transferLedger(OLD,startedAt,now));
    });

    const dbB=env.authenticatedContext(B).firestore();
    const providerOptions={user:{uid:B},firestore:dbB,firebaseSdk:sdk(),rivalryId:R,sessionId:FRESH,deviceId:DB,seasonNumber:1,cryptoImpl:crypto.webcrypto,nowEpochMs:now};

    const preflight=await provider.read(providerOptions);
    assert.equal(preflight.ok,true,`Fresh ACTIVE session must read the existing Transfer Challenge before any mutation: ${JSON.stringify(preflight)}`);
    assert.equal(preflight.state.phase,"WINDOW_OPEN");

    await env.withSecurityRulesDisabled(async context=>{
      await setDoc(doc(context.firestore(),"rivalries",R,"transferChallenges","season_1"),transferLedger(FRESH,startedAt,now));
    });
    const sameSessionProbe=await provider.requestEndWindow({...providerOptions,operationId:OP2,baseRevision:1});
    assert.equal(sameSessionProbe.ok,true,`Transfer update under its already-current ACTIVE session must be accepted: ${JSON.stringify(sameSessionProbe)}`);

    await env.withSecurityRulesDisabled(async context=>{
      await setDoc(doc(context.firestore(),"rivalries",R,"transferChallenges","season_1"),transferLedger(OLD,startedAt,now));
    });
    const migrationProbe=await provider.requestEndWindow({...providerOptions,operationId:OP3,baseRevision:1});
    assert.equal(migrationProbe.ok,true,`Fresh ACTIVE session must be allowed to take over Transfer authority on a non-timeout write: ${JSON.stringify(migrationProbe)}`);
    assert.equal(migrationProbe.state.phase,"WINDOW_OPEN");

    await env.withSecurityRulesDisabled(async context=>{
      await setDoc(doc(context.firestore(),"rivalries",R,"transferChallenges","season_1"),transferLedger(OLD,startedAt,now));
    });

    const result=await provider.advanceExpiredWindow({...providerOptions,operationId:OP4,baseRevision:1});
    assert.equal(result.ok,true,JSON.stringify(result));
    assert.equal(result.state.phase,"GUESS_ENTRY");
    assert.equal(result.revision,2);

    const stored=(await getDoc(doc(dbB,"rivalries",R,"transferChallenges","season_1"))).data();
    assert.equal(stored.activeSessionId,FRESH,"Fresh exact session must take over transfer authority without resetting the challenge.");
    assert.equal(stored.startedAt.seconds,startedAt.seconds,"startedAt seconds must remain byte-equivalent across a fresh-session update.");
    assert.equal(stored.startedAt.nanoseconds,startedAt.nanoseconds,"startedAt nanoseconds must remain exact across a fresh-session update.");
    const endedAtMs=stored.endedAt.toMillis();
    assert.ok(endedAtMs>=startedAt.toMillis()+15*60*1000,"timeout transition must never occur before the authoritative 15-minute deadline.");
    assert.ok(endedAtMs<=Date.now()+5000,"timeout endedAt must be the Firestore request/server time, not an invented future value.");

    process.stdout.write("PASS Shared Transfer fresh-session expiry emulator: fresh-session read + authority migration both succeed, then an old-session WINDOW_OPEN at 00:00 advances under the fresh ACTIVE session, preserves exact startedAt, writes timeout completion at server request time, and reaches GUESS_ENTRY without redraw or reset.\\n");
  }finally{await env.cleanup();}
})().catch(error=>{console.error(error.stack||error);process.exit(1);});

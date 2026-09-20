"use strict";

const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,setDoc,serverTimestamp}=firestoreSdk;
const {initializeTestEnvironment}=require("@firebase/rules-unit-testing");

global.window=globalThis;
require("../../data/transferOptions.js");
const Provider=require("../../js/sparkSharedTransferChallenge.js");

const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const TARGET="allow update: if ssjrTransferValidUpdate(rivalryId, transferId);";
const A="acct_diag_a",B="acct_diag_b";
const R=`pair_${"d".repeat(64)}`,S=`session_${"e".repeat(64)}`;
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`;
const PA=`profile_${"1".repeat(24)}`,PB=`profile_${"2".repeat(24)}`;
const SA=`save_${"3".repeat(24)}`,SB=`save_${"4".repeat(24)}`;
const OP1=`transfer_op_${"1".repeat(32)}`,OP2=`transfer_op_${"2".repeat(32)}`;
const HASH=`sha256:${"a".repeat(64)}`;

function sdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp};}
function account(id){return {objectType:"account",objectId:id,lifecycleState:"live",data:{status:"active"}};}
function device(id){return {objectType:"device",objectId:id,lifecycleState:"live",data:{deviceId:id,state:"active"}};}
function rivalry(){return {objectType:"rivalry",objectId:R,lifecycleState:"live",data:{connectionState:"active",authorizedAccountIds:[A,B],managerSlots:[
  {slotId:"playerOne",accountId:A,profileId:PA,saveId:SA,entitlementState:"active"},
  {slotId:"playerTwo",accountId:B,profileId:PB,saveId:SB,entitlementState:"active"}
]}};}
function session(now){const createdAt=Timestamp.fromMillis(now-60_000),lastActivityAt=Timestamp.fromMillis(now-1000),expiresAt=Timestamp.fromMillis(now+4*60*60*1000);return {schemaVersion:1,objectType:"session",objectId:S,revision:1,parentRevision:0,lifecycleState:"live",contentHash:`sha256:${"0".repeat(64)}`,priorContentHash:`sha256:${"1".repeat(64)}`,updatedAt:lastActivityAt,updatedByAccountId:A,updatedByDeviceId:DA,data:{rivalryId:R,state:"active",hostAccountId:A,memberAccountIds:[A,B],createdAt,expiresAt,lastActivityAt,revokedAt:null},tombstone:null};}
function setup(){return {schemaVersion:1,objectType:"sharedSetupLedger",rivalryId:R,revision:6,phase:"SHOWDOWN_CONFIRMED",coordinatorRole:"playerOne",leagueId:"bundesliga",clubs:{playerOne:"SC Freiburg",playerTwo:"Hertha BSC"},totalSeasons:3,confirmedRoles:["playerOne","playerTwo"]};}
function career(){return {schemaVersion:1,objectType:"sharedCareerStart",rivalryId:R,setupRevision:6,totalSeasons:3,revision:2,phase:"CAREER_START_READY",acknowledgedRoles:["playerOne","playerTwo"]};}
function transfer(startedAt,now){return {schemaVersion:1,objectType:"sharedTransferChallenge",rivalryId:R,seasonNumber:1,runtimeRevision:"1.9.1-r8",coordinatorRole:"playerOne",phase:"WINDOW_OPEN",revision:1,startedAt,endedAt:null,endRequestedRoles:[],guessLockedRoles:[],signingLockedRoles:[],operationIds:[OP1],operationTypes:["start-window"],operationHashes:[HASH],baseRevisions:[0],actorRoles:["playerOne"],activeSessionId:S,updatedAt:Timestamp.fromMillis(now-60_000),updatedByDeviceId:DA};}

async function runVariant(index,label,expression){
  const rules=RULES.replace(TARGET,`allow update: if ${expression};`);
  if(rules===RULES)throw new Error("Transfer update rule target was not found.");
  const env=await initializeTestEnvironment({projectId:`demo-cms17-transfer-diag-${index}`,firestore:{rules}});
  try{
    const now=Date.now(),startedAt=Timestamp.fromMillis(now-5*60*1000);
    await env.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      await setDoc(doc(db,"accounts",A),account(A));await setDoc(doc(db,"accounts",B),account(B));
      await setDoc(doc(db,"accounts",A,"devices",DA),device(DA));await setDoc(doc(db,"accounts",B,"devices",DB),device(DB));
      await setDoc(doc(db,"rivalries",R),rivalry());await setDoc(doc(db,"rivalries",R,"sessions",S),session(now));
      await setDoc(doc(db,"rivalries",R,"sharedSetup","authoritative"),setup());
      await setDoc(doc(db,"rivalries",R,"careerStart","authoritative"),career());
      await setDoc(doc(db,"rivalries",R,"transferChallenges","season_1"),transfer(startedAt,now));
    });
    const db=env.authenticatedContext(B).firestore();
    const read=await Provider.read({user:{uid:B},firestore:db,firebaseSdk:sdk(),rivalryId:R,sessionId:S,deviceId:DB,seasonNumber:1,cryptoImpl:crypto.webcrypto,nowEpochMs:now});
    const result=await Provider.requestEndWindow({user:{uid:B},firestore:db,firebaseSdk:sdk(),rivalryId:R,sessionId:S,deviceId:DB,seasonNumber:1,cryptoImpl:crypto.webcrypto,nowEpochMs:now,operationId:OP2,baseRevision:1});
    process.stdout.write(`TRANSFER_RULE_DIAG ${label} read=${read.ok?"PASS":"FAIL:"+read.code} update=${result.ok?"PASS":"FAIL:"+result.code}\n`);
    return result.ok===true;
  }finally{await env.cleanup();}
}

(async()=>{
  const variants=[
    ["ALLOW_TRUE","true"],
    ["AUTHORITY","ssjrWriteAuthorityValid(rivalryId, request.resource.data.updatedByDeviceId, request.resource.data.activeSessionId)"],
    ["NEW_OPERATION_ONLY","ssjrTransferNewOperationValid(resource.data, request.resource.data)"],
    ["PREFIX","ssjrTransferPublicPrefixPreserved(resource.data, request.resource.data)"],
    ["TRANSITION","ssjrTransferEndRequestTransition(resource.data, request.resource.data, ssjrActorRole(rivalryId))"],
    ["ACTUAL","ssjrTransferValidUpdate(rivalryId, transferId) && true"]
  ];
  for(let i=0;i<variants.length;i++)await runVariant(i+1,variants[i][0],variants[i][1]);
})().catch(error=>{console.error(error.stack||error);process.exit(1);});

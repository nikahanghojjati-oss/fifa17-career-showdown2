"use strict";

const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,setDoc,serverTimestamp}=firestoreSdk;
const {initializeTestEnvironment}=require("@firebase/rules-unit-testing");

global.window=globalThis;
require("../../data/transferOptions.js");

const Setup=require("../../js/sparkSharedShowdownSetup.js");
const Career=require("../../js/sparkSharedCareerStart.js");
const Transfer=require("../../js/sparkSharedTransferChallenge.js");
const Results=require("../../js/sparkSharedSeasonResults.js");

const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const PUBLIC_TARGET="allow create: if ssjrResultsValidCreate(rivalryId, seasonId);";
const PRIVATE_TARGET="allow create: if ssjrResultsPrivateCreateValid(rivalryId, seasonId, managerRole);";
const A="acct_results_diag_a",B="acct_results_diag_b";
const R=`pair_${"c".repeat(64)}`;
const S=`session_${"d".repeat(64)}`;
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`;
const PA=`profile_${"1".repeat(24)}`,PB=`profile_${"2".repeat(24)}`;
const SA=`save_${"3".repeat(24)}`,SB=`save_${"4".repeat(24)}`;

function sdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp};}
function account(id){return {objectType:"account",objectId:id,lifecycleState:"live",data:{status:"active"}};}
function device(id){return {objectType:"device",objectId:id,lifecycleState:"live",data:{deviceId:id,state:"active"}};}
function slots(){return [
  {slotId:"playerOne",accountId:A,profileId:PA,saveId:SA,entitlementState:"active"},
  {slotId:"playerTwo",accountId:B,profileId:PB,saveId:SB,entitlementState:"active"}
];}
function rivalry(){return {objectType:"rivalry",objectId:R,lifecycleState:"live",data:{connectionState:"active",authorizedAccountIds:[A,B],managerSlots:slots()}};}
function session(now){
  const createdAt=Timestamp.fromMillis(now-60_000),lastActivityAt=Timestamp.fromMillis(now-1_000),expiresAt=Timestamp.fromMillis(now+4*60*60*1000);
  return {schemaVersion:1,objectType:"session",objectId:S,revision:1,parentRevision:0,lifecycleState:"live",contentHash:`sha256:${"0".repeat(64)}`,priorContentHash:`sha256:${"1".repeat(64)}`,updatedAt:lastActivityAt,updatedByAccountId:A,updatedByDeviceId:DA,data:{rivalryId:R,state:"active",hostAccountId:A,memberAccountIds:[A,B],createdAt,expiresAt,lastActivityAt,revokedAt:null},tombstone:null};
}
function op(prefix,n){return prefix+Number(n).toString(16).padStart(32,"0");}
function base(db,uid,deviceId,now){return {user:{uid},firestore:db,firebaseSdk:sdk(),rivalryId:R,sessionId:S,deviceId,nowEpochMs:now,cryptoImpl:crypto.webcrypto};}
function result(){return {leaguePosition:1,leaguePoints:94,leagueGoals:92,domesticCup:true,championsLeague:false,topScorer:true,topAssist:false};}

async function prepare(env,now){
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    await setDoc(doc(db,"accounts",A),account(A));
    await setDoc(doc(db,"accounts",B),account(B));
    await setDoc(doc(db,"accounts",A,"devices",DA),device(DA));
    await setDoc(doc(db,"accounts",B,"devices",DB),device(DB));
    await setDoc(doc(db,"rivalries",R),rivalry());
    await setDoc(doc(db,"rivalries",R,"sessions",S),session(now));
  });
  const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
  const a=t=>base(dbA,A,DA,now+t),b=t=>base(dbB,B,DB,now+t);
  for(const [type,baseRevision,n,extra] of [
    ["open",0,1,{}],
    ["commit-league",1,2,{}],
    ["commit-clubs",2,3,{}],
    ["commit-length",3,4,{totalSeasons:3}]
  ]){
    const value=await Setup.mutate({...a(n*10),type,baseRevision,operationId:op("setup_op_",n),...extra});
    if(!value.ok)throw new Error(`setup ${type} failed: ${JSON.stringify(value)}`);
  }
  let value=await Setup.mutate({...a(50),type:"confirm",baseRevision:4,operationId:op("setup_op_",5)});
  if(!value.ok)throw new Error(`setup confirm A failed: ${JSON.stringify(value)}`);
  value=await Setup.mutate({...b(60),type:"confirm",baseRevision:5,operationId:op("setup_op_",6)});
  if(!value.ok)throw new Error(`setup confirm B failed: ${JSON.stringify(value)}`);
  value=await Career.acknowledge({...a(70),operationId:op("career_start_op_",1),baseRevision:0});
  if(!value.ok)throw new Error(`career A failed: ${JSON.stringify(value)}`);
  value=await Career.acknowledge({...b(80),operationId:op("career_start_op_",2),baseRevision:1});
  if(!value.ok)throw new Error(`career B failed: ${JSON.stringify(value)}`);
  value=await Transfer.startWindow({...a(100),seasonNumber:1,operationId:op("transfer_op_",11),baseRevision:0});
  if(!value.ok)throw new Error(`transfer start failed: ${JSON.stringify(value)}`);
  value=await Transfer.requestEndWindow({...a(200),seasonNumber:1,operationId:op("transfer_op_",12),baseRevision:1});
  if(!value.ok)throw new Error(`transfer end A failed: ${JSON.stringify(value)}`);
  value=await Transfer.requestEndWindow({...b(300),seasonNumber:1,operationId:op("transfer_op_",13),baseRevision:2});
  if(!value.ok)throw new Error(`transfer end B failed: ${JSON.stringify(value)}`);
  value=await Transfer.lockGuesses({...a(400),seasonNumber:1,operationId:op("transfer_op_",14),baseRevision:3,guesses:[
    {slot:1,type:"league",valueId:"england-premier-league"},
    {slot:2,type:"nationality",valueId:"brazil"}
  ]});
  if(!value.ok)throw new Error(`guess A failed: ${JSON.stringify(value)}`);
  value=await Transfer.lockGuesses({...b(500),seasonNumber:1,operationId:op("transfer_op_",15),baseRevision:4,guesses:[
    {slot:1,type:"league",valueId:"spain-primera-division"},
    {slot:2,type:"nationality",valueId:"germany"}
  ]});
  if(!value.ok)throw new Error(`guess B failed: ${JSON.stringify(value)}`);
  value=await Transfer.lockSignings({...a(600),seasonNumber:1,operationId:op("transfer_op_",16),baseRevision:5,signings:[
    {slot:1,name:"Daniel Diagnostic",leagueId:"spain-primera-division",nationalityId:"england"}
  ]});
  if(!value.ok)throw new Error(`signing A failed: ${JSON.stringify(value)}`);
  value=await Transfer.lockSignings({...b(700),seasonNumber:1,operationId:op("transfer_op_",17),baseRevision:6,signings:[
    {slot:1,name:"Nik Diagnostic",leagueId:"england-premier-league",nationalityId:"brazil"}
  ]});
  if(!value.ok)throw new Error(`signing B failed: ${JSON.stringify(value)}`);
  return {dbA,a};
}

async function runVariant(index,label,publicExpression,privateExpression){
  let rules=RULES.replace(PUBLIC_TARGET,`allow create: if ${publicExpression};`);
  rules=rules.replace(PRIVATE_TARGET,`allow create: if ${privateExpression};`);
  if(!rules.includes(`allow create: if ${publicExpression};`)||!rules.includes(`allow create: if ${privateExpression};`))throw new Error("Season Results diagnostic rule targets were not found.");
  const env=await initializeTestEnvironment({projectId:`demo-cms17-results-diag-${index}`,firestore:{rules}});
  try{
    const now=Date.now(),{dbA}=await prepare(env,now);
    const published=await Results.publishResult({...base(dbA,A,DA,now+800),seasonNumber:1,operationId:op("season_result_op_",11),baseRevision:0,result:result()});
    process.stdout.write(`SEASON_RESULTS_RULE_DIAG ${label} publish=${published.ok?"PASS":"FAIL:"+published.code}\n`);
    return published.ok===true;
  }finally{await env.cleanup();}
}

(async()=>{
  const actor="ssjrActorRole(rivalryId)";
  const publicShape="ssjrResultsPublicShape(request.resource.data, rivalryId, seasonId)";
  const publicCore=`${publicShape}
    && request.resource.data.revision == 1
    && request.resource.data.phase == 'COLLECTING'
    && request.resource.data.publishedRoles.size() == 1
    && request.resource.data.publishedRoles[0] == ${actor}
    && ssjrResultsValidOperationId(request.resource.data.operationIds[0])
    && ssjrResultsValidHash(request.resource.data.operationHashes[0])
    && request.resource.data.baseRevisions[0] == 0
    && request.resource.data.actorRoles[0] == ${actor}`;
  const publicLink=`ssjrResultsPrivateLinked(rivalryId, seasonId, request.resource.data, ${actor})`;
  const privateBase="ssjrResultsPrivateBase(request.resource.data, rivalryId, seasonId, managerRole)";
  const publicAfter="getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonResults/$(seasonId)).data";
  const privateLink=`${publicAfter}.operationIds[0] == request.resource.data.operationId
    && ${publicAfter}.actorRoles[0] == managerRole
    && ${publicAfter}.publishedRoles[0] == managerRole
    && ${publicAfter}.activeSessionId == request.resource.data.activeSessionId
    && ${publicAfter}.updatedByDeviceId == request.resource.data.updatedByDeviceId
    && ${publicAfter}.updatedAt == request.time`;
  const variants=[
    ["ALLOW_BOTH","true","true"],
    ["PUBLIC_TRUE_PRIVATE_ACTUAL","true","ssjrResultsPrivateCreateValid(rivalryId, seasonId, managerRole)"],
    ["PUBLIC_ACTUAL_PRIVATE_TRUE","ssjrResultsValidCreate(rivalryId, seasonId)","true"],
    ["PUBLIC_SHAPE_PRIVATE_TRUE",publicShape,"true"],
    ["PUBLIC_CORE_NO_LINK_PRIVATE_TRUE",publicCore,"true"],
    ["PUBLIC_LINK_ONLY_PRIVATE_TRUE",publicLink,"true"],
    ["PUBLIC_TRUE_PRIVATE_BASE","true",privateBase],
    ["PUBLIC_TRUE_PRIVATE_LINK", "true", privateLink],
    ["ACTUAL","ssjrResultsValidCreate(rivalryId, seasonId)","ssjrResultsPrivateCreateValid(rivalryId, seasonId, managerRole)"]
  ];
  for(let i=0;i<variants.length;i++)await runVariant(i+1,variants[i][0],variants[i][1],variants[i][2]);
})().catch(error=>{console.error(error.stack||error);process.exit(1);});

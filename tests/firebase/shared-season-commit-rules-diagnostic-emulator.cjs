"use strict";

const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,setDoc,serverTimestamp}=firestoreSdk;
const {initializeTestEnvironment}=require("@firebase/rules-unit-testing");
const Commit=require("../../js/sparkSharedSeasonCommit.js");

// Audit R84 F02 (r85): ssjrCommitShape and its three helpers were never called by production Rules and are removed from the
// fragment. This diagnostic still measures those sub-expressions, so it injects the exact removed text into its own copy of
// the Rules only (never into the deployed artifact).
const DIAGNOSTIC_ONLY_COMMIT_HELPERS=String.raw`    function ssjrCommitResultsReady(rivalryId, seasonId, seasonNumber) {
      let setup = ssjrCommitSetup(rivalryId);
      let public = ssjrCommitPublicResults(rivalryId, seasonId);
      let p1 = ssjrCommitPrivateResult(rivalryId, seasonId, 'playerOne');
      let p2 = ssjrCommitPrivateResult(rivalryId, seasonId, 'playerTwo');
      let teamCount = public.teamCount;
      return teamCount in [18,20]
        && setup.schemaVersion == 1
        && setup.objectType == 'sharedSetupLedger'
        && setup.rivalryId == rivalryId
        && setup.revision == 6
        && setup.phase == 'SHOWDOWN_CONFIRMED'
        && (setup.coordinatorRole == 'playerOne' || setup.coordinatorRole == 'playerTwo')
        && setup.totalSeasons in [1,3,5,10]
        && seasonNumber >= 1
        && seasonNumber <= setup.totalSeasons
        && public.schemaVersion == 1
        && public.objectType == 'sharedSeasonResults'
        && public.rivalryId == rivalryId
        && public.seasonNumber == seasonNumber
        && public.runtimeRevision == '1.9.1-r9'
        && public.phase == 'RESULTS_READY'
        && public.revision == 2
        && public.publishedRoles is list
        && public.publishedRoles.size() == 2
        && public.actorRoles is list
        && public.actorRoles.size() == 2
        && public.operationIds is list
        && public.operationIds.size() == 2
        && public.baseRevisions is list
        && public.baseRevisions.size() == 2
        && public.baseRevisions[0] == 0
        && public.baseRevisions[1] == 1
        && public.actorRoles[0] == public.publishedRoles[0]
        && public.actorRoles[1] == public.publishedRoles[1]
        && public.actorRoles[0] != public.actorRoles[1]
        && ssjrCommitValidRole(public.actorRoles[0])
        && ssjrCommitValidRole(public.actorRoles[1])
        && p1.schemaVersion == 1
        && p1.objectType == 'sharedSeasonResultRole'
        && p1.rivalryId == rivalryId
        && p1.seasonNumber == seasonNumber
        && p1.managerRole == 'playerOne'
        && p2.schemaVersion == 1
        && p2.objectType == 'sharedSeasonResultRole'
        && p2.rivalryId == rivalryId
        && p2.seasonNumber == seasonNumber
        && p2.managerRole == 'playerTwo'
        && ssjrCommitResultShape(p1.result, teamCount)
        && ssjrCommitResultShape(p2.result, teamCount)
        && ((public.actorRoles[0] == 'playerOne'
              && p1.operationId == public.operationIds[0]
              && p2.operationId == public.operationIds[1])
          || (public.actorRoles[0] == 'playerTwo'
              && p2.operationId == public.operationIds[0]
              && p1.operationId == public.operationIds[1]));
    }
    function ssjrCommitOperationChainValid(root) {
      let n = root.revision;
      return root.operationIds is list
        && root.operationHashes is list
        && root.baseRevisions is list
        && root.actorRoles is list
        && root.operationIds.size() == n
        && root.operationHashes.size() == n
        && root.baseRevisions.size() == n
        && root.actorRoles.size() == n
        && ssjrCommitValidOperationId(root.operationIds[0])
        && ssjrCommitValidHash(root.operationHashes[0])
        && root.baseRevisions[0] == 0
        && ssjrCommitValidRole(root.actorRoles[0])
        && (n < 2 || (ssjrCommitValidOperationId(root.operationIds[1])
          && root.operationIds[1] != root.operationIds[0]
          && ssjrCommitValidHash(root.operationHashes[1])
          && root.baseRevisions[1] == 1
          && ssjrCommitValidRole(root.actorRoles[1])))
        && (n < 3 || (ssjrCommitValidOperationId(root.operationIds[2])
          && root.operationIds[2] != root.operationIds[0]
          && root.operationIds[2] != root.operationIds[1]
          && ssjrCommitValidHash(root.operationHashes[2])
          && root.baseRevisions[2] == 2
          && ssjrCommitValidRole(root.actorRoles[2])));
    }
    function ssjrCommitAcknowledgementsValid(root) {
      let n = root.revision;
      return root.acknowledgedRoles is list
        && root.acknowledgedRoles.size() == n - 1
        && root.acknowledgedRoles.toSet().size() == root.acknowledgedRoles.size()
        && root.acknowledgedRoles.toSet().hasOnly(['playerOne','playerTwo'])
        && root.actorRoles == [root.actorRoles[0]].concat(root.acknowledgedRoles);
    }
    function ssjrCommitShape(root, rivalryId, seasonId) {
      let public = ssjrCommitPublicResults(rivalryId, seasonId);
      let teamCount = public.teamCount;
      let p1 = ssjrCommitPrivateResult(rivalryId, seasonId, 'playerOne');
      let p2 = ssjrCommitPrivateResult(rivalryId, seasonId, 'playerTwo');
      return teamCount in [18,20]
        && ssjrCommitExactKeys(root)
        && root.schemaVersion == 1
        && root.objectType == 'sharedSeasonCommit'
        && root.rivalryId == rivalryId
        && root.seasonNumber is int
        && ssjrCommitSeasonMatches(seasonId, root.seasonNumber)
        && ssjrCommitResultsReady(rivalryId, seasonId, root.seasonNumber)
        && root.runtimeRevision == '1.9.1-r10'
        && root.revision is int
        && root.revision >= 1
        && root.revision <= 3
        && root.resultsRevision == 2
        && root.results is map
        && root.results.keys().hasOnly(['playerOne','playerTwo'])
        && ssjrCommitResultShape(root.results.playerOne, teamCount)
        && ssjrCommitResultShape(root.results.playerTwo, teamCount)
        && root.results.playerOne == p1.result
        && root.results.playerTwo == p2.result
        && ssjrCommitOperationChainValid(root)
        && ssjrCommitAcknowledgementsValid(root)
        && ((root.revision < 3 && root.phase == 'COMMITTED') || (root.revision == 3 && root.phase == 'ACKNOWLEDGED'))
        && root.updatedAt == request.time
        && ssjrWriteAuthorityValid(rivalryId, root.updatedByDeviceId, root.activeSessionId);
    }
`;
const COMMIT_CREATE_FUNCTION="    function ssjrCommitValidCreate(rivalryId, seasonId) {";
const GENERATED_RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
if(GENERATED_RULES.split(COMMIT_CREATE_FUNCTION).length!==2)throw new Error("Season Commit create function not found exactly once.");
const RULES=GENERATED_RULES.replace(COMMIT_CREATE_FUNCTION,()=>DIAGNOSTIC_ONLY_COMMIT_HELPERS+COMMIT_CREATE_FUNCTION);
const TARGET="allow create: if ssjrCommitValidCreate(rivalryId, seasonId);";
const A="acct_commit_diag_a",B="acct_commit_diag_b";
const R=`pair_${"0".repeat(64)}`,S=`session_${"f".repeat(64)}`;
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`;
const PA=`profile_${"1".repeat(24)}`,PB=`profile_${"2".repeat(24)}`;
const SA=`save_${"3".repeat(24)}`,SB=`save_${"4".repeat(24)}`;
const RESULT_OP1=`season_result_op_${"1".repeat(32)}`;
const RESULT_OP2=`season_result_op_${"2".repeat(32)}`;
const COMMIT_OP=`season_commit_op_${"3".repeat(32)}`;
const HASH1=`sha256:${"1".repeat(64)}`,HASH2=`sha256:${"2".repeat(64)}`;

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
function setup(){return {schemaVersion:1,objectType:"sharedSetupLedger",rivalryId:R,revision:6,phase:"SHOWDOWN_CONFIRMED",coordinatorRole:"playerOne",operationIds:[1,2,3,4,5,6].map(n=>`setup_op_${n.toString(16).padStart(32,"0")}`),operationTypes:["open","commit-league","commit-clubs","commit-length","confirm","confirm"],baseRevisions:[0,1,2,3,4,5],actorRoles:["playerOne","playerOne","playerOne","playerOne","playerOne","playerTwo"],totalSeasons:3,confirmedRoles:["playerOne","playerTwo"],activeSessionId:S,updatedAt:Timestamp.fromMillis(1_000_000),updatedByDeviceId:DB};}
function resultOne(){return {leaguePosition:1,leaguePoints:102,leagueGoals:92,domesticCup:true,championsLeague:false,topScorer:true,topAssist:false};}
function resultTwo(){return {leaguePosition:3,leaguePoints:88,leagueGoals:86,domesticCup:false,championsLeague:false,topScorer:false,topAssist:true};}
function publicResults(now){return {schemaVersion:1,objectType:"sharedSeasonResults",rivalryId:R,seasonNumber:1,runtimeRevision:"1.9.1-r9",phase:"RESULTS_READY",revision:2,publishedRoles:["playerOne","playerTwo"],operationIds:[RESULT_OP1,RESULT_OP2],operationHashes:[HASH1,HASH2],baseRevisions:[0,1],actorRoles:["playerOne","playerTwo"],activeSessionId:S,updatedAt:Timestamp.fromMillis(now-200),updatedByDeviceId:DB};}
function privateResult(role,operationId,commandHash,result,deviceId,now){return {schemaVersion:1,objectType:"sharedSeasonResultRole",rivalryId:R,seasonNumber:1,managerRole:role,result,operationId,commandHash,activeSessionId:S,publishedAt:Timestamp.fromMillis(now-300),updatedByDeviceId:deviceId};}
function options(db,now){return {user:{uid:A},firestore:db,firebaseSdk:sdk(),rivalryId:R,sessionId:S,deviceId:DA,seasonNumber:1,operationId:COMMIT_OP,baseRevision:0,nowEpochMs:now,cryptoImpl:crypto.webcrypto};}

async function seed(env,now){
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    await setDoc(doc(db,"accounts",A),account(A));await setDoc(doc(db,"accounts",B),account(B));
    await setDoc(doc(db,"accounts",A,"devices",DA),device(DA));await setDoc(doc(db,"accounts",B,"devices",DB),device(DB));
    await setDoc(doc(db,"rivalries",R),rivalry());await setDoc(doc(db,"rivalries",R,"sessions",S),session(now));
    await setDoc(doc(db,"rivalries",R,"sharedSetup","authoritative"),setup());
    await setDoc(doc(db,"rivalries",R,"seasonResults","season_1"),publicResults(now));
    await setDoc(doc(db,"rivalries",R,"seasonResults","season_1","roles","playerOne"),privateResult("playerOne",RESULT_OP1,HASH1,resultOne(),DA,now));
    await setDoc(doc(db,"rivalries",R,"seasonResults","season_1","roles","playerTwo"),privateResult("playerTwo",RESULT_OP2,HASH2,resultTwo(),DB,now));
  });
}

async function runVariant(index,label,expression){
  const rules=RULES.replace(TARGET,`allow create: if ${expression};`);
  if(!rules.includes(`allow create: if ${expression};`))throw new Error("Season Commit create rule target was not found.");
  const env=await initializeTestEnvironment({projectId:`demo-cms17-commit-diag-${index}`,firestore:{rules}});
  try{
    const now=Date.now();await seed(env,now);
    const db=env.authenticatedContext(A).firestore();
    const value=await Commit.commitSeason(options(db,now));
    process.stdout.write(`SEASON_COMMIT_RULE_DIAG ${label} commit=${value.ok?"PASS":"FAIL:"+value.code}\n`);
    return value.ok===true;
  }finally{await env.cleanup();}
}

(async()=>{
  const root="request.resource.data";
  const exact=`ssjrCommitExactKeys(${root})`;
  const metadata=`${root}.schemaVersion == 1
    && ${root}.objectType == 'sharedSeasonCommit'
    && ${root}.rivalryId == rivalryId
    && ${root}.seasonNumber == 1
    && ssjrCommitSeasonMatches(seasonId, ${root}.seasonNumber)
    && ${root}.runtimeRevision == '1.9.1-r10'
    && ${root}.revision == 1
    && ${root}.resultsRevision == 2
    && ${root}.phase == 'COMMITTED'`;
  const ready=`ssjrCommitResultsReady(rivalryId, seasonId, ${root}.seasonNumber)`;
  const resultCopy=`${root}.results is map
    && ${root}.results.keys().hasOnly(['playerOne','playerTwo'])
    && ssjrCommitResultShape(${root}.results.playerOne, ssjrSetupTeamCount(rivalryId))
    && ssjrCommitResultShape(${root}.results.playerTwo, ssjrSetupTeamCount(rivalryId))
    && ${root}.results.playerOne == ssjrCommitPrivateResult(rivalryId, seasonId, 'playerOne').result
    && ${root}.results.playerTwo == ssjrCommitPrivateResult(rivalryId, seasonId, 'playerTwo').result`;
  const operation=`ssjrCommitOperationChainValid(${root})`;
  const acknowledgements=`ssjrCommitAcknowledgementsValid(${root})`;
  const authority=`${root}.updatedAt == request.time
    && ssjrWriteAuthorityValid(rivalryId, ${root}.updatedByDeviceId, ${root}.activeSessionId)`;
  const coordinator=`ssjrActorRole(rivalryId) == ssjrCommitSetup(rivalryId).coordinatorRole
    && ${root}.actorRoles[0] == ssjrActorRole(rivalryId)`;
  const variants=[
    ["ALLOW_TRUE","true"],
    ["EXACT",exact],
    ["METADATA",metadata],
    ["RESULTS_READY",ready],
    ["RESULT_COPY",resultCopy],
    ["OPERATION",operation],
    ["ACKNOWLEDGEMENTS",acknowledgements],
    ["AUTHORITY",authority],
    ["COORDINATOR",coordinator],
    ["EXACT_METADATA",`${exact} && ${metadata}`],
    ["READY_RESULT_COPY",`${ready} && ${resultCopy}`],
    ["OP_ACK",`${operation} && ${acknowledgements}`],
    ["AUTH_COORD",`${authority} && ${coordinator}`],
    ["SHAPE","ssjrCommitShape(request.resource.data, rivalryId, seasonId)"],
    ["ACTUAL","ssjrCommitValidCreate(rivalryId, seasonId)"]
  ];
  for(let i=0;i<variants.length;i++)await runVariant(i+1,variants[i][0],variants[i][1]);
})().catch(error=>{console.error(error.stack||error);process.exit(1);});

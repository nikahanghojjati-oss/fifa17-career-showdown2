"use strict";

// r52 regression: the two managers acknowledge the committed Shared Season at nearly the same time.
// The Firestore client SDK runs the acknowledgement as an optimistic transaction. When the rival's
// acknowledgement commits between this transaction's read of seasonCommits/{seasonId} (revision 1)
// and its own commit, the composed production Rules evaluate the write against the newer stored
// document (revision 2): `after.revision == before.revision + 1` and the acknowledgement prefix no
// longer hold, so the server answers permission-denied. The SDK never retries permission-denied,
// so the browser showed "Your shared season acknowledgement could not be recorded" (2/8 journeys).
//
// This harness forces that interleaving deterministically against the real generated Rules and
// proves: (1) the late acknowledgement is reported as SEASON_COMMIT_STALE_BASE_REVISION (which the
// production adapter's bounded retry already handles) instead of permission-denied; (2) the retry
// from the fresh revision completes ACKNOWLEDGED; (3) a denial with no proven concurrent advance
// (actor device revoked during the race) still surfaces permission-denied; (4) the Rules still
// deny a direct stale revision-2 write over revision 2.

const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,getDoc,setDoc,serverTimestamp}=firestoreSdk;
const {initializeTestEnvironment,assertFails}=require("@firebase/rules-unit-testing");

global.window=globalThis;
require("../../data/transferOptions.js");

const Setup=require("../../js/sparkSharedShowdownSetup.js");
const Career=require("../../js/sparkSharedCareerStart.js");
const Transfer=require("../../js/sparkSharedTransferChallenge.js");
const Results=require("../../js/sparkSharedSeasonResults.js");
const Commit=require("../../js/sparkSharedSeasonCommit.js");

const PROJECT_ID=process.env.GCLOUD_PROJECT||"demo-cms-gameplay-fast-season-ack";
const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const A="acct_race_a",B="acct_race_b";
const R=`pair_${"7".repeat(64)}`;
const S=`session_${"9".repeat(64)}`;
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`;
const PA=`profile_${"1".repeat(24)}`,PB=`profile_${"2".repeat(24)}`;
const SA=`save_${"3".repeat(24)}`,SB=`save_${"4".repeat(24)}`;
const COMMIT_PATH=`rivalries/${R}/seasonCommits/season_1`;

function sdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp};}
function account(id){return {objectType:"account",objectId:id,lifecycleState:"live",data:{status:"active"}};}
function device(id,state="active"){return {objectType:"device",objectId:id,lifecycleState:"live",data:{deviceId:id,state}};}
function rivalry(){return {objectType:"rivalry",objectId:R,lifecycleState:"live",data:{connectionState:"active",authorizedAccountIds:[A,B],managerSlots:[
  {slotId:"playerOne",accountId:A,profileId:PA,saveId:SA,entitlementState:"active"},
  {slotId:"playerTwo",accountId:B,profileId:PB,saveId:SB,entitlementState:"active"}
]}};}
function session(now){
  const createdAt=Timestamp.fromMillis(now-60_000),lastActivityAt=Timestamp.fromMillis(now-1_000),expiresAt=Timestamp.fromMillis(now+4*60*60*1000);
  return {schemaVersion:1,objectType:"session",objectId:S,revision:1,parentRevision:0,lifecycleState:"live",contentHash:`sha256:${"0".repeat(64)}`,priorContentHash:`sha256:${"1".repeat(64)}`,updatedAt:lastActivityAt,updatedByAccountId:A,updatedByDeviceId:DA,data:{rivalryId:R,state:"active",hostAccountId:A,memberAccountIds:[A,B],createdAt,expiresAt,lastActivityAt,revokedAt:null},tombstone:null};
}
function op(prefix,n){return prefix+Number(n).toString(16).padStart(32,"0");}
function result(role){return role==="playerOne"
  ?{leaguePosition:1,leaguePoints:102,leagueGoals:89,domesticCup:false,championsLeague:false,topScorer:true,topAssist:false}
  :{leaguePosition:3,leaguePoints:88,leagueGoals:85,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false};}

// Drive the real providers through the real generated Rules to a coordinator-committed season 1.
async function prepareCommitted(env){
  await env.clearFirestore();
  const now=Date.now();
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    await setDoc(doc(db,"accounts",A),account(A));await setDoc(doc(db,"accounts",B),account(B));
    await setDoc(doc(db,"accounts",A,"devices",DA),device(DA));await setDoc(doc(db,"accounts",B,"devices",DB),device(DB));
    await setDoc(doc(db,"rivalries",R),rivalry());await setDoc(doc(db,"rivalries",R,"sessions",S),session(now));
  });
  const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
  const base=(db,uid,deviceId,t)=>({user:{uid},firestore:db,firebaseSdk:sdk(),rivalryId:R,sessionId:S,deviceId,nowEpochMs:now+t,cryptoImpl:crypto.webcrypto});
  const a=t=>base(dbA,A,DA,t),b=t=>base(dbB,B,DB,t);
  const expectOk=(value,label)=>{assert.equal(value.ok,true,`${label} failed: ${JSON.stringify(value)}`);return value;};
  const setupOps=[["open",0,1,{}],["commit-league",1,2,{}],["commit-clubs",2,3,{}],["commit-length",3,4,{totalSeasons:3}]];
  for(const [type,baseRevision,n,extra] of setupOps)expectOk(await Setup.mutate({...a(n*10),type,baseRevision,operationId:op("setup_op_",n),...extra}),`Setup ${type}`);
  expectOk(await Setup.mutate({...a(50),type:"confirm",baseRevision:4,operationId:op("setup_op_",5)}),"Setup confirm A");
  const confirmed=expectOk(await Setup.mutate({...b(60),type:"confirm",baseRevision:5,operationId:op("setup_op_",6)}),"Setup confirm B");
  assert.equal(confirmed.state.phase,"SHOWDOWN_CONFIRMED");
  expectOk(await Career.acknowledge({...a(70),operationId:op("career_start_op_",1),baseRevision:0}),"Career A");
  expectOk(await Career.acknowledge({...b(80),operationId:op("career_start_op_",2),baseRevision:1}),"Career B");
  const s=1,o=10_000;
  expectOk(await Transfer.startWindow({...a(o+100),seasonNumber:s,operationId:op("transfer_op_",11),baseRevision:0}),"Transfer start");
  expectOk(await Transfer.requestEndWindow({...a(o+200),seasonNumber:s,operationId:op("transfer_op_",12),baseRevision:1}),"Transfer end A");
  expectOk(await Transfer.requestEndWindow({...b(o+300),seasonNumber:s,operationId:op("transfer_op_",13),baseRevision:2}),"Transfer end B");
  expectOk(await Transfer.lockGuesses({...a(o+400),seasonNumber:s,operationId:op("transfer_op_",14),baseRevision:3,guesses:[{slot:1,type:"league",valueId:"england-premier-league"},{slot:2,type:"nationality",valueId:"brazil"},{slot:3,type:"league",valueId:"germany-bundesliga"}]}),"Guesses A");
  expectOk(await Transfer.lockGuesses({...b(o+500),seasonNumber:s,operationId:op("transfer_op_",15),baseRevision:4,guesses:[{slot:1,type:"league",valueId:"spain-primera-division"},{slot:2,type:"nationality",valueId:"germany"},{slot:3,type:"nationality",valueId:"albania"}]}),"Guesses B");
  expectOk(await Transfer.lockSignings({...a(o+600),seasonNumber:s,operationId:op("transfer_op_",16),baseRevision:5,signings:[{slot:1,name:"Daniel A",leagueId:"spain-primera-division",nationalityId:"england"},{slot:2,name:"Daniel B",leagueId:"australia-a-league",nationalityId:"albania"},{slot:3,name:"Daniel C",leagueId:"germany-bundesliga",nationalityId:"france"}]}),"Signings A");
  const done=expectOk(await Transfer.lockSignings({...b(o+700),seasonNumber:s,operationId:op("transfer_op_",17),baseRevision:6,signings:[{slot:1,name:"Nik A",leagueId:"england-premier-league",nationalityId:"brazil"},{slot:2,name:"Nik B",leagueId:"italy-serie-a",nationalityId:"germany"},{slot:3,name:"Nik C",leagueId:"france-ligue-1",nationalityId:"albania"}]}),"Signings B");
  assert.equal(done.state.phase,"COMPLETED");
  expectOk(await Results.publishResult({...a(o+800),seasonNumber:s,operationId:op("season_result_op_",11),baseRevision:0,result:result("playerOne")}),"Result A");
  const ready=expectOk(await Results.publishResult({...b(o+900),seasonNumber:s,operationId:op("season_result_op_",12),baseRevision:1,result:result("playerTwo")}),"Result B");
  assert.equal(ready.state.phase,"RESULTS_READY");
  const committed=expectOk(await Commit.commitSeason({...a(o+1000),seasonNumber:s,operationId:op("season_commit_op_",11),baseRevision:0}),"Coordinator commit");
  assert.equal(committed.revision,1);
  return {dbA,dbB,a:t=>({...a(o+t),seasonNumber:s}),b:t=>({...b(o+t),seasonNumber:s})};
}

// Wrap the real SDK so the FIRST transaction attempt that reads the commit document runs `between`
// right after that read and before the transaction commits: the rival's write lands in that gap.
function racingSdk(between){
  let fired=false;
  return {...sdk(),runTransaction:(db,callback)=>firestoreSdk.runTransaction(db,async tx=>{
    const wrapped={
      get:async ref=>{const snapshot=await tx.get(ref);if(!fired&&ref.path===COMMIT_PATH){fired=true;await between();}return snapshot;},
      set:(...args)=>{tx.set(...args);return wrapped;},
      update:(...args)=>{tx.update(...args);return wrapped;}
    };
    return callback(wrapped);
  })};
}
async function storedCommit(env){let value=null;await env.withSecurityRulesDisabled(async context=>{value=(await getDoc(doc(context.firestore(),"rivalries",R,"seasonCommits","season_1"))).data();});return value;}

(async()=>{
  const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  try{
    // R1: Daniel's acknowledgement lands inside Nik's acknowledgement transaction.
    {
      const h=await prepareCommitted(env);
      let daniel=null;
      const nik=await Commit.acknowledgeSeason({...h.b(1100),firebaseSdk:racingSdk(async()=>{daniel=await Commit.acknowledgeSeason({...h.a(1050),operationId:op("season_commit_op_",12),baseRevision:1});}),operationId:op("season_commit_op_",13),baseRevision:1});
      assert.equal(daniel?.ok,true,`Daniel's concurrent acknowledgement must commit: ${JSON.stringify(daniel)}`);
      assert.equal(daniel.revision,2);
      assert.equal(nik.ok,false);
      assert.equal(nik.code,"SEASON_COMMIT_STALE_BASE_REVISION",`a legitimately superseded acknowledgement must be reported as stale (retryable), not as an authorization failure; got ${nik.code}`);
      // The production adapter re-reads and retries once from the fresh revision (productionSharedSeasonCommit.js psscMutate).
      const fresh=await Commit.read(h.b(1150));
      assert.equal(fresh.ok,true,JSON.stringify(fresh));assert.equal(fresh.revision,2);assert.equal(fresh.ownAcknowledged,false);
      const retry=await Commit.acknowledgeSeason({...h.b(1200),operationId:op("season_commit_op_",13),baseRevision:fresh.revision});
      assert.equal(retry.ok,true,`the bounded retry from the fresh revision must succeed: ${JSON.stringify(retry)}`);
      assert.equal(retry.revision,3);assert.equal(retry.phase,"ACKNOWLEDGED");
      const stored=await storedCommit(env);
      assert.deepEqual(stored.acknowledgedRoles,["playerOne","playerTwo"]);assert.equal(stored.phase,"ACKNOWLEDGED");
      process.stdout.write("ok R1 Nik's acknowledgement superseded by Daniel's concurrent acknowledgement is STALE (not permission-denied) and the bounded retry reaches ACKNOWLEDGED\n");
    }
    // R2: the mirror ordering (Nik lands inside Daniel's transaction).
    {
      const h=await prepareCommitted(env);
      let nik=null;
      const daniel=await Commit.acknowledgeSeason({...h.a(1100),firebaseSdk:racingSdk(async()=>{nik=await Commit.acknowledgeSeason({...h.b(1050),operationId:op("season_commit_op_",22),baseRevision:1});}),operationId:op("season_commit_op_",23),baseRevision:1});
      assert.equal(nik?.ok,true,JSON.stringify(nik));
      assert.equal(daniel.code,"SEASON_COMMIT_STALE_BASE_REVISION",`mirror ordering must also be stale; got ${daniel.code}`);
      const retry=await Commit.acknowledgeSeason({...h.a(1200),operationId:op("season_commit_op_",23),baseRevision:2});
      assert.equal(retry.ok,true,JSON.stringify(retry));assert.equal(retry.phase,"ACKNOWLEDGED");
      process.stdout.write("ok R2 mirror ordering (Daniel superseded by Nik) is STALE and converges to ACKNOWLEDGED\n");
    }
    // R3: same race, but Nik's device is revoked in the gap. The fresh authority-checked read fails,
    // so the denial must stay permission-denied (no authorization failure is hidden).
    {
      const h=await prepareCommitted(env);
      const nik=await Commit.acknowledgeSeason({...h.b(1100),firebaseSdk:racingSdk(async()=>{
        const d=await Commit.acknowledgeSeason({...h.a(1050),operationId:op("season_commit_op_",32),baseRevision:1});assert.equal(d.ok,true,JSON.stringify(d));
        await env.withSecurityRulesDisabled(async context=>{await setDoc(doc(context.firestore(),"accounts",B,"devices",DB),device(DB,"revoked"));});
      }),operationId:op("season_commit_op_",33),baseRevision:1});
      assert.equal(nik.ok,false);
      assert.equal(nik.code,"permission-denied",`a denial whose fresh read fails authority must not be remapped; got ${nik.code}`);
      const stored=await storedCommit(env);assert.equal(stored.revision,2);assert.deepEqual(stored.acknowledgedRoles,["playerOne"]);
      process.stdout.write("ok R3 denial with revoked actor device during the race stays permission-denied and writes nothing\n");
    }
    // R4: Rules are unchanged and still deny a direct stale transition over the newer document.
    {
      const h=await prepareCommitted(env);
      const d=await Commit.acknowledgeSeason({...h.a(1050),operationId:op("season_commit_op_",42),baseRevision:1});assert.equal(d.ok,true,JSON.stringify(d));
      const stale=await storedCommit(env);
      await assertFails(setDoc(doc(h.dbB,"rivalries",R,"seasonCommits","season_1"),{...stale,revision:2,phase:"COMMITTED",operationIds:[stale.operationIds[0],op("season_commit_op_",43)],operationHashes:[stale.operationHashes[0],`sha256:${"4".repeat(64)}`],baseRevisions:[0,1],actorRoles:["playerOne","playerTwo"],acknowledgedRoles:["playerTwo"],updatedAt:serverTimestamp(),updatedByDeviceId:DB}));
      process.stdout.write("ok R4 Rules still deny a stale revision-2 acknowledgement written over revision 2\n");
    }
    process.stdout.write("PASS Shared Season Commit concurrent acknowledgement: a rival acknowledgement landing inside this manager's transaction is reported as SEASON_COMMIT_STALE_BASE_REVISION only after a fresh authority-checked read proves the commit advanced; the bounded retry converges to ACKNOWLEDGED in both orderings; unproven denials stay permission-denied; Rules unchanged.\n");
  }finally{await env.cleanup();}
})().catch(error=>{console.error(error.stack||error);process.exit(1);});

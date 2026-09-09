const assert=require("node:assert/strict");
const {webcrypto}=require("node:crypto");
const Results=require("../../js/sharedSeasonResults.js");
const Provider=require("../../js/sparkSharedSeasonCommit.js");

const rivalryId="pair_"+("a".repeat(64));
const sessionId="session_"+("b".repeat(64));
const device1="device_"+("1".repeat(32));
const device2="device_"+("2".repeat(32));
const uid1="manager_one",uid2="manager_two";
const resultOp=n=>`season_result_op_${Number(n).toString(16).padStart(32,"0")}`;
const commitOp=n=>`season_commit_op_${Number(n).toString(16).padStart(32,"0")}`;
const hash=n=>`sha256:${Number(n).toString(16).padStart(64,"0")}`;
const ts=millis=>({toMillis:()=>millis});
const p1={leaguePosition:1,leaguePoints:100,leagueGoals:120,domesticCup:true,championsLeague:false,topScorer:true,topAssist:false};
const p2={leaguePosition:2,leaguePoints:92,leagueGoals:90,domesticCup:false,championsLeague:true,topScorer:false,topAssist:true};

function clone(value){if(value===undefined)return undefined;const text=JSON.stringify(value,(_key,item)=>item&&typeof item.toMillis==="function"?{__millis:item.toMillis()}:item);return JSON.parse(text,(_key,item)=>item&&Number.isFinite(item.__millis)?ts(item.__millis):item);}
async function createHarness(){
  const store=new Map(),reads=[];const key=(...parts)=>parts.join("/");const put=(path,value)=>store.set(path,clone(value));
  put(key("accounts",uid1),{objectType:"account",objectId:uid1,lifecycleState:"live",data:{status:"active"}});
  put(key("accounts",uid2),{objectType:"account",objectId:uid2,lifecycleState:"live",data:{status:"active"}});
  put(key("accounts",uid1,"devices",device1),{objectType:"device",objectId:device1,lifecycleState:"live",data:{deviceId:device1,state:"active"}});
  put(key("accounts",uid2,"devices",device2),{objectType:"device",objectId:device2,lifecycleState:"live",data:{deviceId:device2,state:"active"}});
  put(key("rivalries",rivalryId),{objectType:"rivalry",objectId:rivalryId,lifecycleState:"live",data:{connectionState:"active",authorizedAccountIds:[uid1,uid2],managerSlots:[{slotId:"playerOne",accountId:uid1,entitlementState:"active"},{slotId:"playerTwo",accountId:uid2,entitlementState:"active"}]}});
  put(key("rivalries",rivalryId,"sessions",sessionId),{objectType:"session",objectId:sessionId,lifecycleState:"live",data:{rivalryId,state:"active",memberAccountIds:[uid1,uid2],expiresAt:ts(9_000_000)}});
  const setup={schemaVersion:1,objectType:"sharedSetupLedger",rivalryId,revision:6,phase:"SHOWDOWN_CONFIRMED",coordinatorRole:"playerOne",totalSeasons:3,confirmedRoles:["playerOne","playerTwo"]};
  put(key("rivalries",rivalryId,"sharedSetup","authoritative"),setup);
  const careerStart={phase:"CAREER_START_READY",revision:2,acknowledgedRoles:["playerOne","playerTwo"]};
  const transferChallenge={phase:"COMPLETED",seasonNumber:1,revision:7};
  const protocol=await Results.createProtocol({teamCount:20,cryptoImpl:webcrypto});let ready=(await protocol.apply({state:null,setup,careerStart,transferChallenge,seasonNumber:1,actorRole:"playerOne",command:{type:"publish-result",operationId:resultOp(1),baseRevision:0,result:p1}})).state;ready=(await protocol.apply({state:ready,setup,careerStart,transferChallenge,seasonNumber:1,actorRole:"playerTwo",command:{type:"publish-result",operationId:resultOp(2),baseRevision:1,result:p2}})).state;
  const publicPath=key("rivalries",rivalryId,"seasonResults","season_1"),p1Path=key("rivalries",rivalryId,"seasonResults","season_1","roles","playerOne"),p2Path=key("rivalries",rivalryId,"seasonResults","season_1","roles","playerTwo"),commitPath=key("rivalries",rivalryId,"seasonCommits","season_1");
  put(publicPath,{schemaVersion:1,objectType:"sharedSeasonResults",rivalryId,seasonNumber:1,runtimeRevision:"1.9.1-r9",phase:"RESULTS_READY",revision:2,publishedRoles:[...ready.publishedRoles],operationIds:ready.receipts.map(r=>r.operationId),operationHashes:[hash(10),hash(11)],baseRevisions:ready.receipts.map(r=>r.baseRevision),actorRoles:ready.receipts.map(r=>r.actorRole)});
  for(const role of ["playerOne","playerTwo"]){const receipt=ready.receipts.find(r=>r.actorRole===role),result=ready.results[role];put(role==="playerOne"?p1Path:p2Path,{schemaVersion:1,objectType:"sharedSeasonResultRole",rivalryId,seasonNumber:1,managerRole:role,result,operationId:receipt.operationId,commandHash:receipt.commandHash});}
  let serverNow=2_000_000;
  const sdk={doc:(_db,...parts)=>key(...parts),serverTimestamp:()=>ts(serverNow),runTransaction:async(_db,callback)=>{const pending=[];const tx={get:async ref=>{reads.push(ref);return {exists:()=>store.has(ref),data:()=>clone(store.get(ref))};},set:(ref,value)=>pending.push([ref,clone(value)])};const result=await callback(tx);pending.forEach(([ref,value])=>store.set(ref,value));return result;}};
  const options=(role,now=2_000_000)=>{serverNow=now;return {user:{uid:role==="playerOne"?uid1:uid2},firestore:{},firebaseSdk:sdk,rivalryId,sessionId,deviceId:role==="playerOne"?device1:device2,seasonNumber:1,cryptoImpl:webcrypto,nowEpochMs:now};};
  return {store,reads,key,options,publicPath,p1Path,p2Path,commitPath};
}

(async()=>{
  assert.equal(Provider.feature,"ssjr-spark-shared-season-commit");
  assert.equal(Provider.runtimeRevision,"1.9.1-r10");
  assert.equal(Provider.billingRequired,false);assert.equal(Provider.blazeRequired,false);assert.equal(Provider.cloudRunRequired,false);assert.equal(Provider.cloudFunctionsRequired,false);assert.equal(Provider.canonicalStorageMutation,false);assert.equal(Provider.authoritativeScoring,false);assert.equal(Provider.requiresResultsReady,true);assert.equal(Provider.requiresBothAcknowledgements,true);

  const h=await createHarness();
  let view=await Provider.read(h.options("playerOne"));assert.equal(view.ok,true);assert.equal(view.committed,false);assert.equal(view.phase,"RESULTS_READY");assert.equal(view.coordinatorRole,"playerOne");assert.deepEqual(view.results,{playerOne:p1,playerTwo:p2});
  let denied=await Provider.commitSeason({...h.options("playerTwo"),operationId:commitOp(1),baseRevision:0});assert.equal(denied.ok,false);assert.equal(denied.code,"SEASON_COMMIT_COORDINATOR_REQUIRED");
  let stale=await Provider.commitSeason({...h.options("playerOne"),operationId:commitOp(2),baseRevision:1});assert.equal(stale.ok,false);assert.equal(stale.code,"SEASON_COMMIT_STALE_BASE_REVISION");
  let result=await Provider.commitSeason({...h.options("playerOne"),operationId:commitOp(3),baseRevision:0});assert.equal(result.ok,true);assert.equal(result.revision,1);assert.equal(result.phase,"COMMITTED");assert.equal(h.store.get(h.commitPath).objectType,"sharedSeasonCommit");assert.deepEqual(h.store.get(h.commitPath).results,{playerOne:p1,playerTwo:p2});
  let replay=await Provider.commitSeason({...h.options("playerOne"),operationId:commitOp(3),baseRevision:0});assert.equal(replay.ok,true);assert.equal(replay.replayed,true);assert.equal(replay.revision,1);
  result=await Provider.acknowledgeSeason({...h.options("playerTwo"),operationId:commitOp(4),baseRevision:1});assert.equal(result.ok,true);assert.equal(result.revision,2);assert.equal(result.phase,"COMMITTED");assert.deepEqual(h.store.get(h.commitPath).acknowledgedRoles,["playerTwo"]);
  denied=await Provider.acknowledgeSeason({...h.options("playerTwo"),operationId:commitOp(5),baseRevision:2});assert.equal(denied.ok,false);assert.equal(denied.code,"SEASON_COMMIT_ROLE_ALREADY_ACKNOWLEDGED");
  result=await Provider.acknowledgeSeason({...h.options("playerOne"),operationId:commitOp(6),baseRevision:2});assert.equal(result.ok,true);assert.equal(result.revision,3);assert.equal(result.phase,"ACKNOWLEDGED");assert.deepEqual(h.store.get(h.commitPath).acknowledgedRoles,["playerTwo","playerOne"]);
  view=await Provider.read(h.options("playerTwo",2_000_100));assert.equal(view.ok,true);assert.equal(view.committed,true);assert.equal(view.phase,"ACKNOWLEDGED");assert.equal(view.ownAcknowledged,true);assert.deepEqual(view.results,{playerOne:p1,playerTwo:p2});

  const drift=await createHarness();await Provider.commitSeason({...drift.options("playerOne"),operationId:commitOp(10),baseRevision:0});drift.store.get(drift.p1Path).result.leaguePoints=99;view=await Provider.read(drift.options("playerOne",2_000_200));assert.equal(view.ok,false);assert.equal(view.code,"SEASON_COMMIT_RESULTS_REVISION_MISMATCH");
  const revoked=await createHarness();revoked.store.get(revoked.key("accounts",uid1,"devices",device1)).data.state="revoked";denied=await Provider.commitSeason({...revoked.options("playerOne"),operationId:commitOp(11),baseRevision:0});assert.equal(denied.ok,false);assert.equal(denied.code,"SEASON_COMMIT_DEVICE_INACTIVE");
  const expired=await createHarness();expired.store.get(expired.key("rivalries",rivalryId,"sessions",sessionId)).data.expiresAt=ts(1_000_000);denied=await Provider.commitSeason({...expired.options("playerOne",2_000_000),operationId:commitOp(12),baseRevision:0});assert.equal(denied.ok,false);assert.equal(denied.code,"SEASON_COMMIT_ACTIVE_SESSION_REQUIRED");
  const incomplete=await createHarness();incomplete.store.get(incomplete.publicPath).phase="COLLECTING";incomplete.store.get(incomplete.publicPath).revision=1;denied=await Provider.commitSeason({...incomplete.options("playerOne"),operationId:commitOp(13),baseRevision:0});assert.equal(denied.ok,false);assert.equal(denied.code,"SEASON_COMMIT_RESULTS_NOT_READY");

  console.log("PASS Shared Season Commit Spark provider: active account/device/two-manager rivalry/ACTIVE-session authority, authoritative r9 RESULTS_READY reconstruction, coordinator-only immutable commit, CAS/idempotency, two distinct acknowledgements, results-drift rejection, Spark-only zero billing, no scoring and no canonical Save mutation.");
})().catch(error=>{console.error(error);process.exitCode=1;});

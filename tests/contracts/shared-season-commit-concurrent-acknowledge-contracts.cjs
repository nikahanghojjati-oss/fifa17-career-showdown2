"use strict";
// Regression (2/8 two-manager browser journeys): Nik's Season Commit acknowledgement failed with
// Firestore permission-denied. Both managers acknowledge the committed season at nearly the same
// moment; the rival's acknowledgement commits between this manager's transaction read (revision 1)
// and its commit, and the production Rules then evaluate the revision-2 write against the stored
// revision-2 document and deny it. The SDK does not retry permission-denied.
//
// The Spark provider must report that one case as SEASON_COMMIT_STALE_BASE_REVISION (which the
// production adapter's existing single bounded retry handles) ONLY when a fresh, fully authority-
// checked read proves the stored commit advanced past the revision the failed attempt read. Any other
// denial must surface unchanged. Node only; the fake server below denies exactly like the Rules do
// (a write whose document changed after it was read is evaluated against the newer state and fails).
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {webcrypto}=require("node:crypto");
const Results=require("../../js/sharedSeasonResults.js");
const Provider=require("../../js/sparkSharedSeasonCommit.js");

const rivalryId="pair_"+("6".repeat(64));
const sessionId="session_"+("c".repeat(64));
const device1="device_"+("1".repeat(32)),device2="device_"+("2".repeat(32));
const uid1="manager_daniel",uid2="manager_nik";
const resultOp=n=>`season_result_op_${Number(n).toString(16).padStart(32,"0")}`;
const commitOp=n=>`season_commit_op_${Number(n).toString(16).padStart(32,"0")}`;
const hash=n=>`sha256:${Number(n).toString(16).padStart(64,"0")}`;
const ts=millis=>({toMillis:()=>millis});
const p1={leaguePosition:1,leaguePoints:87,leagueGoals:93,domesticCup:false,championsLeague:true,topScorer:true,topAssist:false};
const p2={leaguePosition:2,leaguePoints:84,leagueGoals:101,domesticCup:true,championsLeague:false,topScorer:false,topAssist:true};
let checks=0;const ok=label=>{checks+=1;console.log(`ok ${checks} ${label}`);};

function clone(value){if(value===undefined)return undefined;const text=JSON.stringify(value,(_key,item)=>item&&typeof item.toMillis==="function"?{__millis:item.toMillis()}:item);return JSON.parse(text,(_key,item)=>item&&Number.isFinite(item.__millis)?ts(item.__millis):item);}
function denied(){const error=new Error("Missing or insufficient permissions.");error.code="permission-denied";return error;}

async function createHarness(){
  const store=new Map(),versions=new Map();let clock=0,transactions=0;
  const key=(...parts)=>parts.join("/");
  const put=(p,value)=>{store.set(p,clone(value));versions.set(p,++clock);};
  put(key("accounts",uid1),{objectType:"account",objectId:uid1,lifecycleState:"live",data:{status:"active"}});
  put(key("accounts",uid2),{objectType:"account",objectId:uid2,lifecycleState:"live",data:{status:"active"}});
  put(key("accounts",uid1,"devices",device1),{objectType:"device",objectId:device1,lifecycleState:"live",data:{deviceId:device1,state:"active"}});
  put(key("accounts",uid2,"devices",device2),{objectType:"device",objectId:device2,lifecycleState:"live",data:{deviceId:device2,state:"active"}});
  put(key("rivalries",rivalryId),{objectType:"rivalry",objectId:rivalryId,lifecycleState:"live",data:{connectionState:"active",authorizedAccountIds:[uid1,uid2],managerSlots:[{slotId:"playerOne",accountId:uid1,profileId:"profile_"+("1".repeat(24)),saveId:"save_"+("3".repeat(24)),entitlementState:"active"},{slotId:"playerTwo",accountId:uid2,profileId:"profile_"+("2".repeat(24)),saveId:"save_"+("4".repeat(24)),entitlementState:"active"}]}});
  put(key("rivalries",rivalryId,"sessions",sessionId),{objectType:"session",objectId:sessionId,lifecycleState:"live",data:{rivalryId,state:"active",hostAccountId:uid1,memberAccountIds:[uid1,uid2],expiresAt:ts(9_000_000)}});
  const setup={schemaVersion:1,objectType:"sharedSetupLedger",rivalryId,revision:6,phase:"SHOWDOWN_CONFIRMED",coordinatorRole:"playerOne",operationIds:[1,2,3,4,5,6].map(n=>"setup_op_"+n.toString(16).padStart(32,"0")),operationTypes:["open","commit-league","commit-clubs","commit-length","confirm","confirm"],baseRevisions:[0,1,2,3,4,5],actorRoles:["playerOne","playerOne","playerOne","playerOne","playerOne","playerTwo"],totalSeasons:3,confirmedRoles:["playerOne","playerTwo"],activeSessionId:sessionId,updatedAt:ts(1_000_000),updatedByDeviceId:device2};
  put(key("rivalries",rivalryId,"sharedSetup","authoritative"),setup);
  const protocol=await Results.createProtocol({teamCount:20,cryptoImpl:webcrypto});
  const careerStart={phase:"CAREER_START_READY",revision:2,acknowledgedRoles:["playerOne","playerTwo"]},transferChallenge={phase:"COMPLETED",seasonNumber:1,revision:7};
  let ready=(await protocol.apply({state:null,setup,careerStart,transferChallenge,seasonNumber:1,actorRole:"playerOne",command:{type:"publish-result",operationId:resultOp(1),baseRevision:0,result:p1}})).state;
  ready=(await protocol.apply({state:ready,setup,careerStart,transferChallenge,seasonNumber:1,actorRole:"playerTwo",command:{type:"publish-result",operationId:resultOp(2),baseRevision:1,result:p2}})).state;
  const publicPath=key("rivalries",rivalryId,"seasonResults","season_1"),commitPath=key("rivalries",rivalryId,"seasonCommits","season_1");
  put(publicPath,{schemaVersion:1,objectType:"sharedSeasonResults",rivalryId,seasonNumber:1,runtimeRevision:"1.9.1-r9",phase:"RESULTS_READY",revision:2,publishedRoles:[...ready.publishedRoles],operationIds:ready.receipts.map(r=>r.operationId),operationHashes:[hash(10),hash(11)],baseRevisions:ready.receipts.map(r=>r.baseRevision),actorRoles:ready.receipts.map(r=>r.actorRole)});
  for(const role of ["playerOne","playerTwo"]){const receipt=ready.receipts.find(r=>r.actorRole===role);put(key("rivalries",rivalryId,"seasonResults","season_1","roles",role),{schemaVersion:1,objectType:"sharedSeasonResultRole",rivalryId,seasonNumber:1,managerRole:role,result:ready.results[role],operationId:receipt.operationId,commandHash:receipt.commandHash});}
  // hooks: afterRead(ref) runs after a transactional read (to interleave the rival); denyNext forces one
  // unconditional denial on commit (an authorization failure with no concurrent change).
  const hooks={afterRead:null,denyNext:false,denyReads:false};
  const sdk={doc:(_db,...parts)=>key(...parts),serverTimestamp:()=>ts(2_000_000),runTransaction:async(_db,callback)=>{
    transactions+=1;const pending=[],seen=new Map();
    const tx={get:async ref=>{if(hooks.denyReads)throw denied();seen.set(ref,versions.get(ref)||0);const present=store.has(ref),value=clone(store.get(ref)),snapshot={exists:()=>present,data:()=>clone(value)};if(hooks.afterRead){const hook=hooks.afterRead;if(await hook(ref))hooks.afterRead=null;}return snapshot;},set:(ref,value)=>pending.push([ref,clone(value)])};
    const result=await callback(tx);
    if(pending.length){
      if(hooks.denyNext){hooks.denyNext=false;throw denied();}
      // Rules see the document as stored at commit time: a write whose target changed after it was
      // read is a revision+1 transition from the wrong base and is denied (not aborted).
      for(const [ref] of pending)if((versions.get(ref)||0)!==seen.get(ref))throw denied();
      for(const [ref,value] of pending)put(ref,value);
    }
    return result;
  }};
  const options=role=>({user:{uid:role==="playerOne"?uid1:uid2},firestore:{},firebaseSdk:sdk,rivalryId,sessionId,deviceId:role==="playerOne"?device1:device2,seasonNumber:1,cryptoImpl:webcrypto,nowEpochMs:2_000_000});
  return {store,key,hooks,options,commitPath,transactions:()=>transactions};
}
async function committed(){
  const h=await createHarness();
  const commit=await Provider.commitSeason({...h.options("playerOne"),operationId:commitOp(1),baseRevision:0});
  assert.equal(commit.ok,true,JSON.stringify(commit));assert.equal(commit.revision,1);
  return h;
}
// Interleave: when `role`'s acknowledgement transaction reads the commit doc for the first time, run `rival` first.
function interleave(h,rival){let fired=false;h.hooks.afterRead=async ref=>{if(fired||ref!==h.commitPath)return false;fired=true;await rival();return true;};}

(async()=>{
  // C1 the observed race: Daniel's acknowledgement lands inside Nik's transaction.
  {
    const h=await committed();let daniel=null;
    interleave(h,async()=>{daniel=await Provider.acknowledgeSeason({...h.options("playerOne"),operationId:commitOp(2),baseRevision:1});});
    const before=h.transactions();
    const nik=await Provider.acknowledgeSeason({...h.options("playerTwo"),operationId:commitOp(3),baseRevision:1});
    assert.equal(daniel?.ok,true,JSON.stringify(daniel));assert.equal(daniel.revision,2);
    assert.equal(nik.ok,false);
    assert.equal(nik.code,"SEASON_COMMIT_STALE_BASE_REVISION",`a superseded acknowledgement must be retryable STALE, not ${nik.code}`);
    // Nik's tx + Daniel's tx + exactly one fresh authority-checked read: bounded, no blind write retry.
    assert.equal(h.transactions()-before,3,"exactly one extra read transaction after the denial, and no automatic second write");
    assert.equal(h.store.get(h.commitPath).revision,2);assert.deepEqual(h.store.get(h.commitPath).acknowledgedRoles,["playerOne"]);
    ok("C1 Daniel's acknowledgement landing inside Nik's transaction is reported as SEASON_COMMIT_STALE_BASE_REVISION after one fresh read");
    const fresh=await Provider.read(h.options("playerTwo"));assert.equal(fresh.revision,2);assert.equal(fresh.ownAcknowledged,false);
    const retry=await Provider.acknowledgeSeason({...h.options("playerTwo"),operationId:commitOp(3),baseRevision:fresh.revision});
    assert.equal(retry.ok,true,JSON.stringify(retry));assert.equal(retry.revision,3);assert.equal(retry.phase,"ACKNOWLEDGED");
    assert.deepEqual(h.store.get(h.commitPath).acknowledgedRoles,["playerOne","playerTwo"]);
    ok("C2 the adapter's single re-read-and-retry from the fresh revision reaches ACKNOWLEDGED with both roles");
  }
  // C3 mirror ordering.
  {
    const h=await committed();let nik=null;
    interleave(h,async()=>{nik=await Provider.acknowledgeSeason({...h.options("playerTwo"),operationId:commitOp(12),baseRevision:1});});
    const daniel=await Provider.acknowledgeSeason({...h.options("playerOne"),operationId:commitOp(13),baseRevision:1});
    assert.equal(nik?.ok,true,JSON.stringify(nik));assert.equal(daniel.code,"SEASON_COMMIT_STALE_BASE_REVISION");
    ok("C3 the mirror ordering (Nik lands inside Daniel's transaction) is also STALE");
  }
  // C4 a denial with no concurrent change stays permission-denied.
  {
    const h=await committed();h.hooks.denyNext=true;
    const nik=await Provider.acknowledgeSeason({...h.options("playerTwo"),operationId:commitOp(21),baseRevision:1});
    assert.equal(nik.ok,false);assert.equal(nik.code,"permission-denied","an unproven denial must never be remapped");
    assert.equal(h.store.get(h.commitPath).revision,1);
    ok("C4 permission-denied with the commit unchanged (no concurrent advance) surfaces unchanged");
  }
  // C5 concurrent advance, but the actor lost authority in the gap: fresh read fails, denial stays.
  {
    const h=await committed();
    interleave(h,async()=>{const d=await Provider.acknowledgeSeason({...h.options("playerOne"),operationId:commitOp(32),baseRevision:1});assert.equal(d.ok,true);h.store.get(h.key("accounts",uid2,"devices",device2)).data.state="revoked";});
    const nik=await Provider.acknowledgeSeason({...h.options("playerTwo"),operationId:commitOp(33),baseRevision:1});
    assert.equal(nik.code,"permission-denied","a revoked device must never be told to retry");
    ok("C5 concurrent advance plus revoked actor device stays permission-denied");
  }
  // C6 a read-side denial (no write attempted) is never remapped.
  {
    const h=await committed();h.hooks.denyReads=true;
    const nik=await Provider.acknowledgeSeason({...h.options("playerTwo"),operationId:commitOp(41),baseRevision:1});
    assert.equal(nik.code,"permission-denied");
    ok("C6 a permission-denied read (no write queued) is surfaced unchanged");
  }
  // C7 the production adapter still owns exactly one bounded STALE retry for the acknowledgement.
  {
    const adapter=fs.readFileSync(path.join(__dirname,"../../js/productionSharedSeasonCommit.js"),"utf8");
    assert.match(adapter,/for\(let attempt=0;attempt<2;attempt\+=1\)/,"adapter keeps a two-attempt ceiling");
    assert.match(adapter,/result\?\.code==="SEASON_COMMIT_STALE_BASE_REVISION"&&attempt===0/,"adapter retries STALE exactly once after a fresh read");
    const provider=fs.readFileSync(path.join(__dirname,"../../js/sparkSharedSeasonCommit.js"),"utf8");
    assert.match(provider,/fresh\.revision>seenRevision/,"provider remaps only after proving the stored commit advanced");
    ok("C7 the adapter keeps its single bounded STALE retry and the provider requires a proven advance");
  }
  console.log(`PASS Shared Season Commit concurrent acknowledgement (${checks} checks): a rival acknowledgement landing inside this manager's transaction becomes a retryable STALE only after a fresh authority-checked read proves the commit advanced; unproven or unauthorized denials stay permission-denied.`);
})().catch(error=>{console.error(error);process.exitCode=1;});

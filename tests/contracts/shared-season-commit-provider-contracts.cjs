const assert=require("node:assert/strict");
const {webcrypto}=require("node:crypto");
const Results=require("../../js/sharedSeasonResults.js");
const Provider=require("../../js/sparkSharedSeasonCommit.js");

const rivalryId="pair_"+("5".repeat(64));
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
  put(key("rivalries",rivalryId),{objectType:"rivalry",objectId:rivalryId,lifecycleState:"live",data:{connectionState:"active",authorizedAccountIds:[uid1,uid2],managerSlots:[{slotId:"playerOne",accountId:uid1,profileId:"profile_"+("1".repeat(24)),saveId:"save_"+("3".repeat(24)),entitlementState:"active"},{slotId:"playerTwo",accountId:uid2,profileId:"profile_"+("2".repeat(24)),saveId:"save_"+("4".repeat(24)),entitlementState:"active"}]}});
  put(key("rivalries",rivalryId,"sessions",sessionId),{objectType:"session",objectId:sessionId,lifecycleState:"live",data:{rivalryId,state:"active",hostAccountId:uid1,memberAccountIds:[uid1,uid2],expiresAt:ts(9_000_000)}});
  const setupOps=[1,2,3,4,5,6].map(n=>"setup_op_"+n.toString(16).padStart(32,"0"));
  const setup={schemaVersion:1,objectType:"sharedSetupLedger",rivalryId,revision:6,phase:"SHOWDOWN_CONFIRMED",coordinatorRole:"playerOne",operationIds:setupOps,operationTypes:["open","commit-league","commit-clubs","commit-length","confirm","confirm"],baseRevisions:[0,1,2,3,4,5],actorRoles:["playerOne","playerOne","playerOne","playerOne","playerOne","playerTwo"],totalSeasons:3,confirmedRoles:["playerOne","playerTwo"],activeSessionId:sessionId,updatedAt:ts(1_000_000),updatedByDeviceId:device2};
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
  const impossible=await createHarness();impossible.store.get(impossible.p1Path).result.leaguePoints=103;view=await Provider.read(impossible.options("playerOne",2_000_250));assert.equal(view.ok,false);assert.equal(view.code,"SEASON_COMMIT_RESULTS_INVALID","deterministically drawn Bundesliga must reject an impossible 103-point stored result before commit");
  const revoked=await createHarness();revoked.store.get(revoked.key("accounts",uid1,"devices",device1)).data.state="revoked";denied=await Provider.commitSeason({...revoked.options("playerOne"),operationId:commitOp(11),baseRevision:0});assert.equal(denied.ok,false);assert.equal(denied.code,"SEASON_COMMIT_DEVICE_INACTIVE");
  const expired=await createHarness();expired.store.get(expired.key("rivalries",rivalryId,"sessions",sessionId)).data.expiresAt=ts(1_000_000);const afterOldTtl=await Provider.commitSeason({...expired.options("playerOne",2_000_000),operationId:commitOp(12),baseRevision:0});assert.equal(afterOldTtl.ok,true);assert.equal(afterOldTtl.phase,"COMMITTED");
  const incomplete=await createHarness();incomplete.store.get(incomplete.publicPath).phase="COLLECTING";incomplete.store.get(incomplete.publicPath).revision=1;denied=await Provider.commitSeason({...incomplete.options("playerOne"),operationId:commitOp(13),baseRevision:0});assert.equal(denied.ok,false);assert.equal(denied.code,"SEASON_COMMIT_RESULTS_NOT_READY");

  // r48 browser load order: the real bootstrap can execute this provider before js/sharedSeasonResults.js.
  // Load the real file with no require/module (browser mode) while the protocol modules are absent,
  // attach them afterwards, and prove the very next read succeeds (it failed on production r47 with
  // SEASON_COMMIT_RESULTS_PROTOCOL_UNAVAILABLE on Daniel's device).
  {
    const vm=require("node:vm"),fs=require("node:fs"),path=require("node:path");
    const sandbox={console,TextEncoder,TextDecoder,crypto:webcrypto,setTimeout,clearTimeout};sandbox.globalThis=sandbox;vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(__dirname,"../../js/sparkSharedSeasonCommit.js"),"utf8"),sandbox,{filename:"sparkSharedSeasonCommit.js"});
    const BrowserProvider=sandbox.CareerModeSparkSharedSeasonCommit;assert.ok(BrowserProvider&&typeof BrowserProvider.read==="function","browser-mode provider must install on the page global");
    const early=await createHarness();const before=await BrowserProvider.read(early.options("playerOne"));assert.equal(before.ok,false,"without protocol modules a read must fail closed, never invent a view");
    for(const file of ["sharedShowdownCatalog.js","sharedShowdownSetup.js","sharedSeasonResults.js","sharedSeasonCommit.js"])vm.runInContext(fs.readFileSync(path.join(__dirname,"../../js",file),"utf8"),sandbox,{filename:file});
    for(const key of ["CareerModeSharedShowdownCatalog","CareerModeSharedShowdownSetup","CareerModeSharedSeasonResults","CareerModeSharedSeasonCommit"])assert.ok(sandbox[key],`${key} must install on the same page global`);
    const late=await createHarness();const after=await BrowserProvider.read(late.options("playerOne"));
    assert.equal(after.ok,true,`protocol modules loaded after the provider must be used on the next read (got ${after.code})`);assert.equal(after.phase,"RESULTS_READY");assert.equal(after.coordinatorRole,"playerOne");
    const committed=await BrowserProvider.commitSeason({...late.options("playerOne"),operationId:commitOp(40),baseRevision:0});assert.equal(committed.ok,true,`late-loaded protocols must also serve the commit write (got ${committed.code})`);
  }
  const bootstrap=require("node:fs").readFileSync(require("node:path").join(__dirname,"../../js/ssjr.js"),"utf8"),adapter=require("node:fs").readFileSync(require("node:path").join(__dirname,"../../js/productionSharedSeasonCommit.js"),"utf8");
  assert.ok(bootstrap.indexOf('"js/sharedSeasonResults.js"')>=0&&bootstrap.indexOf('"js/sharedSeasonResults.js"')<bootstrap.indexOf('"js/sparkSharedSeasonCommit.js"'),"bootstrap must load the Season Results protocol before the Season Commit provider");
  assert.ok(adapter.indexOf('"js/sharedSeasonResults.js"')>=0&&adapter.indexOf('"js/sharedSeasonResults.js"')<adapter.indexOf('"js/sparkSharedSeasonCommit.js"'),"the Commit adapter must load the Season Results protocol before its provider");
  assert.doesNotMatch(require("node:fs").readFileSync(require("node:path").join(__dirname,"../../js/sparkSharedSeasonCommit.js"),"utf8"),/const resultsModule=typeof require/,"the Commit provider must not capture the Results protocol at load time");

  console.log("PASS Shared Season Commit Spark provider: active account/device/two-manager rivalry/ACTIVE-session authority, authoritative r9 RESULTS_READY reconstruction, coordinator-only immutable commit, CAS/idempotency, two distinct acknowledgements, results-drift rejection, deterministic Bundesliga 103-point rejection, Spark-only zero billing, no scoring and no canonical Save mutation.");
})().catch(error=>{console.error(error);process.exitCode=1;});

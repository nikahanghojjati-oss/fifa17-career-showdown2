const assert=require("node:assert/strict");
const {webcrypto}=require("node:crypto");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");

// Keep the real browser modules and Firestore-shaped values in the same realm.
const sandbox={assert,webcrypto,crypto:webcrypto,TextEncoder,TextDecoder,console};
sandbox.globalThis=sandbox;vm.createContext(sandbox);
for(const file of ["sharedShowdownCatalog.js","sharedShowdownSetup.js","sharedSeasonResults.js","sharedSeasonCommit.js","sparkSharedSeasonCommit.js"]){
  vm.runInContext(fs.readFileSync(path.join(__dirname,"../../js",file),"utf8"),sandbox,{filename:file});
}

const verify=async function(){
const Results=globalThis.CareerModeSharedSeasonResults;
const Provider=globalThis.CareerModeSparkSharedSeasonCommit;
// Harness copied from shared-season-commit-provider-contracts.cjs.
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

  const h=await createHarness();
  const committed=await Provider.commitSeason({...h.options("playerOne"),operationId:commitOp(3),baseRevision:0});
  assert.equal(committed.ok,true,`initial commit must succeed: ${committed.code}`);
  const saved=h.store.get(h.commitPath);
  saved.results.playerOne=Object.fromEntries(Object.entries(saved.results.playerOne).reverse());
  assert.notDeepEqual(Object.keys(saved.results.playerOne),Object.keys(p1));
  assert.deepEqual(saved.results.playerOne,p1,"only field order changed");
  for(const role of ["playerOne","playerTwo"]){
    const view=await Provider.read(h.options(role,2_000_100));
    assert.equal(view.ok,true,`${role} must read identical reordered scores: ${view.code}`);
    assert.equal(view.committed,true);assert.equal(view.phase,"COMMITTED");
    assert.deepEqual(view.results,{playerOne:p1,playerTwo:p2});
  }
  const acknowledged=await Provider.acknowledgeSeason({...h.options("playerTwo",2_000_200),operationId:commitOp(4),baseRevision:1});
  assert.equal(acknowledged.ok,true,`rival acknowledgement must accept reordered scores: ${acknowledged.code}`);
  assert.equal(acknowledged.revision,2);assert.equal(acknowledged.phase,"COMMITTED");
  assert.deepEqual(h.store.get(h.commitPath).acknowledgedRoles,["playerTwo"]);

  // A real score change remains rejected, including on the write path.
  h.store.get(h.commitPath).results.playerOne.leaguePoints=99;
  const before=JSON.stringify(h.store.get(h.commitPath));
  for(const role of ["playerOne","playerTwo"]){
    const view=await Provider.read(h.options(role,2_000_300));
    assert.equal(view.ok,false);assert.equal(view.code,"SEASON_COMMIT_RESULTS_REVISION_MISMATCH");
  }
  const denied=await Provider.acknowledgeSeason({...h.options("playerOne",2_000_400),operationId:commitOp(5),baseRevision:2});
  assert.equal(denied.ok,false);assert.equal(denied.code,"SEASON_COMMIT_RESULTS_REVISION_MISMATCH");
  assert.equal(JSON.stringify(h.store.get(h.commitPath)),before,"score mismatch must not mutate the stored commit");
  console.log("PASS Season score key order: both manager reads and rival acknowledgement accept identical reordered fields; real score drift rejects reads and writes without mutation.");
};
vm.runInContext(`(${verify.toString()})()`,sandbox,{filename:"season-score-key-order-sandbox.cjs"})
  .catch(error=>{console.error(error);process.exitCode=1;});

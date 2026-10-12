"use strict";
const assert=require("node:assert/strict");
const {webcrypto}=require("node:crypto");
const factory=require("../../js/sharedJourneyConflicts.js");

const authority={
  accountId:"account_one",
  deviceId:"device_"+"c".repeat(32),
  rivalryId:"pair_"+"a".repeat(64),
  sessionId:"session_"+"b".repeat(64),
  managerRole:"playerOne"
};
const attempt=(intent,nowEpochMs)=>({
  surface:"shared-setup",
  action:"commit-length",
  operationId:"setup_op_"+"1".repeat(32),
  baseRevision:3,
  authority,
  intent,
  nowEpochMs
});

(async()=>{
  const guard=factory.createGuard({cryptoImpl:webcrypto,receiptTtlMs:5000});
  let providerCalls=0;
  const invoke=async()=>{providerCalls+=1;return {ok:true,revision:4};};

  const accepted=await guard.execute(attempt({totalSeasons:3},1000),invoke);
  assert.equal(accepted.ok,true);
  assert.equal(providerCalls,1);

  const altered=attempt({totalSeasons:5},1100);
  await assert.rejects(
    ()=>guard.execute(altered,invoke),
    error=>error.code==="JOURNEY_CONFLICT_REPLAY_ALTERED",
    "the first altered operation must be blocked"
  );
  assert.equal(guard.getLastReceipt().classification,"REPLAY_ALTERED");
  assert.equal(providerCalls,1);

  await assert.rejects(
    ()=>guard.execute(attempt({totalSeasons:5},1200),invoke),
    error=>error.code==="JOURNEY_CONFLICT_REPLAY_ALTERED",
    "repeating an already-rejected altered operation must stay blocked"
  );
  assert.equal(providerCalls,1,"a replay denial must not turn into a second provider action");
  assert.equal(guard.getLastReceipt().classification,"REPLAY_ALTERED");

  console.log("PASS Journey Conflicts: repeated altered-operation replay cannot reach the provider.");
})().catch(error=>{console.error(error);process.exitCode=1;});

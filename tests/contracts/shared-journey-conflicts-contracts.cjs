const assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const factory=require('../../js/sharedJourneyConflicts.js');

const pair='pair_'+'a'.repeat(64);
const session='session_'+'b'.repeat(64);
const device='device_'+'c'.repeat(32);
const authority={accountId:'account_one',deviceId:device,rivalryId:pair,sessionId:session,managerRole:'playerOne'};
const attempt=(overrides={})=>({surface:'shared-setup',action:'commit-length',operationId:'setup_op_'+'1'.repeat(32),baseRevision:3,authority,intent:{totalSeasons:3},nowEpochMs:1000,...overrides});

(async()=>{
  assert.equal(factory.runtimeRevision,'1.9.1-r15');
  assert.equal(factory.providerAuthorityPreserved,true);
  assert.equal(factory.nonAuthorizingReceipts,true);
  assert.equal(factory.canonicalStorageMutation,false);
  assert.equal(factory.providerWriteRequired,false);
  assert.equal(factory.listPermissionRequired,false);
  assert.equal(factory.billingRequired,false);

  const guard=factory.createGuard({cryptoImpl:webcrypto,receiptTtlMs:5000});
  let calls=0;
  const accepted={ok:true,status:'accepted',revision:4};
  assert.strictEqual(await guard.execute(attempt(),async()=>{calls+=1;return accepted;}),accepted,'provider success object must be returned unchanged');
  assert.equal(calls,1);
  let receipt=guard.getLastReceipt();
  assert.equal(receipt.classification,'ACCEPTED');
  assert.equal(receipt.providerCode,null);
  assert.equal(receipt.providerInvoked,true);
  assert.equal(receipt.authoritative,false);
  assert.equal(receipt.retryCount,0);
  assert.equal(guard.verifyReceipt(receipt).attemptHash,receipt.attemptHash);

  // Exact same replay is allowed to reach the provider; provider idempotency remains authoritative.
  const replay={ok:true,status:'replayed',revision:4};
  assert.strictEqual(await guard.execute(attempt({nowEpochMs:1500}),async()=>{calls+=1;return replay;}),replay);
  assert.equal(calls,2);
  assert.equal(guard.getLastReceipt().classification,'ACCEPTED');

  // Accepted operation identity cannot be altered after the fact.
  await assert.rejects(()=>guard.execute(attempt({baseRevision:4,nowEpochMs:1600}),async()=>{calls+=1;return accepted;}),error=>error.code==='JOURNEY_CONFLICT_REPLAY_ALTERED');
  assert.equal(calls,2,'altered replay must be rejected before another provider call');
  receipt=guard.getLastReceipt();
  assert.equal(receipt.classification,'REPLAY_ALTERED');
  assert.equal(receipt.providerInvoked,false);

  // One bounded stale-CAS retry may advance the base revision under the same immutable operation intent.
  guard.reset();calls=0;
  const staleAttempt=attempt({surface:'season-commit',action:'commit-season',operationId:'season_commit_op_'+'2'.repeat(32),baseRevision:0,intent:{seasonNumber:1},nowEpochMs:2000});
  const stale={ok:false,code:'SEASON_COMMIT_STALE_BASE_REVISION'};
  assert.strictEqual(await guard.execute(staleAttempt,async()=>{calls+=1;return stale;}),stale);
  assert.equal(guard.getLastReceipt().classification,'STALE');
  const retry={...staleAttempt,baseRevision:1,nowEpochMs:2100};
  assert.strictEqual(await guard.execute(retry,async()=>{calls+=1;return accepted;}),accepted);
  assert.equal(calls,2);
  assert.equal(guard.getLastReceipt().classification,'ACCEPTED');
  assert.equal(guard.getLastReceipt().retryCount,1);
  await assert.rejects(()=>guard.execute({...retry,baseRevision:2,nowEpochMs:2200},async()=>{calls+=1;return accepted;}),error=>error.code==='JOURNEY_CONFLICT_REPLAY_ALTERED');
  assert.equal(calls,2,'a second changed-base attempt is not a bounded stale retry');

  // Altering authority or intent under the same operation is never treated as replay recovery.
  guard.reset();calls=0;
  await guard.execute(attempt({nowEpochMs:3000}),async()=>{calls+=1;return accepted;});
  await assert.rejects(()=>guard.execute(attempt({nowEpochMs:3100,authority:{...authority,managerRole:'playerTwo'}}),async()=>{calls+=1;return accepted;}),error=>error.code==='JOURNEY_CONFLICT_REPLAY_ALTERED');
  await assert.rejects(()=>guard.execute(attempt({nowEpochMs:3200,intent:{totalSeasons:5}}),async()=>{calls+=1;return accepted;}),error=>error.code==='JOURNEY_CONFLICT_REPLAY_ALTERED');
  assert.equal(calls,1);

  // Conflict receipts expire and cannot silently become authority for a late retry.
  guard.reset();calls=0;
  await guard.execute(attempt({nowEpochMs:4000}),async()=>{calls+=1;return accepted;});
  await assert.rejects(()=>guard.execute(attempt({nowEpochMs:9000}),async()=>{calls+=1;return accepted;}),error=>error.code==='JOURNEY_CONFLICT_RECEIPT_EXPIRED');
  assert.equal(calls,1);
  assert.equal(guard.getLastReceipt().classification,'RECEIPT_EXPIRED');
  assert.equal(guard.getLastReceipt().providerInvoked,false);

  // Provider denials keep their original code while the guard adds only non-authorizing classification.
  guard.reset();
  const unauthorized={ok:false,code:'SETUP_DEVICE_INACTIVE'};
  assert.strictEqual(await guard.execute(attempt({operationId:'setup_op_'+'3'.repeat(32),nowEpochMs:10000}),async()=>unauthorized),unauthorized);
  assert.equal(guard.getLastReceipt().classification,'UNAUTHORIZED');
  assert.equal(guard.getLastReceipt().providerCode,'SETUP_DEVICE_INACTIVE');
  const quota={ok:false,code:'resource-exhausted'};
  assert.strictEqual(await guard.execute(attempt({operationId:'setup_op_'+'4'.repeat(32),nowEpochMs:10100}),async()=>quota),quota);
  assert.equal(guard.getLastReceipt().classification,'QUOTA');
  assert.equal(guard.getLastReceipt().providerCode,'resource-exhausted');

  // Thrown provider errors are recorded but rethrown unchanged.
  const thrown=Object.assign(new Error('quota'),{code:'resource-exhausted'});
  await assert.rejects(()=>guard.execute(attempt({operationId:'setup_op_'+'5'.repeat(32),nowEpochMs:10200}),async()=>{throw thrown;}),error=>error===thrown);
  assert.equal(guard.getLastReceipt().classification,'QUOTA');
  assert.equal(guard.getLastReceipt().providerInvoked,true);

  // Two managers may independently observe contention on the same rivalry without sharing client authority.
  const peerGuard=factory.createGuard({cryptoImpl:webcrypto,receiptTtlMs:5000});
  const peerAuthority={accountId:'account_two',deviceId:'device_'+'d'.repeat(32),rivalryId:pair,sessionId:'session_'+'e'.repeat(64),managerRole:'playerTwo'};
  const peerAttempt={surface:'season-commit',action:'acknowledge-season',operationId:'season_commit_op_'+'6'.repeat(32),baseRevision:1,authority:peerAuthority,intent:{seasonNumber:1},nowEpochMs:11000};
  await peerGuard.execute(peerAttempt,async()=>({ok:false,code:'SEASON_COMMIT_STALE_BASE_REVISION'}));
  assert.equal(peerGuard.getLastReceipt().classification,'STALE');
  assert.equal(guard.getLastReceipt().authorityKey.includes('account_two'),false,'manager conflict receipts remain isolated per client guard');

  console.log('PASS Journey Conflicts deterministic contract: exact replay, one bounded stale retry, altered-replay pre-provider denial, receipt expiry, revocation/quota classification, provider-code preservation and non-authorizing client receipts.');
})().catch(error=>{console.error(error);process.exitCode=1;});

const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const connected=require("../../js/sparkConnectedRivalry.js");

function stage4SaveRuntime(){
  const creatorSave="save_111111111111111111111111";
  const localSave="save_222222222222222222222222";
  const p1="profile_aaaaaaaaaaaaaaaaaaaaaaaa";
  const p2="profile_bbbbbbbbbbbbbbbbbbbbbbbb";
  const snapshot={
    schemaVersion:1,
    activeSaveId:localSave,
    profiles:[
      {schemaVersion:1,profileId:p1,displayName:"Hawk"},
      {schemaVersion:1,profileId:p2,displayName:"Rival"}
    ],
    saves:[{
      saveId:localSave,
      showdown:{
        id:"local-record",
        status:"Ready",
        currentRound:2,
        totalRounds:3,
        managers:{playerOne:"Hawk",playerTwo:"Rival"},
        identity:{
          schemaVersion:1,
          saveId:localSave,
          managerProfileIds:{playerOne:p1,playerTwo:p2}
        },
        rounds:[
          {roundNumber:1,seasonId:"season_111111111111111111111111",winner:"playerOne"},
          {roundNumber:2,seasonId:"season_222222222222222222222222",winner:null}
        ]
      }
    }]
  };
  return {
    creatorSave,
    localSave,
    p1,
    p2,
    runtime:{
      isReady:()=>true,
      getLibrarySnapshot:()=>structuredClone(snapshot)
    }
  };
}

function stage4Rivalry(fixture){
  return {
    schemaVersion:1,
    objectType:"rivalry",
    objectId:`pair_${"d".repeat(64)}`,
    revision:1,
    parentRevision:0,
    lifecycleState:"live",
    contentHash:`sha256:${"1".repeat(64)}`,
    priorContentHash:`sha256:${"0".repeat(64)}`,
    updatedAt:null,
    updatedByAccountId:"acct_b",
    updatedByDeviceId:`device_${"b".repeat(32)}`,
    data:{
      connectionState:"active",
      connectionStateBeforeDeletion:null,
      managerSlots:[
        {slotId:"playerOne",accountId:"acct_a",profileId:fixture.p1,saveId:fixture.creatorSave,displayLabel:"Hawk",entitlementState:"active",deletionConsent:false},
        {slotId:"playerTwo",accountId:"acct_b",profileId:fixture.p2,saveId:fixture.localSave,displayLabel:"Rival",entitlementState:"active",deletionConsent:false}
      ],
      authorizedAccountIds:["acct_a","acct_b"],
      createdByAccountId:"acct_a",
      createdAt:null
    },
    tombstone:null
  };
}

(async()=>{
  assert.equal(connected.contractVersion,1);
  assert.equal(connected.feature,"connected-rivalry-shared-state-first-slice");
  assert.equal(connected.pointerStorage,"indexeddb-private-convenience-only");
  assert.equal(connected.persistentFirestoreCache,false);
  assert.equal(connected.publicDiscovery,false);
  assert.equal(connected.gameplaySync,true);
  assert.equal(connected.localApply,false);
  assert.equal(connected.remoteJoiningSessions,false);
  assert.equal(connected.billingRequired,false);
  assert.deepEqual(Array.from(connected.canonicalStorageKeys),[
    "careerModeShowdown.saveLibrary",
    "careerModeShowdown.legacyShowdowns",
    "careerModeShowdown.preferences"
  ]);
  assert.equal(connected.idempotencyRetentionMs,7*24*60*60*1000);

  const source=fs.readFileSync("js/sparkConnectedRivalry.js","utf8");
  assert.doesNotMatch(source,/\blocalStorage\b/);
  assert.doesNotMatch(source,/getDocs|collection\s*\(/,"Connected Rivalry must never discover/list rivalries.");
  assert.doesNotMatch(source,/sessions\/|sessionId|private-session/,"Stage 4 first slice must not implement Remote Joining sessions.");
  assert.match(source,/STALE_BASE_REVISION/);
  assert.match(source,/IDEMPOTENCY_CONFLICT/);
  assert.match(source,/TOMBSTONE_RESTORE_REQUIRED/);
  assert.match(source,/expectedStateExists/);
  assert.match(source,/mutationReceipt/);

  const rivalryId=`pair_${"c".repeat(64)}`;
  assert.equal(connected.normalizeRivalryId(`  ${rivalryId.toUpperCase()}  `),rivalryId);
  assert.throws(()=>connected.normalizeRivalryId("pair_short"),/exact private rivalry code/i);

  const fixture=stage4SaveRuntime();
  const rivalry=stage4Rivalry(fixture);
  const binding={
    saveId:fixture.localSave,
    profileId:fixture.p2,
    managerRole:"playerTwo",
    displayLabel:"Rival"
  };
  const projection=connected.buildProjection(rivalry,binding,fixture.runtime);
  assert.equal(projection.saveId,fixture.creatorSave,"Creator slot saveId is the deterministic remote shared Save identity.");
  assert.deepEqual(projection.managerBindings,[
    {slotId:"playerOne",profileId:fixture.p1},
    {slotId:"playerTwo",profileId:fixture.p2}
  ]);
  assert.deepEqual(projection.seasonIds,[
    "season_111111111111111111111111",
    "season_222222222222222222222222"
  ]);
  assert.equal(projection.activeSeasonId,"season_222222222222222222222222");
  assert.equal(projection.payload.identity.saveId,fixture.creatorSave);
  assert.deepEqual(projection.payload.identity.managerProfileIds,{
    playerOne:fixture.p1,
    playerTwo:fixture.p2
  });
  assert.equal(fixture.runtime.getLibrarySnapshot().saves[0].showdown.identity.saveId,fixture.localSave,"Projection must not mutate the local Save Library snapshot.");

  const deviceId=`device_${"b".repeat(32)}`;
  const plan=await connected.buildMutationPlan({
    rivalryId:rivalry.objectId,
    rivalryValue:rivalry,
    binding,
    accountId:"acct_b",
    deviceId,
    expectedStateExists:true,
    baseRevision:4,
    idempotencyKey:"fixed-key",
    saveRuntime:fixture.runtime,
    cryptoImpl:crypto.webcrypto
  });
  assert.equal(plan.operation,"update");
  assert.equal(plan.baseRevision,4);
  assert.equal(plan.expectedStateExists,true);
  assert.match(plan.idempotencyKeyHash,/^[0-9a-f]{64}$/);
  assert.match(plan.requestFingerprint,/^sha256:[0-9a-f]{64}$/);
  assert.equal(plan.idempotencyKey,"fixed-key");
  assert.ok(Object.isFrozen(plan));
  assert.ok(Object.isFrozen(plan.projection));

  const replayPlan=await connected.buildMutationPlan({
    rivalryId:rivalry.objectId,
    rivalryValue:rivalry,
    binding,
    accountId:"acct_b",
    deviceId,
    expectedStateExists:true,
    baseRevision:4,
    idempotencyKey:"fixed-key",
    saveRuntime:fixture.runtime,
    cryptoImpl:crypto.webcrypto
  });
  assert.equal(replayPlan.idempotencyKeyHash,plan.idempotencyKeyHash);
  assert.equal(replayPlan.requestFingerprint,plan.requestFingerprint,"Provider retries must preserve the exact mutation fingerprint.");

  const createPlan=await connected.buildMutationPlan({
    rivalryId:rivalry.objectId,
    rivalryValue:rivalry,
    binding,
    accountId:"acct_b",
    deviceId,
    expectedStateExists:false,
    baseRevision:0,
    idempotencyKey:"first-publish",
    saveRuntime:fixture.runtime,
    cryptoImpl:crypto.webcrypto
  });
  assert.equal(createPlan.operation,"create");
  assert.equal(createPlan.baseRevision,0);
  await assert.rejects(
    connected.buildMutationPlan({
      rivalryId:rivalry.objectId,
      rivalryValue:rivalry,
      binding,
      accountId:"acct_b",
      deviceId,
      expectedStateExists:false,
      baseRevision:1,
      idempotencyKey:"bad-base",
      saveRuntime:fixture.runtime,
      cryptoImpl:crypto.webcrypto
    }),
    /Initial shared-state publication/
  );

  const validPointer={
    schemaVersion:1,
    accountId:"acct_b",
    rivalryId:rivalry.objectId,
    saveId:binding.saveId,
    profileId:binding.profileId,
    managerRole:binding.managerRole,
    deviceId,
    attachedAtEpochMs:Date.now()
  };
  assert.equal(connected.validPointer(validPointer),true);
  assert.equal(connected.validPointer({...validPointer,rivalryId:"bad"}),false);

  const remoteContract=fs.readFileSync("js/cloudSyncRemoteContract.js","utf8");
  assert.match(remoteContract,/mutationReceipt/,"Protected remote contract must name the rule-verifiable Stage 4 mutation receipt.");
  const rules=fs.readFileSync("firestore.spark.rules","utf8");
  assert.match(rules,/validSharedStateCreate/);
  assert.match(rules,/validSharedStateUpdate/);
  assert.match(rules,/validIdempotencyCreate/);
  assert.match(rules,/mutationReceipt/);
  assert.match(rules,/match \/sessions\/\{sessionId\}[\s\S]+allow list, create, update, delete: if false;/);

  const app=fs.readFileSync("js/app.js","utf8");
  const connectedAccount=fs.readFileSync("js/sparkConnectedAccount.js","utf8");
  const worker=fs.readFileSync("service-worker.js","utf8");
  assert.doesNotMatch(app,/sparkConnectedRivalry\.js/,"Connected Rivalry must not race the lazy account/pairing lifecycle at local startup.");
  assert.match(connectedAccount,/SPARK_CONNECTED_RIVALRY_PATH="js\/sparkConnectedRivalry\.js"/);
  assert.match(connectedAccount,/await sparkConnectedLoadPrivatePairingScript\(\)[\s\S]*await sparkConnectedLoadRivalryScript\(\)/,"Connected Rivalry must load only after the Private Pairing module exists.");
  assert.match(worker,/js\/sparkConnectedRivalry\.js/);

  process.stdout.write("PASS Stage 4 Connected Rivalry client contract: private exact attachment, deterministic projection, immutable CAS/replay plan, lazy prerequisite lifecycle, local-first recovery, and Stage 5 lock\n");
})().catch(error=>{
  process.stderr.write(`${error&&error.stack?error.stack:error}\n`);
  process.exit(1);
});

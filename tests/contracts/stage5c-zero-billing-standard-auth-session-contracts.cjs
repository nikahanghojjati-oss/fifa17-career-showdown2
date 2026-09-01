const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const session=require("../../js/sparkStandardAuthPrivateSession.js");

class FakeTimestamp{
  constructor(ms){this.ms=ms;}
  toMillis(){return this.ms;}
  static fromMillis(ms){return new FakeTimestamp(ms);}
}

function snapshot(value){return {exists:()=>value!==undefined,data:()=>value};}
function hash(seed="0"){return `sha256:${seed.repeat(64).slice(0,64)}`;}
function deviceId(seed){return `device_${seed.repeat(32).slice(0,32)}`;}

function envelope(objectType,objectId,accountId,currentDeviceId,data,seed="0"){
  return {
    schemaVersion:1,
    objectType,
    objectId,
    revision:0,
    parentRevision:null,
    lifecycleState:"live",
    contentHash:hash(seed),
    priorContentHash:null,
    updatedAt:FakeTimestamp.fromMillis(1_800_000_000_000),
    updatedByAccountId:accountId,
    updatedByDeviceId:currentDeviceId,
    data,
    tombstone:null
  };
}

function createHarness(){
  const docs=new Map();
  const firestore={name:"stage5c-memory"};
  const sdk={
    Timestamp:FakeTimestamp,
    doc(_firestore,...parts){return {path:parts.join("/")};},
    async runTransaction(_firestore,callback){
      const staged=new Map();
      const transaction={
        async get(ref){return snapshot(staged.has(ref.path)?staged.get(ref.path):docs.get(ref.path));},
        set(ref,value){staged.set(ref.path,value);}
      };
      const result=await callback(transaction);
      for(const [path,value] of staged)docs.set(path,value);
      return result;
    }
  };
  return {docs,firestore,sdk};
}

function seedAuthority(h,rivalryId){
  const accountA="acct_stage5c_a";
  const accountB="acct_stage5c_b";
  const accountC="acct_stage5c_c";
  const deviceA=deviceId("a");
  const deviceB=deviceId("b");
  const deviceC=deviceId("c");
  const createdAt=FakeTimestamp.fromMillis(1_800_000_000_000);
  for(const [accountId,currentDeviceId,seed] of [
    [accountA,deviceA,"a"],
    [accountB,deviceB,"b"],
    [accountC,deviceC,"c"]
  ]){
    h.docs.set(`accounts/${accountId}`,envelope("account",accountId,accountId,null,{
      status:"active",createdAt,deletionRequestedAt:null
    },seed));
    h.docs.set(`accounts/${accountId}/devices/${currentDeviceId}`,envelope("device",currentDeviceId,accountId,currentDeviceId,{
      deviceId:currentDeviceId,
      installationId:`installation_${seed.repeat(32)}`,
      displayLabel:null,
      state:"active",
      registeredAt:createdAt,
      lastSeenAt:createdAt,
      revokedAt:null
    },seed));
  }
  h.docs.set(`rivalries/${rivalryId}`,envelope("rivalry",rivalryId,accountA,deviceA,{
    connectionState:"active",
    connectionStateBeforeDeletion:null,
    managerSlots:[
      {slotId:"playerOne",accountId:accountA,profileId:`profile_${"a".repeat(24)}`,saveId:`save_${"a".repeat(24)}`,displayLabel:"Host",entitlementState:"active",deletionConsent:false},
      {slotId:"playerTwo",accountId:accountB,profileId:`profile_${"b".repeat(24)}`,saveId:`save_${"b".repeat(24)}`,displayLabel:"Peer",entitlementState:"active",deletionConsent:false}
    ],
    authorizedAccountIds:[accountA,accountB],
    createdByAccountId:accountA,
    createdAt
  },"d"));
  return {accountA,accountB,accountC,deviceA,deviceB,deviceC};
}

function operation(h,authority,accountKey,deviceKey,rivalryId,sessionId,nowEpochMs){
  return {
    user:{uid:authority[accountKey]},
    deviceId:authority[deviceKey],
    rivalryId,
    sessionId,
    firestore:h.firestore,
    firebaseSdk:h.sdk,
    cryptoImpl:crypto.webcrypto,
    nowEpochMs
  };
}

(async()=>{
  assert.equal(session.contractVersion,1);
  assert.equal(session.feature,"stage5c-zero-billing-standard-auth-session-adapter");
  assert.equal(session.protocolState,"candidate-emulator-boundary");
  assert.equal(session.providerIdentity,"standard-firebase-request-auth-uid");
  assert.equal(session.productionAuthProviderPolicy,"existing-google-popup-only");
  assert.equal(session.authPersistence,"browserSessionPersistence");
  assert.equal(session.additionalOAuthScopes,false);
  assert.equal(session.customTokenRequired,false);
  assert.equal(session.customDeviceClaimsRequired,false);
  assert.equal(session.deviceAuthority,"account-owned-registered-device-mutation-metadata");
  assert.equal(session.deviceProviderBound,false);
  assert.equal(session.deviceCryptographicIdentity,false);
  assert.equal(session.memoryOnly,true);
  assert.equal(session.persistentFirestoreCache,false);
  assert.equal(session.localFirstFallback,true);
  assert.equal(session.quotaFailureMode,"fail-closed-local-play-remains-available");
  assert.equal(session.billingRequired,false);
  assert.equal(session.billingUpgradeAllowed,false);
  assert.equal(session.publicDiscovery,false);
  assert.equal(session.collectionListing,false);
  assert.equal(session.exactlyTwoAccounts,true);
  assert.equal(session.productionRulesPublished,false);
  assert.equal(session.hostJoinUxExposed,false);
  assert.equal(session.gameplayMutation,false);
  assert.equal(session.canonicalStorageMutation,false);
  assert.equal(session.candidateCInvolved,false);
  assert.equal(session.exactCapabilityBits,256);
  assert.deepEqual(Array.from(session.sessionStates),["open","active","revoked","expired","closed"]);

  const adapterSource=fs.readFileSync("js/sparkStandardAuthPrivateSession.js","utf8");
  const protocolSource=fs.readFileSync("js/sparkPrivateSession.js","utf8");
  assert.doesNotMatch(adapterSource,/\blocalStorage\b|\bindexedDB\b/);
  assert.doesNotMatch(adapterSource,/getIdTokenResult|device_credential_version|device_key_sha256|device_id/,
    "The standard-auth adapter must not fabricate or require custom device claims.");
  assert.match(protocolSource,/standard-auth-device-metadata[\s\S]+providerBound:false/);
  assert.doesNotMatch(adapterSource,/Cloud Run|setCustomUserClaims|signInWithCustomToken|createCustomToken/);
  assert.doesNotMatch(adapterSource,/CareerModeSaveLibrary|storageTransaction|Candidate C|candidate-c/i);
  assert.doesNotMatch(adapterSource,/\bcollection\s*\(|\bgetDocs\b/);
  for(const runtimeOwner of ["index.html","js/app.js","js/productionFirebaseRuntime.js","service-worker.js"]){
    assert.doesNotMatch(fs.readFileSync(runtimeOwner,"utf8"),/sparkStandardAuthPrivateSession\.js/,
      `${runtimeOwner} must not expose the pre-publication Stage 5C candidate.`);
  }

  const productionRules=fs.readFileSync("firestore.spark.rules","utf8");
  const candidateRules=fs.readFileSync("firestore.stage5c.rules","utf8");
  const rootFirebase=JSON.parse(fs.readFileSync("firebase.json","utf8"));
  const productionFirebase=JSON.parse(fs.readFileSync("firebase.production.rules.json","utf8"));
  assert.equal(rootFirebase.firestore.rules,"firestore.rules");
  assert.equal(productionFirebase.firestore.rules,"firestore.spark.rules");
  assert.doesNotMatch(JSON.stringify({rootFirebase,productionFirebase}),/stage5c/i);
  assert.match(productionRules,/match \/sessions\/\{sessionId\}[\s\S]+allow list, create, update, delete: if false;/);
  assert.match(candidateRules,/STAGE5C_CANDIDATE_SESSION_FUNCTIONS_BEGIN[\s\S]+registeredSessionDeviceMetadata[\s\S]+validOpenSessionCreate[\s\S]+validSessionJoin[\s\S]+validSessionUpdate[\s\S]+STAGE5C_CANDIDATE_SESSION_FUNCTIONS_END/);
  assert.match(candidateRules,/sessionWriteUsesRegisteredDeviceMetadata\(root\)[\s\S]+root\.updatedByAccountId == request\.auth\.uid[\s\S]+registeredSessionDeviceMetadata\(root\.updatedByDeviceId\)/);
  assert.doesNotMatch(candidateRules,/request\.auth\.token\.device_|deviceCredentials/,
    "Stage 5C Rules must use standard uid authority and must not depend on Stage 5B custom credentials.");
  assert.match(candidateRules,/STAGE5C_CANDIDATE_SESSION_MATCH_BEGIN[\s\S]+allow get: if sessionCanRead[\s\S]+allow create: if validOpenSessionCreate[\s\S]+allow update: if validSessionUpdate[\s\S]+allow list, delete: if false;[\s\S]+STAGE5C_CANDIDATE_SESSION_MATCH_END/);
  const productionSessionMatch=`      match /sessions/{sessionId} {
        allow get: if currentlyEntitled(rivalryId)
          && resource.data.data.memberAccountIds is list
          && request.auth.uid in resource.data.data.memberAccountIds;
        allow list, create, update, delete: if false;
      }`;
  const normalizedCandidate=candidateRules
    .replace(/    \/\/ STAGE5C_CANDIDATE_SESSION_FUNCTIONS_BEGIN[\s\S]*?    \/\/ STAGE5C_CANDIDATE_SESSION_FUNCTIONS_END\n\n/,"")
    .replace(/      \/\/ STAGE5C_CANDIDATE_SESSION_MATCH_BEGIN[\s\S]*?      \/\/ STAGE5C_CANDIDATE_SESSION_MATCH_END/,productionSessionMatch)
    .trimEnd();
  assert.equal(normalizedCandidate,productionRules.trimEnd(),
    "Stage 5C candidate Rules may differ from production only at the isolated session boundary.");

  const h=createHarness();
  const rivalryId=`pair_${"d".repeat(64)}`;
  const authority=seedAuthority(h,rivalryId);
  const now=1_800_100_000_000;
  const firstSessionId=`session_${"1".repeat(64)}`;
  const a=operation(h,authority,"accountA","deviceA",rivalryId,firstSessionId,now);
  const b=operation(h,authority,"accountB","deviceB",rivalryId,firstSessionId,now+1000);
  const c=operation(h,authority,"accountC","deviceC",rivalryId,firstSessionId,now+1000);

  const missingAuth=await session.openSession({...a,user:null,sessionId:`session_${"8".repeat(64)}`,ttlMs:60_000});
  assert.equal(missingAuth.ok,false);
  assert.equal(missingAuth.code,"PRIVATE_SESSION_AUTH_REQUIRED");
  const invalidDeviceId=await session.openSession({...a,deviceId:"device_invalid",sessionId:`session_${"9".repeat(64)}`,ttlMs:60_000});
  assert.equal(invalidDeviceId.ok,false);
  assert.equal(invalidDeviceId.code,"PRIVATE_SESSION_DEVICE_NOT_REGISTERED");

  const opened=await session.openSession({...a,ttlMs:60_000});
  assert.equal(opened.ok,true,JSON.stringify(opened));
  assert.equal(opened.state,"open");
  assert.equal(opened.revision,0);
  assert.deepEqual(opened.memberAccountIds,[authority.accountA]);
  const stored=h.docs.get(`rivalries/${rivalryId}/sessions/${firstSessionId}`);
  assert.equal(stored.updatedByAccountId,authority.accountA);
  assert.equal(stored.updatedByDeviceId,authority.deviceA);
  const replayedOpen=await session.openSession({...a,nowEpochMs:now+5000,ttlMs:30_000});
  assert.equal(replayedOpen.ok,true);
  assert.equal(replayedOpen.replayed,true);
  assert.equal(replayedOpen.expiresAtEpochMs,opened.expiresAtEpochMs);

  const peerRead=await session.readSession(b);
  assert.equal(peerRead.ok,true,JSON.stringify(peerRead));
  assert.equal(peerRead.state,"open");
  const thirdJoin=await session.joinSession(c);
  assert.equal(thirdJoin.ok,false);
  assert.equal(thirdJoin.code,"PRIVATE_SESSION_RIVALRY_NOT_ENTITLED");
  const selfJoin=await session.joinSession(a);
  assert.equal(selfJoin.ok,false);
  assert.equal(selfJoin.code,"PRIVATE_SESSION_HOST_CANNOT_JOIN");

  const joined=await session.joinSession(b);
  assert.equal(joined.ok,true,JSON.stringify(joined));
  assert.equal(joined.state,"active");
  assert.equal(joined.revision,1);
  assert.deepEqual(joined.memberAccountIds,[authority.accountA,authority.accountB]);
  const closed=await session.closeSession({...b,nowEpochMs:now+4000});
  assert.equal(closed.ok,true,JSON.stringify(closed));
  assert.equal(closed.state,"closed");
  assert.equal(closed.revision,2);
  const closedRetry=await session.closeSession({...b,nowEpochMs:now+5000});
  assert.equal(closedRetry.ok,true);
  assert.equal(closedRetry.replayed,true,"An exact same-target retry remains deterministic without another write.");
  const terminalResurrection=await session.joinSession({...b,nowEpochMs:now+6000});
  assert.equal(terminalResurrection.ok,false);
  assert.equal(terminalResurrection.code,"PRIVATE_SESSION_NOT_JOINABLE");

  const expiringSessionId=`session_${"2".repeat(64)}`;
  const expiring=operation(h,authority,"accountA","deviceA",rivalryId,expiringSessionId,now+10_000);
  assert.equal((await session.openSession({...expiring,ttlMs:1000})).ok,true);
  const premature=await session.expireSession({...expiring,nowEpochMs:now+10_999});
  assert.equal(premature.ok,false);
  assert.equal(premature.code,"PRIVATE_SESSION_NOT_EXPIRED");
  const expired=await session.expireSession({...expiring,nowEpochMs:now+11_001});
  assert.equal(expired.ok,true,JSON.stringify(expired));
  assert.equal(expired.state,"expired");
  assert.equal((await session.joinSession({...b,sessionId:expiringSessionId,nowEpochMs:now+12_000})).ok,false);

  const missingMetadataSession=`session_${"3".repeat(64)}`;
  const unknownDevice=deviceId("e");
  const missingMetadata=await session.openSession({
    ...a,deviceId:unknownDevice,sessionId:missingMetadataSession,nowEpochMs:now+20_000,ttlMs:60_000
  });
  assert.equal(missingMetadata.ok,false);
  assert.equal(missingMetadata.code,"PRIVATE_SESSION_DEVICE_NOT_REGISTERED");
  const deviceBPath=`accounts/${authority.accountB}/devices/${authority.deviceB}`;
  h.docs.get(deviceBPath).data.state="revoked";
  const revokedMetadata=await session.readSession({...b,sessionId:firstSessionId,nowEpochMs:now+21_000});
  assert.equal(revokedMetadata.ok,false);
  assert.equal(revokedMetadata.code,"PRIVATE_SESSION_DEVICE_REVOKED");
  h.docs.get(deviceBPath).data.state="active";
  h.docs.get(`accounts/${authority.accountA}`).data.status="disabled";
  const inactiveAccount=await session.openSession({
    ...a,sessionId:`session_${"4".repeat(64)}`,nowEpochMs:now+22_000,ttlMs:60_000
  });
  assert.equal(inactiveAccount.ok,false);
  assert.equal(inactiveAccount.code,"PRIVATE_SESSION_ACCOUNT_INACTIVE");
  h.docs.get(`accounts/${authority.accountA}`).data.status="active";

  const canonicalFixture={
    "careerModeShowdown.saveLibrary":"save-library-bytes",
    "careerModeShowdown.legacyShowdowns":"legacy-bytes",
    "careerModeShowdown.preferences":"preference-bytes"
  };
  const canonicalBefore=JSON.stringify(canonicalFixture);
  const docsBefore=JSON.stringify([...h.docs.entries()]);
  const quotaError=Object.assign(new Error("Spark no-cost quota exhausted"),{code:"resource-exhausted"});
  const quotaResult=await session.openSession({
    ...a,
    sessionId:`session_${"5".repeat(64)}`,
    nowEpochMs:now+30_000,
    ttlMs:60_000,
    firestore:{name:"quota-exhausted"},
    firebaseSdk:{
      Timestamp:FakeTimestamp,
      doc(_firestore,...parts){return {path:parts.join("/")};},
      async runTransaction(){throw quotaError;}
    }
  });
  assert.equal(quotaResult.ok,false);
  assert.equal(quotaResult.code,"resource-exhausted");
  assert.equal(JSON.stringify(canonicalFixture),canonicalBefore);
  assert.equal(JSON.stringify([...h.docs.entries()]),docsBefore);

  process.stdout.write("PASS Stage 5C standard-auth session adapter: Firebase uid authority, honest account-owned device metadata, exact no-list capability, two-account host/join lifecycle, terminal/expiry denial, memory-only quota safety, isolated candidate Rules and zero billing.\n");
})().catch(error=>{
  process.stderr.write(`${error&&error.stack?error.stack:error}\n`);
  process.exit(1);
});

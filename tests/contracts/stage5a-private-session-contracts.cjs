const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const session=require("../../js/sparkPrivateSession.js");

class FakeTimestamp{
  constructor(ms){this.ms=ms;}
  toMillis(){return this.ms;}
  static fromMillis(ms){return new FakeTimestamp(ms);}
}

function snapshot(value){
  return {exists:()=>value!==undefined,data:()=>value};
}

function createHarness(){
  const docs=new Map();
  const firestore={name:"stage5a-memory"};
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

function hash(seed="0"){
  return `sha256:${seed.repeat(64).slice(0,64)}`;
}

function envelope(objectType,objectId,accountId,deviceId,data,seed="0"){
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
    updatedByDeviceId:deviceId,
    data,
    tombstone:null
  };
}

function deviceId(seed){return `device_${seed.repeat(32).slice(0,32)}`;}

function seedAuthority(h,rivalryId){
  const accountA="acct_stage5a_a";
  const accountB="acct_stage5a_b";
  const accountC="acct_stage5a_c";
  const deviceA=deviceId("a");
  const deviceB=deviceId("b");
  const deviceC=deviceId("c");
  const accountData={status:"active",createdAt:FakeTimestamp.fromMillis(1_800_000_000_000),deletionRequestedAt:null};
  for(const [accountId,currentDevice,seed] of [
    [accountA,deviceA,"a"],
    [accountB,deviceB,"b"],
    [accountC,deviceC,"c"]
  ]){
    h.docs.set(`accounts/${accountId}`,envelope("account",accountId,accountId,null,{...accountData},seed));
    h.docs.set(`accounts/${accountId}/devices/${currentDevice}`,envelope("device",currentDevice,accountId,currentDevice,{
      deviceId:currentDevice,
      installationId:`installation_${seed.repeat(32)}`,
      displayLabel:null,
      state:"active",
      registeredAt:FakeTimestamp.fromMillis(1_800_000_000_000),
      lastSeenAt:FakeTimestamp.fromMillis(1_800_000_000_000),
      revokedAt:null
    },seed));
  }
  h.docs.set(`rivalries/${rivalryId}`,envelope("rivalry",rivalryId,accountA,deviceA,{
    connectionState:"active",
    connectionStateBeforeDeletion:null,
    managerSlots:[
      {slotId:"playerOne",accountId:accountA,profileId:`profile_${"a".repeat(24)}`,saveId:`save_${"a".repeat(24)}`,displayLabel:"Hawk",entitlementState:"active",deletionConsent:false},
      {slotId:"playerTwo",accountId:accountB,profileId:`profile_${"b".repeat(24)}`,saveId:`save_${"b".repeat(24)}`,displayLabel:"Rival",entitlementState:"active",deletionConsent:false}
    ],
    authorizedAccountIds:[accountA,accountB],
    createdByAccountId:accountA,
    createdAt:FakeTimestamp.fromMillis(1_800_000_000_000)
  },"d"));
  return {accountA,accountB,accountC,deviceA,deviceB,deviceC};
}

function operation(h,authority,accountKey,deviceKey,rivalryId,sessionId,nowEpochMs){
  const currentDeviceId=authority[deviceKey];
  return {
    user:{
      uid:authority[accountKey],
      async getIdTokenResult(){return {claims:{device_id:currentDeviceId}};}
    },
    deviceId:currentDeviceId,
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
  assert.equal(session.feature,"stage5a-private-session-protocol");
  assert.equal(session.protocolState,"candidate-emulator-boundary");
  assert.equal(session.memoryOnly,true);
  assert.equal(session.persistentFirestoreCache,false);
  assert.equal(session.publicDiscovery,false);
  assert.equal(session.collectionListing,false);
  assert.equal(session.providerDeviceCredentialRequired,true);
  assert.equal(session.providerDeviceCredentialClaim,"device_id");
  assert.equal(session.providerDeviceCredentialProductionProven,false);
  assert.equal(session.exactCapabilityBits,256);
  assert.equal(session.defaultSessionTtlMs,15*60*1000);
  assert.equal(session.maxSessionTtlMs,30*60*1000);
  assert.deepEqual(Array.from(session.sessionStates),["open","active","revoked","expired","closed"]);
  assert.equal(session.productionRulesPublished,false);
  assert.equal(session.hostJoinUxExposed,false);
  assert.equal(session.gameplayMutation,false);
  assert.equal(session.canonicalStorageMutation,false);
  assert.equal(session.candidateCInvolved,false);
  assert.equal(session.billingRequired,false);

  const generated=session.generateSessionId(crypto.webcrypto);
  assert.match(generated,/^session_[0-9a-f]{64}$/);
  assert.equal(session.normalizeSessionId(`  ${generated.toUpperCase()}  `),generated);
  assert.throws(()=>session.normalizeSessionId("session_short"),/exact private session code/i);

  const source=fs.readFileSync("js/sparkPrivateSession.js","utf8");
  assert.doesNotMatch(source,/\blocalStorage\b|\bindexedDB\b/,"Stage 5A client must remain memory-only.");
  assert.doesNotMatch(source,/CareerModeSaveLibrary|storageTransaction|Candidate C|candidate-c/i,"Stage 5A must not own local Save or Candidate C behavior.");
  assert.doesNotMatch(source,/\bcollection\s*\(|\bgetDocs\b/,"Stage 5A must use exact document capabilities and never discovery/listing.");
  assert.doesNotMatch(fs.readFileSync("js/sparkConnectedRivalry.js","utf8"),/sessions\/|sessionId|private-session/,"Stage 5A must remain separate from the protected Stage 4 module.");
  for(const runtimeOwner of ["js/app.js","js/sparkConnectedAccount.js","service-worker.js"]){
    assert.doesNotMatch(fs.readFileSync(runtimeOwner,"utf8"),/sparkPrivateSession\.js/,`${runtimeOwner} must not expose the pre-publication Stage 5A candidate.`);
  }

  const productionRules=fs.readFileSync("firestore.spark.rules","utf8");
  const stage5cRules=fs.readFileSync("firestore.stage5c.rules","utf8");
  const candidateRules=fs.readFileSync("firestore.stage5a.rules","utf8");
  const rootFirebase=JSON.parse(fs.readFileSync("firebase.json","utf8"));
  const productionFirebase=JSON.parse(fs.readFileSync("firebase.production.rules.json","utf8"));
  assert.equal(rootFirebase.firestore.rules,"firestore.rules");
  assert.equal(productionFirebase.firestore.rules,"firestore.spark.rules");
  assert.doesNotMatch(JSON.stringify({rootFirebase,productionFirebase}),/stage5a/i,"No deployment configuration may reference candidate session Rules.");
  assert.equal(productionRules,stage5cRules,"Stage 5D production source must preserve exact Stage 5C standard-auth Rules bytes.");
  assert.match(productionRules,/match \/sessions\/\{sessionId\}[\s\S]+allow get: if sessionCanRead\(rivalryId, sessionId\);[\s\S]+allow create: if validOpenSessionCreate\(rivalryId, sessionId\);[\s\S]+allow update: if validSessionUpdate\(rivalryId, sessionId\);[\s\S]+allow list, delete: if false;/,"Stage 5D production sessions must remain exact-path, lifecycle-scoped, non-listable and non-deletable.");
  assert.match(candidateRules,/STAGE5A_CANDIDATE_SESSION_FUNCTIONS_BEGIN[\s\S]+activeSessionDeviceCredential[\s\S]+validOpenSessionCreate[\s\S]+validSessionJoin[\s\S]+validSessionRevoke[\s\S]+validSessionClose[\s\S]+validSessionExpire[\s\S]+STAGE5A_CANDIDATE_SESSION_FUNCTIONS_END/);
  assert.match(candidateRules,/deviceCredentials/,
    "Candidate session Rules must load the provider credential authority document.");
  assert.match(candidateRules,/request\.auth\.token\.keys\(\)\.hasAll\(\[[\s\S]+"device_id"[\s\S]+"device_credential_version"[\s\S]+"device_key_sha256"/,
    "Candidate session Rules must require all key-bound device claims.");
  assert.match(candidateRules,/credential\.data\.data\.credentialVersion == request\.auth\.token\.device_credential_version[\s\S]+credential\.data\.data\.publicKeyFingerprint == request\.auth\.token\.device_key_sha256/,
    "Candidate session Rules must bind every accepted token to the active provider credential version and exact key fingerprint.");
  assert.match(candidateRules,/STAGE5A_CANDIDATE_SESSION_MATCH_BEGIN[\s\S]+allow get: if sessionCanRead[\s\S]+allow create: if validOpenSessionCreate[\s\S]+allow update: if validSessionUpdate[\s\S]+allow list, delete: if false;[\s\S]+STAGE5A_CANDIDATE_SESSION_MATCH_END/);

  const h=createHarness();
  const rivalryId=`pair_${"d".repeat(64)}`;
  const authority=seedAuthority(h,rivalryId);
  const now=1_800_100_000_000;
  const sessionOne=`session_${"1".repeat(64)}`;
  const aOne=operation(h,authority,"accountA","deviceA",rivalryId,sessionOne,now);
  const bOne=operation(h,authority,"accountB","deviceB",rivalryId,sessionOne,now+1000);
  const cOne=operation(h,authority,"accountC","deviceC",rivalryId,sessionOne,now+1000);

  const noProviderDeviceCredential=await session.openSession({
    ...aOne,
    user:{uid:authority.accountA},
    sessionId:`session_${"8".repeat(64)}`,
    ttlMs:60_000
  });
  assert.equal(noProviderDeviceCredential.ok,false);
  assert.equal(noProviderDeviceCredential.code,"PRIVATE_SESSION_DEVICE_CREDENTIAL_REQUIRED");
  const mismatchedProviderDeviceCredential=await session.openSession({
    ...aOne,
    user:{
      uid:authority.accountA,
      async getIdTokenResult(){return {claims:{device_id:authority.deviceB}};}
    },
    sessionId:`session_${"9".repeat(64)}`,
    ttlMs:60_000
  });
  assert.equal(mismatchedProviderDeviceCredential.ok,false);
  assert.equal(mismatchedProviderDeviceCredential.code,"PRIVATE_SESSION_DEVICE_CREDENTIAL_MISMATCH");

  const opened=await session.openSession({...aOne,ttlMs:60_000});
  assert.equal(opened.ok,true,JSON.stringify(opened));
  assert.equal(opened.status,"accepted");
  assert.equal(opened.state,"open");
  assert.equal(opened.revision,0);
  assert.deepEqual(opened.memberAccountIds,[authority.accountA]);
  const openReplay=await session.openSession({...aOne,nowEpochMs:now+5000,ttlMs:30_000});
  assert.equal(openReplay.ok,true);
  assert.equal(openReplay.status,"replayed");
  assert.equal(openReplay.revision,0);
  assert.equal(openReplay.expiresAtEpochMs,opened.expiresAtEpochMs,"Retry must return stored authority without extending expiry.");

  const conflictingHost=await session.openSession({...bOne,ttlMs:60_000});
  assert.equal(conflictingHost.ok,false);
  assert.equal(conflictingHost.code,"PRIVATE_SESSION_CONFLICT");
  const selfJoin=await session.joinSession(aOne);
  assert.equal(selfJoin.ok,false);
  assert.equal(selfJoin.code,"PRIVATE_SESSION_HOST_CANNOT_JOIN");
  const peerOpenRead=await session.readSession(bOne);
  assert.equal(peerOpenRead.ok,true);
  assert.equal(peerOpenRead.state,"open");
  const thirdJoin=await session.joinSession(cOne);
  assert.equal(thirdJoin.ok,false);
  assert.equal(thirdJoin.code,"PRIVATE_SESSION_RIVALRY_NOT_ENTITLED");

  const joined=await session.joinSession(bOne);
  assert.equal(joined.ok,true,JSON.stringify(joined));
  assert.equal(joined.status,"accepted");
  assert.equal(joined.state,"active");
  assert.equal(joined.revision,1);
  assert.deepEqual(joined.memberAccountIds,[authority.accountA,authority.accountB]);
  const joinReplay=await session.joinSession({...bOne,nowEpochMs:now+2000});
  assert.equal(joinReplay.ok,true);
  assert.equal(joinReplay.status,"replayed");
  assert.equal(joinReplay.revision,1);
  const hostOpenAfterJoin=await session.openSession({...aOne,nowEpochMs:now+3000});
  assert.equal(hostOpenAfterJoin.ok,true);
  assert.equal(hostOpenAfterJoin.status,"replayed");
  assert.equal(hostOpenAfterJoin.state,"active");

  const closed=await session.closeSession({...bOne,nowEpochMs:now+4000});
  assert.equal(closed.ok,true,JSON.stringify(closed));
  assert.equal(closed.state,"closed");
  assert.equal(closed.revision,2);
  const closeReplay=await session.closeSession({...bOne,nowEpochMs:now+5000});
  assert.equal(closeReplay.ok,true);
  assert.equal(closeReplay.status,"replayed");
  assert.equal(closeReplay.revision,2);
  const closedJoin=await session.joinSession({...bOne,nowEpochMs:now+6000});
  assert.equal(closedJoin.ok,false);
  assert.equal(closedJoin.code,"PRIVATE_SESSION_NOT_JOINABLE");

  const sessionTwo=`session_${"2".repeat(64)}`;
  const aTwo=operation(h,authority,"accountA","deviceA",rivalryId,sessionTwo,now+10_000);
  const bTwo=operation(h,authority,"accountB","deviceB",rivalryId,sessionTwo,now+11_000);
  assert.equal((await session.openSession({...aTwo,ttlMs:60_000})).ok,true);
  assert.equal((await session.joinSession(bTwo)).ok,true);
  const revoked=await session.revokeSession({...aTwo,nowEpochMs:now+12_000});
  assert.equal(revoked.ok,true,JSON.stringify(revoked));
  assert.equal(revoked.state,"revoked");
  assert.equal(revoked.revision,2);
  const revokeReplay=await session.revokeSession({...aTwo,nowEpochMs:now+13_000});
  assert.equal(revokeReplay.ok,true);
  assert.equal(revokeReplay.status,"replayed");
  const peerRevoke=await session.revokeSession({...bTwo,nowEpochMs:now+13_000});
  assert.equal(peerRevoke.ok,false);
  assert.equal(peerRevoke.code,"PRIVATE_SESSION_HOST_REQUIRED");
  const resurrection=await session.joinSession({...bTwo,nowEpochMs:now+14_000});
  assert.equal(resurrection.ok,false);
  assert.equal(resurrection.code,"PRIVATE_SESSION_NOT_JOINABLE");

  const sessionThree=`session_${"3".repeat(64)}`;
  const aThree=operation(h,authority,"accountA","deviceA",rivalryId,sessionThree,now+20_000);
  assert.equal((await session.openSession({...aThree,ttlMs:1000})).ok,true);
  const prematureExpiry=await session.expireSession({...aThree,nowEpochMs:now+20_999});
  assert.equal(prematureExpiry.ok,false);
  assert.equal(prematureExpiry.code,"PRIVATE_SESSION_NOT_EXPIRED");
  const expired=await session.expireSession({...aThree,nowEpochMs:now+21_001});
  assert.equal(expired.ok,true,JSON.stringify(expired));
  assert.equal(expired.state,"expired");
  assert.equal(expired.revision,1);
  const expireReplay=await session.expireSession({...aThree,nowEpochMs:now+22_000});
  assert.equal(expireReplay.ok,true);
  assert.equal(expireReplay.status,"replayed");

  const accountBPath=`accounts/${authority.accountB}`;
  const deviceBPath=`accounts/${authority.accountB}/devices/${authority.deviceB}`;
  const rivalryPath=`rivalries/${rivalryId}`;
  h.docs.get(deviceBPath).data.state="revoked";
  const revokedDeviceOpen=await session.openSession({
    ...operation(h,authority,"accountB","deviceB",rivalryId,`session_${"4".repeat(64)}`,now+30_000),
    ttlMs:60_000
  });
  assert.equal(revokedDeviceOpen.ok,false);
  assert.equal(revokedDeviceOpen.code,"PRIVATE_SESSION_DEVICE_REVOKED");
  h.docs.get(deviceBPath).data.state="active";
  h.docs.get(`accounts/${authority.accountA}`).data.status="disabled";
  const inactiveAccountOpen=await session.openSession({
    ...operation(h,authority,"accountA","deviceA",rivalryId,`session_${"5".repeat(64)}`,now+31_000),
    ttlMs:60_000
  });
  assert.equal(inactiveAccountOpen.ok,false);
  assert.equal(inactiveAccountOpen.code,"PRIVATE_SESSION_ACCOUNT_INACTIVE");
  h.docs.get(`accounts/${authority.accountA}`).data.status="active";
  h.docs.get(rivalryPath).data.connectionState="revoked-read-only";
  const lostRivalryOpen=await session.openSession({
    ...operation(h,authority,"accountB","deviceB",rivalryId,`session_${"6".repeat(64)}`,now+32_000),
    ttlMs:60_000
  });
  assert.equal(lostRivalryOpen.ok,false);
  assert.equal(lostRivalryOpen.code,"PRIVATE_SESSION_RIVALRY_INACTIVE");
  h.docs.get(rivalryPath).data.connectionState="active";
  assert.equal(h.docs.get(accountBPath).data.status,"active");

  const canonicalFixture={
    "careerModeShowdown.saveLibrary":"save-library-bytes",
    "careerModeShowdown.legacyShowdowns":"legacy-bytes",
    "careerModeShowdown.preferences":"preference-bytes"
  };
  const canonicalBefore=JSON.stringify(canonicalFixture);
  const docsBefore=JSON.stringify([...h.docs.entries()]);
  const outage=Object.assign(new Error("provider unavailable"),{code:"unavailable"});
  const outageSdk={
    Timestamp:FakeTimestamp,
    doc(_firestore,...parts){return {path:parts.join("/")};},
    async runTransaction(){throw outage;}
  };
  const outageResult=await session.openSession({
    user:{
      uid:authority.accountA,
      async getIdTokenResult(){return {claims:{device_id:authority.deviceA}};}
    },
    deviceId:authority.deviceA,
    rivalryId,
    sessionId:`session_${"7".repeat(64)}`,
    firestore:{name:"offline"},
    firebaseSdk:outageSdk,
    cryptoImpl:crypto.webcrypto,
    nowEpochMs:now+40_000,
    ttlMs:60_000
  });
  assert.equal(outageResult.ok,false);
  assert.equal(outageResult.code,"unavailable");
  assert.equal(JSON.stringify(canonicalFixture),canonicalBefore,"Provider loss must not mutate canonical local storage fixtures.");
  assert.equal(JSON.stringify([...h.docs.entries()]),docsBefore,"Provider loss before commit must not mutate remote fixtures.");

  process.stdout.write("PASS Stage 5A private-session client: exact 256-bit capability, provider-verifiable device credential, memory-only authority, host/open and peer/join lifecycle, deterministic retries, immutable terminal states, account/device/rivalry rechecks, isolated candidate Rules, Stage 5D production separation and adverse-provider safety.\n");
})().catch(error=>{
  process.stderr.write(`${error&&error.stack?error.stack:error}\n`);
  process.exit(1);
});

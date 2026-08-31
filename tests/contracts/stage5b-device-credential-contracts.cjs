const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const client=require("../../js/sparkDeviceCredential.js");
const issuer=require("../../js/trustedDeviceCredentialIssuance.js");

const NOW=1_800_200_000_000;
const ACCOUNT_ID="acct_stage5b_owner";
const DEVICE_ID=`device_${"a".repeat(32)}`;

function principal(nowEpochMs=NOW,overrides={}){
  return {
    uid:ACCOUNT_ID,
    signInProvider:"google.com",
    authTimeEpochSeconds:Math.floor(nowEpochMs/1000),
    ...overrides
  };
}

function providerHarness(){
  const challenges=new Map();
  const issued=[];
  const authority={
    accountState:"active",
    deviceState:"active",
    credentialState:"absent",
    publicKeyJwk:null,
    publicKeyFingerprint:null
  };
  return {
    authority,
    challenges,
    issued,
    adapters:{
      async loadAuthority({accountId,deviceId}){
        assert.equal(accountId,ACCOUNT_ID);
        assert.equal(deviceId,DEVICE_ID);
        return {...authority};
      },
      async createChallenge(record){
        if(challenges.has(record.challengeId))return {created:false};
        challenges.set(record.challengeId,{...record});
        return {created:true};
      },
      async loadChallenge({challengeId,accountId}){
        assert.equal(accountId,ACCOUNT_ID);
        return challenges.get(challengeId)||null;
      },
      async commitIssuance(input){
        const challenge=challenges.get(input.challengeId);
        if(!challenge||challenge.state!=="open")return {committed:false};
        if(authority.accountState!==input.expectedAccountState||authority.deviceState!==input.expectedDeviceState)return {committed:false};
        if(authority.credentialState!==input.expectedCredentialState)return {committed:false};
        if(authority.publicKeyFingerprint!==input.expectedPublicKeyFingerprint)return {committed:false};
        if(challenge.expiresAtEpochMs!==input.expectedChallengeExpiresAtEpochMs||challenge.expiresAtEpochMs<=input.committedAtEpochMs)return {committed:false};
        challenge.state="consumed";
        challenge.consumedAtEpochMs=input.committedAtEpochMs;
        if(authority.credentialState==="absent"){
          authority.credentialState="active";
          authority.publicKeyJwk=input.publicKeyJwk;
          authority.publicKeyFingerprint=input.publicKeyFingerprint;
        }
        return {committed:true};
      },
      async commitRevocation(input){
        if(authority.accountState!==input.expectedAccountState||authority.deviceState!==input.expectedDeviceState)return {committed:false};
        if(authority.credentialState!==input.expectedCredentialState)return {committed:false};
        if(authority.publicKeyFingerprint!==input.expectedPublicKeyFingerprint)return {committed:false};
        authority.deviceState=input.requiredDeviceStateAfterCommit;
        authority.credentialState=input.requiredCredentialStateAfterCommit;
        authority.revokedAtEpochMs=input.revokedAtEpochMs;
        return {committed:true,deviceState:authority.deviceState,credentialState:authority.credentialState};
      },
      async createCustomToken(uid,claims){
        issued.push({uid,claims});
        return `emulator-custom-token-${crypto.randomBytes(48).toString("base64url")}`;
      }
    }
  };
}

function beginInput(key,h,overrides={}){
  return {
    providerPrincipal:principal(),
    deviceId:DEVICE_ID,
    publicKeyJwk:key.publicKeyJwk,
    publicKeyFingerprint:key.publicKeyFingerprint,
    cryptoImpl:crypto.webcrypto,
    nowEpochMs:NOW,
    ...h.adapters,
    ...overrides
  };
}

function completeInput(key,h,challenge,proof,overrides={}){
  return {
    providerPrincipal:principal(),
    challengeId:challenge.challengeId,
    publicKeyJwk:key.publicKeyJwk,
    publicKeyFingerprint:key.publicKeyFingerprint,
    signature:proof.signature,
    cryptoImpl:crypto.webcrypto,
    nowEpochMs:NOW+1000,
    ...h.adapters,
    ...overrides
  };
}

(async()=>{
  assert.equal(client.contractVersion,1);
  assert.equal(client.feature,"stage5b-device-credential-foundation");
  assert.equal(client.protocolState,"dormant-candidate");
  assert.equal(client.storage,"indexeddb-non-extractable-private-key");
  assert.equal(client.privateKeyExtractable,false);
  assert.equal(client.algorithm,"ECDSA-P256-SHA256");
  assert.equal(client.primaryGoogleSessionReplaced,false);
  assert.equal(client.productionRuntimeLoaded,false);
  assert.equal(client.productionCredentialIssued,false);
  assert.equal(client.canonicalLocalStorageMutation,false);
  assert.deepEqual([...client.canonicalLocalStorageKeys],[
    "careerModeShowdown.saveLibrary",
    "careerModeShowdown.legacyShowdowns",
    "careerModeShowdown.preferences"
  ]);

  assert.equal(issuer.contractVersion,1);
  assert.equal(issuer.feature,"stage5b-trusted-device-credential-issuance");
  assert.equal(issuer.protocolState,"candidate-emulator-boundary");
  assert.equal(issuer.requiredInitialProvider,"google.com");
  assert.equal(issuer.customAuthenticationIntroducedByActivation,true);
  assert.equal(issuer.separateAuthPolicyDecisionRequired,true);
  assert.equal(issuer.primaryGoogleSessionReplacementRequired,false);
  assert.equal(issuer.issuanceCommitRequiresAtomicAuthorityPreconditions,true);
  assert.equal(issuer.revocationRequiresAtomicDeviceAndCredentialState,true);
  assert.equal(issuer.existingTokenRevocation,"active-device-rules-recheck");
  assert.deepEqual([...issuer.requiredAdditionalIamPermissions],["iam.serviceAccounts.signBlob","datastore.entities.update"]);
  assert.equal(issuer.currentProductionIamSufficient,false);
  assert.equal(issuer.cloudRunAvailableOnSpark,false);
  assert.equal(issuer.productionRuntimeConnected,false);
  assert.equal(issuer.productionIssuerActivated,false);
  assert.equal(issuer.productionRulesPublished,false);
  assert.deepEqual([...issuer.customTokenClaims],["device_id","device_credential_version","device_key_sha256"]);

  const key=await client.generateCredentialRecord(DEVICE_ID,{cryptoImpl:crypto.webcrypto,nowEpochMs:NOW});
  assert.equal(key.privateKey.extractable,false);
  assert.deepEqual(key.privateKey.usages,["sign"]);
  assert.match(key.publicKeyFingerprint,/^sha256:[0-9a-f]{64}$/);
  assert.deepEqual(Object.keys(key.publicKeyJwk),["crv","kty","x","y"]);
  await assert.rejects(()=>crypto.webcrypto.subtle.exportKey("jwk",key.privateKey),/extractable/i);
  assert.equal(await client.fingerprintPublicJwk(key.publicKeyJwk,crypto.webcrypto),key.publicKeyFingerprint);

  const h=providerHarness();
  const begun=await issuer.beginDeviceCredentialIssuance(beginInput(key,h));
  assert.equal(begun.ok,true,JSON.stringify(begun));
  assert.equal(begun.action,"challenge-created");
  assert.match(begun.challenge.challengeId,/^credential_challenge_[0-9a-f]{64}$/);
  assert.match(begun.challenge.challengeNonce,/^[A-Za-z0-9_-]{43}$/);
  assert.equal(begun.challenge.deviceId,DEVICE_ID);
  assert.equal(begun.challenge.accountId,ACCOUNT_ID);
  assert.equal(begun.challenge.publicKeyFingerprint,key.publicKeyFingerprint);
  assert.equal(begun.challenge.expiresAtEpochMs,NOW+issuer.challengeTtlMs);

  const proof=await client.signChallenge(key,begun.challenge,{cryptoImpl:crypto.webcrypto,nowEpochMs:NOW+500});
  assert.equal(proof.challengeId,begun.challenge.challengeId);
  assert.equal(proof.publicKeyFingerprint,key.publicKeyFingerprint);
  assert.match(proof.signature,/^[A-Za-z0-9_-]{86}$/);

  const completed=await issuer.completeDeviceCredentialIssuance(completeInput(key,h,begun.challenge,proof));
  assert.equal(completed.ok,true,JSON.stringify(completed));
  assert.equal(completed.action,"credential-enrolled");
  assert.equal(completed.accountId,ACCOUNT_ID);
  assert.equal(completed.deviceId,DEVICE_ID);
  assert.equal(completed.publicKeyFingerprint,key.publicKeyFingerprint);
  assert.equal(completed.credentialVersion,1);
  assert.ok(completed.customToken.length>20);
  assert.deepEqual(h.issued,[{
    uid:ACCOUNT_ID,
    claims:{
      device_id:DEVICE_ID,
      device_credential_version:1,
      device_key_sha256:key.publicKeyFingerprint
    }
  }]);
  assert.equal(h.authority.credentialState,"active");
  assert.equal(h.authority.publicKeyFingerprint,key.publicKeyFingerprint);

  const replay=await issuer.completeDeviceCredentialIssuance(completeInput(key,h,begun.challenge,proof,{nowEpochMs:NOW+2000}));
  assert.equal(replay.ok,false);
  assert.ok(["DEVICE_CREDENTIAL_CHALLENGE_INVALID","DEVICE_CREDENTIAL_COMMIT_CONFLICT"].includes(replay.code));
  assert.equal(h.issued.length,1,"A replay must never mint another custom token.");

  const refreshBegin=await issuer.beginDeviceCredentialIssuance(beginInput(key,h,{
    providerPrincipal:principal(NOW-24*60*60*1000),
    nowEpochMs:NOW+3000
  }));
  assert.equal(refreshBegin.ok,true,"An enrolled non-extractable key may refresh without silently requiring a fresh Google popup.");
  const refreshProof=await client.signChallenge(key,refreshBegin.challenge,{cryptoImpl:crypto.webcrypto,nowEpochMs:NOW+3500});
  const refreshed=await issuer.completeDeviceCredentialIssuance(completeInput(key,h,refreshBegin.challenge,refreshProof,{
    providerPrincipal:principal(NOW-24*60*60*1000),
    nowEpochMs:NOW+4000
  }));
  assert.equal(refreshed.ok,true,JSON.stringify(refreshed));
  assert.equal(refreshed.action,"credential-refreshed");
  assert.equal(h.issued.length,2);

  const newKey=await client.generateCredentialRecord(DEVICE_ID,{cryptoImpl:crypto.webcrypto,nowEpochMs:NOW+5000});
  const wrongRefresh=await issuer.beginDeviceCredentialIssuance(beginInput(newKey,h,{nowEpochMs:NOW+5000}));
  assert.equal(wrongRefresh.code,"DEVICE_CREDENTIAL_KEY_MISMATCH");

  const customProvider=await issuer.beginDeviceCredentialIssuance(beginInput(key,h,{
    providerPrincipal:principal(NOW,{signInProvider:"custom"})
  }));
  assert.equal(customProvider.code,"DEVICE_CREDENTIAL_GOOGLE_REAUTH_REQUIRED","A custom-token session must never bootstrap or self-refresh its own privilege.");

  const rotationHarness=providerHarness();
  rotationHarness.authority.credentialState="active";
  rotationHarness.authority.publicKeyJwk=key.publicKeyJwk;
  rotationHarness.authority.publicKeyFingerprint=key.publicKeyFingerprint;
  const rotationBegin=await issuer.beginDeviceCredentialIssuance(beginInput(key,rotationHarness,{nowEpochMs:NOW+6000}));
  const rotationProof=await client.signChallenge(key,rotationBegin.challenge,{cryptoImpl:crypto.webcrypto,nowEpochMs:NOW+6500});
  const atomicCommit=rotationHarness.adapters.commitIssuance;
  rotationHarness.adapters.commitIssuance=async input=>{
    rotationHarness.authority.publicKeyJwk=newKey.publicKeyJwk;
    rotationHarness.authority.publicKeyFingerprint=newKey.publicKeyFingerprint;
    return atomicCommit(input);
  };
  const rotationRace=await issuer.completeDeviceCredentialIssuance(completeInput(key,rotationHarness,rotationBegin.challenge,rotationProof,{nowEpochMs:NOW+7000}));
  assert.equal(rotationRace.code,"DEVICE_CREDENTIAL_COMMIT_CONFLICT","A concurrent active-key rotation must invalidate the issuance CAS.");
  assert.equal(rotationHarness.issued.length,0);

  const extendedHarness=providerHarness();
  const extendedBegin=await issuer.beginDeviceCredentialIssuance(beginInput(key,extendedHarness,{nowEpochMs:NOW+8000}));
  const extendedProof=await client.signChallenge(key,extendedBegin.challenge,{cryptoImpl:crypto.webcrypto,nowEpochMs:NOW+8500});
  extendedHarness.challenges.get(extendedBegin.challenge.challengeId).expiresAtEpochMs+=1;
  const extended=await issuer.completeDeviceCredentialIssuance(completeInput(key,extendedHarness,extendedBegin.challenge,extendedProof,{nowEpochMs:NOW+9000}));
  assert.equal(extended.code,"DEVICE_CREDENTIAL_CHALLENGE_INVALID","A stored challenge cannot extend the signed two-minute validity window.");

  const initialStaleHarness=providerHarness();
  const staleInitial=await issuer.beginDeviceCredentialIssuance(beginInput(key,initialStaleHarness,{
    providerPrincipal:principal(NOW-issuer.recentAuthenticationMaxAgeMs-2000),
    nowEpochMs:NOW
  }));
  assert.equal(staleInitial.code,"DEVICE_CREDENTIAL_RECENT_GOOGLE_AUTH_REQUIRED");

  const tamperHarness=providerHarness();
  const tamperBegin=await issuer.beginDeviceCredentialIssuance(beginInput(key,tamperHarness));
  const tamperProof=await client.signChallenge(key,tamperBegin.challenge,{cryptoImpl:crypto.webcrypto,nowEpochMs:NOW+500});
  const tampered=await issuer.completeDeviceCredentialIssuance(completeInput(key,tamperHarness,tamperBegin.challenge,tamperProof,{
    signature:`${tamperProof.signature.startsWith("A")?"B":"A"}${tamperProof.signature.slice(1)}`
  }));
  assert.equal(tampered.code,"DEVICE_CREDENTIAL_PROOF_INVALID");
  assert.equal(tamperHarness.issued.length,0);

  const revokedHarness=providerHarness();
  const revokedBegin=await issuer.beginDeviceCredentialIssuance(beginInput(key,revokedHarness));
  const revokedProof=await client.signChallenge(key,revokedBegin.challenge,{cryptoImpl:crypto.webcrypto,nowEpochMs:NOW+500});
  revokedHarness.authority.deviceState="revoked";
  const revoked=await issuer.completeDeviceCredentialIssuance(completeInput(key,revokedHarness,revokedBegin.challenge,revokedProof));
  assert.equal(revoked.code,"DEVICE_CREDENTIAL_DEVICE_REVOKED");
  assert.equal(revokedHarness.issued.length,0);

  const expiredHarness=providerHarness();
  const expiredBegin=await issuer.beginDeviceCredentialIssuance(beginInput(key,expiredHarness));
  const expiredProof=await client.signChallenge(key,expiredBegin.challenge,{cryptoImpl:crypto.webcrypto,nowEpochMs:NOW+500});
  const expired=await issuer.completeDeviceCredentialIssuance(completeInput(key,expiredHarness,expiredBegin.challenge,expiredProof,{
    nowEpochMs:expiredBegin.challenge.expiresAtEpochMs+1
  }));
  assert.equal(expired.code,"DEVICE_CREDENTIAL_CHALLENGE_EXPIRED");

  const revokeHarness=providerHarness();
  revokeHarness.authority.credentialState="active";
  revokeHarness.authority.publicKeyJwk=key.publicKeyJwk;
  revokeHarness.authority.publicKeyFingerprint=key.publicKeyFingerprint;
  const revokedCredential=await issuer.revokeDeviceCredential({
    providerPrincipal:principal(NOW+10_000),
    deviceId:DEVICE_ID,
    cryptoImpl:crypto.webcrypto,
    nowEpochMs:NOW+10_000,
    ...revokeHarness.adapters
  });
  assert.equal(revokedCredential.ok,true,JSON.stringify(revokedCredential));
  assert.equal(revokedCredential.action,"credential-revoked");
  assert.equal(revokedCredential.existingTokenAuthority,"denied-by-active-device-rules-recheck");
  assert.equal(revokeHarness.authority.deviceState,"revoked");
  assert.equal(revokeHarness.authority.credentialState,"revoked");
  const idempotentRevocation=await issuer.revokeDeviceCredential({
    providerPrincipal:principal(NOW+11_000),
    deviceId:DEVICE_ID,
    cryptoImpl:crypto.webcrypto,
    nowEpochMs:NOW+11_000,
    ...revokeHarness.adapters
  });
  assert.equal(idempotentRevocation.action,"credential-already-revoked");
  const staleRevocationHarness=providerHarness();
  staleRevocationHarness.authority.credentialState="active";
  staleRevocationHarness.authority.publicKeyJwk=key.publicKeyJwk;
  staleRevocationHarness.authority.publicKeyFingerprint=key.publicKeyFingerprint;
  const staleRevocation=await issuer.revokeDeviceCredential({
    providerPrincipal:principal(NOW-issuer.recentAuthenticationMaxAgeMs-2000),
    deviceId:DEVICE_ID,
    cryptoImpl:crypto.webcrypto,
    nowEpochMs:NOW,
    ...staleRevocationHarness.adapters
  });
  assert.equal(staleRevocation.code,"DEVICE_CREDENTIAL_RECENT_GOOGLE_AUTH_REQUIRED");

  const clientSource=fs.readFileSync("js/sparkDeviceCredential.js","utf8");
  const issuerSource=fs.readFileSync("js/trustedDeviceCredentialIssuance.js","utf8");
  assert.doesNotMatch(clientSource,/localStorage\s*(?:\.|\[)|firebase-admin|service[_ -]?account|BEGIN PRIVATE KEY/i);
  assert.doesNotMatch(issuerSource,/setCustomUserClaims|GOOGLE_APPLICATION_CREDENTIALS|BEGIN PRIVATE KEY/);
  assert.match(issuerSource,/createCustomToken/);
  for(const runtimeOwner of ["index.html","js/app.js","js/optionalModules.js","service-worker.js","trusted-runtime/server.mjs","trusted-runtime/productionTrustedRuntime.js"]){
    assert.doesNotMatch(fs.readFileSync(runtimeOwner,"utf8"),/sparkDeviceCredential|trustedDeviceCredentialIssuance|stage5b/i,`${runtimeOwner} must not activate the Stage 5B candidate.`);
  }
  const candidateRules=fs.readFileSync("firestore.stage5a.rules","utf8");
  assert.match(candidateRules,/request\.auth\.token\.device_id/);
  assert.match(candidateRules,/request\.auth\.token\.device_credential_version/);
  assert.match(candidateRules,/request\.auth\.token\.device_key_sha256/);
  assert.match(candidateRules,/deviceCredentials/);
  assert.match(candidateRules,/credential\.data\.data\.credentialVersion == request\.auth\.token\.device_credential_version/);
  assert.match(candidateRules,/credential\.data\.data\.publicKeyFingerprint == request\.auth\.token\.device_key_sha256/);
  assert.doesNotMatch(JSON.stringify({
    root:JSON.parse(fs.readFileSync("firebase.json","utf8")),
    production:JSON.parse(fs.readFileSync("firebase.production.rules.json","utf8"))
  }),/stage5b|stage5a/i,"No deployment configuration may reference credential/session candidate Rules.");

  process.stdout.write("PASS Stage 5B non-extractable key, one-use proof, refresh, revocation, mismatch, provider-policy, IAM and dormant activation contracts\n");
})().catch(error=>{
  process.stderr.write(`${error&&error.stack?error.stack:error}\n`);
  process.exit(1);
});

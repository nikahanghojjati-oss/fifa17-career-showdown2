(function(root,factory){
  const clientBoundary=typeof module!=="undefined"&&module.exports
    ?require("./sparkDeviceCredential.js")
    :root.CareerModeSparkDeviceCredential;
  const api=factory(root,clientBoundary);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeTrustedDeviceCredentialIssuance=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root,clientBoundary){
  "use strict";

  const CHALLENGE_TTL_MS=2*60*1000;
  const RECENT_AUTH_MAX_AGE_MS=5*60*1000;
  const FUTURE_AUTH_SKEW_MS=60*1000;
  const CREDENTIAL_VERSION=1;
  const REQUIRED_INITIAL_PROVIDER="google.com";
  const REQUIRED_ADDITIONAL_IAM_PERMISSIONS=Object.freeze([
    "iam.serviceAccounts.signBlob",
    "datastore.entities.update"
  ]);

  function tdciFreeze(value){
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.freeze(value);
    Object.values(value).forEach(tdciFreeze);
    return value;
  }

  function tdciReject(code){return tdciFreeze({ok:false,action:"reject",code});}

  function tdciIsRecord(value){return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);}

  function tdciNormalizeNow(value){
    const nowEpochMs=value===undefined?Date.now():Number(value);
    if(!Number.isFinite(nowEpochMs)||nowEpochMs<=0)throw new Error("DEVICE_CREDENTIAL_TIME_INVALID");
    return nowEpochMs;
  }

  function normalizePrincipal(value){
    if(!tdciIsRecord(value))return null;
    const uid=typeof value.uid==="string"?value.uid.trim():"";
    const firebase=tdciIsRecord(value.firebase)?value.firebase:{};
    const signInProvider=typeof value.signInProvider==="string"
      ?value.signInProvider.trim()
      :typeof firebase.sign_in_provider==="string"?firebase.sign_in_provider.trim():"";
    const authTimeEpochSeconds=Number(value.authTimeEpochSeconds===undefined?value.auth_time:value.authTimeEpochSeconds);
    if(!uid||!signInProvider||!Number.isFinite(authTimeEpochSeconds)||authTimeEpochSeconds<=0)return null;
    return tdciFreeze({uid,signInProvider,authTimeEpochSeconds});
  }

  function recentGooglePrincipal(principal,nowEpochMs){
    if(!principal||principal.signInProvider!==REQUIRED_INITIAL_PROVIDER)return false;
    const age=nowEpochMs-principal.authTimeEpochSeconds*1000;
    return age>=-FUTURE_AUTH_SKEW_MS&&age<=RECENT_AUTH_MAX_AGE_MS;
  }

  function normalizeAuthority(value){
    if(!tdciIsRecord(value))return null;
    const accountState=value.accountState;
    const deviceState=value.deviceState;
    const credentialState=value.credentialState;
    if(accountState!=="active"||deviceState!=="active"||!["absent","active","revoked"].includes(credentialState)){
      return tdciFreeze({accountState,deviceState,credentialState});
    }
    if(credentialState==="active"){
      try{
        const publicKeyJwk=clientBoundary.normalizePublicJwk(value.publicKeyJwk);
        if(!/^sha256:[0-9a-f]{64}$/.test(value.publicKeyFingerprint||""))return null;
        return tdciFreeze({accountState,deviceState,credentialState,publicKeyJwk,publicKeyFingerprint:value.publicKeyFingerprint});
      }catch(_error){return null;}
    }
    return tdciFreeze({accountState,deviceState,credentialState,publicKeyJwk:null,publicKeyFingerprint:null});
  }

  function authorityError(authority){
    if(!authority)return "DEVICE_CREDENTIAL_AUTHORITY_INVALID";
    if(authority.accountState!=="active")return "DEVICE_CREDENTIAL_ACCOUNT_INACTIVE";
    if(authority.deviceState==="revoked")return "DEVICE_CREDENTIAL_DEVICE_REVOKED";
    if(authority.deviceState!=="active")return "DEVICE_CREDENTIAL_DEVICE_INACTIVE";
    if(authority.credentialState==="revoked")return "DEVICE_CREDENTIAL_REVOKED";
    if(!["absent","active"].includes(authority.credentialState))return "DEVICE_CREDENTIAL_AUTHORITY_INVALID";
    return null;
  }

  function randomBytes(length,cryptoImpl){
    if(!cryptoImpl||typeof cryptoImpl.getRandomValues!=="function")throw new Error("DEVICE_CREDENTIAL_CRYPTO_UNAVAILABLE");
    const bytes=new Uint8Array(length);
    cryptoImpl.getRandomValues(bytes);
    return bytes;
  }

  function tdciHex(bytes){return Array.from(bytes,byte=>byte.toString(16).padStart(2,"0")).join("");}

  function tdciBase64Url(bytes){
    let binary="";
    for(const byte of bytes)binary+=String.fromCharCode(byte);
    const encoded=typeof btoa==="function"?btoa(binary):Buffer.from(bytes).toString("base64");
    return encoded.replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
  }

  function decodeBase64Url(value){
    if(typeof value!=="string"||!/^[A-Za-z0-9_-]+$/.test(value))throw new Error("DEVICE_CREDENTIAL_SIGNATURE_INVALID");
    const standard=value.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-value.length%4)%4);
    if(typeof atob==="function"){
      const binary=atob(standard);
      return Uint8Array.from(binary,character=>character.charCodeAt(0));
    }
    return new Uint8Array(Buffer.from(standard,"base64"));
  }

  async function loadAuthority(input,accountId,deviceId){
    if(typeof input.loadAuthority!=="function")return {error:"DEVICE_CREDENTIAL_AUTHORITY_PROVIDER_UNAVAILABLE"};
    let loaded;
    try{loaded=await input.loadAuthority(tdciFreeze({accountId,deviceId}));}
    catch(_error){return {error:"DEVICE_CREDENTIAL_AUTHORITY_LOAD_FAILED"};}
    const authority=normalizeAuthority(loaded);
    return {authority,error:authorityError(authority)};
  }

  async function beginDeviceCredentialIssuance(input){
    if(!tdciIsRecord(input)||!clientBoundary)return tdciReject("DEVICE_CREDENTIAL_REQUEST_INVALID");
    const principal=normalizePrincipal(input.providerPrincipal);
    if(!principal)return tdciReject("DEVICE_CREDENTIAL_PROVIDER_PRINCIPAL_INVALID");
    if(principal.signInProvider!==REQUIRED_INITIAL_PROVIDER)return tdciReject("DEVICE_CREDENTIAL_GOOGLE_REAUTH_REQUIRED");
    let deviceId;
    let publicKeyJwk;
    let nowEpochMs;
    try{
      deviceId=clientBoundary.normalizeDeviceId(input.deviceId);
      publicKeyJwk=clientBoundary.normalizePublicJwk(input.publicKeyJwk);
      nowEpochMs=tdciNormalizeNow(input.nowEpochMs);
    }catch(error){return tdciReject(error&&error.code?error.code:error.message||"DEVICE_CREDENTIAL_REQUEST_INVALID");}
    let publicKeyFingerprint;
    try{publicKeyFingerprint=await clientBoundary.fingerprintPublicJwk(publicKeyJwk,input.cryptoImpl||root.crypto);}
    catch(_error){return tdciReject("DEVICE_CREDENTIAL_PUBLIC_KEY_INVALID");}
    if(input.publicKeyFingerprint!==publicKeyFingerprint)return tdciReject("DEVICE_CREDENTIAL_KEY_FINGERPRINT_MISMATCH");

    const loaded=await loadAuthority(input,principal.uid,deviceId);
    if(loaded.error)return tdciReject(loaded.error);
    const authority=loaded.authority;
    if(authority.credentialState==="active"){
      if(authority.publicKeyFingerprint!==publicKeyFingerprint)return tdciReject("DEVICE_CREDENTIAL_KEY_MISMATCH");
      const trustedFingerprint=await clientBoundary.fingerprintPublicJwk(authority.publicKeyJwk,input.cryptoImpl||root.crypto);
      if(trustedFingerprint!==authority.publicKeyFingerprint)return tdciReject("DEVICE_CREDENTIAL_AUTHORITY_INVALID");
    }else if(!recentGooglePrincipal(principal,nowEpochMs)){
      return tdciReject("DEVICE_CREDENTIAL_RECENT_GOOGLE_AUTH_REQUIRED");
    }
    if(typeof input.createChallenge!=="function")return tdciReject("DEVICE_CREDENTIAL_CHALLENGE_PROVIDER_UNAVAILABLE");

    let challengeId;
    let challengeNonce;
    try{
      challengeId=`credential_challenge_${tdciHex(randomBytes(32,input.cryptoImpl||root.crypto))}`;
      challengeNonce=tdciBase64Url(randomBytes(32,input.cryptoImpl||root.crypto));
    }catch(error){return tdciReject(error.message||"DEVICE_CREDENTIAL_CRYPTO_UNAVAILABLE");}
    const challenge=tdciFreeze({
      protocol:clientBoundary.protocol,
      purpose:clientBoundary.purpose,
      challengeId,
      challengeNonce,
      accountId:principal.uid,
      deviceId,
      publicKeyFingerprint,
      expiresAtEpochMs:nowEpochMs+CHALLENGE_TTL_MS
    });
    const record=tdciFreeze({
      schemaVersion:1,
      state:"open",
      createdAtEpochMs:nowEpochMs,
      ...challenge,
      publicKeyJwk,
      initialEnrollment:authority.credentialState==="absent"
    });
    let created;
    try{created=await input.createChallenge(record);}
    catch(_error){return tdciReject("DEVICE_CREDENTIAL_CHALLENGE_CREATE_FAILED");}
    if(!created||created.created!==true)return tdciReject("DEVICE_CREDENTIAL_CHALLENGE_CONFLICT");
    return tdciFreeze({ok:true,action:"challenge-created",challenge});
  }

  function normalizeStoredChallenge(value){
    if(!tdciIsRecord(value)||value.schemaVersion!==1||value.state!=="open")return null;
    let normalized;
    let publicKeyJwk;
    try{
      normalized=clientBoundary.normalizeChallenge(value,0);
      publicKeyJwk=clientBoundary.normalizePublicJwk(value.publicKeyJwk);
    }catch(_error){return null;}
    if(typeof value.createdAtEpochMs!=="number"||!Number.isFinite(value.createdAtEpochMs))return null;
    return tdciFreeze({...normalized,publicKeyJwk,createdAtEpochMs:value.createdAtEpochMs,initialEnrollment:value.initialEnrollment===true});
  }

  async function verifyProof(challenge,signature,cryptoImpl){
    let bytes;
    try{bytes=decodeBase64Url(signature);}
    catch(_error){return false;}
    if(bytes.length!==64)return false;
    try{
      const key=await cryptoImpl.subtle.importKey(
        "jwk",
        {...challenge.publicKeyJwk,key_ops:["verify"],ext:true},
        {name:"ECDSA",namedCurve:"P-256"},
        false,
        ["verify"]
      );
      const payload=new TextEncoder().encode(clientBoundary.canonicalChallengePayload(challenge));
      return cryptoImpl.subtle.verify({name:"ECDSA",hash:"SHA-256"},key,bytes,payload);
    }catch(_error){return false;}
  }

  async function completeDeviceCredentialIssuance(input){
    if(!tdciIsRecord(input)||!clientBoundary)return tdciReject("DEVICE_CREDENTIAL_REQUEST_INVALID");
    const principal=normalizePrincipal(input.providerPrincipal);
    if(!principal)return tdciReject("DEVICE_CREDENTIAL_PROVIDER_PRINCIPAL_INVALID");
    if(principal.signInProvider!==REQUIRED_INITIAL_PROVIDER)return tdciReject("DEVICE_CREDENTIAL_GOOGLE_REAUTH_REQUIRED");
    const challengeId=typeof input.challengeId==="string"?input.challengeId.trim().toLowerCase():"";
    if(!/^credential_challenge_[0-9a-f]{64}$/.test(challengeId))return tdciReject("DEVICE_CREDENTIAL_CHALLENGE_INVALID");
    if(typeof input.loadChallenge!=="function")return tdciReject("DEVICE_CREDENTIAL_CHALLENGE_PROVIDER_UNAVAILABLE");
    let nowEpochMs;
    let loadedChallenge;
    try{
      nowEpochMs=tdciNormalizeNow(input.nowEpochMs);
      loadedChallenge=await input.loadChallenge(tdciFreeze({challengeId,accountId:principal.uid}));
    }catch(_error){return tdciReject("DEVICE_CREDENTIAL_CHALLENGE_LOAD_FAILED");}
    const challenge=normalizeStoredChallenge(loadedChallenge);
    if(!challenge||challenge.challengeId!==challengeId||challenge.accountId!==principal.uid){
      return tdciReject("DEVICE_CREDENTIAL_CHALLENGE_INVALID");
    }
    if(
      challenge.createdAtEpochMs>nowEpochMs+FUTURE_AUTH_SKEW_MS
      ||challenge.expiresAtEpochMs!==challenge.createdAtEpochMs+CHALLENGE_TTL_MS
    )return tdciReject("DEVICE_CREDENTIAL_CHALLENGE_INVALID");
    if(challenge.expiresAtEpochMs<=nowEpochMs)return tdciReject("DEVICE_CREDENTIAL_CHALLENGE_EXPIRED");
    if(input.publicKeyFingerprint!==challenge.publicKeyFingerprint)return tdciReject("DEVICE_CREDENTIAL_KEY_FINGERPRINT_MISMATCH");
    let suppliedJwk;
    try{suppliedJwk=clientBoundary.normalizePublicJwk(input.publicKeyJwk);}
    catch(_error){return tdciReject("DEVICE_CREDENTIAL_PUBLIC_KEY_INVALID");}
    const suppliedFingerprint=await clientBoundary.fingerprintPublicJwk(suppliedJwk,input.cryptoImpl||root.crypto);
    if(suppliedFingerprint!==challenge.publicKeyFingerprint||JSON.stringify(suppliedJwk)!==JSON.stringify(challenge.publicKeyJwk)){
      return tdciReject("DEVICE_CREDENTIAL_KEY_MISMATCH");
    }

    const loaded=await loadAuthority(input,principal.uid,challenge.deviceId);
    if(loaded.error)return tdciReject(loaded.error);
    const authority=loaded.authority;
    if(challenge.initialEnrollment){
      if(authority.credentialState!=="absent")return tdciReject("DEVICE_CREDENTIAL_ENROLLMENT_CONFLICT");
      if(!recentGooglePrincipal(principal,nowEpochMs))return tdciReject("DEVICE_CREDENTIAL_RECENT_GOOGLE_AUTH_REQUIRED");
    }else if(
      authority.credentialState!=="active"
      ||authority.publicKeyFingerprint!==challenge.publicKeyFingerprint
      ||JSON.stringify(authority.publicKeyJwk)!==JSON.stringify(challenge.publicKeyJwk)
    ){
      return tdciReject("DEVICE_CREDENTIAL_KEY_MISMATCH");
    }

    const cryptoImpl=input.cryptoImpl||root.crypto;
    if(!cryptoImpl||!cryptoImpl.subtle)return tdciReject("DEVICE_CREDENTIAL_CRYPTO_UNAVAILABLE");
    if(!await verifyProof(challenge,input.signature,cryptoImpl))return tdciReject("DEVICE_CREDENTIAL_PROOF_INVALID");
    if(typeof input.commitIssuance!=="function")return tdciReject("DEVICE_CREDENTIAL_COMMIT_PROVIDER_UNAVAILABLE");
    let committed;
    try{
      committed=await input.commitIssuance(tdciFreeze({
        challengeId,
        accountId:principal.uid,
        deviceId:challenge.deviceId,
        publicKeyJwk:challenge.publicKeyJwk,
        publicKeyFingerprint:challenge.publicKeyFingerprint,
        expectedAccountState:"active",
        expectedDeviceState:"active",
        expectedChallengeState:"open",
        expectedChallengeExpiresAtEpochMs:challenge.expiresAtEpochMs,
        expectedCredentialState:challenge.initialEnrollment?"absent":"active",
        expectedPublicKeyFingerprint:challenge.initialEnrollment?null:challenge.publicKeyFingerprint,
        credentialVersion:CREDENTIAL_VERSION,
        committedAtEpochMs:nowEpochMs
      }));
    }catch(_error){return tdciReject("DEVICE_CREDENTIAL_COMMIT_FAILED");}
    if(!committed||committed.committed!==true)return tdciReject("DEVICE_CREDENTIAL_COMMIT_CONFLICT");
    if(typeof input.createCustomToken!=="function")return tdciReject("DEVICE_CREDENTIAL_TOKEN_PROVIDER_UNAVAILABLE");
    const claims=tdciFreeze({
      device_id:challenge.deviceId,
      device_credential_version:CREDENTIAL_VERSION,
      device_key_sha256:challenge.publicKeyFingerprint
    });
    let customToken;
    try{customToken=await input.createCustomToken(principal.uid,claims);}
    catch(_error){return tdciReject("DEVICE_CREDENTIAL_PROVIDER_ISSUANCE_FAILED");}
    if(typeof customToken!=="string"||customToken.length<20)return tdciReject("DEVICE_CREDENTIAL_PROVIDER_ISSUANCE_FAILED");
    return tdciFreeze({
      ok:true,
      action:challenge.initialEnrollment?"credential-enrolled":"credential-refreshed",
      accountId:principal.uid,
      deviceId:challenge.deviceId,
      publicKeyFingerprint:challenge.publicKeyFingerprint,
      credentialVersion:CREDENTIAL_VERSION,
      customToken
    });
  }

  async function revokeDeviceCredential(input){
    if(!tdciIsRecord(input)||!clientBoundary)return tdciReject("DEVICE_CREDENTIAL_REQUEST_INVALID");
    const principal=normalizePrincipal(input.providerPrincipal);
    if(!principal)return tdciReject("DEVICE_CREDENTIAL_PROVIDER_PRINCIPAL_INVALID");
    if(principal.signInProvider!==REQUIRED_INITIAL_PROVIDER)return tdciReject("DEVICE_CREDENTIAL_GOOGLE_REAUTH_REQUIRED");
    let deviceId;
    let nowEpochMs;
    try{
      deviceId=clientBoundary.normalizeDeviceId(input.deviceId);
      nowEpochMs=tdciNormalizeNow(input.nowEpochMs);
    }catch(error){return tdciReject(error&&error.code?error.code:error.message||"DEVICE_CREDENTIAL_REQUEST_INVALID");}
    if(!recentGooglePrincipal(principal,nowEpochMs))return tdciReject("DEVICE_CREDENTIAL_RECENT_GOOGLE_AUTH_REQUIRED");
    if(typeof input.loadAuthority!=="function")return tdciReject("DEVICE_CREDENTIAL_AUTHORITY_PROVIDER_UNAVAILABLE");
    let authority;
    try{authority=normalizeAuthority(await input.loadAuthority(tdciFreeze({accountId:principal.uid,deviceId})));}
    catch(_error){return tdciReject("DEVICE_CREDENTIAL_AUTHORITY_LOAD_FAILED");}
    if(!authority)return tdciReject("DEVICE_CREDENTIAL_AUTHORITY_INVALID");
    if(authority.accountState!=="active")return tdciReject("DEVICE_CREDENTIAL_ACCOUNT_INACTIVE");
    if(authority.deviceState==="revoked"&&authority.credentialState==="revoked"){
      return tdciFreeze({ok:true,action:"credential-already-revoked",accountId:principal.uid,deviceId});
    }
    if(authority.deviceState!=="active")return tdciReject("DEVICE_CREDENTIAL_DEVICE_INACTIVE");
    if(authority.credentialState!=="active")return tdciReject(
      authority.credentialState==="revoked"?"DEVICE_CREDENTIAL_REVOCATION_INCONSISTENT":"DEVICE_CREDENTIAL_NOT_ENROLLED"
    );
    let trustedFingerprint;
    try{trustedFingerprint=await clientBoundary.fingerprintPublicJwk(authority.publicKeyJwk,input.cryptoImpl||root.crypto);}
    catch(_error){return tdciReject("DEVICE_CREDENTIAL_AUTHORITY_INVALID");}
    if(trustedFingerprint!==authority.publicKeyFingerprint)return tdciReject("DEVICE_CREDENTIAL_AUTHORITY_INVALID");
    if(typeof input.commitRevocation!=="function")return tdciReject("DEVICE_CREDENTIAL_REVOCATION_PROVIDER_UNAVAILABLE");
    let committed;
    try{
      committed=await input.commitRevocation(tdciFreeze({
        accountId:principal.uid,
        deviceId,
        expectedAccountState:"active",
        expectedDeviceState:"active",
        expectedCredentialState:"active",
        expectedPublicKeyFingerprint:authority.publicKeyFingerprint,
        revokedAtEpochMs:nowEpochMs,
        requiredDeviceStateAfterCommit:"revoked",
        requiredCredentialStateAfterCommit:"revoked"
      }));
    }catch(_error){return tdciReject("DEVICE_CREDENTIAL_REVOCATION_COMMIT_FAILED");}
    if(!committed||committed.committed!==true||committed.deviceState!=="revoked"||committed.credentialState!=="revoked"){
      return tdciReject("DEVICE_CREDENTIAL_REVOCATION_CONFLICT");
    }
    return tdciFreeze({
      ok:true,
      action:"credential-revoked",
      accountId:principal.uid,
      deviceId,
      revokedAtEpochMs:nowEpochMs,
      existingTokenAuthority:"denied-by-active-device-rules-recheck"
    });
  }

  return tdciFreeze({
    contractVersion:1,
    feature:"stage5b-trusted-device-credential-issuance",
    protocolState:"candidate-emulator-boundary",
    requiredInitialProvider:REQUIRED_INITIAL_PROVIDER,
    customAuthenticationIntroducedByActivation:true,
    separateAuthPolicyDecisionRequired:true,
    primaryGoogleSessionReplacementRequired:false,
    challengeTtlMs:CHALLENGE_TTL_MS,
    recentAuthenticationMaxAgeMs:RECENT_AUTH_MAX_AGE_MS,
    credentialVersion:CREDENTIAL_VERSION,
    proofAlgorithm:"ECDSA-P256-SHA256",
    customTokenClaims:Object.freeze(["device_id","device_credential_version","device_key_sha256"]),
    issuanceCommitRequiresAtomicAuthorityPreconditions:true,
    revocationRequiresAtomicDeviceAndCredentialState:true,
    existingTokenRevocation:"active-device-rules-recheck",
    requiredAdditionalIamPermissions:REQUIRED_ADDITIONAL_IAM_PERMISSIONS,
    currentProductionIamSufficient:false,
    cloudRunAvailableOnSpark:false,
    productionRuntimeConnected:false,
    productionIssuerActivated:false,
    productionRulesPublished:false,
    beginDeviceCredentialIssuance,
    completeDeviceCredentialIssuance,
    revokeDeviceCredential
  });
});

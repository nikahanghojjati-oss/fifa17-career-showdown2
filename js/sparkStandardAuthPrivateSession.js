(function(root,factory){
  const base=typeof module!=="undefined"&&module.exports
    ?require("./sparkPrivateSession.js")
    :root.CareerModeSparkPrivateSession;
  const api=factory(base);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkStandardAuthPrivateSession=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(base){
  "use strict";

  if(!base||typeof base.openSession!=="function"||!base.standardAuthDeviceMetadataMode){
    throw new Error("The private-session protocol dependency is unavailable.");
  }

  const DEVICE_AUTHORITY_MODE=base.standardAuthDeviceMetadataMode;

  function standardAuthOptions(options={}){
    return {...options,deviceAuthorityMode:DEVICE_AUTHORITY_MODE};
  }

  const api={
    contractVersion:1,
    feature:"stage5c-zero-billing-standard-auth-session-adapter",
    protocolState:"candidate-emulator-boundary",
    providerIdentity:"standard-firebase-request-auth-uid",
    productionAuthProviderPolicy:"existing-google-popup-only",
    authPersistence:"browserSessionPersistence",
    additionalOAuthScopes:false,
    customTokenRequired:false,
    customDeviceClaimsRequired:false,
    deviceAuthority:"account-owned-registered-device-mutation-metadata",
    deviceProviderBound:false,
    deviceCryptographicIdentity:false,
    memoryOnly:true,
    persistentFirestoreCache:false,
    localFirstFallback:true,
    quotaFailureMode:"fail-closed-local-play-remains-available",
    billingRequired:false,
    billingUpgradeAllowed:false,
    publicDiscovery:false,
    collectionListing:false,
    exactlyTwoAccounts:true,
    productionRulesPublished:false,
    hostJoinUxExposed:false,
    gameplayMutation:false,
    canonicalStorageMutation:false,
    candidateCInvolved:false,
    exactCapabilityBits:base.exactCapabilityBits,
    sessionStates:base.sessionStates,
    generateSessionId:base.generateSessionId,
    normalizeSessionId:base.normalizeSessionId,
    normalizeRivalryId:base.normalizeRivalryId,
    buildEnvelope:base.buildEnvelope,
    verifySession:base.verifySession,
    openSession:options=>base.openSession(standardAuthOptions(options)),
    joinSession:options=>base.joinSession(standardAuthOptions(options)),
    readSession:options=>base.readSession(standardAuthOptions(options)),
    revokeSession:options=>base.revokeSession(standardAuthOptions(options)),
    expireSession:options=>base.expireSession(standardAuthOptions(options)),
    closeSession:options=>base.closeSession(standardAuthOptions(options))
  };

  Object.freeze(api.sessionStates);
  return Object.freeze(api);
});

(function(){
  const deepFreeze=value=>{
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  };
  const REQUIRED_OPERATIONS=Object.freeze(["create","read","update","delete","restore","invite","join","revoke"]);
  const PATHS=deepFreeze({
    account:"accounts/{accountId}",
    profileLink:"accounts/{accountId}/profileLinks/{profileId}",
    device:"accounts/{accountId}/devices/{deviceId}",
    rivalry:"rivalries/{rivalryId}",
    sharedState:"rivalries/{rivalryId}/state/authoritative",
    invite:"rivalries/{rivalryId}/invites/{inviteId}",
    session:"rivalries/{rivalryId}/sessions/{sessionId}",
    idempotency:"rivalries/{rivalryId}/state/authoritative/idempotency/{idempotencyKeyHash}",
    securityEvent:"accounts/{accountId}/securityEvents/{eventId}",
    tombstone:"same authoritative rivalry/sharedState document path"
  });
  const ENVELOPE_FIELDS=Object.freeze([
    "schemaVersion","objectType","objectId","revision","parentRevision","lifecycleState",
    "contentHash","priorContentHash","updatedAt","updatedByAccountId","updatedByDeviceId","data","tombstone"
  ]);
  const SCHEMAS=deepFreeze({
    account:{
      path:PATHS.account,
      identity:{accountId:"path document ID; equals authenticated Firebase Auth uid"},
      dataFields:["status","createdAt","deletionRequestedAt"],
      allowedStatus:["active","disabled","deletion-pending"]
    },
    profileLink:{
      path:PATHS.profileLink,
      identity:{accountId:"parent path ID",profileId:"path document ID; stable profile_* identity"},
      dataFields:["profileId","displayLabel","linkState","createdAt"],
      note:"displayLabel is presentation only and never authorization evidence"
    },
    device:{
      path:PATHS.device,
      identity:{accountId:"parent path ID",deviceId:"path document ID"},
      dataFields:["deviceId","installationId","displayLabel","state","registeredAt","lastSeenAt","revokedAt"],
      allowedState:["active","revoked"]
    },
    rivalry:{
      path:PATHS.rivalry,
      identity:{rivalryId:"opaque path document ID; distinct from saveId and sessionId"},
      dataFields:["connectionState","connectionStateBeforeDeletion","managerSlots","authorizedAccountIds","createdByAccountId","createdAt"],
      managerSlotFields:["slotId","accountId","profileId","saveId","displayLabel","entitlementState","deletionConsent"],
      allowedConnectionState:["pending-pair","active","revoked-read-only","single-owner-retained","deletion-pending"],
      allowedEntitlementState:["open","active","retained","relinquished"],
      note:"saveId is the stable local Save Library binding for that manager slot; accountId and provider authorization still govern remote entitlement"
    },
    sharedState:{
      path:PATHS.sharedState,
      identity:{rivalryId:"parent path ID",saveId:"stable save_* identity",seasonId:"stable season_* identity inside seasonIds/activeSeasonId"},
      dataFields:["saveId","managerBindings","seasonIds","activeSeasonId","payloadFormatVersion","payload"],
      managerBindingFields:["slotId","profileId"],
      note:"payload is exactly the explicitly connected rivalry Save projection, never the whole local Save Library, recovery bytes, unrelated Legacy or local preferences"
    },
    invite:{
      path:PATHS.invite,
      identity:{inviteId:"128-bit-or-stronger opaque capability path ID; never duplicated into document data"},
      dataFields:["purpose","slotId","createdByAccountId","createdAt","expiresAt","state","redeemedByAccountId","redeemedAt","revokedAt"],
      allowedPurpose:["rivalry-pairing","private-session"],
      allowedState:["open","redeemed","revoked","expired"]
    },
    session:{
      path:PATHS.session,
      identity:{sessionId:"opaque private session path ID; distinct from rivalryId"},
      dataFields:["rivalryId","hostAccountId","memberAccountIds","state","createdAt","expiresAt","lastActivityAt","revokedAt"],
      allowedState:["open","active","revoked","expired","closed"]
    },
    idempotency:{
      path:PATHS.idempotency,
      identity:{idempotencyKeyHash:"SHA-256 of the raw idempotency key; raw key is never stored"},
      dataFields:["requestFingerprint","baseRevision","acceptedRevision","resultStatus","resultContentHash","resultTombstone","actorAccountId","deviceId","createdAt","expiresAt"],
      immutable:true
    },
    tombstone:{
      path:PATHS.tombstone,
      dataFields:["deletedAt","deletedByAccountId","reasonCode","restorableByAccountIds"],
      requiredEnvelopeState:{lifecycleState:"tombstoned",contentHash:null,data:null},
      note:"priorContentHash may remain; deleted gameplay payload may not remain"
    },
    securityEvent:{
      path:PATHS.securityEvent,
      dataFields:["eventType","occurredAt","outcome","rivalryId","deviceId","expiresAt"],
      forbiddenFields:["password","authToken","inviteSecret","gameplayPayload","locationHistory"],
      immutable:true
    }
  });
  const AUTHORIZATION=deepFreeze({
    account:{create:"self-bootstrap-only",read:"self-only",update:"self-cas-allowlisted-fields",delete:"trusted-account-deletion-cascade-only",restore:"provider-account-recovery-only",invite:"deny",join:"deny",revoke:"self-request-or-trusted-security-action"},
    profileLink:{create:"self-only",read:"self-only",update:"self-cas-presentation-or-linkage",delete:"self-only-after-rivalry-detach",restore:"self-explicit-relink-only",invite:"deny",join:"deny",revoke:"self-only"},
    device:{create:"authenticated-self-only",read:"self-only",update:"self-cas-metadata-only",delete:"deny-physical-delete",restore:"explicit-self-reregister-with-new-revision",invite:"deny",join:"deny",revoke:"self-only"},
    rivalry:{create:"authenticated-creator-pending-pair-only",read:"currently-entitled-direct-get-only",update:"operation-specific-cas-only",delete:"logical-tombstone-only-after-all-current-entitlements-consent",restore:"all-restorable-current-accounts-explicit-consent",invite:"active-entitled-member-only",join:"valid-unexpired-one-time-invite-capability-only",revoke:"either-current-entitled-member-may-end-connected-relationship"},
    sharedState:{create:"paired-rivalry-membership-cas-only",read:"currently-entitled-direct-get-only",update:"active-rivalry-member-cas-only-and-all-required-accounts-active",delete:"rivalry-deletion-transaction-only",restore:"rivalry-restore-transaction-only",invite:"deny",join:"deny",revoke:"deny"},
    invite:{create:"active-entitled-member-for-valid-open-slot",read:"creator-or-authenticated-exact-capability-get-only",update:"operation-specific-cas-only",delete:"ttl-cleanup-only",restore:"deny",invite:"creator-operation",join:"authenticated-noncreator-exact-capability-atomic-redeem",revoke:"creator-or-rivalry-revocation-transaction"},
    session:{create:"active-entitled-member-only",read:"current-session-member-and-current-rivalry-entitlement",update:"current-session-member-cas-only",delete:"ttl-cleanup-only",restore:"deny",invite:"session-member-via-invite-record",join:"valid-session-invite-atomic-redeem-only",revoke:"either-current-session-member-may-end-session"},
    idempotency:{create:"same-atomic-transaction-as-accepted-mutation",read:"same-authenticated-actor-exact-hash-get-only",update:"deny",delete:"ttl-cleanup-only",restore:"deny",invite:"deny",join:"deny",revoke:"deny"},
    tombstone:{create:"logical-delete-transaction-only",read:"currently-restorable-authorized-accounts-direct-get-only",update:"restore-transaction-only",delete:"trusted-anti-resurrection-cleanup-only",restore:"all-current-restorable-accounts-explicit-consent",invite:"deny",join:"deny",revoke:"deny"},
    securityEvent:{create:"trusted-security-boundary-or-rule-verifiable-atomic-receipt",read:"self-only-when-app-owned",update:"deny",delete:"ttl-cleanup-only",restore:"deny",invite:"deny",join:"deny",revoke:"deny"}
  });
  const MUTATION_PIPELINE=Object.freeze([
    "authenticate",
    "authorize",
    "read-authoritative-object",
    "compare-immutable-client-baseRevision",
    "reject-mismatch-explicitly",
    "verify-and-reserve-idempotency-replay-state",
    "perform-exactly-one-authorized-logical-mutation",
    "advance-to-exactly-next-monotonic-revision",
    "update-tombstone-state-when-applicable",
    "return-deterministic-success-or-explicit-conflict"
  ]);
  const RESPONSE_STATUSES=Object.freeze([
    "accepted","replayed","conflict","unauthenticated","forbidden","invalid-request","idempotency-conflict",
    "tombstone-restore-required","restore-live-object","already-deleted","account-disabled","device-revoked","relationship-revoked"
  ]);
  const RETENTION=deepFreeze({
    inviteTerminalDays:7,
    idempotencyDays:7,
    securityEventDays:30,
    sessionTerminalDays:7,
    tombstone:"lifetime-of-owning-account-or-connected-namespace-unless-equally-strong-anti-resurrection-proof-exists"
  });
  const REQUEST=deepFreeze({
    trustedAccountSource:"provider-auth-context-only",
    trustedFields:["operation","objectType","objectId","deviceId","installationId","baseRevision","idempotencyKey","payload"],
    forbiddenTrustedClientFields:["accountId","revision","authorizedAccountIds","entitlementState"],
    immutableAcrossProviderRetries:["operation","objectType","objectId","deviceId","installationId","baseRevision","idempotencyKey","payload"]
  });
  const REPLAY=deepFreeze({
    exactAcceptedReplay:"return-recorded-result-without-mutation-or-revision-increment",
    reusedKeyDifferentFingerprint:"idempotency-conflict-without-mutation",
    firstSeenKey:"execute-full-ten-step-mutation-pipeline",
    note:"an exact accepted replay is non-mutating; it is not a new state-changing request"
  });
  const PROVIDER_OWNERSHIP=deepFreeze({
    firebaseAuth:["uid","credentials","password-and-mfa-state","provider-tokens","email-verification","provider-account-disable-delete"],
    applicationFirestore:["minimal-account-lifecycle","account-profile-links","registered-devices","private-rivalry-governance","explicitly-connected-rivalry-state","private-invites","private-sessions","idempotency","tombstones","bounded-security-metadata"],
    neverDuplicate:["passwords","credentials","refresh-tokens","id-tokens","raw-invite-capabilities","unnecessary-pii"]
  });
  const ACCOUNT_DELETION_CASCADE=Object.freeze([
    "mark-application-account-deletion-pending-and-deny-new-mutations",
    "revoke-devices-invites-and-sessions",
    "detach-deleting-account-from-each-rivalry-without-destroying-survivor-entitlement",
    "detach-account-profile-authorization-links",
    "remove-unnecessary-presentation-labels",
    "remove-deleted-account-from-tombstone-restoration-authority",
    "clean-bounded-idempotency-and-security-metadata-by-policy",
    "perform-provider-auth-delete-only-through-future-authorized-provider-boundary"
  ]);
  const GOVERNANCE=deepFreeze({
    exactlyTwoManagerSlots:true,
    oneAccountDeletesItself:"revoke that account immediately; relinquish its account linkage; preserve opaque profileId as shared gameplay identity only when needed; remaining owner becomes retained read-only; never infer transfer",
    oneAccountLeaves:"relinquish only the leaving account entitlement; remaining owner becomes retained read-only; no shared gameplay deletion",
    oneAccountRevokesRelationship:"end pairing and all live invites/sessions for both; both entitled owners retain read/export access but shared gameplay mutation stops",
    oneDeletionRequest:"record that entitled slot's consent and freeze new shared gameplay mutations; do not delete while another entitled slot has not consented",
    bothDeletionRequests:"atomically tombstone rivalry/shared gameplay after every currently entitled slot has explicit deletion consent",
    oneAccountDisabled:"deny the disabled account and freeze shared gameplay mutation while any required account is disabled; preserve entitlement and never transfer ownership",
    staleDeviceReconnect:"reauthenticate and reauthorize against current account/device/rivalry/tombstone state; cached membership never grants authority and stale live data never resurrects a tombstone",
    ownershipTransfer:"unsupported; never inferred from accountId, profileId or display label equality",
    soleRemainingOwnerDelete:"after the other slot explicitly relinquishes entitlement or its account is deleted, the sole remaining entitled owner may explicitly consent to tombstone the retained rivalry"
  });
  function validateAuthorizationMatrix(){
    return Object.entries(AUTHORIZATION).every(([,operations])=>REQUIRED_OPERATIONS.every(operation=>typeof operations[operation]==="string"&&operations[operation].length>0));
  }
  function validateMutationRequest(request){
    if(!request||typeof request!=="object"||Array.isArray(request))return {ok:false,code:"invalid-request"};
    const required=["operation","objectType","objectId","deviceId","idempotencyKey","baseRevision"];
    if(required.some(field=>typeof request[field]==="string"?request[field].trim().length===0:request[field]===undefined))return {ok:false,code:"invalid-request"};
    if(!Number.isInteger(request.baseRevision)||request.baseRevision<0)return {ok:false,code:"invalid-request"};
    if(Object.prototype.hasOwnProperty.call(request,"accountId"))return {ok:false,code:"untrusted-account-field"};
    return {ok:true,code:"valid"};
  }
  function conflictEnvelope(authority,baseRevision){
    return {
      status:"conflict",
      code:"STALE_BASE_REVISION",
      baseRevision,
      authoritative:{
        objectType:authority.objectType,
        objectId:authority.objectId,
        revision:authority.revision,
        contentHash:authority.contentHash??null,
        tombstone:authority.lifecycleState==="tombstoned"
      }
    };
  }
  window.CareerModeRemoteContract=deepFreeze({
    contractVersion:1,
    provider:"Firebase Authentication + Cloud Firestore candidate",
    persistentOfflineCache:false,
    publicDiscovery:false,
    paths:PATHS,
    envelopeFields:ENVELOPE_FIELDS,
    schemas:SCHEMAS,
    authorization:AUTHORIZATION,
    requiredAuthorizationOperations:REQUIRED_OPERATIONS,
    mutationPipeline:MUTATION_PIPELINE,
    responseStatuses:RESPONSE_STATUSES,
    retention:RETENTION,
    request:REQUEST,
    replay:REPLAY,
    providerOwnership:PROVIDER_OWNERSHIP,
    accountDeletionCascade:ACCOUNT_DELETION_CASCADE,
    governance:GOVERNANCE,
    validateAuthorizationMatrix,
    validateMutationRequest,
    conflictEnvelope
  });
})();

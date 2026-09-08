(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSSJRProductionNegativeEvidence=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const FEATURE="ssjr-production-negative-evidence";
  const STORE_KEY="careerModeShowdown.ssjrAcceptance.negatives.safe.v1";
  const RUNTIME="1.9.1-r6";
  const REQUIRED=Object.freeze([
    "wrongSession","expiredSession","unrelatedAccount","revokedIdentity",
    "staleRevision","replayConflict","directFieldSubstitution","coordinatorBypass"
  ]);
  const RULES=Object.freeze({
    wrongSession:Object.freeze({source:"production-shared-setup-wrong-session-probe",codes:Object.freeze(["SETUP_ACTIVE_SESSION_REQUIRED","SETUP_SESSION_MISMATCH","SHARED_SETUP_ACTIVE_SESSION_REQUIRED","SHARED_SETUP_AUTHORITY_MISMATCH"])}),
    expiredSession:Object.freeze({source:"production-shared-setup-expired-session-probe",codes:Object.freeze(["SETUP_ACTIVE_SESSION_REQUIRED","SHARED_SETUP_ACTIVE_SESSION_REQUIRED"])}),
    unrelatedAccount:Object.freeze({source:"stage5f-third-account-provider-probe",codes:Object.freeze(["STAGE5F_THIRD_ACCOUNT_PROVIDER_DENIED"])}),
    revokedIdentity:Object.freeze({source:"stage5f-revoked-device-provider-probe",codes:Object.freeze(["STAGE5F_REVOKED_DEVICE_PROVIDER_DENIED"])}),
    staleRevision:Object.freeze({source:"production-shared-setup-stale-revision-probe",codes:Object.freeze(["SETUP_STALE_BASE_REVISION"])}),
    replayConflict:Object.freeze({source:"production-shared-setup-replay-conflict-probe",codes:Object.freeze(["SETUP_IDEMPOTENCY_CONFLICT"])}),
    directFieldSubstitution:Object.freeze({source:"shared-setup-production-direct-field-probe",codes:Object.freeze(["SETUP_DRAW_MISMATCH"])}),
    coordinatorBypass:Object.freeze({source:"shared-setup-production-coordinator-bypass-probe",codes:Object.freeze(["SETUP_COORDINATOR_REQUIRED","SHARED_SETUP_HOST_REQUIRED"])}),
  });
  const HASH=/^sha256:[a-f0-9]{64}$/;

  function revision(){
    const meta=root.document&&root.document.querySelector('meta[name="app-asset-revision"]');
    return meta&&meta.content?meta.content.trim():RUNTIME;
  }
  function now(){return new Date().toISOString();}
  function plain(value){return !!value&&typeof value==="object"&&!Array.isArray(value);}
  function fail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function fresh(){return {schemaVersion:1,evidenceType:"SSJR-1.1-production-shared-setup-negatives-safe",runtimeRevision:revision(),managerRole:null,accountFingerprint:null,deviceFingerprint:null,rivalryFingerprint:null,observations:{}};}
  function validHash(value){return HASH.test(String(value||""));}
  function load(){
    const base=fresh();
    try{
      const raw=root.sessionStorage&&root.sessionStorage.getItem(STORE_KEY);
      if(!raw)return base;
      const parsed=JSON.parse(raw);
      if(!plain(parsed)||parsed.schemaVersion!==1||parsed.runtimeRevision!==base.runtimeRevision)return base;
      if(parsed.evidenceType!==base.evidenceType||!plain(parsed.observations))return base;
      return parsed;
    }catch(_error){return base;}
  }
  let state=load();
  function persist(){try{if(root.sessionStorage)root.sessionStorage.setItem(STORE_KEY,JSON.stringify(state));}catch(_error){}return state;}
  function clear(){state=fresh();try{if(root.sessionStorage)root.sessionStorage.removeItem(STORE_KEY);}catch(_error){}return true;}
  function bindIdentity({managerRole,accountFingerprint,deviceFingerprint,rivalryFingerprint}={}){
    if(!["playerOne","playerTwo"].includes(managerRole))fail("SSJR_NEGATIVE_ROLE_INVALID");
    for(const [label,value] of Object.entries({accountFingerprint,deviceFingerprint,rivalryFingerprint}))if(!validHash(value))fail("SSJR_NEGATIVE_FINGERPRINT_INVALID",`${label} must be privacy-safe sha256 evidence.`);
    for(const [key,value] of Object.entries({managerRole,accountFingerprint,deviceFingerprint,rivalryFingerprint})){
      if(state[key]&&state[key]!==value)fail("SSJR_NEGATIVE_IDENTITY_CHANGED",`${key} changed during one acceptance run.`);
    }
    state={...state,managerRole,accountFingerprint,deviceFingerprint,rivalryFingerprint};persist();return getState();
  }
  function verifyKnownProof(name,result){
    const rule=RULES[name];
    if(!rule||!plain(result))return false;
    if(result.source!==rule.source||result.denied!==true||result.localStorageUnchanged!==true)return false;
    if(!rule.codes.includes(result.code))return false;
    if(name==="unrelatedAccount"&&result.providerAuthorizationDenied!==true)return false;
    if(name==="revokedIdentity"&&!(result.applicationAdapterDenied===true&&result.providerMutationDenied===true&&result.sessionUnchangedAfterDeniedMutation===true&&result.cleanupTerminal===true))return false;
    if(name==="expiredSession"&&result.sessionExpired!==true)return false;
    return true;
  }
  function record(name,result){
    if(!REQUIRED.includes(name))fail("SSJR_NEGATIVE_NAME_INVALID");
    if(revision()!==RUNTIME)fail("SSJR_NEGATIVE_RUNTIME_INVALID",`Exact runtime ${RUNTIME} is required.`);
    if(!state.managerRole||!validHash(state.accountFingerprint)||!validHash(state.deviceFingerprint)||!validHash(state.rivalryFingerprint))fail("SSJR_NEGATIVE_IDENTITY_REQUIRED","Bind the current privacy-safe manager identity before recording denials.");
    if(!verifyKnownProof(name,result))fail("SSJR_NEGATIVE_PROOF_NOT_ACCEPTED",`${name} did not satisfy the closed production-denial contract.`);
    const rule=RULES[name];
    const observation=Object.freeze({at:now(),status:"denied",source:rule.source,code:String(result.code),localStorageUnchanged:true});
    state={...state,observations:{...state.observations,[name]:observation}};persist();return observation;
  }
  function getNegatives(){return Object.freeze(Object.fromEntries(REQUIRED.map(name=>[name,state.observations[name]?.status==="denied"?"denied":null])));}
  function complete(){return REQUIRED.every(name=>state.observations[name]?.status==="denied");}
  function getBundle(){
    if(!complete())fail("SSJR_NEGATIVE_EVIDENCE_INCOMPLETE","All eight required production denials must be observed before export.");
    return Object.freeze(JSON.parse(JSON.stringify(state)));
  }
  function getState(){return Object.freeze({feature:FEATURE,runtimeRevision:state.runtimeRevision,managerRole:state.managerRole,complete:complete(),completedCount:REQUIRED.filter(name=>state.observations[name]?.status==="denied").length,requiredCount:REQUIRED.length,negatives:getNegatives()});}

  return Object.freeze({
    contractVersion:1,feature:FEATURE,requiredNegatives:REQUIRED,rules:RULES,
    rawAuthorityPersistence:false,canonicalStorageMutation:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,appCheckEnforcementRequired:false,
    bindIdentity,record,getNegatives,getBundle,getState,clear
  });
});

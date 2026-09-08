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

  function ssjrNegRevision(){
    const meta=root.document&&root.document.querySelector('meta[name="app-asset-revision"]');
    return meta&&meta.content?meta.content.trim():RUNTIME;
  }
  function ssjrNegNow(){return new Date().toISOString();}
  function ssjrNegPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value);}
  function ssjrNegFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function ssjrNegFresh(){return {schemaVersion:1,evidenceType:"SSJR-1.1-production-shared-setup-negatives-safe",runtimeRevision:ssjrNegRevision(),managerRole:null,accountFingerprint:null,deviceFingerprint:null,rivalryFingerprint:null,observations:{}};}
  function ssjrNegValidHash(value){return HASH.test(String(value||""));}
  function ssjrNegLoad(){
    const base=ssjrNegFresh();
    try{
      const raw=root.sessionStorage&&root.sessionStorage.getItem(STORE_KEY);
      if(!raw)return base;
      const parsed=JSON.parse(raw);
      if(!ssjrNegPlain(parsed)||parsed.schemaVersion!==1||parsed.runtimeRevision!==base.runtimeRevision)return base;
      if(parsed.evidenceType!==base.evidenceType||!ssjrNegPlain(parsed.observations))return base;
      return parsed;
    }catch(_error){return base;}
  }
  let state=ssjrNegLoad();
  function ssjrNegPersist(){try{if(root.sessionStorage)root.sessionStorage.setItem(STORE_KEY,JSON.stringify(state));}catch(_error){}return state;}
  function ssjrNegClear(){state=ssjrNegFresh();try{if(root.sessionStorage)root.sessionStorage.removeItem(STORE_KEY);}catch(_error){}return true;}
  function ssjrNegBindIdentity({managerRole,accountFingerprint,deviceFingerprint,rivalryFingerprint}={}){
    if(!["playerOne","playerTwo"].includes(managerRole))ssjrNegFail("SSJR_NEGATIVE_ROLE_INVALID");
    for(const [label,value] of Object.entries({accountFingerprint,deviceFingerprint,rivalryFingerprint}))if(!ssjrNegValidHash(value))ssjrNegFail("SSJR_NEGATIVE_FINGERPRINT_INVALID",`${label} must be privacy-safe sha256 evidence.`);
    for(const [key,value] of Object.entries({managerRole,accountFingerprint,deviceFingerprint,rivalryFingerprint})){
      if(state[key]&&state[key]!==value)ssjrNegFail("SSJR_NEGATIVE_IDENTITY_CHANGED",`${key} changed during one acceptance run.`);
    }
    state={...state,managerRole,accountFingerprint,deviceFingerprint,rivalryFingerprint};ssjrNegPersist();return ssjrNegGetState();
  }
  function ssjrNegVerifyKnownProof(name,result){
    const rule=RULES[name];
    if(!rule||!ssjrNegPlain(result))return false;
    if(result.source!==rule.source||result.denied!==true||result.localStorageUnchanged!==true)return false;
    if(!rule.codes.includes(result.code))return false;
    if(name==="unrelatedAccount"&&result.providerAuthorizationDenied!==true)return false;
    if(name==="revokedIdentity"&&!(result.applicationAdapterDenied===true&&result.providerMutationDenied===true&&result.sessionUnchangedAfterDeniedMutation===true&&result.cleanupTerminal===true))return false;
    if(name==="expiredSession"&&result.sessionExpired!==true)return false;
    return true;
  }
  function ssjrNegRecord(name,result){
    if(!REQUIRED.includes(name))ssjrNegFail("SSJR_NEGATIVE_NAME_INVALID");
    if(ssjrNegRevision()!==RUNTIME)ssjrNegFail("SSJR_NEGATIVE_RUNTIME_INVALID",`Exact runtime ${RUNTIME} is required.`);
    if(!state.managerRole||!ssjrNegValidHash(state.accountFingerprint)||!ssjrNegValidHash(state.deviceFingerprint)||!ssjrNegValidHash(state.rivalryFingerprint))ssjrNegFail("SSJR_NEGATIVE_IDENTITY_REQUIRED","Bind the current privacy-safe manager identity before recording denials.");
    if(!ssjrNegVerifyKnownProof(name,result))ssjrNegFail("SSJR_NEGATIVE_PROOF_NOT_ACCEPTED",`${name} did not satisfy the closed production-denial contract.`);
    const rule=RULES[name];
    const observation=Object.freeze({at:ssjrNegNow(),status:"denied",source:rule.source,code:String(result.code),localStorageUnchanged:true});
    state={...state,observations:{...state.observations,[name]:observation}};ssjrNegPersist();return observation;
  }
  function ssjrNegGetNegatives(){return Object.freeze(Object.fromEntries(REQUIRED.map(name=>[name,state.observations[name]?.status==="denied"?"denied":null])));}
  function ssjrNegComplete(){return REQUIRED.every(name=>state.observations[name]?.status==="denied");}
  function ssjrNegGetBundle(){
    if(!ssjrNegComplete())ssjrNegFail("SSJR_NEGATIVE_EVIDENCE_INCOMPLETE","All eight required production denials must be observed before export.");
    return Object.freeze(JSON.parse(JSON.stringify(state)));
  }
  function ssjrNegGetState(){return Object.freeze({feature:FEATURE,runtimeRevision:state.runtimeRevision,managerRole:state.managerRole,complete:ssjrNegComplete(),completedCount:REQUIRED.filter(name=>state.observations[name]?.status==="denied").length,requiredCount:REQUIRED.length,negatives:ssjrNegGetNegatives()});}

  return Object.freeze({
    contractVersion:1,feature:FEATURE,requiredNegatives:REQUIRED,rules:RULES,
    rawAuthorityPersistence:false,canonicalStorageMutation:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,appCheckEnforcementRequired:false,
    bindIdentity:ssjrNegBindIdentity,record:ssjrNegRecord,getNegatives:ssjrNegGetNegatives,getBundle:ssjrNegGetBundle,getState:ssjrNegGetState,clear:ssjrNegClear
  });
});

(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSSJRProductionNegativeEvidence=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const FEATURE="ssjr-production-negative-evidence";
  const STORE_KEY="careerModeShowdown.ssjrAcceptance.negatives.safe.v2";
  const RUNTIME="1.9.1-r6";
  const PROVENANCE="direct-production-probe-v1";
  const REQUIRED=Object.freeze(["wrongSession","expiredSession","unrelatedAccount","revokedIdentity","staleRevision","replayConflict","directFieldSubstitution","coordinatorBypass"]);
  const RULES=Object.freeze({
    wrongSession:Object.freeze({source:"production-shared-setup-wrong-session-probe",codes:Object.freeze(["SETUP_SESSION_INVALID","SETUP_SESSION_MISMATCH","SETUP_ACTIVE_SESSION_REQUIRED","SHARED_SETUP_AUTHORITY_MISMATCH"])}),
    expiredSession:Object.freeze({source:"production-shared-setup-expired-session-probe",codes:Object.freeze(["SETUP_ACTIVE_SESSION_REQUIRED","SHARED_SETUP_ACTIVE_SESSION_REQUIRED"])}),
    unrelatedAccount:Object.freeze({source:"stage5f-third-account-provider-probe",codes:Object.freeze(["STAGE5F_THIRD_ACCOUNT_PROVIDER_DENIED"])}),
    revokedIdentity:Object.freeze({source:"stage5f-revoked-device-provider-probe",codes:Object.freeze(["STAGE5F_REVOKED_DEVICE_PROVIDER_DENIED"])}),
    staleRevision:Object.freeze({source:"production-shared-setup-stale-revision-probe",codes:Object.freeze(["SETUP_STALE_BASE_REVISION"])}),
    replayConflict:Object.freeze({source:"production-shared-setup-replay-conflict-probe",codes:Object.freeze(["SETUP_IDEMPOTENCY_CONFLICT"])}),
    directFieldSubstitution:Object.freeze({source:"shared-setup-production-direct-field-probe",codes:Object.freeze(["SETUP_DRAW_MISMATCH"])}),
    coordinatorBypass:Object.freeze({source:"shared-setup-production-coordinator-bypass-probe",codes:Object.freeze(["SETUP_COORDINATOR_REQUIRED","SHARED_SETUP_HOST_REQUIRED"])}),
  });
  const HASH=/^sha256:[a-f0-9]{64}$/;
  const TOP=new Set(["schemaVersion","evidenceType","runtimeRevision","managerRole","accountFingerprint","deviceFingerprint","rivalryFingerprint","observations"]);
  const OBS=new Set(["at","status","source","code","localStorageUnchanged","provenance"]);
  function ssjrNegEvidenceRevision(){const meta=root.document&&root.document.querySelector('meta[name="app-asset-revision"]');return meta&&meta.content?meta.content.trim():RUNTIME;}
  function ssjrNegEvidenceNow(){return new Date().toISOString();}
  function ssjrNegEvidencePlain(v){return !!v&&typeof v==="object"&&!Array.isArray(v);}
  function ssjrNegEvidenceExact(v,keys){return ssjrNegEvidencePlain(v)&&Object.keys(v).length===keys.size&&Object.keys(v).every(k=>keys.has(k));}
  function ssjrNegEvidenceFail(code,message){const e=new Error(message||code);e.code=code;throw e;}
  function ssjrNegEvidenceFresh(){return {schemaVersion:2,evidenceType:"SSJR-1.1-production-shared-setup-negatives-safe",runtimeRevision:ssjrNegEvidenceRevision(),managerRole:null,accountFingerprint:null,deviceFingerprint:null,rivalryFingerprint:null,observations:{}};}
  function ssjrNegEvidenceValidHash(v){return HASH.test(String(v||""));}
  function ssjrNegEvidenceValidObservation(name,o){const rule=RULES[name];return !!rule&&ssjrNegEvidenceExact(o,OBS)&&o.status==="denied"&&o.source===rule.source&&rule.codes.includes(o.code)&&o.localStorageUnchanged===true&&o.provenance===PROVENANCE&&Number.isFinite(Date.parse(String(o.at||"")));}
  function ssjrNegEvidenceSanitize(parsed,base){
    if(!ssjrNegEvidenceExact(parsed,TOP)||parsed.schemaVersion!==2||parsed.evidenceType!==base.evidenceType||parsed.runtimeRevision!==base.runtimeRevision||!ssjrNegEvidencePlain(parsed.observations))return null;
    if(parsed.managerRole!==null&&!['playerOne','playerTwo'].includes(parsed.managerRole))return null;
    for(const key of ["accountFingerprint","deviceFingerprint","rivalryFingerprint"])if(parsed[key]!==null&&!ssjrNegEvidenceValidHash(parsed[key]))return null;
    const observations={};for(const [name,o] of Object.entries(parsed.observations)){if(!REQUIRED.includes(name)||!ssjrNegEvidenceValidObservation(name,o))return null;observations[name]={at:o.at,status:"denied",source:o.source,code:o.code,localStorageUnchanged:true,provenance:PROVENANCE};}
    return {...base,managerRole:parsed.managerRole,accountFingerprint:parsed.accountFingerprint,deviceFingerprint:parsed.deviceFingerprint,rivalryFingerprint:parsed.rivalryFingerprint,observations};
  }
  function ssjrNegEvidenceLoad(){const base=ssjrNegEvidenceFresh();try{const raw=root.sessionStorage&&root.sessionStorage.getItem(STORE_KEY);if(!raw)return base;return ssjrNegEvidenceSanitize(JSON.parse(raw),base)||base;}catch(_e){return base;}}
  let state=ssjrNegEvidenceLoad();
  function ssjrNegEvidencePersist(){try{if(root.sessionStorage)root.sessionStorage.setItem(STORE_KEY,JSON.stringify(state));}catch(_e){}return state;}
  function ssjrNegEvidenceClear(){state=ssjrNegEvidenceFresh();try{if(root.sessionStorage)root.sessionStorage.removeItem(STORE_KEY);}catch(_e){}return true;}
  function ssjrNegEvidenceBindIdentity({managerRole,accountFingerprint,deviceFingerprint,rivalryFingerprint}={}){
    if(!['playerOne','playerTwo'].includes(managerRole))ssjrNegEvidenceFail("SSJR_NEGATIVE_ROLE_INVALID");
    for(const [label,value] of Object.entries({accountFingerprint,deviceFingerprint,rivalryFingerprint}))if(!ssjrNegEvidenceValidHash(value))ssjrNegEvidenceFail("SSJR_NEGATIVE_FINGERPRINT_INVALID",`${label} must be privacy-safe sha256 evidence.`);
    for(const [key,value] of Object.entries({managerRole,accountFingerprint,deviceFingerprint,rivalryFingerprint}))if(state[key]&&state[key]!==value)ssjrNegEvidenceFail("SSJR_NEGATIVE_IDENTITY_CHANGED",`${key} changed during one acceptance run.`);
    state={...state,managerRole,accountFingerprint,deviceFingerprint,rivalryFingerprint};ssjrNegEvidencePersist();return ssjrNegEvidenceGetState();
  }
  function ssjrNegEvidenceRunner(){const api=root.CareerModeSSJRProductionNegativeProbeRunner;if(!api||api.probeContract!=="ssjr-negative-probe-runner-v1"||typeof api.run!=="function")ssjrNegEvidenceFail("SSJR_NEGATIVE_PROBE_RUNNER_UNAVAILABLE");return api;}
  async function ssjrNegEvidenceRunProbe(name,options={}){
    if(!REQUIRED.includes(name))ssjrNegEvidenceFail("SSJR_NEGATIVE_NAME_INVALID");if(ssjrNegEvidenceRevision()!==RUNTIME)ssjrNegEvidenceFail("SSJR_NEGATIVE_RUNTIME_INVALID",`Exact runtime ${RUNTIME} is required.`);
    if(!state.managerRole||!ssjrNegEvidenceValidHash(state.accountFingerprint)||!ssjrNegEvidenceValidHash(state.deviceFingerprint)||!ssjrNegEvidenceValidHash(state.rivalryFingerprint))ssjrNegEvidenceFail("SSJR_NEGATIVE_IDENTITY_REQUIRED","Bind the current privacy-safe manager identity before running denials.");
    const result=await ssjrNegEvidenceRunner().run(name,options);const rule=RULES[name];
    if(!ssjrNegEvidencePlain(result)||result.ok!==true||result.probeContract!=="ssjr-negative-probe-runner-v1"||result.denied!==true||result.source!==rule.source||!rule.codes.includes(result.code)||result.localStorageUnchanged!==true)ssjrNegEvidenceFail("SSJR_NEGATIVE_PROOF_NOT_ACCEPTED",`${name} did not satisfy the direct production probe contract.`);
    const observation=Object.freeze({at:ssjrNegEvidenceNow(),status:"denied",source:rule.source,code:String(result.code),localStorageUnchanged:true,provenance:PROVENANCE});
    state={...state,observations:{...state.observations,[name]:observation}};ssjrNegEvidencePersist();return observation;
  }
  function ssjrNegEvidenceGetNegatives(){return Object.freeze(Object.fromEntries(REQUIRED.map(name=>[name,state.observations[name]?.status==="denied"?"denied":null])));}
  function ssjrNegEvidenceComplete(){return REQUIRED.every(name=>ssjrNegEvidenceValidObservation(name,state.observations[name]));}
  function ssjrNegEvidenceGetBundle(){if(!ssjrNegEvidenceComplete())ssjrNegEvidenceFail("SSJR_NEGATIVE_EVIDENCE_INCOMPLETE","All eight required production denials must be directly observed before export.");return Object.freeze(JSON.parse(JSON.stringify(state)));}
  function ssjrNegEvidenceGetState(){return Object.freeze({feature:FEATURE,runtimeRevision:state.runtimeRevision,managerRole:state.managerRole,complete:ssjrNegEvidenceComplete(),completedCount:REQUIRED.filter(name=>ssjrNegEvidenceValidObservation(name,state.observations[name])).length,requiredCount:REQUIRED.length,negatives:ssjrNegEvidenceGetNegatives()});}
  return Object.freeze({contractVersion:2,feature:FEATURE,requiredNegatives:REQUIRED,rules:RULES,provenance:PROVENANCE,rawAuthorityPersistence:false,canonicalStorageMutation:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,appCheckEnforcementRequired:false,bindIdentity:ssjrNegEvidenceBindIdentity,runProbe:ssjrNegEvidenceRunProbe,getNegatives:ssjrNegEvidenceGetNegatives,getBundle:ssjrNegEvidenceGetBundle,getState:ssjrNegEvidenceGetState,clear:ssjrNegEvidenceClear});
});

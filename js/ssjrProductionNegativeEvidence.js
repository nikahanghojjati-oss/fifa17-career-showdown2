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
  function revision(){const meta=root.document&&root.document.querySelector('meta[name="app-asset-revision"]');return meta&&meta.content?meta.content.trim():RUNTIME;}
  function now(){return new Date().toISOString();}
  function plain(v){return !!v&&typeof v==="object"&&!Array.isArray(v);}
  function exact(v,keys){return plain(v)&&Object.keys(v).length===keys.size&&Object.keys(v).every(k=>keys.has(k));}
  function fail(code,message){const e=new Error(message||code);e.code=code;throw e;}
  function fresh(){return {schemaVersion:2,evidenceType:"SSJR-1.1-production-shared-setup-negatives-safe",runtimeRevision:revision(),managerRole:null,accountFingerprint:null,deviceFingerprint:null,rivalryFingerprint:null,observations:{}};}
  function validHash(v){return HASH.test(String(v||""));}
  function validObservation(name,o){const rule=RULES[name];return !!rule&&exact(o,OBS)&&o.status==="denied"&&o.source===rule.source&&rule.codes.includes(o.code)&&o.localStorageUnchanged===true&&o.provenance===PROVENANCE&&Number.isFinite(Date.parse(String(o.at||"")));}
  function sanitize(parsed,base){
    if(!exact(parsed,TOP)||parsed.schemaVersion!==2||parsed.evidenceType!==base.evidenceType||parsed.runtimeRevision!==base.runtimeRevision||!plain(parsed.observations))return null;
    if(parsed.managerRole!==null&&!['playerOne','playerTwo'].includes(parsed.managerRole))return null;
    for(const key of ["accountFingerprint","deviceFingerprint","rivalryFingerprint"])if(parsed[key]!==null&&!validHash(parsed[key]))return null;
    const observations={};for(const [name,o] of Object.entries(parsed.observations)){if(!REQUIRED.includes(name)||!validObservation(name,o))return null;observations[name]={at:o.at,status:"denied",source:o.source,code:o.code,localStorageUnchanged:true,provenance:PROVENANCE};}
    return {...base,managerRole:parsed.managerRole,accountFingerprint:parsed.accountFingerprint,deviceFingerprint:parsed.deviceFingerprint,rivalryFingerprint:parsed.rivalryFingerprint,observations};
  }
  function load(){const base=fresh();try{const raw=root.sessionStorage&&root.sessionStorage.getItem(STORE_KEY);if(!raw)return base;return sanitize(JSON.parse(raw),base)||base;}catch(_e){return base;}}
  let state=load();
  function persist(){try{if(root.sessionStorage)root.sessionStorage.setItem(STORE_KEY,JSON.stringify(state));}catch(_e){}return state;}
  function clear(){state=fresh();try{if(root.sessionStorage)root.sessionStorage.removeItem(STORE_KEY);}catch(_e){}return true;}
  function bindIdentity({managerRole,accountFingerprint,deviceFingerprint,rivalryFingerprint}={}){
    if(!['playerOne','playerTwo'].includes(managerRole))fail("SSJR_NEGATIVE_ROLE_INVALID");
    for(const [label,value] of Object.entries({accountFingerprint,deviceFingerprint,rivalryFingerprint}))if(!validHash(value))fail("SSJR_NEGATIVE_FINGERPRINT_INVALID",`${label} must be privacy-safe sha256 evidence.`);
    for(const [key,value] of Object.entries({managerRole,accountFingerprint,deviceFingerprint,rivalryFingerprint}))if(state[key]&&state[key]!==value)fail("SSJR_NEGATIVE_IDENTITY_CHANGED",`${key} changed during one acceptance run.`);
    state={...state,managerRole,accountFingerprint,deviceFingerprint,rivalryFingerprint};persist();return getState();
  }
  function runner(){const api=root.CareerModeSSJRProductionNegativeProbeRunner;if(!api||api.probeContract!=="ssjr-negative-probe-runner-v1"||typeof api.run!=="function")fail("SSJR_NEGATIVE_PROBE_RUNNER_UNAVAILABLE");return api;}
  async function runProbe(name,options={}){
    if(!REQUIRED.includes(name))fail("SSJR_NEGATIVE_NAME_INVALID");if(revision()!==RUNTIME)fail("SSJR_NEGATIVE_RUNTIME_INVALID",`Exact runtime ${RUNTIME} is required.`);
    if(!state.managerRole||!validHash(state.accountFingerprint)||!validHash(state.deviceFingerprint)||!validHash(state.rivalryFingerprint))fail("SSJR_NEGATIVE_IDENTITY_REQUIRED","Bind the current privacy-safe manager identity before running denials.");
    const result=await runner().run(name,options);const rule=RULES[name];
    if(!plain(result)||result.ok!==true||result.probeContract!=="ssjr-negative-probe-runner-v1"||result.denied!==true||result.source!==rule.source||!rule.codes.includes(result.code)||result.localStorageUnchanged!==true)fail("SSJR_NEGATIVE_PROOF_NOT_ACCEPTED",`${name} did not satisfy the direct production probe contract.`);
    const observation=Object.freeze({at:now(),status:"denied",source:rule.source,code:String(result.code),localStorageUnchanged:true,provenance:PROVENANCE});
    state={...state,observations:{...state.observations,[name]:observation}};persist();return observation;
  }
  function getNegatives(){return Object.freeze(Object.fromEntries(REQUIRED.map(name=>[name,state.observations[name]?.status==="denied"?"denied":null])));}
  function complete(){return REQUIRED.every(name=>validObservation(name,state.observations[name]));}
  function getBundle(){if(!complete())fail("SSJR_NEGATIVE_EVIDENCE_INCOMPLETE","All eight required production denials must be directly observed before export.");return Object.freeze(JSON.parse(JSON.stringify(state)));}
  function getState(){return Object.freeze({feature:FEATURE,runtimeRevision:state.runtimeRevision,managerRole:state.managerRole,complete:complete(),completedCount:REQUIRED.filter(name=>validObservation(name,state.observations[name])).length,requiredCount:REQUIRED.length,negatives:getNegatives()});}
  return Object.freeze({contractVersion:2,feature:FEATURE,requiredNegatives:REQUIRED,rules:RULES,provenance:PROVENANCE,rawAuthorityPersistence:false,canonicalStorageMutation:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,appCheckEnforcementRequired:false,bindIdentity,runProbe,getNegatives,getBundle,getState,clear});
});

(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionProviderAbuseAcceptance=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const FEATURE="production-provider-abuse-acceptance";
  const FIREBASE_SDK_VERSION="12.17.0";

  function fail(code,message,extra={}){
    return Object.freeze({ok:false,feature:FEATURE,code,message,...extra});
  }

  function pass(code,extra={}){
    return Object.freeze({ok:true,feature:FEATURE,code,...extra});
  }

  function permissionDenied(error){
    const acceptance=root.CareerModeProductionAuthorizationAcceptance;
    if(acceptance&&typeof acceptance.isPermissionDenied==="function")return acceptance.isPermissionDenied(error);
    const code=error&&typeof error.code==="string"?error.code.trim().toLowerCase():"";
    const message=error&&typeof error.message==="string"?error.message:"";
    return code==="permission-denied"||code==="firestore/permission-denied"||code==="permission_denied"||/missing or insufficient permissions/i.test(message);
  }

  function snapshotStorage(storage){
    const acceptance=root.CareerModeProductionAuthorizationAcceptance;
    if(acceptance&&typeof acceptance.snapshotStorage==="function")return acceptance.snapshotStorage(storage);
    if(!storage||typeof storage.length!=="number"||typeof storage.key!=="function"||typeof storage.getItem!=="function")return null;
    const entries=[];
    for(let index=0;index<storage.length;index+=1){
      const key=storage.key(index);
      entries.push([key,storage.getItem(key)]);
    }
    entries.sort((a,b)=>String(a[0]).localeCompare(String(b[0])));
    return JSON.stringify(entries);
  }

  async function fingerprint(value,cryptoImpl=root.crypto){
    const acceptance=root.CareerModeProductionAuthorizationAcceptance;
    if(acceptance&&typeof acceptance.fingerprint==="function")return acceptance.fingerprint(value,cryptoImpl);
    if(!cryptoImpl||!cryptoImpl.subtle||typeof cryptoImpl.subtle.digest!=="function")return null;
    const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(String(value??"")));
    return `sha256:${Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}`;
  }

  function normalizeUser(user){
    const uid=user&&typeof user.uid==="string"?user.uid.trim():"";
    if(!uid)throw Object.assign(new Error("Sign in with an existing legitimate Connected Account first."),{code:"PROVIDER_ABUSE_AUTH_REQUIRED"});
    return uid;
  }

  async function probeAuthenticatedRivalryListDenial(options={}){
    try{
      const accountId=normalizeUser(options.user);
      if(typeof options.collectionImpl!=="function"||typeof options.queryImpl!=="function"||typeof options.limitImpl!=="function"||typeof options.getDocsImpl!=="function"){
        return fail("PROVIDER_ABUSE_FIRESTORE_QUERY_UNAVAILABLE","Firestore query helpers are unavailable.");
      }
      const before=snapshotStorage(options.localStorageImpl);
      const collectionRef=options.collectionImpl(options.firestore,"rivalries");
      const boundedQuery=options.queryImpl(collectionRef,options.limitImpl(1));
      let listDenied=false;
      let providerErrorCode=null;
      try{
        await options.getDocsImpl(boundedQuery);
      }catch(error){
        listDenied=permissionDenied(error);
        providerErrorCode=error&&error.code?String(error.code):"unknown";
      }
      const after=snapshotStorage(options.localStorageImpl);
      const localStorageUnchanged=before===after;
      const accountFingerprint=await fingerprint(accountId,options.cryptoImpl||root.crypto);
      const evidence={
        probe:"authenticated-rivalry-list-denial",
        accountFingerprint,
        providerBoundary:"rivalries-collection-list",
        authenticatedAccountRequired:true,
        queryLimit:1,
        rivalryListDenied:listDenied,
        providerErrorCode,
        firestoreWritesRequested:0,
        localStorageUnchanged,
        providerAbuseAcceptanceCandidate:listDenied&&localStorageUnchanged,
        rjrEligibleEvidenceCandidate:listDenied&&localStorageUnchanged
      };
      if(!listDenied){
        return fail("PROVIDER_ABUSE_LIST_DENIAL_NOT_PROVEN","The authenticated rivalry collection query was not denied by the provider. No RJR credit is allowed from this result.",evidence);
      }
      if(!localStorageUnchanged){
        return fail("PROVIDER_ABUSE_LOCAL_STORAGE_CHANGED","The read-only provider-abuse probe observed an unexpected browser-storage change.",evidence);
      }
      return pass("PROVIDER_ABUSE_AUTHENTICATED_LIST_DENIED",evidence);
    }catch(error){
      return fail(error&&error.code?error.code:"PROVIDER_ABUSE_PROBE_FAILED",error&&error.message?error.message:"Production provider-abuse probe failed.");
    }
  }

  async function browserContext(){
    const runtime=root.CareerModeProductionFirebaseRuntime;
    const acceptance=root.CareerModeProductionAuthorizationAcceptance;
    if(!runtime||typeof runtime.ensureAccountServices!=="function")throw Object.assign(new Error("Production Firebase runtime is unavailable."),{code:"PROVIDER_ABUSE_RUNTIME_UNAVAILABLE"});
    if(!acceptance||typeof acceptance.existingActiveAccount!=="function")throw Object.assign(new Error("Production authorization acceptance runtime is unavailable."),{code:"PROVIDER_ABUSE_ACCEPTANCE_RUNTIME_UNAVAILABLE"});
    const services=await runtime.ensureAccountServices();
    if(!services||services.ok!==true)throw Object.assign(new Error("Firebase account services are unavailable."),{code:"PROVIDER_ABUSE_ACCOUNT_SERVICES_UNAVAILABLE"});
    const moduleUrl=runtime.firebaseFirestoreModule||`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-firestore.js`;
    const firestoreModule=await import(moduleUrl);
    for(const helper of ["getDoc","getDocs","collection","query","limit"]){
      if(typeof firestoreModule[helper]!=="function")throw Object.assign(new Error(`Firestore ${helper} is unavailable.`),{code:"PROVIDER_ABUSE_FIRESTORE_QUERY_UNAVAILABLE"});
    }
    return {runtime,acceptance,services,firestoreModule};
  }

  async function requireExistingActiveAccount(context){
    const user=context.services.auth&&context.services.auth.currentUser;
    if(!user)throw Object.assign(new Error("Sign in with an existing legitimate Connected Account first."),{code:"PROVIDER_ABUSE_AUTH_REQUIRED"});
    const account=await context.acceptance.existingActiveAccount({services:context.services,getDocImpl:context.firestoreModule.getDoc},user);
    if(!account.active)throw Object.assign(new Error("This authenticated identity is not an existing active private account. No account state will be created for this probe."),{code:"PROVIDER_ABUSE_EXISTING_ACTIVE_ACCOUNT_REQUIRED"});
    return user;
  }

  function setText(id,text){const element=root.document&&root.document.getElementById(id);if(element)element.textContent=text;}
  function setDisabled(id,value){const element=root.document&&root.document.getElementById(id);if(element)element.disabled=Boolean(value);}
  function runtimeRevision(){const meta=root.document&&root.document.querySelector('meta[name="app-asset-revision"]');return meta&&meta.content?meta.content.trim():null;}

  function renderResult(result){
    const record=Object.freeze({
      schemaVersion:1,
      feature:FEATURE,
      generatedAt:new Date().toISOString(),
      applicationVersion:"1.8.1",
      runtimeRevision:runtimeRevision(),
      origin:root.location&&root.location.origin?root.location.origin:null,
      result:result&&result.ok===true?"PASS":"NOT_PROVEN",
      ...result
    });
    const output=root.document&&root.document.getElementById("authorizationAcceptanceEvidence");
    if(output)output.textContent=JSON.stringify(record,null,2);
    setText("authorizationAcceptanceStatus",record.result==="PASS"?"PASS · authenticated production rivalry enumeration was denied by Firestore with zero writes and unchanged local storage":"NOT PROVEN · no RJR credit should be awarded from this result");
    return record;
  }

  async function runFromPage(){
    setDisabled("authorizationProviderAbuseProbe",true);
    setText("authorizationAcceptanceStatus","Checking authenticated production rivalry enumeration denial…");
    try{
      const context=await browserContext();
      const user=await requireExistingActiveAccount(context);
      const result=await probeAuthenticatedRivalryListDenial({
        user,
        firestore:context.services.firestore,
        collectionImpl:context.firestoreModule.collection,
        queryImpl:context.firestoreModule.query,
        limitImpl:context.firestoreModule.limit,
        getDocsImpl:context.firestoreModule.getDocs,
        localStorageImpl:root["local"+"Storage"],
        cryptoImpl:root.crypto
      });
      return renderResult(result);
    }finally{
      setDisabled("authorizationProviderAbuseProbe",false);
    }
  }

  async function mountPage(){
    if(!root.document)return false;
    const button=root.document.getElementById("authorizationProviderAbuseProbe");
    if(!button)return false;
    button.addEventListener("click",()=>{void runFromPage().catch(error=>renderResult(fail(error&&error.code?error.code:"PROVIDER_ABUSE_PROBE_FAILED",error&&error.message?error.message:"Production provider-abuse probe failed.")));});
    return true;
  }

  if(root.document){
    const start=()=>{void mountPage();};
    if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",start,{once:true});else start();
  }

  return Object.freeze({
    contractVersion:1,
    feature:FEATURE,
    rjrCreditOnImplementation:false,
    providerWriteCreationAllowed:false,
    productionMutationPolicy:"authenticated-read-only-rivalry-enumeration-denial",
    probeAuthenticatedRivalryListDenial,
    mountPage
  });
});

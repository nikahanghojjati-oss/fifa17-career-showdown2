(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeTrustedAccountDeletionExecution=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const REQUIRED_CLEANUP_PROOF_FIELDS=Object.freeze([
    "devicesRevoked",
    "invitesRevoked",
    "sessionsClosed",
    "rivalriesProcessed",
    "profileLinksDetached",
    "presentationLabelsMinimized",
    "tombstoneRestorationAuthorityRemoved",
    "boundedMetadataHandled",
    "survivingOwnerEntitlementsPreserved",
    "sharedGameplayDestroyedWithoutRequiredConsent"
  ]);

  function isRecord(value){
    return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
  }

  function nonEmptyString(value){
    return typeof value==="string"&&value.trim().length>0;
  }

  function deepFreeze(value){
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  function boundedFailure(code,status="rejected",extra={}){
    return deepFreeze(Object.assign({ok:false,status,code},extra));
  }

  function normalizeVerifiedUid(value){
    return nonEmptyString(value)?value.trim():null;
  }

  function validateAccountEnvelope(accountId,account){
    if(account===null)return null;
    if(!isRecord(account))return "ACCOUNT_DOCUMENT_INVALID";
    if(account.schemaVersion!==1||account.objectType!=="account"||account.objectId!==accountId){
      return "ACCOUNT_DOCUMENT_IDENTITY_CONFLICT";
    }
    if(!Number.isInteger(account.revision)||account.revision<0)return "ACCOUNT_DOCUMENT_REVISION_INVALID";
    if(account.lifecycleState!=="live"||account.tombstone!==null)return "ACCOUNT_DOCUMENT_LIFECYCLE_INVALID";
    if(!isRecord(account.data)||!["active","disabled","deletion-pending"].includes(account.data.status)){
      return "ACCOUNT_DOCUMENT_STATUS_INVALID";
    }
    return null;
  }

  function validateCleanupProof(accountId,proof){
    if(!isRecord(proof)||proof.accountId!==accountId)return false;
    if(REQUIRED_CLEANUP_PROOF_FIELDS.some(field=>!Object.prototype.hasOwnProperty.call(proof,field)))return false;
    if(proof.devicesRevoked!==true)return false;
    if(proof.invitesRevoked!==true)return false;
    if(proof.sessionsClosed!==true)return false;
    if(proof.rivalriesProcessed!==true)return false;
    if(proof.profileLinksDetached!==true)return false;
    if(proof.presentationLabelsMinimized!==true)return false;
    if(proof.tombstoneRestorationAuthorityRemoved!==true)return false;
    if(proof.boundedMetadataHandled!==true)return false;
    if(proof.survivingOwnerEntitlementsPreserved!==true)return false;
    if(proof.sharedGameplayDestroyedWithoutRequiredConsent!==false)return false;
    return true;
  }

  function validateAdapters(input){
    const required=["loadState","beginDeletion","cleanupApplicationData","deleteProviderPrincipal","finalizeApplicationAccount"];
    return required.every(name=>typeof input[name]==="function");
  }

  async function executeTrustedAccountDeletion(input){
    if(!isRecord(input))return boundedFailure("INVALID_ACCOUNT_DELETION_INPUT");
    if(!validateAdapters(input))return boundedFailure("ACCOUNT_DELETION_ADAPTER_MISSING");

    const accountId=normalizeVerifiedUid(input.verifiedUid);
    if(!accountId)return boundedFailure("UNAUTHENTICATED_PROVIDER");
    if(input.operationAuthorizationGranted!==true)return boundedFailure("ACCOUNT_DELETION_OPERATION_UNAUTHORIZED");

    let state;
    try{
      state=await input.loadState(accountId);
    }catch(_error){
      return boundedFailure("ACCOUNT_DELETION_STATE_UNAVAILABLE","retryable");
    }
    if(!isRecord(state))return boundedFailure("ACCOUNT_DELETION_STATE_INVALID");

    const account=Object.prototype.hasOwnProperty.call(state,"account")?state.account:null;
    const providerPrincipalState=state.providerPrincipalState;
    if(!["present","absent"].includes(providerPrincipalState))return boundedFailure("PROVIDER_PRINCIPAL_STATE_INVALID");

    const envelopeError=validateAccountEnvelope(accountId,account);
    if(envelopeError)return boundedFailure(envelopeError);

    if(account===null){
      if(providerPrincipalState==="absent"){
        return deepFreeze({ok:true,status:"completed",action:"already-complete",accountId,mutationPerformed:false});
      }
      return boundedFailure("ACCOUNT_DOCUMENT_MISSING_WITH_PROVIDER_PRINCIPAL");
    }

    if(account.data.status==="disabled"){
      return boundedFailure("ACCOUNT_DISABLED_SELF_DELETION_FORBIDDEN");
    }

    let deletionRevision=account.revision;
    let beganDeletion=false;
    if(account.data.status==="active"){
      let beginResult;
      try{
        beginResult=await input.beginDeletion(deepFreeze({
          accountId,
          expectedRevision:account.revision,
          nextStatus:"deletion-pending"
        }));
      }catch(_error){
        return boundedFailure("ACCOUNT_DELETION_BEGIN_FAILED","retryable",{accountId});
      }
      if(!isRecord(beginResult)||beginResult.committed!==true||beginResult.accountId!==accountId||beginResult.status!=="deletion-pending"||beginResult.revision!==account.revision+1){
        return boundedFailure("ACCOUNT_DELETION_BEGIN_COMMIT_MISMATCH","retryable",{accountId});
      }
      deletionRevision=beginResult.revision;
      beganDeletion=true;
    }

    let cleanupProof;
    try{
      cleanupProof=await input.cleanupApplicationData(deepFreeze({accountId,deletionRevision}));
    }catch(_error){
      return boundedFailure("ACCOUNT_DELETION_CLEANUP_FAILED","retryable",{accountId,deletionPending:true,beganDeletion});
    }
    if(!validateCleanupProof(accountId,cleanupProof)){
      return boundedFailure("ACCOUNT_DELETION_CLEANUP_INCOMPLETE","retryable",{accountId,deletionPending:true,beganDeletion});
    }

    let providerDeleted=providerPrincipalState==="absent";
    if(!providerDeleted){
      let providerResult;
      try{
        providerResult=await input.deleteProviderPrincipal(deepFreeze({accountId}));
      }catch(_error){
        return boundedFailure("ACCOUNT_DELETION_PROVIDER_DELETE_FAILED","retryable",{accountId,deletionPending:true,cleanupComplete:true});
      }
      if(!isRecord(providerResult)||providerResult.accountId!==accountId||!["deleted","already-absent"].includes(providerResult.status)){
        return boundedFailure("ACCOUNT_DELETION_PROVIDER_DELETE_UNCONFIRMED","retryable",{accountId,deletionPending:true,cleanupComplete:true});
      }
      providerDeleted=true;
    }

    if(!providerDeleted){
      return boundedFailure("ACCOUNT_DELETION_PROVIDER_DELETE_UNCONFIRMED","retryable",{accountId,deletionPending:true,cleanupComplete:true});
    }

    let finalResult;
    try{
      finalResult=await input.finalizeApplicationAccount(deepFreeze({accountId,deletionRevision}));
    }catch(_error){
      return boundedFailure("ACCOUNT_DELETION_FINALIZATION_FAILED","retryable",{accountId,deletionPending:true,cleanupComplete:true,providerDeleted:true});
    }
    if(!isRecord(finalResult)||finalResult.accountId!==accountId||!["deleted","already-absent"].includes(finalResult.status)){
      return boundedFailure("ACCOUNT_DELETION_FINALIZATION_UNCONFIRMED","retryable",{accountId,deletionPending:true,cleanupComplete:true,providerDeleted:true});
    }

    return deepFreeze({
      ok:true,
      status:"completed",
      action:"account-deleted",
      accountId,
      deletionRevision,
      beganDeletion,
      cleanupComplete:true,
      providerDeleted:true,
      applicationAccountDeleted:true,
      mutationPerformed:true
    });
  }

  return deepFreeze({
    contractVersion:1,
    productionRuntimeConnected:false,
    productionProvisioningAuthorized:false,
    trustedServerOnly:true,
    browserFirestoreWrites:"deny-all",
    accountIdentitySource:"verified Firebase UID only",
    selfDeletionRequiresActiveAccount:true,
    deletionPendingDeniesNewMutationAuthority:true,
    providerDeleteAfterApplicationCleanup:true,
    finalApplicationAccountRemovalAfterProviderDelete:true,
    accountDeletionMayDestroySurvivorSharedGameplay:false,
    requiredCleanupProofFields:REQUIRED_CLEANUP_PROOF_FIELDS,
    executeTrustedAccountDeletion
  });
});

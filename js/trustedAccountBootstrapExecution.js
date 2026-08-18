(function(root,factory){
  const api=factory(
    typeof module!=="undefined"&&module.exports?require("./trustedRequestAuthentication.js"):root.CareerModeTrustedRequestAuthentication,
    typeof module!=="undefined"&&module.exports?require("./trustedAccountBootstrap.js"):root.CareerModeTrustedAccountBootstrap
  );
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeTrustedAccountBootstrapExecution=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(trustedRequestAuthentication,trustedAccountBootstrap){
  "use strict";

  function isStage2GRecord(value){
    return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
  }

  function deepFreezeStage2G(value){
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreezeStage2G);
    return value;
  }

  function rejectStage2G(code){
    return deepFreezeStage2G({ok:false,action:"reject",code});
  }

  function bootstrapCreateSpec(accountId){
    return deepFreezeStage2G({
      schemaVersion:1,
      objectType:"account",
      objectId:accountId,
      revision:0,
      parentRevision:null,
      lifecycleState:"live",
      priorContentHash:null,
      updatedByAccountId:accountId,
      updatedByDeviceId:null,
      data:{
        status:"active",
        deletionRequestedAt:null
      },
      tombstone:null,
      trustedMaterialization:{
        serverTimestampFields:["data.createdAt","updatedAt"],
        canonicalContentHashRequired:true
      }
    });
  }

  function validateTransactionResult(accountId,documentPath,result){
    if(!isStage2GRecord(result)||typeof result.committed!=="boolean"||!isStage2GRecord(result.decision)){
      return rejectStage2G("TRUSTED_ACCOUNT_TRANSACTION_RESULT_INVALID");
    }

    const decision=result.decision;
    if(decision.ok===false||decision.action==="reject"){
      if(result.committed)return rejectStage2G("TRUSTED_ACCOUNT_TRANSACTION_COMMIT_MISMATCH");
      return rejectStage2G(typeof decision.code==="string"&&decision.code?decision.code:"TRUSTED_ACCOUNT_BOOTSTRAP_REJECTED");
    }

    if(decision.ok!==true){
      return rejectStage2G("TRUSTED_ACCOUNT_TRANSACTION_RESULT_INVALID");
    }

    if(decision.accountId!==accountId||decision.documentPath!==documentPath){
      return rejectStage2G("TRUSTED_ACCOUNT_TRANSACTION_IDENTITY_MISMATCH");
    }

    if(decision.action==="create"){
      if(!result.committed)return rejectStage2G("TRUSTED_ACCOUNT_TRANSACTION_COMMIT_MISMATCH");
      return deepFreezeStage2G({
        ok:true,
        action:"created",
        accountId,
        documentPath,
        revision:0,
        applicationAuthorizationGranted:"account-bootstrap-only"
      });
    }

    if(decision.action==="existing"){
      if(result.committed)return rejectStage2G("TRUSTED_ACCOUNT_TRANSACTION_COMMIT_MISMATCH");
      return deepFreezeStage2G({
        ok:true,
        action:"existing",
        accountId,
        documentPath,
        status:decision.status,
        revision:decision.revision,
        preserveExisting:true,
        applicationAuthorizationGranted:"account-bootstrap-only"
      });
    }

    return rejectStage2G("TRUSTED_ACCOUNT_TRANSACTION_RESULT_INVALID");
  }

  async function executeTrustedAccountBootstrap(input){
    if(!isStage2GRecord(input))return rejectStage2G("INVALID_TRUSTED_ACCOUNT_EXECUTION_INPUT");
    if(!trustedRequestAuthentication||typeof trustedRequestAuthentication.verifyTrustedRequestPrincipal!=="function"){
      return rejectStage2G("TRUSTED_REQUEST_AUTHENTICATION_UNAVAILABLE");
    }
    if(!trustedAccountBootstrap||typeof trustedAccountBootstrap.planTrustedAccountBootstrap!=="function"){
      return rejectStage2G("TRUSTED_ACCOUNT_BOOTSTRAP_PLANNER_UNAVAILABLE");
    }

    const principal=await trustedRequestAuthentication.verifyTrustedRequestPrincipal({
      idToken:input.idToken,
      verifyIdToken:input.verifyIdToken
    });
    if(!principal.ok)return principal;

    if(typeof input.runAtomicAccountBootstrap!=="function"){
      return rejectStage2G("TRUSTED_ACCOUNT_TRANSACTION_UNAVAILABLE");
    }

    const accountId=principal.accountId;
    const documentPath=`accounts/${accountId}`;
    let transactionResult;
    try{
      transactionResult=await input.runAtomicAccountBootstrap(deepFreezeStage2G({
        accountId,
        documentPath,
        createSpec:bootstrapCreateSpec(accountId),
        decide(existingAccount){
          return trustedAccountBootstrap.planTrustedAccountBootstrap({
            providerPrincipal:principal.providerPrincipal,
            documentAccountId:accountId,
            existingAccount
          });
        }
      }));
    }catch(_error){
      return rejectStage2G("TRUSTED_ACCOUNT_TRANSACTION_FAILED");
    }

    return validateTransactionResult(accountId,documentPath,transactionResult);
  }

  return deepFreezeStage2G({
    contractVersion:1,
    stage:"2G",
    productionRuntimeConnected:false,
    productionIamSelected:false,
    trustedExecutionBoundary:"injected-atomic-account-transaction",
    bootstrapAuthorizationScope:"same-provider-uid-missing-account-create-only",
    initialBootstrapDeviceAttribution:null,
    sharedMutationAuthorityGranted:false,
    executeTrustedAccountBootstrap
  });
});

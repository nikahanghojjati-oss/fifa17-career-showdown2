(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeTrustedAccountBootstrap=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const ALLOWED_ACCOUNT_STATUSES=Object.freeze(["active","disabled","deletion-pending"]);
  const ACCOUNT_DATA_FIELDS=Object.freeze(["createdAt","deletionRequestedAt","status"]);

  function isRecord(value){
    return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
  }

  function deepFreeze(value){
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  function normalizeProviderUid(providerPrincipal){
    if(!isRecord(providerPrincipal)||typeof providerPrincipal.uid!=="string"||providerPrincipal.uid.trim().length===0){
      return null;
    }
    return providerPrincipal.uid.trim();
  }

  function sameFields(actual,expected){
    if(!isRecord(actual))return false;
    const keys=Object.keys(actual).sort();
    return keys.length===expected.length&&keys.every((key,index)=>key===expected[index]);
  }

  function validateExistingAccount(accountId,documentAccountId,existingAccount){
    if(documentAccountId!==accountId){
      return "ACCOUNT_PATH_IDENTITY_MISMATCH";
    }
    if(!isRecord(existingAccount)){
      return "ACCOUNT_DOCUMENT_SCHEMA_CONFLICT";
    }
    if(existingAccount.schemaVersion!==1||existingAccount.objectType!=="account"||existingAccount.objectId!==accountId){
      return "ACCOUNT_DOCUMENT_IDENTITY_CONFLICT";
    }
    if(!Number.isInteger(existingAccount.revision)||existingAccount.revision<0){
      return "ACCOUNT_DOCUMENT_SCHEMA_CONFLICT";
    }
    if(existingAccount.lifecycleState!=="live"||existingAccount.tombstone!==null){
      return "ACCOUNT_DOCUMENT_SCHEMA_CONFLICT";
    }
    if(!sameFields(existingAccount.data,ACCOUNT_DATA_FIELDS)){
      return "ACCOUNT_DOCUMENT_SCHEMA_CONFLICT";
    }
    if(!ALLOWED_ACCOUNT_STATUSES.includes(existingAccount.data.status)){
      return "ACCOUNT_DOCUMENT_SCHEMA_CONFLICT";
    }
    return null;
  }

  function planTrustedAccountBootstrap(input){
    if(!isRecord(input)){
      return deepFreeze({ok:false,action:"reject",code:"INVALID_BOOTSTRAP_INPUT"});
    }

    const accountId=normalizeProviderUid(input.providerPrincipal);
    if(!accountId){
      return deepFreeze({ok:false,action:"reject",code:"UNAUTHENTICATED_PROVIDER"});
    }

    const documentAccountId=typeof input.documentAccountId==="string"?input.documentAccountId.trim():"";
    if(documentAccountId!==accountId){
      return deepFreeze({ok:false,action:"reject",code:"ACCOUNT_PATH_IDENTITY_MISMATCH"});
    }

    if(input.existingAccount===null||input.existingAccount===undefined){
      return deepFreeze({
        ok:true,
        action:"create",
        accountId,
        documentPath:`accounts/${accountId}`,
        revision:0,
        lifecycleState:"live",
        initialData:{
          status:"active",
          deletionRequestedAt:null
        },
        serverTimestampFields:["createdAt","updatedAt"],
        preserveExisting:false
      });
    }

    const conflict=validateExistingAccount(accountId,documentAccountId,input.existingAccount);
    if(conflict){
      return deepFreeze({ok:false,action:"reject",code:conflict,accountId,documentPath:`accounts/${accountId}`});
    }

    return deepFreeze({
      ok:true,
      action:"existing",
      accountId,
      documentPath:`accounts/${accountId}`,
      status:input.existingAccount.data.status,
      revision:input.existingAccount.revision,
      preserveExisting:true
    });
  }

  return deepFreeze({
    contractVersion:1,
    stage:"2E",
    productionRuntimeConnected:false,
    trustedWriteBoundary:"emulator-test-only",
    accountPath:"accounts/{accountId}",
    providerIdentitySource:"Firebase Auth uid observed by a trusted provider boundary",
    allowedAccountStatuses:ALLOWED_ACCOUNT_STATUSES,
    accountDataFields:ACCOUNT_DATA_FIELDS,
    planTrustedAccountBootstrap
  });
});

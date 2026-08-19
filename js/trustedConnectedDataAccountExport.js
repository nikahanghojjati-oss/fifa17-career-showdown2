(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeTrustedConnectedDataAccountExport=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const ALLOWED_CONNECTION_STATES=Object.freeze([
    "pending-pair","active","revoked-read-only","single-owner-retained","deletion-pending"
  ]);
  const ALLOWED_ENTITLEMENT_STATES=Object.freeze(["active","retained","relinquished"]);
  const EXCLUDED_OPERATIONAL_DATA=Object.freeze([
    "provider-authentication-secrets",
    "raw-device-secrets",
    "invite-capabilities",
    "private-session-operational-records",
    "idempotency-replay-records",
    "application-security-events",
    "provider-security-logs"
  ]);

  function isConnectedExportRecord(value){
    return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
  }

  function isConnectedExportString(value){
    return typeof value==="string"&&value.trim().length>0;
  }

  function freezeConnectedExportValue(value){
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.freeze(value);
    Object.values(value).forEach(freezeConnectedExportValue);
    return value;
  }

  function cloneConnectedExportValue(value){
    if(value===null||value===undefined)return value;
    return JSON.parse(JSON.stringify(value));
  }

  function exportFailure(code,status="rejected",extra={}){
    return freezeConnectedExportValue(Object.assign({ok:false,status,code},extra));
  }

  function normalizeVerifiedUid(value){
    return isConnectedExportString(value)?value.trim():null;
  }

  function validateAccountEnvelope(accountId,account){
    if(!isConnectedExportRecord(account))return "ACCOUNT_EXPORT_ACCOUNT_DOCUMENT_INVALID";
    if(account.schemaVersion!==1||account.objectType!=="account"||account.objectId!==accountId){
      return "ACCOUNT_EXPORT_ACCOUNT_IDENTITY_CONFLICT";
    }
    if(!Number.isInteger(account.revision)||account.revision<0)return "ACCOUNT_EXPORT_ACCOUNT_REVISION_INVALID";
    if(account.lifecycleState!=="live"||account.tombstone!==null)return "ACCOUNT_EXPORT_ACCOUNT_LIFECYCLE_INVALID";
    if(!isConnectedExportRecord(account.data)||!["active","disabled","deletion-pending"].includes(account.data.status)){
      return "ACCOUNT_EXPORT_ACCOUNT_STATUS_INVALID";
    }
    return null;
  }

  function projectProfileLink(accountId,link){
    if(!isConnectedExportRecord(link)||link.accountId!==accountId)return null;
    if(!isConnectedExportString(link.profileId)||!["active","detached"].includes(link.linkState))return null;
    return {
      profileId:link.profileId,
      displayLabel:typeof link.displayLabel==="string"?link.displayLabel:null,
      linkState:link.linkState,
      createdAt:link.createdAt??null
    };
  }

  function projectDevice(accountId,device){
    if(!isConnectedExportRecord(device)||device.accountId!==accountId)return null;
    if(!isConnectedExportString(device.deviceId)||!["active","revoked"].includes(device.state))return null;
    return {
      deviceId:device.deviceId,
      installationId:isConnectedExportString(device.installationId)?device.installationId:null,
      displayLabel:typeof device.displayLabel==="string"?device.displayLabel:null,
      state:device.state,
      registeredAt:device.registeredAt??null,
      lastSeenAt:device.lastSeenAt??null,
      revokedAt:device.revokedAt??null
    };
  }

  function validateRivalryEnvelope(rivalryId,governance){
    if(!isConnectedExportRecord(governance))return false;
    if(governance.schemaVersion!==1||governance.objectType!=="rivalry"||governance.objectId!==rivalryId)return false;
    if(!Number.isInteger(governance.revision)||governance.revision<0)return false;
    if(governance.lifecycleState!=="live"||governance.tombstone!==null)return false;
    if(!isConnectedExportRecord(governance.data))return false;
    if(!ALLOWED_CONNECTION_STATES.includes(governance.data.connectionState))return false;
    if(!Array.isArray(governance.data.managerSlots)||governance.data.managerSlots.length!==2)return false;
    return governance.data.managerSlots.every(slot=>
      isConnectedExportRecord(slot)&&
      ["manager-1","manager-2"].includes(slot.slotId)&&
      isConnectedExportString(slot.profileId)&&
      ALLOWED_ENTITLEMENT_STATES.includes(slot.entitlementState)&&
      typeof slot.deletionConsent==="boolean"&&
      (slot.accountId===null||isConnectedExportString(slot.accountId))
    );
  }

  function findRequesterSlot(accountId,governance){
    return governance.data.managerSlots.find(slot=>slot.accountId===accountId&&["active","retained"].includes(slot.entitlementState))||null;
  }

  function validateSharedState(rivalryId,state){
    if(!isConnectedExportRecord(state))return false;
    if(state.schemaVersion!==1||state.objectType!=="sharedState"||state.objectId!==rivalryId)return false;
    if(!Number.isInteger(state.revision)||state.revision<0)return false;
    if(!["live","tombstoned"].includes(state.lifecycleState))return false;
    if(state.lifecycleState==="live"){
      return isConnectedExportRecord(state.data)&&state.tombstone===null;
    }
    return state.data===null&&state.contentHash===null&&isConnectedExportRecord(state.tombstone);
  }

  function projectSharedState(accountId,state){
    const base={
      revision:state.revision,
      parentRevision:state.parentRevision??null,
      lifecycleState:state.lifecycleState,
      contentHash:state.contentHash??null,
      priorContentHash:state.priorContentHash??null,
      updatedAt:state.updatedAt??null,
      updatedByRequester:state.updatedByAccountId===accountId
    };
    if(state.lifecycleState==="live"){
      base.data=cloneConnectedExportValue(state.data);
      base.tombstone=null;
      return base;
    }
    base.data=null;
    base.tombstone={
      deletedAt:state.tombstone.deletedAt??null,
      deletedByRequester:state.tombstone.deletedByAccountId===accountId,
      reasonCode:state.tombstone.reasonCode??null,
      restorableByRequester:Array.isArray(state.tombstone.restorableByAccountIds)&&state.tombstone.restorableByAccountIds.includes(accountId)
    };
    return base;
  }

  function projectRivalry(accountId,item){
    if(!isConnectedExportRecord(item)||!isConnectedExportString(item.rivalryId))return {ok:false,code:"ACCOUNT_EXPORT_RIVALRY_RECORD_INVALID"};
    const rivalryId=item.rivalryId;
    if(!validateRivalryEnvelope(rivalryId,item.governance))return {ok:false,code:"ACCOUNT_EXPORT_RIVALRY_GOVERNANCE_INVALID"};
    const requesterSlot=findRequesterSlot(accountId,item.governance);
    if(!requesterSlot)return {ok:false,code:"ACCOUNT_EXPORT_RIVALRY_SCOPE_VIOLATION"};
    if(!validateSharedState(rivalryId,item.authoritativeState))return {ok:false,code:"ACCOUNT_EXPORT_SHARED_STATE_INVALID"};

    return {ok:true,value:{
      rivalryId,
      governance:{
        revision:item.governance.revision,
        parentRevision:item.governance.parentRevision??null,
        connectionState:item.governance.data.connectionState,
        connectionStateBeforeDeletion:item.governance.data.connectionStateBeforeDeletion??null,
        createdAt:item.governance.data.createdAt??null,
        createdByRequester:item.governance.data.createdByAccountId===accountId,
        managerSlots:item.governance.data.managerSlots.map(slot=>({
          slotId:slot.slotId,
          requester:slot.accountId===accountId,
          profileId:slot.profileId,
          displayLabel:typeof slot.displayLabel==="string"?slot.displayLabel:null,
          entitlementState:slot.entitlementState,
          deletionConsent:slot.deletionConsent
        }))
      },
      authoritativeState:projectSharedState(accountId,item.authoritativeState)
    }};
  }

  function validateInventoryShape(inventory){
    if(!isConnectedExportRecord(inventory))return false;
    if(!Array.isArray(inventory.profileLinks)||!Array.isArray(inventory.devices)||!Array.isArray(inventory.rivalries))return false;
    const forbidden=["invites","sessions","idempotency","securityEvents","providerAuth","providerSecurityLogs","rawDeviceSecrets"];
    return forbidden.every(field=>!Object.prototype.hasOwnProperty.call(inventory,field));
  }

  async function executeTrustedConnectedDataAccountExport(input){
    if(!isConnectedExportRecord(input))return exportFailure("INVALID_CONNECTED_DATA_ACCOUNT_EXPORT_INPUT");
    if(typeof input.loadAccount!=="function"||typeof input.loadExportInventory!=="function"){
      return exportFailure("ACCOUNT_EXPORT_ADAPTER_MISSING");
    }

    const accountId=normalizeVerifiedUid(input.verifiedUid);
    if(!accountId)return exportFailure("UNAUTHENTICATED_PROVIDER");
    if(input.operationAuthorizationGranted!==true)return exportFailure("ACCOUNT_EXPORT_OPERATION_UNAUTHORIZED");

    let account;
    try{
      account=await input.loadAccount(accountId);
    }catch(_error){
      return exportFailure("ACCOUNT_EXPORT_ACCOUNT_UNAVAILABLE","retryable");
    }
    const accountError=validateAccountEnvelope(accountId,account);
    if(accountError)return exportFailure(accountError);
    if(account.data.status==="disabled")return exportFailure("ACCOUNT_EXPORT_ACCOUNT_DISABLED");
    if(account.data.status==="deletion-pending")return exportFailure("ACCOUNT_EXPORT_DELETION_PENDING");

    let inventory;
    try{
      inventory=await input.loadExportInventory(freezeConnectedExportValue({accountId}));
    }catch(_error){
      return exportFailure("ACCOUNT_EXPORT_INVENTORY_UNAVAILABLE","retryable",{accountId});
    }
    if(!validateInventoryShape(inventory))return exportFailure("ACCOUNT_EXPORT_INVENTORY_INVALID");

    const profileLinks=[];
    for(const link of inventory.profileLinks){
      const projected=projectProfileLink(accountId,link);
      if(!projected)return exportFailure("ACCOUNT_EXPORT_PROFILE_LINK_SCOPE_VIOLATION");
      profileLinks.push(projected);
    }

    const devices=[];
    for(const device of inventory.devices){
      const projected=projectDevice(accountId,device);
      if(!projected)return exportFailure("ACCOUNT_EXPORT_DEVICE_SCOPE_VIOLATION");
      devices.push(projected);
    }

    const rivalries=[];
    for(const rivalry of inventory.rivalries){
      const projected=projectRivalry(accountId,rivalry);
      if(!projected.ok)return exportFailure(projected.code);
      rivalries.push(projected.value);
    }

    return freezeConnectedExportValue({
      ok:true,
      status:"completed",
      exportType:"connected-data-account-export",
      formatVersion:1,
      account:{
        accountId,
        status:"active",
        revision:account.revision,
        createdAt:account.data.createdAt??null
      },
      profileLinks,
      devices,
      rivalries,
      excludedOperationalData:EXCLUDED_OPERATIONAL_DATA,
      mutationPerformed:false,
      ownershipTransferGranted:false,
      sharedMutationAuthorityGranted:false
    });
  }

  return freezeConnectedExportValue({
    contractVersion:1,
    productionRuntimeConnected:false,
    productionProvisioningAuthorized:false,
    trustedServerOnly:true,
    browserFirestoreWrites:"deny-all",
    accountIdentitySource:"verified Firebase UID only",
    exportRequiresActiveAccount:true,
    exportIsNonMutating:true,
    localCandidateAReplaced:false,
    peerAccountIdentifiersMinimized:true,
    peerSecretsExported:false,
    peerSecurityLogsExported:false,
    inviteCapabilitiesExported:false,
    ownershipTransferGranted:false,
    sharedMutationAuthorityGranted:false,
    excludedOperationalData:EXCLUDED_OPERATIONAL_DATA,
    executeTrustedConnectedDataAccountExport
  });
});
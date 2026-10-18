(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeCareerStartMarker=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // Career start marker (owner decision): the first real START (the one-time START REAL CAREER checkmark on the seasons
  // screen; Nik's app before he redeems a first real pairing code) writes accounts/{uid}/careerStart/current. It names the
  // Showdowns already in that account's career index (hiddenRivalryIds, oldest first): the test games, which stay stored
  // and are never shown again (r79 PR4, Nik 2026-10-17: the SHOW TEST SHOWDOWNS AGAIN switch is gone, so `active` no
  // longer matters). The account is REAL once this document exists. Exact gets and one small transaction only; loaded
  // lazily by the career screens, Settings and the modes module, never at startup.
  const DOC_ID="current",OBJECT_TYPE="careerStart",INDEX_CAPACITY=500,RIVALRY_ID=/^pair_[0-9a-f]{64}$/;
  const CHANGE_EVENT="career-mode-career-start-change";
  const markers=new Map(),failedReads=new Set();
  let markerEpoch=0,state=Object.freeze({status:"unknown",accountId:null,epoch:0});

  function csmError(code,message){const error=new Error(message);error.code=code;return error;}
  function csmFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(csmFreeze);Object.freeze(value);}return value;}
  function csmCanonicalize(value){if(value===null||value===undefined)return null;if(value&&typeof value.toMillis==="function")return{$timestamp:value.toMillis()};if(Array.isArray(value))return value.map(csmCanonicalize);if(typeof value==="object"){const out={};for(const key of Object.keys(value).sort())out[key]=csmCanonicalize(value[key]);return out;}return value;}
  async function csmSha256(value,cryptoImpl){
    const crypto=cryptoImpl||root.crypto;
    if(!crypto?.subtle||typeof crypto.subtle.digest!=="function")throw csmError("CAREER_START_CRYPTO_UNAVAILABLE","Secure browser hashing is unavailable.");
    const digest=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(csmCanonicalize(value)))));
    return "sha256:"+Array.from(digest,byte=>byte.toString(16).padStart(2,"0")).join("");
  }
  function csmMillis(value){try{const ms=value&&typeof value.toMillis==="function"?value.toMillis():null;return Number.isFinite(ms)?ms:null;}catch(_error){return null;}}
  function csmIdsValid(ids,min,max){return Array.isArray(ids)&&ids.length>=min&&ids.length<=max&&ids.every(id=>typeof id==="string"&&RIVALRY_ID.test(id))&&new Set(ids).size===ids.length;}
  function csmEnvelopeValid(value,objectType,objectId){return Boolean(value&&value.schemaVersion===1&&value.objectType===objectType&&value.objectId===objectId&&value.lifecycleState==="live"&&Number.isInteger(value.revision)&&value.revision>=0&&typeof value.contentHash==="string");}

  const NONE=csmFreeze({status:"none",active:false,hiddenRivalryIds:[],startedAt:null,revision:null});
  function parseMarker(value){
    if(!csmEnvelopeValid(value,OBJECT_TYPE,DOC_ID))throw csmError("CAREER_START_INVALID","The career start marker is invalid.");
    const data=value.data||{};
    const startedAt=csmMillis(data.startedAt);
    if(Object.keys(data).sort().join(",")!=="active,hiddenRivalryIds,startedAt"||typeof data.active!=="boolean"||startedAt===null||!csmIdsValid(data.hiddenRivalryIds,0,INDEX_CAPACITY))throw csmError("CAREER_START_INVALID","The career start marker is invalid.");
    // startedAt is the server time of the first press (immutable), so toggles never move the shown date.
    return csmFreeze({status:"ready",active:data.active,hiddenRivalryIds:[...data.hiddenRivalryIds],startedAt,revision:value.revision,contentHash:value.contentHash});
  }
  // The ids the career screens leave out. r79 PR4: always, whatever `active` says (an account that switched the retired
  // SHOW TEST SHOWDOWNS AGAIN on keeps its test games stored but hidden).
  function hiddenRivalryIds(marker){return marker&&marker.status==="ready"?marker.hiddenRivalryIds.slice():[];}
  function parseIndexHead(value){
    if(!csmEnvelopeValid(value,"careerIndex","current"))throw csmError("CAREER_START_INDEX_INVALID","The career index is invalid.");
    const data=value.data||{};
    if(Object.keys(data).sort().join(",")!=="rivalryIds,sealedPageCount"||!csmIdsValid(data.rivalryIds,1,INDEX_CAPACITY)||!Number.isInteger(data.sealedPageCount)||data.sealedPageCount<0)throw csmError("CAREER_START_INDEX_INVALID","The career index is invalid.");
    return {rivalryIds:[...data.rivalryIds],sealedPageCount:data.sealedPageCount};
  }
  async function csmEnvelope({revision,parentRevision,priorContentHash,now,accountId,deviceId,data,hashData=data,cryptoImpl}){
    const contentHash=await csmSha256({objectType:OBJECT_TYPE,objectId:DOC_ID,revision,data:hashData},cryptoImpl);
    return {schemaVersion:1,objectType:OBJECT_TYPE,objectId:DOC_ID,revision,parentRevision,lifecycleState:"live",contentHash,priorContentHash,updatedAt:now,updatedByAccountId:accountId,updatedByDeviceId:deviceId,data,tombstone:null};
  }
  // Pure plans (the Rules check the same things): create names exactly the career index head, never a paged index.
  // startedAt is the provider's serverTimestamp() sentinel (the Rules require request.time); it is hashed as a marker.
  async function planCreate({indexValue,accountId,deviceId,now,serverTimestamp,cryptoImpl}){
    let ids=[];
    if(indexValue){const head=parseIndexHead(indexValue);if(head.sealedPageCount>0)throw csmError("CAREER_START_INDEX_PAGED","This career is too long to mark from here.");ids=head.rivalryIds;}
    if(!serverTimestamp)throw csmError("CAREER_START_PROVIDER_UNAVAILABLE","The career service is unavailable.");
    return csmEnvelope({revision:0,parentRevision:null,priorContentHash:null,now,accountId,deviceId,data:{hiddenRivalryIds:ids,active:true,startedAt:serverTimestamp},hashData:{hiddenRivalryIds:ids,active:true,startedAt:{$serverTimestamp:true}},cryptoImpl});
  }
  async function planToggle({markerValue,active,accountId,deviceId,now,cryptoImpl}){
    const before=parseMarker(markerValue);
    return csmEnvelope({revision:before.revision+1,parentRevision:before.revision,priorContentHash:before.contentHash,now,accountId,deviceId,data:{hiddenRivalryIds:[...before.hiddenRivalryIds],active:active===true,startedAt:markerValue.data.startedAt},cryptoImpl});
  }

  function csmRef(sdk,firestore,accountId,...path){return sdk.doc(firestore,"accounts",accountId,...path);}
  function csmPublish(accountId,marker,changed){
    markers.set(accountId,Promise.resolve(marker));
    if(changed)markerEpoch+=1;
    state=Object.freeze({status:marker.status,accountId,epoch:markerEpoch});
    if(changed&&typeof root.CustomEvent==="function")try{root.dispatchEvent?.(new root.CustomEvent(CHANGE_EVENT,{detail:state}));}catch(_error){}
    return marker;
  }
  // One exact get per account per page load. A failed read is not kept, so the next screen load asks again.
  function readMarker({firestore,firebaseSdk,accountId}={}){
    if(typeof accountId!=="string"||!accountId)return Promise.reject(csmError("CAREER_START_AUTH_REQUIRED","Sign in before continuing."));
    if(markers.has(accountId))return markers.get(accountId);
    const promise=(async()=>{
      if(!firestore||typeof firebaseSdk?.doc!=="function"||typeof firebaseSdk.getDoc!=="function")throw csmError("CAREER_START_PROVIDER_UNAVAILABLE","The career service is unavailable.");
      const snapshot=await firebaseSdk.getDoc(csmRef(firebaseSdk,firestore,accountId,"careerStart",DOC_ID));
      const marker=snapshot.exists()?parseMarker(snapshot.data()):NONE;
      // An earlier failed read showed the whole career (fail-open). If a marker turns out to exist, the career already
      // on screen is wrong: count it as a change so cached careers drop and mounted screens reload.
      const recovered=failedReads.delete(accountId);
      if(markers.get(accountId)===promise){
        if(recovered&&marker.status==="ready"&&marker.hiddenRivalryIds.length>0)return csmPublish(accountId,marker,true);
        state=Object.freeze({status:marker.status,accountId,epoch:markerEpoch});
      }
      return marker;
    })();
    markers.set(accountId,promise);
    promise.catch(()=>{failedReads.add(accountId);if(markers.get(accountId)===promise)markers.delete(accountId);});
    return promise;
  }

  // Signed-in services for this page (the same ones the career screens use); a device id only for writes.
  async function resolveServices({write=false}={}){
    const runtime=root.CareerModeProductionFirebaseRuntime,account=root.CareerModeSparkConnectedAccount;
    const accountState=account?.getState?.();
    if(!runtime||!accountState?.connected||!accountState.accountId)throw csmError("CAREER_START_AUTH_REQUIRED","Sign in before continuing.");
    const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices());
    const user=services?.auth?.currentUser;
    if(!services?.ok||!user||user.uid!==accountState.accountId)throw csmError("CAREER_START_AUTH_REQUIRED","The signed-in account is unavailable.");
    const sdk=services.firestoreSdk?.getDoc?services.firestoreSdk:{...services.firestoreSdk,getDoc:(await import(runtime.firebaseFirestoreModule)).getDoc};
    const out={firestore:services.firestore,firebaseSdk:sdk,accountId:user.uid};
    if(write){
      const pairing=root.CareerModeSparkPrivatePairing;
      if(typeof pairing?.initialize==="function")await pairing.initialize();
      const pairingState=pairing?.getState?.();
      if(!pairingState?.registered||!pairingState.deviceId)throw csmError("CAREER_START_DEVICE_REQUIRED",root.CareerModeFirestoreBudget?.quotaMessage?.()||"This browser is not ready yet.");
      out.deviceId=pairingState.deviceId;
    }
    return out;
  }
  async function readCurrentMarker(){return readMarker(await resolveServices());}

  // A Showdown that is still being played (or waiting for the other manager) is part of the real career. Checked
  // inside the write transaction: the pair link read is part of it, so a Showdown started in another tab meanwhile
  // makes the transaction retry and refuse. A rivalry this account cannot read is not its unfinished Showdown.
  // r79 PR4: a pending rivalry whose code has expired or was used up is finished (nobody can join it any more), so an
  // old test code never blocks the first real START. An invite that cannot be read keeps it unfinished (fail closed).
  function csmInviteOpen(value,nowMs){const expires=csmMillis(value?.data?.expiresAt);return value?.data?.state==="open"&&(expires===null||expires>nowMs);}
  async function csmAssertNoUnfinishedShowdown(transaction,sdk,firestore,accountId){
    const pair=await transaction.get(csmRef(sdk,firestore,accountId,"pairLinks","current"));
    const rivalryId=pair.exists()?pair.data()?.data?.rivalryId:null;
    let connectionState=null,codeOpen=true;
    if(typeof rivalryId==="string"&&RIVALRY_ID.test(rivalryId)){
      try{const rivalry=await transaction.get(sdk.doc(firestore,"rivalries",rivalryId));connectionState=rivalry.exists()?rivalry.data()?.data?.connectionState??null:null;}
      catch(_error){connectionState=null;}
      if(connectionState==="pending-pair"){
        try{const invite=await transaction.get(sdk.doc(firestore,"rivalries",rivalryId,"invites",rivalryId));codeOpen=invite.exists()&&csmInviteOpen(invite.data(),Date.now());}
        catch(_error){codeOpen=true;}
      }
    }
    if(connectionState==="active"||(connectionState==="pending-pair"&&codeOpen))throw csmError("CAREER_START_SHOWDOWN_UNFINISHED","Finish or delete the current Showdown before starting your real career.");
  }
  async function csmWrite(options,mode,active){
    const o=options&&options.firestore?options:await resolveServices({write:true});
    const {firestore,firebaseSdk:sdk,accountId,deviceId,cryptoImpl}=o;
    if(typeof sdk?.runTransaction!=="function"||typeof sdk.doc!=="function")throw csmError("CAREER_START_PROVIDER_UNAVAILABLE","The career service is unavailable.");
    const markerRef=csmRef(sdk,firestore,accountId,"careerStart",DOC_ID),indexRef=csmRef(sdk,firestore,accountId,"careerIndex","current");
    const now=sdk.Timestamp?.fromMillis?sdk.Timestamp.fromMillis(Date.now()):null;
    if(!now)throw csmError("CAREER_START_PROVIDER_UNAVAILABLE","The career service is unavailable.");
    const outcome=await sdk.runTransaction(firestore,async transaction=>{
      const markerSnapshot=await transaction.get(markerRef);
      const existing=markerSnapshot.exists()?parseMarker(markerSnapshot.data()):null;
      const wanted=mode==="start"?true:active===true;
      if(existing&&existing.active===wanted)return {marker:existing,changed:false};
      if(!existing&&mode!=="start")throw csmError("CAREER_START_MISSING","Start your real career first.");
      let value;
      if(existing)value=await planToggle({markerValue:markerSnapshot.data(),active:wanted,accountId,deviceId,now,cryptoImpl});
      else{
        await csmAssertNoUnfinishedShowdown(transaction,sdk,firestore,accountId);
        const indexSnapshot=await transaction.get(indexRef);
        value=await planCreate({indexValue:indexSnapshot.exists()?indexSnapshot.data():null,accountId,deviceId,now,serverTimestamp:typeof sdk.serverTimestamp==="function"?sdk.serverTimestamp():null,cryptoImpl});
      }
      transaction.set(markerRef,value);
      // The server fills startedAt on create; until the next read this page shows the local time of the press.
      return {marker:parseMarker(existing?value:{...value,data:{...value.data,startedAt:now}}),changed:true};
    });
    return csmPublish(accountId,outcome.marker,outcome.changed);
  }
  function startRealCareer(options){return csmWrite(options,"start",true);}
  function setActive(active,options){return csmWrite(options,"toggle",active===true);}
  function clearCache(){markers.clear();failedReads.clear();markerEpoch+=1;state=Object.freeze({status:"unknown",accountId:null,epoch:markerEpoch});}

  return Object.freeze({contractVersion:2,feature:"cms-career-start-marker",hiddenWhateverActive:true,changeEvent:CHANGE_EVENT,documentPath:"accounts/{uid}/careerStart/current",
    readMarker,readCurrentMarker,hiddenRivalryIds,startRealCareer,setActive,clearCache,parseMarker,planCreate,planToggle,
    epoch:()=>markerEpoch,getState:()=>state,listPermissionRequired:false,deletionRequired:false,billingRequired:false});
});

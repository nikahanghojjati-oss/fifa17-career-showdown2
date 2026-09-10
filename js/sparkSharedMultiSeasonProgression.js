(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkSharedMultiSeasonProgression=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const RUNTIME_REVISION="1.9.1-r13";
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const RIVALRY_ID=/^pair_[0-9a-f]{64}$/;
  const DEVICE_ID=/^device_[0-9a-f]{32}$/;
  const SESSION_ID=/^session_[0-9a-f]{64}$/;
  const defaultProgressionModule=typeof require==="function"?require("./sharedMultiSeasonProgression.js"):root.CareerModeSharedMultiSeasonProgression;
  const defaultHistoryProvider=typeof require==="function"?require("./sparkSharedHistoryConvergence.js"):root.CareerModeSparkSharedHistoryConvergence;

  function msp13Fail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function msp13Freeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(msp13Freeze);Object.freeze(value);}return value;}
  function msp13Error(error){return msp13Freeze({ok:false,code:error&&typeof error.code==="string"?error.code:"MULTI_SEASON_PROVIDER_FAILED"});}
  function msp13Snapshot(snapshot){return snapshot&&typeof snapshot.exists==="function"&&snapshot.exists()?snapshot.data():null;}
  function msp13TimestampMillis(value){if(value&&typeof value.toMillis==="function")return value.toMillis();if(value instanceof Date)return value.getTime();return Number.NaN;}
  function msp13Rivalry(value){const id=String(value||"").trim().toLowerCase();if(!RIVALRY_ID.test(id))msp13Fail("MULTI_SEASON_RIVALRY_INVALID");return id;}
  function msp13Session(value){const id=String(value||"").trim().toLowerCase();if(!SESSION_ID.test(id))msp13Fail("MULTI_SEASON_SESSION_INVALID");return id;}
  function msp13Device(value){const id=String(value||"").trim().toLowerCase();if(!DEVICE_ID.test(id))msp13Fail("MULTI_SEASON_DEVICE_INVALID");return id;}
  function msp13Uid(user){const uid=user&&typeof user.uid==="string"?user.uid.trim():"";if(!uid)msp13Fail("MULTI_SEASON_AUTH_REQUIRED");return uid;}
  function msp13Now(value){const n=Number(value===undefined?Date.now():value);if(!Number.isSafeInteger(n)||n<0)msp13Fail("MULTI_SEASON_CLOCK_INVALID");return n;}
  function msp13Sdk(options){if(!options.firestore)msp13Fail("MULTI_SEASON_PROVIDER_UNAVAILABLE");for(const name of ["doc","runTransaction"]){if(!options.firebaseSdk||typeof options.firebaseSdk[name]!=="function")msp13Fail("MULTI_SEASON_PROVIDER_UNAVAILABLE");}return options.firebaseSdk;}
  function msp13Path(sdk,db,...parts){return sdk.doc(db,...parts);}
  async function msp13Get(tx,ref){return msp13Snapshot(await tx.get(ref));}
  function msp13Account(value,uid){if(!value||value.objectType!=="account"||value.objectId!==uid||value.lifecycleState!=="live"||value.data?.status!=="active")msp13Fail("MULTI_SEASON_ACCOUNT_INACTIVE");}
  function msp13DeviceState(value,deviceId){if(!value||value.objectType!=="device"||value.objectId!==deviceId||value.lifecycleState!=="live"||value.data?.deviceId!==deviceId||value.data?.state!=="active")msp13Fail("MULTI_SEASON_DEVICE_INACTIVE");}
  function msp13RivalryState(value,rivalryId,uid){
    if(!value||value.objectType!=="rivalry"||value.objectId!==rivalryId||value.lifecycleState!=="live"||value.data?.connectionState!=="active")msp13Fail("MULTI_SEASON_RIVALRY_INACTIVE");
    const slots=Array.isArray(value.data.managerSlots)?value.data.managerSlots:[],authorized=Array.isArray(value.data.authorizedAccountIds)?value.data.authorizedAccountIds:[];
    if(slots.length!==2||authorized.length!==2||new Set(authorized).size!==2)msp13Fail("MULTI_SEASON_TWO_MANAGERS_REQUIRED");
    const ordered=ROLES.map(role=>slots.find(slot=>slot&&slot.slotId===role));
    if(ordered.some(slot=>!slot||slot.entitlementState!=="active"||typeof slot.accountId!=="string")||ordered[0].accountId===ordered[1].accountId||!ordered.every(slot=>authorized.includes(slot.accountId)))msp13Fail("MULTI_SEASON_BINDING_INVALID");
    const actor=ordered.find(slot=>slot.accountId===uid);if(!actor)msp13Fail("MULTI_SEASON_ACTOR_NOT_ENTITLED");return {authorized,managerRole:actor.slotId};
  }
  function msp13SessionState(value,rivalryId,sessionId,authorized,now){const members=value?.data?.memberAccountIds,expires=msp13TimestampMillis(value?.data?.expiresAt);if(!value||value.objectType!=="session"||value.objectId!==sessionId||value.lifecycleState!=="live"||value.data?.rivalryId!==rivalryId||value.data?.state!=="active"||!Array.isArray(members)||members.length!==2||new Set(members).size!==2||!authorized.every(id=>members.includes(id))||!members.every(id=>authorized.includes(id))||!Number.isFinite(expires)||now>=expires)msp13Fail("MULTI_SEASON_ACTIVE_SESSION_REQUIRED");}
  function msp13Setup(value,rivalryId){if(!value||value.schemaVersion!==1||value.objectType!=="sharedSetupLedger"||value.rivalryId!==rivalryId||value.phase!=="SHOWDOWN_CONFIRMED"||value.revision!==6||![1,3,5,10].includes(value.totalSeasons)||typeof value.leagueId!=="string"||!value.leagueId.trim()||!value.clubs||typeof value.clubs.playerOne!=="string"||!value.clubs.playerOne.trim()||typeof value.clubs.playerTwo!=="string"||!value.clubs.playerTwo.trim()||value.clubs.playerOne===value.clubs.playerTwo)msp13Fail("MULTI_SEASON_SETUP_INVALID");return value;}
  function msp13CommitPhase(value,rivalryId,seasonNumber){
    if(!value)return "missing";
    if(value.schemaVersion!==1||value.objectType!=="sharedSeasonCommit"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.runtimeRevision!=="1.9.1-r10"||!["COMMITTED","ACKNOWLEDGED"].includes(value.phase)||!Number.isInteger(value.revision)||value.revision<1||value.revision>3||value.resultsRevision!==2)msp13Fail("MULTI_SEASON_COMMIT_INVALID");
    if(value.phase==="ACKNOWLEDGED"&&value.revision!==3)msp13Fail("MULTI_SEASON_COMMIT_INVALID");
    if(value.phase==="COMMITTED"&&value.revision===3)msp13Fail("MULTI_SEASON_COMMIT_INVALID");
    return value.phase==="ACKNOWLEDGED"?"accepted":"pending";
  }
  async function msp13ReadAuthority(options,uid,rivalryId,sessionId,deviceId,now){
    const sdk=msp13Sdk(options),db=options.firestore;
    return sdk.runTransaction(db,async tx=>{
      const account=await msp13Get(tx,msp13Path(sdk,db,"accounts",uid));msp13Account(account,uid);
      const device=await msp13Get(tx,msp13Path(sdk,db,"accounts",uid,"devices",deviceId));msp13DeviceState(device,deviceId);
      const rivalry=await msp13Get(tx,msp13Path(sdk,db,"rivalries",rivalryId));const actor=msp13RivalryState(rivalry,rivalryId,uid);
      const session=await msp13Get(tx,msp13Path(sdk,db,"rivalries",rivalryId,"sessions",sessionId));msp13SessionState(session,rivalryId,sessionId,actor.authorized,now);
      const setup=msp13Setup(await msp13Get(tx,msp13Path(sdk,db,"rivalries",rivalryId,"sharedSetup","authoritative")),rivalryId);
      const phases=[];
      for(let seasonNumber=1;seasonNumber<=setup.totalSeasons;seasonNumber+=1){const stored=await msp13Get(tx,msp13Path(sdk,db,"rivalries",rivalryId,"seasonCommits",`season_${seasonNumber}`));phases.push(msp13CommitPhase(stored,rivalryId,seasonNumber));}
      let acceptedSeasons=0,gapSeen=false;
      for(const phase of phases){
        if(!gapSeen&&phase==="accepted"){acceptedSeasons+=1;continue;}
        if(phase!=="accepted")gapSeen=true;
        else msp13Fail("MULTI_SEASON_HISTORY_GAP");
      }
      return msp13Freeze({setup,managerRole:actor.managerRole,acceptedSeasons,commitPhases:phases});
    });
  }
  function msp13CreateProvider({progressionModule=defaultProgressionModule,historyProvider=defaultHistoryProvider,authorityReader=msp13ReadAuthority}={}){
    if(!progressionModule||typeof progressionModule.createProtocol!=="function")msp13Fail("MULTI_SEASON_PROTOCOL_UNAVAILABLE");
    if(!historyProvider||typeof historyProvider.read!=="function")msp13Fail("MULTI_SEASON_HISTORY_PROVIDER_UNAVAILABLE");
    if(typeof authorityReader!=="function")msp13Fail("MULTI_SEASON_AUTHORITY_READER_UNAVAILABLE");
    const protocol=progressionModule.createProtocol();
    async function read(options={}){
      try{
        const rivalryId=msp13Rivalry(options.rivalryId),sessionId=msp13Session(options.sessionId),deviceId=msp13Device(options.deviceId),uid=msp13Uid(options.user),now=msp13Now(options.nowEpochMs);msp13Sdk(options);
        const authority=await authorityReader(options,uid,rivalryId,sessionId,deviceId,now);
        if(!authority||!authority.setup||!ROLES.includes(authority.managerRole)||!Number.isInteger(authority.acceptedSeasons)||authority.acceptedSeasons<0||authority.acceptedSeasons>authority.setup.totalSeasons)msp13Fail("MULTI_SEASON_AUTHORITY_INVALID");
        let history=null;
        if(authority.acceptedSeasons>0){
          const historyResult=await historyProvider.read({...options,rivalryId,sessionId,deviceId,throughSeason:authority.acceptedSeasons});
          if(!historyResult||historyResult.ok!==true||historyResult.authoritative!==true||historyResult.phase!=="HISTORY_CONVERGED"||!historyResult.projection)msp13Fail(historyResult?.code||"MULTI_SEASON_HISTORY_UNAVAILABLE");
          history=historyResult.projection;
        }
        const state=protocol.derive({rivalryId,setup:authority.setup,history});
        if(state.acceptedSeasons!==authority.acceptedSeasons)msp13Fail("MULTI_SEASON_ACCEPTED_PREFIX_MISMATCH");
        return msp13Freeze({ok:true,authoritative:true,runtimeRevision:RUNTIME_REVISION,phase:state.phase,revision:state.revision,rivalryId,managerRole:authority.managerRole,state});
      }catch(error){return msp13Error(error);}
    }
    return msp13Freeze({contractVersion:1,feature:"ssjr-spark-shared-multi-season-progression",runtimeRevision:RUNTIME_REVISION,read,exactSeasonAddressing:true,derivesFromAcceptedPrefix:true,fixedClubs:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,sourceAuthorityPaths:Object.freeze(["accounts/{accountId}","accounts/{accountId}/devices/{deviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/sessions/{sessionId}","rivalries/{rivalryId}/sharedSetup/authoritative","rivalries/{rivalryId}/seasonCommits/season_{N}"])});
  }

  const provider=msp13CreateProvider();
  return Object.freeze({...provider,createProvider:msp13CreateProvider});
});
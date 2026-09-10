(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedJourneyReconnect=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const RUNTIME_REVISION="1.9.1-r14";
  const PHASES=Object.freeze(["OFFLINE_HOLD","RECOVERY_PENDING","FRESH_SESSION_REQUIRED","ACTIVE_RECOVERED","TERMINAL_RECOVERED"]);
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const RIVALRY_ID=/^pair_[0-9a-f]{64}$/;
  const SESSION_ID=/^session_[0-9a-f]{64}$/;
  const DEVICE_ID=/^device_[0-9a-f]{32}$/;
  const defaultMultiSeasonModule=typeof require==="function"?require("./sharedMultiSeasonProgression.js"):root.CareerModeSharedMultiSeasonProgression;

  function jrFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function jrPlain(value){return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);}
  function jrClone(value){return value===null||value===undefined?value:JSON.parse(JSON.stringify(value));}
  function jrFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(jrFreeze);Object.freeze(value);}return value;}
  function jrId(value,pattern,code){const id=String(value||"").trim();if(!pattern.test(id))jrFail(code);return id;}
  function jrEpoch(value){const n=Number(value);if(!Number.isSafeInteger(n)||n<0)jrFail("JOURNEY_RECONNECT_CLOCK_INVALID");return n;}
  function jrRole(value){if(!ROLES.includes(value))jrFail("JOURNEY_RECONNECT_ROLE_INVALID");return value;}
  function jrAuthority(value){
    if(!jrPlain(value))jrFail("JOURNEY_RECONNECT_AUTHORITY_INVALID");
    const authority={
      rivalryId:jrId(value.rivalryId,RIVALRY_ID,"JOURNEY_RECONNECT_RIVALRY_INVALID"),
      accountId:String(value.accountId||"").trim(),
      deviceId:jrId(value.deviceId,DEVICE_ID,"JOURNEY_RECONNECT_DEVICE_INVALID"),
      managerRole:jrRole(value.managerRole)
    };
    if(!authority.accountId)jrFail("JOURNEY_RECONNECT_ACCOUNT_INVALID");
    return jrFreeze(authority);
  }
  function jrRemote(value,authority,now){
    if(value===null||value===undefined)return null;
    if(!jrPlain(value))jrFail("JOURNEY_RECONNECT_SESSION_INVALID");
    const remote={
      sessionId:value.sessionId?jrId(value.sessionId,SESSION_ID,"JOURNEY_RECONNECT_SESSION_INVALID"):null,
      rivalryId:value.rivalryId?jrId(value.rivalryId,RIVALRY_ID,"JOURNEY_RECONNECT_SESSION_INVALID"):null,
      accountId:value.accountId?String(value.accountId).trim():null,
      deviceId:value.deviceId?jrId(value.deviceId,DEVICE_ID,"JOURNEY_RECONNECT_SESSION_INVALID"):null,
      sessionState:String(value.sessionState||""),
      pendingAction:value.pendingAction===null||value.pendingAction===undefined?null:String(value.pendingAction),
      expiresAtEpochMs:Number.isFinite(Number(value.expiresAtEpochMs))?Number(value.expiresAtEpochMs):null
    };
    if(remote.rivalryId&&remote.rivalryId!==authority.rivalryId)jrFail("JOURNEY_RECONNECT_AUTHORITY_MISMATCH");
    if(remote.accountId&&remote.accountId!==authority.accountId)jrFail("JOURNEY_RECONNECT_AUTHORITY_MISMATCH");
    if(remote.deviceId&&remote.deviceId!==authority.deviceId)jrFail("JOURNEY_RECONNECT_AUTHORITY_MISMATCH");
    remote.expired=remote.expiresAtEpochMs!==null&&now>=remote.expiresAtEpochMs;
    remote.active=remote.sessionState==="active"&&Boolean(remote.sessionId)&&!remote.pendingAction&&!remote.expired;
    return jrFreeze(remote);
  }
  function jrSetup(value,authority){
    if(!jrPlain(value)||value.revision!==6||value.phase!=="SHOWDOWN_CONFIRMED"||!Number.isInteger(value.totalSeasons)||![1,3,5,10].includes(value.totalSeasons)||typeof value.leagueId!=="string"||!value.leagueId.trim()||!jrPlain(value.clubs)||typeof value.clubs.playerOne!=="string"||!value.clubs.playerOne.trim()||typeof value.clubs.playerTwo!=="string"||!value.clubs.playerTwo.trim()||value.clubs.playerOne===value.clubs.playerTwo)jrFail("JOURNEY_RECONNECT_SETUP_INVALID");
    if(value.rivalryId!==undefined&&String(value.rivalryId)!==authority.rivalryId)jrFail("JOURNEY_RECONNECT_AUTHORITY_MISMATCH");
    return value;
  }
  function jrProgression(value,authority,setup,multiSeasonModule){
    let verified;
    try{verified=multiSeasonModule.createProtocol().verifyState(value);}catch(_error){jrFail("JOURNEY_RECONNECT_PROGRESSION_INVALID");}
    if(verified.rivalryId!==authority.rivalryId||verified.setupRevision!==6||verified.totalSeasons!==setup.totalSeasons||verified.leagueId!==setup.leagueId||verified.fixedClubs.playerOne!==setup.clubs.playerOne||verified.fixedClubs.playerTwo!==setup.clubs.playerTwo)jrFail("JOURNEY_RECONNECT_DURABLE_STATE_DRIFT");
    return verified;
  }
  function jrPlanKey(setup){return `${setup.revision}|${setup.leagueId}|${setup.totalSeasons}|${setup.clubs.playerOne}|${setup.clubs.playerTwo}`;}
  function jrDurableKey(progression){return `${progression.rivalryId}|${progression.setupRevision}|${progression.acceptedSeasons}|${progression.acceptedRevisionKey}`;}
  function jrBase({phase,authority,remote=null,previous=null,networkOnline,resumable=false,freshSessionRequired=false,recovered=false,setup=null,progression=null}){
    const state={
      schemaVersion:1,runtimeRevision:RUNTIME_REVISION,phase,
      rivalryId:authority.rivalryId,accountId:authority.accountId,deviceId:authority.deviceId,managerRole:authority.managerRole,
      networkOnline:Boolean(networkOnline),activeAuthorization:phase==="ACTIVE_RECOVERED"||phase==="TERMINAL_RECOVERED",
      sessionId:remote?.sessionId||null,lastKnownSessionId:remote?.sessionId||previous?.lastKnownSessionId||previous?.sessionId||null,
      sessionChanged:Boolean(recovered&&previous?.lastKnownSessionId&&remote?.sessionId&&previous.lastKnownSessionId!==remote.sessionId),
      freshSessionRequired:Boolean(freshSessionRequired),resumable:Boolean(resumable),recovered:Boolean(recovered),
      setupRevision:setup?.revision||previous?.setupRevision||null,setupPhase:setup?.phase||previous?.setupPhase||null,
      leagueId:setup?.leagueId||previous?.leagueId||null,totalSeasons:setup?.totalSeasons||previous?.totalSeasons||null,
      fixedClubs:setup?{playerOne:setup.clubs.playerOne,playerTwo:setup.clubs.playerTwo}:jrClone(previous?.fixedClubs)||null,
      acceptedSeasons:progression?.acceptedSeasons??previous?.acceptedSeasons??null,
      activeSeason:progression?.activeSeason??(progression?.terminal?null:previous?.activeSeason??null),
      terminal:progression?.terminal??previous?.terminal??false,
      planKey:setup?jrPlanKey(setup):previous?.planKey||"",
      durableKey:progression?jrDurableKey(progression):previous?.durableKey||"",
      canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false
    };
    return jrFreeze(state);
  }
  function jrAssertPrevious(previous,authority){
    if(!previous)return null;
    if(!jrPlain(previous)||previous.runtimeRevision!==RUNTIME_REVISION||previous.rivalryId!==authority.rivalryId||previous.accountId!==authority.accountId||previous.deviceId!==authority.deviceId||previous.managerRole!==authority.managerRole)jrFail("JOURNEY_RECONNECT_PREVIOUS_INVALID");
    return previous;
  }
  function jrAssertMonotonic(previous,next){
    if(!previous||!next.recovered)return next;
    if(previous.planKey&&next.planKey!==previous.planKey)jrFail("JOURNEY_RECONNECT_PLAN_DRIFT");
    if(Number.isInteger(previous.acceptedSeasons)&&next.acceptedSeasons<previous.acceptedSeasons)jrFail("JOURNEY_RECONNECT_REGRESSION");
    if(Number.isInteger(previous.acceptedSeasons)&&next.acceptedSeasons===previous.acceptedSeasons&&previous.durableKey&&next.durableKey!==previous.durableKey)jrFail("JOURNEY_RECONNECT_REPLAY_ALTERED");
    if(previous.terminal===true&&next.terminal!==true)jrFail("JOURNEY_RECONNECT_TERMINAL_RESURRECTION");
    if(previous.terminal===true&&next.durableKey!==previous.durableKey)jrFail("JOURNEY_RECONNECT_TERMINAL_DRIFT");
    return next;
  }
  function jrObserve(options,multiSeasonModule){
    const now=jrEpoch(options?.nowEpochMs),authority=jrAuthority(options?.authority),previous=jrAssertPrevious(options?.previous||null,authority),networkOnline=options?.networkOnline===true;
    const remote=jrRemote(options?.remote||null,authority,now);
    if(!networkOnline)return jrBase({phase:"OFFLINE_HOLD",authority,remote,previous,networkOnline:false,resumable:Boolean(previous?.durableKey)});
    if(remote?.pendingAction)return jrBase({phase:"RECOVERY_PENDING",authority,remote,previous,networkOnline:true,resumable:Boolean(previous?.durableKey)});
    if(!remote||!remote.active)return jrBase({phase:"FRESH_SESSION_REQUIRED",authority,remote,previous,networkOnline:true,resumable:Boolean(previous?.durableKey),freshSessionRequired:true});
    const setup=jrSetup(options?.setup,authority),progression=jrProgression(options?.progression,authority,setup,multiSeasonModule);
    const phase=progression.terminal?"TERMINAL_RECOVERED":"ACTIVE_RECOVERED";
    const next=jrBase({phase,authority,remote,previous,networkOnline:true,resumable:true,recovered:true,setup,progression});
    return jrAssertMonotonic(previous,next);
  }
  function jrCreateProtocol({multiSeasonModule=defaultMultiSeasonModule}={}){
    if(!multiSeasonModule||typeof multiSeasonModule.createProtocol!=="function")jrFail("JOURNEY_RECONNECT_MULTI_SEASON_UNAVAILABLE");
    return jrFreeze({
      contractVersion:1,feature:"ssjr-shared-journey-reconnect",runtimeRevision:RUNTIME_REVISION,phases:PHASES,
      observe:options=>jrObserve(options,multiSeasonModule),
      sessionAuthorityReplaceable:true,durableRivalryStatePreserved:true,expiredSessionNeverActive:true,offlineNeverAuthoritative:true,
      canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false
    });
  }

  return Object.freeze({
    contractVersion:1,feature:"ssjr-shared-journey-reconnect-factory",runtimeRevision:RUNTIME_REVISION,phases:PHASES,createProtocol:jrCreateProtocol,
    sessionAuthorityReplaceable:true,durableRivalryStatePreserved:true,expiredSessionNeverActive:true,offlineNeverAuthoritative:true,
    canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false
  });
});
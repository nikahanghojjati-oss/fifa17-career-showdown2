(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkSharedCareerStart=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const protocol=typeof require==="function"?require("./sharedCareerStart.js"):root.CareerModeSharedCareerStart;
  const setupProvider=typeof require==="function"?require("./sparkSharedShowdownSetup.js"):root.CareerModeSparkSharedShowdownSetup;
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const OPERATION=/^career_start_op_[0-9a-f]{32}$/;
  const LEDGER_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","revision","phase","setupRevision","setupOperationIds","totalSeasons","acknowledgedRoles","operationIds","baseRevisions","actorRoles","activeSessionId","updatedAt","updatedByDeviceId"]);

  function fail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function resultError(error){return Object.freeze({ok:false,code:error&&typeof error.code==="string"?error.code:"CAREER_START_PROVIDER_FAILED"});}
  function snapshot(value){return value&&typeof value.exists==="function"&&value.exists()?value.data():null;}
  function exact(value,keys){return !!value&&typeof value==="object"&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));}
  function normalizeRivalryId(value){const id=String(value||"").trim().toLowerCase();if(!/^pair_[0-9a-f]{64}$/.test(id))fail("CAREER_START_RIVALRY_INVALID");return id;}
  function normalizeSessionId(value){const id=String(value||"").trim().toLowerCase();if(!/^session_[0-9a-f]{64}$/.test(id))fail("CAREER_START_SESSION_INVALID");return id;}
  function normalizeDeviceId(value){const id=String(value||"").trim().toLowerCase();if(!/^device_[0-9a-f]{32}$/.test(id))fail("CAREER_START_DEVICE_INACTIVE");return id;}
  function normalizeOperationId(value){const id=String(value||"").trim().toLowerCase();if(!OPERATION.test(id))fail("CAREER_START_COMMAND_INVALID");return id;}
  function accountId(user){const id=user&&typeof user.uid==="string"?user.uid.trim():"";if(!id)fail("CAREER_START_AUTH_REQUIRED");return id;}
  function epoch(value){const n=Number(value===undefined?Date.now():value);if(!Number.isSafeInteger(n)||n<0)fail("CAREER_START_CLOCK_INVALID");return n;}
  function timestampMillis(value){if(value&&typeof value.toMillis==="function")return value.toMillis();if(value instanceof Date)return value.getTime();return Number.NaN;}
  function validateSdk(options){if(!options.firestore)fail("CAREER_START_PROVIDER_UNAVAILABLE");for(const name of ["doc","runTransaction"]){if(!options.firebaseSdk||typeof options.firebaseSdk[name]!=="function")fail("CAREER_START_PROVIDER_UNAVAILABLE");}if(typeof options.firebaseSdk.serverTimestamp!=="function"&&(!options.firebaseSdk.Timestamp||typeof options.firebaseSdk.Timestamp.fromMillis!=="function"))fail("CAREER_START_PROVIDER_UNAVAILABLE");}
  function updatedAt(sdk,now){return typeof sdk.serverTimestamp==="function"?sdk.serverTimestamp():sdk.Timestamp.fromMillis(now);}
  function assertAccount(value,uid){if(!value||value.objectType!=="account"||value.objectId!==uid||value.lifecycleState!=="live"||!value.data||value.data.status!=="active")fail("CAREER_START_MANAGER_INACTIVE");}
  function assertDevice(value,deviceId){if(!value||value.objectType!=="device"||value.objectId!==deviceId||value.lifecycleState!=="live"||!value.data||value.data.deviceId!==deviceId||value.data.state!=="active")fail("CAREER_START_DEVICE_INACTIVE");}
  function assertRivalry(value,rivalryId,uid){
    if(!value||value.objectType!=="rivalry"||value.objectId!==rivalryId||value.lifecycleState!=="live"||!value.data||value.data.connectionState!=="active")fail("CAREER_START_RIVALRY_INACTIVE");
    const slots=Array.isArray(value.data.managerSlots)?value.data.managerSlots:[],authorized=Array.isArray(value.data.authorizedAccountIds)?value.data.authorizedAccountIds:[];
    if(slots.length!==2||authorized.length!==2||new Set(authorized).size!==2)fail("CAREER_START_TWO_MANAGERS_REQUIRED");
    const ordered=ROLES.map(role=>slots.find(item=>item&&item.slotId===role));
    if(ordered.some(item=>!item||item.entitlementState!=="active"||typeof item.accountId!=="string")||ordered[0].accountId===ordered[1].accountId||!ordered.every(item=>authorized.includes(item.accountId)))fail("CAREER_START_BINDING_INVALID");
    const actor=ordered.find(item=>item.accountId===uid);if(!actor)fail("CAREER_START_ACTOR_NOT_ENTITLED");return Object.freeze({slots:ordered,authorized,actor});
  }
  function assertSession(value,rivalryId,sessionId,authorized,now){
    if(!value||value.objectType!=="session"||value.objectId!==sessionId||value.lifecycleState!=="live"||!value.data)fail("CAREER_START_SESSION_INVALID");
    const members=Array.isArray(value.data.memberAccountIds)?value.data.memberAccountIds:[],expires=timestampMillis(value.data.expiresAt);
    if(value.data.rivalryId!==rivalryId||value.data.state!=="active"||members.length!==2||new Set(members).size!==2||!authorized.every(id=>members.includes(id))||!members.every(id=>authorized.includes(id))||!Number.isFinite(expires)||now>=expires)fail("CAREER_START_ACTIVE_SESSION_REQUIRED");
  }
  function assertConfirmedSetupLedger(value,rivalryId){
    if(!value||value.schemaVersion!==1||value.objectType!=="sharedSetupLedger"||value.rivalryId!==rivalryId||value.revision!==6||value.phase!=="SHOWDOWN_CONFIRMED"||!Array.isArray(value.operationIds)||value.operationIds.length!==6||new Set(value.operationIds).size!==6||![1,3,5,10].includes(value.totalSeasons))fail("CAREER_START_SETUP_NOT_CONFIRMED");
    if(!Array.isArray(value.confirmedRoles)||value.confirmedRoles.length!==2||new Set(value.confirmedRoles).size!==2||!ROLES.every(role=>value.confirmedRoles.includes(role)))fail("CAREER_START_SETUP_NOT_CONFIRMED");
    return value;
  }
  function stateFromLedger(value,rivalryId,setupLedger){
    if(!value)return null;
    if(!exact(value,LEDGER_KEYS)||value.schemaVersion!==1||value.objectType!=="sharedCareerStart"||value.rivalryId!==rivalryId||value.setupRevision!==6||JSON.stringify(value.setupOperationIds)!==JSON.stringify(setupLedger.operationIds)||value.totalSeasons!==setupLedger.totalSeasons)fail("CAREER_START_PROVIDER_STATE_INVALID");
    const state={schemaVersion:1,runtimeRevision:protocol.runtimeRevision,revision:value.revision,phase:value.phase,acknowledgedRoles:value.acknowledgedRoles,operationIds:value.operationIds,baseRevisions:value.baseRevisions,actorRoles:value.actorRoles};
    protocol.validateState(state);
    if(!/^session_[0-9a-f]{64}$/.test(value.activeSessionId||"")||!/^device_[0-9a-f]{32}$/.test(value.updatedByDeviceId||""))fail("CAREER_START_PROVIDER_STATE_INVALID");
    return state;
  }
  function ledgerFrom({state,rivalryId,setupLedger,sessionId,deviceId,updatedAtValue}){return {schemaVersion:1,objectType:"sharedCareerStart",rivalryId,revision:state.revision,phase:state.phase,setupRevision:6,setupOperationIds:[...setupLedger.operationIds],totalSeasons:setupLedger.totalSeasons,acknowledgedRoles:[...state.acknowledgedRoles],operationIds:[...state.operationIds],baseRevisions:[...state.baseRevisions],actorRoles:[...state.actorRoles],activeSessionId:sessionId,updatedAt:updatedAtValue,updatedByDeviceId:deviceId};}
  async function confirmedSetup(options){
    if(!setupProvider||typeof setupProvider.read!=="function")fail("CAREER_START_SETUP_PROVIDER_UNAVAILABLE");
    const result=await setupProvider.read(options);if(!result||result.ok!==true||!result.state)fail(result&&result.code||"CAREER_START_SETUP_NOT_CONFIRMED");protocol.validateConfirmedSetup(result.state);return result.state;
  }
  async function context(options,transaction){
    const uid=accountId(options.user),rivalryId=normalizeRivalryId(options.rivalryId),sessionId=normalizeSessionId(options.sessionId),deviceId=normalizeDeviceId(options.deviceId),now=epoch(options.nowEpochMs),sdk=options.firebaseSdk,db=options.firestore;
    const refs={account:sdk.doc(db,"accounts",uid),device:sdk.doc(db,"accounts",uid,"devices",deviceId),rivalry:sdk.doc(db,"rivalries",rivalryId),session:sdk.doc(db,"rivalries",rivalryId,"sessions",sessionId),setup:sdk.doc(db,"rivalries",rivalryId,"sharedSetup","authoritative"),career:sdk.doc(db,"rivalries",rivalryId,"careerStart","authoritative")};
    assertAccount(snapshot(await transaction.get(refs.account)),uid);assertDevice(snapshot(await transaction.get(refs.device)),deviceId);const rivalry=assertRivalry(snapshot(await transaction.get(refs.rivalry)),rivalryId,uid);assertSession(snapshot(await transaction.get(refs.session)),rivalryId,sessionId,rivalry.authorized,now);const setupLedger=assertConfirmedSetupLedger(snapshot(await transaction.get(refs.setup)),rivalryId);const careerValue=snapshot(await transaction.get(refs.career));const state=stateFromLedger(careerValue,rivalryId,setupLedger);return Object.freeze({uid,rivalryId,sessionId,deviceId,now,rivalry,setupLedger,state,refs});
  }
  async function read(options={}){
    try{validateSdk(options);const setup=await confirmedSetup(options);return await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{const ctx=await context(options,transaction);return Object.freeze({ok:true,revision:ctx.state?ctx.state.revision:0,state:ctx.state?Object.freeze({...ctx.state}):null,setup:Object.freeze(JSON.parse(JSON.stringify(setup))),managerRole:ctx.rivalry.actor.slotId,assignment:protocol.localAssignment(setup,ctx.rivalry.actor.slotId)});});}catch(error){return resultError(error);}
  }
  async function acknowledge(options={}){
    try{
      validateSdk(options);const operationId=normalizeOperationId(options.operationId),baseRevision=Number(options.baseRevision);if(!Number.isInteger(baseRevision)||baseRevision<0||baseRevision>2)fail("CAREER_START_COMMAND_INVALID");const setup=await confirmedSetup(options);
      return await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{const ctx=await context(options,transaction),actorRole=ctx.rivalry.actor.slotId;const applied=protocol.apply({state:ctx.state,setup,actorRole,command:{type:"acknowledge-career-start",operationId,baseRevision}});if(applied.idempotent)return Object.freeze({ok:true,status:"accepted",replayed:true,revision:applied.state.revision,state:applied.state,setup,managerRole:actorRole,assignment:protocol.localAssignment(setup,actorRole)});transaction.set(ctx.refs.career,ledgerFrom({state:applied.state,rivalryId:ctx.rivalryId,setupLedger:ctx.setupLedger,sessionId:ctx.sessionId,deviceId:ctx.deviceId,updatedAtValue:updatedAt(options.firebaseSdk,ctx.now)}));return Object.freeze({ok:true,status:"accepted",replayed:false,revision:applied.state.revision,state:applied.state,setup,managerRole:actorRole,assignment:protocol.localAssignment(setup,actorRole)});});
    }catch(error){return resultError(error);}
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-spark-shared-career-start",read,acknowledge,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,canonicalStorageMutation:false});
});

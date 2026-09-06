(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkSharedShowdownSetup=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const protocolModule=typeof require==="function"?require("./sharedShowdownSetup.js"):root.CareerModeSharedShowdownSetup;
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const TYPES=Object.freeze(["open","commit-league","commit-clubs","commit-length","confirm","confirm"]);
  const PHASES=Object.freeze(["SHARED_SETUP_OPEN","LEAGUE_WHEEL_COMMITTED","CLUB_ASSIGNMENTS_COMMITTED","SEASON_LENGTH_COMMITTED","SHOWDOWN_CONFIRMED"]);
  const LENGTHS=Object.freeze([1,3,5,10]);
  const CANONICAL_KEYS=Object.freeze([
    "careerModeShowdown.saveLibrary",
    "careerModeShowdown.legacyShowdowns",
    "careerModeShowdown.preferences"
  ]);
  const LEDGER_KEYS=Object.freeze([
    "schemaVersion","objectType","rivalryId","revision","phase","coordinatorRole",
    "operationIds","operationTypes","baseRevisions","actorRoles","totalSeasons",
    "confirmedRoles","activeSessionId","updatedAt","updatedByDeviceId"
  ]);

  function fail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function resultError(error){return Object.freeze({ok:false,code:error&&typeof error.code==="string"?error.code:"SETUP_PROVIDER_FAILED"});}
  function exact(value,keys){return !!value&&typeof value==="object"&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));}
  function normalizeRivalryId(value){const id=String(value||"").trim().toLowerCase();if(!/^pair_[0-9a-f]{64}$/.test(id))fail("SETUP_RIVALRY_INVALID");return id;}
  function normalizeSessionId(value){const id=String(value||"").trim().toLowerCase();if(!/^session_[0-9a-f]{64}$/.test(id))fail("SETUP_SESSION_INVALID");return id;}
  function normalizeDeviceId(value){const id=String(value||"").trim().toLowerCase();if(!/^device_[0-9a-f]{32}$/.test(id))fail("SETUP_DEVICE_INACTIVE");return id;}
  function normalizeOperationId(value){const id=String(value||"").trim().toLowerCase();if(!/^setup_op_[0-9a-f]{32}$/.test(id))fail("SETUP_COMMAND_INVALID");return id;}
  function accountId(user){const id=user&&typeof user.uid==="string"?user.uid.trim():"";if(!id)fail("SETUP_AUTH_REQUIRED");return id;}
  function timestampMillis(value){if(value&&typeof value.toMillis==="function")return value.toMillis();if(value instanceof Date)return value.getTime();return Number.NaN;}
  function snapshot(value){return value&&typeof value.exists==="function"&&value.exists()?value.data():null;}
  function nowEpochMs(value){const result=Number(value===undefined?Date.now():value);if(!Number.isSafeInteger(result)||result<0)fail("SETUP_CLOCK_INVALID");return result;}
  function validateSdk(firestore,sdk){
    if(!firestore)fail("SETUP_PROVIDER_UNAVAILABLE");
    for(const name of ["doc","runTransaction"]){if(!sdk||typeof sdk[name]!=="function")fail("SETUP_PROVIDER_UNAVAILABLE");}
    if(typeof sdk.serverTimestamp!=="function"&&(!sdk.Timestamp||typeof sdk.Timestamp.fromMillis!=="function"))fail("SETUP_PROVIDER_UNAVAILABLE");
  }
  function updatedAt(sdk,epochMs){return typeof sdk.serverTimestamp==="function"?sdk.serverTimestamp():sdk.Timestamp.fromMillis(epochMs);}
  function assertAccount(value,id){
    if(!value||value.objectType!=="account"||value.objectId!==id||value.lifecycleState!=="live"||!value.data||value.data.status!=="active")fail("SETUP_MANAGER_INACTIVE");
    return value;
  }
  function assertDevice(value,id){
    if(!value||value.objectType!=="device"||value.objectId!==id||value.lifecycleState!=="live"||!value.data||value.data.deviceId!==id||value.data.state!=="active")fail("SETUP_DEVICE_INACTIVE");
    return value;
  }
  function assertRivalry(value,rivalryId,uid){
    if(!value||value.objectType!=="rivalry"||value.objectId!==rivalryId||value.lifecycleState!=="live"||!value.data||value.data.connectionState!=="active")fail("SETUP_RIVALRY_INACTIVE");
    const slots=Array.isArray(value.data.managerSlots)?value.data.managerSlots:[];
    const authorized=Array.isArray(value.data.authorizedAccountIds)?value.data.authorizedAccountIds:[];
    if(slots.length!==2||authorized.length!==2||new Set(authorized).size!==2)fail("SETUP_TWO_MANAGERS_REQUIRED");
    const ordered=ROLES.map(role=>slots.find(item=>item&&item.slotId===role));
    if(ordered.some(item=>!item||item.entitlementState!=="active"||typeof item.accountId!=="string"||!/^profile_[0-9a-f]{24}$/.test(item.profileId||"")||!/^save_[0-9a-f]{24}$/.test(item.saveId||"")))fail("SETUP_BINDING_INVALID");
    if(ordered[0].accountId===ordered[1].accountId||!ordered.every(item=>authorized.includes(item.accountId))||!authorized.every(id=>ordered.some(item=>item.accountId===id)))fail("SETUP_TWO_MANAGERS_REQUIRED");
    const actor=ordered.find(item=>item.accountId===uid);
    if(!actor)fail("SETUP_ACTOR_NOT_ENTITLED");
    return Object.freeze({slots:ordered,authorized,actor});
  }
  function assertSession(value,rivalryId,sessionId,authorized,epochMs){
    if(!value||value.objectType!=="session"||value.objectId!==sessionId||value.lifecycleState!=="live"||!value.data)fail("SETUP_SESSION_INVALID");
    const data=value.data;
    const members=Array.isArray(data.memberAccountIds)?data.memberAccountIds:[];
    const expiresAt=timestampMillis(data.expiresAt);
    if(data.rivalryId!==rivalryId||data.state!=="active"||members.length!==2||new Set(members).size!==2||!authorized.every(id=>members.includes(id))||!members.every(id=>authorized.includes(id)))fail("SETUP_ACTIVE_SESSION_REQUIRED");
    if(!Number.isFinite(expiresAt)||epochMs>=expiresAt)fail("SETUP_ACTIVE_SESSION_REQUIRED");
    if(!authorized.includes(data.hostAccountId))fail("SETUP_SESSION_MEMBERS_MISMATCH");
    return Object.freeze({sessionId,data,expiresAt});
  }
  function expectedPhase(revision){return revision<=1?PHASES[0]:revision===2?PHASES[1]:revision===3?PHASES[2]:revision<=5?PHASES[3]:PHASES[4];}
  function assertLedger(value,rivalryId){
    if(!exact(value,LEDGER_KEYS)||value.schemaVersion!==1||value.objectType!=="sharedSetupLedger"||value.rivalryId!==rivalryId||!Number.isInteger(value.revision)||value.revision<1||value.revision>6||!ROLES.includes(value.coordinatorRole)||value.phase!==expectedPhase(value.revision))fail("SETUP_PROVIDER_STATE_INVALID");
    for(const key of ["operationIds","operationTypes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==value.revision)fail("SETUP_PROVIDER_STATE_INVALID");}
    if(new Set(value.operationIds).size!==value.operationIds.length||value.operationIds.some(id=>!/^setup_op_[0-9a-f]{32}$/.test(id)))fail("SETUP_PROVIDER_STATE_INVALID");
    if(value.operationTypes.some((type,index)=>type!==TYPES[index])||value.baseRevisions.some((base,index)=>base!==index)||value.actorRoles.some(role=>!ROLES.includes(role)))fail("SETUP_PROVIDER_STATE_INVALID");
    if(value.actorRoles.slice(0,4).some(role=>role!==value.coordinatorRole))fail("SETUP_PROVIDER_STATE_INVALID");
    if(value.revision<4?value.totalSeasons!==null:!LENGTHS.includes(value.totalSeasons))fail("SETUP_PROVIDER_STATE_INVALID");
    const confirmations=value.revision<=4?[]:value.actorRoles.slice(4);
    if(!Array.isArray(value.confirmedRoles)||JSON.stringify(value.confirmedRoles)!==JSON.stringify(confirmations)||new Set(confirmations).size!==confirmations.length)fail("SETUP_PROVIDER_STATE_INVALID");
    if(!/^session_[0-9a-f]{64}$/.test(value.activeSessionId||"")||!/^device_[0-9a-f]{32}$/.test(value.updatedByDeviceId||""))fail("SETUP_PROVIDER_STATE_INVALID");
    return value;
  }
  function roleSnapshot(item){return {slotId:item.slotId,accountId:item.accountId,profileId:item.profileId,saveId:item.saveId,accountState:"active",entitlementState:"active"};}
  function authority({rivalryId,rivalry,session,role,deviceId,epochMs,hostRole}){
    const slot=rivalry.slots.find(item=>item.slotId===role);
    const host=rivalry.slots.find(item=>item.slotId===hostRole);
    if(!slot||!host)fail("SETUP_SESSION_MEMBERS_MISMATCH");
    return {
      rivalryId,
      connectionState:"active",
      managerSlots:rivalry.slots.map(roleSnapshot),
      actor:{accountId:slot.accountId,deviceId,deviceState:"active",managerRole:role,profileId:slot.profileId,saveId:slot.saveId},
      session:{sessionId:session.sessionId,rivalryId,state:"active",hostAccountId:host.accountId,memberAccountIds:[...rivalry.authorized],expiresAtEpochMs:Math.max(epochMs+1,session.expiresAt)},
      nowEpochMs:epochMs
    };
  }
  function syntheticSession(rivalryId,rivalry,coordinatorRole,sessionId){
    const host=rivalry.slots.find(item=>item.slotId===coordinatorRole);
    if(!host)fail("SETUP_PROVIDER_STATE_INVALID");
    return Object.freeze({sessionId,data:{rivalryId,state:"active",hostAccountId:host.accountId,memberAccountIds:[...rivalry.authorized]},expiresAt:2});
  }
  async function rebuild(protocol,ledger,rivalry,rivalryId,cryptoImpl){
    if(!ledger)return null;
    assertLedger(ledger,rivalryId);
    const session=syntheticSession(rivalryId,rivalry,ledger.coordinatorRole,ledger.activeSessionId);
    let state=null;
    for(let index=0;index<ledger.revision;index++){
      const type=ledger.operationTypes[index];
      const role=ledger.actorRoles[index];
      const auth=authority({rivalryId,rivalry,session,role,deviceId:"device_"+"0".repeat(32),epochMs:0,hostRole:ledger.coordinatorRole});
      let command;
      if(type==="commit-league"||type==="commit-clubs")command=await protocol.prepareDraw({state,type,operationId:ledger.operationIds[index]});
      else if(type==="commit-length")command={type,operationId:ledger.operationIds[index],baseRevision:ledger.baseRevisions[index],totalSeasons:ledger.totalSeasons};
      else if(type==="confirm")command={type,operationId:ledger.operationIds[index],baseRevision:ledger.baseRevisions[index],setupHash:await protocol.confirmationHash(state)};
      else command={type,operationId:ledger.operationIds[index],baseRevision:ledger.baseRevisions[index]};
      const applied=await protocol.apply({state,authority:auth,command});
      if(!applied.ok)fail("SETUP_PROVIDER_STATE_INVALID");
      state=applied.state;
    }
    return state;
  }
  function ledgerFrom({prior,nextState,rivalryId,operationId,type,baseRevision,actorRole,totalSeasons,sessionId,deviceId,updatedAtValue}){
    const operationIds=prior?[...prior.operationIds,operationId]:[operationId];
    const operationTypes=prior?[...prior.operationTypes,type]:[type];
    const baseRevisions=prior?[...prior.baseRevisions,baseRevision]:[baseRevision];
    const actorRoles=prior?[...prior.actorRoles,actorRole]:[actorRole];
    const resolvedSeasons=type==="commit-length"?totalSeasons:(prior?prior.totalSeasons:null);
    const confirmedRoles=actorRoles.slice(4);
    return {
      schemaVersion:1,
      objectType:"sharedSetupLedger",
      rivalryId,
      revision:nextState.revision,
      phase:nextState.phase,
      coordinatorRole:nextState.coordinatorRole,
      operationIds,
      operationTypes,
      baseRevisions,
      actorRoles,
      totalSeasons:resolvedSeasons,
      confirmedRoles,
      activeSessionId:sessionId,
      updatedAt:updatedAtValue,
      updatedByDeviceId:deviceId
    };
  }
  async function context(options,transaction){
    const uid=accountId(options.user);
    const rivalryId=normalizeRivalryId(options.rivalryId);
    const sessionId=normalizeSessionId(options.sessionId);
    const deviceId=normalizeDeviceId(options.deviceId);
    const epochMs=nowEpochMs(options.nowEpochMs);
    validateSdk(options.firestore,options.firebaseSdk);
    const sdk=options.firebaseSdk;
    const db=options.firestore;
    const refs={
      account:sdk.doc(db,"accounts",uid),
      device:sdk.doc(db,"accounts",uid,"devices",deviceId),
      rivalry:sdk.doc(db,"rivalries",rivalryId),
      session:sdk.doc(db,"rivalries",rivalryId,"sessions",sessionId),
      setup:sdk.doc(db,"rivalries",rivalryId,"sharedSetup","authoritative")
    };
    assertAccount(snapshot(await transaction.get(refs.account)),uid);
    assertDevice(snapshot(await transaction.get(refs.device)),deviceId);
    const rivalry=assertRivalry(snapshot(await transaction.get(refs.rivalry)),rivalryId,uid);
    const session=assertSession(snapshot(await transaction.get(refs.session)),rivalryId,sessionId,rivalry.authorized,epochMs);
    const setupValue=snapshot(await transaction.get(refs.setup));
    const ledger=setupValue?assertLedger(setupValue,rivalryId):null;
    return Object.freeze({uid,rivalryId,sessionId,deviceId,epochMs,rivalry,session,ledger,refs});
  }
  async function mutate(options={}){
    try{
      const operationId=normalizeOperationId(options.operationId);
      const type=String(options.type||"");
      if(!["open","commit-league","commit-clubs","commit-length","confirm"].includes(type))fail("SETUP_COMMAND_INVALID");
      const baseRevision=Number(options.baseRevision);
      if(!Number.isInteger(baseRevision)||baseRevision<0)fail("SETUP_COMMAND_INVALID");
      if(type==="commit-length"&&!LENGTHS.includes(options.totalSeasons))fail("SETUP_LENGTH_INVALID");
      validateSdk(options.firestore,options.firebaseSdk);
      if(!protocolModule||typeof protocolModule.createProtocol!=="function")fail("SETUP_PROVIDER_UNAVAILABLE");
      const protocol=await protocolModule.createProtocol({catalog:options.catalog,cryptoImpl:options.cryptoImpl||root.crypto});
      return await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{
        const ctx=await context(options,transaction);
        const prior=ctx.ledger;
        const priorState=await rebuild(protocol,prior,ctx.rivalry,ctx.rivalryId,options.cryptoImpl||root.crypto);
        if(prior){
          const existing=prior.operationIds.indexOf(operationId);
          if(existing!==-1){
            const same=prior.operationTypes[existing]===type&&prior.baseRevisions[existing]===baseRevision&&(type!=="commit-length"||prior.totalSeasons===options.totalSeasons);
            if(!same)fail("SETUP_IDEMPOTENCY_CONFLICT");
            return Object.freeze({ok:true,status:"replayed",replayed:true,revision:prior.revision,state:priorState});
          }
        }
        if(baseRevision!==(prior?prior.revision:0))fail("SETUP_STALE_BASE_REVISION");
        const actorRole=ctx.rivalry.actor.slotId;
        const host=ctx.rivalry.slots.find(item=>item.accountId===ctx.session.data.hostAccountId);
        if(!host)fail("SETUP_SESSION_MEMBERS_MISMATCH");
        const auth=authority({rivalryId:ctx.rivalryId,rivalry:ctx.rivalry,session:ctx.session,role:actorRole,deviceId:ctx.deviceId,epochMs:ctx.epochMs,hostRole:host.slotId});
        let command;
        if(type==="commit-league"||type==="commit-clubs")command=await protocol.prepareDraw({state:priorState,type,operationId});
        else if(type==="commit-length")command={type,operationId,baseRevision,totalSeasons:options.totalSeasons};
        else if(type==="confirm")command={type,operationId,baseRevision,setupHash:await protocol.confirmationHash(priorState)};
        else command={type,operationId,baseRevision};
        const applied=await protocol.apply({state:priorState,authority:auth,command});
        if(!applied.ok)fail(applied.code);
        const next=ledgerFrom({
          prior,
          nextState:applied.state,
          rivalryId:ctx.rivalryId,
          operationId,
          type,
          baseRevision,
          actorRole,
          totalSeasons:options.totalSeasons,
          sessionId:ctx.sessionId,
          deviceId:ctx.deviceId,
          updatedAtValue:updatedAt(options.firebaseSdk,ctx.epochMs)
        });
        transaction.set(ctx.refs.setup,next);
        return Object.freeze({ok:true,status:"accepted",replayed:false,revision:applied.state.revision,state:applied.state});
      });
    }catch(error){return resultError(error);}
  }
  async function read(options={}){
    try{
      validateSdk(options.firestore,options.firebaseSdk);
      if(!protocolModule||typeof protocolModule.createProtocol!=="function")fail("SETUP_PROVIDER_UNAVAILABLE");
      const protocol=await protocolModule.createProtocol({catalog:options.catalog,cryptoImpl:options.cryptoImpl||root.crypto});
      return await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{
        const ctx=await context(options,transaction);
        if(!ctx.ledger)return Object.freeze({ok:true,status:"empty",revision:0,state:null});
        const state=await rebuild(protocol,ctx.ledger,ctx.rivalry,ctx.rivalryId,options.cryptoImpl||root.crypto);
        return Object.freeze({ok:true,status:"live",revision:ctx.ledger.revision,state});
      });
    }catch(error){return resultError(error);}
  }

  return Object.freeze({
    contractVersion:1,
    implementationState:"candidate-spark-exact-path",
    productionEnabled:false,
    billingRequired:false,
    canonicalStorageMutation:false,
    canonicalStorageKeys:CANONICAL_KEYS,
    setupPath:"rivalries/{rivalryId}/sharedSetup/authoritative",
    mutate,
    read
  });
});

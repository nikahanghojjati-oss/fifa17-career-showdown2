(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedCareerStart=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const SCHEMA_VERSION=1;
  const RUNTIME_REVISION="1.9.1-r7";
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const PHASE_ONE="ONE_MANAGER_ACKNOWLEDGED";
  const PHASE_READY="CAREER_START_READY";
  const OPERATION=/^career_start_op_[0-9a-f]{32}$/;
  const SEASONS=new Set([1,3,5,10]);

  function scsFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function scsClone(value){return JSON.parse(JSON.stringify(value));}
  function scsExact(value,keys){return !!value&&typeof value==="object"&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));}
  function scsValidRole(value){return ROLES.includes(value);}
  function scsValidateConfirmedSetup(setup){
    if(!setup||setup.phase!=="SHOWDOWN_CONFIRMED"||setup.revision!==6)scsFail("CAREER_START_SETUP_NOT_CONFIRMED","Shared Setup must be fully confirmed before Career Start.");
    if(!scsValidRole(setup.coordinatorRole))scsFail("CAREER_START_SETUP_INVALID");
    if(typeof setup.leagueId!=="string"||!setup.leagueId)scsFail("CAREER_START_SETUP_INVALID");
    if(!setup.clubs||typeof setup.clubs.playerOne!=="string"||typeof setup.clubs.playerTwo!=="string"||!setup.clubs.playerOne||!setup.clubs.playerTwo||setup.clubs.playerOne===setup.clubs.playerTwo)scsFail("CAREER_START_SETUP_INVALID");
    if(!SEASONS.has(setup.totalSeasons))scsFail("CAREER_START_SETUP_INVALID");
    if(!Array.isArray(setup.confirmedRoles)||setup.confirmedRoles.length!==2||new Set(setup.confirmedRoles).size!==2||!ROLES.every(role=>setup.confirmedRoles.includes(role)))scsFail("CAREER_START_SETUP_INVALID");
    return setup;
  }
  function scsValidateState(value){
    const keys=["schemaVersion","runtimeRevision","revision","phase","acknowledgedRoles","operationIds","baseRevisions","actorRoles"];
    if(!scsExact(value,keys)||value.schemaVersion!==SCHEMA_VERSION||value.runtimeRevision!==RUNTIME_REVISION)scsFail("CAREER_START_STATE_INVALID");
    if(!Number.isInteger(value.revision)||value.revision<1||value.revision>2)scsFail("CAREER_START_STATE_INVALID");
    if(!Array.isArray(value.acknowledgedRoles)||value.acknowledgedRoles.length!==value.revision||new Set(value.acknowledgedRoles).size!==value.acknowledgedRoles.length||value.acknowledgedRoles.some(role=>!scsValidRole(role)))scsFail("CAREER_START_STATE_INVALID");
    for(const key of ["operationIds","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==value.revision)scsFail("CAREER_START_STATE_INVALID");}
    if(new Set(value.operationIds).size!==value.operationIds.length||value.operationIds.some(id=>!OPERATION.test(id)))scsFail("CAREER_START_STATE_INVALID");
    if(value.baseRevisions.some((base,index)=>base!==index))scsFail("CAREER_START_STATE_INVALID");
    if(value.actorRoles.some((role,index)=>!scsValidRole(role)||role!==value.acknowledgedRoles[index]))scsFail("CAREER_START_STATE_INVALID");
    if(value.revision===1&&value.phase!==PHASE_ONE)scsFail("CAREER_START_STATE_INVALID");
    if(value.revision===2&&value.phase!==PHASE_READY)scsFail("CAREER_START_STATE_INVALID");
    return value;
  }
  function scsNormalizeCommand(command){
    if(!command||command.type!=="acknowledge-career-start"||!OPERATION.test(String(command.operationId||""))||!Number.isInteger(command.baseRevision)||command.baseRevision<0||command.baseRevision>2)scsFail("CAREER_START_COMMAND_INVALID");
    return {type:"acknowledge-career-start",operationId:command.operationId,baseRevision:command.baseRevision};
  }
  function scsLocalAssignment(setup,managerRole){scsValidateConfirmedSetup(setup);if(!scsValidRole(managerRole))scsFail("CAREER_START_ROLE_INVALID");return Object.freeze({managerRole,club:setup.clubs[managerRole],leagueId:setup.leagueId,totalSeasons:setup.totalSeasons});}
  function scsApply({state=null,setup,actorRole,command}){
    scsValidateConfirmedSetup(setup);if(!scsValidRole(actorRole))scsFail("CAREER_START_ROLE_INVALID");const normalized=scsNormalizeCommand(command);const current=state?scsValidateState(scsClone(state)):null;
    if(current){
      const existing=current.operationIds.indexOf(normalized.operationId);
      if(existing>=0){
        if(current.actorRoles[existing]!==actorRole||current.baseRevisions[existing]!==normalized.baseRevision)scsFail("CAREER_START_IDEMPOTENCY_CONFLICT");
        return Object.freeze({ok:true,idempotent:true,state:Object.freeze(scsClone(current))});
      }
    }
    const revision=current?current.revision:0;
    if(normalized.baseRevision!==revision)scsFail("CAREER_START_STALE_BASE_REVISION");
    if(current&&current.phase===PHASE_READY)scsFail("CAREER_START_ALREADY_READY");
    if(current&&current.acknowledgedRoles.includes(actorRole))scsFail("CAREER_START_ROLE_ALREADY_ACKNOWLEDGED");
    const acknowledgedRoles=current?[...current.acknowledgedRoles,actorRole]:[actorRole];
    const operationIds=current?[...current.operationIds,normalized.operationId]:[normalized.operationId];
    const baseRevisions=current?[...current.baseRevisions,normalized.baseRevision]:[normalized.baseRevision];
    const actorRoles=current?[...current.actorRoles,actorRole]:[actorRole];
    const next={schemaVersion:SCHEMA_VERSION,runtimeRevision:RUNTIME_REVISION,revision:revision+1,phase:revision+1===2?PHASE_READY:PHASE_ONE,acknowledgedRoles,operationIds,baseRevisions,actorRoles};
    scsValidateState(next);
    return Object.freeze({ok:true,idempotent:false,state:Object.freeze(scsClone(next))});
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-shared-career-start",runtimeRevision:RUNTIME_REVISION,roles:ROLES,phases:Object.freeze([PHASE_ONE,PHASE_READY]),validateConfirmedSetup:scsValidateConfirmedSetup,validateState:scsValidateState,localAssignment:scsLocalAssignment,apply:scsApply,billingRequired:false,canonicalStorageMutation:false});
});

import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

export const EVIDENCE_SCHEMA="career-mode-showdown.physical-journey-acceptance.v1";
export const RESULT_SCHEMA="career-mode-showdown.physical-journey-validation.v1";
const FINGERPRINT=/^sha256:[a-f0-9]{64}$/;
const RAW_PRIVATE=/\b(?:pair|session)_[a-f0-9]{64}\b|\bdevice_[a-f0-9]{32}\b|\b(?:save|profile)_[a-f0-9]{24}\b/i;
const FORBIDDEN_KEYS=new Set(["accountid","deviceid","rivalryid","sessionid","saveid","profileid","rawcapability","capability"]);
const ROLES=new Set(["playerOne","playerTwo"]);
const REMOTE_ROLES=new Set(["host","peer"]);
const CORE_STAGES=["remote-active","setup-confirmed","career-start-ready","transfer-completed","results-ready","season-acknowledged","scoring-reconciled","history-converged","local-reconciliation-safe","final-season-reconciled","terminal-closed"];
const SEASON_ONE_STAGES=["transfer-completed","results-ready","season-acknowledged","scoring-reconciled","history-converged","final-season-reconciled"];

const plain=value=>!!value&&typeof value==="object"&&!Array.isArray(value);
const norm=value=>String(value||"").replace(/[^a-z0-9]/gi,"").toLowerCase();
const issue=(source,code,message)=>Object.freeze({source,code,message});
function scanPrivacy(value,source,issues){
  if(Array.isArray(value)){for(const item of value)scanPrivacy(item,source,issues);return;}
  if(plain(value)){for(const [key,item] of Object.entries(value)){if(FORBIDDEN_KEYS.has(norm(key)))issues.push(issue(source,"RAW_AUTHORITY_FIELD","A raw authority field is forbidden in Physical Journey evidence."));scanPrivacy(item,source,issues);}return;}
  if(typeof value==="string"&&RAW_PRIVATE.test(value))issues.push(issue(source,"RAW_PRIVATE_VALUE","A raw private identifier-shaped value is forbidden in Physical Journey evidence."));
}
function deviceSignature(device){if(!plain(device))return null;return JSON.stringify([String(device.userAgent||""),String(device.platform||""),Number(device.maxTouchPoints||0),Number(device.screenWidth||0),Number(device.screenHeight||0)]);}
function validateSingle(evidence,source,{expectedAppVersion,expectedRuntimeRevision}){
  const issues=[];if(!plain(evidence)){issues.push(issue(source,"EXPORT_NOT_OBJECT","Evidence must be a JSON object."));return {issues,facts:{}};}scanPrivacy(evidence,source,issues);
  const require=(condition,code,message)=>{if(!condition)issues.push(issue(source,code,message));return condition;};
  require(evidence.schema===EVIDENCE_SCHEMA,"SCHEMA_MISMATCH","Unexpected Physical Journey evidence schema.");
  require(evidence.acceptanceMode===true&&evidence.physicalJourneyMode===true,"ACCEPTANCE_MODE_REQUIRED","Both acceptance flags must be true.");
  require(evidence.sanitizedSessionStorageOnly===true,"SANITIZED_STORAGE_REQUIRED","Only sanitized sessionStorage persistence is allowed.");
  require(evidence.recorderNetworkRequests===false,"RECORDER_NETWORK_WRITE_FORBIDDEN","The recorder must make no network requests.");
  require(evidence.rawAuthorityIncluded===false&&evidence.canonicalRawIncluded===false,"RAW_EXPORT_FORBIDDEN","Raw authority and canonical bytes must not be exported.");
  require(evidence.appVersion===expectedAppVersion,"APP_VERSION_MISMATCH","Evidence app version does not match the accepted production boundary.");
  require(evidence.runtimeRevision===expectedRuntimeRevision,"RUNTIME_REVISION_MISMATCH","Evidence runtime revision does not match the accepted production boundary.");
  require(Number.isFinite(Date.parse(String(evidence.generatedAt||""))),"GENERATED_AT_INVALID","generatedAt must be a valid timestamp.");
  require(plain(evidence.device),"DEVICE_FACTS_REQUIRED","Browser device facts are required.");
  const signature=deviceSignature(evidence.device);require(Boolean(signature),"DEVICE_FACTS_REQUIRED","Browser device facts are required.");
  const deviceLabel=String(evidence.deviceLabel||"").trim(),networkLabel=String(evidence.networkLabel||"").trim();
  require(deviceLabel.length>0&&deviceLabel.length<=80,"DEVICE_LABEL_REQUIRED","A concise device label is required.");
  require(networkLabel.length>0&&networkLabel.length<=80,"NETWORK_LABEL_REQUIRED","A concise network label is required.");
  require(ROLES.has(evidence.managerRole),"MANAGER_ROLE_INVALID","managerRole must be playerOne or playerTwo.");
  require(REMOTE_ROLES.has(evidence.remoteRole),"REMOTE_ROLE_INVALID","remoteRole must be host or peer.");
  for(const field of ["accountFingerprint","deviceFingerprint","rivalryFingerprint","canonicalStorageBeforeHash","canonicalStorageAfterHash"])require(FINGERPRINT.test(String(evidence[field]||"")),"FINGERPRINT_INVALID",`${field} must be a SHA-256 fingerprint.`);
  const sessionFingerprints=Array.isArray(evidence.sessionFingerprints)?evidence.sessionFingerprints:[];require(sessionFingerprints.length>0&&sessionFingerprints.length<=12&&sessionFingerprints.every(value=>FINGERPRINT.test(value)),"SESSION_FINGERPRINTS_INVALID","Session fingerprints must be a non-empty bounded SHA-256 list.");
  require(evidence.authorityViolation===false,"AUTHORITY_CHANGED","Manager/account/device/rivalry authority changed during Physical Journey acceptance.");
  require(evidence.canonicalStorageViolation===false,"CANONICAL_STORAGE_CHANGED","Canonical local storage changed during the standard Physical Journey acceptance run.");
  require(evidence.canonicalStorageBeforeHash===evidence.canonicalStorageAfterHash,"CANONICAL_STORAGE_HASH_MISMATCH","Canonical local storage hashes must match for the standard non-Apply run.");
  require(evidence.candidateCApplied===false,"CANDIDATE_C_APPLY_FORBIDDEN","Standard Physical Journey acceptance must not destructively apply Candidate C.");
  require(evidence.offlineObserved===true&&evidence.onlineRecovered===true,"OFFLINE_RECOVERY_MISSING","A real offline-to-online recovery must be observed.");
  require(evidence.reloadResumed===true&&Number.isInteger(evidence.startupCount)&&evidence.startupCount>=3,"RELOAD_RECOVERY_MISSING","The journey must include distinct pre-terminal and post-terminal page reload startups.");
  require(evidence.terminalReloadVerified===true,"TERMINAL_RELOAD_MISSING","Terminal CLOSED must be observed again after a later reload.");
  require(evidence.conflictGuardProven===true,"CONFLICT_GUARD_MISSING","The non-writing production conflict guard probe must pass.");
  require(evidence.completed===true,"RECORDER_NOT_COMPLETE","Recorder did not reach its complete acceptance state.");
  const milestones=Array.isArray(evidence.milestones)?evidence.milestones:[];require(milestones.length>0&&milestones.length<=96,"MILESTONES_INVALID","Milestones must be a non-empty bounded array.");
  let priorSequence=0,priorTime=-Infinity;const byStage=new Map();
  for(const item of milestones){
    if(!plain(item)){issues.push(issue(source,"MILESTONE_INVALID","Every milestone must be an object."));continue;}
    require(Number.isInteger(item.sequence)&&item.sequence>priorSequence,"MILESTONE_SEQUENCE_INVALID","Milestone sequence must strictly increase.");if(Number.isInteger(item.sequence))priorSequence=item.sequence;
    const time=Date.parse(String(item.at||""));require(Number.isFinite(time)&&time>=priorTime,"MILESTONE_TIME_INVALID","Milestone timestamps must be valid and nondecreasing.");if(Number.isFinite(time))priorTime=time;
    require(typeof item.stage==="string"&&item.stage.length>0&&item.stage.length<=80,"MILESTONE_STAGE_INVALID","Milestone stage is invalid.");
    require(typeof item.online==="boolean","MILESTONE_ONLINE_INVALID","Milestone must contain the browser online flag.");
    if(typeof item.stage==="string"&&!byStage.has(item.stage))byStage.set(item.stage,item);
  }
  let corePrior=0;for(const stage of CORE_STAGES){const item=byStage.get(stage);require(Boolean(item),"CORE_STAGE_MISSING",`Required stage missing: ${stage}.`);if(item){require(item.sequence>corePrior,"CORE_STAGE_ORDER_INVALID",`Required stage is out of order: ${stage}.`);corePrior=item.sequence;}}
  const conflict=byStage.get("conflict-guard-proven");require(Boolean(conflict),"CONFLICT_MILESTONE_MISSING","The non-writing conflict-guard milestone must be recorded.");
  const setup=byStage.get("setup-confirmed");require(Boolean(setup&&setup.totalSeasons===1),"ONE_SEASON_PLAN_REQUIRED","Physical Journey acceptance requires the confirmed one-season plan.");
  for(const stage of SEASON_ONE_STAGES){const item=byStage.get(stage);require(Boolean(item&&item.seasonNumber===1),"SEASON_ONE_REQUIRED",`Physical Journey stage must refer to season 1: ${stage}.`);}
  const localMilestones=milestones.filter(item=>plain(item)&&item.stage==="local-reconciliation-safe"),localPreview=localMilestones.find(item=>item.phase==="PREVIEW_READY");
  const history=byStage.get("history-converged"),offline=byStage.get("network-offline"),online=byStage.get("network-online"),recovered=byStage.get("reconnect-recovered"),reload=byStage.get("reload-resumed"),finalState=byStage.get("final-season-reconciled"),terminal=byStage.get("terminal-closed"),terminalReload=byStage.get("terminal-reload-verified");
  require(Boolean(history&&offline&&online&&recovered&&reload&&localPreview&&finalState&&terminal&&terminalReload&&history.sequence<offline.sequence&&offline.sequence<online.sequence&&online.sequence<recovered.sequence&&recovered.sequence<reload.sequence&&reload.sequence<localPreview.sequence&&localPreview.sequence<finalState.sequence&&finalState.sequence<terminal.sequence&&terminal.sequence<terminalReload.sequence),"RECOVERY_ORDER_INVALID","History, offline, online, reconnect, pre-terminal reload, Local Reconciliation preview, Final Reconciliation, terminal and terminal-reload milestones must occur in the canonical order.");
  require(Boolean(offline&&offline.online===false),"OFFLINE_FLAG_INVALID","The network-offline milestone must record browser online=false.");
  require(Boolean(online&&online.online===true&&recovered&&recovered.online===true),"ONLINE_RECOVERY_FLAG_INVALID","Online and reconnect-recovered milestones must record browser online=true.");
  require(Boolean(recovered&&reload&&terminal&&terminalReload&&Number.isInteger(recovered.startupCount)&&Number.isInteger(reload.startupCount)&&Number.isInteger(terminal.startupCount)&&Number.isInteger(terminalReload.startupCount)&&recovered.startupCount<reload.startupCount&&reload.startupCount<=terminal.startupCount&&terminal.startupCount<terminalReload.startupCount),"RECOVERY_STARTUP_ORDER_INVALID","Reconnect recovery, pre-terminal reload and post-CLOSED reload must occur on distinct ordered recorder startups.");
  require(Boolean(localPreview&&localPreview.providerWrite===false),"LOCAL_RECONCILIATION_PREVIEW_REQUIRED","Standard Physical Journey must record an actual read-only PREVIEW_READY Local Reconciliation milestone.");
  require(localMilestones.every(item=>item.phase!=="APPLIED"),"LOCAL_RECONCILIATION_UNSAFE","Standard Physical Journey must never record Candidate C Apply.");
  return {issues,facts:{managerRole:evidence.managerRole,remoteRole:evidence.remoteRole,accountFingerprint:evidence.accountFingerprint,deviceFingerprint:evidence.deviceFingerprint,rivalryFingerprint:evidence.rivalryFingerprint,sessionFingerprints:new Set(sessionFingerprints),deviceLabel,networkLabel,signature}};
}

export function validatePhysicalJourneyPair(first,second,options={}){
  const expectedAppVersion=String(options.expectedAppVersion||"1.9.1"),expectedRuntimeRevision=String(options.expectedRuntimeRevision||"1.9.1-r19");
  const left=validateSingle(first,"first export",{expectedAppVersion,expectedRuntimeRevision}),right=validateSingle(second,"second export",{expectedAppVersion,expectedRuntimeRevision}),issues=[...left.issues,...right.issues],a=left.facts,b=right.facts;
  const pair=(condition,code,message)=>{if(!condition)issues.push(issue("pair",code,message));};
  pair(a.managerRole&&b.managerRole&&a.managerRole!==b.managerRole&&new Set([a.managerRole,b.managerRole]).size===2,"MANAGER_ROLES_NOT_OPPOSITE","The exports must represent playerOne and playerTwo.");
  pair(a.remoteRole&&b.remoteRole&&a.remoteRole!==b.remoteRole,"REMOTE_ROLES_NOT_OPPOSITE","The exports must represent host and peer sides.");
  pair(a.accountFingerprint&&b.accountFingerprint&&a.accountFingerprint!==b.accountFingerprint,"ACCOUNT_NOT_DISTINCT","The two managers must use distinct account fingerprints.");
  pair(a.deviceFingerprint&&b.deviceFingerprint&&a.deviceFingerprint!==b.deviceFingerprint,"DEVICE_NOT_DISTINCT","The two managers must use distinct registered-device fingerprints.");
  pair(a.rivalryFingerprint&&a.rivalryFingerprint===b.rivalryFingerprint,"RIVALRY_MISMATCH","Both exports must belong to the same private rivalry.");
  const sharedSessions=a.sessionFingerprints&&b.sessionFingerprints?[...a.sessionFingerprints].filter(value=>b.sessionFingerprints.has(value)):[];pair(sharedSessions.length>0,"SESSION_CORRELATION_MISSING","The two devices must share at least one sanitized private-session fingerprint.");
  pair(a.signature&&b.signature&&a.signature!==b.signature,"PHYSICAL_DEVICE_FACTS_NOT_DISTINCT","Browser device facts must differ across the physical pair.");
  pair(a.deviceLabel&&b.deviceLabel&&a.deviceLabel.toLowerCase()!==b.deviceLabel.toLowerCase(),"DEVICE_LABELS_NOT_DISTINCT","Device labels must identify two different physical devices.");
  pair(a.networkLabel&&b.networkLabel&&a.networkLabel.toLowerCase()!==b.networkLabel.toLowerCase(),"NETWORK_LABELS_NOT_DISTINCT","Network labels must identify two independent networks.");
  return Object.freeze({schema:RESULT_SCHEMA,valid:issues.length===0,expectedAppVersion,expectedRuntimeRevision,issues,summary:{managerRoles:[a.managerRole,b.managerRole],remoteRoles:[a.remoteRole,b.remoteRole],sharedSessionFingerprints:sharedSessions.length,distinctDevices:Boolean(a.deviceFingerprint&&b.deviceFingerprint&&a.deviceFingerprint!==b.deviceFingerprint),sameRivalry:Boolean(a.rivalryFingerprint&&a.rivalryFingerprint===b.rivalryFingerprint)}});
}

function readJson(file){return JSON.parse(fs.readFileSync(path.resolve(file),"utf8"));}
const self=fileURLToPath(import.meta.url);
if(process.argv[1]&&path.resolve(process.argv[1])===self){
  const [firstPath,secondPath]=process.argv.slice(2);if(!firstPath||!secondPath){console.error("Usage: node scripts/validate-ssjr-physical-journey-evidence.mjs <player-one.json> <player-two.json>");process.exit(2);}const result=validatePhysicalJourneyPair(readJson(firstPath),readJson(secondPath));console.log(JSON.stringify(result,null,2));if(!result.valid)process.exit(1);
}

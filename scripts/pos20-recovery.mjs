import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const operatingSystem='POS20';
export const continuityStates=Object.freeze(['READY','STALE','BLOCKED']);
export const candidateValidationStates=Object.freeze(['NOT_PUBLISHED','PENDING','FAILED','GREEN']);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const shaPattern=/^[a-f0-9]{40}$/;
function ensure(ok,msg){if(!ok)throw new Error(msg);}
const retiredRegistry=JSON.parse(fs.readFileSync(path.join(root,'POS20_RETIRED_CONCEPTS.json'),'utf8'));
ensure(retiredRegistry?.operatingSystem==='POS20'&&Array.isArray(retiredRegistry.forbiddenStateFields),'Invalid POS20 retired-concepts registry');
export const forbiddenStateFields=Object.freeze([...retiredRegistry.forbiddenStateFields]);
const forbiddenStateFieldSet=new Set(forbiddenStateFields);
const currentStateFields=['operatingSystem','objective','continuityState','liveFactsMustBeResolved','observedHeads','candidateBranch','recoveryBranch','cognitiveDecision','selectedAction','evidenceDebt','exactBlocker','nextVerification'];
function rejectForbiddenStateFields(value,trail='state'){
  if(Array.isArray(value)){value.forEach((child,index)=>rejectForbiddenStateFields(child,`${trail}[${index}]`));return;}
  if(!value||typeof value!=='object')return;
  for(const [key,child] of Object.entries(value)){
    ensure(!forbiddenStateFieldSet.has(key),`Retired state field forbidden: ${trail}.${key}`);
    rejectForbiddenStateFields(child,`${trail}.${key}`);
  }
}
export function validateCurrentState(s){
  ensure(s&&typeof s==='object'&&!Array.isArray(s),'POS20 current state must be an object');
  rejectForbiddenStateFields(s);
  for(const key of Object.keys(s))ensure(currentStateFields.includes(key),`Unknown current-state field: ${key}`);
  for(const k of currentStateFields)ensure(Object.hasOwn(s,k),`Missing current-state field: ${k}`);
  ensure(s.operatingSystem==='POS20','Current state must declare POS20');
  ensure(continuityStates.includes(s.continuityState),'Invalid continuity state');
  ensure(s.liveFactsMustBeResolved===true,'Live facts must always be re-resolved');
  ensure(typeof s.objective==='string'&&s.objective.trim(),'Objective required');
  ensure(typeof s.candidateBranch==='string'&&s.candidateBranch.startsWith('ops/'),'POS20 candidate branch required');
  ensure(typeof s.recoveryBranch==='string'&&s.recoveryBranch.startsWith('recovery/'),'POS20 recovery branch required');
  ensure(s.candidateBranch!==s.recoveryBranch,'Candidate and recovery branches must differ');
  ensure(s.observedHeads&&['main','candidate','recovery'].every(k=>shaPattern.test(s.observedHeads[k]||'')),'Exact observed heads required');
  ensure(s.evidenceDebt&&Number.isInteger(s.evidenceDebt.count)&&s.evidenceDebt.count>=0,'Evidence debt count required');
  for(const k of ['cognitiveDecision','selectedAction','exactBlocker','nextVerification'])ensure(typeof s[k]==='string'&&s[k].trim(),`${k} required`);
  const serialized=JSON.stringify(s);
  ensure(!/handoff proximity/i.test(serialized),'Handoff proximity is retired and forbidden');
  ensure(!/password|bearer\s|private key|raw[-_ ]?token/i.test(serialized),'Private credential material forbidden');
  return s;
}
function validateContinuityInput(input){
  ensure(input&&typeof input==='object'&&!Array.isArray(input),'Continuity input must be an object');
  ensure(continuityStates.includes(input.continuityState),'Invalid continuity state');
  for(const k of ['ownerRequestsTransfer','liveAuthorityResolved','durableCheckpoint','headsMatchExpectation','recoveryDescendsFromCandidate'])ensure(typeof input[k]==='boolean',`${k} must be boolean`);
  for(const k of ['openAtomicUnits','unpublishedPackets'])ensure(Number.isInteger(input[k])&&input[k]>=0,`${k} must be a nonnegative integer`);
  ensure(candidateValidationStates.includes(input.candidateValidation),'Invalid candidate validation state');
  return input;
}
export function assessContinuity(input){
  validateContinuityInput(input);
  const r=(continuityState,action,decision,reason)=>({operatingSystem,continuityState,action,decision,reason});
  if(input.ownerRequestsTransfer)return r(input.continuityState,'CHECKPOINT_AND_TRANSFER','TRANSITION','Owner requested transfer.');
  if(!input.liveAuthorityResolved)return r('BLOCKED','RESOLVE_LIVE_AUTHORITY','TRANSITION','Live authority is unresolved.');
  if(input.continuityState!=='READY'||!input.durableCheckpoint)return r(input.continuityState==='READY'?'BLOCKED':input.continuityState,'REFRESH_RECOVERY','TRANSITION','Current durable checkpoint required.');
  if(!input.headsMatchExpectation||!input.recoveryDescendsFromCandidate)return r('BLOCKED','RECONCILE_HEADS','TRANSITION','Git transaction state drifted.');
  if(input.openAtomicUnits>1||input.unpublishedPackets>1)return r('BLOCKED','RECONCILE_WORK_UNIT','TRANSITION','Bounded work-unit invariant violated.');
  if(input.candidateValidation==='PENDING')return r('READY','WAIT_VALIDATION','CONTINUE','Candidate is frozen while exact-head validation runs.');
  if(input.candidateValidation==='FAILED')return r('READY','INSPECT_EXACT_FAILURES','CONTINUE','Inspect the current exact-head failure census.');
  if(input.candidateValidation==='GREEN')return r('READY','RECHECK_REVIEWS','CONTINUE','Re-resolve review state before protected merge.');
  return r('READY','EXECUTE_SELECTED_ACTION','CONTINUE','Current checkpoint and live transaction permit bounded work.');
}
function parseJson(text,label){try{return JSON.parse(text);}catch{throw new Error(`Invalid GitHub response for ${label}`);}}
function gh(...args){return execFileSync('gh',args,{encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:16*1024*1024}).trim();}
function defaultRest(endpoint){return parseJson(gh('api',endpoint,'-H','Accept: application/vnd.github+json'),endpoint);}
export const liveRecoveryGitHubClient=Object.freeze({rest:defaultRest});
function exactSha(value,label){ensure(shaPattern.test(value||''),`${label} must be an exact commit SHA`);return value;}
function splitRepo(repository){ensure(/^[^/\s]+\/[^/\s]+$/.test(repository||''),'repository must be owner/name');return repository;}
function refEndpoint(repository,ref){return `repos/${repository}/git/ref/heads/${encodeURIComponent(ref)}`;}
function refSha(client,repository,ref){const data=client.rest(refEndpoint(repository,ref));return exactSha(data?.object?.sha,`live ${ref}`);}
function validateLiveContinuityConfig(input){
  validateContinuityInput(input);
  splitRepo(input.repository);
  for(const key of ['expectedMainHead','expectedCandidateHead','expectedRecoveryHead','checkpointHead'])exactSha(input[key],key);
  return input;
}
export function resolveLiveContinuity(input,authorityState,client=liveRecoveryGitHubClient){
  validateLiveContinuityConfig(input);
  const authority=validateCurrentState(authorityState);
  const repository=input.repository;
  const mainHead=refSha(client,repository,'main');
  const candidateHead=refSha(client,repository,authority.candidateBranch);
  const recoveryHead=refSha(client,repository,authority.recoveryBranch);
  const comparison=client.rest(`repos/${repository}/compare/${candidateHead}...${recoveryHead}`);
  const recoveryDescendsFromCandidate=comparison?.merge_base_commit?.sha===candidateHead&&['ahead','identical'].includes(comparison?.status);
  const headsMatchExpectation=mainHead===input.expectedMainHead&&candidateHead===input.expectedCandidateHead&&recoveryHead===input.expectedRecoveryHead;
  const durableCheckpoint=input.checkpointHead===recoveryHead;
  const computed={continuityState:input.continuityState,ownerRequestsTransfer:input.ownerRequestsTransfer,liveAuthorityResolved:true,durableCheckpoint,headsMatchExpectation,recoveryDescendsFromCandidate,openAtomicUnits:input.openAtomicUnits,unpublishedPackets:input.unpublishedPackets,candidateValidation:input.candidateValidation};
  const decision=assessContinuity(computed);
  return {...decision,live:{repository,mainHead,candidateHead,recoveryHead,candidateBranch:authority.candidateBranch,recoveryBranch:authority.recoveryBranch,durableCheckpoint,headsMatchExpectation,recoveryDescendsFromCandidate}};
}

if(process.argv[1]&&process.argv[1].endsWith('pos20-recovery.mjs')){
  const [command,file]=process.argv.slice(2);
  try{
    if(command==='state'&&file)console.log(JSON.stringify(validateCurrentState(JSON.parse(fs.readFileSync(file,'utf8'))),null,2));
    else if(command==='assess'&&file){
      const input=JSON.parse(fs.readFileSync(file,'utf8'));
      const authority=JSON.parse(fs.readFileSync(path.join(root,'POS20_CURRENT_STATE.json'),'utf8'));
      console.log(JSON.stringify(resolveLiveContinuity(input,authority),null,2));
    }else throw new Error('Usage: pos20-recovery.mjs state STATE.json | assess CONTINUITY.json');
  }catch(e){console.error(e.message);process.exitCode=1;}
}

export const operatingSystem='POS20';
export const continuityStates=Object.freeze(['READY','STALE','BLOCKED']);
function ensure(ok,msg){if(!ok)throw new Error(msg);}
export function validateCurrentState(s){
  ensure(s&&typeof s==='object'&&!Array.isArray(s),'POS20 current state must be an object');
  const required=['operatingSystem','objective','continuityState','liveFactsMustBeResolved','observedHeads','candidateBranch','recoveryBranch','cognitiveDecision','selectedAction','evidenceDebt','exactBlocker','nextVerification'];
  for(const k of required)ensure(Object.hasOwn(s,k),`Missing current-state field: ${k}`);
  ensure(s.operatingSystem==='POS20','Current state must declare POS20');
  ensure(continuityStates.includes(s.continuityState),'Invalid continuity state');
  ensure(s.liveFactsMustBeResolved===true,'Live facts must always be re-resolved');
  ensure(typeof s.objective==='string'&&s.objective.trim(),'Objective required');
  ensure(typeof s.candidateBranch==='string'&&s.candidateBranch.startsWith('ops/'),'POS20 candidate branch required');
  ensure(typeof s.recoveryBranch==='string'&&s.recoveryBranch.startsWith('recovery/'),'POS20 recovery branch required');
  ensure(s.candidateBranch!==s.recoveryBranch,'Candidate and recovery branches must differ');
  ensure(s.observedHeads&&['main','candidate','recovery'].every(k=>/^[a-f0-9]{40}$/.test(s.observedHeads[k]||'')),'Exact observed heads required');
  ensure(s.evidenceDebt&&Number.isInteger(s.evidenceDebt.count)&&s.evidenceDebt.count>=0,'Evidence debt count required');
  for(const k of ['cognitiveDecision','selectedAction','exactBlocker','nextVerification'])ensure(typeof s[k]==='string'&&s[k].trim(),`${k} required`);
  const serialized=JSON.stringify(s);
  ensure(!/handoff proximity/i.test(serialized),'Handoff proximity is retired and forbidden');
  ensure(!/password|bearer\s|private key|raw[-_ ]?token/i.test(serialized),'Private credential material forbidden');
  return s;
}
export function assessContinuity(input){
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

if(process.argv[1]&&process.argv[1].endsWith('pos20-recovery.mjs')){
  const fs=await import('node:fs');
  const [command,file]=process.argv.slice(2);
  try{if(command==='state'&&file)console.log(JSON.stringify(validateCurrentState(JSON.parse(fs.readFileSync(file,'utf8'))),null,2));else if(command==='assess'&&file)console.log(JSON.stringify(assessContinuity(JSON.parse(fs.readFileSync(file,'utf8'))),null,2));else throw new Error('Usage: pos20-recovery.mjs state STATE.json | assess CONTINUITY.json');}catch(e){console.error(e.message);process.exitCode=1;}
}

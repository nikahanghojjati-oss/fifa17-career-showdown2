import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const model='TX-8';
export const shadowModel='SRB-8';
export const blockMarker='POS8_RECOVERY_V1';
export const maxRecoveryBlockBytes=4096;
export const forbiddenRecoveryKey=/password|token|secret|rawcapability|accountid|deviceid|rivalryid|sessionid|pairingcode|fullsavepayload/i;

export function emptyState(){
  return {
    intentDurable:false,
    candidateHead:'',
    intentCandidateHead:'',
    recoveryHead:'',
    recoveryDescendsFromCandidate:true,
    candidateMovedSinceIntent:false,
    openAtomicUnits:0,
    localUnpublishedPackets:0,
    mutationPlanned:false,
    atomicReady:false,
    targetedValidationGreen:false,
    candidatePublished:false,
    exactHeadSealGreen:false,
    merged:false,
    platformWarning:false,
    severeContextDamage:false,
    liveAuthorityUnavailable:false
  };
}

function assertShaOrEmpty(value,name){
  if(value!==''&&!/^[0-9a-f]{40}$/i.test(value))throw new Error(`${name} must be empty or a 40-character Git SHA.`);
}

export function validateState(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('TX-8 state object required.');
  const s={...emptyState(),...input};
  for(const name of ['intentDurable','recoveryDescendsFromCandidate','candidateMovedSinceIntent','mutationPlanned','atomicReady','targetedValidationGreen','candidatePublished','exactHeadSealGreen','merged','platformWarning','severeContextDamage','liveAuthorityUnavailable']){
    if(typeof s[name]!=='boolean')throw new Error(`${name} must be boolean.`);
  }
  for(const name of ['openAtomicUnits','localUnpublishedPackets']){
    if(!Number.isInteger(s[name])||s[name]<0)throw new Error(`${name} must be a non-negative integer.`);
  }
  for(const name of ['candidateHead','intentCandidateHead','recoveryHead'])assertShaOrEmpty(s[name],name);
  if(s.intentDurable&&!s.intentCandidateHead)throw new Error('intentCandidateHead is required once intent is durable.');
  return s;
}

export function assessRecovery(input){
  const s=validateState(input);
  const shadowAhead=Boolean(s.recoveryHead&&s.candidateHead&&s.recoveryHead!==s.candidateHead);
  const reasons=[];

  if(s.merged)return {model,action:'MERGED',shadowAhead,reasons:['pull request already merged'],recoverable:true};
  if(s.openAtomicUnits>1||s.localUnpublishedPackets>1){
    reasons.push('crash-loss budget exceeded: more than one atomic unit or local packet is volatile');
    return {model,action:'HALT_AND_CHECKPOINT',shadowAhead,reasons,recoverable:Boolean(s.recoveryHead)};
  }
  if(s.candidateMovedSinceIntent||!s.recoveryDescendsFromCandidate){
    reasons.push('candidate/recovery ancestry changed after write-ahead intent');
    return {model,action:'RECONCILE_HEADS',shadowAhead,reasons,recoverable:Boolean(s.recoveryHead)};
  }
  if(s.liveAuthorityUnavailable){
    reasons.push('required live authority is unavailable');
    return {model,action:s.localUnpublishedPackets?'CHECKPOINT_SHADOW_THEN_TRANSITION':'TRANSITION_NOW_RECOVERABLE',shadowAhead,reasons,recoverable:Boolean(s.recoveryHead)};
  }
  if(s.platformWarning||s.severeContextDamage){
    reasons.push(s.platformWarning?'owner/platform warning reported':'severe observable context damage');
    return {model,action:s.localUnpublishedPackets?'CHECKPOINT_SHADOW_THEN_TRANSITION':'TRANSITION_NOW_RECOVERABLE',shadowAhead,reasons,recoverable:Boolean(s.recoveryHead)};
  }
  if(!s.intentDurable)return {model,action:'RECORD_INTENT',shadowAhead:false,reasons:['write-ahead intent is not durable'],recoverable:Boolean(s.candidateHead)};
  if(s.exactHeadSealGreen&&s.candidatePublished)return {model,action:'MERGE_READY',shadowAhead,reasons:['exact published candidate is green'],recoverable:true};
  if(s.candidatePublished)return {model,action:'WAIT_EXACT_HEAD_SEAL',shadowAhead,reasons:['candidate published; do not mutate while exact-head proof is pending'],recoverable:true};
  if(shadowAhead){
    if(s.atomicReady&&s.targetedValidationGreen)return {model,action:'PROMOTE_CANDIDATE',shadowAhead:true,reasons:['shadow head is durable and atomic unit passed targeted validation'],recoverable:true};
    return {model,action:'CONTINUE_SHADOW',shadowAhead:true,reasons:['work is durable on the shadow branch but is not yet a candidate'],recoverable:true};
  }
  if(s.mutationPlanned)return {model,action:'WRITE_SHADOW',shadowAhead:false,reasons:['intent is durable; begin or continue work only on the shadow branch'],recoverable:true};
  return {model,action:'IDLE_SAFE',shadowAhead:false,reasons:['candidate and recovery heads are aligned with no pending mutation'],recoverable:true};
}

function walk(value,pathParts=[]){
  if(Array.isArray(value)){for(let i=0;i<value.length;i++)walk(value[i],[...pathParts,String(i)]);return;}
  if(!value||typeof value!=='object')return;
  for(const [key,child] of Object.entries(value)){
    if(forbiddenRecoveryKey.test(key))throw new Error(`Recovery metadata may not contain sensitive key: ${[...pathParts,key].join('.')}`);
    walk(child,[...pathParts,key]);
  }
}

export function buildRecoveryBlock(snapshot){
  if(!snapshot||typeof snapshot!=='object'||Array.isArray(snapshot))throw new Error('Recovery snapshot object required.');
  walk(snapshot);
  const json=JSON.stringify(snapshot);
  const block=`<!-- ${blockMarker}\n${json}\n${blockMarker} -->`;
  if(Buffer.byteLength(block,'utf8')>maxRecoveryBlockBytes)throw new Error(`Recovery block exceeds ${maxRecoveryBlockBytes} bytes.`);
  return block;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const args=process.argv.slice(2);
    let state=emptyState();
    let snapshot=null;
    let json=false;
    let block=false;
    for(let i=0;i<args.length;i++){
      if(args[i]==='--state-json'&&args[i+1])state={...state,...JSON.parse(args[++i])};
      else if(args[i]==='--state-file'&&args[i+1])state={...state,...JSON.parse(fs.readFileSync(path.resolve(args[++i]),'utf8'))};
      else if(args[i]==='--snapshot-json'&&args[i+1])snapshot=JSON.parse(args[++i]);
      else if(args[i]==='--snapshot-file'&&args[i+1])snapshot=JSON.parse(fs.readFileSync(path.resolve(args[++i]),'utf8'));
      else if(args[i]==='--json')json=true;
      else if(args[i]==='--block')block=true;
      else throw new Error(`Unknown argument: ${args[i]}`);
    }
    if(block){process.stdout.write(`${buildRecoveryBlock(snapshot??state)}\n`);}
    else {
      const result=assessRecovery(state);
      process.stdout.write(json?`${JSON.stringify(result,null,2)}\n`:`Crash shield: ${result.action}\n${result.reasons.join('; ')||'safe'}\n`);
    }
  }catch(error){process.stderr.write(`${error.message}\n`);process.exitCode=1;}
}

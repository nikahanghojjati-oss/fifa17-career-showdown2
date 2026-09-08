import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {assessRecovery,checkPackage,checkLiveFacts,git,filingVersion,operatingSystem} from './pos10-recovery.mjs';
import {routeFiles} from './pos10-impact-router.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function ensure(ok,message){if(!ok)throw new Error(message);}
function fields(value,keys,label){
  ensure(value && typeof value==='object' && !Array.isArray(value),`${label}: object required`);
  for(const key of Object.keys(value))ensure(keys.includes(key),`${label}: unknown field ${key}`);
}
export function requiredChecks(route){
  return ['POS10 exact selector',...(route.operations?['POS10 operations authority']:[]),...(route.tests.length?['POS10 selected deterministic census']:[]),...route.proofGroups.map(group=>`POS10 proof ${group}`),'POS10 exact-head seal'];
}
export function evaluatePublication(input,route){
  fields(input,['action','liveState','request','targetedValidation','checkRuns','reviews'],'publication');
  fields(input.request,['expectedHead','targetHead','force'],'request');
  ensure(['PROMOTE','MERGE'].includes(input.action),'Unknown publication action');
  ensure(input.request.force===false,'Forced ref movement forbidden');
  const state=input.liveState;
  const recovery=assessRecovery(state);
  ensure(recovery.decision==='CONTINUE',recovery.reason);
  ensure(input.request.expectedHead===state.candidateHead && state.candidateHead===state.expectedCandidateHead,'Expected-head protection required');
  if(input.action==='PROMOTE'){
    fields(input.targetedValidation,['head','sourceFingerprint','passed'],'targetedValidation');
    ensure(recovery.action==='PROMOTE_ONCE_NONFORCED','Candidate promotion is not currently allowed');
    ensure(input.request.targetHead===state.recoveryHead && input.targetedValidation.head===state.recoveryHead && input.targetedValidation.passed===true,'Targeted proof must pass on the exact durable recovery head');
    ensure(/^[a-f0-9]{64}$/.test(input.targetedValidation.sourceFingerprint),'Targeted source fingerprint required');
    return {operatingSystem,filingVersion,allowed:true,action:'PROMOTE',expectedHead:state.candidateHead,targetHead:state.recoveryHead,force:false};
  }
  ensure(recovery.action==='RECHECK_REVIEWS_AND_MERGE_EXPECTED_HEAD','Exact-head candidate validation must be green before merge');
  ensure(input.request.targetHead===state.candidateHead,'Merge target must equal the exact candidate');
  ensure(Array.isArray(input.checkRuns) && input.checkRuns.length>0,'Exact-head check evidence required');
  const seen=new Set();
  for(const check of input.checkRuns){
    fields(check,['name','head','status','conclusion'],'check');
    ensure(check.head===state.candidateHead,'Check evidence from another head is forbidden');
    ensure(!seen.has(check.name),'Select one current workflow attempt; ambiguous duplicate check evidence');seen.add(check.name);
    ensure(check.status==='completed' && check.conclusion==='success','Every supplied required check must pass');
  }
  for(const name of requiredChecks(route))ensure(seen.has(name),`Required exact-head check missing: ${name}`);
  fields(input.reviews,['head','observedAt','changeRequests','unresolvedThreads','commentsReviewed'],'reviews');
  const reviews=input.reviews;
  ensure(reviews.head===state.candidateHead && typeof reviews.observedAt==='string' && Number.isFinite(Date.parse(reviews.observedAt)),'Reviews must be freshly re-resolved for the exact candidate');
  ensure(reviews.changeRequests===0 && reviews.unresolvedThreads===0 && reviews.commentsReviewed===true,'Resolve material review/comment concerns before merge');
  return {operatingSystem,filingVersion,allowed:true,action:'MERGE',expected_head_sha:state.candidateHead,requiredChecks:requiredChecks(route)};
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    ensure(process.argv.length===3,'Usage: pos10-publication.mjs EVIDENCE.json');
    const input=JSON.parse(fs.readFileSync(path.resolve(process.argv[2]),'utf8'));
    const packet=checkPackage(root);
    ensure(packet.recoveryState==='RECOVERY_READY',packet.reason);
    const manifest=packet.manifest;
    const branches=['main',manifest.candidateBranch,manifest.recoveryBranch];
    const output=git(root,['ls-remote','origin',...branches.map(b=>`refs/heads/${b}`)]);
    const refs=Object.fromEntries(output.split('\n').map(line=>{const [head,ref]=line.split(/\s+/);return [ref,head];}));
    const main=refs['refs/heads/main'],candidate=refs[`refs/heads/${manifest.candidateBranch}`],recovery=refs[`refs/heads/${manifest.recoveryBranch}`];
    ensure(main && candidate && recovery,'Required live refs unavailable');
    ensure(checkLiveFacts(packet,{main,candidate}).recoveryState==='RECOVERY_READY','Live transaction facts changed; refresh recovery before publication');
    ensure(input.liveState.candidateHead===candidate && input.liveState.recoveryHead===recovery,'Live heads moved; reconcile before publication');
    ensure(input.liveState.recoveryBranches.length===1 && input.liveState.recoveryBranches[0]===manifest.recoveryBranch,'The indexed recovery branch is the only active recovery locator');
    ensure(git(root,['merge-base',candidate,recovery])===candidate,'Recovery must descend from unchanged candidate');
    ensure(git(root,['status','--porcelain'])==='','Publication requires a clean durable checkout');
    const target=input.action==='MERGE'?candidate:recovery;
    if(input.action==='PROMOTE')ensure(git(root,['rev-parse','HEAD'])===target,'Local targeted-validation checkout must equal the exact recovery target');
    else {
      const localChanges=git(root,['diff','--name-only',candidate,'HEAD']).split('\n').filter(Boolean);
      ensure(localChanges.every(file=>file==='POS10_CURRENT_FILE_INDEX.json'||file.startsWith('pos10-recovery/')),'Merge checkout differs from candidate beyond recovery metadata');
    }
    ensure(git(root,['merge-base',main,target])===main,'Main advanced outside this candidate; reconcile and validate before publication');
    if(input.action==='PROMOTE')ensure(input.targetedValidation.sourceFingerprint===manifest.sourceFingerprint,'Targeted proof source differs from current checkpoint');
    const changed=git(root,['diff','--name-only',main,target]).split('\n').filter(Boolean);
    const route=routeFiles(changed);
    const decision=evaluatePublication({...input,liveState:{...input.liveState,recoveryState:packet.recoveryState}},route);
    // Apply the returned request through the authenticated connector. This command does not
    // silently mutate a ref or infer that a merge happened from a successful preflight.
    console.log(JSON.stringify(decision,null,2));
  }catch(error){console.error(error.message);process.exitCode=1;}
}

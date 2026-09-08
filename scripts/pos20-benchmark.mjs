import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {decide} from './pos20-cognitive-controller.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const spec=JSON.parse(fs.readFileSync(path.join(root,'POS20_COGNITIVE_BENCHMARK.json'),'utf8'));
const fpA='evidence-a';const fpB='evidence-b';
const baseState=()=>({objective:'Advance the highest-value safe product dependency',evidenceFingerprint:fpA,liveAuthorityResolved:true,headsMatchExpectation:true,processAuthoritySufficient:false,ownerRequestsTransfer:false,reviewsClean:false,recoveryState:'RECOVERY_READY',candidateValidation:'NOT_PUBLISHED',ownerPriorityActionId:null,hypothesisHistory:[]});
const action=(id,overrides={})=>({id,productProgressPotential:.4,blockerReduction:.4,evidenceGain:.4,riskReduction:.4,automationLeverage:.4,informationGain:.4,proofCost:.2,ownerInteractionCost:.1,uncertainty:.2,...overrides});
function fixture(test){
  const s=baseState();const actions=[];
  if(test.ownerPriority)s.ownerPriorityActionId=test.ownerPriority;
  if(test.processSufficient)s.processAuthoritySufficient=true;
  if(test.validation)s.candidateValidation=test.validation;
  if(test.reviewsClean!==undefined)s.reviewsClean=test.reviewsClean;
  if(test.headsMatch===false)s.headsMatchExpectation=false;
  if(test.recovery)s.recoveryState=test.recovery;
  if(test.liveAuthority===false)s.liveAuthorityResolved=false;
  if(test.ownerTransfer)s.ownerRequestsTransfer=true;
  if(test.failedTwice){s.hypothesisHistory=[{hypothesisId:'h1',outcome:'failed',evidenceFingerprint:fpA},{hypothesisId:'h1',outcome:'failed',evidenceFingerprint:fpA}];if(test.newEvidence)s.evidenceFingerprint=fpB;}
  switch(test.id){
    case 'owner-product-priority':actions.push(action('PROCESS_POLISH',{processOnly:true,productProgressPotential:0}),action('BUILD_PRODUCT',{productProgressPotential:.8}));break;
    case 'billing-unsafe':actions.push(action('UNSAFE_BILLING',{requiresBilling:true,productProgressPotential:1}),action('SAFE_SPARK',{productProgressPotential:.7}));break;
    case 'process-sufficient':actions.push(action('PROCESS_POLISH',{processOnly:true,productProgressPotential:.1}),action('BUILD_PRODUCT',{productProgressPotential:.65}));break;
    case 'automate-evidence':actions.push(action('ASK_OWNER',{ownerInteractionCost:1}),action('AUTOMATE_EVIDENCE',{evidenceGain:1,automationLeverage:1,blockerReduction:.9}));break;
    case 'physical-only':actions.push(action('ASK_OWNER_PHYSICAL',{ownerInteractionCost:.8,evidenceGain:1,blockerReduction:1,productProgressPotential:.6}),action('SIMULATE',{fabricatesProductCredit:true}));break;
    case 'anti-loop':actions.push(action('RETRY_SAME',{hypothesisId:'h1',productProgressPotential:.9}),action('REFRAME_HYPOTHESIS',{informationGain:1,blockerReduction:.7}));break;
    case 'new-evidence-reopens':actions.push(action('RETRY_WITH_NEW_EVIDENCE',{hypothesisId:'h1',evidenceGain:.9,informationGain:.8}),action('REFRAME_HYPOTHESIS',{informationGain:.5}));break;
    case 'fake-credit-rejected':actions.push(action('FAKE_CREDIT',{fabricatesProductCredit:true,productProgressPotential:1}),action('REAL_EVIDENCE',{evidenceGain:1,productProgressPotential:.5}));break;
    case 'unlock-value':actions.push(action('LOW_UNLOCK',{blockerReduction:.1,productProgressPotential:.7}),action('HIGH_UNLOCK',{blockerReduction:1,productProgressPotential:.8}));break;
    case 'info-gain':actions.push(action('GUESS_FIX',{uncertainty:.8,informationGain:.1}),action('DIAGNOSTIC',{informationGain:1,evidenceGain:.9,blockerReduction:.6}));break;
    case 'risk-reduction':actions.push(action('FAST_RISKY',{productProgressPotential:.9,riskReduction:0,uncertainty:.9}),action('SAFE_FIX',{productProgressPotential:.7,riskReduction:1,uncertainty:.1}));break;
    case 'automation-over-manual':actions.push(action('MANUAL',{ownerInteractionCost:.8,automationLeverage:0}),action('AUTOMATE',{automationLeverage:1,ownerInteractionCost:0}));break;
    case 'private-data-safe':actions.push(action('RAW_PRIVATE',{safetyViolation:true,evidenceGain:1}),action('PRIVACY_SAFE',{evidenceGain:.8,riskReduction:1}));break;
    default:actions.push(action('NOOP'));
  }
  return {state:s,actions};
}
export function runBenchmark(){
  if(spec.cases.length!==spec.minimumCases)throw new Error(`Benchmark must contain exactly ${spec.minimumCases} cases.`);
  const results=[];
  for(const test of spec.cases){const {state,actions}=fixture(test);const actual=decide(state,actions).actionId;results.push({id:test.id,expected:test.expected,actual,pass:actual===test.expected});}
  const correct=results.filter(r=>r.pass).length;const score=Math.round(correct/results.length*100);const baseline=Math.round(spec.baselineCorrect/results.length*100);const advantage=score-baseline;
  const pass=correct===spec.requiredPos20Correct&&advantage>=spec.minimumAdvantagePoints;
  return {benchmarkId:spec.benchmarkId,cases:results.length,correct,score,baselineCorrect:spec.baselineCorrect,baselineScore:baseline,advantagePoints:advantage,pass,results};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=runBenchmark();console.log(JSON.stringify(result,null,2));if(!result.pass)process.exitCode=1;
}

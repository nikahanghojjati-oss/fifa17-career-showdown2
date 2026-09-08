import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const operatingSystem = 'POS20';
export const cognitiveModel = 'COGNITIVE-CONTROL-20';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const permanentGuards=Object.freeze(JSON.parse(fs.readFileSync(path.join(root,'CURRENT_PRODUCT_GUARDS.json'),'utf8')));

const clamp = (n,min=0,max=1)=>Math.max(min,Math.min(max,Number.isFinite(Number(n))?Number(n):0));
const HARD_ACTIONS = Object.freeze({TRANSFER:'TRANSFER',RESOLVE_LIVE_AUTHORITY:'RESOLVE_LIVE_AUTHORITY',REFRESH_RECOVERY:'REFRESH_RECOVERY',RECONCILE_HEADS:'RECONCILE_HEADS',WAIT_VALIDATION:'WAIT_VALIDATION',INSPECT_EXACT_FAILURES:'INSPECT_EXACT_FAILURES',MERGE_EXPECTED_HEAD:'MERGE_EXPECTED_HEAD',REFRAME_HYPOTHESIS:'REFRAME_HYPOTHESIS'});
const FORBIDDEN_TRUE_FLAGS=Object.freeze([
  'requiresBilling','requiresCloudBillingAccount','requiresBlaze','requiresCloudRun','requiresCloudFunctions','requiresAppCheckEnforcement','requiresPersistentFirestore','requiresExtraOAuthScopes',
  'requiresUnsharedSaveLibraryAutoUpload','requiresPublicDiscovery','requiresPublicListing','requiresPublicLobby','requiresPublicMatchmaking','requiresCommunity','requiresRankings','requiresGlobalLeaderboards',
  'requiresDurableRawPrivateIdentifiers','requiresTimestampConflictAuthority','requiresDeletedGameplayInTombstones','requiresForbiddenDurableLogs','bypassesPairingAndExactActive','requiresNonCandidateCDestructiveApply',
  'changesCanonicalLocalStorageKeys','violatesDualFullScreenContract','disablesLocalOnlyUse','delaysAccountDeletionRevocation'
]);

function fail(code,message=code){const error=new Error(message);error.code=code;throw error;}
function object(value,label){if(!value||typeof value!=='object'||Array.isArray(value))fail('POS20_INPUT_INVALID',`${label} must be an object.`);return value;}
function bool(value,label){if(typeof value!=='boolean')fail('POS20_INPUT_INVALID',`${label} must be boolean.`);return value;}
function text(value,label){if(typeof value!=='string'||!value.trim())fail('POS20_INPUT_INVALID',`${label} must be nonempty text.`);return value.trim();}
function sameValue(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function compareGuardRequirements(requirements,guards=permanentGuards,prefix=''){
  const violations=[];if(requirements===undefined)return violations;
  if(!requirements||typeof requirements!=='object'||Array.isArray(requirements))return ['guardRequirements must be an object'];
  for(const [key,value] of Object.entries(requirements)){
    const label=prefix?`${prefix}.${key}`:key;
    if(!(key in guards)){violations.push(`Unknown permanent guard requirement: ${label}`);continue;}
    const current=guards[key];
    if(value&&typeof value==='object'&&!Array.isArray(value)&&current&&typeof current==='object'&&!Array.isArray(current))violations.push(...compareGuardRequirements(value,current,label));
    else if(!sameValue(value,current))violations.push(`Permanent guard mismatch: ${label}`);
  }
  return violations;
}
export function permanentGuardViolations(action){
  const violations=[];
  if(action.safetyViolation===true)violations.push('generic safety violation');
  if(action.fabricatesProductCredit===true)violations.push('fabricated product credit');
  for(const flag of FORBIDDEN_TRUE_FLAGS)if(action[flag]===true)violations.push(flag);
  if(action.requiredManagerCount!==undefined&&action.requiredManagerCount!==permanentGuards.product.managerCount)violations.push('requiredManagerCount');
  if(action.managerCount!==undefined&&action.managerCount!==permanentGuards.product.managerCount)violations.push('managerCount');
  if(action.firebasePlan!==undefined&&action.firebasePlan!==permanentGuards.provider.firebasePlan)violations.push('firebasePlan');
  if(action.firestoreBrowserPersistence!==undefined&&action.firestoreBrowserPersistence!==permanentGuards.provider.firestoreBrowserPersistence)violations.push('firestoreBrowserPersistence');
  if(action.googleAuthPersistence!==undefined&&action.googleAuthPersistence!==permanentGuards.provider.googleAuthPersistence)violations.push('googleAuthPersistence');
  if(action.productionRulesSource!==undefined&&action.productionRulesSource!==permanentGuards.provider.productionRulesSource)violations.push('productionRulesSource');
  violations.push(...compareGuardRequirements(action.guardRequirements));
  return violations;
}
function historyFor(state,hypothesisId){return (state.hypothesisHistory||[]).filter(item=>item&&item.hypothesisId===hypothesisId);}
function repeatedWithoutNewEvidence(state,action){if(!action.hypothesisId)return false;const history=historyFor(state,action.hypothesisId).filter(item=>item.outcome==='failed');if(history.length<2)return false;const lastTwo=history.slice(-2);return lastTwo.every(item=>item.evidenceFingerprint===state.evidenceFingerprint);}
function ownerPriorityBoost(state,action){const priority=state.ownerPriorityActionId;return priority&&priority===action.id?40:0;}
function actionScore(state,action){const product=clamp(action.productProgressPotential);const blocker=clamp(action.blockerReduction);const evidence=clamp(action.evidenceGain);const risk=clamp(action.riskReduction);const automation=clamp(action.automationLeverage);const info=clamp(action.informationGain);const proofCost=clamp(action.proofCost);const ownerCost=clamp(action.ownerInteractionCost);const uncertainty=clamp(action.uncertainty);const processPenalty=state.processAuthoritySufficient&&action.processOnly?35:0;return Math.round((product*32+blocker*24+evidence*18+risk*14+automation*8+info*12+ownerPriorityBoost(state,action)-proofCost*8-ownerCost*12-uncertainty*5-processPenalty)*100)/100;}
function safeAction(action){return permanentGuardViolations(action).length===0;}
function explain(action,score){return `${action.id} selected by expected safe product utility (${score}).`;}

export function validateState(input){const state=object(input,'state');text(state.objective,'objective');text(state.evidenceFingerprint,'evidenceFingerprint');bool(state.liveAuthorityResolved,'liveAuthorityResolved');bool(state.headsMatchExpectation,'headsMatchExpectation');bool(state.processAuthoritySufficient,'processAuthoritySufficient');bool(state.ownerRequestsTransfer,'ownerRequestsTransfer');bool(state.reviewsClean,'reviewsClean');if(!['RECOVERY_READY','RECOVERY_STALE','RECOVERY_BLOCKED'].includes(state.recoveryState))fail('POS20_INPUT_INVALID','Unknown recoveryState.');if(!['NOT_PUBLISHED','PENDING','FAILED','GREEN'].includes(state.candidateValidation))fail('POS20_INPUT_INVALID','Unknown candidateValidation.');if(state.hypothesisHistory!==undefined&&!Array.isArray(state.hypothesisHistory))fail('POS20_INPUT_INVALID','hypothesisHistory must be an array.');return state;}
export function validateActions(input){if(!Array.isArray(input)||!input.length)fail('POS20_ACTIONS_REQUIRED','At least one action is required.');const ids=new Set();for(const action of input){object(action,'action');text(action.id,'action.id');if(ids.has(action.id))fail('POS20_INPUT_INVALID',`Duplicate action id: ${action.id}`);ids.add(action.id);}return input;}
export function decide(stateInput,actionsInput){const state=validateState(stateInput);const actions=validateActions(actionsInput);const result=(actionId,mode,reason,ranked=[])=>Object.freeze({operatingSystem,cognitiveModel,actionId,mode,reason,ranked});if(state.ownerRequestsTransfer)return result(HARD_ACTIONS.TRANSFER,'HARD_RULE','Explicit owner transfer request.');if(!state.liveAuthorityResolved)return result(HARD_ACTIONS.RESOLVE_LIVE_AUTHORITY,'HARD_RULE','Live authority must be resolved before mutation.');if(state.recoveryState!=='RECOVERY_READY')return result(HARD_ACTIONS.REFRESH_RECOVERY,'HARD_RULE','Durable recovery state is not ready.');if(!state.headsMatchExpectation)return result(HARD_ACTIONS.RECONCILE_HEADS,'HARD_RULE','Observed Git heads differ from the active transaction model.');if(state.candidateValidation==='PENDING')return result(HARD_ACTIONS.WAIT_VALIDATION,'HARD_RULE','Candidate validation is pending; candidate mutation is frozen.');if(state.candidateValidation==='FAILED')return result(HARD_ACTIONS.INSPECT_EXACT_FAILURES,'HARD_RULE','Inspect the coherent failure set from the exact candidate head.');if(state.candidateValidation==='GREEN'&&state.reviewsClean)return result(HARD_ACTIONS.MERGE_EXPECTED_HEAD,'HARD_RULE','Exact candidate is green and review state is clean.');const sameEvidenceLoop=actions.some(action=>safeAction(action)&&repeatedWithoutNewEvidence(state,action));if(sameEvidenceLoop){const reframe=actions.find(action=>action.id===HARD_ACTIONS.REFRAME_HYPOTHESIS&&safeAction(action));if(reframe)return result(reframe.id,'ANTI_LOOP','The same hypothesis failed twice against unchanged evidence; reframe before another correction.');}const ranked=actions.filter(safeAction).filter(action=>!repeatedWithoutNewEvidence(state,action)).map(action=>({id:action.id,score:actionScore(state,action)})).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));if(!ranked.length)fail('POS20_NO_SAFE_ACTION','No safe action remains after permanent guards and evidence-integrity filters.');const chosen=actions.find(action=>action.id===ranked[0].id);return result(chosen.id,'UTILITY',explain(chosen,ranked[0].score),ranked);}
export function evidenceDebt(state){const missing=Array.isArray(state.missingEvidence)?state.missingEvidence:[];return Object.freeze({count:missing.length,blocking:missing.filter(item=>item&&item.blocking===true).length,items:missing.map(item=>item.id||'unknown')});}
if(process.argv[1]&&process.argv[1].endsWith('pos20-cognitive-controller.mjs')){if(process.argv.length!==3){console.error('Usage: pos20-cognitive-controller.mjs PLAN.json');process.exitCode=1;}else{try{const input=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify(decide(input.state,input.actions),null,2));}catch(e){console.error(e.message);process.exitCode=1;}}}

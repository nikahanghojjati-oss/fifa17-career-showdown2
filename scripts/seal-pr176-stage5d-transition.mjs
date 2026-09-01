import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const read = p => fs.readFileSync(p,'utf8');
const write = (p,v) => fs.writeFileSync(p,v.endsWith('\n')?v:`${v}\n`);
const json = p => JSON.parse(read(p));
const writeJson = (p,v) => write(p, JSON.stringify(v,null,2));
const now = new Date().toISOString();
const repo = 'nikahanghojjati-oss/fifa17-career-showdown2';
const main = 'a4489fe7d812144deb3f747019eb162628480dac';
const mergeTree = 'e7083c2cda0e737f9d1c5654ca663df6ddf3408a';
const prHead = '4c1e9be8e0af26e277ed9fd1ae0545ec065173ff';
const rulesBlob = '363af783d7e5436fdfaa3766d4aa413fc9952a08';
const providerBlob = '2b7c0b166ae0aae7ab7a3ce84725b21091262484';
const starter = 'START_NEXT_SESSION_V1.4.35_PR176_STAGE5D_PROVIDER_PENDING.md';
const starterMirror = `project-documents/session-starts/${starter}`;
const handoff = 'SUCCESSOR_HANDOFF_PR176_STAGE5D_PROVIDER_PENDING_SLE_2026-09-01.md';
const handoffMirror = `project-documents/handoffs/${handoff}`;
const env = 'we-2026-09-01-stage5d-minimum-production-session-rules';
const transitionBranch = 'rjr/pr176-stage5d-provider-pending-sle-2026-09-01';
const nextName = 'provider-live-stage5d-rules-publication-then-runtime-host-join';

function prependOnce(path, marker, block){
  const old = read(path);
  if(old.includes(marker)) return;
  write(path, `${block.trim()}\n\n---\n\n${old}`);
}
function upsertNode(graph,id,patch){
  let node = graph.nodes.find(n=>n.id===id);
  if(!node){ node={id}; graph.nodes.push(node); }
  Object.assign(node,patch);
  return node;
}
function replaceRequired(text, from, to, label){
  if(!text.includes(from)) throw new Error(`Missing expected ${label||from}`);
  return text.replace(from,to);
}

// Ensure required mirrored SLE artifacts are byte-identical.
fs.mkdirSync('project-documents/handoffs',{recursive:true});
fs.mkdirSync('project-documents/session-starts',{recursive:true});
fs.copyFileSync(handoff,handoffMirror);
fs.copyFileSync(starter,starterMirror);

const nextOverride = `# CURRENT OVERRIDE — PR #176 STAGE 5D RULES SOURCE MERGED / PROVIDER PUBLICATION PENDING — 2026-09-01 UTC

SLE = Smart Lean Efficient. WEC remains mandatory. This section supersedes lower historical instructions; current source and independently verified live provider evidence win.

PR #176 \`Promote minimum production private-session Rules source\` is merged. Exact reviewed head: \`${prHead}\`. Squash merge/live-main checkpoint: \`${main}\`, tree \`${mergeTree}\`. All 14 exact-head workflow families passed before merge. All 15 normal post-merge/Pages workflow families passed on the merge with zero failures and zero in-progress runs.

Production runtime remains \`v1.8.1 / 1.8.1-r5\`; PR #176 did not load the private-session adapter or expose host/join UX. Repository \`firestore.spark.rules\` is now the reviewed Stage 5D source blob \`${rulesBlob}\`.

Provider truth remains deliberately separate: the last independently Firebase-provider-proven production Rules blob is \`${providerBlob}\`. The new \`${rulesBlob}\` source has NOT yet been independently proven provider-live. Fixed RJR-1 therefore remains \`87/100\`; source promotion, CI, review, merge, Pages and provider-publication mechanics add zero RJR.

The only intended provider mutation is the already-reviewed zero-billing Spark-compatible Rules deployment: \`firebase deploy --only firestore:rules --project fifa17-career-showdown-prod --config firebase.production.rules.json\`. Execute it only from an authenticated Firebase control-plane route, then independently verify provider source identity before updating provider proof/manifest state. If authenticated provider access is unavailable, preserve the blocker honestly. Never fabricate publication.

Billing must never be activated. Firebase remains Spark. Never link Cloud Billing, enable Blaze, add a payment method, activate Cloud Run, buy review credits, or activate any billing-required service. Every nonbilling Remote Joining engineering/provider/deployment decision remains owner-authorized after mandatory gates.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

1. Independently verify current main, PR #176 closure, all 15 post-merge/Pages successes, runtime \`1.8.1-r5\`, repository Rules blob \`${rulesBlob}\`, fixed RJR87 and provider-proven blob \`${providerBlob}\`.
2. Validate/archive closing WEC \`${env}\`, initialize a fresh unique WEC with reset counters, assess it independently and do not inherit this environment's HANDOFF_AT_CHECKPOINT decision.
3. If an authenticated zero-billing Firebase route exists, publish only the exact reviewed Stage 5D Firestore Rules using the command above and independently prove the provider source equals \`${rulesBlob}\`. Keep App Check enforcement OFF and Firestore memory-only.
4. Only after provider-live Rules proof begin the separate runtime host/join UX milestone. Then pursue provider-live two-account host/join, real two-device/two-network reconnect/token/adverse-network evidence and stable release acceptance for genuine RJR movement.
5. Do not repeat consumed pairing, Candidate C, replay, adverse-provider, token-lifecycle, structural-abuse, sustained-rate-limit, rollback, earlier provider-Rules or provider-abuse proof merely for confidence.`;

prependOnce('NEXT_TASK.md','CURRENT OVERRIDE — PR #176 STAGE 5D RULES SOURCE MERGED / PROVIDER PUBLICATION PENDING',nextOverride);
prependOnce('PROJECT_STATE.md','CURRENT OVERRIDE — PR #176 STAGE 5D RULES SOURCE MERGED / PROVIDER PUBLICATION PENDING',nextOverride.replace('# CURRENT OVERRIDE','## CURRENT OVERRIDE'));
prependOnce('00_CURRENT_HANDOFF.md','CURRENT HANDOFF OVERRIDE — PR #176 STAGE 5D PROVIDER PENDING',`# CURRENT HANDOFF OVERRIDE — PR #176 STAGE 5D PROVIDER PENDING / RJR87

Read \`${starter}\` first and \`${handoff}\` for deep reconstruction. PR #176 is merged at \`${main}\`; all 15 post-merge/Pages runs are green. Repository Rules blob is \`${rulesBlob}\`, while last provider-proven Rules remains \`${providerBlob}\`. Runtime is unchanged at \`v1.8.1 / 1.8.1-r5\`. RJR remains 87/100.

Closing WEC \`${env}\` is HANDOFF_AT_CHECKPOINT at complete SLE packaging. A fresh successor must independently verify live GitHub/provider state, validate/archive this WEC, initialize/reset a fresh WEC, and own the provider-live Rules milestone. Runtime host/join remains separate after provider proof.

Billing is permanently forbidden; Firebase remains Spark; App Check enforcement remains OFF; Firestore remains memory-only; the three canonical localStorage keys, Candidate C authority, exactly-two-manager/no-list boundary and protected rivalry remain unchanged.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

Publish and independently verify only the exact reviewed Stage 5D Rules through an authenticated zero-billing Firebase route. If no such route exists, preserve the provider blocker without fabricating evidence or activating billing. After provider proof, begin the separate host/join runtime milestone.`);
prependOnce('00_DEVELOPER_START_HERE.md','CURRENT ENTRYPOINT — PR #176 STAGE 5D PROVIDER PENDING',`# CURRENT ENTRYPOINT — PR #176 STAGE 5D PROVIDER PENDING

Read \`${starter}\` first. Treat it as orientation only; independently verify live GitHub, provider and deployment truth. Fixed RJR remains 87/100 until genuine capability evidence advances it. Billing must never be activated.`);
prependOnce('project-documents/START_NEXT_SESSION.md','CURRENT SLE ENTRYPOINT — v1.4.35',`# CURRENT SLE ENTRYPOINT — v1.4.35

Canonical starter: \`${starter}\`.
Deep SLE handoff: \`${handoff}\`.
Live-main checkpoint: \`${main}\`.
Repository Stage 5D Rules blob: \`${rulesBlob}\`.
Last provider-proven Rules blob: \`${providerBlob}\`.
RJR-1: \`87/100\`.

Provider-live Rules publication is next under permanent zero-billing authority; runtime host/join remains separate afterward.`);

// Refresh bootstrap while preserving historical compatibility fields.
const b = json('SESSION_BOOTSTRAP.json');
b.recordedAt = now;
b.bootstrapBranch = transitionBranch;
b.lastVerifiedMainSha = main;
b.currentPublicationCheckpoint = b.currentPublicationCheckpoint || {};
Object.assign(b.currentPublicationCheckpoint,{
  pullRequest:176,
  title:'Promote minimum production private-session Rules source',
  branch:'rjr/stage5d-minimum-production-session-rules-2026-09-01',
  startingMainSha:'e0445ebf214b9385667187e0e580bba497d8f039',
  exactFinalHead:prHead,
  mergeSha:main,
  mergeTree,
  exactHeadWorkflowFamiliesSuccessful:14,
  postMergeRunsSuccessful:15,
  runtimeChanged:false,
  rjrAfterEvidence:87,
  repositoryProductionRulesSource:'firestore.spark.rules',
  repositoryProductionRulesBlobSha:rulesBlob,
  repositoryProductionRulesSourceMerged:true,
  productionProviderRulesPublicationProven:true,
  productionProviderRulesSource:'firestore.spark.rules',
  productionProviderRulesBlobSha:providerBlob,
  currentRepositoryRulesProviderPublished:false,
  currentRepositoryRulesProviderProven:false,
  providerAccessRouteAvailableInEnvironment:false,
  providerPublicationCommand:'firebase deploy --only firestore:rules --project fifa17-career-showdown-prod --config firebase.production.rules.json',
  stage5CProductionRulesPublished:false,
  stage5CRuntimeLoaded:false,
  stage5CHostJoinUxExposed:false,
  stage5CProviderLivePlayableProven:false,
  billingActivationForbidden:true,
  checkpointStatus:'rjr87-stage5d-production-rules-source-merged-provider-publication-pending'
});
b.currentLane = `PR #176 Stage 5D production Rules source is merged and 15/15 post-merge green at fixed RJR87. Repository firestore.spark.rules is ${rulesBlob}; last provider-proven source remains ${providerBlob}. Fresh successor owns authenticated zero-billing provider publication before separate runtime host/join UX.`;
b.currentWec = {
  environmentId:env,
  startingMainSha:'e0445ebf214b9385667187e0e580bba497d8f039',
  initialDecision:'CONTINUE',
  finalDecision:'HANDOFF_AT_CHECKPOINT',
  decisionInheritedFromPredecessor:false,
  handoffCompleteness:100,
  closingCheckpoint:'PR176 Stage5D reviewed production Rules source merged and all post-merge deployment gates green at fixed RJR87; provider publication of the new source remains unproven and is the fresh successor control-plane milestone'
};
b.currentHandoff = {canonical:handoff,projectMirror:handoffMirror,status:'current-rjr87-pr176-stage5d-provider-pending'};
b.starter = {
  version:'1.4.35',
  checkpoint:'PR176-RJR87-STAGE5D-PROVIDER-PENDING',
  canonical:starter,
  projectMirror:starterMirror,
  ownerInitialDelivery:'short-repository-first-prompt',
  fallbackPackNeededByDefault:false,
  versionReason:'PR #176 merged the reviewed Stage 5D production Rules source and completed all post-merge gates while preserving honest separation from still-unproven Firebase provider publication.'
};
b.successorPackage = {
  ...(b.successorPackage||{}),
  compactStarter:starter,
  fullHandoff:handoff,
  stage5DProviderPendingProof:'STAGE5D_PRODUCTION_RULES_PROVIDER_PENDING_PROOF_2026-09-01.md',
  status:'rjr87-pr176-stage5d-provider-pending-package'
};
b.minimalReads = [
  'SESSION_BOOTSTRAP.json','NEXT_TASK.md','PROJECT_STATE.md','REMOTE_JOINING_READINESS.json','00_DEVELOPER_START_HERE.md','00_CURRENT_HANDOFF.md','WORK_ENVIRONMENT_STATUS.json',
  'STAGE5D_PRODUCTION_RULES_PROVIDER_PENDING_PROOF_2026-09-01.md','STAGE5C_ZERO_BILLING_STANDARD_AUTH_SESSION_ADAPTER_PROOF_2026-09-01.md','PRODUCTION_FIRESTORE_RULES_PROVIDER_PROOF_2026-08-29.md','00_OWNER_ZERO_BILLING_REMOTE_JOINING_AUTHORIZATION.md','ZERO_BILLING_REMOTE_JOINING_ARCHITECTURE_DECISION_2026-08-31.md',starter,handoff,'00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md','00_SLE_HANDOFF_PROTOCOL.md'
];
b.criticalLocks = b.criticalLocks || {};
Object.assign(b.criticalLocks,{
  zeroBilling:true,
  appCheck:'production-proven-enforcement-off',
  firestorePersistence:'memory-only',
  stage5CStandardAuthCandidate:'proven-source-promoted-provider-pending-runtime-not-loaded',
  publicDiscovery:false,publicCommunity:false,publicMatchmaking:false,globalLeaderboardsRankings:false,
  standingMergeDeployAuthorizedAfterRequiredGates:true
});
b.immediateNextTask = {
  mustNotInsertGenericPrerequisiteLane:true,
  mustStartAsRealProductWork:true,
  name:nextName,
  summary:`Fresh successor independently verifies PR #176/main/post-merge/RJR87 and repository Rules ${rulesBlob} versus provider-proven ${providerBlob}, validates and archives the closing WEC, initializes a fresh WEC, then performs only authenticated Firebase Spark Rules publication with billing/Blaze/Cloud Run forbidden. Runtime host/join UX and provider-live playable acceptance remain later gates.`
};
b.transition = {contextTransitionRequired:true,handoffCompleteness:100,continuationDecision:'HANDOFF_AT_CHECKPOINT'};
b.wec100PackagingRule = b.wec100PackagingRule || 'At Handoff proximity 100 complete the Smart Lean Efficient mirrored starter/full handoff, current pointers and final WEC seal, publish/verify the transition, provide the repository-first prompt and stop before the next substantial milestone.';
writeJson('SESSION_BOOTSTRAP.json',b);

// Context graph: retain all historical nodes, add exact Stage5D/provider-pending lineage and retarget current pointers.
const g = json('SESSION_CONTEXT_GRAPH.json');
g.recordedAt = now;
upsertNode(g,'stage5d-production-rules-source-merge',{
  type:'completed-source-publication-capability',state:'pr176-reviewed-production-rules-source-merged-provider-pending-rjr-delta-zero',pullRequest:176,startingMainSha:'e0445ebf214b9385667187e0e580bba497d8f039',exactFinalHead:prHead,mergeSha:main,mergeTree,rulesSource:'firestore.spark.rules',repositoryRulesBlobSha:rulesBlob,lastProviderProvenRulesBlobSha:providerBlob,providerPublicationProven:false,postMergeRunsSuccessful:15,runtimeChanged:false,rjrScoreAfterProof:87,rjrDelta:0,authority:1,riskCriticality:1
});
upsertNode(g,'closing-current-wec',{
  type:'environment-transition',state:'pr176-rjr87-stage5d-provider-pending-sle-transition',environmentId:env,startingMainSha:'e0445ebf214b9385667187e0e580bba497d8f039',transitionPullRequest:176,initialDecision:'CONTINUE',finalDecision:'HANDOFF_AT_CHECKPOINT',handoffProximity:100,rjrScore:87,starter,fullHandoff:handoff,authority:1,riskCriticality:1
});
upsertNode(g,'successor-selection',{
  type:'successor-immediate-decision',state:'fresh-wec-required-for-provider-live-stage5d-rules',rule:`successor independently verifies PR #176/main/post-merge and provider truth, validates/archives ${env}, initializes a fresh unique WEC with reset counters, then publishes only exact reviewed Rules ${rulesBlob} through an authenticated Spark-compatible route; provider proof precedes separate runtime host/join UX; billing remains forbidden`,authority:1,riskCriticality:1
});
upsertNode(g,'stage5-private-remote-joining',{
  type:'highest-priority-product-destination',state:'stage5d-source-merged-provider-publication-pending',knownRemainingGaps:['authenticated Firebase provider publication of exact reviewed Stage 5D Rules','provider source identity proof','actual Stage 5 host/join/session runtime and UX orchestration','provider-live two-account host/join acceptance','two-network Remote Joining acceptance','Remote Joining-specific token/reconnect/adverse-network hardening','final stable Remote Joining release acceptance'],sessionRulesCurrentState:`repository source ${rulesBlob}; provider-proven source ${providerBlob}`,nextSlice:'authenticated zero-billing provider publication first; runtime host/join UX only after provider proof',authority:1
});
g.edges = g.edges || [];
if(!g.edges.some(e=>e.from==='stage5c-standard-auth-session-adapter-proof'&&e.to==='stage5d-production-rules-source-merge')) g.edges.push({from:'stage5c-standard-auth-session-adapter-proof',to:'stage5d-production-rules-source-merge',relation:'candidate-boundary-promoted-by-exact-blob-lineage-to-reviewed-production-source'});
if(!g.edges.some(e=>e.from==='stage5d-production-rules-source-merge'&&e.to==='successor-selection')) g.edges.push({from:'stage5d-production-rules-source-merge',to:'successor-selection',relation:'provider-publication-remains-separate-unproven-control-plane-gate'});
g.retrievalHints = g.retrievalHints || {};
g.retrievalHints.walkDirection = 'Verify PR #176 merge/post-merge -> compare repository Rules 363af783 with provider-proven 2b7c0b16 -> closing WEC -> fresh WEC -> authenticated zero-billing provider publication -> separate runtime host/join -> fixed RJR evidence. Billing/Blaze/Cloud Run remain forbidden.';
writeJson('SESSION_CONTEXT_GRAPH.json',g);

const m = json('SESSION_CONTEXT_MODEL.json');
m.recordedAt = now;
m.latestCheckpoint = {
  ...(m.latestCheckpoint||{}),
  prePublicationMainSha:main,
  runtimeRevision:'1.8.1-r5',knownGoodRollbackRuntime:'1.8.1-r4',rjrScore:87,
  closedCapability:'stage5d-production-rules-source-pr176-merged-provider-pending-delta-zero',
  exactFinalHead:prHead,mergeSha:main,mergeTree,
  rulesSource:'firestore.spark.rules',rulesBlobSha:rulesBlob,lastProviderProvenRulesBlobSha:providerBlob,
  stage5DRepositoryRulesSourceMerged:true,stage5DProviderRulesPublished:false,stage5DProviderRulesProven:false,
  billingActivationForbidden:true,cloudRunAllowed:false,
  transitionGateBeforeNext:'verify PR176/main/post-merge -> validate/archive closing WEC -> fresh WEC -> authenticated Spark Rules publication -> independent provider source proof -> separate runtime host/join UX',
  next:nextName,closeoutPullRequest:176,starter,fullHandoff:handoff
};
if(Array.isArray(m.mandatoryBypass)) m.mandatoryBypass.unshift(`PR #176 Stage 5D reviewed production Rules source is merged at ${main}; repository blob ${rulesBlob}, provider-proven blob still ${providerBlob}; fixed RJR87; provider publication remains unproven and separate`);
writeJson('SESSION_CONTEXT_MODEL.json',m);

const l = json('SESSION_CONTEXT_LEARNING.json');
l.recordedAt = now;
l.materialSessionsObserved = Math.max(Number(l.materialSessionsObserved||0),15);
l.learningState = 'cold-start-priors-with-fifteen-labeled-sessions';
l.items = l.items || {};
l.items['stage5d-production-rules-provider-pending-proof'] = {loaded:true,usedInDecision:true,requiredForPublicationSecurityOrRecovery:true,preventedErrorOrResolvedContradiction:true,normalizedOutcome:1,learnedUtility:0.6,note:'PR #176 proved exact Stage 5C-to-production-source blob lineage and merged with 14/14 exact-head plus 15/15 post-merge gates, but fixed RJR stays 87 because source/CI/merge add zero capability credit. Provider truth remains the older proven blob until authenticated Firebase publication is independently observed. Paid review quota exhaustion must never cause billing; the mandatory exact-head zero-billing fallback preserved review discipline.'};
l.sessionMetrics = l.sessionMetrics || [];
if(!l.sessionMetrics.some(s=>s.sessionId===env)) l.sessionMetrics.push({sessionId:env,directRemoteJoiningPrerequisiteReached:true,nextRealProductMilestoneUnblocked:nextName,fullHistoryPreloaded:false,githubConnectorSufficient:true,deepFallbackUsed:true,deepFallbackReason:'Exact PR #176 CI/review/merge/post-merge evidence and provider-route inventory were required to separate reviewed repository Rules source from still-unproven provider publication.',missedCriticalContextIncident:false,staleAuthorityCorrection:true,ciTriageLesson:'Historical write-denied assertions must be updated to the exact reviewed session allowlist rather than restoring obsolete denial; require exact-head emulator/Chromium gates after correction.',productionEvidenceLesson:'Repository Rules source promotion and provider publication are separate evidence classes. Do not claim production provider change until authenticated Firebase evidence proves exact source identity.',authorityLesson:'Permanent no-billing authority permits every nonbilling provider decision but never buying review credits or activating billed infrastructure. At the separate provider gate, use an authenticated Spark-compatible Rules-only path or preserve the blocker honestly.'});
l.latestLesson = {lesson:'PR #176 merged the exact Stage 5C standard-Firebase-uid session boundary into the production Rules source at fixed RJR87. The new repository blob is not provider-live evidence; the last provider-proven blob remains authoritative until authenticated zero-billing publication is independently verified. Billing and Cloud Run remain forbidden.',rjrScore:87,closeoutPullRequest:176,next:nextName};
writeJson('SESSION_CONTEXT_LEARNING.json',l);

// Final WEC state and append-only archive.
const w = json('WORK_ENVIRONMENT_STATUS.json');
w.lifecycle = 'transition-prepared';
w.recordedAt = now;
w.signals = {...w.signals,contextComplexity:'very-high',projectComplexity:'very-high',compactionCount:Math.max(Number(w.signals?.compactionCount||0),1),majorPhasesCompleted:Math.max(Number(w.signals?.majorPhasesCompleted||0),4),largeEvidenceEvents:Math.max(Number(w.signals?.largeEvidenceEvents||0),8),newMilestoneNext:true,handoffCompleteness:100,unresolvedFailures:0,unrecordedDecisions:0,atomicOperation:false};
w.assessment = {decision:'HANDOFF_AT_CHECKPOINT',reason:'PR #176 Stage 5D production Rules source, exact-head review fallback, expected-head merge and all 15 post-merge/Pages gates are complete. Provider publication of the new Rules source is a distinct authenticated control-plane milestone and this complete SLE package makes transition safer than beginning it in the closing environment.',decisionInheritedFromPredecessor:false,usageExcludedBecauseUnavailable:true,scores:{contextPressure:88,qualityRisk:4,quotaRisk:null,nextTaskSeparation:100,handoffReadiness:100,atomicRisk:0,continuationRisk:78,transitionCost:12,transitionAdvantage:66}};
w.continuity = w.continuity || {};
w.continuity.currentTask = 'Close PR #176 Stage 5D production Rules source publication and hand provider-live Rules publication to a fresh WEC.';
w.continuity.lastSafeCheckpoint = `PR #176 exact head ${prHead} passed 14/14 workflows and merged as ${main}; all 15 post-merge/Pages runs passed. Repository firestore.spark.rules is ${rulesBlob}; last provider-proven production Rules remains ${providerBlob}; runtime remains v1.8.1 / 1.8.1-r5; RJR remains 87.`;
w.continuity.nextSafeAction = `Fresh successor verifies live state, validates/archives this WEC, initializes/reset a fresh WEC, then publishes only exact Rules ${rulesBlob} through authenticated Firebase Spark and independently verifies provider identity before runtime host/join work.`;
w.continuity.unfinishedWork = ['Authenticated Firebase provider publication of exact reviewed Stage 5D Rules','Independent provider source identity verification and proof/manifest update','Separate runtime host/join UX milestone','Provider-live two-account host/join and real two-device/two-network/reconnect/token/adverse-network acceptance','Final stable Remote Joining release acceptance'];
w.continuity.evidenceNotes = [...(w.continuity.evidenceNotes||[]),`PR #176 exact final head ${prHead}; merge ${main}; tree ${mergeTree}; repository Rules ${rulesBlob}; 14/14 exact-head workflows; 15/15 post-merge/Pages successes.`,`Last independently provider-proven production Rules remains ${providerBlob}; new repository Rules is intentionally not claimed provider-live.`,`Codex paid review quota was exhausted. No billing or credits were purchased. A machine-enforced exact-head fallback required 14/14 CI, Java 21 provider proof, complete diff audit and zero unresolved threads; quota refusal itself earned zero RJR.`];
writeJson('WORK_ENVIRONMENT_STATUS.json',w);

const histMarker = `## Stage 5D production Rules source closure — \`${env}\``;
let hist = read('WORK_ENVIRONMENT_HISTORY.md');
if(!hist.includes(histMarker)){
  hist += `\n\n${histMarker}\n\n- Closed: ${now}\n- Starting verified live main: \`e0445ebf214b9385667187e0e580bba497d8f039\`.\n- Final product PR: #176, exact head \`${prHead}\`, expected-head squash merge \`${main}\`, tree \`${mergeTree}\`.\n- Validation: all 14 exact-head workflow families passed; all 15 post-merge/Pages runs passed with zero failures.\n- Repository production Rules source: \`firestore.spark.rules\` blob \`${rulesBlob}\`.\n- Provider truth: last independently provider-proven production Rules remains \`${providerBlob}\`; publication of the new source is unproven and must not be fabricated.\n- Runtime: unchanged \`v1.8.1 / 1.8.1-r5\`; host/join UX remains unloaded.\n- Fixed RJR-1: \`87/100\`; source, CI, review, merge, Pages, SLE and provider-publication mechanics receive zero duplicate credit.\n- Review boundary: paid Codex quota exhaustion did not authorize billing; the zero-billing exact-head fallback required full diff audit, 14/14 CI including Java 21 provider proof and zero unresolved threads.\n- Final environment decision: \`HANDOFF_AT_CHECKPOINT\`, handoff completeness 100, predecessor decisions not inheritable.\n- Permanent authority: all nonbilling Remote Joining decisions remain authorized; Cloud Billing, Blaze, payment methods, Cloud Run and billing-required services remain forbidden; Firebase stays Spark.\n- Exact next safe action: fresh successor verifies live main/provider truth, validates and archives this record, initializes a fresh WEC, then performs only authenticated Rules publication of \`${rulesBlob}\` and independent provider identity proof before the separate host/join runtime milestone.\n`;
  write('WORK_ENVIRONMENT_HISTORY.md',hist);
}

// Generate the short repository-first prompt from the updated bootstrap and preserve zero-billing authority explicitly.
let prompt = execFileSync(process.execPath,['scripts/build-next-developer-prompt.mjs'],{encoding:'utf8'}).trim();
prompt += ' Billing must never be activated; Firebase must remain Spark, and every other Remote Joining production decision is authorized after required gates.';
write('NEXT_CHAT_HANDOFF_PROMPT.md',prompt);

// Update only current-checkpoint assertions; preserve historical invariants.
let sleTest = read('tests/contracts/sle-handoff-packaging-contracts.cjs');
sleTest = sleTest.replaceAll('START_NEXT_SESSION_V1.4.34_PR175_STAGE5C_STANDARD_AUTH_CANDIDATE.md',starter)
  .replaceAll('SUCCESSOR_HANDOFF_PR175_STAGE5C_STANDARD_AUTH_CANDIDATE_SLE_2026-09-01.md',handoff)
  .replace('assert.equal(capsule.starter.version, "1.4.34");','assert.equal(capsule.starter.version, "1.4.35");')
  .replace('assert.equal(capsule.currentPublicationCheckpoint.pullRequest, 175);','assert.equal(capsule.currentPublicationCheckpoint.pullRequest, 176);')
  .replace('assert.match(currentHandoff,/PR #175[\\s\\S]+STAGE 5C[\\s\\S]+RJR87/i);','assert.match(currentHandoff,/PR #176[\\s\\S]+STAGE 5D[\\s\\S]+RJR87/i);')
  .replace('node.transitionPullRequest === 175','node.transitionPullRequest === 176')
  .replace('/stage5c-standard-auth-candidate-proven-production-rules-next/.test(node.state)','/stage5d-source-merged-provider-publication-pending/.test(node.state)')
  .replace('assert.equal(model.latestCheckpoint.closeoutPullRequest,175,"Context model must point at the current publication PR.");','assert.equal(model.latestCheckpoint.closeoutPullRequest,176,"Context model must point at the current publication PR.");')
  .replace('assert.equal(model.latestCheckpoint.next,"pr175-publication-then-minimum-production-session-rules");',`assert.equal(model.latestCheckpoint.next,"${nextName}");`)
  .replace('assert.equal(learning.latestLesson.closeoutPullRequest,175);','assert.equal(learning.latestLesson.closeoutPullRequest,176);')
  .replace('assert.equal(capsule.immediateNextTask.mustStartAsRealProductWork, false);','assert.equal(capsule.immediateNextTask.mustStartAsRealProductWork, true);')
  .replace('assert.equal(capsule.immediateNextTask.name,"pr175-stage5c-publication-then-minimum-production-session-rules");',`assert.equal(capsule.immediateNextTask.name,"${nextName}");`)
  .replace('assert.match(capsule.immediateNextTask.summary,/PR #175[\\s\\S]+RJR87[\\s\\S]+minimum production session Rules[\\s\\S]+Billing[\\s\\S]+Cloud Run[\\s\\S]+Runtime host\\/join UX[\\s\\S]+later gates/i);','assert.match(capsule.immediateNextTask.summary,/PR #176[\\s\\S]+RJR87[\\s\\S]+provider-proven[\\s\\S]+Billing[\\s\\S]+Cloud Run[\\s\\S]+Runtime host\\/join UX[\\s\\S]+later gates/i);');
// Current package now permits repository source promotion but still denies provider-publication claims.
sleTest = sleTest.replace('assert.match(value, /(?:does not publish production session Rules|production session Rules[\\s\\S]+(?:excluded|later|must not be published))/i, `${name} must keep production session Rules out of the candidate slice.`);','assert.match(value, /provider[\\s\\S]+(?:pending|unproven|NOT yet)[\\s\\S]+Rules/i, `${name} must keep repository source promotion separate from provider publication proof.`);');
write('tests/contracts/sle-handoff-packaging-contracts.cjs',sleTest);

let handoffTest = read('tests/contracts/handoff-immediate-next-task-contracts.cjs');
handoffTest = handoffTest
  .replace('assert.match(next,/CURRENT OVERRIDE[\\s\\S]+PR #175 STAGE 5C CANDIDATE PUBLICATION[\\s\\S]+TRANSITION/i,"NEXT_TASK must expose current PR #175 Stage 5C publication and transition authority before history.");','assert.match(next,/CURRENT OVERRIDE[\\s\\S]+PR #176 STAGE 5D RULES SOURCE MERGED[\\s\\S]+PROVIDER PUBLICATION PENDING/i,"NEXT_TASK must expose current PR #176 Stage 5D provider-pending authority before history.");')
  .replace('assert.equal(bootstrap.currentPublicationCheckpoint?.pullRequest,175,"SESSION_BOOTSTRAP must identify PR #175 as the current Stage 5C candidate/SLE publication checkpoint.");','assert.equal(bootstrap.currentPublicationCheckpoint?.pullRequest,176,"SESSION_BOOTSTRAP must identify PR #176 as the current Stage 5D source/provider-pending checkpoint.");')
  .replace('assert.equal(bootstrap.starter?.version,"1.4.34","The Stage 5C/RJR87 transition must publish starter v1.4.34.");','assert.equal(bootstrap.starter?.version,"1.4.35","The Stage 5D provider-pending/RJR87 transition must publish starter v1.4.35.");')
  .replace('assert.equal(bootstrap.immediateNextTask?.mustStartAsRealProductWork,false,"The successor must finish PR #175 publication before a fresh WEC starts the separate Rules slice.");','assert.equal(bootstrap.immediateNextTask?.mustStartAsRealProductWork,true,"The fresh successor owns the real provider-live Rules milestone after independently verifying the completed PR #176 boundary.");')
  .replace('assert.equal(bootstrap.immediateNextTask?.name,"pr175-stage5c-publication-then-minimum-production-session-rules","The successor bootstrap must route through PR #175 publication to the selected free Rules slice.");',`assert.equal(bootstrap.immediateNextTask?.name,"${nextName}","The successor bootstrap must route to authenticated provider-live Rules before runtime host/join.");`);
// Replace the two current PR175-specific regex assertions with provider-pending equivalents if present.
handoffTest = handoffTest.replace(/assert\.match\(next,new RegExp\(`\(\?=\[\\\\s\\\\S\]\*PR #175 first published implementation proof head\\\\\/tree\)[^;]+;/,`assert.match(next,/PR #176[\\s\\S]+${prHead}[\\s\\S]+DEPLOYED \\/ PRODUCTION-PROVEN[\\s\\S]+1\\.8\\.1-r5/i,"NEXT_TASK must identify current runtime and PR #176 exact source checkpoint.");`);
handoffTest = handoffTest.replace('assert.match(next,/IMMEDIATE NEXT TASK AFTER FULL STUDY[\\s\\S]+Finish only PR #175[\\s\\S]+all 14 workflow families[\\s\\S]+final-head Codex review[\\s\\S]+expected-head squash merge[\\s\\S]+all 15 post-merge\\/Pages runs/i,"NEXT_TASK must route the closing environment through exact-head PR #175 publication only.");','assert.match(next,/IMMEDIATE NEXT TASK AFTER FULL STUDY[\\s\\S]+PR #176[\\s\\S]+15 post-merge\\/Pages[\\s\\S]+provider[\\s\\S]+fresh unique WEC/i,"NEXT_TASK must route the fresh successor from completed PR #176 to provider-live Rules only.");')
  .replace('assert.match(next,/fresh unique WEC[\\s\\S]+minimum production session Rules[\\s\\S]+Runtime host\\/join UX remains separate/i,"NEXT_TASK must give the successor the distinct minimum production Rules gate without collapsing the runtime gate.");','assert.match(next,/fresh unique WEC[\\s\\S]+provider[\\s\\S]+Rules[\\s\\S]+Runtime host\\/join UX/i,"NEXT_TASK must keep provider Rules publication separate from runtime host/join UX.");')
  .replace('assert.match(bootstrap.immediateNextTask?.summary||"",/Fresh successor[\\s\\S]+PR #175[\\s\\S]+RJR87[\\s\\S]+minimum production session Rules[\\s\\S]+Billing, Blaze, Cloud Run[\\s\\S]+Runtime host\\/join UX[\\s\\S]+later gates/i,"The successor capsule must preserve PR #175 verification, permanent no-billing authority and later Rules/runtime/UX boundaries.");','assert.match(bootstrap.immediateNextTask?.summary||"",/Fresh successor[\\s\\S]+PR #176[\\s\\S]+RJR87[\\s\\S]+provider-proven[\\s\\S]+Billing[\\s\\S]+Cloud Run[\\s\\S]+Runtime host\\/join UX[\\s\\S]+later gates/i,"The successor capsule must preserve PR #176 verification, permanent no-billing authority and provider/runtime boundaries.");');
write('tests/contracts/handoff-immediate-next-task-contracts.cjs',handoffTest);

// Remove this one-shot helper from the sealed repository tree.
for(const p of ['.github/workflows/seal-pr176-stage5d-transition.yml','scripts/seal-pr176-stage5d-transition.mjs']){
  if(fs.existsSync(p)) fs.unlinkSync(p);
}

console.log(`Prepared v1.4.35 PR176 Stage5D provider-pending SLE seal at ${now}.`);

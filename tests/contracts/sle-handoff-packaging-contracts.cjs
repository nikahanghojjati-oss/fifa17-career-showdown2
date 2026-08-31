const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = path => fs.readFileSync(path);
const text = path => read(path).toString("utf8");
const json = path => JSON.parse(text(path));

const capsule = json("SESSION_BOOTSTRAP.json");
const readiness = json("REMOTE_JOINING_READINESS.json");
const graph = json("SESSION_CONTEXT_GRAPH.json");
const model = json("SESSION_CONTEXT_MODEL.json");
const learning = json("SESSION_CONTEXT_LEARNING.json");
const index = text("index.html");
const pkg = json("package.json");
const sle = text("00_SLE_HANDOFF_PROTOCOL.md");
const golden = text("00_HANDOFF_GOLDEN_RULE.md");
const rootAuth = text("00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md");
const provenance = text("authority-history/OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION_2026-08-20.md");
const nextPrompt = text("NEXT_CHAT_HANDOFF_PROMPT.md");
const nextTask = text("NEXT_TASK.md");
const projectState = text("PROJECT_STATE.md");
const currentHandoff = text("00_CURRENT_HANDOFF.md");

assert.equal(capsule.schemaVersion, 5);
assert.equal(capsule.repository, "nikahanghojjati-oss/fifa17-career-showdown2");
assert.equal(capsule.publicSite, "https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/");
assert.equal(capsule.slePolicy.definition, "Smart Lean Efficient");
assert.equal(capsule.slePolicy.mandatoryForEveryFutureHandoff, true);
assert.equal(capsule.slePolicy.plainChatOnlyHandoffComplete, false);
assert.equal(capsule.slePolicy.requiredAtHandoffProximity100, true);
assert.equal(capsule.slePolicy.recursiveInheritance, true);

const handoffRoot = capsule.currentHandoff.canonical;
const handoffMirror = capsule.currentHandoff.projectMirror;
const starterRoot = capsule.starter.canonical;
const starterMirror = capsule.starter.projectMirror;
const rollingStarter = text("project-documents/START_NEXT_SESSION.md");
for (const path of [
  "00_SLE_HANDOFF_PROTOCOL.md",
  "00_SESSION_BOOTSTRAP.md",
  handoffRoot,
  handoffMirror,
  starterRoot,
  starterMirror,
  "SESSION_CONTEXT_GRAPH.json",
  "SESSION_CONTEXT_MODEL.json",
  "SESSION_CONTEXT_LEARNING.json",
  "NEXT_CHAT_HANDOFF_PROMPT.md",
  "00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md",
  "authority-history/OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION_2026-08-20.md",
  "PRODUCTION_FIRESTORE_RULES_PROVIDER_PROOF_2026-08-29.md",
  "PRODUCTION_PROVIDER_ABUSE_ACCEPTANCE_PROOF_2026-08-29.md"
]) assert.ok(fs.existsSync(path), `SLE package is missing ${path}`);

assert.deepEqual(read(handoffRoot), read(handoffMirror), "SLE handoff root and project mirror must remain byte-identical.");
assert.deepEqual(read(starterRoot), read(starterMirror), "SLE starter root and project mirror must remain byte-identical.");
assert.match(starterRoot, new RegExp(`START_NEXT_SESSION_V${capsule.starter.version.replace(/\./g, "\\.")}`));
assert.equal(capsule.starter.ownerInitialDelivery, "short-repository-first-prompt", "Current SLE policy requires the short repository-first prompt as the normal owner entrypoint.");
assert.equal(capsule.starter.fallbackPackNeededByDefault, false);
assert.equal(capsule.starter.version, "1.4.32");
assert.ok(rollingStarter.includes(starterRoot), "Rolling successor entrypoint must name the capsule's current starter.");
assert.ok(rollingStarter.includes(handoffRoot), "Rolling successor entrypoint must name the capsule's current deep handoff.");
assert.ok(rollingStarter.includes(`v${pkg.version}`), "Rolling successor entrypoint must identify the current source application.");
assert.ok(rollingStarter.includes(`${readiness.currentScore}/100`), "Rolling successor entrypoint must identify the fixed current RJR score.");
assert.match(nextPrompt,/Open the live repository `nikahanghojjati-oss\/fifa17-career-showdown2`/i,"Fresh next-developer prompt must be repository-first.");
assert.ok(nextPrompt.includes(starterRoot),"Fresh next-developer prompt must name the current versioned starter.");
assert.match(nextPrompt,/independently verify/i,"Fresh next-developer prompt must require independent live verification.");
assert.match(nextPrompt,/fresh unique WEC|fresh WEC/i,"Fresh next-developer prompt must require a fresh successor WEC.");
assert.match(nextPrompt,/START_NEXT_SESSION_V1\.4\.32_PR174_STAGE5B_CREDENTIAL_CANDIDATE/i,"Fresh next-developer prompt must route to the current Stage 5B credential-candidate starter.");
assert.match(nextPrompt,/Blaze\/Cloud Run[\s\S]+secondary custom Auth[\s\S]+exact additional IAM permissions/i,"Fresh next-developer prompt must preserve the production activation owner gate.");

assert.equal(capsule.remoteJoiningReadiness.authority, "REMOTE_JOINING_READINESS.json");
assert.equal(capsule.remoteJoiningReadiness.model, readiness.modelVersion);
assert.equal(capsule.remoteJoiningReadiness.score, readiness.currentScore);
assert.equal(readiness.currentScore, 87);
assert.equal(readiness.denominator, 100);
assert.match(capsule.remoteJoiningReadiness.rule, /capability evidence|genuine/i);

const sourceRevision = (index.match(/app-asset-revision"\s+content="([^"]+)/) || [])[1];
const sourceVersion = (sourceRevision && sourceRevision.match(/^(\d+\.\d+\.\d+)-r\d+$/) || [])[1];
assert.equal(sourceVersion, pkg.version, "Current source package and runtime revision must remain coherent.");
assert.equal(capsule.runtime.applicationVersion, pkg.version);
assert.equal(capsule.runtime.productionRuntimeRevision, sourceRevision, "Transition package must leave exact source/runtime identity on restored production r5.");
assert.equal(capsule.runtime.productionRuntimeRevision, "1.8.1-r5");
assert.equal(capsule.runtime.immediateRecoveryRuntime, "1.8.1-r4");
assert.match(capsule.runtime.productionStatus, /production-proven/i);
assert.equal(capsule.runtime.appCheckEnforcement, false);
assert.equal(capsule.runtime.billingRequired, false);
assert.match(capsule.runtime.productionClientFirestore, /memory-only/i);
assert.equal(capsule.latestRuntimeMerge.pullRequest, 166);
assert.equal(capsule.latestRuntimeMerge.rollbackRunId, 33190961085);
assert.equal(capsule.currentPublicationCheckpoint.pullRequest, 174);
assert.equal(capsule.currentPublicationCheckpoint.productionRollbackProven, true);
assert.equal(capsule.currentPublicationCheckpoint.productionRestorationProven, true);
assert.equal(capsule.currentPublicationCheckpoint.productionProviderRulesPublicationProven, true);
assert.equal(capsule.currentPublicationCheckpoint.productionProviderRulesSource, "firestore.spark.rules");
assert.equal(capsule.currentPublicationCheckpoint.productionProviderRulesBlobSha, "2b7c0b166ae0aae7ab7a3ce84725b21091262484");
assert.equal(capsule.currentPublicationCheckpoint.rjrAfterEvidence, readiness.currentScore);
assert.equal(capsule.currentPublicationCheckpoint.providerAbuseAcceptanceImplemented, true);
assert.equal(capsule.currentPublicationCheckpoint.providerAbuseProductionAcceptanceProven, true);
assert.equal(capsule.currentPublicationCheckpoint.providerAbuseProductionProof, "PRODUCTION_PROVIDER_ABUSE_ACCEPTANCE_PROOF_2026-08-29.md");
assert.equal(capsule.currentPublicationCheckpoint.providerAbuseProductionResult, "PROVIDER_ABUSE_AUTHENTICATED_LIST_DENIED");
assert.equal(capsule.currentPublicationCheckpoint.stage5AImplementationAuthorized, true);
assert.equal(capsule.currentPublicationCheckpoint.stage5ACandidateImplemented, true);
assert.equal(capsule.currentPublicationCheckpoint.stage5ACandidateEmulatorProven, true);
assert.equal(capsule.currentPublicationCheckpoint.stage5ACandidateProof, "STAGE5A_PRIVATE_SESSION_CANDIDATE_EMULATOR_PROOF_2026-08-31.md");
assert.equal(capsule.currentPublicationCheckpoint.implementationProofHead, "5b092220ce2507c66cf653e510fbaa2c43fb425d");
assert.equal(capsule.currentPublicationCheckpoint.implementationProofTree, "2b525677ba2af016929b0bb1706df9c3f40847aa");
assert.equal(capsule.currentPublicationCheckpoint.stage5AProviderDeviceCredentialClaim, "device_id");
assert.equal(capsule.currentPublicationCheckpoint.stage5AProviderDeviceCredentialEmulatorProven, true);
assert.equal(capsule.currentPublicationCheckpoint.stage5BCandidateImplemented, true);
assert.equal(capsule.currentPublicationCheckpoint.stage5BClient, "js/sparkDeviceCredential.js");
assert.equal(capsule.currentPublicationCheckpoint.stage5BTrustedIssuer, "js/trustedDeviceCredentialIssuance.js");
assert.equal(capsule.currentPublicationCheckpoint.stage5BProof, "STAGE5B_DEVICE_CREDENTIAL_FOUNDATION_PROOF_2026-08-31.md");
assert.equal(capsule.currentPublicationCheckpoint.stage5BNonExtractableKeyBrowserProven, true);
assert.equal(capsule.currentPublicationCheckpoint.stage5BPerSignInCustomTokenClaimsEmulatorProven, true);
assert.equal(capsule.currentPublicationCheckpoint.stage5BSimultaneousSameUidDeviceIsolationProven, true);
assert.equal(capsule.currentPublicationCheckpoint.stage5BAtomicDeviceCredentialRevocationProven, true);
assert.equal(capsule.currentPublicationCheckpoint.stage5BProductionActivationOwnerDecisionRequired, true);
assert.deepEqual(capsule.currentPublicationCheckpoint.stage5BRequiredAdditionalIamPermissions, ["iam.serviceAccounts.signBlob", "datastore.entities.update"]);
assert.equal(capsule.currentPublicationCheckpoint.stage5BCloudRunAvailableOnCurrentSparkPlan, false);
assert.equal(capsule.currentPublicationCheckpoint.stage5BSecondaryCustomAuthAuthorized, false);
assert.equal(capsule.currentPublicationCheckpoint.productionProviderDeviceCredentialIssued, false);
assert.equal(capsule.currentPublicationCheckpoint.productionProviderDeviceCredentialProven, false);
assert.equal(capsule.currentPublicationCheckpoint.stage5ARuntimeImplemented, false);
assert.equal(capsule.currentPublicationCheckpoint.productionSessionRulesChanged, false);

assert.deepEqual(capsule.criticalLocks.canonicalStorage, [
  "careerModeShowdown.saveLibrary",
  "careerModeShowdown.legacyShowdowns",
  "careerModeShowdown.preferences"
]);
assert.equal(capsule.criticalLocks.activeShowdownCanonical, false);
assert.equal(capsule.criticalLocks.candidateA, "non-mutating-export");
assert.equal(capsule.criticalLocks.candidateB, "read-only-import-analysis");
assert.equal(capsule.criticalLocks.candidateC, "sole-destructive-import-apply-authority");
assert.equal(capsule.criticalLocks.candidateCRollback, "transaction-owned-strict-exact-raw-snapshot");
assert.equal(capsule.criticalLocks.appCheck, "production-proven-enforcement-off");
assert.equal(capsule.criticalLocks.firestorePersistence, "memory-only");
assert.match(capsule.criticalLocks.trustedRuntimeIam, /not-broadened-not-activated/i);
assert.equal(capsule.criticalLocks.zeroBilling, true);
assert.match(capsule.criticalLocks.productionProviderDeviceCredential, /candidate-proven-not-production-issued-owner-activation-required/i);
assert.equal(capsule.criticalLocks.publicDiscovery, false);
assert.equal(capsule.criticalLocks.publicCommunity, false);
assert.equal(capsule.criticalLocks.publicMatchmaking, false);
assert.equal(capsule.criticalLocks.globalLeaderboardsRankings, false);
assert.equal(capsule.criticalLocks.standingMergeDeployAuthorizedAfterRequiredGates, true);

assert.equal(capsule.ownerStandingAuthorization.mergeAndDeployWithoutRepeatedOwnerApproval, true);
assert.equal(capsule.ownerStandingAuthorization.rootAuthority, "00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md");
assert.match(rootAuth, /through completion of the full Career Mode Showdown project/i);
assert.match(provenance, /through the end of the full Career Mode Showdown project/i);
assert.match(rootAuth, /later explicit owner instruction may revoke or narrow/i);
assert.match(provenance, /later explicit owner instructions override/i);

assert.match(sle, /SLE = Smart Lean Efficient/i);
assert.match(sle, /mandatory future-developer rule/i);
assert.match(sle, /short freshly generated repository-first next-developer prompt/i,"SLE policy must preserve the current lean owner delivery invariant.");
assert.match(sle, /plain chat-only successor prompt[\s\S]{0,160}not a complete project handoff/i);
assert.match(sle, /SESSION_BOOTSTRAP\.json/i);
assert.match(sle, /SESSION_CONTEXT_GRAPH\.json/);
assert.match(sle, /Handoff proximity: 100%/i);
assert.match(golden,/repository-first next-developer copy-paste prompt/i);
assert.match(capsule.wec100PackagingRule, /Smart Lean Efficient/i);
assert.match(capsule.wec100PackagingRule, /stop before the next substantial milestone/i);

const starter = text(starterRoot);
const handoff = text(handoffRoot);
for (const [name, value] of [["starter", starter], ["handoff", handoff]]) {
  assert.match(value, /(?:SLE = Smart Lean Efficient|Smart Lean Efficient \(SLE\))/i, `${name} must preserve the owner SLE definition.`);
  assert.match(value, /IMMEDIATE NEXT TASK AFTER FULL STUDY/i, `${name} must identify the immediate next task.`);
  assert.match(value, /standing[\s\S]{0,350}merge[\s\S]{0,260}deploy/i, `${name} must preserve standing merge/deploy authorization.`);
  assert.match(value, /required (?:test|tests|gate|gates)/i, `${name} must condition publication on validation.`);
  assert.match(value, /App Check enforcement remains OFF/i, `${name} must preserve the App Check enforcement lock.`);
  assert.match(value, /Remote Joining readiness/i, `${name} must preserve RJR reporting authority.`);
  assert.match(value, /Handoff proximity: X%/i, `${name} must preserve the eight-line progress format.`);
  assert.match(value, /Handoff proximity: X%\s*\nRemote Joining readiness: ~Y%/i, `${name} must preserve the exact owner-facing readiness percentage template.`);
  assert.match(value, /Sidequest check:/i, `${name} must preserve the eight-line progress format.`);
  assert.match(value, /PR #174[\s\S]+Stage 5B[\s\S]+credential[\s\S]+(?:Chromium|browser)[\s\S]+emulator/i, `${name} must preserve the Stage 5B credential candidate/emulator checkpoint.`);
  assert.match(value, /production (?:session )?Rules[\s\S]+(?:unchanged|no production Rules publication|provider-live)/i, `${name} must preserve the unpublished production Rules boundary.`);
  assert.match(value, /(?=[\s\S]*non-extractable)(?=[\s\S]*P-256)(?=[\s\S]*per-sign-in)(?=[\s\S]*device_id)/i, `${name} must preserve the selected key-bound per-sign-in credential model.`);
  assert.match(value, /(?:Production (?:does not|also does not)[\s\S]+(?:issue|issuer)[\s\S]+(?:device_id|candidate)|Production Google tokens do not contain[\s\S]+device_id)/i, `${name} must expose the unissued production device credential.`);
  assert.match(value, /(?=[\s\S]*Blaze)(?=[\s\S]*Cloud Run)(?=[\s\S]*secondary[\s\S]*custom Auth)(?=[\s\S]*iam\.serviceAccounts\.signBlob)(?=[\s\S]*datastore\.entities\.update)/i, `${name} must preserve the exact production activation owner gate.`);
  assert.match(value, /production session Rules[\s\S]+(?:excluded|later|must not be published)/i, `${name} must keep production session Rules out of the credential slice.`);
}

assert.match(nextTask,/CURRENT OVERRIDE[\s\S]+PR #174 STAGE 5B CREDENTIAL CANDIDATE[\s\S]+RJR-1 remains `87\/100`/i);
assert.match(nextTask,/PROVIDER_ABUSE_AUTHENTICATED_LIST_DENIED/i);
assert.match(nextTask,/(?=[\s\S]*PR #174)(?=[\s\S]*non-extractable P-256)(?=[\s\S]*per-sign-in[\s\S]*custom-token claims)(?=[\s\S]*Auth-plus-Firestore emulator)/i);
assert.match(projectState,/RJR-1 is `87\/100`|Remote Joining readiness: `87\/100`/i);
assert.match(currentHandoff,/PR #174[\s\S]+STAGE 5B CREDENTIAL CANDIDATE[\s\S]+RJR87/i);

assert.equal(graph.schemaVersion, 2);
assert.ok(graph.nodes.some(node => node.id === "rjr1-ledger" && node.recordedScore === readiness.currentScore), "Context graph RJR pointer must match the current fixed ledger.");
assert.ok(graph.nodes.some(node => node.id === "production-pages-rollback-proof" && node.workflowRunId === 33190961085 && node.rjrScoreAfterProof === 85), "Context graph must preserve consumed rollback capability provenance.");
assert.ok(graph.nodes.some(node => node.id === "production-strengthened-rules-provider-proof" && node.rjrScoreAfterProof === 86 && node.rulesBlobSha === "2b7c0b166ae0aae7ab7a3ce84725b21091262484"), "Context graph must preserve provider-proven strengthened Rules evidence.");
assert.ok(graph.nodes.some(node => node.id === "provider-abuse-enumeration-acceptance" && node.firestoreWritesRequested === 0 && node.productionResult === "PROVIDER_ABUSE_AUTHENTICATED_LIST_DENIED" && node.rjrScoreAfterProof === 87), "Context graph must preserve the exact zero-write production provider-abuse PASS.");
assert.ok(graph.nodes.some(node => node.id === "stage5a-candidate-emulator-proof" && node.pullRequest === 173 && node.rjrDelta === 0 && node.rjrScoreAfterProof === 87 && node.providerDeviceCredentialClaim === "device_id" && node.productionProviderDeviceCredentialProven === false), "Context graph must preserve the PR #173 provider-device-credential candidate proof with zero RJR movement.");
assert.ok(graph.nodes.some(node => node.id === "stage5b-device-credential-foundation-proof" && node.pullRequest === 174 && node.rjrDelta === 0 && node.rjrScoreAfterProof === 87 && node.providerDeviceCredentialClaim === "device_id" && node.providerDeviceCredentialKeyClaim === "device_key_sha256" && node.simultaneousSameUidDeviceIsolationProven === true && node.productionActivationOwnerDecisionRequired === true), "Context graph must preserve the PR #174 key-bound per-sign-in credential candidate proof and owner gate with zero RJR movement.");
assert.ok(graph.nodes.some(node => node.id === "closing-current-wec" && node.transitionPullRequest === 174 && node.rjrScore === 87), "Context graph must point at PR #174 RJR87 transition.");
assert.ok(graph.nodes.some(node => node.id === "successor-selection"), "Transition package must route successor through fresh-WEC product selection.");
assert.ok(graph.nodes.some(node => node.id === "stage5-private-remote-joining" && /stage5b-credential-candidate-proven-production-activation-owner-gated/.test(node.state)), "Transition package must preserve the provider activation owner gate.");
assert.match(graph.retrievalHints.walkDirection,/PR #173[\s\S]+PR #174[\s\S]+Stage 5B[\s\S]+RJR87[\s\S]+device_id\/device_key_sha256[\s\S]+Blaze\/Cloud Run/i);
assert.equal(model.latestCheckpoint.rjrScore,87,"Context model latest checkpoint must match RJR87.");
assert.equal(model.latestCheckpoint.rulesBlobSha,"2b7c0b166ae0aae7ab7a3ce84725b21091262484");
assert.equal(model.latestCheckpoint.closeoutPullRequest,174,"Context model must point at the current publication PR.");
assert.equal(model.latestCheckpoint.next,"stage5b-production-activation-owner-decision");
assert.equal(model.latestCheckpoint.providerDeviceCredentialClaim,"device_id");
assert.equal(model.latestCheckpoint.providerDeviceCredentialKeyClaim,"device_key_sha256");
assert.equal(model.latestCheckpoint.productionActivationOwnerDecisionRequired,true);
assert.equal(model.latestCheckpoint.productionProviderDeviceCredentialProven,false);
assert.match(learning.latestLesson.lesson,/PR #174[\s\S]+Stage 5B[\s\S]+fixed RJR87[\s\S]+non-extractable P-256[\s\S]+per-sign-in device_id\/device_key_sha256[\s\S]+Blaze\/Cloud Run/i,"Context learning must preserve the key-bound credential candidate and exact owner gate.");
assert.equal(learning.latestLesson.rjrScore,87);
assert.equal(learning.latestLesson.closeoutPullRequest,174);

assert.ok(capsule.minimalReads.includes("00_SLE_HANDOFF_PROTOCOL.md"));
assert.ok(capsule.minimalReads.includes("00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md"));
assert.ok(capsule.minimalReads.includes("PRODUCTION_FIRESTORE_RULES_PROVIDER_PROOF_2026-08-29.md"));
assert.ok(capsule.minimalReads.includes("PRODUCTION_PROVIDER_ABUSE_ACCEPTANCE_PROOF_2026-08-29.md"));
assert.ok(capsule.minimalReads.includes("STAGE5A_PRIVATE_SESSION_CANDIDATE_EMULATOR_PROOF_2026-08-31.md"));
assert.ok(capsule.minimalReads.includes("STAGE5B_DEVICE_CREDENTIAL_FOUNDATION_PROOF_2026-08-31.md"));
assert.equal(capsule.immediateNextTask.mustNotInsertGenericPrerequisiteLane, true);
assert.equal(capsule.immediateNextTask.mustStartAsRealProductWork, false);
assert.equal(capsule.immediateNextTask.name,"stage5b-production-activation-owner-decision");
assert.match(capsule.immediateNextTask.summary,/PR #174[\s\S]+RJR87[\s\S]+Blaze\/Cloud Run[\s\S]+secondary custom Auth[\s\S]+iam\.serviceAccounts\.signBlob[\s\S]+datastore\.entities\.update[\s\S]+Production session Rules[\s\S]+remain later work/i);
assert.equal(capsule.transition.contextTransitionRequired, true);
assert.equal(capsule.transition.handoffCompleteness, 100);
assert.equal(capsule.transition.continuationDecision, "HANDOFF_AT_CHECKPOINT");

process.stdout.write(`PASS SLE package: repository-first Smart Lean Efficient handoff is coherent for source ${pkg.version}/${sourceRevision}, production ${capsule.runtime.applicationVersion}/${capsule.runtime.productionRuntimeRevision}, fixed RJR ${readiness.currentScore}/100, PR #174 Stage 5B credential candidate proof and explicit production activation owner gate.\n`);

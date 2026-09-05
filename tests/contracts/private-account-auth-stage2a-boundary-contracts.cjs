const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const stage2a = read("PRIVATE_ACCOUNT_AUTH_STAGE_2A.md");
const next = read("NEXT_TASK.md");
const historicalNext = read("authority-history/NEXT_TASK_POST_PR100_PRE_GATEWAY_FULL.md");
const preR3Next = read("authority-history/NEXT_TASK_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md");
const state = read("PROJECT_STATE.md");
const readiness = JSON.parse(read("REMOTE_JOINING_READINESS.json"));
const bootstrap = JSON.parse(read("SESSION_BOOTSTRAP.json"));
const preR3State = read("authority-history/PROJECT_STATE_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md");
const roadmap = read("POST_V1_ROADMAP_EXECUTION.md");
const remoteRoadmap = read("REMOTE_JOINING_EXECUTION_ROADMAP.md");
const phase1f = read("CLOUD_SYNC_READINESS_PHASE_1F.md");
const rules = read("firestore.rules");
const index = read("index.html");
const optional = read("js/optionalModules.js");
const worker = read("service-worker.js");
const pkg = JSON.parse(read("package.json"));
const currentProduction = bootstrap.runtime?.productionRuntimeRevision === "1.9.1-r2"
  && bootstrap.latestRuntimeMerge?.pullRequest === 194
  && bootstrap.latestRuntimeMerge?.runtimeRevision === "1.9.1-r2"
  && bootstrap.lastProductionProvenRuntime?.pullRequest === 194
  && bootstrap.lastProductionProvenRuntime?.runtimeRevision === "1.9.1-r2";

assert.match(stage2a, /AUTHORIZED NEXT PREREQUISITE \/ IMPLEMENTATION NOT STARTED/i);
assert.match(stage2a, /demo-career-mode-showdown-phase1f/);
assert.match(stage2a, /Authentication Emulator[\s\S]+9099/i);
assert.match(stage2a, /Firestore[\s\S]+8080/i);
assert.match(stage2a, /Firebase Auth `uid`[\s\S]+`accountId`/i);
assert.match(stage2a, /accountId[\s\S]+profileId[\s\S]+saveId[\s\S]+seasonId[\s\S]+deviceId[\s\S]+installationId[\s\S]+rivalryId[\s\S]+sessionId/i);
assert.match(stage2a, /synthetic email\/password users[\s\S]+test mechanism only/i);
assert.match(stage2a, /in-memory/i);
assert.match(stage2a, /wrong-account/i);
assert.match(stage2a, /Signing out removes authenticated Firestore access/i);
assert.match(stage2a, /Every application-client Firestore create, update and delete remains denied|all application-client Firestore writes remain denied/i);
assert.match(stage2a, /raw password[\s\S]+ID token[\s\S]+refresh token[\s\S]+not/i);
assert.match(stage2a, /Candidate A[\s\S]+Candidate B[\s\S]+Candidate C/i);
assert.match(stage2a, /careerModeShowdown\.saveLibrary[\s\S]+careerModeShowdown\.legacyShowdowns[\s\S]+careerModeShowdown\.preferences/i);
assert.match(stage2a, /production accounts[\s\S]+NOT CREATED/i);
assert.match(stage2a, /Pairing \/ Connected Rivalry \/ Remote Joining:\s*NOT AUTHORIZED/i);
assert.match(stage2a, /public discovery[\s\S]+global leaderboard\/rankings remain eliminated/i);

assert.match(phase1f, /DONE \/ MERGED \/ PROTECTED[\s\S]+PR #81/i);
assert.match(phase1f, /0bdbe2e8c0dc36901361a8aa15056c6af3f5e70d/);
assert.match(phase1f, /231556d86a93535fa90e173577c1159de4f40be0/);
assert.match(phase1f, /every application-client (?:Firestore )?write(?: path)? remains denied/i);
assert.match(phase1f, /idempotencyKeyHash[\s\S]+sibling[\s\S]+idempotency receipt/i);

// Stage 2A is immutable prerequisite provenance, not current execution authority. Later connected-account
// runtime work superseded it; live authority is now PR194/r2 production-proven with fixed RJR100 accepted and PR198 publication current.
assert.match(historicalNext, /Current authorized prerequisite candidate[\s\S]+Private Account \/ Authentication Stage 2A/i,"Archived predecessor authority must preserve the historical Stage 2A selection boundary.");
assert.match(preR3Next,/Historical gateway heading retained only as provenance: CURRENT IMPLEMENTATION AUTHORITY — TRUSTED SHARED MUTATION GATEWAY/i,"Lossless pre-r3 authority must retain the completed gateway prerequisite as historical provenance.");
assert.match(preR3Next,/Private Account \/ Authentication \/ Authorization Stages 2A through 2I are DONE \/ MERGED \/ PROVEN/i,"Lossless pre-r3 authority must preserve Stage 2A through 2I completion.");
assert.match(preR3Next, /Authorized product candidate:[\s\S]{0,120}v1\.5\.0[\s\S]{0,120}1\.5\.0-r1/i,"Lossless pre-r3 authority must preserve the historical bounded v1.5.0/r1 candidate.");
assert.match(preR3State, /Phase 1F[\s\S]+DONE \/ MERGED \/ PROTECTED[\s\S]+PR #81/i);
assert.match(preR3State, /Private Account \/ Authentication \/ Authorization Stages 2A through 2I are DONE \/ MERGED \/ PROVEN/i,"Lossless pre-r3 PROJECT_STATE must preserve Stage 2A completion inside the Stage 2A-through-2I authority.");
assert.match(next,/CURRENT TASK[\s\S]+100\/100[\s\S]+PR #198/i,"Current NEXT_TASK must identify evidence-accepted RJR100 / PR198 publication authority before immutable Stage 2A history.");
assert.match(state,/RJR-1 COMPLETE 100\/100|RJR100/i,"Current PROJECT_STATE must identify evidence-accepted RJR100 before immutable Stage 2A history.");
assert.match(state,/v1\.9\.1[\s\S]+1\.9\.1-r2[\s\S]+PR #198/i,"Current PROJECT_STATE must preserve PR194/r2 runtime identity while exposing PR198 evidence publication.");
assert.equal(currentProduction,true,"Current runtime provenance must identify production-proven PR #194 / v1.9.1-r2.");
assert.equal(bootstrap.historicalPr187PublicationCheckpoint?.pullRequest,187,"Historical PR187 publication provenance must remain explicit.");
assert.equal(bootstrap.historicalPr187PublicationCheckpoint?.runtimeRevision,"1.9.0-r5","Historical PR187 runtime provenance must remain 1.9.0-r5.");
assert.equal(bootstrap.historicalPr187PublicationCheckpoint?.mergeSha,"277f1b55dc362ee84d285445b99172b9fbed8509","Historical PR187 merge provenance must remain exact.");
assert.equal(bootstrap.previousProductionProvenRuntime?.runtimeRevision,"1.9.1-r1","Current rollback whole-shell authority must remain the previous production-proven r1 shell.");
assert.equal(bootstrap.remoteJoiningReadiness?.score,100,"Current bootstrap must expose evidence-accepted fixed RJR100 while publication work remains uncredited.");
assert.equal(bootstrap.remoteJoiningReadiness?.remaining,0);
assert.equal(bootstrap.runtime?.appCheckEnforcement,false,"Current authority must keep App Check enforcement off.");
assert.equal(bootstrap.ownerZeroBillingAuthorization?.firebasePlanMustRemain,"Spark","Current authority must preserve Spark zero billing.");
assert.equal(bootstrap.ownerZeroBillingAuthorization?.cloudBillingAccountMayBeLinked,false,"Cloud Billing linkage must remain forbidden.");
assert.equal(bootstrap.runtime?.firestorePersistence,"memory-only","Firestore persistence must remain memory-only.");
assert.equal(bootstrap.runtime?.googleAuthPersistence,"browserSessionPersistence-popup-only-no-extra-scopes","Google Auth must remain popup-only browserSessionPersistence with no extra scopes.");
assert.match(state,/Installable Offline App[\s\S]+(?:local-first startup\/recovery baseline|local-first startup and recovery baseline|v1\.3\.0 Recovery & Device Resilience baseline)/i,"Current PROJECT_STATE must preserve the offline recovery baseline rather than inline stale Stage 2A authority.");
assert.match(state,/Candidate C remains the sole destructive remote-to-local(?: gameplay)? Apply authority/i,"Current PROJECT_STATE must preserve Candidate C destructive Apply authority.");
assert.equal(readiness.modelVersion,"RJR-1","Stage 2A current-state checks must use the fixed RJR-1 model.");
assert.equal(readiness.currentScore,100,"Stage 2A current-state checks must expose evidence-accepted fixed RJR100.");
assert.match(state,new RegExp("RJR-1[^\\n]{0,80}"+readiness.currentScore+"\\/100|RJR"+readiness.currentScore,"i"),"Current PROJECT_STATE must report the live fixed RJR score.");
const stage5eLifecycleEvidence=readiness.evidenceHistory?.find(entry=>entry.eventId==="production-stage5e-r3-provider-live-remote-joining-lifecycle");
assert.equal(stage5eLifecycleEvidence?.score,88,"Stage 2A current-state checks must preserve the evidence-only Stage 5E provider-live lifecycle transition to RJR88.");
assert.equal(stage5eLifecycleEvidence?.delta,1,"Stage 2A current-state checks must preserve one bounded capability credit for the Stage 5E provider-live lifecycle.");
const stage5fEvidence=readiness.evidenceHistory?.filter(entry=>entry.score===90||entry.score===91)||[];
assert.equal(stage5fEvidence.length,2,"Stage 2A current-state checks must preserve the two distinct Stage 5F production-negative credits.");
assert.ok(stage5fEvidence.every(entry=>entry.delta===1&&entry.domainId==="identity-auth-trust"));
const physicalAcceptance=readiness.evidenceHistory?.find(entry=>entry.eventId==="production-rjr-physical-two-device-two-network-acceptance");
const stableReleaseAcceptance=readiness.evidenceHistory?.find(entry=>entry.eventId==="production-rjr-final-stable-release-acceptance");
assert.equal(physicalAcceptance?.score,99);assert.equal(physicalAcceptance?.delta,8);
assert.equal(stableReleaseAcceptance?.score,100);assert.equal(stableReleaseAcceptance?.delta,1);
assert.match(roadmap, /Cloud Readiness \| PHASE 1A DONE \/ 1B DONE \/ 1C DONE \/ 1D DONE \/ 1E DONE \/ 1F DONE/i);
assert.match(roadmap, /Private Identity \/ Account Layer \| STAGE 2 ACTIVE \/ 2A AUTHORIZED NEXT/i);
assert.match(remoteRoadmap, /Stage 1 — Cloud \/ Sync Readiness[\s\S]+DONE \/ MERGED \/ PROTECTED through Phase 1F/i);
assert.match(remoteRoadmap, /Stage 2A — Firebase Auth Emulator Identity Boundary[\s\S]+AUTHORIZED NEXT PREREQUISITE \/ IMPLEMENTATION NOT STARTED/i);
assert.match(remoteRoadmap, /Stage 3[\s\S]+BLOCKED until Stage 2 is proven/i);

assert.match(rules, /request\.auth\.uid/);
assert.doesNotMatch(rules, /allow\s+(?:write|create|update|delete)[^\n]*if\s+true/i);
assert.match(rules, /allow list, create, update, delete:\s*if false/g);

const indexRevision=(index.match(/app-asset-revision"\s+content="([^"]+)/)||[])[1];
const workerRevision=(worker.match(/RUNTIME_REVISION\s*=\s*"([^"]+)/)||[])[1];
const runtimeVersion=(indexRevision.match(/^(\d+\.\d+\.\d+)-r[1-9]\d*$/)||[])[1];
assert.equal(runtimeVersion,pkg.version,"Current release identity must remain coherent while emulator-only historical Stage 2A stays version-neutral.");
assert.equal(workerRevision,indexRevision,"Service Worker and shell runtime identities must remain coherent after later release-owned runtime integration.");
assert.doesNotMatch(index, /firebase-admin|firebase\/auth|firestore/i, "Stage 2A boundary must not itself connect Firebase Auth/Admin/Firestore directly in the production shell; later reviewed connected-account runtime remains lazy behind app.js.");
assert.doesNotMatch(optional, /firebase-admin|firebase\/auth|firestore/i, "Stage 2A boundary must not connect Firebase Auth/Admin/Firestore through production optional modules.");
assert.doesNotMatch(worker, /firebase-admin|firebase-auth|firebase\/auth|firestore|private-account-auth-stage2a/i, "Stage 2A Auth/emulator runtime must remain absent from the production Service Worker even when later reviewed Firebase runtime assets are shell-cached indirectly.");

process.stdout.write("PASS Private Account/Auth Stage 2A emulator-only identity boundary with immutable historical selection/completion preserved while live PR194/r2 production, evidence-accepted RJR100 and PR198 publication authority are explicit\n");

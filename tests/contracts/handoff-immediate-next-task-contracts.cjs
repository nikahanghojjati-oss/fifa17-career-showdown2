const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const golden = read("00_HANDOFF_GOLDEN_RULE.md");
const start = read("00_DEVELOPER_START_HERE.md");
const current = read("00_CURRENT_HANDOFF.md");
const active = read("IDENTITY_SAFE_CAREER_ANALYTICS_ACTIVE_HANDOFF.md");
const next = read("NEXT_TASK.md");
const bootstrap = JSON.parse(read("SESSION_BOOTSTRAP.json"));
const readiness = JSON.parse(read("REMOTE_JOINING_READINESS.json"));
const reconciliationProof = read("OWNER_PRODUCTION_STAGE4_REMOTE_TO_LOCAL_RECONCILIATION_PROOF_2026-08-25.md");
const historicalNext = read("authority-history/NEXT_TASK_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md");
const remotePriority = read("REMOTE_JOINING_PRIORITY_AMENDMENT_2026-08-17.md");
const standingAuth = read("00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md");

assert.match(golden,/Mandatory immediate-next-task handoff rule/i,"Golden handoff policy must permanently require an explicit immediate-next-task section.");
assert.match(golden,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i,"Golden handoff policy must name the required post-study immediate-task section.");
assert.match(golden,/bootstrap\/study[\s\S]+execution/i,"Golden handoff policy must distinguish repository study from the concrete execution task that follows it.");
assert.match(golden,/specific enough[\s\S]+start work without asking the owner what to do next/i,"Golden handoff policy must require enough specificity for a fresh developer to begin independently.");
assert.match(golden,/Do not substitute vague instructions/i,"Golden handoff policy must prohibit vague roadmap-only continuation language.");
assert.match(golden,/recursive and permanent/i,"Immediate-next-task handoff behavior must remain recursive across future developer sessions.");

for(const [name,text] of [["00_DEVELOPER_START_HERE.md",start],["00_CURRENT_HANDOFF.md",current],["IDENTITY_SAFE_CAREER_ANALYTICS_ACTIVE_HANDOFF.md",active],["NEXT_TASK.md",next]]){
  assert.match(text,/IMMEDIATE NEXT TASK AFTER FULL STUDY/i,`${name} must expose the mandatory immediate-next-task boundary after the Analytics promotion.`);
}

assert.match(active,/FIRST ENGINEERING TASK: preserve the sealed production boundary/i,"Closed Analytics handoff must advance its first engineering task from PR validation to preserving the proven production boundary.");
assert.match(active,/PR #59 is no longer an implementation task[\s\S]+production-proven/i,"Closed Analytics handoff must distinguish completed production work from future implementation authorization.");
assert.match(active,/Failure 7[\s\S]+transient\/offscreen rendered-text assertion issue/i,"Closed Analytics handoff must retain the final Trophy Room failure classification rather than erasing the validation history.");
assert.match(active,/a0aa98e3b24d73ca51dde7d1ebf0856550a0c7e1[\s\S]+All 13 normal pull-request workflow families passed/i,"Closed Analytics handoff must retain exact-head PR proof.");
assert.match(active,/c5c7d50cc3a2d9003e057d1813744c877323c068[\s\S]+deployed-site-smoke job `94855938131`/i,"Closed Analytics handoff must retain exact runtime merge and deployed proof.");

// Live authority advances with evidence. Historical product-chain assertions remain protected.
assert.match(next,/CURRENT OVERRIDE — STAGE 4 RECONCILIATION PRODUCTION-PROVEN/i,"NEXT_TASK must expose the current reconciliation-proven authority.");
assert.match(next,/Status:[\s\S]+v1\.8\.1 \/ 1\.8\.1-r3[\s\S]+STAGE 5 STILL LOCKED/i,"NEXT_TASK must preserve current runtime and Stage 5 lock truth.");
assert.match(next,new RegExp("RJR-1 `"+readiness.currentScore+"\\/100`","i"),"NEXT_TASK must report the score from the live fixed RJR ledger rather than a stale literal.");
assert.match(next,/Production runtime remains `1\.8\.1-r3`[\s\S]+does not change production runtime bytes[\s\S]+Firestore Security Rules[\s\S]+canonical local storage/i,"NEXT_TASK must preserve the unchanged production runtime and Rules boundary for the completed proof-only predecessor lane.");
assert.match(next,/OWNER_PRODUCTION_STAGE4_REMOTE_TO_LOCAL_RECONCILIATION_PROOF_2026-08-25\.md/i,"NEXT_TASK must point to the canonical current owner reconciliation proof.");
assert.match(next,/exact accepted-result idempotency replay[\s\S]+evidence-proven[\s\S]+revision 0[\s\S]+revision 1[\s\S]+original accepted revision 0[\s\S]+original accepted content hash/i,"NEXT_TASK must preserve the closed exact accepted-result replay boundary.");
assert.match(next,/no duplicate receipt[\s\S]+canonical local Save Library snapshot remains unchanged[\s\S]+same-key\/different-fingerprint[\s\S]+other owner[\s\S]+stale[\s\S]+CAS/i,"NEXT_TASK must preserve replay uniqueness, local-state safety, authorization and CAS invariants.");
assert.match(next,/deterministic adverse-provider[\s\S]+registered-device[\s\S]+exactly-two-owner[\s\S]+canonical local Save Library[\s\S]+byte-for-byte unchanged/i,"NEXT_TASK must preserve deterministic adverse-provider safety.");
assert.match(next,/prior 80 → 81 \+1 credits only deterministic adverse-provider failure safety/i,"NEXT_TASK must preserve the bounded prior adverse-provider credit.");
assert.match(next,new RegExp("Fixed RJR-1 is now `"+readiness.currentScore+"\\/100`[\\s\\S]+new 81 → 82 \\+1 credits only deterministic App Check token-lifecycle safety","i"),"NEXT_TASK must preserve the bounded latest token-lifecycle credit.");
assert.match(next,/Production-negative authorization audit result[\s\S]+third-account[\s\S]+revoked registered-device[\s\S]+legitimate authenticated production identity\/device state/i,"NEXT_TASK must retain the real blocked production authorization dependency without fabricating proof.");
assert.match(next,/token-lifecycle hardening[\s\S]+token auto-refresh[\s\S]+expiry\/refresh transition[\s\S]+proven/i,"NEXT_TASK must preserve the newly proven lifecycle boundary.");
assert.match(next,/IMMEDIATE NEXT TASK AFTER FULL STUDY[\s\S]+Finish PR #160[\s\S]+publication/i,"NEXT_TASK must route the current bounded lane into publication rather than repeating proof.");
assert.match(next,/Two-physical-network behavior remains separately uncredited/i,"NEXT_TASK must distinguish deterministic proof from real two-network hardening.");
assert.match(next,/Do not repeat the Stage 4 remote-to-local destructive Apply/i,"NEXT_TASK must forbid redundant destructive reconciliation proof.");
assert.match(next,/Do not repeat exact replay proof/i,"NEXT_TASK must forbid redundant replay work after the permanent gate owns it.");
assert.match(next,/Do not repeat deterministic adverse-network proof/i,"NEXT_TASK must forbid redundant adverse-provider proof after the permanent gate owns it.");
assert.match(next,/Do not repeat deterministic token-lifecycle proof/i,"NEXT_TASK must forbid redundant lifecycle proof after the permanent gate owns it.");
assert.match(next,/Installable Offline App[\s\S]+local-first startup and recovery baseline/i,"NEXT_TASK must preserve the offline recovery baseline while connected work advances.");
assert.match(next,/App Check enforcement remains OFF/i,"NEXT_TASK must preserve the App Check enforcement lock.");
assert.match(next,/after all required tests[\s\S]+merge and deploy without repeatedly asking for approval/i,"NEXT_TASK must preserve standing owner publication authorization with gate conditions.");
assert.equal(readiness.modelVersion,"RJR-1","RJR authority must remain on the fixed model.");
assert.ok(Number.isInteger(readiness.currentScore)&&readiness.currentScore>=82&&readiness.currentScore<=100,"The fixed RJR authority must not regress below the evidence-proven token-lifecycle checkpoint.");
assert.equal(bootstrap.remoteJoiningReadiness?.score,readiness.currentScore,"The SLE bootstrap must agree exactly with the live RJR ledger.");
assert.match(bootstrap.starter?.version||"",/^\d+\.\d+\.\d+$/,"The repository SLE bootstrap starter must carry a semantic patch version.");
assert.ok(bootstrap.starter?.canonical?.includes(`V${bootstrap.starter.version}_`),"The SLE bootstrap starter version must agree with its canonical versioned filename.");
assert.ok(bootstrap.starter?.projectMirror?.endsWith(bootstrap.starter.canonical),"The SLE bootstrap starter mirror must preserve the same versioned filename as the canonical starter.");
assert.equal(bootstrap.immediateNextTask?.name,"stage4-token-lifecycle-hardening","The SLE bootstrap must keep ownership of PR #160 until its publication checkpoint closes.");
assert.match(bootstrap.currentLane,/PR #160[\s\S]+token-lifecycle[\s\S]+82\/100[\s\S]+publication[\s\S]+deployment/i,"The SLE bootstrap current lane must agree that lifecycle proof is green at RJR82 and publication/deployment is pending.");
assert.match(reconciliationProof,/Gate result[\s\S]+PASS/i,"Canonical owner evidence must record the Stage 4 reconciliation gate as passed.");
assert.match(reconciliationProof,/sha256:22bc1bea2833533a978ddfb0a6092b8279d40109234606da762d14cc359ccf3d/i,"Canonical owner evidence must retain the exact reviewed remote gameplay hash.");

// Historical local product slices remain immutable in the archived pre-r3 authority.
assert.match(historicalNext,/Authorized product candidate:[\s\S]{0,120}v1\.5\.0[\s\S]{0,120}1\.5\.0-r1/i,"Archived NEXT_TASK must preserve v1.5.0 / 1.5.0-r1 bounded product-candidate history.");
assert.match(historicalNext,/Historical reconciliation authorized product candidate:\s*none/i,"Archived NEXT_TASK must retain the earlier no-product-candidate reconciliation state as provenance.");
assert.match(historicalNext,/Phase C first slice[\s\S]{0,160}(PR #73|production-proven|closed)/i,"Archived NEXT_TASK must name Phase C first slice (PR #73) as closed / production-proven.");
assert.match(historicalNext,/Phase B first slice — Save Library \/ Local Profile Experience 2\.0 \(PR #70/i,"Archived NEXT_TASK must name Phase B first slice (PR #70) as closed / production-proven.");
assert.match(historicalNext,/65b6c9db0a070b6e5e992a39dffeee23df0c6f08/i,"Archived NEXT_TASK must record the live main feature-merge SHA for PR #70.");
assert.match(historicalNext,/dec1d3ba8182c3f62019974dd1704c7c9124def6/i,"Archived NEXT_TASK must record the Phase C first-slice PR #73 production merge.");
assert.match(historicalNext,/formatVersion 2 full multi-Save backup\/import portability \(PR #67\)/i,"Archived NEXT_TASK must preserve formatVersion 2 multi-Save portability history.");
assert.match(historicalNext,/Local Profile display-label editing[\s\S]+Identity-Safe Career Analytics[\s\S]+formatVersion 2 full multi-Save/i,"Archived NEXT_TASK must preserve the completed local dependency chain.");
assert.match(historicalNext,/publish under standing owner authorization[\s\S]+reassess the fresh WEC/i,"Archived NEXT_TASK must retain standing publication authority and fresh-WEC continuation history.");
assert.match(historicalNext,/After the candidate is fully published[\s\S]+If WEC permits continuation[\s\S]+smallest remaining dependency-gated Stage 2 prerequisite/i,"Archived NEXT_TASK must preserve the historical post-publication dependency ordering.");
assert.match(standingAuth,/standing[\s\S]+merge[\s\S]+deploy/i,"Standing owner authorization must remain the publication authority for validated current and future project PRs.");
assert.match(historicalNext,/Current production application version:\s*`v1\.4\.0`/i,"Archived NEXT_TASK must preserve v1.4.0 production history for the v1.5.0 candidate era.");
assert.match(historicalNext,/Current production Installable Offline App runtime: `1\.4\.0-r2`/i,"Archived NEXT_TASK must preserve the historical production runtime 1.4.0-r2.");
assert.match(historicalNext,/Immediate candidate rollback\/recovery runtime: `1\.4\.0-r2`/i,"Archived NEXT_TASK must preserve the v1.5.0-r1 candidate's immediate recovery target.");
assert.match(historicalNext,/Previously recorded pre-r2 fallback knowledge: `1\.4\.0-r1`/i,"Archived NEXT_TASK must preserve older 1.4.0-r1 fallback knowledge.");
assert.match(historicalNext,/Public community features and global leaderboard\/rankings are (?:\*\*)?ELIMINATED(?:\*\*)?/i,"Archived NEXT_TASK must retain the permanent ELIMINATED public community / global leaderboard lock.");
assert.match(historicalNext,/Private Remote Joining[\s\S]+PRIORITIZED LONG-TERM[\s\S]+DEPENDENCY-GATED[\s\S]+NOT YET IMPLEMENTATION-AUTHORIZED/i,"The dated owner amendment must lock the new Remote Joining classification.");
assert.match(historicalNext,/Cloud \/ synchronization readiness[\s\S]+private account \/ authentication \/ authorization[\s\S]+paired-device \/ private-session[\s\S]+Connected Rivalry[\s\S]+Private Remote Joining/i,"Archived NEXT_TASK must preserve the ordered Remote Joining prerequisite path.");
assert.match(remotePriority,/Supersedes:[\s\S]+earlier classification of private remote joining as `BLOCKED`/i,"The dated owner amendment must explicitly supersede only the former Remote Joining BLOCKED classification.");
assert.match(remotePriority,/PRIORITIZED LONG-TERM \/ DEPENDENCY-GATED \/ NOT YET IMPLEMENTATION-AUTHORIZED/i,"The owner amendment must lock the new Remote Joining classification.");
assert.match(start,/identity-safe longitudinal Career Analytics \/ Trophy Room correction — PR #59/i,"Developer bootstrap must include PR #59 in the completed dependency chain.");
assert.match(start,/presentation-only Local Profile display-label editing — PR #61/i,"Developer bootstrap must include PR #61 in the completed dependency chain.");

console.log(`Handoff immediate-next-task contracts passed: live NEXT_TASK and SESSION_BOOTSTRAP track fixed RJR ${readiness.currentScore}/100, preserve Stage 4 reconciliation/exact replay/adverse-provider closure and proven token lifecycle, and route current work into PR #160 publication while production identity/device negatives and real two-network proof remain explicit.`);

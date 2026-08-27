# Successor Handoff — PR #160 Token Lifecycle / v1.8.1-r4 Production-Proven — SLE

Date: 2026-08-27 ET
SLE = Smart Lean Efficient
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
Application: `v1.8.1`
Production runtime: `1.8.1-r4`
Immediate whole-shell recovery runtime: `1.8.1-r3`
Remote Joining readiness: `82/100` under fixed RJR-1
Predecessor environment: `we-2026-08-27-stage4-token-lifecycle-rjr-be07`

## Read this as orientation, not authority

This handoff is a compact recursive orientation layer. Current source, live GitHub, provider/deployment evidence, `NEXT_TASK.md`, `PROJECT_STATE.md`, `REMOTE_JOINING_READINESS.json`, `SESSION_BOOTSTRAP.json`, and a freshly initialized successor WEC win if anything here becomes stale.

The successor must independently fetch current `main`, current PR/branch state, workflow/deployment state, production runtime, and the live authority files before substantial implementation. Do not inherit the predecessor WEC decision as the successor's own decision.

## Exact completed boundary

PR #160 `Harden Stage 4 App Check lifecycle` is merged and production-proven.

- Final exact PR head: `9b39d9b6032eb24ef98a252ec7de13e129443c95`.
- All 14 permanent PR workflow families succeeded on that unchanged head.
- Submitted reviews before merge: 0.
- Inline review threads before merge: 0.
- Mergeability before merge: true.
- Expected-head squash merge/live runtime main: `2964527c4f7fc80b16d6d5ce73bd4f5823487d2c`.
- Live `main` was independently verified at that exact SHA before this SLE package began.
- Exactly 15 post-merge push/deployment runs were present on that head; all completed with non-null conclusions, with no failure, cancellation, queued or in-progress run at final verification.
- Pages run `33035579363`: SUCCESS.
- Release Integration Burn-In run `33035579462`: SUCCESS; both independent stateful integration passes succeeded.
- Stability run `33035579438`: SUCCESS.
  - stability contracts job `98397439119`: SUCCESS.
  - Chromium Stability job `98397532686`: SUCCESS through canonical runtime, Save Library, offline lifecycle and complete integration journey.
  - deployed-site smoke job `98397917248`: SUCCESS.

Canonical production proof: `V1.8.1_R4_PRODUCTION_PROOF.md`.

## What PR #160 genuinely proved

The new capability is deterministic App Check token-lifecycle safety, not generic CI or release volume.

The candidate/now-production runtime keeps Firebase App Check auto-refresh SDK-owned via `isTokenAutoRefreshEnabled: true`. The runtime observes lifecycle results through Firebase `onTokenChanged` and exposes one bounded explicit `getToken(appCheck, true)` refresh path for deterministic proof. It adds no custom refresh scheduler.

Permanent `tests/contracts/stage4-token-lifecycle-contracts.cjs` passed on exact proof head `ac465bc781b038860f91620debb7ae7fc7a3e05d`. It proves:

- a distinct later expiry transition;
- duplicate same-expiry dedupe;
- bounded force-refresh success;
- bounded provider refresh failure;
- metadata-only observer failure;
- raw-token redaction;
- preservation of existing Auth/Firestore service identity;
- unchanged Connected Rivalry authority;
- byte-identical canonical local Save state;
- App Check enforcement remains OFF.

Deployed r4 then passed runtime-byte equality, production App Check token-path proof, Save Library, manager identity linkage, identity-safe Career Analytics, Candidate A/B/C, offline/install, and the complete deployed journey.

## Fixed RJR truth

Fixed RJR-1 is `82/100`.

The exact recent provenance is:

- r3 owner account recovery restored two previously invalidated credits: 76 → 78;
- production remote-to-local reconciliation added exactly +1: 78 → 79;
- exact accepted-result idempotency replay added exactly +1: 79 → 80;
- deterministic adverse-provider failure safety added exactly +1: 80 → 81;
- deterministic App Check token-lifecycle safety added exactly +1: 81 → 82;
- PR #159 continuity publication earned zero;
- PR #160 packaging, 14/14 CI, merge and deployment earn zero duplicate credit.

Current fixed domains remain:

- deterministic sync/recovery: 20/20;
- identity/auth/trust: 18/20;
- production cloud/security: 19/20;
- devices/pairing/Connected Rivalry/actual Remote Joining: 20/30;
- real-device hardening/stable release: 5/10.

Do not move the score for source work, PR count, WEC/SLE work, documentation, repeated subassertions or already-consumed owner proof. Move it only when new evidence materially closes a fixed-domain capability.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

The successor must independently study current evidence and choose the smallest genuinely unblocked Remote Joining dependency. Do not automatically choose a blocked owner-dependent proof merely because it is listed here.

Still uncredited includes:

- authenticated third-account / revoked registered-device production negatives. PR #157 established that current repository/GitHub execution cannot honestly production-prove those named cases without legitimate authenticated production identity/device state. Synthetic attempts are non-evidence.
- two-physical-network behavior. Two physical devices have already been proven; the remaining network diversity boundary is separate.
- actual Remote Joining host/join/session orchestration. Stage 5 remains locked until all explicit pre-Stage-5 hardening gates genuinely close.
- real-device token-lifecycle acceptance.
- abuse hardening.
- production rollback proof.
- final stable Remote Joining release acceptance.

The successor should first verify whether any pre-Stage-5 gate can be closed without owner recreation/destructive repetition. If none is genuinely unblocked, record that truth and choose the next authorized smallest safe dependency from current live authority rather than manufacturing evidence.

## Do not repeat

Do not repeat already-consumed work merely for confidence or CI volume:

- the consumed `pair_` + 64-zero unavailable-code owner fixture;
- account/pairing/device recreation without a concrete new dependency;
- the historical `pair_a07108...756fb` rivalry, whose original local profile/save identities were deleted; do not force, edit or delete it;
- Stage 4 destructive remote-to-local Candidate C Apply;
- exact accepted-result idempotency replay proof;
- deterministic adverse-provider proof;
- deterministic token-lifecycle proof.

## Permanent locks

These remain non-negotiable unless a later explicit owner instruction changes them:

- exactly two private managers;
- canonical browser storage exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`;
- `careerModeShowdown.activeShowdown` is non-canonical migration/recovery compatibility only;
- Candidate A remains non-mutating export;
- Candidate B remains read-only analysis;
- Candidate C remains the sole destructive remote-to-local Apply authority, with strict exact raw snapshot authority, immutable intent, backup-before-Apply, transaction-owned mutation, stale/anti-clobber rejection, ownership-scoped rollback and exact recovery verification;
- Firebase Spark / zero billing;
- Firestore memory-only, persistent cache disabled;
- Google Auth popup-only with `browserSessionPersistence` and no extra scopes;
- App Check enforcement OFF;
- trusted-runtime IAM reviewed but unactivated/unbroadened;
- no public discovery, community, matchmaking or global rankings;
- Installable Offline App remains local-first recovery/startup baseline;
- Stage 5 host/join/session orchestration stays locked until remaining explicit pre-Stage-5 gates close.

## Work Environment Continuity rules

The predecessor environment reached its mandatory transition point after completing PR #160 production proof. Its final WEC seal belongs only to the predecessor.

Successor sequence:

1. Independently fetch live `main` and verify the current repository/provider/deployment state.
2. Validate the predecessor WEC/final package as historical facts only.
3. Preserve/archive those final facts.
4. Create a fresh unique successor environment ID.
5. Reset all per-environment counters/observations; never copy predecessor corrected-failure/evidence counters as fresh observations.
6. Record the independently verified live-main SHA as the fresh environment's `startingMainSha`.
7. Assess the fresh WEC using the repository evaluator.
8. Obey the successor's own `CONTINUE` / `PREPARE_HANDOFF` / `HANDOFF_AT_CHECKPOINT` / `HANDOFF_NOW` decision.
9. If it says CONTINUE, advance the smallest owner-prioritized real Remote Joining dependency rather than creating a continuity-only sidequest.

Usage remains unknown unless an approved current-session value is actually exposed. Never fabricate usage.

## Recursive SLE package

Canonical starter: `START_NEXT_SESSION_V1.4.23_PR160_R4_PRODUCTION_POSTMERGE_GREEN.md`
Mirror: `project-documents/session-starts/START_NEXT_SESSION_V1.4.23_PR160_R4_PRODUCTION_POSTMERGE_GREEN.md`

Canonical full handoff: `SUCCESSOR_HANDOFF_POST_PR160_TOKEN_LIFECYCLE_R4_PRODUCTION_SLE_2026-08-27.md`
Mirror: `project-documents/handoffs/SUCCESSOR_HANDOFF_POST_PR160_TOKEN_LIFECYCLE_R4_PRODUCTION_SLE_2026-08-27.md`

Bootstrap: `SESSION_BOOTSTRAP.json`
Context graph: `SESSION_CONTEXT_GRAPH.json`
Context model: `SESSION_CONTEXT_MODEL.json`
Context learning: `SESSION_CONTEXT_LEARNING.json`
Live task: `NEXT_TASK.md`
Live state: `PROJECT_STATE.md`
RJR authority: `REMOTE_JOINING_READINESS.json`
WEC: `WORK_ENVIRONMENT_STATUS.json`

Root and project-document mirrors of the starter/full handoff must remain byte-identical.

## Standing authorization

Standing owner merge/deploy authorization remains active for current and future project PRs after all required tests and publication gates pass. Do not repeatedly ask for approval. A later explicit owner instruction overrides this standing authorization.

## Owner reporting rule

Every substantive successor checkpoint must visibly report exactly these seven lines in this order:

Handoff proximity: X%
Remote Joining readiness: ~Y%
Current lane: ...
Concrete dependency completed: ...
Next unlock: ...
Blocker: ...
Sidequest check: ...

At successor Handoff proximity 100%, generate the next complete mirrored recursive SLE package, seal its WEC as the final branch mutation, provide the owner a short repo-first prompt, and stop before starting another substantial milestone.

## Ready-to-paste repo-first successor prompt

Open the live repository `nikahanghojjati-oss/fifa17-career-showdown2` and read `START_NEXT_SESSION_V1.4.23_PR160_R4_PRODUCTION_POSTMERGE_GREEN.md` first. Follow its SLE/deep references as needed. Independently verify current live `main`, PR #160 post-merge state, production runtime/deployment, `REMOTE_JOINING_READINESS.json`, `NEXT_TASK.md`, `PROJECT_STATE.md`, `SESSION_BOOTSTRAP.json`, and the closing WEC. Treat all handoff material as orientation only; current source, live GitHub/provider/deployment evidence and current owner instructions win. Validate/archive the predecessor WEC, initialize a fresh unique WEC with reset counters, and obey the fresh assessment. Fixed RJR-1 is 82/100 after production-proven `v1.8.1 / 1.8.1-r4` deterministic App Check token-lifecycle safety; do not repeat consumed owner/device/destructive/replay/adverse-provider/token-lifecycle proof. Select the smallest genuinely unblocked remaining Remote Joining dependency from live evidence, preserve all permanent locks, keep Stage 5 locked until its explicit preconditions genuinely close, and continue toward RJR 100.
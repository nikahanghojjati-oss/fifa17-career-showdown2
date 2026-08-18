# Career Mode Showdown — Current Handoff

Last updated: 2026-08-18 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

This is the concise rolling handoff and evidence trail. Current verified source and later owner instructions override every historical statement. `PROJECT_STATE.md` owns deployed product state and `NEXT_TASK.md` is the sole primary owner of bounded implementation authorization. Every successor must enter the repository Work Environment Continuity (WEC) loop before substantial work.

## Current production boundary

Application: v1.4.0 — Product Deepening
Package: `1.4.0`
Installable Offline App runtime: `1.4.0-r1`
Immediate previous known-good whole shell: `1.3.0-r2`

Production Firebase remains disconnected. No production Auth account, Firestore gameplay data, deployed production Security Rules, Cloud Function, Firebase Admin runtime, service-account credential, trusted mutation gateway or Blaze billing exists.

Every application-client Firestore create/update/delete remains denied. Persistent Firestore offline cache remains disabled. Project-owned immutable `baseRevision`, explicit stale conflict, replay/idempotency, tombstone, reconnect and Candidate C local Apply semantics remain authoritative.

## Completed connected dependency chain

Cloud/Sync Readiness Phase 1A through 1F: DONE.

Stage 2A — Firebase Auth Emulator Identity Boundary — DONE / MERGED / PROVEN through PR #83, exact validated head `a4022d6f316622f73ead9aacde812b545b8dcf78`, squash merge `e39c1b0689598ac922569ff839ca30a1d5dee5fa`.

Stage 2B — Provider Session Lifecycle & Revocation Boundary — DONE / MERGED / PROVEN through PR #84, exact validated head `d6786d9d3f65a329aaf3607c3eb3d3d357983c5f`, squash merge `c4feadb69fb5e26eba19fa520afa0a09baf1de03`.

Stage 2C — Production Authentication Policy & Static-Hosting Compatibility Boundary — DONE / MERGED / PROVEN through PR #85, exact validated head `48aa61a8d1b26f2c621cf7f0b410c68e0418257a`, squash merge `22566e1409cf53d728b38d0b5a19de478ae6761b`.

PR #86 — Handoff Proximity governance synchronization — DONE / MERGED / PROTECTED, exact validated head `15cfa82d9aa74db1275968ed3bc1e42669ab23ec`, squash merge `1794f1f86968781b898d000360d1fb56234fb92f`.

PR #87 — post-PR #86 authority reconciliation — DONE / MERGED / PROVEN, exact validated head `2415c156161b6244c75e49917bad28efed957adf`, squash merge `0accb827fa91f86fdd28e63590bd4843267546ae`.

Stage 2D — Production Firebase Environment & Configuration Preflight — DONE / MERGED / PROVEN through PR #88.

Exact PR #88 validated head: `f019c6c6c39385fcb1f76f3de240fd73bb972e49`.
Squash merge / independently verified live-main completion boundary: `0fd0ac3651a4b8c78957242b645e095a3c151c9d`.

All 13 normal workflow families passed on that exact unchanged PR #88 head; submitted reviews and inline review threads were empty. Stage 2D changed no production runtime or dependency and did not connect production Firebase.

Do not repeat Stages 2A, 2B, 2C or 2D, PR #86 or PR #87.

## Current Stage 2E bounded prerequisite

Current branch: `agent/private-auth-stage2e-account-bootstrap`.
Fresh environment: `we-2026-08-18-stage2e-account-bootstrap`.
Starting verified live main: `0fd0ac3651a4b8c78957242b645e095a3c151c9d`.
Current PR: #89 `Private Auth Stage 2E trusted account bootstrap`, still draft until one immutable final exact head satisfies the full publication gate.

Stage 2E — Trusted Application Account Bootstrap & Lifecycle Boundary — is CURRENT / IMPLEMENTATION-AUTHORIZED / EMULATOR-TEST-ONLY / PRODUCTION FIREBASE DISCONNECTED.

Detailed authority: `PRIVATE_ACCOUNT_AUTH_STAGE_2E.md` and `NEXT_TASK.md`.

Implemented branch scope:

1. dormant `js/trustedAccountBootstrap.js` decision model with no Firebase, network, storage or production runtime dependency;
2. trusted provider `uid` is the only authority for architecture `accountId`;
3. a missing `accounts/{uid}` produces exactly one initial create plan with revision 0 and application status `active`;
4. a valid existing same-UID account in `active`, `disabled` or `deletion-pending` state produces an idempotent no-write `existing` decision;
5. sign-in/bootstrap never reactivates a disabled account or cancels deletion-pending state;
6. missing provider identity, UID/path mismatch, stored identity conflict and malformed account schema fail closed without overwrite;
7. real Authentication plus Firestore Emulator proof uses Web Auth synthetic users and test-only Admin Auth to observe provider UID, while browser client account create/update/delete remain denied by unchanged Security Rules;
8. the permanent Stage 2E contract and existing Static App emulator lane protect the proof without adding a workflow block or increasing its seven-minute timeout.

Stage 2E does not create or connect a real production Firebase project, real Firebase user, production account UI, production Admin/server runtime, Cloud Function, billing, device registration, pairing, Connected Rivalry or Remote Joining.

Publication diagnostics so far:

- diagnostic head `a56b1205e5bd9d59be6ffc85358669f47429d7cd` failed the permanent global JavaScript function-name uniqueness contract because the new dormant module reused Stage 2D's internal helper name `isRecord`; the new helper alone was renamed and the uniqueness contract was not weakened;
- corrected head `01189377d693cc3d2ae962f0eac0e22c275592a3` made the dynamic static release contract pass and produced 11 green workflow families, but Stability and Static App stopped on an older Stage 2B authority contract because the rolling handoff rewrite had removed an exact protected Handoff Proximity provenance phrase;
- the protected historical provenance wording is restored below without weakening the Stage 2B contract;
- both diagnostic heads are permanently ineligible for merge after subsequent branch mutation.

## Current WEC state

Three successor-context compactions have now occurred. The third occurred after the last repository status record and must be included in the final publication seal.

The latest repository-recorded deterministic assessment is `PREPARE_HANDOFF`. Current evidence is stricter because of the third compaction and two corrected branch/coherence findings. The final WEC status seal must recalculate from all observable evidence before the immutable final-head gate.

Account/model usage remains unavailable and is not estimated.

This environment may finish only the already-bounded Stage 2E publication checkpoint. Do not begin Stage 2F, Stage 3 or another separate milestone here.

## Handoff Proximity governance

Every substantive owner-facing project response must visibly include `Handoff proximity: X%`. Unavailable account/model usage is never fabricated. At `Handoff proximity: 100%`, automatically generate the complete successor handoff, finish only the current safe bounded checkpoint and stop before another substantial milestone. Stricter WEC decisions remain authoritative, and every generated successor handoff recursively preserves the same rule.

## Permanent authentication/security locks

Stage 2C permanently selects Google federated sign-in through `GoogleAuthProvider`, explicit-user-gesture `signInWithPopup()` on the current GitHub Pages topology and explicit `browserSessionPersistence`. `signInWithRedirect()` remains unauthorized. No extra Google OAuth scopes or deliberate provider access-token retrieval/persistence are authorized.

Firebase Auth `uid` is architecture `accountId` but remains separate from `profileId`, `saveId`, `seasonId`, `deviceId`, `installationId`, `rivalryId` and `sessionId`.

The Authentication Emulator proof does not establish final production `checkRevoked` behavior. Production elevated Admin/server Firestore operations require a separately reviewed trusted server/IAM boundary because server access bypasses Firestore Security Rules.

## Permanent product and recovery locks

Private Remote Joining remains PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED.

Ordered path:

Cloud / synchronization readiness — DONE through Phase 1F
→ private account / authentication / authorization — CURRENT Stage 2 lane / Stage 2A DONE / Stage 2B DONE / Stage 2C DONE / Stage 2D DONE / Stage 2E CURRENT
→ paired-device / private-session capability — blocked Stage 3
→ Connected Rivalry — blocked Stage 4
→ Private Remote Joining — final destination.

Public discovery, public profiles, public matchmaking, community systems and global leaderboard/rankings remain eliminated.

Exactly two managers remain authoritative. Same selected league, different permanent clubs. Showdown lengths `1 / 3 / 5 / 10`. Maximum Season score `11`. Equal non-zero score is a Draw; only 0–0 uses league position then league points.

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the sole destructive import Apply authority with strict exact raw snapshot/preconditions, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber checks, exact verification, byte-for-byte rollback verification, corrupt-byte preservation and critical recovery.

Canonical storage remains exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

No Auth/cloud/sync module may directly own canonical `localStorage`.

## Historical contract provenance

The following lines preserve permanent historical transition evidence only. They are not current implementation authority.

Handoff Proximity governance checkpoint — DONE / MERGED / PROTECTED.
Post-PR #86 authority reconciliation — DONE / MERGED / PROVEN.
Historical pre-PR #88 wording: Current Stage 2D bounded prerequisite.
Historical Stage 2D status: Stage 2D — Production Firebase Environment & Configuration Preflight — is CURRENT / IMPLEMENTATION-AUTHORIZED / NON-RUNTIME / PRODUCTION FIREBASE DISCONNECTED.
Historical Stage 2D WEC wording: the fresh WEC assessment is currently `PREPARE_HANDOFF`.

A direct profile-ID key swap is not sufficiently correct because longitudinal Analytics also needed to exclude unresolved historical manager roles while retaining identity-independent Showdown and Season totals.

Failure 7 in historical PR #59 validation was a transient/offscreen rendered-text assertion issue rather than a product data-corruption finding. The offscreen Trophy cabinet rendered-text assertion evidence remains preserved so future developers do not erase the source-grounded classification that shaped the shipped Identity-Safe Career Analytics implementation.

Historical Stage 2A status before PR #83 began was `AUTHORIZED NEXT PREREQUISITE / IMPLEMENTATION NOT STARTED`.

## Tooling boundary

Direct shell DNS to GitHub remains unavailable in this environment. Connector-backed GitHub source/write access and GitHub-hosted Actions are therefore the verified source/proof path. The repository-owned GitHub CLI bootstrap remains protected for environments where routing permits it. Never copy connector credentials into local configuration.

The predecessor PR #88 tooling limitations and corrected non-runtime findings are archived append-only in `WORK_ENVIRONMENT_HISTORY.md`.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

Finish and publish only PR #89 / Stage 2E:

1. preserve production v1.4.0 / `1.4.0-r1` and keep production Firebase disconnected;
2. preserve every application-client Firestore write denial, Candidate A/B/C, canonical local storage, identity, gameplay and performance lock;
3. require a diagnostic complete contract/emulator pass after the current provenance correction;
4. then seal the final WEC state as the final branch mutation;
5. require the complete contract suite plus all 13 normal workflow families on that exact unchanged final head;
6. verify clean submitted reviews, clean inline review threads, mergeability and unchanged exact head immediately before merge;
7. mark ready only after the gate, then squash merge with expected-head protection;
8. independently verify the resulting live `main`, reassess WEC and transition;
9. do not begin another Stage 2 milestone because this environment is already handoff-bound.

Do not create or connect real production Firebase during Stage 2E. Do not begin Stage 3 pairing, Connected Rivalry or Remote Joining, and do not repeat Phase 1F, PR #82, Stage 2A / PR #83, Stage 2B / PR #84, Stage 2C / PR #85, Handoff Proximity governance / PR #86, reconciliation / PR #87 or Stage 2D / PR #88.

# Career Mode Showdown — Current Handoff

Last updated: 2026-08-18 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

This is the concise rolling handoff and evidence trail. Current verified source and later owner instructions override every historical statement. `PROJECT_STATE.md` owns deployed product state and `NEXT_TASK.md` owns bounded implementation authorization. Every successor must enter the repository Work Environment Continuity (WEC) loop before substantial work.

## Current production boundary

Application: v1.4.0 — Product Deepening
Package: `1.4.0`
Installable Offline App runtime: `1.4.0-r1`
Immediate previous known-good whole shell: `1.3.0-r2`

PR #81 completed Cloud/Sync Readiness Phase 1F from exact validated head `0bdbe2e8c0dc36901361a8aa15056c6af3f5e70d` to squash merge `231556d86a93535fa90e173577c1159de4f40be0`.

PR #82 synchronized the completed Phase 1F boundary and authorized Stage 2A from exact validated head `8f1fb4d4c9324947815936b21c6bc29a657a94b7` to squash merge `87ea27a8dd28a041f973a3ba42312ff9e78ba74d`.

PR #83 completed Stage 2A from exact validated head `a4022d6f316622f73ead9aacde812b545b8dcf78` to squash merge `e39c1b0689598ac922569ff839ca30a1d5dee5fa`.

PR #84 completed Stage 2B from exact validated head `d6786d9d3f65a329aaf3607c3eb3d3d357983c5f` to squash merge `c4feadb69fb5e26eba19fa520afa0a09baf1de03`.

PR #85 completed Stage 2C from exact validated head `48aa61a8d1b26f2c621cf7f0b410c68e0418257a` to squash merge `22566e1409cf53d728b38d0b5a19de478ae6761b`.

PR #86 completed the owner-mandated Handoff Proximity governance synchronization and Stage 2C current-authority seal. Exact validated head: `15cfa82d9aa74db1275968ed3bc1e42669ab23ec`. Squash merge / independently verified live-main boundary: `1794f1f86968781b898d000360d1fb56234fb92f`. All 13 normal workflow families completed with success on the unchanged exact head; submitted reviews and inline review threads were both empty.

Production Firebase remains disconnected. No production Auth account, Firestore data, deployed production Security Rules, Cloud Function, Admin runtime, service-account credential or Blaze billing exists.

Every application-client Firestore write remains denied. The protected Phase 1D shared-state schema still does not expose the idempotency-key hash required for Security Rules to identify the matching sibling replay receipt. A trusted mutation gateway or separately reviewed schema/protocol change remains a later independent production-write gate.

Firestore persistent offline cache remains disabled. Project-owned immutable `baseRevision`, explicit stale conflict, replay/idempotency, tombstone, reconnect and Candidate C local Apply semantics remain authoritative.

## Completed Private Account / Authentication checkpoints

Stage 2A — Firebase Auth Emulator Identity Boundary — is DONE / MERGED / PROVEN through PR #83.

Stage 2B — Provider Session Lifecycle & Revocation Boundary — is DONE / MERGED / PROVEN through PR #84.

Stage 2C — Production Authentication Policy & Static-Hosting Compatibility Boundary — is DONE / MERGED / PROVEN through PR #85.

Stage 2C permanently selects Google federated sign-in through `GoogleAuthProvider`, `signInWithPopup()` from an explicit user gesture on the current GitHub Pages topology, explicit `browserSessionPersistence`, no extra Google OAuth scopes and no deliberate provider access-token retrieval/persistence. `signInWithRedirect()` remains blocked until a separately reviewed auth-domain/hosting compatibility boundary exists.

The Authentication Emulator proof does not establish every production in-flight ID-token invalidation timing detail or backend `checkRevoked` behavior. Final trusted production token verification remains a later Stage 2 gate.

Do not repeat Stage 2A, Stage 2B or Stage 2C.

## Handoff Proximity governance checkpoint — DONE / MERGED / PROTECTED

PR #86 `Protect Handoff Proximity governance and seal Stage 2C` is no longer an implementation task.

Exact base: `22566e1409cf53d728b38d0b5a19de478ae6761b`.
Exact validated head: `15cfa82d9aa74db1275968ed3bc1e42669ab23ec`.
Squash merge / verified live main: `1794f1f86968781b898d000360d1fb56234fb92f`.

The permanent repository rule now requires every substantive owner-facing project response to visibly include `Handoff proximity: X%`; unavailable account/model usage is never fabricated; at `Handoff proximity: 100%` the environment automatically generates the complete successor handoff, finishes only the current safe bounded checkpoint and stops before another substantial milestone; stricter WEC decisions remain authoritative; and generated successor handoffs recursively preserve the same rule.

Rejected exact heads `e2dbd8708cd01a48bfa619bd5780ec95110c13cf` and `6469a5cdcf8b3050e35071156c096ba5cdf7cc0f` remain permanently ineligible as merge authority. The final exact head `15cfa82d9aa74db1275968ed3bc1e42669ab23ec` corrected their source-coherence findings without weakening runtime behavior, Firebase Security Rules, Candidate C guarantees, timeouts or performance ceilings.

PR #86 changed no production runtime and required no semantic application version bump under `VERSIONING_POLICY.md`.

## Current bounded authority reconciliation

Current branch: `agent/post-pr86-authority-reconcile`.
Fresh environment: `we-2026-08-18-post-pr86-authority-reconcile`.
Starting verified live main: `1794f1f86968781b898d000360d1fb56234fb92f`.

The predecessor transition-prepared status was validated before replacement. Its `FINISH_SAFE_BOUNDARY` decision belonged only to the completed PR #86 publication boundary and was not inherited. Fresh per-environment signals were reset and the successor assessment is `CONTINUE` for this narrow non-runtime reconciliation.

This bounded reconciliation may only:

1. append PR #86 final publication facts to the Work Environment Continuity history;
2. synchronize current-facing authority from PR #86 current/draft wording to PR #86 DONE / MERGED / PROTECTED;
3. preserve the permanent Handoff Proximity governance and all existing production/security/recovery locks;
4. publish one exact-head non-runtime reconciliation PR;
5. after verified merge, reassess WEC before selecting or implementing a distinct Stage 2 engineering prerequisite.

No product runtime feature and no production Firebase connection is authorized by this reconciliation.

## Remaining Stage 2 direction

The full Private Account / Authentication / Authorization stage remains incomplete after Stage 2C.

Remaining concerns include production Firebase operational/project setup, production web-app/provider/authorized-domain configuration, safe application-account bootstrap/write lifecycle, trusted production token verification and revoked-token behavior, account export/deletion cascade, auth abuse/rate controls, production Security Rules deployment, provider outage/recovery behavior and the trusted production mutation boundary.

These are requirements, not automatic implementation order. After this narrow reconciliation is merged and live `main` is independently verified, complete the mandatory current-source and current primary Firebase/security-documentation study and select only the next smallest necessary Stage 2 prerequisite that materially advances the private Remote Joining dependency chain. Selection must be recorded before implementation begins.

## Permanent product and recovery locks

Private Remote Joining remains PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED.

Ordered path:

Cloud / synchronization readiness — DONE through Phase 1F
→ private account / authentication / authorization — CURRENT Stage 2 lane / Stage 2A DONE / Stage 2B DONE / Stage 2C DONE / remaining Stage 2 prerequisites pending
→ paired-device / private-session capability — blocked Stage 3
→ Connected Rivalry — blocked Stage 4
→ Private Remote Joining — final destination.

Public discovery, public profiles, public matchmaking, community systems and global leaderboard/rankings remain eliminated.

Exactly two managers remain authoritative. Same selected league, different permanent clubs. Showdown lengths `1 / 3 / 5 / 10`. Maximum Season score `11`. Equal non-zero score is a Draw; only 0–0 uses league position then league points.

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the sole destructive import Apply authority with strict exact raw snapshot/preconditions, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber checks, exact verification and critical recovery.

Canonical storage remains exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

No Auth/cloud/sync module may directly own canonical `localStorage`.

## Historical Analytics evidence retained for provenance

A direct profile-ID key swap is not sufficiently correct because longitudinal Analytics also needed to exclude unresolved historical manager roles while retaining identity-independent Showdown and Season totals.

Failure 7 in historical PR #59 validation was a transient/offscreen rendered-text assertion issue rather than a product data-corruption finding. The offscreen Trophy cabinet rendered-text assertion evidence remains preserved so future developers do not erase the source-grounded classification that shaped the shipped Identity-Safe Career Analytics implementation.

Historical Stage 2A status before PR #83 began was `AUTHORIZED NEXT PREREQUISITE / IMPLEMENTATION NOT STARTED`. It is historical provenance only.

## Tooling boundary

Direct shell DNS to GitHub remains unavailable in this environment. Connector-backed GitHub source/write access and GitHub-hosted CI are therefore the verified source/proof path. The repository-owned GitHub CLI bootstrap remains protected for environments where routing permits it. Never copy connector credentials into local configuration.

The predecessor's recoverable connector/tool-routing events remain historical and do not represent website runtime defects.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

First finish only the post-PR #86 current-authority reconciliation on `agent/post-pr86-authority-reconcile`:

1. preserve production v1.4.0 / `1.4.0-r1` and keep production Firebase disconnected;
2. append PR #86 final exact-head/merge/CI/review evidence to `WORK_ENVIRONMENT_HISTORY.md` without rewriting historical records;
3. synchronize `00_CURRENT_HANDOFF.md`, `PROJECT_STATE.md`, `NEXT_TASK.md`, `00_DEVELOPER_START_HERE.md` and current roadmap authority so PR #86 is DONE / MERGED / PROTECTED rather than current work;
4. keep every Handoff Proximity, Firestore-write denial, Candidate A/B/C, canonical storage, identity, gameplay and performance lock intact;
5. run the complete repository contract gate and all 13 normal workflow families on one exact unchanged reconciliation PR head;
6. require clean submitted reviews and inline threads plus mergeability;
7. squash merge only with expected-head protection and independently verify the new live `main`.

Only after that verified merge, reassess Work Environment Continuity, complete the remaining mandatory source study plus current primary Firebase/security documentation, and select exactly one next Stage 2 prerequisite. Do not implement the selected prerequisite until its authority is recorded. Do not begin Stage 3 pairing, Connected Rivalry or Remote Joining, and do not repeat Phase 1F, PR #82, Stage 2A / PR #83, Stage 2B / PR #84, Stage 2C / PR #85 or Handoff Proximity governance / PR #86.

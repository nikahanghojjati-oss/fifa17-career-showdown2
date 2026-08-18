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

PR #86 completed the Handoff Proximity governance synchronization from exact validated head `15cfa82d9aa74db1275968ed3bc1e42669ab23ec` to squash merge `1794f1f86968781b898d000360d1fb56234fb92f`.

PR #87 completed the narrow post-PR #86 authority reconciliation from exact validated head `2415c156161b6244c75e49917bad28efed957adf` to squash merge / independently verified Stage 2D starting main `0accb827fa91f86fdd28e63590bd4843267546ae`. All 13 normal workflow families passed on the unchanged PR #87 head; submitted reviews and inline review threads were empty.

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
Squash merge: `1794f1f86968781b898d000360d1fb56234fb92f`.

The permanent repository rule requires every substantive owner-facing project response to visibly include `Handoff proximity: X%`; unavailable account/model usage is never fabricated; at `Handoff proximity: 100%` the environment automatically generates the complete successor handoff, finishes only the current safe bounded checkpoint and stops before another substantial milestone; stricter WEC decisions remain authoritative; and generated successor handoffs recursively preserve the same rule.

PR #86 changed no production runtime and required no semantic application version bump under `VERSIONING_POLICY.md`.

## Post-PR #86 authority reconciliation — DONE / MERGED / PROVEN

PR #87 `Reconcile authority after Handoff Proximity governance merge` is complete and must not be repeated.

Exact validated head: `2415c156161b6244c75e49917bad28efed957adf`.
Squash merge / independently verified Stage 2D starting main: `0accb827fa91f86fdd28e63590bd4843267546ae`.

PR #87 changed no production runtime, preserved every security/recovery lock and deliberately left the next Stage 2 engineering prerequisite for a fresh successor to select.

## Current Stage 2D bounded prerequisite

Current branch: `agent/stage2-next-prerequisite`.
Fresh environment: `we-2026-08-18-stage2-next-prerequisite`.
Starting verified live main: `0accb827fa91f86fdd28e63590bd4843267546ae`.
Draft PR: #88 `Private Auth Stage 2D production Firebase preflight`.

The predecessor transition decision was not inherited. This environment validated and archived PR #87, initialized fresh observations and selected exactly one smallest Stage 2 prerequisite from current source plus current primary Firebase/security documentation.

Stage 2D — Production Firebase Environment & Configuration Preflight — is CURRENT / IMPLEMENTATION-AUTHORIZED / NON-RUNTIME / PRODUCTION FIREBASE DISCONNECTED.

Detailed authority: `PRIVATE_ACCOUNT_AUTH_STAGE_2D.md` and `NEXT_TASK.md`.

Stage 2D may only:

1. maintain a dormant deterministic preflight that is not loaded by the production application;
2. prove through synthetic contracts that safe future production metadata is accepted and dangerous/incomplete metadata fails closed;
3. reject demo-project identity, project mismatch, missing web config/domain planning, redirect authorization, durable local Auth persistence, unresolved Firestore location, persistent Firestore cache, credential material, direct client writes and public feature drift;
4. preserve the Stage 2C Google popup/session-persistence policy and all prior identity/recovery/security locks;
5. synchronize current-facing authority to PR #87 complete / Stage 2D current;
6. publish exactly one bounded non-runtime PR through the immutable exact-head validation gate.

Passing a synthetic Stage 2D fixture does not mean a real production Firebase project exists. Stage 2D does not create, register, provision, connect or deploy any production Firebase resource.

The fresh WEC assessment is currently `PREPARE_HANDOFF`. This permits finishing the already-bounded Stage 2D checkpoint but requires strengthened records and reassessment before any distinct later milestone.

## Remaining Stage 2 direction

The full Private Account / Authentication / Authorization stage remains incomplete.

After Stage 2D, remaining later concerns still include actual production Firebase operational/project setup, production web-app/provider/authorized-domain configuration, safe application-account bootstrap/write lifecycle, trusted production token verification and revoked-token behavior, account export/deletion cascade, auth abuse/rate controls, production Security Rules deployment, provider outage/recovery behavior and the trusted production mutation boundary.

These are requirements, not automatic implementation order. Stage 2D does not preselect the next later requirement.

## Permanent product and recovery locks

Private Remote Joining remains PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED.

Ordered path:

Cloud / synchronization readiness — DONE through Phase 1F
→ private account / authentication / authorization — CURRENT Stage 2 lane / Stage 2A DONE / Stage 2B DONE / Stage 2C DONE / Stage 2D CURRENT
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

The successor encountered one unsupported connector tag/release route and one corrected append-only history reconstruction wording defect. Neither is a website runtime defect.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

Finish only Stage 2D on `agent/stage2-next-prerequisite` / draft PR #88:

1. preserve production v1.4.0 / `1.4.0-r1` and keep production Firebase disconnected;
2. finish current-facing Stage 2D authority synchronization without turning it into a standalone side quest;
3. keep every Handoff Proximity, Firestore-write denial, Candidate A/B/C, canonical storage, identity, gameplay and performance lock intact;
4. require the complete contract suite and all 13 normal workflow families on one exact unchanged final PR #88 head;
5. require clean submitted reviews and inline threads plus mergeability;
6. squash merge only with expected-head protection and independently verify the new live `main`;
7. reassess WEC after the safe Stage 2D publication checkpoint;
8. begin no distinct later Stage 2 milestone in this environment if WEC requires transition.

Do not create or connect real production Firebase during Stage 2D. Do not begin Stage 3 pairing, Connected Rivalry or Remote Joining, and do not repeat Phase 1F, PR #82, Stage 2A / PR #83, Stage 2B / PR #84, Stage 2C / PR #85, Handoff Proximity governance / PR #86 or reconciliation / PR #87.

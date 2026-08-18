# Career Mode Showdown — Current Handoff

Last updated: 2026-08-18 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

This is the concise rolling handoff and evidence trail. Current verified source and later owner instructions override every historical statement. `PROJECT_STATE.md` owns deployed product state and `NEXT_TASK.md` owns bounded implementation authorization.

## Current production boundary

Application: v1.4.0 — Product Deepening
Package: `1.4.0`
Installable Offline App runtime: `1.4.0-r1`
Immediate previous known-good whole shell: `1.3.0-r2`

PR #81 completed Cloud/Sync Readiness Phase 1F from exact validated head `0bdbe2e8c0dc36901361a8aa15056c6af3f5e70d` to squash merge `231556d86a93535fa90e173577c1159de4f40be0`.

PR #82 synchronized the completed Phase 1F boundary and authorized Stage 2A from exact validated head `8f1fb4d4c9324947815936b21c6bc29a657a94b7` to squash merge `87ea27a8dd28a041f973a3ba42312ff9e78ba74d`.

PR #83 completed Stage 2A from exact validated head `a4022d6f316622f73ead9aacde812b545b8dcf78` to squash merge `e39c1b0689598ac922569ff839ca30a1d5dee5fa`.

PR #84 completed Stage 2B from exact validated head `d6786d9d3f65a329aaf3607c3eb3d3d357983c5f` to squash merge `c4feadb69fb5e26eba19fa520afa0a09baf1de03`.

PR #85 completed Stage 2C from exact validated head `48aa61a8d1b26f2c621cf7f0b410c68e0418257a` to squash merge / independently verified live-main boundary `22566e1409cf53d728b38d0b5a19de478ae6761b`. All 13 normal workflow families passed on that exact unchanged head before merge; submitted reviews and inline review threads were empty.

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

## Current governance synchronization checkpoint

Current branch: `agent/handoff-proximity-governance-sync`.
Fresh environment: `we-2026-08-18-handoff-proximity-governance-sync`.
Starting verified live main: `22566e1409cf53d728b38d0b5a19de478ae6761b`.

The inherited Stage 2C transition-prepared status was validated against current WEC source before replacement. PR #85 completion was independently verified, the predecessor decision was not inherited and a fresh successor record was initialized.

Fresh WEC assessment from recorded observable signals: `PREPARE_HANDOFF`. Usage remains unavailable and was not estimated. This permits finishing the already-bounded governance synchronization but requires strengthened records and reassessment before another distinct Stage 2 milestone.

The current task is non-runtime repository governance only:

1. every substantive owner-facing project response must visibly include `Handoff proximity: X%`;
2. Handoff proximity represents environment-transition proximity, not task completion;
3. unavailable account/model usage must never be fabricated to calculate it;
4. at `Handoff proximity: 100%`, automatically generate the complete successor handoff, finish only the current safe bounded checkpoint and stop before another substantial milestone;
5. WEC remains authoritative when it requires an earlier or stricter transition;
6. every generated successor handoff recursively preserves the same rule;
7. permanent CI contracts protect these requirements;
8. current-facing authority is synchronized from Stage 2C CURRENT to DONE / MERGED / PROVEN through PR #85.

This checkpoint changes no production runtime and therefore requires no semantic application version bump under `VERSIONING_POLICY.md`.

## Remaining Stage 2 direction

The full Private Account / Authentication / Authorization stage remains incomplete after Stage 2C.

Remaining concerns include production Firebase operational/project setup, production web-app/provider/authorized-domain configuration, safe application-account bootstrap/write lifecycle, trusted production token verification and revoked-token behavior, account export/deletion cascade, auth abuse/rate controls, production Security Rules deployment, provider outage/recovery behavior and the trusted production mutation boundary.

These are requirements, not automatic implementation order. After the governance checkpoint is merged and live `main` is independently verified, a fresh WEC assessment and current source/provider study must select only the next smallest necessary Stage 2 prerequisite.

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

## IMMEDIATE NEXT TASK AFTER FULL STUDY

Finish only the Handoff Proximity governance synchronization on `agent/handoff-proximity-governance-sync`: complete the permanent contracts and current-authority reconciliation, prove production runtime/version bytes remain unchanged, publish one bounded PR, require all 13 normal workflow families on one exact unchanged final head, verify clean submitted reviews and inline threads plus mergeability, then squash merge only with expected-head protection.

After verified merge, independently verify live `main` and reassess Work Environment Continuity before selecting another distinct Stage 2 prerequisite.

Do not begin Stage 3 pairing, Connected Rivalry or Remote Joining automatically. Do not ask the owner to reconstruct prior chats. Do not repeat Phase 1F, PR #82, Stage 2A / PR #83, Stage 2B / PR #84 or Stage 2C / PR #85. Do not rush Private Remote Joining.

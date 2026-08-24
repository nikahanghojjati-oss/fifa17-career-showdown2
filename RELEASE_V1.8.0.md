# Career Mode Showdown v1.8.0 — Safe Remote Reconciliation

Status: RELEASE CANDIDATE

Application version: `v1.8.0`
Runtime asset revision: `1.8.0-r1`
Release tag: `v1.8.0`
Previous known-good runtime: `1.7.0-r2`
Starting production-proven main: `065222416dbd65e4b7886eaebf9a3f375f7c60a8`
Branch: `agent/stage4-remote-local-reconciliation`
Remote Joining readiness baseline: `77/100` under fixed model `RJR-1`

## Scope

v1.8.0 is the bounded Stage 4 remote-to-local reconciliation candidate. It adds the first explicit user-facing workflow that can apply one verified Connected Rivalry revision to the exact active local Save without creating a second destructive storage authority.

The candidate adds:

- SHA-256 verification of every live shared-state envelope before it becomes an observed revision;
- non-mutating remote preview by default, with no automatic Apply;
- one recursively frozen intent bound to the exact rivalry, remote revision/content hash and local `saveId` / `profileId` / manager role;
- preservation of local Showdown, Save, Profile and existing Season identity while importing verified remote gameplay;
- explicit checkbox confirmation beside the full observed revision/hash and exact local target;
- a verified Candidate A backup download before any destructive mutation;
- a remote-authority check before and after backup, plus exact local pre-state checks after every asynchronous boundary;
- Candidate C as the sole destructive local Apply authority;
- the existing transaction-owned mutation engine with all-four-slot guards, stale-state rejection, anti-clobber checks, ownership-scoped reverse rollback and exact recovery verification;
- unmistakable `REMOTE OBSERVED`, `LOCAL TARGET` and `LOCAL COMMIT` states in Settings;
- focused deterministic contracts and a mobile-browser proof covering preview, confirmation, backup download, identity-safe commit and unrelated-save preservation.

## Production truth and recovery

`v1.7.0 / 1.7.0-r2` remains the production-proven whole shell and immediate recovery target until this candidate passes exact-head validation, review/thread/mergeability gates, merge/deployment and genuine production reconciliation proof.

The Installable Offline App, local Career Mode and all recovery routes remain usable without Firebase. Canonical localStorage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns` and `careerModeShowdown.preferences`; `activeShowdown` remains non-canonical and is guarded as a dual-authority hazard.

Candidate A remains non-mutating export. Candidate B remains read-only validation. Candidate C remains the sole destructive Apply authority with immutable confirmed intent, strict exact raw snapshot authority, transaction-owned mutation, stale-state rejection, anti-clobber behavior, ownership-scoped rollback and exact recovery verification.

## Locked boundaries

This candidate changes no Firestore Rules and does not require a Rules republish. Production blob `ecc8ccb2ab50f0f7057ab3170eb080ad9e36025f` remains authoritative. App Check enforcement remains OFF. Firebase remains Spark / zero billing, Firestore remains memory-only, and Google authentication remains popup-only `browserSessionPersistence` without extra scopes.

No Blaze, Cloud Run, Cloud Functions, Firebase Storage, public discovery, community, matchmaking, invitation directory, global leaderboard or ranking is added. Exactly two managers remain the only Connected Rivalry model.

Stage 5 Remote Joining session documents, host/join orchestration, presence and lobby UX remain blocked.

## Validation and promotion gate

The candidate must pass the complete repository contract suite, permanent workflow topology, Stage 3 and Stage 4 emulator regressions, focused reconciliation browser evidence, browser stability, submitted-review and inline-thread resolution, clean mergeability, exact-head merge protection and deployed whole-shell verification.

RJR-1 remains `77/100` for source, tests, CI, review, merge and deployment alone. It may move only after genuine fixed-domain production capability evidence proves the explicit reconciliation path.

If validation or deployment fails, preserve local data and recover the complete shell to production-proven `1.7.0-r2`. Never mix runtime generations.

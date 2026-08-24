# Career Mode Showdown v1.8.0-r1 Maintenance Handoff

Status: RELEASE CANDIDATE / STAGE 4 REMOTE-TO-LOCAL RECONCILIATION / NOT PRODUCTION-PROVEN
Application version: `v1.8.0`
Runtime revision: `1.8.0-r1`
Previous known-good whole shell: `1.7.0-r2`
Starting production-proven main: `065222416dbd65e4b7886eaebf9a3f375f7c60a8`
Branch: `agent/stage4-remote-local-reconciliation`
Remote Joining readiness: `77/100` under fixed model `RJR-1`

## Purpose

This bounded candidate completes the next Stage 4 dependency: explicit remote-to-local reconciliation for one exact Connected Rivalry revision and one exact active local Save. It does not begin Stage 5 Remote Joining.

## Candidate authority

Remote refresh and preview are non-mutating. No automatic remote overwrite exists. A preview is recursively frozen and binds the exact rivalry, observed revision/content hash, local `saveId`, local `profileId`, manager role, all four exact raw storage slots and the identity-safe Save Library candidate.

Apply requires explicit confirmation of that exact intent. Candidate A creates and verifies a canonical backup first. Candidate B remains read-only Showdown validation. Candidate C remains the sole destructive local Apply authority.

Candidate C flushes pending writes, rejects stale local bytes, verifies the same live remote revision before and after backup, recaptures strict exact raw state after asynchronous boundaries, and submits all four reviewed slots through the existing transaction-owned mutation engine with `guardRequestedBeforeEachWrite:true`. The engine retains anti-clobber checks, ownership-scoped reverse rollback and exact recovery verification. A critical recovery uncertainty remains fail-closed.

Remote peer identifiers never replace local Save Library identity. The exact local Showdown ID, `saveId`, manager Profile references and existing Season IDs remain local while verified gameplay fields reconcile. Other Saves, Profiles, Legacy bytes and Preferences remain unchanged.

## UI and evidence

Settings distinguishes `REMOTE OBSERVED`, `LOCAL TARGET` and `LOCAL COMMIT`. Preview shows the full remote content hash and exact local target. The backup-and-Apply button stays disabled until its confirmation checkbox is selected.

Focused Node contracts prove non-mutation, immutable intent, identity preservation, confirmation, local/remote stale rejection, backup ordering and exact Candidate C transaction options. The focused browser audit proves the rendered mobile Settings workflow, backup download and identity-safe local commit while preserving an unrelated Save and all other canonical bytes.

## Production and installed-app boundary

The Installable Offline App and production runtime remain `v1.7.0 / 1.7.0-r2` until this candidate completes all promotion gates. `1.7.0-r2` is the immediate whole-shell recovery target.

Canonical localStorage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns` and `careerModeShowdown.preferences`; `activeShowdown` remains non-canonical. Firebase failure never blocks local Career Mode or recovery.

No Firestore Rules change or republish belongs in this candidate. App Check enforcement remains OFF. Firebase Spark / zero billing, memory-only Firestore, popup-only `browserSessionPersistence`, no extra scopes, no Blaze, no Cloud Run, no Cloud Functions and no Firebase Storage remain locked.

Exactly two managers remain required. Public discovery, community, matchmaking, invitation directories, global leaderboards and rankings remain eliminated. Stage 5 session orchestration remains blocked.

## Promotion gate

Require one immutable exact head with complete repository tests, all permanent pull-request workflow families green, focused reconciliation browser evidence, clean submitted reviews, zero unresolved inline threads and clean mergeability. Standing owner authorization permits exact-head merge/deployment only after those gates pass. Then verify deployed `v1.8.0 / 1.8.0-r1` before asking for the smallest genuine production reconciliation proof.

RJR-1 remains `77/100` until genuine production capability evidence proves this reconciliation path. Source, CI, documentation, review, merge and deployment alone do not increase it.

If any source or deployment gate fails, preserve local data and recover to the complete production-proven `1.7.0-r2` shell. Never construct a mixed-version rollback.

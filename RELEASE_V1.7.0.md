# Career Mode Showdown v1.7.0 — Connected Rivalry

Status: RELEASE CANDIDATE

Application version: `v1.7.0`
Runtime asset revision: `1.7.0-r1`
Release tag: `v1.7.0`
Previous known-good runtime: `1.6.0-r1`
Starting production-proven main: `df3fe061c7df3c4235aa2394623e703a4412ca46`
Branch: `agent/v1.7.0-connected-rivalry-state`
Remote Joining readiness baseline: `69/100` under fixed model `RJR-1`

## Scope

v1.7.0 is the first bounded Stage 4 Connected Rivalry release candidate. It opens only the private authoritative shared-gameplay state boundary required after production-proven Stage 3 pairing.

The candidate adds:

* exact private rivalry attachment with no rivalry listing, discovery, public lobby or matchmaking surface;
* a private IndexedDB convenience pointer for an already-authorized exact rivalry, never gameplay authority or authorization evidence;
* deterministic projection of the explicitly connected local Save into `rivalries/{rivalryId}/state/authoritative`;
* direct authoritative reads that do not overwrite canonical local saves;
* immutable client `baseRevision` compare-and-swap publication;
* monotonic remote revisions and prior-content-hash linkage;
* atomic SHA-256 idempotency receipts with exact replay returning the already-accepted result without another mutation or revision increment;
* explicit stale-base and reused-key conflict handling with no silent rebase and no last-writer-wins fallback;
* active-account, active-device and exactly-two-entitled-manager checks for shared-state mutation;
* tombstone anti-resurrection protection;
* Firestore Rules and emulator coverage for the bounded Stage 4 shared-state/idempotency surface;
* continued write denial for Stage 5 Remote Joining sessions.

## Production truth

`v1.6.0 / 1.6.0-r1` remains the production-proven whole shell and immediate rollback target until this candidate passes exact-head source validation, the reviewed Stage 4 Firestore Rules are published and verified, the candidate is merged/deployed, and real production Connected Rivalry proof succeeds.

Source code, documentation, emulator proof and green CI alone do not increase RJR-1. The score remains `69/100` until a genuine production capability gap is closed.

## Local-first and recovery boundary

The Installable Offline App remains protected. Local Career Mode startup, Save Library, Legacy history, Preferences and recovery remain usable without Firebase connectivity.

Canonical browser localStorage remains exactly:

* `careerModeShowdown.saveLibrary`
* `careerModeShowdown.legacyShowdowns`
* `careerModeShowdown.preferences`

`activeShowdown` remains non-canonical. Connected Rivalry convenience metadata may live in IndexedDB but cannot replace local Save Library authority, Firebase authorization or Candidate C recovery authority.

This first Stage 4 slice deliberately does not apply remote payload bytes back into canonical local saves. Candidate A remains non-mutating export, Candidate B remains read-only import analysis, and Candidate C remains the sole destructive import Apply authority with transaction-owned mutation, immutable confirmed intent, strict exact raw snapshot authority, stale-state guards, ownership-scoped reverse rollback, anti-clobber behavior and exact recovery verification.

## Security and privacy boundary

Firebase UID remains the account identity source. `profileId`, `saveId`, `deviceId`, `installationId` and exact rivalry identity remain stable opaque identifiers used only in their protected roles. Display labels never authorize.

Firestore persistent offline cache remains disabled. Google authentication remains popup-only with `browserSessionPersistence` and no additional Google OAuth scopes. App Check enforcement remains OFF.

Firebase remains Spark / zero billing. This candidate does not authorize Blaze, Cloud Run, Cloud Functions, Firebase Storage, a billing account, provider-token storage or broader IAM.

Public community features, public discovery, public profiles, public matchmaking, public invitation directories, public lobbies, global leaderboards and global rankings remain eliminated.

## Stage boundary

This release candidate implements Connected Rivalry authoritative state only. It does not create Remote Joining sessions, session invitations, host/join orchestration, presence, live lobby discovery or any Stage 5 remote-session UX.

## Validation gate

Before any production Rules publication, one immutable candidate head must prove repository contracts, the permanent workflow topology, Stage 3 regression protection, Stage 4 deterministic client contracts, Firestore emulator authorization/CAS/idempotency/tombstone/session-denial cases, browser stability, submitted reviews, inline review threads and mergeability.

Only after that exact source checkpoint is clean may the exact reviewed Stage 4 `firestore.spark.rules` be published to the existing free production Firebase project.

## Recovery

If the Stage 4 candidate is defective or deployment cannot be proven, preserve local data and recover to the production-proven `1.6.0-r1` whole shell. Never construct a partial mixed-version rollback.

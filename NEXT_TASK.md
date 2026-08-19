# NEXT TASK — Career Mode Showdown

## CURRENT IMPLEMENTATION AUTHORITY — TRUSTED SHARED MUTATION GATEWAY — 2026-08-19 ET

Current verified source, live GitHub, the owner’s Remote Joining priority / anti-sidequest direction, and later owner instructions override every historical record.

Status: CURRENT IMPLEMENTATION PREREQUISITE / DORMANT TRUSTED-GATEWAY PROOF / NON-PROVISIONING / PRODUCTION FIREBASE DISCONNECTED / REMOTE JOINING PRIORITY ACTIVE.

Current branch: `agent/stage2-trusted-shared-mutation-gateway`.
Current environment: `we-2026-08-19-stage2-trusted-shared-mutation-gateway`.
Starting independently verified live main: `902058d56ec3f1b1fef4918f38568b54cf2dd7bb`.
Fresh WEC decision: `CONTINUE`.
Usage: unavailable and not estimated.
Authorized product candidate: none.

The complete pre-gateway `NEXT_TASK.md` is preserved byte-for-byte at `authority-history/NEXT_TASK_POST_PR100_PRE_GATEWAY_FULL.md` using exact blob `cc2a855f9f421a99739fed0573669627d328e92e`. It is historical/proven provenance only and cannot override this current section.

## Verified predecessor publication boundary

PR #100 `Close stale post-PR99 authority and resume Remote Joining path` is DONE / MERGED / PROVEN.

Squash merge / independently verified starting live main:

`902058d56ec3f1b1fef4918f38568b54cf2dd7bb`

PR #100 completed the one bounded post-PR99 authority closeout and explicitly returned the next fresh environment to actual Stage 2 dependency advancement toward Private Remote Joining.

A redundant concurrent draft PR #101 was closed without merge after current main proved PR #100 had already completed the required closeout. No reconciliation PR was created solely because main advanced.

The continuity/history lane is therefore closed unless a concrete failing permanent contract, contradictory current authority, unsafe publication/recovery state, security/data-loss risk, or another objectively demonstrated blocker requires intervention.

## Current selected Stage 2 prerequisite

Private Account / Authentication / Authorization Stages 2A through 2I are DONE / MERGED / PROVEN at their protected dormant/non-production boundaries.

Stage 2 as a whole remains incomplete.

Current selected smallest direct prerequisite:

`PRIVATE_ACCOUNT_AUTH_TRUSTED_SHARED_MUTATION_GATEWAY.md`

Dormant implementation:

`js/trustedSharedMutationGateway.js`

Permanent executable contracts:

`tests/contracts/trusted-shared-mutation-gateway-boundary-contracts.cjs`
`tests/contracts/trusted-shared-mutation-gateway-contracts.cjs`

This prerequisite intentionally has no synthetic `Stage 2J` label. It is selected by actual function and dependency need.

Why it is required now:

1. every application-client Firestore create/update/delete remains denied;
2. Phase 1D requires authoritative shared-state mutation plus matching idempotency authority as one logical atomic operation;
3. Phase 1F proved the current direct-client Security Rules shape cannot safely enforce the required sibling idempotency-receipt invariant for arbitrary client shared writes;
4. Stage 2H selected a future trusted Cloud Run/service-identity boundary but granted only the exact account-bootstrap provider permissions;
5. Stage 2I added App Check, revocation-aware authentication and operation-specific application authorization but explicitly granted no shared mutation authority;
6. Registered Devices / Private Pairing and later Connected Rivalry / Private Remote Joining require a safe privileged mutation protocol before shared state can move beyond dormant architecture.

This candidate proves only the trusted shared-state mutation protocol. It does not provision or connect production resources and does not automatically authorize Stage 3.

## Trusted request composition lock

For every future protected non-preflight browser request, preserve this order:

1. Stage 2H production-origin allowlist as defense in depth only;
2. transient `X-Firebase-AppCheck` token;
3. trusted Firebase Admin App Check verification;
4. exact expected production Firebase Web App identity verification;
5. exact two-entry production project audience verification;
6. Stage 2F-equivalent revocation-aware `verifyIdToken(idToken, true)`;
7. derive architecture `accountId` only from verified Firebase UID;
8. exact operation-specific Career Mode Showdown application authorization;
9. only then invoke the trusted operation adapter under separately reviewed IAM.

App Check grants no account identity, application authorization, device authority, pairing authority, rivalry authority, session entitlement, gameplay authority, shared-mutation authority or IAM authority.

The trusted shared mutation gateway receives verified `accountId` from the trusted request layer. A request-body `accountId`, `authorizedAccountIds`, `entitlementState`, `revision`, `parentRevision` or `updatedByAccountId` is never authority.

## Trusted shared mutation contract

Current gateway scope is the authoritative shared rivalry state only:

`rivalries/{rivalryId}/state/authoritative`

Allowed logical operations:

`put`
`delete`
`restore`

The full logical client intent is cloned and recursively frozen before entering the provider transaction adapter. The original client `baseRevision` may never refresh during a provider retry.

The injected trusted atomic adapter must recheck current account status, current registered-device state, current rivalry entitlement/state and exact operation authorization inside the authoritative operation boundary. Session authority is additionally required only when that exact operation policy requires a live session. Connected Rivalry synchronization must not depend on an always-open Remote Joining session.

An exact accepted idempotency replay returns the original accepted revision/result without mutation or revision increment. Reuse of the same idempotency authority with a different fingerprint or base revision returns `idempotency-conflict`.

A stale immutable base returns explicit `STALE_BASE_REVISION` authority and performs no mutation. Conflict responses disclose only object identity, authoritative revision, content hash and tombstone state; they do not return full remote gameplay payload.

Accepted first-seen mutations advance exactly one monotonic revision and set `parentRevision` to the prior authoritative revision.

Logical delete produces a tombstone at the same authoritative path with no deleted gameplay payload. Normal put over a tombstone returns `tombstone-restore-required`. Restore is an explicit separately authorized mutation against the tombstone’s current revision. Anti-resurrection remains mandatory.

The gateway is an application protocol/planner around an injected trusted atomic provider adapter. JavaScript helper correctness is not treated as the production security boundary.

## IAM lock

Stage 2H’s currently reviewed account-bootstrap runtime custom-role permissions remain exactly:

```text
firebaseauth.users.get
datastore.databases.get
datastore.entities.get
datastore.entities.create
```

Do not silently broaden them.

This gateway proof does not add `datastore.entities.update`, `datastore.entities.delete`, broad Datastore/Firebase roles, App Check replay-consumption permission, or any other production IAM permission.

A later production shared-state operation must separately justify its exact additional provider permissions before IAM expansion and provisioning.

Every application-client Firestore create/update/delete remains denied.

## Production isolation

Production Firebase remains disconnected/unprovisioned.

This candidate does not create, deploy, configure or connect:

production Firebase project
production Firebase Web App
Google Auth provider
Authorized Domains
reCAPTCHA Enterprise
App Check registration/enforcement
Cloud Run
service accounts
custom IAM roles or bindings
Blaze billing
production Firestore data
production Security Rules
production Firebase Admin runtime
production users
account/login UI
registered devices
pairing
invites
private sessions
Connected Rivalry runtime
Private Remote Joining runtime

Production dormancy is safety sequencing, not the final destination. Once the required safety boundary for a real production step is complete and current authority selects that step, provision incrementally, validate rollback/recovery, and continue toward Remote Joining rather than creating endless dormant paperwork.

## Remote Joining dependency order

Cloud / synchronization readiness
→ private account / authentication / authorization
→ paired-device / private-session capability
→ Connected Rivalry
→ Private Remote Joining
→ end-to-end hardening / stable release.

Stage 1 Cloud / Sync Readiness Phase 1A through 1F remains DONE / MERGED / PROTECTED.

Stage 2 remains ACTIVE. This trusted mutation gateway is the current selected prerequisite.

Stage 3 Registered Devices / Private Pairing remains BLOCKED until every actually required Stage 2 prerequisite is DONE / MERGED / PROVEN.

Stage 4 Connected Rivalry remains BLOCKED behind Stage 3 and earlier prerequisites.

Stage 5 Private Remote Joining remains PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED.

Public discovery, public profiles, public matchmaking, public invitation directories, public lobbies, community systems, global leaderboards and public rankings remain eliminated.

Public community features and global leaderboard/rankings are **ELIMINATED**.

## Canonical storage and recovery locks

Canonical browser storage remains exactly:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Do not restore `careerModeShowdown.activeShowdown` as a permanent fourth canonical key.

Candidate A remains non-mutating export.

Candidate B remains read-only import analysis.

Candidate C remains the sole destructive import Apply authority with strict exact raw snapshot authority, last-moment raw guards, preconditions, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber protection, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, retry/idempotence and critical recovery intact.

No Auth/cloud/sync/gateway module directly owns canonical `localStorage` mutation.

## Identity and two-owner locks

Firebase Auth UID maps only to architecture `accountId`.

`accountId`, `profileId`, `saveId`, `seasonId`, `deviceId`, `installationId`, `rivalryId`, `sessionId` and `inviteId` remain distinct namespaces.

Exactly two manager slots remain authoritative. Display labels never establish identity or entitlement. A disabled account does not silently surrender rivalry ownership. A surviving manager never gains unrestricted sole destructive authority merely because the peer is offline, disabled or unavailable.

## Gameplay locks

Exactly two managers.
Same selected league.
Different permanent clubs.
Same clubs for the full showdown.
Season lengths: 1 / 3 / 5 / 10.

Per-season scoring:

Champions League +5.
Domestic League +3.
Main Domestic Cup +1.
100 League Points and/or 100 League Goals combined maximum +1.
Top Scorer and/or Top Assist combined maximum +1.
Maximum season score 11.
Equal non-zero scores are Draws.
Only 0–0 uses tiebreakers: league position, then league points.

Remote Joining must transport/persist authoritative product state; it must not redefine these rules.

## Production and recovery provenance retained for permanent contracts

Application milestone: `v1.4.0 — Product Deepening`.
Package: `1.4.0`.
Current production Installable Offline App runtime: `1.4.0-r1`.
Immediate previous known-good whole shell: `1.3.0-r2`.
Completed resilience baseline: `v1.3.0 — Recovery & Device Resilience Hardening`.

Local Profiles and Save Library remain completed shipped dependencies.

Historical shipped dependency chain includes Local Profile display-label editing → Identity-Safe Career Analytics → formatVersion 2 full multi-Save backup/import portability (PR #67).

PR #67 production feature merge:
`8fc671fc644e69b4fd405d7ebc28f961b2f3ae27`.

Phase B first slice — Save Library / Local Profile Experience 2.0 (PR #70) — closed / production-proven.
PR #70 production feature merge:
`65b6c9db0a070b6e5e992a39dffeee23df0c6f08`.

Phase C first slice — Showdown Home & Season Experience deepening (PR #73) — closed / production-proven.
PR #73 production merge:
`dec1d3ba8182c3f62019974dd1704c7c9124def6`.

Cloud/Sync Readiness Phase 1D merge:
`fc2e8e8b921a435103a438a9239efbb890584d22`.

Historical Phase 1D publication state recorded: No product candidate is currently authorized. Current authorized prerequisite candidate was Cloud/Sync Readiness Phase 1E. Next prerequisite after Phase 1E merges was Cloud/Sync Readiness Phase 1F. Those phases are now completed historical prerequisites and do not override the current gateway authority.

Historical v1.4.0 clean-stop provenance required the project to stop and wait for a further explicit owner instruction. The owner later explicitly authorized continued roadmap advancement and prioritized Private Remote Joining. The former clean-stop wording is therefore satisfied; Do not revive it as a current blocker.

Validation-topology provenance remains 14 permanent workflow families and 27 protected workflow blocks.

This gateway candidate changes no shipped runtime behavior. Under `VERSIONING_POLICY.md`, no semantic application version bump and no runtime revision bump is appropriate.

## Mandatory forward-progress / anti-loop rule

`00_FORWARD_PROGRESS_ANTI_LOOP.md` is binding.

This current engineering candidate includes its own current-authority activation. Do not create a preliminary or follow-up authority-only PR solely because this milestone changed WEC/current task metadata.

A deferred append-only history payload cannot block this milestone when current authority, tests, security, recovery and publication are safe.

Do not create history-of-history repair loops.

If live main advances before publication with equivalent or superseding work, compare outcomes, abandon duplicate work when satisfied, adopt current main and proceed to the next real dependency. Do not create a reconciliation PR solely because the base SHA changed.

After interruption, reconstruct exact branch/PR/CI/live-main state and resume from the last coherent engineering checkpoint rather than restarting the complete repository study.

## Current completion gate

This trusted shared mutation gateway prerequisite may be classified DONE / MERGED / PROVEN only when:

1. `PRIVATE_ACCOUNT_AUTH_TRUSTED_SHARED_MUTATION_GATEWAY.md` and `js/trustedSharedMutationGateway.js` agree;
2. client authority fields are rejected;
3. complete logical intent including `baseRevision` and payload remains frozen across provider retries;
4. current account/device/rivalry/operation authorization is rechecked in the atomic boundary;
5. session authorization is conditional on exact operation policy;
6. exact accepted replay is non-mutating;
7. idempotency conflict is fail-closed;
8. stale base is explicit and non-mutating;
9. accepted mutation advances exactly one revision;
10. tombstone delete/restore/anti-resurrection is proven;
11. conflict responses remain content-minimized;
12. browser Firestore writes remain deny-all;
13. Stage 2H IAM is not silently broadened;
14. no production Firebase/network/browser runtime is activated;
15. permanent gateway and forward-progress contracts are registered and pass;
16. the complete repository contract suite passes;
17. all normal PR workflow families required by current repository topology pass on one exact unchanged final head;
18. submitted reviews and inline review threads are clean;
19. mergeability is clean;
20. squash merge uses expected-head protection;
21. resulting live main is independently verified.

Do not begin another Stage 2 prerequisite, Stage 3, Connected Rivalry or Private Remote Joining runtime inside this bounded gateway implementation candidate.

After this prerequisite is published and proven, reconstruct only the remaining genuine Stage 2 production/account/operational blockers and select the next smallest requirement that materially reduces distance to Stage 3. If the remaining Stage 2 lane is then complete, prove completion and immediately unlock Stage 3 rather than manufacturing additional Stage 2 work.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

Finish the current trusted shared mutation gateway candidate on `agent/stage2-trusted-shared-mutation-gateway`: validate the dormant gateway and anti-loop contracts, correct only objective failures without weakening protected security/recovery semantics, open one bounded engineering PR, require the complete exact-head CI/review/thread/mergeability gate, seal WEC only after the implementation head is stable, merge with expected-head protection, independently verify live main, then reassess WEC before selecting the next genuine Stage 2 prerequisite toward Registered Devices / Private Pairing and Private Remote Joining.

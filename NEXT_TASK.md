# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-18 ET (Cloud/Sync Readiness Phase 1F Firebase Emulator / deny-by-default Security Rules proof)

This file is the sole primary owner of the current implementation authorization boundary. Roadmap ordering alone is not permission to skip a dependency. The owner's 2026-08-17 instruction explicitly opens continued bounded prerequisite advancement toward Private Remote Joining.

## Work Environment Continuity

Every fresh development environment must follow `AGENTS.md`, `00_WORK_ENVIRONMENT_CONTINUITY.md`, `WORK_ENVIRONMENT_STATUS.json` and the repository Work Environment Continuity validate → archive/replace → assess sequence before substantial work. Continuity infrastructure remains outside the website runtime and does not itself authorize product or prerequisite changes.

## Current production milestone

Application milestone: **v1.4.0 — Product Deepening**
Completed resilience baseline: v1.3.0 — Recovery & Device Resilience Hardening
Current production Installable Offline App runtime: `1.4.0-r1`
Immediate previous known-good whole shell: `1.3.0-r2`
Current production runtime feature merge: `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27` (PR #67 formatVersion 2 full multi-Save backup/import portability)
Phase B first-slice production merge: `65b6c9db0a070b6e5e992a39dffeee23df0c6f08` (PR #70)
Phase C first-slice production merge: `dec1d3ba8182c3f62019974dd1704c7c9124def6` (PR #73)
Cloud/Sync Readiness Phase 1A merge: `b1fafd9cba7e2c647b88445026f6c2d1134378b1` (PR #76)
Cloud/Sync Readiness Phase 1B merge: `2dc61e24ef07a0a150a228865f954ab3b3941398` (PR #77)
Cloud/Sync Readiness Phase 1C merge: `59957f8b0c29ce0cd480a0e9270a095160005599` (PR #78)
Cloud/Sync Readiness Phase 1D merge: `fc2e8e8b921a435103a438a9239efbb890584d22` (PR #79; exact validated head `2e3c9560590fb934e684fbae44138f16194da6bd`)
Cloud/Sync Readiness Phase 1E merge: `cebd9c031657c9ee01ba68f1baaac7816c9748b9` (PR #80; exact validated head `36db46b34a0675623dbdd1a4e2c76e93d438de45`)
Feature release version: **v1.4.0**

Local Profiles / Save Library is a shipped and protected dependency milestone beneath the connected-development lane.

PRs #76 through #80 are merged and closed. Their Cloud/Sync architecture/policy/dormant-source work is deliberately not loaded by the production application, so no visible application bump was appropriate. `VERSIONING_POLICY.md` permanently requires meaningful shipped runtime changes to receive PATCH/MINOR/MAJOR version bumps according to scope.

## Closed production/product candidates

The following are closed and must not be reopened:

- Local Profile display-label editing
- Identity-Safe Career Analytics
- formatVersion 2 full multi-Save backup/import portability (PR #67)
- Phase A documentation authority synchronization (PR #68)
- Phase B first slice — Save Library / Local Profile Experience 2.0 (PR #70, `65b6c9db0a070b6e5e992a39dffeee23df0c6f08`)
- Phase C first slice — Showdown Home & Season Experience deepening (PR #73, `dec1d3ba8182c3f62019974dd1704c7c9124def6`)
- Cloud/Sync Readiness Phase 1A deterministic revision/conflict/tombstone/idempotency model (PR #76, `b1fafd9cba7e2c647b88445026f6c2d1134378b1`)
- Cloud/Sync Readiness Phase 1B provider/operational decision (PR #77, `2dc61e24ef07a0a150a228865f954ab3b3941398`)
- Cloud/Sync Readiness Phase 1C private remote data inventory/privacy/retention boundary (PR #78, `59957f8b0c29ce0cd480a0e9270a095160005599`)
- Cloud/Sync Readiness Phase 1D exact Firebase-compatible remote schema/API/authorization/replay/two-owner deletion contract (PR #79, `fc2e8e8b921a435103a438a9239efbb890584d22`)
- Cloud/Sync Readiness Phase 1E deterministic provider-neutral two-device/offline/reconnect synchronization harness (PR #80, `cebd9c031657c9ee01ba68f1baaac7816c9748b9`)

**Authorized product candidate:** none.

No product candidate is currently authorized. This means no new user-facing production runtime feature is authorized at this boundary.

## Current authorized prerequisite candidate

**Cloud/Sync Readiness Phase 1F — Firebase provider connection inside the Local Emulator Suite plus deny-by-default Firestore Security Rules proof.**

`CLOUD_SYNC_READINESS_PHASE_1F.md`, `.firebaserc`, `firebase.json`, `firestore.rules`, `tests/firebase/cloud-sync-phase1f-emulator.cjs` and `tests/contracts/cloud-sync-phase1f-contracts.cjs` are the current bounded candidate.

Phase 1F may connect the selected provider only inside a fixed `demo-` project and emulator/test boundary. It must not connect Firebase to the production GitHub Pages shell, create production Firestore data, deploy production Security Rules, add production account UI, pairing, Connected Rivalry, Remote Joining, Cloud Backup, Cloud Functions, Admin credentials, Blaze billing or persistent Firestore offline cache.

The Phase 1F candidate must permanently prove:

1. the emulator uses a fixed Firebase `demo-` project and no production user data;
2. Firestore Security Rules are deny-by-default;
3. `request.auth.uid` is the provider-authenticated account identity and client-supplied `accountId` is never trusted;
4. account/profile/device/security metadata exact reads are self-scoped;
5. rivalry/shared-state exact reads require current private entitlement;
6. private session exact reads require current session membership plus current rivalry entitlement;
7. open invite capability access is authenticated, exact-path only, unexpired and non-listable;
8. raw invite capability is not copied into document `data`;
9. idempotency receipts are exact-hash reads for the same actor and raw idempotency keys are never stored;
10. every application-client remote write remains denied in Phase 1F;
11. the emulator-only trusted transaction proof rereads current account, device, rivalry and required peer authority;
12. provider transaction auto-retry preserves the immutable original client `baseRevision` rather than silently rebasing it;
13. stale writes return explicit conflict;
14. exact accepted idempotency replay is non-mutating and does not increment revision;
15. reused idempotency key with changed fingerprint fails explicitly;
16. deletion creates a newer tombstone with deleted gameplay removed;
17. a stale device cannot resurrect a tombstone;
18. restoration is an explicit separate operation against the current tombstone revision;
19. revoked devices, disabled required accounts and inactive/retained/relinquished peer entitlement freeze shared mutation;
20. Firebase persistent offline cache remains disabled;
21. Candidate A/B/C and exact local recovery authority remain untouched;
22. production application identity remains v1.4.0 / `1.4.0-r1` because the provider proof is not production runtime.

### Phase 1F security boundary discovered from current source

The exact Phase 1D shared-state schema does not include `idempotencyKeyHash` in the authoritative shared-state document. A Firestore Security Rule evaluating a direct shared-state write therefore cannot identify which sibling `idempotency/{idempotencyKeyHash}` document must accompany that write. Allowing direct client writes would let a modified client bypass the transaction helper and omit the required replay receipt.

Do not weaken the replay contract and do not pretend client helper code is a security boundary. Phase 1F therefore denies all application-client writes and uses `withSecurityRulesDisabled()` only inside the local emulator test as a test-only trusted transaction boundary. A future production write path requires a separately authorized trusted mutation gateway or separately reviewed protocol/schema change. This finding does not authorize Cloud Functions, Firebase Admin runtime or Blaze billing.

## Cloud/Sync staged status

- Phase 1A deterministic revision model — DONE / PR #76;
- Phase 1B provider and operational decision — DONE / PR #77;
- Phase 1C privacy, retention and remote data inventory — DONE / PR #78;
- Phase 1D remote schema and API/authorization contract — DONE / PR #79;
- Phase 1E deterministic two-device/offline sync harness — DONE / PR #80;
- Phase 1F provider connection/emulator/Security Rules proof — CURRENT BOUNDED CANDIDATE.

Cloud/sync runtime remains NOT YET IMPLEMENTATION-AUTHORIZED.
Cloud/sync production runtime remains NOT YET IMPLEMENTATION-AUTHORIZED during Phase 1F; emulator-only provider proof does not authorize production Firebase runtime.

## Historical Phase 1E candidate boundary retained for provenance

The following records the exact pre-merge dependency boundary that earlier permanent contracts intentionally protect. It is historical evidence, not current implementation authority:

Phase 1D — exact provider-compatible remote schema and API/authorization contract: DONE / PR #79.
Phase 1E — deterministic two-device/offline/reconnect synchronization harness: CURRENT BOUNDED CANDIDATE.
Phase 1F — provider connection/emulator/Security Rules proof: BLOCKED.

Historical next prerequisite after Phase 1E merges: Cloud/Sync Readiness Phase 1F. That former condition has now been satisfied by PR #80 and must not be interpreted as a current block.

The former clean-stop wording to "stop and wait for a further explicit owner instruction" was satisfied by the owner's later 2026-08-17 instruction to prioritize and continue the prerequisite path. Do not revive that obsolete waiting loop.

## Prioritized long-term Private Remote Joining path

Private Remote Joining is **PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED**.

The ordered enabling path is:

1. completed local recovery / Save Library identity / multi-Save portability;
2. Cloud / synchronization readiness;
3. private account / authentication / authorization identity;
4. secure paired-device / private-session capability;
5. Connected Rivalry synchronization with stale-write protection, explicit conflict behavior, offline/reconnect recovery and two-device proof;
6. Private Remote Joining / session UX only after all preceding layers are proven.

No later stage may be pulled into Phase 1F merely because Firebase is present in an emulator.

## Firebase provider boundary

Firebase Authentication + Cloud Firestore remains the selected primary future provider candidate. During Phase 1F it is connected only to the Local Emulator Suite test boundary, not to the production client application.

Permanent rules:

- Firestore persistent offline cache must remain disabled because its reconnect model can use last-write-wins for multiple local changes to the same document;
- project-owned immutable `baseRevision` and explicit conflict semantics remain authoritative;
- Firestore transaction auto-retry may reread provider state but may never silently refresh client intent to a newer base;
- Firebase Auth account identity remains separate from `profile_*` identity and display labels;
- authenticated `accountId` comes from provider Auth context, never a client request field;
- every future production remote object operation requires provider/server-enforced authorization;
- device identity remains revocation/attribution metadata, not authentication;
- privileged Firebase/Admin credentials must never enter the GitHub Pages client or repository;
- paid Blaze/Cloud Functions activation is a separate future operational gate, not implied by provider selection or Phase 1F.

## Shipped portability and identity semantics every future candidate must preserve

1. `CAREER_MODE_BACKUP_FORMAT_VERSION = 2` serializes the complete Save Library registry + Legacy + preferences.
2. v1 envelopes remain readable.
3. Candidate A remains non-mutating export.
4. Candidate B remains read-only analysis.
5. Candidate C remains the sole destructive Apply stage.
6. stable `profile_*`, `save_*` and `season_*` identities remain authoritative.
7. display-name equality never establishes identity.
8. explicit stable Local Profile reuse is required for longitudinal cross-Save identity.
9. unresolved historical roles remain unresolved until explicitly mapped.
10. same-name distinct profiles remain distinct.

## Recovery and architecture locks

Public canonical storage remains exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

Never restore `careerModeShowdown.activeShowdown` as a permanent fourth canonical key.

`js/storage.js` remains public raw browser-storage authority.
`js/storageTransaction.js` remains raw transaction authority.
`js/saveLibraryRuntime.js` remains Save Library / manager-identity mutation authority.
`js/analytics.js` remains derived Analytics authority.

Candidate C Apply must continue to use `captureCareerModeRawRestoreSnapshot()` as strict exact raw snapshot authority. Preserve exact preconditions, last-moment raw guards, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber checks, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, retry/idempotence and critical recovery.

No future cloud/sync module may directly own `localStorage`.

## Product locks

Exactly two managers. Same selected league. Different permanent clubs. Showdown lengths 1 / 3 / 5 / 10. Maximum Season score 11. Equal non-zero scores are Draws. Only 0–0 uses league position and then league points.

Public community features and global leaderboard/rankings are **ELIMINATED**.

Private connected work must not introduce public discovery, public matchmaking or public profiles indirectly.

## Performance and validation locks

The repository protects 14 permanent workflow families and 27 protected multiline executable workflow blocks. Normal PRs generally exercise 13 workflow families; Release Integration Burn In remains main/manual release authority.

- eager raw <= `165000` bytes
- eager gzip <= `37500` bytes
- Reus startup portrait <= `95000` bytes
- combined first-party startup <= `260000` bytes
- normal startup minimum = `2700 ms`
- reduced-motion startup = `220 ms`

Normal PRs exercise the repository's protected workflow families. Do not weaken tests, workflow topology, timeouts, recovery guarantees or performance ceilings to obtain green CI.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

### Bootstrap / study

1. Verify live `main` is still PR #80 merge `cebd9c031657c9ee01ba68f1baaac7816c9748b9` or reconstruct anything newer before changing source.
2. Confirm v1.4.0 / `1.4.0-r1` remains the deployed runtime unless newer runtime source proves otherwise.
3. Read `VERSIONING_POLICY.md`, `REMOTE_JOINING_EXECUTION_ROADMAP.md`, `CLOUD_SYNC_READINESS_PHASE_1.md`, `CLOUD_SYNC_READINESS_PHASE_1E.md`, `CLOUD_SYNC_READINESS_PHASE_1F.md`, `CLOUD_PROVIDER_DECISION_2026-08-17.md`, `REMOTE_DATA_PRIVACY_RETENTION_POLICY.md`, `REMOTE_SCHEMA_API_AUTHORIZATION_CONTRACT.md`, `CLOUD_STORAGE_FOUNDATION.md`, `PROJECT_STATE.md` and this file.
4. Confirm Firebase remains disconnected from the production application and Phase 1F is emulator/test-only.
5. Confirm public community/global rankings remain ELIMINATED.

### Execution

**Current authorized prerequisite work:** complete and validate Phase 1F Firebase Local Emulator / deny-by-default Security Rules proof as one bounded non-production candidate.

Do not broaden Phase 1F into account product UI, pairing, Connected Rivalry, Remote Joining, Cloud Backup, Cloud Functions/Blaze or public features. After Phase 1F is fully validated and merged, independently verify live `main` and reassess Work Environment Continuity before starting the distinct private account/authentication prerequisite. Do not ask for repeated permission merely to progress to the next dependency gate when current source authority and the standing owner instruction still authorize it, but never collapse multiple gates into one implementation.

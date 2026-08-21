# Career Mode Showdown — Successor Handoff after PR #127

SLE = Smart Lean Efficient.

This is the complete transition packet from the production-proven Private Connected Account milestone to the next real Remote Joining feature milestone: Stage 3 Registered Devices / Private Pairing.

Treat this file as orientation, never as implementation authority. Current source, live GitHub, the deployed public site, provider state and later owner instructions always win. Independently verify live state before substantial work and initialize a fresh successor WEC. Do not inherit this environment's transition decision as your own.

## Project

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`

Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Owner priority: deliver a perfect private Remote Joining experience through dependency-correct, stability-first implementation. No rush, no circular work, no broad sidequests. This is a gaming companion, so security must be proportionate: strong enough to prevent one player from entering or mutating another private rivalry, but do not introduce banking/medical-grade complexity, paid infrastructure or speculative enterprise hardening.

Public discovery, public profiles, public matchmaking, public invitation directories, public community systems and global leaderboard/rankings are permanently eliminated.

## Exact verified production boundary before this transition package

Live main after merged PR #127: `0013bba24142aab4c76e5bca038ae99afa638c8d`.

Production application: `v1.5.0`.

Production installed runtime: `1.5.0-r2`.

PR #126 `Fix Connected Account Settings mount race` is DONE / MERGED / PROVEN. Merge SHA: `ebbe062dac7a0272df81e5de493421594ddf17a4`.

PR #127 `Record production Connected Account proof` is DONE / MERGED. Merge SHA: `0013bba24142aab4c76e5bca038ae99afa638c8d`.

PR #127 exact validated head before merge was `84216d1a6f5f49fb84c620fbd140170e5ba868e7`. All 13 normal pull-request workflow families succeeded on that exact head, including Validate Static App #1602, Validate Stability Lane #1356 and Candidate C Atomic Restore #990. Reviews and inline review threads were empty and the PR was mergeable before standing-authorized merge.

## Real production proof now complete

Owner-supplied real iPhone production evidence on 2026-08-21 proves all of the following on the same live Settings surface:

- `CONNECTED ACCOUNT` renders correctly;
- real Google popup sign-in completes against the production Firebase project;
- the app returns `Private account ready`;
- a Firebase account identity is present;
- `APPLICATION VERSION` is `v1.5.0`;
- `BUILD` is `1.5.0-r2`;
- Firebase Spark / no billing is retained;
- Remote Joining remains intentionally locked pending Stage 3 and Stage 4.

`js/sparkConnectedAccount.js` reaches `Private account ready` only after a non-empty authenticated Firebase UID is available, the self-account Firestore bootstrap executes, bootstrap returns `ok: true`, and the account status is active. Therefore the production Firebase Auth -> UID -> memory-only Firestore -> strict self-account bootstrap path is materially proven.

No more Firebase Rules replacement, provider reconfiguration, reinstall or repeated Google sign-in is required for the Connected Account milestone.

## Important production bug and permanent prevention

The first `1.5.0-r1` production attempt exposed a real installed/mobile race: Settings could open before the deferred production Firebase runtime installed its Settings click bridge, so the initial Settings click was missed and Connected Account never mounted.

PR #126 fixed this by observing the Settings overlay lifecycle and mounting even when Firebase loads after Settings is already open. A dedicated mobile regression test deliberately reproduces the late-runtime condition and requires Connected Account to appear. This regression passed in the canonical Stability Lane.

Do not reopen this bug unless current evidence demonstrates a regression.

## Remote Joining readiness

Authority: `REMOTE_JOINING_READINESS.json`.

Model: `RJR-1`, fixed denominator 100.

Current evidence-backed score: `63/100`.

The increase from 61 to 63 is exactly:

- +1 Identity/auth/trust: real production Google authentication proven.
- +1 Production cloud/security: real production bounded self-account bootstrap proven.

No point was awarded for PR count, documentation, CI count, the r2 build label, pairing, Connected Rivalry or Remote Joining itself.

Current domain picture after this proof:

- deterministic sync/recovery: 20/20;
- identity/auth/trust: 18/20;
- production cloud/security: 18/20;
- devices/pairing/Connected Rivalry/actual Remote Joining: 4/30;
- real-device hardening/stable release: 3/10.

The remaining work is now dominated by the actual Remote Joining product chain rather than broad prerequisites. RJR must move only when new capability evidence genuinely closes a fixed-domain gap.

## Permanent product/security locks

App Check enforcement remains OFF. Do not enable it merely because production token traffic works.

Zero-billing architecture remains mandatory unless the owner explicitly changes it: Firebase Spark, no Blaze, no Cloud Run, no Cloud Functions, no Firebase Storage.

No extra Google OAuth scopes, redirect sign-in, provider credential extraction/storage, Firebase Admin credential, service-account key or broad trusted browser authority.

Stage 2H historical reviewed IAM remains exactly and remains unactivated:

```text
firebaseauth.users.get
datastore.databases.get
datastore.entities.get
datastore.entities.create
```

Canonical localStorage remains exactly:

```text
careerModeShowdown.saveLibrary
careerModeShowdown.legacyShowdowns
careerModeShowdown.preferences
```

`activeShowdown` is not canonical.

Candidate A is non-mutating export. Candidate B is read-only import analysis. Candidate C is the sole destructive Apply authority.

Persistent Firestore offline cache remains disabled; the production Connected Account path uses memory-only Firestore.

## Identity and remote-data locks

Keep these identifier namespaces separate:

- `accountId` = authenticated Firebase UID;
- `profileId` = stable Local Profile identity;
- `saveId` = stable local Save identity;
- `seasonId` = stable Season identity;
- `deviceId` = registered device attribution/revocation identity, never authentication;
- `installationId` = installation-instance metadata, never authentication;
- `rivalryId` = opaque private Connected Rivalry identity;
- `sessionId` = opaque private Remote Joining session identity;
- `inviteId` = opaque one-time capability identifier.

Display names/labels have no authorization meaning. Exactly two stable manager slots exist in a rivalry.

## Existing Stage 3 schema authority

The already-proven remote schema contract defines registered devices at:

`accounts/{accountId}/devices/{deviceId}`

with fields:

- `deviceId` equal to path ID;
- `installationId` string or null;
- private `displayLabel` or null;
- `state` = `active` or `revoked`;
- `registeredAt` timestamp;
- `lastSeenAt` timestamp or null;
- `revokedAt` timestamp or null.

Device registration strengthens attribution/revocation but never authenticates the account by itself. Do not store exact location, browsing history, raw device secrets or unrelated telemetry.

The pairing contract defines private one-use invites under:

`rivalries/{rivalryId}/invites/{inviteId}`

`inviteId` must be a cryptographically strong opaque capability with at least 128 bits of randomness. Client list/query access is denied. Exact capability possession plus authenticated identity is required. Invites are short-lived, one-use and transition from `open` to `redeemed`, `revoked` or `expired`.

A rivalry has exactly two stable manager slots. Stage 3 may create the private pending-pair governance needed to connect two authenticated owners, but it must not yet sync gameplay or implement a Remote Joining session.

## Immediate product direction

The previous broad account/infrastructure lane is complete enough to unlock Stage 3. Do not create another generic prerequisite phase before actual Stage 3 feature work.

### IMMEDIATE NEXT TASK AFTER FULL STUDY

Implement the smallest coherent `v1.6.0` Stage 3 Registered Devices / Private Pairing product slice.

Ordered execution:

1. Independently verify live main, latest merges, current workflows, reviews/threads, production v1.5.0-r2 evidence and RJR 63.
2. Initialize a fresh successor WEC. The predecessor transition decision is historical only.
3. In the same real Stage 3 feature branch/PR, reconcile stale `NEXT_TASK.md` / `PROJECT_STATE.md` authority to the verified production boundary; do not create a separate documentation-only PR.
4. Implement stable private device/installation identity and authenticated self-device registration with minimal metadata only. Do not add new canonical localStorage authority; use a suitable isolated browser persistence mechanism if persistent installation identity is required.
5. Implement private pairing for exactly two managers using a cryptographically strong short-lived one-use invite capability. No public list, discovery, lobby, search or matchmaking.
6. Tie pairing to real stable manager/profile/save identity, never display names.
7. Add strict zero-billing Firestore transaction/rules behavior required by device registration and pairing only. Broaden permissions only to the exact operations Stage 3 needs; keep gameplay/shared-state/session mutations blocked.
8. Prove invite replay rejection, expiry/revocation, wrong-account/wrong-scope denial, exactly-two-manager governance, device revocation checks, local-first fallback and no mutation of unrelated local saves.
9. Run permanent contracts, emulator tests and browser/mobile tests on one exact head. Fix concrete failures only.
10. If a genuinely new Stage 3 Firestore Rules publication is required, first finish exact source/CI proof, then ask the owner for one consolidated provider action only because this environment currently has no authenticated Firebase Rules deploy route. Explicitly explain what new Stage 3 permission is being added compared with the already-published Spark rules. Never ask the owner to repeat the existing Connected Account rules publication.
11. Merge/deploy under standing owner authorization once all mandatory gates are clean; then obtain real two-account/two-device production proof before awarding Stage 3 RJR credit.

### Stage 3 scope limit

Stage 3 includes:

- registered-device enrollment/management;
- device identity and revocation/attribution;
- private two-manager pairing;
- invite issuance/redemption/expiration/revocation/replay prevention;
- minimum authorization/rules needed for those operations.

Stage 3 does not include:

- Connected Rivalry gameplay synchronization (Stage 4);
- actual Remote Joining/session orchestration (Stage 5);
- Cloud Backup;
- public/community/discovery/matchmaking;
- leaderboards/rankings;
- paid/server infrastructure without a new owner decision.

## Likely pairing design issue to resolve from source, not by asking the owner

The existing schema nests invites under a rivalry while the rivalry document carries manager-slot membership. A strict browser-only Firestore Rules design must be able to prove that a pending rivalry transition and invite redemption belong to the same one-use capability atomically.

A clean option to evaluate is a narrowly scoped pending invite reference on the pending-pair rivalry document so Rules can verify the exact invite during one transaction and clear it on activation. Do not adopt this blindly; inspect the existing remote contract/tests and choose the simplest provider-enforceable design. The goal is proportional gaming-app security, not architecture theater.

## Efficiency / anti-circle rules for successor

- Do work directly through connected GitHub tools whenever possible.
- Do not ask the owner to repeat Firebase configuration already proven complete.
- Do not reopen App Check, account bootstrap, Save Library, recovery or old Stage 2 work without concrete regression evidence.
- Do not add process-only milestones between this handoff and Stage 3 feature implementation.
- Historical contracts that hardcode an obsolete point-in-time RJR score or candidate state should be made version-neutral/evidence-gated when encountered, rather than repeatedly edited after every legitimate future readiness increase.
- Every substantial task must answer: which remaining RJR capability does this directly implement or safely prove?

## Standing merge/deploy authorization

The owner's standing authorization remains active through project completion. Once all required tests, review/thread cleanliness, mergeability and any truly required provider publication gate pass on the intended head, merge/deploy without asking the owner for repetitive approval. A later explicit owner instruction may narrow or revoke this authorization.

## WEC closure

This environment reached a clean separate-milestone boundary after completing production Connected Account proof, fixing the r1 mobile mount race, merging PR #126, recording RJR 63, and merging PR #127.

Observed continuation pressure is high enough that the correct transition decision is `HANDOFF_AT_CHECKPOINT`: do not start Stage 3 implementation in this closing environment. The successor must initialize a fresh WEC and make its own decision.

At `Handoff proximity: 100%`, complete the mandatory SLE package and stop before the next substantial milestone. This handoff is that boundary.

## Mandatory seven-line owner reporting format

Every substantive owner-facing project response must end with exactly these seven lines in this order:

1. `Handoff proximity: X%`
2. `Remote Joining readiness: X/100`
3. `Current lane: ...`
4. `Concrete dependency completed: ...`
5. `Next unlock: ...`
6. `Blocker: ...`
7. `Sidequest check: ...`

## Mandatory recursive SLE rule

Every successor must carry this rule forward. SLE = Smart Lean Efficient. At every future handoff boundary, create the complete SLE successor-loading package required by `00_SLE_HANDOFF_PROTOCOL.md`; a chat-only handoff is not complete. Current source and live state always override recorded handoff facts.

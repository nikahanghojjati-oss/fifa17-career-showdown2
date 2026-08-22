# FIFA 17 Career Mode Showdown — SLE Successor Handoff — Post Stage 3 Production Pairing

SLE = Smart Lean Efficient.

You are continuing active development of the FIFA 17 Career Mode Showdown PWA for owner Hawk / `nikahanghojjati-oss`.

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

## Mandatory live-first bootstrap

Before substantial work, independently fetch live `main`, recent PRs, current workflow/review state, deployed site identity, and the current Firebase/runtime authority relevant to the next task. Current source and live provider/deployment evidence override this handoff.

Read first:

1. `SESSION_BOOTSTRAP.json`
2. `CURRENT_STAGE3_PRODUCTION_OVERRIDE_2026-08-21.md`
3. `00_SLE_HANDOFF_PROTOCOL.md`
4. `REMOTE_JOINING_READINESS.json`
5. `WORK_ENVIRONMENT_STATUS.json`
6. this handoff
7. `PRODUCTION_STAGE3_PRIVATE_PAIRING_PROOF_2026-08-21.md`
8. `00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md`

Then targeted-read the remote schema/sync contracts and current Stage 3 implementation before Stage 4 design.

The predecessor WEC decision is `HANDOFF_NOW` and belongs only to `we-2026-08-21-v160-stage3-private-pairing`. Do **not** inherit that decision as the successor's own. Validate predecessor facts, archive them as required, create a fresh environment ID, reset all per-environment counters, record the live starting main SHA, then run the successor's own WEC assessment.

## Final predecessor production truth

Stage 3 Registered Devices / Private Pairing is DONE / MERGED / DEPLOYED / PRODUCTION-PROVEN.

Production application: `v1.6.0 — Registered Devices & Private Pairing`.
Production runtime: `1.6.0-r1`.
Immediate previous known-good recovery: `1.5.0-r2`.

PR #129:
- title: `v1.6.0 Stage 3: Registered Devices / Private Pairing`
- exact sealed source head: `e3f462306e1d2b0822aaf54eb1f9dc9af62ed4f8`
- all 14 permanent PR workflow families succeeded on that exact unchanged head
- submitted reviews: zero
- inline review threads: zero
- mergeable before merge: true
- squash merge / production runtime merge: `5d254cea6e4deebd2aac79effeda30dcc3048385`

Exact reviewed Stage 3 Rules blob: `bf307c52262faf81a484e33cde272ac831fe60f0` from `firestore.spark.rules`.

## Production Rules proof

Owner Firebase Console screenshots prove a new Rules publication in project `fifa17-career-showdown-prod` / Firestore `(default)` at 2026-08-21 8:11 PM ET. Visible source spans the Stage 3 boundary: self-device create/revoke, private device/install identity shapes, stable profile/save manager binding, `pair_[0-9a-f]{64}` capability semantics, rivalry/invite create/redeem, downstream authoritative-state/session write denial, and catch-all denial.

Do not claim byte-for-byte screenshot comparison. The exact reviewed repository blob remains the source authority.

Do not ask the owner to repeat this publication unless a real regression or new Stage 4 Rules boundary requires a genuinely new publication.

## Production live pairing proof

Owner live-site screenshots prove:

- public site is serving `v1.6.0 · Stable`;
- Settings reports application `v1.6.0`, build `1.6.0-r1`;
- Connected Account is `Private account ready`;
- registered device UI is live;
- first authenticated browser identity creates a real private `pair_` capability;
- a second authenticated browser identity has a different account and different registered `device_...` identity;
- wrong manager-slot redemption is rejected and explicitly reports local saves unchanged;
- selecting the required second manager identity allows successful redemption;
- UI reports `Private managers are paired`;
- gameplay synchronization and Remote Joining remain explicitly locked until Connected Rivalry.

Important precision: the proof used normal + incognito browser storage contexts on one physical Chromebook. Under this product's IndexedDB-based device model those are two independent registered application device identities. Do not relabel this as two-physical-machine hardening evidence.

Full record: `PRODUCTION_STAGE3_PRIVATE_PAIRING_PROOF_2026-08-21.md`.

## Remote Joining readiness

Fixed model authority: `REMOTE_JOINING_READINESS.json` / `RJR-1`.

Current score: **69/100**.

The prior 63/100 moved by exactly +6 in `devices-pairing-connected-rivalry-remote-join` from 4/30 to 10/30:
- +2 production registered-device identity capability across two distinct authenticated browser identities;
- +3 production private capability creation + successful cross-account redemption;
- +1 production wrong-slot rejection with local-save preservation.

No credit was given for CI/docs/WEC, emulator-only replay/third-account/revocation negatives, two-physical-machine hardening, Connected Rivalry, shared gameplay sync or actual Remote Joining.

Do not move 69 without new fixed-domain capability evidence.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

## Next product milestone: Stage 4 Connected Rivalry

Stage 4 is the next separate milestone and the only correct immediate product direction after the fresh successor WEC permits work.

Goal: connect the already paired exactly-two-manager rivalry to deterministic shared authoritative gameplay synchronization while preserving local-first safety.

The successor should first study:
- `REMOTE_SCHEMA_API_AUTHORIZATION_CONTRACT.md`
- `js/cloudSyncRemoteContract.js`
- existing Phase 1A–1F deterministic sync/recovery contracts and harnesses
- `js/sparkPrivatePairing.js`
- `firestore.spark.rules`
- Stage 3 emulator/browser tests

Then choose the smallest coherent Stage 4 slice. Requirements:

1. reuse monotonic revision + immutable baseRevision/CAS semantics;
2. preserve stale-conflict rejection, idempotency/replay protection, tombstone semantics and deterministic reconnect convergence;
3. authorize shared authoritative rivalry gameplay state only to the exactly two already-paired Firebase account identities;
4. require appropriate registered-device identity for mutating remote state;
5. keep display names presentation-only;
6. keep local Showdown saves authoritative/local-first and preserve outage fallback/recovery;
7. keep Firestore persistent cache disabled/memory-only unless a later reviewed architecture change explicitly supersedes it;
8. keep Firebase Spark / zero billing;
9. no public list/discovery/matchmaking/invite directory/community/rankings;
10. do not create Remote Joining session orchestration in Stage 4; actual joining sessions are Stage 5;
11. do not activate historical Stage 2H trusted Cloud Run/IAM or billing merely because those dormant contracts exist;
12. use production evidence, not source/CI count, before awarding new RJR points.

Versioning: Stage 4 is a material product feature and should receive a reasonable MINOR application bump under the standing version policy after source study confirms the release boundary. Do not predeclare a candidate version in authority files before the successor reconciles source and chooses the actual bounded slice.

## Permanent locks

- exactly two managers;
- same-league/different permanent clubs product rules unchanged;
- canonical localStorage exactly:
  - `careerModeShowdown.saveLibrary`
  - `careerModeShowdown.legacyShowdowns`
  - `careerModeShowdown.preferences`
- `activeShowdown` is not canonical;
- private device identity stays in IndexedDB and is not gameplay/save authority;
- Candidate A non-mutating export;
- Candidate B read-only import analysis;
- Candidate C sole destructive import Apply authority;
- Google Auth popup-only with `browserSessionPersistence` and zero extra scopes;
- Firestore memory-only;
- App Check enforcement remains OFF;
- Firebase Spark / zero billing;
- no Blaze, Cloud Run, Cloud Functions, Firebase Storage or billing without explicit later owner authorization;
- public discovery/community/matchmaking/public invite directories/global leaderboards/rankings eliminated;
- display names never authorize;
- owner standing merge/deploy authorization remains effective after all required tests/current provider gates pass.

## Stale-current-document warning

`README.md`, `CHANGELOG.md`, `PROJECT_STATE.md`, `NEXT_TASK.md`, `POST_V1_ROADMAP_EXECUTION.md`, and older `00_CURRENT_HANDOFF.md` sections still contain historical/candidate wording that can describe v1.6.0 as not production-proven. Do **not** reopen Stage 3 because of that stale prose. `SESSION_BOOTSTRAP.json`, `CURRENT_STAGE3_PRODUCTION_OVERRIDE_2026-08-21.md`, `RELEASE_V1.6.0.md`, `REMOTE_JOINING_READINESS.json`, the production proof record, and live GitHub/provider state are the current closeout authority.

The fresh successor should reconcile only the current-facing override portions needed to prevent future loops while preserving historical provenance/contracts. Treat that reconciliation as part of Stage 4 entry hygiene, not a separate sidequest and not a reason to repeat provider work.

## Mandatory owner-facing response footer

Every substantive project response must end with these seven lines in this exact order:

`Handoff proximity: X%`
`Remote Joining readiness: X/100`
`Current lane: ...`
`Concrete dependency completed: ...`
`Next unlock: ...`
`Blocker: ...`
`Sidequest check: ...`

At `Handoff proximity: 100%`, automatically generate the complete SLE successor handoff and stop before the next substantial milestone. Never fabricate usage. WEC decisions override a lower displayed handoff percentage.

## First successor action

Independently verify live main and v1.6.0-r1 production truth, validate/archive the predecessor transition-prepared WEC, initialize a fresh successor WEC, reconcile the minimum stale current-facing authority needed for Stage 4 entry, assess, and—only if the fresh WEC says CONTINUE—begin the smallest bounded Stage 4 Connected Rivalry implementation. Do not repeat Stage 2/Stage 3 Firebase setup and do not begin Stage 5.

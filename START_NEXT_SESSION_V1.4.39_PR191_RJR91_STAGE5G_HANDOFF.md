# START NEXT SESSION — v1.4.39 / PR #191 OPEN / RJR91 / STAGE 5G NEXT

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Treat this starter and every handoff artifact as orientation only. Current live GitHub/source/provider/deployment evidence and later owner instructions win. Read `00_SLE_HANDOFF_PROTOCOL.md`, `00_OWNER_EAGLE_EYE_GOLDEN_RULE.md`, `WORK_ENVIRONMENT_STATUS.json`, `REMOTE_JOINING_READINESS.json`, `NEXT_TASK.md`, `PROJECT_STATE.md` and this file first, then independently verify live state before acting.

## Exact handoff boundary

- Independently verified live `main`: `7c140a1593bfc84fcf3b42e6eec3eb50c9a262e4` after merged PR #190.
- Production remains `v1.9.0 / 1.9.0-r5`; no runtime change occurred in this handoff lane.
- PR #191 is OPEN and mergeable, base `main`, working branch `evidence/stage5f-rjr91-to-stage5g-2026-09-04`.
- Last exact PR #191 head before this separate handoff branch was created: `4a63137b918b3d4b6d3d93916e67b72e85848c39`.
- This handoff branch is `handoff/pending-stage5g-network-hardening`, created directly from that exact PR head so packaging does not invalidate PR #191's captured CI state.
- PR #191 must NOT be merged until every required permanent workflow family is green on one fresh exact reviewed head.

## Fixed RJR authority

Fixed RJR-1 is **91/100**. Runway is **9 points**.

Stage 5F owner production acceptance is already PASS and sanitized in `PRODUCTION_STAGE5F_AUTHENTICATED_NEGATIVES_ACCEPTANCE_2026-09-04.md`:

1. revoked-device protected production mutation: provider `permission-denied`, no denied commit, unchanged session state/local storage, terminal cleanup;
2. authenticated unrelated third account: both exact protected reads denied, zero writes, no account bootstrap, unchanged local storage.

The transition 89 → 91 is exactly +2 in `identity-auth-trust`, now 20/20. No source, contract repair, PR, CI, merge, deployment, WEC, SLE or handoff work earns RJR credit.

Current domain vector:
- deterministic sync and recovery safety: 20/20
- identity, authentication, authorization and trust: 20/20
- production cloud and security activation: 20/20
- devices, pairing, Connected Rivalry and actual Remote Joining: 22/30
- real-device hardening and stable release: 9/10

## PR #191 exact-head publication state at handoff

At exact head `4a63137b918b3d4b6d3d93916e67b72e85848c39`, ten workflow families were already successful when captured, two were still running, and three failed. The three failures were `Validate Static App`, `Validate Stability Lane`, and `Validate Stage 5F Authenticated Negatives`.

The failures are not a Stage 5F product/security regression. Both Static App and Stability reached the same repository-contract-suite blocker: `tests/contracts/private-account-auth-stage2b-contracts.cjs:62` still asserts that live `NEXT_TASK.md` must identify PR #187 / RJR89. Current authority is correctly Stage 5F accepted / RJR91 / Stage 5G next. Stage 5F's dedicated chooser and authenticated-negative contracts passed before its repository-suite step failed for the same stale compatibility lane.

This environment already repaired the same stale-current-authority pattern through cloud foundation, privacy/retention, Stage 5E runtime, Stage 5 activation authority, Phase 1F, and Stage 2A boundary contracts. Preserve immutable historical facts; change only assertions that incorrectly treat PR187/RJR89 as *current* authority.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

1. Independently verify live `main`, PR #191 state/head, production `1.9.0-r5`, fixed RJR91, the Stage 5F sanitized acceptance and this closed predecessor WEC.
2. Validate/archive predecessor WEC `we-2026-09-03-stage5f-authenticated-negatives`, then initialize a fresh unique successor WEC with reset counters. **Do not inherit predecessor `HANDOFF_NOW` as the successor decision.**
3. Continue PR #191 publication repair at the smallest exact blocker: update only the stale current-authority expectations in `tests/contracts/private-account-auth-stage2b-contracts.cjs`, preserving all historical Stage 2B provenance. Let CI reveal any later stale current-authority contracts; repair narrowly rather than weakening gates.
4. Require all current permanent workflow families green on the same exact PR head. A newer commit invalidates older exact-head evidence. Merge only with expected-head protection under standing owner authorization, then independently verify post-merge `main` and deployment.
5. After PR #191 publication is genuinely closed, execute Stage 5G: the smallest genuinely uncredited Remote Joining-specific two-device/two-network reconnect/adverse-network hardening slice. Automate deterministic/runtime/browser/Auth+Firestore-emulator proof first; ask the owner only for a truly non-automatable physical two-device/two-network boundary.
6. After Stage 5G is genuinely capability-proven, execute final stable Remote Joining release acceptance. Move RJR only on new fixed-domain capability evidence.

## Owner's Eagle Eye — permanent golden rule

Every substantive owner checkpoint must frequently expose: current RJR, remaining points, current scoreable gap, estimated concrete tasks/stages/new evidence bundles, blocker status, whether owner action is required, and `Handoff proximity: X%`. Automation-before-owner-action is mandatory. Preserve `00_OWNER_EAGLE_EYE_GOLDEN_RULE.md` recursively in future SNS/SLE packages.

Use the mandatory eight-line owner progress format exactly:

```text
Handoff proximity: X%
Remote Joining readiness: ~Y%
Estimated focused sessions to genuine RJR100: ~N–M
Current lane: <current bounded engineering lane>
Concrete dependency completed: <most recent concrete dependency completed>
Next unlock: <next dependency or proof gate>
Blocker: <current blocker, or NONE>
Sidequest check: <NONE, or NECESSARY because ...>
```

## Permanent locks

Billing must never be activated. Firebase remains Spark. Never link Cloud Billing, enable Blaze, add a payment method, Cloud Run, Cloud Functions or any billing-required service. App Check enforcement remains OFF. Firestore browser persistence remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes. Canonical localStorage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`. Candidate C remains the sole destructive remote-to-local gameplay Apply authority with transaction-owned strict exact raw-snapshot rollback. Exactly two private managers remain mandatory. No public discovery/listing/lobby/matchmaking/community/rankings/global leaderboards. Never request, expose, quote, paste, log or durably retain a full private pairing/session capability. Never destructively test the protected historical rivalry.

SLE = Smart Lean Efficient remains mandatory and recursive. The successor should work at maximum productive depth after the fresh WEC is initialized, but live evidence always wins over this snapshot.

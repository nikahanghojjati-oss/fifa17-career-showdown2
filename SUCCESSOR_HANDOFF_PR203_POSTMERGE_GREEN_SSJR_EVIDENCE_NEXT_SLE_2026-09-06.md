# SUCCESSOR HANDOFF — PR203 POST-MERGE GREEN / PRODUCTION SHARED SETUP PROVEN / TWO-ACCOUNT SSJR EVIDENCE NEXT

SLE = Smart Lean Efficient. This handoff is orientation only. Current source, live GitHub/provider/deployment evidence and later explicit owner instructions win over stale text.

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/

## Executive boundary

PR #203 `SSJR: publish paired-first production Shared Setup` completed the first production Shared Journey runtime/provider milestone.

Final exact PR head: `1f9ccf781354f22cf56a16f816500c7df017d3b8`.
Exact tree: `e7e317d847dcf3b25e9959ce6c67f9dbb492596d`.
Expected-head squash merge / live main: `65d88b1b413501b328bdf722bc6e8a0aa0d46ef2`.
Runtime: `v1.9.1 / 1.9.1-r3`.
Previous whole-shell recovery runtime: `1.9.1-r2`.

The exact PR head passed all 15 permanent PR workflow families. Three P1 review threads were resolved only after the final corrected head was green. Expected-head squash protection was used.

Main ran 16 push workflows: the 15 permanent families plus `Deploy Firebase Firestore Rules - Zero Billing`. No run remains failed or in progress. Stability run `34011054148` initially hit one live Save Library click race after deployed byte verification; rerunning the failed Stability job against the same immutable main SHA passed the formerly failing Save Library audit and every downstream deployed audit, including manager identity, analytics, Candidate A/B/C, install/offline and the complete journey. No runtime hotfix was made because the failure was not reproducible and production bytes remained exact.

The deployed-site verifier proved 107 runtime files match `1.9.1-r3` byte-for-byte.

## Production Shared Setup now live

The production paired-first journey now requires:

Profiles / pre-draw Save shell → exact Connected Rivalry pairing → exact ACTIVE session → Shared Setup open → authoritative league → two distinct permanent same-league clubs → supported season length → both managers confirm identical setup.

The browser entry and guard prevent the shared path from falling into local league/club selection before pairing + ACTIVE, including direct/modified-client click paths covered by Chromium automation. The production coordinator reuses the exact account/device/rivalry/session authority and the PR201 Spark transaction adapter. A fresh ACTIVE session for the same rivalry resumes existing Shared Setup rather than redrawing.

Canonical local Save Library keys are snapshot-protected around production Shared Setup provider reads/writes. Shared Setup itself is not Candidate C and does not destructively apply remote gameplay state locally.

## Production Firestore Rules proof

Production Rules are generated from the mature `firestore.spark.rules` base plus the bounded Shared Setup production fragment. The generated production Rules pass the same direct modified-client/adversarial emulator matrix before publication.

The main-only publisher is hard-locked to `fifa17-career-showdown-prod`, uses only OAuth plus `firebaserules.googleapis.com`, creates/compiles the ruleset before mutating the `cloud.firestore` release, then reads the live release/ruleset back and requires exact source identity.

Verified live Rules boundary:
- release: `cloud.firestore`
- ruleset: `73b4435e-85a8-49f9-92ef-8ffe3ce0f91c`
- exact generated-source Git blob: `5bcde9297f6b2927a2184605192ab5b6cd46fb29`

No billing, Blaze, Cloud Run, Cloud Functions or purchased credits are involved.

## Scoring truth

RJR-1 remains COMPLETE/FROZEN `100/100`.

SSJR model remains fixed `SSJR-1.1`, denominator 100. Current score remains `0/100`.

PR203 is genuine dependency progress but does not itself satisfy the model's required `production-two-account` layer. Source, tests, CI, review, merge, deployment, Rules publication, WEC and SLE/SNS receive zero SSJR credit by themselves.

Current honest forecast: approximately `5–10` focused sessions to genuine SSJR100. This is a planning estimate, not readiness evidence.

## Failures corrected during PR203 — preserve these lessons

1. A paired-first shared marker initially lived only in sessionStorage; it was hardened to survive reload through the pre-draw Save Library shell without storing secret authority.
2. Disabling buttons alone was insufficient because bound lexical handlers could still be reached by a modified client; capture-path and direct-function guards were added.
3. The installed r3 Service Worker shell needed the full SSJR dependency chain to avoid mixed-version installed-app failures.
4. Production Shared Setup Rules initially denied the first authorized create due to redundant read predicate cost/scope; reads were aligned with already-proven active-paired production entitlement while writes kept the stricter exact ACTIVE session/device/two-manager gate.
5. A Stage 5I Stability assertion still hardcoded the old r2 asset loader; it was bound to the actual active runtime identity rather than weakening the recorder.
6. The first post-merge deployed Save Library audit saw a transient DOM-detachment click timeout. Same-main rerun passed that exact step and the entire downstream deployed journey. Treat it as a recorded non-reproducible audit race unless future evidence makes it reproducible.

Do not undo these corrections to simplify future work.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

### Bootstrap

1. Read `START_NEXT_SESSION_V1.4.49_PR203_POSTMERGE_GREEN_SSJR_EVIDENCE_NEXT.md` first, then `SESSION_BOOTSTRAP.json`, `00_CURRENT_HANDOFF.md`, `NEXT_TASK.md`, `WORK_ENVIRONMENT_STATUS.json`, `SHARED_SHOWDOWN_JOURNEY_MODEL.json`, and `SHARED_SHOWDOWN_JOURNEY_READINESS.json`.
2. Independently verify live main `65d88b1b413501b328bdf722bc6e8a0aa0d46ef2` or its newer legitimate successor, PR #203 state, runtime `1.9.1-r3`, production Rules identity, frozen RJR100 and current SSJR score.
3. Validate/archive closing WEC `we-2026-09-05-ssjr-production-shared-setup-a49` and initialize a fresh unique WEC. Never inherit the predecessor `HANDOFF_NOW`.

### Execution — next score-enabling boundary

Obtain genuine production-two-account Shared Setup evidence before broadening scope.

Automate first:
- deployed exact-byte/runtime preflight;
- zero-billing/Spark/provider identity;
- isolated browser-context preparation;
- evidence recorder/validator logic;
- negative and modified-client cases that do not require private human sign-in;
- canonical local-save before/after hashing.

Then, only if unavoidable, request the smallest owner action needed for two real private accounts/devices. Do not ask for generic RJR acceptance already consumed.

The evidence bundle must prove, on production:
- two legitimate managers are paired to one exact Connected Rivalry;
- exact ACTIVE exists before any shared league/club action;
- both accounts observe the same authoritative Shared Setup;
- exactly one league result, two distinct permanent same-league clubs, one supported length and two role-distinct confirmations;
- reload/reconnect/fresh-session same-rivalry continuity without reset/redraw;
- wrong account/rivalry/device/session, expired session, stale/replay/conflict and direct field/draw substitution fail closed;
- Shared Setup operation itself does not mutate canonical local gameplay saves.

Only after the fixed evidence contract is actually satisfied should `SHARED_SHOWDOWN_JOURNEY_READINESS.json` receive whole-capability credit.

Scope stop: do not start transfer/results/scoring transport until this evidence boundary is resolved.

## Permanent locks

Billing must remain permanently OFF. Firebase remains Spark. Never link Cloud Billing, enable Blaze, add payment methods, use purchased credits, Cloud Run, Cloud Functions or billing-required services.

App Check enforcement remains OFF. Firestore browser persistence remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes.

Exactly two private managers. No public discovery/listing/lobby/matchmaking/community/rankings/global leaderboards. Never durably retain raw private capabilities or raw account/device/rivalry/session authority IDs.

Canonical localStorage is exactly:
- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

Candidate A remains non-mutating. Candidate B remains read-only. Candidate C remains the sole destructive remote-to-local gameplay Apply authority with transaction-owned strict exact raw-snapshot rollback.

The prior RJR physical acceptance used two physical devices on two independent networks and is consumed unless a proven regression invalidates it.

## Work Environment Continuity

Closing environment: `we-2026-09-05-ssjr-production-shared-setup-a49`.
Starting main recorded by a49: `f7495255a375bb099d44bca077681ee4ea05bec3`.
Final runtime publication main: `65d88b1b413501b328bdf722bc6e8a0aa0d46ef2`.
Closing archive: `WORK_ENVIRONMENT_ARCHIVE/we-2026-09-05-ssjr-production-shared-setup-a49.json`.
Handoff branch: `handoff/pr203-postmerge-ssjr-evidence-next`.

The successor must initialize its own fresh WEC. The a49 `HANDOFF_NOW` decision applies only to a49.

## Mandatory owner reporting

```text
Handoff proximity: X%
Shared Showdown Journey readiness: Y/100
Estimated focused sessions to genuine SSJR100: ~N–M
Current lane: ...
Concrete dependency completed: ...
Next unlock: ...
Blocker: ...
Sidequest check: NONE
```

At Handoff proximity 100%, recursively create the complete mirrored SLE package, refresh current pointers, finalize/archive the WEC, provide one short repository-first owner prompt, and stop before another substantial milestone.

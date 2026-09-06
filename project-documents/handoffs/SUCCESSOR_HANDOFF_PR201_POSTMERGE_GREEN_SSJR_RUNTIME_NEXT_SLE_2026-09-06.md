# SUCCESSOR HANDOFF — PR201 POST-MERGE GREEN / SSJR PRODUCTION RUNTIME NEXT

SLE = Smart Lean Efficient. This handoff is orientation only. Current source, live GitHub/provider/deployment evidence and later explicit owner instructions win over stale text.

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/

## Executive boundary

PR #201, `SSJR: add Spark Shared Setup provider transaction and emulator proof`, is the completed provider-candidate milestone.

Final exact PR head: `2c99e0746d6a3c5df946aa96f2c010da208bf70f`.
Final exact tree: `87ddbde2550facccdfba0ec02a3a625ea81d1a08`.
Expected-head squash merge/main boundary: `0cf810f99460bc66d41b4a036d42befb5bb5ef39`.

The exact head passed all 15 permanent pull-request workflow families. The new provider proof was attached to the existing `Validate Stage 3 Private Pairing` family, so no 16th workflow family was created. The Stage 3 job completed the older Stage 3/4/5 contracts, browser audits and emulator suites before executing the two new Shared Setup Firestore emulator suites.

Explicit Shared Setup pass markers from that exact-head job:

- paired ACTIVE-session authority, exact-two-manager gating, CAS/idempotency, canonical deterministic non-redrawable league/clubs, direct modified-client denial, same-rivalry fresh-session continuity, identical confirmation and zero canonical local-save mutation;
- no setup before ACTIVE session, exact session ID persistence, closed/expired session substitution denial, caller catalog ignored, cross-manager replay denied, unrelated/peer coordinator bypass denied and inactive paired manager freeze.

PR201 was merged only after all 15 exact-head families were green, no submitted reviews or unresolved review threads existed, the PR remained mergeable, and expected-head protection was used.

## What PR201 implemented

`js/sparkSharedShowdownSetup.js`

- candidate state only: `productionEnabled:false`, `billingRequired:false`, `canonicalStorageMutation:false`;
- exact persistence path `rivalries/{rivalryId}/sharedSetup/authoritative`;
- derives authority inside the Firestore transaction from signed-in actor, actor-owned registered device, exact rivalry, exact session and existing setup ledger;
- requires exact two-manager rivalry and exact ACTIVE session before Shared Setup mutations;
- uses exact Firestore session document ID rather than a synthetic/fallback ID;
- ignores caller-supplied catalog input;
- binds accepted idempotent replay to the original manager role;
- resumes the same setup when a fresh ACTIVE session replaces an expired/closed session for the same rivalry;
- never mutates canonical local Save Library storage.

`js/sharedShowdownCatalog.js`

- repository-owned immutable FIFA17-era canonical catalog;
- removes caller authority over the league/club draw universe.

`firestore.shared-setup-candidate.rules`

- candidate-only, not the production Rules source;
- permits only exact Shared Setup create/update at the exact authority document;
- verifies two distinct authorized managers, active manager accounts, active actor device, active exact-rivalry session, expiry, actor membership and role sequencing;
- host-only open, coordinator-owned draw/length transitions, CAS revision sequence, unique operation IDs, role-bound operation history and two distinct confirmations;
- strict ledger field allowlist blocks direct `leagueId`, `clubs` and extra-field injection;
- list/delete remain denied;
- valid-write expression cost was reduced using bounded list-prefix equality and compressed transition checks while retaining Shared Setup security facts.

Automated proof is permanent in:

- `tests/contracts/shared-showdown-provider-contracts.cjs`;
- `tests/firebase/shared-showdown-setup-provider-emulator.cjs`;
- `tests/firebase/shared-showdown-setup-provider-session-emulator.cjs`;
- `.github/workflows/validate-stage3-private-pairing.yml`;
- repository contract/SSJR scripts.

## Important failures and corrections — do not rediscover

The milestone deliberately used CI/emulators as adversarial gates. The following were found and corrected before merge:

1. exact provider authority originally substituted a zero session ID because the session document payload does not store its own path ID; fixed by propagating the exact Firestore session document ID;
2. caller-provided catalog input could bias deterministic league/club selection; fixed by immutable repository-owned catalog authority;
3. idempotent replay could be attempted by the other manager; fixed by actor-role binding;
4. new generic helper names violated the repository-wide unique named-function architecture contract; helpers were renamed rather than weakening the gate;
5. stale handoff/WEC contracts incorrectly compared the fresh successor record to the archived predecessor; tests now validate predecessor sealing and successor non-inheritance separately;
6. emulator fixtures still expected an old synthetic four-club catalog after immutable catalog hardening; fixed to validate canonical catalog outcomes;
7. candidate Rules initially exceeded Firestore's valid-write expression ceiling; history validation was reduced to bounded list-prefix equality and redundant protected-document schema checks were removed from the candidate write predicate while retaining the Shared Setup authority facts. The final valid setup sequence passes the emulator.

Do not undo these corrections merely to simplify integration.

## Production / scoring authority

Production application/runtime remains `v1.9.1 / 1.9.1-r2`. PR201 did not production-enable the Shared Setup adapter and did not replace the production Rules source. Previous whole-shell recovery remains `1.9.1-r1`.

RJR-1 is COMPLETE/FROZEN at `100/100`. The accepted RJR two-device/two-independent-network physical acceptance is consumed. Do not rerun it unless a proven regression invalidates it.

SSJR model is fixed `SSJR-1.1`, denominator 100. Current score remains `0/100`.

PR201 creates deterministic/provider-enforcement candidate evidence but earns no SSJR credit because the required production-two-account layer is still missing. `SHARED_SHOWDOWN_JOURNEY_READINESS.json` records this as zero-credit candidate evidence and updates the remaining focused-session forecast to approximately `6–11`.

Never award readiness points for source creation, tests, PR, CI, review, merge, deployment alone, WEC, SLE/SNS or tooling. Whole capability evidence only.

## Product-order lock

The supported two-manager journey order is:

Profiles/pre-draw Save shell → PRIVATE_PAIRING → CONNECTED_RIVALRY_ATTACHED → REMOTE_SESSION_HOSTED → REMOTE_PEER_JOINED → ACTIVE → SHARED_SETUP_OPEN → LEAGUE_WHEEL_COMMITTED → CLUB_ASSIGNMENTS_COMMITTED → SEASON_LENGTH_COMMITTED → SHOWDOWN_CONFIRMED → LOCAL_FIFA17_CAREERS_STARTED → season/results/scoring/history progression → final reconciliation → SHOWDOWN_COMPLETE → CLOSED → NO_RESURRECTION.

Pairing and exact ACTIVE session must precede any league or club selection in provider authority and final UI. If this ordering regresses, later dependent SSJR credit is invalidated under SSJR-1.1. A fresh ACTIVE session for the same rivalry resumes the existing competition; it never redraws or resets it.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

### Bootstrap/study

1. Open the live repository and read `START_NEXT_SESSION_V1.4.48_PR201_POSTMERGE_GREEN_SSJR_RUNTIME_NEXT.md` first.
2. Load `SESSION_BOOTSTRAP.json`, `00_CURRENT_HANDOFF.md`, `NEXT_TASK.md`, `WORK_ENVIRONMENT_STATUS.json`, `SHARED_SHOWDOWN_JOURNEY_MODEL.json`, and `SHARED_SHOWDOWN_JOURNEY_READINESS.json`.
3. Independently verify live `main`, PR #201 final exact head/tree/merge, all applicable post-merge evidence, production `v1.9.1 / 1.9.1-r2`, RJR100 and SSJR0.
4. Validate/archive closing WEC `we-2026-09-05-ssjr-provider-adapter-a48`, then initialize a fresh unique WEC from current live `main` with reset counters. Never inherit the predecessor HANDOFF decision.
5. Before any Rules publication, read `00_FIREBASE_PERMANENT_ZERO_BILLING_CONTROL_PLANE.md` and `HANDOFF_FIREBASE_CONTROL_PLANE_PERMANENT_ACCESS_ADDENDUM_2026-09-01.md` and verify the existing zero-billing Rules publication path.

### Execution — first concrete milestone

Wire the PR201 provider candidate into the production browser Shared Setup journey so two legitimate managers can enter the same empty setup only after exact Connected Rivalry pairing and exact ACTIVE session, then progress through one authoritative league draw, two distinct permanent clubs, one supported 1/3/5/10 season length and dual confirmation.

Primary implementation surfaces to inspect first:

- `js/sparkSharedShowdownSetup.js`;
- `js/sharedShowdownCatalog.js`;
- `firestore.shared-setup-candidate.rules`;
- production auth/session/rivalry adapters;
- `screens.js`, `app.js`, `showdown.js` and the existing league/club/setup UI path;
- production Firestore Rules source and zero-billing deployment workflow.

Required sequence/gates:

1. Define the minimal runtime integration boundary. Do not let a fresh manager spin or select league/clubs before pairing + ACTIVE.
2. Preserve safe local-only behavior and canonical Save Library authority when remote service is unavailable or quota-exhausted.
3. Merge only the proven Shared Setup Rules delta into the production Rules source. Do not weaken existing account/device/rivalry/session protections.
4. Automate two isolated browser/account journeys with deterministic provider fixtures/emulator first: same empty setup after ACTIVE, one league, distinct same-league clubs, supported length, two confirmations, reload and fresh-session resume.
5. Add modified-client negatives for direct field injection, wrong session/rivalry, unrelated account, revoked device, inactive peer, stale base, altered replay, racing coordinator requests and attempts to reroll.
6. Add adverse-provider/quota tests that fail closed without enabling billing and preserve local state/pending intent.
7. Run every permanent workflow family on one exact reviewed head; resolve review blockers; use expected-head merge; verify complete post-merge workflow set.
8. Only after exact deployed runtime and production two-account evidence satisfy the relevant whole-capability contracts may SSJR credit be added.

Scope stop: do not begin transfer/result/scoring transport until the shared-entry/shared-setup production boundary is genuinely proven. Do not redo generic RJR physical acceptance as a substitute for new SSJR production evidence.

## Permanent zero-billing / security / privacy locks

Billing must never be activated. Billing must remain permanently OFF. Firebase must remain Spark. Never link Cloud Billing, enable Blaze, add payment methods, use purchased credits, Cloud Run, Cloud Functions or billing-required services.

App Check enforcement remains OFF. Firestore browser persistence remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes.

Canonical localStorage is exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

Candidate A remains non-mutating. Candidate B remains read-only. Candidate C remains the sole destructive remote-to-local gameplay Apply authority, with backup-first / strict exact raw-snapshot rollback semantics.

Exactly two private managers. No public discovery, listing, lobby, matchmaking, community, rankings or global leaderboards. Never durably retain raw private capabilities or raw account/device/rivalry/session authority IDs.

## Work Environment Continuity

Closing environment: `we-2026-09-05-ssjr-provider-adapter-a48`.
Starting main: `13dcf6bd3f2e8a6d2682db46ae0f7da3cbde7885`.
Provider candidate PR: #201.
Final exact head: `2c99e0746d6a3c5df946aa96f2c010da208bf70f`.
Merge/main boundary: `0cf810f99460bc66d41b4a036d42befb5bb5ef39`.
Closing WEC archive: `WORK_ENVIRONMENT_ARCHIVE/we-2026-09-05-ssjr-provider-adapter-a48.json`.

The successor must initialize its own WEC. The closing HANDOFF decision applies only to a48.

## Mandatory owner reporting

Every substantive project response must contain exactly this eight-line block:

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

At Handoff proximity 100%, create a mirrored full SLE handoff and mirrored versioned START_NEXT_SESSION, refresh bootstrap/current-context pointers, finalize/archive the current WEC, generate the current repository-first owner prompt and stop before beginning another substantial milestone.

## Repository-first next-developer prompt rule

Future closing developers inherit this Smart Lean Efficient rule recursively. The owner-facing prompt must remain short, name the current START_NEXT_SESSION file, require independent live verification and fresh WEC initialization, route to `IMMEDIATE NEXT TASK AFTER FULL STUDY`, and never replace the full repository-native package.

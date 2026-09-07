# Career Mode Showdown v1.9.1-r5 Maintenance Release Record

Status: RELEASE CANDIDATE / NOT PRODUCTION-PROVEN
Application version: `v1.9.1`
Runtime revision: `1.9.1-r5`
Previous known-good whole shell: `1.9.1-r4`
Remote Joining readiness: `100/100` under frozen model `RJR-1`
Shared Showdown Journey readiness: `0/100` under fixed model `SSJR-1.1`

## Purpose

This bounded release candidate fixes defects exposed by the owner’s genuine two-account production SSJR acceptance on the production-proven `1.9.1-r4` shell. The test reached a real paired ACTIVE private session and authoritative Shared Setup `EMPTY · REV 0` before any league or club draw, then exposed first-party recorder/overlay defects that must be corrected before the human acceptance can continue.

The r5 candidate fixes three concrete hazards:

1. an already ACTIVE page-memory private session no longer routes the recorder back to Private Remote Joining when Shared Setup is the actual next boundary;
2. `productionSharedShowdownSetup.openPanel()` now calls the selected DOM element’s real `focus()` method instead of attempting to call the element itself, removing the observed `focus is not a function` exception after authoritative `EMPTY · REV 0`;
3. an expired page-memory private session is no longer treated as ACTIVE by simple-mode routing, so an expired capability returns the owner to fresh-session establishment instead of looping into Shared Setup rejection.

## Candidate evidence and permanent regressions

PR #213 is the publication lane. Dedicated browser regressions cover:

- ACTIVE private session + unresolved Shared Setup routes to Shared Setup diagnostics and never loops to Private Remote Joining;
- expired-by-clock / past-expiry private-session state is treated as inactive by the recorder;
- paired ACTIVE host → authoritative `EMPTY · REV 0` → `SHARED_SETUP_OPEN · REV 1` completes without the focus exception.

These regressions are part of the permanent browser/SSJR browser gates. They prove the reproducible software behavior only; they do not replace the genuine two-account production acceptance and earn zero SSJR credit by themselves.

## Publication discipline

This maintenance record is candidate-era authority only. `1.9.1-r5` must remain NOT PRODUCTION-PROVEN until every current permanent workflow family is green on the same exact reviewed PR head, all objective review threads are resolved, PR #213 merges with expected-head SHA protection, post-merge publication/deployment gates pass, and the deployed public site independently proves one coherent `1.9.1-r5` whole shell.

Current production remains `v1.9.1 / 1.9.1-r4` until that sequence completes. `1.9.1-r4` is the immediate previous known-good whole-shell recovery target. Never construct or certify a mixed r4/r5 shell.

## Installed-app whole-shell boundary

`1.9.1-r5` is a new whole-shell runtime identity because executable browser behavior changed. Its HTML asset revision, directly referenced application assets, lazy-loaded Shared Setup/recorder assets, manifest URLs and Service Worker cache identity must converge on r5 before promotion.

The Installable Offline App and v1.3.0 Recovery & Device Resilience baseline remain protected. A failed r5 publication must leave the verified r4 whole shell recoverable without mutating canonical user data.

## Recorder privacy and canonical-storage boundary

Raw account, registered-browser/device, rivalry, pairing or session authority values must never be durably persisted or exported by the guided recorder. Only privacy-safe one-way fingerprints and bounded Shared Setup facts may survive reload. Raw canonical storage bytes must never be placed into repository evidence or chat.

Canonical local gameplay storage remains exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

Shared Setup and the recorder must not mutate those keys merely to establish remote setup evidence. Candidate A remains non-mutating. Candidate B remains read-only. Candidate C remains the sole destructive remote-to-local gameplay Apply authority with transaction-owned mutation and strict exact raw-snapshot rollback.

## Shared Setup evidence boundary

The r5 hotfix does not manufacture missing SSJR evidence. After production promotion, the genuine two-account acceptance must still prove pairing plus exact ACTIVE before every shared league/club operation; one authoritative repository-catalog league; two distinct permanent same-league clubs; one supported `1 / 3 / 5 / 10` season length; both role-distinct confirmations; identical `SHOWDOWN_CONFIRMED · REV 6`; unchanged canonical storage; reload/resume without redraw/reset; and a fresh ACTIVE same-rivalry session resuming the identical setup.

The strict evidence layer also retains the required production denial labels. Synthetic/provider regressions may automate reproducible semantics, but CI must never be substituted for required genuine production observations.

## Permanent safety boundary

Firebase remains Spark and billing remains permanently forbidden. Billing must never be activated. Do not attach Cloud Billing, enable Blaze, add a payment method, activate Cloud Run or Cloud Functions, purchase credits, or select any billing-required provider path. Firestore browser persistence remains memory-only. App Check enforcement remains OFF. Google Auth remains popup-only `browserSessionPersistence` with no additional scopes.

Private pairing, Connected Rivalry and Private Remote Joining remain exact non-enumerable capabilities for exactly two private managers. No public discovery, listing, lobby, matchmaking, community surface, rankings or global leaderboard may be introduced.

## Evidence truth and next boundary

RJR-1 remains frozen `100/100`. SSJR-1.1 remains `0/100`. Source changes, tests, CI, review, merge, deployment, this maintenance record, WEC/SLE/SNS and recorder/validator tooling earn zero SSJR credit by themselves.

After coherent r5 production is independently verified, it is owner test time: resume the two-device acceptance at the real Shared Setup boundary. The first immediate target is clean `SHARED_SETUP_OPEN · REV 1` with no recorder error, followed by the unchanged revision-6, reload/resume and fresh-session evidence sequence. Transfer/results/scoring/history transport remains out of scope until this Shared Setup evidence boundary is resolved.

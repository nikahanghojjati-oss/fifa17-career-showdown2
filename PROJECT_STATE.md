# PROJECT STATE — RJR-1 100/100 / SSJR-1.1 0/100 / PR213 R5 HOTFIX CANDIDATE

Work Environment Continuity (WEC) is mandatory for every successor environment.

Production: `v1.9.1 / 1.9.1-r4`
Status: DEPLOYED / PRODUCTION-PROVEN DURING GENUINE TWO-ACCOUNT ACCEPTANCE

PR #212 merged to main at `710dd4613c2cb915ddec7dd7a7525911277cb333` and published coherent runtime `1.9.1-r4`. The owner then exercised the public `?ssjr-acceptance=1` path with two legitimate private manager/device identities and the production page itself exposed runtime `1.9.1-r4`, proving the r4 shell was genuinely serving during the production-two-account test.

Provider/Rules authority remains the previously reviewed Firebase Spark path from PR #203. Production Rules remain Firebase Spark `cloud.firestore` ruleset `73b4435e-85a8-49f9-92ef-8ffe3ce0f91c`, exact generated-source blob `5bcde9297f6b2927a2184605192ab5b6cd46fb29`. Billing remains permanently OFF. App Check enforcement remains OFF. Firestore browser persistence remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes.

Historical compatibility/provenance remains explicit and must not be rewritten: PR #203 was the production-proven `v1.9.1 / 1.9.1-r3` gameplay/provider runtime baseline before the later recorder publication. PR #205 published the strict production Shared Setup pair validator; PR #207 published the stdin-only privacy-safe recorder; PR #209 published the bounded read-only exact canonical-storage observer; PR #210 made that observer deployable/cache-safe. These remain historical authority markers even though current production is now r4.

Current release candidate: `v1.9.1 / 1.9.1-r5` on PR #213. This bounded hotfix fixes two defects exposed by genuine production acceptance before any Shared Setup draw:
- the guided recorder could route an already ACTIVE private session back to Private Remote Joining instead of Shared Setup diagnostics;
- `productionSharedShowdownSetup.openPanel()` reached authoritative `EMPTY · REV 0` and then threw `focus is not a function` by calling the selected button element instead of its `focus()` method.

PR #213 also hardens simple-mode routing so an expired page-memory session is treated as inactive rather than repeatedly routed into a Shared Setup rejection loop. Dedicated browser regressions now cover ACTIVE-session recorder routing, expired-session routing, and ACTIVE host → authoritative `EMPTY · REV 0` → `SHARED_SETUP_OPEN · REV 1` without the focus exception.

The r5 candidate must retain current production r4 as its previous known-good whole-shell recovery target until r5 is merged, deployed and independently verified. PR213 implementation/tests/CI/deployment earn zero SSJR credit by themselves.

Historical publication lineage remains intact: PR #205 published the strict production Shared Setup pair validator; PR #207 published the stdin-only privacy-safe production recorder; PR #209 published the bounded read-only exact canonical-storage observer; PR #210 made that observer deployable/cache-safe; PR #211 was continuity-only and earned zero SSJR credit; PR #212 published the first query-gated guided production recorder as coherent r4.

RJR100 remains COMPLETE/FROZEN `100/100`. Fixed SSJR-1.1 remains evidence-backed `0/100`. Do not infer SSJR movement from source creation, PRs, CI, reviews, merges, deployments, WEC/SLE/SNS, recorder tooling or synthetic provider proof.

The Installable Offline App, v1.3.0 Recovery & Device Resilience baseline, Local Profiles and Save Library remain protected shipped foundations and must not be reopened absent a demonstrated regression.

Required journey order remains: Profiles/pre-draw Save shell → exact Connected Rivalry pairing → exact ACTIVE → authoritative league → two distinct permanent same-league clubs → 1/3/5/10 season length → both managers confirm identical setup → career-start acknowledgement → transfer/results/season commit → scoring/history/progression → recovery/conflict safety → final reconciliation → terminal close/no resurrection.

The genuine production test already established a real paired ACTIVE host path and an authoritative Shared Setup `EMPTY · REV 0` before any league or club draw. After r5 publication, the immediate score-enabling boundary is to resume that genuine production-two-account acceptance and prove authoritative Shared Setup progression to identical `SHOWDOWN_CONFIRMED · REV 6` on both manager devices, followed by reload/resume and a fresh ACTIVE same-rivalry session with no redraw/reset.

The only irreducible owner/private work is the real two-account/two-independent-browser interaction. A second tab is not sufficient. Automate/sanitize everything else and never ask the owner to paste raw account/device/rivalry/session/pairing identifiers or raw canonical storage bytes into chat.

Canonical localStorage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`. Shared Setup/recorder must not mutate them. Candidate A is non-mutating; Candidate B is read-only; Candidate C remains the sole destructive remote-to-local gameplay Apply authority with transaction-owned strict exact raw-snapshot rollback. Exactly two private managers. No public discovery/listing/lobby/matchmaking/community/rankings/global leaderboards.

Current WEC: `we-2026-09-06-ssjr-production-two-account-a55`; active branch `fix/ssjr-recorder-active-session-guidance`; active PR #213. HTR-1 alone defines Handoff proximity and remains separate from SSJR and CI health. Estimated focused sessions to genuine SSJR100: ~5–10.

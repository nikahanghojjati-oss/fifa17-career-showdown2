# Career Mode Showdown — Developer Start Here

Last updated: 2026-08-12
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Purpose: canonical current-facing first read for a new developer session.

## Sixty-second state

Application version: `v1.1.5`
Runtime asset revision: `1.1.5-r1`
Release status: merged, GitHub Pages deployed and twice-proven
Immutable v1.1.5 runtime authority: `ff755a9863abc843ae9aac45178428e3a104fc65`
GitHub Pages build: `1147995655`
Post-merge evidence: `CAREER_MODE_SHOWDOWN_V1.1.5_POST_MERGE.md`

Candidate A export, Candidate B read-only import analysis and Candidate C atomic restore/recovery are complete and protected. v1.1 Data Safety and Recovery is closed.

v1.1.5 fixed immutable confirmed restore intent and transaction-owned rollback. Its strict exact raw snapshot and precondition model must not be weakened by later work.

The next legal substantive milestone is v1.2.0 — Installable Offline App.

Cloud/accounts, profiles/save registry, QR pairing and two-device synchronization remain dependency-blocked. `CLOUD_STORAGE_FOUNDATION.md` is a future architecture contract only and does not authorize a cloud backend.

## Start every new session in this order

1. Read `00_HANDOFF_GOLDEN_RULE.md`.
2. Fetch current `main` and record its exact SHA.
3. Read this file completely.
4. Read `NEXT_TASK.md` completely.
5. Read `PROJECT_STATE.md` for locked product and architecture state.
6. Read `CAREER_MODE_SHOWDOWN_V1.1.5_POST_MERGE.md` for immutable release evidence.
7. Read the v1.2 section of `POST_V1_ROADMAP_EXECUTION.md` before changing source.
8. Inspect the live source/tests named by the current task.
9. Use older handoffs only when historical intent or supersession chronology is materially needed.

Do not restart Candidate A/B/C planning. Do not ask the owner to repeat decisions already encoded in current source/current authority.

## Authority order

When sources disagree:

1. current source on `main`;
2. later explicit owner decisions;
3. `PROJECT_STATE.md`;
4. `NEXT_TASK.md`;
5. this bootstrap and current post-merge evidence;
6. roadmap/amendments;
7. historical release/handoff records.

A later documentation/CI-only repository head is not automatically a new application runtime authority. For v1.1.5, immutable runtime authority remains `ff755a9863abc843ae9aac45178428e3a104fc65` unless runtime bytes are intentionally changed in a later release.

## Locked product model

Career Mode Showdown is a static GitHub Pages companion for exactly two managers playing their own FIFA 17 Career Mode saves outside the website.

Current model remains:

- exactly two managers;
- one local browser/device;
- one active local Showdown;
- manual FIFA 17 result entry;
- browser localStorage persistence;
- vanilla HTML/CSS/JavaScript;
- local-first operation.

## Locked competition rules

Per manager per Season:

- Champions League winner: +5;
- domestic league winner: +3;
- main domestic cup winner: +1;
- 100 league points and/or 100 league goals: shared maximum +1;
- Top Scorer and/or Top Assist: shared maximum +1;
- maximum Season score: 11.

Winner logic:

1. higher Season score wins;
2. equal non-zero scores are a Draw;
3. only 0–0 uses league position;
4. equal league position at 0–0 uses league points;
5. if still tied, Draw.

Other locked rules include same selected league, different permanent clubs, no post-assignment reroll, 1/3/5/10 Season Showdowns and the existing Transfer Challenge state machine.

## Core architecture ownership

Navigation/history authority: `js/screens.js`.

Canonical persistence authority: `js/storage.js`.

Canonical current localStorage keys remain exactly:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Scoring authority: `js/scoring.js`.
Canonical Showdown model: `js/showdown.js`.
Derived analytics: `js/analytics.js`.

Optional/heavy systems remain lazy when practical. Do not introduce a second route or persistence owner.

## Data Safety and Recovery authority

Candidate A remains non-mutating export.

Candidate B remains strictly read-only analysis/migration/conflict preview.

Candidate C remains the only local import stage permitted to commit canonical state.

The protected Candidate C sequence requires:

1. flush pending canonical writes;
2. freeze the exact confirmed file, choices and reviewed raw precondition before asynchronous revalidation;
3. freshly revalidate that exact file;
4. acquire a strict exact raw snapshot that distinguishes absence from read failure;
5. reject stale reviewed state;
6. compute the complete candidate in memory;
7. pass exact planning state into canonical storage as a transaction precondition;
8. recheck exact bytes immediately before each write;
9. commit active → Legacy → preferences;
10. record mutation ownership only after a successful write;
11. verify committed bytes;
12. on failure, roll back only transaction-owned mutations in reverse commit order;
13. refuse to clobber a newer/unowned third value;
14. verify rollback byte-for-byte;
15. enter locked critical recovery if ownership/rollback cannot be proven;
16. synchronize runtime/navigation only after complete success;
17. preserve deterministic repeat-import zero-write behavior and corrupt raw bytes unless explicit replacement was selected.

Recovery UX permanently distinguishes `RESTORE NOT STARTED`, verified `RESTORE ROLLED BACK` and `CRITICAL RECOVERY STATE`.

## Visual and performance authority

The accepted Marco Reus loading/Home presentation remains protected.

The accepted licensed route-photo archive remains protected, including James Rodríguez, Marcus Rashford and Anthony Martial plus the later route-scoped visual set.

Startup limits remain:

- eager raw code: 165,000 bytes;
- eager gzip code: 37,500 bytes;
- startup Marco Reus portrait: 95,000 bytes;
- combined first-party startup bytes: 260,000 bytes.

Normal loading minimum remains 2700 ms; reduced-motion startup remains 220 ms.

## Permanent validation topology

There are 14 permanent workflow families and 27 protected executable workflow blocks.

The release families include Candidate B, Candidate C, Stability and five-pass Burn-In. Never weaken thresholds or delete assertions merely to make a candidate green.

Post-release smart CI orchestration fixes the GitHub Actions scheduling race and removes duplicated long-suite work. Fresh first-attempt automatic runs may replace stale same-lane work, while reruns/manual dispatches queue instead of cancelling active proof. Heavy Stability/Candidate B/C/Burn-In lanes ignore Markdown-only changes. Local Stability now owns one canonical provenance + complete integration journey per attempt; Candidate B/C each own one authoritative browser execution per attempt; Release Burn-In is push/manual only and repeats two focused complete integration journeys. Independent repetition uses GitHub rerun attempts rather than hidden duplicate loops. `tests/contracts/ci-orchestration-contracts.cjs` protects this policy.

## Current legal task

v1.1.5 release work is closed.

Begin v1.2.0 — Installable Offline App only after reading the v1.2 roadmap section and current source.

The v1.2 design must preserve local data safety while adding install/offline/update behavior. Service-worker cache/update logic must not strand users on stale incompatible runtime assets or threaten localStorage recovery guarantees.

Do not jump from v1.1.5 directly to cloud/accounts, profiles, QR pairing or two-device play.

## Exact continuation sentence

A correctly oriented developer should be able to state:

`Career Mode Showdown v1.1.5 / 1.1.5-r1 is merged, deployed and twice-proven. Immutable runtime authority is ff755a9863abc843ae9aac45178428e3a104fc65. Candidate A export, Candidate B read-only analysis and Candidate C atomic restore/recovery are complete and protected. Candidate C uses immutable confirmed intent, strict exact raw snapshots/preconditions and transaction-owned anti-clobber rollback. The Stability rerun cancellation race was a CI scheduling defect, not an application failure, and the post-release workflow policy prevents reruns/manual proofs from cancelling active evidence. The next legal substantive milestone is v1.2.0 Installable Offline App; cloud work remains future-contract-only.`

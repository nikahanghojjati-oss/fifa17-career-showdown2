# PROJECT STATE — Career Mode Showdown

Last updated: 2026-08-12

## Authority and current release

Application version: `v1.1.5`
Runtime asset revision: `1.1.5-r1`
Production status: merged, GitHub Pages deployed and twice-proven
Immutable v1.1.5 runtime authority: `ff755a9863abc843ae9aac45178428e3a104fc65`
GitHub Pages build: `1147995655`
Production evidence: `CAREER_MODE_SHOWDOWN_V1.1.5_POST_MERGE.md`
Current substantive milestone: v1.2.0 — Installable Offline App

Authority when sources disagree:

1. current source on `main`;
2. later explicit owner decisions;
3. this file;
4. `NEXT_TASK.md`;
5. current bootstrap/post-merge evidence;
6. roadmap/amendments;
7. historical release and handoff records.

Later documentation/CI-only commits do not redefine immutable v1.1.5 runtime authority when application runtime bytes remain unchanged.

## Product model

Career Mode Showdown is a static GitHub Pages companion for exactly two managers playing separate FIFA 17 Career Mode saves outside the site.

Current mode remains:

- exactly two managers;
- one local browser/device;
- one active Showdown;
- manual FIFA 17 result entry;
- localStorage persistence;
- plain HTML/CSS/JavaScript;
- local-first operation.

## Locked competition rules

- Showdown lengths: 1, 3, 5 or 10 Seasons;
- both managers use the same selected league;
- clubs are different and permanent after confirmation;
- Champions League winner = 5 points;
- domestic league winner = 3 points;
- main domestic cup winner = 1 point;
- 100 league points and/or 100 league goals share one +1 performance bonus;
- Top Scorer and/or Top Assist share one +1 awards bonus;
- maximum Season score = 11;
- equal non-zero scores are a Draw;
- only 0–0 uses tiebreakers: better league position, then league points;
- League Wheel requires explicit Continue after selection;
- Club Assignment requires explicit rivalry confirmation before the Showdown begins.

## Core authority boundaries

### Routing

`js/screens.js` remains sole route/history authority. Smart Back stays centralized.

### Persistence

`js/storage.js` remains canonical persistence authority.

Current canonical localStorage keys remain exactly:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Candidate C transaction support does not create a second persistence owner.

### Scoring and analytics

`js/scoring.js` remains scoring authority.

`js/analytics.js` remains derived analytics authority.

### Lazy runtime

Heavy gameplay, Transfer, Season Review, Statistics, Settings, football visuals and Data Management systems remain lazy when practical.

### Performance

Protected startup ceilings remain:

- 165,000 raw eager code bytes;
- 37,500 gzip eager code bytes;
- 95,000 startup Marco Reus portrait bytes;
- 260,000 combined first-party startup bytes.

Normal loading minimum remains 2700 ms. Reduced-motion startup remains 220 ms.

## Data Safety and Recovery — complete

Candidate A remains non-mutating backup/export.

Candidate B remains strictly read-only import analysis/migration/conflict preview.

Candidate C remains the only import stage allowed to commit canonical state.

The protected v1.1.5 Candidate C transaction requires:

1. flush pending canonical writes;
2. freeze exact confirmed file, choices and reviewed raw precondition before asynchronous revalidation;
3. freshly revalidate that exact confirmed file;
4. capture a strict exact raw snapshot that distinguishes true absence from read failure;
5. reject stale reviewed state;
6. compute every final candidate value in memory;
7. require explicit active/Legacy/preferences/conflict decisions;
8. pass the planning snapshot into canonical storage as an exact transaction precondition;
9. recheck exact bytes immediately before each mutation;
10. commit active → Legacy → preferences;
11. record mutation ownership only after successful write;
12. verify committed bytes;
13. on failure, roll back only transaction-owned mutations in reverse commit order;
14. refuse to clobber newer/unowned third values;
15. verify owned rollback byte-for-byte;
16. enter locked critical recovery if ownership or rollback cannot be proven;
17. invalidate uncertain runtime caches after critical recovery;
18. synchronize runtime/navigation only after complete success;
19. keep repeated identical restore a zero-write no-op;
20. preserve corrupt raw bytes unless explicit replacement was selected.

Recovery UI permanently distinguishes `RESTORE NOT STARTED`, verified rollback and critical recovery.

## v1.1.5 release proof

Functional pre-identity head `dbcdffaae927163e5a9c8b44466ff2084e814de5` passed all 14 permanent workflow families.

Frozen official candidate `97088274e1eac377927476b84c6090e7233e0997` passed the complete 14-family pre-merge matrix twice, including Candidate C twice-browser recovery, Stability two-cycle Chromium and Burn-In 5/5.

PR #25 merged with expected-head protection to immutable runtime authority `ff755a9863abc843ae9aac45178428e3a104fc65`.

GitHub Pages build `1147995655` deployed that exact commit.

Production then passed all 14 families twice. Both Stability production attempts proved exact public runtime bytes and passed runtime provenance, Home/Reus, licensed football visuals, Candidate A, Candidate B, Candidate C and the complete live journey. Candidate C twice-browser proof and Burn-In 5/5 also passed twice in production.

## Stability scheduling defect and remedy

During the second pre-merge matrix an older Stability run was re-run while a newer same-ref Stability proof was active. Unconditional GitHub Actions `cancel-in-progress: true` caused the older re-run to cancel the newer Chromium job.

This was not an application assertion failure.

The cancelled Stability job alone was retried on the exact same frozen SHA and passed contracts plus both Chromium cycles.

Post-release CI hardening now permits cancellation only for a fresh first-attempt automatic run. Re-runs and manual proof dispatches cannot cancel an already-running Stability/Candidate B/C proof. Burn-In remains non-cancelling. A permanent repository contract protects this policy.

## Visual authority

The accepted Marco Reus loading/Home presentation remains protected.

The accepted route-scoped licensed football-photo archive remains protected, including the accepted James Rodríguez, Marcus Rashford and Anthony Martial replacements.

Do not revive rejected historical image derivatives merely because older handoffs mention them.

## Permanent validation topology

There are 14 permanent workflow families and 27 protected executable workflow blocks.

Do not weaken thresholds, remove assertions or raise budgets merely to make a release green.

Cancelled CI work must be distinguished from failed assertions in release evidence.

## Future cloud boundary

`CLOUD_STORAGE_FOUNDATION.md` defines future account/profile/save/device identity, revision/CAS, conflict, tombstone, privacy and security requirements.

It is a future architecture contract only. No current backend/network mutation is authorized.

Future remote state must eventually enter the same local exact-snapshot/precondition/verification/transaction-owned rollback boundary rather than bypassing canonical storage authority.

## Current gate and next dependency

v1.1.5 is closed. Do not continue maintenance release-freeze work or recreate Candidate C.

The next legal substantive milestone is v1.2.0 — Installable Offline App.

v1.2 must introduce manifest/service-worker/install/offline/update behavior without weakening local data safety or allowing mixed/stale runtime revisions.

Profiles/save registry, cloud/accounts, QR pairing and two-device work remain dependency-blocked behind the approved roadmap order.

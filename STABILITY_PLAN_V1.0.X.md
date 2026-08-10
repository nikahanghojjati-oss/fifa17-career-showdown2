# Career Mode Showdown v1.0.x Stability Plan

Plan date: August 10, 2026

Current release: v1.0.1 Stability Hardening

Stable product baseline: v1.0.0 tag `6a4977d0f079cf9ea811ae86a9fb6b4026a418dc`

## Purpose

This plan converts broad external concerns about AI-assisted code quality into source-specific, repeatable evidence. It does not reopen the accepted product design, replace the vanilla JavaScript architecture, or introduce a feature milestone inside the stability lane.

The governing rule is simple: refactor or change runtime behavior only when a reproducible defect, measured bottleneck, security issue, migration requirement, or documented ownership conflict proves the need.

## External review disposition

| Review observation | Decision | Evidence and response |
| --- | --- | --- |
| AI-generated code may be less clean than professional code | Reject as an unsupported generalization for this repository | Routing, persistence, analytics, scoring, lazy loading, and UI responsibilities already have explicit authorities and regression gates. No rewrite is justified without a concrete collision or defect. |
| A framework could make implementation faster | Reject for the present architecture | The static vanilla application is within its performance budgets and has mature module boundaries. A framework migration would add risk without addressing an observed product problem. |
| Hidden edge cases may remain | Accept and make testable | v1.0.1 adds corrupt-data, quota, rapid activation, rapid draft, reload, browser leave/return, Smart Back, and double-submit fixtures. |
| Accessibility gaps may remain | Accept and broaden the matrix | The new mobile Season Review scan found a real 3.51:1 contrast defect; v1.0.1 raises it to 5.63:1 and permanently guards the token. |
| Future data-model growth increases risk | Accept; existing order remains correct | Export/import, migrations, stable IDs, and the save registry still precede profiles, cloud, and two-device play. No dependency is skipped. |
| The module count may feel dense to a beginner | No runtime action | File count is not a defect. Separation is retained unless profiling or ownership analysis proves harmful fragmentation. |

## v1.0.1 implementation boundary

Included:

1. Repository-owned Chromium and axe audit at 1366 × 768 and 390 × 844.
2. Accessibility scans of Home, setup, League, Club confirmation, Showdown Home, all Transfer phases, Season entry, Review, Summary, Legacy, Statistics, Trophy Room, Rule Book, and Settings.
3. Corrupt active-save, Legacy, and preference fixtures that fail closed without erasing raw bytes.
4. Quota-rejection fixture proving critical-save rollback and blocked navigation.
5. Rapid Start activation and double Season confirmation guards.
6. Rapid Transfer draft input plus reload recovery.
7. Reload and browser Back/Forward leave-and-return recovery.
8. Exact horizontal containment that ignores safely clipped animation internals but rejects visible escape.
9. Two consecutive complete CI browser runs.
10. Post-main GitHub Pages revision polling, byte comparison of every runtime file, and a complete journey on the public URL.
11. Node 24 action generations for checkout and Node setup.
12. One reproduced runtime fix: mobile Season Review unawarded-label contrast.

Excluded:

- gameplay, scoring, Transfer, assignment, or tiebreak changes;
- storage schema changes;
- export/import or backup UI;
- PWA/service-worker work;
- profiles, save slots, cloud, accounts, QR pairing, or online play;
- visual redesign, new leagues, achievements, analytics, or media;
- framework conversion or module consolidation without evidence.

## Stability release gates

v1.0.1 is releasable only when:

1. all legacy deterministic workflow blocks pass;
2. stability contract fixtures pass under Node 24;
3. two consecutive local CI browser audits pass;
4. each audit completes both Chromebook and reduced-motion touch/mobile journeys;
5. every changed or newly covered state has zero serious automated accessibility violation;
6. corrupt data remains guarded and is not silently destroyed;
7. simulated quota rejection cannot advertise or navigate into unsaved state;
8. rapid input and repeated activation cannot create duplicate records;
9. no page error, unexpected console error, duplicate ID, failed local request, or visible horizontal escape remains;
10. every changed runtime byte uses `1.0.1-r1`;
11. PR and post-merge checks pass on immutable SHAs;
12. all deployed runtime files match merged `main` byte for byte;
13. the complete browser journey passes against the deployed Pages URL;
14. v1.0.0 remains a known rollback tag.

## Stability lane exit

The lane is intentionally finite.

- If v1.0.1 passes two consecutive candidate runs, PR checks, post-merge checks, deployment parity, and the deployed journey with no additional product fix, it satisfies the planned stability-lane exit.
- v1.0.2 is not precommitted. It exists only for a reproducible defect discovered during owner soak or deployed verification.
- Cosmetic preference changes and new features do not justify v1.0.2.
- Once the exit gate is met and owner acceptance is recorded, the current milestone becomes v1.1.0 Data Safety and Recovery.

## Refined v1.1.0 execution split

The roadmap order is unchanged, but the large Data Safety milestone should be implemented in three bounded candidates:

### Candidate A: backup envelope and export

- freeze the supported schema corpus;
- assign a backup-format identifier and version;
- export active Showdown, Legacy, and preferences without mutation;
- add counts, app version, timestamp, and corruption-detection checksum;
- validate human readability and large-history performance.

### Candidate B: import analysis and migrations

- parse in isolation with input-size limits;
- validate every supported historical fixture and reject future formats;
- run ordered migrations without writing;
- show managers, active save, archive count, duplicates, and conflicts in a dry-run preview.

### Candidate C: atomic restore and recovery UX

- capture a complete pre-import snapshot;
- apply explicit replacement/merge/preference choices through `js/storage.js`;
- roll back every key if any write fails;
- verify deduplication and idempotent re-import;
- complete Chromebook/mobile, accessibility, corruption, quota, and deployed tests.

No v1.1 candidate may introduce profiles, save slots, cloud storage, or background upload.

## Permanent complexity controls

Every later milestone adds these checks to the existing definition of done:

1. Record which authority owns every new state and write.
2. Record every schema and stored-field change before implementation.
3. Maintain golden old-data fixtures and run migrations twice to prove idempotence.
4. Measure startup bytes and derived-calculation time before adding a cache or dependency.
5. Reject a second router, direct storage access outside `js/storage.js`, or persisted derived analytics.
6. Require a rollback path before a destructive or structural release.
7. Split an extra-large milestone before implementation if its migration, UI, and recovery risks cannot be tested independently.
8. Treat owner browser acceptance as an additional gate for material interaction or visual changes, never as a substitute for automated evidence.

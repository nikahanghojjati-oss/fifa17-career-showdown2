# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-11

Application version: v1.1.2

Runtime asset revision: `1.1.2-r1`

Runtime implementation authority: `6dfea100829016eee4820b342729b8c823426f95`

## Current baseline: v1.1.2 Candidate B — Complete and Protected

Candidate A — Versioned Backup Envelope + Non-Mutating Export — is complete, deployed and protected.

Candidate B — Import Analysis + Migration Preview — is complete, merged, deployed and protected. It analyzes a selected local backup in isolation, verifies format/checksum/schemas, previews supported migrations and classifies conflicts while performing zero canonical storage writes/removals.

Candidate B technical release proof is closed:

- 13/13 permanent gate families passed twice on one immutable pre-merge candidate;
- the exact expected-head merge is `6dfea100829016eee4820b342729b8c823426f95`;
- GitHub Pages deployment `5860457927` serves the runtime;
- 13/13 permanent gate families passed twice again on the exact production runtime;
- both production Stability executions passed exact deployed byte parity, runtime provenance, Home/Reus, licensed football visuals, Candidate A export, Candidate B import analysis and the complete public gameplay/navigation journey.

See `CAREER_MODE_SHOWDOWN_V1.1.2_POST_MERGE.md` for complete evidence and failure history.

## Golden handoff rule

Read `00_HANDOFF_GOLDEN_RULE.md` before implementation.

Every meaningful owner instruction, action, architectural decision, failure, rejected evidence, correction, threshold/budget result, gate result, commit, PR, merge, deployment and next-step decision must be recorded continuously in a public repository handoff while the work is happening.

Do not wait until the end of Candidate C to create its handoff.

## Next substantive roadmap task: Candidate C — Atomic Restore + Recovery UX

Candidate C is now the next legal v1.1.x build.

Candidate C is the first stage allowed to write imported canonical state. It must build on Candidate A export and Candidate B analysis rather than bypassing them.

### Candidate C mandatory transaction sequence

1. flush all pending canonical application writes before restore begins;
2. revalidate the selected/analyzed backup immediately before apply, including size where applicable, JSON/format, checksum, current/supported schemas, migrations and unresolved conflicts;
3. snapshot exact raw bytes for every affected canonical storage key before the first mutation;
4. require explicit user decisions for active Showdown replacement, Legacy merge/conflict handling and application-preference restoration;
5. compute all final candidate values entirely in memory before the first write;
6. perform canonical writes only through `js/storage.js` authority;
7. treat the complete multi-key restore as one atomic transaction boundary;
8. verify every committed key/value after writing;
9. if any write or post-write verification fails, restore every affected key to its exact raw pre-restore bytes;
10. verify rollback byte-for-byte and surface rollback failure as a critical recovery state rather than pretending recovery succeeded;
11. invalidate in-memory caches, route-derived state and navigation only after the complete restore transaction succeeds;
12. make re-import/idempotence behavior deterministic and tested;
13. retain corrupt raw-data preservation/recovery semantics;
14. keep explicit recovery/export guidance available before destructive active replacement;
15. do not introduce a second persistence owner.

### Candidate B must remain a protected dependency

Candidate C must not reinterpret Candidate B `PREVIEW READY` as permission to write.

Before apply, Candidate C must revalidate the backup and user choices. Candidate B remains the read-only analysis/migration/conflict-preview authority.

The current Candidate B contract remains protected:

- maximum input ceiling;
- strict JSON/format/checksum/schema validation;
- hostile-structure/future-schema rejection;
- ordered deterministic migrations;
- string Showdown IDs for current v1.1 conflict comparison;
- explicit active/Legacy/preferences preview;
- zero canonical writes/removals during analysis;
- no network request.

### Candidate C required failure-injection evidence

Candidate C gates must deliberately reproduce and prove recovery from at least:

- first-key write failure;
- middle-key write failure after one earlier key changed;
- final-key write failure;
- quota/storage exception;
- post-write verification mismatch;
- rollback write failure;
- corrupt pre-existing raw bytes;
- same-ID Legacy conflicts;
- rapid/double Apply activation;
- page lifecycle interruption boundary where technically reproducible;
- stale analysis / backup changed between preview and apply;
- repeated import of the same already-restored backup.

A restore gate is not sufficient if it only proves the happy path.

### Candidate C UX/accessibility requirements

The restore UI must make irreversible/overwriting consequences explicit before commit and must clearly separate:

- current state;
- analyzed backup state;
- user-selected resolution choices;
- what will be replaced/merged/left unchanged;
- restore-in-progress state;
- success state;
- rollback/recovery failure state.

Keyboard, touch, Chromebook/windowed, mobile/DPR2, reduced-motion, focus, axe, overflow and minimum-target coverage remain required.

## Protected systems

Candidate C must not change unrelated authority:

- max-11 scoring or 0–0-only tiebreak logic;
- exactly-two-manager model;
- League/Club assignment semantics;
- Transfer Challenge state machine;
- Season Review persistence boundary;
- Statistics/Legacy/Trophy calculations;
- `js/screens.js` route/history authority;
- football-photo source authority and accepted visual presentation;
- Candidate A export semantics;
- Candidate B analysis semantics except evidence-driven compatibility hooks needed for apply revalidation;
- the roadmap reservation of v1.2.0 for Installable Offline App.

## Dependency boundary after Candidate C

Do not jump to PWA, profiles/save registry, cloud, accounts, QR pairing or two-device work before Candidate C is merged, deployed and proven.

After Candidate C closes the v1.1 Data Safety and Recovery milestone, follow the documented dependency order in `POST_V1_ROADMAP_EXECUTION.md`. v1.2.0 remains Installable Offline App.

## Required continuation reading

A fresh developer must begin with:

1. `00_HANDOFF_GOLDEN_RULE.md`;
2. `00_DEVELOPER_START_HERE.md`;
3. this `NEXT_TASK.md`;
4. `CAREER_MODE_SHOWDOWN_V1.1.2_POST_MERGE.md`;
5. the Candidate B release/diagnostic handoffs when deeper history is needed;
6. Candidate C sections in `POST_V1_ROADMAP_EXECUTION.md`;
7. live `js/storage.js`, `js/backup.js`, `js/importAnalysis.js`, `js/optionalModules.js` and Data Management UI source before implementation.

Start from current `main`; do not resume old Candidate B or visual branches.
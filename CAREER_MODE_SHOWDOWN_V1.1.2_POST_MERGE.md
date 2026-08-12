# Career Mode Showdown — v1.1.2 Candidate B Post-Merge Production Continuation

Last updated: 2026-08-11
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Application: `v1.1.2`
Runtime revision: `1.1.2-r1`
Runtime implementation authority: `6dfea100829016eee4820b342729b8c823426f95`
PR: `#18 — v1.1.2: Candidate B import analysis and migration preview`
GitHub Pages deployment: `5860457927`

Read this file after the Candidate B implementation, continuation, release and diagnostic handoffs. The permanent operating rule remains `00_HANDOFF_GOLDEN_RULE.md`.

## Golden rule reaffirmed

The owner requires every meaningful development action, decision, failure, correction, gate result, rejected evidence, merge, deployment and next-step decision to be recorded continuously in a public repository handoff because a session can be interrupted without warning.

This v1.1.2 build followed that rule throughout. The earlier Candidate B handoffs preserve all pre-publication failures, fixture corrections, startup-budget evidence, visual cleanup, validator-staging incidents and diagnostic PR evidence instead of rewriting the history into a false clean path.

Future developers must continue the same practice.

## Final Candidate B product boundary

Candidate B is the read-only Import Analysis + Migration Preview stage of v1.1 Data Safety and Recovery.

It now provides:

- local Candidate A backup file selection through one visible choose/drop zone;
- drag/drop, keyboard, touch and reduced-motion paths;
- 5 MiB maximum File size with rejection before `File.text()` where File metadata is available;
- strict JSON parsing;
- exact Candidate A backup format ID/version checks;
- SHA-256 checksum verification;
- hostile object-key and excessive-structure protection before canonicalization;
- current Showdown and preference schema validation;
- ordered Showdown schema 1→2 migration preview;
- ordered preferences schema 1→2 migration preview;
- deterministic/non-mutating/idempotent migration contracts;
- unsupported future backup and data schemas failing closed;
- Showdown ID comparison as persisted strings;
- conflict classification for new, exact duplicate, same ID/same effective revision, same ID/different revision and malformed/unresolvable records;
- same-ID conflicting records inside one backup blocking instead of being silently resolved;
- active Showdown impact preview;
- Legacy impact preview;
- application-preference impact preview;
- corrupt current raw bytes preserved and surfaced as warnings;
- Candidate A export → Candidate B analysis round-trip;
- explicit `Preview Only · No Restore Writes` presentation;
- `readyForRestore:false` by design;
- no Restore/Apply control;
- no network request;
- zero canonical localStorage writes/removals.

Candidate C remains the first legal stage allowed to write imported canonical state.

## Architecture preserved

The following ownership boundaries remain unchanged:

- `js/storage.js` is the sole persistence authority;
- Candidate B does not modify `js/storage.js`;
- Candidate B reads current raw data only through `captureCareerModeRawBackupInputs()`;
- `js/screens.js` remains route/history authority;
- `js/scoring.js` remains scoring/tiebreak authority;
- current storage keys/schema remain unchanged;
- Candidate A backup/export remains protected;
- Candidate B makes no restore write;
- Candidate C must later write only through `js/storage.js`.

Protected gameplay/state systems were not intentionally changed:

- max-11 scoring;
- 0–0-only league-position/league-points tiebreak;
- exactly-two-manager contract;
- League confirmation;
- Club Assignment transaction/reveal semantics;
- Transfer Challenge state machine;
- Season Review persistence boundary;
- Statistics/Legacy/Trophy calculations.

Protected football visual source authority was also preserved. No player image binary or `data/footballVisuals.js` source definition changed in Candidate B.

## Candidate A checksum hardening

`js/backup.js` remains the backup checksum authority.

Because Candidate B now feeds user-selected parsed JSON through checksum verification, the canonical object accumulator was hardened from a normal `{}` to `Object.create(null)`. This prevents special object-key behavior during canonical construction without changing valid JSON key ordering or valid Candidate A checksum bytes.

SHA-256 continues to mean corruption detection only. Candidate B does not describe the checksum as authentication, a digital signature or proof of trusted origin.

## Recorded pre-publication failures and corrections

The complete path is preserved in the earlier handoffs. Key evidence includes:

1. `31544138146` — post-generation helper used an indentation-sensitive source match. Generator succeeded; no generated runtime was committed.
2. `31544312802` — a preference test fixture migrated to the same state as local preferences while the assertion expected a change. Analyzer correctly reported no change; only the fixture was corrected.
3. `31544488831` — a conflicting same-ID fixture expected both strict conflict blocking and an exact-duplicate warning for the same conflict group. Strict blocking was preserved; only the contradictory assertion was removed.
4. `31544558663` — unchanged raw startup budget correctly failed at `165,083` bytes against the `165,000` limit. Gzip was green. The budget was not raised.
5. `31544710189` — complete guarded integration succeeded after compacting only the redundant lazy-module readiness predicate.
6. `31545416320` — manual screenshot review had identified redundant browser-native `No file chosen` chrome after drag/drop. The native picker was visually clipped while the visible drop/choose control and live filename state remained accessible; Candidate A/B browser evidence passed afterward.
7. `31545065724` — validator-staging helper had a quote-escape match error. No workflow blob was published. Corrected staging run `31545133997` succeeded.
8. PR diagnostic head `09164ff8af6919da7642c4be912e44cdae144629` finished 12/13 green. Static App alone found that the new changelog entry omitted literal runtime identity `1.1.2-r1`. The changelog was corrected without changing runtime behavior or thresholds.

These failures are intentionally retained as evidence and must not be hidden by future summaries.

## Startup/performance release result

The pre-existing limits were preserved:

- eager raw maximum: `165,000` bytes;
- eager gzip maximum: `37,500` bytes.

Final Candidate B guarded integration:

- eager raw: `164,960` bytes;
- eager gzip: `36,935` bytes;
- eager assets: 8;
- `js/importAnalysis.js` remains lazy and absent from the initial shell.

No startup or accessibility threshold was raised for v1.1.2.

## Permanent gate matrix

v1.1.2 has thirteen permanent feature/workstream/release families:

1. Home Bootstrap
2. League Confirmation
3. Transfer Workstream
4. Season Review
5. Statistics Workstream
6. Settings Workstream
7. V1 Visual Immersion
8. Licensed Football Visuals
9. Final Polish
10. Static App
11. Stability Lane
12. v1.1.2 Release Burn-In
13. Candidate B Import Analysis

Candidate B's dedicated workflow owns deterministic import/migration/conflict/no-write contracts plus two real-browser Candidate B executions and screenshots.

Stability owns Candidate B inside each of two consecutive complete local Chromium cycles and again inside deployed-site smoke.

Release Burn-In remains five independent complete gate journeys and Candidate B runs inside every pass.

## Official frozen PR proof

Official frozen candidate:

`6004223beacd6a60a2100ba82d45396c205bb8f9`

The SHA remained immutable during official proof.

Final pre-merge result:

`13/13 permanent families × 2 successful independent executions`

First official Candidate B screenshot artifact:

`9122546387`

Second official Candidate B screenshot artifact:

`9122736111`

Both were manually reviewed after machine gates. Desktop blocking and DPR2 mobile ready states remained legible, explicitly non-destructive, free of the redundant native file chrome and consistent with the Candidate C boundary.

Stability passed contracts plus two consecutive complete Candidate A/B + provenance + Home + licensed-photo + full-journey Chromium cycles in each official execution.

Release Burn-In passed all five complete jobs in each official execution.

No source/runtime/document byte changed between the two official executions.

## Exact protected merge

PR #18 was marked ready only after official double proof.

Expected-head merge protection required:

`6004223beacd6a60a2100ba82d45396c205bb8f9`

Runtime merge commit:

`6dfea100829016eee4820b342729b8c823426f95`

This is the v1.1.2 runtime implementation authority even after later documentation-only continuity commits.

## GitHub Pages deployment

Deployment ID:

`5860457927`

Deployment SHA:

`6dfea100829016eee4820b342729b8c823426f95`

Deployment result:

`SUCCESS`

The public GitHub Pages build was not considered proven merely because the source merge was green. Stability explicitly verified deployed bytes and ran browser journeys against Pages.

## First production execution

Production workflow runs attached to the exact runtime merge include:

- Home Bootstrap `31547066370`;
- League Confirmation `31547066438`;
- Transfer Workstream `31547066485`;
- Season Review `31547066323`;
- Statistics Workstream `31547066538`;
- Settings Workstream `31547066402`;
- V1 Visual Immersion `31547066443`;
- Licensed Football Visuals `31547066418`;
- Final Polish `31547066397`;
- Static App `31547066451`;
- Stability Lane `31547066390`;
- v1.1.2 Release Burn-In `31547066364`;
- Candidate B Import Analysis `31547066392`.

First production result:

`13/13 permanent families successful`

Candidate B production artifact:

`9122876950`

Manual production screenshot review confirmed the cleaned file-selection UI, explicit read-only messaging, clear oversized-file block, mobile Preview Ready/checksum state and Candidate C-unavailable boundary.

First production Stability passed:

- contracts;
- two consecutive complete local Chromium cycles;
- public deployed-site smoke.

The public smoke passed in order:

1. exact runtime-byte parity;
2. deployed runtime-error provenance;
3. deployed Home / Marco Reus visual audit;
4. deployed licensed football-photo audit;
5. deployed Candidate A backup/export audit;
6. deployed Candidate B import-analysis audit;
7. complete deployed gameplay/navigation journey.

## Second production execution

The full thirteen-family production matrix was executed again on the unchanged runtime merge SHA.

Second production result:

`13/13 permanent families successful again`

Candidate B second-production jobs:

- contracts `93964248931` — SUCCESS;
- browser `93964279481` — SUCCESS.

Candidate B second-production screenshot artifact:

`9123165543`

The second-production artifact was manually reviewed. Desktop blocking remained explicit and non-destructive. DPR2 mobile retained the dropped filename, `PREVIEW READY`, `CHECKSUM VERIFIED`, the cleaned visible file control and explicit statement that Candidate C restore remains unavailable. No correction was justified.

Licensed Football Visuals second production:

- contracts `93964187718` — SUCCESS;
- browser `93964242617` — SUCCESS.

Release Burn-In second production five-way set:

- pass 1 `93964292565` — SUCCESS;
- pass 2 `93964322070` — SUCCESS;
- pass 3 `93964308551` — SUCCESS;
- pass 4 `93964307894` — SUCCESS;
- pass 5 `93964293124` — SUCCESS.

Stability second production:

- contracts `93964271854` — SUCCESS;
- two-cycle Chromium stability `93964327846` — SUCCESS;
- deployed-site smoke `93965145272` — SUCCESS.

The second public smoke again passed exact bytes, provenance, Home/Reus, licensed photos, Candidate A export, Candidate B import preview and the complete deployed journey.

At production closure there were zero failed and zero in-progress workflow runs attached to runtime merge `6dfea100829016eee4820b342729b8c823426f95`.

## Final technical release status

`v1.1.2 CANDIDATE B — COMPLETE, MERGED, DEPLOYED, TWICE-VALIDATED PRE-MERGE AND TWICE-VALIDATED IN PRODUCTION`

Runtime authority:

`6dfea100829016eee4820b342729b8c823426f95`

Application/runtime identity:

`v1.1.2 / 1.1.2-r1`

Candidate B is now a protected dependency for Candidate C.

## Next legal substantive task — Candidate C

The next v1.1.x build is Candidate C — Atomic Restore + Recovery UX.

Candidate C is the first legal stage allowed to write imported canonical state. It must preserve Candidate B as the analysis/preview boundary and must not create a second persistence owner.

Candidate C minimum safety sequence:

1. flush any pending canonical application writes before restore begins;
2. revalidate the selected/analyzed backup immediately before apply, including checksum, format, schemas and migration result;
3. snapshot exact raw bytes for every affected canonical storage key before mutation;
4. require explicit user choices for active replacement, Legacy merge/conflict handling and preference restore;
5. compute all final candidate values in memory before the first write;
6. perform writes only through `js/storage.js` authority;
7. treat the multi-key restore as one transaction boundary;
8. if any write or post-write verification fails, restore every affected key to its exact raw pre-restore bytes;
9. verify rollback byte-for-byte and surface rollback failure as a critical recovery state;
10. invalidate in-memory caches/navigation only after a successful complete commit;
11. make re-import/idempotence behavior explicit and tested;
12. retain corrupt raw-data preservation/recovery semantics;
13. keep PWA, profiles/save registry, cloud, accounts and two-device work dependency-blocked.

Candidate C must receive its own deep deterministic/browser/fault-injection/rollback/deployed gates. Do not shortcut it because Candidate B is green.

## Continuation rule

Start future work from current `main`, not old Candidate B branches.

Read `00_HANDOFF_GOLDEN_RULE.md` first. Then read `00_DEVELOPER_START_HERE.md`, `NEXT_TASK.md`, this post-merge handoff and the Candidate C roadmap sections before coding.

Do not reinterpret Candidate B's `PREVIEW READY` state as permission to write. Candidate B intentionally has `readyForRestore:false`; Candidate C must revalidate and obtain explicit user decisions before any commit.

## Interruption-resume closure and final documentation-head proof

The development session was interrupted after the final documentation alignment had been committed and while the documentation-head Stability Lane was still running. On explicit owner instruction to retry from the interruption point, work resumed from the exact unfinished validation state rather than restarting or inventing a new build.

Final documentation head before this handoff append:

`c7b28e5448b9d18fff25477112b9a35310abe999`

Compared with runtime authority `6dfea100829016eee4820b342729b8c823426f95`, that head changed only five Markdown continuity files:

- `00_DEVELOPER_START_HERE.md`;
- `CAREER_MODE_SHOWDOWN_V1.1.2_POST_MERGE.md`;
- `NEXT_TASK.md`;
- `PROJECT_STATE.md`;
- `README.md`.

No HTML, CSS, JavaScript, data, asset, package, test or permanent workflow byte changed after the sealed runtime merge.

The interrupted final documentation-head Stability run was `31548694306`. It completed fully green after resume:

- stability contracts `93966503033` — SUCCESS;
- two-cycle Chromium stability `93966581689` — SUCCESS;
- deployed-site smoke `93967436007` — SUCCESS.

The deployed smoke again passed exact runtime byte parity, runtime-error provenance, Home/Reus, licensed football photos, Candidate A export, Candidate B import analysis and the complete deployed gameplay/navigation journey.

This closure is recorded because final gate evidence is part of the owner's permanent public-handoff golden rule, not an optional after-action summary.

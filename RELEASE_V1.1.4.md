# Career Mode Showdown — v1.1.4 Candidate C Atomic Restore + Recovery UX

Release tag: `v1.1.4`
Runtime asset revision: `1.1.4-r1`
Status: DEPLOYED / TWICE-PROVEN / PROTECTED
Production runtime authority: `1a498441a6ccf557aa8b8bc7ced2b3d9cd22cdf7`
GitHub Pages deployment: `5877215224`

## Release purpose

v1.1.4 closes the v1.1 Data Safety and Recovery milestone with Candidate C — Atomic Restore + Recovery UX. Candidate A remains the non-mutating backup/export authority and Candidate B remains the read-only analysis/migration/conflict-preview authority. Candidate C is the first stage permitted to commit imported canonical state, and it does so only after fresh revalidation and explicit user choices.

This release changes no competition rule, scoring rule, exactly-two-manager assumption, League/Club confirmation semantics, Transfer Challenge behavior, Season Review persistence boundary, Statistics calculation, licensed football-photo source authority or accepted Marco Reus loading presentation.

## Atomic restore transaction

Candidate C treats active Showdown, Legacy and application preferences as one restore transaction boundary:

1. pending canonical writes are flushed before restore;
2. the selected backup is revalidated immediately before Apply, including format, checksum, schema/migrations and unresolved conflicts;
3. exact raw pre-restore bytes/absence are snapshotted for every affected canonical key;
4. active replacement, Legacy conflict handling and preference restoration remain explicit user decisions;
5. all final candidate values are computed in memory before the first mutation;
6. canonical mutation remains under the existing storage authority rather than introducing a second persistence owner;
7. affected keys commit in deterministic active → Legacy → preferences order;
8. every written key/value is read back and verified;
9. any write or post-write mismatch triggers full affected-key rollback to the exact raw snapshot;
10. rollback itself is verified byte-for-byte;
11. a rollback that cannot be proven enters a locked critical recovery state rather than pretending recovery succeeded;
12. in-memory/runtime state is synchronized only after the complete transaction verifies.

Repeated import of an already-restored backup is deterministic. Corrupt pre-existing raw data is preserved and never silently erased merely to make restore easier.

## Recovery UX

Restore remains inside the existing lazy Legacy / Data Management surface. The UI separates current state, analyzed backup state, resolution choices, exact planned effects, destructive confirmation, progress, success, verified rollback/retry and critical rollback failure.

Export Backup remains available before the destructive restore surface. The restore file control has a 44 px minimum touch target, responsive/mobile layouts are overflow-protected, and Apply/recovery controls remain scrollable above the fixed footer.

## Failure-injection coverage

Permanent deterministic and browser gates cover first/middle/final-key write failure, quota/storage exceptions, post-write verification mismatch, rollback failure, absent raw keys, corrupt pre-existing bytes, same-ID Legacy conflicts, stale reviewed state, rapid/double Apply, lifecycle interruption, repeated import/idempotence, keyboard/focus, Chromebook/windowed desktop, mobile 390×844 DPR2, reduced motion, fixed-footer visibility and minimum touch targets.

The dedicated Candidate C browser lane executes eight isolated destructive/recovery scenarios per pass and runs the complete set twice.

## Defects found by strengthened gates

The gates exposed and led to fixes for four concrete Candidate C defects:

1. a pre-confirmation live plan refresh could bypass explicit stale-state feedback;
2. safe rollback proof was immediately erased by a final refresh;
3. a destructively injected Chromium process could contaminate the next recovery scenario;
4. the mobile restore file input was only 40 px high instead of the required 44 px.

Release freeze also caught package/lockfile identity drift, stale active runtime fallbacks, hidden v1.1.3 release regexes in Season Review and Statistics, and a stale 22-block workflow-topology guard. Current permanent source correctly contains 27 literal executable `.yml` workflow blocks.

## Permanent protection

Candidate C is protected by:

- `Validate Candidate C Atomic Restore`, including deterministic contracts and the full real-browser recovery audit twice;
- Stability Lane, including Candidate C inside both local Chromium cycles and the deployed-site smoke;
- five-pass Candidate C Release Burn-In, with restore/recovery in every complete pass;
- repository-owned dynamic release contracts covering Static App, Final Polish, licensed visuals, Season Review and Statistics without version-fragile current-release hardcodes.

Protected startup ceilings remain 165,000 raw eager code bytes, 37,500 gzip eager code bytes, 95,000 startup portrait bytes and 260,000 combined first-party startup bytes. Candidate C remains lazy and does not enter the eager startup set.

## Pre-merge proof

Frozen candidate: `814c1935824f19144b0b6c41243da71047a3224b`.

Every one of the 14 permanent workflow families passed twice independently on that exact SHA. Candidate C therefore completed four dedicated browser passes across the two official matrices, Stability completed four full local cycles, and Burn-In completed 10/10 pre-merge passes.

Frozen Candidate C screenshot artifact `9158062005` from run `31638757897` was manually inspected and accepted technically for desktop ready, mobile DPR2, verified rollback and critical rollback lock presentation.

PR #24 merged only with `expected_head_sha` protection against the frozen candidate.

## Production proof

Expected-head merge produced immutable runtime authority:

`1a498441a6ccf557aa8b8bc7ced2b3d9cd22cdf7`

Pages deployment `5877215224` completed successfully.

All 14 permanent main-branch workflow families passed on the runtime merge SHA. They were then rerun without changing a byte; the current run set is `run_attempt: 2` and all fourteen completed successfully again.

Key production runs:

- Candidate C Atomic Restore — `31640089247` — attempt 1 SUCCESS, attempt 2 SUCCESS;
- Candidate C Release Burn-In — `31640089314` — 5/5 SUCCESS on attempt 1 and 5/5 SUCCESS again on attempt 2;
- Stability Lane — `31640089289` — attempt 1 SUCCESS and attempt 2 SUCCESS.

Both Stability production attempts passed:

1. exact public runtime-byte verification;
2. runtime error provenance;
3. Home/Reus visual audit;
4. licensed crop-safe football-photo audit;
5. Candidate A backup export;
6. Candidate B import analysis;
7. Candidate C atomic restore/recovery;
8. complete public gameplay/navigation journey.

Attempt-2 Stability job IDs are `94264478956` (contracts), `94264531141` (two-cycle Chromium) and `94266314073` (deployed-site smoke), all SUCCESS.

Full evidence is recorded in `CAREER_MODE_SHOWDOWN_V1.1.4_POST_MERGE.md`.

## Runtime authority vs documentation seal

The immutable application runtime authority is `1a498441a6ccf557aa8b8bc7ced2b3d9cd22cdf7`. Later documentation-only commits do not become a new application runtime authority when `index.html`, `css`, `js`, `data` and `assets` remain byte-identical.

## Next dependency boundary

v1.1 Data Safety and Recovery is complete.

The next legal milestone is v1.2.0 — Installable Offline App. Profiles/save registry, cloud/accounts, QR pairing and two-device work remain dependency-ordered after that milestone and must not be started ahead of `POST_V1_ROADMAP_EXECUTION.md`.

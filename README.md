# Career Mode Showdown

A lightweight two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript and browser localStorage.

**Application version:** v1.1.4 — Stable / Candidate C Complete
**Runtime asset revision:** `1.1.4-r1`
**Current production:** v1.1.4 / `1.1.4-r1`
**Immutable runtime authority:** `1a498441a6ccf557aa8b8bc7ced2b3d9cd22cdf7`
**GitHub Pages deployment:** `5877215224`
**Release status:** merged, deployed, twice-proven in production and protected
**Protected surface:** the owner-liked cinematic Marco Reus loading presentation remains regression-protected
**Current developer entry:** `00_DEVELOPER_START_HERE.md`
**Next legal milestone:** v1.2.0 — Installable Offline App
**Post-v1 execution roadmap:** `POST_V1_ROADMAP_EXECUTION.md`

## Development entry point

The project is already designed, architected and implemented through v1.1.4 Candidate C. Do not restart planning, replace established architecture or reconstruct current state from old chats before reading current repository authority.

Read in this order:

1. `00_HANDOFF_GOLDEN_RULE.md` — permanent continuous public handoff protocol.
2. `00_DEVELOPER_START_HERE.md` — fast bootstrap and authority order.
3. `NEXT_TASK.md` — current legal milestone.
4. current `main` source — highest implementation authority when documentation and implementation differ.
5. `PROJECT_STATE.md` — locked product/system state.
6. `CAREER_MODE_SHOWDOWN_V1.1.4_POST_MERGE.md` — final Candidate C release and production proof.
7. `RELEASE_V1.1.4.md` — stable Candidate C release record.
8. `POST_V1_ROADMAP_EXECUTION.md` — dependency-ordered post-v1 roadmap.
9. Candidate C rolling/release handoffs when deeper data-safety archaeology is required.
10. master historical handoffs, older release records and the original Project Bible only when history is genuinely needed.

## v1.1.4 — Candidate C Atomic Restore + Recovery UX

Candidate C closes the v1.1 Data Safety and Recovery sequence without changing gameplay.

Candidate A remains the non-mutating local backup/export authority. Candidate B remains the read-only import analysis, migration and conflict-preview authority. Candidate C is the first stage allowed to apply imported data after fresh revalidation and explicit user decisions.

The restore transaction:

- flushes pending canonical writes before Apply;
- revalidates the selected backup and choices immediately before commit;
- snapshots exact raw active Showdown, Legacy and preferences bytes or key absence;
- computes the complete final state in memory before the first mutation;
- keeps mutation under existing storage authority;
- commits in deterministic active → Legacy → preferences order;
- verifies every written value;
- restores every affected key to exact raw pre-restore state after any failure;
- verifies rollback byte-for-byte;
- enters locked critical recovery if rollback cannot be proven;
- synchronizes runtime/in-memory state only after complete success;
- preserves corrupt raw bytes and deterministic repeated-import behavior.

The Data Management UI clearly separates current state, analyzed backup state, resolution choices, planned effects, confirmation, progress, success, verified rollback/retry and critical recovery.

## Candidate C gate depth

The dedicated browser lane executes eight isolated destructive/recovery scenarios per pass and runs the complete set twice. Permanent coverage includes first/middle/final write failure, quota/storage exception, post-write mismatch, rollback failure, corrupt bytes, same-ID Legacy conflicts, stale reviewed state, rapid/double Apply, lifecycle interruption, repeated import, Chromebook/windowed desktop, mobile 390×844 DPR2, reduced motion, focus, overflow, fixed-footer visibility and a 44 px minimum restore-file touch target.

Those gates found and fixed four real Candidate C defects:

1. a pre-confirmation live refresh could bypass explicit stale-state feedback;
2. safe rollback proof was immediately erased by a refresh;
3. a destructively injected browser process could contaminate the next scenario;
4. the mobile restore file picker was only 40 px high.

Candidate C is also part of both Stability Chromium cycles, deployed-site smoke and every pass of the five-pass Release Burn-In.

## Release proof

Frozen pre-merge candidate: `814c1935824f19144b0b6c41243da71047a3224b`.

That SHA passed every permanent workflow family twice independently. Candidate C completed four dedicated real-browser recovery passes across the two matrices, Stability completed four complete local cycles, Burn-In completed 10/10 pre-merge passes, and final Candidate C screenshot artifacts were manually reviewed.

PR #24 merged with expected-head protection to immutable runtime authority:

`1a498441a6ccf557aa8b8bc7ced2b3d9cd22cdf7`

Pages deployment `5877215224` succeeded.

Production then passed every permanent workflow family twice on the same runtime SHA. Both Stability production attempts proved exact deployed runtime bytes and passed runtime provenance, Home/Reus, licensed football visuals, Candidate A export, Candidate B analysis, Candidate C restore/recovery and the complete public gameplay/navigation journey.

Burn-In run `31640089314` passed 5/5 twice. Candidate C run `31640089247` passed both production attempts. Stability run `31640089289` passed both production attempts.

See `CAREER_MODE_SHOWDOWN_V1.1.4_POST_MERGE.md` for the full evidence record.

## Locked competition rules

- exactly two managers;
- one device/browser and one active Showdown in the current product model;
- Showdown lengths `[1,3,5,10]`;
- one selected league per Showdown and two different permanent clubs;
- Champions League = 5 points;
- league title = 3 points;
- main domestic cup = 1 point;
- 100 league points and/or 100 league goals share one +1 performance point;
- Top Scorer and/or Top Assist share one +1 awards point;
- maximum season score = 11;
- equal non-zero season scores are a draw;
- only a 0–0 score uses tiebreakers: better league position first, then league points;
- League Wheel selection requires explicit Continue before Club Assignment;
- assigned clubs require explicit rivalry confirmation before the Showdown starts.

## Architecture

The served app remains static HTML + CSS + vanilla JavaScript. Persistence remains browser localStorage under `js/storage.js` authority. `js/screens.js` remains route/history authority. Heavy gameplay, analytics, Settings, football photography and Data Management engines remain lazy-loaded.

Candidate C does not add a backend, account system, cloud sync, PWA, profiles/save registry, QR pairing or two-device networking.

The startup shell remains one local stylesheet and seven local scripts. Protected ceilings remain 165,000 raw eager code bytes, 37,500 gzip eager code bytes, 95,000 startup portrait bytes and 260,000 combined first-party startup bytes.

Later documentation-only commits are not new application runtime authorities when runtime files remain byte-identical to `1a498441a6ccf557aa8b8bc7ced2b3d9cd22cdf7`.

## Data Safety and Recovery sequence

### v1.1.0 — Candidate A

Versioned, human-readable SHA-256-protected local backup export without canonical mutation.

### v1.1.2 — Candidate B

Preview-only import analysis with size gating, strict format/checksum/schema validation, supported deterministic migrations, hostile/future-data rejection and explicit conflict classification. Candidate B performs zero canonical writes/removals.

### v1.1.4 — Candidate C

Atomic restore/recovery as described above. v1.1 Data Safety and Recovery is now complete and protected.

## Next dependency boundary

v1.2.0 — Installable Offline App — is now the next legal milestone. Do not jump ahead to profiles/save registry, cloud/accounts, QR pairing, two-device play or public rankings; follow `POST_V1_ROADMAP_EXECUTION.md` in order.

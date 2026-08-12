# Career Mode Showdown — Master Handoff Research Completion Record

Date: 2026-08-12
Branch: `handoff/master-developer-deep-dive-2026-08-12`
Purpose: final audit/completion note for the owner-requested historical deep-dive before PR validation.

This file does not replace the consolidated master handoff. It records the exact resumed stopping point, a second verification against the re-uploaded ChatGPT export, precision corrections, and live-source observations that should not be lost or silently turned into runtime changes during this documentation-only task.

## 1. Exact resumed state

The development session was interrupted after the historical research branch had already advanced well beyond its first checkpoint.

Recovered branch head before this completion note:

`375900d41cf3b94bcb5e5ef5a53c9f23c847aaeb`

Compared with the v1.1.3 evidence-only `main` seal `5f21bdeb5122839e4a9a1e1a1c24936d856b3da6`, the branch was nine commits ahead and contained documentation/authority work only.

Recovered outputs already present before this resumed completion step included:

- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPER_HANDOFF_FINAL_2026-08-12.md` — 1,228-line consolidated historical/current handoff;
- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPER_HANDOFF_2026-08-12.md` — rolling research handoff;
- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPER_HANDOFF_2026-08-12_ROADMAP_AND_REVIEW_APPENDIX.md` — Grok synthesis, future-roadmap dependency reasoning and Candidate C execution detail;
- `CAREER_MODE_SHOWDOWN_HISTORICAL_OWNER_DECISION_INDEX_2026-08-12.md` — source-indexed high-value owner decisions;
- `00_MASTER_DEVELOPER_CONTEXT.md` — concise deep-context entry point;
- `00_MASTER_DEEP_DIVE_READ_ME_2026-08-12.md` — dated research-package guide;
- guarded discoverability/current-task amendments in `00_HANDOFF_GOLDEN_RULE.md` and `NEXT_TASK.md`.

The resumed task therefore did **not** restart historical analysis or overwrite those files. It audited and completed the unfinished tail.

## 2. Re-uploaded ChatGPT export independently re-verified

The owner re-uploaded the same Aug 10 ChatGPT export during the resume turn. The ZIP was inspected directly rather than inferred from filenames.

Verified export inventory:

- 41 `conversations-###.json` files;
- 4,093 conversations total.

Exact requested historical conversations found:

### `Website Creation and Guide`

- conversation ID: `6a6ba895-cb1c-83ea-b13c-d7e3d42afb25`;
- active-path text messages: 439;
- owner/user text turns: 176.

Spot checks against the historical decision index reconfirmed the original two-person product boundary, CL/League/Cup scoring, paired bonus caps, same-league requirement, club reuse, rejection of screenshot uploads/match-note bloat, complete-file workflow preference, Chromebook/F12 constraint, FIFA 17 tile direction, permanent club pair, FUT-style reveal, Back navigation, one-device-now/later-device deferral and Showdown Home choice.

### `Career Mode Showdown Dev`

- conversation ID: `6a78bb0e-d2ac-83ea-b092-7c9377a6dda1`;
- active-path text messages: 314;
- owner/user text turns: 19.

Spot checks reconfirmed current-main/NEXT_TASK continuation discipline, browser-first shipping, direct push/PR/check/merge/deploy expectations, deliberate post-v1 roadmap planning, Chromebook/Main Menu + Reus loading-screen v1 blocker, r13 acceptance, and the owner instruction to use Grok critique critically rather than accept it shallowly.

### `Career Mode Showdown — Master Development Continuation`

- conversation ID: `6a79ea21-093c-83ea-b00d-055524fb259a`;
- active-path text messages: 30;
- owner/user text turns: 11.

Spot checks reconfirmed that the conversation existed to preserve quality across Work/context interruption, that Reus debugging had to be reclassified after screenshot evidence, that the broader James/Rashford/Martial/Messi/Lahm visual request had to be recovered, that the latest roadmap had to be re-read, and that the owner explicitly asked for complete study of the two earlier maximum-length chats.

### `Project r4 Visual Fixes`

Exact title count in the Aug 10 export: **0**.

This is a real source limitation, not a search failure. The later chat post-dates the export snapshot. The master handoff therefore correctly reconstructs that environment from repository-native incident/handoff/PR/release evidence rather than inventing a raw transcript.

## 3. Grok size-review precision correction

The external Grok transcript described the current project as roughly 0.66 MB and treated the Reus image as the only significant media asset. The master handoff correctly rejects that as stale/incomplete.

For precision, current-tree media should be separated into categories rather than summarized as one ambiguous “project size” number:

- the **12 active route-scoped football derivatives used by the v1.1.3 visual plan total 1,670,358 bytes** (about 1.59 MiB);
- the repository also retains the older/full `philipp-lahm-world-cup-2014.webp` source derivative at 311,072 bytes;
- protected `assets/marco-reus-2015-cc-by.webp` is 89,008 bytes;
- those image binaries together total **2,070,438 bytes** (about 1.97 MiB) before HTML, JavaScript, CSS, tests, documentation or package metadata.

This correction strengthens, rather than weakens, the master conclusion: total repository/runtime inventory is not the same performance metric as eager startup weight.

The protected v1.1.3 eager startup result remains:

- 164,965 raw bytes;
- 37,006 gzip bytes;
- unchanged ceilings: 165,000 / 37,500.

Future reviewers should measure the metric relevant to the question instead of mixing repository size, active media inventory and first-load payload.

## 4. Live-source observation intentionally not changed in this docs task

During the Candidate C source-seam audit, `js/settings.js` was read directly from current `main`.

`getSettingsApplicationVersion()` currently falls back to literal `"1.1.2"` if `APP_VERSION` is unavailable, while eager `js/app.js` correctly defines:

`const APP_VERSION = "1.1.3";`

Normal application execution therefore receives `1.1.3`; the stale Settings string is only a degraded/isolation fallback observation.

This historical-handoff task does **not** change runtime JavaScript. A future Candidate C/maintenance developer should verify whether the stale fallback is still present on then-current `main` and, if so, classify it as a bounded release-coherence maintenance defect rather than silently folding unrelated behavior into restore architecture.

Do not use this note as permission to change Candidate C scope or application version without checking current source first.

## 5. Final research conclusions revalidated

The deepest findings remain unchanged after the second source audit:

- the app is a ritualized two-person FIFA 17 rivalry companion, not a generic CRUD tracker or football simulator;
- immersion is deliberate product value, but must remain compatible with tight startup/runtime performance;
- the roadmap is primarily a dependency/risk-control graph, not a feature wishlist;
- direct GitHub implementation, anti-loop discipline and continuous handoff rules arose from real early failure/context-loss classes;
- owner evidence is separate from automated QA, especially for art direction;
- real failures should be fixed at the root and converted into bounded permanent guards where useful;
- thresholds/budgets should not be weakened merely to make a build green;
- current modular vanilla JavaScript remains evidence-aligned; framework/TypeScript changes require a future measured decision, not prestige modernization;
- Candidate A export and Candidate B analysis are intentionally separate protected stages;
- Candidate C must be a freshly revalidated, explicit-choice, exact-raw-snapshot, storage-owned, multi-key atomic restore with post-write verification, byte-for-byte rollback and rollback verification;
- Candidate C remains the only current substantive build;
- v1.2 PWA, v1.3 identities/save library, cloud and two-device work remain dependency-blocked in their documented order.

## 6. Documentation package authority after this note

For a normal fresh session, continue to use the short source-first bootstrap:

1. `00_HANDOFF_GOLDEN_RULE.md`;
2. fetch current `main`;
3. `00_DEVELOPER_START_HERE.md`;
4. `NEXT_TASK.md`;
5. current roadmap section + live source.

For deep intent/history, use:

- `00_MASTER_DEVELOPER_CONTEXT.md` as the entry point;
- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPER_HANDOFF_FINAL_2026-08-12.md` as the consolidated master handoff;
- this completion note only for the resumed research audit/precision observations;
- the rolling handoff, roadmap/review appendix and owner-decision index when source-level historical detail is needed.

Historical documents never override later verified source or a later explicit owner correction.

## 7. Next repository action

The research content is complete. Before presenting it as final repository authority:

1. compare the research branch against current `main` and ensure the surviving diff is documentation/authority only;
2. open a documentation-only PR;
3. run the permanent repository gate matrix without weakening runtime thresholds;
4. correct any genuine documentation/coherence failure rather than changing runtime;
5. merge only from the exact validated PR head;
6. allow the main documentation validation and platform-managed Pages deployment to complete;
7. record final merge/gate/deployment evidence without creating a recursive CI loop.

The immutable v1.1.3 application runtime remains `29760bbf33c974267bd1ad64d0839f73ad8051fa` throughout this handoff work.
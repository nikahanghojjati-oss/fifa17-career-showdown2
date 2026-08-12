# v1.1.5 — Restore Transaction Safety Maintenance

Date: **August 12, 2026**

Runtime asset revision: **`1.1.5-r1`**

- Fixed a confirmed-intent race where restore file/choice state could change during asynchronous Apply-time revalidation after the visible plan had already been confirmed.
- Fixed over-broad rollback so Candidate C now rolls back only transaction-owned successful mutations, in reverse order, and refuses to clobber newer/unowned bytes.
- Added strict destructive-restore snapshots that distinguish true key absence from storage read failure and fail closed before mutation.
- Added initial and last-moment raw-byte preconditions, explicit stale-state recovery, post-write verification and byte-for-byte owned rollback verification.
- Added `RESTORE NOT STARTED`, verified rollback and critical ownership/rollback recovery distinctions; critical uncertainty invalidates runtime caches and locks restore controls.
- Preserved deterministic repeated imports as zero-write no-ops and corrupt raw bytes unless explicit replacement is selected.
- Removed the stale Candidate A hardcoded v1.1.3 provenance fallback without changing backup format version 1.
- Added real-browser maintenance races/failure scenarios to Candidate C, Stability and every Burn-In pass.
- Added repository-wide per-contract CI annotations while preserving all protected assertions and the 27-block workflow topology.
- Added `CLOUD_STORAGE_FOUNDATION.md` for future account/save/device identity, revision/CAS, conflicts, tombstones, privacy and security; no cloud backend/network mutation is included.
- Preserved the original 165,000 raw / 37,500 gzip startup ceilings; a 31-byte raw regression was fixed without raising either budget.
- Normal loading remains 2700 ms and reduced-motion startup remains 220 ms.

# v1.1.4 — Candidate C Atomic Restore + Recovery UX

Date: **August 12, 2026**

Runtime asset revision: **`1.1.4-r1`**

- completes the planned v1.1 Data Safety and Recovery sequence with the first import stage permitted to commit canonical state;
- keeps Candidate A backup/export non-mutating and Candidate B import analysis strictly read-only;
- revalidates the selected backup and explicit user choices immediately before Apply;
- snapshots exact raw active/Legacy/preferences bytes or absence before mutation;
- computes the complete restore in memory and commits in deterministic active → Legacy → preferences order under existing storage authority;
- verifies every write, rolls every affected key back to exact raw pre-restore state after any failure and verifies rollback byte-for-byte;
- surfaces unverified rollback as a locked critical recovery state instead of claiming success;
- preserves corrupt raw local data and deterministic repeated-import/idempotence behavior;
- adds explicit current/backup/choice/plan/progress/success/rollback/critical recovery UX inside lazy Legacy / Data Management;
- expands destructive browser evidence to eight isolated scenarios per pass, twice, including stale state, rollback, critical rollback, corrupt Legacy choice, rapid Apply, lifecycle interruption, mobile DPR2/reduced-motion and fixed-footer/touch-target checks;
- fixes four defects found by strengthened gates: stale-state UI bypass, safe-rollback message erasure, destructive-browser process contamination and a 40 px mobile restore file target;
- promotes Candidate C recovery into both Stability Chromium cycles, deployed-site smoke and every one of the five release Burn-In passes;
- moves version-fragile release assertions into repository-owned dynamic contracts while preserving permanent workflow topology and unique focus/audio/visual provenance coverage;
- advances application/cache identity to v1.1.4 / `1.1.4-r1` without changing gameplay, scoring, Transfer, Season Review, Statistics or accepted football presentation;
- reserves v1.2.0 for Installable Offline App only after v1.1.4 is merged, deployed and proven.

# v1.1.3 — League Wheel Stability + Cinematic Football Visual Expansion

Date: **August 12, 2026**

Runtime asset revision: **`1.1.3-r1`**

- fixes the League Wheel post-selection visual reroll by scoping transform animation to the active spin and disarming it before selected-angle normalization;
- permanently gates settled/cancelled no-transition state, single league draw and stale-operation rejection;
- replaces James Rodríguez with a different licensed 2014 World Cup source and does not reuse either previously rejected James source;
- replaces Marcus Rashford and Anthony Martial with new licensed match sources;
- adds seven more licensed historic/cinematic screen-purpose photographs: Ronaldo, Pogba, Ibrahimović, Griezmann, Neymar, Falcao and Balotelli;
- expands the football visual plan to 11 destinations / 12 local derivatives while preserving protected Messi, Lahm and Marco Reus assets;
- changes the football visual loader from global archive preloading to route-owned loading, requiring zero football-photo requests at Home startup;
- retains `object-fit: contain`, clean-anchor face safety, responsive Chromebook/mobile controls and unchanged 165,000 raw / 37,500 gzip eager-code budgets;
- changes no scoring, gameplay, storage schema/keys, Candidate A export semantics or Candidate B read-only analysis semantics;
- leaves Candidate C Atomic Restore + Recovery UX as the next substantive v1.1 task after this maintenance release is merged/deployed/proven.

# v1.1.2 — Candidate B Import Analysis + Migration Preview

Date: **August 11, 2026**

Runtime asset revision: **`1.1.2-r1`**

- Adds preview-only local backup import analysis to Data Management.
- Enforces a 5 MiB pre-read File ceiling, strict JSON/format/checksum/schema validation and future-format rejection.
- Adds ordered schema-1→2 Showdown/preferences migration preview with deterministic/idempotent golden fixtures.
- Classifies new/exact/same-revision/different-revision/malformed conflicts using persisted Showdown IDs as strings.
- Preserves corrupt current raw bytes and performs zero canonical localStorage writes/removals.
- Adds keyboard, drag/drop, touch, DPR2 mobile, axe, overflow, hostile JSON, tamper, large-input and export→analysis round-trip evidence.
- Adds a permanent Candidate B workflow and integrates import analysis into Stability and five-way Release Burn-In.
- Hardens deployed-byte verification with bounded transport retries while retaining exact hash/length equality as authority.
- Makes continuous public handoff logging a permanent owner-mandated repository rule.

# CHANGELOG — Career Mode Showdown

This file preserves implementation continuity without replacing the original roadmap.

Original release path:

`v0.6.1 → v0.7 → v0.8 → v0.9 → v0.95 → v1.0`

The project reached **v1.0.0 Stable** on August 9, 2026. v1.0.1 began the finite Stability Lane on August 10, 2026. v1.0.2 is the August 11 defect-only visual-maintenance response to owner real-device evidence.

---

# v1.1.1 — James Rodríguez Real Madrid Source Refresh

Date: **August 11, 2026**

Runtime asset revision: **`1.1.1-r1`**

- replaces the Create Showdown James Rodríguez source with Real Madrid-authored `James Rodríguez in September 2016 - 02.jpg` under CC BY 3.0;
- preserves the complete 863 × 1080 source frame and displays it with clean-anchor `object-fit: contain` rather than a second responsive crop;
- removes the replaced 2019 James runtime derivative from the active asset set;
- locks exact Commons/source/output fingerprints and cross-checks manifest, runtime data and notices;
- expands changed-surface browser evidence to desktop, 1100 × 720 compact desktop, 940 × 700 windowed and 390 × 844 DPR2 mobile;
- preserves face-safe diagonal accents, Reus Home/loading and the accepted Rashford/Martial/Messi/Lahm sources;
- changes no gameplay, storage schema, Candidate A behavior, routes or Transfer/Season rules;
- requires two independent executions of every permanent gate family on the same frozen candidate SHA before promotion;
- leaves Candidate B import analysis as the next substantive roadmap candidate after maintenance closure.

# v1.1.0 — Data Safety and Recovery / Candidate A

Date: **August 11, 2026**

Runtime asset revision: **`1.1.0-r1`**

- adds format-v1 non-mutating local backup export with SHA-256 checksum;
- captures active Showdown, Legacy and preferences through `js/storage.js`;
- preserves malformed raw bytes in recovery data;
- fixes corrupt active-save false positive, malformed Legacy shape handling, stale Settings fallback, destructive-action success feedback and duplicate export activation;
- restores owner-requested FIFA diagonal accents in bounded face-safe lower-body zones;
- extends Stability with Candidate A desktop/mobile/reduced-motion/a11y/download/deployed audits;
- leaves Candidate B/C, PWA, profiles and cloud dependency-blocked.

# v1.0.2 — Clean-Anchor Visual Maintenance

Date: **August 11, 2026**

Runtime asset revision: **`1.0.2-r1`**

## Owner-reproduced defects

- James Rodríguez's light overlay washed out facial detail on the Create Showdown tile.
- Marcus Rashford's decorative diagonal lines crossed his face in Transfer Challenge.
- desktop Home Marco Reus used an unattractive diagonal crop around the head/neck.
- the owner explicitly likes the cinematic loading screen; it is protected rather than redesigned.

## Maintenance implementation

- introduces a declarative `clean-anchor` treatment for James, Rashford and Martial;
- moves decorative geometry behind those photographs instead of painting over faces;
- places copy in a dedicated plate outside the photo anchor;
- preserves the complete authored r5 derivatives with `object-fit: contain` and no CSS colour filtering;
- rebuilds desktop Home Reus as a rectangular right-side player-photo anchor with no diagonal head/neck clipping edge;
- preserves the previously accepted mobile Reus path and the loading-screen composition;
- advances application/cache identity to `v1.0.2` / `1.0.2-r1`.

## Robustness upgrade

- strengthens Licensed Football Visuals around structural face-safe layering rather than old frame percentages;
- adds browser assertions that decoration stays below the image and copy stays outside the photo anchor;
- protects tuned James desktop/near-breakpoint geometry;
- protects desktop Reus clean-anchor geometry while retaining the bounded mobile path;
- retains provenance, physical-pixel, crop-safe, accessibility, startup-budget and complete-journey gates;
- keeps v1.0.1 as historical rollback evidence and adds a dedicated v1.0.2 release record.

## Scope protection

- no gameplay/scoring/tiebreak changes;
- no route/history changes;
- no localStorage key/schema/persistence changes;
- no Transfer Challenge/Season Review/Statistics behavior changes;
- no source-photo replacement in this maintenance pass;
- Messi and Lahm remain protected;
- loading screen remains protected.

Owner real-device visual acceptance remains required after the deployed build passes machine verification.

Final technical release evidence: pre-merge head `057586128d00812feee8681392a088e8c27a1e75` passed all eleven permanent workflows; runtime merge `7a573ff2691b6143ecbc53df589822d5609f5e05` deployed successfully as Pages deployment `5852810024`; post-merge Licensed Football Visuals `31503795213` and Stability Lane `31503795725` both passed, including exact deployed bytes and the complete public journey. Owner visual acceptance remains open.

---

# v1.0.1 — Stability Hardening

Date: **August 10, 2026**

Runtime asset revision: **`1.0.1-r5`**

## Owner-directed visual immersion correction — r3

- Preserves the deployed r2 Reus desktop/windowed correction and the owner-accepted mobile Reus treatment.
- Adds five local, explicitly licensed FIFA-era football photographs as required screen presentation: James Rodríguez for Create Showdown, Marcus Rashford and Anthony Martial for Transfer Challenge, Lionel Messi for Career Statistics, and Philipp Lahm lifting the 2014 World Cup for Trophy Room.
- The football photography is proactively warmed immediately after the critical application shell starts and is required by its destination screens. Large photographs remain staged outside the initial HTML parse path only to preserve startup responsiveness; this is a performance boundary, not optional presentation.
- Upgrades the Manchester United Rashford source to a 742 × 888 2016 Creative Commons portrait after physical-pixel QA showed the earlier 594 × 661 crop was too close to high-DPR upscaling.
- Upgrades Martial to a 1200 × 800 Manchester United derivative after the earlier source required about 5.3% DPR2 mobile upscaling; the replacement remains within the existing image and aggregate presentation budgets.
- Uses a native 960 × 810 December 2016 Barcelona Messi close-up for Career Statistics after manual screenshot review rejected both a portrait forced across the ultra-wide hero and a landscape alternative where Messi was too small. Desktop/windowed presentation uses a dedicated photographic frame while mobile expands the same image to the full hero width.
- Adds a physical-pixel image-quality gate that compares each source derivative with its actual cover-rendered size at desktop, 940 × 700 DPR1 near-breakpoint, and 390 × 844 DPR2 mobile-reference layouts instead of relying on arbitrary source-width thresholds.
- Adds a 940 × 700 DPR1 near-breakpoint Reus regression case plus 1366 × 768 DPR1 and 390 × 844 DPR2 licensed-photo browser coverage.
- Retains the existing 165,000-byte raw startup ceiling, 37,500-byte compressed ceiling and 260,000-byte combined first-party startup ceiling; r3 integration recovers headroom by removing non-runtime decorative banner bytes rather than increasing the limits.
- The owner explicitly approved proceeding with the independently verified Creative Commons selections without waiting for the historical Work-chat export. Complete source/license/derivative fingerprints remain recorded so any later preferred image can be replaced without changing gameplay, storage or route architecture.

## External review disposition

- rejected a framework rewrite and generic claims of inferior structure because no source-specific authority conflict, bottleneck or maintainability defect supports them;
- accepted the useful risk categories around edge cases, accessibility and future data-model growth;
- converted those categories into the finite, dependency-preserving plan in `STABILITY_PLAN_V1.0.X.md`.

## Stability infrastructure

- added pinned Playwright, axe-core and registry-distributed Chromium tooling without adding a served runtime dependency;
- added a repository-owned 70-checkpoint / 36-scan complete journey for Chromebook and reduced-motion touch/mobile;
- added corrupt active-save, Legacy and preference fixtures that fail closed without erasing original bytes;
- added quota rejection, rapid Start, rapid Transfer draft, reload, Smart Back, browser leave/return and double Season confirmation fixtures;
- added two consecutive browser runs to every PR/main validation;
- added public Pages revision polling, byte comparison of every runtime file, and a complete deployed-site journey after main;
- upgraded checkout and setup-node workflow actions to their Node 24 generations;
- added release/document/cache coherence checks for v1.0.1.

## Reproduced correction

- expanded mobile Season Review accessibility testing exposed four unawarded achievement labels at 3.51:1 contrast;
- changed only their foreground token from `#74818a` to `#52616b`, producing 5.63:1 on the existing background;
- added deterministic and real-browser protection for the corrected state.

## Scope protection

- intentionally changes presentation imagery and responsive visual composition only;
- no gameplay, scoring, tiebreak, club assignment, Transfer rules, saved-data schema, local persistence semantics, media catalog, startup timing or core route architecture change;
- v1.0.0 remains the immediate rollback tag;
- v1.0.2 remains defect-only; a clean stability exit advances to staged v1.1.0 Data Safety and Recovery.

---

# v1.0.0 — Stable

Release date: **August 9, 2026**

Runtime asset revision: **`1.0.0-r1`**

Status: **owner accepted; stable identity and release record sealed from deployed r13**

## Release seal

- accepted the deployed r13 Chromebook/Home and cinematic-startup presentation as the Version 1 visual baseline;
- advanced the user-facing application identity from `v0.95.0` to `v1.0.0 · Stable`;
- advanced the runtime cache boundary from `0.95.0-r13` to `1.0.0-r1` so browsers cannot silently retain release-candidate JavaScript, CSS, league data, club data, or the local portrait;
- added `RELEASE_V1.0.0.md` as the permanent release record covering the feature surface, preserved limitations, local storage model, recovery path, external media boundary and rollback identity;
- synchronized `PROJECT_STATE.md`, `NEXT_TASK.md`, `MASTER_INDEX.md`, `ACCEPTANCE_CHECKLIST_v1.0.md`, `README.md`, this changelog and `THIRD_PARTY_NOTICES.md` to the stable state;
- advanced all version-sensitive workflow assertions to the stable application and cache identities;
- added documentation-freshness contracts so later work cannot silently leave the primary handoff documents on the release-candidate state;
- retained the exact r13 runtime behavior, storage schema, dependencies and accepted presentation.

## Validated baseline

- all 22 executable blocks across the nine committed workflows passed against the exact release candidate;
- full DOM journey passed through Home, Create, League confirmation, Club Reveal, Dashboard, Transfer Challenge, Career Statistics, Rule Book, Legacy and Settings;
- real Chromium release audit passed 98 checkpoints and 23 WCAG scans across six viewport profiles from 320 × 568 through 2560 × 1440;
- normal and reduced-motion startup both passed;
- zero duplicate IDs, JavaScript page errors, failed local assets, route invalidation errors, destructive transaction failures or horizontal overflow were observed;
- startup shell remained within the accepted r13 ceiling at 163,876 raw / 36,668 gzip-equivalent code bytes plus the local portrait.

## Known Version 1 limitations

- one local active Showdown at a time;
- one-device workflow only;
- no accounts, cloud sync, QR pairing or live two-device play;
- YouTube media depends on an external network request after user intent;
- the 2015 Reus photograph is intentionally era-appropriate rather than an exact recreation of EA artwork.

---
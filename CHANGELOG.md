# CHANGELOG — Career Mode Showdown

This file preserves implementation continuity without replacing the original roadmap.

Original release path:

`v0.6.1 → v0.7 → v0.8 → v0.9 → v0.95 → v1.0`

The project reached **v1.0.0 Stable** on August 9, 2026. v1.0.1 begins the finite Stability Lane on August 10, 2026.

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

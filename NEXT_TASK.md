# NEXT TASK

## Current baseline: v1.0.1 Stable

Version 1.0.0 sealed the accepted r13 product and visual baseline on August 9, 2026. v1.0.1 is the bounded Stability Lane hardening patch derived from source-specific review of maintainability, accessibility, edge-case, and future-scaling risk.

**Application version:** v1.0.1

**Runtime asset revision:** `1.0.1-r2`

**Stable rollback:** v1.0.0 tag `6a4977d0f079cf9ea811ae86a9fb6b4026a418dc`

**Product status:** Version 1 Stable, stability lane

**Current gate:** two-run candidate, PR, post-merge, Pages parity, deployed-browser, and owner soak

**Next feature milestone:** staged v1.1.0 Data Safety and Recovery only after this lane exits

---

# Stable Version 1 contract

Preserve all accepted behavior:

- responsive metallic Home and finite Marco Reus startup;
- exactly two local managers, one browser/device and one active Showdown;
- same selected league and two different permanent clubs assigned once with no reroll;
- explicit League Selected → Continue → League Confirmed checkpoint;
- Transfer Window → Guess Entry → Signing Entry → Verdicts;
- canonical maximum-11 scoring and 0–0-only tiebreak;
- memory-only Season Review with Edit recovery and one confirmation write;
- centralized Smart Back, save-before-navigation and critical-write rollback;
- derived analytics, Legacy, Trophy Room, Rule Book and Settings;
- seven user-initiated Home media choices with no iframe before Play;
- reduced motion, keyboard focus, contrast and responsive containment.

No stability task may change those contracts unless a reproduced release defect requires the smallest compatible correction.

---

# v1.0.1 implementation

## Repository-owned stability evidence

The release adds:

1. pinned Playwright, axe-core and Chromium tooling;
2. a complete browser audit under `tests/browser/stability-audit.cjs`;
3. 1366 × 768 Chromebook and 390 × 844 reduced-motion touch/mobile journeys;
4. 36 accessibility scans per run across critical and optional states;
5. corrupt active-save, Legacy and preference fixtures;
6. quota rejection and critical-write rollback verification;
7. rapid Start, rapid Transfer draft and double Season confirmation protection;
8. reload, Smart Back and browser Back/Forward leave-and-return recovery;
9. exact visible-overflow and duplicate-ID checks;
10. two consecutive complete CI runs;
11. post-main public revision polling, byte parity and a deployed complete journey;
12. Node 24 generations of checkout and setup-node actions.

## Reproduced product fix

The new mobile Season Review scan found the unawarded achievement labels at 3.51:1 contrast. Their text color is now `#52616b` on `#edf1f2`, measured at 5.63:1. This is the only intended product-rendering change.

## Explicit exclusions

- no gameplay, scoring or state-machine changes;
- no storage schema or key change;
- no export/import, PWA, profiles or save slots;
- no cloud, accounts, pairing, online play or community feature;
- no new league, achievement, statistic or media item;
- no redesign, framework migration or module consolidation.

---

# Required release verification

The immutable candidate is valid only if all of the following pass:

- all ten GitHub Actions workflows;
- all legacy deterministic product contracts;
- v1.0.1 release/cache/document coherence;
- two consecutive 70-checkpoint / 36-scan local Chromium runs;
- normal-motion Chromebook and reduced-motion touch/mobile journeys;
- corrupt storage and preference fallbacks without silent byte deletion;
- quota failure with blocked navigation and rollback;
- rapid input, reload, Smart Back, browser leave/return and double-submit fixtures;
- no unexpected page error, console error, duplicate ID, failed local asset or visible horizontal escape;
- PR checks on the exact candidate SHA;
- post-merge checks on the exact main SHA;
- successful GitHub Pages deployment of that main SHA;
- all runtime files matching merged source byte for byte at revision `1.0.1-r2`;
- the complete browser journey passing against the public URL;
- v1.0.0 remaining available as rollback.

A failure blocks release. Diagnose it as application defect, test defect, CI infrastructure defect, or deployment mismatch before changing source.

---

# Stability lane exit and next milestone

If v1.0.1 clears every release gate and owner soak produces no reproducible defect, the bounded v1.0.x Stability Lane is complete.

v1.0.2 is not scheduled. It may be created only for a reproduced stability defect and may not become another polish loop.

The next feature milestone is v1.1.0 Data Safety and Recovery, split into three bounded candidates in `STABILITY_PLAN_V1.0.X.md`:

1. versioned backup envelope and non-mutating export;
2. isolated import analysis, validation and migration preview;
3. atomic restore choices, pre-import snapshot and full rollback.

Profiles, PWA, cloud, accounts and two-device play remain blocked by their existing roadmap dependencies.

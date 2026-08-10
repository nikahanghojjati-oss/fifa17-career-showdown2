# Career Mode Showdown v1.0.1

Release date: August 10, 2026

Release channel: Stable patch

Runtime asset revision: `1.0.1-r1`

Release tag: `v1.0.1`

## Release purpose

v1.0.1 turns Version 1's manually preserved browser evidence into repository-owned, repeatable stability protection. It keeps the accepted v1.0.0 product and visual contract intact and fixes one accessibility defect reproduced only after the critical-state scan matrix was expanded.

## Runtime change

- Mobile Season Review's unawarded achievement labels now use `#52616b` on `#edf1f2`, increasing measured contrast from 3.51:1 to 5.63:1 for the existing 9 px bold label.
- No gameplay rule, score, route, storage schema, form flow, animation timing, media choice, portrait byte, or persistent key changes.

## Stability infrastructure

- pinned Node 24 compatible Playwright, axe-core, and registry-distributed Chromium tooling;
- repository-owned complete browser journey at Chromebook and mobile/touch viewports;
- 36 accessibility scans per complete run across critical and optional states;
- corrupt active-save, Legacy, and preference recovery fixtures;
- simulated quota rejection and critical-write rollback fixture;
- rapid Start, rapid Transfer draft, reload, Smart Back, browser leave/return, and double-confirmation fixtures;
- visible-overflow checks that correctly distinguish clipped animation surfaces;
- two consecutive complete browser runs on every pull request and main update;
- post-main public revision polling, complete deployed runtime byte comparison, and public-site browser journey;
- all repository checkout and Node setup actions moved to their Node 24 generations.

## Deliberate exclusions

This patch does not add export/import, PWA caching, profiles, save slots, content, cloud, accounts, pairing, online play, achievements, or analytics. Those remain ordered by the approved post-v1 roadmap.

## Validation contract

The immutable release candidate must pass:

- all ten GitHub Actions workflows;
- all existing deterministic product contracts;
- the new stability contracts;
- two consecutive 70-checkpoint / 36-scan Chromium runs;
- 1366 × 768 Chromebook and 390 × 844 reduced-motion touch/mobile journeys;
- zero unexpected page errors, console errors, duplicate IDs, failed local assets, or visible horizontal escape;
- post-merge workflow repetition;
- Pages revision `1.0.1-r1` and byte parity for every file under `index.html`, `css/`, `js/`, `data/`, and `assets/`;
- the complete journey against the deployed URL.

## Data and rollback

The three v1 storage keys and their schemas are unchanged. v1.0.0 tag `6a4977d0f079cf9ea811ae86a9fb6b4026a418dc` remains the immediate rollback target. Because v1.0.1 performs no migration, rollback does not rewrite or downgrade saved data.

## Next decision

If the two-run candidate gate, PR checks, post-merge checks, deployment parity, public browser journey, and owner soak are clean, the bounded v1.0.x Stability Lane exits. v1.0.2 is reserved only for a reproduced stability defect; otherwise development advances to the staged v1.1.0 Data Safety and Recovery milestone in `STABILITY_PLAN_V1.0.X.md`.

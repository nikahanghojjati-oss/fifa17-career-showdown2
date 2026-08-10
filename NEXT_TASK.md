# NEXT TASK

## Current baseline: v1.0.0 Stable

The owner accepted the deployed r13 visual-immersion build on August 9, 2026. Version 1 therefore seals that exact behavior and presentation without another feature workstream.

**Application version:** v1.0.0

**Runtime asset revision:** `1.0.0-r1`

**Accepted behavior baseline:** r13 merge `1bae3e1fd0f5ab213846629d328024b9be2d244c`

**Product status:** Version 1 Stable

**Owner acceptance:** complete

**Next development lane:** bounded v1.0.x stability work; no post-v1 feature is active

---

# Stable Version 1 contract

Preserve all accepted r13 presentation and r12 functional corrections:

- responsive 1510 px metallic Home shell with dedicated Chromebook, tablet and mobile treatments;
- cosmetic, silent and finite startup using the locally bundled CC BY 2.0 Marco Reus portrait;
- exactly two local managers, one browser/device and one active Showdown;
- same selected league and two different permanent clubs assigned once with no reroll;
- 1, 3, 5 or 10 Seasons with manual result entry and local browser persistence;
- explicit League Selected → Continue → League Confirmed checkpoint;
- Transfer Window → Guess Entry → Signing Entry → Verdicts sequence;
- canonical maximum-11 scoring and 0–0-only tiebreak;
- memory-only Season Review with Edit value recovery and one confirmation write;
- centralized Smart Back, save-before-navigation and critical-write rollback;
- derived analytics, completed Legacy history, Trophy Room, Rule Book and Settings;
- exactly seven user-initiated Home media choices with no iframe before Play;
- reduced-motion support, keyboard focus, readable contrast and responsive containment.

Do not change gameplay rules, storage schema, route authority, accepted visual design or licensed asset treatment as part of the release seal.

---

# v1.0.0 release seal

The seal changes identity and release records only:

1. user-facing application version is `v1.0.0 · Stable`;
2. every eager and lazy runtime request resolves through `1.0.0-r1`;
3. authority documents describe r13 as accepted rather than pending;
4. `RELEASE_V1.0.0.md` records features, limitations, storage keys, browser evidence, recovery advice and external-media behavior;
5. the exact passing merge commit is tagged `v1.0.0` and used for the GitHub release;
6. GitHub Pages must serve the tagged runtime tree byte for byte.

No post-v1 feature belongs in this seal. Specifically excluded:

- export/import and portable backup;
- PWA installation or service-worker caching;
- multiple profiles or save slots;
- additional leagues, achievements, analytics or media;
- accounts, cloud storage, cross-device synchronization or QR pairing;
- online multiplayer, community sharing or rankings;
- another presentation redesign.

---

# Required verification

The release is valid only when all of the following pass on the immutable candidate:

- all 22 executable blocks across the nine GitHub Actions workflows;
- full DOM journey from startup through a completed Showdown and optional destinations;
- the established 98-checkpoint real-Chromium journey and 23 WCAG scans;
- 1920 × 912, 1366 × 768, 768 × 1024 and 390 × 844 viewport checks;
- normal and reduced-motion startup behavior;
- active-save, completed-save, reload and Review → Edit recovery;
- storage failure injection and critical-transition rollback;
- no JavaScript runtime failure, duplicate ID, missing local asset or horizontal viewport escape;
- PR checks on the exact candidate and post-merge checks on `main`;
- successful GitHub Pages deployment of the merge commit;
- public runtime files matching the tagged source byte for byte;
- the r12 merge remaining available as the pre-r13 rollback point.

Machine checks do not authorize feature changes. A failing gate blocks the release and must be diagnosed against the accepted r13 baseline.

---

# Next lane after the seal

The next allowed work is the short v1.0.x Stability Lane described in the approved post-v1 roadmap. It is limited to browser CI, deployed-site smoke checks, corrupt-storage and failure fixtures, documentation-freshness protection, and reproducible release defects.

Version 1.1 data-safety work begins only after that lane exits cleanly. Cloud, accounts and two-device play remain much later milestones.

# Career Mode Showdown

A lightweight two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript, browser localStorage and a first-party Installable Offline App shell.

Application version: v1.3.0 — Recovery & Device Resilience Hardening
Current production runtime: `1.3.0-r1`
Previous known-good runtime: `1.2.0-r2`
Release status: merged, deployed, exact-byte verified and technically production-proven
Release PR: #42
Runtime merge: `094401b649954656e27e4a92d027e9532e84ccbf`
Production Stability: `31755136265` / deployed-site-smoke `94629478166`
Release Integration Burn-In: `31755136240` — 2/2
Production proof: `V1.3.0_PRODUCTION_PROOF.md`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Current verified source wins over stale historical status prose. Technical production proof does not fabricate owner visual acceptance.

## Development entry point

Read in this order:

1. `00_HANDOFF_GOLDEN_RULE.md`
2. `00_DEVELOPER_START_HERE.md`
3. `00_CURRENT_HANDOFF.md`
4. `PROJECT_STATE.md`
5. `NEXT_TASK.md`
6. `V1.3.0_PRODUCTION_PROOF.md`
7. `RELEASE_V1.3.0.md`
8. `CAREER_MODE_SHOWDOWN_V1.3.0_MAINTENANCE_HANDOFF.md`
9. `POST_V1_ROADMAP_EXECUTION.md`

Older v1.2 release/proof documents remain immutable rollback/history evidence for their own runtimes.

## Locked product model

Career Mode Showdown is a rivalry companion, not a browser football simulator and not yet a cloud/account product.

- exactly two managers;
- one local browser/device and one active Showdown;
- manual FIFA 17 result entry;
- one selected league for both managers;
- different permanent clubs;
- Showdown lengths 1 / 3 / 5 / 10;
- Champions League +5, domestic League +3, main domestic Cup +1;
- 100 League Points and/or 100 League Goals share one +1 performance bonus;
- Top Scorer and/or Top Assist share one +1 awards bonus;
- maximum Season score 11;
- equal non-zero scores are Draw;
- only 0–0 uses league position then league points as tiebreakers.

## Architecture and data safety

Navigation/history/Smart Back authority: `js/screens.js`.
Persistence/destructive mutation authority: `js/storage.js`.
Raw transaction engine: `js/storageTransaction.js`.
Scoring authority: `js/scoring.js`.
Analytics authority: `js/analytics.js`.

Canonical localStorage keys remain exactly:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Candidate A remains non-mutating export. Candidate B remains strictly read-only import analysis. Candidate C is the only import stage permitted to commit canonical state and preserves immutable confirmed intent, strict exact raw snapshot/precondition handling, last-moment exact-byte checks, transaction-owned mutation and rollback, anti-clobber ownership, post-write verification, byte-for-byte rollback verification, corrupt-byte preservation and critical recovery on uncertainty.

Service Worker/Cache Storage contains application bytes only and is never canonical user-data storage.

## Installable Offline App

The current `1.3.0-r1` runtime preserves the v1.2 offline architecture and adds resilience proof around activation, corruption, restart and exact local-data preservation.

- version-owned first-party Service Worker shell;
- complete verified cache population;
- no automatic install-time activation;
- explicit Update Ready activation at safe Home / Showdown Home boundaries;
- Candidate C busy/recovery protection around activation;
- whole-runtime cache selection, never per-file revision mixing;
- current/previous-known-good recovery using `1.3.0-r1` then `1.2.0-r2`;
- worker-owned connectivity verification;
- explicit nonfatal offline degradation for external media;
- lazy PWA controller;
- install/update presentation only inside Settings.

`CMS_ACTIVATE_UPDATE` verifies the whole shell, awaits successful `skipWaiting()`, and only then acknowledges activation acceptance.

## Protected visual baseline

The r2 iOS standalone loading correction is structural: safe-area/viewport behavior is separated from the visual composition. Mobile loading uses a bounded width-owned top band, independent subject-safe Marco Reus image box and opacity/filter-only animation that cannot move protected geometry.

Do not restore floating/sticky global install UI, viewport-height-driven image sizing or random object-position/crop/brightness hacks.

## v1.3.0 production proof

Frozen candidate `b8d92e9a8a9eec2820c439c0dd2699e9d825a91f` passed two complete 13/13 normal PR generations. Release PR #42 merged at `094401b649954656e27e4a92d027e9532e84ccbf`.

After merge, Pages `31755135819`, Stability `31755136265`, deployed-site-smoke `94629478166` and Release Integration Burn-In `31755136240` all passed. The public smoke verified exact runtime bytes, provenance, Home, football visuals, Candidate A/B/C, install/offline behavior and the complete public journey. Burn-In passed 2/2 stateful journeys.

## Validation and performance locks

There are 14 permanent workflow families and 27 protected multiline executable blocks. Normal PRs run 13 families; Release Integration Burn-In is main/manual release-only.

Protected ceilings: eager raw <=165,000 bytes; eager gzip <=37,500 bytes; Marco Reus startup portrait <=95,000 bytes; combined first-party startup <=260,000 bytes; normal loading minimum 2700 ms; reduced-motion loading 220 ms.

Do not raise limits or weaken assertions to make a change pass.

## Current continuation boundary

v1.3.0 — Recovery & Device Resilience Hardening is technically production-proven. The next legal action is to preserve and observe this baseline unless new evidence or an explicitly authorized later milestone requires work.

PR #37 remains untrusted historical work. Local Profiles/Save Library, cloud, accounts, QR pairing, synchronization, gameplay changes and framework rewrites are not implicitly authorized by this release.

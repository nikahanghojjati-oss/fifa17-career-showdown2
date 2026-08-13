# Career Mode Showdown

A lightweight two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript, browser localStorage and a first-party install/offline shell.

Application version: v1.2.0 — Installable Offline App
Current production runtime: `1.2.0-r2`
Previous known-good runtime: `1.2.0-r1`
Release status: merged, deployed, exact-byte verified and technically production-proven
Release PR: #39
Hotfix merge: `2179b7928602b9579dc6e129c40b8739082de80a`
Production Stability: `31740111919` / deployed-site-smoke job `94581704562`
Release Integration Burn-In: `31740111986` — 2/2
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
Current developer entry: `00_DEVELOPER_START_HERE.md`
Current handoff: `00_CURRENT_HANDOFF.md`
Current production proof: `V1.2.0_R2_PRODUCTION_PROOF.md`
Next substantive milestone: v1.3.0 — Recovery & Device Resilience Hardening

Current verified source wins over stale historical status prose. Historical release records remain immutable evidence for the runtime they describe.

## Development entry point

Read in this order:

1. `00_HANDOFF_GOLDEN_RULE.md`
2. `00_DEVELOPER_START_HERE.md`
3. `00_CURRENT_HANDOFF.md`
4. `PROJECT_STATE.md`
5. `NEXT_TASK.md`
6. `V1.2.0_R2_PRODUCTION_PROOF.md`
7. `RELEASE_V1.2.0_R2.md`
8. `CAREER_MODE_SHOWDOWN_V1.2.0_R2_MAINTENANCE_HANDOFF.md`
9. `POST_V1_ROADMAP_EXECUTION.md`

Use `RELEASE_V1.2.0.md` and `CAREER_MODE_SHOWDOWN_V1.2.0_MAINTENANCE_HANDOFF.md` as immutable `1.2.0-r1` rollback/history evidence, not current runtime authority.

Before v1.3 implementation, inspect open draft PR #37 against current r2 main. It contains a known accidental production-shell replacement and must not be treated as a trusted baseline. Details are in `00_CURRENT_HANDOFF.md` and `NEXT_TASK.md`.

## Locked product model

Career Mode Showdown is a rivalry companion, not a browser football simulator and not yet a cloud/account product.

- exactly two managers;
- one local browser/device and one active Showdown;
- both managers play separate FIFA 17 Career Mode saves outside the site;
- manual result entry;
- one selected league for both managers;
- different permanent clubs;
- 1 / 3 / 5 / 10 Season Showdowns;
- default five-league wheel: Premier League, LaLiga, Bundesliga, Serie A, Ligue 1;
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
Service Worker/Cache Storage contains application bytes only and is never canonical user-data storage.

Canonical localStorage keys remain exactly:

- `careerModeShowdown.activeShowdown`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

Candidate A remains non-mutating export. Candidate B remains strictly read-only import analysis. Candidate C is the only import stage permitted to commit canonical state and preserves immutable confirmed intent, strict exact raw snapshot/precondition handling, last-moment exact-byte checks, transaction-owned mutation/rollback, anti-clobber ownership, post-write verification, byte-for-byte rollback verification, corrupt-byte preservation and critical recovery on uncertainty.

## Installable Offline App

The current `1.2.0-r2` runtime preserves the v1.2 offline architecture:

- Web App Manifest and original install artwork;
- version-owned first-party Service Worker shell;
- atomic cache population and verification;
- no automatic install-time activation;
- explicit Update Ready activation at safe Home / Showdown Home boundaries;
- Candidate C busy/recovery protection around activation;
- whole-runtime cache selection so incompatible revisions never mix per file;
- current/previous-known-good shell recovery after corruption;
- worker-owned connectivity verification instead of relying on `navigator.onLine` alone;
- explicit offline degradation for external media;
- lazy PWA controller so eager startup budgets remain protected.

`1.2.0-r1` is the immediate previous known-good whole-runtime shell.

The r2 product hierarchy correction removes global floating install/status presentation. Install and update actions live only inside Settings. Persistent floating/sticky install UI is not an approved default integration pattern and must not return without explicit owner authorization.

## r2 visual hotfix

The owner-reported iOS standalone loading defect was structural, not an image-file defect. The older mobile layout let standalone viewport-height growth change the amount of unused space around the bottom-aligned Reus image, moving the intended subject/title relationship.

r2 separates safe-area/viewport handling from the visual composition. Mobile loading uses a bounded width-owned top band, an independent stable subject-safe image box and an opacity/filter-only Reus entrance animation that cannot move the protected composition geometry.

The visual release gate now covers desktop, low-height desktop, narrow mobile browser and iOS standalone-height archetypes. It validates bounded top-band geometry, image anchoring/crop coverage and title/status/lower-copy relationships and captures screenshots. Visual correctness must not be inferred from element existence, decode success or resolution alone.

## v1.2.0-r2 production proof

The exact hotfix candidate `dd6af02ffdd0cc3fbb193e7e3c703a8023bb972e` passed all 13 normal PR workflow families twice before merge.

After merge:

- PR #39 merged at `2179b7928602b9579dc6e129c40b8739082de80a`;
- post-merge Home visual companion test correction is `e966a5a44927992e2e33f602434c5311bf7caee7`;
- Stability `31740111919` passed local contracts and canonical Chromium stability;
- deployed-site-smoke job `94581704562` passed exact runtime bytes, runtime-error provenance, Home, crop-safe football visuals, Candidate A/B/C, Settings/offline behavior and the complete public journey;
- dedicated V1 Visual Immersion `31740111961` passed protected loading archetypes;
- Release Integration Burn-In `31740111986` passed both complete stateful journeys.

Technical production proof is not a substitute for a separate owner visual-acceptance statement; none is fabricated here.

## Validation ownership

There remain 14 permanent workflow families and 27 protected multiline executable blocks. Normal PRs run 13 families because Release Integration Burn-In is main/manual release-only.

- Candidate B owns one authoritative browser analysis per attempt.
- Candidate C owns one authoritative restore/recovery browser audit per attempt.
- Local Stability owns runtime provenance, offline/cache lifecycle and one complete integration journey.
- Deployed Stability owns exact bytes, provenance, Home, visuals, Candidate A/B/C, Settings/offline behavior and the complete public journey.
- Release Integration Burn-In repeats the complete stateful journey twice.
- Diagnose product failures separately from browser/test-runtime/infrastructure failures.
- Never weaken assertions or duplicate evidence merely to obtain green CI.

## Performance locks

- eager raw code ceiling: 165,000 bytes;
- eager gzip ceiling: 37,500 bytes;
- startup Marco Reus portrait ceiling: 95,000 bytes;
- combined first-party startup ceiling: 260,000 bytes;
- normal loading minimum: 2700 ms;
- reduced-motion loading: 220 ms.

Do not raise limits to make a change pass.

## v1.3 continuation warning and scope

v1.3.0 is Recovery & Device Resilience Hardening.

Start from current verified r2 `main`. Open draft PR #37 (`agent/v13-hardening`) contains useful intended hardening work but also a known serious shell regression introduced by commit `6ce7fe6fab87031b69e3dc5e98587fd3f78b3558`. That commit replaced large portions of the proven production DOM while existing JS/CSS still depended on the original structure, causing menu initialization/visibility failures and version-coherence problems.

Re-audit PR #37 against current main before carrying work forward. Preserve useful evidence-backed hardening only after separating it from the shell regression. Do not migrate the whole app to the accidental alternate shell or merge/deploy the draft as-is.

v1.3 audit scope includes browser/device lifecycle, Service Worker install/update/controller recovery, cache corruption, exact local data preservation, storage blocked/quota failures, Candidate C interruption/ownership uncertainty, Settings/offline/update layering, Smart Back/lazy ownership, Chromebook/mobile/DPR2/touch/keyboard/reduced motion, external-media transitions, dependency/workflow integrity, release coherence and performance headroom.

Cloud, accounts, QR pairing, two-device transport, Local Profiles/Save Library, gameplay changes and framework rewrites remain out of scope unless explicitly authorized.
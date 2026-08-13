# Career Mode Showdown — Developer Start Here

Last updated: 2026-08-13 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Purpose: canonical first read for a new developer session.

## 0. Sixty-second state

Application version: `v1.2.0`
Production runtime revision: `1.2.0-r2`
Previous known-good runtime: `1.2.0-r1`
Public status: merged, deployed, exact-byte verified and technically production-proven
Release PR: #39
Hotfix merge: `2179b7928602b9579dc6e129c40b8739082de80a`
Production Stability: `31740111919` / deployed-site-smoke job `94581704562`
Release Integration Burn-In: `31740111986` — 2/2
Dedicated V1 Visual Immersion: `31740111961`
Production proof: `V1.2.0_R2_PRODUCTION_PROOF.md`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
Next legal milestone: v1.3.0 — Recovery & Device Resilience Hardening.

The r2 hotfix is closed. It corrected iOS standalone loading composition and removed the global floating install/status presentation. Install/update actions now live only in Settings. The Service Worker/cache/recovery system remains intact. Do not reintroduce a global floating/sticky install component without explicit owner approval.

Candidate A export, Candidate B read-only analysis and Candidate C Atomic Restore + Recovery remain complete and protected.

Technical production proof is not a substitute for a separate owner visual-acceptance statement.

## 1. Required read order

1. `00_HANDOFF_GOLDEN_RULE.md`
2. this file
3. `00_CURRENT_HANDOFF.md`
4. `PROJECT_STATE.md`
5. `NEXT_TASK.md`
6. `V1.2.0_R2_PRODUCTION_PROOF.md`
7. `RELEASE_V1.2.0_R2.md`
8. `CAREER_MODE_SHOWDOWN_V1.2.0_R2_MAINTENANCE_HANDOFF.md`
9. `POST_V1_ROADMAP_EXECUTION.md`
10. `RELEASE_V1.2.0.md` and `CAREER_MODE_SHOWDOWN_V1.2.0_MAINTENANCE_HANDOFF.md` only for immutable r1 rollback/history
11. PR #37 metadata/diff/CI before any v1.3 implementation.

Verify `main` at session start because repository head may advance after this document. Current verified source wins over stale historical prose.

## 2. Immediate continuation warning

PR #37 (`agent/v13-hardening`) is an open draft and is not a safe source baseline. Last inspected head: `221212a87cc58712a1ebd9452d7b71cdaa36327d`.

The branch contains a known pre-existing regression from commit `6ce7fe6fab87031b69e3dc5e98587fd3f78b3558` (`Freeze v1.3 shell identity`). That commit replaced large portions of the proven production DOM while existing JS/CSS still expected the original production structure, causing menu initialization/visibility failures and version-coherence problems.

Start v1.3 from current production `main` / `1.2.0-r2`. Fetch and compare PR #37 against current main, isolate useful evidence-backed hardening, and do not merge or blindly continue the accidental alternate shell. Do not migrate the whole application to that shell unless the owner explicitly requests redesign.

`00_CURRENT_HANDOFF.md` contains the detailed PR #37 warning and known potentially useful hardening ideas.

## 3. Locked product model

Career Mode Showdown is a two-manager FIFA 17 Career Mode rivalry companion, not a browser football simulator and not yet a cloud/account product.

- exactly two managers;
- one local browser/device and one active Showdown;
- both managers play their own FIFA 17 Career Mode saves outside the site;
- manual FIFA 17 result entry is authoritative;
- same selected league, different permanent clubs;
- Showdown lengths `[1,3,5,10]`;
- default leagues Premier League, LaLiga, Bundesliga, Serie A, Ligue 1;
- Champions League +5, League +3, main domestic Cup +1;
- 100 League Points and/or 100 League Goals share maximum +1;
- Top Scorer and/or Top Assist share maximum +1;
- maximum Season score 11;
- equal non-zero scores are Draw;
- only 0–0 uses league position then league points.

Do not change these rules during v1.3 maintenance hardening.

## 4. Architecture authority

Navigation/history/Smart Back: `js/screens.js`.
Persistence/destructive mutation: `js/storage.js`.
Raw atomic transaction engine: `js/storageTransaction.js` behind storage authority.
Scoring: `js/scoring.js`.
Canonical Showdown model: `js/showdown.js`.
Analytics: `js/analytics.js`.
Service Worker/Cache Storage: application bytes only, never canonical user data.

Canonical localStorage keys remain exactly:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

## 5. Candidate A/B/C safety contract

Candidate A is non-mutating export. SHA-256 is integrity evidence only, never encryption, signing, authentication or authorization.

Candidate B is strictly read-only analysis. Preview is evidence, never write authority.

Candidate C is the only import stage allowed to commit canonical state. A legal Apply must preserve immutable confirmed intent, strict exact raw snapshot/precondition handling, stale-state barriers, complete in-memory planning, last-moment exact-byte checks, deterministic mutation ownership, post-write verification, transaction-owned reverse rollback, anti-clobber checks, byte-for-byte owned rollback verification, corrupt-byte preservation, critical recovery on uncertainty and deterministic zero-write re-import.

Recovery states remain `RESTORE NOT STARTED`, `RESTORE ROLLED BACK`, and `CRITICAL RECOVERY STATE`.

## 6. Current Installable Offline App locks

The current production shell is `1.2.0-r2`; immutable `1.2.0-r1` is the immediate previous known-good runtime.

- failed/incomplete population cannot replace known-good shell;
- no automatic install-time activation;
- Update Ready activation is explicit and safe-boundary controlled;
- Candidate C busy/recovery state blocks unsafe activation;
- select one complete verified runtime revision, never mix files across revisions;
- cache cleanup is limited to this app's namespaces;
- unrelated caches remain untouched;
- connectivity is verified through the worker rather than trusted from `navigator.onLine` alone;
- external media failure is explicit and nonfatal;
- PWA controller remains lazy;
- install/update presentation belongs only in Settings.

## 7. r2 production evidence

The exact hotfix candidate `dd6af02ffdd0cc3fbb193e7e3c703a8023bb972e` passed all 13 normal PR workflow families twice before merge.

Production proof:

- PR #39 merged at `2179b7928602b9579dc6e129c40b8739082de80a`;
- post-merge Home companion browser/test correction: `e966a5a44927992e2e33f602434c5311bf7caee7`;
- Stability: `31740111919`;
- deployed-site-smoke: `94581704562`;
- V1 Visual Immersion: `31740111961`;
- Release Integration Burn-In: `31740111986`, two complete stateful journeys green.

Deployed Stability passed exact runtime bytes, runtime-error provenance, Home/Reus, crop-safe football visuals, Candidate A, Candidate B, Candidate C, Settings/offline behavior and the complete public journey.

## 8. Visual and product-integration guardrails

The loading visual audit covers desktop, low-height desktop, narrow mobile browser and iOS standalone-height archetypes. It validates bounded top-band geometry, image anchoring/crop coverage and title/status/lower-copy relationships, with screenshot evidence.

Do not judge visual correctness only from image decode, element existence or resolution. Inspect composition relationships and actual rendered screenshots. Avoid measuring protected geometry mid-transform animation.

Utility actions should live inside the relevant utility route. Persistent global overlays are exceptional product decisions and require explicit owner authorization.

## 9. Smart CI rule

There remain 14 permanent workflow families and 27 protected multiline executable blocks. Normal PRs run 13 families; Burn-In is main/manual release-only.

- specialist workflows own specialist evidence once;
- Candidate B owns one authoritative import-analysis browser run;
- Candidate C owns one authoritative restore/recovery browser run;
- local Stability owns runtime provenance, offline/cache lifecycle and one complete integration journey;
- deployed Stability owns exact bytes, provenance, Home, visuals, Candidate A/B/C, install/offline and the complete public journey;
- Burn-In repeats the complete stateful journey twice;
- diagnose product failure separately from browser/test-runtime/infrastructure failure;
- never weaken assertions merely to obtain green CI.

## 10. Performance locks

Eager raw code ceiling: 165,000 bytes.
Eager gzip ceiling: 37,500 bytes.
Startup Marco Reus portrait ceiling: 95,000 bytes.
Combined first-party startup ceiling: 260,000 bytes.
Normal loading minimum: 2700 ms.
Reduced-motion loading: 220 ms.

Do not raise these limits to make a change pass.

## 11. Next milestone

v1.3.0 — Recovery & Device Resilience Hardening.

Audit browser/device lifecycle, Service Worker install/update/controller recovery, cache corruption, exact local data preservation, blocked/quota storage behavior, Candidate C interruption/ownership uncertainty, Settings/offline/update layering, Smart Back and lazy listener ownership, Chromebook/mobile/DPR2/touch/keyboard/reduced motion, media offline/online transitions, dependency/workflow integrity, version/revision/handoff coherence and performance headroom.

Fix evidence-backed defects only and add focused regression proof. Preserve working gameplay, persistence, navigation, PWA behavior, performance and accepted visuals.

Cloud, accounts, QR pairing, two-device transport, Local Profiles/Save Library, gameplay/scoring changes and framework rewrites remain out of scope.

A correctly oriented developer should be able to state:

`v1.2.0 / 1.2.0-r2 is merged, deployed and technically production-proven. r1 is the previous known-good runtime. The iOS standalone loading and global install-bar regressions are fixed and protected. Candidate A/B/C remain locked. The next legal task is v1.3 Recovery & Device Resilience Hardening from current main, with PR #37 treated as an untrusted draft until its useful work is separated from its known shell regression.`
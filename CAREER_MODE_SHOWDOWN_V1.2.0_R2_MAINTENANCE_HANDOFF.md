# Career Mode Showdown — v1.2.0 r2 Hotfix Maintenance Handoff

Last updated: 2026-08-13 ET
Application version: v1.2.0
Production runtime asset revision: `1.2.0-r2`
Previous known-good runtime: `1.2.0-r1`
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Release PR: #39
Hotfix merge: `2179b7928602b9579dc6e129c40b8739082de80a`
Status: technically production-proven
Production proof: `V1.2.0_R2_PRODUCTION_PROOF.md`
Next legal milestone: v1.3.0 — Recovery & Device Resilience Hardening

## Owner instruction that produced this hotfix

Fix, test, deploy and ship the iOS installed-app loading regression and the install UI hierarchy regression. Installation belongs in Settings. Floating bars, sticky prompts and universal install overlays are not authorized as a default product pattern.

## Root cause and shipped fix

The old mobile loading path combined a viewport-height-sensitive athlete frame with a bottom-aligned contained portrait. A taller standalone iOS viewport increased unused vertical space above the rendered Reus image, so the installed app could show a large top band and shift the intended subject/title relationship even though mobile Safari looked acceptable.

The r2 fix separates safe-area/viewport behavior from visual composition. The mobile photo gets a bounded width-owned top band and a stable subject-safe image box. Raw standalone viewport-height growth no longer stretches the art. The mobile Reus entrance animation is opacity/filter-only so it cannot move the protected composition geometry during visual measurement or user viewing.

The old offline controller also injected a fixed global install/status rail and panel. r2 removes presentation injection from the controller. Service Worker registration, complete-cache verification, connectivity probing, safe update activation, previous-runtime rollback and offline media degradation remain. Settings alone owns the install/update presentation and delegates to controller APIs.

## Regression philosophy established by this release

Visual gates must verify composition relationships, not only element existence, decode success or physical pixel density. The loading visual audit covers desktop, low-height desktop, narrow mobile browser and iOS standalone-height archetypes. It checks bounded top-band geometry, image anchoring/crop coverage, identity position, status/lower-copy placement and browser-versus-standalone drift, with screenshot evidence.

Do not lower a visual threshold because a test sampled a transform animation. Measure the intended settled state or use animation that cannot alter the protected layout box.

Utility actions live inside their appropriate utility surface. Persistent global overlays are exceptional product decisions and require explicit owner authorization.

## Production validation

The frozen hotfix candidate `dd6af02ffdd0cc3fbb193e7e3c703a8023bb972e` passed all 13 normal PR workflow families twice before merge.

Production proof:

- PR #39 merged at `2179b7928602b9579dc6e129c40b8739082de80a`;
- post-merge Home companion browser/test correction: `e966a5a44927992e2e33f602434c5311bf7caee7`;
- Stability `31740111919` passed local contracts and Chromium stability;
- deployed-site-smoke job `94581704562` passed exact bytes, runtime provenance, Home, crop-safe football visuals, Candidate A/B/C, Settings/offline boundary and the complete public journey;
- V1 Visual Immersion `31740111961` passed the protected loading archetypes;
- Release Integration Burn-In `31740111986` passed 2/2 complete stateful journeys.

Technical proof is complete. Keep owner visual acceptance distinct from automated/developer QA.

## Protected systems

No gameplay rule, scoring rule, club database, persistence authority, Candidate A/B/C contract, Smart Back ownership, accepted Home/route visual, startup performance ceiling or local-first data rule may change without explicit owner direction.

Candidate C continues to require immutable confirmed intent, strict exact raw snapshot/precondition handling, last-moment prewrite checks, transaction-owned mutation/rollback, anti-clobber ownership checks, post-write verification, byte-for-byte rollback verification and critical recovery on uncertainty.

Exactly three canonical localStorage keys remain legal. `js/storage.js` remains sole persistence/destructive mutation authority. `js/screens.js` remains sole route/history/Smart Back authority.

`1.2.0-r1` remains the immediate immutable previous known-good whole-runtime shell. Preserve `RELEASE_V1.2.0.md` and `CAREER_MODE_SHOWDOWN_V1.2.0_MAINTENANCE_HANDOFF.md` as r1 historical/rollback evidence.

## Continuation into v1.3

Begin v1.3.0 Recovery & Device Resilience Hardening from current verified r2 `main`.

Open draft PR #37 (`agent/v13-hardening`) must be treated as untrusted until re-audited. Its last inspected head is `221212a87cc58712a1ebd9452d7b71cdaa36327d`. Commit `6ce7fe6fab87031b69e3dc5e98587fd3f78b3558` accidentally replaced large portions of the proven production DOM during a shell identity freeze while existing JS/CSS still expected the original structure. This caused menu initialization/visibility failures and version-coherence problems.

Do not merge or blindly continue that alternate shell. Compare PR #37 with current r2 main, preserve useful evidence-backed hardening only after separating it from the regression, and prefer the smallest coherent correction. Known potentially useful work includes fail-closed Candidate A behavior on blocked storage reads, true pre-offline media-state restoration, update activation race hardening, Service Worker registration reuse and semantic roadmap contracts; every item must be revalidated against current source.

v1.3 scope is recovery/device resilience only: browser lifecycle, Service Worker recovery, cache corruption, exact local data preservation, storage failures, Candidate C interruption/ownership uncertainty, Settings/offline/update layering, Smart Back/lazy ownership, Chromebook/mobile/DPR2/touch/keyboard/reduced motion, media online/offline transitions, dependency/workflow integrity, release coherence and performance headroom.

Cloud, accounts, QR pairing, two-device transport, Local Profiles/Save Library, gameplay changes and framework rewrites remain out of scope unless the owner explicitly changes direction.

Use `00_CURRENT_HANDOFF.md`, `PROJECT_STATE.md` and `NEXT_TASK.md` as the live continuation authorities.
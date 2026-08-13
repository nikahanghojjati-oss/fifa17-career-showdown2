# Career Mode Showdown — Current Complete Handoff

Last updated: 2026-08-13 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
Application version: v1.2.0 — Installable Offline App
Production runtime revision: `1.2.0-r2`
Previous known-good runtime: `1.2.0-r1`
Technical status: merged, deployed, exact-byte verified and production-proven
Release PR: #39
Hotfix merge commit: `2179b7928602b9579dc6e129c40b8739082de80a`
Post-merge visual-test runtime authority: `e966a5a44927992e2e33f602434c5311bf7caee7`
Production proof record: `V1.2.0_R2_PRODUCTION_PROOF.md`
Production Stability: `31740111919` / deployed-site-smoke job `94581704562`
Release Integration Burn-In: `31740111986` — 2/2 complete stateful journeys passed
Dedicated V1 Visual Immersion: `31740111961`
Next legal milestone: v1.3.0 — Recovery & Device Resilience Hardening

This is the active continuation handoff required by `00_HANDOFF_GOLDEN_RULE.md`. Current verified source on `main`, explicit later owner decisions, this file, `PROJECT_STATE.md` and `NEXT_TASK.md` outrank stale historical prose. Historical release records remain evidence, not current-state authority.

## What was just shipped

The owner-authorized v1.2.0 runtime hotfix `1.2.0-r2` is closed and production-proven.

Two production regressions were fixed:

1. iOS installed/standalone loading composition. The old mobile loading composition depended on viewport-height growth and a bottom-aligned contained Reus portrait. A taller standalone iOS viewport created unused vertical space above the subject and shifted the intended composition. The fix separates safe-area/viewport handling from the art composition, gives the mobile image a bounded width-owned top band and independent subject-safe image box, and uses an opacity/filter-only mobile entrance animation so animation cannot move the composition geometry.
2. Install UI hierarchy. The global floating install/status rail and panel were removed from every screen. Install/update actions now live only inside Settings. Service Worker registration, whole-runtime cache verification, connectivity probing, explicit safe update activation, offline media degradation and previous-runtime recovery remain presentation-neutral.

Do not reintroduce a persistent floating/sticky install bar, global install overlay, or layout reservation for one unless the owner explicitly authorizes that exact product pattern.

## Production proof

The exact hotfix candidate SHA `dd6af02ffdd0cc3fbb193e7e3c703a8023bb972e` passed all 13 normal PR workflow families twice. The identical release candidate merged through PR #39 at `2179b7928602b9579dc6e129c40b8739082de80a`.

After merge, the Home visual companion browser mode was corrected in test code at `e966a5a44927992e2e33f602434c5311bf7caee7`; this did not change shipped runtime behavior.

Production evidence:

- Stability `31740111919` passed stability contracts and Chromium stability;
- deployed-site-smoke job `94581704562` passed exact deployed runtime bytes, runtime-error provenance, Home visual audit, crop-safe football visuals, Candidate A, Candidate B, Candidate C, Settings/offline boundary and the complete public journey;
- Release Integration Burn-In `31740111986` passed both complete stateful journeys;
- dedicated V1 Visual Immersion `31740111961` passed the protected loading visual archetypes;
- `V1.2.0_R2_PRODUCTION_PROOF.md` records the r2 seal.

Technical production proof is complete. Do not invent a separate owner visual-acceptance statement; treat future owner screenshots or complaints as new evidence.

## New visual/testing guardrails learned from the hotfix

Visual gates must validate composition relationships, not merely element existence, image decode success or pixel density. The loading audit now covers desktop, low-height desktop, narrow mobile browser and iOS standalone-height archetypes. It checks bounded top-band geometry, image anchoring/crop coverage and title/status/lower-copy relationships and captures screenshots.

When animation affects an element, geometry assertions must inspect the intended settled state or use an animation that cannot alter the protected layout box. Never lower a visual threshold merely because a test sampled mid-animation.

Utility actions belong inside the appropriate utility surface. Persistent global overlays are exceptional product decisions, not a default integration pattern.

## Locked product model

- exactly two managers;
- one local browser/device and one active Showdown;
- manual FIFA 17 result entry;
- same selected league, different permanent clubs;
- Showdown lengths `[1,3,5,10]`;
- Champions League +5, domestic League +3, main domestic Cup +1;
- 100 League Points and/or 100 League Goals share maximum +1;
- Top Scorer and/or Top Assist share maximum +1;
- maximum Season score 11;
- equal non-zero scores are Draw;
- only 0–0 uses league position then league points.

Do not change these rules during v1.3 maintenance hardening.

## Architecture and data authority

- navigation/history/Smart Back: `js/screens.js`;
- canonical persistence/destructive mutation: `js/storage.js`;
- raw transaction engine: `js/storageTransaction.js`;
- scoring: `js/scoring.js`;
- analytics: `js/analytics.js`;
- Service Worker / Cache Storage: versioned application bytes only, never canonical user data.

Exactly three canonical localStorage keys remain legal:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Candidate A remains non-mutating export. Candidate B remains strictly read-only analysis. Candidate C is the only import stage allowed to commit canonical state and must preserve immutable confirmed intent, strict exact raw snapshot/precondition handling, last-moment prewrite checks, complete in-memory planning, transaction-owned mutation/rollback, anti-clobber ownership checks, post-write verification, byte-for-byte rollback verification, corrupt-byte preservation and critical recovery on uncertainty.

## Installable Offline App locks

- `1.2.0-r2` is the current whole-runtime shell;
- `1.2.0-r1` is the immediate previous known-good runtime and immutable rollback evidence;
- incomplete cache population cannot replace a known-good runtime;
- no automatic install-time activation;
- Update Ready activation is explicit and limited to safe Home / Showdown Home boundaries;
- Candidate C transaction/recovery busy state blocks unsafe activation;
- select one whole verified cache revision; never mix per-file revisions;
- cache cleanup is limited to this app's namespaces and unrelated caches remain intact;
- worker-owned connectivity verification is authoritative over `navigator.onLine` alone;
- external YouTube media degrades explicitly offline;
- PWA/offline controller remains lazy to preserve startup budgets;
- install/update presentation remains Settings-owned.

## Permanent validation topology

There remain 14 permanent workflow families and 27 protected multiline executable blocks. Normal PRs exercise 13 families because Release Integration Burn-In is main/manual release-only.

Candidate B owns one import-analysis browser proof. Candidate C owns one restore/recovery proof. Local Stability owns provenance, offline lifecycle and one complete journey. Deployed Stability owns exact bytes plus the exhaustive public boundary. Release Integration Burn-In repeats only the complete stateful journey twice. Keep specialist ownership single and purposeful.

Never weaken a gate or duplicate a matrix merely to obtain green CI. Separate product defects from browser/test-runtime/infrastructure failures before touching production code.

## Performance locks

- eager raw: 165,000 bytes max;
- eager gzip: 37,500 bytes max;
- Reus startup portrait: 95,000 bytes max;
- combined first-party startup: 260,000 bytes max;
- normal loading minimum: 2700 ms;
- reduced-motion loading: 220 ms.

Do not raise limits to make a change pass.

## Critical warning about open PR #37

PR #37, branch `agent/v13-hardening`, remains an open draft and must NOT be treated as a safe continuation baseline simply because it is named v1.3.

Last inspected PR #37 head: `221212a87cc58712a1ebd9452d7b71cdaa36327d`.

A pre-existing commit on that branch, `6ce7fe6fab87031b69e3dc5e98587fd3f78b3558` (`Freeze v1.3 shell identity`), replaced large parts of the proven production DOM shell instead of merely freezing version identity. Existing JS/CSS was not migrated to that alternate DOM. Examples of protected structures/IDs that were removed or replaced included the loading `.startupScene/.startupAthleteFrame/#startupAthlete`, `#topHeader`, the `.fifaMenuShell/.fifaMenuGrid` Home structure, `#continueCareer`, `#createShowdown` and canonical route markup. `js/menuExperience.js` and navigation code still expected the production shell, producing menu initialization failures and a hidden main menu. The branch also had incoherent version identity at inspection time.

Therefore:

- start v1.3 reasoning from current production `main` / `1.2.0-r2`, not from PR #37;
- fetch PR #37 and compare it against current main before reusing any work;
- preserve useful evidence-backed hardening commits only after isolating them from the shell regression;
- do not merge, deploy or version-freeze PR #37 in its currently known form;
- do not solve the regression by migrating the entire app to the accidental alternate shell unless the owner explicitly requests a redesign;
- the smallest coherent correction is preferred.

PR #37's useful intended hardening work may still be salvageable, including evidence around blocked Candidate A reads, offline→online media state, update activation races, Service Worker registration reuse and semantic roadmap contracts. Re-audit each change against current r2 source before carrying it forward.

## Immediate next task: v1.3.0 Recovery & Device Resilience Hardening

Audit before changing code. Begin from current `main` and establish exact divergence with PR #37. Then investigate evidence-backed defects in:

- browser close/reopen, reload, Service Worker controller change and update interruption;
- failed cache population/activation, cache corruption and deterministic known-good recovery;
- exact preservation of all three canonical raw localStorage values;
- storage blocked-read/write/quota/corrupt-data behavior;
- Candidate C interruption, stale state, ownership uncertainty and rollback verification;
- Settings/offline/update UI layering, focus, keyboard/touch and reduced motion;
- Smart Back and lazy-screen/listener ownership;
- Chromebook low-height, mobile, DPR2 and accessibility behavior;
- external-media offline/online transitions;
- dependency-lock and reproducible `npm ci` integrity;
- workflow cancellation/artifact/single-owner semantics;
- release/version/revision/handoff coherence;
- performance headroom without raising protected ceilings.

Fix only evidence-backed defects. Add focused regression proof for every real fix. Preserve working gameplay, persistence, navigation, PWA behavior, performance and accepted visuals.

Cloud, accounts, QR pairing, two-device transport, Local Profiles/Save Library, gameplay/scoring changes and framework rewrites are out of scope unless the owner explicitly changes direction.

## Required developer read order

1. `00_HANDOFF_GOLDEN_RULE.md`
2. `00_DEVELOPER_START_HERE.md`
3. this file, `00_CURRENT_HANDOFF.md`
4. `PROJECT_STATE.md`
5. `NEXT_TASK.md`
6. `V1.2.0_R2_PRODUCTION_PROOF.md`
7. `RELEASE_V1.2.0_R2.md`
8. `CAREER_MODE_SHOWDOWN_V1.2.0_R2_MAINTENANCE_HANDOFF.md`
9. `POST_V1_ROADMAP_EXECUTION.md`
10. immutable r1 records `RELEASE_V1.2.0.md` and `CAREER_MODE_SHOWDOWN_V1.2.0_MAINTENANCE_HANDOFF.md` only for rollback/history
11. current PR #37 metadata, diff and CI before touching v1.3 work.

At the start of the next development session, verify `main` again because repository head may have advanced after this handoff. Source wins over stale prose.
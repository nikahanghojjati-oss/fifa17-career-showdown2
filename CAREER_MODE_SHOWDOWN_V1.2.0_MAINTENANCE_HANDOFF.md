# Career Mode Showdown — v1.2.0 Maintenance Handoff

Last updated: 2026-08-13 ET
Release candidate: `v1.2.0`
Runtime asset revision: `1.2.0-r1`
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Canonical PR: #34
Canonical development branch: `agent/v1.2-installable-offline-r1`
Last production-proven runtime: v1.1.5 / `1.1.5-r1`
Immutable v1.1.5 runtime authority: `ff755a9863abc843ae9aac45178428e3a104fc65`

## Owner instruction preserved

Continue the existing project deeply rather than restarting or redesigning it. Preserve working gates and functions where they make architectural sense. Investigate testing failures before changing production code. Make testing smarter rather than weaker. Maintain infrastructure/code/site coherence, follow the approved roadmap and prioritize bug-free delivery with maximum attention to detail.

This file must be updated by every continuing development session under `00_HANDOFF_GOLDEN_RULE.md`.

## Current release truth

v1.2.0 Installable Offline App is a release candidate only. v1.1.5 remains the last merged and deployed production-proven application until `main` serves byte-coherent `1.2.0-r1` and the deployed Stability boundary passes.

Do not call v1.2.0 production-proven merely because PR tests are green.

## Protected systems

Do not alter without explicit owner direction:

- exactly two managers;
- Showdown lengths `[1,3,5,10]`;
- same selected league with different permanent clubs;
- maximum-11 scoring and 0–0-only tiebreak;
- League confirmation and Club rivalry confirmation checkpoints;
- Transfer Challenge state machine;
- Season Review persistence boundary;
- Statistics/Legacy/Trophy calculations;
- `js/screens.js` as sole navigation/history/Smart Back authority;
- exactly three canonical localStorage keys;
- `js/storage.js` as canonical persistence/destructive authority;
- `js/storageTransaction.js` as the raw transaction engine;
- Candidate A non-mutating backup format v1;
- Candidate B strictly read-only analysis;
- Candidate C immutable confirmed intent, exact raw snapshot, transaction-owned rollback and anti-clobber semantics;
- protected Marco Reus and accepted football-photo presentation;
- protected startup budgets;
- local-first operation.

## v1.2.0 architecture

The release candidate adds installability/offline support without introducing accounts, cloud sync, cloud backup, QR pairing, two-device state transport, new gameplay rules or a framework rewrite.

The application shell is version-owned by `1.2.0-r1`. Service Worker installation fully populates and verifies the required first-party shell. An incomplete new cache is deleted and cannot replace the active known-good runtime. Install does not call `skipWaiting()` automatically.

A waiting worker surfaces Update Ready. The page may request activation only from Home or Showdown Home and only when Candidate C transaction/recovery busy state and other critical busy state are clear. The worker verifies the complete candidate cache again before `skipWaiting()`. The page reloads only after a controller change that follows an explicit activation request.

Navigation selects one whole coherent cache revision. It never borrows individual files from another revision. Current and previous known-good shells are separately verified. Obsolete cleanup is restricted to this application's own cache namespaces; unrelated origin caches remain untouched. Cache Storage holds application bytes only and never becomes user-data authority.

Connectivity is not trusted from `navigator.onLine` alone. The page asks the active worker to perform an uncached same-origin network probe and receives the result through `MessageChannel`. Offline mode keeps the local tracker usable and explicitly disables/explains external YouTube media.

The PWA controller and stylesheet remain lazy so the eager startup path remains under the locked performance ceilings.

## Testing investigation and lessons

The historical testing problem was orchestration duplication and misleading evidence, not weak product gates.

Root causes already identified:

- Stability used to repeat specialist browser suites;
- Candidate B/C duplicated browser evidence;
- Burn-In repeated near-complete matrices five times;
- Markdown-only seals launched heavy lanes;
- broad cancellation could kill useful active proof;
- frequent polling made long but healthy jobs look stalled;
- GitHub run-attempt presentation could look like restarts.

Current topology remains protected:

- 14 permanent workflow families;
- 27 protected multiline executable blocks;
- specialists own specialist evidence once;
- Candidate B owns one import-analysis browser proof;
- Candidate C owns one restore/recovery browser proof;
- local Stability owns runtime provenance, one offline/cache lifecycle proof and one complete integration journey;
- deployed Stability owns the exhaustive public boundary;
- Release Integration Burn-In runs two complete stateful journeys on main/manual release use;
- Markdown-only release seals skip heavy browser lanes;
- deliberate reruns/manual dispatches do not cancel useful active proof.

Do not recreate a parallel PWA workflow family.

## Defects found and learned from during v1.2 development

1. Initial PWA logic added too much eager code and broke protected startup budgets. The correct fix was architectural: move PWA behavior lazy rather than increase the limit.
2. The initial 512 install SVG accidentally inherited 192 dimensions. The asset was corrected rather than accepting a superficial manifest pass.
3. The install rail overlapped the existing runtime-notice dismiss control. Stability correctly caught pointer interception. The new install UI was moved below critical runtime-notice authority.
4. `navigator.onLine` reported online while the browser was genuinely disconnected. Connectivity was changed to verified same-origin reachability.
5. The first reachability probe appeared to the generic page request monitor as an expected first-party failure. The probe was moved into the Service Worker so the page-level monitor remains strict.
6. The offline browser audit initially targeted `data-smart-back` on a lazy Rule Book control even though `.backButton` delegation in `screens.js` is the real authority. The lazy control gained the shared semantic marker without adding a listener or competing state machine.
7. Sparticuz Chromium's `--single-process` mode exited after the first browser context, preventing the synthetic second lifecycle context. Only the offline lifecycle audit now removes that flag through `CMS_CHROMIUM_MULTI_CONTEXT=1`; all other browser suites keep their proven launch profile.
8. Missing downstream Stability artifacts used to create a second unrelated error after an earlier assertion stopped the journey. Artifact absence now warns instead of masking the original owner failure.
9. Release identity freeze initially exposed stale documentation authority. Runtime contracts passed first; documentation gates are now being aligned without mislabeling a PR candidate as deployed production.

## Functional prototype proof

Before the final v1.2 identity freeze, all 13 normal PR workflow families passed together, including Candidate C and Stability.

The offline lifecycle owner proved:

- first online install creates a complete application shell;
- manifest fetchability and install-sized artwork;
- service-worker cache identity matches the loaded page;
- installed offline boot succeeds;
- all three canonical raw localStorage values remain byte-for-byte unchanged;
- external YouTube media degrades explicitly;
- optional routes and Candidate A/B/C modules load offline without canonical mutation;
- repeat online load preserves raw bytes;
- failed new-cache population preserves the active known-good runtime;
- a complete update waits rather than auto-activates;
- explicit activation occurs only after complete cache verification;
- unrelated origin caches survive activation;
- corruption cycle one rolls the entire offline navigation to a coherent known-good shell;
- corruption cycle two repeats the same recovery after another upgrade;
- a fresh offline page deterministically selects the known-good shell.

After the lifecycle proof, the normal complete journey passed 70 checkpoints and 36 axe scans.

## Release identity freeze

Current release candidate identity:

- `package.json`: `1.2.0`;
- `package-lock.json`: `1.2.0`;
- `js/app.js`: `APP_VERSION = "1.2.0"`;
- `index.html`: `1.2.0-r1` meta/footer/eager references;
- `manifest.webmanifest`: versioned install artwork;
- `service-worker.js`: `RUNTIME_REVISION = "1.2.0-r1"`;
- `js/offlineApp.js`: meta-derived revision with `1.2.0-r1` fallback;
- `js/menuExperience.js`: protected Home Reus query `1.2.0-r1`;
- `RELEASE_V1.2.0.md`: release-candidate record.

The dynamic static release contract has already accepted v1.2.0 / `1.2.0-r1` and startup budgets of 164,563 raw bytes / 37,355 gzip bytes.

The new fast offline static contract has already passed with 64 version-owned shell resources, three install icons, and one local plus one deployed Stability owner.

## Current gate state at handoff creation

The first frozen release-candidate matrix stopped in repository authority coherence because the version-specific maintenance handoff did not yet exist. This file resolves that requirement. The same pass had already shown:

- JavaScript syntax green;
- dynamic static release architecture green;
- stability contract green after candidate-vs-production publication semantics were introduced;
- Candidate C storage/planning/stale-state/maintenance contracts green;
- offline static contract green.

A complete final PR matrix is still required after this handoff/release-authority change.

## Release-process semantics

During PR release-candidate validation, `PROJECT_STATE.md`, `NEXT_TASK.md`, this handoff and `RELEASE_V1.2.0.md` identify v1.2.0 as current candidate. README/CHANGELOG may continue to identify v1.1.5 as last production-proven until deployment, provided they clearly reserve v1.2.0 Installable Offline App as the next/current candidate milestone.

Once `RELEASE_V1.2.0.md` is promoted out of RELEASE CANDIDATE status after deployed proof, release authority must require README/CHANGELOG and all current-facing docs to advance to v1.2.0 / `1.2.0-r1`.

## Immediate legal continuation

1. finish release-authority candidate semantics;
2. run one complete normal PR matrix on the frozen v1.2.0 candidate;
3. do not change already-green gameplay/storage/visual code to satisfy documentation-only failures;
4. if all PR gates pass, merge through the protected path;
5. require deployed GitHub Pages exact-byte and exhaustive Stability proof;
6. only then mark v1.2.0 production-proven and perform the docs-only release seal;
7. close duplicate PR #35 as superseded;
8. only then advance to v1.3.0 Recovery & Device Resilience Hardening.
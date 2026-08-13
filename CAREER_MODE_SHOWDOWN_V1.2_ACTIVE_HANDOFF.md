# Career Mode Showdown — v1.2 Active Development Handoff

Last updated: 2026-08-13 ET
Status: ACTIVE DEVELOPMENT — v1.2.0 Installable Offline App
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Development branch: `agent/v1.2-installable-offline-r1`
Branch base: current `main` at `f25dd248898a79b0fd4a08341343148fc04b793d`
Immutable v1.1.5 runtime authority being preserved: `ff755a9863abc843ae9aac45178428e3a104fc65`

## Owner instruction

Continue from the interrupted project state, deeply study the handoff and project material, investigate infrastructure/code/site coherency and what happened to testing, learn from the testing history, preserve gates where they still make architectural sense, make validation smarter rather than weaker, follow the approved roadmap, and build the next product with maximum attention to detail.

## Authority and scope

Current source on `main` remains implementation authority. v1.1.5 is closed, live and twice production-proven. Candidate A export, Candidate B read-only analysis and Candidate C atomic restore/recovery are protected and are not being reopened.

The only legal substantive milestone is v1.2.0 Installable Offline App. This work must not add profiles, accounts, cloud sync, cloud backup, QR pairing, two-device state transport, gameplay/scoring changes or a framework rewrite.

## Required v1.2 outcome

The intended product increment is an installable and offline-capable shell that preserves v1.1.5 data safety and runtime identity guarantees:

1. Web app manifest and original install icons/metadata.
2. Version-owned first-party shell cache.
3. Atomic service-worker install/activation behavior.
4. Explicit Update Ready UX with user-controlled activation at a safe application boundary.
5. Offline status and graceful external-media degradation.
6. Chromebook/Android install behavior and browser-appropriate guidance elsewhere.
7. First-load, repeat-load, installed-offline, navigation, update, activation, failed-population, corruption and rollback tests.
8. Candidate A/B/C invariance across the offline/update layer.
9. Two consecutive cache-revision upgrade/rollback proofs before release.

## Testing investigation and lessons preserved

The previous validation problem was orchestration noise, not evidence that the product gates were inherently defective.

Historical root causes now understood:

- Stability serialized duplicated specialist browser suites and repeated them.
- Candidate B and Candidate C repeated their browser evidence inside their own workflows.
- Burn-In repeated near-complete release matrices five times.
- Markdown-only sealing commits unnecessarily launched heavy browser lanes.
- broad `cancel-in-progress` behavior could cancel a useful active proof during a rerun/manual dispatch.
- frequent polling made long but healthy jobs look stalled.
- GitHub `run_attempt` presentation could make a completed job look as though it restarted.

The corrected topology on `main` is the baseline for v1.2:

- specialist workflows own specialist evidence once per workflow attempt;
- Candidate B owns one authoritative import-analysis browser execution;
- Candidate C owns one authoritative restore/recovery browser execution;
- local Stability owns one provenance pass and one complete integration journey;
- deployed Stability remains the exhaustive public boundary;
- Release Integration Burn-In is main/manual only and repeats only the complete stateful journey twice;
- Markdown-only changes skip heavy browser lanes;
- reruns/manual dispatches queue rather than cancelling useful active proof;
- whole matrices are not rerun to repeat a single failed owner proof.

v1.2 testing will extend this single-owner model. It must add unique offline/cache/update assertions without recreating duplicated long browser loops. Speed improvements are legal only when assertion ownership and release confidence remain intact.

A second historical QA lesson remains binding: green technical gates are not a substitute for owner visual acceptance. The licensed football-image incident proved that decode/license/resolution checks could pass while subject framing was visibly wrong. v1.2 install/offline UX therefore needs both deterministic browser contracts and visible state-quality checks, especially for update/offline/install surfaces.

## Source/infrastructure observations before implementation

- Current app is a static HTML/CSS/classic-script SPA on GitHub Pages.
- Current visible app version is `1.1.5`; shell revision is `1.1.5-r1`.
- Startup contains exactly one eager local stylesheet and seven eager local scripts, all revision-aligned.
- Protected startup budgets remain 165,000 raw code bytes, 37,500 gzip code bytes, 95,000 bytes for the Reus portrait and 260,000 combined first-party startup bytes.
- `js/screens.js` remains sole navigation/history authority.
- `js/storage.js` remains sole canonical persistence/destructive authority.
- `js/storageTransaction.js` remains the raw transaction engine behind storage authority.
- Exactly three canonical localStorage keys remain legal.
- Candidate C already exposes restore transaction busy state in the DOM through `data-transaction-busy`; this is useful read-only evidence for a safe Update Ready boundary without creating a competing persistence state machine.
- External YouTube media is intentionally lazy and currently times out/fails safely; v1.2 must additionally make the offline state explicit and avoid attempting remote playback when known offline.
- No manifest, service worker or dedicated offline/cache browser suite exists on current `main`; v1.2 is not partially implemented.
- The local test server already serves JS/CSS/JSON/PNG/SVG/WebP with no-store and is suitable for deterministic localhost service-worker tests after adding `.webmanifest` MIME support if required.

## Current design direction

Use a small first-party service worker rather than introducing Workbox or another runtime dependency. The cache namespace will be tied directly to the semantic runtime asset revision. The install phase must fully populate and verify the required shell before the worker can become a viable update. It must never delete the old good cache during install.

Do not call `skipWaiting()` automatically during install. A newly installed update should remain waiting. The page layer will surface Update Ready, verify the application is at a safe boundary, then explicitly message the waiting worker to activate. Only after controller change will the page reload into the coherent new revision.

The fetch strategy will be deliberately narrow: same-origin GET requests for known version-owned first-party application resources can be satisfied from the current revision cache; navigations will fall back to cached `index.html` when offline. Cross-origin media/font requests are not copied into the app shell and must fail/degrade visibly without breaking the tracker. Cache Storage is never a user-data authority.

Obsolete application-shell caches may be removed only during activation of a fully installed new worker, and only for this app's own cache namespace. Unrelated origin caches must remain untouched.

## Protected systems

Do not alter:

- exactly two managers;
- Showdown lengths `[1,3,5,10]`;
- same selected league / different permanent clubs;
- max-11 scoring and 0–0-only tiebreak;
- League-confirmation and Club-rivalry checkpoints;
- Transfer Challenge state machine;
- Season Review persistence boundary;
- Statistics/Legacy/Trophy calculations;
- centralized Smart Back/navigation ownership;
- exactly three canonical localStorage keys;
- Candidate A non-mutating backup format v1;
- Candidate B read-only analysis;
- Candidate C immutable confirmed intent, exact raw snapshots, transaction-owned rollback and anti-clobber semantics;
- protected Marco Reus/football-photo presentation;
- startup budgets;
- local-first behavior.

## Work log

### 2026-08-13 — session start

- Loaded current `main` and confirmed branch base `f25dd248898a79b0fd4a08341343148fc04b793d`.
- Read the golden rule, developer start document, current complete handoff, `NEXT_TASK.md`, `PROJECT_STATE.md` and the v1.2 roadmap section.
- Confirmed no open PR exists before starting v1.2.
- Read current startup identity in `index.html` and `js/app.js`.
- Read current dynamic release contracts and smart CI orchestration contracts.
- Read Stability workflow and browser test harness structure.
- Read restore UI enough to identify existing transaction-busy evidence.
- Read menu-media lifecycle enough to identify the external-media offline boundary.
- Checked current Web App Manifest and Service Worker platform guidance/specifications before finalizing the v1.2 design.
- Created development branch `agent/v1.2-installable-offline-r1` from current main.

## Next legal action

Continue source-level inspection of install/update safe-boundary hooks and test infrastructure, then implement the first coherent v1.2 runtime plus its single-owner offline/cache contracts. Run deterministic contracts before browser validation; classify failures before changing production code; never weaken an existing gate merely to obtain green CI.

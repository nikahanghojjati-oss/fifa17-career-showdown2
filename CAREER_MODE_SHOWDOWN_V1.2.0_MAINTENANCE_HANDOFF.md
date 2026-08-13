# Career Mode Showdown — v1.2.0 Maintenance Handoff

Last updated: 2026-08-13 ET
Release: `v1.2.0`
Runtime asset revision: `1.2.0-r1`
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Canonical implementation PR: #34
Production runtime merge SHA: `e5acd4ae524f181242df3114b35fd2e812cd8f3b`
GitHub Pages deployment: `5891182853`
Production Stability: `31716787806`
Deployed-site-smoke job: `94503946791`
Release Integration Burn-In: `31716787876` — 2/2

## Owner instruction preserved

Continue the existing project deeply rather than restarting or redesigning it. Preserve working functions, accepted visuals, data-safety boundaries and meaningful gates. Investigate testing failures before changing production code. Make testing smarter rather than weaker. Investigate missing, conflicting or erroneous information. Perform substantial maintenance and bug fixing with high attention to coherence, responsiveness, visual quality and maintainability.

The owner also asked whether development can continue after the browser closes. It cannot. Work does not continue asynchronously or in the background. Continuity must therefore live in repository handoff evidence such as this file.

This file remains a continuous maintenance record under `00_HANDOFF_GOLDEN_RULE.md`.

## Current release truth

v1.2.0 Installable Offline App is merged, deployed and technically production-proven.

Technical proof does not fabricate a separate owner visual-acceptance statement.

The frozen candidate passed all 13 normal PR workflow families together before merge. After merge, GitHub Pages served exact runtime bytes from `e5acd4ae524f181242df3114b35fd2e812cd8f3b`; deployed Stability then passed provenance, Home visuals, crop-safe licensed football visuals, Candidate A/B/C, install/offline behavior and the complete public journey. Release Integration Burn-In passed two complete stateful journeys.

## Protected systems

Do not alter without explicit owner direction or a reproducible defect:

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
- `js/storageTransaction.js` as raw transaction engine;
- Candidate A non-mutating backup format v1;
- Candidate B strictly read-only analysis;
- Candidate C immutable confirmed intent, strict exact raw snapshot, last-moment prewrite checks, complete in-memory planning, transaction-owned mutation/rollback, byte-for-byte verification and anti-clobber semantics;
- protected Marco Reus and accepted football-photo presentation;
- protected startup budgets;
- local-first operation;
- v1.2 whole-runtime cache identity and safe update activation.

## v1.2 architecture authority

The application shell is owned by `1.2.0-r1`. Service Worker installation fully populates and verifies the required first-party shell. An incomplete new cache is deleted and cannot replace the active known-good runtime. Install does not call `skipWaiting()` automatically.

A waiting worker surfaces Update Ready. The page may request activation only from Home or Showdown Home and only when Candidate C transaction/recovery busy state and other critical state are clear. The worker verifies the complete candidate cache again before activation. The page reloads only after the requested controller change.

Navigation selects one whole coherent cache revision. It never borrows individual files from another revision. Current and previous known-good shells are separately verified. Cleanup is restricted to this application's cache namespaces and unrelated caches remain untouched. Cache Storage holds application bytes only and never becomes canonical user-data authority.

Connectivity is not trusted from `navigator.onLine` alone. The active worker performs an uncached same-origin probe and returns the result through `MessageChannel`. Offline mode keeps the local tracker usable and explicitly disables/explains unavailable YouTube media.

The PWA controller and stylesheet remain lazy so eager startup stays under the protected ceilings.

## Testing architecture and lessons

There remain 14 permanent workflow families and 27 protected multiline executable blocks.

- Candidate B owns one import-analysis browser proof;
- Candidate C owns one restore/recovery browser proof;
- local Stability owns runtime provenance, one offline/cache lifecycle proof and one complete integration journey;
- deployed Stability owns the exhaustive public boundary;
- Release Integration Burn-In runs two complete stateful journeys on main/manual release use;
- Markdown-only release seals skip heavy browser lanes;
- reruns/manual dispatches do not cancel useful active proof.

Do not recreate a parallel PWA workflow family or duplicate specialist matrices.

Important defects/lessons discovered during v1.2:

1. Initial PWA logic exceeded eager startup budgets. The correct fix was architectural laziness, not a higher budget.
2. The initial 512 install SVG inherited 192 dimensions and was corrected.
3. The install rail overlapped the existing runtime-notice dismiss control; critical runtime notices retain higher interaction authority.
4. `navigator.onLine` was insufficient for true reachability, so connectivity became worker-verified.
5. An expected page-level probe failure polluted the generic first-party request monitor, so probing moved into the Service Worker while the monitor stayed strict.
6. Smart Back evidence initially targeted a marker rather than the real `.backButton` delegation authority; the lazy control gained only the shared semantic marker, not a competing listener.
7. Sparticuz Chromium `--single-process` prevented the synthetic second lifecycle context; only the offline lifecycle audit removes that flag.
8. Missing downstream Stability artifacts used to create a second unrelated error after an earlier assertion; artifact absence now warns rather than masking the root failure.
9. Release-authority contracts initially conflated PR candidate status with deployed production. Candidate-vs-production publication semantics were made explicit.
10. A manual package-lock version edit dropped one character from the `bare-path@3.1.1` integrity checksum. Four workflows failed at `npm ci` before tests. The known-good dependency graph was restored instead of treating it as a product regression. Future version freezes must not hand-copy integrity hashes.

## Production evidence

Pre-merge frozen candidate code SHA: `db0fcc49858db5555fa60dbd42d0dd8082069ee2`.

All 13 normal PR workflow families passed together before merge.

Production merge: `e5acd4ae524f181242df3114b35fd2e812cd8f3b`.
Pages deployment: `5891182853`.
Pages run: `31716786499`.
Stability: `31716787806`, attempt 1.
Local Chromium Stability job: `94503496610` — canonical runtime, offline lifecycle and complete integration journey passed.
Deployed smoke: `94503946791` — every runtime byte, runtime provenance, Home visual audit, football crop audit, Candidate A, Candidate B, Candidate C, install/offline audit and complete deployed journey passed.
Burn-In: `31716787876`.
Burn-In pass 1: `94503420385` — passed.
Burn-In pass 2: `94503420339` — passed.

Dynamic release budgets: 164,563 eager raw bytes / 37,355 eager gzip bytes.

## 2026-08-13 continuation chronology

- Resumed from the interrupted release-freeze stage.
- Rechecked source of truth and discovered that an earlier assistant conclusion claiming PR #34 had already merged was false: `main` was still the v1.1.5 handoff commit and PR #34 remained open/draft.
- Reverified the current PR head and confirmed all 13 PR workflow families were green together.
- Marked PR #34 ready and merged it through the normal GitHub merge endpoint with expected head SHA protection.
- Verified actual `main` advanced to `e5acd4ae524f181242df3114b35fd2e812cd8f3b`.
- Verified Pages deployment `5891182853` completed successfully for that exact SHA.
- Verified both Release Integration Burn-In complete stateful journeys passed.
- Verified deployed Stability exact-byte matching, provenance, Home, licensed visuals, Candidate A/B/C, install/offline behavior and the complete public journey all passed.
- Opened production-seal branch `agent/v1.2-production-seal` from the immutable runtime merge so documentation can advance without changing runtime bytes.
- During staging, two temporary marker files were accidentally created on the isolated seal branch. One was removed immediately; the remaining `NOOP.txt` is scheduled for deletion in the final seal tree and must not enter the PR result.
- Audited current-facing roadmap authority and found a real conflict: `PROJECT_STATE.md`, `NEXT_TASK.md` and this later maintenance handoff reserve v1.3.0 for Recovery & Device Resilience Hardening, while the older execution roadmap labels v1.3.0 as Local Profiles and Save Library.
- Applied authority hierarchy: the later current-facing v1.3 hardening decision wins. Local Profiles remains future planned work, but its new version assignment is deliberately left pending instead of silently renumbering future releases.

## v1.3 maintenance direction

Next legal substantive milestone: v1.3.0 — Recovery & Device Resilience Hardening.

Perform a maintenance-first audit across:

- browser close/reopen and lifecycle interruption;
- Service Worker install/update/controller churn;
- failed cache population and corruption recovery;
- exact three-key localStorage preservation;
- blocked reads/writes, quota and corrupt raw data;
- Candidate C interruption, stale state, ownership uncertainty and rollback verification;
- runtime notice / install / offline UI layering and focus;
- Smart Back and lazy listener ownership;
- Chromebook low-height, mobile, DPR2, touch, keyboard and reduced motion;
- external-media offline/online transitions;
- dependency-lock integrity;
- workflow ownership/cancellation/artifact semantics;
- release/version/revision and handoff coherence;
- performance headroom without raising protected ceilings.

Fix only evidence-backed defects. Preserve working functions and accepted visuals. Add focused regression ownership for every real defect.

Cloud, accounts, QR pairing, two-device transport, gameplay changes and a framework rewrite remain out of scope.

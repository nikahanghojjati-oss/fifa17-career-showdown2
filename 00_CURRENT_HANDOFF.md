# Career Mode Showdown — Current Complete Handoff

Last updated: 2026-08-13 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
Current application: v1.2.0 — Installable Offline App
Runtime revision: `1.2.0-r1`
Technical status: merged, deployed, exact-byte verified and production-proven
Immutable runtime merge SHA: `e5acd4ae524f181242df3114b35fd2e812cd8f3b`
GitHub Pages deployment: `5891182853`
Production Stability: `31716787806` / deployed smoke `94503946791`
Release Integration Burn-In: `31716787876` — 2/2
Next legal milestone: v1.3.0 — Recovery & Device Resilience Hardening

This is the active continuation handoff required by `00_HANDOFF_GOLDEN_RULE.md`. Current verified source, explicit later owner decisions, `PROJECT_STATE.md` and `NEXT_TASK.md` outrank stale historical prose.

## Owner direction

Continue the existing project deeply. Preserve working functions, accepted visuals, gameplay rules, data safety, navigation and meaningful test gates. Investigate failures before modifying production code. Make testing smarter rather than weaker. Perform substantial maintenance and bug fixing, investigate conflicting/missing/error information, and keep repository handoff evidence current.

Development cannot continue asynchronously after the browser/session closes. Repository handoffs are therefore the continuity mechanism.

## Current release authority

v1.2.0 / `1.2.0-r1` is technically production-proven from runtime merge `e5acd4ae524f181242df3114b35fd2e812cd8f3b`.

Production evidence:

- GitHub Pages deployment `5891182853` / Pages run `31716786499`;
- Stability run `31716787806`;
- deployed-site-smoke job `94503946791`;
- Release Integration Burn-In `31716787876`, both complete stateful journeys passed.

Deployed Stability verified every runtime byte, runtime-error provenance, Home visual presentation, crop-safe licensed football visuals, Candidate A export, Candidate B analysis, Candidate C atomic restore/recovery, install/offline behavior and the complete public journey.

Technical proof is not a fabricated owner visual acceptance statement.

Historical rollback baseline v1.1.5 / `1.1.5-r1` remains immutable at `ff755a9863abc843ae9aac45178428e3a104fc65`.

## Locked product model

- exactly two managers;
- one local browser/device and one active Showdown;
- manual FIFA 17 result entry;
- same selected league, different permanent clubs;
- Showdown lengths `[1,3,5,10]`;
- Champions League +5, domestic League +3, main domestic Cup +1;
- 100 League Points and/or Goals share maximum +1;
- Top Scorer and/or Top Assist share maximum +1;
- maximum Season score 11;
- equal non-zero scores are Draw;
- only 0–0 uses league position then league points.

Do not change these rules during v1.3 maintenance hardening.

## Architecture authority

- navigation/history/Smart Back: `js/screens.js`;
- canonical persistence/destructive mutation: `js/storage.js`;
- raw storage transaction engine: `js/storageTransaction.js`;
- scoring: `js/scoring.js`;
- analytics: `js/analytics.js`;
- Service Worker / Cache Storage: versioned application bytes only, never canonical user data.

Exactly three canonical localStorage keys:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Candidate A remains non-mutating export. Candidate B remains strictly read-only analysis. Candidate C preserves immutable confirmed intent, strict exact raw snapshot, last-moment prewrite checks, complete in-memory planning, transaction-owned mutation/rollback, anti-clobber semantics, post-write verification, byte-for-byte rollback verification, corrupt-byte preservation and critical recovery on uncertainty.

## v1.2 Installable Offline App locks

- `1.2.0-r1` owns one coherent application shell;
- incomplete cache population cannot replace known-good runtime;
- no automatic install-time activation;
- Update Ready activation is explicit and limited to safe Home / Showdown Home boundaries;
- Candidate C transaction/recovery busy state blocks unsafe activation;
- navigation chooses one whole verified cache revision and never mixes files across revisions;
- previous-known-good recovery is supported;
- cleanup is limited to this app's cache namespaces;
- unrelated caches remain intact;
- worker-owned connectivity verification replaces blind reliance on `navigator.onLine`;
- external YouTube media degrades explicitly offline;
- offline UI/controller remain lazy to preserve startup budgets.

## Permanent validation topology

There remain 14 permanent workflow families and 27 protected multiline executable blocks.

Candidate B owns one import-analysis browser proof. Candidate C owns one restore/recovery proof. Local Stability owns provenance, offline lifecycle and one complete journey. Deployed Stability owns exact bytes plus the exhaustive public boundary. Release Integration Burn-In repeats only the complete stateful journey twice. Markdown-only seals skip heavy browser lanes.

Never weaken a gate or duplicate a matrix merely to obtain green CI.

## Performance locks

- eager raw: 165,000 bytes max;
- eager gzip: 37,500 bytes max;
- Reus startup portrait: 95,000 bytes max;
- combined first-party startup: 260,000 bytes max;
- normal loading minimum: 2700 ms;
- reduced-motion loading: 220 ms.

v1.2 frozen candidate measured 164,563 raw / 37,355 gzip eager code bytes.

## Important release/development lessons

- classify infrastructure failures before touching product code;
- never hand-copy package-lock integrity hashes during a version freeze;
- `navigator.onLine` is not authoritative reachability evidence;
- expected reachability failures belong behind the worker message boundary, not the generic page request monitor;
- Service Worker updates must not interrupt Candidate C or another critical state transition;
- whole-runtime cache recovery is safer than per-file fallback across revisions;
- critical runtime notices must remain interactable above install/offline chrome;
- semantic Smart Back markers must not create a second navigation listener;
- owner visual acceptance remains distinct from decode/license/automated crop gates;
- current authority documents must distinguish candidate, deployed production and historical rollback states.

## Roadmap conflict resolved

A stale conflict was found during the v1.2 production seal. The older execution roadmap assigns v1.3.0 directly to Local Profiles and Save Library, while later current-facing `PROJECT_STATE.md`, `NEXT_TASK.md` and the v1.2 maintenance handoff reserve v1.3.0 for Recovery & Device Resilience Hardening.

The later current-facing decision wins. Local Profiles / Save Library remains future planned work but its version assignment is deliberately pending after v1.3. Do not silently renumber the long-term roadmap or start profiles during hardening.

## Immediate maintenance work

v1.3.0 Recovery & Device Resilience Hardening should audit:

- browser close/reopen, reload and controller-change interruption;
- cache population/activation/corruption and known-good recovery;
- exact three-key localStorage preservation;
- storage quota/read/write/corrupt-data failures;
- Candidate C stale-state, ownership uncertainty and rollback verification;
- runtime/install/offline UI layering, focus, keyboard/touch and reduced motion;
- Smart Back and lazy listener ownership;
- Chromebook low-height/mobile/DPR2/accessibility behavior;
- external-media online/offline transitions;
- dependency-lock integrity;
- CI cancellation/artifact/owner semantics;
- version/revision/release/handoff coherence;
- performance headroom without raising limits.

Fix only evidence-backed defects and add focused regression proof. Preserve all working functions and accepted visuals.

Cloud, accounts, QR pairing, two-device state transport, gameplay changes and framework rewrites remain out of scope.

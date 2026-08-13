# PROJECT STATE — Career Mode Showdown

Last updated: 2026-08-13

## Authority / continuation rule

v1.1.5 remains the last merged, deployed and independently production-proven application runtime. Candidate A/B/C are closed and protected.

v1.2.0 Installable Offline App is the current release candidate. It is not production-proven until it merges to `main`, GitHub Pages serves byte-coherent `1.2.0-r1`, and the deployed Stability boundary passes.

Authority when sources disagree:

1. current release-candidate source for v1.2 implementation;
2. current `main` source for production implementation;
3. explicit later owner decisions;
4. `PROJECT_STATE.md`;
5. `NEXT_TASK.md`;
6. current handoff/release records;
7. roadmap/amendments;
8. older historical documents/conversations.

Never revert verified source to satisfy stale documentation. Correct the document. Never call a release candidate production-proven before deployed proof exists.

## Current implementation

Application version: v1.2.0 — Installable Offline App release candidate
Runtime asset revision: `1.2.0-r1`
Hosting target: GitHub Pages
Technology: static HTML + CSS + vanilla JavaScript + browser localStorage + first-party Service Worker / Cache Storage shell
Product mode: exactly two managers, one local device/browser, one active Showdown
Last production-proven application: v1.1.5 / `1.1.5-r1`
Immutable v1.1.5 runtime authority: `ff755a9863abc843ae9aac45178428e3a104fc65`
Protected visual surface: Marco Reus Home/loading presentation and accepted route-scoped licensed football visuals
Cloud status: future architecture/security contract only; no backend/network state mutation authorized
Current milestone: finish and deploy v1.2.0 — Installable Offline App
Next roadmap milestone after deployed v1.2 closure: v1.3.0 — Recovery & Device Resilience Hardening

## v1.2.0 implemented scope

The release candidate adds:

- Web App Manifest and original Showdown 17 install artwork;
- a version-owned first-party application-shell cache;
- atomic worker install that discards an incomplete new cache;
- no automatic activation during install;
- explicit Update Ready activation from safe Home / Showdown Home boundaries;
- Candidate C transaction/recovery busy-state protection around update activation;
- whole-runtime navigation selection so revisions never mix per file;
- current/previous known-good cache verification and explicit recovery support;
- cleanup restricted to this application's cache namespaces;
- worker-owned verified connectivity instead of trusting `navigator.onLine` alone;
- explicit offline YouTube degradation while the local tracker remains usable;
- ChromeOS/Android install guidance and browser fallback guidance;
- lazy offline UI/controller so protected eager startup budgets remain unchanged;
- one local and one deployed offline browser evidence owner inside Stability;
- fast static PWA contracts without adding another workflow family.

## v1.2.0 functional proof before identity freeze

A fully integrated functional prototype passed all 13 normal PR workflow families, including Candidate C and Stability.

The canonical Stability offline owner proved first online install, manifest fetchability, cache/page identity, installed offline boot, byte-for-byte preservation of all three canonical raw values, external-media degradation, optional Candidate A/B/C loading without mutation, repeat online recovery, failed population preserving the known-good worker, explicit waiting/activation, unrelated-cache preservation, and two separate cache-corruption upgrade/recovery cycles. A fresh offline page then selected the known-good shell deterministically.

The same Stability owner completed the normal 70-checkpoint / 36-axe-scan integration journey.

## Release-candidate gate status

The `1.2.0-r1` release identity is frozen for final validation. Dynamic static release contracts already accepted v1.2.0 / `1.2.0-r1`, scoring/navigation/storage authority, 98-club identity, historical release protection and startup budgets at 164,563 raw bytes / 37,355 gzip bytes.

The first frozen-candidate pass stopped because this authority document still declared v1.1.5. That was documentation drift, not a runtime regression. Authority files are being advanced before the final full PR pass.

## Protected product rules

v1.2.0 changes no gameplay rule:

- exactly two managers;
- Showdown lengths `[1,3,5,10]`;
- same selected league and different permanent clubs;
- maximum season score 11;
- equal non-zero scores remain a draw;
- only 0–0 uses league position then league points;
- League and Club confirmation checkpoints remain mandatory;
- Transfer Challenge and Season Review state machines remain authoritative.

Scoring remains Champions League +5, domestic league +3, main domestic cup +1, one shared +1 for 100 league points/goals, and one shared +1 for Top Scorer/Top Assist.

## Candidate A / B / C authority

Candidate A remains non-mutating export with backup format v1 and raw-byte preservation.

Candidate B remains strictly read-only analysis with validation, deterministic migration preview, conflict preview and zero canonical writes/removals.

Candidate C remains the only import stage allowed to commit canonical state. Immutable confirmed intent, exact raw planning/prewrite checks, transaction-owned mutation/rollback, anti-clobber semantics, byte-for-byte rollback verification, critical recovery on uncertainty, idempotent repeated restore and `js/storage.js` authority remain protected.

## Persistence and navigation authority

Exactly three canonical localStorage keys remain legal:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

`js/storage.js` remains sole persistence/destructive mutation authority. `js/storageTransaction.js` remains its raw transaction engine. Cache Storage contains application bytes only and is never a user-data authority.

`js/screens.js` remains sole route/history/Smart Back authority. Lazy screens may share semantic back markers but may not create a competing navigation state machine or duplicate listener.

## CI / testing authority

There remain 14 permanent workflow families and 27 protected multiline executable blocks. Normal PRs exercise 13 families because Release Integration Burn-In is main/manual only.

- specialists own specialist evidence once;
- Candidate B owns one import-analysis browser execution;
- Candidate C owns one restore/recovery browser execution;
- local Stability owns provenance, offline/cache lifecycle and one complete integration journey;
- deployed Stability owns exact bytes, provenance, Home, visuals, Candidate A/B/C, install/offline behavior and the complete public journey;
- Release Integration Burn-In repeats only the complete stateful journey twice;
- Markdown-only seals skip heavy browser lanes;
- reruns/manual dispatches do not cancel useful active proof.

Do not duplicate evidence or weaken assertions to obtain green CI. Diagnose product failures separately from browser/test-runtime failures. Owner visual acceptance remains distinct from technical image gates.

## Performance locks

- eager raw code ceiling: 165,000 bytes;
- eager gzip ceiling: 37,500 bytes;
- startup Marco Reus portrait ceiling: 95,000 bytes;
- combined first-party startup ceiling: 260,000 bytes;
- normal loading minimum: 2700 ms;
- reduced-motion startup: 220 ms.

## v1.1.5 immutable production proof

v1.1.5 remains production authority until v1.2 deployed proof completes.

Immutable runtime: `ff755a9863abc843ae9aac45178428e3a104fc65`.
Proven runtime Pages deployment: `5878930362`.
Production proof 1: Stability `31650134707` attempt 1 / deployed smoke `94293855547`.
Production proof 2: Stability `31651830554` / deployed smoke `94297967413`.
Focused Release Integration Burn-In: `31651830507` — 2/2.

## Immediate legal action

Finish v1.2.0 authority coherence, obtain one complete green normal PR matrix on the frozen candidate, merge through the protected path, then require deployed GitHub Pages Stability proof before calling v1.2.0 production-proven.

Do not begin v1.3.0 until that deployment proof and post-merge release seal are complete.
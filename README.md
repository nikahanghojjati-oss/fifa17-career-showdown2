# Career Mode Showdown

A lightweight two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript, browser localStorage and a first-party install/offline shell.

Application version: v1.2.0 — Installable Offline App
Runtime asset revision: `1.2.0-r1`
Release status: merged, deployed, exact-byte verified and technically production-proven
Immutable runtime merge SHA: `e5acd4ae524f181242df3114b35fd2e812cd8f3b`
Proven runtime Pages deployment: `5891182853`
Production Stability: `31716787806` / deployed smoke `94503946791`
Release Integration Burn-In: `31716787876` — 2/2
Current developer entry: `00_DEVELOPER_START_HERE.md`
Current release handoff: `CAREER_MODE_SHOWDOWN_V1.2.0_MAINTENANCE_HANDOFF.md`
Future cloud contract: `CLOUD_STORAGE_FOUNDATION.md` — architecture/security groundwork only, no cloud runtime
Next substantive milestone: v1.3.0 — Recovery & Device Resilience Hardening

The immutable v1.2 runtime is the merged application revision above. Later documentation/test-only commits may advance `main` and Pages without redefining the application runtime. Read GitHub for the mutable repository head when needed.

Technical production proof is not a substitute for a separate owner visual-acceptance statement; none is fabricated here.

## Development entry point

v1.2.0 is technically closed. Read in this order:

1. `00_HANDOFF_GOLDEN_RULE.md`
2. `00_DEVELOPER_START_HERE.md`
3. `00_CURRENT_HANDOFF.md`
4. `NEXT_TASK.md`
5. `PROJECT_STATE.md`
6. `RELEASE_V1.2.0.md`
7. `CAREER_MODE_SHOWDOWN_V1.2.0_MAINTENANCE_HANDOFF.md`
8. `POST_V1_ROADMAP_EXECUTION.md`
9. `CLOUD_STORAGE_FOUNDATION.md` only when future sync/security work is relevant

Current verified source wins over stale historical status prose. Do not revert working code merely to satisfy an older document.

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

## Data safety and recovery

Candidate A remains non-mutating export. SHA-256 is integrity/corruption evidence only; it is not encryption, signing, authentication or authorization.

Candidate B remains strictly read-only import analysis. Preview is evidence, never write authority.

Candidate C is the only import stage permitted to commit canonical state. The protected transaction freezes the exact confirmed File/choices and reviewed raw precondition, reruns validation, captures a strict exact raw snapshot, rejects stale reviewed state, computes the final candidate in memory, enters `js/storage.js` with exact planning bytes as a transaction precondition, rechecks bytes immediately before mutation, writes deterministic active → Legacy → preferences order, grants mutation ownership only after successful writes, verifies committed bytes, rolls back only transaction-owned mutations in reverse order, refuses to clobber newer/unowned bytes, verifies owned rollback byte-for-byte, locks critical recovery on uncertainty, preserves corrupt raw bytes unless explicitly replaced, and keeps repeated identical restore a deterministic zero-write no-op.

Recovery UX distinguishes `RESTORE NOT STARTED`, `RESTORE ROLLED BACK`, and `CRITICAL RECOVERY STATE`.

Canonical localStorage keys remain exactly:

- `careerModeShowdown.activeShowdown`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

`js/storage.js` remains sole persistence/destructive mutation authority. `js/storageTransaction.js` remains the raw transaction engine behind it.

## Installable Offline App

v1.2.0 adds:

- a Web App Manifest and original install artwork;
- a version-owned `1.2.0-r1` application shell;
- atomic cache population and verification;
- no automatic install-time activation;
- explicit Update Ready activation at safe Home / Showdown Home boundaries;
- Candidate C busy-state protection around activation;
- whole-runtime cache selection so incompatible revisions never mix per file;
- previous-known-good shell recovery after corruption;
- worker-owned connectivity verification instead of relying on `navigator.onLine` alone;
- explicit offline degradation for external YouTube media;
- Chromebook/Android install guidance and browser fallbacks;
- lazy offline UI/controller so eager startup budgets remain protected.

Cache Storage contains application bytes only. It is never canonical user-data storage.

## v1.2.0 production proof

Pre-merge, all 13 normal PR workflow families passed together on the frozen candidate.

After merge:

- GitHub Pages deployment `5891182853` deployed runtime merge `e5acd4ae524f181242df3114b35fd2e812cd8f3b`;
- Stability `31716787806` passed local contracts and the canonical Chromium runtime/offline lifecycle/complete journey;
- deployed smoke `94503946791` passed exact runtime bytes, provenance, Home, licensed visuals, Candidate A/B/C, install/offline behavior and the complete public journey;
- Release Integration Burn-In `31716787876` passed both complete stateful journeys.

The frozen candidate measured 164,563 eager raw bytes / 37,355 eager gzip bytes, below the protected 165,000 / 37,500 ceilings.

v1.1.5 / `1.1.5-r1` remains immutable historical rollback evidence at SHA `ff755a9863abc843ae9aac45178428e3a104fc65`.

## Smart validation ownership

- Candidate B owns one authoritative browser analysis per workflow attempt.
- Candidate C owns one authoritative restore/recovery browser audit per attempt.
- Local Stability owns runtime provenance, offline/cache lifecycle and one complete integration journey.
- Deployed Stability remains exhaustive across exact bytes, provenance, Home, licensed visuals, Candidate A/B/C, install/offline behavior and the complete journey.
- Release Integration Burn-In is main/manual release-only and repeats the complete stateful journey twice.
- Markdown-only seals skip heavy Candidate B/C/Stability/Burn-In lanes.
- Reruns/manual dispatches queue instead of cancelling useful active proof.
- Do not duplicate a specialist matrix merely to make a release look more tested.

There remain 14 permanent workflow families and 27 protected multiline executable blocks.

## Performance locks

- eager raw code ceiling: 165,000 bytes;
- eager gzip ceiling: 37,500 bytes;
- startup Marco Reus portrait ceiling: 95,000 bytes;
- combined first-party startup ceiling: 260,000 bytes;
- normal loading minimum: 2700 ms;
- reduced-motion startup: 220 ms.

Protected Marco Reus Home/loading presentation and accepted route-scoped licensed football photographs remain unchanged.

## Cloud boundary

`CLOUD_STORAGE_FOUNDATION.md` is future architecture contract only. v1.2.0 contains no cloud backend or cloud state-mutation path.

Future cloud work must preserve stable account/profile/save/device/installation identity, server-authoritative revisions, `baseRevision` compare-and-swap, explicit conflicts, tombstones/anti-resurrection, local-first opt-in privacy, export/delete/retention, TLS/authentication/server authorization, secure token handling, replay/idempotency protection, rate/schema/size limits, no privileged secret in static JS, no direct cloud-module localStorage access, and the same strict exact raw snapshot / transaction-owned rollback safety boundary for downloaded or conflict-resolved state.

## Next milestone

v1.3.0 — Recovery & Device Resilience Hardening.

This is a maintenance-first audit of browser/device lifecycle, Service Worker recovery, cache corruption, exact local data preservation, Candidate C interruption/ownership safety, Smart Back, accessibility/responsive behavior, dependency-lock integrity and release-authority coherence.

The older execution-roadmap label that assigned v1.3.0 directly to Local Profiles and Save Library is stale as a current task. Profile/save-library work remains future planned work and must receive an explicitly reconciled version assignment after v1.3 hardening.

# Career Mode Showdown

A lightweight two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript and browser localStorage.

Application version: `v1.1.5`
Runtime asset revision: `1.1.5-r1`
Production status: merged, deployed and twice-proven
Immutable v1.1.5 runtime authority: `ff755a9863abc843ae9aac45178428e3a104fc65`
GitHub Pages build: `1147995655`
Post-merge evidence: `CAREER_MODE_SHOWDOWN_V1.1.5_POST_MERGE.md`
Current developer entry: `00_DEVELOPER_START_HERE.md`
Current task: v1.2.0 — Installable Offline App
Future cloud contract: `CLOUD_STORAGE_FOUNDATION.md` — future architecture contract only, no current cloud runtime

## Development entry point

The project is already designed and implemented through v1.1.5. Do not restart Candidate A/B/C planning.

Read in this order:

1. `00_HANDOFF_GOLDEN_RULE.md`
2. `00_DEVELOPER_START_HERE.md`
3. `NEXT_TASK.md`
4. `PROJECT_STATE.md`
5. `CAREER_MODE_SHOWDOWN_V1.1.5_POST_MERGE.md`
6. current `main` source
7. the v1.2 section of `POST_V1_ROADMAP_EXECUTION.md`
8. `CLOUD_STORAGE_FOUNDATION.md` only when future sync constraints are relevant

## Current product model

Career Mode Showdown is a static single-browser rivalry companion for exactly two managers. Both managers play their own FIFA 17 Career Mode saves outside the website and manually enter results.

The current app remains local-first and uses exactly three canonical localStorage keys for active Showdown, Legacy and preferences.

## Locked competition rules

- exactly two managers;
- one device/browser and one active Showdown in the current product model;
- Showdown lengths 1, 3, 5 or 10 Seasons;
- one selected league per Showdown and two different permanent clubs;
- Champions League = 5 points;
- league title = 3 points;
- main domestic cup = 1 point;
- 100 league points and/or 100 league goals share one +1 performance point;
- Top Scorer and/or Top Assist share one +1 awards point;
- maximum Season score = 11;
- equal non-zero Season scores are a Draw;
- only a 0–0 score uses tiebreakers: better league position, then league points;
- League Wheel selection requires explicit Continue;
- assigned clubs require explicit rivalry confirmation before the Showdown starts.

## Architecture

`js/screens.js` remains route/history authority.

`js/storage.js` remains canonical persistence authority.

`js/scoring.js` remains scoring authority.

`js/analytics.js` remains derived analytics authority.

Heavy gameplay, analytics, Settings, football photography and Data Management engines remain lazy-loaded where practical.

No framework rewrite is authorized merely for modernization.

## Data Safety and Recovery

### Candidate A

Versioned, human-readable SHA-256-protected local backup export with zero canonical mutation. SHA-256 is integrity evidence, not encryption/authentication.

### Candidate B

Preview-only import analysis with size, format, checksum, schema, migration, hostile-data and conflict validation. Candidate B performs zero canonical writes/removals.

### Candidate C

Candidate C is the only import stage allowed to commit canonical local state.

The protected v1.1.5 restore model freezes exact confirmed file/choices/raw state, uses a strict exact raw snapshot that distinguishes absence from read failure, revalidates immediately before commit, computes the result in memory, applies last-moment raw-byte preconditions and writes active → Legacy → preferences under canonical storage authority.

On failure it rolls back only transaction-owned successful mutations in reverse order, refuses to clobber newer/unowned bytes and verifies owned rollback byte-for-byte. Critical ownership uncertainty locks recovery and invalidates uncertain runtime caches.

Repeated identical restore remains a zero-write no-op. Corrupt raw bytes remain preserved unless explicit replacement is selected.

## v1.1.5 release result

v1.1.5 fixes two confirmed Candidate C defects:

1. confirmed restore intent could previously change after user confirmation during asynchronous revalidation;
2. rollback could previously include planned keys the transaction had never successfully mutated.

The release was frozen at pre-merge SHA `97088274e1eac377927476b84c6090e7233e0997`, passed all 14 permanent workflow families twice, merged with expected-head protection and was deployed from immutable runtime SHA `ff755a9863abc843ae9aac45178428e3a104fc65`.

Production then passed the full 14-family proof twice, including Candidate C twice-browser recovery, Burn-In 5/5, Stability two-cycle Chromium, exact deployed-byte parity and the complete live public journey.

See `CAREER_MODE_SHOWDOWN_V1.1.5_POST_MERGE.md` for exact chronology and evidence.

## Stability proof scheduling remedy

A release-proof interruption was traced to GitHub Actions concurrency, not application instability. An older Stability re-run could cancel a newer same-ref proof because cancellation was unconditional.

Current main uses smart CI orchestration rather than duplicated full matrices. Fresh first-attempt automatic runs may replace stale same-lane work, but reruns/manual dispatches queue instead of cancelling active proof. Heavy Stability/Candidate B/C/Burn-In lanes ignore Markdown-only changes. Local Stability owns one canonical provenance + complete integration journey per attempt; Candidate B/C each run one authoritative browser audit per attempt; Release Burn-In is push/manual only with two focused complete integration passes.

`tests/contracts/ci-orchestration-contracts.cjs` permanently protects rerun safety, Markdown-only skips, deduplication, bounded timeouts and the full deployed production-smoke boundary.

## Visual and performance authority

The accepted Marco Reus loading/Home presentation remains protected.

The accepted licensed route-photo archive remains current, including James Rodríguez, Marcus Rashford and Anthony Martial and the additional route-scoped football photography.

Protected startup ceilings remain:

- 165,000 eager raw code bytes;
- 37,500 eager gzip code bytes;
- 95,000 startup Marco Reus portrait bytes;
- 260,000 combined first-party startup bytes.

Normal loading minimum remains 2700 ms and reduced-motion startup remains 220 ms.

## Next dependency boundary

v1.2.0 — Installable Offline App — is the next legal substantive milestone.

v1.2 must preserve the current local data-safety boundary while introducing manifest/service-worker/install/offline/update behavior.

Do not jump ahead to profiles/save registry, cloud/accounts, QR pairing, two-device play or public rankings. Follow `POST_V1_ROADMAP_EXECUTION.md` in order.

# PROJECT STATE — Career Mode Showdown

Last updated: 2026-08-12

## Authority / continuation rule

v1.1.5 Restore Transaction Safety Maintenance is complete, merged, deployed, and independently production-proven twice. Candidate A/B/C are closed and protected. The current legal substantive milestone is v1.2.0 Installable Offline App.

Do not reopen Candidate C, cloud implementation, profiles, or two-device work while beginning v1.2. Cloud remains future-contract-only.

Authority when sources disagree:

1. current source on `main`;
2. explicit later owner decisions;
3. `PROJECT_STATE.md`;
4. `NEXT_TASK.md`;
5. current post-merge/release handoffs;
6. roadmap/amendments;
7. older historical documents/conversations.

Never revert verified source merely to satisfy stale documentation. Correct the stale document. Never redefine the immutable application runtime merely because a later CI/docs-only main commit exists.

## Current implementation

Application version: v1.1.5 — Restore Transaction Safety Maintenance
Runtime asset revision: `1.1.5-r1`
Hosting: GitHub Pages
Technology: static HTML + CSS + vanilla JavaScript + browser localStorage
Product mode: exactly two managers, one local device/browser, one active Showdown
Immutable application runtime authority: `ff755a9863abc843ae9aac45178428e3a104fc65`
GitHub Pages deployment: `5878930362`
Current CI/docs main head: `0af73262fcc95fbd76ffe9a2f06d4b0dac911f62`
Production proof 1: Stability `31650134707` attempt 1 / deployed smoke `94293855547`
Production proof 2: Stability `31651830554` / deployed smoke `94297967413`
Focused Release Integration Burn-In: `31651830507` — 2/2
Protected visual surface: Marco Reus Home/loading presentation and accepted route-scoped licensed football visuals
Future cloud status: future architecture/security contract only; no backend/network mutation authorized
Next substantive milestone: v1.2.0 — Installable Offline App

The CI/docs head after the runtime changes only workflows/tests. Runtime authority remains `ff755a9863abc843ae9aac45178428e3a104fc65`.

## v1.1.5 maintenance changes

v1.1.5 changes no gameplay rule, scoring rule, manager count, league/club assignment rule, Transfer Challenge rule, Season Review calculation, statistics formula, backup format version, storage key, or accepted football-photo source.

It fixes two major restore defects and hardens Candidate C transaction semantics.

### Major fix 1 — immutable confirmed restore intent

Before v1.1.5, the user could confirm one restore plan and then mutate file/choice state while asynchronous fresh analysis was still running. The transaction could therefore consume decisions different from the ones visibly confirmed.

v1.1.5 now:

1. freezes the exact selected File before the first asynchronous Apply boundary;
2. deep-copies the exact confirmed active/Legacy/preferences/conflict choices;
3. deep-copies the reviewed raw-state precondition;
4. reruns Candidate B analysis against the exact confirmed File;
5. locks the file input, Review, all decision controls, and Apply while review/apply is in flight;
6. generation-binds file analysis so a stale completion cannot become current authority;
7. commits only the plan derived from frozen confirmed values.

### Major fix 2 — transaction-owned rollback

Before v1.1.5, rollback covered the whole planned affected-key set, including keys whose write never succeeded or was never reached. That created unnecessary writes, false critical recovery after a clean first-write failure, and future cross-context clobber risk.

v1.1.5 now:

1. checks an exact full raw transaction precondition when supplied;
2. performs an exact last-moment raw `prewrite` check before every mutation;
3. grants mutation ownership only after a write succeeds;
4. records `committedKeys` as the exact rollback-owned set;
5. rolls back only owned mutations, in reverse commit order;
6. performs zero rollback writes after a failed first write;
7. refuses to overwrite a third/newer value that the transaction cannot prove it owns;
8. verifies owned rollback byte-for-byte;
9. enters locked critical recovery and invalidates uncertain runtime caches when rollback/ownership cannot be proven.

## Candidate A / B / C authority

### Candidate A — Versioned Backup Envelope + Non-Mutating Export

- human-readable backup format v1;
- SHA-256 integrity/corruption evidence;
- active Showdown, Legacy, preferences, and recovery representation;
- malformed raw-byte preservation;
- zero canonical mutation;
- provenance uses current `APP_VERSION`, otherwise shell-derived semantic version, otherwise `unknown`.

### Candidate B — Import Analysis + Migration Preview

- strictly read-only;
- size/JSON/format/checksum/schema/hostile-input validation;
- supported deterministic migrations;
- current-state comparison and conflict preview;
- zero canonical localStorage writes/removals;
- preview is evidence, never write authority.

### Candidate C — Atomic Restore + Recovery UX

A legal restore preserves this sequence:

1. flush pending canonical writes;
2. freeze confirmed file, choices, and reviewed raw bytes;
3. freshly revalidate the exact confirmed backup;
4. capture a strict exact raw snapshot that differentiates key absence from storage read failure;
5. detect reviewed-state drift;
6. compute every final candidate value completely in memory;
7. require explicit active/Legacy/preferences/conflict decisions;
8. enter canonical storage with planning snapshot as transaction precondition;
9. recheck exact raw bytes immediately before every write;
10. commit deterministic active → Legacy → preferences order;
11. verify every committed value;
12. on failure, roll back only transaction-owned successful mutations in reverse order;
13. refuse to clobber newer/unowned bytes;
14. verify owned rollback byte-for-byte;
15. enter locked critical recovery if rollback/ownership is uncertain;
16. invalidate uncertain runtime caches after critical recovery;
17. synchronize runtime/navigation only after complete success;
18. keep repeated identical restore a deterministic zero-write no-op;
19. preserve corrupt raw bytes unless explicit replacement is selected;
20. keep all canonical mutation under `js/storage.js` authority.

Recovery UX distinguishes `RESTORE NOT STARTED`, `RESTORE ROLLED BACK`, and `CRITICAL RECOVERY STATE`.

## Current persistence model

Exactly three canonical localStorage keys exist:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Current Showdown schema version: 2.
Current preferences schema version: 2.

`js/storage.js` remains sole persistence/destructive mutation authority. `js/storageTransaction.js` remains its raw transaction engine.

## Release proof

Immutable runtime: `ff755a9863abc843ae9aac45178428e3a104fc65`.
Pages deployment: `5878930362`.

Production proof 1 used Stability `31650134707` attempt 1 and deployed smoke job `94293855547`; exact deployed bytes, provenance, Home/Reus, licensed visuals, Candidate A/B/C, and complete public journey all passed.

Production proof 2 used optimized Stability `31651830554` and deployed smoke job `94297967413`; the same exhaustive public boundary passed again. Focused Release Integration Burn-In `31651830507` passed 2/2.

## CI/release proof ownership

There remain 14 permanent workflow families and 27 protected executable `.yml` blocks. Normal PRs intentionally run 13 families because Release Integration Burn-In is main/manual only.

The old duplicated validation pattern is retired:

- Candidate B owns one import browser run per workflow attempt;
- Candidate C owns one restore/recovery browser run per workflow attempt;
- local Stability owns one runtime-provenance audit plus one complete integration journey;
- deployed Stability remains exhaustive across exact bytes, provenance, Home, licensed visuals, Candidate A/B/C, and complete journey;
- Release Integration Burn-In repeats the complete stateful journey twice;
- heavy Candidate B/C/Stability/Burn-In workflows ignore Markdown-only changes;
- rerun/manual attempts queue rather than cancelling active proofs;
- only fresh attempt-1 PR/push runs may replace stale work;
- do not rerun the whole permanent matrix for one interrupted owner job.

The historical local Stability browser step took about 6m47s. The optimized canonical step took about 1m11s. `tests/contracts/ci-orchestration-contracts.cjs` prevents regression to duplicate ownership.

## Performance and presentation locks

- eager raw code ceiling: 165,000 bytes;
- eager gzip ceiling: 37,500 bytes;
- startup Marco Reus portrait ceiling: 95,000 bytes;
- combined first-party startup ceiling: 260,000 bytes;
- normal loading minimum: 2700 ms;
- reduced-motion startup: 220 ms.

Protected Marco Reus Home/loading presentation and accepted route-scoped licensed football photographs remain unchanged.

## Future cloud foundation

`CLOUD_STORAGE_FOUNDATION.md` is future architecture/threat-model groundwork only. No cloud runtime is present.

Future implementation must preserve:

- distinct account/profile/save/device/installation/object identity;
- server-authoritative revision and `baseRevision` compare-and-swap;
- explicit conflicts instead of silent last-write-wins gameplay state;
- tombstones/deletion revisions and anti-resurrection;
- local-first opt-in privacy, minimization, export/delete, and retention;
- TLS, authentication, server-side authorization, least privilege, secure sessions/tokens, replay/idempotency protection, and rate/schema/size limits;
- no privileged secret in static client JS;
- no future cloud module calling localStorage directly;
- remote/conflict-resolved data entering through the same exact Candidate C local safety boundary.

## Next substantive milestone

v1.2.0 — Installable Offline App.

v1.2 must add install/offline/update capability without weakening runtime-revision integrity or local data safety. Service-worker cache activation must be atomic, stale revisions must not mix, external media must degrade safely offline, and update/rollback/cache-corruption scenarios require explicit tests.

Stable local profiles/save identity are v1.3. Cloud Readiness and Cloud Backup remain later dependency-ordered milestones.

## Current handoff authority

Read `CAREER_MODE_SHOWDOWN_V1.1.5_POST_MERGE.md` for the final release/CI root-cause and remedy record. `CAREER_MODE_SHOWDOWN_V1.1.5_MAINTENANCE_HANDOFF.md` remains historical development chronology.
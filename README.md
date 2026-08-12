# Career Mode Showdown

A lightweight two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript, and browser localStorage.

Application version: v1.1.5 — Restore Transaction Safety Maintenance
Runtime asset revision: `1.1.5-r1`
Release status: deployed and independently production-proven twice
Immutable application runtime authority: `ff755a9863abc843ae9aac45178428e3a104fc65`
GitHub Pages deployment: `5878930362`
Current CI/docs main head: `0af73262fcc95fbd76ffe9a2f06d4b0dac911f62` — CI/test maintenance only; application runtime unchanged
Current developer entry: `00_DEVELOPER_START_HERE.md`
Current release handoff: `CAREER_MODE_SHOWDOWN_V1.1.5_POST_MERGE.md`
Future cloud contract: `CLOUD_STORAGE_FOUNDATION.md` — future architecture/security groundwork only, no cloud runtime
Next substantive milestone: v1.2.0 — Installable Offline App

## Development entry point

v1.1.5 is closed. Do not restart Candidate C or v1.1.5 release closure. Read in this order:

1. `00_HANDOFF_GOLDEN_RULE.md`
2. `00_DEVELOPER_START_HERE.md`
3. `NEXT_TASK.md`
4. `CAREER_MODE_SHOWDOWN_V1.1.5_POST_MERGE.md`
5. `PROJECT_STATE.md`
6. `RELEASE_V1.1.5.md`
7. `POST_V1_ROADMAP_EXECUTION.md`
8. `CLOUD_STORAGE_FOUNDATION.md` when future sync/security work is relevant

`CAREER_MODE_SHOWDOWN_V1.1.5_MAINTENANCE_HANDOFF.md` remains detailed maintenance chronology. Its old pre-merge status statements are history, not current authority.

## Product model and locked rules

Career Mode Showdown is a rivalry companion, not a browser football simulator and not yet a cloud/account product.

Current product model remains:

- exactly two managers;
- one local browser/device and one active Showdown;
- both managers play separate FIFA 17 Career Mode saves outside the site;
- manual result entry;
- one selected league for both managers;
- different clubs, assigned once and permanent for the Showdown;
- 1 / 3 / 5 / 10 Season Showdowns;
- default five-league wheel: Premier League, LaLiga, Bundesliga, Serie A, Ligue 1;
- Champions League +5, domestic League +3, main domestic Cup +1;
- 100 league points and/or 100 league goals share one +1 performance bonus;
- Top Scorer and/or Top Assist share one +1 awards bonus;
- maximum Season score 11;
- equal non-zero scores are a Draw;
- only 0–0 uses league position then league points as tiebreakers.

## Data Safety and Recovery

### Candidate A — Versioned Backup Envelope + Non-Mutating Export

Candidate A remains non-mutating. It exports a human-readable format-v1 JSON backup containing active Showdown, Legacy, preferences, recovery information, and SHA-256 integrity evidence.

Malformed raw bytes are preserved. SHA-256 is corruption/integrity evidence only; it is not encryption, signing, authentication, or authorization.

v1.1.5 removed the old hardcoded v1.1.3 provenance fallback. Backup provenance uses current `APP_VERSION`, otherwise shell-derived semantic version, otherwise explicit `unknown`.

### Candidate B — Import Analysis + Migration Preview

Candidate B remains strictly read-only. It validates size, JSON, format, checksum, schema, hostile/future data, deterministic migrations, current-state comparison, and same-ID conflicts.

Candidate B performs zero canonical localStorage writes/removals. A preview is evidence, never write authority.

### Candidate C — Atomic Restore + Recovery UX

Candidate C is the only import stage permitted to commit canonical state after fresh verification and explicit user decisions.

The protected v1.1.5 transaction:

1. flushes pending canonical writes;
2. freezes the exact selected File, confirmed choices, and reviewed raw precondition before asynchronous revalidation;
3. freshly reruns Candidate B analysis against the exact confirmed File;
4. captures a strict exact raw snapshot that distinguishes true absence from storage-read failure;
5. detects reviewed-state drift before planning;
6. computes the complete final candidate in memory before mutation;
7. enters `js/storage.js` authority with exact planning bytes as a transaction precondition;
8. rechecks exact raw bytes immediately before every write;
9. commits in deterministic active → Legacy → preferences order;
10. grants mutation ownership only after a write succeeds;
11. verifies every committed value;
12. rolls back only transaction-owned successful mutations, in reverse order;
13. refuses to clobber a third/newer value it cannot prove it owns;
14. verifies owned rollback byte-for-byte;
15. enters locked critical recovery and invalidates uncertain caches if rollback/ownership cannot be proven;
16. synchronizes runtime/navigation only after complete success;
17. preserves corrupt raw bytes unless explicit replacement is chosen;
18. treats repeated identical restore as a deterministic zero-write no-op.

Recovery UX distinguishes:

- `RESTORE NOT STARTED` — no successful canonical mutation, so no rollback was required;
- `RESTORE ROLLED BACK` — transaction-owned mutations were restored and byte-verified;
- `CRITICAL RECOVERY STATE` — mutation ownership or rollback could not be proven; Candidate C controls lock until refresh.

## Canonical storage authority

The application still owns exactly three canonical localStorage keys:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

`js/storage.js` remains sole canonical persistence/destructive transaction authority. `js/storageTransaction.js` is the raw transaction engine behind it, not a competing storage owner.

Current Showdown schema: 2.
Current preferences schema: 2.

## Release proof

Immutable runtime: `ff755a9863abc843ae9aac45178428e3a104fc65`.
Pages deployment: `5878930362`.

Production proof 1:
- Stability `31650134707`, attempt 1;
- deployed smoke job `94293855547`;
- exact deployed bytes, provenance, Home/Reus, licensed visuals, Candidate A, Candidate B, Candidate C, and complete journey green.

Production proof 2:
- optimized Stability `31651830554`;
- deployed smoke job `94297967413`;
- the same exhaustive public boundary green again;
- focused Release Integration Burn-In `31651830507` green 2/2.

The later CI/test merge `0af73262fcc95fbd76ffe9a2f06d4b0dac911f62` changes no application/runtime/assets/data files, so it does not redefine immutable runtime authority.

## Smart CI ownership after v1.1.5

The old testing pattern duplicated long browser suites and created false backtracking when reruns cancelled newer Stability work. It has been removed.

Current ownership:

- Candidate B owns one authoritative import-analysis browser run per workflow attempt;
- Candidate C owns one authoritative restore/recovery browser run per workflow attempt;
- local Stability owns one runtime-provenance pass plus one complete integration journey;
- deployed Stability remains exhaustive: exact bytes + provenance + Home + licensed visuals + Candidate A/B/C + complete journey;
- Release Integration Burn-In is main/manual only and repeats the complete stateful integration journey twice;
- heavy Candidate B/C/Stability/Burn-In workflows ignore Markdown-only changes;
- reruns/manual dispatches queue rather than cancelling an active proof;
- fresh attempt-1 PR/push runs may cancel stale work;
- a second public proof should repeat the canonical deployed Stability boundary, not all unrelated specialist workflows.

Measured local Stability browser wall time improved from about 6m47s to about 1m11s. `tests/contracts/ci-orchestration-contracts.cjs` permanently rejects reintroduction of the old duplicate structure.

## Performance and presentation locks

Protected eager-code ceilings remain:

- 165,000 raw bytes;
- 37,500 gzip bytes;
- 95,000-byte startup Marco Reus portrait ceiling;
- 260,000 combined first-party startup bytes.

Normal loading remains 2700 ms and reduced-motion loading remains 220 ms.

The protected Marco Reus Home/loading presentation and accepted route-scoped licensed football photographs remain unchanged.

## Future cloud boundary

`CLOUD_STORAGE_FOUNDATION.md` is a future architecture contract only. v1.1.5 does not add cloud runtime.

Future cloud work must preserve distinct `accountId`, `profileId`, `saveId`, `deviceId`, `installationId`, server-authoritative revisions, `baseRevision` compare-and-swap, explicit conflicts, tombstones and anti-resurrection, local-first opt-in privacy, minimization/export/delete/retention, TLS, server-side authorization, least privilege, secure session/token handling, replay/idempotency protection, and rate/schema/size limits.

No future cloud module may call localStorage directly. Remote/conflict-resolved data must pass the same exact local snapshot/precondition/storage/verification/transaction-owned rollback boundary.

## Next milestone

v1.2.0 — Installable Offline App.

The next developer should focus on manifest/install metadata, service-worker versioning, atomic cache activation, update/recovery UX, offline behavior, and cache-corruption/rollback testing. Service-worker updates must never mix incompatible runtime revisions or weaken local recovery.

Stable local profiles/save identity are v1.3. Cloud readiness and cloud backup follow later in the approved dependency order.
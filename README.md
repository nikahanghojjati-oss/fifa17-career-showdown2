# Career Mode Showdown

A lightweight two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript, and browser localStorage.

Application version: v1.1.5 — Restore Transaction Safety Maintenance
Runtime asset revision: `1.1.5-r1`
Release status: deployed and independently production-proven twice
Immutable application runtime authority: `ff755a9863abc843ae9aac45178428e3a104fc65`
Proven runtime Pages deployment: `5878930362`
Current developer entry: `00_DEVELOPER_START_HERE.md`
Current release handoff: `CAREER_MODE_SHOWDOWN_V1.1.5_POST_MERGE.md`
Future cloud contract: `CLOUD_STORAGE_FOUNDATION.md` — future architecture/security groundwork only, no cloud runtime
Next substantive milestone: v1.2.0 — Installable Offline App

Repository `main` is intentionally not hardcoded here. Later CI/test/documentation-only commits may advance `main` and Pages without redefining the immutable v1.1.5 runtime. Read GitHub for the current repository head when needed.

## Development entry point

v1.1.5 is closed. Do not restart Candidate C or release closure. Read in this order:

1. `00_HANDOFF_GOLDEN_RULE.md`
2. `00_DEVELOPER_START_HERE.md`
3. `NEXT_TASK.md`
4. `CAREER_MODE_SHOWDOWN_V1.1.5_POST_MERGE.md`
5. `PROJECT_STATE.md`
6. `RELEASE_V1.1.5.md`
7. `POST_V1_ROADMAP_EXECUTION.md`
8. `CLOUD_STORAGE_FOUNDATION.md` only when future sync/security work is relevant

`CAREER_MODE_SHOWDOWN_V1.1.5_MAINTENANCE_HANDOFF.md` remains detailed development chronology. Pre-merge statements in it are history, not current authority.

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
- 100 league points and/or 100 league goals share one +1 performance bonus;
- Top Scorer and/or Top Assist share one +1 awards bonus;
- maximum Season score 11;
- equal non-zero scores are Draw;
- only 0–0 uses league position then league points as tiebreakers.

## Data safety and recovery

Candidate A remains non-mutating export. SHA-256 is integrity/corruption evidence only; it is not encryption, signing, authentication, or authorization.

Candidate B remains strictly read-only import analysis. Preview is evidence, never write authority.

Candidate C is the only import stage permitted to commit canonical state. The protected v1.1.5 transaction:

1. freezes the exact selected File, confirmed choices, and reviewed raw precondition before asynchronous revalidation;
2. freshly reruns Candidate B analysis against the confirmed File;
3. captures a strict exact raw snapshot that distinguishes true absence from storage-read failure;
4. rejects stale reviewed state;
5. computes every final candidate value completely in memory before mutation;
6. enters `js/storage.js` authority with exact planning bytes as transaction precondition;
7. rechecks exact raw bytes before each mutation;
8. writes deterministic active → Legacy → preferences order;
9. grants mutation ownership only after successful writes;
10. verifies every committed value;
11. on failure rolls back only transaction-owned mutations in reverse order;
12. refuses to clobber newer/unowned bytes;
13. verifies owned rollback byte-for-byte;
14. locks critical recovery and invalidates uncertain caches if ownership/rollback cannot be proven;
15. preserves corrupt raw bytes unless explicit replacement is selected;
16. keeps repeated identical restore a deterministic zero-write no-op.

Recovery UX distinguishes `RESTORE NOT STARTED`, `RESTORE ROLLED BACK`, and `CRITICAL RECOVERY STATE`.

Canonical localStorage keys remain exactly:

- `careerModeShowdown.activeShowdown`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

`js/storage.js` remains sole persistence/destructive mutation authority. `js/storageTransaction.js` is the raw transaction engine behind it.

## v1.1.5 proof

Immutable runtime: `ff755a9863abc843ae9aac45178428e3a104fc65`.

Production proof 1:

- Stability `31650134707`, attempt 1;
- deployed smoke `94293855547`;
- exact deployed bytes, runtime provenance, Home/Reus, licensed visuals, Candidate A, Candidate B, Candidate C, and the complete public journey passed.

Production proof 2:

- optimized Stability `31651830554`;
- deployed smoke `94297967413`;
- the same exhaustive public boundary passed again;
- focused Release Integration Burn-In `31651830507` passed 2/2.

CI-only orchestration checkpoint `0af73262fcc95fbd76ffe9a2f06d4b0dac911f62` is historical test infrastructure evidence, not application runtime authority.

## Smart validation ownership

The old duplicated validation loop is retired.

- Candidate B owns one authoritative browser analysis per workflow attempt.
- Candidate C owns one authoritative restore/recovery browser audit per attempt.
- Local Stability owns one runtime-provenance audit plus one complete integration journey.
- Deployed Stability remains exhaustive across exact bytes, provenance, Home, licensed visuals, Candidate A/B/C, and complete journey.
- Release Integration Burn-In is main/manual only and repeats the complete stateful journey twice.
- Heavy Candidate B/C/Stability/Burn-In workflows ignore Markdown-only changes.
- Reruns/manual dispatches queue instead of cancelling active proofs.
- Do not rerun every permanent workflow merely to duplicate one public proof.
- Do not poll long jobs every few seconds; record the run ID and inspect after realistic wall time or a real failure signal.

The old local Stability browser step took about 6m47s. The optimized canonical step took about 1m11s. `tests/contracts/ci-orchestration-contracts.cjs` protects the single-owner model.

## Performance locks

- eager raw code ceiling: 165,000 bytes;
- eager gzip ceiling: 37,500 bytes;
- startup Marco Reus portrait ceiling: 95,000 bytes;
- combined first-party startup ceiling: 260,000 bytes;
- normal loading minimum: 2700 ms;
- reduced-motion startup: 220 ms.

Protected Marco Reus Home/loading presentation and accepted route-scoped licensed football photographs remain unchanged.

## Cloud boundary

`CLOUD_STORAGE_FOUNDATION.md` is future architecture contract only. v1.1.5 contains no cloud backend or network mutation path.

Future cloud work must preserve distinct account/profile/save/device/installation identity, server-authoritative revisions, `baseRevision` compare-and-swap, explicit conflicts, tombstones/anti-resurrection, local-first opt-in privacy, export/delete/retention, TLS/authentication/server authorization/least privilege, secure token handling, replay/idempotency protection, rate/schema/size limits, no privileged secret in static JS, no direct cloud-module localStorage access, and the same Candidate C local safety boundary for downloaded/conflict-resolved state.

## Next milestone

v1.2.0 — Installable Offline App.

v1.2 must add install/offline/update capability without weakening runtime-revision integrity, startup budgets, navigation authority, gameplay/scoring rules, or local recovery safety.
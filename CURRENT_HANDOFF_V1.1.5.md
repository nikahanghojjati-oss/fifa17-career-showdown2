# Career Mode Showdown — Current Complete Handoff (v1.1.5)

Last updated: 2026-08-12 22:15 ET
Status: CURRENT PUBLIC HANDOFF — v1.1.5 CLOSED / DEPLOYED / PROVEN
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

## 1. Owner instruction at handoff time

The owner requested a complete public handoff based on the current situation and asked whether any urgent bug fix remained. The owner then clarified that, if any fix were required, it should be deployed as quickly as possible while keeping this edition at v1.1.5 if possible.

Current conclusion after a fresh production check and an open-defect search: **there is no known reproducible product bug requiring a runtime hotfix. Do not manufacture a speculative change to the stable runtime. Keep the edition at v1.1.5 unless a new reproducible defect is discovered.**

## 2. Current repository and runtime authority

Current repository `main` at the time this handoff branch was created:

`5a524573f625dcb624c4bf0d0d2eba4693665b84`

That mutable repository head is NOT the immutable application runtime authority.

Application version: `v1.1.5`
Runtime asset revision: `1.1.5-r1`
Immutable application runtime SHA:

`ff755a9863abc843ae9aac45178428e3a104fc65`

Proven runtime Pages deployment:

`5878930362`

Latest docs/main Pages deployment before this handoff:

`5880070883`

The later docs/CI heads do not redefine the application runtime because there are no application HTML/CSS/JS/data/assets/package runtime changes after `ff755a9863abc843ae9aac45178428e3a104fc65`.

## 3. Public deployment status

v1.1.5 is live on the public GitHub Pages site.

A fresh lean production gate was run after closure against the actual public URL. The deployed-site smoke rerun was:

- Stability run: `31651830554`
- run attempt: `2`
- deployed-site-smoke job: `94313847810`
- conclusion: SUCCESS

The deployment verifier reported:

`61 runtime files match 1.1.5-r1 byte for byte`

The same live job then passed:

1. runtime error provenance audit;
2. Home / Marco Reus visual audit;
3. 11-screen licensed football visual audit;
4. Candidate A backup export audit;
5. Candidate B read-only import analysis;
6. Candidate C atomic restore/recovery audit;
7. complete public gameplay/navigation journey.

The complete journey produced:

- 70 checkpoints;
- 36 accessibility scans;
- clean Chromebook coverage at 1366 × 768;
- clean mobile coverage at 390 × 844 DPR2;
- no application/runtime failure.

## 4. Current urgent bug status

**Urgent runtime bug fixes required: NONE KNOWN.**

A repository open-issue search for bug/defect/regression found no open reproducible product defect. The fresh public deployed gate also found no failing application behavior.

Do not alter the stable v1.1.5 runtime merely because a theoretical untested condition exists. A real hotfix requires a reproducible defect or a failing owner gate.

Residual risk that is NOT currently a known bug:

- native Safari/WebKit-specific behavior is not proven by the current Chromium production suite;
- unusual browser extensions/privacy modes may introduce environment-specific behavior;
- no test system can prove every possible malformed historical storage state.

These are coverage/residual-risk notes, not evidence of an urgent defect.

## 5. v1.1.5 purpose and major fixes

v1.1.5 is Restore Transaction Safety Maintenance. It changed no gameplay rule, scoring rule, manager count, league/club assignment rule, Transfer Challenge rule, statistics formula, backup format version, canonical storage key, or accepted visual source.

It closed two major Candidate C restore defects.

### Fix A — immutable confirmed restore intent

Before v1.1.5, a user could confirm one restore plan and mutate file/choice state while asynchronous fresh validation was still in progress. The transaction could consume values different from the visible confirmation.

v1.1.5 now freezes before the first async Apply boundary:

- exact selected File;
- deep-copied confirmed choices;
- reviewed raw-state precondition.

It fresh-validates only the exact confirmed File, locks the decision surface while in flight, generation-binds async analysis, and commits only frozen confirmed values.

### Fix B — transaction-owned rollback

The previous transaction could roll back the whole planned affected-key set, including keys whose write never succeeded. That could create unnecessary writes, false critical recovery after a clean first-write failure, and cross-context clobber risk.

v1.1.5 now uses:

- strict exact raw transaction precondition;
- exact pre-write byte check before every mutation;
- mutation ownership only after successful write;
- `committedKeys` as exact rollback-owned set;
- reverse-order rollback only for owned mutations;
- zero rollback writes after first-write failure;
- refusal to overwrite newer/unowned bytes;
- byte-for-byte rollback verification;
- critical recovery + cache invalidation when ownership/rollback cannot be proven.

## 6. Candidate A / B / C protected safety model

Candidate A is non-mutating backup/export.

Candidate B is strictly read-only analysis/migration/conflict preview. It has zero canonical write authority.

Candidate C is the only import stage allowed to commit canonical state.

A legal Candidate C Apply must preserve this sequence:

1. flush pending canonical writes;
2. freeze exact confirmed File, choices, reviewed raw bytes before async work;
3. fresh Candidate B revalidation of that exact File;
4. strict exact raw snapshot distinguishing absence from read failure;
5. reject reviewed-state drift;
6. compute complete final candidate in memory;
7. require explicit active/Legacy/preferences/conflict decisions;
8. enter `js/storage.js` authority with planning snapshot precondition;
9. recheck exact bytes immediately before each mutation;
10. deterministic active → Legacy → preferences commit order;
11. grant mutation ownership only after successful write;
12. verify every committed value;
13. rollback only transaction-owned mutations in reverse order;
14. refuse to overwrite newer/unowned bytes;
15. verify owned rollback byte-for-byte;
16. uncertain ownership/rollback => critical recovery + cache invalidation;
17. runtime/navigation sync only after complete verified success;
18. corrupt raw bytes preserved until explicit replacement;
19. repeated identical restore remains deterministic zero-write/no-op;
20. all canonical mutation stays under `js/storage.js` authority.

Recovery states remain intentionally distinct:

- `RESTORE NOT STARTED`
- `RESTORE ROLLED BACK`
- `CRITICAL RECOVERY STATE`

## 7. Locked product model

Career Mode Showdown is a two-manager FIFA 17 Career Mode rivalry companion, not a browser football simulator.

Locked rules:

- exactly two managers;
- one browser/device and one active Showdown;
- both managers play their own FIFA 17 Career Mode saves outside the site;
- manual result entry is authoritative;
- same selected league, different permanent clubs;
- Showdown lengths `[1,3,5,10]`;
- default leagues: Premier League, LaLiga, Bundesliga, Serie A, Ligue 1;
- Champions League winner +5;
- domestic league winner +3;
- main domestic cup winner +1;
- 100 league points and/or 100 league goals share max +1;
- top scorer and/or top assist share max +1;
- max Season score 11;
- equal non-zero scores are Draw;
- only 0–0 uses league position, then league points.

## 8. Architecture authority

Navigation/history authority: `js/screens.js`
Persistence/destructive mutation authority: `js/storage.js`
Raw transaction engine: `js/storageTransaction.js` behind storage authority
Scoring: `js/scoring.js`
Canonical Showdown model: `js/showdown.js`
Analytics: `js/analytics.js`

Exactly three canonical localStorage keys:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Current Showdown schema: 2
Current preferences schema: 2

## 9. Performance and visual locks

Protected startup ceilings:

- eager raw code: 165,000 bytes;
- eager gzip code: 37,500 bytes;
- startup Marco Reus portrait: 95,000 bytes;
- combined first-party startup: 260,000 bytes.

Loading timing locks:

- normal loading minimum: 2700 ms;
- reduced-motion loading: 220 ms.

Protected Marco Reus Home/loading presentation and accepted route-scoped licensed football photographs must remain unchanged unless the owner explicitly requests a visual change.

## 10. Lean / smart CI model

Do NOT recreate the old repeated test loop.

The historical problem was orchestration redundancy, not application instability. The old system duplicated long browser suites across Candidate B, Candidate C, Stability and a five-copy Burn-In matrix, and rerun concurrency could cancel newer evidence.

Current single-owner model:

- Candidate B owns one authoritative import-analysis browser run per workflow attempt;
- Candidate C owns one authoritative restore/recovery browser run per attempt;
- specialized visual/workstream workflows own specialized evidence;
- local Stability owns one runtime-provenance audit plus one complete integration journey;
- deployed Stability remains exhaustive: exact bytes + provenance + Home + visuals + Candidate A + Candidate B + Candidate C + full journey;
- Release Integration Burn-In is main/manual only and runs two repeated stateful complete journeys, not five full release matrices;
- Markdown-only seals skip heavy Candidate B/C/Stability/Burn-In lanes;
- fresh attempt-1 PR/push may cancel stale work;
- deliberate reruns/manual dispatches queue and must not cancel an active proof;
- never rerun the whole 14-family matrix merely to repeat one production proof;
- inspect `run_attempt` before calling a visually reset GitHub workflow a failure;
- do not poll long jobs every few seconds.

Measured improvement:

- old local Stability browser step ~6m47s;
- optimized canonical Stability ~1m11s;
- ~82% lower wall time for that job;
- affected normal-PR duplicated long-suite command invocations historically ~53 → now 4.

`tests/contracts/ci-orchestration-contracts.cjs` protects this architecture.

## 11. Release authority / historical discrepancy policy

Current-facing authority files have been reconciled so mutable current-main SHAs are not hardcoded as release truth.

Current-facing files include:

- `00_DEVELOPER_START_HERE.md`
- `NEXT_TASK.md`
- `PROJECT_STATE.md`
- `CAREER_MODE_SHOWDOWN_V1.1.5_POST_MERGE.md`
- `README.md`

Old v1.1.3/v1.1.4 references are allowed in historical release documents, old PR descriptions, maintenance chronology and defect archaeology where they accurately describe the past.

Historical material must NEVER outrank current source or current authority.

Authority order:

1. current source on `main`;
2. explicit later owner decisions;
3. `PROJECT_STATE.md`;
4. `NEXT_TASK.md`;
5. current post-merge/release handoffs;
6. roadmap/amendments;
7. older historical documents, PR prose and conversations.

Never revert verified code to satisfy stale prose. Correct stale prose instead.

## 12. Existing immutable release evidence

Application runtime:

`ff755a9863abc843ae9aac45178428e3a104fc65`

Production proof 1:

- Stability `31650134707`, attempt 1;
- deployed smoke `94293855547`;
- exact runtime bytes, provenance, Home/Reus, licensed visuals, Candidate A/B/C and complete journey all passed.

Production proof 2 after CI orchestration optimization:

- Stability `31651830554`;
- deployed smoke `94297967413`;
- same exhaustive public boundary passed;
- focused Release Integration Burn-In `31651830507` passed 2/2.

Fresh post-closure lean public check:

- Stability `31651830554`, rerun attempt 2;
- deployed smoke `94313847810`;
- exact 61 runtime-file byte parity to `1.1.5-r1`;
- all public specialist checks passed;
- complete journey passed with 70 checkpoints and 36 accessibility scans.

## 13. Security/tooling status

Fresh deployed-smoke setup reported `0 vulnerabilities` from npm audit during `npm ci`.

The only warnings observed were Node/GitHub-runner deprecation warnings involving `punycode` and legacy `url.parse()`. They originate from tooling/dependencies in the runner environment, not from Career Mode Showdown application runtime and are not product bugs.

## 14. Cloud boundary

`CLOUD_STORAGE_FOUNDATION.md` is future-only architecture/security contract. v1.1.5 contains no cloud backend, account requirement or network mutation.

Future implementation must preserve distinct identity (`accountId`, `profileId`, `saveId`, `deviceId`, `installationId`), server-authoritative revisions, `baseRevision` compare-and-swap, explicit conflicts, tombstones/anti-resurrection, local-first opt-in privacy, export/delete/retention controls, secure authentication/authorization/session handling, replay/idempotency protection, limits, no privileged secret in static client JS, no cloud module calling localStorage directly, and Candidate C local safety for downloaded/conflict-resolved state.

Do not implement cloud during v1.2.

## 15. Next legal substantive milestone

v1.2.0 — Installable Offline App.

Do not begin v1.2 unless the owner explicitly authorizes moving beyond v1.1.5.

Expected v1.2 scope:

- web app manifest;
- original install metadata/icons;
- service worker for versioned first-party shell;
- atomic cache activation;
- visible Update Ready flow;
- offline status and graceful external-media absence;
- Chromebook/Android install behavior and browser-appropriate guidance elsewhere;
- first-load/repeat-load/offline/update/rollback/cache-corruption tests;
- two consecutive cache-revision upgrade/rollback proofs before release.

The service worker must never mix incompatible runtime revisions or weaken local recovery/data safety.

## 16. Current hotfix decision

At handoff creation time:

- v1.1.5 is live;
- latest live production gate is green;
- no open reproducible bug/defect/regression was found;
- no urgent runtime patch is justified;
- therefore the safest urgent action is to preserve the exact proven `1.1.5-r1` runtime and publish this current handoff/documentation state without changing edition identity.

If a new reproducible bug appears, fix it as a **v1.1.5 hotfix only if compatibility permits**, run only the workflow that owns the changed behavior plus the canonical deployed Stability proof, verify exact public runtime bytes, and record the fix/deployment here. Do not bump version merely for documentation or CI-only changes.

## 17. Tooling incident during this handoff session

Two temporary GitHub issues (#30 and #31) were accidentally created while switching connector actions. Both were immediately retitled as accidental tooling issues and closed as `not_planned`. They represent no product defect and caused no source/runtime change. This is recorded here rather than hidden, per `00_HANDOFF_GOLDEN_RULE.md`.

## 18. Exact next-developer orientation

A correctly oriented developer should be able to state:

`Career Mode Showdown v1.1.5 / 1.1.5-r1 is closed, live and strongly production-proven. The immutable application runtime is ff755a9863abc843ae9aac45178428e3a104fc65. Current main may advance through docs/CI-only commits without redefining runtime authority. Candidate A/B/C are complete. v1.1.5 fixed immutable confirmed restore intent and transaction-owned rollback. There is no known urgent runtime bug after the latest lean public gate. Do not manufacture a hotfix. Preserve the lean single-owner CI model. Cloud is future-only. The next substantive milestone is v1.2.0 Installable Offline App only when the owner explicitly authorizes it.`

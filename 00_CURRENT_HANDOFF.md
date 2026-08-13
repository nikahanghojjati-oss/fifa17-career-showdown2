# Career Mode Showdown — Current Complete Handoff

Last updated: 2026-08-12 21:33 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
Status: **v1.1.5 CLOSED, LIVE, PRODUCTION-PROVEN; no urgent bug fix currently required**

This is the active public continuation handoff required by `00_HANDOFF_GOLDEN_RULE.md`. It is intentionally current-facing and source-first. Historical files remain valuable evidence, but they do not override newer verified source, newer owner instructions, or this current state.

---

## 1. Owner instruction that created this handoff

The owner asked for a complete handoff document based on the current situation and asked whether any urgent bug fixes remain.

Current answer:

- **No urgent application bug is known at the time of this handoff.**
- v1.1.5 has passed the closed release gates, two independent production proofs, the optimized CI proof, and a fresh lean live-production recheck.
- Do **not** invent a maintenance release merely because historical documents contain superseded status text.
- Do **not** reopen Candidate C or v1.1.5 unless a new reproducible defect is discovered.
- The next legal substantive milestone remains **v1.2.0 — Installable Offline App**.

Owner acceptance must remain distinct from developer/automated QA. In the current conversation the owner has repeatedly asked whether v1.1.5 is live, bug-free within tested scope, and free of historical mismatches. No new post-release defect has been reported. Formal product acceptance has not been expressed as a separate release-signoff statement, so do not fabricate one.

---

## 2. Current repository and release authority

Current repository `main` at handoff creation time:

`5a524573f625dcb624c4bf0d0d2eba4693665b84`

This SHA is an **observational repository checkpoint only**. It must not become a permanent runtime-authority label. `main` may later move through documentation, test, CI, or future feature commits.

Immutable v1.1.5 application authority:

- Application version: `v1.1.5`
- Runtime asset revision: `1.1.5-r1`
- Immutable application runtime SHA: `ff755a9863abc843ae9aac45178428e3a104fc65`
- Proven runtime Pages deployment: `5878930362`
- Historical CI-orchestration checkpoint: `0af73262fcc95fbd76ffe9a2f06d4b0dac911f62`
- Final authority-reconciliation main checkpoint before this handoff: `5a524573f625dcb624c4bf0d0d2eba4693665b84`
- Latest Pages deployment observed before creating this handoff: `5880070883`, for repository SHA `5a524573f625dcb624c4bf0d0d2eba4693665b84`

Important distinction:

Later CI/test/documentation-only repository heads do **not** redefine the immutable v1.1.5 application runtime. The application bytes remain the runtime from `ff755a9863abc843ae9aac45178428e3a104fc65` unless a later substantive runtime release intentionally changes them.

---

## 3. Required read order for the next developer

Before meaningful implementation:

1. `00_HANDOFF_GOLDEN_RULE.md`
2. `00_DEVELOPER_START_HERE.md`
3. `00_CURRENT_HANDOFF.md` — this file
4. `NEXT_TASK.md`
5. `CAREER_MODE_SHOWDOWN_V1.1.5_POST_MERGE.md`
6. `PROJECT_STATE.md`
7. `RELEASE_V1.1.5.md`
8. `POST_V1_ROADMAP_EXECUTION.md` before v1.2 implementation
9. `CLOUD_STORAGE_FOUNDATION.md` only when future sync/security architecture is relevant
10. `CAREER_MODE_SHOWDOWN_V1.1.5_MAINTENANCE_HANDOFF.md` only for detailed maintenance chronology/defect archaeology

For deeper historical intent and project evolution, use:

- `00_MASTER_DEVELOPER_CONTEXT.md`
- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPER_HANDOFF_FINAL_2026-08-12.md`

Authority when sources disagree:

1. current verified source on `main`;
2. explicit later owner decisions;
3. `PROJECT_STATE.md`;
4. `NEXT_TASK.md`;
5. current post-merge/current handoff material;
6. roadmap/amendments;
7. older historical docs, PR descriptions, and conversations.

Never revert verified working source merely to satisfy stale historical prose. Correct or relabel the stale document.

---

## 4. Product model — locked

Career Mode Showdown is a FIFA 17 Career Mode rivalry companion for exactly two managers. It is not a browser football simulator and not yet a cloud/account product.

Locked behavior:

- exactly two managers;
- one local browser/device;
- one active Showdown;
- each manager plays a separate FIFA 17 Career Mode save outside the site;
- manual result entry is authoritative;
- both managers use the same selected league;
- permanent clubs must be different;
- Showdown lengths: `[1,3,5,10]`;
- default leagues: Premier League, LaLiga, Bundesliga, Serie A, Ligue 1;
- Champions League winner: +5;
- domestic League winner: +3;
- main domestic Cup winner: +1;
- 100 League Points and/or 100 League Goals share a maximum +1 bonus;
- Top Scorer and/or Top Assist share a maximum +1 bonus;
- maximum Season score: 11;
- equal non-zero scores are a Draw;
- only 0–0 uses league position, then league points as tiebreakers.

Do not change these rules during v1.2 PWA work.

---

## 5. Technical architecture — locked authority boundaries

Technology:

- static HTML;
- CSS;
- vanilla JavaScript;
- GitHub Pages;
- browser localStorage.

Core authority files:

- navigation/history: `js/screens.js`;
- canonical persistence/destructive mutation: `js/storage.js`;
- raw atomic transaction engine behind storage authority: `js/storageTransaction.js`;
- scoring: `js/scoring.js`;
- canonical Showdown model: `js/showdown.js`;
- analytics: `js/analytics.js`.

Canonical localStorage keys remain exactly:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Current Showdown schema: 2.
Current preferences schema: 2.

No future module may bypass `js/storage.js` for canonical destructive local mutation.

---

## 6. Candidate A / B / C safety model

### Candidate A — backup/export

Candidate A is non-mutating export. It preserves human-readable backup format v1, current canonical state, malformed raw-byte evidence where required, and SHA-256 integrity evidence.

SHA-256 is integrity evidence only. It is not encryption, signing, authentication, or authorization.

### Candidate B — read-only import analysis

Candidate B is strictly read-only. It owns validation, migration, current-state comparison, conflict preview, hostile-input handling, and analysis. A preview is evidence, not write authority.

Candidate B must never write/remove canonical storage.

### Candidate C — atomic restore/recovery

Candidate C is the only import stage allowed to commit canonical state.

The protected legal transaction sequence is:

1. flush pending canonical writes;
2. freeze the exact confirmed File, choices, and reviewed raw bytes before asynchronous Apply work;
3. freshly revalidate the exact confirmed file through Candidate B authority;
4. capture a strict exact raw snapshot that distinguishes absence from read failure;
5. reject reviewed-state drift;
6. compute the complete final candidate in memory;
7. require explicit active/Legacy/preferences/conflict decisions;
8. enter `js/storage.js` authority with planning bytes as transaction precondition;
9. recheck exact raw bytes immediately before each mutation;
10. write deterministic active → Legacy → preferences order;
11. grant mutation ownership only after a successful write;
12. verify every committed value;
13. on failure roll back only transaction-owned successful mutations, in reverse order;
14. refuse to overwrite newer/unowned bytes;
15. verify owned rollback byte-for-byte;
16. enter locked critical recovery and invalidate uncertain caches if ownership/rollback cannot be proven;
17. synchronize runtime/navigation only after complete verified success;
18. preserve corrupt raw bytes unless explicit replacement is selected;
19. keep repeated identical restore deterministic and zero-write;
20. keep all canonical destructive mutation under `js/storage.js` authority.

Recovery states are intentionally distinct:

- `RESTORE NOT STARTED`
- `RESTORE ROLLED BACK`
- `CRITICAL RECOVERY STATE`

---

## 7. What v1.1.5 fixed

v1.1.5 was a restore transaction safety maintenance release. It did not change gameplay, scoring, manager count, league/club assignment, Transfer Challenge rules, Season Review calculations, Statistics formulas, backup format version, storage keys, or accepted football-photo sources.

### Major fix 1 — confirmed-intent race

The previous Apply path could confirm one restore plan and then consume later file/choice changes while fresh asynchronous verification was still running.

v1.1.5 fixes this by:

- freezing the exact selected File before the first await;
- deep-copying confirmed choices;
- deep-copying reviewed raw precondition bytes;
- fresh-revalidating the exact confirmed File;
- locking file/Review/choice/Apply controls in-flight;
- generation-binding async analysis;
- committing only frozen confirmed values.

### Major fix 2 — over-broad rollback

The previous rollback could rewrite the entire planned affected-key set, including keys that were never successfully mutated. That could create false critical recovery and cross-context clobber risk.

v1.1.5 fixes this by:

- strict full raw transaction preconditions;
- last-moment exact raw prewrite checks;
- mutation ownership only after a successful write;
- exact `committedKeys` rollback ownership;
- reverse-order rollback of owned mutations only;
- zero rollback writes after a failed first write;
- refusal to overwrite newer/unowned bytes;
- byte-for-byte owned rollback verification;
- critical recovery/cache invalidation when ownership cannot be proven.

Additional hardening includes strict read-failure fail-closed behavior, corrupt-byte preservation until explicit replacement, deterministic repeated-import zero-write behavior, and removal of stale Candidate A v1.1.3 provenance fallback.

---

## 8. Production release evidence

### Production proof 1

- Stability run: `31650134707`, attempt 1
- deployed-site-smoke job: `94293855547`
- public deployment boundary passed:
  - exact runtime-byte parity;
  - runtime error provenance;
  - Home/Marco Reus visual audit;
  - licensed football-photo audit;
  - Candidate A backup export;
  - Candidate B import analysis;
  - Candidate C atomic restore/recovery;
  - complete public journey.

### Production proof 2 after CI orchestration optimization

- Stability run: `31651830554`
- original deployed smoke job: `94297967413`
- same exhaustive public boundary passed again;
- Release Integration Burn-In: `31651830507`, 2/2 stateful journeys green.

Because CI-only orchestration changes did not alter application/runtime/assets/data bytes, proof 2 remains evidence for the same immutable application runtime `ff755a9863abc843ae9aac45178428e3a104fc65`.

### Fresh lean live-production recheck performed immediately before this handoff

A single authoritative deployed-site smoke job was intentionally rerun rather than replaying every workflow family.

- Stability run: `31651830554`
- rerun attempt: 2
- deployed-site-smoke job: `94313847810`
- result: **SUCCESS**

Observed proof from the fresh live run:

- `61 runtime files match 1.1.5-r1 byte for byte` at the public Pages URL;
- runtime error provenance: PASS;
- Home/Reus audit: PASS at 940×700, 1100×720, 1366×768, and mobile 390×844 DPR2;
- licensed football visual audit: PASS across desktop, compact desktop, windowed/reduced-motion, and mobile DPR2;
- Candidate A backup export: PASS;
- Candidate B read-only analysis with Candidate C coexistence: PASS;
- Candidate C restore/recovery including stale state, rollback, corrupt data, double Apply, lifecycle, confirmed-intent race and clean first-write failure: PASS;
- complete public gameplay/navigation journey: PASS;
- complete journey checkpoints: 70;
- accessibility scans: 36;
- Chromium runtime/local assets: clean;
- npm audit during setup: 0 vulnerabilities.

The fresh rerun was attached to the earlier optimized Stability workflow commit `0af732...` because GitHub reruns preserve the original workflow run head. That is expected and does not mean the public site rolled back. The deployment verifier directly checked the current public site and confirmed all 61 v1.1.5-r1 runtime files byte-for-byte. Later main changes were documentation-only.

The only warnings observed were Node/GitHub runner deprecation warnings involving `punycode` and legacy `url.parse()`. These are test-environment/toolchain warnings, not Career Mode Showdown runtime errors.

---

## 9. Current bug status

### Urgent bug fixes

**None known.**

At handoff creation there is no reproducible application defect that warrants reopening v1.1.5 or creating an emergency patch.

Known serious bugs: 0.
Known reproducible minor bugs from the latest live gate: 0.
Known deployment mismatch: 0.
Known version/revision mismatch: 0.
Known npm vulnerability from the fresh live setup: 0.

Do not interpret this as a mathematical proof that no undiscovered bug can exist. It means all currently defined release, safety, visual, persistence, responsive, accessibility, and live-production gates are green, and no new defect has been reported.

### Non-urgent residual risk / coverage gap

The main remaining coverage gap is native WebKit/Safari-specific behavior. Current browser automation is Chromium-based, including mobile emulation. A future test expansion may add WebKit/Safari-specific coverage, especially for history/navigation, storage behavior, and rendering. This is a **coverage opportunity, not a known v1.1.5 bug**.

Other unavoidable residual risks include unusual browser extensions/privacy configurations, browser-specific quota behavior, and malformed historical data combinations not yet conceived. None is currently reproduced as a defect.

---

## 10. Historical discrepancy / authority reconciliation status

v1.1.5 had a separate documentation-authority cleanup after runtime closure.

The dangerous problem was not the existence of old v1.1.3/v1.1.4 history. The problem was old material presenting mutable or superseded information as current authority.

PR #28 — `v1.1.5 final authority reconciliation` — removed stale mutable-main SHA claims from current-facing authority and made the distinction explicit:

- immutable application runtime authority is a fixed historical release SHA;
- current repository `main` is mutable and must be read from GitHub when needed;
- later docs/CI heads do not silently redefine runtime authority;
- Candidate C is closed, not a current unfinished task;
- v1.2 is the next substantive milestone.

PR #28 merged to main checkpoint:

`5a524573f625dcb624c4bf0d0d2eba4693665b84`

Current-facing authority files reconciled there include:

- `00_DEVELOPER_START_HERE.md`
- `NEXT_TASK.md`
- `README.md`
- `PROJECT_STATE.md`
- `CAREER_MODE_SHOWDOWN_V1.1.5_POST_MERGE.md`

Historical files and old PR descriptions intentionally still contain old states because they are historical evidence. Do not rewrite history merely to remove every old version string. The required property is that historical text is clearly subordinate to current authority.

`tests/contracts/release-authority-coherence.cjs` protects current release/documentation/version coherence and known stale-current failure classes.

---

## 11. Lean/smart CI architecture — preserve this

The previous test system became operationally noisy because unique evidence was repeatedly re-run by several workflows. This created long waits, apparent resets, cancellation churn, and confusing GitHub Actions UI behavior even when the application was healthy.

The root causes included:

- Stability serializing seven browser suites and repeating the set twice;
- Candidate B/C duplicating their own multi-scenario specialist suites;
- Burn-In running five near-complete release matrices;
- Markdown-only changes starting heavy browser lanes;
- `cancel-in-progress: true` allowing certain reruns to cancel newer active proof;
- frequent short polling making long successful jobs feel stuck;
- GitHub showing latest `run_attempt`, making completed work appear to restart.

CI-only PR #26 fixed the orchestration without weakening unique safety assertions.

Permanent single-owner model:

- workstream workflows own specialized evidence;
- Candidate B owns one authoritative import-analysis browser run per workflow attempt;
- Candidate C owns one authoritative restore/recovery browser run per workflow attempt;
- local Stability owns one runtime-provenance audit plus one complete integration journey;
- deployed Stability remains exhaustive: exact bytes + provenance + Home + visuals + Candidate A + Candidate B + Candidate C + complete journey;
- Release Integration Burn-In is main/manual only and runs two complete stateful integration journeys;
- Markdown-only changes skip heavy Candidate B/C/Stability/Burn-In lanes and use Static/release-authority coherence;
- fresh attempt-1 PR/push runs may replace stale work;
- deliberate reruns/manual dispatches queue instead of cancelling active proof;
- `tests/contracts/ci-orchestration-contracts.cjs` rejects reintroduction of old duplicate loops.

Measured effect:

- old local Stability browser work: about 6m47s;
- optimized canonical Stability: about 1m11s;
- roughly 82% lower wall time in that job;
- historical affected normal-PR long-suite invocations: about 53 → 4.

Testing rule for future developers:

1. choose the workflow that owns the changed behavior;
2. record the run ID;
3. continue independent work;
4. inspect after realistic wall time or a real failure signal;
5. diagnose before rerunning;
6. rerun only the failed/cancelled owner job where possible;
7. never replay the full permanent matrix merely to repeat one public proof;
8. if a fresh live proof is needed, repeat the canonical deployed Stability smoke;
9. inspect `run_attempt` before declaring a reset/cancellation an application failure;
10. do not weaken unique assertions or budgets for speed.

There remain 14 permanent workflow families and 27 protected executable `.yml` blocks. Normal PRs intentionally exercise 13 families because Burn-In is main/manual only.

---

## 12. Performance and visual locks

Do not casually increase these ceilings:

- eager raw code ceiling: 165,000 bytes;
- eager gzip ceiling: 37,500 bytes;
- startup Marco Reus portrait ceiling: 95,000 bytes;
- combined first-party startup ceiling: 260,000 bytes.

Current release measurement was approximately:

- eager raw: 164,995 bytes;
- eager gzip: 37,397 bytes.

Loading timing locks:

- normal loading minimum: 2700 ms;
- reduced-motion loading: 220 ms.

Protected visual surfaces:

- Marco Reus Home presentation;
- Marco Reus loading-screen presentation;
- accepted licensed route-scoped football photography and crop behavior.

Do not change these incidentally during v1.2 implementation.

---

## 13. Future cloud boundary — contract only

`CLOUD_STORAGE_FOUNDATION.md` is future architecture/security groundwork. There is no cloud backend, account requirement, or network mutation in v1.1.5.

Future cloud work must preserve:

- distinct `accountId`, `profileId`, `saveId`, `deviceId`, `installationId`, and object identity;
- server-authoritative revision tokens;
- `baseRevision`/parent semantics;
- compare-and-swap writes;
- explicit divergent-head conflicts rather than silent last-write-wins gameplay state;
- tombstones/deletion revisions and anti-resurrection;
- local-first opt-in privacy;
- data minimization, export/delete, and retention rules;
- TLS, authentication, server-side authorization, least privilege, secure session/token handling, replay/idempotency defense, and rate/schema/size limits;
- no privileged secret in static client JavaScript;
- no cloud module directly calling localStorage;
- downloaded/conflict-resolved state re-entering the same Candidate C exact local snapshot/precondition/verification/transaction-owned rollback boundary.

Do not implement cloud during v1.2.

---

## 14. Next substantive milestone — v1.2.0 Installable Offline App

Do not begin v1.2 until current `main` is freshly loaded and the v1.1.5 baseline is preserved.

Required v1.2 themes:

- web app manifest;
- original install metadata/icons;
- versioned first-party service-worker shell cache;
- atomic cache activation;
- visible Update Ready flow;
- offline status;
- graceful external media absence while offline;
- Chromebook/Android install behavior;
- browser-appropriate install guidance elsewhere;
- first-load tests;
- repeat-load tests;
- offline tests;
- update tests;
- rollback tests;
- cache-corruption tests;
- two consecutive cache-revision upgrade/rollback proofs before release.

Critical v1.2 design constraint:

A service worker must never allow incompatible runtime revisions to mix. Cache update/activation/rollback must not weaken localStorage recovery, Candidate C transaction safety, or immutable release-revision reasoning.

Explicitly out of v1.2 scope:

- cloud backend;
- account system;
- multi-device sync;
- stable local profile/save identity redesign;
- gameplay/scoring changes;
- Candidate A/B/C redesign;
- visual redesign of protected Reus/football-photo surfaces.

Stable local profiles/save identity are planned later (v1.3). Cloud readiness and cloud backup remain dependency-ordered future milestones.

---

## 15. Meaningful historical failures future developers should know

Do not rediscover these by repeating old mistakes.

### Candidate C confirmed-intent race

Fixed in v1.1.5. Never allow mutable file/choice state to change after confirmation while async revalidation is underway.

### Over-broad rollback

Fixed in v1.1.5. Rollback only transaction-owned successful mutations. A failed first write must perform zero rollback writes.

### Snapshot read failure ambiguity

Fixed fail-closed. A destructive snapshot must distinguish true key absence from storage read failure.

### Startup budget 31-byte overflow

During maintenance, eager raw code reached 165,031 bytes and failed the unchanged 165,000-byte ceiling. The ceiling was not raised; obsolete eager code/comment bytes were removed. Preserve this discipline.

### CI cancellation/glitch illusion

An older Stability rerun once cancelled a newer proof because of the old concurrency design. This was orchestration behavior, not an application assertion failure. The CI model was redesigned and permanently contracted.

### Stale mutable-main SHA documentation

Fixed by PR #28. Never put a mutable repository-head SHA into current authority as though it were permanent runtime identity. Immutable release SHAs may be recorded; current `main` must be read from GitHub.

### Exact-write handoff lesson

During the authority-reconciliation work, an attempted docs update used a stale blob SHA and GitHub correctly returned a 409 mismatch. The file was refetched and updated using the exact current blob SHA. Never force through a stale repository write.

---

## 16. Current known status summary

At the moment of this handoff:

- repository: public;
- public site: live;
- application: `v1.1.5`;
- runtime revision: `1.1.5-r1`;
- immutable runtime: `ff755a9863abc843ae9aac45178428e3a104fc65`;
- current main observed: `5a524573f625dcb624c4bf0d0d2eba4693665b84`;
- latest observed Pages deployment: `5880070883` on that main checkpoint;
- runtime deployment proof: `5878930362`;
- Candidate A: complete/protected;
- Candidate B: complete/protected;
- Candidate C: complete/protected;
- v1.1.5 maintenance: CLOSED;
- documentation authority reconciliation: CLOSED;
- optimized lean CI architecture: ACTIVE/PROTECTED;
- fresh live deployed-site gate: PASS;
- urgent bug fix required: **NO**;
- known reproducible application bug: **NONE**;
- next legal substantive milestone: **v1.2.0 Installable Offline App**;
- cloud implementation: **NOT AUTHORIZED YET**.

---

## 17. Exact next-developer continuation instruction

Use this orientation verbatim if context is lost:

`Load current main. Read 00_HANDOFF_GOLDEN_RULE.md, 00_DEVELOPER_START_HERE.md, 00_CURRENT_HANDOFF.md, NEXT_TASK.md, CAREER_MODE_SHOWDOWN_V1.1.5_POST_MERGE.md, PROJECT_STATE.md and RELEASE_V1.1.5.md. Treat ff755a9863abc843ae9aac45178428e3a104fc65 as immutable v1.1.5 application runtime. Read current repository main from GitHub rather than hardcoding it as runtime authority. v1.1.5 / 1.1.5-r1 is closed, live and production-proven. Candidate A/B/C are complete. The two v1.1.5 fixes are immutable confirmed restore intent and transaction-owned rollback with strict exact raw snapshots/preconditions/verification. The duplicated CI testing loop is retired; use single-owner lean gates and the exhaustive deployed Stability boundary only when appropriate. There is currently no urgent known bug. Begin only v1.2.0 Installable Offline App while preserving gameplay, local data safety, storage authority, runtime-revision integrity, startup budgets and protected visuals. Cloud remains future-contract-only.`

---

## 18. This handoff session actions

Actions performed to create this handoff:

1. fetched the current repository and verified it is public;
2. verified current `main` as `5a524573f625dcb624c4bf0d0d2eba4693665b84`;
3. read `00_HANDOFF_GOLDEN_RULE.md`;
4. read `00_DEVELOPER_START_HERE.md`;
5. read `NEXT_TASK.md`;
6. read `CAREER_MODE_SHOWDOWN_V1.1.5_POST_MERGE.md`;
7. read `PROJECT_STATE.md`;
8. verified latest observed GitHub Pages deployment `5880070883` is for main SHA `5a524573f625dcb624c4bf0d0d2eba4693665b84`;
9. incorporated the fresh lean public-site gate, Stability `31651830554` attempt 2 / deployed-site-smoke `94313847810`, which completed successfully;
10. classified Node/GitHub runner deprecation warnings as tooling-only, not product defects;
11. concluded no urgent v1.1.5 bug fix is currently justified;
12. created this documentation-only handoff from exact main checkpoint `5a524573f625dcb624c4bf0d0d2eba4693665b84`.

No application HTML/CSS/JS/data/assets/package runtime was intentionally changed by this handoff work.

# Career Mode Showdown — Current Complete Handoff

Status: ACTIVE CURRENT HANDOFF
Created: 2026-08-13
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

This file is the concise operational handoff for the current project state. It does not replace release history. When older documents or PR descriptions conflict with verified current source or this handoff, follow the authority order below.

## 1. Current release state

Application version: `v1.1.5`
Runtime asset revision: `1.1.5-r1`
Release status: CLOSED, DEPLOYED, PRODUCTION-PROVEN
Immutable application runtime authority: `ff755a9863abc843ae9aac45178428e3a104fc65`
Proven runtime Pages deployment: `5878930362`
Latest docs/main Pages deployment before this handoff: `5880070883`
Repository `main` at handoff creation: `5a524573f625dcb624c4bf0d0d2eba4693665b84`
Handoff branch base: `5a524573f625dcb624c4bf0d0d2eba4693665b84`
Handoff branch: `docs/current-v115-complete-handoff`

The mutable repository `main` SHA is not application runtime authority. CI/test/documentation-only commits may move `main` and trigger Pages without changing the v1.1.5 runtime. Fetch GitHub whenever the latest repository head is needed.

## 2. Urgent bug status

There are currently **no known urgent or reproducible v1.1.5 application bugs**.

The latest live-production lean gate found zero application defects. It verified the public GitHub Pages deployment rather than only local source. The deployed verifier confirmed that all 61 runtime files match `1.1.5-r1` byte-for-byte.

No emergency patch is justified at this time. Do not reopen v1.1.5 merely to create activity. If a new reproducible defect appears, classify it first, preserve data-safety contracts, add the smallest owner test that reproduces it, then patch through a dedicated maintenance branch.

Residual uncertainty is normal browser risk, not a known defect: native Safari/WebKit-specific behavior is less deeply proven than Chromium, and no finite suite can exhaust every extension/privacy/storage combination.

## 3. Authority order

When information conflicts, use this order:

1. verified current source on `main`;
2. explicit later owner instruction;
3. `PROJECT_STATE.md`;
4. `NEXT_TASK.md`;
5. `00_DEVELOPER_START_HERE.md` and current post-merge/current handoffs;
6. release/roadmap documents;
7. historical handoffs, old PR descriptions, branches and chats.

Never revert proven source merely to satisfy stale historical prose. Correct the stale prose instead.

## 4. Mandatory first reads for the next developer

1. `00_HANDOFF_GOLDEN_RULE.md`
2. `00_DEVELOPER_START_HERE.md`
3. `CURRENT_HANDOFF.md`
4. `NEXT_TASK.md`
5. `CAREER_MODE_SHOWDOWN_V1.1.5_POST_MERGE.md`
6. `PROJECT_STATE.md`
7. `RELEASE_V1.1.5.md`
8. `POST_V1_ROADMAP_EXECUTION.md` before v1.2 implementation
9. `CLOUD_STORAGE_FOUNDATION.md` only when future cloud architecture is relevant

`CAREER_MODE_SHOWDOWN_V1.1.5_MAINTENANCE_HANDOFF.md` is detailed historical chronology, not current task authority.

## 5. Locked product model

Career Mode Showdown is a two-manager FIFA 17 Career Mode rivalry companion.

Locked rules:

- exactly two managers;
- one browser/device and one active Showdown;
- each manager plays a separate FIFA 17 Career Mode save outside the site;
- manual result entry is authoritative;
- both managers use the same selected league and different permanent clubs;
- Showdown lengths are `[1,3,5,10]`;
- default leagues are Premier League, LaLiga, Bundesliga, Serie A and Ligue 1;
- Champions League winner = +5;
- domestic league winner = +3;
- main domestic cup winner = +1;
- 100 league points and/or 100 league goals share a maximum +1;
- Top Scorer and/or Top Assist share a maximum +1;
- maximum Season score = 11;
- equal non-zero totals are a Draw;
- only 0–0 uses league position, then league points, as tiebreakers;
- Transfer Challenge rules remain unchanged.

Do not alter these rules as part of v1.2 install/offline work.

## 6. Architecture and storage authority

Technology: static HTML/CSS/vanilla JavaScript SPA on GitHub Pages.

Key authorities:

- navigation/history: `js/screens.js`;
- canonical persistence/destructive mutation: `js/storage.js`;
- raw transaction engine: `js/storageTransaction.js`, behind `js/storage.js`;
- scoring: `js/scoring.js`;
- Showdown model: `js/showdown.js`;
- analytics: `js/analytics.js`.

Exactly three canonical current localStorage keys exist:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Current Showdown schema: 2.
Current preferences schema: 2.

No future module may bypass `js/storage.js` for canonical local mutation.

## 7. Candidate A / B / C state

Candidate A, Candidate B and Candidate C are complete and protected.

Candidate A is non-mutating backup/export. SHA-256 is integrity evidence only; it is not encryption, signing, authentication or authorization.

Candidate B is strictly read-only import analysis, migration and conflict preview. Preview data is evidence, never write authority.

Candidate C is the only import stage allowed to commit canonical state.

The protected Candidate C transaction sequence is:

1. flush pending canonical writes;
2. freeze exact confirmed File, choices and reviewed raw bytes before asynchronous Apply work;
3. freshly revalidate that exact File through Candidate B authority;
4. capture a strict exact raw snapshot that distinguishes absence from read failure;
5. reject reviewed-state drift;
6. compute all final candidate values fully in memory;
7. require explicit active/Legacy/preferences/conflict decisions;
8. enter `js/storage.js` with the planning snapshot as transaction precondition;
9. recheck exact raw bytes immediately before every mutation;
10. write deterministic active → Legacy → preferences order;
11. grant mutation ownership only after a successful write;
12. verify every committed value;
13. on failure roll back only transaction-owned successful mutations, in reverse order;
14. refuse to overwrite newer/unowned bytes;
15. verify owned rollback byte-for-byte;
16. enter critical recovery and invalidate uncertain caches when rollback/ownership cannot be proven;
17. synchronize runtime/navigation only after complete verified success;
18. preserve corrupt raw bytes unless explicit replacement is chosen;
19. keep repeated identical restore a deterministic zero-write no-op;
20. keep canonical mutation under `js/storage.js` authority.

Recovery states remain distinct:

- `RESTORE NOT STARTED`
- `RESTORE ROLLED BACK`
- `CRITICAL RECOVERY STATE`

## 8. What v1.1.5 fixed

### Confirmed-intent race

Before v1.1.5, restore choices/file state could change after confirmation while asynchronous revalidation was still running. v1.1.5 freezes the exact selected File, confirmed choices and reviewed raw precondition before the first asynchronous boundary, locks the decision surface while in flight, generation-binds analysis, and commits only frozen confirmed values.

### Over-broad rollback

Before v1.1.5, rollback could rewrite the full planned affected set, including keys never successfully mutated. v1.1.5 grants transaction ownership only after successful writes and rolls back only owned mutations in reverse order with exact preconditions, anti-clobber checks and byte-for-byte verification. A clean first-write failure performs zero rollback writes.

Additional hardening includes strict snapshot read failure, stale-preview rejection, corrupt-byte preservation, deterministic repeated import, current provenance, and critical cache invalidation when ownership cannot be proven.

## 9. Release and production evidence

Immutable runtime: `ff755a9863abc843ae9aac45178428e3a104fc65`.

Production proof 1:

- Stability run `31650134707`, attempt 1;
- deployed-site-smoke job `94293855547`;
- exact runtime bytes, runtime provenance, Home/Reus, licensed visuals, Candidate A, Candidate B, Candidate C and complete public journey all passed.

Production proof 2 after CI orchestration cleanup:

- Stability run `31651830554`;
- deployed-site-smoke job `94297967413`;
- same exhaustive public boundary passed;
- focused Release Integration Burn-In `31651830507` passed 2/2.

Fresh lean live-production rerun on 2026-08-13:

- Stability run `31651830554`, run attempt 2;
- deployed-site-smoke job `94313847810`;
- exact deployment verification passed: 61 runtime files matched `1.1.5-r1` byte-for-byte;
- runtime error provenance passed;
- Home/Reus visual audit passed at windowed, desktop, Chromebook and mobile DPR2;
- licensed football visual audit passed across desktop, compact desktop, reduced-motion windowed and mobile DPR2;
- Candidate A backup export passed;
- Candidate B read-only analysis passed;
- Candidate C atomic restore/recovery and v1.1.5 maintenance race/first-write scenarios passed;
- complete public journey passed with 70 checkpoints and 36 accessibility scans;
- npm reported 0 vulnerabilities;
- only Node/GitHub-runner deprecation warnings appeared (`punycode`, legacy `url.parse()`), not application runtime defects.

## 10. Lean / smart test system

The old testing model repeated the same expensive browser evidence across multiple workflows and created long waits, redundant runner usage, confusing rerun behavior and cancellation churn. That duplication was removed without discarding unique safety coverage.

Current single-owner model:

- specialized workflows own specialized evidence once per workflow attempt;
- Candidate B owns one authoritative import-analysis browser suite;
- Candidate C owns one authoritative restore/recovery browser suite;
- local Stability owns one runtime-provenance pass plus one canonical complete integration journey;
- deployed Stability remains exhaustive: exact bytes + provenance + Home + visuals + Candidate A + Candidate B + Candidate C + full journey;
- Burn-In is main/manual only and repeats the full stateful integration journey twice instead of five full release matrices;
- Markdown-only changes skip heavy Candidate B/C/Stability/Burn-In work and rely on Static/release-authority coherence;
- fresh attempt-1 PR/push runs may replace stale work;
- reruns/manual dispatches queue rather than cancelling active proofs;
- rerun only the failed/cancelled owner job when possible;
- never rerun the whole permanent matrix to duplicate one live proof;
- inspect `run_attempt` before treating a visual GitHub Actions reset as a failure;
- do not poll long jobs every few seconds.

Measured improvement:

- old local Stability browser step: about 6m47s;
- optimized canonical Stability: about 1m11s;
- about 82% lower wall time;
- duplicated long-suite command invocations in affected normal-PR lanes reduced from roughly 53 to 4.

`tests/contracts/ci-orchestration-contracts.cjs` protects this topology from regression.

There remain 14 permanent workflow families and 27 protected executable `.yml` blocks. Normal PRs intentionally exercise 13 families because Release Integration Burn-In is main/manual only.

## 11. Performance and presentation locks

Do not raise these ceilings merely to make a build pass:

- eager raw code ceiling: 165,000 bytes;
- eager gzip ceiling: 37,500 bytes;
- startup Marco Reus portrait ceiling: 95,000 bytes;
- combined first-party startup ceiling: 260,000 bytes;
- normal loading minimum: 2700 ms;
- reduced-motion loading: 220 ms.

Protected Marco Reus Home/loading presentation and accepted route-scoped licensed football visuals remain unchanged.

## 12. Historical discrepancy rule

Old v1.1.3/v1.1.4 text, Candidate C pre-release language, old five-pass Burn-In descriptions and historical SHAs may remain in historical release notes, PR descriptions and chronology. That is intentional history.

The dangerous case is old material presenting itself as current authority. Current-facing documents were reconciled to remove stale mutable-main SHA claims and obsolete current-task wording. Do not delete historical evidence just to make repository search results contain only v1.1.5.

Current source and current authority must be coherent; historical records should remain historically accurate.

## 13. Cloud boundary

`CLOUD_STORAGE_FOUNDATION.md` is future architecture/security contract only. No cloud backend, account requirement or network mutation is authorized in v1.1.5 or v1.2.

Future work must preserve distinct account/profile/save/device/installation/object identity, server-authoritative revision tokens, `baseRevision` compare-and-swap, explicit conflicts, tombstones and anti-resurrection, local-first opt-in privacy, data minimization, export/delete/retention, TLS/auth/server-side authorization/least privilege, secure token handling, replay/idempotency protection, schema/size/rate limits, no privileged secret in static client JavaScript, no direct cloud-module localStorage access, and Candidate C local safety on downloaded/conflict-resolved state.

## 14. Next legal substantive milestone

Next milestone: **v1.2.0 — Installable Offline App**.

Do not begin v1.3 profiles or cloud work first.

v1.2 scope:

- web app manifest;
- original install metadata/icons;
- service worker for a versioned first-party shell;
- atomic cache activation;
- visible Update Ready flow;
- offline status and graceful external-media absence;
- Chromebook/Android install behavior and browser-appropriate guidance elsewhere;
- first-load, repeat-load, offline, update, rollback and cache-corruption tests;
- two consecutive cache-revision upgrade/rollback proofs before release.

The core v1.2 design requirement is that incompatible runtime revisions must never be mixed and service-worker update/recovery must never weaken local Candidate C/storage safety.

## 15. Immediate continuation command

`Load current main from GitHub. Read 00_HANDOFF_GOLDEN_RULE.md, 00_DEVELOPER_START_HERE.md, CURRENT_HANDOFF.md, NEXT_TASK.md, CAREER_MODE_SHOWDOWN_V1.1.5_POST_MERGE.md and PROJECT_STATE.md. Treat ff755a9863abc843ae9aac45178428e3a104fc65 as immutable v1.1.5 application runtime. Do not reopen v1.1.5 or Candidate C without a reproducible defect. Preserve the lean single-owner CI model. Begin only v1.2.0 Installable Offline App when explicitly instructed. Cloud remains future-contract-only.`

## 16. Current owner instruction represented by this handoff

The owner requested a complete current handoff in the public repository and asked whether urgent bug fixes remain. This document fulfills that continuity requirement. At the time of creation no urgent bug was found, and the correct release action is to preserve the clean, proven v1.1.5 runtime rather than make speculative changes.
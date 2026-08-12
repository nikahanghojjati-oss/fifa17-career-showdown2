# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-12

Release-candidate application: `v1.1.5`
Runtime asset revision: `1.1.5-r1`
Active branch: `agent/v1.1.5-maintenance`
Draft PR: #25 — `v1.1.5 maintenance: restore transaction hardening`

Current public production remains v1.1.4 until PR #25 is merged and Pages proof completes.

Immutable v1.1.4 production runtime authority:

`1a498441a6ccf557aa8b8bc7ced2b3d9cd22cdf7`

GitHub Pages deployment for v1.1.4:

`5877215224`

Functional v1.1.5 maintenance proof before identity/document freeze:

`dbcdffaae927163e5a9c8b44466ff2084e814de5`

## Current status

v1.1.4 Candidate C is complete, merged, deployed, twice-proven and protected.

v1.1.5 maintenance implementation is complete. The only legal current work is release closure and proof. Do not add another feature to PR #25.

Candidate A remains the non-mutating export authority.
Candidate B remains the strictly read-only import-analysis authority.
Candidate C remains the only stage permitted to commit imported canonical state after fresh verification and explicit user decisions.

v1.1.5 strengthens Candidate C; it does not redesign Candidate A/B/C or change backup format version 1.

## Two maintenance defects fixed

### 1. Confirmed restore intent race

The confirmed restore plan could previously consume later mutations to the file/choice state while fresh asynchronous Candidate B analysis was running.

v1.1.5 now requires:

1. freeze the exact selected File before the first asynchronous Apply boundary;
2. deep-copy the exact active/Legacy/preferences/conflict choices that were confirmed;
3. deep-copy the reviewed raw-state precondition;
4. run fresh Candidate B analysis against that exact confirmed File;
5. lock file input, Review, all restore choices/conflict selectors and Apply while review/apply is in flight;
6. generation-bind async file review so a stale completion cannot become authority after the selected file changes;
7. commit only the plan derived from the frozen confirmed values.

Permanent deterministic and real-browser tests deliberately mutate choice state during delayed revalidation and require the originally confirmed plan to win.

### 2. Rollback scope/ownership defect

The previous transaction rolled back the full affected-key plan even when some keys had never been successfully mutated.

v1.1.5 now requires:

1. exact full raw precondition at transaction entry when provided;
2. an exact last-moment raw `prewrite` check before every mutation;
3. mutation ownership only after a commit write succeeds;
4. rollback of `committedKeys` only;
5. reverse commit order during rollback;
6. zero rollback writes after a failed first write;
7. ownership check before rollback so Candidate C never overwrites a third/newer value it cannot prove it owns;
8. byte-for-byte verification of owned rollback keys;
9. locked critical recovery plus runtime-cache invalidation when rollback/ownership cannot be proven.

The clean first-write failure is now `write-failed-clean` / `RESTORE NOT STARTED`, which is distinct from a verified rollback and from critical recovery.

## Candidate C transaction contract now protected

A legal restore must preserve this sequence:

1. flush pending canonical writes;
2. freeze confirmed file, choices and reviewed raw bytes;
3. freshly revalidate the exact confirmed backup;
4. capture a strict exact raw snapshot that differentiates real absence from read failure;
5. detect stale reviewed state;
6. compute every final candidate value completely in memory;
7. require explicit active/Legacy/preferences/conflict decisions;
8. enter canonical storage with the exact planning snapshot as transaction precondition;
9. recheck exact bytes immediately before each write;
10. commit deterministic active → Legacy → preferences order;
11. verify every committed key/value;
12. on failure, roll back only transaction-owned mutations in reverse order;
13. refuse to clobber newer/unowned bytes;
14. verify rollback byte-for-byte;
15. enter locked critical recovery if rollback/ownership is uncertain;
16. invalidate uncertain runtime caches after critical recovery;
17. synchronize runtime/navigation only after complete success;
18. keep repeated identical restore a zero-write no-op;
19. preserve corrupt raw bytes unless explicit replacement was chosen;
20. keep all browser mutation under `js/storage.js` authority.

Do not weaken this sequence for PWA, profiles or future cloud convenience.

## Future cloud foundation is contract-only

`CLOUD_STORAGE_FOUNDATION.md` has been added and is protected by repository contracts.

It defines future requirements for:

- distinct account/profile/save/device/installation/object identities;
- server-authoritative revisions and base/parent revision semantics;
- compare-and-swap mutation and stale-revision rejection;
- explicit divergent-head conflicts instead of silent last-write-wins gameplay state;
- tombstones, deletion revisions and anti-resurrection rules;
- local-first/opt-in privacy, minimization, export/delete and retention;
- TLS, authenticated ownership, server-side authorization, least privilege, secure sessions/tokens, replay/idempotency protection, rate limiting and schema/size limits;
- future downloaded/conflict-resolved data entering the same local exact-snapshot/precondition/verification/ownership-rollback boundary.

This does not authorize a cloud backend in v1.1.5 or v1.2. Do not add Firebase, Supabase or another backend merely because a connector is easy to use.

## Functional maintenance proof already achieved

Before changing version identity, functional head:

`dbcdffaae927163e5a9c8b44466ff2084e814de5`

passed all 14 permanent workflow families.

Evidence includes:

- Candidate C deterministic contracts green;
- Candidate C complete destructive/recovery browser command green twice with the new maintenance scenarios;
- Stability contracts plus two complete Chromium cycles green;
- Candidate C Release Burn-In 5/5;
- Candidate A/B green;
- licensed visual family green;
- Static App full repository contract suite and protected 27-block topology green;
- original startup ceilings green.

This proves the behavior but is not a substitute for formal v1.1.5 release proof after the identity/document freeze.

## Startup/performance protection

Unchanged ceilings:

- eager raw code: 165,000 bytes;
- eager gzip code: 37,500 bytes;
- startup Marco Reus portrait: 95,000 bytes;
- combined first-party startup bytes: 260,000 bytes.

During maintenance, strict restore hardening measured 165,031 raw / 37,409 gzip and correctly failed. The raw ceiling was not raised. Removing an obsolete eager comment restored the original budget with no runtime behavior change.

Normal loading minimum remains 2700 ms.
Reduced-motion loading remains 220 ms.

## Permanent release topology

Current validation contains 14 permanent workflow families and 27 protected `.yml` executable blocks.

Families:

1. Home Bootstrap;
2. League Confirmation;
3. Transfer Workstream;
4. Season Review;
5. Statistics Workstream;
6. Settings Workstream;
7. V1 Visual Immersion;
8. Licensed Football Visuals;
9. Final Polish;
10. Static App;
11. Candidate B Import Analysis;
12. Candidate C Atomic Restore;
13. Stability Lane;
14. Candidate C Release Burn-In.

Do not weaken thresholds or delete assertions merely to make release closure green.

## Immediate release-closure sequence

No feature work is legal until all steps below are complete.

1. Finish current authority-document reconciliation for v1.1.5 while clearly preserving v1.1.4 as current public production before merge.
2. Ensure no temporary helper workflow remains in the candidate.
3. Freeze one exact PR #25 head SHA.
4. Pass all 14 permanent workflow families on that exact SHA.
5. Require Candidate C twice-browser recovery, two-cycle Stability and Burn-In 5/5 on that SHA.
6. Independently repeat the complete permanent matrix on the same exact SHA without changing repository bytes.
7. Mark PR #25 ready only after both matrices are green.
8. Recheck mergeability and merge only with expected-head protection against the frozen SHA.
9. Record the immutable v1.1.5 runtime merge SHA.
10. Wait for GitHub Pages to converge to `1.1.5-r1`.
11. Require production exact-byte parity to the immutable merge runtime.
12. Require public runtime provenance, Home/Reus, licensed football visuals, Candidate A, Candidate B, Candidate C and the complete live journey.
13. Require production Burn-In 5/5 and the remaining permanent families.
14. Independently repeat the production proof on the same immutable runtime SHA without code changes.
15. Create `CAREER_MODE_SHOWDOWN_V1.1.5_POST_MERGE.md`.
16. Seal `00_DEVELOPER_START_HERE.md`, `README.md`, `PROJECT_STATE.md`, `NEXT_TASK.md`, `RELEASE_V1.1.5.md`, `CHANGELOG.md`, `POST_V1_ROADMAP_EXECUTION.md` and the rolling maintenance handoff.
17. Prove the docs-only seal did not redefine or mutate the immutable runtime authority.

Until step 14 completes, do not call v1.1.5 deployed/twice-proven.

## Protected systems that this maintenance release must not alter

- exactly two managers;
- Showdown lengths `[1,3,5,10]`;
- same selected league / different permanent clubs;
- max-11 scoring and 0–0-only tiebreak logic;
- explicit League-selection Continue checkpoint;
- explicit Club rivalry-confirmation checkpoint;
- Transfer Challenge state machine;
- Season Review persistence boundary;
- Statistics/Legacy/Trophy calculations;
- centralized Smart Back/navigation ownership;
- exactly three canonical current localStorage keys;
- Candidate A backup format version 1 and non-mutating export;
- Candidate B read-only import analysis;
- Candidate C atomic transaction/recovery semantics;
- owner-liked Marco Reus loading/Home presentation;
- route-scoped licensed football-photo architecture;
- original startup budgets;
- local-first current product behavior.

## Next legal substantive milestone after release

v1.2.0 — Installable Offline App.

Do not start v1.2 until v1.1.5 is merged, Pages-deployed, twice-proven and documentation-sealed.

v1.2 must design service-worker/update/cache recovery around current data-safety guarantees. Stable local profiles/save identity remain later; cloud implementation remains later still.

## Continuation command for another developer

`Load current main and PR #25. Read 00_HANDOFF_GOLDEN_RULE.md, 00_DEVELOPER_START_HERE.md, this file, CAREER_MODE_SHOWDOWN_V1.1.5_MAINTENANCE_HANDOFF.md and RELEASE_V1.1.5.md. Do not reimplement Candidate C. The two maintenance fixes are immutable confirmed restore intent and transaction-owned rollback with strict snapshots/preconditions. Functional head dbcdffaae927163e5a9c8b44466ff2084e814de5 already passed 14/14 before identity freeze. Continue only release closure on one frozen v1.1.5 / 1.1.5-r1 SHA, then perform two production proofs and post-merge documentation seal. Cloud foundation is future-contract-only. v1.2 Installable Offline App is the next substantive milestone after release proof.`
# Career Mode Showdown — Current Handoff

Last updated: 2026-08-14 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

This is the concise rolling handoff and evidence trail. `PROJECT_STATE.md` owns current deployed product state. `NEXT_TASK.md` owns the normal implementation authorization boundary unless superseded by a later explicit owner instruction. `POST_V1_ROADMAP_EXECUTION.md` owns dependency direction/classification. Release and production-proof documents remain frozen evidence for the release they name.

## Completed owner-authorized candidate

On 2026-08-14 ET the owner explicitly authorized the smallest correct cross-Save/profile manager identity linkage and historical mapping foundation required before identity-safe longitudinal Analytics.

The owner specifically required source reconstruction across profile creation/reuse, Save Library, `identity.managerProfileIds`, Legacy migration/mappings, deletion/retention, Candidate A/B/C, Analytics caching and Trophy Room before mutation; no naive Analytics key swap; deterministic/browser proof; no cloud/accounts/sync/unrelated roadmap work.

Verified live `main` before implementation branch creation:

`56b7f5cff2055d67ba5ffa6b4729bb24c46718a5`

Implementation branch:

`agent/manager-identity-linkage-foundation`

Final exact candidate head:

`9bf4cc19c6ec6485c28a7dd542cbac74052d44bc`

PR:

PR #57 — `Add explicit cross-Save manager identity linkage foundation`

Exact PR #57 merge:

`95e98c13bbb4cac485531565c3577ae31286d0af`

No application/runtime release label was changed. Application milestone remains `v1.3.0 — Recovery & Device Resilience Hardening`; Installable Offline App runtime remains `1.3.0-r1`; previous whole-shell fallback remains `1.2.0-r2`; feature release version remains intentionally unassigned.

## Source-grounded identity decision now shipped

A direct profile-ID key swap is not sufficiently correct because fresh Saves can represent the same real manager with different stable Local Profiles and historical records can legitimately have unresolved manager identity.

The smallest safe semantics now in production are:

- existing stable `profile_*` identity is the longitudinal manager identity when the user explicitly reuses it;
- fresh New Showdown creation still creates fresh role profiles by default;
- a Save manager role can be explicitly reassigned to an existing Local Profile when the user knows the relationship;
- same visible names never imply equal identity and no name-based matching is performed;
- one profile cannot represent both rival roles inside one Showdown;
- the previous profile is retained rather than merged/deleted;
- Showdown and Legacy display-name labels are not rewritten by identity linkage;
- a matching Legacy copy inherits a Save-role link only through exact stable `identity.saveId` equality;
- historical-only Legacy roles can be explicitly mapped to an existing profile or explicitly returned to `null` / unresolved;
- if a historical record still corresponds to a local Save, direct historical mapping is rejected so the Save role remains the coherent mutation source;
- deleting a Save retains profiles, surviving cross-Save references and historical mappings.

No profile rename/edit, generic profile CRUD, Analytics/Trophy calculation rewrite, cloud/account/sync model, backup-envelope redesign, gameplay/scoring change or release-version assignment was included.

## Recovery / Candidate A-B-C behavior

Candidate A keeps the existing v1 backup envelope. It already projects the active Showdown with `identity.managerProfileIds`.

Candidate C Save Library preparation now preserves valid incoming active `profile_*` refs instead of regenerating them:

- an existing matching local profile is reused;
- a fresh device reconstructs only the minimum missing referenced profile entry;
- older backups without valid refs retain deterministic generated fallback profiles;
- the same profile on both rival roles is rejected;
- unrelated/non-active Saves and profiles remain preserved.

Candidate B remains read-only. Candidate C strict exact raw snapshots, stale-state checks, transaction-owned mutation, rollback ownership, anti-clobber verification and critical recovery remain unchanged.

## Transaction/concurrency correction found before publication

During final source review, one concurrency dependency was identified before the candidate was published: Legacy bytes determine whether a Save-role link must propagate even when the current operation appears not to modify Legacy.

The implementation therefore guards Legacy as an unchanged exact transaction precondition on Save-role linkage. If another tab archives or changes Legacy at the transaction boundary, linkage fails closed before an owned write rather than accepting an inconsistent Save/Legacy relationship.

This was a pre-publication design correction, not a CI/runtime failure. No product guarantee, timeout or performance ceiling was weakened.

## Permanent implementation evidence

PR #57 changed exactly these eight files:

- `js/saveLibraryRuntime.js`
- `js/saveLibraryUI.js`
- `css/saveLibrary.css`
- `tests/contracts/manager-identity-linkage-contracts.cjs`
- `tests/browser/manager-identity-linkage-audit.cjs`
- `tests/support/run-contract-suite.cjs`
- `.github/workflows/validate-stability-lane.yml`
- `00_CURRENT_HANDOFF.md`

The deterministic and Chromium evidence protects same-name distinct profiles, one manager explicitly reused across Saves, exact matching-Legacy propagation, historical map/unmap and unresolved state, profile retention after deletion, Candidate A/C identity preservation, fresh-device minimum profile reconstruction, stale Save authority, Legacy transaction-boundary drift, Settings focus and singleton non-resurrection.

## Exact PR proof

All 13 normal pull-request workflow families passed exact candidate head:

`9bf4cc19c6ec6485c28a7dd542cbac74052d44bc`

Promotion gate before merge also verified:

- live `main` had not moved from the exact branch base;
- branch was 9 commits ahead / 0 behind;
- changed-file scope was exactly the eight intended files;
- PR was mergeable;
- no submitted reviews existed;
- no unresolved review threads existed.

PR #57 was then promoted from draft and merged without moving the proven head.

## Exact production proof

Runtime feature merge:

`95e98c13bbb4cac485531565c3577ae31286d0af`

All 14 permanent push workflow families succeeded on that exact merge. Exact-head failure count was zero.

Post-merge Stability:

run `31812858587` — success

deployed-site-smoke job `94808020695` — success

That deployed job passed every production gate in sequence:

1. wait for Pages and verify every runtime byte;
2. runtime error provenance audit;
3. Home visual audit;
4. visible Save Library audit;
5. manager identity linkage browser audit;
6. licensed/crop-safe football-photo audit;
7. Candidate A backup export;
8. Candidate B read-only import analysis;
9. Candidate C atomic restore/recovery;
10. Installable Offline App/offline boundary;
11. complete production journey.

The identity foundation is therefore merged, deployed, exact-byte verified and technically production-proven.

## Authority seal

Because `PROJECT_STATE.md`, `NEXT_TASK.md` and `POST_V1_ROADMAP_EXECUTION.md` still described this newly shipped dependency as future work immediately after the runtime merge, a documentation/contract-only authority seal was opened from exact production merge `95e98c13bbb4cac485531565c3577ae31286d0af`.

Authority-seal branch:

`agent/manager-identity-authority-seal`

PR:

PR #58 — `Seal manager identity production authority`

The intended seal scope is current authority plus semantic contracts only:

- `PROJECT_STATE.md` records PR #57/merge `95e98c...` as shipped production state and keeps the current Analytics name-key limitation explicit;
- `NEXT_TASK.md` closes the identity candidate and identifies identity-safe longitudinal Career Analytics only as a separately authorized future candidate;
- `POST_V1_ROADMAP_EXECUTION.md` changes cross-Save linkage to DONE, historical mapping to FOUNDATION DONE / UNRESOLVED RECORDS PERMITTED, and identity-safe Analytics to READY / NOT AUTHORIZED;
- `tests/contracts/release-authority-coherence.cjs` requires those stronger current semantics rather than the obsolete pre-linkage classifications;
- `tests/contracts/cloud-foundation-contracts.cjs` keeps cloud future/non-authorized while advancing its dependency assertions to the now-shipped local identity semantics;
- this handoff records exact runtime proof, failures/corrections and the stop boundary.

No runtime application file is changed by the authority seal.

### Authority-seal validation failure and correction

Initial exact seal head:

`3306028fb04f45eba0a7fdb1c2716c3090e0bb5b`

`Validate Static App` run `31813946514`, job `94810992518`, failed in the repository contract suite after JavaScript syntax and dynamic static release architecture had already passed.

The exact failing assertion came from `tests/contracts/cloud-foundation-contracts.cjs`, which still required the old pre-shipment roadmap classifications:

- `Historical profile identity mapping | ACTIVE DEPENDENCY QUESTION`
- `Identity-safe longitudinal Analytics / Analytics 2.0 | BLOCKED`

Root cause: a second permanent semantic-coherence contract still encoded the pre-PR-#57 dependency state. The roadmap update was correct; the stale contract was not.

Correction:

`f2b9313817822e23f32fa73d4e7b7455c1e59e00`

The correction does not weaken cloud safeguards. It now requires:

- historical mapping `FOUNDATION DONE / UNRESOLVED RECORDS PERMITTED`;
- cross-Save manager/profile linkage `DONE`;
- identity-safe longitudinal Analytics `READY / NOT AUTHORIZED`;
- current Analytics limitation still recorded in `PROJECT_STATE.md`;
- no automatically authorized next runtime candidate in `NEXT_TASK.md`;
- Cloud Readiness/Backup still future and non-authorized;
- network-free Candidate C, storage-backend-agnostic transaction engine and revision/rollback ownership semantics still protected.

The failure and correction are documentation/contract coherence only. No production runtime byte changed and no product guarantee was weakened.

## Current Analytics boundary

Career Analytics remains name-keyed in `js/analytics.js`; Trophy Room still consumes that longitudinal output. The identity prerequisite is now solved, but the Analytics runtime correction is a separate candidate.

A future Analytics candidate, if explicitly authorized, must at minimum preserve:

- distinct same-name profiles as distinct career identities;
- one explicitly reused profile across multiple Saves as one career identity;
- unresolved historical manager identity without guessing from labels;
- Rivalry/Showdown-scoped behavior that does not require cross-history identity;
- Analytics cache invalidation after explicit identity mapping changes;
- Trophy Room coherence.

Do not start that work merely because the dependency is now technically ready.

## Open historical drafts

PR #37 / `agent/v13-hardening` and PR #35 / `agent/v1.2-installable-offline-r2` remain obsolete historical drafts, not development baselines.

## Next legal action

Validate the exact final head of `agent/manager-identity-authority-seal` across the normal PR workflow families. If that exact head is green, live `main` is still the expected `95e98c...` base, scope remains authority documents plus semantic contracts only, and there are no review blockers, merge the seal and verify its exact `main` head.

Then stop. Do not begin Career Analytics/Trophy Room aggregation, backup portability, profile editing, cloud, accounts, synchronization or another runtime candidate unless a later explicit owner instruction authorizes that separately bounded work.

# Career Mode Showdown — Save Library Authority Reconciliation Active Handoff

Last updated: 2026-08-14 ET
Status: active documentation/contract authority repair
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Branch: `agent/reconcile-save-library-bootstrap`
Pull request: #55 `Reconcile developer bootstrap with shipped Save Library UI`
Exact session base `main`: `ca4f3387d8b9c207dd77c141025bfba61285c397`
Initial branch head: `fb7e42c147ed73aa6386b633bf112109caa28fc7`

## Owner instruction and reconstructed authority

The owner supplied a continuation handoff written at the earlier Save Library runtime-cutover boundary and instructed the next developer to reconstruct live repository authority before implementation, never overwrite newer work, and then implement Visible Local Profiles / Save Library product UI.

Live GitHub reconstruction proved that the requested product phase had already been completed by newer work before this session began:

- PR #53 `Expose Local Profiles and Save Library UI`, exact final head `2021a0a2eaed26f0aca6639278de82afe2a28d6d`, merge `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`;
- PR #54 `Record visible Save Library production proof`, merge `ca4f3387d8b9c207dd77c141025bfba61285c397`.

The required current handoffs, source and runtime implementation were inspected. The visible Save Library product is production and must not be reimplemented.

Open PRs at session start were historical draft PR #37 and PR #35. Neither is current authority.

## Current product boundary confirmed

The production Save Library product already includes:

- lazy FIFA 17-inspired UI inside the existing Settings owner;
- empty, one-save and multi-save states;
- additive New Showdown creation;
- explicit `activeSaveId`;
- stable `save_*`, `profile_*` and `season_*` identities;
- explicit Save switching;
- scoped single-Save deletion;
- no implicit active replacement after active-Save deletion;
- read-only Local Profiles;
- same-name profiles remaining distinct identities;
- non-mutating old-singleton compatibility opening;
- corrupt/dual/unverifiable fail-closed state;
- mutation-focus restoration;
- phone/Chromebook/reduced-motion containment;
- Installable Offline App whole-shell inclusion.

No runtime defect was reproduced in that product boundary during this session.

## Documentation inconsistency found

`00_DEVELOPER_START_HERE.md`, the canonical developer bootstrap, still described Save Library persistence and visible UI as future work.

Later production handoffs explicitly called that text stale documentation debt.

A narrow first repair was committed on this branch:

`fb7e42c147ed73aa6386b633bf112109caa28fc7`

That commit changed only `00_DEVELOPER_START_HERE.md` and opened PR #55.

## CI failure and root cause

When PR #55 was marked ready for review, Static App run `31772445074` failed in job `94680972118`.

The failure occurred inside the complete contract suite at:

`tests/contracts/release-authority-coherence.cjs`

Exact assertion:

`NEXT_TASK.md must preserve rollback ownership semantics.`

This failure is inherited from exact session base `main`, not caused by the initial bootstrap edit. `NEXT_TASK.md` was unchanged by initial PR #55.

The same defect is independently visible on exact production-main merge `ca4f3387d8b9c207dd77c141025bfba61285c397`: push Static App run `31771921656` completed with conclusion `failure`.

Root cause:

PR #54 correctly updated current handoff/state/task documents to record Save Library UI as shipped, but the wider publication/coherence layer was not reconciled at the same time:

- `00_DEVELOPER_START_HERE.md` remained pre-feature;
- `README.md` still described one active singleton Showdown and pre-cutover canonical storage as permanent;
- `POST_V1_ROADMAP_EXECUTION.md` still described Local Profiles / Save Library as a future feature milestone;
- `tests/contracts/release-authority-coherence.cjs` still required that obsolete future-milestone wording;
- updated `NEXT_TASK.md` no longer carried every recovery/topology phrase required by the permanent coherence contract.

This is documentation and deterministic-contract drift around an already-proven production runtime. It is not justification to change Save Library runtime, recovery, gameplay, Service Worker or performance architecture.

## Bounded repair

PR #55 is being expanded only enough to restore current publication/contract coherence.

Intended files:

- `00_DEVELOPER_START_HERE.md`;
- `NEXT_TASK.md`;
- `PROJECT_STATE.md`;
- `README.md`;
- `POST_V1_ROADMAP_EXECUTION.md`;
- `tests/contracts/release-authority-coherence.cjs`;
- this active handoff.

The repair must:

- preserve `v1.3.0 — Recovery & Device Resilience Hardening` as the application milestone;
- preserve `1.3.0-r1` as the Installable Offline App runtime;
- record the completed PR #46 → #48 → #51 → #53 Save Library dependency chain;
- record pre-cutover and post-cutover three-key authority correctly;
- preserve Candidate A non-mutating export;
- preserve Candidate B read-only analysis;
- preserve Candidate C strict exact raw snapshot authority;
- preserve transaction-owned mutation and ownership-scoped reverse rollback;
- preserve exact verification, anti-clobber and corrupt-byte protections;
- preserve 14 permanent workflow families and 27 protected multiline executable blocks;
- preserve performance ceilings;
- preserve cloud/private-room work as future dependency-ordered scope;
- preserve the clean `NEXT_TASK.md` boundary with no automatically authorized new product candidate.

The coherence contract is being updated to require the shipped Save Library boundary rather than the obsolete “future feature milestone” claim. Existing safety/version/offline/workflow assertions are retained and new assertions protect current multi-save publication truth.

## Explicit non-scope

No runtime JavaScript behavior change.

No CSS or visual change.

No Service Worker change.

No gameplay or scoring change.

No Save Library persistence/recovery change.

No Candidate A/B/C behavior change.

No performance ceiling or workflow timeout change.

No release-version assignment.

No profile rename/edit, cloud, accounts, synchronization or distributed revision work.

## Validation rule

Do not merge while any applicable PR workflow is failing or still running.

If CI exposes another failure, classify it against exact current-main truth before changing anything.

Merge only from an exact green PR head with expected-head protection after live `main` is re-fetched.

After merge, verify the exact merge and applicable push workflows before declaring this authority repair closed.

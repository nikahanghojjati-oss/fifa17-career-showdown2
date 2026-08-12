# Career Mode Showdown v1.1.3 — PR Diagnostic Addendum 5

This addendum records the final validator-coherence correction after `CAREER_MODE_SHOWDOWN_V1.1.3_PR_DIAGNOSTIC_ADDENDUM_4.md`.

## Clean diagnostic head `f356396be5fce817bf16a88c604ca4c73a732a39`

The clean 13-family matrix restarted after the root-correction cycle. The owner-reported League Wheel regression gate remained green, and Home, V1 Visual, Season Review, Statistics and other early families were green.

`Validate Static App` run `31558777367`, job `93996564902`, failed only in its release-shell/document authority assertions after JavaScript syntax, navigation/scoring, club identity/reveal and other earlier checks had already passed.

Exact failing assertion:

`PROJECT_STATE current version is stale.`

## Root cause: contradictory permanent validator labels

The preceding Stability diagnostic had required:

`**Application version:** v1.1.3 — Maintenance Candidate`

so `PROJECT_STATE.md` and `README.md` had been aligned to that wording.

However, the permanent Static App workflow still intentionally asserted the already-established release label:

`**Application version:** v1.1.3 — Owner-Priority Maintenance Candidate`

and `NEXT_TASK.md` also identifies the current baseline as `v1.1.3 Owner-Priority Maintenance Candidate`.

Therefore this was not a runtime/product defect. It was a contradiction between two permanent validators over the exact documentation label.

## Canonical resolution

The canonical current-release authority remains:

`v1.1.3 — Owner-Priority Maintenance Candidate`

because it is the established owner-requested maintenance baseline already used by Static App and `NEXT_TASK.md`.

The resolution was to:

1. restore `PROJECT_STATE.md` to the owner-priority label;
2. restore `README.md` to the owner-priority label;
3. align the two Stability contract documentation assertions to the same owner-priority label;
4. leave the Static App workflow unchanged, preserving its existing release-shell checks and startup budgets.

No application runtime, gameplay, UI, photo, wheel, persistence, backup format, import-analysis behavior, or threshold changed.

## Guarded alignment proof

Temporary authority-alignment workflow run:

- run `31558890433`
- job `93996900392`
- conclusion SUCCESS

The helper required an exact changed-file set of only:

- `PROJECT_STATE.md`
- `README.md`
- `tests/contracts/stability-contracts.cjs`

It also verified that Static App still contains exactly two assertions for the canonical owner-priority label, then ran the complete deterministic contract suite.

Results:

- Stability contracts — GREEN
- Candidate A backup/storage contracts — GREEN
- Candidate B import-analysis contracts — GREEN
- final hardening contracts — GREEN

Published correction commit:

`e41d198` — `Align v1.1.3 canonical maintenance authority label`

The temporary authority-alignment workflow was removed by `06d936363addc5d3c2079141522f5197131d7249`.

## Correction to Addendum 4 wording

`CAREER_MODE_SHOWDOWN_V1.1.3_PR_DIAGNOSTIC_ADDENDUM_4.md` accurately records the failure sequence but describes `v1.1.3 — Maintenance Candidate` as the canonical label at that moment. The subsequent Static App diagnostic proved that wording conflicted with the established release authority. This addendum supersedes that narrow label conclusion: **Owner-Priority Maintenance Candidate is the canonical v1.1.3 authority label.**

The underlying root corrections from Addendum 4 remain valid and protected:

- three obsolete rejected football derivatives removed;
- Candidate A app-version provenance fallback aligned to 1.1.3 without changing backup format semantics;
- two-paint-frame visual evidence settlement restored;
- reduced-motion browser audit corrected to validate `transition-property:none` semantically while rejecting actual animation;
- all licensed visual reduced-motion safeguards retained;
- eager startup remains 164,965 raw / 37,006 gzip under the unchanged 165,000 / 37,500 ceilings.

## Next gate

This normal user-authorized handoff commit is the next clean diagnostic head. Require all 13 permanent PR gate families to complete green on this exact head. If 13/13 green, create the official-candidate handoff, freeze its resulting exact SHA, and run every permanent gate family twice independently on that same immutable pre-merge SHA before merge.
# Career Mode Showdown v1.1.3 — PR Diagnostic Addendum 2

This file continues the permanent v1.1.3 public handoff trail after the startup-budget diagnostic recorded in `CAREER_MODE_SHOWDOWN_V1.1.3_PR_DIAGNOSTIC_ADDENDUM.md`.

## Correction to the first attempted budget fix

- The first size correction shortened comments/header text in `js/leagueWheel.js` at commit `513536ca52ead07449063b22e8efb6aa552f7fb5`.
- A normal PR rerun proved the eager payload remained exactly `165,213` raw bytes.
- Conclusion: that change could not solve the startup gate because `js/leagueWheel.js` is lazy and is not one of the seven initial-shell scripts.
- This was treated as a diagnostic correction, not hidden or counted as release proof.

## Actual eager-path root trace

The initial shell remained seven JavaScript files plus `css/app.css`. The v1.1.3 eager growth relevant to the 213-byte overage was traced to:

1. `js/screens.js` — an expanded explicit set of visual-owning routes.
2. `js/optionalModules.js` — the second football-visual stylesheet chain and the longer football-visual readiness predicate.

The correction preserves the same route ownership and load ordering while representing those contracts more compactly:

- visual-owning routes are derived from the canonical `screens` list by excluding only `mainMenu` and `statistics`, which are the two routes that do not own the route-scoped football-visual subsystem;
- the two football-visual stylesheets still load in strict base-then-v1.1.3 order;
- the same three football-visual readiness functions remain mandatory before module readiness resolves.

No visual, wheel, gameplay, storage, scoring, accessibility, or release-gate behavior was removed.

## Guarded compaction execution

A temporary fail-closed helper/workflow was used only to make the exact two-file transformation and independently enforce the original budgets before publishing it.

- Temporary workflow run: `31557476297` — SUCCESS.
- Job: `93992714527` — SUCCESS.
- Exact measured eager payload after correction: **164,965 raw / 37,006 gzip**.
- Protected ceilings remain **165,000 raw / 37,500 gzip**.
- The helper also required exactly seven eager scripts, coherent `1.1.3-r1` revisions, retention of the League Wheel transition fix, and an exact changed-file set of only `js/screens.js` + `js/optionalModules.js`.
- Published bot commit shown by the successful job: short SHA `d622547`; the workflow itself pushed exactly two files with 4 insertions / 7 deletions.

GitHub intentionally does not recursively run normal Actions workflows from a workflow-token push. Any `action_required`/non-run permanent checks associated with that bot-generated commit are therefore **not validation evidence** and will not be counted.

## Temporary machinery cleanup

The temporary build machinery has been removed from the candidate:

- `.github/workflows/temporary-compact-v113-eager.yml` removed by `71674d8d8faf59fecae825c00fef8f833c74dab8`.
- `tools/temporary_compact_v113_eager.py` removed by `8d788adaff7240bddfc9e4dd664b381479534316`.
- PR #19 remained open and mergeable after cleanup.

This addendum commit is a normal user-authorized repository write and therefore becomes the next clean diagnostic head that should receive the permanent PR matrix.

## Evidence classification

- `31554204791`: real diagnostic startup-budget failure, 165,213 > 165,000.
- First lazy-module comment compaction: ineffective for eager budget; preserved as diagnostic history.
- `31557476297` / `93992714527`: guarded transformation proof only; not a substitute for the permanent matrix.
- Next requirement: all 13 permanent PR gate families must complete green on a clean candidate head. Only after that may one exact SHA be frozen for the independent official two-pass pre-merge proof.
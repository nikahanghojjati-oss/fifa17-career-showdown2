# JOB-1010 · 10-season scoring, history and final math report

Source: `gameplay/bug-list-1` at `7c152d8f6283727da2cd6f862f4c874dda2815a9`.
Runtime: Node v24.19.0, built-in Web Crypto. Run date: 2026-10-06T02:31:46.835Z.
Command: `node project-documents/gameplay-factory/sweeps/ten-season-check.cjs`.
Exit code: **0**. Final output: **10 ten-season cases; 532 comparisons; 0 bugs found.**

## Findings

No mismatches remain in the final sweep. No game bugs found in these cases.
Daniel is `playerOne`; Nik is `playerTwo`. Arrays show Daniel's points, Nik's points, then winner.

| Case | Expected final | Actual final |
| --- | --- | --- |
| All zeros | 0–0, DRAW | 0–0, DRAW |
| Daniel max every season | 110–0, Daniel | 110–0, Daniel |
| Alternating max wins | 55–55, DRAW | 55–55, DRAW |
| Every season tied on points, split by league position | 0–0, DRAW; 5 season wins each | 0–0, DRAW; 5 season wins each |
| Equal totals, unequal season wins | 5–5, DRAW; Daniel 5 wins, Nik 1 win | 5–5, DRAW; Daniel 5 wins, Nik 1 win |
| Both triggers in each bonus category, season 5 | 2–1, Daniel; each bonus capped at 1 | 2–1, Daniel; each bonus capped at 1 |
| Nik missing season 5 | No final; only 4 contiguous seasons accepted, 44–0 | BLOCKED; 4 accepted, 44–0 |
| Nik max every season | 0–110, Nik | 0–110, Nik |
| Equal position, different league points | 0–0, DRAW; 5 season wins each | 0–0, DRAW; 5 season wins each |
| Individual rewards and 99/100 thresholds | 26–0, Daniel | 26–0, Daniel |

The missing entry is not counted as zero:
- Publication remains COLLECTING (`js/sharedSeasonResults.js:68-69`).
- Commit rejects it with SEASON_COMMIT_RESULTS_NOT_READY (`js/sharedSeasonCommit.js:35-39`).
- Direct scoring rejects null with CANONICAL_SCORING_RESULTS_INVALID (`js/sharedCanonicalScoring.js:19,25,36`).
- History rejects a missing manager with HISTORY_CONVERGENCE_RESULTS_INVALID (`js/sharedHistoryConvergence.js:25-26,72-76`).
- The real four-season progression remains nonterminal, so final reconciliation returns BLOCKED / multi-season-not-terminal (`js/sharedFinalReconciliation.js:40`).
- Even a synthetic terminal wrapper cannot finalize the four-season prefix: FINAL_RECONCILIATION_HISTORY_INCOMPLETE (`js/sharedFinalReconciliation.js:25`).
- Seasons 6–10 are scored independently for diagnostic coverage; they are not accepted into contiguous history past the gap.

## Method and scope

The script requires unmodified CommonJS game modules. Each complete fixture actually publishes both results through `sharedSeasonResults`, commits and acknowledges through `sharedSeasonCommit`, reconciles and verifies canonical scoring, builds and verifies cumulative history, observes contiguous progression, and reconciles/verifies the final for both manager bindings. Expected season points/winners are explicit fixture values independent of the game implementation; final expected totals sum those fixture values. Every season prints expected versus actual points/winner and bonus caps; every accepted prefix checks cumulative history; final W/L/D records are checked.

Scoring follows the Rule Book in `visual-assets/v10_1/season-results/app-shell.html:41-48`: 5/3/1 trophy points, OR-capped performance and awards bonuses, maximum 11. A zero-score result uses valid league position 20, zero points/goals, and false trophies/awards. The existing equal-position league-points tiebreak is also exercised. Final ties stay draws despite differing numbers of season wins.

The first local run exposed an **oracle fixture error**, not a game bug: the below-threshold fixture had 99 league points against 0 at equal positions but expected a season draw. The implementation correctly applied the documented league-points tiebreak (`js/sharedCanonicalScoring.js:31`). The opposing fixture now also has 99 points/goals, isolating the 99/100 scoring boundary. The complete rerun below is the final evidence.

Production wrappers were read but their lifecycle operations were not invoked:
- `productionSharedSeasonResults` open/refresh need the browser runtime loader, account/Firebase services, and UI (`js/productionSharedSeasonResults.js:24-37,55-83,157-167`).
- `productionSharedCanonicalScoring` refresh needs the same runtime/provider services (`js/productionSharedCanonicalScoring.js:22-35,93`).
- `productionSharedHistoryConvergence` refresh needs setup/commit/scoring/provider services (`js/productionSharedHistoryConvergence.js:24-40,111`).
- `productionSharedFinalReconciliation` refresh/render need active-save authority, runtime dependencies and DOM (`js/productionSharedFinalReconciliation.js:25-35,45-78`). Its existing draw-to-DRAW rendering at line 51 was read; Node verifies the underlying `winner: "draw"`, not the displayed screen.
- `js/scoring.js` has local calculators but no CommonJS exports, so requiring it does not expose callable functions. The sweep does not extract or alter its source.

The read-only provider envelope shapes are assembled from real protocol projections; no Firebase provider, concurrency, security Rules, network, browser smoothness, local Apply or production state is tested. This report establishes the bounded pure-math cases, not an end-to-end device journey. No game code, tests or workflows changed. Per handbook §9b, no CI check was triggered, read, rerun or waited on; the lead checks CI.

## Bugs

**0.** There are no case/season/expected/actual mismatches to list from the final run. If a future run finds one, the script prints a BUG line and BUG DETAIL with the case, season/final label, expected, actual and game file:line, and exits 1. Harness failures exit 2.

## Full output

```text
JOB-1010: 10-season pure shared Showdown sweep; Daniel=playerOne, Nik=playerTwo
Rules: CL 5, league 3, cup 1, performance OR 1, awards OR 1; season max 11; final equal totals DRAW.
Browser/provider lifecycle APIs and legacy unexported js/scoring.js functions are not invoked.

CASE all zeros
PASS all zeros / season 1 points/winner: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:26-31,39
PASS all zeros / season 1 direct calculation: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:36
PASS all zeros / season 1 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS all zeros / season 1 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS all zeros / season 1 history/totals: expected=[1,0,0,"draw"] actual=[1,0,0,"draw"] source=js/sharedHistoryConvergence.js:88-109
PASS all zeros / season 2 points/winner: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:26-31,39
PASS all zeros / season 2 direct calculation: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:36
PASS all zeros / season 2 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS all zeros / season 2 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS all zeros / season 2 history/totals: expected=[2,0,0,"draw"] actual=[2,0,0,"draw"] source=js/sharedHistoryConvergence.js:88-109
PASS all zeros / season 3 points/winner: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:26-31,39
PASS all zeros / season 3 direct calculation: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:36
PASS all zeros / season 3 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS all zeros / season 3 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS all zeros / season 3 history/totals: expected=[3,0,0,"draw"] actual=[3,0,0,"draw"] source=js/sharedHistoryConvergence.js:88-109
PASS all zeros / season 4 points/winner: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:26-31,39
PASS all zeros / season 4 direct calculation: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:36
PASS all zeros / season 4 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS all zeros / season 4 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS all zeros / season 4 history/totals: expected=[4,0,0,"draw"] actual=[4,0,0,"draw"] source=js/sharedHistoryConvergence.js:88-109
PASS all zeros / season 5 points/winner: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:26-31,39
PASS all zeros / season 5 direct calculation: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:36
PASS all zeros / season 5 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS all zeros / season 5 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS all zeros / season 5 history/totals: expected=[5,0,0,"draw"] actual=[5,0,0,"draw"] source=js/sharedHistoryConvergence.js:88-109
PASS all zeros / season 6 points/winner: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:26-31,39
PASS all zeros / season 6 direct calculation: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:36
PASS all zeros / season 6 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS all zeros / season 6 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS all zeros / season 6 history/totals: expected=[6,0,0,"draw"] actual=[6,0,0,"draw"] source=js/sharedHistoryConvergence.js:88-109
PASS all zeros / season 7 points/winner: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:26-31,39
PASS all zeros / season 7 direct calculation: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:36
PASS all zeros / season 7 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS all zeros / season 7 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS all zeros / season 7 history/totals: expected=[7,0,0,"draw"] actual=[7,0,0,"draw"] source=js/sharedHistoryConvergence.js:88-109
PASS all zeros / season 8 points/winner: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:26-31,39
PASS all zeros / season 8 direct calculation: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:36
PASS all zeros / season 8 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS all zeros / season 8 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS all zeros / season 8 history/totals: expected=[8,0,0,"draw"] actual=[8,0,0,"draw"] source=js/sharedHistoryConvergence.js:88-109
PASS all zeros / season 9 points/winner: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:26-31,39
PASS all zeros / season 9 direct calculation: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:36
PASS all zeros / season 9 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS all zeros / season 9 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS all zeros / season 9 history/totals: expected=[9,0,0,"draw"] actual=[9,0,0,"draw"] source=js/sharedHistoryConvergence.js:88-109
PASS all zeros / season 10 points/winner: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:26-31,39
PASS all zeros / season 10 direct calculation: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:36
PASS all zeros / season 10 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS all zeros / season 10 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS all zeros / season 10 history/totals: expected=[10,0,0,"draw"] actual=[10,0,0,"draw"] source=js/sharedHistoryConvergence.js:88-109
PASS all zeros / final (playerOne): expected=[0,0,"DRAW",10,true,null,false] actual=[0,0,"DRAW",10,true,null,false] source=js/sharedFinalReconciliation.js:47-49
PASS all zeros / final (playerTwo): expected=[0,0,"DRAW",10,true,null,false] actual=[0,0,"DRAW",10,true,null,false] source=js/sharedFinalReconciliation.js:47-49
PASS all zeros / final playerOne history W/L/D: expected=[0,0,10] actual=[0,0,10] source=js/sharedHistoryConvergence.js:90
PASS all zeros / final playerTwo history W/L/D: expected=[0,0,10] actual=[0,0,10] source=js/sharedHistoryConvergence.js:90

CASE Daniel maximum every season (110)
PASS Daniel maximum every season (110) / season 1 points/winner: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Daniel maximum every season (110) / season 1 direct calculation: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS Daniel maximum every season (110) / season 1 playerOne bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Daniel maximum every season (110) / season 1 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Daniel maximum every season (110) / season 1 history/totals: expected=[1,11,0,"playerOne"] actual=[1,11,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS Daniel maximum every season (110) / season 2 points/winner: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Daniel maximum every season (110) / season 2 direct calculation: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS Daniel maximum every season (110) / season 2 playerOne bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Daniel maximum every season (110) / season 2 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Daniel maximum every season (110) / season 2 history/totals: expected=[2,22,0,"playerOne"] actual=[2,22,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS Daniel maximum every season (110) / season 3 points/winner: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Daniel maximum every season (110) / season 3 direct calculation: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS Daniel maximum every season (110) / season 3 playerOne bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Daniel maximum every season (110) / season 3 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Daniel maximum every season (110) / season 3 history/totals: expected=[3,33,0,"playerOne"] actual=[3,33,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS Daniel maximum every season (110) / season 4 points/winner: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Daniel maximum every season (110) / season 4 direct calculation: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS Daniel maximum every season (110) / season 4 playerOne bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Daniel maximum every season (110) / season 4 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Daniel maximum every season (110) / season 4 history/totals: expected=[4,44,0,"playerOne"] actual=[4,44,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS Daniel maximum every season (110) / season 5 points/winner: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Daniel maximum every season (110) / season 5 direct calculation: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS Daniel maximum every season (110) / season 5 playerOne bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Daniel maximum every season (110) / season 5 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Daniel maximum every season (110) / season 5 history/totals: expected=[5,55,0,"playerOne"] actual=[5,55,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS Daniel maximum every season (110) / season 6 points/winner: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Daniel maximum every season (110) / season 6 direct calculation: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS Daniel maximum every season (110) / season 6 playerOne bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Daniel maximum every season (110) / season 6 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Daniel maximum every season (110) / season 6 history/totals: expected=[6,66,0,"playerOne"] actual=[6,66,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS Daniel maximum every season (110) / season 7 points/winner: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Daniel maximum every season (110) / season 7 direct calculation: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS Daniel maximum every season (110) / season 7 playerOne bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Daniel maximum every season (110) / season 7 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Daniel maximum every season (110) / season 7 history/totals: expected=[7,77,0,"playerOne"] actual=[7,77,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS Daniel maximum every season (110) / season 8 points/winner: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Daniel maximum every season (110) / season 8 direct calculation: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS Daniel maximum every season (110) / season 8 playerOne bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Daniel maximum every season (110) / season 8 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Daniel maximum every season (110) / season 8 history/totals: expected=[8,88,0,"playerOne"] actual=[8,88,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS Daniel maximum every season (110) / season 9 points/winner: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Daniel maximum every season (110) / season 9 direct calculation: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS Daniel maximum every season (110) / season 9 playerOne bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Daniel maximum every season (110) / season 9 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Daniel maximum every season (110) / season 9 history/totals: expected=[9,99,0,"playerOne"] actual=[9,99,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS Daniel maximum every season (110) / season 10 points/winner: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Daniel maximum every season (110) / season 10 direct calculation: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS Daniel maximum every season (110) / season 10 playerOne bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Daniel maximum every season (110) / season 10 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Daniel maximum every season (110) / season 10 history/totals: expected=[10,110,0,"playerOne"] actual=[10,110,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS Daniel maximum every season (110) / final (playerOne): expected=[110,0,"playerOne",10,true,null,false] actual=[110,0,"playerOne",10,true,null,false] source=js/sharedFinalReconciliation.js:47-49
PASS Daniel maximum every season (110) / final (playerTwo): expected=[110,0,"playerOne",10,true,null,false] actual=[110,0,"playerOne",10,true,null,false] source=js/sharedFinalReconciliation.js:47-49
PASS Daniel maximum every season (110) / final playerOne history W/L/D: expected=[10,0,0] actual=[10,0,0] source=js/sharedHistoryConvergence.js:90
PASS Daniel maximum every season (110) / final playerTwo history W/L/D: expected=[0,10,0] actual=[0,10,0] source=js/sharedHistoryConvergence.js:90

CASE alternating wins
PASS alternating wins / season 1 points/winner: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS alternating wins / season 1 direct calculation: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS alternating wins / season 1 playerOne bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS alternating wins / season 1 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS alternating wins / season 1 history/totals: expected=[1,11,0,"playerOne"] actual=[1,11,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS alternating wins / season 2 points/winner: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:26-31,39
PASS alternating wins / season 2 direct calculation: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:36
PASS alternating wins / season 2 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS alternating wins / season 2 playerTwo bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS alternating wins / season 2 history/totals: expected=[2,11,11,"playerTwo"] actual=[2,11,11,"playerTwo"] source=js/sharedHistoryConvergence.js:88-109
PASS alternating wins / season 3 points/winner: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS alternating wins / season 3 direct calculation: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS alternating wins / season 3 playerOne bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS alternating wins / season 3 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS alternating wins / season 3 history/totals: expected=[3,22,11,"playerOne"] actual=[3,22,11,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS alternating wins / season 4 points/winner: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:26-31,39
PASS alternating wins / season 4 direct calculation: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:36
PASS alternating wins / season 4 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS alternating wins / season 4 playerTwo bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS alternating wins / season 4 history/totals: expected=[4,22,22,"playerTwo"] actual=[4,22,22,"playerTwo"] source=js/sharedHistoryConvergence.js:88-109
PASS alternating wins / season 5 points/winner: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS alternating wins / season 5 direct calculation: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS alternating wins / season 5 playerOne bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS alternating wins / season 5 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS alternating wins / season 5 history/totals: expected=[5,33,22,"playerOne"] actual=[5,33,22,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS alternating wins / season 6 points/winner: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:26-31,39
PASS alternating wins / season 6 direct calculation: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:36
PASS alternating wins / season 6 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS alternating wins / season 6 playerTwo bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS alternating wins / season 6 history/totals: expected=[6,33,33,"playerTwo"] actual=[6,33,33,"playerTwo"] source=js/sharedHistoryConvergence.js:88-109
PASS alternating wins / season 7 points/winner: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS alternating wins / season 7 direct calculation: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS alternating wins / season 7 playerOne bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS alternating wins / season 7 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS alternating wins / season 7 history/totals: expected=[7,44,33,"playerOne"] actual=[7,44,33,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS alternating wins / season 8 points/winner: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:26-31,39
PASS alternating wins / season 8 direct calculation: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:36
PASS alternating wins / season 8 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS alternating wins / season 8 playerTwo bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS alternating wins / season 8 history/totals: expected=[8,44,44,"playerTwo"] actual=[8,44,44,"playerTwo"] source=js/sharedHistoryConvergence.js:88-109
PASS alternating wins / season 9 points/winner: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS alternating wins / season 9 direct calculation: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS alternating wins / season 9 playerOne bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS alternating wins / season 9 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS alternating wins / season 9 history/totals: expected=[9,55,44,"playerOne"] actual=[9,55,44,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS alternating wins / season 10 points/winner: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:26-31,39
PASS alternating wins / season 10 direct calculation: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:36
PASS alternating wins / season 10 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS alternating wins / season 10 playerTwo bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS alternating wins / season 10 history/totals: expected=[10,55,55,"playerTwo"] actual=[10,55,55,"playerTwo"] source=js/sharedHistoryConvergence.js:88-109
PASS alternating wins / final (playerOne): expected=[55,55,"DRAW",10,true,null,false] actual=[55,55,"DRAW",10,true,null,false] source=js/sharedFinalReconciliation.js:47-49
PASS alternating wins / final (playerTwo): expected=[55,55,"DRAW",10,true,null,false] actual=[55,55,"DRAW",10,true,null,false] source=js/sharedFinalReconciliation.js:47-49
PASS alternating wins / final playerOne history W/L/D: expected=[5,5,0] actual=[5,5,0] source=js/sharedHistoryConvergence.js:90
PASS alternating wins / final playerTwo history W/L/D: expected=[5,5,0] actual=[5,5,0] source=js/sharedHistoryConvergence.js:90

CASE points tied, split by league position
PASS points tied, split by league position / season 1 points/winner: expected=[0,0,"playerOne"] actual=[0,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS points tied, split by league position / season 1 direct calculation: expected=[0,0,"playerOne"] actual=[0,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS points tied, split by league position / season 1 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS points tied, split by league position / season 1 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS points tied, split by league position / season 1 history/totals: expected=[1,0,0,"playerOne"] actual=[1,0,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS points tied, split by league position / season 2 points/winner: expected=[0,0,"playerTwo"] actual=[0,0,"playerTwo"] source=js/sharedCanonicalScoring.js:26-31,39
PASS points tied, split by league position / season 2 direct calculation: expected=[0,0,"playerTwo"] actual=[0,0,"playerTwo"] source=js/sharedCanonicalScoring.js:36
PASS points tied, split by league position / season 2 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS points tied, split by league position / season 2 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS points tied, split by league position / season 2 history/totals: expected=[2,0,0,"playerTwo"] actual=[2,0,0,"playerTwo"] source=js/sharedHistoryConvergence.js:88-109
PASS points tied, split by league position / season 3 points/winner: expected=[0,0,"playerOne"] actual=[0,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS points tied, split by league position / season 3 direct calculation: expected=[0,0,"playerOne"] actual=[0,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS points tied, split by league position / season 3 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS points tied, split by league position / season 3 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS points tied, split by league position / season 3 history/totals: expected=[3,0,0,"playerOne"] actual=[3,0,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS points tied, split by league position / season 4 points/winner: expected=[0,0,"playerTwo"] actual=[0,0,"playerTwo"] source=js/sharedCanonicalScoring.js:26-31,39
PASS points tied, split by league position / season 4 direct calculation: expected=[0,0,"playerTwo"] actual=[0,0,"playerTwo"] source=js/sharedCanonicalScoring.js:36
PASS points tied, split by league position / season 4 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS points tied, split by league position / season 4 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS points tied, split by league position / season 4 history/totals: expected=[4,0,0,"playerTwo"] actual=[4,0,0,"playerTwo"] source=js/sharedHistoryConvergence.js:88-109
PASS points tied, split by league position / season 5 points/winner: expected=[0,0,"playerOne"] actual=[0,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS points tied, split by league position / season 5 direct calculation: expected=[0,0,"playerOne"] actual=[0,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS points tied, split by league position / season 5 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS points tied, split by league position / season 5 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS points tied, split by league position / season 5 history/totals: expected=[5,0,0,"playerOne"] actual=[5,0,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS points tied, split by league position / season 6 points/winner: expected=[0,0,"playerTwo"] actual=[0,0,"playerTwo"] source=js/sharedCanonicalScoring.js:26-31,39
PASS points tied, split by league position / season 6 direct calculation: expected=[0,0,"playerTwo"] actual=[0,0,"playerTwo"] source=js/sharedCanonicalScoring.js:36
PASS points tied, split by league position / season 6 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS points tied, split by league position / season 6 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS points tied, split by league position / season 6 history/totals: expected=[6,0,0,"playerTwo"] actual=[6,0,0,"playerTwo"] source=js/sharedHistoryConvergence.js:88-109
PASS points tied, split by league position / season 7 points/winner: expected=[0,0,"playerOne"] actual=[0,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS points tied, split by league position / season 7 direct calculation: expected=[0,0,"playerOne"] actual=[0,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS points tied, split by league position / season 7 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS points tied, split by league position / season 7 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS points tied, split by league position / season 7 history/totals: expected=[7,0,0,"playerOne"] actual=[7,0,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS points tied, split by league position / season 8 points/winner: expected=[0,0,"playerTwo"] actual=[0,0,"playerTwo"] source=js/sharedCanonicalScoring.js:26-31,39
PASS points tied, split by league position / season 8 direct calculation: expected=[0,0,"playerTwo"] actual=[0,0,"playerTwo"] source=js/sharedCanonicalScoring.js:36
PASS points tied, split by league position / season 8 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS points tied, split by league position / season 8 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS points tied, split by league position / season 8 history/totals: expected=[8,0,0,"playerTwo"] actual=[8,0,0,"playerTwo"] source=js/sharedHistoryConvergence.js:88-109
PASS points tied, split by league position / season 9 points/winner: expected=[0,0,"playerOne"] actual=[0,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS points tied, split by league position / season 9 direct calculation: expected=[0,0,"playerOne"] actual=[0,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS points tied, split by league position / season 9 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS points tied, split by league position / season 9 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS points tied, split by league position / season 9 history/totals: expected=[9,0,0,"playerOne"] actual=[9,0,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS points tied, split by league position / season 10 points/winner: expected=[0,0,"playerTwo"] actual=[0,0,"playerTwo"] source=js/sharedCanonicalScoring.js:26-31,39
PASS points tied, split by league position / season 10 direct calculation: expected=[0,0,"playerTwo"] actual=[0,0,"playerTwo"] source=js/sharedCanonicalScoring.js:36
PASS points tied, split by league position / season 10 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS points tied, split by league position / season 10 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS points tied, split by league position / season 10 history/totals: expected=[10,0,0,"playerTwo"] actual=[10,0,0,"playerTwo"] source=js/sharedHistoryConvergence.js:88-109
PASS points tied, split by league position / final (playerOne): expected=[0,0,"DRAW",10,true,null,false] actual=[0,0,"DRAW",10,true,null,false] source=js/sharedFinalReconciliation.js:47-49
PASS points tied, split by league position / final (playerTwo): expected=[0,0,"DRAW",10,true,null,false] actual=[0,0,"DRAW",10,true,null,false] source=js/sharedFinalReconciliation.js:47-49
PASS points tied, split by league position / final playerOne history W/L/D: expected=[5,5,0] actual=[5,5,0] source=js/sharedHistoryConvergence.js:90
PASS points tied, split by league position / final playerTwo history W/L/D: expected=[5,5,0] actual=[5,5,0] source=js/sharedHistoryConvergence.js:90

CASE final total tie despite unequal season wins
PASS final total tie despite unequal season wins / season 1 points/winner: expected=[1,0,"playerOne"] actual=[1,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS final total tie despite unequal season wins / season 1 direct calculation: expected=[1,0,"playerOne"] actual=[1,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS final total tie despite unequal season wins / season 1 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS final total tie despite unequal season wins / season 1 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS final total tie despite unequal season wins / season 1 history/totals: expected=[1,1,0,"playerOne"] actual=[1,1,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS final total tie despite unequal season wins / season 2 points/winner: expected=[1,0,"playerOne"] actual=[1,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS final total tie despite unequal season wins / season 2 direct calculation: expected=[1,0,"playerOne"] actual=[1,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS final total tie despite unequal season wins / season 2 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS final total tie despite unequal season wins / season 2 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS final total tie despite unequal season wins / season 2 history/totals: expected=[2,2,0,"playerOne"] actual=[2,2,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS final total tie despite unequal season wins / season 3 points/winner: expected=[1,0,"playerOne"] actual=[1,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS final total tie despite unequal season wins / season 3 direct calculation: expected=[1,0,"playerOne"] actual=[1,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS final total tie despite unequal season wins / season 3 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS final total tie despite unequal season wins / season 3 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS final total tie despite unequal season wins / season 3 history/totals: expected=[3,3,0,"playerOne"] actual=[3,3,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS final total tie despite unequal season wins / season 4 points/winner: expected=[1,0,"playerOne"] actual=[1,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS final total tie despite unequal season wins / season 4 direct calculation: expected=[1,0,"playerOne"] actual=[1,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS final total tie despite unequal season wins / season 4 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS final total tie despite unequal season wins / season 4 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS final total tie despite unequal season wins / season 4 history/totals: expected=[4,4,0,"playerOne"] actual=[4,4,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS final total tie despite unequal season wins / season 5 points/winner: expected=[1,0,"playerOne"] actual=[1,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS final total tie despite unequal season wins / season 5 direct calculation: expected=[1,0,"playerOne"] actual=[1,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS final total tie despite unequal season wins / season 5 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS final total tie despite unequal season wins / season 5 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS final total tie despite unequal season wins / season 5 history/totals: expected=[5,5,0,"playerOne"] actual=[5,5,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS final total tie despite unequal season wins / season 6 points/winner: expected=[0,5,"playerTwo"] actual=[0,5,"playerTwo"] source=js/sharedCanonicalScoring.js:26-31,39
PASS final total tie despite unequal season wins / season 6 direct calculation: expected=[0,5,"playerTwo"] actual=[0,5,"playerTwo"] source=js/sharedCanonicalScoring.js:36
PASS final total tie despite unequal season wins / season 6 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS final total tie despite unequal season wins / season 6 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS final total tie despite unequal season wins / season 6 history/totals: expected=[6,5,5,"playerTwo"] actual=[6,5,5,"playerTwo"] source=js/sharedHistoryConvergence.js:88-109
PASS final total tie despite unequal season wins / season 7 points/winner: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:26-31,39
PASS final total tie despite unequal season wins / season 7 direct calculation: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:36
PASS final total tie despite unequal season wins / season 7 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS final total tie despite unequal season wins / season 7 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS final total tie despite unequal season wins / season 7 history/totals: expected=[7,5,5,"draw"] actual=[7,5,5,"draw"] source=js/sharedHistoryConvergence.js:88-109
PASS final total tie despite unequal season wins / season 8 points/winner: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:26-31,39
PASS final total tie despite unequal season wins / season 8 direct calculation: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:36
PASS final total tie despite unequal season wins / season 8 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS final total tie despite unequal season wins / season 8 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS final total tie despite unequal season wins / season 8 history/totals: expected=[8,5,5,"draw"] actual=[8,5,5,"draw"] source=js/sharedHistoryConvergence.js:88-109
PASS final total tie despite unequal season wins / season 9 points/winner: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:26-31,39
PASS final total tie despite unequal season wins / season 9 direct calculation: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:36
PASS final total tie despite unequal season wins / season 9 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS final total tie despite unequal season wins / season 9 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS final total tie despite unequal season wins / season 9 history/totals: expected=[9,5,5,"draw"] actual=[9,5,5,"draw"] source=js/sharedHistoryConvergence.js:88-109
PASS final total tie despite unequal season wins / season 10 points/winner: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:26-31,39
PASS final total tie despite unequal season wins / season 10 direct calculation: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:36
PASS final total tie despite unequal season wins / season 10 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS final total tie despite unequal season wins / season 10 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS final total tie despite unequal season wins / season 10 history/totals: expected=[10,5,5,"draw"] actual=[10,5,5,"draw"] source=js/sharedHistoryConvergence.js:88-109
PASS final total tie despite unequal season wins / final (playerOne): expected=[5,5,"DRAW",10,true,null,false] actual=[5,5,"DRAW",10,true,null,false] source=js/sharedFinalReconciliation.js:47-49
PASS final total tie despite unequal season wins / final (playerTwo): expected=[5,5,"DRAW",10,true,null,false] actual=[5,5,"DRAW",10,true,null,false] source=js/sharedFinalReconciliation.js:47-49
PASS final total tie despite unequal season wins / final playerOne history W/L/D: expected=[5,1,4] actual=[5,1,4] source=js/sharedHistoryConvergence.js:90
PASS final total tie despite unequal season wins / final playerTwo history W/L/D: expected=[1,5,4] actual=[1,5,4] source=js/sharedHistoryConvergence.js:90

CASE both bonus triggers claimed twice in season 5
PASS both bonus triggers claimed twice in season 5 / season 1 points/winner: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:26-31,39
PASS both bonus triggers claimed twice in season 5 / season 1 direct calculation: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:36
PASS both bonus triggers claimed twice in season 5 / season 1 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS both bonus triggers claimed twice in season 5 / season 1 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS both bonus triggers claimed twice in season 5 / season 1 history/totals: expected=[1,0,0,"draw"] actual=[1,0,0,"draw"] source=js/sharedHistoryConvergence.js:88-109
PASS both bonus triggers claimed twice in season 5 / season 2 points/winner: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:26-31,39
PASS both bonus triggers claimed twice in season 5 / season 2 direct calculation: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:36
PASS both bonus triggers claimed twice in season 5 / season 2 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS both bonus triggers claimed twice in season 5 / season 2 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS both bonus triggers claimed twice in season 5 / season 2 history/totals: expected=[2,0,0,"draw"] actual=[2,0,0,"draw"] source=js/sharedHistoryConvergence.js:88-109
PASS both bonus triggers claimed twice in season 5 / season 3 points/winner: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:26-31,39
PASS both bonus triggers claimed twice in season 5 / season 3 direct calculation: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:36
PASS both bonus triggers claimed twice in season 5 / season 3 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS both bonus triggers claimed twice in season 5 / season 3 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS both bonus triggers claimed twice in season 5 / season 3 history/totals: expected=[3,0,0,"draw"] actual=[3,0,0,"draw"] source=js/sharedHistoryConvergence.js:88-109
PASS both bonus triggers claimed twice in season 5 / season 4 points/winner: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:26-31,39
PASS both bonus triggers claimed twice in season 5 / season 4 direct calculation: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:36
PASS both bonus triggers claimed twice in season 5 / season 4 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS both bonus triggers claimed twice in season 5 / season 4 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS both bonus triggers claimed twice in season 5 / season 4 history/totals: expected=[4,0,0,"draw"] actual=[4,0,0,"draw"] source=js/sharedHistoryConvergence.js:88-109
PASS both bonus triggers claimed twice in season 5 / season 5 points/winner: expected=[2,1,"playerOne"] actual=[2,1,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS both bonus triggers claimed twice in season 5 / season 5 direct calculation: expected=[2,1,"playerOne"] actual=[2,1,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS both bonus triggers claimed twice in season 5 / season 5 playerOne bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS both bonus triggers claimed twice in season 5 / season 5 playerTwo bonus caps: expected=[1,0] actual=[1,0] source=js/sharedCanonicalScoring.js:28
PASS both bonus triggers claimed twice in season 5 / season 5 history/totals: expected=[5,2,1,"playerOne"] actual=[5,2,1,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS both bonus triggers claimed twice in season 5 / season 6 points/winner: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:26-31,39
PASS both bonus triggers claimed twice in season 5 / season 6 direct calculation: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:36
PASS both bonus triggers claimed twice in season 5 / season 6 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS both bonus triggers claimed twice in season 5 / season 6 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS both bonus triggers claimed twice in season 5 / season 6 history/totals: expected=[6,2,1,"draw"] actual=[6,2,1,"draw"] source=js/sharedHistoryConvergence.js:88-109
PASS both bonus triggers claimed twice in season 5 / season 7 points/winner: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:26-31,39
PASS both bonus triggers claimed twice in season 5 / season 7 direct calculation: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:36
PASS both bonus triggers claimed twice in season 5 / season 7 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS both bonus triggers claimed twice in season 5 / season 7 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS both bonus triggers claimed twice in season 5 / season 7 history/totals: expected=[7,2,1,"draw"] actual=[7,2,1,"draw"] source=js/sharedHistoryConvergence.js:88-109
PASS both bonus triggers claimed twice in season 5 / season 8 points/winner: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:26-31,39
PASS both bonus triggers claimed twice in season 5 / season 8 direct calculation: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:36
PASS both bonus triggers claimed twice in season 5 / season 8 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS both bonus triggers claimed twice in season 5 / season 8 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS both bonus triggers claimed twice in season 5 / season 8 history/totals: expected=[8,2,1,"draw"] actual=[8,2,1,"draw"] source=js/sharedHistoryConvergence.js:88-109
PASS both bonus triggers claimed twice in season 5 / season 9 points/winner: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:26-31,39
PASS both bonus triggers claimed twice in season 5 / season 9 direct calculation: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:36
PASS both bonus triggers claimed twice in season 5 / season 9 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS both bonus triggers claimed twice in season 5 / season 9 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS both bonus triggers claimed twice in season 5 / season 9 history/totals: expected=[9,2,1,"draw"] actual=[9,2,1,"draw"] source=js/sharedHistoryConvergence.js:88-109
PASS both bonus triggers claimed twice in season 5 / season 10 points/winner: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:26-31,39
PASS both bonus triggers claimed twice in season 5 / season 10 direct calculation: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:36
PASS both bonus triggers claimed twice in season 5 / season 10 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS both bonus triggers claimed twice in season 5 / season 10 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS both bonus triggers claimed twice in season 5 / season 10 history/totals: expected=[10,2,1,"draw"] actual=[10,2,1,"draw"] source=js/sharedHistoryConvergence.js:88-109
PASS both bonus triggers claimed twice in season 5 / final (playerOne): expected=[2,1,"playerOne",10,true,null,false] actual=[2,1,"playerOne",10,true,null,false] source=js/sharedFinalReconciliation.js:47-49
PASS both bonus triggers claimed twice in season 5 / final (playerTwo): expected=[2,1,"playerOne",10,true,null,false] actual=[2,1,"playerOne",10,true,null,false] source=js/sharedFinalReconciliation.js:47-49
PASS both bonus triggers claimed twice in season 5 / final playerOne history W/L/D: expected=[1,0,9] actual=[1,0,9] source=js/sharedHistoryConvergence.js:90
PASS both bonus triggers claimed twice in season 5 / final playerTwo history W/L/D: expected=[0,1,9] actual=[0,1,9] source=js/sharedHistoryConvergence.js:90

CASE Nik missing season 5 entry
PASS Nik missing season 5 entry / season 1 points/winner: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Nik missing season 5 entry / season 1 direct calculation: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS Nik missing season 5 entry / season 1 playerOne bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Nik missing season 5 entry / season 1 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Nik missing season 5 entry / season 1 history/totals: expected=[1,11,0,"playerOne"] actual=[1,11,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS Nik missing season 5 entry / season 2 points/winner: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Nik missing season 5 entry / season 2 direct calculation: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS Nik missing season 5 entry / season 2 playerOne bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Nik missing season 5 entry / season 2 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Nik missing season 5 entry / season 2 history/totals: expected=[2,22,0,"playerOne"] actual=[2,22,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS Nik missing season 5 entry / season 3 points/winner: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Nik missing season 5 entry / season 3 direct calculation: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS Nik missing season 5 entry / season 3 playerOne bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Nik missing season 5 entry / season 3 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Nik missing season 5 entry / season 3 history/totals: expected=[3,33,0,"playerOne"] actual=[3,33,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS Nik missing season 5 entry / season 4 points/winner: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Nik missing season 5 entry / season 4 direct calculation: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS Nik missing season 5 entry / season 4 playerOne bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Nik missing season 5 entry / season 4 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Nik missing season 5 entry / season 4 history/totals: expected=[4,44,0,"playerOne"] actual=[4,44,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS Nik missing season 5 entry / season 5 collecting: expected="COLLECTING" actual="COLLECTING" source=js/sharedSeasonResults.js:68-69
PASS Nik missing season 5 entry / season 5 commit rejected: expected="SEASON_COMMIT_RESULTS_NOT_READY" actual="SEASON_COMMIT_RESULTS_NOT_READY" source=js/sharedSeasonCommit.js:35-39
PASS Nik missing season 5 entry / season 5 missing scoring rejected (no zero): expected="CANONICAL_SCORING_RESULTS_INVALID" actual="CANONICAL_SCORING_RESULTS_INVALID" source=js/sharedCanonicalScoring.js:19,25,36
PASS Nik missing season 5 entry / season 5: expected=incomplete actual=no scored season; final cannot include the missing entry
PASS Nik missing season 5 entry / season 6 points/winner: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Nik missing season 5 entry / season 6 direct calculation: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS Nik missing season 5 entry / season 6 playerOne bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Nik missing season 5 entry / season 6 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Nik missing season 5 entry / season 7 points/winner: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Nik missing season 5 entry / season 7 direct calculation: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS Nik missing season 5 entry / season 7 playerOne bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Nik missing season 5 entry / season 7 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Nik missing season 5 entry / season 8 points/winner: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Nik missing season 5 entry / season 8 direct calculation: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS Nik missing season 5 entry / season 8 playerOne bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Nik missing season 5 entry / season 8 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Nik missing season 5 entry / season 9 points/winner: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Nik missing season 5 entry / season 9 direct calculation: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS Nik missing season 5 entry / season 9 playerOne bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Nik missing season 5 entry / season 9 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Nik missing season 5 entry / season 10 points/winner: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Nik missing season 5 entry / season 10 direct calculation: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS Nik missing season 5 entry / season 10 playerOne bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Nik missing season 5 entry / season 10 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Nik missing season 5 entry / season 5 history missing manager rejected: expected="HISTORY_CONVERGENCE_RESULTS_INVALID" actual="HISTORY_CONVERGENCE_RESULTS_INVALID" source=js/sharedHistoryConvergence.js:25-26,72-76
PASS Nik missing season 5 entry / final before gap: expected=[4,44,0,"BLOCKED","multi-season-not-terminal"] actual=[4,44,0,"BLOCKED","multi-season-not-terminal"] source=js/sharedHistoryConvergence.js:98-103; js/sharedFinalReconciliation.js:40
PASS Nik missing season 5 entry / final incomplete history rejected: expected="FINAL_RECONCILIATION_HISTORY_INCOMPLETE" actual="FINAL_RECONCILIATION_HISTORY_INCOMPLETE" source=js/sharedFinalReconciliation.js:25

CASE Nik maximum every season (110)
PASS Nik maximum every season (110) / season 1 points/winner: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Nik maximum every season (110) / season 1 direct calculation: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:36
PASS Nik maximum every season (110) / season 1 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Nik maximum every season (110) / season 1 playerTwo bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Nik maximum every season (110) / season 1 history/totals: expected=[1,0,11,"playerTwo"] actual=[1,0,11,"playerTwo"] source=js/sharedHistoryConvergence.js:88-109
PASS Nik maximum every season (110) / season 2 points/winner: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Nik maximum every season (110) / season 2 direct calculation: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:36
PASS Nik maximum every season (110) / season 2 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Nik maximum every season (110) / season 2 playerTwo bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Nik maximum every season (110) / season 2 history/totals: expected=[2,0,22,"playerTwo"] actual=[2,0,22,"playerTwo"] source=js/sharedHistoryConvergence.js:88-109
PASS Nik maximum every season (110) / season 3 points/winner: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Nik maximum every season (110) / season 3 direct calculation: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:36
PASS Nik maximum every season (110) / season 3 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Nik maximum every season (110) / season 3 playerTwo bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Nik maximum every season (110) / season 3 history/totals: expected=[3,0,33,"playerTwo"] actual=[3,0,33,"playerTwo"] source=js/sharedHistoryConvergence.js:88-109
PASS Nik maximum every season (110) / season 4 points/winner: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Nik maximum every season (110) / season 4 direct calculation: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:36
PASS Nik maximum every season (110) / season 4 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Nik maximum every season (110) / season 4 playerTwo bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Nik maximum every season (110) / season 4 history/totals: expected=[4,0,44,"playerTwo"] actual=[4,0,44,"playerTwo"] source=js/sharedHistoryConvergence.js:88-109
PASS Nik maximum every season (110) / season 5 points/winner: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Nik maximum every season (110) / season 5 direct calculation: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:36
PASS Nik maximum every season (110) / season 5 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Nik maximum every season (110) / season 5 playerTwo bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Nik maximum every season (110) / season 5 history/totals: expected=[5,0,55,"playerTwo"] actual=[5,0,55,"playerTwo"] source=js/sharedHistoryConvergence.js:88-109
PASS Nik maximum every season (110) / season 6 points/winner: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Nik maximum every season (110) / season 6 direct calculation: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:36
PASS Nik maximum every season (110) / season 6 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Nik maximum every season (110) / season 6 playerTwo bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Nik maximum every season (110) / season 6 history/totals: expected=[6,0,66,"playerTwo"] actual=[6,0,66,"playerTwo"] source=js/sharedHistoryConvergence.js:88-109
PASS Nik maximum every season (110) / season 7 points/winner: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Nik maximum every season (110) / season 7 direct calculation: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:36
PASS Nik maximum every season (110) / season 7 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Nik maximum every season (110) / season 7 playerTwo bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Nik maximum every season (110) / season 7 history/totals: expected=[7,0,77,"playerTwo"] actual=[7,0,77,"playerTwo"] source=js/sharedHistoryConvergence.js:88-109
PASS Nik maximum every season (110) / season 8 points/winner: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Nik maximum every season (110) / season 8 direct calculation: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:36
PASS Nik maximum every season (110) / season 8 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Nik maximum every season (110) / season 8 playerTwo bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Nik maximum every season (110) / season 8 history/totals: expected=[8,0,88,"playerTwo"] actual=[8,0,88,"playerTwo"] source=js/sharedHistoryConvergence.js:88-109
PASS Nik maximum every season (110) / season 9 points/winner: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Nik maximum every season (110) / season 9 direct calculation: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:36
PASS Nik maximum every season (110) / season 9 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Nik maximum every season (110) / season 9 playerTwo bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Nik maximum every season (110) / season 9 history/totals: expected=[9,0,99,"playerTwo"] actual=[9,0,99,"playerTwo"] source=js/sharedHistoryConvergence.js:88-109
PASS Nik maximum every season (110) / season 10 points/winner: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:26-31,39
PASS Nik maximum every season (110) / season 10 direct calculation: expected=[0,11,"playerTwo"] actual=[0,11,"playerTwo"] source=js/sharedCanonicalScoring.js:36
PASS Nik maximum every season (110) / season 10 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS Nik maximum every season (110) / season 10 playerTwo bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS Nik maximum every season (110) / season 10 history/totals: expected=[10,0,110,"playerTwo"] actual=[10,0,110,"playerTwo"] source=js/sharedHistoryConvergence.js:88-109
PASS Nik maximum every season (110) / final (playerOne): expected=[0,110,"playerTwo",10,true,null,false] actual=[0,110,"playerTwo",10,true,null,false] source=js/sharedFinalReconciliation.js:47-49
PASS Nik maximum every season (110) / final (playerTwo): expected=[0,110,"playerTwo",10,true,null,false] actual=[0,110,"playerTwo",10,true,null,false] source=js/sharedFinalReconciliation.js:47-49
PASS Nik maximum every season (110) / final playerOne history W/L/D: expected=[0,10,0] actual=[0,10,0] source=js/sharedHistoryConvergence.js:90
PASS Nik maximum every season (110) / final playerTwo history W/L/D: expected=[10,0,0] actual=[10,0,0] source=js/sharedHistoryConvergence.js:90

CASE equal position, league-points tiebreak
PASS equal position, league-points tiebreak / season 1 points/winner: expected=[0,0,"playerOne"] actual=[0,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS equal position, league-points tiebreak / season 1 direct calculation: expected=[0,0,"playerOne"] actual=[0,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS equal position, league-points tiebreak / season 1 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS equal position, league-points tiebreak / season 1 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS equal position, league-points tiebreak / season 1 history/totals: expected=[1,0,0,"playerOne"] actual=[1,0,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS equal position, league-points tiebreak / season 2 points/winner: expected=[0,0,"playerTwo"] actual=[0,0,"playerTwo"] source=js/sharedCanonicalScoring.js:26-31,39
PASS equal position, league-points tiebreak / season 2 direct calculation: expected=[0,0,"playerTwo"] actual=[0,0,"playerTwo"] source=js/sharedCanonicalScoring.js:36
PASS equal position, league-points tiebreak / season 2 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS equal position, league-points tiebreak / season 2 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS equal position, league-points tiebreak / season 2 history/totals: expected=[2,0,0,"playerTwo"] actual=[2,0,0,"playerTwo"] source=js/sharedHistoryConvergence.js:88-109
PASS equal position, league-points tiebreak / season 3 points/winner: expected=[0,0,"playerOne"] actual=[0,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS equal position, league-points tiebreak / season 3 direct calculation: expected=[0,0,"playerOne"] actual=[0,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS equal position, league-points tiebreak / season 3 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS equal position, league-points tiebreak / season 3 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS equal position, league-points tiebreak / season 3 history/totals: expected=[3,0,0,"playerOne"] actual=[3,0,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS equal position, league-points tiebreak / season 4 points/winner: expected=[0,0,"playerTwo"] actual=[0,0,"playerTwo"] source=js/sharedCanonicalScoring.js:26-31,39
PASS equal position, league-points tiebreak / season 4 direct calculation: expected=[0,0,"playerTwo"] actual=[0,0,"playerTwo"] source=js/sharedCanonicalScoring.js:36
PASS equal position, league-points tiebreak / season 4 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS equal position, league-points tiebreak / season 4 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS equal position, league-points tiebreak / season 4 history/totals: expected=[4,0,0,"playerTwo"] actual=[4,0,0,"playerTwo"] source=js/sharedHistoryConvergence.js:88-109
PASS equal position, league-points tiebreak / season 5 points/winner: expected=[0,0,"playerOne"] actual=[0,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS equal position, league-points tiebreak / season 5 direct calculation: expected=[0,0,"playerOne"] actual=[0,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS equal position, league-points tiebreak / season 5 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS equal position, league-points tiebreak / season 5 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS equal position, league-points tiebreak / season 5 history/totals: expected=[5,0,0,"playerOne"] actual=[5,0,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS equal position, league-points tiebreak / season 6 points/winner: expected=[0,0,"playerTwo"] actual=[0,0,"playerTwo"] source=js/sharedCanonicalScoring.js:26-31,39
PASS equal position, league-points tiebreak / season 6 direct calculation: expected=[0,0,"playerTwo"] actual=[0,0,"playerTwo"] source=js/sharedCanonicalScoring.js:36
PASS equal position, league-points tiebreak / season 6 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS equal position, league-points tiebreak / season 6 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS equal position, league-points tiebreak / season 6 history/totals: expected=[6,0,0,"playerTwo"] actual=[6,0,0,"playerTwo"] source=js/sharedHistoryConvergence.js:88-109
PASS equal position, league-points tiebreak / season 7 points/winner: expected=[0,0,"playerOne"] actual=[0,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS equal position, league-points tiebreak / season 7 direct calculation: expected=[0,0,"playerOne"] actual=[0,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS equal position, league-points tiebreak / season 7 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS equal position, league-points tiebreak / season 7 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS equal position, league-points tiebreak / season 7 history/totals: expected=[7,0,0,"playerOne"] actual=[7,0,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS equal position, league-points tiebreak / season 8 points/winner: expected=[0,0,"playerTwo"] actual=[0,0,"playerTwo"] source=js/sharedCanonicalScoring.js:26-31,39
PASS equal position, league-points tiebreak / season 8 direct calculation: expected=[0,0,"playerTwo"] actual=[0,0,"playerTwo"] source=js/sharedCanonicalScoring.js:36
PASS equal position, league-points tiebreak / season 8 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS equal position, league-points tiebreak / season 8 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS equal position, league-points tiebreak / season 8 history/totals: expected=[8,0,0,"playerTwo"] actual=[8,0,0,"playerTwo"] source=js/sharedHistoryConvergence.js:88-109
PASS equal position, league-points tiebreak / season 9 points/winner: expected=[0,0,"playerOne"] actual=[0,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS equal position, league-points tiebreak / season 9 direct calculation: expected=[0,0,"playerOne"] actual=[0,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS equal position, league-points tiebreak / season 9 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS equal position, league-points tiebreak / season 9 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS equal position, league-points tiebreak / season 9 history/totals: expected=[9,0,0,"playerOne"] actual=[9,0,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS equal position, league-points tiebreak / season 10 points/winner: expected=[0,0,"playerTwo"] actual=[0,0,"playerTwo"] source=js/sharedCanonicalScoring.js:26-31,39
PASS equal position, league-points tiebreak / season 10 direct calculation: expected=[0,0,"playerTwo"] actual=[0,0,"playerTwo"] source=js/sharedCanonicalScoring.js:36
PASS equal position, league-points tiebreak / season 10 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS equal position, league-points tiebreak / season 10 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS equal position, league-points tiebreak / season 10 history/totals: expected=[10,0,0,"playerTwo"] actual=[10,0,0,"playerTwo"] source=js/sharedHistoryConvergence.js:88-109
PASS equal position, league-points tiebreak / final (playerOne): expected=[0,0,"DRAW",10,true,null,false] actual=[0,0,"DRAW",10,true,null,false] source=js/sharedFinalReconciliation.js:47-49
PASS equal position, league-points tiebreak / final (playerTwo): expected=[0,0,"DRAW",10,true,null,false] actual=[0,0,"DRAW",10,true,null,false] source=js/sharedFinalReconciliation.js:47-49
PASS equal position, league-points tiebreak / final playerOne history W/L/D: expected=[5,5,0] actual=[5,5,0] source=js/sharedHistoryConvergence.js:90
PASS equal position, league-points tiebreak / final playerTwo history W/L/D: expected=[5,5,0] actual=[5,5,0] source=js/sharedHistoryConvergence.js:90

CASE individual awards and 99/100 boundaries
PASS individual awards and 99/100 boundaries / season 1 points/winner: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:26-31,39
PASS individual awards and 99/100 boundaries / season 1 direct calculation: expected=[0,0,"draw"] actual=[0,0,"draw"] source=js/sharedCanonicalScoring.js:36
PASS individual awards and 99/100 boundaries / season 1 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS individual awards and 99/100 boundaries / season 1 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS individual awards and 99/100 boundaries / season 1 history/totals: expected=[1,0,0,"draw"] actual=[1,0,0,"draw"] source=js/sharedHistoryConvergence.js:88-109
PASS individual awards and 99/100 boundaries / season 2 points/winner: expected=[5,0,"playerOne"] actual=[5,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS individual awards and 99/100 boundaries / season 2 direct calculation: expected=[5,0,"playerOne"] actual=[5,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS individual awards and 99/100 boundaries / season 2 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS individual awards and 99/100 boundaries / season 2 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS individual awards and 99/100 boundaries / season 2 history/totals: expected=[2,5,0,"playerOne"] actual=[2,5,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS individual awards and 99/100 boundaries / season 3 points/winner: expected=[3,0,"playerOne"] actual=[3,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS individual awards and 99/100 boundaries / season 3 direct calculation: expected=[3,0,"playerOne"] actual=[3,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS individual awards and 99/100 boundaries / season 3 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS individual awards and 99/100 boundaries / season 3 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS individual awards and 99/100 boundaries / season 3 history/totals: expected=[3,8,0,"playerOne"] actual=[3,8,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS individual awards and 99/100 boundaries / season 4 points/winner: expected=[1,0,"playerOne"] actual=[1,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS individual awards and 99/100 boundaries / season 4 direct calculation: expected=[1,0,"playerOne"] actual=[1,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS individual awards and 99/100 boundaries / season 4 playerOne bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS individual awards and 99/100 boundaries / season 4 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS individual awards and 99/100 boundaries / season 4 history/totals: expected=[4,9,0,"playerOne"] actual=[4,9,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS individual awards and 99/100 boundaries / season 5 points/winner: expected=[1,0,"playerOne"] actual=[1,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS individual awards and 99/100 boundaries / season 5 direct calculation: expected=[1,0,"playerOne"] actual=[1,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS individual awards and 99/100 boundaries / season 5 playerOne bonus caps: expected=[1,0] actual=[1,0] source=js/sharedCanonicalScoring.js:28
PASS individual awards and 99/100 boundaries / season 5 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS individual awards and 99/100 boundaries / season 5 history/totals: expected=[5,10,0,"playerOne"] actual=[5,10,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS individual awards and 99/100 boundaries / season 6 points/winner: expected=[1,0,"playerOne"] actual=[1,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS individual awards and 99/100 boundaries / season 6 direct calculation: expected=[1,0,"playerOne"] actual=[1,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS individual awards and 99/100 boundaries / season 6 playerOne bonus caps: expected=[1,0] actual=[1,0] source=js/sharedCanonicalScoring.js:28
PASS individual awards and 99/100 boundaries / season 6 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS individual awards and 99/100 boundaries / season 6 history/totals: expected=[6,11,0,"playerOne"] actual=[6,11,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS individual awards and 99/100 boundaries / season 7 points/winner: expected=[1,0,"playerOne"] actual=[1,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS individual awards and 99/100 boundaries / season 7 direct calculation: expected=[1,0,"playerOne"] actual=[1,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS individual awards and 99/100 boundaries / season 7 playerOne bonus caps: expected=[0,1] actual=[0,1] source=js/sharedCanonicalScoring.js:28
PASS individual awards and 99/100 boundaries / season 7 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS individual awards and 99/100 boundaries / season 7 history/totals: expected=[7,12,0,"playerOne"] actual=[7,12,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS individual awards and 99/100 boundaries / season 8 points/winner: expected=[1,0,"playerOne"] actual=[1,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS individual awards and 99/100 boundaries / season 8 direct calculation: expected=[1,0,"playerOne"] actual=[1,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS individual awards and 99/100 boundaries / season 8 playerOne bonus caps: expected=[0,1] actual=[0,1] source=js/sharedCanonicalScoring.js:28
PASS individual awards and 99/100 boundaries / season 8 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS individual awards and 99/100 boundaries / season 8 history/totals: expected=[8,13,0,"playerOne"] actual=[8,13,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS individual awards and 99/100 boundaries / season 9 points/winner: expected=[2,0,"playerOne"] actual=[2,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS individual awards and 99/100 boundaries / season 9 direct calculation: expected=[2,0,"playerOne"] actual=[2,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS individual awards and 99/100 boundaries / season 9 playerOne bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS individual awards and 99/100 boundaries / season 9 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS individual awards and 99/100 boundaries / season 9 history/totals: expected=[9,15,0,"playerOne"] actual=[9,15,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS individual awards and 99/100 boundaries / season 10 points/winner: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:26-31,39
PASS individual awards and 99/100 boundaries / season 10 direct calculation: expected=[11,0,"playerOne"] actual=[11,0,"playerOne"] source=js/sharedCanonicalScoring.js:36
PASS individual awards and 99/100 boundaries / season 10 playerOne bonus caps: expected=[1,1] actual=[1,1] source=js/sharedCanonicalScoring.js:28
PASS individual awards and 99/100 boundaries / season 10 playerTwo bonus caps: expected=[0,0] actual=[0,0] source=js/sharedCanonicalScoring.js:28
PASS individual awards and 99/100 boundaries / season 10 history/totals: expected=[10,26,0,"playerOne"] actual=[10,26,0,"playerOne"] source=js/sharedHistoryConvergence.js:88-109
PASS individual awards and 99/100 boundaries / final (playerOne): expected=[26,0,"playerOne",10,true,null,false] actual=[26,0,"playerOne",10,true,null,false] source=js/sharedFinalReconciliation.js:47-49
PASS individual awards and 99/100 boundaries / final (playerTwo): expected=[26,0,"playerOne",10,true,null,false] actual=[26,0,"playerOne",10,true,null,false] source=js/sharedFinalReconciliation.js:47-49
PASS individual awards and 99/100 boundaries / final playerOne history W/L/D: expected=[9,0,1] actual=[9,0,1] source=js/sharedHistoryConvergence.js:90
PASS individual awards and 99/100 boundaries / final playerTwo history W/L/D: expected=[0,9,1] actual=[0,9,1] source=js/sharedHistoryConvergence.js:90

SUMMARY: 10 ten-season cases; 532 comparisons; 0 bugs found.
```

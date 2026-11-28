# JOB-27 · G-13 part 2d: Transfer War

| Lane | Depends on | Code branch | PR into | Budget |
| --- | --- | --- | --- | --- |
| **lead** (Claude Opus helper in the lead thread) | job 24: start from branch `gameplay/job-24-v10-foundation` (PR #349) now; the PR goes into recovery and becomes clean once 24 merges | `gameplay/job-27-v10-transfer` | `gameplay/recovery-v1` | one helper run |

Read `jobs/G13_PART2_COMMON.md` first, then job 24's PR body for the loader API (`js/v10Screens.js`).

## Screens

- Team V source (at `5e05a1f`): `tr2/slice-02-plate/` (and `tr2/slice-01/` only for files it references; see `tr2/ASSET_LEDGER.md`).
- App screens: `transferChallenge`.

## Build

- **Skin only.** Keep every id that `js/productionSharedTransferChallenge.js` and the browser journey use: `#startTransferTimer`, `#endTransferTimer`, `#completeTransferChallenge`, `#continueFromTransfers`, the guess and signing fields (`p1Guess*`, `p2Guess*`, `p1Signing*`, `p2Signing*`), `#transferChallengeError` and `#transferTimerDisplay`.
- Keep the jobs 21 and 22 behaviour: same-moment taps retry quietly, and Lock asks "Lock N of 3?".
- **Privacy.** Never show the rival's unlocked guesses or signings. Show only what `view.opponentInputs` already reveals.
- The top bar is locked (`reason: transfer-window`) while the window runs.
- Register each screen through `js/v10Screens.js`. Copy only files that the CSS or JS reference. Images use job 24's runtime cache rule.

## Tests

`tests/contracts/v10-transfer-contracts.cjs`: every id above still exists and still reaches the module's click handler after mount; the rival's private inputs never appear in the rendered text before they are revealed; the timer text comes from the real view.

## Done

Everything in COMMON "Checks before DONE". Then set `State: DONE` in `status/JOB-27.md`, with the PR link and head SHA. The lead merges; you do not.

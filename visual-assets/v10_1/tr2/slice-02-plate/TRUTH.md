# Transfer War · Product truth

Written by Claude (visual lead) on 2026-10-04 so review and fix jobs have one truth file. Transfer War was built before the per-screen TRUTH.md files existed; its truth was recorded in `BUILD_RESULT.md` (sections R3, R4 and JOB-050) against production `main@2de2373`. Where this file and BUILD_RESULT.md differ, BUILD_RESULT.md wins; tell Claude in the status file.

## Ids and routes

Opened by the shared Transfer Challenge flow after the League Wheel and Club Reveal; it is not a hub screen, so the app's phone bottom bar and the desktop top-bar tabs are locked here ("Finish this step first"). This screen's own HOME / REFRESH footer stays.

| Hook | Live use |
| --- | --- |
| `#transferTimerDisplay` | live window clock (role=timer), DOM text on the sign |
| `#transferPhaseStatus` | phase status line (role=status), e.g. `WINDOW OPEN · BUILD YOUR SQUAD`, `SIGNING ENTRY` |
| `#endTransferTimer` | end-window action; ends early only if both managers agree |
| `p1Signing{i}*` / `p2Signing{i}*` | Daniel / Nik signing rows i = 1..3: player name, previous league, nationality |
| `#completeTransferChallenge` | `LOCK MY SIGNINGS`; validates every partly filled row |
| `#transferPhaseLockSummary` | production lock summary while waiting for the rival |
| `#transferResultsOne` / `#transferResultsTwo` | Daniel / Nik verdict lists after the reveal |
| `#continueFromTransfers` | `SHARED SEASON RESULTS COMING NEXT` continuation |
| `#transferPhaseIntro` | removed (S2); must not come back |

Frames (`?frame=`): F1 window open, G guess entry, F3 / F3D signing entry, F3L / F3DL locked and waiting, F4 / F4D verdicts, F4E / F4DE verdicts with no signings. Full per-surface wording: BUILD_RESULT.md R4 table.

## Rules

- Daniel is Manager 1 / playerOne, always LEFT; Nik is Manager 2 / playerTwo, always RIGHT.
- The rival's guesses and signings stay SEALED until both lock; the sealed panel is identical in size and markup in every frame and never hints at progress.
- Verdicts come from fixtures / production (`KEEP · NO RIVAL GUESS MATCH`, `RELEASE · MATCHED BY RIVAL GUESS`); the visual layer never computes them.
- Clubs, players, guesses, timer and fees are DOM text from fixtures.json; nothing live is baked into images. No real crests, league logos or player pictures.
- Phone: one screen, no page scroll at 393x660, 360x640 and 375x553; primary action pinned above the HOME / REFRESH rail.

## Data contract

Transfer War writes signings and guesses for the current season only (PRODUCT_TRUTH: "Transfer War records signings and guesses where the challenge completed"). It shows no career history, so DATA_CONTRACT_V1 §0 applies only.

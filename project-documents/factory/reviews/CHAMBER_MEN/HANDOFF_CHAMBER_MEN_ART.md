# r88 Chamber Men scene art — Team V to Team G r88 lead

Branch: `claude-visual/chamber-men-scene` (cut from `gameplay/r88` @ b3fb099a). Merge it into `gameplay/r88` as is; it only touches 3 files plus this folder.

## What changed
1. **Goal and keeper** (`js/chamberMenStep.js`, `cmsGoal` + new `cmsReset`; `css/chamberMen.css` goal section).
   Marble-framed panel, gold posts and crossbar, net with depth, turf strip with goal line and spot.
   Keeper = faceless gold figure, 4 poses on `.cmKeeper[data-pose]`: `ready`, `L`, `M` (jump, arms up), `R`.
   Ball = drawn ball that spins in flight. Net bulges at the ball and a gold ring flashes on a goal.
   All drawn in code: no picture, no face, no real crest, no dimming.
2. **Kick timing** (`showKick`): reset (keeper ready in the middle, ball on the spot) → 320 ms run-up → dive + shot together (same 900 ms move as before). Fits inside `KICK_MS` 2200.
3. **Cylinder strip** (`css/chamberMen.css`): gunmetal bar with 7 bores, cut from the roulette drum.
   Not played = steel bore + gold dashed mark; `.is-live` = brass cartridge head + primer + red LIVE ring (same red as the roulette); `.is-empty` = black bore.
4. **Roulette wording** (`visual-assets/v10_1/roulette/index.html`): the drum now counts its live rounds (`cyl.userData.liveCount`, set by `placeRound`/`placeRounds`/`clearRounds`), and `liveWords()` picks the lines:

| Live rounds | Mark line | Fired | Safe |
|---|---|---|---|
| 0 | No live rounds · Gold: fires | (cannot fire) | No live rounds. Every chamber is empty |
| 1 | Red: live round · Gold: fires | Stopped on the live round | The live round passed |
| 2-6 | Red: N live rounds · Gold: fires | Stopped on a live round | Stopped on an empty chamber |
| 7 | Red: 7 live rounds · Gold: fires | Every chamber is live. Stopped on a live round | (cannot be safe) |

One-bullet Showdowns read exactly as before.

## Hooks
All kept: `.cmRound .cmGoals .cmChamber.is-live/.is-empty .cmChoice[data-kind][data-side] .cmLock .cmNext .cmBack`.
New (art only): `.cmKeeper[data-pose]`, `.cmPose[data-for]`, `.cmNet`, `.cmHit`, `.cmBallArt`, `.cmZone`, `.cmGoal.is-goal/.is-save/.is-flying`, CSS vars `--cm-hit-x/--cm-hit-y`. `cmsGoal()` now also returns `hit`.

## Checks
- `node tests/contracts/r88-chamber-men-contracts.cjs` PASS 10; `r87-roster-roulette-contracts` 28 groups, `r87-fable11-roulette-contracts`, `r87-fable-step-contracts` pass.
- Desktop 1440x900: whole screen fits, no scroll (full time: SPIN THE CYLINDER at y 707-755).
- Phone 390x844: full time fits (BACK at 699-747); during picks the stage scrolls ~25 px to reach BACK (allowed by the ticket). Both 7-chamber strips fit inside the board.
- Screens: `review/` in this folder (moved here from visual-assets/v10_1/chamber-men/ so the shipped-asset lists stay exact).

# JOB-26 · G-13 part 2c: Start/Join, League wheel and Club packs

| Lane | Depends on | Code branch | PR into | Budget |
| --- | --- | --- | --- | --- |
| **lead** (Claude Opus helper in the lead thread: the most fragile screens) | job 24: start from branch `gameplay/job-24-v10-foundation` (PR #349) now; the PR goes into recovery and becomes clean once 24 merges | `gameplay/job-26-v10-setup` | `gameplay/recovery-v1` | one helper run |

Read `jobs/G13_PART2_COMMON.md` first, then job 24's PR body for the loader API (`js/v10Screens.js`).

## Screens

- Team V source (at `5e05a1f`): `start-join/`, `league/`, `club/` (and the crests and league marks they reference: `visual-assets/crests/`, `visual-assets/league-marks-v2/`).
- App screens: `createShowdown`, the entry overlay `#productionSharedJourneyEntryOverlay`, `#persistentNikDanielPairPanel`, `#sparkRemoteJoiningOverlay`, `leagueWheelScreen` and `clubWheelScreen`.

## Build

- This is the most fragile part of the game (pairing, private session, ACTIVE, league draw, club packs, confirm). **Skin only.** `start-join/TRUTH.md` lists the ids, overlays and routes that must survive. Read it fully and keep all of them.
- The League wheel spin and the Club pack results come from the shared Setup provider. Team V's animation may show the result, but it must never pick it. If an animation needs the result before it is known, wait for it.
- Font stand-ins are accepted for the missing League, Club and Versus brush wordmarks and the Start/Join title picture (Team V known gap).
- The top bar shows locked (`reason: setup`) during the wheels, as the nav model says.
- Register each screen through `js/v10Screens.js`. Copy only files that the CSS or JS reference. Images use job 24's runtime cache rule.

## Tests

`tests/contracts/v10-setup-contracts.cjs`: every TRUTH.md id still exists after mount; the wheel and pack result shown equals the provider value given in a stub; Back routes are unchanged; the nav lock is set during the wheels.

## Done

Everything in COMMON "Checks before DONE". Then set `State: DONE` in `status/JOB-26.md`, with the PR link and head SHA. The lead merges; you do not.

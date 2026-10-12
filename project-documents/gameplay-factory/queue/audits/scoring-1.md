# scoring.js first-half audit (JOB-1661)

## Finding 1 — PROBABLE: string-valued tiebreakers can declare the wrong season winner

- **File and lines:** `js/scoring.js:50-63`, inside `determineSeasonWinner`.
- **What the player sees:** When both managers have equal season score, the wrong manager can win the tiebreaker. For example, positions `"10"` and `"2"` select player one (10th) over player two (2nd). When positions match, points `"99"` and `"100"` select the 99-point manager over the 100-point manager.
- **Why the code does it:** These comparisons use unnormalized inputs. If both values are strings (as can happen with form or saved values), JavaScript compares them lexicographically rather than numerically:

  ```js
  if(playerOne.leaguePosition < playerTwo.leaguePosition){
  ```

  ```js
  if(playerOne.leaguePoints > playerTwo.leaguePoints){
  ```

  The reverse comparisons at lines 54 and 62 have the same defect. `calculatePlayerSeasonScore` already converts `leaguePosition` using `Number(...)`, but this winner function does not. The failure is reproducible for string inputs; whether live caller data reaches this function as strings needs confirmation, hence PROBABLE.
- **Smallest change:** Cast both managers' positions and points to numbers once at the top of `determineSeasonWinner`, then compare those numeric locals in all four tiebreaker comparisons. Preserve the existing priority: total score, league position, league points, then draw.

No game source files changed; audit findings only.

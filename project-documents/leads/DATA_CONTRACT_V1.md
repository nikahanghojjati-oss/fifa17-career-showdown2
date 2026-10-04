# DATA CONTRACT V1 (Team V ↔ Team G)

Version: 1.0
Date: 2026-10-02
Owner: Nik
Agreed by: Team G (G2V-001R2). Team V proposed it (handoff §4, V2G-001R2). Team G's amendments are marked **[G]**.
Evidence: `main` @ `2de237391e17c7de2c6deb606b102b68ee640212` (r51)
Change rule: after this commit a field changes only through a relay message (`V2G-…` or `G2V-…`) that names the field and the new version.

## 0. Rules for every screen

- Every screen view model has one `status`: `loading` | `empty` (new career, read succeeded) | `unavailable` (read failed; never drawn as empty or zero) | `partial` (some Showdowns unreadable; show `coverage`, never call it "all-time" or "career") | `ready`.
- Transfers carry their own `transfers.status` with the same five values. A failed transfer read never blocks points, seasons or trophies and never shows as 0 signings.
- Managers are keyed `daniel` and `nik`, from the slot role only: `playerOne` = `daniel` (always the LEFT column), `playerTwo` = `nik`. Source: `js/persistentNikDanielPair.js:9-14`. Never key by account, profile or save id.
- Scoring never changes: Champions League 5, league title 3, domestic cup 1, performance bonus 1 (≥100 league points **or** ≥100 league goals), awards bonus 1 (top scorer **or** top assist). Season max 11. Season winner: higher total, then better league position, then more league points, else draw. Final Showdown winner: higher total points, equal = draw (season tiebreaks never apply to the final). Trophies are counts of wins (one CL = 1 trophy and 5 points).
- No view model ever carries the rival's private inputs (guesses, signings, unpublished season inputs) before the game reveals them.
- **[G] Value bounds** (fixtures must respect them; source `js/sharedHistoryConvergence.js:17,26-33`):
  - `totalSeasons` ∈ {1, 3, 5, 10}.
  - `leagueId` ∈ `premier_league` (20 teams), `laliga` (20), `bundesliga` (18), `serie_a` (20), `ligue_1` (20).
  - `leaguePosition` 1..teams; `leaguePoints` 0..(teams − 1) × 6; `leagueGoals` 0..300; the four yes/no fields are booleans.
- **[G] Interim label.** Before career history is real, a screen may show current-Showdown data only for owner review, with `interimLabel` = exactly "Current Showdown only. Career history is not yet available." Never a launch state.

Legend: **E** = exists on `main` today (needs only an adapter). **A** = gameplay must add.

## 1. Home (Continue + tiles)

| Field | Meaning | E/A |
| --- | --- | --- |
| `viewerRole` | `daniel` or `nik` ("START A SHOWDOWN" vs "JOIN DANIEL'S SHOWDOWN") | E |
| `continue.state` | `paired` / `waiting` / `recovery-required` / `unpaired` | E |
| `continue.leagueId`, `continue.clubs.{daniel,nik}` | Current league and permanent clubs | E |
| `continue.season`, `continue.totalSeasons` | "Season 2 of 5" | E |
| `continue.score.{daniel,nik}` | Current Showdown points | E |
| `tiles.{history,statistics,trophyRoom,rivalry}.available` + `reason` | Tile on/off. **[G]** `reason` is a closed set: `loading`, `reconnecting`, `not-paired`, `unavailable`; Team V owns the words | A |

## 2. Start / Join

| Field / action | E/A |
| --- | --- |
| `pairing.state` (`none` / `code-created` / `waiting-for-nik` / `paired`), `pairing.code` (host only, after creation) | E |
| Actions `createCode` (Daniel), `join` (Nik), `copyCode`, `newCode`, `checkStatus`, `retry` | E |
| `session.state` (`open` / `active` / `revoked` / `closed` / `expired`), actions `host`, `join`, `refresh`, `revoke`, `close`, `forget` | E |
| `abandonShowdown` (with confirm), `forgetThisDevice` (with confirm) | E |
| One view model for both layers: two big buttons plus a "More" menu holding Revoke / Close / Forget, each with a confirm | A (G-6, adapter only) |

## 3. Season Results (one season)

| Field | Meaning | E/A |
| --- | --- | --- |
| Inputs per manager: `leaguePosition`, `leaguePoints`, `leagueGoals` (numbers), `domesticCup`, `championsLeague`, `topScorer`, `topAssist` (yes/no) | What the player enters | E |
| `breakdown.{championsLeague,leagueTitle,domesticCup,performanceBonus,awardsBonus}`, `total` (max 11) | App computes; player never types a score. **[G]** `awardsBonus` is the provider's `individualAwardsBonus` renamed by the adapter | E |
| `winner` (`daniel` / `nik` / `draw`) | Season result | E |
| `tiebreak` (`none` / `league-position` / `league-points` / `draw`) | Why it was decided, for the "How scoring works" pop-up | A (G-5, derived, no rule change) |
| `phase` | **[G]** `entering` / `waiting-for-rival` (own inputs published, rival not yet) / `results-ready` (both published; both inputs now visible; commit pending) / `committed` (season committed and acknowledged). The rival's inputs appear only from `results-ready` on, which is when the Rules reveal them (`public.phase == 'RESULTS_READY'`) | E |

## 4. Final winner (end of a Showdown)

| Field | E/A |
| --- | --- |
| `totals.{daniel,nik}`, `winner` (`daniel` / `nik` / `draw`), `margin` (**[G]** absolute points difference, 0 for a draw), `seasonsPlayed` | E |
| `state`: `completion-pending` (reconciled, Terminal Close not yet verified; the result is still shown) or `completed` (verified Terminal Close) | A (G-5) |
| `trophies.{daniel,nik}.{championsLeague,leagueTitles,domesticCups,total}` for this Showdown | E |

## 5. Rivalry Statistics (current Showdown)

| Field | E/A |
| --- | --- |
| `leagueId`, `clubs`, `season` / `totalSeasons`, `score.{daniel,nik}` | E |
| Per manager: `seasonWins`, `seasonDraws`, `seasonLosses`, `championsLeagues`, `leagueTitles`, `domesticCups`, `totalTrophies`, `hundredPointSeasons`, `hundredGoalSeasons`, `topScorerSeasons`, `topAssistSeasons`, `perfectSeasons` (season score 11), `bestSeasonScore` | E (`managerRecords`) |
| `seasons[]`: `{season, score.{daniel,nik}, winner, leaguePosition.{…}, leaguePoints.{…}, leagueGoals.{…}}` | E (`seasonHistory`) |
| `transfers.status` + per-season guess/signing summary | A (G-10) |
| Adapter from provider state instead of local `currentShowdown` | A (G-5) |

## 6. Career Statistics (all Showdowns)

| Field | E/A |
| --- | --- |
| Per manager: everything in §5 plus `careerPoints` (sum of counted season scores), `seasons`, `averageSeasonScore`, `averageLeaguePoints`, `averageLeagueGoals`, `bestLeaguePoints`, `bestLeagueGoals`, `bestLeaguePosition`, `performanceBonuses`, `awardsBonuses` | A (averages from combined sums and counts, never an average of averages) |
| `showdowns.{completed,wins,draws,losses}` per manager | A (completed Showdowns only) |
| `biggestShowdownWin` `{manager, margin, showdownRef}` | A |
| `coverage.{readable,indexed}` | A |

**[G] What counts** (Sol ruling S2C-005R2 §2, binding):

| Showdown state | Seasons count toward career totals | Showdown outcome counts |
| --- | --- | --- |
| Pending pairing | no | no |
| Active | accepted (acknowledged) seasons only | no |
| Final result reconciled, Terminal Close pending | all accepted seasons | no (shown as `completion-pending`) |
| Closed with verified Terminal Close | all accepted seasons | exactly one |
| Abandoned (closed without Terminal Close) | none, including seasons shown before | none; History row only |
| Unreadable | nothing invented | nothing; screen goes `partial` |

Abandoning a Showdown rebuilds the whole model (records, bests, averages, trophies), not a subtraction.

## 7. Trophy Room

| Field | E/A |
| --- | --- |
| Per manager cabinet: `championsLeagues`, `leagueTitles`, `domesticCups`, `totalTrophies` (counts of wins) | A |
| `standings`: by `careerPoints`, then season wins, else level | A |
| `records[]`: highest season score, highest league points, highest league goals, biggest Showdown win, most perfect seasons; each `{label, manager or "shared", value, ref}` | A |

## 8. History / Legacy

| Field | E/A |
| --- | --- |
| `showdowns[]`: `{number, status (completed / in-progress / completion-pending / abandoned / unavailable), leagueId, clubs.{daniel,nik}, seasonsPlayed, totalSeasons, totals.{daniel,nik}, winner}`; card score = the Showdown points total | A (needs G-7, G-8) |
| `showdowns[].seasons[]` as in §5 | A |
| Abandoned rows: status only, no score, no seasons | A |
| No delete, backup, export or reset controls on the online route | Rule |

## 9. Dropped (the game never records these)

Clean sheets, biggest single-match win, European wins other than the Champions League, player names, player-based leaders or photos, match-by-match results, possession or any per-match stat. "Top scorer" and "top assist" are yes/no per season, not a player name.

## 10. Top navigation bar **[G]**

Verdict: **build it.** Five tabs plus a settings icon.

| Tab | Destination (existing screen id in `js/screens.js:1-15`) | Notes |
| --- | --- | --- |
| HOME | `mainMenu` | |
| CAREER | The current Showdown's live step (`dashboard`, or the setup wheel if setup is unfinished); with no Showdown, Home's Start / Join | The app's own route fallback already does this (`navigateTo` → `resolveCanonicalShowdownRoute`, `js/screens.js:281-301, 487-520`; no Showdown returns `mainMenu`) |
| STANDINGS | No new data. Current Showdown: the head-to-head block of Rivalry Statistics (§5 `score`, season W/D/L). Career: Trophy Room `standings` (§7) once G-9 lands | Same view models, its own layout |
| STATS | `careerStatistics`, with Rivalry Statistics inside | §5, §6 |
| RULES | `ruleBook` | |
| ⚙ (right end) | Existing Settings; holds credits (Reus photo licence) and app version | ABOUT folded in here |

- Tabs are plain client-side routes through `navigateTo`. They add no Firestore reads beyond what each screen already does, so no Spark cost.
- A tab whose data is not ready opens the screen in its own `unavailable` / `loading` state; it never hides.
- `nav.locked` (boolean) and `nav.reason` (`transfer-window` / `season-entry` / `setup`) **[A, G-6]**. Locked on `transferChallenge` (live timer and private drafts), `seasonEntry` (unpublished inputs), `leagueWheelScreen` and `clubWheelScreen` (setup in progress). While locked a tap shows "Finish this step first" and does not navigate.
- Phone (≤ 900 px, the app's existing breakpoint): a 5-icon bottom bar; settings stays in the top corner. Hidden on Loading only.

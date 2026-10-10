# JOB-1484 · productionSharedTransferChallenge.js second-half gameplay audit

Scope: `js/productionSharedTransferChallenge.js`, lines 165–329 on `qa/mega-audits`. Reading audit only; no gameplay or test files changed.

## Finding 1 — PROBABLE: unlocked private guesses are wiped on refresh

- **File / lines:** `js/productionSharedTransferChallenge.js:212,214,268,275–276,304–308` (refresh also calls the renderer at line 115).
- **Player sees:** While choosing a league/nationality and its value on private Guess Entry, a partially entered guess can disappear without tapping Lock, particularly during normal 15-second polling, faster waiting polling, or manual refresh. The player must re-enter the selection; a guess may be omitted accidentally.
- **Why:** `pstcRender()` repopulates the local controls from `view.ownInputs` on **every** authoritative refresh, even when this manager has not locked guesses. `pstcPopulateGuesses()` replaces the type with an empty string if no authoritative row exists and empties the value field if that slot has no row. Unlike signing entry (lines 219–232), guess entry has no draft restoration. Relevant source excerpts (2 lines):
  ```js
  if(type)type.value=row?.type||"";
  if(own)pstcPopulateRole(role,own);
  ```
- **Smallest change:** During live `GUESS_ENTRY` for an **unlocked** local role, preserve its in-progress guess controls when rendering refreshes; hydrate from authority only on first entry/context change, once locked, or during read-only replay. Alternatively, use a role- and season-scoped local guess draft with the same restore/clear lifecycle as signing drafts. Do not change lock order, guess scoring, or the opponent's privacy.
- **Confidence rationale:** PROBABLE rather than SURE: this file proves the unconditional rehydration and clearing path, but the ticket excludes the provider source needed to confirm that `ownInputs.guesses` is an empty array before lock in every runtime case.

No additional findings met the real-player-bug evidence threshold in this file.

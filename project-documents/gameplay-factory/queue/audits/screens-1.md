# screens.js audit, first half (lines 1-406)

no findings

Riskiest places checked:
1. Lines 240-242 and 287-288 (completed showdown routing): a completed showdown accepts only the dashboard and season summary routes. `resolveCanonicalShowdownRoute` also sends it to the dashboard, which `isRouteStateValid` accepts (line 236 runs before the completed check). The two agree.
2. Lines 247-272 (league, club and challenge gates): the league, club, transfer and season entry routes are gated by the clubs-valid, confirmation-pending and challenge-status checks. A season entry is valid only after its challenge is completed.
3. Lines 387-395 (required football visuals): a failed mount throws and `showScreen` returns false instead of showing a blank screen. This is the intended fail-closed path.

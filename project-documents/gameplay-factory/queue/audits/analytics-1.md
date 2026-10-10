# analytics.js audit, first half (lines 1-260)

no findings

Riskiest places checked:
1. Lines 56-64 (`analyticsGetRawProfilePresentationState`): the raw fallback returns null whenever an active showdown exists. Manager names then come from the showdown itself, not from the profile, until the save library runtime is ready. This is a fallback path, not a score error.
2. Lines 117-124 and 242-244 (winner and season result): a draw is counted only when the scores are equal or the round winner is "draw". Any other value counts as a loss for both sides, so a missing `round.winner` would show as two losses. The game always sets the winner, so this was not shown to happen.
3. Lines 136-143 (`getAnalyticsScoring`): the stored scoring total is used when it is finite, and the calculator is used only when it is missing. A season is not scored twice.

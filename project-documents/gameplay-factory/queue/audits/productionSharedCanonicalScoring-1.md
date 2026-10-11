# productionSharedCanonicalScoring.js audit, first half (lines 1-47)

no findings

Riskiest places checked:
1. Line 40-41 (`pcscRequestContext` / `pcscContextMatches`): the key is built from save id, rivalry id and season. A read started for one season is discarded if the cursor moved, so a season N score cannot be shown under season N+1.
2. Line 37-38 (`pcscTeamCount`, `pcscSeason`): a missing league, a team count outside 2 to 20, or a non-integer season throws a code instead of defaulting to a made-up count.
3. Line 46-47 (`pcscEnsureUi`): the panel is inserted before `.seasonReviewActions` and starts with the `hidden` class, so it cannot show before a reconciled score exists.

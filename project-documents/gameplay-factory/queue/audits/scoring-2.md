# Audit: js/scoring.js, second half (JOB-1678)

no findings

Three riskiest places checked:

1. **Lines 69–90 — performance and award labels:** Labels describe the same trigger flags used to award the season's capped bonuses; multiple triggers appear as a combined label without adding extra score.
2. **Lines 93–101 — score-breakdown display:** The five displayed rows map to Champions League, league, cup, performance, and award bonus fields, including the legacy `awardsBonus` alias. No confirmed double counting or missing points for scores produced by `calculatePlayerSeasonScore`.
3. **Lines 103–129 — aggregate score recalculation:** Complete rounds have both scores and their winner recalculated, while incomplete rounds are left out of totals. No confirmed player-visible stale score or off-by-one defect in the supported completed-round path.

Scope: reviewed lines 67–131 (and scoring helpers above for context); no gameplay files changed.

# sharedHistoryConvergence.js audit, second half (lines 59-117)

no findings

Riskiest places checked:
1. Line 79 (`hcScoring`): the winner check reads `!ROLES.includes(value.winner)&&value.winner!=="draw"` with no parentheses. `&&` binds first, so the check is right, but it is easy to break in a later edit. Adding parentheses is a style change only.
2. Line 83-84 (winner tie-break): on equal totals the lower league position wins, then the higher league points, and otherwise it is a draw. This matches the score rules in the first half.
3. Line 113-114 (`hcVerify`): the projection is rebuilt from its own season history and compared with JSON.stringify. Key order is fixed by hcBuild, so a valid projection always matches.

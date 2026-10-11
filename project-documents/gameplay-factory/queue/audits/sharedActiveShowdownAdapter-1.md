# sharedActiveShowdownAdapter.js audit, first half (lines 1-75)

no findings

Riskiest places checked:
1. Line 33-34 (`inspect`, history vs multi-season): when the converged history and the multi-season state disagree on accepted seasons, `p` stays null without an error. The view then reads as loading until both reads catch up. This is not an error, but it can look stuck if the multi-season read never refreshes.
2. Line 47-54 (classification order): loading, unavailable, none, pending, abandoned and active are checked in a fixed order. Each branch covers a different connection state, and a closed rivalry is handled before the pair checks.
3. Line 72-75 (`home`): a closed rivalry maps to the unpaired state, so Home offers a fresh start. The season and score come only from the verified projection.

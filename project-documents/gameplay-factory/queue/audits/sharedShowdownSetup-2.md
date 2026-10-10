# Audit: js/sharedShowdownSetup.js, second half (lines 119-236)

Job 1528 · Queue item 0124 · Read on factory/gameplay-v1 @ 986c7a1e1 (the file on qa/mega-audits differs; the active gameplay line was audited).

## Findings

no findings

## Riskiest places checked (no finding)

- Line 127, the revision rule `min(phaseIndex+1,4)+confirmedRoles.length`: correct. It gives 1 to 4 for the first four phases and 6 at SHOWDOWN_CONFIRMED with two confirmations, which is what the callers gate on (revision 6). Verified against js/sparkSharedShowdownSetup.js `expectedPhase`.
- Lines 177-181, idempotent replay: a repeated operation hash returns the stored state with `status:"replayed"` and no new receipt, and a different request under the same id fails with SETUP_IDEMPOTENCY_CONFLICT. This is checked before the stale-base check (line 182), so a retry is not rejected as stale.
- Lines 145 and 152-159, the draw: the seed is the binding hash, catalog hash, league, purpose and a counter, with no caller input. The same rivalry state always gives the same league and clubs, so a repeated or edited command cannot change the draw. The two club picks come from the list after the first club is removed, so the clubs are always distinct.
- Lines 198-205, the draw check: the league and clubs in the command must equal the seeded result, so a coordinator cannot choose them directly. This matches `directLeagueClubInput:false` in the caller.
- Lines 211-214, confirmations: a manager confirms once, the hash must match the setup as it is now (SETUP_CONFIRMATION_CHANGED otherwise), and the phase becomes SHOWDOWN_CONFIRMED only after both confirmations.
- Line 235, `productionEnabled:false` on this protocol while the production callers use it: the flag is informational and no caller reads it, so it does not change behaviour. It is the same labelling point as sparkSharedShowdownSetup-2.md.

# seasonFinalV10-2 (JOB-1574): second-half audit of js/seasonFinalV10.js

## Finding 1 (PROBABLE): a failed or early closed-history read is cached for the session, so the Final Winner can keep showing no trophies until a page reload
- File and line: js/seasonFinalV10.js lines 160-175, `sfClosedHistory`, with the early return at line 166 and the failure catch at line 172.
- What the player sees: after closing a Showdown, the Final Winner can show "Trophy attribution is unavailable right now" (partial, no trophies) even after the player signs in or the network returns. It clears only after a full reload.
- Why: the entry for the rivalry is stored in `closedHistoryReads` before the read starts, and it is never removed:
  `if(!closedHistoryReads.has(rivalryId)){const entry={history:null,promise:null};closedHistoryReads.set(rivalryId,entry);...`
  If the account is not yet connected (line 166 `if(!account?.connected||!runtime)return;`) or the read fails (`.catch(()=>{})`), `entry.history` stays null. Later `wake()` calls return the same null entry (line 174), so no new read starts.
- Smallest change: when the read ends without a completed history, delete the map entry (`closedHistoryReads.delete(rivalryId)`) so that a later trigger can retry. Retry on account or identity change only, not on every `wake()`, to avoid a repeated request loop.
- Note: this is PROBABLE because the timing of the account connection versus the first `seasonSource` call was not traced in the other modules.

Riskiest places also checked (no finding): `renderFinal` and `restoreFinal` (lines 97-111), which move the live protocol panels back to their own slots before a rebuild, and `sfOwnerTab` (lines 116-122), which falls back to the one open card when the provider role is not yet known.

# sparkCompletedShowdownReader-2 (JOB-1562): second-half audit of js/sparkCompletedShowdownReader.js

## Finding 1 (PROBABLE): an order-sensitive JSON comparison can mark a valid acknowledged season as invalid
- File and line: js/sparkCompletedShowdownReader.js line 135, `csrAcknowledgedCommit`.
- What the player sees: a completed Showdown can show "unavailable" (COMPLETED_SEASON_INVALID) even when the stored results are the same numbers, if the keys of the two stored result maps are in a different order.
- Why: `if(JSON.stringify(value.results)!==JSON.stringify(ready.results))csrFail("COMPLETED_SEASON_INVALID");`
  `JSON.stringify` keeps insertion order. `value.results` comes from the commit document and `ready.results` from the role documents, so the key order of each is set by a different writer.
- Smallest change: compare the canonical form that the file already uses for the content hash, so key order is ignored:
  `if(csrSortedCanonical(value.results)!==csrSortedCanonical(ready.results))csrFail("COMPLETED_SEASON_INVALID");`
  Note: this is PROBABLE because it depends on how the two writers order keys; the writers were not checked.

Riskiest places also checked (no finding): `csrRead` season loop (lines 170-185), which treats any missing season as "unavailable" rather than a shorter history, and the final winner and totals check (lines 188-190) against the Terminal Close witness.

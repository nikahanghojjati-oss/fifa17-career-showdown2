# sparkCompletedTransferHistoryReader-1 (JOB-1563): first-half audit of js/sparkCompletedTransferHistoryReader.js

## Finding 1 (PROBABLE): the transfer catalog is checked against hard-coded counts, so any catalog change makes every completed history unavailable
- File and line: js/sparkCompletedTransferHistoryReader.js line 43, `cthCatalog`.
- What the player sees: after the league or nationality list changes size, a completed Showdown's transfer history shows "unavailable" for every manager, with no way to recover it.
- Why: `if(leagues.length!==36||nations.length!==164)cthFail("TRANSFER_HISTORY_CATALOG_UNAVAILABLE");`
  The counts are fixed in the reader, but the lists come from the game data (`root.FIFA17_TRANSFER_LEAGUES` and `root.FIFA17_TRANSFER_NATIONALITIES`), which can change.
- Smallest change: use a check that does not depend on a count, for example reject only when a stored guess or signing id is not in the catalog (already done in `cthGuesses` and `cthSignings`), and drop the fixed counts. If the counts must stay, note them next to the data file so they are updated with it.

Riskiest places also checked (no finding): the public-season key check and lock ordering in `cthAssertPublic` (lines 84-95), and the provenance hash in `cthAssertProvenance` (lines 114-121). The provenance hash is built from the normalised, sorted guesses and signings, so it matches only if the writer hashed the same sorted form. The writer was not checked.

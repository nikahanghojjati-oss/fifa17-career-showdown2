# JOB-1508 · sparkSharedSeasonResults.js second half audit

Read: `js/sparkSharedSeasonResults.js` lines 103 to 204 (the second half). Lines 1-102 were read in JOB-1507 and are not repeated here.

## Result: no findings

No real player-facing bug was found in the second half. The publish path is idempotent on `operationId` (lines 160 and 196), a second publish with the same operation replays instead of writing again, and the denied-publish recovery (lines 170-199) re-reads the public document at 0, 250 and 500 ms, which matches its comment. The revision and phase transitions (lines 108-111 and 162) agree with each other: revision 1 is COLLECTING, revision 2 is RESULTS_READY, and the opponent result is read only when RESULTS_READY.

Note: the expiry gap found in JOB-1507 Finding 1 (line 60-63, `ssrpAssertSession`) also applies to every call from `ssrpContext` (line 135) in this half. It is not repeated as a new finding.

## Riskiest places checked

1. Lines 183-198 (the denied-publish recovery loop): the stranger case throws after one read (line 193), and the rival case sleeps 250 ms and 500 ms before the last two reads. The loop re-runs `runPublishTransaction` only when the operation is already in the document (line 196), so it cannot write twice.
2. Lines 170-176 (`publishOnce` and the retry): the projection preflight runs at most once successfully (`projectionReady`), and the retry is attempted only when the first failure came from the preflight. A failure after a successful preflight goes straight to the recovery read.
3. Lines 146-147 (`ssrpProjection` and `ssrpRead`): the opponent is read only when the state is RESULTS_READY, and the two context reads run inside one transaction, so the projection cannot mix two snapshots.

No game file was edited. This job adds one audit file only.

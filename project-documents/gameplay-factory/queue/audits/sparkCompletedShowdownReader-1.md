# sparkCompletedShowdownReader-1 (JOB-1561): first-half audit of js/sparkCompletedShowdownReader.js

Result: no findings.

Riskiest places checked:
1. `csrNeverStarted` (js/sparkCompletedShowdownReader.js lines 55-67): a never-joined code is only accepted for the intact creator and open-slot shape. An ACTIVE root or one with a terminal witness is rejected from this path and falls through to the full binding check, so a real Showdown cannot be shown as never-started.
2. `csrVerifyManagers` (lines 68-75): requires exactly two distinct accounts and profiles, both active, and the reader's own account. A mismatch becomes an "unavailable" status, not a wrong result.
3. `csrGet` error mapping (lines 45-48): provider errors are mapped to their code or to COMPLETED_READ_FAILED, and the outer `csrRead` catch (line 192) turns them into an "unavailable" state. No path returns a partial completed result.

# rivalryLegacyV10-2 (JOB-1568): second-half audit of js/rivalryLegacyV10.js

Result: no findings.

Riskiest places checked:
1. `rlLoadCareerModel` publish guard (js/rivalryLegacyV10.js lines 158-178): the cache is written only when the flight is alive, the account and pair context still match, and this is the newest started load. A stale load cannot overwrite a newer model.
2. `refresh` flight, dirty and reschedule logic (lines 180-219): a second request during a flight marks the screen dirty and is re-run after the flight, so an identity or history change is not lost. The `finally` block clears the flight.
3. The 15 s deadline race (lines 200-211): a timeout marks the flight not alive and shows "unavailable" with a report, and a late result is ignored because `context()` and the flight check are re-read, so the screen is not left on LOADING.

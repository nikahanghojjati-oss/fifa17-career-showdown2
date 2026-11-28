# JOB-02 baseline · Two-manager journey on the emulator

Code branch: `gameplay/job-02-two-manager-journey`  
Final head: `5eaa01f2d06b2ec985d3ec40adf03f9a70d799fa`  
PR: #318 into `gameplay/recovery-v1`  
Final 3-season CI: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37053162850  
1-season proof CI: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37052830310

The final CI log says: `PASS two-manager journey Sections A-G (3 seasons main): main journey, stranger denial, privacy, idempotent retry, simultaneous taps, second Showdown known gaps, and persistent-provider abandon all proved.`

| Check | Status | Evidence |
| --- | --- | --- |
| A. Main journey | PASS | Daniel (`playerOne`) and Nik (`playerTwo`) complete setup, career start, every configured season, scoring/history/progression reconciliation and real Terminal Close; the shared projections converge. Final 3-season CI passed on exact head. |
| B. Stranger denied everywhere | PASS | Stranger C is denied rivalry/setup/season/transfer/private-role/pair-link reads after setup, after season 1 commit and after Terminal Close. `seasonCommits` list queries are denied for Daniel, Nik and C. |
| C. Privacy | PASS | Opponent transfer role docs fail before transfer `COMPLETED` and succeed after it; opponent season-result role docs fail before both publish and succeed at `RESULTS_READY`, in both directions. |
| D. Idempotent retries | PASS | Daniel repeats season-1 `commitSeason` with the same operationId/baseRevision; the call replays, the stored commit is byte-for-byte unchanged, and history contains exactly one season-1 row. |
| E. Simultaneous taps | PASS | A `Promise.all` publish race accepts exactly one first writer and one stale writer; the stale writer retries once and the final row is `RESULTS_READY` with two unique roles and two unique operation IDs. |
| F. Second Showdown | KNOWN GAP | R2 pairs again and completes season 1 plus Terminal Close. `KNOWN GAP 1 (fixed by G-8)`: Daniel and Nik cannot read Showdown 1 `sharedSetup/authoritative` or `seasonCommits/season_1` after close. `KNOWN GAP 2 (fixed by G-7)`: each `accounts/{id}/pairLinks/current` points only at the new rivalry. |
| G. Abandon variant | PASS | Fresh R3 plays season 1, then `PersistentPair.abandonCurrentShowdown` closes the rivalry without a `terminalClose` witness; provider and direct season writes are denied afterward. |

The one-season CI proof also finishes with: `PASS two-manager journey Sections A-G (1 season main): main journey, stranger denial, privacy, idempotent retry, simultaneous taps, second Showdown known gaps, and persistent-provider abandon all proved.`

## Bugs found

### Found and fixed in JOB-02 · Setup league draw hex case in Rules

- **What JOB-02 did:** paired into the deterministic second rivalry R2 and played through transfer `COMPLETED`, then Daniel published the first season result.
- **Expected:** `Results.publishResult` succeeds and creates the season-results state.
- **What happened:** it returned `{ok:false, code:"permission-denied"}` twice, including after the job-authorized template-equivalent gameplay reseed.
- **Cause:** `firestore.shared-setup-production.fragment.rules`, in `ssjrSetupBindingHash` and `ssjrSetupLeagueDigest` (about lines 121 and 128), used `hashing.sha256(...).toHexString()`. Firestore Rules returns uppercase hex, while the app's league draw uses lowercase hex and `ssjrSetupHexMod5` recognizes lowercase digits. R2 therefore produced a different Rules-side team count (0) from the app-side team count (18), making `ssjrLeagueProjectionCreateValid` reject the first season-results write. The Team G lead's random-id simulation found this mismatch affects about 37% of Showdowns.
- **Fix:** commit `e45c4f9` changes both calls to `.toHexString().lower()`. The final Rules matrix and both JOB-02 journey lengths are green.

### Harness issue fixed in JOB-02 · Future fixture clock

- **What JOB-02 did:** closed the fresh second Showdown after using activity timestamps derived from `main.now + 200000`.
- **Expected:** Terminal Close succeeds.
- **What happened:** the future-dated fixture could drive the R2 close into Firestore's 1000-expression ceiling.
- **Cause:** `tests/firebase/two-manager-journey-emulator.cjs`, `runSecondShowdownAndAbandon`, used synthetic clocks 200 seconds ahead of real time.
- **Fix:** commit `b6f7eb0` uses fresh `Date.now()` values for R2 and R3, matching production timing.

### Harness issue fixed in JOB-02 · Disabled-Rules read return value

- **What JOB-02 did:** after abandoning R3, read the stored season commit with security rules disabled before proving a direct write is denied.
- **Expected:** retain the stored document data for the denial assertion.
- **What happened:** calling `.data()` on the return value of `env.withSecurityRulesDisabled(...)` throws because that helper returns nothing.
- **Cause:** `tests/firebase/two-manager-journey-emulator.cjs`, the post-abandon stored-commit read in `runSecondShowdownAndAbandon`.
- **Fix:** commit `8d79c1f` assigns the document data inside the disabled-rules callback to an outer variable.

## Final evidence

- Final exact-head `Validate Gameplay Fast` run `37053162850`: Gameplay contracts PASS; Operations audit PASS; Composed Rules emulator PASS; Two-manager journey PASS with `CMS_SHOWDOWN_LENGTH=3`.
- One-season proof run `37052830310`: Two-manager journey PASS with `CMS_SHOWDOWN_LENGTH=1`.
- Final diff versus `gameplay/recovery-v1`: only `.github/workflows/validate-gameplay-fast.yml`, the new `tests/firebase/two-manager-journey-emulator.cjs`, and the approved two-line `firestore.shared-setup-production.fragment.rules` fix.
- Nothing was deployed and nothing was pushed to `main`. The Rules fix will require a separate Rules deploy with Nik's typed approval before it can go live.

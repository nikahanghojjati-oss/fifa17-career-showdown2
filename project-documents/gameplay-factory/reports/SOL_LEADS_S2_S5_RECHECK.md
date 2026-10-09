# Job 1056 — Sol S2 / S5 recheck

Date: 2026-10-09
Source: `gameplay/bug-list-1`. Static reading of the five files named in JOB-1056 only. No code changes or tests run.

## S2 — simultaneous Season Result publication in season 3+

**Verdict: UNSURE.** No definite lost-result bug is visible in the inspected implementation, but the supplied contracts do not reproduce two-device, season-3+ contention.

**Evidence / guards**
- `js/productionSharedSeasonResults.js:47-54` keys requests by save, rivalry and `seasonNumber`; `:58,75-83` serializes this browser's provider work and discards reads after a season-context change.
- `js/productionSharedSeasonResults.js:137-154` reads immediately before publish, sends the latest `baseRevision`, and on a first `SEASON_RESULTS_STALE_BASE_REVISION` re-reads and retries once; an already-published own result is accepted without another write.
- `js/sparkSharedSeasonResults.js:137-141` uses the SAME dynamic `season_${seasonNumber}` identifier for Transfer, public Season Results and the private role documents, with a total-seasons bound. There is no apparent hard-coded season-1 write path.
- `js/sparkSharedSeasonResults.js:156-165` commits the public ledger and the caller's private role document in one Firestore transaction, checks the current revision, preserves operation IDs for replay and progresses to `RESULTS_READY` on revision 2.
- `js/sparkSharedSeasonResults.js:167-199` handles a race-induced permission denial: preflight retry, a fresh public read via `getDoc` or a read-only transaction, up to three public-read attempts, and a stale-revision signal for the caller's retry.

**Exact uncertainty / gap:** The denial recovery in `js/sparkSharedSeasonResults.js:185-199` is bounded to three reads (with 250 ms then 500 ms delays). If all reads are empty, transiently fail or do not observe the winning revision, the original denial still surfaces. Whether that happens on real phones in season 3+ cannot be decided from these files. The UI also has only one retry after a stale response (`js/productionSharedSeasonResults.js:148-154`).

**Covered by:** `tests/contracts/shared-season-results-race-contracts.cjs:8,65-95` proves season-1 stale-loser, denied-stranger and own-operation replay cases using a scripted `getDoc` mock. It does **not** exercise two concurrent Firebase clients, the production read-only-transaction fallback, delayed winner visibility, or season 3+. `tests/contracts/shared-tap-race-contracts.cjs:1-10,307-313` addresses Transfer Challenge, Career Start and Shared Setup, not Season Result publish.

**Two-phone proof needed:** On a three- or five-season showdown, reach seasons 3 and 5, publish both different role results at the same instant with staggered network responses, and confirm both phones leave waiting, the public `season_3` / `season_5` document reaches revision 2/`RESULTS_READY`, each manager's own role document is intact, and both results become visible only after both publish. Repeat with a denial and without `getDoc`.

## S5 — delayed screen update overwrites a newer tap

**Verdict: UNSURE.** The inspected Season Results UI has meaningful stale-response protection, but neither a generic screen-intent guard nor a direct slow-read/newer-tap regression test is demonstrated here.

**Evidence / guards**
- `js/productionSharedSeasonResults.js:58,75-83,144-154` queues refresh and publish provider work on the same promise chain. Each refresh checks the request's current season key after provider context resolution and after the read, before assigning `view` and rendering.
- `js/productionSharedSeasonResults.js:128-135` retains same-context typed form values, resets a form only if the save/rivalry/season/role key changes, and retains the current reviewed `draft` on a poll. `:167-168` resets old-season view/draft on a cursor change.
- **Exact gap to verify:** `js/productionSharedSeasonResults.js:54,75-83,160-162` checks the season-context key but does not check a newer **navigation/tap intent** token. In `pssrOpen`, an awaited refresh is followed by an awaited `navigateTo("seasonEntry")` and no check that the manager has not since navigated elsewhere in the same season. Whether this can actually overwrite a later tap depends on the uninspected navigation implementation; the source does not prove that it happens.

**Covered by:** **none** for the alleged newer-tap UI overwrite. `tests/contracts/context-stale-quiet-contracts.cjs:4-9,47-66` tests that Canonical Scoring and sibling refreshers suppress nested `*_CONTEXT_STALE` notices; it does not simulate a slow Season Results DOM refresh after a newer tap. `tests/contracts/shared-tap-race-contracts.cjs:1-10,307-313` checks competing mutations in other steps, not last-tap-wins navigation.

**Two-phone proof needed:** Delay a Season Results provider read/navigation on one phone, tap Review → Edit or navigate away while it is pending, then release the old response. Verify the latest form/draft, selected screen and manager role are preserved. Repeat while advancing from season 2 to season 3 and polling on the other phone.

## Decision

Neither lead is confirmed REAL from the permitted code-reading evidence. Keep both **UNSURE** pending the specified two-phone repro; do not change gameplay or claim these are established regressions. The Team G lead runs the tests.

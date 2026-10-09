# Job 1057 · Sol leads S3 / S4 recheck

Reviewed 2026-10-09 against `gameplay/bug-list-1`. Code-reading only: exactly the five files named in JOB-1057; no runtime or two-phone test executed. No game code, tests, Rules, or workflows changed.

## S3 · Local Reconciliation stays on "waiting" after both managers finish

**Verdict: UNSURE.** The earlier blanket claim is not established by the current adapter, but the tests do not prove recovery on two live devices when local progression is behind.

**Evidence:**
- `js/sharedLocalReconciliation.js:18-31`: the projection is `BLOCKED` unless Shared History is `HISTORY_CONVERGED` and the exact Connected Rivalry is attached; with no valid live observed envelope it projects `WAITING_REMOTE`.
- `js/productionSharedLocalReconciliation.js:59-73`: when observation is reached, it re-reads the authority. If the remote snapshot does not exist, it can publish and re-read after the local Multi Season projection says `SHOWDOWN_COMPLETE` and `terminal===true`. Line 68 attempts a Multi Season refresh if it sees a missing snapshot with nonterminal local progression.
- **Gap:** `js/productionSharedLocalReconciliation.js:100-111` gates the automatic check on `lrMultiTerminal()` *before* it calls observation; therefore the line-68 stale-progression refresh cannot run from that automatic path while local Multi Season still says nonterminal. History not converged, hidden tab, offline state and a closed Showdown also suppress auto checks. `js/productionSharedLocalReconciliation.js:130-137` adds event wakeups and a 15-second poll, but this five-file scope cannot prove that the separate Multi Season/History runtimes always reach the required local states.
- The code does contain a normal automatic observe/preview path with single-flight, throttle and retries (`js/productionSharedLocalReconciliation.js:75-113`); do not report the old "no automatic refresh" explanation as an established current defect.

**Covered by:** `tests/contracts/shared-local-reconciliation-auto-final-contracts.cjs:61-127` proves mocked terminal happy path, single-flight, retry, closed/hidden/history gates, and reattach-after-reload. **Not covered:** two physical devices where remote final season has committed but one phone's local Multi Season is not yet terminal, or whose History/Connected Rivalry stays nonauthoritative.

**Two-phone proof needed:** Finish the final season on both accounts; on each phone record local Multi Season phase/terminal, Shared History phase/authoritative, exact Connected Rivalry attachment, observed envelope, and Local Reconciliation phase. Keep both pages visible and online for at least two 15-second polls. If the server is terminal but a phone remains nonterminal/`WAITING_REMOTE` without reaching `PREVIEW_READY`, capture which prerequisite failed to advance and the remote-read/publish outcomes.

## S4 · Shared 15-minute transfer timer differs across phones

**Verdict: REAL (code-level skew risk; not an observed two-phone reproduction).**

**Evidence:**
- `js/productionSharedTransferChallenge.js:55-73`: `pstcEnsureServerClock` forces `getIdTokenResult(true)`, takes the token's `issuedAtTime` as `clockServerEpochMs`, but anchors it to `performance.now()` **after** the asynchronous token response. `pstcAuthoritativeNow` then advances that timestamp from the receipt time. Network delay between token issuance and receipt (plus issued-at timestamp granularity) is omitted, so two devices with different response delays can calculate different "authoritative" current times.
- `js/productionSharedTransferChallenge.js:223-231`: `pstcRenderTimer` subtracts that device-specific `pstcAuthoritativeNow()` from the common `state.startedAtEpochMs + 15*60*1000` and rounds remaining seconds up. Even with the same shared start, different clock lags can display different seconds and trigger local expiry attempts at different times. The clock anchor is reused for up to five minutes (`js/productionSharedTransferChallenge.js:13,58-61`); visibility return clears/reseeds it (`:299-301`). This does not establish a full 15-minute discrepancy or broken server-side expiry.

**Covered by:** none for two-phone countdown agreement or issuance-to-receipt latency. `tests/contracts/shared-transfer-challenge-contracts.cjs:55-60` checks only the `serverClockAuthoritative` property; lines 107-139 and 210-214 verify protocol duration and expiry state with supplied timestamps, not two independent UI clock anchors.

**Two-line fix idea (`js/productionSharedTransferChallenge.js`):**
1. Capture monotonic request start and receipt around the forced token refresh, then compensate/estimate the token issuance-to-receipt age instead of anchoring `issuedAtTime` as if it were receipt time.
2. Bound synchronization uncertainty (show `SYNC` rather than a falsely precise countdown on high latency), and contract-test two independent clocks with unequal token-response delays but one shared `startedAtEpochMs`.

**Two-phone confirmation:** Capture both displays simultaneously with the same shared start/revision, plus each phone's token refresh latency and computed clock anchor. A repeatable >1-second skew correlated with unequal refresh delays confirms the visible symptom; the present code already demonstrates that risk.

## Scope / handoff

This is a report-only review. Existing test assertions were read, not executed; the Team G lead runs any follow-up CI or two-phone acceptance. No PR requested.

# productionSharedHistoryConvergence.js audit, second half (lines 57-112)

## 1. PROBABLE: a season-cursor or state event that arrives during an in-flight read is dropped (line 108, line 109)

What the player sees: after CONTINUE TO SEASON N+1 (or a scoring/commit state change that lands during a read), the shared history panel can keep the old season's state, or stay empty, until the next 15 s poll. Because the fast poll only runs when `phcWaitingKey` is non-empty for the new season, it may not run at all.

Why: `phcWake` returns at once when `busy` is true, so the event-driven wake is lost:
`function phcWake(light=false){if(busy||root.document?.visibilityState==="hidden")return;...`
The listener `root.addEventListener?.(event,phcWake)` is registered for `career-mode-shared-season-cursor-change` and the state-change events. The in-flight read for the old key is then discarded by `phcContextMatches` (line 97).

Smallest change: when `busy` is true, set a `pendingWake=true` flag, and in the `finally` of `phcRefresh` call `phcWake()` once if the flag is set (clear the flag first).

## 2. PROBABLE: a first identical read error is hidden for one poll, and a success clears the hold (lines 101-102)

What the player sees: a single transient failure shows an empty panel with no error. The error is reported only when the same error repeats on the next read. A success in between resets `heldErrorKey`, so an alternating failure is never reported.

Why: `heldErrorKey=""` runs on every successful read (line 102, `.then(value=>{heldErrorKey="";...})`), so errors that alternate with successes are held forever.

Smallest change: keep the hold for the same context only, or report after N consecutive failures. This is a design choice, so mark it as a question for the Team G lead.

## 3. Riskiest place checked: `phcRender` (line 83-84)

`projection.managerRecords.playerOne` and `projection.trophyAttribution.playerOne` are read without a guard. The provider result check (line 98) does not validate them. A malformed projection throws a TypeError inside `phcRefreshNow`, which is then reported, not shown as wrong numbers.

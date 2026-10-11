# Audit: js/productionSharedJourneyReconnect.js, second half (lines 73-146)

Job 1518 · Queue item 0104 · Read on factory/gameplay-v1 @ 986c7a1e1 (the file on qa/mega-audits differs; the active gameplay line was audited).

## Finding 1 · PROBABLE · line 124 · a wake during a refresh is dropped, so recovery can lag up to 15 s

What the player sees: the remote session becomes active, or the connection comes back, while a recovery refresh is already running. The screen keeps the older recovery state (for example RECONNECT SESSION or OFFLINE HOLD) until the next 15 s poll.

Why: `pjrWake` returns early while `busy`, and nothing remembers that an event arrived:
```
function pjrWake(){if(busy||!pjrSharedMarker()||root.document?.visibilityState==="hidden")return;void pjrRefresh();}
```
The `online`, `career-mode-shared-setup-state-change`, `career-mode-connected-account-state-change` and session-subscribe events all go through it (lines 127-134), and the refresh that is already running may have read the state before the change.
Smallest change: add a `wakeQueued` flag. In `pjrWake`, when `busy` is set, set `wakeQueued=true` and return. In the `.finally` of `pjrRefresh` (line 122), if `wakeQueued` is set, clear it and call `pjrWake()` once more.

## Finding 2 · PROBABLE · lines 118 and 131 · an offline event during a refresh can be overwritten by an authoritative observation

What the player sees: the browser goes offline while a recovery read is in flight. The offline hold (`OFFLINE_HOLD`) is published, and then the read finishes and publishes an authoritative state with `networkOnline:true` (line 118). The status can then say the journey is recovered and authoritative while the device is offline.

Why: `pjrRefreshNow` checks `pjrOnline()` only at the start (line 105), and the offline listener (line 131) publishes the hold without stopping the in-flight run:
```
root.addEventListener?.("offline",()=>pjrOfflineHold());
...
return pjrPublish(protocol.observe({...base,setup:setupState.setup,progression:progressionView.state}));
```
The read rejects when the network is really gone, so this only shows in the race where the read has already completed. The window is small but it breaks the `offlineNeverAuthoritative:true` contract (line 143).
Smallest change: just before line 118, re-check `if(!pjrOnline())return pjrOfflineHold();`, the same guard used at line 105.

## Riskiest places checked (no other finding)

- Lines 121-122: the `refreshPromise` reuse and the `finally` reset of `busy` and `refreshPromise`. A second caller gets the in-flight promise, and the `finally` clears it only if it is still the current run.
- Lines 113-115: `setupState` is read only when `sameSetupContext` is true, and the revision 6 gate matches the setup protocol.
- Lines 86-89: the reconnect button is re-created on each render with `disabled=busy`, and `pjrRender` runs again in `finally`, so the button cannot stay disabled after a refresh.

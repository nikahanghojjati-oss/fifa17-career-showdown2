# productionSharedCanonicalScoring.js audit, second half (lines 48-94)

## 1. PROBABLE: a season-cursor change during an in-flight read is dropped (line 88, line 91)

What the player sees: after CONTINUE TO SEASON N+1, the shared score panel for the new season can stay empty or show the old season's state for up to the 15 s poll interval. A real read failure on that season change is also not reported.

Why: `pcscTick` returns at once when `busy` is true. The cursor listener calls it with `reread=true`, so the request is dropped:
`if(!pcscSharedMarker()||busy||root.document?.visibilityState==="hidden")return;`
`root.addEventListener?.("career-mode-shared-season-cursor-change",()=>void pcscTick(false,true));`
If a fast 3 s read for season N is still running, the in-flight read is discarded by `pcscContextMatches` (line 68), and nothing re-reads season N+1.

Smallest change: keep a pending flag. Set `pendingReread=pendingReread||reread` when `busy` is true, and in `finally` run `pcscTick(false,pendingReread)` once after clearing it.

## 2. PROBABLE: fast-poll failures are swallowed with no retry state (line 88)

What the player sees: a failed 3 s read during the wait window produces no error and no retry until the next 15 s tick.

Why: `if(light===true)return;` in the catch hides the error. This is intended by the Job 33 note, but combined with finding 1 it means a dropped reread is never reported.

Smallest change: none required for this job; keep the note and fix finding 1 first.

## 3. Riskiest place checked: `pcscRefresh` (line 72)

`if(refreshPromise&&contextKey===request.key)return refreshPromise;` reuses a pending promise only for the same key. A season change starts a new read and overwrites `refreshPromise`; the older promise's `.then` clears it only if it still matches. This looked correct.

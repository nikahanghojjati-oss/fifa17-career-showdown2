# JOB-1483 · Shared Transfer Challenge first-half audit

Scope: `js/productionSharedTransferChallenge.js`, with findings in the first-half mutation/race handling (lines 118–160). Reading audit only. No game files changed.

## 1. SURE · Failed window start can be reported as success

- File: `js/productionSharedTransferChallenge.js:122-125, 140-149`.
- Player sees: The coordinator taps "START SHARED 15-MINUTE WINDOW"; after a permission-denied or other classified race error with the shared phase still `NOT_STARTED`, the button remains on the start screen without an error. The action resolves as successful even though no window opened.
- Why (source):
  ```js
  if(method==="startWindow")return true;
  if(attempt>0&&pstcOutcomeShown(method,current)){if(pstcBindView(current,ctx,request)){pstcSetError("");if(pstcTransferScreenVisible())pstcPrepareReplay();pstcRender();pstcDecorateDashboard();}return true;}
  ```
  On the second read `pstcOutcomeShown("startWindow", current)` returns true for *any* state, including `NOT_STARTED`.
- Smallest change: For `startWindow`, return true only when the refreshed phase is `WINDOW_OPEN` or a later valid transfer phase. If it is still `NOT_STARTED`, allow the existing one-time retry; surface the error if that retry fails.

## 2. SURE · Expired window can conceal an unresolved write denial

- File: `js/productionSharedTransferChallenge.js:148-151`.
- Player sees: At `00:00`, if `advanceExpiredWindow` is denied while the shared phase remains `WINDOW_OPEN`, the clock stays at zero with no visible failure; the next automatic attempt is delayed by the 30-second expiry retry guard. Repeated denials can leave this screen stuck silently.
- Why (source):
  ```js
  if(!PSTC_RACE_CODES.includes(error&&error.code)||attempt>0)throw error;
  if(method==="advanceExpiredWindow"){try{await pstcRefreshNow(request);}catch(_refreshError){}return true;}
  continue;
  ```
  It returns success even if the refresh failed or still reports `WINDOW_OPEN`.
- Smallest change: After the refresh, acknowledge the race only when the authoritative phase has moved beyond `WINDOW_OPEN`. Otherwise use the existing one-retry path and surface a persistent denial or refresh error, instead of unconditionally returning true.

Both findings concern observable error paths; no scoring, transfer rules, or screen order changes are proposed.

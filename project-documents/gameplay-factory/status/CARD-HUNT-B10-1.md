# CARD-HUNT-B10-1 · Career Statistics and Trophy Room keep old online totals

- Verdict: **CONFIRMED IN CURRENT CODE** (MEDIUM confidence for an on-screen occurrence; the code demonstrably misses the cache-update event, but another render or navigation can hide the symptom).
- Origin: `HUNT-B10.md`, finding row 1 (`js/careerScreensV10.js:1264-1467`).
- Checked branch: `gameplay/bug-list-1` (15 October 2026).
- Lane: **Work mode** (screen event invalidation plus a deterministic VM/Node contract; browser not required to prove the missing listener).
- Size: **S** (fewer than 20 production-code lines, plus a focused contract).

## What the player sees

Daniel or Nik leaves Career Statistics or Trophy Room open while the online completed-Showdown career model updates. The screen can keep the preceding trophy or career totals (for example, Daniel still has **3 league titles** after his online record reaches **4**) until an identity event, another render, or reopening the screen.

## Where in today's game

`js/careerScreensV10.js:1431-1436`:

```js
root.addEventListener?.("career-mode-online-identity-change",()=>{
  const live=Object.keys(SCREEN_IDS).filter(screen=>screens.isMounted(screen));
  if(!live.length)return;
  if(live.some(screen=>getters[screen]?.()==null)&&v10Seam().isOnlineCareerRoute(v10Identity())&&v10OnlineModel()==null)v10LoadOnline().catch(v10Fail);
  else v10Redraw();
});
```

`js/rivalryLegacyV10.js:226` actually publishes the event these career screens do **not** listen to:

```js
if(canPublish()&&context()===key&&sequence===careerLoadSequence){careerCache={key,model};if(typeof root.CustomEvent==="function")root.dispatchEvent?.(new root.CustomEvent("career-mode-online-career-model-change"));}
```

## Why

The Team V Career Statistics/Trophy Room binder reads the shared cached model through `v10OnlineModel()` and its `frame:()=>v10Source(screen)` callbacks. Yet it subscribes only to `career-mode-online-identity-change`; a `career-mode-online-career-model-change` carrying a freshly loaded record never calls `v10Redraw()`. The mounted frame is therefore not invalidated. Initial `v10LoadOnline()` completion does redraw, so this defect needs an **independent later** cache update to appear.

This is **not a duplicate** of `CARD-HUNT-A06-1.md`: that card concerns `rivalryLegacyV10.js` discarding same-phase accepted-season convergence changes on the *History/Rivalry Statistics* route; this card concerns `careerScreensV10.js` lacking a subscription to the *career model* event for *Career Statistics/Trophy Room*.

## How to reproduce

Use the existing VM screen harness in `tests/contracts/career-screens-v10-contracts.cjs:165-214`: a signed-in Daniel/Nik account, `getModel:()=>null`, mounted `careerStatistics`, and a cached `ready` model from `tests/fixtures/data-contract-v1/multi-showdown-career.json`. Wait for the first online load to settle. Then replace the stub `CareerModeRivalryLegacyV10.cachedCareerModel()` return value with another valid `ready` model, changing Daniel's `managers.daniel.leagueTitles` and `trophyRoom.cabinet.daniel.leagueTitles` from 3 to 4, and dispatch `career-mode-online-career-model-change` through the captured `addEventListener` callback table. Keep the account, manager and pair unchanged; do not call open or render again.

**Expected:** the mounted Career Statistics frame switches to the new model and shows 4 league titles. **Wrong today:** no listener is registered for that event, so its frame remains the old object and shows 3. Repeat with `trophyRoom`; its cabinet remains stale in the same way. This is a deterministic event/VM reproduction rather than a claim of a completed browser test.

## Failing test to write

`tests/contracts/sweep-online-career-live-refresh-contracts.cjs`

Copy the `vm`, `CareerModeV10Screens` registration/mount stubs, `loadRuntimeScript`, and in-memory provider-backed career fixture from `tests/contracts/career-screens-v10-contracts.cjs:165-214`; change `addEventListener` to retain callbacks and implement a `dispatchEvent` stub. Inputs:

1. A signed-in manager with `getModel:()=>null`, open Career Statistics, valid initial online `ready` model with **3** Daniel league titles; allow initial load to finish.
2. Replace the shared `cachedCareerModel()` value with a second `ready` model with **4** Daniel league titles, dispatch `career-mode-online-career-model-change`, and flush microtasks.
3. Expect one or more invalidation/show calls for the mounted screen and `drawn.get("careerStatistics")` to be the new model (whose Team V frame has Daniel league titles **4**). **Wrong today:** zero calls from this event and the frame remains the first model (**3**).
4. Repeat for mounted Trophy Room; expect the cabinet to show **4**, not **3**. Assert no forced provider read or redraw when neither career screen is mounted, a separately supplied model is in use, or an unrelated account is active.
5. Keep the existing identity-change assertion: switching accounts still uses the identity handler and must not display another account's previous cache.

Run `node tests/contracts/sweep-online-career-live-refresh-contracts.cjs`. The named regression test is **proposed**, not yet implemented or run.

## Smallest fix

Inside `v10Register()` after the identity-change subscription, also listen for `career-mode-online-career-model-change`. If either career screen is mounted, uses the shared online model (`getters[screen]?.()==null`), and belongs to the current online route, call `v10Redraw()` to invalidate and reshow its new frame. Do **not** call `v10LoadOnline()` in response to a cache-publish event: that would read/publish again and could create a reload loop. Retain the existing identity-change reload behavior and no-mounted-screen guard.

## Risk and callers checked on today's branch

- **Shared cache producer:** `js/rivalryLegacyV10.js:208-229` loads and publishes the closed-Showdown career model, emitting `career-mode-online-career-model-change`; it remains the source of truth and must keep account/pair checks.
- **Team V consumer:** `js/careerScreensV10.js:1343-1354,1410-1465` resolves cached data, registers both screens, wraps old renderers and invalidates mounted frames. The event handler should avoid duplicate provider reads and preserve supplied-model routes.
- **Opening paths:** `js/statistics.js:24-41,614-618` mounts Career Statistics; `js/trophyRoom.js:268-273` opens Trophy Room through the same binder. Both need the new-data redraw.
- **Existing event consumer:** `js/seasonFinalV10.js:1917` already listens for `career-mode-online-career-model-change` to wake Standings, demonstrating that this is a supported update signal.
- **Existing tests:** `tests/contracts/career-screens-v10-contracts.cjs:165-214` covers the asynchronous online cache and mounting; `tests/contracts/v10-rivalry-legacy-contracts.cjs:88-105` has another VM screen registration pattern.
- **Distinct earlier card:** `CARD-HUNT-A06-1.md` covers the separate accepted-season signature omission for Rivalry Statistics/History. Fixing that does not add the missing listener here.

No gameplay source or existing test was changed by this card.

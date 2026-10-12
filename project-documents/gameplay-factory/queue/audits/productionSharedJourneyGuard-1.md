# JOB-1675 · `js/productionSharedJourneyGuard.js` first-half gameplay audit

Reviewed lines 1–67 (the first half of 135 lines) on `qa/mega-audits`. Reading audit only; no runtime code changed.

## 1. PROBABLE — Stale per-tab pending marker can block a completed or local showdown

- **File and lines:** `js/productionSharedJourneyGuard.js:18–33`, affecting guarded actions at lines 44–50.
- **Player-visible behavior:** If a tab still holds the pending marker after authoritative saved state says setup is no longer pending, league draw, club assignment, and continuation actions can return `false` and show a blocking notice. The first half does not show where the marker is cleared, so this is conditional on a stale marker surviving.
- **Why (code excerpt):**
  ```js
  if(persistedPending())return true;
  try{return Boolean(root.sessionStorage&&root.sessionStorage.getItem(PENDING_KEY)==="1");}
  ```
  `persistedPending()` returns `false` both for a valid saved state with `setupPending !== true` and for an unavailable saved state; the fallback can overrule a valid negative result.
- **Smallest change:** Distinguish `unavailable` from an authoritative `false` result. Use the per-tab fallback only when the saved-state verdict truly cannot be read; clear or ignore stale markers once a trusted saved-state verdict exists.

## 2. PROBABLE — Guard can briefly fail open before saved state is ready

- **File and lines:** `js/productionSharedJourneyGuard.js:20–33`, `js/productionSharedJourneyGuard.js:44–50`.
- **Player-visible behavior:** If a previously saved Shared Showdown is pending but its save-library runtime has not become ready, and this tab has no per-tab marker (for example a fresh tab), the guard reports no pending setup. If the player can tap a guarded draw/control during that interval, a local action can run against a Shared Showdown. The first half does not prove such a tap is reachable during loading, so this remains conditional.
- **Why (code excerpt):**
  ```js
  if(!runtime||typeof runtime.isReady!=="function"||!runtime.isReady()||typeof runtime.getLibrarySnapshot!=="function")return false;
  ```
  The `false` is indistinguishable from a verified absence of pending Shared Setup, and `pending()` then trusts a potentially absent per-tab marker.
- **Smallest change:** Model saved-state readiness as a third, unknown state and keep shared-setup draw controls unavailable until the trusted state is known. Preserve the existing allowed screen and tap order.

No other first-half issue was sufficiently supported for a finding. Team G should validate the conditional marker lifecycle and loading-window reachability before creating fix jobs.

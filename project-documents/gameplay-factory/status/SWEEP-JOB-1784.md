# SWEEP-JOB-1784 · Season Results Route

Checked against `gameplay/bug-list-1` (release r75), 2026-10-13.

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| Leaving the Showdown screen while Shared Season Results loads could unexpectedly open Results after the player navigated away. | `js/productionSharedSeasonResultsRoute.js:69–74` -> `js/productionSharedSeasonResultsRoute.js:72–75` | **FIXED** | Line 72: `const navigationAtTap=typeof root.getNavigationRevision==="function"?root.getNavigationRevision():null;`<br>Line 73: `await root.loadRuntimeScript("ssjr-production-season-results","js/productionSharedSeasonResults.js",()=>root.CareerModeProductionSharedSeasonResults);`<br>Line 74: `if(navigationAtTap!==null&&root.getNavigationRevision()!==navigationAtTap)return false;` The route now cancels its open when navigation changed during the asynchronous script load. |

Still open: 0

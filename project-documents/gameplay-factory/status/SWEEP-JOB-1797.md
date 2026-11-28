# SWEEP-JOB-1797 · Statistics dependency failure audit sweep

Source: `project-documents/gameplay-factory/status/JOB-1797.md` on `factory/gameplay-v1`.
Today's gameplay checked: `gameplay/bug-list-1`, `js/optionalModules.js` (blob `940532fff3d873a3daafa6aebbfeeb26e4966f92`).

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| When the analytics stylesheet fails early, opening Career or Rivalry Statistics leaves the screen loading and the button busy until its slower script finishes; an unhandled application error can appear. | `js/optionalModules.js:337–340` -> `js/optionalModules.js:337–341` | FIXED | Current lines 337–340: `async function ensureStatisticsModule(){` / `const stylePromise = loadRuntimeStyle("analytics-ui", "css/analytics.css");` / `const visualPromise = ensureRequiredFootballVisualExperience();` / `await Promise.all([stylePromise, visualPromise, ensureStatisticsScript()]);`. All three dependencies are observed immediately, so failed stylesheet loads reach the module's error path without waiting on the script. |
| Other checked navigation authority, cache reuse, and season-statistics counts did not produce another distinct gameplay bug. | `js/optionalModules.js` (original auxiliary checks) -> not applicable | NOT A BUG | Original report: “no counting logic was changed”; its single SURE finding was the dependency failure above. |

Still open: 0

# SWEEP-JOB-1796 · Optional stylesheet loading audit sweep

Source: `project-documents/gameplay-factory/status/JOB-1796.md` on `factory/gameplay-v1`.
Today's gameplay checked: `gameplay/bug-list-1`, `js/optionalModules.js` (blob `940532fff3d873a3daafa6aebbfeeb26e4966f92`).

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| When the Statistics stylesheet fails before its script, an unhandled rejection triggers an unexpected application error before the normal failure message; the failure cannot be caught promptly. | `js/optionalModules.js:63,73,87–88` -> `js/optionalModules.js:88–90` | FIXED | Current lines 88–90: `runtimeStylePromises.set(key, promise);` / `promise.catch(() => {});` / `return promise;`. The immediate observer prevents an unhandled rejection while the original rejecting promise still reaches its caller. |
| Other checked loader paths: retrying runtime scripts, shared analytics assets, and correct Statistics destination; no separate player-hit finding was reported. | `js/optionalModules.js` (original auxiliary checks) -> not applicable | NOT A BUG | Original report: “no separate ten-season counts bug was found”; other investigated loader behavior passed its checks. |

Still open: 0

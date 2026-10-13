# SWEEP-JOB-1798 · Football visuals audit

Source: `project-documents/gameplay-factory/status/JOB-1798.md` on `factory/gameplay-v1`. Checked against `gameplay/bug-list-1` (r75). The source audit reports **no SURE or PROBABLE player-reachable bugs**, so there are no outstanding gameplay findings to classify and no visual-only findings.

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| No reported player-reachable gameplay bug. The archived player-photograph renderer is not used by the current Showdown screens. | `js/footballVisuals.js:249-260` -> `js/footballVisuals.js:249-260`; `data/footballVisuals.js:173` -> `data/footballVisuals.js:173` | NOT A BUG | `if(FOOTBALL_VISUAL_FREE_SCREENS.has(screenName)){ return true; }` (current renderer line 257); `const FOOTBALL_VISUAL_SCREEN_PLAN = Object.freeze({});` (current manifest line 173). |

Current r75 code retains the 11 photo-free screen names in `js/footballVisuals.js:251-254`; the guard at line 257 returns before preparing any photograph for these screens. Nothing from this report needs adding to the gameplay bug list.

Still open: 0

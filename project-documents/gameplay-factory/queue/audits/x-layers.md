# JOB-1476 · Screen stacking audit

**Result:** No confirmed dialog-below-screen or toast-below-dialog inversion can be proved from the four permitted stylesheets alone. Two **verification gaps**, not reproduced bugs, merit a targeted follow-up. All 22 explicit `z-index` declarations are inventoried in `project-documents/gameplay-factory/queue/results/Z_INDEX.md`.

| # | Screen / component | File and line | What could go wrong / smallest safe change |
| ---: | --- | --- | --- |
| 1 | App-wide runtime toast / notification | `css/v10Shell.css:154-156` | `#appRuntimeNotice` gets Team V colors but no `z-index` in the inspected files. Whether it clears dialogs depends on uninspected base/inline rules. **Verify actual notice and dialog host layer/stacking contexts first.** If notice is below a dialog, add one shared toast-level token in `v10Shell.css` and set `#appRuntimeNotice { z-index: var(--sd-layer-toast); }` without changing the notice's existing positioning. |
| 2 | Settings full-screen dialog | `css/rulesSettingsV10.css:4-14`; compare `css/v10Shell.css:49` | The Settings stage is `position:fixed`, but its inspected rules do not declare the **host** `#settingsOverlay` layer. `#settingsClose {z-index:20}` only orders content inside its own stacking context; it does not ensure the host clears the global header (41) / stage (30). **Verify the overlay host's existing base style first.** Only if its layer is insufficient, set its host to a shared dialog-level token above header 41, not a higher z-index on the close button. |

## Proposed ordering (conditional, not a code change)

| Layer | Target relative order |
| --- | --- |
| Screen | 30 |
| Navigation / non-Home header | 40 / 41 |
| Dialog host and scrim | Above 41 |
| Toast and urgent notice | Above dialog host |

The four permitted files do not establish overlay / toast paint order; avoid claiming a reproduced visual defect or changing behavior without verifying the excluded owners. The screen stage declarations themselves are consistent (30). This was a reading audit only: **no game files were edited**, no visual/browser tests or contracts were run.

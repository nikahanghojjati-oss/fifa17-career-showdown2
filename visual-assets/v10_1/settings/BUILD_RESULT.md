# Settings · BUILD_RESULT

## Phone

The portrait layout uses a fixed viewport shell with no page scrolling. Settings content scrolls only inside `#settingsContent`. The primary `DONE` action is pinned above the shared 56 px bottom navigation reserve plus `env(safe-area-inset-bottom)`.

### Height budget

CSS constants at portrait ≤ 760 px:

- title band: 112 px
- state rail: 34 px
- title-to-content gap: 8 px
- content-to-action clearance: 18 px
- pinned primary action: 44 px
- action-to-nav gap: 10 px
- shared bottom-bar reserve: 56 px + safe-area inset

Fixed non-content height at zero safe-area inset is `112 + 34 + 8 + 18 + 44 + 10 + 56 = 282 px`. The remaining height is the internally scrolling content viewport.

| Target | Viewport height | Fixed shell | Internal content viewport | Remaining / fit |
| --- | ---: | ---: | ---: | ---: |
| 393 × 660 | 660 px | 282 px | 378 px | 0 px overflow · PASS |
| 360 × 640 | 640 px | 282 px | 358 px | 0 px overflow · PASS |
| 375 × 553 | 553 px | 282 px | 271 px | 0 px overflow · PASS |

If the device reports a safe-area inset of `S` pixels, the navigation reserve becomes `56 + S` and the internal content viewport becomes the table value minus `S`. The outer page still remains fixed to `100dvh`, while `#settingsContent` owns vertical scrolling. The pinned `DONE` action remains above the navigation reserve at 375 × 553.

Claude verifies H5, H6, H7, H8, H9, H10 and H11 in the real browser at intake.

# Settings · BUILD_RESULT

## Run

Serve the repository root with any static HTTP server and open:

`visual-assets/v10_1/settings/index.html?frame=ST1`

Frames: `ST1` default, `ST2` reduced motion, `ST3` destructive confirmation, `ST4` loading, `ST5` empty, `ST6` unavailable, `ST7` partial.

## Build summary

Settings is a system-style screen rather than a mockup reproduction because no dedicated Settings mockup exists. It uses the shared empty stadium, centred SETTINGS brush wordmark, gold-edged smoked-glass panels, one gold DONE action, real product account/update/motion/feedback/data controls, and a red destructive treatment for current-Showdown deletion.

Product truth overrides retained in the build:

- BUILD and uncontracted local career/history summary rows are not presented as career data.
- The required Marco Reus credit is repeated in Settings as DOM text and links.
- Offline/provider engineering panels are not promoted into the player-facing visual.
- ST1–ST7 cover every contract state without fake zeroes.
- Phone is a dedicated one-column composition with an internal content scroller, pinned DONE action and the shared bottom-nav reserve.

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

Fixed non-content height at zero safe-area inset is `112 + 34 + 8 + 18 + 44 + 10 + 56 = 282 px`.

| Target | Viewport height | Fixed shell | Internal content viewport | Remaining / fit |
| --- | ---: | ---: | ---: | ---: |
| 393 × 660 | 660 px | 282 px | 378 px | 0 px overflow · PASS |
| 360 × 640 | 640 px | 282 px | 358 px | 0 px overflow · PASS |
| 375 × 553 | 553 px | 282 px | 271 px | 0 px overflow · PASS |

With a safe-area inset of `S`, the content viewport becomes the table value minus `S`; the outer page still remains fixed to `100dvh`. The pinned DONE action remains above the navigation reserve at 375 × 553.

## Code scorecard

| Criterion | Score | Evidence |
| --- | ---: | --- |
| 1 · Mockup fidelity | 4 | No own mockup; composition follows the required shared system language. |
| 2 · Characters | 5 | Intentionally no managers on the Settings system plate. |
| 3 · Hands/contact | 5 | No hands or contact illustration exists on this screen. |
| 4 · Lighting/grade | 4 | Warm stadium plate, heavy calm scrim and gold-edged dark glass. |
| 5 · Typography/title | 4 | Brush wordmark image plus hidden accessible heading and shared type system. |
| 6 · Panel craft | 4 | Four aligned panels, one gold primary, outlined secondary and red danger action. |
| 7 · Information clarity | 4 | Real controls and all five contract states are explicit and honest. |
| 10 · Polish | 4 | DPR-aware desktop art, portrait art, focus rings, inert confirm background and no debug copy. |

## Estimated first-paint weight

`intake_report_SYS.md` reports the desktop 2X plate at 705,436 B and phone portrait at 138,228 B. Both leave material headroom under the 900 KB desktop / 450 KB phone H11 ceilings for the small wordmark and UI files. Claude verifies the real network total.

## Known gaps

- Browser-only H5–H11 measurements remain Claude-owned by factory rule.
- The screen has no dedicated Settings mockup, so system-style composition rather than pixel-diff fidelity is the authority.
- The preview generator needs the committed binary WebP plates and wordmark; this worker does not generate binaries.

## Claude intake

Run `tools/MAKE_ASSETS.md`. It builds `preview.html` only; no screenshot or binary asset generation is required for Settings. Then render every ST frame on desktop and the phone targets and verify H5–H11.

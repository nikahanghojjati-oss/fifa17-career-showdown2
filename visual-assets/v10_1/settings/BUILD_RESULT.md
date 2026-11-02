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

## Fix round

- Review fix list (REVIEW.md, JOB-096): empty. It says no worker code fix is justified; H5-H11 are Claude measurements, not fix items.
- Jobs 97 (items 1-3) and 194 (items 4-6): no items. Job 195 (items 7-9): no items.
- Done: none. Blocked: none.
- Claude must re-measure H5-H11 on the real server (phone fit at 393x660, 360x640, 375x553; contrast; reduced motion; keyboard focus; console and requests; first-paint weight).

## Motion

Job 196 wires the shared kit: `data-sd-enter` on the title wrapper (`.settingsWordmarkWrap`), the four panels and DONE; `settings.js` calls `sdEnter(stage)` once after the first frame is applied. Transform and opacity only; the title wipe is the kit's overlay.

| Element | Role | Delay | Duration | Easing |
| --- | --- | --- | --- | --- |
| Brush title `SETTINGS` | title | 250 ms | 450 ms wipe | shared ease-out |
| Account panel | panel | 400 ms | 16 px rise + fade | shared ease-out |
| Application panel | panel | 460 ms | same | same |
| Motion & Feedback panel | panel | 520 ms | same | same |
| Showdown Data panel | panel | 580 ms | same | same |
| DONE button | button | after panels begin | one pulse | shared |

Total entrance is under 1.2 s (kit cap) and every panel is visible by about 0.6 s. Reduced motion (system setting or the app setting through `html[data-motion-reduced]`) gives a 150 ms fade only; `settings.css` also hides the title wipe overlay in both cases. Measured on a real server at 1366x768: at 250 ms the first panels were mid-animation, at 1.75 s every enter element had opacity 1 and no transform; with reduced motion nothing was animating at 250 ms. 393x660 and 360x640: no scroll, no console errors.

Criterion 8 self-score: 4. The entrance follows the shared choreography; Settings has no characters or numbers to count, so no extra reveal.

## Claude intake

Run `tools/MAKE_ASSETS.md`. It builds `preview.html` only; no screenshot or binary asset generation is required for Settings. Then render every ST frame on desktop and the phone targets and verify H5–H11.

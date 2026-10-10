# JOB-1469 — Phone notch and bottom home-bar safe-area audit (stage 1)

**Scope:** Read-only source audit of `css/v10Shell.css`, `css/v10Transfer.css`, and `visual-assets/v10_1/season-results/app.css` on `qa/mega-audits`. No browser/device reproduction, no other Team V source inspected. These are findings for Team G to validate and turn into a separate fix job; **no game or frozen visual files changed**.

| # | Screen | File and line | Observation / impact | Smallest candidate change |
| --- | --- | --- | --- | --- |
| 1 | Final Winner (phone) | `visual-assets/v10_1/season-results/app.css:67-71`, `:114-116` | **Likely bottom-bar overlap.** The mobile `.finalWinnerActionsSlot` is absolutely bottom-anchored at `8px` with no `env(safe-area-inset-bottom)` adjustment. The final stage is scrollable on smaller phones, but scrolling to the end still places the action row near the unsafe bottom edge. Check on an iPhone with a home indicator. | In a **production override outside frozen `visual-assets/v10_1/`**, set the phone final action slot's `bottom: calc(8px + env(safe-area-inset-bottom, 0px))`; also confirm scroll content has room for that moved row. Do not edit the frozen source file. |
| 2 | Shared shell / hub bottom nav (phone) | `css/v10Shell.css:6-8` | **Conditional gap risk.** The hub reserves `var(--sd-nav-bottom-space, 56px)` under `#app`, with no inset visible here. If `--sd-nav-bottom-space` is only the nav's nominal 56px (rather than including the home-indicator inset), the final scroll content can land behind the bottom bar. This cannot be established from the allowed files alone. | First confirm where `--sd-nav-bottom-space` is defined. **Only if** it excludes the inset, reserve the total bottom-nav height *plus* `env(safe-area-inset-bottom, 0px)` in `css/v10Shell.css`; avoid double-counting when the variable already includes it. |

## Existing protections / no finding

- **Home and non-setup stage header chips:** phone top placement already includes `env(safe-area-inset-top)` (`css/v10Shell.css:36-40,68-72`). Legacy tools' phone header also does (`:198-200`).
- **Transfer War portrait:** hero art uses a safe top (`css/v10Transfer.css:83-88`); `.hud-footer` adds bottom-inset height and padding, while fixed end/lock/continue buttons are raised by the inset (`:135-139`). No repeat report for those controls.
- **Season Results input/review:** the final phone overrides put result and review actions in normal scroll flow rather than keeping the desktop sticky layout (`visual-assets/v10_1/season-results/app.css:305-359`), with inset-aware padding on the last entry action row (`:359`).
- **Limits:** This three-file audit cannot prove whether the shared nav variable incorporates an inset, or whether separate Team V plate styles already protect landscape-side notches. Verify on device before assigning fixes. No runtime tests were run because this ticket is a reading-only audit.

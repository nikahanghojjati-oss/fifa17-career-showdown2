# JOB-1474 — Font fallback while loading (stage 1)

**Base:** `qa/mega-audits`  
**Method:** static CSS reading only; no browser/slow-network trace.  
**Files inspected (and no others for the font audit):**
- `visual-assets/v10_1/shared/showdown-type.css` (lines 1–113)
- `css/v10Shell.css` (lines 1–263)

## Findings (3; CSS-only suggestions for Team G)

| Screen / surface | File and line | Risk / what is wrong | Smallest CSS change |
| --- | --- | --- | --- |
| Home and Team V header identity/season chips; sign-in labels, buttons, notices, and legacy controls | `css/v10Shell.css:29,57,114,124,143,165,192,225,239` | Local fallback for condensed `Barlow Condensed` is only generic `sans-serif`. If the custom property is absent, and Barlow Condensed is slow/unavailable, a normal-width system sans can widen caps and change chip/button width and wrapping. **Conditional:** if `--sd-font-condensed` is defined with a good full fallback stack elsewhere, that stack wins and this issue does not manifest. | Use a narrow system fallback in this sheet’s default stack, e.g. `var(--sd-font-condensed, "Barlow Condensed", "Arial Narrow", "Roboto Condensed", sans-serif)`; ensure the **custom property's value** also supplies narrow fallbacks, not only the `var()` default. |
| Sign-in / connection overlay heading | `css/v10Shell.css:117` | The `--sd-font-title` fallback is just generic `cursive`. On phones without the intended script face, this can select a visibly different system script, changing glyph widths/line breaks when the webfont arrives. This is likewise conditional on the actual token value. | Use a named script-system fallback before `cursive`, e.g. `var(--sd-font-title, "Segoe Script", "Brush Script MT", cursive)`, and ensure the token value includes suitable installed alternatives. |
| Settings → History & Backup / Legacy 40px statistic numbers | `css/v10Shell.css:227` | The large condensed `Bebas Neue` number falls straight to ordinary `sans-serif` when the display token is missing; a wider face can move neighbouring metric labels or wrap during late font arrival. Again the `var()` default is bypassed whenever `--sd-font-display` is defined. | Mirror an installed narrow-font fallback in the default and the token value, e.g. `var(--sd-font-display, "Bebas Neue", "Arial Narrow", "Roboto Condensed", sans-serif)`. |

## Font-loading verification limit

Neither inspected file contains an `@font-face` rule or `font-display`. Therefore **no finding about an actual missing or incorrect `font-display` descriptor is supported by these two files**. `showdown-type.css:7,31,61,71,78,90` uses `--sd-font-*` variables from a separate token sheet; the header of that CSS explicitly requires the tokens to load first. The values of those variables and the actual `@font-face` registrations are outside the ticket's **read-only two-file scope**. Team G should inspect those declarations separately and prefer `font-display: swap` or another reasoned strategy per face after considering layout shift.

No game code, design asset, font registration, or test was changed.

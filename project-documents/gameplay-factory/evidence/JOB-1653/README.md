# JOB-1653 Club reduced motion measurements

Baseline: `gameplay/bug-list-1` at `c49f823097acef21528a641a51c772f4b47a359a`.
JOB-1652 was still an open draft, so this uses the existing application preference API.

The real app first settles on Home, then opens Club and renders its six stages
using the product's own functions. REDUCE MOTION uses an unreduced device;
FOLLOW DEVICE uses `prefers-reduced-motion: reduce`. Each preference is selected
before Club's script loads. No provider or production account is involved.

`motion-measurements.json` records every observed effect over 100 ms, with a
selector identifying its target, duration, delays and play state. The recorder
samples `document.getAnimations()` every animation frame for at least 200 ms per
stage and also examines computed CSS animations and transitions, including
pseudo-elements. Retained paused/finished effects count too. Both requested
viewports (393×660 and 1280×800) produced these duration sets:

| Stage | Before: REDUCE MOTION | Before: FOLLOW DEVICE | After: both modes |
| --- | --- | --- | --- |
| ready | none over 100 ms | none over 100 ms | none over 100 ms |
| opening | none over 100 ms | none over 100 ms | none over 100 ms |
| manager-one | 600 ms pack/name, 520 ms camera | 600 ms pack/name | none over 100 ms |
| manager-two | 600 ms pack/name, 520 ms camera | 600 ms pack/name | none over 100 ms |
| versus | retained 600 ms pack/name, 360 ms slam | retained 600 ms pack/name, 150 ms fades | none over 100 ms |
| confirmation | retained 600 ms pack/name, 420 ms stamp | retained 600 ms pack/name, 150 ms fades | none over 100 ms |

The settled baseline's computed CSS durations already met the limit. The new
Club-scoped CSS rule also pins delays and outranks the frozen Club sheet's
important fades. The glue zeroes script effect timing and finishes at the final
keyframe after mount, stage changes, measured relayout, window resize and live
effective-preference changes. Teardown removes the added listener and observer.
Team V files and gameplay logic are unchanged.

Reproduce the regression check with the repository's static test server running:

```sh
node tests/support/static-server.cjs
# In a second terminal; the flag supports multiple cloud Chromium contexts:
CMS_CHROMIUM_MULTI_CONTEXT=1 node tests/browser/v10-screen-flash-audit.cjs
```

The flash guard retains all existing checks and adds all six Club stages at both
requested sizes and both preference modes at its existing 4× CPU throttle. It
also checks resize, live app/device preference changes, visible revealed names
and confirmation, and normal motion with reduced motion disabled. Club failures
are blocking and cannot be reported as skips. Its JSON report includes each
stage's animation/CSS findings and the normal-motion control.

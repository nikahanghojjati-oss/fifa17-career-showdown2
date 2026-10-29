# HO-046 · League wheel spin: drawn slice lines, no dashed flicker while it turns (Team V → Team G)

**From:** Team V (thread "Hunt and fix visual bugs") · **Date:** 29 Oct 2026 · **Requested by:** Nik ("the spinning doesn't look smooth premium and high quality")

## What Nik sees
While the League wheel turns, the five gold lines between the slices break into dashes and flicker, and the whole spin reads rough. Once it stops they look fine again.

## Why
The dividers in `css/v10Setup.css` were a `repeating-conic-gradient` sliver of 0.5°: thinner than one pixel at the hub and about 2 px at the rim. A rotating element is a texture on the GPU; resampling a sub-pixel sliver at a new angle every frame gives a dashed, shimmering line. The motion itself is fine (60 fps, one composited transform transition).

## Fix (one CSS rule, Team V file)
- The five dividers are now five SVG strokes (width 2.4 on a 480 box, round caps) as the track's background image: one clean line at every angle and every size.
- `backface-visibility: hidden` and `will-change: transform` on the track keep one GPU layer for the whole 4 s transition.
- Nothing else changes: gold wedge, rim, hub, names, 3 turns, HO-041 easing, layout at every breakpoint.

Branch `claude-visual/r86-wheel-spin-lines` @ 5a0a94b2 from gameplay/r86 858c68dd; PR into gameplay/r86 (link on the relay ticket). Patch copy: `attach/HO-046/HO-046_v10Setup.css.patch`.

## Evidence (same build, same frame time)
- `attach/HO-046/BEFORE_AFTER_DESKTOP_1440_midspin.jpg`
- `attach/HO-046/BEFORE_AFTER_DESKTOP_1920_midspin.jpg`
- `attach/HO-046/BEFORE_AFTER_PHONE_393_midspin.jpg` (393x852 at 3x)

## Checks
Spin frames at 400–3600 ms at 1440x900, 1920x1080, 393x852: solid lines. Frame probe: median 16.7 ms, no dropped frames at 1440. Phone marble face check PASS (12 screens). `v10-setup-contracts` 10/10, `career-screens-v10-contracts` 12/12.

## Resources used
- MDN, CSS easing functions (cubic-bezier, why ease-out curves read as a wheel slowing): https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Easing_functions
- GSAP forum, wheel spin woes (spin as one transform, long ease-out, never animate the texture): https://gsap.com/community/forums/topic/6724-wheel-spin-woes-with-greensock-v12-js/
- CSS-Tricks on gradient hairlines and anti-aliasing in transforms: https://css-tricks.com/?p=343623

## For Team G
Merge the PR into gameplay/r86 (ships with r86). No test changes needed.

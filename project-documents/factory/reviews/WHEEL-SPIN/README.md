# League wheel spin polish (29 Oct 2026)

Asked by Nik: "the wheel spinning on desktop and phone needs polish, while spinning there are multiple errors".
Checked on main e849e0ff, shared (two-player) League Wheel, desktop 1440x900 and phone 393x660, recorded frame by frame.

## Errors found on main
1. The winner is given away the moment the wheel starts: the league name, "<league> is locked for both managers." and "LEAGUE REVEALED" all show at 0.4 s, before the wheel has turned.
2. CONTINUE TO CLUB PACKS is live during the spin, so a tap skips the spin.
3. The WORKING… button turns see-through (app.css disabled opacity .48), against the no-dim rule (HO-027).
4. The spin is too fast at the start (6 turns in 4 s, about 40 degrees a frame), so names strobe and read as a glitch.
5. The winner is cut off: the wheel stops at about 4.4 s, the gold flash starts at 4.5 s and the screen jumps to the club packs at 4.67 s (auto-forward was 4.2 s from the start of a 4.1 s spin).
6. League names fade into the gold top wedge while they pass under it.
7. On phone the status line wraps to two lines at the reveal and the note pops in, so the buttons jump.

## Fix (WHEEL_SPIN_POLISH.patch, against main e849e0ff)
- js/productionSharedShowdownPresentation.js: during the 4.1 s spin the heading and the button say SPINNING…, the button is off, the lock note waits; the league, note and Continue appear when the wheel stops. The revealed league then holds 2.6 s before the club packs (forward 6.7 s; 2.6 s after a hidden tab comes back). 3 turns instead of 6. Shorter reveal status "LEAGUE REVEALED · No reroll." (one line on phone).
- js/leagueWheel.js + css/app.css: smoother easing cubic-bezier(.2,.62,.18,1); the local wheel turns 3 times instead of 5.
- css/v10Setup.css: busy/spinning buttons keep the full gold look (no see-through); names and marks get a dark edge while spinning; the lock note slides in with the result.
- tests: fewer-taps contracts and the polished-presentation browser audit updated to the new timing (league hidden until the wheel stops).

## Tests
fewer-taps-contracts PASS (29), shared-showdown-polished-presentation contracts PASS, v10-setup contracts PASS, polished-presentation browser audit PASS. Full test:contracts: the same 6 files fail on clean main as with the patch (career-screens-v10, v10-transfer, v10-club, reus-gate-startup, r78-marble-confirm, r83-slow-reload-home), so no new failures.

## Not in this patch
The Club Assignment screen's first ~0.5 s after the wheel (title and panels fade in from black) is the club screen's own entrance, not the wheel. Separate job if Nik wants it.

Pictures: BEFORE_AFTER_DESKTOP.jpg, BEFORE_AFTER_PHONE.jpg.

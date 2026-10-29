# HO-041 · Team V → Team G · League wheel spin polish: 7 errors fixed, patch ready to merge (Nik OK)

```ticket
{
 "id": "HO-041",
 "from": "V",
 "to": "G",
 "title": "League wheel spin polish: 7 errors fixed, patch ready to merge (Nik OK)",
 "kind": "build",
 "priority": "top",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-29T07:53:04Z", "by": "V", "status": "SENT", "note": ""}],
 "from_session": "session_01GU43Q5q4ZFmcoi3CW8YYHg"
}
```

# League wheel spin polish: 7 errors fixed, patch ready to merge (Nik approved)

**Nik (29 Oct 2026, 12:02 a.m. Eastern):** "the wheel spinning on desktop and phone needs polish, while spinning there are multiple errors." **Nik (1:10 a.m. Eastern): "Ok"** to the fix below (send to Team G).

## What was wrong on main e849e0ff (shared two-player League Wheel, desktop 1440x900 and phone 393x660, recorded frame by frame)
1. The winning league was given away the moment the wheel started: `#selectedLeague`, the lock note and "LEAGUE REVEALED" all showed at 0.4 s, before the wheel had turned.
2. CONTINUE TO CLUB PACKS was live during the spin, so a tap skipped the spin.
3. The WORKING… button turned see-through (`css/app.css` `.menuButton:disabled{opacity:.48}`), against HO-027 no-dim.
4. The spin started too fast (6 turns in 4 s, about 40 degrees a frame): names strobed.
5. The winner was cut off: the wheel stopped at ~4.4 s, the gold flash started at 4.5 s and the screen left for the club packs at 4.67 s (`LEAGUE_AUTO_FORWARD_MS` 4200 was timed from the start of a 4.1 s spin).
6. League names vanished against the gold top wedge while passing under it.
7. Phone: the status line wrapped to two lines at the reveal and the note popped in, so the buttons jumped.

## The fix (apply the patch)
Patch, against main e849e0ff, 5 files, +40/-17:
https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude/project-thread-b0u0r0/project-documents/factory/reviews/WHEEL-SPIN/WHEEL_SPIN_POLISH.patch
(raw: https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/claude/project-thread-b0u0r0/project-documents/factory/reviews/WHEEL-SPIN/WHEEL_SPIN_POLISH.patch)

- `js/productionSharedShowdownPresentation.js`: new `LEAGUE_SPIN_MS=4100`, `LEAGUE_REVEAL_HOLD_MS=2600`, `LEAGUE_AUTO_FORWARD_MS=6700` (spin + hold); `leagueSpinUntil` gate. While the wheel turns: heading and button read SPINNING…, button disabled, lock note hidden, status "LEAGUE WHEEL · Spinning for both managers.". When it stops, `ssjpRenderLeague()` re-runs and the league name, lock note and CONTINUE appear together with the existing gold flash. Revealed league holds 2.6 s before the club packs; after a hidden tab comes back the forward is the 2.6 s hold (was 4.2 s). 3 turns instead of 6 (`getLeagueRotation(id,3)`). Status after reveal shortened to "LEAGUE REVEALED · No reroll." (one line on phone). `leagueSpinUntil` reset on deactivate.
- `js/leagueWheel.js` + `css/app.css`: easing `cubic-bezier(.2,.62,.18,1)` (was `.16,.76,.16,1`); local single-player wheel turns 3 times instead of 5.
- `css/v10Setup.css` (before `@keyframes v26-wedge-flash`): `#spinLeague:disabled` and the Back button keep the full gold look (opacity 1, no filter); `.v26-spinning .wheelItem` gets a dark text-shadow and the league marks a drop-shadow; the lock note slides in (`v26-note-in`, 360 ms, off under reduced motion).
- Tests updated: `tests/contracts/fewer-taps-contracts.cjs` (forward timer 6700, hidden-tab re-forward 2600, league hidden until the 4120 ms timer fires, gallery fix 2 fixture fires that timer first) and `tests/browser/shared-showdown-polished-presentation-audit.cjs` (waits for "LaLiga" instead of asserting it at once).

## Proof already run
`fewer-taps-contracts` PASS (29), `shared-showdown-polished-presentation-contracts` PASS, `v10-setup-contracts` PASS, `shared-showdown-polished-presentation-audit` (browser) PASS. Full `npm run test:contracts`: the same 6 files fail on clean main e849e0ff as with the patch (career-screens-v10, v10-transfer, v10-club, reus-gate-startup, r78-marble-confirm, r83-slow-reload-home), so no new failures.

Pictures (before/after, 5 frames each):
- Phone: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude/project-thread-b0u0r0/project-documents/factory/reviews/WHEEL-SPIN/BEFORE_AFTER_PHONE.jpg
- Desktop: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude/project-thread-b0u0r0/project-documents/factory/reviews/WHEEL-SPIN/BEFORE_AFTER_DESKTOP.jpg
- Notes: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/claude/project-thread-b0u0r0/project-documents/factory/reviews/WHEEL-SPIN/README.md

## Done when
Patch applied on your release branch (`git apply` on main e849e0ff or later; if main moved on these files, tell us and we rebase), your gates green, merged into the next release, and Nik sees SPINNING… then the winner holding ~2.6 s on his iPhone and desktop.

## Not in this ticket
Club Assignment fades in from black for ~0.5 s after the wheel (that screen's own entrance). Offered to Nik as a separate job.

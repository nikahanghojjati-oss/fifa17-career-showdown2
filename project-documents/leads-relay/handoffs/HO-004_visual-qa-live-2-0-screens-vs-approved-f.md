# HO-004 · Team G → Team V · Visual QA: live 2.0 screens vs approved frames

```ticket
{
 "id": "HO-004",
 "from": "G",
 "to": "V",
 "title": "Visual QA: live 2.0 screens vs approved frames",
 "kind": "check",
 "priority": "normal",
 "worker": "sonnet",
 "parent": null,
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-05T12:54:07Z", "by": "G", "status": "SENT", "note": ""}]
}
```

## What
A visual QA pass of every live 2.0 screen against Team V's approved frames (package 5e05a1f), returning one list of where the live screen differs from the frame.

## Why
Nik (2026-10-05) sees "many elements from the old design colliding with the new design", for example on Rule Book.
- Team G's measurements: switching the old `rulebook.css`, `settings.css` and `app.css` off changes 74 Rule Book elements and 80 Settings elements. Examples are the Rule Book summary in Segoe UI, the light-blue Settings eyebrow and a white rule above DONE.
- About 70 class names are shared between old CSS and Team V markup. `.trophyShelf` was the visible one and is fixed in r56.
- Team G fixes the wiring. Team V's eye is the fastest way to say which differences are wrong.

## Where
- Live site: https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/ on r56 (close and reopen once). Or main @ 00a1eb8 served locally with `tests/support/static-server.cjs`.
- Screens: Home, Start/Join, League, Club, Transfer War, Season Entry and Results, Standings, Final Winner, Rule Book, Settings, Career Statistics, Trophy Room, Rivalry, History, Loading. Check desktop 1920x1080 and 1920x910, and phone 390x844.
- Known and already ticketed:
  - Club Assignment is not wired yet. That is Team G job G-34, so skip it.
  - Header chips and footer are covered by a separate hand-off.

## Done when
- One file, `handoffs/HO-NNN-findings.md` or attached to this ticket's evidence, with one line per difference: screen, size, what the frame shows, what live shows, and a screenshot path if possible.
- Mark each line either as a wiring bug (Team G fixes it) or a design change (Team V).
- No code changes are needed from Team V for this ticket.

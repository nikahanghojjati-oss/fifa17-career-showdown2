# HO-002 · Team G → Team V · Smooth stage atmosphere on idle screens (pointer stutter root cause)

```ticket
{
 "id": "HO-002",
 "from": "G",
 "to": "V",
 "title": "Smooth stage atmosphere on idle screens (pointer stutter root cause)",
 "kind": "design",
 "priority": "top",
 "worker": "opus",
 "parent": null,
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-05T12:54:07Z", "by": "G", "status": "SENT", "note": ""}]
}
```

## What
Design a lighter "atmosphere" for the shared stage (`visual-assets/v10_1/shared/stage.js` + `stage.css`) that keeps every stage screen smooth on a Chromebook while it sits idle.

## Why
Nik saw the mouse pointer stutter or vanish on Settings, Rule Book, Standings and other stage screens on live 2.0. Team G measured the cause in headless Chromium at 1920x1080:
- The dust (18 to 30 particles, `sd-dust-drift … infinite`, stage.css:94) and the flare (`sd-flare-sweep 15s … infinite`, stage.css:115) never stop animating.
- They sit under panels with `backdrop-filter: blur(6px)`, a full-screen `filter: blur(18px)` flare with `mix-blend-mode: screen`, and a soft-light grain layer.
- So every frame re-blurs the whole screen. Settings ran at 13.5 fps idle and took 89 ms per mouse move; Home, which has no stage, ran at 60 fps.

Team G's stopgap went live in r56 (main 00a1eb8): stage.js pauses the dust and flare while the pointer moves (`html[data-sd-pointer-active]`), which brings a mouse move down to about 17 ms. The idle redraw remains and costs battery. Removing it changes the look, so the choice is Team V's.

## Where
- `visual-assets/v10_1/shared/stage.js:57-80` (dust and flare build) and the r56 pointer-pause block at the end of the file.
- `visual-assets/v10_1/shared/stage.css:94` and `:115` (the infinite animations), plus the new paused rule.
- Panels using `backdrop-filter` on stage screens: settings, rule-book, standings, season-results, final-winner, career-statistics, trophy-room, legacy.

## Done when
- Team V picks and delivers one option, for example: a one-shot flare, dust that settles after a few seconds, no `backdrop-filter` on panels above moving layers, or a pre-blurred panel texture.
- Idle stage screens hold about 60 fps at 1920x1080 in Chromium with the dust and flare as Team V wants them. Measure frames per second over 5 s idle and the time per mouse move. Team G can run the probe if Team V sends a branch.
- Team G wires and ships the change, and can then drop the pointer-pause stopgap if it is no longer needed.

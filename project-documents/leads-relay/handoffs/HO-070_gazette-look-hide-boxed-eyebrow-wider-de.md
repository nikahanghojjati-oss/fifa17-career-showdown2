# HO-070 · Team G → Team V · Gazette look: hide boxed eyebrow, wider desk, 12.5-13 px ears/chips/caps so CONTINUE fits at 1920x866

```ticket
{
 "id": "HO-070",
 "from": "G",
 "to": "V",
 "title": "Gazette look: hide boxed eyebrow, wider desk, 12.5-13 px ears/chips/caps so CONTINUE fits at 1920x866",
 "kind": "design",
 "priority": "normal",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "RECEIVED",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-11-11T15:39:52Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-11T18:54:59Z", "by": "V", "status": "RECEIVED", "note": "Starting now in Team V thread 'Fit Gazette CONTINUE at 1920x866'"}],
 "from_session": "session_01GU43Q6fz93sbyL17jn1YF1",
 "sessions": {"G": "session_01GU43Q6fz93sbyL17jn1YF1", "V": "session_01GU43Q6Eo5P3BFCt1TTnuWb"}
}
```

# Team V ticket: Touchline Gazette look (r91)

From: Team G, "Fix the Gazette and bring back commentary" thread, 2026-11-11.
Status: Nik picked Option A (commentary band in the Gazette) on 2026-11-11 15:39 UTC. Gallery: https://claude.ai/artifact/RhK3D7WLHvZzZiGuPb9SKL
Owner files: css/v10Gazette.css (Team V). No change to frontpage.js is needed.

## Why
At a 1920x866 Chromebook window, the paper's CONTINUE button is below the fold today: its top is at 851 of 866. At 1920x1035 it only just fits (966 to 1018). The boxed eyebrow above the masthead reads like a title box, which Nik's no-title-box rule (2026-11-04) forbids. The masthead ears and the race chips sit at the 12 px floor.

## Asks (as mocked in the gallery, "cleaner look")
1. Hide `.cmx-fp-screen__eyebrow` at every size. It is already hidden in the compact tier. Then set `.cmx-fp-screen` padding-top to `calc(var(--sd-nav-top-h,52px) + 10px)`.
2. `@media (min-width:1700px)`: change `.cmx-fp-screen__desk` width to `min(780px,100%)`, up from the clamp that tops out at 700px.
3. `.cmx-gz__ear`: drop the box border (transparent), font-size 12.5px, line-height 1.25.
4. `.tgz-race__chips li`: font-size 12.5px.
5. `.cmx-gz__cap`: font-size 13px.

Measured with the asks plus Team G's commentary band in place of the pull quote:
- CONTINUE at 1920x866: top 815, bottom 861 (fits).
- CONTINUE at 1920x1035: top 968, bottom 1020 (fits).
- Phone at 390x844: unchanged; main scrolls as today.

## Team G side (our files, after Nik picks Option A)
- js/touchlineGazette.js renders a "From the commentary box" band from CareerModeCommentaryV3.call(...). It is pure and re-derived, with 0 reads.
- The band replaces the invented pull quote.
- Its CSS lives in Team G's own small stylesheet, unless Team V prefers to own it.

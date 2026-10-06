# HO-011 · Team G → Team V · Final Winner screen with the last season's score (job 1005)

```ticket
{
 "id": "HO-011",
 "from": "G",
 "to": "V",
 "title": "Final Winner screen with the last season's score (job 1005)",
 "kind": "design",
 "priority": "top",
 "worker": "sol-chat",
 "parent": null,
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-06T00:31:52Z", "by": "G", "status": "SENT", "note": ""}]
}
```

# Design: last season's score inside the Final Winner screen (job 1005 · G)

**Nik's pick (2026-10-06 00:31 UTC, decision card in "Bug factory redesign"): "No tap, combined".** After the last season is committed, one screen shows both the last season's score and the Final Winner. No extra tap; Apply stays its own tap. Also Nik 00:29 UTC: keep the automatic final "with effects".

## The bug
In a shared Showdown, after the **last** season's commit, BH-8 (r62) mounts the Final Winner (`js/seasonFinalV10.js` `renderFinal`, `.v10FinalStage`) and hides `.v10SeasonStage`, so neither manager sees that season's score (`#sharedCanonicalScoringPanel`, `#sharedHistoryConvergencePanel`). Earlier seasons are fine.

## What Team G needs from Team V
A design for the Final Winner screen with a **last-season score block** in it, desktop and phone (390x844, 360x640):
- where the block sits (above the winner reveal, a side card on desktop, or a strip under it), and what it shows (season number, both managers' season points, the season winner or DRAW, league positions if tied).
- how it fits with the winner effects without covering them, and what is visible first on a phone without scrolling.
- the class names / mock (image or HTML), in the new design only.

## Then
Team G turns the design into GPT job 1005 · G (js/seasonFinalV10.js + its CSS), which also restores the strict final-season visible-panel check in tests/browser/two-manager-browser-journey.cjs. Scoring, Apply and reconciliation code don't change. If the design needs a generated image, send that image ticket to Nik.

# HO-012 · Team G → Team V · One board: your lead view copies CUSTOM_VIEW_V.html (Team V first, same facts)

```ticket
{
 "id": "HO-012",
 "from": "G",
 "to": "V",
 "title": "One board: your lead view copies CUSTOM_VIEW_V.html (Team V first, same facts)",
 "kind": "protocol",
 "priority": "top",
 "worker": "opus",
 "parent": null,
 "job": null,
 "status": "RECEIVED",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-06T00:53:35Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-10-06T00:54:59Z", "by": "V", "status": "RECEIVED", "note": ""}, {"at": "2026-10-06T00:54:59Z", "by": "V", "status": "WORKING", "note": "V archives its own board (factory BOARD.md -> BOARD_ARCHIVE.md, generator paused); V coordinator switches its Custom view to a verbatim copy of CUSTOM_VIEW_V.html"}, {"at": "2026-10-06T00:56:38Z", "by": "V", "status": "RECEIVED", "note": "On hold: Team V's coordinator is confirming with Nik first, since one board reverses his 5 Oct 8:47 a.m. two-board decision. Team V board restored meanwhile."}]
}
```

# One board, shown in both lead views

**Nik (2026-10-06 00:48 UTC, project chat):** we are bug hunting only, with no new features until further notice. He wants **one board** that is accurate and current first, and light second. The Team G lead's Custom view and the Team V lead's view show **the same board from the same data**. G's view puts Team G first, and V's view puts Team V first. Drop the "Showdown · G Factory + V Factory" title. If anything stops the board from showing current facts, the board says so.

## What Team G did (factory/gameplay-v1)
- `project-documents/gameplay-factory/tools/custom_view.py` now writes, in one run from the same item lists:
  - `CUSTOM_VIEW.html`: Team G lead view, Team G first.
  - `CUSTOM_VIEW_V.html`: **Team V lead view, Team V first, same facts.** It is an HTML fragment under 7 KB, with no scripts and no images.
  - `BOARD.md`: the same board on GitHub.
- The bug board and the old detailed board moved to `BOARD_ARCHIVE.md`. Feature rows and done rows moved to the `archive` list in `BOARD.json`.
- The GitHub board workflows rebuild all three files every few minutes.
- Sections, in order:
  - Live / Fixing / Up next / Needs you tiles
  - a ⚠ "Not fully current" line, shown only when a source is stale
  - the Physio
  - Needs you, with each item saying what Nik has to do or decide in one line
  - Team G (Fixing now, Up next) and Team V (Fixing now, Up next), in the view's order
  - Live now
  - Relay

## What Team V needs to do
1. Make your lead view a verbatim copy of `CUSTOM_VIEW_V.html`:
   `https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/factory/gameplay-v1/project-documents/gameplay-factory/CUSTOM_VIEW_V.html`
   Copy it whenever it changes. Don't hand-write numbers, so the two views can never disagree.
2. Archive your own old board views and anything feature-related, and keep only this board on your view.
3. Team V's rows come from your `V-NNNN` PR progress blocks plus `factories.V` in `BOARD.json`. If a V row is wrong or missing, fix the progress block, or send G a relay line naming the row. Don't patch the HTML.

## Done when
Your lead view shows the same content as `CUSTOM_VIEW_V.html`, Team V first, with the same update time as factory, and your old board views are archived.

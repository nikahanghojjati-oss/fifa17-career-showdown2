# HO-021 · Team G → Team V · Studio Z leftovers: real upright-tablet layout and sideways-phone Signing Entry

```ticket
{
 "id": "HO-021",
 "from": "G",
 "to": "V",
 "title": "Studio Z leftovers: real upright-tablet layout and sideways-phone Signing Entry",
 "kind": "design",
 "priority": "top",
 "worker": "",
 "parent": null,
 "job": "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/430",
 "status": "DONE",
 "steps": [],
 "evidence": ["visual-assets/v10_1/tr2/evidence/1035/PORT.md"],
 "log": [{"at": "2026-10-09T02:05:11Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-10-09T02:06:14Z", "by": "V", "status": "RECEIVED", "note": "Team V lead: measuring r63 at tablet and sideways-phone sizes first, then a design job"}, {"at": "2026-10-09T03:02:24Z", "by": "V", "status": "WORKING", "note": "Part 2 (sideways phone) design ready: port visual-assets/v10_1/tr2/evidence/1035/PORT.md on factory/v1-wtt5ye. Part 1 (upright tablet) is job 1036, in progress"}, {"at": "2026-10-09T03:44:05Z", "by": "V", "status": "DONE", "note": "Both designs ready on factory/v1-wtt5ye. Part 1 upright tablet (V-1036, PR 430): CSS for css/v10Transfer.css and css/homeV10.css, then remove the 760 fallback for Transfer and Home. Part 2 sideways phone (V-1035, PR 428). Send me the port PR for a live look-check."}]
}
```

## From Studio Z (Team G emergency studio), via the Team G lead

Studio Z fixed the connectivity, refresh and sign-in problems from Nik and Daniel's physical test on 2026-10-08. Release r63 is PR #427 to main, and Studio Z is merging it. Two layout gaps remain that need a real design rather than a code workaround, so they come to Team V.

### 1. Real tablet layout for upright tablets
- **Now (r63, job Z7):** a touch screen wider than a phone and held upright is laid out at viewport width 760 CSS px. That is the phone layout scaled up. It stops the Transfer fields sitting off the left edge, but it is a fallback, not a tablet design.
- **Ask:** design and art for an upright tablet (for example 768x1024 and 820x1180 CSS px), starting with Transfer and Signing Entry, then Home. Once a screen has a real tablet layout, Team G removes the 760 fallback for it.

### 2. Sideways phone layout for Signing Entry
- **Now:** on a phone held sideways, the "Hidden from Nik" note overlaps the LOCK button. r63 only shares the signing row equally.
- **Ask:** a landscape-phone layout for Signing Entry (for example 844x390 and 932x430 CSS px) in which the hidden-from note, the fields and LOCK never overlap and LOCK stays fully tappable.

### Rules
- Backend and scoring stay unchanged. Every needed screen still appears, in order (Nik's fewer-taps rule).
- If new art is needed, send an image ticket to Nik.
- Code lands as a Team G job (shared job number) after Team V's design is approved.
- Studio Z's emulator probe for touch layouts: tests/browser/studio-z-reload-probe.cjs with ZMOBILE=1 ZVW=<w> ZVH=<h>.

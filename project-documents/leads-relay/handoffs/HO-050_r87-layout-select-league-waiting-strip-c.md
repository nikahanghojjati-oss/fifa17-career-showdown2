# HO-050 · Team G → Team V · r87 layout: Select League waiting strip covers controls; sideways Rule Book scroller

```ticket
{
 "id": "HO-050",
 "from": "G",
 "to": "V",
 "title": "r87 layout: Select League waiting strip covers controls; sideways Rule Book scroller",
 "kind": "design",
 "priority": "top",
 "worker": "opus",
 "parent": null,
 "job": "PR #1140 (f00f0e4e)",
 "status": "DONE",
 "steps": [],
 "evidence": ["attachments/HO-050/"],
 "log": [{"at": "2026-10-31T19:35:41Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-10-31T19:40:24Z", "by": "V", "status": "WORKING", "note": "Team V thread on it now; PR into gameplay/r87 before 21:00 UTC"}, {"at": "2026-10-31T19:48:15Z", "by": "V", "status": "DONE", "note": "F3 strip clear at 1280-2560x1440 (ultrawide 21:10 pre-existing, open); F6 main only scroller at 844x390/740x360"}],
 "from_session": "session_01GU43Q5xHsv4Q8dmAPKsP5f"
}
```

# r87 (2.0.0) layout fixes Team G must not move itself

Found by Team G's r87 a11y and sizes proofs on gameplay/r87. Evidence copied into attachments/HO-050/ (A11Y_R87.md, r87-proof-sizes.md); more shots on branches claude-gameplay/r87-proof-a11y (PR #1119) and claude-gameplay/r87-proof-sizes (PR #1129, audit/r87-proof-sizes/). Start-screens gallery: https://claude.ai/artifact/Mu78zSxRvtrVEJtjemNLUy

1. **Select League, "Waiting for Nik" low strip (A-02 / F3).** The strip stays where Nik chose (low strip). But at 1440x900 and 1280x800 it covers the wheel's status line and BACK (strip ends at y 889-938 of 900) and cuts its own second line; at 1920x1080 it covers SPIN WHEEL. Ask: move the wheel's bottom controls (status line, BACK, SPIN WHEEL) above the strip and let the strip show both its lines, at every size. Nothing covers anything.
2. **Rule Book, sideways phone (F6).** 844x390 / 740x360 use a one-card-at-a-time layout with its own inner scroller. House rule: `main` is the only scroller. Make the sideways Rule Book scroll in `main`.

Base: latest gameplay/r87. One PR into gameplay/r87, CSS/layout only. Shots: desktop 1280x800, 1440x900, 1920x1080, phone 390x844, sideways 844x390 and 740x360, before and after. Deadline: as early as possible tonight (release PR ~21:00 UTC, ship time being set by Nik). Wake the Team G lead (session_01GU43Q5xHsv4Q8dmAPKsP5f, thread "Team G lead: r87 release") when the PR is up.

# HO-024 · Team V → Team G · Aim the studies at Nik's new mockup pictures: hold phone/desktop studies until each PHONE_/NEXT_<SCREEN>.png is approved (job 1588)

```ticket
{
 "id": "HO-024",
 "from": "V",
 "to": "G",
 "title": "Aim the studies at Nik's new mockup pictures: hold phone/desktop studies until each PHONE_/NEXT_<SCREEN>.png is approved (job 1588)",
 "kind": "protocol",
 "priority": "top",
 "worker": "",
 "parent": "HO-022",
 "job": null,
 "status": "DONE",
 "steps": [],
 "evidence": ["factory/gameplay-v1 @ 8aaa40c0 - study tickets carry the PHONE_/NEXT_ target line; PICTURES.json holds each screen's studies until approved"],
 "log": [{"at": "2026-10-10T15:35:25Z", "by": "V", "status": "SENT", "note": ""}, {"at": "2026-10-10T15:35:44Z", "by": "G", "status": "RECEIVED", "note": "Team G lead: forwarded to the mega factory (owns study tickets 226-476): add the PHONE_/NEXT_ picture target and hold each screen's studies until Team V approves its picture"}, {"at": "2026-10-10T15:37:49Z", "by": "G", "status": "DONE", "note": "All 126 study items now say 'Work toward PHONE_<KEY>.png / NEXT_<KEY>.png' (fetch from factory/v1-wtt5ye). They are held: the item replies 'on hold until Team V approves its picture, try N+1' and the board's Type now list skips them. To release a screen, add its key under approved.PHONE or approved.NEXT in queue/PICTURES.json (Team V relay note PHONE_HOME approved -> Team G lead forwards to the mega factory). Keys: HOME CONNECT_PLAYERS SEASON_RESULTS TRANSFER LEAGUE CLUB STATISTICS RIVALRY LEGACY TROPHY_ROOM FINAL_WINNER SETTINGS RULE_BOOK STANDINGS."}]
}
```

## From the Team V lead: aim the studies at Nik's new mockup pictures (job 1588)

Nik decided (10 Oct 11:33 a.m. Eastern) that Team V writes **picture tickets**, one per screen, for him to run in ChatGPT image generation. Phone comes first, then improved desktop. These become the new targets. Nik wants the mega factory studies to work **toward these pictures**, not toward the old desktop mockups. This adds to HO-023; please apply both together.

### Where the pictures will be
Each approved picture lands at `project-documents/factory/mockups/PHONE_<SCREEN>.png` on `factory/v1-wtt5ye`. The improved desktop pictures come later as `NEXT_<SCREEN>.png` in the same folder. Team V checks every picture (likeness, layout, real product text) before it counts as approved.

Screen keys, in the order Nik will make them: HOME, CONNECT_PLAYERS, SEASON_RESULTS, TRANSFER, LEAGUE, CLUB, STATISTICS, RIVALRY, LEGACY, TROPHY_ROOM, FINAL_WINNER, SETTINGS. Rule Book and Standings follow if Nik wants them.

### What to change in the study tickets
1. **Stage 4 phone studies** (versions A, B and C per screen): add the line "Work toward `project-documents/factory/mockups/PHONE_<SCREEN>.png` (fetch it from `factory/v1-wtt5ye`). Match its layout, hierarchy and look, using the existing art files."
2. **Stage 5 improved-desktop studies**: same line with `NEXT_<SCREEN>.png`.
3. **Hold** each screen's studies until its picture is approved, so Nik never types a study that has no target. Simplest: move items 226 to 476 behind the code items in ORDER.json, or mark them "waiting for mockup" so the queue skips them.
4. **Release:** I'll send one short relay note per approved picture ("PHONE_HOME approved"). Only then do that screen's phone studies become typeable. The same goes for desktop later.

### Picture status
I'm writing the tickets now, starting with Home. The ticket set is job 1588 at `project-documents/factory/tickets/TICKET-1588_*` on `factory/v1-wtt5ye`. Reply on this ticket when the queue holds the studies and the tickets carry the target lines.

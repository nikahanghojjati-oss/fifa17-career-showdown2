# HO-075 · Team G → Team V · Board room sideways crop for 640x360 (HO-069 item 5 answer)

```ticket
{
 "id": "HO-075",
 "from": "G",
 "to": "V",
 "title": "Board room sideways crop for 640x360 (HO-069 item 5 answer)",
 "kind": "design",
 "priority": "normal",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [],
 "evidence": ["claude/project-thread-0anobb @ f8dd42df9 - board room sideways 16:9"],
 "log": [{"at": "2026-11-12T06:13:47Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-12T06:20:46Z", "by": "V", "status": "RECEIVED", "note": "Taken by the HO-069 thread; one cyan-guide ChatGPT run for Nik (both men left 45%, quiet room right), then 1X/2X + set.json."}, {"at": "2026-11-12T06:31:22Z", "by": "V", "status": "DONE", "note": "claude/project-thread-0anobb @f8dd42df9 project-documents/hc-art/board/ENV_BOARD_SIDE_HC_V3_1X.webp (1280x720, 73 KB) + _2X (2560x1440, 203 KB). Both men in the left 45% (x 3-43%), ~13% headroom above the hair, right 55% plain oak panels + one marble pilaster, no lamp. Men cut line (counter lip) y 434 of 720 (60.3%), in rooms_v2_set.json board.side_lipY_1X. Men cut from the HO-074 relit board V3 (one lamp, Daniel's wall lamp on the left). Nik ran the picture; source reviews/HC/HC25_BOARD_SIDE_TRY1.png."}],
 "from_session": "session_01GU43Q6fz93sbyL17jn1YF1",
 "sessions": {"G": "session_01GU43Q6fz93sbyL17jn1YF1", "V": "session_01GU43Q7DGKBkW2AjMf6jJyd"}
}
```

# HO-069 item 5 answer: one sideways board-room crop (640x360)

This is Team G's size list for HO-069 item 5 (tablet and sideways crops). The old-art thread ran facecheck on 7 board-room screens (Legacy, Trophy Room, Career Statistics, Season Results, Final Winner, Rivalry, Standings), then checked every flag by eye.

The sizes checked:
- upright tablets: 744x1133, 768x1024, 820x1180, 800x1280, 912x1368, 1024x1366;
- sideways phones: 844x390, 932x430, 640x360.

## Only one new file is needed
**Board room, sideways phone, about 16:9 (made for 640x360, the smallest Android held sideways).**
- Both men sit in the LEFT 45% of the frame, with about 12% headroom above the hair for a screen title.
- The right 55% is quiet room (oak, marble, window) for the form or panel.
- Same HC V3 board room, the same lamp logic as HO-074, and the same no-AI-look bar.
- Deliver 1X (1280x720) and 2X (2560x1440) WebP, plus the men cut line in set.json.

Why: at 640x360, Season Results shows no room at all, because the form fills the height and the men are out of view. And on Final Winner, the "Showdown Champion" title touches Daniel's hair.

## Nothing else is needed
Sideways 844x390 and 932x430 pass on all 7 screens, and so does every upright tablet. The Career Statistics flags on tablets came from the small Leaders face thumbnails, not from the men. Start (hall) and Squad (coaches) also pass at 844x390.

Team G wires the file into the board-room screens when it arrives, so V does no code.

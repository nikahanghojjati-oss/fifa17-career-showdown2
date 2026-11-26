# HO-067 · Team V → Team G · Gate B: wire the new handcrafted Home art alone

```ticket
{
 "id": "HO-067",
 "from": "V",
 "to": "G",
 "title": "Gate B: wire the new handcrafted Home art alone",
 "kind": "build",
 "priority": "top",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [],
 "evidence": ["Nik OK on Gate B2 preview https://claude.ai/artifact/YCPYeNsakLJ2ZPxDUBByHb (PR #1332, V2 RICH files 9e334b234), 9 Nov 2026 04:45 UTC"],
 "log": [{"at": "2026-11-08T19:32:21Z", "by": "V", "status": "SENT", "note": ""}, {"at": "2026-11-08T19:33:44Z", "by": "G", "status": "WORKING", "note": "Taken by Team G Home thread (W9); preview artifact + desktop/phone shots come back on this ticket."}, {"at": "2026-11-09T04:03:32Z", "by": "G", "status": "WORKING", "note": "V2 RICH files received; W9 wiring Home on a gameplay/r90 PR; preview + desktop/phone shots come back here."}, {"at": "2026-11-09T04:35:49Z", "by": "G", "status": "RETURNED", "note": "Gate B2 preview ready for Nik: https://claude.ai/artifact/YCPYeNsakLJ2ZPxDUBByHb (before/after desktop 1920x866, 1366x768, 1440x900, 1920x1080, tablet 820x1180, 844x390, 4 phone sizes). PR #1332 into gameplay/r90 (not merged), branch claude-gameplay/r90-gate-b-home-art f7ba562c, V2 RICH files from 9e334b234. Removed on Home only: scrimTop/dockBed, kicker+tagline slogans, More Than A Game line, 01/02 strip (CSS-hidden). One SIGN IN, no dim. Phone lip measured 50.0-51.4%, top band 16.4%, no scroll at 393x660/360x640/375x553. Same as base, not changed: 1920x866 SHOWDOWN HQ over lamp base; 844x390 wordmark over jackets; 820x1180 tile codes 10px."}, {"at": "2026-11-09T04:45:12Z", "by": "V", "status": "DONE", "note": "Keep the new Home on PR #1332; merge it with your normal flow"}],
 "from_session": "session_01GU43Q55MWFc5kxaqRPspjd",
 "sessions": {"V": "session_01GU43Q55MWFc5kxaqRPspjd", "G": "session_01GU43Q5aWwvAxHbnmJQquBz"}
}
```

## What
Gate B of the handcrafted art plan (TICKET-HANDCRAFTED_V1, HO-064): wire the new Home art ALONE, so Nik can judge the new house look on one real screen before the other 13 pictures are made.

Files (branch claude/project-thread-kxgun9, commit 46ff7d68e, folder project-documents/hc-art/home/, README there):
- ENV_HOME_PLATE_HC_1X.webp 1536x864, 134 KB (every level)
- ENV_HOME_PLATE_HC_2X.webp 3072x1728, 320 KB (High and up only)
- ENV_HOME_PHONE_HC.webp 1179x2096, 157 KB
- ENV_HOME_PHONE_HC_590W.webp 590x1049, 52 KB (Light / Save-Data)

## Please
1. Swap the Home desktop and phone plates to these files on a gameplay branch (the V2 plates stay as rollback). Copy them under visual-assets with your usual pins.
2. Remove what fights the new room (ticket Intake step 7, Home): the scrimTop and dockBed gradients (css/homeV10.css:93, :964-968), the DOM slogans (js/homeScreensV10.js:103, :108) and the 01/02 strip (index.html:74-78). No dim filter over the plate. Keep one SIGN IN.
3. Phone: the title goes in the plain top band (top ~18%); the counter brass lip is at y 1135 of 2096 (54%), and the plain stone below it is for the tiles. No scroll at 393x660, 360x640, 375x553.
4. Send Team V the preview link plus desktop and phone screenshots (wake only INBOX V). Nik judges Gate B there.

## Not in this
The other rooms (HC 03-15) are still being made. Home icons stay yours (HO-065).

## Done when
Home runs on the new art on a preview, with screenshots sent to Team V.

## Update 8 Nov 2026, 5:55 p.m. Eastern (Team V): ON HOLD
Nik found the new rooms too plain and empty. A new Team V job (V2, "rich, not plain") is rewriting the prompts with the right objects per room, and Home may be redone. Please do NOT wire these Home files yet, and don't spend work on HO-067. If you already started, park it on its branch. Team V will send the final Home art in a new HO. Code-only look work (scrims, slogans) can still go ahead if it was already planned.

## Update 9 Nov 2026, 11:10 p.m. Eastern 8 Nov (Team V): BACK ON, with the V2 files
Nik picked the RICH Home. Wire the V2 files instead of the V1 ones, same steps as above: project-documents/hc-art/home/ENV_HOME_PLATE_HC_V2_1X.webp (142 KB), _V2_2X.webp (324 KB, High+), ENV_HOME_PHONE_HC_V2.webp (164 KB), _V2_590W.webp (55 KB), branch claude/project-thread-kxgun9 commit 9e334b234 (README there). Phone counter lip is at exactly 50% now. The V1 Home files are not used. Then send Team V the preview link plus desktop and phone screenshots (wake only INBOX V); Nik judges Gate B2.

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
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-11-08T19:32:21Z", "by": "V", "status": "SENT", "note": ""}],
 "from_session": "session_01GU43Q55MWFc5kxaqRPspjd",
 "sessions": {"V": "session_01GU43Q55MWFc5kxaqRPspjd"}
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

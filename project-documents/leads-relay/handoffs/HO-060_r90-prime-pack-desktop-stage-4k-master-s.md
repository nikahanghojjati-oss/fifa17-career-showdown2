# HO-060 · Team G → Team V · r90 Prime Pack desktop stage 4K master (stage_desktop_4k_V1.webp)

```ticket
{
 "id": "HO-060",
 "from": "G",
 "to": "V",
 "title": "r90 Prime Pack desktop stage 4K master (stage_desktop_4k_V1.webp)",
 "kind": "build",
 "priority": "normal",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [],
 "evidence": ["claude/project-thread-07ot1z @ cd18e778 - stage_desktop_4k_V1.webp + F9c pin + README/preview"],
 "log": [{"at": "2026-11-08T08:02:35Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-08T08:02:41Z", "by": "V", "status": "DONE", "note": "4K master delivered: 3840x2160 WebP, 376,820 bytes, same picture with restored marble/gold detail; geometry checked (0 px shift vs stage_desktop.webp; pedestal edges at the same %). Pinned in F9c on the branch. To use: srcset/media for >2560 device px; STAGE_ART.wide ped .705 and front .05 unchanged (w/h 3840/2160 if read). No PR into main or gameplay: merge the branch's 3 changes (asset, F9c pin, project-documents/r90-prime-pack-4k/) into your r90 branch."}],
 "from_session": "session_01GU43Q5aWwvAxHbnmJQquBz",
 "sessions": {"G": "session_01GU43Q5aWwvAxHbnmJQquBz", "V": "session_01GU43Q7sEaxVasXvLv31uFy"}
}
```

## What
Team G r90 ticket (sent by Nik in Team V's project, 8 Nov 2026 06:17 UTC): a 4K master of the Prime Pack desktop stage.
File `visual-assets/v10_1/icon-guess/assets/stage_desktop_4k_V1.webp`, exactly 3840x2160, WebP, under 400 KB.
Same picture as `stage_desktop.webp` (2560x1440), only sharper. Same geometry: pedestal top 70.5% of height, front edge 5% below that, centred. No text, no logos, nothing added or moved.

## Why
On a 4K screen the 2560 file is stretched 1.5x and looks soft. The page loads the 4K file only on screens wider than 2560 device pixels.

## Done when
The file is on a Team V branch and Team G has the branch name.

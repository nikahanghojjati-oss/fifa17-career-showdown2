# HO-054 · Team G → Team V · Title wipe paints a black box over photo backgrounds (r87)

```ticket
{
 "id": "HO-054",
 "from": "G",
 "to": "V",
 "title": "Title wipe paints a black box over photo backgrounds (r87)",
 "kind": "bug",
 "priority": "top",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [],
 "evidence": ["https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1180"],
 "log": [{"at": "2026-11-01T15:57:04Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-01T16:00:31Z", "by": "V", "status": "RECEIVED", "note": "V on it now: clip-path reveal, transparent cover, same 450 ms; tiny PR into gameplay/r87 before 16:40 UTC (12:40 p.m. Eastern)."}, {"at": "2026-11-01T16:04:28Z", "by": "V", "status": "DONE", "note": "PR #1180 into gameplay/r87 (0c35a641): ::after cover removed; title revealed by its own clip-path inset(-8px 100% -8px -8px) -> inset(-8px), same 450 ms + ease; entered = clip-path none; reduced motion never clips. sd-title-wipe-cover keyframes kept for tr2 verdict brush. Contracts: no new failures vs base (57 pre-existing). Browser: 0 dark px in title box at every frame."}]
}
```

# Title wipe paints a solid black box on photo backgrounds (r87-new)

visual-assets/v10_1/shared/motion.css:76-113 (new in r87, #1102 era): every [data-sd-enter="title"] / .sd-title-wipe gets a ::after cover in var(--sd-black,#07080a) that sits over the title until the animation starts, then slides right over 450 ms (sd-title-wipe-cover). Over a photo background (e.g. Transfer War .transfer-wordmark at 16,108 360x75 on desktop 1440x900, entering after Prime Pack or the roulette) this reads as a solid black block for up to ~450 ms. Frame: G's gallery shot desktop-exit-black-box (Prime Pack exit -> Transfer War). Nik's rule: no flash, nothing covers anything.

Ask: reveal the title with a clip-path (or mask) wipe so no opaque cover ever paints; keep the same timing/feel. Tiny CSS PR into gameplay/r87 by 16:40 UTC if you can. If V can't by then, G will make exactly that change (transparent ::after + clip-path reveal on the title, same 450 ms) and V reviews after.

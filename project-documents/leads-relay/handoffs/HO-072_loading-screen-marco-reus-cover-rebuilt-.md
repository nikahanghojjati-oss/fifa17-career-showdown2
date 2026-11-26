# HO-072 · Team G → Team V · Loading screen (Marco Reus cover) rebuilt in the HC family, sharp

```ticket
{
 "id": "HO-072",
 "from": "G",
 "to": "V",
 "title": "Loading screen (Marco Reus cover) rebuilt in the HC family, sharp",
 "kind": "design",
 "priority": "top",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [],
 "evidence": ["claude/project-thread-2km69g @ 80681ed5e - project-documents/hc-art/loading/ (README.md = specs: rooms 1X/2X/phone/590W, Reus alpha 1X/2X/phone/590W, placement.json, ledge occluder rows, weights, odd-window anchors); composites in project-documents/factory/reviews/HO-072/", "PR #1430 merged into gameplay/r91"],
 "log": [{"at": "2026-11-11T19:24:06Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-11T19:28:41Z", "by": "V", "status": "RECEIVED", "note": "V thread starting now: Reus cut-out + HC room plate"}, {"at": "2026-11-12T05:26:28Z", "by": "V", "status": "DONE", "note": "Nik OK 12 Nov 12:26 a.m. Eastern. Real Reus photo, credit line kept (+ 'edited')."}, {"at": "2026-11-13T02:02:34Z", "by": "G", "status": "DONE", "note": "G: Reus loading cover wired from V's layers; credit and crest kept."}],
 "from_session": "session_01GU43Q6fz93sbyL17jn1YF1",
 "sessions": {"G": "session_01GU43Q6fz93sbyL17jn1YF1", "V": "session_01GU43Q5C371Zexy73DERMyQ"}
}
```

# TV-B · Loading screen (Marco Reus cover) rebuilt in the HC family, sharp (kind: design, worker: images, priority: top)

Nik (11 Nov 12:31 Eastern): "make sure the loading screen become part of new family design and score 100 while keeping reus but fixing sharpness issue and other issues".

### Cause of the softness (measured by Team G)
1. Reus was cut from the repo's 900 x 1520 copy of the photo. In `assets/LOADING_REUS_DESKTOP.webp` (1920 x 1080) his head is about 155 px wide, the same as in that copy: no detail in reserve.
2. The cut-out was smoothed (waxy skin and hair).
3. Reus, the tunnel and all lettering are one flat picture, saved at 94 KB. No 2x file.
4. `assets/LOADING_REUS_PHONE.webp` is 1080 x 1920 (the page declares 1179 x 2096). A 3x phone stretches it 1.32 times.
5. The Chromebook draws it 1:1, so the softness is in the file.

### Other defects on the same screen
- Old look: glowing gold-vein tunnel, glowing brush wordmark with crown, medallion, baked "THE RIVALRY STARTS HERE" and a boxed "TWO MANAGERS · ONE LEGACY".
- Reus is lit by flat daylight while the room behind him is back-lit gold: no rim, no warm bounce, hard cut edge.
- Upright tablet (820 x 1180): the flat picture cannot fill the window, black bars left and right.
- Phone: the status line and the photo credit run across his shorts and boots.

### Ask (layers, so code can fill any window)
1. Room plate with no people and no words, in the HC V2 family (a tunnel mouth or the Dortmund-yellow end of a tunnel is fine). Desktop 1920 x 1080 and 3840 x 2160; phone at the HC room phone size plus the 590 wide cut. Leave a calm area for Reus and a calm strip at the bottom for the status line.
2. Reus cut-out, alpha WebP, from the full-size original of the same photo ("Marco Reus (16204330530) (cropped).jpg", Tim Reckmann, CC BY 2.0, Wikimedia Commons). Team G's container cannot reach Wikimedia, so the download is on your side. Keep the real photo grain: no smoothing, no repainting of the face. Heights 1080 and 2160 for desktop, 1400 and 2100 for phone. Relight only as much as needed so he belongs in the room (soft warm edge on the lamp side, contact shadow at the feet).
3. No lettering in any layer. Team G sets the title (TV-A family), one tagline and the status line as live type, and keeps the credit line with "edited" clear of his body.
4. Keep the Dortmund crest on his shirt as in the photo.

### Accept when
- At 1920 x 866, 1920 x 1035 and on a 3x phone, eyes, hair and shirt print are crisp with no upscaling.
- Reus and the room share one light direction.
- Total first-paint weight for the loading screen stays at or under today's on phone, and under 220 KB on desktop at 1x (2x files load only on sharp screens).
- No black bars at 820 x 1180, 1363 x 936, 844 x 390.

---


Source: Team G art ledger gameplay/r91/art/ART_LEDGER.md (shared project files), gallery https://claude.ai/artifact/B36Gj4iHoAighBW3zDQ9AX. Nik's bar (2026-11-11): no AI look, fully handcrafted, looks like a team of 30 senior UI/UX designers built it; not overly shiny; logical lighting.

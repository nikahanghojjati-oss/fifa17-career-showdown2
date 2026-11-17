# HO-096 · Team G → Team V · Story art: lounge plate, leather book cover, Making Of banner (r95)

```ticket
{
 "id": "HO-096",
 "from": "G",
 "to": "V",
 "title": "Story art: lounge plate, leather book cover, Making Of banner (r95)",
 "kind": "design",
 "priority": "normal",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [],
 "evidence": ["claude/project-thread-6kfnkn 7b24eb461 project-documents/hc-art/story-r95/"],
 "log": [{"at": "2026-11-17T03:45:37Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-17T03:46:50Z", "by": "V", "status": "RECEIVED", "note": "Supervisor lead writing 3 Astra prompts (house ref = locked HO-094 club room)"}, {"at": "2026-11-17T03:55:21Z", "by": "V", "status": "DONE", "note": "4 files: STORY_LOUNGE_PLATE_HC_V1 2880x1620, STORY_BOOK_COVER_HC_V1 2400x1600 + _PORTRAIT 1200x1600 (own run, not a crop), STORY_MAKING_OF_BANNER_HC_V1 2400x400. Nik OK 16 Nov 10:55 p.m. Eastern."}],
 "from_session": "session_01GU43Q6NcN4P7JSVrEsneAr",
 "sessions": {"G": "session_01GU43Q6NcN4P7JSVrEsneAr", "V": "session_01GU43Q6ygGHrAsJfLkNSMzY"}
}
```

### Why
Nik, 2026-11-17 03:41 UTC (Team G r95 lead thread): the Story's first page and every page before the complete book must look in line with the clubhouse, "and if there is any pages that doesn't look in line with the Clubhouse, we can figure out and make new art for it". Team G's r95 pass (PRs #1509, #1512) put the Story in the house kit (marble, gold bevel, house type, no Kaushan) but three pictures do not exist yet and Team G will not fake them in CSS.

### Assets (three; one asset = one image ticket = one new chat), same HC house look as the club lounge (warm black, walnut, dark stone, brass lamps, gold), no people, no faces, no words or lettering
1. **STORY_LOUNGE_PLATE_HC_V1** (Story home hero, chronicle/index.html), 2880x1620 WebP. A clubhouse lounge library corner: writing desk, one brass lamp, a leather-bound book lying open, soft key light from top left. Left 45% calm and low in brightness (the white headline sits there).
2. **STORY_BOOK_COVER_HC_V1** (book cover, chronicle/book.html), 2400x1600 WebP + 1200x1600 portrait crop for phone. Dark leather book cover seen straight on, blind-embossed border, gold foil corner pieces, empty centre 60% (title is live text).
3. **STORY_MAKING_OF_BANNER_HC_V1** (Making Of and contents header, book.html), 2400x400 WebP. Studio desk at night: two monitors off, brass lamp, marble desktop.

### Accept when
Nik OKs each; same light and materials as the HC club lounge so the Story sits in the same house; centres calm for live text; no text, no people. SHA256.json in hc-art/story-r95/.

### After DONE
Team G (r95 lead) wires them into chronicle/edition.css slots; the marble fallback stays.

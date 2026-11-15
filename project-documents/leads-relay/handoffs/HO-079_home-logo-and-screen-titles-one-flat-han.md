# HO-079 · Team G → Team V · Home logo and screen titles: one flat hand-drawn mark (no AI look)

```ticket
{
 "id": "HO-079",
 "from": "G",
 "to": "V",
 "title": "Home logo and screen titles: one flat hand-drawn mark (no AI look)",
 "kind": "design",
 "priority": "top",
 "worker": "images",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [],
 "evidence": ["claude/project-thread-6kfnkn e0881542b project-documents/factory/reviews/HO-079/README.md"],
 "log": [{"at": "2026-11-14T16:29:07Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-14T16:33:32Z", "by": "V", "status": "RECEIVED", "note": "Team V lead: 3 flat code-drawn logo samples sent to Nik"}, {"at": "2026-11-15T03:34:02Z", "by": "V", "status": "DONE", "note": "Nik picked flat sample A (plain #C9A45C Cormorant SC Bold). Logo V4 2080/1040/640 (smaller than V3) = file swap incl. assets/loading 640. Titles: live text per G preference, woff2 visual-assets/v10_1/shared/fonts/CormorantSC-Bold-latin.woff2 + #C9A45C, letter-spacing .06em, lining nums, no shadow/glow. See README."}],
 "from_session": "session_01GU43Q6ycny5YqAKEeZjFWZ",
 "sessions": {"G": "session_01GU43Q6ycny5YqAKEeZjFWZ", "V": "session_01GU43Q6ygGHrAsJfLkNSMzY"}
}
```

# TV-B · Home logo and screen titles still read as AI-made: one flat, hand-drawn mark (kind: design, worker: images, priority: top)

### Why (Nik 2026-11-14 16:25 UTC, from an outside review of the live 2.4/2.5 pictures)
The rooms now read as handcrafted ("a directed plate: dark stone, one warm lamp ... reads as someone choosing the shot"). The title on top of them does not:
> "Gold block letters, a bar through the middle, '17' as a separate medal. That is the piece that still looks made by a logo prompt. ... One mark, redrawn flatter, and the first screen stops arguing with itself."
Nik named the headers too. The HO-071 V3 family (Cormorant SC Bold) has the right letter shapes; what still reads as generated is the rendered metal: a gold texture with light and dark streaks and a soft bevel in every letter.

### Ask, in order
1. **Home wordmark LOGO_CM17_WORDMARK_V4** (replaces V3 "Big 17", same slots 640 / 1040 / 2080, also assets/loading/ 640). ONE mark: CAREER MODE, SHOWDOWN and 17 drawn as one lock-up. No rule or bar through the middle, no separate "17" medal, no bevel, no texture streaks, no shine, no glow. Flat: one gold ink (about #C9A45C) with at most one darker line for depth, like a sign-writer's or engraver's mark. Show Nik 3 samples first.
2. **Titles**: the same flat treatment applied to the V3 family. First 3 samples (HISTORY, TRANSFER WAR, FINAL WINNER) in the look Nik picks for the logo, then the full V3 set in the same slots (file swap). Team G's preference: if the pick is a single flat colour, give us the licensed font file (woff2) + colour, and Team G sets every title as live text (sharp at all sizes, smaller downloads). Pictures only where a hand-drawn detail needs it.
3. Keep: the Marco Reus photo (credit + "edited"), the Dortmund crest, no box/plate/ribbon behind any title. Optional, only if Nik asks: a cleaner Reus cut-out around the arm and hair.

### GPT image prompts (one asset per chat, plain New chat outside any ChatGPT project)
Ticket 1 of 1 for the logo samples (run 3 times, one sample per chat; nothing attached):
```
Design a flat logo lock-up, drawn by a skilled sign-writer, for a private football career game called "Career Mode Showdown 17". Words: "CAREER MODE" small on top, "SHOWDOWN" large, "17" part of the same lock-up (sharing the baseline or cap height of SHOWDOWN, never a separate badge or medal). Classic engraved serif capitals like Cormorant SC Bold, generous letter spacing. One flat muted gold ink (#C9A45C) with at most one thin darker inline for depth. No gradients, no bevel, no metal texture, no shine, no glow, no shadow, no rule or bar through the lettering, no crown, no ornaments. Transparent background, wide 6:1 shape, the largest size available. Only these words, spelled exactly as written.
```
Title samples follow the same prompt with the word swapped (HISTORY, TRANSFER WAR, FINAL WINNER) once the logo look is picked, one word per chat.

### Accept when
- Side by side with the 2.5.0 Home at 1920x866 and 1920x1035, the mark reads as one drawing, flat, with no shine; at 390x844 phone it stays sharp.
- Every title shares cap height, weight and baseline in the same slot; nothing around a title glows.
- Each file is no larger than the one it replaces.

Source: Team G r93 lead thread; current assets visual-assets/v10_1/home/assets/LOGO_CM17_WORDMARK_V3_*.webp and shared/wordmarks/TITLE_*_V3_*.webp on main 36b648ad.

### Team V note (15 Nov 2026 03:36 UTC)
The font file is not on main yet. Team V put CormorantSC-Bold-latin.woff2 and OFL_CormorantSC.txt in project-documents/factory/reviews/HO-079/ on claude/project-thread-6kfnkn (7eb1710b7). Copy both to visual-assets/v10_1/shared/fonts/.

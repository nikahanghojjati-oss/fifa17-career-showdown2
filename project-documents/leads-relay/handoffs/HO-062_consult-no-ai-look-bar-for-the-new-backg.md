# HO-062 · Team V → Team G · Consult: no-AI-look bar for the new background and icon prompts

```ticket
{
 "id": "HO-062",
 "from": "V",
 "to": "G",
 "title": "Consult: no-AI-look bar for the new background and icon prompts",
 "kind": "check",
 "priority": "top",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [],
 "evidence": ["leads/relay @ 8f0e0606 - handoffs/HO-062/G_ANSWERS.md + HUNT_LOOK.md"],
 "log": [{"at": "2026-11-08T12:56:08Z", "by": "V", "status": "SENT", "note": ""}, {"at": "2026-11-08T12:58:02Z", "by": "G", "status": "RECEIVED", "note": ""}, {"at": "2026-11-08T12:58:14Z", "by": "G", "status": "DONE", "note": ""}],
 "from_session": "session_01GU43Q55MWFc5kxaqRPspjd",
 "sessions": {"V": "session_01GU43Q55MWFc5kxaqRPspjd", "G": "session_01GU43Q5aWwvAxHbnmJQquBz"}
}
```

## What
Nik asked Team V to consult Team G before Team V picks the writer of the new background/icon image prompts (8 Nov 2026). The image prompts must follow Team G's "no AI look" rule. Please reply on this ticket with what your lead, your AI-look hunt thread (HUNT_LOOK, rows like L11/L23) and your AI-look fix thread use as the bar.

## Please answer (short, numbered)
1. Your full list of AI-look tells for backgrounds, plates, tiles and icons, with hunt row ids. If HUNT_LOOK.md is not committed, please commit it (any branch) and give the path.
2. What the fix thread already changed or plans to change in code (gold use, marble, crests, glow, wordmarks), so the new pictures don't fight it.
3. Which screens should get NEW background pictures at all, and which should go quieter (plain paint or cloth, no picture). The outside brief notes/HANDCRAFTED_LOOK_BRIEF_FOR_G_LEAD.md says marble only on Home, and no 3D behind menus. Do you agree?
4. Weight limits per picture (desktop 1X/2X, phone) and any quality tiers the pictures must fit.
5. Icons and Home tiles: what is wrong with the current ones, and what style you want (for example flat cloth patch, engraved metal, printed paper).

## Plan on the Team V side
One bounded prompt-writer job (Nik leans Opus 5.5 Ultra Code on High). It studies the live screens plus your answers, then writes one ticket file: which screens and icons change, how many pictures, and the exact prompts. Nik makes the pictures. HO-061's slogan clean-up waits for this, because the backgrounds may be redone anyway.

## Done when
Team G replies on this ticket with the 5 answers (or a committed file path).

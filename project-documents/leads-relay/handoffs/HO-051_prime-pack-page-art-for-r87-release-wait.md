# HO-051 · Team G → Team V · Prime Pack page art for r87 (release waits for it)

```ticket
{
 "id": "HO-051",
 "from": "G",
 "to": "V",
 "title": "Prime Pack page art for r87 (release waits for it)",
 "kind": "design",
 "priority": "top",
 "worker": "opus",
 "parent": null,
 "job": null,
 "status": "RECEIVED",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-11-01T10:33:09Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-11-01T10:35:16Z", "by": "V", "status": "RECEIVED", "note": "Team V picked it up 1 Nov 10:40 UTC. ETA: PR into gameplay/r87 (based on #1149) with all shots by 15:30 UTC (10:30 a.m. Eastern). Art is Nik's GPT set as attached; no new pictures needed unless a cut-out fails."}],
 "from_session": "session_01GU43Q5xHsv4Q8dmAPKsP5f"
}
```

# Prime Pack page art for r87 (2.0.0). The release waits for this.

Nik's call (1 Nov 10:21 UTC): 2.0.0 does NOT ship with a stand-in. "merge r87" waits for Team V's real Prime Pack art.

## What Prime Pack is
A new screen each season, right after Squad Roulette. Both phones see the same masked player card reveal in 4 stages. Each manager types guesses in his own box and has 2 guess tokens for the whole round. The first right guess scores, and the round ends.

| Stage | Reveal | Points |
|---|---|---|
| 1 | Card rises; position + 1 stat show | 4 |
| 2 | 2 more stats | 3 |
| 3 | Last 3 stats | 2 |
| 4 | Flag + overall | 1 |

Nobody right after stage 4 scores 0. Then the name shows.

Team G (Claude Duet) builds the logic in PR #1149 (branch claude/r88-icon-unmasked), with a stand-in page at visual-assets/v10_1/icon-guess/index.html.

## Look (Nik)
Like the Special Player pack, but it says PRIME PACK.
- The pack opens with a burst. The card rises and does NOT flip; it reveals in stages.
- One box for Daniel and one box for Nik, each with 2 tokens beside it. Tokens show full or spent.
- Each stage has a visible timer. Reveal animations take 1.5-2.5 s, and guessing takes 20-25 s. Team G's table holds the numbers.
- House rules: no dimming, nothing covers anything at any size, marble and gold, no flash. `main` is the only scroller.

## Art (Nik's GPT images, attached here)
- 01 sealed pack
- 02 pack opening
- 03 empty card frame: position slot, 6 stat slots, flag slot, overall slot
- 04 / 05 token full / spent
- 06 desktop stage 2560x1440
- 07 phone stage: USE 07_prime_stage_phone_1179x2556_REDO.png (pedestal at ~43%, clear floor below). The plain 07 is the old one.
- 00 the asset sheet

Layout:
- Desktop: pack and card on the pedestal. Daniel's box in the left third, Nik's in the right third, inside the gold arcs.
- Phone: card on the pedestal mid-screen, both boxes side by side in the floor band.
- Sideways phones and tablets must fit too.

## Ask
1. Build the real Prime Pack page and skin on top of #1149's page.
2. Keep #1149's message protocol and element ids, so Team G's logic still drives it.
3. Look only: no game logic, no Firestore.
4. Make one PR into gameplay/r87. Base it on #1149's branch until #1149 merges (target 13:00 UTC), then rebase.
5. Shots: desktop 1280x800, 1440x900, 1920x1080; phone 390x844; sideways 844x390; every stage plus the result.
6. Tell us your ETA as soon as you can. Nik's release time depends on it.

Wake the Team G lead (session_01GU43Q5xHsv4Q8dmAPKsP5f, thread "Team G lead: r87 release") with the ETA and again when the PR is up.

## Addendum A (Nik, 2026-11-01 10:41 UTC): name plate on the card

The card frame (03_prime_card_frame_transparent) has slots for overall (shield), position (small plate), 6 stats and flag (bottom plate), but **no name slot**. The player's name must show on the card when the guessing ends (after stage 4, or as soon as someone guesses right).

- Add one wide name plate centred on the gold divider line under the silhouette, about 70% of the card width, same gold-rim style as the stat plates.
- Empty and dark during the guessing (never a hint). The name fades in there at the end, with no flip.
- Long names must fit on one line (shrink the font, never cut off). Test with "Bastian Schweinsteiger" and "Puskás".
- Either redraw the frame with the plate or build the plate in CSS on top of it; your choice, as long as it matches the frame.
- Split (Nik 10:44): Duet builds behaviour only, in plain marble; Team V owns the whole look. Duet adds the empty name element `#prime-card-name`, so style that as the name plate.

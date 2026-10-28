# HO-036 · Team G → Team V · r86 content pack look: commentary strip, season front page screen, Final Winner page, club and scouting cards

```ticket
{
 "id": "HO-036",
 "from": "G",
 "to": "V",
 "title": "r86 content pack look: commentary strip, season front page screen, Final Winner page, club and scouting cards",
 "kind": "design",
 "priority": "normal",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "RECEIVED",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-28T05:09:36Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-10-28T05:22:20Z", "by": "V", "status": "RECEIVED", "note": "Team V lead got it; starts after Nik's verdict on the HO-035 MP 3D preview. HO-035 data (PR #1028/#1029) noted for the MP build."}, {"at": "2026-10-28T12:39:32Z", "by": "G", "status": "RECEIVED", "note": "ADDENDUM from Team G (Nik 2026-10-28 12:39 UTC asked for smart UI tied to your FIFA 17 pack-opening MP design): (1) SCOUTING CARD = the BACK of your MP card: after the card lands and flips to its face, a tap (or 3 s) flips it again to the back with style tag, report and special in the same tier finish; flip back on tap. Nothing new on screen, nothing covers the face. (2) SEASON FRONT PAGE screen = classic spinning-newspaper drop onto the marble desk, settles, headline then subhead then the two crests and scores, one Continue. (3) COMMENTARY = a broadcast lower-third strip in flow under the scores (FIFA 17 TV style), text types in with the spoken line; on Final Winner the same strip. (4) CLUB CARD = slides up under the crest after the Club Assignment reveal. Team G owns the smart pick: the line/page is chosen by situation priority and seeded by Showdown id + season so both phones show the same one with no reads, never repeating within a Showdown."}, {"at": "2026-10-28T13:02:29Z", "by": "V", "status": "RECEIVED", "note": "Addendum read 28 Oct 9:05 a.m. Eastern: scouting card = back of the Special Player card (flip after face), front page = spinning-newspaper drop, commentary = broadcast lower-third, club card slides up under the crest. Queued right after the HO-035 Big Jump build; it will reuse the Big Jump 3D scene and r85 crests."}]
}
```

# r86: the look of the content pack (commentary strip, season front page screen, Final Winner front page, club card, scouting card)

Nik picked the placements on 2026-10-28 at 04:57 UTC in the Team G lead thread ("A B A A"). The text is written and stored as data in PR #1029 (`data/commentaryLines.js`, `data/frontPages.js`, `data/clubCards.js`, `data/scoutingCards.js`). Team G wires the screens and Team V designs the look ("skin, don't rewire"). Standing rules: premium black-and-gold marble; no dimming, ever (HO-027); nothing covers anything at any size; no old-design flash; the Reus Gate stays until the screen is ready; desktop NEXT_* and phone PHONE_* targets.

## 1. Commentary strip (Season Results and Final Winner)
- A thin marble strip IN the layout, under the season scores on Season Results. It is never an overlay or a toast. On Final Winner it shows one line.
- One line of 8 to 28 words. It is spoken aloud too, and the music ducks while it plays. A small speaker or mute glyph is optional, and the only mute is in Settings.
- Club-history lines play when a manager wins a trophy, in the same strip.
- Frames: CM1 Season Results with the strip (desktop and phone), CM2 Final Winner with its line.

## 2. Season front page, a NEW short screen (after Season Results, before the next season)
- A full newspaper front page with a masthead (an original paper name, not a real paper), a headline (3 to 8 words), a subhead (12 to 24 words), the season number, both clubs' crests (r85 crests), and the two scores.
- One clear "Continue" button. Never skipped or hidden.
- Frames: FP1 desktop and FP2 phone, plus one draw page ("DRAW" is never a winner).

## 3. Final Winner front page
- A large front page below the winner and trophy on Final Winner. It has a kicker label (1 to 3 words, e.g. GOLDEN SHOWDOWN), a headline and a subhead. Gold version for a Golden Showdown.
- The same page is kept on Legacy in a "Front pages" row (small thumbnails, tap to open).
- Frames: FW1 Final Winner, FW2 the Legacy row.

## 4. Club card (Club Assignment) and scouting card (Marquee Player)
- Club card: under the revealed crest on Club Assignment, showing city, nickname, stadium, a story (20 to 35 words) and a target (8 to 16 words). Any field may be an empty string, so hide that row.
- Scouting card: on the Marquee Player screen under the ranking, after the name reveal (fits your walkout card design). It shows a style tag (2 to 4 words), a report (25 to 40 words) and "special" (8 to 14 words).
- Frames: CC1 Club Assignment with the card, SC1 Marquee with the scouting card.

## Deliver
`visual-assets/v10_1/content/`: css, a small plate js for each piece, and BUILD_RESULT.md with the frames above at 1440x900 and 393x660. Use real lines from the data files in the frames.

## Done when
The plates are on a Team V branch with evidence, the ticket is DONE with that branch and commit, and Nik has seen the frames.

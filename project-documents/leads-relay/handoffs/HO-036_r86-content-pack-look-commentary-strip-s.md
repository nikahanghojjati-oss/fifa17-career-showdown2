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
 "status": "DONE",
 "steps": [],
 "evidence": ["factory/v1-wtt5ye @ b91986d19 - visual-assets/v10_1/content/ (content.css, commentary.js, frontpage.js, clubcard.js, scoutcard.js, preview.html, BUILD_RESULT.md, 20 frames CM1 CM2 FP1-3 FW1 FW2 LG1 CC1 SC1 at 1440x900 + 393x660)", "factory/v1-wtt5ye @ b306fca9c - round 2 from Nik's notes: newspaper only on its own pages (season + final, not Legacy, not over Final Winner panel), commentary on the shared result, buttons never covered (checked per frame), Golden Showdown = one manager on 110. Gallery visual-assets/v10_1/content/BUILD_RESULT.md"],
 "log": [{"at": "2026-10-28T05:09:36Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-10-28T05:22:20Z", "by": "V", "status": "RECEIVED", "note": "Team V lead got it; starts after Nik's verdict on the HO-035 MP 3D preview. HO-035 data (PR #1028/#1029) noted for the MP build."}, {"at": "2026-10-28T12:39:32Z", "by": "G", "status": "RECEIVED", "note": "ADDENDUM from Team G (Nik 2026-10-28 12:39 UTC asked for smart UI tied to your FIFA 17 pack-opening MP design): (1) SCOUTING CARD = the BACK of your MP card: after the card lands and flips to its face, a tap (or 3 s) flips it again to the back with style tag, report and special in the same tier finish; flip back on tap. Nothing new on screen, nothing covers the face. (2) SEASON FRONT PAGE screen = classic spinning-newspaper drop onto the marble desk, settles, headline then subhead then the two crests and scores, one Continue. (3) COMMENTARY = a broadcast lower-third strip in flow under the scores (FIFA 17 TV style), text types in with the spoken line; on Final Winner the same strip. (4) CLUB CARD = slides up under the crest after the Club Assignment reveal. Team G owns the smart pick: the line/page is chosen by situation priority and seeded by Showdown id + season so both phones show the same one with no reads, never repeating within a Showdown."}, {"at": "2026-10-28T13:02:29Z", "by": "V", "status": "RECEIVED", "note": "Addendum read 28 Oct 9:05 a.m. Eastern: scouting card = back of the Special Player card (flip after face), front page = spinning-newspaper drop, commentary = broadcast lower-third, club card slides up under the crest. Queued right after the HO-035 Big Jump build; it will reuse the Big Jump 3D scene and r85 crests."}, {"at": "2026-10-28T18:49:29Z", "by": "G", "status": "RECEIVED", "note": "ADDENDUM 2 (Nik 2026-10-28 18:49 UTC, his words: 'Commentary integration in place you designed for it should look similar to fifa 17 presentation bars'): the commentary strip (CM1 Season Results, CM2 Final Winner) must look like the FIFA 17 TV presentation bars: a slanted/angled dark slab with a bright accent block on the left edge (our gold, tier colour for MP lines), a small caps label tab (e.g. COMMENTARY or the speaker glyph), white condensed uppercase-feel type, sharp corners, and a quick slide-and-wipe in from the left with the text typing in as it is spoken, then a clean wipe out. Keep our marble/gold palette, not EA branding or logos. It stays IN the layout in a reserved slot under the scores (never an overlay, never covers anything, no dimming, no layout jump: the slot height is reserved before the bar animates). Same bar style for club-history lines. Please show it in the CM1/CM2 frames, desktop and phone."}, {"at": "2026-10-28T20:04:33Z", "by": "G", "status": "RECEIVED", "note": "GO (Nik 2026-10-28 20:04 UTC: 'Let team v know about content look'): please start the content look now, as the next job after the Big Jump. Full scope = this ticket plus both addenda: (1) commentary = FIFA 17 presentation bar in a reserved in-layout slot under the scores (Season Results + Final Winner, club-history lines too), text types in as spoken; (2) season front page = spinning-newspaper drop on the marble desk, then headline, subhead, crests and scores, one Continue; (3) Final Winner front page under the trophy (gold for Golden Showdown) + Legacy 'Front pages' row; (4) club card slides up under the crest on Club Assignment; (5) scouting card = back of the Special Player card (flip after face). Real lines from data/*.js on gameplay/r86 (b9e4e8f7). Frames CM1 CM2 FP1 FP2 FW1 FW2 CC1 SC1 at 1440x900 and 393x660 for Nik's gallery."}, {"at": "2026-10-28T20:13:40Z", "by": "V", "status": "WORKING", "note": ""}, {"at": "2026-10-28T20:35:30Z", "by": "V", "status": "DONE", "note": ""}, {"at": "2026-10-28T21:34:37Z", "by": "V", "status": "DONE", "note": ""}]
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

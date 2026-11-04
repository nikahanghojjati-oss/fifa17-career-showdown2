# HO-035 · Team G → Team V · r86 Marquee Player reveal screen and MP chip

```ticket
{
 "id": "HO-035",
 "from": "G",
 "to": "V",
 "title": "r86 Marquee Player reveal screen and MP chip",
 "kind": "design",
 "priority": "top",
 "worker": "opus",
 "parent": null,
 "job": null,
 "status": "DONE",
 "steps": [],
 "evidence": ["claude/project-thread-3ux89z@78bccd28:visual-assets/v10_1/marquee/BUILD_RESULT.md", "factory/v1-wtt5ye @ 814cfb44a - visual-assets/v10_1/special-player/ (index.html game view by default, assets/, BUILD_RESULT.md with wiring: __pick(d,n) or ?d=&n=, #cta to Career Start, lazy-load). Nik approved the Special Player screen and the content look 28 Oct 5:53 p.m. Eastern. Preview = Big Jump v19. MP chip: chip(player,{size}) from claude/project-thread-3ux89z @ 78bccd28 visual-assets/v10_1/marquee (marquee.js/.css); label should read SP after Nik's rename to Special Player."],
 "log": [{"at": "2026-10-27T23:12:32Z", "by": "G", "status": "SENT", "note": ""}, {"at": "2026-10-27T23:52:02Z", "by": "V", "status": "RECEIVED", "note": "Team V lead started it in this thread 27 Oct 7:5x p.m. Eastern"}, {"at": "2026-10-27T23:54:03Z", "by": "V", "status": "WORKING", "note": "Building visual-assets/v10_1/marquee on branch claude/project-thread-3ux89z: club plate scene reused, code-drawn original shirts, gold faceless silhouette for the player step, tier badge, MP chip"}, {"at": "2026-10-28T00:03:44Z", "by": "V", "status": "WORKING", "note": "Kit ready for Nik's look: branch claude/project-thread-3ux89z @ 78bccd28, visual-assets/v10_1/marquee (BUILD_RESULT.md, evidence/). Reveal order per Nik: figure, jersey, number, pause, club, name, rank. DONE after Nik's OK."}, {"at": "2026-10-28T04:12:31Z", "by": "V", "status": "WORKING", "note": "Nik changed the design (28 Oct 12:11 a.m. Eastern): NO managers on the Marquee screen. It becomes a FIFA 17-style walkout reveal: tunnel + tier-colour pyro, reveal boards (shirt, number, club), silhouette walkout, name, then a tier-finish Marquee card. Reveals run Daniel then Nik. New desktop mockup = picture ticket 1849 (factory b3e0a8cc). The 78bccd28 kit is superseded; data contract unchanged."}, {"at": "2026-10-28T04:15:51Z", "by": "V", "status": "WORKING", "note": "DATA ASK for Team G (Nik 28 Oct 12:15 a.m. Eastern): add the player's NATION to each Marquee player (e.g. nation:'Argentina' plus ISO code nationCode:'AR') so the walkout can show a nation-flag board, FIFA 17 style. Also from Nik: no people on the screen at all; the club shirt itself walks out of the tunnel. Reveal: tier-colour pyro, nation flag board, shirt walks out, number, pause, club board, name on shirt, tier card. Ticket 1849 (factory) is the desktop mockup."}, {"at": "2026-10-28T04:29:49Z", "by": "V", "status": "WORKING", "note": "DATA ASK update: besides nation + nationCode, please add each Marquee player's main POSITION (ST, CAM, CB, GK ...) from the FIFA 17 list. The reveal now copies FIFA 17's pack opening from Nik's screenshots: pack on the pitch, card back, then position, nation flag (flags drop from the roofs), club coin land on the card, card flips (no player). Study: factory project-documents/factory/r86/MARQUEE_FIFA17_PACK_STUDY.md; mockup ticket 1849 v7 (factory e5fa3f57)."}, {"at": "2026-10-28T04:32:37Z", "by": "V", "status": "WORKING", "note": "DATA ASK update 2: the card face copies FIFA 17's six face stats. Please add per Marquee player the six FIFA 17 card stats from the dataset: outfield PAC SHO PAS DRI DEF PHY; goalkeepers DIV HAN KIC REF SPD POS. With nation, nationCode, position and number that completes the card."}, {"at": "2026-10-28T05:09:36Z", "by": "G", "status": "WORKING", "note": "DATA READY from Team G: nation, nationCode (ISO; GB-ENG/GB-WLS), position, and the six card stats (outfield PAC SHO PAS DRI DEF PHY; GK DIV HAN KIC REF SPD POS) on every row of data/marqueePlayers.js, PR #1028 branch claude-gameplay/r86-mp-numbers @7f35df2f; js/marqueePlayer.js passes them through. Scouting card text (style, report, special) per player: data/scoutingCards.js in PR #1029."}, {"at": "2026-10-28T21:57:22Z", "by": "V", "status": "DONE", "note": ""}],
 "parts": ["HO-042"]
}
```

# r86: Marquee Player reveal screen and the MP chip

Nik picked this feature for r86 (2026-10-27 12:46 UTC, Team G lead thread). On 2026-10-27 22:58 UTC he confirmed the look is Team V's job. Team G has built the draw and the data (PR #1027 into gameplay/r86). Team G also wires the screen and the career screens. Team V designs the look.

## What the screen is
- A new full screen, **Marquee Player** (screen id `marqueeScreen`). It comes after Club Assignment is confirmed and before Career Start, on both phones and both sizes.
- Daniel (playerOne) stands on the left and Nik (playerTwo) on the right. Each is **holding a shirt**, like the Club Assignment packs scene (`visual-assets/v10_1/club`, Team V's club plate, hand map).
- Each manager's reveal order (Nik's words): **the team jersey first, then the shirt number, then the player, then the team name, then the player name, then the ranking under him.**
- **Ranking badge:** the rank number flashes in its tier colour in the area under the jersey:
  - top 3: black-blue-gold
  - top 10: blue-gold
  - top 20: gold
  - top 50: silver
  - everyone else: bronze
- **No real player photos** (likeness and copyright, the same line as the r85 crests). "The player" step is your call: a generic figure, a silhouette, or the name on the shirt back. No real faces.
- **The jersey** is a shirt in the player's club colours. There are 57 clubs plus one player with no club (Oscar), listed below. Use an original shirt design with no club badges or sponsor marks. The r85 crest work (PR #1012) shows where the line is.
- The shirt number is the player's real 2016-17 squad number. Team G adds it to the list (Nik chose this 2026-10-27 22:54 UTC).
- Standing rules: premium black-and-gold marble; no dimming, ever (HO-027); nothing covers anything at any size; no flash, ever, from the old design; the Reus Gate loading screen stays until the screen is ready; desktop matches its NEXT_ target and phone its PHONE_ target.

## Data the screen gets (Team G fills it)
`{daniel:{rank,name,club,overall,potential,tier,number}, nik:{...}}`
- `tier` is one of `black-blue-gold`, `blue-gold`, `gold`, `silver`, `bronze`.
- `club` is null for Oscar.
- The pair is the same on both phones. Source: `js/marqueePlayer.js` `forShowdown()` / `forNewShowdown()`, list `data/marqueePlayers.js` (gameplay/r86 after #1027).

## The MP chip (second deliverable)
- Nik wants the Marquee Player shown as "MP" on: History, Statistics, Standings, Rule Book, Legacy, Trophy Room, Rivalry, Final Winner and Season Results, on desktop and phone.
- Please design one small chip: "MP", the player name, and the tier colour. It needs a desktop size and a phone size that fit these screens without covering anything.
- Team G places it, then sends you a gallery to check.

## Deliver (the same pattern as `visual-assets/v10_1/club`)
- `visual-assets/v10_1/marquee/`: `marquee.css`, `marquee.js` (a plate app like ClubPlate that takes the frame data above and runs the reveal), assets, and `BUILD_RESULT.md` with frames MP1 to MP6 (one per reveal step).
- Evidence: each frame at 1440x900 and 393x660, plus the MP chip on two screens at both sizes.
- Team G wires the plate into `#marqueeScreen` the same way `js/clubScreenV10.js` skins `#clubWheelScreen` ("skin, don't rewire").

## Clubs (player count)
Real Madrid 16; FC Bayern München 14; FC Barcelona 12; Juventus 10; Atlético Madrid 10; Manchester City 10; Paris Saint-Germain 9; Manchester United 7; Chelsea 6; Borussia Dortmund 6; Arsenal 6; Tottenham Hotspur 5; Bayer 04 Leverkusen 5; Napoli 5; Milan 4; AS Monaco 4; Liverpool 4; Inter 4; Lazio 4; Olympique Lyonnais 4; SL Benfica 4; Athletic Club de Bilbao 3; Ajax 3; FC Schalke 04 3; Everton 2; Torino 2; Toulouse Football Club 2; Villarreal CF 2; Sporting CP 2; Borussia Mönchengladbach 2; OGC Nice 2; Roma 2; Sevilla FC 2; then one each: RSC Anderlecht, Real Sociedad, 1. FC Köln, Stoke City, Genoa, TSG 1899 Hoffenheim, Real Betis, UD Las Palmas, Deportivo Alavés, Racing Club, Independiente, Fiorentina, Olympique de Marseille, Udinese, Sporting Club de Bastia, KAS Eupen, Shakhtar Donetsk, FC Porto, Southampton, Galatasaray SK, West Ham United, Valencia CF, Burnley; no club: Oscar.

## Done when
The plate and chip are on a Team V branch with evidence, the ticket is DONE with that branch and commit, and Nik has seen the frames.

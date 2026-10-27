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
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-27T23:12:32Z", "by": "G", "status": "SENT", "note": ""}]
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

# Fable job 10: r87 Squad Roulette board updates, positions and ratings (Career Mode Showdown 2.0.0)

Code snapshot: gameplay/r87 @ 7d528567e, repo nikahanghojjati-oss/fifa17-career-showdown2. The full source of the board engine and its data is below this brief, with excerpts of the Transfer War code that feeds it, and a real engine log of a 10-season run. You cannot run code here, so reason carefully and show your trace.

## The product
A private two-player FIFA 17 Career Mode competition web app. Two managers, Daniel (playerOne) and Nik (playerTwo), each play their own FIFA 17 career on a console and use this app to run a "Showdown" of 1, 3, 5 or 10 seasons against each other.

## What the board is, and why it must be right
Every season, before the transfer window, each manager spins a 7-chamber revolver (Roster Russian Roulette). One spin in seven fires and hits one player on his **board**: his club's starting XI plus 4 subs (15 players). That player must then be released **in his real FIFA 17 save**. So the board must show what his real FIFA 17 squad would look like, or he is told to release someone who is not there, or the wrong player.

The board is never typed in by anyone. js/rosterRoulette.js rebuilds it every season from:
- the club's FIFA 17 launch squad (data/rosterSquads.js: XI, 4 subs and 3 hidden reserves, made by scripts/build-fifa17-rosters.py from the SoFIFA 170002 launch roster);
- the club's full FIFA 17 pool (data/fifa17Players.js: name, overall, positions in preference order, the launch slot, shirt number, nation), used to refill;
- both managers' Special Players (never on any board, both clubs);
- every earlier season's Transfer War verdicts: each signing a manager made, with the name, position and overall he typed himself, and whether the rival guessed it. A guessed signing is "released" (did not join); a kept one joined his club;
- every earlier season's saved shots (a shot player is gone for good).

Nik's rules for the board:
- squads only from the manager's own club pool plus his kept signings;
- 11 starters in fitting positions plus 4 subs;
- a kept signing joins: into an empty slot first, otherwise over the lowest overall when strictly better (Nik picked "Auto: replace the lowest overall");
- the overall of each signing decides; there are no rating changes over the seasons (FIFA 17 launch ratings are fixed);
- a squad that started at 24 or fewer players and is down to 14 by season 10 is fine; no shooting after that;
- the Special Player is never hit, and every other board player has an equal chance;
- **a recurring bug, "a guessed player stays on the board", must have a root-cause fix.**

## Nik's rule on overalls after season 1 (2026-11-01, read this first)
- In season 1 every board player's overall matches the FIFA 17 launch database.
- From season 2 on, players already at the club grow or decline in the real game. **The board keeps their launch overall on purpose.** Do not report that as a bug.
- A player who joins through Transfer War is different. His overall is the number the manager types (30-99) from his real game. It will often differ from the database, and for top-100 / top-300 players (the Special Player list) it almost always will, higher or lower.
- **That difference must never break the game logic.** Check every place where a typed overall meets the database:
  - ranking and "replace the lowest overall";
  - namesake matching and identity (name, number, overall);
  - position lookup from the database for a signing;
  - Special Player exclusion;
  - saved shots, version hashes and the verdict copy on the phone;
  - equal-overall ordering;
  - both phones building the same board.
- A signing's overall must never be swapped for the database value, or the other way round, anywhere.

## Cross-feature consistency (one game logic)
The roulette boards, the Special Player and the Transfer War must agree on who a player is and what he is worth. Check these cases:
- The engine keeps **both** managers' Special Players off **both** boards by name. In separate FIFA saves the rival can really sign that player in Transfer War: what happens to that kept signing, and is that what a FIFA player would expect?
- A manager signs a player who is on the Special Player list but is nobody's Special Player.
- A manager signs his own Special Player's namesake.
- The same player appears in the database at two clubs.

## Already checked by script (do not re-check)
- data/rosterSquads.js rows match data/fifa17Players.js (name, shirt, overall) for all 1,764 rows in 98 clubs.
- The scene's copy visual-assets/v10_1/roulette/assets/squads.json matches data/rosterSquads.js for all 98 clubs.
- Special Player overalls match the club pool. Club pools hold 24 to 33 players.

## Your job
Work as the senior engineer who owns "the board on screen is the squad in the real game". Read every file in full.

1. **Board update correctness.** Trace rrForSeason by hand for 10 seasons. Check every rule above, and these cases: a shot player never comes back (also as a refill from the club pool or a reserve); a guessed signing never appears, now or later; a kept signing always appears unless he is a shot player or a Special Player; a player guessed in one window and signed again (not guessed) in a later window; a re-signing of a player already signed; a signing with the same name as a club player (namesakes); two kept signings with equal overalls; a kept signing worse than everyone (bench or not at all?); a keeper signing when the club already has two keepers; the XI never left without a keeper while one exists; the board running short and what fills the slot; the Special Player being a player of the rival's club.
2. **Positions.** Check how the engine decides a player "fits" a slot (rrFit, rrLine), how a signing's typed position is used, how a club player's positions come from the pool (including namesakes at other clubs), and what happens to out-of-position launch picks. Would a FIFA 17 manager agree with each XI/bench choice? Find any case where a clearly better fitting player sits on the bench or in reserve while a weaker one starts, or a player is put in a slot he cannot play.
3. **Ratings vs the real game.** Spot-check from your own knowledge of FIFA 17 launch ratings (squad 170002) the stars and some lesser players of a few clubs in data/rosterSquads.js and data/fifa17Players.js: overall, main position, club. Also check the launch XI/subs choice in scripts/build-fifa17-rosters.py against how FIFA 17 itself picks a starting XI. Mark each claim that rests on memory as "from memory".
4. **The engine log.** The section "ENGINE LOG" below is real output of the current engine for Daniel (Arsenal) vs Nik (Bournemouth), Daniel's Special Player Neymar, Nik's Special Player M. Özil (an Arsenal player), with the Transfer War verdicts shown under each season. Go through it season by season and say for every board whether it is what Nik's rules and real FIFA 17 would give. Point at every line that looks wrong and trace why the engine produced it.
5. **Both phones must agree.** The board is computed on each phone; find any input (local verdict copy vs a read, saved shots, version of the data) that could make the two phones build different boards.
6. **What the manager sees.** Does the Rule Book text match what the engine does? Is the "kept off the board" note on the result card right in every case?

## Threat model
Normal play only: two honest players, reloads, a phone a build behind. A manager can type any FIFA 17 player name, position and overall (30-99) for a signing, with honest mistakes (wrong position, typo in a name). Anything needing a modified app is out of scope.

## Do not re-report
- Animation, sound, stuck screens (that is job 9).
- The RRR_FROM_MS date.
- Accented names in a fallback font.

For each finding give:
- ID (F10-NN) and severity: P0 wrong player released or a guessed player on the board; P1 a board a manager will notice is wrong; P2 rare; P3 polish;
- file:line, quoting the code so it can be found by text;
- the exact inputs (clubs, verdicts, season);
- expected board vs actual board;
- your trace;
- the smallest fix you would make.

Put anything you are not sure of in a separate "suspected" list. No style notes. End with the top 5 to fix first.

Keep the visible reply under about 60,000 characters.

## ENGINE LOG (real output of js/rosterRoulette.js at this snapshot; made by the script after it)

````text

=== SEASON 1 ===

-- playerOne Arsenal (formation 4-2-3-1 (2)) --
 0 XI  CAM  F. Coquelin (81 CDM/CM)
 1 XI  GK   P. Čech (88 GK)
 2 XI  LM   A. Sánchez (87 LW/LM/RW)
 3 XI  RDM  Santi Cazorla (86 CAM/CM/CDM)
 4 XI  LCB  L. Koscielny (85 CB)
 5 XI  RM   A. Ramsey (84 CM/CDM/RW)
 6 XI  LDM  G. Xhaka (84 CM)
 7 XI  RCB  S. Mustafi (83 CB)
 8 XI  ST   O. Giroud (83 ST)
 9 XI  LB   Nacho Monreal (81 LB)
10 XI  RB   Héctor Bellerín (79 RB)
11 SUB SUB  P. Mertesacker (83 CB)
12 SUB SUB  M. Debuchy (80 RB)
13 SUB SUB  T. Walcott (81 LM/ST/RW/RM)
14 SUB SUB  Lucas Pérez (81 ST)
spin: fired=false hitSlot=null hit=- bulletChamber=5 stopChamber=0
this season's Transfer War verdicts (name, POS, OVR, guessed): [["K. Mbappé","ST",75,false],["N. Kanté","CDM",87,true],["T. Courtois","GK",89,false],["W. Ben Yedder","ST",80,false]]

-- playerTwo Bournemouth (formation 4-1-4-1) --
 0 XI  RCM  J. Wilshere (82 CM/CDM/CAM)
 1 XI  ST   C. Wilson (76 ST)
 2 XI  GK   A. Boruc (76 GK)
 3 XI  CDM  A. Surman (75 CM/CDM)
 4 XI  LCM  H. Arter (74 CM/CAM)
 5 XI  RCB  S. Francis (73 CB/RB)
 6 XI  LCB  S. Cook (72 CB)
 7 XI  LM   J. King (72 ST/LM)
 8 XI  LB   C. Daniels (72 LB)
 9 XI  RM   J. Ibe (71 LW/RW)
10 XI  RB   A. Smith (71 RB)
11 SUB SUB  M. Gradel (79 LW/RW/ST)
12 SUB SUB  B. Afobe (74 ST)
13 SUB SUB  M. Wilson (74 CB/LB/CDM)
14 SUB SUB  A. Federici (73 GK)
spin: fired=false hitSlot=null hit=- bulletChamber=2 stopChamber=5
this season's Transfer War verdicts (name, POS, OVR, guessed): [["Rúben Neves","CM",74,false],["J. Stones","CB",81,false],["Jorginho","CM",80,true]]

=== SEASON 2 ===

-- playerOne Arsenal (formation 4-2-3-1 (2)) --
 0 XI  CAM  F. Coquelin (81 CDM/CM)
 1 XI  GK   T. Courtois (89 GK signed S1)
 2 XI  LM   A. Sánchez (87 LW/LM/RW)
 3 XI  RDM  Santi Cazorla (86 CAM/CM/CDM)
 4 XI  LCB  L. Koscielny (85 CB)
 5 XI  RM   A. Ramsey (84 CM/CDM/RW)
 6 XI  LDM  G. Xhaka (84 CM)
 7 XI  RCB  S. Mustafi (83 CB)
 8 XI  ST   O. Giroud (83 ST)
 9 XI  LB   Nacho Monreal (81 LB)
10 XI  RB   Héctor Bellerín (79 RB)
11 SUB SUB  P. Mertesacker (83 CB)
12 SUB SUB  P. Čech (88 GK)
13 SUB SUB  T. Walcott (81 LM/ST/RW/RM)
14 SUB SUB  Lucas Pérez (81 ST)
spin: fired=false hitSlot=null hit=- bulletChamber=5 stopChamber=1
this season's Transfer War verdicts (name, POS, OVR, guessed): [["J. Kimmich","RB",80,false],["N. Kanté","CDM",87,false],["L. Sané","LW",80,false]]

-- playerTwo Bournemouth (formation 4-1-4-1) --
 0 XI  RCM  J. Wilshere (82 CM/CDM/CAM)
 1 XI  ST   C. Wilson (76 ST)
 2 XI  GK   A. Boruc (76 GK)
 3 XI  CDM  A. Surman (75 CM/CDM)
 4 XI  LCM  H. Arter (74 CM/CAM)
 5 XI  RCB  S. Francis (73 CB/RB)
 6 XI  LCB  J. Stones (81 CB signed S1)
 7 XI  LM   J. King (72 ST/LM)
 8 XI  LB   C. Daniels (72 LB)
 9 XI  RM   J. Ibe (71 LW/RW)
10 XI  RB   A. Smith (71 RB)
11 SUB SUB  M. Gradel (79 LW/RW/ST)
12 SUB SUB  B. Afobe (74 ST)
13 SUB SUB  M. Wilson (74 CB/LB/CDM)
14 SUB SUB  Rúben Neves (74 CM signed S1)
spin: fired=false hitSlot=null hit=- bulletChamber=2 stopChamber=4
this season's Transfer War verdicts (name, POS, OVR, guessed): [["M. Salah","RW",83,false],["H. Kane","ST",84,true],["R. Lukaku","ST",84,false]]

=== SEASON 3 ===

-- playerOne Arsenal (formation 4-2-3-1 (2)) --
 0 XI  CAM  F. Coquelin (81 CDM/CM)
 1 XI  GK   T. Courtois (89 GK signed S1)
 2 XI  LM   A. Sánchez (87 LW/LM/RW)
 3 XI  RDM  Santi Cazorla (86 CAM/CM/CDM)
 4 XI  LCB  L. Koscielny (85 CB)
 5 XI  RM   A. Ramsey (84 CM/CDM/RW)
 6 XI  LDM  G. Xhaka (84 CM)
 7 XI  RCB  S. Mustafi (83 CB)
 8 XI  ST   O. Giroud (83 ST)
 9 XI  LB   Nacho Monreal (81 LB)
10 XI  RB   J. Kimmich (80 RB signed S2)
11 SUB SUB  P. Mertesacker (83 CB)
12 SUB SUB  P. Čech (88 GK)
13 SUB SUB  T. Walcott (81 LM/ST/RW/RM)
14 SUB SUB  Lucas Pérez (81 ST)
spin: fired=false hitSlot=null hit=- bulletChamber=1 stopChamber=0
kept but kept off the board: [{"name":"N. Kanté","season":2,"reason":"guessed"}]
this season's Transfer War verdicts (name, POS, OVR, guessed): [["R. Varane","CB",84,false],["Isco","CAM",84,true]]

-- playerTwo Bournemouth (formation 4-1-4-1) --
 0 XI  RCM  J. Wilshere (82 CM/CDM/CAM)
 1 XI  ST   R. Lukaku (84 ST signed S2)
 2 XI  GK   A. Boruc (76 GK)
 3 XI  CDM  A. Surman (75 CM/CDM)
 4 XI  LCM  H. Arter (74 CM/CAM)
 5 XI  RCB  S. Francis (73 CB/RB)
 6 XI  LCB  J. Stones (81 CB signed S1)
 7 XI  LM   J. King (72 ST/LM)
 8 XI  LB   C. Daniels (72 LB)
 9 XI  RM   M. Salah (83 RW signed S2)
10 XI  RB   A. Smith (71 RB)
11 SUB SUB  M. Gradel (79 LW/RW/ST)
12 SUB SUB  C. Wilson (76 ST)
13 SUB SUB  M. Wilson (74 CB/LB/CDM)
14 SUB SUB  Rúben Neves (74 CM signed S1)
spin: fired=false hitSlot=null hit=- bulletChamber=4 stopChamber=6
this season's Transfer War verdicts (name, POS, OVR, guessed): [["J. Stones","CB",81,false],["J. Oblak","GK",86,false]]

=== SEASON 4 ===

-- playerOne Arsenal (formation 4-2-3-1 (2)) --
 0 XI  CAM  F. Coquelin (81 CDM/CM)
 1 XI  GK   T. Courtois (89 GK signed S1)
 2 XI  LM   A. Sánchez (87 LW/LM/RW)
 3 XI  RDM  Santi Cazorla (86 CAM/CM/CDM)
 4 XI  LCB  L. Koscielny (85 CB)
 5 XI  RM   A. Ramsey (84 CM/CDM/RW)
 6 XI  LDM  G. Xhaka (84 CM)
 7 XI  RCB  R. Varane (84 CB signed S3)
 8 XI  ST   O. Giroud (83 ST)
 9 XI  LB   Nacho Monreal (81 LB)
10 XI  RB   J. Kimmich (80 RB signed S2)
11 SUB SUB  P. Mertesacker (83 CB)
12 SUB SUB  P. Čech (88 GK)
13 SUB SUB  S. Mustafi (83 CB)
14 SUB SUB  Lucas Pérez (81 ST)
spin: fired=false hitSlot=null hit=- bulletChamber=6 stopChamber=1
this season's Transfer War verdicts (name, POS, OVR, guessed): [["P. Aubameyang","ST",86,false]]

-- playerTwo Bournemouth (formation 4-1-4-1) --
 0 XI  RCM  J. Wilshere (82 CM/CDM/CAM)
 1 XI  ST   R. Lukaku (84 ST signed S2)
 2 XI  GK   J. Oblak (86 GK signed S3)
 3 XI  CDM  A. Surman (75 CM/CDM)
 4 XI  LCM  H. Arter (74 CM/CAM)
 5 XI  RCB  S. Francis (73 CB/RB)
 6 XI  LCB  J. Stones (81 CB signed S1)
 7 XI  LM   J. King (72 ST/LM)
 8 XI  LB   C. Daniels (72 LB)
 9 XI  RM   M. Salah (83 RW signed S2)
10 XI  RB   A. Smith (71 RB)
11 SUB SUB  M. Gradel (79 LW/RW/ST)
12 SUB SUB  C. Wilson (76 ST)
13 SUB SUB  A. Boruc (76 GK)
14 SUB SUB  Rúben Neves (74 CM signed S1)
spin: fired=true hitSlot=5 hit=S. Francis bulletChamber=4 stopChamber=4
this season's Transfer War verdicts (name, POS, OVR, guessed): [["C. Wilson","ST",70,false],["D. Alaba","LB",85,false]]

=== SEASON 5 ===

-- playerOne Arsenal (formation 4-2-3-1 (2)) --
 0 XI  CAM  F. Coquelin (81 CDM/CM)
 1 XI  GK   T. Courtois (89 GK signed S1)
 2 XI  LM   A. Sánchez (87 LW/LM/RW)
 3 XI  RDM  Santi Cazorla (86 CAM/CM/CDM)
 4 XI  LCB  L. Koscielny (85 CB)
 5 XI  RM   A. Ramsey (84 CM/CDM/RW)
 6 XI  LDM  G. Xhaka (84 CM)
 7 XI  RCB  R. Varane (84 CB signed S3)
 8 XI  ST   P. Aubameyang (86 ST signed S4)
 9 XI  LB   Nacho Monreal (81 LB)
10 XI  RB   J. Kimmich (80 RB signed S2)
11 SUB SUB  P. Mertesacker (83 CB)
12 SUB SUB  P. Čech (88 GK)
13 SUB SUB  S. Mustafi (83 CB)
14 SUB SUB  O. Giroud (83 ST)
spin: fired=false hitSlot=null hit=- bulletChamber=2 stopChamber=0
this season's Transfer War verdicts (name, POS, OVR, guessed): [["L. Bonucci","CB",87,false],["P. Pogba","CM",88,true]]

-- playerTwo Bournemouth (formation 4-1-4-1) --
 0 XI  RCM  J. Wilshere (82 CM/CDM/CAM)
 1 XI  ST   R. Lukaku (84 ST signed S2)
 2 XI  GK   J. Oblak (86 GK signed S3)
 3 XI  CDM  A. Surman (75 CM/CDM)
 4 XI  LCM  H. Arter (74 CM/CAM)
 5 XI  RCB  M. Wilson (74 CB/LB/CDM)
 6 XI  LCB  J. Stones (81 CB signed S1)
 7 XI  LM   J. King (72 ST/LM)
 8 XI  LB   D. Alaba (85 LB signed S4)
 9 XI  RM   M. Salah (83 RW signed S2)
10 XI  RB   A. Smith (71 RB)
11 SUB SUB  M. Gradel (79 LW/RW/ST)
12 SUB SUB  C. Wilson (76 ST)
13 SUB SUB  A. Boruc (76 GK)
14 SUB SUB  Rúben Neves (74 CM signed S1)
spin: fired=false hitSlot=null hit=- bulletChamber=3 stopChamber=1
this season's Transfer War verdicts (name, POS, OVR, guessed): [["M. Hummels","CB",86,false]]

=== SEASON 6 ===

-- playerOne Arsenal (formation 4-2-3-1 (2)) --
 0 XI  CAM  F. Coquelin (81 CDM/CM)
 1 XI  GK   T. Courtois (89 GK signed S1)
 2 XI  LM   A. Sánchez (87 LW/LM/RW)
 3 XI  RDM  Santi Cazorla (86 CAM/CM/CDM)
 4 XI  LCB  L. Koscielny (85 CB)
 5 XI  RM   A. Ramsey (84 CM/CDM/RW)
 6 XI  LDM  G. Xhaka (84 CM)
 7 XI  RCB  L. Bonucci (87 CB signed S5)
 8 XI  ST   P. Aubameyang (86 ST signed S4)
 9 XI  LB   Nacho Monreal (81 LB)
10 XI  RB   J. Kimmich (80 RB signed S2)
11 SUB SUB  R. Varane (84 CB signed S3)
12 SUB SUB  P. Čech (88 GK)
13 SUB SUB  S. Mustafi (83 CB)
14 SUB SUB  O. Giroud (83 ST)
spin: fired=false hitSlot=null hit=- bulletChamber=3 stopChamber=0
this season's Transfer War verdicts (name, POS, OVR, guessed): [["A. Griezmann","ST",88,false]]

-- playerTwo Bournemouth (formation 4-1-4-1) --
 0 XI  RCM  J. Wilshere (82 CM/CDM/CAM)
 1 XI  ST   R. Lukaku (84 ST signed S2)
 2 XI  GK   J. Oblak (86 GK signed S3)
 3 XI  CDM  A. Surman (75 CM/CDM)
 4 XI  LCM  H. Arter (74 CM/CAM)
 5 XI  RCB  M. Hummels (86 CB signed S5)
 6 XI  LCB  J. Stones (81 CB signed S1)
 7 XI  LM   J. King (72 ST/LM)
 8 XI  LB   D. Alaba (85 LB signed S4)
 9 XI  RM   M. Salah (83 RW signed S2)
10 XI  RB   A. Smith (71 RB)
11 SUB SUB  M. Gradel (79 LW/RW/ST)
12 SUB SUB  C. Wilson (76 ST)
13 SUB SUB  A. Boruc (76 GK)
14 SUB SUB  Rúben Neves (74 CM signed S1)
spin: fired=false hitSlot=null hit=- bulletChamber=2 stopChamber=4
this season's Transfer War verdicts (name, POS, OVR, guessed): [["Koke","CM",85,false],["S. Busquets","CDM",86,false]]

=== SEASON 7 ===

-- playerOne Arsenal (formation 4-2-3-1 (2)) --
 0 XI  CAM  F. Coquelin (81 CDM/CM)
 1 XI  GK   T. Courtois (89 GK signed S1)
 2 XI  LM   A. Sánchez (87 LW/LM/RW)
 3 XI  RDM  Santi Cazorla (86 CAM/CM/CDM)
 4 XI  LCB  L. Koscielny (85 CB)
 5 XI  RM   A. Ramsey (84 CM/CDM/RW)
 6 XI  LDM  G. Xhaka (84 CM)
 7 XI  RCB  L. Bonucci (87 CB signed S5)
 8 XI  ST   A. Griezmann (88 ST signed S6)
 9 XI  LB   Nacho Monreal (81 LB)
10 XI  RB   J. Kimmich (80 RB signed S2)
11 SUB SUB  R. Varane (84 CB signed S3)
12 SUB SUB  P. Čech (88 GK)
13 SUB SUB  P. Aubameyang (86 ST signed S4)
14 SUB SUB  O. Giroud (83 ST)
spin: fired=false hitSlot=null hit=- bulletChamber=5 stopChamber=2
this season's Transfer War verdicts (name, POS, OVR, guessed): [["M. Verratti","CM",85,false]]

-- playerTwo Bournemouth (formation 4-1-4-1) --
 0 XI  RCM  J. Wilshere (82 CM/CDM/CAM)
 1 XI  ST   R. Lukaku (84 ST signed S2)
 2 XI  GK   J. Oblak (86 GK signed S3)
 3 XI  CDM  Koke (85 CM signed S6)
 4 XI  LCM  S. Busquets (86 CDM signed S6)
 5 XI  RCB  M. Hummels (86 CB signed S5)
 6 XI  LCB  J. Stones (81 CB signed S1)
 7 XI  LM   J. King (72 ST/LM)
 8 XI  LB   D. Alaba (85 LB signed S4)
 9 XI  RM   M. Salah (83 RW signed S2)
10 XI  RB   A. Smith (71 RB)
11 SUB SUB  M. Gradel (79 LW/RW/ST)
12 SUB SUB  C. Wilson (76 ST)
13 SUB SUB  A. Boruc (76 GK)
14 SUB SUB  A. Surman (75 CM/CDM)
spin: fired=true hitSlot=1 hit=R. Lukaku bulletChamber=3 stopChamber=3
this season's Transfer War verdicts (name, POS, OVR, guessed): []

=== SEASON 8 ===

-- playerOne Arsenal (formation 4-2-3-1 (2)) --
 0 XI  CAM  M. Verratti (85 CM signed S7)
 1 XI  GK   T. Courtois (89 GK signed S1)
 2 XI  LM   A. Sánchez (87 LW/LM/RW)
 3 XI  RDM  Santi Cazorla (86 CAM/CM/CDM)
 4 XI  LCB  L. Koscielny (85 CB)
 5 XI  RM   A. Ramsey (84 CM/CDM/RW)
 6 XI  LDM  G. Xhaka (84 CM)
 7 XI  RCB  L. Bonucci (87 CB signed S5)
 8 XI  ST   A. Griezmann (88 ST signed S6)
 9 XI  LB   Nacho Monreal (81 LB)
10 XI  RB   J. Kimmich (80 RB signed S2)
11 SUB SUB  R. Varane (84 CB signed S3)
12 SUB SUB  P. Čech (88 GK)
13 SUB SUB  P. Aubameyang (86 ST signed S4)
14 SUB SUB  O. Giroud (83 ST)
spin: fired=false hitSlot=null hit=- bulletChamber=4 stopChamber=5
this season's Transfer War verdicts (name, POS, OVR, guessed): []

-- playerTwo Bournemouth (formation 4-1-4-1) --
 0 XI  RCM  J. Wilshere (82 CM/CDM/CAM)
 1 XI  ST   M. Gradel (79 LW/RW/ST)
 2 XI  GK   J. Oblak (86 GK signed S3)
 3 XI  CDM  Koke (85 CM signed S6)
 4 XI  LCM  S. Busquets (86 CDM signed S6)
 5 XI  RCB  M. Hummels (86 CB signed S5)
 6 XI  LCB  J. Stones (81 CB signed S1)
 7 XI  LM   J. King (72 ST/LM)
 8 XI  LB   D. Alaba (85 LB signed S4)
 9 XI  RM   M. Salah (83 RW signed S2)
10 XI  RB   A. Smith (71 RB)
11 SUB SUB  H. Arter (74 CM/CAM)
12 SUB SUB  C. Wilson (76 ST)
13 SUB SUB  A. Boruc (76 GK)
14 SUB SUB  A. Surman (75 CM/CDM)
spin: fired=false hitSlot=null hit=- bulletChamber=2 stopChamber=6
this season's Transfer War verdicts (name, POS, OVR, guessed): [["K. De Bruyne","CAM",88,false]]

=== SEASON 9 ===

-- playerOne Arsenal (formation 4-2-3-1 (2)) --
 0 XI  CAM  M. Verratti (85 CM signed S7)
 1 XI  GK   T. Courtois (89 GK signed S1)
 2 XI  LM   A. Sánchez (87 LW/LM/RW)
 3 XI  RDM  Santi Cazorla (86 CAM/CM/CDM)
 4 XI  LCB  L. Koscielny (85 CB)
 5 XI  RM   A. Ramsey (84 CM/CDM/RW)
 6 XI  LDM  G. Xhaka (84 CM)
 7 XI  RCB  L. Bonucci (87 CB signed S5)
 8 XI  ST   A. Griezmann (88 ST signed S6)
 9 XI  LB   Nacho Monreal (81 LB)
10 XI  RB   J. Kimmich (80 RB signed S2)
11 SUB SUB  R. Varane (84 CB signed S3)
12 SUB SUB  P. Čech (88 GK)
13 SUB SUB  P. Aubameyang (86 ST signed S4)
14 SUB SUB  O. Giroud (83 ST)
spin: fired=false hitSlot=null hit=- bulletChamber=1 stopChamber=3
this season's Transfer War verdicts (name, POS, OVR, guessed): [["Thiago","CM",86,false]]

-- playerTwo Bournemouth (formation 4-1-4-1) --
 0 XI  RCM  K. De Bruyne (88 CAM signed S8)
 1 XI  ST   M. Gradel (79 LW/RW/ST)
 2 XI  GK   J. Oblak (86 GK signed S3)
 3 XI  CDM  Koke (85 CM signed S6)
 4 XI  LCM  S. Busquets (86 CDM signed S6)
 5 XI  RCB  M. Hummels (86 CB signed S5)
 6 XI  LCB  J. Stones (81 CB signed S1)
 7 XI  LM   J. King (72 ST/LM)
 8 XI  LB   D. Alaba (85 LB signed S4)
 9 XI  RM   M. Salah (83 RW signed S2)
10 XI  RB   A. Smith (71 RB)
11 SUB SUB  J. Wilshere (82 CM/CDM/CAM)
12 SUB SUB  C. Wilson (76 ST)
13 SUB SUB  A. Boruc (76 GK)
14 SUB SUB  A. Surman (75 CM/CDM)
spin: fired=false hitSlot=null hit=- bulletChamber=1 stopChamber=2
this season's Transfer War verdicts (name, POS, OVR, guessed): [["T. Kroos","CM",87,true]]

=== SEASON 10 ===

-- playerOne Arsenal (formation 4-2-3-1 (2)) --
 0 XI  CAM  M. Verratti (85 CM signed S7)
 1 XI  GK   T. Courtois (89 GK signed S1)
 2 XI  LM   A. Sánchez (87 LW/LM/RW)
 3 XI  RDM  Santi Cazorla (86 CAM/CM/CDM)
 4 XI  LCB  L. Koscielny (85 CB)
 5 XI  RM   A. Ramsey (84 CM/CDM/RW)
 6 XI  LDM  Thiago (86 CM signed S9)
 7 XI  RCB  L. Bonucci (87 CB signed S5)
 8 XI  ST   A. Griezmann (88 ST signed S6)
 9 XI  LB   Nacho Monreal (81 LB)
10 XI  RB   J. Kimmich (80 RB signed S2)
11 SUB SUB  R. Varane (84 CB signed S3)
12 SUB SUB  P. Čech (88 GK)
13 SUB SUB  P. Aubameyang (86 ST signed S4)
14 SUB SUB  G. Xhaka (84 CM)
spin: fired=false hitSlot=null hit=- bulletChamber=5 stopChamber=4

-- playerTwo Bournemouth (formation 4-1-4-1) --
 0 XI  RCM  K. De Bruyne (88 CAM signed S8)
 1 XI  ST   M. Gradel (79 LW/RW/ST)
 2 XI  GK   J. Oblak (86 GK signed S3)
 3 XI  CDM  Koke (85 CM signed S6)
 4 XI  LCM  S. Busquets (86 CDM signed S6)
 5 XI  RCB  M. Hummels (86 CB signed S5)
 6 XI  LCB  J. Stones (81 CB signed S1)
 7 XI  LM   J. King (72 ST/LM)
 8 XI  LB   D. Alaba (85 LB signed S4)
 9 XI  RM   M. Salah (83 RW signed S2)
10 XI  RB   A. Smith (71 RB)
11 SUB SUB  J. Wilshere (82 CM/CDM/CAM)
12 SUB SUB  C. Wilson (76 ST)
13 SUB SUB  A. Boruc (76 GK)
14 SUB SUB  A. Surman (75 CM/CDM)
spin: fired=false hitSlot=null hit=- bulletChamber=2 stopChamber=1

````

## FILE: log script (scratch, not in the repo)

````js
// Runs the real engine (js/rosterRoulette.js) through a 10-season Showdown with fixed made-up Transfer War verdicts and prints the log.
const repo=process.argv[2];const E=require(repo+"/js/rosterRoulette.js");
const rid="pair_"+"3f9a1c7e5b2d4086a1e7c3b9f05d2e68".repeat(2);
const clubs={playerOne:"Arsenal",playerTwo:"Bournemouth"};
const special={playerOne:{name:"Neymar",overall:92,number:11},playerTwo:{name:"M. Özil",overall:89,number:11}};
// Each season: [name, position, overall, release(guessed)] per manager. Mixed on purpose: better/worse signings, a keeper,
// a guessed signing, a namesake of a club player, a re-signing of an earlier signing, a position-less-looking entry.
const V={
 1:{playerOne:[["K. Mbappé","ST",75,false],["N. Kanté","CDM",87,true],["T. Courtois","GK",89,false],["W. Ben Yedder","ST",80,false]],
    playerTwo:[["Rúben Neves","CM",74,false],["J. Stones","CB",81,false],["Jorginho","CM",80,true]]},
 2:{playerOne:[["J. Kimmich","RB",80,false],["N. Kanté","CDM",87,false],["L. Sané","LW",80,false]],
    playerTwo:[["M. Salah","RW",83,false],["H. Kane","ST",84,true],["R. Lukaku","ST",84,false]]},
 3:{playerOne:[["R. Varane","CB",84,false],["Isco","CAM",84,true]],
    playerTwo:[["J. Stones","CB",81,false],["J. Oblak","GK",86,false]]},
 4:{playerOne:[["P. Aubameyang","ST",86,false]],playerTwo:[["C. Wilson","ST",70,false],["D. Alaba","LB",85,false]]},
 5:{playerOne:[["L. Bonucci","CB",87,false],["P. Pogba","CM",88,true]],playerTwo:[["M. Hummels","CB",86,false]]},
 6:{playerOne:[["A. Griezmann","ST",88,false]],playerTwo:[["Koke","CM",85,false],["S. Busquets","CDM",86,false]]},
 7:{playerOne:[["M. Verratti","CM",85,false]],playerTwo:[]},
 8:{playerOne:[],playerTwo:[["K. De Bruyne","CAM",88,false]]},
 9:{playerOne:[["Thiago","CM",86,false]],playerTwo:[["T. Kroos","CM",87,true]]},
};
const rows=(list)=>list.map(([name,position,overall,release],slot)=>({slot,name,position,overall,release}));
const history=[null];for(let k=1;k<=9;k++)history[k]={playerOne:rows(V[k].playerOne),playerTwo:rows(V[k].playerTwo)};
const fmt=b=>b.map(p=>`${String(p.slot).padStart(2)} ${p.bench?"SUB":"XI "} ${p.pos.padEnd(4)} ${p.name?`${p.name} (${p.rating}${p.positions&&p.positions.length?" "+p.positions.join("/"):""}${p.signedSeason?" signed S"+p.signedSeason:""})`:"(empty)"}`).join("\n");
for(let s=1;s<=10;s++){
  const plan=E.forSeason(rid,clubs,s,{special,history:history.slice(0,s)});
  console.log(`\n=== SEASON ${s} ===`);
  if(!plan){console.log("forSeason returned null");continue;}
  for(const role of ["playerOne","playerTwo"]){
    const t=plan.turns.find(x=>x.role===role);
    console.log(`\n-- ${role} ${clubs[role]} (formation ${plan.formations[role]}) --`);
    console.log(fmt(plan.boards[role]));
    console.log(`spin: fired=${t.fired} hitSlot=${t.hitSlot} hit=${t.player?t.player.name:"-"} bulletChamber=${t.bulletChamber} stopChamber=${t.stopChamber}`);
    if(plan.skipped[role].length)console.log("kept but kept off the board:",JSON.stringify(plan.skipped[role]));
    if(s<10)console.log("this season's Transfer War verdicts (name, POS, OVR, guessed):",JSON.stringify(V[s][role]));
  }
}

````

## FILE: js/rosterRoulette.js

````js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeRosterRoulette=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r87 Roster Russian Roulette (Nik 2026-10-28/29/30): every season, after Career Start and before the transfer window,
  // each manager spins a seven-chamber revolver (six empty, one bullet). Daniel spins first, then Nik. It fires exactly
  // when the cylinder stops on the bullet (1 in 7), and a fired shot always hits one player on that manager's board
  // (starting XI + 4 subs); he releases that player in FIFA 17. Like the Special Player draw, every result is read from
  // the Showdown's own Firebase id (64 random hex digits, the same on both phones): no read, no Rules lookup, and a refresh
  // or a second tap can never re-spin.
  // Contract v4: always a full formation XI + 4 subs, with hidden local reserves. Shots permanently
  // remove a player; kept signings, the bench and reserves replace him before the next board is returned.
  // Both managers' Special Players are excluded from both boards and both reserve pools (red team R87-C-01), and all 15
  // slots keep the same target chance.
  const RIVALRY_ID=/^pair_([0-9a-f]{64})$/;
  const ROLES=Object.freeze(["playerOne","playerTwo"]); // turn order: Daniel (Player One) first
  const CHAMBERS=7;
  const XI_SIZE=11;
  const BOARD_SIZE=15;
  const MAX_SEASONS=10;
  const OVERALL_MIN=30,OVERALL_MAX=99;
  // F2-02 (Fable job 2): the engine revision. Bump it whenever a board or a shot can come out differently for the same
  // Showdown, season and history (tests/contracts/r87-roulette-hits-contracts.cjs pins it to this file's text). It is part of
  // the version string each manager's spin mark carries (rrVersion), so two phones on different builds are told so.
  const ENGINE_REVISION=2;
  const POSITIONS=Object.freeze(["GK","SW","RWB","RB","RCB","CB","LCB","LB","LWB","RDM","CDM","LDM","RM","RCM","CM","LCM","LM","RAM","CAM","LAM","RF","CF","LF","RW","RS","ST","LS","LW","SUB"]);

  function rrSquads(){
    const data=root.CareerModeRosterSquads||(typeof module!=="undefined"&&module.exports?require("../data/rosterSquads.js"):null);
    return data&&data.squads?data:null;
  }
  function rrPlayers(){
    return root.CareerModeFifa17Players||(typeof module!=="undefined"&&module.exports?require("../data/fifa17Players.js"):null);
  }
  const rrRow=(slot,pos,name,extra)=>Object.freeze({slot,bench:slot>=XI_SIZE,pos,name,...extra});
  // The launch board as the club's FIFA 17 squad lists it: XI first (slots 0-10), then the 4 subs (slots 11-14).
  function rrBoard(club){
    const data=rrSquads(),squad=data&&Object.prototype.hasOwnProperty.call(data.squads,club)?data.squads[club]:null;
    if(!squad||!rrPlayers())return null;
    return Object.freeze([...squad.xi,...squad.subs].map(([pos,name,number,rating],i)=>rrRow(i,i<XI_SIZE?pos:"SUB",name,{number,rating,positions:rrPlayerPositions(name,club,number),special:false,signedSeason:null})));
  }
  const rrOverall=value=>Number.isInteger(value)&&value>=OVERALL_MIN&&value<=OVERALL_MAX;
  // Identity (red team R87-C-05, Sol SQ-4-01): names compare with accents folded, trimmed and lower-cased ("M. Ozil" =
  // "M. Özil"; no initials guessing). There are two kinds of people and they never match each other:
  // - a club player (a database row of the manager's own club, signedSeason null) is one person by (name, shirt number),
  //   so Alavés' two Manu García rows stay two people;
  // - a Transfer War signing (signedSeason set, no shirt number) is one person by name among that manager's signings.
  // A manager never buys his own player, so a signing who shares a name with a club player is a namesake from another
  // club (WBA's J. Ward is not Palace's J. Ward). Guessing, shooting or re-entering a signing never touches a club player.
  const rrKeys=new Map();
  function rrKey(name){
    const text=String(name||"");let key=rrKeys.get(text);
    if(key===undefined){key=text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase();if(rrKeys.size<20000)rrKeys.set(text,key);}
    return key;
  }
  const rrNumber=p=>Number.isInteger(p&&p.number)?p.number:null;
  const rrSigning=p=>Boolean(p)&&p.signedSeason!==null&&p.signedSeason!==undefined;
  // One identity string per person: "s|name" for a signing, "c|name#shirt" for a club player.
  const rrId=p=>rrSigning(p)?`s|${rrKey(p.name)}`:`c|${rrKey(p.name)}#${rrNumber(p)}`;
  const rrSame=(a,b)=>rrId(a)===rrId(b);
  // Plain code-point order: identical on every phone (localeCompare depends on the browser's ICU data).
  const rrCmp=(a,b)=>a<b?-1:a>b?1:0;
  // Equal overalls rank by a stable identity, never by the Transfer War entry slot (red team R87-C-04).
  const rrOrder=(a,b)=>b.rating-a.rating||rrCmp(rrKey(a.name),rrKey(b.name))||rrCmp(a.positions[0]||"",b.positions[0]||"")||rrCmp(a.name,b.name);
  // A 32-bit stream seeded from the id, the season and the role (xmur3 + mulberry32). Synchronous, so the screen
  // can show the result the moment the trigger is pulled; the id itself is the randomness.
  function rrStream(hex,season,role){
    const text=`rrr-v1|${hex}|${season}|${role}`;
    let h=1779033703^text.length;
    for(let i=0;i<text.length;i+=1){h=Math.imul(h^text.charCodeAt(i),3432918353);h=h<<13|h>>>19;}
    let a=(()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return (h^=h>>>16)>>>0;})();
    return ()=>{a=a+0x6D2B79F5|0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0);};
  }
  // Who can be hit: every filled slot except the Special Player, each with the same chance.
  const rrTargets=board=>board.filter(p=>p.name&&!p.special).map(p=>p.slot);
  // One manager's turn in one season. The bullet sits in one chamber, the cylinder stops on one chamber; it fires only
  // when they match (exactly 1 in 7). The animation must settle on stopChamber. A fired turn hits one target slot.
  // aimSlot is where the barrel points when it stops (red team R87-C-06): the hit slot, or for a safe turn the same
  // third draw on the same target list, so both phones aim at the same player with no extra randomness.
  function rrTurn(hex,season,role,board){
    const next=rrStream(hex,season,role);
    const bulletChamber=next()%CHAMBERS,stopChamber=next()%CHAMBERS,pick=next(),targets=rrTargets(board);
    const fired=bulletChamber===stopChamber&&targets.length>0,aimSlot=targets.length?targets[pick%targets.length]:null;
    return {role,season,bulletChamber,stopChamber,fired,hitSlot:fired?aimSlot:null,aimSlot};
  }
  // Player positions travel with the player; pos remains the formation slot even after a substitution.
  // Name ambiguity: prefer the same shirt at the manager's launch club, then the club, then catalog/source order.
  // Preserve the source's short_name.
  const byName=new Map();
  let indexed=false;
  function rrPlayerPositions(name,club,number=null){
    const database=rrPlayers();
    if(!indexed&&database){
      for(const [sourceClub,data] of Object.entries(database.clubs))for(const row of data.players){
        const key=rrKey(row[0]),matches=byName.get(key)||[];
        matches.push({club:sourceClub,number:row[4],positions:row[2]});byName.set(key,matches);
      }
      indexed=true;
    }
    const matches=byName.get(rrKey(name));
    return matches?(matches.find(p=>p.club===club&&p.number===number)||matches.find(p=>p.club===club)||matches[0]).positions:Object.freeze([]);
  }
  // A signing comes from another club, so a namesake elsewhere wins over the manager's own player.
  function rrSigningPositions(name,club){
    rrPlayerPositions(name,club);
    const matches=byName.get(rrKey(name));
    return matches?(matches.find(p=>p.club!==club)||matches[0]).positions:Object.freeze([]);
  }
  const SIGNING_POSITIONS=new Set(["GK","RB","RWB","CB","LB","LWB","CDM","CM","CAM","RM","LM","RW","LW","CF","ST"]);
  function rrLine(pos){
    if(pos==="GK")return "GK";
    if(["CB","LCB","RCB","SW"].includes(pos))return "CB";
    if(["RB","RWB"].includes(pos))return "RB";
    if(["LB","LWB"].includes(pos))return "LB";
    if(["CDM","RDM","LDM","CM","RCM","LCM","CAM","RAM","LAM"].includes(pos))return "CM";
    if(["RM","RW"].includes(pos))return "RW";
    if(["LM","LW"].includes(pos))return "LW";
    if(["ST","CF","RS","LS","RF","LF"].includes(pos))return "ST";
    return null;
  }
  // Positional fit only decides eligibility (red team R87-C-03): 1 = one of his positions is in the slot's line, 0 = not
  // (or a sub-only player with no known position). Among eligible players the overall decides.
  function rrFit(player,pos){
    const line=rrLine(pos);
    return line&&player.positions.some(position=>rrLine(position)===line)?1:0;
  }
  // Nik 2026-10-31: a club that has run out of players keeps an EMPTY slot (no name, rating 0); the roulette still runs
  // and the bullet only ever hits a filled slot (rrTargets).
  const rrEmpty=slot=>rrRow(slot.slot,slot.pos,null,{number:null,rating:0,positions:Object.freeze([]),special:false,signedSeason:null});
  const rrPlace=(slot,player)=>player?rrRow(slot.slot,slot.pos,player.name,{number:player.number??null,rating:player.rating,positions:player.positions,special:false,signedSeason:player.signedSeason??null}):rrEmpty(slot);
  const rrRank=(a,b)=>b.rating-a.rating||(a.number??100)-(b.number??100);
  const rrDatabasePlayer=p=>({name:p[0],rating:p[1],positions:p[2],number:p[4],signedSeason:null});
  const rrOnBoard=(state,player)=>state.board.some(p=>p.name&&rrSame(p,player));
  // Who may never come back: shot players, guessed signings and both Special Players. One identity set holds them all
  // (rrId), and every path that puts a player on the board, the bench or the reserves asks rrExcluded, so a blocked
  // person can never return by any route. A guessed or shot signing blocks only that signing: his club namesake stays.
  // A shot club player blocks his own row and any later signing with his name (a released player could be bought back,
  // and a shot player never returns). A Special Player blocks his own club row (every row with his name when the draw has
  // no shirt number) and any signing with his name.
  function rrExclude(state,player){
    state.excluded.add(rrId(player));
    if(!rrSigning(player))state.excluded.add(`s|${rrKey(player.name)}`);
  }
  function rrExcludeSpecial(state,sp){
    const key=rrKey(sp.name);
    state.excluded.add(`s|${key}`);
    if(rrNumber(sp)===null)state.excludedClubNames.add(key);else state.excluded.add(`c|${key}#${rrNumber(sp)}`);
  }
  function rrExcluded(state,player){
    return state.excluded.has(rrId(player))||(!rrSigning(player)&&state.excludedClubNames.has(rrKey(player.name)));
  }
  function rrReserve(state,player){
    if(rrExcluded(state,player)||rrOnBoard(state,player)||state.reserves.some(p=>rrSame(p,player)))return;
    state.reserves.push(player);
  }
  // Database replacements use bundled data only. Never resurrect a shot player or a Special Player, and never pick a
  // row already on the board or in the reserves (one person = name + shirt number).
  function rrBestDatabase(state,predicate){
    const eligible=p=>
      predicate(p)&&!rrExcluded(state,p)&&!rrOnBoard(state,p)&&!state.reserves.some(r=>rrSame(r,p));
    return rrPlayers().clubs[state.club].players.map(rrDatabasePlayer).sort(rrRank).find(eligible)||null;
  }
  function rrNextReserve(state,predicate=()=>true){
    const next=rrBestDatabase(state,predicate);
    if(next)state.reserves.push(next);
    return next;
  }
  // Every refill takes the best available club player (red team RT5 Q2): the best of the reserves (hidden three, dropped
  // starters, parked signings) and the club's unused database players, by overall then lower shirt number, the build
  // script's tie rule. A weak player in the reserves never blocks a better unused club player.
  function rrTakeReserve(state,predicate=()=>true){
    let at=-1;
    for(let i=0;i<state.reserves.length;i+=1)if(predicate(state.reserves[i])&&(at<0||rrRank(state.reserves[i],state.reserves[at])<0))at=i;
    const next=rrBestDatabase(state,predicate);
    if(next&&(at<0||rrRank(next,state.reserves[at])<0))return next;
    // Replacements stay club-only: a club with no player left gets an empty slot (null), never a revived loss or an import.
    if(at<0)return null;
    const [player]=state.reserves.splice(at,1);
    return player;
  }
  // Strict improvements retain incumbents on ties. A displaced player stays in the local squad.
  // A shot sub's place goes to a kept signing of this window; a starter a signing displaced only goes to the bench when
  // he beats the weakest remaining sub (red team RT5 Q1), otherwise he joins the reserves, and the shot sub's place is
  // refilled afterwards with the best available club player (who may be him).
  function rrBench(state,player,signing=false){
    const board=state.board,benchVacancy=state.vacant!==null&&state.vacant>=XI_SIZE;
    const fillVacancy=()=>{board[state.vacant]=rrPlace(board[state.vacant],player);state.vacant=null;return true;};
    if(signing&&benchVacancy)return fillVacancy();
    let at=-1;
    for(let i=XI_SIZE;i<BOARD_SIZE;i+=1)if(i!==state.vacant&&(at<0||board[i].rating<board[at].rating))at=i;
    if(at<0&&benchVacancy)return fillVacancy();
    if(at<0||!(player.rating>board[at].rating)){rrReserve(state,player);return false;}
    if(benchVacancy)return fillVacancy();
    const replaced=board[at];board[at]=rrPlace(replaced,player);rrReserve(state,replaced);
    return true;
  }
  // A stopgap (Sol SQ-2-01): an XI player standing in a slot outside his line because nobody fitting was left, unless
  // he is the club's own FIFA 17 launch pick for that slot (the source puts some starters out of position on purpose).
  function rrStopgap(state,i){
    const current=state.board[i];
    if(i>=XI_SIZE||!current.name||rrFit(current,current.pos))return false;
    const launch=state.launch&&state.launch[i];
    return !(launch&&launch.name&&rrSame(launch,current));
  }
  // A kept signing starts only in a slot of his line: the shot player's slot, else the weakest compatible starter when
  // he is strictly better (equal weakest: the lower board slot). Otherwise the bench rule below.
  function rrJoin(state,player){
    if(rrExcluded(state,player)||rrOnBoard(state,player))return false;
    state.reserves=state.reserves.filter(p=>!rrSame(p,player));
    let at=state.vacant!==null&&state.vacant<XI_SIZE&&rrFit(player,state.board[state.vacant].pos)>0?state.vacant:-1;
    if(at<0){
      for(let i=0;i<XI_SIZE;i+=1){
        const current=state.board[i];
        if(i===state.vacant||!rrFit(player,current.pos))continue;
        // A stopgap (an outfielder in goal, R87-E-02, or any player outside his line, Sol SQ-2-01) gives way to any
        // fitting signing.
        const stopgap=rrStopgap(state,i);
        if(!stopgap&&!(player.rating>current.rating))continue;
        if(at<0||stopgap||current.rating<state.board[at].rating)at=i;
      }
    }
    if(at<0)return rrBench(state,player,true);
    const replaced=state.board[at];state.board[at]=rrPlace(replaced,player);
    if(at===state.vacant)state.vacant=null;
    else rrBench(state,replaced);
    return true;
  }
  // Replace directly: no intermediate empty row is ever written to a board. Kept signings get first refusal, even below
  // the lost player's rating. Otherwise (red team R87-C-02) the best sub who FITS the slot moves up and the best reserve
  // refills the bench; with no fitting sub, the best fitting reserve or club database player goes straight into the slot.
  // Only when nobody left at the club fits does the best available player of the same kind (keeper / outfielder) take
  // it, and only a club that has run out entirely leaves the slot empty.
  // Only signings of the window being processed (season) get first refusal (red team R87-E-01): one from an earlier
  // window who never made the board is an ordinary reserve.
  function rrReplace(state,at,kept,season=null){
    const slot=state.board[at];
    const candidates=[...kept,...state.reserves.filter(p=>season!==null&&p.signedSeason===season)].filter(p=>
      !rrExcluded(state,p)&&!rrOnBoard(state,p)&&(slot.bench||rrFit(p,slot.pos)>0));
    candidates.sort(rrOrder);
    if(candidates.length){
      const player=candidates[0];state.board[at]=rrPlace(slot,player);
      state.reserves=state.reserves.filter(p=>!rrSame(p,player));
      return;
    }
    if(slot.bench){state.board[at]=rrPlace(slot,rrTakeReserve(state));return;}
    const keeper=slot.pos==='GK';
    const fits=p=>rrFit(p,slot.pos)>0;
    const sameKind=p=>p.positions.length>0&&(p.positions[0]==='GK')===keeper;
    const bestBench=predicate=>{
      let bench=-1;
      for(let i=XI_SIZE;i<BOARD_SIZE;i+=1){
        const player=state.board[i];
        if(!player.name||rrExcluded(state,player)||!predicate(player))continue;
        if(bench<0||rrRank(player,state.board[bench])<0)bench=i;
      }
      return bench;
    };
    const promote=bench=>{
      const player=state.board[bench],replacement=rrTakeReserve(state);// null = the bench slot stays empty
      state.board[at]=rrPlace(slot,player);state.board[bench]=rrPlace(state.board[bench],replacement);
    };
    let bench=bestBench(fits);
    if(bench>=0){promote(bench);return;}
    const direct=rrTakeReserve(state,fits);
    if(direct){state.board[at]=rrPlace(slot,direct);return;}
    bench=bestBench(sameKind);
    if(bench>=0){promote(bench);return;}
    // A club need not carry a keeper among its four subs; unknown-position signings remain bench-only.
    const last=rrTakeReserve(state,sameKind);
    if(last||!keeper){state.board[at]=rrPlace(slot,last);return;}
    // No keeper left at the club at all (red team R87-E-02, rare): the best remaining outfielder goes in goal; the slot is
    // empty only when the club has nobody left.
    bench=bestBench(p=>p.positions.length>0);
    if(bench>=0){promote(bench);return;}
    state.board[at]=rrPlace(slot,rrTakeReserve(state,p=>p.positions.length>0));
  }
  // Sol SQ-2-01: once a fitting club player or signing is available again, a stopgap hands his slot back (best fitting
  // player by the normal refill order) and returns to the bench or the reserves.
  function rrRepairStopgaps(state,season){
    for(let i=0;i<XI_SIZE;i+=1){
      if(!rrStopgap(state,i))continue;
      const slot=state.board[i],fits=p=>p.name&&!rrExcluded(state,p)&&rrFit(p,slot.pos)>0;
      let available=false;
      for(let b=XI_SIZE;b<BOARD_SIZE&&!available;b+=1)available=fits(state.board[b]);
      if(!available)available=state.reserves.some(fits)||Boolean(rrBestDatabase(state,p=>rrFit(p,slot.pos)>0));
      if(!available)continue;
      const stopgap=slot;
      rrReplace(state,i,[],season);
      rrBench(state,stopgap);
    }
  }
  // Sol SQ-2-02: a player the rival guessed must be released, so he leaves the board too (not only the reserves); his
  // slot is refilled the normal way. Runs after that season's shot, so the shot already shown never changes.
  function rrEvictExcluded(state,season){
    for(let i=0;i<BOARD_SIZE;i+=1)if(state.board[i].name&&rrExcluded(state,state.board[i]))rrReplace(state,i,[],season);
  }
  // special = {playerOne:{name, overall, number?, sourceName?}, playerTwo:{...}} from the Special Player draw, or null for
  // an older Showdown. With his shirt number only his own database row is excluded (red team R87-C-05: Empoli's other
  // Matheus Pereira stays); sourceName is his squad database name when it differs (R87-D-01: "K. Mbappe Lottin").
  // Without a number, every row with his name.
  function rrSpecial(special,role){
    const p=special&&special[role];
    if(!(p&&typeof p.name==="string"&&p.name.trim()&&rrOverall(p.overall)))return null;
    const number=rrNumber(p),names=[p.name.trim()];
    if(typeof p.sourceName==="string"&&p.sourceName.trim())names.push(p.sourceName.trim());
    return names.map(name=>({name,rating:p.overall,number}));
  }
  // Kept signings of one season for one manager: Transfer War verdict rows with a valid overall that were not released
  // by the rival's guess, best overall first; equal overalls by identity (name, then position), never by entry slot.
  function rrKept(rows,season,club){
    if(!Array.isArray(rows))return null;
    return rows.filter(r=>r&&r.release===false&&typeof r.name==="string"&&r.name.trim()&&rrOverall(r.overall))
      .map(r=>({name:r.name.trim(),rating:r.overall,positions:Object.freeze(SIGNING_POSITIONS.has(r.position)?[r.position]:rrSigningPositions(r.name.trim(),club).slice(0,1)),signedSeason:season}))
      .sort(rrOrder);
  }
  // ---------- F2-02: persisted hits and the version pin ----------
  // A spin mark (js/sparkSharedTransferChallenge.js markSpun) records that season's outcome for that manager: fired, hitName,
  // hitNumber, hitSlot and this version. The version names the engine revision and a hash of exactly the data this Showdown's
  // boards are built from (both clubs' squad rows and database rows, and both Special Players), so a data fix for another club
  // never stops a running Showdown, and any change that can move a board or a shot here does.
  function rrHash(text){let h=0x811c9dc5;for(let i=0;i<text.length;i+=1){h^=text.charCodeAt(i);h=Math.imul(h,0x01000193);}return (h>>>0).toString(16).padStart(8,"0");}
  function rrVersion(clubs,options){
    const squads=rrSquads(),players=rrPlayers();
    if(!squads||!players||!clubs)return null;
    const parts=[];
    for(const role of ROLES){
      const club=clubs[role];
      if(!Object.prototype.hasOwnProperty.call(squads.squads,club)||!players.clubs||!Object.prototype.hasOwnProperty.call(players.clubs,club))return null;
      parts.push(club,squads.squads[club],players.clubs[club]);
    }
    const special=options&&options.special;
    parts.push(ROLES.map(role=>rrSpecial(special,role)));
    return `rr${4}.${ENGINE_REVISION}.${rrHash(JSON.stringify(parts))}`;
  }
  // A persisted outcome is used only when it is whole: fired true with a name and a board slot 0-14, or fired false with none.
  // hitSignedSeason names which kind of person was shot (Sol SQ-4-01 identities): the season a signing was signed, or null for
  // a club player, so the saved player is found by the same rrId the engine uses and never his namesake of the other kind.
  function rrSavedHit(hits,season,role){
    const h=hits&&hits[season]&&hits[season][role];
    if(!h||typeof h!=="object"||typeof h.fired!=="boolean")return null;
    if(!h.fired)return {fired:false};
    if(typeof h.hitName!=="string"||!h.hitName.trim()||!Number.isInteger(h.hitSlot)||h.hitSlot<0||h.hitSlot>=BOARD_SIZE)return null;
    const signedSeason=Number.isInteger(h.hitSignedSeason)&&h.hitSignedSeason>=1&&h.hitSignedSeason<=MAX_SEASONS?h.hitSignedSeason:null;
    return {fired:true,hitName:h.hitName.trim(),hitNumber:Number.isInteger(h.hitNumber)?h.hitNumber:null,hitSlot:h.hitSlot,signedSeason};
  }
  // Where the saved shot player stands on this phone's board: his saved slot when that slot still holds him, else wherever he
  // is (a later build may have moved him), else -1 (not on this board at all: he is still out, nobody else is).
  function rrSavedAt(board,saved){
    const shot={name:saved.hitName,number:saved.hitNumber,signedSeason:saved.signedSeason};
    const row=board[saved.hitSlot];
    if(row&&row.name&&rrSame(row,shot))return {shot,at:saved.hitSlot};
    return {shot,at:board.findIndex(p=>p.name&&rrSame(p,shot))};
  }
  // This season's turn with a saved outcome as the authority. The chambers stay the seeded ones (they never depend on a board);
  // the stop chamber follows the saved result so the animation agrees with it.
  function rrSavedTurn(turn,saved,board){
    if(!saved.fired)return {...turn,fired:false,hitSlot:null,stopChamber:turn.bulletChamber===turn.stopChamber?(turn.bulletChamber+1)%CHAMBERS:turn.stopChamber,authority:"saved",shot:null};
    const {shot,at}=rrSavedAt(board,saved),slot=at>=0?at:saved.hitSlot;
    return {...turn,fired:true,hitSlot:slot,aimSlot:slot,stopChamber:turn.bulletChamber,authority:"saved",shot:at>=0?null:shot};
  }
  // The outcome a manager's spin mark records for his own turn of this plan.
  function rrOutcome(plan,role,version){
    const turn=plan&&Array.isArray(plan.turns)?plan.turns.find(item=>item.role===role):null;
    if(!turn||typeof version!=="string"||!version)return null;
    if(!turn.fired||!turn.player||!turn.player.name)return Object.freeze({fired:false,hitName:null,hitNumber:null,hitSlot:null,hitSignedSeason:null,version});
    const signed=turn.player.signedSeason;
    return Object.freeze({fired:true,hitName:String(turn.player.name).trim(),hitNumber:Number.isInteger(turn.player.number)?turn.player.number:null,hitSlot:turn.hitSlot,hitSignedSeason:Number.isInteger(signed)&&signed>=1&&signed<=MAX_SEASONS?signed:null,version});
  }
  function rrArgs(rivalryId,clubs,season){
    const match=RIVALRY_ID.exec(String(rivalryId||""));
    if(!match||!Number.isInteger(season)||season<1||season>MAX_SEASONS||!clubs)return null;
    const launch={};
    for(const role of ROLES){launch[role]=rrBoard(clubs[role]);if(!launch[role])return null;}
    return {hex:match[1],launch};
  }
  // What the screen shows for one season. clubs = {playerOne, playerTwo} club names; options.special = the Special
  // Players; options.history[k] = {playerOne:[verdict rows], playerTwo:[verdict rows]} for every season k before this
  // one (index 1..season-1). options.hits[k] = {playerOne:outcome|null, playerTwo:outcome|null}: the outcomes the spin marks
  // saved (F2-02). A saved outcome is the authority for that season and manager: the saved player is out even if this build's
  // board would have aimed elsewhere; a season or manager without one is computed as before. Returns null for a malformed id,
  // an unknown club, a season outside 1..10 or a missing season of history (the screen then shows no roulette).
  function rrForSeason(rivalryId,clubs,season,options){
    const args=rrArgs(rivalryId,clubs,season);
    if(!args)return null;
    const history=options&&options.history,special=options&&options.special,hits=options&&options.hits;
    const boards={},turns={},skipped={};
    const formations=Object.freeze(Object.fromEntries(ROLES.map(role=>[role,rrPlayers().clubs[clubs[role]].formation])));
    // The Special Player is never on any board, bench or reserve list anywhere: both managers' draws are excluded from
    // both clubs (red team R87-C-01). One in the club's launch board is skipped and the next player takes his place.
    const specials=ROLES.flatMap(role=>rrSpecial(special,role)||[]);
    for(const role of ROLES){
      const state={club:clubs[role],launch:args.launch[role],board:args.launch[role].slice(),reserves:[],vacant:null,excluded:new Set(),excludedClubNames:new Set()};
      for(const sp of specials)rrExcludeSpecial(state,sp);
      for(const [,name,number,rating] of rrSquads().squads[state.club].reserves)
        rrReserve(state,{name,number,rating,positions:rrPlayerPositions(name,state.club,number),signedSeason:null});
      for(let i=0;i<BOARD_SIZE;i+=1)if(rrExcluded(state,state.board[i]))rrReplace(state,i,[]);
      while(state.reserves.length<3&&rrNextReserve(state)){} // skip him in the hidden three too
      // F2-19 (Fable job 2): names the roulette shot, for saying why a kept signing of the same name stays off the board.
      const shotNames=new Set();skipped[role]=[];
      for(let k=1;k<season;k+=1){
        const allKept=rrKept(history&&history[k]&&history[k][role],k,state.club);
        if(!allKept)return null;
        const turn=rrTurn(args.hex,k,role,state.board);
        // A guessed signing must not sneak in later through the club database refill. Applied after this season's turn
        // was drawn (the board it aimed at is the one the screen showed); a guessed player already on the board is
        // evicted below (Sol SQ-2-02).
        for(const row of history[k][role])if(row&&row.release===true&&typeof row.name==='string'&&row.name.trim())rrExclude(state,{name:row.name.trim(),number:null,signedSeason:k});
        state.reserves=state.reserves.filter(p=>!rrExcluded(state,p));
        // Sol SQ-2-03: a player this manager already signed in an earlier window is not a new signing when entered again;
        // he keeps his first window and his place (board or reserves).
        const kept=allKept.filter(p=>!state.reserves.some(r=>r.signedSeason!==null&&rrSame(r,p)));
        const saved=rrSavedHit(hits,k,role);
        let shot=null,at=-1;
        if(saved){if(saved.fired)({shot,at}=rrSavedAt(state.board,saved));}
        else if(turn.fired){shot=state.board[turn.hitSlot];at=turn.hitSlot;}
        if(shot){
          shotNames.add(rrKey(shot.name));
          rrExclude(state,at>=0?state.board[at]:shot);
          // Keep the old row until it can be overwritten directly. Vacancy metadata lets
          // R87-2's XI/bench signing placement run first without ever writing a blank row.
          if(at>=0)state.vacant=at;
        }
        // F2-19: a kept signing the rules keep off (signings are known by name only, so his name is one the roulette shot, a
        // Special Player's, or a guessed and released signing's) is listed for the season right after his window, with why.
        if(k===season-1)for(const player of kept)if(rrExcluded(state,player)){
          const key=rrKey(player.name);
          skipped[role].push(Object.freeze({name:player.name,season:k,reason:specials.some(sp=>rrKey(sp.name)===key)?"special":shotNames.has(key)?"shot":"guessed"}));
        }
        for(const player of kept)rrJoin(state,player);
        if(state.vacant!==null){rrReplace(state,state.vacant,[],k);state.vacant=null;}
        rrEvictExcluded(state,k);
        rrRepairStopgaps(state,k);
      }
      const board=state.board;
      boards[role]=Object.freeze(board);skipped[role]=Object.freeze(skipped[role]);
      const turn=rrTurn(args.hex,season,role,board),saved=rrSavedHit(hits,season,role);
      turns[role]=saved?rrSavedTurn(turn,saved,board):{...turn,authority:"computed",shot:null};
    }
    const order=ROLES.map(role=>{
      const {shot,...turn}=turns[role],board=boards[role];
      const player=turn.hitSlot===null?null:shot?rrRow(turn.hitSlot,board[turn.hitSlot].pos,shot.name,{number:shot.number,rating:0,positions:Object.freeze([]),special:false,signedSeason:shot.signedSeason}):board[turn.hitSlot];
      return Object.freeze({...turn,player});
    });
    return Object.freeze({contractVersion:4,season,chambers:CHAMBERS,order:ROLES,formations,boards:Object.freeze(boards),turns:Object.freeze(order),skipped:Object.freeze(skipped)});
  }

  return Object.freeze({contractVersion:4,feature:"cms-roster-russian-roulette",chambers:CHAMBERS,boardSize:BOARD_SIZE,xiSize:XI_SIZE,overallMin:OVERALL_MIN,overallMax:OVERALL_MAX,positions:POSITIONS,roles:ROLES,engineRevision:ENGINE_REVISION,board:rrBoard,forSeason:rrForSeason,version:rrVersion,outcome:rrOutcome});
});

````

## FILE: data/rosterSquads.js

````js
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeRosterSquads=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  // Generated by scripts/build-fifa17-rosters.py; do not edit rows by hand.
  // SoFIFA FIFA 17 launch roster 170002, players_17.csv: https://raw.githubusercontent.com/ifrankandrade/data-visualization/main/datasets/players_17.csv
  // XI/subs retain R87-2's selection and source-order ties. Hidden reserves are the next 3
  // highest-rated distinct non-starters, ties by lower shirt number. Rows: [position, name, shirt, overall].
  const squads={
    "Arsenal":{"xi":[["CAM","M. Özil",11,89],["GK","P. Čech",33,88],["LM","A. Sánchez",7,87],["RDM","Santi Cazorla",19,86],["LCB","L. Koscielny",6,85],["RM","A. Ramsey",8,84],["LDM","G. Xhaka",29,84],["RCB","S. Mustafi",20,83],["ST","O. Giroud",12,83],["LB","Nacho Monreal",18,81],["RB","Héctor Bellerín",24,79]],"subs":[["CB","P. Mertesacker",4,83],["CDM","F. Coquelin",34,81],["LM","T. Walcott",14,81],["ST","Lucas Pérez",9,81]],"reserves":[["RB","M. Debuchy",2,80],["LB","K. Gibbs",3,80],["ST","D. Welbeck",23,80]]},
    "Bournemouth":{"xi":[["RCM","J. Wilshere",32,82],["ST","C. Wilson",13,76],["GK","A. Boruc",1,76],["CDM","A. Surman",6,75],["LCM","H. Arter",8,74],["RCB","S. Francis",2,73],["LCB","S. Cook",3,72],["LM","J. King",17,72],["LB","C. Daniels",11,72],["RM","J. Ibe",33,71],["RB","A. Smith",15,71]],"subs":[["LW","M. Gradel",10,79],["ST","B. Afobe",9,74],["CB","M. Wilson",20,74],["GK","A. Federici",23,73]],"reserves":[["CM","D. Gosling",4,72],["LB","N. Aké",5,72],["LM","M. Pugh",7,72]]},
    "Burnley":{"xi":[["LCM","S. Defour",16,79],["GK","T. Heaton",1,76],["RCB","M. Keane",5,75],["RS","A. Gray",7,75],["RB","M. Lowton",2,75],["LCB","B. Mee",6,74],["LS","S. Vokes",9,73],["LB","S. Ward",23,72],["LM","S. Arfield",37,72],["RCM","D. Marney",8,71],["RM","G. Boyd",21,71]],"subs":[["RB","J. Flanagan",4,73],["CM","J. Hendrick",13,72],["RM","J. Gudmundsson",25,72],["ST","P. Bamford",15,71]],"reserves":[["ST","A. Barnes",10,71],["CB","J. Tarkowski",26,71],["LM","M. Kightly",11,70]]},
    "Chelsea":{"xi":[["GK","T. Courtois",13,89],["LW","E. Hazard",10,88],["RCM","Cesc Fàbregas",4,86],["ST","Diego Costa",19,85],["RW","Willian",22,85],["LCB","J. Terry",26,84],["LB","Azpilicueta",28,84],["LCM","N. Matić",21,84],["RCB","G. Cahill",24,83],["CDM","N. Kanté",7,81],["RB","B. Ivanović",2,80]],"subs":[["CB","David Luiz",30,84],["CAM","Oscar",8,83],["GK","A. Begović",1,83],["LM","Pedro",11,83]],"reserves":[["ST","M. Batshuayi",23,81],["CB","K. Zouma",5,80],["CDM","J. Mikel",12,78]]},
    "Crystal Palace":{"xi":[["GK","S. Mandanda",30,85],["ST","C. Benteke",17,81],["RDM","Y. Cabaye",7,81],["LM","W. Zaha",11,79],["LCB","S. Dann",6,79],["RM","A. Townsend",10,78],["LDM","J. McArthur",18,77],["RB","J. Ward",2,76],["LB","P. Souaré",23,76],["CAM","J. Puncheon",42,76],["RCB","J. Tomkins",5,76]],"subs":[["ST","L. Rémy",8,81],["CDM","M. Flamini",4,77],["CM","J. Ledley",16,75],["GK","W. Hennessey",13,75]],"reserves":[["LM","B. Sako",26,75],["ST","C. Wickham",21,74],["CB","D. Delaney",27,74]]},
    "Everton":{"xi":[["ST","R. Lukaku",10,84],["LB","L. Baines",3,83],["LCB","A. Williams",5,83],["RB","S. Coleman",23,82],["RCB","P. Jagielka",6,82],["CAM","R. Barkley",8,81],["RM","K. Mirallas",11,81],["LDM","G. Barry",18,80],["LM","Y. Bolasie",14,78],["RDM","I. Gueye",17,76],["GK","M. Stekelenburg",22,76]],"subs":[["RM","Deulofeu",7,81],["CDM","J. McCarthy",16,81],["RM","A. Lennon",12,78],["CM","T. Cleverley",15,78]],"reserves":[["CM","D. Gibson",4,77],["CB","R. Funes Mori",25,77],["ST","O. Niasse",29,77]]},
    "Hull City":{"xi":[["LCB","C. Davies",6,77],["ST","A. Hernández",9,76],["GK","D. Marshall",23,76],["LB","A. Robertson",3,75],["RCB","J. Livermore",14,75],["RCM","T. Huddlestone",8,75],["RM","R. Snodgrass",10,75],["RB","A. Elmohamady",27,75],["LCM","D. Meyler",7,72],["LM","A. Diomande",20,72],["CDM","S. Clucas",11,68]],"subs":[["ST","D. Mbokani",18,79],["CB","M. Dawson",21,77],["CAM","M. Henriksen",22,76],["CDM","R. Mason",25,75]],"reserves":[["GK","A. McGregor",1,75],["CAM","S. Maloney",15,74],["GK","D. Kuciak",12,73]]},
    "Leicester City":{"xi":[["RM","R. Mahrez",26,85],["LS","J. Vardy",9,82],["GK","K. Schmeichel",1,81],["RCM","D. Drinkwater",4,80],["LCB","R. Huth",6,80],["RCB","W. Morgan",5,79],["LCM","N. Mendy",24,78],["LB","C. Fuchs",28,77],["RS","S. Okazaki",20,77],["LM","M. Albrighton",11,76],["RB","D. Simpson",17,74]],"subs":[["ST","I. Slimani",19,83],["GK","R. Zieler",21,81],["ST","A. Musa",7,78],["CB","Luís Hernández",2,78]],"reserves":[["CDM","D. Amartey",13,75],["CB","Y. Benalouane",29,75],["ST","L. Ulloa",23,74]]},
    "Liverpool":{"xi":[["LW","Coutinho",10,85],["ST","Roberto Firmino",11,82],["LCB","D. Lovren",6,82],["RCB","J. Matip",32,82],["RB","N. Clyne",2,81],["LCM","G. Wijnaldum",5,81],["CDM","J. Henderson",14,81],["LB","J. Milner",7,81],["RCM","A. Lallana",20,81],["RW","S. Mané",19,79],["GK","S. Mignolet",22,78]],"subs":[["ST","D. Sturridge",15,84],["GK","L. Karius",1,82],["CB","M. Sakho",3,82],["CM","E. Can",23,80]],"reserves":[["CDM","Lucas Leiva",21,80],["CB","R. Klavan",17,79],["ST","D. Origi",27,78]]},
    "Manchester City":{"xi":[["ST","S. Agüero",10,89],["RCM","K. De Bruyne",17,88],["LCM","David Silva",21,87],["GK","C. Bravo",1,85],["LCB","N. Otamendi",30,85],["LW","Nolito",9,83],["RW","R. Sterling",7,82],["RB","B. Sagna",3,82],["CDM","Fernandinho",25,81],["LB","G. Clichy",22,80],["RCB","J. Stones",24,78]],"subs":[["CB","V. Kompany",4,86],["CM","I. Gündoğan",8,85],["CM","Y. Touré",42,84],["RB","P. Zabaleta",5,82]],"reserves":[["RM","Jesús Navas",15,80],["CDM","Fernando",6,79],["LB","A. Kolarov",11,79]]},
    "Manchester United":{"xi":[["GK","De Gea",1,90],["ST","Z. Ibrahimović",9,90],["LDM","P. Pogba",6,88],["CAM","W. Rooney",10,84],["RM","A. Martial",11,82],["RCB","E. Bailly",3,82],["LB","L. Shaw",23,81],["LCB","D. Blind",17,81],["RB","A. Valencia",25,80],["RDM","M. Fellaini",27,78],["LM","M. Rashford",19,76]],"subs":[["RM","H. Mkhitaryan",22,85],["CB","C. Smalling",12,84],["CAM","Juan Mata",8,84],["CM","B. Schweinsteiger",31,83]],"reserves":[["CM","Ander Herrera",21,82],["CDM","M. Schneiderlin",28,82],["CDM","M. Carrick",16,81]]},
    "Middlesbrough":{"xi":[["GK","Victor Valdés",26,82],["ST","Negredo",10,80],["CAM","G. Ramírez",21,78],["LM","S. Downing",19,75],["RCB","Daniel Ayala",4,74],["LDM","A. Clayton",8,73],["LB","G. Friend",3,73],["RB","Nsue",24,72],["RM","C. Stuani",18,72],["RDM","G. Leadbitter",7,71],["LCB","B. Gibson",6,70]],"subs":[["CDM","M. de Roon",14,78],["CB","B. Espinosa",5,78],["GK","B. Guzan",12,75],["RB","Barragán",17,75]],"reserves":[["LB","Fábio",2,74],["ST","J. Rhodes",9,74],["LW","V. Fischer",11,74]]},
    "Southampton":{"xi":[["RCB","José Fonte",6,83],["LCB","V. van Dijk",17,79],["LB","R. Bertrand",21,79],["CAM","D. Tadić",11,79],["GK","F. Forster",1,78],["LCM","S. Davis",8,77],["RS","S. Long",7,77],["LS","N. Redmond",22,75],["RB","J. Pied",26,75],["RCM","P. Højbjerg",23,74],["CDM","Oriol Romeu",14,74]],"subs":[["LW","S. Boufal",19,80],["RB","Cédric",2,78],["CDM","J. Clasie",4,78],["ST","C. Austin",10,78]],"reserves":[["LM","J. Rodriguez",9,77],["GK","A. McCarthy",13,76],["CM","J. Ward-Prowse",16,76]]},
    "Stoke City":{"xi":[["GK","J. Butland",1,82],["RM","X. Shaqiri",22,82],["LM","M. Arnautović",10,82],["ST","W. Bony",12,81],["RCB","R. Shawcross",17,81],["LCM","G. Imbula",21,79],["LCB","B. Martins Indi",15,78],["RCM","J. Allen",4,77],["CDM","G. Whelan",6,77],["LB","E. Pieters",3,76],["RB","P. Bardsley",2,73]],"subs":[["CAM","Bojan",27,82],["CAM","I. Afellay",14,79],["ST","M. Diouf",18,78],["RB","G. Johnson",8,77]],"reserves":[["CB","G. Cameron",20,77],["CB","Marc Muniesa",5,76],["CAM","S. Ireland",7,76]]},
    "Sunderland":{"xi":[["ST","J. Defoe",18,80],["LCB","P. Djilobodji",5,78],["RCM","L. Cattermole",6,78],["RB","Manquillo",21,77],["CDM","J. Kirchhoff",27,77],["LM","A. Januzaj",44,76],["LCM","J. Rodwell",8,76],["RM","F. Borini",9,76],["RCB","L. Koné",23,76],["LB","P. van Aanholt",3,75],["GK","V. Mannone",1,75]],"subs":[["LM","W. Khazri",10,79],["LM","S. Pienaar",20,77],["CB","J. O'Shea",16,75],["CM","S. Larsson",7,75]],"reserves":[["CB","J. Denayer",4,74],["CM","D. Ndong",17,74],["ST","V. Anichebe",24,74]]},
    "Swansea City":{"xi":[["CAM","G. Sigurðsson",23,82],["GK","L. Fabiański",1,80],["ST","Llorente",9,79],["LCB","F. Fernández",33,79],["RDM","J. Cork",24,78],["LDM","L. Britton",7,77],["RCB","Jordi Amat",2,76],["LM","W. Routledge",15,76],["RB","Àngel Rangel",22,76],["RM","M. Barrow",17,75],["LB","N. Taylor",3,75]],"subs":[["ST","Borja Bastón",10,80],["LM","J. Montero",20,79],["CM","Ki Sung Yueng",4,78],["RM","N. Dyer",12,77]],"reserves":[["CAM","L. Fer",8,76],["CB","M. van der Hoorn",5,75],["RB","K. Naughton",26,75]]},
    "Tottenham Hotspur":{"xi":[["GK","H. Lloris",1,88],["RCB","T. Alderweireld",4,85],["ST","H. Kane",10,84],["LM","C. Eriksen",23,84],["LCB","J. Vertonghen",5,83],["LDM","M. Dembélé",19,82],["RM","E. Lamela",11,81],["RB","K. Walker",2,81],["CAM","D. Alli",20,80],["LB","D. Rose",3,80],["RDM","E. Dier",15,78]],"subs":[["GK","M. Vorm",13,80],["RM","M. Sissoko",17,80],["CB","K. Wimmer",27,79],["ST","V. Janssen",9,78]],"reserves":[["LM","H. Son",7,78],["CDM","V. Wanyama",12,78],["LM","G. Nkoudou",14,78]]},
    "Watford":{"xi":[["RCM","R. Pereyra",37,81],["RS","O. Ighalo",24,78],["GK","Gomes",1,78],["LCM","E. Capoue",29,78],["RWB","D. Janmaat",22,77],["CB","Y. Kaboul",4,77],["LS","T. Deeney",9,76],["LCB","M. Britos",3,75],["RCB","C. Cathcart",15,73],["CM","B. Watson",23,73],["LWB","J. Zúñiga",18,73]],"subs":[["CAM","N. Amrabat",7,79],["CM","A. Doucouré",16,78],["RB","B. Dja Djédjé",26,77],["ST","S. Okaka",33,77]],"reserves":[["CB","S. Prödl",5,77],["CDM","V. Behrami",11,77],["LB","J. Holebas",25,77]]},
    "West Bromwich Albion":{"xi":[["ST","S. Rondón",9,80],["GK","B. Foster",1,80],["RCM","C. Yacob",5,80],["LB","J. Evans",6,79],["LM","N. Chadli",22,78],["CF","S. Berahino",18,77],["LCB","J. Olsson",3,76],["RCB","G. McAuley",23,76],["LCM","D. Fletcher",24,76],["RM","M. Phillips",10,74],["RB","C. Dawson",25,67]],"subs":[["RB","A. Nyom",2,78],["CM","C. Gardner",8,76],["CM","J. Morrison",7,75],["LM","J. McClean",14,74]],"reserves":[["GK","B. Myhill",13,73],["RW","C. McManaman",19,73],["LB","C. Brunt",11,69]]},
    "West Ham United":{"xi":[["LM","D. Payet",27,86],["ST","S. Zaza",11,80],["LCB","W. Reid",2,80],["GK","Adrián",13,80],["CAM","M. Lanzini",10,79],["RDM","M. Noble",16,78],["LDM","C. Kouyaté",8,77],["RM","M. Antonio",30,76],["RCB","J. Collins",19,76],["LB","A. Masuaku",26,75],["RB","S. Byram",22,73]],"subs":[["CB","A. Ogbonna",21,80],["RW","S. Feghouli",7,80],["RM","A. Ayew",20,80],["RM","G. Töre",17,79]],"reserves":[["CDM","H. Nordtveit",4,78],["ST","A. Carroll",9,78],["ST","J. Calleri",28,77]]},
    "Alavés":{"xi":[["RDM","D. Torres",16,77],["GK","Pacheco",1,76],["ST","Deyverson",20,76],["LCB","Laguardia",5,76],["LM","Ibai Gómez",11,75],["RCB","Alexis",4,75],["LB","Raul García",3,74],["LDM","Manu García",19,74],["RB","Kiko Femenía",21,73],["CAM","N. Krstičić",23,73],["RM","Edgar Méndez",17,71]],"subs":[["CB","Z. Feddal",24,77],["CM","Camarasa",8,76],["CF","A. Katai",25,74],["CB","A. Pantic",2,74]],"reserves":[["CM","Marcos Llorente",6,73],["ST","C. Santos",9,73],["RM","C. Espinoza",14,73]]},
    "Athletic Club":{"xi":[["LCB","A. Laporte",4,84],["ST","Aduriz",20,84],["LCM","Beñat",7,82],["RCM","Mikel San José",6,81],["RB","De Marcos",18,81],["CAM","Raúl García",22,81],["RW","Williams",11,80],["GK","Iraizoz",1,79],["LB","Balenziaga",24,79],["LW","Susaeta",14,78],["RCB","Bóveda",2,77]],"subs":[["CDM","Iturraspe",8,81],["CB","Etxeita",16,80],["LW","Muniain",10,78],["CM","Mikel Rico",17,77]],"reserves":[["GK","Herrerín",13,76],["CB","Elustondo",3,75],["CAM","Eraso",5,74]]},
    "Atlético Madrid":{"xi":[["LS","A. Griezmann",7,88],["LCB","D. Godín",2,88],["GK","J. Oblak",13,87],["LB","Filipe Luís",3,85],["LM","Koke",6,84],["RB","Juanfran",20,83],["RS","K. Gameiro",21,83],["RCB","S. Savić",15,82],["RCM","Gabi",14,82],["LCM","Tiago",5,81],["RM","Saúl",8,80]],"subs":[["LM","N. Gaitán",23,85],["CB","J. Giménez",24,83],["LM","Y. Carrasco",10,82],["ST","Fernando Torres",9,81]],"reserves":[["GK","Moyá",1,81],["CM","A. Fernández",12,81],["ST","A. Correa",11,79]]},
    "Barcelona":{"xi":[["RW","L. Messi",10,93],["LW","Neymar",11,92],["ST","L. Suárez",9,92],["LCM","Iniesta",8,88],["CDM","Sergio Busquets",5,87],["RCM","I. Rakitić",4,87],["LB","Jordi Alba",18,86],["RCB","Piqué",3,86],["LCB","J. Mascherano",14,85],["GK","M. ter Stegen",1,83],["RB","Sergi Roberto",20,79]],"subs":[["CM","André Gomes",21,84],["CM","A. Turan",7,84],["CB","S. Umtiti",23,82],["ST","Paco Alcácer",17,81]],"reserves":[["GK","J. Cillessen",13,81],["CB","J. Mathieu",24,81],["LM","Denis Suárez",6,80]]},
    "Celta Vigo":{"xi":[["CAM","F. Orellana",14,81],["RW","Iago Aspas",10,81],["RB","Hugo Mallo",2,80],["RCM","D. Wass",18,80],["RCB","G. Cabral",22,80],["LCM","M. Díaz",5,80],["LB","Jonny",19,77],["GK","Sergio",1,77],["LCB","F. Roncaglia",24,77],["LW","T. Bongonda",7,76],["ST","J. Guidetti",9,76]],"subs":[["CM","P. Hernández",8,80],["ST","G. Rossi",25,79],["CDM","N. Radoja",6,78],["CB","Fontàs",3,78]],"reserves":[["CB","Sergi Gómez",20,77],["LM","Naranjo",17,75],["LB","Carles Planas",21,75]]},
    "Deportivo La Coruña":{"xi":[["LCB","Sidnei",12,80],["LDM","Mosquera",5,79],["RB","Juanfran",2,78],["LS","F. Andone",10,77],["RCB","Albentosa",6,77],["GK","G. Lux",1,77],["LM","F. Fajr",19,77],["RM","Bruno Gama",21,76],["RDM","Guilherme",20,75],["LB","Luisinho",16,75],["RS","M. Moreno",9,72]],"subs":[["RM","Carles Gil",11,77],["CAM","E. Çolak",8,77],["CM","C. Borges",22,77],["ST","Joselu",7,76]],"reserves":[["CB","Arribas",14,76],["LM","R. Babel",18,76],["LB","Fernando Navarro",3,75]]},
    "Eibar":{"xi":[["RDM","G. Escalante",5,78],["ST","Sergi Enrich",9,77],["RCB","M. Dos Santos",15,77],["LDM","Dani García",14,77],["RM","Pedro León",21,77],["RB","Capa",7,76],["LCB","Iván Ramis",4,76],["LB","David Juncà",23,75],["CAM","Adrián González",24,75],["LM","T. Inui",8,75],["GK","Riesgo",13,74]],"subs":[["CB","F. Lejeune",20,76],["LM","Bebé",25,76],["CB","Gálvez",3,75],["CDM","Fran Rico",16,75]],"reserves":[["RW","Rubén Peña",11,74],["RM","Jota",10,73],["ST","Kike",17,73]]},
    "Espanyol":{"xi":[["GK","Diego López",13,81],["ST","Leo Baptistao",11,79],["LCB","M. Demichelis",2,79],["LDM","Javi Fuego",18,79],["LM","Reyes",9,78],["CAM","Jurado",14,78],["RDM","P. Diop",20,78],["RM","H. Pérez",17,78],["RCB","David López",15,77],["RB","Javi López",16,77],["LB","Victor Sánchez",4,76]],"subs":[["GK","Roberto",1,80],["CB","D. Reyes",23,78],["ST","F. Caicedo",10,78],["LM","P. Piatti",19,78]],"reserves":[["ST","Gerard Moreno",7,77],["CB","O. Duarte",6,76],["LM","Víctor Álvarez",5,74]]},
    "Granada":{"xi":[["GK","G. Ochoa",13,80],["LW","M. Carcela-Gonzalez",16,78],["LCB","Rúben Vezo",17,77],["LB","F. Tabanou",14,77],["RB","Tito",2,76],["CAM","Bueno",23,76],["RCB","Lombán",6,75],["LCM","Sergi Samper",4,74],["RCM","R. Krhin",21,74],["RW","O. Atzili",15,73],["ST","E. Ponce",9,72]],"subs":[["CM","Javi Márquez",8,74],["CAM","Andreas Pereira",18,73],["CAM","J. Boga",10,73],["LM","Gabriel Silva",12,73]],"reserves":[["ST","David Barral",7,73],["RW","Isaac Cuenca",19,73],["LB","G. Silva",3,72]]},
    "Las Palmas":{"xi":[["LM","Jonathan Viera",21,80],["RDM","Roque Mesa",15,79],["CAM","K. Boateng",7,79],["GK","Javi Varas",13,78],["LDM","Vicente Gómez",4,78],["LCB","Bigas",17,77],["RM","N. El Zhar",8,77],["RB","Michel Macedo",12,76],["RCB","David García",5,76],["ST","M. Livaja",9,75],["LB","Dani Castellano",23,74]],"subs":[["CB","M. Lemos",3,80],["CAM","Tana",24,76],["RB","David Simón",2,76],["CB","Aythami Artiles",16,76]],"reserves":[["ST","S. Araujo",10,75],["CDM","Javi Castellano",18,73],["LM","Momo",11,72]]},
    "Leganés":{"xi":[["RDM","Rubén Pérez",21,77],["LM","A. Szymanowski",11,77],["LCB","Insua",18,76],["CAM","Gabriel",8,76],["GK","Serantes",13,76],["LDM","Timor",24,75],["RCB","M. Mantovani",5,75],["LB","Marín",4,73],["RB","Víctor Díaz",17,73],["RM","Unai López",19,72],["ST","Guerrero",9,72]],"subs":[["LB","Diego Rico",15,75],["CB","C. Medjani",12,75],["ST","Luciano",20,74],["RM","Omar Ramos",23,74]],"reserves":[["LW","D. Machís",7,73],["RM","Robert Ibáñez",16,72],["CM","Sastre",22,71]]},
    "Málaga":{"xi":[["RDM","Camacho",6,81],["RM","Keko",20,80],["GK","C. Kameni",1,80],["LCB","Weligton",3,79],["RCB","Diego Llorente",5,78],["LDM","Recio",14,78],["LM","Jony",21,78],["ST","Charles",9,78],["RB","R. Rosales",18,77],["CAM","J. Añor",10,76],["LB","F. Ricca",15,75]],"subs":[["GK","D. Boyko",13,78],["CM","Pablo Fornals",31,76],["CM","Z. Kuzmanović",22,76],["CB","B. Koné",2,76]],"reserves":[["LW","G. Castro",11,75],["LB","Miguel Torres",23,75],["ST","Sandro",19,74]]},
    "Osasuna":{"xi":[["LS","Sergio León",7,76],["LCM","Roberto Torres",10,76],["CB","Miguel Flaño",4,75],["LCB","David García",5,74],["RCM","De las Cuevas",20,74],["RWB","Oier",6,74],["RS","Oriol Riera",9,73],["GK","Nauzet",13,73],["CM","Fausto",14,72],["RCB","Unai Garcia",15,71],["LWB","Javi Flaño",2,70]],"subs":[["CM","Fran Mérida",18,75],["CDM","D. Digard",23,74],["CM","G. Čaušić",8,72],["CB","Tano Bonnin",3,72]],"reserves":[["LB","Fuentes",16,72],["LM","Alex Berenguer",11,71],["ST","E. Rivière",12,71]]},
    "Real Betis":{"xi":[["LS","Rubén Castro",24,81],["GK","Adán",13,80],["RS","A. Sanabria",9,78],["RCB","A. Mandi",23,78],["RCM","Petros",5,78],["RM","Joaquín",17,78],["LM","C. Musonda",7,77],["LCB","G. Pezzella",20,77],["RB","C. Piccini",12,76],["LCM","F. Gutiérrez",6,75],["LB","R. Durmisi",14,69]],"subs":[["CB","Bruno",4,79],["CAM","Dani Ceballos",10,77],["ST","R. Zozulya",18,76],["CM","J. Martin",8,76]],"reserves":[["RM","Cejudo",16,76],["RM","N. Leiva",11,74],["CDM","R. Donk",15,74]]},
    "Real Madrid":{"xi":[["LW","Cristiano Ronaldo",7,94],["RW","G. Bale",11,90],["LCB","Sergio Ramos",4,89],["RCM","L. Modrić",19,89],["LCM","T. Kroos",8,88],["RCB","Pepe",3,88],["CAM","J. Rodríguez",10,87],["ST","K. Benzema",9,87],["LB","Marcelo",12,86],["GK","K. Navas",1,85],["RB","Carvajal",2,83]],"subs":[["CB","R. Varane",5,84],["CAM","Isco",22,84],["CDM","Casemiro",14,82],["ST","Morata",21,82]],"reserves":[["RM","Lucas Vázquez",17,81],["CAM","Marco Asensio",20,81],["LB","Fábio Coentrão",15,80]]},
    "Real Sociedad":{"xi":[["GK","G. Rulli",1,82],["LCB","Iñigo Martínez",6,81],["CAM","C. Vela",11,81],["RCM","Illarramendi",4,79],["ST","Willian José",12,78],["RW","Xabi Prieto",10,78],["LW","Oyarzabal",18,77],["LCM","Rubén Pardo",14,77],["LB","Yuri",19,77],["RCB","Mikel Gonzalez",3,76],["RB","Zaldúa",20,73]],"subs":[["CAM","Canales",16,79],["ST","Agirretxe",9,79],["CM","Zurutuza",17,78],["RB","Aritz Elustondo",15,76]],"reserves":[["CDM","Markel Bergara",5,76],["CM","Granero",8,76],["CAM","Juanmi",7,75]]},
    "Sevilla":{"xi":[["LDM","S. N'Zonzi",15,82],["LM","S. Nasri",10,82],["CB","A. Rami",23,82],["RDM","Iborra",8,82],["LCB","T. Kolodziejczak",5,80],["GK","Sergio Rico",1,80],["RS","W. Ben Yedder",12,80],["LS","L. Vietto",9,79],["CAM","H. Kiyotake",14,79],["RM","Pablo Sarabia",17,78],["RCB","N. Pareja",21,77]],"subs":[["RM","Vitolo",20,82],["CM","M. Krohn-Dehli",7,82],["GK","S. Sirigu",25,82],["CAM","F. Vázquez",22,82]],"reserves":[["LB","B. Trémoulinas",2,81],["CB","Daniel Carriço",6,81],["CAM","Ganso",19,81]]},
    "Sporting Gijón":{"xi":[["GK","Iván Cuéllar",1,78],["LDM","Sergio Álvarez",6,77],["CAM","Víctor Rodríguez",7,77],["RB","Lora",11,77],["RCB","Jorge Meré",4,76],["ST","D. Čop",24,75],["LCB","F. Amorebieta",5,75],["LM","Burgui",14,74],["LB","Isma López",18,74],["RDM","Nacho Cases",10,74],["RM","Douglas",2,73]],"subs":[["CB","J. Babin",3,75],["RM","Moi Gómez",23,74],["GK","Diego Mariño",13,74],["CDM","Xavi Torres",21,74]],"reserves":[["ST","Castro",9,73],["RB","Lillo",16,73],["RM","Carmona",19,73]]},
    "Valencia":{"xi":[["RCB","E. Garay",24,84],["LW","Nani",17,83],["GK","Diego Alves",1,83],["RCM","Parejo",10,82],["LB","Gayà",14,80],["LCB","E. Mangala",5,80],["RB","João Cancelo",2,79],["CM","Mario Suárez",7,79],["ST","Rodrigo",19,78],["LCM","E. Pérez",8,78],["RW","Santi Mina",22,76]],"subs":[["CB","A. Abdennour",23,80],["GK","M. Ryan",25,79],["RB","Montoya",21,79],["LB","Siqueira",6,78]],"reserves":[["CB","Aderllan Santos",4,77],["RM","F. Cartabia",16,77],["CM","Medrán",20,77]]},
    "Villarreal":{"xi":[["RCB","M. Musacchio",5,83],["LCM","Bruno",21,83],["GK","Sergio Asenjo",1,81],["LCB","Víctor Ruíz",6,81],["RCM","Manu Trigueros",14,80],["RB","Mario Gaspar",2,80],["RM","J. dos Santos",8,80],["LS","Alexandre Pato",10,80],["LM","R. Soriano",20,79],["LB","Jaume Costa",11,79],["RS","N. Sansone",18,78]],"subs":[["ST","C. Bakambu",17,81],["LM","Samu Castillejo",19,80],["ST","Soldado",9,80],["LM","D. Cheryshev",7,79]],"reserves":[["CDM","A. N'Diaye",4,79],["CB","Álvaro",12,77],["RB","A. Rukavina",22,77]]},
    "Bayern Munich":{"xi":[["GK","M. Neuer",1,92],["RCB","J. Boateng",17,90],["ST","R. Lewandowski",9,90],["RB","P. Lahm",21,88],["LB","D. Alaba",27,87],["RW","T. Müller",25,87],["LCB","M. Hummels",5,87],["RCM","A. Vidal",23,87],["LW","F. Ribéry",7,86],["LCM","Thiago",6,84],["CDM","Xabi Alonso",14,84]],"subs":[["RM","A. Robben",10,87],["CB","Javi Martinez",8,84],["LM","Douglas Costa",11,84],["LW","K. Coman",29,81]],"reserves":[["LB","Bernat",18,79],["CB","H. Badstuber",28,79],["RB","Rafinha",13,78]]},
    "Borussia Dortmund":{"xi":[["LM","M. Reus",11,88],["ST","P. Aubameyang",17,86],["CAM","M. Götze",10,84],["LCB","Sokratis",25,84],["RDM","G. Castro",27,82],["RB","L. Piszczek",26,82],["GK","R. Bürki",38,81],["RCB","Marc Bartra",5,81],["LDM","S. Rode",18,80],["LB","M. Schmelzer",29,80],["RM","O. Dembélé",7,77]],"subs":[["CAM","S. Kagawa",23,83],["CB","S. Bender",6,82],["LM","A. Schürrle",21,81],["CDM","N. Şahin",8,80]],"reserves":[["CDM","J. Weigl",33,79],["GK","R. Weidenfeller",1,78],["CB","N. Subotić",4,78]]},
    "Bayer Leverkusen":{"xi":[["GK","B. Leno",1,86],["LCB","O. Toprak",21,84],["RDM","L. Bender",8,83],["ST","J. Hernández",7,83],["CAM","H. Çalhanoğlu",10,80],["LDM","K. Kampl",44,80],["RM","J. Brandt",19,79],["RCB","J. Tah",4,79],["LB","Wendell",18,78],["LM","A. Mehmedi",14,76],["RB","T. Jedvaj",16,75]],"subs":[["RM","K. Bellarabi",38,83],["ST","K. Volland",31,81],["CB","A. Dragović",3,79],["CDM","J. Baumgartlinger",15,79]],"reserves":[["CM","C. Aránguiz",20,79],["ST","S. Kießling",11,78],["RB","R. Hilbert",13,77]]},
    "Borussia Mönchengladbach":{"xi":[["GK","Y. Sommer",1,84],["LS","Raffael",11,82],["CAM","L. Stindl",13,81],["RM","I. Traoré",16,80],["RS","T. Hazard",10,79],["LCB","T. Jantschke",24,79],["LM","O. Wendt",17,79],["CB","A. Christensen",3,78],["LCM","C. Kramer",6,78],["RCM","T. Strobl",5,76],["RCB","N. Elvedi",30,72]],"subs":[["RM","P. Herrmann",7,81],["CM","M. Dahoud",8,79],["CB","J. Vestergaard",4,79],["ST","A. Hahn",28,79]],"reserves":[["LM","F. Johnson",19,79],["CB","Álvaro Domínguez",18,77],["RM","J. Hofmann",23,77]]},
    "Schalke 04":{"xi":[["GK","R. Fährmann",1,84],["RCB","Naldo",29,84],["LCB","B. Höwedes",4,84],["RM","Y. Konoplyanka",11,83],["ST","K. Huntelaar",25,81],["CAM","M. Meyer",7,80],["LB","A. Baba",14,78],["LM","E. Choupo-Moting",13,78],["RDM","B. Stambouli",17,76],["LDM","N. Bentaleb",10,75],["RB","Júnior Caiçara",3,75]],"subs":[["CB","M. Nastasić",31,80],["RB","Coke",23,80],["CM","L. Goretzka",8,79],["CDM","J. Geis",5,79]],"reserves":[["ST","F. Di Santo",9,77],["RM","S. Sam",18,77],["CDM","D. Aogo",15,76]]},
    "Mainz 05":{"xi":[["LCM","Y. Mallı",10,79],["ST","J. Córdoba",15,77],["RCB","S. Bell",16,77],["GK","J. Lössl",1,77],["LCB","L. Balogun",3,76],["RCM","F. Frei",20,76],["LM","P. De Blasis",32,76],["RB","G. Donati",2,75],["LB","D. Brosinski",18,75],["RM","L. Öztunalı",8,74],["CDM","J. Gbamin",25,73]],"subs":[["LM","Jairo",17,77],["CM","D. Latza",6,76],["RM","C. Clemens",27,76],["CB","N. Bungert",26,76]],"reserves":[["CM","José Rodríguez",5,75],["ST","Y. Mutō",9,75],["LB","G. Bussmann",24,75]]},
    "Hertha BSC":{"xi":[["LCB","J. Brooks",25,79],["RDM","P. Skjelbred",3,78],["ST","V. Ibišević",19,78],["RCB","S. Langkamp",15,78],["LB","M. Plattenhardt",21,77],["CAM","V. Stocker",14,77],["GK","R. Jarstein",22,77],["RB","P. Pekarík",2,77],["RM","M. Weiser",23,76],["LDM","F. Lustenberger",28,76],["LM","G. Haraguchi",24,75]],"subs":[["LM","S. Kalou",8,81],["CM","V. Darida",6,79],["GK","T. Kraft",1,76],["ST","J. Schieber",16,75]],"reserves":[["CAM","A. Baumjohann",9,75],["CB","N. Stark",5,74],["RM","A. Esswein",7,74]]},
    "Wolfsburg":{"xi":[["RM","J. Draxler",10,84],["LB","R. Rodríguez",34,83],["RDM","Luiz Gustavo",22,83],["ST","M. Gómez",33,82],["RB","Vieirinha",8,81],["LCB","J. Bruma",5,80],["CAM","D. Didavi",11,80],["LM","D. Caligiuri",7,79],["GK","K. Casteels",28,78],["RCB","P. Wollscheid",2,78],["LDM","Y. Gerhardt",13,77]],"subs":[["CDM","J. Guilavogui",23,80],["CM","M. Arnold",27,79],["GK","D. Benaglio",1,79],["RM","J. Błaszczykowski",14,79]],"reserves":[["RB","C. Träsch",15,78],["RB","S. Jung",24,77],["LB","M. Schäfer",4,76]]},
    "Hoffenheim":{"xi":[["RCB","N. Süle",25,81],["GK","O. Baumann",1,80],["LCM","S. Rudy",6,78],["RCM","E. Polański",8,78],["LW","A. Kramarić",27,77],["LCB","E. Bičakčić",4,77],["RW","M. Uth",19,76],["ST","S. Wagner",14,76],["CAM","N. Amiri",18,75],["RB","P. Kadeřábek",3,75],["LB","J. Toljan",15,73]],"subs":[["CB","F. Schär",5,77],["CF","E. Vargas",9,77],["CDM","P. Schwegler",16,77],["CDM","K. Vogt",22,76]],"reserves":[["RM","L. Rupp",7,76],["CB","B. Hübner",21,75],["LM","S. Zuber",17,74]]},
    "Eintracht Frankfurt":{"xi":[["ST","A. Meier",14,79],["GK","L. Hrádecký",1,78],["RCB","D. Abraham",19,77],["RM","H. Seferović",9,76],["LB","B. Oczipka",6,76],["CAM","M. Fabián",10,75],["RDM","M. Hasebe",20,75],["RB","T. Chandler",22,74],["LDM","S. Huszti",8,74],["LCB","Vallejo",5,73],["LM","M. Gaćinović",11,70]],"subs":[["CAM","M. Stendera",21,76],["CB","M. Russ",4,76],["CB","Bamba Anderson",23,76],["CM","Omar Mascarell",39,74]],"reserves":[["CDM","J. Flum",18,73],["CDM","S. Medojević",25,73],["GK","H. Lindner",13,71]]},
    "Werder Bremen":{"xi":[["ST","C. Pizarro",14,79],["CAM","Z. Junuzović",16,79],["RCB","L. Sané",26,79],["GK","J. Drobný",33,77],["RB","T. Gebre Selassie",23,76],["RDM","C. Fritz",8,75],["LCB","N. Moisander",18,75],["RM","F. Bartels",22,75],["LB","S. García",2,75],["LM","S. Gnabry",29,73],["LDM","F. Grillitsch",27,72]],"subs":[["CF","M. Kruse",10,80],["GK","F. Wiedwald",42,76],["LM","F. Kainz",7,75],["CB","L. Caldirola",3,75]],"reserves":[["CB","F. Diagne",21,75],["CDM","P. Bargfrede",44,75],["ST","A. Jóhannsson",9,74]]},
    "Hamburg":{"xi":[["GK","R. Adler",1,81],["LM","F. Kostić",17,80],["LCB","E. Spahić",4,79],["LDM","L. Holtby",8,78],["CAM","A. Hunt",14,77],["RCB","J. Djourou",5,77],["RM","N. Müller",27,77],["LB","Douglas Santos",6,75],["ST","B. Wood",7,74],["RB","G. Sakai",24,74],["RDM","G. Jung",28,69]],"subs":[["CAM","A. Halilović",23,79],["ST","P. Lasogga",10,77],["CM","A. Ekdal",20,76],["CB","Cléber",3,75]],"reserves":[["RB","D. Diekmeier",2,74],["LB","M. Ostrzolek",22,74],["GK","C. Mathenia",31,74]]},
    "FC Augsburg":{"xi":[["LDM","D. Baier",10,80],["GK","M. Hitz",35,80],["CAM","Koo Ja Cheol",19,78],["RB","P. Verhaegh",2,78],["RM","R. Bobadilla",25,78],["ST","A. Finnbogason",27,77],["RCB","J. Gouweleeuw",6,76],["LCB","M. Hinteregger",36,75],["RDM","M. Feulner",8,74],["LB","K. Stafylidis",3,72],["LM","Ji Dong Won",22,71]],"subs":[["LM","T. Usami",39,77],["LM","J. Schmid",11,76],["CAM","H. Altıntop",7,76],["CB","G. Kačar",20,76]],"reserves":[["CDM","D. Kohr",21,75],["LM","Caiuby",30,75],["RB","D. Opare",4,74]]},
    "SC Freiburg":{"xi":[["LCM","V. Grifo",32,75],["RS","M. Philipp",26,74],["LS","F. Niederlechner",7,74],["RWB","A. Ignjovski",2,74],["RCM","M. Frantz",8,73],["CM","A. Abrashi",6,72],["LWB","C. Günter",30,72],["CB","G. Niedermeier",24,72],["RCB","M. Gulde",5,71],["LCB","N. Höfler",27,71],["GK","A. Schwolow",1,70]],"subs":[["ST","N. Petersen",18,76],["CB","Torrejón",3,74],["CB","M. Kempf",20,73],["ST","H. Nielsen",14,72]],"reserves":[["GK","R. Gikiewicz",44,72],["LM","M. Møller Dæhli",16,70],["CAM","J. Haberer",19,70]]},
    "RB Leipzig":{"xi":[["LAM","E. Forsberg",10,76],["RAM","N. Keïta",8,75],["RS","M. Sabitzer",7,74],["RCB","W. Orban",4,74],["LS","Y. Poulsen",9,73],["LB","M. Halstenberg",23,73],["GK","P. Gulácsi",32,73],["LCB","M. Compper",33,73],["RDM","D. Kaiser",24,73],["LDM","D. Demme",31,72],["RB","Bernardo",3,60]],"subs":[["CB","K. Papadopoulos",5,79],["ST","T. Werner",11,75],["ST","D. Selke",27,73],["RB","L. Klostermann",16,72]],"reserves":[["GK","F. Coltorti",1,72],["CDM","S. Ilsanker",13,71],["CDM","R. Khedira",6,69]]},
    "FC Ingolstadt":{"xi":[["RCB","M. Matip",34,77],["RCM","P. Groß",10,76],["CDM","Roger",8,76],["GK","O. Nyland",1,74],["ST","D. Lezcano",37,74],["LCB","M. Tisserand",32,73],["LW","M. Leckie",7,72],["LCM","A. Morales",6,72],["LB","M. Suttner",29,72],["RW","M. Hartmann",9,72],["RB","T. Levels",28,71]],"subs":[["ST","L. Hinterseer",16,73],["CB","R. Brégerie",18,73],["RM","R. Leipertz",13,72],["GK","M. Hansen",35,72]],"reserves":[["CDM","A. Cohen",36,71],["CDM","M. Christiansen",19,70],["RB","F. Hadergjonaj",33,70]]},
    "Darmstadt 98":{"xi":[["RCB","A. Sulu",4,78],["RM","A. Ben-Hatira",28,75],["LM","M. Heller",20,75],["LCM","J. Gondorf",8,75],["LCB","A. Milošević",3,73],["RCM","P. Niemeyer",18,73],["ST","S. Schipplock",39,73],["LB","F. Holland",32,71],["RB","F. Jungwirth",23,71],["CF","R. Bezjak",14,71],["GK","M. Esser",31,69]],"subs":[["RB","A. Fedetskyi",7,76],["CM","M. Vrančić",6,73],["ST","V. Obinna",11,72],["CF","J. Rosenthal",10,71]],"reserves":[["LM","D. Oliynyk",22,71],["ST","D. Stroh-Engel",9,70],["CB","I. Höhn",21,69]]},
    "1. FC Köln":{"xi":[["GK","T. Horn",1,82],["LB","J. Hector",14,80],["RS","A. Modeste",27,80],["RDM","M. Höger",6,78],["LCB","D. Heintz",3,77],["LM","L. Bittencourt",21,77],["RM","M. Risse",7,77],["LDM","M. Lehmann",33,76],["RB","F. Sørensen",4,75],["RCB","M. Mavraj",15,75],["LS","Y. Ōsako",13,73]],"subs":[["CB","D. Maroh",5,76],["CM","M. Jojić",8,75],["ST","S. Zoller",11,74],["LM","K. Rausch",34,74]],"reserves":[["RB","P. Olkowski",16,74],["ST","A. Rudņevs",9,73],["LB","F. Mladenović",25,71]]},
    "Atalanta":{"xi":[["GK","M. Sportiello",57,82],["LW","A. Gómez",10,80],["ST","A. Paloschi",43,78],["RCB","Rafael Tolói",3,75],["CDM","J. Kurtić",27,75],["LCB","G. Stendardo",2,75],["LB","B. Dramé",93,75],["RCM","C. Carmona",17,75],["RB","E. Zukanović",6,75],["LCM","F. Kessié",19,70],["RW","M. D'Alessandro",7,70]],"subs":[["ST","M. Pinilla",51,76],["RB","A. Konko",25,76],["GK","E. Berisha",1,75],["CB","A. Masiello",5,74]],"reserves":[["CM","G. Migliaccio",8,72],["ST","A. Pešić",9,71],["CB","E. Suagher",23,71]]},
    "Bologna":{"xi":[["ST","M. Destro",10,78],["LW","L. Krejčí",11,77],["RCB","D. Gastaldello",28,77],["LCB","M. Oikonomou",2,76],["LCM","G. Donsah",17,75],["RW","S. Verdi",9,75],["RCM","S. Taïder",8,75],["LB","A. Masina",25,75],["CDM","A. Nagy",16,72],["GK","Da Costa",1,72],["RB","E. Krafth",4,69]],"subs":[["GK","A. Mirante",83,81],["RB","V. Torosidis",35,77],["RW","A. Mounier",7,76],["CM","F. Viviani",6,75]],"reserves":[["CB","F. Helander",18,74],["CB","D. Maietta",20,74],["ST","S. Floccari",26,74]]},
    "Cagliari":{"xi":[["RCB","Bruno Alves",2,79],["GK","M. Storari",30,76],["RCM","M. Isla",3,76],["LS","M. Borriello",22,75],["RS","M. Sau",25,74],["CAM","João Pedro",10,73],["LCM","S. Padoin",20,73],["CM","D. Di Gennaro",8,73],["LCB","L. Ceppitelli",23,72],["LB","N. Murru",29,71],["RB","F. Pisacane",19,65]],"subs":[["CDM","P. Tachtsidis",77,75],["CM","A. Ioniţă",21,75],["GK","Rafael",1,75],["CAM","Diego Farías",17,74]],"reserves":[["ST","F. Melchiorri",9,73],["CB","M. Capuano",24,72],["CM","D. Dessena",4,71]]},
    "Chievo":{"xi":[["GK","S. Sorrentino",70,80],["RCB","A. Gamberini",5,78],["LCB","B. Cesar",12,78],["CAM","V. Birsa",23,78],["RM","L. Castro",19,77],["LM","P. Hetemaj",56,76],["LS","R. Meggiorini",69,76],["CDM","I. Radovanovic",8,75],["LB","M. Gobbi",18,74],["RB","F. Cacciatore",29,74],["RS","R. Inglese",45,72]],"subs":[["CAM","J. De Guzmán",1,77],["CM","M. Izco",13,76],["CB","D. Dainelli",3,75],["CB","N. Spolli",2,75]],"reserves":[["ST","S. Pellissier",31,74],["CM","N. Rigoni",4,73],["RB","N. Frey",21,73]]},
    "Crotone":{"xi":[["LCM","L. Crisetig",8,73],["LW","R. Palladino",7,73],["CB","Claiton",3,73],["RCM","M. Rohdén",6,72],["LM","B. Martella",87,71],["LCB","G. Ferrari",13,71],["RM","A. Rosi",22,71],["RCB","F. Ceccherini",17,70],["ST","D. Falcinelli",11,70],["GK","A. Cordaz",1,68],["RW","A. Tonev",24,68]],"subs":[["LB","D. Mesbah",15,72],["CB","N. Dussenne",23,71],["CM","L. Capezzi",28,70],["RB","M. Sampirisi",31,70]],"reserves":[["LW","A. Stoian",2,70],["ST","M. Trotta",29,69],["ST","Simy",99,69]]},
    "Empoli":{"xi":[["CAM","R. Saponara",10,80],["GK","L. Skorupski",28,76],["LS","M. Maccarone",7,76],["RCB","A. Costa",15,76],["RS","M. Pucciarelli",20,75],["LCM","D. Croce",11,75],["CM","J. Mauri",5,73],["RCM","M. Büchel",77,73],["RB","V. Laurini",2,73],["LB","M. Pasqual",21,73],["LCB","F. Barba",19,72]],"subs":[["ST","A. Gilardino",18,75],["CB","U. Ćosić",24,72],["ST","L. Mchedlidze",9,72],["ST","G. Marilungo",89,72]],"reserves":[["RB","M. Zambelli",3,70],["CB","G. Bellusci",6,70],["CAM","Matheus Pereira",31,70]]},
    "Fiorentina":{"xi":[["CB","G. Rodríguez",2,83],["LF","Borja Valero",20,83],["LCB","D. Astori",13,81],["ST","N. Kalinić",9,80],["RF","J. Iličić",72,80],["LCM","M. Badelj",5,79],["RM","F. Bernardeschi",10,78],["RCM","M. Vecino",8,77],["GK","C. Tătăruşanu",12,77],["RCB","N. Tomović",40,76],["LM","H. Milić",31,71]],"subs":[["CDM","S. Cristóforo",19,78],["RW","Cristian Tello",16,78],["ST","M. Zárate",7,77],["CB","S. De Maio",4,77]],"reserves":[["CDM","C. Sánchez",6,76],["ST","K. Babacar",30,76],["LM","H. Toledo",11,73]]},
    "Genoa":{"xi":[["LCM","Miguel Veloso",44,79],["RCB","S. Gentiletti",3,78],["CB","N. Burdisso",8,77],["ST","L. Pavoletti",19,77],["RCM","T. Rincón",88,76],["LW","L. Ocampos",11,75],["LCB","A. Izzo",5,75],["LM","D. Laxalt",93,74],["RM","D. Lazović",22,74],["GK","E. Lamanna",23,72],["RW","O. Ntcham",18,65]],"subs":[["GK","M. Perin",1,83],["RM","Edenílson",2,75],["LB","L. Orbán",21,74],["ST","G. Pandev",27,74]],"reserves":[["RM","S. Gakpé",13,74],["CM","L. Rigoni",30,74],["RB","I. Cissokho",20,73]]},
    "Inter Milan":{"xi":[["GK","S. Handanovič",1,87],["LCB","Miranda",25,86],["CAM","E. Banega",19,84],["RDM","João Mário",6,83],["LAM","I. Perišić",44,83],["LDM","G. Medel",17,83],["ST","M. Icardi",9,82],["RAM","A. Candreva",87,81],["RCB","J. Murillo",24,80],["LB","C. Ansaldi",15,80],["RB","D. D'Ambrosio",33,75]],"subs":[["ST","S. Jovetić",10,81],["ST","Eder",23,80],["CM","M. Brozović",77,79],["CDM","Felipe Melo",83,79]],"reserves":[["ST","R. Palacio",8,79],["CB","M. Andreolli",2,78],["ST","Gabriel",96,78]]},
    "Juventus":{"xi":[["GK","G. Buffon",1,88],["LCB","G. Chiellini",3,88],["LS","G. Higuaín",9,88],["CB","L. Bonucci",19,87],["RCB","A. Barzagli",15,86],["RS","P. Dybala",21,85],["CDM","M. Pjanić",5,85],["RM","Dani Alves",23,85],["LM","Alex Sandro",12,84],["RCM","S. Khedira",6,83],["LCM","K. Asamoah",22,80]],"subs":[["CM","C. Marchisio",8,86],["RB","S. Lichtsteiner",26,83],["CB","M. Benatia",4,83],["ST","M. Mandžukić",17,83]],"reserves":[["RM","J. Cuadrado",7,82],["LB","P. Evra",33,82],["CM","Hernanes",11,80]]},
    "Lazio":{"xi":[["LCB","S. de Vrij",3,82],["GK","F. Marchetti",22,82],["CDM","L. Biglia",20,82],["RCM","M. Parolo",16,81],["ST","C. Immobile",17,80],["RB","D. Basta",8,80],["RW","Felipe Anderson",10,79],["LB","S. Radu",26,79],["LCM","S. Lulić",19,78],["RCB","Bastos",15,76],["LW","J. Lukaku",6,73]],"subs":[["LW","K. Baldé Diao",14,78],["CAM","Luis Alberto",18,77],["CAM","R. Morrison",11,77],["ST","F. Đorđević",9,77]],"reserves":[["CB","W. Hoedt",2,76],["CM","S. Milinković-Savić",21,76],["LW","R. Kishna",7,75]]},
    "Milan":{"xi":[["ST","C. Bacca",70,84],["LCM","G. Bonaventura",5,82],["RCM","J. Sosa",23,80],["LCB","A. Romagnoli",13,78],["LW","M. Niang",11,78],["CDM","R. Montolivo",18,78],["RCB","G. Paletta",29,78],["RB","I. Abate",20,78],["LB","L. Antonelli",31,78],["RW","Suso",8,77],["GK","G. Donnarumma",99,76]],"subs":[["RM","K. Honda",10,81],["CAM","M. Fernández",14,79],["ST","Luiz Adriano",87,79],["CB","C. Zapata",17,78]],"reserves":[["CM","J. Kucka",33,78],["LB","L. Vangioni",21,77],["CM","A. Bertolacci",91,77]]},
    "Napoli":{"xi":[["LCM","M. Hamšik",17,85],["GK","José Reina",25,84],["LW","L. Insigne",24,83],["LCB","K. Koulibaly",26,82],["RCB","Raúl Albiol",33,82],["CM","Jorginho",8,81],["RCM","Allan",5,81],["RW","José Callejón",7,81],["ST","A. Milik",99,79],["RB","E. Hysaj",2,79],["LB","F. Ghoulam",31,79]],"subs":[["LW","D. Mertens",14,83],["CB","N. Maksimović",19,81],["ST","M. Gabbiadini",23,81],["CB","L. Tonelli",62,79]],"reserves":[["LW","E. Giaccherini",4,78],["CM","O. El Kaddouri",77,78],["CB","V. Chiricheş",21,77]]},
    "Palermo":{"xi":[["LCB","S. Rajković",5,75],["LCM","Bruno Henrique",25,75],["CM","A. Gazzi",14,75],["RW","A. Diamanti",23,75],["LW","R. Quaison",21,74],["RCM","O. Hiljemark",10,73],["RCB","E. Goldaniga",6,72],["LB","H. Aleesami",19,72],["RB","A. Rispoli",3,70],["ST","I. Nestorovski",30,67],["GK","J. Posavec",1,61]],"subs":[["CB","G. González",12,77],["CB","S. Anđelković",4,75],["CB","R. Vitiello",2,73],["CM","M. Jajalo",28,73]],"reserves":[["CM","O. Bouy",24,72],["CB","Thiago Cionek",15,71],["CM","I. Chochev",18,71]]},
    "Pescara":{"xi":[["GK","A. Bizzarri",31,76],["LF","G. Caprari",17,73],["LB","C. Biraghi",3,73],["RF","A. Benali",10,72],["RCB","H. Campagnaro",14,72],["LCM","L. Memushaj",8,72],["RCM","V. Verre",7,70],["LCB","D. Župarić",13,70],["RB","F. Zampano",11,69],["CM","G. Brugman",16,68],["ST","R. Manaj",9,67]],"subs":[["CM","A. Aquilani",20,78],["RM","S. Pepe",21,77],["CM","B. Cristante",6,72],["CB","N. Gyömbér",37,72]],"reserves":[["ST","J. Bahebeck",15,72],["GK","V. Fiorillo",1,70],["CB","A. Coda",35,70]]},
    "Roma":{"xi":[["RCB","K. Manolas",44,84],["RCM","R. Nainggolan",4,84],["CDM","D. De Rossi",16,83],["RB","A. Florenzi",24,82],["LW","S. El Shaarawy",92,81],["RW","M. Salah",11,81],["LCM","K. Strootman",6,81],["LCB","T. Vermaelen",15,81],["ST","D. Perotti",8,80],["GK","W. Szczęsny",1,79],["LB","Juan Jesus",3,75]],"subs":[["RWB","Bruno Peres",13,81],["GK","Alisson",19,80],["CF","F. Totti",10,80],["ST","E. Džeko",9,80]],"reserves":[["LB","Mário Rui",22,78],["CB","A. Rüdiger",2,77],["RW","J. Iturbe",7,77]]},
    "Sampdoria":{"xi":[["GK","E. Viviano",2,82],["LS","F. Quagliarella",27,78],["CAM","R. Álvarez",11,77],["RS","L. Muriel",9,76],["LCM","K. Linetty",16,74],["RCM","E. Barreto",8,74],["RCB","M. Silvestre",26,74],["RB","J. Sala",22,73],["LCB","V. Regini",19,72],["CM","L. Torreira",34,71],["LB","D. Pavlovic",20,69]],"subs":[["RM","D. Praet",18,78],["CF","A. Cassano",99,78],["CM","L. Cigarini",21,77],["CM","Bruno Fernandes",10,76]],"reserves":[["CAM","F. Đuričić",23,76],["CM","C. Carbonero",7,75],["LM","Dodô",5,74]]},
    "Sassuolo":{"xi":[["GK","A. Consigli",47,83],["RW","D. Berardi",25,82],["RCB","F. Acerbi",15,81],["CDM","F. Magnanelli",4,77],["RCM","A. Duncan",32,76],["LCB","P. Cannavaro",28,76],["LCM","S. Missiroli",7,76],["LW","M. Politano",16,74],["ST","G. Defrel",92,74],["LB","F. Peluso",13,74],["RB","M. Gazzola",23,70]],"subs":[["ST","A. Matri",10,78],["CB","T. Letschert",55,76],["CB","L. Antei",5,72],["LW","A. Ragusa",90,72]],"reserves":[["GK","G. Pegolo",79,72],["CM","L. Pellegrini",6,71],["CM","D. Biondini",8,71]]},
    "Torino":{"xi":[["GK","J. Hart",21,84],["LCB","Castán",4,80],["LCM","D. Baselli",8,79],["LW","A. Ljajić",10,78],["RW","Iago Falqué",14,78],["ST","A. Belotti",9,77],["RCM","M. Benassi",15,77],["RB","L. De Silvestri",29,77],["CDM","M. Valdifiori",18,77],["RCB","C. Bovo",5,76],["LB","C. Molinaro",3,75]],"subs":[["ST","M. López",11,78],["RWB","D. Zappacosta",7,77],["CB","E. Moretti",24,77],["GK","D. Padelli",1,77]],"reserves":[["LB","Danilo Avelar",26,76],["CB","L. Rossettini",13,75],["CDM","G. Vives",20,75]]},
    "Udinese":{"xi":[["GK","O. Karnezis",1,82],["LCB","Danilo",5,79],["RCM","S. Kums",88,79],["RS","D. Zapata",9,78],["RCB","T. Heurtaux",75,78],["LS","A. Peñaranda",11,76],["RB","S. Widmer",27,76],["LCM","E. Hallfreðsson",23,76],["CAM","R. De Paul",10,75],["CDM","E. Badu",8,75],["LB","P. Armero",7,75]],"subs":[["ST","C. Théréau",77,78],["CAM","P. Kone",33,76],["ST","Ryder",19,75],["CB","Felipe",30,75]],"reserves":[["CDM","F. Lodi",20,75],["CB","M. Wagué",2,74],["CB","G. Angella",4,74]]},
    "Angers":{"xi":[["LCB","R. Thomas",24,77],["RCM","C. N'Doye",17,77],["RM","B. Ketkeophomphone",14,76],["LCM","T. Mangani",5,75],["LM","K. Toko-Ekambi",7,74],["RCB","I. Traoré",8,74],["GK","M. Michel",16,73],["CDM","J. Saihi",23,73],["RB","V. Manceau",29,72],["ST","F. Diedhiou",9,71],["LB","Y. Andreu",3,71]],"subs":[["CM","P. Capelle",15,73],["GK","D. Petric",1,72],["RW","G. Sunu",10,71],["CM","B. Santamaria",18,70]],"reserves":[["GK","A. Letellier",30,70],["ST","D. Nwakaeme",11,68],["CAM","F. Tait",20,68]]},
    "Bastia":{"xi":[["GK","J. Leca",16,77],["LCB","S. Squillaci",5,75],["RM","T. Bifouma",13,74],["RCB","M. Peybernès",17,73],["CDM","Y. Cahuzac",18,73],["LB","P. Bengtsson",20,73],["RCM","M. Mostefa",14,73],["ST","E. Crivelli",27,72],["RB","G. Cioni",29,72],["LM","A. Saint-Maximin",6,67],["LCM","L. Coulibaly",25,65]],"subs":[["CB","A. El Kaoutari",4,74],["ST","S. Diallo",2,73],["LM","L. Nangis",11,72],["CAM","A. Ngando",19,70]],"reserves":[["RW","J. Cabral",7,70],["ST","F. Raspentino",9,70],["RB","A. Djiku",23,70]]},
    "Bordeaux":{"xi":[["LDM","J. Toulalan",14,83],["GK","C. Carrasso",16,81],["LS","J. Ménez",7,79],["RS","D. Rolán",9,78],["LCB","N. Pallois",5,77],["RDM","J. Plašil",18,76],["LAM","T. Touré",10,75],["RB","Y. Sabaly",20,75],["RAM","Malcom",25,74],["RCB","G. Sertic",27,74],["LB","M. Poundjé",29,73]],"subs":[["LM","N. Maurice-Belay",19,75],["LB","D. Contento",3,74],["RM","F. Kamano",11,72],["CB","F. Guilbert",26,72]],"reserves":[["RM","A. Traoré",15,71],["GK","J. Prior",30,71],["RB","M. Gajić",2,70]]},
    "Caen":{"xi":[["LCB","D. Da Silva",28,77],["GK","R. Vercoutre",1,77],["LCM","J. Féret",25,76],["CDM","N. Seube",2,74],["RCM","J. Delaplace",6,74],["LW","R. Rodelin",12,73],["LB","E. Imorou",15,73],["RCB","S. Ben Youssef",13,72],["ST","I. Santini",26,72],["RB","M. Dabo",23,72],["RW","Y. Karamoh",7,67]],"subs":[["CB","R. Genevois",29,74],["LM","V. Bessat",11,74],["CDM","I. Diomandé",4,73],["CAM","J. Louis",14,71]],"reserves":[["CB","A. Yahia",5,71],["CAM","S. Malbranque",10,71],["CDM","J. Adéoti",18,71]]},
    "Dijon":{"xi":[["RCM","F. Balmont",15,75],["GK","B. Reynet",30,73],["LM","F. Sammaritano",18,73],["RB","F. Chafik",26,72],["LCM","M. Abeid",17,71],["LS","J. Tavares",11,70],["RCB","C. Varrault",27,70],["LB","V. Rüfli",23,70],["RM","R. Amalfitano",20,70],["LCB","Y. Abdelhamid",21,70],["RS","D. Bahamboula",24,69]],"subs":[["CAM","M. Martin",13,74],["LB","A. Bouka Moutou",25,71],["GK","B. Leroy",1,71],["CB","J. Lotiès",4,71]],"reserves":[["CAM","P. Lees-Melou",8,70],["ST","L. Diony",9,70],["CB","A. Lang",2,69]]},
    "Guingamp":{"xi":[["LM","Y. Salibur",19,76],["LB","Marçal",3,76],["LS","J. Briand",23,76],["RCB","C. Kerbrat",29,75],["LCB","J. Sorbon",15,74],["LCM","L. Deaux",8,74],["RS","S. Privat",11,73],["RCM","M. Diallo",5,72],["GK","K. Johnsson",1,70],["RM","M. Coco",24,69],["RB","J. Ikoko",2,67]],"subs":[["GK","R. Salin",30,76],["CM","E. Didot",17,75],["LM","N. Benezet",10,74],["LB","D. Lévêque",7,74]],"reserves":[["CB","B. Angoua",4,74],["LM","T. Giresse",26,74],["RB","J. Martins Pereira",22,72]]},
    "Lille":{"xi":[["GK","V. Enyeama",1,83],["RCB","R. Civelli",5,78],["RB","S. Corchia",2,77],["LW","N. De Préville",12,77],["RCM","R. Mavuba",24,77],["ST","Éder",19,77],["LCB","M. Baša",25,77],["RW","Marcos Lopes",17,76],["LCM","Y. Sankharé",4,75],["LB","J. Palmieri",15,75],["CDM","I. Amadou",6,72]],"subs":[["CM","M. Obbadi",8,76],["LM","E. Bauthéac",11,76],["CM","M. Amalfitano",10,75],["LB","F. Béria",18,74]],"reserves":[["ST","Y. Benzia",9,73],["CB","S. Sunzu",13,72],["RM","Ryan Mendes",20,72]]},
    "Lorient":{"xi":[["GK","B. Lecomte",40,79],["RM","B. Moukandjo",12,78],["LCM","S. Marveaux",10,75],["RCM","W. Mesloub",17,75],["LCB","W. Lautoa",24,75],["CDM","Cafú",8,74],["ST","A. Waris",9,74],["RB","L. Rose",2,74],["LB","V. Le Goff",25,73],["RCB","M. Ciani",13,73],["LM","R. Philippoteaux",19,73]],"subs":[["ST","B. Jeannot",22,74],["LM","J. Cabot",27,73],["CM","A. Mvuemba",7,73],["RB","S. Moreira",20,72]],"reserves":[["CB","Z. Touré",5,72],["CDM","F. Bellugou",6,72],["LM","M. Barthelmé",28,72]]},
    "Lyon":{"xi":[["ST","A. Lacazette",10,85],["GK","A. Lopes",1,83],["RW","N. Fekir",18,81],["RCB","M. Yanga-M'Biwa",2,81],["LCB","N. Nkoulou",3,81],["CDM","M. Gonalons",21,81],["RCM","Sergi Darder",14,79],["LCM","C. Tolisso",8,78],["RB","Rafael",20,78],["LB","J. Morel",15,76],["LW","M. Cornet",27,75]],"subs":[["RB","C. Jallet",13,79],["RW","M. Valbuena",28,79],["RW","R. Ghezzal",11,77],["CM","J. Ferri",12,77]],"reserves":[["CM","C. Grenier",7,77],["LB","M. Rybus",31,74],["CM","G. Fofana",6,73]]},
    "Marseille":{"xi":[["LDM","L. Diarra",10,83],["CAM","R. Cabella",7,80],["ST","B. Gomis",18,78],["RM","F. Thauvin",26,77],["RDM","W. Vainqueur",19,77],["LB","H. Bedimo",12,77],["RCB","T. Hubočan",15,76],["GK","Y. Pelé",16,74],["LCB","Dória",3,73],["RB","H. Sakai",2,73],["LM","C. N'Jié",14,70]],"subs":[["RM","R. Alessandrini",11,77],["CDM","A. Diaby",5,74],["CB","K. Rekik",4,73],["CB","R. Fanni",24,73]],"reserves":[["CB","Rolando",6,73],["RM","B. Sarr",17,71],["CM","Z. Machach",23,68]]},
    "Metz":{"xi":[["RM","Y. Jouffre",8,77],["ST","M. Erdinç",9,75],["LCM","R. Cohade",24,74],["LB","F. Signorino",13,71],["RCB","G. Milan",5,71],["LM","O. N'Guette",11,70],["LCB","S. Falette",6,70],["GK","T. Didillon",1,69],["CDM","C. Doukouré",10,69],["RB","J. Rivierez",3,69],["RCM","G. Mandjeck",14,67]],"subs":[["CB","M. Biševac",4,77],["LB","B. Assou-Ekotto",32,73],["CM","F. Mollet",19,69],["GK","E. Kawashima",16,69]],"reserves":[["LM","K. Lejeune",22,68],["RB","Balliu",25,68],["ST","T. Vion",18,64]]},
    "Monaco":{"xi":[["LDM","João Moutinho",8,83],["LCB","K. Glik",25,83],["GK","D. Subašić",1,83],["RAM","Bernardo Silva",10,81],["RS","Falcao",9,81],["RDM","Fabinho",2,79],["RB","D. Sidibé",19,79],["LS","V. Germain",18,79],["LAM","T. Lemar",27,78],["RCB","Jemerson",5,77],["LB","B. Mendy",23,75]],"subs":[["GK","M. De Sanctis",16,78],["CB","A. Raggi",24,78],["RM","N. Dirar",7,76],["CDM","T. Bakayoko",14,74]],"reserves":[["ST","G. Carrillo",11,72],["ST","C. Jean",28,72],["CM","A. Traoré",20,71]]},
    "Montpellier":{"xi":[["CAM","R. Boudebouz",10,79],["RCB","Hilton",4,79],["RM","M. Sanson",8,78],["GK","G. Jourdren",16,78],["LCB","D. Congré",3,75],["LB","J. Roussillon",24,74],["ST","C. Ninga",29,73],["LDM","Y. Sylla",5,73],["RB","A. Vanden Borre",20,71],["LM","K. Bérigaud",11,71],["RDM","E. Skhiri",13,65]],"subs":[["RM","P. Lasne",7,75],["CDM","W. Rémy",21,72],["GK","L. Pionnier",1,72],["CDM","J. Marveaux",6,72]],"reserves":[["ST","S. Camara",19,71],["RB","M. Deplagne",25,70],["GK","J. Ligali",30,69]]},
    "Nancy":{"xi":[["LCB","C. Lenglet",2,74],["LW","A. Koura",23,72],["CDM","B. Pedretti",25,72],["RCM","Y. Ait Bennasser",6,71],["ST","Y. Hadji",15,71],["GK","G. Ndy Assembe",16,71],["RB","J. Cuffaut",14,71],["RCB","M. Chrétien",20,70],["RW","A. Robic",7,70],["LB","V. Muratori",26,69],["LCM","S. N'Guessan",13,66]],"subs":[["ST","C. Mandanne",12,74],["CB","A. Diarra",5,73],["RM","I. Dia",10,72],["RB","J. Cétout",28,72]],"reserves":[["CDM","D. Guidileye",18,70],["GK","S. Chernik",1,69],["ST","M. Dalé",9,69]]},
    "Nantes":{"xi":[["GK","R. Riou",1,78],["CDM","G. Gillet",27,77],["RCB","O. Vizcarrondo",4,76],["LCB","Diego Carlos",3,75],["LB","Lucas Lima",6,74],["LW","N. Thomsen",23,72],["RB","L. Dubois",15,71],["RCM","V. Rongier",28,71],["ST","M. Stępiński",18,69],["RW","J. Iloki",7,69],["LCM","A. Harit",14,67]],"subs":[["RM","A. Thomasson",8,75],["CB","K. Djidji",26,73],["ST","E. Sala",9,73],["ST","Y. Bammou",10,73]],"reserves":[["LM","A. Kačaniklić",11,71],["LB","W. Moimbé",13,70],["GK","M. Dupé",30,70]]},
    "Nice":{"xi":[["CB","Dante",31,80],["RCM","V. Koziello",26,79],["LCM","J. Seri",6,79],["RS","M. Balotelli",9,79],["RWB","Ricardo Pereira",21,78],["RCB","P. Baysse",4,78],["LS","A. Pléa",14,77],["LWB","Dalbert",29,76],["GK","Y. Cardinale",30,75],["CM","W. Cyprien",25,72],["LCB","M. Sarr",34,69]],"subs":[["CAM","Y. Belhanda",5,79],["CDM","M. Bodmer",24,79],["CB","M. Le Marchand",20,77],["CAM","V. Eysseric",13,76]],"reserves":[["ST","M. Le Bihan",10,72],["CM","R. Walter",18,72],["RB","A. Souquet",2,71]]},
    "Paris Saint-Germain":{"xi":[["LCB","Thiago Silva",2,89],["RW","A. Di María",11,87],["LCM","B. Matuidi",14,86],["RCM","M. Verratti",6,85],["ST","E. Cavani",9,85],["RB","S. Aurier",19,83],["RCB","Marquinhos",5,82],["LW","Lucas",7,82],["CDM","T. Motta",8,82],["GK","A. Areola",16,81],["LB","L. Kurzawa",20,81]],"subs":[["CM","J. Pastore",10,85],["CDM","G. Krychowiak",23,84],["CAM","H. Ben Arfa",21,84],["GK","K. Trapp",1,83]],"reserves":[["LW","Jesé",22,80],["LB","Maxwell",17,79],["CM","A. Rabiot",25,78]]},
    "Rennes":{"xi":[["GK","B. Costil",1,82],["LM","P. Ntep",7,80],["RS","Y. Gourcuff",28,79],["RCB","Mexer",4,78],["RM","K. Grosicki",10,77],["LDM","B. André",21,76],["LS","G. Sio",13,76],["RDM","C. Chantôme",8,76],["LB","Afonso Figueiredo",25,75],["LCB","S. Armand",22,75],["RB","R. Danzé",29,75]],"subs":[["RM","Pedro Henrique",18,76],["CDM","Gelson Fernandes",6,76],["LB","L. Baal",24,75],["CB","Pedro Mendes",5,73]],"reserves":[["GK","P. Nardi",16,72],["LB","R. Bensebaini",15,71],["ST","H. Habibou",34,71]]},
    "Saint-Étienne":{"xi":[["GK","S. Ruffier",16,85],["RCB","L. Perrin",24,82],["LW","R. Hamouma",21,78],["LCB","F. Pogba",19,77],["RCM","J. Veretout",14,76],["LCM","F. Lemoine",18,76],["RW","O. Tannane",10,75],["ST","R. Berić",27,75],["RB","K. Théophile-Catherine",2,74],["CDM","O. Selnæs",17,72],["LB","P. Polomat",3,70]],"subs":[["CM","H. Saivet",11,78],["CM","B. Dabo",7,75],["CDM","J. Clément",6,75],["LM","K. Monnet-Paquet",22,75]],"reserves":[["ST","N. Roux",9,75],["LB","C. M'Bengue",12,75],["CM","V. Pajot",5,74]]},
    "Toulouse":{"xi":[["ST","M. Braithwaite",9,78],["RCM","O. Trejo",10,77],["LM","J. Durmaz",21,75],["GK","A. Lafont",40,74],["LCM","O. Toivonen",11,74],["CDM","A. Blin",27,73],["RCB","I. Diop",5,73],["LCB","C. Jullien",6,73],["LB","F. Moubandje",29,73],["RM","Somália",19,71],["RB","S. Yago",20,70]],"subs":[["CM","J. Akpa Akpro",7,74],["CM","T. Doumbia",4,72],["CDM","Y. Bodiger",23,71],["CB","D. Veškovac",22,71]],"reserves":[["GK","M. Goicoechea",1,70],["CB","Y. Musavu-King",3,70],["LM","I. Sylla",12,70]]}
  };
  Object.values(squads).forEach(s=>{[s.xi,s.subs,s.reserves].forEach(rows=>{rows.forEach(Object.freeze);Object.freeze(rows);});Object.freeze(s);});
  return Object.freeze({listVersion:2,roster:"fifa17-launch-170002",squads:Object.freeze(squads)});
});

````

## FILE: scripts/build-fifa17-rosters.py

````text
#!/usr/bin/env python3
"""Rebuild the compact FIFA 17 launch database and boards; Python standard library only.
Usage: python3 scripts/build-fifa17-rosters.py path/to/players_17.csv
Source: https://raw.githubusercontent.com/ifrankandrade/data-visualization/main/datasets/players_17.csv
The source uses SoFIFA roster 170002. XI/subs retain source-order rating ties;
reserve ties use the lower jersey number.
"""
import collections
import csv
import hashlib
import json
from pathlib import Path
import sys
import subprocess

ROOT = Path(__file__).resolve().parent.parent
SOURCE = "https://raw.githubusercontent.com/ifrankandrade/data-visualization/main/datasets/players_17.csv"
ALIASES = {
    'Alavés': 'Deportivo Alavés',
    'Athletic Club': 'Athletic Club de Bilbao',
    'Barcelona': 'FC Barcelona',
    'Celta Vigo': 'RC Celta',
    'Deportivo La Coruña': 'Deportivo de La Coruña',
    'Eibar': 'SD Eibar',
    'Espanyol': 'RCD Espanyol',
    'Granada': 'Granada CF',
    'Las Palmas': 'UD Las Palmas',
    'Leganés': 'CD Leganés',
    'Málaga': 'Málaga CF',
    'Osasuna': 'CA Osasuna',
    'Sevilla': 'Sevilla FC',
    'Sporting Gijón': 'Real Sporting de Gijón',
    'Valencia': 'Valencia CF',
    'Villarreal': 'Villarreal CF',
    'Bayern Munich': 'FC Bayern München',
    'Bayer Leverkusen': 'Bayer 04 Leverkusen',
    'Schalke 04': 'FC Schalke 04',
    'Mainz 05': '1. FSV Mainz 05',
    'Wolfsburg': 'VfL Wolfsburg',
    'Hoffenheim': 'TSG 1899 Hoffenheim',
    'Werder Bremen': 'SV Werder Bremen',
    'Hamburg': 'Hamburger SV',
    'FC Ingolstadt': 'FC Ingolstadt 04',
    'Darmstadt 98': 'SV Darmstadt 98',
    'Chievo': 'Chievo Verona',
    'Inter Milan': 'Inter',
    'Angers': 'Angers SCO',
    'Bastia': 'Sporting Club de Bastia',
    'Bordeaux': 'FC Girondins de Bordeaux',
    'Caen': 'Stade Malherbe Caen',
    'Dijon': 'Dijon FCO',
    'Guingamp': 'En Avant de Guingamp',
    'Lille': 'LOSC Lille',
    'Lorient': 'FC Lorient',
    'Lyon': 'Olympique Lyonnais',
    'Marseille': 'Olympique de Marseille',
    'Metz': 'FC Metz',
    'Monaco': 'AS Monaco',
    'Montpellier': 'Montpellier HSC',
    'Nancy': 'AS Nancy Lorraine',
    'Nantes': 'FC Nantes',
    'Nice': 'OGC Nice',
    'Rennes': 'Stade Rennais FC',
    'Saint-Étienne': 'AS Saint-Étienne',
    'Toulouse': 'Toulouse Football Club',
}

# Exact sets of FIFA 17 squad-position codes; no inferred or fuzzy formation names.
FORMATION_SLOTS = {
    "4-2-3-1 (2)": "GK RB RCB LCB LB RDM LDM RM CAM LM ST",
    "4-1-4-1": "GK RB RCB LCB LB CDM RM RCM LCM LM ST",
    "4-4-2": "GK RB RCB LCB LB RM RCM LCM LM RS LS",
    "4-3-3 (2)": "GK RB RCB LCB LB CDM RCM LCM RW ST LW",
    "4-1-2-1-2 (2)": "GK RB RCB LCB LB CDM RCM LCM CAM RS LS",
    "5-3-2": "GK RWB RCB CB LCB LWB RCM CM LCM RS LS",
    "4-4-1-1": "GK RB RCB LCB LB RM RCM LCM LM CF ST",
    "4-3-3 (4)": "GK RB RCB LCB LB RCM LCM CAM RW ST LW",
    "4-4-2 (2)": "GK RB RCB LCB LB RM RDM LDM LM RS LS",
    "3-5-2": "GK RCB CB LCB RDM LDM RM CAM LM RS LS",
    "4-3-3": "GK RB RCB LCB LB RCM CM LCM RW ST LW",
    "3-4-1-2": "GK RCB CB LCB RM RCM LCM LM CAM RS LS",
    "4-2-2-2": "GK RB RCB LCB LB RDM LDM RAM LAM RS LS",
    "4-3-1-2": "GK RB RCB LCB LB RCM CM LCM CAM RS LS",
    "4-1-2-1-2": "GK RB RCB LCB LB CDM RM LM CAM RS LS",
    "3-4-3 Flat": "GK RCB CB LCB RM RCM LCM LM RW ST LW",
    "3-4-2-1": "GK RCB CB LCB RM RCM LCM LM RF LF ST",
    "4-2-3-1": "GK RB RCB LCB LB RDM LDM RAM CAM LAM ST",
    "3-1-4-2": "GK RCB CB LCB CDM RM RCM LCM LM RS LS",
    "4-3-2-1": "GK RB RCB LCB LB RCM CM LCM RF LF ST",
}


def compact(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def write_module(path, global_name, intro, constants, result):
    text = "(function(root,factory){\n  const api=factory();\n  if(typeof module!==\"undefined\"&&module.exports)module.exports=api;\n  else root." + global_name + "=api;\n})(typeof globalThis!==\"undefined\"?globalThis:this,function(){\n  \"use strict\";\n" + intro + constants + result + "\n});\n"
    path.write_text(text, encoding="utf-8")


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    source_path = Path(sys.argv[1])
    raw = source_path.read_bytes()
    rows = list(csv.DictReader(raw.decode("utf-8-sig").splitlines()))
    # Catalog is the single club authority; parse with Node, never from the generated boards.
    catalog = json.loads(subprocess.check_output(["node", "-e", "const vm=require('node:vm'),fs=require('node:fs'),c={};vm.createContext(c);vm.runInContext(fs.readFileSync('data/clubs.js','utf8')+';this.catalog=Object.values(clubsByLeague).flat()',c);console.log(JSON.stringify(c.catalog));"], cwd=ROOT))
    assert len(catalog) == len(set(catalog)) == 98
    by_club = collections.defaultdict(list)
    for r in rows:
        by_club[r["club_name"]].append(r)
    formations = {k: v.split() for k, v in FORMATION_SLOTS.items()}
    clubs, squads, unmatched = {}, {}, []
    for club in catalog:
        source_rows = by_club[ALIASES.get(club, club)]
        assert source_rows, club
        assert all(r["player_url"].endswith("/170002") for r in source_rows), club
        players = [[r["short_name"], int(r["overall"]), r["player_positions"].split(", "), r["team_position"], int(float(r["team_jersey_number"])), r["nationality"]] for r in source_rows]
        assert all(40 <= p[1] <= 99 for p in players), club
        xi = [p for p in players if p[3] not in ("SUB", "RES", "")]
        subs = sorted((p for p in players if p[3] in ("SUB", "RES")), key=lambda p: -p[1])[:4]
        assert len(xi) == 11 and sum(p[3] == "GK" for p in xi) == 1, club
        assert len(subs) == 4 and len({p[0] for p in xi + subs}) == 15, club
        # Keep R87-2's XI/sub selection intact. The next three distinct names are
        # hidden reserves; equal overalls use the lower jersey number first.
        used = {p[0].strip().lower() for p in xi + subs}
        reserves = []
        for p in sorted((p for p in players if p[3] in ("SUB", "RES")), key=lambda p: (-p[1], p[4])):
            if p[0].strip().lower() in used:
                continue
            reserves.append(p)
            used.add(p[0].strip().lower())
            if len(reserves) == 3:
                break
        assert len(reserves) == 3 and len(used) == 18, club
        assert all(40 <= p[1] <= 99 for p in xi + subs + reserves), club
        slots = [p[3] for p in xi]
        formation = next((k for k, v in formations.items() if sorted(v) == sorted(slots)), None)
        if formation is None:
            unmatched.append(club)
        clubs[club] = dict(formation=formation, slots=slots, players=players, reserves=reserves)
        squads[club] = dict(xi=[[p[3], p[0], p[4], p[1]] for p in xi], subs=[[p[2][0], p[0], p[4], p[1]] for p in subs], reserves=[[p[2][0], p[0], p[4], p[1]] for p in reserves])
    count = sum(len(c["players"]) for c in clubs.values())
    sha = hashlib.sha256(raw).hexdigest()
    intro = "  // Generated by scripts/build-fifa17-rosters.py; do not edit rows by hand.\n  // SoFIFA FIFA 17 launch roster 170002, players_17.csv: " + SOURCE + "\n"
    constants = "  const formations=" + compact(formations) + ";\n  const clubs={\n" + ",\n".join("    " + compact(k) + ":" + compact(v) for k, v in clubs.items()) + "\n  };\n"
    result = "  Object.values(formations).forEach(Object.freeze);\n  Object.values(clubs).forEach(c=>{[...c.players,...c.reserves].forEach(p=>{Object.freeze(p[2]);Object.freeze(p);});Object.freeze(c.players);Object.freeze(c.reserves);Object.freeze(c.slots);Object.freeze(c);});\n  return Object.freeze({roster:\"fifa17-launch-170002\",source:" + compact(SOURCE) + ",sourceSha256:" + compact(sha) + ",rowCount:" + str(count) + ",columns:Object.freeze([\"name\",\"overall\",\"player_positions\",\"team_position\",\"team_jersey_number\",\"nationality\"]),formations:Object.freeze(formations),clubs:Object.freeze(clubs)});"
    write_module(ROOT / "data/fifa17Players.js", "CareerModeFifa17Players", intro + "  // Club is the outer key. Player rows follow columns; positions are in source preference order.\n", constants, result)
    constants = "  const squads={\n" + ",\n".join("    " + compact(k) + ":" + compact(v) for k, v in squads.items()) + "\n  };\n"
    result = "  Object.values(squads).forEach(s=>{[s.xi,s.subs,s.reserves].forEach(rows=>{rows.forEach(Object.freeze);Object.freeze(rows);});Object.freeze(s);});\n  return Object.freeze({listVersion:2,roster:\"fifa17-launch-170002\",squads:Object.freeze(squads)});"
    write_module(ROOT / "data/rosterSquads.js", "CareerModeRosterSquads", intro + "  // XI/subs retain R87-2's selection and source-order ties. Hidden reserves are the next 3\n  // highest-rated distinct non-starters, ties by lower shirt number. Rows: [position, name, shirt, overall].\n", constants, result)
    size = (ROOT / "data/fifa17Players.js").stat().st_size
    assert size < 400_000, size
    print(compact(dict(clubs=len(clubs), rows=count, bytes=size, sourceSha256=sha, unmatched=unmatched)))


if __name__ == "__main__":
    main()

````

## FILE: js/sharedTransferChallenge.js

````js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedTransferChallenge=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const RUNTIME_REVISION="1.9.1-r8";
  const WINDOW_MS=15*60*1000;
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const PHASES=Object.freeze(["WINDOW_OPEN","GUESS_ENTRY","SIGNING_ENTRY","COMPLETED"]);
  const OPERATION=/^transfer_op_[0-9a-f]{32}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const STATE_KEYS=Object.freeze([
    "schemaVersion","runtimeRevision","seasonNumber","coordinatorRole","phase","revision",
    "startedAtEpochMs","endedAtEpochMs","endRequestedRoles","guessLockedRoles","signingLockedRoles",
    "inputs","receipts","contentHash"
  ]);

  function stcFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function stcPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;}
  function stcExact(value,keys,code="TRANSFER_VALUE_INVALID"){
    if(!stcPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))stcFail(code);
  }
  function stcClone(value){return JSON.parse(JSON.stringify(value));}
  function stcFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(stcFreeze);Object.freeze(value);}return value;}
  function stcCanonical(value){
    if(Array.isArray(value))return `[${value.map(stcCanonical).join(",")}]`;
    if(stcPlain(value))return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stcCanonical(value[key])}`).join(",")}}`;
    return JSON.stringify(value);
  }
  async function stcHash(value,cryptoImpl){
    if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")stcFail("TRANSFER_CRYPTO_UNAVAILABLE");
    const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(stcCanonical(value)));
    return `sha256:${Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}`;
  }
  function stcRole(value){if(!ROLES.includes(value))stcFail("TRANSFER_ROLE_INVALID");return value;}
  function stcEpoch(value){if(!Number.isSafeInteger(value)||value<0)stcFail("TRANSFER_CLOCK_INVALID");return value;}
  function stcRoleList(value,code){if(!Array.isArray(value)||value.length>2||new Set(value).size!==value.length||value.some(role=>!ROLES.includes(role)))stcFail(code);return value;}
  function stcCatalogIds(values,code){
    if(!Array.isArray(values)||!values.length||new Set(values).size!==values.length||values.some(value=>typeof value!=="string"||!value||value!==value.trim()))stcFail(code);
    return new Set(values);
  }
  function stcConfirmedSetup(value){
    if(!stcPlain(value)||value.phase!=="SHOWDOWN_CONFIRMED"||value.revision!==6)stcFail("TRANSFER_SETUP_NOT_CONFIRMED");
    if(!ROLES.includes(value.coordinatorRole)||![1,3,5,10].includes(value.totalSeasons))stcFail("TRANSFER_SETUP_INVALID");
    if(!Array.isArray(value.confirmedRoles)||value.confirmedRoles.length!==2||!ROLES.every(role=>value.confirmedRoles.includes(role)))stcFail("TRANSFER_SETUP_INVALID");
    if(!value.clubs||typeof value.clubs.playerOne!=="string"||typeof value.clubs.playerTwo!=="string"||!value.clubs.playerOne||!value.clubs.playerTwo||value.clubs.playerOne===value.clubs.playerTwo)stcFail("TRANSFER_SETUP_INVALID");
    return value;
  }
  function stcCareerReady(value){
    if(!stcPlain(value)||value.phase!=="CAREER_START_READY"||value.revision!==2)stcFail("TRANSFER_CAREER_START_NOT_READY");
    if(!Array.isArray(value.acknowledgedRoles)||value.acknowledgedRoles.length!==2||!ROLES.every(role=>value.acknowledgedRoles.includes(role)))stcFail("TRANSFER_CAREER_START_NOT_READY");
    return value;
  }
  function stcNormalizeGuesses(value,leagueIds,nationalityIds){
    if(!Array.isArray(value)||value.length>3)stcFail("TRANSFER_GUESSES_INVALID");
    const seen=new Set();
    return value.map(item=>{
      stcExact(item,["slot","type","valueId"],"TRANSFER_GUESSES_INVALID");
      if(!Number.isInteger(item.slot)||item.slot<1||item.slot>3||seen.has(item.slot))stcFail("TRANSFER_GUESSES_INVALID");
      seen.add(item.slot);
      if(item.type!=="league"&&item.type!=="nationality")stcFail("TRANSFER_GUESSES_INVALID");
      const catalog=item.type==="league"?leagueIds:nationalityIds;
      if(!catalog.has(item.valueId))stcFail("TRANSFER_GUESSES_INVALID");
      return {slot:item.slot,type:item.type,valueId:item.valueId};
    }).sort((a,b)=>a.slot-b.slot);
  }
  const OVERALL_MIN=30,OVERALL_MAX=99;
  function stcPlainHasOverall(item){return Boolean(item&&typeof item==="object"&&Object.hasOwn(item,"overall"));}
  function stcOverallValid(value){return Number.isInteger(value)&&value>=OVERALL_MIN&&value<=OVERALL_MAX;}
  const POSITIONS=Object.freeze(["GK","RB","RWB","CB","LB","LWB","CDM","CM","CAM","RM","LM","RW","LW","CF","ST"]);
  function stcNormalizeSignings(value,leagueIds,nationalityIds){
    if(!Array.isArray(value)||value.length>3)stcFail("TRANSFER_SIGNINGS_INVALID");
    const seen=new Set();
    return value.map(item=>{
      // r87 (Nik 2026-10-30): a signing also carries the player's FIFA 17 overall (30-99), entered by his own manager and never
      // guessed; Russian Roster Roulette uses it for the board from season 2. Rows locked before r87 have none.
      // r87 (Nik 2026-10-30 16:53 UTC): and his FIFA 17 position (own only, never guessed), so the board can place him.
      const hasOverall=stcPlainHasOverall(item),hasPosition=Boolean(item&&typeof item==="object"&&Object.hasOwn(item,"position"));
      stcExact(item,["slot","name","leagueId","nationalityId",...(hasOverall?["overall"]:[]),...(hasPosition?["position"]:[])],"TRANSFER_SIGNINGS_INVALID");
      if(hasOverall&&!stcOverallValid(item.overall))stcFail("TRANSFER_SIGNINGS_INVALID");
      if(hasPosition&&!POSITIONS.includes(item.position))stcFail("TRANSFER_SIGNINGS_INVALID");
      if(!Number.isInteger(item.slot)||item.slot<1||item.slot>3||seen.has(item.slot))stcFail("TRANSFER_SIGNINGS_INVALID");
      seen.add(item.slot);
      const name=String(item.name||"").trim();
      if(!name||name.length>80||name!==item.name)stcFail("TRANSFER_SIGNINGS_INVALID");
      if(!leagueIds.has(item.leagueId)||!nationalityIds.has(item.nationalityId))stcFail("TRANSFER_SIGNINGS_INVALID");
      const row={slot:item.slot,name,leagueId:item.leagueId,nationalityId:item.nationalityId};
      if(hasOverall)row.overall=item.overall;if(hasPosition)row.position=item.position;
      return row;
    }).sort((a,b)=>a.slot-b.slot);
  }
  function stcInputs(value){
    stcExact(value,ROLES,"TRANSFER_STATE_INVALID");
    for(const role of ROLES){
      stcExact(value[role],["guesses","signings"],"TRANSFER_STATE_INVALID");
      if(value[role].guesses!==null&&!Array.isArray(value[role].guesses))stcFail("TRANSFER_STATE_INVALID");
      if(value[role].signings!==null&&!Array.isArray(value[role].signings))stcFail("TRANSFER_STATE_INVALID");
    }
    return value;
  }
  function stcReceipt(value){
    stcExact(value,["operationId","baseRevision","actorRole","type","commandHash"],"TRANSFER_STATE_INVALID");
    if(!OPERATION.test(value.operationId)||!Number.isInteger(value.baseRevision)||value.baseRevision<0||!ROLES.includes(value.actorRole)||typeof value.type!=="string"||!HASH.test(value.commandHash))stcFail("TRANSFER_STATE_INVALID");
    return value;
  }
  async function stcVerifyState(value,leagueIds,nationalityIds,cryptoImpl){
    stcExact(value,STATE_KEYS,"TRANSFER_STATE_INVALID");
    const state=stcClone(value),hash=state.contentHash;delete state.contentHash;
    if(value.schemaVersion!==1||value.runtimeRevision!==RUNTIME_REVISION||!Number.isInteger(value.seasonNumber)||value.seasonNumber<1||!ROLES.includes(value.coordinatorRole)||!PHASES.includes(value.phase)||!Number.isInteger(value.revision)||value.revision<1||!HASH.test(hash))stcFail("TRANSFER_STATE_INVALID");
    stcEpoch(value.startedAtEpochMs);
    if(value.endedAtEpochMs!==null)stcEpoch(value.endedAtEpochMs);
    stcRoleList(value.endRequestedRoles,"TRANSFER_STATE_INVALID");stcRoleList(value.guessLockedRoles,"TRANSFER_STATE_INVALID");stcRoleList(value.signingLockedRoles,"TRANSFER_STATE_INVALID");
    stcInputs(value.inputs);
    if(!Array.isArray(value.receipts)||value.receipts.length!==value.revision)stcFail("TRANSFER_STATE_INVALID");
    value.receipts.forEach(stcReceipt);
    if(new Set(value.receipts.map(receipt=>receipt.operationId)).size!==value.receipts.length)stcFail("TRANSFER_STATE_INVALID");
    if(value.receipts.some((receipt,index)=>receipt.baseRevision!==index))stcFail("TRANSFER_STATE_INVALID");
    for(const role of ROLES){
      const roleInput=value.inputs[role];
      if(roleInput.guesses!==null)stcNormalizeGuesses(roleInput.guesses,leagueIds,nationalityIds);
      if(roleInput.signings!==null)stcNormalizeSignings(roleInput.signings,leagueIds,nationalityIds);
      if(value.guessLockedRoles.includes(role)!==(roleInput.guesses!==null))stcFail("TRANSFER_STATE_INVALID");
      if(value.signingLockedRoles.includes(role)!==(roleInput.signings!==null))stcFail("TRANSFER_STATE_INVALID");
    }
    if(value.phase==="WINDOW_OPEN"&&(value.guessLockedRoles.length||value.signingLockedRoles.length||value.endedAtEpochMs!==null))stcFail("TRANSFER_STATE_INVALID");
    if(value.phase==="GUESS_ENTRY"&&(value.signingLockedRoles.length||value.endedAtEpochMs===null))stcFail("TRANSFER_STATE_INVALID");
    if(value.phase==="SIGNING_ENTRY"&&(value.guessLockedRoles.length!==2||value.signingLockedRoles.length>1||value.endedAtEpochMs===null))stcFail("TRANSFER_STATE_INVALID");
    if(value.phase==="COMPLETED"&&(value.guessLockedRoles.length!==2||value.signingLockedRoles.length!==2||value.endedAtEpochMs===null))stcFail("TRANSFER_STATE_INVALID");
    if(await stcHash(state,cryptoImpl)!==hash)stcFail("TRANSFER_STATE_HASH_MISMATCH");
    return stcFreeze(stcClone(value));
  }
  function stcCommand(value,leagueIds,nationalityIds){
    if(!stcPlain(value)||!OPERATION.test(String(value.operationId||""))||!Number.isInteger(value.baseRevision)||value.baseRevision<0||typeof value.type!=="string")stcFail("TRANSFER_COMMAND_INVALID");
    const common=["type","operationId","baseRevision"];
    if(value.type==="start-window"||value.type==="request-end-window"||value.type==="advance-expired-window")stcExact(value,common,"TRANSFER_COMMAND_INVALID");
    else if(value.type==="lock-guesses"){stcExact(value,[...common,"guesses"],"TRANSFER_COMMAND_INVALID");return {...value,guesses:stcNormalizeGuesses(value.guesses,leagueIds,nationalityIds)};}
    else if(value.type==="lock-signings"){stcExact(value,[...common,"signings"],"TRANSFER_COMMAND_INVALID");return {...value,signings:stcNormalizeSignings(value.signings,leagueIds,nationalityIds)};}
    else stcFail("TRANSFER_COMMAND_INVALID");
    return {...value};
  }
  function stcEvaluateRole(role,state){
    stcRole(role);
    if(state.phase!=="COMPLETED")stcFail("TRANSFER_VERDICT_NOT_READY");
    const opponent=role==="playerOne"?"playerTwo":"playerOne";
    const guesses=state.inputs[opponent].guesses||[];
    return (state.inputs[role].signings||[]).map(signing=>{
      const matchedBy=guesses.filter(guess=>(guess.type==="league"&&guess.valueId===signing.leagueId)||(guess.type==="nationality"&&guess.valueId===signing.nationalityId));
      return {...signing,release:matchedBy.length>0,matchedBy:matchedBy.map(guess=>({type:guess.type,valueId:guess.valueId}))};
    });
  }

  async function stcCreateProtocol({leagueIds,nationalityIds,cryptoImpl=root.crypto}={}){
    const leagues=stcCatalogIds(leagueIds,"TRANSFER_LEAGUE_CATALOG_INVALID"),nationalities=stcCatalogIds(nationalityIds,"TRANSFER_NATIONALITY_CATALOG_INVALID");
    async function stcSeal(core){return stcFreeze({...stcClone(core),contentHash:await stcHash(core,cryptoImpl)});}
    async function stcVerifyProtocolState(value){return stcVerifyState(value,leagues,nationalities,cryptoImpl);}
    async function stcApply({state=null,setup,careerStart,seasonNumber,actorRole,command,nowEpochMs}){
      const confirmed=stcConfirmedSetup(setup);stcCareerReady(careerStart);const role=stcRole(actorRole),now=stcEpoch(nowEpochMs),cmd=stcCommand(command,leagues,nationalities);
      if(!Number.isInteger(seasonNumber)||seasonNumber<1||seasonNumber>confirmed.totalSeasons)stcFail("TRANSFER_SEASON_INVALID");
      const current=state?await stcVerifyProtocolState(state):null;
      if(current&&current.seasonNumber!==seasonNumber)stcFail("TRANSFER_SEASON_MISMATCH");
      if(current&&current.coordinatorRole!==confirmed.coordinatorRole)stcFail("TRANSFER_COORDINATOR_MISMATCH");
      const commandHash=await stcHash({actorRole:role,...cmd},cryptoImpl);
      if(current){
        const prior=current.receipts.find(receipt=>receipt.operationId===cmd.operationId);
        if(prior){
          if(prior.actorRole!==role||prior.baseRevision!==cmd.baseRevision||prior.type!==cmd.type||prior.commandHash!==commandHash)stcFail("TRANSFER_IDEMPOTENCY_CONFLICT");
          return stcFreeze({ok:true,idempotent:true,state:current});
        }
      }
      const revision=current?current.revision:0;
      if(cmd.baseRevision!==revision)stcFail("TRANSFER_STALE_BASE_REVISION");
      if(!current&&cmd.type!=="start-window")stcFail("TRANSFER_NOT_STARTED");
      if(current&&cmd.type==="start-window")stcFail("TRANSFER_ALREADY_STARTED");
      if(current&&current.phase==="COMPLETED")stcFail("TRANSFER_ALREADY_COMPLETED");
      let core=current?stcClone(current):{
        schemaVersion:1,runtimeRevision:RUNTIME_REVISION,seasonNumber,coordinatorRole:confirmed.coordinatorRole,
        phase:"WINDOW_OPEN",revision:0,startedAtEpochMs:now,endedAtEpochMs:null,endRequestedRoles:[],guessLockedRoles:[],signingLockedRoles:[],
        inputs:{playerOne:{guesses:null,signings:null},playerTwo:{guesses:null,signings:null}},receipts:[]
      };
      delete core.contentHash;
      if(cmd.type==="start-window"){
        if(role!==confirmed.coordinatorRole)stcFail("TRANSFER_COORDINATOR_REQUIRED");
        core.startedAtEpochMs=now;
      }else if(cmd.type==="request-end-window"){
        if(core.phase!=="WINDOW_OPEN")stcFail("TRANSFER_PHASE_INVALID");
        if(core.endRequestedRoles.includes(role))stcFail("TRANSFER_END_ALREADY_REQUESTED");
        core.endRequestedRoles.push(role);
        if(core.endRequestedRoles.length===2){core.phase="GUESS_ENTRY";core.endedAtEpochMs=now;}
      }else if(cmd.type==="advance-expired-window"){
        if(core.phase!=="WINDOW_OPEN")stcFail("TRANSFER_PHASE_INVALID");
        if(now<core.startedAtEpochMs+WINDOW_MS)stcFail("TRANSFER_WINDOW_STILL_OPEN");
        core.phase="GUESS_ENTRY";core.endedAtEpochMs=now;
      }else if(cmd.type==="lock-guesses"){
        if(core.phase!=="GUESS_ENTRY")stcFail("TRANSFER_PHASE_INVALID");
        if(core.guessLockedRoles.includes(role))stcFail("TRANSFER_GUESSES_ALREADY_LOCKED");
        core.inputs[role].guesses=cmd.guesses;core.guessLockedRoles.push(role);
        if(core.guessLockedRoles.length===2)core.phase="SIGNING_ENTRY";
      }else if(cmd.type==="lock-signings"){
        if(core.phase!=="SIGNING_ENTRY")stcFail("TRANSFER_PHASE_INVALID");
        if(core.signingLockedRoles.includes(role))stcFail("TRANSFER_SIGNINGS_ALREADY_LOCKED");
        core.inputs[role].signings=cmd.signings;core.signingLockedRoles.push(role);
        if(core.signingLockedRoles.length===2)core.phase="COMPLETED";
      }
      core.receipts.push({operationId:cmd.operationId,baseRevision:revision,actorRole:role,type:cmd.type,commandHash});
      core.revision=revision+1;
      const next=await stcSeal(core);await stcVerifyProtocolState(next);
      return stcFreeze({ok:true,idempotent:false,state:next});
    }
    function stcProjectForRole(state,role){
      stcRole(role);const current=stcClone(state),opponent=role==="playerOne"?"playerTwo":"playerOne";
      if(current.phase!=="COMPLETED")current.inputs[opponent]={guesses:null,signings:null};
      const projection={
        schemaVersion:current.schemaVersion,runtimeRevision:current.runtimeRevision,seasonNumber:current.seasonNumber,coordinatorRole:current.coordinatorRole,
        phase:current.phase,revision:current.revision,startedAtEpochMs:current.startedAtEpochMs,endedAtEpochMs:current.endedAtEpochMs,
        endRequestedRoles:[...current.endRequestedRoles],guessLockedRoles:[...current.guessLockedRoles],signingLockedRoles:[...current.signingLockedRoles],
        managerRole:role,inputs:current.inputs,verdicts:current.phase==="COMPLETED"?{playerOne:stcEvaluateRole("playerOne",current),playerTwo:stcEvaluateRole("playerTwo",current)}:null
      };
      return stcFreeze(projection);
    }
    return stcFreeze({contractVersion:1,feature:"ssjr-shared-transfer-challenge",runtimeRevision:RUNTIME_REVISION,windowMs:WINDOW_MS,roles:ROLES,phases:PHASES,apply:stcApply,verifyState:stcVerifyProtocolState,projectForRole:stcProjectForRole,evaluateRole:(role,state)=>stcFreeze(stcEvaluateRole(role,state)),billingRequired:false,canonicalStorageMutation:false});
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-shared-transfer-challenge-protocol-factory",runtimeRevision:RUNTIME_REVISION,windowMs:WINDOW_MS,roles:ROLES,phases:PHASES,createProtocol:stcCreateProtocol,billingRequired:false,canonicalStorageMutation:false});
});

````

## FILE: js/rosterRouletteStep.js

````js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeRosterRouletteStep=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r87 Russian Roster Roulette, the season step (Nik 2026-10-28/29/30; look = Team V HO-040, approved 29 Oct). Every season,
  // before this manager's Transfer Challenge opens, both spins play in Team V's page in a full-screen frame, Daniel first, with
  // the outcome from js/rosterRoulette.js (the Showdown id decides, so both phones agree; HO040-M1); then he confirms the
  // release in his FIFA 17 save. The app never releases anyone itself. The boards build themselves (Nik 2026-10-30): the
  // FIFA 17 launch board excluding the Special Player, then each season's shot player out and kept signings in by position and overall, from
  // last seasons' Transfer War verdicts and saved shots (kept on this phone when they were shown; otherwise plain reads of
  // both verdict documents and the saved spins per missing season, all seasons at once; F2-12). No board is saved anywhere and nobody types one.
  // Shown once per manager per season on this browser (the watched spin is not replayed); never for a Showdown confirmed
  // before r87. A page that fails to load skips only the animation: the result and the release still show. Anything else that
  // fails (engine, data, an error) keeps the Transfer Challenge closed behind TRY AGAIN / BACK (red team R87-B-02): the seeded
  // shot still counts on later boards, so a manager must never reach the window without being told about it.
  const PAGE="visual-assets/v10_1/roulette/index.html";
  const STAGE_ID="rrStage",PANEL_ID="rrStepPanel";
  const DONE_KEY="careerModeShowdown.rouletteDone.v1",WATCHED_KEY="careerModeShowdown.rouletteWatched.v1",KEYS_MAX=60;
  // RRR_FROM_MS is set to the r87 release time in the release PR (red team R87-C-07: the placeholder below is earlier than
  // the r86 boundary, js/marqueePlayer.js MARQUEE_FROM_MS 03:00 UTC that day, so until the release PR pins it, r86
  // Showdowns confirmed after midnight would get a roulette). Do not change it outside the release PR.
  const RRR_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
  const MIN_LOADING_MS=1000,MAX_LOADING_MS=15000,LOAD_WAIT_MS=10000,ARMED_WAIT_MS=5000;
  const ROLES=Object.freeze(["playerOne","playerTwo"]),NAMES=Object.freeze({playerOne:"Daniel",playerTwo:"Nik"});
  const sceneFailedHere=new Set();
  // holding (Fable F2-17): from START until close() (or the way back to Home), so the screens that open the Transfer Challenge
  // keep counting the roulette as on screen while its release is saved and the window is navigated to. loading: the Reus Gate
  // loading screen, held from START until a card or the scene is ready (Fable F2-13).
  let running=null,leftForHome=false,holding=false,loading=null,loadingShows=0,loadingPrior=null;

  function rrsDoc(){return root.document||null;}
  function rrsWait(ms){return new Promise(resolve=>root.setTimeout(resolve,ms));}
  function rrsOther(role){return role==="playerOne"?"playerTwo":"playerOne";}
  function rrsKey(ctx){return `${ctx.rivalryId}|${ctx.season}|${ctx.managerRole}`;}
  // Both lists go through the app's storage helpers (js/storage.js), like every other browser-kept value.
  function rrsList(key){try{const value=JSON.parse(typeof root.readStorageValue==="function"&&root.readStorageValue(key)||"[]");return Array.isArray(value)?value.filter(item=>typeof item==="string"):[];}catch(_error){return [];}}
  function rrsHas(key,item){return rrsList(key).includes(item);}
  function rrsMark(key,item){try{const list=rrsList(key).filter(value=>value!==item);list.push(item);if(typeof root.writeStorageValue==="function")root.writeStorageValue(key,JSON.stringify(list.slice(-KEYS_MAX)));}catch(_error){}}
  async function rrsLoad(key,path,ready){if(ready())return true;if(typeof root.loadRuntimeScript!=="function")return false;await root.loadRuntimeScript(key,path,ready);return Boolean(ready());}
  // The Special Player draw (data/marqueePlayers.js + js/marqueePlayer.js), also wanted by the Transfer War signing form
  // (R87-SP-02) when this season's roulette is already done on this browser (Fable F2-06).
  function rrsEnsureDraw(){
    const loads=Promise.all([
      rrsLoad("marquee-player-list","data/marqueePlayers.js",()=>Boolean(root.CareerModeMarqueePlayers)),
      rrsLoad("marquee-player","js/marqueePlayer.js",()=>Boolean(root.CareerModeMarqueePlayer))
    ]).then(list=>list.every(Boolean),()=>false);
    return Promise.race([loads,rrsWait(LOAD_WAIT_MS).then(()=>false)]);
  }
  async function rrsEnsure(){
    const loads=Promise.all([
      rrsLoad("fifa17-players","data/fifa17Players.js",()=>Boolean(root.CareerModeFifa17Players)),
      rrsLoad("roster-squads","data/rosterSquads.js",()=>Boolean(root.CareerModeRosterSquads)),
      rrsLoad("roster-roulette","js/rosterRoulette.js",()=>Boolean(root.CareerModeRosterRoulette)),
      rrsLoad("marquee-player-list","data/marqueePlayers.js",()=>Boolean(root.CareerModeMarqueePlayers)),
      rrsLoad("marquee-player","js/marqueePlayer.js",()=>Boolean(root.CareerModeMarqueePlayer)),
      typeof root.loadRuntimeStyle==="function"?Promise.resolve(root.loadRuntimeStyle("roulette-step","css/v10Roulette.css")).then(()=>true,()=>true):true
    ]).then(list=>list.every(Boolean),()=>false);
    return Promise.race([loads,rrsWait(LOAD_WAIT_MS).then(()=>false)]);
  }

  // ctx = {rivalryId, managerRole, season, clubs:{playerOne,playerTwo}, confirmedAtMs, phase, verdicts(k)} from the Transfer
  // Challenge. True when this manager still has this season's roulette to do on this browser.
  function rrsDecide(ctx){
    if(root.CMS_ROSTER_ROULETTE==="off"||!ctx)return false;
    if(!/^pair_[0-9a-f]{64}$/.test(String(ctx.rivalryId||""))||!ROLES.includes(ctx.managerRole))return false;
    if(!Number.isInteger(ctx.season)||ctx.season<1||ctx.season>10)return false;
    if(!ctx.clubs||!ctx.clubs.playerOne||!ctx.clubs.playerTwo||ctx.phase==="COMPLETED")return false;
    if(!Number.isFinite(ctx.confirmedAtMs)||ctx.confirmedAtMs<RRR_FROM_MS)return false;
    const key=rrsKey(ctx);
    return !rrsHas(DONE_KEY,key);
  }

  // ---------- the panel (marble, like Career Start; no scrim: it sits on the scene or the page as an opaque card) ----------
  function rrsEl(tag,className,text){const node=rrsDoc().createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node;}
  function rrsButton(label,className,onClick){const button=rrsEl("button",className,label);button.type="button";button.addEventListener("click",onClick);return button;}
  function rrsRemovePanel(){const panel=rrsDoc()?.getElementById(PANEL_ID);if(panel)panel.remove();}
  function rrsPanel(ctx,heading,label){
    rrsRemovePanel();
    const overlay=rrsEl("div","remoteJoiningOverlay rrStepOverlay");overlay.id=PANEL_ID;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label",label);
    const shell=rrsEl("div","remoteJoiningShell rrStepShell"),header=rrsEl("div","remoteJoiningHeader");
    header.append(rrsEl("strong","",`SEASON ${ctx.season} · RUSSIAN ROSTER ROULETTE`));
    const body=rrsEl("div","rrStepBody");body.append(rrsEl("h2","rrStepTitle",heading));
    // No finished scene behind the card (WebGL missing, scene seen before a reload, history retry): stand it in the room, never on the page below.
    if(!rrsDoc().getElementById(STAGE_ID))overlay.classList.add("rrStepRoom");
    shell.append(header,body);overlay.append(shell);rrsDoc().body.append(overlay);
    return {overlay,body};
  }
  // A choice panel: resolves with the id of the button pressed. The card takes over from the loading screen; TRY AGAIN brings
  // the loading screen back over the card until the next card or the scene is ready (Reus Gate, Fable F2-13).
  function rrsAsk(ctx,{heading,label,lines=[],note="",buttons}){
    return new Promise(resolve=>{
      const {body}=rrsPanel(ctx,heading,label);rrsLoadingOff();
      for(const line of lines)body.append(rrsEl("p","rrStepLine",line));
      if(note)body.append(rrsEl("p","rrStepNote",note));
      const row=rrsEl("div","rrStepActions");
      for(const b of buttons)row.append(rrsButton(b.label,b.primary?"menuButton rrStepPrimary":"backButton",()=>{if(b.id==="retry")rrsLoadingOn();resolve(b.id);}));
      body.append(row);row.querySelector("button")?.focus();
    });
  }

  // ---------- season 2+: this manager's board ----------
  // The same rules as the engine and the Rules (js/rosterRoulette.js normalizeBoard), with a reason a person can act on.
  // Fable F2-09: the true reason for each answer; "the connection" only when it was the connection.
  function rrsReadError(result,season){
    const quota=root.CareerModeFirestoreBudget?.quotaMessage?.(result);if(quota)return quota;
    const code=String(result&&result.code||"");
    if(/permission/i.test(code))return `Season ${season}'s Transfer War could not be read: the Showdown is not open here. Go back to Showdown Home and open it again.`;
    if(code==="TRANSFER_NOT_COMPLETED")return `Season ${season}'s Transfer War never reached its verdicts, and this season's boards are built from them. Nothing was spun or saved.`;
    if(/STALE|MISMATCH/.test(code))return `This Showdown moved on while this screen was open, so Season ${season}'s Transfer War no longer matches it. Go back to Showdown Home and open it again.`;
    if(!code||/unavailable|deadline|offline|network|aborted|timeout|PROVIDER_FAILED/i.test(code))return `Season ${season}'s Transfer War could not be reached: the connection dropped. Try again when it is back.`;
    return `Season ${season}'s Transfer War could not be read (${code}). Nothing was spun or saved.`;
  }
  // The Special Players both phones drew for this Showdown (js/marqueePlayer.js): {role:{name, overall, number,
  // sourceName}}, or null for a Showdown confirmed before the Special Player. The engine excludes BOTH from both boards
  // (red team R87-C-01) by his own squad database row: name + shirt number (R87-C-05), under the database name when it
  // differs from the display name (R87-D-01, data/marqueePlayers.js sourceNames).
  function rrsSpecial(ctx){
    const draw=root.CareerModeMarqueePlayer,picks=draw&&draw.forShowdown(ctx.rivalryId,ctx.confirmedAtMs);
    const sourceNames=(root.CareerModeMarqueePlayers&&root.CareerModeMarqueePlayers.sourceNames)||{};
    return picks?Object.fromEntries(ROLES.map(role=>[role,{name:picks[role].name,overall:picks[role].overall,number:picks[role].number,
      sourceName:Object.prototype.hasOwnProperty.call(sourceNames,picks[role].name)?sourceNames[picks[role].name]:null}])):null;
  }
  /* rrsSpecial end */
  // A cosmetic seed for the scene (red team R87-C-06): from the Showdown id and the season, the same on both phones.
  function rrsSeed(ctx){return (parseInt(String(ctx.rivalryId).slice(-8),16)^Math.imul(ctx.season,0x9E3779B1))>>>0;}
  // history[k] = both managers' Transfer War verdicts of season k, for every season before this one; null when the
  // manager leaves.
  // F2-02: also the outcomes each season's spin marks saved (hits[k], or null when that season has none): the engine replays
  // them as the authority. F2-12: all missing seasons are asked for at once; TRY AGAIN asks again only for those that failed.
  async function rrsHistory(ctx,hits){
    const history=[null];
    const first=new Map();for(let k=1;k<ctx.season;k+=1)first.set(k,Promise.resolve(ctx.verdicts(k)).catch(()=>null));
    for(let k=1;k<ctx.season;k+=1){
      for(let attempt=0;;attempt+=1){
        const result=attempt===0?await first.get(k):await ctx.verdicts(k);
        if(result&&result.ok){history.push(result.verdicts);hits[k]=result.hits||null;break;}
        const choice=await rrsAsk(ctx,{heading:"Building the boards",label:"Building the boards",lines:[rrsReadError(result,k)],buttons:[{id:"retry",label:"TRY AGAIN",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
        if(choice==="back")return null;
      }
    }
    return history;
  }

  // ---------- the spins (Team V's page in a frame) ----------
  function rrsShowLoading(){
    const doc=rrsDoc(),el=doc&&doc.getElementById("loadingScreen");if(!el)return {hide(){}};
    // A show during the previous fade keeps the words from before the roulette, not its own.
    const text=doc.getElementById("loadingText"),fading=Boolean(loadingPrior&&el.classList.contains("is-exiting")&&!el.hidden);
    const priorText=fading?loadingPrior.text:text?text.textContent:"",priorLabel=fading?loadingPrior.label:el.getAttribute("aria-label");loadingPrior={text:priorText,label:priorLabel};
    el.style.transition="none";el.classList.remove("is-exiting","hidden");el.hidden=false;el.removeAttribute("aria-hidden");el.setAttribute("aria-busy","true");el.setAttribute("aria-label","Loading the revolver");
    if(text)text.textContent="LOADING THE REVOLVER";
    void el.offsetWidth;el.style.transition="";
    const shows=++loadingShows;let hidden=false;
    return {hide(){
      if(hidden)return;hidden=true;el.setAttribute("aria-hidden","true");el.setAttribute("aria-busy","false");el.classList.add("is-exiting");
      root.setTimeout(()=>{if(shows!==loadingShows)return;/* shown again (TRY AGAIN) during the fade */el.hidden=true;el.classList.add("hidden");if(text)text.textContent=priorText;if(priorLabel!==null)el.setAttribute("aria-label",priorLabel);},240);
    }};
  }
  function rrsLoadingOn(){if(!loading)loading=rrsShowLoading();}
  function rrsLoadingOff(){const shown=loading;loading=null;if(shown)shown.hide();}
  // A wait that only counts time the page was on screen (Fable F2-07): a phone locked or switched away while the scene loads
  // does not use up the wait, so a scene that would have worked is not skipped the moment the manager comes back.
  function rrsVisibleWait(ms,onTimeout){
    const doc=rrsDoc();let timer=null,stopped=false,away=false;
    const hidden=()=>Boolean(doc&&doc.visibilityState==="hidden");
    const onVisibility=()=>{if(hidden())away=true;};
    const arm=()=>{timer=root.setTimeout(()=>{if(stopped)return;if(away||hidden()){away=hidden();arm();return;}stop();onTimeout();},ms);};
    const stop=()=>{stopped=true;root.clearTimeout(timer);doc?.removeEventListener?.("visibilitychange",onVisibility);};
    doc?.addEventListener?.("visibilitychange",onVisibility);arm();
    return stop;
  }
  function rrsRemoveStage(){const stage=rrsDoc()?.getElementById(STAGE_ID);if(stage)stage.remove();}
  function rrsCreateStage(ctx){
    const doc=rrsDoc();rrsRemoveStage();
    const stage=doc.createElement("div");stage.id=STAGE_ID;stage.setAttribute("role","dialog");stage.setAttribute("aria-modal","true");stage.setAttribute("aria-label","Russian Roster Roulette");
    stage.style.cssText="position:fixed;inset:0;z-index:95;background:#050403;visibility:hidden";
    const frame=doc.createElement("iframe");frame.title="Russian Roster Roulette";
    const base=typeof root.optionalAssetUrl==="function"?root.optionalAssetUrl(PAGE):PAGE;
    frame.src=`${base}${base.includes("?")?"&":"?"}embed=1&d=${encodeURIComponent(ctx.clubs.playerOne)}&n=${encodeURIComponent(ctx.clubs.playerTwo)}`;
    frame.style.cssText="display:block;width:100%;height:100%;border:0;background:#050403";
    stage.append(frame);doc.body.append(stage);
    return {stage,frame};
  }
  function rrsListen(frame){
    const origin=root.location&&root.location.origin;let onReady,onDone,onArmed;
    const ready=new Promise(resolve=>{onReady=resolve;}),done=new Promise(resolve=>{onDone=resolve;}),armed=new Promise(resolve=>{onArmed=resolve;});
    const handler=event=>{
      if(event.source!==frame.contentWindow||event.origin!==origin||!event.data)return;
      if(event.data.type==="cms-rr-ready")onReady("ready");
      else if(event.data.type==="cms-rr-armed")onArmed("armed");
      else if(event.data.type==="cms-rr-error"){onReady("error");onArmed("error");onDone("error");}
      else if(event.data.type==="cms-rr-continue")onDone("continue");
    };
    root.addEventListener("message",handler);
    // A page that loads without its 3D library, or not at all, is dropped at once instead of after the full wait.
    frame.addEventListener("load",()=>{try{const view=frame.contentWindow;if(view&&String(view.location.href)==="about:blank")return;if(!view||!view.THREE)onReady("error");}catch(_error){onReady("error");}});
    frame.addEventListener("error",()=>onReady("error"));
    const stopWait=rrsVisibleWait(MAX_LOADING_MS,()=>onReady("timeout"));
    return {ready:ready.finally(stopWait),armed,done,stop(){root.removeEventListener("message",handler);stopWait();}};
  }
  // "watched" when both spins played to the end, "skipped" when the page could not run (the result still shows).
  async function rrsScene(ctx,plan){
    // The loading screen (held since START) covers a card left from a TRY AGAIN; the card goes now, so it can never stand over
    // the scene with dead buttons (Fable F2-03).
    rrsLoadingOn();rrsRemovePanel();
    const shownAt=Date.now();let channel=null,stage=null,frame=null;
    try{
      ({stage,frame}=rrsCreateStage(ctx));channel=rrsListen(frame);
      if(await channel.ready!=="ready")throw new Error("Roulette page did not start.");
      const boardOf=role=>plan.boards[role].map(p=>({pos:p.pos,position:p.positions[0]||null,name:p.name||"EMPTY SLOT",special:p.special===true,rating:p.name&&p.rating>0?p.rating:null,number:p.name&&Number.isInteger(p.number)?p.number:null}));
      // The whole spin plan (red team R87-C-06): the scene loads bulletChamber, stops on stopChamber and aims at hitSlot
      // (a safe turn at aimSlot), so both phones show the same chambers and the same player.
      const turns=plan.turns.map(turn=>({fire:turn.fired,target:turn.player?turn.player.name:null,targetLabel:turn.player?rrsPlayerLabel(turn.player):null,targetNumber:turn.player?rrsPlayerFacts(turn.player).number:null,targetPosition:turn.player?rrsPlayerFacts(turn.player).position:null,targetRating:turn.player?rrsPlayerFacts(turn.player).rating:null,bulletChamber:turn.bulletChamber,stopChamber:turn.stopChamber,hitSlot:turn.hitSlot,aimSlot:turn.aimSlot}));
      frame.contentWindow.postMessage({type:"cms-rr-setup",d:ctx.clubs.playerOne,n:ctx.clubs.playerTwo,boards:{D:boardOf("playerOne"),N:boardOf("playerTwo")},formations:{D:plan.formations.playerOne,N:plan.formations.playerTwo},turns,seed:rrsSeed(ctx)},root.location.origin);
      // Red team RT5-FLOW-01: the stage stays hidden until the page says it took the setup ("cms-rr-armed"). A page that
      // drops it (its squads file failed) or never answers is removed after ARMED_WAIT_MS and the result panel shows.
      let stopArmed=()=>{};
      const armed=await Promise.race([channel.armed,new Promise(resolve=>{stopArmed=rrsVisibleWait(ARMED_WAIT_MS,()=>resolve("timeout"));})]);
      stopArmed();
      if(armed!=="armed")throw new Error("Roulette page did not take the spins.");
      const left=MIN_LOADING_MS-(Date.now()-shownAt);if(left>0)await rrsWait(left);
      stage.style.visibility="visible";
    }catch(_error){if(channel)channel.stop();sceneFailedHere.add(rrsKey(ctx));rrsRemoveStage();return "skipped";}// the result card takes over from the loading screen
    rrsLoadingOff();
    try{frame.focus();}catch(_error){}
    const end=await channel.done;channel.stop();
    if(end!=="continue"){sceneFailedHere.add(rrsKey(ctx));return "skipped";}
    return "watched";
  }

  // ---------- the result and the release ----------
  // Codex C2-01: a name alone does not tell namesakes apart (Alavés has a Manu García #19 and #26), so the release names the
  // shirt number (when the squad lists one), the position and the overall.
  function rrsPlayerFacts(p){
    const number=Number.isInteger(p&&p.number)?p.number:null,position=(p&&Array.isArray(p.positions)&&p.positions[0])||(p&&p.pos&&p.pos!=="SUB"?p.pos:null),rating=p&&Number.isInteger(p.rating)&&p.rating>0?p.rating:null;
    return {number,position,rating};
  }
  function rrsPlayerLabel(p){
    const f=rrsPlayerFacts(p),parts=[f.number!==null?`#${f.number}`:null,f.position,f.rating!==null?`${f.rating} overall`:null].filter(Boolean);
    return parts.length?`${p.name} (${parts.join(", ")})`:String(p.name);
  }
  function rrsOutcomeLine(turn){return turn.fired?`${NAMES[turn.role]} lost ${rrsPlayerLabel(turn.player)}.`:`${NAMES[turn.role]}: empty chamber. Squad safe.`;}
  // F2-19 (Fable job 2): a kept signing the board rules keep off is said in one line, never dropped silently. Signings are known
  // by name only, so a name the roulette shot, a Special Player's, or a guessed and released signing's keeps him off the board.
  const RRS_SKIP_WHY=Object.freeze({
    shot:name=>`the roulette shot a ${name}, and a shot player never comes back.`,
    special:name=>`${name} is a Special Player's name, and a Special Player is never on a board.`,
    guessed:name=>`a ${name} was guessed and released in the Transfer War, and a released player stays off the board.`});
  function rrsSkippedLines(plan,role){
    const list=plan&&plan.skipped&&Array.isArray(plan.skipped[role])?plan.skipped[role]:[];
    return list.filter(item=>item&&typeof item.name==="string"&&RRS_SKIP_WHY[item.reason]).map(item=>`${item.name} (signed in season ${item.season}) is not on your board: ${RRS_SKIP_WHY[item.reason](item.name)}`);
  }
  async function rrsResult(ctx,plan){
    const mine=plan.turns.find(turn=>turn.role===ctx.managerRole);
    const lines=[...plan.turns.map(rrsOutcomeLine),...rrsSkippedLines(plan,ctx.managerRole)];
    const choice=mine.fired
      ?await rrsAsk(ctx,{heading:`Release ${mine.player.name}${Number.isInteger(mine.player.number)?` #${mine.player.number}`:""}`,label:"Release your player",lines,
        note:`Release ${rrsPlayerLabel(mine.player)} in your FIFA 17 save now, before the transfer window. The game can't do it for you.`,
        buttons:[{id:"go",label:"I'VE RELEASED HIM",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]})
      :await rrsAsk(ctx,{heading:"Your squad is safe",label:"Your squad is safe",lines,note:"Your squad stays as it is this season.",
        buttons:[{id:"go",label:"GO TO THE TRANSFER WINDOW",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
    return choice==="go";
  }

  // ---------- F2-02 / F2-10: the spin marks on the server ----------
  // ctx.marks = this season's marks as the Transfer Challenge read them ({playerOne, playerTwo}: true, an outcome, or null), or
  // null once the window opened (both managers had spun: START needs both marks). An outcome is {fired, hitName, hitNumber,
  // hitSlot, hitSignedSeason, version}.
  function rrsOutcomeOf(entry){return entry&&typeof entry==="object"&&typeof entry.fired==="boolean"&&typeof entry.version==="string"?entry:null;}
  function rrsSpunOnServer(ctx){return ctx.windowStarted===true||Boolean(ctx.marks&&ctx.marks[ctx.managerRole]);}
  // F2-02: the partner spun this season on a different version of the game (another build, or other squad data), so the two
  // phones could show different players. Said plainly, never a silent desync. TRY AGAIN reads the marks again (after either
  // phone was updated); the partner's saved spin stands for him either way, so CONTINUE goes on with it as the authority.
  async function rrsVersionStop(ctx,version){
    for(;;){
      const partner=rrsOutcomeOf(ctx.marks&&ctx.marks[rrsOther(ctx.managerRole)]);
      if(!version||!partner||partner.version===version||rrsSpunOnServer(ctx)&&ctx.marks&&ctx.marks[ctx.managerRole])return true;
      const name=NAMES[rrsOther(ctx.managerRole)];
      const choice=await rrsAsk(ctx,{heading:"Update the game on the other phone",label:"Update the game on the other phone",
        lines:[`${name} spun this season's roulette on a different version of the game, so the two phones could show different players.`,`Update the game on ${name}'s phone: close it fully and open it again. If yours is the one behind, do the same on yours. Then tap TRY AGAIN.`],
        note:`Your version: ${version} · ${name}'s spin: ${partner.version}. ${name}'s saved spin stands for him either way.`,
        buttons:[{id:"retry",label:"TRY AGAIN",primary:true},{id:"continue",label:`CONTINUE WITH ${name.toUpperCase()}'S SAVED SPIN`},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
      if(choice==="back")return false;
      if(choice==="continue")return true;
      if(typeof ctx.refreshMarks==="function"){try{const next=await ctx.refreshMarks();if(next&&typeof next==="object"){ctx.marks=next.marks===undefined?ctx.marks:next.marks;ctx.windowStarted=next.windowStarted===true;}}catch(_error){}}
    }
  }

  // Fable F2-04: why no plan could be built, in words a manager can act on (the engine only answers null).
  function rrsNoPlanReason(ctx,engine,history){
    for(const role of ROLES){
      const club=ctx.clubs[role];
      if(!engine.board(club)||!root.CareerModeFifa17Players?.clubs?.[club])return `There is no FIFA 17 squad for ${club} in this version of the app, so this season's boards cannot be built. Nothing was spun or saved.`;
    }
    for(let k=1;k<ctx.season;k+=1)if(!history[k]||!ROLES.every(role=>Array.isArray(history[k][role])))return `Season ${k}'s Transfer War verdicts could not be used to build this season's boards. Nothing was spun or saved.`;
    return "This season's boards could not be built. Nothing was spun or saved.";
  }
  async function rrsRun(ctx){
    if(!rrsDecide(ctx)||!rrsDoc())return true;
    rrsLoadingOn();
    while(!await rrsEnsure()){
      const choice=await rrsAsk(ctx,{heading:"Loading the roulette",label:"Loading the roulette",lines:["The roulette could not load. Check the connection and try again."],buttons:[{id:"retry",label:"TRY AGAIN",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
      if(choice==="back")return false;
    }
    const engine=root.CareerModeRosterRoulette,key=rrsKey(ctx),special=rrsSpecial(ctx);
    const version=typeof engine.version==="function"?engine.version(ctx.clubs,{special}):null;
    if(!await rrsVersionStop(ctx,version))return false;
    const hits={};
    const history=ctx.season>1?await rrsHistory(ctx,hits):[null];if(!history)return false;
    // This season: a saved mark (this manager's own on a second browser, the partner's always) is the authority for that turn.
    hits[ctx.season]=Object.fromEntries(ROLES.map(role=>[role,rrsOutcomeOf(ctx.marks&&ctx.marks[role])]));
    // Never skipped (Nik 2026-10-31): a short squad shows empty slots and the bullet only hits a real player. A club the data
    // does not know is named before the engine runs (Fable S4); no plan is never marked done (Fable F2-04): the window stays
    // shut and the card says why, with the way back to Showdown Home.
    const known=ROLES.every(role=>engine.board(ctx.clubs[role])&&root.CareerModeFifa17Players?.clubs?.[ctx.clubs[role]]);
    const plan=known?engine.forSeason(ctx.rivalryId,ctx.clubs,ctx.season,{special,history,hits}):null;
    if(!plan||plan.turns.some(turn=>turn.fired&&!turn.player)){
      const reason=plan?"This season's spin could not find the player it hit. Nothing was spun or saved.":rrsNoPlanReason(ctx,engine,history);
      await rrsAsk(ctx,{heading:"No roulette board",label:"No roulette board",lines:[reason],note:"The transfer window stays shut until this season's roulette can run.",buttons:[{id:"back",label:"BACK TO SHOWDOWN HOME",primary:true}]});
      return false;
    }
    // F2-10: the server already holds this manager's spin for this season (another browser or tab, or cleared storage): the
    // result card shows it at once, with no second spin.
    const spun=rrsSpunOnServer(ctx);
    if(spun)rrsMark(WATCHED_KEY,key);
    if(!spun&&!rrsHas(WATCHED_KEY,key)&&!sceneFailedHere.has(key)){
      const scene=await rrsScene(ctx,plan);
      if(scene==="watched")rrsMark(WATCHED_KEY,key);
    }
    const go=await rrsResult(ctx,plan);
    if(!go)return false;
    // F2-02: the outcome this manager's mark records (only while the server has none for him this season).
    if(!spun&&typeof ctx.remember==="function"&&typeof engine.outcome==="function"){try{ctx.remember(engine.outcome(plan,ctx.managerRole,version));}catch(_error){}}
    rrsMark(DONE_KEY,key);
    return true;
  }
  // An unexpected error asks TRY AGAIN / BACK; the same seeded plan is rebuilt on retry and nothing is marked done.
  async function rrsRunGuarded(ctx){
    for(;;){
      try{return await rrsRun(ctx);}
      catch(_error){
        rrsRemoveStage();
        const choice=await rrsAsk(ctx,{heading:"The roulette hit a problem",label:"The roulette hit a problem",lines:["This season's spins could not be built. Nothing was spun or saved."],buttons:[{id:"retry",label:"TRY AGAIN",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
        if(choice==="back")return false;
      }
    }
  }
  // Resolves true when the Transfer Challenge may open, false when the manager went back to Showdown Home (or the step could
  // not even show its panel). Never rejects, and never opens the Transfer Challenge without this season's result.
  // The panel and the stage stay up until close() so nothing shows between them and the next screen.
  function rrsRunBeforeTransfers(ctx){
    if(running)return running;
    leftForHome=false;holding=true;
    const run=Promise.resolve().then(()=>rrsRunGuarded(ctx)).catch(()=>false).then(go=>{
      if(go===false){leftForHome=true;holding=false;rrsRemovePanel();rrsRemoveStage();rrsLoadingOff();if(typeof root.navigateTo==="function")void Promise.resolve(root.navigateTo("mainMenu")).catch(()=>{});}
      return go!==false;
    }).finally(()=>{if(running===run)running=null;});
    running=run;return run;
  }
  function rrsClose(){holding=false;rrsRemovePanel();rrsRemoveStage();rrsLoadingOff();return true;}
  // Red team R87-SP-02: for the Transfer War signing form, is a typed name this manager's own Special Player? The draw is
  // loaded before every window opens (ensureDraw, also when the roulette is already done here: Fable F2-06); false when the
  // Showdown has none.
  function rrsIsOwnSpecial(rivalryId,confirmedAtMs,role,name){
    const draw=root.CareerModeMarqueePlayer;
    try{return Boolean(draw&&typeof draw.isOwnSpecial==="function"&&draw.isOwnSpecial(rivalryId,confirmedAtMs,role,name));}catch(_error){return false;}
  }
  // For the screens that open the Transfer Challenge: a roulette is on screen (its pace is the manager's, so no load timeout
  // may end it), and whether the last one ended with the manager going back to Showdown Home (not a failure).
  function rrsActive(){return Boolean(running)||holding;}
  function rrsWentHome(){return leftForHome;}
  // Fable F2-11: a new open forgets an earlier BACK, so a later failure that never reached the roulette is not read as one.
  function rrsForgetHome(){leftForHome=false;return true;}

  return Object.freeze({contractVersion:1,feature:"cms-roster-roulette-step",page:PAGE,stageId:STAGE_ID,panelId:PANEL_ID,doneKey:DONE_KEY,watchedKey:WATCHED_KEY,fromMs:RRR_FROM_MS,decide:rrsDecide,runBeforeTransfers:rrsRunBeforeTransfers,close:rrsClose,active:rrsActive,wentHome:rrsWentHome,forgetHome:rrsForgetHome,ensureDraw:rrsEnsureDraw,isOwnSpecial:rrsIsOwnSpecial});
});

````

## FILE: js/marqueePlayer.js

````js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeMarqueePlayer=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r86 Special Player (Nik 2026-10-27): each manager gets one player from the FIFA 17 top 200, never the same one.
  // The draw is read from the Showdown's own Firebase id (64 random hex digits, the same on both phones), so it costs no
  // read, no write and no Rules change, and nothing is added to any hashed document (Sol round 2 design rule). Only a
  // Showdown confirmed on r86 or later has a Special Player: older Showdowns and saves show none, never an error.
  // The confirm time is the shared Setup's last updatedAt (the Rules pin it to request.time at SHOWDOWN_CONFIRMED).
  // MARQUEE_FROM_MS is the r86 release time (red team #3): the release PR's start, 2026-10-30 03:00 UTC. Showdowns
  // confirmed before it get no Special Player.
  const MARQUEE_FROM_MS=Date.parse("2026-10-30T03:00:00Z");
  const RIVALRY_ID=/^pair_([0-9a-f]{64})$/;
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  // Ranking badge (Nik): top 3 black-blue-gold, top 10 blue-gold, top 20 gold, top 50 silver, others bronze.
  const TIERS=Object.freeze([[3,"black-blue-gold"],[10,"blue-gold"],[20,"gold"],[50,"silver"],[Infinity,"bronze"]]);

  function mpList(){
    const list=root.CareerModeMarqueePlayers||(typeof module!=="undefined"&&module.exports?require("../data/marqueePlayers.js"):null);
    return list&&Array.isArray(list.players)&&list.players.length>1?list:null;
  }
  function mpTier(rank){return Number.isInteger(rank)&&rank>0?TIERS.find(([top])=>rank<=top)[1]:null;}
  // Two distinct positions from the id. Its first hex digit is the season count (js/persistentNikDanielPair.js), so the
  // draw uses digits 9-16 for Daniel's player and 17-24 to move Nik's along the rest; both are browser randomness.
  function mpPicks(rivalryId,size){
    const match=RIVALRY_ID.exec(String(rivalryId||""));
    if(!match||!Number.isInteger(size)||size<2)return null;
    const a=parseInt(match[1].slice(8,16),16)%size,b=(a+1+parseInt(match[1].slice(16,24),16)%(size-1))%size;
    return {playerOne:a,playerTwo:b};
  }
  function mpPlayer(row,listVersion){
    return Object.freeze({listVersion,rank:row.rank,name:row.name,club:row.club??null,overall:row.overall,potential:row.potential,number:Number.isInteger(row.number)?row.number:null,
      nation:row.nation??null,nationCode:row.nationCode??null,position:row.position??null,stats:row.stats?Object.freeze({...row.stats}):null,tier:mpTier(row.rank)});
  }
  function mpMillis(at){
    if(Number.isFinite(at))return at;
    if(at&&typeof at.toMillis==="function"){const value=at.toMillis();return Number.isFinite(value)?value:null;}
    if(at instanceof Date){const value=at.getTime();return Number.isFinite(value)?value:null;}
    return null;
  }
  // {playerOne, playerTwo} for a Showdown confirmed at confirmedAt (millis, Timestamp or Date), or null (none).
  // fromMs is for tests and galleries only.
  function mpForShowdown(rivalryId,confirmedAt,{fromMs=MARQUEE_FROM_MS}={}){
    const at=mpMillis(confirmedAt),list=mpList();
    if(at===null||at<fromMs||!list)return null;
    const picks=mpPicks(rivalryId,list.players.length);
    if(!picks)return null;
    return Object.freeze(Object.fromEntries(ROLES.map(role=>[role,mpPlayer(list.players[picks[role]],list.listVersion)])));
  }
  // The same pair for a Showdown being set up on this build right now (the reveal): no confirm time yet.
  function mpForNewShowdown(rivalryId){return mpForShowdown(rivalryId,Number.MAX_SAFE_INTEGER,{fromMs:0});}
  // Red team R87-SP-02: is a typed Transfer War signing name this manager's own Special Player? Names compare with accents
  // folded, trimmed and lower-cased, against the display name and the squad database name (data/marqueePlayers.js
  // sourceNames, R87-D-01). No initials guessing. False when the Showdown has no Special Player.
  const mpFold=name=>String(name||"").normalize("NFD").replace(/[̀-ͯ]/g,"").trim().toLowerCase();
  function mpIsOwnSpecial(rivalryId,confirmedAt,role,name){
    const pair=ROLES.includes(role)&&mpFold(name)?mpForShowdown(rivalryId,confirmedAt):null;
    if(!pair)return false;
    const list=mpList(),player=pair[role],source=list&&list.sourceNames&&Object.prototype.hasOwnProperty.call(list.sourceNames,player.name)?list.sourceNames[player.name]:null;
    return [player.name,source].some(n=>n&&mpFold(n)===mpFold(name));
  }

  return Object.freeze({contractVersion:1,feature:"cms-marquee-player",fromMs:MARQUEE_FROM_MS,roles:ROLES,tier:mpTier,picks:mpPicks,forShowdown:mpForShowdown,forNewShowdown:mpForNewShowdown,isOwnSpecial:mpIsOwnSpecial});
});

````

## FILE: js/sparkSharedTransferChallenge.js (EXCERPT: lines 185-200)

````js
    const opponentInputs=state.phase==="COMPLETED"&&ctx.opponent?{guesses:stspClone(ctx.opponent.guesses),signings:stspClone(ctx.opponent.signings)}:null;let verdicts=null;
    if(state.phase==="COMPLETED"){
      if(!ctx.own||!ctx.opponent||!ctx.own.guesses||!ctx.own.signings||!ctx.opponent.guesses||!ctx.opponent.signings)stspFail("TRANSFER_PRIVATE_STATE_INVALID");
      const inputs={};inputs[ctx.role]=ctx.own;inputs[ctx.opponentRole]=ctx.opponent;const evalState={phase:"COMPLETED",inputs};
      verdicts={playerOne:stspProtocolVerdict("playerOne",evalState),playerTwo:stspProtocolVerdict("playerTwo",evalState)};
    }
    return stspFreeze({ok:true,revision:state.revision,state:stspClone(state),managerRole:ctx.role,seasonNumber:ctx.seasonNumber,spunRoles:null,spinMarks:null,ownInputs,opponentInputs,verdicts});
  }
  function stspProtocolVerdict(role,state){
    const opponent=role==="playerOne"?"playerTwo":"playerOne",guesses=state.inputs[opponent].guesses||[];
    return (state.inputs[role].signings||[]).map(signing=>{const matchedBy=guesses.filter(guess=>(guess.type==="league"&&guess.valueId===signing.leagueId)||(guess.type==="nationality"&&guess.valueId===signing.nationalityId));return {...signing,release:matchedBy.length>0,matchedBy:matchedBy.map(guess=>({type:guess.type,valueId:guess.valueId}))};});
  }
  // RS-02 (r87): one pass. The opponent's private document is read only after this same pass has seen the public document
  // COMPLETED (the Rules allow it only then); before, a COMPLETED season read the whole context twice (17 gets in one transaction).
  async function stspRead(options={}){try{return await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{return stspProjection(await stspContext(options,transaction,{readOpponent:"ifCompleted"}));});}catch(error){return stspResultError(error);}}
  async function stspMutate(options,type,payload){

````

## FILE: js/productionSharedTransferChallenge.js (EXCERPT: lines 485-560)

````js
      if(!step.decide(ctx)){rouletteClearedKey=request.key;await pstcAfterSpin(request);return true;}
      const go=await step.runBeforeTransfers(ctx);
      if(go){rouletteClearedKey=request.key;await pstcAfterSpin(request);}
      return go;
    }catch(_error){rouletteError=PSTC_ROULETTE_TEXT.error;return false;}
  }
  // r87 roulette boards: each finished season's verdicts (both managers' signings, overall and release) are kept on this
  // phone when the Transfer Challenge shows them, so the next spins build their boards with no read. A season not kept
  // here (another phone, cleared storage) costs one Transfer Challenge read, once.
  const PSTC_ROULETTE_VERDICTS_KEY="careerModeShowdown.rouletteVerdicts.v1",PSTC_ROULETTE_VERDICTS_MAX=40;
  function pstcVerdictRows(rows){return Array.isArray(rows)?rows.map(row=>({slot:row.slot,name:row.name,overall:Number.isInteger(row.overall)?row.overall:null,position:SIGNING_POSITIONS.includes(row.position)?row.position:null,release:row.release===true})):null;}
  function pstcVerdictList(){try{const value=JSON.parse(typeof root.readStorageValue==="function"&&root.readStorageValue(PSTC_ROULETTE_VERDICTS_KEY)||"[]");return Array.isArray(value)?value.filter(item=>Array.isArray(item)&&item.length===2&&typeof item[0]==="string"):[];}catch(_error){return [];}}
  function pstcKeptVerdicts(rivalryId,season){const found=pstcVerdictList().find(item=>item[0]===`${rivalryId}|${season}`),value=found&&found[1];return value&&Array.isArray(value.playerOne)&&Array.isArray(value.playerTwo)?value:null;}
  function pstcKeepVerdicts(rivalryId,season,verdicts){
    const value={playerOne:pstcVerdictRows(verdicts?.playerOne),playerTwo:pstcVerdictRows(verdicts?.playerTwo)};if(!rivalryId||!value.playerOne||!value.playerTwo)return null;
    try{const key=`${rivalryId}|${season}`,list=pstcVerdictList().filter(item=>item[0]!==key);list.push([key,value]);if(typeof root.writeStorageValue==="function")root.writeStorageValue(PSTC_ROULETTE_VERDICTS_KEY,JSON.stringify(list.slice(-PSTC_ROULETTE_VERDICTS_MAX)));}catch(_error){}
    return value;
  }
  // F2-02: each season's saved outcomes ({playerOne, playerTwo}: an outcome or null) once both are known for good: from the
  // durable record, or from the pre-window marks once both managers have one (the record START writes is their exact copy).
  const PSTC_ROULETTE_HITS_KEY="careerModeShowdown.rouletteHits.v1";
  function pstcHitList(){try{const value=JSON.parse(typeof root.readStorageValue==="function"&&root.readStorageValue(PSTC_ROULETTE_HITS_KEY)||"[]");return Array.isArray(value)?value.filter(item=>Array.isArray(item)&&item.length===2&&typeof item[0]==="string"):[];}catch(_error){return [];}}
  function pstcOutcomeCopy(entry){return entry&&typeof entry==="object"&&provider?.outcomeValid?.(entry)?{fired:entry.fired,hitName:entry.hitName,hitNumber:entry.hitNumber,hitSlot:entry.hitSlot,hitSignedSeason:entry.hitSignedSeason,version:entry.version}:null;}
  function pstcKeptHits(rivalryId,season){const found=pstcHitList().find(item=>item[0]===`${rivalryId}|${season}`),value=found&&found[1];return value&&typeof value==="object"&&Object.hasOwn(value,"playerOne")&&Object.hasOwn(value,"playerTwo")?value:null;}
  function pstcKeepHits(rivalryId,season,hits){
    const value={playerOne:pstcOutcomeCopy(hits?.playerOne),playerTwo:pstcOutcomeCopy(hits?.playerTwo)};if(!rivalryId)return value;
    try{const key=`${rivalryId}|${season}`,list=pstcHitList().filter(item=>item[0]!==key);list.push([key,value]);if(typeof root.writeStorageValue==="function")root.writeStorageValue(PSTC_ROULETTE_HITS_KEY,JSON.stringify(list.slice(-PSTC_ROULETTE_VERDICTS_MAX)));}catch(_error){}
    return value;
  }
  function pstcKeepMarks(rivalryId,season,marks){if(marks&&marks.playerOne&&marks.playerTwo)pstcKeepHits(rivalryId,season,marks);}
  // F2-12 (Fable job 2): a season missing here is read with plain document gets (both role documents and the spin record; one
  // record get when the verdicts are already kept), not the full prerequisite transaction with a forced token refresh.
  async function pstcRouletteServices(){
    const runtime=root.CareerModeProductionFirebaseRuntime;if(!runtime||typeof runtime.ensureAccountServices!=="function")pstcFail("TRANSFER_PROVIDER_UNAVAILABLE");
    const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices());
    if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)pstcFail("TRANSFER_PROVIDER_UNAVAILABLE");
    const base=services.firestoreSdk;
    const sdk=(root.CareerModeFirestoreBudget?.meterSdk||(s=>s))(typeof base.getDoc==="function"?base:{...base,getDoc:(await import(runtime.firebaseFirestoreModule)).getDoc});
    return {user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:sdk};
  }
  async function pstcRouletteVerdicts(request,season){
    try{
      const kept=pstcKeptVerdicts(request.rivalryId,season),keptHits=pstcKeptHits(request.rivalryId,season);
      if(kept&&keptHits)return {ok:true,verdicts:kept,hits:keptHits};
      await pstcEnsureDependencies();
      const role=view?.managerRole||pstcSetupState()?.managerRole;if(!role)pstcFail("TRANSFER_PROVIDER_UNAVAILABLE");
      if(typeof provider.readRouletteSeason!=="function")pstcFail("TRANSFER_PROVIDER_UNAVAILABLE");
      const result=await provider.readRouletteSeason({...await pstcRouletteServices(),rivalryId:request.rivalryId,seasonNumber:season,managerRole:role,verdicts:!kept});
      if(!result||result.ok!==true)return {ok:false,code:result?.code||"TRANSFER_PROVIDER_FAILED"};
      const value=kept||pstcKeepVerdicts(request.rivalryId,season,result.verdicts);
      if(!value)return {ok:false,code:"TRANSFER_PROVIDER_STATE_INVALID"};
      return {ok:true,verdicts:value,hits:pstcKeepHits(request.rivalryId,season,result.hits)};
    }catch(error){return {ok:false,code:error?.code||"TRANSFER_PROVIDER_FAILED"};}
  }
  // F2-02: the outcome this manager's own mark records, kept on this phone until the mark is on the server (a reload re-sends
  // exactly the same one; the Rules accept one write per role and season).
  const PSTC_ROULETTE_OUTCOME_KEY="careerModeShowdown.rouletteOutcome.v1";
  function pstcOutcomeList(){try{const value=JSON.parse(typeof root.readStorageValue==="function"&&root.readStorageValue(PSTC_ROULETTE_OUTCOME_KEY)||"[]");return Array.isArray(value)?value.filter(item=>Array.isArray(item)&&item.length===2&&typeof item[0]==="string"):[];}catch(_error){return [];}}
  const pstcOutcomeKey=(request,role)=>`${request.rivalryId}|${request.seasonNumber}|${role}`;
  function pstcRememberOutcome(request,role,outcome){
    const copy=pstcOutcomeCopy(outcome);if(!request||!role||!copy)return false;
    try{const key=pstcOutcomeKey(request,role),list=pstcOutcomeList().filter(item=>item[0]!==key);list.push([key,copy]);if(typeof root.writeStorageValue==="function")root.writeStorageValue(PSTC_ROULETTE_OUTCOME_KEY,JSON.stringify(list.slice(-PSTC_ROULETTE_VERDICTS_MAX)));}catch(_error){}
    pendingOutcome={key:pstcOutcomeKey(request,role),outcome:copy};return true;
  }
  let pendingOutcome=null;
  function pstcPendingOutcome(request,role){const key=pstcOutcomeKey(request,role);if(pendingOutcome&&pendingOutcome.key===key)return pendingOutcome.outcome;const found=pstcOutcomeList().find(item=>item[0]===key);return found?pstcOutcomeCopy(found[1]):null;}
  // ---- RT5-FLOW-02: both spins before the shared window ----
  // The roulette applies to a Showdown confirmed at or after the step's RRR_FROM_MS while it is not switched off; any other
  // season (an older Showdown) passes by itself and never writes or waits for a mark.
  // The provider's own eligibility rule (it enforces START with it), so the screen and the provider can never disagree.
  function pstcRouletteAppliesTo(confirmedAtMs,step){return Boolean(step&&typeof provider?.rouletteEligible==="function"&&provider.rouletteEligible(confirmedAtMs));}
  // The same answer START gets from the provider: the season is roulette-eligible, or any mark is already stored. The second
  // case covers the roulette being switched off (or the season otherwise turning ineligible) after one manager's mark was
  // saved: the provider still waits for both, so the missing manager's phone writes his own mark when it reaches this step,
  // with no roulette shown (pstcAfterSpin), and the coordinator's START flips through the listener as usual (Codex P2 #1101).
  function pstcRouletteApplies(request=pstcRequestContext()){if(pstcSpunRoles().length>0)return true;if(request&&rouletteGate.key===request.key)return rouletteGate.applies;return Boolean(typeof provider?.rouletteEligible==="function"&&provider.rouletteEligible(pstcSetupState()?.setupUpdatedAtMs));}

````

## FILE: js/transferScreenV10.js (EXCERPT: lines 1-130)

````js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeTransferScreenV10=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // JOB-27 (G-13 part 2d): Team V's Transfer War skin (visual-assets/v10_1/tr2/slice-02-plate, pinned 5e05a1f)
  // on the shared Transfer Challenge screen. Skin, don't rewire:
  // - js/productionSharedTransferChallenge.js keeps rendering into its own elements. While the skin is mounted those
  //   very elements (same ids, classes, data-* hooks, text and listeners) are moved into Team V's layout, and they
  //   go back to their original place when the skin unmounts or redraws. The status line is drawn by Team V's sign
  //   from production's own status text.
  // - Team V's own copies of those elements are dropped; Team V elements that only label things keep a "tw-" id.
  // - The frame is built from the production view the module already exposes (getState) and from the text it already
  //   rendered. The rival's guesses and signings are read only when the provider has revealed them (COMPLETED).
  const SCREEN="transferChallenge";
  const DIR="tr2/slice-02-plate/";
  const FILES=Object.freeze({
    css:Object.freeze([DIR+"plate.css","../../css/v10Transfer.css"]),
    script:Object.freeze(["v10-transfer-plate",DIR+"plate.js",()=>Boolean(root.TWPlate&&typeof root.TWPlate.render==="function")]),
    platemap:DIR+"platemap.json"
  });
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const LAYOUTS=Object.freeze({window:"WINDOW_OPEN",guess_entry:"GUESS_ENTRY",signing_entry:"SIGNING_ENTRY",completed:"COMPLETED"});
  // Team V's approved copy (fixtures.json "strings" at 5e05a1f, f1Action as factory/v1-wtt5ye 273115c) for the labels Team V draws itself. Production keeps
  // every text it renders (status, buttons, timer, lock summary, errors): those elements are the production ones.
  const STRINGS=Object.freeze({
    title:"SEASON {season} · TRANSFER WAR",back:"HOME",refresh:"REFRESH",rail:Object.freeze(["Window","Guesses","Signings","Verdicts"]),railAriaLabel:"Transfer War progress",
    f1Intro:"Ends early only if you both agree.",f1RulesLine:"15 MIN · 3 SIGNINGS · 3 GUESSES",f1Action:"REQUEST EARLY END",f1ActionRequested:"EARLY END REQUESTED ✓",
    ruleNote:"Guess a league or nationality. A matching signing must be released.",
    guessHeading:"Guess {RIVAL}'s signings",privacyNote:"Hidden from {RIVAL} until you both lock.",
    selectPlaceholder:"Guess type",selectLeague:"League",selectNationality:"Nationality",valuePlaceholder:"Pick a type first",primary:"LOCK GUESSES",
    signWindowClosed:"WINDOW CLOSED",tagYou:"YOU",tagSealed:"SEALED",tagPrivate:"PRIVATE",
    signingPrimary:"LOCK MY SIGNINGS",signingInvalid:"Complete signing {n} with player name, position, overall (30-99), previous league and nationality.",
    signingPlaceholderName:"Player name",signingPlaceholderLeague:"Previous league",signingPlaceholderNationality:"Nationality",signingPlaceholderOverall:"OVR",signingPlaceholderPosition:"POS",
    verdictHeading:"{MANAGER} · {CLUB}",verdictEmpty:"No signings were entered.",verdictRelease:"RELEASE · MATCHED BY RIVAL GUESS",verdictKeep:"KEEP · NO RIVAL GUESS MATCH",
    continueLabel:"SEASON RESULTS NEXT",guessRevealHeading:"{GUESSER} guesses {OWNER}'s signings"
  });
  const tfNode=typeof module!=="undefined"&&module.exports;

  function tfFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(tfFreeze);Object.freeze(value);}return value;}
  const tfText=value=>String(value??"").trim();
  const tfOther=role=>role==="playerOne"?"playerTwo":"playerOne";
  function tfLabel(label,kind,id){
    const value=tfText(id);if(!value)return "";
    try{const option=typeof label==="function"?label(kind,value):null;if(option&&tfText(option.label))return tfText(option.label);}catch(_error){}
    return value;
  }
  function tfSigningRows(rows,label){
    return (Array.isArray(rows)?rows:[]).filter(row=>row&&Number.isInteger(row.slot)).map(row=>({slot:row.slot,name:tfText(row.name),league:tfLabel(label,"league",row.leagueId),nationality:tfLabel(label,"nationality",row.nationalityId),overall:Number.isInteger(row.overall)?row.overall:null,position:typeof row.position==="string"?row.position:null})).sort((a,b)=>a.slot-b.slot);
  }
  function tfGuessRows(rows,label){
    return (Array.isArray(rows)?rows:[]).filter(row=>row&&(row.type==="league"||row.type==="nationality")).slice().sort((a,b)=>(a.slot||0)-(b.slot||0)).map(row=>({type:row.type,value:tfLabel(label,row.type,row.valueId)}));
  }

  // Pure: the production view plus what production already rendered -> the frame Team V's layout is drawn from.
  // input: {active, view, step (#transferChallenge data-transfer-phase), replay (data-shared-transfer-replay), status,
  //         managers {playerOne, playerTwo}, clubs {playerOne, playerTwo}, label(kind, id) -> {label}}
  // Returns null (keep the app's own screen) when the shared challenge has no view or role yet.
  function toTransferFrame(input){
    const source=input||{},view=source.view;
    if(source.active!==true||!view||typeof view!=="object")return null;
    const role=view.managerRole;
    if(!ROLES.includes(role))return null;
    const phase=LAYOUTS[source.step];
    if(!phase)return null;
    const state=view.state&&typeof view.state==="object"?view.state:null,actual=state&&state.phase?String(state.phase):"NOT_STARTED";
    const replay=Boolean(source.replay),season=Number(view.seasonNumber);
    if(!Number.isInteger(season)||season<1)return null;
    const managers={},clubs={};
    for(const r of ROLES){managers[r]=tfText(source.managers&&source.managers[r])||(r==="playerOne"?"Manager 1":"Manager 2");clubs[r]=tfText(source.clubs&&source.clubs[r])||"Club";}
    const frame={screen:SCREEN,phase,viewer:role,replay,actualPhase:actual,season,managers,clubs,status:tfText(source.status),
      windowLive:phase==="WINDOW_OPEN"&&actual==="WINDOW_OPEN"&&!replay,
      endRequested:phase==="WINDOW_OPEN"&&actual==="WINDOW_OPEN"&&!replay&&Array.isArray(state&&state.endRequestedRoles)&&state.endRequestedRoles.includes(role),
      guessesLocked:phase==="GUESS_ENTRY"&&(replay||(Array.isArray(state&&state.guessLockedRoles)&&state.guessLockedRoles.includes(role))),
      // A historical replay keeps production's own (read-only, disabled by production) signing fields in the rows.
      signingsLocked:phase==="SIGNING_ENTRY"&&!replay&&Array.isArray(state&&state.signingLockedRoles)&&state.signingLockedRoles.includes(role),
      ownSignings:[],verdicts:null};
    // Own committed signings read back when they are locked (own data only).
    if(frame.signingsLocked)frame.ownSignings=tfSigningRows(view.ownInputs&&view.ownInputs.signings,source.label);
    // Both sides only after the provider revealed them: COMPLETED, not a replay, with provider verdicts.
    if(phase==="COMPLETED"&&actual==="COMPLETED"&&!replay&&view.verdicts&&typeof view.verdicts==="object"){
      const guessesBy={},verdicts={};
      guessesBy[role]=tfGuessRows(view.ownInputs&&view.ownInputs.guesses,source.label);
      guessesBy[tfOther(role)]=tfGuessRows(view.opponentInputs&&view.opponentInputs.guesses,source.label);
      for(const r of ROLES){
        verdicts[r]=(Array.isArray(view.verdicts[r])?view.verdicts[r]:[]).filter(row=>row&&Number.isInteger(row.slot)).map(row=>({slot:row.slot,release:row.release===true,
          name:tfText(row.name),league:tfLabel(source.label,"league",row.leagueId),nationality:tfLabel(source.label,"nationality",row.nationalityId)})).sort((a,b)=>a.slot-b.slot);
      }
      // guessesAgainst[r]: the rival's guesses against r's signings (why a signing is released).
      frame.verdicts={rows:verdicts,guessesAgainst:{playerOne:guessesBy.playerTwo,playerTwo:guessesBy.playerOne}};
    }
    frame.key=JSON.stringify([frame.phase,frame.viewer,frame.replay,frame.actualPhase,frame.season,managers,clubs,frame.status,frame.windowLive,frame.endRequested,frame.guessesLocked,frame.signingsLocked,frame.ownSignings,frame.verdicts]);
    return tfFreeze(frame);
  }

  // Pure: frame -> the fixtures shape Team V's plate.js renders (one frame, "LIVE"). No fixture data is used.
  function toPlateFixtures(frame){
    if(!frame)throw new TypeError("TRANSFER_V10_FRAME");
    const rival=tfOther(frame.viewer),fill=(text,map)=>Object.keys(map).reduce((out,key)=>out.split(`{${key}}`).join(map[key]),text);
    const strings={...STRINGS,rail:STRINGS.rail.slice(),
      title:fill(STRINGS.title,{season:String(frame.season)}),
      f1Intro:frame.windowLive?STRINGS.f1Intro:"",
      // plate.js picks the Nik-viewer string when Nik views and the Daniel-viewer string when Daniel views.
      guessHeadingNikViewer:fill(STRINGS.guessHeading,{RIVAL:frame.managers.playerOne}),guessHeadingDanielViewer:fill(STRINGS.guessHeading,{RIVAL:frame.managers.playerTwo}),
      privacyNoteNikViewer:fill(STRINGS.privacyNote,{RIVAL:frame.managers.playerOne}),privacyNoteDanielViewer:fill(STRINGS.privacyNote,{RIVAL:frame.managers.playerTwo}),
      nameplateOne:frame.managers.playerOne.toUpperCase(),nameplateTwo:frame.managers.playerTwo.toUpperCase(),
      // Status lines: exactly the text production shows in #transferPhaseStatus.
      f1Status:frame.status,guessStatus:frame.status,signingStatus:frame.status,signingStatusLocked:frame.status,completedStatus:frame.status,
      signingLockSummary:""};
    const inputs={playerOne:{signings:[],guessesAgainstRival:[]},playerTwo:{signings:[],guessesAgainstRival:[]}},results={live:{playerOne:[],playerTwo:[]}};
    if(frame.signingsLocked)inputs[frame.viewer].signings=frame.ownSignings.map(row=>({...row}));
    if(frame.verdicts){
      for(const r of ROLES){
        inputs[r].signings=frame.verdicts.rows[r].map(row=>({slot:row.slot,name:row.name,league:row.league,nationality:row.nationality}));
        results.live[r]=frame.verdicts.rows[r].map(row=>({slot:row.slot,release:row.release}));
        // plate.js reads the guesses against r from inputs[rival(r)].guessesAgainstRival.
        inputs[tfOther(r)].guessesAgainstRival=frame.verdicts.guessesAgainst[r].map(row=>({...row}));
      }
    }
    const cfg={viewer:frame.viewer,phase:frame.phase,timerSeconds:0,endRequested:frame.endRequested,signingsLocked:frame.signingsLocked,result:"live"};
    return {managers:{...frame.managers},clubs:{...frame.clubs},seasonNumber:frame.season,frames:{LIVE:cfg},strings,inputs,results,rival};
  }

  // Which production elements go into Team V's layout for a frame. Own fields only, by the production prefixes:
  // signings p1 = Daniel (playerOne) / p2 = Nik; guesses are named after the manager they target.
  function adoptionPlan(frame){
    const own=frame.viewer==="playerOne"?"p1":"p2",guess=frame.viewer==="playerOne"?"p2":"p1",ids=["transferChallengeError","refreshSharedTransferChallenge"];
    const extras=[];

````

## FILE: js/ruleBook.js (EXCERPT: lines 55-70)

````js
            "Both managers can agree to end the transfer window early. One manager cannot end it alone.",
            "Your opponent gets three guesses. Each guess is a league or a nationality.",
            "If a guess matches one of your signings, release that player before the season starts.",
            "Type each signing's FIFA 17 overall. Only you see it, and it is never part of a guess.",
            "Your Special Player is a free extra signing: he never counts toward the three, and guesses never release him.",
            // r87 Russian Roster Roulette (Nik 2026-10-30: "in rule screen mention special player wont get hit").
            "Before each transfer window, Daniel and then Nik spin the Roster Roulette. One spin in seven fires and hits one player on your starting XI or 4 best subs: release him in FIFA 17.",
            "Your Special Player is never on your board, so he is never hit. Every player on your board has the same chance.",
            "Your board builds itself: your FIFA 17 launch squad. From season 2, a lost player is replaced by a kept signing or the bench, with reserves filling in, so your board shows 11 starters and 4 subs. Only if your club runs out of players does a place stay empty: the roulette still spins, and the bullet only ever hits a real player."
        ]),
        createScoringRuleSection(),
        createRuleSection("05", "CONNECTION & RECOVERY", [
            "Connect once before your first Showdown. After that, the same account and browser stay connected.",
            "A new browser may need to connect again.",
            "The browser keeps a backup copy for recovery. You can't play from it.",
            "Type in results by hand from FIFA 17. No screenshots or notes needed."

````

## FILE: data/marqueePlayers.js (EXCERPT: first 3000 bytes of 67997; the rest has the same shape)

````js
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeMarqueePlayers=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  // r86 Special Player (Nik 2026-10-27): the FIFA 17 top players by potential, then overall, from the game's LAUNCH
  // database (Nik 2026-10-28 "Launch data, re-rank all 200", HO-037; widened to the top 300 the same day): SoFIFA roster 170002, September 2016, 17,597 players
  // (players_17.csv, raw.githubusercontent.com/ifrankandrade/data-visualization). Ties share a competition rank, and a tie
  // at the cut is kept whole (Nik's pick): all 8 players at 85/75 are in, so the list has 305 rows. Gabriel Jesus is not in the launch
  // database, so he is not here.
  // Every value is the launch value from the same row: club, overall, potential, shirt number (team_jersey_number), nation
  // (nationCode ISO 3166, GB-ENG/GB-WLS for the home nations), position (first listed) and stats, the six card-face
  // stats as published (DIV HAN KIC REF SPD POS for goalkeepers), never computed here.
  // The order is part of the draw (js/marqueePlayer.js picks by position): never reorder rows or change who is in them
  // once released; a new list is a new LIST_VERSION.
  const LIST_VERSION=1;
  const PLAYERS=Object.freeze([
    {"rank":1,"name":"Neymar","club":"FC Barcelona","overall":92,"potential":95,"number":11,"nation":"Brazil","nationCode":"BR","position":"LW","stats":{"PAC":91,"SHO":84,"PAS":78,"DRI":95,"DEF":30,"PHY":56}},
    {"rank":2,"name":"Cristiano Ronaldo","club":"Real Madrid","overall":94,"potential":94,"number":7,"nation":"Portugal","nationCode":"PT","position":"LW","stats":{"PAC":92,"SHO":92,"PAS":81,"DRI":91,"DEF":33,"PHY":80}},
    {"rank":3,"name":"P. Pogba","club":"Manchester United","overall":88,"potential":94,"number":6,"nation":"France","nationCode":"FR","position":"CM","stats":{"PAC":77,"SHO":80,"PAS":83,"DRI":87,"DEF":72,"PHY":87}},
    {"rank":4,"name":"L. Messi","club":"FC Barcelona","overall":93,"potential":93,"number":10,"nation":"Argentina","nationCode":"AR","position":"RW","stats":{"PAC":89,"SHO":90,"PAS":86,"DRI":96,"DEF":26,"PHY":61}},
    {"rank":5,"name":"T. Courtois","club":"Chelsea","overall":89,"potential":93,"number":13,"nation":"Belgium","nationCode":"BE","position":"GK","stats":{"DIV":84,"HAN":91,"KIC":69,"REF":89,"SPD":49,"POS":86}},
    {"rank":6,"name":"M. Neuer","club":"FC Bayern München","overall":92,"potential":92,"number":1,"nation":"Germany","nationCode":"DE","position":"GK","stats":{"DIV":89,"HAN":90,"KIC":95,"REF":89,"SPD":60,"POS":91}},
    {"rank":6,"name":"L. Suárez","club":"FC Barcelona","overall":92,"potential":92,"number":9,"nation":"Uruguay","nationCode":"UY","position":"ST","stats":{"PAC":82,"SHO":90,"PAS":79,"DRI":87,"DEF":42,"PHY":79}},
    {"rank":8,"name":"De Gea","club":"Manchester United","overall":90,"potential":92,"number":1,"nation":"Spain","nationCode"
````

## FILE: data/fifa17Players.js

````js
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeFifa17Players=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  // Generated by scripts/build-fifa17-rosters.py; do not edit rows by hand.
  // SoFIFA FIFA 17 launch roster 170002, players_17.csv: https://raw.githubusercontent.com/ifrankandrade/data-visualization/main/datasets/players_17.csv
  // Club is the outer key. Player rows follow columns; positions are in source preference order.
  const formations={"4-2-3-1 (2)":["GK","RB","RCB","LCB","LB","RDM","LDM","RM","CAM","LM","ST"],"4-1-4-1":["GK","RB","RCB","LCB","LB","CDM","RM","RCM","LCM","LM","ST"],"4-4-2":["GK","RB","RCB","LCB","LB","RM","RCM","LCM","LM","RS","LS"],"4-3-3 (2)":["GK","RB","RCB","LCB","LB","CDM","RCM","LCM","RW","ST","LW"],"4-1-2-1-2 (2)":["GK","RB","RCB","LCB","LB","CDM","RCM","LCM","CAM","RS","LS"],"5-3-2":["GK","RWB","RCB","CB","LCB","LWB","RCM","CM","LCM","RS","LS"],"4-4-1-1":["GK","RB","RCB","LCB","LB","RM","RCM","LCM","LM","CF","ST"],"4-3-3 (4)":["GK","RB","RCB","LCB","LB","RCM","LCM","CAM","RW","ST","LW"],"4-4-2 (2)":["GK","RB","RCB","LCB","LB","RM","RDM","LDM","LM","RS","LS"],"3-5-2":["GK","RCB","CB","LCB","RDM","LDM","RM","CAM","LM","RS","LS"],"4-3-3":["GK","RB","RCB","LCB","LB","RCM","CM","LCM","RW","ST","LW"],"3-4-1-2":["GK","RCB","CB","LCB","RM","RCM","LCM","LM","CAM","RS","LS"],"4-2-2-2":["GK","RB","RCB","LCB","LB","RDM","LDM","RAM","LAM","RS","LS"],"4-3-1-2":["GK","RB","RCB","LCB","LB","RCM","CM","LCM","CAM","RS","LS"],"4-1-2-1-2":["GK","RB","RCB","LCB","LB","CDM","RM","LM","CAM","RS","LS"],"3-4-3 Flat":["GK","RCB","CB","LCB","RM","RCM","LCM","LM","RW","ST","LW"],"3-4-2-1":["GK","RCB","CB","LCB","RM","RCM","LCM","LM","RF","LF","ST"],"4-2-3-1":["GK","RB","RCB","LCB","LB","RDM","LDM","RAM","CAM","LAM","ST"],"3-1-4-2":["GK","RCB","CB","LCB","CDM","RM","RCM","LCM","LM","RS","LS"],"4-3-2-1":["GK","RB","RCB","LCB","LB","RCM","CM","LCM","RF","LF","ST"]};
  const clubs={
    "Arsenal":{"formation":"4-2-3-1 (2)","slots":["CAM","GK","LM","RDM","LCB","RM","LDM","RCB","ST","LB","RB"],"players":[["M. Özil",89,["CAM","LW"],"CAM",11,"Germany"],["P. Čech",88,["GK"],"GK",33,"Czech Republic"],["A. Sánchez",87,["LW","LM","RW"],"LM",7,"Chile"],["Santi Cazorla",86,["CAM","CM","CDM"],"RDM",19,"Spain"],["L. Koscielny",85,["CB"],"LCB",6,"France"],["A. Ramsey",84,["CM","CDM","RW"],"RM",8,"Wales"],["G. Xhaka",84,["CM"],"LDM",29,"Switzerland"],["S. Mustafi",83,["CB"],"RCB",20,"Germany"],["P. Mertesacker",83,["CB"],"SUB",4,"Germany"],["O. Giroud",83,["ST"],"ST",12,"France"],["F. Coquelin",81,["CDM","CM"],"SUB",34,"France"],["T. Walcott",81,["LM","ST","RW","RM"],"SUB",14,"England"],["Nacho Monreal",81,["LB"],"LB",18,"Spain"],["Lucas Pérez",81,["ST"],"SUB",9,"Spain"],["D. Welbeck",80,["ST","LM"],"SUB",23,"England"],["K. Gibbs",80,["LB"],"SUB",3,"England"],["M. Debuchy",80,["RB"],"RES",2,"France"],["Héctor Bellerín",79,["RB"],"RB",24,"Spain"],["A. Oxlade-Chamberlain",79,["RM","RW"],"SUB",15,"England"],["Gabriel",79,["CB"],"SUB",5,"Brazil"],["D. Ospina",79,["GK"],"SUB",13,"Colombia"],["M. Elneny",74,["CDM","CM"],"SUB",35,"Egypt"],["C. Jenkinson",73,["RB"],"RES",25,"England"],["A. Iwobi",70,["LM","RM","ST"],"SUB",17,"Nigeria"],["Y. Sanogo",69,["ST"],"RES",22,"France"],["G. Zelalem",67,["CM"],"RES",40,"United States"],["R. Holding",67,["CB","RB"],"SUB",16,"England"],["A. Maitland-Niles",65,["RM","CM"],"RES",55,"England"],["C. Akpom",64,["ST"],"RES",32,"England"],["J. Reine-Adelaïde",63,["CAM","RW"],"RES",31,"France"],["K. Bielik",61,["CB","CDM"],"RES",37,"Poland"],["C. Willock",56,["ST"],"RES",68,"England"],["M. Macey",52,["GK"],"RES",54,"England"]],"reserves":[["M. Debuchy",80,["RB"],"RES",2,"France"],["K. Gibbs",80,["LB"],"SUB",3,"England"],["D. Welbeck",80,["ST","LM"],"SUB",23,"England"]]},
    "Bournemouth":{"formation":"4-1-4-1","slots":["RCM","ST","GK","CDM","LCM","RCB","LCB","LM","LB","RM","RB"],"players":[["J. Wilshere",82,["CM","CDM","CAM"],"RCM",32,"England"],["M. Gradel",79,["LW","RW","ST"],"SUB",10,"Ivory Coast"],["C. Wilson",76,["ST"],"ST",13,"England"],["A. Boruc",76,["GK"],"GK",1,"Poland"],["A. Surman",75,["CM","CDM"],"CDM",6,"England"],["B. Afobe",74,["ST"],"SUB",9,"England"],["H. Arter",74,["CM","CAM"],"LCM",8,"Republic of Ireland"],["M. Wilson",74,["CB","LB","CDM"],"RES",20,"Republic of Ireland"],["S. Francis",73,["CB","RB"],"RCB",2,"England"],["A. Federici",73,["GK"],"SUB",23,"Australia"],["N. Aké",72,["LB"],"SUB",5,"Netherlands"],["R. Fraser",72,["LM","RM"],"SUB",24,"Scotland"],["S. Cook",72,["CB"],"LCB",3,"England"],["J. King",72,["ST","LM"],"LM",17,"Norway"],["D. Gosling",72,["CM"],"SUB",4,"England"],["M. Pugh",72,["LM"],"SUB",7,"England"],["C. Daniels",72,["LB"],"LB",11,"England"],["L. Cook",71,["CM","CDM","CAM"],"SUB",18,"England"],["J. Ibe",71,["LW","RW"],"RM",33,"England"],["T. Mings",71,["LB"],"SUB",26,"England"],["A. Smith",71,["RB"],"RB",15,"England"],["J. Stanislas",70,["LM","RM"],"SUB",19,"England"],["L. Grabban",70,["ST"],"SUB",28,"England"],["L. Mousset",68,["ST"],"RES",31,"France"],["E. Hyndman",65,["CM"],"RES",22,"United States"],["B. Smith",65,["LB","LWB"],"SUB",14,"Australia"],["R. Allsop",64,["GK"],"RES",21,"England"],["J. Lee",59,["RB"],"RES",47,"England"],["O. Harfield",59,["LB"],"RES",40,"England"],["C. Jordan",56,["CB"],"RES",37,"England"],["J. Holmes",54,["GK"],"RES",45,"Australia"],["P. O'Flaherty",54,["GK"],"RES",41,"England"],["C. Buckley",51,["LB","CB"],"RES",43,"England"]],"reserves":[["D. Gosling",72,["CM"],"SUB",4,"England"],["N. Aké",72,["LB"],"SUB",5,"Netherlands"],["M. Pugh",72,["LM"],"SUB",7,"England"]]},
    "Burnley":{"formation":"4-4-2","slots":["LCM","GK","RCB","RS","RB","LCB","LS","LB","LM","RCM","RM"],"players":[["S. Defour",79,["CM"],"LCM",16,"Belgium"],["T. Heaton",76,["GK"],"GK",1,"England"],["M. Keane",75,["CB","RB"],"RCB",5,"England"],["A. Gray",75,["ST"],"RS",7,"England"],["M. Lowton",75,["RB"],"RB",2,"England"],["B. Mee",74,["CB","LB"],"LCB",6,"England"],["J. Flanagan",73,["RB","LB"],"SUB",4,"England"],["S. Vokes",73,["ST"],"LS",9,"Wales"],["J. Hendrick",72,["CM"],"SUB",13,"Republic of Ireland"],["J. Gudmundsson",72,["RM","CAM"],"SUB",25,"Iceland"],["S. Ward",72,["LB"],"LB",23,"Republic of Ireland"],["S. Arfield",72,["LM","CM"],"LM",37,"Canada"],["P. Bamford",71,["ST","RM"],"SUB",15,"England"],["J. Tarkowski",71,["CB"],"SUB",26,"England"],["A. Barnes",71,["ST","CAM"],"SUB",10,"Austria"],["D. Marney",71,["CM"],"RCM",8,"England"],["G. Boyd",71,["RM"],"RM",21,"Scotland"],["T. Darikwa",70,["RB"],"SUB",27,"England"],["P. Robinson",70,["GK"],"SUB",17,"England"],["M. Kightly",70,["LM","RM"],"SUB",11,"England"],["K. Long",66,["CB"],"SUB",28,"Republic of Ireland"],["N. Pope",64,["GK"],"SUB",29,"England"],["A. O'Neill",62,["CM"],"SUB",41,"Australia"],["J. Dunne",58,["CB"],"RES",44,"Republic of Ireland"],["R. Leitch",58,["CM","CDM"],"RES",45,"Scotland"],["B. Jackson",55,["LM"],"RES",48,"England"],["C. Mitchell",54,["GK"],"RES",36,"Northern Ireland"],["J. Thomas",53,["ST","CF"],"RES",51,"Wales"],["A. Birch",53,["RB"],"RES",49,"England"],["T. Olomowewe",53,["CB"],"RES",50,"Nigeria"],["F. Yao",52,["CM"],"RES",52,"Ivory Coast"],["C. Hill",51,["LM"],"RES",54,"England"],["T. Aghayere",51,["GK"],"RES",53,"Spain"]],"reserves":[["A. Barnes",71,["ST","CAM"],"SUB",10,"Austria"],["J. Tarkowski",71,["CB"],"SUB",26,"England"],["M. Kightly",70,["LM","RM"],"SUB",11,"England"]]},
    "Chelsea":{"formation":"4-3-3 (2)","slots":["GK","LW","RCM","ST","RW","LCB","LB","LCM","RCB","CDM","RB"],"players":[["T. Courtois",89,["GK"],"GK",13,"Belgium"],["E. Hazard",88,["LM","CAM","LW"],"LW",10,"Belgium"],["Cesc Fàbregas",86,["CM","CAM"],"RCM",4,"Spain"],["Diego Costa",85,["ST"],"ST",19,"Spain"],["Willian",85,["RM","CAM"],"RW",22,"Brazil"],["J. Terry",84,["CB"],"LCB",26,"England"],["David Luiz",84,["CB"],"SUB",30,"Brazil"],["Azpilicueta",84,["LB","RB"],"LB",28,"Spain"],["N. Matić",84,["CDM"],"LCM",21,"Serbia"],["Oscar",83,["CAM","LM"],"SUB",8,"Brazil"],["G. Cahill",83,["CB"],"RCB",24,"England"],["A. Begović",83,["GK"],"SUB",1,"Bosnia Herzegovina"],["Pedro",83,["LM","LW","RW"],"SUB",11,"Spain"],["M. Batshuayi",81,["ST"],"SUB",23,"Belgium"],["N. Kanté",81,["CM","CDM"],"CDM",7,"France"],["K. Zouma",80,["CB"],"SUB",5,"France"],["B. Ivanović",80,["RB","CB"],"RB",2,"Serbia"],["J. Mikel",78,["CDM"],"SUB",12,"Nigeria"],["M. van Ginkel",77,["CM"],"RES",35,"Netherlands"],["V. Moses",77,["LM","RM","LW"],"SUB",15,"Nigeria"],["Marcos Alonso",77,["LM","LB"],"SUB",3,"Spain"],["Eduardo",76,["GK"],"RES",37,"Portugal"],["T. Kane",70,["RB"],"RES",47,"England"],["D. Solanke",69,["ST"],"RES",48,"England"],["R. Loftus-Cheek",68,["CAM","CM"],"SUB",36,"England"],["N. Chalobah",68,["CM","CDM"],"SUB",29,"England"],["O. Aina",63,["RB"],"SUB",34,"England"],["F. Tomori",61,["CB"],"RES",43,"England"],["J. Dasilva",59,["LB"],"RES",52,"England"],["K. Scott",58,["CM"],"RES",55,"England"],["M. Mount",57,["CAM"],"RES",56,"England"],["B. Collins",57,["GK"],"RES",49,"England"],["T. Chalobah",55,["RB","CB"],"RES",62,"England"]],"reserves":[["M. Batshuayi",81,["ST"],"SUB",23,"Belgium"],["K. Zouma",80,["CB"],"SUB",5,"France"],["J. Mikel",78,["CDM"],"SUB",12,"Nigeria"]]},
    "Crystal Palace":{"formation":"4-2-3-1 (2)","slots":["GK","ST","RDM","LM","LCB","RM","LDM","RB","LB","CAM","RCB"],"players":[["S. Mandanda",85,["GK"],"GK",30,"France"],["C. Benteke",81,["ST"],"ST",17,"Belgium"],["Y. Cabaye",81,["CDM","CM"],"RDM",7,"France"],["L. Rémy",81,["ST"],"SUB",8,"France"],["W. Zaha",79,["RM","RW"],"LM",11,"England"],["S. Dann",79,["CB"],"LCB",6,"England"],["A. Townsend",78,["RM","LM"],"RM",10,"England"],["M. Flamini",77,["CDM","CM"],"SUB",4,"France"],["J. McArthur",77,["CDM","CM"],"LDM",18,"Scotland"],["J. Ward",76,["RB","LB"],"RB",2,"England"],["P. Souaré",76,["LB"],"LB",23,"Senegal"],["J. Puncheon",76,["CAM","LM","RM","CM"],"CAM",42,"England"],["J. Tomkins",76,["CB","RB"],"RCB",5,"England"],["J. Ledley",75,["CM","CDM"],"SUB",16,"Wales"],["W. Hennessey",75,["GK"],"SUB",13,"Wales"],["B. Sako",75,["LM"],"SUB",26,"Mali"],["C. Wickham",74,["ST","LM"],"SUB",21,"England"],["M. Kelly",74,["RB","LB"],"SUB",34,"England"],["D. Delaney",74,["CB"],"SUB",27,"Republic of Ireland"],["J. Speroni",73,["GK"],"SUB",1,"Argentina"],["Lee Chung Yong",73,["CAM","LM","RM"],"SUB",14,"Korea Republic"],["J. Mutch",72,["CM","CAM"],"SUB",22,"England"],["F. Campbell",71,["ST"],"SUB",9,"England"],["E. Fryers",66,["LB"],"RES",19,"England"],["K. Appiah",65,["ST"],"RES",32,"Ghana"],["J. Benteke",63,["ST"],"RES",15,"Belgium"],["A. Bissaka",59,["RM","LM"],"RES",43,"DR Congo"],["L. Dreher",58,["CM"],"RES",35,"England"],["A. Coker",58,["LM","RM"],"RES",44,"England"],["B. Wynter",57,["CB"],"RES",46,"England"],["O. O'Dwyer",57,["CB"],"RES",45,"England"],["L. Lumeka",56,["LM"],"RES",47,"England"],["C. Andrews",55,["ST"],"RES",48,"England"]],"reserves":[["B. Sako",75,["LM"],"SUB",26,"Mali"],["C. Wickham",74,["ST","LM"],"SUB",21,"England"],["D. Delaney",74,["CB"],"SUB",27,"Republic of Ireland"]]},
    "Everton":{"formation":"4-2-3-1 (2)","slots":["ST","LB","LCB","RB","RCB","CAM","RM","LDM","LM","RDM","GK"],"players":[["R. Lukaku",84,["ST"],"ST",10,"Belgium"],["L. Baines",83,["LB"],"LB",3,"England"],["A. Williams",83,["CB"],"LCB",5,"Wales"],["S. Coleman",82,["RB"],"RB",23,"Republic of Ireland"],["P. Jagielka",82,["CB"],"RCB",6,"England"],["R. Barkley",81,["CAM"],"CAM",8,"England"],["Deulofeu",81,["RM","RW","ST"],"SUB",7,"Spain"],["J. McCarthy",81,["CDM","CM"],"SUB",16,"Republic of Ireland"],["K. Mirallas",81,["LM","RM","LW"],"RM",11,"Belgium"],["G. Barry",80,["CDM"],"LDM",18,"England"],["A. Lennon",78,["RM"],"SUB",12,"England"],["Y. Bolasie",78,["LM","ST"],"LM",14,"DR Congo"],["T. Cleverley",78,["CM","CDM","LM"],"SUB",15,"England"],["R. Funes Mori",77,["CB"],"SUB",25,"Argentina"],["O. Niasse",77,["ST"],"RES",29,"Senegal"],["D. Gibson",77,["CM","CDM"],"RES",4,"Republic of Ireland"],["M. Bešić",76,["CDM"],"SUB",21,"Bosnia Herzegovina"],["I. Gueye",76,["CM","CDM"],"RDM",17,"Senegal"],["E. Valencia",76,["ST","LW"],"SUB",19,"Ecuador"],["M. Stekelenburg",76,["GK"],"GK",22,"Netherlands"],["Joel Robles",75,["GK"],"SUB",1,"Spain"],["A. Koné",75,["ST","RM","LM"],"SUB",9,"Ivory Coast"],["B. Oviedo",72,["LB"],"SUB",20,"Costa Rica"],["T. Browning",67,["RB","CB"],"RES",27,"England"],["M. Holgate",65,["RB","CB"],"SUB",30,"England"],["K. Dowell",65,["CAM","RW","LW"],"RES",28,"England"],["C. McAleny",65,["LM"],"RES",55,"England"],["M. Pennington",64,["CB","RB"],"SUB",38,"England"],["D. Calvert-Lewin",63,["ST","LM"],"RES",45,"England"],["T. Davies",58,["CM"],"RES",26,"England"],["M. Foulds",57,["CB","LB"],"RES",69,"England"],["J. Kenny",57,["RB","CB","RWB"],"RES",70,"England"],["C. Connolly",57,["CDM","CB","RB"],"RES",33,"England"]],"reserves":[["D. Gibson",77,["CM","CDM"],"RES",4,"Republic of Ireland"],["R. Funes Mori",77,["CB"],"SUB",25,"Argentina"],["O. Niasse",77,["ST"],"RES",29,"Senegal"]]},
    "Hull City":{"formation":"4-1-4-1","slots":["LCB","ST","GK","LB","RCB","RCM","RM","RB","LCM","LM","CDM"],"players":[["D. Mbokani",79,["ST"],"SUB",18,"DR Congo"],["M. Dawson",77,["CB"],"SUB",21,"England"],["C. Davies",77,["CB"],"LCB",6,"England"],["M. Henriksen",76,["CAM","CM"],"SUB",22,"Norway"],["A. Hernández",76,["ST"],"ST",9,"Uruguay"],["D. Marshall",76,["GK"],"GK",23,"Scotland"],["A. Robertson",75,["LB","LWB"],"LB",3,"Scotland"],["R. Mason",75,["CDM","CM","CAM"],"SUB",25,"England"],["J. Livermore",75,["CM","CDM","CB"],"RCB",14,"England"],["A. McGregor",75,["GK"],"SUB",1,"Scotland"],["T. Huddlestone",75,["CM","CDM"],"RCM",8,"England"],["R. Snodgrass",75,["RM"],"RM",10,"Scotland"],["A. Elmohamady",75,["RM","RWB","RB"],"RB",27,"Egypt"],["S. Maloney",74,["CAM","LM"],"SUB",15,"Scotland"],["D. Kuciak",73,["GK"],"SUB",12,"Slovakia"],["H. Maguire",72,["CB"],"SUB",5,"England"],["M. Odubajo",72,["RB"],"SUB",2,"England"],["D. Meyler",72,["CM"],"LCM",7,"Republic of Ireland"],["A. Diomande",72,["ST"],"LM",20,"Norway"],["A. Bruce",69,["CB"],"SUB",4,"Northern Ireland"],["S. Clucas",68,["LM","ST"],"CDM",11,"England"],["E. Jakupović",68,["GK"],"SUB",16,"Switzerland"],["W. Keane",67,["ST"],"SUB",19,"England"],["B. Lenihan",63,["RB","LB"],"RES",31,"Republic of Ireland"],["B. Hinchliffe",59,["ST"],"RES",39,"England"],["J. Ter Horst",59,["ST"],"RES",33,"England"],["J. Tymon",58,["LB"],"RES",28,"England"],["E. Barkworth",58,["CB","CDM"],"RES",34,"England"],["G. Luer",58,["ST"],"RES",32,"England"],["J. Bowen",57,["ST"],"RES",29,"England"],["D. Batty",56,["CM"],"RES",30,"England"],["H. Rodgers",53,["CB"],"RES",38,"England"],["J. Clackstone",53,["RB"],"RES",37,"England"]],"reserves":[["A. McGregor",75,["GK"],"SUB",1,"Scotland"],["S. Maloney",74,["CAM","LM"],"SUB",15,"Scotland"],["D. Kuciak",73,["GK"],"SUB",12,"Slovakia"]]},
    "Leicester City":{"formation":"4-4-2","slots":["RM","LS","GK","RCM","LCB","RCB","LCM","LB","RS","LM","RB"],"players":[["R. Mahrez",85,["RM","CAM"],"RM",26,"Algeria"],["I. Slimani",83,["ST"],"SUB",19,"Algeria"],["J. Vardy",82,["ST","LW","LM"],"LS",9,"England"],["K. Schmeichel",81,["GK"],"GK",1,"Denmark"],["R. Zieler",81,["GK"],"SUB",21,"Germany"],["D. Drinkwater",80,["CM"],"RCM",4,"England"],["R. Huth",80,["CB"],"LCB",6,"Germany"],["W. Morgan",79,["CB"],"RCB",5,"Jamaica"],["N. Mendy",78,["CDM"],"LCM",24,"France"],["A. Musa",78,["ST","LM"],"SUB",7,"Nigeria"],["Luís Hernández",78,["CB","RB"],"SUB",2,"Spain"],["C. Fuchs",77,["LB"],"LB",28,"Austria"],["S. Okazaki",77,["ST","CF"],"RS",20,"Japan"],["M. Albrighton",76,["LM","RM"],"LM",11,"England"],["D. Amartey",75,["CDM","CB"],"SUB",13,"Ghana"],["Y. Benalouane",75,["CB","RB"],"SUB",29,"Tunisia"],["L. Ulloa",74,["ST"],"SUB",23,"Argentina"],["D. Simpson",74,["RB"],"RB",17,"England"],["A. King",72,["CM"],"SUB",10,"Wales"],["M. Wasilewski",72,["CB"],"SUB",27,"Poland"],["B. Kapustka",71,["LM","CAM"],"SUB",14,"Poland"],["J. Schlupp",71,["LB","LM"],"SUB",15,"Ghana"],["D. Gray",70,["LM"],"SUB",22,"England"],["M. James",69,["CM"],"RES",8,"England"],["B. Chilwell",68,["LB"],"RES",3,"England"],["B. Hamer",66,["GK"],"RES",12,"England"],["A. Muskwe",57,["ST"],"RES",34,"England"],["D. Iversen",56,["GK"],"RES",35,"Denmark"],["Raúl Uche",56,["ST"],"RES",36,"Spain"],["D. Johnson",55,["RB","CB"],"RES",37,"England"],["E. Moore",55,["CB"],"RES",38,"England"],["H. Barnes",55,["CAM","CM"],"RES",40,"England"],["L. Ndukwu",54,["LM"],"RES",39,"England"]],"reserves":[["D. Amartey",75,["CDM","CB"],"SUB",13,"Ghana"],["Y. Benalouane",75,["CB","RB"],"SUB",29,"Tunisia"],["L. Ulloa",74,["ST"],"SUB",23,"Argentina"]]},
    "Liverpool":{"formation":"4-3-3 (2)","slots":["LW","ST","LCB","RCB","RB","LCM","CDM","LB","RCM","RW","GK"],"players":[["Coutinho",85,["CAM","LW","CM"],"LW",10,"Brazil"],["D. Sturridge",84,["ST","RW"],"SUB",15,"England"],["L. Karius",82,["GK"],"SUB",1,"Germany"],["Roberto Firmino",82,["CF","ST","CAM"],"ST",11,"Brazil"],["D. Lovren",82,["CB"],"LCB",6,"Croatia"],["J. Matip",82,["CB"],"RCB",32,"Cameroon"],["M. Sakho",82,["CB"],"SUB",3,"France"],["N. Clyne",81,["RB","RWB"],"RB",2,"England"],["G. Wijnaldum",81,["CAM","CM","LM"],"LCM",5,"Netherlands"],["J. Henderson",81,["CM","CDM","RM"],"CDM",14,"England"],["J. Milner",81,["CM","RM","LB"],"LB",7,"England"],["A. Lallana",81,["CAM","CM","CF"],"RCM",20,"England"],["E. Can",80,["CM","CDM","CB"],"SUB",23,"Germany"],["Lucas Leiva",80,["CDM","CM","CB"],"SUB",21,"Brazil"],["S. Mané",79,["RM","CAM","ST","LM"],"RW",19,"Senegal"],["R. Klavan",79,["CB"],"SUB",17,"Estonia"],["D. Origi",78,["ST","LW","RW"],"SUB",27,"Belgium"],["S. Mignolet",78,["GK"],"GK",22,"Belgium"],["D. Ings",77,["ST"],"SUB",28,"England"],["Alberto Moreno",77,["LB"],"SUB",18,"Spain"],["Ilori",75,["CB"],"RES",26,"Portugal"],["A. Manninger",73,["GK"],"SUB",13,"Austria"],["K. Stewart",72,["CDM","CM","LB"],"RES",35,"England"],["M. Grujić",71,["CM","CDM","CAM"],"SUB",16,"Serbia"],["C. Brannagan",70,["CM","CAM"],"RES",25,"England"],["J. Gomez",69,["LB","CB","RB"],"SUB",12,"England"],["T. Alexander-Arnold",68,["RM","RB","CM","CAM"],"RES",72,"England"],["S. Ojo",64,["LM"],"RES",54,"England"],["C. Masterson",60,["CB"],"RES",70,"Republic of Ireland"],["J. Maguire",59,["LB"],"RES",57,"England"],["J. Williams",59,["CB","CDM"],"RES",49,"Wales"],["Pedro Chirivella",58,["CDM","CM","CAM"],"RES",68,"Spain"],["C. Randall",56,["RB","CM"],"RES",56,"England"]],"reserves":[["Lucas Leiva",80,["CDM","CM","CB"],"SUB",21,"Brazil"],["R. Klavan",79,["CB"],"SUB",17,"Estonia"],["D. Origi",78,["ST","LW","RW"],"SUB",27,"Belgium"]]},
    "Manchester City":{"formation":"4-3-3 (2)","slots":["ST","RCM","LCM","GK","LCB","LW","RW","RB","CDM","LB","RCB"],"players":[["S. Agüero",89,["ST"],"ST",10,"Argentina"],["K. De Bruyne",88,["CAM","RM","LM"],"RCM",17,"Belgium"],["David Silva",87,["CAM","LM"],"LCM",21,"Spain"],["V. Kompany",86,["CB"],"SUB",4,"Belgium"],["I. Gündoğan",85,["CM","CDM"],"SUB",8,"Germany"],["C. Bravo",85,["GK"],"GK",1,"Chile"],["N. Otamendi",85,["CB"],"LCB",30,"Argentina"],["Y. Touré",84,["CM","CDM","CAM"],"SUB",42,"Ivory Coast"],["Nolito",83,["LW"],"LW",9,"Spain"],["R. Sterling",82,["LM","ST"],"RW",7,"England"],["P. Zabaleta",82,["RB"],"SUB",5,"Argentina"],["B. Sagna",82,["RB"],"RB",3,"France"],["Fernandinho",81,["CM","CDM"],"CDM",25,"Brazil"],["Jesús Navas",80,["RM"],"SUB",15,"Spain"],["G. Clichy",80,["LB"],"LB",22,"France"],["L. Sané",79,["RM","LM","ST"],"SUB",19,"Germany"],["Fernando",79,["CDM","CM"],"SUB",6,"Brazil"],["A. Kolarov",79,["LB"],"SUB",11,"Serbia"],["J. Stones",78,["CB"],"RCB",24,"England"],["F. Delph",78,["CM"],"SUB",18,"England"],["W. Caballero",78,["GK"],"SUB",13,"Argentina"],["K. Iheanacho",74,["ST"],"SUB",72,"Nigeria"],["T. Ambrose",66,["ST","RW"],"SUB",68,"France"],["Pablo Maffeo",65,["RB","CB"],"RES",50,"Spain"],["Angeliño",65,["LB"],"RES",69,"Spain"],["A. Gunn",65,["GK"],"RES",54,"England"],["Brahim Díaz",64,["CAM"],"RES",55,"Spain"],["Aleix García",63,["CM","CDM"],"RES",75,"Spain"],["C. Humphreys-Grant",61,["CB","RB"],"RES",77,"England"],["I. Lawlor",61,["GK"],"RES",45,"Republic of Ireland"],["W. Patching",60,["CM"],"RES",85,"England"],["A. Nemane",60,["RM","CF"],"RES",57,"France"],["T. Adarabioyo",59,["CB"],"RES",53,"England"]],"reserves":[["Jesús Navas",80,["RM"],"SUB",15,"Spain"],["Fernando",79,["CDM","CM"],"SUB",6,"Brazil"],["A. Kolarov",79,["LB"],"SUB",11,"Serbia"]]},
    "Manchester United":{"formation":"4-2-3-1 (2)","slots":["GK","ST","LDM","CAM","RM","RCB","LB","LCB","RB","RDM","LM"],"players":[["De Gea",90,["GK"],"GK",1,"Spain"],["Z. Ibrahimović",90,["ST"],"ST",9,"Sweden"],["P. Pogba",88,["CM","CDM","CAM"],"LDM",6,"France"],["H. Mkhitaryan",85,["RM","LM","CAM"],"SUB",22,"Armenia"],["C. Smalling",84,["CB"],"SUB",12,"England"],["W. Rooney",84,["CAM","ST","CM"],"CAM",10,"England"],["Juan Mata",84,["CAM","RM","CM"],"SUB",8,"Spain"],["B. Schweinsteiger",83,["CM","CDM"],"SUB",31,"Germany"],["A. Martial",82,["LM","ST"],"RM",11,"France"],["E. Bailly",82,["CB"],"RCB",3,"Ivory Coast"],["M. Schneiderlin",82,["CDM","CM"],"SUB",28,"France"],["Ander Herrera",82,["CM","CAM"],"SUB",21,"Spain"],["L. Shaw",81,["LB"],"LB",23,"England"],["D. Blind",81,["CB","LB","CDM"],"LCB",17,"Netherlands"],["M. Carrick",81,["CDM","CM"],"SUB",16,"England"],["M. Depay",80,["LM","LW"],"RES",7,"Netherlands"],["M. Darmian",80,["RB","LB"],"SUB",36,"Italy"],["A. Valencia",80,["RB","RM"],"RB",25,"Ecuador"],["P. Jones",79,["CB"],"SUB",4,"England"],["A. Young",79,["LM","RB"],"SUB",18,"England"],["S. Romero",79,["GK"],"SUB",20,"Argentina"],["M. Rojo",78,["LB","CB"],"RES",5,"Argentina"],["M. Fellaini",78,["CM","CAM","CDM"],"RDM",27,"Belgium"],["J. Lingard",77,["RM","LM","CAM"],"SUB",14,"England"],["M. Rashford",76,["ST"],"LM",19,"England"],["T. Fosu-Mensah",71,["CDM","CB","RB"],"RES",24,"Netherlands"],["S. Johnstone",68,["GK"],"RES",32,"England"],["A. Tuanzebe",67,["CB"],"RES",38,"DR Congo"],["J. Riley",64,["LB"],"RES",57,"England"],["R. Poole",63,["CB"],"RES",58,"Wales"],["S. Goss",58,["CM"],"RES",55,"England"],["S. El Fitouri",57,["RB"],"RES",52,"Libya"]],"reserves":[["Ander Herrera",82,["CM","CAM"],"SUB",21,"Spain"],["M. Schneiderlin",82,["CDM","CM"],"SUB",28,"France"],["M. Carrick",81,["CDM","CM"],"SUB",16,"England"]]},
    "Middlesbrough":{"formation":"4-2-3-1 (2)","slots":["GK","ST","CAM","LM","RCB","LDM","LB","RB","RM","RDM","LCB"],"players":[["Victor Valdés",82,["GK"],"GK",26,"Spain"],["Negredo",80,["ST"],"ST",10,"Spain"],["G. Ramírez",78,["CAM","RM"],"CAM",21,"Uruguay"],["M. de Roon",78,["CDM","CM"],"SUB",14,"Netherlands"],["B. Espinosa",78,["CB"],"SUB",5,"Colombia"],["S. Downing",75,["CAM","LM","RM"],"LM",19,"England"],["B. Guzan",75,["GK"],"SUB",12,"United States"],["Barragán",75,["RB","RM"],"SUB",17,"Spain"],["V. Fischer",74,["LW"],"SUB",11,"Denmark"],["Daniel Ayala",74,["CB"],"RCB",4,"Spain"],["Fábio",74,["LB","RB"],"RES",2,"Brazil"],["J. Rhodes",74,["ST"],"SUB",9,"Scotland"],["A. Clayton",73,["CDM","CM"],"LDM",8,"England"],["G. Friend",73,["LB"],"LB",3,"England"],["Adama",72,["RW"],"SUB",37,"Spain"],["C. Chambers",72,["RB"],"SUB",25,"England"],["Nsue",72,["RB","RM"],"RB",24,"Equatorial Guinea"],["D. Nugent",72,["ST","CAM"],"SUB",35,"England"],["D. Konstantopoulos",72,["GK"],"SUB",1,"Greece"],["C. Stuani",72,["RM","ST"],"RM",18,"Uruguay"],["G. Leadbitter",71,["CDM","CM"],"RDM",7,"England"],["J. De Sart",70,["CDM","CM"],"SUB",23,"Belgium"],["B. Gibson",70,["CB"],"LCB",6,"England"],["A. Forshaw",70,["CM","CDM"],"SUB",34,"England"],["Mejías",70,["GK"],"RES",13,"Spain"],["J. Husband",65,["LB"],"RES",40,"England"],["C. de Pena",62,["LM"],"RES",16,"Uruguay"],["J. McGhee",59,["RB","LB"],"RES",54,"Scotland"],["N. McGinley",57,["LB"],"RES",55,"England"],["B. Morris",56,["CM","CDM"],"RES",59,"England"],["H. Coulson",53,["LB"],"RES",43,"England"],["C. Cooke",53,["ST"],"RES",42,"England"],["L. Maloney",51,["CM"],"RES",56,"England"]],"reserves":[["Fábio",74,["LB","RB"],"RES",2,"Brazil"],["J. Rhodes",74,["ST"],"SUB",9,"Scotland"],["V. Fischer",74,["LW"],"SUB",11,"Denmark"]]},
    "Southampton":{"formation":"4-1-2-1-2 (2)","slots":["RCB","LCB","LB","CAM","GK","LCM","RS","LS","RB","RCM","CDM"],"players":[["José Fonte",83,["CB"],"RCB",6,"Portugal"],["S. Boufal",80,["LW","RW","CAM"],"SUB",19,"Morocco"],["V. van Dijk",79,["CB"],"LCB",17,"Netherlands"],["R. Bertrand",79,["LB"],"LB",21,"England"],["D. Tadić",79,["LM","RM"],"CAM",11,"Serbia"],["Cédric",78,["RB","RWB"],"SUB",2,"Portugal"],["J. Clasie",78,["CDM"],"SUB",4,"Netherlands"],["C. Austin",78,["ST"],"SUB",10,"England"],["F. Forster",78,["GK"],"GK",1,"England"],["S. Davis",77,["CM","CAM","RM"],"LCM",8,"Northern Ireland"],["S. Long",77,["ST","RM"],"RS",7,"Republic of Ireland"],["J. Rodriguez",77,["LM"],"SUB",9,"England"],["J. Ward-Prowse",76,["CM","CAM","RM"],"SUB",16,"England"],["A. McCarthy",76,["GK"],"SUB",13,"England"],["N. Redmond",75,["RM"],"LS",22,"England"],["J. Pied",75,["RB","RM","LB"],"RB",26,"France"],["P. Højbjerg",74,["CM","CDM"],"RCM",23,"Denmark"],["Oriol Romeu",74,["CDM","CM"],"CDM",14,"Spain"],["F. Gardoş",74,["CB"],"RES",5,"Romania"],["M. Yoshida",73,["CB"],"SUB",3,"Japan"],["C. Martina",70,["RB","CB"],"SUB",15,"Curacao"],["H. Reed",68,["CDM"],"SUB",18,"England"],["S. Taylor",68,["GK"],"RES",28,"England"],["M. Targett",67,["LB"],"SUB",33,"England"],["L. Isgrove",67,["RM","LM"],"RES",27,"Wales"],["J. Stephens",65,["CB","CM"],"SUB",24,"England"],["R. Seager",63,["ST"],"RES",45,"England"],["J. Hesketh",63,["CAM"],"RES",42,"England"],["S. McQueen",63,["LM"],"RES",38,"England"],["J. Flannigan",62,["CM"],"RES",34,"England"],["J. Sims",61,["LM"],"RES",39,"England"],["W. Wood",59,["LB"],"RES",30,"England"],["M. Barnes",58,["ST"],"RES",44,"England"]],"reserves":[["J. Rodriguez",77,["LM"],"SUB",9,"England"],["A. McCarthy",76,["GK"],"SUB",13,"England"],["J. Ward-Prowse",76,["CM","CAM","RM"],"SUB",16,"England"]]},
    "Stoke City":{"formation":"4-1-4-1","slots":["GK","RM","LM","ST","RCB","LCM","LCB","RCM","CDM","LB","RB"],"players":[["J. Butland",82,["GK"],"GK",1,"England"],["X. Shaqiri",82,["RM","CAM","LM","RW"],"RM",22,"Switzerland"],["Bojan",82,["CAM","ST","RW"],"SUB",27,"Spain"],["M. Arnautović",82,["LM","RM","LW"],"LM",10,"Austria"],["W. Bony",81,["ST"],"ST",12,"Ivory Coast"],["R. Shawcross",81,["CB"],"RCB",17,"England"],["G. Imbula",79,["CM","CDM"],"LCM",21,"France"],["I. Afellay",79,["CAM","CM","LM","CDM"],"SUB",14,"Netherlands"],["B. Martins Indi",78,["CB"],"LCB",15,"Netherlands"],["M. Diouf",78,["ST","RM","LM"],"SUB",18,"Senegal"],["J. Allen",77,["CM","CDM"],"RCM",4,"Wales"],["G. Johnson",77,["RB","LB"],"SUB",8,"England"],["G. Whelan",77,["CDM","CM"],"CDM",6,"Republic of Ireland"],["G. Cameron",77,["CB","CDM","CM","RB"],"SUB",20,"United States"],["Marc Muniesa",76,["CB","LB"],"SUB",5,"Spain"],["P. Crouch",76,["ST"],"SUB",25,"England"],["C. Adam",76,["CM","CAM"],"SUB",16,"Scotland"],["S. Ireland",76,["CAM","CM"],"SUB",7,"Republic of Ireland"],["E. Pieters",76,["LB"],"LB",3,"Netherlands"],["S. Given",75,["GK"],"SUB",24,"Republic of Ireland"],["J. Walters",75,["ST","RM"],"SUB",19,"Republic of Ireland"],["P. Bardsley",73,["RB","LB"],"RB",2,"Scotland"],["R. Sobhi",71,["LW","LM"],"SUB",32,"Egypt"],["L. Grant",66,["GK"],"RES",33,"England"],["J. Haugaard",64,["GK"],"RES",29,"Denmark"],["J. Taylor",63,["LB","LM"],"RES",42,"England"],["Dionatan Teixeira",63,["CB"],"RES",23,"Slovakia"],["O. Shenton",62,["CM"],"RES",34,"England"],["D. Bachmann",62,["GK"],"RES",35,"Austria"],["E. Lecygne",60,["CM"],"RES",38,"France"],["L. Edwards",59,["CB"],"RES",52,"England"],["Sergio Molina",59,["CDM"],"RES",59,"Spain"],["D. Telford",56,["ST"],"RES",37,"England"]],"reserves":[["G. Cameron",77,["CB","CDM","CM","RB"],"SUB",20,"United States"],["Marc Muniesa",76,["CB","LB"],"SUB",5,"Spain"],["S. Ireland",76,["CAM","CM"],"SUB",7,"Republic of Ireland"]]},
    "Sunderland":{"formation":"4-1-4-1","slots":["ST","LCB","RCM","RB","CDM","LM","LCM","RM","RCB","LB","GK"],"players":[["J. Defoe",80,["ST"],"ST",18,"England"],["W. Khazri",79,["LM","CAM","RM"],"SUB",10,"Tunisia"],["P. Djilobodji",78,["CB"],"LCB",5,"Senegal"],["L. Cattermole",78,["CDM","CM"],"RCM",6,"England"],["Manquillo",77,["RB","LB"],"RB",21,"Spain"],["J. Kirchhoff",77,["CDM","CB"],"CDM",27,"Germany"],["S. Pienaar",77,["LM"],"SUB",20,"South Africa"],["A. Januzaj",76,["LM","RM","CAM"],"LM",44,"Belgium"],["J. Rodwell",76,["CM"],"LCM",8,"England"],["F. Borini",76,["RM","LM","ST"],"RM",9,"Italy"],["L. Koné",76,["CB"],"RCB",23,"Ivory Coast"],["P. van Aanholt",75,["LB"],"LB",3,"Netherlands"],["V. Mannone",75,["GK"],"GK",1,"Italy"],["J. O'Shea",75,["CB"],"SUB",16,"Republic of Ireland"],["S. Larsson",75,["CM","RM"],"SUB",7,"Sweden"],["J. Denayer",74,["CB"],"SUB",4,"Belgium"],["D. Ndong",74,["CM"],"SUB",17,"Gabon"],["V. Anichebe",74,["ST"],"RES",24,"Nigeria"],["J. Pickford",73,["GK"],"SUB",13,"England"],["P. McNair",72,["CDM","CB","RB"],"SUB",19,"Northern Ireland"],["Mika",71,["GK"],"RES",12,"Portugal"],["B. Jones",71,["RB","LB"],"SUB",2,"England"],["D. Watmore",69,["RM","LM","ST"],"SUB",14,"England"],["L. Gooch",66,["CAM","CM"],"SUB",46,"United States"],["J. Asoro",63,["ST"],"RES",29,"Sweden"],["T. Beadling",61,["CB"],"RES",31,"England"],["J. Maja",60,["ST"],"RES",35,"England"],["R. Greenwood",60,["LW","ST"],"RES",37,"England"],["T. Robson",60,["LB"],"RES",34,"England"],["G. Honeyman",60,["CAM"],"RES",39,"England"],["D. Love",59,["RB"],"SUB",22,"Scotland"],["M. Stryjek",58,["GK"],"RES",32,"Poland"],["E. Robson",57,["CM"],"RES",25,"England"]],"reserves":[["J. Denayer",74,["CB"],"SUB",4,"Belgium"],["D. Ndong",74,["CM"],"SUB",17,"Gabon"],["V. Anichebe",74,["ST"],"RES",24,"Nigeria"]]},
    "Swansea City":{"formation":"4-2-3-1 (2)","slots":["CAM","GK","ST","LCB","RDM","LDM","RCB","LM","RB","RM","LB"],"players":[["G. Sigurðsson",82,["CAM","CF"],"CAM",23,"Iceland"],["Borja Bastón",80,["ST"],"SUB",10,"Spain"],["L. Fabiański",80,["GK"],"GK",1,"Poland"],["Llorente",79,["ST"],"ST",9,"Spain"],["J. Montero",79,["LM","LW"],"SUB",20,"Ecuador"],["F. Fernández",79,["CB"],"LCB",33,"Argentina"],["J. Cork",78,["CDM","CM"],"RDM",24,"England"],["Ki Sung Yueng",78,["CM","CDM"],"SUB",4,"Korea Republic"],["L. Britton",77,["CM","CDM"],"LDM",7,"England"],["N. Dyer",77,["RM","RW"],"SUB",12,"England"],["Jordi Amat",76,["CB"],"RCB",2,"Spain"],["L. Fer",76,["CAM","CM"],"SUB",8,"Netherlands"],["W. Routledge",76,["LM","ST","LW","RM"],"LM",15,"England"],["Àngel Rangel",76,["RB"],"RB",22,"Spain"],["M. Barrow",75,["RW","LW","RM"],"RM",17,"Gambia"],["M. van der Hoorn",75,["CB"],"SUB",5,"Netherlands"],["K. Naughton",75,["RB"],"SUB",26,"England"],["N. Taylor",75,["LB"],"LB",3,"Wales"],["G. Tremmel",74,["GK"],"RES",25,"Germany"],["K. Nordfeldt",73,["GK"],"SUB",13,"Sweden"],["S. Kingsley",70,["LB"],"SUB",35,"Scotland"],["A. Mawson",68,["CB"],"SUB",6,"England"],["M. Birighitti",68,["GK"],"RES",19,"Australia"],["J. Fulton",64,["CM"],"SUB",56,"Scotland"],["O. McBurnie",62,["ST"],"RES",62,"Scotland"],["T. Reid",60,["RB"],"RES",47,"England"],["A. Bray",60,["RM"],"RES",43,"England"],["A. Lewis",59,["RB","RM"],"RES",31,"Wales"],["O. Jones",59,["LM","RM","ST"],"RES",39,"Wales"],["B. Biabi",59,["ST"],"SUB",36,"Scotland"],["D. James",58,["LW","RW","CAM"],"RES",51,"England"],["T. Dyson",57,["CM"],"RES",37,"Wales"],["G. Byers",54,["CM"],"RES",48,"Scotland"]],"reserves":[["L. Fer",76,["CAM","CM"],"SUB",8,"Netherlands"],["M. van der Hoorn",75,["CB"],"SUB",5,"Netherlands"],["K. Naughton",75,["RB"],"SUB",26,"England"]]},
    "Tottenham Hotspur":{"formation":"4-2-3-1 (2)","slots":["GK","RCB","ST","LM","LCB","LDM","RM","RB","CAM","LB","RDM"],"players":[["H. Lloris",88,["GK"],"GK",1,"France"],["T. Alderweireld",85,["CB"],"RCB",4,"Belgium"],["H. Kane",84,["ST"],"ST",10,"England"],["C. Eriksen",84,["CAM","LM"],"LM",23,"Denmark"],["J. Vertonghen",83,["CB"],"LCB",5,"Belgium"],["M. Dembélé",82,["CM","CDM"],"LDM",19,"Belgium"],["E. Lamela",81,["RM","LM"],"RM",11,"Argentina"],["K. Walker",81,["RB"],"RB",2,"England"],["D. Alli",80,["CAM","CDM","LM"],"CAM",20,"England"],["D. Rose",80,["LB"],"LB",3,"England"],["M. Vorm",80,["GK"],"SUB",13,"Netherlands"],["M. Sissoko",80,["RM","CAM"],"SUB",17,"France"],["K. Wimmer",79,["CB"],"SUB",27,"Austria"],["E. Dier",78,["CDM"],"RDM",15,"England"],["V. Janssen",78,["ST"],"SUB",9,"Netherlands"],["G. Nkoudou",78,["LM"],"SUB",14,"France"],["V. Wanyama",78,["CDM","CM"],"SUB",12,"Kenya"],["H. Son",78,["LM","RM"],"SUB",7,"Korea Republic"],["B. Davies",78,["LB"],"SUB",33,"Wales"],["K. Trippier",77,["RB"],"SUB",16,"England"],["Pau López",73,["GK"],"RES",30,"Spain"],["T. Carroll",72,["CM","CDM"],"SUB",28,"England"],["J. Onomah",70,["CAM","RM"],"SUB",25,"England"],["H. Winks",64,["CM","CAM"],"SUB",29,"England"],["C. Carter-Vickers",62,["CB"],"RES",37,"United States"],["S. Harrison",60,["ST"],"RES",39,"England"],["M. Edwards",58,["CAM","RW"],"RES",48,"England"],["K. Walker-Peters",58,["RB","LB"],"RES",53,"England"],["L. Amos",58,["CDM","CB"],"RES",46,"England"],["C. Ogilvie",58,["LB"],"RES",50,"England"],["C. Maghoma",57,["CB"],"RES",54,"England"],["A. Walkes",56,["CDM"],"RES",45,"England"],["H. Voss",52,["GK"],"RES",56,"England"]],"reserves":[["H. Son",78,["LM","RM"],"SUB",7,"Korea Republic"],["V. Wanyama",78,["CDM","CM"],"SUB",12,"Kenya"],["G. Nkoudou",78,["LM"],"SUB",14,"France"]]},
    "Watford":{"formation":"5-3-2","slots":["RCM","RS","GK","LCM","RWB","CB","LS","LCB","RCB","CM","LWB"],"players":[["R. Pereyra",81,["CM","CAM"],"RCM",37,"Argentina"],["N. Amrabat",79,["CAM","RM","ST","LM"],"SUB",7,"Morocco"],["A. Doucouré",78,["CM","CAM"],"SUB",16,"France"],["O. Ighalo",78,["ST"],"RS",24,"Nigeria"],["Gomes",78,["GK"],"GK",1,"Brazil"],["E. Capoue",78,["CDM","CM"],"LCM",29,"France"],["B. Dja Djédjé",77,["RB"],"RES",26,"Ivory Coast"],["S. Okaka",77,["ST"],"SUB",33,"Italy"],["D. Janmaat",77,["RB"],"RWB",22,"Netherlands"],["V. Behrami",77,["CDM","CM"],"SUB",11,"Switzerland"],["Y. Kaboul",77,["CB"],"CB",4,"France"],["S. Prödl",77,["CB"],"RES",5,"Austria"],["J. Holebas",77,["LB","LWB"],"SUB",25,"Greece"],["C. Pantilimon",77,["GK"],"SUB",30,"Romania"],["C. Kabasele",76,["CB"],"SUB",27,"Belgium"],["T. Deeney",76,["ST"],"LS",9,"England"],["M. Britos",75,["CB"],"LCB",3,"Uruguay"],["I. Success",74,["RW","ST","LW"],"RES",10,"Nigeria"],["Kenedy",73,["LM","ST","LB"],"SUB",12,"Brazil"],["C. Cathcart",73,["CB"],"RCB",15,"Northern Ireland"],["B. Watson",73,["CM","CDM"],"CM",23,"England"],["J. Zúñiga",73,["LB","LM"],"LWB",18,"Colombia"],["A. Mariappa",72,["RB","CB"],"SUB",6,"Jamaica"],["A. Guédioura",71,["CM","CDM"],"SUB",17,"Algeria"],["J. Paredes",71,["RB","RWB"],"SUB",14,"Ecuador"],["G. Arlauskis",69,["GK"],"RES",34,"Lithuania"],["M. Folivi",61,["ST"],"RES",38,"England"],["J. Sinclair",59,["ST"],"SUB",19,"England"],["R. Gilmartin",59,["GK"],"RES",13,"Republic of Ireland"],["O. Adeyemo",58,["ST"],"RES",39,"Nigeria"],["C. Rowan",55,["CB","CDM"],"RES",41,"England"],["B. Mason",54,["LB"],"RES",42,"England"],["D. Sesay",53,["RB"],"RES",44,"England"]],"reserves":[["S. Prödl",77,["CB"],"RES",5,"Austria"],["V. Behrami",77,["CDM","CM"],"SUB",11,"Switzerland"],["J. Holebas",77,["LB","LWB"],"SUB",25,"Greece"]]},
    "West Bromwich Albion":{"formation":"4-4-1-1","slots":["ST","GK","RCM","LB","LM","CF","LCB","RCB","LCM","RM","RB"],"players":[["S. Rondón",80,["ST"],"ST",9,"Venezuela"],["B. Foster",80,["GK"],"GK",1,"England"],["C. Yacob",80,["CDM","CM"],"RCM",5,"Argentina"],["J. Evans",79,["CB","LB"],"LB",6,"Northern Ireland"],["A. Nyom",78,["RB"],"SUB",2,"Cameroon"],["N. Chadli",78,["LM"],"LM",22,"Belgium"],["S. Berahino",77,["ST"],"CF",18,"England"],["J. Olsson",76,["CB"],"LCB",3,"Sweden"],["G. McAuley",76,["CB"],"RCB",23,"Northern Ireland"],["D. Fletcher",76,["CM","CDM"],"LCM",24,"Scotland"],["C. Gardner",76,["CM","LM","RM","CDM"],"SUB",8,"England"],["J. Morrison",75,["CM","CDM","RM"],"SUB",7,"Scotland"],["M. Phillips",74,["RM","ST"],"RM",10,"Scotland"],["J. McClean",74,["LM","RM","LW"],"SUB",14,"Republic of Ireland"],["C. McManaman",73,["RW","ST","RM"],"SUB",19,"England"],["B. Myhill",73,["GK"],"SUB",13,"Wales"],["C. Brunt",69,["LB","LM"],"SUB",11,"Northern Ireland"],["B. Galloway",68,["LB","CB"],"SUB",20,"England"],["C. Dawson",67,["RB","CB"],"RB",25,"England"],["H. Robson-Kanu",67,["LM","ST"],"SUB",21,"Wales"],["J. Leko",64,["RW","ST","LW"],"SUB",45,"England"],["Z. Elbouzedi",62,["CAM"],"RES",48,"Republic of Ireland"],["J. Ward",62,["CM"],"SUB",41,"England"],["S. Field",62,["CM","CDM"],"SUB",47,"England"],["K. Edwards",61,["CAM"],"RES",42,"England"],["J. Rose",60,["GK"],"RES",38,"England"],["J. Fitzwater",58,["CB","RB"],"RES",51,"England"],["D. O'Shea",58,["CB"],"RES",52,"Republic of Ireland"],["S. Donnellan",57,["CB","CM","CDM"],"RES",46,"Republic of Ireland"],["A. Palmer",55,["GK"],"RES",40,"England"],["J. Keranovic",50,["GK"],"RES",53,"Bosnia Herzegovina"],["E. Ross",50,["GK"],"RES",54,"England"]],"reserves":[["B. Myhill",73,["GK"],"SUB",13,"Wales"],["C. McManaman",73,["RW","ST","RM"],"SUB",19,"England"],["C. Brunt",69,["LB","LM"],"SUB",11,"Northern Ireland"]]},
    "West Ham United":{"formation":"4-2-3-1 (2)","slots":["LM","ST","LCB","GK","CAM","RDM","LDM","RM","RCB","LB","RB"],"players":[["D. Payet",86,["LM","CAM"],"LM",27,"France"],["S. Zaza",80,["ST"],"ST",11,"Italy"],["A. Ogbonna",80,["CB"],"SUB",21,"Italy"],["S. Feghouli",80,["RW","RM"],"SUB",7,"Algeria"],["W. Reid",80,["CB"],"LCB",2,"New Zealand"],["A. Ayew",80,["RM","LM","ST","RW"],"SUB",20,"Ghana"],["Adrián",80,["GK"],"GK",13,"Spain"],["M. Lanzini",79,["CAM","LM"],"CAM",10,"Argentina"],["G. Töre",79,["RM","LM"],"SUB",17,"Turkey"],["H. Nordtveit",78,["CDM","CB","RB"],"SUB",4,"Norway"],["M. Noble",78,["CM","CDM"],"RDM",16,"England"],["A. Carroll",78,["ST"],"SUB",9,"England"],["J. Calleri",77,["ST"],"RES",28,"Argentina"],["C. Kouyaté",77,["CDM","CM","CB"],"LDM",8,"Senegal"],["Pedro Obiang",76,["CDM","CM"],"SUB",14,"Spain"],["A. Cresswell",76,["LB"],"RES",3,"England"],["D. Sakho",76,["ST"],"RES",15,"Senegal"],["M. Antonio",76,["RM","RB","LM"],"RM",30,"England"],["J. Collins",76,["CB"],"RCB",19,"Wales"],["Arbeloa",76,["RB"],"SUB",5,"Spain"],["A. Masuaku",75,["LB","LM"],"LB",26,"France"],["D. Randolph",74,["GK"],"SUB",1,"Republic of Ireland"],["S. Byram",73,["RB","RM"],"RB",22,"England"],["E. Fernandes",70,["CAM","CM","CDM"],"SUB",31,"Switzerland"],["R. Oxford",66,["CB","CDM"],"SUB",35,"England"],["A. Fletcher",66,["ST"],"SUB",24,"England"],["Toni Martínez",61,["ST"],"RES",29,"Spain"],["R. Spiegel",60,["GK"],"RES",34,"Switzerland"],["M. Browne",58,["CAM"],"RES",43,"England"],["D. Parfitt-Williams",58,["ST","RM"],"RES",40,"Bermuda"],["V. Neufville",57,["LB"],"RES",50,"England"],["D. Rice",56,["CB","CDM"],"RES",41,"Republic of Ireland"],["M. Makasi",52,["CM","RM"],"RES",46,"England"]],"reserves":[["H. Nordtveit",78,["CDM","CB","RB"],"SUB",4,"Norway"],["A. Carroll",78,["ST"],"SUB",9,"England"],["J. Calleri",77,["ST"],"RES",28,"Argentina"]]},
    "Alavés":{"formation":"4-2-3-1 (2)","slots":["RDM","GK","ST","LCB","LM","RCB","LB","LDM","RB","CAM","RM"],"players":[["D. Torres",77,["CDM","CM","CB"],"RDM",16,"Colombia"],["Z. Feddal",77,["CB","LB"],"SUB",24,"Morocco"],["Camarasa",76,["CM","CDM"],"SUB",8,"Spain"],["Pacheco",76,["GK"],"GK",1,"Spain"],["Deyverson",76,["ST"],"ST",20,"Brazil"],["Laguardia",76,["CB"],"LCB",5,"Spain"],["Ibai Gómez",75,["LM","CAM","RM"],"LM",11,"Spain"],["Alexis",75,["CB","RB"],"RCB",4,"Spain"],["A. Katai",74,["CF","LM","CAM","ST"],"RES",25,"Serbia"],["A. Pantic",74,["CB"],"SUB",2,"Serbia"],["Raul García",74,["LB"],"LB",3,"Spain"],["Manu García",74,["CDM","CM","LB"],"LDM",19,"Spain"],["Marcos Llorente",73,["CM","CAM","CDM"],"SUB",6,"Spain"],["C. Espinoza",73,["RM","ST"],"SUB",14,"Argentina"],["Kiko Femenía",73,["RM","RB"],"RB",21,"Spain"],["N. Krstičić",73,["CM","CDM","CAM"],"CAM",23,"Serbia"],["C. Santos",73,["ST","CAM"],"SUB",9,"Venezuela"],["Toquero",72,["ST","RW","CF"],"SUB",18,"Spain"],["Vigaray",71,["RB","LB","CB"],"SUB",22,"Spain"],["Edgar Méndez",71,["LM","RM"],"RM",17,"Spain"],["Rubén Sobrino",70,["ST","LW","RW"],"SUB",7,"Spain"],["Adrián Ortolá",69,["GK"],"SUB",13,"Spain"],["Manu Barreiro",69,["ST"],"SUB",10,"Spain"],["Manu García",67,["CAM"],"RES",26,"Spain"],["T. Hernández",66,["LB"],"SUB",15,"France"],["Sergio Llamas",64,["CM","RM","LM"],"RES",12,"Spain"],["Einar Galilea",63,["CB"],"RES",27,"Spain"],["Dani Iglesias",61,["ST"],"RES",28,"Spain"],["Asier Benito",61,["ST"],"RES",29,"Spain"],["Aritz Castro",60,["GK"],"RES",31,"Spain"]],"reserves":[["Marcos Llorente",73,["CM","CAM","CDM"],"SUB",6,"Spain"],["C. Santos",73,["ST","CAM"],"SUB",9,"Venezuela"],["C. Espinoza",73,["RM","ST"],"SUB",14,"Argentina"]]},
    "Athletic Club":{"formation":"4-3-3 (4)","slots":["LCB","ST","LCM","RCM","RB","CAM","RW","GK","LB","LW","RCB"],"players":[["A. Laporte",84,["CB"],"LCB",4,"France"],["Aduriz",84,["ST"],"ST",20,"Spain"],["Beñat",82,["CM"],"LCM",7,"Spain"],["Mikel San José",81,["CDM","CB","CM"],"RCM",6,"Spain"],["Iturraspe",81,["CDM","CM"],"SUB",8,"Spain"],["De Marcos",81,["RB","RW"],"RB",18,"Spain"],["Raúl García",81,["CAM"],"CAM",22,"Spain"],["Williams",80,["RW","LW"],"RW",11,"Spain"],["Etxeita",80,["CB"],"SUB",16,"Spain"],["Iraizoz",79,["GK"],"GK",1,"Spain"],["Balenziaga",79,["LB"],"LB",24,"Spain"],["Muniain",78,["LW","CAM"],"SUB",10,"Spain"],["Susaeta",78,["RW","LW"],"LW",14,"Spain"],["Bóveda",77,["RB","CB"],"RCB",2,"Spain"],["Mikel Rico",77,["CM"],"SUB",17,"Spain"],["Herrerín",76,["GK"],"SUB",13,"Spain"],["Elustondo",75,["CB","CM","CDM"],"SUB",3,"Spain"],["Sabin Merino",74,["LW","RW","ST"],"SUB",19,"Spain"],["Eraso",74,["CAM","CDM"],"SUB",5,"Spain"],["Kepa Arrizabalaga",73,["GK"],"RES",26,"Spain"],["Lekue",73,["LB","RB","LM","RM"],"SUB",15,"Spain"],["Aketxe",72,["LM","CAM"],"SUB",23,"Spain"],["Yeray",72,["CB","RB"],"RES",27,"Spain"],["Vesga",69,["CM","CDM"],"SUB",12,"Spain"],["Saborit",68,["LB","CB"],"SUB",25,"Spain"],["Unai Simón",66,["GK"],"RES",30,"Spain"],["Villalibre",66,["ST","CF"],"RES",29,"Spain"],["Tarsi",66,["CM","CDM"],"RES",28,"Spain"],["Bengoa",64,["CAM","CM"],"RES",31,"Spain"],["Agirrezabala",63,["RB","CB"],"RES",32,"Spain"]],"reserves":[["Herrerín",76,["GK"],"SUB",13,"Spain"],["Elustondo",75,["CB","CM","CDM"],"SUB",3,"Spain"],["Eraso",74,["CAM","CDM"],"SUB",5,"Spain"]]},
    "Atlético Madrid":{"formation":"4-4-2","slots":["LS","LCB","GK","LB","LM","RB","RS","RCB","RCM","LCM","RM"],"players":[["A. Griezmann",88,["ST","RW","LW"],"LS",7,"France"],["D. Godín",88,["CB"],"LCB",2,"Uruguay"],["J. Oblak",87,["GK"],"GK",13,"Slovenia"],["Filipe Luís",85,["LB"],"LB",3,"Brazil"],["N. Gaitán",85,["LM"],"SUB",23,"Argentina"],["Koke",84,["CM","LM","RM"],"LM",6,"Spain"],["J. Giménez",83,["CB"],"SUB",24,"Uruguay"],["Juanfran",83,["RB"],"RB",20,"Spain"],["K. Gameiro",83,["ST"],"RS",21,"France"],["Y. Carrasco",82,["LM","RM"],"SUB",10,"Belgium"],["S. Savić",82,["CB"],"RCB",15,"Montenegro"],["Gabi",82,["CM","CDM"],"RCM",14,"Spain"],["Tiago",81,["CM","CDM"],"LCM",5,"Portugal"],["Fernando Torres",81,["ST"],"SUB",9,"Spain"],["Moyá",81,["GK"],"SUB",1,"Spain"],["A. Fernández",81,["CM","CDM"],"SUB",12,"Argentina"],["Saúl",80,["CM","RM","CAM","LM"],"RM",8,"Spain"],["A. Correa",79,["ST","CAM","CF"],"SUB",11,"Argentina"],["S. Vrsaljko",79,["RB"],"SUB",16,"Croatia"],["A. Cerci",76,["RW","CF"],"SUB",17,"Italy"],["L. Hernández",75,["CB","LB"],"SUB",19,"France"],["Thomas",75,["CDM","CM"],"SUB",22,"Ghana"],["André Moreira",70,["GK"],"RES",25,"Portugal"],["Caio Henrique",66,["CAM"],"SUB",28,"Brazil"],["Bernabé",64,["GK"],"RES",30,"Spain"],["Borja González",62,["RB"],"RES",29,"Spain"],["Juan Moreno",62,["RM"],"RES",32,"Spain"],["Roberto Núñez",61,["ST"],"RES",33,"Spain"],["Álex García",61,["CB"],"RES",34,"Spain"]],"reserves":[["Moyá",81,["GK"],"SUB",1,"Spain"],["A. Fernández",81,["CM","CDM"],"SUB",12,"Argentina"],["A. Correa",79,["ST","CAM","CF"],"SUB",11,"Argentina"]]},
    "Barcelona":{"formation":"4-3-3 (2)","slots":["RW","LW","ST","LCM","CDM","RCM","LB","RCB","LCB","GK","RB"],"players":[["L. Messi",93,["RW"],"RW",10,"Argentina"],["Neymar",92,["LW"],"LW",11,"Brazil"],["L. Suárez",92,["ST"],"ST",9,"Uruguay"],["Iniesta",88,["CM"],"LCM",8,"Spain"],["Sergio Busquets",87,["CDM"],"CDM",5,"Spain"],["I. Rakitić",87,["CM"],"RCM",4,"Croatia"],["Jordi Alba",86,["LB"],"LB",18,"Spain"],["Piqué",86,["CB"],"RCB",3,"Spain"],["J. Mascherano",85,["CB","CDM"],"LCB",14,"Argentina"],["André Gomes",84,["CM","LM","CAM","CDM"],"SUB",21,"Portugal"],["A. Turan",84,["CM","RM","LM"],"SUB",7,"Turkey"],["M. ter Stegen",83,["GK"],"GK",1,"Germany"],["S. Umtiti",82,["CB"],"SUB",23,"France"],["Paco Alcácer",81,["ST"],"SUB",17,"Spain"],["J. Cillessen",81,["GK"],"SUB",13,"Netherlands"],["J. Mathieu",81,["CB","LB"],"SUB",24,"France"],["Denis Suárez",80,["LM","RM","CM"],"SUB",6,"Spain"],["Rafinha",80,["CM","RW","LW","CDM"],"SUB",12,"Brazil"],["Sergi Roberto",79,["CM","RB","CDM"],"RB",20,"Spain"],["L. Digne",79,["LB"],"SUB",19,"France"],["Aleix Vidal",77,["RB","RM"],"SUB",22,"Spain"],["Marlon Santos",72,["CB","CDM"],"SUB",33,"Brazil"],["Borja López",71,["CB"],"RES",31,"Spain"],["Nili Perdomo",71,["RB","RM"],"RES",32,"Spain"],["Gerard",70,["CM","CDM","CB"],"RES",36,"Spain"],["Jordi Masip",70,["GK"],"SUB",25,"Spain"],["W. Kaptoum",68,["CM","CDM"],"RES",27,"Cameroon"],["Sergi Palencia",66,["RB","LB"],"RES",34,"Spain"],["José Suarez",66,["GK"],"RES",26,"Spain"],["Marc Cardona",65,["ST"],"RES",29,"Spain"],["Aleñà",64,["CM","CAM","CDM"],"RES",28,"Spain"],["Rafa Mújica",64,["ST"],"RES",35,"Spain"],["Àlex Carbonell",64,["CF","RW"],"RES",30,"Spain"]],"reserves":[["J. Cillessen",81,["GK"],"SUB",13,"Netherlands"],["J. Mathieu",81,["CB","LB"],"SUB",24,"France"],["Denis Suárez",80,["LM","RM","CM"],"SUB",6,"Spain"]]},
    "Celta Vigo":{"formation":"4-3-3 (4)","slots":["CAM","RW","RB","RCM","RCB","LCM","LB","GK","LCB","LW","ST"],"players":[["F. Orellana",81,["RW","CAM","CM"],"CAM",14,"Chile"],["Iago Aspas",81,["ST","RW"],"RW",10,"Spain"],["Hugo Mallo",80,["RB","CB"],"RB",2,"Spain"],["D. Wass",80,["CM","CAM"],"RCM",18,"Denmark"],["G. Cabral",80,["CB"],"RCB",22,"Argentina"],["M. Díaz",80,["CM","CDM"],"LCM",5,"Chile"],["P. Hernández",80,["CM","CAM"],"SUB",8,"Chile"],["G. Rossi",79,["ST"],"SUB",25,"Italy"],["N. Radoja",78,["CDM","CM"],"SUB",6,"Serbia"],["Fontàs",78,["CB"],"SUB",3,"Spain"],["Sergi Gómez",77,["CB"],"SUB",20,"Spain"],["Jonny",77,["LB","RB","CB"],"LB",19,"Spain"],["Sergio",77,["GK"],"GK",1,"Spain"],["F. Roncaglia",77,["CB","RB"],"LCB",24,"Argentina"],["T. Bongonda",76,["LW","LM","RW"],"LW",7,"Belgium"],["J. Guidetti",76,["ST"],"ST",9,"Sweden"],["Naranjo",75,["LM","ST","RM"],"SUB",17,"Spain"],["Carles Planas",75,["LB"],"SUB",21,"Spain"],["P. Sisto",74,["RM","LM","RW"],"SUB",11,"Denmark"],["C. Beauvue",74,["ST","RW"],"SUB",12,"France"],["Rubén Blanco",73,["GK"],"SUB",13,"Spain"],["Álvaro Lemos",70,["RB","RM"],"RES",15,"Spain"],["David Costas",70,["CB"],"SUB",4,"Spain"],["Josep Señé",70,["RW","LW","CAM"],"SUB",23,"Spain"],["Borja Fernández",67,["CDM","CM"],"RES",27,"Spain"],["P. Diop",66,["CM","CDM","CAM"],"RES",28,"Spain"],["Borja Iglesias",66,["ST"],"RES",32,"Spain"],["Robert Costa",65,["CB"],"RES",37,"Spain"],["Gus Ledes",65,["CM","CDM","LB"],"RES",35,"Portugal"],["Iván Villar",64,["GK"],"RES",26,"Spain"],["Diego Alende",64,["CB"],"RES",29,"Spain"],["Agus Medina",64,["RB","RM"],"RES",38,"Spain"],["Roger Riera",62,["CB","RB"],"RES",34,"Spain"]],"reserves":[["Sergi Gómez",77,["CB"],"SUB",20,"Spain"],["Naranjo",75,["LM","ST","RM"],"SUB",17,"Spain"],["Carles Planas",75,["LB"],"SUB",21,"Spain"]]},
    "Deportivo La Coruña":{"formation":"4-4-2 (2)","slots":["LCB","LDM","RB","LS","RCB","GK","LM","RM","RDM","LB","RS"],"players":[["Sidnei",80,["CB"],"LCB",12,"Brazil"],["Mosquera",79,["CM","CDM"],"LDM",5,"Spain"],["Juanfran",78,["RB","RM"],"RB",2,"Spain"],["Carles Gil",77,["RM","CAM"],"SUB",11,"Spain"],["F. Andone",77,["ST"],"LS",10,"Romania"],["E. Çolak",77,["CAM","RM","LM","CM"],"SUB",8,"Turkey"],["Albentosa",77,["CB"],"RCB",6,"Spain"],["G. Lux",77,["GK"],"GK",1,"Argentina"],["C. Borges",77,["CM","CDM"],"SUB",22,"Costa Rica"],["F. Fajr",77,["CAM","LM","RM"],"LM",19,"Morocco"],["Joselu",76,["ST"],"SUB",7,"Spain"],["Arribas",76,["CB"],"SUB",14,"Spain"],["R. Babel",76,["LM","RM"],"SUB",18,"Netherlands"],["Bruno Gama",76,["RM","CAM","LM"],"RM",21,"Portugal"],["Guilherme",75,["CDM","CM","CAM"],"RDM",20,"Brazil"],["Fernando Navarro",75,["LB","CB"],"SUB",3,"Spain"],["P. Tytoń",75,["GK"],"SUB",13,"Poland"],["Luisinho",75,["LB","LM"],"LB",16,"Portugal"],["Laure",74,["RB","LB"],"SUB",15,"Spain"],["Alex Bergantiños",74,["CDM","CB"],"SUB",4,"Spain"],["M. Moreno",72,["LW","RW","ST"],"RS",9,"Colombia"],["Borja Valle",72,["LM","CAM"],"SUB",17,"Spain"],["Rubén",71,["GK"],"SUB",25,"Spain"],["Óscar Pinchi",67,["LW","ST"],"RES",28,"Spain"],["Nacho Monsalve",66,["CB","RB","LB"],"RES",26,"Spain"],["Hugo Rama",65,["CAM","CM"],"RES",32,"Spain"],["Àlex Corredera",65,["CAM","CM"],"RES",31,"Spain"],["Borja Domingo",65,["ST"],"RES",29,"Spain"],["Edu Expósito",63,["CAM"],"RES",37,"Spain"],["Manú",62,["CAM"],"RES",35,"Portugal"],["M. Legaz",62,["ST"],"RES",34,"Argentina"],["Lucas Viña",61,["LB"],"RES",40,"Spain"],["Queijeiro",61,["CM"],"RES",30,"Spain"]],"reserves":[["Arribas",76,["CB"],"SUB",14,"Spain"],["R. Babel",76,["LM","RM"],"SUB",18,"Netherlands"],["Fernando Navarro",75,["LB","CB"],"SUB",3,"Spain"]]},
    "Eibar":{"formation":"4-2-3-1 (2)","slots":["RDM","ST","RCB","LDM","RM","RB","LCB","LB","CAM","LM","GK"],"players":[["G. Escalante",78,["CDM","CM"],"RDM",5,"Argentina"],["Sergi Enrich",77,["ST","CAM"],"ST",9,"Spain"],["M. Dos Santos",77,["CB"],"RCB",15,"Argentina"],["Dani García",77,["CDM"],"LDM",14,"Spain"],["Pedro León",77,["RM","LM"],"RM",21,"Spain"],["F. Lejeune",76,["CB"],"SUB",20,"France"],["Capa",76,["RB","RM"],"RB",7,"Spain"],["Bebé",76,["LM","RM","RW","ST"],"SUB",25,"Portugal"],["Iván Ramis",76,["CB"],"LCB",4,"Spain"],["David Juncà",75,["LB"],"LB",23,"Spain"],["Gálvez",75,["CB"],"SUB",3,"Spain"],["Fran Rico",75,["CDM","CM"],"SUB",16,"Spain"],["Adrián González",75,["CAM","CDM","CM"],"CAM",24,"Spain"],["T. Inui",75,["LM"],"LM",8,"Japan"],["Rubén Peña",74,["RW","ST","RM","RB"],"SUB",11,"Spain"],["Riesgo",74,["GK"],"GK",13,"Spain"],["Luna",73,["LB","LM"],"SUB",19,"Spain"],["Kike",73,["ST"],"SUB",17,"Spain"],["Jota",73,["RM","LM","CAM"],"SUB",10,"Spain"],["Nano",72,["ST","CAM"],"SUB",22,"Spain"],["Yoel",72,["GK"],"SUB",1,"Spain"],["Arbilla",72,["RB","RM"],"SUB",18,"Spain"],["Christian Rivera",65,["CM","CDM"],"SUB",6,"Spain"],["Etxaburu",63,["CM"],"RES",27,"Spain"],["Amorrortu",59,["ST"],"RES",26,"Spain"],["Markel Areitio",58,["GK"],"RES",30,"Spain"]],"reserves":[["Rubén Peña",74,["RW","ST","RM","RB"],"SUB",11,"Spain"],["Jota",73,["RM","LM","CAM"],"SUB",10,"Spain"],["Kike",73,["ST"],"SUB",17,"Spain"]]},
    "Espanyol":{"formation":"4-2-3-1 (2)","slots":["GK","ST","LCB","LDM","LM","CAM","RDM","RM","RCB","RB","LB"],"players":[["Diego López",81,["GK"],"GK",13,"Spain"],["Roberto",80,["GK"],"SUB",1,"Spain"],["Leo Baptistao",79,["ST"],"ST",11,"Brazil"],["M. Demichelis",79,["CB"],"LCB",2,"Argentina"],["Javi Fuego",79,["CDM","CM","CB"],"LDM",18,"Spain"],["D. Reyes",78,["CB","CDM"],"SUB",23,"Mexico"],["Reyes",78,["RW","LW","RM","LM"],"LM",9,"Spain"],["Jurado",78,["LM","CAM"],"CAM",14,"Spain"],["F. Caicedo",78,["ST"],"SUB",10,"Ecuador"],["P. Diop",78,["CDM"],"RDM",20,"Senegal"],["P. Piatti",78,["LM","LW"],"SUB",19,"Argentina"],["H. Pérez",78,["RM"],"RM",17,"Paraguay"],["Gerard Moreno",77,["ST","CAM"],"SUB",7,"Spain"],["David López",77,["CDM","CM","CB"],"RCB",15,"Spain"],["Javi López",77,["RB"],"RB",16,"Spain"],["O. Duarte",76,["CB"],"SUB",6,"Costa Rica"],["Victor Sánchez",76,["CDM","CM","LB"],"LB",4,"Spain"],["Víctor Álvarez",74,["LM","LB","CM"],"SUB",5,"Spain"],["Álvaro",73,["ST"],"SUB",22,"Spain"],["Salva Sevilla",73,["CAM","LM"],"SUB",8,"Spain"],["Rubén Duarte",72,["LB"],"SUB",3,"Spain"],["Marc Roca",69,["CM","CDM"],"SUB",28,"Spain"],["Lluis López",67,["CB"],"SUB",27,"Spain"],["M. Latour",65,["LW","RW"],"RES",30,"France"],["Rufo",65,["ST","CF"],"RES",32,"Spain"],["Andrés Prieto",64,["GK"],"RES",26,"Spain"],["Marc Navarro",63,["RB","CB"],"RES",31,"Spain"],["Aarón Martín",62,["LB"],"RES",29,"Spain"]],"reserves":[["Gerard Moreno",77,["ST","CAM"],"SUB",7,"Spain"],["O. Duarte",76,["CB"],"SUB",6,"Costa Rica"],["Víctor Álvarez",74,["LM","LB","CM"],"SUB",5,"Spain"]]},
    "Granada":{"formation":"4-3-3 (4)","slots":["GK","LW","LCB","LB","RB","CAM","RCB","LCM","RCM","RW","ST"],"players":[["G. Ochoa",80,["GK"],"GK",13,"Mexico"],["M. Carcela-Gonzalez",78,["LM","RM","LW"],"LW",16,"Morocco"],["Rúben Vezo",77,["CB"],"LCB",17,"Portugal"],["F. Tabanou",77,["LB"],"LB",14,"France"],["Tito",76,["RB","LB","CB"],"RB",2,"Spain"],["Bueno",76,["CAM","ST","CF"],"CAM",23,"Spain"],["Lombán",75,["CB"],"RCB",6,"Spain"],["Sergi Samper",74,["CDM","CM"],"LCM",4,"Spain"],["R. Krhin",74,["CDM","CM"],"RCM",21,"Slovenia"],["Javi Márquez",74,["CM","CDM","CAM"],"SUB",8,"Spain"],["Andreas Pereira",73,["CAM","CM"],"SUB",18,"Brazil"],["J. Boga",73,["CAM","ST","RW"],"SUB",10,"France"],["O. Atzili",73,["RW","RM","CAM"],"RW",15,"Israel"],["Gabriel Silva",73,["LM","LB"],"SUB",12,"Brazil"],["Isaac Cuenca",73,["RW","LW","RM","LM"],"SUB",19,"Spain"],["David Barral",73,["ST"],"SUB",7,"Spain"],["E. Ponce",72,["ST"],"ST",9,"Argentina"],["G. Silva",72,["LB","LWB","CB"],"SUB",3,"Uruguay"],["A. Kravets",72,["ST"],"RES",24,"Ukraine"],["M. Saunier",72,["CB"],"SUB",20,"France"],["J. Toral",71,["CAM","LM","RM"],"SUB",11,"Spain"],["D. Foulquier",71,["RB","LB","RM"],"SUB",22,"France"],["I. Kelava",71,["GK"],"RES",25,"Croatia"],["V. Angban",70,["CDM","CM"],"RES",26,"Ivory Coast"],["Oier",70,["GK"],"SUB",1,"Spain"],["Luís Martins",69,["LB","LW"],"RES",34,"Portugal"],["C. Aboagye",68,["CAM","CM"],"RES",28,"Ghana"],["Jean Carlos",66,["LW","RW","CAM"],"RES",29,"Brazil"],["U. Agbo",66,["CDM","CB"],"SUB",5,"Nigeria"],["S. Marreh",64,["CB","CDM"],"RES",33,"Gambia"],["Pol Llonch",63,["CDM","CM","RWB"],"RES",27,"Spain"],["Marc Nierga",63,["ST"],"RES",32,"Spain"],["Pol",61,["GK"],"RES",31,"Spain"]],"reserves":[["David Barral",73,["ST"],"SUB",7,"Spain"],["Isaac Cuenca",73,["RW","LW","RM","LM"],"SUB",19,"Spain"],["G. Silva",72,["LB","LWB","CB"],"SUB",3,"Uruguay"]]},
    "Las Palmas":{"formation":"4-2-3-1 (2)","slots":["LM","RDM","CAM","GK","LDM","LCB","RM","RB","RCB","ST","LB"],"players":[["M. Lemos",80,["CB"],"SUB",3,"Uruguay"],["Jonathan Viera",80,["LM","CAM","RM"],"LM",21,"Spain"],["Roque Mesa",79,["CDM","CM"],"RDM",15,"Spain"],["K. Boateng",79,["CAM","CDM","CM"],"CAM",7,"Ghana"],["Javi Varas",78,["GK"],"GK",13,"Spain"],["Vicente Gómez",78,["CM","CDM","CAM"],"LDM",4,"Spain"],["Bigas",77,["CB","LB","CDM"],"LCB",17,"Spain"],["N. El Zhar",77,["RM","CAM","LM"],"RM",8,"Morocco"],["Tana",76,["CAM","LM","RM"],"SUB",24,"Spain"],["Michel Macedo",76,["RB","RWB"],"RB",12,"Brazil"],["David Simón",76,["RB","RWB"],"SUB",2,"Spain"],["David García",76,["CB","RB"],"RCB",5,"Spain"],["Aythami Artiles",76,["CB"],"SUB",16,"Spain"],["M. Livaja",75,["ST"],"ST",9,"Croatia"],["S. Araujo",75,["ST"],"SUB",10,"Argentina"],["Dani Castellano",74,["LB"],"LB",23,"Spain"],["Javi Castellano",73,["CDM","CM"],"SUB",18,"Spain"],["Hernán",72,["CDM","CM"],"SUB",14,"Spain"],["Hélder Lopes",72,["LB"],"SUB",22,"Portugal"],["Momo",72,["LM","RM"],"SUB",11,"Spain"],["Raúl Lizoain",71,["GK"],"SUB",1,"Spain"],["Montoro",71,["CM","CDM","CAM"],"SUB",6,"Spain"],["Tyronne",70,["RM","LM"],"SUB",20,"Spain"],["Asdrúbal",68,["ST","RM","CAM","LM"],"RES",25,"Spain"],["M. García",67,["LW"],"RES",19,"Argentina"],["Alvaro Arencibia",65,["RB","CB","CDM"],"RES",28,"Spain"],["R. Peña",63,["ST"],"RES",39,"Venezuela"],["José Artiles",63,["LM","RM"],"RES",27,"Spain"],["Benito",63,["LM","CAM"],"RES",29,"Spain"],["Carlos González",62,["LW","ST","CAM"],"RES",26,"Spain"],["Borja Herrera",62,["LB","LM"],"RES",30,"Spain"],["David Ramírez",58,["GK"],"RES",31,"Spain"]],"reserves":[["S. Araujo",75,["ST"],"SUB",10,"Argentina"],["Javi Castellano",73,["CDM","CM"],"SUB",18,"Spain"],["Momo",72,["LM","RM"],"SUB",11,"Spain"]]},
    "Leganés":{"formation":"4-2-3-1 (2)","slots":["RDM","LM","LCB","CAM","GK","LDM","RCB","LB","RB","RM","ST"],"players":[["Rubén Pérez",77,["CDM","CM"],"RDM",21,"Spain"],["A. Szymanowski",77,["LW","LM","RW"],"LM",11,"Argentina"],["Insua",76,["CB","CDM"],"LCB",18,"Spain"],["Gabriel",76,["CM","CAM","CDM","ST"],"CAM",8,"Brazil"],["Serantes",76,["GK"],"GK",13,"Spain"],["Diego Rico",75,["LB","CB"],"SUB",15,"Spain"],["Timor",75,["CDM","CM"],"LDM",24,"Spain"],["C. Medjani",75,["CB","CDM"],"SUB",12,"Algeria"],["M. Mantovani",75,["CB"],"RCB",5,"Argentina"],["Luciano",74,["ST"],"SUB",20,"Brazil"],["Omar Ramos",74,["RM","LM","RW"],"SUB",23,"Spain"],["Marín",73,["LB"],"LB",4,"Spain"],["D. Machís",73,["LW","LM","ST","RW"],"SUB",7,"Venezuela"],["Víctor Díaz",73,["RB","LB","RWB","RM"],"RB",17,"Spain"],["Robert Ibáñez",72,["RM","RW","CAM"],"SUB",16,"Spain"],["Unai López",72,["CM","CAM","RM","CDM"],"RM",19,"Spain"],["Guerrero",72,["ST"],"ST",9,"Spain"],["A. Brignoli",71,["GK"],"SUB",25,"Italy"],["Sastre",71,["CM","CDM"],"SUB",22,"Spain"],["Alberto Martín",69,["CDM","CM"],"SUB",6,"Spain"],["Toni Dovale",69,["LM","RM","CAM","LB"],"SUB",10,"Spain"],["M. Kone",68,["ST","RW"],"SUB",14,"Ivory Coast"],["Bustinza",68,["RB","CB"],"SUB",3,"Spain"],["Chiki",60,["CAM","CF","ST"],"RES",32,"Spain"],["Diego Barrios",58,["GK"],"RES",31,"Spain"]],"reserves":[["D. Machís",73,["LW","LM","ST","RW"],"SUB",7,"Venezuela"],["Robert Ibáñez",72,["RM","RW","CAM"],"SUB",16,"Spain"],["Sastre",71,["CM","CDM"],"SUB",22,"Spain"]]},
    "Málaga":{"formation":"4-2-3-1 (2)","slots":["RDM","RM","GK","LCB","RCB","LDM","LM","ST","RB","CAM","LB"],"players":[["Camacho",81,["CDM","CM"],"RDM",6,"Spain"],["Keko",80,["RM","RW"],"RM",20,"Spain"],["C. Kameni",80,["GK"],"GK",1,"Cameroon"],["Weligton",79,["CB"],"LCB",3,"Brazil"],["Diego Llorente",78,["CB","CDM","RB"],"RCB",5,"Spain"],["Recio",78,["CM","CDM"],"LDM",14,"Spain"],["Jony",78,["LM"],"LM",21,"Spain"],["Charles",78,["ST"],"ST",9,"Brazil"],["D. Boyko",78,["GK"],"SUB",13,"Ukraine"],["R. Rosales",77,["RB"],"RB",18,"Venezuela"],["J. Añor",76,["RM","LM","CAM"],"CAM",10,"Venezuela"],["Pablo Fornals",76,["CM","LM","RM"],"SUB",31,"Spain"],["Z. Kuzmanović",76,["CM","CDM"],"SUB",22,"Serbia"],["B. Koné",76,["CB"],"SUB",2,"Burkina Faso"],["F. Ricca",75,["LB"],"LB",15,"Uruguay"],["G. Castro",75,["LW","LM"],"SUB",11,"Uruguay"],["Miguel Torres",75,["LB","RB"],"SUB",23,"Spain"],["Sandro",74,["ST","LW"],"SUB",19,"Spain"],["M. Santos",72,["ST","RW"],"SUB",8,"Uruguay"],["Juankar",72,["LM","LB"],"SUB",7,"Spain"],["Duda",72,["CAM","RM"],"SUB",17,"Portugal"],["M. Villanueva",69,["CB","LB"],"SUB",4,"Venezuela"],["Javi Ontiveros",66,["LM","RM"],"RES",39,"Spain"],["Y. En-Nesyri",65,["ST"],"RES",26,"Morocco"],["Kuki Zalazar",63,["RW","CAM"],"RES",28,"Spain"],["Aarón",62,["GK"],"SUB",27,"Spain"],["Javi Jiménez",61,["LB","LM"],"RES",29,"Spain"],["Joel Arimany",58,["ST"],"RES",32,"Spain"],["Samu Casado",54,["GK"],"RES",30,"Spain"]],"reserves":[["G. Castro",75,["LW","LM"],"SUB",11,"Uruguay"],["Miguel Torres",75,["LB","RB"],"SUB",23,"Spain"],["Sandro",74,["ST","LW"],"SUB",19,"Spain"]]},
    "Osasuna":{"formation":"5-3-2","slots":["LS","LCM","CB","LCB","RCM","RWB","RS","GK","CM","RCB","LWB"],"players":[["Sergio León",76,["ST","CF"],"LS",7,"Spain"],["Roberto Torres",76,["CM","LM","RM"],"LCM",10,"Spain"],["Fran Mérida",75,["CM","CDM","CAM"],"SUB",18,"Spain"],["Miguel Flaño",75,["CB"],"CB",4,"Spain"],["David García",74,["CB","CDM"],"LCB",5,"Spain"],["D. Digard",74,["CDM","CB"],"SUB",23,"France"],["De las Cuevas",74,["CAM","RM","CM"],"RCM",20,"Spain"],["Oier",74,["RWB","CM","LWB"],"RWB",6,"Spain"],["Oriol Riera",73,["ST"],"RS",9,"Spain"],["Nauzet",73,["GK"],"GK",13,"Spain"],["G. Čaušić",72,["CM","CDM","CAM"],"SUB",8,"Serbia"],["Tano Bonnin",72,["CB","RB"],"SUB",3,"Dominican Republic"],["Fuentes",72,["LB","LWB"],"SUB",16,"Spain"],["Fausto",72,["CDM","CM"],"CM",14,"Spain"],["Alex Berenguer",71,["LM","ST"],"SUB",11,"Spain"],["Unai Garcia",71,["CB"],"RCB",15,"Spain"],["E. Rivière",71,["ST"],"SUB",12,"France"],["Clerc",70,["LB","LWB"],"SUB",21,"Spain"],["Jaime Romero",70,["LM","RM","ST"],"SUB",17,"Spain"],["Javi Flaño",70,["LWB","RWB","LB"],"LWB",2,"Spain"],["Aitor Buñuel",69,["RWB","RB"],"RES",34,"Spain"],["Kenan Kodro",69,["ST","LM"],"SUB",19,"Spain"],["Olavide",67,["RM","CM","CAM","CDM"],"SUB",35,"Spain"],["Mario Fernández",67,["GK"],"SUB",1,"Spain"],["Javi Álamo",67,["RWB","RM"],"RES",24,"Spain"],["Imanol García",66,["CM","CDM","CAM"],"RES",31,"Spain"],["Arellano",64,["LB","LM"],"RES",33,"Spain"],["Álex Sánchez",64,["ST","RM","LM"],"RES",39,"Spain"],["Antonio Otegui",62,["CM","CAM"],"RES",36,"Spain"],["J. Mondragón",61,["CB","RB"],"RES",37,"Colombia"],["Kike Barja",61,["RM","RW"],"RES",30,"Spain"],["Julen Hualde",60,["LB"],"RES",32,"Spain"],["Juan Pérez",58,["GK"],"RES",26,"Spain"]],"reserves":[["Fuentes",72,["LB","LWB"],"SUB",16,"Spain"],["Alex Berenguer",71,["LM","ST"],"SUB",11,"Spain"],["E. Rivière",71,["ST"],"SUB",12,"France"]]},
    "Real Betis":{"formation":"4-4-2","slots":["LS","GK","RS","RCB","RCM","RM","LM","LCB","RB","LCM","LB"],"players":[["Rubén Castro",81,["ST","LW"],"LS",24,"Spain"],["Adán",80,["GK"],"GK",13,"Spain"],["Bruno",79,["CB"],"SUB",4,"Spain"],["A. Sanabria",78,["ST","LM"],"RS",9,"Paraguay"],["A. Mandi",78,["CB","RB"],"RCB",23,"Algeria"],["Petros",78,["CDM","CAM","CM","LM"],"RCM",5,"Brazil"],["Joaquín",78,["RM","RW"],"RM",17,"Spain"],["C. Musonda",77,["LW","RW","CAM","LM"],"LM",7,"Belgium"],["Dani Ceballos",77,["CAM","CM","LM","RM"],"SUB",10,"Spain"],["G. Pezzella",77,["CB"],"LCB",20,"Argentina"],["C. Piccini",76,["RB","RM"],"RB",12,"Italy"],["R. Zozulya",76,["ST"],"SUB",18,"Ukraine"],["J. Martin",76,["CM","CDM","CAM","LM"],"SUB",8,"France"],["Cejudo",76,["RM","LM","RB"],"SUB",16,"Spain"],["F. Gutiérrez",75,["CM","CDM"],"LCM",6,"Chile"],["N. Leiva",74,["RM","LM"],"SUB",11,"Spain"],["R. Donk",74,["CDM","CB"],"SUB",15,"Netherlands"],["D. Brasanac",73,["CM","CDM"],"SUB",22,"Serbia"],["Alex Martínez",73,["LB"],"SUB",3,"Spain"],["Alex Alegría",72,["ST"],"SUB",19,"Spain"],["Fabián",71,["CAM","CM"],"SUB",21,"Spain"],["Manu Herrera",70,["GK"],"RES",25,"Spain"],["Dani Giménez",70,["GK"],"SUB",1,"Spain"],["R. Durmisi",69,["LB"],"LB",14,"Denmark"],["José Carlos",66,["CB"],"RES",28,"Spain"],["De La Hoz",65,["CDM","CB"],"RES",29,"Spain"],["Rafa Navarro",63,["RB"],"RES",27,"Spain"],["Juanma",63,["CF","ST","CAM"],"RES",31,"Spain"],["J. Narváez",60,["ST"],"RES",32,"Colombia"]],"reserves":[["Cejudo",76,["RM","LM","RB"],"SUB",16,"Spain"],["N. Leiva",74,["RM","LM"],"SUB",11,"Spain"],["R. Donk",74,["CDM","CB"],"SUB",15,"Netherlands"]]},
    "Real Madrid":{"formation":"4-3-3 (4)","slots":["LW","RW","LCB","RCM","LCM","RCB","CAM","ST","LB","GK","RB"],"players":[["Cristiano Ronaldo",94,["LW","LM","ST"],"LW",7,"Portugal"],["G. Bale",90,["RW"],"RW",11,"Wales"],["Sergio Ramos",89,["CB"],"LCB",4,"Spain"],["L. Modrić",89,["CM","CDM"],"RCM",19,"Croatia"],["T. Kroos",88,["CM","CDM"],"LCM",8,"Germany"],["Pepe",88,["CB"],"RCB",3,"Portugal"],["J. Rodríguez",87,["CAM","CM","RM"],"CAM",10,"Colombia"],["K. Benzema",87,["ST"],"ST",9,"France"],["Marcelo",86,["LB"],"LB",12,"Brazil"],["K. Navas",85,["GK"],"GK",1,"Costa Rica"],["R. Varane",84,["CB"],"SUB",5,"France"],["Isco",84,["CAM","CM","RM"],"SUB",22,"Spain"],["Carvajal",83,["RB"],"RB",2,"Spain"],["Casemiro",82,["CDM"],"SUB",14,"Brazil"],["Morata",82,["ST","LW"],"SUB",21,"Spain"],["Marco Asensio",81,["CAM","LM","RM"],"SUB",20,"Spain"],["Lucas Vázquez",81,["RM","RW"],"SUB",17,"Spain"],["Danilo",80,["RB","LB"],"SUB",23,"Brazil"],["Fábio Coentrão",80,["LB","LM"],"SUB",15,"Portugal"],["M. Kovačić",79,["CM"],"SUB",16,"Croatia"],["Kiko Casilla",79,["GK"],"SUB",13,"Spain"],["Nacho Fernández",78,["CB","RB","LB"],"SUB",6,"Spain"],["Lucas Silva",74,["CDM","CM"],"RES",24,"Brazil"],["Mariano",71,["ST"],"SUB",18,"Dominican Republic"],["M. Ødegaard",70,["CAM","RM","CM"],"RES",26,"Norway"],["Aleix Febas",67,["CM"],"RES",36,"Spain"],["S. Díaz",67,["CF","CAM","ST","LW"],"RES",27,"Paraguay"],["E. Fernández",66,["LM","CAM"],"RES",29,"France"],["P. Lienhart",65,["CB"],"RES",34,"Austria"],["N. Vergos",65,["ST","CF"],"RES",28,"Greece"],["Rubén Yáñez",65,["GK"],"RES",31,"Spain"],["A. Hakimi",64,["RB"],"RES",33,"Morocco"],["Álvaro Tejero",62,["LB","RB"],"RES",35,"Spain"]],"reserves":[["Lucas Vázquez",81,["RM","RW"],"SUB",17,"Spain"],["Marco Asensio",81,["CAM","LM","RM"],"SUB",20,"Spain"],["Fábio Coentrão",80,["LB","LM"],"SUB",15,"Portugal"]]},
    "Real Sociedad":{"formation":"4-3-3 (4)","slots":["GK","LCB","CAM","RCM","ST","RW","LW","LCM","LB","RCB","RB"],"players":[["G. Rulli",82,["GK"],"GK",1,"Argentina"],["Iñigo Martínez",81,["CB"],"LCB",6,"Spain"],["C. Vela",81,["RW","ST","CAM"],"CAM",11,"Mexico"],["Canales",79,["CAM","LM","LW"],"SUB",16,"Spain"],["Illarramendi",79,["CM","CDM"],"RCM",4,"Spain"],["Agirretxe",79,["ST"],"SUB",9,"Spain"],["Willian José",78,["ST","CF","CAM"],"ST",12,"Brazil"],["Xabi Prieto",78,["RM","CAM","CM","RW"],"RW",10,"Spain"],["Zurutuza",78,["CM","CAM","LW"],"SUB",17,"France"],["Oyarzabal",77,["LW","RW","ST"],"LW",18,"Spain"],["Rubén Pardo",77,["CM","CDM"],"LCM",14,"Spain"],["Yuri",77,["LB"],"LB",19,"Spain"],["Aritz Elustondo",76,["RB","CB"],"SUB",15,"Spain"],["Markel Bergara",76,["CDM","CM"],"SUB",5,"Spain"],["Mikel Gonzalez",76,["CB"],"RCB",3,"Spain"],["Granero",76,["CM","CAM","CDM"],"SUB",8,"Spain"],["Juanmi",75,["CAM","ST","LM"],"SUB",7,"Spain"],["Raúl Navas",74,["CB"],"SUB",22,"Spain"],["Zaldúa",73,["RB"],"RB",20,"Spain"],["Héctor",72,["LB","LM"],"SUB",21,"Spain"],["Carlos Martínez",72,["RB"],"SUB",2,"Spain"],["Gaztañaga",71,["CDM","CB","CM"],"RES",23,"Spain"],["Concha",70,["RW","LW","RM","CAM"],"SUB",24,"Spain"],["Toño Ramirez",68,["GK"],"SUB",25,"Spain"],["Zubeldia",67,["CM"],"RES",27,"Spain"],["P. Sisniega",67,["GK"],"RES",30,"Mexico"],["Jon Bautista",65,["ST"],"RES",29,"Spain"],["Merquelanz",64,["LM","RM"],"RES",28,"Spain"],["Sanz",64,["CM"],"RES",31,"Spain"],["Bardaji",64,["GK"],"RES",13,"Spain"],["Muguruza",63,["RW","RM","LW"],"RES",32,"Spain"],["R. Le Normand",60,["CB","CDM"],"RES",33,"France"],["Odriozola",60,["RB","RW"],"RES",34,"Spain"]],"reserves":[["Markel Bergara",76,["CDM","CM"],"SUB",5,"Spain"],["Granero",76,["CM","CAM","CDM"],"SUB",8,"Spain"],["Juanmi",75,["CAM","ST","LM"],"SUB",7,"Spain"]]},
    "Sevilla":{"formation":"3-5-2","slots":["LDM","LM","CB","RDM","LCB","GK","RS","LS","CAM","RM","RCB"],"players":[["S. N'Zonzi",82,["CDM","CM"],"LDM",15,"France"],["Vitolo",82,["RM","LM"],"SUB",20,"Spain"],["M. Krohn-Dehli",82,["CM","LM","CAM"],"SUB",7,"Denmark"],["S. Nasri",82,["LM","RM"],"LM",10,"France"],["S. Sirigu",82,["GK"],"SUB",25,"Italy"],["A. Rami",82,["CB"],"CB",23,"France"],["Iborra",82,["CDM","CAM","CM"],"RDM",8,"Spain"],["F. Vázquez",82,["CAM","ST","RW","CM"],"SUB",22,"Italy"],["Ganso",81,["CAM","CM"],"SUB",19,"Brazil"],["Daniel Carriço",81,["CB","CDM"],"SUB",6,"Portugal"],["B. Trémoulinas",81,["LB"],"SUB",2,"France"],["T. Kolodziejczak",80,["CB","LB"],"LCB",5,"France"],["Sergio Rico",80,["GK"],"GK",1,"Spain"],["W. Ben Yedder",80,["ST","CF"],"RS",12,"France"],["L. Vietto",79,["ST"],"LS",9,"Argentina"],["H. Kiyotake",79,["CAM","LM","ST"],"CAM",14,"Japan"],["Mariano",79,["RB","RM"],"SUB",3,"Brazil"],["Pablo Sarabia",78,["LM","CAM","RM"],"RM",17,"Spain"],["M. Kranevitter",77,["CDM","CM"],"SUB",4,"Argentina"],["Escudero",77,["LB"],"SUB",18,"Spain"],["N. Pareja",77,["CB"],"RCB",21,"Argentina"],["G. Mercado",76,["RB","CB"],"SUB",24,"Argentina"],["J. Correa",74,["CAM","LM"],"SUB",11,"Argentina"],["David Soria",73,["GK"],"RES",13,"Spain"],["José Amo",63,["CB"],"RES",27,"Spain"],["Eliseo Falcón",62,["CB","RB"],"RES",28,"Spain"],["Javi Díaz",60,["GK"],"RES",29,"Spain"]],"reserves":[["B. Trémoulinas",81,["LB"],"SUB",2,"France"],["Daniel Carriço",81,["CB","CDM"],"SUB",6,"Portugal"],["Ganso",81,["CAM","CM"],"SUB",19,"Brazil"]]},
    "Sporting Gijón":{"formation":"4-2-3-1 (2)","slots":["GK","LDM","CAM","RB","RCB","ST","LCB","LM","LB","RDM","RM"],"players":[["Iván Cuéllar",78,["GK"],"GK",1,"Spain"],["Sergio Álvarez",77,["CDM","CM"],"LDM",6,"Spain"],["Víctor Rodríguez",77,["CAM","RM","LM"],"CAM",7,"Spain"],["Lora",77,["RB","RM","LB"],"RB",11,"Spain"],["Jorge Meré",76,["CB"],"RCB",4,"Spain"],["D. Čop",75,["ST"],"ST",24,"Croatia"],["F. Amorebieta",75,["CB"],"LCB",5,"Venezuela"],["J. Babin",75,["CB"],"SUB",3,"France"],["Burgui",74,["LM","CAM"],"LM",14,"Spain"],["Moi Gómez",74,["RM","LM"],"SUB",23,"Spain"],["Diego Mariño",74,["GK"],"SUB",13,"Spain"],["Isma López",74,["LB","LM"],"LB",18,"Spain"],["Xavi Torres",74,["CDM"],"SUB",21,"Spain"],["Nacho Cases",74,["CDM","CM"],"RDM",10,"Spain"],["Castro",73,["ST","CF"],"SUB",9,"Spain"],["Douglas",73,["RB","RM"],"RM",2,"Brazil"],["Lillo",73,["RB","LB","CB"],"SUB",16,"Spain"],["Carmona",73,["RM","LM","CAM"],"SUB",19,"Spain"],["D. Ndi",71,["CAM"],"SUB",20,"Cameroon"],["R. Aït-Atmane",71,["CDM","CM"],"SUB",8,"Algeria"],["Canella",71,["LB"],"SUB",15,"Spain"],["Borja Viguera",71,["ST"],"SUB",25,"Spain"],["A. Afif",69,["LW","ST"],"SUB",17,"Qatar"],["Víctor Ruiz",64,["LB","CB"],"RES",26,"Spain"],["Óscar Whalley",64,["GK"],"RES",30,"Spain"],["Cifré",62,["RB"],"RES",27,"Spain"],["Javi Benítez",60,["GK"],"RES",31,"Spain"]],"reserves":[["Castro",73,["ST","CF"],"SUB",9,"Spain"],["Lillo",73,["RB","LB","CB"],"SUB",16,"Spain"],["Carmona",73,["RM","LM","CAM"],"SUB",19,"Spain"]]},
    "Valencia":{"formation":"4-3-3","slots":["RCB","LW","GK","RCM","LB","LCB","RB","CM","ST","LCM","RW"],"players":[["E. Garay",84,["CB"],"RCB",24,"Argentina"],["Nani",83,["LW","RW","CAM"],"LW",17,"Portugal"],["Diego Alves",83,["GK"],"GK",1,"Brazil"],["Parejo",82,["CM","CDM","CAM"],"RCM",10,"Spain"],["Gayà",80,["LB"],"LB",14,"Spain"],["E. Mangala",80,["CB"],"LCB",5,"France"],["A. Abdennour",80,["CB"],"SUB",23,"Tunisia"],["João Cancelo",79,["RB","RW"],"RB",2,"Portugal"],["M. Ryan",79,["GK"],"SUB",25,"Australia"],["Montoya",79,["RB","LB"],"SUB",21,"Spain"],["Mario Suárez",79,["CM","CDM"],"CM",7,"Spain"],["Rodrigo",78,["RW","ST","LW"],"ST",19,"Spain"],["Siqueira",78,["LB"],"SUB",6,"Brazil"],["E. Pérez",78,["CM","CDM"],"LCM",8,"Argentina"],["Medrán",77,["CM","CDM","CAM"],"SUB",20,"Spain"],["F. Cartabia",77,["RM","LM","CAM"],"SUB",16,"Argentina"],["Aderllan Santos",77,["CB"],"SUB",4,"Brazil"],["Santi Mina",76,["RW","ST","LW"],"RW",22,"Spain"],["Z. Bakkali",74,["RW","LW"],"SUB",11,"Belgium"],["Munir",74,["ST","LW","RW"],"SUB",9,"Spain"],["Jaume",74,["GK"],"SUB",13,"Spain"],["Fran Villalba",70,["CAM","CM"],"RES",30,"Spain"],["Carlos Soler",67,["CM"],"SUB",28,"Spain"],["Toni Lato",67,["LB"],"RES",26,"Spain"],["Ayala",67,["CB","LB"],"RES",31,"Spain"],["Salva Ruíz",66,["LB","CB"],"RES",29,"Spain"],["Nacho Gil",65,["CAM","LW"],"RES",32,"Spain"],["Quim Araujo",65,["CAM","CF"],"RES",33,"Spain"],["Rafa Mir",63,["ST","RW"],"SUB",27,"Spain"],["Sivera",63,["GK"],"RES",35,"Spain"],["Sito",61,["LM","LW"],"RES",36,"Spain"]],"reserves":[["Aderllan Santos",77,["CB"],"SUB",4,"Brazil"],["F. Cartabia",77,["RM","LM","CAM"],"SUB",16,"Argentina"],["Medrán",77,["CM","CDM","CAM"],"SUB",20,"Spain"]]},
    "Villarreal":{"formation":"4-4-2","slots":["RCB","LCM","GK","LCB","RCM","RB","RM","LS","LM","LB","RS"],"players":[["M. Musacchio",83,["CB"],"RCB",5,"Argentina"],["Bruno",83,["CM"],"LCM",21,"Spain"],["C. Bakambu",81,["ST","LM","RM"],"SUB",17,"DR Congo"],["Sergio Asenjo",81,["GK"],"GK",1,"Spain"],["Víctor Ruíz",81,["CB"],"LCB",6,"Spain"],["Samu Castillejo",80,["LM","RM"],"SUB",19,"Spain"],["Manu Trigueros",80,["CM","CAM"],"RCM",14,"Spain"],["Mario Gaspar",80,["RB"],"RB",2,"Spain"],["J. dos Santos",80,["RM","CM","CDM"],"RM",8,"Mexico"],["Alexandre Pato",80,["ST"],"LS",10,"Brazil"],["Soldado",80,["ST"],"SUB",9,"Spain"],["R. Soriano",79,["CM","CAM","RM","LM"],"LM",20,"Italy"],["D. Cheryshev",79,["LM"],"SUB",7,"Russia"],["A. N'Diaye",79,["CDM","CM","CB"],"SUB",4,"Senegal"],["Jaume Costa",79,["LB","LM"],"LB",11,"Spain"],["N. Sansone",78,["LW","RW","ST"],"RS",18,"Italy"],["Álvaro",77,["CB"],"SUB",12,"Spain"],["D. Bonera",77,["CB"],"SUB",23,"Italy"],["A. Rukavina",77,["RB","LB"],"SUB",22,"Serbia"],["M. Barbosa",76,["GK"],"SUB",25,"Argentina"],["Andrés Fernández",76,["GK"],"SUB",13,"Spain"],["B. Jokič",76,["LB"],"RES",15,"Slovenia"],["R. Borré",74,["ST","CF","CAM"],"SUB",24,"Colombia"],["José Ángel",74,["LB"],"SUB",3,"Spain"],["L. Suárez",71,["CAM"],"RES",29,"Argentina"],["Aitor",68,["RW","LW","CAM"],"RES",27,"Spain"],["Rodri",68,["CDM","CM"],"RES",16,"Spain"],["Edgar Ié",68,["CB","RB"],"RES",28,"Portugal"],["A. Doffo",66,["CAM"],"RES",31,"Argentina"],["F. Acosta",65,["ST"],"RES",32,"Uruguay"],["Mario González",64,["LW","ST"],"RES",39,"Spain"],["Cantero",63,["GK"],"RES",30,"Spain"],["Miguelón",61,["RB"],"RES",33,"Spain"]],"reserves":[["A. N'Diaye",79,["CDM","CM","CB"],"SUB",4,"Senegal"],["Álvaro",77,["CB"],"SUB",12,"Spain"],["A. Rukavina",77,["RB","LB"],"SUB",22,"Serbia"]]},
    "Bayern Munich":{"formation":"4-3-3 (2)","slots":["GK","RCB","ST","RB","LB","RW","LCB","RCM","LW","LCM","CDM"],"players":[["M. Neuer",92,["GK"],"GK",1,"Germany"],["J. Boateng",90,["CB"],"RCB",17,"Germany"],["R. Lewandowski",90,["ST"],"ST",9,"Poland"],["P. Lahm",88,["RB","CDM","CM"],"RB",21,"Germany"],["D. Alaba",87,["LB","CB","CM"],"LB",27,"Austria"],["T. Müller",87,["CF","RW","CAM","ST"],"RW",25,"Germany"],["A. Robben",87,["RM","RW"],"SUB",10,"Netherlands"],["M. Hummels",87,["CB"],"LCB",5,"Germany"],["A. Vidal",87,["CM","CDM"],"RCM",23,"Chile"],["F. Ribéry",86,["LM"],"LW",7,"France"],["Thiago",84,["CM","CAM","CDM","LM"],"LCM",6,"Spain"],["Javi Martinez",84,["CB","CDM"],"SUB",8,"Spain"],["Douglas Costa",84,["LM","RM","CAM"],"SUB",11,"Brazil"],["Xabi Alonso",84,["CDM","CM"],"CDM",14,"Spain"],["K. Coman",81,["LW","ST","RW"],"SUB",29,"France"],["Bernat",79,["LB","LM"],"SUB",18,"Spain"],["H. Badstuber",79,["CB","LB"],"SUB",28,"Germany"],["Renato Sanches",78,["CM"],"SUB",35,"Portugal"],["J. Kimmich",78,["CM","CB","CDM","RB"],"SUB",32,"Germany"],["Rafinha",78,["RB","CB"],"SUB",13,"Brazil"],["S. Ulreich",77,["GK"],"SUB",26,"Germany"],["T. Starke",74,["GK"],"RES",22,"Germany"],["J. Green",68,["RM","RW","ST","LM"],"SUB",37,"United States"],["F. Benko",61,["CAM"],"SUB",40,"Germany"],["N. Dorsch",59,["CDM","CM"],"RES",30,"Germany"],["F. Götze",59,["CB","CDM"],"RES",20,"Germany"],["E. Öztürk",58,["CM"],"RES",38,"Germany"]],"reserves":[["Bernat",79,["LB","LM"],"SUB",18,"Spain"],["H. Badstuber",79,["CB","LB"],"SUB",28,"Germany"],["Rafinha",78,["RB","CB"],"SUB",13,"Brazil"]]},
    "Borussia Dortmund":{"formation":"4-2-3-1 (2)","slots":["LM","ST","CAM","LCB","RDM","RB","GK","RCB","LDM","LB","RM"],"players":[["M. Reus",88,["LM","CAM"],"LM",11,"Germany"],["P. Aubameyang",86,["ST","RM"],"ST",17,"Gabon"],["M. Götze",84,["CAM","LM","CM"],"CAM",10,"Germany"],["Sokratis",84,["CB"],"LCB",25,"Greece"],["S. Kagawa",83,["CAM","CF"],"SUB",23,"Japan"],["S. Bender",82,["CB","CDM"],"SUB",6,"Germany"],["G. Castro",82,["CM","CDM","RM"],"RDM",27,"Germany"],["L. Piszczek",82,["RB","CB"],"RB",26,"Poland"],["R. Bürki",81,["GK"],"GK",38,"Switzerland"],["Marc Bartra",81,["CB"],"RCB",5,"Spain"],["A. Schürrle",81,["LM","RM","ST"],"SUB",21,"Germany"],["S. Rode",80,["CDM","CM"],"LDM",18,"Germany"],["N. Şahin",80,["CDM","CM"],"SUB",8,"Turkey"],["M. Schmelzer",80,["LB"],"LB",29,"Germany"],["J. Weigl",79,["CDM","CM"],"SUB",33,"Germany"],["R. Weidenfeller",78,["GK"],"SUB",1,"Germany"],["A. Ramos",78,["ST"],"SUB",20,"Colombia"],["N. Subotić",78,["CB"],"RES",4,"Serbia"],["O. Dembélé",77,["RM","LM","CAM"],"RM",7,"France"],["M. Ginter",77,["RB","CB","CDM"],"SUB",28,"Germany"],["Mikel Merino",76,["CM","CDM"],"RES",24,"Spain"],["R. Guerreiro",76,["LB","LM"],"SUB",13,"Portugal"],["E. Durm",76,["LB","RB"],"RES",37,"Germany"],["Park Joo Ho",75,["LB","CDM"],"RES",3,"Korea Republic"],["C. Pulisic",69,["LM"],"SUB",22,"United States"],["F. Passlack",67,["RB","RM","LB"],"SUB",30,"Germany"],["E. Mor",64,["ST","RW"],"SUB",9,"Turkey"],["J. Gyau",64,["RM"],"RES",44,"United States"],["H. Bonmann",62,["GK"],"RES",39,"Germany"],["D. Burnic",57,["CM","CDM"],"RES",32,"Germany"],["D. Reimann",57,["GK"],"RES",49,"Germany"],["D. Sauerland",56,["CM","CAM","RB"],"RES",45,"Germany"],["P. Fritsch",55,["CB","CDM"],"RES",19,"Germany"]],"reserves":[["J. Weigl",79,["CDM","CM"],"SUB",33,"Germany"],["R. Weidenfeller",78,["GK"],"SUB",1,"Germany"],["N. Subotić",78,["CB"],"RES",4,"Serbia"]]},
    "Bayer Leverkusen":{"formation":"4-2-3-1 (2)","slots":["GK","LCB","RDM","ST","CAM","LDM","RM","RCB","LB","LM","RB"],"players":[["B. Leno",86,["GK"],"GK",1,"Germany"],["O. Toprak",84,["CB"],"LCB",21,"Turkey"],["L. Bender",83,["CDM","CM"],"RDM",8,"Germany"],["K. Bellarabi",83,["RM"],"SUB",38,"Germany"],["J. Hernández",83,["ST"],"ST",7,"Mexico"],["K. Volland",81,["ST","RW","LW"],"SUB",31,"Germany"],["H. Çalhanoğlu",80,["CAM","LM","CM"],"CAM",10,"Turkey"],["K. Kampl",80,["CM","RM","CDM"],"LDM",44,"Slovenia"],["J. Brandt",79,["LM","RM","CAM"],"RM",19,"Germany"],["J. Tah",79,["CB"],"RCB",4,"Germany"],["A. Dragović",79,["CB"],"SUB",3,"Austria"],["J. Baumgartlinger",79,["CDM"],"SUB",15,"Austria"],["C. Aránguiz",79,["CM","CDM"],"SUB",20,"Chile"],["Wendell",78,["LB"],"LB",18,"Brazil"],["S. Kießling",78,["ST"],"SUB",11,"Germany"],["R. Hilbert",77,["RB"],"SUB",13,"Germany"],["A. Mehmedi",76,["LM","ST"],"LM",14,"Switzerland"],["T. Jedvaj",75,["RB","CB"],"RB",16,"Croatia"],["R. Özcan",75,["GK"],"SUB",28,"Austria"],["R. Kruse",74,["RM","CF"],"RES",27,"Australia"],["D. da Costa",72,["RB"],"SUB",23,"Germany"],["J. Pohjanpalo",70,["ST","RM"],"SUB",17,"Finland"],["V. Yurchenko",67,["CM","CAM"],"SUB",35,"Ukraine"],["N. Lomb",66,["GK"],"RES",36,"Germany"],["B. Henrichs",65,["LB","RB"],"SUB",39,"Germany"],["L. Boeder",60,["CB","CDM"],"RES",33,"Germany"],["J. Abu Hanna",59,["CB"],"RES",22,"Germany"],["S. Schreck",58,["CAM"],"RES",30,"Germany"],["K. Havertz",57,["CAM","LM"],"RES",29,"Germany"]],"reserves":[["C. Aránguiz",79,["CM","CDM"],"SUB",20,"Chile"],["S. Kießling",78,["ST"],"SUB",11,"Germany"],["R. Hilbert",77,["RB"],"SUB",13,"Germany"]]},
    "Borussia Mönchengladbach":{"formation":"3-4-1-2","slots":["GK","LS","CAM","RM","RS","LCB","LM","CB","LCM","RCM","RCB"],"players":[["Y. Sommer",84,["GK"],"GK",1,"Switzerland"],["Raffael",82,["CF","ST"],"LS",11,"Brazil"],["P. Herrmann",81,["RM","LM"],"SUB",7,"Germany"],["L. Stindl",81,["CF","CAM"],"CAM",13,"Germany"],["I. Traoré",80,["RM","LM"],"RM",16,"Guinea"],["M. Dahoud",79,["CM"],"SUB",8,"Germany"],["J. Vestergaard",79,["CB"],"SUB",4,"Denmark"],["T. Hazard",79,["CAM","RM","ST","LM"],"RS",10,"Belgium"],["T. Jantschke",79,["CB","RB"],"LCB",24,"Germany"],["A. Hahn",79,["ST","RM"],"SUB",28,"Germany"],["O. Wendt",79,["LB","LM"],"LM",17,"Sweden"],["F. Johnson",79,["LM","RB"],"SUB",19,"United States"],["A. Christensen",78,["CB"],"CB",3,"Denmark"],["C. Kramer",78,["CDM","CM"],"LCM",6,"Germany"],["J. Hofmann",77,["RM","LM"],"SUB",23,"Germany"],["Álvaro Domínguez",77,["CB","LB"],"SUB",18,"Spain"],["J. Drmić",76,["ST","RM","LM"],"SUB",9,"Switzerland"],["J. Korb",76,["RB"],"SUB",27,"Germany"],["T. Strobl",76,["CB","CDM","RB"],"RCM",5,"Germany"],["T. Sippel",74,["GK"],"SUB",21,"Germany"],["N. Schulz",73,["LM","LB"],"SUB",14,"Germany"],["N. Elvedi",72,["CB","RB","CDM"],"RCB",30,"Switzerland"],["C. Heimeroth",68,["GK"],"RES",33,"Germany"],["J. Blaswich",67,["GK"],"RES",36,"Germany"],["L. Bénes",65,["CAM","CM","LM"],"RES",22,"Slovakia"],["M. Schulz",65,["CB","CDM"],"SUB",15,"Germany"],["M. Doucouré",62,["CB"],"RES",29,"France"],["D. Sow",59,["CM","CDM"],"RES",20,"Switzerland"],["B. Simakala",59,["CF"],"RES",44,"Germany"],["T. Ndenge",59,["LM","LB"],"RES",26,"Germany"],["B. Sezer",59,["CAM"],"RES",32,"Azerbaijan"],["M. Nicolas",52,["GK"],"RES",35,"Germany"]],"reserves":[["F. Johnson",79,["LM","RB"],"SUB",19,"United States"],["Álvaro Domínguez",77,["CB","LB"],"SUB",18,"Spain"],["J. Hofmann",77,["RM","LM"],"SUB",23,"Germany"]]},
    "Schalke 04":{"formation":"4-2-3-1 (2)","slots":["GK","RCB","LCB","RM","ST","CAM","LB","LM","RDM","LDM","RB"],"players":[["R. Fährmann",84,["GK"],"GK",1,"Germany"],["Naldo",84,["CB"],"RCB",29,"Brazil"],["B. Höwedes",84,["CB","RB","LB"],"LCB",4,"Germany"],["Y. Konoplyanka",83,["LM"],"RM",11,"Ukraine"],["K. Huntelaar",81,["ST"],"ST",25,"Netherlands"],["M. Meyer",80,["CAM","LM","CM"],"CAM",7,"Germany"],["M. Nastasić",80,["CB"],"SUB",31,"Serbia"],["Coke",80,["RB","RM"],"RES",23,"Spain"],["L. Goretzka",79,["CM","RM","CDM"],"SUB",8,"Germany"],["J. Geis",79,["CDM","CM"],"SUB",5,"Germany"],["A. Baba",78,["LB","LM"],"LB",14,"Ghana"],["E. Choupo-Moting",78,["LM","ST","RM"],"LM",13,"Cameroon"],["S. Sam",77,["RM","CF","CAM"],"RES",18,"Germany"],["F. Di Santo",77,["ST"],"SUB",9,"Argentina"],["B. Embolo",76,["RM","ST"],"SUB",36,"Switzerland"],["B. Stambouli",76,["CDM","CM"],"RDM",17,"France"],["D. Aogo",76,["CDM","LB"],"SUB",15,"Germany"],["N. Bentaleb",75,["CDM","CM"],"LDM",10,"Algeria"],["A. Schöpf",75,["RM","CAM","CM","LM"],"SUB",21,"Austria"],["S. Kolašinac",75,["LB","CDM"],"SUB",6,"Bosnia Herzegovina"],["Júnior Caiçara",75,["RB","RM"],"RB",3,"Brazil"],["A. Uchida",75,["RB","RWB"],"RES",22,"Japan"],["S. Riether",74,["RB","CB"],"SUB",27,"Germany"],["T. Wellenreuther",72,["GK"],"RES",30,"Germany"],["D. Avdijaj",72,["CAM","LM","ST"],"RES",33,"Germany"],["F. Giefer",72,["GK"],"SUB",34,"Germany"],["A. Nübel",61,["GK"],"SUB",35,"Germany"],["T. Kehrer",61,["CB","CDM"],"SUB",20,"Germany"],["F. Schröter",61,["ST","LM"],"RES",37,"Germany"],["F. Reese",60,["ST","LM","RM"],"RES",16,"Germany"],["B. Tekpetey",59,["RM","LM","CF"],"RES",32,"Ghana"],["C. Rubio Sivodedov",59,["CM"],"RES",39,"Sweden"],["J. Bitter",59,["CB","RB","LB"],"RES",28,"Germany"]],"reserves":[["F. Di Santo",77,["ST"],"SUB",9,"Argentina"],["S. Sam",77,["RM","CF","CAM"],"RES",18,"Germany"],["D. Aogo",76,["CDM","LB"],"SUB",15,"Germany"]]},
    "Mainz 05":{"formation":"4-1-4-1","slots":["LCM","ST","RCB","GK","LCB","RCM","LM","RB","LB","RM","CDM"],"players":[["Y. Mallı",79,["CAM","CF","CM"],"LCM",10,"Turkey"],["Jairo",77,["LM","RM"],"SUB",17,"Spain"],["J. Córdoba",77,["ST"],"ST",15,"Colombia"],["S. Bell",77,["CB"],"RCB",16,"Germany"],["J. Lössl",77,["GK"],"GK",1,"Denmark"],["D. Latza",76,["CM","CDM"],"SUB",6,"Germany"],["C. Clemens",76,["RM","LM"],"SUB",27,"Germany"],["L. Balogun",76,["CB","RB"],"LCB",3,"Nigeria"],["F. Frei",76,["CM","CDM","CAM"],"RCM",20,"Switzerland"],["N. Bungert",76,["CB"],"SUB",26,"Germany"],["P. De Blasis",76,["RM","LM","ST"],"LM",32,"Argentina"],["Y. Mutō",75,["ST","LM"],"SUB",9,"Japan"],["José Rodríguez",75,["CM","RM","CAM","CDM"],"SUB",5,"Spain"],["G. Donati",75,["RB","LB"],"RB",2,"Italy"],["G. Bussmann",75,["LB"],"SUB",24,"France"],["D. Brosinski",75,["RB","LB","RM"],"LB",18,"Germany"],["L. Öztunalı",74,["RM","LM","CAM"],"RM",8,"Germany"],["J. Gbamin",73,["CDM","CB","RB","CM"],"CDM",25,"France"],["M. Beister",73,["RM","ST","LM"],"RES",49,"Germany"],["G. Curci",73,["GK"],"SUB",23,"Italy"],["André Ramalho",72,["CB","CDM"],"SUB",22,"Brazil"],["N. Zimling",72,["CM","CAM","CDM"],"RES",48,"Denmark"],["K. Onisiwo",71,["LM","LW","ST"],"SUB",21,"Austria"],["E. Berggreen",70,["ST"],"RES",11,"Denmark"],["G. Holtmann",69,["LM","LW"],"SUB",38,"Germany"],["B. Halimi",68,["CAM","RM"],"RES",30,"Kosovo"],["S. Serdar",66,["CM","CDM"],"SUB",45,"Germany"],["A. Hack",66,["CB"],"RES",42,"Germany"],["P. Klement",65,["CAM"],"RES",47,"Germany"],["D. Parker",64,["LM","RM"],"RES",29,"Germany"],["J. Huth",63,["GK"],"RES",33,"Germany"],["F. Müller",59,["GK"],"RES",46,"Germany"]],"reserves":[["José Rodríguez",75,["CM","RM","CAM","CDM"],"SUB",5,"Spain"],["Y. Mutō",75,["ST","LM"],"SUB",9,"Japan"],["G. Bussmann",75,["LB"],"SUB",24,"France"]]},
    "Hertha BSC":{"formation":"4-2-3-1 (2)","slots":["LCB","RDM","ST","RCB","LB","CAM","GK","RB","RM","LDM","LM"],"players":[["S. Kalou",81,["LM","ST","CAM"],"SUB",8,"Ivory Coast"],["J. Brooks",79,["CB"],"LCB",25,"United States"],["V. Darida",79,["CM","CDM","CAM"],"SUB",6,"Czech Republic"],["P. Skjelbred",78,["CDM","CM"],"RDM",3,"Norway"],["V. Ibišević",78,["ST"],"ST",19,"Bosnia Herzegovina"],["S. Langkamp",78,["CB"],"RCB",15,"Germany"],["M. Plattenhardt",77,["LB"],"LB",21,"Germany"],["V. Stocker",77,["CAM","LM"],"CAM",14,"Switzerland"],["R. Jarstein",77,["GK"],"GK",22,"Norway"],["P. Pekarík",77,["RB"],"RB",2,"Slovakia"],["M. Weiser",76,["RB","RM"],"RM",23,"Germany"],["F. Lustenberger",76,["CDM","CB"],"LDM",28,"Switzerland"],["T. Kraft",76,["GK"],"SUB",1,"Germany"],["G. Haraguchi",75,["LM","RM"],"LM",24,"Japan"],["J. Schieber",75,["ST"],"SUB",16,"Germany"],["A. Baumjohann",75,["CAM","LM"],"SUB",9,"Germany"],["N. Stark",74,["CB","CDM","CM"],"SUB",5,"Germany"],["A. Esswein",74,["RM","LM"],"SUB",7,"Germany"],["O. Duda",73,["CAM"],"SUB",10,"Slovakia"],["S. Allagui",73,["RM","ST"],"RES",11,"Tunisia"],["J. Hegeler",73,["CB","CM"],"SUB",13,"Germany"],["M. Mittelstädt",64,["LB","RM","LM"],"SUB",34,"Germany"],["Allan",64,["CM"],"SUB",20,"Brazil"],["S. Kurt",64,["LM","CAM","CF"],"SUB",18,"Germany"],["F. Kohls",59,["CM"],"RES",31,"Germany"],["N. Körber",56,["GK"],"RES",29,"Germany"]],"reserves":[["A. Baumjohann",75,["CAM","LM"],"SUB",9,"Germany"],["N. Stark",74,["CB","CDM","CM"],"SUB",5,"Germany"],["A. Esswein",74,["RM","LM"],"SUB",7,"Germany"]]},
    "Wolfsburg":{"formation":"4-2-3-1 (2)","slots":["RM","LB","RDM","ST","RB","LCB","CAM","LM","GK","RCB","LDM"],"players":[["J. Draxler",84,["CAM","LM","RM"],"RM",10,"Germany"],["R. Rodríguez",83,["LB"],"LB",34,"Switzerland"],["Luiz Gustavo",83,["CDM","CM"],"RDM",22,"Brazil"],["M. Gómez",82,["ST"],"ST",33,"Germany"],["Vieirinha",81,["RM","RB"],"RB",8,"Portugal"],["J. Bruma",80,["CB"],"LCB",5,"Netherlands"],["D. Didavi",80,["CAM","CM"],"CAM",11,"Germany"],["J. Guilavogui",80,["CDM","CM"],"SUB",23,"France"],["M. Arnold",79,["CM","CAM","CDM"],"SUB",27,"Germany"],["D. Benaglio",79,["GK"],"SUB",1,"Switzerland"],["J. Błaszczykowski",79,["RM"],"SUB",14,"Poland"],["D. Caligiuri",79,["LM","RM"],"LM",7,"Italy"],["K. Casteels",78,["GK"],"GK",28,"Belgium"],["P. Wollscheid",78,["CB"],"RCB",2,"Germany"],["C. Träsch",78,["RB","CDM"],"SUB",15,"Germany"],["Y. Gerhardt",77,["CM","CDM","LM"],"LDM",13,"Germany"],["S. Jung",77,["RB"],"RES",24,"Germany"],["R. Knoche",76,["CB"],"SUB",31,"Germany"],["M. Schäfer",76,["LB","LM"],"SUB",4,"Germany"],["Borja Mayoral",72,["ST"],"SUB",17,"Spain"],["Bruno Henrique",72,["RW","ST","RM"],"SUB",16,"Brazil"],["C. Ascues",71,["CB","CDM"],"SUB",6,"Peru"],["M. Grün",68,["GK"],"SUB",20,"Germany"],["J. Brekalo",65,["LM","RM"],"SUB",25,"Croatia"],["M. Sarr",65,["CB"],"RES",32,"Germany"],["O. Zawada",63,["ST"],"RES",37,"Poland"],["I. Azzaoui",61,["LM"],"RES",38,"Belgium"],["J. Horn",60,["LB"],"RES",21,"Germany"],["A. Condé",60,["CM"],"RES",29,"Germany"],["P. Seguin",60,["CDM"],"RES",30,"Germany"],["S. Stolze",60,["ST"],"RES",39,"Germany"],["A. Donkor",59,["LM"],"RES",35,"Germany"],["R. Ziegele",59,["CB"],"RES",40,"Germany"]],"reserves":[["C. Träsch",78,["RB","CDM"],"SUB",15,"Germany"],["S. Jung",77,["RB"],"RES",24,"Germany"],["M. Schäfer",76,["LB","LM"],"SUB",4,"Germany"]]},
    "Hoffenheim":{"formation":"4-3-3 (4)","slots":["RCB","GK","LCM","RCM","LW","LCB","RW","ST","CAM","RB","LB"],"players":[["N. Süle",81,["CB"],"RCB",25,"Germany"],["O. Baumann",80,["GK"],"GK",1,"Germany"],["S. Rudy",78,["CM","CDM","RM","RB"],"LCM",6,"Germany"],["E. Polański",78,["CDM","CM"],"RCM",8,"Poland"],["F. Schär",77,["CB"],"SUB",5,"Switzerland"],["A. Kramarić",77,["ST","LW"],"LW",27,"Croatia"],["E. Bičakčić",77,["CB"],"LCB",4,"Bosnia Herzegovina"],["E. Vargas",77,["CF","ST","RM"],"SUB",9,"Chile"],["P. Schwegler",77,["CDM","CM"],"SUB",16,"Switzerland"],["M. Uth",76,["ST","RW","RM"],"RW",19,"Germany"],["K. Vogt",76,["CDM"],"SUB",22,"Germany"],["L. Rupp",76,["RM","CM"],"SUB",7,"Germany"],["S. Wagner",76,["ST"],"ST",14,"Germany"],["N. Amiri",75,["CAM","CM","LM"],"CAM",18,"Germany"],["P. Kadeřábek",75,["RB"],"RB",3,"Czech Republic"],["B. Hübner",75,["CB"],"SUB",21,"Germany"],["Kim Jin Su",74,["LB"],"SUB",20,"Korea Republic"],["S. Zuber",74,["LM"],"SUB",17,"Switzerland"],["A. Szalai",74,["ST"],"RES",28,"Hungary"],["J. Toljan",73,["LB","LWB","LM"],"LB",15,"Germany"],["K. Demirbay",73,["CAM","CM","CDM","ST"],"SUB",13,"Germany"],["J. Hamad",72,["RM","CAM"],"RES",11,"Sweden"],["M. Terrazzino",71,["LM","CAM"],"SUB",23,"Germany"],["M. Marić",66,["GK"],"RES",38,"Croatia"],["A. Stolz",66,["GK"],"SUB",33,"Germany"],["P. Ochs",65,["LM","ST","LB"],"SUB",30,"Germany"],["B. Atik",60,["CAM"],"RES",34,"Turkey"],["D. Geiger",57,["CM","LB"],"RES",32,"Germany"],["G. Kobel",54,["GK"],"RES",36,"Switzerland"]],"reserves":[["L. Rupp",76,["RM","CM"],"SUB",7,"Germany"],["B. Hübner",75,["CB"],"SUB",21,"Germany"],["S. Zuber",74,["LM"],"SUB",17,"Switzerland"]]},
    "Eintracht Frankfurt":{"formation":"4-2-3-1 (2)","slots":["ST","GK","RCB","RM","LB","CAM","RDM","RB","LDM","LCB","LM"],"players":[["A. Meier",79,["ST","CF","CAM"],"ST",14,"Germany"],["L. Hrádecký",78,["GK"],"GK",1,"Finland"],["D. Abraham",77,["CB"],"RCB",19,"Argentina"],["M. Stendera",76,["CAM","CM","CDM"],"SUB",21,"Germany"],["H. Seferović",76,["ST","LM"],"RM",9,"Switzerland"],["B. Oczipka",76,["LB"],"LB",6,"Germany"],["M. Russ",76,["CB","CDM"],"RES",4,"Germany"],["Bamba Anderson",76,["CB"],"RES",23,"Brazil"],["M. Fabián",75,["CAM","LM"],"CAM",10,"Mexico"],["M. Hasebe",75,["CDM","CM","RB"],"RDM",20,"Japan"],["Omar Mascarell",74,["CM","CDM"],"SUB",39,"Spain"],["T. Chandler",74,["RB"],"RB",22,"United States"],["S. Huszti",74,["LM","RM","CM"],"LDM",8,"Hungary"],["Vallejo",73,["CB"],"LCB",5,"Spain"],["S. Medojević",73,["CDM"],"RES",25,"Serbia"],["J. Flum",73,["CDM","CM"],"SUB",18,"Germany"],["B. Hrgota",71,["ST","LM"],"SUB",31,"Sweden"],["M. Hector",71,["CB","CDM"],"SUB",15,"Jamaica"],["H. Lindner",71,["GK"],"SUB",13,"Austria"],["M. Gaćinović",70,["LM","CAM"],"LM",11,"Serbia"],["A. Rebić",70,["ST","RW","LW"],"SUB",17,"Croatia"],["S. Tarashaj",69,["CAM","ST"],"SUB",30,"Switzerland"],["G. Varela",69,["RB"],"SUB",3,"Uruguay"],["D. Blum",69,["ST","RM","LM"],"SUB",7,"Germany"],["Y. Regäsel",68,["RB"],"SUB",2,"Germany"],["T. Tawatha",68,["LB"],"SUB",33,"Israel"],["J. Gerezgiher",62,["LM","RM"],"RES",32,"Germany"],["E. Bunjaki",59,["ST"],"RES",38,"Kosovo"],["F. Zorba",57,["CB"],"RES",36,"Germany"],["L. Bätge",56,["GK"],"RES",34,"Germany"]],"reserves":[["J. Flum",73,["CDM","CM"],"SUB",18,"Germany"],["S. Medojević",73,["CDM"],"RES",25,"Serbia"],["H. Lindner",71,["GK"],"SUB",13,"Austria"]]},
    "Werder Bremen":{"formation":"4-2-3-1 (2)","slots":["ST","CAM","RCB","GK","RB","RDM","LCB","RM","LB","LM","LDM"],"players":[["M. Kruse",80,["CF","ST","CAM"],"SUB",10,"Germany"],["C. Pizarro",79,["ST","CAM"],"ST",14,"Peru"],["Z. Junuzović",79,["CM","CAM","LM"],"CAM",16,"Austria"],["L. Sané",79,["CB","CDM"],"RCB",26,"Senegal"],["J. Drobný",77,["GK"],"GK",33,"Czech Republic"],["F. Wiedwald",76,["GK"],"SUB",42,"Germany"],["T. Gebre Selassie",76,["RB"],"RB",23,"Czech Republic"],["F. Kainz",75,["LM","LW","CAM"],"SUB",7,"Austria"],["L. Caldirola",75,["CB","LB"],"SUB",3,"Italy"],["F. Diagne",75,["CB","RB"],"SUB",21,"Senegal"],["P. Bargfrede",75,["CDM"],"SUB",44,"Germany"],["C. Fritz",75,["CM","RM","CDM"],"RDM",8,"Germany"],["N. Moisander",75,["CB"],"LCB",18,"Finland"],["F. Bartels",75,["RM","LM","CAM","ST"],"RM",22,"Germany"],["S. García",75,["LB"],"LB",2,"Argentina"],["A. Jóhannsson",74,["ST"],"SUB",9,"United States"],["S. Gnabry",73,["RM"],"LM",29,"Germany"],["S. Yatabaré",73,["RM","CM","CDM"],"SUB",5,"Mali"],["F. Grillitsch",72,["CM","CDM","LM","RM"],"LDM",27,"Austria"],["I. Hajrović",72,["RM","CAM","CM"],"RES",15,"Bosnia Herzegovina"],["L. Thy",70,["ST"],"RES",11,"Germany"],["R. Bauer",69,["LB","CDM","RB"],"SUB",4,"Germany"],["J. Eilers",69,["RW","LW","RM"],"RES",17,"Germany"],["T. Petsos",68,["CDM","CM"],"RES",25,"Greece"],["R. Wolf",68,["GK"],"RES",1,"Germany"],["J. Sternberg",65,["LB"],"SUB",37,"Germany"],["J. Eggestein",64,["ST"],"SUB",24,"Germany"],["U. Garcia",64,["LB","LM"],"RES",20,"Switzerland"],["M. Lorenzen",64,["ST","LW","RW"],"RES",28,"Uganda"],["M. Veljković",63,["CB","CDM"],"RES",13,"Serbia"],["M. Zetterer",63,["GK"],"RES",30,"Germany"],["M. Eggestein",62,["CAM"],"SUB",35,"Germany"],["L. Zander",61,["RB"],"RES",19,"Germany"]],"reserves":[["F. Diagne",75,["CB","RB"],"SUB",21,"Senegal"],["P. Bargfrede",75,["CDM"],"SUB",44,"Germany"],["A. Jóhannsson",74,["ST"],"SUB",9,"United States"]]},
    "Hamburg":{"formation":"4-2-3-1 (2)","slots":["GK","LM","LCB","LDM","CAM","RCB","RM","LB","ST","RB","RDM"],"players":[["R. Adler",81,["GK"],"GK",1,"Germany"],["F. Kostić",80,["LM"],"LM",17,"Serbia"],["A. Halilović",79,["CAM","RM"],"SUB",23,"Croatia"],["E. Spahić",79,["CB"],"LCB",4,"Bosnia Herzegovina"],["L. Holtby",78,["CM"],"LDM",8,"Germany"],["P. Lasogga",77,["ST"],"SUB",10,"Germany"],["A. Hunt",77,["CAM"],"CAM",14,"Germany"],["J. Djourou",77,["CB"],"RCB",5,"Switzerland"],["N. Müller",77,["RM"],"RM",27,"Germany"],["A. Ekdal",76,["CM"],"SUB",20,"Sweden"],["Douglas Santos",75,["LB","LW"],"LB",6,"Brazil"],["Cléber",75,["CB"],"SUB",3,"Brazil"],["B. Wood",74,["ST"],"ST",7,"United States"],["C. Mathenia",74,["GK"],"SUB",31,"Germany"],["D. Diekmeier",74,["RB"],"SUB",2,"Germany"],["G. Sakai",74,["RB","LB"],"RB",24,"Japan"],["M. Ostrzolek",74,["LB"],"RES",22,"Germany"],["N. Bahoui",73,["LM","RM"],"SUB",21,"Sweden"],["M. Gregoritsch",72,["LM","CAM","RM"],"SUB",11,"Austria"],["G. Jung",69,["CDM","CM"],"RDM",28,"Germany"],["A. Götz",66,["RB","RM"],"RES",39,"Germany"],["T. Mickel",65,["GK"],"SUB",36,"Germany"],["G. Waldschmidt",63,["ST","LM"],"SUB",15,"Germany"],["B. Jatta",61,["RW","LW"],"SUB",18,"Gambia"],["M. Köhlert",61,["LM","ST"],"RES",25,"Germany"],["Seo Young-Jae",61,["LB","LM"],"RES",37,"Korea Republic"],["A. Hirzel",60,["GK"],"RES",30,"Switzerland"],["F. Porath",59,["CM","LM"],"SUB",34,"Germany"],["F. Ronstadt",58,["RB","RM"],"RES",32,"Germany"],["D. Feka",55,["CDM","LB"],"RES",19,"Germany"]],"reserves":[["D. Diekmeier",74,["RB"],"SUB",2,"Germany"],["M. Ostrzolek",74,["LB"],"RES",22,"Germany"],["C. Mathenia",74,["GK"],"SUB",31,"Germany"]]},
    "FC Augsburg":{"formation":"4-2-3-1 (2)","slots":["LDM","GK","CAM","RB","RM","ST","RCB","LCB","RDM","LB","LM"],"players":[["D. Baier",80,["CDM"],"LDM",10,"Germany"],["M. Hitz",80,["GK"],"GK",35,"Switzerland"],["Koo Ja Cheol",78,["CAM","LM","RM"],"CAM",19,"Korea Republic"],["P. Verhaegh",78,["RB"],"RB",2,"Netherlands"],["R. Bobadilla",78,["ST","RM"],"RM",25,"Paraguay"],["T. Usami",77,["LM","ST","CAM"],"SUB",39,"Japan"],["A. Finnbogason",77,["ST"],"ST",27,"Iceland"],["J. Gouweleeuw",76,["CB"],"RCB",6,"Netherlands"],["J. Schmid",76,["LM","RM"],"SUB",11,"France"],["H. Altıntop",76,["CAM","CM"],"SUB",7,"Turkey"],["G. Kačar",76,["CB","CDM","CM"],"SUB",20,"Serbia"],["M. Hinteregger",75,["CB"],"LCB",36,"Austria"],["D. Kohr",75,["CDM","CM"],"SUB",21,"Germany"],["Caiuby",75,["LM","ST"],"SUB",30,"Brazil"],["D. Opare",74,["RB","LB"],"SUB",4,"Ghana"],["M. Feulner",74,["CM","RB","CDM"],"RDM",8,"Germany"],["J. Callsen-Bracker",73,["CB"],"RES",18,"Germany"],["K. Stafylidis",72,["LB"],"LB",3,"Greece"],["P. Max",72,["LB"],"SUB",31,"Germany"],["J. Morávek",72,["CM","CAM"],"SUB",14,"Czech Republic"],["Ji Dong Won",71,["CAM","ST","LM"],"LM",22,"Korea Republic"],["A. Luthe",71,["GK"],"SUB",1,"Germany"],["C. Janker",70,["CB","RB"],"RES",16,"Germany"],["G. Teigl",69,["RB","RM"],"SUB",28,"Austria"],["M. Friedrich",65,["CB","RB"],"SUB",15,"Germany"],["T. Rieder",60,["CB"],"RES",40,"Germany"],["A. Ekin",59,["LM"],"RES",37,"Turkey"],["I. Gelios",59,["GK"],"RES",24,"Greece"],["R. Framberger",58,["RB"],"RES",32,"Germany"],["M. Schuster",58,["CDM","CM"],"RES",29,"Germany"],["B. Kurz",57,["ST","CF"],"RES",26,"Germany"],["M. Reinthaler",54,["CM"],"RES",38,"Italy"]],"reserves":[["D. Kohr",75,["CDM","CM"],"SUB",21,"Germany"],["Caiuby",75,["LM","ST"],"SUB",30,"Brazil"],["D. Opare",74,["RB","LB"],"SUB",4,"Ghana"]]},
    "SC Freiburg":{"formation":"5-3-2","slots":["LCM","RS","LS","RWB","RCM","CM","LWB","CB","RCB","LCB","GK"],"players":[["N. Petersen",76,["ST"],"SUB",18,"Germany"],["V. Grifo",75,["LM"],"LCM",32,"Italy"],["M. Philipp",74,["CF","ST","LM"],"RS",26,"Germany"],["F. Niederlechner",74,["ST"],"LS",7,"Germany"],["A. Ignjovski",74,["RB","CDM","LB","LM"],"RWB",2,"Serbia"],["Torrejón",74,["CB","RB"],"SUB",3,"Spain"],["M. Kempf",73,["CB"],"SUB",20,"Germany"],["M. Frantz",73,["RM","LM","CDM","CF"],"RCM",8,"Germany"],["H. Nielsen",72,["ST","CF"],"SUB",14,"Norway"],["A. Abrashi",72,["CDM","CM"],"CM",6,"Albania"],["C. Günter",72,["LB"],"LWB",30,"Germany"],["R. Gikiewicz",72,["GK"],"SUB",44,"Poland"],["G. Niedermeier",72,["CB"],"CB",24,"Germany"],["M. Gulde",71,["CB"],"RCB",5,"Germany"],["N. Höfler",71,["CDM","CB"],"LCB",27,"Germany"],["J. Haberer",70,["CAM"],"SUB",19,"Germany"],["M. Møller Dæhli",70,["LM","CAM","RM"],"SUB",16,"Norway"],["J. Meffert",70,["CDM","CM"],"SUB",22,"Germany"],["A. Schwolow",70,["GK"],"GK",1,"Germany"],["J. Schuster",70,["CDM","CM"],"SUB",23,"Germany"],["C. Söyüncü",69,["CB"],"SUB",4,"Turkey"],["O. Bulut",69,["RM"],"SUB",11,"Germany"],["P. Klandt",69,["GK"],"RES",21,"Germany"],["L. Kübler",67,["RB"],"RES",17,"Germany"],["P. Stenzel",66,["RB"],"RES",15,"Germany"],["L. Hufnagel",66,["RM"],"RES",35,"Georgia"],["K. Guédé",66,["ST","RM"],"SUB",31,"Slovakia"],["J. Föhrenbach",64,["CB","LB"],"RES",25,"Germany"],["C. Laprevotte",61,["CM","LM"],"RES",29,"France"],["A. Falahen",59,["ST"],"RES",34,"Palestine"]],"reserves":[["R. Gikiewicz",72,["GK"],"SUB",44,"Poland"],["M. Møller Dæhli",70,["LM","CAM","RM"],"SUB",16,"Norway"],["J. Haberer",70,["CAM"],"SUB",19,"Germany"]]},
    "RB Leipzig":{"formation":"4-2-2-2","slots":["LAM","RAM","RS","RCB","LS","LB","GK","LCB","RDM","LDM","RB"],"players":[["K. Papadopoulos",79,["CB"],"SUB",5,"Greece"],["E. Forsberg",76,["LM"],"LAM",10,"Sweden"],["T. Werner",75,["ST","LM"],"SUB",11,"Germany"],["N. Keïta",75,["CM","CDM"],"RAM",8,"Guinea"],["M. Sabitzer",74,["CAM","RM","ST"],"RS",7,"Austria"],["W. Orban",74,["CB"],"RCB",4,"Germany"],["Y. Poulsen",73,["ST","RM"],"LS",9,"Denmark"],["D. Selke",73,["ST"],"SUB",27,"Germany"],["M. Halstenberg",73,["LB"],"LB",23,"Germany"],["P. Gulácsi",73,["GK"],"GK",32,"Hungary"],["M. Compper",73,["CB"],"LCB",33,"Germany"],["D. Kaiser",73,["RM","CM"],"RDM",24,"Germany"],["L. Klostermann",72,["RB"],"RES",16,"Germany"],["D. Demme",72,["CDM","CM"],"LDM",31,"Germany"],["F. Coltorti",72,["GK"],"SUB",1,"Switzerland"],["S. Ilsanker",71,["CDM","CB"],"SUB",13,"Austria"],["R. Khedira",69,["CDM","CM"],"SUB",6,"Germany"],["O. Burke",68,["RM","RW"],"SUB",19,"Scotland"],["M. Müller",68,["GK"],"SUB",21,"Germany"],["B. Schmitz",68,["RB","LB","CDM"],"SUB",20,"Germany"],["Z. Kalmár",67,["LM","CM"],"SUB",35,"Hungary"],["T. Boyd",67,["ST"],"SUB",18,"United States"],["B. Bellot",65,["GK"],"RES",22,"Germany"],["Bernardo",60,["CB","LB","CDM"],"RB",3,"Brazil"],["K. Gipson",60,["RB"],"SUB",36,"Germany"],["F. Palacios Martínez",60,["ST","CAM"],"RES",38,"Germany"],["J. Strauß",59,["LM","CDM"],"RES",2,"Germany"],["G. Fechner",58,["CB","CDM"],"RES",28,"Germany"],["V. Janelt",57,["CDM"],"RES",26,"Germany"],["I. Touré",56,["CAM","CM"],"RES",40,"Germany"],["S. Reddemann",55,["CB"],"RES",37,"Germany"]],"reserves":[["F. Coltorti",72,["GK"],"SUB",1,"Switzerland"],["S. Ilsanker",71,["CDM","CB"],"SUB",13,"Austria"],["R. Khedira",69,["CDM","CM"],"SUB",6,"Germany"]]},
    "FC Ingolstadt":{"formation":"4-3-3 (2)","slots":["RCB","RCM","CDM","GK","ST","LCB","LW","LCM","LB","RW","RB"],"players":[["M. Matip",77,["CB"],"RCB",34,"Cameroon"],["P. Groß",76,["CM","CAM"],"RCM",10,"Germany"],["Roger",76,["CDM"],"CDM",8,"Brazil"],["O. Nyland",74,["GK"],"GK",1,"Norway"],["D. Lezcano",74,["ST"],"ST",37,"Paraguay"],["M. Tisserand",73,["CB","RB"],"LCB",32,"DR Congo"],["L. Hinterseer",73,["ST","RW"],"SUB",16,"Austria"],["R. Brégerie",73,["CB","CDM"],"SUB",18,"France"],["R. Leipertz",72,["RM","ST","CAM"],"SUB",13,"Germany"],["M. Hansen",72,["GK"],"SUB",35,"Denmark"],["M. Leckie",72,["LW","ST"],"LW",7,"Australia"],["A. Morales",72,["CM","CDM"],"LCM",6,"United States"],["M. Suttner",72,["LB"],"LB",29,"Austria"],["M. Hartmann",72,["RW","ST","LW"],"RW",9,"Germany"],["T. Levels",71,["RB","CB"],"RB",28,"Germany"],["A. Cohen",71,["CDM","CM"],"SUB",36,"Israel"],["F. Hadergjonaj",70,["RB"],"SUB",33,"Switzerland"],["M. Christiansen",70,["CDM"],"SUB",19,"Germany"],["S. Kittel",69,["LM","CAM"],"SUB",21,"Germany"],["H. Wahl",69,["CB"],"SUB",17,"Germany"],["A. Jung",69,["LB"],"SUB",3,"Germany"],["S. Lex",69,["RW","ST","LW"],"SUB",14,"Germany"],["M. Multhaup",60,["RM","CAM"],"SUB",31,"Germany"],["N. Rinderknecht",59,["CDM","CB"],"RES",22,"Germany"],["C. Ortag",59,["GK"],"RES",39,"Germany"],["M. Zant",59,["CB"],"RES",38,"Germany"],["F. Buntić",52,["GK"],"RES",24,"Croatia"]],"reserves":[["A. Cohen",71,["CDM","CM"],"SUB",36,"Israel"],["M. Christiansen",70,["CDM"],"SUB",19,"Germany"],["F. Hadergjonaj",70,["RB"],"SUB",33,"Switzerland"]]},
    "Darmstadt 98":{"formation":"4-4-1-1","slots":["RCB","RM","LM","LCM","LCB","RCM","ST","LB","RB","CF","GK"],"players":[["A. Sulu",78,["CB"],"RCB",4,"Turkey"],["A. Fedetskyi",76,["RB"],"SUB",7,"Ukraine"],["A. Ben-Hatira",75,["LM","RM"],"RM",28,"Tunisia"],["M. Heller",75,["RM","LM"],"LM",20,"Germany"],["J. Gondorf",75,["CM","CDM"],"LCM",8,"Germany"],["A. Milošević",73,["CB"],"LCB",3,"Sweden"],["M. Vrančić",73,["CM","CAM"],"SUB",6,"Bosnia Herzegovina"],["P. Niemeyer",73,["CDM"],"RCM",18,"Germany"],["S. Schipplock",73,["ST"],"ST",39,"Germany"],["V. Obinna",72,["ST","CF"],"SUB",11,"Nigeria"],["F. Holland",71,["LB"],"LB",32,"Germany"],["F. Jungwirth",71,["RB","CDM","CM"],"RB",23,"Germany"],["J. Rosenthal",71,["CF","ST","CAM"],"SUB",10,"Germany"],["D. Oliynyk",71,["LM"],"SUB",22,"Ukraine"],["R. Bezjak",71,["ST","RM","LM"],"CF",14,"Slovenia"],["D. Stroh-Engel",70,["ST"],"SUB",9,"Germany"],["L. Kleinheisler",69,["LM","CM","CAM","RM"],"SUB",30,"Hungary"],["I. Höhn",69,["CB"],"SUB",21,"Germany"],["M. Esser",69,["GK"],"GK",31,"Germany"],["A. Čolak",68,["ST"],"SUB",16,"Croatia"],["B. Gorka",68,["CB"],"RES",5,"Germany"],["F. Platte",67,["ST"],"RES",19,"Germany"],["D. Heuer Fernandes",67,["GK"],"SUB",1,"Portugal"],["S. Sirigu",67,["RM","RB"],"SUB",17,"Germany"],["I. Berezovskyi",65,["GK"],"RES",24,"Ukraine"],["L. Guwara",61,["LB"],"SUB",2,"Germany"],["L. Fisch",57,["LM"],"RES",37,"Germany"],["D. Thur",56,["CB","CDM","LB"],"RES",38,"Germany"],["J. Wolff",55,["RB","RM"],"RES",35,"Germany"],["C. Aydogan",55,["LB","RB"],"RES",36,"Germany"]],"reserves":[["D. Oliynyk",71,["LM"],"SUB",22,"Ukraine"],["D. Stroh-Engel",70,["ST"],"SUB",9,"Germany"],["I. Höhn",69,["CB"],"SUB",21,"Germany"]]},
    "1. FC Köln":{"formation":"4-4-2 (2)","slots":["GK","LB","RS","RDM","LCB","LM","RM","LDM","RB","RCB","LS"],"players":[["T. Horn",82,["GK"],"GK",1,"Germany"],["J. Hector",80,["LB","CDM"],"LB",14,"Germany"],["A. Modeste",80,["ST"],"RS",27,"France"],["M. Höger",78,["CM","CDM"],"RDM",6,"Germany"],["D. Heintz",77,["CB"],"LCB",3,"Germany"],["L. Bittencourt",77,["LM","RM"],"LM",21,"Germany"],["M. Risse",77,["RM","RB"],"RM",7,"Germany"],["M. Lehmann",76,["CDM"],"LDM",33,"Germany"],["D. Maroh",76,["CB"],"SUB",5,"Slovenia"],["F. Sørensen",75,["CB","RB"],"RB",4,"Denmark"],["M. Jojić",75,["CM","RM","CDM"],"SUB",8,"Serbia"],["M. Mavraj",75,["CB"],"RCB",15,"Albania"],["S. Zoller",74,["ST","RM"],"SUB",11,"Germany"],["K. Rausch",74,["LM","LB"],"SUB",34,"Germany"],["P. Olkowski",74,["RB","RM"],"SUB",16,"Poland"],["Y. Ōsako",73,["CF","ST","CAM","RM"],"LS",13,"Japan"],["A. Rudņevs",73,["ST"],"SUB",9,"Latvia"],["F. Mladenović",71,["LB"],"SUB",25,"Serbia"],["T. Kessler",70,["GK"],"SUB",18,"Germany"],["S. Guirassy",69,["ST"],"SUB",19,"France"],["M. Hartel",62,["CAM"],"SUB",30,"Germany"],["S. Özcan",60,["CAM"],"RES",20,"Germany"],["L. Klünter",59,["RB","CB"],"SUB",24,"Germany"],["S. Müller",55,["GK"],"SUB",35,"Germany"],["M. Hamrol",50,["GK"],"RES",37,"Germany"]],"reserves":[["P. Olkowski",74,["RB","RM"],"SUB",16,"Poland"],["A. Rudņevs",73,["ST"],"SUB",9,"Latvia"],["F. Mladenović",71,["LB"],"SUB",25,"Serbia"]]},
    "Atalanta":{"formation":"4-3-3 (2)","slots":["GK","LW","ST","RCB","CDM","LCB","LB","RCM","RB","LCM","RW"],"players":[["M. Sportiello",82,["GK"],"GK",57,"Italy"],["A. Gómez",80,["LW"],"LW",10,"Argentina"],["A. Paloschi",78,["ST"],"ST",43,"Italy"],["M. Pinilla",76,["ST"],"SUB",51,"Chile"],["A. Konko",76,["RB","LB","RM"],"RES",25,"France"],["Rafael Tolói",75,["CB"],"RCB",3,"Brazil"],["E. Berisha",75,["GK"],"SUB",1,"Albania"],["J. Kurtić",75,["CM","CDM"],"CDM",27,"Slovenia"],["G. Stendardo",75,["CB"],"LCB",2,"Italy"],["B. Dramé",75,["LB","LM"],"LB",93,"Senegal"],["C. Carmona",75,["CM","CDM"],"RCM",17,"Chile"],["E. Zukanović",75,["CB","LB"],"RB",6,"Bosnia Herzegovina"],["A. Masiello",74,["CB","RB"],"SUB",5,"Italy"],["G. Migliaccio",72,["CM","CDM"],"SUB",8,"Italy"],["A. Grassi",71,["CM"],"SUB",88,"Italy"],["A. Conti",71,["RB","RM"],"SUB",24,"Italy"],["E. Suagher",71,["CB"],"SUB",23,"Italy"],["A. Pešić",71,["ST"],"SUB",9,"Serbia"],["D. Bassi",71,["GK"],"SUB",30,"Italy"],["F. Kessié",70,["CM","RM","CDM"],"LCM",19,"Ivory Coast"],["L. Spinazzola",70,["LM","LB"],"SUB",37,"Italy"],["B. Cabezas",70,["LW"],"RES",52,"Ecuador"],["M. D'Alessandro",70,["RM","RW"],"RW",7,"Italy"],["M. Caldara",69,["CB"],"RES",13,"Italy"],["R. Freuler",68,["CM","CDM","CAM"],"SUB",11,"Switzerland"],["C. Raimondi",68,["RB","RM"],"RES",77,"Italy"],["A. Petagna",66,["ST"],"SUB",29,"Italy"],["R. Gagliardini",61,["CM"],"RES",4,"Italy"],["E. Ceria",58,["LM"],"RES",38,"Italy"]],"reserves":[["G. Migliaccio",72,["CM","CDM"],"SUB",8,"Italy"],["A. Pešić",71,["ST"],"SUB",9,"Serbia"],["E. Suagher",71,["CB"],"SUB",23,"Italy"]]},
    "Bologna":{"formation":"4-3-3 (2)","slots":["ST","LW","RCB","LCB","LCM","RW","RCM","LB","CDM","GK","RB"],"players":[["A. Mirante",81,["GK"],"SUB",83,"Italy"],["M. Destro",78,["ST"],"ST",10,"Italy"],["L. Krejčí",77,["LM","LW"],"LW",11,"Czech Republic"],["D. Gastaldello",77,["CB"],"RCB",28,"Italy"],["V. Torosidis",77,["RB","LB"],"SUB",35,"Greece"],["M. Oikonomou",76,["CB"],"LCB",2,"Greece"],["A. Mounier",76,["RW","LW"],"SUB",7,"France"],["G. Donsah",75,["CM"],"LCM",17,"Ghana"],["S. Verdi",75,["CAM","RW"],"RW",9,"Italy"],["S. Taïder",75,["CM"],"RCM",8,"Algeria"],["A. Masina",75,["LB"],"LB",25,"Italy"],["F. Viviani",75,["CM","CDM"],"SUB",6,"Italy"],["F. Helander",74,["CB"],"RES",18,"Sweden"],["D. Maietta",74,["CB"],"SUB",20,"Italy"],["B. Džemaili",74,["CM","CDM"],"SUB",31,"Switzerland"],["S. Floccari",74,["ST"],"SUB",26,"Italy"],["L. Rizzo",73,["CM","RW","LW"],"SUB",22,"Italy"],["A. Nagy",72,["CDM"],"CDM",16,"Hungary"],["A. Gomis",72,["GK"],"RES",23,"Senegal"],["E. Pulgar",72,["CDM","CM"],"SUB",5,"Chile"],["Da Costa",72,["GK"],"GK",1,"Brazil"],["A. Morleo",71,["LB","LM"],"RES",3,"Italy"],["I. Mbaye",70,["RB","RM"],"SUB",15,"Senegal"],["R. Acquafresca",70,["ST"],"SUB",99,"Italy"],["F. Di Francesco",69,["LW","CF"],"RES",14,"Italy"],["E. Krafth",69,["RB"],"RB",4,"Sweden"],["A. Ferrari",69,["RB","CB"],"RES",24,"Italy"],["S. Umar",64,["ST"],"SUB",19,"Nigeria"],["D. Boldor",63,["CB"],"RES",95,"Romania"],["M. Sarr",62,["GK"],"RES",97,"Senegal"],["A. Tabacchi",59,["RW"],"RES",98,"Italy"]],"reserves":[["F. Helander",74,["CB"],"RES",18,"Sweden"],["D. Maietta",74,["CB"],"SUB",20,"Italy"],["S. Floccari",74,["ST"],"SUB",26,"Italy"]]},
    "Cagliari":{"formation":"4-3-1-2","slots":["RCB","GK","RCM","LS","RS","CAM","LCM","CM","LCB","LB","RB"],"players":[["Bruno Alves",79,["CB"],"RCB",2,"Portugal"],["M. Storari",76,["GK"],"GK",30,"Italy"],["M. Isla",76,["CDM","RB","RM"],"RCM",3,"Chile"],["P. Tachtsidis",75,["CDM","CM"],"SUB",77,"Greece"],["A. Ioniţă",75,["CM","CAM","CDM"],"SUB",21,"Moldova"],["M. Borriello",75,["ST"],"LS",22,"Italy"],["Rafael",75,["GK"],"SUB",1,"Brazil"],["Diego Farías",74,["CAM","ST","RW","LW"],"SUB",17,"Brazil"],["M. Sau",74,["ST","CF"],"RS",25,"Italy"],["João Pedro",73,["CAM","CM"],"CAM",10,"Brazil"],["S. Padoin",73,["LB","RM","CM"],"LCM",20,"Italy"],["D. Di Gennaro",73,["CM"],"CM",8,"Italy"],["F. Melchiorri",73,["ST"],"SUB",9,"Italy"],["M. Capuano",72,["CB"],"SUB",24,"Italy"],["L. Ceppitelli",72,["CB"],"LCB",23,"Italy"],["N. Murru",71,["LB"],"LB",29,"Italy"],["B. Salamon",71,["CB","CDM"],"SUB",35,"Poland"],["D. Dessena",71,["CM","RB"],"SUB",4,"Italy"],["L. Bittante",70,["RB","LB","RM"],"SUB",26,"Italy"],["N. Giannetti",70,["ST","LW"],"SUB",32,"Italy"],["G. Munari",68,["CM","CDM"],"SUB",16,"Italy"],["N. Barella",65,["CM"],"RES",18,"Italy"],["R. Colombo",65,["GK"],"SUB",13,"Italy"],["F. Pisacane",65,["RB","CB"],"RB",19,"Italy"]],"reserves":[["F. Melchiorri",73,["ST"],"SUB",9,"Italy"],["M. Capuano",72,["CB"],"SUB",24,"Italy"],["D. Dessena",71,["CM","RB"],"SUB",4,"Italy"]]},
    "Chievo":{"formation":"4-1-2-1-2","slots":["GK","RCB","LCB","CAM","RM","LM","LS","CDM","LB","RB","RS"],"players":[["S. Sorrentino",80,["GK"],"GK",70,"Italy"],["A. Gamberini",78,["CB"],"RCB",5,"Italy"],["B. Cesar",78,["CB"],"LCB",12,"Slovenia"],["V. Birsa",78,["CAM","RM","LM"],"CAM",23,"Slovenia"],["J. De Guzmán",77,["CAM","CM"],"SUB",1,"Netherlands"],["L. Castro",77,["RM","CM"],"RM",19,"Argentina"],["M. Izco",76,["CM","CDM"],"SUB",13,"Argentina"],["P. Hetemaj",76,["LM","CM"],"LM",56,"Finland"],["R. Meggiorini",76,["ST"],"LS",69,"Italy"],["D. Dainelli",75,["CB"],"SUB",3,"Italy"],["N. Spolli",75,["CB"],"SUB",2,"Argentina"],["I. Radovanovic",75,["CM","CDM"],"CDM",8,"Serbia"],["M. Gobbi",74,["LB","LM"],"LB",18,"Italy"],["S. Pellissier",74,["ST"],"SUB",31,"Italy"],["F. Cacciatore",74,["RB","LB"],"RB",29,"Italy"],["N. Rigoni",73,["CM","CDM"],"SUB",4,"Italy"],["A. Floro Flores",73,["LW","ST"],"SUB",83,"Italy"],["N. Frey",73,["RB"],"SUB",21,"France"],["R. Inglese",72,["ST"],"RS",45,"Italy"],["A. Seculin",70,["GK"],"SUB",90,"Italy"],["W. Bressan",70,["GK"],"RES",32,"Italy"],["V. Parigini",68,["ST","RW","RM","CF"],"SUB",27,"Italy"],["S. Bastien",67,["CAM"],"RES",94,"Belgium"],["G. Sardo",66,["RB"],"SUB",20,"Italy"],["L. Jallow",64,["RM"],"RES",95,"Gambia"],["F. Damian",61,["CM"],"RES",96,"Italy"],["A. Confente",60,["GK"],"RES",98,"Italy"],["F. De Paoli",60,["RM"],"RES",97,"Italy"],["Y. Bobb",60,["RM"],"SUB",22,"Gambia"],["F. Costa",59,["LB"],"RES",36,"Italy"]],"reserves":[["S. Pellissier",74,["ST"],"SUB",31,"Italy"],["N. Rigoni",73,["CM","CDM"],"SUB",4,"Italy"],["N. Frey",73,["RB"],"SUB",21,"France"]]},
    "Crotone":{"formation":"3-4-3 Flat","slots":["LCM","LW","CB","RCM","LM","LCB","RM","RCB","ST","GK","RW"],"players":[["L. Crisetig",73,["CM","CDM"],"LCM",8,"Italy"],["R. Palladino",73,["LW","RW","ST"],"LW",7,"Italy"],["Claiton",73,["CB"],"CB",3,"Brazil"],["M. Rohdén",72,["CM","CDM"],"RCM",6,"Sweden"],["D. Mesbah",72,["LB","LM"],"SUB",15,"Algeria"],["B. Martella",71,["LM","LB"],"LM",87,"Italy"],["N. Dussenne",71,["CB"],"SUB",23,"Belgium"],["G. Ferrari",71,["CB"],"LCB",13,"Italy"],["A. Rosi",71,["RB"],"RM",22,"Italy"],["L. Capezzi",70,["CM"],"SUB",28,"Italy"],["F. Ceccherini",70,["CB","RB"],"RCB",17,"Italy"],["M. Sampirisi",70,["RB","CB"],"SUB",31,"Italy"],["D. Falcinelli",70,["ST"],"ST",11,"Italy"],["A. Stoian",70,["LW","ST","RW"],"SUB",2,"Romania"],["M. Trotta",69,["ST"],"SUB",29,"Italy"],["Simy",69,["ST"],"SUB",99,"Nigeria"],["A. Cordaz",68,["GK"],"GK",1,"Italy"],["A. Tonev",68,["RM"],"RW",24,"Bulgaria"],["E. Gnahoré",67,["CM","CAM","CDM"],"SUB",14,"France"],["A. Barberis",66,["CM"],"RES",18,"Italy"],["A. Salzano",66,["CM"],"SUB",20,"Italy"],["P. De Giorgio",63,["LW"],"SUB",10,"Italy"],["G. Zampano",62,["RM","RB"],"RES",93,"Italy"],["M. Festa",62,["GK"],"SUB",5,"Italy"],["V. Cojocaru",60,["GK"],"RES",95,"Romania"],["N. Fazzi",60,["CM","CDM","RW"],"RES",77,"Italy"],["A. Nalini",60,["RW"],"SUB",9,"Italy"],["G. Cuomo",58,["CB"],"RES",21,"Italy"],["M. Nicoletti",57,["LB"],"RES",16,"Italy"],["T. Dozi",56,["RB","CB"],"RES",34,"France"],["L. Bruno",54,["LB"],"RES",30,"Italy"],["C. Barillari",52,["CM"],"RES",32,"Italy"]],"reserves":[["A. Stoian",70,["LW","ST","RW"],"SUB",2,"Romania"],["M. Trotta",69,["ST"],"SUB",29,"Italy"],["Simy",69,["ST"],"SUB",99,"Nigeria"]]},
    "Empoli":{"formation":"4-3-1-2","slots":["CAM","GK","LS","RCB","RS","LCM","CM","RCM","RB","LB","LCB"],"players":[["R. Saponara",80,["CAM"],"CAM",10,"Italy"],["L. Skorupski",76,["GK"],"GK",28,"Poland"],["M. Maccarone",76,["ST"],"LS",7,"Italy"],["A. Costa",76,["CB","LB"],"RCB",15,"Italy"],["M. Pucciarelli",75,["ST","CF"],"RS",20,"Italy"],["A. Gilardino",75,["ST"],"SUB",18,"Italy"],["D. Croce",75,["CM"],"LCM",11,"Italy"],["J. Mauri",73,["CM","CDM"],"CM",5,"Italy"],["M. Büchel",73,["CM"],"RCM",77,"Liechtenstein"],["V. Laurini",73,["RB"],"RB",2,"France"],["M. Pasqual",73,["LM","LB"],"LB",21,"Italy"],["F. Barba",72,["CB"],"LCB",19,"Italy"],["U. Ćosić",72,["CB"],"SUB",24,"Serbia"],["L. Mchedlidze",72,["ST"],"SUB",9,"Georgia"],["G. Marilungo",72,["ST"],"SUB",89,"Italy"],["Matheus Pereira",70,["CAM"],"SUB",31,"Brazil"],["G. Bellusci",70,["CB"],"SUB",6,"Italy"],["M. Zambelli",70,["RB","CB"],"SUB",3,"Italy"],["A. Tello",68,["CM","RB"],"RES",88,"Colombia"],["R. Krunic",68,["CAM"],"SUB",33,"Bosnia Herzegovina"],["A. Pelagotti",68,["GK"],"SUB",23,"Italy"],["A. Dioussé",67,["CDM","CM"],"SUB",8,"Senegal"],["R. Maiello",67,["CM","CAM"],"SUB",17,"Italy"],["F. Dimarco",63,["LB","LM"],"SUB",4,"Italy"],["M. Pugliesi",63,["GK"],"RES",1,"Italy"],["F. Veseli",61,["RB","CB","LB"],"RES",13,"Albania"]],"reserves":[["M. Zambelli",70,["RB","CB"],"SUB",3,"Italy"],["G. Bellusci",70,["CB"],"SUB",6,"Italy"],["Matheus Pereira",70,["CAM"],"SUB",31,"Brazil"]]},
    "Fiorentina":{"formation":"3-4-2-1","slots":["CB","LF","LCB","ST","RF","LCM","RM","RCM","GK","RCB","LM"],"players":[["G. Rodríguez",83,["CB"],"CB",2,"Argentina"],["Borja Valero",83,["CAM","CM","CF"],"LF",20,"Spain"],["D. Astori",81,["CB"],"LCB",13,"Italy"],["N. Kalinić",80,["ST"],"ST",9,"Croatia"],["J. Iličić",80,["CF","CAM"],"RF",72,"Slovenia"],["M. Badelj",79,["CDM","CM"],"LCM",5,"Croatia"],["S. Cristóforo",78,["CDM"],"SUB",19,"Uruguay"],["F. Bernardeschi",78,["RM","LM"],"RM",10,"Italy"],["Cristian Tello",78,["RW","RM"],"SUB",16,"Spain"],["M. Vecino",77,["CM","CDM"],"RCM",8,"Uruguay"],["M. Zárate",77,["ST","CF"],"SUB",7,"Argentina"],["S. De Maio",77,["CB"],"SUB",4,"France"],["C. Tătăruşanu",77,["GK"],"GK",12,"Romania"],["K. Babacar",76,["ST"],"SUB",30,"Senegal"],["C. Sánchez",76,["CDM","CM"],"SUB",6,"Colombia"],["N. Tomović",76,["CB","RB"],"RCB",40,"Serbia"],["C. Salcedo",73,["CB"],"RES",18,"Mexico"],["H. Toledo",73,["LM"],"SUB",11,"Argentina"],["B. Drągowski",71,["GK"],"SUB",97,"Poland"],["K. Diks",71,["RB"],"SUB",17,"Netherlands"],["H. Milić",71,["LB","LM"],"LM",31,"Croatia"],["M. Olivera",70,["LB","LM"],"SUB",15,"Uruguay"],["L. Lezzerini",66,["GK"],"RES",1,"Italy"],["I. Hagi",63,["RW","CAM","ST"],"SUB",24,"Romania"],["F. Chiesa",58,["RW","CF"],"SUB",25,"Italy"],["A. Diakhate",56,["CM"],"RES",98,"Senegal"],["G. Satalino",50,["GK"],"RES",23,"Italy"]],"reserves":[["C. Sánchez",76,["CDM","CM"],"SUB",6,"Colombia"],["K. Babacar",76,["ST"],"SUB",30,"Senegal"],["H. Toledo",73,["LM"],"SUB",11,"Argentina"]]},
    "Genoa":{"formation":"3-4-3 Flat","slots":["LCM","RCB","CB","ST","RCM","LW","LCB","LM","RM","GK","RW"],"players":[["M. Perin",83,["GK"],"SUB",1,"Italy"],["Miguel Veloso",79,["CDM","CM"],"LCM",44,"Portugal"],["S. Gentiletti",78,["CB"],"RCB",3,"Argentina"],["N. Burdisso",77,["CB"],"CB",8,"Argentina"],["L. Pavoletti",77,["ST"],"ST",19,"Italy"],["T. Rincón",76,["CM","CDM","RM"],"RCM",88,"Venezuela"],["L. Ocampos",75,["RM","LM","RW"],"LW",11,"Argentina"],["A. Izzo",75,["CB"],"LCB",5,"Italy"],["Edenílson",75,["RM","LM"],"RES",2,"Brazil"],["D. Laxalt",74,["LM"],"LM",93,"Uruguay"],["L. Orbán",74,["LB","CB"],"SUB",21,"Argentina"],["D. Lazović",74,["RW","LW"],"RM",22,"Serbia"],["G. Pandev",74,["ST","CAM"],"SUB",27,"North Macedonia"],["L. Rigoni",74,["CM","CDM"],"SUB",30,"Italy"],["S. Gakpé",74,["RM","ST"],"SUB",13,"Togo"],["E. Muñoz",73,["CB"],"SUB",24,"Argentina"],["D. Brivio",73,["LB"],"SUB",28,"Italy"],["I. Cissokho",73,["RB"],"SUB",20,"Senegal"],["I. Cofie",72,["CM","CDM"],"SUB",4,"Ghana"],["E. Lamanna",72,["GK"],"GK",23,"Italy"],["N. Ninković",70,["CAM","LW","ST"],"RES",99,"Serbia"],["G. Simeone",69,["ST","RM"],"SUB",9,"Argentina"],["D. Biraschi",68,["CB","RB"],"RES",14,"Italy"],["R. Fiamozzi",66,["RB","RM"],"SUB",29,"Italy"],["O. Ntcham",65,["CM"],"RW",18,"France"],["L. Zima",64,["GK"],"RES",38,"Czech Republic"],["L. Zanimacchia",57,["RW"],"SUB",26,"Italy"],["M. Ierardi",56,["RB"],"RES",41,"Italy"],["D. Faccioli",52,["GK"],"RES",58,"Italy"]],"reserves":[["S. Gakpé",74,["RM","ST"],"SUB",13,"Togo"],["L. Rigoni",74,["CM","CDM"],"SUB",30,"Italy"],["I. Cissokho",73,["RB"],"SUB",20,"Senegal"]]},
    "Inter Milan":{"formation":"4-2-3-1","slots":["GK","LCB","CAM","RDM","LAM","LDM","ST","RAM","RCB","LB","RB"],"players":[["S. Handanovič",87,["GK"],"GK",1,"Slovenia"],["Miranda",86,["CB"],"LCB",25,"Brazil"],["E. Banega",84,["CAM"],"CAM",19,"Argentina"],["João Mário",83,["RM","CM"],"RDM",6,"Portugal"],["I. Perišić",83,["LM","RM","CAM"],"LAM",44,"Croatia"],["G. Medel",83,["CDM","CM"],"LDM",17,"Chile"],["M. Icardi",82,["ST"],"ST",9,"Argentina"],["S. Jovetić",81,["ST","CAM"],"SUB",10,"Montenegro"],["A. Candreva",81,["RW","CAM"],"RAM",87,"Italy"],["J. Murillo",80,["CB"],"RCB",24,"Colombia"],["C. Ansaldi",80,["LB","RM"],"LB",15,"Argentina"],["Eder",80,["ST","LW"],"SUB",23,"Italy"],["M. Brozović",79,["CM","CAM"],"RES",77,"Croatia"],["Felipe Melo",79,["CDM","CM"],"SUB",83,"Brazil"],["R. Palacio",79,["ST"],"SUB",8,"Argentina"],["Gabriel",78,["ST","RW"],"SUB",96,"Brazil"],["M. Andreolli",78,["CB"],"SUB",2,"Italy"],["G. Kondogbia",76,["CM","CDM"],"SUB",7,"France"],["D. Santon",76,["RB","LB"],"RES",21,"Italy"],["A. Ranocchia",76,["CB"],"SUB",13,"Italy"],["J. Biabiany",76,["RW","LW","RM"],"SUB",11,"France"],["J. Carrizo",75,["GK"],"SUB",30,"Argentina"],["Y. Nagatomo",75,["LB","RB"],"SUB",55,"Japan"],["D. D'Ambrosio",75,["RB"],"RB",33,"Italy"],["A. Gnoukouri",70,["CM"],"SUB",27,"Ivory Coast"],["E. Yao Guy",69,["CB"],"RES",94,"Ivory Coast"],["T. Berni",64,["GK"],"RES",46,"Italy"],["L. Zonta",63,["CM"],"RES",91,"Italy"],["A. Pinamonti",62,["ST"],"RES",99,"Italy"],["S. Miangue",62,["LB"],"RES",95,"Belgium"],["M. Di Gregorio",61,["GK"],"RES",92,"Italy"],["I. Radu",59,["GK"],"RES",98,"Romania"],["A. Bakayoko",58,["RW"],"RES",93,"France"]],"reserves":[["R. Palacio",79,["ST"],"SUB",8,"Argentina"],["M. Andreolli",78,["CB"],"SUB",2,"Italy"],["Gabriel",78,["ST","RW"],"SUB",96,"Brazil"]]},
    "Juventus":{"formation":"3-1-4-2","slots":["GK","LCB","LS","CB","RCB","RS","CDM","RM","LM","RCM","LCM"],"players":[["G. Buffon",88,["GK"],"GK",1,"Italy"],["G. Chiellini",88,["CB"],"LCB",3,"Italy"],["G. Higuaín",88,["ST"],"LS",9,"Argentina"],["L. Bonucci",87,["CB"],"CB",19,"Italy"],["A. Barzagli",86,["CB"],"RCB",15,"Italy"],["C. Marchisio",86,["CM","CDM"],"SUB",8,"Italy"],["P. Dybala",85,["ST","CF"],"RS",21,"Argentina"],["M. Pjanić",85,["CM"],"CDM",5,"Bosnia Herzegovina"],["Dani Alves",85,["RB"],"RM",23,"Brazil"],["Alex Sandro",84,["LB","LM"],"LM",12,"Brazil"],["S. Lichtsteiner",83,["RB","RM"],"SUB",26,"Switzerland"],["M. Benatia",83,["CB"],"SUB",4,"Morocco"],["S. Khedira",83,["CM","CDM"],"RCM",6,"Germany"],["M. Mandžukić",83,["ST"],"SUB",17,"Croatia"],["P. Evra",82,["LB","LM"],"SUB",33,"France"],["J. Cuadrado",82,["RM"],"SUB",7,"Colombia"],["K. Asamoah",80,["CM","LM"],"LCM",22,"Ghana"],["Hernanes",80,["CM","CAM","CDM"],"SUB",11,"Brazil"],["Neto",80,["GK"],"SUB",25,"Brazil"],["D. Rugani",79,["CB"],"SUB",24,"Italy"],["M. Lemina",77,["CM","CDM"],"SUB",18,"Gabon"],["S. Sturaro",77,["CM","CDM"],"SUB",27,"Italy"],["M. Pjaca",76,["LW"],"RES",20,"Croatia"],["F. Mattiello",72,["LB","RB"],"RES",42,"Italy"],["P. De Ceglie",72,["LB","LM"],"RES",40,"Italy"],["R. Mandragora",69,["CM","CB"],"RES",41,"Italy"],["E. Audero",67,["GK"],"SUB",38,"Italy"]],"reserves":[["J. Cuadrado",82,["RM"],"SUB",7,"Colombia"],["P. Evra",82,["LB","LM"],"SUB",33,"France"],["Hernanes",80,["CM","CAM","CDM"],"SUB",11,"Brazil"]]},
    "Lazio":{"formation":"4-3-3 (2)","slots":["LCB","GK","CDM","RCM","ST","RB","RW","LB","LCM","RCB","LW"],"players":[["S. de Vrij",82,["CB"],"LCB",3,"Netherlands"],["F. Marchetti",82,["GK"],"GK",22,"Italy"],["L. Biglia",82,["CDM","CM"],"CDM",20,"Argentina"],["M. Parolo",81,["CM"],"RCM",16,"Italy"],["C. Immobile",80,["ST"],"ST",17,"Italy"],["D. Basta",80,["RB","RM"],"RB",8,"Serbia"],["Felipe Anderson",79,["LW","RW","CAM"],"RW",10,"Brazil"],["S. Radu",79,["LB","CB"],"LB",26,"Romania"],["K. Baldé Diao",78,["LW","RW","ST"],"SUB",14,"Senegal"],["S. Lulić",78,["LB","CM","LM"],"LCM",19,"Bosnia Herzegovina"],["Luis Alberto",77,["CAM","ST","LM"],"RES",18,"Spain"],["R. Morrison",77,["CAM","CM"],"SUB",11,"England"],["F. Đorđević",77,["ST"],"SUB",9,"Serbia"],["S. Milinković-Savić",76,["CM","CAM","CDM"],"SUB",21,"Serbia"],["Bastos",76,["CB","CDM"],"RCB",15,"Angola"],["W. Hoedt",76,["CB"],"SUB",2,"Netherlands"],["D. Cataldi",75,["CM","CDM"],"SUB",32,"Italy"],["Wallace",75,["CB"],"SUB",13,"Brazil"],["R. Kishna",75,["LW","RW","CAM"],"SUB",7,"Netherlands"],["M. Leitner",74,["CM","CAM","RM"],"SUB",23,"Germany"],["A. González",74,["CM","CDM","RM"],"RES",46,"Uruguay"],["J. Lukaku",73,["LB"],"LW",6,"Belgium"],["Patric",69,["RB","CM"],"SUB",4,"Spain"],["I. Vargić",69,["GK"],"SUB",55,"Croatia"],["J. Minala",68,["CM","CAM","CDM"],"SUB",27,"Cameroon"],["Vinícius",67,["LB","LM","LW"],"RES",28,"Brazil"],["M. Tounkara",65,["ST"],"RES",71,"Spain"],["T. Strakosha",64,["GK"],"RES",1,"Albania"],["F. Prce",63,["CB","LB"],"RES",44,"Croatia"],["A. Murgia",62,["CM","CDM"],"RES",96,"Italy"],["C. Lombardi",61,["CF","RW","LW"],"RES",25,"Italy"]],"reserves":[["W. Hoedt",76,["CB"],"SUB",2,"Netherlands"],["S. Milinković-Savić",76,["CM","CAM","CDM"],"SUB",21,"Serbia"],["R. Kishna",75,["LW","RW","CAM"],"SUB",7,"Netherlands"]]},
    "Milan":{"formation":"4-3-3 (2)","slots":["ST","LCM","RCM","LCB","LW","CDM","RCB","RB","LB","RW","GK"],"players":[["C. Bacca",84,["ST"],"ST",70,"Colombia"],["G. Bonaventura",82,["LM","CM"],"LCM",5,"Italy"],["K. Honda",81,["RM","CAM"],"SUB",10,"Japan"],["J. Sosa",80,["CAM","RM"],"RCM",23,"Argentina"],["M. Fernández",79,["CAM","CM","CF"],"SUB",14,"Chile"],["Luiz Adriano",79,["ST"],"SUB",87,"Brazil"],["A. Romagnoli",78,["CB"],"LCB",13,"Italy"],["M. Niang",78,["ST","LW"],"LW",11,"France"],["R. Montolivo",78,["CDM","CM"],"CDM",18,"Italy"],["G. Paletta",78,["CB"],"RCB",29,"Italy"],["I. Abate",78,["RB"],"RB",20,"Italy"],["L. Antonelli",78,["LB","LM"],"LB",31,"Italy"],["C. Zapata",78,["CB"],"RES",17,"Colombia"],["J. Kucka",78,["CM","CDM"],"SUB",33,"Slovakia"],["Suso",77,["RM","LM"],"RW",8,"Spain"],["A. Bertolacci",77,["CM","CDM"],"SUB",91,"Italy"],["L. Vangioni",77,["LB"],"SUB",21,"Argentina"],["G. Donnarumma",76,["GK"],"GK",99,"Italy"],["G. Gómez",76,["CB"],"SUB",15,"Paraguay"],["M. De Sciglio",76,["LB","RB"],"SUB",2,"Italy"],["A. Poli",76,["CM"],"RES",16,"Italy"],["Gabriel",74,["GK"],"SUB",22,"Brazil"],["G. Lapadula",74,["ST"],"SUB",9,"Italy"],["M. Pašalić",73,["CDM","CM"],"RES",80,"Croatia"],["Rodrigo Ely",71,["CB"],"SUB",93,"Brazil"],["D. Calabria",70,["RB"],"SUB",96,"Italy"],["M. Locatelli",67,["CM"],"RES",73,"Italy"]],"reserves":[["J. Kucka",78,["CM","CDM"],"SUB",33,"Slovakia"],["L. Vangioni",77,["LB"],"SUB",21,"Argentina"],["A. Bertolacci",77,["CM","CDM"],"SUB",91,"Italy"]]},
    "Napoli":{"formation":"4-3-3","slots":["LCM","GK","LW","LCB","RCB","CM","RCM","RW","ST","RB","LB"],"players":[["M. Hamšik",85,["CM"],"LCM",17,"Slovakia"],["José Reina",84,["GK"],"GK",25,"Spain"],["L. Insigne",83,["LW","CAM"],"LW",24,"Italy"],["D. Mertens",83,["LW"],"SUB",14,"Belgium"],["K. Koulibaly",82,["CB"],"LCB",26,"Senegal"],["Raúl Albiol",82,["CB"],"RCB",33,"Spain"],["N. Maksimović",81,["CB"],"SUB",19,"Serbia"],["M. Gabbiadini",81,["ST","CAM"],"SUB",23,"Italy"],["Jorginho",81,["CM"],"CM",8,"Italy"],["Allan",81,["CM"],"RCM",5,"Brazil"],["José Callejón",81,["RW"],"RW",7,"Spain"],["A. Milik",79,["ST"],"ST",99,"Poland"],["E. Hysaj",79,["RB","LB"],"RB",2,"Albania"],["F. Ghoulam",79,["LB"],"LB",31,"Algeria"],["L. Tonelli",79,["CB"],"SUB",62,"Italy"],["O. El Kaddouri",78,["CM","CAM"],"SUB",77,"Morocco"],["E. Giaccherini",78,["LW","CM"],"SUB",4,"Italy"],["V. Chiricheş",77,["CB","RB"],"SUB",21,"Romania"],["P. Zieliński",76,["CM","CAM"],"SUB",20,"Poland"],["M. Rog",75,["CAM","CM"],"SUB",30,"Croatia"],["C. Maggio",75,["RB"],"SUB",11,"Italy"],["A. Diawara",74,["CDM","CM"],"SUB",42,"Guinea"],["L. Sepe",74,["GK"],"RES",22,"Italy"],["Rafael",74,["GK"],"SUB",1,"Brazil"],["I. Strinić",74,["LB"],"RES",3,"Croatia"],["R. Insigne",69,["CAM"],"RES",94,"Italy"],["I. Lasicki",56,["RB"],"RES",95,"Poland"]],"reserves":[["E. Giaccherini",78,["LW","CM"],"SUB",4,"Italy"],["O. El Kaddouri",78,["CM","CAM"],"SUB",77,"Morocco"],["V. Chiricheş",77,["CB","RB"],"SUB",21,"Romania"]]},
    "Palermo":{"formation":"4-3-3","slots":["LCB","LCM","CM","RW","LW","RCM","RCB","LB","RB","ST","GK"],"players":[["G. González",77,["CB"],"SUB",12,"Costa Rica"],["S. Rajković",75,["CB"],"LCB",5,"Serbia"],["Bruno Henrique",75,["CDM","CM"],"LCM",25,"Brazil"],["A. Gazzi",75,["CDM"],"CM",14,"Italy"],["A. Diamanti",75,["CF","RW"],"RW",23,"Italy"],["S. Anđelković",75,["CB"],"SUB",4,"Slovenia"],["R. Quaison",74,["CAM","CF"],"LW",21,"Sweden"],["O. Hiljemark",73,["CM","CDM"],"RCM",10,"Sweden"],["R. Vitiello",73,["CB","RB"],"SUB",2,"Italy"],["M. Jajalo",73,["CM","CDM","CAM"],"RES",28,"Croatia"],["E. Goldaniga",72,["CB"],"RCB",6,"Italy"],["O. Bouy",72,["CM","CB"],"SUB",24,"Morocco"],["H. Aleesami",72,["LB","LM"],"LB",19,"Norway"],["I. Chochev",71,["CM"],"SUB",18,"Bulgaria"],["Thiago Cionek",71,["CB"],"SUB",15,"Poland"],["C. Embalo",70,["LM","CAM"],"SUB",11,"Guinea Bissau"],["A. Rispoli",70,["RM","RB"],"RB",3,"Italy"],["A. Trajkovski",69,["ST","CF"],"SUB",8,"North Macedonia"],["M. Morganella",68,["RM","RB"],"SUB",89,"Switzerland"],["I. Nestorovski",67,["ST","LW"],"ST",30,"North Macedonia"],["R. Sallai",64,["CAM"],"RES",20,"Hungary"],["N. Balogh",63,["ST"],"RES",22,"Hungary"],["G. Pezzella",61,["LB","LM"],"SUB",97,"Italy"],["J. Posavec",61,["GK"],"GK",1,"Croatia"],["A. Bentivegna",58,["RM","ST"],"SUB",27,"Italy"],["A. Fulignati",58,["GK"],"SUB",68,"Italy"],["L. Marson",53,["GK"],"RES",55,"Italy"]],"reserves":[["O. Bouy",72,["CM","CB"],"SUB",24,"Morocco"],["Thiago Cionek",71,["CB"],"SUB",15,"Poland"],["I. Chochev",71,["CM"],"SUB",18,"Bulgaria"]]},
    "Pescara":{"formation":"4-3-2-1","slots":["GK","LF","LB","RF","RCB","LCM","RCM","LCB","RB","CM","ST"],"players":[["A. Aquilani",78,["CM"],"SUB",20,"Italy"],["S. Pepe",77,["RM","LM"],"SUB",21,"Italy"],["A. Bizzarri",76,["GK"],"GK",31,"Argentina"],["G. Caprari",73,["CF","ST","CAM"],"LF",17,"Italy"],["C. Biraghi",73,["LB","LM"],"LB",3,"Italy"],["B. Cristante",72,["CM","CDM"],"SUB",6,"Italy"],["A. Benali",72,["CAM","CM","CF"],"RF",10,"Libya"],["N. Gyömbér",72,["CB"],"SUB",37,"Slovakia"],["J. Bahebeck",72,["ST","LW","LM"],"SUB",15,"France"],["H. Campagnaro",72,["CB","RB"],"RCB",14,"Argentina"],["L. Memushaj",72,["CM"],"LCM",8,"Albania"],["V. Verre",70,["CM"],"RCM",7,"Italy"],["D. Župarić",70,["CB"],"LCB",13,"Croatia"],["A. Coda",70,["CB"],"SUB",35,"Italy"],["V. Fiorillo",70,["GK"],"SUB",1,"Italy"],["F. Zampano",69,["RB","LB"],"RB",11,"Italy"],["G. Brugman",68,["CM","CAM","CDM"],"CM",16,"Uruguay"],["R. Manaj",67,["ST"],"ST",9,"Albania"],["R. Murić",67,["RW"],"RES",41,"Croatia"],["M. Fornasier",67,["CB"],"SUB",44,"Italy"],["A. Crescenzi",67,["LB","LM"],"SUB",2,"Italy"],["A. Mitriţă",67,["CF"],"SUB",28,"Romania"],["M. Pigliacelli",66,["GK"],"RES",22,"Italy"],["A. Bruno",66,["CM","CDM"],"RES",5,"Italy"],["G. Aldegani",62,["GK"],"RES",12,"Italy"],["S. Pettinari",61,["ST"],"SUB",18,"Italy"],["M. Acatullo",58,["RW","ST"],"RES",60,"Italy"],["D. Vitturini",58,["RB","CB"],"SUB",26,"Italy"],["H. Miličević",58,["CDM","CM"],"RES",53,"Croatia"],["A. Müller",57,["CF"],"RES",30,"Uruguay"],["F. Del Sole",56,["CM","CAM","RW"],"RES",98,"Italy"],["A. Mancini",56,["LW","RW","CF"],"RES",54,"Italy"],["S. Monni",55,["ST"],"RES",56,"Italy"]],"reserves":[["J. Bahebeck",72,["ST","LW","LM"],"SUB",15,"France"],["V. Fiorillo",70,["GK"],"SUB",1,"Italy"],["A. Coda",70,["CB"],"SUB",35,"Italy"]]},
    "Roma":{"formation":"4-3-3 (2)","slots":["RCB","RCM","CDM","RB","LW","RW","LCM","LCB","ST","GK","LB"],"players":[["K. Manolas",84,["CB"],"RCB",44,"Greece"],["R. Nainggolan",84,["CM"],"RCM",4,"Belgium"],["D. De Rossi",83,["CDM"],"CDM",16,"Italy"],["A. Florenzi",82,["RB","RW","CM"],"RB",24,"Italy"],["S. El Shaarawy",81,["LW"],"LW",92,"Italy"],["M. Salah",81,["RW"],"RW",11,"Egypt"],["K. Strootman",81,["CM"],"LCM",6,"Netherlands"],["Bruno Peres",81,["RWB"],"SUB",13,"Brazil"],["T. Vermaelen",81,["CB","LB"],"LCB",15,"Belgium"],["Alisson",80,["GK"],"SUB",19,"Brazil"],["F. Totti",80,["CF","ST"],"SUB",10,"Italy"],["E. Džeko",80,["ST"],"SUB",9,"Bosnia Herzegovina"],["D. Perotti",80,["CF","LW"],"ST",8,"Argentina"],["W. Szczęsny",79,["GK"],"GK",1,"Poland"],["Mário Rui",78,["LB"],"SUB",22,"Portugal"],["J. Iturbe",77,["RW"],"SUB",7,"Paraguay"],["A. Rüdiger",77,["CB"],"SUB",2,"Germany"],["F. Fazio",77,["CB"],"SUB",20,"Argentina"],["L. Paredes",76,["CDM","CM"],"SUB",5,"Argentina"],["Juan Jesus",75,["LB","CB"],"LB",3,"Brazil"],["B. Lobonţ",70,["GK"],"RES",18,"Romania"],["Emerson",69,["LB"],"SUB",33,"Brazil"],["Gerson",67,["RM","CAM"],"SUB",30,"Brazil"],["A. Nura",62,["RB"],"RES",99,"Nigeria"],["M. Seck",61,["LB"],"RES",17,"Senegal"],["S. Anočič",55,["LB"],"SUB",51,"Croatia"]],"reserves":[["Mário Rui",78,["LB"],"SUB",22,"Portugal"],["A. Rüdiger",77,["CB"],"SUB",2,"Germany"],["J. Iturbe",77,["RW"],"SUB",7,"Paraguay"]]},
    "Sampdoria":{"formation":"4-3-1-2","slots":["GK","LS","CAM","RS","LCM","RCM","RCB","RB","LCB","CM","LB"],"players":[["E. Viviano",82,["GK"],"GK",2,"Italy"],["D. Praet",78,["RM","CAM","LM"],"SUB",18,"Belgium"],["A. Cassano",78,["CF"],"SUB",99,"Italy"],["F. Quagliarella",78,["ST"],"LS",27,"Italy"],["L. Cigarini",77,["CM","CDM"],"SUB",21,"Italy"],["R. Álvarez",77,["CAM","CF"],"CAM",11,"Argentina"],["Bruno Fernandes",76,["CM","CAM","CF"],"SUB",10,"Portugal"],["F. Đuričić",76,["CAM","LW"],"SUB",23,"Serbia"],["L. Muriel",76,["ST"],"RS",9,"Colombia"],["C. Carbonero",75,["CM","RM"],"RES",7,"Colombia"],["K. Linetty",74,["CDM","CAM"],"LCM",16,"Poland"],["Dodô",74,["LM","LB"],"SUB",5,"Brazil"],["E. Barreto",74,["CM","CDM"],"RCM",8,"Paraguay"],["M. Silvestre",74,["CB"],"RCB",26,"Italy"],["J. Sala",73,["CM","RB","RM"],"RB",22,"Italy"],["P. Schick",72,["ST"],"SUB",14,"Czech Republic"],["V. Regini",72,["LB","CB"],"LCB",19,"Italy"],["A. Palombo",72,["CM","CDM"],"SUB",17,"Italy"],["L. Torreira",71,["CM"],"CM",34,"Uruguay"],["A. Budimir",71,["ST"],"SUB",47,"Croatia"],["C. Puggioni",71,["GK"],"SUB",1,"Italy"],["L. Krajnc",70,["CB","LB"],"RES",15,"Slovenia"],["D. Pavlovic",69,["LB"],"LB",20,"Switzerland"],["M. Škriniar",68,["CB"],"SUB",37,"Slovakia"],["M. Eramo",68,["CM","CAM"],"RES",6,"Italy"],["Pedro Pereira",67,["RB"],"SUB",13,"Portugal"],["S. Amuzie",62,["LB"],"RES",3,"Nigeria"],["A. Tozzo",61,["GK"],"RES",92,"Italy"],["T. Krapikas",54,["GK"],"RES",12,"Lithuania"]],"reserves":[["F. Đuričić",76,["CAM","LW"],"SUB",23,"Serbia"],["C. Carbonero",75,["CM","RM"],"RES",7,"Colombia"],["Dodô",74,["LM","LB"],"SUB",5,"Brazil"]]},
    "Sassuolo":{"formation":"4-3-3 (2)","slots":["GK","RW","RCB","CDM","RCM","LCB","LCM","LW","ST","LB","RB"],"players":[["A. Consigli",83,["GK"],"GK",47,"Italy"],["D. Berardi",82,["RW"],"RW",25,"Italy"],["F. Acerbi",81,["CB"],"RCB",15,"Italy"],["A. Matri",78,["ST"],"SUB",10,"Italy"],["F. Magnanelli",77,["CDM","CM"],"CDM",4,"Italy"],["A. Duncan",76,["CM"],"RCM",32,"Ghana"],["T. Letschert",76,["CB"],"SUB",55,"Netherlands"],["P. Cannavaro",76,["CB"],"LCB",28,"Italy"],["S. Missiroli",76,["CM"],"LCM",7,"Italy"],["M. Politano",74,["RW"],"LW",16,"Italy"],["G. Defrel",74,["ST","LM","CF"],"ST",92,"France"],["F. Peluso",74,["LB","CB"],"LB",13,"Italy"],["L. Antei",72,["CB"],"SUB",5,"Italy"],["A. Ragusa",72,["LW","ST"],"SUB",90,"Italy"],["G. Pegolo",72,["GK"],"SUB",79,"Italy"],["L. Pellegrini",71,["CM"],"SUB",6,"Italy"],["S. Sensi",71,["CDM","CM"],"SUB",12,"Italy"],["D. Biondini",71,["CM"],"SUB",8,"Italy"],["E. Terranova",71,["CB"],"SUB",26,"Italy"],["M. Gazzola",70,["RB","RM"],"RB",23,"Italy"],["F. Ricci",68,["RW","LW"],"SUB",27,"Italy"],["L. Mazzitelli",67,["CDM"],"SUB",22,"Italy"],["P. Iemmello",67,["ST"],"SUB",9,"Italy"],["A. Pomini",66,["GK"],"RES",1,"Italy"],["Pol Lirola",64,["RB"],"RES",20,"Spain"],["C. Adjapong",61,["RB","RM"],"RES",98,"Ghana"],["C. Dell'Orco",61,["LB"],"RES",39,"Italy"]],"reserves":[["G. Pegolo",72,["GK"],"SUB",79,"Italy"],["L. Pellegrini",71,["CM"],"SUB",6,"Italy"],["D. Biondini",71,["CM"],"SUB",8,"Italy"]]},
    "Torino":{"formation":"4-3-3 (2)","slots":["GK","LCB","LCM","LW","RW","ST","RCM","RB","CDM","RCB","LB"],"players":[["J. Hart",84,["GK"],"GK",21,"England"],["Castán",80,["CB"],"LCB",4,"Brazil"],["D. Baselli",79,["CM","CDM"],"LCM",8,"Italy"],["A. Ljajić",78,["LW","CAM"],"LW",10,"Serbia"],["Iago Falqué",78,["RW","LW"],"RW",14,"Spain"],["M. López",78,["ST"],"SUB",11,"Argentina"],["A. Belotti",77,["ST"],"ST",9,"Italy"],["M. Benassi",77,["CM"],"RCM",15,"Italy"],["D. Zappacosta",77,["RWB","RB","RM"],"SUB",7,"Italy"],["E. Moretti",77,["CB"],"SUB",24,"Italy"],["D. Padelli",77,["GK"],"SUB",1,"Italy"],["L. De Silvestri",77,["RB","RM"],"RB",29,"Italy"],["M. Valdifiori",77,["CDM","CM"],"CDM",18,"Italy"],["Danilo Avelar",76,["LB"],"RES",26,"Brazil"],["C. Bovo",76,["CB"],"RCB",5,"Italy"],["C. Molinaro",75,["LWB","LM"],"LB",3,"Italy"],["G. Vives",75,["CDM","CM"],"SUB",20,"Italy"],["L. Rossettini",75,["CB","RB"],"SUB",13,"Italy"],["A. Acquah",74,["CM"],"SUB",6,"Ghana"],["J. Obi",73,["CM","RM"],"SUB",22,"Nigeria"],["J. Martínez",72,["ST"],"SUB",17,"Venezuela"],["L. Boyé",68,["ST"],"SUB",31,"Argentina"],["A. Ajeti",68,["CB"],"RES",93,"Albania"],["S. Gustafson",68,["CAM","CM"],"SUB",16,"Sweden"],["M. Aramu",67,["RW","CM"],"RES",30,"Italy"],["A. Barreca",67,["LB"],"SUB",23,"Italy"]],"reserves":[["Danilo Avelar",76,["LB"],"RES",26,"Brazil"],["L. Rossettini",75,["CB","RB"],"SUB",13,"Italy"],["G. Vives",75,["CDM","CM"],"SUB",20,"Italy"]]},
    "Udinese":{"formation":"4-1-2-1-2 (2)","slots":["GK","LCB","RCM","RS","RCB","LS","RB","LCM","CAM","CDM","LB"],"players":[["O. Karnezis",82,["GK"],"GK",1,"Greece"],["Danilo",79,["CB"],"LCB",5,"Brazil"],["S. Kums",79,["CM","CDM"],"RCM",88,"Belgium"],["D. Zapata",78,["ST"],"RS",9,"Colombia"],["C. Théréau",78,["ST"],"SUB",77,"France"],["T. Heurtaux",78,["CB"],"RCB",75,"France"],["A. Peñaranda",76,["ST","LM"],"LS",11,"Venezuela"],["S. Widmer",76,["RM","RB"],"RB",27,"Switzerland"],["E. Hallfreðsson",76,["CM","CDM"],"LCM",23,"Iceland"],["P. Kone",76,["CAM","CM","CF"],"SUB",33,"Greece"],["R. De Paul",75,["LM","CAM"],"CAM",10,"Argentina"],["Ryder",75,["ST","CF"],"SUB",19,"Brazil"],["E. Badu",75,["CM","CDM"],"CDM",8,"Ghana"],["Felipe",75,["CB"],"SUB",30,"Brazil"],["F. Lodi",75,["CDM","CM"],"SUB",20,"Italy"],["P. Armero",75,["LB","LM"],"LB",7,"Colombia"],["S. Scuffet",74,["GK"],"SUB",22,"Italy"],["M. Wagué",74,["CB"],"SUB",2,"Mali"],["G. Angella",74,["CB"],"SUB",4,"Italy"],["A. Adnan",73,["LM","LB"],"SUB",53,"Iraq"],["Samir",73,["CB"],"SUB",3,"Brazil"],["Lucas Evangelista",72,["CAM"],"RES",95,"Brazil"],["S. Perica",72,["ST"],"SUB",18,"Croatia"],["M. Faraoni",71,["RB","RM"],"SUB",37,"Italy"],["A. Balic",70,["CAM"],"RES",99,"Croatia"],["Ewandro",69,["ST","LM","CAM"],"RES",96,"Brazil"],["S. Fofana",68,["CM","CDM"],"RES",6,"France"],["J. Jankto",68,["LM","CM"],"RES",14,"Czech Republic"],["S. Perisan",60,["GK"],"RES",40,"Italy"]],"reserves":[["F. Lodi",75,["CDM","CM"],"SUB",20,"Italy"],["M. Wagué",74,["CB"],"SUB",2,"Mali"],["G. Angella",74,["CB"],"SUB",4,"Italy"]]},
    "Angers":{"formation":"4-1-4-1","slots":["LCB","RCM","RM","LCM","LM","RCB","GK","CDM","RB","ST","LB"],"players":[["R. Thomas",77,["CB"],"LCB",24,"France"],["C. N'Doye",77,["CM"],"RCM",17,"Senegal"],["B. Ketkeophomphone",76,["ST","RM"],"RM",14,"France"],["T. Mangani",75,["CM"],"LCM",5,"France"],["K. Toko-Ekambi",74,["ST","LM"],"LM",7,"Cameroon"],["I. Traoré",74,["CB"],"RCB",8,"Ivory Coast"],["M. Michel",73,["GK"],"GK",16,"France"],["J. Saihi",73,["CDM","CM"],"CDM",23,"Tunisia"],["P. Capelle",73,["CM","RM","LM"],"SUB",15,"France"],["V. Manceau",72,["RB"],"RB",29,"France"],["D. Petric",72,["GK"],"SUB",1,"Serbia"],["F. Diedhiou",71,["ST"],"ST",9,"Senegal"],["G. Sunu",71,["RW","RM","ST"],"SUB",10,"France"],["Y. Andreu",71,["LB","RB"],"LB",3,"France"],["B. Santamaria",70,["CM","CDM","RM","RW"],"SUB",18,"France"],["A. Letellier",70,["GK"],"RES",30,"France"],["F. Tait",68,["CAM"],"SUB",20,"France"],["D. Nwakaeme",68,["ST"],"SUB",11,"Nigeria"],["N. Pépé",67,["RW","LW","ST"],"SUB",19,"Ivory Coast"],["M. Pavlović",67,["CB"],"SUB",4,"Croatia"],["M. Jean Tahrat",67,["CDM","CB"],"SUB",26,"Algeria"],["P. Martinez",67,["LB"],"SUB",21,"France"],["G. Bourillon",67,["CDM","CB"],"SUB",6,"France"],["F. Doré",65,["ST"],"SUB",27,"Congo"],["M. Serin",63,["LM","RM"],"RES",31,"France"],["Y. Wissa",62,["ST","RW"],"RES",12,"France"],["I. Diallo",62,["LB"],"RES",34,"Guinea"],["A. Mandrea",60,["GK"],"RES",40,"France"],["A. Laïdouni",60,["RB"],"RES",25,"France"],["G. Mutombo",58,["CB"],"RES",35,"France"],["O. Mamoun",57,["CDM","CB"],"RES",36,"France"]],"reserves":[["A. Letellier",70,["GK"],"RES",30,"France"],["D. Nwakaeme",68,["ST"],"SUB",11,"Nigeria"],["F. Tait",68,["CAM"],"SUB",20,"France"]]},
    "Bastia":{"formation":"4-1-4-1","slots":["GK","LCB","RM","RCB","CDM","LB","RCM","ST","RB","LM","LCM"],"players":[["J. Leca",77,["GK"],"GK",16,"France"],["S. Squillaci",75,["CB"],"LCB",5,"France"],["T. Bifouma",74,["ST","LM"],"RM",13,"Congo"],["A. El Kaoutari",74,["CB"],"SUB",4,"Morocco"],["M. Peybernès",73,["CB","RB"],"RCB",17,"France"],["S. Diallo",73,["ST","CAM","CM"],"SUB",2,"Guinea"],["Y. Cahuzac",73,["CDM","CM"],"CDM",18,"France"],["P. Bengtsson",73,["LB"],"LB",20,"Sweden"],["M. Mostefa",73,["CDM","CM"],"RCM",14,"Algeria"],["L. Nangis",72,["LM","RM"],"SUB",11,"France"],["E. Crivelli",72,["ST"],"ST",27,"France"],["G. Cioni",72,["RB"],"RB",29,"France"],["A. Ngando",70,["CAM","CM"],"SUB",19,"France"],["A. Djiku",70,["RB","CB"],"SUB",23,"France"],["J. Cabral",70,["RW","LW"],"SUB",7,"Cape Verde"],["F. Raspentino",70,["ST","RM"],"SUB",9,"Algeria"],["F. Marange",70,["LB","CB"],"SUB",28,"France"],["G. Danic",69,["CAM","LM"],"SUB",8,"France"],["F. Boulaya",68,["CAM","CM"],"SUB",22,"Algeria"],["A. Saint-Maximin",67,["ST","LM"],"LM",6,"France"],["L. Houri",66,["CM","CAM"],"SUB",24,"France"],["L. Coulibaly",65,["CM","CDM"],"LCM",25,"Mali"],["P. Charruau",65,["GK"],"SUB",30,"France"],["G. Acheampong",63,["ST"],"RES",21,"Ghana"],["T. Vincensini",61,["GK"],"RES",1,"France"],["A. Keita",61,["CM"],"RES",12,"Mali"],["L. Kikabidze",59,["RW"],"RES",36,"Georgia"],["R. Sido",57,["LM"],"RES",35,"Burkina Faso"],["I. Diallo",57,["LB"],"RES",37,"Ivory Coast"],["A. Edgar",55,["CM"],"RES",34,"France"],["J. Benhaim",54,["CDM"],"RES",3,"France"]],"reserves":[["J. Cabral",70,["RW","LW"],"SUB",7,"Cape Verde"],["F. Raspentino",70,["ST","RM"],"SUB",9,"Algeria"],["A. Djiku",70,["RB","CB"],"SUB",23,"France"]]},
    "Bordeaux":{"formation":"4-2-2-2","slots":["LDM","GK","LS","RS","LCB","RDM","LAM","RB","RAM","RCB","LB"],"players":[["J. Toulalan",83,["CDM"],"LDM",14,"France"],["C. Carrasso",81,["GK"],"GK",16,"France"],["J. Ménez",79,["ST","LW","CF"],"LS",7,"France"],["D. Rolán",78,["ST","RM"],"RS",9,"Uruguay"],["N. Pallois",77,["CB"],"LCB",5,"France"],["J. Plašil",76,["CM","CDM"],"RDM",18,"Czech Republic"],["T. Touré",75,["CAM"],"LAM",10,"Ivory Coast"],["Y. Sabaly",75,["RB"],"RB",20,"France"],["N. Maurice-Belay",75,["LM","ST"],"SUB",19,"France"],["Malcom",74,["CAM","ST"],"RAM",25,"Brazil"],["D. Contento",74,["LB"],"SUB",3,"Germany"],["G. Sertic",74,["CB"],"RCB",27,"France"],["M. Poundjé",73,["LB"],"LB",29,"France"],["F. Kamano",72,["RM","ST"],"SUB",11,"Guinea"],["F. Guilbert",72,["CB","RB"],"SUB",26,"France"],["J. Prior",71,["GK"],"SUB",30,"France"],["A. Traoré",71,["RM"],"SUB",15,"Mali"],["A. Ounas",70,["LM"],"SUB",17,"France"],["V. Vada",70,["CM","CAM"],"SUB",23,"Argentina"],["M. Gajić",70,["RB","RM"],"SUB",2,"Serbia"],["Pablo",70,["CB"],"RES",4,"Brazil"],["I. Lewczuk",70,["CB","RB"],"SUB",6,"Poland"],["P. Bernardoni",68,["GK"],"RES",1,"France"],["I. Kiese Thelin",68,["ST"],"SUB",12,"Sweden"],["T. Pellenard",67,["LB"],"RES",21,"France"],["G. Laborde",66,["ST"],"SUB",24,"France"],["R. Maulun",64,["CAM","CM"],"RES",31,"France"],["Y. Kaabouni",63,["CM","RM"],"RES",13,"France"],["M. Arambarri",63,["CDM","CM"],"RES",8,"Uruguay"],["D. Sambissa",59,["LB","LM"],"RES",37,"France"]],"reserves":[["A. Traoré",71,["RM"],"SUB",15,"Mali"],["J. Prior",71,["GK"],"SUB",30,"France"],["M. Gajić",70,["RB","RM"],"SUB",2,"Serbia"]]},
    "Caen":{"formation":"4-3-3 (2)","slots":["LCB","GK","LCM","CDM","RCM","LW","LB","RCB","ST","RB","RW"],"players":[["D. Da Silva",77,["CB"],"LCB",28,"France"],["R. Vercoutre",77,["GK"],"GK",1,"France"],["J. Féret",76,["CM","CAM"],"LCM",25,"France"],["N. Seube",74,["CDM","CM"],"CDM",2,"France"],["R. Genevois",74,["CB","RB"],"SUB",29,"Haiti"],["V. Bessat",74,["LM","LB"],"SUB",11,"France"],["J. Delaplace",74,["CM"],"RCM",6,"France"],["I. Diomandé",73,["CDM","CM"],"SUB",4,"Ivory Coast"],["R. Rodelin",73,["RM","ST","RW"],"LW",12,"France"],["E. Imorou",73,["LB"],"LB",15,"Benin"],["S. Ben Youssef",72,["CB"],"RCB",13,"Tunisia"],["I. Santini",72,["ST","CF"],"ST",26,"Croatia"],["M. Dabo",72,["LB","RB"],"RB",23,"France"],["J. Louis",71,["CAM","LW"],"SUB",14,"Haiti"],["P. Sané",71,["ST"],"SUB",22,"Senegal"],["H. Bazile",71,["LM","LW"],"SUB",20,"France"],["J. Adéoti",71,["CDM","CB"],"SUB",18,"Benin"],["S. Malbranque",71,["CAM","CM"],"SUB",10,"France"],["A. Yahia",71,["CB"],"SUB",5,"Tunisia"],["P. Reulet",69,["GK"],"RES",30,"France"],["C. Alhadhur",68,["LB","RB"],"SUB",21,"Comoros"],["Y. Karamoh",67,["ST","RW","LW"],"RW",7,"France"],["M. Nkololo",67,["CAM","RW"],"RES",8,"DR Congo"],["M. Dreyer",67,["GK"],"SUB",40,"France"],["J. Leborgne",65,["CM","CAM","RW","LW"],"SUB",19,"France"],["J. Makengo",61,["CM","CAM"],"RES",17,"France"],["L. Deschateaux",57,["GK"],"RES",16,"France"],["V. Voisin",57,["CDM","CM"],"RES",27,"France"]],"reserves":[["A. Yahia",71,["CB"],"SUB",5,"Tunisia"],["S. Malbranque",71,["CAM","CM"],"SUB",10,"France"],["J. Adéoti",71,["CDM","CB"],"SUB",18,"Benin"]]},
    "Dijon":{"formation":"4-4-2","slots":["RCM","GK","LM","RB","LCM","LS","RCB","LB","RM","LCB","RS"],"players":[["F. Balmont",75,["CM"],"RCM",15,"France"],["M. Martin",74,["CAM","CM"],"SUB",13,"France"],["B. Reynet",73,["GK"],"GK",30,"France"],["F. Sammaritano",73,["LM","CAM"],"LM",18,"France"],["F. Chafik",72,["RB"],"RB",26,"Morocco"],["M. Abeid",71,["CM","CDM","CAM"],"LCM",17,"Algeria"],["A. Bouka Moutou",71,["LB"],"RES",25,"Congo"],["B. Leroy",71,["GK"],"SUB",1,"France"],["J. Lotiès",71,["CB"],"SUB",4,"France"],["P. Lees-Melou",70,["CAM","RM"],"SUB",8,"France"],["L. Diony",70,["ST"],"SUB",9,"France"],["J. Tavares",70,["ST"],"LS",11,"Cape Verde"],["C. Varrault",70,["CB"],"RCB",27,"France"],["V. Rüfli",70,["LB","RB"],"LB",23,"Switzerland"],["R. Amalfitano",70,["RM","LM","CAM"],"RM",20,"France"],["Y. Abdelhamid",70,["CB"],"LCB",21,"Morocco"],["A. Lang",69,["CB"],"SUB",2,"Hungary"],["D. Bahamboula",69,["ST","RM","LM"],"RS",24,"France"],["J. Marié",69,["CM","CDM"],"SUB",14,"France"],["Q. Bernard",69,["LB"],"SUB",5,"France"],["J. Bela",68,["RW","RM","ST","LM"],"SUB",10,"France"],["J. Gastien",68,["CM"],"SUB",22,"France"],["Y. Rivière",66,["ST"],"SUB",7,"France"],["A. Belmonte",65,["CM"],"SUB",3,"France"],["G. Sarrabayrouse",61,["CDM"],"RES",6,"France"],["B. Allain",60,["GK"],"RES",16,"France"],["V. Rosier",59,["RB"],"RES",19,"France"]],"reserves":[["P. Lees-Melou",70,["CAM","RM"],"SUB",8,"France"],["L. Diony",70,["ST"],"SUB",9,"France"],["A. Lang",69,["CB"],"SUB",2,"Hungary"]]},
    "Guingamp":{"formation":"4-4-2","slots":["LM","LB","LS","RCB","LCB","LCM","RS","RCM","GK","RM","RB"],"players":[["Y. Salibur",76,["RM","LM"],"LM",19,"France"],["Marçal",76,["LB"],"LB",3,"Brazil"],["J. Briand",76,["ST","RM"],"LS",23,"France"],["R. Salin",76,["GK"],"SUB",30,"France"],["E. Didot",75,["CM","CDM"],"SUB",17,"France"],["C. Kerbrat",75,["CB"],"RCB",29,"France"],["N. Benezet",74,["LM","RM"],"SUB",10,"France"],["D. Lévêque",74,["LB"],"SUB",7,"France"],["T. Giresse",74,["LM"],"SUB",26,"France"],["J. Sorbon",74,["CB"],"LCB",15,"France"],["L. Deaux",74,["CDM","CB","CM"],"LCM",8,"France"],["B. Angoua",74,["CB"],"SUB",4,"Ivory Coast"],["S. Privat",73,["ST"],"RS",11,"France"],["J. Martins Pereira",72,["RB"],"SUB",22,"France"],["M. Diallo",72,["CDM","CM"],"RCM",5,"Senegal"],["K. Johnsson",70,["GK"],"GK",1,"Sweden"],["R. Lemaître",70,["LB"],"RES",25,"France"],["N. De Pauw",70,["RM"],"SUB",12,"Belgium"],["L. Blas",69,["RM"],"SUB",21,"France"],["M. Coco",69,["RM","LM","ST"],"RM",24,"France"],["A. Mendy",69,["ST"],"SUB",9,"France"],["J. Ikoko",67,["RB"],"RB",2,"DR Congo"],["B. Sankoh",66,["RB","CB","CDM"],"SUB",6,"Guinea"],["J. Correia",66,["RB","LB"],"RES",33,"France"],["S. Martinet",60,["ST"],"RES",14,"France"],["T. Guivarch",59,["GK"],"RES",16,"France"],["A. Mané",59,["CDM"],"RES",32,"France"],["J. Livolant",57,["CDM"],"SUB",31,"France"],["V. Mouangue",56,["LB"],"RES",34,"France"]],"reserves":[["B. Angoua",74,["CB"],"SUB",4,"Ivory Coast"],["T. Giresse",74,["LM"],"SUB",26,"France"],["J. Martins Pereira",72,["RB"],"SUB",22,"France"]]},
    "Lille":{"formation":"4-3-3 (2)","slots":["GK","RCB","RB","LW","RCM","ST","LCB","RW","LCM","LB","CDM"],"players":[["V. Enyeama",83,["GK"],"GK",1,"Nigeria"],["R. Civelli",78,["CB"],"RCB",5,"Argentina"],["S. Corchia",77,["RB"],"RB",2,"France"],["N. De Préville",77,["ST","LM","RM"],"LW",12,"France"],["R. Mavuba",77,["CDM","CM"],"RCM",24,"France"],["Éder",77,["ST"],"ST",19,"Portugal"],["M. Baša",77,["CB"],"LCB",25,"Montenegro"],["Marcos Lopes",76,["RW","CAM"],"RW",17,"Portugal"],["M. Obbadi",76,["CM"],"SUB",8,"Morocco"],["E. Bauthéac",76,["LM","LW","RM","RW"],"SUB",11,"France"],["Y. Sankharé",75,["CDM","CM"],"LCM",4,"Senegal"],["M. Amalfitano",75,["CM","RW","RM","LM"],"SUB",10,"France"],["J. Palmieri",75,["LB","LM"],"LB",15,"France"],["F. Béria",74,["LB","RB"],"SUB",18,"France"],["Y. Benzia",73,["ST","CAM","RW"],"SUB",9,"Algeria"],["I. Amadou",72,["CDM","CM"],"CDM",6,"Cameroon"],["A. Soumaoro",72,["CB","RB","LB"],"SUB",23,"France"],["S. Sunzu",72,["CB","CDM","CM"],"SUB",13,"Zambia"],["Ryan Mendes",72,["RM","LM","ST"],"SUB",20,"Cape Verde"],["N. Sliti",71,["LM"],"SUB",27,"Tunisia"],["J. Tallo",70,["ST","RW"],"SUB",14,"Ivory Coast"],["M. Maignan",67,["GK"],"SUB",16,"France"],["J. Butez",63,["GK"],"RES",30,"France"],["Y. Koné",60,["LB"],"SUB",3,"Mali"],["C. Arcus",53,["RB"],"RES",34,"Haiti"]],"reserves":[["Y. Benzia",73,["ST","CAM","RW"],"SUB",9,"Algeria"],["S. Sunzu",72,["CB","CDM","CM"],"SUB",13,"Zambia"],["Ryan Mendes",72,["RM","LM","ST"],"SUB",20,"Cape Verde"]]},
    "Lorient":{"formation":"4-1-4-1","slots":["GK","RM","LCM","RCM","LCB","CDM","ST","RB","LB","RCB","LM"],"players":[["B. Lecomte",79,["GK"],"GK",40,"France"],["B. Moukandjo",78,["ST","RM"],"RM",12,"Cameroon"],["S. Marveaux",75,["CAM","ST"],"LCM",10,"France"],["W. Mesloub",75,["CAM","CDM"],"RCM",17,"Algeria"],["W. Lautoa",75,["CB"],"LCB",24,"New Caledonia"],["Cafú",74,["CDM"],"CDM",8,"Portugal"],["B. Jeannot",74,["ST"],"RES",22,"France"],["A. Waris",74,["ST"],"ST",9,"Ghana"],["L. Rose",74,["CB","RB"],"RB",2,"France"],["J. Cabot",73,["LM","RM","ST"],"SUB",27,"France"],["V. Le Goff",73,["LB"],"LB",25,"France"],["M. Ciani",73,["CB"],"RCB",13,"France"],["A. Mvuemba",73,["CM","CDM"],"SUB",7,"DR Congo"],["R. Philippoteaux",73,["RM","LM"],"LM",19,"France"],["S. Moreira",72,["RB"],"SUB",20,"France"],["Z. Touré",72,["CB"],"SUB",5,"Senegal"],["F. Bellugou",72,["CDM","CB"],"SUB",6,"France"],["M. Barthelmé",72,["LM","LB","RM"],"SUB",28,"France"],["M. Fofana",70,["LM"],"SUB",23,"Ivory Coast"],["P. Paye",69,["RB"],"SUB",29,"France"],["P. Delecroix",69,["GK"],"SUB",16,"France"],["F. Selemani",65,["RM","RB"],"SUB",11,"France"],["M. Mara",61,["ST","CAM"],"RES",33,"Guinea"],["E. Koffi",61,["RB"],"SUB",31,"France"],["I. Conté",60,["CB"],"SUB",32,"Guinea"],["A. Lavenant",60,["CB"],"RES",34,"France"],["B. Mazikou",59,["LB"],"RES",3,"France"],["I. Ben Khemis",57,["CM"],"RES",26,"France"],["A. Lamonge",55,["GK"],"RES",1,"France"]],"reserves":[["Z. Touré",72,["CB"],"SUB",5,"Senegal"],["F. Bellugou",72,["CDM","CB"],"SUB",6,"France"],["M. Barthelmé",72,["LM","LB","RM"],"SUB",28,"France"]]},
    "Lyon":{"formation":"4-3-3 (2)","slots":["ST","GK","RW","RCB","LCB","CDM","RCM","LCM","RB","LB","LW"],"players":[["A. Lacazette",85,["ST"],"ST",10,"France"],["A. Lopes",83,["GK"],"GK",1,"Portugal"],["N. Fekir",81,["RW","ST"],"RW",18,"France"],["M. Yanga-M'Biwa",81,["CB"],"RCB",2,"France"],["N. Nkoulou",81,["CB"],"LCB",3,"Cameroon"],["M. Gonalons",81,["CDM","CB"],"CDM",21,"France"],["Sergi Darder",79,["CM"],"RCM",14,"Spain"],["C. Jallet",79,["RB"],"SUB",13,"France"],["M. Valbuena",79,["RW","LW"],"SUB",28,"France"],["C. Tolisso",78,["CM","CDM"],"LCM",8,"France"],["Rafael",78,["RB","LB"],"RB",20,"Brazil"],["R. Ghezzal",77,["RW","LW"],"SUB",11,"Algeria"],["J. Ferri",77,["CM"],"SUB",12,"France"],["C. Grenier",77,["CM","CAM"],"SUB",7,"France"],["J. Morel",76,["LB","CB"],"LB",15,"France"],["M. Cornet",75,["LW","RW","ST"],"LW",27,"France"],["M. Rybus",74,["LB","LM"],"SUB",31,"Poland"],["G. Fofana",73,["CM","CDM"],"RES",6,"France"],["A. Kalulu",69,["ST"],"SUB",26,"France"],["M. Gorgelin",68,["GK"],"SUB",30,"France"],["L. Tousart",67,["CM","CDM"],"SUB",29,"France"],["E. Mammana",67,["CB"],"SUB",4,"Argentina"],["O. Kemen",66,["CM","CDM","RB"],"SUB",24,"France"],["G. Perrin",65,["RM","ST"],"RES",22,"France"],["M. Diakhaby",64,["CB","CDM"],"RES",38,"France"],["H. Aouar",63,["CAM","CM"],"RES",39,"France"],["M. D'Arpino",63,["CM"],"RES",34,"France"],["L. Mocio",63,["GK"],"RES",16,"France"],["J. Mateta",62,["ST"],"RES",19,"France"],["D. Mboumbouni",60,["CB"],"RES",35,"France"],["I. Hemans",58,["LB","LM","LW"],"SUB",36,"Ghana"],["M. Maolida",55,["ST"],"RES",37,"France"],["D. Grange",54,["GK"],"RES",40,"France"]],"reserves":[["C. Grenier",77,["CM","CAM"],"SUB",7,"France"],["M. Rybus",74,["LB","LM"],"SUB",31,"Poland"],["G. Fofana",73,["CM","CDM"],"RES",6,"France"]]},
    "Marseille":{"formation":"4-2-3-1 (2)","slots":["LDM","CAM","ST","RM","RDM","LB","RCB","GK","LCB","RB","LM"],"players":[["L. Diarra",83,["CDM","CM"],"LDM",10,"France"],["R. Cabella",80,["CAM","RM","LM"],"CAM",7,"France"],["B. Gomis",78,["ST"],"ST",18,"France"],["F. Thauvin",77,["RM","LM"],"RM",26,"France"],["W. Vainqueur",77,["CDM","CM"],"RDM",19,"France"],["H. Bedimo",77,["LB"],"LB",12,"Cameroon"],["R. Alessandrini",77,["RM","LW","LM"],"SUB",11,"France"],["T. Hubočan",76,["CB"],"RCB",15,"Slovakia"],["Y. Pelé",74,["GK"],"GK",16,"France"],["A. Diaby",74,["CDM","CM"],"SUB",5,"France"],["Dória",73,["CB"],"LCB",3,"Brazil"],["K. Rekik",73,["CB"],"SUB",4,"Netherlands"],["H. Sakai",73,["RB"],"RB",2,"Japan"],["R. Fanni",73,["CB","RB"],"SUB",24,"France"],["Rolando",73,["CB"],"SUB",6,"Portugal"],["B. Sarr",71,["RM","LM","CAM"],"SUB",17,"France"],["C. N'Jié",70,["ST","RW","LW"],"LM",14,"Cameroon"],["Z. Machach",68,["CM","LM"],"SUB",23,"France"],["S. Khaoui",67,["CAM","RM","LM"],"RES",20,"Tunisia"],["B. Samba",66,["GK"],"SUB",1,"Congo"],["A. Leya Iseka",65,["ST"],"RES",22,"Belgium"],["G. Andonian",65,["CB","LB"],"RES",13,"Armenia"],["A. Rabillard",63,["ST"],"SUB",28,"France"],["B. Tuiloma",63,["CDM","CB"],"RES",25,"New Zealand"],["J. Porsan-Clemente",61,["ST"],"RES",32,"France"],["M. Lopez",60,["RM","CAM"],"SUB",27,"France"],["E. Haugan",59,["CB"],"SUB",35,"Norway"],["A. Sané",59,["CB"],"RES",34,"France"],["A. Zambo Anguissa",58,["CM"],"SUB",29,"Cameroon"],["F. Escales",57,["GK"],"RES",40,"France"],["J. Dacosta",56,["RB"],"RES",36,"France"]],"reserves":[["Rolando",73,["CB"],"SUB",6,"Portugal"],["B. Sarr",71,["RM","LM","CAM"],"SUB",17,"France"],["Z. Machach",68,["CM","LM"],"SUB",23,"France"]]},
    "Metz":{"formation":"4-1-4-1","slots":["RM","ST","LCM","LB","RCB","LM","LCB","GK","CDM","RB","RCM"],"players":[["Y. Jouffre",77,["RM"],"RM",8,"France"],["M. Biševac",77,["CB"],"SUB",4,"Serbia"],["M. Erdinç",75,["ST"],"ST",9,"Turkey"],["R. Cohade",74,["CM"],"LCM",24,"France"],["B. Assou-Ekotto",73,["LB"],"SUB",32,"Cameroon"],["F. Signorino",71,["LB"],"LB",13,"France"],["G. Milan",71,["CB"],"RCB",5,"Argentina"],["O. N'Guette",70,["RM","LM"],"LM",11,"France"],["S. Falette",70,["CB"],"LCB",6,"France"],["T. Didillon",69,["GK"],"GK",1,"France"],["C. Doukouré",69,["CDM","CM"],"CDM",10,"Ivory Coast"],["F. Mollet",69,["CM"],"SUB",19,"France"],["J. Rivierez",69,["CB","RB"],"RB",3,"France"],["E. Kawashima",69,["GK"],"RES",16,"Japan"],["Balliu",68,["RB"],"SUB",25,"Spain"],["K. Lejeune",68,["LM","CAM"],"SUB",22,"France"],["G. Mandjeck",67,["CDM","CM"],"RCM",14,"Cameroon"],["J. Ikaunieks",64,["CAM","RM","LM"],"SUB",27,"Latvia"],["T. Vion",64,["ST"],"RES",18,"France"],["V. Selimovic",63,["CB"],"SUB",21,"Luxembourg"],["H. Diallo",63,["ST"],"SUB",17,"Senegal"],["A. Larriere",62,["CM"],"SUB",20,"France"],["I. Sarr",60,["RW"],"SUB",26,"Senegal"],["M. Seydi",60,["RM"],"RES",31,"Senegal"],["C. Philipps",60,["CDM","CB"],"RES",23,"Luxembourg"],["M. Udol",59,["LB"],"RES",12,"France"],["P. Saliu",59,["CDM","CAM"],"RES",28,"Nigeria"],["D. Oberhauser",59,["GK"],"SUB",30,"France"],["G. Hein",58,["CM"],"SUB",7,"France"],["D. Dufrenne",58,["GK"],"RES",34,"France"],["N. Basin",58,["LB"],"RES",33,"France"],["F. Sido",57,["RM","RW"],"RES",2,"Burkina Faso"]],"reserves":[["K. Lejeune",68,["LM","CAM"],"SUB",22,"France"],["Balliu",68,["RB"],"SUB",25,"Spain"],["T. Vion",64,["ST"],"RES",18,"France"]]},
    "Monaco":{"formation":"4-2-2-2","slots":["LDM","LCB","GK","RAM","RS","RDM","RB","LS","LAM","RCB","LB"],"players":[["João Moutinho",83,["CAM","CDM"],"LDM",8,"Portugal"],["K. Glik",83,["CB"],"LCB",25,"Poland"],["D. Subašić",83,["GK"],"GK",1,"Croatia"],["Bernardo Silva",81,["RM","CAM","CM"],"RAM",10,"Portugal"],["Falcao",81,["ST"],"RS",9,"Colombia"],["Fabinho",79,["CDM","RB"],"RDM",2,"Brazil"],["D. Sidibé",79,["LB","RB"],"RB",19,"France"],["V. Germain",79,["ST"],"LS",18,"France"],["T. Lemar",78,["RM","CAM","LM"],"LAM",27,"France"],["M. De Sanctis",78,["GK"],"SUB",16,"Italy"],["A. Raggi",78,["CB","RB"],"SUB",24,"Italy"],["Jemerson",77,["CB"],"RCB",5,"Brazil"],["N. Dirar",76,["RM"],"SUB",7,"Morocco"],["B. Mendy",75,["LB"],"LB",23,"France"],["T. Bakayoko",74,["CDM","CM"],"SUB",14,"France"],["C. Jean",72,["ST","LM","RM"],"SUB",28,"France"],["G. Carrillo",72,["ST"],"SUB",11,"Argentina"],["K. Mbappe Lottin",71,["LW"],"SUB",29,"France"],["A. Traoré",71,["CM","CDM","CAM"],"SUB",20,"Mali"],["A. Touré",70,["RB"],"SUB",38,"Mali"],["A. Diallo",69,["CB"],"RES",34,"France"],["Boschilia",68,["CAM"],"SUB",26,"Brazil"],["K. N'Doram",67,["CB"],"SUB",47,"France"],["L. Badiashile",66,["GK"],"RES",40,"France"],["A. Thiam",64,["CDM"],"SUB",36,"France"],["C. Tirard",63,["LW","LM"],"RES",41,"France"],["D. Mills",62,["RW"],"RES",42,"Ghana"],["C. Lina",60,["CDM"],"RES",44,"France"],["I. Cardona",59,["ST"],"RES",55,"France"],["Q. N'Gakoutou",59,["ST"],"RES",46,"Central African Republic"],["S. Sy",59,["GK"],"RES",30,"Senegal"],["Y. Andzouana",58,["LM"],"RES",49,"DR Congo"],["M. Beneddine",58,["RB"],"RES",48,"France"]],"reserves":[["G. Carrillo",72,["ST"],"SUB",11,"Argentina"],["C. Jean",72,["ST","LM","RM"],"SUB",28,"France"],["A. Traoré",71,["CM","CDM","CAM"],"SUB",20,"Mali"]]},
    "Montpellier":{"formation":"4-2-3-1 (2)","slots":["CAM","RCB","RM","GK","LCB","LB","ST","LDM","RB","LM","RDM"],"players":[["R. Boudebouz",79,["CAM","CM"],"CAM",10,"Algeria"],["Hilton",79,["CB"],"RCB",4,"Brazil"],["M. Sanson",78,["CM","CDM","CAM","LM"],"RM",8,"France"],["G. Jourdren",78,["GK"],"GK",16,"France"],["D. Congré",75,["CB","LB","RB"],"LCB",3,"France"],["P. Lasne",75,["RM","CM"],"SUB",7,"France"],["J. Roussillon",74,["LB","LM"],"LB",24,"France"],["C. Ninga",73,["ST","RW"],"ST",29,"Chad"],["Y. Sylla",73,["CDM","CM"],"LDM",5,"Mali"],["W. Rémy",72,["CDM","CB","RB"],"SUB",21,"France"],["L. Pionnier",72,["GK"],"SUB",1,"France"],["J. Marveaux",72,["CDM","CM"],"SUB",6,"France"],["S. Camara",71,["ST","RW"],"SUB",19,"Senegal"],["A. Vanden Borre",71,["RB"],"RB",20,"Belgium"],["K. Bérigaud",71,["ST","CF"],"LM",11,"France"],["M. Deplagne",70,["RB"],"SUB",25,"France"],["J. Ligali",69,["GK"],"RES",30,"France"],["S. Mounié",68,["ST"],"SUB",15,"Benin"],["E. Skhiri",65,["CM","RB","RM","CB"],"RDM",13,"Tunisia"],["N. Saint-Ruf",65,["CB","RB","CDM"],"SUB",18,"France"],["M. NDiaye",62,["LB","RB"],"SUB",2,"France"],["D. Bertaud",60,["GK"],"RES",40,"France"],["M. Poaty",60,["LB"],"RES",36,"France"],["P. Fito",60,["CDM"],"SUB",17,"France"],["T. Chaouche",60,["CM"],"SUB",34,"France"],["K. Sanson",55,["CDM"],"SUB",22,"France"]],"reserves":[["S. Camara",71,["ST","RW"],"SUB",19,"Senegal"],["M. Deplagne",70,["RB"],"SUB",25,"France"],["J. Ligali",69,["GK"],"RES",30,"France"]]},
    "Nancy":{"formation":"4-3-3 (2)","slots":["LCB","LW","CDM","RCM","ST","GK","RB","RCB","RW","LB","LCM"],"players":[["C. Lenglet",74,["CB"],"LCB",2,"France"],["C. Mandanne",74,["ST","CF"],"SUB",12,"France"],["A. Diarra",73,["CB","CDM"],"SUB",5,"France"],["A. Koura",72,["ST","RW","LW"],"LW",23,"France"],["B. Pedretti",72,["CDM","CM"],"CDM",25,"France"],["I. Dia",72,["RM","ST"],"SUB",10,"Senegal"],["J. Cétout",72,["RB","CDM"],"SUB",28,"France"],["Y. Ait Bennasser",71,["CM"],"RCM",6,"Morocco"],["Y. Hadji",71,["ST"],"ST",15,"Morocco"],["G. Ndy Assembe",71,["GK"],"GK",16,"Cameroon"],["J. Cuffaut",71,["RB"],"RB",14,"France"],["D. Guidileye",70,["CDM","CM"],"SUB",18,"Mauritania"],["M. Chrétien",70,["CB"],"RCB",20,"Morocco"],["A. Robic",70,["RW"],"RW",7,"France"],["S. Chernik",69,["GK"],"SUB",1,"Belarus"],["V. Muratori",69,["LB"],"LB",26,"France"],["M. Dalé",69,["ST","RW"],"SUB",9,"France"],["V. Marchetti",68,["CM","CDM","LB"],"SUB",8,"France"],["M. Diagne",68,["CB"],"SUB",4,"France"],["S. N'Guessan",66,["CM"],"LCM",13,"Ivory Coast"],["E. Cabaco",65,["CB"],"RES",24,"Uruguay"],["K. Coulibaly",64,["LW"],"SUB",11,"France"],["F. Maouassa",63,["LB"],"RES",17,"France"],["T. Badila",62,["LB"],"RES",3,"France"],["L. Puyo",62,["LW","LM","RM"],"SUB",19,"France"],["Y. Mabella",58,["ST"],"SUB",22,"France"],["A. Menay",57,["GK"],"RES",30,"France"]],"reserves":[["D. Guidileye",70,["CDM","CM"],"SUB",18,"Mauritania"],["S. Chernik",69,["GK"],"SUB",1,"Belarus"],["M. Dalé",69,["ST","RW"],"SUB",9,"France"]]},
    "Nantes":{"formation":"4-3-3 (2)","slots":["GK","CDM","RCB","LCB","LB","LW","RB","RCM","ST","RW","LCM"],"players":[["R. Riou",78,["GK"],"GK",1,"France"],["G. Gillet",77,["CM","CDM","RB"],"CDM",27,"Belgium"],["O. Vizcarrondo",76,["CB"],"RCB",4,"Venezuela"],["A. Thomasson",75,["RM","LM","CM"],"SUB",8,"France"],["Diego Carlos",75,["CB"],"LCB",3,"Brazil"],["Lucas Lima",74,["LB"],"LB",6,"Brazil"],["K. Djidji",73,["CB"],"SUB",26,"Ivory Coast"],["E. Sala",73,["ST"],"SUB",9,"Argentina"],["Y. Bammou",73,["ST","CAM"],"SUB",10,"Morocco"],["N. Thomsen",72,["LM","CM","RM","LW"],"LW",23,"Denmark"],["L. Dubois",71,["RB","LB"],"RB",15,"France"],["V. Rongier",71,["CM","CDM"],"RCM",28,"France"],["A. Kačaniklić",71,["LM","RM","CAM"],"SUB",11,"Sweden"],["M. Dupé",70,["GK"],"SUB",30,"France"],["W. Moimbé",70,["LB"],"SUB",13,"France"],["M. Stępiński",69,["ST"],"ST",18,"Poland"],["J. Iloki",69,["RM","RW"],"RW",7,"France"],["F. Aristeguieta",69,["ST"],"SUB",2,"Venezuela"],["A. Harit",67,["CAM","CM"],"LCM",14,"France"],["A. Touré",65,["CDM","CM"],"SUB",19,"France"],["E. Kwateng",64,["RB","CB"],"SUB",25,"France"],["A. Walongwa",63,["CB"],"SUB",17,"Congo"],["A. Alégué",61,["RM","CF"],"SUB",24,"Cameroon"],["H. M'Laab",61,["CAM"],"RES",32,"France"],["A. Olliero",60,["GK"],"RES",16,"France"],["N. Gandi",60,["RW"],"RES",34,"France"],["Q. Braat",59,["GK"],"RES",40,"France"],["T. Bouriaud",58,["CM"],"RES",33,"France"]],"reserves":[["A. Kačaniklić",71,["LM","RM","CAM"],"SUB",11,"Sweden"],["W. Moimbé",70,["LB"],"SUB",13,"France"],["M. Dupé",70,["GK"],"SUB",30,"France"]]},
    "Nice":{"formation":"5-3-2","slots":["CB","RCM","LCM","RS","RWB","RCB","LS","LWB","GK","CM","LCB"],"players":[["Dante",80,["CB"],"CB",31,"Brazil"],["V. Koziello",79,["CM","CDM"],"RCM",26,"France"],["J. Seri",79,["CM","CAM"],"LCM",6,"Ivory Coast"],["M. Balotelli",79,["ST"],"RS",9,"Italy"],["Y. Belhanda",79,["CAM","CM","LM"],"SUB",5,"Morocco"],["M. Bodmer",79,["CDM","CB","CAM"],"SUB",24,"France"],["Ricardo Pereira",78,["RB","LB"],"RWB",21,"Portugal"],["P. Baysse",78,["CB","RB"],"RCB",4,"France"],["A. Pléa",77,["ST","RM"],"LS",14,"France"],["M. Le Marchand",77,["CB"],"SUB",20,"France"],["Dalbert",76,["LB","LM"],"LWB",29,"Brazil"],["V. Eysseric",76,["CAM","LM"],"SUB",13,"France"],["Y. Cardinale",75,["GK"],"GK",30,"France"],["W. Cyprien",72,["CM","CDM","CAM","RM"],"CM",25,"France"],["R. Walter",72,["CM","CDM"],"SUB",18,"France"],["M. Le Bihan",72,["ST"],"RES",10,"France"],["A. Souquet",71,["RB","LB","CM"],"SUB",2,"France"],["O. Boscagli",70,["CB","LB"],"SUB",28,"France"],["W. Benítez",70,["GK"],"RES",40,"Argentina"],["M. Hassen",70,["GK"],"SUB",1,"France"],["A. Bosetti",70,["ST"],"SUB",23,"France"],["M. Sarr",69,["LB","CB"],"LCB",34,"France"],["A. Lusamba",69,["CAM","CM","LM","RM"],"SUB",8,"France"],["S. Benrahma",68,["RM","ST","CAM"],"RES",11,"Algeria"],["S. Pouplin",68,["GK"],"RES",16,"France"],["A. Donis",67,["ST","RW"],"SUB",22,"Greece"],["J. Vercauteren",67,["LW","LM","RM"],"RES",7,"Belgium"],["A. Rafetraniaina",66,["CDM","RB","CM"],"SUB",12,"France"],["D. Caddy",65,["ST"],"RES",27,"France"],["V. Marcel",64,["CM","RM"],"RES",33,"France"],["G. Lloris",64,["CB"],"RES",3,"France"],["B. Constant",61,["ST"],"RES",19,"France"],["P. Puel",54,["ST"],"RES",35,"France"]],"reserves":[["M. Le Bihan",72,["ST"],"RES",10,"France"],["R. Walter",72,["CM","CDM"],"SUB",18,"France"],["A. Souquet",71,["RB","LB","CM"],"SUB",2,"France"]]},
    "Paris Saint-Germain":{"formation":"4-3-3 (2)","slots":["LCB","RW","LCM","RCM","ST","RB","RCB","LW","CDM","GK","LB"],"players":[["Thiago Silva",89,["CB"],"LCB",2,"Brazil"],["A. Di María",87,["RW","CM","CAM"],"RW",11,"Argentina"],["B. Matuidi",86,["CDM","CM"],"LCM",14,"France"],["M. Verratti",85,["CM","CDM"],"RCM",6,"Italy"],["J. Pastore",85,["CM","LW","RW"],"SUB",10,"Argentina"],["E. Cavani",85,["ST","LW"],"ST",9,"Uruguay"],["G. Krychowiak",84,["CDM"],"SUB",23,"Poland"],["H. Ben Arfa",84,["CAM","ST","RM","RW"],"SUB",21,"France"],["S. Aurier",83,["RB","CB"],"RB",19,"Ivory Coast"],["K. Trapp",83,["GK"],"SUB",1,"Germany"],["Marquinhos",82,["CB","RB"],"RCB",5,"Brazil"],["Lucas",82,["RW","LW"],"LW",7,"Brazil"],["T. Motta",82,["CDM"],"CDM",8,"Italy"],["A. Areola",81,["GK"],"GK",16,"France"],["L. Kurzawa",81,["LB"],"LB",20,"France"],["Jesé",80,["LW","RW","ST"],"SUB",22,"Spain"],["Maxwell",79,["LB"],"SUB",17,"Brazil"],["A. Rabiot",78,["CM","CDM"],"SUB",25,"France"],["T. Meunier",77,["RB"],"SUB",12,"Belgium"],["P. Kimpembe",73,["CB"],"SUB",3,"France"],["J. Augustin",72,["ST","RW"],"SUB",29,"France"],["H. Ongenda",69,["LW"],"SUB",35,"DR Congo"],["R. Habran",68,["RM","RW"],"RES",39,"France"],["J. Ikoné",67,["LW"],"RES",42,"France"],["C. Nkunku",67,["CM"],"SUB",24,"France"],["A. Georgen",63,["RB"],"RES",34,"France"],["L. Callegari",63,["CDM"],"RES",37,"France"],["R. Descamps",63,["GK"],"RES",40,"France"],["Y. Demoncy",63,["CDM"],"RES",36,"France"],["A. Bernede",61,["CAM"],"RES",43,"France"]],"reserves":[["Jesé",80,["LW","RW","ST"],"SUB",22,"Spain"],["Maxwell",79,["LB"],"SUB",17,"Brazil"],["A. Rabiot",78,["CM","CDM"],"SUB",25,"France"]]},
    "Rennes":{"formation":"4-4-2 (2)","slots":["GK","LM","RS","RCB","RM","LDM","LS","RDM","LB","LCB","RB"],"players":[["B. Costil",82,["GK"],"GK",1,"France"],["P. Ntep",80,["LM","LW"],"LM",7,"France"],["Y. Gourcuff",79,["CAM","CM","LW"],"RS",28,"France"],["Mexer",78,["CB"],"RCB",4,"Mozambique"],["K. Grosicki",77,["RW","RM"],"RM",10,"Poland"],["B. André",76,["CDM","CM","RM"],"LDM",21,"France"],["G. Sio",76,["ST"],"LS",13,"Ivory Coast"],["Pedro Henrique",76,["RM","ST","LM"],"SUB",18,"Brazil"],["Gelson Fernandes",76,["CDM","CM"],"SUB",6,"Switzerland"],["C. Chantôme",76,["CM","CDM"],"RDM",8,"France"],["Afonso Figueiredo",75,["LB"],"LB",25,"Portugal"],["S. Armand",75,["CB"],"LCB",22,"France"],["L. Baal",75,["LB"],"SUB",24,"France"],["R. Danzé",75,["RB"],"RB",29,"France"],["Pedro Mendes",73,["CB"],"SUB",5,"Portugal"],["P. Nardi",72,["GK"],"SUB",16,"France"],["R. Bensebaini",71,["LB","CB","CDM"],"SUB",15,"Algeria"],["H. Habibou",71,["ST"],"RES",34,"Central African Republic"],["D. Cavaré",70,["RB"],"RES",19,"France"],["K. Erasmus",70,["ST","CF"],"SUB",9,"South Africa"],["E. Lenjani",70,["LB"],"RES",17,"Albania"],["M. Zeffane",69,["RB"],"SUB",2,"Algeria"],["C. Brüls",69,["LM","CAM","RM"],"RES",38,"Belgium"],["W. Saïd",67,["LW","LM"],"SUB",11,"France"],["A. Ribelin",67,["CM","CAM","RM","LM"],"SUB",27,"France"],["S. Prcić",67,["CDM","CM"],"SUB",26,"Bosnia Herzegovina"],["A. Hunou",66,["CDM","CM","LM","CAM"],"RES",23,"France"],["A. Diakhaby",65,["ST"],"SUB",31,"France"],["J. Gélin",63,["CB","CDM"],"RES",44,"France"],["J. Gnagnon",62,["CB"],"RES",32,"France"],["N. Janvier",61,["CAM","RM"],"RES",36,"France"],["E. Gertmonas",61,["GK"],"RES",30,"Lithuania"],["N. Diallo",60,["LB"],"RES",41,"France"]],"reserves":[["P. Nardi",72,["GK"],"SUB",16,"France"],["R. Bensebaini",71,["LB","CB","CDM"],"SUB",15,"Algeria"],["H. Habibou",71,["ST"],"RES",34,"Central African Republic"]]},
    "Saint-Étienne":{"formation":"4-3-3 (2)","slots":["GK","RCB","LW","LCB","RCM","LCM","RW","ST","RB","CDM","LB"],"players":[["S. Ruffier",85,["GK"],"GK",16,"France"],["L. Perrin",82,["CB"],"RCB",24,"France"],["H. Saivet",78,["CM","CDM","ST"],"SUB",11,"Senegal"],["R. Hamouma",78,["RM","RW","LW"],"LW",21,"France"],["F. Pogba",77,["CB"],"LCB",19,"Guinea"],["J. Veretout",76,["CM","CDM","CAM"],"RCM",14,"France"],["F. Lemoine",76,["CM","CDM"],"LCM",18,"France"],["O. Tannane",75,["RW","LW"],"RW",10,"Morocco"],["B. Dabo",75,["CM","CDM","RB","RM"],"SUB",7,"France"],["R. Berić",75,["ST"],"ST",27,"Slovenia"],["J. Clément",75,["CDM","CM"],"SUB",6,"France"],["K. Monnet-Paquet",75,["LM","RW","LW","RM"],"SUB",22,"France"],["C. M'Bengue",75,["LB"],"SUB",12,"Senegal"],["N. Roux",75,["ST","RM"],"SUB",9,"France"],["V. Pajot",74,["CM","CDM"],"SUB",5,"France"],["K. Théophile-Catherine",74,["RB","CB"],"RB",2,"France"],["B. Corgnet",74,["CAM","CM"],"SUB",8,"France"],["A. Søderlund",73,["ST"],"SUB",23,"Norway"],["O. Selnæs",72,["CDM","CM"],"CDM",17,"Norway"],["P. Polomat",70,["LB"],"LB",3,"France"],["K. Malcuit",70,["RB"],"SUB",25,"France"],["L. Lacroix",69,["CB"],"SUB",4,"Switzerland"],["J. Moulin",68,["GK"],"SUB",30,"France"],["A. Maisonnial",65,["GK"],"RES",1,"France"],["C. Suljic",63,["CM"],"RES",41,"France"],["B. Karamoko",63,["CB"],"RES",38,"France"],["J. Nyemeck",63,["RB","LB"],"RES",36,"France"],["Erin Pinheiro",62,["CM"],"RES",15,"Cape Verde"],["K. Madianga",61,["CM","CDM"],"RES",37,"France"],["R. Pierre-Gabriel",59,["RB"],"RES",31,"France"],["B. Landini",58,["RB"],"RES",35,"France"]],"reserves":[["N. Roux",75,["ST","RM"],"SUB",9,"France"],["C. M'Bengue",75,["LB"],"SUB",12,"Senegal"],["V. Pajot",74,["CM","CDM"],"SUB",5,"France"]]},
    "Toulouse":{"formation":"4-1-4-1","slots":["ST","RCM","LM","GK","LCM","CDM","RCB","LCB","LB","RM","RB"],"players":[["M. Braithwaite",78,["ST"],"ST",9,"Denmark"],["O. Trejo",77,["CAM","CM","RM"],"RCM",10,"Argentina"],["J. Durmaz",75,["LM","RM","LW","RW"],"LM",21,"Sweden"],["A. Lafont",74,["GK"],"GK",40,"France"],["J. Akpa Akpro",74,["CM","RM","LM"],"SUB",7,"Ivory Coast"],["O. Toivonen",74,["CAM","CM"],"LCM",11,"Sweden"],["A. Blin",73,["CDM"],"CDM",27,"France"],["I. Diop",73,["CB"],"RCB",5,"France"],["C. Jullien",73,["CB"],"LCB",6,"France"],["F. Moubandje",73,["LB","CB"],"LB",29,"Switzerland"],["T. Doumbia",72,["CM","CDM"],"SUB",4,"Mali"],["Y. Bodiger",71,["CDM","CM"],"SUB",23,"France"],["D. Veškovac",71,["CB"],"SUB",22,"Serbia"],["Somália",71,["RM"],"RM",19,"Brazil"],["Y. Musavu-King",70,["CB","LB"],"SUB",3,"Gabon"],["S. Yago",70,["CB","RB"],"RB",20,"Burkina Faso"],["I. Sylla",70,["LM","LB"],"SUB",12,"Guinea"],["M. Goicoechea",70,["GK"],"SUB",1,"Uruguay"],["P. Ninkov",69,["RB","RM"],"SUB",24,"Serbia"],["J. Pi",68,["CM","CDM"],"SUB",25,"France"],["O. Edouard",67,["RM"],"SUB",18,"France"],["D. Lukebakio",67,["RM"],"RES",8,"Belgium"],["F. Sirieix",66,["CM","CDM"],"SUB",14,"France"],["M. Cafaro",65,["CM"],"RES",32,"France"],["M. Vidal",65,["GK"],"RES",16,"France"],["C. Michelin",64,["RB"],"RES",33,"France"],["K. Amian Adou",64,["RB"],"RES",36,"France"],["Q. Boisgard",61,["CAM","ST"],"SUB",34,"France"],["D. Dianessy",61,["ST"],"RES",35,"France"],["I. Sangaré",59,["CM"],"RES",17,"Ivory Coast"],["N. Bostan",59,["GK"],"RES",50,"France"]],"reserves":[["M. Goicoechea",70,["GK"],"SUB",1,"Uruguay"],["Y. Musavu-King",70,["CB","LB"],"SUB",3,"Gabon"],["I. Sylla",70,["LM","LB"],"SUB",12,"Guinea"]]}
  };
  Object.values(formations).forEach(Object.freeze);
  Object.values(clubs).forEach(c=>{[...c.players,...c.reserves].forEach(p=>{Object.freeze(p[2]);Object.freeze(p);});Object.freeze(c.players);Object.freeze(c.reserves);Object.freeze(c.slots);Object.freeze(c);});
  return Object.freeze({roster:"fifa17-launch-170002",source:"https://raw.githubusercontent.com/ifrankandrade/data-visualization/main/datasets/players_17.csv",sourceSha256:"f2d35920e5cddb28d750924281c4e4095fdc485a5d8358497cd579b1b7b5e03a",rowCount:2975,columns:Object.freeze(["name","overall","player_positions","team_position","team_jersey_number","nationality"]),formations:Object.freeze(formations),clubs:Object.freeze(clubs)});
});

````

# Fable job 11: r87 Squad Roulette, the whole thing in one hunt (Career Mode Showdown 2.0.0)

Code snapshot: gameplay/r87 @ 7d528567e, repo nikahanghojjati-oss/fifa17-career-showdown2. This one job covers two areas: (A) the roulette screen (stuck states, animation, sound) and (B) the squad boards it shows (updates, positions, overalls). The source of every file involved is below this brief. Big data files are excerpted, and the three.js r128 library is left out. You cannot run code here, so reason carefully and show your trace.

## The product
A private two-player FIFA 17 Career Mode competition web app (vanilla JS, Firebase Firestore on the free Spark plan, GitHub Pages, a service worker for offline). Two managers, Daniel (playerOne, who taps START) and Nik (playerTwo), each on his own phone (iPhone Safari, Android Chrome) or laptop, play a "Showdown" of 1, 3, 5 or 10 seasons. Firestore reads are scarce.

## The screen you own: Roster Russian Roulette
Every season, after Career Start and before the transfer window, each manager spins a 7-chamber revolver (Daniel first, then Nik) in a full-screen 3D scene (a cowboy cafe, three.js, sound cues). Every result comes from the Showdown's 64-hex id, so both phones agree with no reads and a reload can never re-spin. A shot hits one player on that manager's 15-player board (XI + 4 subs), who is then released in FIFA 17. The engine is js/rosterRoulette.js. The app side is js/rosterRouletteStep.js: it puts the scene page (visual-assets/v10_1/roulette/index.html) in an iframe, talks to it by postMessage (cms-rr-setup, cms-rr-ready, cms-rr-armed, cms-rr-error, cms-rr-continue), and holds the app's loading screen until the scene is armed. After the spin, each manager's spin mark is written once, and the transfer window opens only when both marks exist (js/productionSharedTransferChallenge.js, js/sparkSharedTransferChallenge.js). js/productionSharedCareerStart.js opens the step and handles BACK TO SHOWDOWN HOME.

## How the board is built
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

## Part A: the screen
1. **Stuck screens.** Every way a manager ends up with no way forward: the loading screen never lifts, a black or frozen iframe, the scene never answers cms-rr-setup, a message lost or sent before the listener exists, a message from a stale iframe or an old build, a spin that never finishes, CONTINUE that does nothing or can be pressed before it should, a step left "active()" forever (which also holds the Career Start 25 s timer and the reconnect poll), a promise that never settles, a timer cleared on one path but not another, a wait for the other phone's mark with no way out.
2. **Animation and timing.** The spin, cylinder, hand, shot, flash, board highlight and result card: frames that jump, play twice, stop half way, or run on after the scene is gone. requestAnimationFrame loops that keep running when hidden or after exit, or stop for good after the tab was hidden (iPhone lock, app switch, Safari page eviction and restore from the back-forward cache). Time based on wall clock vs frame count, large time jumps after a resume, very slow devices, prefers-reduced-motion, resize and rotation mid-spin, a WebGL context loss or a device without WebGL.
3. **Sound.** AudioContext locked until a tap on iPhone, cues that never play, play late, overlap, or keep playing (room tone) after exit or when hidden; a decode or fetch failure that blocks the scene.
4. **What the scene shows vs the engine.** The scene must show exactly the shot the engine decided (fire spot, chamber, hit player, empty chamber), the same on both phones, and the result card must name the same player the mark records. The Special Player is never on a board or hit. Check board drawing for 14-15 players, any formation, long names, missing data, and a club whose board shrank.
5. **Leaving and coming back.** Reload mid-spin, BACK TO SHOWDOWN HOME, a second tab, offline mid-step, the other phone a step ahead or behind, the service worker serving a mixed set of files after an upgrade (1.9.10 phone, 2.0.0 phone).
6. **Leaks.** Listeners, intervals, rAF loops, audio nodes, WebGL renderers and iframes left behind after exit; each time the step runs they add up over 10 seasons.

## Part B: the boards
1. **Board update correctness.** Trace rrForSeason by hand for 10 seasons. Check every rule above, and these cases: a shot player never comes back (also as a refill from the club pool or a reserve); a guessed signing never appears, now or later; a kept signing always appears unless he is a shot player or a Special Player; a player guessed in one window and signed again (not guessed) in a later window; a re-signing of a player already signed; a signing with the same name as a club player (namesakes); two kept signings with equal overalls; a kept signing worse than everyone (bench or not at all?); a keeper signing when the club already has two keepers; the XI never left without a keeper while one exists; the board running short and what fills the slot; the Special Player being a player of the rival's club.
2. **Positions.** Check how the engine decides a player "fits" a slot (rrFit, rrLine), how a signing's typed position is used, how a club player's positions come from the pool (including namesakes at other clubs), and what happens to out-of-position launch picks. Would a FIFA 17 manager agree with each XI/bench choice? Find any case where a clearly better fitting player sits on the bench or in reserve while a weaker one starts, or a player is put in a slot he cannot play.
3. **Ratings vs the real game.** Spot-check from your own knowledge of FIFA 17 launch ratings (squad 170002) the stars and some lesser players of a few clubs in data/rosterSquads.js and data/fifa17Players.js: overall, main position, club. Also check the launch XI/subs choice in scripts/build-fifa17-rosters.py against how FIFA 17 itself picks a starting XI. Mark each claim that rests on memory as "from memory".
4. **The engine log.** The section "ENGINE LOG" below is real output of the current engine for Daniel (Arsenal) vs Nik (Bournemouth), Daniel's Special Player Neymar, Nik's Special Player M. Özil (an Arsenal player), with the Transfer War verdicts shown under each season. Go through it season by season and say for every board whether it is what Nik's rules and real FIFA 17 would give. Point at every line that looks wrong and trace why the engine produced it.
5. **Both phones must agree.** The board is computed on each phone; find any input (local verdict copy vs a read, saved shots, version of the data) that could make the two phones build different boards.
6. **What the manager sees.** Does the Rule Book text match what the engine does? Is the "kept off the board" note on the result card right in every case?

## House rules (a break is a bug)
- **Reus Gate:** the loading screen stays until the next screen is ready. Never dim. Nothing covers anything at any size. No flash of an old design or of a blank frame.
- The roulette is never skipped where it applies, and never runs twice for the same season. Never hide or reorder a needed screen.
- Both phones always show the same boards and the same shot.
- The Special Player is never on any roulette board, and is always "Special Player" or "SP" on screen.
- Recovery must be explicit: never fake success, never invent the other manager's action.

## Threat model
Normal play only: two honest players, reloads, phone locks, offline/online, slow networks, two tabs, races between the phones, a service-worker upgrade with one phone a build behind. Anything that needs a modified app, the console or direct database writes is out of scope. A manager can type any FIFA 17 player name, position and overall (30-99) for a signing, with honest mistakes (wrong position, typo in a name).

## Already fixed or known (do not re-report)
- Job 6: F6-01 (second BACK TO SHOWDOWN HOME), F6-03 (waiting line while own mark unsaved), F6-09 (cold-cache open timeout) are fixed in this snapshot. Verify they hold only if your trace passes through them.
- Known, deferred: F6-02 (first spinner's card shows the partner turn as its own build computes it), F6-04 (RRR_FROM_MS / ROULETTE_FROM_MS dates: set to the release time in the release PR), F6-05/07/08.
- Accented names in a fallback font on the 3D boards; initials matching; whether squad rows match the FIFA 17 database.
- The Prime Pack step that will run after the roulette is not in this snapshot.

## Your job
Work as the senior engineer who owns "the roulette never gets stuck, always looks right, and the board on screen is the squad in the real game". Read every file in full. data/fifa17Players.js and data/rosterSquads.js are excerpted to 8 clubs (re-printed as JSON), including the two clubs in the engine log; the code shows how they are read.

For Part A, walk a spin on both phones for season 1 and season 10 of a 10-season Showdown. Then repeat each step with a reload, a phone lock of 10 s and of 10 minutes, offline, a rotation, a second tab and a very slow phone.

For Part B, trace rrForSeason by hand and go through the ENGINE LOG season by season.

For each finding give:
- ID (F11-NN), part (A or B) and severity: P0 stuck, wrong player released or a guessed player on the board; P1 wrong screen, broken animation, desync or a board a manager will notice is wrong; P2 rare; P3 polish;
- file:line, quoting the code so it can be found by text;
- exact steps or inputs (clubs, verdicts, season) on the two phones;
- expected vs actual;
- your trace;
- the smallest fix you would make.

Put anything you are not sure of in a separate "suspected" list. No style notes. End with the top 7 to fix first.

Keep the visible reply under about 70,000 characters.

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

## FILE: visual-assets/v10_1/roulette/index.html

````html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Russian Roster Roulette</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<!-- Polish RR-3: Barlow Condensed (every board name, rating, button and result line) ships with the app from ../shared/fonts
     (shell-cached), so offline it never falls back to a serif. Big Shoulders Display (the RELEASED stamp) and Rye (the
     title) have no OFL files in the repo yet, so they still come from Google Fonts and fall back when offline. -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Rye&display=swap">
<style>
@font-face { font-family: "Barlow Condensed"; font-weight: 500 600; font-display: swap; src: url(../shared/fonts/barlow-condensed-latin-600-normal.woff2) format("woff2"); }
@font-face { font-family: "Barlow Condensed"; font-weight: 700 900; font-display: swap; src: url(../shared/fonts/barlow-condensed-latin-700-normal.woff2) format("woff2"); }
/* HO-040 Russian Roster Roulette · real 3D stage (three.js r128) with the Showdown HUD over it. Same tokens as the Special Player screen. */
:root {
  --ink: #050506; --gold: #f1c35a; --gold-hi: #fff3c4; --gold-deep: #9c6e22; --ivory: #f6eedb; --muted: #c9bc9c;
  --num: "Barlow Condensed", "Arial Narrow", sans-serif;
  --disp: "Big Shoulders Display", "Arial Narrow", sans-serif;
  --west: "Rye", "Big Shoulders Display", serif;
  color-scheme: dark;
}
html, body { height: 100%; }
body { margin: 0; background: var(--ink); color: var(--ivory); font-family: var(--num); overflow: hidden; -webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: transparent; }
#stage { position: fixed; inset: 0; }
#stage canvas { display: block; width: 100%; height: 100%; }
.hud { position: fixed; inset: 0; pointer-events: none; }
/* top bar (desktop): CM17 + tabs + chips + gear */
.bar { position: absolute; left: 0; right: 0; top: 0; height: 40px; display: flex; align-items: center; gap: 18px; padding: 0 18px; background: linear-gradient(180deg, rgba(14,11,7,.96), rgba(8,6,4,.92)); border-bottom: 1px solid rgba(241,195,90,.55); pointer-events: auto; }
.bar .cm { font: 900 20px/1 var(--disp); letter-spacing: .08em; color: var(--gold); }
.bar nav { display: flex; gap: 20px; margin-left: 10px; }
.bar nav a { font: 700 14px/1 var(--num); letter-spacing: .22em; text-transform: uppercase; color: var(--muted); text-decoration: none; padding: 12px 0 11px; border-bottom: 2px solid transparent; }
.bar nav a.on { color: var(--gold-hi); border-color: var(--gold); }
.chips { margin-left: auto; display: flex; gap: 8px; align-items: center; }
.chip { font: 700 12px/1 var(--num); letter-spacing: .18em; text-transform: uppercase; color: var(--gold-hi); border: 1px solid rgba(241,195,90,.7); border-radius: 999px; padding: 6px 11px 5px; background: rgba(0,0,0,.35); }
.gear { width: 26px; height: 26px; border-radius: 50%; border: 1px solid rgba(241,195,90,.7); display: grid; place-items: center; color: var(--gold); font-size: 15px; background: rgba(0,0,0,.35); }
/* title lockup */
.top { position: absolute; left: 0; right: 0; top: 46px; text-align: center; transition: opacity .45s ease; }
/* r87 scene polish: during a turn the camera goes in close (drum, shooter's view, the bullet), so the title lockup steps aside and never stands over a board name or the drum; it is back for the wide shot. Nothing else fades. */
body.turning .top { opacity: 0; }
.kicker { display: flex; justify-content: center; align-items: center; gap: 12px; }
.kicker::before, .kicker::after { content: ""; width: clamp(28px, 7vw, 90px); height: 1px; background: linear-gradient(90deg, transparent, var(--gold-hi)); box-shadow: 0 0 6px rgba(255,220,140,.8); }
.kicker::after { transform: scaleX(-1); }
.badge { position: relative; font: 900 13px/1 var(--disp); letter-spacing: .16em; text-transform: uppercase; color: #1a1105; padding: 5px 14px 4px 16px; background: linear-gradient(180deg, #fffbe6 0%, #f6d47c 45%, #c8922f 55%, #f3cf73 100%); clip-path: polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%); box-shadow: inset 0 1px 0 #fff; text-shadow: 0 1px 0 rgba(255,255,255,.55); }
.title { position: relative; display: inline-block; margin: 4px 0 0; font: 400 clamp(30px, 3.6vw, 48px)/1 var(--west); letter-spacing: .02em; text-transform: uppercase; }
.title span { display: block; background: linear-gradient(180deg, #fffdf2 0%, #fff0b8 30%, #f2c35a 48%, #a8731f 52%, #e6b04c 70%, #fff3c6 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
.title::before { content: attr(data-t); position: absolute; inset: 0; color: transparent; -webkit-text-stroke: 2px #2a1c05; filter: drop-shadow(0 2px 0 #120c02) drop-shadow(0 8px 14px rgba(0,0,0,.55)); z-index: -1; }
.title::after { content: attr(data-t); position: absolute; inset: 0; color: transparent; background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,.95) 48%, transparent 56%) no-repeat; background-size: 250% 100%; -webkit-background-clip: text; background-clip: text; animation: shine 5s ease-in-out infinite; }
@keyframes shine { 0%, 55% { background-position: 130% 0; } 100% { background-position: -30% 0; } }
@media (prefers-reduced-motion: reduce) { .title::after { animation: none; } }
/* centre column: result line + button */
.mid { position: absolute; left: 50%; top: 612px; transform: translateX(-50%); width: 440px; text-align: center; pointer-events: auto; }
.result { min-height: 34px; display: grid; place-items: center; font: 800 20px/1.1 var(--disp); letter-spacing: .1em; text-transform: uppercase; color: #fff8e6; text-shadow: 0 2px 4px #000, 0 0 16px rgba(0,0,0,.8); white-space: normal; overflow-wrap: anywhere; text-wrap: balance; }
/* Polish RR-2: never cut ("BANG! NACHO MONREAL IS RELEASE"): the line wraps to a second line, and a long name shrinks a step */
.result.long { font-size: 17px; letter-spacing: .06em; }
.result.bang { color: #ffd77a; }
.result.safe { color: #d8f5c8; }
.cta { margin-top: 10px; width: 360px; height: 52px; font: 800 19px/1 var(--disp); letter-spacing: .1em; text-transform: uppercase; color: #140e04; background: linear-gradient(180deg, #fff6d2, var(--gold) 55%, #c4943e); border: 0; box-shadow: 0 0 0 1px #000, inset 0 -2px 0 rgba(0,0,0,.2), 0 8px 24px rgba(0,0,0,.5); cursor: pointer; white-space: nowrap; transition: filter .3s; }
.cta.busy { cursor: default; letter-spacing: .2em; }
.cta:focus-visible { outline: 2px solid var(--gold-hi); outline-offset: 2px; }
/* bottom panel: 01 DANIEL + state / 02 NIK + state */
.bottom { position: absolute; left: 40px; right: 40px; bottom: 24px; height: 72px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: center; background: linear-gradient(180deg, #17140e, #070605); border: 1px solid rgba(241,195,90,.9); padding: 0 16px; box-shadow: inset 0 1px 0 rgba(255,243,196,.25), 0 10px 30px rgba(0,0,0,.45); pointer-events: auto; }
.slot { display: grid; grid-template-columns: auto 1fr; column-gap: 12px; align-items: center; min-width: 0; }
.slot.nik { grid-template-columns: 1fr auto; text-align: right; }
.slot em { grid-row: 1 / 3; font: 800 26px/1 var(--disp); font-style: normal; color: #1a1205; background: linear-gradient(180deg, var(--gold-hi), var(--gold)); padding: 5px 8px 4px; }
.slot.nik em { grid-column: 2; }
.slot b { font: 600 12px/1.1 var(--num); letter-spacing: .3em; text-transform: uppercase; color: var(--muted); }
.slot span { font: 800 22px/1.1 var(--disp); letter-spacing: .03em; text-transform: uppercase; color: #fff8e6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.slot span.wait { font: 700 15px/1.4 var(--num); color: var(--gold); letter-spacing: .26em; }
.slot span.lost { color: #ff8d7a; }
.slot span.safe { color: #cdf0b8; }
/* preview tools (?tools=1) */
.tools { position: absolute; left: 50%; transform: translateX(-50%); bottom: 104px; display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: center; pointer-events: auto; max-width: 900px; }
.tools button, .tools select { font: 700 13px/1 var(--num); letter-spacing: .16em; text-transform: uppercase; color: var(--ivory); background: rgba(8,7,6,.82); border: 1px solid rgba(241,195,90,.55); border-radius: 999px; padding: 8px 14px; cursor: pointer; }
.tools select { appearance: none; -webkit-appearance: none; }
body.game .tools { display: none; }
.phonebar, .pchips { display: none; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.toast { position: fixed; left: 50%; top: 42%; transform: translate(-50%, -50%); background: rgba(8,7,6,.94); border: 1px solid var(--gold); padding: 10px 16px; font: 700 14px/1 var(--num); letter-spacing: .14em; text-transform: uppercase; opacity: 0; transition: opacity .3s; pointer-events: none; }
.toast.on { opacity: 1; }
@media (max-height: 760px) and (min-width: 900px) { .mid { top: auto; bottom: 120px; } }
/* phone (upright, <= 900 px): chips top-left, gear top-right, title, scene, result, button, bottom tabs */
@media (max-width: 899px) {
  .bar, .bottom { display: none; }
  .pchips { display: flex; position: absolute; left: 8px; top: calc(env(safe-area-inset-top, 0px) + 8px); gap: 6px; }
  .pchips .chip { font-size: 11px; padding: 6px 9px 5px; }
  .pgear { position: absolute; right: 8px; top: calc(env(safe-area-inset-top, 0px) + 6px); }
  .top { top: calc(env(safe-area-inset-top, 0px) + 46px); }
  .badge { font-size: 11px; }
  .title { font-size: clamp(22px, 7.2vw, 30px); }
  .mid { top: auto; bottom: calc(env(safe-area-inset-bottom, 0px) + 77px); width: min(353px, calc(100vw - 40px)); }
  .result { min-height: 24px; font-size: 16px; }
  .result.long { font-size: 14px; }
  .cta { width: 100%; height: 44px; font-size: 17px; margin-top: 6px; }
  .phonebar { display: grid; position: absolute; left: 0; right: 0; bottom: 0; height: calc(env(safe-area-inset-bottom, 0px) + 65px); grid-template-columns: repeat(5, 1fr); align-items: start; padding-top: 10px; background: linear-gradient(180deg, rgba(14,11,7,.97), rgba(6,5,3,.98)); border-top: 1px solid rgba(241,195,90,.55); pointer-events: auto; }
  .phonebar a { text-align: center; font: 700 10px/1 var(--num); letter-spacing: .14em; text-transform: uppercase; color: var(--muted); text-decoration: none; display: grid; gap: 5px; justify-items: center; }
  .phonebar a svg { display: block; }
  .phonebar a.on { color: var(--gold); }
  .tools { bottom: 140px; }
}
@media (max-width: 899px) and (max-height: 600px) { .top { top: calc(env(safe-area-inset-top, 0px) + 40px); } .title { font-size: 22px; } .mid { bottom: calc(env(safe-area-inset-bottom, 0px) + 70px); } .result { min-height: 22px; font-size: 15px; } .cta { height: 40px; } .phonebar { height: calc(env(safe-area-inset-bottom, 0px) + 58px); } }
@media (max-width: 899px) and (orientation: landscape) { .top { top: 8px; } .mid { bottom: 12px; } .phonebar { display: none; } }
/* r87 Team G embed (?embed=1): the game's own frame wraps the page; mock site chrome off, the sound switch stays */
body.embed .bar, body.embed .pchips, body.embed .pgear, body.embed .phonebar { display: none !important; }
body.embed .tools { display: flex; bottom: auto; top: calc(env(safe-area-inset-top, 0px) + 12px); left: auto; right: max(12px, env(safe-area-inset-right, 0px)); transform: none; }
body.embed .tools > :not(#sound) { display: none; }
body.embed .top { top: calc(env(safe-area-inset-top, 0px) + 16px); }
body.embed .mid { top: auto; bottom: calc(env(safe-area-inset-bottom, 0px) + 96px); }
/* Polish RR-1: on a laptop the bottom panel is 24 + 72 px (+ border) tall, so the button stands clear above it */
@media (min-width: 900px) { body.embed .mid { bottom: calc(env(safe-area-inset-bottom, 0px) + 110px); } }
/* phone portrait: the title starts below the sound switch (it covered the CAREER MODE SHOWDOWN 17 plate at 390px) */
@media (max-width: 899px) and (orientation: portrait) { body.embed .top { top: calc(env(safe-area-inset-top, 0px) + 54px); } }
</style>
</head>
<body>
<div id="stage" aria-hidden="true"></div>
<div class="hud">
  <div class="bar"><span class="cm">CM17</span><nav><a href="#">Home</a><a href="#" class="on">Career</a><a href="#">Standings</a><a href="#">Stats</a><a href="#">Rules</a></nav>
    <div class="chips"><span class="chip" id="chipWho">Daniel</span><span class="chip">Season 1 / 1</span><span class="gear">⚙</span></div></div>
  <div class="pchips"><span class="chip" id="pchipWho">Daniel</span><span class="chip">Season 1 / 1</span></div><span class="gear pgear" style="display:none">⚙</span>
  <div class="top"><div class="kicker"><span class="badge">Career Mode Showdown 17</span></div><div class="title" data-t="Russian Roster Roulette"><span>Russian Roster Roulette</span></div></div>
  <div class="mid"><div class="result" id="result" aria-live="polite">One bullet. Seven chambers.</div><button class="cta" id="cta" type="button">Spin the cylinder</button></div>
  <div class="bottom">
    <div class="slot dan"><em>01</em><b>Daniel</b><span id="slotD" class="wait">At the table</span></div>
    <div class="slot nik"><em>02</em><b>Nik</b><span id="slotN" class="wait">Waits</span></div>
  </div>
  <div class="tools">
    <button type="button" id="sound" aria-pressed="false">Sound: off</button>
    <button type="button" id="forceFire">Force shot</button>
    <button type="button" id="forceSafe">Force click</button>
    <button type="button" id="reset">Reset</button>
    <select id="pickD" aria-label="Daniel's club"></select>
    <select id="pickN" aria-label="Nik's club"></select>
  </div>
  <nav class="phonebar"><a href="#"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9h13v-9"/></svg>Home</a><a href="#" class="on"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M7 6H4a3 3 0 0 0 3 3M17 6h3a3 3 0 0 1-3 3"/><path d="M12 13v4M8 20h8M10 17h4v3"/></svg>Career</a><a href="#"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>Standings</a><a href="#"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 20V11M11 20V5M17 20v-7"/><path d="M3 20h18"/></svg>Stats</a><a href="#"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h6M9 16h6"/></svg>Rules</a></nav>
</div>
<div class="toast" id="toast">Preview only</div>
<div class="sr" aria-live="polite" id="live"></div>

<script>/* preview only: show any error on screen instead of a black page; in the game (?embed=1) the error goes to the game (r87 Team G) */
(function(){ var EMBED=/[?&]embed=1(?:&|$)/.test(location.search); function show(m){ if(EMBED){ try{ parent.postMessage({type:"cms-rr-error",message:String(m).slice(0,300)},location.origin); }catch(e){} return; } try{ var d=document.getElementById('errbox'); if(!d){ d=document.createElement('div'); d.id='errbox'; d.style.cssText='position:fixed;left:12px;right:12px;top:12px;z-index:99;background:#300;color:#fff;font:13px/1.4 monospace;padding:10px;border:1px solid #f66;white-space:pre-wrap'; (document.body||document.documentElement).appendChild(d); } d.textContent+=m+'\n'; }catch(e){} }
 // Codex R87-C2-03: a failed optional stylesheet (the Google title/stamp fonts, offline or blocked) only falls back to a
 // local font; it must never abort the scene. Script, WebGL and setup failures still report.
 window.addEventListener('error',function(e){ if(e&&e.target&&e.target.tagName==='LINK') return; show('Error: '+(e.message||e.type)+(e.filename?' @'+e.filename.split('/').pop()+':'+e.lineno:'')+(e.target&&e.target.src?' '+e.target.src:'')); },true);
 window.addEventListener('unhandledrejection',function(e){ show('Error: '+(e.reason&&e.reason.message||e.reason)); });
 setTimeout(function(){ if(!window.THREE) show('3D library did not load (three.js). Check the connection and reload.'); },8000); })();</script>
<script src="vendor/three-r128.min.js"></script><!-- three.js r128 (MIT, vendor/THREE_LICENSE.txt), bundled so the scene works offline and never depends on a CDN -->
<script>
(function(){
"use strict";
// r87 (Team G): a browser without WebGL (switched off, old GPU, some headless runs) cannot draw the stage. Say so once
// instead of letting three.js throw: in the game the result and the release still show without the scene.
if(!(function(){ try{ var c=document.createElement("canvas"); return !!(window.WebGLRenderingContext&&(c.getContext("webgl2")||c.getContext("webgl"))); }catch(e){ return false; } })()){
  if(/[?&]embed=1(?:&|$)/.test(location.search)){ try{ parent.postMessage({type:"cms-rr-error",message:"WebGL is not available"},location.origin); }catch(e){} }
  else document.body.insertAdjacentText("beforeend","This browser can't draw the 3D revolver (WebGL is off).");
  return;
}
const T=THREE, $=(id)=>document.getElementById(id), qs=new URLSearchParams(location.search);
const REDUCED=matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp01=(x)=>x<0?0:x>1?1:x, lerp=(a,b,k)=>a+(b-a)*k, S=(at,dur,tt)=>clamp01((tt-at)/dur);
const ease={ out:(k)=>1-Math.pow(1-k,3), inOut:(k)=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2, in:(k)=>k*k*k, back:(k)=>{ const c=1.70158; return 1+(c+1)*Math.pow(k-1,3)+c*Math.pow(k-1,2); } };
/* seeded random so a replay with ?seed= is repeatable */
let seed=(+qs.get("seed")||Math.floor(Math.random()*1e9))>>>0; const rnd=()=>{ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; };
const LAYOUT={ danielClub: qs.get("d")||"Manchester United", nikClub: qs.get("n")||"Real Madrid" };

/* ================= renderer ================= */
const stage=$("stage");
const renderer=new T.WebGLRenderer({antialias:true, powerPreference:"high-performance"});
renderer.outputEncoding=T.sRGBEncoding; renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFSoftShadowMap; renderer.physicallyCorrectLights=false;
stage.appendChild(renderer.domElement);
const scene=new T.Scene(); scene.background=new T.Color(0x07050a); scene.fog=new T.FogExp2(0x0a0705,.075);
const camera=new T.PerspectiveCamera(38,1,.05,60);
/* THE HAND (ticket 1854): a painted gloved hand holding the revolver, cut out on black, rides on the camera as a layer in the shooter's view. The person sits in the dark: no face, no body. */
let handHold=false, handK=0, handRecoil=0, handSide=-1, handAspect=16/9, hasHand=false, handAimAt=null; const HAND_MUZZLE={u:.22,v:.70}, HAND_REAR={u:.41,v:.79};
const hand=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({transparent:true, depthTest:false, depthWrite:false, toneMapped:false, opacity:0})); hand.renderOrder=20; hand.frustumCulled=false; camera.add(hand);
function keyOutBlack(img){ const c=document.createElement("canvas"); c.width=img.width; c.height=img.height; const x=c.getContext("2d"); x.drawImage(img,0,0); const d=x.getImageData(0,0,c.width,c.height), a=d.data; let hasAlpha=false; for(let i=3;i<a.length;i+=4*97){ if(a[i]<250){ hasAlpha=true; break; } }
  if(!hasAlpha){ for(let i=0;i<a.length;i+=4){ const m=Math.max(a[i],a[i+1],a[i+2]); a[i+3]=m<7?0:m<22?Math.round((m-7)/15*255):255; } x.putImageData(d,0,0); } return c; }
function placeHand(){ const fh=2*Math.tan(camera.fov*Math.PI/360), fw=fh*camera.aspect; const ph=fh*(PH?.56:.68)*(handAimAt?AIM_SCALE():1), pw=ph*handAspect; hand.scale.set(pw*handSide,ph,1);
  const lift=(1-handK)*ph*1.1; const rx=handRecoil; const low=PH&&handAimAt?fh*.13:0; /* r87 polish: on the phone the aimed hand sits lower, so the muzzle stays under the board instead of across the squad */ hand.position.set(handSide*(fw/2-pw*.40)+rx*handSide*.01, -fh/2+ph*.42-lift-low+rx*.025, -1);
  hand.rotation.z=handAim(fw,fh,pw,ph)*Math.min(1,handK)+handSide*rx*.16; hand.material.opacity=handK>0?Math.min(1,handK*3):0; }
/* r87 (Nik 2026-10-30: "gun should face the board it's shooting"): while a turn aims, the hand sits a little smaller in its
   corner, so the muzzle is below and beside the board instead of in the middle of the frame, and the picture turns about its
   centre until the line from the cylinder (HAND_REAR) through the muzzle runs through the target (projected onto the hand's
   plane, z -1). A few passes, because the turn moves the muzzle too; clamped so the wrist stays natural. */
/* phones: the frame is narrow and the barrel long, so the hand is smaller and may turn further (the barrel rises toward the board) */
const AIM_SCALE=()=>PH?.6:.8, AIM_MAX=()=>PH?1.0:.38;
function handAim(fw,fh,pw,ph){ if(!handAimAt) return 0; camera.updateMatrixWorld(); const n=handAimAt.clone().project(camera); if(!(n.z<1)) return 0;
  const tx=n.x*fw/2, ty=n.y*fh/2, px=hand.position.x, py=hand.position.y, sx=pw*handSide;
  const mx=(HAND_MUZZLE.u-.5)*sx, my=(HAND_MUZZLE.v-.5)*ph, bx=mx-(HAND_REAR.u-.5)*sx, by=my-(HAND_REAR.v-.5)*ph, base=Math.atan2(by,bx);
  let th=0; for(let i=0;i<5;i++){ const c=Math.cos(th), s=Math.sin(th); const qx=px+mx*c-my*s, qy=py+mx*s+my*c; th=Math.atan2(ty-qy,tx-qx)-base; th=Math.atan2(Math.sin(th),Math.cos(th)); th=Math.max(-AIM_MAX(),Math.min(AIM_MAX(),th)); }
  return th; }
function handMuzzleWorld(){ const v=new T.Vector3((HAND_MUZZLE.u-.5),(HAND_MUZZLE.v-.5),0); return hand.localToWorld(v); }
function handPlaceholder(){ const c=document.createElement("canvas"); c.width=1600; c.height=900; const x=c.getContext("2d"); x.clearRect(0,0,1600,900);
  x.fillStyle="#2a1d14"; x.beginPath(); x.moveTo(1600,900); x.lineTo(1600,420); x.quadraticCurveTo(1180,380,980,470); x.quadraticCurveTo(900,520,960,600); x.lineTo(1100,900); x.closePath(); x.fill();
  x.fillStyle="#1b1b1f"; x.save(); x.translate(980,470); x.rotate(-.42); x.fillRect(-620,-22,700,44); x.fillRect(40,-70,120,140); x.restore();
  x.fillStyle="#8a6a2a"; x.save(); x.translate(1040,560); x.rotate(-.42); x.fillRect(-10,0,70,120); x.restore();
  x.font="700 46px 'Barlow Condensed'"; x.fillStyle="rgba(255,255,255,.85)"; x.textAlign="center"; x.fillText("HAND PICTURE · TICKET 1854",1150,860); return c; }
const L=(hex)=>new T.Color(hex).convertSRGBToLinear();
const portrait=()=>innerWidth<=899&&innerHeight>innerWidth;

/* ================= canvas textures (wood, felt, lacquered panels, marble, pressed tin, soft sprites) ================= */
function cv(w,h){ const c=document.createElement("canvas"); c.width=w; c.height=h; return [c,c.getContext("2d")]; }
function grain(ctx,w,h,a){ const img=ctx.getImageData(0,0,w,h), d=img.data; for(let i=0;i<d.length;i+=4){ const n=(Math.random()-.5)*a; d[i]+=n; d[i+1]+=n; d[i+2]+=n; } ctx.putImageData(img,0,0); }
/* plank wood: staggered boards per row, each with its own tone, long figured grain, a dark bevelled gap and a thin lit edge */
function woodTex(w,h,base,dark,planks,rep,opts){ const o=opts||{}; const [c,ctx]=cv(w,h); ctx.fillStyle=base; ctx.fillRect(0,0,w,h);
  const ph=h/planks, bl=o.boardLen||w; for(let p=0;p<planks;p++){ const y0=p*ph; let x=-Math.random()*bl*.8;
    while(x<w){ const len=bl*(.7+Math.random()*.6), tone=(Math.random()-.5)*(o.vary||.16); ctx.fillStyle=tone>0?`rgba(255,205,150,${tone})`:`rgba(0,0,0,${-tone*1.6})`; ctx.fillRect(x,y0,len,ph);
      const off=Math.random()*900; for(let i=0;i<(o.lines||60);i++){ const y=y0+Math.random()*ph; ctx.strokeStyle=`rgba(${Math.random()<.5?"0,0,0":"255,215,165"},${.05+Math.random()*.12})`; ctx.lineWidth=.6+Math.random()*2.2; ctx.beginPath(); for(let xx=x;xx<=x+len;xx+=18){ ctx.lineTo(xx,y+Math.sin((xx+off)*.011)*5+Math.sin((xx+off)*.031)*2.4); } ctx.stroke(); }
      if(len<w){ ctx.fillStyle=dark; ctx.fillRect(x+len-2,y0,3,ph); ctx.fillStyle="rgba(255,225,180,.1)"; ctx.fillRect(x+len+1,y0,1,ph); } x+=len; }
    ctx.fillStyle=dark; ctx.fillRect(0,y0,w,3); ctx.fillStyle="rgba(255,230,190,.14)"; ctx.fillRect(0,y0+3,w,1); ctx.fillStyle="rgba(0,0,0,.22)"; ctx.fillRect(0,y0+ph-2,w,2); }
  grain(ctx,w,h,o.grain||24); const t=new T.CanvasTexture(c); t.wrapS=t.wrapT=T.RepeatWrapping; t.repeat.set(rep[0],rep[1]); t.encoding=T.sRGBEncoding; t.anisotropy=8; return t; }
function feltTex(){ const [c,ctx]=cv(1024,1024); const g=ctx.createRadialGradient(512,512,60,512,512,620); g.addColorStop(0,"#2a6a3c"); g.addColorStop(.55,"#1b4f2d"); g.addColorStop(1,"#0e2c1b"); ctx.fillStyle=g; ctx.fillRect(0,0,1024,1024);
  ctx.globalAlpha=.06; for(let i=0;i<1024;i+=2){ ctx.fillStyle=i%4?"#fff":"#000"; ctx.fillRect(i,0,1,1024); ctx.fillRect(0,i,1024,1); } ctx.globalAlpha=1; grain(ctx,1024,1024,26);
  const t=new T.CanvasTexture(c); t.encoding=T.sRGBEncoding; t.anisotropy=8; return t; }
/* dark lacquered mahogany with two tall raised panels, stepped mouldings, a beaded gold frame, carved quatrefoil corners and a medallion */
function panelTex(){ const w=1024,h=1024,[c,ctx]=cv(w,h); const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,"#26130a"); g.addColorStop(.5,"#30190d"); g.addColorStop(1,"#1f0f07"); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  for(let i=0;i<220;i++){ ctx.strokeStyle=`rgba(${Math.random()<.5?"0,0,0":"175,105,55"},${.025+Math.random()*.05})`; ctx.lineWidth=1+Math.random()*3; const x=Math.random()*w; ctx.beginPath(); ctx.moveTo(x,0); ctx.bezierCurveTo(x+Math.random()*24-12,h*.3,x+Math.random()*24-12,h*.7,x,h); ctx.stroke(); }
  const leaf=(cx,cy,r)=>{ ctx.fillStyle="#b8902e"; for(let a=0;a<4;a++){ ctx.beginPath(); ctx.ellipse(cx+Math.cos(a*Math.PI/2)*r*.55,cy+Math.sin(a*Math.PI/2)*r*.55,r*.58,r*.3,a*Math.PI/2,0,7); ctx.fill(); } ctx.fillStyle="#f1d784"; for(let a=0;a<4;a++){ ctx.beginPath(); ctx.ellipse(cx+Math.cos(a*Math.PI/2)*r*.5,cy+Math.sin(a*Math.PI/2)*r*.5,r*.3,r*.12,a*Math.PI/2,0,7); ctx.fill(); } ctx.fillStyle="#fff3c4"; ctx.beginPath(); ctx.arc(cx,cy,r*.2,0,7); ctx.fill(); };
  const cols=2; for(let i=0;i<cols;i++){ const x=52+i*(w/cols), y=60, pw=w/cols-104, ph=h-120;
    ctx.fillStyle="rgba(0,0,0,.38)"; ctx.fillRect(x,y,pw,ph); const f=ctx.createLinearGradient(x,y,x+pw,y+ph); f.addColorStop(0,"rgba(255,185,115,.14)"); f.addColorStop(1,"rgba(0,0,0,.2)"); ctx.fillStyle=f; ctx.fillRect(x+36,y+36,pw-72,ph-72);
    ctx.strokeStyle="rgba(255,210,150,.25)"; ctx.lineWidth=3; ctx.strokeRect(x+18,y+18,pw-36,ph-36); ctx.strokeStyle="rgba(0,0,0,.65)"; ctx.lineWidth=3; ctx.strokeRect(x+24,y+24,pw-48,ph-48);
    ctx.strokeStyle="#5a3c10"; ctx.lineWidth=10; ctx.strokeRect(x+31,y+31,pw-62,ph-62); ctx.strokeStyle="#d6a646"; ctx.lineWidth=5; ctx.strokeRect(x+30,y+30,pw-60,ph-60); ctx.strokeStyle="#fff0bf"; ctx.lineWidth=1.5; ctx.strokeRect(x+29,y+29,pw-58,ph-58);
    ctx.fillStyle="#efcb6c"; for(let k=0;k<=14;k++){ const t=k/14; [[x+30+t*(pw-60),y+30],[x+30+t*(pw-60),y+ph-30]].forEach(([cx,cy])=>{ ctx.beginPath(); ctx.arc(cx,cy,4.2,0,7); ctx.fill(); }); } for(let k=0;k<=26;k++){ const t=k/26; [[x+30,y+30+t*(ph-60)],[x+pw-30,y+30+t*(ph-60)]].forEach(([cx,cy])=>{ ctx.beginPath(); ctx.arc(cx,cy,4.2,0,7); ctx.fill(); }); }
    [[x+66,y+66],[x+pw-66,y+66],[x+66,y+ph-66],[x+pw-66,y+ph-66]].forEach(([cx,cy])=>leaf(cx,cy,24)); leaf(x+pw/2,y+ph/2,52); ctx.strokeStyle="rgba(236,196,110,.55)"; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(x+pw/2,y+ph/2,78,0,7); ctx.stroke(); ctx.strokeStyle="rgba(0,0,0,.5)"; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(x+pw/2,y+ph/2,84,0,7); ctx.stroke(); }
  const sh=ctx.createLinearGradient(0,0,w,h); sh.addColorStop(0,"rgba(255,230,190,.08)"); sh.addColorStop(.5,"rgba(255,230,190,0)"); sh.addColorStop(1,"rgba(255,230,190,.05)"); ctx.fillStyle=sh; ctx.fillRect(0,0,w,h);
  grain(ctx,w,h,14); const t=new T.CanvasTexture(c); t.wrapS=t.wrapT=T.RepeatWrapping; t.encoding=T.sRGBEncoding; t.anisotropy=8; return t; }
/* cream marble with grey and warm veins */
/* floor marble: cream slabs with strong grey veins and a few warm ones, like the cafe picture's floor */
function floorMarbleTex(){ const w=2048,h=2048,[c,ctx]=cv(w,h); ctx.fillStyle="#e6dfd3"; ctx.fillRect(0,0,w,h);
  for(let i=0;i<40;i++){ ctx.fillStyle=`rgba(${205+Math.random()*25},${195+Math.random()*25},${180+Math.random()*25},${.25+Math.random()*.3})`; ctx.beginPath(); ctx.ellipse(Math.random()*w,Math.random()*h,150+Math.random()*500,80+Math.random()*300,Math.random()*3,0,7); ctx.fill(); }
  const vein=(col,n,wid,len)=>{ for(let i=0;i<n;i++){ ctx.strokeStyle=col(); ctx.lineWidth=wid(); let x=Math.random()*w, y=Math.random()*h; ctx.beginPath(); ctx.moveTo(x,y); let a=Math.random()*6.28; for(let k=0;k<len;k++){ a+=(Math.random()-.5)*1.1; x+=Math.cos(a)*(30+Math.random()*60); y+=Math.sin(a)*(30+Math.random()*60); ctx.lineTo(x,y); } ctx.stroke(); } };
  vein(()=>`rgba(90,88,92,${.18+Math.random()*.3})`,26,()=>1.5+Math.random()*4,18);
  vein(()=>`rgba(120,118,124,${.1+Math.random()*.2})`,70,()=>.5+Math.random()*1.5,10);
  vein(()=>`rgba(170,140,90,${.08+Math.random()*.14})`,14,()=>1+Math.random()*2,12);
  grain(ctx,w,h,6); const t=new T.CanvasTexture(c); t.wrapS=t.wrapT=T.RepeatWrapping; t.encoding=T.sRGBEncoding; t.anisotropy=16; return t; }
function marbleTex(){ const w=512,h=512,[c,ctx]=cv(w,h); ctx.fillStyle="#e8e0d2"; ctx.fillRect(0,0,w,h);
  for(let i=0;i<34;i++){ const warm=Math.random()<.35; ctx.strokeStyle=warm?`rgba(190,160,110,${.15+Math.random()*.2})`:`rgba(80,78,84,${.1+Math.random()*.22})`; ctx.lineWidth=.6+Math.random()*2.4; const x=Math.random()*w, y=Math.random()*h; ctx.beginPath(); ctx.moveTo(x,y); ctx.bezierCurveTo(x+Math.random()*300-150,y+Math.random()*300-150,x+Math.random()*300-150,y+Math.random()*300-150,x+Math.random()*400-200,y+Math.random()*400-200); ctx.stroke(); }
  for(let i=0;i<8;i++){ ctx.fillStyle=`rgba(200,190,170,${.1+Math.random()*.15})`; ctx.beginPath(); ctx.ellipse(Math.random()*w,Math.random()*h,40+Math.random()*120,20+Math.random()*60,Math.random()*3,0,7); ctx.fill(); }
  grain(ctx,w,h,8); const t=new T.CanvasTexture(c); t.wrapS=t.wrapT=T.RepeatWrapping; t.encoding=T.sRGBEncoding; t.anisotropy=8; return t; }
/* pressed-tin coffers: a grid of recessed squares with a gold fillet and a stamped rosette */
function ceilingTex(){ const w=1024,h=1024,[c,ctx]=cv(w,h); ctx.fillStyle="#1d130c"; ctx.fillRect(0,0,w,h); const n=4, s=w/n;
  for(let i=0;i<n;i++) for(let j=0;j<n;j++){ const x=i*s, y=j*s; ctx.fillStyle="#140d08"; ctx.fillRect(x+34,y+34,s-68,s-68); ctx.strokeStyle="#8a6a2c"; ctx.lineWidth=5; ctx.strokeRect(x+26,y+26,s-52,s-52); ctx.strokeStyle="#3a2a14"; ctx.lineWidth=2; ctx.strokeRect(x+40,y+40,s-80,s-80);
    const cx=x+s/2, cy=y+s/2; for(let r=18;r<70;r+=16){ ctx.strokeStyle=`rgba(150,115,55,${.5-r*.004})`; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(cx,cy,r,0,7); ctx.stroke(); } ctx.fillStyle="#9c7a34"; for(let k=0;k<8;k++){ const a=k/8*Math.PI*2; ctx.beginPath(); ctx.ellipse(cx+Math.cos(a)*48,cy+Math.sin(a)*48,16,7,a,0,7); ctx.fill(); } ctx.fillStyle="#c9a24a"; ctx.beginPath(); ctx.arc(cx,cy,9,0,7); ctx.fill(); }
  grain(ctx,w,h,14); const t=new T.CanvasTexture(c); t.wrapS=t.wrapT=T.RepeatWrapping; t.repeat.set(5,4); t.encoding=T.sRGBEncoding; t.anisotropy=4; return t; }
/* warm lamp glass: amber at the burner fading to cream at the lip */
function lampGlassTex(){ const [c,ctx]=cv(32,128); const g=ctx.createLinearGradient(0,128,0,0); g.addColorStop(0,"#ff9a3a"); g.addColorStop(.45,"#ffcf8a"); g.addColorStop(1,"#fff2d8"); ctx.fillStyle=g; ctx.fillRect(0,0,32,128); const t=new T.CanvasTexture(c); t.encoding=T.sRGBEncoding; return t; }
function softTex(stops){ const [c,ctx]=cv(128,128); const g=ctx.createRadialGradient(64,64,0,64,64,64); stops.forEach(([k,col])=>g.addColorStop(k,col)); ctx.fillStyle=g; ctx.fillRect(0,0,128,128); const t=new T.CanvasTexture(c); t.encoding=T.sRGBEncoding; return t; }
function flashTex(){ const [c,ctx]=cv(256,256); ctx.translate(128,128); const g=ctx.createRadialGradient(0,0,0,0,0,128); g.addColorStop(0,"rgba(255,255,255,1)"); g.addColorStop(.18,"rgba(255,240,180,.95)"); g.addColorStop(.42,"rgba(255,160,60,.55)"); g.addColorStop(1,"rgba(255,90,20,0)"); ctx.fillStyle=g; ctx.fillRect(-128,-128,256,256);
  ctx.globalCompositeOperation="lighter"; for(let i=0;i<9;i++){ const a=i/9*Math.PI*2+Math.random()*.4, l=60+Math.random()*68; ctx.strokeStyle="rgba(255,230,160,.9)"; ctx.lineWidth=2+Math.random()*4; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*l,Math.sin(a)*l); ctx.stroke(); }
  const t=new T.CanvasTexture(c); t.encoding=T.sRGBEncoding; return t; }
const smokeT=softTex([[0,"rgba(255,255,255,.55)"],[.4,"rgba(255,255,255,.25)"],[1,"rgba(255,255,255,0)"]]);
const glowT=softTex([[0,"rgba(255,235,190,1)"],[.3,"rgba(255,190,90,.6)"],[1,"rgba(255,120,30,0)"]]);
/* a real lamp flame: blue root, white-yellow body, orange tip, soft edge */
function flameTex(){ const [c,ctx]=cv(128,256); const g=ctx.createRadialGradient(64,150,4,64,140,90); g.addColorStop(0,"rgba(255,255,245,1)"); g.addColorStop(.25,"rgba(255,236,160,.95)"); g.addColorStop(.55,"rgba(255,160,50,.55)"); g.addColorStop(1,"rgba(255,90,10,0)");
  ctx.save(); ctx.translate(64,128); ctx.scale(.42,1); ctx.translate(-64,-128); ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(64,10); ctx.bezierCurveTo(120,90,118,190,64,236); ctx.bezierCurveTo(10,190,8,90,64,10); ctx.fill(); ctx.restore();
  const b=ctx.createRadialGradient(64,214,2,64,214,26); b.addColorStop(0,"rgba(120,170,255,.8)"); b.addColorStop(1,"rgba(60,90,255,0)"); ctx.fillStyle=b; ctx.fillRect(0,180,128,76);
  const t=new T.CanvasTexture(c); t.encoding=T.sRGBEncoding; return t; }
function sparkTex(){ const [c,ctx]=cv(64,64); const g=ctx.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,"rgba(255,255,255,1)"); g.addColorStop(.3,"rgba(255,220,150,.9)"); g.addColorStop(1,"rgba(255,140,40,0)"); ctx.fillStyle=g; ctx.fillRect(0,0,64,64); const t=new T.CanvasTexture(c); t.encoding=T.sRGBEncoding; return t; }
function petalTex(){ const [c,ctx]=cv(256,256); ctx.translate(128,128);
  for(let i=0;i<7;i++){ const a=i/7*Math.PI*2+rnd()*.5, l=72+rnd()*54, w=14+rnd()*16; const g=ctx.createLinearGradient(0,0,Math.cos(a)*l,Math.sin(a)*l); g.addColorStop(0,"rgba(255,246,220,1)"); g.addColorStop(.45,"rgba(255,170,60,1)"); g.addColorStop(.8,"rgba(230,80,20,.7)"); g.addColorStop(1,"rgba(200,50,10,0)"); ctx.fillStyle=g;
    ctx.beginPath(); ctx.moveTo(Math.cos(a+Math.PI/2)*w*.5,Math.sin(a+Math.PI/2)*w*.5); ctx.lineTo(Math.cos(a)*l,Math.sin(a)*l); ctx.lineTo(Math.cos(a-Math.PI/2)*w*.5,Math.sin(a-Math.PI/2)*w*.5); ctx.closePath(); ctx.fill(); }
  const g=ctx.createRadialGradient(0,0,0,0,0,46); g.addColorStop(0,"rgba(255,255,250,1)"); g.addColorStop(.6,"rgba(255,220,150,1)"); g.addColorStop(1,"rgba(255,150,50,0)"); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,46,0,7); ctx.fill();
  const t=new T.CanvasTexture(c); t.encoding=T.sRGBEncoding; return t; }
const dustT=softTex([[0,"rgba(255,240,200,1)"],[.5,"rgba(255,240,200,.3)"],[1,"rgba(255,240,200,0)"]]);

/* ================= materials ================= */
const floorTex=woodTex(2048,2048,"#46250f","#120803",16,[3.5,3.5],{boardLen:900,vary:.22,lines:40,grain:18});
const tableWoodTex=woodTex(1024,1024,"#4a2a12","#1c0e05",3,[2,1]);
const gripTex=woodTex(256,256,"#6b3a1b","#2a1406",2,[1,1]);
const clothTex=(()=>{ const [c,ctx]=cv(256,256); ctx.fillStyle='#808080'; ctx.fillRect(0,0,256,256); for(let i=0;i<256;i+=3){ ctx.fillStyle=i%6?'rgba(255,255,255,.25)':'rgba(0,0,0,.25)'; ctx.fillRect(i,0,1,256); ctx.fillRect(0,i,256,1); } grain(ctx,256,256,60); const t=new T.CanvasTexture(c); t.wrapS=t.wrapT=T.RepeatWrapping; t.repeat.set(6,6); return t; })();
/* black marble wall panels with gold inlay and walnut rails, to match Nik's marble cafe picture (29 Oct) */
function marblePanelTex(){ const w=1024,h=1024,[c,ctx]=cv(w,h); ctx.fillStyle="#2a1810"; ctx.fillRect(0,0,w,h);
  const wg=ctx.createLinearGradient(0,0,0,h); wg.addColorStop(0,"#3a2415"); wg.addColorStop(.5,"#2b1a0f"); wg.addColorStop(1,"#20120a"); ctx.fillStyle=wg; ctx.fillRect(0,0,w,h);
  for(let i=0;i<900;i++){ ctx.fillStyle=`rgba(0,0,0,${Math.random()*.12})`; ctx.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*3,2+Math.random()*60); }
  const px=70,py=70,pw=w-140,ph=h-140; ctx.fillStyle="#0b0b0e"; ctx.fillRect(px,py,pw,ph);
  for(let i=0;i<34;i++){ ctx.strokeStyle=`rgba(${150+Math.random()*80},${150+Math.random()*70},${150+Math.random()*60},${.08+Math.random()*.28})`; ctx.lineWidth=.6+Math.random()*2.2; ctx.beginPath(); let x=px+Math.random()*pw, y=py+Math.random()*ph; ctx.moveTo(x,y); for(let k=0;k<7;k++){ x+=(Math.random()-.5)*300; y+=(Math.random()-.5)*300; ctx.lineTo(Math.min(px+pw,Math.max(px,x)),Math.min(py+ph,Math.max(py,y))); } ctx.stroke(); }
  const sh=ctx.createLinearGradient(px,py,px+pw,py+ph); sh.addColorStop(0,"rgba(255,255,255,.06)"); sh.addColorStop(.5,"rgba(255,255,255,0)"); sh.addColorStop(1,"rgba(255,255,255,.05)"); ctx.fillStyle=sh; ctx.fillRect(px,py,pw,ph);
  ctx.strokeStyle="#d9b25a"; ctx.lineWidth=5; ctx.strokeRect(px+22,py+22,pw-44,ph-44); ctx.strokeStyle="#8a6a22"; ctx.lineWidth=2; ctx.strokeRect(px+34,py+34,pw-68,ph-68);
  ctx.strokeStyle="#b48a3a"; ctx.lineWidth=4; ctx.strokeRect(px-6,py-6,pw+12,ph+12);
  const t=new T.CanvasTexture(c); t.wrapS=t.wrapT=T.RepeatWrapping; t.encoding=T.sRGBEncoding; t.anisotropy=8; return t; }
const wallTex=marblePanelTex(); wallTex.repeat.set(7,2); wallTex.offset.y=-.476; /* a panel row seam lands on the dado rail at y=1.1 */
const lampTex=lampGlassTex();
const M={
  floor:new T.MeshPhysicalMaterial({map:(()=>{ const t=floorMarbleTex(); t.repeat.set(2.5,2.5); return t; })(), roughness:.08, metalness:0, color:0xf2ece2, clearcoat:1, clearcoatRoughness:.03, reflectivity:1}),   /* cream marble floor, the website's marble look */
  wall:new T.MeshPhysicalMaterial({map:wallTex, roughness:.22, metalness:.05, color:0xffffff, clearcoat:.8, clearcoatRoughness:.12}),
  darkWood:new T.MeshPhysicalMaterial({map:tableWoodTex, roughness:.32, metalness:.05, color:0x6e4a32, clearcoat:.7, clearcoatRoughness:.2}),
  lacquer:new T.MeshPhysicalMaterial({map:tableWoodTex, roughness:.26, metalness:.06, color:0x3e2416, clearcoat:.95, clearcoatRoughness:.14}),
  lacquerHi:new T.MeshPhysicalMaterial({map:tableWoodTex, roughness:.3, metalness:.06, color:0x6a3c26, clearcoat:.9, clearcoatRoughness:.18}),
  felt:new T.MeshStandardMaterial({map:feltTex(), roughness:.96, metalness:0, color:0x7c9c7a}),
  brass:new T.MeshStandardMaterial({color:L("#c99c46"), roughness:.26, metalness:1}),
  brassDark:new T.MeshStandardMaterial({color:L("#6f4e1c"), roughness:.4, metalness:1}),
  gold:new T.MeshPhysicalMaterial({color:L("#e6bd5e"), roughness:.2, metalness:1, clearcoat:.5, clearcoatRoughness:.2}),
  steel:new T.MeshStandardMaterial({color:L("#aab0b8"), roughness:.28, metalness:1}),
  blued:new T.MeshStandardMaterial({color:L("#3a4150"), roughness:.42, metalness:.95}),
  gunmetal:new T.MeshStandardMaterial({color:L("#55595f"), roughness:.36, metalness:1}),
  bore:new T.MeshStandardMaterial({color:0x030303, roughness:.9, metalness:.3}),
  grip:new T.MeshStandardMaterial({map:gripTex, roughness:.45, metalness:.05, color:0x9a6a40}),
  coat:new T.MeshStandardMaterial({color:L("#1d1611"), roughness:.95, metalness:0, bumpMap:clothTex, bumpScale:.0025}),
  coatLight:new T.MeshStandardMaterial({color:L("#3b2c20"), roughness:.9, bumpMap:clothTex, bumpScale:.002}),
  hat:new T.MeshStandardMaterial({color:L("#241a12"), roughness:.9}),
  skin:new T.MeshStandardMaterial({color:L("#3b2418"), roughness:1}),
  glove:new T.MeshStandardMaterial({color:L("#3d2316"), roughness:.7}),
  shirt:new T.MeshStandardMaterial({color:L("#d9c7a0"), roughness:.9}),
  scarf:new T.MeshStandardMaterial({color:L("#4a1612"), roughness:.95}),
  velvet:new T.MeshStandardMaterial({color:L("#5c161c"), roughness:.96, metalness:0, bumpMap:clothTex, bumpScale:.002}),
  marble:new T.MeshPhysicalMaterial({map:marbleTex(), roughness:.16, metalness:0, clearcoat:1, clearcoatRoughness:.05}),
  mirror:new T.MeshPhysicalMaterial({color:L("#e2e8ee"), roughness:.02, metalness:1}),
  ceiling:new T.MeshStandardMaterial({map:ceilingTex(), roughness:.55, metalness:.45}),
  porcelain:new T.MeshPhysicalMaterial({color:L("#f4ede2"), roughness:.22, metalness:0, clearcoat:1, clearcoatRoughness:.08}),
  coffee:new T.MeshPhysicalMaterial({color:L("#1d0e05"), roughness:.06, metalness:0, clearcoat:1, clearcoatRoughness:.04}),
  amber:new T.MeshPhysicalMaterial({color:L("#b5560f"), roughness:.1, metalness:0, transparent:true, opacity:.85, clearcoat:1}),
  glass:new T.MeshPhysicalMaterial({color:0xfff2dc, roughness:.02, metalness:0, transparent:true, opacity:.22, clearcoat:1, clearcoatRoughness:.02, reflectivity:1, side:T.DoubleSide, depthWrite:false}),
  card:new T.MeshStandardMaterial({color:L("#eee4c8"), roughness:.8}),
  black:new T.MeshStandardMaterial({color:0x050505, roughness:1}),
  lampGlass:new T.MeshStandardMaterial({map:lampTex, emissiveMap:lampTex, emissive:0xffffff, emissiveIntensity:1.05, roughness:.35, side:T.DoubleSide})
};

/* ================= room (full 3D fallback; RR_ROOM.jpg replaces the back wall when it exists) ================= */
const room=new T.Group(); scene.add(room);
function mesh(g,m,x,y,z,parent){ const o=new T.Mesh(g,m); o.position.set(x||0,y||0,z||0); (parent||room).add(o); return o; }
function lathe(pts,seg){ return new T.LatheGeometry(pts.map(p=>new T.Vector2(p[0],p[1])),seg||24); }
/* many small parts of one material become one mesh (one draw call): parts are [geometry, x,y,z, rx,ry,rz, sx,sy,sz] */
function merged(parts,mat,parent){ const pos=[],nor=[],uv=[]; const m=new T.Matrix4(), q=new T.Quaternion(), e=new T.Euler(), v=new T.Vector3(), s=new T.Vector3();
  parts.forEach(([g,x,y,z,rx,ry,rz,sx,sy,sz])=>{ const ng=g.index?g.toNonIndexed():g; m.compose(v.set(x||0,y||0,z||0),q.setFromEuler(e.set(rx||0,ry||0,rz||0)),s.set(sx||1,sy||1,sz||1)); ng.applyMatrix4(m); const P=ng.attributes.position.array,N=ng.attributes.normal.array,U=ng.attributes.uv.array; for(let i=0;i<P.length;i++) pos.push(P[i]); for(let i=0;i<N.length;i++) nor.push(N[i]); for(let i=0;i<U.length;i++) uv.push(U[i]); });
  const geo=new T.BufferGeometry(); geo.setAttribute('position',new T.Float32BufferAttribute(pos,3)); geo.setAttribute('normal',new T.Float32BufferAttribute(nor,3)); geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2)); const o=new T.Mesh(geo,mat); (parent||room).add(o); return o; }
const haloM=new T.SpriteMaterial({map:glowT, blending:T.AdditiveBlending, depthWrite:false, transparent:true, color:0xffa850, opacity:.5});
{ const floor=mesh(new T.PlaneGeometry(14,14),M.floor,0,0,0); floor.rotation.x=-Math.PI/2; floor.receiveShadow=true;
  /* inlay border: a black marble band with a thin gold line, framing the table area as in the cafe picture */
  { const bm=new T.MeshPhysicalMaterial({color:0x0c0c10, roughness:.12, clearcoat:1, clearcoatRoughness:.04}); const gm=new T.MeshPhysicalMaterial({color:L("#d6b25a"), metalness:1, roughness:.25, clearcoat:.6});
    const W=5.6, D=4.6, bw=.09; [[0,D/2,W,bw],[0,-D/2,W,bw],[W/2,0,bw,D],[-W/2,0,bw,D]].forEach(([x,z,sx,sz])=>{ const b=mesh(new T.PlaneGeometry(sx,sz),bm,x,.002,z); b.rotation.x=-Math.PI/2; const g=mesh(new T.PlaneGeometry(sx>sz?sx:.014,sx>sz?.014:sz),gm,x+(sx>sz?0:(x>0?-.07:.07)),.003,z+(sx>sz?(z>0?-.07:.07):0)); g.rotation.x=-Math.PI/2; }); }
  const back=mesh(new T.PlaneGeometry(14,4.2),M.wall,0,2.1,-4.2); back.name="backWall";
  const sideM=M.wall.clone(); sideM.map=wallTex.clone(); sideM.map.needsUpdate=true; sideM.map.repeat.set(5,2); sideM.map.offset.y=wallTex.offset.y;
  const left=mesh(new T.PlaneGeometry(10,4.2),sideM,-5,2.1,0); left.rotation.y=Math.PI/2;
  const right=mesh(new T.PlaneGeometry(10,4.2),sideM,5,2.1,0); right.rotation.y=-Math.PI/2;
  const LQ=[], GD=[], BR=[], GL=[], VL=[], MB=[], PC=[], BD=[]; /* lacquer, gold, brass, lamp glass, velvet, marble, porcelain, dark brass part lists */
  /* coffered ceiling: pressed tin between dark lacquered beams with a gold fillet, and a cornice */
  const ceil=mesh(new T.PlaneGeometry(14,10),M.ceiling,0,4.2,0); ceil.rotation.x=Math.PI/2;
  for(let i=-2;i<=2;i++){ LQ.push([new T.BoxGeometry(.18,.18,10),i*2.8,4.11,0]); GD.push([new T.BoxGeometry(.2,.012,10),i*2.8,4.02,0]); }
  for(let j=-1;j<=1;j++){ LQ.push([new T.BoxGeometry(14,.18,.18),0,4.11,j*2.5]); GD.push([new T.BoxGeometry(14,.012,.2),0,4.02,j*2.5]); }
  LQ.push([new T.BoxGeometry(14,.22,.12),0,4.09,-4.14]); GD.push([new T.BoxGeometry(14,.02,.13),0,3.98,-4.14]);
  /* wainscot: a dado of raised lacquered panels, each with a beaded gold frame and a carved rosette; moulded rail with two gold lines; skirting */
  function dado(cx,cz,ry,len){ const rot=new T.Matrix4().makeRotationY(ry), P=(x,y,z)=>{ const v=new T.Vector3(x,y,z).applyMatrix4(rot); return [v.x+cx,v.y,v.z+cz]; };
    const put=(list,g,x,y,z,ex,ey,ez)=>{ const p=P(x,y,z); list.push([g,p[0],p[1],p[2],ex||0,ry+(ey||0),ez||0]); };
    put(LQ,new T.BoxGeometry(len,.98,.03),0,.6,0); put(LQ,new T.BoxGeometry(len,.14,.07),0,.07,.02); put(LQ,new T.BoxGeometry(len,.08,.09),0,1.1,.025); put(BR,new T.BoxGeometry(len,.008,.095),0,1.065,.028); put(BR,new T.BoxGeometry(len,.008,.095),0,1.135,.028);
    const n=Math.round(len/1.05), pw=len/n; for(let i=0;i<n;i++){ const x=-len/2+pw*(i+.5), fw=pw-.22; put(LQ,new T.BoxGeometry(fw,.64,.03),x,.6,.02);
      put(GD,new T.BoxGeometry(fw,.014,.03),x,.92,.03); put(GD,new T.BoxGeometry(fw,.014,.03),x,.28,.03); put(GD,new T.BoxGeometry(.014,.654,.03),x-fw/2,.6,.03); put(GD,new T.BoxGeometry(.014,.654,.03),x+fw/2,.6,.03);
      if(ry===0){ put(GD,new T.TorusGeometry(.06,.011,4,12),x,.6,.038); put(GD,new T.SphereGeometry(.022,6,4),x,.6,.04); }
      if(ry===0) [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>put(GD,new T.SphereGeometry(.014,5,3),x+a*fw/2,.6+b*.32,.04)); } }
  dado(0,-4.18,0,14); dado(-4.98,0,Math.PI/2,10); dado(4.98,0,-Math.PI/2,10);
  /* balcony: carved fascia with a gold bead, turned balusters, a brass-capped rail, four turned columns with gold rings and capitals (none in the centre, so the mirror shows) */
  const BZ=-3.5, BY=2.6; LQ.push([new T.BoxGeometry(10.4,.26,.62),0,BY-.1,BZ-.3]); GD.push([new T.BoxGeometry(10.4,.016,.03),0,BY-.2,BZ+.01]); GD.push([new T.BoxGeometry(10.4,.016,.03),0,BY-.02,BZ+.01]);
  LQ.push([new T.BoxGeometry(10.4,.07,.16),0,BY+.42,BZ]); GD.push([new T.BoxGeometry(10.4,.012,.17),0,BY+.455,BZ]);
  const balG=lathe([[.012,0],[.03,.02],[.034,.05],[.016,.09],[.02,.2],[.03,.27],[.028,.33],[.016,.38],[.014,.4]],7); for(let i=-17;i<=17;i++){ if(Math.abs(Math.abs(i*.3)-1.2)<.05||Math.abs(Math.abs(i*.3)-3.6)<.05) continue; LQ.push([balG,i*.3,BY,BZ]); }
  const colG=lathe([[.12,0],[.12,.07],[.095,.09],[.085,.14],[.085,2.3],[.1,2.4],[.125,2.52],[.13,2.6]],16), capG=new T.BoxGeometry(.32,.07,.32);
  [-3.6,-1.2,1.2,3.6].forEach(x=>{ LQ.push([colG,x,0,BZ+.1]); LQ.push([capG,x,BY-.03,BZ+.1]); GD.push([new T.TorusGeometry(.1,.012,5,16),x,.1,BZ+.1,Math.PI/2]); GD.push([new T.TorusGeometry(.095,.012,5,16),x,2.32,BZ+.1,Math.PI/2]); GD.push([new T.TorusGeometry(.125,.012,5,16),x,2.56,BZ+.1,Math.PI/2]);
    LQ.push([new T.BoxGeometry(.11,.46,.11),x,BY+.23,BZ]); GD.push([new T.SphereGeometry(.05,10,8),x,BY+.52,BZ]); });
  /* gold-framed mirror on the back wall: layered gold frame, a crest and corner bosses, smoked glass that reflects the lamps */
  { const mx=0, my=1.98, mz=-4.17, mw=1.46, mh=1.06, t=.085; GD.push([new T.BoxGeometry(mw,t,.06),mx,my+mh/2,mz]); GD.push([new T.BoxGeometry(mw,t,.06),mx,my-mh/2,mz]); GD.push([new T.BoxGeometry(t,mh,.06),mx-mw/2,my,mz]); GD.push([new T.BoxGeometry(t,mh,.06),mx+mw/2,my,mz]);
    GD.push([new T.BoxGeometry(mw-.12,.025,.07),mx,my+mh/2-.06,mz]); GD.push([new T.BoxGeometry(mw-.12,.025,.07),mx,my-mh/2+.06,mz]); GD.push([new T.BoxGeometry(.025,mh-.12,.07),mx-mw/2+.06,my,mz]); GD.push([new T.BoxGeometry(.025,mh-.12,.07),mx+mw/2-.06,my,mz]);
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>GD.push([new T.SphereGeometry(.05,10,8),mx+a*mw/2,my+b*mh/2,mz+.03]));
    GD.push([new T.TorusGeometry(.2,.03,8,24,Math.PI),mx,my+mh/2+.03,mz,0,0,0]); GD.push([new T.SphereGeometry(.06,10,8),mx,my+mh/2+.26,mz]); [[-.3,.09],[.3,.09]].forEach(([dx,dy])=>GD.push([new T.SphereGeometry(.035,8,6),mx+dx,my+mh/2+dy,mz]));
    mesh(new T.PlaneGeometry(mw-.1,mh-.1),M.mirror,mx,my,mz+.005); mesh(new T.PlaneGeometry(mw+.02,mh+.02),M.black,mx,my,mz-.02); }
  /* glass lamps: brass backplate and arm, a tulip glass shade with a warm gradient, a soft halo; rows on the back wall and the side walls */
  const shadeG=lathe([[.022,0],[.03,.012],[.026,.05],[.04,.11],[.066,.165],[.072,.19]],12), galleryG=lathe([[0,0],[.03,0],[.034,.012],[.024,.02],[.024,.04],[.03,.045],[0,.045]],10);
  function wallLamp(x,y,z,ry){ const rot=new T.Matrix4().makeRotationY(ry), P=(a,b,c)=>{ const v=new T.Vector3(a,b,c).applyMatrix4(rot); return [v.x+x,v.y+y,v.z+z]; };
    let p=P(0,0,0); BD.push([new T.BoxGeometry(.1,.28,.03),p[0],p[1],p[2],0,ry]); p=P(0,.1,.02); GD.push([new T.SphereGeometry(.018,6,4),p[0],p[1],p[2]]); p=P(0,-.1,.02); GD.push([new T.SphereGeometry(.018,6,4),p[0],p[1],p[2]]);
    p=P(0,.06,.09); BR.push([new T.CylinderGeometry(.011,.011,.22,6),p[0],p[1],p[2],.956,ry,0]); p=P(0,.13,.17); BR.push([galleryG,p[0],p[1],p[2],0,ry,0]); p=P(0,.165,.17); GL.push([shadeG,p[0],p[1],p[2]]);
    p=P(0,.26,.19); const h=new T.Sprite(haloM); h.scale.set(.62,.62,1); h.position.set(p[0],p[1],p[2]); room.add(h); }
  [-6.4,-4.8,-3.2,-1.6,1.6,3.2,4.8,6.4].forEach(x=>wallLamp(x,1.72,-4.12,0));
  [[-4.92,1.72,-1.2,Math.PI/2],[-4.92,1.72,.6,Math.PI/2],[-4.92,1.72,2.4,Math.PI/2],[4.92,1.72,-3,-Math.PI/2],[4.92,1.72,-1.2,-Math.PI/2],[4.92,1.72,.6,-Math.PI/2],[4.92,1.72,2.4,-Math.PI/2]].forEach(a=>wallLamp(...a));
  /* chandelier over the table: brass crown and chain, six arms with tulip shades and halos; one warm point light under it */
  { const cy=2.72; BR.push([new T.CylinderGeometry(.012,.012,4.2-cy-.2,8),0,(4.2+cy+.2)/2,0]); BR.push([lathe([[0,0],[.08,0],[.1,.03],[.06,.08],[.05,.16],[.09,.2],[.11,.22],[.05,.28],[.0,.3]],14),0,cy-.06,0]); GD.push([new T.TorusGeometry(.11,.014,6,20),0,cy+.14,0,Math.PI/2]);
    for(let i=0;i<6;i++){ const a=i/6*Math.PI*2, r=.42; BR.push([new T.TorusGeometry(.24,.012,4,8,Math.PI/2),Math.cos(a)*.2,cy-.1,Math.sin(a)*.2,Math.PI/2,-a,0]); BR.push([galleryG,Math.cos(a)*r,cy+.08,Math.sin(a)*r]); GL.push([shadeG,Math.cos(a)*r,cy+.11,Math.sin(a)*r]); GD.push([new T.SphereGeometry(.02,6,4),Math.cos(a)*r,cy+.06,Math.sin(a)*r]);
      const h=new T.Sprite(haloM); h.scale.set(.5,.5,1); h.position.set(Math.cos(a)*r,cy+.2,Math.sin(a)*r); room.add(h); }
    const chand=new T.PointLight(L("#ffc27c"),.55,5.5,2); chand.position.set(0,cy+.1,0); scene.add(chand); }
  /* café tables deeper in the room: marble tops on brass pedestals, bentwood chairs with velvet seats */
  function chair(x,z,ry){ const rot=new T.Matrix4().makeRotationY(ry), P=(a,b,c)=>{ const v=new T.Vector3(a,b,c).applyMatrix4(rot); return [v.x+x,v.y+b,v.z+z]; }; const put=(list,g,a,b,c,rx,rz)=>{ const p=P(a,b,c); list.push([g,p[0],p[1],p[2],rx||0,ry,rz||0]); };
    put(LQ,new T.BoxGeometry(.46,.05,.46),0,.44,0); put(VL,new T.BoxGeometry(.4,.045,.4),0,.49,0); put(LQ,new T.BoxGeometry(.44,.06,.04),0,.98,-.21); put(LQ,new T.BoxGeometry(.44,.05,.035),0,.72,-.21); put(VL,new T.BoxGeometry(.4,.2,.03),0,.85,-.21);
    [[-.2,-.2],[.2,-.2],[-.2,.2],[.2,.2]].forEach(([a,b])=>put(LQ,new T.CylinderGeometry(.018,.024,.44,6),a,.22,b)); [-.2,.2].forEach(a=>put(LQ,new T.CylinderGeometry(.016,.018,.55,6),a,.72,-.21)); }
  function cafeTable(x,z){ MB.push([new T.CylinderGeometry(.48,.48,.035,28),x,.745,z]); GD.push([new T.TorusGeometry(.48,.012,4,36),x,.745,z,Math.PI/2]); BR.push([lathe([[0,0],[.3,0],[.32,.02],[.2,.05],[.06,.1],[.045,.6],[.07,.66],[.12,.7],[.0,.72]],14),x,0,z]);
    GL.push([lathe([[.0,0],[.035,0],[.04,.02],[.03,.07],[.045,.13],[.05,.16]],12),x+.15,.763,z-.1]); }
  cafeTable(-3.2,-2.2); chair(-3.2,-2.85,0); chair(-3.9,-2.2,Math.PI/2); chair(-2.55,-2.2,-Math.PI/2); cafeTable(3.3,-2.3); chair(3.3,-2.95,0); chair(4,-2.3,-Math.PI/2); chair(2.6,-2.3,Math.PI/2);
  /* a carved buffet on the right with a marble top, a brass samovar, cups and a decanter */
  { const bx=2.7, bz=-3.88; LQ.push([new T.BoxGeometry(2.3,.92,.52),bx,.46,bz]); MB.push([new T.BoxGeometry(2.4,.04,.6),bx,.94,bz+.02]); GD.push([new T.BoxGeometry(2.3,.014,.54),bx,.915,bz]); for(let i=0;i<3;i++){ const px=bx-.75+i*.75; LQ.push([new T.BoxGeometry(.6,.6,.03),px,.5,bz+.27]); GD.push([new T.BoxGeometry(.6,.012,.035),px,.8,bz+.275]); GD.push([new T.BoxGeometry(.6,.012,.035),px,.2,bz+.275]); GD.push([new T.BoxGeometry(.012,.6,.035),px-.3,.5,bz+.275]); GD.push([new T.BoxGeometry(.012,.6,.035),px+.3,.5,bz+.275]); GD.push([new T.SphereGeometry(.02,8,6),px,.5,bz+.29]); }
    [-1.05,1.05].forEach(dx=>{ LQ.push([new T.CylinderGeometry(.04,.05,.1,10),bx+dx,.05,bz+.2]); });
    BR.push([lathe([[0,0],[.12,0],[.13,.02],[.09,.04],[.07,.08],[.17,.16],[.2,.3],[.17,.44],[.1,.5],[.05,.52],[.05,.58],[.02,.6],[0,.6]],16),bx-.6,.96,bz,0,0,0,.68,.68,.68]); BR.push([new T.CylinderGeometry(.009,.009,.08,6),bx-.6,1.06,bz+.12,Math.PI/2]); GD.push([new T.SphereGeometry(.02,8,6),bx-.6,1.38,bz]);
    for(let i=0;i<5;i++) PC.push([lathe([[0,0],[.03,0],[.04,.03],[.042,.06],[.04,.062],[.028,.062],[.028,.01],[0,.01]],14),bx+.05+i*.14,.96,bz+.02]);
    GL.push([lathe([[0,0],[.06,0],[.07,.03],[.05,.13],[.02,.17],[.02,.23],[.03,.25],[0,.25]],14),bx+.85,.96,bz]); mesh(new T.CylinderGeometry(.045,.055,.1,12),M.amber,bx+.85,1.02,bz); }
  /* a tall window on the left with evening light, velvet drapes and a gold pelmet */
  const win=mesh(new T.PlaneGeometry(1.1,2.2),new T.MeshStandardMaterial({color:L("#ffd9a0"), emissive:L("#ff9a40"), emissiveIntensity:.9}),-4.9,2.1,-2.6); win.rotation.y=Math.PI/2;
  LQ.push([new T.BoxGeometry(.04,2.3,.07),-4.88,2.1,-2.6]); LQ.push([new T.BoxGeometry(.04,.07,1.2),-4.88,2.1,-2.6]); LQ.push([new T.BoxGeometry(.04,2.34,1.24),-4.95,2.1,-2.6]);
  [-.78,.78].forEach(dz=>VL.push([new T.BoxGeometry(.14,2.9,.36),-4.86,1.9,-2.6+dz])); GD.push([new T.BoxGeometry(.16,.18,2.0),-4.86,3.38,-2.6]); GD.push([new T.BoxGeometry(.1,.04,2.0),-4.84,3.26,-2.6]);
  /* one mesh per material for all the parts above */
  const lq=merged(LQ,M.lacquer); lq.receiveShadow=true; merged(GD,M.gold); merged(BR,M.brass); merged(BD,M.brassDark); merged(GL,M.lampGlass); merged(VL,M.velvet); merged(MB,M.marble); merged(PC,M.porcelain);
}
/* the dealer's table: round, green felt, lacquered mahogany rim with a gold inlay, turned pedestal */
const table=new T.Group(); scene.add(table);
{ const R=.78; const top=mesh(new T.CylinderGeometry(R-.06,R-.06,.03,96),M.felt,0,.735,0,table); top.receiveShadow=true;
  const mahog=new T.MeshPhysicalMaterial({map:tableWoodTex, color:0x5e2a1a, roughness:.16, metalness:.05, clearcoat:1, clearcoatRoughness:.05});
  /* rim: an ogee moulding turned from a profile (r,y), two gold beads and a gold inlay line on the felt side */
  const rimProf=[[R-.065,.735],[R-.06,.752],[R-.04,.76],[R-.015,.762],[R+.005,.755],[R+.015,.74],[R+.018,.72],[R+.012,.70],[R,.69],[R-.02,.685],[R-.06,.682],[R-.065,.735]];
  const rim=mesh(new T.LatheGeometry(rimProf.map(q=>new T.Vector2(q[0],q[1])),128),mahog,0,0,0,table); rim.castShadow=true; rim.receiveShadow=true;
  mesh(new T.TorusGeometry(R-.058,.004,8,128),M.gold,0,.751,0,table).rotation.x=Math.PI/2; mesh(new T.TorusGeometry(R+.006,.005,8,128),M.gold,0,.757,0,table).rotation.x=Math.PI/2; mesh(new T.TorusGeometry(R+.004,.006,8,128),M.gold,0,.693,0,table).rotation.x=Math.PI/2;
  const apron=mesh(new T.CylinderGeometry(R-.01,R-.03,.07,96),mahog,0,.65,0,table); apron.receiveShadow=true; mesh(new T.TorusGeometry(R-.03,.006,8,128),M.gold,0,.617,0,table).rotation.x=Math.PI/2;
  /* pedestal: black marble column with brass collars on a stepped black-marble base with gold feet */
  const bmarble=new T.MeshPhysicalMaterial({color:0x111116, roughness:.12, metalness:0, clearcoat:1, clearcoatRoughness:.04});
  mesh(lathe([[0,.1],[.12,.1],[.13,.14],[.1,.2],[.09,.38],[.1,.52],[.13,.58],[.15,.615],[0,.615]],48),bmarble,0,0,0,table);
  [.11,.2,.5].forEach((y,i)=>{ const r=i===1?.098:i?.115:.128; const t=mesh(new T.TorusGeometry(r,.012,10,64),M.brass,0,y,0,table); t.rotation.x=Math.PI/2; });
  mesh(lathe([[0,0],[.5,0],[.52,.02],[.5,.045],[.34,.06],[.2,.08],[.15,.1],[0,.1]],64),bmarble,0,0,0,table).receiveShadow=true; mesh(new T.TorusGeometry(.5,.012,8,96),M.gold,0,.03,0,table).rotation.x=Math.PI/2;
  for(let i=0;i<4;i++){ const a=i/4*Math.PI*2+Math.PI/4; const f=mesh(lathe([[0,0],[.06,0],[.07,.02],[.05,.05],[.02,.07],[0,.07]],24),M.gold,Math.cos(a)*.47,0,Math.sin(a)*.47,table); f.castShadow=true; }
  /* lantern: a period brass oil lamp. fluted foot, knopped stem, oil font with a seam, burner with a wick knob, tall glass chimney, living flame */
  const lan=new T.Group(); lan.position.set(-.38,.75,.36); table.add(lan); /* r87: front of the table, off both shooting lines, so it never stands between the gun and a board; r87 polish: further out to the left, so from the wide shot it no longer stands in front of the revolver */
  const foot=lathe([[0,0],[.085,0],[.09,.012],[.082,.02],[.06,.028],[.042,.04],[.03,.06],[.026,.09],[.034,.1],[.024,.108],[.022,.13],[.03,.14],[.028,.15]],48); mesh(foot,M.brass,0,0,0,lan).castShadow=true;
  for(let i=0;i<16;i++){ const a=i/16*Math.PI*2; const fl=mesh(new T.CylinderGeometry(.005,.007,.03,10),M.gold,Math.cos(a)*.07,.012,Math.sin(a)*.07,lan); fl.rotation.y=-a; fl.rotation.z=Math.PI/2-.9; }
  const font=lathe([[.028,.15],[.05,.158],[.07,.18],[.076,.21],[.07,.24],[.052,.262],[.03,.27],[.026,.285],[.03,.295],[.022,.3]],48); mesh(font,M.brass,0,0,0,lan).castShadow=true;
  for(let i=0;i<24;i++){ const a=i/24*Math.PI*2; const rib=mesh(new T.BoxGeometry(.004,.05,.004),M.gold,Math.cos(a)*.0745,.21,Math.sin(a)*.0745,lan); rib.rotation.y=-a; }   /* fluted font */
  mesh(new T.TorusGeometry(.03,.0025,8,32),M.gold,0,.152,0,lan).rotation.x=Math.PI/2; mesh(new T.TorusGeometry(.0865,.003,8,48),M.gold,0,.015,0,lan).rotation.x=Math.PI/2;
  mesh(new T.TorusGeometry(.0755,.004,8,48),M.gold,0,.21,0,lan).rotation.x=Math.PI/2;
  const burner=lathe([[.022,.3],[.032,.302],[.036,.315],[.03,.325],[.04,.33],[.045,.342],[.036,.35],[.012,.352],[.012,.36],[0,.36]],32); mesh(burner,M.brassDark||M.brass,0,0,0,lan);
  const knob=mesh(new T.CylinderGeometry(.012,.012,.006,20),M.gold,.05,.322,0,lan); knob.rotation.z=Math.PI/2; mesh(new T.CylinderGeometry(.003,.003,.04,8),M.gold,.03,.322,0,lan).rotation.z=Math.PI/2;
  for(let i=0;i<4;i++){ const a=i/4*Math.PI*2; mesh(new T.BoxGeometry(.004,.03,.004),M.brass,Math.cos(a)*.034,.37,Math.sin(a)*.034,lan); }
  const chimney=lathe([[.034,.35],[.04,.38],[.05,.43],[.054,.49],[.046,.56],[.034,.62],[.03,.66]],48); const ch=mesh(chimney,M.glass,0,0,0,lan); ch.renderOrder=5;
  mesh(new T.TorusGeometry(.0335,.004,8,32),M.brass,0,.352,0,lan).rotation.x=Math.PI/2; mesh(new T.TorusGeometry(.031,.003,8,32),M.gold,0,.66,0,lan).rotation.x=Math.PI/2;
  mesh(new T.BoxGeometry(.016,.03,.002),M.black,0,.368,0,lan);
  const flame=new T.Sprite(new T.SpriteMaterial({map:flameTex(), blending:T.AdditiveBlending, depthWrite:false, transparent:true, color:0xffffff})); flame.scale.set(.09,.19,1); flame.position.set(0,.445,0); flame.renderOrder=6; lan.add(flame);
  const halo=new T.Sprite(new T.SpriteMaterial({map:glowT, blending:T.AdditiveBlending, depthWrite:false, transparent:true, color:0xff9a40, opacity:.3})); halo.scale.set(.42,.5,1); halo.position.set(0,.44,0); halo.renderOrder=6; lan.add(halo);
  const core=new T.Sprite(new T.SpriteMaterial({map:glowT, blending:T.AdditiveBlending, depthWrite:false, transparent:true, color:0xffffff})); core.scale.set(.024,.05,1); core.position.set(0,.405,0); core.renderOrder=6; lan.add(core);
  const lantern=new T.PointLight(L("#ffb15a"),1.85,6,2); lantern.position.set(0,.43,0); lan.add(lantern);
  table.userData={flame,halo,lantern};
  /* coffee pot: tall pewter-brass body with a belly, a domed hinged lid with a finial, a gooseneck spout and a looped handle */
  { const pg=new T.Group(); pg.position.set(.04,.75,-.6); pg.rotation.y=-.5; table.add(pg); /* r87: back of the table, off both shooting lines; r87 polish: nearer the middle, so in Nik's phone shot it no longer stands over the corner of his board */
    const body=lathe([[0,0],[.062,0],[.07,.008],[.072,.03],[.066,.07],[.054,.11],[.046,.15],[.045,.18],[.05,.196],[.058,.204],[.056,.212],[.03,.216],[.03,.222],[.04,.236],[.03,.25],[.012,.258],[0,.26]],56); const bm=mesh(body,M.brass,0,0,0,pg); bm.castShadow=true;
    mesh(new T.TorusGeometry(.057,.003,8,48),M.gold,0,.208,0,pg).rotation.x=Math.PI/2; mesh(new T.TorusGeometry(.069,.004,8,48),M.gold,0,.012,0,pg).rotation.x=Math.PI/2;
    mesh(new T.TorusGeometry(.0665,.0025,8,64),M.gold,0,.06,0,pg).rotation.x=Math.PI/2; mesh(new T.TorusGeometry(.0555,.0025,8,64),M.gold,0,.105,0,pg).rotation.x=Math.PI/2; for(let i=0;i<18;i++){ const a=i/18*Math.PI*2; const fl=mesh(new T.CylinderGeometry(.0035,.0045,.04,8),M.gold,Math.cos(a)*.0665,.085,Math.sin(a)*.0665,pg); fl.rotation.y=-a; }   /* engraved band + flutes */
    mesh(new T.SphereGeometry(.009,16,12),M.gold,0,.262,0,pg);
    const spout=new T.CatmullRomCurve3([new T.Vector3(.055,.09,0),new T.Vector3(.1,.12,0),new T.Vector3(.125,.19,0),new T.Vector3(.132,.25,0),new T.Vector3(.146,.27,0)]);
    const sp=new T.Mesh(new T.TubeGeometry(spout,24,.011,14,false),M.brass); sp.castShadow=true; pg.add(sp); mesh(new T.CylinderGeometry(.012,.009,.006,14),M.brass,.146,.27,0,pg).rotation.z=-.6;
    const hcurve=new T.CatmullRomCurve3([new T.Vector3(-.05,.19,0),new T.Vector3(-.095,.2,0),new T.Vector3(-.11,.14,0),new T.Vector3(-.09,.07,0),new T.Vector3(-.058,.05,0)]);
    const hd=new T.Mesh(new T.TubeGeometry(hcurve,20,.008,12,false),M.brassDark||M.brass); hd.castShadow=true; pg.add(hd);
    mesh(new T.CylinderGeometry(.011,.011,.03,12),M.brass,-.052,.19,0,pg).rotation.z=Math.PI/2; mesh(new T.CylinderGeometry(.011,.011,.03,12),M.brass,-.06,.05,0,pg).rotation.z=Math.PI/2; }
  /* cups: thin bone-china on a dished saucer, gold rims, a looped handle, dark coffee with a bright meniscus */
  function cup(x,z,ry){ const g=new T.Group(); g.position.set(x,.75,z); g.rotation.y=ry; table.add(g);
    const saucer=lathe([[0,0],[.03,0],[.03,.004],[.045,.006],[.072,.016],[.078,.02],[.077,.023],[.07,.021],[.044,.012],[.03,.01],[0,.01]],48); const sm=mesh(saucer,M.porcelain,0,0,0,g); sm.castShadow=true; sm.receiveShadow=true;
    mesh(new T.TorusGeometry(.0745,.0012,6,48),M.gold,0,.021,0,g).rotation.x=Math.PI/2;
    const body=lathe([[0,.01],[.022,.01],[.026,.012],[.03,.02],[.04,.04],[.044,.058],[.045,.068],[.043,.069],[.041,.066],[.038,.05],[.03,.03],[.022,.02],[0,.02]],48); const cm=mesh(body,M.porcelain,0,.01,0,g); cm.castShadow=true;
    mesh(new T.TorusGeometry(.0445,.0012,6,48),M.gold,0,.078,0,g).rotation.x=Math.PI/2; mesh(new T.TorusGeometry(.0432,.0012,6,48),M.gold,0,.064,0,g).rotation.x=Math.PI/2; mesh(new T.TorusGeometry(.0445,.0008,6,48),M.gold,0,.074,0,g).rotation.x=Math.PI/2;   /* double gold band */
    mesh(new T.CircleGeometry(.0395,40),M.coffee,0,.072,0,g).rotation.x=-Math.PI/2;
    const hc=new T.CatmullRomCurve3([new T.Vector3(.041,.066,0),new T.Vector3(.062,.066,0),new T.Vector3(.066,.045,0),new T.Vector3(.05,.03,0),new T.Vector3(.04,.03,0)]);
    const hm=new T.Mesh(new T.TubeGeometry(hc,16,.0045,10,false),M.porcelain); hm.castShadow=true; g.add(hm);
    const spoon=mesh(new T.BoxGeometry(.004,.0015,.07),M.gold,.03,.023,.04,g); spoon.rotation.y=.9; mesh(new T.SphereGeometry(.009,12,8),M.gold,.03-.03*Math.sin(.9)*0+.027,.024,.04+.03*0+.025,g).scale.set(1,.3,1.3); }
  cup(.3,.42,.3); cup(.44,.22,-.4);
  for(let i=0;i<5;i++){ const c=mesh(new T.BoxGeometry(.064,.002,.09),M.card,-.5+i*.02,.752+i*.002,.34,table); c.rotation.y=.4+i*.12; }
  for(let i=0;i<4;i++) mesh(new T.CylinderGeometry(.013,.013,.003,16),M.gold,.2+i*.03,.753,.45+(i%2)*.025,table);
}

/* ================= lights (7 in all: key spot with the one shadow map, hemisphere fill, wall glow, window, muzzle flash, lantern, chandelier) ================= */
renderer.toneMappingExposure=1.22; scene.fog=new T.FogExp2(0x120a05,.05);
const key=new T.SpotLight(L("#ffd092"),1.7,10,.52,.55,1.3); key.position.set(.6,3.4,1.8); key.target.position.set(0,.8,.1); scene.add(key,key.target); key.castShadow=true; key.shadow.mapSize.set(2048,2048); key.shadow.bias=-.0004; key.shadow.radius=6;
const fill=new T.HemisphereLight(L("#3a2a1c"),L("#120a06"),.5); scene.add(fill);
const wallGlow=new T.PointLight(L("#ffa65a"),.95,9,2); wallGlow.position.set(0,1.8,-3.0); scene.add(wallGlow);
const winLight=new T.PointLight(L("#ffb070"),.5,8,2); winLight.position.set(-4.2,2.0,-2.4); scene.add(winLight);
const flashLight=new T.PointLight(L("#ffd9a8"),0,7,1.6); scene.add(flashLight);

function capsule(r,len){ const g=new T.CylinderGeometry(r,r,len,14,1,true); const a=new T.SphereGeometry(r,14,8,0,Math.PI*2,0,Math.PI/2); a.translate(0,len/2,0); const b=new T.SphereGeometry(r,14,8,0,Math.PI*2,Math.PI/2,Math.PI/2); b.translate(0,-len/2,0); const m=new T.BufferGeometry(); const parts=[g,a,b].map(x=>x.toNonIndexed()); const pos=[],nor=[],uv=[]; parts.forEach(x=>{ pos.push(...x.attributes.position.array); nor.push(...x.attributes.normal.array); uv.push(...x.attributes.uv.array); }); m.setAttribute('position',new T.Float32BufferAttribute(pos,3)); m.setAttribute('normal',new T.Float32BufferAttribute(nor,3)); m.setAttribute('uv',new T.Float32BufferAttribute(uv,2)); return m; }
/* ================= the revolver: hero product model (1873 single-action style, 7 chambers) ================= */
/* gun space: +Z = forward along the barrel, +Y = up, +X = the gun's right side. Origin on the cylinder axis. */
const gun=new T.Group();
const cyl=new T.Group(); const crane=new T.Group(); const hammer=new T.Group(); let muzzle=new T.Object3D();
/* side-silhouette helper: shape in (z forward, y up), extruded along X and centred. Material may be [caps+bevels, side walls]. Optional holes: arrays of (z,y) outlines. */
function extrude(points,depth,bevel,m,segs,holes){ const s=new T.Shape(); points.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1])); s.closePath();
  (holes||[]).forEach(h=>{ const p=new T.Path(); h.forEach((q,i)=>i?p.lineTo(q[0],q[1]):p.moveTo(q[0],q[1])); p.closePath(); s.holes.push(p); });
  const g=new T.ExtrudeGeometry(s,{depth, bevelEnabled:bevel>0, bevelThickness:bevel, bevelSize:bevel, bevelSegments:segs||3, curveSegments:12}); g.translate(0,0,-depth/2); g.rotateY(-Math.PI/2); const o=new T.Mesh(g,m); o.castShadow=true; o.receiveShadow=true; return o; }
/* smooth outline helper: Catmull-Rom through the control points */
function smooth(points,n){ const c=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(p[0],p[1],0)),true,"catmullrom",.6); return c.getPoints(n).map(v=>[v.x,v.y]); }
function circlePts(cx,cy,r,n){ const o=[]; for(let i=0;i<n;i++){ const a=i/n*Math.PI*2; o.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]); } return o; }
/* FRAME silhouette (z,y): barrel lug in front, top strap over the cylinder window, recoil shield behind, flat bottom for the brass trigger housing */
const FRAME_BOX=[-.056,-.04,.052,.038];
const framePts=smooth([[.047,-.02],[.048,-.006],[.048,.012],[.047,.025],[.042,.031],[.024,.032],[-.022,.032],[-.038,.0305],[-.046,.026],[-.05,.014],[-.0505,0],[-.049,-.014],[-.045,-.026],[-.037,-.033],[-.02,-.035],[.02,-.035],[.036,-.0325],[.044,-.027]],220);
function rrect(z0,y0,z1,y1,r,n){ const o=[]; [[z1-r,y1-r,0],[z0+r,y1-r,Math.PI/2],[z0+r,y0+r,Math.PI],[z1-r,y0+r,Math.PI*1.5]].forEach(([cx,cy,a0])=>{ for(let i=0;i<=n;i++){ const a=a0+i/n*Math.PI/2; o.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]); } }); return o; }
/* cylinder window: the bevel pulls the walls in by bevelSize, so the shape is cut a touch larger than the cylinder needs */
const windowPts=rrect(-.0315,-.0255,.0295,.0255,.006,8);
/* engraving map in frame space: deep blued steel, gold scrollwork with a shadow cut, an inset border line that follows the real outline, worn bright edges */
function engraveTex(withFrame){ const w=1024,h=1024,[c,ctx]=cv(w,h); const [bx0,by0,bx1,by1]=FRAME_BOX; const px=(p)=>[(p[0]-bx0)/(bx1-bx0)*w,(p[1]-by0)/(by1-by0)*h];
  ctx.fillStyle="#1f2735"; ctx.fillRect(0,0,w,h);
  const g=ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,"rgba(110,130,165,.22)"); g.addColorStop(.5,"rgba(0,0,0,0)"); g.addColorStop(1,"rgba(110,130,165,.16)"); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  grain(ctx,w,h,9);
  function path(pts){ ctx.beginPath(); pts.forEach((p,i)=>{ const q=px(p); i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]); }); ctx.closePath(); }
  /* one scroll: tapered spiral, with a shadow pass so it reads as a cut, plus leaves at the tail */
  function scroll(x,y,r,dir,rot,col){ const steps=46, turns=1.55; for(let pass=0;pass<2;pass++){ ctx.strokeStyle=pass?col:"rgba(0,0,0,.65)"; const off=pass?0:1.6; for(let i=0;i<steps;i++){ const t0=i/steps, t1=(i+1)/steps; const a0=rot+t0*turns*Math.PI*2*dir, a1=rot+t1*turns*Math.PI*2*dir; const r0=r*(1-t0*.9), r1=r*(1-t1*.9); ctx.lineWidth=(3.4-2.6*t0)*(pass?1:1.3); ctx.beginPath(); ctx.moveTo(x+off+Math.cos(a0)*r0,y+off+Math.sin(a0)*r0); ctx.lineTo(x+off+Math.cos(a1)*r1,y+off+Math.sin(a1)*r1); ctx.stroke(); } }
    for(let k=0;k<3;k++){ const a=rot+dir*(.3+k*.55); const bx=x+Math.cos(a)*r*(1-.08*k), by=y+Math.sin(a)*r*(1-.08*k); const la=a+dir*1.35, L=r*.42; for(let pass=0;pass<2;pass++){ ctx.fillStyle=pass?col:"rgba(0,0,0,.6)"; const off=pass?0:1.6; ctx.beginPath(); ctx.moveTo(bx+off,by+off); ctx.quadraticCurveTo(bx+off+Math.cos(la+.5)*L,by+off+Math.sin(la+.5)*L,bx+off+Math.cos(la)*L*1.3,by+off+Math.sin(la)*L*1.3); ctx.quadraticCurveTo(bx+off+Math.cos(la-.4)*L*.8,by+off+Math.sin(la-.4)*L*.8,bx+off,by+off); ctx.fill(); } } }
  function vine(x0,y0,x1,y1,col){ const mx=(x0+x1)/2, my=(y0+y1)/2, dx=x1-x0, dy=y1-y0; for(let pass=0;pass<2;pass++){ ctx.strokeStyle=pass?col:"rgba(0,0,0,.6)"; ctx.lineWidth=pass?2.2:3; const off=pass?0:1.6; ctx.beginPath(); ctx.moveTo(x0+off,y0+off); ctx.bezierCurveTo(mx-dy*.35+off,my+dx*.35+off,mx+dy*.35+off,my-dx*.35+off,x1+off,y1+off); ctx.stroke(); } }
  ctx.lineCap="round"; ctx.lineJoin="round";
  ctx.save(); if(withFrame){ path(framePts); ctx.clip(); }
  /* flowing rows of scrolls, alternating hand, joined by vines; fine stipple background between them */
  ctx.fillStyle="rgba(190,205,230,.07)"; for(let i=0;i<9000;i++){ ctx.fillRect(Math.random()*w,Math.random()*h,1.2,1.2); }
  const cells=[]; const step=withFrame?96:76; for(let y=step*.5;y<h;y+=step){ let k=0; for(let x=step*.5+((y/step|0)%2)*step*.5;x<w;x+=step,k++){ cells.push({x:x+(Math.random()-.5)*14,y:y+(Math.random()-.5)*14,dir:k%2?1:-1,r:step*(.3+Math.random()*.08),rot:Math.random()*Math.PI*2}); } }
  cells.forEach((c,i)=>{ const n=cells[i+1]; if(n&&Math.abs(n.y-c.y)<1) vine(c.x+Math.cos(c.rot)*c.r,c.y+Math.sin(c.rot)*c.r,n.x+Math.cos(n.rot)*n.r,n.y+Math.sin(n.rot)*n.r,"#d9b45a"); });
  cells.forEach(c=>scroll(c.x,c.y,c.r,c.dir,c.rot,"#e7c468"));
  ctx.strokeStyle="rgba(255,240,190,.5)"; ctx.lineWidth=.9; cells.forEach(c=>{ ctx.beginPath(); ctx.arc(c.x,c.y,c.r*.14,0,7); ctx.stroke(); });
  ctx.restore();
  if(withFrame){ /* plain band along the outline, then a gold border line inset ~2.5mm, the same around the cylinder window; worn bright steel right at the edge */
    [[framePts,1],[windowPts,0]].forEach(([pts,outer])=>{ path(pts); ctx.strokeStyle="#1f2735"; ctx.lineWidth=62; ctx.stroke(); ctx.strokeStyle="#e2bf62"; ctx.lineWidth=56; ctx.stroke(); ctx.strokeStyle="#1f2735"; ctx.lineWidth=51; ctx.stroke(); ctx.strokeStyle="rgba(0,0,0,.55)"; ctx.lineWidth=49; ctx.stroke(); ctx.strokeStyle="#1f2735"; ctx.lineWidth=46; ctx.stroke();
      ctx.save(); ctx.filter="blur(5px)"; ctx.strokeStyle="rgba(150,165,190,.55)"; ctx.lineWidth=26; ctx.stroke(); ctx.strokeStyle="rgba(205,215,232,.75)"; ctx.lineWidth=12; ctx.stroke(); ctx.restore(); });
    /* a few honest scratches and a handling-wear patch where the thumb sits over the recoil shield */
    ctx.strokeStyle="rgba(200,210,225,.18)"; ctx.lineWidth=1; for(let i=0;i<60;i++){ const x=Math.random()*w,y=Math.random()*h,a=Math.random()*Math.PI*2,l=10+Math.random()*60; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l); ctx.stroke(); } }
  const t=new T.CanvasTexture(c); t.wrapS=t.wrapT=T.RepeatWrapping; t.encoding=T.sRGBEncoding; t.anisotropy=8; return t; }
function roughTex(){ const w=512,h=512,[c,ctx]=cv(w,h); ctx.fillStyle="#707070"; ctx.fillRect(0,0,w,h); for(let i=0;i<700;i++){ ctx.fillStyle=`rgba(${Math.random()<.5?"255,255,255":"0,0,0"},${.04+Math.random()*.09})`; ctx.fillRect(Math.random()*w,Math.random()*h,3+Math.random()*40,1+Math.random()*2); } grain(ctx,w,h,22); const t=new T.CanvasTexture(c); t.wrapS=t.wrapT=T.RepeatWrapping; return t; }
const engT=engraveTex(true), engBarT=engraveTex(false), rghT=roughTex();
/* shape-space UVs run in metres; this maps a box of the silhouette plane onto a texture once */
function uvFit(tex,x0,y0,x1,y1){ const t=tex.clone(); t.needsUpdate=true; t.repeat.set(1/(x1-x0),1/(y1-y0)); t.offset.set(-x0/(x1-x0),-y0/(y1-y0)); return t; }
const barT=engBarT.clone(); barT.needsUpdate=true; barT.repeat.set(1,2.4);
const GM={
  blued:new T.MeshPhysicalMaterial({color:L("#aab4c6"), map:uvFit(engT,...FRAME_BOX), roughnessMap:uvFit(rghT,...FRAME_BOX), metalness:1, roughness:.34, clearcoat:.7, clearcoatRoughness:.15}),
  bluedBarrel:new T.MeshPhysicalMaterial({color:L("#aab4c6"), map:barT, metalness:1, roughness:.32, clearcoat:.7, clearcoatRoughness:.15}),
  bluedPlain:new T.MeshPhysicalMaterial({color:L("#2a3242"), roughnessMap:rghT, metalness:1, roughness:.3, clearcoat:.6, clearcoatRoughness:.18}),
  worn:new T.MeshPhysicalMaterial({color:L("#6a7384"), roughnessMap:rghT, metalness:.82, roughness:.36, clearcoat:.5, clearcoatRoughness:.2}),
  bright:new T.MeshPhysicalMaterial({color:L("#cfd5de"), metalness:1, roughness:.2, clearcoat:.5}),
  brass:new T.MeshPhysicalMaterial({color:L("#c9a24a"), roughnessMap:rghT, metalness:1, roughness:.24, clearcoat:.6, clearcoatRoughness:.15}),
  gold:new T.MeshPhysicalMaterial({color:L("#e6bf5c"), metalness:1, roughness:.18, clearcoat:.8}),
  walnut:new T.MeshPhysicalMaterial({map:woodTex(256,256,"#5a2e14","#2a1206",1,[2,2]), color:0xb07a50, roughness:.32, clearcoat:.9, clearcoatRoughness:.08}),
  bore:new T.MeshStandardMaterial({color:0x020202, roughness:.95}),
  boreIn:new T.MeshStandardMaterial({color:L("#15181d"), metalness:.7, roughness:.62, side:T.DoubleSide}),
  drum:new T.MeshPhysicalMaterial({color:L("#8f99a8"), metalness:.92, roughness:.26, clearcoat:.7, clearcoatRoughness:.1}),   /* r87 polish: nickel steel like the hand picture's cylinder, not cream */
  drumFace:new T.MeshPhysicalMaterial({color:L("#7e8898"), metalness:.88, roughness:.3, clearcoat:.5}),
  drumGroove:new T.MeshStandardMaterial({color:L("#2a2f38"), metalness:.8, roughness:.5, side:T.DoubleSide}),
  lead:new T.MeshPhysicalMaterial({color:L("#85888c"), metalness:.6, roughness:.52})
};
/* straight prism along +Z from a (x,y) section with flat faces, cylindrical UVs and a cap; every second edge (the chamfers) goes to material 1 */
function prism(section,len,m){ const n=section.length; const pos=[],nor=[],uv=[]; const g=new T.BufferGeometry(); let per=0; const cum=[0]; for(let j=0;j<n;j++){ const a=section[j],b=section[(j+1)%n]; per+=Math.hypot(b[0]-a[0],b[1]-a[1]); cum.push(per); }
  const tri=(p,nn,u)=>{ pos.push(...p); nor.push(...nn); uv.push(...u); };
  for(let j=0;j<n;j++){ const a=section[j],b=section[(j+1)%n]; const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy); const N=[dy/l,-dx/l,0]; const u0=cum[j]/per,u1=cum[j+1]/per;
    tri([a[0],a[1],0, b[0],b[1],0, b[0],b[1],len],[...N,...N,...N],[u0,0,u1,0,u1,1]); tri([a[0],a[1],0, b[0],b[1],len, a[0],a[1],len],[...N,...N,...N],[u0,0,u1,1,u0,1]); }
  const capStart=pos.length/3; for(let j=1;j<n-1;j++){ const a=section[0],b=section[j],c=section[j+1]; tri([a[0],a[1],len, b[0],b[1],len, c[0],c[1],len],[0,0,1,0,0,1,0,0,1],[.5,.5,.5,.5,.5,.5]); }
  g.setAttribute("position",new T.Float32BufferAttribute(pos,3)); g.setAttribute("normal",new T.Float32BufferAttribute(nor,3)); g.setAttribute("uv",new T.Float32BufferAttribute(uv,2));
  for(let j=0;j<n;j++) g.addGroup(j*6,6,j%2?0:1); g.addGroup(capStart,pos.length/3-capStart,1); return new T.Mesh(g,m); }
{ const g=gun;
  /* FRAME: engraved flats, worn edges, round window for the cylinder */
  const frame=extrude(framePts,.020,.0024,[GM.blued,GM.worn],4,[windowPts]); g.add(frame);   /* a real top strap is narrower than the cylinder: the drum shows on both sides of the frame */
  /* rear sight groove along the top strap, and the left-side screws (hammer, bolt, trigger, base-pin catch) */
  { const groove=new T.Mesh(new T.BoxGeometry(.0016,.0008,.03),GM.bore); groove.position.set(0,.0345,-.012); g.add(groove); }
  const screwProf=[[0,0],[.0022,0],[.0027,.0004],[.0022,.0012],[0,.0014]].map(p=>new T.Vector2(p[0],p[1]));
  [[.006,-.041],[-.015,-.03],[-.023,-.01],[.012,.04]].forEach(([y,z])=>[1,-1].forEach(sx=>{ const s=new T.Mesh(new T.LatheGeometry(screwProf,18),GM.bright); s.rotation.z=sx*Math.PI/2; s.position.set(-sx*.0122,y,z); g.add(s); const slot=new T.Mesh(new T.BoxGeometry(.0006,.0005,.0032),GM.bore); slot.rotation.x=.6; slot.position.set(-sx*.0135,y,z); g.add(slot); }));
  /* GRIP FRAME in brass (backstrap + front strap), walnut panels proud of it either side, gold medallions */
  const gripPts=smooth([[-.044,-.012],[-.05,-.028],[-.06,-.05],[-.072,-.072],[-.082,-.092],[-.08,-.105],[-.066,-.109],[-.046,-.106],[-.035,-.093],[-.029,-.072],[-.027,-.05],[-.029,-.036],[-.038,-.03]],100);
  const gripFrame=extrude(gripPts,.0255,.0016,GM.brass,3); g.add(gripFrame);
  const panelPts=smooth([[-.047,-.034],[-.054,-.05],[-.064,-.07],[-.074,-.09],[-.072,-.1],[-.062,-.103],[-.047,-.1],[-.038,-.088],[-.034,-.07],[-.034,-.052],[-.037,-.04]],80);
  [1,-1].forEach(sx=>{ const p=extrude(panelPts,.004,.003,GM.walnut,4); p.position.x=sx*.0138; g.add(p);
    const med=new T.Mesh(new T.LatheGeometry([[0,0],[.0062,0],[.0068,.0004],[.0062,.0009],[0,.0011]].map(q=>new T.Vector2(q[0],q[1])),28),GM.gold); med.rotation.z=-sx*Math.PI/2; med.position.set(sx*.0186,-.071,-.054); g.add(med); });
  /* BARREL: chamfered octagon 5.5", bore on the top chamber's axis, crowned muzzle, blade front sight */
  const BY=.0138, BR=.0097, CH=.0019; const sec=[]; for(let i=0;i<8;i++){ const a=i/8*Math.PI*2+Math.PI/8, a0=(i-1)/8*Math.PI*2+Math.PI/8, a1=(i+1)/8*Math.PI*2+Math.PI/8; const v=[Math.cos(a)*BR,Math.sin(a)*BR], p=[Math.cos(a0)*BR,Math.sin(a0)*BR], q=[Math.cos(a1)*BR,Math.sin(a1)*BR]; const e=Math.hypot(q[0]-v[0],q[1]-v[1]); sec.push([v[0]+(p[0]-v[0])/e*CH,v[1]+(p[1]-v[1])/e*CH],[v[0]+(q[0]-v[0])/e*CH,v[1]+(q[1]-v[1])/e*CH]); }
  { const bar=prism(sec,.147,[GM.bluedBarrel,GM.worn]); bar.position.set(0,BY,.044); bar.castShadow=true; bar.receiveShadow=true; g.add(bar);
    const bore=new T.Mesh(new T.CircleGeometry(.0055,24),GM.bore); bore.position.set(0,BY,.1912); g.add(bore);
    const crown=new T.Mesh(new T.TorusGeometry(.0068,.0014,8,32),GM.bright); crown.position.set(0,BY,.1908); g.add(crown);
    muzzle.position.set(0,BY,.192); g.add(muzzle);
    const sight=extrude([[0,0],[.014,0],[.012,.0062],[.006,.009],[.002,.0075]],.0022,.0004,GM.bright,2); sight.position.set(0,BY+.0086,.166); g.add(sight);
    /* ejector rod housing on the right of the barrel, rod and its thumb head */
    const eh=new T.Mesh(new T.CylinderGeometry(.0044,.0044,.1,18),GM.bluedPlain); eh.rotation.x=Math.PI/2; eh.position.set(.0108,BY-.0112,.1); g.add(eh);
    const rod=new T.Mesh(new T.CylinderGeometry(.002,.002,.06,10),GM.bright); rod.rotation.x=Math.PI/2; rod.position.set(.0108,BY-.0112,.165); g.add(rod);
    const head=new T.Mesh(new T.LatheGeometry([[0,0],[.0044,0],[.005,.004],[.0036,.009],[0,.009]].map(p=>new T.Vector2(p[0],p[1])),16),GM.bright); head.rotation.x=Math.PI/2; head.position.set(.0108,BY-.0112,.183); g.add(head); }
  /* CYLINDER: fluted front section cut as a scalloped profile with 7 real chamber holes, plain rear ring with chamfer, ratchet star; rotates on Z */
  /* the cylinder sits in a crane hinged below its left side; the crane swings it out (up, as the gun lies on its right side) to show the chambers */
  crane.position.set(-.0165,-.016,0); g.add(crane); cyl.position.set(.0165,.016,0); crane.add(cyl);
  { const arm=new T.Mesh(new T.BoxGeometry(.005,.012,.028),GM.bluedPlain); arm.position.set(0,-.001,.004); crane.add(arm); const hinge=new T.Mesh(new T.CylinderGeometry(.0032,.0032,.034,16),GM.bright); hinge.rotation.x=Math.PI/2; hinge.position.z=.004; crane.add(hinge); }
  { const R=.0205, n=7, chambers=[]; const CR=.0135, HR=.0046;   /* 7 holes of .0052 drawn on a .0135 circle leave a .0012 wall between them: overlapping holes break the cap triangulation */   /* extrude bevel grows the walls by bevelSize, so holes are drawn .0006 wide and the rim .0006 small. plain polished drum like a real swing-out cylinder: no scallops, seven clean holes close to the rim */
    const holes=[]; for(let i=0;i<n;i++){ const a=i/n*Math.PI*2+Math.PI/2; holes.push([Math.cos(a)*CR,Math.sin(a)*CR]); chambers.push({a}); }
    const V2=q=>new T.Vector2(q[0],q[1]); const s=new T.Shape(circlePts(0,0,R-.0006,96).map(V2)); holes.forEach(h=>s.holes.push(new T.Path(circlePts(h[0],h[1],HR+.0006,32).map(V2))));   /* point lists, no closePath: a repeated end point breaks the cap triangulation */
    const fg=new T.ExtrudeGeometry(s,{depth:.046, bevelEnabled:true, bevelThickness:.0006, bevelSize:.0006, bevelSegments:4}); fg.translate(0,0,-.0236); const drum=new T.Mesh(fg,[GM.drumFace,GM.drum]); drum.castShadow=true; drum.receiveShadow=false; /* table shadow map is far too coarse for the bores: self-shadow off */ cyl.add(drum);
    /* every chamber is a real bore you can look down: a dark steel tube with a floor at the back */
    chambers.forEach(({a})=>{ const cx=Math.cos(a)*CR, cy=Math.sin(a)*CR;
      const tube=new T.Mesh(new T.CylinderGeometry(HR-.00025,HR-.00025,.046,32,1,true),GM.boreIn); tube.rotation.x=Math.PI/2; tube.position.set(cx,cy,0); cyl.add(tube);
      const floor=new T.Mesh(new T.CircleGeometry(HR,32),GM.bore); floor.position.set(cx,cy,-.0225); cyl.add(floor); });
    /* ejector star at the centre of the rear face, small centre pin at the front */
    { const star=new T.Shape(); for(let i=0;i<n*2;i++){ const a=i/(n*2)*Math.PI*2+Math.PI/2, r=i%2?.0036:.0088; const x=Math.cos(a)*r, y=Math.sin(a)*r; i?star.lineTo(x,y):star.moveTo(x,y); } star.closePath();
      const sg=new T.ExtrudeGeometry(star,{depth:.002, bevelEnabled:true, bevelThickness:.0004, bevelSize:.0004, bevelSegments:2}); sg.translate(0,0,-.0255); const sm=new T.Mesh(sg,GM.bright); cyl.add(sm);
      const pinF=new T.Mesh(new T.CylinderGeometry(.0024,.0024,.004,16),GM.bright); pinF.rotation.x=Math.PI/2; pinF.position.z=.0235; cyl.add(pinF); }
    cyl.userData.chambers=chambers;
    /* the one cartridge: brass case with a rim and primer at the back, a grey lead nose showing at the chamber mouth */
    const round=new T.Group();
    const caseM=new T.Mesh(new T.CylinderGeometry(.0040,.0040,.032,24),GM.brass); caseM.rotation.x=Math.PI/2; caseM.position.z=-.006; round.add(caseM);
    const rim=new T.Mesh(new T.CylinderGeometry(.0046,.0046,.0012,24),GM.brass); rim.rotation.x=Math.PI/2; rim.position.z=-.0228; round.add(rim);
    const primer=new T.Mesh(new T.CircleGeometry(.0017,16),GM.bright); primer.position.z=-.0235; primer.rotation.y=Math.PI; round.add(primer);
    const nose=new T.Mesh(new T.CylinderGeometry(.0038,.0038,.009,24),GM.lead); nose.rotation.x=Math.PI/2; nose.position.z=.0145; round.add(nose);
    const tip=new T.Mesh(new T.SphereGeometry(.0038,20,14),GM.lead); tip.scale.z=.75; tip.position.z=.019; round.add(tip);
    round.visible=false; cyl.add(round); cyl.userData.round=round;
    /* LIVE mark: a red glowing ring around the loaded chamber's mouth, turns with the drum so the eye can follow the round through the spin */
    const liveRing=new T.Mesh(new T.TorusGeometry(HR+.0011,.0007,10,40),new T.MeshBasicMaterial({color:0xff1a10})); liveRing.position.z=-.0247; round.add(liveRing);   /* on the rear face: the brass rim and primer are what say "bullet" */
    cyl.userData.placeRound=(i)=>{ const a=i/n*Math.PI*2+Math.PI/2; round.position.set(Math.cos(a)*CR,Math.sin(a)*CR,0); round.visible=true; };
    /* FIRE mark: a gold pointer fixed to the crane (it does not turn with the drum) at the chamber that lines up with the barrel */
    const ptr=new T.Group(); ptr.position.set(.0165,.016+R+.0062,-.0247); ptr.rotation.y=Math.PI; crane.add(ptr); cyl.userData.pointer=ptr;
    const cone=new T.Mesh(new T.ConeGeometry(.0032,.006,20),new T.MeshStandardMaterial({color:0xffc84a, emissive:0xd98a12, emissiveIntensity:.9, roughness:.35, metalness:.6})); cone.rotation.z=Math.PI; cone.position.y=-.0005; ptr.add(cone);
    const lblTex=(()=>{ const c=document.createElement("canvas"); c.width=256; c.height=96; const x=c.getContext("2d"); x.clearRect(0,0,256,96); /* r87 polish: a black-and-gold plate behind the words, so they read over the board behind the drum instead of running into its names */ x.beginPath(); x.moveTo(30,16); x.lineTo(226,16); x.arcTo(246,16,246,48,18); x.arcTo(246,80,226,80,18); x.lineTo(30,80); x.arcTo(10,80,10,48,18); x.arcTo(10,16,30,16,18); x.closePath(); x.fillStyle="rgba(12,9,5,.9)"; x.fill(); x.lineWidth=3; x.strokeStyle="#d4a017"; x.stroke(); x.font="700 38px 'Barlow Condensed', Arial"; x.textAlign="center"; x.fillStyle="#ffd36b"; x.fillText("FIRES HERE",128,61); const t=new T.CanvasTexture(c); t.anisotropy=8; return t; })();
    const lbl=new T.Mesh(new T.PlaneGeometry(.022,.00825),new T.MeshBasicMaterial({map:lblTex, transparent:true, depthWrite:false})); lbl.position.set(0,.0068,0); ptr.add(lbl);
    ptr.visible=false; ptr.scale.set(.001,.001,.001); }
  /* base pin through the cylinder with its knurled head out the front of the frame */
  { const pin=new T.Mesh(new T.CylinderGeometry(.0028,.0028,.076,14),GM.bright); pin.rotation.x=Math.PI/2; pin.position.set(.0165,.016,.01); crane.add(pin);
    const head=new T.Mesh(new T.LatheGeometry([[0,0],[.0036,0],[.0042,.002],[.0042,.006],[.003,.0075],[0,.0075]].map(p=>new T.Vector2(p[0],p[1])),16),GM.bright); head.rotation.x=Math.PI/2; head.position.set(.0165,.016,.05); head.scale.set(.55,.55,.55); crane.add(head); }
  /* HAMMER: bevelled body, spur curling back over the recoil shield, pivots on the hammer screw */
  hammer.position.set(0,.006,-.041); g.add(hammer);
  const ham=extrude(smooth([[-.0045,-.008],[.0055,-.008],[.0065,.01],[.005,.024],[.0005,.034],[-.011,.042],[-.023,.047],[-.0305,.043],[-.031,.036],[-.021,.033],[-.012,.03],[-.008,.018],[-.007,.004]],70),.0085,.0011,GM.bright,3); ham.scale.set(1,.75,.75); hammer.add(ham);
  /* TRIGGER HOUSING in brass: strap under the frame and the bow, bright trigger inside it, loading gate on the right */
  { const strap=extrude([[-.03,-.0335],[.034,-.0335],[.034,-.0375],[-.03,-.0375]],.024,.001,GM.brass,2); g.add(strap);
    const curve=new T.CatmullRomCurve3([[.032,-.035],[.03,-.046],[.02,-.058],[.004,-.064],[-.013,-.06],[-.024,-.05],[-.029,-.04],[-.03,-.034]].map(p=>new T.Vector3(0,p[1],p[0])),false,"catmullrom",.5);
    const bow=new T.Mesh(new T.TubeGeometry(curve,36,.0026,12,false),GM.brass); bow.castShadow=true; g.add(bow); }
  const trig=extrude(smooth([[-.003,0],[.004,0],[.005,-.009],[.003,-.016],[-.002,-.02],[-.006,-.016],[-.005,-.008]],40),.003,.0005,GM.bright,2); trig.position.set(0,-.036,-.006); g.add(trig);
  const gate=extrude(smooth([[-.011,-.011],[.011,-.011],[.011,.011],[-.011,.011]],40),.0016,.0008,GM.bluedPlain,2); gate.position.set(.0106,-.004,-.028); g.add(gate);
  gun.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; } });
}
/* the gun lies on its right side on the felt: spin group turns on the world Y axis, inner tilts the gun flat */
const spin=new T.Group(); spin.position.set(0,.751,.02); scene.add(spin);
const lie=new T.Group(); lie.rotation.set(0,0,-Math.PI/2); lie.position.y=.0135; spin.add(lie); lie.add(gun);
const gunShadow=new T.Mesh(new T.PlaneGeometry(.33,.14),new T.MeshBasicMaterial({map:softTex([[0,"rgba(0,0,0,.55)"],[.5,"rgba(0,0,0,.25)"],[1,"rgba(0,0,0,0)"]]), transparent:true, depthWrite:false})); gunShadow.rotation.x=-Math.PI/2; gunShadow.position.set(0,.0008,.06); spin.add(gunShadow);
/* RR_GUN_TOP.png: top-down photo on the felt for the spin shots, cross-faded with the model (filled in by loadAssets) */
const gunTop=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({transparent:true, opacity:0, depthWrite:false, toneMapped:false})); gunTop.rotation.x=-Math.PI/2; gunTop.position.y=.002; gunTop.visible=false; spin.add(gunTop);

const closeKey=new T.PointLight(0xe6eeff,0,1.6,2); scene.add(closeKey); scene.add(camera);   /* cool daylight key for the close-ups so polished steel reads silver, not lantern-beige */
const closeFill=new T.PointLight(0xbfd4ff,0,1.2,2); scene.add(closeFill);
window.__dbg={gun,cyl,crane,hammer,muzzle,spin,lie,scene,renderer,get camera(){return camera;}, get playing(){return playing;}, get boards(){return boards;}, get boardTargetWorld(){return boardTargetWorld;}};
/* ================= the boards on brass easels (Daniel LEFT, Nik RIGHT) ================= */
const boards={ D:null, N:null };
const BOARD_W=.84, BOARD_H=.64;
function loadImg(src){ return new Promise(res=>{ const im=new Image(); im.onload=()=>res(im); im.onerror=()=>res(null); im.src=src; }); }
const lacquer=new T.MeshPhysicalMaterial({map:tableWoodTex, color:0x6a4a34, roughness:.25, metalness:.05, clearcoat:1, clearcoatRoughness:.08});
function plateTex(text){ const [c,ctx]=cv(512,128); const g=ctx.createLinearGradient(0,0,0,128); g.addColorStop(0,"#f3d98a"); g.addColorStop(.5,"#c9a24a"); g.addColorStop(1,"#f0cf74"); ctx.fillStyle=g; ctx.fillRect(0,0,512,128); ctx.strokeStyle="#6b4a14"; ctx.lineWidth=4; ctx.strokeRect(10,10,492,108); ctx.font="700 64px 'Barlow Condensed'"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillStyle="#5a3c0c"; ctx.fillText(text,256,70); ctx.fillStyle="#fff2c0"; ctx.fillText(text,256,66); ctx.fillStyle="#3b2706"; ctx.fillText(text,256,68); const t=new T.CanvasTexture(c); t.encoding=T.sRGBEncoding; t.anisotropy=8; return t; }
function ringShape(w,h,r,iw,ih,ir){ const sh=new T.Shape(); sh.moveTo(-w/2+r,-h/2); sh.lineTo(w/2-r,-h/2); sh.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r); sh.lineTo(w/2,h/2-r); sh.quadraticCurveTo(w/2,h/2,w/2-r,h/2); sh.lineTo(-w/2+r,h/2); sh.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r); sh.lineTo(-w/2,-h/2+r); sh.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
  const hole=new T.Path(); hole.moveTo(-iw/2,-ih/2); hole.lineTo(-iw/2,ih/2); hole.lineTo(iw/2,ih/2); hole.lineTo(iw/2,-ih/2); hole.lineTo(-iw/2,-ih/2); sh.holes.push(hole); return sh; }
/* board: a black-lacquer moulded frame with a gold fillet, the squad screen under glass; easel: walnut A-frame with gold ferrules, caps, a ledge rail and a finial */
function makeBoard(key,label){ const g=new T.Group(); scene.add(g); const inner=new T.Group(); g.add(inner);
  const FW=.075; const frameG=new T.ExtrudeGeometry(ringShape(BOARD_W+FW*2,BOARD_H+FW*2,.02,BOARD_W+.01,BOARD_H+.01),{depth:.03, bevelEnabled:true, bevelThickness:.012, bevelSize:.012, bevelSegments:5, curveSegments:8}); frameG.translate(0,0,-.03);
  const frame=new T.Mesh(frameG,lacquer); frame.castShadow=true; frame.receiveShadow=true; inner.add(frame);
  const filletG=new T.ExtrudeGeometry(ringShape(BOARD_W+.03,BOARD_H+.03,.004,BOARD_W+.004,BOARD_H+.004),{depth:.006, bevelEnabled:true, bevelThickness:.003, bevelSize:.003, bevelSegments:3}); filletG.translate(0,0,-.004); inner.add(new T.Mesh(filletG,GM.gold));
  const beadG=new T.ExtrudeGeometry(ringShape(BOARD_W+FW*2+.022,BOARD_H+FW*2+.022,.03,BOARD_W+FW*2+.002,BOARD_H+FW*2+.002),{depth:.014, bevelEnabled:true, bevelThickness:.004, bevelSize:.004, bevelSegments:3}); beadG.translate(0,0,-.024); inner.add(new T.Mesh(beadG,GM.gold));
  const backing=new T.Mesh(new T.BoxGeometry(BOARD_W+FW*2,BOARD_H+FW*2,.02),lacquer); backing.position.z=-.04; inner.add(backing);
  const [c,ctx]=cv(2048,1560); const tex=new T.CanvasTexture(c); tex.encoding=T.sRGBEncoding; tex.anisotropy=16;
  /* r87 (Nik 2026-10-30: boards and players clearer): the squad screen glows a little by itself (emissive from its own picture), so it reads in the dim room, and a softer clearcoat keeps the lamp glare off the names */
  const face=new T.Mesh(new T.PlaneGeometry(BOARD_W,BOARD_H),new T.MeshPhysicalMaterial({map:tex, emissiveMap:tex, emissive:new T.Color(1,1,1), emissiveIntensity:.42, roughness:.45, metalness:0, clearcoat:.45, clearcoatRoughness:.22})); face.position.z=-.006; inner.add(face);
  /* easel */
  const easel=new T.Group(); g.add(easel); const walnut=lacquer;
  const leg=(x,z,tiltZ,tiltX,len)=>{ const m=new T.Mesh(new T.CylinderGeometry(.014,.02,len,14),walnut); m.position.set(x,-len/2+BOARD_H/2+.12,z); m.rotation.z=tiltZ; m.rotation.x=tiltX; m.castShadow=true; easel.add(m);
    const cap=new T.Mesh(new T.CylinderGeometry(.017,.017,.03,14),GM.gold); cap.position.set(0,len/2-.015,0); m.add(cap); const foot=new T.Mesh(new T.CylinderGeometry(.021,.024,.06,14),GM.gold); foot.position.set(0,-len/2+.4,0); m.add(foot); return m; };
  const L=1.95; leg(-BOARD_W/2-.02,-.03,.085,0,L); leg(BOARD_W/2+.02,-.03,-.085,0,L); const back=leg(0,-.14,0,-.34,L*.98);
  const crown=new T.Mesh(new T.BoxGeometry(BOARD_W+.2,.03,.03),walnut); crown.position.set(0,BOARD_H/2+.1,-.03); easel.add(crown);
  const finial=new T.Mesh(new T.LatheGeometry([[0,0],[.02,0],[.026,.012],[.014,.03],[.02,.05],[.008,.075],[0,.085]].map(p=>new T.Vector2(p[0],p[1])),20),GM.gold); finial.position.set(0,BOARD_H/2+.115,-.03); easel.add(finial);
  const ledge=new T.Mesh(new T.BoxGeometry(BOARD_W+.2,.03,.09),walnut); ledge.position.set(0,-BOARD_H/2-.095,.0); easel.add(ledge); const rail=new T.Mesh(new T.BoxGeometry(BOARD_W+.2,.012,.012),GM.gold); rail.position.set(0,-BOARD_H/2-.074,.045); easel.add(rail);
  const stretcher=new T.Mesh(new T.CylinderGeometry(.012,.012,BOARD_W+.26,10),walnut); stretcher.rotation.z=Math.PI/2; stretcher.position.set(0,-BOARD_H/2-.55,-.04); easel.add(stretcher);
  const plate=new T.Mesh(new T.PlaneGeometry(.22,.055),new T.MeshStandardMaterial({map:plateTex(label), roughness:.3, metalness:.6})); plate.position.set(0,-BOARD_H/2-.095,.047); easel.add(plate);
  easel.traverse(o=>{ if(o.isMesh){ o.castShadow=true; } });
  g.userData={inner, ctx, canvas:c, tex, face, bubbles:[], hit:null, jolt:new T.Vector3(), joltV:new T.Vector3()}; boards[key]=g; return g; }
makeBoard("D","DANIEL"); makeBoard("N","NIK");

/* FIFA 17 squad screen look: position -> pitch spot (x 0-1 across, y 0-1 down; GK bottom) */
const POS_XY={ GK:[.5,.9], LB:[.12,.72], LWB:[.1,.62], LCB:[.34,.76], CB:[.5,.76], RCB:[.66,.76], RB:[.88,.72], RWB:[.9,.62], LDM:[.33,.58], CDM:[.5,.6], RDM:[.67,.58], LCM:[.3,.48], CM:[.5,.5], RCM:[.7,.48], LM:[.1,.42], RM:[.9,.42], LAM:[.3,.34], CAM:[.5,.36], RAM:[.7,.34], LW:[.14,.22], RW:[.86,.22], LF:[.32,.16], CF:[.5,.25], RF:[.68,.16], LS:[.36,.1], ST:[.5,.1], RS:[.64,.1] };
function shirt(ctx,x,y,s,kit){ const [p,sec,acc]=kit; ctx.save(); ctx.translate(x,y); ctx.scale(s,s);
  ctx.beginPath(); ctx.moveTo(-.5,-.42); ctx.lineTo(-.22,-.5); ctx.quadraticCurveTo(0,-.36,.22,-.5); ctx.lineTo(.5,-.42); ctx.lineTo(.62,-.1); ctx.lineTo(.36,0); ctx.lineTo(.36,.5); ctx.lineTo(-.36,.5); ctx.lineTo(-.36,0); ctx.lineTo(-.62,-.1); ctx.closePath();
  ctx.fillStyle=p; ctx.fill(); ctx.lineWidth=.05; ctx.strokeStyle="rgba(0,0,0,.55)"; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.fillStyle=sec; ctx.fillRect(-.62,-.5,.14,1); ctx.fillRect(.48,-.5,.14,1); ctx.fillStyle=acc; ctx.fillRect(-.36,.42,.72,.08); ctx.restore();
  ctx.fillStyle=sec; ctx.beginPath(); ctx.moveTo(-.22,-.5); ctx.quadraticCurveTo(0,-.3,.22,-.5); ctx.quadraticCurveTo(0,-.44,-.22,-.5); ctx.fill(); ctx.restore(); }
function formationOf(xi){ const D=xi.filter(([p])=>/B$/.test(p)).length, A=xi.filter(([p])=>/^(ST|CF|LS|RS|LF|RF|LW|RW)$/.test(p)).length; const M=xi.length-1-D-A; return `${D}-${M}-${A}`; }
function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
/* FIFA 17 squad screen look: graphite panel, lit pitch, chemistry links, kit + gold rating plate + name pill per player, subs bench */
const POS_COL=(pos)=>pos==="GK"?"#f2d23c":/B$/.test(pos)?"#3f86e8":/^(ST|CF|LS|RS|LF|RF|LW|RW)$/.test(pos)?"#e8502f":"#4fc74d";
/* FIFA 17 squad screen player: kit shirt, white rating at the shirt's top-left, name on a dark band under it, coloured position tag on the left */
/* Polish RR-3: the name band never grows past its slot (s*1.2, or bandW when a neighbour's band shares the row): the surname shrinks to fit (down to 65%), then ends in "…" */
function fitName(ctx,name,s,bandW){ let sur=(name.includes(". ")?name.slice(name.indexOf(". ")+2):name); const maxW=Math.min(s*1.2,bandW||Infinity), pad=s*.16; let fs=Math.round(s*.3);
  ctx.font=`600 ${fs}px 'Barlow Condensed'`; while(fs>Math.round(s*.3*.65)&&ctx.measureText(sur).width>maxW-pad){ fs-=1; ctx.font=`600 ${fs}px 'Barlow Condensed'`; }
  if(ctx.measureText(sur).width>maxW-pad){ while(sur.length>2&&ctx.measureText(sur+"…").width>maxW-pad) sur=sur.slice(0,-1); sur+="…"; }
  return {sur, tw:Math.min(maxW,Math.max(s*1.0,ctx.measureText(sur).width+pad))}; }
/* RT5-SCENE-03: drawBoard calls this once per pass over the whole XI (phase 0 every shirt, 1 every rating and tag, 2 every name band),
   so no neighbour's shirt, rating or tag ever paints over a name. The rating and the position chip sit on the chest, clear of the
   band of the row above (rows are 47-66 px apart). No phase draws the whole card at once. */
function playerCard(ctx,x,y,s,kit,pos,name,rating,num,tagLeft,phase,bandW){ const all=phase===undefined;
  if(all||phase===0){ ctx.save(); ctx.shadowColor="rgba(0,0,0,.5)"; ctx.shadowBlur=12; ctx.shadowOffsetY=5; shirt(ctx,x,y,s,kit); ctx.restore(); }
  ctx.textAlign="center"; ctx.textBaseline="middle";
  if(all||phase===2){ const {sur,tw}=fitName(ctx,name,s,bandW); const nx=x-tw/2, ny=y+s*.5, nh=s*.36;
    ctx.fillStyle="rgba(8,10,14,.78)"; ctx.fillRect(nx,ny,tw,nh); ctx.fillStyle="#fff"; ctx.fillText(sur,x,ny+nh/2+1); }
  if(!(all||phase===1)) return;
  /* rating: bold white on the shirt's chest (inside the shirt, below the band of the row above) */
  ctx.font=`800 ${Math.round(s*.3)}px 'Barlow Condensed'`; ctx.textAlign="center"; ctx.lineWidth=4; ctx.strokeStyle="rgba(0,0,0,.7)"; ctx.strokeText(String(rating),x,y+s*.06); ctx.fillStyle="#fff"; ctx.fillText(String(rating),x,y+s*.06);
  /* position tag: a small chip in the position colour under the rating (inside the shirt, so no neighbour's band reaches it) */
  if(tagLeft!==false){ ctx.font=`700 ${Math.round(s*.19)}px 'Barlow Condensed'`; const pw=ctx.measureText(pos).width+s*.14, ph=s*.19, py=y+s*.31; roundRect(ctx,x-pw/2,py-ph/2,pw,ph,ph*.3); ctx.fillStyle=POS_COL(pos); ctx.fill(); ctx.lineWidth=1.5; ctx.strokeStyle="rgba(0,0,0,.6)"; ctx.stroke(); ctx.textAlign="center"; ctx.fillStyle="#0d1015"; ctx.fillText(pos,x,py+1); } }
function lum(hex){ const n=parseInt(String(hex).replace("#",""),16); if(isNaN(n)) return .5; return ((n>>16&255)*.299+(n>>8&255)*.587+(n&255)*.114)/255; }
function drawBoard(key,club){ const b=boards[key].userData, ctx=b.ctx, W=1024, H=780; const kit=club.kit; b.bubbles.length=0; b.club=club;
  ctx.setTransform(2,0,0,2,0,0); ctx.clearRect(0,0,W,H);
  /* FIFA 17 squad screen, landscape: tab bar, club and formation, the pitch on the left, the bench as a list on the right */
  { const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,"#2a2d33"); g.addColorStop(.12,"#1b1d22"); g.addColorStop(1,"#121317"); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); }
  ctx.textBaseline="middle"; ctx.textAlign="left"; const tabs=["SQUAD","FORMATIONS","ROLES","INSTRUCTIONS","TACTICS"]; let tx=30; tabs.forEach((t,i)=>{ ctx.font=`${i?600:800} 24px 'Barlow Condensed'`; ctx.fillStyle=i?"#c9ccd3":"#fff"; ctx.fillText(t,tx,30); const w=ctx.measureText(t).width; if(!i){ ctx.fillStyle="#f1c35a"; ctx.fillRect(tx-4,46,w+8,4); } tx+=w+40; });
  ctx.fillStyle="rgba(255,255,255,.08)"; ctx.fillRect(0,56,W,2);
  ctx.font="800 42px 'Barlow Condensed'"; ctx.fillStyle="#fff"; ctx.fillText(club.club.toUpperCase(),30,92); ctx.font="600 22px 'Barlow Condensed'"; ctx.fillStyle="#9ea4b0"; ctx.fillText("STARTING XI · "+(club.formation||formationOf(club.xi)),32,122);
  ctx.textAlign="right"; ctx.font="800 40px 'Barlow Condensed'"; ctx.fillStyle="#f1c35a"; ctx.fillText((club.formation||formationOf(club.xi)),W-30,92); ctx.textAlign="left";
  const PT=146, PB=H-24, PL=30, PR=560, IN=36; ctx.save(); ctx.beginPath(); ctx.moveTo(PL+IN,PT); ctx.lineTo(PR-IN,PT); ctx.lineTo(PR,PB); ctx.lineTo(PL,PB); ctx.closePath(); ctx.clip();
  { const g=ctx.createLinearGradient(0,PT,0,PB); g.addColorStop(0,"#6fbf53"); g.addColorStop(1,"#3f9a3d"); ctx.fillStyle=g; ctx.fillRect(PL,PT,PR-PL,PB-PT);
    for(let i=0;i<9;i++){ ctx.fillStyle=i%2?"rgba(255,255,255,.07)":"rgba(0,0,0,.05)"; ctx.fillRect(PL,PT+i*(PB-PT)/9,PR-PL,(PB-PT)/9); }
    const v=ctx.createRadialGradient((PL+PR)/2,(PT+PB)/2,140,(PL+PR)/2,(PT+PB)/2,560); v.addColorStop(0,"rgba(255,255,255,.06)"); v.addColorStop(1,"rgba(0,0,0,.22)"); ctx.fillStyle=v; ctx.fillRect(PL,PT,PR-PL,PB-PT);
    const X=(u,y)=>{ const k=(y-PT)/(PB-PT); const l=PL+IN*(1-k), r=PR-IN*(1-k); return l+u*(r-l); }; const cx=(PL+PR)/2;
    ctx.strokeStyle="rgba(255,255,255,.92)"; ctx.lineWidth=3; const line=(u0,y0,u1,y1)=>{ ctx.beginPath(); ctx.moveTo(X(u0,y0),y0); ctx.lineTo(X(u1,y1),y1); ctx.stroke(); };
    const mid=(PT+PB)/2; line(.03,PT+12,.97,PT+12); line(.03,PB-12,.97,PB-12); line(.03,PT+12,.03,PB-12); line(.97,PT+12,.97,PB-12); line(.03,mid,.97,mid);
    ctx.beginPath(); ctx.ellipse(cx,mid,66,56,0,0,7); ctx.stroke();
    line(.28,PT+12,.28,PT+108); line(.72,PT+12,.72,PT+108); line(.28,PT+108,.72,PT+108); line(.41,PT+12,.41,PT+46); line(.59,PT+12,.59,PT+46); line(.41,PT+46,.59,PT+46);
    line(.28,PB-108,.28,PB-12); line(.72,PB-108,.72,PB-12); line(.28,PB-108,.72,PB-108); line(.41,PB-46,.41,PB-12); line(.59,PB-46,.59,PB-12); line(.41,PB-46,.59,PB-46); }
  ctx.restore();
  const used={}, has=p=>club.xi.some(r=>r[0]===p), wide={LCB:has("CB")?.27:0, RCB:has("CB")?.73:0, LCM:has("CM")?.27:0, RCM:has("CM")?.73:0}; const spots=club.xi.map(([pos,name,rating],i)=>{ let xy=POS_XY[pos]||[.5,.5]; if(wide[pos]) xy=[wide[pos],xy[1]]; /* RT5-SCENE-03: a back three or a midfield three spreads out so three names fit on one row */ let k=pos; while(used[k]){ k+="'"; xy=[xy[0]+.1,xy[1]]; } used[k]=1; const x=PL+62+xy[0]*(PR-PL-124), y=PT+58+xy[1]*(PB-PT-136); return {x,y,pos,name,rating,num:i+1}; });
  spots.sort((a,c)=>a.y-c.y).forEach(sp=>{ b.bubbles.push({slot:sp.num-1,x:sp.x,y:sp.y,name:sp.name,pos:sp.pos,rating:sp.rating,u:sp.x/W,v:1-sp.y/H}); });
  /* RT5-SCENE-03: a name band is only as wide as the gap to the nearest card whose band shares its row;
     two bands on one row share the gap: a short name keeps its width and the long one takes the rest */
  const CS=72, gkKit=[club.gk||"#2fb0a8","#1c6e69","#ffffff"]; spots.forEach(sp=>{ sp.natW=fitName(ctx,sp.name,CS).tw; sp.bandW=Infinity; });
  spots.forEach(sp=>spots.forEach(o=>{ if(o===sp||Math.abs(o.y-sp.y)>=CS*.36+4) return; const gap=Math.abs(o.x-sp.x)-3; sp.bandW=Math.min(sp.bandW,2*gap-Math.min(o.natW,gap)); }));
  for(const phase of [0,1,2]) spots.forEach(sp=>playerCard(ctx,sp.x,sp.y-6,CS,sp.pos==="GK"?gkKit:kit,sp.pos,sp.name,sp.rating,sp.num,true,phase,sp.bandW));
  /* bench list on the right */
  const BL=590, BR=W-30; ctx.fillStyle="#17181c"; ctx.fillRect(BL,PT,BR-BL,PB-PT); ctx.fillStyle="#2a2d33"; ctx.fillRect(BL,PT,BR-BL,44); ctx.textAlign="left"; ctx.font="700 24px 'Barlow Condensed'"; ctx.fillStyle="#fff"; ctx.fillText("SUBSTITUTES",BL+18,PT+22); ctx.textAlign="right"; ctx.fillStyle="#9ea4b0"; ctx.font="600 20px 'Barlow Condensed'"; ctx.fillText("BENCH · "+club.subs.length,BR-18,PT+22);
  const subs=club.subs.slice(0,6); const rowH=(PB-PT-44)/Math.max(6,subs.length);
  subs.forEach(([pos,name,rating],i)=>{ const y=PT+44+rowH*(i+.5), x=BL+70; b.bubbles.push({slot:11+i,x,y,name,pos,rating,u:x/W,v:1-y/H}); ctx.fillStyle=i%2?"rgba(255,255,255,.03)":"rgba(255,255,255,0)"; ctx.fillRect(BL,PT+44+rowH*i,BR-BL,rowH);
    ctx.save(); ctx.shadowColor="rgba(0,0,0,.5)"; ctx.shadowBlur=8; ctx.shadowOffsetY=3; shirt(ctx,x,y,52,pos==="GK"?[club.gk||"#2fb0a8","#1c6e69","#ffffff"]:kit); ctx.restore();
    ctx.fillStyle=POS_COL(pos); ctx.fillRect(BL+118,y-14,5,28); ctx.textAlign="left"; ctx.font="700 20px 'Barlow Condensed'"; ctx.fillStyle="#c9ccd3"; ctx.fillText(pos,BL+132,y-10); ctx.font="700 26px 'Barlow Condensed'"; ctx.fillStyle="#fff"; const sur=name.includes(". ")?name.slice(name.indexOf(". ")+2):name; ctx.fillText(sur,BL+132,y+14);
    ctx.textAlign="right"; ctx.font="800 36px 'Barlow Condensed'"; ctx.fillStyle="#fff"; ctx.fillText(String(rating),BR-22,y); });
  ctx.textAlign="left"; ctx.font="800 28px 'Barlow Condensed'"; ctx.fillStyle="#fff"; ctx.lineWidth=4; ctx.strokeStyle="rgba(0,0,0,.5)"; ctx.strokeText((club.formation||formationOf(club.xi)),PL+12,PB-28); ctx.fillText((club.formation||formationOf(club.xi)),PL+12,PB-28);
  if(b.hit) drawHit(key,b.hit); b.tex.needsUpdate=true; }
function drawHit(key,hit){ const b=boards[key].userData, ctx=b.ctx; const {x,y}=hit; ctx.setTransform(2,0,0,2,0,0);
  /* red RELEASED stamp on the player, then a burnt hole with a charred rim and torn paper */
  ctx.save(); ctx.translate(x,y-2); ctx.rotate(-.12); ctx.fillStyle="rgba(190,20,20,.92)"; ctx.fillRect(-92,-20,184,40); ctx.strokeStyle="#ffd0c0"; ctx.lineWidth=3; ctx.strokeRect(-88,-16,176,32); ctx.fillStyle="#fff"; ctx.font="900 28px 'Big Shoulders Display'"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText("RELEASED",0,1); ctx.restore();
  const r=30; const g=ctx.createRadialGradient(x,y,r*.3,x,y,r*2.4); g.addColorStop(0,"rgba(0,0,0,1)"); g.addColorStop(.35,"rgba(25,10,4,.95)"); g.addColorStop(.6,"rgba(70,35,10,.7)"); g.addColorStop(1,"rgba(60,30,10,0)"); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r*2.4,0,7); ctx.fill();
  ctx.fillStyle="#050302"; ctx.beginPath(); for(let i=0;i<14;i++){ const a=i/14*Math.PI*2, rr=r*(.7+Math.random()*.5); ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr); } ctx.closePath(); ctx.fill();
  ctx.strokeStyle="rgba(255,120,40,.6)"; ctx.lineWidth=2; ctx.stroke(); }
function boardHitPoint(key,bubble){ const g=boards[key]; const p=new T.Vector3((bubble.u-.5)*BOARD_W,(bubble.v-.5)*BOARD_H,.012); g.updateMatrixWorld(true); return g.userData.inner.localToWorld(p); }
function boardTargetWorld(key,bubble){ return boardHitPoint(key,bubble); }

/* squads */
let SQUADS=null; const clubByName=(n)=>SQUADS&&SQUADS.clubs.find(c=>c.club.toLowerCase()===String(n).toLowerCase())||SQUADS&&SQUADS.clubs[0];
function setBoards(dClub,nClub){ if(!SQUADS) return; const d=clubByName(dClub), n=clubByName(nClub); boards.D.userData.hit=null; boards.N.userData.hit=null; drawBoard("D",d); drawBoard("N",n); }

/* ================= particles: smoke, splinters, dust, flash ================= */
const smokes=[]; const smokeMat=new T.SpriteMaterial({map:smokeT, transparent:true, depthWrite:false, opacity:.5, color:0xd8d0c0});
for(let i=0;i<36;i++){ const s=new T.Sprite(smokeMat.clone()); s.visible=false; scene.add(s); smokes.push({s, life:0, v:new T.Vector3(), rot:0}); }
function puff(pos,dir,n,size,speed,life){ for(let i=0;i<n;i++){ const p=smokes.find(q=>q.life<=0); if(!p) return; p.life=life*(.7+rnd()*.6); p.max=p.life; p.s.visible=true; p.s.position.copy(pos).add(new T.Vector3((rnd()-.5)*.02,(rnd()-.5)*.02,(rnd()-.5)*.02)); p.v.copy(dir).multiplyScalar(speed*(.5+rnd())).add(new T.Vector3((rnd()-.5)*.3,.12+rnd()*.2,(rnd()-.5)*.3)); p.size=size*(.6+rnd()*.8); p.s.material.rotation=rnd()*6.28; p.rot=(rnd()-.5)*1.5; } }
const splinters=[]; const splGeo=new T.BoxGeometry(.012,.004,.03); const splMat=new T.MeshStandardMaterial({color:L("#e8d8b0"),roughness:.9});
for(let i=0;i<40;i++){ const m=new T.Mesh(i%3?splGeo:new T.BoxGeometry(.02,.001,.02),i%3?splMat:M.card); m.visible=false; scene.add(m); splinters.push({m, life:0, v:new T.Vector3(), w:new T.Vector3()}); }
function burst(pos,normal){ splinters.forEach((p,i)=>{ p.life=.9+rnd()*.8; p.m.visible=true; p.m.position.copy(pos); p.v.copy(normal).multiplyScalar(.8+rnd()*2.2).add(new T.Vector3((rnd()-.5)*2.2,(rnd()-.2)*2.4,(rnd()-.5)*2.2)); p.w.set(rnd()*20,rnd()*20,rnd()*20); p.m.scale.setScalar(.25+rnd()*.45); }); }
const flashSprite=new T.Sprite(new T.SpriteMaterial({map:flashTex(), blending:T.NormalBlending, depthWrite:false, transparent:true, opacity:0})); flashSprite.scale.set(.001,.001,1); scene.add(flashSprite);
const flashSide=new T.Sprite(new T.SpriteMaterial({map:glowT, blending:T.NormalBlending, depthWrite:false, transparent:true, opacity:0, color:0xffb060})); scene.add(flashSide);
/* muzzle flash layers: hot white core, two petal stars at different angles, one wide warm glow; sparks fly out in a cone */
const flashCore=new T.Sprite(new T.SpriteMaterial({map:sparkTex(), blending:T.NormalBlending, depthWrite:false, transparent:true, opacity:0, color:0xffffff})); scene.add(flashCore);
/* normal blending on the flash layers: additive over green felt turned the fire yellow-green */
const petals=[0,1].map(()=>{ const sp=new T.Sprite(new T.SpriteMaterial({map:petalTex(), blending:T.NormalBlending, depthWrite:false, transparent:true, opacity:0, color:0xffe6c8})); scene.add(sp); return sp; });
const sparks=[]; const sparkMat=new T.SpriteMaterial({map:sparkTex(), blending:T.AdditiveBlending, depthWrite:false, transparent:true, color:0xffd080});
for(let i=0;i<40;i++){ const sp=new T.Sprite(sparkMat.clone()); sp.visible=false; scene.add(sp); sparks.push({s:sp, life:0, v:new T.Vector3()}); }
function spray(pos,dir,n,speed){ for(let i=0;i<n;i++){ const p=sparks.find(q=>q.life<=0); if(!p) return; p.life=.25+rnd()*.4; p.max=p.life; p.s.visible=true; p.s.position.copy(pos); const sz=.006+rnd()*.012; p.s.scale.set(sz,sz,1); p.v.copy(dir).multiplyScalar(speed*(.4+rnd())).add(new T.Vector3((rnd()-.5)*speed*.6,(rnd()-.3)*speed*.5,(rnd()-.5)*speed*.6)); } }
const hitFlash=new T.Sprite(new T.SpriteMaterial({map:sparkTex(), blending:T.AdditiveBlending, depthWrite:false, transparent:true, opacity:0, color:0xfff0d0})); scene.add(hitFlash);
const hitLight=new T.PointLight(L("#ffd0a0"),0,2.5,2); scene.add(hitLight);
[flashSprite,flashCore,flashSide,...petals].forEach(o=>{ o.renderOrder=30; o.material.depthTest=false; }); sparks.forEach(p=>{ p.s.renderOrder=28; }); smokes.forEach(p=>{ p.s.renderOrder=25; });
/* dust in the lamp light */
const dust=(()=>{ const n=260, pos=new Float32Array(n*3), base=[]; for(let i=0;i<n;i++){ const x=(rnd()-.5)*3.2, y=.7+rnd()*2.2, z=-2.2+rnd()*3.2; pos.set([x,y,z],i*3); base.push(x,y,z); } const g=new T.BufferGeometry(); g.setAttribute("position",new T.BufferAttribute(pos,3)); const m=new T.PointsMaterial({map:dustT, size:.016, transparent:true, opacity:.5, depthWrite:false, blending:T.AdditiveBlending, color:0xffd9a0, sizeAttenuation:true}); const p=new T.Points(g,m); scene.add(p); return {p,base,pos}; })();
/* bullet tracer: a short bright line that lives 0.12 s */
const tracer=new T.Mesh(new T.CylinderGeometry(.002,.002,1,6),new T.MeshBasicMaterial({color:0xffe0a0, transparent:true, opacity:.9, toneMapped:false})); tracer.visible=false; scene.add(tracer);
/* the bullet the camera rides: lead slug with a copper band, spinning, with a hot streak behind it and a soft shock halo */
const bullet=new T.Group(); scene.add(bullet); bullet.visible=false;
{ const lead=new T.MeshPhysicalMaterial({color:L("#9a9ea4"), metalness:.85, roughness:.3, clearcoat:.4}); const copper=new T.MeshPhysicalMaterial({color:L("#b9722f"), metalness:1, roughness:.25, clearcoat:.5});
  const body=new T.Mesh(new T.CylinderGeometry(.0045,.0045,.012,24),lead); body.rotation.x=Math.PI/2; body.position.z=-.004; bullet.add(body);
  const band=new T.Mesh(new T.CylinderGeometry(.0046,.0046,.003,24),copper); band.rotation.x=Math.PI/2; band.position.z=-.009; bullet.add(band);
  const nose=new T.Mesh(new T.SphereGeometry(.0045,24,16),lead); nose.scale.z=1.9; nose.position.z=.003; bullet.add(nose);
  const streak=new T.Mesh(new T.PlaneGeometry(.09,.012),new T.MeshBasicMaterial({map:softTex([[0,"rgba(255,220,160,.9)"],[.5,"rgba(255,170,80,.35)"],[1,"rgba(255,120,40,0)"]]), transparent:true, depthWrite:false, blending:T.AdditiveBlending, side:T.DoubleSide, toneMapped:false})); streak.rotation.y=Math.PI/2; streak.position.z=-.055; bullet.add(streak); bullet.userData.streak=streak;
  const halo=new T.Sprite(new T.SpriteMaterial({map:glowT, blending:T.AdditiveBlending, depthWrite:false, transparent:true, color:0xffd9a0, opacity:.18})); halo.scale.set(.06,.06,1); bullet.add(halo); }
function slugAt(p,tgt,k){ return p.mz.clone().lerp(tgt,k); }
function placeTracer(a,b,k0,k1){ const p0=a.clone().lerp(b,k0), p1=a.clone().lerp(b,k1); const len=p0.distanceTo(p1); tracer.visible=len>0.001; tracer.scale.set(1,len,1); tracer.position.copy(p0).add(p1).multiplyScalar(.5); tracer.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),p1.clone().sub(p0).normalize()); }

/* ================= layout: desktop vs portrait phone ================= */
const camRest=new T.Vector3(), lookRest=new T.Vector3(); let PH=false, fovRest=38, fovNow=38;
function layout(){ PH=portrait(); const w=innerWidth, h=innerHeight; camera.aspect=w/h; fovRest=PH?54:36; camera.fov=fovNow=fovRest; camera.updateProjectionMatrix();
  /* r87 (Nik 2026-10-30): the easels stand clear of the table on every screen (no leg or ledge inside the rim, R .78 + rim), and
     the boards never move during a turn. Desktop: beside and behind the table. Phone: behind it, raised, legs to the floor. */
  const bx=PH?.5:1.1, by=PH?1.2:1.0, bz=PH?-1.05:-.45, yaw=PH?.3:.55, sc=PH?.8:.92;
  [["D",-1],["N",1]].forEach(([k,s])=>{ const b=boards[k]; b.position.set(bx*s,by,bz); b.rotation.set(-.12,-yaw*s,0); b.scale.setScalar(sc); });
  if(PH){ camRest.set(0,1.8,2.75); lookRest.set(0,.92,-.1); } else { camRest.set(0,1.62,2.7); lookRest.set(0,.86,-.1); }
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,PH?2.5:3)); renderer.setSize(w,h,false); }
addEventListener("resize",layout);

/* ================= the turn: the gun spins on the felt, cocks itself, fires or clicks ================= */
const result=$("result"), cta=$("cta"), slotD=$("slotD"), slotN=$("slotN"), live=$("live"), toast=$("toast");
const ORDER=["D","N"]; const NAME={D:"Daniel",N:"Nik"};
let turn=0, loaded=false, chamber=0, bulletAt=0, playing=null, done={D:null,N:null};
let manual=null, last=0, fired={}, camPos=new T.Vector3(), camLook=new T.Vector3(), shake=0, camTmp=new T.Vector3();
function slot(el,txt,cls){ el.textContent=txt; el.className=cls||""; }
function setBusy(b){ cta.classList.toggle("busy",b); document.body.classList.toggle("turning",b); cta.textContent=b?"Spinning…":(turn%2===0&&turn>0?"Spin again":"Spin the cylinder"); }
/* red team R87-C-06: in the game both phones play the engine's own plan (js/rosterRoulette.js via the season step): the round
   sits in bulletChamber, the cylinder stops on stopChamber and the barrel points at hitSlot (a safe turn at aimSlot). Board
   slots 0-10 are the XI, 11-14 the subs. No random choice is left for anything both phones see. */
function rrPlanTurn(o,free){ if(!o||!Number.isInteger(o.bulletChamber)||!Number.isInteger(o.stopChamber)) return null;
  const at=Number.isInteger(o.hitSlot)?o.hitSlot:o.aimSlot;
  const pick=(Number.isInteger(at)&&free.find(x=>x.slot===at))||(o.target&&free.find(x=>x.name===o.target))||free[0];
  return {bulletAt:((o.bulletChamber%7)+7)%7, chamber:((o.stopChamber%7)+7)%7, pick, fire:o.fire===true}; }
/* rrPlanTurn end */
function startTurn(force,targetName,planned){ if(playing) return; const who=ORDER[turn%2];
  const b=boards[who].userData; const free=b.bubbles.filter((x,i)=>!b.hit||b.hit.i!==i); const plan=rrPlanTurn(planned,free); let pick, fire;
  if(plan){ bulletAt=plan.bulletAt; loaded=true; cyl.userData.placeRound(bulletAt); chamber=plan.chamber; pick=plan.pick; fire=plan.fire; }
  else{
    if(!loaded){ bulletAt=Math.floor(rnd()*7); loaded=true; cyl.userData.placeRound(bulletAt); }
    const fireQ=qs.get("fire"); const want=force!==undefined?force:(fireQ==="1"?true:fireQ==="0"?false:null);
    chamber=want===null?Math.floor(rnd()*7):(want?bulletAt:(bulletAt+1+Math.floor(rnd()*6))%7);
    pick=(targetName&&free.find(x=>x.name===targetName))||free[Math.floor(rnd()*free.length)];   /* the gallery (no plan) picks one */
    fire=chamber===bulletAt; }
  playing={ who, t0:now(), fire, target:pick, hitDone:false, yaw0:spin.rotation.y, slide:new T.Vector3(), slideV:new T.Vector3(), spinV:0 }; fired={};
  /* where the barrel must point when it stops: at the target board, with a natural overshoot */
  const tgt=boardTargetWorld(who,pick); const dir=tgt.clone().sub(spin.position); playing.yawTarget=Math.atan2(dir.x,dir.z);
  setBusy(true); result.className="result"; result.textContent=""; slot(who==="D"?slotD:slotN,"Spinning…","wait"); $("chipWho").textContent=NAME[who]; $("pchipWho").textContent=NAME[who];
  live.textContent=`${NAME[who]}'s turn. The revolver spins on the table.`; SFX.play("spinStart"); }
function endTurn(){ const p=playing; if(!p) return; const who=p.who; if(p.fire){ done[who]={lost:p.target.name}; slot(who==="D"?slotD:slotN,"Lost "+((typeof GAME!=="undefined"&&GAME&&GAME.turns&&GAME.turns[turn]&&GAME.turns[turn].targetLabel)||p.target.name),"lost") /* Codex C2-01: number, position and overall tell namesakes apart */; } else { done[who]={safe:true}; slot(who==="D"?slotD:slotN,"Safe","safe"); }
  try{ window.dispatchEvent(new CustomEvent("rr:end",{detail:{who, name:NAME[who], fire:p.fire, lost:p.fire?p.target.name:null, turn}})); }catch(e){}
  turn++; playing=null; const next=ORDER[turn%2]; setBusy(false); $("chipWho").textContent=NAME[next]; $("pchipWho").textContent=NAME[next]; if(turn%2===1) slot(next==="D"?slotD:slotN,"At the table","wait"); if(p.fire){ loaded=false; cyl.userData.round.visible=false; } }
const now=()=>manual!==null?manual:performance.now()/1000;
/* beats (seconds from the start of a turn); reduced motion shortens them */
const B=REDUCED?{spin:.2,spinEnd:1.6,close:1.8,inside:1.8,turnC:2.2,hand:2.3,cock:2.6,aim:2.7,fire:3.3,impact:3.45,end:5.2}:{spin:.35,spinEnd:3.0,close:3.3,inside:11.4,turnC:11.9,hand:12.2,cock:13.6,aim:13.9,fire:15.0,impact:17.4,end:22.0};
let hammerK=0, cylExtra=0, recoil=0, fxScale=1;
function cylTarget(){ return -chamber*(Math.PI*2/7); }
function at(tt,t,k,fn){ if(tt>=t&&!fired[k]){ fired[k]=1; fn(); } }
let lastClick=0;
function stepTurn(dt){ const p=playing; const t=now(); const tt=p?t-p.t0:0;
  const muzzleW=new T.Vector3(); muzzle.getWorldPosition(muzzleW);
  if(!p){ handHold=false; handK=0; handRecoil=0; handAimAt=null; crane.rotation.z=lerp(crane.rotation.z,0,Math.min(1,dt*6)); hammerK=lerp(hammerK,0,Math.min(1,dt*6)); cyl.rotation.z=lerp(cyl.rotation.z,cylTarget(),Math.min(1,dt*6)); spin.position.lerp(new T.Vector3(0,.751,.02),Math.min(1,dt*.8)); }
  else {
    const tgt=boardTargetWorld(p.who,p.target);
    /* a. the spin: fast, friction slows it, stops on the target with a small overshoot and settle */
    if(tt>=B.spin&&tt<B.spinEnd+.5){ const k=S(B.spin,B.spinEnd-B.spin,tt); const turns=REDUCED?2:4; let delta=(p.yawTarget-p.yaw0)%(Math.PI*2); if(delta<0) delta+=Math.PI*2; const total=turns*Math.PI*2+delta; const e=1-Math.pow(1-k,2.6); const over=Math.sin(Math.min(1,k)*Math.PI)*0; const settle=tt>B.spinEnd?Math.sin((tt-B.spinEnd)*14)*Math.exp(-(tt-B.spinEnd)*6)*.09:0; const prev=spin.rotation.y; spin.rotation.y=p.yaw0+total*e+(k>.8?Math.sin((k-.8)/.2*Math.PI)*.12:0)+settle; p.spinV=(spin.rotation.y-prev)/Math.max(dt,1e-3); if(Math.floor(spin.rotation.y/.9)!==lastClick){ lastClick=Math.floor(spin.rotation.y/.9); SFX.play("felt",Math.min(1,Math.abs(p.spinV)/14)); } }
    else if(tt>=B.spinEnd+.5&&tt<B.fire){ spin.rotation.y=p.yawTarget; }
    /* b. the cylinder turns one chamber by itself, then the hammer cocks by itself */
    /* the crane swings the cylinder out, it spins fast and runs down while the camera looks into the chambers, then swings back */
    const craneK=tt<B.close?0:tt<B.inside?ease.inOut(S(B.close,.5,tt)):1-ease.inOut(S(B.inside,.45,tt)); crane.rotation.z=craneK*1.62; { const pk=Math.max(0,(craneK-.35)/.65), ptr=cyl.userData.pointer; ptr.visible=pk>0; const sc=.001+ease.out(pk)*.999; ptr.scale.set(sc,sc,sc); }
    at(tt,B.close+.4,"mark",()=>{ result.className="result"; result.textContent="Red: live round · Gold: fires"; });
    at(tt,B.inside-.6,"stopped",()=>{ result.className=p.fire?"result bang":"result safe"; result.textContent=p.fire?"Stopped on the live round":"The live round passed"; });
    at(tt,B.close,"craneOpen",()=>SFX.play("cock",.6)); at(tt,B.inside,"craneShut",()=>SFX.play("click",1));
    /* THE main event: the drum spins free for ~7 s, fast at first, then the clicks spread out, then a slow crawl to the stop with the red ring and the gold mark in view. It stops exactly where it will fire (or not) before the crane closes. */
    let showExtra=0; if(tt>=B.close&&tt<B.inside){ const k=S(B.close+.45,B.inside-B.close-.85,tt); const e=1-Math.pow(1-k,2.7); showExtra=(1-e)*Math.PI*2*(REDUCED?0:14); const idx=Math.floor(showExtra/(Math.PI*2/7)); if(idx!==lastClick){ lastClick=idx; SFX.play("click",.22+.3*k); } }
    at(tt,B.inside-3.2,"heart0",()=>SFX.play("heart")); at(tt,B.inside-2.0,"slowing",()=>{ result.textContent="Slowing down…"; });
    at(tt,B.turnC,"turnC",()=>SFX.play("click",1)); cyl.rotation.z=cylTarget()+showExtra;
    hammerK=tt<B.cock?0:tt<B.fire?ease.out(S(B.cock,.3,tt)):Math.max(0,1-S(B.fire,.05,tt));
    /* the hand: rises from the dark once the drum is shut, holds and breathes, fires or clicks, then sinks away */
    handHold=tt>=B.hand&&tt<B.end-.2; handSide=p.who==="D"?1:-1; handAimAt=tgt;   /* the hand sits on the side away from the board, so the gun crosses the frame toward it */
    { const up=ease.out(S(B.hand,1.1,tt)); const down=tt<B.fire+(p.fire?.35:1.0)?0:ease.inOut(S(B.fire+(p.fire?.35:1.0),p.fire?.9:.6,tt)); const breathe=Math.sin(tt*2.1)*.004+Math.sin(tt*5.3)*.0015; handK=Math.max(0,up-down)+(handHold?breathe:0);
      if(tt>=B.fire){ const a=tt<B.fire+.06?S(B.fire,.06,tt):1-ease.out(S(B.fire+.06,.55,tt)); handRecoil=(p.fire?1:.12)*Math.max(0,a); } else handRecoil=0; }
    at(tt,B.hand,"handUp",()=>SFX.play("handUp")); at(tt,B.cock,"cock",()=>SFX.play("cock")); at(tt,B.aim,"heart",()=>SFX.play("heart")); at(tt,B.aim+1.0,"heart2",()=>SFX.play("heart"));
    /* c/d. hammer falls */
    if(tt>=B.fire&&!fired.fire){ fired.fire=1; if(p.fire){ fireShot(p,tgt); } else { SFX.play("dry"); const fl=muzzleW.clone(); if(!handHold) fl.y=.76; puff(fl,new T.Vector3(0,.4,0),4,.07,.25,.9); result.className="result safe"; result.textContent=`Click. ${NAME[p.who]} is safe.`; live.textContent=result.textContent; } }
    /* the bullet: leaves at full speed for the first 8 cm, then the world slows and the camera rides beside it to the board */
    if(p.fire&&tt>=B.fire){ const fl=S(B.fire,B.impact-B.fire,tt); const k=Math.min(1,.04+ease.in(fl)*.96); const impact=tt>=B.impact; const dir=p.dir;
      if(!impact){ bullet.visible=true; bullet.position.copy(slugAt(p,tgt,k)); bullet.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),dir); bullet.rotateZ(tt*40); p.bulletK=k; const sp=.5+fl*1.2; bullet.userData.streak.scale.set(sp,1,1); fxScale=lerp(fxScale,.16,Math.min(1,dt*6)); }
      else { bullet.visible=false; if(!p.hitDone){ p.hitDone=true; hitBoard(p,tgt); } fxScale=lerp(fxScale,tt<B.impact+1.2?.22:1,Math.min(1,dt*(tt<B.impact+1.2?8:1.5))); } }
    else fxScale=lerp(fxScale,1,Math.min(1,dt*4));
    if(tt>=(p.fire?B.impact+1.6:B.fire+.7)&&!fired.line){ fired.line=1; if(p.fire){ result.className="result bang"+(p.target.name.length>14?" long":""); result.textContent=`Bang! ${p.target.name} is released.`; live.textContent=result.textContent; } }
    /* recoil: the gun kicks and slides back across the felt, turning a little */
    if(p.slideV.lengthSq()>1e-6||p.slide.lengthSq()>1e-8){ p.slideV.multiplyScalar(Math.pow(.02,dt)); p.slide.addScaledVector(p.slideV,dt); spin.position.set(p.slide.x,.751,.02+p.slide.z); spin.rotation.y=p.yawTarget+p.slideSpin*(1-Math.exp(-(tt-B.fire)*3))*.001; if(p.spinKick){ spin.rotation.y=p.yawTarget+p.spinKick*(1-Math.pow(.02,tt-B.fire)); } }
    if(tt>=B.end) endTurn();
  }
  hammer.rotation.x=-hammerK*.62;
  recoil=Math.max(0,recoil-dt*8); lie.rotation.x=-recoil*.5; lie.position.z=-recoil*.02;
}
/* the flash layers ride on the muzzle, so the recoil slide does not leave them behind */
function placeFlash(mz,dir){ flashSprite.position.copy(mz).addScaledVector(dir,.03); flashCore.position.copy(mz).addScaledVector(dir,.015); petals.forEach((sp,i)=>sp.position.copy(mz).addScaledVector(dir,.025+i*.02)); flashSide.position.copy(mz).addScaledVector(dir,.02); }
function fireShot(p,tgt){ const mz=new T.Vector3(); if(handHold){ camera.updateMatrixWorld(); placeHand(); hand.updateMatrixWorld(); mz.copy(handMuzzleWorld()); } else muzzle.getWorldPosition(mz); p.mz=mz.clone(); const dir=tgt.clone().sub(mz).normalize();
  p.dir=dir.clone(); placeFlash(mz,dir); flashSprite.material.opacity=.6; flashSprite.scale.set(.09,.09,1); flashSprite.material.rotation=rnd()*6;
  flashCore.material.opacity=1; flashCore.scale.set(.055,.055,1);
  petals.forEach((sp,i)=>{ sp.material.opacity=1; const z=.12+i*.07; sp.scale.set(z,z,1); sp.material.rotation=rnd()*6; });
  flashSide.material.opacity=.4; flashSide.scale.set(.25,.25,1);
  flashLight.position.copy(mz).add(dir.clone().multiplyScalar(.22)).add(new T.Vector3(0,.1,0)); flashLight.intensity=REDUCED?2.5:PH?3.5:6; flashLight.color.set(L("#ffd6a8"));
  spray(mz.clone().add(dir.clone().multiplyScalar(.03)),dir,REDUCED?10:34,4.5);
  puff(mz,dir,14,.11,2.0,1.9); puff(mz,new T.Vector3(0,1,0),10,.09,.35,3.0); puff(mz.clone().add(dir.clone().multiplyScalar(.08)),dir,8,.07,2.8,1.2);
  const flat=new T.Vector3(dir.x,0,dir.z).normalize(); p.slideV.copy(flat).multiplyScalar(REDUCED?-.5:-1.3); p.slide.set(0,0,0); p.slideSpin=0; p.spinKick=(rnd()-.5)*.6; recoil=1;
  shake=REDUCED?0:.025; SFX.play("bang"); }
function hitBoard(p,tgt){ const b=boards[p.who]; const n=new T.Vector3(0,0,1).applyQuaternion(b.quaternion); burst(tgt,n); hitFlash.position.copy(tgt).addScaledVector(n,.02); hitFlash.material.opacity=1; hitFlash.scale.set(.12,.12,1); hitLight.position.copy(tgt).addScaledVector(n,.12); hitLight.intensity=REDUCED?1.5:4; spray(tgt,n,REDUCED?6:18,2.2); /* r87: no board kick on the hit (Nik: the boards never move); the splinters, flash and hole carry the impact */ const bub=p.target; const i=b.userData.bubbles.indexOf(bub); b.userData.hit={x:bub.x,y:bub.y,i}; drawBoard(p.who,b.userData.club); SFX.play("splinter"); puff(tgt,n,5,.08,.5,1.3); }

/* ================= camera ================= */
function stepCamera(t,dt){ const p=playing; const tt=p?t-p.t0:0; const drift=new T.Vector3(Math.sin(t*.23)*.05,Math.sin(t*.31)*.02,Math.cos(t*.19)*.04);
  let pos=camRest.clone().add(drift), look=lookRest.clone(), fov=fovRest;
  if(p){ const gw=spin.position.clone(); const who=p.who, sx=who==="D"?-1:1; const bw=boards[who].position.clone(); const tgt=boardTargetWorld(p.who,p.target);
    const topPos=PH?new T.Vector3(0,2.5,.22):new T.Vector3(0,2.25,.3), topLook=new T.Vector3(0,.75,.0);
    /* the close-up stands off the hammer side of the gun, low over the felt, telephoto */
    const yaw=p.yawTarget; const back=new T.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)); const side=new T.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
    const closePos=gw.clone().add(back.clone().multiplyScalar(.5)).add(side.clone().multiplyScalar(PH?-.26:-.3)).add(new T.Vector3(0,.5,0)), closeLook=gw.clone().add(new T.Vector3(0,.02,0)).add(back.clone().multiplyScalar(.03)); const closeFov=PH?22:18;
    gun.updateWorldMatrix(true,false); const inK=S(B.close+.5,B.inside-B.close-.5,tt); const insidePos=gun.localToWorld(new T.Vector3(-.078,.05,-.25).lerp(new T.Vector3(-.064,.034,-.215),ease.inOut(inK))), insideLook=gun.localToWorld(new T.Vector3(-.045,.0,-.012)); if(!PH) insideLook.y-=.0055; /* r87 polish: on a laptop the drum sits higher and a touch smaller, so the result line and the button never cover its lower chambers or the live round */ const insideFov=PH?26:22;
    /* a soft key light rides above the camera for the cylinder and hammer close-ups, so the steel has something to reflect */
    const keyOn=tt>=B.close&&tt<B.fire?1:0; closeKey.intensity=lerp(closeKey.intensity,keyOn*.5,Math.min(1,dt*6)); closeKey.position.copy(camPos).add(new T.Vector3(0,.09,0)); closeFill.intensity=lerp(closeFill.intensity,keyOn*.22,Math.min(1,dt*6)); closeFill.position.copy(camPos).add(new T.Vector3(-.12,-.02,0));
    const tensePos=gw.clone().add(back.clone().multiplyScalar(.26)).add(side.clone().multiplyScalar(PH?-.2:-.24)).add(new T.Vector3(0,.14,0));
    const hitPos=PH?new T.Vector3(sx*.25,1.5,2.1):new T.Vector3(sx*.6,1.35,1.9), hitLook=bw.clone().lerp(gw,.35);
    /* shooter's view: across the table from the target board, the hand and gun in the lower corner, the board ahead */
    const away=gw.clone().sub(bw); away.y=0; if(PH) away.multiplyScalar(.55).add(new T.Vector3(0,0,1)); away.normalize(); /* on the phone the shooter stands more in front of the board so the squad reads, not the frame edge */ const povPos=gw.clone().addScaledVector(away,PH?1.15:.95).add(new T.Vector3(0,.62,0)), povLook=bw.clone().add(new T.Vector3(0,PH?-.1:.04,0)); /* r87 polish: on the phone the board rides higher in the frame, so the raised gun sits under the squad instead of across it */ const povFov=PH?44:34;
    if(tt<B.spin+.3){ const k=ease.inOut(S(0,.6,tt)); pos.lerpVectors(pos,topPos,k); look.lerpVectors(look,topLook,k); }
    else if(tt<B.close){ pos.copy(topPos); look.copy(topLook); }
    else if(tt<B.inside){ /* look inside: the camera drops to the front of the cylinder and stares down the seven bores */
      const k=ease.inOut(S(B.close,.7,tt)); pos.lerpVectors(topPos,insidePos,k); look.lerpVectors(topLook,insideLook,k); fov=lerp(fovRest,insideFov,k); }
    else if(tt<B.hand+1.4){ /* one glide, no cut: from the drum close-up the camera rises and swings round behind the shooter while the hand comes up with the gun */
      const k=ease.inOut(S(B.inside,B.hand+1.4-B.inside,tt)); const mid=insidePos.clone().lerp(povPos,.5).add(new T.Vector3(0,PH?.55:.35,PH?.4:0)); const a=insidePos.clone().lerp(mid,k), b2=mid.clone().lerp(povPos,k); pos.lerpVectors(a,b2,k); look.lerpVectors(insideLook,povLook,ease.inOut(S(B.inside+.3,B.hand+1.0-B.inside,tt))); fov=lerp(insideFov,povFov,k); }
    else if(tt<B.fire+.25){ /* the shooter's view: a slow creep forward builds the tension until the shot */
      const k=ease.in(S(B.hand+1.4,B.fire-B.hand-1.4,tt)); pos.copy(povPos).addScaledVector(away,-k*.12); look.copy(povLook); fov=povFov-k*3; }
    else if(p.fire&&tt<B.impact){ /* ride the bullet: the camera leaves the shoulder and settles beside and behind the slug, looking along its path to the board */
      const dir=p.dir, sideB=new T.Vector3().crossVectors(dir,new T.Vector3(0,1,0)).normalize(); const bp=slugAt(p,tgt,p.bulletK||0); const chasePos=bp.clone().addScaledVector(dir,-.16).addScaledVector(sideB,sx*-.09).add(new T.Vector3(0,.05,0)); const chaseLook=bp.clone().addScaledVector(dir,.35);
      const k=ease.inOut(S(B.fire+.25,.9,tt)); const from=povPos.clone().addScaledVector(away,-.12); pos.lerpVectors(from,chasePos,k); look.lerpVectors(povLook,chaseLook,k); fov=lerp(povFov-3,PH?40:30,k); }
    else if(p.fire){ /* through the impact the camera keeps drifting forward and eases to a stop on the hole, then floats home */
      const dir=p.dir; const stop=tgt.clone().addScaledVector(dir,-.42).add(new T.Vector3(0,.06,0)); const arrive=tgt.clone().addScaledVector(dir,-.16).add(new T.Vector3(0,.05,0)); const k1=ease.out(S(B.impact,1.6,tt)); const holdPos=arrive.clone().lerp(stop,k1), holdLook=tgt.clone();
      const k2=ease.inOut(S(B.impact+2.2,B.end-B.impact-2.4,tt)); pos.lerpVectors(holdPos,camRest.clone().add(drift),k2); look.lerpVectors(holdLook,lookRest,k2); fov=lerp(PH?40:30,fovRest,k2); }
    else { const k2=ease.inOut(S(B.fire+1.2,B.end-B.fire-1.4,tt)); const pp=povPos.clone().addScaledVector(away,-.12); pos.lerpVectors(pp,camRest.clone().add(drift),k2); look.lerpVectors(povLook,lookRest,k2); fov=lerp(povFov-3,fovRest,k2); }
    /* top-down photo layer (if present) shows in the top shots, the model in the rest */
    const topK=tt<B.close?1:1-ease.inOut(S(B.close,.5,tt)); crossFade(topK); }
  else { crossFade(0); closeKey.intensity=lerp(closeKey.intensity,0,Math.min(1,dt*6)); closeFill.intensity=lerp(closeFill.intensity,0,Math.min(1,dt*6)); }
  fovNow=lerp(fovNow,fov,Math.min(1,dt*(p?12:3))); if(Math.abs(camera.fov-fovNow)>.01){ camera.fov=fovNow; camera.updateProjectionMatrix(); }
  camPos.lerp(pos,Math.min(1,dt*(p?14:2))); camLook.lerp(look,Math.min(1,dt*(p?14:2)));
  camera.position.copy(camPos).add(camTmp.set((rnd()-.5)*shake,(rnd()-.5)*shake,0)); camera.lookAt(camLook); placeHand(); }
function crossFade(k){ if(gunTop.visible){ gunTop.material.opacity=k; } gun.visible=(!gunTop.visible||k<.98)&&!(handHold&&handK>.55); }

/* ================= tick ================= */
let frames=0, fpsT=0, fps=0; const bubbleTmp=new T.Vector3();
function tick(draw){ const t=now(); let dt=Math.min(.05,t-last||.016); last=t; if(manual!==null) dt=1/30;
  stepTurn(dt); stepCamera(t,dt);
  /* lantern: living flame */
  const fl=.85+Math.sin(t*17)*.08+Math.sin(t*29.3)*.05+Math.sin(t*3.1)*.04; table.userData.lantern.intensity=1.5*fl; table.userData.flame.scale.set(.09*(fl+.05),.19*(fl+.12),1); table.userData.flame.material.rotation=Math.sin(t*9)*.08+Math.sin(t*23)*.04; table.userData.flame.position.x=Math.sin(t*11)*.003; table.userData.halo.material.opacity=.3*fl;
  const dtF=dt*fxScale;   /* slow motion for every effect while the camera rides the bullet */
  /* r87 (Nik 2026-10-30: bullet lighting on phone): in the bullet's slow motion the muzzle light and glow used to linger and
     keep swelling, a wash of yellow over the board on phones where the camera rides close. The light and the soft glows now
     fade at least at 60% of real speed and the glow stops growing at a set size; the hard flash core keeps the slow motion. */
  const dtL=Math.max(dtF,dt*(PH?1:.6));
  flashLight.intensity*=Math.pow(.0005,dtL); flashSprite.material.opacity*=Math.pow(.0001,dtL); if(flashSprite.scale.x<.22) flashSprite.scale.multiplyScalar(1+dtF*3); flashSide.material.opacity*=Math.pow(.001,dtL);
  if(playing&&playing.dir&&flashCore.material.opacity>.005){ const mzW=new T.Vector3(); if(handHold){ hand.updateMatrixWorld(); mzW.copy(handMuzzleWorld()); } else muzzle.getWorldPosition(mzW); placeFlash(mzW,playing.dir); }
  flashCore.material.opacity*=Math.pow(.00001,dtF); petals.forEach((sp,i)=>{ sp.material.opacity*=Math.pow(i?.0001:.00002,dtF); if(sp.scale.x<.55) sp.scale.multiplyScalar(1+dtF*(3-i)); sp.material.rotation+=dtF*(i?-1.5:2); }); hitFlash.material.opacity*=Math.pow(.0002,dtF); hitFlash.scale.multiplyScalar(1+dtF*5); hitLight.intensity*=Math.pow(.001,dtF);
  sparks.forEach(p=>{ if(p.life<=0){ p.s.visible=false; return; } p.life-=dtF; p.s.position.addScaledVector(p.v,dtF); p.v.y-=dtF*4; p.v.multiplyScalar(Math.pow(.2,dtF)); const k=p.life/p.max; p.s.material.opacity=Math.min(1,k*2); p.s.material.color.setRGB(1,.55+k*.45,.2+k*.6); });
  shake*=Math.pow(.01,dt);
  smokes.forEach(p=>{ if(p.life<=0){ p.s.visible=false; return; } p.life-=dtF; const k=1-p.life/p.max; p.s.position.addScaledVector(p.v,dtF); p.v.multiplyScalar(Math.pow(.25,dtF)); p.v.y+=dtF*.12; p.s.material.opacity=.42*Math.sin(Math.min(1,k*1.2)*Math.PI)*(1-k*.3); const sz=p.size*(.4+k*1.6); p.s.scale.set(sz,sz,1); p.s.material.rotation+=p.rot*dt; });
  splinters.forEach(p=>{ if(p.life<=0){ p.m.visible=false; return; } p.life-=dtF; p.m.position.addScaledVector(p.v,dtF); p.v.y-=dtF*5.5; p.v.multiplyScalar(Math.pow(.5,dtF)); p.m.rotation.x+=p.w.x*dtF; p.m.rotation.y+=p.w.y*dtF; if(p.m.position.y<.76&&Math.abs(p.m.position.x)<.75&&Math.abs(p.m.position.z)<.75){ p.m.position.y=.76; p.v.y*=-.25; p.v.x*=.6; p.v.z*=.6; p.w.multiplyScalar(.3); } if(p.m.position.y<0) p.life=0; });
  ["D","N"].forEach(k=>{ const b=boards[k].userData; b.joltV.addScaledVector(b.jolt,-dtF*90); b.joltV.multiplyScalar(Math.pow(.002,dtF)); b.jolt.addScaledVector(b.joltV,dtF); b.inner.rotation.set(b.jolt.z*.12,b.jolt.x*.18,b.jolt.x*.08); b.inner.position.set(0,0,-Math.abs(b.jolt.z)*.015); });
  { const a=dust.pos; for(let i=0;i<a.length/3;i++){ a[i*3]=dust.base[i*3]+Math.sin(t*.3+i)*.05; a[i*3+1]=dust.base[i*3+1]+Math.sin(t*.21+i*1.7)*.05; a[i*3+2]=dust.base[i*3+2]+Math.cos(t*.25+i*.6)*.05; } dust.p.geometry.attributes.position.needsUpdate=true; }
  if(draw){ renderer.render(scene,camera); frames++; if(manual===null){ const pt=performance.now(); if(pt-fpsT>1000){ fps=frames*1000/(pt-fpsT); frames=0; fpsT=pt; } } } }
function frame(){ if(manual===null) tick(true); requestAnimationFrame(frame); }

/* ================= sound (Web Audio, synthesized; off until turned on) ================= */
const SFX=(()=>{ let ctx=null, master=null, verb=null, on=false, noiseBuf=null;
  function init(){ if(ctx) return; const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return; ctx=new AC(); master=ctx.createGain(); master.gain.value=.8; const comp=ctx.createDynamicsCompressor(); comp.threshold.value=-12; comp.ratio.value=5; master.connect(comp); comp.connect(ctx.destination);
    noiseBuf=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate); const d=noiseBuf.getChannelData(0); let b=0; for(let i=0;i<d.length;i++){ const w=Math.random()*2-1; b=.97*b+.03*w; d[i]=w*.6+b*3; }
    verb=ctx.createConvolver(); const Ln=ctx.sampleRate*1.6, ir=ctx.createBuffer(2,Ln,ctx.sampleRate); for(let c=0;c<2;c++){ const x=ir.getChannelData(c); for(let i=0;i<Ln;i++) x[i]=(Math.random()*2-1)*Math.pow(1-i/Ln,2.6); } verb.buffer=ir; const vg=ctx.createGain(); vg.gain.value=.3; verb.connect(vg); vg.connect(master); }
  const nowT=()=>ctx.currentTime;
  function out(node,wet){ node.connect(master); if(wet) node.connect(verb); }
  function env(g,t,a,peak,d){ g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(peak,t+a); g.gain.exponentialRampToValueAtTime(0.0001,t+a+d); }
  function noise(t,dur,type,f0,f1,q,peak,a,wet){ const s=ctx.createBufferSource(); s.buffer=noiseBuf; s.loop=true; const f=ctx.createBiquadFilter(); f.type=type; f.Q.value=q; f.frequency.setValueAtTime(f0,t); f.frequency.exponentialRampToValueAtTime(f1,t+dur); const g=ctx.createGain(); env(g,t,a,peak,Math.max(.03,dur-a)); s.connect(f); f.connect(g); out(g,wet); s.start(t,Math.random()*2); s.stop(t+dur+.1); }
  function tone(t,type,f0,f1,dur,peak,a,wet){ const o=ctx.createOscillator(); o.type=type; o.frequency.setValueAtTime(f0,t); if(f1!==f0) o.frequency.exponentialRampToValueAtTime(f1,t+dur); const g=ctx.createGain(); env(g,t,a,peak,dur); o.connect(g); out(g,wet); o.start(t); o.stop(t+a+dur+.05); }
  const fx={
    spinStart:()=>{ const t=nowT(); noise(t,1.2,"bandpass",600,1800,1.2,.2,.03,true); },
    felt:(v)=>{ const t=nowT(); noise(t,.12,"lowpass",1400,500,.8,.12*v,.01,false); },
    click:(v)=>{ const t=nowT(); noise(t,.04,"highpass",3000,6000,1,.35*v,.001,true); tone(t,"square",2400,1800,.03,.08*v,.001,false); },
    snap:()=>{ const t=nowT(); noise(t,.08,"bandpass",900,2500,1,.6,.002,true); tone(t,"triangle",420,180,.12,.25,.002,true); },
    cock:()=>{ const t=nowT(); noise(t,.05,"highpass",2500,5000,1,.4,.001,true); noise(t+.07,.06,"bandpass",1500,3000,1.5,.5,.002,true); tone(t+.07,"square",900,500,.06,.1,.002,true); },
    heart:()=>{ const t=nowT(); for(let i=0;i<3;i++){ const tt=t+i*.5; tone(tt,"sine",62,38,.22,.5,.01,false); tone(tt+.16,"sine",56,34,.2,.35,.01,false); } },
    dry:()=>{ const t=nowT(); noise(t,.05,"bandpass",2000,4000,1.2,.7,.001,true); tone(t,"square",1500,700,.05,.14,.001,true); },
    bang:()=>{ const t=nowT(); tone(t,"sine",120,30,.9,1.0,.002,false); noise(t,.6,"lowpass",6000,120,.5,1.0,.001,true); noise(t,1.8,"highpass",2500,7000,.4,.25,.002,true); noise(t+.03,1.1,"bandpass",500,250,.8,.5,.01,true); },
    splinter:()=>{ const t=nowT(); for(let i=0;i<6;i++) noise(t+i*.02,.09,"highpass",3500,7000,.9,.3-i*.03,.001,true); tone(t,"triangle",900,400,.25,.2,.002,true); }
  };
  /* real recordings drop in without a code change: assets/sfx/<name>.mp3 (or .ogg/.wav) listed in platemap.json "sfx" replaces the synthesized cue of that name; the first argument stays a 0-1 volume */
  const loaded={};
  async function loadFiles(map){ if(!map) return; init(); if(!ctx) return; for(const [name,src] of Object.entries(map)){ try{ const buf=await fetch(src).then(r=>r.ok?r.arrayBuffer():null); if(buf) loaded[name]=await ctx.decodeAudioData(buf); }catch(e){} } if(on) roomTone(true); }
  function playFile(name,v){ const b=loaded[name]; if(!b) return false; const s=ctx.createBufferSource(); s.buffer=b; const g=ctx.createGain(); g.gain.value=(typeof v==="number"?v:1); s.connect(g); out(g,name==="bang"||name==="splinter"||name==="cock"); s.start(nowT()); return true; }
  let bed=null; function roomTone(v){ if(!ctx) return; if(v&&!bed&&loaded.roomTone){ bed=ctx.createBufferSource(); bed.buffer=loaded.roomTone; bed.loop=true; const g=ctx.createGain(); g.gain.value=.5; bed.connect(g); out(g,false); bed.start(nowT()); } if(!v&&bed){ try{ bed.stop(); }catch(e){} bed=null; } }
  return { get on(){ return on; }, enable(v){ on=v; if(v){ init(); if(ctx&&ctx.state==="suspended") ctx.resume(); } roomTone(v); }, loadFiles, play(name,...a){ if(!on||!ctx) return; try{ if(!playFile(name,a[0])) fx[name](...a); }catch(e){} } }; })();

/* ================= asset contract: each picture drops in without a code change ================= */
const PLATEMAP={}; let hasRoom=false, hasGunTop=false;
async function loadAssets(){ const pm=await fetch("platemap.json").then(r=>r.ok?r.json():null).catch(()=>null); Object.assign(PLATEMAP,pm||{}); if(PLATEMAP.sfx) SFX.loadFiles(PLATEMAP.sfx);
  const [room,top,flash,sq,handImg]=await Promise.all([loadImg("assets/RR_ROOM.jpg"),(PLATEMAP.gunTop&&PLATEMAP.gunTop.present?loadImg("assets/RR_GUN_TOP.png"):null),(PLATEMAP.flash&&PLATEMAP.flash.present?loadImg("assets/RR_FLASH.png"):null),fetch("assets/squads.json").then(r=>r.json()).catch(()=>null),loadImg("assets/RR_HAND.webp")]);
  { const hc=handImg?keyOutBlack(handImg):handPlaceholder(); hasHand=!!handImg; handAspect=hc.width/hc.height; const ht=new T.CanvasTexture(hc); ht.encoding=T.sRGBEncoding; ht.anisotropy=8; hand.material.map=ht; const hm=PLATEMAP.hand&&PLATEMAP.hand.muzzle; if(hm){ HAND_MUZZLE.u=hm[0]; HAND_MUZZLE.v=hm[1]; } }
  SQUADS=sq;
  if(room){ hasRoom=true; const bw=room.width/room.height; const pl=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:new T.Texture(room), toneMapped:false})); pl.material.map.encoding=T.sRGBEncoding; pl.material.map.needsUpdate=true; const H=(PLATEMAP.room&&PLATEMAP.room.height)||4.6; const cut=(PLATEMAP.room&&PLATEMAP.room.floorCut)||0; pl.scale.set(H*bw,H,1); pl.position.set(0,H/2-cut*H,(PLATEMAP.room&&PLATEMAP.room.z)||-3.9); scene.add(pl); scene.getObjectByName("backWall").visible=false; scene.fog=null; }
  if(top){ hasGunTop=true; const g=PLATEMAP.gunTop||{length:.3,offsetZ:.05,rotation:0}; gunTop.material.map=new T.Texture(top); gunTop.material.map.encoding=T.sRGBEncoding; gunTop.material.map.needsUpdate=true; gunTop.scale.set(g.length*top.width/top.height,g.length,1); gunTop.position.z=g.offsetZ; gunTop.rotation.z=g.rotation||0; gunTop.visible=true; }
  if(flash){ flashSprite.material.map=new T.Texture(flash); flashSprite.material.map.encoding=T.sRGBEncoding; flashSprite.material.map.needsUpdate=true; }
  setBoards(LAYOUT.danielClub,LAYOUT.nikClub); }
/* PMREM environment from the room itself, so the steel reflects the lamps and the wood */
function buildEnv(){ const pm=new T.PMREMGenerator(renderer); pm.compileEquirectangularShader(); const sc=new T.Scene(); sc.background=new T.Color(0x0b0705);
  const lampM=new T.MeshBasicMaterial({color:0xffd9a0}); for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; const s=new T.Mesh(new T.SphereGeometry(.4,12,8),lampM); s.position.set(Math.cos(a)*5,2.2+(i%2)*.6,Math.sin(a)*5); sc.add(s); }
  const fl=new T.Mesh(new T.PlaneGeometry(20,20),new T.MeshBasicMaterial({color:0x3a2412})); fl.rotation.x=-Math.PI/2; fl.position.y=-.5; sc.add(fl);
  const warm=new T.Mesh(new T.SphereGeometry(.6,12,8),new T.MeshBasicMaterial({color:0xffb060})); warm.position.set(-.5,.2,.2); sc.add(warm);
  const env=pm.fromScene(sc,.04).texture; scene.environment=env; pm.dispose(); }

/* ================= controls, hooks ================= */
/* r87 Team G embed (?embed=1, HO040-M1): the game sends {type:"cms-rr-setup", d, n, boards:{D,N}, seed,
   turns:[{fire,target,bulletChamber,stopChamber,hitSlot,aimSlot},{...}]}:
   both clubs, each manager's 15-player board for this season ({pos,name}: XI then 4 subs) and the outcomes from js/rosterRoulette.js.
   The button plays Daniel's turn, then Nik's, then hands back with "cms-rr-continue". The first tap turns sound on (it is the
   viewer's own tap inside this frame); the switch at the top turns it off. A board keeps the launch kit, and the launch rating
   and bench position of any player still on it; a new name shows no rating. */
const EMBED=qs.get("embed")==="1"; let GAME=null;
const toGame=(type,extra)=>{ try{ parent.postMessage(Object.assign({type},extra||{}),location.origin); }catch(e){} };
function embedLabel(){ if(!GAME||playing) return; cta.disabled=false; cta.classList.remove("busy"); cta.textContent=turn<2?(NAME[ORDER[turn%2]]+" spins"):"Continue"; }
if(EMBED){ document.body.classList.add("embed");
  addEventListener("message",e=>{ if(e.source!==parent||e.origin!==location.origin||!e.data||e.data.type!=="cms-rr-setup"||GAME) return; const g=e.data;
    /* red team RT5-FLOW-01: a page that cannot take the setup (its squads file failed, or a bad message) tells the game at
       once, so the game shows the result panel instead of a black stage with a dead button */
    if(!SQUADS||!g.boards||!Array.isArray(g.boards.D)||!Array.isArray(g.boards.N)||!Array.isArray(g.turns)||g.turns.length!==2){ toGame("cms-rr-error",{message:SQUADS?"setup":"squads"}); return; }
    const merge=(clubName,rows,formation)=>{ const base=clubByName(clubName), launch=[...base.xi,...base.subs]; const known=nm=>launch.find(r=>r[1]===nm);
      const rate=(r,k)=>Number.isInteger(r.rating)?r.rating:(k?k[2]:""); /* a signing or Special Player shows the overall the game sent */
      const xi=rows.slice(0,11).map(r=>[r.pos,r.name,rate(r,known(r.name))]), subs=rows.slice(11,15).map(r=>{ const k=known(r.name); return [r.position||(k?k[0]:"SUB"),r.name,rate(r,k)]; });
      return Object.assign({},base,{club:clubName,xi,subs,formation:typeof formation==="string"?formation:null}); };
    const dEntry=merge(g.d,g.boards.D,g.formations&&g.formations.D), nEntry=merge(g.n,g.boards.N,g.formations&&g.formations.N);
    if(Number.isInteger(g.seed)) seed=g.seed>>>0;   /* cosmetic draws (sparks, smoke) start from the Showdown's seed on both phones */
    GAME=g; SQUADS={source:SQUADS.source,clubs:[dEntry,nEntry,...SQUADS.clubs.filter(c=>c!==clubByName(g.d)&&c!==clubByName(g.n))]}; LAYOUT.danielClub=g.d; LAYOUT.nikClub=g.n; setBoards(g.d,g.n); result.textContent="One bullet. Seven chambers."; embedLabel(); toGame("cms-rr-armed"); });
  addEventListener("rr:end",e=>{ toGame("cms-rr-end",{detail:e.detail}); setTimeout(embedLabel,0); }); }
cta.addEventListener("click",()=>{ if(playing) return;
  if(EMBED){ if(!GAME) return; if(turn>=2){ if(cta.dataset.sent) return; cta.dataset.sent="1"; cta.disabled=true; toGame("cms-rr-continue"); return; }
    if(!SFX.on&&GAME.sound!==false){ SFX.enable(true); $("sound").textContent="Sound: on"; $("sound").setAttribute("aria-pressed","true"); }
    const o=GAME.turns[turn]; startTurn(o.fire===true,o.target||undefined,o); return; }
  startTurn(); });
$("sound").addEventListener("click",()=>{ const v=!SFX.on; SFX.enable(v); $("sound").textContent="Sound: "+(v?"on":"off"); $("sound").setAttribute("aria-pressed",String(v)); });
$("forceFire").addEventListener("click",()=>startTurn(true)); $("forceSafe").addEventListener("click",()=>startTurn(false));
$("reset").addEventListener("click",()=>{ turn=0; loaded=false; playing=null; done={D:null,N:null}; setBoards(LAYOUT.danielClub,LAYOUT.nikClub); slot(slotD,"At the table","wait"); slot(slotN,"Waits","wait"); setBusy(false); result.className="result"; result.textContent="One bullet. Seven chambers."; });
if(qs.get("tools")!=="1") document.body.classList.add("game");
window.__rr={ setBoards(d,n){ LAYOUT.danielClub=d; LAYOUT.nikClub=n; setBoards(d,n); }, play(o){ startTurn(o&&typeof o.fire==="boolean"?o.fire:undefined, o&&o.target); return playing; },
  clock(){ manual=performance.now()/1000; last=manual; }, advance(sec){ if(manual===null) this.clock(); const n=Math.round(sec*30); for(let i=0;i<n;i++){ manual+=1/30; tick(i===n-1); } }, get state(){ let aimDot=null; if(playing){ const mw=new T.Vector3(), md=new T.Vector3(); muzzle.getWorldPosition(mw); gun.getWorldDirection(md); const tg=boardTargetWorld(playing.who,playing.target).sub(mw); tg.y=0; tg.normalize(); md.y=0; md.normalize(); aimDot=md.dot(tg); } const ri=renderer.info; return {aimDot, calls:ri.render.calls, tris:ri.render.triangles, hasGunTop, turn, playing:!!playing, fire:playing?playing.fire:null, target:playing?playing.target.name:null, done, fps, hasRoom, bulletAt, chamber}; } };

const fontsReady=Promise.race([Promise.all(['700 30px "Barlow Condensed"','800 30px "Barlow Condensed"','600 30px "Barlow Condensed"','900 30px "Big Shoulders Display"','400 40px "Rye"'].map(f=>document.fonts.load(f))), new Promise(r=>setTimeout(r,3000))]);
Promise.all([fontsReady,loadAssets()]).then(()=>{ layout(); buildEnv(); { const opts=SQUADS?SQUADS.clubs.map(c=>`<option value="${c.club}">${c.club}</option>`).join(""):""; ["pickD","pickN"].forEach((id,i)=>{ const el=$(id); el.innerHTML=opts; el.value=i?LAYOUT.nikClub:LAYOUT.danielClub; el.addEventListener("change",()=>{ LAYOUT[i?"nikClub":"danielClub"]=el.value; setBoards(LAYOUT.danielClub,LAYOUT.nikClub); }); }); }
  camPos.copy(camRest); camLook.copy(lookRest); last=now(); window.__rrReady=true; requestAnimationFrame(frame); if(EMBED){ cta.disabled=true; cta.textContent="Loading…"; requestAnimationFrame(()=>toGame("cms-rr-ready")); } });
})();
</script>
</body>
</html>

````

## FILE: visual-assets/v10_1/roulette/platemap.json

````json
{
  "_about": "HO-040 Russian Roster Roulette (CC-010: no people). World units are metres; the felt is at y 0.75, the revolver lies at the table centre, Daniel's easel is LEFT (x negative), Nik's is RIGHT. Edit these numbers when a picture layer drops into assets/; no code change needed.",
  "room": {
    "file": "assets/RR_ROOM.jpg",
    "ticket": "1851-5",
    "z": -3.9,
    "height": 5.2,
    "floorCut": 0.405,
    "note": "16:9 marble cafe plate (Nik 29 Oct); replaces the 3D back wall. floorCut = fraction of the picture height hidden under the 3D floor so the counter base meets the floor line"
  },
  "gunTop": {
    "file": "assets/RR_GUN_TOP.png",
    "ticket": "1853-1",
    "length": 0.3,
    "offsetZ": 0.05,
    "rotation": 0,
    "note": "top-down revolver photo with alpha, barrel pointing UP in the picture; laid flat on the felt for the top-down spin shots and cross-faded with the 3D model at the camera cut. length = barrel-to-grip size in metres, offsetZ shifts the picture along the barrel so the muzzle lines up with the model's muzzle (0.19 m ahead of the cylinder axis), rotation in radians if the picture is not straight"
  },
  "flash": {
    "file": "assets/RR_FLASH.png",
    "ticket": "1851-4",
    "note": "additive sprite at the muzzle; procedural flash until it exists"
  },
  "boards": {
    "daniel": {
      "x": -1.08,
      "y": 1.0,
      "z": -0.05,
      "yaw": 0.55,
      "width": 0.62,
      "height": 0.62
    },
    "nik": {
      "x": 1.08,
      "y": 1.0,
      "z": -0.05,
      "yaw": -0.55,
      "width": 0.62,
      "height": 0.62
    },
    "phone": {
      "x": 0.5,
      "y": 1.02,
      "z": 0.12,
      "yaw": 0.48,
      "scale": 0.78
    }
  },
  "revolver": {
    "rest": [
      0,
      0.751,
      0.02
    ],
    "muzzle_ahead": 0.192,
    "note": "spins on the world Y axis; stops with the barrel on the target bubble (horizontal aim), slides back along the barrel line on a shot"
  },
  "cameras": {
    "desktop": {
      "rest": [
        0,
        1.62,
        2.5
      ],
      "look": [
        0,
        0.86,
        -0.1
      ],
      "fov": 36,
      "top": [
        0,
        2.25,
        0.3
      ],
      "closeFov": 12
    },
    "phone": {
      "rest": [
        0,
        1.8,
        2.75
      ],
      "look": [
        0,
        0.92,
        -0.1
      ],
      "fov": 54,
      "top": [
        0,
        2.5,
        0.22
      ],
      "closeFov": 16
    }
  },
  "hand": {
    "file": "assets/RR_HAND.webp",
    "ticket": "1854",
    "muzzle": [
      0.1,
      0.92
    ],
    "note": "gloved hand holding the revolver, black background keyed out in code; muzzle = where the flash sits (u from left, v from bottom)"
  },
  "sfx_note": "HO-047 (Team G r87 lead, 29 Oct 2026): made in-house, synthesised by assets/sfx/make_sfx.py (numpy; no samples or third-party recordings). WAV, not MP3, so every cue lands on its frame (MP3 adds ~25 ms of encoder silence). handUp and roomTone are the two extras; roomTone is a seamless 24 s loop at 22.05 kHz. A listed file replaces the synthesized cue of that name; the page loads every entry, so keep only sound names in \"sfx\".",
  "sfx": {
    "spinStart": "assets/sfx/spin_start.wav",
    "felt": "assets/sfx/felt.wav",
    "click": "assets/sfx/click.wav",
    "cock": "assets/sfx/cock.wav",
    "heart": "assets/sfx/heart.wav",
    "dry": "assets/sfx/dry.wav",
    "bang": "assets/sfx/bang.wav",
    "splinter": "assets/sfx/splinter.wav",
    "handUp": "assets/sfx/hand_up.wav",
    "roomTone": "assets/sfx/room_tone.wav"
  }
}

````

## FILE: css/v10Roulette.css

````css
/* r87 Russian Roster Roulette season step (js/rosterRouletteStep.js): board editor, waiting, release panels.
   The marble card of the Start / Join overlays (css/r78-marble-surfaces.css 7d), standing on its own here so it never
   depends on css/remoteJoining.css being loaded. No scrim, no dimming (HO-027): the card is opaque, the page behind stays. */
#rrStepPanel.rrStepOverlay {
  position: fixed;
  inset: 0;
  z-index: 96; /* above the roulette stage (95), so the result can stand on the finished scene */
  display: grid;
  place-items: center;
  padding: max(16px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) max(16px, env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px));
  background: transparent;
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
  overflow: auto;
}
/* No scene behind the card: the room photo fills the screen (opaque, not a scrim), so no page shows around the card. */
:root:not(#r78):not(#r78) #rrStepPanel.rrStepOverlay.rrStepRoom { /* beats the r78 overlay reset (7d) */
  background: #050403 url("../visual-assets/v10_1/roulette/assets/RR_ROOM.jpg") center / cover no-repeat;
}
#rrStepPanel .rrStepShell {
  width: min(640px, 100%);
  max-height: calc(100dvh - 32px);
  display: flex;
  flex-direction: column;
  color: var(--r78-ivory, #f2ebdd);
  background: #0d0b09 url("r78-marble-tile.webp") 0 0 / 256px 256px repeat;
  border: 1px solid var(--r78-gold-edge, #d4a017);
  border-radius: var(--sd-radius, 3px);
  box-shadow: inset 0 0 0 3px rgba(17, 15, 12, .9), inset 0 0 0 4px rgba(242, 196, 91, .3), 0 0 0 1px #000, 0 10px 24px rgba(0, 0, 0, .55);
}
#rrStepPanel .remoteJoiningHeader {
  padding: 14px 18px 12px;
  color: var(--r78-gold, #f2c45b);
  border-bottom: 1px solid rgba(242, 196, 91, .35);
  font: 600 14px/1.2 var(--r78-font-label, "Barlow Condensed", "Arial Narrow", sans-serif);
  letter-spacing: .16em;
}
#rrStepPanel .rrStepBody {
  display: grid;
  gap: 12px;
  padding: 16px 18px 18px;
  overflow: auto;
  min-height: 0;
}
#rrStepPanel .rrStepTitle {
  margin: 0;
  color: var(--sd-gold-300, #ffd34d);
  font: 700 clamp(26px, 5vw, 34px)/1.05 var(--r78-font-label, "Barlow Condensed", "Arial Narrow", sans-serif);
  letter-spacing: .02em;
  text-transform: uppercase;
  text-wrap: balance;
}
#rrStepPanel :is(.rrStepLine, .rrStepNote, .rrStepError) {
  margin: 0;
  font: 500 16px/1.4 var(--r78-font-body, "Barlow", system-ui, sans-serif);
}
#rrStepPanel .rrStepLine { color: var(--r78-ivory, #f2ebdd); }
#rrStepPanel .rrStepNote {
  color: var(--r78-ivory-2, #c9bfa8);
  padding-left: 12px;
  border-left: 3px solid var(--r78-gold-edge, #d4a017);
}
#rrStepPanel .rrStepError { color: #ff9b85; min-height: 1.4em; }
#rrStepPanel .rrStepError:empty { min-height: 0; }
#rrStepPanel .rrStepActions { display: flex; flex-wrap: wrap; gap: 10px; padding-top: 4px; }
#rrStepPanel .rrStepActions > button { flex: 1 1 220px; min-height: 48px; margin: 0; }
/* Polish RR-4: the panel's buttons in the v10 marble black-and-gold (the values of css/r78-marble-surfaces.css .r78-btn,
   copied so this sheet stands alone): primary = polished gold, back = black face with a gold edge. They replace the legacy
   slate .menuButton and the near-white .backButton inside this panel only. */
#rrStepPanel .rrStepActions > button.menuButton, #rrStepPanel .rrStepActions > button.backButton {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 22px;
  border: 1px solid var(--r78-gold, #f2c45b);
  border-left-width: 1px;
  border-radius: var(--sd-radius, 3px);
  font: 700 17px/1.1 var(--r78-font-label, "Barlow Condensed", "Arial Narrow", sans-serif);
  letter-spacing: .12em;
  text-transform: uppercase;
  text-align: center;
  white-space: normal;
  cursor: pointer;
  transform: none;
}
#rrStepPanel .rrStepActions > button.menuButton.rrStepPrimary {
  color: var(--sd-text-on-gold, #07080a);
  background: var(--sd-gold-metal, linear-gradient(180deg, #fff3b0 0%, #ffd34d 35%, #d4a017 70%, #8a6a12 100%));
  border-color: #f5d77a;
  box-shadow: inset 0 1px 0 rgba(255, 248, 214, .8), inset 0 -2px 0 rgba(138, 106, 18, .6);
  text-shadow: 0 1px 0 rgba(255, 241, 184, .45);
}
#rrStepPanel .rrStepActions > button.backButton {
  color: var(--r78-gold-strong, #ffd34d);
  background: linear-gradient(180deg, #17140e, #070605);
  border-color: var(--r78-gold-edge, #d4a017);
  box-shadow: inset 0 1px 0 rgba(242, 196, 91, .25), 0 0 0 1px #000;
  text-shadow: none;
}
#rrStepPanel .rrStepActions > button:hover:not(:disabled) { filter: brightness(1.08); }
#rrStepPanel .rrStepActions > button:focus-visible { outline: 2px solid #fff3bd; outline-offset: 2px; }

/* board editor: XI then subs, one row per player (position, name); the slot shot last season is marked in gold */
#rrStepPanel .rrBoardForm { display: grid; gap: 14px; }
#rrStepPanel .rrBoardGroup {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 10px 12px 12px;
  border: 1px solid rgba(242, 196, 91, .3);
  border-top: 2px solid var(--r78-gold-edge, #d4a017);
  background: rgba(7, 8, 10, .6);
  min-width: 0;
}
#rrStepPanel .rrBoardGroup legend {
  padding: 0 6px;
  color: var(--r78-gold, #f2c45b);
  font: 600 13px/1 var(--r78-font-label, "Barlow Condensed", "Arial Narrow", sans-serif);
  letter-spacing: .16em;
}
#rrStepPanel .rrBoardRow { display: grid; grid-template-columns: 76px minmax(0, 1fr); gap: 8px; align-items: center; }
#rrStepPanel :is(.rrBoardPos, .rrBoardName) {
  min-height: 40px;
  box-sizing: border-box;
  color: var(--r78-ivory, #f2ebdd);
  background: #07080a;
  border: 1px solid rgba(242, 196, 91, .35);
  border-radius: var(--sd-radius, 3px);
  font: 600 16px/1 var(--r78-font-label, "Barlow Condensed", "Arial Narrow", sans-serif);
  letter-spacing: .04em;
}
#rrStepPanel .rrBoardPos { padding: 0 6px; }
#rrStepPanel .rrBoardSub { display: grid; place-items: center; color: var(--r78-ivory-2, #c9bfa8); }
#rrStepPanel .rrBoardName { width: 100%; padding: 0 10px; font: 500 16px/1 var(--r78-font-body, "Barlow", system-ui, sans-serif); letter-spacing: 0; }
#rrStepPanel :is(.rrBoardPos, .rrBoardName):focus-visible { outline: 2px solid #fff3bd; outline-offset: 1px; }
#rrStepPanel .rrBoardRowShot .rrBoardName { border-color: var(--r78-gold, #f2c45b); box-shadow: inset 0 0 0 1px var(--r78-gold, #f2c45b); }
#rrStepPanel .rrBoardRowShot .rrBoardName::placeholder { color: var(--r78-gold, #f2c45b); }

@media (max-width: 520px) {
  #rrStepPanel .rrBoardRow { grid-template-columns: 64px minmax(0, 1fr); }
  #rrStepPanel .rrStepActions > button { flex-basis: 100%; }
}

````

## FILE: js/productionSharedCareerStart.js

````js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedCareerStart=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const PANEL_ID="productionSharedCareerStartOverlay";
  const CONTROL_ID="continueClubAssignment";
  const POLL_MS=15000;
  // Job 33 (R1): once this manager has acknowledged, read every 3 s for at most 3 minutes while waiting on the rival.
  const FAST_POLL_MS=3000,FAST_POLL_WINDOW_MS=180000;
  let transferOpening=false;const TRANSFER_OPEN_LIMIT_MS=120000;
  let installed=false,busy=false,revealStage=null,pollTimer=null,setupApi=null,provider=null,view=null,lastError="",operationTail=Promise.resolve(),refreshPromise=null,openPromise=null,readyKey="",fastWaitKey="",fastWaitSince=0,autoContinueKey="";

  function pcstCreate(tag,className,text){const node=root.document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node;}
  function pcstReport(context,error){if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
  async function pcstLoadScript(key,path,ready){if(ready())return ready();if(typeof root.loadRuntimeScript!=="function")throw new Error("Release-owned runtime loader is unavailable.");await root.loadRuntimeScript(key,path,ready);return ready();}
  async function pcstEnsureDependencies(){
    if(typeof root.loadRuntimeStyle==="function")await root.loadRuntimeStyle("ssjr-career-start","css/remoteJoining.css");
    await pcstLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
    await pcstLoadScript("ssjr-shared-setup-protocol","js/sharedShowdownSetup.js",()=>root.CareerModeSharedShowdownSetup);
    await pcstLoadScript("ssjr-shared-setup-catalog","js/sharedShowdownCatalog.js",()=>root.CareerModeSharedShowdownCatalog);
    await pcstLoadScript("ssjr-spark-shared-setup","js/sparkSharedShowdownSetup.js",()=>root.CareerModeSparkSharedShowdownSetup);
    await pcstLoadScript("ssjr-career-start-protocol","js/sharedCareerStart.js",()=>root.CareerModeSharedCareerStart);
    await pcstLoadScript("ssjr-career-start-provider","js/sparkSharedCareerStart.js",()=>root.CareerModeSparkSharedCareerStart);
    await pcstLoadScript("ssjr-production-transfer-challenge","js/productionSharedTransferChallenge.js",()=>root.CareerModeProductionSharedTransferChallenge);
    await pcstLoadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
    setupApi=root.CareerModeProductionSharedShowdownSetup;provider=root.CareerModeSparkSharedCareerStart;
    if(!setupApi||typeof setupApi.getState!=="function"||typeof setupApi.refresh!=="function")throw new Error("Shared Setup authority is unavailable for Career Start.");
    if(!provider||typeof provider.read!=="function"||typeof provider.acknowledge!=="function")throw new Error("Shared Career Start provider is unavailable.");
    // r86: the Special Player lines (each player's original club) are drawn with the panel's first frame. Optional: a failure
    // only leaves the lines out.
    try{await pcstLoadScript("special-player-chip","js/specialPlayerChip.js",()=>root.CareerModeSpecialPlayerChip);await root.CareerModeSpecialPlayerChip.ensure();}catch(_error){}
  }
  // r86 Special Player: the club he played for in FIFA 17 at launch, so each manager can sign him in-game. Only a Showdown
  // confirmed on r86 or later has one (no line otherwise).
  function pcstSpecialPlayers(){try{const chip=root.CareerModeSpecialPlayerChip,state=pcstSetupState();return chip&&state&&Number.isFinite(state.setupUpdatedAtMs)?chip.forShowdown(state.rivalryId,state.setupUpdatedAtMs):null;}catch(_error){return null;}}
  function pcstSetupState(){try{return setupApi&&setupApi.getState?setupApi.getState():root.CareerModeProductionSharedShowdownSetup?.getState?.()||null;}catch(_error){return null;}}
  function pcstConfirmed(){const state=pcstSetupState();return Boolean(state&&state.ready===true&&state.setup&&state.setup.phase==="SHOWDOWN_CONFIRMED"&&state.setup.revision===6&&state.managerRole&&state.rivalryId&&state.sessionId&&state.deviceId);}
  function pcstReady(){return Boolean(view&&view.state&&view.state.phase==="CAREER_START_READY");}
  function pcstStopPolling(){if(pollTimer!==null&&typeof root.clearInterval==="function"){root.clearInterval(pollTimer);pollTimer=null;}return true;}
  function pcstWithTimeout(task,request){
    if(request)return task(request);
    let timer;const error=Object.assign(new Error("Career Start took too long. Check your connection and tap again."),{code:"CAREER_START_TIMEOUT"});
    // r87: the Russian Roster Roulette between Career Start and the Transfer Challenge runs at the manager's pace, so the 25 s
    // limit waits while it is on screen (js/rosterRouletteStep.js active()). Fable F6-09: it also waits while the Transfer
    // Challenge open is still in flight before the roulette shows (a cold cache loads its files), up to 2 minutes in all.
    const began=Date.now();
    const timeout=new Promise((_,reject)=>{const fire=()=>{if(root.CareerModeRosterRouletteStep?.active?.()||(transferOpening&&Date.now()-began<TRANSFER_OPEN_LIMIT_MS)){timer=root.setTimeout(fire,25000);return;}reject(error);};timer=root.setTimeout(fire,25000);});
    let active=true;request={wait:promise=>Promise.race([promise,timeout]).then(value=>{if(!active)throw error;return value;})};
    return Promise.race([Promise.resolve().then(()=>task(request)),timeout]).catch(failure=>{if(failure===error){lastError=error.message;if(task===pcstOpenPanelNow)pcstEnsurePanel();pcstRender();pcstDecorateControl();}throw failure;}).finally(()=>{active=false;root.clearTimeout(timer);});
  }
  function pcstSerialize(task){const run=operationTail.then(task,task);operationTail=run.then(()=>undefined,()=>undefined);return run;}
  function pcstDeactivateSetupPresentation(){const presentation=root.CareerModeProductionSharedShowdownPresentation;if(presentation&&typeof presentation.deactivate==="function")presentation.deactivate();return true;}
  function pcstLeagueName(id){try{const item=typeof root.getLeagueById==="function"&&root.getLeagueById(id);if(item&&item.name)return item.name;}catch(_error){}return String(id||"").replaceAll("_"," ").replace(/\b\w/g,char=>char.toUpperCase());}
  function pcstRandomOperationId(){if(!root.crypto||typeof root.crypto.getRandomValues!=="function")throw new Error("Secure randomness is unavailable.");const bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);return `career_start_op_${Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("")}`;}
  // Job 33 (R1): a fast waiting read (light) reuses the already-confirmed Setup instead of re-reading it.
  async function pcstProviderOptions(light=false,request){
    await request.wait(pcstEnsureDependencies());if(!(light===true&&pcstConfirmed()))await request.wait(setupApi.refresh());const state=setupApi.getState();if(!state||state.ready!==true||!state.setup||state.setup.phase!=="SHOWDOWN_CONFIRMED"||state.setup.revision!==6)throw new Error("Both managers must finish Shared Setup before Career Start.");
    const runtime=root.CareerModeProductionFirebaseRuntime,services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await request.wait(runtime.ensureAccountServices()));
    if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)throw new Error("Connected account services are unavailable.");
    return {state,options:{user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:state.rivalryId,sessionId:state.sessionId,deviceId:state.deviceId,cryptoImpl:root.crypto}};
  }
  function pcstSetupKey(state){return state&&state.ready===true&&state.rivalryId&&state.managerRole&&state.setup?`${state.rivalryId}|${state.managerRole}|${JSON.stringify(state.setup)}`:"";}
  function pcstApplyView(result,state){
    view={...result,setup:state.setup};readyKey=pcstReady()?pcstSetupKey(state):"";lastError="";pcstRender();pcstDecorateControl();pcstNoteSeasonStart(state);if(pcstReady()){pcstStopPolling();pcstScheduleAutoContinue();}return view;
  }
  // r87 RE-05: Career Start READY is where season 1 starts for the reads meter; the reads before it (Home, pairing, setup, Special
  // Player, this panel) are setup, never part of a season's cost (js/sparkPrivatePairing.js, noteSeasonStart).
  function pcstNoteSeasonStart(state){if(!pcstReady()||!state?.rivalryId)return;try{root.CareerModeFirestoreBudget?.noteSeasonStart?.(`${state.rivalryId}|1`);}catch(_error){}}
  function pcstPanelOpen(){const overlay=root.document&&root.document.getElementById(PANEL_ID);return Boolean(overlay&&!overlay.classList.contains("hidden"));}
  // Job 33 (R4b): once BOTH managers have attested (CAREER_START_READY), an open Career Start moves on to the Transfer
  // Challenge by itself. Navigation only: each manager's own I STARTED AT tap is still required, and the button stays as a fallback.
  function pcstAutoContinueKey(){return view&&view.state&&view.setup?`${view.setup.rivalryId||pcstSetupState()?.rivalryId||""}|${view.state.revision}`:"";}
  function pcstScheduleAutoContinue(){if(typeof root.setTimeout==="function")root.setTimeout(()=>void pcstAutoContinue(),0);else void pcstAutoContinue();}
  async function pcstAutoContinue(){
    if(busy||!pcstReady()||!pcstPanelOpen())return false;const key=pcstAutoContinueKey();if(!key||key===autoContinueKey)return false;
    autoContinueKey=key;return pcstOpenTransferChallenge();
  }
  function pcstOwnAcknowledged(result){
    const role=result?.managerRole,state=result?.state;
    return Boolean(role&&state&&Array.isArray(state.acknowledgedRoles)&&state.acknowledgedRoles.includes(role));
  }
  // CAREER_START_READY is final for one confirmed Shared Setup, and the Transfer and Season Result providers re-check it inside
  // their own transactions. Transfer and Season Results call this before every read and publish, so re-reading it there only
  // added a request that could fail ("Career Start could not be read.") and block a publish. Reuse it for the same Setup.
  function pcstRefresh(light=false,request){
    if(pcstReady()&&readyKey&&pcstConfirmed()&&readyKey===pcstSetupKey(pcstSetupState()))return Promise.resolve(view);
    if(refreshPromise)return refreshPromise;
    const run=pcstSerialize(()=>pcstWithTimeout(async request=>{const ctx=await pcstProviderOptions(light===true,request),result=await request.wait(provider.read(ctx.options));if(!result||result.ok!==true)throw Object.assign(new Error("Career Start could not be read."),{code:result&&result.code});return pcstApplyView(result,ctx.state);},request));
    refreshPromise=run.finally(()=>{if(refreshPromise===wrapped)refreshPromise=null;});
    const wrapped=refreshPromise;
    return wrapped;
  }
  async function pcstAcknowledge(){
    if(busy)return false;
    busy=true;lastError="";pcstRender();
    const operationId=pcstRandomOperationId();
    try{
      return await pcstSerialize(async()=>{
        return pcstWithTimeout(async request=>{
        const ctx=await pcstProviderOptions(false,request);
        let current=await request.wait(provider.read(ctx.options));
        if(!current||current.ok!==true)throw Object.assign(new Error("Career Start could not be read."),{code:current&&current.code});
        if(current?.state?.phase==="CAREER_START_READY"||pcstOwnAcknowledged(current)){pcstApplyView(current,ctx.state);return true;}
        for(let attempt=0;attempt<2;attempt+=1){
          const result=await request.wait(provider.acknowledge({...ctx.options,operationId,baseRevision:current.revision||0}));
          if(result&&result.ok===true){pcstApplyView(result,ctx.state);return true;}
          const code=result&&result.code||"CAREER_START_PROVIDER_FAILED";
          // Job 21: two managers acknowledging at once -> the loser is rejected by the Rules (permission-denied); treat it like a stale revision (re-read, retry once).
          if(["CAREER_START_STALE_BASE_REVISION","CAREER_START_ROLE_ALREADY_ACKNOWLEDGED","CAREER_START_ALREADY_READY","permission-denied","firestore/permission-denied","permission_denied"].includes(code)){
            const refreshed=await request.wait(provider.read(ctx.options));
            if(!refreshed||refreshed.ok!==true)throw Object.assign(new Error("Career Start could not be reconciled after another acknowledgement."),{code:refreshed&&refreshed.code||code});
            current=refreshed;
            if(current?.state?.phase==="CAREER_START_READY"||pcstOwnAcknowledged(current)){pcstApplyView(current,ctx.state);return true;}
            if((code==="CAREER_START_STALE_BASE_REVISION"||code==="permission-denied"||code==="firestore/permission-denied"||code==="permission_denied")&&attempt===0)continue;
          }
          throw Object.assign(new Error("Career Start acknowledgement was rejected."),{code});
        }
        throw Object.assign(new Error("Career Start acknowledgement could not be reconciled."),{code:"CAREER_START_ACK_RETRY_EXHAUSTED"});
        });
      });
    }catch(error){
      lastError=pcstErrorText(error,"Your Career Start was not recorded.");
      pcstReport("Unable to acknowledge Shared Career Start",error);
      return false;
    }finally{
      busy=false;pcstRender();if(pcstReady())pcstScheduleAutoContinue();
    }
  }
  async function pcstOpenTransferChallenge(){
    if(busy||!pcstReady())return false;
    busy=true;pcstRender();
    try{
      await pcstEnsureDependencies();
      const transfer=root.CareerModeProductionSharedTransferChallenge;
      if(!transfer||typeof transfer.install!=="function"||typeof transfer.open!=="function")throw new Error("Shared Transfer Challenge is unavailable.");
      transfer.install();
      transferOpening=true;
      const opened=await transfer.open();
      transferOpening=false;
      // r87: the manager left the Russian Roster Roulette for Showdown Home; it opens again from there. Not a failure.
      if(opened!==true&&root.CareerModeRosterRouletteStep?.wentHome?.()){pcstClosePanel();return false;}
      // The roulette could not start (Setup not read, its files not loaded): its own reason, not a generic one (Fable F2-05).
      const reason=opened!==true&&typeof transfer.rouletteError==="function"?transfer.rouletteError():"";
      if(reason){lastError=reason;return false;}
      if(opened!==true)throw new Error("Shared Transfer Challenge could not be opened from this Career Start state.");
      pcstClosePanel();
      return true;
    }catch(error){
      lastError=pcstErrorText(error,"The Transfer Challenge could not be opened.");
      pcstReport("Unable to continue to Shared Transfer Challenge",error);
      return false;
    }finally{
      busy=false;transferOpening=false;pcstRender();
    }
  }
  // Keep provider codes in diagnostics, not in the sentence shown beneath the Career Start button.
  function pcstErrorText(error,fallback){
    if(error?.code==="CAREER_START_TIMEOUT")return error.message;
    const quota=root.CareerModeFirestoreBudget?.quotaMessage?.(error);if(quota)return quota;
    const code=String(error?.code||""),message=String(error?.message||"");
    const plain=error&&error.providerResult!==true&&message&&message!==code&&!/\b\w+(?:[-_/]\w+)+\b/.test(message)?message:fallback;
    return `${plain} Please try again.`;
  }
  function pcstManagerLabel(role){try{const showdown=typeof currentShowdown!=="undefined"?currentShowdown:null;const name=showdown&&showdown.managers&&showdown.managers[role];if(name)return name;}catch(_error){}return role==="playerOne"?"PLAYER ONE":"PLAYER TWO";}
  function pcstRow(label,value,state){const item=pcstCreate("div","settingsInfoRow");item.dataset.careerRow=state||"";item.append(pcstCreate("span","",label),pcstCreate("strong","",value));return item;}
  // r75: a screen that starts or stops waiting on the partner registers its live listener at once (on the render that
  // shows the new state) instead of on the next 3 s check, so the partner's move is seen as soon as it lands.
  let pcstWatchedKey=null;
  function pcstWatchSync(){let key="";try{key=pcstWaitingKey()+"|"+(root.document?.visibilityState||"");}catch(_error){key="";}if(key===pcstWatchedKey)return;pcstWatchedKey=key;try{pcstWatchWait();}catch(_error){}}
  // HO-049 item 4 · Career Start option B (Nik picked B, 2026-10-31; spec CAREER_START_B_SPEC.md). On the Club Assignment
  // screen Career Start is its own stage on the Club plate, never a box over the wordmark or the faces: Daniel (left) and
  // Nik (right) each hold his club's crest and name inside his pack face; a narrow marble pillar between them (desktop) or
  // one marble panel under the packs (phone) holds the words; the two buttons sit on the lower deck (desktop) or at the
  // panel's foot (phone). Layout only: the same nodes, texts, buttons, listeners, status and reads as the card above. Any
  // other screen keeps the card. No dim, no scrim, no flash: the stage is set in the same task that shows the panel, and
  // its styles arrive with css/remoteJoining.css, which the panel loads before it opens.
  // Nik's rule: the crest and the name ALWAYS fit inside the pack frame. Inner box = the frame inset 10% on each side (with
  // overflow hidden as a safety net); name clamp(11px, innerH x 0.16, 22px) on one line (a name wider than the box shrinks
  // until it fits); crest = square floor(min(innerW, innerH - 1.5 x label)), contain fit.
  const STAGE_HOST="clubWheelScreen",STAGE_ATTR="careerStartStage";
  // The two painted packs on ENV_CLUB_PHONE_V2 (1179x2096 plate px), drawn centre top at max(100vw, 100svh x 1179/2096).
  const PHONE_PLATE=Object.freeze({w:1179,h:2096,packs:Object.freeze([Object.freeze([236,556]),Object.freeze([668,996])]),top:584,bottom:924});
  let stageWatch=null;
  function pcstFitHold(frame){
    const ix=frame.w*.1,iy=frame.h*.1,w=frame.w-2*ix,h=frame.h-2*iy,label=Math.max(11,Math.min(22,h*.16));
    return {x:frame.x+ix,y:frame.y+iy,w,h,label,crest:Math.max(0,Math.floor(Math.min(w,h-label*1.5))),gap:label*.2};
  }
  function pcstStageHost(){
    const doc=root.document,host=doc&&typeof doc.getElementById==="function"?doc.getElementById(STAGE_HOST):null;
    if(!host||!host.classList||host.classList.contains("hidden")||!host.classList.contains("cl-on"))return null;
    return doc.documentElement&&doc.documentElement.dataset&&doc.documentElement.dataset.v10Screen===STAGE_HOST?host:null;
  }
  // desktop: Team V's Club layout places .clubPackStage on each held pack. phone (upright phone or tablet): the packs are
  // painted on the plate behind the screen. band (sideways phone): the plate fills the left band (cover, centre top).
  function pcstStageMode(host){
    const scene=host.querySelector(".clPhoneScene");
    if(scene&&typeof root.getComputedStyle==="function"&&root.getComputedStyle(scene).display!=="none")return root.innerWidth>root.innerHeight?"band":"phone";
    return host.querySelectorAll(".clubPackStage").length===2?"desktop":null;
  }
  function pcstStageBox(node,origin){const r=node.getBoundingClientRect();return {x:r.left-origin.left,y:r.top-origin.top,w:r.width,h:r.height};}
  function pcstStageFrames(overlay,host,mode,origin){
    if(mode==="desktop")return [...host.querySelectorAll(".clubPackStage")].slice(0,2).map(node=>pcstStageBox(node,origin));
    let k,x0,y0;
    if(mode==="phone"){const box=pcstStageBox(host,origin),probe=overlay.querySelector(".pcstPlateProbe"),width=probe?probe.getBoundingClientRect().width:Math.max(box.w,root.innerHeight*PHONE_PLATE.w/PHONE_PLATE.h);k=width/PHONE_PLATE.w;x0=box.x+(box.w-width)/2;y0=box.y;}
    else{const band=pcstStageBox(host.querySelector(".clPhoneScene"),origin);k=Math.max(band.w/PHONE_PLATE.w,band.h/PHONE_PLATE.h);x0=band.x+(band.w-PHONE_PLATE.w*k)/2;y0=band.y;}
    return PHONE_PLATE.packs.map(([a,b])=>({x:x0+a*k,y:y0+PHONE_PLATE.top*k,w:(b-a)*k,h:(PHONE_PLATE.bottom-PHONE_PLATE.top)*k}));
  }
  function pcstStageHold(role,club){
    const hold=pcstCreate("div","pcstHold");hold.dataset.side=role;hold.setAttribute("aria-hidden","true");
    const crest=pcstCreate("div","pcstHoldCrest");try{if(typeof root.getClubCrestSvg==="function")crest.innerHTML=root.getClubCrestSvg(club);}catch(_error){}
    hold.append(crest,pcstCreate("div","pcstHoldName",club));return hold;
  }
  // stageFailed: the Club screen's visuals could not load (a missing map, script or style), so Career Start shows on its own
  // black-and-gold marble plate (mode "fallback") with every control, plus RETRY, instead of waiting behind an invisible panel.
  let stageRetry=null,stageRetries=0,stageFailed=false,retryFailed=false;
  function pcstStageGiveWay(){
    if(stageFailed)return;stageFailed=true;
    const overlay=root.document&&root.document.getElementById(PANEL_ID);if(overlay&&!overlay.classList.contains("hidden"))pcstRender();
  }
  function pcstStageRetry(){
    // Where the Club screen exists, for at most 30 s per open; after that (or with no Club screen at all) the marble fallback.
    if(stageRetry||typeof root.setTimeout!=="function")return;
    if(!root.document?.getElementById?.(STAGE_HOST)||stageRetries>=100){root.setTimeout(pcstStageGiveWay,0);return;}
    stageRetries+=1;
    stageRetry=root.setTimeout(()=>{stageRetry=null;const overlay=root.document&&root.document.getElementById(PANEL_ID);if(overlay&&!overlay.classList.contains("hidden")&&!overlay.classList.contains("pcstStage"))pcstRender();},300);
  }
  function pcstStageOff(overlay){
    try{
      const doc=root.document;pcstStageWatch(false);
      if(doc&&doc.documentElement&&doc.documentElement.dataset)delete doc.documentElement.dataset[STAGE_ATTR];
      if(overlay&&overlay.classList&&overlay.classList.contains("pcstStage")){overlay.classList.remove("pcstStage");delete overlay.dataset.stageMode;overlay.style.removeProperty("top");if(doc.body&&overlay.parentNode!==doc.body)doc.body.append(overlay);}
    }catch(_error){}
    return false;
  }
  // Re-lays the stage on a resize (the Club layout moves the packs with the window); a turn of the phone rebuilds it.
  function pcstStageWatch(on){
    if(!on){if(stageWatch){root.removeEventListener?.("resize",stageWatch.schedule);root.document?.removeEventListener?.("keydown",stageWatch.escape);stageWatch.observer?.disconnect?.();if(stageWatch.frame)root.cancelAnimationFrame?.(stageWatch.frame);stageWatch=null;}return;}
    if(stageWatch||typeof root.addEventListener!=="function")return;
    const watch={frame:0,observer:null};
    watch.schedule=()=>{if(watch.frame||typeof root.requestAnimationFrame!=="function")return;watch.frame=root.requestAnimationFrame(()=>{watch.frame=0;pcstStageLayout();});};
    root.addEventListener("resize",watch.schedule);
    // Escape never closes Career Start under a running roulette (Fable F2-18).
    watch.escape=event=>{if(event.key==="Escape"&&!event.defaultPrevented&&pcstPanelOpen()&&!root.CareerModeRosterRouletteStep?.active?.()){event.preventDefault();pcstClosePanel();}};root.document?.addEventListener?.("keydown",watch.escape);
    try{const host=pcstStageHost();if(host&&typeof root.ResizeObserver==="function"){watch.observer=new root.ResizeObserver(watch.schedule);watch.observer.observe(host);host.querySelectorAll(".clubPackStage").forEach(node=>watch.observer.observe(node));}}catch(_error){}
    stageWatch=watch;
  }
  // Every way into Career Start (the Club screen's own button, the first confirmer's automatic open, resume from Home, a
  // reload) shows option B, never the old card: when the Club screen is not up, it opens behind Career Start first with the
  // confirmed Setup's clubs, drawn as the shared presentation draws them (no draw, no write, no save change). The Club
  // screen's own parts already step aside (html[data-career-start-stage]) and the v10 loader keeps its content invisible
  // until it is ready (Reus Gate), so neither the wheel nor the packs ever show; the panel goes up the moment the screen is.
  function pcstForceScreen(host){
    const doc=root.document;for(const el of doc.querySelectorAll(".screen")){const show=el===host;el.classList.toggle("hidden",!show);el.setAttribute("aria-hidden",show?"false":"true");}
  }
  function pcstPaintClubBackdrop(host,state){
    const doc=root.document,setup=state.setup,text=(id,value)=>{const node=doc.getElementById(id);if(node&&node.textContent!==value)node.textContent=value;};
    host.dataset.sharedPresentationRole=state.managerRole||"unresolved";
    text("clubAssignmentLeague",pcstLeagueName(setup.leagueId));text("clubPlayerOne",pcstManagerLabel("playerOne"));text("clubPlayerTwo",pcstManagerLabel("playerTwo"));
    if(typeof root.setClubRevealStage==="function")root.setClubRevealStage("confirmation");else host.dataset.clubRevealStage="confirmation";
    for(const [suffix,role] of [["One","playerOne"],["Two","playerTwo"]]){
      const card=doc.getElementById(`clubCard${suffix}`),name=doc.getElementById(`clubName${suffix}`),stateNode=doc.getElementById(`clubCardState${suffix}`),club=String(setup.clubs[role]||"");
      if(typeof root.applyClubRevealCard==="function")root.applyClubRevealCard(card,name,stateNode,club);else{if(name)name.textContent=club;if(card)card.classList.add("is-revealed");}
    }
  }
  function pcstWaitForStageHost(host,ms){
    return new Promise(resolve=>{
      if(pcstStageHost())return resolve(true);
      let done=false,observer=null,timer=null;
      const finish=ok=>{if(done)return;done=true;try{observer&&observer.disconnect();}catch(_error){}if(timer)root.clearTimeout(timer);resolve(ok);};
      try{observer=new root.MutationObserver(()=>{if(pcstStageHost())finish(true);});observer.observe(root.document.documentElement,{attributes:true,attributeFilter:["data-v10-screen"]});observer.observe(host,{attributes:true,attributeFilter:["class"]});}catch(_error){}
      timer=root.setTimeout(()=>finish(Boolean(pcstStageHost())),ms);
    });
  }
  // Loads (or reloads) the Club screen's visuals through the v10 loader: a load that failed before (its maps, script or styles)
  // is tried again, because the loader forgets a failed load. false only when they cannot load.
  async function pcstShowClubVisuals(){
    const screens=root.CareerModeV10Screens;
    if(!screens||typeof screens.show!=="function")return false;
    // No toast: the fallback panel says it once, and a toast would cover its buttons.
    try{await screens.show(STAGE_HOST);return true;}catch(error){try{root.console?.warn?.("[Career Mode Showdown] Club visuals unavailable for Career Start.",error);}catch(_error){}return false;}
  }
  async function pcstClubBackdrop(){
    if(pcstStageHost())return true;
    const doc=root.document,host=doc&&typeof doc.getElementById==="function"?doc.getElementById(STAGE_HOST):null,state=pcstSetupState();
    if(!host||!doc.documentElement||!doc.documentElement.dataset||!state||!state.setup||!state.setup.clubs)return false;
    try{if(typeof root.ensureGameplayModules==="function")await root.ensureGameplayModules();}catch(_error){}
    try{if(root.CareerModeClubScreenV10&&typeof root.CareerModeClubScreenV10.install==="function")await root.CareerModeClubScreenV10.install();}catch(_error){}
    if(pcstStageHost())return true;
    doc.documentElement.dataset[STAGE_ATTR]="opening";
    let shown=false;
    try{shown=typeof root.showScreen==="function"&&root.showScreen(STAGE_HOST,false)===true;}catch(_error){shown=false;}
    if(!shown)pcstForceScreen(host);
    pcstPaintClubBackdrop(host,state);
    const ready=await pcstShowClubVisuals()&&await pcstWaitForStageHost(host,10000);
    if(!ready&&doc.documentElement.dataset[STAGE_ATTR]==="opening")delete doc.documentElement.dataset[STAGE_ATTR];
    return ready;
  }
  function pcstStageTarget(){
    const host=pcstStageHost(),mode=host&&pcstStageMode(host);
    if(mode)return {host,mode};
    return stageFailed&&root.document&&root.document.body?{host:root.document.body,mode:"fallback"}:null;
  }
  function pcstStage(overlay,body,ctx){
    try{
      const target=overlay.classList.contains("hidden")?null:pcstStageTarget(),host=target&&target.host,mode=target&&target.mode;
      if(!mode){if(!overlay.classList.contains("hidden"))pcstStageRetry();return pcstStageOff(overlay);}
      const doc=root.document,fallback=mode==="fallback";
      if(!fallback){stageRetries=0;stageFailed=false;retryFailed=false;}
      if(overlay.parentNode!==host)host.append(overlay);overlay.style.removeProperty("top");
      overlay.classList.add("pcstStage");overlay.dataset.stageMode=mode;if(fallback)delete doc.documentElement.dataset[STAGE_ATTR];else doc.documentElement.dataset[STAGE_ATTR]=mode;
      const title=pcstCreate("div","pcstTitle");title.append(pcstCreate("span","pcstTitleKicker","CAREER MODE SHOWDOWN 17"));
      const eyebrow=body.querySelector(".remoteJoiningEyebrow");title.append(eyebrow||pcstCreate("span","remoteJoiningEyebrow","CAREER START"));title.lastChild.classList.add("pcstTitleWord");
      const pillar=pcstCreate("div","pcstPillar"),heading=body.querySelector("h2"),note=body.querySelector(":scope > p:not(.remoteJoiningStatus)");
      if(heading){heading.classList.add(ctx?"pcstKicker":"pcstSrOnly");pillar.append(heading);}
      const holds=[];
      if(ctx){
        const grid=body.querySelector(".settingsInfoGrid"),rows=grid?[...grid.children]:[],row=label=>rows.find(item=>item.firstChild&&item.firstChild.textContent===label);
        const chips=pcstCreate("div","pcstChips");for(const label of ["LEAGUE","SHOWDOWN LENGTH"]){const item=row(label);if(item)chips.append(item);}pillar.append(chips);
        // The product's own message. Its idle status ("…confirm below") is folded into it, so the stage says it once.
        if(note){note.classList.add("pcstNote");note.replaceChildren("Your club is ",pcstCreate("b","",ctx.ownClub),`. Start or load a FIFA 17 Career Mode save with that club${ctx.idle?", then confirm":""}.`);pillar.append(note);}
        if(ctx.idle)ctx.status.dataset.stageIdle="true";pillar.append(ctx.status);
        const rival=row("RIVAL");if(rival){rival.classList.add("pcstRival");pillar.append(rival);}
        // Nik's rule (2026-10-29): each Special Player's original club stays on Career Start.
        for(const item of rows)if(item.dataset.careerRow==="special"){item.classList.add("pcstSpecial");pillar.append(item);}
        const you=row("YOU");if(you){you.classList.add("pcstSrOnly");pillar.append(you);}
        if(grid)grid.remove();
        if(!fallback)holds.push(pcstStageHold("playerOne",ctx.setup.clubs.playerOne),pcstStageHold("playerTwo",ctx.setup.clubs.playerTwo));
      }else if(note){note.classList.add("pcstNote");pillar.append(note);}
      const actions=body.querySelector(".remoteJoiningActions");
      if(actions&&mode!=="desktop")pillar.append(actions);
      // The card's × and the Club screen's BACK both step aside with the stage, so the stage carries its own way out
      // (Escape too): it closes Career Start and gives the Club screen back, where CONTINUE TO CAREER START reopens it.
      const back=pcstCreate("button","compactButton pcstBack","BACK");back.type="button";back.setAttribute("aria-label","Close Career Start");back.addEventListener("click",pcstClosePanel);
      if(fallback){
        // The Club screen did not load: say so once, keep every control, and offer RETRY (it loads the Club visuals again).
        const notice=pcstCreate("p","pcstFallbackNote",retryFailed?"The Club screen still didn't load. Career Start works here; try RETRY again in a moment.":"The Club screen didn't load. Career Start works here; RETRY loads the Club screen again.");notice.setAttribute("role","status");
        pillar.insertBefore(notice,pillar.children[heading?1:0]||null);
        const retry=pcstCreate("button","compactButton pcstRetry","RETRY");retry.type="button";retry.addEventListener("click",()=>void pcstRetryStage(retry));
        if(actions)actions.append(retry);else pillar.append(retry);
      }
      const probe=pcstCreate("div","pcstPlateProbe");probe.setAttribute("aria-hidden","true");
      body.prepend(title,...holds,pillar);if(actions&&mode==="desktop"){actions.append(back);body.append(actions);}else body.append(back);body.append(probe);
      pcstStageWatch(true);pcstStageLayout();return true;
    }catch(error){pcstReport("Career Start stage could not be drawn; using the marble fallback",error);pcstStageOff(overlay);if(!stageFailed&&typeof root.setTimeout==="function")root.setTimeout(pcstStageGiveWay,0);return false;}
  }
  function pcstStageLayout(){
    const doc=root.document,overlay=doc&&doc.getElementById(PANEL_ID);
    if(!overlay||!overlay.classList.contains("pcstStage")||overlay.classList.contains("hidden"))return null;
    const target=pcstStageTarget(),host=target&&target.host,mode=target&&target.mode;
    if(!mode||mode!==overlay.dataset.stageMode){pcstRender();return null;}
    if(mode==="fallback")return pcstFallbackLayout(overlay);
    const origin=overlay.getBoundingClientRect(),W=origin.width,H=origin.height,frames=pcstStageFrames(overlay,host,mode,origin);
    overlay.querySelectorAll(".pcstHold").forEach((hold,index)=>{
      const frame=frames[index];if(!frame)return;const fit=pcstFitHold(frame),crest=hold.querySelector(".pcstHoldCrest"),name=hold.querySelector(".pcstHoldName");
      hold.dataset.frame=[frame.x,frame.y,frame.w,frame.h].map(v=>Math.round(v*100)/100).join(",");
      Object.assign(hold.style,{left:`${fit.x}px`,top:`${fit.y}px`,width:`${fit.w}px`,height:`${fit.h}px`,gap:`${fit.gap}px`});
      // One line at the clamp size; a slightly long name shrinks to fit; a long one ("Borussia Mönchengladbach") takes two
      // lines and shrinks until both fit, and the crest gives up the height the name needs.
      const setName=(size,wrap)=>{name.style.fontSize=`${size}px`;name.style.whiteSpace=wrap?"normal":"nowrap";};
      setName(fit.label,false);
      if(name.scrollWidth>fit.w){
        const one=Math.floor(fit.label*fit.w/name.scrollWidth*.97*10)/10;
        if(one>=fit.label*.8)setName(one,false);
        else{let size=fit.label;setName(size,true);for(let step=0;step<12&&size>7&&(name.scrollWidth>fit.w+.5||name.scrollHeight>size*2.3);step++){size=Math.max(7,Math.floor(size*.92*10)/10);setName(size,true);}}
      }
      crest.style.width=crest.style.height=`${Math.max(0,Math.min(fit.crest,Math.floor(Math.min(fit.w,fit.h-name.offsetHeight-fit.gap))))}px`;
    });
    const title=overlay.querySelector(".pcstTitle"),pillar=overlay.querySelector(".pcstPillar"),actions=overlay.querySelector(".remoteJoiningActions"),scene=host.querySelector(".clPhoneScene");
    if(!title||!pillar)return null;
    pillar.removeAttribute("data-room");pillar.removeAttribute("style");title.removeAttribute("style");
    if(mode==="desktop"){
      title.style.top=`${Math.round(H*.09)}px`;title.style.setProperty("--pcst-title",`${Math.round(H*.058)}px`);
      const left=frames[0].x+frames[0].w,right=frames[1].x,room=right-left-16,width=Math.round(room>=240?Math.min(380,room):Math.min(380,W*.27));
      const below=title.getBoundingClientRect().bottom-origin.top+10;
      Object.assign(pillar.style,{left:`${Math.round((left+right)/2-width/2)}px`,width:`${width}px`,top:`${Math.round(Math.max(H*.25,below))}px`});
      if(actions){actions.removeAttribute("style");actions.style.top=`${Math.round(Math.max(H*.755,pillar.getBoundingClientRect().bottom-origin.top+12))}px`;}
    }else{
      const band=scene?pcstStageBox(scene,origin):{x:0,y:0,w:0,h:0},packBottom=Math.max(...frames.map(f=>f.y+f.h));
      // Where the site's top bar shows (sideways phones wider than 900px), the stage starts below it.
      const top=Math.max(band.y,pcstTopBarBottom(origin));
      // Portrait or sideways, the panel is placed first; the BACK is placed on its own after (it never decides the layout).
      if(mode==="phone"){title.style.top=`${Math.round(top+12)}px`;pillar.style.top=`${Math.round(Math.max(band.y+band.h,packBottom+6))}px`;}
      else{Object.assign(title.style,{top:`${Math.round(top+10)}px`,left:`${Math.round(band.x)}px`,width:`${Math.round(band.w)}px`});Object.assign(pillar.style,{left:`${Math.round(band.x+band.w+8)}px`,top:`${Math.round(top+8)}px`});}
      const back=overlay.querySelector(".pcstBack");if(back&&!pillar.contains(back)&&!(actions&&actions.contains(back))){back.removeAttribute("style");back.style.top=`${Math.round(top+(mode==="phone"?10:8))}px`;}
      // The rival line shows only when the panel has 290px or more; then the panel tightens until nothing overflows.
      const room=pillar.getBoundingClientRect().height;if(room<290)pillar.dataset.room="short";
      for(const step of ["tight","tighter","tightest"])if(pillar.scrollHeight>pillar.clientHeight+1)pillar.dataset.room=step;
    }
    return mode;
  }
  // The app's runtime notice for the same failure ("Team V screen could not load…") says what the fallback panel already says,
  // and on a small phone it would cover the panel's buttons: it is dismissed through its own close button. Other notices stay.
  function pcstDismissClubNotice(){
    try{const notice=root.document.getElementById("appRuntimeNotice");if(notice&&/Team V screen could not (load|update)|Club Assignment visuals|CLUB_V10_MAP/.test(notice.textContent||""))notice.querySelector("button")?.click();}catch(_error){}
  }
  function pcstFallbackLayout(overlay){
    pcstDismissClubNotice();
    overlay.style.top=`${Math.round(pcstTopBarBottom({top:0}))}px`;
    const title=overlay.querySelector(".pcstTitle"),pillar=overlay.querySelector(".pcstPillar"),back=overlay.querySelector(".pcstBack");
    if(!title||!pillar)return null;
    pillar.removeAttribute("data-room");pillar.removeAttribute("style");title.removeAttribute("style");
    const origin=overlay.getBoundingClientRect();
    title.style.top="12px";title.style.setProperty("--pcst-title",`${Math.round(Math.max(22,Math.min(34,origin.height*.05)))}px`);
    if(back){back.removeAttribute("style");back.style.top="10px";}
    const below=Math.max(title.getBoundingClientRect().bottom,back?back.getBoundingClientRect().bottom:0)-origin.top+10;
    pillar.style.top=`${Math.round(below)}px`;pillar.style.maxHeight=`${Math.max(0,Math.floor(origin.height-below-8))}px`;
    const room=pillar.getBoundingClientRect().height;if(room<290)pillar.dataset.room="short";
    for(const step of ["tight","tighter","tightest"])if(pillar.scrollHeight>pillar.clientHeight+1)pillar.dataset.room=step;
    return "fallback";
  }
  async function pcstRetryStage(button){
    if(button){button.disabled=true;button.textContent="RETRYING…";}
    let ok=false;try{ok=await pcstClubBackdrop();}catch(_error){ok=false;}
    stageFailed=!ok;retryFailed=!ok;stageRetries=0;
    if(pcstPanelOpen())pcstRender();
    return ok;
  }
  function pcstTopBar(){
    const doc=root.document,bar=doc&&doc.querySelector(".sd-nav-top");if(!bar||typeof root.getComputedStyle!=="function")return null;
    const style=root.getComputedStyle(bar),rect=bar.getBoundingClientRect();
    return style.display==="none"||style.visibility==="hidden"||rect.height<1||!/fixed|sticky/.test(style.position)?null:rect;
  }
  function pcstTopBarBottom(origin){const rect=pcstTopBar();return rect?Math.max(0,rect.bottom-origin.top):0;}
  // The audit Nik asked for (HO-049): at every size the crest and the name sit inside the pack frame ("fits"), and nothing
  // covers anything (packs, title, pillar or panel, buttons), the words never overflow their panel, and all stays on screen.
  function pcstStageAudit(){
    const doc=root.document,overlay=doc&&doc.getElementById(PANEL_ID);
    if(!overlay||!overlay.classList.contains("pcstStage")||overlay.classList.contains("hidden"))return {stage:false};
    const origin=overlay.getBoundingClientRect(),box=node=>{const r=node.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom};};
    const inside=(r,f)=>r.left>=f.left-.5&&r.right<=f.right+.5&&r.top>=f.top-.5&&r.bottom<=f.bottom+.5;
    const overlap=(a,b)=>a.left<b.right-.5&&b.left<a.right-.5&&a.top<b.bottom-.5&&b.top<a.bottom-.5;
    const frames=[],holds=[...overlay.querySelectorAll(".pcstHold")].map(hold=>{
      const [x,y,w,h]=String(hold.dataset.frame||"").split(",").map(Number),frame={left:origin.left+x,top:origin.top+y,right:origin.left+x+w,bottom:origin.top+y+h};frames.push(frame);
      const name=hold.querySelector(".pcstHoldName"),crest=box(hold.querySelector(".pcstHoldCrest")),label=box(name);
      const fits=[x,y,w,h].every(Number.isFinite)&&crest.right-crest.left>0&&inside(crest,frame)&&inside(label,frame)&&name.scrollWidth<=name.clientWidth+1;
      return {side:hold.dataset.side,club:name.textContent,fits:fits?"fits":"OVERFLOW",frame:[x,y,w,h].map(Math.round),crest:Math.round(crest.right-crest.left),label:parseFloat(name.style.fontSize)};
    });
    const title=box(overlay.querySelector(".pcstTitle")),pillarNode=overlay.querySelector(".pcstPillar"),pillar=box(pillarNode),actionsNode=overlay.querySelector(".remoteJoiningActions"),actions=actionsNode?box(actionsNode):null;
    const backNode=overlay.querySelector(".pcstBack"),covers=[],named={title,pillar};if(actions&&!pillarNode.contains(actionsNode))named.buttons=actions;
    if(backNode&&!(actionsNode&&actionsNode.contains(backNode))){named.back=box(backNode);if(overlap(named.back,pillar))covers.push("back covers pillar");}
    frames.forEach((frame,index)=>{for(const [key,r] of Object.entries(named))if(overlap(r,frame))covers.push(`${key} covers pack ${index+1}`);});
    const bar=pcstTopBar();if(bar){const barBox={left:bar.left,top:bar.top,right:bar.right,bottom:bar.bottom};for(const [key,r] of Object.entries(named))if(overlap(barBox,r))covers.push(`top bar covers ${key}`);frames.forEach((frame,index)=>{if(overlap(barBox,frame))covers.push(`top bar covers pack ${index+1}`);});}
    if(overlap(title,pillar))covers.push("title covers pillar");if(named.back){const word=box(overlay.querySelector(".pcstTitleWord"));if(overlap(named.back,word))covers.push("back covers title");}if(named.buttons&&overlap(named.buttons,pillar))covers.push("buttons cover pillar");
    const viewH=root.innerHeight,viewW=root.innerWidth,onScreen=Object.values(named).every(r=>r.top>=-.5&&r.left>=-.5&&r.bottom<=viewH+.5&&r.right<=viewW+.5);
    const overflow=pillarNode.scrollHeight>pillarNode.clientHeight+1||pillarNode.scrollWidth>pillarNode.clientWidth+1;
    const retryNode=overlay.querySelector(".pcstRetry");
    return {stage:true,back:Boolean(backNode&&backNode.getBoundingClientRect().width>0),retry:Boolean(retryNode&&retryNode.getBoundingClientRect().width>0),mode:overlay.dataset.stageMode,room:pillarNode.dataset.room||"",holds,fits:holds.length===2&&holds.every(item=>item.fits==="fits"),covers,overflow,onScreen,ok:holds.length===2&&holds.every(item=>item.fits==="fits")&&!covers.length&&!overflow&&onScreen};
  }
  function pcstRender(){pcstWatchSync();
    const overlay=root.document&&root.document.getElementById(PANEL_ID);if(!overlay)return;const body=overlay.querySelector(".remoteJoiningBody");if(!body)return;body.replaceChildren();
    const setup=view&&view.setup||pcstSetupState()?.setup,role=view&&view.managerRole||pcstSetupState()?.managerRole,career=view&&view.state||null,acknowledged=new Set(career&&career.acknowledgedRoles||[]);if(!setup||!role){body.append(pcstCreate("h2","","CAREER START"),pcstCreate("p","","Loading your Showdown…"));pcstStage(overlay,body,null);return;}
    const ownClub=setup.clubs[role],otherRole=role==="playerOne"?"playerTwo":"playerOne",otherClub=setup.clubs[otherRole],ready=career&&career.phase==="CAREER_START_READY",mine=acknowledged.has(role);
    body.append(pcstCreate("span","remoteJoiningEyebrow","CAREER START"),pcstCreate("h2","","START YOUR FIFA 17 CAREER"),pcstCreate("p","",`Your club is ${ownClub}. Start or load a FIFA 17 Career Mode save with that club.`));
    const grid=pcstCreate("div","settingsInfoGrid");grid.append(pcstRow("YOU",`${pcstManagerLabel(role)} · ${ownClub}`,mine?"ready":"pending"),pcstRow("RIVAL",`${pcstManagerLabel(otherRole)} · ${otherClub}`,acknowledged.has(otherRole)?"ready":"pending"),pcstRow("LEAGUE",pcstLeagueName(setup.leagueId)),pcstRow("SHOWDOWN LENGTH",`${setup.totalSeasons} SEASON${setup.totalSeasons===1?"":"S"}`));
    const special=pcstSpecialPlayers(),chip=root.CareerModeSpecialPlayerChip,manager=r=>r==="playerOne"?"daniel":"nik";
    if(special&&chip)for(const [label,who] of [["YOUR SPECIAL PLAYER",role],["RIVAL'S SPECIAL PLAYER",otherRole]]){const line=chip.clubLine(special[manager(who)]);if(line){const row=pcstRow(label,line,"special");row.dataset.specialPlayer=manager(who);grid.append(row);}}
    body.append(grid);
    const statusText=lastError||(ready?"BOTH MANAGERS STARTED ✓ · Continue to the Transfer Challenge.":mine?"YOUR CAREER IS CONFIRMED · Waiting for your rival to start theirs.":"Once your FIFA 17 career is set up at your club, confirm below.");
    const status=pcstCreate("p","remoteJoiningStatus",statusText);status.dataset.careerStatus="true";status.setAttribute("role","status");status.setAttribute("aria-live","polite");body.append(status);
    const actions=pcstCreate("div","remoteJoiningActions");const confirm=pcstCreate("button","compactButton r78-btn--primary",ready?"CONTINUE TO TRANSFER CHALLENGE":mine?"MY CAREER STARTED ✓":`I STARTED AT ${String(ownClub).toUpperCase()}`);confirm.type="button";confirm.disabled=busy||(!ready&&mine);confirm.addEventListener("click",()=>void (ready?pcstOpenTransferChallenge():pcstAcknowledge()));actions.append(confirm);const refreshButton=pcstCreate("button","compactButton","REFRESH");refreshButton.type="button";refreshButton.disabled=busy;refreshButton.addEventListener("click",()=>void pcstRefresh().catch(error=>pcstReport("Unable to refresh Shared Career Start",error)));actions.append(refreshButton);body.append(actions);
    pcstStage(overlay,body,{setup,role,ownClub,status:status,idle:!lastError&&!ready&&!mine});
  }
  // r50: opening Career Start loads its protocol, provider and styles on first use. The tapped control
  // shows OPENING… and stays disabled until the panel is up, and overlapping opens share one attempt,
  // so a slow first load never looks like a tap that did nothing.
  // r86: a Showdown confirmed on r86 or later first shows this manager's Special Player reveal (js/specialPlayerReveal.js),
  // outside the 25 s Career Start timeout. Its full-screen stage stays until Career Start (or the Transfer Challenge) is up
  // under it, so nothing in between shows. Any failure means no reveal.
  async function pcstSpecialPlayerFirst(){
    try{
      // The confirmed Setup is already loaded (it is what offers this control), so the reveal waits on no Career Start dependency.
      const api=setupApi||root.CareerModeProductionSharedShowdownSetup;
      if(!api||!pcstConfirmed()||pcstReadyHere())return null;
      let timer;const loaded=await Promise.race([pcstLoadScript("special-player-reveal","js/specialPlayerReveal.js",()=>root.CareerModeSpecialPlayerReveal),new Promise(resolve=>{timer=root.setTimeout(()=>resolve(null),10000);})]).finally(()=>root.clearTimeout(timer));
      if(!loaded)return null;
      return await root.CareerModeSpecialPlayerReveal.runBeforeCareerStart(api);
    }catch(_error){return null;}
  }
  function pcstCloseReveal(){const stage=revealStage;revealStage=null;if(stage)try{stage.close();}catch(_error){}return true;}
  // F1 (fault suite): a stale tab or a reload must never open Career Start for a Showdown this page already holds CLOSED; it
  // goes to that Showdown's Champion screen (or Home) instead. In-memory only, no read.
  function pcstShowdownClosed(){try{const t=root.CareerModeProductionSharedTerminalClose?.getState?.();return Boolean(t&&t.phase==="CLOSED"&&t.terminal===true);}catch(_error){return false;}}
  function pcstOpenPanel(){
    if(openPromise)return openPromise;
    if(pcstShowdownClosed()){const entry=root.CareerModeProductionSharedJourneyEntry;return Promise.resolve(typeof entry?.openClosedShowdown==="function"?entry.openClosedShowdown():false);}
    const run=pcstSpecialPlayerFirst().then(stage=>{revealStage=stage;return pcstWithTimeout(pcstOpenPanelNow);}).finally(pcstCloseReveal);openPromise=run;
    run.finally(()=>{if(openPromise===run)openPromise=null;pcstDecorateControl();}).catch(()=>{});
    try{pcstDecorateControl();}catch(_error){}
    return run;
  }
  function pcstEnsurePanel(){let overlay=root.document.getElementById(PANEL_ID);if(!overlay){overlay=pcstCreate("div","remoteJoiningOverlay");overlay.id=PANEL_ID;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label","Shared Career Start");const shell=pcstCreate("div","remoteJoiningShell"),header=pcstCreate("div","remoteJoiningHeader");header.append(pcstCreate("strong","","CAREER MODE SHOWDOWN // 17"));const close=pcstCreate("button","remoteJoiningDismiss","×");close.type="button";close.setAttribute("aria-label","Close Career Start");close.addEventListener("click",pcstClosePanel);header.append(close);const body=pcstCreate("div","remoteJoiningBody");shell.append(header,body);overlay.append(shell);root.document.body.append(overlay);}return overlay;}
  // r80 resume (G7): a Career Start this page already holds as READY for the current Setup (both managers started) is not
  // shown again: it goes straight on to the Transfer Challenge, as its automatic continue does, with no read and no frame of
  // this panel. The automatic continue fires once per page, so re-entering the game from Home used to stop here.
  function pcstReadyHere(){return Boolean(pcstReady()&&readyKey&&pcstConfirmed()&&readyKey===pcstSetupKey(pcstSetupState()));}
  async function pcstOpenPanelNow(request){
    pcstDeactivateSetupPresentation();await request.wait(pcstEnsureDependencies());
    // Fable F6-01: a BACK TO SHOWDOWN HOME from the roulette opened here (CONTINUE CAREER from Home) stays on Home, as it does
    // from the panel; only a roulette that could not start (its own reason) or a failed open shows Career Start below.
    if(!pcstPanelOpen()&&pcstReadyHere()&&await request.wait(pcstOpenTransferChallenge()))return pcstCloseReveal();
    if(!pcstPanelOpen()&&pcstReadyHere()&&root.CareerModeRosterRouletteStep?.wentHome?.())return pcstCloseReveal();
    const overlay=pcstEnsurePanel();stageRetries=0;stageFailed=false;retryFailed=false;stageFailed=!(await request.wait(pcstClubBackdrop()));overlay.classList.remove("hidden");pcstRender();pcstCloseReveal();await request.wait(pcstRefresh(false,request));return true;
  }
  function pcstClosePanel(){const overlay=root.document&&root.document.getElementById(PANEL_ID);if(overlay){overlay.classList.add("hidden");pcstStageOff(overlay);}return true;}
  function pcstPresentationOwnsControl(){const presentation=root.CareerModeProductionSharedShowdownPresentation;return Boolean(presentation&&typeof presentation.isPresentationActive==="function"&&presentation.isPresentationActive());}
  function pcstClearControlOwnership(button){if(button&&button.dataset.sharedCareerStart==="true")delete button.dataset.sharedCareerStart;return false;}
  function pcstDecorateControl(){
    const button=root.document&&root.document.getElementById(CONTROL_ID);if(!button)return false;
    if(!pcstConfirmed()||pcstPresentationOwnsControl())return pcstClearControlOwnership(button);
    const opening=Boolean(openPromise),label=opening?"OPENING CAREER START…":"CONTINUE TO CAREER START";
    if(button.textContent!==label)button.textContent=label;
    if(button.disabled!==opening)button.disabled=opening;
    if(opening)button.setAttribute("aria-busy","true");else if(button.hasAttribute("aria-busy"))button.removeAttribute("aria-busy");
    if(button.classList.contains("hidden"))button.classList.remove("hidden");
    if(button.getAttribute("aria-disabled")!==String(opening))button.setAttribute("aria-disabled",String(opening));
    if(button.dataset.sharedCareerStart!=="true")button.dataset.sharedCareerStart="true";
    return true;
  }
  function pcstCapture(event){const button=event.target&&event.target.closest&&event.target.closest(`#${CONTROL_ID}`);if(!button||button.dataset.sharedCareerStart!=="true"||!pcstConfirmed())return;event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();void pcstOpenPanel().catch(error=>pcstReport("Unable to open Shared Career Start",error));}
  function pcstWaitingKey(){if(!view||!view.state||pcstReady()||!pcstOwnAcknowledged(view)||!pcstPanelOpen())return "";return `${view.managerRole}|${view.state.revision}`;}
  function pcstFastPollDue(){const key=pcstWaitingKey();if(!key){fastWaitKey="";fastWaitSince=0;return false;}const now=Date.now();if(key!==fastWaitKey){fastWaitKey=key;fastWaitSince=now;}return now-fastWaitSince<FAST_POLL_WINDOW_MS;}
  // r75: while this screen waits on the partner, one live listener watches the shared document the partner's move changes;
  // the 3 s check below keeps running as the fallback and reads from the listener while it is healthy.
  // RS-01 (r87): the view never carries the rivalry id (neither the Career Start projection nor its setup half), so the path
  // comes from the Shared Setup state, as pcstAutoContinueKey does. Before, the listener watched nothing and the first manager
  // to tap "I STARTED" read the career document from the server every 3 s for up to 3 minutes.
  function pcstWaitPath(){const rivalryId=String(view?.setup?.rivalryId||view?.rivalryId||pcstSetupState()?.rivalryId||"").trim();return rivalryId?`rivalries/${rivalryId}/careerStart/authoritative`:null;}
  function pcstWatchWait(){const budget=root.CareerModeFirestoreBudget;if(!budget||typeof budget.watchWaitPoint!=="function")return;let path=null;try{path=root.document?.visibilityState==="hidden"?null:(pcstWaitingKey()?pcstWaitPath():null);}catch(_error){path=null;}budget.watchWaitPoint("career-start",path,pcstWaitWake);}
  // While that listener is healthy the partner's acknowledgement wakes this screen through it (pcstWaitWake), so the 3 s check stands
  // down, as the Transfer screen's does (pstcWaitHealthy); the 15 s check and the listener's own server confirms keep running.
  function pcstWaitHealthy(){const path=pcstWaitPath(),live=root.CareerModeFirestoreBudget?.stats?.();return Boolean(path&&live?.watchHealthy&&live.watching===path);}
  function pcstWaitWake(){if(!busy){void pcstTick(true);return;}if(typeof root.setTimeout==="function")root.setTimeout(()=>{if(!busy)void pcstTick(true);},400);}
  function pcstFastTick(){pcstWatchWait();if(root.document&&root.document.visibilityState==="hidden")return;if(busy||!pcstFastPollDue()||pcstWaitHealthy())return;void pcstTick(true);}
  async function pcstTick(light=false){
    if(root.document&&root.document.visibilityState==="hidden")return false;
    if(pcstReady()){pcstStopPolling();return false;}
    try{if(!setupApi&&root.CareerModeProductionSharedShowdownSetup)setupApi=root.CareerModeProductionSharedShowdownSetup;pcstDecorateControl();const overlay=root.document&&root.document.getElementById(PANEL_ID);if(overlay&&!overlay.classList.contains("hidden")&&pcstConfirmed()&&!busy)await pcstRefresh(light===true);return true;}catch(_error){return false;}
  }
  function pcstInstall(){if(installed)return true;installed=true;if(root.document){root.document.addEventListener("click",pcstCapture,true);const observer=new MutationObserver(()=>pcstDecorateControl());observer.observe(root.document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["disabled","class"]});}if(typeof root.setInterval==="function"){pollTimer=root.setInterval(()=>void pcstTick(),POLL_MS);root.setInterval(pcstFastTick,FAST_POLL_MS);}void pcstEnsureDependencies().then(()=>pcstTick()).catch(()=>{});return true;}

  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-career-start",productionEnabled:true,requiresConfirmedSharedSetup:true,requiresExactActiveSession:true,twoManagerAcknowledgement:true,routesReadyStateToTransferChallenge:true,reconcilesConcurrentAcknowledgement:true,persistentVisibleErrors:true,canonicalStorageMutation:false,billingRequired:false,pollIntervalMs:POLL_MS,fastPollIntervalMs:FAST_POLL_MS,fastPollWindowMs:FAST_POLL_WINDOW_MS,isWaitingForRival:()=>Boolean(pcstWaitingKey()),autoContinuesWhenBothStarted:true,visibilityAwarePolling:true,serializedOperations:true,terminalPollingStops:true,deactivatesSetupPresentation:true,install:pcstInstall,openPanel:pcstOpenPanel,closePanel:pcstClosePanel,refresh:pcstRefresh,openTransferChallenge:pcstOpenTransferChallenge,errorText:pcstErrorText,careerStartStage:"option-b",fitHold:pcstFitHold,layoutAudit:pcstStageAudit,getState:()=>view});
});

````

## FILE: js/productionSharedTransferChallenge.js

````js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedTransferChallenge=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const POLL_MS=15000;
  // Job 33 (R1): while this manager waits on the rival, read every 3 s for at most 3 minutes, then the normal 15 s.
  const FAST_POLL_MS=3000,FAST_POLL_WINDOW_MS=180000;
  const TIMER_MS=1000;
  const EXPIRY_RETRY_MS=30000,EXPIRY_MAX_ATTEMPTS=3;
  const CLOCK_REFRESH_MS=5*60*1000;
  const CONTROL_IDS=Object.freeze(["seasonPrimaryAction","startTransferTimer","endTransferTimer","completeTransferChallenge","continueFromTransfers"]);
  const PHASE_PROGRESS=Object.freeze({NOT_STARTED:"window",WINDOW_OPEN:"window",GUESS_ENTRY:"guess_entry",SIGNING_ENTRY:"signing_entry",COMPLETED:"completed"});
  const REPLAY_PHASES=Object.freeze(["WINDOW_OPEN","GUESS_ENTRY","SIGNING_ENTRY","COMPLETED"]);
  // r87 (Nik 2026-10-30): each signing's FIFA 17 position, chosen by his own manager and never guessed (roulette boards).
  const SIGNING_POSITIONS=Object.freeze(["GK","RB","RWB","CB","LB","LWB","CDM","CM","CAM","RM","LM","RW","LW","CF","ST"]);
  let installed=false,busy=false,provider=null,setupApi=null,careerApi=null,view=null,pollTimer=null,timerLoop=null,openedKey="",expiryAttemptRevision=-1,expiryAttemptAt=0,providerChain=Promise.resolve(),refreshPromise=null,refreshContextKey="",viewContextKey="",replayContextKey="",replayQueue=[],openPromise=null;
  let expiryAttemptContextKey="",expiryAttemptCount=0,expiryPermissionDenied=false,expiryNeedsAuthority=false,refreshExpiryRequest=null;
  let clockContextKey="",clockServerEpochMs=0,clockPerformanceMs=0,clockRefreshPerformanceMs=0;
  const witnessedByContext=new Map();
  let fastWaitKey="",fastWaitSince=0;
  // The reason the roulette could not start on this phone (shown on the dashboard and on Career Start), or "" (Fable F2-05).
  let rouletteError="";
  const PSTC_ROULETTE_TEXT=Object.freeze({
    load:"The roulette could not load. Check the connection and tap again.",
    setup:"This season's roulette needs the Showdown's confirmed Setup, and it could not be read just now. Tap again to retry.",
    draw:"The Special Player list could not load, so the transfer window stays shut. Tap again to retry.",
    error:"The roulette hit an error before it could start. Nothing was spun or saved. Tap again to retry."
  });
  // r87 RT5-FLOW-02 (Nik 2026-10-31): the shared window waits until both managers have spun this season's roulette. The gate is
  // known where the roulette runs (pstcRouletteFirst): does the roulette apply to this Showdown (confirmed on r87 or later, not
  // switched off)? spinPendingKey: this manager has spun (or his roulette is done on this browser) and his own mark is not on the
  // server yet; the next check writes it again until it lands.
  // rouletteClearedKey (Codex P1 #1101): the request whose roulette this phone has finished, or that the roulette does not apply to
  // on this phone (no confirm time, kill switch, decide() false). Only then may his own mark be written; a partner's mark never counts.
  let rouletteGate={key:"",applies:false},spinPendingKey="",spinRefusedKey="",spinWriting=null,rouletteClearedKey="";

  function pstcFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function pstcShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function pstcSharedMarker(){const showdown=pstcShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
  function pstcReport(context,error){const terminalClose=root.CareerModeProductionSharedTerminalClose;if(terminalClose&&typeof terminalClose.reportUnlessClosed==="function"){void terminalClose.reportUnlessClosed(context,error);return;}if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
  function pstcText(id,value){const node=root.document&&root.document.getElementById(id);if(node)node.textContent=String(value??"");return node;}
  function pstcHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
  function pstcDisable(node,disabled){if(!node)return;node.disabled=Boolean(disabled);node.setAttribute("aria-disabled",disabled?"true":"false");}
  function pstcLoadScript(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(new Error("Release-owned runtime loader is unavailable."));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)throw new Error(`${path} loaded without its expected API.`);return api;});}
  async function pstcEnsureDependencies(){
    if(typeof root.ensureGameplayModules==="function")await root.ensureGameplayModules();
    else if(typeof root.ensureGameplayRuntime==="function")await root.ensureGameplayRuntime();
    await pstcLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
    await pstcLoadScript("ssjr-production-career-start","js/productionSharedCareerStart.js",()=>root.CareerModeProductionSharedCareerStart);
    await pstcLoadScript("ssjr-transfer-protocol","js/sharedTransferChallenge.js",()=>root.CareerModeSharedTransferChallenge);
    await pstcLoadScript("ssjr-transfer-provider","js/sparkSharedTransferChallenge.js",()=>root.CareerModeSparkSharedTransferChallenge);
    await pstcLoadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
    setupApi=root.CareerModeProductionSharedShowdownSetup;careerApi=root.CareerModeProductionSharedCareerStart;provider=root.CareerModeSparkSharedTransferChallenge;
    if(!setupApi||typeof setupApi.refresh!=="function"||typeof setupApi.getState!=="function")pstcFail("TRANSFER_SETUP_UNAVAILABLE");
    if(!careerApi||typeof careerApi.refresh!=="function"||typeof careerApi.getState!=="function")pstcFail("TRANSFER_CAREER_START_UNAVAILABLE");
    if(!provider||typeof provider.read!=="function"||typeof provider.startWindow!=="function"||typeof provider.requestEndWindow!=="function"||typeof provider.advanceExpiredWindow!=="function"||typeof provider.lockGuesses!=="function"||typeof provider.lockSignings!=="function")pstcFail("TRANSFER_PROVIDER_UNAVAILABLE");
  }
  // A restored local shell may have no rivalry id. Shared Setup has already verified it before entry resumes;
  // use that snapshot while this module's dependencies are still cold so the first refresh can bind its request.
  function pstcSetupState(){try{return setupApi?.getState?.()||root.CareerModeProductionSharedShowdownSetup?.getState?.()||null;}catch(_error){return null;}}
  function pstcCareerReady(){try{const career=careerApi?.getState?.();return Boolean(career&&career.state&&career.state.phase==="CAREER_START_READY"&&career.state.revision===2);}catch(_error){return false;}}
  function pstcConfirmedShared(){const state=pstcSetupState();return Boolean(pstcSharedMarker()&&state&&state.ready===true&&state.setup&&state.setup.phase==="SHOWDOWN_CONFIRMED"&&state.setup.revision===6&&state.managerRole&&state.rivalryId&&state.sessionId&&state.deviceId);}
  function pstcSeason(){const progression=root.CareerModeProductionSharedMultiSeasonProgression,fallback=pstcShowdown()?.currentRound,season=Number(pstcSharedMarker()&&progression&&typeof progression.resolveSeason==="function"?progression.resolveSeason(fallback):fallback);if(!Number.isInteger(season)||season<1)pstcFail("TRANSFER_SEASON_INVALID");return season;}
  function pstcLocalContextKey(){const showdown=pstcShowdown(),id=String(showdown?.id||showdown?.saveId||"").trim();let season;try{season=pstcSeason();}catch(_error){return "";}return id&&Number.isInteger(season)&&season>0?`${id}:${season}`:"";}
  function pstcBoundContextKey(rivalryId,season,localContextKey=pstcLocalContextKey()){const local=String(localContextKey||"").trim(),remote=String(rivalryId||"").trim(),round=Number(season);return local&&remote&&Number.isInteger(round)&&round>0?`${local}|${remote}:${round}`:"";}
  function pstcCurrentContextKey(){const showdown=pstcShowdown(),setup=pstcSetupState(),rivalry=showdown?.sharedJourney?.rivalryId||setup?.rivalryId||"";let season;try{season=pstcSeason();}catch(_error){return "";}return pstcBoundContextKey(rivalry,season);}
  function pstcRequestContext(){const showdown=pstcShowdown(),localKey=pstcLocalContextKey(),rivalryId=String(showdown?.sharedJourney?.rivalryId||pstcSetupState()?.rivalryId||"").trim();let seasonNumber;try{seasonNumber=pstcSeason();}catch(_error){return null;}const key=pstcBoundContextKey(rivalryId,seasonNumber,localKey);return key?Object.freeze({key,localKey,rivalryId,seasonNumber}):null;}
  function pstcRequestMatches(request,ctx=null){if(!request||pstcCurrentContextKey()!==request.key)return false;if(!ctx)return true;return String(ctx.state?.rivalryId||"").trim()===request.rivalryId&&Number(ctx.options?.seasonNumber)===request.seasonNumber;}
  function pstcBindView(result,ctx,request){if(!pstcRequestMatches(request,ctx))return false;view={...result,setup:ctx.state.setup,rivalryId:ctx.state.rivalryId};viewContextKey=request.key;if(view.state?.phase==="COMPLETED"&&view.verdicts){pstcKeepVerdicts(request.rivalryId,request.seasonNumber,view.verdicts);pstcSavedClear(request.key);}if(!view.state&&view.spinMarks)pstcKeepMarks(request.rivalryId,request.seasonNumber,view.spinMarks);return true;}
  function pstcResetExpiryAttempts(){expiryAttemptContextKey="";expiryAttemptRevision=-1;expiryAttemptAt=0;expiryAttemptCount=0;expiryPermissionDenied=false;}
  function pstcExpiryPaused(){return root.document?.visibilityState==="hidden"||expiryNeedsAuthority;}
  function pstcExpiryPermissionRefused(error,request){if(["permission-denied","firestore/permission-denied","permission_denied"].includes(error?.code)&&pstcRequestMatches(request)&&view?.state?.phase==="WINDOW_OPEN"){expiryAttemptContextKey=request.key;expiryAttemptRevision=Number(view.revision);expiryPermissionDenied=true;}}
  function pstcClearClock(){clockContextKey="";clockServerEpochMs=0;clockPerformanceMs=0;clockRefreshPerformanceMs=0;}
  function pstcClearCachedContext(){view=null;viewContextKey="";openedKey="";replayContextKey="";replayQueue=[];pstcResetExpiryAttempts();expiryNeedsAuthority=false;pstcClearClock();}
  function pstcMonotonicNow(){const value=Number(root.performance&&typeof root.performance.now==="function"?root.performance.now():Number.NaN);if(!Number.isFinite(value)||value<0)pstcFail("TRANSFER_CLOCK_UNAVAILABLE","A monotonic browser clock is required for the shared Transfer Challenge.");return value;}
  function pstcClockReady(request){return Boolean(request&&clockContextKey===request.key&&Number.isFinite(clockServerEpochMs)&&clockServerEpochMs>0&&Number.isFinite(clockPerformanceMs));}
  function pstcAuthoritativeNow(request=pstcRequestContext()){if(!pstcClockReady(request))pstcFail("TRANSFER_CLOCK_UNAVAILABLE","Server time has not been established for this shared Transfer Challenge.");return Math.floor(clockServerEpochMs+Math.max(0,pstcMonotonicNow()-clockPerformanceMs));}
  async function pstcEnsureServerClock(user,request){
    if(!request||!pstcRequestMatches(request))return false;
    const monotonicNow=pstcMonotonicNow();
    if(pstcClockReady(request)&&Number.isFinite(clockRefreshPerformanceMs)&&monotonicNow-clockRefreshPerformanceMs<CLOCK_REFRESH_MS)return true;
    if(!user||typeof user.getIdTokenResult!=="function")pstcFail("TRANSFER_CLOCK_UNAVAILABLE","Connected account server time is unavailable.");
    const requestPerformanceMs=pstcMonotonicNow();
    const token=await user.getIdTokenResult(true);
    if(!pstcRequestMatches(request))return false;
    const issuedAtEpochMs=Date.parse(String(token?.issuedAtTime||""));
    if(!Number.isFinite(issuedAtEpochMs)||issuedAtEpochMs<=0)pstcFail("TRANSFER_CLOCK_UNAVAILABLE","The connected account did not provide a valid server time anchor.");
    const receiptPerformanceMs=pstcMonotonicNow();
    clockContextKey=request.key;
    clockServerEpochMs=issuedAtEpochMs+(issuedAtEpochMs%1000===0?500:0);
    clockPerformanceMs=(requestPerformanceMs+receiptPerformanceMs)/2;
    clockRefreshPerformanceMs=receiptPerformanceMs;
    return true;
  }
  function pstcCanRoute(){const request=pstcRequestContext();return Boolean(request&&view&&viewContextKey===request.key&&pstcRequestMatches(request)&&pstcConfirmedShared()&&pstcCareerReady()&&String(view.rivalryId||"")===request.rivalryId&&Number(view.seasonNumber)===request.seasonNumber);}
  // Browser-only viewing hints. Provider state still owns the phase, private inputs and every action.
  function pstcViewingStorageKey(){const request=pstcRequestContext(),role=view?.managerRole;return request&&viewContextKey===request.key&&role?`cms.transferViews.v1:${request.rivalryId}:${request.seasonNumber}:${role}`:"";}
  function pstcWitnessSet(key){
    const scope=`${key}|${view?.managerRole||""}`;
    if(!witnessedByContext.has(scope)){
      let saved=null;try{const storageKey=pstcViewingStorageKey();if(storageKey)saved=JSON.parse(root.readStorageValue?.(storageKey)||"null");}catch(_error){}
      witnessedByContext.set(scope,new Set(Array.isArray(saved)?saved.filter(phase=>REPLAY_PHASES.includes(phase)||phase==="RESULTS_VIEWED"):[]));
    }
    return witnessedByContext.get(scope);
  }
  function pstcCanResumeResults(){return Boolean(pstcCanRoute()&&view.state?.phase==="COMPLETED"&&!pstcReplayPhase()&&REPLAY_PHASES.every(phase=>pstcWitnessSet(viewContextKey).has(phase))&&pstcWitnessSet(viewContextKey).has("RESULTS_VIEWED"));}
  // Seeing completed verdicts does not mean Results was opened. Keep that navigation hint separate so a
  // reload before the Results tap still follows the normal season dashboard / transfer recovery route.
  function pstcRememberResultsView(){
    if(!pstcCanRoute()||view.state?.phase!=="COMPLETED"||pstcReplayPhase())return false;
    const witnessed=pstcWitnessSet(viewContextKey);if(!REPLAY_PHASES.every(phase=>witnessed.has(phase)))return false;
    if(witnessed.has("RESULTS_VIEWED"))return true;witnessed.add("RESULTS_VIEWED");
    try{const key=pstcViewingStorageKey();if(key)root.writeStorageValue?.(key,JSON.stringify([...witnessed]));}catch(_error){}
    return true;
  }
  function pstcTransferScreenVisible(){const screen=root.document&&root.document.getElementById("transferChallenge");return Boolean(screen&&!screen.classList.contains("hidden"));}
  function pstcReplayPhase(key=viewContextKey){return replayContextKey===key&&replayQueue.length?replayQueue[0]:null;}
  function pstcPrepareReplay(){
    const key=viewContextKey,actual=view?.state?.phase;
    if(!key||!REPLAY_PHASES.includes(actual)){replayContextKey="";replayQueue=[];return false;}
    if(replayContextKey===key&&replayQueue.length)return true;
    const actualIndex=REPLAY_PHASES.indexOf(actual),witnessed=pstcWitnessSet(key),missing=REPLAY_PHASES.slice(0,actualIndex).filter(phase=>!witnessed.has(phase));
    replayContextKey=missing.length?key:"";replayQueue=missing;return missing.length>0;
  }
  function pstcMarkWitness(key,phase){
    if(!key||!REPLAY_PHASES.includes(phase)||!pstcTransferScreenVisible())return;
    const witnessed=pstcWitnessSet(key);if(witnessed.has(phase))return;witnessed.add(phase);
    try{const storageKey=pstcViewingStorageKey();if(storageKey)root.writeStorageValue?.(storageKey,JSON.stringify([...witnessed]));}catch(_error){}
  }
  function pstcAdvanceReplay(){if(!pstcReplayPhase())return false;replayQueue.shift();if(!replayQueue.length){replayContextKey="";pstcPrepareReplay();}pstcRender();return true;}
  function pstcRandomOperationId(){if(!root.crypto||typeof root.crypto.getRandomValues!=="function")pstcFail("TRANSFER_CRYPTO_UNAVAILABLE");const bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);return `transfer_op_${Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("")}`;}
  // Job 33 (R1): a fast waiting read (light) reuses the already-confirmed Setup and Career Start instead of re-reading them.
  async function pstcProviderOptions(request=pstcRequestContext(),light=false,expiryOnly=false){
    if(!pstcSharedMarker())pstcFail("TRANSFER_SHARED_MODE_REQUIRED");
    if(!request||!pstcRequestMatches(request))pstcFail("TRANSFER_CONTEXT_STALE");
    await pstcEnsureDependencies();
    if(expiryOnly&&pstcExpiryPaused())return null;
    const reuse=light===true&&pstcConfirmedShared()&&pstcCareerReady();
    if(!reuse)await setupApi.refresh();
    if(expiryOnly&&pstcExpiryPaused())return null;
    if(!pstcRequestMatches(request))pstcFail("TRANSFER_CONTEXT_STALE");
    const state=setupApi.getState();
    if(!state||state.ready!==true||!state.setup||state.setup.phase!=="SHOWDOWN_CONFIRMED"||state.setup.revision!==6)pstcFail("TRANSFER_SETUP_NOT_CONFIRMED","Both managers must finish setup before the Transfer Challenge.");
    if(!reuse)await careerApi.refresh();
    if(expiryOnly&&pstcExpiryPaused())return null;
    if(!pstcRequestMatches(request))pstcFail("TRANSFER_CONTEXT_STALE");
    const career=careerApi.getState();
    if(!career||!career.state||career.state.phase!=="CAREER_START_READY"||career.state.revision!==2)pstcFail("TRANSFER_CAREER_START_NOT_READY","Both managers must finish Career Start before the Transfer Challenge.");
    const runtime=root.CareerModeProductionFirebaseRuntime,services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices());
    if(expiryOnly&&pstcExpiryPaused())return null;
    if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)pstcFail("TRANSFER_PROVIDER_UNAVAILABLE","Connected account services are unavailable.");
    if(!await pstcEnsureServerClock(services.auth.currentUser,request))pstcFail("TRANSFER_CONTEXT_STALE");
    if(!pstcRequestMatches(request))pstcFail("TRANSFER_CONTEXT_STALE");
    return {state,options:{user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:state.rivalryId,sessionId:state.sessionId,deviceId:state.deviceId,seasonNumber:request.seasonNumber,cryptoImpl:root.crypto,nowEpochMs:pstcAuthoritativeNow(request)}};
  }
  function pstcResultError(result,message){if(result&&result.ok===true)return result;const error=new Error(message||"The Transfer Challenge request was rejected.");error.code=result&&result.code||"TRANSFER_PROVIDER_FAILED";error.providerResult=true;throw error;}
  function pstcQueueProvider(task){const queued=providerChain.then(task,task);providerChain=queued.catch(()=>{});return queued;}
  async function pstcRefreshNow(request=pstcRequestContext(),light=false,expiryOnly=false){
    if(!request)return null;
    const ctx=await pstcProviderOptions(request,light,expiryOnly);if(!ctx||!pstcRequestMatches(request,ctx)||(expiryOnly&&pstcExpiryPaused()))return null;
    const result=pstcResultError(await provider.read(ctx.options),"The Transfer Challenge could not be loaded.");if(!pstcRequestMatches(request,ctx))return null;
    if(!pstcBindView(result,ctx,request))return null;if(pstcTransferScreenVisible())pstcPrepareReplay();pstcSetError("");pstcRender();pstcDecorateDashboard();return view;
  }
  // Routine polls and concurrent-expiry reconciliation must not replenish the automatic retry budget. A poll that lands while
  // a wake refresh failed still counts as the fresh authority that wake was waiting for, so expiry cannot stay paused forever.
  function pstcRefresh(light=false,rearmExpiry=true){
    const request=pstcRequestContext();if(!request)return Promise.resolve(null);
    if(viewContextKey&&viewContextKey!==request.key)pstcClearCachedContext();
    if(rearmExpiry)expiryNeedsAuthority=true;
    if(refreshPromise&&refreshContextKey===request.key){refreshExpiryRequest.rearm=refreshExpiryRequest.rearm||rearmExpiry;return refreshPromise;}
    const expiryRefresh={rearm:rearmExpiry};refreshExpiryRequest=expiryRefresh;
    const current=pstcQueueProvider(async()=>{
      const fresh=await pstcRefreshNow(request,light===true);
      if(fresh&&pstcRequestMatches(request)&&(expiryRefresh.rearm||expiryNeedsAuthority)){pstcResetExpiryAttempts();expiryNeedsAuthority=false;pstcRender();}
      return fresh;
    });
    refreshPromise=current;refreshContextKey=request.key;
    const clear=()=>{if(refreshPromise===current){refreshPromise=null;refreshContextKey="";refreshExpiryRequest=null;}};
    current.then(clear,clear);return current;
  }
  // Job 21: when both managers tap at once the loser's write is rejected by the Rules (permission-denied) or by the provider
  // (stale revision / phase already moved). Re-read once; if the refreshed state already shows the outcome, finish silently,
  // otherwise retry the same method once with a fresh revision and operation id. A real denial surfaces after that one retry.
  const PSTC_RACE_CODES=Object.freeze(["permission-denied","firestore/permission-denied","permission_denied","TRANSFER_STALE_BASE_REVISION","TRANSFER_PHASE_INVALID","TRANSFER_END_ALREADY_REQUESTED","TRANSFER_ALREADY_STARTED","TRANSFER_GUESSES_ALREADY_LOCKED","TRANSFER_SIGNINGS_ALREADY_LOCKED"]);
  function pstcOutcomeShown(method,fresh){
    const state=fresh&&fresh.state,role=fresh&&fresh.managerRole;if(!state)return false;
    if(method==="startWindow")return state.phase!=="NOT_STARTED";
    if(method==="requestEndWindow")return state.phase!=="WINDOW_OPEN"||Boolean(state.endRequestedRoles?.includes(role));
    if(method==="advanceExpiredWindow")return state.phase!=="WINDOW_OPEN";
    if(method==="lockGuesses")return state.phase!=="GUESS_ENTRY"||Boolean(state.guessLockedRoles?.includes(role));
    if(method==="lockSignings")return state.phase==="COMPLETED"||Boolean(state.signingLockedRoles?.includes(role));
    return false;
  }
  // BUG-3: the provider rejects a signing name over 80 characters with only a code, so the inputs are capped to the same limit and the known codes read as plain sentences.
  const SIGNING_NAME_MAX=80;
  // Red team R87-B-05: a dropped connection or an expired session reads as what to do next, never as a raw code.
  const PSTC_CONNECTION_TEXT="Could not confirm this step. Check the connection, tap REFRESH CHALLENGE to see if it saved, then try again if it did not.";
  const PSTC_SESSION_TEXT="Your Showdown session has lapsed. Go back to Showdown Home and open the Showdown again; nothing saved is lost.";
  const PLAIN_PROVIDER_CODES=Object.freeze({TRANSFER_ROULETTE_PENDING:"Both managers spin the roulette before the transfer window opens.",TRANSFER_SIGNINGS_INVALID:"Check each signing: a player name (80 characters at most), a previous league and a nationality.",TRANSFER_GUESSES_INVALID:"Check each guess: choose a FIFA 17 league or nationality."});
  function pstcCapSigningNames(){if(!root.document)return;for(const prefix of ["p1","p2"])for(let i=1;i<=3;i+=1){const input=pstcField(`${prefix}Signing${i}Name`);if(input&&typeof input.setAttribute==="function")input.setAttribute("maxlength",String(SIGNING_NAME_MAX));}}
  function pstcErrorText(error,fallback){const quota=root.CareerModeFirestoreBudget?.quotaMessage?.(error);if(quota)return quota;const code=String(error?.code||""),message=String(error?.message||"");if(error&&error.providerResult!==true&&message&&message!==code&&!/\b\w+(?:[-_/]\w+)+\b|[(){}]|undefined|null/.test(message))return message;if(PLAIN_PROVIDER_CODES[code])return PLAIN_PROVIDER_CODES[code];if(/unavailable|deadline|offline|network|aborted/i.test(code))return PSTC_CONNECTION_TEXT;if(/permission/i.test(code))return PSTC_SESSION_TEXT;/* r87: never a raw code on screen */return fallback;}
  async function pstcMutate(method,payload={}){
    const request=pstcRequestContext();if(!request||busy||pstcReplayPhase()||(method==="advanceExpiredWindow"&&pstcExpiryPaused()))return false;busy=true;pstcSetError("");pstcRender();
    try{
      return await pstcQueueProvider(async()=>{
        for(let attempt=0;;attempt+=1){
          if(!pstcRequestMatches(request)||(method==="advanceExpiredWindow"&&pstcExpiryPaused()))return false;
          const ctx=await pstcProviderOptions(request,false,method==="advanceExpiredWindow");if(!ctx||!pstcRequestMatches(request,ctx)||(method==="advanceExpiredWindow"&&pstcExpiryPaused()))return false;
          const current=pstcResultError(await provider.read(ctx.options),"The Transfer Challenge did not refresh. Try again.");if(!pstcRequestMatches(request,ctx))return false;
          if(method==="advanceExpiredWindow"&&pstcExpiryPaused())return false;
          if(attempt>0&&pstcOutcomeShown(method,current)){if(pstcBindView(current,ctx,request)){pstcSetError("");if(pstcTransferScreenVisible())pstcPrepareReplay();pstcRender();pstcDecorateDashboard();}return true;}
          const options={...ctx.options,nowEpochMs:pstcAuthoritativeNow(request),operationId:pstcRandomOperationId(),baseRevision:Number(current.revision||0),...payload};
          let result;
          try{result=pstcResultError(await provider[method](options),"The Transfer Challenge update was rejected.");}
          catch(error){
            if(!PSTC_RACE_CODES.includes(error&&error.code)||attempt>0)throw error;
            if(method==="advanceExpiredWindow"){try{if(!pstcExpiryPaused())await pstcRefreshNow(request,false,true);}catch(_refreshError){}pstcExpiryPermissionRefused(error,request);return true;}
            continue;
          }
          if(!pstcRequestMatches(request,ctx))return true;
          // F2-08 (Fable job 2): the write result carries the public state only. Keep this manager's own inputs (the read at the
          // top plus what was just locked) so the sealed rows stay on screen, and the rival's as last read.
          if(!pstcBindView(pstcLockedView(result,current,method,payload),ctx,request))return true;if(method==="lockSignings")pstcClearSigningDraft(view.managerRole);if(method==="lockGuesses")pstcClearGuessDraft(view.managerRole);pstcSetError("");
          if(result.needsRefresh||result.state?.phase==="COMPLETED"){
            // F2-08: the lock is saved. A failed follow-up read is not an error and never shows an empty verdict screen or "did
            // it save?": the screen says saved, loading verdicts, and reads again by itself.
            if(method==="lockSignings"||method==="lockGuesses")pstcSavedPending(request);
            try{await pstcRefreshNow(request);}catch(_error){if(pstcSavedPendingFor(request)){pstcRender();pstcDecorateDashboard();pstcSavedRetry(request);}else throw _error;}
          }else{if(pstcTransferScreenVisible())pstcPrepareReplay();pstcRender();pstcDecorateDashboard();}
          return true;
        }
      });
    }catch(error){if(method==="advanceExpiredWindow")pstcExpiryPermissionRefused(error,request);if(pstcRequestMatches(request)){pstcSetError(pstcErrorText(error,"The Transfer Challenge did not update. Try again."));pstcReport("Unable to update Shared Transfer Challenge",error);}return false;}
    finally{busy=false;if(pstcRequestMatches(request))pstcRender();}
  }
  // ---- F2-08: a lock that is saved while its verdicts are still loading ----
  let savedPendingKey="",savedRetryTimer=null,savedRetryCount=0;
  const SAVED_RETRY_MS=Object.freeze([1500,4000,8000,15000]);
  function pstcLockedView(result,current,method,payload){
    const own=current&&current.ownInputs?{guesses:current.ownInputs.guesses??null,signings:current.ownInputs.signings??null}:{guesses:null,signings:null};
    if(method==="lockGuesses"&&Array.isArray(payload?.guesses))own.guesses=JSON.parse(JSON.stringify(payload.guesses));
    if(method==="lockSignings"&&Array.isArray(payload?.signings))own.signings=JSON.parse(JSON.stringify(payload.signings));
    return {...result,ownInputs:own,opponentInputs:current?.opponentInputs||null,verdicts:null,spinMarks:null,spunRoles:null};
  }
  function pstcSavedPending(request){savedPendingKey=request.key;savedRetryCount=0;}
  function pstcSavedPendingFor(request){return Boolean(request&&savedPendingKey===request.key&&view&&viewContextKey===request.key&&!view.verdicts);}
  function pstcSavedClear(key){if(!key||savedPendingKey===key){savedPendingKey="";savedRetryCount=0;if(savedRetryTimer){root.clearTimeout?.(savedRetryTimer);savedRetryTimer=null;}}}
  function pstcSavedRetry(request){
    if(savedRetryTimer||typeof root.setTimeout!=="function")return;
    const wait=SAVED_RETRY_MS[Math.min(savedRetryCount,SAVED_RETRY_MS.length-1)];savedRetryCount+=1;
    savedRetryTimer=root.setTimeout(()=>{savedRetryTimer=null;if(!pstcSavedPendingFor(request)||!pstcRequestMatches(request))return;
      pstcRefresh(false,false).then(fresh=>{if(!fresh&&pstcSavedPendingFor(request))pstcSavedRetry(request);},()=>{if(pstcSavedPendingFor(request))pstcSavedRetry(request);});},wait);
  }
  function pstcSetError(message=""){const node=root.document&&root.document.getElementById("transferChallengeError");if(node)node.textContent=String(message||"");}
  function pstcRolePrefix(role){return role==="playerOne"?"p1":"p2";}
  function pstcGuessPrefix(role){return role==="playerOne"?"p2":"p1";}
  function pstcManagerName(role){const showdown=pstcShowdown();return showdown?.managers?.[role]|| (role==="playerOne"?"Manager 1":"Manager 2");}
  function pstcClubName(role){const showdown=pstcShowdown();return showdown?.clubs?.[role]||view?.setup?.clubs?.[role]||"Club";}
  function pstcCardFor(id,selector){const node=root.document&&root.document.getElementById(id);return node&&node.closest?node.closest(selector):null;}
  function pstcOwnGuessCard(role){return pstcCardFor(`${pstcGuessPrefix(role)}Guess1Type`,".transferGuessCard");}
  function pstcOtherGuessCard(role){const other=role==="playerOne"?"playerTwo":"playerOne";return pstcOwnGuessCard(other);}
  function pstcOwnSigningCard(role){return pstcCardFor(`${pstcRolePrefix(role)}Signing1Name`,".transferManagerCard");}
  function pstcOtherSigningCard(role){const other=role==="playerOne"?"playerTwo":"playerOne";return pstcOwnSigningCard(other);}
  function pstcField(id){return root.document&&root.document.getElementById(id);}
  function pstcSetSelector(input,kind,id){if(!input)return;if(typeof root.setTransferSelectorValue==="function")root.setTransferSelectorValue(input,kind,id||"");else input.value=String(id||"");}
  function pstcCanonical(input){return typeof root.getTransferSelectorCanonicalValue==="function"?root.getTransferSelectorCanonicalValue(input):String(input?.dataset?.canonicalId||"");}
  function pstcClearRole(role){
    const signing=pstcRolePrefix(role),guess=pstcGuessPrefix(role);
    for(let i=1;i<=3;i+=1){
      const name=pstcField(`${signing}Signing${i}Name`),overall=pstcField(`${signing}Signing${i}Overall`),position=pstcField(`${signing}Signing${i}Position`),league=pstcField(`${signing}Signing${i}League`),nationality=pstcField(`${signing}Signing${i}Nationality`),type=pstcField(`${guess}Guess${i}Type`),value=pstcField(`${guess}Guess${i}Value`);
      if(name)name.value="";if(overall)overall.value="";if(position)position.value="";pstcSetSelector(league,"league","");pstcSetSelector(nationality,"nationality","");if(type)type.value="";if(value){value.value="";delete value.dataset.canonicalId;delete value.dataset.canonicalLabel;value.disabled=true;}
    }
  }
  function pstcResetForContext(key,role){const guessRef=pstcGuessDraftRef(role);if(guessDraftRef&&guessRef&&!pstcSameGuessDraftRef(guessDraftRef,guessRef))pstcRemoveGuessDraft(guessDraftRef);if(guessRef)guessDraftRef=guessRef;const draftKey=pstcSigningDraftKey(role);if(signingDraftKey&&draftKey&&signingDraftKey!==draftKey)pstcRemoveSigningDraft(signingDraftKey);if(draftKey)signingDraftKey=draftKey;if(openedKey===key)return;openedKey=key;for(const prefix of ["p1","p2"])for(let i=1;i<=3;i+=1){const name=pstcField(`${prefix}Signing${i}Name`);if(name&&typeof name.setAttribute==="function")name.setAttribute("maxlength","80");}pstcResetExpiryAttempts();pstcClearRole("playerOne");pstcClearRole("playerTwo");pstcSetError("");}
  const PSTC_MAX_ROWS=3;
  // r78 (HO-029): the shared marble confirm box (js/showdownConfirm.js, loaded on first use) replaces the native confirm().
  // It resolves true only for OK; Cancel, Esc or a box that cannot load resolve false (undefined when no loader exists).
  function pstcAskConfirm(message,tone){return typeof root.askShowdownConfirm==="function"?root.askShowdownConfirm(message,{tone}):typeof root.loadRuntimeScript==="function"?root.loadRuntimeScript("showdown-confirm","js/showdownConfirm.js",()=>typeof root.askShowdownConfirm==="function").then(()=>root.askShowdownConfirm(message,{tone}),()=>false):Promise.resolve(undefined);}
  // A lock cannot be undone, so a partly filled form asks first. Cancel (or any confirm failure) means do nothing; no confirm box at all means lock as before.
  async function pstcConfirmPartialLock(filled,noun){
    if(filled>=PSTC_MAX_ROWS)return true;
    return (await pstcAskConfirm(`Lock ${filled} of ${PSTC_MAX_ROWS} ${noun}? You can't change them after locking.`,"primary"))!==false;
  }
  function pstcBuildGuesses(role){
    const prefix=pstcGuessPrefix(role),rows=[];
    for(let i=1;i<=3;i+=1){const type=pstcField(`${prefix}Guess${i}Type`),value=pstcField(`${prefix}Guess${i}Value`),kind=String(type?.value||""),id=pstcCanonical(value),display=String(value?.value||"").trim();if(!kind&&!display)continue;if((kind!=="league"&&kind!=="nationality")||!display||!id)pstcFail("TRANSFER_GUESSES_INVALID",`Complete guess ${i} with a FIFA 17 league or nationality.`);rows.push({slot:i,type:kind,valueId:id});}
    return rows;
  }
  // Red team R87-SP-02 (Rule Book cards 03 and 06): the manager's own Special Player is a free extra signing that a rival's
  // guess can never release, so he is refused as one of the three Transfer War signings. Asked of the season step (which
  // loaded the draw before the window opened), with the Setup confirm time this page already holds: no read, nothing in
  // any protocol document. Without them (older Showdown, draw not loaded) nothing is refused.
  function pstcIsOwnSpecial(role,name){
    try{const step=root.CareerModeRosterRouletteStep,request=pstcRequestContext(),at=pstcSetupState()?.setupUpdatedAtMs;
      return Boolean(step&&typeof step.isOwnSpecial==="function"&&request&&Number.isFinite(at)&&step.isOwnSpecial(request.rivalryId,at,role,name));}
    catch(_error){return false;}
  }
  function pstcBuildSignings(role){
    const prefix=pstcRolePrefix(role),rows=[];
    for(let i=1;i<=3;i+=1){const name=pstcField(`${prefix}Signing${i}Name`),ovr=pstcField(`${prefix}Signing${i}Overall`),pos=pstcField(`${prefix}Signing${i}Position`),league=pstcField(`${prefix}Signing${i}League`),nationality=pstcField(`${prefix}Signing${i}Nationality`),player=String(name?.value||"").trim(),ovrText=String(ovr?.value||"").trim(),posText=String(pos?.value||"").trim(),leagueId=pstcCanonical(league),nationalityId=pstcCanonical(nationality),hasAny=Boolean(player||ovrText||posText||String(league?.value||"").trim()||String(nationality?.value||"").trim());if(!hasAny)continue;if(!player||!leagueId||!nationalityId||(ovr&&!/^[3-9][0-9]$/.test(ovrText))||(pos&&!SIGNING_POSITIONS.includes(posText)))pstcFail("TRANSFER_SIGNINGS_INVALID",`Complete signing ${i} with player name, position, overall (30-99), previous league and nationality.`);if(pstcIsOwnSpecial(role,player))pstcFail("TRANSFER_SIGNING_SPECIAL_PLAYER",`Signing ${i} is your Special Player. He is a free extra signing that a guess can never release, so don't enter him here.`);const row={slot:i,name:player,leagueId,nationalityId};if(ovr)row.overall=Number(ovrText);if(pos)row.position=posText;rows.push(row);}
    return rows;
  }
  function pstcSyncGuessValue(type,value,editable){
    if(!value)return;const kind=String(type?.value||""),valid=kind==="league"||kind==="nationality";
    if(valid){if(typeof root.updateTransferSelectorKind==="function")root.updateTransferSelectorKind(value,kind);value.placeholder=kind==="league"?"Search FIFA 17 league":"Search nationality";pstcDisable(value,!editable);return;}
    value.value="";delete value.dataset.canonicalId;delete value.dataset.canonicalLabel;value.placeholder="Choose League or Nationality first";pstcDisable(value,true);
  }
  function pstcSyncOwnGuessControls(role,editable){
    const prefix=pstcGuessPrefix(role);for(let i=1;i<=3;i+=1)pstcSyncGuessValue(pstcField(`${prefix}Guess${i}Type`),pstcField(`${prefix}Guess${i}Value`),editable);
  }
  function pstcGuessTypeChange(event){
    if(!pstcSharedMarker()||view?.state?.phase!=="GUESS_ENTRY")return;const role=view?.managerRole,target=event.target;if(!role||!target?.id)return;
    const prefix=pstcGuessPrefix(role),match=target.id.match(new RegExp(`^${prefix}Guess([1-3])Type$`));if(!match)return;
    pstcSyncGuessValue(target,pstcField(`${prefix}Guess${match[1]}Value`),!busy&&!view?.state?.guessLockedRoles?.includes(role));
  }
  function pstcPopulateGuesses(role,guesses){const prefix=pstcGuessPrefix(role);for(let i=1;i<=3;i+=1){const row=(guesses||[]).find(item=>item.slot===i),type=pstcField(`${prefix}Guess${i}Type`),value=pstcField(`${prefix}Guess${i}Value`);if(type)type.value=row?.type||"";if(value&&row){if(typeof root.updateTransferSelectorKind==="function")root.updateTransferSelectorKind(value,row.type);pstcSetSelector(value,row.type,row.valueId);}else if(value){value.value="";delete value.dataset.canonicalId;delete value.dataset.canonicalLabel;}}}
  function pstcPopulateSignings(role,signings){const prefix=pstcRolePrefix(role);for(let i=1;i<=3;i+=1){const row=(signings||[]).find(item=>item.slot===i),name=pstcField(`${prefix}Signing${i}Name`),ovr=pstcField(`${prefix}Signing${i}Overall`),pos=pstcField(`${prefix}Signing${i}Position`);if(name)name.value=row?.name||"";if(ovr)ovr.value=Number.isInteger(row?.overall)?String(row.overall):"";if(pos)pos.value=SIGNING_POSITIONS.includes(row?.position)?row.position:"";pstcSetSelector(pstcField(`${prefix}Signing${i}League`),"league",row?.leagueId||"");pstcSetSelector(pstcField(`${prefix}Signing${i}Nationality`),"nationality",row?.nationalityId||"");}}
  function pstcPopulateRole(role,inputs){if(!inputs)return;if(inputs.guesses)pstcPopulateGuesses(role,inputs.guesses);if(inputs.signings)pstcPopulateSignings(role,inputs.signings);}
  let signingDraftKey="";
  function pstcSigningDraftKey(role){const request=pstcRequestContext();return request&&role?(`cms.signingDraft.v1:${request.rivalryId}:${request.seasonNumber}:${role}`):"";}
  function pstcRemoveSigningDraft(key){if(key&&typeof root.removeStorageValue==="function")root.removeStorageValue(key);}
  function pstcClearSigningDraft(role){const key=pstcSigningDraftKey(role);pstcRemoveSigningDraft(key);if(signingDraftKey===key)signingDraftKey="";}
  function pstcSaveSigningDraft(role){
    const request=pstcRequestContext(),state=view?.state;
    if(!request||!state||state.phase!=="SIGNING_ENTRY"||state.signingLockedRoles?.includes(role)||view.managerRole!==role||pstcReplayPhase())return false;
    const prefix=pstcRolePrefix(role),rows=[];
    for(let slot=1;slot<=3;slot+=1){const name=pstcField(`${prefix}Signing${slot}Name`),ovr=pstcField(`${prefix}Signing${slot}Overall`),pos=pstcField(`${prefix}Signing${slot}Position`),league=pstcField(`${prefix}Signing${slot}League`),nationality=pstcField(`${prefix}Signing${slot}Nationality`);rows.push({slot,name:String(name?.value||""),overall:String(ovr?.value||""),position:String(pos?.value||""),leagueId:pstcCanonical(league),league:String(league?.value||""),nationalityId:pstcCanonical(nationality),nationality:String(nationality?.value||"")});}
    const key=pstcSigningDraftKey(role);if(!key||typeof root.writeStorageValue!=="function")return false;if(!root.writeStorageValue(key,JSON.stringify({version:1,rivalryId:request.rivalryId,seasonNumber:request.seasonNumber,role,rows})))return false;signingDraftKey=key;return true;
  }
  function pstcRestoreSigningDraft(role,own,force=false){
    const key=pstcSigningDraftKey(role),request=pstcRequestContext(),state=view?.state;
    if(!key||!request||!state||state.phase!=="SIGNING_ENTRY")return false;
    const shared=Array.isArray(own?.signings)?own.signings:[];
    if(state.signingLockedRoles?.includes(role)||shared.length){pstcRemoveSigningDraft(key);return false;}
    let draft;try{draft=JSON.parse((typeof root.readStorageValue==="function"?root.readStorageValue(key):null)||"null");}catch(_error){return false;}
    if(!draft||draft.version!==1||draft.rivalryId!==request.rivalryId||Number(draft.seasonNumber)!==request.seasonNumber||draft.role!==role||!Array.isArray(draft.rows))return false;
    const prefix=pstcRolePrefix(role);
    for(let slot=1;slot<=3;slot+=1){if(shared.some(row=>Number(row.slot)===slot))continue;const row=draft.rows.find(item=>Number(item.slot)===slot);if(!row)continue;const name=pstcField(`${prefix}Signing${slot}Name`),ovr=pstcField(`${prefix}Signing${slot}Overall`),pos=pstcField(`${prefix}Signing${slot}Position`),league=pstcField(`${prefix}Signing${slot}League`),nationality=pstcField(`${prefix}Signing${slot}Nationality`);const fill=node=>node&&(force||!String(node.value||""));if(fill(name))name.value=String(row.name||"");if(fill(ovr))ovr.value=String(row.overall||"").replace(/\D/g,"").slice(0,2);if(fill(pos)&&(force||SIGNING_POSITIONS.includes(row.position)))pos.value=SIGNING_POSITIONS.includes(row.position)?row.position:"";if(fill(league)){if(row.leagueId)pstcSetSelector(league,"league",row.leagueId);else{league.value=String(row.league||"");delete league.dataset.canonicalId;delete league.dataset.canonicalLabel;}}if(fill(nationality)){if(row.nationalityId)pstcSetSelector(nationality,"nationality",row.nationalityId);else{nationality.value=String(row.nationality||"");delete nationality.dataset.canonicalId;delete nationality.dataset.canonicalLabel;}}}
    signingDraftKey=key;return true;
  }
  // QoL 6: half-typed guesses against the rival survive a reload. Own manager only, this device only, through the js/storage.js draft helpers; removed on lock.
  let guessDraftRef=null;
  function pstcGuessDraftRef(role){const request=pstcRequestContext();return request&&role?{rivalryId:request.rivalryId,seasonNumber:request.seasonNumber,role}:null;}
  function pstcSameGuessDraftRef(a,b){return Boolean(a&&b&&a.rivalryId===b.rivalryId&&a.seasonNumber===b.seasonNumber&&a.role===b.role);}
  function pstcGuessDraftKey(ref){return ref?`cms.draft.v1:${ref.rivalryId}:${ref.seasonNumber}:${ref.role}:transferGuess`:"";}
  function pstcRemoveGuessDraft(ref){const key=pstcGuessDraftKey(ref);if(key&&typeof root.removeStorageValue==="function")root.removeStorageValue(key);}
  function pstcClearGuessDraft(role){const ref=pstcGuessDraftRef(role);pstcRemoveGuessDraft(ref);if(pstcSameGuessDraftRef(guessDraftRef,ref))guessDraftRef=null;}
  function pstcSaveGuessDraft(role){
    const request=pstcRequestContext(),state=view?.state;
    if(!request||!state||state.phase!=="GUESS_ENTRY"||state.guessLockedRoles?.includes(role)||view.managerRole!==role||pstcReplayPhase()||typeof root.writeStorageValue!=="function")return false;
    const prefix=pstcGuessPrefix(role),rows=[];
    for(let slot=1;slot<=3;slot+=1){const type=pstcField(`${prefix}Guess${slot}Type`),value=pstcField(`${prefix}Guess${slot}Value`),kind=String(type?.value||""),text=String(value?.value||"");if(!kind&&!text)continue;rows.push({slot,type:kind,valueId:pstcCanonical(value),value:text});}
    if(!rows.length){pstcClearGuessDraft(role);return true;}
    const ref=pstcGuessDraftRef(role);if(root.writeStorageValue(pstcGuessDraftKey(ref),JSON.stringify({version:1,rivalryId:request.rivalryId,seasonNumber:request.seasonNumber,role,rows}))!==true)return false;guessDraftRef=ref;return true;
  }
  function pstcRestoreGuessDraft(role,own){
    const request=pstcRequestContext(),state=view?.state;
    if(!request||!state||state.phase!=="GUESS_ENTRY"||typeof root.readStorageValue!=="function")return false;
    if(state.guessLockedRoles?.includes(role)||(Array.isArray(own?.guesses)&&own.guesses.length)){pstcClearGuessDraft(role);return false;}
    let saved;try{saved=JSON.parse(root.readStorageValue(pstcGuessDraftKey(pstcGuessDraftRef(role)))||"null");}catch(_error){return false;}
    if(!saved||saved.version!==1||saved.rivalryId!==request.rivalryId||Number(saved.seasonNumber)!==request.seasonNumber||saved.role!==role||!Array.isArray(saved.rows))return false;
    const prefix=pstcGuessPrefix(role);
    for(let slot=1;slot<=3;slot+=1){
      const row=saved.rows.find(item=>Number(item?.slot)===slot),type=pstcField(`${prefix}Guess${slot}Type`),value=pstcField(`${prefix}Guess${slot}Value`);
      if(!row||!type||!value||String(type.value||"")||String(value.value||""))continue;
      const kind=String(row.type||"");if(kind!=="league"&&kind!=="nationality")continue;
      type.value=kind;pstcSyncGuessValue(type,value,true);
      const text=String(row.value||"").slice(0,120);if(row.valueId||text)pstcSetSelector(value,kind,String(row.valueId||text));
    }
    guessDraftRef=pstcGuessDraftRef(role);return true;
  }
  function pstcGuessDraftChange(event){
    const target=event?.target,role=view?.managerRole;if(!target?.id||!role||!pstcSharedMarker())return;
    const prefix=pstcGuessPrefix(role);if(!new RegExp(`^${prefix}Guess[1-3](Type|Value)$`).test(target.id))return;
    if(view?.state?.phase!=="GUESS_ENTRY"||view.state.guessLockedRoles?.includes(role))return;
    pstcSaveGuessDraft(role);
    // The selector fills its canonical id in its own input handler, which runs after this capture handler; save once more when it has.
    if(typeof root.setTimeout==="function")root.setTimeout(()=>{if(view?.managerRole===role)pstcSaveGuessDraft(role);},0);
  }
  function pstcDisableRole(role,disabled){const signing=pstcRolePrefix(role),guess=pstcGuessPrefix(role);for(let i=1;i<=3;i+=1){[`${signing}Signing${i}Name`,`${signing}Signing${i}Overall`,`${signing}Signing${i}Position`,`${signing}Signing${i}League`,`${signing}Signing${i}Nationality`,`${guess}Guess${i}Type`,`${guess}Guess${i}Value`].forEach(id=>pstcDisable(pstcField(id),disabled));}}
  function pstcRenderVerdictCard(role,rows){const target=pstcField(role==="playerOne"?"transferResultsOne":"transferResultsTwo");if(!target)return;target.replaceChildren();const heading=root.document.createElement("h4");heading.textContent=`${pstcManagerName(role)} · ${pstcClubName(role)}`;target.append(heading);if(!rows||!rows.length){const empty=root.document.createElement("p");empty.textContent="No signings were entered.";target.append(empty);return;}rows.forEach(row=>{const item=root.document.createElement("p"),name=root.document.createElement("strong"),status=root.document.createElement("span");name.textContent=row.name;status.textContent=row.release?"RELEASE · MATCHED BY RIVAL GUESS":"KEEP · NO RIVAL GUESS MATCH";item.append(name,root.document.createTextNode(" — "),status);target.append(item);});}
  function pstcRenderVerdictLoading(role){const target=pstcField(role==="playerOne"?"transferResultsOne":"transferResultsTwo");if(!target)return;target.replaceChildren();const heading=root.document.createElement("h4");heading.textContent=`${pstcManagerName(role)} · ${pstcClubName(role)}`;const line=root.document.createElement("p");line.textContent="Saved. Loading the verdicts…";target.append(heading,line);}
  function pstcRenderProgress(phase){
    const localPhase=PHASE_PROGRESS[phase]||"window",order=["window","guess_entry","signing_entry","completed"],index=order.indexOf(localPhase),screen=pstcField("transferChallenge");
    if(screen)screen.dataset.transferPhase=localPhase;
    root.document?.querySelectorAll?.("#transferPhaseNavigator [data-transfer-phase-step]").forEach(step=>{const stepIndex=order.indexOf(step.dataset.transferPhaseStep);step.classList.toggle("active",stepIndex===index);step.classList.toggle("done",stepIndex>=0&&stepIndex<index);});
    const copy={NOT_STARTED:`Transfer Window · ${pstcManagerName(view?.setup?.coordinatorRole||"playerOne")} starts the 15-minute window.`,WINDOW_OPEN:"Transfer Window · you both see the same clock and can agree to end it early.",GUESS_ENTRY:"Guesses · enter your guesses. Your rival can't see them yet.",SIGNING_ENTRY:"Signings · guesses are locked. Enter the signings you made in FIFA 17.",COMPLETED:"Verdicts · both sides are revealed and checked the same way."};
    pstcText("transferPhaseIntro",copy[phase]||copy.NOT_STARTED);
  }
  function pstcRenderTimer(){
    if(pstcExpiryPaused())return;
    const timer=pstcField("transferTimerDisplay"),state=view?.state;if(!timer)return;
    if(pstcReplayPhase()){timer.textContent="REPLAY";return;}
    if(!state||state.phase!=="WINDOW_OPEN"){timer.textContent=state?"00:00":"15:00";return;}
    const request=pstcRequestContext();
    if(!request||!pstcClockReady(request)){timer.textContent="SYNC";return;}
    const now=pstcAuthoritativeNow(request),deadline=Number(state.startedAtEpochMs)+15*60*1000,remaining=Math.max(0,Math.ceil((deadline-now)/1000)),minutes=Math.floor(remaining/60),seconds=remaining%60;timer.textContent=`${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
    const revision=Number(view.revision);
    if(expiryAttemptContextKey!==request.key||expiryAttemptRevision!==revision){pstcResetExpiryAttempts();expiryAttemptContextKey=request.key;expiryAttemptRevision=revision;}
    const retryAllowed=!expiryPermissionDenied&&expiryAttemptCount<EXPIRY_MAX_ATTEMPTS&&(expiryAttemptCount===0||now-expiryAttemptAt>=EXPIRY_RETRY_MS);
    if(remaining===0&&!busy&&retryAllowed){expiryAttemptCount+=1;expiryAttemptAt=now;void pstcMutate("advanceExpiredWindow");}
  }
  // r75: a screen that starts or stops waiting on the partner registers its live listener at once (on the render that
  // shows the new state) instead of on the next 3 s check, so the partner's move is seen as soon as it lands.
  let pstcWatchedKey=null;
  function pstcWatchSync(){let key="";try{key=pstcWaitingKey()+"|"+(root.document?.visibilityState||"");}catch(_error){key="";}if(key===pstcWatchedKey)return;pstcWatchedKey=key;try{pstcWatchWait();}catch(_error){}}
  function pstcRender(){
    if(!root.document||!pstcSharedMarker())return false;
    pstcCapSigningNames();pstcWatchSync();
    const state=view?.state||null,role=view?.managerRole||pstcSetupState()?.managerRole||null;
    if(!role)return false;
    const key=viewContextKey||pstcBoundContextKey(view?.rivalryId||pstcSetupState()?.rivalryId||"",view?.seasonNumber||pstcSeason());pstcResetForContext(key,role);
    const other=role==="playerOne"?"playerTwo":"playerOne",actualPhase=state?.phase||"NOT_STARTED",replayPhase=pstcReplayPhase(key),phase=replayPhase||actualPhase,isReplay=Boolean(replayPhase),own=view?.ownInputs||null,opponent=view?.opponentInputs||null,screen=pstcField("transferChallenge");
    if(screen){if(isReplay)screen.dataset.sharedTransferReplay=phase;else delete screen.dataset.sharedTransferReplay;}
    pstcRenderProgress(phase);
    pstcText("transferChallengeTitle",`SEASON ${view?.seasonNumber||pstcSeason()} TRANSFER CHALLENGE`);pstcText("transferManagerOne",pstcManagerName("playerOne"));pstcText("transferManagerTwo",pstcManagerName("playerTwo"));pstcText("transferClubOne",pstcClubName("playerOne"));pstcText("transferClubTwo",pstcClubName("playerTwo"));pstcText("guessAgainstOneHeading",`${pstcManagerName("playerTwo")} guesses ${pstcManagerName("playerOne")}'s signings`);pstcText("guessAgainstTwoHeading",`${pstcManagerName("playerOne")} guesses ${pstcManagerName("playerTwo")}'s signings`);
    const start=pstcField("startTransferTimer"),end=pstcField("endTransferTimer"),complete=pstcField("completeTransferChallenge"),continueButton=pstcField("continueFromTransfers"),results=pstcField("transferChallengeResults"),actionBar=pstcField("transferPhaseActionBar"),signingGrid=root.document.querySelector("#transferChallenge .transferManagersGrid"),guessGrid=root.document.querySelector("#transferChallenge .transferGuessesGrid"),privacy=pstcField("transferGuessPrivacyNote"),summary=pstcField("transferPhaseLockSummary");
    if(start)delete start.dataset.rouletteWait;pstcHidden(start,true);pstcHidden(end,true);pstcHidden(complete,true);pstcHidden(actionBar,true);pstcHidden(continueButton,true);pstcHidden(results,true);pstcHidden(signingGrid,true);pstcHidden(guessGrid,true);pstcHidden(privacy,true);pstcHidden(summary,true);pstcHidden(pstcOwnSigningCard(role),false);pstcHidden(pstcOtherSigningCard(role),true);pstcHidden(pstcOwnGuessCard(role),false);pstcHidden(pstcOtherGuessCard(role),true);pstcDisableRole("playerOne",true);pstcDisableRole("playerTwo",true);
    if(own)pstcPopulateRole(role,own);if(actualPhase==="SIGNING_ENTRY"&&state?.signingLockedRoles?.includes(role))pstcClearSigningDraft(role);if(actualPhase==="SIGNING_ENTRY"&&!isReplay&&!state?.signingLockedRoles?.includes(role))pstcRestoreSigningDraft(role,own);
    if(actualPhase==="SIGNING_ENTRY"||actualPhase==="COMPLETED"||(actualPhase==="GUESS_ENTRY"&&state?.guessLockedRoles?.includes(role)))pstcClearGuessDraft(role);else if(actualPhase==="GUESS_ENTRY"&&!isReplay)pstcRestoreGuessDraft(role,own);
    if(phase==="NOT_STARTED"){
      // Codex C2-02: this manager's own refused spin mark (the window cannot open without it) is shown on either phone, never
      // hidden behind the partner's "waiting for Daniel" line.
      // Fable F6-03: the missing marks are worked out for both roles (no read), so the partner whose own mark is still being
      // saved sees that, not "waiting for the coordinator to start" while the coordinator's phone waits for his spin.
      const missing=isReplay?[]:pstcSpinsMissing(),ownMissing=missing.includes(role);
      const ownRefused=!isReplay&&Boolean(spinRefusedKey&&spinRefusedKey===pstcRequestContext()?.key&&ownMissing);
      pstcText("transferPhaseStatus",ownRefused?"READY · YOUR SPIN WAS NOT SAVED · RELOAD TO RETRY":role===view?.setup?.coordinatorRole?"READY · YOU START THE WINDOW":ownMissing?"READY · SAVING YOUR ROULETTE SPIN…":`READY · WAITING FOR ${String(pstcManagerName(view?.setup?.coordinatorRole||"playerOne")).toUpperCase()} TO START`);
      if(role===view?.setup?.coordinatorRole){
        pstcHidden(start,false);
        // RT5-FLOW-02: until both marks are on the server the button is the waiting line: full gold edge and words (HO-027,
        // never dimmed; css/transfer.css), not tappable, and it turns into START by itself when the partner's mark arrives.
        if(missing.length){const refusedHere=Boolean(spinRefusedKey&&spinRefusedKey===pstcRequestContext()?.key&&missing.includes(view.managerRole));const label=refusedHere?"YOUR SPIN WAS NOT SAVED · RELOAD TO RETRY":missing.includes(other)?`WAITING FOR ${String(pstcManagerName(other)).toUpperCase()} TO SPIN THE ROULETTE`:"SAVING YOUR ROULETTE SPIN…";start.textContent=label;start.dataset.rouletteWait="true";pstcDisable(start,true);pstcText("transferPhaseStatus",`READY · ${label}`);}
        else{delete start.dataset.rouletteWait;start.textContent="START 15-MINUTE WINDOW";pstcDisable(start,busy);}
      }
    }else if(phase==="WINDOW_OPEN"){
      if(isReplay){pstcText("transferPhaseStatus","REPLAY · TRANSFER WINDOW");pstcText("transferTimerDisplay","REPLAY");}
      else{const requested=state.endRequestedRoles?.includes(role);pstcText("transferPhaseStatus",requested?"TRANSFER WINDOW LIVE · YOU ASKED TO END EARLY":"TRANSFER WINDOW LIVE · BUILD YOUR FIFA 17 SQUAD");pstcHidden(end,false);end.textContent=requested?"EARLY END REQUESTED ✓":"REQUEST EARLY END";pstcDisable(end,busy||requested);pstcRenderTimer();}
    }else if(phase==="GUESS_ENTRY"){
      const locked=state.guessLockedRoles?.includes(role);pstcText("transferPhaseStatus",isReplay?"REPLAY · GUESSES":locked?"GUESSES LOCKED · WAITING FOR YOUR RIVAL":"GUESSES · HIDDEN FROM YOUR RIVAL UNTIL YOU BOTH LOCK");pstcHidden(guessGrid,false);pstcHidden(privacy,false);if(privacy)privacy.textContent=isReplay?"Replay: read-only. Nothing new about your rival is shown.":"Enter your guesses. Your rival can't see them until you both finish.";if(!isReplay&&!locked){const card=pstcOwnGuessCard(role);card?.querySelectorAll("input,select").forEach(node=>pstcDisable(node,false));pstcSyncOwnGuessControls(role,true);pstcHidden(actionBar,false);pstcHidden(complete,false);complete.textContent="LOCK MY GUESSES";pstcDisable(complete,busy);}
    }else if(phase==="SIGNING_ENTRY"){
      const locked=state.signingLockedRoles?.includes(role);pstcText("transferPhaseStatus",isReplay?"REPLAY · SIGNINGS":locked?"SIGNINGS LOCKED · WAITING FOR YOUR RIVAL":"SIGNINGS · ENTER YOUR FIFA 17 TRANSFERS");pstcHidden(signingGrid,false);pstcHidden(summary,false);if(summary)summary.textContent=isReplay?"Replay: your signings are read-only. Nothing here changes the game or your save.":"Both sets of guesses are locked. Enter your own signings; your rival still can't see them.";if(!isReplay&&!locked){const card=pstcOwnSigningCard(role);card?.querySelectorAll("input,select").forEach(node=>pstcDisable(node,false));pstcHidden(actionBar,false);pstcHidden(complete,false);complete.textContent="LOCK MY SIGNINGS";pstcDisable(complete,busy);}
    }else if(phase==="COMPLETED"){
      // F2-08: COMPLETED without its verdicts yet (the follow-up read after the lock failed): saved, loading, never "No signings".
      const loadingVerdicts=!view?.verdicts;
      pstcText("transferPhaseStatus",loadingVerdicts?"SAVED · LOADING VERDICTS":"TRANSFER CHALLENGE COMPLETE · VERDICTS REVEALED");pstcHidden(signingGrid,false);pstcHidden(guessGrid,false);pstcHidden(results,false);pstcHidden(pstcOtherSigningCard(role),false);pstcHidden(pstcOtherGuessCard(role),false);pstcPopulateRole(role,own);pstcPopulateRole(other,opponent);pstcDisableRole("playerOne",true);pstcDisableRole("playerTwo",true);if(loadingVerdicts){pstcRenderVerdictLoading("playerOne");pstcRenderVerdictLoading("playerTwo");}else{pstcRenderVerdictCard("playerOne",view.verdicts.playerOne||[]);pstcRenderVerdictCard("playerTwo",view.verdicts.playerTwo||[]);}if(continueButton){continueButton.textContent="SEASON RESULTS NEXT";pstcHidden(continueButton,false);pstcDisable(continueButton,true);}
    }
    if(isReplay&&continueButton){continueButton.textContent=`CONTINUE REPLAY · ${phase.replaceAll("_"," ")}`;pstcHidden(actionBar,false);pstcHidden(continueButton,false);pstcDisable(continueButton,false);}
    pstcMarkWitness(key,phase);
    const refresh=pstcEnsureRefreshButton();pstcDisable(refresh,busy||isReplay);return true;
  }
  function pstcEnsureRefreshButton(){let button=pstcField("refreshSharedTransferChallenge");if(button)return button;const actions=root.document&&root.document.querySelector("#transferChallenge .transferTimerActions");if(!actions)return null;button=root.document.createElement("button");button.id="refreshSharedTransferChallenge";button.className="menuButton";button.type="button";button.textContent="REFRESH CHALLENGE";button.addEventListener("click",event=>{event.preventDefault();if(pstcReplayPhase())return;void pstcRefresh().catch(error=>{pstcSetError(pstcErrorText(error,"The Transfer Challenge did not refresh. Try again."));pstcReport("Unable to refresh Shared Transfer Challenge",error);});});actions.append(button);return button;}
  function pstcDecorateDashboard(){if(!root.document||!pstcSharedMarker())return false;const currentKey=pstcCurrentContextKey();if(viewContextKey&&currentKey&&viewContextKey!==currentKey)return false;const button=pstcField("seasonPrimaryAction"),status=pstcField("dashboardTransferStatus"),state=view?.state||null;if(!button||!status)return false;button.dataset.sharedTransferChallenge="true";button.disabled=Boolean(openPromise);if(openPromise){button.setAttribute("aria-busy","true");button.textContent="OPENING TRANSFER CHALLENGE…";return true;}if(button.hasAttribute("aria-busy"))button.removeAttribute("aria-busy");const season=view?.seasonNumber||(()=>{try{return pstcSeason();}catch(_error){return 1;}})();if(!state){button.textContent=`START SEASON ${season} TRANSFER CHALLENGE`;status.textContent="Transfer Challenge: ready";}else if(state.phase==="WINDOW_OPEN"){button.textContent="OPEN TRANSFER WINDOW";status.textContent="Transfer Challenge: window live";}else if(state.phase==="GUESS_ENTRY"){button.textContent="ENTER GUESSES";status.textContent="Transfer Challenge: guesses";}else if(state.phase==="SIGNING_ENTRY"){button.textContent="ENTER SIGNINGS";status.textContent="Transfer Challenge: signings";}else{button.textContent="VIEW TRANSFER VERDICTS";status.textContent="Transfer Challenge: complete";}if(rouletteError)status.textContent=rouletteError;return true;}
  // r50: the first open loads the Transfer runtime and reads authority; show it and share one attempt.
  // r87 Russian Roster Roulette (js/rosterRouletteStep.js): before this season's Transfer Challenge opens, this manager does
  // the season's roulette once (board from season 2, both spins, the release). It decides for itself whether it applies (a
  // Showdown confirmed on r87 or later, not done yet on this browser) and never rejects. false = he went back to Home, or the
  // step itself could not load: the window then stays shut with a TRY AGAIN line on the dashboard (red team R87-B-02).
  // The confirm time comes with the Setup read; only a manager whose Setup state came from his own confirm tap reads it once.
  async function pstcRouletteFirst(request){
    rouletteError="";
    try{
      if(!view||!view.managerRole||!request)return true;
      let confirmedAtMs=pstcSetupState()?.setupUpdatedAtMs;
      if(!Number.isFinite(confirmedAtMs)&&typeof setupApi?.refresh==="function"){await Promise.resolve(setupApi.refresh()).catch(()=>null);confirmedAtMs=pstcSetupState()?.setupUpdatedAtMs;}
      // Every Setup read carries the confirm time (the ledger's updatedAt is a required field), so a missing one means the
      // Setup could not be read just now: the window stays shut with the reason, never opened without the roulette (Fable F2-05).
      if(!Number.isFinite(confirmedAtMs)){rouletteError=PSTC_ROULETTE_TEXT.setup;return false;}
      // F2-02 / F2-10: this season's marks from the read just made (no new read), whether the window already opened (both
      // managers spun), where this manager's outcome goes, and a fresh look at the marks for the version stop's TRY AGAIN.
      const ctx={rivalryId:request.rivalryId,managerRole:view.managerRole,season:request.seasonNumber,clubs:{playerOne:pstcClubName("playerOne"),playerTwo:pstcClubName("playerTwo")},confirmedAtMs,phase:view.state?.phase||"NOT_STARTED",
        marks:view.state?null:(view.spinMarks||null),windowStarted:Boolean(view.state),
        remember:outcome=>pstcRememberOutcome(request,view?.managerRole,outcome),
        refreshMarks:async()=>{const fresh=await pstcRefresh(true,false);return fresh&&viewContextKey===request.key?{marks:view.state?null:(view.spinMarks||null),windowStarted:Boolean(view.state)}:null;},
        verdicts:season=>pstcRouletteVerdicts(request,season)};
      let timer;const step=await Promise.race([pstcLoadScript("roster-roulette-step","js/rosterRouletteStep.js",()=>root.CareerModeRosterRouletteStep),new Promise(resolve=>{timer=root.setTimeout(()=>resolve(null),10000);})]).finally(()=>root.clearTimeout(timer));
      if(!step){rouletteError=PSTC_ROULETTE_TEXT.load;return false;}
      // The Special Player draw for the signing form (R87-SP-02), also when the roulette is already done here (Fable F2-06).
      if(typeof step.ensureDraw==="function"&&!await step.ensureDraw()){rouletteError=PSTC_ROULETTE_TEXT.draw;return false;}
      rouletteGate={key:request.key,applies:pstcRouletteAppliesTo(confirmedAtMs,step)};
      // Done on this browser before (or the step does not run for this manager): his mark still goes to the server once.
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
  function pstcSpunRoles(){return Array.isArray(view?.spunRoles)?view.spunRoles.filter(role=>role==="playerOne"||role==="playerTwo"):[];}
  // The roles whose mark is still missing for this season's window (empty once it opened, or when the roulette does not apply).
  function pstcSpinsMissing(){
    const request=pstcRequestContext();if(!view||view.state||!request||viewContextKey!==request.key||!pstcRouletteApplies(request))return [];
    const spun=pstcSpunRoles();return ["playerOne","playerTwo"].filter(role=>!spun.includes(role));
  }
  const SPIN_WRITE_WAIT_MS=8000;
  async function pstcAfterSpin(request){
    if(!request||rouletteClearedKey!==request.key||!pstcRouletteApplies(request)||view?.state)return;
    spinPendingKey=request.key;
    let timer;await Promise.race([pstcMarkSpun(request),new Promise(resolve=>{timer=root.setTimeout(resolve,SPIN_WRITE_WAIT_MS);})]).finally(()=>root.clearTimeout(timer));
  }
  // One merge write of this manager's own mark (no read); idempotent. On success the view shows it at once. A refused write
  // (Rules on the server that do not know the marks: they must be deployed with or before this client) is not retried on every
  // check; the screen keeps waiting and says to reload, which writes it once more. Any other failure stays pending.
  function pstcMarkSpun(request){
    if(spinWriting)return spinWriting;
    const role=view?.managerRole;
    if(!request||spinPendingKey!==request.key||!role||viewContextKey!==request.key||view.state||pstcSpunRoles().includes(role)){if(view?.state||pstcSpunRoles().includes(role))spinPendingKey="";return Promise.resolve(false);}
    const run=(async()=>{
      const provided=await pstcProviderOptions(request,true);if(!provided?.options||!pstcRequestMatches(request))return false;
      const outcome=pstcPendingOutcome(request,role);
      let result=await provider.markSpun({...provided.options,managerRole:role,...(outcome?{outcome}:{})});
      if(!pstcRequestMatches(request))return false;
      // F2-02: a mark is written once. A refusal after an earlier write whose answer was lost: the server already holds it.
      if(/permission/i.test(String(result?.code||""))){try{const fresh=await pstcRefreshNow(request,true);if(fresh&&!fresh.state&&pstcSpunRoles().includes(role))result={ok:true};}catch(_error){}}
      if(result&&result.ok===true){
        spinPendingKey="";spinRefusedKey="";
        if(view&&viewContextKey===request.key&&!view.state){const spun=pstcSpunRoles();view={...view,spunRoles:["playerOne","playerTwo"].filter(item=>item===role||spun.includes(item))};}
        pstcRender();return true;
      }
      if(/permission/i.test(String(result?.code||""))&&view&&!view.state){spinPendingKey="";spinRefusedKey=request.key;pstcRender();}
      return false;
    })().catch(()=>false).finally(()=>{if(spinWriting===run)spinWriting=null;});
    spinWriting=run;return run;
  }
  function pstcCloseRoulette(){try{root.CareerModeRosterRouletteStep?.close?.();}catch(_error){}}
  function pstcOpen(){if(openPromise)return openPromise;const run=Promise.resolve().then(pstcOpenNow);openPromise=run;run.finally(()=>{if(openPromise===run)openPromise=null;pstcDecorateDashboard();}).catch(()=>{});try{pstcDecorateDashboard();}catch(_error){}return run;}
  // Fable F2-11: an earlier BACK from the roulette is forgotten first. Fable F2-14: the replay of phases this phone did not see
  // is set before the screen shows, so it never mounts the live phase first. Fable F2-01: the roulette's card and stage come
  // down on every way out, a navigation that fails included.
  async function pstcOpenNow(){if(!pstcSharedMarker())return false;try{root.CareerModeRosterRouletteStep?.forgetHome?.();}catch(_error){}await pstcEnsureDependencies();const request=pstcRequestContext(),result=await pstcRefresh();if(!request||!result||!pstcRequestMatches(request)||viewContextKey!==request.key)return false;if(typeof root.navigateTo!=="function")pstcFail("TRANSFER_NAVIGATION_UNAVAILABLE");if(!await pstcRouletteFirst(request)||!pstcRequestMatches(request)||viewContextKey!==request.key){pstcCloseRoulette();return false;}let shown=false;try{pstcPrepareReplay();pstcRender();shown=await root.navigateTo("transferChallenge");}finally{pstcCloseRoulette();}if(shown===false||!pstcRequestMatches(request)||viewContextKey!==request.key)return false;pstcPrepareReplay();pstcRender();return true;}
  async function pstcHandleAction(id){
    if(id==="seasonPrimaryAction")return pstcOpen();
    if(id==="continueFromTransfers"&&pstcReplayPhase())return pstcAdvanceReplay();
    if(pstcReplayPhase())return false;
    if(id==="startTransferTimer"){if(pstcSpinsMissing().length)return false;return pstcMutate("startWindow");}
    if(id==="endTransferTimer")return pstcMutate("requestEndWindow");
    if(id==="completeTransferChallenge"){
      const phase=view?.state?.phase,role=view?.managerRole;if(phase==="GUESS_ENTRY"){const guesses=pstcBuildGuesses(role);if(!await pstcConfirmPartialLock(guesses.length,"guesses"))return false;return pstcMutate("lockGuesses",{guesses});}if(phase==="SIGNING_ENTRY"){const signings=pstcBuildSignings(role);if(!await pstcConfirmPartialLock(signings.length,"signings"))return false;return pstcMutate("lockSignings",{signings});}pstcFail("TRANSFER_PHASE_INVALID");
    }
    if(id==="continueFromTransfers"){pstcSetError("Season results are not open yet. Tap REFRESH, then try again.");return false;}
    return false;
  }
  function pstcCapture(event){const target=event.target&&event.target.closest&&event.target.closest("button");if(!target||!CONTROL_IDS.includes(target.id)||!pstcSharedMarker())return;event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();if(target.id==="seasonPrimaryAction"&&pstcShowdownComplete()){void pstcOpenFinalResult();return;}void pstcHandleAction(target.id).catch(error=>{pstcSetError(pstcErrorText(error,"The Transfer Challenge did not load. Try again."));if(!pstcFormMistake(error))pstcReport("Shared Transfer Challenge action failed",error);});}
  // F1 (fault suite): every season of this Showdown is accepted (or it is closed), so there is no Transfer Challenge left to
  // start. With no view of its own the dashboard fell back to "START SEASON 1 TRANSFER CHALLENGE", a button that did nothing.
  // It now says VIEW FINAL RESULT and opens the final season's results (Final Winner follows there), or the closed Showdown's
  // Champion screen. Decided from what this page already holds (the season count, Terminal Close); no read.
  function pstcShowdownComplete(){
    try{
      const closed=root.CareerModeProductionSharedTerminalClose?.getState?.();if(closed&&closed.phase==="CLOSED"&&closed.terminal===true)return true;
      const rivalryId=String(pstcShowdown()?.sharedJourney?.rivalryId||pstcSetupState()?.rivalryId||""),progression=root.CareerModeProductionSharedMultiSeasonProgression?.getState?.();
      return Boolean(rivalryId&&progression?.authoritative===true&&String(progression.rivalryId||"")===rivalryId&&progression.state?.terminal===true);
    }catch(_error){return false;}
  }
  function pstcOpenFinalResult(){const entry=root.CareerModeProductionSharedJourneyEntry;return typeof entry?.openFinalResult==="function"?Promise.resolve(entry.openFinalResult()).catch(error=>{pstcReport("Unable to open the final result",error);return false;}):Promise.resolve(false);}
  const pstcDecorateLiveDashboard=pstcDecorateDashboard;
  // The live decoration stays exactly as it is; only a complete Showdown's button and status are replaced after it.
  pstcDecorateDashboard=function(){
    const decorated=pstcDecorateLiveDashboard();if(!decorated||openPromise||!pstcShowdownComplete())return decorated;
    const button=pstcField("seasonPrimaryAction"),status=pstcField("dashboardTransferStatus");
    if(button){button.textContent="VIEW FINAL RESULT";button.disabled=false;}
    if(status)status.textContent="Showdown complete";
    return true;
  };
  // r87: a form mistake caught on this phone is shown on the card only; a second toast covered the signing rows on phones.
  function pstcFormMistake(error){return Boolean(error)&&error.providerResult!==true&&(error.code==="TRANSFER_SIGNINGS_INVALID"||error.code==="TRANSFER_GUESSES_INVALID");}
  async function pstcTick(light=false){
    if(!pstcSharedMarker()||root.document?.visibilityState==="hidden")return;
    const currentKey=pstcCurrentContextKey();if(viewContextKey&&(!currentKey||viewContextKey!==currentKey))pstcClearCachedContext();
    // RS-04 (r87): a COMPLETED view is final, except while this page has neither its verdicts nor a kept copy (a post-lock refresh
    // that failed): then the next check reads it once more, while both managers are still on this screen, instead of the roulette
    // paying a slower read of it next season on one phone only.
    if(view?.state?.phase==="COMPLETED"&&viewContextKey&&currentKey&&viewContextKey===currentKey&&(view.verdicts||pstcKeptVerdicts(view.rivalryId,view.seasonNumber))){pstcDecorateDashboard();return;}
    try{if(!pstcConfirmedShared()||!pstcCareerReady()){await pstcEnsureDependencies();await setupApi.refresh();await careerApi.refresh();}if(pstcConfirmedShared()&&pstcCareerReady()&&!busy){const active=root.document&&root.document.getElementById("transferChallenge");if(active&&!active.classList.contains("hidden")){if(light!==true)pstcScreenFresh();await pstcRefresh(light===true,false);}else if(!view)await pstcRefresh(false,false);else pstcDecorateDashboard();}
      // RT5-FLOW-02: a mark that did not reach the server is written again (one write, no read) while the window is still shut.
      // Once this phone's own roulette is finished or does not apply (rouletteClearedKey, never the partner's mark alone), a
      // partner's mark arriving while his own is missing arms his own one write, unless the server refused it on this page.
      const request=pstcRequestContext();if(request&&rouletteClearedKey===request.key&&!busy&&view&&!view.state&&viewContextKey===request.key&&spinPendingKey!==request.key&&spinRefusedKey!==request.key&&view.managerRole&&pstcSpunRoles().length&&!pstcSpunRoles().includes(view.managerRole))spinPendingKey=request.key;
      if(request&&spinPendingKey===request.key&&!busy&&view&&!view.state)void pstcMarkSpun(request);
    }catch(_error){}
  }
  // Read-only: the fast lane only calls pstcTick (the same provider read as REFRESH CHALLENGE), never a write.
  function pstcWaitingKey(){
    if(!view||!view.managerRole||!pstcTransferScreenVisible()||pstcReplayPhase())return "";
    const state=view.state||{phase:"NOT_STARTED"},role=view.managerRole,other=role==="playerOne"?"playerTwo":"playerOne",has=(list,item)=>Array.isArray(list)&&list.includes(item);
    if((state.phase||"NOT_STARTED")==="NOT_STARTED"&&view.setup?.coordinatorRole&&role!==view.setup.coordinatorRole)return `${viewContextKey}|start`;
    if(state.phase==="WINDOW_OPEN"&&has(state.endRequestedRoles,role)&&!has(state.endRequestedRoles,other))return `${viewContextKey}|end`;
    if(state.phase==="GUESS_ENTRY"&&has(state.guessLockedRoles,role))return `${viewContextKey}|guesses`;
    if(state.phase==="SIGNING_ENTRY"&&has(state.signingLockedRoles,role))return `${viewContextKey}|signings`;
    return "";
  }
  function pstcFastPollDue(){const key=pstcWaitingKey();if(!key){fastWaitKey="";fastWaitSince=0;return false;}const now=Date.now();if(key!==fastWaitKey){fastWaitKey=key;fastWaitSince=now;}return now-fastWaitSince<FAST_POLL_WINDOW_MS;}
  // r75: while this screen waits on the partner, one live listener watches the shared document the partner's move changes;
  // the 3 s check below keeps running as the fallback and reads from the listener while it is healthy.
  function pstcWatchWait(){const budget=root.CareerModeFirestoreBudget;if(!budget||typeof budget.watchWaitPoint!=="function")return;let path=null;try{path=root.document?.visibilityState==="hidden"?null:(pstcWaitingKey()||pstcLiveScreen()?(request=>request&&request.rivalryId&&Number.isInteger(request.seasonNumber)?`rivalries/${request.rivalryId}/transferChallenges/season_${request.seasonNumber}`:null)(pstcRequestContext()):null);}catch(_error){path=null;}let relaxed=false;try{relaxed=Boolean(path&&!pstcWaitingKey()&&pstcLiveScreen());}catch(_error){relaxed=false;}budget.watchWaitPoint("transfer",path,pstcWaitWake,{relaxed});}
  // r75: the 15 s check of the visible Transfer screen always reads the shared challenge from the server, so a partner's
  // lock still shows within one poll on the screen the manager is looking at; checks from other screens reuse recent reads.
  // r84: the listener also watches while the window, guesses or signings are open on screen (not only after this manager's own
  // move): 15 s fresh reads of this document were ~32 billed reads/min for both phones over a 25-40 minute transfer window.
  // r84 trim: also before the window starts (no challenge yet), the most expensive idle: the coordinator's own START screen
  // re-read the context every 15 s; the listener now watches the (still missing) challenge document instead.
  function pstcLiveScreen(){try{return Boolean(view&&view.managerRole&&pstcTransferScreenVisible()&&!pstcReplayPhase()&&(!view.state||["WINDOW_OPEN","GUESS_ENTRY","SIGNING_ENTRY"].includes(view.state.phase)));}catch(_error){return false;}}
  function pstcScreenFresh(){try{const request=pstcRequestContext();if(request&&request.rivalryId&&Number.isInteger(request.seasonNumber)){const path=`rivalries/${request.rivalryId}/transferChallenges/season_${request.seasonNumber}`;if(!root.CareerModeFirestoreBudget?.watchesHealthy?.(path))root.CareerModeFirestoreBudget?.wantFresh?.(path);}}catch(_error){}}
  function pstcWaitWake(){if(!busy){void pstcTick(true);return;}if(typeof root.setTimeout==="function")root.setTimeout(()=>{if(!busy)void pstcTick(true);},400);}
  // r84 trim: like Results and Commit, the 3 s fallback check stands down while the wait listener on this exact challenge is
  // healthy; the listener's delivery wakes pstcTick at once and the 15 s check still runs. Each fallback check re-ran the
  // read-only transaction (challenge, rivalry, session, own role) about 20 times a minute on the waiting phone.
  function pstcWaitHealthy(){const request=pstcRequestContext(),live=root.CareerModeFirestoreBudget?.stats?.();return Boolean(request&&live?.watchHealthy&&live.watching===`rivalries/${request.rivalryId}/transferChallenges/season_${request.seasonNumber}`);}
  function pstcFastTick(){pstcWatchWait();if(pstcWaitHealthy()||root.document?.visibilityState==="hidden"||busy||!pstcFastPollDue())return;void pstcTick(true);}
  // Listen during bubbling so selector target handlers normalize the ID before the synchronous draft save.
  // Red team R87-B-04: a second tab of the same signing entry saved a newer draft. This tab takes it over before its next
  // autosave, so a stale form never writes over the newer signings (the browser sends this event only to the other tabs).
  function pstcSigningDraftStorage(event){const role=view?.managerRole,key=role&&pstcSigningDraftKey(role);if(!key||event?.key!==key||!event.newValue)return;if(view?.state?.phase!=="SIGNING_ENTRY"||view.state.signingLockedRoles?.includes(role)||pstcReplayPhase())return;pstcRestoreSigningDraft(role,view.ownInputs||null,true);}
  function pstcSigningDraftChange(event){const target=event?.target,role=view?.managerRole;if(!target?.id||!role||!target.id.startsWith(`${pstcRolePrefix(role)}Signing`))return;if(view?.state?.phase==="SIGNING_ENTRY"&&!view.state.signingLockedRoles?.includes(role))pstcSaveSigningDraft(role);}
  function pstcTimerTick(){if(!pstcSharedMarker()||pstcReplayPhase()||pstcExpiryPaused())return;const active=root.document&&root.document.getElementById("transferChallenge");if(active&&!active.classList.contains("hidden"))pstcRenderTimer();}
  function pstcVisibilityChange(){
    if(!pstcSharedMarker())return;
    if(root.document?.visibilityState==="hidden"){if(view?.state?.phase==="WINDOW_OPEN")expiryNeedsAuthority=true;return;}
    if(view?.state?.phase!=="WINDOW_OPEN"||pstcReplayPhase()){expiryNeedsAuthority=false;void pstcTick();return;}
    // Keep the shared deadline; refresh its clock and authority before expiry may act again.
    pstcClearClock();expiryNeedsAuthority=true;pstcScreenFresh();void pstcRefresh().catch(()=>{});
  }
  function pstcInstall(){if(installed)return true;installed=true;if(root.document){root.document.addEventListener("click",pstcCapture,true);root.document.addEventListener("change",pstcGuessTypeChange,true);root.document.addEventListener("input",pstcSigningDraftChange);root.document.addEventListener("change",pstcSigningDraftChange);if(typeof root.addEventListener==="function")root.addEventListener("storage",pstcSigningDraftStorage);root.document.addEventListener("input",pstcGuessDraftChange,true);root.document.addEventListener("change",pstcGuessDraftChange,true);root.document.addEventListener("visibilitychange",pstcVisibilityChange);}root.addEventListener?.("online",pstcVisibilityChange);root.addEventListener?.("career-mode-shared-season-cursor-change",()=>{pstcClearCachedContext();void pstcTick();});if(typeof root.setInterval==="function"){pollTimer=root.setInterval(()=>void pstcTick(),POLL_MS);timerLoop=root.setInterval(pstcTimerTick,TIMER_MS);root.setInterval(pstcFastTick,FAST_POLL_MS);}if(pstcSharedMarker())void pstcTick();return true;}

  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-transfer-challenge",productionEnabled:true,requiresCareerStartReady:true,requiresExactActiveSession:true,privateUntilCompleted:true,serverClockAuthoritative:true,canonicalStorageMutation:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,orderedFullScreenReplay:true,inMemoryWitnessOnly:false,pollIntervalMs:POLL_MS,fastPollIntervalMs:FAST_POLL_MS,fastPollWindowMs:FAST_POLL_WINDOW_MS,isWaitingForRival:()=>Boolean(pstcWaitingKey()),spinsMissing:()=>[...pstcSpinsMissing()],rouletteError:()=>rouletteError,rouletteAppliesTo:pstcRouletteAppliesTo,install:pstcInstall,open:pstcOpen,refresh:pstcRefresh,getState:()=>view,isActive:pstcSharedMarker,canRoute:pstcCanRoute,canResumeResults:pstcCanResumeResults,rememberResultsView:pstcRememberResultsView});
});

````

## FILE: js/sparkSharedTransferChallenge.js

````js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkSharedTransferChallenge=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const protocol=typeof require==="function"?require("./sharedTransferChallenge.js"):root.CareerModeSharedTransferChallenge;
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const OPERATION=/^transfer_op_[0-9a-f]{32}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const PUBLIC_KEYS=Object.freeze([
    "schemaVersion","objectType","rivalryId","seasonNumber","runtimeRevision","coordinatorRole","phase","revision",
    "startedAt","endedAt","endRequestedRoles","guessLockedRoles","signingLockedRoles",
    "operationIds","operationTypes","operationHashes","baseRevisions","actorRoles",
    "activeSessionId","updatedAt","updatedByDeviceId"
  ]);
  const PRIVATE_KEYS=Object.freeze([
    "schemaVersion","objectType","rivalryId","seasonNumber","managerRole","guesses","signings",
    "guessLockedAt","signingLockedAt","activeSessionId","updatedAt","updatedByDeviceId"
  ]);
  // JOB-1051: a role document written by r66 has exactly PRIVATE_KEYS (no salts); a new one has PRIVATE_KEYS plus both salt keys.
  const SALT_KEYS=Object.freeze(["guessSalt","signingSalt"]);
  const SALT=/^[0-9a-f]{64}$/;
  // r87 (Nik 2026-10-31, red team RT5-FLOW-02): the shared window waits until both managers have spun this season's Russian
  // Roster Roulette. Before the window opens, the season's public document may exist as a small pre-window mark document:
  // each manager adds his own role to spins (one merge write, no read) when he confirms his release. START needs both;
  // starting the window replaces the document with the normal ledger (exactly PUBLIC_KEYS, so no other reader changes).
  const SPIN_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","seasonNumber","phase","spins","updatedAt"]);
  // F2-02 (Fable job 2): a mark records that season's outcome for its manager (js/rosterRoulette.js outcome): fired, hitName,
  // hitNumber, hitSlot (0-14), hitSignedSeason (1-10, or null for a club player) and the engine and data version. A mark from a
  // phone that ran no roulette (switched off, no confirm time) is plain true. Each manager writes his own entry once (the Rules refuse a second write).
  const OUTCOME_KEYS=Object.freeze(["fired","hitName","hitNumber","hitSlot","hitSignedSeason","version"]);
  const OUTCOME_VERSION=/^rr[0-9]{1,3}\.[0-9]{1,4}\.[0-9a-f]{8}$/;
  // The durable copy START makes of both marks (the mark document itself is replaced by the ledger), so later seasons replay the
  // saved shots: rivalries/{rid}/transferChallenges/season_N/roulette/spins, written once, never changed.
  const RECORD_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","seasonNumber","spins"]);
  const COMMAND_TYPES=Object.freeze(["start-window","request-end-window","advance-expired-window","lock-guesses","lock-signings"]);
  const CANONICAL_LEAGUE_IDS=Object.freeze((Array.isArray(root.FIFA17_TRANSFER_LEAGUES)?root.FIFA17_TRANSFER_LEAGUES:[]).map(item=>item&&item.id).filter(Boolean));
  const CANONICAL_NATIONALITY_IDS=Object.freeze((Array.isArray(root.FIFA17_TRANSFER_NATIONALITIES)?root.FIFA17_TRANSFER_NATIONALITIES:[]).map(item=>item&&item.id).filter(Boolean));

  function stspFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function stspResultError(error){return Object.freeze({ok:false,code:error&&typeof error.code==="string"?error.code:"TRANSFER_PROVIDER_FAILED"});}
  function stspSnapshot(value){return value&&typeof value.exists==="function"&&value.exists()?value.data():null;}
  function stspPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value);}
  function stspExact(value,keys,code="TRANSFER_PROVIDER_STATE_INVALID"){if(!stspPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))stspFail(code);return value;}
  function stspClone(value){return JSON.parse(JSON.stringify(value));}
  function stspFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(stspFreeze);Object.freeze(value);}return value;}
  function stspCanonical(value){if(Array.isArray(value))return `[${value.map(stspCanonical).join(",")}]`;if(value&&typeof value==="object"&&Object.getPrototypeOf(value)===Object.prototype)return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stspCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
  async function stspHash(value,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")stspFail("TRANSFER_CRYPTO_UNAVAILABLE");const bytes=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(stspCanonical(value)));return `sha256:${Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
  // JOB-1051: 32 random bytes, hex. Stored only in the actor's own private role document (unreadable by the rival until COMPLETED).
  function stspNewSalt(cryptoImpl){if(!cryptoImpl||typeof cryptoImpl.getRandomValues!=="function")stspFail("TRANSFER_CRYPTO_UNAVAILABLE");return Array.from(cryptoImpl.getRandomValues(new Uint8Array(32)),byte=>byte.toString(16).padStart(2,"0")).join("");}
  function stspNormalizeRivalryId(value){const id=String(value||"").trim().toLowerCase();if(!/^pair_[0-9a-f]{64}$/.test(id))stspFail("TRANSFER_RIVALRY_INVALID");return id;}
  function stspNormalizeSessionId(value){const id=String(value||"").trim().toLowerCase();if(!/^session_[0-9a-f]{64}$/.test(id))stspFail("TRANSFER_SESSION_INVALID");return id;}
  function stspNormalizeDeviceId(value){const id=String(value||"").trim().toLowerCase();if(!/^device_[0-9a-f]{32}$/.test(id))stspFail("TRANSFER_DEVICE_INACTIVE");return id;}
  function stspNormalizeOperationId(value){const id=String(value||"").trim().toLowerCase();if(!OPERATION.test(id))stspFail("TRANSFER_COMMAND_INVALID");return id;}
  function stspAccountId(user){const id=user&&typeof user.uid==="string"?user.uid.trim():"";if(!id)stspFail("TRANSFER_AUTH_REQUIRED");return id;}
  function stspSeason(value,totalSeasons){const season=Number(value);if(!Number.isInteger(season)||season<1||season>totalSeasons)stspFail("TRANSFER_SEASON_INVALID");return season;}
  function stspEpoch(value){const n=Number(value===undefined?Date.now():value);if(!Number.isSafeInteger(n)||n<0)stspFail("TRANSFER_CLOCK_INVALID");return n;}
  // RT5-FLOW-02 eligibility, shared by this provider, the Transfer Challenge UI and (by its fromMs) js/rosterRouletteStep.js:
  // the roulette runs for a Showdown whose Setup was confirmed at or after RRR_FROM_MS, unless CMS_ROSTER_ROULETTE is "off".
  const ROULETTE_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
  function stspRouletteEligible(confirmedAtMs){return Number.isFinite(confirmedAtMs)&&confirmedAtMs>=ROULETTE_FROM_MS&&root.CMS_ROSTER_ROULETTE!=="off";}
  function stspTimestampMillis(value){if(value&&typeof value.toMillis==="function")return value.toMillis();if(value instanceof Date)return value.getTime();return Number.NaN;}
  function stspTimestamp(sdk,epoch){if(!sdk.Timestamp||typeof sdk.Timestamp.fromMillis!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");return sdk.Timestamp.fromMillis(epoch);}
  function stspServerTimestamp(sdk){if(typeof sdk.serverTimestamp!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");return sdk.serverTimestamp();}
  function stspValidateSdk(options){if(!options.firestore)stspFail("TRANSFER_PROVIDER_UNAVAILABLE");for(const name of ["doc","runTransaction","serverTimestamp"]){if(!options.firebaseSdk||typeof options.firebaseSdk[name]!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");}if(!options.firebaseSdk.Timestamp||typeof options.firebaseSdk.Timestamp.fromMillis!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");}
  function stspRoleList(value,code="TRANSFER_PROVIDER_STATE_INVALID"){if(!Array.isArray(value)||value.length>2||new Set(value).size!==value.length||value.some(role=>!ROLES.includes(role)))stspFail(code);return value;}
  function stspCatalog(){
    if(CANONICAL_LEAGUE_IDS.length!==36||CANONICAL_NATIONALITY_IDS.length!==164)stspFail("TRANSFER_CATALOG_UNAVAILABLE");
    return Object.freeze({leagueIds:new Set(CANONICAL_LEAGUE_IDS),nationalityIds:new Set(CANONICAL_NATIONALITY_IDS)});
  }
  function stspNormalizeGuesses(value,catalog){
    if(!Array.isArray(value)||value.length>3)stspFail("TRANSFER_GUESSES_INVALID");const slots=new Set();
    return value.map(item=>{stspExact(item,["slot","type","valueId"],"TRANSFER_GUESSES_INVALID");if(!Number.isInteger(item.slot)||item.slot<1||item.slot>3||slots.has(item.slot))stspFail("TRANSFER_GUESSES_INVALID");slots.add(item.slot);if(item.type!=="league"&&item.type!=="nationality")stspFail("TRANSFER_GUESSES_INVALID");const allowed=item.type==="league"?catalog.leagueIds:catalog.nationalityIds;if(!allowed.has(item.valueId))stspFail("TRANSFER_GUESSES_INVALID");return {slot:item.slot,type:item.type,valueId:item.valueId};}).sort((a,b)=>a.slot-b.slot);
  }
  function stspNormalizeSignings(value,catalog){
    if(!Array.isArray(value)||value.length>3)stspFail("TRANSFER_SIGNINGS_INVALID");const slots=new Set();
    return value.map(item=>{const hasOverall=Boolean(item&&typeof item==="object"&&Object.hasOwn(item,"overall")),hasPosition=Boolean(item&&typeof item==="object"&&Object.hasOwn(item,"position"));/* r87: optional FIFA 17 overall (30-99) and position */stspExact(item,["slot","name","leagueId","nationalityId",...(hasOverall?["overall"]:[]),...(hasPosition?["position"]:[])],"TRANSFER_SIGNINGS_INVALID");if(hasPosition&&!["GK","RB","RWB","CB","LB","LWB","CDM","CM","CAM","RM","LM","RW","LW","CF","ST"].includes(item.position))stspFail("TRANSFER_SIGNINGS_INVALID");if(hasOverall&&!(Number.isInteger(item.overall)&&item.overall>=30&&item.overall<=99))stspFail("TRANSFER_SIGNINGS_INVALID");if(!Number.isInteger(item.slot)||item.slot<1||item.slot>3||slots.has(item.slot))stspFail("TRANSFER_SIGNINGS_INVALID");slots.add(item.slot);if(typeof item.name!=="string"||!item.name||item.name!==item.name.trim()||item.name.length>80||!catalog.leagueIds.has(item.leagueId)||!catalog.nationalityIds.has(item.nationalityId))stspFail("TRANSFER_SIGNINGS_INVALID");const row={slot:item.slot,name:item.name,leagueId:item.leagueId,nationalityId:item.nationalityId};if(hasOverall)row.overall=item.overall;if(hasPosition)row.position=item.position;return row;}).sort((a,b)=>a.slot-b.slot);
  }
  function stspAssertAccount(value,uid){if(!value||value.objectType!=="account"||value.objectId!==uid||value.lifecycleState!=="live"||!value.data||value.data.status!=="active")stspFail("TRANSFER_MANAGER_INACTIVE");}
  function stspAssertDevice(value,deviceId){if(!value||value.objectType!=="device"||value.objectId!==deviceId||value.lifecycleState!=="live"||!value.data||value.data.deviceId!==deviceId||value.data.state!=="active")stspFail("TRANSFER_DEVICE_INACTIVE");}
  function stspAssertRivalry(value,rivalryId,uid){
    if(!value||value.objectType!=="rivalry"||value.objectId!==rivalryId||value.lifecycleState!=="live"||!value.data||value.data.connectionState!=="active")stspFail("TRANSFER_RIVALRY_INACTIVE");
    const slots=Array.isArray(value.data.managerSlots)?value.data.managerSlots:[],authorized=Array.isArray(value.data.authorizedAccountIds)?value.data.authorizedAccountIds:[];
    if(slots.length!==2||authorized.length!==2||new Set(authorized).size!==2)stspFail("TRANSFER_TWO_MANAGERS_REQUIRED");
    const ordered=ROLES.map(role=>slots.find(item=>item&&item.slotId===role));
    if(ordered.some(item=>!item||item.entitlementState!=="active"||typeof item.accountId!=="string")||ordered[0].accountId===ordered[1].accountId||!ordered.every(item=>authorized.includes(item.accountId)))stspFail("TRANSFER_BINDING_INVALID");
    const actor=ordered.find(item=>item.accountId===uid);if(!actor)stspFail("TRANSFER_ACTOR_NOT_ENTITLED");return Object.freeze({slots:ordered,authorized,actor});
  }
  function stspAssertSession(value,rivalryId,sessionId,authorized,now){
    if(!value||value.objectType!=="session"||value.objectId!==sessionId||value.lifecycleState!=="live"||!value.data)stspFail("TRANSFER_SESSION_INVALID");
    const members=Array.isArray(value.data.memberAccountIds)?value.data.memberAccountIds:[],expires=stspTimestampMillis(value.data.expiresAt);
    if(value.data.rivalryId!==rivalryId||value.data.state!=="active"||members.length!==2||new Set(members).size!==2||!authorized.every(id=>members.includes(id))||!members.every(id=>authorized.includes(id))||!Number.isFinite(expires))stspFail("TRANSFER_ACTIVE_SESSION_REQUIRED");
  }
  function stspAssertSetup(value,rivalryId){
    if(!value||value.schemaVersion!==1||value.objectType!=="sharedSetupLedger"||value.rivalryId!==rivalryId||value.revision!==6||value.phase!=="SHOWDOWN_CONFIRMED"||!ROLES.includes(value.coordinatorRole)||![1,3,5,10].includes(value.totalSeasons))stspFail("TRANSFER_SETUP_NOT_CONFIRMED");
    if(!Array.isArray(value.confirmedRoles)||value.confirmedRoles.length!==2||!ROLES.every(role=>value.confirmedRoles.includes(role)))stspFail("TRANSFER_SETUP_NOT_CONFIRMED");return value;
  }
  function stspAssertCareer(value,rivalryId,setup){
    if(!value||value.schemaVersion!==1||value.objectType!=="sharedCareerStart"||value.rivalryId!==rivalryId||value.setupRevision!==6||value.totalSeasons!==setup.totalSeasons||value.revision!==2||value.phase!=="CAREER_START_READY")stspFail("TRANSFER_CAREER_START_NOT_READY");
    if(!Array.isArray(value.acknowledgedRoles)||value.acknowledgedRoles.length!==2||!ROLES.every(role=>value.acknowledgedRoles.includes(role)))stspFail("TRANSFER_CAREER_START_NOT_READY");return value;
  }
  // The pre-window mark document: null when it is absent or the ledger has started, else the roles that have spun (in role order).
  function stspIsPreWindow(value){return stspPlain(value)&&value.phase==="NOT_STARTED";}
  // A valid outcome (frozen copy), or null.
  function stspOutcome(value){
    if(!stspPlain(value)||Object.keys(value).length!==OUTCOME_KEYS.length||OUTCOME_KEYS.some(key=>!Object.hasOwn(value,key)))return null;
    if(typeof value.fired!=="boolean"||typeof value.version!=="string"||!OUTCOME_VERSION.test(value.version))return null;
    if(value.fired){
      if(typeof value.hitName!=="string"||!value.hitName||value.hitName!==value.hitName.trim()||value.hitName.length>80||!Number.isInteger(value.hitSlot)||value.hitSlot<0||value.hitSlot>14||!(value.hitNumber===null||(Number.isInteger(value.hitNumber)&&value.hitNumber>=0&&value.hitNumber<=99))||!(value.hitSignedSeason===null||(Number.isInteger(value.hitSignedSeason)&&value.hitSignedSeason>=1&&value.hitSignedSeason<=10)))return null;
    }else if(value.hitName!==null||value.hitNumber!==null||value.hitSlot!==null||value.hitSignedSeason!==null)return null;
    return Object.freeze({fired:value.fired,hitName:value.hitName,hitNumber:value.hitNumber,hitSlot:value.hitSlot,hitSignedSeason:value.hitSignedSeason,version:value.version});
  }
  // {playerOne, playerTwo}: each manager's stored entry (true, or his outcome), or null when he has none.
  function stspSpinEntries(spins){
    if(!stspPlain(spins)||Object.keys(spins).some(role=>!ROLES.includes(role)))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    const entries={};
    for(const role of ROLES){
      if(!Object.hasOwn(spins,role)){entries[role]=null;continue;}
      const entry=spins[role]===true?true:stspOutcome(spins[role]);
      if(!entry)stspFail("TRANSFER_PROVIDER_STATE_INVALID");entries[role]=entry;
    }
    return Object.freeze(entries);
  }
  function stspSpinMarks(value,rivalryId,seasonNumber){
    if(!stspIsPreWindow(value))return null;stspExact(value,SPIN_KEYS);
    if(value.schemaVersion!==1||value.objectType!=="sharedTransferChallenge"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber)stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    return stspSpinEntries(value.spins);
  }
  function stspSpins(value,rivalryId,seasonNumber){const marks=stspSpinMarks(value,rivalryId,seasonNumber);return marks?ROLES.filter(role=>marks[role]!==null):null;}
  function stspPublicState(value,rivalryId,seasonNumber,setup){
    if(!value||stspIsPreWindow(value))return null;stspExact(value,PUBLIC_KEYS);
    if(value.schemaVersion!==1||value.objectType!=="sharedTransferChallenge"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.runtimeRevision!==protocol.runtimeRevision||value.coordinatorRole!==setup.coordinatorRole||!protocol.phases.includes(value.phase)||!Number.isInteger(value.revision)||value.revision<1||value.revision>7)stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    const startedAtEpochMs=stspTimestampMillis(value.startedAt),endedAtEpochMs=value.endedAt===null?null:stspTimestampMillis(value.endedAt);if(!Number.isFinite(startedAtEpochMs)||(value.endedAt!==null&&!Number.isFinite(endedAtEpochMs)))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    stspRoleList(value.endRequestedRoles);stspRoleList(value.guessLockedRoles);stspRoleList(value.signingLockedRoles);
    for(const key of ["operationIds","operationTypes","operationHashes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==value.revision)stspFail("TRANSFER_PROVIDER_STATE_INVALID");}
    if(new Set(value.operationIds).size!==value.operationIds.length||value.operationIds.some(id=>!OPERATION.test(id))||value.operationTypes.some(type=>!COMMAND_TYPES.includes(type))||value.operationHashes.some(hash=>!HASH.test(hash))||value.baseRevisions.some((base,index)=>base!==index)||value.actorRoles.some(role=>!ROLES.includes(role)))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    if(value.phase==="WINDOW_OPEN"&&(value.endedAt!==null||value.guessLockedRoles.length||value.signingLockedRoles.length))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    if(value.phase==="GUESS_ENTRY"&&(value.endedAt===null||value.signingLockedRoles.length))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    if(value.phase==="SIGNING_ENTRY"&&(value.endedAt===null||value.guessLockedRoles.length!==2||value.signingLockedRoles.length>1))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    if(value.phase==="COMPLETED"&&(value.endedAt===null||value.guessLockedRoles.length!==2||value.signingLockedRoles.length!==2))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    if(!/^session_[0-9a-f]{64}$/.test(value.activeSessionId||"")||!/^device_[0-9a-f]{32}$/.test(value.updatedByDeviceId||""))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    return stspFreeze({seasonNumber,coordinatorRole:value.coordinatorRole,phase:value.phase,revision:value.revision,startedAtEpochMs,endedAtEpochMs,endRequestedRoles:[...value.endRequestedRoles],guessLockedRoles:[...value.guessLockedRoles],signingLockedRoles:[...value.signingLockedRoles],operationIds:[...value.operationIds],operationTypes:[...value.operationTypes],operationHashes:[...value.operationHashes],baseRevisions:[...value.baseRevisions],actorRoles:[...value.actorRoles]});
  }
  function stspPrivateState(value,rivalryId,seasonNumber,role,catalog){
    if(!value)return null;
    const salted=stspPlain(value)&&Object.hasOwn(value,SALT_KEYS[0]);stspExact(value,salted?[...PRIVATE_KEYS,...SALT_KEYS]:PRIVATE_KEYS);
    if(value.schemaVersion!==1||value.objectType!=="sharedTransferChallengeRole"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.managerRole!==role)stspFail("TRANSFER_PRIVATE_STATE_INVALID");
    const guesses=value.guesses===null?null:stspNormalizeGuesses(value.guesses,catalog),signings=value.signings===null?null:stspNormalizeSignings(value.signings,catalog),guessLockedAtEpochMs=value.guessLockedAt===null?null:stspTimestampMillis(value.guessLockedAt),signingLockedAtEpochMs=value.signingLockedAt===null?null:stspTimestampMillis(value.signingLockedAt);
    if((guesses===null)!==(guessLockedAtEpochMs===null)||(signings===null)!==(signingLockedAtEpochMs===null)||(guessLockedAtEpochMs!==null&&!Number.isFinite(guessLockedAtEpochMs))||(signingLockedAtEpochMs!==null&&!Number.isFinite(signingLockedAtEpochMs))||!/^session_[0-9a-f]{64}$/.test(value.activeSessionId||"")||!/^device_[0-9a-f]{32}$/.test(value.updatedByDeviceId||""))stspFail("TRANSFER_PRIVATE_STATE_INVALID");
    const guessSalt=salted?value.guessSalt:null,signingSalt=salted?value.signingSalt:null;
    // A salt exists only together with the lock it belongs to, and is exactly 64 lowercase hex characters.
    for(const [salt,locked] of [[guessSalt,guesses],[signingSalt,signings]])if(salt!==null&&(typeof salt!=="string"||!SALT.test(salt)||locked===null))stspFail("TRANSFER_PRIVATE_STATE_INVALID");
    return stspFreeze({guesses,signings,guessLockedAtEpochMs,signingLockedAtEpochMs,guessSalt,signingSalt});
  }
  function stspPublicLedger(state,ctx,serverNow,type){
    const prior=ctx.publicValue||null,startedAt=type==="start-window"?serverNow:(prior?.startedAt||stspTimestamp(ctx.sdk,state.startedAtEpochMs));let endedAt=null;
    if(state.endedAtEpochMs!==null){
      const earlyEnd=type==="request-end-window"&&state.phase==="GUESS_ENTRY"&&state.endRequestedRoles.length===2;
      if(earlyEnd||type==="advance-expired-window")endedAt=serverNow;
      else endedAt=prior?.endedAt||stspTimestamp(ctx.sdk,state.endedAtEpochMs);
    }
    return {schemaVersion:1,objectType:"sharedTransferChallenge",rivalryId:ctx.rivalryId,seasonNumber:ctx.seasonNumber,runtimeRevision:protocol.runtimeRevision,coordinatorRole:state.coordinatorRole,phase:state.phase,revision:state.revision,startedAt,endedAt,endRequestedRoles:[...state.endRequestedRoles],guessLockedRoles:[...state.guessLockedRoles],signingLockedRoles:[...state.signingLockedRoles],operationIds:[...state.operationIds],operationTypes:[...state.operationTypes],operationHashes:[...state.operationHashes],baseRevisions:[...state.baseRevisions],actorRoles:[...state.actorRoles],activeSessionId:ctx.sessionId,updatedAt:serverNow,updatedByDeviceId:ctx.deviceId};
  }
  function stspPrivateLedger(privateState,ctx,role,serverNow,type){
    const prior=ctx.ownValue||null;
    const guessLockedAt=type==="lock-guesses"?serverNow:(prior?.guessLockedAt||(privateState.guessLockedAtEpochMs===null||privateState.guessLockedAtEpochMs===undefined?null:stspTimestamp(ctx.sdk,privateState.guessLockedAtEpochMs)));
    const signingLockedAt=type==="lock-signings"?serverNow:(prior?.signingLockedAt||(privateState.signingLockedAtEpochMs===null||privateState.signingLockedAtEpochMs===undefined?null:stspTimestamp(ctx.sdk,privateState.signingLockedAtEpochMs)));
    return {schemaVersion:1,objectType:"sharedTransferChallengeRole",rivalryId:ctx.rivalryId,seasonNumber:ctx.seasonNumber,managerRole:role,guesses:privateState.guesses?stspClone(privateState.guesses):null,signings:privateState.signings?stspClone(privateState.signings):null,guessLockedAt,signingLockedAt,activeSessionId:ctx.sessionId,updatedAt:serverNow,updatedByDeviceId:ctx.deviceId,guessSalt:privateState.guessSalt||null,signingSalt:privateState.signingSalt||null};
  }
  async function stspContext(options,transaction,{readOpponent=false}={}){
    stspValidateSdk(options);const catalog=stspCatalog(),uid=stspAccountId(options.user),rivalryId=stspNormalizeRivalryId(options.rivalryId),sessionId=stspNormalizeSessionId(options.sessionId),deviceId=stspNormalizeDeviceId(options.deviceId),now=stspEpoch(options.nowEpochMs),sdk=options.firebaseSdk,db=options.firestore;
    const baseRefs={account:sdk.doc(db,"accounts",uid),device:sdk.doc(db,"accounts",uid,"devices",deviceId),rivalry:sdk.doc(db,"rivalries",rivalryId),session:sdk.doc(db,"rivalries",rivalryId,"sessions",sessionId),setup:sdk.doc(db,"rivalries",rivalryId,"sharedSetup","authoritative"),career:sdk.doc(db,"rivalries",rivalryId,"careerStart","authoritative")};
    stspAssertAccount(stspSnapshot(await transaction.get(baseRefs.account)),uid);stspAssertDevice(stspSnapshot(await transaction.get(baseRefs.device)),deviceId);const rivalry=stspAssertRivalry(stspSnapshot(await transaction.get(baseRefs.rivalry)),rivalryId,uid);stspAssertSession(stspSnapshot(await transaction.get(baseRefs.session)),rivalryId,sessionId,rivalry.authorized,now);const setup=stspAssertSetup(stspSnapshot(await transaction.get(baseRefs.setup)),rivalryId);stspAssertCareer(stspSnapshot(await transaction.get(baseRefs.career)),rivalryId,setup);const seasonNumber=stspSeason(options.seasonNumber,setup.totalSeasons),role=rivalry.actor.slotId,opponentRole=role==="playerOne"?"playerTwo":"playerOne",transferId=`season_${seasonNumber}`;
    const refs={...baseRefs,public:sdk.doc(db,"rivalries",rivalryId,"transferChallenges",transferId),own:sdk.doc(db,"rivalries",rivalryId,"transferChallenges",transferId,"roles",role),opponent:sdk.doc(db,"rivalries",rivalryId,"transferChallenges",transferId,"roles",opponentRole)};
    const publicValue=stspSnapshot(await transaction.get(refs.public)),state=stspPublicState(publicValue,rivalryId,seasonNumber,setup),spinMarks=state?null:(stspSpinMarks(publicValue,rivalryId,seasonNumber)||Object.freeze({playerOne:null,playerTwo:null})),spunRoles=spinMarks?ROLES.filter(item=>spinMarks[item]!==null):null,ownValue=stspSnapshot(await transaction.get(refs.own)),own=stspPrivateState(ownValue,rivalryId,seasonNumber,role,catalog);let opponent=null;
    if(readOpponent==="ifCompleted"&&!(state&&state.phase==="COMPLETED"))readOpponent=false;if(readOpponent){if(!state||state.phase!=="COMPLETED")stspFail("TRANSFER_PRIVATE_READ_BLOCKED");opponent=stspPrivateState(stspSnapshot(await transaction.get(refs.opponent)),rivalryId,seasonNumber,opponentRole,catalog);if(!opponent)stspFail("TRANSFER_PRIVATE_STATE_INVALID");}
    refs.roulette=sdk.doc(db,"rivalries",rivalryId,"transferChallenges",transferId,"roulette","spins");
    return Object.freeze({catalog,uid,rivalryId,sessionId,deviceId,now,sdk,db,rivalry,setup,seasonNumber,role,opponentRole,state,spunRoles,spinMarks,own,publicValue,ownValue,opponent,refs});
  }
  function stspProjection(ctx){
    const state=ctx.state;if(!state)return Object.freeze({ok:true,revision:0,state:null,managerRole:ctx.role,seasonNumber:ctx.seasonNumber,spunRoles:Object.freeze([...(ctx.spunRoles||[])]),spinMarks:ctx.spinMarks||Object.freeze({playerOne:null,playerTwo:null}),ownInputs:null,opponentInputs:null,verdicts:null});
    const ownInputs=ctx.own?{guesses:stspClone(ctx.own.guesses),signings:stspClone(ctx.own.signings)}:{guesses:null,signings:null};
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
    try{
      stspValidateSdk(options);const operationId=stspNormalizeOperationId(options.operationId),baseRevision=Number(options.baseRevision);if(!Number.isInteger(baseRevision)||baseRevision<0||baseRevision>7)stspFail("TRANSFER_COMMAND_INVALID");const cryptoImpl=options.cryptoImpl||root.crypto;
      return await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{
        const ctx=await stspContext(options,transaction),current=ctx.state,revision=current?current.revision:0;let normalizedPayload={};
        if(type==="lock-guesses")normalizedPayload={guesses:stspNormalizeGuesses(payload.guesses,ctx.catalog)};else if(type==="lock-signings")normalizedPayload={signings:stspNormalizeSignings(payload.signings,ctx.catalog)};
        // JOB-1051: a lock's hash commits to the private payload AND a fresh random salt that only the actor's own private role document holds.
        // The rival can read the public ledger but not the role document before COMPLETED, so it cannot brute-force the small guess space.
        const privateType=type==="lock-guesses"||type==="lock-signings",saltKey=type==="lock-guesses"?"guessSalt":"signingSalt";
        const commit=salt=>stspHash({actorRole:ctx.role,type,operationId,baseRevision,...normalizedPayload,...(salt?{salt}:{})},cryptoImpl);
        if(current){const index=current.operationIds.indexOf(operationId);if(index>=0){
          // Replays recompute with the salt already stored in the actor's own document; a role document without a salt (written by r66) uses the old unsalted payload hash.
          const storedSalt=privateType&&ctx.own?ctx.own[saltKey]:null;
          if(current.operationTypes[index]!==type||current.operationHashes[index]!==await commit(storedSalt)||current.baseRevisions[index]!==baseRevision||current.actorRoles[index]!==ctx.role)stspFail("TRANSFER_IDEMPOTENCY_CONFLICT");return stspFreeze({ok:true,status:"accepted",replayed:true,revision:current.revision,state:stspClone(current),managerRole:ctx.role,seasonNumber:ctx.seasonNumber,needsRefresh:current.phase==="COMPLETED"});}}
        const salt=privateType?stspNewSalt(cryptoImpl):null,operationHash=await commit(salt);
        if(baseRevision!==revision)stspFail("TRANSFER_STALE_BASE_REVISION");if(!current&&type!=="start-window")stspFail("TRANSFER_NOT_STARTED");if(current&&type==="start-window")stspFail("TRANSFER_ALREADY_STARTED");if(current&&current.phase==="COMPLETED")stspFail("TRANSFER_ALREADY_COMPLETED");
        let next=current?stspClone(current):{seasonNumber:ctx.seasonNumber,coordinatorRole:ctx.setup.coordinatorRole,phase:"WINDOW_OPEN",revision:0,startedAtEpochMs:ctx.now,endedAtEpochMs:null,endRequestedRoles:[],guessLockedRoles:[],signingLockedRoles:[],operationIds:[],operationTypes:[],operationHashes:[],baseRevisions:[],actorRoles:[]};
        let own=ctx.own?stspClone(ctx.own):{guesses:null,signings:null,guessLockedAtEpochMs:null,signingLockedAtEpochMs:null,guessSalt:null,signingSalt:null};let writePrivate=false;
        if(type==="start-window"){if(ctx.role!==ctx.setup.coordinatorRole)stspFail("TRANSFER_COORDINATOR_REQUIRED");
          // RT5-FLOW-02: START needs both marks whenever this Showdown is roulette-eligible (decided here from the Setup ledger
          // this transaction already read, the same rule as the UI and the roulette step: no caller opt-in), and whenever any
          // mark exists. A Showdown confirmed before RRR_FROM_MS, or with the roulette switched off, has no marks and passes.
          const spun=ctx.spunRoles||[];if((spun.length||stspRouletteEligible(stspTimestampMillis(ctx.setup.updatedAt)))&&!ROLES.every(role=>spun.includes(role)))stspFail("TRANSFER_ROULETTE_PENDING");
          next.startedAtEpochMs=ctx.now;}
        else if(type==="request-end-window"){if(next.phase!=="WINDOW_OPEN")stspFail("TRANSFER_PHASE_INVALID");if(next.endRequestedRoles.includes(ctx.role))stspFail("TRANSFER_END_ALREADY_REQUESTED");next.endRequestedRoles.push(ctx.role);if(next.endRequestedRoles.length===2){next.phase="GUESS_ENTRY";next.endedAtEpochMs=ctx.now;}}
        else if(type==="advance-expired-window"){if(next.phase!=="WINDOW_OPEN")stspFail("TRANSFER_PHASE_INVALID");if(ctx.now<next.startedAtEpochMs+protocol.windowMs)stspFail("TRANSFER_WINDOW_STILL_OPEN");next.phase="GUESS_ENTRY";next.endedAtEpochMs=ctx.now;}
        else if(type==="lock-guesses"){if(next.phase!=="GUESS_ENTRY")stspFail("TRANSFER_PHASE_INVALID");if(next.guessLockedRoles.includes(ctx.role)||own.guesses!==null)stspFail("TRANSFER_GUESSES_ALREADY_LOCKED");own.guesses=normalizedPayload.guesses;own.guessSalt=salt;next.guessLockedRoles.push(ctx.role);if(next.guessLockedRoles.length===2)next.phase="SIGNING_ENTRY";writePrivate=true;}
        else if(type==="lock-signings"){if(next.phase!=="SIGNING_ENTRY")stspFail("TRANSFER_PHASE_INVALID");if(!next.guessLockedRoles.includes(ctx.role)||!own.guesses)stspFail("TRANSFER_GUESSES_REQUIRED");if(next.signingLockedRoles.includes(ctx.role)||own.signings!==null)stspFail("TRANSFER_SIGNINGS_ALREADY_LOCKED");own.signings=normalizedPayload.signings;own.signingSalt=salt;next.signingLockedRoles.push(ctx.role);if(next.signingLockedRoles.length===2)next.phase="COMPLETED";writePrivate=true;}
        else stspFail("TRANSFER_COMMAND_INVALID");
        next.operationIds.push(operationId);next.operationTypes.push(type);next.operationHashes.push(operationHash);next.baseRevisions.push(revision);next.actorRoles.push(ctx.role);next.revision=revision+1;
        const serverNow=stspServerTimestamp(ctx.sdk);transaction.set(ctx.refs.public,stspPublicLedger(next,ctx,serverNow,type));if(writePrivate)transaction.set(ctx.refs.own,stspPrivateLedger(own,ctx,ctx.role,serverNow,type));
        // F2-02: START from a document holding both marks keeps them: one durable record, an exact copy (the Rules compare it with
        // the marks being replaced), so later seasons replay each saved shot instead of recomputing it.
        if(type==="start-window"&&ctx.spinMarks&&ROLES.every(role=>ctx.spinMarks[role]!==null))transaction.set(ctx.refs.roulette,{schemaVersion:1,objectType:"sharedTransferRouletteSpins",rivalryId:ctx.rivalryId,seasonNumber:ctx.seasonNumber,spins:stspClone(ctx.publicValue.spins)});
        return stspFreeze({ok:true,status:"accepted",replayed:false,revision:next.revision,state:stspClone(next),managerRole:ctx.role,seasonNumber:ctx.seasonNumber,needsRefresh:type==="start-window"||next.phase==="COMPLETED"});
      });
    }catch(error){return stspResultError(error);}
  }
  // RT5-FLOW-02: this manager's own "spun" mark for this season, one merge write and no read (the Rules check that the signed-in
  // member writes only his own role, never removes a mark, and only before the window opens). Writing it again changes nothing
  // but updatedAt, so a retry after a lost answer or a reload is safe. A window that already opened refuses it
  // (permission-denied): the mark is not needed any more, so the caller treats that as done.
  async function stspMarkSpun(options={}){
    try{
      if(!options.firestore||!options.firebaseSdk||typeof options.firebaseSdk.doc!=="function"||typeof options.firebaseSdk.runTransaction!=="function"||typeof options.firebaseSdk.serverTimestamp!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");
      stspAccountId(options.user);const rivalryId=stspNormalizeRivalryId(options.rivalryId),season=stspSeason(options.seasonNumber,10),role=options.managerRole;if(!ROLES.includes(role))stspFail("TRANSFER_ROLE_INVALID");
      // F2-02: with options.outcome (this manager's own turn, js/rosterRoulette.js outcome) the entry records it; without one
      // (no roulette ran on this phone) it is true. A malformed outcome is refused here, before any write.
      let entry=true;if(options.outcome!==undefined&&options.outcome!==null){entry=stspOutcome(options.outcome);if(!entry)stspFail("TRANSFER_SPIN_OUTCOME_INVALID");entry={...entry};}
      const sdk=options.firebaseSdk,ref=sdk.doc(options.firestore,"rivalries",rivalryId,"transferChallenges",`season_${season}`);
      try{
        await sdk.runTransaction(options.firestore,async transaction=>{transaction.set(ref,{schemaVersion:1,objectType:"sharedTransferChallenge",rivalryId,seasonNumber:season,phase:"NOT_STARTED",spins:{[role]:entry},updatedAt:stspServerTimestamp(sdk)},{merge:true});});
      }catch(error){
        // The Rules accept one mark per manager and season (F2-02), so marking again (a retry after a lost ack, a reload, a
        // second tab, or a caller that marked before an earlier START was refused) is denied. Only then, one read: if this
        // manager's mark is already on the document, or the window already opened from both marks, he has spun. The stored
        // mark stands (the first outcome is the season's outcome); nothing is written.
        if(String(error&&error.code||"").replace(/^firestore\//,"")!=="permission-denied")throw error;
        const stored=await sdk.runTransaction(options.firestore,async transaction=>stspSnapshot(await transaction.get(ref)));
        const marked=stored&&(stored.phase!=="NOT_STARTED"||(stspPlain(stored.spins)&&Object.hasOwn(stored.spins,role)&&stored.spins[role]!==false));
        if(!marked)throw error;
        return Object.freeze({ok:true,managerRole:role,seasonNumber:season,alreadyMarked:true});
      }
      return Object.freeze({ok:true,managerRole:role,seasonNumber:season});
    }catch(error){return stspResultError(error);}
  }
  // F2-12 (Fable job 2): an earlier season for the roulette boards, with plain document gets and no prerequisite transaction:
  // this manager's own role document, the partner's (the Rules allow it only once the season's window is COMPLETED) and the
  // durable spin record. Verdicts are computed as stspProtocolVerdict does. options.verdicts false reads the record only (the
  // verdicts are already kept on this phone). hits is {playerOne, playerTwo} (an outcome or null), or null without a record.
  async function stspReadRouletteSeason(options={}){
    try{
      const sdk=options.firebaseSdk,db=options.firestore;
      if(!db||!sdk||typeof sdk.doc!=="function"||typeof sdk.getDoc!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");
      stspAccountId(options.user);const rivalryId=stspNormalizeRivalryId(options.rivalryId),season=stspSeason(options.seasonNumber,10),role=options.managerRole;if(!ROLES.includes(role))stspFail("TRANSFER_ROLE_INVALID");
      const opponentRole=role==="playerOne"?"playerTwo":"playerOne",transferId=`season_${season}`,wantVerdicts=options.verdicts!==false;
      const get=parts=>sdk.getDoc(sdk.doc(db,"rivalries",rivalryId,"transferChallenges",transferId,...parts)).then(stspSnapshot);
      const settled=await Promise.allSettled([get(["roulette","spins"]),...(wantVerdicts?[get(["roles",role]),get(["roles",opponentRole])]:[])]);
      if(settled[0].status==="rejected")throw settled[0].reason;
      let hits=null;const record=settled[0].value;
      if(record){
        stspExact(record,RECORD_KEYS);
        if(record.schemaVersion!==1||record.objectType!=="sharedTransferRouletteSpins"||record.rivalryId!==rivalryId||record.seasonNumber!==season)stspFail("TRANSFER_PROVIDER_STATE_INVALID");
        const entries=stspSpinEntries(record.spins);hits=Object.freeze(Object.fromEntries(ROLES.map(item=>[item,entries[item]&&entries[item]!==true?entries[item]:null])));
      }
      if(!wantVerdicts)return Object.freeze({ok:true,seasonNumber:season,verdicts:null,hits});
      const catalog=stspCatalog();
      if(settled[1].status==="rejected")throw settled[1].reason;
      const own=stspPrivateState(settled[1].value,rivalryId,season,role,catalog);
      if(!own||!own.guesses||!own.signings)stspFail("TRANSFER_NOT_COMPLETED");
      if(settled[2].status==="rejected")throw settled[2].reason;
      const opponent=stspPrivateState(settled[2].value,rivalryId,season,opponentRole,catalog);
      if(!opponent||!opponent.guesses||!opponent.signings)stspFail("TRANSFER_NOT_COMPLETED");
      const inputs={[role]:own,[opponentRole]:opponent},evalState={phase:"COMPLETED",inputs};
      return stspFreeze({ok:true,seasonNumber:season,verdicts:{playerOne:stspProtocolVerdict("playerOne",evalState),playerTwo:stspProtocolVerdict("playerTwo",evalState)},hits});
    }catch(error){return stspResultError(error);}
  }
  const stspStartWindow=options=>stspMutate(options,"start-window",{});
  const stspRequestEndWindow=options=>stspMutate(options,"request-end-window",{});
  const stspAdvanceExpiredWindow=options=>stspMutate(options,"advance-expired-window",{});
  const stspLockGuesses=options=>stspMutate(options,"lock-guesses",{guesses:options.guesses});
  const stspLockSignings=options=>stspMutate(options,"lock-signings",{signings:options.signings});

  return Object.freeze({contractVersion:1,feature:"ssjr-spark-shared-transfer-challenge",runtimeRevision:protocol.runtimeRevision,read:stspRead,markSpun:stspMarkSpun,readRouletteSeason:stspReadRouletteSeason,outcomeValid:value=>Boolean(stspOutcome(value)),rouletteFromMs:ROULETTE_FROM_MS,rouletteEligible:stspRouletteEligible,startWindow:stspStartWindow,requestEndWindow:stspRequestEndWindow,advanceExpiredWindow:stspAdvanceExpiredWindow,lockGuesses:stspLockGuesses,lockSignings:stspLockSignings,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,canonicalStorageMutation:false,privateInputsSplit:true,serverClockAuthoritative:true,repositoryCatalogSnapshot:true,callerCatalogOverride:false});
});
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

## FILE: scripts/build-fifa17-rosters.py

````python
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

## FILE: service-worker.js (EXCERPT: lines 1-140)

````js
const RUNTIME_REVISION = "1.9.10-r86";
const PREVIOUS_RUNTIME_REVISION = "1.9.9-r85";
const CACHE_PREFIX = "career-mode-showdown-shell-";
const MODE_CACHE_PREFIX = "career-mode-showdown-runtime-mode-";
const CACHE_NAME = `${CACHE_PREFIX}${RUNTIME_REVISION}`;
const PREVIOUS_CACHE_NAME = PREVIOUS_RUNTIME_REVISION ? `${CACHE_PREFIX}${PREVIOUS_RUNTIME_REVISION}` : "";
const MODE_CACHE_NAME = `${MODE_CACHE_PREFIX}${RUNTIME_REVISION}`;
// JOB-24: Team V images are not precached on install (about 20 MB in all). They load on first view into
// this cache-first runtime cache, keyed by RUNTIME_REVISION. Activate keeps it and the retained recovery
// revision's image cache (for rollback) and clears the others.
const V10_IMAGE_CACHE_PREFIX = "career-mode-showdown-v10-images-";
const V10_IMAGE_CACHE_NAME = `${V10_IMAGE_CACHE_PREFIX}${RUNTIME_REVISION}`;
function v10ImageCacheName(revision){ return revision ? `${V10_IMAGE_CACHE_PREFIX}${revision}` : ""; }
// r87: the Russian Roster Roulette sounds (visual-assets/v10_1/roulette/assets/sfx/*.wav, 1.8 MB) follow the same cache-first
// runtime rule as Team V's images instead of the install precache.
const V10_IMAGE_PATH = /^visual-assets\/v10_1\/.+\.(?:webp|png|jpe?g|avif|gif|svg|wav)$/i;
const NETWORK_PROBE_TIMEOUT_MS = 1800;
const RUNTIME_CONFIG_PATH = "firebase.runtime-config.json";
const APP_CHECK_BOOTSTRAP_PATH = "js/productionAppCheckBootstrap.js";
const NETWORK_ONLY_NAVIGATION_PATHS = new Set([
    "production-authorization-acceptance.html"
]);
// r86: the Special Player page is its own document in a frame (js/specialPlayerReveal.js). A frame load is a navigation:
// it gets that page from the shell the app runs (then the network), never the shell's index.html. Its images follow the
// Team V cache-first image rule.
const SHELL_FRAME_NAVIGATION_PATHS = new Set([
    "visual-assets/v10_1/special-player/index.html",
    "visual-assets/v10_1/roulette/index.html"
]);
// Precached shell files that a stylesheet asks for by a relative url(), so the request has no ?v=: css/r78-marble-surfaces.css
// draws its panels with url("r78-marble-tile.webp"). They come from the shell the page runs (the precached copy), then the network.
// r87: the Roulette page in its frame asks for its 3D library and data the same way (no ?v=), so offline it still gets the
// precached copies of the shell it runs (red team R87-B-03).
const UNVERSIONED_SHELL_ASSET_PATHS = new Set([
    "css/r78-marble-tile.webp",
    "visual-assets/v10_1/roulette/vendor/three-r128.min.js",
    "visual-assets/v10_1/roulette/platemap.json",
    "visual-assets/v10_1/roulette/assets/squads.json",
    "visual-assets/v10_1/shared/fonts/barlow-condensed-latin-600-normal.woff2",
    "visual-assets/v10_1/shared/fonts/barlow-condensed-latin-700-normal.woff2",
    "assets/fonts/barlow-condensed-vietnamese-600-normal.woff2",
    "assets/fonts/barlow-condensed-vietnamese-700-normal.woff2",
    "assets/fonts/barlow-condensed-vietnamese-800-normal.woff2",
    "assets/fonts/barlow-condensed-latin-ext-600-normal.woff2",
    "assets/fonts/barlow-condensed-latin-ext-700-normal.woff2",
    "assets/fonts/barlow-condensed-latin-ext-800-normal.woff2",
    "assets/fonts/barlow-condensed-latin-600-normal.woff2",
    "assets/fonts/barlow-condensed-latin-700-normal.woff2",
    "assets/fonts/barlow-condensed-latin-800-normal.woff2",
    // r87: the rest of the local faces, so the offline and error screens keep the brush title and body type offline
    "visual-assets/v10_1/shared/fonts/barlow-latin-400-normal.woff2",
    "visual-assets/v10_1/shared/fonts/barlow-latin-600-normal.woff2",
    "visual-assets/v10_1/shared/fonts/kaushan-script-latin-400-normal.woff2"
]);
const NETWORK_ONLY_ASSET_PATHS = new Set([
    "js/productionAuthorizationAcceptance.js",
    "js/productionProviderAbuseAcceptance.js"
]);

const SHELL_PATHS = Object.freeze([
    "index.html",
    "manifest.webmanifest",
    "css/app.css",
    "assets/fonts/barlow-condensed.css",
    "assets/fonts/barlow-condensed-vietnamese-600-normal.woff2",
    "assets/fonts/barlow-condensed-vietnamese-700-normal.woff2",
    "assets/fonts/barlow-condensed-vietnamese-800-normal.woff2",
    "assets/fonts/barlow-condensed-latin-ext-600-normal.woff2",
    "assets/fonts/barlow-condensed-latin-ext-700-normal.woff2",
    "assets/fonts/barlow-condensed-latin-ext-800-normal.woff2",
    "assets/fonts/barlow-condensed-latin-600-normal.woff2",
    "assets/fonts/barlow-condensed-latin-700-normal.woff2",
    "assets/fonts/barlow-condensed-latin-800-normal.woff2",
    "css/visual-fidelity-r3.css",
    "css/offline.css",
    "css/remoteJoining.css",
    "css/analytics.css",
    "css/footballVisuals.css",
    "css/footballVisuals-v113.css",
    "css/legacy.css",
    "css/restore.css",
    "css/rulebook.css",
    "css/saveLibrary.css",
    "css/season.css",
    "css/settings.css",
    "css/transfer.css",
    "data/clubs.js",
    "data/footballVisuals.js",
    "data/leagues.js",
    "data/transferOptions.js",
    "js/analytics.js",
    "js/careerScreenSeam.js",
    "js/careerScreensV10.js",
  "visual-assets/v10_1/legacy/legacy.css",
  "visual-assets/v10_1/legacy/legacy.js",
  "visual-assets/v10_1/legacy/strings.json",
  "visual-assets/v10_1/legacy/assets/platemap.json",
  "visual-assets/v10_1/rivalry-statistics/rivalry-statistics.css",
  "visual-assets/v10_1/rivalry-statistics/rivalry-statistics.js",
  "visual-assets/v10_1/rivalry-statistics/strings.json",
  "visual-assets/v10_1/rivalry-statistics/assets/platemap.json",
  "js/rivalryLegacyV10.js",
  "js/rivalryLegacyV10Markup.js",
  "js/sharedCareerAnalytics.js",
  "js/sharedActiveShowdownAdapter.js",
  "js/sharedClosedShowdownAdapter.js",
  "js/sparkCompletedShowdownReader.js",
  "js/sparkClosedShowdownCareerLoader.js",
  "js/careerSummaryStore.js",
  "js/specialPlayerReveal.js",
  "visual-assets/v10_1/special-player/index.html",
  "js/marqueePlayer.js",
  "data/marqueePlayers.js",
  "js/deadlineDay.js",
  "data/deadlineDayLines.js",
  "js/rosterRouletteStep.js",
  "js/rosterRoulette.js",
  "data/rosterSquads.js",
  "data/fifa17Players.js",
  "css/v10Roulette.css",
  "visual-assets/v10_1/roulette/index.html",
  "visual-assets/v10_1/roulette/platemap.json",
  "visual-assets/v10_1/roulette/vendor/three-r128.min.js",
  "visual-assets/v10_1/roulette/vendor/THREE_LICENSE.txt",
  "visual-assets/v10_1/roulette/assets/squads.json",
  "js/touchlineGazette.js",
  "js/commentaryV3.js",
  "js/commentaryEngine.js",
  "data/commentaryLines.js",
  "data/gazetteCopy.js",
  "data/frontPages.js",
  "css/v10Gazette.css",
  "visual-assets/v10_1/content/content.css",
  "visual-assets/v10_1/content/frontpage.js",
  "visual-assets/v10_1/content/gazette/fonts/unifrakturmaguntia-latin-400-normal.woff2",
  "visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-700-normal.woff2",
  "visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-900-normal.woff2",
  "visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-400-italic.woff2",
  "visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-400-normal.woff2",
  "visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-400-italic.woff2",

````

## FILE: visual-assets/v10_1/roulette/assets/squads.json (EXCERPT: first 2000 bytes of 43951; the rest has the same shape)

````json
{"source":"FIFA 17 launch (170002) squads, Team G research/r87-squads; kit colours = r85 club identity palettes","clubs":[{"club":"Arsenal","league":"premier_league","kit":["#d71920","#f5f5f5","#163a70"],"xi":[["CAM","M. Özil",89],["GK","P. Čech",88],["LM","A. Sánchez",87],["RDM","Santi Cazorla",86],["LCB","L. Koscielny",85],["RM","A. Ramsey",84],["LDM","G. Xhaka",84],["RCB","S. Mustafi",83],["ST","O. Giroud",83],["LB","Nacho Monreal",81],["RB","Héctor Bellerín",79]],"subs":[["CB","P. Mertesacker",83],["CDM","F. Coquelin",81],["LM","T. Walcott",81],["ST","Lucas Pérez",81]]},{"club":"Bournemouth","league":"premier_league","kit":["#d71920","#15191d","#f3d23b"],"xi":[["RCM","J. Wilshere",82],["ST","C. Wilson",76],["GK","A. Boruc",76],["CDM","A. Surman",75],["LCM","H. Arter",74],["RCB","S. Francis",73],["LCB","S. Cook",72],["LM","J. King",72],["LB","C. Daniels",72],["RM","J. Ibe",71],["RB","A. Smith",71]],"subs":[["LW","M. Gradel",79],["ST","B. Afobe",74],["CB","M. Wilson",74],["GK","A. Federici",73]]},{"club":"Burnley","league":"premier_league","kit":["#6b1f3a","#81c7e7","#f2d649"],"xi":[["LCM","S. Defour",79],["GK","T. Heaton",76],["RCB","M. Keane",75],["RS","A. Gray",75],["RB","M. Lowton",75],["LCB","B. Mee",74],["LS","S. Vokes",73],["LB","S. Ward",72],["LM","S. Arfield",72],["RCM","D. Marney",71],["RM","G. Boyd",71]],"subs":[["RB","J. Flanagan",73],["CM","J. Hendrick",72],["RM","J. Gudmundsson",72],["ST","P. Bamford",71]]},{"club":"Chelsea","league":"premier_league","kit":["#1746a2","#f7f8f9","#d5b638"],"xi":[["GK","T. Courtois",89],["LW","E. Hazard",88],["RCM","Cesc Fàbregas",86],["ST","Diego Costa",85],["RW","Willian",85],["LCB","J. Terry",84],["LB","Azpilicueta",84],["LCM","N. Matić",84],["RCB","G. Cahill",83],["CDM","N. Kanté",81],["RB","B. Ivanović",80]],"subs":[["CB","David Luiz",84],["CAM","Oscar",83],["GK","A. Begović",83],["LM","Pedro",83]]},{"club":"Crystal Palace","league":"premier_league","kit":["#2355a6","#d62232","#f4f5f6"],"xi":[["GK","S. M
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

## FILE: data/rosterSquads.js (EXCERPT)

````json
{"note":"EXCERPT, re-printed as JSON from data/rosterSquads.js: the same clubs. Rows: [position, name, shirt, overall].","listVersion":2,"roster":"fifa17-launch-170002","squads":{"Arsenal":{"xi":[["CAM","M. Özil",11,89],["GK","P. Čech",33,88],["LM","A. Sánchez",7,87],["RDM","Santi Cazorla",19,86],["LCB","L. Koscielny",6,85],["RM","A. Ramsey",8,84],["LDM","G. Xhaka",29,84],["RCB","S. Mustafi",20,83],["ST","O. Giroud",12,83],["LB","Nacho Monreal",18,81],["RB","Héctor Bellerín",24,79]],"subs":[["CB","P. Mertesacker",4,83],["CDM","F. Coquelin",34,81],["LM","T. Walcott",14,81],["ST","Lucas Pérez",9,81]],"reserves":[["RB","M. Debuchy",2,80],["LB","K. Gibbs",3,80],["ST","D. Welbeck",23,80]]},"Bournemouth":{"xi":[["RCM","J. Wilshere",32,82],["ST","C. Wilson",13,76],["GK","A. Boruc",1,76],["CDM","A. Surman",6,75],["LCM","H. Arter",8,74],["RCB","S. Francis",2,73],["LCB","S. Cook",3,72],["LM","J. King",17,72],["LB","C. Daniels",11,72],["RM","J. Ibe",33,71],["RB","A. Smith",15,71]],"subs":[["LW","M. Gradel",10,79],["ST","B. Afobe",9,74],["CB","M. Wilson",20,74],["GK","A. Federici",23,73]],"reserves":[["CM","D. Gosling",4,72],["LB","N. Aké",5,72],["LM","M. Pugh",7,72]]},"Barcelona":{"xi":[["RW","L. Messi",10,93],["LW","Neymar",11,92],["ST","L. Suárez",9,92],["LCM","Iniesta",8,88],["CDM","Sergio Busquets",5,87],["RCM","I. Rakitić",4,87],["LB","Jordi Alba",18,86],["RCB","Piqué",3,86],["LCB","J. Mascherano",14,85],["GK","M. ter Stegen",1,83],["RB","Sergi Roberto",20,79]],"subs":[["CM","André Gomes",21,84],["CM","A. Turan",7,84],["CB","S. Umtiti",23,82],["ST","Paco Alcácer",17,81]],"reserves":[["GK","J. Cillessen",13,81],["CB","J. Mathieu",24,81],["LM","Denis Suárez",6,80]]},"Real Madrid":{"xi":[["LW","Cristiano Ronaldo",7,94],["RW","G. Bale",11,90],["LCB","Sergio Ramos",4,89],["RCM","L. Modrić",19,89],["LCM","T. Kroos",8,88],["RCB","Pepe",3,88],["CAM","J. Rodríguez",10,87],["ST","K. Benzema",9,87],["LB","Marcelo",12,86],["GK","K. Navas",1,85],["RB","Carvajal",2,83]],"subs":[["CB","R. Varane",5,84],["CAM","Isco",22,84],["CDM","Casemiro",14,82],["ST","Morata",21,82]],"reserves":[["RM","Lucas Vázquez",17,81],["CAM","Marco Asensio",20,81],["LB","Fábio Coentrão",15,80]]},"Juventus":{"xi":[["GK","G. Buffon",1,88],["LCB","G. Chiellini",3,88],["LS","G. Higuaín",9,88],["CB","L. Bonucci",19,87],["RCB","A. Barzagli",15,86],["RS","P. Dybala",21,85],["CDM","M. Pjanić",5,85],["RM","Dani Alves",23,85],["LM","Alex Sandro",12,84],["RCM","S. Khedira",6,83],["LCM","K. Asamoah",22,80]],"subs":[["CM","C. Marchisio",8,86],["RB","S. Lichtsteiner",26,83],["CB","M. Benatia",4,83],["ST","M. Mandžukić",17,83]],"reserves":[["RM","J. Cuadrado",7,82],["LB","P. Evra",33,82],["CM","Hernanes",11,80]]},"Borussia Dortmund":{"xi":[["LM","M. Reus",11,88],["ST","P. Aubameyang",17,86],["CAM","M. Götze",10,84],["LCB","Sokratis",25,84],["RDM","G. Castro",27,82],["RB","L. Piszczek",26,82],["GK","R. Bürki",38,81],["RCB","Marc Bartra",5,81],["LDM","S. Rode",18,80],["LB","M. Schmelzer",29,80],["RM","O. Dembélé",7,77]],"subs":[["CAM","S. Kagawa",23,83],["CB","S. Bender",6,82],["LM","A. Schürrle",21,81],["CDM","N. Şahin",8,80]],"reserves":[["CDM","J. Weigl",33,79],["GK","R. Weidenfeller",1,78],["CB","N. Subotić",4,78]]},"Bayern Munich":{"xi":[["GK","M. Neuer",1,92],["RCB","J. Boateng",17,90],["ST","R. Lewandowski",9,90],["RB","P. Lahm",21,88],["LB","D. Alaba",27,87],["RW","T. Müller",25,87],["LCB","M. Hummels",5,87],["RCM","A. Vidal",23,87],["LW","F. Ribéry",7,86],["LCM","Thiago",6,84],["CDM","Xabi Alonso",14,84]],"subs":[["RM","A. Robben",10,87],["CB","Javi Martinez",8,84],["LM","Douglas Costa",11,84],["LW","K. Coman",29,81]],"reserves":[["LB","Bernat",18,79],["CB","H. Badstuber",28,79],["RB","Rafinha",13,78]]},"Chelsea":{"xi":[["GK","T. Courtois",13,89],["LW","E. Hazard",10,88],["RCM","Cesc Fàbregas",4,86],["ST","Diego Costa",19,85],["RW","Willian",22,85],["LCB","J. Terry",26,84],["LB","Azpilicueta",28,84],["LCM","N. Matić",21,84],["RCB","G. Cahill",24,83],["CDM","N. Kanté",7,81],["RB","B. Ivanović",2,80]],"subs":[["CB","David Luiz",30,84],["CAM","Oscar",8,83],["GK","A. Begović",1,83],["LM","Pedro",11,83]],"reserves":[["ST","M. Batshuayi",23,81],["CB","K. Zouma",5,80],["CDM","J. Mikel",12,78]]}}}
````

## FILE: data/fifa17Players.js (EXCERPT)

````json
{"note":"EXCERPT, re-printed as JSON from data/fifa17Players.js: header fields plus 8 of 98 clubs. Every club has the same shape.","roster":"fifa17-launch-170002","source":"https://raw.githubusercontent.com/ifrankandrade/data-visualization/main/datasets/players_17.csv","rowCount":2975,"columns":["name","overall","player_positions","team_position","team_jersey_number","nationality"],"formations":{"4-2-3-1 (2)":["GK","RB","RCB","LCB","LB","RDM","LDM","RM","CAM","LM","ST"],"4-1-4-1":["GK","RB","RCB","LCB","LB","CDM","RM","RCM","LCM","LM","ST"],"4-4-2":["GK","RB","RCB","LCB","LB","RM","RCM","LCM","LM","RS","LS"],"4-3-3 (2)":["GK","RB","RCB","LCB","LB","CDM","RCM","LCM","RW","ST","LW"],"4-1-2-1-2 (2)":["GK","RB","RCB","LCB","LB","CDM","RCM","LCM","CAM","RS","LS"],"5-3-2":["GK","RWB","RCB","CB","LCB","LWB","RCM","CM","LCM","RS","LS"],"4-4-1-1":["GK","RB","RCB","LCB","LB","RM","RCM","LCM","LM","CF","ST"],"4-3-3 (4)":["GK","RB","RCB","LCB","LB","RCM","LCM","CAM","RW","ST","LW"],"4-4-2 (2)":["GK","RB","RCB","LCB","LB","RM","RDM","LDM","LM","RS","LS"],"3-5-2":["GK","RCB","CB","LCB","RDM","LDM","RM","CAM","LM","RS","LS"],"4-3-3":["GK","RB","RCB","LCB","LB","RCM","CM","LCM","RW","ST","LW"],"3-4-1-2":["GK","RCB","CB","LCB","RM","RCM","LCM","LM","CAM","RS","LS"],"4-2-2-2":["GK","RB","RCB","LCB","LB","RDM","LDM","RAM","LAM","RS","LS"],"4-3-1-2":["GK","RB","RCB","LCB","LB","RCM","CM","LCM","CAM","RS","LS"],"4-1-2-1-2":["GK","RB","RCB","LCB","LB","CDM","RM","LM","CAM","RS","LS"],"3-4-3 Flat":["GK","RCB","CB","LCB","RM","RCM","LCM","LM","RW","ST","LW"],"3-4-2-1":["GK","RCB","CB","LCB","RM","RCM","LCM","LM","RF","LF","ST"],"4-2-3-1":["GK","RB","RCB","LCB","LB","RDM","LDM","RAM","CAM","LAM","ST"],"3-1-4-2":["GK","RCB","CB","LCB","CDM","RM","RCM","LCM","LM","RS","LS"],"4-3-2-1":["GK","RB","RCB","LCB","LB","RCM","CM","LCM","RF","LF","ST"]},"clubs":{"Arsenal":{"formation":"4-2-3-1 (2)","slots":["CAM","GK","LM","RDM","LCB","RM","LDM","RCB","ST","LB","RB"],"players":[["M. Özil",89,["CAM","LW"],"CAM",11,"Germany"],["P. Čech",88,["GK"],"GK",33,"Czech Republic"],["A. Sánchez",87,["LW","LM","RW"],"LM",7,"Chile"],["Santi Cazorla",86,["CAM","CM","CDM"],"RDM",19,"Spain"],["L. Koscielny",85,["CB"],"LCB",6,"France"],["A. Ramsey",84,["CM","CDM","RW"],"RM",8,"Wales"],["G. Xhaka",84,["CM"],"LDM",29,"Switzerland"],["S. Mustafi",83,["CB"],"RCB",20,"Germany"],["P. Mertesacker",83,["CB"],"SUB",4,"Germany"],["O. Giroud",83,["ST"],"ST",12,"France"],["F. Coquelin",81,["CDM","CM"],"SUB",34,"France"],["T. Walcott",81,["LM","ST","RW","RM"],"SUB",14,"England"],["Nacho Monreal",81,["LB"],"LB",18,"Spain"],["Lucas Pérez",81,["ST"],"SUB",9,"Spain"],["D. Welbeck",80,["ST","LM"],"SUB",23,"England"],["K. Gibbs",80,["LB"],"SUB",3,"England"],["M. Debuchy",80,["RB"],"RES",2,"France"],["Héctor Bellerín",79,["RB"],"RB",24,"Spain"],["A. Oxlade-Chamberlain",79,["RM","RW"],"SUB",15,"England"],["Gabriel",79,["CB"],"SUB",5,"Brazil"],["D. Ospina",79,["GK"],"SUB",13,"Colombia"],["M. Elneny",74,["CDM","CM"],"SUB",35,"Egypt"],["C. Jenkinson",73,["RB"],"RES",25,"England"],["A. Iwobi",70,["LM","RM","ST"],"SUB",17,"Nigeria"],["Y. Sanogo",69,["ST"],"RES",22,"France"],["G. Zelalem",67,["CM"],"RES",40,"United States"],["R. Holding",67,["CB","RB"],"SUB",16,"England"],["A. Maitland-Niles",65,["RM","CM"],"RES",55,"England"],["C. Akpom",64,["ST"],"RES",32,"England"],["J. Reine-Adelaïde",63,["CAM","RW"],"RES",31,"France"],["K. Bielik",61,["CB","CDM"],"RES",37,"Poland"],["C. Willock",56,["ST"],"RES",68,"England"],["M. Macey",52,["GK"],"RES",54,"England"]],"reserves":[["M. Debuchy",80,["RB"],"RES",2,"France"],["K. Gibbs",80,["LB"],"SUB",3,"England"],["D. Welbeck",80,["ST","LM"],"SUB",23,"England"]]},"Bournemouth":{"formation":"4-1-4-1","slots":["RCM","ST","GK","CDM","LCM","RCB","LCB","LM","LB","RM","RB"],"players":[["J. Wilshere",82,["CM","CDM","CAM"],"RCM",32,"England"],["M. Gradel",79,["LW","RW","ST"],"SUB",10,"Ivory Coast"],["C. Wilson",76,["ST"],"ST",13,"England"],["A. Boruc",76,["GK"],"GK",1,"Poland"],["A. Surman",75,["CM","CDM"],"CDM",6,"England"],["B. Afobe",74,["ST"],"SUB",9,"England"],["H. Arter",74,["CM","CAM"],"LCM",8,"Republic of Ireland"],["M. Wilson",74,["CB","LB","CDM"],"RES",20,"Republic of Ireland"],["S. Francis",73,["CB","RB"],"RCB",2,"England"],["A. Federici",73,["GK"],"SUB",23,"Australia"],["N. Aké",72,["LB"],"SUB",5,"Netherlands"],["R. Fraser",72,["LM","RM"],"SUB",24,"Scotland"],["S. Cook",72,["CB"],"LCB",3,"England"],["J. King",72,["ST","LM"],"LM",17,"Norway"],["D. Gosling",72,["CM"],"SUB",4,"England"],["M. Pugh",72,["LM"],"SUB",7,"England"],["C. Daniels",72,["LB"],"LB",11,"England"],["L. Cook",71,["CM","CDM","CAM"],"SUB",18,"England"],["J. Ibe",71,["LW","RW"],"RM",33,"England"],["T. Mings",71,["LB"],"SUB",26,"England"],["A. Smith",71,["RB"],"RB",15,"England"],["J. Stanislas",70,["LM","RM"],"SUB",19,"England"],["L. Grabban",70,["ST"],"SUB",28,"England"],["L. Mousset",68,["ST"],"RES",31,"France"],["E. Hyndman",65,["CM"],"RES",22,"United States"],["B. Smith",65,["LB","LWB"],"SUB",14,"Australia"],["R. Allsop",64,["GK"],"RES",21,"England"],["J. Lee",59,["RB"],"RES",47,"England"],["O. Harfield",59,["LB"],"RES",40,"England"],["C. Jordan",56,["CB"],"RES",37,"England"],["J. Holmes",54,["GK"],"RES",45,"Australia"],["P. O'Flaherty",54,["GK"],"RES",41,"England"],["C. Buckley",51,["LB","CB"],"RES",43,"England"]],"reserves":[["D. Gosling",72,["CM"],"SUB",4,"England"],["N. Aké",72,["LB"],"SUB",5,"Netherlands"],["M. Pugh",72,["LM"],"SUB",7,"England"]]},"Barcelona":{"formation":"4-3-3 (2)","slots":["RW","LW","ST","LCM","CDM","RCM","LB","RCB","LCB","GK","RB"],"players":[["L. Messi",93,["RW"],"RW",10,"Argentina"],["Neymar",92,["LW"],"LW",11,"Brazil"],["L. Suárez",92,["ST"],"ST",9,"Uruguay"],["Iniesta",88,["CM"],"LCM",8,"Spain"],["Sergio Busquets",87,["CDM"],"CDM",5,"Spain"],["I. Rakitić",87,["CM"],"RCM",4,"Croatia"],["Jordi Alba",86,["LB"],"LB",18,"Spain"],["Piqué",86,["CB"],"RCB",3,"Spain"],["J. Mascherano",85,["CB","CDM"],"LCB",14,"Argentina"],["André Gomes",84,["CM","LM","CAM","CDM"],"SUB",21,"Portugal"],["A. Turan",84,["CM","RM","LM"],"SUB",7,"Turkey"],["M. ter Stegen",83,["GK"],"GK",1,"Germany"],["S. Umtiti",82,["CB"],"SUB",23,"France"],["Paco Alcácer",81,["ST"],"SUB",17,"Spain"],["J. Cillessen",81,["GK"],"SUB",13,"Netherlands"],["J. Mathieu",81,["CB","LB"],"SUB",24,"France"],["Denis Suárez",80,["LM","RM","CM"],"SUB",6,"Spain"],["Rafinha",80,["CM","RW","LW","CDM"],"SUB",12,"Brazil"],["Sergi Roberto",79,["CM","RB","CDM"],"RB",20,"Spain"],["L. Digne",79,["LB"],"SUB",19,"France"],["Aleix Vidal",77,["RB","RM"],"SUB",22,"Spain"],["Marlon Santos",72,["CB","CDM"],"SUB",33,"Brazil"],["Borja López",71,["CB"],"RES",31,"Spain"],["Nili Perdomo",71,["RB","RM"],"RES",32,"Spain"],["Gerard",70,["CM","CDM","CB"],"RES",36,"Spain"],["Jordi Masip",70,["GK"],"SUB",25,"Spain"],["W. Kaptoum",68,["CM","CDM"],"RES",27,"Cameroon"],["Sergi Palencia",66,["RB","LB"],"RES",34,"Spain"],["José Suarez",66,["GK"],"RES",26,"Spain"],["Marc Cardona",65,["ST"],"RES",29,"Spain"],["Aleñà",64,["CM","CAM","CDM"],"RES",28,"Spain"],["Rafa Mújica",64,["ST"],"RES",35,"Spain"],["Àlex Carbonell",64,["CF","RW"],"RES",30,"Spain"]],"reserves":[["J. Cillessen",81,["GK"],"SUB",13,"Netherlands"],["J. Mathieu",81,["CB","LB"],"SUB",24,"France"],["Denis Suárez",80,["LM","RM","CM"],"SUB",6,"Spain"]]},"Real Madrid":{"formation":"4-3-3 (4)","slots":["LW","RW","LCB","RCM","LCM","RCB","CAM","ST","LB","GK","RB"],"players":[["Cristiano Ronaldo",94,["LW","LM","ST"],"LW",7,"Portugal"],["G. Bale",90,["RW"],"RW",11,"Wales"],["Sergio Ramos",89,["CB"],"LCB",4,"Spain"],["L. Modrić",89,["CM","CDM"],"RCM",19,"Croatia"],["T. Kroos",88,["CM","CDM"],"LCM",8,"Germany"],["Pepe",88,["CB"],"RCB",3,"Portugal"],["J. Rodríguez",87,["CAM","CM","RM"],"CAM",10,"Colombia"],["K. Benzema",87,["ST"],"ST",9,"France"],["Marcelo",86,["LB"],"LB",12,"Brazil"],["K. Navas",85,["GK"],"GK",1,"Costa Rica"],["R. Varane",84,["CB"],"SUB",5,"France"],["Isco",84,["CAM","CM","RM"],"SUB",22,"Spain"],["Carvajal",83,["RB"],"RB",2,"Spain"],["Casemiro",82,["CDM"],"SUB",14,"Brazil"],["Morata",82,["ST","LW"],"SUB",21,"Spain"],["Marco Asensio",81,["CAM","LM","RM"],"SUB",20,"Spain"],["Lucas Vázquez",81,["RM","RW"],"SUB",17,"Spain"],["Danilo",80,["RB","LB"],"SUB",23,"Brazil"],["Fábio Coentrão",80,["LB","LM"],"SUB",15,"Portugal"],["M. Kovačić",79,["CM"],"SUB",16,"Croatia"],["Kiko Casilla",79,["GK"],"SUB",13,"Spain"],["Nacho Fernández",78,["CB","RB","LB"],"SUB",6,"Spain"],["Lucas Silva",74,["CDM","CM"],"RES",24,"Brazil"],["Mariano",71,["ST"],"SUB",18,"Dominican Republic"],["M. Ødegaard",70,["CAM","RM","CM"],"RES",26,"Norway"],["Aleix Febas",67,["CM"],"RES",36,"Spain"],["S. Díaz",67,["CF","CAM","ST","LW"],"RES",27,"Paraguay"],["E. Fernández",66,["LM","CAM"],"RES",29,"France"],["P. Lienhart",65,["CB"],"RES",34,"Austria"],["N. Vergos",65,["ST","CF"],"RES",28,"Greece"],["Rubén Yáñez",65,["GK"],"RES",31,"Spain"],["A. Hakimi",64,["RB"],"RES",33,"Morocco"],["Álvaro Tejero",62,["LB","RB"],"RES",35,"Spain"]],"reserves":[["Lucas Vázquez",81,["RM","RW"],"SUB",17,"Spain"],["Marco Asensio",81,["CAM","LM","RM"],"SUB",20,"Spain"],["Fábio Coentrão",80,["LB","LM"],"SUB",15,"Portugal"]]},"Juventus":{"formation":"3-1-4-2","slots":["GK","LCB","LS","CB","RCB","RS","CDM","RM","LM","RCM","LCM"],"players":[["G. Buffon",88,["GK"],"GK",1,"Italy"],["G. Chiellini",88,["CB"],"LCB",3,"Italy"],["G. Higuaín",88,["ST"],"LS",9,"Argentina"],["L. Bonucci",87,["CB"],"CB",19,"Italy"],["A. Barzagli",86,["CB"],"RCB",15,"Italy"],["C. Marchisio",86,["CM","CDM"],"SUB",8,"Italy"],["P. Dybala",85,["ST","CF"],"RS",21,"Argentina"],["M. Pjanić",85,["CM"],"CDM",5,"Bosnia Herzegovina"],["Dani Alves",85,["RB"],"RM",23,"Brazil"],["Alex Sandro",84,["LB","LM"],"LM",12,"Brazil"],["S. Lichtsteiner",83,["RB","RM"],"SUB",26,"Switzerland"],["M. Benatia",83,["CB"],"SUB",4,"Morocco"],["S. Khedira",83,["CM","CDM"],"RCM",6,"Germany"],["M. Mandžukić",83,["ST"],"SUB",17,"Croatia"],["P. Evra",82,["LB","LM"],"SUB",33,"France"],["J. Cuadrado",82,["RM"],"SUB",7,"Colombia"],["K. Asamoah",80,["CM","LM"],"LCM",22,"Ghana"],["Hernanes",80,["CM","CAM","CDM"],"SUB",11,"Brazil"],["Neto",80,["GK"],"SUB",25,"Brazil"],["D. Rugani",79,["CB"],"SUB",24,"Italy"],["M. Lemina",77,["CM","CDM"],"SUB",18,"Gabon"],["S. Sturaro",77,["CM","CDM"],"SUB",27,"Italy"],["M. Pjaca",76,["LW"],"RES",20,"Croatia"],["F. Mattiello",72,["LB","RB"],"RES",42,"Italy"],["P. De Ceglie",72,["LB","LM"],"RES",40,"Italy"],["R. Mandragora",69,["CM","CB"],"RES",41,"Italy"],["E. Audero",67,["GK"],"SUB",38,"Italy"]],"reserves":[["J. Cuadrado",82,["RM"],"SUB",7,"Colombia"],["P. Evra",82,["LB","LM"],"SUB",33,"France"],["Hernanes",80,["CM","CAM","CDM"],"SUB",11,"Brazil"]]},"Borussia Dortmund":{"formation":"4-2-3-1 (2)","slots":["LM","ST","CAM","LCB","RDM","RB","GK","RCB","LDM","LB","RM"],"players":[["M. Reus",88,["LM","CAM"],"LM",11,"Germany"],["P. Aubameyang",86,["ST","RM"],"ST",17,"Gabon"],["M. Götze",84,["CAM","LM","CM"],"CAM",10,"Germany"],["Sokratis",84,["CB"],"LCB",25,"Greece"],["S. Kagawa",83,["CAM","CF"],"SUB",23,"Japan"],["S. Bender",82,["CB","CDM"],"SUB",6,"Germany"],["G. Castro",82,["CM","CDM","RM"],"RDM",27,"Germany"],["L. Piszczek",82,["RB","CB"],"RB",26,"Poland"],["R. Bürki",81,["GK"],"GK",38,"Switzerland"],["Marc Bartra",81,["CB"],"RCB",5,"Spain"],["A. Schürrle",81,["LM","RM","ST"],"SUB",21,"Germany"],["S. Rode",80,["CDM","CM"],"LDM",18,"Germany"],["N. Şahin",80,["CDM","CM"],"SUB",8,"Turkey"],["M. Schmelzer",80,["LB"],"LB",29,"Germany"],["J. Weigl",79,["CDM","CM"],"SUB",33,"Germany"],["R. Weidenfeller",78,["GK"],"SUB",1,"Germany"],["A. Ramos",78,["ST"],"SUB",20,"Colombia"],["N. Subotić",78,["CB"],"RES",4,"Serbia"],["O. Dembélé",77,["RM","LM","CAM"],"RM",7,"France"],["M. Ginter",77,["RB","CB","CDM"],"SUB",28,"Germany"],["Mikel Merino",76,["CM","CDM"],"RES",24,"Spain"],["R. Guerreiro",76,["LB","LM"],"SUB",13,"Portugal"],["E. Durm",76,["LB","RB"],"RES",37,"Germany"],["Park Joo Ho",75,["LB","CDM"],"RES",3,"Korea Republic"],["C. Pulisic",69,["LM"],"SUB",22,"United States"],["F. Passlack",67,["RB","RM","LB"],"SUB",30,"Germany"],["E. Mor",64,["ST","RW"],"SUB",9,"Turkey"],["J. Gyau",64,["RM"],"RES",44,"United States"],["H. Bonmann",62,["GK"],"RES",39,"Germany"],["D. Burnic",57,["CM","CDM"],"RES",32,"Germany"],["D. Reimann",57,["GK"],"RES",49,"Germany"],["D. Sauerland",56,["CM","CAM","RB"],"RES",45,"Germany"],["P. Fritsch",55,["CB","CDM"],"RES",19,"Germany"]],"reserves":[["J. Weigl",79,["CDM","CM"],"SUB",33,"Germany"],["R. Weidenfeller",78,["GK"],"SUB",1,"Germany"],["N. Subotić",78,["CB"],"RES",4,"Serbia"]]},"Bayern Munich":{"formation":"4-3-3 (2)","slots":["GK","RCB","ST","RB","LB","RW","LCB","RCM","LW","LCM","CDM"],"players":[["M. Neuer",92,["GK"],"GK",1,"Germany"],["J. Boateng",90,["CB"],"RCB",17,"Germany"],["R. Lewandowski",90,["ST"],"ST",9,"Poland"],["P. Lahm",88,["RB","CDM","CM"],"RB",21,"Germany"],["D. Alaba",87,["LB","CB","CM"],"LB",27,"Austria"],["T. Müller",87,["CF","RW","CAM","ST"],"RW",25,"Germany"],["A. Robben",87,["RM","RW"],"SUB",10,"Netherlands"],["M. Hummels",87,["CB"],"LCB",5,"Germany"],["A. Vidal",87,["CM","CDM"],"RCM",23,"Chile"],["F. Ribéry",86,["LM"],"LW",7,"France"],["Thiago",84,["CM","CAM","CDM","LM"],"LCM",6,"Spain"],["Javi Martinez",84,["CB","CDM"],"SUB",8,"Spain"],["Douglas Costa",84,["LM","RM","CAM"],"SUB",11,"Brazil"],["Xabi Alonso",84,["CDM","CM"],"CDM",14,"Spain"],["K. Coman",81,["LW","ST","RW"],"SUB",29,"France"],["Bernat",79,["LB","LM"],"SUB",18,"Spain"],["H. Badstuber",79,["CB","LB"],"SUB",28,"Germany"],["Renato Sanches",78,["CM"],"SUB",35,"Portugal"],["J. Kimmich",78,["CM","CB","CDM","RB"],"SUB",32,"Germany"],["Rafinha",78,["RB","CB"],"SUB",13,"Brazil"],["S. Ulreich",77,["GK"],"SUB",26,"Germany"],["T. Starke",74,["GK"],"RES",22,"Germany"],["J. Green",68,["RM","RW","ST","LM"],"SUB",37,"United States"],["F. Benko",61,["CAM"],"SUB",40,"Germany"],["N. Dorsch",59,["CDM","CM"],"RES",30,"Germany"],["F. Götze",59,["CB","CDM"],"RES",20,"Germany"],["E. Öztürk",58,["CM"],"RES",38,"Germany"]],"reserves":[["Bernat",79,["LB","LM"],"SUB",18,"Spain"],["H. Badstuber",79,["CB","LB"],"SUB",28,"Germany"],["Rafinha",78,["RB","CB"],"SUB",13,"Brazil"]]},"Chelsea":{"formation":"4-3-3 (2)","slots":["GK","LW","RCM","ST","RW","LCB","LB","LCM","RCB","CDM","RB"],"players":[["T. Courtois",89,["GK"],"GK",13,"Belgium"],["E. Hazard",88,["LM","CAM","LW"],"LW",10,"Belgium"],["Cesc Fàbregas",86,["CM","CAM"],"RCM",4,"Spain"],["Diego Costa",85,["ST"],"ST",19,"Spain"],["Willian",85,["RM","CAM"],"RW",22,"Brazil"],["J. Terry",84,["CB"],"LCB",26,"England"],["David Luiz",84,["CB"],"SUB",30,"Brazil"],["Azpilicueta",84,["LB","RB"],"LB",28,"Spain"],["N. Matić",84,["CDM"],"LCM",21,"Serbia"],["Oscar",83,["CAM","LM"],"SUB",8,"Brazil"],["G. Cahill",83,["CB"],"RCB",24,"England"],["A. Begović",83,["GK"],"SUB",1,"Bosnia Herzegovina"],["Pedro",83,["LM","LW","RW"],"SUB",11,"Spain"],["M. Batshuayi",81,["ST"],"SUB",23,"Belgium"],["N. Kanté",81,["CM","CDM"],"CDM",7,"France"],["K. Zouma",80,["CB"],"SUB",5,"France"],["B. Ivanović",80,["RB","CB"],"RB",2,"Serbia"],["J. Mikel",78,["CDM"],"SUB",12,"Nigeria"],["M. van Ginkel",77,["CM"],"RES",35,"Netherlands"],["V. Moses",77,["LM","RM","LW"],"SUB",15,"Nigeria"],["Marcos Alonso",77,["LM","LB"],"SUB",3,"Spain"],["Eduardo",76,["GK"],"RES",37,"Portugal"],["T. Kane",70,["RB"],"RES",47,"England"],["D. Solanke",69,["ST"],"RES",48,"England"],["R. Loftus-Cheek",68,["CAM","CM"],"SUB",36,"England"],["N. Chalobah",68,["CM","CDM"],"SUB",29,"England"],["O. Aina",63,["RB"],"SUB",34,"England"],["F. Tomori",61,["CB"],"RES",43,"England"],["J. Dasilva",59,["LB"],"RES",52,"England"],["K. Scott",58,["CM"],"RES",55,"England"],["M. Mount",57,["CAM"],"RES",56,"England"],["B. Collins",57,["GK"],"RES",49,"England"],["T. Chalobah",55,["RB","CB"],"RES",62,"England"]],"reserves":[["M. Batshuayi",81,["ST"],"SUB",23,"Belgium"],["K. Zouma",80,["CB"],"SUB",5,"France"],["J. Mikel",78,["CDM"],"SUB",12,"Nigeria"]]}}}
````

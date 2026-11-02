# Career Mode Showdown 2.0.0 (r87): release notes

Draft for Nik and Daniel. Kept up to date as fix PRs land in gameplay/r87. Facts come from the merged PRs listed at the bottom.
Status: DRAFT, last updated 2026-11-02 03:10 UTC (release candidate gameplay/r87 bd67147a). Release time: 2026-11-02 05:00 UTC (midnight Boston). Items under "Still to land" are not in yet.

## The big one: Russian Roster Roulette
Every season, after Career Start and before Transfer War, each of you spins a seven-chamber revolver in a 3D cowboy-cafe scene. Daniel spins first.
- One chamber in seven fires. A shot hits one of the 15 players on your FIFA 17 squad board (11 starters and 4 subs), and you release that player in your real FIFA 17 save.
- Your board starts as your club's real FIFA 17 launch squad, in its real formation. From season 2 it updates itself: the player you lost leaves, and your kept signings join if they fit the position and are better.
- Your Special Player is never on the board, so he can never be shot.
- Transfer War opens only after both of you have spun and played the Prime Pack. Until then the button says who it is waiting for.
- Both phones always see the same spin. A refresh or double tap can't spin again.
- If the scene can't load, you still get your result on a plain panel, and Transfer War stays shut until you have seen it.
- Each season's hit is saved online, so a reload or the other phone always shows the same player, and the roulette never spins twice.
- A player your rival guessed comes off your board, but a club player who shares his name stays. A player your rival guessed can't be signed again in a later Transfer War window: the game refuses with a clear message, and the Rule Book says so.
- The scene looks sharper: a nickel-steel drum, the title steps aside while a turn plays, and the props keep clear of the boards.

## Prime Pack (new)
Once a season, right after the roulette and before Transfer War, a Prime Pack opens on both phones and one masked Icon card rises.
- Stage 1 shows his position and one real card stat; each of the next three stages adds a stat. A right name scores 4, 3, 2 or 1 points depending on the stage.
- Each of you has 2 guesses for the whole round. The first right guess wins (by server time), so only one of you can score. Nobody right means nobody scores, and the full card is revealed.
- A perfect season is now 15 points, and a Golden Showdown is 150 points over ten seasons. Trophy Room, Rivalry Statistics, History, the Gazette, commentary and the Rule Book all count the same way.
- The player is never stored: both phones work him out from the Showdown, so nobody can peek.
- If one of you taps BACK while waiting, the other can't play the round alone.
- Team V's card art: a cream-and-gold Icon card in the Showdown's own style. With the phone keyboard open the page keeps its phone layout, and once the round is over your line gets the whole box.

## Transfer War
- One name everywhere: buttons, status lines and the Rule Book all say Transfer War. After the roulette the button says GO TO THE PRIME PACK, and the Prime Pack's Continue takes you to Transfer War, so the order is always roulette, Prime Pack, Transfer War.
- Each signing now takes the player's FIFA 17 overall (30 to 99) and his position. These feed the roulette board; they are never part of a guess.
- League names use the official 2016-17 names (LaLiga Santander, Serie A TIM, Sky Bet Championship and so on). Old names still work in search.
- Search lists show every option, scroll properly, and stay clear of the phone's bottom buttons.
- On a laptop the faces at the top are no longer covered.
- Deadline Day finish: the last part of the window gets ticker headlines and a commentator line.
- Clearer messages when the connection drops or Firebase refuses an action.
- A cleaner Transfer War: the window clock is the hero on laptops, RELEASE and KEEP stamps, and an opaque CONTINUE bar on phones.
- Locking three signings works again (it was refused by Firebase in an earlier r87 build).

## Season Results: Commentary v3
A two-voice TV bar inside the SEASON SCORE box. COMMENTARY tells the biggest story of the season, and BY THE NUMBERS works out exactly what each of you needs next. Lines come only from your own results, never repeat within a Showdown, and the last season tells the story of the whole Showdown. It never covers faces or buttons.

## The Touchline Gazette
A newspaper front page after each season's results, and a final edition after the Final Winner that covers the whole Showdown. Both phones print the same paper. It costs no extra Firebase reads, and CONTINUE takes you on to the next screen. The last season goes straight to the final edition.
- THE RACE strip says who leads, by how much, and when a lead can no longer be caught.
- A record book with streaks, best seasons and perfect 15-point seasons, and a Golden watch (150 points) in ten-season Showdowns.
- Every printed line is checked against what really happened. The paper is bigger, with darker ink and larger reading sizes, and fills the whole phone screen. Broken pictures and sideways phones are fixed.

## Starting a Showdown
- Seasons screen: four gold chips for 1, 3, 5 and 10 seasons, plus the NEW SHOWDOWN wordmark.
- Career Start has its own stage on the Club plate: your club crests sit inside the packs, and nothing covers the faces or wordmark.
- Special Player reveal: smoother on phones, the LED boards show whole messages, the name always fits its plate, and Continue is no longer dimmed while waiting. The Special Player is a random top-300 player who is never from the manager's own club (#1173).
- REMATCH on the Final Winner screen. Daniel's opens the seasons screen with the same length already picked; Nik's takes him to Home to JOIN.

## Career screens
- History opens on your newest Showdown and stays fast with hundreds of Showdowns.
- History & Backup shows your real online career (it showed 0 before), and Standings and Rivalry no longer get stuck during a live Showdown.
- The season history is now a clear table: season, both managers' points and the result.
- Career pages keep the Reus loading screen up until your career has arrived, even on a slow or offline phone, and show TRY AGAIN if they can't load. No crown for a 0-0 when no Showdown has finished, and equal points always count as a draw. An empty Standings tab has a button to Career Standings.
- Many layout fixes: Final Winner buttons, Trophy Room headings and "NOT WON YET", drawn Showdowns shown with "=", a split face for a level Career Leaders row, and big numbers fitting on Career Statistics.

## Smoother everywhere
- No black pause between screens. A slow screen change shows the Reus loading screen instead, and it never blinks.
- No flash of the old top bar between Loading and Home, and a faster first load.
- Error, offline and quota screens say what happened in plain words and always give you a way back.
- A double tap on a Home tile no longer opens the wrong screen.
- Home has no extra music bar at any size, and its tiles never sit under the phone's tab bar. On phones music lives in the MUSIC tab.
- The first tap on OPEN TROPHY ROOM always opens it (it was sometimes swallowed while the screen loaded).
- Title screens wipe in without a solid cover over the picture.
- Music player: your chosen song stays chosen, a failed stream retries when you tap Play, and the panel says what it's doing.
- Reloading in the middle of a Showdown on a weak signal resumes the right season instead of starting again. A reload or a stale tab at the very end of a Showdown still lands on the Champion screen.
- Pairing: an UNPAIR that can't happen says why, Nik's Home notices when Daniel has unpaired, expired codes say so, and the JOIN wait stops polling once the code has expired.
- A phone with a wrong clock can still connect, and clock changes (like the switch to winter time on 1 November) don't affect timers.
- No dark box across a face on tablet Home, and the Select League waiting strip never covers its buttons.

## Free-tier reads
- Both phones now show the same "free online use today" and "seasons left" numbers (a small shared meter, written once per season per phone).
- Several cuts to background reads, including the season-commit wait (about a quarter fewer reads there) and the settings counter no longer charging lookups Firebase doesn't bill. About 580 billed reads per middle season for both phones. The game stays on the free Firebase plan.

## Wording
Buttons and status lines name Daniel instead of "host", Transfer War shows the right season number, and empty screens say what to tap next.

## Still to land (not in yet)
- Version 2.0.0 everywhere (Settings and the update check).

## Before and right after it goes live
- A 10-season emulator game with every career screen matching the online data.
- Nik looks over the gallery, then types "merge r87". The new Firebase Rules deploy first, then the site.
- Nik's real-phone check on the live game (there is no test site, and the roulette needs a Showdown started after the release): https://claude.ai/artifact/LDYipb4Bc6qmYg8Gg3onPU

## Merged PRs in this release (into gameplay/r87)
#1040, #1043, #1044, #1045 (board save, later removed by #1069), #1049, #1052, #1065, #1069, #1075, #1078 (r86 merged in), #1079, #1080, #1081, #1082, #1083, #1084, #1085, #1088, #1091, #1093, #1094, #1095, #1096, #1097, #1098, #1099, #1100, #1101, #1102, #1103, #1104, #1105, #1106, #1107, #1108, #1109, #1110, #1111, #1112, #1113, #1114, #1116, #1117, #1119, #1120, #1121, #1123, #1125, #1126, #1128, #1129, #1130, #1131, #1132, #1133, #1134, #1135, #1137, #1138, #1139, #1140, #1141, #1142, #1143, #1144, #1145, #1146, #1147, #1148, #1118, #1122, #1150, #1151, #1152, #1153, #1154, #1157, #1158, #1159, #1160, #1161, #1162, #1164, #1165, #1166, #1167, #1168, #1169, #1170, #1171, #1173, #1174, #1149, #1175, #1163, #1176, #1177, #1178, #1179, #1180, #1182 (tests only), #1183, #1184, #1186, #1187, #1190.

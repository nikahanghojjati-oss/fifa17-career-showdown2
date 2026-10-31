# Career Mode Showdown 2.0.0 (r87): release notes

Draft for Nik and Daniel. Kept up to date as fix PRs land in gameplay/r87. Facts come from the merged PRs listed at the bottom.
Status: DRAFT, last updated 2026-10-31 (from gameplay/r87 at 73713d75, PRs up to #1102). Items under "Landing today" are not in yet.

## The big one: Russian Roster Roulette
Every season, after Career Start and before the transfer window, each of you spins a seven-chamber revolver in a 3D cowboy-cafe scene. Daniel spins first.
- One chamber in seven fires. A shot hits one of the 15 players on your FIFA 17 squad board (11 starters and 4 subs), and you release that player in your real FIFA 17 save.
- Your board starts as your club's real FIFA 17 launch squad, in its real formation. From season 2 it updates itself: the player you lost leaves, and your kept signings join if they fit the position and are better.
- Your Special Player is never on the board, so he can never be shot.
- The transfer window opens only after both of you have spun. Until then the button says who it is waiting for.
- Both phones always see the same spin. A refresh or double tap can't spin again.
- If the scene can't load, you still get your result on a plain panel, and the transfer window stays shut until you have seen it.

## Transfer window
- Each signing now takes the player's FIFA 17 overall (30 to 99) and his position. These feed the roulette board; they are never part of a guess.
- League names use the official 2016-17 names (LaLiga Santander, Serie A TIM, Sky Bet Championship and so on). Old names still work in search.
- Search lists show every option, scroll properly, and stay clear of the phone's bottom buttons.
- On a laptop the faces at the top are no longer covered.
- Deadline Day finish: the last part of the window gets ticker headlines and a commentator line.
- Clearer messages when the connection drops or Firebase refuses an action.

## The Touchline Gazette
A newspaper front page after each season's results, and a final edition after the Final Winner that covers the whole Showdown. Both phones print the same paper. It costs no extra Firebase reads, and CONTINUE takes you on to the next screen. The last season goes straight to the final edition.

## Starting a Showdown
- Seasons screen: four gold chips for 1, 3, 5 and 10 seasons, plus the NEW SHOWDOWN wordmark.
- Career Start has its own stage on the Club plate: your club crests sit inside the packs, and nothing covers the faces or wordmark.
- Special Player reveal: smoother on phones, the LED boards show whole messages, and Continue is no longer dimmed while waiting.
- REMATCH on the Final Winner screen. Daniel's opens the seasons screen with the same length already picked; Nik's takes him to Home to JOIN.

## Career screens
- Many layout fixes: Final Winner buttons, the Legacy history drawer, Trophy Room headings and "NOT WON YET", drawn Showdowns shown with "=", a split face for a level Career Leaders row, and big numbers fitting on Career Statistics.
- No flash of the old top bar between Loading and Home.

## Free-tier reads
- Both phones now show the same "free online use today" and "seasons left" numbers (a small shared meter, written once per season per phone).
- Several cuts to background reads. The game stays on the free Firebase plan.

## Wording
Buttons and status lines name Daniel instead of "host", the Transfer Challenge shows the right season number, and empty screens say what to tap next.

## Landing today (not in yet)
- Career fixes: History and Backup showing 0, Standings and Rivalry stuck during a live Showdown, History opening on the newest Showdown, and fast paging through hundreds of Showdowns (PR #1103, open).
- Commentary v3 on Season Results and Final Winner.
- Gazette upgrade, roulette and Special Player scene polish, match-day and error-screen polish.
- Fable, Sol and Codex bug-hunt fixes.
- Version 2.0.0 everywhere (Settings and the update check).

## Before and right after it goes live
- A 10-season emulator game with every career screen matching the online data.
- Nik looks over the gallery, then types "merge r87". The new Firebase Rules deploy first, then the site.
- Nik's real-phone check on the live game (there is no test site, and the roulette needs a Showdown started after the release): https://claude.ai/artifact/LDYipb4Bc6qmYg8Gg3onPU

## Merged PRs in this release (into gameplay/r87)
#1040, #1043, #1044, #1045 (board save, later removed by #1069), #1049, #1052, #1065, #1069, #1075, #1078 (r86 merged in), #1079, #1080, #1081, #1082, #1083, #1084, #1085, #1088, #1091, #1093, #1094, #1095, #1096, #1097, #1098, #1099, #1100, #1101, #1102.

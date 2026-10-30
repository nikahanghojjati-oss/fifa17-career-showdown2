# Career Mode Showdown — r86: the Special Player, career screens that stay cheap, Commentary v2 data (v1.9.10 runtime r86)

Application version: `v1.9.10`  
Runtime asset revision: `1.9.10-r86`  
Previous known-good runtime: `1.9.9-r85`

r86 builds on r85, the official launch (SSJR 100). The application version moves to 1.9.10 and the runtime revision to
r86. Version 2.0.0 is kept for r87, after a smooth 10-season Showdown and Nik's own check on Chromebook and phone.

## What changed

- Special Player: after Club Assignment each manager is given one high-potential FIFA 17 player from the launch top 300,
  the same draw on both phones, revealed on a stadium stage with sound, tiered colours, a tiered card hold and the
  white burst (#1027-#1030, #1035, #1048, #1051, #1053, #1061). Career Start names the player's original club. Only
  Showdowns confirmed from the r86 release time get one.
- SP chip on History, Stats, Standings, Legacy, Trophy Room, Rivalry, Final Winner and Season Results, coloured by
  ranking tier; long names wrap on phones; Rivalry shows name, chip and club the same way on both sides (#1054, #1070).
- Rule Book: a Special Player card, training by Showdown length, "Skip pre-season in FIFA 17", and none of the rules FIFA
  17 enforces itself or the draws card (they stay in the scoring engine) (#1059, #1063).
- Reads at scale: each finished Showdown is read in full once, then kept as one create-only summary in Firebase and a
  copy on the phone, so a known phone opens the career screens for about one read (#1025, #1026). History shows N of M
  while games arrive.
- Wasted reads stopped: a closed Showdown is no longer re-read every 45 s, a broken game is not re-read on every career
  open, a phone unlock or a refused read no longer re-reads everything, and a reload no longer doubles listeners
  (#1047, #1055, #1060). The Settings counter prices each read from the Rules (#1036).
- Content: Commentary v2 (88 situations, 5,100 lines) and the content pack ship as data with a pure engine; they are not
  shown on screens yet (#1029, #1037).
- Look: league wheel polish and gold slice lines, a tall-phone League plate, the title focus box, crests for every
  Special Player club, phone Home tile spacing and the iOS 26 Safari bottom-bar fix (#1031, #1033, #1046, #1057, #1058,
  #1064).
- SSJR strip: stages count only after setup is confirmed, and a RELOAD NOW button (#1038, #1039).
- Small red-team fixes (#1050).

## Update safety

- The shell and service worker advance to r86 in a fresh `career-mode-showdown-shell-1.9.10-r86` cache, and r85 is retained
  for rollback. The six shell files r86 adds are listed in `SHELL_PATHS_ADDED_SINCE_PREVIOUS`, so the retained r85 shell
  is verified against its own list.
- The site deploy now waits for the same commit's Rules deploy and stops if that fails, so the app never meets older
  Rules.

## What did not change

- The scoring formula and the Remote Joining protocol stay as they were. No shared document shape changes. No tiebreak.
- The no-flash rules, the Reus Gate, preload and decode are unchanged.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- No saved Showdown is rewritten. Nothing in Firebase is deleted or edited.

## Firestore Rules

- Rules change (#1026): `accounts/{uid}/careerSummary/{rivalryId}`. Owner-only exact gets; one create per finished
  Showdown that checks the closed root and, for a completed Showdown, that totals, winner and length equal the Terminal
  Close witness. No update, list or delete. Nothing else changes.
- Composed production Rules at the release head: 155,662 bytes, SHA-256
  `d38489a8fabf24de301c838a6669e17af663aaca7e6c286064e769ac3bc0c30e` (L5 delta: two R86-SUMMARY hunks over main).
- Rollback pair: the r85 app with the r85 composed Rules (153,241 bytes, SHA-256
  `8ea8d7ba9bf89ad999969da961b5b748e62bdb3348b7fe609cf3da2f67b71f61`). The r86 Rules only add a path, so the r85 app
  also runs on them.

## Checks

- Filled in on the release PR from the exact release head.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is `100/100`, earned on r85 (`1.9.9-r85`) by the 2026-10-29 two-device production run. No SSJR credit comes
from this source, CI or deployment, and no new physical acceptance is claimed for r86.

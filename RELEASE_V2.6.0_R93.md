# Career Mode Showdown 2.6.0 (r93): the Golden Showdown gets its moment (v2.6.0 runtime r93)

Application version: `v2.6.0`  
Runtime asset revision: `2.6.0-r93` (Nik's "OK version 2.6.0", 2026-11-15 20:12 UTC)  
Previous known-good runtime: `2.5.1-r92`

r93 is 2.6.0. Nik asked on 14 November for the Golden Showdown to show up properly, for a logo and titles that do not
look made by a prompt, and later for a roulette hand that looks filmed, with a whisky glass on the table. Four Fable bug
hunts ran on the branch; their one P1 shipped early as 2.5.1. The rules of a Showdown did not change. This file is the
release record. The list below is every pull request merged into gameplay/r93 since 2.5.0 went live (main 36b648ad):
#1465 to #1496 except the r94 drafts #1487, #1489 and #1492 and the release PR #1493; #1490 is the version bump; #1477 is the 2.5.1 hotfix into main and #1480 its back-merge; #1485 is this
release's items. Up to gameplay/r93 580e0366.

## What changed

- **Golden Showdown screen** (#1465). A manager who finishes a 10-season Showdown on 150 sees a gold screen before Final
  Winner: his bust, 150 of 150, the ten 15s, and one button, SEE FINAL WINNER. Both phones show the same screen. Final
  Winner keeps Rematch and the way out. 150-150 cannot happen in play (only one manager earns Prime Pack points in a
  season); the code keeps a both-busts fallback.
- **The winner's own gold bust** (#1466, #1469; Team V HO-080, `TRO_HC_6_GOLDEN_{NIK,DANIEL}_V1_{256,512,1024}`). Trophy
  Room: a gold case always on the ALL shelf and a GOLDEN tab, each manager's bust once won, both greyed until then.
- **Golden everywhere it belongs** (#1467, #1468, #1470). ON COURSE FOR GOLDEN on Season Results (seasons 1-9, while a
  manager has 15 in every season), a gold tile on Career Statistics, a GOLDEN SHOWDOWNS row on Standings (CAREER), the
  bust in History, Legacy and Rivalry Statistics. One rule (`goldenShowdownManagers` / `goldenShowdownCounts` in
  js/careerScreenSeam.js); nothing stored, read or written. Golden is not added to Total Trophies (season trophies only,
  unchanged). Fable hunt fixes: ON COURSE readable in play (C1), the desktop GOLDEN tab picture (T1), the Golden stage
  kept on reload (G1).
- **Flat logo V4 and live-text titles** (#1471; Team V HO-079). Every `TITLE_*_V3` picture is now Cormorant SC Bold text,
  flat #C9A45C, same cap height, baseline and box. The font (`shared/fonts/CormorantSC-Bold-latin.woff2`, OFL) is waited
  for by the Reus Gate and precached in the shell. The V3 picture files stay in the repository, unreferenced.
- **Special Player stands** (#1472). The side stand photos sit at 58 degrees (were 72) so they overlap, which removes the
  smear at the left edge (strongest at 1920x866). Light uses a soft-shoulder tone curve (the vendored three.js r187 does
  not export CustomToneMapping).
- **Device check for iPhone** (#1473). Crash limits and opening marks carry `BUILD` (= the service worker's
  `RUNTIME_REVISION`); an older build's are dropped on load. The check reloads before each 3D screen (run kept in
  sessionStorage), keeps finished rows after a tab death, and the top card names a limit and its end date.
- **20 songs, 39 in the player** (#1474). Song 2 first and Love Me Again second, unchanged. Audius stream checks are GPT
  Work mode's (the build room cannot reach Audius).
- **Roulette hand and whisky set** (#1475, #1478, #1479, #1483, #1486, #1491; Team V HO-081, HO-082, HO-083). One aim rule from the window's
  shape (22 degrees wide, 72 upright, blended), barrel through the board's centre, muzzle off the board; a real take,
  raise and upward kick; shooter's-eye plates W and P, and S_V2 (sleeve from the side, bore at 40 degrees, HO-083 replacing S_V1) where the bottom strip shows on tall
  windows; the caption in the Spin button's room on upright phones; a wider lens on upright phones during the take and
  the aim. Whisky glass on every level: Light one painted draw (rest 34 draws at 1920x866, 36 on phones, 11 programs),
  High and up a reflection-only crystal.
  Tall desktop windows with the side hand (aspect under 1.15, such as a 960x1035 half screen) take a gentle x1.2 camera reframe so the glove reads large: about 189 to 272 px across, up from 133 to 205 (#1491).
- **LOCK MY SIGNINGS** (#1476, also shipped as 2.5.1, #1477): see RELEASE_V2.5.1_R92.md.
- **Rules budget sweep** (#1482). `tests/firebase/rules-budget-sweep-emulator.cjs` replays every play write (45 kinds) on
  padded copies of the composed production Rules; L5 step `budget_sweep`. Bar: no refusal, at most 850 unless listed
  knownOver, never worse than `tests/fixtures/rules-budget/baseline.json`. Same-check slims: JOIN ~991 to ~904, START
  ~975 to ~826, season commit create ~916 to ~898. A Transfer War write refused twice now says so instead of "session
  expired".
- **Rivalry Statistics after a hidden final lock** (#1481, hunt U1, live in 2.5.0 too). js/sharedActiveShowdownAdapter.js
  drops a stale running projection behind a closed, verified witness, so the views equal an app reopen.
- **Transfer War verdicts after an app reopen** (#1484, hunt O1). VIEW TRANSFER VERDICTS is offered first until the
  verdicts were seen. No reads or writes added.
- **Two signings with the same name** (#1494, Astra A-TW-01, live in 2.5.1 too). Two different players who share a
  name now stay two squad entries: a later namesake gets his own id (`s|name#pid`), shots and verdicts follow the right
  man, and old saves read as before (the id is stored so older builds ignore it, #1496). No Rules change, no read or
  write added.
- **Repeated loans** (#1495, Sol S-SQ-01). A player loaned out and back many times kept one departure record per loan,
  so a fair squad could reach the Rules' 100-departure cap and LOCK was refused. Earlier finished loans of the same
  player are now folded into his latest record before the write. A LOCK that is still too big or refused says so in
  plain words instead of "session expired". No Rules change, no read or write added.
- **Story**: Volume 21, "The gold and the glove" (chapters 190 to 194), and a Listen button in the book (#1488,
  chronicle/read-aloud.js): every Story page with prose read aloud, paragraph by paragraph, in one of up to three of the
  device's own voices (speechSynthesis, no server). The Story is its own site, outside the
  game's shell. Read-aloud scrolls without animation when the device asks for reduced motion
  (gameplay/r93 d432dc07, Codex).

## Firestore Rules

- Changed (R93-08 slims only). Composed production Rules SHA-256
  `b3d4661971eb54f1489a7e445089b18b40a55a29654b7b1cceb977221b69f37c` (193,331 bytes); 2.5.1 is `2a0d029e…` (192,364
  bytes). The reviewed main delta (`tests/fixtures/composed-production-rules/main-delta.json`) names main 23bdd439 and
  lists 17 hunks. Nik gave the Rules re-pin his OK in words ("OK the 2.6.0 Rules", 2026-11-15 20:12 UTC).
- Compile probe (measure-firestore-rules-compile, compile only, nothing published): run [43757660203](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/43757660203), alternating 2.6.0 and main, 3 compiles per entry, 9 each: 2.6.0 (gameplay/r93 1b15c246) 9/9 HTTP 200 in 1.05 to 2.64 s; main 23bdd439 (2.5.1) 9/9 in 1.00 to 2.85 s. Both report the same 12 compiler warnings. Well under the 5 s compile deadline.

## Reads and writes

CE2PG single plan, 3 seasons, Firebase emulator only, firebase@12.17.0, both trees side by side on the same container on
2026-11-15 (both PASS 295/295). Billed = document reads plus Rules lookups on reads and writes, both phones.

| Season | 2.5.1 (main 23bdd439) billed / writes | 2.6.0 (gameplay/r93 1b15c246) billed / writes |
|---|---|---|
| 1 (START, pairing, setup) | 1,521 / 117 | 1,518 / 117 |
| 2 | 792 / 58 | 793 / 58 |
| 3 (final) | 542 / 28 | 562 / 28 |
| **Total** | **2,855 / 203** | **2,873 / 203** |

+18 billed (+0.6 %), all in the final season's end pages (+9 document reads, +11 Rules lookups); one run each, within
run-to-run noise. No write was added. The Fable hunt saw the same shape on dba5e75c (2,891 against 2.5.0's 2,874).

## Update safety

- The shell and service worker advance to 2.6.0-r93 in a fresh `career-mode-showdown-shell-2.6.0-r93` cache, and 2.5.1-r92 is
  retained for rollback. The retained shell is verified against its own 293 paths (`tests/fixtures/shell-paths/2.5.1-r92.json`,
  from main 23bdd439, the same list as 2.5.0's). 2.6.0 adds the V4 loading logo, the Cormorant SC Bold file and its licence, and
  removes the V3 loading logo (HO-079), so `SHELL_PATHS` holds 295 paths.
- `js/gfxTier.js` BUILD moves with the service worker's RUNTIME_REVISION, so a crash limit written by 2.5.x is dropped once on
  the first 2.6.0 load (#1473).
- The version strings are the same length as 2.5.1's, so the startup budget is unchanged.
- An installed phone takes the update on Home, never in the middle of a game screen.
- 2.5.1 and 2.6.0 phones can play each other: the Rules accept the same writes. The one new value is a later namesake's
  player id in a squad document, stored as -1-playerId so every older build reads it as "no number" (#1496, Codex on
  #1493; N8 runs the real 2.5.1 squad engine against 2.6.0). If either manager has kept two different players with the
  same name (for example two "M. Dembélé"), update both phones to 2.6.0 before the next Russian Roulette, because 2.5.1
  counts them as one player.

## Deploy order

- This release changes the Firestore Rules. The Rules deploy runs first on main, and the Pages workflow deploys the site only
  after that Rules deploy succeeded.

## What did not change

- No tiebreak anywhere. Pairing, joining and the Remote Joining protocol keep their rules (JOIN checks the same things in a
  cheaper form).
- The no-flash rules and the Reus Gate are unchanged.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- No saved Showdown is rewritten. Nothing in Firebase is deleted or edited.
- The Rule Book is unchanged: no rule a player plays by changed, and its Golden line still holds.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is `100/100`, earned on r85 (`1.9.9-r85`). No SSJR credit comes from this
source, CI or deployment, and no new physical acceptance is claimed for 2.6.0.

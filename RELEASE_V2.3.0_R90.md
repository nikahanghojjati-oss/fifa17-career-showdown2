# Career Mode Showdown 2.3.0 (r90): cut the waste, one quality ladder, 3D on the Chromebook (v2.3.0 runtime r90)

Application version: `v2.3.0`  
Runtime asset revision: `2.3.0-r90`  
Previous known-good runtime: `2.2.0-r89`

r90 is 2.3.0. Nik gave it one goal on 7 November 2026: cut the waste and put quality first, so the game runs at its best
picture on the strongest machine and stays smooth, in 3D, on his Chromebook, and never crashes on the first open. This file
is the release record. The list below is every pull request merged into gameplay/r90 since 2.2.0 went live (main 2fe8d2f5):
#1257 to #1336, 80 in all, up to gameplay/r90 ff70b7e (2026-11-09).

## What changed

- **One quality ladder for every screen** (#1260, #1271, #1284, #1291, #1311): `js/gfxTier.js` picks Light, Balanced, High,
  Extra, Ultra (4K) or 8K for each device, with Auto choosing. Settings has a 3D QUALITY row that says which level Auto
  picked; 8K is manual only and steps down if the device cannot hold it. Every 3D screen (Chamber Men, the roulette, the
  Special Player pack) and the 2D screens read the same levels; a contract keeps any screen from inventing its own.
  A device check page times each 3D screen at every level (#1266).
- **Chamber Men** (#1258, #1263, #1275, #1280, #1282, #1288, #1302, #1306, #1307, #1310, #1316, #1325, #1327, #1331): the
  yellow LEFT / MIDDLE / RIGHT words over the goal are gone; a floodlit night stadium with a club-colour crowd, ad boards
  with crests, six run-ups, varied taker reactions and a keeper in number 1. On Light it is always 3D: the stadium files are
  meshopt-packed and warmed from the season page, nothing is compiled during a kick, and the step waits for the stadium
  instead of falling back to the flat drawing. High draws in 66 calls instead of 109. Each round now costs 230 billed reads
  instead of 338 (#1331).
- **Russian Roster Roulette** (#1261, #1269, #1273, #1281, #1286, #1290, #1292, #1303, #1312, #1317, #1326, #1328): a lean
  scene warmed up behind the loading screen, no aiming that spoils the target, local fonts and Opus sounds, the room by
  quality level (dark room on Light, lamp wall at High, the café at Extra and up), a steel revolver and the club crest
  board. On Light it stays 3D: no give-up timers, an in-place restore if the graphics context is lost, and no spin before the
  scene is ready.
- **Special Player pack and Prime Pack** (#1259, #1262, #1265, #1272, #1274, #1276, #1277, #1285, #1295, #1304, #1322,
  #1323, #1324): the SP pack follows the quality ladder, loads without freezing the page, and reveals with one short gold
  burst; the Prime Pack stays 2D and is made smooth (clock ring and card shadow off the per-frame path), with its 4K stage.
- **Cut the waste** (#1264, #1289, #1293, #1305, #1309): 267 KB of dead source deleted with a guard against its return, CSS
  that never applies and an unused sheet deleted, 37 MB of finished history moved to `archive/pre-r90`, 13 unused V1 images
  and a duplicate font download dropped.
- **Home loads first** (#1268, #1278, #1283, #1313): screens a manager has not opened yet load after Home, Home's pictures
  are sized for the screen, the service worker installs a small essential shell and fetches the rest as an offline pack at
  idle, and the Shared Journey chain follows Home when no online Showdown is unfinished.
- **Look, wording and layout** (#1257, #1270, #1279, #1287, #1294, #1296-#1301, #1308, #1314, #1315, #1318, #1320, #1321):
  one kit and crest system on every screen (all 98 clubs), the W9 menu look (drawn Home icons, plain words in Settings and
  the Rule Book, Legacy, honours, Trophy Room, Club Assignment, League wheel), Season Results centred and scaled in every
  window, Final Winner without dim or flash, and the Transfer War clock and title clear of the top bar.
- **Team V rooms** (#1332 to #1335): Home on the V2 art, and the board, tunnel, League box, office, archive and slab rooms
  with the HC trophies.
- **Fixes and tests** (#1267, #1319, #1330, #1336): the sacked hints use APP_VERSION (BUG-04), and three test fixes (journey
  audit across midnight, CE2PG held records, the Transfer War contract mount race).
- **Story Edition 14** (#1329): Volume 18 "The light on the Chromebook", chapters 179 to 181.

No rule of the game changed. The Rule Book was reworded in plain words (#1297); its Chamber Men and Sacked start times
match `CHAMBER_FROM_MS` (2026-11-04T17:00Z, midday Boston) and `SACKED_FROM_MS` (2026-11-06T15:00Z, 10:00 Boston).

## Release time

r90 adds no time-gated feature: no new `*_FROM_MS` boundary since 2.2.0, so `tools/set-release-time.cjs` is unchanged and
there is no release time to set. Every change applies the moment the update reaches a phone.

## Update safety

- The shell and service worker advance to 2.3.0-r90 in a fresh `career-mode-showdown-shell-2.3.0-r90` cache, and 2.2.0-r89
  is retained for rollback. `SHELL_PATHS_ADDED_SINCE_PREVIOUS` lists the 17 files 2.3.0 adds (the quality module
  `js/gfxTier.js`, the shared Barlow Condensed and Big Shoulders Display faces and Rye, the meshopt decoder) and
  `SHELL_PATHS_REMOVED_SINCE_PREVIOUS` the 3 it drops (the app's own Barlow Condensed 600/700 copies and `js/analytics.js`),
  so the retained r89 shell is verified against its own 275 paths (`tests/fixtures/shell-paths/2.2.0-r89.json`, from main
  2fe8d2f5).
- From 2.3.0 the install precaches only the essential shell; the rest of `SHELL_PATHS` is this revision's offline pack,
  fetched at idle into the same cache. `SHELL_PATHS` stays the full list, so 2.4.0's rollback list will match this one.
- The seven acceptance-only scripts stay `ACCEPTANCE_ONLY_SCRIPT_PATHS`: they load on demand from the asking revision's
  shell, else the network.
- An installed phone takes the update on Home, never in the middle of a game screen.
- Startup budget: 33,954 bytes gzip against the 34,000 cap; the cap is unchanged by this release.
- After 2.3.0 is live, open the app on both devices and wait on Home until it reloads itself.

## Deploy order

- Rules are unchanged, so the Pages workflow's `rules-first` job finds the last Rules deploy on main succeeded and ships the
  site. No Rules compile probe is needed for this release.

## What did not change

- No tiebreak anywhere. The Remote Joining protocol and pairing stay as they were.
- The no-flash rules and the Reus Gate are unchanged.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- No saved Showdown is rewritten. Nothing in Firebase is deleted or edited.

## Firestore Rules

- Unchanged since 2.2.0: no `firestore*.rules` file changed between main 2fe8d2f5 and gameplay/r90 ff70b7e. Composed
  production Rules SHA-256 `6d410197714d4c3d906e4f5115bf5c0c45e844b7dee63911f91d9b75eb942cc3`, the hash 2.2.0 deployed,
  pinned in `js/sparkPrivatePairing.js` and `tests/fixtures/composed-production-rules/main-delta.json` (re-pinned to main
  2fe8d2f5 by d3e1e3aa).

## Reads and writes (emulator only; no production reads)

Billed = document reads + Security Rules lookups, both phones together. Spark allows 50,000 billed reads and 20,000 writes a day.

| Run | Billed reads | Writes |
|---|---|---|
| CE2PG 3 seasons, gameplay/r90 017a772 (before #1331) | 3,090 (season 1 with setup 1,638; season 2 913; season 3 539) | 202 |
| One Chamber Men round, before and after #1331 | 338 → 230 | 28 → 28 |

#1331 takes 108 billed reads off each season's Chamber Men round, so a middle season is about 805 billed after it (913 − 108),
about 60 middle seasons a day on reads. Full table: project file gameplay/r90/release/READS_PER_SEASON.md and
gameplay/r90/release/chamber-reads/.

## Story

- Edition 14, Volume 18 (#1329) was written from gameplay/r90 before #1330 to #1336. Since then only Home's art, the HC
  rooms and the Prime Pack stage art changed among the screens its numbers describe; the Chamber Men, roulette and Special
  Player pack files it measured are byte-identical. Re-measured on the Chromebook profile (walk2d, 1920x866, 4x CPU,
  8.7 Mbps), the same harness on both trees: Home at hand-over 1.76 MB → 1.62 MB with the same 58 requests, and History,
  Settings and Season Results paint costs within run-to-run noise. Nothing the Story says got worse, so its numbers stand.

## Checks

- Full contract census on the release head (336 registered contracts, 4 parallel lanes): 336/336 pass. Eight failed only
  in parallel (the four that need this release file, two that write the generated Rules file, and the two career-load-gate
  timing contracts) and pass when run alone.
- Startup gzip 33,954 bytes (cap 34,000).

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is `100/100`, earned on r85 (`1.9.9-r85`) by the 2026-10-29 two-device production
run. No SSJR credit comes from this source, CI or deployment, and no new physical acceptance is claimed for 2.3.0.

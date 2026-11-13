# Career Mode Showdown 2.4.0 (r91): Squad Management, the full FIFA 17 player list, handcrafted words and type (v2.4.0 runtime r91)

Application version: `v2.4.0`  
Runtime asset revision: `2.4.0-r91`  
Previous known-good runtime: `2.3.0-r90`

r91 is 2.4.0. Nik set its three ideas on 9 November 2026: a new Squad Management screen that mirrors each manager's FIFA 17
save, a Transfer War name box that suggests players from the full FIFA 17 launch list, and handcrafted wording and type on
every screen. This file is the release record. The list below is every pull request merged into gameplay/r91 since 2.3.0
went live (main a85d286a): #1351 to #1439, 89 in all, up to gameplay/r91 9aa3baee (2026-11-13).

> **Both phones must update to 2.4.0 before a Transfer War.** A 2.3.0 phone rejects a 2.4.0 phone's Transfer War reveal
> (the new `playerId` on a picked signing), so open the game on both phones and wait on Home until it reloads itself
> before starting or continuing a season.

## What changed

- **Squad Management, a new screen** (#1358, #1372, #1376, #1392, #1436): twice a season, after Chamber Men and again after
  the Transfer War (not after the last season's Transfer War), each manager sets his Starting XI in a formation (all 33
  FIFA 17 formations, searchable), 7 substitutes and the reserves, as in his own FIFA 17 save. The XI and the first 4
  substitutes are the 15 on his Russian Roulette board. Season 1 is the club's FIFA 17 launch squad; from season 2 he marks
  departures and sets overalls, and the best players always make the 15. Each lock is one create-only document per manager
  per screen. A finger drag works on phones, each club side draws one shirt image, and the bug hunt's three Squad rows are
  fixed: a namesake no longer blocks LOCK, a bought-back signing rejoins, and the rival's Special Player is refused.
- **Transfer War** (#1365, #1383, #1393, #1412): start typing a name and the game suggests players from the full FIFA 17
  launch list (17,597 players, 224 free agents, one lazy 296 KB file fetched only on Transfer War or Squad Management, never
  on Home). A pick fills his position and nationality, and in season 1 his overall and previous league; any other name can
  still be typed. A picked signing carries his SoFIFA id (`playerId`), Kyrgyzstan and Sudan join the nationality list,
  LOCK refuses a player shot or guessed earlier again, and the rules card reads right after you lock.
- **Prime Pack** (#1387, #1388): six look fixes (suggestions, opening, long names, low timer, back button, title), and the
  list holds each player once, with his highest-rated card (232 players, 84 to 98).
- **Chamber Men 3D** (#1354, #1359, #1362, #1363, #1368, #1370, #1375, #1377, #1385): pitch, crowd, net, keeper and
  shadow rounds, vibrant stands, the keeper reacts after his dive and no longer flips, the camera slides after the strike,
  one framing through the dissolve, no pop from the still run-up, kit numbers on striped backs, and a clear waiting LOCK IN.
- **Roulette and Special Player pack 3D** (#1351, #1353, #1367, #1369, #1371, #1373): scene rounds 1 to 12, one 4-minute
  start budget for both roulette scene tries, desktop boards high enough for the sub names, and the SP pack's r89 yellow
  stadium, nation flags, far beams and floor sparkles back, with nothing over the card.
- **Quality, speed and crash safety** (#1378, #1384, #1389, #1395, #1398, #1399, #1409, #1415, #1423, #1427): the start-up
  splash minimum is 1.5 s (was 2.7 s); the Device check pages are published and a level counts only when all three 3D
  screens proved it; heavy scene parts load step by step between beats; the buffer cap holds from a scene's first
  allocation; weak devices get Ultra and 8K only after a passed Device check, and a tab that dies opening a 3D screen opens
  one level down next time; the level guide ("Your device" card, the level table with real pictures, and the Auto pick
  shown in Settings).
- **Touchline Gazette** (#1374, #1390, #1394, #1396): squad news (departures and reported overalls), the paper is prepared
  before the tap so it always prints, "From the commentary box" in every paper, and CONTINUE fits at 1920x866.
- **Rule Book** (#1391, #1397, #1410, #1411, #1413): eleven cards in the order a manager meets each step, written for a
  first-time reader, with no dates; Squad Management and the autocomplete are on it; BACK TO HOME no longer floats over
  the text on tablets; flat dark card faces, no crown or glow.
- **Wording and type** (#1355, #1357, #1361, #1364): one plain word list on every screen group (errors, Home, Final Winner,
  Career, pairing, Settings, League and Club, Transfer War, Prime Pack, Roulette, Season Results), a 12 px floor, and the
  Settings heading font.
- **Art: handcrafted titles and rooms** (#1400, #1401, #1404, #1405, #1406, #1414, #1416, #1417, #1418, #1419, #1421,
  #1422, #1426, #1428, #1429, #1430, #1433, #1434, #1435, #1438): one handcrafted title family on every screen, no crown or
  kicker above titles, no gold glow at rest, flat dark slabs behind stats numbers, current rooms at every window shape,
  the front hall, the coaches room for Squad Management, the HC V3 relit rooms, the Home crowd, the brass wheel, Team V's
  layered Reus cover, a draw that reads SHOWDOWN DRAW, Final Winner without crown or halos, and the league icons back on
  the wheel.
- **Layout** (#1403, #1407, #1408, #1420, #1424, #1425, #1432, #1437): the Chromebook 1920x866 window (Trophy Room
  plaques, Career Statistics, Season Review), the draw Final Winner, Legacy with 10 seasons, 740x360 sideways phones,
  phone and tablet faces with a face check for every manager screen in the Gate, and room for the SP chips on Final
  Winner.
- **Old-era cut** (#1356, #1366, #1379, #1386, #1402): the release-time gates, the CMS_* off switches and the release-time
  tool are gone (every gated feature behaves as on); History & Backup, the backup and restore file tools and the Save
  Library editor are gone; the three unpublished Rules drafts, the old update bootstrap, the Stage 5F page and the old
  acceptance tools are gone. The finished r79 Showdown is pinned on every career screen as a golden fixture first.
- **Hunt fixes** (#1439): a lost start-up file reloads once by itself and then shows the black-and-gold THE GAME DID NOT
  START screen with RELOAD; Rivalry Statistics asks once more after a close; the Gazette reads the squad sheets at the
  same time; when both roulette spins of a season were made on 2.3.0, a phone updated in the middle of that season skips
  its first Squad screen, and the Squad wait tells the manager to update the rival's phone; the extra reads per season
  were traced to the longer season and run noise.
- **Test tools** (#1360, #1380, #1381, #1431): the fault-injection journey plays Chamber Men and names the Prime Pack
  player, CE2PG reads the r91 wording and has a new-device mode, and the journey helper names what stops a LOCK tap.
- **Story** (#1352, #1382): the novel rewrite applied to chronicle/ (181 chapters), the 2.3.0 dispatch, hero art, the
  12 px floor and the nav.

No rule of an existing step changed. Squad Management is a new step between Chamber Men and the roulette, and again
after the Transfer War; its rules are on Rule Book card 04.

## Release time

r91 adds no time-gated feature, and has none left to set. The old-era cut (#1356) deleted `tools/set-release-time.cjs`
and every `*_FROM_MS` release gate (roulette, Prime Pack, Chamber Men, Sacked, own-club Special Player now always on). The
only dates left in the runtime are historical facts, not gates: `MARQUEE_FROM_MS` (no Special Player before r86) and the
`careerStartMarker` r79/r80 times that keep the finished r79 Showdown in History. Every change applies the moment the
update reaches a phone.

## Update safety

PART_B_PENDING: filled by the version bump (service worker revision, retained 2.3.0-r90 shell, added and removed sets,
startup gzip).

## Deploy order

- **Rules change in this release, so they deploy first.** The Pages workflow's `rules-first` job deploys the new Rules
  before the site. A 2.3.0 phone keeps working on the 2.4.0 Rules (every change only adds an optional field, two
  nationalities or a new collection), but a 2.3.0 phone cannot read a 2.4.0 rival's signing row with `playerId`: hence
  the bold note at the top.

## What did not change

- No tiebreak anywhere. The Remote Joining protocol and pairing stay as they were.
- The no-flash rules and the Reus Gate are unchanged.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- No saved Showdown is rewritten. Nothing in Firebase is deleted or edited.

## Firestore Rules

- Changed since 2.3.0, three additions only (the reviewed main delta, `tests/fixtures/composed-production-rules/main-delta.json`,
  owners R91-SQUAD, R91-SIGNING-ID, R91-NATIONALITIES):
  - `rivalries/{rid}/squadSheets/{sheetId}`: get for the two paired managers, create only by the sheet's own manager with
    the exact 21-key shape, no list, update or delete;
  - the optional `playerId` (int 1 to 999999) on a Transfer War signing row;
  - Kyrgyzstan and Sudan in the nationality pattern (catalog 164 to 166).
- Composed production Rules SHA-256 `237f867bade1ad244c92d1b8ab041a588fabd9e68485f7ee47dded4de939f7ab` (191,531 bytes,
  138 validators localized), rebuilt here from gameplay/r91 9aa3baee and equal to the pin in `js/sparkPrivatePairing.js`
  and the main-delta fixture. 2.3.0 deploys `6d410197…` (188,177 bytes).
- Compile probe (`.github/workflows/measure-firestore-rules-compile.yml`, compile only, nothing published), on
  gameplay/r91 9aa3baee, 2026-11-13:

  | Run | 2.4.0 Rules | 2.3.0 Rules (main) |
  |---|---|---|
  | [43415023826](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/43415023826) | 3,606 / 3,299 / 3,790 ms (3/3) | 1,488 / 1,525 / 1,382 ms (3/3) |
  | [43415205564](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/43415205564) | 3,103 / 2,063 / 1,837 ms, and again after main: 2,129 / 1,865 / 1,975 ms (6/6) | 1,943 / 2,355 / 2,178 ms (3/3) |

  Every compile is well under the 5 s deadline (slowest 3.79 s). The first run's gap to main did not repeat in the
  second, where the same 2.4.0 file compiled after main in 1.87 to 2.13 s: it is the service's run-to-run swing, which the
  playbook warns about, not the three additions.
- Emulator lifecycle on these Rules (the composed 2.4.0 Rules, meter `Rules sha256 237f867bade1ad24`), gameplay/r91
  9aa3baee: CE2PG 3 seasons **289/289**, every Squad sheet, signing and season commit accepted, the Showdown closed with the
  right winner; CE2PG 1 season **186/186**; `tests/firebase/squad-sheets-rules-emulator.cjs` 5/5 (only the named manager
  creates his sheet, no update, delete or list, an outsider cannot read) and
  `tests/firebase/shared-gameplay-provider-lifecycle-emulator.cjs` (3 seasons on the generated Rules) PASS.

## Reads and writes (emulator only; no production reads)

Billed = document reads + Security Rules lookups, both phones together (CE2PG meter, waits off). Spark allows 50,000
billed reads and 20,000 writes a day. Full table: project file gameplay/r91/measure/READS_WRITES_2.4.0.md.

| Length | 2.3.0 billed / writes | 2.4.0 billed / writes | Where measured |
|---|---|---|---|
| 1 season | 1,110 / 86 | 1,095 / 85 | side by side, main a85d286a and gameplay/r91 9aa3baee |
| 3 seasons | 2,896 and 2,718 / 202 | 2,884 and 2,829 / 203; 2,818 / 203 on 9aa3baee | #1439, and this release head |
| 10 seasons | 9,304 / 608 | 9,823 / 614; 10,131 / 614 after #1439 | paired runs (reads thread), and #1439 |

Squad Management costs 26 billed reads and 4 writes in a middle season (42 and 6 in season 1, none in the last). Middle
seasons average 863 billed on 2.3.0 and 901 on 2.4.0 in the paired 10-season runs; the rest of the difference is the
existing 15 s progression poll running over a season with two more screens, inside run-to-run noise (#1439). About 49 to
51 seasons a day on reads.

## Story

- The 2.4.0 volume (Volume 19) is its own job (gameplay/r91/release/STORY_V19_BRIEF.md). Its numbers come from this
  release's measured figures.

## Checks

- Full contract census on gameplay/r91 9aa3baee (340 registered contracts, 4 parallel lanes): **340/340 pass**, 334 in
  the lanes and 6 alone (4 that the lane script skipped, and two career-load-gate timing contracts that failed in
  parallel); `r87-career-load-gate-browser` passes alone, and
  `r87-career-load-gate-edges` (G-06, two tabs at once) passes 2 of 3 alone. G-06 also fails 3 of 3 on 2.3.0 (main
  a85d286a) in the same container, so it is this machine's timing, not a 2.4.0 change. The Gate is the judge.
- Startup gzip 33,997 bytes before the version bump (cap 34,000).
- Rule Book (js/ruleBook.js) checked against the code for every r91 change a player sees: Squad Management (XI, 7
  subs, the 15 = XI + subs 1-4, no visit after the last Transfer War: `js/squadSheet.js`, `js/squadSheetStep.js`), the
  autocomplete (17,597 players, free agents included: `data/fifa17/players-170002.manifest.json`), the Prime Pack list
  (232 players, 16 + 103 + 26 + 69 + 18, pinned by job-1048), and the rival Special Player LOCK refusal (card 02). The
  Gazette squad news, the level guide and THE GAME DID NOT START screen are screen text, not Rule Book rules.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is `100/100`, earned on r85 (`1.9.9-r85`) by the 2026-10-29 two-device production
run. No SSJR credit comes from this source, CI or deployment, and no new physical acceptance is claimed for 2.4.0.

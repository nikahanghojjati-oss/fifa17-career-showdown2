# Career Mode Showdown 2.2.0 (r89): Sacked, Chamber Men 3D and Studio Small Axe (v2.2.0 runtime r89)

Application version: `v2.2.0`  
Runtime asset revision: `2.2.0-r89`  
Previous known-good runtime: `2.1.0-r88`

r89 is 2.2.0. It adds Sacked on Season Results, the Chamber Men 3D broadcast penalty with three.js r187 and the RRR polish,
and the next Studio Small Axe screens, plus fixes found on the live 2.1.0. This file is the release record. The feature list
below is gameplay/r89 at the freeze (94438bee, 2026-11-06).

## What changed

- Sacked (#1246): on Season Results each manager can tick only his own "I was sacked this season", and PUBLISH asks once
  more (YES, I WAS SACKED · PUBLISH). Any sacking ends the Showdown after that season. The points so far decide the winner,
  and equal totals are a DRAW. A sacked Showdown is a completed Showdown: it counts on History, Legacy, the Trophy Room and
  every stats screen, marked SACKED, and never goes into the hidden "ended early" pile. Screen order is unchanged (Results,
  Final Winner, Gazette). It runs for Showdowns confirmed at or after the 2.2.0 release time; an older Showdown shows no tick.
  `tools/set-release-time.cjs --r89` sets the r89 start constants (`SACKED_FROM_MS`); contract r86-release RR7 checks them.
  Release time: **set at merge**.
- Chamber Men 3D (#1244): a broadcast penalty camera behind the taker with taker and keeper on screen, a stadium with crowd
  and ad boards, the taker in his manager's club kit and the keeper in a kit that never clashes (Kits 17, all 98 clubs).
  If the stadium or players cannot arrive in time the hall scene plays, and without WebGL2 the drawn goal plays.
- The Russian Roster Roulette and Chamber Men move from three.js r128 to r187, with the RRR polish (#1235) and every RRR label
  naming the action of its beat (#1245). Chamber Men's late pick is fixed (#1247).
- Rules headroom (#1250): the season-10 Terminal Progress write drops from about 929 to 804 of the 1,000-expression budget
  (823 when sacked), with every allow/deny unchanged.
- Studio Small Axe 2.2.0 (all eleven drafts): the 12px desktop type floor (#1226), the score settle (#1227), the designed
  waiting state (#1228), panels and even spacing (#1229), the Golden Showdown light sweep (#1230), the Rule Book and Season
  Results finishes (#1231), Showdown Home boards in marble (#1218), the desktop Settings layout (#1221), the History list
  view with Go to # and four filters (#1223), Legacy filling its empty pane (#1217) and the phone pass (#1241); plus the 4K
  page-title wordmarks (#1249).
- Story Edition 13 and the Rule Book with Sacked and Chamber Men 3D (#1251); the STORY page scrolls on phones (#1252); the
  Prime Pack fairness contract is seeded (#1253).

## Update safety

- The shell and service worker advance to 2.2.0-r89 in a fresh `career-mode-showdown-shell-2.2.0-r89` cache, and 2.1.0-r88
  is retained for rollback. `SHELL_PATHS_ADDED_SINCE_PREVIOUS` lists the files 2.2.0 adds and
  `SHELL_PATHS_REMOVED_SINCE_PREVIOUS` the ones it drops, so the retained r88 shell is verified against its own 270 paths
  (`tests/fixtures/shell-paths/2.1.0-r88.json`, from main e6485d7d). Both lists are re-derived at the freeze.
- The seven acceptance-only scripts stay `ACCEPTANCE_ONLY_SCRIPT_PATHS`: they load on demand from the asking revision's
  shell, else the network.
- An installed phone takes the update on Home, never in the middle of a game screen.
- Startup budget: the startup gzip cap moves from 33910 to 33913 bytes (lead OK 2026-11-04 18:10 UTC). The new
  `2.2.0-r89` pins are as long as the old ones but gzip 3 bytes larger (js/menuExperience.js +2, js/app.js +1); no code changed.
- After 2.2.0 is live, open the app on both phones and wait on Home until it reloads itself.

## Deploy order

- Rules first, then the site. The Pages workflow's `rules-first` job holds the site until this commit's Rules deploy
  succeeded. Old Rules refuse a result that carries `sacked`.
- Before "merge r89": the Rules compile probe (`.github/workflows/measure-firestore-rules-compile.yml`) must show 3/3
  compiles well under 5 s on the release head.

## What did not change

- No tiebreak anywhere. The Remote Joining protocol and pairing stay as they were.
- The no-flash rules and the Reus Gate are unchanged.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- No saved Showdown is rewritten. Nothing in Firebase is deleted or edited.

## Firestore Rules

- Composed production Rules SHA-256 `6d410197714d4c3d906e4f5115bf5c0c45e844b7dee63911f91d9b75eb942cc3` (188,177 bytes):
  2.1.0's Rules plus Sacked (#1246) and the headroom trim (#1250). Pinned in `js/sparkPrivatePairing.js`,
  `tests/fixtures/composed-production-rules/main-delta.json` and the billed-reads table.
- Compile probe (`measure-firestore-rules-compile.yml` run 42149876668 on gameplay/r89 1e6489a8, Rules unchanged since):
  3/3 at 2,776 / 2,640 / 2,991 ms; live main in the same run 3/3 at 3,181 / 3,079 / 2,886 ms.

## Reads and writes (emulator CE2PG on gameplay/r89 1e6489a8; nothing that reads or writes Firestore changed after it)

Billed = document reads + Security Rules lookups, both phones together. Spark allows 50,000 billed reads and 20,000 writes a day.

| Run | Result | Billed reads a season | Writes a season |
|---|---|---|---|
| 10 seasons, Chamber Men every season, play pace | 467/467 | 1,072 (season 1 with setup 2,094; middle 986) | 61 |
| 3 seasons, Nik sacked in season 2 | 242/242, ends after season 2 | 1,709 then 515 | 117 then 27 |
| 3 seasons, real waits priced (slow / mid / fast) | 72/72, budget gate PASS | middle season 1,119 / 1,079 / 1,059 | 57 |

So the reads allow about 45-47 middle seasons a day (about 39-41 averaged over a 3-season Showdown with setup); a season
takes 57-136 minutes, so the clock runs out first. 2.2.0 costs about 60% more than r86 (~670 billed a season), mostly
Chamber Men's rounds. Full table: project file gameplay/r89/measure/READS_WRITES_2.2.0.md.

## Checks

- Contract census on the release head: see the release-items PR (#1248).

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is `100/100`, earned on r85 (`1.9.9-r85`) by the 2026-10-29 two-device production
run. No SSJR credit comes from this source, CI or deployment, and no new physical acceptance is claimed for 2.2.0.

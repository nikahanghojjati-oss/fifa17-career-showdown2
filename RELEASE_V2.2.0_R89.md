# Career Mode Showdown 2.2.0 (r89): Sacked, Chamber Men 3D and Studio Small Axe (v2.2.0 runtime r89)

Application version: `v2.2.0`  
Runtime asset revision: `2.2.0-r89`  
Previous known-good runtime: `2.1.0-r88`

r89 is 2.2.0. It adds Sacked on Season Results, the Chamber Men 3D broadcast penalty with three.js r187 and the RRR polish,
and the next Studio Small Axe screens, plus fixes found on the live 2.1.0. This file is the release record. The feature list
below is the 2.2.0 queue; it is confirmed against the merged tree at the r89 freeze.

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
  naming the action of its beat (#1245).
- Studio Small Axe 2.2.0 screens, as picked by Nik: the History list view with Go to # and four filters, the desktop Settings
  layout, and the wave 2 and 40/40 screen finishes that pass their gallery.

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

- Composed production Rules SHA-256: filled in at the freeze from the release head (Sacked, #1246, re-pins it).

## Checks

- Filled in on the release PR from the exact release head.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is `100/100`, earned on r85 (`1.9.9-r85`) by the 2026-10-29 two-device production
run. No SSJR credit comes from this source, CI or deployment, and no new physical acceptance is claimed for 2.2.0.

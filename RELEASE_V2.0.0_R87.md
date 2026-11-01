# Career Mode Showdown 2.0.0 (r87): Russian Roster Roulette, the Touchline Gazette, Commentary v3 and a full polish (v2.0.0 runtime r87)

Application version: `v2.0.0`  
Runtime asset revision: `2.0.0-r87`  
Previous known-good runtime: `1.9.10-r86`

r87 is 2.0.0, the biggest release so far. It ships only after a smooth 10-season Showdown on the emulator and Nik's own check
on real phones once it is live. The player-facing notes are in `gameplay/r87/RELEASE_NOTES_2.0.0.md` (release-notes branch);
this file is the release record.

## What changed

- Russian Roster Roulette before every season's transfer window, the same spin on both phones, saved online; the window opens
  only after both managers spun (#1069, #1080, #1101, #1107, #1112, #1147, #1148). It runs for Showdowns confirmed at or after
  the 2.0.0 release time (`RRR_FROM_MS` = `ROULETTE_FROM_MS`, set by `tools/set-release-time.cjs`).
- Transfer window: signing overall and position, official 2016-17 league names, Deadline Day finish.
- The Touchline Gazette after each season and a final edition (#1094, #1110, #1116).
- Commentary v3 on Season Results and below the Final Winner stage (#1126).
- Career screens: History opens on the newest Showdown and moves fast through hundreds; career fixes (#1103, #1120, #1135).
- Polish of start screens, match-day, scenes, error and offline screens, transitions, music player and first load
  (#1111, #1118, #1122, #1123, #1130, #1134, #1137, #1139, #1140).
- Reads: shared reads meter and accounting, Fable job 3 read fixes (#1097, #1114, #1133, #1144, #1145).
- Red-team and Fable fixes (#1104, #1105, #1146, #1147, #1148).

## Update safety

- The shell and service worker advance to 2.0.0-r87 in a fresh `career-mode-showdown-shell-2.0.0-r87` cache, and 1.9.10-r86
  is retained for rollback. `SHELL_PATHS_ADDED_SINCE_PREVIOUS` lists the files 2.0.0 adds and
  `SHELL_PATHS_REMOVED_SINCE_PREVIOUS` the seven acceptance-only scripts it no longer precaches (arch audit D1), so the
  retained r86 shell is verified against its own 228 paths (`tests/fixtures/shell-paths/1.9.10-r86.json`).
- An installed phone takes the update on Home, never in the middle of a game screen (#1125 proof).
- A phone still on 1.9.10 refuses 2.0.0 transfer data and fails closed until it updates on Home. After 2.0.0 is live, open
  the app on both phones and wait on Home until it reloads itself.

## Deploy order

- Rules first, then the site. The Pages workflow's `rules-first` job holds the site until this commit's Rules deploy
  succeeded. Old Rules refuse the new spin marks, the roulette/spins record and Prime Pack rounds.

## What did not change

- No tiebreak anywhere. The Remote Joining protocol and pairing stay as they were.
- The no-flash rules and the Reus Gate are unchanged.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- No saved Showdown is rewritten. Nothing in Firebase is deleted or edited.

## Firestore Rules

- Composed production Rules: filled in on the release PR from the exact release head (re-pin of #1097, #1101, #1148,
  #1147 and Prime Pack).

## Checks

- Filled in on the release PR from the exact release head.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is `100/100`, earned on r85 (`1.9.9-r85`) by the 2026-10-29 two-device production
run. No SSJR credit comes from this source, CI or deployment, and no new physical acceptance is claimed for 2.0.0.

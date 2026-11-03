# Career Mode Showdown 2.1.0 (r88): Chamber Men, the STORY tile and the Studio Axe polish (v2.1.0 runtime r88)

Application version: `v2.1.0`  
Runtime asset revision: `2.1.0-r88`  
Previous known-good runtime: `2.0.0-r87`

r88 is 2.1.0. It adds Chamber Men in front of the Russian Roster Roulette, the STORY tile on Home and the Studio Axe UI
polish, plus fixes found on the live 2.0.0. This file is the release record.

## What changed

- Chamber Men before every season's Russian Roster Roulette: a 7-shot penalty shootout, and each goal a manager scores loads
  one live round into the rival's cylinder. The roulette then has one pull per season with 0 to 7 live rounds instead of one
  bullet (#1205, Team V art #1207). New Rules match `rivalries/{rid}/chamberMenRounds/season_N`. It runs for Showdowns
  confirmed at or after the 2.1.0 release time; a Showdown confirmed before it keeps one bullet, exactly as 2.0.0 plays it.
  `tools/set-release-time.cjs --r88` sets Chamber Men's start constants; contract r88-chamber-men checks them.
  Release time: **set at merge**.
- STORY tile on Home, after Trophy Room, opening the Chronicle site (`chronicle/`), which the service worker never answers
  for or caches (#1193, Team V art #1208).
- Studio Axe UI polish, phases 1 to 7 (#1194, #1196, #1197, #1198, #1199, #1200, #1201, #1203), including Showdown Home
  showing both managers' scores side by side.
- Fixes: Terminal Close shows a plain notice when the connection drops (#1202); Season Results scoring help says 15 points a
  season (#1204); the step panels' BACK buttons (#1206); the fault-injection test's Prime Pack points (#1188); the CE2PG
  observer (#1210).

## Update safety

- The shell and service worker advance to 2.1.0-r88 in a fresh `career-mode-showdown-shell-2.1.0-r88` cache, and 2.0.0-r87
  is retained for rollback. `SHELL_PATHS_ADDED_SINCE_PREVIOUS` lists the three files 2.1.0 adds (Chamber Men's step, rules
  and styles) and `SHELL_PATHS_REMOVED_SINCE_PREVIOUS` is empty, so the retained r87 shell is verified against its own 267
  paths (`tests/fixtures/shell-paths/2.0.0-r87.json`, from main 00ae2b72).
- The seven acceptance-only scripts that 2.0.0 stopped precaching (arch audit D1) are now `ACCEPTANCE_ONLY_SCRIPT_PATHS`:
  they still load on demand from the asking revision's shell, else the network, and are no longer counted as removed.
- An installed phone takes the update on Home, never in the middle of a game screen.
- After 2.1.0 is live, open the app on both phones and wait on Home until it reloads itself.

## Deploy order

- Rules first, then the site. The Pages workflow's `rules-first` job holds the site until this commit's Rules deploy
  succeeded (it waits up to 45 min). Old Rules refuse the Chamber Men rounds.

## What did not change

- No tiebreak anywhere. The Remote Joining protocol and pairing stay as they were.
- The no-flash rules and the Reus Gate are unchanged.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- No saved Showdown is rewritten. Nothing in Firebase is deleted or edited.

## Firestore Rules

- Composed production Rules SHA-256 `887b7e758ba6929d911ca92b18b3621fb53219a287e2666892ce91b4949a3a64` (175,666 bytes):
  2.0.0's Rules (`4520bfda...`, main 00ae2b72) plus Chamber Men's rounds (#1205). Pinned in `js/sparkPrivatePairing.js`,
  `tests/fixtures/composed-production-rules/main-delta.json` and the billed-reads table.

## Checks

- So far: a 10-season CE2PG with Chamber Men passed 467/467 and a 3-season CE2PG 281/281 on gameplay/r88 ce0e5d4b.
- The rest is filled in on the release PR from the exact release head.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is `100/100`, earned on r85 (`1.9.9-r85`) by the 2026-10-29 two-device production
run. No SSJR credit comes from this source, CI or deployment, and no new physical acceptance is claimed for 2.1.0.

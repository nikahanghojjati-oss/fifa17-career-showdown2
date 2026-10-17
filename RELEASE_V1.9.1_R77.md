# Career Mode Showdown — r76b: real career start marker and close-race fix (v1.9.1 runtime r77)

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r77`  
Previous known-good runtime: `1.9.1-r76`

The owner calls this small release r76b. The runtime revision has to be a number, so it is r77 in the code. The
visual release the owner calls r77 will use the next runtime number.

## What changed

- START REAL CAREER (owner decision, 2026-10-16). Settings has a one-time START REAL CAREER row. Before the first
  real game each manager presses it once on their own account. From then on History, Career Statistics, Trophy Room,
  Legacy and Rivalry Statistics count only Showdowns started after the press. Earlier test Showdowns are hidden, not
  deleted, and SHOW TEST SHOWDOWNS AGAIN brings them back. The hidden list is read once, with no extra reads per
  Showdown.
- Close race. When both managers close the final season at the same moment, the Rules now refuse the losing stale
  write plainly instead of failing at the Rules evaluation limit. The loser re-reads and carries on, as in r76.
- A release check (JOB-1841) proves that Showdowns saved by earlier releases still open on this one.
- The runtime revision moves to r77.

## What did not change

- The scoring formula, game rules, the fewer-taps flow and Remote Joining stay as they were.
- The no-flash rules, the Reus Gate, preload, decode and startup order are unchanged. Startup stays within its gzip budget.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- No saved Showdown is rewritten. Without a marker every screen behaves exactly as in r76.
- The shell and service worker advance to r77, and r76 is retained for rollback.

## Firestore Rules

- Rules change: one owner-only permission for `accounts/{uid}/careerStart/current` (the start marker), and the Terminal
  Close stale-write check rewritten so it stays under the evaluation limit. The zero-billing Rules deploy runs on merge.

## Checks

- Filled in on the release PR from the exact release head.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No
SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r76b.

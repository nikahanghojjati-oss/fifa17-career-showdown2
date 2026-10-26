# Career Mode Showdown — r84: plain wording, Golden Showdown, far fewer Firebase reads (v1.9.8 runtime r84)

Application version: `v1.9.8`  
Runtime asset revision: `1.9.8-r84`  
Previous known-good runtime: `1.9.7-r83`

r84 builds on r83. The application version moves to 1.9.8 and the runtime revision to r84.

## What changed

- Plain wording on the gameplay screens and the Rule Book (for example SPIN WHEEL, CONFIRM SEASON, SHOWDOWN HQ).
- Rule Book: you can sign players up to the transfer deadline. FIFA 17 player training is allowed in 5- and 10-season
  Showdowns, but not in 1- or 3-season ones.
- Golden Showdown: a manager who scores 110 in a 10-season Showdown (11 in every season) gets a gold trophy in the Trophy
  Room and gold mentions in Career Stats, Rivalry Stats and Legacy.
- Settings shows FREE ONLINE USE TODAY and SEASONS LEFT TODAY. The per-season cost is measured on the device at the pace
  played.
- Firebase reads: waiting screens listen instead of re-reading every 15 s. The transfer and results screens listen
  while open. Settled setup and Career Start documents are kept. Context copies are kept 5 min while a healthy listener
  watches. The between-seasons loop and dead-listener fresh reads are fixed. A read brake slows an unknown loop when nobody
  taps. The emulator budget test measured about 2,000-2,700 billed reads per season (doc reads plus Rules lookups, both
  devices), down from 4,500-8,300.
- Partner END SHOWDOWN is seen within 45 s on a waiting screen.

## Update safety

- The shell and service worker advance to r84 in a fresh `career-mode-showdown-shell-1.9.8-r84` cache, and r83 is retained
  for rollback.

## What did not change

- The scoring formula and Remote Joining protocol stay as they were. No stored document shape changes.
- The no-flash rules, the Reus Gate, preload and decode are unchanged.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- No saved Showdown is rewritten. Nothing in Firebase is deleted or edited.

## Firestore Rules

- No Rules change.

## Checks

- Filled in on the release PR from the exact release head.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No
SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r84.

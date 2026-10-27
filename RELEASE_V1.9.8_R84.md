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

## Correction (2026-10-27, independent audit F05)

The "Firestore Rules" section above says "No Rules change." That is wrong for r84 (PR #1002). The text above is kept as
originally written; this section is the correction.

What PR #1002 changed in the Rules, exactly:

- `firestore.spark.rules` and `firestore.stage5c.rules` (identical in this PR): reads and the Session offer `get` now use
  a new `livePairedRivalryMember` check (one rivalry lookup) instead of `activePairedRivalry` plus the two account
  lookups; `currentlyEntitled` checks `signedIn()` instead of `activeActor()`; `sessionCanRead` uses
  `livePairedRivalryMember` and `resource == null` instead of a second `exists()`.
- `firestore.shared-setup-production.fragment.rules`: `ssjrEntitled` uses `livePairedRivalryMember`;
  `ssjrWriteAuthorityValid` no longer looks up the two account documents or the device document on every write (two
  lookups per write instead of five); a new `ssjrBothAccountsActive` check runs once when a Shared Setup opens.
- `scripts/build-production-firestore-rules.mjs` (the build guard): updated to match the new Rules text.

Net effect: fewer Rules lookups, but account and device liveness are now checked at Session start and Shared Setup open
instead of on every read or write. This is a real change to the deployed Rules.

Rollback: rolling the app back through the service-worker cache (r83 shell is retained) does NOT roll back the Rules.
Firestore Rules are published separately and stay at whatever was last published. Rolling back only the app leaves r83
code running against the r84 Rules. The coherent rollback pair is the r84 app together with the r84 generated Rules,
i.e. the build of `scripts/build-production-firestore-rules.mjs` at r84 main commit
`cd7df26ed57e4d9dfa40d88042d25a71fcb47a6c`. Rebuilt on 2026-10-27 at that commit, `firestore.spark.generated.rules` is
126,689 bytes with SHA-256 `36d58d21147004f3c768cdadb219c4617f78d0c312b74207b6606844cc98b131` (the same hash at
`5b0ab3ee`, the #1002 merge). The independent audit recorded 156,903 bytes and
`686c87f432be7371a595ec7822ffd7f2bbc12f5ad809296abaed636785ed94b4` for the same commit; that value did not reproduce
from this repository, so the rebuilt value above is the one to compare against until the two are reconciled. The
pre-r84 (r83, commit `186af266`, the parent of #1002) generated Rules hash to
`456f2b159bf3b025b374dc0c24ca7504f42ec7c4aeeff17293cb9a18b4e5d915`.

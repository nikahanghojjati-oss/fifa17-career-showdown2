# Golden fixture: one finished r79 Showdown (old-era cut, step 0)

Nik's finished Arsenal v Burnley game was played on r79 (October 2026). On 2026-11-11 at 08:34 UTC Nik chose to keep its
History row exactly as it is. The old-era cut must never change how that game reads on any career screen.

The real game lives only in production Firestore, which no automation reads. This folder holds a game with the same shape,
written by the r79 build itself:

- `export/`: a Firebase emulator export (auth + Firestore). The r79 two-player journey
  (`tests/browser/r79-two-player-journey-audit.cjs` at r79 commit `d1888c339a62742bac66607e4c8004b0af64d74e`) played one
  1-season Showdown to the end. Daniel won 9-3 with Málaga, Nik had Real Betis. The run stopped after P7, where both phones read
  Career Statistics (1 completed), the Trophy Room (Showdown Champion: Daniel) and Legacy (Showdown #1, Daniel wins).
  The data was then exported.
- The Setup confirm time (`rivalries/{id}/sharedSetup/authoritative.updatedAt`) was set to `2026-10-25T18:00:00Z`.
  That is the r79 era, like Nik's game, so the confirm time is before `MARQUEE_FROM_MS` (2026-10-30 03:00 UTC) and the game
  has no Special Player. Without this change, an emulator game played today would carry today's time, and r86+ would draw
  a Special Player for it, which Nik's game never had. Nothing else was changed.
- `make-fixture-on-r79.patch`: the local-only change to the r79 journey that stops after P7, sets that confirm time and writes
  the export. It talks straight to the emulators, because the firebase-tools export goes through the container's proxy. To
  make the fixture again: check out r79, apply the patch, then run the journey with `R79_STOP_AFTER_P7=1`
  and `R79_EXPORT_DIR=<dir>`, using the emulators:exec command at the top of the journey file.
- `golden.json`: every career figure read from this fixture on gameplay/r91 with the cut steps applied (#1393, #1379,
  #1386). It covers both managers on Career Statistics, the Trophy Room, History (Legacy), Rivalry statistics, Standings
  and Settings. Figures are numbers, statuses, holders and the History row. Text is kept apart: wording changes are listed,
  never failed.

## Run it

```
# On the build being tested: every figure must equal golden.json
CE2PG_PLAN=golden CE2PG_IMPORT=tests/fixtures/r79-finished-game/export \
  CE2PG_GOLDEN_EXPECT=tests/fixtures/r79-finished-game/golden.json node tests/browser/ce2pg-journey.cjs

# The update from live 2.3.0: read on 2.3.0 first, then switch the server to this tree, drop the service worker and
# caches, reload, and every figure must be the same as before (and equal golden.json)
CE2PG_PLAN=golden CE2PG_IMPORT=tests/fixtures/r79-finished-game/export CE2PG_UPGRADE_FROM=<2.3.0 checkout> \
  CE2PG_GOLDEN_EXPECT=tests/fixtures/r79-finished-game/golden.json node tests/browser/ce2pg-journey.cjs
```

Every read also checks the same fixed things on both phones:
- History holds exactly one finished Showdown, and Daniel won it.
- Career Statistics shows 1 completed Showdown, with Daniel as Showdown Champion.
- No career page shows a Special Player chip.
- No Showdown is in progress.
- Both phones read the same figures.

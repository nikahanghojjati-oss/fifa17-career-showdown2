# Career Mode Showdown v1.9.1 — Runtime r50

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r50`  
Previous known-good runtime: `1.9.1-r49`

## What was fixed

r50 removes the remaining places where Nik or Daniel had to tap a button twice. Every tap now either does what it says or shows why it could not.

### Setup: league wheel, club packs, confirm

**Cause.** r49 stopped the Setup adapter from dropping taps during background refreshes, but two silent cases were left in `js/productionSharedShowdownPresentation.js`:

1. **Stale view.** A tap was decided from this device's last view of Setup. If authority had moved on (for example, the Setup was already open but this device had not yet seen it), the first tap only refreshed. The second tap then did the real work.
2. **Rejected write.** If a write was rejected, the tap ended silently and the button came back enabled. A second tap then succeeded.

**Fix.**
- The tapped button shows `WORKING…` right away and stays disabled until the tap finishes.
- When the view was stale or the write was rejected, the same tap re-reads authority once and acts on the fresh state.
  - This cannot duplicate a draw. Every Setup transition is phase-guarded, so a write that already landed shows up as the next phase on the re-read, and the tap does not repeat it.
- If the retry is also rejected, the status line says `THAT TAP DID NOT GO THROUGH · <code> · TAP AGAIN`. The notice clears when authority changes.
- A tap that arrives while the automatic season-length lock is being written waits for that write to finish instead of being refused.

### Career Start, Transfer Challenge and Season Results: first open

**Cause.** The first time each screen opens, it downloads its runtime scripts and reads authority, which can take several seconds on a phone. Nothing changed on screen meanwhile, so the tap looked ignored, and a second tap started a second, overlapping open.

**Fix.**
- `CONTINUE TO CAREER START`, the Showdown Home transfer action and `ENTER SHARED SEASON RESULTS` / `CONTINUE TO SHARED SEASON RESULTS` show `OPENING …` and are disabled while the screen loads.
- Overlapping opens share one attempt.

### Regression test

`tests/browser/shared-showdown-polished-presentation-audit.cjs` now covers:
- a spin tap on a stale empty view: one tap must re-read authority and spin, with exactly one `open` attempt and one league commit;
- a club-pack write rejected once: one tap still commits the clubs;
- a confirm rejected twice: exactly one bounded retry, then a visible failure code, then a working next tap.

This audit fails on r49.

## Intentionally unchanged

- **Shared Season Commit check.** `CHECK SHARED SEASON COMMIT` / `RETRY COMMIT CHECK` still re-reads first. Committing the season stays a separate, explicit tap.
- **Transfer replay.** A device that missed Transfer phases still replays them in order.

## What did not change

- Firestore Rules, provider authority, the scoring formula and canonical local storage behaviour are unchanged.
- Private Remote Joining and paired manager authority are unchanged.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r50, and r49 is retained for rollback.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.0 remains at `0/100` until a validated two-device production run is recorded. No SSJR credit comes from this source, CI or deployment.

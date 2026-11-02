# Career Mode Showdown v1.9.1 — Runtime r49

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r49`  
Previous known-good runtime: `1.9.1-r48`

## What was fixed

r49 fixes two problems Nik and Daniel reported from real devices on 2026-09-28: taps that had to be repeated, and repeated recovery errors when resuming an old Showdown.

### Taps needed twice (league wheel, club packs, confirm)

**Cause.** `js/productionSharedShowdownSetup.js` marked Setup as busy during every refresh. Many modules run those refreshes: the presentation polls every 2.5 s, and Results, Commit, Reconnect and Multi-Season each read Setup inside their own checks. `mutate()` answered any tap that arrived during a refresh with `SHARED_SETUP_BUSY`. It did this silently, so the button looked enabled and nothing happened.

**Fix.**
- Refreshes coalesce into one read.
- A tap now waits for an in-flight refresh and then performs exactly one write.
- A refresh that starts during a write returns the current state instead of racing the write.
- Only a genuinely overlapping second tap is refused, so no duplicate write can happen.
- Multi-Season **Continue to Season N** also waits for an in-flight refresh instead of dropping the tap.
- Regression test: `tests/contracts/shared-setup-no-dropped-taps-contracts.cjs` runs the real Setup adapter with a slow background refresh. It fails on r48.

### Repeated recovery errors when resuming

**Cause.** After the 4-hour private session expired and was reconnected, the Shared Journey reconnect check failed with `JOURNEY_RECONNECT_PROGRESSION_NOT_AUTHORITATIVE`. That check re-runs every 15 s, and each failure raised a new error notice. The real reason sat in the Multi-Season progression read, but that read did not expose it.

**Fix.**
- The reconnect error now names the underlying Multi-Season failure code.
- Each distinct failure is reported once, not every 15 s.
- The Multi-Season refresh likewise reports each distinct failure once, and exposes its last code.

The underlying progression failure after a session change still needs to be identified from that surfaced code. r49 makes it diagnosable instead of spamming a generic message.

## What did not change

- No Firestore Rules, provider authority, scoring formula or canonical local storage behaviour changed.
- Private Remote Joining and paired manager authority are unchanged.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r49, with r48 retained for rollback.

## SSJR status

SSJR-1.1 remains frozen at `0/100`, and SSJR-2.0 remains at `0/100` until a validated two-device production run is recorded. No SSJR credit comes from this source, CI or deployment.

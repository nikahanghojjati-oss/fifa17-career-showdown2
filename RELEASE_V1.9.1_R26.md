# Career Mode Showdown v1.9.1 — Runtime r26

Status: RELEASE CANDIDATE

Application version: `v1.9.1`

Runtime asset revision: `1.9.1-r26`

Previous known-good runtime: `1.9.1-r25`

Runtime r26 restores a permanent player-facing update control in Settings.

The Offline App panel now always renders `UPDATE TO LATEST VERSION` when no verified update is already waiting. Pressing it actively asks the registered service worker to check GitHub Pages for a newer application shell. If a complete newer worker reaches the waiting state, the existing safe activation path applies it only from Home or Showdown Home and reloads through the verified shell boundary.

When an update is already downloaded and waiting, the same control changes to `APPLY READY UPDATE`.

This closes the r24/r25 UX dead end where the update button disappeared unless the browser had already surfaced a waiting service worker. The control does not clear local storage, does not delete a Showdown, does not alter player identity, and does not bypass the verified-shell cache checks.

The existing recovery model remains intact. r25 is retained as the previous runtime for rollback. Firebase remains Spark-only, Billing remains permanently OFF, App Check enforcement remains OFF, and this release requires no Cloud Functions, Cloud Run, or Rules expansion.

Historical Remote Joining engineering provenance remains repository-only; this updater repair does not reintroduce provider architecture language into the normal player-facing shell.

The r25 unified Daniel/Nik first-play flow is unchanged by this hotfix.

SSJR-1.1 remains exactly `0/100`. Source, CI, deployment and updater UX do not substitute for the required two-device physical journey.

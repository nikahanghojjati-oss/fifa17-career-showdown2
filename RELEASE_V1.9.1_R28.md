# Career Mode Showdown v1.9.1 — Runtime r28

Status: RELEASE CANDIDATE

Application version: `v1.9.1`

Runtime asset revision: `1.9.1-r28`

Previous known-good runtime: `1.9.1-r27`

Runtime r28 closes the final player-facing handoff after Shared Setup confirmation.

The r27 single-season-choice flow remains unchanged:
- Daniel chooses 1 / 3 / 5 / 10 seasons exactly once when starting the Showdown.
- Nik joins Daniel's Showdown and inherits the season plan automatically.
- After the authoritative league and club draw, the same season plan is automatically committed.
- Neither manager receives a second season-selection decision.
- The local season plan must match the season encoded in the paired rivalry capability before authoritative commitment.

After both Daniel and Nik confirm the identical Shared Showdown, the existing club-assignment control now becomes an active `CONTINUE TO CAREER START` button instead of a disabled ready state. The action is enabled only while the exact private session remains live; stale or expired session authority changes the control to `RECONNECT PLAYERS TO CONTINUE` and blocks Career Start until connection authority is restored. Pressing the live action loads the production Shared Career Start module directly, deactivates the setup presentation, and opens the assigned-club Career Start screen on that device.

This removes the need to reopen the entry overlay or discover a hidden route after setup confirmation.

Settings retains the persistent `UPDATE TO LATEST VERSION` control. r27 remains the rollback shell.

Historical Remote Joining engineering provenance remains repository-only; normal player-facing flow remains Daniel/Nik specific.

Firebase remains Spark-only. Billing remains permanently OFF. App Check enforcement remains OFF. No Cloud Functions, Cloud Run, paid tier, or Rules expansion is introduced.

SSJR-1.1 remains exactly `0/100` until a fresh real two-device physical journey passes. Automated source, browser, deployment, and production evidence do not replace that physical acceptance.

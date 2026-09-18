# Career Mode Showdown v1.9.1 — Runtime r25

Status: RELEASE CANDIDATE

Application version: `v1.9.1`

Runtime asset revision: `1.9.1-r25`

Previous known-good runtime: `1.9.1-r24`

Runtime r25 collapses the first-play journey to one player-facing flow:

1. Daniel chooses the season length and starts the Showdown.
2. Daniel receives one connection code and sends it to Nik.
3. Nik presses JOIN DANIEL'S SHOWDOWN, pastes Daniel's code, and joins.
4. Nik is never asked to start another Showdown or choose the season length.
5. The app silently provisions Nik's matching local career shell from Daniel's season-bearing connection code before redeeming the same provider rivalry.
6. Once both managers are connected, the shared career proceeds to the league wheel.

Daniel remains Player One and Nik remains Player Two. The Home primary action is now role-specific: Daniel sees START A SHOWDOWN; Nik sees JOIN DANIEL'S SHOWDOWN.

Daniel creates a season-bound one-use provider capability: the capability itself deterministically identifies the selected 1/3/5/10 season plan while retaining secure random entropy. The player-facing code only wraps that exact provider rivalry id, so the season plan survives Daniel reloads and cannot be edited independently from the Firebase capability. Nik's automatic local shell is an implementation detail and does not create a second online Showdown.

The r24 OLD SHOWDOWN FOUND recovery remains intact. DELETE OLD SHOWDOWN & START OVER still revalidates recovery before and after confirmation, and RESTORE BACKUP remains available for a real local backup.

Production Firestore Rules remain the exact published r23/r24 provider authority already read back successfully. r25 requires no Rules expansion, no Cloud Functions, no Cloud Run, no paid infrastructure, and no billing change. Firebase remains Spark-only with Billing permanently OFF and App Check enforcement remains OFF.

Historical engineering provenance, including Remote Joining and Shared Journey internals, remains repository-only and is not exposed as a normal player mode.

SSJR-1.1 remains exactly `0/100`. Source, CI, deployment and this UX/runtime repair do not earn physical-journey credit; only a passing fresh two-device physical journey can change it.

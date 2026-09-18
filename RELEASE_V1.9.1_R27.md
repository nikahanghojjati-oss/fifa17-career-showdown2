# Career Mode Showdown v1.9.1 — Runtime r27

Status: RELEASE CANDIDATE

Application version: `v1.9.1`

Runtime asset revision: `1.9.1-r27`

Previous known-good runtime: `1.9.1-r26`

Runtime r27 completes the single-season-choice first-play flow.

Daniel chooses the Showdown season length exactly once when he starts the Showdown. That value remains bound to the Showdown shell and to the season-bearing Nik join capability. After the shared league and club draw, the production presentation automatically commits the same existing 1 / 3 / 5 / 10 season value through the already-reviewed authoritative `commit-length` transition.

Neither Daniel nor Nik receives a second season-selection decision after the club reveal. Before automatic commitment, the runtime derives the season encoded in the paired `rivalryId` capability and requires an exact match with the local Showdown's `totalRounds`. The final setup panel only reports the already-selected season plan. Both devices fail closed instead of confirming if their local season plan ever disagrees with paired/provider authority.

The r25/r26 unified player journey remains intact:
1. Daniel starts one Showdown and chooses the season length.
2. Daniel creates the player code for Nik.
3. Nik joins Daniel's Showdown and automatically provisions the matching local recovery shell.
4. Daniel hosts one private play session and Nik joins it.
5. Both devices enter the shared league wheel.
6. Daniel coordinates the authoritative league and club draw.
7. Daniel's original season choice is committed automatically.
8. Both managers confirm the identical setup and continue the same shared career.

Settings retains the permanent `UPDATE TO LATEST VERSION` control introduced in r26. No Showdown data is cleared or rewritten by the updater.

The production smoke harness also ignores only the exact Chromium-generated `requestStorageAccess: Permission denied.` privacy diagnostic on GitHub Pages. The repository does not call `requestStorageAccess`.

Historical Remote Joining engineering provenance remains repository-only; normal player-facing screens keep the simplified Daniel/Nik language.

Firebase remains Spark-only. Billing remains permanently OFF. App Check enforcement remains OFF. This release requires no Cloud Functions, Cloud Run, paid tier, or Rules expansion.

SSJR-1.1 remains exactly `0/100` until the required fresh two-device physical journey passes. Source, CI, deployment, and automated browser proofs do not substitute for that physical evidence.

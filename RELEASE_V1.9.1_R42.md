# Career Mode Showdown v1.9.1 — Runtime r42

Application version: `v1.9.1`
Runtime asset revision: `1.9.1-r42`
Previous known-good runtime: `1.9.1-r41`

r42 is the physical-transfer repair release based on the 2026-09-20 Chromebook + iPhone acceptance run.

The Shared Transfer Challenge restores the working three-field signing contract on compact/mobile layouts. Every signing exposes player name, previous FIFA 17 league, and nationality as distinct usable fields. Both enhanced league/nationality selectors remain independently visible instead of one selector collapsing into the row-number column.

Private Guess Entry again enforces the original safe ordering: the guess value is disabled until the manager first chooses League or Nationality. Choosing the type activates the matching canonical FIFA 17 selector; clearing/changing the type clears stale selector authority so an invalid type/value combination cannot be locked.

The transfer provider continues to enforce the repository-owned exact FIFA 17 league and nationality catalogs. Firestore Rules retain bounded slug-shaped transfer-ID validation instead of expanding all 200 catalog entries into repeated exact-membership expressions. This avoids the production Rules evaluation-budget failure seen with the real maximum payload while the provider rejects IDs outside the exact repository catalog.

The permanent gameplay lifecycle now exercises the real maximum Transfer Challenge payload on every supported Showdown length: three guesses plus three signings for Daniel and three guesses plus three signings for Nik. It also verifies the actual rival-guess release verdicts, not only phase completion.

Remote Joining remains the private session transport. Journey Reconnect now stays dormant during an ordinary healthy ACTIVE session when no recovery history exists. Normal Transfer Challenge play therefore does not poll Multi Season progression or surface `JOURNEY_RECONNECT_PROGRESSION_NOT_AUTHORITATIVE`. When a private session genuinely expires, the existing recovery flow still exposes `RECONNECT SESSION`; a fresh ACTIVE session can reauthorize the same durable rivalry without redrawing league/clubs or resetting accepted seasons.

Canonical scoring/history verification is strengthened. Every lifecycle asserts exact season scores, the season winner/tiebreak result, cumulative Daniel/Nik Showdown points after every accepted season, season W/D/L records, trophy attribution, fixed clubs, next-season cursor, and the final winner derived from accumulated canonical points. The player-facing Season Review continues to show the current canonical season score separately from Shared History's Overall accumulated totals and lead.

The generated lifecycle remains required for 1, 3, 5 and 10 seasons. The 10-season path still expires the original private session after Season 5 and continues Seasons 6–10 under a fresh four-hour session with the same rivalry and fixed clubs.

Firebase remains Spark-only. Billing remains permanently OFF. Cloud Run and Cloud Functions remain unused. App Check enforcement remains OFF. No public discovery, lobby, matchmaking or rankings are introduced.

SSJR-1.1 remains exactly `0/100`; automated, source, emulator and deployment evidence do not count as physical two-device acceptance.

Physical iPhone + Chromebook acceptance remains the final human gate after r42 production publication.

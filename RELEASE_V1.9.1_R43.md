# Career Mode Showdown v1.9.1 — Runtime r43

Application version: `v1.9.1`
Runtime asset revision: `1.9.1-r43`
Previous known-good runtime: `1.9.1-r42`

r43 is a no-regression full-journey bug-hunt release based on the live r42 production baseline. It fixes two bounded player-facing defects without changing shared scoring, history, provider schema or Firestore Rules.

The one production defect found was a mobile foreground timing edge case in the Shared Transfer Challenge. The server-authoritative 15-minute deadline was already enforced correctly, but a suspended/backgrounded mobile browser could temporarily display stale remaining time after returning to the foreground if its monotonic browser clock had paused. r43 scopes a fresh server-time-anchor refresh to a live `WINDOW_OPEN` whenever the page returns to the foreground, then immediately refreshes Shared Transfer authority. Guess Entry, Signing Entry and completed phases do not invalidate the clock unnecessarily.

A direct 390px mobile browser regression now simulates two server minutes elapsing across a foreground transition and requires the displayed countdown to resynchronize near the corresponding remaining time. Existing Transfer coverage continues to prove League/Nationality guess ordering, stale-value clearing, independent Previous League and Nationality signing controls, private inputs, exact release verdicts, and maximum three-guess/three-signing payloads for both managers.

The second defect was an online-surface authority mismatch: retired local-era Legacy, Career Statistics and Rivalry Statistics entry points could remain visible even though Shared Showdown deliberately leaves canonical local analytics storage untouched. Those local-only controls are now contained from the online player surface so they cannot display stale or empty local numbers beside provider-authoritative Shared History. Rule Book remains available, and current-season/overall shared score, manager records and trophy attribution remain visible through Shared Season Review/History.

The full investigation rechecked sign-in, Daniel/Nik player identity, Forget This Device, persistent pairing, Remote Joining, four-hour private-session expiry and reconnect, Shared League Wheel, permanent club assignment, Daniel's original 1/3/5/10 season plan, dual Career Start acknowledgement, Transfer, Season Results, immutable dual publication, coordinator commit, dual acknowledgement, canonical scoring, accumulated history/trophies/records, multi-season progression, Final Reconciliation and Terminal Close.

One proof-only defect was corrected: the Shared Season Commit browser fixture had retained inverted display names even though production authority already enforces Daniel = Player One and Nik = Player Two. The fixture now matches the production identity contract.

Canonical scoring remains unchanged: Champions League +5, league title +3, domestic cup +1, one maximum performance bonus point from 100 league points and/or 100 league goals, and one maximum individual-awards bonus point from Top Scorer and/or Top Assist. A tied season uses league position and then league points; equal accumulated final Showdown points remain a draw, matching the rulebook's season-specific tiebreak wording.

History remains reconstructed from the ordered acknowledged Season Commit documents and canonical scoring, so browser-local totals are not trusted. Fixed clubs, accepted-season order, cumulative Daniel/Nik points, W/D/L records, trophies and the final winner remain reproducible after reload or a fresh private session.

The four-hour Remote Joining capability remains replaceable without replacing the durable rivalry. The existing 10-season lifecycle still expires the original private session after Season 5 and resumes Seasons 6–10 under a fresh exact session without redrawing league/clubs or resetting accepted history. The 3-season production-Rules lifecycle additionally replaces the private session after Daniel publishes Season 1 but before Nik publishes, and again after the Season 2 coordinator commit but before acknowledgements, proving mid-Results and mid-Commit recovery without losing accepted state.

This release does not change Firestore Rules, provider schema or billing architecture. The already-published r42 production Rules remain authoritative. Firebase remains Spark-only. Billing remains permanently OFF. Cloud Run and Cloud Functions remain unused. App Check enforcement remains OFF. No public discovery, lobby, matchmaking or rankings are introduced.

SSJR-1.1 remains exactly `0/100`; automated, source, emulator and deployment evidence do not count as physical two-device acceptance.

Physical Chromebook + iPhone acceptance remains the final human gate after r43 client publication.

# Career Mode Showdown v1.9.1 — Runtime r33

Application version: `v1.9.1`
Runtime asset revision: `1.9.1-r33`
Previous known-good runtime: `1.9.1-r32`

This hotfix repairs the physical Career Start blocker observed after both managers successfully reconnected on r32. The browser Career Start provider no longer freezes an unavailable Shared Setup provider at module evaluation time. Shared Setup protocol and provider authority are also explicitly loaded before the Career Start provider.

The confirmed league, permanent clubs and Showdown length are preserved. Once Daniel and Nik each confirm that their assigned FIFA 17 career has started, the existing shared flow continues into the authoritative 15-minute Transfer Challenge, private guesses and signings, Shared Season Results, Season Commit, canonical scoring and history, and the fixed 1 / 3 / 5 / 10 multi-season progression.

No Showdown reset, club redraw, local save replacement, billing change or Firestore Rules change is introduced. Firebase remains Spark-only, Billing remains permanently OFF, and exactly two private managers remain required.

# Career Mode Showdown v1.9.1 — Runtime r37

Application version: `v1.9.1`
Runtime asset revision: `1.9.1-r37`
Previous known-good runtime: `1.9.1-r36`

Physical two-device testing showed that a 30-minute exact private session is still too short for comfortable real gameplay testing. The private-session authority is created before setup/Career Start and must remain valid while both managers move through shared gameplay, so an ordinary test should not be racing a short authorization clock.

r37 raises the bounded exact private-session lifetime to four hours:
- default private-session TTL: 4 hours;
- maximum permitted private-session TTL: 4 hours;
- production Firestore Rules permit at most the same four-hour window;
- sessions remain exact-capability, two-account, account/device/rivalry bound, non-listable and memory-only;
- expiry still fails closed, and the r36 fresh-session recovery path remains intact if four hours is ever exceeded.

This does not make sessions permanent and does not weaken the private authority model. Existing rivalry, confirmed league, permanent clubs, Career Start acknowledgements, Transfer Challenge state, season results and canonical local saves are not reset by the lifetime change.

The older physical screenshots also showed `TRANSFER_SETUP_NOT_CONFIRMED` after the authority had expired. That message came from the Transfer Challenge being unable to re-verify the confirmed Shared Setup under an expired exact session; it was not evidence that the Bundesliga/Freiburg/Hertha setup had been erased.

Remote Joining remains private and exact-path only. Firebase remains Spark-only, Billing remains permanently OFF, Cloud Run and Cloud Functions remain unused, and App Check enforcement remains OFF. SSJR-1.1 remains exactly `0/100`; physical acceptance credit still requires successful completion on the real iPhone + Chromebook journey.

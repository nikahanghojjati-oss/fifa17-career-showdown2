# Career Mode Showdown v1.9.1 — Runtime r36

Application version: `v1.9.1`
Runtime asset revision: `1.9.1-r36`
Previous known-good runtime: `1.9.1-r35`

Physical two-device testing exposed a private-session expiry boundary during the Shared Transfer Challenge. Daniel could start the authoritative 15-minute transfer window while the exact private session was close to its own 15-minute expiry; seconds later the session authority expired. Daniel retained the freshly rendered live countdown while Nik could no longer refresh the provider state, producing a split screen plus `FRESH PRIVATE SESSION REQUIRED` and a secondary `JOURNEY_RECONNECT_PROGRESSION_NOT_AUTHORITATIVE` report.

r36 fixes that boundary without altering the rivalry or gameplay state:
- default exact private-session lifetime is extended from 15 to the already-supported 30 minute maximum, so setup + Career Start + a full 15-minute transfer window can fit inside one normal session;
- an expired page-memory session no longer blocks hosting or joining a fresh exact session for the same rivalry;
- Remote Joining visibly marks a clock-expired held capability as EXPIRED and disables stale copy/close/revoke actions;
- Journey Reconnect rechecks the session after progression verification and converts an expiry race into the intended `FRESH_SESSION_REQUIRED` recovery state instead of a generic progression error.

The authoritative Transfer Challenge document is not reset, duplicated or redrawn. Existing pairing, confirmed league, permanent clubs, Career Start acknowledgements and transfer state remain preserved.

Remote Joining engineering provenance remains repository-only. Firebase remains Spark-only, Billing remains permanently OFF, Cloud Run and Cloud Functions remain unused, and App Check enforcement remains OFF. SSJR-1.1 remains exactly `0/100`; physical acceptance credit still requires the real two-device journey to complete.

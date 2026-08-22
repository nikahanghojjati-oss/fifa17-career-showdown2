# START NEXT SESSION — v1.4.4 — Post Stage 3 Production Pairing → Stage 4

SLE = Smart Lean Efficient.

You are continuing the FIFA 17 Career Mode Showdown PWA for owner Hawk / `nikahanghojjati-oss`.

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Authoritative successor orientation: `SUCCESSOR_HANDOFF_POST_STAGE3_PRODUCTION_PAIRING_SLE_2026-08-21.md`.
Compact current override: `CURRENT_STAGE3_PRODUCTION_OVERRIDE_2026-08-21.md`.
Production proof: `PRODUCTION_STAGE3_PRIVATE_PAIRING_PROOF_2026-08-21.md`.

Before substantial work, independently fetch live `main`, current source, recent PRs, workflow/review state and deployed site. Read `SESSION_BOOTSTRAP.json`, the SLE/WEC authorities and RJR-1. Treat the predecessor `HANDOFF_NOW` decision as closing-environment-only: archive it, initialize a fresh successor WEC with reset counters and run your own assessment.

Production baseline is v1.6.0 / `1.6.0-r1`, Stage 3 Registered Devices / Private Pairing production-proven. PR #129 source sealed at `e3f462306e1d2b0822aaf54eb1f9dc9af62ed4f8` and squash-merged as `5d254cea6e4deebd2aac79effeda30dcc3048385`. RJR-1 is `69/100`.

Do not repeat Firebase project setup, Google Auth setup, App Check setup, Stage 2 self-account Rules publication or Stage 3 Rules publication. App Check enforcement remains OFF. Firebase Spark / zero billing, memory-only Firestore, popup-only session Google Auth, canonical storage locks, exactly-two-manager rules and eliminated public/community/ranking surfaces all remain mandatory.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

The next distinct product milestone is Stage 4 Connected Rivalry. If the fresh WEC says CONTINUE, implement the smallest coherent shared-authoritative-rivalry-state slice by reusing the protected deterministic revision/CAS/idempotency/tombstone/offline-reconnect contracts and authorizing only the exactly two already-paired accounts/devices. Preserve local-first recovery. Do not implement actual Remote Joining session orchestration; that remains Stage 5.

Some older current-facing documents still contain candidate-era v1.6.0 wording. Reconcile only the minimum current override sections necessary to prevent future loops; preserve historical provenance and do not reopen completed provider work.

Standing owner merge/deploy authorization remains effective only after all required tests and current mandatory publication gates pass. Never use that standing authorization to bypass a failed source, provider, deployment or production-proof gate.

Every substantive owner-facing response must end with the exact seven-line footer required by the SLE handoff. At Handoff proximity 100%, package a complete successor handoff and stop before the next substantial milestone.
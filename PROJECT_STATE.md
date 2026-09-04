# CURRENT OVERRIDE — STAGE 5F PRODUCTION NEGATIVES ACCEPTED / RJR91 / STAGE 5G ACTIVE

Current independently verified production implementation checkpoint before this evidence transition is main `7c140a1593bfc84fcf3b42e6eec3eb50c9a262e4`, after merged PR #190. Application/runtime remain `v1.9.0 / 1.9.0-r5`. The PR #190 GitHub Pages build and deploy succeeded. Runtime gameplay identity did not change.

Owner production evidence on 2026-09-04 closes both Stage 5F authenticated negative boundaries. Sanitized record: `PRODUCTION_STAGE5F_AUTHENTICATED_NEGATIVES_ACCEPTANCE_2026-09-04.md`.

Fixed RJR-1 is **91/100** with domain vector:

- deterministic sync and recovery safety: 20/20
- identity, authentication, authorization and trust: **20/20**
- production cloud and security activation: 20/20
- devices, pairing, Connected Rivalry and actual Remote Joining: 22/30
- real-device hardening and stable release: 9/10

The +2 from 89 is exactly two new production authorization capabilities: revoked-device protected-mutation provider denial (+1) and authenticated unrelated-account exact private-read denial (+1). No process, implementation, CI, deployment or repeated-proof credit is included.

## Current lane

Stage 5G: Remote Joining-specific two-device/two-network reconnect and adverse-network hardening. Automate deterministic/runtime/browser/emulator evidence first. Owner interaction is required only when genuine physical-device/network evidence cannot be simulated or otherwise proven.

After that lane is genuinely evidence-complete, the explicit remaining milestone is final stable Remote Joining release acceptance.

## Protected baselines and permanent locks

The Installable Offline App remains the local-first startup/recovery baseline. v1.3.0 Recovery & Device Resilience and Local Profiles / Save Library remain protected. Canonical local storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`.

Billing is permanently forbidden and Firebase remains Spark. App Check enforcement remains OFF. Firestore browser persistence remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes. Cloud Run and Cloud Functions remain forbidden because they require billing under this architecture. Trusted-runtime IAM remains unactivated/unbroadened.

Candidate A is non-mutating; Candidate B is read-only; Candidate C remains the sole destructive remote-to-local gameplay Apply authority with strict exact raw snapshot and transaction-owned rollback. Exactly two private managers remain mandatory. No public discovery/listing/lobby/matchmaking/community/rankings/global leaderboards. Never durably retain full private pairing/session capabilities. The protected historical rivalry must not be used for destructive testing.

Historical project-state overrides remain available through versioned prior handoffs and repository history; this current override intentionally replaces stale inline state.

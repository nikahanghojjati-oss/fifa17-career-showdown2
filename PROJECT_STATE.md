# CURRENT OVERRIDE — PR #194 / STAGE 5H PRODUCTION-PROVEN / RJR91 / STAGE 5I RELEASE CANDIDATE v1.9.1-r2

Status: RELEASE CANDIDATE / NOT PRODUCTION-PROVEN

Authorized product candidate: `v1.9.1 / 1.9.1-r2` on PR #194. Candidate status: NOT PRODUCTION-PROVEN. Production remains independently verified `v1.9.1 / 1.9.1-r1` on live main `65399fc2f214d3bbdf3ef47fb47428c8b34d2017`; `1.9.1-r1` is the previous known-good whole shell and rollback target until the r2 candidate is merged and independently proven live.

The accepted Stage 5F production boundary remains sealed and credited exactly once: production denies revoked-device protected mutation and denies authenticated unrelated-account exact private reads. Those two accepted negatives already account for the fixed RJR91 boundary and must not be repeated or re-credited.

PR #192 Stage 5G established same-capability recovery after ambiguous Host/Join/Close acknowledgement loss. PR #193 Stage 5H then proved real-browser offline/online transitions across two isolated Chromium contexts: no provider mutation while offline, exactly one session and one Host/Join/Close mutation after recovery, active revision 1, terminal revision 2, extra online events without duplicate mutation, unchanged canonical local Save storage, and no paid-service dependency. Exact-head and deployed-site browser suites passed.

Stage 5H is intentionally zero-credit under fixed RJR-1 because two browser contexts are not two physical devices on two independent networks. Fixed RJR-1 remains `91/100` with domain vector:

- deterministic sync and recovery safety: 20/20
- identity, authentication, authorization and trust: 20/20
- production cloud and security activation: 20/20
- devices, pairing, Connected Rivalry and actual Remote Joining: 22/30
- real-device hardening and stable release: 9/10

No source, test, review, CI, merge, deployment, release-version, documentation, WEC or repeated-proof credit is included. A score increase requires genuinely new accepted Remote Joining-specific capability evidence.

Current Work Environment Continuity (WEC) execution authority remains `we-2026-09-04-stage5g-reconnect-recovery`; the same active environment has advanced through Stage 5H into Stage 5I. Its current working branch is `stage5i/physical-acceptance-recorder-2026-09-05`. The predecessor `we-2026-09-04-pr191-publication-stage5g` remains immutable archived transition provenance.

## Current lane

Finish PR #194 / Stage 5I `v1.9.1 / 1.9.1-r2` exact-head automation, review, expected-head merge, post-merge validation and deployed-byte/runtime proof. Stage 5I adds an explicit `?rjr-acceptance=1` physical-acceptance recorder designed to automate the final evidence capture while keeping normal production unchanged.

The recorder is page-memory-only, performs no recorder network or localStorage writes, never exports raw account ID, registered device ID, rivalry ID or full private session capability, and correlates the same 256-bit session only by SHA-256 fingerprint. It records sanitized Remote Joining state/revision/pending action, real browser online/offline events, timestamps, coarse device facts and owner-entered device/network labels. The startup budget remains protected at 163072 raw / 37499 compressed initial bytes without raising any threshold.

Only after r2 is independently production-proven should owner interaction be requested for genuinely physical two-device/two-independent-network behavior that automation cannot substitute. The intended minimal acceptance is Chromebook on Wi-Fi plus iPhone on cellular, producing two sanitized JSON evidence files. After that boundary is genuinely evidence-complete, final stable Remote Joining release acceptance and evidence-based RJR-1 reconciliation remain the explicit last lane toward genuine RJR100.

## Protected baselines and permanent locks

The Installable Offline App remains the local-first startup/recovery baseline. The v1.3.0 Recovery & Device Resilience baseline and Local Profiles / Save Library remain protected. Canonical local storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`.

Billing is permanently forbidden and Billing must never be activated. Firebase remains Spark. App Check enforcement remains OFF. Firestore browser persistence remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes. Cloud Run and Cloud Functions remain forbidden because they require billing under this architecture. Trusted-runtime IAM remains unactivated/unbroadened.

Candidate A is non-mutating; Candidate B is read-only; Candidate C remains the sole destructive remote-to-local gameplay Apply authority with strict exact raw snapshot and transaction-owned rollback. Exactly two private managers remain mandatory. No public discovery/listing/lobby/matchmaking/community/rankings/global leaderboards. Never durably retain full private pairing/session capabilities. The protected historical rivalry must not be used for destructive testing.

Historical project-state overrides remain available through versioned prior handoffs and repository history; this current override intentionally replaces stale inline state.

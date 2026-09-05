# CURRENT OVERRIDE — PR #194 / STAGE 5H PRODUCTION-PROVEN / RJR91 / STAGE 5I PHYSICAL ACCEPTANCE RECORDER — 2026-09-05 UTC

Status: ACTIVE PR #194 STAGE 5I RELEASE CANDIDATE / NOT PRODUCTION-PROVEN

Canonical capability provenance: STAGE 5F accepted production negatives → RJR91 → STAGE 5G two-device/two-network reconnect/adverse-network hardening → STAGE 5H automated real-browser proof → STAGE 5I physical acceptance recorder.

Authorized release candidate: `v1.9.1 / 1.9.1-r2` on PR #194. Production remains independently proven `v1.9.1 / 1.9.1-r1` on main `65399fc2f214d3bbdf3ef47fb47428c8b34d2017`; `1.9.1-r1` is the previous known-good whole-shell recovery target until r2 is merged, deployed and independently proven.

PR #192 Stage 5G and PR #193 Stage 5H are complete. Stage 5H added real Playwright browser offline/online Host, Join and Close recovery across two isolated contexts, with one exact capability/session, zero provider mutation while offline, bounded online-event recovery, active revision 1, terminal revision 2, no duplicate mutations and unchanged canonical local Save storage. The full main-push Chromium lane and deployed-site journey passed. This is strong automated adverse-network evidence but does not satisfy the fixed RJR-1 requirement for two physical devices on two independent networks, so fixed RJR remains `91/100`.

Stage 5F production acceptance remains PASS in `PRODUCTION_STAGE5F_AUTHENTICATED_NEGATIVES_ACCEPTANCE_2026-09-04.md`. The fixed domain vector remains 20/20 deterministic sync and recovery, 20/20 identity/auth/trust, 20/20 production cloud/security, 22/30 devices/pairing/Connected Rivalry/Remote Joining, and 9/10 real-device hardening/stable release.

The predecessor Work Environment Continuity record `we-2026-09-04-pr191-publication-stage5g` is already closed and archived with `HANDOFF_NOW`. It is immutable historical transition provenance. Current active environment: `we-2026-09-04-stage5g-reconnect-recovery`. Do not initialize another successor WEC while this environment remains active and coherent.

Current environment: `we-2026-09-04-stage5g-reconnect-recovery`
Starting independently verified live main: `65399fc2f214d3bbdf3ef47fb47428c8b34d2017`
Working branch: `stage5i/physical-acceptance-recorder-2026-09-05`
Current pull request: `#194`
Current exact candidate runtime: `v1.9.1 / 1.9.1-r2`
Current production runtime: `v1.9.1 / 1.9.1-r1`
Current production main: `65399fc2f214d3bbdf3ef47fb47428c8b34d2017`

The Installable Offline App, v1.3.0 Recovery & Device Resilience baseline, Local Profiles / Save Library and all canonical local-first/Candidate C guarantees remain protected.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

1. Finish PR #194 exact-head validation for Stage 5I `v1.9.1 / 1.9.1-r2`. The acceptance recorder is explicit-query-only (`?rjr-acceptance=1`), page-memory-only, and must remain unloaded/invisible during normal production navigation.
2. Keep the recorder privacy boundary strict: no recorder network writes, no localStorage writes, no raw account/device/rivalry identifiers, and no raw private session capability in exported evidence. Correlate the exact session only by a SHA-256 fingerprint of the 256-bit capability.
3. Preserve the hard startup-size gates. The current candidate passes at 163072 raw / 37499 compressed startup bytes; do not raise the budget to accommodate Stage 5I.
4. Run every permanent exact-head workflow family. The canonical browser suite must prove the Stage 5I query gate, exact release-owned r2 asset load, real browser offline/online lifecycle capture, raw-secret exclusion and unchanged canonical storage. A newer commit invalidates older exact-head evidence.
5. Resolve meaningful review findings, merge only with expected-head protection, then independently verify main-push workflows, Pages and the full deployed-site smoke before calling r2 production-proven.
6. After r2 is production-proven, request only the smallest unavoidable genuine two-physical-device/two-network production acceptance. Preferred devices are Chromebook on Wi-Fi and iPhone on cellular. Use the recorder so the owner can upload two sanitized JSON evidence files instead of private capabilities or screenshots.
7. Physical acceptance must prove Remote Joining-specific two-device/two-network reconnect/adverse-network hardening: same exact private session fingerprint, Host/Join/Close lifecycle, offline/online transition evidence, active revision 1 and terminal revision 2 convergence, no resurrection and no private-capability leakage.
8. Do not repeat generic Connected Rivalry adverse-network proof. Do not award RJR for source, CI, PR, merge, deployment, documentation, WEC, review, Stage 5H browser simulation or repeated Stage 5F evidence. Recalculate only from genuinely new accepted physical Remote Joining evidence.
9. After the genuine physical boundary is accepted, execute final stable Remote Joining release acceptance and evidence-based RJR-1 reconciliation toward genuine RJR100.

## Permanent locks

Billing must never be activated. Billing is permanently forbidden. Firebase remains Spark. Never link Cloud Billing, enable Blaze, add a payment method, activate Cloud Run or Cloud Functions, purchase credits or use another billing-required service.

App Check enforcement remains OFF. Firestore browser persistence remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes. The canonical localStorage keys remain exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`. Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the sole destructive remote-to-local gameplay Apply authority with transaction-owned strict exact raw-snapshot rollback. Exactly two private managers remain mandatory. No public discovery, listing, lobby, matchmaking, community, rankings or global leaderboards are authorized. Trusted-runtime IAM remains unactivated/unbroadened. Never retain a full private pairing/session capability in durable evidence and never destructively test the protected historical rivalry.

Historical task overrides remain in prior versioned handoffs and repository history; this current override replaces stale inline routing.

<!-- Historical compatibility marker for the frozen Phase 1E harness contract only; NOT current execution authority.
# CURRENT OVERRIDE — PR #191 MERGED / STAGE 5F ACCEPTED / RJR91 / STAGE 5G NETWORK HARDENING — 2026-09-04 UTC
-->

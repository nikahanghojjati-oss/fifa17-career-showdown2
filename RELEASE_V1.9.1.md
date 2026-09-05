# Career Mode Showdown v1.9.1

Status: PRODUCTION-PROVEN

Release tag: `v1.9.1`

Application version: `v1.9.1`

Current production runtime asset revision: `1.9.1-r2`

Previous production-proven rollback runtime: `1.9.1-r1`

## Scope

v1.9.1 is the Remote Joining network-hardening patch line. Stage 5G closes the runtime authority gap exposed when Firestore can commit an exact private Host, Join or Close mutation but the browser loses the acknowledgement. The page retains only the unresolved exact session capability in memory and retries that same capability after recovery instead of generating or accepting a replacement session.

Stage 5H proves the automatable real-browser adverse-network portion with actual browser offline/online lifecycle transitions across isolated contexts. Stage 5I adds an explicit `?rjr-acceptance=1` privacy-safe physical acceptance recorder so the remaining two-physical-device/two-network boundary can be evidenced without copying private capabilities or raw authority identifiers.

The recorder is unloaded and invisible in ordinary production mode. In acceptance mode it is page-memory-only and export-only, performs no recorder network or localStorage writes, excludes raw account/device/rivalry identifiers and the raw session capability, and correlates one session only by SHA-256 capability fingerprint.

## Production proof

PR #194 exact reviewed head `42f91df5ec1d5a576f0907836fa03f5994d7646b` passed all 15 permanent pull-request workflow families with no unresolved review threads. It was squash-merged using expected-head protection to main `11bb681527a9b78884baf0c384350c90493dc9bd`.

All 15 main-push workflow families completed successfully. Release Integration Burn-In run `33947112248` passed two independent complete journeys. Stability run `33947112190` passed contracts, Chromium and the complete deployed-site smoke. Deployed-site-smoke job `101255587827` passed runtime-byte verification, runtime provenance, production App Check token path, Home/Save Library/identity/analytics/football visuals, Candidate A/B/C, install/offline boundaries and the complete deployed journey.

Therefore `v1.9.1 / 1.9.1-r2` is production-proven. `1.9.1-r1` is the previous known-good whole-shell rollback target. Never construct a mixed-version rollback.

## RJR evidence boundary

Fixed `RJR-1` remains **91/100**. Stage 5G/5H/5I source, automation, PR, CI, review, merge, deployment and this release record receive zero readiness credit. Any later score movement requires genuinely new accepted Remote Joining-specific capability evidence, especially the remaining two-physical-device/two-independent-network production boundary and final stable Remote Joining release acceptance.

## Cost, privacy and provider lock

Firebase remains on Spark. Billing must never be activated. Cloud Billing, Blaze, payment-method linking, Cloud Run, Cloud Functions, purchased credits and every billing-required service remain forbidden. App Check enforcement remains OFF. Firestore browser persistence remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes.

Private pairing and Remote Joining remain exact non-enumerable capabilities for exactly two private managers. No public discovery, listing, lobby, matchmaking, community, rankings or global leaderboards are introduced. The three canonical localStorage keys remain unchanged, and Remote Joining does not gain destructive local gameplay authority. Candidate C remains the sole destructive remote-to-local gameplay Apply path with transaction-owned strict exact raw-snapshot rollback.

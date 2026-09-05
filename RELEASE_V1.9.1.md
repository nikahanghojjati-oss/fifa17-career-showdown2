# Career Mode Showdown v1.9.1

Status: RELEASE CANDIDATE / PRODUCTION PROOF PENDING

Release tag: `v1.9.1`

Application version: `v1.9.1`

Runtime asset revision: `1.9.1-r1`

Previous known-good runtime: `1.9.0-r5`

## Scope

v1.9.1 is the Stage 5G Remote Joining network-hardening patch. It closes the runtime authority gap exposed when Firestore can commit an exact private Host, Join or Close mutation but the browser loses the acknowledgement. The page now retains only the unresolved exact session capability in memory and retries that same capability after recovery instead of generating or accepting a replacement session.

The retry is bound to the same authenticated account, registered browser device and exact Connected Rivalry. While provider outcome is unresolved, the full capability is not copyable, a replacement Host or Join is blocked, Forget is blocked, and no local gameplay state is treated as successful. A changed authority context fails closed. Definitive provider denial is distinguished from ambiguous network loss. Terminal Close recovery remains monotonic and cannot resurrect a closed session.

Automated Stage 5G evidence covers deterministic lost Host, Join and Close acknowledgements and two independent Chromium manager contexts around one provider session. Those tests require one generated capability, one provider session, exact revision convergence, no canonical local-save mutation and no public-listing authority.

## RJR evidence boundary

Fixed RJR-1 remains `91/100` during implementation, review, CI, merge and deployment. This source change and its publication work receive zero readiness credit by themselves. Any later score movement requires genuinely new accepted Remote Joining-specific capability evidence, especially the remaining two-physical-device/two-network production boundary and final stable Remote Joining release acceptance.

## Cost, privacy and provider lock

Firebase remains on Spark. Billing must never be activated. Cloud Billing, Blaze, payment-method linking, Cloud Run, Cloud Functions and every billing-required service remain forbidden. App Check enforcement remains OFF. Firestore browser persistence remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes.

Private pairing and Remote Joining remain exact non-enumerable capabilities for exactly two private managers. No public discovery, listing, lobby, matchmaking, community, rankings or global leaderboards are introduced. The three canonical localStorage keys remain unchanged, and Remote Joining does not gain destructive local gameplay authority. Candidate C remains the sole destructive remote-to-local gameplay Apply path with transaction-owned strict exact raw-snapshot rollback.

## Publication and recovery rule

Production remains `v1.9.0 / 1.9.0-r5` until one unchanged v1.9.1-r1 head passes every permanent workflow family, meaningful review is resolved, expected-head merge succeeds, post-merge workflows pass, GitHub Pages deploys, and independent deployed-byte/runtime verification confirms the whole shell. Until that point `1.9.0-r5` remains the reviewed whole-shell recovery target. Never construct a mixed-version rollback.
# Career Mode Showdown v1.9.0-r5

Status: RELEASE CANDIDATE / PRODUCTION PROOF PENDING

Application version: `v1.9.0`

Runtime asset revision: `1.9.0-r5`

Previous known-good runtime: `1.9.0-r4`

## Scope

This runtime hotfix closes the creator-side automatic Connected Rivalry convergence gap exposed by fresh production r4 owner acceptance. Player Two already converged automatically after the single pairing-code paste. Player One could evaluate the same new rivalry before Player Two joined, correctly preserve the previous durable rivalry while the new rivalry was still pending, and then remain on that previous pointer because no creator-local pairing state changed when the peer activated the provider rivalry.

r5 preserves that fail-safe precedence and adds only a bounded exact-candidate activation retry. A current pairing candidate is rechecked only when the existing provider-authorized `attachRivalry` transaction returns `CONNECTED_RIVALRY_NOT_ACTIVE`. Retries remain bound to the same authenticated account, registered device, exact rivalry, manager role, profile and Save identity; they are finite, back off to at most two minutes per check and cannot outlive the existing 15-minute pairing expiry. Any identity, authorization, device, binding, expiry or candidate change cancels the retry. Provider-verified success is still the only event allowed to replace durable pointer A with current pairing B.

The normal qualifying flow remains one Player Two paste and zero manual Connected Rivalry Verify/Reattach actions on either role.

## RJR evidence boundary

Fixed RJR-1 remains `88/100`. The owner r4 screenshots are valuable failure evidence but do not satisfy the zero-manual-reattach acceptance because Player One required a manual correction. This implementation, its tests, CI, review, merge, deployment and documentation earn zero RJR credit. Recalculate RJR only after deployed r5 genuinely proves both manager contexts automatically converge on the exact current rivalry after one Player Two paste.

## Cost and provider lock

Firebase remains on Spark. Cloud Billing, Blaze, payment-method linking, Cloud Run, Cloud Functions and every billing-required service remain forbidden. App Check enforcement remains OFF. Firestore browser persistence remains memory-only. No public discovery, listing, lobby, matchmaking, community or rankings are introduced. Canonical career localStorage and Candidate C authority remain unchanged.

Production remains `v1.9.0 / 1.9.0-r4` until PR #187 passes its required final exact-head gates, merges and the resulting Pages deployment is independently proven.

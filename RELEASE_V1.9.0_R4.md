# Career Mode Showdown v1.9.0-r4

Status: DEPLOYED / PRODUCTION-PROVEN

Application version: `v1.9.0`

Runtime asset revision: `1.9.0-r4`

Previous known-good runtime: `1.9.0-r3`

## Scope

This runtime hotfix changes only Connected Rivalry pointer precedence and the proof needed to prevent regression. A restored durable pointer A remains the fallback, but the current private-pairing candidate B is now evaluated even when A exists. B replaces A only after the existing provider-authorized `attachRivalry` path verifies the active registered device, current authenticated account, exact manager slot, profile/save identity and ACTIVE rivalry state. Pending, expired, mismatched or otherwise unauthorized B candidates cannot displace A.

The automatic flow remains exactly one Player Two pairing-code paste. Neither Player One nor Player Two should need a manual Connected Rivalry Verify/Reattach action when the current provider-active exact pairing is valid.

Canonical career localStorage remains unchanged and the repair never deletes or mutates the old provider rivalry merely because its local pointer becomes stale.

## RJR evidence boundary

Before this hotfix received any implementation credit, the previously supplied v1.9.0-r3 owner production evidence was independently recalculated under fixed RJR-1. It moves RJR from 87/100 to 88/100 for one bounded provider-live actual Remote Joining lifecycle capability only. The failed zero-manual-reattach behavior earns zero production credit, and implementation, CI, review, merge, Pages deployment and documentation earn zero RJR credit.

## Cost and provider lock

Firebase remains on Spark. Cloud Billing, Blaze, payment-method linking, Cloud Run, Cloud Functions and every billing-required service remain forbidden. App Check enforcement remains OFF and Firestore browser persistence remains memory-only.

Production proof: PR #184 merge 2bfb7656940be23b635cb7092127a0ab0f62c7a4; Deploy GitHub Pages run 33713396948; Stability/deployed-site-smoke run 33713396979.

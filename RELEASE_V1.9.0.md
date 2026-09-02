# Career Mode Showdown v1.9.0 — Private Remote Joining

Status: RELEASE CANDIDATE

Release tag: `v1.9.0`
Application version: `v1.9.0`
Runtime asset revision: `1.9.0-r1`
Previous known-good runtime: `1.8.1-r5`

## Scope

This release introduces the first production user-facing Private Remote Joining session surface. Showdown Home exposes one explicit Private Remote Joining action. The Remote Joining runtime itself is not part of ordinary HTML startup and provider/account/device/rivalry dependencies are resolved only after an explicit Host, Join, Refresh/Read or Close action.

Host creates a fresh 256-bit exact session capability. Join accepts only the exact private capability shared directly by the already-paired other manager. Refresh performs an exact read. Close performs the existing terminal member close transition. No collection listing, public discovery, lobby, matchmaking, community or rankings surface exists.

Session capability state is page-memory-only. Reloading forgets it. The feature does not write localStorage, does not mutate a local Career Mode Save, and does not bypass Candidate C remote-to-local Apply authority.

Firebase remains on Spark with billing disabled. Firestore remains memory-only. App Check enforcement remains OFF. No Cloud Run, Cloud Functions, paid service, IAM expansion, payment method or billing account is introduced. Provider or quota failure fails closed while local Career Mode remains available.

## Readiness accounting

RJR remains 87/100 at source/release-candidate time. Code, tests, CI, review and deployment mechanics earn no capability credit. The score may move only after production-live two-account/two-device Remote Joining evidence proves one or more currently uncredited fixed-domain capabilities.

# Career Mode Showdown v1.9.1 — Runtime r31

Status: RELEASE CANDIDATE

Application version: `v1.9.1`

Runtime asset revision: `1.9.1-r31`

Previous known-good runtime: `1.9.1-r30`

Runtime r31 fixes the physical Career Start acknowledgement dead-button failure observed after reconnecting the exact Daniel/Nik rivalry under a replacement ACTIVE private session.

The Shared Career Start screen now:
- keeps one acknowledgement operation id across a bounded stale-revision retry;
- re-reads authoritative provider state after `CAREER_START_STALE_BASE_REVISION`, `CAREER_START_ROLE_ALREADY_ACKNOWLEDGED`, or `CAREER_START_ALREADY_READY`;
- adopts an acknowledgement that was already recorded for the current manager instead of requiring another write;
- adopts `CAREER_START_READY` immediately when provider authority already contains both acknowledgements;
- preserves an unrecoverable provider error visibly in the Career Start panel instead of erasing it during the final render.

The r30 `CONTINUE TO TRANSFER CHALLENGE` handoff remains unchanged and becomes available once both authoritative Career Start acknowledgements are ready.

This is state-preserving. It does not redraw the league, redraw clubs, change season length, replace the persistent Daniel/Nik rivalry, or mutate canonical local save authority. The existing Bundesliga / SC Freiburg / Hertha BSC physical test Showdown can continue after updating.

Firebase remains Spark-only. Billing remains permanently OFF. App Check enforcement remains OFF. No Cloud Functions, Cloud Run, paid tier, or Rules expansion is introduced.

SSJR-1.1 remains exactly `0/100` until the complete real two-device gameplay journey passes.

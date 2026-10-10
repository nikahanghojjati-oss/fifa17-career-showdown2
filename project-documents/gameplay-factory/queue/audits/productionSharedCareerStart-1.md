# Audit: js/productionSharedCareerStart.js, first half (lines 1-80)

Job 1521 · Queue item 0110 · Read on factory/gameplay-v1 @ 986c7a1e1 (the file on qa/mega-audits differs; the active gameplay line was audited).

## Findings

no findings

## Riskiest places checked (no finding)

- Lines 58-67, acknowledgement double tap and idempotence: `busy` is set synchronously before the first await, and the acknowledgement is skipped when the read already shows CAREER_START_READY or this role already acknowledged, so a repeated tap cannot acknowledge twice.
- Lines 68-79, the stale-revision retry: one retry for CAREER_START_STALE_BASE_REVISION, a reconciliation read for the already-acknowledged codes, and a rejected error otherwise. A second stale result throws rather than returning false silently.
- Line 39, the setup gate (`revision!==6` and SHOWDOWN_CONFIRMED), matches the setup protocol and the other shared-setup gates.
- Line 45, polling stops once the state is CAREER_START_READY. Cosmetic only: line 36 replaces underscores and not hyphens, unlike `pmspLeagueName` in productionSharedMultiSeasonProgression.js line 66, so a league id with a hyphen would show a different name. Not a gameplay bug.

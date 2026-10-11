# Audit: js/productionSharedJourneyReconnect.js, first half (lines 1-73)

Job 1517 · Queue item 0102 · Read on factory/gameplay-v1 @ 986c7a1e1 (the file on qa/mega-audits differs; the active gameplay line was audited).

## Findings

no findings

## Riskiest places checked (no finding)

- Line 58, `pjrPrePairShell()&&!rivalryApi?.getState?.()?.attached` returns null: this is the pre-pair joiner shell path, where no rivalry exists yet. It is correct for the pre-pairing flow, and the caller must treat null as "not paired yet". The caller is outside this half.
- Lines 46-51, identity check: a marker rivalry that differs from the attached rivalry fails with JOURNEY_RECONNECT_RIVALRY_MISMATCH, so a stale saved pairing cannot reconnect to another rivalry.
- Lines 37 and 63: the protocol is created once and cached with the first multi-season module, and `pjrPreviousFor` resets `state` and `contextKey` when account, device, rivalry or role changes. Both are consistent with each other.

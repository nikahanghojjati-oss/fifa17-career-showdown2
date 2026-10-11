# Audit: js/productionSharedShowdownSetup.js, first half (lines 1-126)

Job 1523 · Queue item 0114 · Read on factory/gameplay-v1 @ 986c7a1e1 (the file on qa/mega-audits differs; the active gameplay line was audited).

## Findings

no findings

## Riskiest places checked (no finding)

- Lines 106-107: the active session check requires `sessionState==="active"`, no pending action, and `Date.now()<expiresAtEpochMs`. This is the expiry check that the commit provider lacks (sparkSharedSeasonCommit-1.md, Finding 1), so the setup gate is the stricter one.
- Lines 108-110: the account, device and rivalry must match the exact remote session. A stale rivalry binding is rejected with SHARED_SETUP_AUTHORITY_MISMATCH.
- Lines 40-42, `revision()`: when the `app-asset-revision` meta is missing, the cache-busting value falls back to the literal "1.9.1-r3", which is older than the runtime revisions of the protocol modules (r9, r10). The meta tag is expected to exist, so this is a maintenance risk and not a current bug; it is worth checking that index.html always sets it.
- Lines 49-58, `loadScript`: a script already loading is shared through `scriptPromises`, and the entry is removed in `finally`. A script that loads but does not expose its API is rejected with SHARED_SETUP_DEPENDENCY_UNAVAILABLE.
- Line 51, `Promise.reject(fail(...))`: `fail` throws before `Promise.reject` runs, so the error is raised synchronously. Inside `dependencies()` (async) it still becomes a rejection, so the behaviour is correct.

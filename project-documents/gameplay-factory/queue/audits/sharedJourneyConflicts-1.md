# Audit: js/sharedJourneyConflicts.js, first half (JOB-1676)

no findings

Three riskiest places checked:

1. **Lines 27–35 — input shape, canonicalization, and TTL:** Exact receipt/input keys, deterministic object-key ordering, SHA-256 encoding, and bounded time-to-live validation. No confirmed player-facing mismatch or crash for valid game inputs.
2. **Lines 36–51 — IDs, revisions, and authority:** Role, action, surface, revision, and scoped session/device identifiers are validated before an authority tuple is accepted. No confirmed wrong-manager or wrong-screen result.
3. **Lines 53–63 — provider-error classification:** Reviewed accepted responses and priority of expiry, altered replay, stale, quota, authentication, and transient codes. No confirmed incorrect classification with the documented codes.

Scope: reviewed lines 1–59 (with the classification function's remaining lines for context); no gameplay files changed.

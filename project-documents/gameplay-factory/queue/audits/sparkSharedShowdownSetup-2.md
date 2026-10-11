# Audit: js/sparkSharedShowdownSetup.js, second half (lines 131-260)

Job 1526 · Queue item 0120 · Read on factory/gameplay-v1 @ 986c7a1e1 (the file on qa/mega-audits differs; the active gameplay line was audited).

## Findings

no new findings. The expired-session bypass that reaches the writes here (line 208, `authority` built from the session read at line 173) is already reported as Finding 1 in audits/sparkSharedShowdownSetup-1.md.

## Riskiest places checked (no other finding)

- Lines 195-203, the idempotent replay: a repeated operation id returns `replayed:true` without a second write, but only when the type, base revision, actor and (for length) season count all match. A different request with the same id gets SETUP_IDEMPOTENCY_CONFLICT, so a double tap cannot draw twice.
- Line 205, the stale-base check runs after the replay check, so a retry of an accepted operation is not mistaken for a stale base.
- Lines 134 and 147, the season count: `totalSeasons` is taken from the length command only on `commit-length`, and every later revision carries the prior value, so the length cannot change after it is committed.
- Lines 135 and 85 of the first half, the confirmed roles: the confirmations are read from `actorRoles.slice(4)`, and the ledger rejects duplicate confirmations, so a manager cannot confirm twice.
- Line 251, `productionEnabled:false` on this provider, while productionSharedShowdownSetup.js uses it in production. The caller does not read the flag, so it does not change behaviour; it is a labelling inconsistency to check, not a bug.

# Career Mode Showdown v1.8.1 — Runtime r5

Status: RELEASE CANDIDATE — SUSTAINED MUTATION-FREQUENCY HARDENING — CAPABILITY PROOF PENDING FINAL EXACT-HEAD CI / DEPLOYMENT PENDING

Application version: `v1.8.1`
Runtime asset revision: `1.8.1-r5`
Previous known-good runtime: `1.8.1-r4`

## Why r5 exists

Runtime r4 production-proved deterministic App Check token-lifecycle safety while Connected Rivalry retained immutable-base CAS, exact accepted-result replay, structural abuse bounds and Candidate C-only destructive remote-to-local Apply. The remaining pre-Stage-5 abuse gap is sustained distinct mutation frequency: an authorized active device could otherwise submit a valid new revision immediately after the preceding accepted revision.

Runtime r5 adds a narrow zero-billing write-frequency boundary without changing who is authorized, the canonical local Save authority, pairing semantics or Stage 5.

## Bounded behavior

- The existing low-revision Connected Rivalry establishment path is preserved through revision 3 so already-proven create, CAS, replay and two-owner behavior is not retroactively changed.
- Revision 2 → 3 establishes a Firestore-owned authoritative time anchor by requiring shared-state `updatedAt == request.time`.
- Once authoritative shared state is at revision 3 or later, a distinct accepted revision requires at least two seconds of Firestore server time since the previous accepted revision.
- Browser publication supplies Firestore `serverTimestamp()` for authoritative shared-state `updatedAt`; a forged or skewed caller clock cannot satisfy the sustained-write boundary.
- Exact accepted-result idempotent replay still returns before any new write, so replay remains available during the cooldown and cannot create another revision or receipt.
- A rate-limited distinct mutation creates no authoritative revision and no idempotency receipt; the same logical mutation may be retried after the cooldown and may advance exactly once under the normal immutable-base CAS contract.
- Idempotency receipt timestamps and the seven-day retention boundary remain unchanged.
- Canonical local storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`; `activeShowdown` remains non-canonical.
- Candidate A remains non-mutating, Candidate B remains read-only, and Candidate C remains the sole destructive remote-to-local Apply authority with transaction-owned rollback and a strict exact raw snapshot.
- Firebase remains Spark / zero billing. Firestore remains memory-only. Google Auth remains popup-only with `browserSessionPersistence` and no additional scopes.
- App Check enforcement remains OFF. Trusted-runtime IAM remains unactivated and unbroadened.
- Remote Joining sessions remain Stage 5 locked. No public discovery, community, matchmaking or global rankings are introduced.

## Permanent proof

`tests/contracts/stage4-mutation-rate-limit-contracts.cjs` protects the runtime SDK surface, server-time Rules boundary and permanent storage/provider/session locks.

`tests/firebase/stage4-mutation-rate-limit-emulator.cjs` is the dedicated Firestore Rules proof. It must demonstrate that a sustained distinct revision is denied while the server-time window is closed with no new authority or receipt, that a skewed caller clock cannot control the authoritative timestamp, that exact accepted-result replay still succeeds without another mutation during the closed window, and that the same previously denied logical mutation advances exactly once after the window opens.

The capability is not considered evidence-proven until that permanent emulator proof passes on the exact candidate line and the final unchanged publication head passes the normal permanent workflow gates.

## Readiness accounting

Fixed RJR-1 remains `83/100` until the dedicated permanent sustained mutation-frequency proof passes. Once it passes, this distinct broader abuse-resistance capability may add exactly `+1`, from 83 → 84. Source edits, runtime packaging, CI volume, PR publication, merge, deployment and provider publication do not earn duplicate readiness credit.

Production publication of the strengthened `firestore.spark.rules` remains a separate provider verification gate. Repository candidate Rules must not be described as production-live without provider evidence.

## Recovery

`1.8.1-r4` is the previous known-good whole shell and remains the direct rollback target if r5 fails promotion or deployed verification.

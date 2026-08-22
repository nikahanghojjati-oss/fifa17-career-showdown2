# Career Mode Showdown v1.7.0-r2 — Shell Coherence Hotfix

Status: RELEASE CANDIDATE

Application version: `v1.7.0`
Runtime asset revision: `1.7.0-r2`
Previous known-good runtime: `1.6.0-r1`

This is a bounded runtime-maintenance candidate inside the Stage 4 Connected Rivalry production-proof checkpoint. It does not add a product capability. It assigns a fresh immutable public runtime namespace after multiple Stage 4 candidate byte generations reused `1.7.0-r1`, and it makes the initial Home local-data tile match the intentional post-bootstrap `LOCAL / SAVE LIBRARY` identity.

The release footer remains exactly `v1.7.0 · Connected Rivalry`. Browser stability proof now waits after startup and rejects any delayed footer or Home local-data identity mutation. The service worker uses `1.7.0-r2` as current and retains production-proven `1.6.0-r1` as the whole-shell recovery target; the potentially mixed `1.7.0-r1` cache is not a recovery authority.

Stage 4 Firestore Rules are unchanged. The production-published reviewed Rules blob remains `ecc8ccb2ab50f0f7057ab3170eb080ad9e36025f`, and the immutable Stage 4 source seal remains `7336adda832322bbd93e8c16f3de0e4bbf5273c1`. App Check enforcement remains OFF, Firebase Spark / zero billing remains mandatory, Firestore persistent cache remains disabled, and Google authentication remains popup-only `browserSessionPersistence`.

Canonical local storage, Candidate A/B/C authority, exactly-two-manager pairing, stale/idempotency/tombstone protections, and the Stage 5 session-write lock are unchanged. RJR-1 remains `69/100`; this maintenance candidate earns no readiness credit by itself.

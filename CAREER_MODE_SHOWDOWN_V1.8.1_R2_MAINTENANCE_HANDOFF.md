# Career Mode Showdown v1.8.1-r2 Maintenance Handoff

Status: RELEASED / PRODUCTION-PROVEN DEPLOYED

Application version: `v1.8.1`
Runtime asset revision: `1.8.1-r2`
Previous known-good runtime: `1.8.1-r1`
Remote Joining readiness: `78/100` under RJR-1.

This maintenance candidate fixes Connected Rivalry recovery on mobile: the exact saved `pair_` plus 64-hex rivalry ID is visible in full, wraps without changing its value, remains selectable, and COPY RIVALRY ID copies the complete immutable saved ID rather than editable attachment text. Durable-ID shortening is abandoned; recognition fingerprints are display-only.

The r2 Service Worker also preserves rollback coverage for clients that skipped r1 by retaining the highest verified installed older shell when the declared r1 shell is absent. No mixed-generation network fallback is permitted for retained versioned assets.

Safety locks remain unchanged: Firebase Spark / zero billing; App Check enforcement remains OFF; Firestore memory-only; popup-only browserSessionPersistence; unchanged Firestore Rules; exactly two private managers; no public discovery; Stage 5 locked. The Installable Offline App remains available. Candidate C remains the sole destructive remote-to-local Apply path, using transaction-owned mutation, backup first, strict exact raw snapshot guards, stale/anti-clobber rejection, ownership-scoped rollback and exact recovery verification.


Production merge `f3d26f5f9b8cee8996ecff296d6ca9bcc2c3fb18`; Pages run `32863192183` succeeded. Owner-device verification of the new full-ID copy surface and existing Gop reattachment is the immediate next product proof, not part of the release's RJR credit.

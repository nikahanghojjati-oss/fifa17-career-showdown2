# Career Mode Showdown v1.9.1 — Runtime r40

Application version: `v1.9.1`
Runtime asset revision: `1.9.1-r40`
Previous known-good runtime: `1.9.1-r39`

r40 is a playability hardening release driven by the real iPhone + Chromebook journey rather than by isolated UI checks.

The physical blocker was a production Firestore Rules denial inside the Shared Transfer Challenge. The browser could read the existing Transfer state, but the first legal Transfer mutation could still be rejected with `permission-denied`. The production emulator proved that this was not limited to the 00:00 timeout path: even a same-session `REQUEST EARLY END` update could be denied.

r40 addresses the underlying authority boundary:
- Transfer role-list validation no longer indexes potentially empty lists.
- Transfer append-only history and role-state mutations no longer depend on zero-length Firestore list slices.
- The existing Transfer Challenge is preserved; no league, clubs, Career Start or Transfer state is reset.
- The r39 server-authoritative 15-minute timeout rule remains: Firestore `request.time` must be at least 15 minutes after immutable `startedAt`, and timeout completion records that server request time.
- Season Commit acknowledgement history is also made slice-free so the first post-result acknowledgement cannot hit the same zero-length-list class of failure later in the journey.

A second integration gap was found beyond Transfer. The stored Shared Setup document is intentionally a compact deterministic ledger and does not store `leagueId` or `clubs` directly. History Convergence and Multi Season Progression were reading that compact ledger as if it were the reconstructed setup state. r40 now resolves the canonical Shared Setup provider and rebuilds the actual confirmed setup before history or multi-season progression derives league, permanent clubs or season count.

A new generated-production-Rules lifecycle emulator now exercises the real provider chain for a three-season Showdown:
Shared Setup -> Career Start -> Transfer Window -> Guess Entry -> Signing Entry -> private Season Results -> Season Commit -> dual acknowledgement -> canonical scoring -> converged history -> exact next-season progression -> final reconciliation.
The existing Terminal Close generated-Rules emulator remains the independent final destructive boundary proof.

The exact fresh-session Transfer recovery emulator and the full gameplay provider lifecycle emulator are both blocking POS20 REMOTE proofs, and the full lifecycle emulator also blocks Firestore Rules publication.

The four-hour private-session lifetime remains unchanged. Firebase remains Spark-only, Billing remains permanently OFF, Cloud Run and Cloud Functions remain unused, and App Check enforcement remains OFF. No public discovery, lobby, matchmaking or rankings are introduced. Physical acceptance credit remains unclaimed until the real iPhone + Chromebook journey completes.

Remote Joining remains the private exact-path session transport; no public discovery or matchmaking is introduced.

SSJR-1.1 remains exactly `0/100`; automated and emulator coverage does not count as physical two-device acceptance.

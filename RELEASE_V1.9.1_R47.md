# Career Mode Showdown v1.9.1 — Runtime r47

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r47`  
Previous known-good runtime: `1.9.1-r46`

r47 repairs the invisible Shared Season Commit control observed after both physical managers published their season results. The Results panel could show `BOTH MANAGERS PUBLISHED` while the separate Commit reader had not returned an authoritative view. The Commit adapter silently swallowed its read error and hid the action, leaving players with no explanation or safe retry.

The online-only Home layout also applies its retired Legacy/Statistics containment directly in the base stylesheet, so those local-only tiles do not appear briefly while the connected identity layer is initializing.

When both results are ready but the Commit read has not succeeded, the review panel now shows a read-only check action. A failed read displays its sanitized error code and `RETRY COMMIT CHECK`. A successful read restores `COMMIT SHARED SEASON` for the confirmed coordinator, or the appropriate waiting/acknowledgement action for the other manager. A retry never publishes results or mutates Commit state. In-flight reads for the same season coalesce, preventing repeated queued reads before the first successful bind. A desktop/mobile browser regression injects a rejected read, verifies the failure and safe retry, then confirms that the coordinator action returns without a mutation. Existing rejected/lost-response Commit and dual-acknowledgement coverage still passes.

The screenshot alone does not identify which Commit dependency rejected the live read. The exposed code makes a repeatable provider or setup failure diagnosable without asking players to recreate their Showdown or change their published results. No Firestore Rules, pairing authority, scoring formulas, canonical local storage writes, or billing configuration change. Firebase remains Spark-only; billing remains OFF. App Check enforcement remains OFF.

The shell assets and service worker advance to r47 and retain r46 as rollback. The physical test guide now describes Daniel's host setup, Nik's code-based join and the separate private session code; the evidence validator requires the r47 runtime. Private Remote Joining remains governed by its existing paired manager authority. Physical acceptance must wait for exact production deployment and a genuine two-device replay. SSJR-1.1 remains `0/100`; automated proof earns zero physical credit.

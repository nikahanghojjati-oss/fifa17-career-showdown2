# Career Mode Showdown v1.9.1 — Runtime r30

Status: RELEASE CANDIDATE

Application version: `v1.9.1`

Runtime asset revision: `1.9.1-r30`

Previous known-good runtime: `1.9.1-r29`

Runtime r30 closes the player-facing gameplay handoff from Shared Career Start into the existing Shared Transfer Challenge.

After both Daniel and Nik acknowledge that they have started their assigned FIFA 17 careers, the Career Start panel no longer stops at a disabled `BOTH MANAGERS READY ✓` state. The primary action becomes `CONTINUE TO TRANSFER CHALLENGE`.

That action delegates to the existing production Shared Transfer Challenge adapter. The adapter revalidates the same confirmed rivalry, the same exact active private session, the current shared season, and `CAREER_START_READY` before opening the gameplay screen. No new Showdown, league draw, club draw, season selection, or local save mutation is created by this handoff.

The downstream production gameplay capabilities already present in the repository remain unchanged:
- shared authoritative 15-minute transfer window;
- private guess entry for each manager;
- private signing entry for each manager;
- shared transfer verdict reveal after both sides lock;
- shared season result entry and publication;
- shared immutable season commit and two-manager acknowledgement;
- provider-derived canonical scoring;
- shared history convergence;
- multi-season progression for 1 / 3 / 5 / 10-season Showdowns;
- final reconciliation and terminal close.

Runtime r29 stale-test-state cleanup remains unchanged. Historical Remote Joining engineering provenance remains repository-only; the normal player-facing shell continues to use simplified Daniel/Nik language.

Firebase remains Spark-only. Billing remains permanently OFF. App Check enforcement remains OFF. No Cloud Functions, Cloud Run, paid tier, or Rules expansion is introduced.

SSJR-1.1 remains exactly `0/100` until a fresh real two-device physical journey passes the complete live gameplay path.

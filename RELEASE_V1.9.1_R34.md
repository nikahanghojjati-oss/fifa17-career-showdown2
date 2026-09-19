# Career Mode Showdown v1.9.1 — Runtime r34

Application version: `v1.9.1`
Runtime asset revision: `1.9.1-r34`
Previous known-good runtime: `1.9.1-r33`

This runtime is a focused player-input reliability hotfix for the Shared Showdown setup path. It does not change league/club authority, scoring, storage authority, pairing, Firestore Rules, or the downstream gameplay model.

Five concrete UI/runtime defects were repaired:

1. Shared Setup actions did not have one serialized player-action boundary, so rapid repeat taps could race against the same in-flight provider transition.
2. The shared league control could be re-enabled while authoritative provider work was still in flight, creating a tap window where an extra press was accepted but could not advance anything.
3. If the rival had already confirmed the final Shared Setup, the second manager's `CONFIRM SHARED SHOWDOWN` click only recorded confirmation and required a second `CONTINUE TO CAREER START` click. The same successful confirmation now hands off directly to Career Start.
4. In-memory league/club reveal witnesses were not fully cleared when the polished presentation was deactivated or moved to a different rivalry, allowing a later Shared Showdown to inherit stale reveal state.
5. The Career Start adapter could independently re-label/re-enable the same club Continue button while the polished Shared Setup presentation still owned it. Career Start now yields ownership until setup presentation is finished and clears stale ownership markers when confirmed authority is absent.

The Shared Setup controls now enter busy state immediately on the first accepted tap, repeat taps coalesce onto the same in-flight action, and a fresh rivalry receives fresh reveal witnesses. The original Daniel/Nik pairing model, exact ACTIVE-session requirement, permanent clubs, original season-plan authority, Career Start, Transfer Challenge, Shared Season Results, Season Commit, canonical scoring/history, multi-season progression, Final Reconciliation, and Terminal Close remain unchanged.

Firebase remains Spark-only. Billing remains permanently OFF. Cloud Run and Cloud Functions remain unused. App Check enforcement remains OFF. Canonical local storage authority is unchanged. No Showdown reset, club redraw, or local-save replacement is introduced.

Remote Joining engineering provenance remains repository-only and does not change the player-facing flow. SSJR production credit is not inferred from CI or deployment evidence.

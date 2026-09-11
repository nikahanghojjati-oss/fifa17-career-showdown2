# Career Mode Showdown v1.9.1 runtime r18

Application version: `v1.9.1`

Runtime asset revision: `1.9.1-r18`

Previous known-good runtime: `1.9.1-r17`

Status: RELEASE CANDIDATE

## Terminal Close

r18 implements the frozen MDP Terminal Close capability after r17 Final Reconciliation. The exact completed rivalry can move from ACTIVE to CLOSED only with one exact unexpired ACTIVE private session, an exact r18 terminal witness derived from r17 Final Reconciliation, the configured SHOWDOWN_CONFIRMED season plan, and every configured season commit already ACKNOWLEDGED.

To remain inside Firestore Spark Rules execution limits for supported 1/3/5/10-season Showdowns, acknowledged season commits are folded one exact season path at a time into a monotonic `terminalProgress` seal on the existing rivalry document. Rules derive the canonical 5/3/1 plus capped-bonus scoring totals while each seal advances. No new collection, list surface, paid compute, or extra season is introduced.

After the seal reaches the configured final season, the provider atomically closes the exact ACTIVE private session and parent rivalry. The final Rules path accepts only the terminal fields as changed, binds the closed session revision into `terminalProgress`, and validates the exact r18 witness against the Rules-backed accumulated totals. Canonical local Save storage is never mutated by Terminal Close.

Ambiguous provider outcomes retain only the exact terminal witness in page memory for same-witness retry. A retry first performs an exact terminal read so a lost acknowledgement can converge without a replacement mutation. Once CLOSED is provider-confirmed, the stale page-memory Remote Joining capability is forgotten. Later exact rivalry reads retain terminal results, while new private-session creation and delayed journey writes remain denied by the closed rivalry state.

Firebase remains Spark-only, Billing remains permanently OFF, App Check enforcement remains OFF, and no Cloud Run or Cloud Functions dependency exists.

## Publication boundary

This is a release-candidate shell. Builder and candidate checks are not integration credit. The final exact publication head must pass POS20 and clean review, then merge with expected-head protection. After merge, GitHub Pages, the zero-billing Firestore Rules deployment/readback, exact-main POS20 and both Release Integration Burn-In passes must all succeed before separate MDP accounting may credit Terminal Close.

SSJR-1.1 remains `0/100` until genuine production-two-account acceptance evidence is accepted under the frozen SSJR model.

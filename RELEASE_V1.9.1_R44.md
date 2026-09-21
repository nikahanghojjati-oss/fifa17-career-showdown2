# Career Mode Showdown v1.9.1 — Runtime r44

Application version: `v1.9.1`
Runtime asset revision: `1.9.1-r44`
Previous known-good runtime: `1.9.1-r43`

r44 is a bounded online correctness repair discovered by the r43 bug-hunt checkpoint.

Bundesliga Season Results now enforce the mathematically possible league-points ceiling for an 18-club double round-robin league: 34 matches and therefore a maximum of 102 points. The previous online path used the 20-team ceiling of 114 for every supported league, allowing impossible Bundesliga totals from 103 through 114.

The shared authority now derives maximum league points from the authoritative team count using `(teamCount - 1) * 2 * 3`. The invariant is enforced consistently through the Season Results UI, deterministic Season Results protocol, Spark Season Results provider, Season Commit core/provider, canonical scoring, and history convergence.

Provider layers now carry the authoritative league size from the repository-owned FIFA 17 club catalog instead of assuming 20 teams. Cold-load dependency ordering explicitly initializes the shared catalog before providers that capture it, preventing screen-order-dependent behavior.

Regression coverage keeps 114 valid for the supported 20-team leagues, accepts exactly 102 for Bundesliga, and rejects Bundesliga 103. Existing canonical scoring weights, permanent club assignment, Transfer Challenge behavior, session/reconnect logic, accumulated history/trophy calculations, Firestore architecture, and two-manager privacy rules are unchanged.

Remote Joining, pairing, ACTIVE-session authority, and the rest of the provider architecture remain unchanged.

SSJR-1.1 readiness remains `0/100`; this correctness repair and its deployment evidence earn no SSJR credit.

Firebase remains Spark-only. Billing remains permanently OFF. Cloud Run and Cloud Functions remain unused. No public discovery, lobby, matchmaking, or rankings are introduced.

The r44 shell identity advances all cache-busted entry assets and retains r43 as the rollback runtime so production devices cannot remain pinned to stale r43 JavaScript after this repair.

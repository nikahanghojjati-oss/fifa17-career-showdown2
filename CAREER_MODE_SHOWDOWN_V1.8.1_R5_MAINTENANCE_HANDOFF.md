# Career Mode Showdown v1.8.1-r5 Maintenance Handoff

Status: RELEASE CANDIDATE / CAPABILITY EVIDENCE-PROVEN / NOT PRODUCTION-PROVEN

Application version: `v1.8.1`
Runtime asset revision: `1.8.1-r5`
Previous known-good runtime: `1.8.1-r4`
Remote Joining readiness: `84/100` under fixed RJR-1.

## Why r5 exists

Production-proven `1.8.1-r4` closed deterministic App Check token-lifecycle safety while Connected Rivalry retained immutable-base CAS, exact accepted-result replay, structural abuse bounds, and Candidate C-only destructive remote-to-local Apply. The next distinct pre-Stage-5 abuse dependency was sustained mutation frequency: an otherwise authorized active device could submit another valid distinct revision immediately after the previous accepted revision.

Runtime r5 adds one narrow Spark-safe, server-time write-frequency boundary without changing authorization, local Save authority, pairing semantics, or Stage 5.

Permanent proof head `e26d37dc598c956e8e7a82e1f9c0b3d919326914` passed the dedicated sustained mutation-frequency contract and Firebase emulator proof. After the bounded low-revision establishment path, authoritative shared state is anchored to Firestore server time; distinct accepted updates require a two-second server-time window; skewed caller time cannot bypass the rule; denied rapid distinct writes allocate neither authoritative revision nor receipt; exact accepted-result replay remains idempotent during cooldown; and the same previously denied logical mutation may advance exactly once after cooldown under immutable-base CAS.

## Protected product semantics

Firebase remains Spark / zero billing. Firestore remains memory-only. Google Auth remains popup-only with `browserSessionPersistence` and no extra scopes. App Check enforcement remains OFF. Trusted-runtime IAM remains unactivated and unbroadened. Exactly two private managers remain required. Public discovery, community, matchmaking, and global rankings remain prohibited.

Canonical local browser storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`; `activeShowdown` remains non-canonical. Candidate A remains non-mutating export, Candidate B remains read-only analysis, and Candidate C remains the sole destructive remote-to-local Apply authority with backup first, immutable intent, strict exact raw snapshot authority, transaction-owned mutation, ownership-scoped rollback, stale/anti-clobber rejection, and exact recovery verification.

The Installable Offline App remains the local-first startup and recovery baseline. Sustained mutation-frequency enforcement must never move canonical local Save authority into Firestore or make ordinary local startup depend on network/provider availability.

## RJR accounting

Fixed RJR-1 is `84/100`. The dedicated sustained mutation-frequency capability earns exactly one point, 83 → 84. Source packaging, CI volume, contract maintenance, merge, deployment, documentation, and provider publication earn zero duplicate readiness credit.

This credit does not include authenticated third-account/revoked registered-device production negatives, two-physical-network behavior, actual Remote Joining sessions, Remote Joining-specific real-device token-lifecycle acceptance, production abuse acceptance, production rollback proof, or final stable Remote Joining release acceptance.

## Recovery

`1.8.1-r4` is the previous known-good whole shell and the immediate recovery target. If r5 fails exact-head publication or deployed verification, revert the whole runtime generation to r4 rather than partially reverting the server-time/rate-limit changes.

A rollback must preserve transaction-owned mutation semantics, strict exact raw snapshot authority, ownership-scoped rollback, unchanged canonical storage authority, the Installable Offline App, and the production-proven r4 App Check token-lifecycle behavior.

## Promotion gates

Do not treat r5 as production runtime until one exact unchanged final PR #163 head passes the complete permanent repository contract suite, all 14 permanent PR workflow families, clean review/thread gates and mergeability, then expected-head squash merge under standing owner authorization.

After merge, independently verify the resulting live main, GitHub Pages runtime-byte equality, production App Check path, and full deployed Stability journey. Only that deployed verification promotes `1.8.1-r5` to production-proven. Merge and deployment add no RJR credit.

Production provider publication of the strengthened `firestore.spark.rules` remains a separate unverified boundary. Repository/emulator evidence and website deployment must not be described as proof that those Rules are production-live.

Stage 5 host/join/session orchestration remains locked until remaining explicit pre-Stage-5 gates genuinely close. Do not repeat consumed owner pairing/device recovery, unavailable-code, destructive Stage 4 reconciliation, exact replay, deterministic adverse-provider, token-lifecycle, structural-abuse, or sustained mutation-frequency proof merely for confidence.

## Transition discipline

Finish PR #163 exact-head publication and deployed r5 verification, then create and seal the recursive SLE/WEC successor package before beginning another substantial product milestone. The successor must independently verify live main/provider/deployment truth, validate and archive the predecessor WEC, initialize a fresh unique WEC with reset counters, and select the smallest genuinely unblocked remaining Remote Joining dependency from live evidence rather than inheriting this environment's transition decision.

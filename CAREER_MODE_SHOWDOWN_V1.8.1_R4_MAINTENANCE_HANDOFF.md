# Career Mode Showdown v1.8.1-r4 Maintenance Handoff

Status: RELEASE CANDIDATE / CAPABILITY EVIDENCE-PROVEN / NOT PRODUCTION-PROVEN

Application version: `v1.8.1`
Runtime asset revision: `1.8.1-r4`
Previous known-good runtime: `1.8.1-r3`
Remote Joining readiness: `82/100` under fixed RJR-1.

## Why r4 exists

Production-proven `1.8.1-r3` restored Connected Account availability while App Check enforcement remains OFF. The remaining bounded pre-Stage-5 gap was deterministic proof that Firebase-owned App Check auto-refresh can cross a later token expiry/refresh transition without corrupting Connected Account, Connected Rivalry, or canonical local saves.

Runtime r4 keeps refresh scheduling SDK-owned through `isTokenAutoRefreshEnabled: true`, observes later token lifecycle results with `onTokenChanged`, and exposes one bounded explicit `getToken(appCheck, true)` refresh path for deterministic lifecycle verification. No custom refresh timer is introduced.

Permanent `tests/contracts/stage4-token-lifecycle-contracts.cjs` PASSED on exact PR #160 branch head `ac465bc781b038860f91620debb7ae7fc7a3e05d`. The proof establishes a distinct later expiry transition, duplicate same-expiry dedupe, bounded force-refresh success/failure, metadata-only observer failure, raw-token redaction, preserved existing Auth/Firestore service identity, unchanged Connected Rivalry authority, and byte-identical canonical local Save state.

## Protected product semantics

Firebase remains Spark / zero billing. App Check enforcement remains OFF. Do not enable App Check enforcement. Firestore remains memory-only. Google Auth remains popup-only with `browserSessionPersistence` and no extra scopes. Trusted-runtime IAM remains reviewed but unactivated/unbroadened. Exactly two private managers remain required. Public discovery, community, matchmaking and global rankings remain prohibited.

Canonical local browser storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`; `activeShowdown` remains non-canonical. Candidate A remains non-mutating export, Candidate B remains read-only analysis, and Candidate C remains the sole destructive remote-to-local Apply authority with backup first, immutable intent, strict exact raw snapshot authority, transaction-owned mutation, stale/anti-clobber rejection, ownership-scoped rollback and exact recovery verification.

The Installable Offline App remains the local-first startup and recovery baseline. App Check token observation or refresh failure must not make ordinary local startup depend on Firebase availability and must not mutate canonical local saves.

## RJR accounting

Fixed RJR-1 is `82/100`. Runtime r4 earns exactly one bounded capability point, 81 → 82, in `production-cloud-security` for deterministic App Check token-lifecycle safety. Source packaging, release notes, CI volume, merge, deployment and repeated subassertions earn zero duplicate readiness credit.

This credit does not include authenticated third-account/revoked registered-device production negatives, two-physical-network behavior, actual Remote Joining sessions, real-device token-lifecycle acceptance, abuse hardening, production rollback proof, or final stable Remote Joining release acceptance.

## Recovery

`1.8.1-r3` is the previous known-good whole shell and the immediate recovery target. If r4 fails exact-head publication or deployed verification, revert the whole runtime generation to r3 rather than partially reverting token-lifecycle files.

A rollback must preserve transaction-owned mutation semantics, strict exact raw snapshot authority, ownership-scoped rollback, unchanged canonical storage authority, the Installable Offline App, and the production-proven r3 Connected Account/App Check recovery behavior.

## Promotion gates

Do not treat r4 as production runtime until one exact unchanged final PR #160 head passes the complete permanent repository contract suite, all 14 permanent PR workflow families, clean review/thread gates and mergeability, then expected-head squash merge under standing owner authorization.

After merge, independently verify the resulting live main, GitHub Pages runtime-byte equality, production App Check path, and the full deployed Stability journey. Only that deployed verification promotes `1.8.1-r4` to production-proven. Deployment itself adds no RJR credit.

Stage 5 host/join/session orchestration remains locked until remaining explicit pre-Stage-5 gates genuinely close. Do not repeat consumed owner pairing/device recovery, unavailable-code, destructive Stage 4 reconciliation, exact replay, deterministic adverse-provider, or deterministic token-lifecycle proof merely for confidence.

## Transition discipline

The active work environment is already at handoff-at-checkpoint pressure. Finish PR #160 publication and deployed r4 verification, then create and seal the recursive SLE/WEC successor package before beginning another substantial product milestone. The successor must independently verify live main/provider/deployment truth and select the smallest genuinely unblocked remaining Remote Joining dependency from current evidence.

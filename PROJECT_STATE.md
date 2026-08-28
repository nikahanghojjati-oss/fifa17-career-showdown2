# CURRENT OVERRIDE — PR #166 PRODUCTION ROLLBACK PROVEN / RJR85 / PR #167 SLE TRANSITION — 2026-08-28 ET

Status: production remains `v1.8.1 / 1.8.1-r5`. PR #166 squash merge / proof-publication main is `32c32afb1365c9ae6120d810a68e5c72c4b8229a`. Fixed RJR-1 is `85/100` after independently verified production rollback and exact restoration. Stage 5 remains locked.

Application: `v1.8.1`
Production runtime: `1.8.1-r5`
Immediate known-good rollback runtime: `1.8.1-r4`
PR #166 publication main: `32c32afb1365c9ae6120d810a68e5c72c4b8229a`
Production rollback proof workflow: `33190961085` — SUCCESS
Rollback proof record: `PRODUCTION_PAGES_ROLLBACK_PROOF_2026-08-28.md`
Current transition PR: #167
Remote Joining readiness: `85/100` under fixed RJR-1

## Current production truth

PR #166 added one bounded one-shot GitHub Pages rollback/restore drill. Workflow run `33190961085` built both artifacts before production mutation, deployed exact known-good `1.8.1-r4` from `2964527c4f7fc80b16d6d5ce73bd4f5823487d2c`, independently observed r4 live from public HTML/runtime identity, restored exact `1.8.1-r5`, independently observed r5 live again, and passed its final seal requiring both boundaries. Production is safely back on r5.

The Installable Offline App remains the local-first startup and recovery baseline. The completed `v1.3.0 Recovery & Device Resilience Hardening` baseline and Local Profiles / Save Library chain remain protected.

The drill changed GitHub Pages runtime bytes only. Firebase Rules, provider IAM, billing, App Check enforcement, Auth persistence/scopes, canonical data and protected historical rivalry state were outside its mutation boundary.

Production-provider publication of the strengthened current `firestore.spark.rules` remains separately unverified. Repository/emulator Rules evidence and GitHub Pages deployment are not provider-live Rules proof.

## RJR truth

Fixed RJR-1 is `85/100`. The production rollback capability was explicitly uncredited at RJR84 and is now independently production-proven, so `real-device-hardening-release` advances exactly 7/10 → 8/10 and total RJR advances exactly `84 → 85`.

Recent evidence-backed accounting remains: r3 account recovery 76 → 78; remote-to-local reconciliation 78 → 79; exact accepted replay 79 → 80; adverse-provider safety 80 → 81; App Check token-lifecycle safety 81 → 82; structural abuse resistance 82 → 83; sustained mutation-frequency resistance 83 → 84; production rollback and exact restoration 84 → 85.

No duplicate credit is awarded for workflow source, PR #166, CI volume, merge, restoration mechanics, documentation or SLE publication.

Still uncredited include legitimate authenticated third-account/revoked registered-device production negatives, two-physical-network behavior, Remote Joining-specific real-device token-lifecycle acceptance, production provider abuse acceptance, actual Stage 5 Remote Joining sessions and final stable Remote Joining release acceptance.

## Current bounded work

Environment `we-2026-08-28-rjr-production-rollback-proof` has completed its one bounded capability and is transition-only. PR #167 must publish the recursive SLE package, seal WEC at Handoff proximity 100%, verify the exact-head transition publication, then stop before another substantive milestone.

The fresh successor must independently verify live main, PR #167 merge/publication, production r5, rollback proof, RJR85 and provider truth; validate/archive the closing WEC; initialize a fresh unique WEC with reset counters and independently observed live-main SHA; assess it; and only if permitted choose the smallest genuinely unblocked remaining RJR dependency. Never inherit the predecessor transition decision.

## Permanent locks

Exactly two private managers. Canonical browser storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`; `activeShowdown` remains non-canonical. Candidate A remains non-mutating export, Candidate B read-only analysis, and Candidate C remains the sole destructive remote-to-local Apply authority with strict exact raw snapshot authority and transaction-owned rollback.

Firebase remains Spark / zero billing. Firestore remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes. App Check enforcement remains OFF. Trusted-runtime IAM remains unactivated/unbroadened. Public discovery, community, matchmaking and global rankings remain prohibited. Historical rivalry `pair_a07108...756fb` must not be forced, edited or deleted.

Consumed proof must not be rerun merely for confidence, including the new r5 → r4 → r5 rollback drill.

Work Environment Continuity and SLE = Smart Lean Efficient remain mandatory. Usage is unavailable and must not be fabricated. Standing owner merge/deploy authorization remains active after all required gates pass; later explicit owner instructions override it.

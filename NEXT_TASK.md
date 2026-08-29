# CURRENT OVERRIDE — PR #168 PRODUCTION AUTHORIZATION ACCEPTANCE — RJR85 — 2026-08-28 ET

Status: production remains `v1.8.1 / 1.8.1-r5`, DEPLOYED / PRODUCTION-PROVEN. PR #167 is merged to live main `640aa6762f0b495c4f2cef198cb27663b8209cce`. Production rollback workflow `33190961085` remains fully successful. Fixed RJR-1 remains `85/100`. STAGE 5 REMAINS LOCKED.

Current environment: `we-2026-08-28-rjr-authorization-negative-acceptance`
Starting independently verified live main: `640aa6762f0b495c4f2cef198cb27663b8209cce`
Current candidate PR: #168
Production runtime: `v1.8.1 / 1.8.1-r5`
Known-good rollback runtime: `1.8.1-r4`
Rollback target commit: `2964527c4f7fc80b16d6d5ce73bd4f5823487d2c`
Rollback proof: `PRODUCTION_PAGES_ROLLBACK_PROOF_2026-08-28.md`

## Current bounded lane

PR #168 adds an auxiliary production authorization acceptance surface without changing normal application runtime identity, `index.html`, Firestore Rules, canonical save authority, App Check enforcement, IAM, billing or Stage 5.

The third-account probe is deliberately read-only. It requires a pre-existing active private account, explicit operator confirmation that the account is neither manager in the target rivalry, explicit confirmation that the target is an existing active paired rivalry, then performs exactly two Firestore reads: `rivalries/{rivalryId}` and `rivalries/{rivalryId}/state/authoritative`. Both must return permission denied. It requests zero provider writes, verifies browser storage is unchanged and emits only SHA-256 fingerprints for sensitive identifiers. A readable boundary is `NOT_PROVEN`, not success.

The revoked-device probe is prerequisite confirmation only. It can confirm a legitimate provider device envelope is already `revoked` and that the existing client registration guard returns `PRIVATE_DEVICE_REVOKED` before staging a write. This is explicitly not provider mutation-denial proof and earns zero RJR credit by itself.

The acceptance page never bootstraps missing Firestore private-account state, never creates pairing or rivalry state and does not make implementation itself RJR evidence. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes.

## Fixed readiness and unverified provider truth

RJR-1 remains exactly `85/100` until legitimate production evidence is actually executed and observed. Source, tests, PR publication and acceptance tooling earn zero capability credit.

Production-provider publication of strengthened `firestore.spark.rules` remains separately unverified. Repository Rules source, emulator proof, GitHub Pages deployment and this acceptance page are not provider Rules publication evidence.

Closed consumed proof remains closed: rollback/restoration, owner/device, Candidate C destructive reconciliation, exact replay, adverse-provider safety, App Check token lifecycle, structural abuse and sustained mutation-rate resistance must not be rerun merely for confidence.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

Finish PR #168 only on an unchanged exact final head after the current implementation, authority reconciliation and final WEC seal are complete. Require all 14 permanent PR workflow families plus mandatory review/thread gates to pass. Merge and deploy under standing owner authorization only if no stop condition exists.

After merge, independently verify live main, publication/deployment state and that the normal application remains `v1.8.1 / 1.8.1-r5`. Verify the auxiliary `production-authorization-acceptance.html` asset is present in the deployed Pages artifact without treating deployment as provider Rules proof.

If a legitimate pre-existing active third private account is actually available, the next evidence action is the production third-account read-only denial probe against a legitimate existing active paired rivalry. Only a real production `PASS` result with both Firestore reads permission-denied, zero requested writes and unchanged browser storage may be evaluated for the still-uncredited authorization-negative capability. Do not manufacture a third account, pairing, rivalry, revoked device or network condition solely to claim evidence.

If no legitimate third-account state exists, leave that capability uncredited and select the next smallest genuinely unblocked RJR dependency from live evidence after a fresh WEC assessment. The revoked-device prerequisite result alone must not be promoted to provider authorization proof. Keep Stage 5 locked until its explicit preconditions genuinely close.

## Permanent locks

Exactly two private managers. Canonical browser storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`; `activeShowdown` remains non-canonical.

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the sole destructive remote-to-local Apply authority with immutable intent, backup-before-Apply, strict exact raw snapshot authority, stale/anti-clobber rejection, transaction-owned rollback and exact recovery verification.

Firebase remains Spark / zero billing. Firestore remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes. App Check enforcement remains OFF. Trusted-runtime IAM remains unactivated/unbroadened. Public discovery/community/matchmaking/global rankings remain prohibited. Historical rivalry `pair_a07108...756fb` must not be forced, edited or deleted.

Standing owner merge/deploy authorization remains active after all required gates pass. Later explicit owner instructions override it.

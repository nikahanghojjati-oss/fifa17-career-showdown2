# FIFA 17 Career Mode Showdown — SLE Successor Handoff — v1.8.0 Reconciliation Candidate to PR

Recorded: 2026-08-24 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
SLE = Smart Lean Efficient.

## 1. Mission

Publish, validate, merge and deploy the already-implemented `v1.8.0 / 1.8.0-r1` Safe Remote Reconciliation candidate without broadening it. Then obtain genuine production reconciliation proof before changing RJR-1 or considering later Stage 4 hardening. Stage 5 remains locked.

## 2. Exact repository boundary

- Independently verified predecessor live `main`: `065222416dbd65e4b7886eaebf9a3f375f7c60a8`, squash merge of PR #135.
- Working branch: `agent/stage4-remote-local-reconciliation`.
- Engineering checkpoint commit: `42b89dfd4859d1655d231d2c04406e66545e45b4`.
- The final transition seal follows that commit and changes only SLE/WEC/context pointers. Resolve its exact branch HEAD live before publication.
- No v1.8.0 pull request, merge, deployment or production reconciliation proof exists at this handoff.
- Current public production remains `v1.7.0 — Connected Rivalry` / `1.7.0-r2`, production-proven and the immediate whole-shell recovery target.
- Current source candidate is `v1.8.0 — Safe Remote Reconciliation` / `1.8.0-r1`, release candidate and not production-proven.
- Production Firestore Rules remain exact blob `ecc8ccb2ab50f0f7057ab3170eb080ad9e36025f`. The branch does not change Rules.

## 3. Delivered implementation

The connected rivalry client now validates SHA-256 integrity for observed authoritative shared state. Remote refresh and preview do not mutate browser storage. Preview prepares a recursively frozen Candidate C intent containing the exact rivalry, remote revision/hash, local Save/profile/role, requested raw bytes and candidate raw bytes.

Explicit Apply requires the displayed exact target/hash confirmation. It shares Candidate C restore serialization, flushes pending writes, checks exact local identity and raw state, verifies the remote envelope before backup, completes and downloads a canonical Candidate A backup, verifies remote and local state again after the asynchronous backup boundary, and applies the exact four-slot transaction through the existing Candidate C storage transaction owner.

Local reconciliation preserves the local Showdown identity, local Save/profile references, existing local season IDs, unrelated Saves, Legacy Showdowns and Preferences. Stale local state, stale remote state, bad integrity, wrong target or anti-clobber violations fail closed. Candidate C retains ownership-scoped reverse rollback and critical recovery classification.

Settings now uses unmistakable `REMOTE OBSERVED`, `LOCAL TARGET` and `LOCAL COMMIT` rows. The Apply action remains disabled until the exact confirmation checkbox is selected. No automatic Apply exists.

## 4. Validation evidence

- Focused `stage4-remote-local-reconciliation-contracts.cjs` passed non-mutation, frozen intent, local identity preservation, stale-local rejection, post-backup remote rejection, backup ordering, exact Candidate C transaction, success and bad-hash rejection.
- Existing Stage 4 Connected Rivalry contracts passed with integrity-checked observation and explicit Candidate C authority.
- Release shell, release authority, SLE packaging and static release gates passed for source `1.8.0 / 1.8.0-r1` and production `1.7.0 / 1.7.0-r2`.
- All 69 repository contracts passed.
- Protected legacy workflow blocks passed.
- Rendered Chromium audit passed non-mutating preview, explicit confirmation, backup download, identity-safe local commit and distinct observed/committed UI.
- Startup budget remained within the protected limit at 163073 raw / 37498 gzip bytes.
- `git diff --check` passed and `firestore.spark.rules` has no branch diff.
- Optional local Firebase emulator dependencies were not installed after a package-manager route disconnected. The permanent GitHub Stage 4 emulator workflow is the required integration authority on the PR.

## 5. Carried review corrections

PR #135 merged with two valid unresolved review findings intentionally assigned to this engineering PR. Both fixes are present:

1. current starter/handoff reporting templates and byte-identical mirrors use exact `Remote Joining readiness: ~Y%`;
2. `tests/contracts/sle-handoff-packaging-contracts.cjs` accepts production-proven candidate status only when candidate and production application/runtime identities match.

The successor should reference these fixes in the PR description and ensure the new PR has no unresolved review threads before merge.

## 6. Publication sequence

1. Verify live `main`, final branch HEAD, changed filenames, current PRs, package/runtime identity, WEC and whether another branch superseded the result.
2. Validate/archive closing WEC `we-2026-08-24-stage4-remote-local-reconciliation`. Its `HANDOFF_NOW` decision belongs only to the closing environment. Initialize a fresh unique WEC and assess before mutation.
3. Publish the exact sealed branch and open one bounded PR to `main` if no equivalent/superseding work exists.
4. Require all 14 permanent pull-request workflow families on the exact unchanged PR head, including the permanent Firebase emulator lane and the new reconciliation browser artifact.
5. Inspect exact job logs before changing code. Apply at most one focused correction for a demonstrated failure; do not restart repository study or install optional tooling as a sidequest.
6. Require submitted review state, all inline threads, mergeability and expected-head protection to be clean.
7. Do not publish Firestore Rules because they are unchanged. Under standing owner authorization, merge only the exact validated head and verify Pages deployment identity and runtime bytes.
8. Only after deployment, run genuine production reconciliation proof with the existing two paired manager accounts. Do not repeat completed Firebase, App Check, Connected Account, device registration or pairing setup absent regression evidence.

## 7. Production proof still required

Production must show remote refresh/preview causes no local storage mutation, the exact displayed remote revision/hash and local target are confirmed, canonical backup finishes before Apply, the intended local Save commits while unrelated Saves and identities remain intact, and the UI distinguishes remote observed revision from local committed revision. A stale or changed remote revision must reject rather than silently rebase.

Do not call v1.8.0 production-proven from merge/deployment alone. Do not move RJR-1 from source, tests, CI, PR, deployment or documentation.

## 8. RJR authority and remaining work

`REMOTE_JOINING_READINESS.json` owns fixed model `RJR-1`, currently `77/100`. Remaining uncredited work includes genuine production remote-to-local reconciliation, exact idempotency replay, third-account and revoked-device production negatives, two-physical-device/two-network hardening, adverse network/token lifecycle behavior, and Stage 5 Private Remote Joining.

## 9. Permanent locks

- Canonical local storage: `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`; `activeShowdown` is non-canonical.
- Candidate A: non-mutating export and canonical backup.
- Candidate B: read-only import analysis.
- Candidate C: sole destructive local Apply authority with immutable intent, strict exact raw snapshot authority, transaction-owned mutation, anti-clobber checks, ownership-scoped rollback and exact recovery verification.
- Exactly two managers and private rivalry authorization only.
- Firebase Spark / zero billing; no Functions or Storage initialization.
- App Check enforcement remains OFF.
- Firestore memory-only.
- Google authentication popup-only with `browserSessionPersistence` and no extra scopes.
- Stage 2H IAM remains reviewed but unactivated and unbroadened.
- No public discovery, public community, matchmaking, rankings or global leaderboard.
- Stage 5 host/join session documents, presence and lobbies remain locked.

## 10. WEC and usage boundary

Closing environment: `we-2026-08-24-stage4-remote-local-reconciliation`.
Closing decision: `HANDOFF_NOW`, driven by the explicit owner usage warning plus elevated quality risk after an interrupted session, not by a product defect.
The successor must not inherit the decision or counters. Validate/archive the record, initialize a new environment, reset observations and assess independently.

The owner reported material account-usage loss but did not supply an exact remaining percentage. `usageRemainingPercent` therefore remains null and unestimated. Use the compact startup path, batch calls, avoid broad history preload and stop a failing route after one correction.

## 11. Owner authorization

`00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md` authorizes current and future project PR merge/deploy after all required gates pass. Do not request repeated publication permission. Exact-head CI, review/thread/mergeability, recovery truth and deployment proof remain mandatory.

## 12. IMMEDIATE NEXT TASK AFTER FULL STUDY

Publish the exact sealed v1.8.0 reconciliation branch, open one PR, pass all 14 exact-head workflow families, resolve reviews/threads, merge under standing authorization without republishing Rules, verify `1.8.0-r1` deployment, and obtain genuine production reconciliation proof. Stop rather than begin Stage 5.

## 13. Mandatory owner reporting

Every substantive owner-facing development response must end with exactly:

Handoff proximity: X%
Remote Joining readiness: ~Y%
Current lane: ...
Concrete dependency completed: ...
Next unlock: ...
Blocker: ...
Sidequest check: ...

At 100%, the successor must create another complete Smart Lean Efficient package with byte-identical root/project mirrors, refresh capsule/context pointers, seal its WEC and stop before the next substantial milestone. This rule propagates recursively until the owner changes it.

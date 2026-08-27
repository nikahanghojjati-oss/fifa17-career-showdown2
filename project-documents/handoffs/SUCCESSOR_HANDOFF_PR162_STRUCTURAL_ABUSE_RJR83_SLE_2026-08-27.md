# Successor Handoff — PR #162 Structural Abuse Hardening / RJR83

SLE = Smart Lean Efficient. This is the deep repository handoff for environment `we-2026-08-27-post-pr161-rjr-successor`. Treat it as orientation only. Current source, live GitHub/provider/deployment evidence and current owner instructions win.

## Executive state

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Verified live `main` at seal preparation: `e5a6b6334499887982ff280ff820eb5d508d9eba`
Application / production runtime: `v1.8.1 / 1.8.1-r4`
Production runtime merge: `2964527c4f7fc80b16d6d5ce73bd4f5823487d2c` (PR #160)
Immediate recovery runtime: `1.8.1-r3`
Fixed Remote Joining readiness: `83/100` under RJR-1
Current open milestone: PR #162 `Prove Stage 4 structural abuse hardening`
Pre-handoff implementation checkpoint: `e932714c590933f8ce138ab45fd6dfa19e3d41ed`
Current environment transition decision: `HANDOFF_NOW`
Handoff proximity at completed package: `100%`

The current environment must not start another substantial engineering milestone. Its WEC quality-risk score crossed the repository hard-transition threshold. The successor must validate/archive this closure, initialize a fresh unique WEC with reset counters, and make its own decision rather than inheriting `HANDOFF_NOW`.

## Why Handoff proximity previously reached 100 and then appeared to restart

Handoff proximity is an environment-local continuity signal. It estimates whether the current development environment should transition; it is not project completion and it is not the RJR score. The predecessor `we-2026-08-27-stage4-token-lifecycle-rjr-be07` reached handoff completeness 100 after PR #160 production proof and correctly stopped. This environment then began fresh, reset its counters as required by `00_WORK_ENVIRONMENT_CONTINUITY.md`, independently returned `CONTINUE`, and built the next bounded capability. Nothing in project progress or RJR was erased. The same rule applies again: this environment closes at 100; the successor starts a fresh WEC while preserving RJR83 and all completed evidence.

## Production authority that remains unchanged

PR #160 `Harden Stage 4 App Check lifecycle` is the production runtime authority. Its final exact head `9b39d9b6032eb24ef98a252ec7de13e129443c95` passed all 14 permanent workflow families and merged to `2964527c4f7fc80b16d6d5ce73bd4f5823487d2c`. Production proof is `V1.8.1_R4_PRODUCTION_PROOF.md`. PR #161 then published the predecessor SLE package to live main `e5a6b6334499887982ff280ff820eb5d508d9eba` with zero RJR credit.

The current-identity Nik/Gop Connected Rivalry reconciliation remains production-proven through `OWNER_PRODUCTION_STAGE4_REMOTE_TO_LOCAL_RECONCILIATION_PROOF_2026-08-25.md`. Exact accepted-result idempotency replay, deterministic adverse-provider safety, and deterministic App Check token-lifecycle safety remain closed evidence-backed capabilities. Do not repeat them merely for volume.

## PR #162 exact evidence and review history

PR #162 began from live main `e5a6b6334499887982ff280ff820eb5d508d9eba`. Original proof head `d32a8242bc4e1c145c1228a1ef1818ff795710fb` passed all 14 permanent workflow families. That proof established:

1. authenticated clients cannot enumerate the private rivalry collection;
2. an authorized modified client cannot create authoritative shared state above the exact ten-season product boundary;
3. an authorized peer cannot update accepted authority above that boundary;
4. denied oversized writes allocate no authoritative shared state or additional idempotency receipt;
5. canonical local Save Library fixtures remain unchanged after denied attempts;
6. the exact ten-season legitimate path remains accepted.

That genuine structural abuse-resistance capability moved fixed RJR exactly `82 → 83`. PR count, CI volume, documentation, publication and SLE work earn zero readiness credit.

Codex then submitted one COMMENTED review with two legitimate unresolved P1 threads.

First finding: the normal `publishSharedState` production projection derives `seasonIds` from payload rounds, so the original proof could not model an attacker forging ten declared `seasonIds` while embedding more than ten actual `payload.rounds`. The branch fixed the underlying issue rather than resolving the thread cosmetically. Candidate `firestore.spark.rules` now requires `payload.rounds` to be a list, requires its count to equal `seasonIds.size()`, and retains the `<= 10` ceiling. `tests/firebase/stage4-abuse-hardening-emulator.cjs` now independently constructs a raw atomic authoritative-state plus idempotency-receipt batch with ten declared season IDs and an eleventh hidden payload round and requires provider denial. The permanent Stage 3/4 Firestore emulator lane passed the strengthened denial.

Second finding: `WORK_ENVIRONMENT_STATUS.json` still described pre-selection work. It was updated to the actual PR #162 lane, RJR83 authority, review finding, strengthened Rules/test work and remaining publication gates.

The stronger forged-payload proof is still the same single credited structural abuse-resistance capability. RJR remains 83.

## Important provider boundary

PR #162 changes no website runtime bytes. It does change repository candidate `firestore.spark.rules`. A repository merge or emulator pass does not prove those Rules bytes are active at the production Firebase provider. The successor must separately verify production-provider Rules publication before claiming the strengthened Rules are live. Until then production runtime remains `v1.8.1 / 1.8.1-r4`, and the strengthened Rules are repository-candidate evidence only.

Firebase remains Spark / zero billing. App Check enforcement remains OFF. Firestore client persistence remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes. Trusted-runtime IAM remains reviewed but unactivated and unbroadened.

## Why PR #162 was not merged by this environment

The environment accumulated high context complexity, multiple completed phases, compaction, routing/correction events and stale-fact corrections. Under the repository-owned WEC formula, quality risk crossed the `>= 80` hard threshold for `HANDOFF_NOW`.

The final exact-head CI attempts were not treated as permission to ignore that transition. In fact the Static repository suite reached the permanent Phase 1F continuity contract and failed specifically because current `NEXT_TASK.md` still routed to PR #162 publication instead of the required transition wording: `Finish the mandatory recursive SLE package ... publish it`. That failure classified the correct next action as handoff sealing, not another product fix.

Therefore PR #162 is intentionally handed over OPEN / UNMERGED at a coherent strengthened evidence boundary. The successor should finish it with fresh context. Do not interpret this as capability regression: RJR83 remains evidence-backed.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

After independently verifying live state and initializing a fresh unique WEC, finish PR #162 before selecting another substantial Remote Joining capability unless live evidence has materially changed:

1. Fetch live `main` and PR #162; record its exact head, changed files, all workflow results, reviews, review threads and mergeability.
2. Confirm the forged hidden-eleventh-round Rules invariant and raw emulator proof still exist.
3. Confirm `REMOTE_JOINING_READINESS.json` still reports fixed RJR-1 `83/100` and that no duplicate credit was introduced.
4. Reconcile transition-era authority files to the fresh successor WEC without reopening completed Stage 1/2 chains.
5. Obtain all 14 permanent workflow families green on one unchanged final PR head.
6. Re-check both Codex review findings against that head; resolve threads only when the fixes remain substantive and green.
7. Under standing owner authorization, expected-head squash merge PR #162 after all required tests and gates pass.
8. Verify resulting live `main` and the complete post-merge run/deployment set.
9. Separately verify production Firebase Firestore Rules publication before claiming the strengthened Rules are production-live.
10. Reassess the fresh WEC. If it returns `CONTINUE`, select the smallest genuinely unblocked remaining RJR dependency. Do not jump directly into Stage 5 unless its explicit preconditions truly close.

## Remaining explicitly uncredited RJR capability

Authenticated third-account and revoked registered-device production negatives already have emulator coverage but require legitimate authenticated production identity/device state for honest production proof. PR #157 established that repository/GitHub execution cannot manufacture that evidence. Synthetic attempts are non-evidence.

Two-physical-network behavior remains separately uncredited. Two-physical-device behavior is already proven and must not be conflated with network diversity. Real-device token-lifecycle acceptance remains uncredited. Broader abuse hardening including rate limiting and production abuse acceptance remains uncredited. Production rollback proof remains uncredited. Actual Remote Joining sessions remain Stage-5-gated. Final stable Remote Joining release acceptance remains uncredited.

## Do not repeat

Do not repeat the consumed unavailable-code owner fixture, pairing/account/device recovery, destructive Candidate C reconciliation, exact replay, deterministic adverse-provider proof, deterministic token-lifecycle proof, or already-proven structural abuse client-path proof merely to accumulate confidence or CI volume. Do not manufacture owner identity/device state. Do not force, edit or delete historical rivalry `pair_a07108...756fb`, whose original local profile/save identities were deleted.

## Permanent product and data locks

Exactly two private managers are required. Canonical browser storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`; `activeShowdown` remains non-canonical. Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the sole destructive remote-to-local Apply authority with strict exact raw snapshot authority, immutable intent, backup-before-Apply, transaction-owned mutation, stale/anti-clobber rejection, ownership-scoped rollback and exact recovery verification.

The Installable Offline App remains the local-first startup/recovery baseline. Ordinary local startup must not depend on Firebase availability. Public discovery, community, matchmaking and global rankings remain prohibited. Stage 5 remains locked until its explicit remaining preconditions genuinely close.

## Standing publication authority

Standing owner merge/deploy authorization remains active through project completion after all required tests and current publication gates pass. Do not repeatedly ask the owner for authorization. A later explicit owner instruction may narrow or override it.

## Successor WEC rule

Do not inherit this environment's `HANDOFF_NOW` decision. Validate/archive its final facts, then create a fresh unique WEC, reset all per-environment counters, set `startingMainSha` to the independently observed live main, assess from fresh evidence and obey that result. Handoff proximity may therefore restart lower in the successor by design. Remote Joining readiness does not reset.

## Required owner-facing checkpoint format

Handoff proximity: X%
Remote Joining readiness: ~Y%
Current lane: ...
Concrete dependency completed: ...
Next unlock: ...
Blocker: ...
Sidequest check: ...

At Handoff proximity 100%, future environments must recursively create the complete mirrored SLE package, refresh repository pointers, run `npm run work:next-prompt`, seal WEC as the final branch mutation, and stop before another substantial milestone.

## Mandatory repository-first next-developer prompt

This handoff recursively preserves the repository-first next-developer prompt standard. Future closers must use `npm run work:next-prompt`; a plain chat-only successor prompt is not a complete project handoff. The successor must begin from `START_NEXT_SESSION_V1.4.24_PR162_STRUCTURAL_ABUSE_RJR83_TRANSITION.md`, use this deep handoff as orientation, independently verify live state, and initialize a fresh WEC before substantive work.
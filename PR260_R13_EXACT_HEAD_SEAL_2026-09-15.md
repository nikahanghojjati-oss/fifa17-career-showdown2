# PR #260 R13 exact-head seal — 2026-09-15

Status: SEALED MERGE CANDIDATE — fresh seal-head POS20 and exactly one fresh Codex review still required before merge.

## Proven R13 product head

The final substantive/product tree proven before this documentation-only seal was:

`5bfe51f637be2854ffa152232ae40a239faedcf1`

Its base/main was independently rechecked as:

`692936d31c39824318ec09fee086dc7ed12fe832`

PR #260 remained open and mergeable at that boundary.

## R13 finding closed

The final unresolved R12 Codex P2 was thread `PRRT_kwDOTomsDM6itV3c`, top comment `4020472806`, “Reuse role reconciliation when opening pair controls.”

R13 closes it by making CONNECT PLAYERS delegate to `CareerModeOnlinePlayerIdentity.syncPair`, which is the existing promise-shared `syncPersistentPairSidecar()` reconciliation path. CONNECT PLAYERS performs the same one bounded retry after an absent or `unavailable` first sidecar result as canonical Continue and no longer calls callback-free `pair.initialize({force:true})`.

Permanent contract coverage requires the shared sidecar path and forbids direct initialization. The permanent real Chromium routing audit reproduces stale local Daniel state against durable Nik / Player Two authority plus one forced transient sidecar failure and requires exactly two sidecar calls, provider-authoritative reconciliation to Nik, `paired/playerTwo`, CAREER READY / CONTINUE CAREER, and no false recovery.

The Codex P2 was replied to with exact-head evidence and resolved only after the full R13 proof closed.

## Exact-head proof

Fresh POS20 run:

`35031179978`

Exact head:

`5bfe51f637be2854ffa152232ae40a239faedcf1`

Result: GREEN.

Passed on that exact head:

- exact selector
- operations authority
- cognitive benchmark
- selected deterministic census: 94/94 blocking contracts
- STATIC
- VISUAL
- STORAGE
- INLINE
- REMOTE
- FULL
- exact-head cognitive seal

The corrected paired-first fixture passed inside the fresh REMOTE/FULL proof; the earlier obsolete REMOTE fixture failure and cancelled parallel-helper runs are not merge evidence.

## Release and budget

Application version: `v1.9.1`

Runtime asset revision: `1.9.1-r22`

Previous known-good recovery runtime: `1.9.1-r21`

Protected startup shell on the proven exact head:

- raw: `162647` bytes
- gzip: `37469` bytes
- ceilings remain `165000 / 37500`

R22 is required because R13 changes service-worker-cached runtime bytes. Whole-shell coherence advances current runtime to r22 while preserving r21 as recovery. The temporary runtime-promotion/proof helpers are absent from the sealed product tree.

## Permanent product constraints preserved

- Daniel is permanently Player One.
- Nik is permanently Player Two.
- Single Start a Showdown / Continue Career product surface.
- No public discovery or list authority.
- Firebase remains Spark only.
- Billing remains permanently OFF.
- No Cloud Run, Cloud Functions or paid compute dependency.
- App Check enforcement remains OFF unless separately governed later.
- Existing provider, recovery and local-storage machinery remains internal resilience infrastructure rather than another player-facing mode.

## Progress authority

SSJR-1.1 remains exactly `0/100`. No source commit, CI pass, seal, merge or deployment earns physical-journey credit.

MDP remains `95.50/100` unless its separately governed evidence changes it.

## Final merge gate from this seal

This file is documentation-only and deliberately advances the branch beyond the proven product head. Therefore no pre-seal CI evidence may be treated as exact-head merge authority for the seal commit.

Before merging PR #260, independently require all of the following on the exact live seal head:

1. Branch head is unchanged from the head being evaluated.
2. `main` has not changed unexpectedly from `692936d31c39824318ec09fee086dc7ed12fe832`; if it has, reconcile first.
3. One fresh POS20 run on the exact seal head completes green across every selected lane and its exact-head cognitive seal.
4. Exactly one fresh Codex review is requested/performed against that same exact seal head.
5. The fresh Codex review produces no unresolved substantive finding. If it does, fix, re-prove, re-seal and restart the exact-head gate instead of merging around it.
6. Every substantive PR review thread is resolved.
7. PR #260 remains mergeable.
8. Merge using a normal merge commit with expected head SHA protection; do not squash or rebase away exact-head provenance.

## Post-merge gate

After normal merge, independently resolve the merged `main` SHA and require both of these on that exact merged main before asking Nik to begin physical testing:

- GitHub Pages deployment/provenance succeeds for the merged release and production serves `v1.9.1 / 1.9.1-r22`.
- Permanent Firestore Rules rules-only deployment/readback succeeds from the governed zero-billing workflow, with Firebase still Spark and Billing OFF.

Only after both production gates succeed is it legitimate to tell the owner: “It is your testing time.”

# PR224 acceptance actor contract review

Status: actor-contract contradiction reconciled in the versioned v2 acceptance path; PR224 remains publication-pending until the final authority head receives exact-head validation and fresh review.

SSJR remains 0/100. MDP remains 39.00/100. Implementation, CI, review activity, publication and handoff work grant no product credit. Genuine production evidence is still required.

## Historical conflict

The legacy v1 pair contract required all eight negative denial classes inside each bound manager's evidence bundle. That requirement could not be satisfied truthfully because three denial classes have mutually exclusive actors:

| Check | Truthful actor |
| --- | --- |
| Draw field substitution | The immutable Shared Setup coordinator |
| Coordinator bypass | The manager who is not the coordinator |
| Unrelated account | A separate authenticated account outside the rivalry |

The unrelated account cannot simultaneously be either of the two bound managers, the non-coordinator cannot truthfully execute the coordinator-only draw-substitution path, and the coordinator cannot truthfully execute the non-coordinator bypass path. Copying observations, relabeling actors, creating a different rivalry, accepting operator assertions or weakening source/code checks would fabricate evidence.

The legacy v1 validator remains strict. Historical evidence is not upgraded or reinterpreted.

## Implemented v2 reconciliation

PR224 now implements a separately versioned actor-attributed acceptance path while preserving both complete positive manager journeys.

The v2 contract requires:

1. Player One and Player Two each independently complete the exact production positive journey under distinct manager roles, remote roles, accounts and registered browser identities.
2. Both managers target the exact same Connected Rivalry, initial ACTIVE private session, fresh ACTIVE resume session and identical final Shared Setup.
3. Canonical gameplay storage remains byte-equivalent through each positive journey and raw private authority is excluded from exported evidence.
4. Five manager-applicable denial classes are directly observed by both bound managers: wrong session, expired session, revoked identity, stale revision and replay conflict.
5. Direct field substitution is directly observed only from the immutable coordinator.
6. Coordinator bypass is directly observed only from the non-coordinator.
7. Unrelated-account denial is directly observed from a separate authenticated adversarial witness that is not either bound manager and is never added as a third manager.

This yields 13 required direct production denial observations: five common denials from each of two managers, one coordinator-only denial, one non-coordinator-only denial and one unrelated-account witness denial.

Every bound observation is tied to the actual executing manager role, privacy-safe account/device/rivalry fingerprints, one proven journey session fingerprint, coordinator role, exact source/code pair, unchanged local storage and direct-production provenance. Witness evidence is separately typed and must target the same rivalry while using an account distinct from both managers.

The v2 validator fails closed on missing coverage, wrong actor roles, cross-rivalry evidence, wrong or unproven sessions, reused manager identity, malformed source/code pairs, unknown fields, raw private authority, canonical setup mismatch, non-distinct managers, old-schema substitution and incomplete witness evidence.

Relevant executable sources include `js/ssjrProductionNegativeEvidence.js`, `js/ssjrProductionNegativeProbeRunner.js`, `scripts/ssjr-actor-evidence-v2.mjs`, `scripts/assemble-ssjr-shared-setup-actor-evidence.mjs`, `scripts/validate-ssjr-shared-setup-actor-evidence.mjs`, and the corresponding contract/browser audits.

## Operator and browser behavior

Ordinary product mode does not load the acceptance tooling.

Manager acceptance mode preserves the guided positive recorder and exposes only the seven truthful bound-manager denial controls. The legacy all-eight-per-manager panel remains present only for compatibility and is hidden from the current operator flow. The actor panel is embedded inside the guided recorder scroll surface so its controls remain normally tappable on the 390px mobile acceptance viewport.

Witness mode is isolated from the manager positive recorder. It exposes only the unrelated-account witness path and does not make the witness a third manager.

The browser and ledger persist only allow-listed privacy-safe evidence. Billing, Blaze, Cloud Run, Cloud Functions and App Check enforcement cannot be enabled by this acceptance tooling.

## Exact-head validation

Substantive implementation head `991036dce94dac9f9e667ec4d29d73c6b1c8247a` passed POS20 run `34289890479` on one exact head.

The successful matrix includes the POS20 exact selector, operations authority, cognitive benchmark, complete selected deterministic census, STATIC, STORAGE, REMOTE, INLINE, VISUAL, FULL and the POS20 exact-head cognitive seal.

The FULL browser lane passed the guided recorder actor-attributed v2 flow and the dedicated v2 ordinary/manager/witness browser audit after the acceptance layout and Chromium harness corrections. Evidence from earlier failed heads is not combined with this final substantive-head proof.

## Remaining evidence debt

The acceptance actor-contract contradiction is no longer a blocker in the v2 path.

The remaining blocking SSJR debt is the genuine production two-account Shared Setup evidence itself. Neither CI nor emulator evidence can substitute for those direct production observations. No production denial, positive manager journey or physical acceptance result is manufactured by PR224.

## Publication decision still pending

PR224 must not be merged solely because the substantive implementation head is green. The authority records must first be reconciled to the implemented v2 contract, the resulting exact authority head must pass its own required POS20 validation, and a fresh after-resolution review must find no concrete blocker.

If that final review is clean, PR224 may proceed through expected-head-protected publication. Production evidence capture remains a separate post-publication SSJR task and still earns credit only when the required real observations exist and pass the canonical validator.

Billing stays permanently OFF. Firebase remains Spark only. App Check enforcement remains OFF. Exactly two private managers remain required. Pairing plus exact ACTIVE remains mandatory before league or club authority. Candidate C remains the only destructive remote-to-local Apply authority. Canonical gameplay storage and the ban on public discovery, matchmaking, community and rankings remain unchanged.

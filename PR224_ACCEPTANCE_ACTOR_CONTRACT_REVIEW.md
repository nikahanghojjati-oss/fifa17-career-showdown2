# PR224 acceptance actor contract review

Status: publication blocked pending explicit acceptance-contract reconciliation.

SSJR remains 0/100. MDP remains 39.00/100. None of the corrections, automated tests, review activity or publication steps grants product credit.

## Executable conflict

The current pair validator requires all eight negative keys to be `denied` in each manager's evidence. The negative assembler also requires that each negative bundle have the exact account, device, manager and rivalry fingerprints of its positive bundle.

The production probe paths cannot truthfully satisfy that combination:

| Check | Required actor in the implemented path | Conflict with requiring it from both bound managers |
| --- | --- | --- |
| Wrong session | An authenticated manager in this rivalry | No actor conflict. Production denial remains to be observed. |
| Expired session | An authenticated manager, after actual session expiry | No actor conflict. A future clock substitution is not an observed expiry. |
| Revoked identity | An active manager using a separate sacrificial device | No actor conflict. Existing Stage 5F provider proof is reused; the real browser is never revoked. |
| Stale revision | An authenticated manager in this rivalry | No actor conflict. Production denial remains to be observed. |
| Replay conflict | An authenticated manager after an accepted setup operation | No actor conflict. Production denial remains to be observed. |
| Draw field substitution | The coordinator, before the relevant draw | The other manager is rejected earlier by the coordinator guard and cannot honestly report the draw-mismatch code. |
| Coordinator bypass | The manager who is not the coordinator | The coordinator is authorized for this action and cannot honestly act as the other manager. |
| Unrelated account | A separate authenticated account outside the rivalry | That account cannot simultaneously match either positive bundle's bound manager identity. |

The coordinator is part of the immutable Shared Setup state. Swapping roles, creating another rivalry, copying another actor's observation, trusting an operator checkbox, or relabeling a different error does not prove these checks for the same actor and rivalry.

Relevant executable sources: `js/sharedShowdownSetup.js`, `js/ssjrProductionNegativeProbeRunner.js`, `js/ssjrProductionNegativeEvidence.js`, `scripts/assemble-ssjr-shared-setup-safe-evidence.mjs`, and `scripts/validate-ssjr-shared-setup-production-evidence.mjs`.

## Bounded corrections prepared in this continuation

The negative ledger helpers are namespaced without relaxing the static gate. POS20 full seals now include all registered supplemental contracts even when the changed file is unrelated documentation. The assembler calls the existing canonical single-bundle validator before emitting JSON, so nested unknown fields, invalid final setup digests and invalid checkpoint order fail before output. The validator's acceptance requirements are unchanged.

The runner uses the existing canonical storage read authority and fails when it is unavailable. It no longer assembles the storage API name to bypass the static ownership rule. Its observations carry hashes of the actual executing identity; the ledger rejects mismatches and results that arrive after a reset. An expired-session observation requires actual wall-clock expiry, with the original active context retained only in memory for a retry on the same open page. Unrelated-account capture fails explicitly while the contradictory actor contract is unresolved.

Acceptance mode now exposes eight named controls, prerequisite guidance, pending/observed statuses and a complete-negative download that remains disabled until all required observations exist. A positive download is labeled as completion of the positive steps only. The controls do not load in ordinary product mode. Incompatible actor checks remain blocked rather than marked as passed.

## Concrete proposed resolution, not yet authorized or implemented

Keep both managers' complete positive gameplay journeys mandatory, including each manager independently witnessing the canonical screens, exact ACTIVE authority, identical setup, reload/resume, fresh-session resume and unchanged canonical storage.

Introduce a separately versioned, journey-level negative evidence bundle with all eight required denial classes. Preserve exact production/rivalry binding and record the actual executing actor fingerprint, actor role, device fingerprint, session fingerprint, observed source/code and production deployment identity for each observation. Run each manager-applicable check from both managers. Run draw substitution from the actual coordinator, coordinator bypass from the actual other manager, and unrelated-account denial from an authenticated tester who is not added to the rivalry. That tester is an adversarial witness, not a third manager.

The pair validator would then require both complete manager journeys plus complete, correctly attributed negative coverage. It must reject missing actor coverage, cross-rivalry evidence, wrong execution roles, fabricated operator assertions, invented source/code pairs, old schema substitution, reused observations and raw private authority. All eight denial classes stay mandatory. No historical SSJR evidence is upgraded automatically.

This changes the existing per-manager acceptance requirement and therefore remains a proposal. The current validator must continue rejecting incomplete bundles until that requirement is explicitly reconciled. Fresh review should assess this conflict as well as the code fixes. Do not merge PR224 solely because CI is green or the original review threads are resolved.

## Next action

Finish exact-head validation and fresh after-resolution review of this correction packet. Resolve any new concrete findings. Obtain an explicit decision on the actor attribution proposal before implementing the acceptance schema change. Do not ask the owner to repeat a physical acceptance run that cannot pass the current contract.

Billing stays permanently OFF, Firebase remains Spark, App Check enforcement remains OFF, and all other permanent product guards remain in force.

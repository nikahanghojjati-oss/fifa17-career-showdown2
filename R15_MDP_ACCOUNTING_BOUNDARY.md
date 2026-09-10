# r15 MDP accounting boundary

This is an accounting/provenance boundary only. It changes no executable product behavior and earns no additional MDP or SSJR credit by itself.

Product integration authority is exact main `4d202126ce1606a4e3f74c09b31201cf4ec51c6e`, created by expected-head squash merge of PR #244. Runtime `1.9.1-r15` is coherently deployed by GitHub Pages run #119. Main POS20 #388 passed every selected lane and its exact-head cognitive seal. Release Integration Burn-In #376 passed both independent matrix journeys (`pass-1` and `pass-2`).

The resulting MDP lifecycle accounting is `86.50/100`: Journey Conflicts is fully integrated across all six MDP stages, while Local Reconciliation, Final Reconciliation, Terminal Close, Physical Journey and Stable Journey Release remain design-defined only. SSJR-1.1 remains exactly `0/100`; r15 production evidence remains zero-credit until genuine production-two-account acceptance exists.

The first r15 accounting workflow staging attempt was invalid YAML and created no job. The first valid accounting run applied the proposed update in its runner but correctly failed the anti-inflation contract because the out-of-order negative fixture still targeted Journey Conflicts after that capability became integrated. No accounting commit was pushed. The corrected run retargeted that negative fixture to the next design-only capability, Local Reconciliation, then passed the MDP contract, all POS20 operations tests and diff checks before producing bot commit `babcfdd1ccbd1f79845bd9a5cdc3a0572a666215` and deleting its temporary tooling.

This connector-authored commit is the exact accounting candidate boundary. A fresh normal PR POS20 must pass on this exact head before merge. Evidence from failed or superseded accounting heads must not be combined.

Next product capability after accounting merge: `local-reconciliation`, frozen weight 5. Reuse the existing Candidate B read-only preview and Candidate C backup-first Apply/rollback authority; do not duplicate or broaden destructive local-save authority. Permanent Spark-only, zero-billing, no-list, private-two-manager and canonical-local-save locks remain unchanged.

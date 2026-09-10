# r16 MDP accounting boundary

This is an accounting/provenance boundary only. It changes no executable product behavior and earns no additional MDP or SSJR credit by itself.

Product integration authority is exact main `613e031c648d8d5cdb4e260e74cd93f895f49872`, created by expected-head squash merge of PR #246 from exact publication head `faf14a43069bc55754c1a8ad84dd9ae3ca4aef31`. Runtime `1.9.1-r16` is coherently deployed by GitHub Pages run #122. Publication-head POS20 #397 and exact-main POS20 #399 passed every selected lane and their exact-head cognitive seals. Release Integration Burn-In #379 passed both independent stateful journeys (`pass-1` and `pass-2`).

The resulting MDP lifecycle accounting is `91.00/100`: Local Reconciliation is fully integrated across all six MDP stages, while Final Reconciliation, Terminal Close, Physical Journey and Stable Journey Release remain design-defined only. SSJR-1.1 remains exactly `0/100`; r16 production evidence remains zero-credit until genuine production-two-account acceptance exists.

r16 preserves Candidate B as a non-destructive preview and Candidate C as the sole explicit backup-first destructive local Apply/rollback authority. Unrelated local saves remain immutable, adverse-network mutation fails closed, and no new Firestore collection, broad list permission, automatic canonical local-save mutation, paid tier, Cloud Run or Cloud Functions dependency was introduced.

The first oversized accounting workflow definition failed before any job existed, so it produced no accounting mutation or evidence. The simplified guarded run then successfully produced the proposed `91.00/100` ledger in its runner and passed the deterministic MDP contract, direct assessor and all 73 POS20 operations tests, but correctly refused to commit because its diff allowlist used `git diff --name-only` and therefore omitted the new untracked boundary file. After changing only that diff census to include untracked files, the guarded publisher passed the same accounting validations plus the exact five-file allowlist, produced accounting commit `3802b322141328558dabd111d766d1f6f3c3abaf`, and self-cleaned in `d27595517c3769d3ecf38890a2a285466a850c04`.

This connector-authored commit is the exact final accounting candidate boundary. A fresh normal PR POS20 must pass on this exact head before merge. Evidence from failed, bot-only, or superseded accounting heads must not be combined.

Next product capability after accounting merge: `final-reconciliation`, frozen weight 3. Use the established canonical scoring and accumulated showdown winner authority after all configured seasons are accepted; do not invent new final scoring or collapse Terminal Close into this capability. Permanent Spark-only, zero-billing, no-list, private-two-manager and canonical-local-save locks remain unchanged.

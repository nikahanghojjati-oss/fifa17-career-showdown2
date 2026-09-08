# CURRENT TASK — POS-4 FAILURE-RESISTANT OPERATIONS, THEN SHARED SETUP

`PROJECT_OPERATING_SYSTEM_V4.md` governs project process. `CURRENT_PRODUCT_GUARDS.json` governs stable product and safety invariants. Live GitHub, provider and deployed evidence override recorded state and historical handoffs.

PR #215 is merged. Exact main publication boundary: `72b44278013870e7607b9b0083e52fdff8145a37`.
Production authority remains `v1.9.1 / 1.9.1-r5` until exact-main Stability including Chromium and deployed-site smoke, GitHub Pages r6 deployment, and Release Integration Burn-In all complete successfully on that boundary. Do not infer r6 production authority from PR-head green evidence.

The POS-4 implementation branch is `ops/pos4-failure-resistant`, created directly from that exact main boundary. POS-4 changes must stay isolated from the in-flight r6 publication proof.

RJR-1 remains frozen completed 100/100 evidence. SSJR-1.1 remains the current product-readiness metric. MDP-1 remains the current engineering-lifecycle metric until an explicit reviewed MDP-2 migration is activated.

## Immediate next task

1. Independently finish exact-main r6 publication verification for `72b44278013870e7607b9b0083e52fdff8145a37`: all relevant main-push families, Stability contracts, Chromium, deployed-site smoke, Pages, and Release Integration Burn-In. Never combine evidence across heads.
2. On `ops/pos4-failure-resistant`, land one atomic POS-4 operating-system batch implementing RB-1, TDS-2, ADB-3, FC-1, GP-1 and RCP-2. Do not split this operating-system migration into a sequence of tiny CI-triggering commits.
3. Run the small POS-4 operations audit and the complete FC-1 current-product census. GP-1 must detect actual process-authority imports, not harmless explanatory mentions.
4. For the entire failure census, classify failures before editing: PRODUCT_DEFECT, TEST_DEFECT, PROCESS_DRIFT, DORMANT_PROVENANCE, INFRA_FLAKE or UNKNOWN. Batch coherent corrections where safe instead of one-failure-per-fanout iteration.
5. Keep real product/security/recovery/UI/UX/data/provider/release regressions blocking. Remove, update or archive only administrative, superseded or duplicate blockers whose current invariant has a stronger direct owner.
6. Open one focused POS-4 PR. Put RB-1 only in PR metadata/body; never commit the beacon or create a continuity-only PR.
7. After exact-head POS-4 product/operations validation is green and reviewed, merge with expected-head protection. Do not require a separate SNS/SLE/WEC publication cycle.
8. Once r6 itself is independently production-proven, resume genuine Shared Setup product/evidence progress. Update MDP only for lifecycle exit rules actually satisfied and recalculate SSJR only from accepted genuine two-account production evidence.
9. Continue directly into the next unfinished SSJR product capability after Shared Setup according to the current dependency graph.

## POS-4 testing lanes

- `npm run test:contracts`: FC-1 complete current-product failure census. It runs all independent blocking contracts before returning nonzero.
- `npm run test:ops`: small POS-4 operations and gate-purity self-test when operating tooling changes.
- `npm run test:legacy-provenance`: manual historical/provenance audit only.
- `npm run test:dormant-architecture`: manual rejected/superseded architecture audit only.
- `npm run test:contracts:all`: deliberate full historical/operations/product audit only, not the normal product loop.

Stability owns the complete current-product census once. Static App and specialist workflows remain focused. Exact workflow counts, old PR/run IDs, completed milestone wording and handoff prose are not product gates.

## Interruption resilience and transfer

RB-1 is the non-Git Recovery Beacon stored in active PR metadata. Refresh it at coherent safe checkpoints without changing the code head or launching CI.

TDS-2 has only three transfer states: `CONTINUE`, `TRANSFER_AFTER_ATOMIC`, `TRANSFER_NOW`. There is no handoff percentage. The owner does not need to ask for SNS during normal work.

ADB-3 is the failure-aware adaptive 3-to-20 correction budget. Diagnosis, polling, successful reads and unreproduced infrastructure flakes do not consume an attempt.

RCP-2 is a single external Resume Capsule generated only at a real transfer. Never commit it and never open a continuity-only PR merely to publish it.

If the ChatGPT UI shows a usage warning the assistant cannot see, the owner reports it once. That is a hard TDS-2 transfer trigger at the next safe atomic boundary.

## Permanent product locks

Billing remains permanently OFF and Firebase remains Spark. Never enable Blaze, Cloud Billing/account linkage, Cloud Run or Cloud Functions. App Check enforcement remains OFF. Firestore browser persistence remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes.

Exactly two private managers. Connected Rivalry pairing plus exact ACTIVE precedes league or club authority. Candidate C remains the sole destructive remote-to-local gameplay Apply authority with exact transaction-owned rollback.

Canonical local storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`.

No public discovery, listing, lobby, matchmaking, community, rankings or global leaderboards. Never durably retain raw private capability/account/device/rivalry/session/pairing identifiers.

`SSJR-DUAL-FULL-SCREEN-1` remains permanent: both legitimate managers individually experience every canonical Shared Showdown gameplay screen on their own device, including ordered replay of missed screens after reload/reconnect/offline recovery.

Use `npm run record:ssjr-production-shared-setup` for private Shared Setup observations and `npm run validate:ssjr-production-shared-setup -- <player-one-evidence.json> <player-two-evidence.json>` for sanitized validation.

MDP task delta remains +0.00 until a capability lifecycle exit rule is genuinely satisfied.

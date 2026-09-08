# Career Mode Showdown Project Operating System v4

Status: current project operating authority.

POS v4 is a failure-resistant operating model for shipping the product. It preserves POS v2/v3's product/safety discipline while eliminating the remaining causes of repeated false-red CI, continuity churn, exact-head invalidation and abrupt-session recovery loss.

## 1. Authority order

1. Later explicit owner instruction.
2. Current verified source, live GitHub state, provider state and deployed behavior.
3. `CURRENT_PRODUCT_GUARDS.json`, active product/evidence models and executable release authority.
4. `NEXT_TASK.md`.
5. The active PR Recovery Beacon when present.
6. A Resume Capsule when an actual transfer occurred.
7. Historical handoffs, WEC records, completed milestone ledgers and provenance.

Recorded SHAs and historical handoffs are orientation only until live state is independently reverified. Never combine CI evidence across heads.

## 2. Product metrics

- SSJR stays active and unchanged as the accepted two-manager product-readiness metric.
- MDP keeps its engineering-lifecycle purpose. MDP-1 remains current until the separately reviewed MDP-2 migration is activated; do not rewrite MDP-1 history.
- RJR-1 remains frozen completed evidence at 100/100. Only regression tests for still-used shipped behavior remain relevant.

No continuity/session mechanism earns product progress.

## 3. RB-1 Recovery Beacon

RB-1 is the primary interruption-resilience mechanism. It is a tiny machine-readable/hidden checkpoint stored in active PR metadata, not in the Git tree.

The beacon records only the last safe recoverable boundary: PR/branch, recorded head, current lane, blocker class, last safe checkpoint and exact next action. It is orientation only; a successor still re-verifies live authority.

Update RB-1 after a coherent repository commit, after blocker reclassification, before starting a risky multi-step publication/deployment operation, or when TDS-2 says recovery state is stale. Do not update it after every read/tool call.

RB-1 must not create commits, change the PR head, trigger CI, alter product files, or become a product gate. If there is no active PR, use an external RCP-2 capsule at the next real transfer and rely on current branch/NEXT_TASK for ordinary durability.

## 4. TDS-2 Transfer Decision Signal

There is no handoff percentage. TDS-2 has only three owner-relevant states:

- `CONTINUE`: keep working.
- `TRANSFER_AFTER_ATOMIC`: finish or safely abort the current atomic operation, refresh RB-1, then transfer.
- `TRANSFER_NOW`: refresh RB-1 and generate one RCP-2 Resume Capsule immediately.

Beacon freshness is independent of transfer state. A beacon may be due while TDS-2 remains CONTINUE.

Hard transfer triggers: explicit owner request, owner-reported platform usage warning/critically low allowance, another substantial task would risk unrecoverable context, ADB-3 exhausted with unresolved failure, or severe reconstruction plus repeated unresolved correction cycles.

Session age, message count, successful reads, successful tool calls, commit count and a single interruption do not by themselves force transfer.

## 5. ADB-3 Failure-Aware Adaptive Debug Budget

ADB-3 retains a dynamic 3–20 failed correction/validation budget, but now incorporates failure classification.

Failure classes:
- `PRODUCT_DEFECT`: runtime/UI/data/sync/recovery/security/privacy/provider/release behavior is wrong.
- `TEST_DEFECT`: a useful test is logically wrong, stale or self-referential while the protected product invariant remains valid.
- `PROCESS_DRIFT`: handoff/provenance/milestone/topology wording is blocking unrelated product work.
- `DORMANT_PROVENANCE`: rejected/superseded architecture or completed milestone evidence.
- `INFRA_FLAKE`: runner/provider/network/tool failure not reproduced as a product defect.
- `UNKNOWN`: not yet classified.

A meaningful correction followed by validation consumes one attempt. Reading logs, diagnosis, polling, successful validation and unreproduced infrastructure flakes do not.

Narrow TEST_DEFECT/PROCESS_DRIFT work with healthy context may receive a high budget. Broad PRODUCT_DEFECT/UNKNOWN failures, multiple unresolved families or reconstructed context shrink it. The budget is not a universal 20-attempt quota.

## 6. FC-1 Failure Census

The canonical current-product contract runner must execute every current blocking contract in one census and report all failures before exiting non-zero.

Fail-fast is appropriate inside an individual test when continuing would corrupt state, but the repository-level runner must not stop after the first independent contract failure. This prevents the historical pattern of one full CI fanout revealing one stale gate, one fix, then another fanout revealing the next stale gate.

After one census, classify the whole failure set and batch coherent corrections into one tested commit whenever safe.

## 7. GP-1 Product Gate Purity

A blocking product gate may depend only on executable/current product authority required to protect its invariant.

Active product gates must not import or require `NEXT_TASK.md`, `00_CURRENT_HANDOFF.md`, WEC state/archive, START_NEXT_SESSION/SUCCESSOR_HANDOFF packages, completed RJR score ledgers, or POS/SNS/SLE packaging merely to prove runtime/security correctness.

A permanent safety gate must prove safety from machine guards, configuration, executable workflow commands, Rules/source, runtime behavior or current evidence schema. Documentation may explain the invariant but is not the enforcement source.

Forbidden-action tests must inspect executable/config behavior rather than fail because explanatory comments name the action being forbidden.

## 8. Test/CI ownership

1. Stability owns the complete current product contract census once.
2. Static App owns syntax/static architecture plus focused current emulator safety; no full-suite duplication.
3. Specialist workflows own focused risk domains only.
4. Historical/provenance and dormant architecture remain manual-only.
5. Preserve required workflow/check names until branch-protection requirements can be observed; optimize work inside those identities rather than deleting them blindly.
6. Use targeted checks while developing and reserve full publication/release fanout for a candidate head or genuinely broad/security-sensitive risk.
7. Prefer one coherent tested commit over many tiny commits that each trigger the same remote matrix.

## 9. Failure history lessons encoded in POS v4

Keep/strengthen tests for failures that actually harmed the product:
- stale Connected Rivalry convergence and pointer precedence;
- lost acknowledgement, retry/idempotency and offline/reconnect recovery;
- real recorder/evidence schema compatibility;
- deployed artifact/cache/service-worker completeness;
- provider authorization/no-listing/exact-path privacy;
- Candidate C exact snapshot, stale precondition and rollback ownership;
- both-manager presentation while provider authority remains sole;
- browser DOM/control-flow defects only visible in realistic journeys.

Remove/archive/update repeated false blocker families:
- handoff/SLE/SNS/provenance literal mismatches;
- old PR/RJR/WEC narration;
- dormant Cloud Run/custom credential architecture;
- exact workflow/block/timeout command-count magic numbers;
- provider proof run IDs when current behavior/config has a stronger direct owner;
- safety regexes that match warning comments instead of executable behavior;
- permanent control-plane tests that require current handoff inheritance.

## 10. RCP-2 Resume Capsule

RCP-2 is generated only for a real transfer. It is an external single artifact, not a repository commit and not a continuity-only PR.

It contains repository/PR/branch, recorded head as orientation, current lane, last safe checkpoint, unresolved blocker classes, exact next action, transition reason, and the instruction to independently reverify live main/head/checks/reviews/deployment before editing.

RB-1 makes abrupt interruption survivable even when RCP-2 was never generated.

## 11. Successor startup

Normal startup loads only:
1. `PROJECT_OPERATING_SYSTEM_V4.md`;
2. `CURRENT_PRODUCT_GUARDS.json`;
3. `NEXT_TASK.md`;
4. active PR info including RB-1 when present;
5. RCP-2 only if a real transfer supplied one.

Do not load WEC archives, old starter families, deep handoffs, old SNS/SLE packages or completed RJR ledgers unless the live blocker specifically needs historical evidence.

## 12. Legacy dispositions

- SHP percentage: retired.
- HTR numerical score: retired.
- WEC: historical recovery provenance only.
- SLE: Smart Lean Efficient principle only, nonblocking.
- SNS: superseded for new transfers by RB-1 + RCP-2.
- VTLS/per-task successor files: retired.
- continuity-only PRs: prohibited absent a unique repository-recovery hazard.
- POS v2/v3 files: historical operating-system provenance, not startup authority.

## 13. Permanent product locks

`CURRENT_PRODUCT_GUARDS.json` remains the compact machine authority.

Billing remains OFF and Firebase remains Spark. Never enable Blaze, Cloud Billing/account linkage, Cloud Run or Cloud Functions. App Check enforcement remains OFF. Firestore browser persistence remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes.

Exactly two private managers. Connected Rivalry pairing plus exact ACTIVE precedes league or club authority. Candidate C remains the sole destructive remote-to-local gameplay Apply authority with transaction-owned exact rollback.

Canonical local storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`.

No public discovery, listing, lobby, matchmaking, community, rankings or global leaderboards. `SSJR-DUAL-FULL-SCREEN-1` remains permanent.

## 14. Owner reporting

Normal reporting centers on SSJR, MDP, current lane, concrete dependency completed, blocker and next product unlock.

The owner does not need to ask for SNS. Report TDS-2 only when it changes or when asked. If the ChatGPT UI shows a usage warning the assistant cannot see, the owner reports it once; that becomes a hard transfer trigger at the next safe boundary.

## 15. Core rule

One investigation should reveal the whole relevant failure set. One current invariant should have one clear blocking owner. Recovery state must survive interruption without changing the code head. Spend compute on product risk, not on proving that project paperwork agrees with itself.

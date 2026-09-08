# Career Mode Showdown Project Operating System v8

Status: candidate authority on PR #220 until exact-head validation and merge.

POS8 keeps the validated POS7 IMPACT-7 routing work and adds a crash shield. The goal is not to pretend repository code can stop ChatGPT, browser, network, tool-runtime, or capacity interruptions. The goal is to make those interruptions stop behaving like project crashes.

## 1. What the latest interruption proved

The exact external platform trigger is not observable from the repository and must not be invented. The project-side failure mechanism is observable:

1. POS7 code and local tests existed beyond the last durable GitHub candidate head.
2. The active reasoning state knew the exact next corrections, but part of that state lived only inside the developer environment.
3. Publishing every partial checkpoint directly to the PR branch would have relaunched expensive candidate CI, so durability and candidate publication were coupled.
4. The environment ended before that local work was durably promoted.
5. Recovery therefore required reconstructing the work from surviving files/tool history instead of simply resuming from a durable work-in-progress ref.

POS5 reduced crash loss to one Atomic Work Unit. POS6 reduced unnecessary CI. POS7 made proof selection exact. POS8 closes the remaining gap: durable unfinished work no longer has to be the same Git head as the expensive PR candidate.

## 2. TX-8 transactional recovery

Every mutation lane is a transaction with these durable phases:

- `INTENT_DURABLE`: the PR recovery block names the candidate branch/head, one shadow recovery branch, the Atomic Work Unit, last safe checkpoint and exact next action before mutation begins.
- `SHADOW_WORKING`: work-in-progress checkpoints are committed to the shadow recovery branch, not the PR candidate branch.
- `SHADOW_READY`: the coherent Atomic Work Unit is durable and targeted validation is green.
- `CANDIDATE_PUBLISHED`: the PR branch is promoted once to the reviewed shadow head. No further mutation occurs while exact-head candidate proof is pending.
- `EXACT_HEAD_GREEN`: every required selected lane belongs to that exact candidate head.
- `MERGED`: merge uses expected-head protection; main is re-resolved afterward.

The machine policy is `POS8_RECOVERY_MODEL.json`. `scripts/pos8-crash-shield.mjs` evaluates the transaction state and emits the next safe action.

## 3. SRB-8 shadow recovery branch

Each active PR may have at most one shadow recovery branch, normally `recovery/pr<PR>-<lane>`.

The shadow branch is a durability surface, not a release candidate. It has no pull request. The normal PR workflow therefore does not execute merely because a recovery checkpoint was pushed there. The candidate branch moves only when one coherent Atomic Work Unit is ready.

This removes the old tradeoff:

- before POS8: save partial work to GitHub and pay another PR CI fanout, or keep it local and risk losing it;
- POS8: save partial work to the shadow branch cheaply, then promote once when it is genuinely a candidate.

A successor always treats live refs as authority. The recorded recovery SHA is orientation only; the recovery branch name is the durable locator.

## 4. WAL-8 write-ahead recovery block

Before mutation, PR metadata must durably record:

- repository and PR;
- candidate branch and observed candidate head;
- one recovery branch and observed recovery head;
- current lane and Atomic Work Unit;
- failure class when applicable;
- last safe checkpoint;
- exact next action;
- concise exact-head validation state.

The recovery block is capped at 4 KiB, changes no Git head and launches no CI. It must never contain passwords, tokens, secrets, raw capabilities, raw account/device/rivalry/session/pairing identifiers, full saves, or other private capability material.

## 5. PG-8 single-promotion gate

A shadow head may be promoted to the PR branch only when:

1. the write-ahead candidate head is still the live candidate head;
2. the shadow line descends from that candidate head;
3. exactly one Atomic Work Unit is open;
4. no more than one local unpublished packet exists;
5. the Atomic Work Unit is coherent;
6. targeted validation for the changed risk is green.

Promotion is one fast-forward of the candidate branch. That one head owns the candidate CI run. If the candidate head moved concurrently, classify `HEAD_MOVED`, compare first, and do not overwrite.

## 6. Crash Loss Budget 8

The volatile crash-loss budget is no more than one local unpublished mutation packet. A packet should be small enough to repeat directly from WAL-8 plus the shadow branch without reconstructing the conversation.

There may never be two open independent Atomic Work Units. Before widening into another lane, the current packet must be on the recovery branch or intentionally abandoned.

Long CI, emulator, provider, merge, deployment, or review waits begin only after the relevant work is durable.

## 7. Recovery startup

After an abrupt interruption, the successor does not recursively read historical handoffs. The normal startup set is bounded:

1. read the live PR body and TX-8 recovery block;
2. resolve the live candidate branch head;
3. resolve the live recovery branch head;
4. if a candidate was published, read only that exact head's workflow result.

If recovery is ahead of candidate, continue from recovery. If candidate is ahead of the recorded intent, compare and reconcile before mutation. If both heads match and the last run is red, inspect only current red evidence.

Old SNS/SLE/WEC/relay files are provenance, not ordinary restart dependencies.

## 8. Platform warning and context handling

POS8 never fabricates hidden usage-limit telemetry. Account plan, message count, tool-call count and elapsed time are not valid crash predictors.

A real owner-reported platform warning is a hard transition input. Severe observable context reconstruction/detail loss is also a hard input. If one local packet is still volatile, checkpoint it to the shadow branch first when possible; otherwise transition immediately from the already durable state.

## 9. IMPACT-7 remains the validation engine

POS8 does not replace exact risk-based testing. `POS7_IMPACT_GRAPH.json`, `scripts/pos7-impact-router.mjs`, `scripts/pos7-proof-runner.mjs` and the selected deterministic runner remain machine authority for validation.

Unknown executable risk, workflow/dependency/guard/manifest/service-worker/routing-authority changes still fail closed to the complete seal. Speed never comes from weakening a product, security, privacy, recovery, provider, UI/UX, evidence-validity or release invariant.

Product contracts must not import POS8 process/recovery authority. Process tests own process behavior; product tests own product behavior.

## 10. Permanent product locks

`CURRENT_PRODUCT_GUARDS.json` remains product/safety authority.

Billing stays permanently OFF and Firebase stays Spark. Never enable Blaze, Cloud Billing/account linkage, Cloud Run or Cloud Functions. App Check enforcement stays OFF. Firestore browser persistence stays memory-only. Google Auth stays popup-only `browserSessionPersistence` with no extra scopes.

Exactly two private managers. Connected Rivalry pairing plus exact ACTIVE precedes league or club authority. Candidate C remains the sole destructive remote-to-local gameplay Apply authority with transaction-owned exact rollback. Canonical local storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`. No public discovery, listing, lobby, matchmaking, community, rankings or global leaderboards. `SSJR-DUAL-FULL-SCREEN-1` remains permanent.

## 11. Product-first exit

POS8 earns zero SSJR and zero MDP credit. Once PR #220 is exact-head green and merged, stop operating-system work and resume the next genuine Shared Showdown Journey dependency immediately.

# Career Mode Showdown Project Operating System v3

Status: current project operating authority.

POS v3 keeps the product discipline created by POS v2 while removing the remaining continuity overhead that repeatedly consumed CI, branch heads, attention and recovery time. The operating system exists to help ship the product. It is never itself a product milestone.

## 1. Authority order

1. Later explicit owner instruction.
2. Current verified source, live GitHub state, provider state and deployed behavior.
3. `CURRENT_PRODUCT_GUARDS.json`, active product/evidence models and executable release authority.
4. `NEXT_TASK.md`.
5. A current Resume Capsule when one exists.
6. Historical handoffs, WEC records, completed milestone ledgers and provenance.

Recorded heads and handoffs are orientation until independently reverified. Never combine CI evidence across heads.

## 2. Active progress metrics

### SSJR

KEEP. Shared Showdown Journey Readiness remains the product acceptance/readiness metric for the current milestone. Only accepted evidence can change it.

### MDP

KEEP THE PURPOSE. MDP remains the engineering lifecycle metric and never grants SSJR credit. MDP-1 stays active until the separately reviewed MDP-2 migration is completed. The proposed MDP-2 weighting gives less credit to design-only work and more to actual product integration; do not rewrite MDP-1 history.

### RJR-1

FROZEN HISTORICAL EVIDENCE at 100/100. Preserve regression tests for still-used Remote Joining behavior, but never reopen the score or require completed RJR narration for unrelated work.

No session/continuity metric is allowed to masquerade as product progress.

## 3. TDS-1 Transfer Decision Signal

SHP percentages and HTR scores are retired from normal operation. POS v3 uses a categorical transfer decision with no percentage:

- `CONTINUE`: keep working normally.
- `CHECKPOINT_SOON`: keep work bounded and refresh the current safe checkpoint after the current meaningful task.
- `FINISH_ATOMIC_THEN_TRANSFER`: do not start another substantial task; finish or safely abort the atomic operation, then transfer.
- `TRANSFER_NOW`: generate one Resume Capsule and move to the successor session.

TDS-1 changes only when meaningful session health changes. Do not recompute or report it after every tool call.

Hard transfer triggers are an explicit owner transfer request, a usage warning/critically low allowance reported by the owner, a next substantial task that risks losing unrecoverable context, exhausted adaptive debugging while a failure remains unresolved, or severe reconstruction plus a repeated unresolved debugging loop.

A single interruption, a long healthy session, many reads, many successful tool calls, or many commits are not themselves handoff reasons.

## 4. ADB-2 Adaptive Debug Budget

ADB-2 replaces the SHP-coupled ADB-1 calculation. It is still a bounded anti-spiral mechanism, but it uses only risk-bearing signals:

- unresolved failing families;
- unresolved states;
- failed correction/validation cycles;
- context damage/reconstruction;
- active task breadth.

It deliberately ignores elapsed time, message count, reads, successful commands and commit count. Healthy focused debugging may continue longer; broad or reconstruction-damaged debugging transfers sooner.

Only a meaningful failed correction plus validation cycle consumes the budget. Investigation, reading, polling, successful diagnosis and successful validation do not.

## 5. Resume Capsule RCP-1

RCP-1 replaces routine SNS/SLE/VTLS successor packaging.

A Resume Capsule is generated only when TDS-1 reaches `TRANSFER_NOW`, after `FINISH_ATOMIC_THEN_TRANSFER` reaches a safe boundary, when the owner explicitly asks for a transfer, or when a platform usage warning reported by the owner makes transfer prudent.

The capsule is one compact external transfer artifact. It is normally delivered in chat/download form and MUST NOT be committed merely to publish the handoff. This avoids advancing the exact PR head, invalidating CI evidence or triggering a new workflow fanout just to document the transfer.

The capsule contains only:
- repository, branch and PR;
- recorded head as orientation;
- current task;
- last safe checkpoint;
- unresolved blocker(s);
- exact next action;
- transition reason;
- pointer to permanent guards;
- instruction to independently resolve live main/PR/head/checks before editing.

No mirrored starter/deep pair, no version-number chain, no continuity-only PR, and no per-task capsule.

Git history preserves repository history. Historical handoff files remain available on demand.

## 6. What the owner should do

During ordinary work, the owner does not need to ask for SNS or monitor a handoff percentage.

The assistant should report TDS-1 only when it changes state or when the owner asks.

If the ChatGPT interface shows a usage/remaining-message warning that the assistant cannot see, the owner should report that warning once. That input is a hard TDS-1 transfer trigger at the next safe boundary.

If TDS-1 says `TRANSFER_NOW`, the assistant should generate the Resume Capsule without waiting for the owner to remember a special phrase.

## 7. Successor startup

A successor session should normally load only:

1. `PROJECT_OPERATING_SYSTEM_V3.md`;
2. `CURRENT_PRODUCT_GUARDS.json`;
3. `NEXT_TASK.md`;
4. the Resume Capsule, only when one was supplied.

Then independently resolve live main, active PR, exact head, required checks/reviews and current deployment authority.

Do not read WEC archives, old START_NEXT_SESSION families, deep SLE mirrors, old SNS packages or completed RJR ledgers by default. Load history only when the current failure or decision actually requires it.

## 8. Test and CI policy

A blocking test must plausibly protect current/future runtime behavior, UI/UX, data/storage, synchronization, recovery, security/auth, privacy, provider/cost safety, executable schema/API authority, current evidence validity or release correctness.

Process wording, old PR numbers, frozen milestone narration, exact workflow counts, old provider run IDs and historical handoff structure do not block product CI.

Stability owns the complete current product contract suite once. Specialist workflows own focused risk domains only.

Use targeted/local checks while developing. Use the full permanent workflow set for publication/release/security boundaries or when changed risk genuinely spans the full set. Do not intentionally create many tiny commits when one coherent tested commit can carry the same change.

Dormant/rejected architecture remains preserved in `DORMANT_ARCHITECTURE_TEST_MANIFEST.json` and consumes no normal product CI.

## 9. Failure taxonomy learned from project history

Permanent tests should concentrate on failure classes that actually harmed the product:

- cross-device state convergence and stale pointer/retry behavior;
- lost acknowledgement, offline/reconnect and idempotent replay;
- real recorder/evidence schema compatibility;
- deployment artifact/cache/service-worker completeness;
- provider authorization and private exact-path denial;
- atomic local restore/rollback ownership;
- product presentation that must preserve provider authority on both managers;
- runtime DOM/control-flow errors exposed only in realistic journeys.

Repeated false blockers from continuity wording, old PR/RJR narration, handoff mirrors, exact topology, completed candidate architectures and warning comments are explicitly non-product failures.

`PROJECT_OPERATING_SYSTEM_V3_FAILURE_TAXONOMY.json` records the durable classification.

## 10. Continuity/WEC/SLE/SNS/HTR/SHP disposition

- SHP visible percentage: retired.
- HTR numerical score: retired. Its five transfer facts are folded into RCP-1 validation.
- WEC: legacy recovery provenance only. Do not create archive/init cycles for normal work.
- SLE: retain Smart Lean Efficient as a design principle only.
- SNS: superseded by RCP-1 for new transfers.
- old START_NEXT_SESSION/deep mirror families: historical on demand.
- VTLS/per-task successor files: retired.
- continuity-only PRs: prohibited unless a unique repository recovery hazard genuinely cannot be preserved any other way.

## 11. Product locks

`CURRENT_PRODUCT_GUARDS.json` remains the compact machine authority.

Billing remains OFF and Firebase remains Spark. Never enable Blaze, Cloud Billing/account linkage, Cloud Run or Cloud Functions. App Check enforcement remains OFF. Firestore browser persistence remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes.

Exactly two private managers. Connected Rivalry pairing plus exact ACTIVE precedes league or club authority. Candidate C remains the sole destructive remote-to-local gameplay Apply authority with transaction-owned exact rollback.

Canonical local storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`.

No public discovery, listing, lobby, matchmaking, community, rankings or global leaderboards. `SSJR-DUAL-FULL-SCREEN-1` remains permanent.

## 12. Reporting

Normal reporting centers on:

- Shared Showdown Journey readiness;
- Milestone Delivery Progress;
- current lane;
- concrete dependency completed;
- blocker;
- next product unlock.

TDS-1 is shown only when it changes or matters. There is no handoff percentage and no session-age countdown.

## 13. Core rule

Spend compute, CI and developer attention on failures that can change the product. Preserve history without allowing history to repeatedly break the product-development loop.

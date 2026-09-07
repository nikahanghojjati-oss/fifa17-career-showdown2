# Session Handoff Proximity v2

Owner direction: START_NEXT_SESSION_PR214_R6_HANDOFF_PROXIMITY_V2.md, 2026-09-07, amended by owner direction on 2026-09-07 to replace the fixed debug-loop cutoff with an adaptive per-environment budget.

`Session handoff proximity: X%` measures how close THIS CHAT SESSION is to requiring a successor. It uses observable workload/context-risk proxies, not hidden context-window usage or fabricated account allowance. `HTR-1 transfer readiness` remains separate repository transfer readiness and never supplies session pressure or product credit.

Executable authority: `scripts/session-handoff-proximity.mjs`, model `SHP-2`. Adaptive debug-budget authority: `ADB-1` in the same executable.

## Session initialization

A fresh WEC must initialize with `initializeSession(newEnvironmentId, timestamp)`. Every observation and Session handoff proximity starts at literal 0%. Never inherit a predecessor percentage, debug count, decision, usage estimate or risk ledger.

The checkpoint ledger is monotonic for cumulative observations. Open risks may fall when resolved, but the session score remains a high-water mark. Count actual operations, not elapsed CI polling as engineering work.

## Base scoring

Each component is capped at 100 and the weighted total is rounded to an integer.

| Weight | Component | Calculation |
| --- | --- | --- |
| 45% | Context-pressure proxy | 0.4 × message/tool events + 3 × long evidence reads + 8 × truncations + 10 × interruption/recovery events + 15 × compactions |
| 25% | Cumulative workload | 0.35 × bounded reads/searches + 0.8 × edited files + 4 × commits + 8 × CI/debug cycles + 8 × deployments |
| 20% | Continuity risk | 15 × unmerged branches + 12 × red CI families + 20 × in-flight deployments + 10 if owner test pending + 8 × unresolved states |
| 10% | Session age/task breadth | 70 × elapsed minutes / 180 + 10 × additional task lanes beyond the first |

Long evidence means a file/log/source batch over roughly 4,000 characters. A CI/debug cycle is one diagnosis/correction/validation attempt, not each workflow check.

## ADB-1 adaptive debug budget

The anti-spiral mechanism remains mandatory, but a fixed `two failures -> transition` rule is retired.

Every environment receives a contextual debug budget between 2 and 20 attempts. The executable begins from a bounded base and adjusts from observable conditions:

* narrow single-family failure raises the safe budget;
* few unresolved states raise the safe budget;
* no truncation, recovery or compaction raises the safe budget;
* one focused task lane raises the safe budget;
* a younger session raises the safe budget;
* hard reconstruction, many red families, many unresolved states, long session age or accumulated context damage reduce the safe budget.

A healthy focused environment with one narrow blocker may therefore continue well beyond two attempts and can approach 20. A damaged, broad or reconstruction-heavy environment will transfer much sooner. Twenty is a ceiling for specific favorable environments, never a universal target.

The circuit breaker reaches the 95% transfer floor when the environment consumes its computed adaptive budget while a real failure remains. Context damage cuts the usable budget approximately in half. Multi-family failures enter the 85% preparation band only after a substantial fraction of that environment's own budget has been consumed.

Owner wrap requests, explicit usage warnings and genuinely unsafe state continue to override the adaptive budget.

## What counts as a debug failure

A failed check must protect something meaningful before it consumes the anti-spiral budget or blocks product work.

Blocking failures include runtime behavior, infrastructure, security, authorization, privacy, data integrity, storage/recovery, UI/UX behavior, current product contracts, release/deployment correctness, current milestone evidence validity and other conditions capable of creating an actual defect or unsafe publication.

A wording mismatch that changes no executable behavior, interface, user experience, infrastructure, security boundary, data contract, current machine-readable authority or future implementation safety is not a product blocker. Historical milestone phrasing, exact old PR prose, report-format literals, continuity prose and archival presentation belong in preserved provenance audits rather than the blocking product suite.

This rule does not permit deleting useful history or weakening a real invariant. If wording is itself executable authority, a security requirement, a user-visible requirement, an API/schema contract, evidence validator input or otherwise changes system behavior, it remains blocking.

## Risk floors

Repeated truncation/recovery/compaction gives at least 70. Hard state reconstruction gives at least 80. Adaptive multi-family exhaustion gives at least 85. Adaptive budget exhaustion or context-amplified debugging gives at least 95. Owner-requested wrap or another substantial task that risks loss gives at least 95.

| Range | Required action |
| --- | --- |
| 0–49 | Normal authorized work |
| 50–69 | VTLS after major milestones |
| 70–84 | Bounded tasks only; VTLS after each substantial state change |
| 85–94 | No broad new lane; finish current atomic task and prepare full SNS |
| 95–99 | Generate full successor SNS at the first safe checkpoint |
| 100 | Successor package generated and verified; stop this session |

The arithmetic is capped at 99 until the complete successor package is generated, verified, and the sealed HTR-1 transfer package is ready. 100 means handoff complete, not project complete.

VTLS SNS generation is independent of proximity. Generate a tiny VTLS record after substantial task/state changes using `PR/head | metric | completed | blocker | next`.

WEC may require an earlier stricter transition. SHP-2/ADB-1 never weakens a true safety, usage or continuity stop. Every future current pointer, starter and handoff must preserve the zero reset, HTR separation, adaptive 2..20 budget, meaningful-failure classification, context-damage protection and stop behavior. Historical archives remain unchanged provenance.

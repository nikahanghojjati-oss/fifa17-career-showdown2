# Session Handoff Proximity v2

Owner direction: START_NEXT_SESSION_PR214_R6_HANDOFF_PROXIMITY_V2.md, 2026-09-07.
This later instruction supersedes every older use of HTR-1 as session-pressure reporting.

`Session handoff proximity: X%` measures how close THIS CHAT SESSION is to requiring
a successor. It uses observable workload/context-risk proxies, not exact context-window
usage or a fabricated account allowance. `usageRemainingPercent` remains null with
`usageSource: unavailable` unless the owner or a supported usage surface supplies it.

`HTR-1 transfer readiness` remains the separate five-pillar repository transfer model
in `00_HANDOFF_PROXIMITY_STAGE_GATES.md`. Preserve historical HTR-1 facts. Its fixed
0/20/40/60/80/100 values never supply Session Handoff Proximity v2. Neither metric earns SSJR credit.

## Deterministic observations

Executable authority: `scripts/session-handoff-proximity.mjs`, model `SHP-2`.
Run `npm run work:proximity`; run `npm run work:transfer-readiness` for HTR-1.
Initialize with `initializeSession(newEnvironmentId, timestamp)` in a fresh WEC:
all observations and Session handoff proximity reset to 0%. Never copy a predecessor's
session ledger, percentage, flags, counters, usage or decision. Then record actual catch-up
cost. A normal bounded catch-up produces a low value; observed risk floors take priority.

The WEC `sessionHandoffProximity.checkpoints` ledger records timestamped evidence notes
and observations. `recordSessionCheckpoint` appends cumulative workload observations;
current open-risk counts may fall when resolved. The reported score is the high-water
mark across this session's ledger. It is monotonic within a session; only a new session resets it.
Count actual operations, not elapsed waiting polls as fake engineering progress. Never
count the predecessor's work. Record each field from visible activity; when a count is
approximate, name its conservative observational basis in the checkpoint note.

Each component below is capped at 100; round the weighted total to an integer:

| Weight | Component | Calculation |
| --- | --- | --- |
| 45% | Context-pressure proxy | 0.4 × message/tool events + 3 × long evidence reads + 8 × truncated outputs + 10 × interruption/recovery events + 15 × compactions |
| 25% | Cumulative workload | 0.35 × bounded reads/searches + 0.8 × edited files + 4 × commits + 8 × CI/debug cycles + 8 × deployments |
| 20% | Continuity risk | 15 × unmerged branches + 12 × red CI families + 20 × in-flight deployments + 10 if an owner test is pending + 8 × unresolved states |
| 10% | Session age/task breadth | 70 × elapsed minutes / 180 + 10 × additional task lanes beyond the first |

Long evidence means a file/log/source batch exceeding about 4,000 characters; a bounded
read/search is one targeted operation, not each line or match. A CI/debug cycle means
one diagnosis/correction/validation attempt, not each check poll. Count distinct edited
files cumulatively. These are observable proxies with deterministic arithmetic, not a
claim of access to a hidden token percentage. Actual usage warnings retain stricter WEC priority.

Risk floors apply before the session high-water mark: two or more observed truncation,
interruption/recovery or compaction events give at least 70; two or more currently unresolved
CI/debug loops or hard state reconstruction give at least 80; an owner wrap/transition
request or another substantial task that risks loss gives at least 95. Ordinary catch-up
or the predecessor's red check alone does not count as hard reconstruction or repeated loops.

| Range | Required action |
| --- | --- |
| 0–49 | Normal authorized work |
| 50–69 | VTLS SNS after major milestones |
| 70–84 | Bounded tasks only; VTLS after each substantial state change |
| 85–94 | No broad new lane; finish current atomic task and prepare full SNS |
| 95–99 | Generate full successor SNS immediately; stop after safe verification |
| 100 | Successor package generated and verified; stop this session |

The arithmetic is capped at 99 until the complete SLE successor package is generated,
successfully verified with a named evidence record, and HTR-1's sealed-transfer-package
checks pass. 100 means handoff complete, NOT project complete. A new task, red CI or owner
test does not prevent a truthful handoff when its exact state and next action are recorded.

VTLS SNS generation is independent of proximity and may happen at any percentage.
Write only `PR/head | metric | completed | blocker | next` at substantial diagnosis,
implementation, CI, merge/deploy and physical-test milestones. Full SLE remains required
at a final transition; tiny VTLS checkpoints do not falsely certify it.

WEC can require an earlier or stricter transition. v2 never weakens that decision.
Every future starter, SLE handoff, generated prompt and current reporting rule must preserve
this separation, zero reset, proxy honesty, monotonicity, risk floors and stop behavior.
Historical archives/dated starters remain unchanged provenance. Current pointer documents
must explicitly route readers to v2 instead of restoring historical HTR reporting.

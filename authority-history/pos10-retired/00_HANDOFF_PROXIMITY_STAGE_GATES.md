# HTR-1 — Historical Transfer-Readiness Score / POS-2 Checklist Authority

Status under Project Operating System v2: the HTR-1 0/20/40/60/80/100 score is retired from normal operation. Historical HTR scores remain valid provenance and must not be rewritten. The five underlying transfer conditions remain useful and are preserved as a checklist with no percentage.

Current authority: `PROJECT_OPERATING_SYSTEM_V2.md`.
Current command: `npm run work:handoff-checklist`.

## Why the score was retired

HTR-1 measured whether repository state was ready to transfer to a successor. Its five equal 20-point pillars were deterministic, but the percentage did not represent product completion, engineering progress or session health. In practice it created a second continuity meter that could be confused with SHP and could encourage handoff work during normal engineering.

POS v2 keeps the useful proof and removes the unnecessary score.

## The five transfer conditions

Evaluate these only when a real handoff or recovery transfer is occurring.

1. Durable state
   Current repository/task state needed for recovery is durably recorded.

2. Authority snapshot
   Live source authority has been resolved sufficiently to identify repository/PR/branch and the relevant exact boundary. Recorded SHAs are orientation only unless freshly verified.

3. Open work classified
   Current blocker, unfinished work and meaningful hazards are explicit.

4. Successor execution contract
   The current task and immediate safe next action are explicit enough that a successor does not need to reconstruct the prior chat.

5. Safe boundary snapshot
   The current operation is either complete or safely reversible, with no known atomic mutation left half-finished.

When all five are present, one compact successor snapshot may be produced. There is no extra credit or product progress for doing so.

## What not to do

Do not:

- report HTR as a normal project percentage;
- use HTR as session pressure;
- use it as SSJR or MDP progress;
- create a transfer package merely to reach 100;
- repeatedly reseal the same state after ordinary commits;
- block product work because an old mirrored handoff file or historical formatting artifact is absent.

## Compatibility

`npm run work:transfer-readiness` and `scripts/handoff-proximity-stage.mjs` remain temporarily available for historical contracts/archives. New operating code must use the POS-2 checklist instead. Once no useful compatibility consumer remains, the numeric implementation may be moved fully into the historical tooling lane.

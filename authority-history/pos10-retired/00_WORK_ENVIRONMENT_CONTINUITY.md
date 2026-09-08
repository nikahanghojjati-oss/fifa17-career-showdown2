# Career Mode Showdown — Work Environment Continuity under POS v2

Status: recovery infrastructure, not a project metric or engineering milestone.

Current authority: `PROJECT_OPERATING_SYSTEM_V2.md`.
Current session decision interface: `npm run work:health`.
Current transfer interface: `npm run work:handoff-checklist`.

## Purpose

Work Environment Continuity exists for one reason: after interruption or a real handoff, the next environment can recover the exact current work without guessing.

It does not run in the product, earn SSJR/MDP credit, authorize runtime work or justify continuity-only engineering.

## Minimum durable recovery state

When continuity state is needed, preserve:

1. repository and active PR/branch;
2. exact live head or a clear instruction that it must be re-resolved;
3. current task;
4. last safe checkpoint;
5. current blocker/unresolved risk;
6. immediate next safe action;
7. permanent safety locks by reference to `CURRENT_PRODUCT_GUARDS.json`.

`WORK_ENVIRONMENT_STATUS.json` may keep its existing richer schema while legacy tools still consume it. New POS-2 code should not add fields merely to improve a continuity score.

## When to update continuity

Update durable recovery state when it materially reduces work-loss risk, especially:

- before a long/risky multi-step mutation;
- after the exact blocker or safe checkpoint materially changes;
- before a real handoff;
- after an interruption when the live boundary has been reconstructed.

Do not update WEC after every read, poll, successful test or ordinary commit merely for process completeness.

## Environment transitions

A predecessor's stop decision never binds a fresh environment. A successor resolves live state and continues the current product task unless its own session health or an explicit owner/usage condition requires otherwise.

There is no mandatory preliminary WEC archival phase before product work. Preserve historical state through existing repository/Git history. Create a new archive payload only when it contains unique recovery evidence not already durable elsewhere.

Do not create standalone WEC/history/authority-sync PRs unless a concrete recovery, safety or publication defect makes one necessary.

## Session health

ADB-1 is the active anti-spiral mechanism. `npm run work:health` translates current observations into HEALTHY, CAUTION or HANDOFF_RECOMMENDED.

The old WEC continuation score and SHP percentage remain compatibility inputs for legacy tools. They are not normal POS-2 product gates.

Never invent hidden context/token/account usage. An explicit supported usage warning or owner-reported allowance may still require an earlier transfer.

## GitHub/tooling resilience

Use the connected GitHub route available to the environment. Local `gh` bootstrap is optional tooling support, not a mandatory milestone.

For repository writes, fetch the exact current blob/reference before mutation. On a stale-write conflict, refetch and reevaluate rather than retrying blindly.

After interruption, reconstruct only the state needed for the current task and resume from the last coherent checkpoint. Do not restart the full repository study.

## History

`WORK_ENVIRONMENT_HISTORY.md`, old WEC JSON archives, historical SHP ledgers and previous handoff packages remain provenance. They are read on demand, not preloaded or automatically revalidated.

## Core rule

Continuity should make recovery cheaper than reconstruction. If maintaining continuity costs more engineering time than the recovery risk it prevents, simplify it unless a real safety/publication requirement says otherwise.

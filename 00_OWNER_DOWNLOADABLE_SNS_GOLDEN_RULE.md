# Career Mode Showdown — SNS under Project Operating System v2

SNS remains the owner-facing successor snapshot concept.

Status under POS v2: SNS is required only for an actual session/environment handoff or recovery transfer. The old rule that every transition-related signal must create a versioned downloadable repository artifact is retired. Historical SNS files remain preserved as provenance.

Current authority: `PROJECT_OPERATING_SYSTEM_V2.md`.

## When to create SNS

Create one compact SNS when:

- POS-2 session health is `HANDOFF_RECOMMENDED` and the environment is stopping;
- an explicit product usage warning/limit requires transfer;
- the owner asks to transfer or wrap;
- an interruption/recovery boundary makes a successor snapshot necessary;
- an atomic operation has reached the safe transfer boundary and the current environment should stop.

Do not create SNS merely because:

- a normal task completed;
- a test passed or failed once;
- a commit was pushed;
- a documentation file changed;
- an SHP/HTR legacy percentage crossed a historical threshold;
- a tiny VTLS checkpoint would duplicate already durable state.

## Minimum useful contents

An SNS should contain only what the successor needs to continue safely:

1. repository and active PR/branch;
2. exact head whose evidence was actually inspected, clearly marked as a snapshot that must be live-verified;
3. current product/release authority when relevant;
4. current SSJR and MDP state when relevant;
5. exact current blocker or open risk;
6. immediate safe next action;
7. permanent safety locks or a pointer to `CURRENT_PRODUCT_GUARDS.json`;
8. warning not to combine CI across heads.

`npm run work:handoff-checklist` verifies the five useful transfer conditions. There is no SNS score and SNS creation earns no SSJR/MDP progress.

## Delivery

Provide the SNS in the simplest durable form the current environment supports. A repository file or directly copyable chat payload is sufficient when it preserves the exact safe boundary. A duplicate downloadable file, mirrored copy, new version-number family and packaging-only commit are optional, not mandatory.

Do not make the owner reconstruct the successor state from many messages when a real handoff is occurring.

## Historical compatibility

Existing `owner-sns/`, START_NEXT_SESSION, deep handoff and mirrored SLE artifacts remain intact as historical evidence. Legacy tests that enforce their old formatting live only in the manual historical provenance lane.

## Core rule

SNS exists to prevent work loss at a real transition. It must not create transitions, consume ordinary engineering time or become a parallel documentation product.

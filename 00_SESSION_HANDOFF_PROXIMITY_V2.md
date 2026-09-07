# Session Handoff Proximity v2 — POS-2 Compatibility Record

Status under Project Operating System v2: visible SHP-2 percentage is retired from normal project operation. Historical SHP evidence remains valid provenance. The executable legacy model remains available temporarily for compatibility and for ADB-1 input data, but it is not a product metric, milestone, normal reporting requirement or automatic reason to create continuity work.

Current authority: `PROJECT_OPERATING_SYSTEM_V2.md`.
Current session interface: `npm run work:health`.
Current anti-spiral mechanism: ADB-1 in `scripts/session-handoff-proximity.mjs`.

## What survives

The valuable part of SHP-2 is context-quality observation. Preserve the underlying observations when available:

- truncation, interruption/recovery and compaction events;
- failed correction/validation cycles;
- unresolved blockers and red risk domains;
- hard state reconstruction;
- elapsed/breadth pressure;
- explicit product usage warnings or owner wrap requests.

These observations help ADB-1 decide whether a particular environment can safely keep debugging.

## What is retired

Do not use an SHP percentage as:

- product progress;
- handoff readiness;
- a target that mechanically rises after activity;
- a reason to create SNS/SLE/WEC work merely because it crossed a numeric band;
- a fixed two-failure stop rule;
- a substitute for actual session health.

Historical 0–100 SHP ledgers and reports remain in Git history and archives. Do not rewrite them.

## ADB-1 adaptive debug budget

ADB-1 remains active. It chooses a contextual failed correction/validation budget from 2 through 20 for the specific environment.

A focused single blocker with little context damage, little breadth and a short/healthy session may receive a high budget. Multiple unresolved risk domains, truncation/recovery/compaction, hard reconstruction and long-session pressure reduce it.

Only meaningful failed correction/validation cycles consume the budget. Investigation, log reading, status polling, successful validation and ordinary source reads do not.

Two failures alone never force a handoff.

Use `npm run work:health` to report:

- HEALTHY
- CAUTION
- HANDOFF_RECOMMENDED

A handoff is recommended when ADB is genuinely exhausted with unresolved failure, context damage reduces the safe allowance to the reached threshold, an explicit usage warning/very low reported allowance applies, or the owner/current safe-boundary state requires transfer.

## Compatibility

`npm run work:proximity` remains temporarily available for historical tooling and archives. New code and new operating instructions must not depend on its percentage. When legacy SHP dependencies are no longer referenced by useful tooling, the compatibility command may be archived without changing ADB-1.

HTR-1 is separately retired as a score under POS v2; its five useful transfer conditions survive as `npm run work:handoff-checklist`.

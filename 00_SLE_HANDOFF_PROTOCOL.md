# Career Mode Showdown — SLE Handoff Protocol

Owner-mandated permanent repository policy.

## What SLE means in this project

The repository historically uses `SLE` as the project label for its live-first, low-context, adaptive successor-loading system. Existing authoritative SLE files describe the behavior and package but do not spell out a word-by-word expansion of the acronym. Do not invent an expansion and present it as historical fact.

Operationally, SLE is the complete successor-loading envelope for a Work Environment transition. Its purpose is to let a fresh developer become safe and productive from a small current packet first, while keeping the complete project record available as lossless fallback context.

SLE is not merely one large handoff Markdown file. It is a coordinated package:

1. a newest versioned `START_NEXT_SESSION_...md` owner entrypoint;
2. `SESSION_BOOTSTRAP.json` as the compact current-state capsule;
3. a complete `SUCCESSOR_HANDOFF_..._SLE_...md` deep-reference handoff;
4. byte-identical root/project mirrors of the starter and full handoff;
5. progressive context references through `SESSION_CONTEXT_GRAPH.json`, `SESSION_CONTEXT_MODEL.json` and `SESSION_CONTEXT_LEARNING.json` when deeper context is needed;
6. exact live/source/WEC/security/RJR pointers that make the package verifiable rather than chat-memory dependent.

The normal loading path is:

`START_NEXT_SESSION` → `SESSION_BOOTSTRAP.json` → live GitHub verification → ranked current-task context → full SLE handoff/history only when evidence requires deeper reconstruction.

Current source, live GitHub/provider/deployment state, later owner instructions, security/recovery authority and the successor's own freshly initialized WEC always override stale recorded facts in an SLE package.

## Mandatory future-developer rule

Every future developer, ChatGPT session or Work Environment that reaches a handoff boundary must use SLE packaging. A plain chat-only successor prompt or a single unmirrored Markdown handoff is not a complete project handoff.

At every `Handoff proximity: 100%`, `HANDOFF_AT_CHECKPOINT`, `HANDOFF_NOW`, or other final transition boundary, the closing developer must, before stopping:

1. verify the exact current live-main / branch / PR / deployment boundary;
2. create or refresh the complete root `SUCCESSOR_HANDOFF_..._SLE_...md`;
3. create the byte-identical mirror under `project-documents/handoffs/`;
4. create a new versioned root `START_NEXT_SESSION_...md` using the independent starter-version policy;
5. create its byte-identical mirror under `project-documents/session-starts/`;
6. refresh `SESSION_BOOTSTRAP.json` so its live boundary, runtime state, current lane, RJR authority, SLE handoff paths and starter paths are current;
7. refresh `SESSION_CONTEXT_GRAPH.json`, `SESSION_CONTEXT_MODEL.json` and `SESSION_CONTEXT_LEARNING.json` when their current-state pointers or useful retrieval evidence changed; never rewrite them merely for cosmetic churn;
8. preserve the explicit immediate successor task, security/recovery locks, Remote Joining priority, WEC rules, standing publication authorization and owner reporting format;
9. validate `tests/contracts/sle-handoff-packaging-contracts.cjs` and all normal publication gates applicable to the candidate;
10. ensure the final transition/WEC seal remains the last intended branch mutation when the current publication contract requires an immutable seal;
11. give the owner the newest root `START_NEXT_SESSION_...md` as the normal next-session file and stop before beginning the next substantial milestone.

Every SLE handoff must recursively state that the next developer inherits this same SLE rule. The rule remains active until the owner explicitly changes it.

## Required SLE content

The complete SLE handoff must preserve, at minimum:

- repository and public-site identity;
- exact verified live-main / relevant branch / PR / merge / deployment boundary;
- application and runtime versions;
- what is DONE / MERGED / PROVEN versus merely planned, candidate, blocked or unverified;
- exact validation evidence and important failure/correction history needed to avoid repetition;
- current WEC provenance and instruction to initialize a fresh successor WEC rather than inherit the predecessor decision;
- `Remote Joining readiness` authority and score without artificial process-based movement;
- permanent security, privacy, storage, recovery and IAM locks;
- standing owner merge/deploy authorization and its validation conditions;
- owner-only actions that are already complete so successors do not ask for them again;
- exact `IMMEDIATE NEXT TASK AFTER FULL STUDY` with ordered execution gates and scope limits;
- the mandatory seven-line owner progress format;
- the recursive SLE packaging rule itself.

## Efficiency and anti-sidequest rule

SLE exists to reduce startup cost and preserve continuity, not to create repeated documentation milestones. Refresh it naturally at a real transition/handoff boundary or when an owner explicitly requires a handoff correction, as in this policy addition.

A successor normally receives only the newest versioned starter first. It should use the connected GitHub tool, load the compact capsule, verify live state, hydrate only task-relevant context, and expand to the full SLE handoff or history only when needed.

Do not use SLE maintenance to delay the next real dependency-gated Remote Joining prerequisite after a fresh successor has safely initialized.

## Relationship to existing policy

`00_SESSION_BOOTSTRAP.md` defines the live-first adaptive loading architecture, dual-copy handoff rule and versioned starter rule.

`00_HANDOFF_GOLDEN_RULE.md` defines continuity quality, mandatory immediate-next-task content and handoff behavior.

`00_WORK_ENVIRONMENT_CONTINUITY.md` defines the deterministic WEC transition mechanism.

`AGENTS.md` makes these rules repository-wide developer instructions.

This file makes the owner's SLE requirement explicit and permanent across all future developers.
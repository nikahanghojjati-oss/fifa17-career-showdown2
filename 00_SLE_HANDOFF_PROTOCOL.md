# Career Mode Showdown — SLE Handoff Protocol

Owner-mandated permanent repository policy.

## What SLE means in this project

SLE = Smart Lean Efficient.

This is the owner's explicit project definition and supersedes older wording that treated SLE only as a repository label without a spelled-out expansion.

Operational intent:

- Smart: verify live authority, reason from evidence, distinguish proof from assumption, and avoid stale or artificial status claims.
- Lean: load only the smallest safe current context first instead of rereading the entire project history by default.
- Efficient: minimize repeated study, redundant tool work, owner chores, continuity sidequests, and handoff overhead without weakening security, recovery, testing, or publication quality.

Operationally, SLE is the complete successor-loading envelope for a Work Environment transition. Its purpose is to let a fresh developer become safe and productive from a small current packet first, while keeping the complete project record available as lossless fallback context.

SLE is not merely one large handoff Markdown file. It is a coordinated package:

1. a newest versioned `START_NEXT_SESSION_...md` owner/repository entrypoint;
2. `SESSION_BOOTSTRAP.json` as the compact current-state capsule;
3. a complete `SUCCESSOR_HANDOFF_..._SLE_...md` deep-reference handoff;
4. byte-identical root/project mirrors of the starter and full handoff;
5. progressive context references through `SESSION_CONTEXT_GRAPH.json`, `SESSION_CONTEXT_MODEL.json` and `SESSION_CONTEXT_LEARNING.json` when deeper context is needed;
6. exact live/source/WEC/security/RJR pointers that make the package verifiable rather than chat-memory dependent;
7. one freshly generated repository-first next-developer copy-paste prompt for the owner whenever a fresh chat is recommended.

The normal loading path is:

`repository-first next-developer prompt` → newest `START_NEXT_SESSION` → `SESSION_BOOTSTRAP.json` → live GitHub verification → ranked current-task context → full SLE handoff/history only when evidence requires deeper reconstruction.

Current source, live GitHub/provider/deployment state, later owner instructions, security/recovery authority and the successor's own freshly initialized WEC always override stale recorded facts in an SLE package.

## Permanent owner-facing lean delivery invariant

The owner must not be burdened with the full handoff as the normal entrypoint.

At every normal handoff or next-session transition:

1. generate and retain the complete SLE handoff and newest compact versioned starter in the repository;
2. give the owner one short freshly generated repository-first next-developer prompt suitable for direct paste into the next chat;
3. that prompt must identify the current authoritative `START_NEXT_SESSION_...md`, require independent live verification and fresh WEC initialization, and route the successor to `IMMEDIATE NEXT TASK AFTER FULL STUDY`;
4. the owner may paste that short prompt as the normal next-chat entrypoint; attaching the compact starter is an equally valid fallback when direct repository retrieval is unavailable or the owner prefers a file;
5. do not paste the starter's full Markdown merely because a chat copy is needed—the short repository-first prompt is the chat-copy convenience layer;
6. do not ask the owner to choose among multiple handoff files or read/manage the repository continuity stack;
7. do not surface, paste or link the complete `SUCCESSOR_HANDOFF_...` to the owner by default merely because it exists;
8. surface the full handoff only when the owner explicitly asks for it, when the starter/capsule cannot reconstruct required context, or when a genuine continuity/recovery investigation requires deep provenance;
9. keep one clear current starter authority and one current short prompt generated from that same boundary, preventing handoff sprawl or competing owner-facing authorities.

Generate the short prompt with `npm run work:next-prompt` when repository tooling is available, or reproduce its semantic template from `00_HANDOFF_GOLDEN_RULE.md` if the script cannot run. Never copy an older session's prompt forward without refreshing the current starter and live boundary references.

This owner-facing delivery invariant is part of SLE itself, not an optional presentation preference. A developer who generates the correct full package but burdens the owner with the heavy file or a stale/generic continuation prompt has violated the Lean and Efficient parts of SLE.

## Mandatory future-developer rule

Every future developer, ChatGPT session or Work Environment that reaches a handoff boundary must use SLE packaging. A plain chat-only successor prompt or a single unmirrored Markdown handoff is not a complete project handoff.

Every future SLE handoff must explicitly preserve the owner definition `SLE = Smart Lean Efficient` unless the owner later changes it.

At every `Handoff proximity: 100%`, `HANDOFF_AT_CHECKPOINT`, `HANDOFF_NOW`, or other final transition boundary, the closing developer must, before stopping:

1. verify the exact current live-main / branch / PR / deployment boundary;
2. create or refresh the complete root `SUCCESSOR_HANDOFF_..._SLE_...md`;
3. create the byte-identical mirror under `project-documents/handoffs/`;
4. create a new versioned root `START_NEXT_SESSION_...md` using the independent starter-version policy;
5. create its byte-identical mirror under `project-documents/session-starts/`;
6. refresh `SESSION_BOOTSTRAP.json` so its live boundary, runtime state, current lane, RJR authority, SLE handoff paths and starter paths are current;
7. refresh `SESSION_CONTEXT_GRAPH.json`, `SESSION_CONTEXT_MODEL.json` and `SESSION_CONTEXT_LEARNING.json` when their current-state pointers or useful retrieval evidence changed; never rewrite them merely for cosmetic churn;
8. preserve the explicit immediate successor task, security/recovery locks, Remote Joining priority, WEC rules, standing publication authorization and owner reporting format;
9. ensure the versioned starter and full handoff recursively preserve the mandatory repository-first next-developer prompt standard;
10. validate `tests/contracts/sle-handoff-packaging-contracts.cjs`, `tests/contracts/next-developer-prompt-contracts.cjs` and all normal publication gates applicable to the candidate;
11. ensure the final transition/WEC seal remains the last intended branch mutation when the current publication contract requires an immutable seal;
12. give the owner the freshly generated short repository-first prompt, keep the newest root `START_NEXT_SESSION_...md` available as the compact fallback file, and stop before beginning the next substantial milestone.

Every SLE handoff must recursively state that the next developer inherits this same Smart Lean Efficient rule and the repository-first next-developer prompt rule. The rules remain active until the owner explicitly changes them.

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
- the mandatory repository-first next-developer copy-paste prompt standard;
- the mandatory eight-line owner progress format;
- the recursive Smart Lean Efficient SLE packaging rule itself.

## Efficiency and anti-sidequest rule

SLE exists to reduce startup cost and preserve continuity, not to create repeated documentation milestones. Refresh it naturally at a real transition/handoff boundary or when an owner explicitly requires a handoff correction.

A successor normally receives the owner's short repository-first prompt, retrieves the newest versioned starter from the live repository, then uses the connected GitHub tool to load the compact capsule, verify live state, hydrate only task-relevant context, and expand to the full SLE handoff or history only when needed. The owner may attach the starter instead when repository retrieval is unavailable or preferred.

Do not use SLE maintenance to delay the next real dependency-gated Remote Joining prerequisite after a fresh successor has safely initialized.

## Relationship to existing policy

`00_SESSION_BOOTSTRAP.md` defines the live-first adaptive loading architecture, dual-copy handoff rule and versioned starter rule.

`00_HANDOFF_GOLDEN_RULE.md` defines continuity quality, mandatory immediate-next-task content, handoff behavior and the canonical semantic template for the repository-first next-developer prompt.

`00_WORK_ENVIRONMENT_CONTINUITY.md` defines the deterministic WEC transition mechanism.

`AGENTS.md` makes these rules repository-wide developer instructions.

This file makes the owner's Smart Lean Efficient requirement explicit and permanent across all future developers.

# Adaptive Session Context Retrieval Engine

Purpose: make each fresh developer session materially lighter while preserving the full project record losslessly in repository sources.

This is development-process infrastructure only. It does not run in the Career Mode Showdown website and must not become a runtime dependency.

## Design principle

Do not compress by deleting history. Preserve all history in authoritative repository sources and change only how a fresh session retrieves it.

The startup system has four layers:

1. Lossless archive layer: current source, complete handoffs, authority history, roadmap, tests, CI evidence and provider evidence remain intact.
2. Structured memory layer: `SESSION_BOOTSTRAP.json` and `SESSION_CONTEXT_GRAPH.json` store high-value state, provenance and dependency relationships without copying entire documents.
3. Retrieval/ranking layer: `SESSION_CONTEXT_MODEL.json` ranks which files or evidence should be loaded for the current task under a strict context budget.
4. Adaptive feedback layer: later sessions can record which retrieved items were actually useful, redundant, contradiction-resolving or error-preventing, allowing the ranking weights to improve over time.

The system therefore preserves context by reference and provenance rather than by forcing every successor to preload every historical byte.

## Why not a heavyweight neural model now

A custom neural model would be a poor fit at this stage. The number of completed Work environments is too small for reliable supervised training, and introducing an external vector database or API credential would add cost, operational risk and another dependency.

Use an ML-ready hybrid instead:

- deterministic safety locks for facts that must always be available;
- information-retrieval relevance such as BM25/TF-IDF style task similarity;
- dependency-graph distance;
- recency/delta signals;
- authority and security/recovery criticality;
- token-cost penalty;
- simple online utility learning from future sessions.

When enough labeled session history exists, the same feature set can feed a small logistic-regression/ranking model without changing the storage architecture.

## Context ranking features

For each candidate file/evidence item, score normalized features from 0 to 1:

- `taskAffinity`: semantic/keyword similarity to the current bounded task;
- `authority`: current implementation/security/source authority strength;
- `delta`: changed or directly implicated since the last verified checkpoint;
- `dependency`: closeness to the next required dependency in the graph;
- `riskCriticality`: likelihood the item contains security, recovery, versioning, data-authority or publication constraints;
- `contradictionValue`: likelihood the item is needed to resolve disagreement among current sources;
- `learnedUtility`: historical usefulness in prior startups;
- `staleness`: age/supersession penalty;
- `tokenCost`: estimated context cost penalty.

Initial ranking score:

`0.24 taskAffinity + 0.18 authority + 0.16 delta + 0.14 dependency + 0.12 riskCriticality + 0.08 contradictionValue + 0.08 learnedUtility - 0.10 staleness - 0.10 tokenCost`

Mandatory lock items bypass ranking and are always represented in the compact capsule.

## Context budget tiers

Tier 0 — bootstrap capsule

Target: roughly 1–2k tokens.

Contains only current live boundary, runtime identity, current lane, critical locks, GitHub routing rule, handoff pointers, starter pointers and retrieval policy pointers.

Tier 1 — task packet

Target: roughly 3–6k additional tokens.

Load only top-ranked current-task files plus current WEC/status and production environment metadata.

Tier 2 — live delta packet

Target: roughly 5–10k additional tokens only when live main differs from the capsule or newer PRs supersede the lane.

Inspect changed files and intervening PRs between the recorded boundary and current live main. Do not reconstruct all history.

Tier 3 — deep fallback

No fixed token target. Use only when ambiguity remains, a security/recovery/versioning rationale is missing, a historical contract fails, the owner requests full reconstruction, or WEC/interruption recovery requires it.

The complete handoff and history remain available here.

## Adaptive learning

Do not pretend the system has enough data for a trained model today. Start with explicit priors and collect lightweight outcomes per session.

A future session may record, for each loaded item:

- `loaded`;
- `usedInDecision`;
- `preventedError`;
- `resolvedContradiction`;
- `requiredForPublication`;
- `redundant`.

Update `learnedUtility` conservatively using an exponential moving average rather than overfitting a tiny sample. Suggested outcome score:

- +1.0 prevented error or resolved contradiction;
- +0.8 required for publication/security/recovery decision;
- +0.5 materially used in implementation decision;
- 0 neutral reference;
- -0.5 redundant preload.

Suggested update: `newUtility = 0.8 * oldUtility + 0.2 * outcomeNormalized`.

Do not allow learned utility to suppress mandatory security/recovery/current-authority locks.

After at least 20–30 materially distinct session outcomes, a successor may evaluate whether a small logistic-regression or pairwise ranking model improves precision/recall over the deterministic weights. Do not adopt it unless held-out startup simulations show lower context cost without increased missed-critical-context events.

## Success metrics

Track process metrics, not model vanity metrics:

- startup tokens/bytes loaded before first substantive engineering action;
- time/tool calls before first substantive engineering action;
- number of unnecessary historical files loaded;
- number of stale-authority corrections after startup;
- missed-critical-context incidents;
- duplicate/repeated GitHub CLI bootstrap attempts;
- number of deep-fallback escalations;
- successful direct progression into the real Remote Joining prerequisite.

Primary objective: minimize startup context cost and latency subject to zero increase in missed critical security/recovery/authority information.

## Safety constraints

- Connected GitHub app/tool remains primary. Rootless `gh` CLI bootstrap is fallback only for a concrete connector gap.
- Never use ML ranking to override current source, later owner instruction, WEC, implementation authorization, security/recovery rules or exact publication evidence.
- Never delete history merely because it scores low.
- Never make a documentation-only PR just to tune ranking weights.
- Refresh model/capsule/graph naturally at substantive milestones or WEF 100 checkpoints.

## Startup behavior

The owner still gives only the newest versioned `START_NEXT_SESSION_...md` file to the successor initially.

The successor then retrieves the compact capsule, graph and model from GitHub, verifies live state, ranks task-specific context, and expands only when the evidence says it must.

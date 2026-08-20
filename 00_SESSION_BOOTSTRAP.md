# Session Bootstrap Protocol — Live-First, Adaptive, Low-Context, High-Knowledge

This file defines the preferred startup path for every fresh Career Mode Showdown development session. Its purpose is to minimize Work Environment/context consumption while preserving current, source-grounded project knowledge.

## Startup precedence

For startup context-loading only, this protocol supersedes older handoff instructions that say to read every large authority/history file completely before doing anything.

It does not supersede substantive product, security, recovery, versioning, privacy, Remote Joining dependency, or WEC safety locks. The full successor handoff remains the deep-reference fallback.

A fresh successor should normally start from the newest versioned `START_NEXT_SESSION_...md`, then retrieve `SESSION_BOOTSTRAP.json`, `SESSION_CONTEXT_MODEL.json` and `SESSION_CONTEXT_GRAPH.json` from GitHub. Do not paste the entire full handoff into the conversation by default.

## Owner delivery rule

The owner should provide only the newest versioned `START_NEXT_SESSION_...md` file in the first interaction with the next developer.

Do not require a second owner upload by default. The successor retrieves the capsule, context model, dependency graph, current status, targeted task files, and complete handoff directly from GitHub as needed.

The owner should provide the startup pack or full handoff only as fallback when GitHub/transition-branch access fails, the compact context files are missing/corrupt, live state cannot be resolved from the delta, a deep historical security/recovery/versioning rationale is genuinely needed, or interruption/WEC recovery requires it.

## GitHub tool routing distinction — owner override

The connected GitHub app/tool available directly to a Work environment is the primary GitHub route. Use it first for repository reads, live-main verification, PR and branch state, CI evidence, commits, issues, reviews, and supported writes.

The repository-owned rootless `gh` CLI bootstrap (`npm run work:gh:bootstrap` / `scripts/bootstrap-github-cli.mjs`) is a separate environment-local fallback utility. It was created to fill genuine local shell/CLI gaps. It is not the connected GitHub app and must not be treated as a prerequisite merely because the script exists.

Do not run or repeatedly retry the CLI bootstrap at startup when the connected GitHub app/tool is functional and sufficient for the required operation. Bootstrap `gh` only when a concrete required operation cannot be completed through the connected GitHub tool and genuinely needs local CLI capability. If that route materially fails twice, obey the route circuit breaker and stop retrying it. Never extract, copy, repurpose, or inject connector credentials into `gh`.

This owner instruction is newer than predecessor process wording that described `npm run work:gh:bootstrap` as mandatory in every fresh Work environment. The successor must preserve this newer distinction and reconcile the older repository process wording/contracts naturally inside the first substantive engineering PR rather than creating a documentation-only sidequest.

## Adaptive context architecture

Do not preserve context by preloading everything. Preserve it losslessly in source and retrieve only the most useful portion for the current task.

Use four layers:

1. Lossless archive: current repository source, full handoffs, history, roadmap, tests and provider evidence remain intact.
2. Structured memory: `SESSION_BOOTSTRAP.json` plus `SESSION_CONTEXT_GRAPH.json` expose current state, provenance, locks and dependency relationships.
3. Ranking model: `SESSION_CONTEXT_MODEL.json` ranks task-relevant files/evidence under a strict context budget using task affinity, authority, live delta, dependency distance, risk criticality, contradiction value, learned utility, staleness and token cost.
4. Adaptive feedback: future sessions record which loaded items were actually useful or redundant and update utility conservatively. Mandatory security/recovery/authority locks can never be suppressed by learning.

Read `00_CONTEXT_RETRIEVAL_ENGINE.md` when the retrieval system itself needs inspection or tuning.

## Why this uses ML carefully

Do not train a heavyweight custom model yet. There are too few labeled Work-environment outcomes for reliable supervised learning, and an external vector database/API would add unnecessary cost and operational risk.

The current approach is an ML-ready hybrid: information retrieval + dependency graph + deterministic safety priors + simple online learning.

After at least 20 materially distinct labeled session outcomes, and preferably 30+, the project may evaluate a small logistic-regression or pairwise ranking model. Adopt it only if held-out startup simulations reduce context cost without increasing missed-critical-context incidents.

## Fast startup sequence

### Phase 0 — owner starter

Receive only the newest `START_NEXT_SESSION_...md` file from the owner.

### Phase 1 — compact context

Retrieve from GitHub:

- `SESSION_BOOTSTRAP.json`
- `SESSION_CONTEXT_MODEL.json`
- `SESSION_CONTEXT_GRAPH.json`

This provides the expected live-main boundary, current runtime identity, current substantive lane, full-handoff paths, highest-value safety locks, GitHub routing rule, dependency graph and adaptive retrieval policy.

### Phase 2 — live verification

Using the connected GitHub source, verify in as few calls as practical:

- current default branch / live `main` HEAD;
- latest relevant merged PR(s) after the recorded boundary;
- open PRs that could supersede the recorded lane;
- CI/check state for any current candidate;
- current package/runtime identity;
- current `WORK_ENVIRONMENT_STATUS.json`.

Do not scan all historical PRs, branches, tags, or workflow runs unless the live delta requires it.

### Phase 3 — ranked task packet

If live `main` equals `SESSION_BOOTSTRAP.json.lastVerifiedMainSha` and no newer current-authority work supersedes the capsule:

- accept the capsule as orientation;
- score current-task candidate files using `SESSION_CONTEXT_MODEL.json`;
- load mandatory locks plus the highest-ranked task files under the Tier 1 context budget;
- initialize a fresh successor WEC identity;
- begin the real current prerequisite.

If live `main` differs:

- compare only the recorded boundary to live `main`;
- give changed/intervening files maximum delta relevance;
- inspect the intervening changed files / merged PRs first;
- update the current lane from source truth;
- then rank and hydrate only the new task-specific context.

Do not compensate for a changed SHA by reading the entire repository history.

### Phase 4 — conditional deep context

Read the full successor handoff only when one or more of these is true:

- live state disagrees with the compact capsule and the delta does not resolve it;
- the current task depends on historical rationale not captured by the capsule/graph;
- a contract failure references historical authority;
- security/recovery/versioning semantics are ambiguous;
- the owner explicitly asks for full reconstruction;
- WEC requires a handoff or interruption recovery.

Read `WORK_ENVIRONMENT_HISTORY.md`, older handoffs, deep roadmap history, and archived authority only on demand.

## Context budget tiers

Tier 0 bootstrap: roughly 1–2k tokens.

Tier 1 ranked current-task packet: roughly 3–6k additional tokens.

Tier 2 live-delta packet: roughly 5–10k additional tokens only when live source moved or newer authority supersedes the capsule.

Tier 3 deep fallback: no fixed budget, but only when evidence requires it.

These are targets rather than security limits. Critical source must still be loaded when needed.

## Knowledge-preserving mandatory locks

The capsule/graph must always preserve at least:

- owner priority: Private Remote Joining is highest long-term priority, but dependency-gated and stability-first;
- current application/runtime identity;
- current verified live-main boundary;
- current substantive next lane;
- canonical browser storage authority;
- Candidate A/B/C recovery authority;
- browser Firestore write policy;
- production Firebase/runtime connection state;
- App Check/trusted-runtime/Stage 3 gates;
- public community/global leaderboard prohibition;
- version-bump policy;
- current full-handoff paths;
- current versioned starter path/version;
- connected-GitHub-first / rootless-CLI-fallback routing rule.

Ranking or learning may not remove these.

## Data-science feedback metrics

At meaningful future checkpoints, record enough evidence to evaluate startup quality where practical:

- startup context bytes/tokens before first substantive action;
- tool calls before first substantive action;
- historical files loaded but not used;
- stale-authority corrections after startup;
- missed-critical-context incidents;
- duplicate/repeated `gh` bootstrap attempts;
- Tier 3 fallback rate;
- whether the session progressed directly into the real Remote Joining prerequisite.

Optimize for lower startup cost and latency subject to zero increase in missed critical security/recovery/authority context.

## Handoff dual-copy rule

Every complete successor handoff generated from now on must be written twice in the same clean-checkpoint operation:

1. canonical working copy at the repository root using the normal `SUCCESSOR_HANDOFF_...md` filename;
2. byte-identical project-folder mirror under `project-documents/handoffs/` using the exact same filename.

After both copies are created, refresh `SESSION_BOOTSTRAP.json` so `currentHandoff.canonical` and `currentHandoff.projectMirror` point to the new files.

A handoff is not considered fully packaged until both copies exist and the compact bootstrap pointer is refreshed.

## Versioned START_NEXT_SESSION rule

At every future `Handoff proximity: 100%` / final WEF checkpoint, the closing developer must also generate a new owner-downloadable versioned starter file.

Starter versioning is independent from the website application version:

- ordinary new WEF/handoff checkpoint using the same startup protocol: increment PATCH;
- backward-compatible material startup-protocol improvement: increment MINOR;
- breaking startup-contract redesign: increment MAJOR.

The filename must include the starter version and checkpoint identifier, for example:

`START_NEXT_SESSION_V1.1.1_PR114.md`

The root versioned starter should also have a byte-identical archival mirror under `project-documents/session-starts/`.

Refresh `SESSION_BOOTSTRAP.json`, `SESSION_CONTEXT_MODEL.json` and `SESSION_CONTEXT_GRAPH.json` at the checkpoint if their current-state pointers or learned utility evidence changed. Make the root versioned starter directly available to the owner.

The newest starter is the only file the owner normally needs to give the next developer initially.

## Efficiency rule

Prefer a small accurate live delta and ranked task packet over a large stale preload.

The goal is not the fewest possible facts. The goal is the fewest loaded bytes/tokens that still make the successor safe, current, and immediately capable of advancing the real roadmap.

## Anti-sidequest rule

This bootstrap/context system exists to accelerate substantive development. Do not create repeated documentation-only milestones merely to maintain it. Refresh it naturally at real clean checkpoints, merges, or handoffs.

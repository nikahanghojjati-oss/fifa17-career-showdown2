# Session Bootstrap Protocol — Live-First, Low-Context, High-Knowledge

This file defines the preferred startup path for every fresh Career Mode Showdown development session. Its purpose is to minimize Work Environment/context consumption while preserving current, source-grounded project knowledge.

## Startup precedence

For startup context-loading only, this protocol supersedes older handoff instructions that say to read every large authority/history file completely before doing anything.

It does not supersede substantive product, security, recovery, versioning, privacy, Remote Joining dependency, or WEC safety locks. The full successor handoff remains the deep-reference fallback.

A fresh successor should normally start from the newest versioned `START_NEXT_SESSION_...md` + `SESSION_BOOTSTRAP.json`, not by pasting the entire full handoff into the conversation.

## Owner delivery rule

The owner should provide only the newest versioned `START_NEXT_SESSION_...md` file in the first interaction with the next developer.

Do not require a second owner upload by default. The successor must retrieve `SESSION_BOOTSTRAP.json`, this protocol, the current status, targeted task files, and the complete handoff directly from GitHub as needed.

The owner should provide the startup pack or full handoff only as fallback when GitHub/transition-branch access fails, the compact capsule is missing/corrupt, live state cannot be resolved from the delta, a deep historical security/recovery/versioning rationale is genuinely needed, or interruption/WEC recovery requires it.

## GitHub tool routing distinction — owner override

The connected GitHub app/tool available directly to a Work environment is the primary GitHub route. Use it first for repository reads, live-main verification, PR and branch state, CI evidence, commits, issues, reviews, and supported writes.

The repository-owned rootless `gh` CLI bootstrap (`npm run work:gh:bootstrap` / `scripts/bootstrap-github-cli.mjs`) is a separate environment-local fallback utility. It was created to fill genuine local shell/CLI gaps. It is not the connected GitHub app and must not be treated as a prerequisite merely because the script exists.

Do not run or repeatedly retry the CLI bootstrap at startup when the connected GitHub app/tool is functional and sufficient for the required operation. Bootstrap `gh` only when a concrete required operation cannot be completed through the connected GitHub tool and genuinely needs local CLI capability. If that route materially fails twice, obey the route circuit breaker and stop retrying it. Never extract, copy, repurpose, or inject connector credentials into `gh`.

This owner instruction is newer than predecessor process wording that described `npm run work:gh:bootstrap` as mandatory in every fresh Work environment. The successor must preserve this newer distinction and reconcile the older repository process wording/contracts naturally inside the first substantive engineering PR rather than creating a documentation-only sidequest.

## Core rule

Do not preload the entire project history.

Use progressive context hydration:

1. Read the tiny machine-readable `SESSION_BOOTSTRAP.json` first.
2. Verify live GitHub state before trusting recorded SHAs or task labels.
3. Read only the current WEC/status and the files directly needed by the live next task.
4. Expand into the full successor handoff, roadmap, history, or older authority documents only when a discrepancy, ambiguity, regression, or task dependency requires them.

Current source and live provider state always override this capsule.

## Fast startup sequence

### Phase 1 — tiny capsule

Read only:

- `SESSION_BOOTSTRAP.json`

This provides the expected live-main boundary, current runtime identity, current substantive lane, current full-handoff paths, highest-value safety locks, GitHub routing rule, versioned starter pointer, and the minimal targeted-read set.

### Phase 2 — live verification

Using the connected GitHub source, verify in as few calls as practical:

- current default branch / live `main` HEAD;
- latest relevant merged PR(s) after the recorded boundary;
- open PRs that could supersede the recorded lane;
- CI/check state for any current candidate;
- current package/runtime identity;
- current `WORK_ENVIRONMENT_STATUS.json`.

Do not scan all historical PRs, branches, tags, or workflow runs unless the live delta requires it.

### Phase 3 — delta decision

If live `main` equals `SESSION_BOOTSTRAP.json.lastVerifiedMainSha` and no newer current-authority work supersedes the capsule:

- accept the capsule as orientation;
- read the targeted task files listed in `SESSION_BOOTSTRAP.json.targetedReads`;
- initialize a fresh successor WEC identity;
- begin the real current prerequisite.

If live `main` differs:

- compare only the recorded boundary to live `main`;
- inspect the intervening changed files / merged PRs;
- update the current lane from source truth;
- then hydrate only the new task-specific context.

Do not compensate for a changed SHA by reading the entire repository history.

### Phase 4 — conditional deep context

Read the full successor handoff only when one or more of these is true:

- live state disagrees with the compact capsule;
- the current task depends on historical rationale not captured by the capsule;
- a contract failure references historical authority;
- security/recovery/versioning semantics are ambiguous;
- the owner explicitly asks for full reconstruction;
- WEC requires a handoff or interruption recovery.

Read `WORK_ENVIRONMENT_HISTORY.md`, older handoffs, deep roadmap history, and archived authority only on demand.

## Knowledge-preserving locks

The capsule must always preserve at least:

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

This allows a fresh session to know the project’s critical invariants without loading dozens of large files.

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

`START_NEXT_SESSION_V1.0.1_PR114.md`

The root versioned starter should also have a byte-identical archival mirror under `project-documents/session-starts/`.

Refresh `SESSION_BOOTSTRAP.json` with the starter version, root path, and mirror path. Make the root versioned starter directly available to the owner at the handoff response.

The newest starter is the only file the owner normally needs to give the next developer initially.

## Efficiency rule

Prefer a small accurate live delta over a large stale preload.

The goal is not the fewest possible facts. The goal is the fewest loaded bytes/tokens that still make the successor safe, current, and immediately capable of advancing the real roadmap.

## Anti-sidequest rule

This bootstrap system exists to accelerate substantive development. Do not create repeated documentation-only milestones merely to maintain the bootstrap. Refresh it naturally at real clean checkpoints, merges, or handoffs.

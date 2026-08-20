# Session Bootstrap Protocol — Live-First, Low-Context, High-Knowledge

This file defines the preferred startup path for every fresh Career Mode Showdown development session. Its purpose is to minimize Work Environment/context consumption while preserving current, source-grounded project knowledge.

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

This provides the expected live-main boundary, current runtime identity, current substantive lane, current full-handoff paths, highest-value safety locks, and the minimal targeted-read set.

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
- current full-handoff paths.

This allows a fresh session to know the project’s critical invariants without loading dozens of large files.

## Handoff dual-copy rule

Every complete successor handoff generated from now on must be written twice in the same clean-checkpoint operation:

1. canonical working copy at the repository root using the normal `SUCCESSOR_HANDOFF_...md` filename;
2. byte-identical project-folder mirror under `project-documents/handoffs/` using the exact same filename.

After both copies are created, refresh `SESSION_BOOTSTRAP.json` so `currentHandoff.canonical` and `currentHandoff.projectMirror` point to the new files.

A handoff is not considered fully packaged until both copies exist and the compact bootstrap pointer is refreshed.

## Efficiency rule

Prefer a small accurate live delta over a large stale preload.

The goal is not the fewest possible facts. The goal is the fewest loaded bytes/tokens that still make the successor safe, current, and immediately capable of advancing the real roadmap.

## Anti-sidequest rule

This bootstrap system exists to accelerate substantive development. Do not create repeated documentation-only milestones merely to maintain the bootstrap. Refresh it naturally at real clean checkpoints, merges, or handoffs.

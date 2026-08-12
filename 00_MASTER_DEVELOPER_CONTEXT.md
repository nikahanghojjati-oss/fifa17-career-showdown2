# Career Mode Showdown — Master Developer Context

Last updated: 2026-08-12

Use this file when a new developer session needs deeper context than the normal sixty-second bootstrap. It is a routing document, not implementation authority.

## Normal continuation order

1. `00_HANDOFF_GOLDEN_RULE.md`
2. fetch current `main` and any active release PR; record exact SHAs
3. `00_DEVELOPER_START_HERE.md`
4. `NEXT_TASK.md`
5. `PROJECT_STATE.md`
6. current release/handoff record named by `NEXT_TASK.md`
7. live source/tests named by the current task
8. `POST_V1_ROADMAP_EXECUTION.md` only for dependency ordering

Do not force every ordinary session to reread the historical archive. Current source and current-facing authority are the fastest path to operational correctness.

## Current operational deep context

The active maintenance record is:

`CAREER_MODE_SHOWDOWN_V1.1.5_MAINTENANCE_HANDOFF.md`

The active release contract is:

`RELEASE_V1.1.5.md`

At the current pre-merge point, v1.1.5 / `1.1.5-r1` is the restore-safety maintenance release candidate while immutable v1.1.4 runtime `1a498441a6ccf557aa8b8bc7ced2b3d9cd22cdf7` remains public production until expected-head merge and Pages proof.

v1.1.5 fixes two major Candidate C defects:

1. confirmed restore file/choices/raw state are frozen before asynchronous fresh revalidation, so later UI/caller mutation cannot change the plan that was confirmed;
2. rollback is transaction-owned: only successfully mutated keys are eligible for reverse rollback, clean first-write failure performs no rollback write, and Candidate C refuses to clobber newer/unowned bytes.

The maintenance release also protects strict exact raw snapshots, reviewed-state plus transaction-boundary preconditions, complete in-memory candidate computation, canonical `js/storage.js` authority, post-write verification, byte-for-byte owned rollback verification, double activation, deterministic repeat imports, corrupt-byte preservation and differentiated recovery UX.

`CLOUD_STORAGE_FOUNDATION.md` is future architecture/security authority only. It defines identity, revisions/CAS, conflicts, tombstones, privacy and security requirements but authorizes no cloud backend or network mutation in v1.1.5 or v1.2.

Before beginning v1.2, v1.1.5 must be merged, Pages-deployed, twice-proven in production and documentation-sealed.

## Primary deep historical context

When exact product history, supersession reasoning or old failure classes matter, read:

`CAREER_MODE_SHOWDOWN_MASTER_DEVELOPER_HANDOFF_FINAL_2026-08-12.md`

That consolidated handoff was produced after a targeted review of the owner’s official ChatGPT account export and repository evidence. It recovers relevant history from:

- `Website Creation and Guide`;
- `Career Mode Showdown Dev`;
- `Career Mode Showdown — Master Development Continuation`;
- repository records from the later `Project r4 Visual Fixes` / r4-r5 visual recovery period;
- Candidate A/B and v1.1.3-era handoffs;
- the owner-supplied external Grok review, with explicit pushback where claims conflict with repository evidence.

It explains why the current architecture, performance budgets, visual-source rules, release gates, anti-loop policy and roadmap order exist. It is historical/contextual authority, not current implementation authority.

## Research audit / precision companion

Use this only when validating provenance of the historical deep-dive or resolving one of its precision notes:

`CAREER_MODE_SHOWDOWN_MASTER_DEVELOPER_HANDOFF_RESEARCH_COMPLETION_2026-08-12.md`

It records:

- the interrupted/resumed research state;
- verification of the Aug 10 ChatGPT export;
- relevant conversation IDs/message counts;
- confirmation that `Project r4 Visual Fixes` is absent from that export and must be reconstructed from repository evidence;
- image-inventory measurements used to correct an external project-size estimate;
- historical observations that may have been superseded by later source.

The rolling research handoff, roadmap/review appendix and historical owner-decision index remain available when exact source chronology is needed.

## Authority rule

Current source on the active release branch, then `main` after merge, wins over historical context.

A later explicit owner decision can supersede older documentation. Current `PROJECT_STATE.md`, `NEXT_TASK.md`, release records and current handoffs describe operational truth. Historical documents explain why, not what to reimplement.

Do not use historical handoffs to revive rejected images, old scoring rules, superseded rollback semantics, stale release tasks or roadmap shortcuts.

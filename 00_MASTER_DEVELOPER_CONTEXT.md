# Career Mode Showdown — Master Developer Context

Last updated: 2026-08-13 ET

Use this file when a new developer session needs deeper context than the normal sixty-second bootstrap. It is a routing document, not implementation authority.

## Normal continuation order

1. `00_HANDOFF_GOLDEN_RULE.md`
2. fetch current `main` and any active PRs; record exact SHAs
3. `00_DEVELOPER_START_HERE.md`
4. `00_CURRENT_HANDOFF.md`
5. `PROJECT_STATE.md`
6. `NEXT_TASK.md`
7. current release/proof/handoff records named by those files
8. live source/tests named by the current task
9. `POST_V1_ROADMAP_EXECUTION.md` only for dependency ordering

Do not force every ordinary session to reread the historical archive. Current source and current-facing authority are the fastest path to operational correctness.

## Current operational deep context

Current production application: v1.2.0 — Installable Offline App
Current production runtime: `1.2.0-r2`
Previous known-good runtime: `1.2.0-r1`
Status: merged, deployed, exact-byte verified and technically production-proven
Release PR: #39
Hotfix merge: `2179b7928602b9579dc6e129c40b8739082de80a`
Production Stability: `31740111919` / deployed-site-smoke job `94581704562`
Release Integration Burn-In: `31740111986` — 2/2
Next legal milestone: v1.3.0 — Recovery & Device Resilience Hardening

Current r2 records:

- `V1.2.0_R2_PRODUCTION_PROOF.md`
- `RELEASE_V1.2.0_R2.md`
- `CAREER_MODE_SHOWDOWN_V1.2.0_R2_MAINTENANCE_HANDOFF.md`

The r2 hotfix closed two owner-reported production regressions: iOS standalone loading composition and the unacceptable global floating install/status UI. Loading composition is now structurally independent of standalone viewport-height growth, and install/update presentation lives only in Settings. The Service Worker/cache/recovery architecture remains intact.

`RELEASE_V1.2.0.md` and `CAREER_MODE_SHOWDOWN_V1.2.0_MAINTENANCE_HANDOFF.md` are immutable `1.2.0-r1` rollback/history evidence, not current production status.

Candidate A export, Candidate B read-only analysis and Candidate C Atomic Restore + Recovery are complete and protected. Candidate C preserves immutable confirmed intent, strict exact raw snapshot/preconditions, last-moment write checks, transaction-owned rollback, anti-clobber semantics and byte-for-byte verification.

`CLOUD_STORAGE_FOUNDATION.md` remains future architecture/security authority only. It authorizes no cloud backend or network state mutation in the current product.

## v1.3 continuation warning

Open draft PR #37 (`agent/v13-hardening`) is not a trusted baseline. Last inspected head: `221212a87cc58712a1ebd9452d7b71cdaa36327d`.

Commit `6ce7fe6fab87031b69e3dc5e98587fd3f78b3558` (`Freeze v1.3 shell identity`) replaced large portions of the proven production DOM while existing JS/CSS still expected the original structure. This caused menu initialization/visibility failures and version-coherence problems.

A new developer must start reasoning from current r2 `main`, compare PR #37 against current main, isolate useful evidence-backed hardening from the accidental shell replacement, and avoid merging/deploying the draft as-is. Do not migrate the entire app to the accidental alternate shell unless the owner explicitly requests redesign.

See `00_CURRENT_HANDOFF.md` and `NEXT_TASK.md` for exact continuation instructions and known potentially useful PR #37 hardening work.

## Primary deep historical context

When exact product history, supersession reasoning or old failure classes matter, read:

`CAREER_MODE_SHOWDOWN_MASTER_DEVELOPER_HANDOFF_FINAL_2026-08-12.md`

That consolidated handoff was produced after a targeted review of the owner’s official ChatGPT account export and repository evidence. It recovers relevant history from earlier development conversations and repository-native visual/data-safety releases. It explains why the architecture, performance budgets, visual-source rules, release gates, anti-loop policy and roadmap order exist.

It is historical/contextual authority, not current implementation authority. Do not follow old release-status statements from it over current source/current handoffs.

## Research audit / precision companion

Use this only when validating provenance of the historical deep-dive or resolving its precision notes:

`CAREER_MODE_SHOWDOWN_MASTER_DEVELOPER_HANDOFF_RESEARCH_COMPLETION_2026-08-12.md`

It records the historical research/audit process, source coverage, image-inventory measurements and observations that may have been superseded by later verified source.

The rolling research handoff, roadmap/review appendix and historical owner-decision index remain available when exact source chronology is needed.

## Permanent authority rule

Current verified source on `main` wins over historical context. A later explicit owner decision can supersede older documentation. Current `00_CURRENT_HANDOFF.md`, `PROJECT_STATE.md`, `NEXT_TASK.md`, current release records and current handoffs describe operational truth. Historical documents explain why, not what to reimplement.

Do not use historical handoffs to revive rejected images, old scoring rules, superseded rollback semantics, stale release tasks, global floating install UI, accidental PR #37 shell markup or roadmap shortcuts.

The next developer’s immediate task is v1.3 Recovery & Device Resilience Hardening from current `1.2.0-r2` main, with PR #37 treated as an audit input rather than a base branch.
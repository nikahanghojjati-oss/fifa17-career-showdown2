# Career Mode Showdown — Repository Agent Instructions

These instructions apply to the entire repository.

## Source-first authority

Treat every handoff as orientation, never as implementation authority. Before changing anything, independently fetch and inspect live `main`, recent commits, tags, releases, open pull requests, active branches, repository authority documents, current tests and the deployed site. Current verified source and a later explicit owner instruction override recorded SHAs and historical prose.

`NEXT_TASK.md` is the sole repository owner of implementation authorization. Do not infer permission from roadmap order, an old branch, an old PR or an available idea. Development-process documentation and tests do not authorize product-runtime changes.

## Mandatory SLE successor packaging

`00_SLE_HANDOFF_PROTOCOL.md` is permanent repository policy and applies recursively to every current and future developer/ChatGPT Work Environment.

The repository uses `SLE` as the project label for its live-first, low-context adaptive successor-loading system. Later explicit owner authority in `00_SLE_HANDOFF_PROTOCOL.md` defines `SLE = Smart Lean Efficient` and supersedes the older unexpanded-label wording. Preserve that exact definition in every generated SLE starter and handoff unless the owner later changes it.

A project handoff is incomplete if it is only a chat prompt or a single unmirrored Markdown file. At every `Handoff proximity: 100%`, `HANDOFF_AT_CHECKPOINT`, `HANDOFF_NOW`, or equivalent final transition boundary, the closing developer must complete the SLE package defined by `00_SLE_HANDOFF_PROTOCOL.md` and `00_SESSION_BOOTSTRAP.md`: complete root SLE handoff plus byte-identical project mirror, new versioned root START_NEXT_SESSION plus byte-identical project mirror, refreshed `SESSION_BOOTSTRAP.json` current pointers, progressive context refresh when materially needed, explicit immediate successor task, exact live/WEC/security/RJR evidence, applicable SLE contract validation, and the clean stop before the next substantial milestone.

Every generated SLE handoff and starter must recursively preserve this same SLE requirement so future developers cannot silently fall back to a non-SLE handoff unless the owner explicitly changes the policy.

For fresh-session loading, prefer the newest versioned `START_NEXT_SESSION_...md` and compact `SESSION_BOOTSTRAP.json` path defined by `00_SESSION_BOOTSTRAP.md`; do not preload all history merely because the SLE deep-reference handoff exists.

## Mandatory GitHub tooling bootstrap

The connected GitHub app is the connector-first authority for repository, pull-request and issue metadata and supported writes. The `gh` CLI fills local workflow gaps such as authentication checks, current-branch discovery and GitHub Actions evidence; its availability never reverses that authority order.

Before substantial GitHub work in every fresh Work environment, run:

```sh
npm run work:gh:bootstrap
```

The repository-owned bootstrap checks for an existing `gh`. When it is absent, it resolves the current official stable GitHub CLI release, downloads the matching Linux archive from `cli/cli`, verifies that archive against the release's published SHA-256 checksum and installs a rootless launcher under ignored `.work-tools/`. It then runs `gh --version` and `gh auth status` using a writable environment-local configuration directory.

If `gh` is not authenticated, use only the supported user-directed `gh auth login` flow printed by the bootstrap and rerun the status check. Never extract, copy or repurpose connector credentials, never place a token on a command line and never commit `.work-tools/` or GitHub authentication state. An environment-local installation or login must not be assumed to survive a Work environment transition.

If the Work command layer cancels the npm wrapper before execution, run the exact owner directly with `node scripts/bootstrap-github-cli.mjs`; do not infer a bootstrap or authentication result from an unexecuted wrapper.

## Mandatory Work Environment Continuity loop

At the start of every development environment, read these files before substantial work:

1. `00_HANDOFF_GOLDEN_RULE.md`
2. `00_SLE_HANDOFF_PROTOCOL.md`
3. `00_WORK_ENVIRONMENT_CONTINUITY.md`
4. `00_FORWARD_PROGRESS_ANTI_LOOP.md`
5. `WORK_ENVIRONMENT_STATUS.json`
6. `WORK_ENVIRONMENT_HISTORY.md`
7. `00_DEVELOPER_START_HERE.md`
8. `00_CURRENT_HANDOFF.md`
9. `PROJECT_STATE.md`
10. `NEXT_TASK.md`

Then follow this order:

1. Validate the inherited status record with `npm run work:continuity:validate` before changing it.
2. If the record belongs to an earlier environment, preserve its final facts. When a safe additions-only route is genuinely available, append its final facts to `WORK_ENVIRONMENT_HISTORY.md`. If the available tool cannot append without risking rewrite/truncation, preserve an exact recovery-safe payload instead and do not let that deferred append block the next owner-authorized engineering milestone unless a permanent gate actually requires the canonical append. Replace the predecessor record with a new unique environment ID, reset every per-environment observation and record the live `main` SHA in `repository.startingMainSha`.
3. Record the current bounded task, safe checkpoint, next action, unfinished work and hazards.
4. Only after the current environment owns `WORK_ENVIRONMENT_STATUS.json`, run `npm run work:assess` and obey that new environment's decision.

A closed or transition-prepared decision can correctly stop its owning environment. Never treat the predecessor's transition decision as the successor's starting decision, and never let it prevent the successor from initializing its own record.

When a fresh successor is allowed to continue and current source plus owner direction identify the next real engineering dependency, the successor may activate that task in `NEXT_TASK.md` atomically with the same bounded engineering candidate. Do not create a preliminary authority-only PR merely because the predecessor checkpoint is still named in current files.

Update `WORK_ENVIRONMENT_STATUS.json` at every meaningful checkpoint described by the protocol, then run `npm run work:assess` again.

Never guess an exact hidden context-token or account-usage value. `usageRemainingPercent` stays `null` with `usageSource: "unavailable"` unless the product usage dashboard, CLI `/status` or the owner supplies a value. An explicit usage warning may be recorded without a percentage.

Obey the assessment decision:

- `CONTINUE`: continue only the currently authorized bounded task.
- `PREPARE_HANDOFF`: update continuity records and finish the current checkpoint before another milestone.
- `HANDOFF_AT_CHECKPOINT`: finish or safely revert the bounded operation, freeze evidence, run `npm run work:handoff`, alert the owner, complete the mandatory SLE package, and stop before new substantial work.
- `HANDOFF_NOW`: start no more work; seal the current coherent boundary, complete the mandatory SLE package and stop.
- `FINISH_SAFE_BOUNDARY`: complete or safely revert only the minimum atomic work needed for coherence, then perform the mandatory SLE handoff immediately.

When an environment closes, append its final record to `WORK_ENVIRONMENT_HISTORY.md` through a safe additions-only route when available. If no safe append route exists, preserve the exact recovery payload and do not manufacture a history-only milestone solely to perform that append. Give the owner the newest versioned SLE `START_NEXT_SESSION_...md` as the normal next-session entrypoint; the complete deep-reference handoff remains repository-native fallback. The next environment inherits this loop recursively.

## Mandatory forward-progress / anti-loop rule

`00_FORWARD_PROGRESS_ANTI_LOOP.md` is permanent repository policy. Continuity, history and current-authority maintenance protect engineering; they are not the project destination.

1. After a fresh WEC allows continuation, advance the smallest safe owner-prioritized engineering dependency. For the current project direction, prefer work that materially reduces dependency distance to a workable private Remote Joining session.
2. Do not open a standalone continuity/history/authority PR unless an objective blocker exists: a failing permanent contract, contradictory current implementation authority, unsafe publication/recovery state, data-loss/security risk, or another demonstrated condition that prevents safe engineering or publication.
3. Stale historical prose that cannot override current source, an unappended non-authoritative history payload, naming cleanup or general documentation cleanliness is not by itself a blocker.
4. Do not create history-of-history repair loops or a new history-only milestone merely because the prior closeout produced more history.
5. If live `main` advances before publication because another environment already merged equivalent or superseding work, stop the stale candidate, compare outcomes, close/abandon duplicate work when satisfied, adopt live `main`, and continue to the next real dependency. Do not create a reconciliation PR solely because the base SHA changed.
6. After an interruption, reconstruct exact branch/PR/CI/live-main state and resume from the last coherent engineering checkpoint. Do not restart the entire repository study when the current fresh WEC and source boundary remain valid.

This anti-loop rule never permits skipping a real security, recovery, dependency, testing, WEC, SLE or publication requirement.

## Mandatory Handoff Proximity owner reporting

Every substantive owner-facing response while meaningful project work is underway must visibly include exactly the reporting label:

`Handoff proximity: X%`

The percentage is an evidence-based estimate of proximity to a recommended Work environment transition. It is not task-completion percentage and must not mechanically increase after every message. Consider observable context pressure, WEC state, completed milestones, evidence volume, corrected failures, tooling friction, unresolved failures, remaining atomic work, handoff readiness and whether the next task is a separate milestone.

Never fabricate account/model usage to calculate Handoff proximity. If usage is unavailable, base the estimate only on observable continuity evidence and leave `usageRemainingPercent` unavailable in the WEC record.

At `Handoff proximity: 100%` the current environment must automatically generate the complete successor handoff as the full SLE package, finish only the current safe bounded checkpoint and stop before beginning another substantial milestone. A plain ready-to-paste prompt alone does not satisfy this boundary.

The repository Work Environment Continuity decision is authoritative when it requires an earlier or stricter transition. Handoff proximity complements WEC and never weakens `PREPARE_HANDOFF`, `HANDOFF_AT_CHECKPOINT`, `HANDOFF_NOW` or `FINISH_SAFE_BOUNDARY`.

Every successor SLE handoff must recursively preserve this same Handoff Proximity rule and the mandatory recursive SLE packaging rule so both requirements propagate to every later environment unless the owner explicitly changes them.

## Mandatory eight-line owner progress report

Every substantive owner-facing development response must include this exact eight-line status shape, in this order, with values updated from current evidence:

```text
Handoff proximity: X%
Remote Joining readiness: ~Y%
Estimated focused sessions to genuine RJR100: ~N–M
Current lane: <current bounded engineering lane>
Concrete dependency completed: <most recent concrete dependency completed>
Next unlock: <next dependency or proof gate>
Blocker: <current blocker, or NONE>
Sidequest check: <NONE, or NECESSARY because ...>
```

`Handoff proximity` remains the WEC transition-proximity signal above. `Remote Joining readiness` is separate and estimates end-to-end readiness of the owner-prioritized Private Remote Joining major feature, including its infrastructure, prerequisites, implementation, exact-head validation, deployment/public proof when applicable, hardening and known release-blocking bug closure.

`Estimated focused sessions to genuine RJR100` is a roadmap-based planning estimate, not a score-derived countdown, promise, or RJR evidence. Recalculate it when verified dependencies, provider behavior, Stage 5 scope, physical-device/network acceptance, review findings, reconnect/token hardening, or final release work materially change the critical path. Use a realistic focused-session range from current authority; where uncertainty is material, explain the contingency outside the eight-line block rather than hiding it. At genuine RJR100 the value becomes `~0`.

Do not rename or replace `Remote Joining readiness` while Private Remote Joining is still incomplete. The label changes only after current source proves Private Remote Joining is fully finished, integrated, tested, hardened and bug-fixed at the authoritative production boundary, all required exact-head and runtime/deployment gates are green, known release blockers are resolved, and owner acceptance is recorded when an owner-facing acceptance surface applies.

After that completion boundary, replace only the second-line feature label with `<Next Major Feature> readiness: ~Y%`, where `<Next Major Feature>` is the next owner-authorized major feature selected by current source/implementation authority. Never infer that feature only from old roadmap order. The remaining seven reporting lines keep the same meaning; the RJR100 session estimate remains `~0` after genuine RJR100 unless the owner explicitly replaces that metric.

`Sidequest check` is `NONE` for direct authorized roadmap/dependency work. Use `NECESSARY because ...` only for objectively required safety, continuity, correctness, security, recovery, publication or owner-mandated process work. Do not create optional cleanup merely to fill this field.

Owner-instruction provenance for the original reporting format is preserved at `authority-history/OWNER_PROGRESS_REPORTING_FORMAT_2026-08-19.md`. The owner's explicit 2026-08-29 instruction adds the roadmap-based RJR100 session-estimate line. Historical provenance never overrides newer verified source or a later explicit owner instruction.

Every successor handoff and fresh Work environment inherits this eight-line format recursively unless the owner explicitly changes it. Every such successor handoff must also be packaged as SLE under `00_SLE_HANDOFF_PROTOCOL.md`.

## Current owner reporting override — SSJR, 2026-09-05

The owner's later explicit instruction in `authority-history/OWNER_SSJR_REPORTING_AND_PAIRING_ORDER_2026-09-05.md` supersedes the old RJR feature and session-estimate labels above for current and future work. RJR-1 is complete/frozen at 100/100. The current eight-line report is:

```text
Handoff proximity: X%
Shared Showdown Journey readiness: Y/100
Estimated focused sessions to genuine SSJR100: ~N–M
Current lane: <current bounded engineering lane>
Concrete dependency completed: <most recent concrete dependency completed>
Next unlock: <next dependency or proof gate>
Blocker: <current blocker, or NONE>
Sidequest check: <NONE, or NECESSARY because ...>
```

Report SSJR from `SHARED_SHOWDOWN_JOURNEY_READINESS.json` at every substantive checkpoint, even when unchanged. Explain how the action proves a fixed capability or removes a specific dependency. Estimate sessions from remaining engineering/proof stages, never from score arithmetic; explain material forecast changes. SSJR100 means a production-proven playable supported Shared Showdown Journey for two remote managers. Automate every feasible test and ask only for the minimum unavoidable physical/account action after prerequisites are complete.

The shared journey must pair both legitimate managers to the exact Connected Rivalry and reach ACTIVE before league or club selection. Enforce that order in both UI and provider authority. A pre-draw local Save/profile shell may satisfy identity binding without committing a league or clubs. Do not change the fixed SSJR-1 model or claim production capability from candidate code alone. Preserve this reporting override and product order recursively in successor packages.

## Interruption and tooling-resilience guardrails

Treat a tool/session interruption as a recoverable infrastructure event, never as permission to infer success or restart work from memory.

1. Before a long multi-tool or multi-file sequence, make `WORK_ENVIRONMENT_STATUS.json` describe the exact branch/HEAD safe checkpoint, current task, next safe action and hazards. Material decisions must not live only in chat while additional repository mutations continue.
2. Do not create temporary self-modifying GitHub Actions workflows to append history, mutate the working branch, initialize WEC or work around a missing connector route. Use the connected GitHub contents/ref APIs or a real checkout. A repository workflow may mutate state only when it is already a reviewed permanent workflow explicitly designed for that operation.
3. Apply a route circuit breaker. After one unsupported or malformed tool route, correct the route once. After a second materially similar failure, stop retrying that route, record the limitation and switch to a different supported path or finish at the nearest coherent checkpoint.
4. Apply optimistic-lock discipline to GitHub file writes. Fetch the exact branch blob SHA immediately before update/delete. If GitHub rejects a write with stale-SHA/409 semantics, do not retry from cached state; refetch the file, re-evaluate the intended patch and then retry once.
5. Do not issue identical CI/status polling calls consecutively on an unchanged exact head. Inspect another useful source/evidence item between checks, and treat in-progress CI as pending rather than a failure. Never create repository mutations merely to force a poll or dispatch.
6. For append-only authority such as `WORK_ENVIRONMENT_HISTORY.md`, inspect the resulting per-file PR patch before accepting the mutation. The patch must contain no deletion/rewrite of prior history; corrections are new appended dated entries.
7. The final transition-prepared WEC seal must be the last branch mutation. Any later branch mutation invalidates that seal and requires a new final seal plus a fresh exact-head validation gate.
8. After an unexpected interruption, resume by re-fetching current PR metadata, exact branch HEAD, changed filenames and current workflow state before any write. Never assume the last attempted tool call completed.

These guardrails exist to prevent chat/tool instability from becoming repository-state ambiguity. They change development process only and never authorize product runtime behavior.

## Validation and product safety

Run the smallest relevant checks during implementation and the repository contract suite before publication. Do not weaken tests, workflow topology, recovery guarantees, performance ceilings or protected product semantics merely to obtain green results.

The continuity/SLE system is repository development infrastructure. Do not add it to the Career Mode Showdown website runtime, Service Worker shell, browser storage or user interface.

# Career Mode Showdown — Repository Agent Instructions

These instructions apply to the entire repository.

## Source-first authority

Treat every handoff as orientation, never as implementation authority. Before changing anything, independently fetch and inspect live `main`, recent commits, tags, releases, open pull requests, active branches, repository authority documents, current tests and the deployed site. Current verified source and a later explicit owner instruction override recorded SHAs and historical prose.

`NEXT_TASK.md` is the sole repository owner of implementation authorization. Do not infer permission from roadmap order, an old branch, an old PR or an available idea. Development-process documentation and tests do not authorize product-runtime changes.

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
2. `00_WORK_ENVIRONMENT_CONTINUITY.md`
3. `WORK_ENVIRONMENT_STATUS.json`
4. `WORK_ENVIRONMENT_HISTORY.md`
5. `00_DEVELOPER_START_HERE.md`
6. `00_CURRENT_HANDOFF.md`
7. `PROJECT_STATE.md`
8. `NEXT_TASK.md`

Then follow this order:

1. Validate the inherited status record with `npm run work:continuity:validate` before changing it.
2. If the record belongs to an earlier environment, append its final facts to `WORK_ENVIRONMENT_HISTORY.md`, replace it with a new unique environment ID, reset every per-environment observation and record the live `main` SHA in `repository.startingMainSha`.
3. Record the current bounded task, safe checkpoint, next action, unfinished work and hazards.
4. Only after the current environment owns `WORK_ENVIRONMENT_STATUS.json`, run `npm run work:assess` and obey that new environment's decision.

A closed or transition-prepared decision can correctly stop its owning environment. Never treat the predecessor's transition decision as the successor's starting decision, and never let it prevent the successor from initializing its own record.

Update `WORK_ENVIRONMENT_STATUS.json` at every meaningful checkpoint described by the protocol, then run `npm run work:assess` again.

Never guess an exact hidden context-token or account-usage value. `usageRemainingPercent` stays `null` with `usageSource: "unavailable"` unless the product usage dashboard, CLI `/status` or the owner supplies a value. An explicit usage warning may be recorded without a percentage.

Obey the assessment decision:

- `CONTINUE`: continue only the currently authorized bounded task.
- `PREPARE_HANDOFF`: update continuity records and finish the current checkpoint before another milestone.
- `HANDOFF_AT_CHECKPOINT`: finish or safely revert the bounded operation, freeze evidence, run `npm run work:handoff`, alert the owner and stop before new substantial work.
- `HANDOFF_NOW`: start no more work; seal the current coherent boundary, generate the prompt and stop.
- `FINISH_SAFE_BOUNDARY`: complete or safely revert only the minimum atomic work needed for coherence, then hand off immediately.

When an environment closes, append its final record to `WORK_ENVIRONMENT_HISTORY.md`. Give the owner the complete ready-to-paste output from `npm run work:handoff`. The next environment inherits this loop recursively.

## Mandatory Handoff Proximity owner reporting

Every substantive owner-facing response while meaningful project work is underway must visibly include exactly the reporting label:

`Handoff proximity: X%`

The percentage is an evidence-based estimate of proximity to a recommended Work environment transition. It is not task-completion percentage and must not mechanically increase after every message. Consider observable context pressure, WEC state, completed milestones, evidence volume, corrected failures, tooling friction, unresolved failures, remaining atomic work, handoff readiness and whether the next task is a separate milestone.

Never fabricate account/model usage to calculate Handoff proximity. If usage is unavailable, base the estimate only on observable continuity evidence and leave `usageRemainingPercent` unavailable in the WEC record.

At `Handoff proximity: 100%` the current environment must automatically generate the complete successor handoff, finish only the current safe bounded checkpoint and stop before beginning another substantial milestone.

The repository Work Environment Continuity decision is authoritative when it requires an earlier or stricter transition. Handoff proximity complements WEC and never weakens `PREPARE_HANDOFF`, `HANDOFF_AT_CHECKPOINT`, `HANDOFF_NOW` or `FINISH_SAFE_BOUNDARY`.

Every successor handoff must recursively preserve this same Handoff Proximity rule so the requirement propagates to every later environment unless the owner explicitly changes it.

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

The continuity system is repository development infrastructure. Do not add it to the Career Mode Showdown website runtime, Service Worker shell, browser storage or user interface.

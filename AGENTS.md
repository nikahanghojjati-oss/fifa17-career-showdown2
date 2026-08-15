# Career Mode Showdown — Repository Agent Instructions

These instructions apply to the entire repository.

## Source-first authority

Treat every handoff as orientation, never as implementation authority. Before changing anything, independently fetch and inspect live `main`, recent commits, tags, releases, open pull requests, active branches, repository authority documents, current tests and the deployed site. Current verified source and a later explicit owner instruction override recorded SHAs and historical prose.

`NEXT_TASK.md` is the sole repository owner of implementation authorization. Do not infer permission from roadmap order, an old branch, an old PR or an available idea. Development-process documentation and tests do not authorize product-runtime changes.

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

Then run:

```sh
npm run work:continuity:validate
npm run work:assess
```

Replace the prior environment record with a new environment ID and fresh observable signals before starting substantial work. Update `WORK_ENVIRONMENT_STATUS.json` at every meaningful checkpoint described by the protocol, then run `npm run work:assess` again.

Never guess an exact hidden context-token or account-usage value. `usageRemainingPercent` stays `null` with `usageSource: "unavailable"` unless the product usage dashboard, CLI `/status` or the owner supplies a value. An explicit usage warning may be recorded without a percentage.

Obey the assessment decision:

- `CONTINUE`: continue only the currently authorized bounded task.
- `PREPARE_HANDOFF`: update continuity records and finish the current checkpoint before another milestone.
- `HANDOFF_AT_CHECKPOINT`: finish or safely revert the bounded operation, freeze evidence, run `npm run work:handoff`, alert the owner and stop before new substantial work.
- `HANDOFF_NOW`: start no more work; seal the current coherent boundary, generate the prompt and stop.
- `FINISH_SAFE_BOUNDARY`: complete or safely revert only the minimum atomic work needed for coherence, then hand off immediately.

When an environment closes, append its final record to `WORK_ENVIRONMENT_HISTORY.md`. Give the owner the complete ready-to-paste output from `npm run work:handoff`. The next environment inherits this loop recursively.

## Validation and product safety

Run the smallest relevant checks during implementation and the repository contract suite before publication. Do not weaken tests, workflow topology, recovery guarantees, performance ceilings or protected product semantics merely to obtain green results.

The continuity system is repository development infrastructure. Do not add it to the Career Mode Showdown website runtime, Service Worker shell, browser storage or user interface.

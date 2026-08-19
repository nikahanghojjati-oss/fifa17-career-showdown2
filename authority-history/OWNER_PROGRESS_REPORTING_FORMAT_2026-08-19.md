# Owner progress-reporting instruction — 2026-08-19 ET

This file preserves the owner instruction that every future Career Mode Showdown development environment must use the same concise seven-line progress report in every substantive owner-facing development response.

Historical provenance does not itself authorize implementation. Current verified source, `NEXT_TASK.md`, `AGENTS.md`, `00_HANDOFF_GOLDEN_RULE.md`, `00_WORK_ENVIRONMENT_CONTINUITY.md` and later explicit owner instructions remain controlling.

Required report shape while Private Remote Joining is the active major feature:

```text
Handoff proximity: X%
Remote Joining readiness: ~Y%
Current lane: <current bounded engineering lane>
Concrete dependency completed: <most recent concrete dependency completed>
Next unlock: <next dependency/gate that unlocks forward progress>
Blocker: <current blocker, or NONE>
Sidequest check: <NONE, or NECESSARY because ...>
```

Meaning:

1. `Handoff proximity` estimates Work-environment transition proximity under the existing WEC/Handoff Proximity policy. It is not task completion and never fabricates hidden usage.
2. `Remote Joining readiness` estimates end-to-end readiness of the owner-prioritized Private Remote Joining major feature, including all prerequisite infrastructure, dependency stages, implementation, validation, hardening and known-bug closure. It is distinct from Handoff proximity.
3. `Current lane` names the exact bounded engineering lane being worked now.
4. `Concrete dependency completed` names the newest real dependency or gate that is complete, not generic activity.
5. `Next unlock` names the next dependency, validation gate or prerequisite that enables forward roadmap progress.
6. `Blocker` names the current blocking condition. Use `NONE` only when there is no material blocker.
7. `Sidequest check` must be `NONE` when the work is directly on the authorized roadmap/dependency lane. Use `NECESSARY because ...` only when a non-feature task is objectively required for safety, continuity, correctness, security, recovery, publication or owner-mandated process. Do not create optional cleanup work merely to fill this field.

Major-feature lifecycle rule:

`Remote Joining readiness` remains the second line until Private Remote Joining is fully finished, integrated, tested, hardened and bug-fixed at the authoritative production boundary. Do not switch the label merely because implementation starts, a PR opens, a milestone merges, or basic tests pass.

The switch is permitted only after current source proves the major feature is complete, all required prerequisite/dependency stages are complete, required exact-head CI and runtime/deployment tests are green, known release-blocking bugs are resolved, production/public verification is complete when applicable, and owner acceptance is recorded when the feature has an owner-facing acceptance surface.

After that completion boundary, the second line must automatically become:

```text
<Next Major Feature> readiness: ~Y%
```

where `<Next Major Feature>` is the next owner-authorized major feature from current source/roadmap authority. The remaining five engineering-status lines continue unchanged in purpose and track that new active major feature and its dependency lane. Never guess the next feature from old roadmap order when current implementation authority has not selected it.

Every successor handoff and fresh Work environment must preserve this reporting behavior recursively unless the owner explicitly changes it later.

# Ready-to-Paste Next Session Start — V1.0.0 — PR #113

Give this file alone to the next developer in the first interaction.

Do not also paste the full handoff, bootstrap JSON, history, roadmap, or other large project files unless the fallback conditions below occur. The successor should retrieve the compact bootstrap and any deeper context itself from GitHub.

Continue the FIFA 17 Career Mode Showdown project from the newest live source state.

## GitHub tool distinction — owner override

The connected GitHub app/tool available directly to the Work environment is the primary GitHub route. Use it first for repository reads, live-main verification, PRs, CI evidence, branches, commits, issues, reviews, and supported writes.

The repository-owned rootless `gh` CLI bootstrap (`npm run work:gh:bootstrap` / `scripts/bootstrap-github-cli.mjs`) is a separate environment-local fallback utility created for Work environments that actually need a shell/CLI-only GitHub capability. It is not the connected GitHub app, it is not required merely because the script exists, and it must not be repeatedly invoked when the connected GitHub tool already satisfies the needed operation.

Do not attempt the CLI bootstrap at startup when the connected GitHub app/tool is functional and sufficient. Bootstrap `gh` only when a concrete required operation cannot be performed through the connected GitHub tool and genuinely needs local CLI capability. If that route fails materially twice, obey the repository route circuit breaker: stop retrying it and switch to a supported route or preserve the coherent checkpoint. Never copy connector credentials into `gh`.

This owner instruction is newer than predecessor wording that described the CLI bootstrap as mandatory in every fresh environment. Carry this distinction into the first substantive engineering PR so repository process docs/contracts are reconciled without creating a documentation-only sidequest.

## Lean startup

Do not preload the full historical handoff or all large project documents.

First read `SESSION_BOOTSTRAP.json` and `00_SESSION_BOOTSTRAP.md` from transition branch `agent/post-pr113-app-check-handoff`, then use the connected GitHub source to verify current live `main`, latest relevant merged/open PRs, current candidate CI if any, runtime identity, and `WORK_ENVIRONMENT_STATUS.json`.

If live `main` still matches the capsule and no newer current-authority work supersedes it, hydrate only the targeted task files listed in `SESSION_BOOTSTRAP.json`, initialize a fresh WEC identity, and immediately continue the real next Remote Joining prerequisite.

If live state differs, inspect only the delta from the capsule's recorded main SHA to current live main, reconstruct the changed current lane from those intervening commits/PRs, and then hydrate only the newly relevant task files.

Use the complete successor handoff only as deep-reference fallback when the compact capsule cannot resolve a discrepancy, historical rationale, security/recovery/versioning ambiguity, contract failure, or WEC transition requirement.

## Expected next lane

Current expected next lane at this checkpoint is Firebase App Check with reCAPTCHA Enterprise registration/integration proof. Verify current official Firebase/Google Cloud documentation before provider mutation. Keep App Check enforcement off until controlled client integration and metrics prove legitimate traffic works. Do not start Stage 3 pairing before genuine Stage 2 production/operational activation is complete.

Private Remote Joining remains the highest long-term priority, dependency-gated and stability-first. Do not create documentation/history sidequests when substantive prerequisite work is available.

## When the owner should send more files

Do not ask the owner for a second upload by default. Retrieve the referenced files directly from GitHub.

Request/use the startup pack or full handoff only if one of these occurs:

1. the connected GitHub tool cannot access the repository or transition branch;
2. the compact capsule is missing/corrupt;
3. live source materially contradicts the capsule and the delta cannot resolve the current lane;
4. a historical security/recovery/versioning rationale is genuinely required and cannot be recovered from current source;
5. interruption recovery or WEC handoff requires the full deep-reference record.

## Permanent WEF 100 packaging rule

At every future `Handoff proximity: 100%` / final WEF checkpoint, the closing developer must generate and make available to the owner a new versioned `START_NEXT_SESSION_...md` file in addition to the complete successor handoff.

Starter versioning is independent from the application version:

- ordinary new WEF/handoff checkpoint with the same startup protocol: increment PATCH (`V1.0.0` → `V1.0.1` → `V1.0.2`);
- backward-compatible material startup-protocol improvement: increment MINOR;
- breaking startup-contract redesign: increment MAJOR.

The filename must include both the starter version and the checkpoint identifier, for example `START_NEXT_SESSION_V1.0.1_PRxxx.md`.

The owner-facing rule is simple: give only the newest versioned `START_NEXT_SESSION_...md` file to the next developer first. Keep the full handoff/startup pack only as fallback.

Every future complete successor handoff must still be created both at repository root and as a byte-identical mirror under `project-documents/handoffs/`, and `SESSION_BOOTSTRAP.json` must be refreshed to point to the newest handoff and newest starter file.

Because this optimized bootstrap was created on the transition branch after PR #113, carry these bootstrap/project-document files naturally into the first substantive App Check PR. Do not open a documentation-only PR just to publish them.

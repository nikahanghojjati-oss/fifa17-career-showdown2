# Visual Reasoning Controller Contract

Status: EVERGREEN CONTROL AUTHORITY / READ BEFORE VISUAL ASSET WORK

Applies to: `visual/r8-5-approved-character-identity-lock` and any successor visual-production branch derived from it.

## Controller hierarchy

GPT-5.6 Sol reasoning is the visual-project controller.

Image generation is a subordinate execution specialist only.

The image model never chooses the next roadmap item, never decides that a prompt requires an image, never promotes its own output to an approved asset, and never replaces live DOM/runtime authority.

## Mandatory sequence before every image-generation call

1. Re-resolve live `main`, runtime revision and visual proposal branch head when they may have changed.
2. Read `VISUAL_TRACK_STATUS.json` and the newest controlling checkpoint/handoff.
3. Identify the exact current roadmap gate.
4. Prove that a mapped runtime/UI need exists.
5. Check whether a frozen/reusable asset, deterministic crop, CSS, SVG or procedural treatment already satisfies the need.
6. Confirm safe zones and the real DOM controls the artwork must yield to.
7. Identify exact identity/style/reference authority.
8. Write or reuse a sealed pre-generation brief containing one bounded output contract and explicit forbidden content.
9. Report the pre-generation checkpoint to the owner.
10. Only then call the image-generation specialist.

If any step is missing, generation remains CLOSED.

## Post-generation rule

A returned image starts as a candidate only.

GPT-5.6 Sol must inspect it against the sealed brief. The result must be classified as either:

- `REJECTED_NON_SHIPPING` with zero progress credit; or
- `CANDIDATE_READY_FOR_OWNER_REVIEW` with zero freeze credit until owner approval.

Only explicit owner approval may produce `OWNER_APPROVED_FROZEN` status.

Every frozen asset must record exact persistent Library path, file ID, Library record ID when available, dimensions and SHA-256.

Frozen assets are never regenerated merely to create crops, mirrors, responsive variants, avatar chips or screen assemblies. Derive those deterministically from the frozen master.

## UI/UX authority rule

Real runtime DOM controls remain authoritative.

Do not replace real buttons, inputs, labels, timers, cards, wheel labels, results or status text with rasterized fake UI.

Artwork uses non-interactive layers and yields before any real control moves, shrinks, becomes obscured or loses focus visibility.

Mobile may omit large character art entirely.

## No automatic image behavior

The following do NOT by themselves authorize image generation:

- owner says `continue`;
- owner uploads a reference image;
- owner comments on an existing image;
- a session begins in the visual project;
- a previous turn happened to use image generation;
- a screen feels visually sparse;
- an image model is available.

A whole session may correctly contain zero image-generation calls when planning, DOM reconciliation, QA, asset bookkeeping, responsive work, accessibility work or implementation packaging is the highest-value roadmap task.

There is no requirement for a project-work prompt or session to end with an image. Planning-only, QA-only and implementation-specification sessions are valid successful sessions when they advance the current roadmap gate.

## Derived visual-state rule

Presentation state must not become a second network protocol.

When artwork or character expression changes because of gameplay state, the visual choice must be derived locally from an already-authoritative runtime value whenever possible.

Examples include an existing completed-season winner, a confirmed reveal stage, or a later authoritative shared-season outcome.

Do not add Firestore fields, writes, pairing messages, session messages or save mutations whose only purpose is to synchronize which image is displayed.

Static character assets are bundled/deployed website assets. The runtime may choose which approved asset/crop to display from authoritative domain state. Both connected devices therefore render the same visual result from the same authoritative state without transmitting image bytes or visual-state records through Firebase.

If shared gameplay has not yet established an authoritative outcome, keep neutral/core artwork. Do not infer a winner visually ahead of shared scoring authority.

## Owner-override rule for previously cancelled assets

A previously cancelled optional asset may be reconsidered only when the owner explicitly changes the visual direction or supplies new approved evidence that materially changes the need.

Reconsideration does not automatically make the asset required and does not erase the original obstruction/scope analysis.

The reasoning controller must re-evaluate the asset against live DOM geometry, interaction authority, responsiveness, cost and reuse. It may reopen the asset only as tightly bounded optional presentation work when those constraints pass.

## Required checkpoint report

After every substantial visual milestone, report:

- live `main` SHA and runtime revision;
- visual proposal branch and exact head;
- current roadmap gate;
- formal visual-production progress percent;
- frozen character-master count;
- generation gate OPEN or CLOSED;
- exact work completed;
- any image generation used and the reason it was justified;
- rejected outputs and their zero-credit classification when relevant;
- whether `main`, runtime, Firebase or billing were touched;
- next bounded roadmap action;
- handoff proximity percent.

Never end a project-work turn with only an image or a raw `/mnt/data/...` path.

## Cost and production boundaries

Zero-dollar rule remains mandatory.

Firebase Spark only.

Billing permanently off.

The visual lane must not modify production `main`, deploy production, or alter routing, storage, scoring, pairing, provider authorization or session authority unless the owner explicitly transitions that work to the appropriate development lane.

## Transition rule

Use handoff proximity independently from visual progress.

- 0-49%: continue normally.
- 50-69%: keep continuity records current after substantial milestones.
- 70-84%: finish only the current bounded task and prepare a successor starter.
- 85-99%: start no new large visual branch of work; package current truth.
- 100%: generate the complete successor handoff and stop at a clean checkpoint.

The owner should be told when transition becomes advisable. Do not wait for visible quality degradation.

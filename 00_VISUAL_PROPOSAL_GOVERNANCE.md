# Visual Proposal Governance

## Status

This is a mandatory repository operating boundary for visual proposal work.

It applies whenever work is being performed as a visual proposal, including work on branches under `visual/*`, unless the owner explicitly changes the scope for a specific task.

This file is not a design preference. It is a production-safety and authority boundary.

## Core rule

Visual sessions build reviewable proposals only.

A visual session does not own production integration and must not directly change the live Career Mode Showdown product.

The separate senior Career Mode Showdown developer session is the production integration authority. That senior developer has broader current-product, architecture, test, deployment, and roadmap context and must independently inspect the visual proposal before deciding whether and how any part of it enters production.

## Hard prohibitions for a visual proposal session

A visual proposal session must not:

1. Merge, fast-forward, rebase, cherry-pick, or otherwise integrate proposal work into `main`.
2. Push visual proposal changes directly to `main` or another live production branch.
3. Deploy the visual proposal to the production website or production hosting target.
4. Modify production state, production configuration, production data, billing, provider settings, security rules, or live runtime authority as part of visual proposal work.
5. Open, approve, or execute an integration path that treats the proposal as already production-ready without the senior developer review gate.
6. Claim that a proposed UI, asset, component, stylesheet, behavior, or architecture has been integrated into the actual product when it only exists on a proposal branch.
7. Interpret an older handoff, roadmap, POS instruction, or implementation note as permission to bypass this governance boundary.

If an instruction can reasonably be read two ways, choose the interpretation that keeps visual work isolated from production and record the ambiguity for the senior developer.

## Allowed work inside the visual proposal branch

A visual proposal session may:

1. Create and refine proposal-only UI, UX, layouts, styles, components, assets, prototypes, documentation, and supporting test or inspection material.
2. Study current `main` as read-only evidence so the proposal can remain compatible with the product that exists now.
3. Record the observed `main` SHA and other live authority as contextual evidence without treating that observation as authorization to integrate.
4. Compare the proposal against current product structure and document expected integration surfaces, drift risks, dependencies, and conflicts.
5. Generate a new image only when the established visual roadmap, storyboard, asset inventory, or explicit owner instruction requires that image. Image generation is a subordinate production tool, not an automatic step at the end of a session.
6. Reuse approved canonical assets and approved AI character identities when the roadmap calls for them. Do not regenerate approved assets merely because an image generation capability is available.
7. Build enough evidence that the senior developer can safely evaluate the proposal without guessing what the visual session intended.

## GPT operating-system rule for image generation

The active GPT reasoning session owns visual planning, sequencing, asset selection, acceptance criteria, and the decision that a new image is actually needed.

Image generation is an execution tool under that operating system. It must follow the active roadmap, approved identity references, asset requirements, safe zones, compositing rules, and proposal-only boundary. It must not independently choose a random image to create, substitute a new visual direction, or cause production integration.

## Senior developer integration gate

No visual proposal becomes part of the actual product until the senior Career Mode Showdown developer independently reviews it.

Before integration, the senior developer should:

1. Resolve the current exact `main` and current production/runtime authority independently.
2. Compare the exact proposal branch/head against current `main` and account for any drift that occurred during visual work.
3. Inspect every affected architecture and product surface, including state/data flow, navigation, existing functionality, responsive behavior, accessibility, security-sensitive boundaries, persistence, tests, and deployment assumptions where relevant.
4. Confirm that the proposal still matches the current roadmap and approved visual/identity decisions.
5. Modify, adapt, split, rewrite, or reject proposal code and assets whenever the current product requires it.
6. Run the repository's canonical build, tests, contracts, gates, and any required device/browser validation on the integration candidate.
7. Decide whether and how to integrate. The visual proposal itself does not make that decision.
8. Report what was accepted, changed, rejected, validated, and actually integrated.

The senior developer must treat proposal code as review input, not as an instruction to copy files verbatim.

## Main-branch drift rule

A visual proposal may be built against an observed `main` SHA, but `main` may advance in parallel.

The observed base SHA is evidence only. It is never a promise that the proposal can be merged directly or that current production still matches the proposal's assumptions.

The senior developer must independently resolve current `main` immediately before any integration work.

## Required completion artifact

Every visual proposal track that reaches a reviewable stopping point must leave a senior-developer handoff artifact in the repository.

Use `docs/VISUAL_PROPOSAL_HANDOFF_TEMPLATE.md` as the minimum contract. The completed handoff must include:

1. Proposal branch name.
2. Exact proposal head SHA.
3. Exact `main` SHA observed during proposal work.
4. Scope and intended user-visible outcome.
5. Files and assets changed or added.
6. Approved identities, visual authorities, source assets, and constraints relied upon.
7. Validation actually performed.
8. Validation intentionally not performed because it belongs to production integration.
9. Known risks, drift, limitations, unresolved questions, and assumptions.
10. An explicit statement that the work is proposal-only and has not been production integrated.
11. A copy/paste prompt for the senior Career Mode Showdown developer to independently inspect, verify, adapt, validate, and decide whether/how to integrate the proposal.

## Startup order for future visual sessions

Before modifying a visual proposal branch, read in this order:

1. `00_VISUAL_PROPOSAL_GOVERNANCE.md`
2. `00_DEVELOPER_START_HERE.md`
3. `00_CURRENT_HANDOFF.md`
4. The active visual starter/handoff for the current visual track.
5. The visual roadmap, approved asset/identity authorities, QA rules, and any exact-DOM or compositing contracts relevant to the task.
6. Current `main` as read-only live evidence when compatibility or drift matters.

The repository's broader project operating system remains authoritative for reasoning, evidence discipline, testing expectations, and anti-spiral behavior. This visual governance file limits what a visual proposal session is allowed to execute against production.

## Conflict rule

For visual proposal work, this file is a mandatory scope boundary. If another document contains older language such as "implement," "integrate," "ship," "merge," or "update the website," read that language as "prepare a proposal for senior-developer review" unless the owner has explicitly transferred production integration authority for that specific task.

When a conflict cannot be resolved safely, preserve the proposal branch, do not touch production, and document the conflict in the senior-developer handoff.

## Zero-dollar boundary

Visual proposal work must preserve the project's zero-dollar requirement. It must not enable billing, move the project to a paid provider tier, or create a production dependency that requires paid infrastructure. Any proposal with possible cost implications must be flagged for senior-developer review before integration.

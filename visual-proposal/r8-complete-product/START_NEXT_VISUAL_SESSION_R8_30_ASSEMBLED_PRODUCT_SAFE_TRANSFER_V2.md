# START NEXT VISUAL SESSION — R8.30 Assembled Product Safe Transfer V2

Status: CURRENT TRANSITION AUTHORITY / PROPOSAL ONLY / NOT PRODUCTION / 2026-09-10

This file supersedes the original `START_NEXT_VISUAL_SESSION_R8_30_ASSEMBLED_PRODUCT_SAFE_TRANSFER.md` wherever the two differ. Read this file first, then the original R8.30 handoff for its full implementation history, then `START_HERE_SOL_VISUAL_MASTER_CONTROL.md` and `MASTER_EXECUTION_PLAN_R8_29.md`.

## CRITICAL OWNER CLARIFICATION — REAL ASSET AUTHORITY VS IMAGE-GENERATOR GUESS

The owner discovered an important ambiguity at transition.

The cinematic 98-club `CLUB IDENTITY CATALOG v2.1` image shown in chat was an accidental image-generation result. It was NOT generated from the deterministic Club Identity V2.1 descriptor/SVG system. The owner originally reacted positively to it because it was reasonably presented as though it represented the badge work.

That reaction MUST NOT be interpreted as final visual approval of the real deterministic 98-club catalog.

Correct authority is now:

1. Club Identity V2.1 architecture, philosophy and design direction: OWNER APPROVED.
2. Accidental image-generator 98-club poster: REJECTED AS IMPLEMENTATION / BADGE / FINAL VISUAL AUTHORITY.
3. Actual deterministic V2.1/R2 98-club rendered output: OWNER VISUAL APPROVAL OPEN.
4. Overall assembled visual proposal: OWNER FINAL APPROVAL OPEN.

Read the corrected authority file:

`evidence/OWNER_CLUB_IDENTITY_V2_1_APPROVAL_AND_AUTHORITY_2026-09-10.md`

and the corrected manifest:

`assets/club-identity-v2-1-catalog.manifest.json`

## Why the accidental poster existed

It was an orchestration failure. The active Sol asset ticket was A05 Nik Club Assignment presentation. Image generation returned a club-catalog poster instead. That output should have been rejected immediately as off-ticket rather than becoming a visible pseudo-deliverable.

This is evidence for the master orchestration rule:

Image generation does not decide what an asset is, what the website looks like, or what becomes final.

GPT-5.6 Sol owns:

- product intent;
- asset identity;
- reference selection;
- DOM/runtime ownership;
- generation ticket;
- QA;
- rejection/promotion;
- final assembly;
- owner presentation.

The image model is a subordinate renderer only.

## REAL OUTPUT RULE — REQUIRED FOR ALL FINAL VISUAL APPROVALS

For every proposal subsystem, distinguish source assets from real assembled output.

### Deterministic/runtime-owned visual systems

Examples:

- Club Identity badges;
- buttons;
- cards;
- panels;
- navigation;
- progress indicators;
- pack/reveal UI;
- fields;
- state badges;
- responsive screen layout.

These must be built as real proposal HTML/CSS/JS/SVG first and then rendered from that actual system. Do not ask image generation to guess a screenshot and present the guess as the finished system.

### Generative source assets

Examples:

- Nik character masters;
- Daniel character masters;
- selected cinematic/background artwork where genuinely needed.

Image generation may create these only under a bounded Sol ticket. The generated result remains a source asset. It becomes meaningful product work only after Sol QA and integration into the real proposal DOM.

### Final screen approval

The owner must see rendered screenshots of the actual assembled proposal DOM/system wherever feasible.

Conceptual image-generator screenshots are not final proposal evidence.

If a conceptual image is ever used for ideation, label it visibly and in documentation as `CONCEPT ONLY / NOT IMPLEMENTATION AUTHORITY` and do not place it in the final asset manifest as a production-ready object.

## Club Identity V2.1 corrected next gate

The next session must not call the badges visually final yet.

Required sequence:

1. independently resolve current main and visual branch head;
2. run/re-run the aggregate V2.1 validator in a file-capable/local environment;
3. combine all five real descriptor catalogs plus the seven R2 overrides;
4. render the real 98-club deterministic SVG contact sheet locally or through the repository browser stack with zero paid services;
5. verify the sheet is actually generated from `club-identity-v2-1-renderer.reference.js` / the accepted deterministic implementation, not image generation;
6. show that real contact sheet to the owner;
7. collect explicit visual approval or bounded corrections;
8. only then mark the actual 98-club visual catalog owner-final.

The external HTML renderer being over its included allowance is not a blocker. Do not enable billing. Use local SVG/browser rendering and the repository Playwright/Chromium path.

## Anti-confusion asset policy

A senior developer must never have to guess which of several similar images is real authority.

Every visual artifact should have one of these states:

- `REFERENCE_ONLY` — source/reference material, never implementation authority;
- `CONCEPT_ONLY` — exploratory visualization, never final authority;
- `CANDIDATE` — bounded asset under QA;
- `ACCEPTED_SOURCE_ASSET` — accepted isolated asset such as a character master;
- `ASSEMBLED_PROPOSAL` — real HTML/CSS/JS/SVG composition using accepted assets;
- `OWNER_APPROVED_FINAL` — owner has seen the real assembled/rendered output and explicitly approved it.

Do not keep unlabeled parallel variants in the final implementation path.

Rejected/off-ticket outputs must not be silently reused because they look attractive.

## Immediate next action remains Club Assignment B2 assembly

After the real-asset authority correction is understood, continue the original R8.30 plan:

- reconcile then-current production Club Assignment DOM/state;
- build an assembled browser-testable B2 proposal screen with placeholders;
- prove protected live-pack geometry and responsive fallback;
- freeze A05/A06 geometry;
- then generate/integrate character source assets one manager/role at a time;
- build shared button/control components;
- build zero-dollar UI SFX;
- assemble all proposal screens;
- render screenshots from the actual proposal DOM;
- present the real finished proposal to the owner.

## Permanent invariants

- Manager 1 = Daniel.
- Manager 2 = Nik.
- Firebase Spark only.
- Billing OFF permanently.
- No paid fallback.
- No public discovery/community/rankings.
- Club identity research remains authoring-only and adds no runtime network/Firebase/storage burden.
- Proposal work remains isolated until explicit production implementation authority.
- Reference uploads never automatically trigger image generation.

Operating loop:

`RESOLVE -> EXPLAIN -> BUILD/GENERATE -> QA -> RECORD -> ASSEMBLE -> RENDER REAL OUTPUT -> OWNER REVIEW -> NEXT`

# Screen 04 — Club Assignment / `clubWheelScreen`

Status: ACTIVE r17 SCREEN CONTRACT — LIVE DOM PACK AUTHORITY LOCKED / MODE B2 PROTECTED EXTERIOR-FLANK TARGET / MODE A FALLBACK RETAINED

Source anchor: production `main` `23bba67ed7bf9cc38cb7dc9106e3f64a17a6b55f` / runtime `1.9.1-r17`, re-read against current `index.html`, `css/app.css`, Club Assignment runtime and visual identity authority on 2026-09-10.

Supporting geometry evidence:

`evidence/CLUB_ASSIGNMENT_B2_R17_GEOMETRY_PROOF_2026-09-10.md`

## Purpose

Club Assignment is the two-manager pack reveal and permanent-rivalry lock stage. It should feel ceremonial and competitive while keeping permanence, manager ownership, reveal state and confirmation unmistakable.

R8 changes presentation only. Provider/local draw, reveal order, persisted club pair, permanence and confirmation remain product authority.

## Exact live product authority

Preserve:

- league-confirmed heading and live league value;
- live pack status;
- progress steps `01 DRAW`, `02 PACK 1`, `03 PACK 2`, `04 VS`, `05 LOCK`;
- Manager 1 reveal card;
- Manager 2 reveal card;
- two real `.clubPackDoor` elements;
- two real `.clubCardFace` reveal faces;
- central VS divider;
- final clubs-locked confirmation;
- permanence note;
- `OPEN SHOWDOWN PACKS`;
- `CONFIRM RIVALRY & START SHOWDOWN`;
- Back.

The existing runtime owns `ready -> opening -> manager-one -> manager-two -> versus -> confirmation`. The pair is persisted before presentation timers begin. R8 must never add a raster reveal authority or second JavaScript reveal clock.

## Manager identity lock

- Manager 1 visual slot = Daniel.
- Manager 2 visual slot = Nik.

Manager names and club names remain live DOM text. Character art may support the stage but never replace those labels.

## Core architecture — protected live-pack aperture

The literal generated-pack concept is rejected.

The older concept where foreground fingers could overlap the live pack edge is also retired.

The website already owns the moving pack door and revealed card face. The production door translates upward by more than its own height while rotating/fading. Aligning raster fingers to that moving surface adds risk with no product benefit.

Therefore:

- `.clubRevealCard`, `.clubPackStage`, `.clubPackDoor` and `.clubCardFace` remain the only pack/reveal object;
- a protected aperture surrounds the live pack region plus a safety gutter;
- no character pixel, hand, finger, sleeve or forearm may enter that aperture;
- the optional character may present or brace a separate static rail outside the aperture;
- the rail never moves with the pack door;
- every character/frame layer is decorative, unfocusable and `pointer-events:none`.

The visual illusion is `manager presents framed live pack`, not `manager holds moving pack`.

## r17 production-derived primary geometry

At `1366x768`, production's existing short-desktop media query applies.

Observed product geometry:

- Club Assignment shell: `width:min(900px,93vw)`;
- reveal area: `width:min(820px,100%)`;
- reveal grid: `minmax(0,1fr) 60px minmax(0,1fr)`;
- gap: `8px`;
- each reveal card: approximately `372px` wide at full 820px reveal width;
- reveal card height: `220px`;
- card padding: `7px`;
- manager row: `21px`;
- effective pack-stage region: approximately `356x180px` per side.

Final implementation must still read actual `getBoundingClientRect()` values on then-current production. These values are proposal geometry, not hardcoded product authority.

## Recommended wide-desktop Mode B2

The strongest safe implementation uses exterior flank space rather than forcing characters into the two-card grid.

For each manager:

1. character upper-body crop occupies the exterior side of the centered Club Assignment shell;
2. the real reveal card remains inside the existing reveal grid;
3. the live pack receives a protected aperture with a target 14px safety gutter;
4. a separate static presentation rail sits outside the card/aperture;
5. the character hand may terminate at the rail or use an open presentation gesture with visible air gap;
6. character/hand bounding boxes remain disjoint from the protected aperture;
7. pack/reveal animation runs unchanged inside the protected region;
8. character removal changes no interaction, state or layout authority.

At 1366px the centered ~900px shell leaves roughly 466px of viewport width outside the shell before ordinary safe-area variation. That exterior width is the visual budget for the two manager flanks.

Proposal prototype:

`prototypes/04b-club-assignment-mode-b2-structural-prototype.html`

The prototype models the production short-desktop proportions, 14px protected gutter, external rails, external character/hand placeholders and a bounding-box overlap check.

## Responsive contract — revised

### `>=1320px`

Mode B2 may be enabled only after browser proof.

1366x768 is the primary target.

All reveal phases, confirmation and actions must remain usable without horizontal overflow or dangerous vertical displacement.

### `1180–1319px`

Character-free by default.

A restrained Mode A flank treatment may be promoted later only after direct product proof. Do not squeeze full B2 inward.

### `<=1179px`

Character-free.

### `940x700` reduced-motion proof

Character-free. Existing reduced-motion product behavior remains authority.

### `390x844` mobile DPR2

Character-free. Preserve the current stacked one-column reveal architecture and readable live labels.

The progressive enhancement is intentional; mobile does not need to imitate desktop cinematic staging.

## Mode A fallback

Mode A remains the automatic safe fallback if B2 fails its wide-desktop acceptance matrix.

Daniel and Nik may appear as restrained flanking artwork with:

- open-hand presentation toward their own live pack;
- visible air gap between anatomy and pack;
- confident anticipation;
- slight lean toward the reveal stage;
- competitive eye line toward center or own pack.

No generated prop and no hand/pack contact are required.

## Retired directions

Do not implement:

- self-contained character art holding a generated Club Pack;
- raster club-result cards;
- fingers tracking the moving `.clubPackDoor`;
- foreground anatomy overlapping live manager/club/status text;
- a second pack/reveal state machine;
- character art that forces the real product to become larger or less responsive.

Recovered pack-holding images remain pose/body/reference evidence only.

## Visual sequence

### Ready / sealed

Two equal live DOM pack doors dominate the stage. Character flanks may support the ceremony only on proven wide desktop.

### Opening

Use the existing reveal timing. R8 may add a short gold seam, edge charge, restrained contained particles/light sweep or panel treatment keyed from existing state. It cannot delay or override the reveal.

Previously observed presentation timing remains approximately Manager 1 at 650ms, Manager 2 at 1750ms, VS at 2850ms, confirmation at 3300ms. Final implementation must re-read then-current runtime rather than hardcode this evidence.

### Manager 1 reveal

Left live card becomes active for Manager 1 / Daniel. Club name appears only in live DOM.

### Manager 2 reveal

Right live card becomes active for Manager 2 / Nik. Club name appears only in live DOM.

### Versus

Both cards receive equal weight around the existing VS divider. No winner styling exists here.

### Locked

The clubs-locked confirmation and permanence action become the hero. Character art is subordinate atmosphere.

## Club Identity V2.1

Club Identity V2.1 is the intended replacement for the low-variety generic badge treatment, but it remains proposal-only.

Authority:

- `assets/club-identity-v2-1-catalog.manifest.json`;
- `assets/club-identity-v2-1-runtime-descriptor-contract.json`;
- `assets/club-identity-v2-1-renderer.reference.js`;
- `evidence/CLUB_IDENTITY_V2_1_SAFE_CONTEXT_ARCHITECTURE_2026-09-10.md`;
- `evidence/CLUB_IDENTITY_V2_1_R1_R2_PERCEPTUAL_QA_2026-09-10.md`.

Current authoring state:

- 98/98 research/history/place direction complete;
- 98/98 descriptor drafts complete;
- deterministic SVG reference renderer authored;
- R1 full contact sheet produced;
- seven priority R2 perceptual overrides authored and locally reviewed;
- full 98-club R2 contact-sheet review remains open;
- owner approval remains open;
- production implementation remains blocked.

Runtime safety remains non-negotiable:

- club name remains canonical product data;
- no crest field in save state;
- no Firebase/Firestore/Auth/Storage dependency;
- no Cloud Function;
- no external badge API;
- no runtime hotlink;
- no network request required to draw a supported crest;
- no AI-generated raster badge catalog;
- deterministic SVG generation and caching;
- research/history/location stays out of runtime descriptors.

## Pack-face opportunity

After product authority exposes a club result, the revealed face may consume the V2.1 identity:

- original deterministic SVG crest;
- club-associated palette;
- descriptor-derived texture/accent geometry;
- live DOM club name;
- live DOM reveal state.

The sealed door must remain neutral so the visual identity cannot leak a future result before the existing reveal state exposes it.

## A05 / A06 generation ticket constraints

A05/A06 are Club Assignment presentation characters, not pack assets.

Do not generate final A05/A06 until the geometry/product-fit ticket is explicitly declared READY by Sol.

Final requirements:

- Manager 1 Daniel / Manager 2 Nik identity correct;
- upper-body or torso-oriented crop suitable for exterior flank use;
- R8-approved face/style family;
- predictable arm/hand termination outside protected pack aperture;
- hand may brace external static rail or present with air gap;
- no generated pack object;
- no baked `CLUB PACK`, `CM17`, club name, manager name or result;
- transparent/maskable background;
- no character pixel required for product comprehension;
- if the pose cannot fit the proven flank geometry, reject the pose rather than moving product UI.

## Shared setup variants

Where real product state exposes them, proposal capture must preserve coordinator/peer/waiting/draw/reveal/confirmation/stale/reconnecting/unavailable distinctions through live text and state styling. Do not invent public lobby, discovery, rankings or community state.

## Accessibility / interaction safety

- character/frame layers are absent from accessibility tree;
- decorative layers are not focus targets;
- all decorative overlays use `pointer-events:none`;
- manager and club labels remain DOM text;
- focus remains visible on Open, Confirm and Back;
- reduced motion preserves immediate state comprehension;
- permanence cannot be communicated by color alone;
- no mirrored/reversed baked UI text;
- protected-aperture exclusion is geometric, not subjective.

## Machine-testable B2 acceptance

Senior implementation should measure bounding rectangles for:

- authoritative live pack region;
- protected aperture + safety gutter;
- static rail;
- character/hand region;
- Open / Confirm / Back controls.

Required assertions:

- character/hand does not intersect protected aperture;
- static rail does not intersect protected aperture;
- no decorative layer receives pointer events;
- no decorative layer is focusable;
- live pack stays readable;
- controls remain reachable;
- no horizontal overflow;
- all six reveal stages are coherent;
- `<=1319px` fallback removes B2 without residue;
- mobile retains stacked live-pack layout.

## Final acceptance checks

- Manager 1 = Daniel and Manager 2 = Nik;
- the existing DOM pack is visibly what opens;
- no second raster pack can contradict it;
- B2 anatomy never crosses protected aperture;
- cards remain equal before actual result;
- club permanence explicit before confirmation;
- no official crest or copied proprietary pack design;
- V2.1 remains deterministic/static/offline-capable;
- badge rendering adds no Firebase/storage/network activity;
- no manager/club/core UI text baked into character art;
- all reveal phases visually distinct;
- character art disappears cleanly outside its proven width;
- Mode A/character-free presentation wins automatically if B2 fails.

## Sol orchestration requirement

Read `START_HERE_SOL_VISUAL_MASTER_CONTROL.md` and `evidence/SOL_VISUAL_ORCHESTRATION_MASTER_GUARD_2026-09-10.md` before any generation.

Reference uploads are evidence, not automatic generation triggers. GPT-5.6 Sol must resolve and explain the exact asset ticket before invoking image generation.

## Final-main reconciliation

Before senior implementation, re-read then-current Club Assignment DOM, `css/app.css`, reveal runtime, visual identity runtime and relevant browser tests. Any later real product state becomes part of this contract before handoff.

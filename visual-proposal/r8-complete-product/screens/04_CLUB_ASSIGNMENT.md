# Screen 04 — Club Assignment / `clubWheelScreen`

Status: ACTIVE SCREEN CONTRACT

Source anchor: current `main` at `cef2e101f23fd8cb777f71950bac8f0f8d9f2c7b`.

## Purpose

Club Assignment is the two-manager pack reveal and permanent-rivalry lock stage. It should feel ceremonial and competitive while making permanence, manager ownership and confirmation state unmistakable.

## Exact current DOM authority

Preserve the existing phases and live elements:

- league-confirmed header and live league value;
- live pack status;
- reveal progress steps `01 DRAW`, `02 PACK 1`, `03 PACK 2`, `04 VS`, `05 LOCK`;
- Manager 1 reveal card;
- Manager 2 reveal card;
- two sealed pack doors and club-name faces;
- central VS divider;
- final clubs-locked confirmation;
- permanent-club lock note;
- `OPEN SHOWDOWN PACKS`;
- `CONFIRM RIVALRY & START SHOWDOWN`;
- Back.

R8 changes presentation only. The provider/local draw, reveal order, permanence and confirmation rules remain product authority.

## Manager identity lock

Manager 1 visual slot = Daniel.

Manager 2 visual slot = Nik.

The live manager-name DOM remains real text. Promotional character art is optional and may never replace or bake the manager labels into a card image.

## Visual sequence

### Sealed

Two equal dark/gold pack doors dominate the stage. They use original procedural geometry and generic Career Mode Showdown markings already represented as DOM text, not copied FIFA Ultimate Team pack art.

### Opening

Use the existing product-owned reveal timing. R8 may add a short gold seam/light treatment but cannot delay the underlying reveal state.

### Manager 1 reveal

Left card becomes active, with Manager 1/Daniel-side ownership clearly visible through real DOM labels. Manager 2 remains sealed.

### Manager 2 reveal

Right card becomes active, with Manager 2/Nik-side ownership visible. Both club names remain live DOM text.

### Versus confirmation

Both revealed cards receive equal weight around a restrained central VS divider. No winner styling is allowed here because no season result exists yet.

### Locked

The clubs-locked confirmation becomes the hero. The permanent lock note must be visually impossible to miss before confirmation. The confirmation action is dominant only when product authority enables it.

## Club identity treatment

Do not introduce official club crests.

Use club name, original procedural color bars, abstract monograms derived from real DOM text when needed, and original generic shield/card geometry. No new external logo asset is required.

Core club names and manager names must remain DOM text and must not be baked into raster artwork.

## Character policy

A01/A02 are not required for the canonical card reveal.

On wide desktop, a subtle flank crop may be evaluated only after the card safe-zone is proven. Cards, club names, lock note and confirmation controls remain more important than character art.

At 1179px and below, use character-free presentation.

No new character pose is justified at this stage.

## Shared setup variants

The proposal must visually distinguish through real state text and badges:

- coordinator can perform the draw;
- peer is waiting;
- provider-authoritative draw in progress;
- Manager 1 revealed;
- Manager 2 revealed;
- both clubs revealed;
- shared 1/3/5/10 season choice when present;
- each manager confirmation state;
- fully confirmed handoff;
- stale/revoked/reconnecting/unavailable states where surfaced.

Do not invent public lobby, discovery, rankings or community state.

## Procedural asset roles

Required roles are solved without image generation:

- sealed pack/card front: original SVG/CSS geometry;
- reveal-state frame: CSS state modifiers;
- VS divider: SVG/CSS geometry;
- permanent-club lock mark: original minimal icon plus live text;
- club identity: procedural frame/color/monogram treatment, no official crest.

## Responsive contract

Wide desktop uses two equal columns with the VS divider centered and controls below.

Reduced wide removes optional character art before reducing card size.

Chromebook/tablet keeps both cards readable without forcing primary controls below the useful viewport. If needed, compress decoration and progress spacing first.

Mobile stacks or uses a compact two-card arrangement according to current responsive behavior. Manager labels, club names and lock warning remain readable without horizontal clipping.

## Accessibility and QA

- reveal progress may be visually decorative but current live status remains available to assistive technology;
- pack-door artwork is not a focus target;
- manager/club labels remain real DOM text;
- no mirrored or reversed baked text is allowed;
- no card art may imply a different manager mapping;
- focus remains visible on Open, Confirm and Back;
- reduced motion preserves immediate understanding of each reveal state;
- lock confirmation cannot be communicated by gold color alone.

## Acceptance checks

- Manager 1 = Daniel and Manager 2 = Nik in canonical proposal compositions;
- two cards remain equal before any actual result exists;
- club permanence is explicit before confirmation;
- no official crest or copied proprietary pack design appears;
- no manager/club/core UI text is baked into an image;
- all reveal phases remain visually distinct;
- shared coordinator/peer/waiting states are legible;
- no new character generation is used without a separate approved brief.

## Final-main reconciliation

Re-read the final `clubWheelScreen` DOM and shared setup runtime at the main developer's finished checkpoint. Any added confirmation or failure state becomes part of this contract before senior handoff.
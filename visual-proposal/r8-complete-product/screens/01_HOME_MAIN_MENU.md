# Screen 01 — Home / `mainMenu`

Status: ACTIVE SCREEN CONTRACT

This is a proposal-only visual contract derived from the exact current `mainMenu` DOM at main `cef2e101f23fd8cb777f71950bac8f0f8d9f2c7b`.

## Purpose

Home is the cinematic rivalry headquarters. It should carry the strongest emotional identity in the product while preserving immediate access to the existing real controls and keeping Chromebook/mobile free from decorative crowding.

## Existing DOM authority to preserve

The proposal does not invent or rename Home actions. The live route currently exposes these six core actions:

1. Continue Career
2. New Showdown
3. Legacy
4. Statistics
5. Rule Book
6. Save Library

The existing menu media card, Play/Mute controls, heading/meta copy, bottom strip and runtime notice remain real product surfaces.

R8 styling must wrap and emphasize this DOM, not replace it with a flattened screenshot.

## Wide-desktop composition

At 1280px and above:

- place A02 Daniel on the left flank;
- place A01 Nik on the right flank;
- reserve the center as a no-character interaction-safe zone;
- keep all six action tiles and media controls above character layers;
- use the original procedural stadium-atmosphere layer behind both characters and controls;
- use warm gold rails and low-opacity light geometry to create competition energy without reducing readability;
- keep character art decorative and visually subordinate to the action hierarchy.

The visual center should read as one active rivalry product, not two portrait cards pasted behind a menu.

## Character geometry

A02 Daniel is Manager 1 and must remain on the left in the canonical Home composition.

A01 Nik is Manager 2 and must remain on the right.

Preferred wide positioning uses lower-body cropping and edge bleed so neither character occupies the central 52% of the viewport. Faces should remain visible and uncropped at common 1440px and 1366px desktop widths.

Do not mirror facial identity solely to solve layout. If a derivative crop is needed, preserve natural orientation and identity.

## Responsive contract

### 1280px and above

Both frozen masters may appear. Central controls remain fully clear.

### 1180px to 1279px

Character crops may reduce substantially. If either image overlaps a control or forces the menu below the useful viewport, remove character art rather than compress controls.

### 1179px and below

No large A01/A02 artwork. Use the procedural stadium layer, black/gold framing, tile hierarchy and live DOM only.

### Mobile

Use a compact single-column or current responsive grid. Preserve all six actions, readable tile descriptions, media controls and runtime notices. Decorative stadium geometry becomes materially quieter.

## Action hierarchy by product state

### Resumable career

Continue Career is the dominant action. New Showdown remains highly visible but secondary.

### No resumable career

New Showdown becomes the dominant gold action. Disabled/unavailable Continue Career remains readable and explains its state through existing product copy rather than low opacity alone.

### Runtime notice visible

Notice must sit above decorative layers and preserve its existing dismiss/focus behavior.

### Media unavailable

The media tile remains a valid product card with status copy; no blank hole should appear in the grid.

## Proposed visual materials

Home uses Level A presentation from `design-system/R8_GLOBAL_VISUAL_SYSTEM.md`.

Primary surfaces: near-black and charcoal.

Primary accent: `#f3cc4f` warm gold.

Primary text: `#f5f0e4` cream.

Supporting copy: warm muted neutral.

The New Showdown tile may use a gold-filled treatment when it is the state-dominant action. Continue Career may use a dark premium treatment with a strong gold lower rail when resumable.

## Asset resolution

Required roles and current decision:

- A02 left character composition: source master verified; proposal binary packaging still required.
- A01 right character composition: source master verified; proposal binary packaging still required.
- stadium atmosphere: solved by original procedural SVG/CSS, no raster generation required.
- central interaction-safe-zone: solved by this screen contract and prototype reference CSS.
- Chromebook/mobile character-free composition: solved intentionally with DOM/CSS; no image asset required.

New character generation: CLOSED. Existing masters satisfy the emotional role.

## Accessibility and input contract

Decorative character/stadium layers are `aria-hidden`, pointer-inert and non-focusable in senior implementation.

No decorative element may overlap a hit target even if pointer events are disabled, because visual obstruction still fails the proposal.

Tile focus must remain clearly visible against dark or gold tile states. Runtime notice dismiss focus remains independently visible.

Reduced motion removes atmosphere drift and decorative entrance movement without hiding or delaying controls.

## Acceptance tests

Home is visually acceptable only when all are true:

- Manager 1 is Daniel and Manager 2 is Nik;
- no duplicate Nik or swapped identity appears;
- both frozen masters remain unmodified source authorities;
- central controls remain unobscured at 1440, 1366 and 1280 widths;
- large character art is absent at 1179px and below;
- all six live actions remain readable and operable;
- media ready and unavailable states both remain coherent;
- keyboard focus is visible on every action and media control;
- runtime notice remains readable and dismissible;
- reduced-motion mode removes decorative motion;
- no new copyrighted club crest, proprietary font or unlicensed footballer asset is introduced;
- no core UI label is baked into artwork.

## Final-main reconciliation trigger

Before senior handoff, compare this contract to the then-current final `mainMenu` DOM. If the main developer changes routes, actions, media behavior, notices or state logic, adapt this proposal contract without changing unrelated approved visual decisions.
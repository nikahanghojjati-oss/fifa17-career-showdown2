# R8 Screen Contract 01 — Home / mainMenu

Status: ACTIVE PROPOSAL CONTRACT — proposal-only, not production authority

Study anchor: production main `cef2e101f23fd8cb777f71950bac8f0f8d9f2c7b`, app `v1.9.1`, runtime `1.9.1-r12`.

## Purpose

Home is the cinematic rivalry hub. It should establish the black/charcoal + warm-gold R8 identity while protecting the exact real interaction structure and keeping Chromebook/mobile utility ahead of decoration.

## Current real DOM authority

The proposal preserves the existing `#mainMenu` structure and these six actions without renaming their product meaning:

1. `#continueCareer` — Continue Career
2. `#newShowdown` — New Showdown
3. `#legacyButton` — Legacy
4. `#careerStatisticsButton` — Statistics
5. `#ruleBookButton` — Rule Book
6. `#settingsButton` — Save Library

The existing menu-media card, Play/Mute controls, heading/meta region and lower status strip remain real DOM. R8 does not bake any of those labels into artwork.

## Manager and character authority

Manager mapping is immutable:

- Manager 1 = Daniel
- Manager 2 = Nik

Wide-desktop character placement is equally fixed:

- left flank = A02 Daniel / `A02_DANIEL_CORE_POINTING_HERO`
- right flank = A01 Nik / `A01_NIK_CORE_THINKING_HERO`

A01 and A02 are decorative presentation masters only. They must be `aria-hidden`, non-focusable and pointer-inert in senior implementation. Raw photographs are not substitutes.

Exact verified source requirements:

- A01 SHA-256 `17972b8afb73b90483c8f874c4bd964ac1bda196daa76e134a6030676bbd4219`, 1086×1448 RGBA
- A02 SHA-256 `9b1545b52a5d96a240c92b9901dcd8a4558148dde05a0331882df7bd988177cc`, 1086×1448 RGBA

The owner-approved source bytes were recovered and independently hash/dimension verified during R8.26. They are not to be regenerated.

## Composition

### Wide desktop, 1280px and above

Use a three-zone stage:

- Daniel occupies the left atmosphere flank.
- Real Home controls occupy the protected center interaction zone.
- Nik occupies the right atmosphere flank.

The characters may cross behind atmospheric framing but never behind or over a control label, status copy, focus outline, media control or menu hit area.

The center zone should read as a competitive broadcast/menu plane rather than a floating card. Use charcoal transparency, thin warm-gold rails, restrained stadium-light bloom and a low-contrast pitch/grid motif. Do not use official crests or copied FIFA menu graphics.

### Reduced wide, 1180–1279px

Character art is optional. Reduce or crop art before reducing control width or readable spacing. If either character intersects the protected center zone, omit both character layers for symmetry.

### Chromebook/tablet, 1179px and below

No large A01/A02 artwork. Keep the same R8 identity through CSS/procedural atmosphere, typography, tiles and gold hierarchy. The six actions and media controls take priority over decorative height.

### Mobile

Use a single-column decision flow where existing architecture allows it. No large character art. Keep minimum 44px interaction targets, full visible focus indicators, readable tile metadata and scroll-safe media controls.

## Home states

The proposal must visually cover:

- no resumable career: New Showdown is the primary progression action;
- resumable career: Continue Career is primary;
- completed/local-library context without inventing a second save authority;
- menu media ready;
- menu media unavailable/error;
- runtime notice visible;
- ordinary motion;
- reduced motion;
- keyboard focus on every action;
- narrow viewport with no decorative overlap.

State treatment may change emphasis, border, copy hierarchy and status badges. It must not invent persistence or routing semantics.

## Asset resolution

Resolved without new character generation:

- `R8_HOME_STADIUM_ATMOSPHERE_V1` — original procedural SVG, no text, no logos, no external dependency.
- `R8_HOME_INTERACTION_SAFE_ZONE_V1` — proposal safe-zone specification, implemented as layout guidance/reference rather than a user-visible graphic.
- A01/A02 wide flanks — solved by immutable masters once exact binary copies are present in `assets/masters/`.
- Chromebook/mobile — intentionally character-free; no replacement raster is required.

New character generation decision: CLOSED. No unsolved Home role currently justifies A03+.

## Interaction safe zone

For a 1600×900 reference canvas, reserve the central x-range approximately 420–1180 for controls and readable state. Character alpha or high-contrast decorative edges should not enter that range behind actionable content. At narrower desktop widths, increase the relative protected share rather than shrinking controls.

The safe-zone numbers are composition guidance, not fixed production coordinates. Senior implementation should derive final values from the real DOM and responsive layout.

## Accessibility and motion acceptance

- all real actions retain visible focus outlines with sufficient separation from gold borders;
- decorative atmosphere and characters create no hit targets;
- primary/secondary/disabled differences are not communicated by opacity alone;
- reduced motion suppresses decorative drift/sweeps while preserving immediate state changes;
- no additional loading or network dependency is introduced;
- text contrast is checked against the actual dark surface, not assumed from the old light theme.

## Rights acceptance

- no official club crests;
- no proprietary EA/FIFA font files;
- no copied EA/FIFA menu screen used as an asset;
- no new unlicensed footballer photography;
- procedural background contains no third-party artwork;
- existing menu-media behavior remains governed by existing product authority and is not duplicated in R8 assets.

## Senior implementation notes

This file specifies presentation only. Senior implementation should reuse current `#mainMenu` DOM and current routing/media behavior, add only namespaced R8 presentation hooks, and ensure decorative layers fail closed without affecting Home functionality.

Do not merge the visual-track prototype as the implementation shortcut. Reconcile this contract against final `main` first.
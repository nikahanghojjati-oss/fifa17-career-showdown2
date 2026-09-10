# Screen 04 — Club Assignment / `clubWheelScreen`

Status: ACTIVE SCREEN CONTRACT — LIVE DOM PACK AUTHORITY LOCKED / MODE B2 PROTECTED APERTURE RECOMMENDED / MODE A FALLBACK RETAINED

Source anchor: current `main` r16/r247 line, re-read against live `index.html`, `css/app.css`, `js/clubAssignment.js` and `js/visualIdentity.js` on 2026-09-10.

## Purpose

Club Assignment is the two-manager pack reveal and permanent-rivalry lock stage. It should feel ceremonial and competitive while making permanence, manager ownership and confirmation state unmistakable.

## Exact current DOM authority

Preserve the existing product-owned phases and live elements:

- league-confirmed header and live league value;
- live pack status;
- reveal progress steps `01 DRAW`, `02 PACK 1`, `03 PACK 2`, `04 VS`, `05 LOCK`;
- Manager 1 reveal card;
- Manager 2 reveal card;
- two real `.clubPackDoor` elements and two real `.clubCardFace` reveal faces;
- central VS divider;
- final clubs-locked confirmation;
- permanent-club lock note;
- `OPEN SHOWDOWN PACKS`;
- `CONFIRM RIVALRY & START SHOWDOWN`;
- Back.

R8 changes presentation only. The provider/local draw, reveal order, persisted club pair, permanence and confirmation rules remain product authority.

The live runtime already owns the sequence `ready -> opening -> manager-one -> manager-two -> versus -> confirmation`. The pair is persisted before presentation timers begin. R8 must never create a second reveal authority in raster art or a parallel JavaScript state machine.

## Manager identity lock

Manager 1 visual slot = Daniel.

Manager 2 visual slot = Nik.

The live manager-name DOM remains real text. Character art may support the composition but may never replace manager labels or club identity.

## Core architectural ruling — characters never own or touch the authoritative pack aperture

The prior literal interpretation of A05/A06 as managers holding a complete generated pack object is rejected for implementation.

The earlier advanced Mode B idea, where foreground fingers could overlap the outer edge of the live pack itself, is also retired.

Reason:

- the website already has product-owned pack doors and reveal faces;
- the current `.clubPackDoor` moves upward by more than its own height and rotates/fades during reveal;
- club names and state are live DOM;
- the reveal sequence is stateful and timed;
- visual contact between raster fingers and a moving live pack creates unnecessary alignment risk;
- a raster pack cannot become the authoritative reveal surface without weakening responsiveness, accessibility and current product ownership.

Therefore the real pack remains the existing `.clubPackStage` / `.clubPackDoor` / `.clubCardFace` DOM structure and is surrounded by a protected live-pack aperture.

No character pixel, hand, finger, sleeve, forearm mask or decorative foreground anatomy may enter that protected aperture.

A05/A06 may only create the visual illusion that a manager is presenting or bracing a separate static presentation frame outside the live pack.

## Recommended wide-desktop composition — Mode B2 static presentation frame

Mode B2 is the preferred ambitious target for sufficiently wide desktop after structural proof.

For each manager lane:

1. optional character body sits outside/behind the live pack region;
2. the existing `.clubRevealCard` / `.clubPackStage` remains the authoritative pack;
3. an invisible protected rectangle surrounds the live pack plus a small safety gutter;
4. a separate decorative static rail/frame exists outside the protected rectangle;
5. a generated hand may rest on or gesture beside that static rail only;
6. the rail does not move with the pack door;
7. the pack reveal continues entirely inside the protected aperture;
8. all character/frame layers use `pointer-events:none` and are decorative to assistive technology.

The visual goal is still that Daniel and Nik appear to present the packs, but implementation no longer requires raster anatomy to track a moving DOM surface.

A proposal-only placeholder proof is stored at:

`prototypes/04b-club-assignment-mode-b2-structural-prototype.html`

It is not production code and does not establish final dimensions. The senior implementation developer must measure the real production DOM before freezing final A05/A06 geometry.

## Mode A — flank presentation fallback

Mode A remains the automatic safe fallback if Mode B2 cannot satisfy the wide-desktop acceptance matrix.

Daniel and Nik appear as optional character flanks adjacent to their own live DOM pack cards.

Body language can include:

- open-hand presentation toward the pack;
- hand visibly separated from the pack;
- confident anticipation;
- slight lean toward the reveal stage;
- restrained competitive eye line toward the center or own pack.

No generated prop is required.

Mode A does not require any hand/pack contact illusion.

## Retired composition — original Mode B

Do not implement the previous concept in which foreground fingers or hand masks overlap the live pack edge.

It is no longer necessary because Mode B2 preserves most of the visual payoff with substantially less geometry risk.

Do not spend generation attempts trying to rescue literal pack-holding if the static-frame solution works.

## Visual sequence

### Sealed / ready

Two equal dark/charcoal/gold pack doors dominate the interactive stage. Character flanks may support the ceremony on wide desktop but cannot visually outrank the doors.

The final pack surface should be original Career Mode Showdown geometry. Owner-provided pack-holding imagery is composition/pose evidence only; meaningful copy must remain live DOM and the final visual must not copy proprietary FIFA Ultimate Team pack art.

### Opening

Use the existing product-owned reveal timing. R8 may add a short gold seam, edge charge, restrained particles, contained light sweep or panel treatment tied to the existing stage attribute. It cannot delay or override the underlying reveal.

The current runtime reaches Manager 1 at approximately 650ms, Manager 2 at 1750ms, versus at 2850ms and confirmation at 3300ms. Presentation animation must fit inside those owned transitions rather than inventing a second clock.

Mode B2 character anatomy and static rails do not need to follow the moving door.

### Manager 1 reveal

Left live card becomes active for Manager 1 / Daniel. Daniel art may visually support the state or remain static, but the club name appears only in the live DOM face.

### Manager 2 reveal

Right live card becomes active for Manager 2 / Nik. Nik art follows the same rule. Both clubs remain live text.

### Versus confirmation

Both revealed live cards receive equal weight around the central VS divider. Character art becomes supporting atmosphere. No winner styling is allowed here because no season result exists yet.

### Locked

The clubs-locked confirmation becomes the hero. Character art may remain as flanking atmosphere, but the permanent-club note and confirmation action have higher visual priority.

## Club Identity V2.1 treatment

The prior generic procedural badge treatment should be upgraded through the separate Club Identity V2.1 architecture.

Read:

- `evidence/CLUB_IDENTITY_V2_FEASIBILITY_AND_UNIQUENESS_PLAN_2026-09-10.md`;
- `evidence/CLUB_IDENTITY_V2_1_SAFE_CONTEXT_ARCHITECTURE_2026-09-10.md`;
- `assets/club-identity-v2-1-authoring-inventory.json`.

The target is a unique original identity for each of the 98 supported 2016-17 clubs using factual club-associated colours plus broad history/place/football-design context, without copying official crests.

History and location belong to the authoring/research layer only. The runtime receives only compact static visual descriptors.

Hard runtime boundary:

- club name remains canonical product data;
- `getClubIdentity(name)` / `applyClubIdentity(element,name)` remain the presentation interface;
- no crest field in save state;
- no Firebase/Firestore/Auth/Storage dependency;
- no external badge API;
- no network request required to draw a crest;
- no AI-generated raster badges for the supported catalog;
- deterministic SVG generation and in-memory caching are preferred.

Core club names and manager names must remain DOM text and must not be baked into raster artwork.

## V2.1 pack-face opportunity

After the runtime exposes a club result, the revealed face may consume the V2.1 identity:

- unique original SVG crest;
- club-associated palette;
- descriptor-derived background texture;
- original accent geometry;
- live DOM club name;
- live DOM reveal state.

The sealed door must remain neutral enough that V2.1 does not leak the future result before the existing reveal authority exposes it.

## A05 / A06 character policy

A05/A06 are Club Assignment presentation assets, not self-contained pack assets.

Their purpose is to provide body language that can frame the live DOM pack stage on wide desktop.

Required characteristics:

- Manager 1 Daniel and Manager 2 Nik remain distinct and correctly mapped;
- face identity must match the accepted R8 identity family;
- pose must respect a predictable rectangular protected aperture for the live pack card;
- no final hand/finger/sleeve pixel may cross that aperture;
- a hand may brace a separate static frame rail outside the protected aperture;
- an open presenting gesture with visible air gap is always acceptable and safer than forced contact;
- no generated pack-like prop is required in the final character master;
- if a temporary generic rectangle is used during generation/composition studies, it must be removable and contain no state/text;
- no baked `CLUB PACK`, `CM17`, club name, manager name or reveal result in the final character master;
- character artwork uses `pointer-events:none` in implementation;
- art is optional even on wide desktop if it compromises the pack safe-zone.

Do not generate final A05/A06 until the real production aperture and static-rail geometry have been measured and frozen.

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

Required product roles remain solvable without character generation:

- sealed pack/card front: original SVG/CSS geometry;
- reveal-state frame: CSS state modifiers;
- VS divider: SVG/CSS geometry;
- static Mode B2 presentation rail: original SVG/CSS geometry;
- permanent-club lock mark: original minimal icon plus live text;
- Club Identity V2.1: deterministic SVG descriptor system, no official crest.

Character art is additive presentation only.

## Responsive contract

### Wide desktop / primary proof target

1366x768 is the primary Mode B2 proof target.

Mode B2 may remain only if all six reveal stages, lock confirmation and controls fit without horizontal overflow or dangerous vertical displacement.

### <=1179px

Default to character-free Club Assignment.

Do not force Mode B2 into compact widths.

A later implementation may promote restrained Mode A at a smaller width only after direct proof that the real pack remains at least as readable and controls remain visible.

### 940x700 reduced-motion proof

Character-free.

Current reduced-motion behavior remains product authority and should reach an understandable confirmation state without decorative animation dependency.

### 390x844 mobile DPR2

Character-free.

Preserve the current stacked one-column reveal architecture and readable live labels.

This progressive enhancement is intentional. Mobile does not need to imitate desktop character staging.

## Accessibility and interaction safety

- reveal progress may be visually decorative but current live status remains available to assistive technology;
- pack-door artwork is not a focus target;
- character, hand and static-frame overlays use `pointer-events:none`;
- decorative character/frame layers are absent from the accessibility tree;
- manager/club labels remain real DOM text;
- no mirrored or reversed baked text is allowed;
- no raster art may imply a different manager mapping;
- focus remains visible on Open, Confirm and Back;
- reduced motion preserves immediate understanding of reveal state;
- lock confirmation cannot be communicated by gold color alone;
- character/hand geometry may not intersect the protected live-pack aperture at all.

## Machine-testable Mode B2 geometry rule

The senior implementation should make the protected-aperture rule testable rather than subjective.

At wide target, a focused browser audit should obtain bounding rectangles for:

- authoritative live pack region;
- protected aperture including safety gutter;
- static outer rail;
- character/hand foreground region;
- Open/Confirm/Back controls.

Required assertions:

- character/hand foreground rect does not intersect protected aperture;
- static rail remains outside protected aperture;
- no character layer receives pointer events;
- no decorative layer becomes focusable;
- live pack remains visible and readable;
- controls remain inside useful viewport/reachable;
- no horizontal overflow;
- lower-width fallbacks remove all Mode B2 layers cleanly.

## Acceptance checks

- Manager 1 = Daniel and Manager 2 = Nik;
- the existing DOM pack is visibly the thing that opens;
- there is never a second raster pack whose content contradicts the live pack;
- Mode B2 hands never cross the protected live-pack aperture;
- two cards remain equal before any actual result exists;
- club permanence is explicit before confirmation;
- no official crest or copied proprietary pack design appears;
- Club Identity V2.1 remains deterministic, static and offline-capable;
- no club-identity rendering causes Firebase/storage/network activity;
- no manager/club/core UI text is baked into character art;
- all reveal phases remain visually distinct;
- shared coordinator/peer/waiting states remain legible;
- character art disappears cleanly at <=1179px;
- Mode A is the automatic fallback if Mode B2 fails geometry or viewport proof.

## Sol orchestration requirement

Before any new character generation for this screen, read:

`evidence/SOL_VISUAL_ORCHESTRATION_MASTER_GUARD_2026-09-10.md`

Reference uploads are evidence, not automatic generation triggers. GPT-5.6 Sol must resolve the exact asset ticket and explain the attempt before invoking image generation.

## Final-main reconciliation

Re-read the final `clubWheelScreen` DOM, `css/app.css`, `js/clubAssignment.js`, `js/visualIdentity.js` and relevant browser tests at the senior implementation checkpoint. Any added confirmation, shared-state or failure state becomes part of this contract before handoff.

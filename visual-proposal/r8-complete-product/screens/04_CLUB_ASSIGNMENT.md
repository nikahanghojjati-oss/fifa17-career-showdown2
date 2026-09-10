# Screen 04 — Club Assignment / `clubWheelScreen`

Status: ACTIVE SCREEN CONTRACT — LIVE DOM PACK AUTHORITY LOCKED / OPTIONAL CHARACTER INTEGRATION RECONCILED

Source anchor: current `main` r16/r247 line, re-read against live `index.html` and `js/clubAssignment.js` on 2026-09-10.

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

## Core architectural ruling — characters do not own the pack

The prior literal interpretation of A05/A06 as managers holding a complete generated pack object is rejected for implementation.

Reason:

- the website already has product-owned pack doors and reveal faces;
- club names and state are live DOM;
- the reveal sequence is stateful and timed;
- baking a second pack into character art would create a visually convincing but functionally false duplicate object;
- a raster pack cannot become the authoritative reveal surface without weakening responsiveness, accessibility and current product ownership.

Therefore the real pack remains the existing `.clubPackStage` / `.clubPackDoor` / `.clubCardFace` DOM structure.

A05/A06 may only create the visual illusion that a manager is presenting, framing or gripping the live pack stage. They never contain the authoritative club reveal.

## Two allowed wide-desktop composition modes

### Mode A — flank presentation — preferred baseline

Daniel and Nik appear as optional wide-screen character flanks adjacent to their own live DOM pack cards.

Body language can include:

- open-hand presentation toward the pack;
- one hand near the card edge without covering it;
- confident anticipation;
- slight lean toward the reveal stage;
- restrained competitive eye line toward the center or own pack.

No generated prop is required. This is the lowest-risk implementation and should be proven first.

### Mode B — held-live-pack illusion — advanced optional treatment

The owner-provided pack-holding references may inform an advanced composition in which the manager appears to grip the pack, but the visible pack interior remains the real DOM pack stage.

Implementation concept:

1. character body/background layer sits behind the real pack card;
2. the existing live `.clubPackStage` occupies a fixed safe aperture in front of the torso;
3. optional foreground hand/arm masks sit above only the outer pack edges with `pointer-events:none`;
4. live pack door, serial/status copy, club name, reveal face and state remain DOM;
5. the pack opens using the existing `data-club-reveal-stage` and card classes;
6. no character image contains club name, manager name, pack status, reveal result or interactive control.

A senior developer can implement this with normal HTML/CSS layering and existing stage state. It requires no Firebase field, no local-storage field and no new reveal state.

Mode B is accepted only if responsive and state QA prove it. If it becomes brittle, Mode A wins automatically.

## Visual sequence

### Sealed / ready

Two equal dark/charcoal/gold pack doors dominate the interactive stage. Character flanks may support the ceremony on wide desktop but cannot visually outrank the doors.

The final pack surface should be original Career Mode Showdown geometry. Owner-provided `CLUB PACK / CM17` imagery is reference language only; meaningful copy must remain live DOM and the final visual must not copy proprietary FIFA Ultimate Team pack art.

### Opening

Use the existing product-owned reveal timing. R8 may add a short gold seam, edge charge, restrained particles or panel peel treatment tied to the existing stage attribute. It cannot delay or override the underlying reveal.

The current runtime reaches Manager 1 at approximately 650ms, Manager 2 at 1750ms, versus at 2850ms and confirmation at 3300ms. Presentation animation must fit inside those owned transitions rather than inventing a second clock.

### Manager 1 reveal

Left live card becomes active for Manager 1 / Daniel. Daniel art may visually react or remain static, but the club name appears only in the live DOM face.

### Manager 2 reveal

Right live card becomes active for Manager 2 / Nik. Nik art follows the same rule. Both clubs remain live text.

### Versus confirmation

Both revealed live cards receive equal weight around the central VS divider. Character art becomes supporting atmosphere. No winner styling is allowed here because no season result exists yet.

### Locked

The clubs-locked confirmation becomes the hero. Character art may remain as flanking atmosphere, but the permanent-club note and confirmation action have higher visual priority.

## Club identity treatment

Do not introduce official club crests.

Use club name, original procedural color bars, abstract monograms derived from real DOM text when needed, and original generic shield/card geometry. No new external logo asset is required.

Core club names and manager names must remain DOM text and must not be baked into raster artwork.

## A05 / A06 character policy

A05/A06 are now defined as Club Assignment presentation assets, not self-contained pack assets.

Their purpose is to provide body language that can frame the live DOM pack stage on wide desktop.

Required characteristics:

- Manager 1 Daniel and Manager 2 Nik remain distinct and correctly mapped;
- face identity must match the accepted R8 identity family;
- pose must leave a predictable rectangular interaction safe-zone for the live pack card;
- hands may approach or overlap only outer decorative edges in advanced Mode B;
- hands may never obscure club name, state text, button, focus target or reveal face;
- any generated pack-like prop used to establish hand geometry must be generic and text-free and must be removable or replaceable by the live DOM pack surface;
- no baked `CLUB PACK`, `CM17`, club name, manager name or reveal result in the final character master;
- character artwork uses `pointer-events:none` in implementation;
- art is optional even on wide desktop if it compromises the pack safe-zone.

At 1179px and below, default to character-free Club Assignment. The live pack cards remain fully functional and visually complete without character art.

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
- permanent-club lock mark: original minimal icon plus live text;
- club identity: procedural frame/color/monogram treatment, no official crest.

Character art is additive presentation only.

## Responsive contract

Wide desktop may use Mode A or, after proof, Mode B.

Reduced wide removes optional foreground-hand effects and then optional character art before reducing the live pack card size.

Chromebook/tablet keeps both cards readable without forcing primary controls below the useful viewport. Character art is normally omitted.

Mobile remains character-free and preserves current live reveal behavior. Manager labels, club names and lock warning remain readable without horizontal clipping.

## Accessibility and interaction safety

- reveal progress may be visually decorative but current live status remains available to assistive technology;
- pack-door artwork is not a focus target;
- character and optional hand overlays use `pointer-events:none`;
- manager/club labels remain real DOM text;
- no mirrored or reversed baked text is allowed;
- no raster art may imply a different manager mapping;
- focus remains visible on Open, Confirm and Back;
- reduced motion preserves immediate understanding of each reveal state;
- lock confirmation cannot be communicated by gold color alone;
- visual hand overlap can touch decorative pack borders only, never semantic content or hit areas.

## Acceptance checks

- Manager 1 = Daniel and Manager 2 = Nik;
- the existing DOM pack is visibly the thing that opens;
- there is never a second raster pack whose content contradicts the live pack;
- two cards remain equal before any actual result exists;
- club permanence is explicit before confirmation;
- no official crest or copied proprietary pack design appears;
- no manager/club/core UI text is baked into character art;
- all reveal phases remain visually distinct;
- shared coordinator/peer/waiting states remain legible;
- character art disappears cleanly at <=1179px;
- Mode B, if used, must be demonstrably responsive and non-blocking before it can beat Mode A.

## Final-main reconciliation

Re-read the final `clubWheelScreen` DOM and `js/clubAssignment.js` at the senior implementation checkpoint. Any added confirmation, shared-state or failure state becomes part of this contract before handoff.

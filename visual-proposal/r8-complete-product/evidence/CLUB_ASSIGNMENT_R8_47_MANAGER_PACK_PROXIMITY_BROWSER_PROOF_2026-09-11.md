# Club Assignment R8.47 Manager-Pack Proximity Browser Proof

Status: `ASSEMBLED_PROPOSAL / BROWSER-PROVEN / OWNER REVIEW OPEN / PRODUCTION INTEGRATION NOT AUTHORIZED`

Date: 2026-09-11

## Live authority

Production `main` was independently re-resolved before this pass at `3c5fb2589414f8f497d1f7cb174200ef84290431` (`1.9.1-r18`). Visual branch authority immediately before R8.47 was the R8.46 gate continuation.

Production remains the sole owner of the Club Assignment draw, persistence, timing and progression through `js/clubAssignment.js`.

The reveal sequence remains exactly:

`ready -> opening -> manager-one -> manager-two -> versus -> confirmation`

R8.47 contains no draw, no persistence, no timer, no save path and no second reveal state machine. Its manual stage injector is QA-only.

No image-generation call was used.

## Owner-reference comparison

The owner reattached the premium Club Assignment reference where Daniel and Nik visually present/hold black-and-gold packs in a warm floodlit stadium.

That reference remains `REFERENCE_ONLY / OWNER VISUAL-LANGUAGE AUTHORITY`.

The real product already owns the moving pack objects through `.clubPackDoor` and `.clubCardFace`. Therefore the reference's useful manager/pack proximity is reproduced through browser geometry rather than by baking a second raster pack into character art.

## R8.47 bounded visual change

R8.45 was browser-safe but the manager presentation still felt one visual step too detached from the two live pack stages.

R8.47 changes presentation only on wide desktop:

- Manager 1 live reveal card shifts 14px toward Daniel.
- Manager 2 live reveal card shifts 14px toward Nik.
- Daniel and Nik retain the exterior B2 presentation architecture.
- Manager edge masks hold full character visibility slightly longer before the protected boundary fade.
- The duplicated pack-owner row is reduced to a narrow uppercase ownership label so it no longer competes with the signature-style character label.
- The real pack doors, card faces, IDs, state classes and action controls remain unchanged.

No character pixel is made part of the live pack object.

## Protected-aperture proof at 1366x768

Each `.clubPackStage` is expanded by a 14px protected safety gutter for geometry assertions.

Measured ready-state geometry after R8.47:

Manager 1:

- live pack stage: x=349..559
- protected aperture: x=335..573
- Daniel decorative manager layer: x=0..315
- Daniel static rail: x=305..314
- protected gap from Daniel layer to aperture: 20px
- protected gap from rail to aperture: 21px

Manager 2:

- live pack stage: x=807..1017
- protected aperture: x=793..1031
- Nik decorative manager layer: x=1051..1366
- Nik static rail: x=1052..1061
- protected gap from Nik layer to aperture: 20px
- protected gap from rail to aperture: 21px

Therefore both character layers and both static rails remain disjoint from both 14px protected live-pack apertures.

The visual relationship is closer to the owner reference while the production pack remains the only pack that opens.

## Chromium matrix

Six visual states were exercised across six viewport conditions:

States:

1. `ready`
2. `opening`
3. `manager-one`
4. `manager-two`
5. `versus`
6. `confirmation`

Viewport conditions:

- 1440x900 DPR1
- 1366x768 DPR1
- 1280x720 DPR1
- 1179x800 DPR1
- 940x700 DPR1 reduced motion
- 390x844 DPR2

Result: `36/36 PASS`.

## Machine checks

Final assertions include:

- no horizontal overflow;
- exactly two real `.clubPackStage` nodes and two `.clubRevealCard` nodes;
- requested stage equals DOM `data-club-reveal-stage`;
- Open / Confirm / Back visibility follows the current production-owned sequence contract;
- on eligible wide desktop, Daniel and Nik remain disjoint from their 14px protected apertures;
- both static rails remain disjoint from the protected apertures;
- live pack stages do not collide with the real action region;
- B2 manager decoration is hidden below 1320px and under reduced-motion conditions;
- mobile keeps the character-free stacked live-pack presentation.

## Persistent owner-review artifacts

Stored in `/Showdown visual/R8_47_Club_Assignment/`:

- `club-r8-47-manager-pack-proximity.html`
- `CLUB_R8_47_1366_READY_STABLE.png`
- `CLUB_R8_47_1366_MANAGER_ONE_STABLE.png`
- `CLUB_R8_47_1366_CONFIRMATION_STABLE.png`
- `CLUB_R8_47_BROWSER_QA_36_CASES.json`

## Authority labels

- owner reference: `REFERENCE_ONLY`
- existing character/stadium source family: retains prior source/candidate authority
- R8.47 browser assembly: `ASSEMBLED_PROPOSAL`
- owner approval: open
- `OWNER_APPROVED_FINAL`: false
- production integration: not authorized

## Image-generation gate

R8.47 does not justify image generation. The remaining manager/pack fidelity issue was solvable through real browser composition while preserving the production reveal aperture.

Image generation remains hard locked unless GPT-5.6 Sol writes a bounded `READY` source-asset ticket that cannot reasonably be satisfied by the current source family plus deterministic HTML/CSS/JS/SVG presentation.

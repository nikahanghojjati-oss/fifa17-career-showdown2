# Screen 04 — Club Assignment / `clubWheelScreen`

Status: ACTIVE r18 SCREEN CONTRACT — LIVE DOM PACK AUTHORITY LOCKED / R8.45 REFERENCE-FIDELITY ASSEMBLY BROWSER-PROVEN / OWNER VISUAL REVIEW PENDING / PRODUCTION INTEGRATION NOT AUTHORIZED

Current production authority re-read on 2026-09-11:

- live `main`: `3c5fb2589414f8f497d1f7cb174200ef84290431` at the start of the R8.45 pass;
- current production DOM: `index.html`;
- reveal runtime owner: `js/clubAssignment.js`;
- reveal sequence: `ready -> opening -> manager-one -> manager-two -> versus -> confirmation`;
- the pair is persisted before presentation timers begin;
- no visual proposal may create a second draw, timer, reveal clock, save path or confirmation authority.

Supporting evidence:

- `evidence/CLUB_ASSIGNMENT_B2_R17_GEOMETRY_PROOF_2026-09-10.md` — predecessor structural B2 evidence;
- `evidence/CLUB_ASSIGNMENT_B2_ASSEMBLED_PRODUCT_R8_31_BROWSER_PROOF_2026-09-10.md` — predecessor B2 browser proof;
- `evidence/LEAGUE_R8_43_HOME_R8_44_CLUB_R8_45_BROWSER_PROOF_2026-09-11.md` — current R8.45 browser authority;
- `evidence/IMAGE_GENERATION_EXECUTION_GATE_R8_45_2026-09-11.json` — current generation hard gate.

Exact R8.45 owner-review assembly is persisted in the Showdown Visual Library:

`/Showdown visual/R8_45_Club_Assignment/club-assignment-r8-45-reference-fidelity.html`

It is an `ASSEMBLED_PROPOSAL`, not `OWNER_APPROVED_FINAL`.

## Purpose

Club Assignment is the ceremonial two-manager club reveal and permanent-rivalry lock stage. The supplied premium black/gold stadium reference controls visual language and composition only. The live website controls functionality and state.

R8.45 therefore keeps the reference's useful ideas — warm floodlit stadium, large Daniel/Nik flanks, gold brush title, five-step reveal ceremony, premium sealed-pack treatment, centered rivalry, permanence messaging and premium controls — while rejecting reference-only global navigation, raster pack ownership and any fake product features.

## Exact live product authority

Preserve the real production objects and IDs:

- `#clubWheelScreen`;
- `#clubAssignmentLeague`;
- `#clubPackStatus`;
- five real `[data-reveal-step]` progress steps;
- `.clubRevealArea`;
- `#clubCardOne` and `#clubCardTwo`;
- `#clubPlayerOne` and `#clubPlayerTwo`;
- two real `.clubPackStage` apertures;
- two real `.clubPackDoor` elements;
- two real `.clubCardFace` reveal faces;
- `#clubNameOne` and `#clubNameTwo` live club-name text;
- central `.clubVs`;
- `#clubRivalryConfirmation`;
- permanence note;
- `#openClubPack`;
- `#continueClubAssignment`;
- `#clubAssignmentBack`.

Manager identity lock for the owner-review scenario remains:

- Manager 1 = Daniel;
- Manager 2 = Nik.

Manager and club names remain DOM text. Character art never replaces product labels.

## Runtime ownership

Production `js/clubAssignment.js` is the only state/timing owner.

The real stages remain:

1. `ready`
2. `opening`
3. `manager-one`
4. `manager-two`
5. `versus`
6. `confirmation`

Current behavior retained:

- ready: both doors sealed, Open available, Back available;
- opening: draw already persisted, Open disabled, Back unavailable;
- manager-one: Daniel's real live card is revealed first;
- manager-two: Nik's real live card reveals next;
- versus: both real cards are revealed and confirmation content is exposed while confirmation action is still withheld;
- confirmation: permanent clubs are explicit and the real Confirm action becomes available.

The R8.45 browser artifact contains a manual QA stage injector only. It has no timers, no click binding, no draw, no persistence and no save behavior. It exists only so Chromium can inspect every production-owned visual stage deterministically.

## R8.45 B2 presentation architecture

R8.45 keeps the useful B2 principle: characters occupy exterior flank space and the production pack remains a protected live aperture.

Wide desktop composition:

- Daniel occupies the left exterior flank;
- Nik occupies the right exterior flank;
- the centered live reveal grid remains the product focus;
- each character is clipped and softly faded before a separate static rail;
- the rail never moves with `.clubPackDoor`;
- no character pixel is allowed to enter the 14px protected aperture around either `.clubPackStage`;
- all B2 decoration is `pointer-events:none`, unfocusable and `aria-hidden` where appropriate.

The intended illusion is `manager presents the live pack stage`, never `manager owns or holds a raster pack`.

## 1366x768 protected-aperture proof

R8.45 browser measurement with a 14px safety gutter:

- Manager 1 protected aperture: `x=349..587`;
- Daniel exterior flank ends: `x=315`;
- Daniel static rail ends: `x=314`;
- Manager 2 protected aperture: `x=779..1017`;
- Nik exterior flank begins: `x=1051`;
- Nik static rail begins: `x=1052`.

Therefore both character regions and both rails are geometrically disjoint from the protected live pack apertures.

No foreground finger, sleeve, hand or forearm tracks the moving pack door.

## Source-art treatment

No image generation was invoked for R8.45.

The browser assembly reuses the existing stadium and established Daniel/Nik visual source family through deterministic resize/compression only. That processing does not create a new character concept and does not promote source-art authority.

The visual source layers remain decorative and removable without changing product comprehension or interaction.

The previous R8.31 A05/A06 generation opportunity is superseded by the R8.45 hard gate. Do not generate A05/A06 merely because older screen text described the geometry as generation-ready.

A future image-generation call requires a new bounded `READY` source-asset ticket explicitly unlocked by GPT-5.6 Sol.

## Pack-face treatment

The sealed door remains neutral so future club identity cannot leak before runtime reveal authority allows it.

After reveal:

- club name remains canonical live DOM data;
- card face may consume deterministic presentation colors/geometry;
- no raster result card replaces the live DOM;
- no official crest crop is required;
- Club Identity V2.1 remains proposal-only until separately accepted.

Do not add a crest field to save state or introduce Firebase, storage, badge APIs or runtime hotlinks for visual identity.

## Responsive contract

### `>=1320px`

B2 cinematic manager flanks are eligible. The current 1366x768 and 1440x900 Chromium runs pass protected-aperture and control-clearance assertions.

### `1180–1319px`

Character-free fallback. Do not squeeze wide B2 inward.

### `<=1179px`

Character-free fallback remains authoritative.

### reduced motion

B2 decoration is removed and pack/card transitions resolve without requiring cinematic decoration for comprehension.

### `390x844` DPR2

The live packs stack in one column. The real title, progress, two live pack stages, VS, confirmation content and controls reflow vertically with no horizontal overflow. Mobile does not imitate the desktop character staging.

## R8.45 Chromium proof

Viewports:

- `1440x900`;
- `1366x768`;
- `1280x720`;
- `1179x800`;
- `940x700` reduced motion;
- `390x844` DPR2.

Stages:

- ready;
- opening;
- manager-one;
- manager-two;
- versus;
- confirmation.

Result: `36/36 PASS`.

Machine assertions include:

- no horizontal overflow;
- all current live DOM seams present;
- exactly five progress steps;
- Daniel = Manager 1 and Nik = Manager 2;
- reveal class truth matches stage;
- confirmation visibility matches stage;
- Open / Confirm / Back visibility and disabled state match runtime ownership;
- B2 eligibility/fallback truth;
- no decorative pointer events;
- no decorative focus targets;
- 14px protected-aperture clearance;
- two live pack apertures remain distinct;
- visible controls remain disjoint from the pack apertures;
- mobile pack order is stacked and coherent.

Persistent browser evidence:

`/Showdown visual/R8_45_Club_Assignment/`

- `club-assignment-r8-45-reference-fidelity.html`;
- `CLUB_R8_45_BROWSER_QA_36_CASES.json`;
- `CLUB_R8_45_REVALIDATED_1366_READY.png`;
- `CLUB_R8_45_REVALIDATED_1366_MANAGER_ONE.png`;
- `CLUB_R8_45_REVALIDATED_1366_CONFIRMATION_STABLE.png`;
- `CLUB_R8_45_REVALIDATED_1440_READY.png`;
- `CLUB_R8_45_REVALIDATED_390_READY.png`;
- `CLUB_R8_45_REVALIDATED_390_CONFIRMATION.png`.

## Authority labels

- supplied Club Assignment visual: `REFERENCE_ONLY`;
- old structural sketches: `CONCEPT_ONLY`;
- current R8.45 browser assembly: `ASSEMBLED_PROPOSAL`;
- source-art derivatives retain prior source/candidate authority;
- owner visual approval: open;
- production integration: not authorized;
- `OWNER_APPROVED_FINAL`: no.

Never silently promote an artifact.

## Production boundary

R8.45 changes presentation only.

Do not alter:

- club draw logic;
- reveal timing authority;
- persisted club pair;
- permanent-club rules;
- save schema;
- Firebase / Firestore / Auth;
- routing;
- scoring or game rules;
- shared-session behavior;
- remote joining/reconciliation behavior.

Before any production integration, re-read then-current `main`, `index.html`, `css/app.css`, `js/clubAssignment.js`, club-identity runtime and relevant browser/contracts again. Later production changes automatically outrank this proposal contract.
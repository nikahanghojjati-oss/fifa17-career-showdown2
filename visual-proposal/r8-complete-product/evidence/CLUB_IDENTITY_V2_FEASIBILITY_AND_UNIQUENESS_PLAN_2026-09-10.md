# Club Identity V2 — Feasibility, Uniqueness and Original Unlicensed-Football Design Plan

Status: FEASIBLE / RECOMMENDED PROPOSAL UPGRADE — IMPLEMENTATION AFTER VISUAL SIGNATURE CATALOG + CONTACT-SHEET PROOF

Date: 2026-09-10

Production authority checked against `main` head `4c4975c1d3982ce6b2d8d4b37c0a6a15d94b625a`.

Scope: proposal-only feasibility and implementation plan. No production file is changed by this record.

## Owner problem statement

The current procedural club badge system is not visually differentiated enough. Clubs with similar palettes can read as if they reuse the same badge/template, which makes a high-value football presentation feel generic.

The target is not to use official club crests. The target is a much richer original identity system of the kind expected from an unlicensed football-game presentation: club-associated colours and recognizable football-era energy, but original geometry, original marks and a deliberately differentiated visual signature for every supported club.

This document does not claim that any visual treatment is automatically free of trademark or other legal concerns. Final production art should remain original rather than tracing or reproducing official badge geometry, wordmarks or distinctive protected emblem arrangements.

## Current production system

`js/visualIdentity.js` already contains useful foundations:

- club-associated colour palettes for the 2016-17 Premier League, LaLiga, Bundesliga, Serie A and Ligue 1;
- deterministic hashing by club name;
- monogram generation;
- an in-memory identity cache;
- generated SVG crest URLs;
- `getClubIdentity(clubName)`;
- `applyClubIdentity(element, clubName)`;
- CSS variables for primary, secondary, accent, angle and crest image;
- presentation reuse across Club Assignment, confirmation, Dashboard, Transfer Challenge, Season Results and Season Summary.

The palette catalog contains 98 supported clubs: 20 Premier League, 20 LaLiga, 18 Bundesliga, 20 Serie A and 20 Ligue 1.

The current structural generator is much narrower than the palette catalog:

- 5 base crest silhouettes;
- 6 interior patterns;
- 7 motifs;
- initials;
- hash-derived angle.

That gives only 210 base shape/pattern/motif combinations before colour and angle variation. More importantly, there is no cross-club uniqueness contract. A club receives a combination from hash bits, but nothing checks whether another supported club already has the same or a perceptually very similar structural signature.

That explains why the system can feel repetitive even when the resulting SVG data is not byte-for-byte identical.

## V2 architectural ruling

Do not replace the stable runtime interface.

Keep:

- club name as canonical product data;
- `getClubIdentity(name)` as the main presentation lookup;
- `applyClubIdentity(element, name)` as the DOM application boundary;
- current CSS-variable integration;
- no badge/crest field in saves;
- no Firebase identity field;
- no provider mutation;
- no network request for crest art.

Upgrade the implementation behind that interface.

This keeps Club Identity V2 presentation-only and avoids data migration risk.

## Recommended V2 model — curated supported-club descriptors + deterministic fallback

For the 98 supported 2016-17 clubs, introduce a curated `CLUB_IDENTITY_DESCRIPTORS` table.

Each supported club receives an explicit original visual recipe rather than relying only on a hash collision space.

Suggested descriptor fields:

- `silhouetteFamily` — shield, roundel, pennant, hexagonal shield, tall shield, compact shield, split-panel mark, etc.;
- `outerContourVariant` — original contour variant within the family;
- `fieldLayout` — stripes, hoops, split field, diagonal field, quarters, sash, center lane, chevron field, framed field, radial field;
- `stripeCount` / `bandCount` where appropriate;
- `fieldDirection`;
- `centerDevice` — original abstract symbol family, not an official club emblem copy;
- `centerDeviceVariant`;
- `monogramStyle` — stacked initials, circular initials, geometric letters, narrow wordless monogram, no monogram where another original device is stronger;
- `accentPlacement` — crown-line substitute bar, lower rail, side tabs, central ring, border notch, top arc, etc.;
- `borderSystem` — single, double, inset, segmented;
- `textureLanguage` — flat, line, micro-chevron, restrained halftone, stitch/rib treatment;
- `primary`, `secondary`, `accent` — retain/review the existing club-associated palette;
- `visualSignature` — deterministic normalized string used only for QA uniqueness.

The exact schema should be kept small enough that SVG generation remains understandable and auditable.

Unknown/custom clubs continue using the existing deterministic hash fallback, upgraded if desired. The curated 98-club catalog is therefore an enhancement, not a loss of generic support.

## Design-language accuracy without cloning official crests

V2 should become more club-specific by combining factual/broad identity cues rather than reconstructing protected badge artwork.

Useful cues:

- established club-associated colours;
- long-running home-kit stripe/hoop/block language where broadly recognizable;
- city/region architectural geometry only when transformed into an original abstract mark;
- club-era typography energy expressed through generic monogram construction rather than official lettering;
- broad historical football badge families such as roundel, shield, pennant and monogram, redesigned with project-owned proportions;
- rivalry-era visual energy and 2016-17 color balance.

Avoid treating the official crest as a tracing template.

Do not reproduce:

- official wordmarks;
- official club names inside copied badge arrangements;
- exact crown/animal/ship/castle/monument compositions from official crests;
- exact star counts/placements where they are part of the club mark;
- distinctive official shield contour plus internal layout as a near-copy;
- sponsor marks;
- league marks;
- EA/FIFA/FC branding inside club identities.

The goal is `recognizable club color/language -> unmistakably original Showdown crest`, not `official crest with a few details removed`.

## Uniqueness contract

Every supported club must receive a unique normalized visual signature.

Example normalized signature:

`silhouetteFamily|outerContourVariant|fieldLayout|fieldVariant|centerDevice|centerDeviceVariant|monogramStyle|accentPlacement|borderSystem`

Build-time/test requirement:

- enumerate all 98 supported club descriptors;
- assert that every expected club has a descriptor;
- assert that no descriptor has missing required fields;
- assert that `visualSignature` is unique across the supported catalog;
- assert that generated SVG exists and decodes for every club;
- assert that the same club always produces the same identity;
- assert that unknown club names still use deterministic fallback;
- assert that no production save/provider schema gains a crest field.

Visual uniqueness is stronger than string uniqueness, so an automated signature check is necessary but not sufficient.

## Contact-sheet gate

Before Club Identity V2 is approved for production, render all supported club identities into one or more deterministic contact sheets.

Review at least:

- 96-128px crest scale;
- 42-48px UI scale;
- ~34-38px confirmation scale;
- light and dark surrounding surfaces where used;
- similar-colour club groups side by side.

The review should specifically group visually confusable clubs rather than only showing them alphabetically.

Example confusion groups:

- red/white clubs;
- blue/white clubs;
- black/white clubs;
- claret/blue clubs;
- yellow/black clubs;
- sky-blue clubs;
- red/blue clubs.

No two clubs in a confusion group should read as the same badge at ordinary UI scale.

## Perceptual distinctness gate

A badge is rejected even with a unique descriptor string if two crests still look materially interchangeable at 42-48px.

Require at least two strong differentiators among similar-colour neighbors:

- outer silhouette;
- dominant field layout;
- center-device silhouette;
- monogram treatment;
- border structure;
- accent placement.

Colour alone does not count as sufficient differentiation.

## Accessibility and legibility

At small UI scale:

- central devices should use simple silhouettes rather than tiny illustration detail;
- monograms must remain readable or intentionally disappear;
- primary/secondary/accent contrast must survive dark and light containers;
- badge identity cannot be the only source of club name information;
- the live club name remains DOM text;
- decorative crest remains subordinate to the text label for accessibility.

## Club Assignment integration

V2 is particularly valuable to the Club Assignment reveal because the revealed club identity becomes a high-attention moment.

Recommended reveal hierarchy:

1. live club name;
2. V2 original club crest;
3. club-associated color field;
4. reveal state;
5. decorative pack animation.

The V2 crest may scale up within the existing crest zone during reveal, but it must remain generated/presentation content and must not become a gameplay identifier stored separately from the club name.

The static Mode B2 character frame must never overlap the crest zone.

## Pack-face upgrade opportunity

V2 can improve the pack reveal without changing draw logic.

After a club is revealed:

- pack/card background can consume V2 palette variables;
- an enlarged V2 crest can settle into the existing crest zone;
- a subtle descriptor-derived pattern can become the card's field texture;
- club name remains live DOM text;
- pack door remains generic before reveal so it does not leak the result.

Do not pre-color the sealed pack from the future club identity in a way that reveals the result before the current runtime exposes it.

## Implementation effort / risk

### Runtime interface preservation

Difficulty: low.

Current consumers already call `getClubIdentity` / `applyClubIdentity` by club name. Keeping that boundary avoids broad product rewrites.

### Descriptor catalog

Difficulty: medium.

The work is primarily design curation and deterministic SVG grammar, not backend engineering.

### 98-club uniqueness QA

Difficulty: medium.

Automated descriptor uniqueness is straightforward. Perceptual contact-sheet review requires deliberate visual review but is bounded and repeatable.

### Product-state risk

Very low if V2 remains derived entirely from club name.

### Responsive risk

Low because the crest already occupies defined UI zones and can preserve existing sizing contracts.

### Legal/IP risk

Cannot be reduced to zero by engineering. Keep the system visibly original, use broad/factual club cues rather than tracing official badge artwork, and obtain appropriate legal review if the project is commercialized or distributed at meaningful scale.

## Testing strategy

Add one focused identity contract suite instead of making every development iteration run the entire application test matrix.

Recommended focused tests:

### `club-identity-v2-contracts.cjs`

- all 98 supported descriptors exist;
- signatures unique;
- deterministic output;
- fallback deterministic;
- no official asset URLs/network dependency;
- public runtime interface preserved;
- generated SVG contains no unexpected external references.

### `club-identity-v2-visual-audit.cjs`

- deterministic contact-sheet screenshots;
- representative small/large sizes;
- Club Assignment reveal sample;
- Dashboard sample;
- confirmation sample;
- no horizontal overflow caused by larger crest treatment.

During implementation run focused identity tests. Run the full product/browser suite at the final checkpoint.

## Recommended production sequence

1. independently resolve current `main` at implementation time;
2. inventory the 98 supported club names from the authoritative catalog;
3. preserve the existing palette table as a starting point;
4. define V2 descriptor schema and SVG grammar;
5. assign explicit descriptors to every supported club;
6. add normalized uniqueness test;
7. render full contact sheet;
8. inspect same-colour confusion groups;
9. revise only perceptually colliding clubs;
10. integrate through existing `getClubIdentity` / `applyClubIdentity` interface;
11. test Club Assignment reveal and other existing identity surfaces;
12. run full regression suite at pre-merge gate;
13. obtain owner visual approval before marking V2 final.

## Feasibility verdict

`CLUB IDENTITY V2: FEASIBLE AND RECOMMENDED`

`98 SUPPORTED CLUBS: CURATED UNIQUE DESCRIPTORS`

`UNKNOWN CLUBS: DETERMINISTIC FALLBACK RETAINED`

`CURRENT COLOR PALETTE WORK: RETAIN / REVIEW, NOT DISCARD`

`OFFICIAL CREST ASSETS: NOT REQUIRED`

`SAVE / FIREBASE / PROVIDER MIGRATION: NOT REQUIRED IF INTERFACE IS PRESERVED`

`CONTACT SHEET + UNIQUENESS TEST: REQUIRED BEFORE PRODUCTION PROMOTION`

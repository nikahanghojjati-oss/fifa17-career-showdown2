# Career Mode Showdown — v1.0.2 Release Record

Date: 2026-08-11
Release tag: `v1.0.2`
Application version: `v1.0.2`
Runtime asset revision: `1.0.2-r1`
Release class: reproduced-defect maintenance; no new feature workstream
Owner visual acceptance: pending real-device inspection after deployment

## Why this patch exists

The owner supplied current Chromebook screenshots after the r5 deployment and rejected three presentation details:

1. James Rodríguez was too bright because the light overlay faded facial detail.
2. Marcus Rashford's face was crossed by decorative FIFA-inspired diagonal lines.
3. Home Marco Reus had an unattractive diagonal image cut around the head/neck.

The owner explicitly likes the main loading-screen presentation and instructed that it be protected.

## Visual maintenance architecture

v1.0.2 changes the footballer-photo integration rule from **graphics over photograph** to **player as clean anchor**.

James, Rashford and Martial declare `treatment: "clean-anchor"` in `data/footballVisuals.js`.

For clean-anchor panels:

- decorative pseudo-element ambience is behind the image;
- the photo frame is above decorative geometry;
- copy uses its own plate outside the photo anchor;
- the complete authored r5 derivative stays visible with `object-fit: contain`;
- CSS colour filtering remains disabled;
- source/license/provenance remains unchanged.

Desktop Home Reus is integrated as a rectangular right-side player photograph. The rejected diagonal desktop clip is removed. The bounded mobile Reus treatment remains separate. `css/visual-fidelity-r3.css` explicitly preserves the existing startup/loading composition.

## Tuned visual geometry

James desktop/windowed:

- full-width identity plate above the photograph;
- photo frame begins at `top:30%`;
- photo frame width: `100%`;
- copy and photograph are vertically separated;
- mobile explicitly resets to the compact side layout.

Transfer desktop:

- Rashford photo stage: `34%`;
- Martial photo stage: `36%`;
- copy remains left of the photo anchor.

Transfer 701–1020 windowed:

- copy plate: `52%`;
- Rashford photo stage: `40%`;
- Martial photo stage: `42%`;
- the larger anchors preserve the permanent 150px photo-frame quality floor.

Home desktop:

- Reus clean rectangular anchor; no desktop `clip-path`;
- 940×700 crop position: `53% 2%`;
- 1100×720 / 1366×768 crop position: `53% 12%`;
- no desktop jersey-number overlay competing with the player anchor.

## Protected systems

This release must not change:

- scoring/tiebreak rules;
- two-manager/same-league/different-club contract;
- League Wheel confirmation;
- Club Assignment locking/reveal;
- Transfer Challenge state machine;
- Season Review transaction boundary;
- Statistics/Legacy/Trophy semantics;
- `js/screens.js` navigation authority;
- `js/storage.js` persistence authority;
- localStorage keys/schema;
- startup timing;
- the owner-liked loading-screen composition;
- Messi/Lahm source assets and protected presentation.

## Quality gates

The candidate is mergeable only when all permanent workflows pass on one frozen SHA, including:

- Static App;
- Home Bootstrap;
- V1 Visual Immersion;
- Season Review;
- Settings;
- League Confirmation;
- Final Polish;
- Statistics;
- Transfer;
- Licensed Football Visuals;
- Stability Lane.

Licensed Football Visuals must verify real desktop, near-breakpoint and mobile presentation. Stability Lane must complete two consecutive browser cycles and, after merge, exact Pages-byte verification plus deployed runtime-error, Home, photo and complete-journey audits.

## Final technical release evidence

Final pre-merge candidate:

`057586128d00812feee8681392a088e8c27a1e75`

All eleven permanent PR workflows passed on that exact SHA.

Runtime merge:

`7a573ff2691b6143ecbc53df589822d5609f5e05`

GitHub Pages deployment:

`5852810024` — success.

Post-merge Licensed Football Visuals:

run `31503795213` — success, including real desktop/near-breakpoint/mobile Chromium presentation.

Post-merge Stability Lane:

run `31503795725` — success, including storage/release contracts, two consecutive Chromium cycles, exact deployed-byte verification, deployed runtime-error provenance, Home/Reus, football-photo and complete public gameplay/navigation journey.

Technical release status:

`COMPLETE, MERGED, DEPLOYED, POST-MERGE GREEN`

Owner art-direction acceptance remains explicitly open.

## Rollback

Immediate runtime rollback target before v1.0.2 is the deployed r5 implementation:

`8f4f9d2c94e1e1f03f50fb439df34f423cc06d1e`

The immutable `RELEASE_V1.0.1.md` remains historical release evidence and is not rewritten to pretend v1.0.2 existed earlier.

## Acceptance boundary

Machine validation can prove structural/crop/accessibility/runtime integrity. It cannot replace the owner's art-direction judgment.

After public deployment, owner real-device acceptance remains open for Home Reus, Create Showdown James, Transfer Rashford/Martial and loading-screen regression verification.

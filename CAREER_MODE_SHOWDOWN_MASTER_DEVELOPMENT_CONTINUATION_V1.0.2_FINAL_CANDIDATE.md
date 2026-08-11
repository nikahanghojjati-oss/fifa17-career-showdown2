# Career Mode Showdown — v1.0.2 Final Maintenance Candidate Handoff

Last updated: 2026-08-11
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Branch: `agent/v1.0.2-footballer-tile-maintenance`
PR: `#13 — v1.0.2: rebuild footballer tiles around clean-anchor photography`
Base main before this maintenance pass: `88fbf11b7f74b6cb69b5dd576af3754e55fc0880`

## 1. Owner instruction that defines this release

The owner supplied current Chromebook screenshots for Home, Create Showdown and Transfer Challenge plus an actual FIFA 17 menu reference.

The owner identified these real visual problems:

- James Rodríguez was too bright because the effect almost faded part of his face.
- Marcus Rashford had FIFA-inspired diagonal lines crossing/blocking too much of his face.
- Home Marco Reus had an unattractive cut around the neck and front/back of the head.
- The main cinematic loading screen is explicitly liked and must be protected.
- The footballer-photo system should be fundamentally improved around the FIFA 17 principle: **the tile uses the player as a clean anchor**.

The owner instructed the developer to plan, record actions continuously, work directly in GitHub, strengthen maintenance/quality gates, and continue without intermediate approval requests until a stable public build is deployed unless access is genuinely missing.

GitHub permission was checked at the start of the pass and was `Allow all actions`; no additional owner access was required.

## 2. Maintenance principle

Old presentation rule:

`graphics over photograph`

v1.0.2 presentation rule:

`photograph as clean anchor; geometry stays behind/beside the player`

This keeps the project original/rights-safe while moving materially closer to FIFA 17's clean rectangular player-tile hierarchy.

## 3. Source-grounded root causes

### James / Rashford / Martial

The old shared football visual layer painted decorative pseudo-elements above the photographs:

- panel `::before` above image;
- panel `::after` above image;
- image frame below both.

That allowed diagonals to cross faces. The James light panel also painted a strong white layer over the photograph, causing the reported facial washout.

### Home Reus

Desktop Home used a diagonal/clipped right-side photograph treatment. That clipping boundary produced the unattractive head/neck integration shown by the owner.

### Loading screen

Loading is a separate startup composition. It was not the source of the Home defect and is explicitly protected because the owner likes it.

## 4. Final v1.0.2 architecture

Application version: `v1.0.2`

Runtime revision: `1.0.2-r1`

Visual fidelity layer: `css/visual-fidelity-r3.css`

### Declarative clean-anchor photography

`data/footballVisuals.js` marks James, Rashford and Martial with:

`treatment: "clean-anchor"`

The runtime exposes this as `data-photo-treatment="clean-anchor"`.

For clean-anchor panels:

- decorative ambience sits at z0/z1;
- the photograph sits at z2;
- the copy plate sits at z4;
- no decorative layer is allowed above the photograph;
- images keep `object-fit: contain`;
- CSS colour filtering remains disabled;
- licensed r5 source derivatives and provenance stay unchanged.

Messi and Lahm remain on their protected prior presentation and are not folded into the new owner-rejected failure class.

## 5. Final James solution

The first v1.0.2 James attempt used a left-copy/right-photo portrait column. Real browser testing rejected it at the 940px breakpoint because the portrait became too inset under `contain`.

The test threshold was not lowered.

The final desktop/windowed architecture is now:

**full-width identity plate on top + full-width photograph below**.

Desktop/windowed rules:

- photograph begins at `top:30%`;
- photograph frame width is `100%`;
- identity plate spans left/right above it;
- copy and photograph are vertically separated rather than overlapping.

Mobile explicitly resets to its side-by-side compact layout.

The resulting screenshots show:

- restored natural facial contrast;
- no white wash over James's face;
- no copy/graphic collision with the face;
- a clear `JAMES RODRÍGUEZ` identity treatment;
- the player acting as the visual anchor rather than as a faded background decoration.

## 6. Final Transfer solution

Rashford and Martial remain left-copy/right-photo clean-anchor tiles.

Desktop:

- Rashford photo stage: `34%`;
- Martial photo stage: `36%`.

At the 701–1020 windowed breakpoint, real Chromium testing exposed Rashford falling below the permanent 150px photo-frame quality floor. The floor was not weakened.

Final windowed geometry is larger:

- copy plate: `52%`;
- Rashford photo stage: `40%`;
- Martial photo stage: `42%`.

At small phone widths the two player tiles stack vertically.

Final screenshots confirm:

- Rashford's eyes/nose/mouth are completely unobstructed;
- Martial's face is completely unobstructed;
- FIFA-inspired diagonal geometry remains visible only in the background zone;
- the players themselves read as clean right-side anchors at desktop, 940px windowed and mobile.

## 7. Final Home Reus solution

Desktop Home Reus is now a clean rectangular right-side photo anchor.

Permanent desktop rules include:

- no `clip-path` on the Reus photo container;
- photo above decorative layers;
- no CSS photo filter;
- no competing desktop jersey-number overlay;
- 940×700 object position `53% 2%`;
- 1100×720 and 1366×768 object position `53% 12%`.

The owner-rejected diagonal head/neck cut is absent in final Chromebook screenshots.

The accepted mobile Reus treatment remains separately bounded rather than accidentally rewritten.

## 8. Loading-screen protection

The loading screen remains a protected surface.

`css/visual-fidelity-r3.css` retains the startup art-direction structure/treatment inherited from the owner-liked loading design.

The v1.0.2 changes target Home/menu photography rather than redesigning startup.

Permanent Home/V1 Visual/Stability gates continue to exercise startup/loader behavior so a future player-tile edit cannot silently damage it.

## 9. Browser evidence inspected manually

Real Chromium screenshot artifacts were inspected, not merely trusted from pass/fail status.

### Create Showdown

1366×768:

- James face has normal readable contrast;
- identity plate is separate from photograph;
- no face washout;
- no graphic crossing the face.

940×700:

- same clean top/bottom architecture;
- surname remains readable;
- portrait is substantially stronger than the rejected side-column candidate.

390×844 DPR2:

- compact layout remains readable and touch-safe;
- James face remains unobstructed.

### Transfer Challenge

1366×768:

- Rashford and Martial faces are clear;
- clean left-copy/right-player tile hierarchy.

940×700:

- larger 40%/42% photo anchors satisfy the permanent physical frame floor;
- both faces remain clear;
- no copy/photo overlap.

390×844 DPR2:

- player tiles stack vertically;
- both photographs remain large and unobstructed;
- decorative geometry stays away from faces.

### Home

1366×768:

- Reus appears as a clean rectangular FIFA-style tile photograph;
- no diagonal head/neck cut.

940×700 and 1100×720:

- same clean desktop rule with viewport-specific object positioning.

390×844 DPR2:

- protected mobile treatment still passes.

## 10. Important failure history and what each failure meant

1. Initial Licensed Football Visual contract failure — **stale test authority**; it still demanded old r5 frame percentages.
2. First James browser failure — **real visual failure**; near-breakpoint occupancy was 54.6%. The layout changed; threshold stayed.
3. Package/APP mismatch — **release-coherence failure** after APP_VERSION moved to 1.0.2. Root package and lock identities were corrected precisely.
4. Statistics/Season Review revision failures — **stale cache assertions**; promoted without feature changes.
5. Static App release failure — **current documentation/release authority drift**; v1.0.2 got its own release record while v1.0.1 stayed immutable history.
6. Second James browser failure — **real layout-model failure**; a portrait inside a narrow/tall side column could not become a strong clean anchor under `contain`. James was redesigned to top identity + full-width lower photo.
7. Windowed Rashford browser failure — **real visual quality-floor failure**; 34% at 940px produced a <150px frame. Windowed Rashford/Martial anchors were increased to 40%/42%; the floor stayed.
8. Stability expected `1.0.2-r5` — **stale mechanical assertion**; current v1.0.2 is correctly r1.
9. Stability then rejected `v102-maintenance-integration.yml` for an old checkout action — **temporary-tool CI hygiene failure**, not a product failure. All one-shot maintenance workflows/scripts were removed rather than weakening Stability.

## 11. Permanent robustness upgrades

Licensed Football Visuals now structurally protects:

- clean-anchor metadata;
- photograph above decoration;
- copy/photo non-overlap on either horizontal or vertical layouts;
- crop-safe complete derivatives;
- James full-width lower photo architecture;
- windowed Rashford/Martial 40%/42% quality-floor geometry;
- source/license/provenance;
- desktop/windowed/mobile real browser journeys.

Home auditing protects:

- desktop Reus rectangular anchor;
- no desktop clipped head/neck boundary;
- image layering;
- object positions;
- physical-pixel quality;
- mobile regression path;
- overflow/console/local-asset health.

V1 Visual Immersion protects:

- `visual-fidelity-r3.css`;
- v1.0.2 cache identity;
- loading-screen/startup behavior;
- reduced motion and bundle budgets;
- desktop Home clean-anchor rule.

Stability Lane continues to protect:

- storage/release/CI contracts;
- two complete consecutive Chromium cycles;
- runtime error provenance;
- Home/load/photo audits;
- public deployed-byte and full-journey smoke after merge.

## 12. Protected nonvisual systems

No intentional change to:

- gameplay/scoring/tiebreak rules;
- two-manager contract;
- League Wheel confirmation;
- Club Assignment transaction/reveal;
- Transfer Challenge state machine;
- Season Review transaction boundary;
- Statistics calculations;
- Legacy/Trophy/Settings semantics;
- `js/screens.js` routing authority;
- `js/storage.js` persistence authority;
- localStorage keys/schema;
- lazy optional-module/media model.

## 13. Release authority

New release record:

`RELEASE_V1.0.2.md`

v1.0.1 release history remains immutable and is retained as rollback evidence.

Runtime rollback target before v1.0.2:

`8f4f9d2c94e1e1f03f50fb439df34f423cc06d1e`

Current docs/workflows identify v1.0.2 / `1.0.2-r1` as the maintenance candidate.

Owner visual acceptance remains separate from machine validation and must not be claimed before the owner inspects the deployed build.

## 14. Temporary development tooling cleanup

All one-shot v1.0.2 builder/scan workflows and helper scripts used to create atomic workflow blobs or candidate scans were removed before the final release candidate.

Cleanup commit:

`0d5e2de44f35597fc7e887a313946311694bf1cf`

This removes temporary development machinery while preserving all permanent runtime/test/release changes.

## 15. Final pre-merge procedure

The branch must now remain frozen except for a real test failure.

Required before merge:

1. all eleven permanent PR workflows pass on the exact final candidate SHA;
2. Licensed Football Visuals real browser job passes;
3. Stability Lane full contracts + repeated Chromium pass;
4. no temporary v1.0.2 workflow/helper remains in PR diff;
5. PR #13 is changed from draft to ready only after those facts are true;
6. merge uses exact expected-head protection;
7. Pages deployment is verified;
8. post-merge Licensed Football Visuals and Stability Lane pass on main;
9. deployed-site smoke verifies exact runtime bytes, provenance, Home, photos and complete gameplay/navigation journey;
10. final post-merge handoff records exact merge/deploy/run IDs.

## 16. Owner gate after deployment

Do not say owner-approved.

The owner should inspect the public v1.0.2 build for:

- Home Reus desktop anchor;
- Create Showdown James contrast/composition;
- Transfer Rashford face clarity;
- Transfer Martial consistency;
- loading screen regression only.

If the owner rejects a reproduced detail, remain in finite v1.0.x maintenance and fix only that evidence.

If the owner accepts v1.0.2 or explicitly defers the visual review, the next substantive feature remains:

`v1.1.0 Data Safety and Recovery — Candidate A only`

`Versioned Backup Envelope + Non-Mutating Export`

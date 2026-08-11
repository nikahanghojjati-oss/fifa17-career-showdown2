# Career Mode Showdown — v1.0.2 Maintenance / Footballer Tile Rebuild Handoff

Last updated: 2026-08-11
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Branch: `agent/v1.0.2-footballer-tile-maintenance`
Base main: `88fbf11b7f74b6cb69b5dd576af3754e55fc0880`

## Owner instruction

The owner supplied current Chromebook screenshots for Home, Transfer Challenge, Create Showdown, plus an actual FIFA 17 menu reference, and requested a long dedicated maintenance pass with full gates/live checks and a more robust next version.

Owner visual findings:

- James Rodríguez is too bright; the effect fades part of his face.
- Rashford has diagonal/graphic lines crossing too much of his face.
- Home Marco Reus has an unattractive crop/integration around the neck and front/back of the head.
- The main loading screen is explicitly liked and must be protected.
- The footballer photography system should be revolutionized around the FIFA 17 principle that the player is a clean visual anchor inside the tile.
- The owner wants the work planned, recorded continuously, built directly in GitHub, validated, and deployed without intermediate approval requests unless access is genuinely missing.

## Access state

GitHub plugin permission checked at start of this pass: `Allow all actions` for GitHub.

No additional owner access is currently required.

## Initial source-grounded root cause

### Shared footballer panel

`css/footballVisuals.css` originally placed decorative pseudo-element gradients above the player photographs:

- `.footballVisualPanel::before` used `z-index:2`;
- `.footballVisualPanel::after` used `z-index:3`;
- `.footballVisualMediaFrame` was `z-index:1`.

This architecture permitted accent geometry to cross player faces.

The light-tone James panel added a strong white wash above the photograph, matching the owner-reported faded face.

### Transfer photos

Rashford and Martial used authored `contain` crops, but the same above-photo diagonal overlay still crossed the image. Rashford was the clearest failure because his face sat in the overlay path.

### Home Reus

The desktop Home treatment used a clipped/diagonal right-side photo treatment that produced the unattractive head/neck edge visible in the owner's Chromebook screenshot. The loading screen is a separate startup composition and is not the same failure class.

## Maintenance design principle

Move from:

`graphics over photograph`

to:

`photograph as clean anchor; geometry frames it from behind/beside it`.

Target behavior is closely inspired by FIFA 17's clean player-tile hierarchy while keeping this project original and rights-safe.

## Protected systems

Do not change unless a reproduced regression requires it:

- loading screen structure/timing/photo treatment;
- gameplay/scoring/tiebreak rules;
- Showdown creation transaction;
- League Wheel confirmation;
- Club Assignment reveal/lock flow;
- Transfer Challenge logic/state machine;
- Season Review transaction boundary;
- Statistics/Legacy/Trophy behavior;
- Settings/preferences;
- `js/screens.js` routing authority;
- `js/storage.js` persistence authority;
- localStorage keys/schema;
- Messi and Lahm photography unless a regression is found;
- lazy module/media architecture.

## Implemented maintenance architecture

### James / Rashford / Martial

`data/footballVisuals.js` now gives these three assets the declarative treatment:

`treatment: "clean-anchor"`

The shared presentation contract now keeps:

- decorative ambience at z0/z1;
- the photograph at z2;
- text/caption in a separate z4 copy plate outside the image anchor;
- full authored derivative visibility under `object-fit: contain`;
- no CSS colour filter on the photographs.

Rashford and Martial use clean right-side player anchors in Transfer Challenge. No decorative line is allowed to paint over their faces.

James uses a clean right-side portrait anchor on Create Showdown with no white wash over his face.

### Home Reus

`css/visual-fidelity-r3.css` introduces the v1.0.2 Home treatment:

- desktop Reus uses a rectangular right-side photo anchor;
- desktop `clip-path` is removed;
- the competing desktop jersey-number overlay is removed;
- decorative layers stay behind the photograph;
- desktop photo filtering is disabled;
- the bounded mobile treatment remains separately protected.

The startup/loading composition is intentionally preserved from the previously accepted treatment because the owner explicitly likes it.

## Browser evidence collected before final release promotion

Draft PR #13 was opened early to obtain real browser evidence rather than validating only from CSS/source inspection.

### Home/Reus

The new Home audit passed all tested viewports:

- 940×700 DPR1 — rectangular anchor, crop `53% 2%`, no desktop clip-path;
- 1100×720 DPR1 — crop `53% 12%`;
- 1366×768 DPR1 — crop `53% 12%`;
- 390×844 DPR2 — previously accepted mobile treatment remained intact.

Manual screenshot inspection confirmed the rejected diagonal head/neck cut is gone and Reus reads as a clean FIFA-style tile anchor.

### Transfer Challenge

Manual browser screenshot inspection confirmed:

- Rashford's face is unobstructed;
- Martial is unobstructed and visually consistent;
- decorative geometry is behind the photographs rather than crossing them;
- the left-copy/right-player structure reads closer to the supplied FIFA 17 reference.

### James first candidate

The first clean-anchor James candidate restored facial detail, but the real near-breakpoint audit correctly rejected the composition because the photograph occupied only 54.6% of its frame and the copy plate was too narrow for the surname.

The visibility threshold was not lowered.

The composition was retuned to:

- desktop photo stage: `60%`;
- desktop copy plate: `36%`;
- 701–1020 photo stage: `58%`;
- 701–1020 copy plate: `38%`;
- smaller name sizing so `RODRÍGUEZ` reads deliberately rather than as an awkward broken word.

## Release/runtime identity

Current candidate identity:

- application: `v1.0.2`;
- runtime revision: `1.0.2-r1`;
- visual fidelity layer: `css/visual-fidelity-r3.css`.

`package.json` and the root package entries in `package-lock.json` are now `1.0.2`.

## Permanent gate changes

The permanent visual gates are being strengthened rather than weakened.

Licensed Football Visuals now protects:

- explicit `clean-anchor` metadata for James/Rashford/Martial;
- photo frame above decorative pseudo-elements;
- copy plate outside the photo anchor;
- full derivative crop-safe rendering;
- tuned James desktop/near-breakpoint geometry;
- Rashford/Martial clean-anchor geometry;
- source/license/provenance contracts;
- Messi/Lahm protected behavior;
- real desktop/near-breakpoint/mobile screenshot journeys.

Home visual auditing now protects:

- desktop rectangular Reus anchor;
- no desktop head/neck clipping `clip-path`;
- photo above decorative layers;
- protected mobile path;
- physical-pixel and overflow quality floors.

Static/release/Statistics/Season Review/Stability authorities are being promoted to `v1.0.2 / 1.0.2-r1` while preserving their existing gameplay/accessibility/storage assertions.

`RELEASE_V1.0.1.md` remains immutable historical evidence. `RELEASE_V1.0.2.md` is the new defect-only maintenance record.

## Failure classification so far

1. Initial Licensed Football Visual contract failure — **stale test authority**, because it still demanded old r5 frame percentages.
2. First Licensed Football Visual browser failure — **real visual composition failure**, James near-breakpoint occupancy 54.6%; fixed by changing composition, not threshold.
3. Stability contract failure — **release-coherence failure**, `package.json` was still 1.0.1 after `APP_VERSION` moved to 1.0.2; root package/lock identity corrected.
4. Statistics and Season Review failures — **stale cache-revision assertions** still requiring `1.0.1-rN`; promoted without changing feature behavior.
5. Static App failure — **expected release-authority drift** while current docs/release record still described v1.0.1; v1.0.2 authority is now promoted coherently.
6. First package-lock tuning helper stopped deliberately because it found four generic `"version": "1.0.1"` strings; the script was corrected to modify only the two root package version fields rather than blindly editing dependency versions.

## Important implementation commits/checkpoints

- clean-anchor data contract: `a9e4c994ef7c055be6a995f5e0be78f9d68e1dbe`
- runtime treatment exposure: `4755179ec7ade3f79f43051707e148218e291384`
- clean-anchor shared CSS: `3acf90105477ea243d9a5550e4c517c762b5f685`
- Home/loading r3 fidelity layer: `68db8fa1f48b0d2ceb5002645e08780cbba38047`
- app v1.0.2 identity: `f2cdf94640f4842e0b3ebcb46b672bbeae9f97db`
- Home browser protection: `87ef631fd6a45506a1a792f9faa27a2f791ab3a0`
- generated runtime/cache integration: `83ea59e478199387430ffa6eb401520e6bcb676c`
- permanent clean-anchor visual authority: `19ba022dc72b1bb4148f5bd8c3227a77bae5c01b`
- tuned James/package release candidate: `de17fa68ff71b4fb6ee57118477457836ce88e1c`
- v1.0.2 release/document/workflow authority promotion: `36696d5ca7fe66224d2e721c57e7ff0467d3a433`

## Current branch/PR

Branch:

`agent/v1.0.2-footballer-tile-maintenance`

Draft PR:

`#13 — v1.0.2: rebuild footballer tiles around clean-anchor photography`

Base main:

`88fbf11b7f74b6cb69b5dd576af3754e55fc0880`

## Current next action

Run the complete permanent PR matrix on the promoted v1.0.2 authority, inspect the new James/Transfer/Home browser screenshots, fix any real regression without weakening gates, then remove all temporary v1.0.2 development workflows/scripts before freezing the final merge candidate.

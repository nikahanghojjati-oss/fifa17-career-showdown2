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

`css/footballVisuals.css` currently places decorative pseudo-element gradients above the player photographs:

- `.footballVisualPanel::before` uses `z-index:2`;
- `.footballVisualPanel::after` uses `z-index:3`;
- `.footballVisualMediaFrame` is `z-index:1`.

This architecture permits accent geometry to cross player faces.

The light-tone James panel adds a strong white wash above the photograph, matching the owner-reported faded face.

### Transfer photos

Rashford and Martial are authored `contain` crops, but the same above-photo diagonal overlay still crosses the image. Rashford is the clearest failure because his face sits in the overlay path.

### Home Reus

`css/app.css` currently uses `.menuCoverAthlete img { object-fit: cover; object-position:53% 18%; }` inside a narrow right-side frame. The loading screen uses separate startup art direction and is not the same failure class.

The next Home treatment should preserve the local Reus source but integrate it as a clean anchor instead of aggressively zoom-cropping the photograph.

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

## Planned implementation lanes

1. Rebuild shared football-photo presentation into a clean-anchor model.
2. Remove above-face decorative geometry for James/Rashford/Martial.
3. Tune James tonal treatment to restore face contrast without changing licensed source pixels.
4. Rebuild Home Reus tile as a clean contained/anchored photograph while preserving the loading screen.
5. Add declarative presentation metadata/test hooks so future edits cannot regress face-safe behavior silently.
6. Advance runtime/cache identity to v1.0.2 maintenance revision when runtime bytes change.
7. Strengthen permanent visual/static/stability gates for the new architecture.
8. Run full PR matrix on one frozen head.
9. Inspect browser screenshots, not only test status.
10. Merge with exact-head protection, verify Pages, run post-merge Stability Lane/deployed smoke.
11. Update release/state/next-task/handoff only after validated behavior is real.

## Action log

1. Confirmed current `main` at `88fbf11b7f74b6cb69b5dd576af3754e55fc0880`.
2. Verified GitHub plugin permission is `Allow all actions`.
3. Created branch `agent/v1.0.2-footballer-tile-maintenance` from current main.
4. Inspected `css/footballVisuals.css`, `data/footballVisuals.js`, `js/footballVisuals.js`, `css/app.css`, `js/menuExperience.js`, and `index.html`.
5. Confirmed root causes above from live source.
6. Created this rolling maintenance handoff before runtime edits.

## Current next action

Implement the clean-anchor presentation architecture and Reus Home treatment, then update permanent validators and runtime revision before opening a PR.

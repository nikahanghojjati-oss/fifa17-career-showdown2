# Career Mode Showdown — v1.0.2 Post-Merge / Deployment Handoff

Last updated: 2026-08-11
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Runtime release: `v1.0.2` / `1.0.2-r1`

## 1. Owner instruction carried through this release

The owner supplied Chromebook screenshots and an actual FIFA 17 menu reference, requested a major maintenance pass, and defined the visual direction:

- footballer photography must become a mature system;
- FIFA 17 tiles use the player as a clean visual anchor;
- James's face must not be washed out;
- Rashford's face must not be crossed by graphic lines;
- Home Reus must not have the unattractive head/neck cut;
- the cinematic loading screen is liked and must be protected;
- development should continue directly in GitHub through validation/deployment without intermediate owner work requests;
- meaningful actions/chat decisions must be recorded continuously.

GitHub access was checked at the start of the pass and was `Allow all actions`. No additional access request was required.

## 2. Final implementation principle

Old model:

`graphics over photograph`

v1.0.2 model:

`photograph as clean anchor; geometry stays behind/beside the player`

James, Rashford and Martial now declare `treatment: "clean-anchor"`.

The permanent runtime layering is:

- decorative ambience: z0/z1;
- photograph: z2;
- separated identity/copy plate: z4.

The complete authored derivatives remain crop-safe under `object-fit: contain`; no CSS colour filter is applied to these required photos.

## 3. Final visual solutions

### James Rodríguez — Create Showdown

The first side-column clean-anchor candidate still made James too inset at 940×700. The permanent coverage threshold rejected it twice; the threshold was never lowered.

Final desktop/windowed layout:

- full-width identity plate above the image;
- photograph begins at `top:30%`;
- photograph width `100%`;
- copy and photograph are vertically separated;
- mobile explicitly resets to the compact side layout.

This removes the white facial wash and makes James the tile anchor rather than a faded background.

### Marcus Rashford / Anthony Martial — Transfer Challenge

Final desktop layout remains left-copy/right-photo.

Desktop photo stages:

- Rashford `34%`;
- Martial `36%`.

The 940px browser gate found Rashford's original windowed frame below the permanent 150px quality floor. The floor was not weakened.

Final 701–1020 geometry:

- copy `52%`;
- Rashford `40%`;
- Martial `42%`.

Small phones stack the player tiles vertically.

Real browser screenshots show both faces unobstructed; decorative FIFA-inspired geometry stays in the background zone.

### Marco Reus — Home

Desktop Reus now uses a rectangular right-side photo anchor with no diagonal container clip.

Protected desktop positions:

- 940×700: `53% 2%`;
- 1100×720 / 1366×768: `53% 12%`.

No desktop CSS photo filter or competing jersey-number overlay remains.

The separate mobile treatment remains bounded.

### Loading screen

The owner-liked cinematic loading screen is explicitly protected. v1.0.2 did not redesign it; `visual-fidelity-r3.css` preserves the accepted startup composition while changing Home/menu photography separately.

## 4. Failure history preserved for future developers

1. Old frame-percentage Licensed Visual assertions failed — stale test authority; replaced with structural clean-anchor protection.
2. First James near-breakpoint candidate occupied only 54.6% of its frame — real visual failure; composition changed, threshold stayed.
3. APP/package version mismatch — release-coherence failure; package/root lock moved precisely to 1.0.2.
4. Statistics/Season Review failures — stale cache assertions; promoted without feature changes.
5. Static App failure — current docs/release still represented v1.0.1; v1.0.2 received its own release authority while v1.0.1 stayed immutable.
6. Second James side-column model occupied only 49.5% — real layout-model failure; redesigned to top identity/full-width lower photograph.
7. Windowed Rashford fell below 150px frame floor — real quality-floor failure; 701–1020 photo anchors increased to 40%/42%, threshold stayed.
8. Stability expected impossible `1.0.2-r5` — stale mechanical assertion; corrected to `1.0.2-r1`.
9. Stability rejected a temporary maintenance helper using an old checkout action — temporary CI-hygiene failure; every one-shot v1.0.2 builder/scan workflow/script was removed before final candidate.

Do not reinterpret these failures as reasons to restore rejected r3/r4/r5 presentation.

## 5. Final pre-merge evidence

PR #13:

`v1.0.2: rebuild footballer tiles around clean-anchor photography`

Final candidate:

`057586128d00812feee8681392a088e8c27a1e75`

All eleven permanent PR workflows passed on this exact immutable SHA.

Licensed Football Visuals passed contracts and real Chromium visual audits.

Stability Lane passed storage/release/CI contracts and two consecutive complete Chromium/provenance/Home/photo audit cycles.

Manual developer inspection of the final screenshots confirmed:

- James facial contrast restored and no face overlay;
- Rashford face unobstructed;
- Martial face unobstructed;
- desktop Reus free of the rejected diagonal head/neck cut;
- loading screen kept on its protected design path.

This is technical/developer evidence, not owner visual acceptance.

## 6. Merge

PR #13 was marked ready only after all eleven permanent workflows passed.

It was merged with exact expected-head protection against `057586128d00812feee8681392a088e8c27a1e75`.

Runtime merge:

`7a573ff2691b6143ecbc53df589822d5609f5e05`

Merge title:

`Merge v1.0.2 clean-anchor visual maintenance`

Current runtime tree is the exact final PR tree.

## 7. GitHub Pages deployment

Deployment ID:

`5852810024`

Environment:

`github-pages`

Deployment status:

`success`

Deployment SHA:

`7a573ff2691b6143ecbc53df589822d5609f5e05`

Public environment:

`https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

## 8. Post-merge Licensed Football Visuals

Run:

`31503795213`

Status:

`success`

Both jobs passed:

- licensed visual contracts;
- real browser visual audit across desktop, near-breakpoint and mobile.

Therefore the merge itself re-passed the clean-anchor photo contract.

## 9. Post-merge Stability Lane

Run:

`31503795725`

Status:

`success`

Completed stages:

- storage/release/CI contracts — success;
- two consecutive complete Chromium/provenance/Home/crop-safe-photo cycles — success;
- wait for Pages and verify every runtime byte — success;
- deployed runtime-error provenance audit — success;
- deployed Home / Marco Reus audit — success;
- deployed clean-anchor football-photo audit — success;
- complete deployed gameplay/navigation journey — success.

This is the release's strongest technical/live proof.

## 10. Protected systems survived

No intentional behavior change was made to:

- gameplay/scoring/tiebreak rules;
- exactly-two-manager contract;
- League Wheel confirmation;
- Club Assignment transaction/reveal;
- Transfer Challenge state machine;
- Season Review confirmation transaction;
- Statistics calculation authority;
- Legacy/Trophy/Settings semantics;
- `js/screens.js` routing authority;
- `js/storage.js` persistence authority;
- localStorage keys/schema;
- optional-module/media lazy architecture.

All permanent workflow families stayed green through the final PR candidate and post-merge runtime.

## 11. Current status after deployment

Technical v1.0.2 status:

`COMPLETE, MERGED, DEPLOYED, POST-MERGE GREEN`

Owner visual acceptance:

`PENDING REAL-DEVICE REVIEW OF DEPLOYED V1.0.2`

Do not claim owner approval from CI, screenshots or developer inspection.

The owner should inspect:

- Home Reus desktop tile;
- Create Showdown James;
- Transfer Rashford;
- Transfer Martial;
- loading screen regression only.

## 12. Next legal development path

If the owner supplies new rejection evidence:

- remain inside the finite v1.0.x maintenance lane;
- reproduce the exact public/device failure;
- make the smallest targeted correction;
- strengthen the corresponding permanent gate;
- preserve accepted systems.

If the owner accepts v1.0.2 or explicitly defers visual review:

`v1.1.0 Data Safety and Recovery` becomes Current.

First implementation branch only:

`Candidate A — Versioned Backup Envelope + Non-Mutating Export`

Do not jump to Candidate B/C, PWA, profiles, cloud or two-device work.

## 13. Documentation finalization note

This file and the final current-state wording updates are documentation-only and were prepared only after the exact runtime merge and public deployment had already passed post-merge live verification.

The runtime release authority remains `7a573ff2691b6143ecbc53df589822d5609f5e05` / `v1.0.2` / `1.0.2-r1` even if `main` later has a documentation-only commit containing this handoff.

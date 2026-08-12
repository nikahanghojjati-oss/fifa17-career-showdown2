# Career Mode Showdown v1.1.3 — Active Handoff

Status: IN PROGRESS
Started: 2026-08-11 (America/New_York)
Base main SHA: `9c9ff5fe8a3361b91400e5b37b310fa7bb42f5de`
Branch: `v1.1.3-candidate-c-visual-fixes`
Previous runtime authority: `6dfea100829016eee4820b342729b8c823426f95` (`v1.1.2 / 1.1.2-r1`)

## Owner instruction — 2026-08-11

The owner asked to move toward the next build while prioritizing the following newly reported and newly requested work:

1. Investigate and fix an intermittent League Wheel defect: after the wheel stops and selects a league, but before the owner presses Next, the wheel can begin another spin/reroll and then stop on the same league.
2. Replace the James Rodríguez source photograph again and do not reuse any James source picture previously used by this project.
3. Replace Marcus Rashford and Anthony Martial source photographs.
4. Select player photographs for stronger extreme emotion / drama / cinematic impact, whether in-game or outside the match, while prioritizing high image quality, photogenic composition and historically meaningful moments.
5. Add at least seven additional football photographs across appropriate screens, using disciplined UI/UX placement and visual control rather than decorative clutter.
6. Continue toward the next substantive build after the owner-priority defect and visual work, while preserving protected gameplay/scoring/data-safety architecture.

## Operating constraints carried forward

- `00_HANDOFF_GOLDEN_RULE.md` remains mandatory; this file is being maintained continuously.
- `js/screens.js` remains sole route/history authority.
- `js/storage.js` remains sole persistence authority.
- Scoring/tiebreak rules, exactly-two-manager model, same-league/different-club semantics, permanent club assignment and Transfer/Season Review behavior must not change during this owner-priority work.
- Marco Reus Home/loading identity remains protected unless new evidence specifically requires a change; the owner previously liked the loading screen.
- Candidate A export and Candidate B read-only import analysis remain protected dependencies.
- Candidate C — Atomic Restore + Recovery UX — remains the next substantive Data Safety and Recovery task after these owner-priority fixes are integrated safely.
- Existing startup budgets may not be raised merely to accommodate new visuals; added photos should remain lazy/non-eager where possible.
- Every third-party photo must have explicit provenance/license authority recorded before publication.

## League Wheel defect investigation

### Reproduction-class root cause identified

The reported behavior is consistent with the current transform/transition architecture rather than a second random league draw.

Current source behavior before the fix:

- `.wheelTrack` owns a permanent CSS `transition: transform 4s ...` even when no spin is active;
- a real spin writes a transform containing five full revolutions plus the selected-league angle;
- when the 4-second timer completes, the league is persisted and `renderLeagueWheelState()` normalizes the transform to the mathematically equivalent base selected angle;
- `setWheelRotationWithoutAnimation()` temporarily writes `transition:none`, changes the transform, then restores the prior transition in the next animation frame.

At the exact end-of-spin style boundary browsers are allowed to coalesce style changes. That makes the normalized transform capable of being seen as another transition from the five-revolution value back to the equivalent selected angle. Visually this looks exactly like a fresh reroll that ultimately stops on the same league, even though `getRandomLeague()` was not called a second time.

### Fix contract

The wheel transition will become operation-scoped:

1. settled/default wheel state has no transform transition;
2. only an explicit active spin receives the 4-second transform transition;
3. the spin class/inline transition is removed before the final selected rotation is normalized;
4. cancel/route-boundary cleanup also removes spin-transition state;
5. reduced-motion timing uses the same operation-scoped contract;
6. League Selection still persists once and still requires the explicit Continue action before Club Assignment;
7. permanent League Confirmation tests will add an assertion that a settled selected wheel cannot retain an active transform transition or trigger a second visual spin.

No league-selection semantics or random-selection rules need to change.

## Visual source research checkpoint

### Rejected source classes

- Getty/editorial photographs were visually attractive but rejected because the repository requires explicit reusable licensing.
- Current James interview source (`James Rodríguez in September 2016 - 02.jpg`) is rejected by the owner for insufficient drama/cinematic value and will not remain active.
- Previous James 2019 Real Madrid derivative/source is also forbidden from return by explicit owner instruction/history.
- Low-resolution or soft alternatives are being rejected even when licensed if they do not meet the new photogenic/cinematic quality target.

### High-value licensed research direction

The source review is prioritizing Wikimedia Commons originals with explicit Creative Commons provenance and materially higher native resolution.

Current strongest James still candidate under review is `1 James Rodríguez.jpg`: James at the 2014 World Cup round of 16 against Uruguay, 2629×1817, own work by Chensiyuan. It is a historically important James moment and materially stronger photographic source than the current interview still. Before activation its exact license metadata, authored crop and visual quality will be validated in the build pipeline.

For Marcus Rashford, the 16 April 2017 Manchester United v Chelsea set is particularly valuable: Commons provides 4896×3672 Ardfern originals, and the Marcus Rashford category identifies `(11).jpg` as depicting Rashford. The match itself is a strong historical United/Rashford context, but the exact frame will be inspected after local derivative generation before it can become source authority.

For Anthony Martial, high-resolution Ardfern Manchester United match sets from 2017 are available (including West Ham and Manchester City). Exact frame selection remains evidence-driven; no source is activated merely because its metadata names Martial.

### Additional-image principle

The requested seven-plus new visuals will not be random wallpaper. Each must satisfy all of:

- explicit reusable license/provenance;
- good native resolution for its intended slot;
- a football moment or expression with real emotional/historical value;
- a declared screen purpose;
- face-safe clean-anchor or cinematic-band composition;
- lazy/non-startup loading where possible;
- responsive control at desktop, windowed Chromebook and mobile DPR2 sizes;
- readable UI/copy contrast without painting decorative lines over faces.

The likely placement set is being evaluated against the existing screen architecture before source locking (Showdown Home, League/Club progression, Season Results/Review/Summary, Legacy and Rule Book are higher-value candidates than adding imagery to Settings/Data Management).

## Builder/asset architecture checkpoint

`tools/build_r5_player_visuals.py` remains the existing reproducible licensed-photo builder. It retrieves Commons metadata/downloads, validates author/license/crop bounds, prevents upscaling, writes optimized WebP derivatives, fingerprints sources/outputs and updates `assets/football/asset-manifest.json`.

The new work should extend this reproducible local-asset architecture rather than hotlinking third-party images at runtime. This also preserves the future v1.2 offline-app direction.

## Current execution checkpoint

- Verified current `main` is exactly `9c9ff5fe8a3361b91400e5b37b310fa7bb42f5de`.
- Read `00_HANDOFF_GOLDEN_RULE.md`, `00_DEVELOPER_START_HERE.md`, and `NEXT_TASK.md` from that SHA.
- Created focused branch `v1.1.3-candidate-c-visual-fixes` from exact current main.
- Created this handoff before runtime mutation.
- Traced League Wheel source/CSS and identified the post-spin transform-normalization transition race above.
- Inspected current visual data authority and the permanent player-photo builder.
- Began license/resolution/history-based source research; rejected editorial/Getty and weak/low-resolution candidates.
- Next: implement and gate the wheel transition fix; lock/generate replacement player derivatives; define and generate at least seven additional licensed visuals; integrate them through the lazy football-visual subsystem; then run deep browser/visual/performance gates before deciding the safe Candidate C integration boundary.

## Acceptance state

Owner acceptance: PENDING. No visual or runtime change from this branch should be described as owner-approved until the public build is available and the owner has inspected it.

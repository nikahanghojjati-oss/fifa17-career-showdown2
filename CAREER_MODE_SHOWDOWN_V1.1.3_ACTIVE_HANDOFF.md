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
- Existing startup budgets may not be raised merely to accommodate new visuals; added photos should remain route-scoped/non-startup where possible.
- Every third-party photo must have explicit provenance/license authority recorded before publication.

## League Wheel defect investigation and fix

### Reproduction-class root cause identified

The reported behavior is consistent with the current transform/transition architecture rather than a second random league draw.

Behavior before the fix:

- `.wheelTrack` owns a permanent CSS `transition: transform 4s ...` even when no spin is active;
- a real spin writes a transform containing five full revolutions plus the selected-league angle;
- when the 4-second timer completes, the league is persisted and `renderLeagueWheelState()` normalizes the transform to the mathematically equivalent base selected angle;
- `setWheelRotationWithoutAnimation()` temporarily wrote `transition:none`, changed the transform, then restored the prior transition in the next animation frame.

At the exact end-of-spin style boundary browsers can coalesce style changes. That makes the normalized transform capable of being seen as another transition from the five-revolution value back to the equivalent selected angle. Visually this looks exactly like a fresh reroll that ultimately stops on the same league, even though `getRandomLeague()` was not called a second time.

### Implemented fix

Commit: `e03ad823cdb3bcbe0eb965934f0f2b91fcff72d4`

`js/leagueWheel.js` now uses operation-scoped transform animation:

1. settled/default wheel state explicitly has `transition:none`;
2. only an explicit active spin arms the transform transition;
3. the real spin duration and reduced-motion duration own the transition duration directly;
4. an off-transition baseline is committed before arming the real spin;
5. the transition is disarmed before selected state is saved/rendered;
6. final selected-angle normalization therefore cannot visually re-spin;
7. cancellation/route-boundary cleanup also removes the transition state;
8. League Selection still saves once and still requires explicit Continue before Club Assignment.

The permanent League Confirmation gate still needs the new settled-transition regression assertion before release freeze. No league random-selection semantics or gameplay rules were changed.

## Visual source selection / licensing authority

### Rejected sources

- Getty/editorial photographs were rejected despite visual quality because reuse authority is insufficient for the repository.
- The active v1.1.1 James post-match interview source is rejected by the owner for insufficient cinematic/dramatic value.
- The older 2019 James source/derivative is explicitly forbidden from returning.
- Previous Rashford and Martial sources are being removed from active runtime authority.
- New candidates remain rejectable after browser screenshot review even if licensing is valid; license compliance alone is not sufficient visual acceptance.

### Generated v1.1.3 visual set

The permanent builder `tools/build_r5_player_visuals.py` was expanded to generate the three replacements plus seven new visuals while preserving protected Messi/Lahm.

Temporary build workflow:

- workflow: `Temporary v1.1.3 Licensed Visual Builder`;
- run: `31551552859`;
- conclusion: SUCCESS;
- generated asset commit: `2e46d51a4850a5922c99aeafa202ecbe5f4c2d13`;
- manifest generator authority: `licensed-football-visual-builder-v1.1.3`;
- active licensed set: 12 local derivatives.

The generator validates Commons metadata, crop/source bounds, license metadata, source dimensions, no-upscaling policy and a 360 KB per-image ceiling. It records source/output hashes and removes replaced active derivatives when no longer referenced.

Current generated candidates:

1. James Rodríguez — `james-rodriguez-world-cup-2014-v113.webp`
   - source: `James Rodríguez (cropped).jpg`;
   - context: 2014 FIFA World Cup, 19 June 2014;
   - source: Copa2014.gov.br;
   - license: CC BY 3.0 BR;
   - source dimensions: 1415×3062;
   - output: 508×1099, 108,120 bytes;
   - output SHA-256: `95b3d55df2117b619273f9e46378974836e785bb68e0c7ef4aecd1a15d6f9ee8`.
2. Marcus Rashford — `marcus-rashford-chelsea-2017-v113.webp`
   - source: Manchester United v Chelsea, 16 April 2017 `(11)`;
   - author: Ardfern;
   - license: CC BY-SA 4.0;
   - source dimensions: 4896×3672;
   - first-pass output: 1120×840, 176,988 bytes;
   - this full match frame is explicitly pending real-UI subject-occupancy review before source/crop lock.
3. Anthony Martial — `anthony-martial-cska-2017-v113.webp`
   - source: `Anthony Martial 27 September 2017 cropped.jpg`;
   - Champions League / Manchester United context;
   - author: Дмитрий Голубович;
   - license: CC BY-SA 3.0;
   - source/output: 521×999, 114,040 bytes;
   - player-isolated Commons derivative, pending final drama/quality screenshot review.
4. Cristiano Ronaldo — `cristiano-ronaldo-euro-2016-v113.webp`
   - Portugal / Euro 2016 quarter-final context;
   - Chensiyuan · CC BY-SA 4.0;
   - 700×1099, 110,272 bytes.
5. Paul Pogba — `paul-pogba-man-utd-2016-v113.webp`
   - Manchester United / Europa League context;
   - Ardfern / derivative by Danyele · CC BY-SA 4.0;
   - 893×1100, 175,628 bytes.
6. Zlatan Ibrahimović — `zlatan-ibrahimovic-man-utd-2016-v113.webp`
   - Manchester United / Europa League context;
   - Ardfern / derivative by Danyele · CC BY-SA 4.0;
   - 651×1100, 158,960 bytes.
7. Antoine Griezmann — `antoine-griezmann-atletico-2016-v113.webp`
   - Atlético Madrid / Champions League context;
   - Светлана Бекетова · CC BY-SA 3.0;
   - 1120×832, 204,440 bytes.
8. Neymar — `neymar-brazil-olympic-gold-2016-v113.webp`
   - Brazil's Rio 2016 Olympic gold-medal final context;
   - Fernando Frazão/Agência Brasil · CC BY 3.0 BR;
   - 1120×747, 83,836 bytes.
9. Mario Balotelli — `mario-balotelli-euro-2012-celebration-v113.webp`
   - Italy's Euro 2012 semi-final second-goal celebration context;
   - Joern Fehrmann · CC BY-SA 3.0;
   - 1200×675, 224,638 bytes.
10. Radamel Falcao — `radamel-falcao-europa-league-2012-v113.webp`
    - Atlético Madrid Europa League title celebration context;
    - Juanca Parce · CC BY-SA 3.0;
    - 708×1100, 101,514 bytes.
11. Lionel Messi — protected existing r4 Statistics derivative.
12. Philipp Lahm — protected existing r4 Trophy Room derivative.

## Seven-new-screen placement plan

The visual expansion is intentionally a screen-purpose system rather than random wallpaper:

- League Wheel → Cristiano Ronaldo, `FIND YOUR STAGE`;
- Club Assignment → Paul Pogba, `CLUB IDENTITY`;
- Showdown Home → Zlatan Ibrahimović, `RIVALRY HEADQUARTERS`;
- Season Results → Antoine Griezmann, `SEASON PRESSURE`;
- Season Summary → Neymar, `SEASON VERDICT`;
- Legacy → Radamel Falcao, `LEGACY`;
- Rule Book → Mario Balotelli, `RULES OF THE GAME`.

Each new placement is planned as one bounded cinematic band/anchor with face-safe geometry, not a background wallpaper. Settings/Data Management remains intentionally image-free so recovery and control surfaces stay calm and functional.

## Performance architecture decision

The current football visual runtime globally preloads all five images when initialized. That architecture is unacceptable for a 12-image set because it would convert the seven visual additions into startup/background network payload.

v1.1.3 therefore changes the visual subsystem to route-scoped asset warming/mounting:

- no global all-image preload during football-visual module initialization;
- one destination screen warms only the assets declared by its plan (Transfer = two; other visual screens = one);
- images remain local repository files rather than runtime third-party dependencies;
- the existing app-shell raw/gzip startup thresholds will not be raised to hide visual expansion cost;
- a permanent browser network assertion will verify that the 12 football derivatives are not all requested at Home/startup.

The larger 12-image archive/repository payload is distinct from startup transfer cost and will be gated separately.

## Scope / Candidate C boundary

Owner-priority v1.1.3 is being kept focused on the reproduced League Wheel defect and the requested visual-source/system expansion. Candidate C Atomic Restore + Recovery UX remains the immediate next Data Safety and Recovery build after this maintenance release is merged/deployed/proven.

Reason: Candidate C is the first multi-key canonical restore write transaction and requires deep failure injection/rollback proof. Combining that transaction with ten new/changed photography assets, expanded route presentation and a wheel animation defect repair would create an unnecessarily broad release risk surface and make regressions harder to isolate. This is a sequencing decision, not a roadmap cancellation.

## Current execution checkpoint

- Verified current `main` is exactly `9c9ff5fe8a3361b91400e5b37b310fa7bb42f5de` at task start.
- Created branch and public handoff before runtime mutation.
- Fixed the League Wheel post-selection visual reroll race in `e03ad823...`.
- Expanded deterministic licensed asset builder in `1a0cc8b...`.
- Temporary visual generator completed successfully as run `31551552859` and committed all 12 candidates in `2e46d51a...`.
- Current next step: integrate generated manifest data into the runtime screen plan; change the visual loader from global preloading to per-screen loading; add bounded cinematic-band CSS; extend required visual navigation ownership; then execute real browser screenshots/occupancy/accessibility/network gates and reject/recrop any candidate that is not strong enough in the actual UI.

## Acceptance state

Owner acceptance: PENDING. No visual or runtime change from this branch should be described as owner-approved until the public build is available and the owner has inspected it.

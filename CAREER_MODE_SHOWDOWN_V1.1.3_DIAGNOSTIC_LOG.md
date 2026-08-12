# Career Mode Showdown v1.1.3 — Diagnostic Log

Companion to `CAREER_MODE_SHOWDOWN_V1.1.3_ACTIVE_HANDOFF.md`.

This file is append-only in spirit: it records diagnostic and pre-release evidence, including failed checks, so later developers do not mistake corrected test harness failures for product defects or silently repeat them.

## 2026-08-11 / 2026-08-12 — deterministic asset generation

- Temporary workflow: `Temporary v1.1.3 Licensed Visual Builder`.
- Run ID: `31551552859`.
- Input head: `1d2cad86562d060be9599bfb70732d9e92f37437`.
- Conclusion: SUCCESS.
- Generated asset commit: `2e46d51a4850a5922c99aeafa202ecbe5f4c2d13`.
- Result: 12 active licensed local derivatives in `assets/football/asset-manifest.json`; per-image ceiling held; exact source/output hashes recorded.

## 2026-08-12 — deterministic runtime integration

- Temporary workflow: `Temporary v1.1.3 Runtime Integration`.
- Run ID: `31551887524`.
- Input head: `fd0750ea19292b975dc4c4243941a6c8b1dd7ced`.
- Conclusion: SUCCESS.
- Generated integration commit: `aa0fe59dd3e5485f4616fc5450033db1b269d49f`.
- Result: required visual screen ownership expanded to eleven destinations; v1.1.3 visual CSS loaded after protected base CSS; route-scoped visual integration applied.

## 2026-08-12 — first 11-screen browser preview

- Temporary workflow: `Temporary v1.1.3 Visual Preview`.
- Run ID: `31551978375`.
- Head: `1a7b217fcf115101c81c88d72a5c3840a1e92494`.
- Job: `93976403628`.
- Conclusion: FAILURE.
- Failure: `createShowdown/james-rodriguez-world-cup-2014-v113: image did not settle`.
- Evidence review: `waitForVisual()` had already required a decoded image plus the `imageLoaded` class, but the subsequent assertion required computed opacity `>= .999` after only two animation frames. Protected base CSS intentionally fades image opacity over 180 ms, so the audit could inspect the image inside that valid transition window.
- Classification: TEST-HARNESS TIMING FAILURE, not accepted product/asset evidence and not a reason to change the 180 ms product fade.
- Screenshot artifact: none; failure occurred before the first screenshot was written.
- Correction: make `waitForVisual()` wait for the existing computed opacity transition to reach its settled state before layout/composition assertions. No opacity, crop, face-safety, overflow or startup-network threshold was lowered.

## 2026-08-12 — second 11-screen browser preview

- Run ID: `31552082889`.
- Head: `4173f5bbf50cccd499f18a8f0887a3d6c2fe5a86`.
- Job: `93976729622`.
- Conclusion: FAILURE.
- Product finding: `transferChallenge/marcus-rashford-chelsea-2017-v113: copy overlaps protected photo anchor`.
- Classification: REAL LAYOUT GATE FINDING. The new Rashford source was intentionally given a larger match-photo stage, and the inherited Transfer copy width intruded into that protected stage.
- Artifact: `9124620903`; the first four desktop screens were captured before the Transfer assertion.
- Manual review of those first four captures:
  - James reads as a materially stronger, historic World Cup portrait/action image than the rejected interview still;
  - Ronaldo, Pogba and Zlatan cinematic bands were visually clean and integrated rather than wallpaper-like;
  - hierarchy/copy contrast remained controlled.
- Correction commit: `be95d5062030667bc04a9a472e78fc97f841329d`.
- Correction strategy: keep the larger Rashford/Martial image stages and narrow/rebalance Transfer copy plates by breakpoint. The finding was not hidden by shrinking the player photograph.

## 2026-08-12 — third 11-screen browser preview

- Run ID: `31552209516`.
- Head: `be95d5062030667bc04a9a472e78fc97f841329d`.
- Job: `93977116951`.
- Conclusion: FAILURE.
- Progress before failure: Create Showdown, League Wheel, Club Assignment, Showdown Home, Transfer Challenge, Season Results and Season Summary all passed the active visual assertions at desktop. This confirms the prior Transfer copy/photo overlap is resolved at that breakpoint.
- Failure: temporary audit attempted `careerStatistics` after loading its optional module but had not invoked the module's `createCareerStatisticsScreen()` constructor. The runtime correctly reported `Missing screen careerStatistics`.
- Classification: TEST-HARNESS LAZY-SCREEN SETUP FAILURE, not a runtime product defect.
- Artifact: `9124663264`; seven desktop screen captures were preserved, including the corrected Transfer view and both season bands.
- Manual Transfer review: Martial is clean and prominent in the isolated Champions League frame; Rashford's Chelsea match frame shows a real emotional match moment and now has clear separation from the copy plate. The full-frame Rashford subject occupancy remains under qualitative review; the source may still receive an authored source-pixel crop if it looks too distant after responsive evidence is complete.
- Correction commit: `92f45855de122ff572321ad698905e0d5fe6736e`.
- Correction: construct `careerStatistics`, `trophyRoom` and `ruleBook` through their real lazy-module screen constructors before audit, and capture every destination screenshot before layout assertions so any future failure keeps direct visual evidence.

## Release-proof rule

Diagnostic runs, including corrected failures, are not counted toward the eventual official repeated pre-merge or production proof matrix. The final release candidate must be frozen and tested independently after temporary build/preview helpers are removed.

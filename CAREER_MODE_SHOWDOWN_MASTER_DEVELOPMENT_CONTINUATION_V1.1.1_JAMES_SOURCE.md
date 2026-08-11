# Career Mode Showdown — v1.1.1 James Rodríguez Source Replacement Handoff

Last updated: 2026-08-11
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Branch: `agent/v1.1.1-james-real-madrid-source`
Base `main`: `a4045e891989dc5649cd65c78dace9e4ac192434`

## Owner instruction

The owner instructed this build to start from the latest build, replace the James Rodríguez picture with a genuinely different source that still depicts James during his Real Madrid period, fully respect the approved roadmap, deepen the analytical quality of the release gates, and run the build against each applicable permanent gate twice.

The owner has an existing standing instruction that implementation happens directly in GitHub and meaningful actions/decisions are continuously recorded in a public handoff for the next developer.

## Current baseline

Application: `v1.1.0`
Runtime revision: `1.1.0-r1`
Current production line: Candidate A backup/export is complete. Candidate B import analysis remains the next substantive roadmap feature after this focused maintenance build.

This branch is a maintenance/source-art-direction build. It must not absorb Candidate B merely to inflate scope.

## Scope

Included:

1. replace the current James Rodríguez 2019 source with a different licensed Real Madrid-era source;
2. create a new authored derivative rather than merely repointing the old crop;
3. keep James's head/face unobstructed and preserve the approved clean-anchor + face-safe accent language;
4. update provenance, manifest, runtime asset identity, deterministic builder and permanent visual contracts;
5. strengthen gates so they validate source identity, club/era provenance, crop geometry, visible subject coverage, paint settlement and regression exclusions rather than only file existence;
6. run every applicable permanent workflow family twice on one frozen final PR SHA;
7. after merge, verify Pages exact bytes and run the same permanent workflow families twice again where GitHub permits, with Stability/deployed smoke included;
8. preserve Candidate A, gameplay, scoring, routing, storage and protected visuals.

Excluded:

- Candidate B import implementation;
- Candidate C restore;
- storage schema/key changes;
- gameplay/scoring changes;
- new routes;
- Rashford/Martial source changes;
- Messi/Lahm source changes;
- loading-screen redesign;
- framework rewrite.

## Source-review rule

A candidate is acceptable only if all are true:

- it is a genuinely different image source from `James Rodríguez in 2019.jpg`;
- it is demonstrably from James's Real Madrid period/context, not merely a Colombia/Bayern/Everton-era portrait;
- license/provenance are usable and recorded;
- the face is clear enough for the actual Create Showdown tile sizes;
- the authored crop can preserve the full head without requiring runtime `cover` cropping;
- the derivative can meet current physical-resolution and frame-coverage gates without upscaling.

Initial Wikimedia Commons candidates being evaluated include Real Madrid-authored CC BY material from September 2016 and January 2017. Source review precedes final selection.

## Release identity policy

Because this changes a runtime image byte and its runtime identity, it is a real maintenance release rather than a documentation-only clean seal. Final version/revision will be promoted coherently only after the source/crop is selected and the candidate passes visual review.

## Gate philosophy for this build

The owner requested deeper analytical gating. Each gate must answer a distinct failure question rather than duplicate a green badge:

1. source/provenance gate — is this truly the intended new James Real Madrid source under the documented license?
2. derivative integrity gate — do crop coordinates, dimensions, hashes and no-upscale rules reproduce exactly?
3. semantic composition gate — is the full authored derivative visible, face-safe, large enough and separated from copy/foreground geometry?
4. responsive geometry gate — does Create Showdown remain strong at desktop, near-breakpoint and mobile rather than only one viewport?
5. runtime settlement gate — are decoded pixels painted before screenshot acceptance?
6. visual regression gate — do Rashford, Martial, Reus, Messi and Lahm retain protected behavior?
7. feature/workstream gates — did an image-source maintenance change leave gameplay/state modules untouched and functional?
8. Candidate A gate — is backup export still non-mutating and usable?
9. accessibility/performance gate — no contrast, touch, overflow, axe or startup-budget regression;
10. release/deployment gate — exact immutable SHA, exact Pages bytes, public runtime journey.

Every applicable permanent workflow family must succeed twice on the same frozen candidate. A cancellation, timeout, skipped required job or failure is not counted as a pass. Any source/runtime change resets the two-pass count to zero.

## Action log

1. Fetched latest `main`; current head was `a4045e891989dc5649cd65c78dace9e4ac192434`, a documentation-only successor to the fully validated v1.1.0 seal.
2. Read the newest exact-current handoff and `NEXT_TASK.md`; confirmed Candidate B is next substantive roadmap work but should not be bundled into this owner-requested visual maintenance build.
3. Created `agent/v1.1.1-james-real-madrid-source` directly from current `main`.
4. Researched Wikimedia Commons for alternative James Rodríguez sources tied specifically to Real Madrid.
5. Confirmed `James Rodríguez in September 2016 - 02.jpg` is an 863×1080 Real Madrid-authored still from the Borussia Dortmund vs Real Madrid post-match interview, dated 28 September 2016, licensed CC BY 3.0 and independently reviewed on Commons.
6. Identified additional Real Madrid YouTube/Commons candidates (`September 2016 - 01`, `January 2017`) for comparative visual review before locking the replacement.

## Immediate next action

Run a source-comparison pass, select the strongest Real Madrid-era James source by target-tile readability rather than convenience, author the derivative, then update runtime/provenance/tests before freezing the two-pass release candidate.
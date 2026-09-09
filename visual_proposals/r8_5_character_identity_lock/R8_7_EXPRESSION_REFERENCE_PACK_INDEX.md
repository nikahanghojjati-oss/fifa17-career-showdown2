# R8.7 Expression Reference Pack Index

Status: PROPOSAL ONLY / VISUAL LANE / NON-OPERATIONAL

## Purpose

The owner supplied ten additional approved-style reference images showing Nik and Daniel under varied expressions, angles, poses, clothing and lighting. These references are auxiliary expression-geometry evidence. They do not replace the two Tier 0 owner-approved hero likeness sources.

Identity authority order remains:

1. Tier 0 owner-approved hero identity images.
2. Previously approved close hero faces from accepted visual concepts.
3. This R8.7 auxiliary expression reference pack.
4. Any newly generated candidate.

A lower tier may never override a higher tier.

## Library location

`/Showdown visual/R8_7_IDENTITY_EXPRESSION_RECOVERY/`

Persisted references:

- `REF_01_LEAGUE_FORMAL.jpeg`
- `REF_02_CLUB_PACK_FORMAL.jpeg`
- `REF_03_LEAGUE_KIT_POSES.jpeg`
- `REF_04_SEASON_SUMMARY_CELEBRATION.jpeg`
- `REF_05_CLUB_PACK_DUPLICATE_VARIANT.jpeg`
- `REF_06_POSTER_ARMS_CROSSED.jpeg`
- `REF_07_CREATE_SHOWDOWN.png`
- `REF_08_CLUB_ASSIGNMENT.png`
- `REF_09_HOME_CLOSEUP.jpeg`
- `REF_10_LEAGUE_FORMAL_ALT.jpeg`

All ten supplied references are now persisted.

## What these references are useful for

Nik:

- front and three-quarter thinking
- subtle neutral/confident tension
- chin-hand thinking pose
- pointing gesture while keeping face identity
- arms-crossed posture
- side/three-quarter head turn
- lowered gaze
- mild celebratory expression

Daniel:

- primary pointing identity
- neutral and confident front view
- lowered gaze
- side/three-quarter view
- arms crossed
- open-hand discussion pose
- restrained celebration

## Known reference imperfections

Some source concepts may contain hand, prop, anatomy, logo or layout artifacts. Those defects are not identity truth. Use the face resemblance only when a reference has non-face visual mistakes.

## Production rule adopted

Do not generate multi-expression reference boards as source assets.

Required pipeline:

`ONE CHARACTER -> ONE EXPRESSION -> LARGE OUTPUT -> OWNER REVIEW -> FREEZE -> NEXT EXPRESSION`

A future board, if needed, must be assembled from already approved individual expression assets rather than regenerated as a single image.

## Minimal required expression set

Do not build hundreds of expressions. Build only what actual site screens need.

Initial Nik set:

1. neutral
2. thinking / analytical
3. confident
4. restrained smile
5. celebration / happy only if a screen requires it
6. pointing or open-hand action only where the mapped DOM screen needs it
7. side or lowered gaze only where required

Initial Daniel set:

1. neutral/confident
2. pointing
3. thinking / lowered gaze
4. restrained smile or celebration only where required
5. open-hand / arms-crossed / side pose only where a mapped screen requires it

Back-view assets are not required unless a specific implementation surface proves a need.

## Identity-preservation rule

Expression is a muscle-state change, not a new casting.

Freeze across variants:

- skull and face proportions
- jaw and chin silhouette
- eye spacing and baseline eye shape
- nose bridge, length and tip relation
- beard boundary and density pattern
- hairline and overall hair mass
- apparent age
- skin-tone family

Allowed expression changes:

- eyelid aperture
- modest brow position
- mouth-corner movement
- lip compression or opening
- cheek tension
- gaze direction
- head angle

Avoid simultaneous large changes to multiple identity-sensitive features.

## Current generation incident

The first intended one-character / one-expression Nik-neutral generation attempt after receiving this reference pack failed at the image-generation tool level before producing an asset. No candidate was accepted or promoted from that attempt.

Do not interpret that tool failure as evidence against the workflow. The next image-generation request should retry the same bounded Nik-neutral test, not return to a multi-face board.

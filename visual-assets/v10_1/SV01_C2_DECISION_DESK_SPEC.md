# SV01 V10.1 — C2 DECISION DESK ART-DIRECTION SPEC

Status: FROZEN FOR ASTRA REVIEW
Screen: Transfer Challenge / Guess Entry
Product anchor: `main@f077b9c5be5e4d5bf5ef17b2d219983dbf142962`
Owner baseline: previous V10 candidate = 7/10
Implementation: NOT AUTHORIZED
Image generation: LOCKED

## Experience thesis

The player is inside a stadium operations room during a private transfer decision.

This is not a promotional poster of Daniel vs Nik.
It is a working football space where both managers visibly belong and where the Guess Entry task has a physical context.

The task remains sharp, flat and immediate.
The room supplies immersion.

## Camera

Family: C2 Decision Desk.

Visual target:
- 40–50 mm equivalent
- medium environmental frame
- near-level horizon
- working/seated eye height
- no exaggerated wide-angle faces or arms

The camera is close enough to understand the desk/display but wide enough to read the stadium aperture and both rivals' relationship to the space.

## Scene axis

Daniel remains the left-side identity.
Nik remains the right-side identity.

Do not reverse them in desktop/mobile state variants.

Both should share one believable horizontal/diagonal relationship across the room.

One object of attention must be obvious:
the central transfer decision surface.

Eyelines may converge on that surface or create a purposeful manager-to-task triangle.

Two unrelated outward-facing poster gazes fail.

## Physical composition

Required world cues:
1. architectural threshold/window opening to stadium
2. physical work surface or display housing
3. near foreground edge/desk lip
4. at least one readable room material beyond generic black
5. clear horizon/perspective agreement

The task board must have a reason to be where it is:
mounted display, desk-integrated screen or other believable operations-room support.

It may not float as an unsupported thick rectangle.

## Character staging

Preferred desktop relationship:
- acting manager slightly closer to the task plane
- rival present but more subordinate
- both remain recognizable
- task contact points / hands / props remain unobstructed

If existing Transfer poses do not fit the C2 camera, do not distort or mirror them to force compatibility.
That becomes a specific asset blocker for later owner authorization.

No live/private text on clipboard/tablet props.

No pose may imply opponent progress, confidence, completion or online presence unless the product exposes it.

## Lighting

Use one coherent lighting model:
- cool-neutral room ambient
- warm practical/key accent
- stadium exterior as secondary world source
- believable natural face light
- controlled warm rim only as separation

Daniel and Nik must not look cut from two different posters.

Board glow cannot be the only light that makes them belong.

## Depth

Minimum readable stack:
- far stadium
- room/threshold
- characters/shared work surface
- near foreground edge
- live task

Priority techniques:
1. perspective agreement
2. occlusion
3. contact shadows
4. relative scale
5. light separation
6. material response
7. focus hierarchy

Do not add parallax until the static frame passes.

## Live UI composition

Keep screen-aligned semantic DOM.

Desktop task region target:
approximately 640–760 px at 1366 width, refined against actual content.

Visual order:
1. Transfer Challenge scene title
2. current transfer state / phase
3. acting manager private context
4. three existing guess rows
5. opponent privacy / sealed state
6. authorized primary action

Do not add:
- timer in Guess Entry
- new confirmation
- opponent payload
- new route
- new reveal
- invented progress
- decorative fake player data

## Typography

Direction:
- short condensed display / navigation voice
- readable regular-width form text
- maximum two font families
- display energy only in display roles
- form values 16–18 px desktop, at least 16 px mobile
- instructions/errors sentence case where useful

Barlow Condensed is an acceptable rights-safe candidate for evaluation, not yet mandatory.

## Material

Near black / graphite are structure.
Brass/gold is hierarchy, not wallpaper.

Primary action gets strongest active gold.
Phase/selected state gets secondary gold.
Edges/material accents get restrained brass.

Avoid bright roof edges competing with the task.

## Desktop frame target — 1366x768

The frame should answer within five seconds:
- I am inside a football operations room
- Daniel and Nik are the two rivals
- this is a private transfer guess decision
- this central surface is what I act on next

Do not solve vertical fit by shrinking functional text.

## Mobile frame target — 390x844

Mobile is a closer C2-derived composition.

Required:
- compact shell
- short identity/scene region
- Daniel and Nik remain explicit visually or through a purposeful paired identity treatment
- one spatial cue remains
- one-column task
- comfortable labels and values
- full-width primary action where practical
- software keyboard may collapse/freeze scene region
- scrolling allowed when needed for legibility

Do not repeat the V10 mobile pattern of removing both people and leaving a long empty stadium tail.

## State coverage after visual target approval

At minimum:
- Nik editable
- Daniel editable
- Nik locked/waiting
- historical replay
- error/recovery
- any real pending state only if current production exposes it

All use the same product truth.
Presentation changes emphasis only.

## Missing-asset audit before implementation

Before any image generation:
1. test existing stadium environment against C2 perspective
2. test approved Daniel Transfer pose against C2 crop/light
3. test approved Nik Transfer pose against C2 crop/light
4. test whether a desk/display housing can be built deterministically in CSS/SVG or from existing licensed art

If any existing asset cannot meet the shared-camera/shared-light requirement, document the exact blocker.
Do not generate a replacement until Nik authorizes the specific ticket.

## What Astra must review

Astra should review this specification for:
- fidelity to FIFA 17 / The Journey reusable presentation grammar
- strength of camera and spatial relationship
- character staging
- environment specificity
- UI/world balance
- mobile identity
- whether anything still risks becoming a decorated web dashboard
- whether the spec is precise enough for a golden-frame build

Astra must not redesign product behavior or implement the page.

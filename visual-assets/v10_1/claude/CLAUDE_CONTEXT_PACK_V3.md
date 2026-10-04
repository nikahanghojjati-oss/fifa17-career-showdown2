# CAREER MODE SHOWDOWN VISUAL V10.1 — CLAUDE OPUS 5.5 CONTEXT PACK

Version: 3
Mode: ASTRA_CONSTRAINED
Claude mode recommended for first task: OPUS 5.5 + ULTRACODE
Repository: nikahanghojjati-oss/fifa17-career-showdown2
Visual branch: visual/cinematic-system-v10
Production main: read-only

## A. Studio structure

Nik is the project owner and final taste authority.

GPT-5.6 Sol is the producer, product-truth director, visual-system synthesis layer, and authority reconciler.

GPT-6 Astra High is the executive cinematic art-direction specialist. Astra authored the FIFA 17 / The Journey presentation bible and normally handles high-impact camera, staging, spatial and milestone review work. Astra is temporarily quota-constrained.

GPT-6 Sol High in Work is the principal implementation builder after a visual target is frozen.

Claude Opus 5.5 is joining as an independent senior visual/technical reviewer and temporary Astra-constrained overflow reviewer. Claude is not replacing Astra. Claude's provisional findings are reconciled by GPT-5.6 Sol and later spot-checked by Astra where material.

## B. Current product / visual state

Active screen:
SV01 Transfer Guess Entry.

Owner calibration:
the prior V10 candidate is 7/10.

The old internal 93/100 score is historical only and is retired as overriding quality authority.

The prior V10 candidate has useful strengths:
- recognizable black/gold identity
- readable main task
- approved Transfer-specific Daniel and Nik poses
- visible stadium atmosphere
- clear primary action
- privacy distinction

Its central weakness:
Daniel, Nik and the task board do not convincingly inhabit one shared physical space.

The new target is:
`inhabited football environment + deliberate camera + shared physical relationship + sharp live interface`

## C. Astra FIFA 17 / The Journey findings already accepted

FIFA 17 contributes:
- strong rectangular organization
- unequal task hierarchy
- clear selected/active states
- condensed sporting display type
- stable navigation skeleton
- readable flat UI

The Journey contributes:
- inhabited place
- specific environmental context
- camera chosen for activity and relationship
- human viewpoint
- character eyelines and posture
- foreground/midground/background depth
- coherent lighting/material response
- consequence connected to people and place

Critical synthesis:
the live interface can remain flat and screen-aligned while the world around it carries depth.

Do not tilt live form text into fake perspective.

## D. V10.1 presentation modes

Orientation:
Where are we and what comes next?
World is relatively prominent.
Use wider environmental composition.

Decision:
What must I do now?
Task becomes dominant.
World remains legible but quieter.
SV01 Guess Entry is a Decision screen.

Consequence:
What happened and what follows?
Confirmed result/object leads.
Human/world reaction supports.

These modes style existing product states.
They do not create new gameplay phases.

## E. SV01 camera

Camera family:
C2 Decision Desk.

Target:
- 40–50mm visual equivalent
- medium environmental view
- near-level horizon
- working/seated eye height
- no exaggerated wide-angle facial/arm distortion

The camera should be close enough to understand the decision surface while wide enough to read:
- stadium aperture
- room threshold
- Daniel/Nik relationship
- shared working surface

## F. Scene axis

Daniel remains left-side identity.
Nik remains right-side identity.

Do not reverse them between desktop/mobile/state variants.

A clear object of attention must exist:
the central transfer decision surface.

Eyelines may converge on it or form a purposeful manager-to-task triangle.

Two unrelated outward-facing poster gazes fail.

## G. Physical composition

Required world cues:
1. real architectural threshold/window opening toward stadium
2. physical work surface or display housing
3. near foreground edge / desk lip
4. at least one readable room material beyond generic black
5. coherent horizon and perspective

The task board must have a believable support:
mounted display, desk-integrated screen, or similar.

Unsupported floating thick rectangle fails.

## H. Character staging

Acting manager may be slightly nearer the task.
Rival may be more subordinate but remains identifiable.

Both need:
- compatible eye height
- compatible scale
- coherent light
- believable relationship to task/world
- unobstructed hands/props where they matter

Do not mirror existing character art simply to force composition.

Do not place private/live guess text on raster props.

Do not let pose/light imply opponent progress or hidden state.

## I. Lighting

Target:
- cool-neutral room ambient
- warm practical/key accent
- stadium exterior as secondary source
- natural skin
- controlled warm rim only for separation

Daniel and Nik must not look pasted from different posters.

Global gold tint does not count as shared lighting.

## J. Depth

Conceptual stack:
P0 far stadium
P1 architectural threshold
P2 room / desk / chair
P3 Daniel / Nik / neutral props
P4 near desk lip / display housing
P5 live task UI
P6 shell / session / recovery status

Static depth priorities:
1. perspective agreement
2. occlusion
3. contact shadows
4. relative scale
5. light separation
6. material response
7. focus hierarchy
8. subtle atmosphere
9. optional limited parallax only after still frame works

## K. Live UI

Live UI stays semantic DOM and screen-aligned.

Desktop task region starts roughly 640–760px at 1366px width, then adjusts to real content.

Visual order:
1. Transfer Challenge title
2. current transfer state / phase
3. acting manager private context
4. three guess rows
5. opponent privacy/sealed state
6. primary action

No new behavior.

## L. Non-negotiable product truth

Transfer phases:
Window -> Guess Entry -> Signing Entry -> Completed/Verdicts.

Guess Entry occurs after transfer window close/advance.

No active 15-minute timer in Guess Entry.

Each manager edits only that manager's own private rival guesses.

Opponent cannot read those guesses before completion.

Up to three guesses.

Each completed guess:
League or Nationality + canonical value.

Primary action:
`LOCK MY GUESSES`

After lock:
acting manager waits for rival while guesses remain sealed.

Historical replay:
read-only and privacy-safe.

Error/recovery:
inline.

Manager 1:
Daniel / physical left.

Manager 2:
Nik / physical right.

## M. Material and typography

Near black / graphite:
structure.

Brass:
material accent.

Active gold:
priority.

Strongest gold:
primary action.

Secondary gold:
selected phase/task.

Do not make roof, borders, text, faces and separators equally gold.

Typography:
- condensed short display voice
- regular-width readable form text
- maximum two font families
- display energy only in display roles
- 16–18px desktop form values
- 16px minimum mobile form values

## N. Mobile

390x844 is not a miniature desktop.

Need:
- compact shell
- short human/identity scene region
- explicit Daniel/Nik identity
- one meaningful spatial cue
- one-column task
- comfortable touch targets
- 16px+ form values
- allow legitimate scrolling
- collapse/freeze scene during software keyboard if necessary

Do not repeat prior V10 mobile pattern:
both people disappear + long empty stadium tail.

## O. Technical direction

Preferred starting implementation:
`layered 2.5D + semantic DOM + small presentation controller`

Product logic owns:
- phase
- privacy
- validation
- scoring
- save/network authority
- timer authority

Presentation may choose:
- scene family
- crop
- emphasis
- decorative transition policy

Presentation never writes game state.

## P. Current approved assets to inspect

- POSE_TRANSFER_DANIEL_FOCUSED_V1.png
- POSE_TRANSFER_NIK_TACTICAL_V1.png
- ENV_STADIUM_WARM_BASE_V1.webp

Their approval does not guarantee C2 compatibility.

Classify each:
- FIT
- FIT WITH LIMITS
- ASSET BLOCKER

If blocker:
state exact issue:
camera, crop, eyeline, light direction, prop contact, alpha, perspective or mobile use.

Do not generate replacements.

## Q. Current workflow while Astra is constrained

1. Claude performs COV-01 read-only focused review.
2. GPT-5.6 Sol reconciles findings.
3. Existing assets are audited against C2.
4. If provisionally ready, Sol may build one provisional desktop/mobile frame.
5. Candidate remains PROVISIONAL_ASTRA_REVIEW_PENDING.
6. Claude may independently red-team the provisional frame.
7. Sol freezes accepted/rejected deltas and evidence.
8. Astra later re-enters with compact packet.
9. Nik makes final taste call.

## R. COV-01 goal

Question:
Did GPT-5.6 Sol correctly convert Astra's FIFA 17 / The Journey research into a sufficiently precise SV01 C2 Decision Desk specification to justify a provisional golden-frame build?

Review:
- camera
- place
- Daniel/Nik relationship
- task-surface support
- lighting
- hierarchy
- typography/material
- mobile
- build readiness
- asset fit
- dashboard/poster regression risk

Required verdict:
`PROVISIONALLY READY FOR GOLDEN FRAME`
or
`NOT PROVISIONALLY READY FOR GOLDEN FRAME`

This verdict is provisional.

## S. Branch safety

Visual work:
`visual/cinematic-system-v10`

Production:
`main` — read-only.

For COV-01 use detached visual branch if shell is available:

```bash
git fetch origin
git switch --detach origin/visual/cinematic-system-v10
```

No commits.
No PR.
No image generation.
No implementation.

## T. Quality philosophy

The still frame must already communicate:
- where am I?
- who are the rivals?
- what am I doing?
- what matters next?

More glow, particles or animation cannot substitute for those relationships.

Nik's owner judgment is the final visual calibration.

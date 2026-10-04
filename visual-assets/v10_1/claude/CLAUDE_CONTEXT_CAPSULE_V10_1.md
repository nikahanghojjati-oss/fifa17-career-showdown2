# CLAUDE OPUS 5.5 — CONTEXT CAPSULE V10.1

This file exists so Claude can become useful quickly without ingesting the entire historical Showdown archive.

## Project

Career Mode Showdown is a private two-manager football career competition.

Manager 1: Daniel
Manager 2: Nik

Current visual work is isolated from production.

Production repository:
`nikahanghojjati-oss/fifa17-career-showdown2`

Visual branch:
`visual/cinematic-system-v10`

Current recorded `main`:
`f077b9c5be5e4d5bf5ef17b2d219983dbf142962`

## Current visual problem

The first V10 SV01 Transfer Guess Entry candidate was owner-rated 7/10.

Strengths:
- black/gold identity;
- clear task;
- approved Transfer-specific manager poses;
- stadium atmosphere;
- privacy distinction;
- primary action hierarchy.

Weaknesses:
- task board appears insufficiently supported in space;
- Daniel and Nik read as isolated poster figures rather than co-present people;
- eye heights / footing / shared surface are ambiguous;
- stadium and characters are not unified by one camera/light model;
- roof lighting competes with the task;
- near foreground does not establish enough contact/perspective;
- mobile removes both people and leaves too much stadium tail;
- some helper typography becomes too small.

Owner calibration, not the old internal 93/100 score, is the quality truth.

## Astra research that now governs V10.1

FIFA 17 contributes:
- strong rectangles;
- unequal hierarchy;
- obvious active states;
- condensed sporting headings;
- stable navigation skeleton;
- readable flat UI.

The Journey contributes:
- inhabited place;
- specific room;
- human viewpoint;
- camera chosen for activity/relationship;
- purposeful character eyelines;
- environmental depth;
- material/light coherence;
- consequence tied to people and place.

Key synthesis:
The interface can remain flat and screen-aligned over a dimensional environment.

Do not make every control diegetic.
Do not tilt inputs to pretend they are real paper.

## V10.1 presentation modes

Orientation:
- where are we / what next?
- more world, wider frame.

Decision:
- what must I do now?
- task dominant;
- closer camera;
- quieter world.

Consequence:
- what happened / what follows?
- confirmed result/object dominates;
- human/world response supports.

SV01 Guess Entry is Decision.

## SV01 C2 Decision Desk

Target:
- stadium operations room;
- 40–50 mm visual equivalent;
- medium environmental frame;
- near-level working eye height;
- real architectural threshold to stadium;
- work surface/display housing;
- near foreground edge;
- purposeful Daniel/Nik relationship;
- one coherent lighting model;
- sharp live task UI.

The board cannot float.
The figures cannot look pasted in.
The stadium cannot be only decorative wallpaper.

## Depth order

P0 far stadium
P1 threshold/window/beam
P2 room/desk/chair
P3 characters/neutral props
P4 near object/desk lip/display housing
P5 live task UI
P6 shell/status

These are conceptual bands, not a requirement for seven image files.

Static depth priorities:
1. perspective agreement
2. occlusion
3. contact shadows
4. relative scale
5. light separation
6. material response
7. focus hierarchy
8. subtle atmosphere
9. optional limited parallax

## Visual material

Near-black and graphite carry mass.
Brass is material accent.
Active gold is priority.

Use:
- natural skin;
- cool-neutral ambient;
- warm practical/key accent;
- restrained rim light;
- matte graphite;
- believable glass/metal only where needed.

Do not gold-tint everything.

## Mobile

390x844 is a separate composition.

Need:
- compact shell;
- short human/identity scene region;
- explicit Daniel/Nik identity;
- one meaningful spatial cue;
- 16px+ form values;
- comfortable touch targets;
- one-column task;
- allow scroll;
- scene can collapse/freeze for software keyboard.

Do not remove all human identity and leave a long stadium tail.

## Approved assets currently relevant

- `POSE_TRANSFER_DANIEL_FOCUSED_V1.png`
- `POSE_TRANSFER_NIK_TACTICAL_V1.png`
- `ENV_STADIUM_WARM_BASE_V1.webp`

They are approved for their existing roles but are not automatically guaranteed to fit the new C2 camera.

If they fail:
report a precise asset blocker.
Do not substitute Home poses.
Do not generate replacements.

## Technical direction

Preferred first implementation:
`layered 2.5D + semantic DOM + small presentation controller`

Live product state stays in existing product logic.

Presentation may choose:
- scene family;
- crop;
- emphasis;
- optional decorative transition policy.

Presentation may not own:
- phase;
- privacy;
- timer;
- validation;
- scoring;
- save authority;
- network authority.

## Quality test

A still frame must answer in roughly five seconds:
- where am I?
- who are the rivals?
- what am I doing?
- what matters next?

The new work must be visibly better than the owner-rated 7/10 baseline.

No self-assigned score can substitute for Nik's judgment.

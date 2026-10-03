# SHOWDOWN VISUAL PRESENTATION SYSTEM V3

Status: ACTIVE EXPERIMENTAL AUTHORITY FOR VISUAL PROPOSALS
Owner: Nik
Art director: Sol
Implementation worker: Luna
Production main: untouched

## Why V3 exists

V2 became good at deciding which assets exist and which assets belong to a screen. It did not solve the presentation-layer problem strongly enough.

The current SV01 candidate proves the gap:

- correct Transfer-specific Daniel and Nik assets can still sit inside a visually generic composition;
- the correct stadium asset can be present but visually suppressed by overlays;
- prose such as "cinematic", "black/gold", or "war-room" does not reliably produce the approved Home / League / Club family;
- if Luna rebuilds typography, background, shell, panels and geometry from scratch, the implementation drifts even when the asset choices are correct.

V3 therefore moves the shared visual language out of prose and into reusable presentation code.

## Root-cause model

PRIMARY CAUSE
The implementation contract has been under-specified at the code-primitive level.

V2 says WHAT to use.
V3 must also define HOW the shared product language is rendered.

SECONDARY CAUSE
Luna is reliable at bounded HTML/CSS implementation but not reliably strong at synthesizing a premium visual system from abstract art-direction language.

Therefore:
Sol authors the presentation system and screen composition.
Luna assembles exact primitives and implements states.

## Evidence from approved work

The strong R8 Home / League / Club proposals share concrete mechanics:

- visible stadium architecture rather than a nearly black backdrop;
- explicit light arcs / crowd / grass / vignette layers;
- stable black/gold top chrome;
- consistent condensed functional typography;
- large skewed condensed display title treatment;
- script used only for personality accents;
- page-specific dominant objects such as the wheel and sealed packs;
- edge characters staged around a central interaction-safe zone;
- high-density angular surfaces with gold hierarchy rather than generic rounded cards.

The weak SV01 candidate instead:
- darkens the stadium with stacked overlays until most environment detail disappears;
- uses Georgia italic for the hero title;
- introduces a new minimalist top shell rather than the established product chrome;
- recreates panel and control grammar independently;
- asks the characters to provide most of the cinematic quality while the center remains a dark form.

## New architecture

V3 adds a real PRESENTATION RUNTIME for proposals:

1. CM17 CINEMATIC SHELL
   shared stadium/world, top chrome, footer, edge vignette and light behavior.

2. TYPOGRAPHY SYSTEM
   locked display / functional / personality stacks and treatments.

3. MATERIAL SYSTEM
   shared graphite, gold, glass, tactical surface and CTA primitives.

4. CHARACTER STAGE
   fixed layering, safe zones, glows and screen-specific hero slots.

5. SCREEN-SPECIFIC DOMINANT OBJECT
   wheel, packs, transfer operations board, score confrontation, trophy, etc.

6. RESPONSIVE RECOMPOSITION
   explicit desktop / tablet / mobile behavior.

## Non-negotiable rule

Luna must not create a new presentation language per screen.

Every major screen starts from the V3 primitives plus one Sol-authored screen composition.

If a primitive is missing, Sol adds the primitive.
Luna does not invent a substitute visual system.

## Next experiment

SV01 should not receive another prose-only refinement.

Sol should first provide:
- V3 shared CSS primitives;
- a locked Transfer composition map using those primitives;
- exact environment exposure levels;
- exact typography classes;
- exact panel classes.

Then Luna performs a constrained integration pass.

That pass is a stronger test of Luna's actual front-end value.

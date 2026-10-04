# SV01 V10.1 — C2 BLOCKING ADDENDUM

Status: ACCEPTED FOR PROVISIONAL GOLDEN-FRAME BUILD
Date: 2026-09-27
Source product anchor: `main@f077b9c5be5e4d5bf5ef17b2d219983dbf142962`
Visual authority branch: `visual/cinematic-system-v10`
Owner baseline: prior V10 candidate = 7/10
Image generation: LOCKED

This addendum resolves COV-01 M1–M7 and records the two owner decisions required to unblock the provisional build.

## Owner decisions

### N1 — Daniel / Nik positioning
ACCEPTED RECOMMENDATION:
"Daniel left / Nik right" means Daniel remains visually left of Nik as a pair. It does not require Daniel to occupy the left 50% of the viewport and Nik the right 50%.

The pair may shift together to support a stronger composition, provided:
- Daniel remains left of Nik;
- identity labels move with the figures;
- no state variant reverses their order.

### N2 — Operations-room build method
ACCEPTED RECOMMENDATION:
The provisional golden frame may use a deterministic CSS/SVG-built operations room and display housing.

No new environment image is authorized for the provisional build.

Any CSS/SVG fidelity limitation must be recorded in the build notes. Image generation remains locked.

## M1 — Camera anchors

Keep 40–50 mm as art-direction intent only.

Desktop 1366×768 acceptance anchors:
- standing working eye height;
- one horizon at y 300–360;
- both managers' eyes within ±10 px of that horizon;
- one vanishing point on the horizon with x in the middle third: 455–910;
- architectural verticals within ±1° of vertical;
- crown-to-chin head height: 90–130 px;
- Daniel/Nik head-height ratio: 1.00–1.10.

Both managers share one floor plane. Scale differences may come only from believable depth.

## M2 — Room and display layout

Use the following front-to-back composition:

P4 near object:
- standing-height console;
- front edge parallel to picture plane;
- console top edge approximately y 600–660 at 1366×768.

P5 live display:
- monitor mounted on the console's near edge;
- display face parallel to picture plane;
- live semantic DOM remains screen-aligned;
- bezel/sides may recede toward the single vanishing point;
- visible stand/foot with contact shadow on console top.

P3 managers:
- Daniel and Nik stand behind the console;
- console hides both at or below belt line to match approved asset crops.

P1 threshold:
- glass back wall with mullions and visible reveal thickness.

P0 far world:
- approved stadium plate visible only through the glass.

Room elevation:
- pitch-level, glass-fronted room beside the tunnel;
- stadium horizon aligned to room horizon within ±8 px;
- stadium and room vanishing points aligned within ±16 px.

Remove:
- desk-integrated-screen option;
- angled/two-point display housings around live UI.

Room materials may be built in CSS/SVG for this provisional frame.

## M3 — Privacy-safe eyelines

Replace any converging-eyeline instruction.

Each manager attends to his own private device:
- Daniel: clipboard;
- Nik: tablet.

The live display is the viewer's operating surface.

No rival gaze vector may terminate on the live display.

Device faces contain no readable/private content.

The shared relationship comes from one room, one console, one horizon and one lighting system: parallel private work, not shared viewing.

## M4 — Right-weighted C2 composition

Adopt the right-weighted layout for the provisional frame.

At 1366×768:
- live display occupies approximately the right 55% of the frame, beginning around x 560 and extending toward x 1320;
- Daniel and Nik occupy the left/world region at similar depth;
- Daniel remains left of Nik;
- both natural screen-right gazes flow toward the task side without mirroring;
- keep at least 24 px between Nik's tablet and the display edge;
- no character art may overlap interactive hit areas.

## M5 — Fixed manager staging across states

Use one fixed manager layout across all SV01 states.

Do not change position, scale or pose to indicate acting manager.

Acting-manager emphasis may use only:
- live panel identity/header treatment;
- up to 10% key-light lift on the acting manager;
- optional slight rival defocus while preserving recognition.

Golden-frame primary state:
- Nik editable;
- three empty rows.

State variants must preserve the same character geometry.

## M6 — Lighting direction

Key:
- warm;
- camera-right;
- frontal-high;
- motivated by a practical light or the right-side display region.

Backlight:
- stadium glass directly behind each manager silhouette;
- dark wall directly behind a manager is forbidden.

Behind live display:
- darker / lower-contrast wall or mullion zone.

Ambient:
- cool-neutral room surfaces.

Characters:
- at most one shared colour-match treatment;
- no glow / outer-glow filters.

Highlight hierarchy:
- no stadium-plate highlight may exceed the lock-button fill luminance;
- no bright stadium highlight within 48 px of the display edge.

## M7 — Mobile identity

At 390×844:
- top bar: 52–60 px;
- directly below it, one continuous 150–200 px scene region;
- both Daniel and Nik faces visible;
- each head at least 56 px tall;
- Daniel left, Nik right;
- one continuous crop and one horizon;
- no avatar-tile substitute;
- include one spatial cue such as a glass mullion or console edge;
- names sit adjacent to the faces;
- live task begins within 300 px of the top.

Do not remove both managers.

## R1 — Decision allocation / title attachment

Desktop usable-width target:
- UI: 55–65%;
- world: 35–45%.

Use:
- 12-column composition;
- 24–32 px outer margins;
- 8 px spacing rhythm;
- top bar 56–64 px.

Scene title attaches to the task region with gap ≤24 px.

At short heights, reduce scenic margins before shrinking functional text.

## R2 — Minimum type sizes

Essential privacy/instruction text:
- 14–16 px, sentence case.

Labels:
- 12–14 px.

Metadata:
- 10–12 px only when non-essential.

Utility label tracking:
- ≤0.08 em.

Form values:
- 16–18 px desktop;
- ≥16 px mobile.

## R3 — Gold budget / stadium grade

Largest active-gold area:
1. LOCK MY GUESSES button.
2. Selected phase/task.

Scene title:
- warm white rather than dominant gold.

Baked rims, stadium gold crowd detail and roof lights count against the warm-highlight budget.

Cool/desaturate the stadium plate by approximately 15–30% behind glass if needed to preserve task priority.

## R4 — Production copy and real states

Bind to current production copy and states.

Use:
- `GUESS ENTRY · YOUR RIVAL CANNOT SEE THESE BEFORE COMPLETION`
- `YOUR GUESSES ARE LOCKED · WAITING FOR YOUR RIVAL`
- `HISTORICAL REPLAY · PRIVATE GUESS ENTRY`

Privacy copy:
- `Shared privacy: enter only your guesses. Your rival cannot read them until both managers complete the challenge.`

Value-field dependency:
- disabled until type chosen;
- placeholder: `Choose League or Nationality first`;
- after type selection use real production search placeholder.

Include real `busy` pending state:
- lock action disabled while request is in flight.

Do not display `SHARED SESSION ACTIVE` unless bound to a real state and worded so it does not imply the rival is online.

## R5 — Mobile keyboard / flow

For the provisional frame:
- do not script-collapse scene on focus;
- allow the scene to scroll away naturally;
- keep names available in compact top-bar identity treatment where appropriate;
- lock button remains in normal document flow, not sticky;
- end page within 48 px of privacy/action content;
- no scenic tail below the functional ending.

## R6 — CSS/SVG room fidelity

Allowed provisional room language:
- matte graphite console;
- one 2–3 px brushed-brass front edge;
- acoustic-panel or board-formed-concrete back wall;
- glass with one restrained soft reflection band;
- mullions with visible depth;
- fine grain/noise to harmonize with photographic assets;
- contact shadows under display foot and at console/glass junction.

Forbidden:
- generic flat vector room fills;
- glowing room borders;
- decorative bevel gradients.

## R7 — Provisional golden-frame acceptance

Primary state:
- Nik editable;
- three empty rows.

Optional supporting state:
- one completed row.

Required viewports:
- 1366×768;
- 390×844.

Still-frame test:
- with glows removed / desaturated, threshold, console edge and both managers remain separable planes.

Salience:
- in squint/blur test, LOCK MY GUESSES is the most salient warm region.

Record:
- horizon;
- manager eye-line delta;
- vertical-line delta;
- stadium/room horizon delta;
- candidate SHA-256.

Owner comparison:
- present the new frame against the exact 7/10 baseline.
- owner judgment overrides internal numeric scores.

## Build authorization boundary

This addendum authorizes one isolated provisional golden-frame implementation on a dedicated visual task branch.

Status of that build must be:
`PROVISIONAL_ASTRA_REVIEW_PENDING`

It does not authorize:
- merge to production main;
- image generation;
- product-behavior changes;
- permanent visual promotion.

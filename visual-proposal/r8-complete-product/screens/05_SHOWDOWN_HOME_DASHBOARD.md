# Screen 05 — Showdown Home / `dashboard`

Status: ACTIVE SCREEN CONTRACT — RECONCILED THROUGH r13 MULTI SEASON

Source anchor: current `main` at `ea96ff1280b5e63962b7ee1a6a8c0980fe4e3686` (`1.9.1-r13`).

## Purpose

Showdown Home is the live rivalry command center. Competition state and the next actionable step are the visual hero; character art is not.

## Current product structure to preserve

The current routed DOM includes:

- Showdown name;
- league;
- current season/round;
- overview status;
- Transfer Challenge status;
- overall rivalry score;
- series status chip;
- last-season summary when available;
- equal Manager 1 and Manager 2 cards with permanent clubs;
- current/previous position state;
- one primary season progression action;
- Private Remote Joining action;
- Back to Main Menu.

No R8 presentation may duplicate score, season, transfer, Multi Season or Remote Joining authority.

## Information hierarchy

1. Showdown name, league and active-season status.
2. Overall rivalry score and series state.
3. Equal manager/club cards.
4. Current season / Transfer Challenge state.
5. Primary next action.
6. Private Remote Joining when eligible.
7. Last-season summary and secondary navigation.

The scoreboard is the hero. Large decorative portraits are intentionally omitted by default.

## Visual treatment

Use a Level A competition shell with a large, high-contrast score module centered between equal manager sides. Gold may indicate current emphasis or a product-confirmed leader but must never invent a winner state.

Manager cards use mirrored geometry with equivalent dimensions and information weight. Manager 1 maps to Daniel and Manager 2 maps to Nik in canonical proposal examples, while live manager/club names remain DOM text.

The season primary action receives the strongest action treatment. Private Remote Joining remains visible but secondary so connection tooling does not overtake core Career Mode progression.

Last-season summary is a compact contextual module rather than a second scoreboard.

## r13 Multi Season interaction

Shared Multi Season progression remains owned by the Season Results review runtime. When that runtime authoritatively advances its local exposed season cursor and returns the user to Dashboard, Dashboard must simply present the newly resolved active season through existing product state.

R8 therefore must:

- visually accommodate Season 2–10 labels without layout breakage;
- keep the fixed manager/club identity stable across seasons;
- make the current active season unambiguous;
- show the normal next Transfer Challenge / Season Results action for the active season according to product authority;
- never add a separate R8 season selector, next-season counter, or local progression state;
- avoid implying that the previous season can be edited merely because its last-season summary remains visible.

The current multi-season continuation flow intentionally returns to the canonical Dashboard; the proposal preserves that orientation point rather than inventing a dedicated inter-season screen.

## State family

Cover at minimum:

- newly created Showdown / no season completed;
- Transfer Challenge not started;
- Transfer Challenge active/incomplete;
- ready for Season Results;
- season completed / next season available through authoritative shared progression;
- Season 2–10 active states;
- terminal Showdown season plan complete;
- last-season result visible;
- shared/private-session eligible;
- reconnecting or unavailable connection state if surfaced;
- reduced motion.

## Asset resolution

Required roles from the matrix:

- rivalry score banner: DOM/CSS geometry;
- competition-status modules: DOM/CSS;
- club identity frames: original CSS/procedural shapes, no official crests;
- challenge/season progression treatment: DOM/CSS;
- Chromebook/mobile character-free state: intentional design decision.

No new raster image generation is required.

## Responsive contract

Wide desktop may place manager cards on either side of the central scoreboard.

Reduced wide keeps the scoreboard first and compresses decorative spacing before data.

Chromebook/tablet stacks overview, score, manager cards and actions so the primary action remains within a practical scroll distance. No hero image is allowed to consume viewport height.

Mobile uses a readable vertical command-center order: overview, score, manager comparison, status, primary action, Remote Joining, secondary navigation.

Season labels up to `SEASON 10 OF 10` must remain readable at every tier without forcing horizontal overflow.

## Accessibility and QA

- score meaning is available through text, not position/color alone;
- manager sides are labeled explicitly;
- leader/winner styling only appears when product authority supports it;
- current season is communicated as text;
- status chips remain text-readable;
- focus remains visible on primary action, Remote Joining and Back;
- no decorative layer overlaps current score, state or actions;
- reduced motion does not delay state updates;
- no public/global ranking language is introduced;
- multi-season return to Dashboard does not create duplicate progression controls.

## Final-main reconciliation

At final-main checkpoint, re-read Dashboard state logic and any new shared-play indicators. Journey Reconnect and later reconciliation capabilities may add visible state around this orientation point; if they do, add them without displacing the core competition hierarchy unless the final product owns a genuinely higher-priority action.
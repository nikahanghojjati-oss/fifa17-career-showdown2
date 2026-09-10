# Screen 05 — Showdown Home / `dashboard`

Status: ACTIVE SCREEN CONTRACT

Source anchor: current `main` at `cef2e101f23fd8cb777f71950bac8f0f8d9f2c7b`.

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

No R8 presentation may duplicate score, season, transfer or Remote Joining authority.

## Information hierarchy

1. Showdown name, league and season status.
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

## State family

Cover at minimum:

- newly created Showdown / no season completed;
- Transfer Challenge not started;
- Transfer Challenge active/incomplete;
- ready for Season Results;
- season completed / next season available;
- terminal Showdown complete;
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

## Accessibility and QA

- score meaning is available through text, not position/color alone;
- manager sides are labeled explicitly;
- leader/winner styling only appears when product authority supports it;
- status chips remain text-readable;
- focus remains visible on primary action, Remote Joining and Back;
- no decorative layer overlaps current score, state or actions;
- reduced motion does not delay state updates;
- no public/global ranking language is introduced.

## Final-main reconciliation

At final-main checkpoint, re-read Dashboard state logic and any new shared-play indicators. Preserve the hierarchy above unless the final product adds a genuinely higher-priority user action.
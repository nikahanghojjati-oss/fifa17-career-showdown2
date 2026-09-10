# Screen 08 — Season Summary / `seasonSummary`

Status: ACTIVE SCREEN CONTRACT

Source anchor: current `main` at `cef2e101f23fd8cb777f71950bac8f0f8d9f2c7b`.

## Purpose

Season Summary is the post-season ceremony. It may be visually richer than data-entry screens, but earned outcome and overall Showdown state remain product authority.

## Current routed structure

Preserve:

- Season Summary heading;
- season result/winner text;
- two manager summary cards;
- overall Showdown score;
- Next Season / next Transfer Challenge action when applicable;
- Showdown Home action.

R8 may style the outcome but may not recalculate it.

## Visual hierarchy

1. Product-authoritative season result.
2. Equal manager summary cards and scoring breakdown.
3. Overall Showdown score.
4. Next progression action or terminal completion treatment.
5. Showdown Home navigation.

A true winner may receive elevated gold framing. A draw remains symmetrical. The losing side remains fully readable and is not visually erased.

## Celebration policy

No new celebration raster is currently justified.

A01/A02 are strategic/neutral approved masters, so the default final composition remains character-free. At final-main reconciliation, a wide-only celebration role may be reconsidered only if the exact DOM provides clear safe space and a bounded pre-generation brief proves a new asset is necessary.

Short procedural light/confetti accents are allowed only for actually earned outcomes and must disappear in reduced-motion mode.

## State family

- Manager 1 season win;
- Manager 2 season win;
- draw;
- overall score tied after the season;
- next season available;
- final season / Showdown complete;
- reduced motion;
- any shared authoritative completion status exposed by final product.

Canonical promotional examples preserve Manager 1 = Daniel and Manager 2 = Nik.

## Asset resolution

- winner/draw banner: DOM/CSS;
- canonical scoring breakdown card: DOM/CSS;
- trophy/achievement icon family: original SVG only where scanability benefits;
- continue/terminal-state treatment: DOM/CSS;
- celebration composition: intentionally deferred and not currently required.

No new image generation at this stage.

## Responsive contract

Wide desktop may use a central result banner with two side-by-side manager summary cards.

Reduced wide keeps the result and overall score dominant while removing nonessential light effects first.

Chromebook/tablet and mobile stack summary cards with result first, overall score next and progression actions clearly visible. No celebration art may push progression below the useful viewport.

## Accessibility and QA

- winner/draw appears in real text;
- score and breakdown remain readable without gold color cues;
- achievement icons never replace text labels;
- focus remains visible on Next Season and Showdown Home;
- reduced motion removes confetti/sweeps immediately;
- no winner styling appears before product authority resolves the season;
- no extra-hand/anatomy risk is introduced because no new character art is currently required.

## Final-main reconciliation

Re-read final Season Summary and terminal Showdown behavior before senior handoff. Only reopen celebration generation if final product structure proves a specific unmet role and all existing procedural/character-free solutions have been exhausted.
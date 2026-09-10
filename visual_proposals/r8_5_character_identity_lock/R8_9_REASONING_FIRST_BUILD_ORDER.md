# R8.9 Reasoning-First Build Order

Status: ACTIVE VISUAL PROPOSAL / NON-OPERATIONAL

Source pin at creation: `1d0c9f9d6542cd020a4aae53998cb6daeba380e4` / `1.9.1-r10`.

## Core operating rule

The reasoning model leads the visual project. Image generation is a specialist step, not the default response to an uploaded image or a general instruction to continue building.

An uploaded reference image means: study it, classify it, update visual truth if appropriate, and continue the current roadmap. It does NOT automatically authorize a new generation.

A generation call is allowed only when all four are true:

1. The current runtime map proves a specific asset is needed.
2. The existing approved asset set cannot already satisfy that need.
3. The exact target, reuse destinations, safe zones and identity/style authority are already defined.
4. Generation is the best implementation method compared with CSS, SVG, procedural art, deterministic crop/mask, or reuse.

If any condition is false, do not generate.

## What "continue building" means

Continue building means advance the complete UI/UX proposal through the next justified work item. Depending on project state, that may be repository study, live-runtime reconciliation, DOM mapping, layout specification, responsive rules, asset reuse planning, accessibility review, deterministic prototype work, image generation, visual QA, or master-developer handoff packaging.

It never means "generate another image because an image was uploaded."

## Current build order

### Package 1 — Global shell and flagship presentation

Surfaces: Startup, Home, shared top-level visual language.

Work before new generation:

- define exact black/gold design tokens
- define typography hierarchy using available/free fonts only
- define top header and bottom product-strip behavior
- define character safe zones for desktop/tablet/mobile
- define menu tile depth, focus/hover states and selected-state treatment
- preserve current media controls and startup status semantics
- choose which existing approved character anchors can be reused without regeneration

Generation gate: CLOSED until exact DOM composition proves a missing asset.

### Package 2 — Setup journey

Surfaces: Create Showdown, Private Pairing, Shared Career Length, Shared Review/Confirm, League Wheel, Club Assignment, Shared Career Start.

Work before new generation:

- preserve pairing-first shared flow
- keep real form controls and five-league wheel authoritative
- preserve real `SPIN WHEEL` button below the wheel
- preserve sealed-pack reveal progression and permanent club-lock messaging
- define manager left/right mirrored placement without covering form/wheel/pack controls
- unify Shared Setup status language visually without creating fake replacement screens

Generation gate: mostly CLOSED. Existing approved core character anchors should be tested first. Club-pack interaction poses remain conditional only.

### Package 3 — Season loop and competitive states

Surfaces: Showdown Home/Dashboard, Transfer Challenge, Season Entry, Shared Season Results, Shared Season Commit, Season Summary, Tiebreak.

Work before new generation:

- make scoreboard, season progress and action hierarchy primary
- preserve the real 15-minute Transfer Challenge and locked entry phases
- preserve Shared Results as a stateful adaptation of `#seasonEntry`
- preserve Season Commit as an additional state/action on the existing review surface
- define celebration payoff without covering score/result data

Generation gate: OPEN only for tactical and celebration character masters after exact composition need is demonstrated. Required candidates remain A03-A06; do not create extra expressions.

### Package 4 — Records, utility and recovery surfaces

Surfaces: Statistics, Trophy Room, Legacy, Rule Book, Save Library, Settings, Restore/Recovery, Connected Rivalry, global notices.

Work before new generation:

- data and readability first
- use procedural/CSS/SVG visual polish before raster generation
- preserve Save Library local-authority messaging
- preserve Connected Rivalry explicit preview/apply and error states
- maintain warning/success/locked/offline/reconnect contrast and focus visibility

Generation gate: CLOSED by default. Trophy/cabinet atmosphere may become conditional only if CSS/procedural treatment cannot reach target quality.

### Package 5 — Responsive and handoff proof

Work:

- desktop safe-zone proof
- tablet crop proof
- mobile omission/fade proof
- keyboard/focus/contrast review for all real controls
- verify final-art layer stays non-interactive
- verify no visual layer changes storage, Firebase, pairing, scoring, save or runtime authority
- prepare master-developer implementation instructions against then-current main

Generation gate: CLOSED. This package should consume already-approved assets.

## Image/reference classification rule

Tier 0: owner-approved CM17 AI identity references. Highest visual authority.

Tier 1: approved deterministic face crops and approved AI screen references. Used for identity/style/pose evidence.

Tier 2: real photos supplied by owner. Used only for geometry, gaze, muscle behavior, angle and expression evidence. Never shipping assets.

Tier 3: generated candidates. Non-authoritative until owner approval.

When a new image arrives, first classify it into a tier and record what it changes. If it only adds evidence, update the evidence pool and keep working. Do not automatically generate.

## Prototype rule

Prototype work may use rough placeholders, silhouettes or imperfect face mockups when the purpose is layout/safe-zone validation. A rough prototype is not an identity regression because it is explicitly non-final and cannot be promoted as a character master.

Final character assets, however, must use the locked identity workflow and require explicit owner approval.

## Progress accounting

Only count meaningful progress when one of these advances:

- live runtime/screen truth becomes more complete
- reusable design system becomes more implementation-ready
- a required asset is approved/frozen
- a mapped screen gets an exact DOM composition specification
- responsive/accessibility/obstruction QA is completed
- master-developer handoff becomes more actionable

Do not count random image generations, duplicate concepts, or rejected identity refinements as positive production progress.

## Immediate next task

Do not generate another character image now.

Next build task is to produce the exact-DOM presentation specification for Package 1 and Package 2 using current `index.html`/runtime authority: define CSS layers, spacing hierarchy, safe zones, responsive behavior, reusable approved-character placements, and where art must yield to controls. Only after that specification identifies a genuine missing asset may the image generator be invoked.

This file intentionally replaces the previous implicit assumption that asset generation is always the next safe action.
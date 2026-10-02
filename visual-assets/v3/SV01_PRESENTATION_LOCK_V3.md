# SV01 PRESENTATION LOCK V3

This file replaces prose-only visual refinement for the next Transfer pass.

## Shared runtime

Use:
- visual-assets/v3/cm17-presentation-primitives.css
- the existing approved Transfer assets
- the existing SV01 product/state contract

## Required V3 primitives

The proposal must use these classes directly or reproduce them byte-for-byte inside the standalone HTML:

ENVIRONMENT
- cm17-world
- cm17-light-arc
- cm17-crowd
- cm17-grass
- data-environment="transfer"

SHELL
- cm17-topbar
- cm17-brand
- cm17-session

TYPOGRAPHY
- cm17-kicker
- cm17-display
- cm17-subtitle
- cm17-functional
- cm17-personality for manager signature only

MATERIALS
- cm17-panel
- cm17-panel-title
- cm17-cta
- cm17-phase-rail / cm17-phase

CHARACTERS
- cm17-hero + cm17-hero-glow

## Desktop composition

At 1366x768:
- topbar 64px
- title center around y=78–160
- Transfer hero characters occupy edge thirds, not center
- center interaction-safe zone approximately x=330–1036
- stadium light arc and crowd remain clearly visible around/behind the central board
- central board width 650–740px
- board cannot become a flat rectangle covering most of the environmental story
- CTA is integrated under the board and visible without scroll

## Visual hierarchy

1. Transfer Challenge display title
2. Window Closed / Guess Entry state focal plaque
3. active three-row guess board
4. sealed rival/private strip
5. Lock My Guesses CTA
6. secondary manager identity / decorative detail

## Typography

No Georgia / Bookman / editorial-serif display title.

The title must use the V3 display primitive.

Functional labels use the V3 condensed stack.

## Environment exposure

The approved stadium/environment must remain visibly legible.

Do not exceed:
- roughly 0.56 bottom darkening in the main center area
- roughly 0.72 edge vignette

Do not stack multiple independent dark overlays that effectively erase the stadium.

## Mobile

At 390x844:
- hero art hidden
- world remains visible in upper and lower breathing zones
- no giant empty black lower half
- same display/functional typography system
- task board remains primary
- CTA visible
- no horizontal overflow

## Failure conditions

REJECT if:
- background reads mostly black rather than stadium/war-room
- title uses a new font system
- shell looks like a different app
- panel grammar is generic/rounded/SaaS
- exact Transfer heroes are missing
- mobile becomes a plain black form
- Luna creates replacement presentation primitives instead of using V3

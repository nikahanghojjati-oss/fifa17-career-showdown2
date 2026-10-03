# SHOWDOWN VISUAL — ENVIRONMENT VARIANT SYSTEM V1

## Goal

Keep the same Career Mode Showdown world while giving each screen family a distinct mood, energy, lighting and staging.

Do not create a totally new stadium for every page by default.

Use:
`BASE STADIUM + LIGHTING RECIPE + SCREEN OVERLAYS + OPTIONAL HERO ENVIRONMENT`

This preserves visual continuity and reduces unnecessary generation.

## Environment layers

1. BASE
   - reusable stadium architecture/crowd depth
   - no live product text
   - no state-dependent timer/score

2. GRADE
   - CSS/image overlay controlling warmth, contrast, haze, vignette, brightness

3. PRACTICAL LIGHT
   - floodlight bloom, gold edge light, spotlight direction

4. DECORATIVE WORLD
   - flags, crowns, original CM17 motifs, generic rivalry banners
   - never bake live product state

5. SCREEN OBJECT
   - wheel glow, sealed-pack podium, scouting desk, trophy plinth, etc.
   - should usually be DOM/SVG/isolated asset so it remains reusable

## Recipes

### HOME_GOLDEN_RIVALRY
Energy: welcoming + competitive
Warmth: high
Contrast: medium-high
Crowd: visible
Haze: moderate
Gold bloom: broad
Banner language: rivalry / legacy
Screen object: title/trophy/action dock

### LEAGUE_SPOTLIGHT
Energy: decision / ceremony
Warmth: high
Contrast: high
Crowd: present but darker
Haze: low-moderate
Gold bloom: concentrated behind wheel
Screen object: wheel

### CLUB_PACK_CEREMONY
Energy: suspense / reveal
Warmth: high
Contrast: high
Crowd: darker
Haze: moderate
Gold bloom: object edges and pack podium
Screen object: sealed packs / VS

### TRANSFER_DEADLINE_WARROOM
Energy: urgent / tactical / secretive
Warmth: warm gold with deeper blacks
Contrast: very high
Crowd: secondary
Haze: restrained
Gold bloom: narrow practical desk/board light
Decor: scouting/tactical surface motifs
Screen object: operations board / phase status

### RESULTS_FLOODLIGHT
Energy: judgment / confrontation
Warmth: warm-neutral
Contrast: high
Crowd: stronger
Haze: moderate
Gold bloom: central scoring object
Screen object: score/trophy/scoring system

### RESULTS_CELEBRATION
Energy: triumphant
Warmth: highest
Contrast: medium-high
Crowd: bright
Haze/confetti: optional
Gold bloom: expansive
Screen object: trophy/winner

### STATS_NIGHT_ANALYTIC
Energy: analytical
Warmth: medium
Contrast: high
Crowd: subdued
Haze: low
Gold bloom: minimal and precise
Screen object: graphs/records

### TROPHY_GOLDEN_CEREMONY
Energy: prestige / legacy
Warmth: highest
Contrast: high
Crowd: subdued behind trophy
Gold bloom: centered on trophy
Screen object: cabinet/trophy

### RULES_PLAYBOOK
Energy: instructional but premium
Warmth: medium-high
Contrast: medium-high
Crowd: subdued
Haze: low
Gold bloom: separators/icons
Screen object: playbook/rule panels

## When to generate a new environment

Generate a new environment only when:
- the base stadium cannot support the screen's composition;
- a new camera angle is essential;
- the screen story requires a materially different space;
- CSS/SVG overlay would look artificial.

Otherwise reuse the base and grade it.

## New environment asset ticket

Every generated environment must specify:
- asset ID
- screen family
- camera angle
- horizon line
- empty safe zones for live UI
- light direction
- warmth/contrast/haze
- crowd density
- banner allowance
- forbidden readable live product text
- mobile crop feasibility
- whether it is BASE or SCREEN-SPECIFIC
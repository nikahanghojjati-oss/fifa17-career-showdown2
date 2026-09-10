# Screen 10 — Career Statistics / `careerStatistics`

Status: ACTIVE SCREEN CONTRACT

Source anchor: current `main` at `cef2e101f23fd8cb777f71950bac8f0f8d9f2c7b` and established identity-safe career analytics authority.

## Purpose

Career Statistics is the longitudinal analytics hub across completed Showdowns. It must distinguish stable manager identity from display labels and remain useful in empty and unresolved historical-identity states.

## Required current modes

The proposal covers:

- empty state;
- unresolved historical identity notice;
- overall career summary;
- career table;
- exactly-two-manager comparison when available;
- Career Leaders modules.

The visual track does not merge identities or calculate analytics.

## Current information families

Career summary includes established metrics such as:

- Completed Showdowns;
- Seasons Played;
- Career Points;
- Trophies Won.

Career table includes rank/order within the private local career data, Manager, Showdowns, Season W-D-L, Points and Trophies.

Manager comparison may include Showdown wins/win rate, season wins, career points, average/best season score, average league points/goals, perfect seasons, signings and released signings.

Career Leaders may include private/local categories such as Most Showdown Wins, Most Career Points, Most Trophies, Most Season Wins, Best Avg Season Score and Best Season Score.

These are private/local rivalry records. R8 must not present them as public/global rankings.

## Treatment

Use Level B information surfaces. One gold-highlight metric per card group is enough; avoid turning every numeric value into a glowing trophy treatment.

The career table uses dark/charcoal rows with high-contrast headers and clear manager labels.

Exactly-two-manager comparison uses symmetrical geometry. Canonical proposal examples preserve Manager 1 = Daniel and Manager 2 = Nik, but analytics identity remains product authority.

Career Leaders read as record cards or plaques, not a public leaderboard.

## Empty state

Use a clean original grid/record motif and plain text inviting the user to complete a Showdown. Do not invent sample data that could be mistaken for saved career history.

No character art is required.

## Unresolved identity state

This state is important but not destructive. Use a strong warning/attention panel explaining that historical records need identity resolution according to existing product authority.

Do not automatically suggest or visually imply that two identical display names are the same stable person.

## Asset resolution

- empty-state motif: procedural CSS/SVG;
- unresolved-identity notice: DOM/CSS;
- career table styling: DOM/CSS;
- manager comparison/leaders modules: DOM/CSS;
- character art: not required.

New raster generation: CLOSED.

## Responsive contract

Wide desktop may use summary cards above a full-width career table and side-by-side comparison modules.

Chromebook/tablet collapses summary cards and comparison groups before shrinking labels.

Mobile stacks cards and uses scroll-safe table handling or accurate row-card transformation. Stable IDs and long labels wrap without clipping.

## Accessibility and QA

- unresolved identity is not color-only;
- tables retain headers/associations;
- leader cards retain exact text values;
- no fake public ranking cues;
- empty state is distinguishable from loading/error;
- focus remains visible on any identity-resolution/navigation controls;
- no character art obscures dense information;
- reduced motion does not change data or state.

## Final-main reconciliation

At final-main checkpoint, re-read career analytics and identity-linking behavior. Add any new final metric or unresolved-identity state to this proposal without inventing analytics semantics.
# SHOWDOWN VISUAL COMPONENT GRAMMAR V3

## Purpose

This grammar converts the approved visual family into repeatable implementation primitives.

Luna should compose with these primitives before writing custom styling.

## Shared primitives

WORLD
- cm17-app
- cm17-world
- cm17-light-arc
- cm17-crowd
- cm17-grass

SHELL
- cm17-topbar
- cm17-brand
- cm17-context-nav
- cm17-session
- cm17-footer

TYPE
- cm17-kicker
- cm17-display
- cm17-subtitle
- cm17-personality
- cm17-functional

MATERIAL
- cm17-panel
- cm17-panel-title
- cm17-rule
- cm17-cta
- cm17-secondary

CHARACTER
- cm17-hero
- cm17-hero-glow

PROGRESS / TACTICAL
- cm17-phase-rail
- cm17-phase
- cm17-tactical-grid

## Rule: shared identity before screen invention

A new screen does not get a new:
- brand bar
- display font strategy
- panel material
- primary CTA style
- stadium world
unless Sol explicitly creates a new variant.

## Screen-specific work

Each screen gets only:
- composition coordinates
- dominant object
- exact character assets
- exact environment recipe
- state-specific live UI
- limited custom decorative layers

## Why this matters

The approved Home / League / Club family feels unified because the underlying presentation mechanics repeat while the dominant object changes.

The current weak SV01 drifted because it repeated the product state but re-invented the presentation mechanics.

V3 prevents that class of drift.

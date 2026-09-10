# Screen 13 — Rule Book / `ruleBook`

Status: ACTIVE SCREEN CONTRACT

Source anchor: current `main` at `cef2e101f23fd8cb777f71950bac8f0f8d9f2c7b` and current Rule Book content authority.

## Purpose

Rule Book is the competition handbook. It should be the calmest routed R8 surface: editorial, high-contrast and easy to scan, with scoring receiving the strongest information hierarchy.

## Current section model

The established handbook sections include:

01 Showdown Format

02 Match Play

03 Transfer Challenge

04 Scoring

05 Tiebreak

06 Version 1.0 Scope

R8 styles current product copy but does not silently rewrite rule authority. If historical Rule Book text is stale relative to final shipped connected features, the final reconciliation must flag that mismatch to the senior/main developer instead of inventing corrected semantics in the visual layer.

## Treatment

Use Level B black/charcoal editorial panels with a numbered gold section rail.

Screen title and section numbers may use compact uppercase display styling. Body copy uses ordinary readable sans-serif proportions, generous line height and constrained line length.

The Scoring section receives a dedicated high-contrast table/card because it is the most frequently referenced rule family.

## Scoring presentation locks

Where the current/final product Rule Book states canonical scoring, presentation must remain consistent with product authority:

- Champions League +5;
- league title +3;
- main domestic cup +1;
- 100 league points and/or 100 league goals combined bonus maximum +1;
- Top Scorer and/or Top Assist combined bonus maximum +1;
- maximum season score 11;
- only a 0–0 season uses league position then league points as tiebreakers;
- equal nonzero scores remain a draw.

The visual track does not calculate these values.

## Navigation and section hierarchy

Use native headings and anchors/current navigation behavior where present. A numbered section rail may visually orient the reader, but it must not create a second routing system.

On long pages, ordinary document scrolling is acceptable. Do not shrink body text or compress sections solely to keep the entire Rule Book above the fold.

## Asset resolution

- section-navigation/heading treatment: DOM/CSS;
- canonical scoring table treatment: DOM/CSS;
- optional rule icons: original SVG only if scanability testing proves useful;
- character art: not required;
- background illustration: not required.

New raster generation: CLOSED.

## Responsive contract

Wide desktop may use a narrow section rail beside the reading column.

Chromebook/tablet collapses the rail into compact numbered headings.

Mobile uses a single readable column. Scoring tables become scroll-safe or card-like without changing rule relationships. Long copy keeps comfortable line height and does not touch viewport edges.

## Accessibility and QA

- heading hierarchy remains semantic;
- scoring relationships remain understandable without icon/color cues;
- tables retain headers and associations;
- focus is visible on section links and Back/navigation controls;
- body text meets contrast requirements against every dark panel;
- no decorative motion is required;
- no proprietary font, FIFA screen copy asset or official competition graphic is introduced.

## Final-main reconciliation

Before senior handoff, compare the final Rule Book text against final product capabilities and current canonical scoring authority. Record stale copy as a product-content issue for the senior/main developer; do not hide it with visual styling.
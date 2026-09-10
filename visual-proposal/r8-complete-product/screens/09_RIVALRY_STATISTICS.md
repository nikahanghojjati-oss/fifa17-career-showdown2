# Screen 09 — Rivalry Statistics / `statistics`

Status: ACTIVE SCREEN CONTRACT

Source anchor: current `main` at `cef2e101f23fd8cb777f71950bac8f0f8d9f2c7b` and established analytics authority.

## Purpose

Rivalry Statistics is the active-Showdown analytics dashboard. It should feel competitive but remain information-first, with no decorative character dependency and no heavy charting layer.

## Visual hierarchy

- current Showdown identity and period context;
- headline rivalry metrics;
- equal Manager 1 versus Manager 2 comparisons;
- competition/trophy/season performance modules;
- supporting tables or trend rows exposed by current analytics;
- Back/navigation actions owned by the product.

Canonical proposal examples preserve Manager 1 = Daniel and Manager 2 = Nik. Live data remains analytics-derived product authority.

## Treatment

Use Level B black/charcoal statistic cards with thin gold section rails. Gold identifies headings, a small number of leader values and true product-confirmed highlights; it must not color every metric.

Manager comparison modules use equal geometry. A leader may receive a restrained edge or numeric emphasis only when the underlying value actually establishes that comparison.

Tables and labels remain readable without relying on color.

## Charts and graphics

No heavy chart library is introduced by R8.

If final product contains or benefits from simple visual comparison, prefer CSS bars, native HTML, or small original SVG motifs while preserving exact text/table values.

Any chart is a presentation of analytics output, never an alternate calculation path.

## Asset resolution

- metric-card system: DOM/CSS;
- manager comparison bars/rows: DOM/CSS;
- mini-chart/grid motifs: original procedural SVG/CSS only if needed;
- character art: intentionally not required.

New raster generation: CLOSED.

## States

Cover:

- active Showdown with data;
- early Showdown with sparse data;
- tied comparison values;
- manager-leading comparison values;
- missing/unavailable derived metric if current product surfaces it;
- reduced motion;
- mobile table overflow/stacking.

## Responsive contract

Wide desktop may use a multi-column metric dashboard.

Reduced wide collapses nonessential columns before reducing text.

Chromebook/tablet uses two-column or stacked metric groups depending on data density.

Mobile stacks metrics and allows intentional horizontal scrolling only for tables that cannot be represented accurately as cards. Numeric labels remain adjacent to their values.

## Accessibility and QA

- every metric has a text label;
- comparison meaning is not color-only;
- charts, if used, have text/table equivalents;
- focus remains visible on all interactive filters/navigation;
- large numbers use readable tabular numerals where supported;
- no public/global ranking language is introduced;
- no character or decorative asset obscures tables;
- reduced motion removes decorative transitions without changing data.

## Final-main reconciliation

At final-main checkpoint, inspect the exact analytics modules and any new comparison metric. Style the final analytics output; do not add or remove data semantics from the visual track.
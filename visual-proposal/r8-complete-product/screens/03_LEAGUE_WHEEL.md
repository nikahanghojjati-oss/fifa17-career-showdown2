# Screen 03 — League Wheel / `leagueWheelScreen`

Status: ACTIVE SCREEN CONTRACT

Source anchor: current `main` at `cef2e101f23fd8cb777f71950bac8f0f8d9f2c7b`.

## Purpose

League Wheel is a high-drama selection stage. The wheel and its real hit area remain the hero. Atmosphere must surround the wheel rather than cover it.

## Exact current DOM authority

Preserve:

- screen heading `SELECT LEAGUE`;
- wheel pointer;
- the existing `#leagueWheel` and `.wheelTrack` interaction surface;
- the five canonical displayed league options already owned by the product;
- `#selectedLeague` live status;
- `#leagueStateNote` shared/local state note;
- `SPIN WHEEL` action;
- Back action.

The proposal does not add rerolls, substitute league options or create a second randomization authority.

## Composition

Use a centered wheel-stage composition with a dark circular arena, restrained warm-gold halo and subtle radial ticks behind the real wheel.

The wheel itself remains fully visible and fully interactable. Decorative rings must sit outside the hit region and must never create an overlay above `#leagueWheel`.

The selected result gets a separate locked-result band below the wheel. The result band should feel conclusive without implying that a result is authoritative before the product actually sets it.

`SPIN WHEEL` is dominant only while the product says it is actionable. Once the result is locked, the state/result hierarchy becomes dominant instead.

## Local/shared state family

The visual contract covers:

- local ready-to-spin;
- shared session not ready;
- host/coordinator may spin;
- peer waiting for host;
- spinning/in progress;
- authoritative result revealed;
- locked/no-reroll state;
- continue/progression state if the current runtime presents it;
- reconnecting/stale/unavailable/error state where surfaced.

Shared state changes copy, status badges and action availability only. It does not create a visually separate wheel product.

## Character policy

A01/A02 are optional on wide desktop only and currently not required.

Before any character crop is added, the wheel/control safe-zone must prove that both flanks remain clear. Omission is preferred because the wheel already supplies the emotional focus.

At 1279px and below, default to no character art. At 1179px and below, large character art is prohibited.

No new character generation is justified.

## Procedural asset system

Required roles:

- wheel-stage halo/radial tick asset;
- locked-result frame;
- host/peer/waiting/locked state badge family.

Preferred implementation:

- halo/radial ticks: reusable original SVG or CSS geometry;
- result frame: CSS border/rail system;
- state badges: DOM text plus CSS, not baked labels.

Do not create a raster wheel image because the current real wheel must remain interactive.

## Accessibility and input

`#selectedLeague` remains a live status surface. Decorative visual effects must not cause repeated announcements.

State badges cannot rely on gold/gray color alone; text remains explicit.

Focus on Spin and Back must remain visible outside the halo. No decorative SVG receives focus or pointer events.

Reduced motion removes decorative halo pulse and nonessential sweeps while preserving the product-owned spin behavior according to existing reduced-motion authority.

## Responsive contract

Wide desktop: centered wheel with full halo and result band.

Reduced wide: reduce halo radius before reducing wheel size.

Chromebook/tablet: preserve wheel hit area and Spin action in the useful viewport; omit optional characters and reduce decorative radial ticks.

Mobile: wheel remains centered, result/status stack underneath, actions full-width only if current responsive behavior benefits. Never position the Spin button behind or beneath decorative artwork.

## Acceptance checks

- wheel hit area is never covered;
- five existing displayed league options remain product authority;
- no unofficial reroll or extra option is introduced;
- live selected result remains readable;
- shared host/peer/waiting states remain understandable without color;
- actionable Spin is visually obvious and disabled/waiting Spin remains readable;
- no character asset is required to understand the screen;
- reduced motion preserves all information;
- no official league crest or copied FIFA wheel art is introduced.

## Final-main reconciliation

Re-read the final wheel DOM and shared-state runtime before senior handoff. Adapt only changed state surfaces; do not restart the approved stage composition when unrelated main development advances.
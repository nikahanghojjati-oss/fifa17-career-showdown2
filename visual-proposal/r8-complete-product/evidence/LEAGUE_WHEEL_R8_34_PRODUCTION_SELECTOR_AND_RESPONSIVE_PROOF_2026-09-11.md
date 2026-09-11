# League Wheel R8.34 — Production Selector + Responsive Browser Proof

Status: **ASSEMBLED_PROPOSAL / BROWSER-PROVEN / OWNER VISUAL REVIEW OPEN / PRODUCTION INTEGRATION NOT AUTHORIZED**

Date: 2026-09-11

## Authority anchors

- Current production `main` independently re-resolved at `10f75e872d246292bd5fbe55c6ae32a6370b5150` (`1.9.1-r18`).
- The current main commit is an ops/rules-deploy control commit and states that it makes no product or Rules source changes.
- Current production `js/leagueWheel.js` was re-read from that exact main before this proof.
- Visual work remains isolated on `developer/r8-26-complete-proposal-asset-build-r13-work`.

## What R8.34 closes

The R8.33 wheel was visually strong but its proposal DOM was not yet a sufficiently literal bridge to production selectors. R8.34 corrects that without moving product authority into the proposal.

The assembled proposal now exposes the current production integration seam directly:

- `#leagueWheelScreen`
- `#leagueWheel.leagueWheel`
- `#leagueWheel .wheelTrack`
- exactly five `.wheelItem` league options
- `#selectedLeague`
- `#leagueStateNote`
- `#spinLeague.menuButton`
- `.backButton[data-smart-back]`

The decorative `.wheelTheatre`, halo, pointer treatment, stadium, characters and quote plaques remain presentation-only.

## Product authority preserved

Production remains the sole authority for:

- random league selection;
- the 4000 ms normal spin timing;
- the 80 ms reduced-motion timing;
- operation IDs / stale-operation cancellation;
- save success and rollback on failure;
- `League Selected` / `League Confirmed` transitions;
- club-assignment progression;
- locked-league permanence.

The proposal `window.cm17LeagueProposal.renderState(...)` helper is QA-only. It must not ship as a replacement selection engine and performs no save, Firebase, network, randomization or progression mutation.

## Browser matrix

Chromium/Playwright was run against the real assembled HTML/CSS presentation with six visual states across six viewport conditions.

States:

1. `ready`
2. `spinning`
3. `selected`
4. `confirmed`
5. `locked`
6. `save-error`

Viewports:

- 1440×900
- 1366×768
- 1280×720
- 1179×800
- 940×700 with reduced motion
- 390×844 DPR2

Result: **36 / 36 PASS — 0 failures.**

Validated per case:

- no horizontal overflow;
- exactly five league segments;
- wheel/action bounding rectangles remain disjoint;
- result/status surface does not collide with actions;
- current production Back selector is present;
- current production Spin selector is present;
- Daniel/Nik are decorative, `aria-hidden` and `pointer-events:none`;
- wide characters are removed below the cinematic breakpoint;
- Spin is disabled in `spinning` and `locked` states;
- Back is disabled while spinning;
- state meaning remains explicit in text;
- mobile remains character-free and scroll-safe.

## Reference fidelity vs. product truth

The owner League Wheel reference remains the visual-language target: large centered black/gold wheel, Daniel/Nik framing, gold title, stadium depth, handwritten labels and a dominant gold action.

Corrections required for a real product proposal remain intentional:

- no official league logos are baked into the wheel;
- no raster wheel replaces the live DOM wheel;
- no reroll is introduced;
- no extra league is introduced;
- no visual character contact owns the rotating track;
- no reference-only control is promoted into functionality.

A future final Daniel wheel-specific pose may visually approach the stable decorative outer rim, but product interaction stays owned by the DOM wheel and current production JavaScript.

## Integration notes for CM

Before any production swap, CM should re-read then-current `main` and map this presentation onto the existing runtime rather than copying the QA harness.

Expected integration path:

1. retain current `js/leagueWheel.js` authority;
2. retain current save/rollback and reduced-motion behavior;
3. retain exact production IDs/classes used by the runtime;
4. adopt only the proposal shell/geometry/presentation classes around those live nodes;
5. rerun current production contract/browser tests;
6. verify shared-session authority if main has advanced further;
7. do not change Firebase Rules, provider authority or storage semantics for this visual redesign.

## Boundary

No production file was changed by this proof. No Firebase rule, save schema, provider, randomizer, scoring rule or backend capability was added or modified.

Owner visual approval remains open.

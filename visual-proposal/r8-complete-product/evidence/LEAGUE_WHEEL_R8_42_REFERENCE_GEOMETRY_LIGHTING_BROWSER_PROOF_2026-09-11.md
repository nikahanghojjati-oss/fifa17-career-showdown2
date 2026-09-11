# League Wheel R8.42 — Reference Geometry + Lighting Browser Proof

Status: `ASSEMBLED_PROPOSAL` / OWNER REVIEW OPEN / PRODUCTION INTEGRATION NOT AUTHORIZED

Date: 2026-09-11

Production anchor re-resolved immediately before this pass: `3c5fb2589414f8f497d1f7cb174200ef84290431`. Visual did not change production `main`.

## Owner correction addressed

This pass responds specifically to owner feedback that Daniel's hand was sitting over the wheel in an artistically poor way, the finger carried an unattractive glow, and the manager/wheel spacing needed to be studied against the supplied visual reference rather than adjusted by eye alone.

No image-generation call was used for R8.42.

## Daniel correction

The R8.41 lateral-point candidate was replaced in the owner-review snapshot with a reference-derived isolated Daniel extraction made from the owner-provided Select League reference. The extraction was cleaned to transparency and stripped of surrounding reference text/background. It remains proposal-only source art.

The important result is geometry, not a new concept:

- Daniel's face scale/position now tracks the supplied reference closely;
- the lateral pointing hand approaches the left outer wheel rim at the reference angle;
- the fingertip has controlled rim contact rather than covering a large portion of the wheel;
- the extra bright CSS edge glow around Daniel's finger was removed;
- Daniel's lighting now comes primarily from the lighting already present in the reference-derived source plus the shared stadium environment, rather than an artificial gold drop-shadow around the hand.

At 1366×768, a simple face-anchor check against the supplied 1536×864 reference (scaled to the same viewport) yielded approximately:

- Daniel reference target: x≈233, y≈175, width≈138;
- R8.42 browser render: x≈238, y≈177, width≈131.

This check is used only as composition evidence, not biometric identity authority.

## Nik correction

Nik remains the clean A01 thinking-hero source, but his wide-desktop scale and position were retuned to the same reference geometry rather than the previous ad-hoc spacing.

At 1366×768, the same face-anchor check yielded approximately:

- Nik reference target: x≈1030, y≈155, width≈158;
- R8.42 browser render: x≈1032, y≈157, width≈153.

The result restores the intended manager/wheel spacing while keeping Nik's source clean and independent from product UI.

## Wheel geometry

The wide-desktop wheel was modestly reduced and shifted left relative to the centered title to reproduce the asymmetric spacing in the supplied reference. Title and action alignment remain browser-owned DOM presentation.

Daniel may visually meet the decorative rim, but character pixels never carry wheel state, hit targets, selection logic, or product authority.

## Lighting

- Removed the strong Daniel gold edge/drop-shadow responsible for the finger halo.
- Preserved the high-quality stadium source already accepted as a valid `CANDIDATE` input.
- Reduced synthetic character glow in favor of stadium-derived contrast and the source artwork's existing rim light.
- Kept wheel highlights/metal independent from character layers so future material tuning cannot alter interaction geometry.

## Browser proof

Full matrix rerun after R8.42 corrections:

- six proposal states: `ready`, `spinning`, `selected`, `confirmed`, `locked`, `save-error`;
- six viewport conditions: 1440×900 DPR1, 1366×768 DPR1, 1280×720 DPR1, 1179×800 DPR1, 940×700 DPR1 reduced motion, 390×844 DPR2;
- result: **36/36 PASS**.

Checks include:

- no horizontal overflow;
- title clears the production-compatible header;
- wheel clears the action row;
- exactly five `.wheelItem` nodes remain;
- expected Spin/Back disabled states;
- character layers fail closed at fallback/mobile widths.

## Persistent snapshots

Exact R8.42 owner-review artifacts were persisted under:

`/Showdown visual/R8_42_League/`

including:

- `LEAGUE_DANIEL_REFERENCE_EXTRACT_R8_42_CANDIDATE.png`
- `league-r8-42c-reference-geometry.html`
- `R8_42_DESKTOP_1366_READY.png`
- `R8_42_DESKTOP_1366_SELECTED.png`
- `R8_42_MOBILE_390_READY.png`
- `R8_42_BROWSER_QA_36_OF_36.json`

## Architecture boundary

R8.42 changes presentation only. It does not modify Firebase, Firestore rules, auth, saves, shared-session behavior, routing, league selection logic, spin timing, reduced-motion timing, randomization, persistence, rollback, or locked-club semantics.

Image generation remains locked. The owner-review surface is the real Chromium assembly.
# Club Assignment Mode B2 — r17 Geometry Proof

Status: STRUCTURAL GEOMETRY LOCKED FOR PROPOSAL / FINAL CHARACTER ART OPEN / PRODUCTION UNTOUCHED

Date: 2026-09-10

## Production authority examined

Current production anchor examined for this proof:

`23bba67ed7bf9cc38cb7dc9106e3f64a17a6b55f` / runtime `1.9.1-r17`.

The authoritative product remains the existing Club Assignment DOM and reveal runtime. Mode B2 is decorative presentation only. It must not replace `.clubRevealCard`, `.clubPackStage`, `.clubPackDoor`, `.clubCardFace`, manager/club text, reveal state, persistence, confirmation, or any shared/local authority.

## Relevant r17 short-desktop geometry

At the primary owner-relevant target `1366x768`, production's existing `@media(min-width:901px) and (max-height:800px)` treatment applies.

Observed CSS authority:

- Club Assignment shell: `width:min(900px,93vw)`;
- reveal area: `width:min(820px,100%)`;
- reveal grid: `minmax(0,1fr) 60px minmax(0,1fr)`;
- grid gap: `8px`;
- reveal card height: `220px`;
- reveal card padding: `7px`;
- manager row: `21px`;
- remaining pack-stage region is approximately `356x180px` per side at the 820px reveal width.

Derived reveal-card width:

`(820 - 60 - 16) / 2 = 372px`.

Derived live pack-stage width after card padding:

`372 - 14 - 2px border ≈ 356px`.

The exact browser implementation must measure real `getBoundingClientRect()` values before production implementation; the proposal dimensions are a safe structural target, not a replacement for final runtime measurement.

## Revised Mode B2 architecture

The earlier concept in which a raster hand could overlap the moving pack was already retired.

This proof tightens Mode B2 again:

1. the entire real live pack region receives a protected aperture;
2. the proposal aperture extends at least 14px beyond the pack-stage interaction/animation region where geometry permits;
3. character body pixels remain outside that aperture;
4. hand/finger/sleeve pixels remain outside that aperture;
5. a separate static decorative rail sits outside the aperture;
6. a character hand may terminate at or gesture toward the static rail only;
7. the real `.clubPackDoor` opens entirely inside the protected region;
8. the revealed `.clubCardFace` and live club text remain unobstructed;
9. all character/frame layers are `pointer-events:none`, unfocusable and decorative to assistive technology.

The visual illusion is therefore `manager presents framed live pack`, not `manager holds moving pack`.

## Width threshold correction

The previous broad proposal used `<=1179px` as the default character-free cutoff.

The r17 production geometry shows that the complete B2 treatment should be stricter.

Proposal target:

- `>=1320px`: B2 may be enabled after runtime proof;
- `1180–1319px`: character-free by default; restrained Mode A may be considered only after direct evidence;
- `<=1179px`: character-free;
- reduced motion: character/frame decoration removed;
- mobile stacked layout: character-free.

This higher threshold deliberately reserves exterior flank width so characters do not need to invade the live pack or force the functional shell wider.

## Why this reduces risk

At 1366px, the centered production Club Assignment shell is approximately 900px wide. This leaves roughly 466px of viewport width outside the shell, or about 233px per side before ordinary page/safe-area variation. A compact upper-body character crop can therefore occupy exterior flank space instead of becoming another element inside the two-card reveal grid.

This converts the most delicate art/DOM alignment problem into a static exclusion-zone problem.

If the character crop cannot fit in the exterior flank while respecting the aperture, B2 fails closed and Mode A/character-free presentation wins. The live product never moves merely to rescue artwork.

## Machine-testable acceptance

The proposal prototype now contains a direct bounding-box overlap check for:

- Daniel character region vs Daniel protected aperture;
- Daniel hand-stop region vs Daniel protected aperture;
- Nik character region vs Nik protected aperture;
- Nik hand-stop region vs Nik protected aperture;
- document horizontal overflow.

Production implementation should expand this into the existing Playwright/browser audit style and additionally prove:

- static rail does not overlap the aperture;
- no decorative layer receives pointer events;
- no decorative layer is focusable;
- Open / Confirm / Back remain reachable and focus-visible;
- manager labels and live club names remain readable;
- all six reveal states remain coherent;
- reduced-motion fallback is understandable;
- <=1319px removes B2 layers without layout residue;
- mobile retains the existing stacked live-pack architecture.

## Prototype

Updated proposal-only prototype:

`prototypes/04b-club-assignment-mode-b2-structural-prototype.html`

Update commit:

`54a2ea51a8b97463136fb101994c138bb16ea43d`

The prototype uses production-derived short-desktop proportions, a 14px protected safety gutter, exterior character placeholders, exterior static rails, and a fail-closed overlap indicator.

No final Nik/Daniel image is embedded in this proof.

## Local screenshot note

A local Chromium screenshot attempt in the current tool environment did not produce reliable evidence because the browser process hung/failed in the container environment. This is an environment limitation, not a geometry PASS or FAIL. No external render credit was spent to force it.

Final browser truth must come from the senior implementation environment / existing Playwright infrastructure against then-current production DOM.

## A05 / A06 readiness consequence

This evidence is sufficient to define a bounded generation ticket, but not to auto-generate an image.

Final A05/A06 requirements now include:

- upper-body / torso crop rather than giant full-body hero;
- face identity matched to approved R8 Nik/Daniel family;
- arm/hand silhouette terminates outside the live-pack aperture;
- hand may brace an external static rail or use an open presentation gesture;
- no generated pack object;
- no baked club/manager/CM17 text;
- no hand crossing the card/pack region;
- transparent/maskable background;
- character can be removed completely without affecting product layout.

Sol must explain the exact generation ticket before invoking the image renderer.

## Safety conclusion

Mode B2 remains feasible and is now safer than the earlier held-pack concept. The ambitious effect is allowed only as progressive enhancement at sufficiently wide desktop. Firebase, saves, Shared Journey, reveal persistence, club draw authority and billing remain untouched.

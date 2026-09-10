# Surface Group 01 — Startup, Global Header and Runtime Notices

Status: ACTIVE SURFACE CONTRACT

Source anchor: current `main` at `cef2e101f23fd8cb777f71950bac8f0f8d9f2c7b`.

## Startup / loading

Startup remains a short transition into the application, not a new navigation or network authority.

Preserve the current protected loading athlete/source authority, startup status text, local-save messaging, minimum splash behavior and existing reduced-motion behavior.

R8 treatment:

- black/charcoal frame around the current loading visual;
- warm-gold accent/progress rail;
- existing Career Mode Showdown identity remains real HTML/CSS text;
- no A01/A02 artwork;
- no additional network request;
- no new delay;
- graceful failure back to the existing startup presentation if the visual layer is unavailable.

Do not add a copied FIFA loading screen, proprietary font or downloaded audio.

## Global application header

The header is orientation, not a second navigation bar.

Treatment:

- compact near-black top plane;
- cream product name;
- warm-gold brand accent;
- season indicator as a small competition-status capsule;
- low vertical footprint on Chromebook/mobile;
- no character art.

The season indicator reflects product state only. It may not infer or write season state.

## Runtime notices

Runtime notices always sit above decorative layers and keep current focus/dismiss semantics.

R8 requirements:

- explicit high-contrast message surface;
- visible dismiss focus ring;
- semantic state text rather than color-only classification;
- no overlap from fixed characters, atmosphere or header decoration;
- failure notices must distinguish connected-feature problems from local Career Mode availability when the runtime exposes that distinction.

## Motion

Startup may retain existing short product-owned entrance/exit motion. Header and runtime notices need no continuous decorative motion.

Reduced motion suppresses R8-only sweeps/drift and leaves all status transitions immediate.

## Responsive QA

Verify at 1600x900, 1280 class, 1220x800, 1024x768 and 390x844.

Acceptance requires:

- loading identity remains readable;
- no startup budget regression from proposal-only assets is assumed or claimed until senior implementation measures it;
- header never consumes disproportionate mobile height;
- season status is readable without truncating the product name beyond recognition;
- runtime notice content and dismiss control stay visible and focusable;
- no decorative layer intercepts pointer events.

## Asset decision

No new raster asset required. Startup uses the existing protected product media plus CSS/procedural R8 frame. Header and notices use DOM/CSS only.
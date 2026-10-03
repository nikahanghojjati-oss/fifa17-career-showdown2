# CINEMATIC DEPTH ENGINE V10

## Purpose

Create game-like depth while preserving browser performance, product truth and accessibility.

## Depth stack

P0 WORLD
- stadium bowl / sky / tunnel / architecture
- broadest scale and lowest detail priority

P1 WORLD DETAIL
- crowd
- banners
- giant screens
- pitch
- physical venue structures

P2 ATMOSPHERE
- floodlight bloom
- haze
- smoke
- restrained particles
- color grade

P3 HERO / PHYSICAL PROP
- Daniel / Nik
- desk
- wheel housing
- pack pedestal
- trophy stage
- tactical table

P4 DOMINANT GAME OBJECT
- league wheel
- transfer operations board
- rivalry score confrontation
- trophy
- season verdict board

P5 LIVE PRODUCT UI
- live values
- inputs
- focusable controls
- private state
- CTA
- status

P6 CHROME / SYSTEM
- brand shell
- navigation
- modal/overlay
- focus ring
- connectivity/recovery surface

## Minimum Level-A depth requirement

Desktop major screens must visibly preserve at least three depth groups:
1. environment;
2. hero/physical object;
3. live task surface.

If a blur test reduces the scene to flat black + card, the depth engine failed.

## Lighting model

Each scene defines four light roles:

KEY
Primary scene illumination and direction.

RIM
Separates character/object silhouette from stadium.

PRACTICAL
A visible source inside the scene: stadium strip light, desk lamp, display edge, pack pedestal.

UI EMISSION
Small controlled gold/cream light from active live UI.

Rule:
UI glow must appear motivated by a visible or believable source.

## Camera presets

V10 uses a small camera vocabulary:

STADIUM FRONTAL
Wide symmetrical/near-symmetrical venue view. Home, ceremonies, Results.

OPERATIONS ROOM
Medium-wide desk/technical area with near foreground. Transfer.

OBJECT CEREMONY
Low/hero angle around a large wheel/pack/trophy. League, Club, Legacy.

TUNNEL / WALKOUT
One-point perspective, strong leading lines. Launch/transition/promotional states.

ANALYTICAL NIGHT
Flatter, calmer, lower-theatricality setup for Statistics/Rules/Settings.

## 2.5D default

Default major-screen rendering mode is V10-L2:
- environment plate;
- separate transparent character assets;
- separate dominant-object art or CSS/SVG object;
- live DOM;
- perspective/scale/parallax only where safe;
- contact shadows;
- light overlays;
- depth-aware blur where useful.

This creates most of the perceived depth of a 3D scene without demanding constant real-time rendering.

## Character depth pipeline

1. identity master
2. screen-specific pose
3. camera angle aligned to scene
4. wardrobe consistent with role
5. transparent high-resolution render
6. key/rim lighting aligned to environment
7. feet/body contact shadow or desk occlusion
8. optional foreground prop overlap
9. desktop crop contract
10. mobile suppression/crop rule

Characters are not decorative stickers.
They are subjects inside the same light and perspective system.

## Live DOM in perspective

Volatile information is never baked into raster art.

Preferred techniques:
- live DOM on top of a tactical-board frame;
- live DOM within a scoreboard/display bezel;
- CSS perspective for mild visual integration;
- SVG lines/grids beneath DOM;
- accessible flat fallback if 3D transform affects legibility.

Do not strongly skew form controls merely to look cinematic.

## Real-time 3D policy

V10-L4 real-time 3D is allowed only when the object itself benefits from interaction.

Possible candidate:
- League Wheel, if a real 3D wheel materially improves selection ceremony and passes mobile/performance testing.

Poor candidates:
- simple transfer form;
- Settings;
- statistics tables;
- static character portraits.

## Performance budgets

Priority:
input responsiveness > text clarity > live state > scene motion > decorative effect.

Rules:
- lazy-load large decorative assets;
- avoid oversized DOM trees;
- avoid deep nested layout containers;
- use transform/opacity for frequent motion where possible;
- use content-visibility/containment selectively;
- optimize web fonts;
- provide reduced-motion path;
- downgrade or remove expensive 3D effects on constrained/mobile contexts.

## Responsive depth

Desktop:
full scene, heroes, physical object, environment.

Tablet/Chromebook:
crop/suppress one decorative plane before compressing live task.

Mobile:
keep world through lighting/crop/material; usually remove large heroes; keep dominant metaphor in a compact form; live task gets priority.

## Depth QA

Run:
- background-only test
- silhouette/blur test
- grayscale hierarchy test
- foreground-occlusion test
- character-lighting test
- contact-shadow test
- mobile crop test
- reduced-motion test
- low-performance fallback test
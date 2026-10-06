# Mockup Lab Study 001 — Home

Date: 2026-10-05
Mode: chat
Branch: `study/mockup-lab`
Scope: study only. No game code changed.
Screen: Home / Rivalry Headquarters
Status: COMPLETE

## Source authority

Primary goal mockup: `HOME_APPROVED_COMPOSITION_REFERENCE_R8_17_V1.png`
Goal dimensions: 1672 × 941
Latest Home implementation capture available in the project files: `01_HOME_R8_56_ACTIVE.png`
Implementation capture dimensions: 1366 × 768
Available phone implementation capture: `03_HOME_R8_56_MOBILE.png`
Phone capture dimensions: 780 × 2300
Current repo source checked: `main:index.html`

The requested branch did not exist when this study began, so it had no INDEX to skip. This study creates the first INDEX on the branch.

Python pixel measurement was attempted. The Project/Library image bytes could not be materialized into the Python runtime, so Python could not inspect their pixels. Image dimensions are exact file metadata. Geometry below uses the approved Home brief coordinates where available and manual visual measurement against the rendered images. Values labeled approximate are not pixel-extractor results.

## Step 1 — Identify the visual target and product truth

The target is a cinematic FIFA-era Home screen rather than a conventional web dashboard. Its core composition is a night stadium, Daniel on the left-center pointing toward the viewer, Nik on the right with hand on chin, a large brush-style Career Mode Showdown 17 lockup in the left hero zone, a dark-glass action dock across the bottom, and a soundtrack card on the right.

The mockup itself includes older product copy such as the loading/progress strip and a local-save statement. Those are not automatically product truth. Existing Home R3 guidance explicitly says the Home screen should not carry the startup loading bar/local-only claim, and current product strings must win.

## Step 2 — Read the hierarchy

Primary read order:
1. Franchise identity: Career Mode Showdown 17.
2. Rivalry identity: Daniel and Nik as co-heroes.
3. Screen identity: Home / Rivalry Headquarters.
4. Primary action dock.
5. Soundtrack/media.
6. Stadium world, banners, handwritten character notes, footer branding.

The mockup succeeds because the UI feels embedded in a football broadcast/game world. It does not read as cards sitting on a generic dark background.

## Step 3 — Establish canvas and macro composition

Goal canvas: 1672 × 941, aspect ratio 1.7779:1.

Approved Home geometry from the latest Home build brief:
- Left hero column: x 2.4%–36%, y 12%–42%.
- Brush wordmark: about 32% of viewport width at 1366.
- Home / Rivalry Headquarters heading block: y 57%–71%.
- Action dock: x 2.4%–97.6%, y 73%–91%.
- Soundtrack card: x 64%–97.6%, y 52.5%–70%.

Approximate goal-image landmarks from visual inspection:
- Header band: y 0%–8.5%.
- Daniel visual mass: about x 31%–58%, y 8%–83%.
- Nik visual mass: about x 52%–82%, y 3%–83%.
- Footer band: about y 93%–100%.

The composition is intentionally asymmetric: text-heavy left, human focal mass center/right, media on the right, interaction dock at the bottom.

## Step 4 — Measure the major UI zones

At 1672 × 941, the approved percentage geometry resolves approximately to:
- Left hero column: x 40–602 px, y 113–395 px.
- Heading block: y 536–668 px.
- Action dock: x 40–1632 px, y 687–856 px.
- Soundtrack card: x 1070–1632 px, y 494–659 px.

At a 1366 × 768 implementation viewport, the same normalized target resolves approximately to:
- Left hero column: x 33–492 px, y 92–323 px.
- Heading block: y 438–545 px.
- Action dock: x 33–1333 px, y 561–699 px.
- Soundtrack card: x 874–1333 px, y 403–538 px.

These are the most important fidelity anchors because they control the silhouette of the whole screen.

## Step 5 — Typography and graphic language

Target hierarchy:
- Small widely tracked kicker.
- Large rough brush/paint franchise wordmark with a white/gold split and a strong yellow 17.
- Condensed uppercase Home label with gold underline.
- Large condensed white Rivalry Headquarters.
- Small warm-white explanatory text.
- Tile labels in condensed uppercase with gold code labels and white primary text.
- Handwritten gold annotations around the managers as environmental flavor.

The current implementation capture is materially more uniform: the hero title is predominantly gold, smoother and more compressed. The target has stronger contrast between rough franchise lettering, condensed UI text, and handwritten notes.

## Step 6 — Color, light, material, and depth

Target palette:
- Near-black smoked glass.
- Warm gold seams and highlights.
- Off-white typography.
- Yellow-gold primary action.
- Stadium lights that rim the figures rather than flatten them.
- Cool/dark atmospheric sky behind warm foreground light.

Depth order:
1. Sky and stadium roof.
2. Floodlights and distant crowd.
3. Banners/world dressing.
4. Daniel and Nik.
5. Hero text and screen heading.
6. Soundtrack glass plate.
7. Action dock and footer.

The current capture pushes gold saturation and dark contrast harder, making the world feel flatter and busier. The target has more atmospheric separation and more visual breathing room around the hero lockup.

## Step 7 — Character and asset staging

Daniel and Nik are not decorative corner portraits. They are the central stage.

Daniel:
- Left-center.
- Forward gesture toward camera.
- Must not collide with the wordmark or Home heading.
- Gold rim light separates hair/shoulder from stadium.

Nik:
- Right-center/right.
- Hand-on-chin pose.
- Must remain readable behind/above the soundtrack card.
- Face and hand are protected visual landmarks.

The target uses the managers to bridge the hero and the action dock. Cropping them too aggressively or shifting Daniel too far left damages the intended hierarchy.

## Step 8 — Responsive and interaction implications

Desktop should preserve the normalized stage, not simply center every element.

For phone, the existing project capture is a long vertical recomposition rather than a scaled desktop. That is the correct strategy in principle. The two managers' faces must remain whole, the headline may be simplified when space is tight, soundtrack/media becomes its own block, and action tiles can become a two-column grid.

No phone target mockup with the same authority as the desktop Home goal was found in the curated mockup set, so phone fidelity is not scored in this study.

Interaction behavior is outside visual measurement, but product truth must remain intact: enabled/disabled Continue behavior, online identity/state, season state, accessibility, and current navigation strings must not be overwritten merely to copy old mockup text.

## Step 9 — Current-game gap against the goal

No fresh user-pasted live screenshot was present in this turn. This comparison therefore uses the latest Home implementation capture found in the project files, `01_HOME_R8_56_ACTIVE.png`, plus current `main:index.html`. If a fresh live screenshot is pasted later, measure that image at its native size and append a second comparison here rather than replacing this baseline.

### Geometry and composition differences

| Area | Goal | Available implementation capture | Difference / priority |
| --- | --- | --- | --- |
| Hero lockup | x 2.4%–36%, y 12%–42%; brush wordmark ~32vw | Similar left zone, but title is shorter, more uniformly gold, and visually less dominant | High |
| Character staging | Daniel center-left, Nik right, both integrated with atmospheric stadium depth | Daniel/Nik occupy more of the center and the scene is more gold-saturated | Medium-high |
| Screen heading | y 57%–71% | Approximately y 55%–74% | Close geometrically; typography/copy density differs |
| Soundtrack card | x 64%–97.6%, y 52.5%–70% | Approximately x 61.5%–96.5%, y 56%–74% | About 2.5% too far left and 3.5% too low; High |
| Action dock | x 2.4%–97.6%, y 73%–91% | Approximately x 2.4%–97.6%, y 74.5%–92% | Geometry close; content count/product-truth treatment is the bigger issue |
| Header | Rich global nav + utility icons in goal image | Compact brand/Home/online/season treatment in capture; current main markup also differs from goal | Intentional product evolution plus visual mismatch; do not copy blindly |
| Loading/progress strip | Present in old goal | Shared Showdown Ready state in capture | Do not chase this old target; latest Home guidance says loading belongs to startup |
| Material/depth | Smoke, cool-dark sky, restrained warm rim light | Higher gold saturation, denser contrast, flatter world separation | Medium-high |
| Tile/icon language | Large photographic/illustrative icon tiles, first tile gold | Similar motif, but hierarchy is compressed | Medium |
| Footer | Strong branded finish | Present but visually lighter/shorter | Low |

### Product-truth conflict to preserve

The raw goal image shows six bottom actions and an older local-save/loading story. Later Home R3 guidance says current Home should use current product strings, hide product-hidden tiles when applicable, and keep startup/loading copy off Home. Therefore the fidelity objective is the goal's composition, material, icon language, and cinematic hierarchy, not literal reproduction of stale text or obsolete states.

### Recommended fidelity order for a future implementation pass

1. Restore the goal's hero-wordmark scale, rough brush contrast, and white/gold hierarchy.
2. Re-stage Daniel/Nik and the stadium lighting to create the target's foreground/midground/background separation.
3. Move the soundtrack plate to the target rectangle and keep it clear of Nik and the dock.
4. Preserve the action-dock rectangle and tile material while letting current product truth decide which actions appear.
5. Reduce gold saturation in the environment and recover cooler smoke/sky separation.
6. Treat the old progress/local-save copy as historical, not as a visual defect.

Study conclusion: Home remains a meaningful fidelity gap, especially in franchise typography, character/world staging, media-card placement, and atmospheric depth. The broad lower-page geometry is already closer to the target than the surface styling makes it appear.

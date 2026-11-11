# Quality levels: one system for every screen

Nik, 2026-11-08: "no screen should have a setting for a level that the other screen don't have ... we all should have one
shared system". This page is that system. `tests/contracts/r90-quality-levels-contracts.cjs` enforces it.

## The six levels

One list, in `js/gfxTier.js` (`CareerModeGfxTier.labels`). Settings, the Device check and the `?fps=1` overlay show these
names and no others.

| # | Name | Who gets it | Pixel ratio (start / most) | Shadow map | Crowd | Downloads |
|---|---|---|---|---|---|---|
| 0 | Light | Chromebooks, weak phones, software GL | 1 / 1 | 1024 | 45% | Light assets |
| 1 | Balanced | most laptops, older flagship phones | 1.25 / 1.5 | 1024 | 70% | Balanced assets |
| 2 | High | gaming laptops, strong phones (iPhone 17 class) | 1.5 / 2 | 2048 | full | High assets |
| 3 | Extra | strong desktop GPUs | 2 / 3 | 2048 | full | Extra assets |
| 4 | Ultra (4K) | picked in Settings only | the screen's own, up to 2x past it within a 3840x2160 buffer | 4096 | full | Ultra assets |
| 5 | 8K | picked in Settings only, on a GPU with a 7680 px buffer, never a phone | up to 4x past native within 7680x4320 | 4096 | full | Ultra assets |

- Auto and every named level stay at or under the screen's own pixel ratio. Only Ultra (4K) and 8K draw past it.
- A phone never draws past 3x its CSS size, nor past a 4K buffer.
- Below High, a phone downloads one size down. So does a Save-Data or 2g/3g connection, at any level. The drawing level stays the same.

## How the level is chosen

- **Auto** (the default):
  - It starts from the graphics chip's name. Software GL starts at Light. A strong phone GPU (Apple GPU, Adreno 7xx and up, Mali-G7xx, Immortalis) starts at High. Desktop GPUs start at Balanced, High or Extra by family.
  - A small memory or few cores hold it down.
  - The Device check (`device-check.html`) replaces the guess with the best level this device held at 60 fps.
  - Each scene's first timed frames may move Auto one level up or down for that scene. That is never saved.
  - Auto never picks Ultra (4K) or 8K.
- **A picked level** (Settings › 3D QUALITY) is held as picked on every screen. Settings says in one line what Auto picked (or measured) for this screen and graphics. The line is never shown on a game screen.
- **Never crash first.** A lost context, an out-of-memory error, or (8K) a refused buffer drops the device one level below the one that failed. This applies to any level, Auto or picked.
  - The cap is saved and every screen honours it.
  - It lifts after 7 days, or after 3 clean scenes at the capped level, or when the player picks again.
- **The governor** (`CareerModeGfxTier.governor`) is the only thing that moves quality during a scene, and it only moves the pixel ratio:
  - On Auto it steps down when frames run long. It steps up only after a timed frame shows room, and never back to a step that ran slow.
  - A picked level never adapts.

## How a screen joins

**A 3D screen** (WebGL: Russian Roulette, Chamber Men, Special Player):

```js
const p = CareerModeGfxTier.profile();                       // before the renderer: antialias is fixed at creation
const renderer = new THREE.WebGLRenderer({antialias: p.antialias, ...});
renderer.setPixelRatio(p.pixelRatio);
await CareerModeGfxTier.calibrate(renderer, draw);           // behind the loading screen
const gov = CareerModeGfxTier.governor(renderer, {key: "scene", draw});
// MSAA for a render target: CareerModeGfxTier.samples(renderer, want, halfFloat) and checkTarget(renderer, target)
// its own out-of-memory sign: CareerModeGfxTier.fallback(reason)
```

Each screen's own knobs (crowd, lights, shadows that cast, texture sizes, MSAA counts) are tables indexed by
`p.level`, five rows from Light to Ultra (4K); 8K uses Ultra's row. A screen never:

- reads `devicePixelRatio`, `hardwareConcurrency`, `deviceMemory`, the GPU name or `(pointer: coarse)` to pick quality;
- sets a pixel ratio of its own;
- runs a frame-time loop of its own;
- offers a level, a name or a URL switch the others don't have (`?gfx=0..5` belongs to `js/gfxTier.js`).

**A 2D screen** (Prime Pack, Home, career screens): the root element carries the level and the download size, set on load,
on a pick, after calibration and on a fallback:

```css
:root[data-gfx="0"] .heavyEffect { /* Light: drop the blur or the animated layer */ }
```

- `html[data-gfx="0".."5"]` is the level.
- `html[data-assets="0".."4"]` is the download size, for image pickers.
- No other values exist.
- A 2D page in its own frame (Prime Pack) mirrors its parent's `html[data-gfx]`. Run on its own as a preview, it may read the same `?gfx=0..5`, and nothing else.

Density pickers for `image-set()` plates and 2D canvases sized to the screen (confetti) read `devicePixelRatio` to match
what the browser draws. So do the 4K-art pickers of Prime Pack and the RRR café hall, which add their 4K art only at Extra
and above on a screen that sharp. They are not quality choices, and the contract lists them by name.

## Proof per release

Every release that touches a screen's quality reports, per level: draw calls, triangles, texture and shadow memory, and
the download size (headless numbers for comparison, and a real device for frame rate).

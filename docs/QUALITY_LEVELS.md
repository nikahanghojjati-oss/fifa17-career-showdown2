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
| 4 | Ultra (4K) | measured by the Device check, or picked in Settings | the screen's own, up to 2x past it within a 3840x2160 buffer | 4096 | full | Ultra assets |
| 5 | 8K | measured by the Device check or picked in Settings, on a GPU with a 7680 px buffer, never a phone | up to 4x past native within 7680x4320 | 4096 | full | Ultra assets |

- Auto and every named level stay at or under the screen's own pixel ratio. Only Ultra (4K) and 8K draw past it.
- A phone never draws past 3x its CSS size, nor past a 4K buffer.
- The buffer cap holds from the first frame: a scene sizes its very first buffer within its level's cap (Ultra 3840x2160, 8K 7680x4320), not only once its governor is running. A frame with no size yet counts as large as the screen.
- Below High, a phone downloads one size down. So does a Save-Data or 2g/3g connection, at any level. The drawing level stays the same.

## How the level is chosen

- **Auto** (the default):
  - It starts from the graphics chip's name. Software GL starts at Light. A strong phone GPU (Apple GPU, Adreno 7xx and up, Mali-G7xx, Immortalis) starts at High. Desktop GPUs start at Balanced, High or Extra by family.
  - A small memory or few cores hold it down.
  - That guess alone never goes past Extra.
  - The Device check (`device-check.html`) replaces the guess with the best level this device really held at 60 fps, any
    level from Light to 8K (Nik, 2026-11-11: "Auto should allow all qualities based on device real test ... from light
    to 8k"). See "The Device check" below.
  - Each scene's first timed frames may move Auto one level up or down for that scene. That is never saved.
- **A picked level** (Settings › 3D QUALITY) is held as picked on every screen. Settings says in one line what Auto picked (or measured) for this screen and graphics. The line is never shown on a game screen.
- **Never crash first.** A lost context, an out-of-memory error, or (8K) a refused buffer drops the device one level below the one that failed. This applies to any level, Auto or picked.
  - The cap is saved and every screen honours it.
  - It lifts after 7 days, or after 3 clean scenes at the capped level, or when the player picks again.
- **The governor** (`CareerModeGfxTier.governor`) is the only thing that moves quality during a scene, and it only moves the pixel ratio:
  - On Auto it steps down when frames run long. It steps up only after a timed frame shows room, and never back to a step that ran slow.
  - A picked level never adapts.

## The Device check

`device-check.html` (Settings › 3D QUALITY › Device check…) is the only thing that saves a measured level.
`tests/contracts/r91-device-check-verdict-contracts.cjs` enforces these rules.

- It plays all three 3D screens at each level, lightest first: a Chamber Men kick, a Russian Roulette turn and a Special
  Player reveal, each in its own frame at `?gfx=N&bench=1`, full window.
- A level counts only when all three screens answered for it, and every answer:
  - drew the level that was asked (the frame reports both, with its pixel ratio and buffer size);
  - played one whole beat (the kick, the turn, the reveal) while it was timed;
  - used the full files for that level (never the lighter stand-in set of a slow connection);
  - held 60 fps: an average of 57 fps or more and a 1% low of 45 fps or more.
- A screen that is not smooth, or where the GPU gave up (a lost context, out of memory, a refused 8K buffer), settles that
  level: Auto becomes the level below, and nothing above is tried.
- Anything else leaves the level **not verified**: a screen that did not start, no answer, a beat that did not finish, a
  different level drawn, a smaller buffer than asked. The check ends there, nothing is saved, and the last good result
  stays.
- 8K is tried only where `can8k()` is true, and counts only when the browser gave the whole 7680x4320 buffer.
- While it is timed a frame ignores an older crash cap (it must draw the level asked). A finished check lifts the cap.
- The saved result records, per level and screen, the frame rate, pixel ratio and buffer size that were drawn.
- Results saved by 2.3.0's check are not read: that check could save a level one screen never drew.

## How a screen joins

**A 3D screen** (WebGL: Russian Roulette, Chamber Men, Special Player):

```js
const p = CareerModeGfxTier.profile();                       // before the renderer: antialias is fixed at creation
const renderer = new THREE.WebGLRenderer({antialias: p.antialias, ...});
renderer.setPixelRatio(p.pixelRatio);
await CareerModeGfxTier.calibrate(renderer, draw);           // behind the loading screen
const gov = CareerModeGfxTier.governor(renderer, {key: "scene", draw, info});   // info(): what was built, for the Device check
gov.hold(true); /* a kick, a turn, a reveal */ gov.hold(false);                 // one beat: no quality step inside it
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

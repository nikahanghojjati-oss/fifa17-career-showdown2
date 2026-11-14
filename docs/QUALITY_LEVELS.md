# Quality levels: one system for every screen

Nik, 2026-11-08: "no screen should have a setting for a level that the other screen don't have ... we all should have one
shared system". This page is that system. `tests/contracts/r90-quality-levels-contracts.cjs` enforces it.

## The six levels

One list, in `js/gfxTier.js` (`CareerModeGfxTier.labels`). Settings, the Device check and the `?fps=1` overlay show these
names and no others.

| # | Name | Who gets it | Pixel ratio (start / most) | Shadow map | Crowd (Chamber Men seats) | Downloads |
|---|---|---|---|---|---|---|
| 0 | Light | Chromebooks, weak phones, software GL | 1 / 1 | 1024 | 8,400 | Light assets |
| 1 | Balanced | most laptops, older flagship phones | 1.25 / 1.5 | 1024 | 9,025 | Balanced assets |
| 2 | High | gaming laptops, strong phones (iPhone 17 class) | 1.5 / 2 | 2048 | 15,316 | High assets |
| 3 | Extra | strong desktop GPUs | 2 / 3 | 2048 | 16,354 | Extra assets |
| 4 | Ultra (4K) | measured by the Device check, or picked in Settings | the screen's own, up to 2x past it within a 3840x2160 buffer | 4096 | 16,354 | Ultra assets |
| 5 | 8K | measured by the Device check or picked in Settings, on a GPU with a 7680 px buffer, never a phone | up to 4x past native within 7680x4320 | 4096 | 16,354 | Ultra assets |

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
  - Each scene's first timed frames (`calibrate`) may move Auto one level up or down. The scene in front of them is
    already built, so the move is for the scenes that follow on that page and for this scene's pixel ratio. The scene
    itself stays the level it was built at (`governor.level()`, `builtLevel(renderer)`), and a slow warm-up also starts its
    heavy parts one step down. A level found slow is not tried again on that page. That is never saved.
- **A picked level** (Settings › 3D QUALITY) is held as picked on every screen. The list's Auto entry names the level Auto draws here ("Auto · Light"), and with a level picked a line under the row says what Auto would pick. Neither is ever shown on a game screen.
  - On a weak device (2 processor threads or fewer, or 4 GB of memory or less, as the browser reports them), Ultra (4K)
    and 8K are listed only once the Device check has passed them there (Nik 2026-11-12, after the device lab found them
    offered on a 2-thread 4 GB Chromebook). Settings says which levels wait for the check. A pick of one of them saved
    earlier stays saved and draws the highest level the device may pick until the check passes it. Every other device
    keeps the full list (8K where the GPU can hold it). Auto and the Device check's own frames are never held back.
- **Never crash first.** A lost context, an out-of-memory error, or (8K) a refused buffer drops the device one level below the one that failed. This applies to any level, Auto or picked.
  - The cap is saved and every screen honours it.
  - It lifts after 7 days, or after 3 clean scenes at the capped level, or when the player picks again.
- **A tab that dies while a 3D screen opens.** The browser killing the tab for memory, or the player reloading a hung
  page, leaves no graphics error behind. So a 3D screen leaves a mark while it opens
  (`careerModeShowdown.gfxOpening.v1`) and removes it once it is running (its first beat played, or 20 s of frames),
  when it ends, and when its page is hidden or left. A mark still there when the same tab loads the game again means the
  page died: the level that was opening is capped one down before the screen opens again.
  - Only that case counts. A mark from another tab, a frame still alive on the same load, a clean reload and a hidden
    tab cap nothing. Where the browser cannot tell the tab apart there is no mark at all.
  - Chamber Men marks before it loads and builds (`sceneOpening`), since that is its heaviest moment; a mount that
    ends without a scene takes the mark off.
  - Known and accepted: the browser's "Duplicate tab" copies the tab's id, so a duplicate made in the seconds a 3D
    screen is opening counts as a death. It only ever lowers, by one level, until a pick in Settings or 7 days.
  - This cap does not lift after clean scenes (the level would close the tab again). It ends after 7 days or when the
    player picks a level in Settings. Settings says what is drawn meanwhile, also for a picked level.
  - The Device check does not open a level above this cap again: it counts as failed there, and the page says why.
- **The governor** (`CareerModeGfxTier.governor`) is the only thing that moves quality during a scene. On Auto it walks
  one ladder per scene:
  - First the pixel ratio, a quarter at a time, down to the level's floor.
  - Then the scene's own heavy parts (crowd, shadows, glow), which the scene offers as `detail: {steps, apply}`:
    step 0 is the scene as built, the last step its lightest. `apply(step, why)` is the only place those parts move.
    `why` is `"start"` (behind the loading screen), `"slow"`, `"smooth"` (a step back up) or `"restore"` (steps
    that bought nothing are put back, possibly several at once): a scene must take any step from any other.
  - Each scene's ladder, smallest loss first (a part the level does not have is not on it):
    - Chamber Men: shadow maps every second frame; the grass blades over the box off (Extra and Ultra); the side
      and far stands at 60% of their fans (the end behind the goal stays full); no real shadows (the soft patches
      on the turf stay). A kick is one beat: from the run-up until 4 s after the strike. Every step in play (the
      pixel ratio's too) cross-fades like a reset: the scene gives the governor its fade as `before()`.
    - Russian Roulette: the dust motes in the lamp light off; a shot makes half its smoke puffs and sparks; the two
      café tables and their chairs off (Extra and up; the café picture and the marble floor stay). A turn is one
      beat. The shadow map is drawn once, so there is no shadow step. Every step in play is a soft cut: the frame
      as it stands fades out over the new one (`softCut`, a plain cut under Reduce Motion).
    - Special Player: the blur chain at half its size (the glow a little softer); the scene's
      edge smoothing one step down (8 samples to 4, 4 to 2; not at Balanced, which already draws 2, and
      never down to none: a GPU that does not offer the lower count keeps its edges);
      no blur chain (the cheap in-place glow, as the pack draws without bloom). Light draws straight to the screen and has no step. A
      reveal is one beat, from the pack's first frame until the card has settled, in play as in the Device check
      (in 2.3.0 only the Device check held it). Every step in play is a soft cut, as in Roulette.
  - Steps are taken between beats only. While a scene holds (a kick, a turn, a reveal) nothing changes; a beat that
    ran slow steps down as it ends.
  - Slow frames for a second step down, whatever the cause (as in 2.3.0). Steps taken while the scene does not look
    like the cost (an idle frame callback, a cheap timed draw) must buy frame time: two of them that leave the frames
    within 10% of where they began are undone, and the screen's own pace (a 30 fps power mode, a 50 Hz screen) is what
    slow is judged against from there on. A screen that simply runs under 60 Hz ends exactly where it began: steps up
    keep the absolute bar (frames under 17.6 ms), as in 2.3.0, so it never climbs above its start either.
  - It steps up only after a timed frame shows room, never back to a step that ran slow on that visit. A scene that
    plays in beats and started low steps up only after a beat ran smooth. A heavy part that came back and ran slow
    again stays off for a week of visits.
  - Each scene starts its next visit where the last one settled (for the same built level).
  - A picked level never adapts, and neither does the Device check's frame.

## Phones: the 3D file set (r92)

On a phone (shortest screen side under 700 px) the 3D scenes load the phone file set at High and above
(`profile().textureLevel` at most 1); `assetLevel`, and so the 2D plates, keep the level's own size. Nik's iPhone 17 closed
the Safari tab while Chamber Men was opening at High: on the iPhone profile Chamber Men loaded about 427 MB of textures at
High and 579 MB at Extra, against 95 MB at Balanced, for a picture about 590x390 pixels. With the phone set: High 164 MB,
Extra 189 MB (`tests/browser/device-lab.cjs`, cpu mode). The Special Player card art stops at 2x on a phone (2.5x on a
computer at Extra and above): at Extra on the iPhone profile its card faces went from 170 to 109 MB, the screen from 327 to
266 MB. A phone never asks for more than 4 MSAA samples (`samples()`), which halves Special Player's half-float target at
Extra where the chip lists 8.

**Phone memory budget (every release).** `tests/browser/phone-memory-budget.cjs` measures each 3D screen at High and Extra
on the iPhone 17 profile at the level's top pixel ratio (`?gfx=N&gfxpr=top`, read only with a forced level) and fails over
300 MB of textures + render buffers. `.github/workflows/phone-memory-budget.yml` runs it on pushes to `gameplay/r<N>`.
At Extra a phone's sharpness stops at 2.25x (`PHONE_EXTRA_PR`): at 3x Special Player took about 370 MB. r92 numbers
(MB, High / Extra): Chamber Men 166 / 190, Roulette 214 / 226, Special Player 241 / 263.
iOS also keeps decoded image copies, so a real iPhone uses more than it counts; only a real iPhone proves a level opens. The Device check's frames and the Special Player page also hand
their GPU memory back when they are closed, as Roulette does.

## The Device check

`device-check.html` (Settings › 3D QUALITY › Device check…) is the only thing that saves a measured level.
`tests/contracts/r91-device-check-verdict-contracts.cjs` enforces these rules.

- It plays all three 3D screens at each level, lightest first: a Chamber Men kick, a Russian Roulette turn and a Special
  Player reveal, each in its own frame at `?gfx=N&bench=1`, full window.
- A level counts only when all three screens answered for it, and every answer:
  - drew the level that was asked (the frame reports both, with its pixel ratio and buffer size);
  - played one whole beat (the kick, the turn, the reveal) while it was timed;
  - used the full files for that level (never the lighter stand-in set of a slow connection);
  - held 60 fps: an average of 57 fps or more, and no stutter: at most 2 frames in 100 late (over 25 ms) and no frame over
    100 ms (r92, Nik's iPhone 17 run 4: Special Player at Light averaged 60 fps with the GPU at 2 ms and failed the old
    1% low of 45 on three missed refreshes). An answer without those counts (an older frame) keeps the 1% low of 45.
- A screen that is not smooth is played once more at the same level before it counts (r92, Nik's iPhone 17: one hitch of
  about a tenth of a second fails the 1% low over a 10 s run). Two slow tries settle the level. A second try that gives no
  clean answer leaves the first one standing. Failed and not-verified answers are not tried again.
- A screen that is not smooth twice, or where the GPU gave up (a lost context, out of memory, a refused 8K buffer), settles
  that level: Auto becomes the level below, and nothing above is tried.
- **The check only ever raises Auto** (r92, Nik 2026-11-14): Auto is the higher of the check's result and the level the
  graphics chip starts at. A result below the chip's level is not saved (an earlier one is let go, and the page says Auto
  stays on the chip's level), and one saved by 2.4.0 below it is not read (`gfxMeasured`).
- Even Light not smooth saves nothing (r92): there is no level below Light, so it cannot show which level is too heavy.
  Auto keeps the last good result or its guess, and the page says so. A 2.4.0 result that saved Light "not held" is not
  read (`gfxMeasured`), so such a device goes back to its guess.
- Each timed screen reports its slowest frame, when it came (seconds into the screen) and how many frames took over 25 ms,
  so a real device's table shows whether it was one hitch or a level too heavy.
- Anything else leaves the level **not verified**: a screen that did not start, no answer, a beat that did not finish, a
  different level drawn, a smaller buffer than asked. The check ends there, nothing is saved, and the last good result
  stays.
- 8K is tried only where `can8k()` is true, and counts only when the browser gave the whole 7680x4320 buffer.
- While it is timed a frame ignores an older crash cap (it must draw the level asked). A finished check does not lift the cap: Auto draws the lower of the two until the cap ends by its own rules, and the page says so.
- The saved result records, per level and screen, the frame rate, pixel ratio and buffer size that were drawn.
- Results saved by 2.3.0's check are not read: that check could save a level one screen never drew.

## The level guide

Nik, 2026-11-12: "based on your graphic card, this is what we suggest, or based on your CPU ... so everyone can look at
that table and understand what is recommended for them". It lives on the Device check page, not in a pop-up (Settings
is full, and nothing may cover anything).

- **One source.** `CareerModeGfxTier.guide()` returns everything the page shows: what this device's graphics chip,
  processor threads and memory each say, the level Auto starts at (the lowest of the three), the level a saved check
  measured, and six rows (which chips start at each level, what the level draws). The rows say in words what
  `gfxClassify` does, and `tests/contracts/r91-level-guide-contracts.cjs` runs named chips through it against them.
  The page names no chip and no level of its own.
- **Your device** (top of the page, above Start): graphics chip, processor, memory, then "We suggest <level>".
- **Level guide** (under the results): the six rows, this device's row marked, and under each row one real picture
  of each 3D screen at that level.
- **Honest words.** The guide says where Auto starts and why; it promises no frame rate. "Holds 60 fps" is said only
  of this device, after a finished check that held its level. On a weak device the card says Ultra (4K) and 8K are
  offered only after the check passes them.
- **The pictures** (`assets/level-guide/<screen>-<level>.webp` and a small `-s.webp`): captured from the real
  screens, one fixed view each, the same for every level, framed close on what changes between levels (Chamber Men: the
  crowd, goal and keeper; Russian Roulette: the table and the room behind it; Special Player: the card's lower half, the
  sparkles and the shadow on the grass). Clocks and random draws are fixed, so only the level differs. Light to Ultra
  are real renders; 8K cannot be forced on the software renderer the pictures are shot on, so its picture is Ultra's
  (8K differs only in how many pixels it draws). Re-shoot when a scene's look changes. They show how a level looks and say nothing about
  speed. They load lazily on the Device check page only: never in the worker's install list, never on the game page.
- **Finding it from Settings.** Under 3D QUALITY a gold link, "Device check and guide ›", opens the page; the list's
  last entry, "Device check…", still does. The Auto entry reads "Auto · Light" (the level Auto draws on this device),
  so the pick the game made is in plain sight. With Auto on, the line under the row only adds what the list cannot
  say: "Measured by the Device check.", "Lowered after a graphics error.", and which levels wait for the check.

## How a screen joins

**A 3D screen** (WebGL: Russian Roulette, Chamber Men, Special Player):

```js
const p = CareerModeGfxTier.profile();                       // before the renderer: antialias is fixed at creation
const renderer = new THREE.WebGLRenderer({antialias: p.antialias, ...});
renderer.setPixelRatio(p.pixelRatio);
await CareerModeGfxTier.calibrate(renderer, draw);           // behind the loading screen
const gov = CareerModeGfxTier.governor(renderer, {key: "scene", draw, info});   // info(): what was built, for the Device check
gov.hold(true); /* a kick, a turn, a reveal */ gov.hold(false);                 // one beat: no quality step inside it
// heavy parts the governor may step between beats: governor(renderer, {..., beats: true, detail: {steps, apply}})
// a scene that can fade one picture into the next: governor(renderer, {..., before})   // called ahead of every change in play
// MSAA for a render target: CareerModeGfxTier.samples(renderer, want, halfFloat) and checkTarget(renderer, target)
// its own out-of-memory sign: CareerModeGfxTier.fallback(reason)
```

Each screen's own knobs (crowd, lights, shadows that cast, texture sizes, MSAA counts) are tables indexed by
`p.level`, five rows from Light to Ultra (4K); 8K uses Ultra's row. A screen never:

- reads `devicePixelRatio`, `hardwareConcurrency`, `deviceMemory`, the GPU name or `(pointer: coarse)` to pick quality;
- sets a pixel ratio of its own;
- runs a frame-time loop of its own, or moves its heavy parts anywhere but in `detail.apply`;
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

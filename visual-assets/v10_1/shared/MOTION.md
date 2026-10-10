# Showdown shared motion contract

Job 16 centralizes motion so screens use one choreography instead of hand-written timings. Load `showdown-tokens.css`, `motion.css`, and then lazy-load `motion.js` only when the active screen needs it.

## Standard entrance

`sdEnter(root)` reads `data-sd-enter` attributes and runs the shared pack-rip order:

- `scene`: starts at 0 ms, settles by 400 ms.
- `character-left` / `character-right`: start at 150 ms, slide 24 px inward, settle by 600 ms.
- `title`: starts at 250 ms, transform-only cover wipe, then one metallic glint.
- `panel`: starts at 400 ms and rises 16 px; `--i` is assigned automatically with a 60 ms stagger, capped after the sixth panel so the entrance never exceeds 1.2 s.
- `button`: one payoff pulse after the panels begin, with no repeating idle animation.
- optional `crown`, `card`, and `slam` roles use the same shared timings for reward moments.

The core screen is usable by 600 ms and all entrance cleanup finishes by 1.2 s.

## Reveal helpers

- `sdCountUp(el, to, ms)` updates text with tabular figures. Default duration is 500 ms. Reduced motion sets the final value immediately instead of animating the number.
- `sdBurst(canvas, x, y, opts)` draws a gold particle burst on a caller-provided canvas. Default is 36 particles; the hard cap is 60. Duration is capped at 900 ms. Gravity and fade happen inside one `requestAnimationFrame` loop.
- `sdReveal(el)` runs the pack-rip recipe: 300 ms anticipation, a short flash, then a 420 ms settle/glint. Pair it with `sdBurst` when the screen has a reward burst canvas.

## Performance rules

1. **Transform and opacity only.** Choreography moves or fades compositor-friendly layers. The title wipe uses a transform-only cover rather than animating `clip-path`. Particle positions are canvas drawing coordinates; DOM layout is never animated.
2. **`will-change` only during animation.** CSS adds it only on active motion classes. `motion.js` removes those classes after each animation finishes.
3. **No motion on load-critical layout.** Motion must never change width, height, grid tracks, margins, padding, font size, or document flow. The final layout exists before `sdEnter` runs.
4. **Entrance budget: 1.2 s maximum.** `sdEnter` removes its orchestration state at 1200 ms. The useful UI is available by 600 ms; buttons remain real DOM controls throughout.
5. **Feedback is short.** Press/hover behavior stays at the shared `--sd-duration-feedback` / `--sd-duration-fast` tokens (100–150 ms). Do not add looping attention animations.
6. **One frame loop per burst/count-up.** Do not start duplicate timers for the same visual. Stop drawing when the helper resolves.
7. **Lazy-load only.** PRODUCT_TRUTH forbids adding visual JS to startup. `motion.js` belongs in an optional screen load path.

## Reduced motion

The kit respects both accessibility sources used by the product:

- native `prefers-reduced-motion: reduce`;
- the application preference stored at `careerModeShowdown.preferences` as `reducedMotion`, exposed by `window.isReducedMotionPreferred()` / `window.getApplicationMotionPreferenceState()` when the main runtime is present.

When either source requests reduced motion, entrances become a 150 ms opacity fade. Slides, scale changes, title wipes, glints, pulses, flips, slams, particle bursts, and number-count animations are suppressed.

## Markup example

```html
<section id="screen">
  <div data-sd-enter="scene"></div>
  <div data-sd-enter="character-left"></div>
  <div data-sd-enter="character-right"></div>
  <h1 data-sd-enter="title" class="sd-glint">CAREER STATISTICS</h1>
  <article data-sd-enter="panel"></article>
  <article data-sd-enter="panel"></article>
  <button data-sd-enter="button">CONTINUE</button>
</section>
<script>
  sdEnter(document.querySelector("#screen"));
</script>
```

Use `data-sd-enter` only for the elements participating in the shared entrance. Screen-specific state changes may call `sdReveal`, `sdBurst`, or `sdCountUp`; do not duplicate the timing constants locally.

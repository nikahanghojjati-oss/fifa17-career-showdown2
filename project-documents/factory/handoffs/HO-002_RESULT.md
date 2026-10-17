# HO-002 result · Calm stage atmosphere (job V-244)

**Choice:** the dust and the flare play **once** when a stage screen opens, then hold still.
- Dust: each speck fades in and drifts a short way up (4 to 7.5 s, all starting within 2.4 s), then stays where it landed at its resting brightness. The stage is fully still about 10 s after the screen opens.
- Flare: one gold sweep across the screen, 0.8 s after opening, 3.6 s long, then hidden.
- Vignette, grain, rims and panels are unchanged. Reduced-motion users still get no atmosphere at all (existing rule).
- Why this option: it keeps the "arriving in the stadium" moment Nik approved, and a still stage draws no frames, so the `backdrop-filter` panels are not re-blurred while the screen sits idle. No panel needed a redesign.

## Files (copy both into the live game as they are)
- `visual-assets/v10_1/shared/stage.css`: `sd-dust-drift … infinite` became `sd-dust-settle … 1 both`; `sd-flare-sweep 15s infinite` became `sd-flare-once 3.6s .8s 1 both` (ends hidden). `will-change` removed.
- `visual-assets/v10_1/shared/stage.js`: dust timings only (duration 4 to 7.5 s, positive delay under 2.4 s, smaller sideways drift).
- Both start from main r56 (00a1eb8), so Team G's pointer-pause block is still there. It is harmless now (it only pauses the opening drift); Team G may keep it or drop it.

## Measured (headless Chromium, 1920x1080, live layout from main 00a1eb8, measured 11 s after opening)

| Screen | Idle fps before (r56) | Idle fps after | Running animations at idle, after | fps while mouse sweeps, after |
|---|---|---|---|---|
| Settings | 13.1 to 16.8 | **60.2 to 60.3** | 0 | 60.1 |
| Rule Book | 21.7 | **60.2** | 0 | (not run) |
| Standings | 18.6 | 36.0 to 37.8 | 1 (loading spinner) | 36.7 |

Standings note for Team G: in this offline test Standings stays on its loading state, and its spinner (`sdg-spin 1s infinite`, standings.css:47) keeps redrawing under the blurred panels. Once real data arrives the spinner goes away and Standings is still like the others. If Standings can stay "loading" for a long time on a real device, tell Team V and we will swap the spinner for a still "Loading" mark.

Probe: `project-documents/factory/tools/stage_fps_probe.js` (serve the site, then `NODE_PATH=$(npm root -g) SETTLE=7000 node stage_fps_probe.js http://localhost:PORT settings label`).

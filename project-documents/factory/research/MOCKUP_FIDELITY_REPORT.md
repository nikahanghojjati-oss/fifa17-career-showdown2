# Mockup fidelity research: how close can we get, and how

Date: 2026-10-02 · Author: Claude (visual lead) · Branch: `research/mockup-fidelity-jcv18a`
Scope: research only. No screen was built or changed. `main` untouched.
Evidence read: `claude-cloud/home-v1`, `league-v1`, `club-v1` (evidence shots, plates, platemaps, BUILD_RESULT), `claude-cloud/hlc-goals` (goals, intake reports).

## 1. Short answer

| Surface | Realistic match | Why |
|---|---|---|
| Desktop 16:9 (1920x1080, 1366x768) | **Scene ≈ pixel-exact. Whole screen ≈ 85–90 % "looks like the mockup"**, not 100 %. | The scene (stadium, Daniel, Nik, hands, packs) *is* the mockup's own pixels, so it can be exact. The UI can't be: the mockup shows invented buttons, a fake top nav, real-looking logos and wrong numbers; the product needs real buttons, real data and our original crests. Brush titles, glow and spacing can be matched closely. |
| Phone 393x660 | **Same look and mood, not the same picture.** | A 16:9 mockup squeezed into a 0.6:1 phone either shrinks the heroes to thumbnails (what we have now) or crops them out. Pixel matching is impossible by geometry. The answer is a separate portrait composition per screen, made from the same art. |

Pixel-for-pixel on the *whole* screen is neither possible nor wanted: the 10–15 % that differs is exactly where the product must be true.

## 2. What we measured

Method: build evidence screenshot vs Nik's mockup, both centre-cropped to 16:9 and compared at 960x540. SSIM (structure, grey), CIEDE2000 colour difference, and SSIM inside the platemap's protected boxes (faces, hands, packs). The clean plate is also scored against the mockup: that is the ceiling for a plate+overlay build. Tool: `mockup_diff.py` (this folder).

| Screen @1920x1080 | Plate vs mockup SSIM | Build vs mockup SSIM | Colour ΔE (plate → build) | Faces / hands in place | Gate (§5) |
|---|---|---|---|---|---|
| Home (HM1) | 0.58 | 0.50 | 11.2 → 13.4 | 0.99 / 0.99 | PASS |
| League (L1) | 0.77 | 0.68 | 7.4 → 8.8 | 0.99 / 0.81 (finger overlay on wheel, intended) | PASS |
| Club (CL1) | 0.72 | **0.28** | 8.5 → 14.7 | **0.15–0.24** | **FAIL** |

(At 1366x768 the result is the same: Home and League pass, Club fails.)

Where they differ most (heatmaps: `*_heatmap_1920.jpg`; side by side: `club_side_by_side_1920.jpg`; phones: `phones_393x660_home_league_club.jpg`):

1. **Scene registration (Club).** Club's `plateToScreen` zooms and re-centres the plate on desktop, so Daniel, Nik and the packs are bigger and in other places than in the mockup. This alone is most of Club's gap. Home and League keep the plate where the mockup has it, and their faces/hands score 0.99.
2. **Titles.** The mockups use a hand-brushed gold title (CLUB ASSIGNMENT, SELECT LEAGUE). Builds use a clean block font (Club, League) or a smaller wordmark (Home). This is the most visible "feel" loss after registration.
3. **Panels too heavy.** Club puts the title, rail and VS in boxed dark-glass panels. Those "covers" exist to hide the edges of areas that were cleaned out of the plate. The mockup has text floating over the scene. Home's tiles are flat dark boxes; the mockup's tiles carry big illustrated objects (17 shirt, trophy, tactics board, binder).
4. **Wheel.** League's wheel is a flat vector disc; the mockup has a thick lit gold rim and depth.
5. **Phone.** All three put the scene in a short top strip and stack UI below. Readable and no-scroll, but the heroes become thumbnails and the cinematic feel is mostly gone.

## 3. Techniques assessed

| Technique | Verdict | Notes |
|---|---|---|
| **Clean plate + live HTML overlay** (current) | **Keep: the right core method.** | Gives pixel-exact scene, real buttons, real data, semantic DOM, accessible. Proven: Home/League faces 0.99. The rule that must be added: the plate is never zoomed or moved on desktop 16:9 (§4.1). |
| Fully clean plates (no visible zone edges) | **Upgrade.** | Ask ChatGPT for a clean plate where every removed area is fully repainted scene. Then no "cover" panels are needed and UI can float like in the mockup. Intake gate already measures zone tone; add "zone edge visible = fail". |
| Layered cut-outs (Daniel, Nik, hands, props as separate transparent PNG/WebP over a background plate) with rim light + soft shadow in CSS | **Use for phone + hands-on-object moments.** | Lets the phone place the two heroes large in a portrait frame and lets a finger sit *on* the wheel or pack (League already does this with `OVL_DANIEL_FINGER`). Cut-outs come from the same mockup pixels (mask, not redraw), so likeness stays exact. Rim light = `filter: drop-shadow()` in gold; contact shadow = blurred radial gradient. Cost: one mask per character per screen. |
| **Separate portrait composition for phone** | **Required for "cinematic on phone".** | Per screen: a 393x660 layout where the two cut-out heroes stand large at the top half, Daniel left, Nik right, slightly overlapping the UI (the mockup feel), over a portrait crop/extension of the stadium (ChatGPT outpaint to 9:16). Buttons in the bottom 45 %. Mockup-diff does not apply; the gate is "same elements, same order of importance, no scroll". |
| CSS/SVG vs baked art | **Rule: anything with data, text or state is live; anything purely decorative and static may be baked.** | Live: titles' words if they change, all buttons, numbers, names, crests (code-drawn), wheel segments. Baked OK: brush title as an image *per fixed screen title* (CLUB ASSIGNMENT never changes → a WebP wordmark with `alt`/visually hidden text; Home already does this), wheel rim and glow, tile illustrations, trophies (our originals), frames. |
| Motion | **Small and cheap only.** | Ambient: slow light sweep on gold, 2–3 % parallax between cut-out and background, spark particles via CSS. Hero moments (wheel spin, pack rip) already exist. All behind `prefers-reduced-motion`. No video backgrounds (weight, iOS autoplay rules). |
| Image weight | **Budget per screen: ≤ 450 KB phone, ≤ 900 KB desktop on first paint.** | Current 2X plates are 0.3–0.7 MB WebP and the 2X PNGs (1.9–5.6 MB) must never ship. Serve WebP (Safari 14+ OK); AVIF optional with WebP fallback via `<picture>`. Phone loads a portrait asset at ~1179 px wide, not the 3072 px desktop plate. Firebase Spark hosting is fine with this (10 GB storage, 360 MB/day transfer: two players are far below). |
| Safari limits | Note for builders. | Use `svh`/`dvh` units for the 660-px visible area; `backdrop-filter` needs `-webkit-` prefix and is costly on big areas; keep decoded images under ~16 MP each on iPhone; avoid `background-attachment: fixed`; test fonts load before measuring. |
| **Automated mockup-diff gate** | **Adopt for desktop review jobs.** | `mockup_diff.py` gives scores + heatmap + side-by-side in a few seconds, no browser needed beyond the screenshot. It catches the Club class of problem (scene moved) instantly. It is a floor, not the verdict: the human/Claude look still decides "pretty". |

## 4. Recommended method (for every remaining screen and the polish jobs)

1. **Desktop = mockup registration.** At 16:9 the plate is drawn exactly where the mockup has it (`background-size: cover`, centred, no extra zoom). Other desktop ratios may crop the edges but never scale faces more than ±5 % from the 16:9 position. UI goes into the areas the mockup used for UI.
2. **Fully clean plates** from ChatGPT, so UI floats on the scene without cover panels. Panels only where the mockup has panels.
3. **Fixed titles as brush wordmark images** made from the mockup's own lettering (cleaned and traced crop or ChatGPT re-letter), with real text for screen readers. Live text uses the system fonts.
4. **Mockup objects become art assets**: tile illustrations, wheel rim, trophies, packs, frames are cut or regenerated as original transparent WebP, not replaced with flat boxes.
5. **Phone = its own composition**: cut-out heroes large on top, Daniel left, portrait stadium behind, controls below; one ticket per screen for the portrait background.
6. **Data last, visuals now** (see §6): build each screen against labelled fixtures that match the real data shape.

## 5. Changes for the factory job files

Add to every screen job (or to the factory rules once):

**Quality bar (desktop):** "The scene must sit exactly where the mockup has it. Put your 1920x1080 screenshot next to the mockup: the faces, hands and props must overlap. Titles use the brush wordmark, not a font. No panel behind text unless the mockup has one there. Every illustrated object in the mockup has an art asset in the build."

**Review gate (desktop, automated):** run
`python3 project-documents/research/mockup-fidelity/mockup_diff.py --mockup <mockup> --build <1920x1080 shot> --plate <plate 1X> --platemap <platemap.json> --out evidence/diff/`
and pass all of: faces ≥ 0.90, other protected boxes ≥ 0.75, SSIM ≥ plate SSIM − 0.15, ΔE ≤ plate ΔE + 6. Commit `scores.json`, `heatmap.jpg`, `side_by_side.jpg`. A fail means fix registration first. Passing the numbers does not replace the look review.

**Phone composition (every screen):** "Phone is a separate layout, not a shrunk desktop. Top ~55 %: Daniel (left) and Nik (right) as cut-outs, large, heads fully visible, over a portrait stadium. Bottom ~45 %: the primary action and the few buttons the screen needs; extra content goes in tabs or a sheet. 393x660 no scroll, 360x640 no scroll, 375x553 primary visible." Each screen job needs one image ticket for the portrait background and the cut-out masks.

**Weight:** ≤ 450 KB phone / ≤ 900 KB desktop first paint, WebP, `<picture>` with a phone source; never ship the PNG masters.

**Polish jobs 10–12 (Home, League, Club):** Club: remove the desktop zoom so the plate registers (biggest single gain, gate fails today); replace boxed title/VS with brush wordmark floating; League: lit gold wheel rim asset, brush title; Home: illustrated tiles, larger wordmark. All three: phone portrait composition.

## 6. "Do we wait for gameplay, or build now?"

Build the visuals now. Wait only on data wiring where the data doesn't exist yet.

- Every screen is two layers: the **look** (plate, art, layout, motion) and the **data contract** (which buttons, which numbers, which states). The look does not depend on gameplay being finished.
- Before a job starts, freeze the screen's contract from production main: the buttons it really has, the fields it really shows, its states (empty, active, completed). Build the look against labelled fixtures with that exact shape.
- Screens whose data already works on main (Home, League, Club, Transfer, Season Results, Start/Join, Rule Book, Settings): build fully now.
- Screens whose data is still being decided (online History/Legacy, Trophy Room counts, Statistics/Rivalry that read closed Showdowns, job 14): build the look now with fixtures; wire live data after the history-data job lands. Remove any stat the game doesn't record from the design now so nothing has to be redrawn later.
- The risk of building early is small rework if gameplay adds or removes a button. The fixed contract keeps that to a swap of a label or a slot, not a redraw.

#!/usr/bin/env python3
"""Generates project-documents/factory/{jobs,status}/JOB-NNN.md, BOARD.json and BOARD.md."""
import json, os, sys
import re
sys.path.insert(0, os.path.dirname(__file__))
from screens import NEW_SCREENS, SYSTEM_SCREENS

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../.."))
F = os.path.join(REPO, "project-documents/factory")
BR = "factory/v1-wtt5ye"
V = "visual-assets/v10_1"
SOL = "GPT-5.6 Sol chat"
SOL_SHOTS = "GPT-5.6 Sol chat (Work mode if job 0 found the chat cannot take screenshots)"
WORK = "GPT-5.6 Sol, Work mode (needs a terminal)"
CODEX = "Codex (review only)"

JOBS = []

def job(key, title, phase, typ, worker, deps, steps, goal, read=(), mockup=(), truth=(), inputs=(), deliverables=(), selfcheck=(), done="", waits=None, look=False, note=None, team_g=None):
    JOBS.append(dict(key=key, title=title, phase=phase, type=typ, worker=worker, deps=list(deps), steps=steps, goal=goal, team_g=team_g,
                     read=list(read), mockup=list(mockup), truth=list(truth), inputs=list(inputs), deliverables=list(deliverables),
                     selfcheck=list(selfcheck), done=done, waits=waits, look=look, note=note))

BASE_READ = ["project-documents/factory/FACTORY_RULES.md (you already follow it)", "project-documents/factory/PRODUCT_TRUTH.md", "project-documents/factory/QUALITY_BAR.md"]
CRAFT = "project-documents/factory/CRAFT_GUIDE.md"

# ---------------------------------------------------------------- Phase 0: setup
job("smoke", "Factory smoke test", "0 Setup", "test", SOL, [],
 goal="Find out exactly what a factory chat can do, so every later job is routed correctly. This job makes no product changes.",
 read=BASE_READ,
 steps=[
  "Repo read: open project-documents/factory/BOARD.md on branch " + BR + " and quote its first line in the status notes. If you cannot read the repo, write that and continue with the steps you can do.",
  "Repo write: create `project-documents/factory/smoke/hello.md` containing the date, time (UTC) and the words \"factory chat can write\". Commit it with the message \"Job 0 step 2/7: write test\" to " + BR + ". Record in the status file whether the push worked (yes/no and the error if no).",
  "Python: in your code tool run `import PIL, numpy; print(PIL.__version__, numpy.__version__)`, then try `import cv2` and `import skimage` (scikit-image runs the mockup-diff review gate; if missing, try `pip install scikit-image`). Record versions or the errors.",
  "Browser: try to render `" + V + "/home/index.html?frame=HM2` from the repo (serve the repo with `python3 -m http.server 8765` in your code tool and use Playwright/Chromium if available). Take screenshots at 1366 × 768 and at 393 × 660 (DPR 3). Save them as `project-documents/factory/smoke/home_1366x768.png` and `home_393x660.png`. If no browser is available, write exactly what failed.",
  "Images: ask your image tool for one tiny test image: \"A plain black square with one small gold five-point star in the centre. No text.\" Record whether image generation works in this chat and whether you can save the result into the repo (commit it as `project-documents/factory/smoke/image_test.png`).",
  "Fill in `project-documents/factory/smoke/CAPABILITIES.md` with a table: repo read, repo write, python+PIL, numpy, cv2, scikit-image, browser screenshots, image generation, image save to repo, each YES or NO with one line of detail.",
  "Routing verdict: at the top of CAPABILITIES.md write one of: **ALL GREEN** (everything yes), **NO SCREENSHOTS** (reviews and builds must run in Work mode), **NO PUSH** (chats hand zip files to Nik), or **NO IMAGES** (image jobs move to Nik's plain chats). Commit and finish.",
 ],
 deliverables=["project-documents/factory/smoke/CAPABILITIES.md", "the two screenshots and the image test, if possible"],
 selfcheck=["Every capability has a YES/NO and evidence.", "No file outside project-documents/factory/smoke/ and status/JOB-000.md changed."],
 done="CAPABILITIES.md is committed with a routing verdict on its first line.")

job("baseline", "Baseline shots of the four built screens", "0 Setup", "review", SOL_SHOTS, ["smoke"],
 goal="Capture the current state of Home, League, Club Assignment and Transfer War on the consolidated factory branch, so every polish job and reviewer has a clean 'before' and we know the merge of the four build branches still runs.",
 read=BASE_READ + [CRAFT, V + "/home/BUILD_RESULT.md", V + "/league/BUILD_RESULT.md", V + "/club/BUILD_RESULT.md", V + "/tr2/slice-02-plate/BUILD_RESULT.md"],
 steps=[
  "Serve the repo root (`python3 -m http.server 8765`). Open each screen's index.html with its frames (Home HM1–HM3, League L1–L4, Club frames from its BUILD_RESULT, Transfer frames from its BUILD_RESULT) and check the browser console. Write any error per screen in the status notes.",
  "Screenshot every frame at 1366 × 768, 1920 × 1080, 393 × 660 (DPR 3) and 360 × 640 into `project-documents/factory/baseline/<screen>/<frame>_<w>x<h>.png`.",
  "Make one side-by-side sheet per screen: the goal image (`project-documents/factory/mockups/GOAL_*.{jpg,png}`) left, the build's main frame at 1366 × 768 right, same height. Save as `baseline/<screen>/COMPARE.png`.",
  "Run each screen's own `tools/render-qa.cjs` if it runs; record pass/fail counts. A failure caused by the merge (missing file, broken path) is a NOTE with the exact path. Then run the mockup-diff gate on the 1920 × 1080 shot of the main frame of Home, League and Club: `python3 visual-assets/v10_1/shared/tools/mockup_diff.py --mockup <GOAL> --build <shot> --plate <assets/ENV_*_1X.webp> --platemap <assets/platemap.json> --out project-documents/factory/baseline/<screen>/diff/` and record the scores.",
  "Write `project-documents/factory/baseline/BASELINE.md`: per screen, frames captured, console errors, QA counts, and the five biggest visible gaps to the goal image in plain words (e.g. \"Daniel's fingertip stops 6 px short of the wheel rim\"). Commit and finish.",
 ],
 deliverables=["project-documents/factory/baseline/ (shots, compare sheets, BASELINE.md)"],
 selfcheck=["All four screens captured at all four sizes.", "Gap lists are concrete (where, what, how much), not opinions."],
 done="BASELINE.md lists every screen with its shots, QA counts and gap list.")

# ---------------------------------------------------------------- Truth sheets
TRUTH_TARGETS = [
 ("TR", "Trophy Room"), ("CS", "Career Statistics"), ("RV", "Rivalry Statistics"), ("LG", "Legacy (History)"),
 ("SR", "Season Results"), ("FW", "Final Winner"), ("SJ", "Start / Join"), ("RB", "Rule Book"), ("ST", "Settings"), ("LD", "Loading"),
]
LOADING = dict(name="Loading", folder="loading", truth_src=["index.html (#loadingScreen)", "js/app.js / js/screens.js (loading flow)", "css/app.css (loading styles)", "THIRD_PARTY_NOTICES.md (Reus credit)"],
               frames="LD1 loading in progress · LD2 loading done/handoff to Home · LD3 slow network message (if the product has one)")

def spec_for(code):
    return NEW_SCREENS.get(code) or SYSTEM_SCREENS.get(code) or LOADING

CONTRACT_SECTION = {"TR": "§7 Trophy Room, §6 what counts", "CS": "§6 Career Statistics with its what-counts table", "RV": "§5 Rivalry Statistics", "LG": "§8 History / Legacy, §6 what counts",
 "SR": "§3 Season Results", "FW": "§4 Final winner", "SJ": "§2 Start / Join", "ST": "§10 top bar: Settings holds the credits and the app version"}
CONTRACT_TRUTH = {
 "SR": ["Contract §3 phases are exact: `entering` / `waiting-for-rival` (own inputs published, rival not yet) / `results-ready` (both published: BOTH managers' inputs are now visible, commit pending) / `committed`. The rival's inputs never show before `results-ready`.", "The awards bonus field is named `awardsBonus` (the adapter renames the provider's `individualAwardsBonus`). `tiebreak` (`none` / `league-position` / `league-points` / `draw`) feeds the \"How scoring works\" pop-up; Team G adds it (G-5), so preview it from fixtures."],
 "FW": ["Contract §4: `margin` is the absolute points difference, 0 for a draw. `state` is `completion-pending` (result shown with a visible \"Completion pending\" mark) or `completed`. The final winner is decided by total points only; equal totals are a draw."],
 "ST": ["Settings holds the app version and repeats the Reus photo credit (contract §10). The credit ALSO stays on the Loading screen itself (OWNER-4); Settings never replaces it."],
 "LD": ["The Reus photo credit stays visible on the Loading screen (OWNER-4). The phone bottom bar is hidden on Loading."],
}
for code, nm in TRUTH_TARGETS:
    s = spec_for(code)
    folder = V + "/" + s["folder"]
    job("truth_" + code, "Truth sheet: " + nm, "1 Truth", "data", SOL, [],
     goal=f"Write down exactly what the real product shows on the {nm} screen, so the build cannot invent or lose anything. You read code on `main`; you change nothing there.",
     read=BASE_READ + ["project-documents/factory/DATA_CONTRACT_V1.md (the agreed data contract with Team G)", "Product code on branch `main`: " + ", ".join(s["truth_src"]), "The existing truth sheet example: " + V + "/home/fixtures.json"],
     mockup=([f"Mockup: project-documents/factory/mockups/{s['mockup']}. Use it only to know which mockup elements need a product answer (every button, tile, stat and label in it)."] if s.get("mockup") else []),
     truth=(s.get("overrides") or []) + CONTRACT_TRUTH.get(code, []) + ["Fixture values respect DATA_CONTRACT_V1 §0 bounds: `totalSeasons` 1, 3, 5 or 10; leagues `premier_league`, `laliga`, `serie_a`, `ligue_1` (20 teams) and `bundesliga` (18); league position 1..teams; league points 0..(teams − 1) × 6; league goals 0..300. Managers keyed `daniel` (always left) and `nik`."],
     steps=[
      f"Find the screen in `main`: the function that renders it, its route (how it is opened and how Back works), and every element id and class the product's tests or other code depend on. List them in `{folder}/TRUTH.md` under \"Ids and routes\".",
      "List every button the live site really has on this screen (what it does, where it goes) and every visible string exactly as the product writes it (labels, headings, buttons, empty/loading/error messages, aria-labels). Note which strings change with state.",
      "DATA CONTRACT: write a section \"Data contract\" in TRUTH.md. It must cite `project-documents/factory/DATA_CONTRACT_V1.md` (agreed by Team G; " + CONTRACT_SECTION.get(code, "§0 only: this screen shows no history data") + "): every field this screen shows, with its exact contract name, E or A (exists on main / Team G adds it), its source (function and file on main) and its level (per season, per Showdown or per career). Anything the contract does not list is dropped from the screen (contract §9 lists the dropped stats). Use the contract's five screen states (`loading`, `empty`, `unavailable`, `partial`, `ready`) and its exact interim label \"Current Showdown only. Career history is not yet available.\" The build uses only these fields, on clearly labelled sample data; Team G's model-true fixtures (G-11) replace the samples later in job 104.",
      "List every state the screen can be in (loading, empty, partial, unavailable, error, active, completed, per role Daniel/Nik). Turn these into preview frames: " + s["frames"] + ". Adjust the list to what the product really has and explain any change.",
      ("Open the mockup IMAGE itself from the ChatGPT project Files (not a description of it; if it is not there, set BLOCKED) and go through it element by element, including the top bar, sub-navigation, banners, slogans and footer, and write a table: mockup element → product answer (KEEP as is / KEEP with product wording / CHANGE to ... / DROP because ...). Use PRODUCT_TRUTH.md for rights, scoring and history rules." if s.get("mockup") else
       "This screen has NO mockup image, so do not look for one. Its reference is the live screen on `main`: go through the live screen element by element (from the code you listed in steps 1–2; render it in your browser tool if you can) and write a table: live element → answer for the new look (KEEP as is / KEEP with new styling / CHANGE to ... / DROP because ...). The look comes from the Showdown system (CRAFT_GUIDE §4 and the other screens' mockups), not from a mockup of this screen. Use PRODUCT_TRUTH.md for rights and history rules."),
      f"Write `{folder}/fixtures.json` in the same shape as the Home example: `strings`, `ids`, `frames` (each frame: the values to show, clearly fictional preview values, a `previewLabel: \"Preview data\"`), and `routes`. Daniel is always listed first. Each frame carries a `context` block (season, totalSeasons, leagueId, clubs) where the screen shows them. Include at least one frame where Nik leads (rows stay Daniel-first; rank is shown with #). Write the words for the loading, empty, partial and unavailable states yourself as new copy marked `\"source\": \"new\"` (never leave a contract token like LOADING as the text). Then put the plain season inputs behind every number into a top-level `checkSource` block (shape at the top of `visual-assets/v10_1/shared/tools/check_fixtures.py`) and run `python3 visual-assets/v10_1/shared/tools/check_fixtures.py <your fixtures.json>`. It recomputes every score, winner, total, trophy count and career figure, and rejects impossible data (shared league positions, both managers winning the same cup or award, Showdown lengths other than 1/3/5/10). Make every number on the screen match its output, fix the fixtures until it prints 0 errors, and paste the output into the status notes.",
      "Write a short \"Open questions\" section. If a question blocks the build (the product truly does not say), set State: BLOCKED with the question. Otherwise finish.",
     ],
     deliverables=[f"{folder}/TRUTH.md", f"{folder}/fixtures.json"],
     selfcheck=["Every string is copied, not paraphrased (spot-check five against the code).", "Every mockup element has a product answer.", "No invented stats; unrecorded stats are marked DROP.", "Daniel first everywhere."],
     done="TRUTH.md and fixtures.json are committed and the mockup table is complete.")

# ---------------------------------------------------------------- Foundation
SH = V + "/shared"
job("tokens", "Showdown tokens and type system", "2 Foundation", "build", SOL_SHOTS, ["smoke"],
 goal="One shared stylesheet for colour, gold, type, title treatment and spacing, so every screen looks like one game.",
 read=BASE_READ + [CRAFT, V + "/home/home.css", V + "/league/league.css", V + "/club/club.css", V + "/tr2/slice-02-plate/plate.css", "css/app.css on main (manager accent colours)"],
 mockup=["All mockups in project-documents/factory/mockups/: study the gold (metallic, warm, never brown), the black glass panels, the brush titles, the letter-spaced eyebrows and the heavy condensed numbers."],
 steps=[
  "Collect the colours, fonts and sizes the four built screens already use (grep their CSS). Write the list into `" + SH + "/TOKENS_NOTES.md` with where each value came from. Where screens disagree, pick the value closest to the mockups and say why.",
  "Write `" + SH + "/showdown-tokens.css`: CSS custom properties prefixed `--sd-` for black/panel/glass, the gold ramp (`--sd-gold-100…900`), text colours, manager accents (`--sd-daniel`, `--sd-nik`, taken from main's CSS if they exist), edge widths, corner cut size, radius, 8 px spacing scale, shadows (contact, panel, glow), z-index layers for the depth sandwich (plate 0, atmosphere 1, ui 2, cutout 3, light 4), and motion durations/easings.",
  "Add `@font-face` for Kaushan Script, Barlow Condensed 600/700 and Barlow 400/600 from `" + V + "/tr2/slice-02-plate/assets/fonts/` (copy the woff2 files to `" + SH + "/fonts/`, `font-display: swap`).",
  "Write the title system in `" + SH + "/showdown-type.css`: `.sd-eyebrow` (crown + letter-spaced line), `.sd-title` (brush, metallic gradient text with `background-clip:text`, dark outer shadow, slight skew on the title only), `.sd-tagline`, `.sd-label`, `.sd-number` (tabular, condensed, 3 sizes), body text. Titles scale with `clamp()` between phone and 1920 desktop.",
  "Build `" + SH + "/specimen.html`: every token swatch, the title block with \"TROPHY ROOM\" and \"SEASON RESULTS\", number sizes, labels, on the dark stadium plate from `" + V + "/home/assets/ENV_HOME_PLATE_V1_1X.webp` as background.",
  "Screenshot the specimen at 1366 × 768 and 393 × 660 into `" + SH + "/evidence/`, put it side by side with the title area of MOCKUP_TROPHY_ROOM.png, and adjust until the title reads as the same family (weight, gold, glow). Commit and finish.",
 ],
 deliverables=[SH + "/showdown-tokens.css", SH + "/showdown-type.css", SH + "/fonts/", SH + "/specimen.html", SH + "/TOKENS_NOTES.md", SH + "/evidence/"],
 selfcheck=["Title next to the mockup title: same family at a glance.", "Body text contrast ≥ 4.5:1 on panel glass (measure two samples).", "No existing screen file changed."],
 done="Tokens, type and specimen are committed with evidence.")

job("kit", "Panel, button and table kit", "2 Foundation", "build", SOL_SHOTS, ["tokens"],
 goal="Reusable UI pieces that look exactly like the mockups: gold-edged glass panels with the corner cut, buttons, tabs, stat rows, tables, chips, toggles, confirm dialog.",
 read=BASE_READ + [CRAFT, SH + "/showdown-tokens.css", SH + "/showdown-type.css"],
 mockup=["MOCKUP_CAREER_STATISTICS.png: headline tiles, table with highlighted leader row, comparison bars, leader cards, primary and secondary buttons.", "MOCKUP_RIVALRY_STATISTICS.png: comparison rows with centre icons, head-to-head numerals.", "MOCKUP_TROPHY_ROOM.png: tab bar on a panel edge.", "MOCKUP_SEASON_RESULTS.jpg: inputs, checkboxes, score bar, two panel temperatures (gold for Daniel, silver for Nik)."],
 steps=[
  "Write `" + SH + "/showdown-ui.css` with `.sd-panel` (glass, edge, inner glow, corner cut via `clip-path`, optional header with gold rule line), `.sd-panel--hero`, `.sd-panel--daniel` (warm gold edge) and `.sd-panel--nik` (cool silver edge).",
  "Buttons: `.sd-btn--primary` (solid gold, black text, icon slot, chevron), `.sd-btn--secondary` (dark, gold outline), `.sd-btn--danger` (red edge, only inside confirms), `.sd-icon-btn` (44 × 44). States: hover glow, active press (translateY 1 px), focus ring (2 px gold + 2 px black offset), disabled 45 %.",
  "Data pieces: `.sd-tile` (icon, label, big number), `.sd-table` (leader row highlight, tabular numbers), `.sd-compare-row` (left number, icon, label, right number), `.sd-split-bar`, `.sd-tabs` (panel-edge tab bar and chip variant), `.sd-chip`, `.sd-toggle`, `.sd-check` (gold tick stamp), `.sd-input` (16 px+), `.sd-select`.",
  "Overlays: `.sd-sheet` (phone bottom sheet / pop-up) and `.sd-confirm` dialog with focus trap notes, and a `.sd-preview-tag` (\"Preview data\") chip.",
  "Build `" + SH + "/kit.html` showing every piece in every state on the stadium plate, with a phone section at 393 px width.",
  "Screenshot kit.html at 1366 × 768 and 393 × 660; crop the table and tiles next to the same parts of MOCKUP_CAREER_STATISTICS.png into `" + SH + "/evidence/kit_compare.png`; adjust until edges, glow and spacing match. Commit and finish.",
 ],
 deliverables=[SH + "/showdown-ui.css", SH + "/kit.html", SH + "/evidence/kit_*.png"],
 selfcheck=["Every piece has hover, focus, active and disabled states.", "Touch targets ≥ 44 px on phone.", "Kit pieces next to the mockup crops look like the same game."],
 done="Kit and specimen page committed with the compare crop.")

job("cutout", "Character cut-out tool and standard", "2 Foundation", "build", SOL, ["smoke"],
 goal="A small, reliable Python tool that turns a plate and a polygon into a clean cut-out overlay (a hand, an arm, a whole figure) without halos, so characters can stand in front of the UI.",
 read=BASE_READ + [CRAFT, V + "/league/tools/make_finger_overlay.py", V + "/club/tools/make_hand_masks.py", V + "/club/assets/handmap.json", V + "/league/assets/platemap.json"],
 steps=[
  "Read the two existing overlay tools and write down in `" + SH + "/CUTOUT_STANDARD.md` what they do (inputs, edge handling, output sizes).",
  "Write `" + SH + "/tools/cutout.py`: inputs plate PNG, a polygon or list of polygons (from a platemap JSON key), output name. Steps: rasterise the polygon at plate size; refine the mask on edges by colour difference to the local background (simple: grow/shrink by 2 px and pick pixels whose colour is closer to the inside mean); erode 1 px; feather 1 px; decontaminate edge pixels (un-premultiply and pull edge colour toward the inside colour); write RGBA PNG at 1X and 2X; print bbox and SHA-256.",
  "Add `--rim` to also write a matching rim-light mask (the outer 3 px band of the alpha) as a separate PNG that CSS can tint gold.",
  "Test it on the League plate: re-create Daniel's finger overlay from `league/assets/platemap.json` and compare with `OVL_DANIEL_FINGER_V1_2X.png` (alpha difference, edge sharpness). Save before/after crops at 400 % zoom to `" + SH + "/evidence/cutout_test.png`.",
  "Finish CUTOUT_STANDARD.md: how to draw polygons (points on the inside edge of the figure, 10–40 points, hair kept soft), how to name files (`OVL_<SCREEN>_<PART>_V1_{1X,2X}.png`), how to place them in CSS (same container and transform as the plate), how to add the contact shadow and rim light. Commit and finish.",
 ],
 deliverables=[SH + "/tools/cutout.py", SH + "/CUTOUT_STANDARD.md", SH + "/evidence/cutout_test.png"],
 selfcheck=["At 400 % the test cut-out has no light or dark ring.", "The tool runs with only PIL and numpy."],
 done="Tool, standard and test evidence committed.")

job("stage", "Cinematic stage engine", "2 Foundation", "build", SOL_SHOTS, ["tokens", "cutout"],
 goal="One shared way to show a plate with its cut-outs, atmosphere and light layers that stays perfectly registered at every desktop and phone size.",
 read=BASE_READ + [CRAFT, V + "/home/home.css", V + "/home/home.js", V + "/league/league.css", V + "/league/league.js", SH + "/CUTOUT_STANDARD.md"],
 steps=[
  "Study how Home and League place the plate and overlays (object-fit, focal points, scaling). Write the rules into `" + SH + "/STAGE.md`.",
  "Write `" + SH + "/stage.css` and `" + SH + "/stage.js`: a `.sd-stage` container with layers 0–4 (plate, atmosphere, ui, cutout, light). The plate and the cut-outs share one inner box that is scaled with `object-fit: cover` math in JS from the plate's size and a focal point; the UI layer is a normal responsive layout on top. Serve `_2X` files for DPR ≥ 2 (`image-set`).",
  "Phone mode (portrait ≤ 760 px wide): the stage switches to the face band (focal crop from platemap `phone_band`), with the content below. The cut-out layer follows the same crop.",
  "Atmosphere layer: slow drifting dust (CSS, ≤ 30 particles), light flare sweep, vignette. All off with reduced motion.",
  "Light layer: rim-light masks tinted gold (from cutout.py `--rim`), contact shadow helper class, 2 % film grain.",
  "Demo: `" + SH + "/stage-demo.html` with the League plate and Daniel's finger overlay re-done through the engine, plus a fake panel overlapping the hand to prove the sandwich. Screenshot at 1366 × 768, 1920 × 1080, 1366 × 640, 393 × 660 and 360 × 640; check the overlay sits within 1 device pixel of the plate at every size. Commit and finish.",
 ],
 deliverables=[SH + "/stage.css", SH + "/stage.js", SH + "/STAGE.md", SH + "/stage-demo.html", SH + "/evidence/stage_*.png"],
 selfcheck=["Registration within 1 device pixel at all sizes (measure).", "Panel under the hand, hand over the panel, contact shadow visible.", "No layout shift while images load."],
 done="Engine, demo and registration evidence committed.")

job("motion", "Motion kit (pack-rip grade)", "2 Foundation", "build", SOL_SHOTS, ["kit"],
 goal="Shared entrance choreography and reveal effects, so every screen moves like a FIFA menu and nobody hand-writes timings.",
 read=BASE_READ + [CRAFT, SH + "/showdown-tokens.css", V + "/club/club.js (pack open feel)", "js/settings.js on main (reduced-motion setting and how it is stored)"],
 steps=[
  "Write `" + SH + "/motion.css` with keyframes and utility classes: scene-in, character-in-left / -right, title-wipe, glint, panel-rise (with `--i` stagger index), button-pulse, count-up support, crown-pop, card-flip, slam-in.",
  "Write `" + SH + "/motion.js`: `sdEnter(root)` runs the standard order (CRAFT_GUIDE §5) from data attributes (`data-sd-enter=\"panel\"` etc.); `sdCountUp(el, to, ms)`; `sdBurst(canvas, x, y, opts)` gold particles (≤ 60, 900 ms, gravity, fade); `sdReveal(el)` = anticipation + flash + settle. Respect both `prefers-reduced-motion` and the product's own setting (read the same storage key settings.js uses).",
  "Performance rules in `" + SH + "/MOTION.md`: transform/opacity only, `will-change` only during animation, no animation on load-critical layout, total entrance ≤ 1.2 s, usable at 0.6 s.",
  "Build `" + SH + "/motion-demo.html`: the kit panels entering on the Home plate, a count-up, a crown pop, a card flip and a burst. Add a reduced-motion toggle on the page.",
  "Capture a frame strip (screenshots at 0, 150, 300, 450, 600, 900, 1200 ms) into `" + SH + "/evidence/motion_strip.png`, and with reduced motion. Check 60 fps with a Performance trace if possible (record dropped frames). Commit and finish.",
 ],
 deliverables=[SH + "/motion.css", SH + "/motion.js", SH + "/MOTION.md", SH + "/motion-demo.html", SH + "/evidence/motion_strip*.png"],
 selfcheck=["Usable at 0.6 s, finished by 1.2 s.", "Reduced motion = fades only.", "No dropped frames reported on the demo (or say you could not measure)."],
 done="Motion kit, demo and frame strips committed.")

job("qa", "Shared QA harness and compare sheets", "2 Foundation", "build", SOL_SHOTS, ["smoke"],
 goal="One QA script and one compare-sheet tool every screen uses, so reviews are measured the same way everywhere.",
 read=BASE_READ + [CRAFT, V + "/home/tools/render-qa.cjs", V + "/league/tools/render-qa.cjs"],
 steps=[
  "Write `" + SH + "/tools/factory-qa.cjs` (Playwright): arguments base URL, screen folder, frame list. For each frame and viewport (1366×768, 1440×900, 1920×1080, 1366×640, 393×660 DPR 3, 360×640, 375×553, 390×844, 430×932) take a screenshot and measure: page scroll (html, body, stage), every visible button/link/input fully inside the viewport, primary action visible, input font sizes, console errors and failed requests, and that every string in fixtures.json for that frame is present.",
  "Add checks for H1 (a `data-manager=\"daniel\"` element is left of `data-manager=\"nik\"` in every frame; screens must set these attributes) and H7 (rerun with `reducedMotion: 'reduce'` and confirm no running animations after 300 ms).",
  "Write `evidence/qa_report.json` and a short `evidence/QA_SUMMARY.md` per run (gate, pass/fail, details).",
  "Write `" + SH + "/tools/compare_sheet.py`: mockup + screenshot → side-by-side (same height) + 50 % overlay + a 4 × zoom strip of given boxes (faces, hands) → one PNG.",
  "Run both on Home (HM2) as a test and commit the outputs to `" + SH + "/evidence/qa_test/`. Write usage in `" + SH + "/QA.md`. Commit and finish.",
 ],
 deliverables=[SH + "/tools/factory-qa.cjs", SH + "/tools/compare_sheet.py", SH + "/QA.md", SH + "/evidence/qa_test/"],
 selfcheck=["The Home test run reports the same no-scroll results as Home's own harness.", "The compare sheet shows the mockup and build at identical scale."],
 done="Harness and compare tool committed with the Home test run.")

job("found_review", "Foundation review", "2 Foundation", "review", SOL_SHOTS, ["kit", "stage", "motion", "cutout", "qa"],
 goal="An independent check that the shared foundation is AAA before twenty screens are built on it. You did not build any of it.",
 read=BASE_READ + [CRAFT, SH + "/TOKENS_NOTES.md", SH + "/STAGE.md", SH + "/MOTION.md", SH + "/CUTOUT_STANDARD.md", SH + "/QA.md"],
 steps=[
  "Open specimen.html, kit.html, stage-demo.html and motion-demo.html at 1366 × 768 and 393 × 660. Screenshot each.",
  "Compare kit pieces with crops of MOCKUP_CAREER_STATISTICS.png, MOCKUP_RIVALRY_STATISTICS.png and MOCKUP_SEASON_RESULTS.jpg using compare_sheet.py.",
  "Zoom the stage demo's cut-out to 400 %: halo, seam, registration.",
  "Score criteria 4, 5, 6, 8 and 10 of QUALITY_BAR (the ones the foundation controls) with evidence; check H6, H7, H8.",
  "Write `" + SH + "/review/REVIEW_FOUNDATION.md` with verdict, scores and a numbered fix list. If FAIL, fix the items yourself only if each is a one-line value change; otherwise leave them for Claude. Commit and finish.",
 ],
 deliverables=[SH + "/review/REVIEW_FOUNDATION.md"],
 selfcheck=["Every score has evidence.", "The fix list is exact (file, selector, value)."],
 done="Review committed with a verdict.", look=True)

# ---------------------------------------------------------------- Art: trophies
TROPHIES = [
 ("showdown", "Showdown Champion trophy", "TRO_SHOWDOWN_CHAMPION_V1",
  "a tall, original gold trophy: a polished gold football held inside an open cage of three swept gold ribbons that rise from a fluted stem, topped by a small five-point crown; a wide black-and-gold stepped base with an empty gold band where a nameplate could go. Heroic, the most important trophy of the set, like the centre trophy in the Trophy Room mockup but without any text or ribbons with writing."),
 ("league", "League Title trophy", "TRO_LEAGUE_TITLE_V1",
  "an original silver-and-gold league title trophy: a slim silver urn with two thin upright handles shaped like stylised laurel leaves, a gold band of small stars around the middle, standing on a round dark wood-and-gold plinth with an empty gold band. It must not look like any real league's trophy (no crown on a lion, no ribbons with colours, no Schale plate)."),
 ("cup", "Domestic Cup trophy", "TRO_DOMESTIC_CUP_V1",
  "an original classic two-handled silver cup, wide round bowl, handles as elegant open loops, a short fluted stem, a lid topped by a small silver football, on a black stepped base with a thin gold rim and an empty gold band. Traditional and elegant, smaller and simpler than the other trophies, clearly not the FA Cup or Copa del Rey shape."),
 ("cont", "Champions League (continental) trophy", "TRO_CONTINENTAL_V1",
  "an original tall continental cup in silver with gold accents: a tall narrow chalice whose two handles are long sweeping wings that rise almost to the rim, a band of eight small stars around the bowl, on a slim silver stem and a black base with a gold rim. Grand and continental in feeling but clearly NOT the real Champions League trophy (no big ear-loop handles, no oversized rounded bowl)."),
]
for k, nm, asset, desc in TROPHIES:
    out = V + "/shared/trophies"
    job("trophy_" + k, "Trophy art: " + nm, "3 Art", "image", SOL + " with image generation", ["smoke"],
     goal=f"One original trophy image for the Showdown: {nm}. Used on Trophy Room, Rivalry, Career Statistics, Final Winner and Home. One image asset only.",
     read=BASE_READ + ["project-documents/factory/smoke/CAPABILITIES.md (if it says NO IMAGES, give Nik the prompt below in a code block and the save path, and wait for his file)"],
     mockup=["MOCKUP_TROPHY_ROOM.png: the lighting of the centre trophy (warm gold key light from upper left, dark stadium bokeh, bright speculars). Copy the lighting and finish, NOT the shapes of the real trophies on the shelf."],
     truth=["Original design only. No real trophy shape, no text, no logos, no numbers, no engraved names. A trophy must be recognisable as 'ours' at 64 px."],
     steps=[
      "Generate the image with exactly this prompt (one image, one request):\n\n```\nCreate a photorealistic product render of " + desc + "\n\nLighting: warm golden key light from the upper left, soft gold rim light on the right edge, deep black background, subtle reflections, premium AAA video-game trophy-room look.\nFraming: the whole trophy centred, front view with a very slight high angle, the trophy fills about 85 % of the image height, nothing cropped.\nPortrait 2:3, the largest size available. Transparent background if available, otherwise pure black (#000000) background.\nNo text, no letters, no numbers, no logos, no people, no hands.\n```",
      "Check the result against this list: whole trophy visible; no text or logo anywhere; does not resemble a real trophy; looks like the same family as the others in jobs 19–22 (warm gold, black base); crisp edges. If any check fails, open a NEW chat for the retry (max 3 tries) and use the same prompt.",
      f"Background removal: if the background is not transparent, make it transparent in Python (threshold near-black → alpha, feather 1 px, keep the base's shadow as 30 % alpha). Save `{out}/{asset}.png` (full size) and `{out}/{asset}_512.webp` (512 px tall, quality 90).",
      f"Write `{out}/{asset}.md`: prompt used, try number, size, SHA-256 of both files, and a one-line description. Commit and finish.",
     ],
     deliverables=[f"{out}/{asset}.png", f"{out}/{asset}_512.webp", f"{out}/{asset}.md"],
     selfcheck=["No text, no real trophy look-alike (H2, H3).", "Transparent edges clean at 200 % zoom."],
     done="The trophy files and their note are committed.")

# ---------------------------------------------------------------- Art: plates
PLATES = {
 "TR": ("Trophy Room", "MOCKUP_TROPHY_ROOM.png", "trophy-room",
   "the top navigation bar and the top-right icons and the 'More Than A Game' handwriting, the title block (eyebrow, TROPHY ROOM, tagline), the centre trophy and its plinth and nameplate, the category tab bar, the six trophy cards and their panel, the BACK button, the bottom footer bar, and the black ball sculpture with 'CM17' in the lower left",
   "Daniel (left) and Nik (right) with their handwritten name tags, the stadium, the banners with slogans, the lights and confetti"),
 "CS": ("Career Statistics", "MOCKUP_CAREER_STATISTICS.png", "career-statistics",
   "the top navigation bar and sub-navigation, the title block, the four headline tiles, the Career Table panel, the Manager Comparison panel, the Career Leaders panel with its small portraits, the three buttons, the footer bar, and the black ball sculpture lower left",
   "Daniel (left, arms crossed) and Nik (right, hand on chin, watch) with their handwritten tags, the stadium, the banners, the lights"),
 "RV": ("Rivalry Statistics", "MOCKUP_RIVALRY_STATISTICS.png", "rivalry-statistics",
   "the top navigation bar, the title block, the central comparison panel including the two club crests, the three bottom panels, the button, the footer bar and the small caption 'RIVALS BUILD LEGACIES'",
   "Daniel (left, pointing) and Nik (right, arms crossed) with their handwritten tags, the stadium, the banners, the lights. Daniel's pointing hand and fingers must stay completely untouched"),
 "LG": ("Legacy", "MOCKUP_LEGACY_V2.png", "legacy",
   "the top navigation bar, the title block (LEGACY and tagline), the whole archive panel (side menu and all eight Showdown cards with their crests and league logos), the bottom bar with all buttons, and the footer bar",
   "Daniel (left, hand on chin) and Nik (right) with their handwritten tags, the stadium, the banners, the lights. The lower part of both bodies that the panel covered must be painted as their suits continuing down naturally"),
 "SR": ("Season Results", "MOCKUP_SEASON_RESULTS.jpg", "season-results",
   "the top navigation bar, the title block, the scoring system panel with its trophy, both entry panels, both buttons, the footer bar, AND the small white swoosh-like brand mark on Daniel's shirt (paint it as plain black shirt fabric)",
   "Daniel (left, shouting, fist) and Nik (right, fist, '17' and crown on the shirt) with their handwritten tags, the stadium, the pitch, the banners, the lights and the 'RIVALS MAKE LEGENDS' / 'SAME GAME HIGHER STAKES' handwriting"),
 "SJ": ("Start / Join", "MOCKUP_START_JOIN.png", "start-join",
   "the top navigation bar, the title block, the whole central panel (host card, join card, session panel, code, all buttons, lock line, close X), the footer bar, and the black ball sculpture lower left",
   "Daniel (left, pointing) and Nik (right) with their handwritten tags, the stadium, the banners, the lights. Daniel's pointing hand must stay completely untouched"),
}
for code, (nm, mock, folder, remove, keep) in PLATES.items():
    out = f"{V}/{folder}/assets"
    asset = f"ENV_{code}_PLATE_V1"
    job("plate_" + code, "Plate: " + nm, "3 Art", "image", SOL + " with image generation", ["smoke"],
     goal=f"Turn the {nm} mockup into a clean background plate: the same scene with both managers exactly as they are, and every piece of UI and data removed, so the build can put live DOM on top. One image asset.",
     read=BASE_READ + [CRAFT + " §3 (plates) — follow it exactly", "project-documents/factory/smoke/CAPABILITIES.md"],
     mockup=[f"Source: project-documents/factory/mockups/{mock}. Remove: {remove}. Keep untouched: {keep}."],
     truth=["Faces and hands are never inside an edit zone. The likeness lock (step 4) restores every pixel outside the zones, so the managers stay exactly Nik-approved.", "No new text, no logos, no people may appear in the painted areas.", "Daniel left, Nik right; never flip the image."],
     steps=[
      f"Load the mockup in Python. Draw the edit zones as rectangles (and polygons if needed) covering everything listed under Remove, with an 8 px margin, but never touching a face, hand or hair. Save the zones as `{out}/plate_zones.json` (pixel coordinates in the mockup's size) and a guide image `{out}/GUIDE_{code}_PLATE.png` = the mockup with the zones filled in solid cyan (#00FFFF).",
      "Image edit (one request) on the guide image with exactly this prompt:\n\n```\nEdit this image. Repaint every solid cyan area so it shows what would naturally be behind it: the night stadium, crowd bokeh, floodlights, banners and dark atmosphere, continuing the existing perspective and the warm golden lighting. Where a person's body was covered, continue their clothes naturally. Keep everything that is not cyan exactly as it is: same people, same faces, same hands, same pose, same framing. Remove all cyan. Add no text, no letters, no logos, no new people. Same 16:9 framing, largest size available.\n```\nIf the chat cannot edit images, give Nik the prompt and the guide image path, ask him to run it in a plain New chat outside any project and attach the result here.",
      "Check the edit: no cyan left, no text or logos, no extra people, the painted areas match light and perspective, the managers look unchanged, and the plate is FULLY clean: no visible edge, smear or tone step where a zone was (a visible zone edge = fail, because the build must float UI on the scene without cover boxes). If it fails, retry in a NEW chat (max 3), always from the guide image, never from a previous result.",
      f"Likeness lock in Python: resize the edit to the mockup's exact size; build a mask from the zones feathered 6 px; output = edit inside the mask, original mockup outside. Save `{out}/{asset}_SRC.png` (lock result at source size).",
      f"Export: `{asset}_1X.webp` and `.png` at 1672 × 941 (or the source width), `{asset}_2X.webp` and `.png` at 2× with Lanczos, WebP quality 88. Write `{out}/intake_report.md` with sizes, SHA-256 of every file, try number and the prompt.",
      f"Write `{out}/platemap.json` in the same schema as `{V}/home/assets/platemap.json`: `plate_1x_size`, `plate_2x_size`, `protected_boxes` as [x0, y0, x1, y1] in 1X pixels with keys `face_daniel`, `face_nik`, `hand_daniel`, `hand_nik` (plus props like `trophy` if any; keys starting with `face` get the stricter gate), `safe_ui` boxes, and `cutouts` polygons for any arm or hand that a panel will overlap (use the mockup's panel positions to decide). The mockup-diff gate reads this file.",
     f"Title wordmark: crop the mockup's own brush title lettering (the screen name, not the eyebrow or tagline) from the ORIGINAL mockup, key it to transparency in Python (keep the gold letters and their dark outer shadow, remove the scene behind), clean the edges, and save `{out}/TITLE_{code}_V1.webp` (2X, transparent) plus `.png` master. If the scene behind the letters makes a clean key impossible, ask the image tool in a NEW request to re-letter the same words on pure black in the same brush style (one image), then key the black out. Note which method you used in intake_report.md. Commit and finish.",
     ],
     deliverables=[f"{out}/{asset}_1X.webp/.png", f"{out}/{asset}_2X.webp/.png", f"{out}/{asset}_SRC.png", f"{out}/plate_zones.json", f"{out}/GUIDE_{code}_PLATE.png", f"{out}/platemap.json", f"{out}/intake_report.md"],
     selfcheck=["Faces identical to the mockup (pixel difference 0 outside the zones).", "No text, logos, data or extra people (H2, H3).", "phone_band holds both faces."],
     done="The locked plate, its map and intake report are committed.")

job("plate_SYS", "Plate: system stadium (no people)", "3 Art", "image", SOL + " with image generation", ["smoke"],
 goal="A clean night-stadium background with NO people for Rule Book, Settings and phone backgrounds. One image asset.",
 read=BASE_READ + [CRAFT + " §3"],
 mockup=["Source: project-documents/factory/mockups/MOCKUP_TROPHY_ROOM.png. Everything except the stadium, floodlights, crowd bokeh and banners goes: both managers, all UI, the trophy, the ball sculpture, the nav and footer bars."],
 truth=["No people at all. No text other than the existing banner slogans. No logos."],
 steps=[
  "Make a guide image: the mockup with both managers, all UI, the trophy and the sculpture filled solid cyan (generous zones). Save zones to `" + V + "/shared/plates/plate_zones_SYS.json` and the guide as `GUIDE_SYS_PLATE.png` in the same folder.",
  "Image edit with the same prompt as the other plate jobs, plus the sentence: \"There are no people in the final image; the cyan areas become empty stadium.\" Retry in a new chat up to 3 times if people, text or logos appear.",
  "No likeness lock needed (no faces). Do a gentle global check: banners and lights still sit where they were.",
  "Export `ENV_SYS_PLATE_V1_1X/2X` as WebP (q 88) and PNG to `" + V + "/shared/plates/`, write `intake_report.md` with SHA-256. Commit and finish.",
 ],
 deliverables=[V + "/shared/plates/ENV_SYS_PLATE_V1_{1X,2X}.{webp,png}", V + "/shared/plates/intake_report.md"],
 selfcheck=["No people, no new text, no logos.", "Reads as the same stadium as the other screens."],
 done="System plate committed.")

job("art_review", "Art review: trophies and plates", "3 Art", "review", SOL_SHOTS, ["trophy_showdown", "trophy_league", "trophy_cup", "trophy_cont", "plate_TR", "plate_CS", "plate_RV", "plate_LG", "plate_SR", "plate_SJ", "plate_SYS"],
 goal="Gate every new image before builds use it. You did not make any of them.",
 read=BASE_READ + [CRAFT + " §3", "every intake_report.md and trophy .md file from jobs 19–29"],
 steps=[
  "Trophies: put the four on one grey sheet at equal height; check the family look, originality (no real-trophy look-alike), no text, clean alpha at 200 %.",
  "Plates: for each, run compare_sheet.py (if job 17 is done, else make a simple side-by-side) of mockup vs plate; check faces identical, no leftover UI, no text/logos/extra people, painted areas believable, Season Results swoosh gone.",
  "Check every platemap.json: faces and hands boxes cover them; phone_band holds both faces; cut-out polygons exist where the mockup's panels overlap arms.",
  "Write `project-documents/factory/reviews/ART_REVIEW.md`: one row per asset with PASS/FAIL and the reason; for FAIL say exactly what to redo (which job, which zone or prompt line). Commit and finish.",
 ],
 deliverables=["project-documents/factory/reviews/ART_REVIEW.md"],
 selfcheck=["Every asset has a verdict with evidence."],
 done="Art review committed.", look=True)

# ---------------------------------------------------------------- builder helpers

def screen_build_steps(code, s, folder, plate_folder):
    return [
     f"Set up `{folder}/` by copying the structure of `{V}/home/` (index.html, css, js, tools/build_preview.py) and renaming. Link `../shared/showdown-tokens.css`, `showdown-type.css`, `showdown-ui.css`, `stage.css`, `motion.css` and the shared JS. Read `{folder}/TRUTH.md` and `fixtures.json` (from the truth job) and render every frame from fixtures.json via `?frame=`.",
     f"Stage: load `{plate_folder}/ENV_*_PLATE_V1` through the stage engine. REGISTRATION RULE: at 16:9 (1920 × 1080, 1366 × 768) the plate is drawn exactly where the mockup has it (cover, centred, no extra zoom, no shift), so Daniel, Nik, hands and stadium are the mockup's own pixels in the mockup's own places. Other desktop ratios may crop edges but never scale faces more than ±5 % from the 16:9 position. Atmosphere layer on. Mark the managers' areas with `data-manager=\"daniel\"` (left) and `data-manager=\"nik\"` (right) for the QA harness.",
     "Title block: the screen title is the brush wordmark IMAGE (`TITLE_*_V1.webp` from the plate or wordmark job) with the real words in visually-hidden text for screen readers, never a font. Eyebrow and tagline in the shared type classes. Place everything exactly where the mockup has it (measure the mockup: centre x, top y, width as % of the frame). No dark box behind text unless the mockup has one there; the plate is fully clean, so UI floats on the scene. Every illustrated object in the mockup (trophy, icon art, frame) gets a real art asset, not a flat box.",
     "Main layout (desktop, ≥ 1024 px): " + " ".join(s.get("desktop", s.get("design", []))),
     "(Heavy step: this is the only step in its turn; save after each element group: header, main panels, lower panels, buttons.) Build the mockup elements one by one, following the two lists above (\"what to take\" and \"product truth\") and the KEEP / CHANGE / DROP table in TRUTH.md. Measure each element's position and size on the mockup (as % of 1366 × 768) and match it within about 2 %. Every word that can change is DOM text from fixtures.json.",
     "Depth sandwich: " + " ".join(s.get("depth", ["Only if a panel overlaps a person: cut-out and contact shadow per CUTOUT_STANDARD.md."])) + " Write each cut-out polygon into `platemap.json` under `cutouts` (1X plate pixels) and the exact `shared/tools/cutout.py` commands (with --rim) into `tools/MAKE_ASSETS.md` in the screen folder; reference the OVL_* WebP files in the HTML; style rim light and contact shadows in CSS. Do NOT make or upload the image files: Claude runs MAKE_ASSETS.md and commits them.",
     "States: build every frame in fixtures.json (" + s.get("frames", "") + "). Preview frames show the \"Preview data\" chip. Empty, partial and unavailable states are designed panels with an icon and plain words, never blank space.",
     "Self-check by reading, no browser: every frame in fixtures.json renders a designed state; every changing word is DOM text; no PNG master is loaded (WebP via `<picture>`); estimate first-paint weight from file sizes (≤ 900 KB). Do NOT run factory-qa, screenshots or the mockup-diff: Claude renders the screen on a real server after you finish, runs H10 and the QA, and fixes or files what it finds. Score QUALITY_BAR criteria 1–7 and 10 yourself from the code (aim ≥ 4 each).",
     f"Write `{folder}/BUILD_RESULT.md` (how to run, frames, what you changed from the mockup and why, QA results, known gaps) and `preview.html` with build_preview.py. Commit and finish.",
    ]

def phone_steps(s, folder):
    return [
     f"Read `{folder}/BUILD_RESULT.md`, CRAFT_GUIDE §6 and QUALITY_BAR criterion 9. From the CSS, write down what will break at 393 × 660 (no browser needed).",
     "Phone layout (portrait ≤ 760 px wide), same URL, same DOM: " + " ".join(s.get("phone", s.get("design", [])[-2:])),
     "Phone composition (its own layout, not a shrunk desktop): top about 55 %: the portrait stadium background from the phone art job with Daniel (left) and Nik (right) as LARGE cut-outs, heads fully visible, slightly overlapping the UI below (the mockup feel), rim light and contact shadow; the brush title wordmark between or above them. Bottom about 45 %: the primary action and the few controls the screen needs; anything more goes in tabs or a sheet. Serve the phone assets through `<picture>`; first paint ≤ 450 KB.",
     "Primary action pinned at the bottom inside `env(safe-area-inset-bottom)`; secondary actions compact; touch targets ≥ 44 px; inputs ≥ 16 px.",
     "Height budget by arithmetic, no browser: add up the fixed heights at 393 × 660, 360 × 640 and 375 × 553 and show they fit (no scroll; at 375 × 553 the primary action is visible); bigger phones grow the layout instead of floating. Claude measures in a real browser after you finish.",
     f"Update BUILD_RESULT.md with a Phone section (layout, what is hidden or moved and why, measurements). Commit and finish.",
    ]

def review_steps(folder, mock, scope="static"):
    crit = "criteria 1–7, 9 and 10" if scope == "static" else "all 10 criteria"
    return [
     "Confirm you did not build this screen (a fresh chat). Read QUALITY_BAR.md completely. You are a strict art director: when in doubt, score lower and write why.",
     "Read Claude's intake note in the build job's status file and the shots and reports Claude committed in the screen's evidence/ folder (Claude renders every build on a real server). Do NOT run browser QA, screenshots or the mockup-diff yourself.",
     f"Compare by reading: open mockup `{mock}` from the project Files and list, element by element, where the code's positions, sizes, words and states differ from it and from TRUTH.md.",
     "Code audit: product truth (Daniel left, no invented stats, honest empty/partial/unavailable states), every changing word from fixtures, accessible names, focus order, 44 px touch targets on phone, no PNG masters loaded.",
     "Carry Claude's measured results (H10, page weight, scroll, errors) into your gate table as given; do not re-measure.",
     "Hard gates H1–H11: measured, PASS or FAIL each, with evidence.",
     f"Score {crit} with one evidence sentence each.",
     f"Write `{folder}/review/REVIEW.md` in the QUALITY_BAR review format, verdict PASS or FAIL, and a numbered fix list (exact: file, selector or asset, the change, the target value). Commit and finish.",
    ]

def fix_steps(folder):
    return [
     f"Read `{folder}/review/REVIEW.md`. If the verdict is PASS: set State: SKIPPED, note \"review passed\", commit \"Job N done: skipped (review passed)\" and stop.",
     "Do the fix list item by item, nothing more, at most two items per turn. After each item save and note \"item k: done, <file and selector>\". No screenshots.",
     "If an item cannot be done as written, do not improvise: set it as BLOCKED in the status notes with the reason and continue with the others.",
     "Re-read every changed rule against the fix list targets. Do not run browser QA: Claude reruns it after you finish.",
     f"Add a \"Fix round\" section to `{folder}/BUILD_RESULT.md` (items done, items blocked, new QA results). Commit and finish.",
    ]

def motion_steps(s, folder):
    return [
     f"Read `{V}/shared/MOTION.md` and CRAFT_GUIDE §5. Read `{folder}/BUILD_RESULT.md`.",
     "Wire the standard entrance with the shared motion kit (`data-sd-enter` attributes): scene, characters, title wipe, panels in order of importance, primary button last.",
     "Screen-specific moments: " + " ".join(s.get("motion", ["Panels rise with stagger; numbers count up."])),
     "Interaction feel: hover and press on every control ≤ 120 ms; tab/toggle changes cross-fade; no layout shift.",
     "Reduced motion (system and app setting): fades only, written as a prefers-reduced-motion block plus the app setting class.",
     "Write the timeline as a table (element, delay, duration, easing) in BUILD_RESULT.md; no frame strips or recordings (Claude records them). Score criterion 8 yourself (aim 5).",
     f"Update BUILD_RESULT.md (Motion section). Commit and finish. This is the screen's finish line: Claude takes a look next.",
    ]

# ---------------------------------------------------------------- Sol-sized helpers (CC-006 audit, 2026-10-03)
# One step = at most 4 files read (only the sections it needs), at most 3 files written (about 150 lines), ONE decision.
# No browser, screenshots, factory-qa, mockup-diff, recordings or GitHub Actions in any step: the worker checks by
# reading and Claude measures at intake. Binary files are never made by the worker: the recipe goes to tools/MAKE_ASSETS.md.
# Jobs that had already started before the audit keep the v1 helpers above (their step totals must not change).
FROZEN_V1 = {"TR_build", "CS_build", "RV_build", "ld_review", "ld_fix"}
CLAUDE_MEASURES = "Claude measures this in a real browser at intake (H5, H6 contrast, H7, H8, H9, H10, H11); you check by reading only."
STATUS = "`project-documents/factory/status/JOB-{n}.md`"
WORDMARK_FILE = {"FW": V + "/shared/wordmarks/TITLE_FINAL_WINNER_V1.webp", "RB": V + "/shared/wordmarks/TITLE_RULE_BOOK_V1.webp",
                 "ST": V + "/shared/wordmarks/TITLE_SETTINGS_V1.webp", "SD": V + "/shared/wordmarks/TITLE_STANDINGS_V1.webp"}

def S(name, read, write, body, done):
    """One Sol-sized step: what to read, what to write, what to do, what done looks like."""
    def fmt(x):
        if x.startswith("`") or x.startswith("the ") or x.startswith("only ") or x.startswith("MOCKUP"): return x
        head, _, rest = x.partition(" ")
        if "/" in head or head.endswith(".md") or head.endswith(".json"): return f"`{head}`" + ((" " + rest) if rest else "")
        return x
    rd = ", ".join(fmt(r) for r in read) if read else "nothing new"
    wr = ", ".join(fmt(w) for w in write) if write else "nothing new"
    return f"**{name}.** Read: {rd}. Write: {wr}. {body} Done: {done}"

def paths(folder, name):
    return dict(html=f"{folder}/index.html", css=f"{folder}/{name}.css", js=f"{folder}/{name}.js",
                fx=f"{folder}/fixtures.json", truth=f"{folder}/TRUTH.md", br=f"{folder}/BUILD_RESULT.md",
                mk=f"{folder}/tools/MAKE_ASSETS.md", rv=f"{folder}/review/REVIEW.md")

def screen_build_steps_v2(code, s, folder, pf, system=False):
    p = paths(folder, s["folder"])
    plate = (V + "/shared/plates/ENV_SYS_PLATE_V1") if system else f"{pf}/ENV_{code}_PLATE_V1"
    title = WORDMARK_FILE.get(code, f"{pf}/TITLE_{code}_V1.webp")
    pm = f"{pf}/platemap.json"
    frames = s.get("frames", "")
    desktop = " ".join(s.get("desktop", s.get("design", [])))
    depth = " ".join(s.get("depth", ["Only if a panel overlaps a person: cut-out and contact shadow per CUTOUT_STANDARD.md."]))
    st = [
     S("Scaffold", [V + "/home/index.html (the head and the page shell only)", V + "/home/home.js (only the part that reads `?frame=` and fills the DOM from fixtures.json)", p["fx"]],
       [p["html"], p["css"], p["js"]],
       "Make index.html link `../shared/showdown-tokens.css`, `showdown-type.css`, `showdown-ui.css`, `stage.css`, `motion.css`, `../shared/stage.js` and `../shared/motion.js`, plus your own css and js. The js reads `?frame=` and writes every string and value of that frame from fixtures.json into plain DOM (no styling yet). DEFAULT frame when `?frame=` is missing: the first frame in fixtures.json.",
       "every frame id in fixtures.json opens via `?frame=` and shows its strings as unstyled text."),
     (S("Stage", [V + "/shared/STAGE.md", pm], [p["html"], p["css"], p["js"]],
        f"Load `{plate}_1X.webp` (and `_2X.webp` for DPR ≥ 2) through the stage engine. REGISTRATION RULE: at 16:9 (1920 × 1080, 1366 × 768) the plate is drawn exactly where the mockup has it (cover, centred, no extra zoom, no shift), so Daniel, Nik, hands and stadium are the mockup's own pixels in the mockup's own places. Other desktop ratios may crop edges but never scale faces more than ±5 % from the 16:9 position. Atmosphere layer on. Mark the managers' areas with `data-manager=\"daniel\"` (left) and `data-manager=\"nik\"` (right) using the face boxes from platemap.json.",
        "the stage container is in index.html, both plate URLs are in the code, and the only transform is cover-centred.")
      if not system else
      S("Stage", [V + "/shared/STAGE.md"], [p["html"], p["css"]],
        f"Load `{plate}_1X.webp` (and `_2X.webp` for DPR ≥ 2) through the stage engine with a heavier dark scrim (text panels need calm behind them). No managers on this screen, so no `data-manager` markers and no cut-outs.",
        "the stage container and scrim are in the code, plate cover-centred.")),
     S("Title block", [f"{pf}/intake_report.md (the title crop position)" if not system else V + "/shared/wordmarks/README.md", "the mockup image from the project Files" if not system else "MOCKUP_TROPHY_ROOM.png from the project Files (title position only)"],
       [p["html"], p["css"]],
       f"The screen title is the brush wordmark IMAGE `{title}` with the real words in visually-hidden text for screen readers, never a font. Eyebrow and tagline in the shared type classes. Place everything exactly where the mockup has it (centre x, top y, width as % of the frame, written as CSS comments). No dark box behind text unless the mockup has one there; the plate is fully clean, so UI floats on the scene. DEFAULT if the wordmark file is not on the branch, or its words differ from the screen title in TRUTH.md: set TRUTH.md's title words in the kit's display font with the comment `TODO-WORDMARK` and carry on (never BLOCKED for this; Claude orders the right wordmark).",
       "wordmark (or TODO-WORDMARK), hidden text, eyebrow and tagline are in the code with their measured positions."),
     S("Layout skeleton (desktop, ≥ 1024 px)", ["the mockup image from the project Files", p["truth"] + " (the KEEP / CHANGE / DROP table only)"], [p["html"], p["css"]],
       f"Place EMPTY `.sd-panel` boxes where the mockup has panels, nothing inside them yet: {desktop} Measure each box on the mockup (as % of 1366 × 768) and match it within about 2 %; write the measured % next to each rule as a comment. Panels only where the mockup has panels; every illustrated object in the mockup (trophy, icon art, frame) will get a real art asset in the next steps, never a flat box.",
       "every panel box sits at its measured position; the ready frame shows the empty boxes over the plate."),
     S("Element group A: everything above the main panel(s)", [p["truth"] + " (the KEEP / CHANGE / DROP table and the strings)", p["fx"], "the mockup image from the project Files"], [p["html"], p["css"], p["js"]],
       "Build the mockup elements that sit above the main panel(s) (header rows, tiles, scoring panel, toggles, counters), following \"what to take\", \"product truth\" and the TRUTH.md table. Every word that can change is DOM text from fixtures.json; only buttons TRUTH.md lists. About 150 lines; if a group needs more, split it into saved parts 5a, 5b.",
       "group A renders from fixtures.json in the ready frame and matches the mockup's positions."),
     S("Element group B: the main panel(s)", [p["truth"] + " (table and strings)", p["fx"], "the mockup image from the project Files"], [p["html"], p["css"], p["js"]],
       "Build the main panel(s) content: rows, cards, columns, numbers (tabular, condensed, gold for the leader where the design says so), icons as kit pieces or art assets. Daniel's column or side always left. Split into saved parts 6a, 6b if more than about 150 lines.",
       "the main panel(s) render from fixtures.json in the ready frame with the right hierarchy."),
     S("Element group C: everything below the main panel(s), and the buttons", [p["truth"] + " (buttons and routes)", p["fx"], "the mockup image from the project Files"], [p["html"], p["css"], p["js"]],
       "Build the lower panels and the button row: `.sd-btn--primary` for the one primary action, `.sd-btn--secondary` for the rest, routes and ids from TRUTH.md, 44 × 44 targets, focus rings. Drop every mockup button the product does not have (TRUTH.md says DROP).",
       "every real button and lower panel is in the code; no dropped button remains."),
    ]
    if not system:
        st.append(S("Depth sandwich (recipe only)", [V + "/shared/CUTOUT_STANDARD.md", pm], [pm, p["mk"], p["css"]],
          f"{depth} Write each cut-out polygon into platemap.json under `cutouts` (1X plate pixels) and the exact `python3 {V}/shared/tools/cutout.py --plate ... --map ... --key cutouts.<name> --output assets/OVL_{code}_<PART>_V1 --rim` commands into tools/MAKE_ASSETS.md; reference the `OVL_{code}_<PART>_V1_1X.webp` / `_2X.webp` files in the HTML as if they exist; style rim light and contact shadows in CSS. Do NOT make or upload the image files: Claude runs MAKE_ASSETS.md, commits them and renders the screen.",
          "polygons are in platemap.json, the commands are in MAKE_ASSETS.md, the overlay files are referenced in the HTML."))
    st += [
     S("States: every frame", [p["fx"], p["truth"] + " (state words)"], [p["js"], p["css"], p["html"]],
       f"Build every frame in fixtures.json ({frames}). Preview frames show the \"Preview data\" chip (`.sd-preview-tag`, above the crown, never on the title or tagline). Empty, partial, unavailable and loading states are designed panels with an icon and plain words, never blank space; a hidden state must really be hidden (set `display:none`, not only the `hidden` attribute, when a grid rule beats it). Split into saved parts (ready frames, then the other states) if more than about 150 lines.",
       "each frame id renders a designed state; no frame shows another frame's numbers."),
    ]
    if system:
        phone = " ".join(s.get("phone", s.get("design", [])[-2:]))
        st += [
         S("Phone layout (heavy step: alone in its turn)", [p["css"], p["html"]], [p["css"], p["html"]],
           f"Portrait ≤ 760 px wide, same URL, same DOM: {phone} Background `{V}/shared/plates/ENV_SYS_PHONE_V1.webp` via `<picture>` (DEFAULT if it is not on the branch: the desktop plate cover-cropped). Primary action pinned at the bottom inside `env(safe-area-inset-bottom)`; the bottom bar space reserved as the truth section says (`<div class=\"nav-reserve\">`); touch targets ≥ 44 px; inputs ≥ 16 px.",
           "the media query holds the whole phone layout; nothing is a shrunk desktop."),
         S("Phone height budget by arithmetic", [p["css"]], [p["br"] + " (section \"Phone\", table \"Height budget\")"],
           "Add up the fixed heights at 393 × 660, 360 × 640 and 375 × 553 (title band, panel, pinned button, reserved bar, gaps) and show they fit with no page scroll; a content panel may scroll inside itself. At 375 × 553 the primary action is visible. " + CLAUDE_MEASURES,
           "the table shows the sum per size and the remaining pixels, all ≥ 0."),
        ]
    st += [
     S("Check by reading", [p["html"], p["css"], p["js"], "project-documents/factory/QUALITY_BAR.md (criteria 1–7 and 10, gates H1–H4)"], [STATUS + " (Self-check section)"],
       "No browser. Confirm: every frame in fixtures.json renders a designed state; every changing word is DOM text; no PNG master is loaded (WebP via `<picture>`); first-paint weight estimated from the file sizes in the plate's intake_report.md (≤ 900 KB); Daniel left; only TRUTH.md buttons; H1–H4 PASS from the code. Score criteria 1–7 and 10 yourself from the code (aim ≥ 4 each) with one evidence line each. Do NOT run factory-qa, screenshots or the mockup-diff: Claude renders the screen on a real server after you finish, runs H10 and the QA, and fixes or files what it finds.",
       "the Self-check section lists every line with PASS or FAIL and evidence."),
     S("BUILD_RESULT and the preview recipe", [V + "/home/BUILD_RESULT.md (headings only)", V + "/home/tools/build_preview.py"], [p["br"], f"{folder}/tools/build_preview.py", p["mk"]],
       "Write BUILD_RESULT.md: how to run, frames, what you changed from the mockup and why, your scorecard, estimated weight, known gaps, and what Claude must make (MAKE_ASSETS.md). Copy build_preview.py with the file names changed for this screen, but do NOT run it (it needs the binary plate): add `python3 tools/build_preview.py` as the last line of MAKE_ASSETS.md; Claude makes preview.html. Commit and finish.",
       "BUILD_RESULT.md, tools/build_preview.py and MAKE_ASSETS.md are committed; the last commit is `Job {N} done: <job title>`."),
    ]
    return st

def phone_steps_v2(s, folder, name, art_code, art_folder, hub, extra_phone=None):
    p = paths(folder, name)
    phone = " ".join(extra_phone or s.get("phone", s.get("design", [])[-2:]))
    bg = f"{art_folder}/ENV_{art_code}_PHONE_V1.webp"
    ovl = f"{art_folder}/OVL_{art_code}_DANIEL_PHONE_V1.webp and OVL_{art_code}_NIK_PHONE_V1.webp"
    reserve = (" Reserve the bottom bar space as this job's truth section says (`<div class=\"nav-reserve\">`, 56 px plus `env(safe-area-inset-bottom)`); the primary action is pinned ABOVE it." if hub else " No bottom bar on this screen: the primary action is pinned at the very bottom inside `env(safe-area-inset-bottom)`.")
    return [
     S("Phone plan", [p["br"], "project-documents/factory/CRAFT_GUIDE.md §6", "project-documents/factory/QUALITY_BAR.md criterion 9", p["css"]], [STATUS + " (notes: one line per desktop element with its phone fate)"],
       "From the CSS alone (no browser), list every desktop element and what happens to it at 393 × 660: stays, moves into a tab, moves into a sheet, is hidden with its reason. DEFAULT: hub-like content goes into tabs, rare extras into a `.sd-sheet`.",
       "the plan names every element; nothing is left to decide while building."),
     S("Phone layout (heavy step: alone in its turn)", [p["css"], p["html"]], [p["css"], p["html"]],
       f"Portrait ≤ 760 px wide, same URL, same DOM: {phone} Add the tab or sheet markup the plan needs; about 150 lines of CSS, split into saved parts 2a (structure) and 2b (tabs and sheets) if more.",
       "the media query holds the whole phone layout; nothing is a shrunk desktop."),
     S("Heroes on top", [f"{art_folder}/phonemap.json", f"{art_folder}/phone_intake.md"], [p["html"], p["css"], p["mk"]],
       f"Top about 55 %: the portrait stadium `{bg}` with `{ovl}` as LARGE cut-outs (heads fully visible, Daniel left, slightly overlapping the UI below, rim light and contact shadow), the brush title between or above them, all through `<picture>` with the positions from phonemap.json. Bottom about 45 %: the primary action and the few controls the screen needs. DEFAULT if a cut-out file is not on the branch yet: reference it anyway and add its `cutout.py` line to tools/MAKE_ASSETS.md (Claude makes it).",
       "both heroes and the background are referenced with phonemap positions; first paint on phone ≤ 450 KB by file sizes."),
     S("Controls and the pinned action", [p["css"], p["html"]], [p["css"], p["html"]],
       "Primary action pinned at the bottom inside `env(safe-area-inset-bottom)`; secondary actions compact; touch targets ≥ 44 px; inputs ≥ 16 px; the keyboard must not hide a primary button (test by arithmetic with a 300 px keyboard inset where the screen has inputs)." + reserve,
       "every control has a 44 px target and the primary action is in the pinned slot."),
     S("Height budget by arithmetic", [p["css"]], [p["br"] + " (section \"Phone\", table \"Height budget\")"],
       "No browser: add up the fixed heights at 393 × 660, 360 × 640 and 375 × 553 (hero band, title, tabs, panel, pinned button, " + ("reserved bar, " if hub else "") + "gaps) and show they fit with no page scroll; at 375 × 553 the primary action is visible; bigger phones (390 × 844, 430 × 932) grow the layout instead of floating. " + CLAUDE_MEASURES,
       "the table shows the sum per size and the remaining pixels, all ≥ 0."),
     S("Phone section and check by reading", [p["css"], p["html"]], [p["br"] + " (section \"Phone\")", STATUS + " (Self-check)"],
       "Write the Phone section: layout, what is hidden or moved and why, the height budget, assets used, what Claude must make. Self-check by reading: H1 (Daniel left in the band), H5 by arithmetic, H6 input sizes, 44 px targets, no PNG master loaded. Commit and finish.",
       "BUILD_RESULT.md has the Phone section and the status file has the self-check; the last commit is `Job {N} done: <job title>`."),
    ]

def review_steps_v2(folder, name, mock, intake_keys, scope="static"):
    p = paths(folder, name)
    crit = "criteria 1–7, 9 and 10" if scope == "static" else "all 10 criteria"
    intake = ", ".join("`project-documents/factory/status/JOB-{job:%s}.md` (Claude's intake note at the bottom)" % k for k in intake_keys)
    return [
     S("Set up the review", ["project-documents/factory/QUALITY_BAR.md (all of it)"], [p["rv"]],
       "Confirm in the status notes that you did not build this screen (a fresh chat). You are a strict art director: when in doubt, score lower and write why. Write REVIEW.md as a skeleton with the five headings of the review output format (Verdict, Scorecard, Hard gates, Evidence, Fix list), empty for now.",
       "the skeleton is committed and the status note says this chat is fresh."),
     S("Carry Claude's measurements", [intake, f"{folder}/evidence/ (only `QA_SUMMARY.md` and `scores.json` if they exist; Claude renders every build on a real server)"], [p["rv"] + " (section Evidence)"],
       "Copy Claude's measured results as given (H5 scroll per size, H6 contrast, H7, H8, H9, H10 scores, H11 weight) with the path each number came from. Do NOT run browser QA, screenshots or the mockup-diff yourself and do not re-measure. DEFAULT when a gate has no Claude measurement yet: write `NOT MEASURED (Claude measures)`, never FAIL.",
       "every measured gate has a number and a source path, or the NOT MEASURED line."),
     S("Compare with the mockup by reading", [(f"the mockup `{mock.split('/')[-1]}` from the project Files" if mock.startswith("project-documents") else f"the reference: {mock} (from the project Files)"), p["html"], p["css"]], [p["rv"] + " (section Evidence, list \"Mockup differences\")"],
       "Element by element: where the code's positions (the measured % comments), sizes, words and states differ from the mockup and from TRUTH.md. One line per difference: element, mockup value, code value.",
       "the list covers the title block, every panel, every button and the managers' areas."),
     S("Product truth and code audit", [p["truth"], p["fx"], p["js"]], [p["rv"] + " (section Evidence, list \"Code audit\")"],
       "Check: Daniel left in every row and frame, no invented stats or buttons, honest empty / partial / unavailable states, every changing word from fixtures.json, accessible names, focus order, 44 px targets on phone, inputs ≥ 16 px, no PNG master loaded, no live data in images. One line per finding with file and selector.",
       "the audit list is complete; each finding names its file and selector."),
     S("Hard gates table", [p["rv"]], [p["rv"] + " (section Hard gates)"],
       "H1–H4 PASS or FAIL from your reading with evidence; H5–H11 copied from the Evidence section exactly as Claude measured them (marked \"Claude measures\"), NOT MEASURED where Claude has nothing yet. A gate you did not measure is never a FAIL.",
       "all eleven rows are filled."),
     S("Score the criteria", [p["rv"]], [p["rv"] + " (section Scorecard)"],
       f"Score {crit} 0–5 with one evidence sentence each, from the mockup differences and the code audit. Pass line per QUALITY_BAR.",
       "every score has its evidence sentence."),
     S("Verdict and fix list", [p["rv"]], [p["rv"] + " (sections Verdict and Fix list)"],
       "Verdict PASS or FAIL per the pass line and the gates. Fix list: numbered, each item one exact change (file, selector or asset, the change, the target value); gates Claude has not measured yet are not fix items. Commit and finish.",
       "REVIEW.md is complete in the QUALITY_BAR format; the last commit is `Job {N} done: <job title>`."),
    ]

def fix_steps_v2(folder, name):
    p = paths(folder, name)
    return [
     S("Read the fix list", [p["rv"]], [STATUS + " (notes: the fix list as a checklist)"],
       "If the verdict is PASS: set State: SKIPPED, note \"review passed\", commit `Job N done: skipped (review passed)` and stop. Otherwise copy the numbered fix list into the status notes as a checklist.",
       "the checklist is in the status file (or the job is SKIPPED)."),
     S("Do the fix list, one item per saved part (2a, 2b, ...)", ["only the file(s) the item names"], ["only the file(s) the item names"],
       "Do the items in order, nothing more, at most two items per turn. After each item save and note `item k: done, <file> <selector>`. If an item cannot be done as written, do not improvise: note `item k: BLOCKED, <reason>` and continue with the others. No screenshots, no browser.",
       "every item is noted done or BLOCKED."),
     S("Check by reading", [p["rv"] + " (the fix list targets)", p["css"], p["html"]], [STATUS + " (Self-check)"],
       "Re-read every changed rule against its target value in the fix list. Do not run browser QA: Claude reruns it after you finish.",
       "each item's target is met in the code, or it is BLOCKED with a reason."),
     S("Fix round section", [p["br"] + " (headings only)"], [p["br"] + " (section \"Fix round\")"],
       "List items done, items blocked and what Claude must re-measure. Commit and finish.",
       "BUILD_RESULT.md has the Fix round section; the last commit is `Job {N} done: <job title>`."),
    ]

def motion_steps_v2(s, folder, name):
    p = paths(folder, name)
    moments = " ".join(s.get("motion", ["Panels rise with stagger; numbers count up."]))
    return [
     S("Motion plan", [V + "/shared/MOTION.md", "project-documents/factory/CRAFT_GUIDE.md §5", p["br"] + " (frames and layout)"], [STATUS + " (notes: the entrance order as a list)"],
       "List the entrance order for this screen (scene, characters, title wipe, panels in order of importance, primary button last) and the screen-specific moments below, each with its target element selector.",
       "the plan names every animated element and its order."),
     S("Standard entrance", [p["html"], V + "/shared/motion.js (the `sdEnter` contract only)"], [p["html"], p["js"]],
       "Wire the shared motion kit with `data-sd-enter` attributes in the planned order and call `sdEnter(root)` after the frame renders; stagger with `--i`.",
       "every planned element has its `data-sd-enter` attribute and the call is in the js."),
     S("Signature moments (heavy step: one moment per saved part 3a, 3b, ...)", [p["css"], p["js"]], [p["css"], p["js"]],
       f"{moments} Use the kit (`sdCountUp`, `sdBurst`, `sdReveal`, keyframes from motion.css); transform and opacity only; particles ≤ 60; nothing changes product logic or timing contracts.",
       "each moment is in the code with its duration and easing as constants."),
     S("Interaction feel and reduced motion", [p["css"]], [p["css"]],
       "Hover and press on every control ≤ 120 ms; tab and toggle changes cross-fade; no layout shift. Reduced motion (system `prefers-reduced-motion` block AND the app's own setting class from motion.js): fades only.",
       "both reduced-motion paths exist and every transition is ≤ 120 ms."),
     S("Timeline table and check by reading", [p["css"], p["js"]], [p["br"] + " (section \"Motion\")", STATUS + " (Self-check)"],
       "Write the timeline as a table (element, delay, duration, easing): total entrance ≤ 1.2 s, usable at 0.6 s. Score criterion 8 yourself (aim 5) with evidence from the code. No frame strips or recordings: Claude records them into evidence/motion/ at intake. Commit and finish. This is the screen's finish line: Claude takes a look next.",
       "BUILD_RESULT.md has the Motion section with the timeline; the last commit is `Job {N} done: <job title>`."),
    ]


def fixmotion_steps_v2(folder, name, entrance):
    """Fix round plus motion for screens without a separate motion job. Never skips: the motion part always runs."""
    p = paths(folder, name)
    f = fix_steps_v2(folder, name)
    return [
     S("Read the fix list (this job never skips)", [p["rv"]], [STATUS + " (notes: the fix list as a checklist)"],
       "Copy the numbered fix list into the status notes as a checklist. If the review passed, note `no fix items` and go on to step 4.",
       "the checklist (or `no fix items`) is in the status file."),
     f[1], f[2],
     S("Standard entrance motion", [V + "/shared/MOTION.md", p["html"]], [p["html"], p["js"], p["css"]],
       f"Wire the shared motion kit with `data-sd-enter` attributes and `sdEnter(root)`: {entrance}. Both reduced-motion paths (system block and app setting class). Transform and opacity only.",
       "every panel and the title carry their `data-sd-enter` attribute and the reduced-motion block exists."),
     S("Fix round and Motion sections", [p["br"] + " (headings only)"], [p["br"] + " (sections \"Fix round\" and \"Motion\")", STATUS + " (Self-check)"],
       "List items done and blocked; write the motion timeline table (element, delay, duration, easing; total ≤ 1.2 s) and score criterion 8 yourself. No recordings: Claude records them at intake. Commit and finish.",
       "BUILD_RESULT.md has both sections; the last commit is `Job {N} done: <job title>`."),
    ]

# ---------------------------------------------------------------- Existing screens (polish)

# Home
HF = V + "/home"
job("home_faces", "Home: face edges and seams", "4 Polish built screens", "fix", SOL_SHOTS, ["cutout", "baseline"],
 goal="Make the faces and figure edges on Home flawless: no seam slivers, tone patches or halos where the plate was mended or where overlays meet the plate.",
 read=BASE_READ + [CRAFT, HF + "/BUILD_RESULT.md", HF + "/CLAUDE_HOME-BUILD_HANDOFF_TO_SOL_2026-10-01.md", HF + "/assets/intake_report.md", "project-documents/factory/baseline/BASELINE.md"],
 mockup=["GOAL_HOME.jpg: Daniel pointing at the viewer in front of Nik, both faces sharp, clean edges against the stadium."],
 steps=[
  "Render HM1–HM3 at 1366 × 768 and 1920 × 1080 with `&mends=0` and with mends on; crop both faces, Daniel's pointing hand, and every seam-mend box at 400 %. Save to `" + HF + "/evidence/edges_before/`.",
  "List every defect (soft tone patch, seam line, halo, colour fringe) with its pixel box in `" + HF + "/evidence/edges_before/DEFECTS.md`.",
  "Fix each defect at the source: redo the seam mend with a better-matched patch (sample tone from the 12 px ring around it, match mean and variance), or re-cut the overlay with `shared/tools/cutout.py`. Never paint over a face feature.",
  "Re-render the same crops into `edges_after/` and make a before/after sheet `" + HF + "/evidence/EDGES_BEFORE_AFTER.png`.",
  "Re-run Home's render-qa; all previous gates still pass. Update BUILD_RESULT.md (Edges section). Commit and finish.",
 ],
 deliverables=[HF + "/evidence/EDGES_BEFORE_AFTER.png", "updated assets", HF + "/BUILD_RESULT.md"],
 selfcheck=["At 400 % no visible seam or halo on any listed box.", "Faces unchanged in likeness (difference only inside mend boxes)."],
 done="Before/after sheet committed and gates still green.")

job("home_seven", "Home: seven destinations and premium tiles", "4 Polish built screens", "build", SOL_SHOTS, ["home_faces", "found_review", "trophy_league", "art_home_tiles"],
 goal="Bring Home to its final product shape (OWNER-5) and to the goal image's richness: seven destinations with Continue dominant, and tiles with rich 3D-feel illustrations like the goal instead of thin line icons.",
 read=BASE_READ + [CRAFT, HF + "/BUILD_RESULT.md", HF + "/fixtures.json", "project-documents/product-authority/CMS_HOME_FEATURE_RECOVERY_ONLINE_REINTEGRATION_DIRECTIVE_2026-10-01.md", "project-documents/model-relay/LATEST.md (S2C-005R2 §5, seven-tile layout accepted)"],
 mockup=["GOAL_HOME.jpg: big brush lockup top left, \"RIVALRY HEADQUARTERS\" block, Audius card right over Nik's chest, and a tile row along the bottom: CONTINUE CAREER (solid gold, with a 17-shirt player silhouette), then dark tiles each with a large gold-on-black illustration (tactics clipboard, trophy, rising bars, rule book, disc)."],
 truth=["Seven destinations: Continue (dominant), Start/Join, History, Statistics, Trophy Room (own tile now, not nested in Statistics), Rule Book, Settings. Rivalry Statistics is reached via Statistics and the active Showdown.", "Keep every product id, aria and route from fixtures.json; add the Trophy Room route.", "Audius soundtrack card stays.", "The Continue tile's anonymous 17-shirt figure is the only people icon allowed on Home tiles."],
 steps=[
  "Update fixtures.json: seven tiles with ids, labels, routes and states (HM1–HM3 as today). Trophy Room gets its own tile; remove the nested Trophy Room chip from Statistics.",
  "Layout: seven tiles must fit the goal's tile band at 1366 × 768 without shrinking text below 18 px labels. Recommended: Continue double width, then six equal tiles; or two rows if the band height allows without covering faces. Prove the choice with screenshots.",
  "Tile art: replace the thin line icons with the art assets from the Home tile art job (`shared/art/home-tiles/`) and the League Title trophy (`shared/trophies/TRO_LEAGUE_TITLE_V1_512.webp`) for Trophy Room, placed like the goal (large, bleeding off the tile's right edge). Same visual weight across tiles.",
  "Tile craft: shared kit panel styles, gold chevron, hover lift (translateY −3 px + glow), focus ring. Continue tile: solid gold, the 17-shirt figure as a large silhouette like the goal.",
  "Restyle the big lockup and the RIVALRY HEADQUARTERS block with the shared type classes so Home matches the new screens.",
  "Desktop QA with factory-qa at all desktop sizes and a compare sheet against GOAL_HOME.jpg. Update BUILD_RESULT.md. Commit and finish.",
 ],
 deliverables=[HF + "/ (updated)", HF + "/evidence/COMPARE_1366.png"],
 selfcheck=["Seven destinations all visible and reachable at every desktop size.", "Tile art reads at a glance and is the same weight everywhere.", "Faces never covered."],
 done="Seven-tile Home committed with compare sheet and green QA.")

job("home_phone", "Home: phone with seven destinations", "4 Polish built screens", "build", SOL_SHOTS, ["home_seven", "phoneart_HOME"],
 goal="All seven destinations plus Continue and the soundtrack visible on a 393 × 660 iPhone without scrolling, and still cinematic.",
 read=BASE_READ + [CRAFT + " §6", HF + "/BUILD_RESULT.md"],
 steps=phone_steps_v2(dict(phone=["Top: Daniel (pointing at the viewer) and Nik as large cut-outs over the portrait stadium with the brush lockup; then a slim soundtrack strip, Continue as a full-width gold button, and the six other destinations as a 3 × 2 grid of compact tiles (art + label, ≥ 44 px). DEFAULT if seven destinations and large heroes cannot both fit at 393 × 660: keep the heroes at 40 % of the height and say so in BUILD_RESULT."]), HF, "home", "HOME", HF + "/assets", hub=True),
 deliverables=[HF + "/ (phone)"], selfcheck=["H5 at 393 × 660, 360 × 640, 375 × 553.", "Every destination ≥ 44 px and labelled."], done="Phone Home committed with measurements.")

job("home_review", "Home: review", "4 Polish built screens", "review", SOL_SHOTS, ["home_phone"],
 goal="Independent scorecard review of Home against GOAL_HOME.jpg and QUALITY_BAR.", read=BASE_READ + [CRAFT],
 steps=review_steps_v2(HF, "home", "project-documents/factory/mockups/GOAL_HOME.jpg", ["home_seven", "home_phone"]), deliverables=[HF + "/review/REVIEW.md"], selfcheck=["Every score has evidence."], done="Review committed with verdict and fix list.")
job("home_fix", "Home: fix round", "4 Polish built screens", "fix", SOL_SHOTS, ["home_review"],
 goal="Apply the Home review's fix list exactly (or skip if it passed).", read=BASE_READ + [CRAFT],
 steps=fix_steps_v2(HF, "home"), deliverables=[HF + "/ (fixed)"], selfcheck=["All hard gates PASS."], done="Fix list done or job skipped.")
job("home_motion", "Home: motion pass", "4 Polish built screens", "build", SOL_SHOTS, ["home_fix", "motion"],
 goal="Give Home the FIFA menu entrance and tile feel.", read=BASE_READ + [CRAFT],
 steps=motion_steps_v2(dict(motion=["Lockup brush-wipes in, the managers slide in from their sides (Daniel's pointing hand arrives last with a tiny settle), tiles rise left to right, Continue pulses once.", "Tile hover: illustration tilts 3° in 3D and its gold glints.", "Soundtrack vinyl spins only while playing."]), HF, "home"),
 deliverables=[HF + "/BUILD_RESULT.md (Motion section with the timeline table)", HF + "/evidence/motion/ (frame strips recorded by Claude at intake)"], selfcheck=["Criterion 8 ≥ 4.", "H7 PASS."], done="Motion committed; Home is at its finish line.", look=True)

# League
LF = V + "/league"
job("league_hands", "League: hands on the wheel", "4 Polish built screens", "build", SOL_SHOTS, ["cutout", "baseline", "found_review", "art_wheel", "wordmarks"],
 goal="Make the League screen match the goal's best moment: Daniel's fingertip truly touching the wheel's rim, the wheel big and heavy, and the title in the brush style.",
 read=BASE_READ + [CRAFT, LF + "/BUILD_RESULT.md", LF + "/CLAUDE_LEAGUE-BUILD_HANDOFF_TO_SOL_2026-10-01.md", "project-documents/factory/baseline/BASELINE.md"],
 mockup=["GOAL_LEAGUE.jpg: the wheel is large (about 62 % of height), its gold rim meets Daniel's extended index fingertip exactly; the brush title \"SELECT LEAGUE\" with the \"SPIN TO SELECT LEAGUE\" line between two gold rules; Nik's hand on his chin; two small slogan cards bottom left and right; SPIN WHEEL (gold) and BACK side by side under the wheel."],
 truth=["Open items from the League build: +8° spin frame, hand out of frame on phones, note over the rim, dark selected marks, faint title edges. Fix them here.", "League marks stay as they are until Nik picks (job 'League marks'); do not change getLeagueMark."],
 steps=[
  "Measure the goal: wheel centre, radius, rim width and the fingertip point as % of the frame. Measure the build the same way (baseline shots). Write both in `" + LF + "/evidence/hands/MEASURE.md`.",
  "Resize and place the wheel so its rim meets Daniel's fingertip at 1366 × 768, 1920 × 1080 and 1366 × 640 (the stage engine keeps plate and wheel in one box). The fingertip overlaps the rim by 2–4 px, finger on top (cut-out layer), with a 3 px soft contact shadow on the rim under the fingertip.",
  "Re-cut the finger overlay with `shared/tools/cutout.py` if its edge shows a halo at 400 %. Add rim light on the finger's upper edge.",
  "Fix the open items: spin frame rotation, selected-mark contrast (selected wedge mark must be light on gold), the note no longer covering the rim, and title edges (use the shared brush title with a crisp dark outer shadow).",
  "Wheel art: put the lit gold rim asset from the wheel art job (`shared/art/wheel/`) over the vector wedges, so the wheel has the goal's thick lit rim and depth (wedges stay live DOM/SVG with the league marks).",
  "Title: replace the block-font title with the brush wordmark `TITLE_LEAGUE_V1` from the wordmarks job (hidden real text for screen readers). Restyle slogan cards and buttons with the shared kit; no dark box behind text unless the goal has one.",
  "QA with factory-qa at desktop sizes, a compare sheet against GOAL_LEAGUE.jpg with a 4 × zoom box on the fingertip. Update BUILD_RESULT.md. Commit and finish.",
 ],
 deliverables=[LF + "/ (updated)", LF + "/evidence/hands/"], selfcheck=["Fingertip-on-rim contact at all desktop sizes (zoom proof).", "No halo on the finger at 400 %."], done="Hands and title polish committed.")

job("league_marks", "League: swap in the new league marks", "4 Polish built screens", "build", SOL_SHOTS, ["league_hands"],
 goal="Replace the current league marks with the League Marks V2 picks Nik makes.",
 note="Nik picked on 2026-10-02: Premier League A (Crown), LaLiga A (Bull), Bundesliga B (Schale), Serie A A (Shield), Ligue 1 A (Numeral 1). The Picks line is in this job's status file.",
 read=BASE_READ + ["visual-assets/league-marks-v2/leagueMarksV2.js", "visual-assets/league-marks-v2/LEAGUE_MARKS_V2_PROOF.html", "js/visualIdentity.js (getLeagueMark, applyLeagueMark)"],
 truth=["OWNER-6: one dominant, bold, original symbol per league; reads at 32 px in gold on black and near-black on gold; never traces a real logo. Club crests unchanged."],
 steps=[
  "Read Nik's picks from the status file (\"Picks:\" line). If there is no Picks line, stop: State WAITING ON NIK.",
  "Wire the five picked marks into `js/visualIdentity.js` `getLeagueMark` (on this branch only) using the drawing code from leagueMarksV2.js; keep the function signature and return shape.",
  "Render the League wheel (all frames) and a 32 px mark sheet (gold on black, black on gold) to `" + LF + "/evidence/marks_v2/`.",
  "Check every other screen that calls getLeagueMark (grep) still renders. Commit and finish.",
 ],
 deliverables=["js/visualIdentity.js (factory branch)", LF + "/evidence/marks_v2/"], selfcheck=["All five marks readable at 32 px both ways.", "No other screen broke."], done="New marks live on the wheel.")

job("league_phone", "League: phone with the hand in frame", "4 Polish built screens", "build", SOL_SHOTS, ["league_hands", "phoneart_LEAGUE"],
 goal="On phones, keep the wheel big and bring Daniel's pointing hand into the frame so the touch moment survives.",
 read=BASE_READ + [CRAFT + " §6", LF + "/BUILD_RESULT.md"],
 steps=phone_steps_v2(dict(phone=["Face band with both faces; the wheel overlaps the band's bottom so Daniel's fingertip (cut-out) still touches the rim on the left (shift the crop focal point to include his hand, or use a dedicated phone crop of the hand overlay).", "Wheel at least 240 px at 393 × 660.", "SPIN WHEEL pinned full width; BACK as a compact secondary."]), LF, "league", "LEAGUE", LF + "/assets", hub=False),
 deliverables=[LF + "/ (phone)"], selfcheck=["Fingertip touches the rim at 393 × 660 (zoom proof).", "H5."], done="Phone League committed.")
job("league_review", "League: review", "4 Polish built screens", "review", SOL_SHOTS, ["league_phone"],
 goal="Independent scorecard review of League against GOAL_LEAGUE.jpg.", read=BASE_READ + [CRAFT],
 steps=review_steps_v2(LF, "league", "project-documents/factory/mockups/GOAL_LEAGUE.jpg", ["league_hands", "league_phone"]), deliverables=[LF + "/review/REVIEW.md"], selfcheck=["Every score has evidence."], done="Review committed.")
job("league_fix", "League: fix round", "4 Polish built screens", "fix", SOL_SHOTS, ["league_review"],
 goal="Apply the League review's fix list exactly (or skip).", read=BASE_READ + [CRAFT], steps=fix_steps_v2(LF, "league"), deliverables=[LF + "/ (fixed)"], selfcheck=["All hard gates PASS."], done="Fix list done or skipped.")
job("league_motion", "League: spin feel", "4 Polish built screens", "build", SOL_SHOTS, ["league_fix", "motion"],
 goal="Make the spin feel weighty and dramatic, like a draw on a TV broadcast.", read=BASE_READ + [CRAFT, "js/leagueWheel.js on main (spin timing, result event)"],
 truth=["Keep the product's spin result logic and timing contract; only the presentation changes."],
 steps=motion_steps_v2(dict(motion=["Spin: fast start with motion blur on the wedges (CSS filter on a duplicate layer), long ease-out, a ticking pointer bounce at each wedge, final 300 ms slow creep, then the winning wedge flashes and its mark scales up 1.15 with a gold burst.", "Daniel's fingertip overlay stays registered during the spin (it does not rotate).", "Result: the league name brush-wipes into the subtitle line."]), LF, "league"),
 deliverables=[LF + "/BUILD_RESULT.md (Motion section with the timeline table)", LF + "/evidence/motion/ (frame strips recorded by Claude at intake)"], selfcheck=["Criterion 8 ≥ 4.", "Spin result identical to the product logic."], done="Motion committed; League is at its finish line.", look=True)

# Club
CF = V + "/club"
job("club_faces", "Club: scene registration, faces, hands and seams", "4 Polish built screens", "fix", SOL_SHOTS, ["cutout", "baseline"],
 goal="First put the Club scene back exactly where the mockup has it (today the desktop plate is zoomed and re-centred, so the face match is only 0.15–0.24 and the mockup-diff gate fails). Then remove the seam slivers by the faces and make the hands gripping the club packs look real.",
 read=BASE_READ + [CRAFT, CF + "/BUILD_RESULT.md", CF + "/CLAUDE_CLUB-BUILD_HANDOFF_TO_SOL_2026-10-01.md", CF + "/assets/handmap.json", "project-documents/factory/baseline/BASELINE.md"],
 mockup=["GOAL_CLUB.jpg: each manager holds a black-and-gold CLUB PACK by its top edge with fingers curled over the foil; the packs glow at the edges."],
 steps=[
  "Registration: remove the desktop zoom/re-centre in club.js `plateToScreen` so at 16:9 the plate is drawn cover-centred with no extra scale or shift (Daniel, Nik and the packs land on the mockup's pixels). Move any UI that now overlaps a face or pack into the mockup's UI areas. Run `python3 visual-assets/v10_1/shared/tools/mockup_diff.py --mockup visual-assets/v10_1/club/assets/REF_GOAL_CLUB.jpg --build <1920x1080 shot> --plate <ENV_CLUB_PLATE_V1_1X.webp> --platemap visual-assets/v10_1/club/assets/platemap.json --out " + CF + "/evidence/diff/` before and after; faces must reach ≥ 0.90 and the gate must PASS.",
  "Crop faces, hands and every seam box at 400 % (before) into `" + CF + "/evidence/edges_before/` and list defects in DEFECTS.md.",
  "Fix seams at the source (tone-matched mends) and re-cut hand overlays with cutout.py so fingers wrap OVER the pack top edge, with a 2–3 px contact shadow on the pack under each finger.",
  "After crops and a before/after sheet `" + CF + "/evidence/EDGES_BEFORE_AFTER.png`.",
  "Re-run the club render-qa; update BUILD_RESULT.md. Commit and finish.",
 ],
 deliverables=[CF + "/evidence/EDGES_BEFORE_AFTER.png"], selfcheck=["No seam or halo at 400 %.", "Fingers over the pack edge with contact shadow."], done="Edges and hands fixed with evidence.")

job("club_panels", "Club: panels and short-laptop fit", "4 Polish built screens", "build", SOL_SHOTS, ["club_faces", "found_review", "wordmarks"],
 goal="Match the goal's panels and stepper, and remove the 1366 × 640 scroll waiver.",
 read=BASE_READ + [CRAFT, CF + "/BUILD_RESULT.md", CF + "/TRUTH or fixtures.json"],
 mockup=["GOAL_CLUB.jpg: brush title CLUB ASSIGNMENT; two status lines (League confirmed ✓, Two sealed club packs ready); a five-step stepper DRAW · PACK 1 · PACK 2 · VS · LOCK with gold circles; giant brush VS between the packs; a wide trapezoid panel at the bottom 'CLUBS LOCKED SHOWDOWN' with two crest shields and names; OPEN SHOWDOWN PACKS (gold) and BACK."],
 truth=["Club crests are our accepted originals (getClubCrestSvg). Only the product's real steps and buttons (fixtures.json)."],
 steps=[
  "Title and VS: replace the boxed block-font title with the brush wordmark `TITLE_CLUB_V1` and the brush VS wordmark from the wordmarks job, floating on the scene with no box behind them (hidden real text for screen readers). Status lines and stepper float too, as in the goal.",
  "Remove the dark-glass cover panels that only hide plate zone edges (re-run the plate cleaning per CRAFT_GUIDE §3 if an edge shows). Keep a panel only where the goal has one (the bottom trapezoid). Stepper circles 44 px.",
  "Fit 1366 × 640 without page scroll (the build had a ~117 px waiver): tighten vertical rhythm, scale the packs with the stage, never shrink labels below readable size.",
  "QA all desktop sizes; compare sheet vs GOAL_CLUB.jpg. Update BUILD_RESULT.md. Commit and finish.",
 ],
 deliverables=[CF + "/ (updated)"], selfcheck=["No scroll at 1366 × 640.", "Stepper and VS read like the goal."], done="Panels polish committed.")

job("club_phone", "Club: phone", "4 Polish built screens", "build", SOL_SHOTS, ["club_panels", "phoneart_CLUB"],
 goal="The club pack moment on a phone, with both packs and faces visible.", read=BASE_READ + [CRAFT + " §6", CF + "/BUILD_RESULT.md"],
 steps=phone_steps_v2(dict(phone=["Face band with both managers and their packs (packs may scale down but stay in hand).", "Stepper as a compact row of five dots with the current label.", "Bottom panel: two crest rows stacked; OPEN SHOWDOWN PACKS pinned."]), CF, "club", "CLUB", CF + "/assets", hub=False),
 deliverables=[CF + "/ (phone)"], selfcheck=["H5.", "Packs still held (hands visible)."], done="Phone Club committed.")
job("club_review", "Club: review", "4 Polish built screens", "review", SOL_SHOTS, ["club_phone"],
 goal="Independent scorecard review of Club against GOAL_CLUB.jpg.", read=BASE_READ + [CRAFT],
 steps=review_steps_v2(CF, "club", "project-documents/factory/mockups/GOAL_CLUB.jpg", ["club_panels", "club_phone"]), deliverables=[CF + "/review/REVIEW.md"], selfcheck=["Every score has evidence."], done="Review committed.")
job("club_fix", "Club: fix round", "4 Polish built screens", "fix", SOL_SHOTS, ["club_review"],
 goal="Apply the Club review's fix list exactly (or skip).", read=BASE_READ + [CRAFT], steps=fix_steps_v2(CF, "club"), deliverables=[CF + "/ (fixed)"], selfcheck=["All hard gates PASS."], done="Fix list done or skipped.")
job("club_packrip", "Club: the pack rip", "4 Polish built screens", "build", SOL_SHOTS, ["club_fix", "motion"],
 goal="The signature moment of the whole app: opening the club packs must feel like a FIFA Ultimate Team walkout.",
 read=BASE_READ + [CRAFT, "js/clubAssignment.js on main (reveal order and events)"],
 truth=["Reveal order, timing contract and the permanence message come from the product. No player imagery in the reveal (crest only)."],
 steps=motion_steps_v2(dict(motion=["Anticipation (500 ms): screen dims, the pack edges glow brighter, a low pulse.", "Rip: a bright seam tears across the pack top (animated clip-path along a jagged path), light pours out, the pack halves fall away (two layers translating and rotating out).", "Walkout: the club crest rises out of the light with a burst (≤ 60 particles) and a ring shockwave, club name brush-wipes on, a short camera push (scale 1.0 → 1.03).", "Second pack waits for the first to settle; VS slams between them; LOCK step stamps gold.", "Reduced motion: crest fades in, no tear."]), CF, "club"),
 deliverables=[CF + "/BUILD_RESULT.md (Motion section with the timeline table)", CF + "/evidence/motion/ (frame strips recorded by Claude at intake)"], selfcheck=["Criterion 8 = 5 is the target here.", "Reveal order identical to the product."], done="Pack rip committed; Club is at its finish line.", look=True)

# Transfer
TF = V + "/tr2/slice-02-plate"
job("tr_polish", "Transfer War: polish to the key art", "4 Polish built screens", "build", SOL_SHOTS, ["baseline", "found_review", "wordmarks"],
 goal="Bring the Transfer War screens (Window, Guess Entry, Signing Entry, Verdicts) onto the shared kit and up to the Plate G key art, without touching their product behaviour.",
 read=BASE_READ + [CRAFT, TF + "/BUILD_RESULT.md", "visual-assets/v10/V10_STATE.md", "project-documents/factory/baseline/BASELINE.md"],
 mockup=["GOAL_TRANSFER_PLATE_G.png: two managers at a shared war table under a hanging window clock, each manager's panel on his side, the rival's panel as a Sealed Dossier, gold-dominant grade."],
 truth=["Nothing may show or hint at the rival's private inputs or progress. The rival panel stays a Sealed Dossier until reveal.", "Keep every product string, id and frame; F1–F4 passed product review."],
 steps=[
  "List the visual gaps from BASELINE.md and your own compare of each frame vs the key art into `" + TF + "/evidence/polish/GAPS.md`.",
  "Move titles, panels and buttons to the shared tokens/type/kit where they differ, keeping layout positions that passed review.",
  "Sealed Dossier: make it feel physical (paper texture, wax-seal style CM17 emblem, a gold clasp) and clearly locked.",
  "Window clock and table: add the atmosphere layer (dust in the light, faint lamp glow) and contact shadows where hands meet the table (cut-outs if any panel overlaps a hand).",
  "QA all frames at desktop sizes; compare sheets vs the key art. Update BUILD_RESULT.md. Commit and finish.",
 ],
 deliverables=[TF + "/ (updated)", TF + "/evidence/polish/"], selfcheck=["F1–F4 strings and ids unchanged (diff fixtures).", "Sealed Dossier reveals nothing."], done="Transfer polish committed.")
job("tr_phone", "Transfer War: phone polish", "4 Polish built screens", "build", SOL_SHOTS, ["tr_polish", "phoneart_TRANSFER"],
 goal="Phone layouts of F1–F4 on the shared kit, still cinematic.", read=BASE_READ + [CRAFT + " §6", TF + "/BUILD_RESULT.md"],
 steps=phone_steps_v2(dict(phone=["Keep the passed phone structure; restyle with the kit; your own panel first, the Sealed Dossier as a compact locked card; the main action pinned. Do this for every frame F1–F4 (one frame per saved part if the CSS passes about 150 lines)."]), TF, "plate", "TRANSFER", TF + "/assets", hub=False),
 deliverables=[TF + "/ (phone)"], selfcheck=["H5 on every frame."], done="Phone Transfer committed.")
job("tr_review", "Transfer War: review", "4 Polish built screens", "review", SOL_SHOTS, ["tr_phone"],
 goal="Independent scorecard review of Transfer War against the Plate G key art.", read=BASE_READ + [CRAFT],
 steps=review_steps_v2(TF, "plate", "project-documents/factory/mockups/GOAL_TRANSFER_PLATE_G.png", ["tr_polish", "tr_phone"]), deliverables=[TF + "/review/REVIEW.md"], selfcheck=["Every score has evidence."], done="Review committed.")
job("tr_fix", "Transfer War: fix round", "4 Polish built screens", "fix", SOL_SHOTS, ["tr_review"],
 goal="Apply the Transfer review's fix list exactly (or skip).", read=BASE_READ + [CRAFT], steps=fix_steps_v2(TF, "plate"), deliverables=[TF + "/ (fixed)"], selfcheck=["All hard gates PASS."], done="Fix list done or skipped.")
job("tr_motion", "Transfer War: motion", "4 Polish built screens", "build", SOL_SHOTS, ["tr_fix", "motion"],
 goal="Transfer War tension in motion.", read=BASE_READ + [CRAFT],
 steps=motion_steps_v2(dict(motion=["The window clock's hand ticks with a soft glow pulse each second (presentation only; real timers stay DOM text).", "Submitting a guess: the card slides into the dossier slot and a wax seal stamps.", "Verdict reveal: the dossier seal cracks, pages fan out, the verdict brush-wipes on, a burst for the winner."]), TF, "plate"),
 deliverables=[TF + "/BUILD_RESULT.md (Motion section with the timeline table)", TF + "/evidence/motion/ (frame strips recorded by Claude at intake)"], selfcheck=["Criterion 8 ≥ 4.", "No motion reveals the rival's progress."], done="Motion committed; Transfer is at its finish line.", look=True)

# Loading
LDF = V + "/loading"
job("ld_polish", "Loading: new look and Reus credit", "4 Polish built screens", "build", SOL_SHOTS, ["truth_LD", "found_review"],
 goal="Restyle the Loading / \"Preparing Career Mode Showdown\" screen in the Showdown look while keeping the Marco Reus photo, and make the credit correct.",
 read=BASE_READ + [CRAFT, LDF + "/TRUTH.md", LDF + "/fixtures.json", "index.html and css/app.css on main (#loadingScreen)"],
 truth=["OWNER-4: the Reus photo `assets/marco-reus-2015-cc-by.webp` stays; it is the ONLY player photo allowed in the app.", "Credit text: \"Marco Reus photo: Tim Reckmann · CC BY 2.0 · Cropped for display\". \"Tim Reckmann\" links to https://www.flickr.com/photos/foto_db/16204330530/ and \"CC BY 2.0\" links to https://creativecommons.org/licenses/by/2.0/. Readable, subordinate, and present for screen readers (not aria-hidden).", "Everything else (logo, type, diagonals, loader, spacing) follows the new look."],
 steps=[
  f"Build `{LDF}/index.html` + css + js as a preview of the loading screen with frames from fixtures.json, using the shared tokens, type and stage (the Reus photo as the plate; no cut-out needed unless UI overlaps him).",
  "Lockup: the brush \"CAREER MODE SHOWDOWN 17\" lockup (same as Home), eyebrow, and a gold progress bar with a moving glint; status text in DOM.",
  "Credit line bottom-left in 12–13 px secondary text with the two links, contrast ≥ 4.5:1, reachable by keyboard.",
  "Phone: crop the same OWNER-4 asset (assets/marco-reus-2015-cc-by.webp, the ONLY Reus image allowed; never make, find or use another, never add a ball) to keep his face and as much of his figure as fits the phone frame; lockup and loader below; the credit line exactly as OWNER-4 sets it, visible without scroll.",
  "QA desktop and phone sizes with factory-qa; write BUILD_RESULT.md with a note on the exact production element it will replace. Commit and finish.",
 ],
 deliverables=[LDF + "/"], selfcheck=["Credit exact, linked, readable by screen readers.", "Reus only here (H2)."], done="Loading preview committed.")
job("ld_review", "Loading: review", "4 Polish built screens", "review", SOL_SHOTS, ["ld_polish"],
 goal="Independent review of Loading.", read=BASE_READ + [CRAFT],
 steps=review_steps(LDF, "the Home goal lockup (GOAL_HOME.jpg) and the current production Loading screen"), deliverables=[LDF + "/review/REVIEW.md"], selfcheck=["Credit checked word by word."], done="Review committed.")
job("ld_fix", "Loading: fix round", "4 Polish built screens", "fix", SOL_SHOTS, ["ld_review"],
 goal="Apply the Loading review's fix list (or skip).", read=BASE_READ + [CRAFT], steps=fix_steps(LDF), deliverables=[LDF + "/ (fixed)"], selfcheck=["All hard gates PASS."], done="Fix list done or skipped; Loading is at its finish line.", look=True)

# ---------------------------------------------------------------- New screens
ORDER = ["TR", "CS", "RV", "LG", "SR", "FW", "SJ"]
HUBS = {"TR", "CS", "RV", "LG", "SJ"}  # screens that reserve the phone bottom bar (V2G-003); SR and FW hide it
for code in ORDER:
    s = NEW_SCREENS[code]
    folder = V + "/" + s["folder"]
    pf = V + "/" + NEW_SCREENS[s["plate"]]["folder"] + "/assets"
    mock = "project-documents/factory/mockups/" + (s["mockup"].split(" ")[0] if s["mockup"].startswith("MOCKUP") else "MOCKUP_SEASON_RESULTS.jpg and MOCKUP_TROPHY_ROOM.png")
    nm = s["name"]
    deps = ["truth_" + code, "plate_" + s["plate"], "art_review", "found_review"] + (["wordmarks"] if code == "FW" else [])
    job(code + "_build", f"{nm}: build (desktop)", "5 New screens", "build", SOL_SHOTS, deps,
     goal=f"Build the {nm} screen at desktop sizes to the mockup and the quality bar, with real product truth and the characters standing out of the menu.",
     read=BASE_READ + [CRAFT, folder + "/TRUTH.md", folder + "/fixtures.json", pf + "/platemap.json", pf + "/intake_report.md", V + "/shared/STAGE.md", V + "/shared/CUTOUT_STANDARD.md", V + "/shared/QA.md"],
     mockup=[f"Mockup: {mock}"] + s["mockup_take"], truth=s["overrides"],
     steps=(screen_build_steps(code, s, folder, pf) if code + "_build" in FROZEN_V1 else screen_build_steps_v2(code, s, folder, pf)),
     deliverables=([folder + "/ (index.html, css, js, assets/OVL_*, evidence/, BUILD_RESULT.md, preview.html)"] if code + "_build" in FROZEN_V1 else
                   [folder + "/ (index.html, css, js, tools/MAKE_ASSETS.md, tools/build_preview.py, BUILD_RESULT.md)", pf + "/platemap.json (cutout polygons)", "made by Claude from MAKE_ASSETS.md: assets/OVL_*, preview.html, evidence/"]),
     selfcheck=["Own scorecard criteria 1–7 and 10 at least 4 each, written in BUILD_RESULT.md.", "Hard gates H1–H4, H6, H8, H9 PASS at desktop sizes." if code + "_build" in FROZEN_V1 else "Hard gates H1–H4 PASS from the code; H5–H11 are Claude's to measure at intake."],
     done=("Desktop build committed with compare sheet and QA." if code + "_build" in FROZEN_V1 else "Desktop build, BUILD_RESULT.md and MAKE_ASSETS.md committed; Claude makes the overlays and preview.html, renders the screen and runs QA and H10."))
    job(code + "_phone", f"{nm}: phone", "5 New screens", "build", SOL_SHOTS, [code + "_build", "phoneart_" + s["plate"]],
     goal=f"Recompose {nm} for the 393 × 660 iPhone: cinematic, no scroll.", read=BASE_READ + [CRAFT + " §6", folder + "/BUILD_RESULT.md"],
     steps=phone_steps_v2(s, folder, s["folder"], s["plate"], pf, hub=code in HUBS), deliverables=[folder + "/ (phone)", folder + "/BUILD_RESULT.md (Phone section with the height budget)"], selfcheck=["H5 at all three phone sizes by arithmetic (Claude measures).", "Faces visible in the band, Daniel left."], done="Phone layout committed with the height budget; Claude measures it at intake.")
    job(code + "_review", f"{nm}: review", "5 New screens", "review", SOL_SHOTS, [code + "_phone"],
     goal=f"Independent scorecard review of {nm}.", read=BASE_READ + [CRAFT, folder + "/TRUTH.md"],
     steps=review_steps_v2(folder, s["folder"], mock, [code + "_build", code + "_phone"]), deliverables=[folder + "/review/REVIEW.md"], selfcheck=["Every score has evidence."], done="Review committed with verdict and fix list.")
    job(code + "_fix", f"{nm}: fix round", "5 New screens", "fix", SOL_SHOTS, [code + "_review"],
     goal=f"Apply the {nm} review's fix list exactly (or skip if it passed).", read=BASE_READ + [CRAFT], steps=fix_steps_v2(folder, s["folder"]), deliverables=[folder + "/ (fixed)"], selfcheck=["All hard gates PASS (H5–H11 as Claude measures them)."], done="Fix list done or skipped.")
    job(code + "_motion", f"{nm}: motion", "5 New screens", "build", SOL_SHOTS, [code + "_fix", "motion"],
     goal=f"Give {nm} its entrance and signature moment.", read=BASE_READ + [CRAFT], steps=motion_steps_v2(s, folder, s["folder"]),
     deliverables=[folder + "/BUILD_RESULT.md (Motion section with the timeline table)", folder + "/evidence/motion/ (frame strips recorded by Claude at intake)"], selfcheck=["Criterion 8 ≥ 4.", "H7 PASS."], done=f"Motion committed; {nm} is at its finish line.", look=True)

for code in ["RB", "ST"]:
    s = SYSTEM_SCREENS[code]
    folder = V + "/" + s["folder"]
    nm = s["name"]
    sys_s = dict(desktop=s["design"], phone=s["design"][-2:], frames=s["frames"], mockup_take=[], overrides=["All text from the product word for word (TRUTH.md)."], depth=["No characters on this screen."], folder=s["folder"])
    steps = screen_build_steps_v2(code, sys_s, folder, V + "/shared/plates", system=True)
    job(code + "_build", f"{nm}: build (desktop and phone)", "5 New screens", "build", SOL_SHOTS, ["truth_" + code, "plate_SYS", "found_review", "wordmarks", "phoneart_SYS"],
     goal=f"Build {nm} in the Showdown system style for desktop and phone.", read=BASE_READ + [CRAFT, folder + "/TRUTH.md", folder + "/fixtures.json", V + "/shared/STAGE.md", V + "/shared/QA.md"],
     mockup=["No own mockup. Take the system from the other screens' mockups: brush title, eyebrow, gold-edged glass panels, gold primary button."] + s["design"],
     steps=steps, deliverables=[folder + "/ (index.html, css, js, tools/MAKE_ASSETS.md, tools/build_preview.py, BUILD_RESULT.md)"], selfcheck=["Text word for word from the product.", "H5 on phone by arithmetic (Claude measures)."], done="Build and BUILD_RESULT.md committed; Claude renders it and runs QA.")
    job(code + "_review", f"{nm}: review", "5 New screens", "review", SOL_SHOTS, [code + "_build"],
     goal=f"Independent review of {nm}.", read=BASE_READ + [CRAFT, folder + "/TRUTH.md"],
     steps=review_steps_v2(folder, s["folder"], "the system mockups (MOCKUP_CAREER_STATISTICS.png for panel and title style)", [code + "_build"]), deliverables=[folder + "/review/REVIEW.md"], selfcheck=["Every score has evidence."], done="Review committed.")
    job(code + "_fix", f"{nm}: fix round and motion", "5 New screens", "fix", SOL_SHOTS, [code + "_review", "motion"],
     goal=f"Apply the {nm} fix list (if any) and add the standard entrance motion.", read=BASE_READ + [CRAFT, V + "/shared/MOTION.md"],
     steps=fixmotion_steps_v2(folder, s["folder"], "title wipe, panels rise with stagger (60 ms), primary button last; reduced motion = fades"),
     deliverables=[folder + "/ (fixed + motion)"], selfcheck=["All hard gates PASS.", "Criterion 8 ≥ 4."], done=f"{nm} is at its finish line.", look=True,
     note="This job never skips: even when the review passed, the motion part still runs (then skip only the fix-list steps).")

# ---------------------------------------------------------------- Data: online history (S2C-005R2)
DD = "project-documents/factory/data"
REL = "project-documents/model-relay/LATEST.md (S2C-005R2, the accepted design with required corrections) and project-documents/model-relay/archive/ (C2S-005R2)"
job("data_model", "History data: the career model (pure code)", "6 Online history", "data", WORK, [],
 goal="Write the pure, provider-derived career model that every history screen will read: classification, counting, dedupe and records, with unit tests. No provider calls, no rules, no UI.",
 read=BASE_READ + [REL, "js/sharedCanonicalScoring.js, js/sharedHistoryConvergence.js, js/sharedTerminalClose.js, js/scoring.js on main", "AGENTS.md and POS20_CURRENT_STATE.json (repo rules for product code)"],
 truth=["Counting contract: the table in S2C-005R2 §2 (pending, active, final pending close, closed with witness, closed without witness = abandoned, unavailable).", "Key by canonical manager id; dedupe by rivalry id + accepted season identity; disagreement = integrity failure; averages from combined sums; best records from eligible seasons only.", "Empty index = new career; unreadable = unavailable; partial = visible partial with coverage."],
 steps=[
  "Write `" + DD + "/DATA_PLAN.md`: inputs (verified rivalry projections), outputs (career model shape for Legacy, Statistics, Rivalry, Trophy Room, Home), every rule from S2C-005R2 §2 and §5 mapped to a function.",
  "Implement `js/careerHistoryModel.js` (factory branch only) as pure functions in the repo's module style: `classifyRivalry`, `buildCareerModel(projections)`, `careerTotals`, `trophyCounts`, `seasonRecords`, `coverage`.",
  "Reuse canonical scoring and tie-break code; never re-implement scoring.",
  "Unit tests in the repo's test style (look at tests/ for the pattern): every row of the counting table, abandonment rebuild, dedupe, conflict, partial coverage, final draw, combined averages. Run them.",
  "Write `" + DD + "/MODEL_RESULT.md` with test output and open points. Commit and finish.",
 ],
 deliverables=["js/careerHistoryModel.js (factory branch)", "tests for it", DD + "/DATA_PLAN.md", DD + "/MODEL_RESULT.md"],
 selfcheck=["Tests green and listed.", "No change to main or to deployed rules."], done="Model and tests committed.",
 note="Candidate code only. It lives on the factory branch until GPT-5.6 Sol takes it through POS20 to main later.")
job("data_index", "History data: own-account career index (D1)", "6 Online history", "data", WORK, ["data_model"],
 goal="Implement the D1 career index with every correction S2C-005R2 §3 requires, as a candidate rules fragment and client code with emulator tests.",
 read=BASE_READ + [REL + " §3", "firestore.persistent-pair-production.fragment.rules, firestore.spark.rules, js/sparkPrivatePairing.js, js/persistentNikDanielPair.js on main", DD + "/DATA_PLAN.md"],
 truth=["Exact old-order preservation, exactly one new unique valid rivalry id, immutable entries, forged/unrelated references rejected, slot and role checked.", "Use getAfter() for membership in the same transaction; read all inputs before any write.", "Index and pair-link writes must agree; creation and redemption cannot bypass the index; no backfill; stale pre-deployment invites/links do not enroll.", "Idempotent reconfirmation. No truncation or eviction; explicit capacity behaviour."],
 steps=[
  "Write the design section into `" + DD + "/D1_INDEX.md` (document shape, rule predicates, transaction order for create and redeem, capacity strategy, cutover rule).",
  "Implement the rules fragment `firestore.career-index-candidate.fragment.rules` and the client changes in pairing (factory branch only).",
  "Emulator tests: items 1 and 2 of S2C-005R2 §6 evidence list (bypass, unrelated append, reorder, duplicate, forgery, stale cutover, retries, two-device race, capacity).",
  "Compile the composed rules artifact, not just the fragment; record the rule access budget of the full pairing transaction.",
  "Write results into D1_INDEX.md. Commit and finish.",
 ],
 deliverables=["firestore.career-index-candidate.fragment.rules", "client changes", "emulator tests", DD + "/D1_INDEX.md"],
 selfcheck=["All listed negatives fail as they must.", "Nothing deployed."], done="D1 candidate committed with emulator evidence.")
job("data_reader", "History data: completed-Showdown reader (D2)", "6 Online history", "data", WORK, ["data_index"],
 goal="Implement the D2 completed-only read grant and the session-free reader with every S2C-005R2 §4 correction.",
 read=BASE_READ + [REL + " §4", "js/sparkTerminalClose.js, js/sharedHistoryConvergence.js, firestore.terminal-close-production.fragment.rules, firestore.transfer-challenge-production.fragment.rules on main", DD + "/D1_INDEX.md"],
 truth=["Verify envelope, membership, complete terminal witness, season count, totals, winner (reuse sparkTerminalClose.read checks).", "Read exactly setup + season_1..N; missing/mismatched = unavailable.", "Transfers: keep the existing role/phase condition; never a blanket terminal read; unfinished opponent data stays denied.", "Closed writes stay denied."],
 steps=[
  "Design in `" + DD + "/D2_READER.md` (rule predicates, reader flow, validation order, transfer availability).",
  "Implement the rules fragment and `js/careerHistoryReader.js` feeding `careerHistoryModel.js`.",
  "Emulator tests: evidence items 3–7 of S2C-005R2 §6.",
  "Wire a `careerHistoryAvailability()` result the screens can show (ready / partial with coverage / unavailable / current-Showdown-only).",
  "Write results. Commit and finish.",
 ],
 deliverables=["rules fragment", "js/careerHistoryReader.js", "emulator tests", DD + "/D2_READER.md"], selfcheck=["Every S2C-005R2 §6 item 3–7 has a test."], done="D2 candidate committed with emulator evidence.")
job("data_review", "History data: Codex review", "6 Online history", "review", CODEX, ["data_reader"],
 goal="Independent security and correctness review of the history candidate (model, D1, D2).",
 read=BASE_READ + [REL, DD + "/DATA_PLAN.md", DD + "/D1_INDEX.md", DD + "/D2_READER.md"],
 steps=[
  "Check every S2C-005R2 correction (§3, §4, §5) against the code; list each as MET or NOT MET with file:line.",
  "Re-run the unit and emulator tests; try at least five abuse cases of your own against the rules.",
  "Check privacy: nothing reveals unfinished opponent data; list/delete denied; no cross-account disclosure.",
  "Write `" + DD + "/REVIEW_CODEX.md`: verdict, MET/NOT MET table, findings ranked by severity, exact fix list. Commit and finish.",
 ],
 deliverables=[DD + "/REVIEW_CODEX.md"], selfcheck=["Every finding has file:line and a reproduction."], done="Review committed.")
job("data_fix", "History data: fix round", "6 Online history", "fix", WORK, ["data_review"],
 goal="Fix every NOT MET item and finding from the Codex review.", read=BASE_READ + [DD + "/REVIEW_CODEX.md"],
 steps=["Fix each item, add a test that proves it.", "Re-run all unit and emulator tests.", "Update the three data docs with a Fix round section. Commit and finish."],
 deliverables=["code + tests"], selfcheck=["All tests green."], done="All review items closed.", look=True)

# ---------------------------------------------------------------- Integration
ALL_FINISH = ["home_motion", "league_motion", "club_packrip", "tr_motion", "ld_fix"] + [c + "_motion" for c in ORDER] + ["RB_fix", "ST_fix"]
IN = V + "/showcase"
job("int_hub", "Showcase: every screen in one place", "7 Integration", "integrate", SOL_SHOTS, ALL_FINISH,
 goal="One showcase page that opens every screen and frame and links them the way the app does, so Nik can walk the whole game.",
 read=BASE_READ + [CRAFT, "every screen's BUILD_RESULT.md"],
 steps=[
  S("Hub page (one screen group per saved part: 1a the four polished screens, 1b the seven new screens, 1c Loading, Standings, Rule Book, Settings)", ["each screen's BUILD_RESULT.md (its frames list only, one screen at a time)", V + "/shared/kit.html (panel and title classes)"], [IN + "/index.html", IN + "/showcase.css"],
    f"A Showdown-styled hub on the system plate `{V}/shared/plates/ENV_SYS_PLATE_V1_1X.webp` with the title SHOWDOWN SHOWCASE (kit display font, comment `TODO-WORDMARK`), listing every screen with its frames as text links (no thumbnails: you may link Claude's committed shots in each screen's evidence/ folder, never copy or make images).",
    "every screen folder and every frame id from the BUILD_RESULTs has a link."),
  S("Router", [IN + "/index.html", V + "/home/home.js (how Home reads `routes` from fixtures.json)"], [IN + "/router.js", IN + "/routes.json", IN + "/index.html"],
    "A tiny shared router (`?screen=` + `?frame=`) with its table in routes.json: Home tiles → their screens, Back controls → their product destinations, Statistics → Rivalry and Trophy Room, Season Results → Final Winner (preview route). No screen's product ids change. DEFAULT for a route the product has but the showcase lacks a screen for: route to the hub page.",
    "routes.json names a destination for every tile, Back and in-screen link."),
  S("Phone mode toggle", [IN + "/index.html", IN + "/showcase.css"], [IN + "/index.html", IN + "/showcase.css", IN + "/router.js"],
    "A toggle that shows the chosen screen inside a 393 × 660 frame (an iframe) and remembers the choice in the URL (`&phone=1`).",
    "the toggle exists and the iframe size is exactly 393 × 660."),
  S("Check by reading", [IN + "/routes.json", IN + "/index.html", "each target screen's fixtures.json `routes` block (one at a time)"], [STATUS + " (Self-check)"],
    "Every link target is an existing folder plus a frame id in that screen's fixtures.json; every Back route has a destination. No clicking in a browser: Claude walks the showcase at intake. Commit and finish.",
    "the Self-check lists every screen as reachable with its Back destination."),
 ],
 deliverables=[IN + "/ (index.html, showcase.css, router.js, routes.json)"], selfcheck=["Every screen reachable; every Back has a destination (by reading; Claude clicks it)."], done="Showcase committed.")
job("int_bind", "Showcase: history screens read the career model", "7 Integration", "integrate", SOL_SHOTS, ["int_hub", "data_fix"],
 goal="Make Legacy, Statistics, Rivalry, Trophy Room and Home read the career model (with fixtures through the same model in preview), with honest states.",
 read=BASE_READ + [DD + "/DATA_PLAN.md", "js/careerHistoryModel.js", "js/careerHistoryReader.js"],
 truth=["Previews may use labelled fixtures only (\"Preview data\"). The exact interim label from PRODUCT_TRUTH §4."],
 steps=[
  "Replace each screen's direct fixture numbers with a call into careerHistoryModel (fed by fixture projections in preview).",
  "Show the availability states from careerHistoryAvailability() on every history screen.",
  "Check that every number is identical across Legacy, Statistics, Rivalry, Trophy Room and Home for the same fixture set (write a small consistency test).",
  "Commit and finish.",
 ],
 deliverables=["screen bindings", "consistency test"], selfcheck=["Same numbers everywhere for the same data."], done="Bindings committed with the consistency test.")
job("int_phone", "Full phone pass", "7 Integration", "review", SOL_SHOTS, ["int_bind"],
 goal="One reviewer walks every screen and frame on phone sizes and writes one fix list.",
 read=BASE_READ + [CRAFT + " §6"],
 steps=[
  S("Collect Claude's phone measurements (one screen per saved part 1a, 1b, ...)", ["each screen's `evidence/qa/QA_SUMMARY.md` and its BUILD_RESULT.md Phone section (one screen at a time)"], ["project-documents/factory/reviews/PHONE_PASS.md (per-screen table)"],
    "Copy per screen and frame: scroll at 393 × 660, 360 × 640, 375 × 553, 390 × 844, 430 × 932, primary visible at 375 × 553, 44 px targets, input sizes, errors. Do not run factory-qa: Claude measured these at each intake; write NOT MEASURED where a number is missing (Claude measures).",
    "the table has one row per screen and frame with a source path per number."),
  S("Walk the flow by reading", [IN + "/routes.json", "each screen's fixtures.json `routes` block (one at a time)"], ["project-documents/factory/reviews/PHONE_PASS.md (section Flow)"],
    "Home → Start/Join → League → Club → Transfer → Season Results → Final Winner → Legacy → Statistics → Rivalry → Trophy Room → Rule Book → Settings: for each hop, the link exists in routes.json and the target frame exists. Claude clicks the real flow in phone mode at intake.",
    "every hop is listed as present or missing."),
  S("Consistency between screens (one css file per saved part)", ["each screen's phone media query in its css file (one at a time)"], ["project-documents/factory/reviews/PHONE_PASS.md (section Consistency)"],
    "A table: screen, hero band height, title size, pinned button bottom offset, tab style, reserved bar. DEFAULT shared value: the one most screens use; mark every outlier.",
    "every screen has a row and every outlier is marked."),
  S("Fix list", ["project-documents/factory/reviews/PHONE_PASS.md"], ["project-documents/factory/reviews/PHONE_PASS.md (section Fix list)"],
    "One numbered fix list (file, selector, change, target value). Commit and finish.",
    "PHONE_PASS.md is complete; the last commit is `Job {N} done: <job title>`."),
 ],
 deliverables=["project-documents/factory/reviews/PHONE_PASS.md"], selfcheck=["Every screen and frame covered (Claude's numbers or NOT MEASURED)."], done="Phone pass committed.")
job("int_phone_fix", "Full phone pass: fixes", "7 Integration", "fix", SOL_SHOTS, ["int_phone"],
 goal="Apply the phone pass fix list.", read=BASE_READ + ["project-documents/factory/reviews/PHONE_PASS.md"],
 steps=[
  S("Do the fix list, one item per saved part (1a, 1b, ...)", ["project-documents/factory/reviews/PHONE_PASS.md (the fix list)", "only the file(s) the item names"], ["only the file(s) the item names"],
    "In order, nothing more, at most two items per turn; note `item k: done, <file> <selector>` or `item k: BLOCKED, <reason>`. No screenshots, no factory-qa.",
    "every item is noted done or BLOCKED."),
  S("Check by reading", ["project-documents/factory/reviews/PHONE_PASS.md (targets)", "the changed css files"], [STATUS + " (Self-check)"],
    "Re-read every changed rule against its target; redo the height arithmetic for each touched screen at 393 × 660. Claude re-measures at intake.",
    "each item's target is met in the code."),
  S("Fix round", ["project-documents/factory/reviews/PHONE_PASS.md"], ["project-documents/factory/reviews/PHONE_PASS.md (section Fix round)"],
    "Items done, items blocked, screens Claude must re-measure. Commit and finish.",
    "PHONE_PASS.md has the Fix round section; the last commit is `Job {N} done: <job title>`."),
 ],
 deliverables=["fixed screens", "project-documents/factory/reviews/PHONE_PASS.md (Fix round)"], selfcheck=["H5 on every touched screen by arithmetic (Claude measures)."], done="Phone fixes committed.")
job("int_motion", "Motion and sound consistency pass", "7 Integration", "review", SOL_SHOTS, ["int_phone_fix"],
 goal="Make all screens move as one game: same timings, same easings, same entrance order, transitions between screens.",
 read=BASE_READ + [V + "/shared/MOTION.md"],
 steps=[
  S("Collect the timelines (one screen per saved part 1a, 1b, ...)", ["each screen's BUILD_RESULT.md Motion section (one at a time)"], ["project-documents/factory/reviews/MOTION_PASS.md (table)"],
    "One table: screen, entrance total, first usable, stagger, easings, reduced-motion path. No recordings: Claude's frame strips are in each screen's evidence/motion/; link them.",
    "every screen has a row; outliers against MOTION.md are marked."),
  S("Align outliers and add the shared transition", ["the outlier screens' css and js (one screen per saved part)", V + "/shared/motion.css"], ["only the timing constants in those files", IN + "/router.js", IN + "/showcase.css"],
    "Set outliers to the shared timings (values only, no new effects). Shared screen-to-screen transition in the showcase: fade through black with a gold wipe, 350 ms; reduced motion = plain fade.",
    "no screen deviates without a written reason; the transition is in the showcase."),
  S("Menu feedback sounds by reading", ["js/menuFeedback.js on main", V + "/shared/motion.js"], ["project-documents/factory/reviews/MOTION_PASS.md (section Sound)"],
    "If the product plays sounds: each fires once per action and respects the setting; write what you found. DEFAULT: Team V adds no new sounds.",
    "the Sound section says what the product does and what the kit respects."),
  S("Write the pass", ["project-documents/factory/reviews/MOTION_PASS.md"], ["project-documents/factory/reviews/MOTION_PASS.md"],
    "Verdict per screen and one numbered fix list. Commit and finish.",
    "MOTION_PASS.md is complete; the last commit is `Job {N} done: <job title>`."),
 ],
 deliverables=["project-documents/factory/reviews/MOTION_PASS.md"], selfcheck=["No screen deviates from shared timings without a reason."], done="Motion pass committed.")
job("int_final_review", "Final package review (Codex)", "7 Integration", "review", CODEX, ["int_motion"],
 goal="The last independent check of the whole visual package before Nik sees it.",
 read=BASE_READ + [CRAFT, "every REVIEW.md", "project-documents/factory/reviews/"],
 steps=[
  S("Hard gates table", ["each screen's `evidence/qa/QA_SUMMARY.md` and `review/REVIEW.md` (one screen per saved part)"], ["project-documents/factory/reviews/FINAL_REVIEW.md (section Hard gates)"],
    "Collect every hard gate per screen into one table. DEFAULT: carry Claude's committed measurements; rerun factory-qa only if your environment has a browser, and never wait on GitHub Actions.",
    "all eleven gates have a value per screen."),
  S("Score every screen", ["each screen's `review/REVIEW.md` and Claude's compare sheets in its evidence/ folder (read, never remake)"], ["project-documents/factory/reviews/FINAL_REVIEW.md (section Scores)"],
    "All 10 criteria per screen against the motion and final pass line, one evidence sentence each.",
    "every screen has ten scores with evidence."),
  S("Rights sweep", ["each screen's assets folder listing and its intake_report.md / phone_intake.md"], ["project-documents/factory/reviews/FINAL_REVIEW.md (section Rights)"],
    "List every image asset with its source job; check H2 and H3 (no real crests, logos, trophies, players; Reus only on Loading with credit; no live data in images).",
    "every asset has a source job and a PASS/FAIL."),
  S("Product truth sweep", ["each screen's TRUTH.md and index.html (one screen per saved part)"], ["project-documents/factory/reviews/FINAL_REVIEW.md (section Product truth)"],
    "Every button and stat on every screen traced to a TRUTH.md line; anything untraced is a finding.",
    "the trace table is complete."),
  S("Verdict and fix list", ["project-documents/factory/reviews/FINAL_REVIEW.md"], ["project-documents/factory/reviews/FINAL_REVIEW.md"],
    "Per-screen verdict and one numbered fix list (file, selector or asset, change, target). Commit and finish.",
    "FINAL_REVIEW.md is complete; the last commit is `Job {N} done: <job title>`."),
 ],
 deliverables=["project-documents/factory/reviews/FINAL_REVIEW.md"], selfcheck=["Every screen scored; every asset traced."], done="Final review committed.")
job("int_final_fix", "Final fixes", "7 Integration", "fix", SOL_SHOTS, ["int_final_review"],
 goal="Apply the final review's fix list.", read=BASE_READ + ["project-documents/factory/reviews/FINAL_REVIEW.md"],
 steps=[
  S("Do the fix list, one item per saved part (1a, 1b, ...)", ["project-documents/factory/reviews/FINAL_REVIEW.md (the fix list)", "only the file(s) the item names"], ["only the file(s) the item names"],
    "In order, nothing more, at most two items per turn; note `item k: done, <file> <selector>` or `item k: BLOCKED, <reason>`. No screenshots, no factory-qa.",
    "every item is noted done or BLOCKED."),
  S("Check by reading", ["project-documents/factory/reviews/FINAL_REVIEW.md (targets)", "the changed files"], [STATUS + " (Self-check)"],
    "Re-read every changed rule against its target. Claude re-measures every touched screen at intake.",
    "each item's target is met in the code."),
  S("Fix round", ["project-documents/factory/reviews/FINAL_REVIEW.md"], ["project-documents/factory/reviews/FINAL_REVIEW.md (section Fix round)"],
    "Items done, items blocked, screens Claude must re-measure. Commit and finish.",
    "FINAL_REVIEW.md has the Fix round section; the last commit is `Job {N} done: <job title>`."),
 ],
 deliverables=["fixed screens", "project-documents/factory/reviews/FINAL_REVIEW.md (Fix round)"], selfcheck=["All hard gates PASS everywhere (as Claude measures them)."], done="Final fixes committed.")
job("int_package", "Package for Nik and handoff to GPT-5.6 Sol", "7 Integration", "integrate", SOL, ["int_final_fix"],
 goal="One page Nik can open to approve the whole visual package, and one handoff for GPT-5.6 Sol to plan the move to main. Nothing goes to main in this job.",
 read=BASE_READ,
 steps=[
  S("Approval page (one screen group per saved part 1a, 1b, 1c)", ["each screen's `review/REVIEW.md` (scores) and the file names of Claude's 1366 × 768 and 393 × 660 shots in its evidence/ folder (one screen at a time)"], [IN + "/APPROVAL.html", IN + "/showcase.css"],
    "Every screen: Claude's committed desktop and phone shots next to its mockup from `project-documents/factory/mockups/`, referenced by path (link, never copy or make an image), with its final scores, in the Showdown look. DEFAULT when a shot is missing: an empty gold-edged slot with the words `Claude renders this at intake`.",
    "every screen has its row with mockup, two shots (or slots) and scores."),
  S("Package list", ["each folder's intake_report.md, phone_intake.md or README.md for SHA-256 lines (one folder per saved part)"], ["project-documents/factory/PACKAGE.md"],
    "Screens, folders, shared kit, assets with the SHA-256 copied from the intake files (never recompute binaries; DEFAULT when missing: `see <file>`), data candidate files, known gaps.",
    "every asset folder is listed with its hashes or the pointer."),
  S("Handoff", ["project-documents/factory/PACKAGE.md", "AGENTS.md (the POS20 paragraph only)"], ["project-documents/factory/HANDOFF_TO_SOL.md"],
    "For GPT-5.6 Sol: what is ready, what must go through POS20 to reach main (data candidate, screen integration), and the open questions. Nothing goes to main in this job. Commit and finish.",
    "HANDOFF_TO_SOL.md is committed; the last commit is `Job {N} done: <job title>`."),
 ],
 deliverables=[IN + "/APPROVAL.html", "project-documents/factory/PACKAGE.md", "project-documents/factory/HANDOFF_TO_SOL.md"], selfcheck=["No change to main."], done="Package and handoff committed.", look=True)

# ---------------------------------------------------------------- Added 2026-10-02 after the mockup-fidelity research
RES = "project-documents/factory/research/MOCKUP_FIDELITY_REPORT.md"
PHONE_SRC = {
 "HOME": ("Home", V + "/home/assets/ENV_HOME_PLATE_V1_2X.png", V + "/home/assets", ["cutout", "baseline"]),
 "LEAGUE": ("League", V + "/league/assets/ENV_LEAGUE_PLATE_V1_2X.png", V + "/league/assets", ["cutout", "baseline"]),
 "CLUB": ("Club Assignment", V + "/club/assets/ENV_CLUB_PLATE_V1_2X.png", V + "/club/assets", ["cutout", "baseline"]),
 "TRANSFER": ("Transfer War", V + "/tr2/slice-02-plate/assets/ENV_TR2_PLATE_G_LOCKED_V1_3344.png", V + "/tr2/slice-02-plate/assets", ["cutout", "baseline"]),
}
for code in ["TR", "CS", "RV", "LG", "SR", "SJ"]:
    f = NEW_SCREENS[code]["folder"]
    PHONE_SRC[code] = (NEW_SCREENS[code]["name"], f"{V}/{f}/assets/ENV_{code}_PLATE_V1_2X.png", f"{V}/{f}/assets", ["cutout", "plate_" + code])
for code, (nm, src, out, deps) in PHONE_SRC.items():
    job("phoneart_" + code, f"Phone art: {nm}", "3 Art", "image", SOL + " with image generation", deps,
     goal=f"Make the art for {nm}'s own phone composition: Daniel and Nik as large clean cut-outs, and a portrait (9:16) stadium background without people. The phone screen puts the two heroes large in the top half, like the mockup's feel, instead of shrinking the desktop scene to a thumbnail strip.",
     read=BASE_READ + [CRAFT + " §2, §3, §6", RES + " §3–§5", V + "/shared/CUTOUT_STANDARD.md"],
     mockup=[f"Source plate (the mockup's own pixels, likeness locked): `{src}`."],
     truth=["Cut-outs are masks of the plate's pixels, never redrawn faces, so likeness stays exact.", "Daniel left, Nik right; never mirror.", "No text, logos or data in any image."],
     steps=[
      f"Cut-outs: with `{V}/shared/tools/cutout.py`, draw a polygon around Daniel's whole visible figure (head, hair, shoulders, arms, hands, down to the plate's bottom edge or where his body leaves the frame) and one around Nik. Hair keeps a soft edge. Save `{out}/OVL_{code}_DANIEL_PHONE_V1.webp` and `OVL_{code}_NIK_PHONE_V1.webp` (transparent, about 1000 px tall, quality 85) plus PNG masters, and the polygons in `{out}/phonemap.json`.",
      f"Portrait guide: from the plate, take the centre region at 9:16 (full height), fill every part of Daniel and Nik inside it solid cyan (#00FFFF) with an 8 px margin, and save `{out}/GUIDE_{code}_PHONE.png`.",
      "Image edit (one request) on the guide with exactly this prompt:\n\n```\nEdit this image. Repaint every solid cyan area as empty night stadium continuing what is around it: crowd bokeh, floodlights, banners, dark atmosphere and warm golden light, same perspective. There are no people in the final image. Keep everything that is not cyan as it is. Add no text, no letters, no logos, no people. Portrait 9:16, the largest size available.\n```\nCheck: no cyan, no people, no text or logos, light matches. Retry in a NEW chat up to 3 times, always from the guide.",
      f"Export the background as `{out}/ENV_{code}_PHONE_V1.webp` at 1179 × 2096 (quality 80, aim ≤ 250 KB) plus a PNG master.",
      f"Proof: composite a 393 × 660 (×3) frame in Python: background cover, Daniel and Nik cut-outs large in the top 55 % (heads fully visible, Daniel left, both slightly overlapping the centre and the area below), and a dark gradient at the bottom where the buttons will sit. Save `{out}/PHONE_PROOF.png` and write the cut-out positions (as % of the frame) into phonemap.json.",
      f"Weight: phone art total (background + two cut-outs) ≤ 350 KB so the screen's first paint stays ≤ 450 KB. Write sizes and SHA-256 into `{out}/phone_intake.md`. Commit and finish.",
     ],
     deliverables=[f"{out}/ENV_{code}_PHONE_V1.webp", f"{out}/OVL_{code}_DANIEL_PHONE_V1.webp", f"{out}/OVL_{code}_NIK_PHONE_V1.webp", f"{out}/phonemap.json", f"{out}/PHONE_PROOF.png", f"{out}/phone_intake.md"],
     selfcheck=["Cut-out edges clean at 400 % (no halo, hair soft).", "Background has no people, text or logos.", "Proof shows both heads fully visible, large, Daniel left.", "Weight ≤ 350 KB."],
     done="Phone art and proof committed.")

job("phoneart_SYS", "Phone art: system stadium portrait", "3 Art", "image", SOL + " with image generation", ["plate_SYS"],
 goal="A portrait (9:16) version of the empty system stadium for Rule Book and Settings on phone.",
 read=BASE_READ + [CRAFT + " §3"],
 steps=[
  "Take the centre 9:16 region of `" + V + "/shared/plates/ENV_SYS_PLATE_V1_2X.png`. If it is too narrow to read as a stadium, make a guide with cyan bands above and below a scaled-down crop and ask the image tool (one request): \"Repaint the cyan areas as empty night stadium continuing the image: floodlights above, crowd bokeh, dark atmosphere, warm gold light. No people, no text, no logos. Portrait 9:16, largest size.\"",
  "Export `" + V + "/shared/plates/ENV_SYS_PHONE_V1.webp` at 1179 × 2096 (quality 80, ≤ 250 KB) plus PNG master; SHA-256 into the plates intake_report.md. Commit and finish.",
 ],
 deliverables=[V + "/shared/plates/ENV_SYS_PHONE_V1.webp"], selfcheck=["No people, text or logos.", "≤ 250 KB."], done="Portrait system plate committed.")

job("art_home_tiles", "Art: Home tile illustrations", "3 Art", "image", SOL + " with image generation", ["smoke"],
 goal="Real illustrated objects for the Home tiles, like the goal image, instead of thin line icons. Five objects, one image request each.",
 read=BASE_READ + [RES + " §2 item 3"],
 mockup=["GOAL_HOME.jpg tile row: each dark tile carries a large gold-on-black object that bleeds off its right edge: a tactics clipboard with X/O plays, a gold trophy, rising gold bars, a spiral rule book with plays, a black disc case. The Continue tile shows a player seen from behind in a black 17 shirt."],
 truth=["The anonymous 17-shirt figure seen from behind is the only person allowed (no face, no name, no real player).", "No text except the number 17 on that shirt. No logos.", "Trophy Room uses the League Title trophy from job 20, so no trophy here."],
 steps=[
  "For EACH of these five objects make ONE separate image request (never two in one image), with this prompt, filling in the object:\n\n```\nCreate a photorealistic product render of <OBJECT>, in black and polished gold, premium AAA video-game menu icon style, warm golden key light from the upper left, soft gold rim light, slight 3/4 angle, the whole object visible, centred, filling about 80 % of the image. Square 1:1, largest size. Transparent background if available, otherwise pure black. No text, no letters, no logos.\n```\nObjects: (a) a black tactics clipboard with gold metal clip and gold X and O play diagrams; (b) a stack of three black-and-gold collector cards fanned out with a small gold crown emblem on the top card (History/Legacy); (c) five rising gold bars on a black base with a soft glow (Statistics); (d) a black spiral-bound rule book with gold corners and gold play diagrams on the cover (Rule Book); (e) a black gear wheel interlocked with a gold disc (Settings).",
  "Sixth request, the Continue tile figure: \"Create a photorealistic render of an anonymous football player seen from behind, waist up, in a black shirt with a large gold number 17 and gold trim, short dark hair, no face visible, warm golden stadium light from the upper left, soft gold rim light. Portrait 2:3, largest size. Transparent background if available, otherwise pure black. No other text, no logos, no names.\"",
  "Check each: one object, no text (except 17), no logos, same family look. Retry any failure in a new request (max 3).",
  "Remove backgrounds to transparency (as in the trophy jobs), save `" + V + "/shared/art/home-tiles/TILE_<NAME>_V1.webp` (512 px, quality 88) and PNG masters, SHA-256 in `" + V + "/shared/art/home-tiles/README.md`. Commit and finish.",
 ],
 deliverables=[V + "/shared/art/home-tiles/"], selfcheck=["Six separate assets, one family look.", "No text except 17, no logos, no faces."], done="Tile art committed.")

job("art_wheel", "Art: League wheel rim", "3 Art", "image", SOL + " with image generation", ["smoke", "baseline"],
 goal="A lit gold wheel rim with depth, like the goal, to sit over the live wheel wedges.",
 read=BASE_READ + [V + "/league/BUILD_RESULT.md", V + "/league/league.css (wheel sizes)"],
 mockup=["GOAL_LEAGUE.jpg: a thick polished gold rim with small rivets, a darker inner bevel, warm highlight upper left, a small gold pointer notch at the top; the centre is the wheel face (blurred in the goal)."],
 truth=["The rim is decoration only: no league logos, no text. The wedges and marks stay live."],
 steps=[
  "Measure the current wheel in the League build: the rim's inner radius as a fraction of the outer radius. Write it in `" + V + "/shared/art/wheel/README.md`.",
  "One image request: \"Create a photorealistic render of a thick circular polished gold ring seen straight on, like the rim of a premium game-show prize wheel: small round gold rivets evenly spaced around it, a darker inner bevel, warm golden key light from the upper left, soft reflections. The inside of the ring is plain pure black. Square 1:1, largest size, the ring fills the image. No text, no logos, no pointer.\" Retry in a new request if it is not a clean circle (max 3).",
  "In Python: make the black centre and outside transparent, scale so the inner edge matches the measured inner radius, save `" + V + "/shared/art/wheel/WHEEL_RIM_V1.webp` at 1600 px (quality 88, ≤ 200 KB) and PNG master, SHA-256 in the README. Commit and finish.",
 ],
 deliverables=[V + "/shared/art/wheel/WHEEL_RIM_V1.webp"], selfcheck=["Perfect circle; centre transparent.", "No text or logos."], done="Wheel rim committed.")

job("wordmarks", "Art: brush title wordmarks", "3 Art", "image", SOL + " with image generation", ["smoke"],
 goal="Gold brush-lettered title images for every screen title that does not come from a plate job, so no screen uses a block font for its title.",
 read=BASE_READ + [RES + " §3 (titles)", CRAFT + " §4"],
 mockup=["Style reference: the brush titles in MOCKUP_TROPHY_ROOM.png (\"TROPHY ROOM\"), GOAL_LEAGUE.jpg (\"SELECT LEAGUE\") and GOAL_CLUB.jpg (\"CLUB ASSIGNMENT\" and the big \"VS\"): hand-brushed gold letters with dry-brush edges, slight forward slant, metallic highlights, dark outer shadow."],
 truth=["Fixed screen titles only (they never change). Live text never goes into an image.", "The real words stay in the page as visually-hidden text."],
 steps=[
  "Crop from the goals: `SELECT LEAGUE` (GOAL_LEAGUE.jpg), `CLUB ASSIGNMENT` and `VS` (GOAL_CLUB.jpg). Key each to transparency in Python (keep gold letters and outer shadow), clean edges, save as `TITLE_LEAGUE_V1`, `TITLE_CLUB_V1`, `TITLE_VS_V1`.",
  "Find the exact title words for Transfer War (its fixtures.json), Final Winner (\"SHOWDOWN CHAMPION\" unless TRUTH.md says otherwise), Rule Book and Settings (their TRUTH.md or the product).",
  "For each of those four, ONE separate image request: attach a crop of the TROPHY ROOM title from the mockup as the style reference and ask: \"Letter the words <WORDS> in exactly this hand-brushed gold style: dry-brush edges, slight forward slant, metallic highlights, dark outer shadow, on a pure black background, one line, the words fill 85 % of the width. Wide 3:1, largest size. Only these words, spelled exactly, nothing else.\" Check the spelling letter by letter; retry in a new request if wrong (max 3).",
  "Key the black out, trim, and save every wordmark to `" + V + "/shared/wordmarks/TITLE_<KEY>_V1.webp` (2X width about 1600 px, quality 88, ≤ 120 KB) with PNG masters, and list words, source (crop or generated), sizes and SHA-256 in `" + V + "/shared/wordmarks/README.md`. Commit and finish.",
 ],
 deliverables=[V + "/shared/wordmarks/"], selfcheck=["Spelling exact.", "Same brush family as the mockup titles."], done="Wordmarks committed.")

TG_HISTORY = "Team G (Claude gameplay team) ships or hands over the online career history provider work from S2C-005R2: the D1 own-account career index and the D2 completed-Showdown read grant. These are provider rules and product code on main, so Team G owns them. Claude clears this flag when Team G hands the work to the factory or delivers it."
for k in ["data_model", "data_index", "data_reader", "data_review", "data_fix"]:
    byk0 = {j["key"]: j for j in JOBS}; byk0[k]["team_g"] = TG_HISTORY
{j["key"]: j for j in JOBS}["int_bind"]["team_g"] = "Team G delivers the online career history (career model + reader) that this job binds the screens to. Until then the screens stay on labelled preview data."

job("navbar", "Top navigation bar from the mockups", "5 New screens", "build", SOL_SHOTS, ["found_review", "wordmarks"],
 team_g="Team G checks feasibility against the product: which of HOME / CAREER / STANDINGS / STATS / RULES / ABOUT (plus search, settings and profile icons, and the CAREER sub-menu CAREER HUB / TROPHIES / TRANSFERS / HISTORY / RECORDS) map to real product destinations and states, which must be dropped or renamed, whether a sticky top bar fits the phone target, and that it works with the Firebase Spark limits and the private two-manager scope. Claude writes Team G's answer into this job's status file and clears the flag.",
 goal="Build the FIFA 17-style top navigation bar the mockups show, limited to destinations the product really has, as a shared component every screen can use.",
 read=BASE_READ + [CRAFT, "Team G's feasibility answer (in this job's status file)"],
 mockup=["Every mockup's top bar: a slanted gold-edged CM17 badge on the left, then uppercase tabs HOME / CAREER / STANDINGS / STATS / RULES / ABOUT with the active tab in gold and a gold underline, a second row of sub-tabs on some screens (CAREER HUB > TROPHIES | TRANSFERS | HISTORY | RECORDS), a dark slanted capsule on the right with search, settings and profile icons, and the handwritten 'More Than A Game' far right."],
 truth=["Only destinations Team G confirms. Drop search if the product has no search. Profile = the signed-in manager's account state only.", "The bar must not cost the phone layout its no-scroll fit: on phone it becomes a compact top strip or a menu button.", "No real logos."],
 steps=[
  "Read Team G's answer: write the confirmed tab list, sub-tab list and icon list (each with its product destination) into `" + V + "/shared/navbar/NAV_CONTRACT.md`.",
  "Build `" + V + "/shared/navbar/navbar.css` and `navbar.js`: the slanted CM17 badge, tabs with an active gold state and underline, optional sub-tab row, right icon capsule, keyboard and screen-reader semantics (`nav`, `aria-current`).",
  "Phone version: a compact top strip with the badge and a menu button that opens the tabs in a sheet; measure that every screen still fits 393 × 660 with no scroll.",
  "Add the bar to two screens as a proof (Home and Career Statistics) and run factory-qa and the mockup-diff gate on both; the gate must still PASS.",
  "Write `" + V + "/shared/navbar/README.md` (how a screen adds the bar, the active-tab rule). Commit and finish.",
 ],
 deliverables=[V + "/shared/navbar/"], selfcheck=["Only confirmed destinations.", "No-scroll still holds on phone.", "Mockup-diff gate still PASS."], done="Navigation bar committed with proof on two screens.")


# ---------------------------------------------------------------- Team G agreement (G2V-001R2, DATA_CONTRACT_V1, V2G-003), 2026-10-02
DC = "project-documents/factory/DATA_CONTRACT_V1.md"
BYK = lambda: {j["key"]: j for j in JOBS}
TG_TRACK = {
 "data_model": ("Team G G-3: the pure career model", "G-3", []),
 "data_index": ("Team G G-7: own-account career index", "G-7", ["data_model"]),
 "data_reader": ("Team G G-8: completed-Showdown reader", "G-8", ["data_index"]),
 "data_review": ("Team G G-9 and G-10: Trophy Room standings and records, transfer history", "G-9 and G-10", ["data_reader"]),
 "data_fix": ("Team G G-5, G-6 and G-11: active adapter, nav lock fields, model-true fixtures", "G-5, G-6 and G-11", ["data_model"]),
}
for k, (title, gid, deps) in TG_TRACK.items():
    j = BYK()[k]
    j.update(title=title, type="tracking", worker="Team G (Claude gameplay team); tracking only", deps=deps, look=False, note=None, mockup=[], truth=[], inputs=[],
             goal=f"This line on the board tracks Team G's job {gid}. Online history is Team G's work (G2V-001R2). Team V workers never do this job.",
             read=[DC, "Team G's reports on branch leads/relay (project-documents/leads-relay/)"],
             steps=[f"Nothing for a Team V worker. Claude sets this job DONE when Team G reports {gid} delivered on the leads relay."],
             deliverables=["none (Team G delivers on its own branches)"], selfcheck=["Team G reported the job delivered."], done=f"Team G reported {gid} delivered.",
             team_g=f"Team G's job {gid}. Claude marks it DONE when Team G delivers.")

NB = V + "/shared/navbar"
j = BYK()["int_bind"]
j.update(team_g=None, title="Showcase: screens read Team G's model-true fixtures",
 goal="Swap every screen's sample data for Team G's model-true fixtures (G-11) using the exact DATA_CONTRACT_V1 field names, bind the top bar locks (G-6), and prove every number agrees across screens.",
 read=BASE_READ + [DC, "Team G's G-11 fixture files and adapter notes (the leads relay names where they are)"],
 truth=["Previews keep the visible \"Preview data\" tag. The exact interim label from DATA_CONTRACT_V1 §0.", "Never invent a field: if a screen needs something the fixtures lack, set BLOCKED and name the field; Claude asks Team G through the relay."],
 steps=[
  S("Binding table (one screen per saved part 1a, 1b, ...)", [DC, "the screen's fixtures.json", "the G-11 fixture file that supplies it (the leads relay names where it is)"], ["project-documents/factory/reviews/BINDING.md"],
    "For Home, Start/Join, Season Results, Final Winner, Rivalry, Career Statistics, Standings, Legacy and Trophy Room: every fixtures.json field next to its contract name and the G-11 file and key that supplies it. A field the fixtures lack: set BLOCKED and name it (Claude asks Team G).",
    "every field of every screen has a contract name and a source, or a BLOCKED line."),
  S("Replace the sample numbers (one screen per saved part 2a, 2b, ...)", ["the screen's fixtures.json", "its G-11 fixture file", "its js (only where a field name changes)"], ["the screen's fixtures.json", "its js if a field name changed"],
    "Swap the sample numbers for the G-11 values, keeping the screen's five states (`loading`, `empty`, `unavailable`, `partial`, `ready`), the visible \"Preview data\" tag and Daniel first.",
    "the screen's frames carry G-11 numbers and still render all five states."),
  S("Bind the top bar locks", [NB + "/navbar.js", "each hub screen's fixtures.json `nav` block (one at a time)"], [NB + "/navbar.js", "each hub screen's fixtures.json (`nav: {active, locked, reason}`)"],
    "Locked tap shows \"Finish this step first\" and does not navigate; a locked frame exists for every reason (`transfer-window` / `season-entry` / `setup`). Check every locked screen by reading; Claude clicks them at intake.",
    "every hub screen has its nav block and the lock reasons are covered."),
  S("Consistency check", ["the fixtures.json of Home, Legacy, Statistics, Rivalry, Standings and Trophy Room (one at a time)"], [V + "/shared/tools/check_binding.py", STATUS + " (notes: the script output)"],
    "A small Python script (runs in your sandbox on the JSON files) that asserts every shared number is identical across those screens for the same fixture set; run it until it prints `0 errors` and paste the output into the notes. Commit and finish.",
    "the script prints `0 errors`; the last commit is `Job {N} done: <job title>`."),
 ],
 deliverables=["screen bindings", "project-documents/factory/reviews/BINDING.md", V + "/shared/tools/check_binding.py"])

# Top bar (contract §10 + V2G-003): build it now on fixtures
j = BYK()["navbar"]
j.update(team_g=None, title="Top bar and phone bottom bar",
 goal="Build the FIFA 17-style top bar Team G approved (five tabs plus a settings icon) and its phone bottom bar, as one shared component every hub screen uses. Build on fixtures now; the real lock fields arrive with Team G's G-6 and are bound in job 104.",
 read=BASE_READ + [CRAFT, DC + " §10 (the agreed bar)"],
 truth=["Tabs exactly: HOME → `mainMenu`; CAREER → the current Showdown's live step (with no Showdown: Home's Start / Join); STANDINGS → the Standings screen; STATS → Career Statistics (Rivalry inside); RULES → Rule Book; a settings icon at the right end → Settings (credits and app version). No ABOUT tab, no search, no profile icon.",
        "Locks: `nav.locked` and `nav.reason` (`transfer-window` / `season-entry` / `setup`). While locked a tab tap shows \"Finish this step first\" and does not navigate. A tab whose data is not ready still opens its screen in its own loading / unavailable state; tabs never hide.",
        "Desktop: the bar is 52 px tall at the top and stays visible on every screen (locked where the contract says).",
        "Phone (900 px wide and below): a 5-icon bottom bar, 56 px plus `env(safe-area-inset-bottom)`, with the settings icon in the top corner. It shows ONLY on hub screens: Home, Start / Join, Legacy, Trophy Room, Career Statistics / Rivalry, Standings, Rule Book, Settings. It is hidden on Loading, the League and Club wheels, Transfer War, Season Results entry and the Final Winner reveal.",
        "No real logos; the CM17 badge is our own."],
 steps=[
  S("Contract", [DC + " §10"], [NB + "/NAV_CONTRACT.md"],
    "The tabs with destinations, the lock rule and reasons, the hub / non-hub screen list, the two bar heights (52 px top, 56 px bottom plus safe area), and the fixture shape `nav: {active, locked, reason}`.",
    "NAV_CONTRACT.md answers every question the build steps need."),
  S("Desktop bar: markup and CSS", [NB + "/NAV_CONTRACT.md", V + "/shared/showdown-ui.css (button and chip classes only)"], [NB + "/navbar.css", NB + "/navbar.js"],
    "navbar.js builds the markup from a config object (`nav` element, slanted gold-edged CM17 badge on the left, the five uppercase tabs, a dark slanted capsule on the right with the settings icon); navbar.css styles it with the gold active state and underline, 52 px tall, kit tokens only.",
    "a page that includes the two files shows the bar with the five tabs and the settings icon."),
  S("Desktop bar: behaviour", [NB + "/navbar.js"], [NB + "/navbar.js", NB + "/navbar.css"],
    "`aria-current` on the active tab, keyboard focus rings, and the locked behaviour: a locked tab tap shows the toast \"Finish this step first\" and does not navigate; tabs never hide. Routes come from the config object, never from the product ids.",
    "the lock, the toast and `aria-current` are in the code."),
  S("Phone bottom bar", [NB + "/navbar.css", NB + "/navbar.js"], [NB + "/navbar.css", NB + "/navbar.js"],
    "Five icons with short labels, ≥ 44 px targets, gold active state, 56 px plus `env(safe-area-inset-bottom)`; a screen opts in with `data-nav=\"hub\"` and out with `data-nav=\"hidden\"`; the settings icon moves to the top corner. Icons are inline SVG you write (no image files).",
    "the bottom bar renders only on `data-nav=\"hub\"` pages at ≤ 900 px."),
  S("Proof by text", [V + "/home/index.html", V + "/home/home.css (the phone media query)"], [V + "/home/index.html", V + "/home/home.css", NB + "/proof.html"],
    "Add the bar to Home (desktop and phone, Home is a hub) and write a blank hub test page proof.html with a locked frame. Redo Home's 393 × 660 height arithmetic with the bar reserved (no scroll at 393 × 660, 360 × 640, 375 × 553). No factory-qa and no mockup-diff: Claude runs both at intake (the Home gate must still PASS).",
    "Home includes the bar, proof.html exists, the arithmetic shows the fit."),
  S("README", [NB + "/NAV_CONTRACT.md"], [NB + "/README.md"],
    "How a screen adds the bar, the space it reserves, the active-tab rule, the lock fixture. Commit and finish.",
    "README.md is committed; the last commit is `Job {N} done: <job title>`."),
 ],
 deliverables=[NB + "/"], selfcheck=["Exactly five tabs plus settings.", "Locked tap does not navigate.", "No-scroll still holds on phone with the bar.", "Home mockup-diff gate still PASS."],
 done="Top bar and bottom bar committed with proof on Home and the test page.")

# Every hub screen reserves the bar; non-hub screens use the full phone height
BAR_HUB = "Bottom bar: this is a hub screen, so on phone (≤ 900 px) it reserves the shared bottom bar (56 px plus `env(safe-area-inset-bottom)`, job " + "{navbar}" + "): the 393 × 660 no-scroll fit and the pinned primary action are measured ABOVE that reserved space (use a placeholder `<div class=\"nav-reserve\">` until the bar exists). On desktop leave the top 52 px for the top bar; the plate runs behind it."
BAR_NONE = "No bottom bar on this screen (it is hidden here, V2G-003): use the full 393 × 660 on phone. On desktop the top bar may sit in the top 52 px; keep that strip free of faces and titles."
for k in ["home_phone", "SJ_phone", "LG_phone", "TR_phone", "CS_phone", "RV_phone", "RB_build", "ST_build", "home_seven", "SJ_build", "LG_build", "TR_build", "CS_build", "RV_build"]:
    BYK()[k]["truth"].append(BAR_HUB)
# (the v2 phone steps reserve the bar inside their "Controls and the pinned action" step for hub screens)
for k in ["league_phone", "club_phone", "tr_phone", "SR_phone", "FW_phone", "ld_polish", "SR_build", "FW_build", "league_hands", "club_panels", "tr_polish"]:
    BYK()[k]["truth"].append(BAR_NONE)

# Home tile reasons (contract §1): Team V writes the words
BYK()["home_seven"]["truth"].append("Tiles History, Statistics, Trophy Room and Rivalry carry `available` plus a `reason` from the closed set `loading` / `reconnecting` / `not-paired` / `unavailable` (DATA_CONTRACT_V1 §1). Write one short plain message per reason into Home's fixtures.json (for example \"Loading…\", \"Reconnecting…\", \"Pair with your rival first\", \"Not available right now\") and design the disabled tile with it; never hide a tile.")
BYK()["home_seven"]["read"].append(DC + " §1")

# Wordmarks: add Standings
w = BYK()["wordmarks"]
w["steps"][1] = w["steps"][1].replace("Rule Book and Settings", "Rule Book, Settings and Standings (\"STANDINGS\")")

# Standings: its own screen over existing view models (contract §10, §5, §7)
SDF = V + "/standings"
RVA = V + "/" + NEW_SCREENS["RV"]["folder"] + "/assets"
job("truth_SD", "Truth sheet: Standings", "1 Truth", "data", SOL, [],
 goal="Write down exactly what the Standings screen shows. It adds no new data: the current Showdown uses Rivalry Statistics' head-to-head block, the career view uses Trophy Room `standings` (Team G's G-9).",
 read=BASE_READ + [DC + " §5, §7 and §10", "js/statistics.js (renderRivalryComparison) on main", V + "/home/fixtures.json (fixture shape example)"],
 truth=["Fields only from DATA_CONTRACT_V1: this Showdown = `score.{daniel,nik}`, season W/D/L (`seasonWins`, `seasonDraws`, `seasonLosses`), `season` / `totalSeasons`, trophy counts; career = `standings` (by `careerPoints`, then season wins, else level). Nothing else.",
        "Before career history is real the career view shows exactly \"Current Showdown only. Career history is not yet available.\""],
 steps=[
  f"Write `{SDF}/TRUTH.md`: the route (STANDINGS tab), the two views (This Showdown / Career), every field with its contract name, E or A, and level; the five states.",
  "Write the strings: headings, the view toggle, empty, loading, unavailable and interim texts, in the product's plain style.",
  f"Write `{SDF}/fixtures.json` with frames SD1 this Showdown mid-way · SD2 career standings · SD3 first season, nothing played · SD4 career with the interim label · SD5 loading · SD6 unavailable; fictional values within contract §0 bounds; `previewLabel: \"Preview data\"`; Daniel first. Commit and finish.",
 ],
 deliverables=[SDF + "/TRUTH.md", SDF + "/fixtures.json"], selfcheck=["Every field is in the contract.", "Daniel first everywhere."], done="TRUTH.md and fixtures.json committed.")
job("SD_build", "Standings: build (desktop and phone)", "5 New screens", "build", SOL_SHOTS, ["truth_SD", "plate_RV", "phoneart_RV", "art_review", "found_review", "wordmarks"],
 goal="Build Standings as its own cinematic screen: the head-to-head table of the Showdown, with Daniel and Nik standing out of the menu.",
 read=BASE_READ + [CRAFT, SDF + "/TRUTH.md", SDF + "/fixtures.json", RVA + "/platemap.json", V + "/shared/STAGE.md", V + "/shared/CUTOUT_STANDARD.md", V + "/shared/QA.md"],
 mockup=["No own mockup. Default (Claude's pick): reuse the Rivalry Statistics plate and phone art (the face-off scene), but with its own layout: the brush wordmark STANDINGS, one large central scoreboard (Daniel left, Nik right, Showdown points huge, season W/D/L and trophy counts beneath), a This Showdown / Career toggle above it. Style from MOCKUP_RIVALRY_STATISTICS.png panels."],
 truth=["Only contract fields (TRUTH.md). The leader's number gets the gold flash; a level score says \"Level\".", BAR_HUB],
 steps=[
  S("Scaffold", [V + "/home/index.html (the head and the page shell only)", V + "/home/home.js (only the part that reads `?frame=`)", SDF + "/fixtures.json"], [SDF + "/index.html", SDF + "/standings.css", SDF + "/standings.js"],
    "Link the shared tokens, type, ui, stage and motion css and js; standings.js reads `?frame=` (DEFAULT: the first frame) and writes every string and value from fixtures.json into plain DOM.",
    "every frame id opens via `?frame=` and shows its strings as unstyled text."),
  S("Stage", [V + "/shared/STAGE.md", RVA + "/platemap.json"], [SDF + "/index.html", SDF + "/standings.css", SDF + "/standings.js"],
    f"Draw the Rivalry plate `{RVA}/ENV_RV_PLATE_V1_1X.webp` (`_2X` for DPR ≥ 2) through the stage engine at mockup registration (cover, centred, no zoom, no shift); atmosphere on; `data-manager` markers from the face boxes.",
    "stage container and both plate URLs are in the code."),
  S("Title block", [V + "/shared/wordmarks/README.md"], [SDF + "/index.html", SDF + "/standings.css"],
    f"The brush wordmark `{WORDMARK_FILE['SD']}` with the hidden real words, eyebrow and tagline in the shared type classes, placed like Rivalry Statistics' title (same top y). DEFAULT if the file is missing: kit display font with the comment `TODO-WORDMARK`.",
    "the title block is in the code with its position."),
  S("Scoreboard panel", [SDF + "/TRUTH.md (fields and strings)", SDF + "/fixtures.json"], [SDF + "/index.html", SDF + "/standings.css", SDF + "/standings.js"],
    "One large central scoreboard (about 44 % width, Daniel left, Nik right): Showdown points huge, season W/D/L and trophy counts beneath; the leader's number gold, a level score says \"Level\"; every number DOM text.",
    "the This Showdown view renders from fixtures.json."),
  S("Toggle and career view", [SDF + "/TRUTH.md (career view and interim label)", SDF + "/fixtures.json"], [SDF + "/index.html", SDF + "/standings.css", SDF + "/standings.js"],
    "The This Showdown / Career toggle above the scoreboard (`.sd-tabs`, `aria-selected`) and the career table view (`standings` by `careerPoints`, then season wins, else level) with the exact interim label when history is not real.",
    "both views switch without a page reload and the interim label is word for word."),
  S("Depth sandwich (recipe only)", [V + "/shared/CUTOUT_STANDARD.md", RVA + "/platemap.json"], [RVA + "/platemap.json", SDF + "/tools/MAKE_ASSETS.md", SDF + "/standings.css"],
    f"Where the panel meets a manager's shoulder or arm, write the cut-out polygon under `cutouts` in platemap.json and the `python3 {V}/shared/tools/cutout.py ... --rim` command into MAKE_ASSETS.md; reference `OVL_SD_<PART>_V1` WebP files in the HTML and style rim light and contact shadow in CSS. Claude makes the files. DEFAULT if nothing overlaps: write `no cut-outs needed` in MAKE_ASSETS.md.",
    "polygons and commands are written, or the no-cut-outs line is."),
  S("States", [SDF + "/fixtures.json"], [SDF + "/standings.js", SDF + "/standings.css"],
    "Every frame SD1–SD6: empty, loading, unavailable and interim states are designed panels with an icon and plain words, never blank space; the \"Preview data\" chip above the crown.",
    "each frame renders its own designed state."),
  S("Phone layout (heavy step: alone in its turn)", [RVA + "/phonemap.json", SDF + "/standings.css"], [SDF + "/standings.css", SDF + "/index.html", SDF + "/tools/MAKE_ASSETS.md"],
    f"Portrait ≤ 760 px: the Rivalry phone art (`{RVA}/ENV_RV_PHONE_V1.webp`, `OVL_RV_DANIEL_PHONE_V1.webp`, `OVL_RV_NIK_PHONE_V1.webp` via `<picture>`, positions from phonemap.json) with both managers large in the top about 55 %, the scoreboard and toggle below, the bottom bar space reserved (`<div class=\"nav-reserve\">`), 44 px targets. DEFAULT if a cut-out file is missing: reference it and add its cutout.py line to MAKE_ASSETS.md.",
    "the media query holds the whole phone layout."),
  S("Phone height budget by arithmetic", [SDF + "/standings.css"], [SDF + "/BUILD_RESULT.md (section \"Phone\", table \"Height budget\")"],
    "Add up the fixed heights at 393 × 660, 360 × 640 and 375 × 553 with the bar reserved and show they fit with no scroll. " + CLAUDE_MEASURES,
    "the table shows the sum per size and the remaining pixels, all ≥ 0."),
  S("Check by reading and BUILD_RESULT", [SDF + "/index.html", SDF + "/standings.css", SDF + "/standings.js", V + "/home/tools/build_preview.py"], [SDF + "/BUILD_RESULT.md", SDF + "/tools/build_preview.py", SDF + "/tools/MAKE_ASSETS.md"],
    "Score criteria 1–7, 9 and 10 from the code (aim ≥ 4), estimate first paint from file sizes (≤ 450 KB phone, ≤ 900 KB desktop), confirm every number is DOM text and Daniel is left. Copy build_preview.py with this screen's file names but do not run it; add it to MAKE_ASSETS.md (Claude makes preview.html and runs QA). Commit and finish.",
    "BUILD_RESULT.md, build_preview.py and MAKE_ASSETS.md are committed; the last commit is `Job {N} done: <job title>`."),
 ],
 deliverables=[SDF + "/ (index.html, standings.css, standings.js, tools/MAKE_ASSETS.md, tools/build_preview.py, BUILD_RESULT.md)"], selfcheck=["Own scorecard criteria 1–7, 9 and 10 at least 4 each.", "H5 on phone with the bar reserved, by arithmetic (Claude measures)."], done="Standings build and BUILD_RESULT.md committed; Claude makes the assets and runs QA.")
job("SD_review", "Standings: review", "5 New screens", "review", SOL_SHOTS, ["SD_build"],
 goal="Independent review of Standings.", read=BASE_READ + [CRAFT, SDF + "/TRUTH.md"],
 steps=review_steps_v2(SDF, "standings", "MOCKUP_RIVALRY_STATISTICS.png (style reference; Standings has no own mockup)", ["SD_build"]), deliverables=[SDF + "/review/REVIEW.md"], selfcheck=["Every score has evidence."], done="Review committed.")
job("SD_fix", "Standings: fix round and motion", "5 New screens", "fix", SOL_SHOTS, ["SD_review", "motion"],
 goal="Apply the Standings fix list (if any) and add its entrance and count-up motion.", read=BASE_READ + [CRAFT, V + "/shared/MOTION.md"],
 steps=fixmotion_steps_v2(SDF, "standings", "title wipe, managers slide in from their sides, points count up with `sdCountUp`, the leader's number flashes gold once; reduced motion = fades"),
 deliverables=[SDF + "/ (fixed + motion)"], selfcheck=["All hard gates PASS.", "Criterion 8 ≥ 4."], done="Standings is at its finish line.", look=True,
 note="This job never skips: even when the review passed, the motion part still runs.")
BYK()["int_hub"]["deps"].append("SD_fix")
BYK()["navbar"]["deps"] = ["found_review", "wordmarks"]

# Capacity re-plan 2026-10-02 07:40 UTC: Nik has a couple of Sol Work mode workers until his reset (Sat 3 Oct 17:00 UTC).
# Jobs 1, 12 and 17 no longer wait for job 0 (it is done anyway). Work mode had no browser, so they run in normal chats.
for k in ["baseline", "tokens", "qa"]:
    j = BYK()[k]
    j["deps"] = [d for d in j["deps"] if d != "smoke"]
    j["worker"] = SOL_SHOTS
    j["note"] = ((j["note"] + " ") if j["note"] else "") + "Runs in a normal chat: job 0 found the normal chat has Chromium and scikit-image, while Sol Work mode had no browser (job 1, 2026-10-02). You save your own work (handbook §7): text files straight to the branch, small binaries through the inbox, no screenshots or QA renders (Claude renders the screen from your committed code)."

# Claude review of the first truth sheets and tokens (2026-10-02 09:30 UTC): small errors fixed in commit 22a7987, the rest goes to fix jobs.
TRUTH_FIX = {
 "TR": ("trophy-room", [
   "Use the Showdown-record field shape `showdowns.daniel.wins` / `showdowns.nik.wins` (as Career Statistics does) instead of `managers.daniel.showdowns.wins`; update fixtures.json and TRUTH.md.",
   "Say in TRUTH.md that the standings rows stay Daniel-first with `#` showing the rank, and add a frame where Nik leads the standings.",
   "Write the words for the loading, partial and unavailable states and a partial-state heading that replaces ALL-TIME RECORDS (new copy, `\"source\": \"new\"`).",
   "Make TR1 `careerPoints` believable and consistent with the trophy counts in the same frame (recompute with a check script; league title = position 1).",
   "Add a short Phone section: shelf as a sideways swipe, both managers in the top band, bottom bar reserved (hub screen), 393 × 660 with no scroll."]),
 "CS": ("career-statistics", [
   "Keep the `showdowns.daniel.wins` field shape and confirm it in TRUTH.md (Trophy Room is being aligned to it).",
   "Say in TRUTH.md that the career table rows stay Daniel-first with `#` showing the rank, and add a frame where Nik leads.",
   "Write the words for the loading, partial and unavailable states and the partial-state heading (new copy, `\"source\": \"new\"`).",
   "Mark the new upper-case row labels in TRUTH.md lines about 205–210 as new copy, and use main's wording (\"Average League Points\" etc.) where main has it.",
   "Add a short Phone section: stacked or tabbed sections, managers in the top band, bottom bar reserved (hub screen), 393 × 660 with no scroll."]),
 "LG": ("legacy", [
   "Replace the contract tokens in `strings.states` (LOADING, PARTIAL, UNAVAILABLE) with real words (new copy, `\"source\": \"new\"`); mark `tagline` as decorative brand text.",
   "Open MOCKUP_LEGACY_V2.png itself and add the missing rows to the mockup table: CM 17 logo, \"More Than A Game\", banners, footer slogans, eyebrow (each KEEP / CHANGE / DROP).",
   "Add a Phone section: cards as a sideways swipe, side menu as tabs, VIEW SEASON HISTORY pinned at the bottom above the reserved bottom bar, 393 × 660 with no scroll."]),
 "SR": ("season-results", [
   "Add a Phone section per Nik's notes: a Daniel / Nik toggle (useful from `results-ready` on), a \"How scoring works\" pop-up, REVIEW pinned at the bottom; the bottom bar is hidden on this screen; 393 × 660 with no scroll.",
   "Write the sealed-rival state: main hides the rival card, so say in TRUTH.md that the sealed state is visual only, or add the words as new copy (`\"source\": \"new\"`) such as \"Waiting for Nik\".",
   "Add a `context` block to every frame (season, totalSeasons, leagueId, clubs) within the contract bounds.",
   "Add a build note: the stale main strings that mention \"Confirm & Save Season\" and \"SCORING REMAINS LOCKED…\" stay as text, but the build must not add a Confirm & Save Season button."]),
 "FW": ("final-winner", [
   "Add frames FW6–FW9 for `loading`, `empty`, `unavailable` and `partial`, with words written as new copy (`\"source\": \"new\"`).",
   "Decide the draw and winner presentation under Open questions and write it into TRUTH.md: draw headline uses main's `DRAW` / `The showdown finishes level` (no crown on a draw); the winner gets the warm spotlight and the other manager is dimmed to 70 %.",
   "Pick ONE completed surface for the online route (the shared Terminal Close result, `completed`) and make FW1–FW3 use the same heading family as FW5; keep the local dashboard heading only as a note.",
   "Add a Phone section: the reveal fills 393 × 660 with no scroll, winner first in the top band, bottom bar hidden."]),
 "RV": ("rivalry-statistics", [
   "Open MOCKUP_RIVALRY_STATISTICS.png itself and give every element an explicit answer in the mockup table: rows Seasons Completed, Trophies Won, Season Wins; League Points (412) and League Goals (126) DROP (the contract has no totals); tagline, eyebrow, caption \"EVERY SEASON WRITES A NEW CHAPTER.\", the season-by-season headers, the trophy labels (CONTINENTAL becomes Champions League), \"More Than A Game\", banners, search / profile icons and ABOUT.",
   "Reword line about 276: the brush wordmark comes from job 124 (production wordmarks); do not call it approved.",
   "Add frames for `loading`, `unavailable` and `partial` (with `coverage`), words as new copy (`\"source\": \"new\"`).",
   "Add a Phone section: managers in the top band, head-to-head first, season list as tabs or a swipe, bottom bar reserved (hub screen), 393 × 660 with no scroll."]),
}
for code, (folder, items) in TRUTH_FIX.items():
    nm = [t for c, t in TRUTH_TARGETS if c == code][0]
    f = V + "/" + folder
    job("truthfix_" + code, f"Truth sheet fix: {nm}", "1 Truth", "fix", SOL, ["truth_" + code],
     goal=f"Apply Claude's review of the {nm} truth sheet. Claude already fixed the small errors (commit 22a7987); these items are the rest.",
     read=BASE_READ + [DC, f + "/TRUTH.md", f + "/fixtures.json"],
     steps=[f"{it} Files: `{f}/TRUTH.md` and/or `{f}/fixtures.json`." for it in items] + ["Run a Python check that recomputes every score, total, winner, trophy count and margin in fixtures.json (league title = position 1, no shared league position in one season, contract bounds) and paste the output into the notes. Commit and finish."],
     deliverables=[f + "/TRUTH.md", f + "/fixtures.json"], selfcheck=["Every review item done.", "The check script prints no errors."], done="Every review item applied and the fixture check is clean.")
    b = BYK().get(code + "_build")
    if b: b["deps"].append("truthfix_" + code)

BYK()["kit"]["truth"] += [
 "From Claude's review of job 12: Kaushan Script ships only weight 400, so titles use 400 (or `font-synthesis: none`), never a faked bold.",
 "The manager accents `--sd-daniel` and `--sd-nik` are thin markers only, never fills (Nik's accent is almost the same as the gold).",
 "`--sd-text-dim` is decorative only, never body text. Add a token for the desktop panel blur (`backdrop-filter: blur(6px)`, with `-webkit-`).",
 "The wordmark crops in shared/evidence are low resolution; screens use the production wordmarks from job 124, never the evidence crops."]


# Team G G2V-005 (leads/relay b0fadae, 2026-10-02 10:05): view-model details that the builds must follow
BYK()["SR_build"]["truth"].append("Team G (G2V-005): the provider `breakdown` is nested per manager (`breakdown.daniel.{championsLeague, leagueTitle, domesticCup, performanceBonus, awardsBonus, total}`, same for `nik`) and is `null` until the season is `committed`; `winner` and `tiebreak` are also `null` until then. Before commit the score bar shows a live preview the screen computes from the manager's own inputs with the shared scoring function; never read a provider breakdown before `committed`.")
BYK()["SJ_build"]["truth"].append("Team G (G2V-005, job G-6): the Start / Join view model has `status`, `viewerRole`, `busy`, `primaryActions` and `moreActions`; each action is `{available, enabled, provider, args, confirm, confirmedByProvider}`. Render buttons only from available actions; a disabled action looks disabled, never hidden. The pairing code is shown only to Daniel after he created it. RETRY and RESTORE BACKUP stay (Team G adds them to the model).")
BYK()["int_bind"]["truth"].append("Team G's state texts and confirm texts are placeholders; Team V's copy from the truth sheets wins. List every Team V string the model shows in BINDING.md so Claude can send them to Team G over the relay.")


# Second review (2026-10-02 14:30 UTC): the fix jobs left impossible inputs (both managers winning the same cup or the Champions League, 2-season Showdowns). New shared checker: shared/tools/check_fixtures.py.
CHK = "python3 " + V + "/shared/tools/check_fixtures.py"
REAL = {
 "TR": ("trophy-room", ["Regroup the preview seasons into Showdowns of valid length (1, 3, 5 or 10 seasons; today seasons 2–3 and 4–5 form 2-season Showdowns). Recompute BIGGEST SHOWDOWN WIN (value and ref) and TR3's aggregates.", "Give each season's domestic cup, Champions League, top scorer and top assist to at most ONE manager (season 1 has both winning the cup; seasons 2 and 5 have both top scorer)."]),
 "CS": ("career-statistics", ["Give each season's domestic cup, Champions League, top scorer and top assist to at most ONE manager (season 1 in CS1, CS3 and CS6 has both winning the cup; season 3 / season 2 have both top scorer).", "Label the two rankings clearly: the Career Table keeps main's order (Showdown wins, then trophies, then points); say in TRUTH.md that Trophy Room standings use careerPoints instead, so the build never mixes them."]),
 "LG": ("legacy", ["Rebuild `fixtureEvidence` with believable inputs: the Champions League goes to at most one manager per season (today both win it in all 28 seasons), never both domestic cups or both top scorer / top assist in one season. Then retune every card's season scores and Showdown totals to match (card totals will drop well below 20 for 3 seasons).", "Use the same placeholder style as Trophy Room in the partial message (`{READABLE} of {INDEXED}`)."]),
 "FW": ("final-winner", ["The online result (Terminal Close, `SHARED SHOWDOWN CLOSED`) renders no navigation buttons on main. Remove the local-hub actions (VIEW LEGACY, TROPHY ROOM, RIVALRY STATISTICS, NEW SHOWDOWN, MAIN MENU) from FW1–FW3, FW5 and FW9, keep only what main's shared surface offers plus the top bar, and update the TRUTH.md mockup row and Open questions.", "FW9 `partial` must show a real partial read (`coverage.readable` lower than `coverage.indexed`) and say which data is missing.", "Rewrite `fixtureEvidence` in the nested Team G shape (`breakdown.daniel.{…,total}`, `breakdown.nik.{…}`)."]),
}
for code, (folder, items) in REAL.items():
    nm = [t for c, t in TRUTH_TARGETS if c == code][0]
    f = V + "/" + folder
    job("realism_" + code, f"Fixture realism: {nm}", "1 Truth", "fix", SOL, ["truthfix_" + code],
     goal=f"Make every preview number on the {nm} screen possible in a real Showdown, proven by the shared checker. Claude's second review found impossible inputs the earlier checks missed.",
     read=BASE_READ + [DC, f + "/TRUTH.md", f + "/fixtures.json", V + "/shared/tools/check_fixtures.py (read the shape at the top)"],
     steps=[f"{it} Files: `{f}/fixtures.json` and, where it says so, `{f}/TRUTH.md`." for it in items] + [
       f"Add a top-level `checkSource` block to `{f}/fixtures.json` with the plain season inputs behind every frame (shape at the top of check_fixtures.py), run `{CHK} {f}/fixtures.json`, make every number on the screen match its output, and repeat until it prints `0 errors`. Paste the output into the status notes. Commit and finish."],
     deliverables=[f + "/fixtures.json", f + "/TRUTH.md"], selfcheck=["check_fixtures.py prints 0 errors.", "Every number shown on the screen equals the checker's output."], done="The checker prints 0 errors and the screen numbers match it.")
    b = BYK().get(code + "_build")
    if b: b["deps"].append("realism_" + code)


# 2026-10-02 15:00 UTC: two image chats went off-task (job 19 made a fake "JOB COMPLETED" poster; a failed plate edit came back as a new Home mockup with strangers). Every image job now says what a correct output is.
for j in JOBS:
    if j["type"] == "image":
        j["truth"].insert(0, "CORRECT OUTPUT of this job: exactly the asset files listed under Deliverables (" + j["title"].split(": ", 1)[-1] + "), made with the job's own prompt. The image tool is used ONLY for the requests the steps give, word for word. Never generate a summary, status, report or \"job completed\" picture, a UI or screen mockup, or any person other than Daniel and Nik as they appear in the mockup. If the image tool returns anything that is not the requested asset (a new scene, a screen layout, extra or different people, text), that try FAILED: discard it, do not show it to Nik as a result, and retry in a NEW chat (max 3 tries). Report progress in plain text only, and finish by saving the files as handbook §7 says (a ticket picture goes back the way its ticket says).")


# 2026-10-02 19:05 UTC: unblock project builds while images arrive one at a time (coordinator board check).
# Builds wait only for their own plate and the trophies, not for the whole art review; brush titles arrive in the fix round.
TROPHIES = ["trophy_showdown", "trophy_league", "trophy_cup", "trophy_cont"]
for j in JOBS:
    if j["key"] != "art_review" and "art_review" in j["deps"]:
        j["deps"] = [d for d in j["deps"] if d != "art_review"] + [t for t in TROPHIES if t not in j["deps"]]
WM_FIX = {"league_hands": "league_fix", "club_panels": "club_fix", "tr_polish": "tr_fix", "FW_build": "FW_fix",
          "RB_build": "RB_fix", "ST_build": "ST_fix", "SD_build": "SD_fix"}
for b, f in WM_FIX.items():
    jb, jf = BYK()[b], BYK()[f]
    if "wordmarks" in jb["deps"]:
        jb["deps"] = [d for d in jb["deps"] if d != "wordmarks"]
        jb["truth"].append("Brush title: if the title image (visual-assets/v10_1/shared/wordmarks/TITLE_<KEY>_V1.webp, job {wm}) is not on the branch yet, set the title in the kit's display font, mark the spot with the comment TODO-WORDMARK, and carry on; the fix round swaps it in.".replace("{wm}", "124"))
        if "wordmarks" not in jf["deps"]: jf["deps"] = jf["deps"] + ["wordmarks"]
        jf["truth"].append("Brush title: swap any TODO-WORDMARK title for the job 124 wordmark image (visual-assets/v10_1/shared/wordmarks/), and remove the TODO comment.")


# 2026-10-02 19:10 UTC: phone art whose background already exists becomes a project job (cut-outs, proof, weight).
# Job 111: the Home plate's left side is clean stadium, so Claude cropped ENV_HOME_PHONE_V1 without any image request.
import os as _os
REPO = os.path.join(REPO, "")  # repo root with a trailing slash, from the top of this file
for j in JOBS:
    if j["key"].startswith("phoneart_") and j["type"] == "image":
        bg = [m for st in j["steps"] for m in re.findall(r"visual-assets/[^`\s]*ENV_[A-Z0-9]+_PHONE_V1\.webp", st)]
        if bg and _os.path.exists(REPO + bg[0]):
            j["type"] = "build"; j["worker"] = SOL_SHOTS
            j["truth"].insert(0, f"The phone background `{bg[0]}` (and its .png master) is ALREADY on the branch, made by Claude. Skip steps 2, 3 and 4 (no image request in this job); do steps 1, 5 and 6 and mark 2-4 as 'done by Claude'. Write the polygons and the cutout.py commands into tools/MAKE_ASSETS.md (handbook §7); Claude makes the image files and the proof.")
            code = j["key"].split("_", 1)[1]
            nm, src, out, _d = PHONE_SRC[code]
            screen = out.rsplit("/assets", 1)[0]
            mk = screen + "/tools/MAKE_ASSETS.md"
            j["steps"][0] = S("Cut-out polygons (recipe only)", [V + "/shared/CUTOUT_STANDARD.md", f"{out}/platemap.json (plate sizes and face boxes)", "the matching goal or mockup image from the project Files (same pixels as the plate, to see the figures)"], [f"{out}/phonemap.json", mk],
              f"Draw one polygon around Daniel's whole visible figure (head, hair, shoulders, arms, hands, down to the plate's bottom edge or where his body leaves the frame) and one around Nik, in 1X plate pixels (`plate_1x_size` in platemap.json), 10–40 points each, hair kept soft, no straight cut through a body. Write them into phonemap.json under `cutouts.daniel_phone` and `cutouts.nik_phone`, and these two lines into MAKE_ASSETS.md: `python3 {V}/shared/tools/cutout.py --plate {src} --source-scale 2 --map {out}/phonemap.json --key cutouts.daniel_phone --output assets/OVL_{code}_DANIEL_PHONE_V1 --rim` and the same for `nik_phone` / `OVL_{code}_NIK_PHONE_V1`. The WebP files (about 1000 px tall, quality 85) and PNG masters are made by Claude; do NOT make or upload them.",
              "both polygons are in phonemap.json and both commands are in MAKE_ASSETS.md.")
            j["steps"][4] = S("Phone proof (recipe only)", [f"{out}/phonemap.json"], [f"{out}/phonemap.json", mk],
              f"Write the 393 × 660 composition into phonemap.json under `phone_frame`: background cover, Daniel's and Nik's position and height as % of the frame (heads fully visible in the top 55 %, Daniel left, both slightly overlapping the centre and the area below), and where the dark bottom gradient starts. Add the line `# proof: Claude composites PHONE_PROOF.png (393 × 660 at 3×) from phone_frame` to MAKE_ASSETS.md. Do NOT make PHONE_PROOF.png yourself.",
              "phone_frame holds every position as % and the proof line is in MAKE_ASSETS.md.")
            j["steps"][5] = S("Weight and intake note", [f"{out}/phonemap.json", STATUS + " (Claude's note with the background's size)"], [f"{out}/phone_intake.md"],
              f"The background `ENV_{code}_PHONE_V1.webp` size from the status note (Claude measured it), plus a budget for the two cut-outs so the total stays ≤ 350 KB (DEFAULT: ≤ 60 KB each at quality 85); list the files, the budget and leave the SHA-256 lines for Claude to fill after MAKE_ASSETS.md runs. Commit and finish.",
              "phone_intake.md lists the four files with sizes or budgets; the last commit is `Job {N} done: <job title>`.")


# 2026-10-02 22:00 UTC: plate jobs whose locked plate exists become project jobs for the two text/crop steps left (platemap, title wordmark).
for j in JOBS:
    if j["key"].startswith("plate_") and j["type"] == "image" and j["key"] != "plate_SYS":
        src = [m for st in j["steps"] for m in re.findall(r"visual-assets/[^`\s]*ENV_[A-Z0-9]+_PLATE_V1_SRC\.png", st)]
        if src and _os.path.exists(REPO + src[0]):
            j["type"] = "build"; j["worker"] = SOL_SHOTS
            j["truth"].insert(0, f"Steps 1 to 5 are ALREADY DONE by Claude: the locked plate `{src[0]}`, its 1X/2X exports and intake_report.md are on the branch (image from a Temporary Chat ticket). Do ONLY step 6 (platemap.json, text) and step 7 (title wordmark crop from the ORIGINAL mockup; no image request). Save platemap.json to the branch and write the title crop box (x, y, w, h on the ORIGINAL mockup) into tools/MAKE_ASSETS.md; Claude makes the crop (handbook §7).")

# 2026-10-03 Claude review of job 111 try 1: fix round instructions.
for j in JOBS:
    if j["key"] == "phoneart_HOME":
        j["truth"].insert(0, "FIX ROUND (Claude review of try 1, 2026-10-03): try 1 cut Daniel and Nik out of GOAL_HOME.jpg, where UI panels cover their bodies, so the cut-outs had stair-step edges, Nik lost half his torso and both ended in hard straight lines across the chest. Redo step 1 and step 5 only: (a) cut from `visual-assets/v10_1/home/assets/ENV_HOME_PLATE_V1_2X.png` ONLY (the approved desktop Home plate, Nik wears his watch there); never from GOAL_HOME.jpg or any mockup; (b) the polygon follows the real outline of the jacket, shoulders, arms and hands, with no straight cuts through the body except at the plate's bottom edge; (c) the lower 18 % of each cut-out fades to transparent (linear alpha) so no hard bottom line ever shows; (d) leave out stadium glow and sparkles caught between the hair and the collar; (e) in the proof, the bottom of both figures sits inside the dark bottom gradient. Keep the same file names; write the polygons into tools/MAKE_ASSETS.md; Claude makes the files and PNG masters.")
# Lead decision 2026-10-03 (job 56 question): on Loading, H10 compares only the protected regions.
for j in JOBS:
    if j["key"] in ("ld_review", "ld_fix"):
        j["truth"].insert(0, "H10 ON LOADING (Claude lead decision, 2026-10-03): compare ONLY the protected regions: the Marco Reus photo crop (OWNER-4 asset assets/marco-reus-2015-cc-by.webp) and its OWNER-4 credit line, plus anything this job names as must-keep. The new Showdown UI (lockup, loader, type, layout, colours around it) is meant to differ from production, so it is left out of H10; whole-frame SSIM and colour drift against production do not apply. Do not widen the fix round past the review's (job 55's) fix list to reproduce the production scene.")

# ---------------------------------------------------------------- numbering, waves, writing
idx = {j["key"]: n for n, j in enumerate(JOBS)}
for j in JOBS:
    for d in j["deps"]:
        assert d in idx, (j["key"], d)
wave = {}
byk = {j["key"]: j for j in JOBS}
def wv(k):
    if k not in wave:
        wave[k] = 1 + max([wv(d) for d in byk[k]["deps"]] or [0])
    return wave[k]
for j in JOBS: wv(j["key"])

def num(k): return idx[k]

def lane(j):
    w = j["worker"]
    if j["type"] == "tracking": return "team-g"
    if w.startswith("Codex"): return "codex"
    if "Work mode (needs" in w: return "work"
    if j["type"] == "image": return "fresh chat (image)"
    return "project (type number)"

def sub(n, text):
    text = text.replace("{navbar}", str(num("navbar"))).replace("{n}", f"{n:03d}").replace("{N}", str(n))
    return re.sub(r"\{job:(\w+)\}", lambda m: f"{num(m.group(1)):03d}", text)

def render(n, j):
    j = dict(j, truth=[sub(n, t) for t in j["truth"]], steps=[sub(n, s) for s in j["steps"]], read=[sub(n, r) for r in j["read"]], goal=sub(n, j["goal"]))
    deps = ", ".join(f"{num(d)} ({JOBS[num(d)]['title']})" for d in j["deps"]) or "nothing"
    L = [f"# JOB-{n:03d} · {j['title']}", "",
         "| Phase | Type | Lane | Worker | Wave | Steps | Claude look |", "| --- | --- | --- | --- | --- | --- | --- |",
         f"| {j['phase']} | {j['type']} | {lane(j)} | {j['worker']} | {wave[j['key']]} | {len(j['steps'])} | {'yes, at the end' if j['look'] else 'no'} |", "",
         f"**Depends on:** {deps}.", "",
         "**Pace (handbook Pace rules):** at most two steps per turn, each saved with the status file; then stop with `Step k of n done and saved. Type continue for step k+1.` Steps sized to Sol capacity (split big steps into saved parts). Text files only: never make or upload images, zips or screenshots; write recipes in tools/MAKE_ASSETS.md and Claude makes the files and checks the screen. Never wait on GitHub Actions. Pick a noted DEFAULT instead of stopping unless it is product truth.", ""]
    if j["type"] == "image":
        L += [f"**FRESH-CHAT IMAGE JOB (Nik, 2026-10-02): this job is NOT typed into the Showdown visual project.** Images come out better in a ChatGPT Temporary Chat outside any project (no memory, no chat history). Nik runs the job's image ticket(s) in `project-documents/factory/tickets/` (`TICKET-{n:03d}_*.md`, one image per ticket) and drops each image into Claude's factory thread; Claude checks it, commits it and does the remaining steps below. If this job has no ticket yet, Claude first makes the attachment it needs (for phone art: the cut-outs and the portrait guide from the finished plate) and then writes the ticket.",
              f"If you are a chat in the Showdown visual project and were given {n}, do nothing else and reply only: \"Job {n} is an image job. Run its ticket in a new chat outside this project (see project-documents/factory/tickets/README.md).\"", ""]
    if j["waits"]:
        L += [f"**WAITING ON NIK:** {j['waits']}", ""]
    if j["team_g"] and j["type"] == "tracking":
        L += [f"**TEAM G TRACKING ONLY:** {j['team_g']} Team V workers never start this job.", ""]
    elif j["team_g"]:
        L += [f"**WAITS ON TEAM G:** {j['team_g']} Until the flag is cleared in the status file, do not start this job.", ""]
    if j["note"]:
        L += [f"**Note:** {j['note']}", ""]
    L += ["## Goal", "", j["goal"], ""]
    L += ["## Read first", ""] + [f"- {r}" for r in j["read"]] + [""]
    if j["mockup"]:
        L += ["## The mockup and what to take from it", ""] + [f"- {m}" for m in j["mockup"]] + [""]
    if j["truth"]:
        L += ["## Product truth that overrides the mockup", ""] + [f"- {t}" for t in j["truth"]] + [""]
    L += ["## Steps", "", f"Do them in order. After each step update `project-documents/factory/status/JOB-{n:03d}.md` and push with the message `Job {n} step k/{len(j['steps'])}: <step name>`.", ""]
    for i, s in enumerate(j["steps"], 1):
        L += [f"{i}. {s}", ""]
    L += ["## Deliverables", ""] + [f"- `{d}`" if not d.startswith("updated") and not d.startswith("fixed") and " " not in d.split("/")[0] else f"- {d}" for d in j["deliverables"]] + [""]
    L += ["## Self-check before \"done\"", "", "Write each line with PASS or FAIL and one line of evidence into the status file.", ""]
    L += [f"- [ ] {c}" for c in j["selfcheck"]]
    L += ["- [ ] Only the files this job names were changed.", "- [ ] Daniel left, Nik right; no real logos, trophies or players; no data baked into images (where this job touches visuals).", ""]
    L += ["## Done when", "", j["done"], "", f"Finish with the commit message `Job {n} done: {j['title']}` and one line to Nik."]
    return "\n".join(L) + "\n"

def status(n, j):
    st = "WAITING ON NIK" if j["waits"] else ("WAITING ON TEAM G" if j["team_g"] else "NOT STARTED")
    return "\n".join([f"# Status · JOB-{n:03d} · {j['title']}", "", f"State: {st}", f"Step: 0 of {len(j['steps'])}", "Updated: -", "Chat: -", "",
                      "## Notes", "", "## Self-check", "", "## Blocked question", ""]) + "\n"

os.makedirs(F + "/jobs", exist_ok=True); os.makedirs(F + "/status", exist_ok=True)
board = []
for n, j in enumerate(JOBS):
    open(f"{F}/jobs/JOB-{n:03d}.md", "w").write(render(n, j))
    sp = f"{F}/status/JOB-{n:03d}.md"
    if not os.path.exists(sp):
        open(sp, "w").write(status(n, j))
    else:  # keep worker progress, but sync the title and the step total with the job file
        import re
        t = open(sp).read()
        t2 = re.sub(r"^# Status · .*$", f"# Status · JOB-{n:03d} · {j['title']}", t, count=1, flags=re.M)
        t2 = re.sub(r"^(Step:\s*\d+\s*of\s*)\d+", lambda m: m.group(1) + str(len(j["steps"])), t2, count=1, flags=re.M)
        if t2 != t: open(sp, "w").write(t2)
    board.append(dict(number=n, key=j["key"], title=j["title"], phase=j["phase"], wave=wave[j["key"]], depends_on=[num(d) for d in j["deps"]],
                      type=j["type"], worker=j["worker"], lane=lane(j), steps=len(j["steps"]), waits_on_nik=j["waits"], waits_on_team_g=j["team_g"], needs_claude_look=j["look"]))
json.dump(dict(branch=BR, generated="2026-10-02", jobs=board), open(F + "/BOARD.json", "w"), indent=1)
print(len(JOBS), "jobs; waves:", max(wave.values()))

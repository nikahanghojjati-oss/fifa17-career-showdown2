Recipient: Claude Code Cloud session (implementation worker)
Surface: claude.ai/code, repository `nikahanghojjati-oss/fifa17-career-showdown2`
Model: **Opus 5.5** · Effort: **High**. If Opus 5.5 is not offered, STOP and tell Nik. No automatic fallback.
Branch: `claude-cloud/home-v1` (cut by the HLC intake session from `claude-cloud/transfer-tr2-plate-g@8fbda03` or the base it records). Start with `git fetch origin claude-cloud/home-v1 && git checkout claude-cloud/home-v1`. If the branch or `visual-assets/v10_1/home/assets/ENV_HOME_PLATE_V1_1X.webp` is missing, STOP and reply "Home plate not committed yet".
Role: build and produce evidence. No taste authority. No self-approval.
Return to: GPT-5.6 Sol (via Nik), and Claude in the project chat.

```
TASK_ID: CLOUD-HOME-V1
STOP_BUDGET: 45 min wall-clock / $10 credit (routing V3 §3, static checkpoint build)
PRIORITY_ORDER: H0 source check > H1 desktop stage + lockup > H2 four action tiles > H3 Audius soundtrack card > checkpoint commit+push > H4 phone > G gates > deliverables (C9)
SCOPE: visual-assets/v10_1/home/ only (plus read-only reuse in C3)
```

# CLOUD BUILD BRIEF · HOME V1 R2 · Rivalry Headquarters on the Home plate

Author: Claude Opus 5.5, Lead Visual Producer · 2026-09-30
Revision: R2 (2026-10-01), applies GPT-5.6 Sol verdict SOL_HLC_BRIEFS_PRODUCT_TRUTH_VERDICT_2026-09-30.
Product-truth sign-off: `PENDING · GPT-5.6 Sol R2 consistency check` (run only after Sol OKs R2 and the intake has committed the Home plate)

## 0. Intent
Nik's Home goal: a night stadium, Daniel (left, pointing at the viewer) and Nik (right, hand on chin) behind a gold brush wordmark, a row of dark-glass action tiles along the bottom with the first one solid gold, and a soundtrack card on the right. The plate already carries the stadium, both managers, the banners and the handwritten notes. You place the product's live Home UI on it, in that look. Main today is a light-blue grid with a real player photo; none of that look survives.

## 1. Assets (committed by the HLC intake session; read `assets/intake_report.md`)
- `assets/ENV_HOME_PLATE_V1_1X.{webp,png}` (1672×941) and `_2X` (3344×1882). Use `image-set()` with 1X/2X.
- `assets/platemap.json`: protected boxes (both faces, Daniel's pointing hand, Nik's hand on chin) and the goal's UI rects, in 1X plate px.
- `assets/REF_GOAL_HOME.jpg`: Nik's goal image, for composition only. Never ship it or copy text from it.
- `assets/LOGO_CM17_WORDMARK_V1.png` (transparent). **May be absent.** If absent, build the wordmark as `aria-hidden` DOM text (`CAREER MODE` / `SHOWDOWN 17`, Barlow Condensed 700 italic, C6 title treatment) and note it.

## S. Product truth for Home (from `origin/main`)
Read: `index.html` `#mainMenu` and `#topHeader`; `js/menuExperience.js` (`getSavedShowdownMenuMeta`, the media list, how the media choice buttons and the status line are built, but the media content follows the Audius direction below, not main's YouTube list, the Continue tile's enabled/disabled logic); `js/onlinePlayerIdentity.js` (`configureOnlineProductSurface`: the tile text for Nik; `ensureOnlineIdentityBadge`: badge labels). Reproduce the resulting DOM for each frame: same ids, classes that JS reads, roles, aria, order.
- Heading: `.fifaMenuEyebrow` `CAREER MODE // SHOWDOWN 17`, `<h2>HOME</h2>`, `.fifaMenuHeadingMeta` = `RIVALRY HEADQUARTERS` + `Build the rivalry, play every season, and carry each trophy into your Legacy.`
- Six tile buttons exist in the DOM, in this order: `#continueCareer`, `#newShowdown`, `#legacyButton`, `#careerStatisticsButton`, `#ruleBookButton`, `#settingsButton`. **Visible product surface = four (SOL-HLC-1):** the online runtime (`js/onlinePlayerIdentity.js`, its injected style) hides `#legacyButton` and `#careerStatisticsButton`. Keep both in the DOM exactly once, hidden the same way; lay out only Continue, New/Join, Rule Book and Settings, with no empty holes.
- Soundtrack (SOL-HLC-2, **Audius only**): one card, with the existing `#menuMusicPlayer`, `#menuMusicStatus` (role=status, live region), `#menuMusicToggle` `PLAY TRACK`, `#menuMusicMute` `MUTE` (disabled while nothing plays). Source label `AUDIUS`. Four choices, in this order: `WHAT YOU GOT` / `Valentino Khan & NITTI`; `SNOW GLOBE` / `Hadji Gaviota`; `NASTY` / `grouptherapy.`; `I'M ALWAYS RIGHT` / `The Holdup`. No YouTube, no gameplay trailer, no iframe or player artwork, no autoplay, no "playing" state in any frame. The open Audius work is a direction reference only; never merge its branch.
- `.menuBottomStrip`: `01 TWO MANAGER CAREER COMPETITION`, `02 FIFA 17 ERA RULESET`, `READY`.
- Primary control for G4: HM1 (no save): `#continueCareer` is disabled, so `#newShowdown` is the primary. HM2/HM3: `#continueCareer`.
- Allowed decorative text (aria-hidden, G1): `THE RIVALRY STARTS HERE`, `TWO MANAGERS · ONE LEGACY` (both are the product's own startup lockup lines), the wordmark, `CM 17`, `More Than A Game`, `FOOTBALL BRINGS US TOGETHER`, and the text painted in the plate.

**Frames (fixtures from main's own strings):**
| Frame | State | Header | Tile text that differs |
| --- | --- | --- | --- |
| HM1 (Tier S) | signed out, no save | badge `SIGN IN`, indicator `No Active Showdown` | Continue disabled, meta `No active showdown saved`; `NEW` / `START A SHOWDOWN` / `Choose seasons and create the code` |
| HM2 | Nik signed in, active save | badge `NIK`, indicator = main's active-save indicator text | Continue meta `Daniel vs Nik · Season 2 of 3`; `JOIN` / `JOIN DANIEL'S SHOWDOWN` / `Paste Daniel's code` (longest strings: fit gate) |
| HM3 | Daniel signed in, completed | badge `DANIEL`, indicator per main | `VIEW COMPLETED SHOWDOWN`, `Daniel vs Nik · Showdown complete` |

## H. Build items
**H0 · Source check** (C2). Build `fixtures.json` from main's strings. G1's expected visible strings exclude the two product-hidden tiles.

**H1 · Desktop stage and lockup.** Header and footer per C6. Left column (goal: x 2.4–36 % of the plate, y 12–42 %): kicker `THE RIVALRY STARTS HERE` (15 px, letter-spacing .5em, `#E9DFC8`), the wordmark (width ≈ 32 % of the viewport at 1366, never overlapping Daniel's protected boxes), `TWO MANAGERS · ONE LEGACY` under it. Then the heading block (goal: y 57–71 %): `<h2>HOME</h2>` styled as the small gold label (Barlow Condensed 700 18 px, letter-spacing .12em, `#F2C45B`, 28 px gold underline), `RIVALRY HEADQUARTERS` as the big line (Barlow Condensed 700 44 px, `#FFFFFF`), the sentence under it (Barlow 16 px, `#E9DFC8`). `.fifaMenuEyebrow` is visually hidden (it repeats the wordmark; stays in the DOM). Put a soft left-side scrim behind this column (`linear-gradient(90deg, rgba(6,7,9,.78) 0, rgba(6,7,9,.35) 38 %, transparent 52 %)`) until G7 passes. Do not include the goal's loading bar or its "Local save system · your career remains on this device" line (they belong to the startup screen, and the claim is no longer true with connected accounts).

**H2 · Four action tiles.** One row of four equal tiles across the bottom (goal's action dock: x 2.4–97.6 %, y 73–91 %), 10 px gaps, anchored to the viewport bottom above the footer so they stay whole at 1366×640. Order: `#continueCareer`, `#newShowdown`, `#ruleBookButton`, `#settingsButton`. Each tile: dark glass `rgba(10,12,15,.78)` + `backdrop-filter: blur(10px)`, 1 px `rgba(201,155,69,.45)` border, a 2 px gold top seam, a `›` chevron bottom-right. Text stack: code (Barlow Condensed 600 12 px, letter-spacing .2em, `#C99B45`), label (Barlow Condensed 700 26 px, uppercase, white, max 2 lines), meta (Barlow 14 px, `#CFC6B4`, max 2 lines). A gold line icon on the right, inline SVG, `aria-hidden`, about 72 px: tactics board for `#newShowdown`, closed rule book for `#ruleBookButton`, gear for `#settingsButton`. `#continueCareer` is the gold tile: `linear-gradient(135deg,#F7D46A,#E0AE3A)`, ink text, and instead of the goal's footballer a code-drawn `aria-hidden` mark: a large outlined `17` numeral with a small crown, in ink at 25 % opacity. **No person, no shirt, no silhouette.** Disabled Continue (HM1): keep the gold identity at 45 % opacity, no hover lift, and make `#newShowdown` read as the active primary (gold top seam doubled, `#F2C45B` border). Hover/focus on enabled tiles: border `#F2C45B`, 1 px lift.

**H3 · Audius soundtrack card.** Goal position: right side, x 64–97.6 %, y 52.5–70 %, clear of Nik's hand box by ≥ 8 px and of the tile row by ≥ 12 px. Dark glass panel as the tiles. Left: a code-drawn vinyl disc (concentric CSS circles, gold label), static, plus five static gold equalizer bars; no photo, no cover art. Right: a 12 px eyebrow per main/Audius direction, the selected track title (Barlow Condensed 700 26 px, white), artist (14 px), source `AUDIUS` (12 px, right). The four choices as compact chips in one row or a 2 × 2 grid (min 32 px tall desktop; selected chip gold). `PLAY TRACK` compact gold, `MUTE` secondary (disabled), both 40 px. `#menuMusicStatus` as one 12 px line. If it does not fit at 1366×768, shrink the vinyl first. Report what you did.

**H4 · Phone (C7).** Top: header (48). Then a plate band showing both managers' heads (faces whole, never cut through a face), with the wordmark over the band's lower-left only if it clears both protected face boxes; otherwise omit the wordmark and kicker on phone and say so. Then `HOME` label + `RIVALRY HEADQUARTERS` (28 px) + the sentence (14 px, max 2 lines). The four visible tiles in a 2 × 2 grid (Continue first), each ≥ 72 px tall: code + label visible; meta visible on `#continueCareer` (and on `#newShowdown` in HM1), visually hidden (still in DOM) on the others. Soundtrack: one compact strip (title + artist on one line, `PLAY TRACK` and `MUTE` at 44 px, the four chips as a 44 px row); `#menuMusicStatus` may be visually hidden on the tightest layout but stays a live region. `.menuBottomStrip` visually hidden on phone, visible on desktop. Every "visually hidden on phone" choice goes into the handoff as a numbered item for Sol.
## C. Common rules (identical in all three briefs: Home, League, Club)

**C1 · Read first, in this order.** This brief. `visual-assets/v10_1/tr2/slice-02-plate/BUILD_RESULT.md` (the proven method: "paint the stage, place the live text"). Your folder's `assets/intake_report.md` and `assets/platemap.json`. The goal images and main screenshots are also in `visual-assets/goals/` on `claude-cloud/hlc-goals`. Product truth only from `origin/main` (read with `git show origin/main:<path>`): `index.html`, `css/app.css`, and the JS files named in section S. Nothing else is required reading.

**C1b · Plate G base.** Screen branches are cut by the intake session from `claude-cloud/transfer-tr2-plate-g@8fbda036c1d1f7910631964e982705d0f25290c0` (or the head it records in `assets/intake_report.md`). Record the base SHA in BUILD_RESULT.md.

**C2 · Source check.** `git fetch origin main`. Production anchor is `main@2de2373`. If `origin/main` moved, write `SOURCE_DRIFT: <new sha>` at the top of BUILD_RESULT.md, diff the files listed in section S, and use the new strings. Do not stop for drift.

**C3 · Scope.** Write only inside your own folder `visual-assets/v10_1/<screen>/`. Read-only reuse is fine: fonts from `../tr2/slice-02-plate/assets/fonts/`, `../../../js/visualIdentity.js`, and `../tr2/slice-02-plate/tools/render-qa.cjs` (copy it into your own `tools/` and adapt). Never touch `main`, production files, `visual-assets/v10/V10_STATE.md`, `visual-assets/v10_1/tr2/**`, other screens' folders, PRs, or any merge into main (the only merge allowed is the pinned crest SHA in League and Club). Two other build sessions may run at the same time on sibling branches; this scope keeps you from colliding.

**C4 · Build shape.** Static prototype, same pattern as slice-02-plate: `index.html` + `<screen>.css` + `<screen>.js` + `fixtures.json` + `tools/render-qa.cjs`, served with `python3 -m http.server 8765` **from the repo root** (so the `../` reuse paths in C3 resolve), opened at `/visual-assets/v10_1/<screen>/index.html`. Frames switch with `?frame=<ID>`; `&grid=1` overlays platemap boxes. Nothing animates (static checkpoint; motion comes later).

**C4b · One plate-mapping helper (SOL-HLC-4).** The plate is a `cover`-fit background. Write one function, `plateToScreen(x, y)`, and use it for every plate-registered thing: overlays, the `&grid=1` evidence, wheel and pack positions, and the G8 protected-box checks. With stage size `W×H` and plate 1X size `PW×PH`:
`k = max(W/PW, H/PH)`; `offsetX = (W − PW·k)/2`; `offsetY = (H − PH·k)/2`; `screenX = offsetX + x·k`; `screenY = offsetY + y·k`.
If you change `background-position`, the offsets must follow that exact position (e.g. a vertical bias). Any plate cut-out (the League fingertip) uses the same transform. The phone band may use its own transform, but write it explicitly in the code and in BUILD_RESULT.md, and measure against it.

**C5 · Fixed product and identity rules.**
1. Every string, id, role and aria attribute in section S comes from production main, spelled and cased as the product renders it. Where the goal image disagrees with the product, the product wins; record each case in the handoff (section D).
2. All UI text is flat, screen-aligned, semantic DOM. No text is baked into any image you make. Perspective only on `aria-hidden` objects that carry no live text.
3. Daniel = Manager 1 = player one, always left. Nik = Manager 2 = player two, always right. Never mirror the plate or any cut from it.
4. No player photos, no people other than the two managers already in the plate, no real league logos or club crests, no EA/FIFA art. Club crests and league marks only from `js/visualIdentity.js` as merged from the pinned `ACCEPTED_CREST_SHA` (League, Club) (original, hand-authored); a screen never draws its own. No `assets/marco-reus*` reference anywhere.
5. No live or private data in any raster. No new raster generation. The only new rasters allowed are crops/overlays cut from your own plate (e.g. a fingertip overlay), made with a script committed in `tools/`.
6. Every phone screen fits the visible area with no page scroll at 360×640, and the primary action is fully visible and tappable at 375×553. Touch targets ≥ 44 px on phone (48 preferred). Text ≥ 12 px everywhere, footer and all helper/source labels included (SOL-HLC-7); body copy ≥ 14 px on phone.
7. Faces, hands and the protected boxes in `platemap.json` are never covered by UI (≥ 8 px clear), unless a gate below says otherwise.

**C6 · Shared chrome (must look identical on all three screens).**
- Header (`<header id="topHeader">`), 56 px desktop / 48 px phone, background `linear-gradient(to bottom, rgba(6,7,9,.92), rgba(6,7,9,.70))`, 1 px bottom hairline `rgba(201,155,69,.45)`.
  - Left: an `aria-hidden` slanted gold badge reading `CM 17` (Barlow Condensed 700 italic 24 px, `#F2C45B`, dark plate with a 2 px gold right edge skewed −14°; the text itself is not skewed), then the product brand `<div class="brand"><h1>CAREER MODE</h1><p>SHOWDOWN // 17</p></div>` as small caps (13 px, letter-spacing .18em, `#E9DFC8`). On phone the brand text is visually hidden (still in the DOM); only the badge shows. (Open item for Sol, see D.)
  - Right: the product's `#onlinePlayerIdentityBadge` button (fixture `SIGN IN`) and `#seasonIndicator` (fixture per frame). Dark glass `rgba(10,12,15,.72)`, 1 px `rgba(201,155,69,.55)` border, Barlow Condensed 600 14 px, letter-spacing .12em, min height 40 desktop / 44 phone.
  - Desktop only, `aria-hidden`: the script line `More Than A Game` (Kaushan Script 18 px, `#F2C45B`, rotate −8°) at the far right. Hide below 900 px width.
  - No navigation tabs (HOME / CAREER / STANDINGS / STATS / RULES / ABOUT) and no search, settings or profile icons. They are in the goal images but not in the product.
- Footer: the product `<footer>` text `Career Mode Showdown` + `v1.9.1` at the left (12 px, `#9A8F7A`), and `aria-hidden` decorative `FOOTBALL BRINGS US TOGETHER` + a small gold crown glyph at the right (desktop only). 28 px desktop; on phone the footer may be omitted from the fold if space is needed, never covering controls.
- Grade: gold-dominant. Gold `#F2C45B` / deep gold `#C99B45` / ink `#0B0D10`. Primary button: solid gold gradient `linear-gradient(180deg,#F7D46A,#E0AE3A)` with ink text, Barlow Condensed 700 20 px, letter-spacing .06em, height 56 desktop / 52 phone. Secondary button (BACK): transparent dark glass, 1 px `rgba(233,223,200,.55)` border, light text, same height.
- Screen titles (`<h2>`): DOM text in Barlow Condensed 700 italic, uppercase, gold gradient fill (`#FFF1B8 → #F2C45B → #B98A2F`, top to bottom) with a warm glow (`drop-shadow(0 0 18px rgba(242,196,91,.35))`) and a subtle brush-edge SVG `feTurbulence`+`feDisplacementMap` filter (scale ≤ 3). Kicker above (`CAREER MODE SHOWDOWN 17`, 13 px, letter-spacing .5em) is decorative, `aria-hidden`.
- Focus ring on every control: 2 px `#FFF1B8` outline, 3 px offset.

**C7 · Phone layout.** Any portrait viewport up to 760 px wide uses the phone layout: the plate is cropped to a band showing both managers' heads (read `platemap.json` protected boxes), and the UI stacks below or over the band's lower edge, like slice-02-plate's phone recomposition. You solve the composition; the gates in section G decide.

**C8 · Cost and stop rules.** Run `date` at start and record it. Commit and push at the checkpoint named in PRIORITY_ORDER and at the end. At 80 % of STOP_BUDGET stop adding scope: finish the current item, capture evidence for what is done, mark the rest `NOT DONE`, commit, push. At 100 % stop. Installs: `npm ci` in your tools folder only if you need Playwright; otherwise use `NODE_PATH=$(npm root -g)` like slice-02-plate. An item that fails its gate twice is `BLOCKED` with measured values; no third attempt.

**C9 · Deliverables committed in your folder (all required).**
1. `BUILD_RESULT.md`: model, effort, start/end time, head SHA, SOURCE_DRIFT line, how to run, frame list, item status (DONE / NOT DONE / BLOCKED) in PRIORITY_ORDER, known limits.
2. `evidence/qa_report.json` + every screenshot named `<FRAME>_<W>x<H>.jpg` (phone at DPR 2, desktop at DPR 1, plus one desktop at DPR 2).
3. `tools/build_preview.py` output `preview.html`: a single-file preview (inline CSS/JS/JSON, plate as a data URI at 1X) so the review page renders in claude.ai.
4. `CLAUDE_<SCREEN>-BUILD_HANDOFF_TO_SOL_<yyyy-mm-dd>.md`, addressed to GPT-5.6 Sol: what was built, gate results table, every place the goal image and the product disagreed and what you did (numbered items), open questions, and what Nik should look at.
Commit messages start with `visual: <SCREEN>-V1`. Push with `git push -u origin <branch>`. Reply at the end with the head SHA and the four file paths.
## G. Render-QA gates (measured by assertions in `tools/render-qa.cjs`; results in `evidence/qa_report.json`)

Viewports: desktop 1366×768 (Tier S), 1440×900, 1920×1080, 1366×640, plus 1366×768 at DPR 2; phone 360×640, 375×553, 390×844, 430×932 at DPR 2. Every frame at every viewport unless a gate says otherwise.

| Gate | Assertion (hard fail unless stated) |
| --- | --- |
| G1 Strings | Visible text nodes of each frame = that frame's expected list in `fixtures.json` (built from main, section S) + the allowed decorative list in section S. Report any missing or extra string. 0 extra, 0 missing. |
| G2 IDs | Every product id in section S exists exactly once; roles and aria attributes match main. |
| G3 No scroll | `scrollHeight ≤ innerHeight + 1` and `scrollWidth ≤ innerWidth + 1` on `html` and `body`. |
| G4 Primary action | The frame's primary control (section S) is fully inside the viewport, and `elementFromPoint` at its centre returns it. Must hold at 375×553 and 1366×640. |
| G5 No clipping | Every text element: `scrollWidth ≤ clientWidth + 1`, `scrollHeight ≤ clientHeight + 1`; no `text-overflow: ellipsis`. Includes the longest fixture strings. |
| G6 Sizes | Phone: every control ≥ 44 px tall and ≥ 44 px wide; no text under 12 px; body copy ≥ 14 px. Desktop: controls ≥ 40 px. |
| G7 Contrast | Brightest-background-pixel method (same as slice-02-plate): normal text ≥ 4.5:1, large text (≥ 24 px, or ≥ 18.66 px bold) ≥ 3:1, control borders ≥ 3:1. Fix a failure with a local scrim first. |
| G8 Faces and hands | Using `plateToScreen` (C4b): no UI box (text, control, panel) intersects any `protected_boxes` rect grown by 8 px, except where section S allows it. Report the smallest clearance per frame. |
| G9 Imagery | List every loaded image and CSS background URL. Allowed: your plate files, overlays cut from your plate, `LOGO_CM17_WORDMARK_V1` (Home only), fonts, inline/data SVG. `grep -ri reus` in your folder = 0 hits. |
| G10 Sides | Every player-one element's centre x < the matching player-two element's centre x. The plate's SHA-256 at load equals `intake_report.md`. |
| G11 Tab order | Tab order = visual reading order (top to bottom, then left to right). Disabled and hidden controls are skipped. |
| G12 Clean run | 0 console errors, 0 failed requests, 0 uncaught exceptions. |
| G13 Chrome snapshot | Write the header's and footer's computed box and key styles to the report (height, fonts, colours, badge box, right-control boxes) so the three screens can be compared later. Report only. |

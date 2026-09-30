Recipient: Claude Code Cloud session (implementation worker)
Surface: claude.ai/code, repository `nikahanghojjati-oss/fifa17-career-showdown2`
Model: **Opus 5.5** · Effort: **High**. If Opus 5.5 is not offered, STOP and tell Nik. No automatic fallback.
Branch: `claude-cloud/home-v1` (cut from `claude-cloud/transfer-tr2-plate-g`; the HLC intake session creates it). Start with `git fetch origin claude-cloud/home-v1 && git checkout claude-cloud/home-v1`. If the branch or `visual-assets/v10_1/home/assets/ENV_HOME_PLATE_V1_1X.webp` is missing, STOP and reply "Home plate not committed yet".
Role: build and produce evidence. No taste authority. No self-approval.
Return to: GPT-5.6 Sol (via Nik), and Claude in the project chat.

```
TASK_ID: CLOUD-HOME-V1
STOP_BUDGET: 45 min wall-clock / $10 credit (routing V3 §3, static checkpoint build)
PRIORITY_ORDER: H0 source check > H1 desktop stage + lockup > H2 tiles > H3 soundtrack card > checkpoint commit+push > H4 phone > G gates > deliverables (C9)
SCOPE: visual-assets/v10_1/home/ only (plus read-only reuse in C3)
```

# CLOUD BUILD BRIEF · HOME V1 · Rivalry Headquarters on the Home plate

Author: Claude Opus 5.5, Lead Visual Producer · 2026-09-30
Product-truth sign-off: `PENDING · GPT-5.6 Sol` (Nik runs this only after Sol's check)

## 0. Intent
Nik's Home goal: a night stadium, Daniel (left, pointing at the viewer) and Nik (right, hand on chin) behind a gold brush wordmark, a row of six dark-glass tiles along the bottom with the first one solid gold, and a soundtrack card on the right. The plate already carries the stadium, both managers, the banners and the handwritten notes. You place the product's live Home UI on it, in that look. Main today is a light-blue grid with a real player photo; none of that look survives.

## 1. Assets (committed by the HLC intake session; read `assets/intake_report.md`)
- `assets/ENV_HOME_PLATE_V1_1X.{webp,png}` (1672×941) and `_2X` (3344×1882). Use `image-set()` with 1X/2X.
- `assets/platemap.json`: protected boxes (both faces, Daniel's pointing hand, Nik's hand on chin) and the goal's UI rects, in 1X plate px.
- `assets/REF_GOAL_HOME.jpg`: Nik's goal image, for composition only. Never ship it or copy text from it.
- `assets/LOGO_CM17_WORDMARK_V1.png` (transparent). **May be absent.** If absent, build the wordmark as `aria-hidden` DOM text (`CAREER MODE` / `SHOWDOWN 17`, Barlow Condensed 700 italic, C6 title treatment) and note it.

## S. Product truth for Home (from `origin/main`)
Read: `index.html` `#mainMenu` and `#topHeader`; `js/menuExperience.js` (`getSavedShowdownMenuMeta`, the media list, how `.menuMediaChoice` buttons, the player placeholder and the status line are built, the Continue tile's enabled/disabled logic); `js/onlinePlayerIdentity.js` (`configureOnlineProductSurface`: the tile text for Nik; `ensureOnlineIdentityBadge`: badge labels). Reproduce the resulting DOM for each frame: same ids, classes that JS reads, roles, aria, order.
- Heading: `.fifaMenuEyebrow` `CAREER MODE // SHOWDOWN 17`, `<h2>HOME</h2>`, `.fifaMenuHeadingMeta` = `RIVALRY HEADQUARTERS` + `Build the rivalry, play every season, and carry each trophy into your Legacy.`
- Six tile buttons with code / label / meta, in this DOM order: `#continueCareer`, `#newShowdown`, `#legacyButton`, `#careerStatisticsButton`, `#ruleBookButton`, `#settingsButton`.
- `.menuMusicTile` (`aria-label="Menu media"`): header (`FIFA 17 SOUNDTRACK`, title, artist, `YOUTUBE`), 7 media choices, `#menuMusicPlayer` placeholder, `#menuMusicStatus` (role=status), `#menuMusicToggle` `PLAY TRACK`, `#menuMusicMute` `MUTE` (disabled).
- `.menuBottomStrip`: `01 TWO MANAGER CAREER COMPETITION`, `02 FIFA 17 ERA RULESET`, `READY`.
- Primary control for G4: `#continueCareer` in HM2/HM3; in HM1 (no save) whatever main does with it (if it stays enabled, it is the primary; if disabled, `#newShowdown` is the primary).
- Allowed decorative text (aria-hidden, G1): `THE RIVALRY STARTS HERE`, `TWO MANAGERS · ONE LEGACY` (both are the product's own startup lockup lines), the wordmark, `CM 17`, `More Than A Game`, `FOOTBALL BRINGS US TOGETHER`, and the text painted in the plate.

**Frames (fixtures from main's own strings):**
| Frame | State | Header | Tile text that differs |
| --- | --- | --- | --- |
| HM1 (Tier S) | signed out, no save | badge `SIGN IN`, indicator `No Active Showdown` | Continue meta `No active showdown saved`; `NEW` / `START A SHOWDOWN` / `Choose seasons and create the code` |
| HM2 | Nik signed in, active save | badge `NIK`, indicator = main's active-save indicator text | Continue meta `Daniel vs Nik · Season 2 of 3`; `JOIN` / `JOIN DANIEL'S SHOWDOWN` / `Paste Daniel's code` (longest strings: fit gate) |
| HM3 | Daniel signed in, completed | badge `DANIEL`, indicator per main | `VIEW COMPLETED SHOWDOWN`, `Daniel vs Nik · Showdown complete` |

## H. Build items
**H0 · Source check** (C2). Build `fixtures.json` from main's strings.

**H1 · Desktop stage and lockup.** Header and footer per C6. Left column (goal: x 2.4–36 % of the plate, y 12–42 %): kicker `THE RIVALRY STARTS HERE` (15 px, letter-spacing .5em, `#E9DFC8`), the wordmark (width ≈ 32 % of the viewport at 1366, never overlapping Daniel's protected boxes), `TWO MANAGERS · ONE LEGACY` under it. Then the heading block (goal: y 57–71 %): `<h2>HOME</h2>` styled as the small gold label (Barlow Condensed 700 18 px, letter-spacing .12em, `#F2C45B`, 28 px gold underline), `RIVALRY HEADQUARTERS` as the big line (Barlow Condensed 700 44 px, `#FFFFFF`), the sentence under it (Barlow 16 px, `#E9DFC8`). `.fifaMenuEyebrow` is visually hidden (it repeats the wordmark; stays in the DOM). Put a soft left-side scrim behind this column (`linear-gradient(90deg, rgba(6,7,9,.78) 0, rgba(6,7,9,.35) 38 %, transparent 52 %)`) until G7 passes. Do not include the goal's loading bar or its "Local save system · your career remains on this device" line (they belong to the startup screen, and the claim is no longer true with connected accounts).

**H2 · Tiles.** One row of six equal tiles across the bottom (goal: x 2.4–97.6 %, y 73–91 %), 8 px gaps, anchored to the viewport bottom above the footer so they stay whole at 1366×640. Each tile: dark glass `rgba(10,12,15,.78)` + `backdrop-filter: blur(10px)`, 1 px `rgba(201,155,69,.45)` border, a 2 px gold top seam, a `›` chevron bottom-right. Text stack: code (Barlow Condensed 600 12 px, letter-spacing .2em, `#C99B45`), label (Barlow Condensed 700 24 px, uppercase, white, max 2 lines), meta (Barlow 13 px, `#CFC6B4`, max 2 lines). A gold line icon on the right half, inline SVG, `aria-hidden`, about 64 px: tactics board for `#newShowdown`, trophy for `#legacyButton`, rising bars for `#careerStatisticsButton`, closed rule book for `#ruleBookButton`, gear for `#settingsButton`. `#continueCareer` is the gold tile: `linear-gradient(135deg,#F7D46A,#E0AE3A)`, ink text, and instead of the goal's footballer a code-drawn `aria-hidden` mark: a large outlined `17` numeral with a small crown, in ink at 25 % opacity. **No person, no shirt, no silhouette.** Hover/focus: border to `#F2C45B`, 1 px lift. Disabled tiles (if main disables one): 45 % opacity, no lift.

**H3 · Soundtrack card.** Goal position: right side, x 64–97.6 %, y 52.5–70 %, clear of Nik's hand box by ≥ 8 px and of the tile row by ≥ 12 px. Dark glass panel as the tiles. Left: a code-drawn vinyl disc (concentric CSS circles, gold label) with an equalizer of five gold bars; no photo, no real cover art. Right: `FIFA 17 SOUNDTRACK` (12 px, letter-spacing .2em, `#C99B45`), title (Barlow Condensed 700 26 px, white), artist (14 px), `YOUTUBE` (11 px, right). A decorative gold waveform line (`aria-hidden` SVG). `PLAY TRACK` as a compact primary-style gold button and `MUTE` as a secondary, both 40 px tall. The seven media choices sit in one horizontal rail of compact chips (height 32, `overflow-x: auto`, no page scroll, selected chip gold). The placeholder and `#menuMusicStatus` are one 12 px line under the rail. If the card cannot fit all of this within its box at 1366×768, shrink the vinyl first, then drop the waveform. Report what you did.

**H4 · Phone (C7).** Top: header (48). Then a plate band showing both managers' heads (faces whole, never cut through a face), with the wordmark over the band's lower-left only if it clears both protected face boxes; otherwise omit the wordmark and kicker on phone and say so. Then `HOME` label + `RIVALRY HEADQUARTERS` (28 px) + the sentence (14 px, max 2 lines). Tiles in a 2 × 3 grid (Continue first), each ≥ 64 px tall: code + label visible; meta visible on `#continueCareer` only, visually hidden (still in DOM) on the other five. Soundtrack: one compact strip (title + artist on one line, `PLAY TRACK` and `MUTE` at 44 px, the chip rail as a 44 px horizontal scroller); placeholder and status visually hidden (status stays a live region). `.menuBottomStrip` visually hidden on phone, visible on desktop. Every "visually hidden on phone" choice goes into the handoff as a numbered item for Sol.
## C. Common rules (identical in all three briefs: Home, League, Club)

**C1 · Read first, in this order.** This brief. `visual-assets/v10_1/tr2/slice-02-plate/BUILD_RESULT.md` (the proven method: "paint the stage, place the live text"). Your folder's `assets/intake_report.md` and `assets/platemap.json`. The goal images and main screenshots are also in `visual-assets/goals/` on `claude-cloud/hlc-goals`. Product truth only from `origin/main` (read with `git show origin/main:<path>`): `index.html`, `css/app.css`, and the JS files named in section S. Nothing else is required reading.

**C2 · Source check.** `git fetch origin main`. Production anchor is `main@2de2373`. If `origin/main` moved, write `SOURCE_DRIFT: <new sha>` at the top of BUILD_RESULT.md, diff the files listed in section S, and use the new strings. Do not stop for drift.

**C3 · Scope.** Write only inside your own folder `visual-assets/v10_1/<screen>/`. Read-only reuse is fine: fonts from `../tr2/slice-02-plate/assets/fonts/`, `../../../js/visualIdentity.js`, and `../tr2/slice-02-plate/tools/render-qa.cjs` (copy it into your own `tools/` and adapt). Never touch `main`, production files, `visual-assets/v10/V10_STATE.md`, `visual-assets/v10_1/tr2/**`, other screens' folders, PRs or merges. Two other build sessions may run at the same time on sibling branches; this scope keeps you from colliding.

**C4 · Build shape.** Static prototype, same pattern as slice-02-plate: `index.html` + `<screen>.css` + `<screen>.js` + `fixtures.json` + `tools/render-qa.cjs`, served with `python3 -m http.server 8765` **from the repo root** (so the `../` reuse paths in C3 resolve), opened at `/visual-assets/v10_1/<screen>/index.html`. Frames switch with `?frame=<ID>`; `&grid=1` overlays platemap boxes. The plate is a cover-fit background; all in-world positions are plate px × k (k = rendered plate width / plate 1X width), read from `platemap.json`. Nothing animates (static checkpoint; motion comes later).

**C5 · Fixed product and identity rules.**
1. Every string, id, role and aria attribute in section S comes from production main, spelled and cased as the product renders it. Where the goal image disagrees with the product, the product wins; record each case in the handoff (section D).
2. All UI text is flat, screen-aligned, semantic DOM. No text is baked into any image you make. Perspective only on `aria-hidden` objects that carry no live text.
3. Daniel = Manager 1 = player one, always left. Nik = Manager 2 = player two, always right. Never mirror the plate or any cut from it.
4. No player photos, no people other than the two managers already in the plate, no real league logos or club crests, no EA/FIFA art. Club crests and league marks only from `js/visualIdentity.js` as merged from `claude-cloud/crest-v1` (original, hand-authored); a screen never draws its own. No `assets/marco-reus*` reference anywhere.
5. No live or private data in any raster. No new raster generation. The only new rasters allowed are crops/overlays cut from your own plate (e.g. a fingertip overlay), made with a script committed in `tools/`.
6. Every phone screen fits the visible area with no page scroll at 360×640, and the primary action is fully visible and tappable at 375×553. Touch targets ≥ 44 px on phone (48 preferred). Text ≥ 12 px everywhere; body copy ≥ 14 px on phone.
7. Faces, hands and the protected boxes in `platemap.json` are never covered by UI (≥ 8 px clear), unless a gate below says otherwise.

**C6 · Shared chrome (must look identical on all three screens).**
- Header (`<header id="topHeader">`), 56 px desktop / 48 px phone, background `linear-gradient(to bottom, rgba(6,7,9,.92), rgba(6,7,9,.70))`, 1 px bottom hairline `rgba(201,155,69,.45)`.
  - Left: an `aria-hidden` slanted gold badge reading `CM 17` (Barlow Condensed 700 italic 24 px, `#F2C45B`, dark plate with a 2 px gold right edge skewed −14°; the text itself is not skewed), then the product brand `<div class="brand"><h1>CAREER MODE</h1><p>SHOWDOWN // 17</p></div>` as small caps (13 px, letter-spacing .18em, `#E9DFC8`). On phone the brand text is visually hidden (still in the DOM); only the badge shows. (Open item for Sol, see D.)
  - Right: the product's `#onlinePlayerIdentityBadge` button (fixture `SIGN IN`) and `#seasonIndicator` (fixture per frame). Dark glass `rgba(10,12,15,.72)`, 1 px `rgba(201,155,69,.55)` border, Barlow Condensed 600 14 px, letter-spacing .12em, min height 40 desktop / 44 phone.
  - Desktop only, `aria-hidden`: the script line `More Than A Game` (Kaushan Script 18 px, `#F2C45B`, rotate −8°) at the far right. Hide below 900 px width.
  - No navigation tabs (HOME / CAREER / STANDINGS / STATS / RULES / ABOUT) and no search, settings or profile icons. They are in the goal images but not in the product.
- Footer: the product `<footer>` text `Career Mode Showdown` + `v1.9.1` at the left (11 px, `#9A8F7A`), and `aria-hidden` decorative `FOOTBALL BRINGS US TOGETHER` + a small gold crown glyph at the right (desktop only). 28 px desktop; on phone the footer may be omitted from the fold if space is needed, never covering controls.
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
| G8 Faces and hands | No UI box (text, control, panel) intersects any `protected_boxes` rect grown by 8 px, except where section S allows it. Report the smallest clearance per frame. |
| G9 Imagery | List every loaded image and CSS background URL. Allowed: your plate files, overlays cut from your plate, `LOGO_CM17_WORDMARK_V1` (Home only), fonts, inline/data SVG. `grep -ri reus` in your folder = 0 hits. |
| G10 Sides | Every player-one element's centre x < the matching player-two element's centre x. The plate's SHA-256 at load equals `intake_report.md`. |
| G11 Tab order | Tab order = visual reading order (top to bottom, then left to right). Disabled and hidden controls are skipped. |
| G12 Clean run | 0 console errors, 0 failed requests, 0 uncaught exceptions. |
| G13 Chrome snapshot | Write the header's and footer's computed box and key styles to the report (height, fonts, colours, badge box, right-control boxes) so the three screens can be compared later. Report only. |

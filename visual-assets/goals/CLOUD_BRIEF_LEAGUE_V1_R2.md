Recipient: Claude Code Cloud session (implementation worker)
Surface: claude.ai/code, repository `nikahanghojjati-oss/fifa17-career-showdown2`
Model: **Opus 5.5** · Effort: **High**. If Opus 5.5 is not offered, STOP and tell Nik. No automatic fallback.
Branch: `claude-cloud/league-v1` (cut by the HLC intake session from `claude-cloud/transfer-tr2-plate-g@8fbda03` or the base it records). Start with `git fetch origin claude-cloud/league-v1 && git checkout claude-cloud/league-v1`. If the branch or `visual-assets/v10_1/league/assets/ENV_LEAGUE_PLATE_V1_1X.webp` is missing, STOP and reply "League plate not committed yet".
Dependency (SOL-HLC-3): **run only after the crest set is accepted.** The crests and league marks come from the crest build (`CC_CREST_BUILD_BRIEF_V2.md` and its owner-gate revision, branch `claude-cloud/crest-v1`). After Claude's visual check, Sol's clearance and Nik's final look, the accepted commit is recorded as:
`ACCEPTED_CREST_SHA=<full 40-char SHA, filled in by Nik or Claude before launch>`
After checking out your branch: `git fetch origin claude-cloud/crest-v1`, verify with `git cat-file -e $ACCEPTED_CREST_SHA^{commit}` that this exact commit exists, then `git merge --no-edit $ACCEPTED_CREST_SHA` (a merge commit; never rebase; never merge the floating branch head, even if it has moved). If the SHA line above is still a placeholder, the commit is missing, or `js/visualIdentity.js` after the merge has no `window.getLeagueMark`, STOP and reply "Accepted crest SHA not available".
Role: build and produce evidence. No taste authority. No self-approval.
Return to: GPT-5.6 Sol (via Nik), and Claude in the project chat.

```
TASK_ID: CLOUD-LEAGUE-V1
STOP_BUDGET: 45 min wall-clock / $10 credit (routing V3 §3, static checkpoint build)
PRIORITY_ORDER: W0 source check + crest merge > W1 wheel with the crest-v1 league marks > W2 fingertip overlay > W3 desktop layout (frame L1) > checkpoint commit+push > W4 frames L2–L4 > W5 phone > G gates > deliverables (C9)
SCOPE: visual-assets/v10_1/league/ only (plus read-only reuse in C3)
```

# CLOUD BUILD BRIEF · LEAGUE V1 R2 · Select League wheel on the League plate

Author: Claude Opus 5.5, Lead Visual Producer · 2026-09-30
Revision: R2 (2026-10-01), applies GPT-5.6 Sol verdict SOL_HLC_BRIEFS_PRODUCT_TRUTH_VERDICT_2026-09-30.
Product-truth sign-off: `PENDING · GPT-5.6 Sol R2 consistency check` (run only after Sol OKs R2, the intake has committed this plate, and ACCEPTED_CREST_SHA is filled in)

## 0. Intent
Nik's goal: a night stadium, Daniel (left) pointing his finger at a big gold-rimmed wheel in the centre, Nik (right) watching with his hand on his chin, a gold brush title above, a gold SPIN WHEEL and a dark BACK below. The goal's wheel shows the real league logos; that is not allowed. You build the product's wheel as live DOM/SVG using the project's **original** league marks from the crest build, sitting in the empty glow the plate leaves for it, with Daniel's fingertip in front of its rim.

## 1. Assets (committed by the HLC intake session; read `assets/intake_report.md`)
- `assets/ENV_LEAGUE_PLATE_V1_1X.{webp,png}` (1536×864) and `_2X` (3072×1728).
- `assets/platemap.json`: protected boxes (both faces, Daniel's pointing hand, Nik's hand on chin), `remove_circles_cx_cy_r` = the wheel slot `[762, 496, 250]`, and `keep_rects` = Daniel's fingertip `[440,425,560,480]`, all in 1X plate px.
- `assets/REF_GOAL_LEAGUE.jpg`: Nik's goal with the league logos blurred, for composition only.

## S. Product truth for Select League (from `origin/main`)
Read: `index.html` `#leagueWheelScreen`; `js/leagueWheel.js` (all label and note strings, `getLeagueRotation`, busy state, when BACK is disabled); `data/leagues.js` (the league list and order); `css/app.css` wheel rules (`.leagueWheel`, `.wheelTrack`, `.wheelItem`, `.wheelPointer`) to see how items are placed.
- DOM to keep: `<h2>SELECT LEAGUE</h2>`, `.wheelContainer` > `.wheelPointer`, `#leagueWheel.leagueWheel` > `.wheelTrack` > 5 × `.wheelItem` (`Premier League`, `LaLiga`, `Bundesliga`, `Serie A`, `Ligue 1`, in main's order), `#selectedLeague` (role=status, aria-live=polite, aria-atomic=true), `#leagueStateNote` (role=status), `#spinLeague`, `.backButton[data-smart-back]`.
- **The rotation contract stays:** production rotates `.wheelTrack` by `getLeagueRotation(id)` = −(index × 72°) + whole turns, so item *i* must sit at +*i* × 72° clockwise from the pointer at 12 o'clock. Your prototype sets the same transform per frame. The goal's segment order (PL top, Bundesliga right, Ligue 1 lower right, Serie A lower left, LaLiga left) is **not** used; main's order wins.
- Primary control for G4: `#spinLeague` in every frame.
- Allowed decorative text (aria-hidden, G1): the kicker `CAREER MODE SHOWDOWN 17`, `CM 17`, `More Than A Game`, `FOOTBALL BRINGS US TOGETHER`, the two slogan boxes `DIFFERENT LEAGUES / DIFFERENT STORIES / SAME PASSION` and `WHERE RIVALS / CREATE LEGENDS` (desktop only), the country codes inside the crest-build league marks, and the text painted in the plate.

**Frames (strings exactly as `leagueWheel.js` sets them):**
| Frame | State | `#selectedLeague` | `#spinLeague` | `#leagueStateNote` | BACK |
| --- | --- | --- | --- | --- | --- |
| L1 (Tier S) | ready | `Spin to select league` | `SPIN WHEEL` | hidden | enabled |
| L2 | spinning (static mid-spin, track at −(2 × 360 + 3 × 72 + 31)°) | `SPINNING...` | `SPINNING...`, disabled | hidden | disabled |
| L3 | selected, not confirmed (Bundesliga) | `Bundesliga` | `CONTINUE TO CLUB ASSIGNMENT` | main's "has been selected and locked…" note for Bundesliga | enabled per main |
| L4 | clubs already locked (Bundesliga) | `Bundesliga` | `LEAGUE LOCKED`, disabled | `League and clubs are permanent for this showdown.` | enabled per main |

## W. Build items
**W0 · Source check** (C2). Build `fixtures.json` from main's strings; confirm the button/BACK disabled states per frame from the code (the table above is my reading; main wins).

**W1 · Wheel and original league marks.** Centre the wheel on the plate slot `(762, 496)`; outer rim radius 240 plate px (× k). Build it as `aria-hidden` SVG layers plus the live `.wheelItem` text:
- Rim: 18 px (plate px) gold ring `linear-gradient` `#FFF1B8 → #C99B45 → #7A5A22`, 20 small studs evenly spaced, a thin inner dark ring. A fixed pointer at 12 o'clock: a gold downward chevron with a small crown, on top of the rim (`.wheelPointer` keeps its text node visually hidden and draws the chevron in CSS/SVG).
- Five equal 72° segments, dark glass `#0E1013 → #181B20` radial, separated by 2 px gold spokes. A **fixed gold wedge** under the pointer (does not rotate): `linear-gradient(#F7D46A,#C99B45)` at 85 % opacity, lighting whichever segment sits at the top. The segment under the wedge shows dark ink text; the others show light text.
- Hub: a 22 % radius dark roundel with a 4 px gold ring and a gold crown (`aria-hidden`). It replaces main's `CMS 17` pseudo-content.
- Each segment: the league's original mark (about 64 plate px) above the `.wheelItem` name (Barlow Condensed 700 22 plate px, uppercase via CSS only if main's text stays unchanged in the DOM). Text is always upright relative to its segment's radius, never mirrored, and must stay readable at the top segment.
- **League marks come only from the crest build.** Load `../../../js/visualIdentity.js` (merged from `ACCEPTED_CREST_SHA`) and use `applyLeagueMark(el, leagueId)` (sets `--league-mark-image` and `data-league-mark="original"`) or `getLeagueMark(leagueId).image`, with the ids from `data/leagues.js`. Do not draw, edit or restyle league marks yourself, and do not touch `data/leagues.js` (its `logo` fields point at real-logo files that don't exist; that is flagged for Sol separately). If a mark is missing for a league, show only the name and list it in the handoff.

**W2 · Fingertip overlay.** Cut Daniel's hand and fingertip from the 1X and 2X plates inside `keep_rects[0]` with a hand-drawn polygon mask (1.5 px feather), script `tools/make_finger_overlay.py`, output `assets/OVL_DANIEL_FINGER_V1_{1X,2X}.png`. Layer it above the wheel so the finger reads as in front of the rim, exactly registered to the plate through `plateToScreen` (C4b), 0 px offset at 1X, measured. G8 exception: the wheel may sit under this hand; no live text may be under it.

**W3 · Desktop layout (L1).** Header/footer per C6. Title block centred over the wheel (goal: y 10–28 %): kicker, then `<h2>SELECT LEAGUE</h2>` (C6 title, 72 px at 1366), then `#selectedLeague` as the spaced subtitle line between two thin gold rules (15 px, letter-spacing .4em; when it shows a league name use 22 px, `#F2C45B`). `#leagueStateNote` (when shown) is a 14 px line on a small dark-glass strip just above the buttons. Buttons side by side under the wheel (goal: y 86–93 %): `#spinLeague` primary gold 300 px wide, BACK secondary 200 px, 16 px gap; the spin button keeps its circular-arrows icon only as `aria-hidden` SVG. Slogan boxes left and right at goal positions (desktop ≥ 1200 px only), thin gold corner rules, 14 px spaced type. The wheel scales so title, wheel, note and buttons fit at 1366×640 (the wheel may shrink to 80 %).

**W4 · Frames L2–L4** from the table in S. In L3/L4 the selected league sits under the wedge (rotation −(2 × 72)° for Bundesliga with main's order). L2 shows a static mid-spin angle with a subtle `aria-hidden` motion-blur ring on the segments (CSS only, no animation).

**W5 · Phone (C7).** Header 48. Plate band cropped so both faces stay whole (or fully out of frame, never cut); the wheel (diameter 220–250 px at 360 wide) overlaps the band's lower centre, so Daniel's finger still points at it if the crop allows; if the finger overlay cannot be aligned on phone, hide the overlay and keep the wheel clear of the hand. Title 40 px, `#selectedLeague` under it, note (max 3 lines, 14 px), then `#spinLeague` full width and BACK full width (48 px each), all within 360×640 with `#spinLeague` fully visible at 375×553. Slogan boxes hidden on phone.
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

Recipient: Claude Code Cloud session (implementation worker)
Surface: claude.ai/code, repository `nikahanghojjati-oss/fifa17-career-showdown2`
Model: **Opus 5.5** · Effort: **High**. If Opus 5.5 is not offered, STOP and tell Nik. No automatic fallback.
Branch: `claude-cloud/club-v1` (cut by the HLC intake session from `claude-cloud/transfer-tr2-plate-g@8fbda03`, the expected base recorded in `assets/intake_report.md`). Start with `git fetch origin claude-cloud/club-v1 && git checkout claude-cloud/club-v1`. If the branch or `visual-assets/v10_1/club/assets/ENV_CLUB_PLATE_V1_1X.webp` is missing, STOP and reply "Club plate not committed yet".
Dependency (SOL-HLC-3): **run only after the crest set is accepted.** The crests and league marks come from the crest build (`CC_CREST_BUILD_BRIEF_V2.md` and its owner-gate revision, branch `claude-cloud/crest-v1`). After Claude's visual check, Sol's clearance and Nik's final look, the accepted commit is recorded as:
`ACCEPTED_CREST_SHA=f1cfff4cc79278ac1f93cd4bff58700eadd58cf9` (Frozen 2026-10-01: Sol PASS (S2C-000) + Nik owner OK.)
After checking out your branch: `git fetch origin claude-cloud/crest-v1`, verify with `git cat-file -e $ACCEPTED_CREST_SHA^{commit}` that this exact commit exists, then `git merge --no-edit $ACCEPTED_CREST_SHA` (a merge commit; never rebase; never merge the floating branch head, even if it has moved). If the SHA line above is still a placeholder, the commit is missing, or `js/visualIdentity.js` after the merge has no `window.getClubCrestSvg`, STOP and reply "Accepted crest SHA not available".
Role: build and produce evidence. No taste authority. No self-approval.
Return to: GPT-5.6 Sol (via Nik), and Claude in the project chat.

```
TASK_ID: CLOUD-CLUB-V1
STOP_BUDGET: 60 min wall-clock / $15 credit (routing V3 §3, first-of-kind: first pack-reveal composition; Nik confirms by launching it)
PRIORITY_ORDER: K0 source check + crest merge > K1 desktop CL1 ready > K2 desktop CL6 confirmation > K3 pack-open treatment (CL3) > checkpoint commit+push > K4 phone CL1 + CL6 > K5 frames CL2, CL4, CL5 (desktop, then phone) > G gates > deliverables (C9)
SCOPE: visual-assets/v10_1/club/ only (plus read-only reuse in C3)
```

# CLOUD BUILD BRIEF · CLUB V1 R3 · Club Assignment on the Club plate

Author: Claude Opus 5.5, Lead Visual Producer · 2026-09-30
Revision: R3 (2026-10-01), applies GPT-5.6 Sol verdicts SOL_HLC_BRIEFS_PRODUCT_TRUTH_VERDICT_2026-09-30 (R2) and SOL_HLC_R2_CONSISTENCY_VERDICT_2026-10-01 (D1-D8). R2 file kept untouched.
Changelog: R3 2026-10-01: D1, D2 (via intake), D7, D8 (see FOR_SOL change log). R3.1 2026-10-01: Sol R3.1-1..5 applied. R3.2 2026-10-01: Sol verdict B D9–D11 merged with R3.1. R3.3 2026-10-01: ACCEPTED_CREST_SHA frozen; OWNER-3 pack rip.
Product-truth sign-off: `PENDING · GPT-5.6 Sol R3 quick check` (run only after Sol OKs R3, the intake has committed this plate, and ACCEPTED_CREST_SHA is filled in)

## 0. Intent
This is the screen furthest from Nik's goal. Main today is a light-blue page with two flat grey pack cards. The goal: a night stadium, Daniel (left) and Nik (right) each holding a sealed black "CLUB PACK CM17" at chest height, a gold brush `CLUB ASSIGNMENT` title with the league status under it, a five-step draw rail, a big `VS` between the packs, a dark panel along the bottom with both managers' club slots, and a gold `OPEN SHOWDOWN PACKS` button. The packs in the plate are the product's sealed pack doors. You place the product's live reveal UI on the plate and give each pack a code-drawn "opened" state that reveals the club's original crest.

## 1. Assets (committed by the HLC intake session; read `assets/intake_report.md`)
- `assets/ENV_CLUB_PLATE_V1_1X.{webp,png}` (1536×864) and `_2X` (3072×1728).
- `assets/platemap.json`: protected boxes (both faces) and `pack_daniel` / `pack_nik` (the held packs), in 1X plate px.
- `assets/REF_GOAL_CLUB.jpg`: Nik's goal image, for composition only.
- Crests: `../../../js/visualIdentity.js` after the `ACCEPTED_CREST_SHA` merge: `getClubIdentity(name).crest`, `getClubCrestSvg(name)`, CSS var `--club-crest-image` (set by `applyClubIdentity(el, name)`). Hand-authored original crests. No other crest source; never draw or restyle a crest yourself.

## S. Product truth for Club Assignment (from `origin/main`)
Read: `index.html` `#clubWheelScreen`; `js/clubAssignment.js` (`CLUB_REVEAL_STAGES`, every `setClubText` string per stage, `setRevealControls` per stage, `populateClubConfirmation`, `applyClubRevealCard` and how it applies the crest/identity); the `#clubWheelScreen` / `.club*` rules in `css/app.css` to see which states are shown or hidden per `data-club-reveal-stage`.
- DOM to keep (ids, order, aria): `<h2>CLUB ASSIGNMENT</h2>`; `.clubAssignmentHeader` (`LEAGUE CONFIRMED` eyebrow, `#clubAssignmentLeague`, `#clubPackStatus` aria-live=polite); `.clubRevealProgress` (aria-hidden, 5 spans `01 DRAW`, `02 PACK 1`, `03 PACK 2`, `04 VS`, `05 LOCK` with `active`/`done` classes); two `.clubRevealCard` (`#clubCardOne` Daniel left, `#clubCardTwo` Nik right), each with `.clubRevealIndex`, `.clubManager`, `.clubPackStage` > `.clubPackDoor` (aria-hidden) + `.clubCardFace` (`CAREER DRAW`, `ASSIGNED CLUB`, club name `#clubNameOne/Two`, state `#clubCardStateOne/Two`); `.clubVs` (`RIVALRY` / `VS`); `#clubRivalryConfirmation` (aria-live=polite: `CLUBS LOCKED`, showdown name, meta, matchup, lock note); `#openClubPack`, `#continueClubAssignment`, `#clubAssignmentBack`.
- Fixtures: league `Premier League`; Daniel `Arsenal`, Nik `Chelsea`; showdown name `Daniel vs Nik`; 3 seasons → meta `Premier League · 3 seasons`.
- Allowed decorative text (aria-hidden, G1): kicker `CAREER MODE SHOWDOWN 17`, `CM 17`, `More Than A Game`, `FOOTBALL BRINGS US TOGETHER`, the `.clubPackDoor` text (visually hidden, see K1), the crest initials inside visualIdentity SVGs, and the text painted in the plate (`CLUB PACK`, `CM 17`, banners, notes).

**Frames (strings and controls exactly as `clubAssignment.js` sets them; the table is my reading, main wins):**
| Frame | Stage | `#clubPackStatus` | Cards | Confirmation | Controls (primary for G4) |
| --- | --- | --- | --- | --- | --- |
| CL1 (Tier S) | ready | `LEAGUE CONFIRMED · TWO SEALED CLUB PACKS READY` | both `?` / `SEALED` | hidden | `OPEN SHOWDOWN PACKS` (primary) + BACK |
| CL2 | opening | `CLUB DRAW SAVED · PREPARING PACK 01` | both sealed | hidden | `DRAW LOCKED...` disabled; BACK hidden. G4 exempt |
| CL3 | manager-one | `DANIEL · PACK 01 OPEN` | Daniel revealed, Nik sealed | hidden | as CL2. G4 exempt |
| CL4 | manager-two | `NIK · PACK 02 OPEN` | both revealed | hidden | as CL2. G4 exempt |
| CL5 | versus | `BOTH CLUBS REVEALED · BUILDING RIVALRY` | both revealed | shown | no controls. G4 exempt |
| CL6 | confirmation | `RIVALRY READY · CONFIRM TO BEGIN` | both revealed | shown | `CONFIRM RIVALRY & START SHOWDOWN` (primary) only |

## K. Build items
**K0 · Source check** (C2). Build `fixtures.json` per frame from main.

**K1 · Desktop CL1 (ready).** Header/footer per C6.
- Title block centred between the two faces (goal: x 30–70 %, y 11–34 %): kicker; `<h2>CLUB ASSIGNMENT</h2>` (C6 title, 64 px at 1366, must clear both face boxes by ≥ 8 px; shrink before touching a face); `LEAGUE CONFIRMED` eyebrow with a small `aria-hidden` gold check; `#clubAssignmentLeague` in 26 px gold (the goal omits the league name; the product shows it, so it stays); `#clubPackStatus` 15 px, letter-spacing .2em, with a small `aria-hidden` pack glyph.
- Draw rail (goal: y 37–44 %): five steps on a thin gold line, each a 36 px `aria-hidden` ring above its span text; `active` = solid gold ring + gold label, `done` = gold check in the ring, others dim. The span text stays one text node (`01 DRAW` etc.).
- Packs: the painted packs **are** the `.clubPackDoor` visuals. Position each `.clubPackStage` exactly over `pack_daniel` / `pack_nik`, make the door's own fill and text transparent (door text visually hidden; it is aria-hidden already), so the plate's pack shows through. Nothing covers the managers' hands.
- VS: `.clubVs` centred between the packs (goal: x 45–55 %, y 47–64 %): `RIVALRY` (14 px, letter-spacing .5em) over a big `VS` (Barlow Condensed 700 italic 96 px, C6 gold gradient + brush filter).
- Bottom panel (goal: x 9–91 %, y 69–86 %): a wide dark-glass trapezoid panel (`clip-path`, 1 px gold top edge, soft gold under-glow) holding the two `.clubCardFace` blocks, Daniel's left and Nik's right, with a thin `aria-hidden` divider and small `VS` between them. Each face: a 56 px shield slot (sealed: dark shield with a `?` drawn in SVG, `aria-hidden`), manager name from `.clubManager` (Barlow Condensed 700 22 px), `CAREER DRAW` / `ASSIGNED CLUB` (12 px spaced), club name (Barlow Condensed 700 26 px), state (12 px, `SEALED` dim, `REVEALED` gold). `.clubRevealIndex` shows as a small `01` / `02` tag. The goal's panel title `CLUBS LOCKED · SHOWDOWN` and its line "Once revealed, these clubs are permanent…" are **not** shown in CL1: in the product that copy belongs to the confirmation (CL5/CL6).
- Buttons (goal: y 87–93 %): `#openClubPack` primary gold 400 px with an `aria-hidden` pack glyph and chevron; `#clubAssignmentBack` secondary 200 px.

**K2 · Desktop CL6 (confirmation).** Cards revealed (K3). `#clubRivalryConfirmation` becomes the panel's header band and body: the tab on the panel's top edge reads `CLUBS LOCKED` + the showdown name (`Daniel vs Nik`) with the meta under it; the matchup (`Daniel` · `Arsenal` VS `Nik` · `Chelsea`) sits in the band; the lock note (14 px, max 2 lines) sits at the band's bottom. The card faces stay in the panel; if both the faces and the matchup cannot fit legibly, keep the faces' crest + club name and visually hide the duplicate matchup row, and list it for Sol. `#continueClubAssignment` is the only control, primary gold, 520 px. The big centre `VS` may shrink to 64 px here.

**K3 · Pack-open treatment (CL3, CL4, CL5, CL6).** For a revealed side, over that pack's box, all `aria-hidden`, CSS + inline SVG only: darken the painted pack face 35 % with a mask shaped to the box; a gold light burst from the pack's top edge (12–16 thin SVG rays, `mix-blend-mode: screen`, max 70 % opacity); the club's original crest (`getClubCrestSvg(name)` inline, or `--club-crest-image`) centred on the pack's crown shield at about 55 % of the pack width, with a 1 px gold rim and a soft glow; a torn top-edge strip (SVG zig-zag, 10 plate px) along the pack's top. Nothing from this treatment may enter a face or hand box (G8). It may enter the two pack boxes (Club-only exception, G8): only this bounded reveal treatment, never live text, controls or panels. The same crest also fills that side's 56 px shield slot in the panel.

**OWNER-3 (Nik, 2026-10-01): pack rip reveal.** Part of K3, inside the existing D7 pack-box exception (aria-hidden, bounded to the pack boxes, no live text, controls or panels). Supersedes K3's static torn-strip and crest-on-shield staging for the reveal motion; the end state is unchanged.
- The reveal must read as Daniel and Nik physically ripping their real packs.
- Both hands stay static and are re-composited ON TOP as exact original-pixel overlays, registered via `plateToScreen`, so the tear happens beneath their fingers.
- Each pack's top strip, between the gripping hands, tears off along a jagged SVG `clip-path` edge and flips/falls away.
- A gold light burst comes out of the opening.
- The club crest (from `getClubCrestSvg` at `ACCEPTED_CREST_SHA`) rises out of the pack and settles into its card position.
- Total about 1.5 s, CSS/SVG/JS only, no video and no new raster. Smooth on phones: `transform` and `opacity` only.
- Visual quality of the rip is the priority. `prefers-reduced-motion` gets a simple crossfade.
- QA: a frame strip at 0/25/50/75/100% for CL3-CL6, confirming the hands stay above the tear and no live text or control enters the pack boxes.

**K4 · Phone CL1 + CL6 (C7).** Header 48. Title 34 px, league + status (≤ 2 lines), rail compact: 24 px rings with labels at ≥ 12 px; if the inactive labels cannot fit at 12 px, visually hide them and show only the active label (≥ 12 px); spans stay in the DOM (SOL-HLC-7). Plate band showing both managers with their packs; faces whole or fully out of frame, never cut. The band may shrink in CL5/CL6 (packs only, faces out) to make room for the confirmation. Card faces as two columns under the band; confirmation band under them in CL5/CL6. Primary button full width 52 px, BACK full width 44 px. All within 360×640; primary fully visible at 375×553.

**K5 · Frames CL2, CL4, CL5** per the table (desktop first, then phone). CL2 shows the `01 DRAW` rail step active and both packs with a faint `aria-hidden` gold edge pulse drawn statically (no animation).
## C. Common rules (identical in all three briefs: Home, League, Club)

**C1 · Read first, in this order.** This brief. `visual-assets/v10_1/tr2/slice-02-plate/BUILD_RESULT.md` (the proven method: "paint the stage, place the live text"). Your folder's `assets/intake_report.md` and `assets/platemap.json`. The goal images and main screenshots are also in `visual-assets/goals/` on `claude-cloud/hlc-goals`. Product truth only from `origin/main` (read with `git show origin/main:<path>`): `index.html`, `css/app.css`, and the JS files named in section S. Nothing else is required reading.

**C1b · Plate G base.** Screen branches are cut by the intake session from `claude-cloud/transfer-tr2-plate-g@8fbda036c1d1f7910631964e982705d0f25290c0` (the expected base; the intake session STOPs with `PLATE_G_SOURCE_DRIFT` rather than cut from a different head). Record the base SHA in BUILD_RESULT.md.

**C2 · Source check.** `git fetch origin main`. Approved product anchor is `2de237391e17c7de2c6deb606b102b68ee640212`. If `origin/main` differs, diff only the section-S authority files for this screen. If none of those files changed, record `SOURCE_DRIFT: <new sha> (no relevant authority-file changes)` and continue. If any authority file changed, STOP before implementation and return `SOURCE_DRIFT_REVIEW_REQUIRED` with the changed paths and diff summary for Sol. Do not silently adopt new product behavior or strings.

**C3 · Scope.** Write only inside your own folder `visual-assets/v10_1/<screen>/`. Read-only reuse is fine: fonts from `../tr2/slice-02-plate/assets/fonts/`, `../../../js/visualIdentity.js`, and `../tr2/slice-02-plate/tools/render-qa.cjs` (copy it into your own `tools/` and adapt). Never touch `main`, production files, `visual-assets/v10/V10_STATE.md`, `visual-assets/v10_1/tr2/**`, other screens' folders, PRs, or any merge into main (the only merge allowed is the pinned crest SHA in League and Club). Two other build sessions may run at the same time on sibling branches; this scope keeps you from colliding.

**C4 · Build shape.** Static prototype, same pattern as slice-02-plate: `index.html` + `<screen>.css` + `<screen>.js` + `fixtures.json` + `tools/render-qa.cjs`, served with `python3 -m http.server 8765` **from the repo root** (so the `../` reuse paths in C3 resolve), opened at `/visual-assets/v10_1/<screen>/index.html`. Frames switch with `?frame=<ID>`; `&grid=1` overlays platemap boxes. Nothing animates (static checkpoint; motion comes later).

**C4b · One plate-mapping helper (SOL-HLC-4).** The plate is a `cover`-fit background. Write one function, `plateToScreen(x, y)`, and use it for every plate-registered thing: overlays, the `&grid=1` evidence, wheel and pack positions, and the G8 protected-box checks. With stage size `W×H` and plate 1X size `PW×PH`:
`k = max(W/PW, H/PH)`; `offsetX = (W − PW·k)/2`; `offsetY = (H − PH·k)/2`; `screenX = offsetX + x·k`; `screenY = offsetY + y·k`.
If you change `background-position`, the offsets must follow that exact position (e.g. a vertical bias). Any plate cut-out (the League fingertip) uses the same transform. The phone band may use its own transform, but write it explicitly in the code and in BUILD_RESULT.md, and measure against it.

**C5 · Fixed product and identity rules.**
1. Every live product string, id, role and aria attribute in section S follows production main unless that screen's section S explicitly declares a Sol/owner-approved exception. Home's Audius soundtrack content is the current explicit exception. Where the goal image disagrees with product truth, product truth or an explicit approved exception wins; record each case in the handoff.
2. All UI text is flat, screen-aligned, semantic DOM. No text is baked into any image you make. Perspective only on `aria-hidden` objects that carry no live text.
3. Daniel = Manager 1 = player one, always left. Nik = Manager 2 = player two, always right. Never mirror the plate or any cut from it.
4. No player photos, no people other than the two managers already in the plate (sole exception: the Home-only anonymous decorative icon below), no real league logos or club crests, no EA/FIFA art. Club crests and league marks only from `js/visualIdentity.js` as merged from the pinned `ACCEPTED_CREST_SHA` (League, Club) (original, hand-authored); a screen never draws its own. No `assets/marco-reus*` reference anywhere.
   Home-only icon exception: the four action-tile icons are `aria-hidden` decorative UI art derived from Nik's supplied Home goal. Prefer inline SVG redraws matching the goal silhouettes/shapes. Do not create photographic player art. The Continue icon may depict the goal's anonymous back-facing `17` shirt figure. This exception does not authorize any additional person in the plate/world scene and does not apply to League or Club.
5. No live or private data in any raster. No new raster generation. The only new rasters allowed are crops/overlays cut from your own plate (e.g. a fingertip overlay), made with a script committed in `tools/`. The Home-only tile icons are not rasters: they are inline SVG redraws (see the Home-only icon exception under rule 4); no new raster-icon exception, no PNG crops of the goal.
6. Every phone screen fits the visible area with no page scroll at 360×640, and the primary action is fully visible and tappable at 375×553. Touch targets ≥ 44 px on phone (48 preferred). Text ≥ 12 px everywhere, footer and all helper/source labels included (SOL-HLC-7); body copy ≥ 14 px on phone.
7. Faces, hands and the protected boxes in `platemap.json` are never covered by UI (≥ 8 px clear), unless a gate below says otherwise (the only such cases are the two bounded runtime exceptions in G8: League-only fingertip/hand layering and Club-only pack reveal). League-only fingertip layering exception: on the League screen, the aria-hidden wheel/rim may geometrically pass beneath Daniel's pointing-hand protected region only where the registered OVL_DANIEL_FINGER_V1_* overlay restores the exact original plate pixels above the wheel. No wheel pixel may remain visually over the hand after compositing. No live text, control, or panel may enter the face/hand protected box. All other face/hand protected boxes retain the normal 8 px clearance rule.

**C6 · Shared chrome (must look identical on all three screens).**
- Header (`<header id="topHeader">`), 56 px desktop / 48 px phone, background `linear-gradient(to bottom, rgba(6,7,9,.92), rgba(6,7,9,.70))`, 1 px bottom hairline `rgba(201,155,69,.45)`.
  - Left: an `aria-hidden` slanted gold badge reading `CM 17` (Barlow Condensed 700 italic 24 px, `#F2C45B`, dark plate with a 2 px gold right edge skewed −14°; the text itself is not skewed), then the product brand `<div class="brand"><h1>CAREER MODE</h1><p>SHOWDOWN // 17</p></div>` as small caps (13 px, letter-spacing .18em, `#E9DFC8`). Desktop shows the badge plus the product brand. On phone the brand text may be visually hidden (still in the DOM) and only the `CM 17` badge retained.
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
| G1 Strings | Visible text nodes of each frame = that frame's expected list in `fixtures.json` (built from section S: current-main strings; for Home also the explicit Audius exception in Home section S) + the allowed decorative list in section S. Report any missing or extra string. 0 extra, 0 missing. |
| G2 IDs | Every product id in section S exists exactly once; roles and aria attributes match main. |
| G3 No scroll | `scrollHeight ≤ innerHeight + 1` and `scrollWidth ≤ innerWidth + 1` on `html` and `body`. |
| G4 Primary action | The frame's primary control (section S) is fully inside the viewport, and `elementFromPoint` at its centre returns it. Must hold at 375×553 and 1366×640. |
| G5 No clipping | Every text element: `scrollWidth ≤ clientWidth + 1`, `scrollHeight ≤ clientHeight + 1`; no `text-overflow: ellipsis`. Includes the longest fixture strings. |
| G6 Sizes | Phone: every control ≥ 44 px tall and ≥ 44 px wide; no text under 12 px; body copy ≥ 14 px. Desktop: controls ≥ 40 px. |
| G7 Contrast | Brightest-background-pixel method (same as slice-02-plate): normal text ≥ 4.5:1, large text (≥ 24 px, or ≥ 18.66 px bold) ≥ 3:1, control borders ≥ 3:1. Fix a failure with a local scrim first. |
| G8 Faces and hands | Using `plateToScreen` (C4b): face and hand protected boxes always require ≥ 8 px clearance: no UI box (text, control, panel) intersects any face or hand `protected_boxes` rect grown by 8 px, except for exactly two bounded runtime exceptions. **1. League-only fingertip layering:** on the League screen, the aria-hidden wheel/rim may geometrically pass beneath Daniel's pointing-hand protected region only where the registered OVL_DANIEL_FINGER_V1_* overlay restores the exact original plate pixels above the wheel. No wheel pixel may remain visually over the hand after compositing. No live text, control, or panel may enter the face/hand protected box. All other face/hand protected boxes retain the normal 8 px clearance rule. Face boxes remain fully protected. **2. Club-only pack reveal (D7):** the two pack boxes (`pack_daniel`, `pack_nik`) are an explicit exception for K3's `aria-hidden` pack-open treatment in CL3–CL6. Only the bounded reveal treatment may enter those pack boxes; live text, controls and panels may not. CL1/CL2 keep the pack pixels unobscured except for the allowed transparent positioning shell. Intake hard-restores face, hand and pack protected boxes alike; this gate is runtime occlusion only. Report separately: (a) face/hand clearance (smallest per frame); (b) pack-overlay containment inside each pack box; (c) zero live-text/control intersection with pack boxes. For League, report the wheel/hand overlap region, verify that it is fully contained by the finger-overlay alpha coverage, and verify 0 px overlay registration error. Live text/control/panel intersection with the hand box remains zero. Also report face clearance. |
| G9 Imagery | List every loaded image and CSS background URL. Allowed: your plate files, overlays cut from your plate, `LOGO_CM17_WORDMARK_V1` (Home only), fonts, inline/data SVG (including the four inline/data SVG Home tile icons, Home only). `grep -ri reus` in your folder = 0 hits. |
| G10 Sides | Every player-one element's centre x < the matching player-two element's centre x. The plate's SHA-256 at load equals `intake_report.md`. |
| G11 Tab order | Tab order = visual reading order (top to bottom, then left to right). Disabled and hidden controls are skipped. |
| G12 Clean run | 0 console errors, 0 failed requests, 0 uncaught exceptions. |
| G13 Chrome snapshot | Write the header's and footer's computed box and key styles to the report (height, fonts, colours, badge box, right-control boxes) so the three screens can be compared later. Report only. |

# CC-008 · Claude Code cloud brief: final visual and UI polish of the Team V package

| Field | Value |
| --- | --- |
| Model | Opus 5.5, effort High |
| STOP_BUDGET | **$15 hard cap, about 60 minutes.** Part A must be finished even if Part B is not. At $12 stop starting new items: commit what is done, run the final check, write the result file. At $15 stop. |
| Repository | `nikahanghojjati-oss/fifa17-career-showdown2` |
| Branch | `factory/v1-wtt5ye` only. Fetch with an explicit refspec: `git fetch origin +refs/heads/factory/v1-wtt5ye:refs/remotes/origin/factory/v1-wtt5ye`, then `git checkout -B factory/v1-wtt5ye origin/factory/v1-wtt5ye`. Push only to this branch. Never `main`, never force-push, never delete branches or files you did not create. Pull with `--rebase --autostash` before every push; on a rejected push, pull and push again (up to 4 times). |
| Result file | `project-documents/factory/handoffs/CC-008_RESULT.md` |
| Written by | Team V lead (Claude), 2026-10-04, after the factory board reached 238/238 |
| Billing | Nik's Claude Code cloud credit. Read narrowly: grep and `sed -n` ranges, never whole large files twice. |

## Why this session exists

All 238 factory jobs are done and checked. Nik reviewed every screen and his notes are Part A below. Nik (the owner) also asked for one extra polish layer before the package goes to integration: **fix the visual bugs and UI issues that are still there, most of all anything that could get in the way of playing the game.** You are the last pass before integration, so fix things; don't write reports about them.

## Read first (only these, only the named parts)

1. `project-documents/factory/PRODUCT_TRUTH.md`: the product rules. They win over any mockup.
2. `project-documents/factory/QUALITY_BAR.md`: the gates H1-H11 (section headings plus the H table).
3. `project-documents/factory/reviews/FINAL_REVIEW.md`: sections "Fix round" and "Left for pass 2".
4. `visual-assets/v10_1/shared/STAGE.md` and `shared/CUTOUT_STANDARD.md`: how the phone hero layers (cutouts) are placed.

## Hard rules (never break)

- Daniel is always on the LEFT, Nik always on the RIGHT, on every screen and size.
- No real club crests, league logos, trophies or player photos. The only player photo is the Loading Marco Reus photo, and it keeps its CC BY 2.0 credit line.
- Never bake live data (names, scores, dates) into images. You cannot make new pictures in this session. If an item needs a new picture, leave it and record it under "Needs a picture" in the result file.
- Do not touch main or any `js/` or `css/` file outside `visual-assets/` (Team G owns the game code).
- Keep the shared kit's motion timings (`shared/MOTION.md`), the 5-tab top nav contract (`shared/navbar/NAV_CONTRACT.md`) and the Home Audius music player (`home/soundtrack.js`; no YouTube anywhere).
- Phone fit targets: no page scroll and every primary button visible at **393x660, 360x640 and 375x553**. Desktop targets: **1366x768, 1920x1080 and 1366x640**.

## How to see a screen

```sh
cd <repo> && (python3 -m http.server 8765 >/dev/null 2>&1 &)
NODE_PATH=$(npm root -g) node project-documents/factory/tools/claude_qc.cjs '[["home_p","visual-assets/v10_1/home/index.html",393,660]]'
# writes /tmp/claude-0/qc/home_p.jpg (it prints "scroll WxH ok" when the page does not scroll). Look at every picture you change.
```
Chromium is pre-installed for Playwright (do not run `playwright install`). Transfer War frames: `tr2/slice-02-plate/index.html?frame=F1` (F1-F4). Showcase: `showcase/index.html`.

## The work, most important first

Do Part A first, then Part B, in order. For each one: render before, fix, render after at every size the item names, then commit with a message that names the item number (`CC-008 item N: ...`).

### Part A: Nik's own review (04 Oct 2026, 5:04 p.m. Eastern). Do all of these first.

Nik looked at fresh shots of every screen. **Approved as they are (do not change):** desktop Home, League, Club, Transfer War, Loading; Settings, Rule Book, Legacy, Trophy Room, Standings, Final Winner, Season Results and Start / Join on both desktop and phone (except the small A7 note). His notes, in his words where it matters:

A1. **Home phone: use the empty dark band.** Under the Trophy Room / Rule Book / Settings tiles there is a large empty dark band above the bottom nav (about 393x70 px at 393x660). Re-space the phone layout so that space is used: move the Audius music card into it (or another arrangement you judge better), and let the hero and tiles breathe. Files: `home/home.css` (phone query), `home/index.html` only if order must change. The Audius player (`home/soundtrack.js`) must keep working: Play, Mute and Tracks still open and play. Target: no large empty band, every tile and the Continue button visible with no scroll at all three phone sizes.
A2. **League phone: the wheel covers both managers' hair.** "Select league is covering a lot of my hair and a lot of Daniel's hair." There is empty dark space below the wheel, so push the wheel (and the "spin to select league" line) down and/or make the managers sit higher, so both heads and hair are fully clear of the wheel. Files: `league/league.css` phone query and `league/league.js` `layoutPhone` (the wheel radius/centre are computed there). Keep the five league marks fully inside the gold rim (fixed in 2cdb1a20) and Back + Spin Wheel visible. Target: the wheel's top edge below both chins at 393x660, 360x640 and 375x553.
A3. **Club Assignment phone: Nik is far too big.** "I'm covering Daniel fully... Daniel's pack and half of his body is under me... reduce my size by a lot, I don't know, fifty percent." Today Nik's cutout fills the middle and covers Daniel and his pack. Make Nik much smaller (start at about 55-60% of today's height) and place the two side by side: Daniel left with his pack visible, Nik right with his pack visible, neither covering the other, both heads fully inside the screen (no hair cut off at the top). Files: `club/club.css` phone query (and `club/club.js` only if the phone layer sizes are set in JS). Target: both faces, both packs and both upper bodies visible at all three phone sizes.
A4. **Transfer War phone: Daniel is hidden and the top is messy.** "Half of Daniel's face is under me... part of Daniel's top face is very blurred and dark and it's also covered." Re-place the phone hero so Daniel's whole face is visible and in front of nothing (not under Nik's shoulder), and the top of the screen is clean: no blurred, dark half-head under the TRANSFER WAR title. If the phone background crop is the blurred part, choose a cleaner crop of the same plate (CSS `object-position`/size only; no new pictures). Files: `tr2/slice-02-plate/plate.css` phone query (`@media (max-width: 760px) and (orientation: portrait)`) and the phone art rules. Keep the clock at the right of the WINDOW OPEN band (fixed in c136a52a). Target: both faces clear and sharp, Daniel left, Nik right, at all three phone sizes and frames F1-F4.
A5. **Rivalry Statistics desktop: the lighting is too bright.** "The lighting is very bad... so bright and it doesn't look right." The whole desktop scene reads washed out: a hazy gold glow over the stadium and the panels, low contrast, unlike Career Statistics, which looks right. Find what brightens it (a light/rim layer, a glow or haze overlay, panel backgrounds that are too see-through, or the plate's own exposure) and bring it to the same depth and contrast as `career-statistics/` at 1366x768: darker stadium, richer shadows, panels that read clearly. Files: `rivalry-statistics/rivalry-statistics.css` (desktop rules, the `.rv-rim` / `sd-stage__layer--light` rules near line 36) and `rivalry-statistics/index.html` only if a layer must go. Compare side by side with `career-statistics/index.html` and `project-documents/factory/mockups/MOCKUP_RIVALRY_STATISTICS.png`. Target: no washed-out haze at 1366x768, 1920x1080 and 1366x640, faces natural, numbers easy to read. Leave the phone version as it is unless it shows the same problem.

A6. **Career Statistics phone: the title covers the faces.** "Covering half of my face and also almost all of Daniel's hair." The CAREER STATISTICS wordmark (and the eyebrow line) sits on top of both heads. Move the managers down and/or the title up and smaller so both faces and Daniel's hair are fully clear of the title. Files: `career-statistics/career-statistics.css` phone query. Target: both faces and hair fully visible, the stat tiles and the bottom buttons still visible with no scroll at all three phone sizes.
A7. **Legacy phone (minor, only if quick).** Daniel stands small and off on his own while Nik is near the centre, so the pair looks unbalanced. Bring Daniel in a little so the two read as a pair (similar size, Daniel left, Nik right). Files: `legacy/legacy.css` phone query. Nik called this "not a huge issue": spend at most a few minutes.
A8. **Loading desktop (optional, last in Part A).** Nik: "it can have a little bit more golden theme, especially on desktop, more aligned with all the other screens; not a priority." If budget allows after A1-A7, warm the desktop Loading toward the gold look of the other screens (gold accents, gold light on the text side, darker warm background), CSS only. Keep the Reus photo and its credit line exactly as they are (OWNER-4).

### Part B: other leftovers (after Part A)

1. **Phone heroes on the other screens.** After A2-A4, render all 15 screens at 393x660 and fix any other screen where one manager covers the other's face or more than about a third of their upper body (check Rivalry Statistics and anything else; Standings was approved). Same rules: phone cutout CSS only, Daniel left, Nik right, phone fit still passing.
2. **Final Winner at 1366x640 and 375x553.** At 1366x640 the honours table loses its TOTAL TROPHIES row, DANIEL WINS touches the trophy crown, and the TERMINAL footer line crosses the trophy stem. At 375x553 the TERMINAL line touches the panel edge. Files: `final-winner/final-winner.css` (short-desktop and phone media queries). Target: nothing touches or is clipped at 1366x768, 1366x640, 393x660 and 375x553.
3. **Season Results.** At 375x553 the manager card header is clipped at the top of the entry panel. At 1366x640 the last scoring row was clipped before (check it). On phone there is an empty band under the input rows (check whether it is still there). File: `season-results/season-results.css`. Target: the full card header visible, no clipped rows, no large empty band.
4. **Short desktop (1366x640) title crops.** Some painted titles lose their top at 1366x640 (Transfer War at least; check every screen). Target: every title fully visible at 1366x640.
5. **Legacy.** At 375x553 the eyebrow touches the title. On phone the archive panel's right edge runs off the screen and the pager dots are missing. Files: `legacy/legacy.css`, `legacy/legacy.js` (phone layout only). Target: eyebrow 4 px or more above the title; the archive panel inside the screen; pager dots visible.
6. **Rule Book phone.** The PREVIEW DATA chip sits under the settings button (top right). File: `rule-book/rule-book.css` (phone query) or the chip's own rule. Target: the chip and the settings button do not overlap at all three phone sizes.
7. **Anything else a player would hit.** Render all 15 screens at all 6 sizes. Fix anything that overlaps, is clipped, is not tappable (touch targets 44 px or more on phone), or shows a console error. Ask yourself on each screen: "could Nik or Daniel press the wrong thing, miss a button, or fail to read a score here?" Fix those first.
(Notes and integration text — TRUTH.md files, the Loading Motion section, PACKAGE.md known gaps, the music note — are done by a separate GPT chat, C2W-006. Do not do them here.)

Known and accepted (do not spend money on these): the League, Club and VS brush wordmark pictures were never made, so those screens use a font stand-in (it needs a picture). The Final Winner status words (`TERMINAL · NO NEW SESSION ...`) are Team G's copy.

## Final automated check (must pass before the result file)

1. Render all 15 screens at all 6 sizes with `claude_qc.cjs`; every one prints "ok" (no page scroll).
2. No console errors on any screen and size (add a `page.on('console')` listener in a small Playwright script if needed).
3. `python3 visual-assets/v10_1/shared/tools/check_binding.py` passes (run it with `--help` first to see its arguments).
4. `showcase/APPROVAL.html` loads with 0 broken images and 0 broken links.
5. `git status` is clean and the branch is pushed.

## Result file (`project-documents/factory/handoffs/CC-008_RESULT.md`)

- One table: item (A1-A5, then B1-B7), what changed (file + rule), before/after measure, commit.
- Save a before and an after picture for every Part A item you changed in `project-documents/factory/evidence-claude-check/CC-008/` (`A1_before_393x660.jpg`, `A1_after_393x660.jpg`, ...; desktop size for A5) and link them in the table. Nik reviews these pictures.
- "Needs a picture" list (if any).
- "Not done" list with the exact reason (budget, or needs Team G).
- The final check results (the 5 lines above, each PASS or FAIL).
- Total cost and time.
End the session with one line: `CC-008 done: <N> items fixed, final check <PASS|FAIL>, result in project-documents/factory/handoffs/CC-008_RESULT.md`.

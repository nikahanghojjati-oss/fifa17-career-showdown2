# CC-008 · Claude Code cloud brief: final visual and UI polish of the Team V package

| Field | Value |
| --- | --- |
| Model | Opus 5.5, effort High |
| STOP_BUDGET | **$15 hard cap, about 60 minutes.** At $12 stop starting new items: commit what is done, run the final check, write the result file. At $15 stop. |
| Repository | `nikahanghojjati-oss/fifa17-career-showdown2` |
| Branch | `factory/v1-wtt5ye` only. Fetch with an explicit refspec: `git fetch origin +refs/heads/factory/v1-wtt5ye:refs/remotes/origin/factory/v1-wtt5ye`, then `git checkout -B factory/v1-wtt5ye origin/factory/v1-wtt5ye`. Push only to this branch. Never `main`, never force-push, never delete branches or files you did not create. Pull with `--rebase --autostash` before every push; on a rejected push, pull and push again (up to 4 times). |
| Result file | `project-documents/factory/handoffs/CC-008_RESULT.md` |
| Written by | Team V lead (Claude), 2026-10-04, after the factory board reached 238/238 |
| Billing | Nik's Claude Code cloud credit. Read narrowly: grep and `sed -n` ranges, never whole large files twice. |

## Why this session exists

All 238 factory jobs are done and checked. Nik (the owner) asked for one extra polish layer before the package goes to integration: **fix the visual bugs and UI issues that are still there, most of all anything that could get in the way of playing the game.** You are the last pass before integration, so fix things; don't write reports about them.

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

Do the items in this order. For each one: render before, fix, render after at every size the item names, then commit with a message that names the item number (`CC-008 item N: ...`).

1. **Phone heroes: one manager hides the other (Nik's own review).** On some phone screens one manager is drawn over the other, so a face or most of a body is hidden. Nik saw it on more than one screen; the clearest one is Transfer War (Nik's shoulder covers Daniel). Render all 15 screens at 393x660 and find every one where either face is covered, or more than about a third of either upper body is behind the other manager. Fix them with the phone cutout layer CSS only (position, scale, `object-position`, z-order, a small gap between the two). Target: both faces fully visible and clear of each other, Daniel left, Nik right, the title still readable, and phone fit still passing at all three phone sizes. Screens to check first: Transfer War, League, Club Assignment, Career Statistics, Rivalry Statistics, Standings.
2. **Final Winner at 1366x640 and 375x553.** At 1366x640 the honours table loses its TOTAL TROPHIES row, DANIEL WINS touches the trophy crown, and the TERMINAL footer line crosses the trophy stem. At 375x553 the TERMINAL line touches the panel edge. Files: `final-winner/final-winner.css` (short-desktop and phone media queries). Target: nothing touches or is clipped at 1366x768, 1366x640, 393x660 and 375x553.
3. **Season Results.** At 375x553 the manager card header is clipped at the top of the entry panel. At 1366x640 the last scoring row was clipped before (check it). On phone there is an empty band under the input rows (check whether it is still there). File: `season-results/season-results.css`. Target: the full card header visible, no clipped rows, no large empty band.
4. **Short desktop (1366x640) title crops.** Some painted titles lose their top at 1366x640 (Transfer War at least; check every screen). Target: every title fully visible at 1366x640.
5. **Legacy.** At 375x553 the eyebrow touches the title. On phone the archive panel's right edge runs off the screen and the pager dots are missing. Files: `legacy/legacy.css`, `legacy/legacy.js` (phone layout only). Target: eyebrow 4 px or more above the title; the archive panel inside the screen; pager dots visible.
6. **Rule Book phone.** The PREVIEW DATA chip sits under the settings button (top right). File: `rule-book/rule-book.css` (phone query) or the chip's own rule. Target: the chip and the settings button do not overlap at all three phone sizes.
7. **Anything else a player would hit.** Render all 15 screens at all 6 sizes. Fix anything that overlaps, is clipped, is not tappable (touch targets 44 px or more on phone), or shows a console error. Ask yourself on each screen: "could Nik or Daniel press the wrong thing, miss a button, or fail to read a score here?" Fix those first.
8. **Missing notes (text only, last).** Write a short `TRUTH.md` for `home/`, `league/` and `club/` in the same shape as `visual-assets/v10_1/legacy/TRUTH.md` (what the screen must show, from PRODUCT_TRUTH). Add a "Motion" section to `visual-assets/v10_1/loading/BUILD_RESULT.md` measured from the running page (entrance total, first usable point, stagger, easing, reduced-motion path), as `project-documents/factory/reviews/MOTION_PASS.md` fix item 1 asks. Update the "Known gaps" list at the end of `project-documents/factory/PACKAGE.md` so it is true after your session (it was written before jobs 108-110 finished).
9. **Music across screens (integration note only).** The Home Audius player works on Home. The visual pack is separate HTML pages, so music stops when a page changes. Do **not** build a page-shell here. Add one short "Music" paragraph to `project-documents/factory/HANDOFF_TO_SOL.md` and to PACKAGE.md: at integration, the Home soundtrack (`home/soundtrack.js`, 4 Audius tracks, ids in `home/fixtures.json` `strings.media`) must keep playing across screens; main's 6 YouTube songs and the FIFA 17 trailer are not carried over (owner's decision, 04 Oct 2026).

Known and accepted (do not spend money on these): the League, Club and VS brush wordmark pictures were never made, so those screens use a font stand-in (it needs a picture). The Final Winner status words (`TERMINAL · NO NEW SESSION ...`) are Team G's copy.

## Final automated check (must pass before the result file)

1. Render all 15 screens at all 6 sizes with `claude_qc.cjs`; every one prints "ok" (no page scroll).
2. No console errors on any screen and size (add a `page.on('console')` listener in a small Playwright script if needed).
3. `python3 visual-assets/v10_1/shared/tools/check_binding.py` passes (run it with `--help` first to see its arguments).
4. `showcase/APPROVAL.html` loads with 0 broken images and 0 broken links.
5. `git status` is clean and the branch is pushed.

## Result file (`project-documents/factory/handoffs/CC-008_RESULT.md`)

- One table: item, what changed (file + rule), before/after measure, commit.
- "Needs a picture" list (if any).
- "Not done" list with the exact reason (budget, or needs Team G).
- The final check results (the 5 lines above, each PASS or FAIL).
- Total cost and time.
End the session with one line: `CC-008 done: <N> items fixed, final check <PASS|FAIL>, result in project-documents/factory/handoffs/CC-008_RESULT.md`.

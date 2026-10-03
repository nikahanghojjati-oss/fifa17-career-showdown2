# League Review · JOB-040

## Verdict

## Scorecard

| Criterion | Score | Evidence |
| --- | ---: | --- |
| 1 · Mockup fidelity | 4 | The source comparison keeps the 1536 × 864 plate, wheel center/radius, manager placement and button-row height close to GOAL_LEAGUE.jpg, but the narrower fallback title and different desktop chrome are visible fidelity misses. |
| 2 · Characters stand out of the menu | 4 | JOB-037's Claude intake says the 1366 × 768 render is clean with no seams, while the plate/overlay stack keeps the managers in the stadium scene; no fresh review screenshot exists to justify a 5. |
| 3 · Hands and contact | 4 | Claude's JOB-037 intake confirms Daniel's fingertip touches the wheel rim and reports no seams; Nik's chin-on-hand pose remains the untouched plate pose, but this review has no independent zoom image to justify a perfect score. |
| 4 · Lighting and grade | 4 | The build preserves the reference plate's gold stadium lighting and uses gold/dark-glass UI treatment; source evidence shows no conflicting light system, but this review lacks a fresh graded screenshot for a 5. |
| 5 · Typography and title treatment | 3 | The code still uses a 64 px Kaushan Script `TODO-WORDMARK` fallback instead of the required gold brush wordmark image, making the title visibly cleaner and narrower than the mockup. |
| 6 · Panel craft | 4 | The live wheel geometry, slogan plates, dark-glass state strip and primary/secondary controls follow the premium treatment, but the slogan boxes are 12 px larger overall and the desktop button group does not match the reference proportions exactly. |
| 7 · Information clarity and honesty | 4 | The screen exposes one clear primary wheel action, BACK, truthful ready/spinning/selected/locked states and no invented stats; the desktop header still carries nonfinal chrome that adds avoidable hierarchy noise. |
| 9 · Phone composition | 4 | Source reading shows a dedicated 55svh portrait hero band, Daniel left/Nik right, a ≥240 px wheel, 44 px targets and safe-area-pinned primary action; Claude has not yet supplied the measured H5 phone render, so this cannot score 5. |
| 10 · Polish and finish | 3 | JOB-037 reports a clean desktop render, but the visible `TODO-WORDMARK` fallback and desktop top-bar mismatch leave obvious unfinished presentation details. |

Static-review average: **3.78 / 5** over criteria 1–7, 9 and 10. Pass line is ≥4.2 with no criterion below 3 and every hard gate PASS.

## Hard gates

| Gate | Result | Evidence |
| --- | --- | --- |
| H1 · Daniel left, Nik right, never mirrored | PASS | `index.html` and `league.css` keep Daniel at the left marker/30% phone anchor and Nik at the right marker/70% anchor; `league.js` never mirrors either manager. |
| H2 · Rights-safe imagery | PASS | Source audit finds no real club crests, real league logos, trophies, players or EA/FIFA art. League marks are applied by the original Showdown `applyLeagueMark` path; the scene contains only Daniel and Nik, who are allowed. |
| H3 · No live/private data baked into images | PASS | All changing league, selection, status, identity and season strings stay in live DOM/fixtures; image paths contain only environment, manager overlay and wheel-rim art. |
| H4 · Product truth | PASS | The screen exposes only real League-step controls and no invented statistics or editable score. Ready/spinning/selected/locked states are truthful. The desktop chrome still differs from the final shared top-bar requirement, but that does not introduce a fake League action/stat and is recorded as a fidelity/product-chrome fix candidate rather than an H4 violation. |
| H5 · Phone fit | NOT MEASURED (Claude measures) | No Claude numeric scroll-height/button-rect result exists in the carried Evidence. |
| H6 · Input size / contrast | NOT MEASURED (Claude measures) | No Claude contrast ratio or input-size measurement exists in the carried Evidence. |
| H7 · Reduced motion | NOT MEASURED (Claude measures) | No Claude reduced-motion run is recorded in the carried Evidence. |
| H8 · Keyboard / focus | NOT MEASURED (Claude measures) | No Claude tab-order/focus-ring run is recorded in the carried Evidence. |
| H9 · Console / failed requests | NOT MEASURED (Claude measures) | Job 37 says the 1366 × 768 render was clean, but there is no explicit Claude console/network measurement. |
| H10 · Mockup diff | NOT MEASURED (Claude measures) | Job 37 worker notes say H10 passed, but no Claude H10 scores are present and `scores.json` is absent. |
| H11 · First-paint weight | NOT MEASURED (Claude measures) | Job 39 records worker-side hero payload data, not a Claude first-paint network measurement. |


## Evidence

### Claude measurement carryover

Source checks:
- `project-documents/factory/status/JOB-037.md`: Claude check records that Daniel's fingertip touches the wheel rim, no seams were seen, and the 1366 × 768 render was clean. It does not provide numeric H5–H11 measurements.
- `project-documents/factory/status/JOB-039.md`: no Claude intake/check line and no Claude-measured H5–H11 values are present.
- `visual-assets/v10_1/league/evidence/QA_SUMMARY.md`: NOT PRESENT.
- `visual-assets/v10_1/league/evidence/scores.json`: NOT PRESENT.

Gate measurements:
- H5 phone fit / scroll per size: NOT MEASURED (Claude measures). No Claude numeric scroll-height/button-rect result exists in the sources above.
- H6 input size / contrast: NOT MEASURED (Claude measures). No Claude contrast ratio or input-size measurement exists in the sources above.
- H7 reduced motion: NOT MEASURED (Claude measures). No Claude reduced-motion run is recorded in the sources above.
- H8 keyboard / focus: NOT MEASURED (Claude measures). No Claude tab-order/focus-ring run is recorded in the sources above.
- H9 console / failed requests: NOT MEASURED (Claude measures). The Job 37 Claude note says the 1366 × 768 render was clean, but it does not state a console/network measurement.
- H10 mockup diff: NOT MEASURED (Claude measures). Job 37's worker notes say H10 passed, but no Claude H10 scores are recorded and `scores.json` is absent.
- H11 first-paint weight: NOT MEASURED (Claude measures). Job 39 records a worker-side hero payload figure, not a Claude first-paint network measurement.

### Mockup differences

Reference: project file `GOAL_LEAGUE.jpg`, 1536 × 864. Code values are from `index.html`, `league.css`, and the desktop placement logic in `league.js`; PRODUCT_TRUTH.md overrides the reference where noted.

- Title block — mockup: kicker sits near y≈98 px, a broad hand-painted `SELECT LEAGUE` wordmark spans roughly the central third of the screen, with `SPIN TO SELECT LEAGUE` directly below around y≈225 px; code: desktop kicker top is 86 px at 1536 × 864, the title is a 64 px Kaushan Script `TODO-WORDMARK` fallback, and the subtitle is positioned from the title line box. Wording matches, but the title is materially narrower/cleaner and lacks the mockup's rough brush silhouette.
- Top navigation panel — mockup: segmented black bar carries CM17, HOME, CAREER, STANDINGS, STATS, RULES, ABOUT, plus search/settings/profile controls on the right; code: `#topHeader` is a 56 px full-width gradient bar with CM17, CAREER MODE / SHOWDOWN // 17, SIGN IN, Season 1 / 5 and the script tag, with no nav tabs. PRODUCT_TRUTH requires HOME / CAREER / STANDINGS / STATS / RULES plus settings only, so both the mockup's ABOUT/search/profile controls and the current build's SIGN IN/season layout differ from final truth.
- Left slogan panel — mockup: dark outlined box around x≈40–283, y≈648–771 with `DIFFERENT LEAGUES / DIFFERENT STORIES / SAME PASSION`; code: same words and plate-registered zone, expanded by 6 px on every edge via `grow = 6`, so it is about 12 px larger in both dimensions.
- Right slogan panel — mockup: dark outlined box around x≈1253–1496, y≈648–771 with `WHERE RIVALS / CREATE LEGENDS`; code: same words and plate-registered zone, likewise expanded by 6 px per edge.
- Wheel panel — mockup: reflective blank gold orb centered at approximately (763, 495) with radius ≈233 px; code: live wheel uses `GOAL_WHEEL = { cx: 762.6, cy: 495.0, r: 233.3 }`, so the outer geometry matches, but its interior is a dark segmented five-league selector with original Showdown league marks, a gold selected wedge, hub and rim art. The interior difference is functional and permitted by PRODUCT_TRUTH; real league logos are not used.
- State-note panel — mockup: no status panel is visible; code: `#leagueStateNote` is hidden in the initial state but can appear as a centered dark-glass status strip above the buttons in other truthful wheel states. This is an intentional functional addition rather than a default-frame mismatch.
- Primary button — mockup: gold `SPIN WHEEL` button begins around x≈505, y≈746, about 285 × 58 px; code: `#spinLeague` is 300 × 56 px minimum and the desktop row is placed at y=743 px at 1536 × 864. Vertical registration is close, but the code button is roughly 15 px wider.
- Secondary button — mockup: dark `BACK` button begins around x≈800, y≈746, about 208 × 58 px with a narrow gap after the primary; code: `.backButton` is 200 × 56 px minimum with a fixed 16 px row gap. In the centered 516 px code row it lands farther right than the mockup's tighter two-button group.
- Daniel area — mockup: Daniel occupies the left side, with his pointing fingertip touching the wheel rim; code: the desktop scene uses the 1536 × 864 plate at 1:1 on the native reference size and registers `FINGER = { x: 532.5, y: 457.0 }` to a 3 px rim overlap. The manager side and contact geometry match; only the small dedicated finger overlay/contact treatment is added above the plate.
- Nik area — mockup: Nik occupies the right side, facing inward with hand at chin; code: the same plate-registered 1:1 desktop scene preserves Nik on the right with no mirroring or replacement layer in the desktop composition.
- Phone manager composition — mockup: no portrait-phone reference; code: PRODUCT_TRUTH intentionally replaces the desktop crop on phone with a portrait stadium plus dedicated Daniel-left/Nik-right cut-outs at 30%/70% and 56svh height. This is not scored as a desktop mockup mismatch.

### Code audit

DEFAULT: `visual-assets/v10_1/league/TRUTH.md`, named by JOB-040, is absent from the branch. The audit therefore uses binding `project-documents/factory/PRODUCT_TRUTH.md` already read in step 3, plus `fixtures.json`, `league.js`, and the HTML/CSS selectors already inspected in step 3.

- Manager order — PASS — `index.html .manager-marker--daniel/.manager-marker--nik` and phone hero classes keep Daniel left and Nik right; `league.css` places desktop markers at 25%/75% and phone heroes at 30%/70%. `league.js layoutDesktop/layoutPhone` never mirrors either manager.
- Invented stats — PASS — `fixtures.json` contains only league choices, chrome strings and wheel workflow states; `league.js applyFrame()` renders no career statistic or score.
- Real buttons — PASS with product-truth caveat — `index.html #spinLeague`, `.backButton` and `#onlinePlayerIdentityBadge` are the only buttons. Spin/back are wheel actions and the identity button is source-anchored to production `js/onlinePlayerIdentity.js`; however the current desktop header still differs from PRODUCT_TRUTH's final locked five-tab top bar, already recorded under Mockup differences.
- Workflow states — PASS — `fixtures.json frames.L1–L4` explicitly cover ready, spinning, selected and locked states; `league.js applyFrame()` applies selected text, disabled states and notes without exposing any rival/private input. History-style loading/empty/partial/unavailable states are not applicable to this fixed league-choice step.
- Fixture-driven changing words — PASS — `league.js applyFrame()` sets every state-changing label from `FX`: `.wheelItem` league names, `#selectedLeague`, `#spinLeague`, `#leagueStateNote`, `#onlinePlayerIdentityBadge` and `#seasonIndicator`. Static title/back/decorative copy remains DOM text and does not change by frame.
- Accessible names/status — PASS — `index.html #spinLeague`, `.backButton` and `#onlinePlayerIdentityBadge` have visible text names; `#selectedLeague` and `#leagueStateNote` use `role="status"`, `aria-live="polite"` and atomic status where appropriate; decorative scene layers are aria-hidden.
- Focus order — PASS by source reading — DOM order is identity button, primary wheel action, then BACK; phone CSS hides the entire header, removing the identity button from phone focus order. `league.css button:focus-visible` supplies a 2 px light-gold outline with 3 px offset.
- Phone touch targets — PASS by CSS reading — `league.css @media (max-width:760px) .menuButton,.backButton` sets `min-height:44px`; primary is 48 px and BACK is 44 px.
- Phone input size — PASS / N/A — League has no form inputs. The phone rule still sets `input, select, textarea { font-size: max(16px, 1em); }` if any are introduced.
- PNG master loading — PASS by source reading — `league.js main()` loads the desktop plate as `ENV_LEAGUE_PLATE_V1_1X.webp/2X.webp`; phone hero/background paths in `index.html` are WebP. The desktop `.finger-ovl` references derived transparent `OVL_DANIEL_FINGER_V1_1X/2X.png`, not a plate/master image.
- Live data in images — PASS by source reading — league names, selection/status labels, buttons, identity and season indicator remain live DOM text from fixtures; image filenames contain no scores, codes, guesses or other live/private values. Original league marks are applied at runtime by `applyLeagueMark`, not baked as real league logos.
- Missing truth sheet — NOTE — `visual-assets/v10_1/league/TRUTH.md` is absent. This does not create a product-truth contradiction because `PRODUCT_TRUTH.md` is binding and sufficient for this audit, but the missing per-screen file should be corrected in factory documentation if it was intended as a deliverable.

## Fix list

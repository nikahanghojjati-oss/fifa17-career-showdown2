# Season Results review · Job 79 · Part 1 of 4

## Verdict

## Scorecard

## Hard gates

| Gate | Result | Evidence |
| --- | --- | --- |
| H1 · Daniel left, Nik right, never mirrored | PASS | `fixtures.json :: frames.SR1..SR10.managerOrder` and `season-results.js :: init()` render Daniel first/left and Nik second/right; the mockup-difference audit also records exact registered face boxes with no mirroring. |
| H2 · Rights: no real crests, league logos, trophies, players or EA/FIFA art | PASS | The reviewed build replaces the mockup cup with `TRO_SHOWDOWN_CHAMPION_V1_512.webp`, replaces branded sportswear with the approved manager looks, and the renderer loads only the Showdown stage WebP plates; no prohibited player/EA asset is referenced. |
| H3 · No live or private data baked into images | PASS | `season-results.js` writes changing values into DOM text, inputs, checked states and data attributes; the only renderer image URLs are the fixed 1X/2X stage plates, and rival result records stay absent before `results-ready`. |
| H4 · Product truth: only real buttons/stats, computed score and correct scoring | FAIL | `fixtures.json` marks both managers as Champions League winners in SR4 and SR5; `season-results.js` leaves the unpublished Publish/Edit path and several Shared Season Commit states unreachable, hard-codes league bounds, and exposes `PREVIEW SCORE` before the TRUTH-authorized post-acknowledgement canonical scoring gate. |
| H5 · Phone fit / scroll at 393 × 660, 360 × 640; primary visible at 375 × 553 | NOT MEASURED (Claude measures) | `project-documents/factory/status/JOB-077.md`; `project-documents/factory/status/JOB-078.md`; `visual-assets/v10_1/season-results/evidence/QA_SUMMARY.md` does not exist |
| H6 · Inputs ≥ 16 px and body-text contrast ≥ 4.5:1 | NOT MEASURED (Claude measures) | `project-documents/factory/status/JOB-077.md`; `project-documents/factory/status/JOB-078.md`; `visual-assets/v10_1/season-results/evidence/QA_SUMMARY.md` does not exist |
| H7 · Reduced motion | NOT MEASURED (Claude measures) | `project-documents/factory/status/JOB-077.md`; `project-documents/factory/status/JOB-078.md`; `visual-assets/v10_1/season-results/evidence/QA_SUMMARY.md` does not exist |
| H8 · Keyboard reachability and visible focus ring | NOT MEASURED (Claude measures) | `project-documents/factory/status/JOB-077.md`; `project-documents/factory/status/JOB-078.md`; `visual-assets/v10_1/season-results/evidence/QA_SUMMARY.md` does not exist |
| H9 · Console errors / failed requests | NOT MEASURED (Claude measures) | `project-documents/factory/status/JOB-077.md`; `project-documents/factory/status/JOB-078.md`; `visual-assets/v10_1/season-results/evidence/QA_SUMMARY.md` does not exist |
| H10 · Mockup-diff faces / protected boxes / SSIM / ΔE | NOT MEASURED (Claude measures) | `visual-assets/v10_1/season-results/evidence/scores.json` does not exist; no H10 score appears in Claude intake notes in JOB-077 or JOB-078 |
| H11 · First-paint page weight | NOT MEASURED (Claude measures) | `project-documents/factory/status/JOB-077.md`; `project-documents/factory/status/JOB-078.md`; `visual-assets/v10_1/season-results/evidence/QA_SUMMARY.md` does not exist |

## Evidence

This part carries Claude measurements only. No browser QA, screenshots, mockup diff, or re-measurement was run in this review chat.

| Gate | Carried result | Source |
| --- | --- | --- |
| H5 · phone fit / scroll at 393 × 660, 360 × 640; primary visible at 375 × 553 | NOT MEASURED (Claude measures) | `project-documents/factory/status/JOB-077.md`; `project-documents/factory/status/JOB-078.md`; `visual-assets/v10_1/season-results/evidence/QA_SUMMARY.md` does not exist |
| H6 · inputs ≥ 16 px and body-text contrast ≥ 4.5:1 | NOT MEASURED (Claude measures) | `project-documents/factory/status/JOB-077.md`; `project-documents/factory/status/JOB-078.md`; `visual-assets/v10_1/season-results/evidence/QA_SUMMARY.md` does not exist |
| H7 · reduced motion | NOT MEASURED (Claude measures) | `project-documents/factory/status/JOB-077.md`; `project-documents/factory/status/JOB-078.md`; `visual-assets/v10_1/season-results/evidence/QA_SUMMARY.md` does not exist |
| H8 · keyboard reachability and visible focus ring | NOT MEASURED (Claude measures) | `project-documents/factory/status/JOB-077.md`; `project-documents/factory/status/JOB-078.md`; `visual-assets/v10_1/season-results/evidence/QA_SUMMARY.md` does not exist |
| H9 · console errors / failed requests | NOT MEASURED (Claude measures) | `project-documents/factory/status/JOB-077.md`; `project-documents/factory/status/JOB-078.md`; `visual-assets/v10_1/season-results/evidence/QA_SUMMARY.md` does not exist |
| H10 · mockup-diff faces / protected boxes / SSIM / ΔE | NOT MEASURED (Claude measures) | `visual-assets/v10_1/season-results/evidence/scores.json` does not exist; no H10 score appears in Claude intake notes in JOB-077 or JOB-078 |
| H11 · first-paint page weight | NOT MEASURED (Claude measures) | `project-documents/factory/status/JOB-077.md`; `project-documents/factory/status/JOB-078.md`; `visual-assets/v10_1/season-results/evidence/QA_SUMMARY.md` does not exist |

Claude intake context carried without promoting it to hard-gate evidence:
- `project-documents/factory/status/JOB-077.md`: Claude check PASS 4.2; intake notes say the final scoring row is clipped at 1366 × 640.
- `project-documents/factory/status/JOB-078.md`: Claude check PASS; intake notes record the phone hero composition and a generated phone title size of 64.8 KB. That asset size is not an H11 first-paint page-weight measurement.

### Mockup differences · Job 174 part 2

Evidence basis: direct reading of `MOCKUP_SEASON_RESULTS.jpg`, `TRUTH.md`, `index.html` and `season-results.css`. Percentages are of the 1536 × 864 desktop canvas. Where `@media (min-width: 1024px)` overrides a measured base value, the final desktop value is reported.

| Element | Mockup value | Code / product-truth value | Difference |
| --- | --- | --- | --- |
| Shared top bar | Black FIFA-style wedge begins below the very top, includes HOME / CAREER / STANDINGS / STATS / RULES / ABOUT plus separate search, gear and profile controls; HOME looks active. | `.season-topbar` is a full-width bar at `top: 0`, `height: 52px`; product truth allows only HOME / CAREER / STANDINGS / STATS / RULES plus settings, and the Season Results bar is locked. | Shape/vertical placement differ; ABOUT, search and profile are intentionally dropped, and the apparent active HOME state is intentionally replaced by locked controls. |
| Eyebrow | Measured top ≈ 10.9%; text `CAREER MODE SHOWDOWN 17`. | Base measurement is 10.9%, but final desktop CSS overrides to `top: 9.2%`; wording is identical. | Eyebrow is 1.7 percentage points higher than the mockup. |
| Brush title | Measured crop `left: 27.99%`, `top: 16.78%`, `width: 43.49%`; visual words `SEASON RESULTS`. | Final desktop CSS uses `left: 30%`, `top: 12.3%`, `width: 40%`; the image remains decorative `SEASON RESULTS` and the semantic heading is live DOM. | Title moves 2.01 points right, 4.48 points up and is 3.49 points narrower. Product truth also requires the live semantic heading to carry the season-specific shared-results wording rather than baking a season number into art. |
| Tagline | Measured top ≈ 27.7%; `TWO MANAGERS • ONE LEGACY`. | Final desktop CSS uses `top: 25.4%`; wording is the same. | Tagline is 2.3 points higher. |
| Central scoring panel frame | Measured `left: 27.73%`, `top: 31.60%`, `width: 44.47%`, `height: 19.44%`. | CSS keeps left/width but uses `top: 29.05%`, `height: 22.22%`. | Panel is 2.55 points higher and 2.78 points taller than the mockup. |
| Scoring-panel trophy | Large gold competition-style cup. | `index.html` uses original Showdown asset `TRO_SHOWDOWN_CHAMPION_V1_512.webp`. | Asset intentionally differs because product truth forbids real competition trophies. |
| Scoring-panel visible copy | Rules include parenthetical shared-bonus notes beneath the 100-points/goals and scorer/assist rows. | Visible `.scoring-grid` keeps the six product-true rows and values but omits the two parenthetical notes; live rules text remains a separate DOM source. | Hierarchy and numbers match, but two explanatory note lines are absent from the visible desktop grid. |
| Daniel manager area | Daniel is staged left; measured face box is `[182, 88, 389, 365]` = `left 11.848958%`, `top 10.185185%`, `width 13.476563%`, `height 32.060185%`. Mockup wardrobe is branded football kit. | `.manager-area--daniel` uses exactly those percentages; full-canvas depth/rim overlays stay at `inset: 0` with no mirroring or independent scaling. Product truth replaces the sports kit with Daniel's charcoal pinstripe suit/open white shirt and removes brand marks. | Position/scale match the measured mockup; wardrobe is intentionally different for rights/product truth. |
| Nik manager area | Nik is staged right; measured face box is `[1118, 88, 1338, 355]` = `left 72.786458%`, `top 10.185185%`, `width 14.322917%`, `height 30.902778%`. Mockup wardrobe is sportswear with `17`. | `.manager-area--nik` uses exactly those percentages; full-canvas overlays preserve registration. Product truth requires dark suit, black shirt/tie and wristwatch, with no shirt number/brand marks. | Position/scale match; wardrobe is intentionally different for rights/product truth. |
| Daniel entry panel frame | Measured `left: 13.67%`, `top: 52.66%`, `width: 35.74%`, `height: 31.94%`. | CSS uses `left: 19.14%`, `top: 52.66%`, `width: 30.27%`; desktop override changes fixed height to `height: auto; min-height: 31.94%`. | Daniel card shifts 5.47 points right and is 5.47 points narrower; its height can grow beyond the mockup instead of staying fixed. |
| Nik entry panel frame | Measured `left: 50.72%`, `top: 52.66%`, `width: 35.55%`, `height: 31.94%`. | CSS keeps `left: 50.72%`, `top: 52.66%`, `width: 35.55%`; desktop override uses `height: auto; min-height: 31.94%`. | Horizontal placement matches; height is no longer fixed and may exceed the mockup. |
| Entry-card instruction/state | Both mockup cards say `ENTER YOUR SEASON RESULTS` and expose both managers' values/checkboxes at once. | Static HTML provides empty Daniel/Nik shells for live DOM content. TRUTH requires the private instruction `Enter only {managerName}'s FIFA 17 season result...`; in entering state only the viewer's inputs are live and the rival is sealed, with both full cards visible only from `results-ready`. | Words and simultaneous dual-entry state intentionally differ for privacy. |
| League Position / Points / Goals controls | Mockup depicts all three as dropdowns. | Product truth requires number inputs with numeric input mode and contract bounds. | Control type intentionally differs; dropdown affordances must not be copied. |
| Achievement controls | Domestic Cup, Champions League, Top Scorer and Top Assist are checkboxes. | CSS/Truth retain checkbox treatment and live boolean fields. | No material control-type difference; live state replaces the mockup's baked ticks. |
| Season-score strips | Mockup displays Daniel `9` and Nik `1` during entry. | Product truth says the score is computed, never typed; Daniel's shown facts total 10, not 9, and authoritative canonical totals are shown only after commit acknowledgement and scoring reconciliation. | Daniel's mockup number is mathematically wrong, and both scores are shown at the wrong lifecycle moment in the mockup. |
| Review/status panel | No separate review/waiting/results-ready panel exists in the mockup. | `#seasonReviewPanel` is a real state panel at `left: 31.5%`, `top: 71.4%`, `width: 37%`, minimum 86px; committed state moves to `top: 66.8%` with minimum 132px. | Additional product-required panel has no mockup counterpart and changes the lower-center composition in non-entry states. |
| Canonical scoring panel | Mockup exposes season scores directly in the two manager cards. | `#sharedCanonicalScoringPanel` exists inside the review shell and is hidden until authoritative `SCORING_RECONCILED`. | Product-required canonical scoring timing and placement differ from mockup. |
| Action row geometry | Measured base row is `left: 28.65%`, `top: 86.23%`, `width: 42.64%`, minimum height `6.83%`. | Final desktop override moves the row to `top: 88%` (and `88.5%` on short desktop); left/width remain measured values. | Action row is 1.77 points lower on normal desktop and 2.27 points lower on short desktop. |
| `#completeSeason` primary button | Gold `REVIEW SEASON` with trophy icon and right chevron. | TRUTH exact action label is `REVIEW MY SEASON RESULT`; no trophy icon is permitted. The HTML button starts unlabeled for runtime state text. | Label differs by product truth; trophy icon is intentionally dropped. |
| `#confirmSeasonCompletion` | No mockup counterpart. | Hidden state button whose shared action is `PUBLISH MY SEASON RESULT`. | Product workflow adds a publish action after review. |
| `#editSeasonResults` | No mockup counterpart. | Hidden state button with exact live label `EDIT MY RESULT`. | Product workflow adds a draft-edit action. |
| `#sharedSeasonCommitAction` | No mockup counterpart. | Hidden state button with commit/check/retry/wait/acknowledgement labels from TRUTH. | Product workflow adds coordinator/commit states absent from the mockup. |
| Back button | `BACK TO SHOWDOWN HOME` with a left chevron. | `.backButton` is the shared smart-back control; exact wording is preserved by TRUTH. | Wording matches; behaviour is centralized/smart rather than a hard-wired mockup destination, and its row is lower because of the action-row override. |
| Top-bar navigation buttons | HOME / CAREER / STANDINGS / STATS / RULES / ABOUT, with HOME highlighted. | Runtime nav container is limited by product truth to HOME / CAREER / STANDINGS / STATS / RULES and locked on this gameplay screen. | ABOUT is removed and none of the tabs should present as freely actionable. |
| Settings button | Gear shown as a normal top-right mockup control. | `#season-settings` is explicitly `disabled aria-disabled="true"` with `Finish this step first`. | Same destination icon, different locked state. |
| Search/profile controls | Both are visible in the mockup. | Neither exists in the product bar. | Intentionally removed by product truth. |

Coverage note: the title block, top bar, central scoring panel, Daniel panel, Nik panel, review/canonical panels, all desktop action buttons, and both manager areas are covered above. Daniel remains left and Nik right; the registered face boxes are not mirrored.


### Code audit · Job 175 part 3

Evidence basis: direct reading of `TRUTH.md`, `fixtures.json` and `season-results.js`. This is a source audit only; the handbook forbids browser QA and screenshots in this worker chat, so CSS-only size gates remain explicitly unmeasured.

| Result | File and selector | Finding |
| --- | --- | --- |
| PASS | `fixtures.json :: frames.SR1..SR10.managerOrder`; `season-results.js :: init() -> renderManagerPanel("daniel"), renderManagerPanel("nik")` | Daniel is first/left and Nik second/right in every fixture frame and render call; sealed states do not reverse the manager order. |
| FAIL | `fixtures.json :: frames.SR4.managers.{daniel,nik}.championsLeague`; `frames.SR5.managers.{daniel,nik}.championsLeague` | Both managers are marked Champions League winners in the same season. Product truth allows only one manager to win that competition in a season, so these preview facts are impossible. |
| PASS | `fixtures.json :: frames.*.managers`; `season-results.js :: renderManagerPanel() numeric / achievements` | The build uses only recorded season facts: league position, points, goals, domestic cup, Champions League, top scorer and top assist; no clean sheets, player-stat totals or match-level statistics are invented. |
| PASS | `season-results.js :: renderActions() #completeSeason, #confirmSeasonCompletion, #editSeasonResults, #sharedSeasonCommitAction, .backButton` | Every rendered action maps to a real Season Results control in TRUTH.md; no extra action is invented. |
| FAIL | `fixtures.json :: frames.*.phase`; `season-results.js :: renderActions()`; `renderWorkflowState()` | No fixture represents the real unpublished review state. As a result `PUBLISH MY SEASON RESULT` is never rendered and the documented draft review heading/status/result are reached only when `frame.error` is present. |
| FAIL | `fixtures.json :: strings.buttons.{commitRetry,commit,waitCoordinator,acknowledge,acknowledgedWaiting}`; `season-results.js :: renderActions()` | The shared commit control covers only CHECK in `results-ready` and ACKNOWLEDGED in `committed`; retry, coordinator, commit, acknowledge and own-acknowledged waiting states exist in fixtures but are unreachable in the renderer. |
| PASS | `fixtures.json :: frames.SR7..SR10`; `season-results.js :: renderManagerPanel()`; `renderWorkflowState()` | Loading, empty, partial and unavailable states contain no manager result facts and hide both manager panels. The partial state uses the exact interim sentence `Current Showdown only. Career history is not yet available.`, so zero results are not fabricated. |
| FAIL | `season-results.js :: renderManagerPanel() .sealed-copy / .season-score-label`; `renderWorkflowState() #seasonReviewResult` | State-changing visible copy is hard-coded outside `fixtures.json`: `Waiting for …`, `CANONICAL SCORE`, `PREVIEW SCORE`, and `Authoritative scoring reconciled.` violate the fixture-string rule. |
| FAIL | `season-results.js :: renderManagerPanel() numeric` | Numeric bounds are hard-coded to position max 20 and points max 114 instead of using the truth-sheet `teamCount` / `maxPoints` contract values, so the renderer is not league-size-safe. |
| FAIL | `season-results.js :: renderManagerPanel() .season-score` | The renderer calculates and displays a non-authoritative `PREVIEW SCORE` before the committed/reconciled state, while TRUTH.md records that the inherited projected score is hidden and canonical scoring appears only after reconciliation. |
| PASS | `season-results.js :: renderManagerPanel() label[for] + input#p1*/#p2*` | Generated number and checkbox inputs receive associated text labels; number fields use `type="number"` and `inputMode="numeric"`, matching the accessible field contract. |
| NOT ESTABLISHED | `season-results.js :: renderTopbar() #season-settings` | This script sets only the settings control `title`; whether the icon has a stable accessible name depends on static markup outside the three files named for this audit. |
| PASS | `season-results.js :: renderManagerPanel()`; `init()`; `renderTopbar()` | Generated focus order is deterministic: Daniel panel before Nik, numeric fields before achievement checkboxes, and the rival/non-active fields plus locked top-bar buttons are disabled and therefore skipped by Tab. Full static action-row order is outside this step's named files. |
| NOT MEASURED | `season-results.js :: renderManagerPanel() input`; `renderActions() buttons` | 44 px phone target size and ≥16 px input font are CSS/layout measurements. They cannot be established from the named JS/fixture/truth files, and handbook rules prohibit browser measurement here; H5/H6 remain for Claude. |
| PASS | `season-results.js :: ShowdownStage.mount().plate`; `fixtures.json :: all strings/frames` | The only image URLs in the renderer are the 1X/2X WebP stage plates; no PNG master path is loaded by the audited code. |
| PASS | `season-results.js :: ShowdownStage.mount(); renderManagerPanel(); renderWorkflowState(); renderPreviewTag()` | Live/changing values are written into DOM text, input values, checked states and data attributes; no manager result, score, club value or workflow state is interpolated into an image URL. |

## Fix list

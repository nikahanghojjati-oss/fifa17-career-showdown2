# Career Statistics · desktop build result

Job: JOB-062  
Branch target: `factory/v1-wtt5ye`  
Factory base observed during finish: `b9dc577cbf8fd4c0b5a436911330e1d7f6227b1f`

## Run

From the repository root:

```bash
python3 -m http.server 8765
```

Open:

```text
http://127.0.0.1:8765/visual-assets/v10_1/career-statistics/index.html?frame=CS1
```

Use `CS1` through `CS6` for the fixture states. Add `&grid=1` for the registration overlay. `preview.html` is the owner review launcher for the six frames.

## Frames

| Frame | Contract state | Build treatment |
| --- | --- | --- |
| CS1 | ready | Full four-tile summary, Career Table, six-row manager comparison, four manager-leader cards and all three actions. |
| CS2 | empty | Honest new-career panel; no zero-filled career records are presented as facts. |
| CS3 | partial | Readable aggregates remain visible with `PARTIAL CAREER HISTORY` and `3 of 4 Showdowns readable`. |
| CS4 | unavailable | Unavailable panel; no numeric career facts are fabricated. |
| CS5 | loading | Loading panel; no fake totals. |
| CS6 | ready, Nik leads | Daniel remains the first/left presentation row while the rank cell correctly shows Daniel #2 and Nik #1. |

Every frame carries the visible `Preview data` chip because these are fictional factory fixtures.

## Mockup reconciliation

The build keeps the mockup's large centred title, four headline tiles, Career Table / Manager Comparison middle band, Career Leaders row and three-button action row. The registered plate keeps Daniel on the left and Nik on the right. The approved Career Statistics wordmark image is used instead of font-rendering the title.

Product truth intentionally changes the mockup in these places: `EUROPEAN WINS` becomes `CHAMPIONS LEAGUE WINS`; clean sheets, single-match biggest win, win percentage, player leader cards and the mockup Career Hub sub-navigation are removed; headline values that are manager-specific show Daniel then Nik rather than one ambiguous combined figure; the Career Table uses `#`, `Manager`, `Showdowns`, `Season W-D-L`, `Points`, `Trophies`; leaders are managers and use plate portrait crops, never players.

## Depth and art

`OVL_CS_DANIEL_CROSSED_ARMS_V1_*` was cut from the registered plate using the `cutouts.daniel_crossed_arms` platemap contour. The 1X/2X PNG masters, runtime WebP layers and rim masks remain fully registered to the plate. Daniel's crossed forearm sits above the Career Table edge with a soft contact shadow. Nik's chin hand stays clear of all panels. No manager art is mirrored.

The four headline objects are either original vector UI art or the factory's original Showdown Champion trophy asset. No real club crest, league logo, trophy or player image is introduced.

## Desktop QA

`factory-qa.cjs` was run for CS1–CS6 at 1366×768, 1440×900, 1920×1080 and 1366×640. The sandbox blocks localhost/file navigation, so the shared contract was executed through its local set-content/data-URI adapter using the same screen DOM/CSS/JS and asset bytes. `evidence/qa/QA_SUMMARY.md` and `qa_report.json` contain the measurements.

Results: all 24 desktop captures PASS Daniel-left/Nik-right, no-scroll, control bounds, input-size gate, keyboard focus and console/request checks. Reduced motion reports 0 running animations after 300 ms.

The 1920×1080 mockup-diff gate PASSes:

| Measurement | Result | Gate |
| --- | ---: | ---: |
| Face protected-box minimum SSIM | 0.9381 | ≥ 0.90 |
| Other protected-box minimum SSIM | 0.8649 | ≥ 0.75 |
| Build SSIM | 0.5965 | ≥ 0.4461 |
| Build mean ΔE | 9.68 | ≤ 18.63 |

Evidence is in `evidence/mockup_diff/` (`scores.json`, `heatmap.png`, `side_by_side.png`).

Conservative desktop first-paint estimate: 642,050 bytes, under the 900 KB limit. Runtime art uses WebP; PNG files are retained only as masters/evidence and are not referenced by first paint.

## Own scorecard

| Criterion | Score | Evidence |
| --- | ---: | --- |
| 1. Mockup fidelity | 4/5 | Plate registration is centred and the title, four tiles, two middle panels, leaders and action row track the mockup/plat​​emap; mockup-diff passes all numeric floors. |
| 2. Characters stand out of the menu | 4/5 | Daniel's forearm is a registered foreground cutout with rim/contact treatment; both protected faces remain above 0.93 SSIM and UI does not cover faces. |
| 3. Hands and contact | 4/5 | Daniel's original hand pixels stay in the overlay and cross the Career Table edge; Nik's chin hand remains unobstructed; protected-hand SSIM floor is 0.8649. |
| 4. Lighting and grade | 4/5 | Gold/black grade, warm edge treatment, glass panels and scene-aligned light preserve the mockup's stadium hierarchy without flat grey cover boxes. |
| 5. Typography and title treatment | 5/5 | Approved transparent title wordmark is used with hidden semantic text; UI uses condensed/tabular data typography and the shared eyebrow/tagline system. |
| 6. Panel craft | 4/5 | Gold-edge dark-glass panels align to mapped regions; one primary gold action; table rows, comparison bars and leader cards are consistently gridded. |
| 7. Information clarity and honesty | 5/5 | Only contracted career fields render; empty, partial, unavailable and loading states are explicit; Daniel remains first/left even when Nik ranks #1. |
| 10. Polish and finish | 4/5 | 24 desktop QA captures pass, first paint is within budget, no console/request failures occur, and the screen uses the shared Showdown visual language. |

All required scored criteria are at least 4/5.

## Phone

JOB-063 recomposes the desktop screen for portrait phones at ≤760 px without duplicating career data. The phone uses the same live headline tiles, Career Table, Manager Comparison, Career Leaders, state panel and three product actions; only their composition changes.

### Composition

The portrait scene uses `ENV_CS_PHONE_V1.webp` as a cover background at 50% 36%. Daniel is the large left hero at left -3%, top 1%, height 61%; Nik is the large right hero at left 48%, top 0%, height 62%. Both positions come directly from `assets/phonemap.json`. The hero zone occupies the upper ~55%, the darkening gradient begins at 48%, and the brush Career Statistics wordmark remains between/above the two figures.

The phone data hub begins at 48% of the usable career screen on normal-height devices. The four live headline tiles become a 2 × 2 grid. TABLE, COMPARE and LEADERS are keyboard-focusable CSS-radio tabs; exactly one of the existing live desktop panels is shown at a time. Empty, unavailable and loading states hide the normal tabs and show the existing state panel instead. The partial-history banner remains visible as a compact strip.

The desktop top chrome, registered desktop plate and desktop Daniel crossed-arm overlay/rim/contact shadow are hidden in portrait. They are replaced by the portrait stadium and two full-figure phone cut-outs. No product control is removed: CURRENT RIVALRY STATISTICS and BACK TO MAIN MENU share the 44 px secondary row, while OPEN TROPHY ROOM occupies the full-width 46 px primary row below them.

### Controls and reserved navigation

All visible tab labels and action buttons are at least 44 px high. The hidden radio controls carry a 16 px font-size and visible focus treatment is projected onto their 44 px labels. There are no text-entry controls on Career Statistics, so a 300 px software keyboard cannot be invoked by this screen.

The phone `.careerScreen` ends above `--phone-nav = 56px + env(safe-area-inset-bottom)`. The 96 px action stack is pinned 6 px above that screen bottom, which keeps OPEN TROPHY ROOM entirely above the shared bottom-navigation reserve. The `.nav-reserve` placeholder occupies the required 56 px plus safe-area inset until job 125 supplies the shared bar.

### Height budget

Arithmetic is from the committed CSS only; Claude performs the real-browser H5 measurement at intake. The shared bottom bar reserve is 56 px plus any safe-area inset. Values below assume a zero extra safe-area inset, so a device inset is added to the reserve and removed from `.careerScreen` by the same amount without changing the internal fit model.

The phone hero art visually occupies 55% of `.careerScreen`, and the title is contained inside that hero band (94 px normally, 82 px at ≤600 px height). Those are overlay layers, so they are not added again to the vertical flow. Normal-height phones begin the data hub at 48% of `.careerScreen`; the 375 × 553 short-height rule begins it at 42% and uses a fixed 56 px headline band to preserve a useful active panel.

| Viewport | Nav reserve | Career screen | Top allocation to data start | Headlines | Tabs | Hub gaps | Active panel remainder | Gap to actions | Action stack | Bottom pad | Sum | Remaining |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 393 × 660 | 56.0 | 604.0 | 289.9 | 72.6 | 44 | 12 | 77.5 | 6 | 96 | 6 | 660.0 | 0.0 |
| 360 × 640 | 56.0 | 584.0 | 280.3 | 70.4 | 44 | 12 | 69.3 | 6 | 96 | 6 | 640.0 | 0.0 |
| 375 × 553 | 56.0 | 497.0 | 208.7 | 56.0 | 44 | 8 | 72.3 | 6 | 96 | 6 | 553.0 | 0.0 |

At 375 × 553 the primary occupies the lower 46 px of the 96 px action stack, whose bottom is 6 px above the end of `.careerScreen`; the entire action stack therefore remains above the 56 px reserved bottom bar and the primary is visible.

Larger phones grow the active panel rather than leaving the controls floating: at 390 × 844 the computed active panel is 159.8 px; at 430 × 932 it is 205.5 px. The hero/title remains anchored to the top composition while the hub's `minmax(0,1fr)` panel absorbs the extra height.

### Phone art and weight

Runtime phone art referenced by the HTML is WebP only:

| Asset | Phone use | Size / budget |
| --- | --- | ---: |
| `ENV_CS_PHONE_V1.webp` | Portrait stadium background | 142,870 bytes measured |
| `OVL_CS_DANIEL_PHONE_V1.webp` | Daniel left full-figure hero | ≤60,000 bytes budget |
| `OVL_CS_NIK_PHONE_V1.webp` | Nik right full-figure hero | ≤60,000 bytes budget |
| `TITLE_CS_V1.webp` | Brush title | 77,696 bytes measured |
| `TRO_SHOWDOWN_CHAMPION_V1_512.webp` | Primary-action trophy art | 43,896 bytes measured |

Planned image payload is ≤384,462 bytes. PNG masters are not referenced by phone runtime HTML or CSS. Claude must run the two existing `cutout.py --rim` commands in `tools/MAKE_ASSETS.md` if either phone hero WebP is absent, then perform the required 400% edge check and real-browser H5/H6/H7/H8/H9/H11 measurements.

## Fix round

Source: review fix list (REVIEW.md, JOB-149), 6 items.

- Done: 1 headline numbers fit their tile (container-query size; first attempt as written clipped at 1366, so the lead changed it), 2 Daniel bar colour #3da5e0, 3 tagline full stops, 4 leader chevrons, 5 action row 83.6% / 6.4%, 6 Back text from fixtures.
- Blocked: none. Job 151 had no items (list has 6).
- Claude must re-measure: H5-H11 (phone fit at 393x660, 360x640, 375x553; contrast; reduced motion; keyboard; console and requests; first-paint weight), mockup diff of the tiles and action row.

## Motion

Shared kit: `data-sd-enter` on the title, tiles, three panels and OPEN TROPHY ROOM; `sdEnter(stage)` runs once after the first render and fonts. Transform and opacity only.

| Element | Delay | Duration | Easing |
| --- | --- | --- | --- |
| Brush title wipe | 250 ms | 450 ms | shared ease-out |
| Headline tiles (4) | 400 ms, 60 ms stagger | 16 px rise + fade | shared ease-out |
| Table, Comparison, Leaders panels | after the tiles, 60 ms stagger (kit caps at 6) | same | same |
| Headline count-up | 450 ms | 500 ms | kit `sdCountUp` |
| Comparison bars grow from centre | 650 ms | 450 ms | cubic-bezier(.22,1,.36,1) |
| Leader row gold sweep | 700 ms | 520 ms | ease-out |
| Rank crown pop (0.6 to 1.14 to 1) | 820 ms | 320 ms | cubic-bezier(.34,1.56,.64,1) |
| OPEN TROPHY ROOM pulse | after panels begin | kit pulse | kit |
| Hover and press on buttons, tab colour | 0 | 100 ms | ease-out / linear |

Everything ends by about 1.15 s; the screen is usable at 0.6 s. Reduced motion (system block and `html[data-motion-reduced]` / `[data-reduced-motion]`): kit fade only, bar grow, sweep, crown pop and transitions off, no count-up.

Criterion 8 self-score: 4. Evidence: shared entrance order, three screen-specific moments inside the budget, no layout properties animated. Claude records frame strips at intake.

Phone layout fix (job 66): the shared stage pushed the UI layer down on phone; `.scene.sd-stage[data-sd-mode="phone"] .sd-stage__layer--ui { top: 0 }` and `top: auto` on the phone action row restore the full composition.

## Known gaps

Final phone recomposition is intentionally left to the dedicated Career Statistics phone job. This desktop build includes the required `nav-reserve` placeholder without attempting to replace the shared bottom navigation. Motion choreography is also left to the later motion job.

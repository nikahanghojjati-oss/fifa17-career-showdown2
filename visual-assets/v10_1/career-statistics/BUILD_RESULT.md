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

### Height budget

Arithmetic is from the committed CSS only; Claude performs the real-browser H5 measurement at intake. The shared bottom bar reserve is 56 px plus any safe-area inset. Values below assume a zero extra safe-area inset, so a device inset is added to the reserve and removed from `.careerScreen` by the same amount without changing the internal sum.

The phone hero art visually occupies 55% of `.careerScreen`, and the title is contained inside that hero band (94 px normally, 82 px at ≤600 px height). Those are overlay layers, so they are not added again to the vertical flow. Normal-height phones begin the data hub at 48% of `.careerScreen`; the 375 × 553 short-height rule begins it at 42% to preserve a useful active panel.

| Viewport | Nav reserve | Career screen | Top allocation to data start | Headlines | Tabs | Hub gaps | Active panel remainder | Gap to actions | Action stack | Bottom pad | Sum | Remaining |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 393 × 660 | 56.0 | 604.0 | 289.9 | 72.6 | 44 | 12 | 77.5 | 6 | 96 | 6 | 660.0 | 0.0 |
| 360 × 640 | 56.0 | 584.0 | 280.3 | 70.4 | 44 | 12 | 69.3 | 6 | 96 | 6 | 640.0 | 0.0 |
| 375 × 553 | 56.0 | 497.0 | 208.7 | 56.0 | 44 | 8 | 72.3 | 6 | 96 | 6 | 553.0 | 0.0 |

At 375 × 553 the primary occupies the lower 46 px of the 96 px action stack, whose bottom is 6 px above the end of `.careerScreen`; the entire action stack therefore remains above the 56 px reserved bottom bar and the primary is visible.

Larger phones grow the active panel rather than leaving the controls floating: at 390 × 844 the computed active panel is 159.8 px; at 430 × 932 it is 205.5 px. The hero/title remains anchored to the top composition while the hub's `minmax(0,1fr)` panel absorbs the extra height.

## Known gaps

Final phone recomposition is intentionally left to the dedicated Career Statistics phone job. This desktop build includes the required `nav-reserve` placeholder without attempting to replace the shared bottom navigation. Motion choreography is also left to the later motion job.

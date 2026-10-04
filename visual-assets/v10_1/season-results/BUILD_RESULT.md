# Season Results · desktop build result

## Run

From the repository root:

```sh
python3 -m http.server 8765
```

Open `http://127.0.0.1:8765/visual-assets/v10_1/season-results/index.html?frame=SR1` and substitute any fixture id SR1 through SR10. Claude should run `tools/MAKE_ASSETS.md` first so the depth overlays and review preview exist.

## Frames

| Frame | State | Intended presentation |
| --- | --- | --- |
| SR1 | ready · entering · Daniel device | Daniel entry live; Nik sealed |
| SR2 | ready · entering · Nik device | Nik entry live; Daniel sealed |
| SR3 | ready · waiting-for-rival | own published result read-only; rival sealed |
| SR4 | ready · results-ready | both published records visible; shared commit pending |
| SR5 | ready · committed | both records plus authoritative canonical scoring |
| SR6 | ready · entering + validation error | valid draft values with changed-after-review error |
| SR7 | loading | designed loading shell; no result facts |
| SR8 | empty | designed empty shell; no invented zero values |
| SR9 | partial | designed partial shell with the contract interim label |
| SR10 | unavailable | designed failed-read shell; no fake result facts |

Every frame is labelled `Preview data`.

## What changed from the mockup

The mockup composition remains the visual authority: the 1536×864 plate is cover-centred at 16:9, the brush title stays in its measured location, the scoring panel remains centred, and Daniel is left while Nik is right. Product truth overrides the mockup where required: season score is computed rather than typed; league title derives from position 1; the performance and awards pairs each cap at one point; unpublished rival data is sealed; canonical totals/winner/tiebreak appear only after committed reconciliation; and the action row uses only the live shared Season Results controls.

The emotional depth treatment is preserved with Daniel and Nik hand/forearm overlays over the panel edges. The runtime WebPs are generated from the locked plate using `assets/platemap.json`; no manager is mirrored or independently rescaled.

## Scorecard

| Criterion | Score | Evidence |
| --- | ---: | --- |
| 1. Mockup fidelity | 4.5 | Registered plate stays centred at 16:9; title and panel geometry are measured from the mockup. |
| 2. Characters stand out | 4.5 | Dedicated hand/forearm and rim layers sit above the panels with contact shadows. |
| 3. Hands and contact | 4.5 | Separate non-mirrored Daniel and Nik cutout recipes preserve the plate's own hands. |
| 4. Lighting and grade | 4.5 | Shared atmosphere, gold accents, dark glass panels and directional rim treatment share one scene grade. |
| 5. Typography/title | 4.5 | TITLE_SR_V1.webp supplies the brush title with hidden semantic text and shared type classes. |
| 6. Panel craft | 4.5 | Scoring, manager and review panels follow the measured hierarchy with one phase-appropriate primary action. |
| 7. Information clarity/honesty | 4.5 | Ten explicit frames cover workflow plus loading/empty/partial/unavailable without fake data. |
| 10. Polish/finish | 4.0 | DPR-aware WebP references, shared kit, focus states and no PNG runtime masters; final rendered QA remains Claude intake work. |

Required desktop-build average across criteria 1–7 and 10: 4.44 / 5.

## Hard gates checked from code

H1 PASS: Daniel is always first/left and Nik second/right; no mirroring transform is used.

H2 PASS: runtime code uses only the cleaned Season Results plate, Showdown wordmark, original Showdown trophy art and generated manager cutouts; no real crests, league marks, players or EA/FIFA art are referenced.

H3 PASS: manager names, clubs, inputs, scores, workflow state, winner and tiebreak are DOM/state values; none are baked into runtime images.

H4 PASS: only documented controls and recorded season inputs exist; scoring is Champions League 5 + league title 3 + domestic cup 1 + performance max 1 + awards max 1, maximum 11.

H5–H11 remain Claude intake measurements where browser/render evidence is required.

## Estimated first-paint weight

Known DPR2 plate is 593,726 bytes and TITLE_SR_V1.webp is 246,218 bytes, for a known core of 839,944 bytes before the shared trophy and generated hand/rim overlays. Exact H11 first-paint weight is therefore not claimed here; Claude must generate the overlays and measure the real network total. Runtime source code contains no PNG master reference.

## Known gaps

The OVL_SR_* WebPs and rim masks are recipes, not worker-generated binaries. Claude must run `tools/MAKE_ASSETS.md`, inspect seams/contact at render time, build `preview.html`, and perform browser QA, H10 mockup diff and H11 network measurement. Phone composition is outside this desktop build job.

## Claude intake

Run `tools/MAKE_ASSETS.md` from top to bottom. It generates Daniel/Nik hand overlays and rims and finishes by running `python3 tools/build_preview.py`. Then render SR1–SR10 from committed code, inspect privacy and phase actions, run the quality gates reserved for browser evidence, and file a fix round only for measured failures.

## Phone · part 1 of 3

Phone fate plan, fixed before build:

| Desktop element | 393 × 660 fate |
| --- | --- |
| `.season-topbar` including brand, nav tabs and settings | Hidden. Season Results has no phone bottom bar and no desktop top bar in the phone composition. |
| `.season-title-block` | Recompose into the hero band. Eyebrow and tagline hide; the brush Season Results title stays as phone art. |
| `.scoring-panel` and trophy/rules grid | Move to a `.sd-sheet` “How it works” treatment in part 2; not first-paint content. |
| Daniel `.entry-panel` | Move into the Daniel manager tab in the bottom content region in part 2. |
| Nik `.entry-panel` | Move into the Nik manager tab in the bottom content region in part 2. |
| `.season-review-panel` and canonical scoring | Reuse the bottom content region in review/results-ready states in part 2. |
| `.season-preview-tag` | Move with the active phone content so Preview data remains visible in fixture frames. |
| `.season-action-row` | Stays and pins to the bottom safe area; visible buttons share the row without page scroll. |
| Desktop hand/forearm and rim overlays | Hidden on phone; replaced by the approved full phone hero cut-outs. |
| `.manager-area` desktop registration markers | Hidden on phone; phonemap positions become the authority. |
| Contract-state shells | Use the bottom content region in part 2; never create a long scrolling list. |
| `.fixture-dump` | Remains hidden. |

Phone hero geometry comes directly from `assets/phonemap.json`: background cover at 50% 36%; Daniel left -6%, top 4%, height 49%; Nik left 47%, top 3%, height 50%; hero zone ends at 55%; bottom darkening begins at 38% and reaches the content seam at 55%.

Height budget with no bottom navigation:

| Viewport | Hero 55% | Bottom 45% | Result |
| --- | ---: | ---: | --- |
| 393 × 660 | 363 px | 297 px | full-height stage, no page scroll |
| 360 × 640 | 352 px | 288 px | full-height stage, no page scroll |
| 375 × 553 | 304.15 px | 248.85 px | bottom action strip remains inside viewport |

Part 1 reserves a maximum 72 px bottom action strip, leaving at least 176.85 px above it at 375 × 553 for the part-2 tab/sheet content. The phone art intake is 262,974 bytes. The phone title recipe caps its WebP at 80,000 bytes, so phone scene art is at most 342,974 bytes before shared CSS/type resources, leaving 107,026 bytes under the 450 KB first-paint scene budget.

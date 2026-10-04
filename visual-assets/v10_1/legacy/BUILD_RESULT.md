# Legacy (History) · BUILD_RESULT

## Run

From the repository root:

```sh
python3 -m http.server 8765
```

Open `http://127.0.0.1:8765/visual-assets/v10_1/legacy/index.html?frame=LG1`. Frames LG1 through LG9 are available.

After Claude generates the depth overlays from `tools/MAKE_ASSETS.md`, run `python3 tools/build_preview.py` from `visual-assets/v10_1/legacy` to create `preview.html`.

## Frames

| Frame | State | Purpose |
| --- | --- | --- |
| LG1 | ready | Eight completed Showdowns over two pages, selection, pagination, preview label. |
| LG2 | ready | Active Showdown plus completed history. |
| LG3 | ready | Abandoned status-only row plus completed history. |
| LG4 | empty | Designed empty state. |
| LG5 | ready | Current-Showdown-only interim state. |
| LG6 | unavailable | Designed unavailable state. |
| LG7 | loading | Designed loading state. |
| LG8 | partial | Readable rows plus unavailable row and coverage warning. |
| LG9 | ready | Completion-pending Showdown plus completed history. |

## Mockup changes

The build keeps the registered stadium plate, Daniel left, Nik right, the brush LEGACY title, the wide archive panel, side rail, card grid, pager and one primary action. Product truth changes the mockup where required: Daniel is always left; scores are Showdown points totals; real club/league marks are replaced with original Showdown DOM/CSS treatments; the rail is limited to LEGACY ARCHIVE, TROPHY ROOM and RECORDS; only VIEW SEASON HISTORY remains below the panel; dates and destructive/local-backup controls are removed; abandoned and unavailable records never invent a score.

## Scorecard

| Criterion | Score | Evidence |
| --- | ---: | --- |
| 1 Mockup fidelity | 4.4/5 | Centred cover stage and measured title/panel/card geometry follow the 1672×941 mockup. |
| 2 Characters stand out | 4.2/5 | Stage depth order is plate, live UI, registered foreground overlays, rim light, with contact shadows at the archive edge. |
| 3 Hands and contact | 4.2/5 | Daniel's chin hand stays untouched above the panel edge; the lower-figure contours do not cross the protected hand. |
| 4 Lighting and grade | 4.0/5 | Warm gold/black glass, shared atmosphere, directional rim variables and soft contact shadows. |
| 5 Typography/title | 4.5/5 | TITLE_LG_V1.webp remains visible; semantic LEGACY is hidden text; scores are tabular live DOM. |
| 6 Panel craft | 4.1/5 | One measured archive surface, aligned rail/grid, 12 px gaps, selected glow and one solid-gold primary action. |
| 7 Information clarity | 4.6/5 | Contracted totals, Daniel-left ordering and explicit honest states. |
| 10 Polish/finish | 4.0/5 | Shared kit, 1X/2X WebP plate, WebP title/runtime overlay references and visible focus treatment. |

## Estimated weight

Known first-paint art before generated transparent overlays is 322,046 bytes: 228,246 B for `ENV_LG_PLATE_V1_1X.webp` plus 93,800 B for `TITLE_LG_V1.webp`. Claude must measure the generated overlays and final H11 against the 900 KB desktop gate.

## Known gaps

The Daniel/Nik foreground and rim WebPs referenced by `index.html` are recipe outputs and do not exist until Claude runs `tools/MAKE_ASSETS.md`. H5 through H11 require browser rendering and were deliberately not run here. This job is desktop-authoritative; the phone bottom-nav reserve is only a placeholder for later responsive integration.

## Claude must make

Run `tools/MAKE_ASSETS.md`: generate both registered foreground overlays and rim masks, export their transparent WebPs, build `preview.html`, inspect the archive-edge silhouettes at 100%, 200% and 400%, then run H10 and the remaining factory QA/hard gates.


## Phone · JOB-073 part 1

### Phone fate plan

| Desktop element | 393 × 660 fate |
| --- | --- |
| Registered 16:9 stadium plate | Hidden at ≤900 px; replaced by `ENV_LG_PHONE_V1.webp` in a responsive `<picture>` with `object-position: 50% 36%`. |
| Desktop Daniel/Nik plate markers, foregrounds and rim layers | Hidden at ≤900 px; replaced by the approved large phone cut-outs. Daniel stays LEFT at `left:-6%; top:4%; height:49%`; Nik stays RIGHT at `left:47%; top:3%; height:50%`. |
| Desktop top bar, CM17 brand, five text tabs, Settings and slogan | Hidden on phone. Legacy is a hub, so `.nav-reserve` holds 56 px + safe-area space for job 125's shared bottom bar. |
| Eyebrow, brush LEGACY wordmark and tagline | Stay in the hero band with no backing box; wordmark remains image art with hidden semantic heading text. |
| Frame label / fixture debug DOM | Stay semantic/hidden; no visual phone budget. |
| Legacy archive panel | Stays, recomposed into the lower 45% above the shared-nav reserve. |
| LEGACY ARCHIVE / TROPHY ROOM / RECORDS side rail | Moves into three 44 px horizontal tabs. |
| Showdown card grid | Stays as live DOM inside the active archive tab and becomes a horizontal snap shelf; no vertical page scroll. |
| Preview tag | Stays as a compact live label above the archive surface. |
| Empty/loading/unavailable/partial state banner | Stays in the archive surface as compact live DOM; it replaces the shelf when the state requires it. |
| Pager | Stays as compact dots/controls below the shelf so existing pagination remains real. |
| VIEW SEASON HISTORY | Stays as the single primary action, pinned 12 px above the shared-nav reserve. |
| Season-history drawer | Moves into a `.sd-sheet` bottom sheet with its own internal overflow; opening it never creates page scroll. |
| Desktop archive-edge contact shadows | Replaced on phone by cut-out drop/contact shadows and a warm rim treatment at the hero/content seam. |
| `.nav-reserve` | Becomes visible at ≤900 px and reserves `56px + env(safe-area-inset-bottom)`. |

### Height budget

The hub viewport is split before the shared bottom bar. At 393 × 660, the reserve is 56 px, leaving 604 px usable: hero band 55% = 332 px and lower content 45% = 272 px. The lower band budgets 44 px tabs, a flexible 152 px archive/shelf region, 24 px pager/spacing, and a 48 px primary action with 4 px of residual breathing room. At 360 × 640 the same percentages leave 584 px usable (321 px hero / 263 px lower). At 375 × 553 they leave 497 px usable (273 px hero / 224 px lower), and the 48 px primary action remains pinned inside that usable area above the 56 px reserve.

Phone first-paint art by approved file sizes is 409,118 bytes: background 206,320 B + Daniel 54,334 B + Nik 54,664 B + brush title 93,800 B. This is below the 450 KB H11 phone cap before any non-art CSS/DOM payload; PNG masters are not referenced.


## Phone · JOB-163 part 2

Part 2 turns the part-1 phone assets into the final portrait interaction layout at <=760 px. The top remains a 55% face/title band with Daniel left and Nik right. The existing live destination buttons are visually recomposed as ARCHIVE / TROPHIES / RECORDS tabs, the existing archive grid becomes a horizontal snap shelf with one full card plus a 52-69 px next-card peek, and the existing pager renders compact page dots with 44 px touch targets. VIEW SEASON HISTORY stays the only primary action and remains pinned above the shared bottom-nav reserve. The existing season-history region remains the internal-scroll `.sd-sheet`; opening it does not create page scroll.

### Phone height budget

The root remains `100dvh` with `.nav-reserve = 56px + env(safe-area-inset-bottom)`. The arithmetic below uses a zero emulated safe-area inset; a real inset is already subtracted by `#legacy` before the same layout is applied.

| Viewport | Usable above nav | Archive top..bottom | Shelf row | Primary action |
| --- | ---: | ---: | ---: | ---: |
| 393 x 660 | 604 px | 310.2..532 = 221.8 px | 145.8 px | y 544..592, 12 px above usable bottom |
| 360 x 640 | 584 px | 299.2..512 = 212.8 px | 136.8 px | y 524..572, 12 px above usable bottom |
| 375 x 553 | 497 px | 255.35..429 = 173.65 px | 97.65 px | y 441..489, 8 px above usable bottom |

The shelf row is archive height minus 44 px tabs, 24 px pager and two 4 px grid gaps. At the target 393 x 660 size this yields a 145.8 px card area, matching the requested approximately 150 px card height. The short-height rule hides only club/footer detail to protect the 48 px action and preserve the no-page-scroll composition.

### Static verification

No browser or screenshot QA was run, per the factory handbook. Code arithmetic confirms that `html`, `body`, `#stage-root` and `#legacy` keep overflow hidden; the only phone scrolling surfaces are the horizontal card shelf and the season-history sheet's internal overflow. Daniel/Nik phone hero positions from JOB-073 are unchanged, so Daniel remains left and Nik right. This part adds no real logos, trophies, players or image-baked data.


## Phone · JOB-164 part 3

### Layout and control fate

The finished phone composition keeps the top 55% as the cinematic face/title band, with Daniel large on the left and Nik large on the right over the portrait stadium. The archive panel rises into the lower edge of that band so the screen reads as one staged game menu rather than two stacked website blocks. Below the band, the existing live DOM is reduced to three 44 px destination tabs, one sideways snap shelf, a compact pager and one 48 px primary action.

The desktop top bar and registered 16:9 depth layers are hidden at phone widths because the shared 56 px bottom navigation owns hub navigation there. The desktop side rail becomes ARCHIVE / TROPHIES / RECORDS tabs, while the card grid moves to a horizontal shelf so history stays reachable without vertical page scroll. VIEW SEASON HISTORY remains the only primary action and is pinned above the reserved bottom bar. The season-history region becomes an internal-scroll bottom sheet; page overflow stays hidden.

Every visible phone button has at least a 44 px target. The primary action is 48 px high. Defensive form styles inside the season-history sheet enforce 44 px control height and 16 px input text, and all controls touched here have a visible gold `:focus-visible` ring. The current authored screen has no fixed keyboard-dependent form flow in the page composition; any sheet input inherits those 16 px/44 px rules while the primary action stays outside the sheet and pinned above the shared navigation reserve.

### Assets used

Phone first paint uses only the existing WebP assets: `ENV_LG_PHONE_V1.webp`, `OVL_LG_DANIEL_PHONE_V1.webp`, `OVL_LG_NIK_PHONE_V1.webp` and `TITLE_LG_V1.webp`. Desktop registered layers are hidden on phone. No PNG master is loaded by `index.html`, and no live names, scores, fees, stats or other data are baked into these images.

### Height budget

Legacy is a hub screen, so phone layout is measured inside `#legacy`, whose height is `100dvh - (56px + env(safe-area-inset-bottom))`. The arithmetic below uses a zero emulated safe-area inset; a real inset is subtracted from the usable height before the same geometry is applied. The archive overlaps the 55% hero band by 22 px on normal phone heights and by 18 px on the short-height rule, so the overlap is not double-counted as extra height.

| Viewport | Viewport h | Nav reserve | Usable above nav | Hero band 55% | Archive panel | Tabs | Shelf row | Pager | Gaps | Primary action | Action bottom gap | Remaining below action | Result |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 393 × 660 | 660 | 56 | 604 | 332.2 | 221.8 | 44 | 145.8 | 24 | 8 | 48 | 12 | 0 | FIT |
| 360 × 640 | 640 | 56 | 584 | 321.2 | 212.8 | 44 | 136.8 | 24 | 8 | 48 | 12 | 0 | FIT |
| 375 × 553 | 553 | 56 | 497 | 273.35 | 173.65 | 44 | 97.65 | 24 | 8 | 48 | 8 | 0 | FIT |

The panel equation is `0.45 × usable height - 50px`; the shelf row is panel height minus 44 px tabs, 24 px pager and two 4 px gaps. The primary action sits at `usable height - action bottom gap - 48px`, so it is fully visible at 375 × 553. There is no page-scroll budget: all fixed vertical pieces fit inside the usable stage, the card shelf scrolls only horizontally, and the season-history sheet owns its own internal overflow.

For larger portrait phones the percentage-based hero and archive geometry grows with the usable stage instead of leaving the composition floating: at 390 × 844 the usable height is 788 px and the archive panel grows to 304.6 px; at 430 × 932 the usable height is 876 px and the archive panel grows to 344.2 px. The 48 px action remains pinned 12 px above the reserved bottom bar.


### Static check and Claude intake

Reading the committed HTML/CSS confirms Daniel remains left and Nik right in the phone hero band; `.nav-reserve` is present in the DOM and reserves `56px + env(safe-area-inset-bottom)`; page roots remain overflow-hidden; the card shelf is horizontal-only; and the season-history sheet owns its own overflow. The short-height rule preserves the 48 px action and hides only nonessential club/footer detail.

No new phone art is required from this job. Claude intake should render and measure H5/H6/H7/H8/H9/H10/H11, including real safe-area behaviour, focus order/contrast, reduced motion, requests and final phone weight. The existing desktop depth-overlay recipe in `tools/MAKE_ASSETS.md` remains separate from this phone pass.

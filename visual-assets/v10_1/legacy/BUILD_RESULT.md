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

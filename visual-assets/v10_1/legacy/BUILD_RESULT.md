# Legacy (History) · BUILD_RESULT

## Run

From the repository root:

```sh
python3 -m http.server 8765
```

Open:

```text
http://127.0.0.1:8765/visual-assets/v10_1/legacy/index.html?frame=LG1
```

Available fixture frames are LG1 through LG9.

After Claude generates the depth overlays from `tools/MAKE_ASSETS.md`, build the self-contained review page from `visual-assets/v10_1/legacy`:

```sh
python3 tools/build_preview.py
```

## Frames

| Frame | Contract state | What it proves |
| --- | --- | --- |
| LG1 | ready | Eight completed Showdowns over two pages, selected card, pagination, preview label. |
| LG2 | ready | Active Showdown plus readable completed history. |
| LG3 | ready | Abandoned status-only row plus completed history. |
| LG4 | empty | Designed new-career empty state. |
| LG5 | ready | Current-Showdown-only interim label with in-progress card. |
| LG6 | unavailable | Designed unavailable state. |
| LG7 | loading | Designed loading state. |
| LG8 | partial | Readable completed rows plus unavailable row and exact coverage warning. |
| LG9 | ready | Completion-pending current Showdown plus completed history. |

## What changed from the mockup and why

The cinematic composition follows MOCKUP_LEGACY_V2: centred stadium plate, Daniel left, Nik right, brush LEGACY title, one wide archive panel, left navigation rail, 4 × 2 card capacity, pager and one primary action.

Product truth overrides the mockup where required:

- Daniel is always left and Nik always right.
- Card score is contracted Showdown points total, Daniel minus Nik.
- Real club crests and league marks are replaced by original code-drawn Showdown treatments.
- The left rail contains only LEGACY ARCHIVE, TROPHY ROOM and RECORDS.
- TRANSFER HISTORY and CHALLENGE TRACKER are absent because they have no contracted route for this surface.
- VIEW SEASON HISTORY is the only Legacy-specific lower action.
- Export, delete and reset controls are absent.
- Completion dates are absent because History does not contract a completion-date field.
- Abandoned and unavailable entries are status-only and never invent a score.
- Empty, loading, partial and unavailable states use the exact fixture/product wording.

## Scorecard

| Criterion | Score | Evidence |
| --- | ---: | --- |
| 1. Mockup fidelity | 4.4 / 5 | Centred cover stage, measured title position, archive bounds, side rail, 4 × 2 capacity and primary action follow the 1672 × 941 mockup geometry; only product-truth changes diverge. |
| 2. Characters stand out | 4.2 / 5 | Plate → live UI → registered lower-figure overlays → directional rim plane, with contact shadows at the archive edge. |
| 3. Hands and contact | 4.2 / 5 | Daniel's chin hand remains untouched on the plate above the panel edge; cutout contours do not cross the protected hand. |
| 4. Lighting and grade | 4.0 / 5 | Warm gold/black glass, shared atmosphere, restrained gold borders, directional rims and soft contact shadows. |
| 5. Typography/title | 4.5 / 5 | TITLE_LG_V1.webp remains the visible brush title; semantic LEGACY is hidden text; fixture eyebrow/tagline and tabular scores stay DOM. |
| 6. Panel craft | 4.1 / 5 | One measured archive surface, aligned rail/grid, 12 px card gaps, one solid-gold primary and selected-card glow. |
| 7. Information clarity/honesty | 4.6 / 5 | Daniel/Nik ordering, contracted totals, exact state copy and no invented abandoned/unavailable values. |
| 10. Polish/finish | 4.0 / 5 | Shared kit, 1X/2X WebP plate, WebP title/runtime overlay references, visible focus states and no visible debug content. |

## Estimated weight

Known first-paint art before generated transparent overlays:

- `ENV_LG_PLATE_V1_1X.webp`: 228,246 bytes.
- `TITLE_LG_V1.webp`: 93,800 bytes.
- Known subtotal: 322,046 bytes.

The generated Daniel/Nik foreground and rim WebPs are not yet committed. Claude must measure final first paint after generating them. The desktop hard gate remains ≤ 900 KB.

## Known gaps

- The four foreground/rim runtime WebPs referenced by `index.html` are recipe outputs and do not exist until Claude runs `tools/MAKE_ASSETS.md`.
- H5–H11 require real rendering/measurement and were deliberately not run in this worker job.
- The build is desktop-authoritative. The `.nav-reserve` placeholder is present for the shared phone bottom bar, but phone composition belongs to the later responsive/final integration work.
- Original code-drawn crest and league treatments are intentionally generic on this isolated factory screen; no real marks are used.

## Claude must make/check

Run `tools/MAKE_ASSETS.md` from the repository root. It will:

1. Derive Daniel's registered foreground and rim masks from the approved 2X Legacy plate.
2. Derive Nik's registered foreground and rim masks from the approved 2X Legacy plate.
3. Export transparent runtime WebPs.
4. Build `preview.html`.

Then render the screen on a real server, inspect the archive-edge silhouettes at 100%, 200% and 400%, run H10 against the authoritative plate/protected regions, and run the remaining factory QA/hard gates.

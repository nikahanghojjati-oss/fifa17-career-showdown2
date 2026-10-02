# HOME-V1 · Rivalry Headquarters on the Home plate

Brief: `visual-assets/goals/CLOUD_BRIEF_HOME_V1_R3.md` (R3.4) on `claude-cloud/hlc-goals`, entered through `visual-assets/goals/CC-001_home-build.md`.
Owner change (Nik, relayed in session 2026-10-01 ~22:27Z): the **full Home tile set** overrides the brief's four-tile limit (see §Owner change).

| | |
| --- | --- |
| Model / effort | Effort High. The model is named in the session reply (session policy keeps model identifiers out of repository files). |
| Start / end | 2026-10-01 21:50:01Z → 22:50Z (about 60 min) |
| STOP_BUDGET | 45 min **exceeded by about 15 min**. At the 80 % mark (22:26Z) all gates were green on the four-tile build. The owner change arrived then and was carried through G1–G13 plus routing; no other scope was added. |
| Branch / base | `claude-cloud/home-v1`, cut by intake from `claude-cloud/transfer-tr2-plate-g@8fbda036c1d1f7910631964e982705d0f25290c0` (matches `assets/intake_report.md`) |
| Head | the commit that carries this file (`git log -1 claude-cloud/home-v1`). Checkpoint commit: `cab9ed9`. |
| SOURCE_DRIFT | none: `origin/main` = `2de237391e17c7de2c6deb606b102b68ee640212` = the approved anchor |
| Precondition | HLC intake PASS for Home (`assets/intake_report.md`); `assets/ENV_HOME_PLATE_V1_1X.webp` present. |

## Run
```
# from the REPO ROOT (the ../tr2 font paths must resolve)
python3 -m http.server 8765
# open http://127.0.0.1:8765/visual-assets/v10_1/home/index.html?frame=HM1   (HM2, HM3; S0 = plate only)
#   &grid=1  platemap overlay (zones cyan, protected boxes red + 8 px dashed, seam mends green)
#   &mends=0 seam mends off (evidence only)
NODE_PATH=$(npm root -g) node visual-assets/v10_1/home/tools/render-qa.cjs \
  http://127.0.0.1:8765/visual-assets/v10_1/home/ visual-assets/v10_1/home/evidence
cd visual-assets/v10_1/home && python3 tools/build_preview.py <commit>   # → preview.html (single file)
```
Phone layout: any portrait viewport up to 760 px wide. Same URL, same DOM.

## Frames
| Frame | State | Header | Primary (G4) |
| --- | --- | --- | --- |
| HM1 (Tier S) | signed out, no save | `SIGN IN` · `No Active Showdown` | `#newShowdown` (Continue disabled, 45 %) |
| HM2 | Nik, active save | `NIK` · `Season 2 / 3` | `#continueCareer`; New tile reads `JOIN DANIEL'S SHOWDOWN` |
| HM3 | Daniel, completed | `DANIEL` · `Showdown Complete` | `#continueCareer` = `VIEW COMPLETED SHOWDOWN` |
| S0 | plate only | none | none |

## Items (PRIORITY_ORDER)
| Item | Status | Notes |
| --- | --- | --- |
| H0 source check | DONE | `fixtures.json` = main@2de2373 strings + the Audius exception (default track `WHAT YOU GOT — Valentino Khan & NITTI`) + owner tile change + route table |
| H1 desktop stage + lockup | DONE | Wordmark from intake (`LOGO_CM17_WORDMARK_V1.webp`), ≈32 % width, capped before Daniel's face (+9 px). Header background opens over Nik's face box (like the goal's nav bar). Left scrim ends before the protected boxes. |
| H2 action tiles | DONE, **changed by owner**: six tiles, not four | Inline SVG icons redrawn from the goal: 17-shirt player, tactics clipboard, cup, rising bars, spiral notebook, disc case |
| H3 Audius card | DONE | Goal position at ≥1366×768; **the vinyl shrank 60 → 44 px to fit at 1366×768** (as the brief allows). On short desktops (1366×640) the card moves beside Nik's hand (+9 px), bottom-anchored over the tiles. |
| Checkpoint commit + push | DONE | `cab9ed9` |
| H4 phone | DONE | header 48 → face band → heading → soundtrack strip → tiles (see the handoff for the order change) |
| G gates | DONE | **33 shots, 0 failing** (`evidence/qa_report.json`) |
| C9 deliverables | DONE | this file, `evidence/`, `preview.html` (`tools/build_preview.py`), `CLAUDE_HOME-BUILD_HANDOFF_TO_SOL_2026-10-01.md` |

## QA (tools/render-qa.cjs → evidence/qa_report.json)
Viewports:
- HM1/HM2/HM3 on desktop at 1366×768, 1440×900, 1920×1080 and 1366×640;
- HM1/HM2/HM3 on phone at 360×640, 375×553, **393×660** (owner), 390×844 and 430×932, all at DPR 2;
- HM1 at 1366×768 DPR 2 and with `&grid=1`;
- S0 with mends off and on at 1366×768 and 1920×1080.

| Gate | Result |
| --- | --- |
| G1 strings | 0 missing, 0 extra in every frame/viewport (desktop and phone expectation lists in the harness; phone hides are listed in the handoff) |
| G2 ids/aria | all product ids exactly once; tile order = main; `#menuMusicStatus` role=status, aria-live=polite; chips aria-pressed; Continue disabled + aria-disabled in HM1 |
| G3 no scroll | html, body **and the fixed stage** never scroll; every visible control is fully in view (at all phone sizes, 375×553 included) |
| G4 primary | inside the viewport and hit-testable at every size, 375×553 and 1366×640 included |
| G5 clipping | 0 (text boxes, tiles, card, tile row) |
| G6 sizes | desktop controls ≥ 40 px; phone ≥ 44×44; smallest text 12 px; phone body copy ≥ 14 px |
| G7 contrast | brightest/darkest background pixel under each glyph box, text hidden. Text ≥ 4.99:1 (normal); control borders ≥ 3.5:1. The disabled Continue is exempt (inactive control). Local scrims were added first (lockup lines, heading block, script line, dock bed). |
| G8 faces/hands | smallest UI clearance: face_nik 9.0 px (header segments) desktop, 12.5 px phone; hand_daniel 8.0 px (phone 390×844, the HOME label); all others larger. Decorative layers inside a protected box: 0. Seam mends inside the 8 px margin (not the box): reported per shot. |
| G9 imagery | loaded: the plate 1X/2X webp, `LOGO_CM17_WORDMARK_V1.webp`, woff2 fonts, inline SVG; the brief's G9 grep on the folder = **0** hits (binaries and preview included) |
| G10 sides | Daniel's face/hand centre x < Nik's in every shot; loaded plate SHA-256 = intake report |
| G11 tab order | = visual reading order in every shot (header badge → chips → PLAY TRACK → tiles; disabled skipped) |
| G12 clean | 0 console errors, 0 failed requests |
| G13 chrome | header/footer boxes, fonts, colours, segments recorded per shot |
| ROUTE (owner) | each enabled tile emits exactly one `home:intent` naming its destination |

## Owner change: full tile set (Nik, 2026-10-01)
- **Tiles shown:**
  - `#continueCareer` (primary, gold);
  - `#newShowdown` (Start / Join);
  - `#legacyButton` (History · Legacy);
  - `#careerStatisticsButton` (Data · Statistics), carrying a visible gold **TROPHY ROOM** tag;
  - `#ruleBookButton`;
  - `#settingsButton`.

  Desktop: one row of six, as in Nik's mockup. Continue and Start/Join are 1.72× wider (their labels and state lines are longer). Phone: Continue + Start/Join on top, then a compact row of four.
- The r43 containment style (`#legacyButton`, `#careerStatisticsButton` `display:none`, injected by `js/onlinePlayerIdentity.js`) is **not applied in this prototype**. Production is untouched, so main still hides both tiles.
- **Routing (visual only, no data code):** each tile dispatches `home:intent` with its existing destination (`fixtures.json → routes`):
  - Legacy → `#legacy` (`js/legacy.js`);
  - Statistics → lazy module `careerStatistics` (`js/analytics.js`);
  - Trophy Room → through Statistics: `#careerStatisticsTrophyButton` (`js/statistics.js`) → `openTrophyRoom()` (`js/trophyRoom.js`).

### Destinations that still read LOCAL-ONLY data (do not show to players until moved onto the online data)
1. **Legacy** (`#legacyButton` → `#legacy`, `js/legacy.js`): `loadLegacyShowdowns()` + `loadSavedShowdown()` from `js/storage.js`, i.e. `localStorage` `careerModeShowdown.legacyShowdowns` and `careerModeShowdown.activeShowdown`.
2. **Statistics** (`#careerStatisticsButton` → `careerStatistics`, `js/analytics.js`): `loadLegacyShowdowns()` + `loadSavedShowdown()` + `currentShowdown`. Same localStorage keys.
3. **Trophy Room** (via `#careerStatisticsTrophyButton`, `js/trophyRoom.js`): `getLegacyStorageRevision()` (legacy localStorage) + `currentShowdown`.
4. Check, not confirmed local-only: **Continue Career**'s meta (`getSavedShowdownMenuMeta`, `js/menuExperience.js`) uses `currentShowdown` and falls back to `loadSavedShowdown()` (localStorage) when no online showdown is in memory.

Rule Book (static rules) and Settings (account/device) were not found to read showdown data.

## Seams: intake tone-match zones (owner instruction to cover them with UI layers)
Method:
- One plate-registered blur strip per zone edge (`.mend`, `plateToScreen`), trimmed so it never enters a protected box (+2 px).
- Two area mends: the left-column zones 3–5 (blur), and the top-right nav remnants, zones 1–2 (blur + darken to 0.72).
- The dock bed now starts above the dock zone's top edge (plate y 662), but never above Daniel's hand.
- The soundtrack card spans plate x 1060–1640, which covers zone 6's edges.
- The seam audit in `render-qa.cjs` measures the luminance step and any hairline ridge across every zone edge in the final render. It skips points under opaque UI or text glyphs. A seam is flagged at median step ≥ 7 or ridge ≥ 5 (8-bit luma).

Hidden (measured, plate only, 1366×768, mends off → on, ridge = hairline strength):
- zone 0 bottom hairline (plate y 79–81, x 0–968): ridge 14.8 → 2.2 (desktop). On phone 390×844 it is 3.8 in the final render.
- zone 3 bottom: 15.4 → 0.9 · zone 4 top/bottom/right: 16 / 12.3 / 35.9 → ≤ 1.6 · zone 5 top/right: 12 / 47.7 → ≤ 1.4.
- zone 6 bottom: 13.5 → under the card (not visible) · zones 7 and 8 (dock, footer): under the dock bed, tiles and footer, 0 flags in every UI frame.
- Nav-bar slivers at plate (1302–1309, 32–50) and (1515–1520, 70–82): blurred and darkened (area mend + edge strips).

**Historical pre-Job-31 seam notes (superseded by the Edges section below):**
1. **Top-right nav remnant, zones 1–2** (plate x 1305–1662, y 4–88), just under the header right of Nik's face. There is a soft darker patch whose lower edge reads at y 84–88: step 10–17 at 1366×768, 8–9 at 1920×1080.
2. **Zone 2 right edge at 1920×1080** (plate x 1662, y 50–80, the far top-right corner): step 45 over 6 samples. It is only visible on wide screens, where less of the header covers it.
3. **Left column, zones 4–5** (plate x 324–534, y 398–545, between the lockup and the heading, where the goal's loading bar was):
   - soft tone steps along x≈530 and y≈535–540 (step 9–11 at 1366×768, 19 on zone 5's right edge at 1920);
   - the blurred-crowd area meets the sharp edge of Daniel's sleeve there.
4. **Phone band ≥ 390 px wide:** a soft tone step along the zone 0 bottom (plate y 84, x 706–964, step 12.7, ridge 3.8). The hairline itself is gone.
5. **Zone 3 top (1920×1080 only,** plate x 584–596, y 118): step 10.3 over 3 samples, at the wordmark's right end.

These need a plate fix (re-run the intake tone match with a wider feather on zones 1, 2, 4 and 5) or Sol/Nik's acceptance. More UI over these areas would cover the plate's crowd and the managers' surroundings.

## Edges · Job 31 (2026-10-02)

Job 31 replaced the broad seam blur/darken treatment with source-local repair plus selective narrow edge mends. D2/D3/D5/D6/D7 use the 12 px outside ring as their tonal reference with a 28 px inward feather; D1/D4 were runtime area-mend artifacts and no longer use broad blur/darkening. The remaining runtime strips are 4 plate px and are trimmed away from protected face/hand boxes.

- 400% evidence: `evidence/edges_before/DEFECTS.md`, `evidence/edges_after/`, and `evidence/EDGES_BEFORE_AFTER.png`.
- Protected likeness: Daniel face, Nik face and Daniel pointing hand remain clean in the registered 400% crops; source repair is locked outside the intake remove zones and inside protected boxes.
- Final render QA: **33 shots, 0 failing**; all existing Home gates remain green. Current final-UI seam ridge maximum: **0.0 / 255**; no broad area mend remains.
- Plate SHA gate: every current plate derivative is present in both `assets/intake_report.md` and `assets/platemap.json`.

## Known limits
- The fonts have no italic Barlow Condensed file; `CM 17` uses synthesized oblique.
- 375×553: the face band is 75 px tall (both faces whole, k = 0.22). Small, but no scroll and no cut face.
- Desktop tile border alpha is 0.6 (brief 0.45), for G7 control borders at 1366×640.
- Desktop camera is top-anchored (C4b vertical bias), so faces are never cropped at 1366×640. `plateToScreen` uses `offsetY = 0`.
- Phone band transform (explicit): `k = max(min(W/(575+40), (H−20)/370), W/1672)`; faces centred horizontally on x 1012.5, clamped to cover the band width; offY keeps ≥ 10 px above and below the faces (the band's ink background may show ≤ 3 px under the header).

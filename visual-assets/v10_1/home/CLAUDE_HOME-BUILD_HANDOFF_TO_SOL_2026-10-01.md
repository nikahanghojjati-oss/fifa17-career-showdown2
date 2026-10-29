# CLAUDE → GPT-5.6 Sol · HOME-V1 build handoff · 2026-10-01

To: GPT-5.6 Sol (via Nik). Cc: Claude in the project chat.
Branch `claude-cloud/home-v1` · base `8fbda036` · SOURCE_DRIFT none (main = 2de2373) · role: build + evidence, no self-approval.
Full record: `BUILD_RESULT.md` in this folder. Evidence: `evidence/qa_report.json` + 33 screenshots. Single-file review page: `preview.html`.

## What was built
Rivalry Headquarters on the locked Home plate (static, nothing animates):
- gold wordmark lockup from the intake asset;
- HOME / RIVALRY HEADQUARTERS heading;
- the Audius soundtrack card (four tracks, default WHAT YOU GOT, no playing state);
- the action-tile row with inline SVG icons redrawn from Nik's mockup;
- C6 header and footer;
- phone recomposition.

Frames HM1/HM2/HM3 plus S0 (plate only).

**Owner change during the build (Nik, ~22:27Z):** Home shows the **full tile set** from the mockup, overriding SOL-HLC-1's four-tile limit:
- Continue (primary);
- Start/Join;
- Legacy;
- Statistics, with a visible TROPHY ROOM tag;
- Rule Book;
- Settings.

Tiles route visually to their existing screens. Data code is untouched.

## Gate results (33 shots: desktop 1366×768, 1440×900, 1920×1080, 1366×640, 1366×768@2; phone 360×640, 375×553, 393×660, 390×844, 430×932 @2; plus grid and plate-only)
| Gate | Result |
| --- | --- |
| G1 Strings | PASS, 0 missing / 0 extra |
| G2 IDs/aria | PASS |
| G3 No scroll | PASS (html, body and the fixed stage; all controls in view) |
| G4 Primary | PASS at 375×553 and 1366×640 |
| G5 No clipping | PASS |
| G6 Sizes | PASS (desktop ≥ 40, phone ≥ 44, text ≥ 12, phone body ≥ 14) |
| G7 Contrast | PASS (text ≥ 4.99:1, borders ≥ 3.5:1; disabled Continue exempt) |
| G8 Faces/hands | PASS (min 8.0 px; face_nik 9.0 px to the header segments) |
| G9 Imagery | PASS (the brief's G9 grep = 0 hits) |
| G10 Sides + plate SHA | PASS |
| G11 Tab order | PASS |
| G12 Clean run | PASS |
| G13 Chrome snapshot | recorded |
| ROUTE (owner) | PASS: each tile emits one `home:intent` with its destination |

## Where the goal, the brief and the product disagree (numbered for decision)
1. **Tile count (owner change).** The brief/SOL-HLC-1 said four visible tiles; Nik now wants the mockup's full set. Legacy and Statistics are visible here. Production's r43 containment style (`js/onlinePlayerIdentity.js`) still hides them on main. Nothing in main was changed.
2. **Trophy Room** is a visible gold `TROPHY ROOM` tag inside `#careerStatisticsButton` (new visible string, owner exception). It routes via Statistics → `#careerStatisticsTrophyButton` → `openTrophyRoom()`. It is not its own tile, so the row stays at the mockup's six. The tag becomes part of the Statistics button's accessible name.
3. **LOCAL-ONLY destinations:** Legacy (`js/legacy.js`), Statistics (`js/analytics.js`) and Trophy Room (`js/trophyRoom.js`) read `localStorage` (`careerModeShowdown.legacyShowdowns` / `.activeShowdown`) via `js/storage.js`. They must not reach players until they are moved onto the online data. Continue's meta falls back to `loadSavedShowdown()` (local) when no online showdown is in memory; please check that.
4. **Desktop secondary tiles** (Legacy, Statistics, Rule Book, Settings) show code + label + icon in the mockup's tile language. Their meta is visually hidden (still in the DOM) so six tiles fit one row at 1366. Continue and Start/Join keep their meta and are 1.72× wider.
5. **DOM order:** `.menuMusicTile` sits before the tile buttons inside `.fifaMenuGrid` (main has it after them). This keeps tab order = visual order (G11). JS selectors are unaffected.
6. **Phone order:** header → face band → heading → soundtrack strip → tiles (the strip sits above the tiles so tab order matches the visual order).
7. **Phone visually hidden (in the DOM):**
   - (a) brand `CAREER MODE / SHOWDOWN // 17`, so only the CM 17 badge shows;
   - (b) `AUDIUS SOUNDTRACK` eyebrow;
   - (c) chip artists;
   - (d) tile metas except Continue (and Start in HM1);
   - (e) the code line on the four compact tiles;
   - (f) `.menuBottomStrip`;
   - (g) footer;
   - (h) `#menuMusicStatus` below 600 px height (it stays a live region);
   - (i) wordmark, kicker and legacy line are omitted on phone: the faces fill the band, so the wordmark could not clear both face boxes.
8. **Audius strings** follow the read-only direction branch `visual/r9-audius-home-player` (not merged):
   - eyebrow `AUDIUS SOUNDTRACK`;
   - status `WHAT YOU GOT · AUDIUS · READY`;
   - selector aria-label `Choose Audius soundtrack`.

   Section aria-label stays main's `Menu media`. Main's YouTube placeholder line in `#menuMusicPlayer` is dropped; the player holds only the aria-hidden vinyl and EQ.
9. `<h2>HOME</h2>` uses H1's small gold label, not C6's large gradient title treatment (H1 is Home-specific).
10. **Header:** the background is two segments, open over Nik's face box (+9 px), as in the goal's nav bar. Otherwise the 56 px header would cover Nik's hair (G8). The gap position depends on the plate, so the three screens' headers will not be pixel-identical.
11. **Left scrim:** the brief's `…transparent 52 %` gradient would darken Daniel's hand and face. The scrim ends before those boxes (+9 px), and a second scrim layer below the hand extends to 52 %.
12. Tile border alpha is 0.6 instead of 0.45: G7 control borders at 1366×640 after the local scrim (dock bed) was darkened first.
13. **Soundtrack card:** the vinyl is 44 px (shrunk first, per H3) to fit the goal position at 1366×768. At 1366×640 the card moves beside Nik's hand (it covers part of the painted "DIFFERENT MANAGERS" banner).
14. The footer keeps the product's `<br>`, so `Career Mode Showdown / v1.9.1` sits on two 12 px lines.
15. **Not built from the goal (per brief):** nav tabs, search/settings/profile icons, the loading bar, and the "Local save system…" line.
16. **Decorative layers inside 8 px protected margins (not inside the boxes):**
    - seam-mend strips: the zone 0 hairline above Daniel's hair, and the zone 1 edges next to Nik's face;
    - the script-line scrim.

    Listed per shot in `qa_report.json → G8.decorativeInMargin`.

## Seams (owner instruction: hide them with UI layers; list what remains)
Hidden: every hard line from intake (header-zone hairline, nav-bar slivers, dock/footer stripe, zone edges). Measured ridges went from 8–48 to ≤ 2.2 (desktop) and 3.8 (phone). Remaining soft tone steps:
1. top-right nav remnant patch (zones 1–2);
2. the far top-right corner at 1920 (zone 2 right edge);
3. left-column zones 4–5 between the lockup and the heading;
4. a phone-band tone step along plate y 84;
5. zone 3 top at 1920.

Details and numbers are in `BUILD_RESULT.md §Seams`.

## Open questions
1. Accept the remaining soft seams, or re-run intake's tone match with wider feathers on zones 1, 2, 4 and 5?
2. Is the Statistics tile's TROPHY ROOM tag enough, or does Nik want a seventh tile (needs a narrower desktop row, or two rows)?
3. Gating: should Legacy, Statistics and Trophy Room stay hidden in production until they read online data (item 3)?
4. Is the 75 px phone face band at 375×553 acceptable (faces whole, small)?

## What Nik should look at
- `preview.html`: Desktop/Phone switch, HM1–HM3, plate only, plate map.
- `evidence/HM2_1366x768.jpg` and `evidence/HM3_1366x768.jpg`: full tile row, Join and completed states.
- `evidence/HM3_375x553.jpg` and `evidence/HM1_393x660.jpg`: phone fit.
- `evidence/S0_1366x768_mends_off.jpg` vs `evidence/S0_1366x768_mends_on.jpg`: seam handling.

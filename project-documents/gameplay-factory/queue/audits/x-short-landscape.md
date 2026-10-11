# JOB-1470 — Short-landscape CSS audit (stage 1)

**Scope:** Read-only CSS review on `qa/mega-audits`; no game, design, JavaScript or test changes. Inspected only `css/v10Shell.css`, `css/homeV10.css`, and `css/rulesSettingsV10.css`. Target sideways-phone viewports: **844 × 390**, **932 × 430**, **667 × 375** (CSS pixels).

**Method and confidence:** Checked the applicable width, orientation and max-height media queries and computed fixed-position/scroll-height constraints from the declarations. This was **not** a rendered browser/screenshot test; declarations in Team V's separate stage-specific stylesheets were outside this ticket's read scope. "Confirmed CSS" below means the sizing/breakpoint behavior is unambiguous in the audited files, not that a live occlusion was reproduced.

## Findings (2; maximum allowed: 8)

| # | Screen and CSS location | What is wrong at the target sizes | Smallest proposed CSS/markup change | Confidence |
| --- | --- | --- | --- | --- |
| 1 | **Home → Nik/Daniel connection panel**, `css/homeV10.css:72-76` (`#persistentNikDanielPairPanel`), and the portrait-only override at **198** | Panel's `max-height: calc(100vh - var(--sd-nav-top-h, 52px) - 300px)` computes to **38px at 844×390**, **78px at 932×430**, and **23px at 667×375**, with the fallback 52px nav height. It also has `overflow:auto`, so any visible panel content is forced into a near-zero-height inner scroller. The portrait-only correction at line 198 does not run on a sideways phone. | Add an `@media (orientation: landscape) and (max-height: 480px)` override for this panel: reserve actual top + bottom nav/footer clearance and set `max-height: calc(100dvh - <top clearance> - <bottom clearance>)` instead of subtracting a fixed 300px. Keep its own scroll only if panel content exceeds the usable region; avoid covering persistent navigation. | **Confirmed CSS geometry**; visibility depends on the connection panel being open. |
| 2 | **Settings → contents/cards and DONE footer**, `css/rulesSettingsV10.css:43-50` and **98-100** | At **667×375 landscape**, the small-screen vertical flex/card layout and explicit content `top`/`bottom` constraints are gated behind `orientation:portrait`, while the alternate explicit grid-row/overflow repair begins at `min-width:761px`. Thus neither responsive safeguard applies at this target size. Default Settings grid/positioning is used despite only 375px of vertical room, leaving a screen-title/card/footer overlap or inaccessible-actions risk. At 844×390 and 932×430 the `min-width:761px` scroll repair **does** apply. | Add a narrow **landscape + max-height:480px** override for Settings with compact header/footer clearance, `#settingsContent` as a vertically scrolling flex stack between them and `.settingsPanel {flex:0 0 auto}`; keep close/DONE visible and keyboard reachable. Do not apply portrait's 130px top + 74px bottom unchanged to a 375px screen. | **Confirmed breakpoint gap**; actual clipping needs a runtime viewport check before being made a fix job. |

## Target-size CSS matrix

| CSS screen/shell | 844×390 | 932×430 | 667×375 | Review note |
| --- | --- | --- | --- | --- |
| Home: tile row, logo, soundtrack | Short-landscape rule | Short-landscape + >900px top-nav rule | Short-landscape rule | `css/homeV10.css:215-301` defines compact tile row, slim soundtrack strip and dropdown height constraints. No separate tile/header overlap established by this CSS-only inspection. |
| Home: connection panel | **Finding 1: 38px max** | **Finding 1: 78px max** | **Finding 1: 23px max** | Conditional when the panel is present. |
| Settings | Width >=761 scroll repair | Width >=761 scroll repair | **Finding 2: gap** | `css/rulesSettingsV10.css:43-50,98-100`. |
| Rule Book | Full-viewport fixed stage | Full-viewport fixed stage | Full-viewport fixed stage + <=760px grid top | `css/rulesSettingsV10.css:3-9,53-62,107-109`; stage-specific interior styles not audited. |
| Shared navigation / screen header | Bottom-nav padding, mobile chips off stage | Top-nav padding, desktop chips in header | Bottom-nav padding, mobile chips off stage | `css/v10Shell.css:3-9,47-74`. |
| New Showdown, League, Club setup | Shared header/nav rules only | Shared header/nav rules only | Shared header/nav rules only | `css/v10Shell.css:130-151`; separate setup stylesheet out of scope. |
| Career Statistics / Trophy Room | Shared full-viewport host rules | Shared full-viewport host rules | Shared full-viewport host rules | `css/v10Shell.css:76-88`; phone-short helper at lines 259-263 is **portrait only**. No claim about unseen stage interiors. |
| Standings | Shared full-viewport host rule | Shared full-viewport host rule | Shared full-viewport host rule | `css/v10Shell.css:83-88`; stage interior outside allowed files. |
| Legacy / History & Backup tools | Shared mobile/nav + tools theme | Shared desktop/nav + tools theme | Shared mobile/nav + tools theme | `css/v10Shell.css:173-258`; interior overflow outside allowed stylesheets. |

**Decision for Team G:** Triage finding 1 as a concrete CSS-height defect. Verify finding 2 at 667×375 in a browser before assigning a targeted Settings fix. The CSS-only scope cannot certify that all Team V screen interiors are overlap-free; this report lists every screen family whose shell/host rules were examined. **No product files were edited.**

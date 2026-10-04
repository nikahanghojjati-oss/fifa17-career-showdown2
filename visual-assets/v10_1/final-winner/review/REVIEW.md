# Final Winner · Independent Review

## Verdict

## Scorecard

## Hard gates

## Evidence

### Claude measurement carry-forward

- Source: `project-documents/factory/status/JOB-082.md` — Claude check is `PASS 4.2 · 2026-10-03 21:24 UTC`, but its intake note does not provide H5–H11 measurements. The same status explicitly defers H5–H11 to Claude after recipe asset generation.
- Source: `project-documents/factory/status/JOB-083.md` — phone fit and control sizes are worker code/arithmetic checks, not Claude browser measurements, so they are not substituted for Claude measurements here.
- Source: `visual-assets/v10_1/final-winner/evidence/` — directory is not present on `factory/v1-wtt5ye`; therefore `QA_SUMMARY.md` and `scores.json` do not exist yet.

| Gate | Claude measurement | Source |
| --- | --- | --- |
| H5 · phone fit / scroll | NOT MEASURED (Claude measures) | `project-documents/factory/status/JOB-082.md`; no evidence directory |
| H6 · input size / contrast | NOT MEASURED (Claude measures) | `project-documents/factory/status/JOB-082.md`; no evidence directory |
| H7 · reduced motion | NOT MEASURED (Claude measures) | `project-documents/factory/status/JOB-082.md`; no evidence directory |
| H8 · keyboard / focus | NOT MEASURED (Claude measures) | `project-documents/factory/status/JOB-082.md`; no evidence directory |
| H9 · console / requests | NOT MEASURED (Claude measures) | `project-documents/factory/status/JOB-082.md`; no evidence directory |
| H10 · mockup diff | NOT MEASURED (Claude measures) | `project-documents/factory/status/JOB-082.md`; no evidence directory |
| H11 · page weight | NOT MEASURED (Claude measures) | `project-documents/factory/status/JOB-082.md`; no evidence directory |

### Mockup differences

- Title block — `MOCKUP_TROPHY_ROOM.png` places the eyebrow/title/tagline on the centre axis at roughly y 12–23% with a broad ~30% brush title; `.finalWinnerTitleBlock` is centred at x 49.49%, top 13.35%, width 38%, with `.finalWinnerWordmark` at 70% of that block (~26.6% of frame). The geometric placement closely follows Trophy Room, while the words change from TROPHY ROOM to the Final Winner wordmark.
- Title block — `MOCKUP_SEASON_RESULTS.jpg` uses SEASON RESULTS as a much larger brush headline occupying roughly the central upper quarter; the code deliberately does not copy that title scale or wording and instead retains the Trophy Room ceremony-axis proportions.
- Preview/crown stack — neither supplied mockup contains a `Preview data` chip above the title; the code adds `.finalWinnerPreview` at x 49.49%, top 7.02% and a centred winner crown at top 9.85%, creating a new truth/state layer above the reference title.
- Top navigation panel — `MOCKUP_TROPHY_ROOM.png` has a primary bar plus a second CAREER HUB / TROPHIES / TRANSFERS / HISTORY / RECORDS subnav; `.finalWinnerTopbar` is a single 52 px bar with HOME / CAREER / STANDINGS / STATS / RULES plus Settings, so the Trophy Room secondary strip is omitted.
- Top navigation panel — `MOCKUP_SEASON_RESULTS.jpg` includes HOME / CAREER / STANDINGS / STATS / RULES / ABOUT plus search, settings and profile icons; the code drops ABOUT/search/profile and keeps only the product routes mounted in `.finalWinnerTopbar`.
- Central hero panel/object — `MOCKUP_TROPHY_ROOM.png` devotes roughly x 39–62%, y 24–63% to one large trophy and pedestal; `.winnerTrophySlot` is x 38.14%, y 32.29%, width 23.72%, height 42.06%, so the Final Winner trophy begins lower and extends farther down to create space for winner copy.
- Central scoring panel — `MOCKUP_SEASON_RESULTS.jpg` has a large SEASON SCORING SYSTEM panel around x 27–69%, y 32–52%; Final Winner has no scoring-system panel. That area is instead occupied by `.finalWinnerHeroCopySlot` and the upper part of `.winnerTrophySlot`.
- Winner-copy area — neither supplied mockup has a live winner headline plus Daniel/Nik final point totals in the centre; the code adds `.finalWinnerHeroCopySlot` at left 34.55%, width 30.89%, with its top ultimately set by `calc(14.8% + 99px)`.
- Main results panel — `MOCKUP_SEASON_RESULTS.jpg` uses two large editable manager cards spanning roughly x 13–83%, y 54–86%; `.finalWinnerResultsPanel` replaces both with one read-only strip at x 15.37%, y 75.26%, width 69.25%, height 12.50%.
- Main results panel — `MOCKUP_TROPHY_ROOM.png` uses a wide trophy-cabinet panel from roughly x 8–92%, y 63–85% with category tabs and six trophy cards; Final Winner narrows this to a 69.25%-wide results strip with summary/honours content and no cabinet category rail.
- Summary subpanel — neither mockup has the SEASONS / MARGIN two-cell summary; the code adds `.finalWinnerMetaStrip` inside the results panel as read-only final-showdown metadata.
- Honours subpanel — Trophy Room shows individual trophy cards and counts across six columns; Final Winner instead uses `.finalWinnerHonours` as Daniel-left / Nik-right comparative rows for Champions League, league titles, domestic cups and total trophies.
- State panel — neither mockup has loading/empty/unavailable replacement content; `.finalWinnerStatePanel` is a dedicated alternate panel state inside `.finalWinnerResultsPanel`.
- Partial-history panel — neither mockup has a history-coverage disclosure; `.finalWinnerPartialNotice` and `.finalWinnerPartialTrigger` add a compact partial-data state instead of copying any reference panel.
- Primary/secondary buttons — `MOCKUP_SEASON_RESULTS.jpg` has REVIEW SEASON as a large gold primary and BACK TO SHOWDOWN HOME as a dark secondary across the bottom; Final Winner does not copy either. `.finalWinnerActionsSlot` is a single centred reserve at left 34.33%, top 90.60%, width 31.33%, height 5.73% for the fixture-authorized terminal action only.
- Back button — `MOCKUP_TROPHY_ROOM.png` has one centred BACK button at the bottom; Final Winner does not render that reference button and reserves the same lower-centre region for terminal-close status/action instead.
- Daniel desktop area — both mockups place Daniel on the left; the Final Winner desktop plate is the Trophy Room plate and registers Daniel's face at `318 141 472 335` on 1672×941 (about x 19.0–28.2%, y 15.0–35.6%), preserving the reference side and face area.
- Nik desktop area — both mockups place Nik on the right; the Final Winner desktop plate registers Nik's face at `1138 130 1309 336` (about x 68.1–78.3%, y 13.8–35.7%), preserving the Trophy Room side and face area.
- Manager depth treatment — the mockups show full photographed/illustrated managers naturally in front of the stadium/UI; Final Winner keeps the Trophy Room plate and adds only planned near-arm cutouts/rim/contact overlays above desktop UI, so the reference full-body composition is retained while depth is reconstructed in layers.
- Phone managers — the supplied references are desktop only; Final Winner introduces a separate portrait composition with Daniel at left 29%, top 1.5%, height 59% and Nik at left 71%, top 1%, height 60%, plus a 55% hero boundary and phone-only tabs/action layout. There is no supplied mockup value to match for these phone positions.

## Fix list

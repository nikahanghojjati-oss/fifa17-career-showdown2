# Final Winner · Independent Review

## Verdict

## Scorecard

## Hard gates

| Gate | Result | Evidence |
| --- | --- | --- |
| H1 · Daniel left, Nik right, never mirrored | PASS | `final-winner.js` FACE_BOXES and every fixture `presentation.managerOrder` keep Daniel left and Nik right; no mirrored manager order is authored. |
| H2 · Rights-safe assets only | PASS | The audited Final Winner code references Showdown-owned Trophy Room/Final Winner presentation assets only; no real crest, league logo, player art or EA/FIFA asset is introduced by this screen. |
| H3 · No live/private data baked into images | PASS | `applyFrame()`, `setText()` and `setMetricValue()` put names, result copy, totals, status and trophy values in DOM text; image assets are presentation-only. |
| H4 · Product truth: real buttons/stats/scoring | PASS | `renderActions()` allows only CLOSE/RETRY Terminal Close actions, and `renderResultPanel()` reads only §4 seasons, margin and trophy fields; no editable score/scoring-table UI exists. |
| H5 · phone fit / scroll | NOT MEASURED (Claude measures) | `project-documents/factory/status/JOB-082.md`; no evidence directory |
| H6 · input size / contrast | NOT MEASURED (Claude measures) | `project-documents/factory/status/JOB-082.md`; no evidence directory |
| H7 · reduced motion | NOT MEASURED (Claude measures) | `project-documents/factory/status/JOB-082.md`; no evidence directory |
| H8 · keyboard / focus | NOT MEASURED (Claude measures) | `project-documents/factory/status/JOB-082.md`; no evidence directory |
| H9 · console / requests | NOT MEASURED (Claude measures) | `project-documents/factory/status/JOB-082.md`; no evidence directory |
| H10 · mockup diff | NOT MEASURED (Claude measures) | `project-documents/factory/status/JOB-082.md`; no evidence directory |
| H11 · page weight | NOT MEASURED (Claude measures) | `project-documents/factory/status/JOB-082.md`; no evidence directory |

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

- Title block — `MOCKUP_TROPHY_ROOM.png` puts the eyebrow/title/tagline on the centre axis at roughly y 12–23% with a ~30%-wide brush title; code uses `.finalWinnerTitleBlock` centred at x 49.49%, top 13.35%, width 38%, with `.finalWinnerWordmark` at 70% of that block (~26.6% of frame). TRUTH.md authorizes the brush ceremony treatment but requires live shared-result state headings rather than copying TROPHY ROOM/SEASON RESULTS or inventing FINAL WINNER.
- Title block — `MOCKUP_SEASON_RESULTS.jpg` uses a larger SEASON RESULTS brush headline across the upper centre; code intentionally keeps the Trophy Room ceremony proportions. This is a styling-reference difference, not a truth defect because TRUTH.md says there is no dedicated Final Winner mockup.
- Preview/crown stack — neither mockup contains a `Preview data` chip; code adds `.finalWinnerPreview` at x 49.49%, top 7.02%. Code also centres the winner crown at top 9.85%. TRUTH.md requires Preview data on owner-preview frames and permits crown art only for an authoritative Daniel/Nik winner, never draw/unconfirmed.
- Top navigation panel — Trophy Room has a second CAREER HUB / TROPHIES / TRANSFERS / HISTORY / RECORDS strip; Final Winner uses one 52 px `.finalWinnerTopbar`. TRUTH.md explicitly requires only HOME / CAREER / STANDINGS / STATS / RULES plus settings.
- Top navigation panel — Season Results also shows ABOUT, search and profile; code omits them. TRUTH.md explicitly marks ABOUT/search/profile as DROP, so this mismatch is required.
- Central hero object — Trophy Room devotes roughly x 39–62%, y 24–63% to its hero trophy/pedestal; `.winnerTrophySlot` is x 38.14%, y 32.29%, width 23.72%, height 42.06%. The code starts the trophy lower to leave room for live winner copy. TRUTH.md permits a decorative central trophy only when it is original Showdown art and not counted as a fourth trophy family.
- Central scoring panel — Season Results has a large SEASON SCORING SYSTEM panel around x 27–69%, y 32–52%; Final Winner omits it and uses the area for `.finalWinnerHeroCopySlot` plus trophy art. TRUTH.md explicitly says the scoring-rule rows are DROP on Final Winner.
- Winner-copy area — neither mockup has a final winner headline plus whole-Showdown totals; code adds `.finalWinnerHeroCopySlot` at left 34.55%, width 30.89%, top `calc(14.8% + 99px)`. TRUTH.md requires winner from accumulated Showdown points and read-only `totals.daniel` / `totals.nik`, so the new live block is required.
- Main results panel — Season Results uses two editable manager cards roughly x 13–83%, y 54–86%; `.finalWinnerResultsPanel` replaces them with one read-only strip at x 15.37%, y 75.26%, width 69.25%, height 12.50%. TRUTH.md explicitly drops per-season inputs and replaces season-score tiles with whole-Showdown totals.
- Main results panel — Trophy Room uses a wide trophy-cabinet panel roughly x 8–92%, y 63–85% with category tabs and six cards; Final Winner narrows that to one compact results strip. TRUTH.md says reuse cabinet polish only as visual language and DROP the Trophy Room category/filter browser.
- Summary subpanel — neither mockup has SEASONS / MARGIN; `.finalWinnerMetaStrip` adds both. TRUTH.md explicitly allows `seasonsPlayed` and absolute `margin`, so this difference is contract-driven.
- Honours subpanel — Trophy Room shows individual career trophy cards; Final Winner uses `.finalWinnerHonours` as Daniel-left/Nik-right rows for Champions League, league titles, domestic cups and total trophies. TRUTH.md requires exactly these per-Showdown trophy fields and drops career/ALL-TIME wording.
- State panel — neither mockup has loading/empty/unavailable replacement content; `.finalWinnerStatePanel` adds those designed states. TRUTH.md requires loading, empty, unavailable, partial and ready, with missing values never converted to zero.
- Partial-history panel — neither mockup has history coverage; `.finalWinnerPartialNotice` / `.finalWinnerPartialTrigger` add a partial-state disclosure. TRUTH.md requires partial coverage to identify unreadable coverage and missing fields without claiming career/all-time scope.
- Bottom actions — Season Results has REVIEW SEASON plus BACK TO SHOWDOWN HOME; Final Winner does not copy either. `.finalWinnerActionsSlot` sits at left 34.33%, top 90.60%, width 31.33%, height 5.73%. TRUTH.md permits only CLOSE SHARED SHOWDOWN or RETRY SAME TERMINAL CLOSE when that terminal state exposes the action.
- Back button — Trophy Room has a centred BACK button; Final Winner omits it. TRUTH.md says completed online Final Winner renders no local completion-hub navigation buttons; the shared top bar is the only navigation on the closed online result.
- Completion mark — neither mockup has a Completion pending chip; code adds `.finalWinnerCompletion`. TRUTH.md requires that exact visible mark only when `state = completion-pending`.
- Daniel desktop area — both mockups place Daniel left; Final Winner uses the Trophy Room plate and registers Daniel’s face at `318 141 472 335` on 1672×941 (about x 19.0–28.2%, y 15.0–35.6%). TRUTH.md requires Daniel first/left in every state.
- Nik desktop area — both mockups place Nik right; Final Winner registers Nik’s face at `1138 130 1309 336` (about x 68.1–78.3%, y 13.8–35.7%). TRUTH.md requires Nik second/right in every state.
- Manager names — the mockups visually letter the manager names into their scene treatments; Final Winner uses `#danielName` and `#nikName` as DOM text inside the totals. TRUTH.md explicitly forbids baking manager names into the plate/background.
- Manager depth treatment — the mockups show the full managers naturally in front of stadium/UI layers; Final Winner retains the Trophy Room plate and adds planned near-arm cutouts, contact shadows and rims above desktop UI. This changes implementation layering while preserving the approved manager art and left/right staging required by TRUTH.md.
- Phone managers — the references are desktop only; Final Winner introduces a portrait composition with Daniel at left 29%, top 1.5%, height 59% and Nik at left 71%, top 1%, height 60%, plus a 55% hero band. TRUTH.md explicitly requires a separate phone composition, Daniel left/Nik right, with the outcome leading and no bottom navigation.
- Phone results/actions — no supplied mockup defines phone tabs or a pinned terminal action; code introduces Summary/Honours tabs, partial disclosure and a bottom action slot. TRUTH.md requires no scroll, compact supporting facts, completed surfaces without local hub buttons, and pending completion with CLOSE SHARED SHOWDOWN visible.

### Code audit

- PASS · Manager order — `final-winner.js registerManagerMarkers()` / `.managerPlateMarker[data-manager]`: Daniel uses the left FACE_BOX `318 141 472 335`, Nik the right `1138 130 1309 336`; `fixtures.json frames.*.presentation.managerOrder` is `["daniel","nik"]` in every frame.
- PASS · Read-only contract facts — `final-winner.js renderResultPanel()` / `#panelSeasons`, `#panelMargin`, `#panelDanielContinental`, `#panelNikContinental`, league/cup/total trophy metrics: only `seasonsPlayed`, `margin` and the §4 trophy fields are rendered; excluded per-season and player statistics are not read.
- PASS · Button truth — `final-winner.js renderActions()` / `#sharedTerminalCloseActions`: the dynamic allow-list contains only fixture strings `CLOSE SHARED SHOWDOWN` and `RETRY SAME TERMINAL CLOSE`; completed/read-state frames expose no invented action.
- PASS · Empty/loading/unavailable honesty — `final-winner.js setMetricValue()` / result metric ids: absent values render `—` with `aria-label="Unavailable"`, never numeric zero; FW6–FW8 omit totals, winner, seasons and trophies in `fixtures.json`.
- PASS · Partial honesty — `fixtures.json frames.FW9` plus `final-winner.js #finalWinnerPartialMessage` / `#finalWinnerPartialCoverage`: coverage is 1 of 2 and Nik domestic cup/total are omitted, while available final-result fields remain present.
- PASS · Winner state truth — `fixtures.json frames.FW1–FW9` / `presentation.crown` and `winner`: draws and unconfirmed read states have no crown; ready winner frames preserve Daniel/Nik winner data and `completion-pending` is separately marked.
- PASS · Accessible missing values — `final-winner.js setMetricValue()` / metric elements: missing visual em dashes receive the accessible name `Unavailable`; available values remove that override.
- PASS · Accessible action names — `final-winner.js renderActions()` / generated `button.sd-btn`: native button text is the exact fixture action label, so the control has a matching accessible name without a conflicting aria-label.
- PASS · Focus order — `final-winner.js renderActions()` / `#sharedTerminalCloseActions`: buttons are appended in fixture order and no positive `tabindex`, scripted focus jump or focus-order override is introduced.
- PASS · Phone targets — `final-winner.css .phoneResultTab`, `.finalWinnerPartialTrigger`, `.sd-btn`: the phone pass retained minimum 44 px interactive targets; there are no text-entry controls, so the ≥16 px input-font rule is not applicable.
- PASS · No PNG master — `final-winner.js mountStage()` / `ShowdownStage.mount`: the plate sources are `ENV_TR_PLATE_V1_1X.webp` and `ENV_TR_PLATE_V1_2X.webp`; the screen code does not load a PNG master.
- PASS · No live data in images — `final-winner.js applyFrame()` / `setText()` and `setMetricValue()`: names/result copy, totals, status, seasons and trophy values are DOM text; image assets are presentation only.
- FINDING · Runtime error copy bypasses fixtures — `final-winner.js fetch("fixtures.json").catch()` / `#finalWinnerMessage`: the catch path writes raw `error.message` into visible UI instead of the fixture-authored unavailable copy. This breaks the rule that changing visible words come from `fixtures.json` and can expose technical request text.
- FINDING · Trophy summary labels bypass fixtures — `final-winner.js trophyLine()` / `#danielTrophies`, `#nikTrophies`: `Continental`, `League`, `Domestic cup`, `Total` and `unavailable` are hard-coded in JS rather than sourced from fixtures. Even if this line is assistive/supporting copy, it is visible-text logic outside the fixture authority and should be centralized.

## Fix list

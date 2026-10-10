# Full phone pass (jobs 105, 221-226)

Claude walked every showcase screen and frame in a real browser (Chromium, phone mode, touch on) on 4 Oct 2026.
That is 15 screens, 115 frames and 5 sizes: 393x660 (the main target), 360x640, 375x553, 390x844 and 430x932. In total that makes 540 renders.
Each render checked four things:
- whether the page scrolls
- whether the primary button sits fully inside the first view
- whether any tap target is under 44 px
- whether any text runs past the screen edge

Claude also looked at every frame on contact sheets.

Branch: `factory/v1-wtt5ye`. Fixes below are for GPT jobs 106 (items 1-3), 227 (4-6) and 228 (7-9).

## Measurements (105, 221, 222)

| Screen | Frames | Renders | Page scrolls | Primary cut | Targets < 44 px | Text off screen | JS errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| home | 3 | 15 | none | 0 renders | none | none | 0 |
| league | 4 | 20 | L3 360x640, L3 375x553, L3 393x660, L4 360x640 | 3 renders | none | none | 0 |
| club | 6 | 30 | none | 0 renders | none | SPAN«RIVALRY» (30) | 0 |
| tr2/slice-02-plate | 14 | 70 | none | 0 renders | none | .timer-text«11:42» (20) | 0 |
| loading | 6 | 30 | none | 0 renders | none | none | 0 |
| trophy-room | 7 | 35 | none | 35 renders | none | H3«Domestic Cup» (20), SPAN«Daniel» (20), .has-count.sd-count-up«1» (20) | 0 |
| career-statistics | 6 | 30 | none | 0 renders | none | none | 0 |
| rivalry-statistics | 7 | 35 | none | 0 renders | none | none | 0 |
| legacy | 9 | 45 | none | 10 renders | none | .legacyManagerName«Daniel» (10), .legacyManagerName«Nik» (10), .legacyCardTitle«Showdown #2» (7) | 0 |
| season-results | 11 | 55 | none | 0 renders | #p1LeaguePosition (30), #p1LeaguePoints (30), #p1LeagueGoals (30), #p2LeaguePosition (5) | none | 0 |
| final-winner | 9 | 45 | none | 0 renders | none | none | 0 |
| start-join | 8 | 40 | none | 0 renders | none | none | 0 |
| standings | 9 | 45 | none | 0 renders | none | none | 0 |
| rule-book | 2 | 10 | none | 0 renders | none | none | 0 |
| settings | 7 | 35 | none | 35 renders | #creditAuthor (35), #creditLicense (35) | none | 0 |

What the flags mean after looking at the pictures:

- **League L3/L4 (real, blocks the flow).** With the 3-line state note showing, the page grows to 691 px at 393x660 and 692 px at 360x640. CONTINUE TO CLUB ASSIGNMENT then sits at 635-683, below the 660 fold.
  - Cause: `league/league.js` layoutPhone falls back to the scrolling "flow" layout (decision LEAGUE-M2) and `setPageScroll` makes the stage absolute.
  - LEAGUE-M2 itself demands that #spinLeague stays in the first view, so this breaks its own rule.
- **Season Results (real).** The six number boxes (#p1/#p2 LeaguePosition, Points, Goals) are 64x28 px. At 375x553 they are 64x22 px. Both are under the 44 px tap rule.
- **Settings (real, small).**
  - The credit links Tim Reckmann and CC BY 2.0 are 12 px tall.
  - In ST7 (partial) the status chip "Current Showdown o..." runs off the right edge.
  - The "cut" buttons (motion choices, feedback toggle, Open History & Backup) are inside the panel's own scroller, and DONE stays pinned. That part is fine.
- **Final Winner (real, flow).** On phone the top bar is `display:none` (final-winner.css about line 1087) and no phone bar or button replaces it.
  - FW1-3 and FW5-9 have no way to leave the screen. Only FW4 has CLOSE SHARED SHOWDOWN.
- **Club (small).** The "RIVALRY" kicker inside `.clubVs` sits outside the viewport on all 6 frames. The VS badge itself shows. Either hide it on phone or bring it back inside.
- **Transfer War F1/F1D/F1R/F1DR (small).** `.timer-text` (11:42) is placed off screen on phone, so the window timer is not visible.
- **Trophy Room (by design, but needs a hint).** The 5 filter tabs are a sideways scroller, so DOMESTIC CUPS and CHAMPIONS LEAGUE start off screen. The card grid also scrolls sideways (the third card is off screen). Nothing shows that more is there.
- **Legacy (by design).** The cards are a carousel with dots and arrows. Off-screen cards are expected.
- **Clean:** Home, Loading, Career Statistics, Rivalry, Start/Join, Standings and Rule Book.
  - None of them scroll, no target is under 44 px, no text runs off, and 0 JS errors appeared across all 540 renders.

## Consistency (223, 224, 225)

These are measured at 393x660 on one representative frame per screen. Band is how far the hero art reaches down the view.
Some numbers are fuzzy: screens with full-bleed art read 92-100, and screens whose title is a picture read "no title found".

| Screen | Hero band % | Title top / height px | Tabs | Bottom bar | Primary pinned gap px | Outlier? |
| --- | --- | --- | --- | --- | --- | --- |
| Home | 64 | 224 / 62 | none | 56 px | sits on bar | |
| League | 70 | art title | none | none | 0 (flush) | gap |
| Club | 55 | art title | none | none | 8 | |
| Transfer War | 100 | 4 / 44 | none | none | 6 | |
| Loading | 100 | 326 / 123 | none | none | none | |
| Trophy Room | 100 | 47 / 28 | 5, h44, sideways | none | 0 (BACK flush) | title small |
| Career Statistics | 100 | 39 / 29 | none | **none** | 0 | title small, **no bar on a hub screen** |
| Rivalry | 92 | 226 / 37 | 4, h44 | none | 56 | |
| Legacy | 55 | 189 / 63 | none | 56 px | 68 | |
| Season Results | 55 | 147 / 45 | none | none | 12 | |
| Final Winner | 100 | 43 / 36 | 2, h46 | **none** | **no button** | **dead end** |
| Start/Join | 92 | 266 / 42 | 3, h44 | none | 100 | |
| Standings | 92 | 214 / 53 | 2, h44 | 56 px | | |
| Rule Book | 100 | 51 / 38 | none | **none** | 64 | **no bar on a hub screen** |
| Settings | 100 | 51 / 56 | none | none | 66 | |

Shared defaults, meaning what most screens already do:
- Tabs are 44 px tall with a gold active pill. Every tabbed screen matches.
- The primary button is pinned 6-12 px above the bottom edge, or right above the 56 px bar on hub screens.
- Hub screens (HOME, CAREER, STANDINGS, STATS, RULES from the top-nav contract) carry the 56 px phone bottom bar.

Outliers:
- **Career Statistics and Rule Book** are STATS and RULES hub targets but show no phone bar.
- **Final Winner** has no exit.
- **League** has its primary flush at 0 px, and it is pushed off-screen in L3/L4.
- **Trophy Room and Career Statistics** have the smallest titles (28-29 px tall, against about 40-60 elsewhere). Accepted for now: their art titles carry the brand.

## Flow (226)

The path is read from `visual-assets/v10_1/showcase/routes.json` (version 2, part 4). "Via Home" means the screen is reachable by its Back control and then a Home tile or nav tab.

| Hop | In routes.json | Notes |
| --- | --- | --- |
| Home → Start/Join | present (homeTiles.newShowdown → SJ1) | |
| Start/Join → League | **missing** | no inScreenLink; Back only goes to HM1 |
| League → Club | **missing** | club Back points to league L1, but no forward link |
| Club → Transfer War | **missing** | |
| Transfer War → Season Results | **missing** | |
| Season Results → Final Winner | present (seasonResultsToFinalWinnerPreview → FW1, preview) | |
| Final Winner → Legacy | **missing** | backControls send it to HM3, but on phone there is no control (see above) |
| Legacy → Statistics | via Home (careerStatisticsButton → CS1) | no direct link |
| Statistics → Rivalry | present (statisticsToRivalry → RV1) | |
| Rivalry → Trophy Room | via Statistics (Back → CS1, then statisticsToTrophyRoom → TR1) | |
| Trophy Room → Rule Book | via Home (ruleBookButton → RB1) | |
| Rule Book → Settings | via Home (settingsButton → ST1) | |

Result: 3 hops are direct, 4 are reachable through Home or Statistics, and 5 are missing. The 5 missing hops are the game's forward path: Start/Join → League → Club → Transfer → Season Results, plus Final Winner → Legacy.
The showcase can't yet be walked start to finish without going back to the hub. Integration job 107 (live wiring) owns the real forward path. The showcase links below are the cheap stand-in.

## Fix list (for GPT jobs 106, 227, 228)

One change in one file each, highest impact first. Claude re-renders the three phone sizes at intake.

1. **`visual-assets/v10_1/league/league.js`**, function layoutPhone, the flow-fallback loop `for (let r = phoneFlowR; r >= phoneMinR; r -= 0.5)`.
   - Change: when `noteH > 0`, let the loop go down to 92 instead of `phoneMinR`. Write it as `const floorR = noteH ? 92 : phoneMinR;` and use `r >= floorR`.
   - Target: L3 and L4 do not scroll at 393x660, 360x640 or 375x553, and #spinLeague bottom ≤ viewport height.
2. **`visual-assets/v10_1/final-winner/final-winner.css`**, the phone block at about line 1087, `.finalWinnerTopbar { display: none; }`.
   - Change: replace it with a fixed bottom bar: `.finalWinnerTopbar { display:flex; position:fixed; left:0; right:0; bottom:0; height:56px; z-index:40; }`. Hide `.finalWinnerBrand` inside it and keep the 5 tab buttons at ≥44 px.
   - Target: every FW frame has a way out on phone. The tabs stay inside 393 px. The FW4 close button stays above the bar.
3. **`visual-assets/v10_1/season-results/season-results.css`**, about line 1455, `.entry-panel .field-row input[type="number"]`.
   - Change: `min-height: 28px; height: 28px` → `min-height: 40px; height: 40px`. Make up the space by setting `.entry-panel .manager-fields { gap: 2px 10px; }` in the same rule block.
   - Target: inputs ≥40 px tall at 393x660 and 360x640 (a 44 px tap area including the label row), with no page scroll.
4. **`visual-assets/v10_1/showcase/routes.json`**, `navigation.inScreenLinks`.
   - Change: add the 5 forward links `startJoinToLeague` (start-join → league L1), `leagueToClub` (league → club CL1), `clubToTransfer` (club → transfer-war F1), `transferToSeasonResults` (transfer-war → season-results SR1) and `finalWinnerToLegacy` (final-winner → legacy LG1), each with `"preview": true`.
   - Target: every Flow hop above reads present.
5. **`visual-assets/v10_1/rule-book/index.html`**.
   - Change: load the shared phone bar the way Standings does, with the `shared/navbar/navbar.css` link, the `shared/navbar/navbar.js` script and the same `SDNav.mount({nav:{active:"rules",locked:false,reason:null},routes:{…}})` call as standings/index.html line 93 (routes paths adjusted).
   - Target: the RULES tab is active and the bar is 56 px at 393x660.
6. **`visual-assets/v10_1/career-statistics/index.html`**.
   - Change: the same shared phone bar as item 5, with `active:"stats"`.
   - Target: the STATS tab is active, the bar is 56 px, and nothing hides behind it. If the last row would sit under it, also reserve 56 px of bottom padding in that same file's inline `<style>`, or leave a note for Claude.
7. **`visual-assets/v10_1/trophy-room/trophy-room.css`**, the phone media query, the container of `.trophyTab` buttons.
   - Change: add a right-edge fade, `mask-image: linear-gradient(to right, #000 85%, transparent)`, so the sideways tabs read as scrollable.
   - Target: DOMESTIC CUPS and CHAMPIONS LEAGUE are hinted at 393 px.
8. **`visual-assets/v10_1/tr2/slice-02-plate/plate.css`**, the phone media query.
   - Change: place `.timer-text` inside the viewport (for example in the top-right of the header row, 14 px, gold).
   - Target: 11:42 is visible on F1, F1D, F1R and F1DR at 393x660 and 360x640.
9. **`visual-assets/v10_1/settings/settings.css`**, the phone media query.
   - Change: `#creditAuthor, #creditLicense { display:inline-block; min-height:24px; padding:6px 2px; }`.
   - Target: the credit links are ≥24 px tall (inline-link exception) and the panel still shows DONE pinned.

Left out on purpose:
- The Club "RIVALRY" kicker is decorative; the VS badge shows.
- The Settings ST7 chip is a preview-only frame label.
- The Legacy carousel is by design.
- Small titles on Trophy Room and Career Statistics are accepted.

## Fix round

### Items done

- Items 1–3: DONE in job 106; Claude intake PASS on League, Final Winner and Season Results.
- Items 4–6: DONE in job 227; Claude intake PASS on showcase flow links, Rule Book and Career Statistics phone navigation.
- Item 7: DONE in job 228; Trophy Room phone `.trophyTabs` now has `mask-image: linear-gradient(to right, #000 85%, transparent)` to hint the off-screen filters.
- Item 8: DONE in job 228; Transfer War phone `.timer-text` is fixed inside the viewport at the top-right, 14 px and gold for WINDOW_OPEN frames.
- Item 9: DONE in job 228; Settings phone `#creditAuthor` and `#creditLicense` are inline-block links with 24 px minimum height and 6 px vertical padding.

### Items blocked

- None.

### Claude must re-measure

- Trophy Room at 393 × 660: confirm the right-edge fade hints DOMESTIC CUPS and CHAMPIONS LEAGUE without changing the 44 px tab geometry.
- Transfer War F1, F1D, F1R and F1DR at 393 × 660 and 360 × 640: confirm 11:42 is visible inside the viewport.
- Settings at 393 × 660 and 360 × 640: confirm both credit links are at least 24 px tall and DONE remains pinned.

### Left for pass 2

- None. The fix list ends at item 9.


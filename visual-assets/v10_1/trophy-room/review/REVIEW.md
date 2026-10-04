# Trophy Room Review · JOB-059

## Verdict

## Scorecard

## Hard gates

## Evidence

### Claude measurement carryover

| Gate | Evidence |
| --- | --- |
| H5 · Phone fit | NOT MEASURED (Claude measures). JOB-058 records arithmetic-only height budgets of 0 px overflow at 393×660, 360×640 and 375×553, with BACK at y=445–489 and the shared bar starting at y=497 for 375×553, but its own note explicitly says Claude must measure the real browser. Source: `project-documents/factory/status/JOB-058.md`. |
| H6 · Input size / contrast | NOT MEASURED (Claude measures). JOB-058 confirms 44 px controls and no text-entry inputs by reading, but no Claude contrast ratio is recorded. Source: `project-documents/factory/status/JOB-058.md`. |
| H7 · Reduced motion | NOT MEASURED (Claude measures). No Claude intake measurement is present in JOB-057, JOB-058, `evidence/QA_SUMMARY.md`, or `evidence/scores.json`. |
| H8 · Keyboard / focus | NOT MEASURED (Claude measures). JOB-057 reports a desktop keyboard/focus audit and JOB-058 documents focus-ring CSS by reading, but no Claude intake tab-through result is posted for the combined desktop/phone review. Sources: `project-documents/factory/status/JOB-057.md`, `project-documents/factory/status/JOB-058.md`. |
| H9 · Console / failed requests | NOT MEASURED (Claude measures). JOB-057 reports clean desktop console/request evidence, but there is no Claude intake browser log for the current desktop+phone build. Source: `project-documents/factory/status/JOB-057.md`. |
| H10 · Mockup diff | Desktop measurement carried from JOB-057: face scores 0.976 / 0.982, hand scores 0.979 / 0.972, build SSIM 0.512 versus plate SSIM 0.527, and ΔE 12.1; JOB-057 records this gate as PASS. Phone has no H10 measurement posted. Source: `project-documents/factory/status/JOB-057.md`. `visual-assets/v10_1/trophy-room/evidence/scores.json` is not present. |
| H11 · First-paint weight | Desktop measurement carried from JOB-057: 855,932 encoded bytes (~835.9 KiB), under the 900 KiB desktop gate. JOB-058 gives only a phone-art maximum of 253,986 bytes and explicitly leaves the full phone first-paint total for Claude, so phone is NOT MEASURED. Sources: `project-documents/factory/status/JOB-057.md`, `project-documents/factory/status/JOB-058.md`. |

Evidence files checked for this step: `visual-assets/v10_1/trophy-room/evidence/QA_SUMMARY.md` and `visual-assets/v10_1/trophy-room/evidence/scores.json` are not present on the branch.

### Mockup differences

Approximate mockup positions below are read from the supplied 1648×928 `MOCKUP_TROPHY_ROOM.png`; code values are the authored CSS geometry.

- Title block · mockup: centered at about x 35–64%, y 12–24% with eyebrow, gold brush `TROPHY ROOM`, and tagline. Code: `.trophyTitleBlock` x 34.7–64.3%, top 10.8%, height 14.5%, with the same three-part hierarchy. Difference: code begins about 1% higher and is slightly wider; wording matches TRUTH.md.
- Daniel manager area · mockup: full figure occupies roughly x 9–35%, y 11–65%, on the left. Code: the desktop figure remains in the registered scene plate while `.managerRegistration--daniel` is only a QA box at left 19%, top 14%, 9.2% × 20.6%. Difference: no separate DOM figure is positioned; the protected plate preserves the mockup placement. Phone intentionally recomposes Daniel at left 29%, top 1.5%, height 59% per TRUTH.md.
- Nik manager area · mockup: full figure occupies roughly x 67–91%, y 11–65%, on the right. Code: the desktop figure remains in the registered scene plate while `.managerRegistration--nik` is only a QA box at left 68%, top 14%, 9.2% × 20.6%. Difference: no separate DOM figure is positioned; the protected plate preserves the mockup placement. Phone intentionally recomposes Nik at left 71%, top 1%, height 60% per TRUTH.md.
- Manager side callouts · mockup: handwritten Daniel and Nik identity/slogan lettering sits beside both figures. Code: no matching baked side-callout panel or image exists; manager/rank identity is live UI. Difference is intentional because TRUTH.md forbids baked manager names/data.
- Top navigation panel · mockup: a large dark top navigation bar spans about x 0–60%, y 3–8% and includes HOME, CAREER, STANDINGS, STATS, RULES and duplicate ABOUT, with search/profile/settings controls at the right. Code: local Trophy Room CSS supplies only `.topbarReserve` at 52 px high. Difference: this screen does not recreate the mockup navigation locally; TRUTH.md requires the shared HOME / CAREER / STANDINGS / STATS / RULES + settings system and drops ABOUT/search/profile destinations.
- Career sub-navigation panel · mockup: `CAREER HUB > TROPHIES | TRANSFERS | HISTORY | RECORDS` occupies about y 8–12%. Code: no such panel or controls are authored. Difference: exact intentional DROP per TRUTH.md.
- Hero ceremony panel · mockup: central trophy spans about x 38–62%, y 25–64%. Code: `.heroCeremony` is left 36.3%, top 27%, width 27.4%, height 38%. Difference: code is roughly 2% lower and slightly wider while keeping the same central hierarchy.
- Hero plinth/nameplate · mockup: black/gold plinth fills roughly the lower quarter of the hero trophy with `SHOWDOWN CHAMPION`. Code: `.heroPlinth` is 27% of the ceremony height at its bottom with live DOM nameplate text. Difference: geometry is close; code replaces baked wording with live text as required by TRUTH.md.
- Career-rank panels · mockup: no rank cards are present in the lower manager area. Code: `.careerRanks` occupies top 52.2%, x 12–88%, height 8%, with Daniel and Nik rank cards. Difference: contract-backed career standings are added per TRUTH.md rather than copied from the mockup.
- Trophy shelf outer panel · mockup: gold-edged cabinet spans about x 8–92%, y 65–87%. Code: `.trophyShelf` spans x 8–92%, top 65.5%, bottom 13.5% (ending at 86.5%). Difference: essentially the same footprint, with code ending about 0.5–1% higher.
- Category tab panel · mockup: six tabs, `ALL · SHOWDOWN · LEAGUE · DOMESTIC CUPS · CONTINENTAL · SPECIAL`, sit directly above the shelf. Code: `.trophyTabs` is a five-column strip 35 px high at 34 px above the shelf. Difference: TRUTH.md changes the set to `ALL · SHOWDOWN · LEAGUE TITLES · DOMESTIC CUPS · CHAMPIONS LEAGUE`; `SPECIAL` is dropped and `CONTINENTAL` is replaced.
- Trophy-card panel · mockup: six per-competition cards show Premier League, Champions League, LaLiga, FA Cup, Copa del Rey and Supercopa counts. Code: `.trophyGrid` is four columns with four original trophy-family cards. Difference: intentional TRUTH.md replacement with Showdown Champion, League Title, Domestic Cup and Champions League, each with Daniel count first/left and Nik second/right; Super Cup and per-league splits are dropped.
- Record ribbon panel · mockup: no all-time record ribbon appears inside the trophy cabinet. Code: `.recordRibbon` occupies the bottom 21% of the shelf and has five record columns plus heading. Difference: the five contract record families are added per TRUTH.md; partial state changes the heading to available-record wording.
- Partial-state notice panel · mockup: no provider-coverage notice exists. Code: `.stateNotice` is a 28 px banner at top 3% of the shelf, x 20–80%. Difference: added to tell the truth about partial provider history and coverage.
- Loading/unavailable panel · mockup: no loading or unavailable treatment exists. Code: `.statePanel` fills inset 12% 16% of the shelf. Difference: added for required `loading` and `unavailable` states; zero trophies are not fabricated.
- Fatal-state panel · mockup: no fatal overlay exists. Code: `.fatalState` begins around 40% viewport height with 20% side insets. Difference: defensive application-state UI, not a mockup element.
- BACK button · mockup: centered at about x 42–58%, y 88–93%, with dark fill and gold border. Code: `.trophyBack` is left 41.5%, width 17%, bottom 7.4%, height 46 px. Difference: essentially matches the mockup geometry and keeps live wording `BACK` per TRUTH.md.
- Phone MORE / CLOSE button · mockup: no phone composition or MORE control is shown. Code: `.trophyPhoneMoreButton` is 78 × 44 px, right 12 px, pinned 64 px plus safe area above the bottom bar. Difference: phone-only secondary control added to move career ranks/records into a compact sheet.
- Phone details sheet panel · mockup: no phone sheet exists. Code: `.trophyPhoneSheet` spans left/right 10 px, top 48%, bottom 116 px plus safe area. Difference: phone-only composition keeps secondary career data off the always-visible rail, consistent with TRUTH.md's no-scroll phone requirement.
- Phone navigation reserve panel · mockup: no phone bottom bar is shown. Code: `.trophyPhoneNavReserve` is 56 px plus safe-area inset at the bottom. Difference: required shared hub reserve from TRUTH.md.



### Code audit

- Manager order · `fixtures.json#frames.*.managerOrder` and `trophy-room.js#ranking()`: preview frames declare `["daniel","nik"]`, while ranking renders the hard-coded order `["daniel","nik"]`; Daniel remains first and Nik second even in TR7 where Nik leads.
- Trophy counts · `trophy-room.js#trophyCard()` / `.managerCounts`: Daniel is emitted in the first count cell with `data-side="daniel"` and Nik in the second with `data-side="nik"`; this preserves left/right order on every trophy card.
- Allowed trophy families · `trophy-room.js#TROPHIES`: only Showdown Champion, League Title, Domestic Cup and Champions League are renderable; no Super Cup, extra European cup, real-league split or SPECIAL statistic is invented.
- Allowed records · `fixtures.json#strings.recordLabels` and `#frames.*.records`, rendered by `trophy-room.js#recordRibbon()`: the fixtures use only highest season score, highest league points, most league goals, biggest Showdown win and perfect 11-point seasons, matching TRUTH.md.
- Honest empty state · `fixtures.json#frames.TR2` plus `trophy-room.js#trophyCard()`: the successful empty read carries real zeroes, all four cards remain present, and a zero/zero family gets `.is-unwon` plus the fixture string `Not won yet`.
- Honest partial state · `fixtures.json#frames.TR3` plus `trophy-room.js#statePanel()` / `#recordRibbon()`: coverage 2/3 is shown, the partial message is explicit, and the records heading becomes fixture-backed `AVAILABLE RECORDS` rather than an all-time claim.
- Honest unavailable/loading states · `fixtures.json#frames.TR5/TR6` plus `trophy-room.js#shelf()`: `noData` suppresses `.trophyGrid` and `.recordRibbon`, so failed or in-flight provider reads never display fake zero trophy counts or record values.
- Changing data source · `trophy-room.js#ranking()`, `#trophyCard()`, `#recordRibbon()`, `#statePanel()`: display names, ranks, career points, season wins, trophy counts, record labels/values/holders and provider-state copy are read from `fixtures.json` / the selected frame. Hard-coded text is limited to stable brand/UI copy such as the eyebrow, tagline and plinth subline.
- Buttons/behaviour · `trophy-room.js#tabs()` and `#back()`, plus `index.html#trophyPhoneMoreToggle`: the only local interactive controls are five real category buttons, BACK, and the phone career-details toggle; no dead mockup ABOUT, search, profile, SPECIAL or unsupported manager-filter button is reproduced.
- Accessible title and names · `index.html#trophyRoom`, `trophy-room.js#titleBlock()`, `#tabs()`, `#shelf()`, `#back()`: the section is labelled by the visually hidden `h2#trophyRoomScreenTitle`; tablist, shelf and career standings have accessible labels; tab and BACK names come from visible fixture text.
- Phone details naming · `index.html#trophyPhoneMoreToggle` / `#trophyPhoneSheet`: the checkbox has `aria-label="Toggle career details"` and `aria-controls="trophyPhoneSheet"`; the sheet is labelled by `#trophyPhoneSheetTitle`. The rank/record nodes themselves remain inside `#trophyRoomContent` and are visually moved over the sheet by CSS rather than being DOM children of the controlled aside, so the `aria-controls` relationship does not fully contain the details it describes.
- Focus order · `index.html#trophyPhoneMoreToggle` and base `.visually-hidden` CSS: the phone-only checkbox is not hidden with `display:none` on desktop, so it remains a focusable 1×1 clipped control before `#trophyRoomContent` in desktop tab order. This is a real accessibility/polish defect even though the visible phone label is desktop-hidden.
- Focus continuity · `trophy-room.js#render()`: category activation rewrites all of `#trophyRoomContent.innerHTML`; the pressed `.trophyTab` node is destroyed and recreated, so keyboard focus is not deliberately restored to the active tab after selection.
- Focus rings · `trophy-room.css .trophyTab:focus-visible`, `.trophyBack:focus-visible`, and `.phoneMoreToggle:focus-visible ~ .trophyPhoneMoreButton`: all visible interactive surfaces have an authored 3 px focus indication when their underlying control has focus.
- Phone target sizes · `trophy-room.css @media (max-width:760px)`: `.trophyTab` is 44 px high with 88 px minimum width, `.trophyBack` is 44 px high, and `.phoneMoreToggle` is 78 × 44 px; the screen has no text-entry control, so the 16 px input-font floor is not applicable.
- Phone order · `trophy-room.css .trophyPhoneHero--daniel/.trophyPhoneHero--nik`: Daniel is fixed left at 29% and Nik right at 71%; the rank/cards do not swap when career rank changes.
- Image hygiene · `index.html .trophyPhoneBackdrop/.trophyPhoneHero`, `trophy-room.js#picture()`, `#titleBlock()`, and `#boot()`: runtime image references are WebP only (`ENV_TR_PHONE_V1.webp`, phone cutout WebPs, original trophy WebPs, `TITLE_TR_V1.webp`, and 1X/2X plate WebPs); no PNG master is loaded.
- No live data in images · `trophy-room.js#trophyCard()`, `#ranking()`, `#recordRibbon()`: manager names, ranks, counts, points, wins and records are DOM text; image assets are static title/trophy/scene art and do not carry changing career values.

## Fix list

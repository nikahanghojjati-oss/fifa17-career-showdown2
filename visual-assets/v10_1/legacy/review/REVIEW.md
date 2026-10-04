# Legacy (History) review

## Verdict

FAIL. Static score 3.00 < 4.2, criteria 7 and 9 below 3, and H4 fails the source audit. H5–H11 are NOT MEASURED (Claude measures), not failed measurements. This review covers code and the supplied mockup; Claude must render and measure before a visual acceptance verdict.

## Scorecard

Provisional code-based static scores; no rendered-screen claim. Criterion 8 is deferred to motion jobs. Average: 27 / 9 = 3.00, below 4.2; criteria 7 and 9 are below 3.

| Criterion | Score / 5 | Evidence |
| --- | --- | --- |
| 1 Mockup fidelity | 4 | Registered title at 49.91%/13.82% and shared plate preserve the intended composition; archive bounds differ modestly, and the single populated row is a documented truth override. |
| 2 Character depth | 3 | HTML has registered foreground/rim layers above UI and CSS contact shadows, but raster edges and registration were not inspected. |
| 3 Hands/contact | 3 | Shared registered overlays and no mirror transforms preserve the hand-on-chin design in code; actual hand edges/contact await Claude. |
| 4 Lighting/grade | 4 | Gold glass edge, dark gradients, directional rims and warm phone grade implement the reference lighting language in source. |
| 5 Typography/title | 3 | WebP LEGACY title and hidden heading are correct; phone pseudo-labels and very small status/body labels weaken consistency and readability. |
| 6 Panel craft | 3 | Shared glass panel and selected-card glow are present, but initials shields/league text replace required original artwork and phone pager track is undersized. |
| 7 Information honesty/clarity | 2 | LG1–LG9 copy is honest, but stale selection, indistinguishable winner glyph and missing expanded statistics make the retained action misleading/incomplete. |
| 9 Phone composition | 2 | Claude's 55% art band and pinned action are preserved, but compact state banners overlap cards, pager targets exceed their row and swipes do not select. |
| 10 Polish/finish | 3 | Shared kit and WebP references are consistent, but inert routes, missing sheet close/focus and a silent visible-load failure prevent completion. |
## Hard gates

Static-source review only for H1–H4; PASS is limited to inspected DOM/CSS/fixture references, not an assertion about uninspected raster pixels.

| Gate | Result | Evidence |
| --- | --- | --- |
| H1 | PASS (code scope) | renderCard/renderSeasonHistory preserve Daniel left, Nik right; phone CSS final Daniel left 4%, Nik 47%; no mirror transforms. Raster alignment remains Claude's check. |
| H2 | PASS (code scope) | Screen references only original Legacy WebP assets; club initials and league abbreviations contain no real logos; no player photo references. Original identity requirement is a separate fix. |
| H3 | PASS (code scope) | Changing names, numbers and states are inserted with textContent; image sources are static scene/title/cutouts. Asset pixels not independently inspected. |
| H4 | FAIL | Audit A07–A14: inert/wrong route controls, off-page selection and incomplete/inaccessible season disclosure do not fulfil TRUTH's retained real actions. |
| H5 | NOT MEASURED (Claude measures) | Evidence has no measured scroll/button rectangles. |
| H6 | NOT MEASURED (Claude measures) | Evidence has no measured body contrast; no current inputs. |
| H7 | NOT MEASURED (Claude measures) | Evidence has no emulated reduced-motion result. |
| H8 | NOT MEASURED (Claude measures) | Evidence has no keyboard traversal result. Code defects are separately listed, not a fabricated measurement. |
| H9 | NOT MEASURED (Claude measures) | Evidence has no browser request/console log. |
| H10 | NOT MEASURED (Claude measures) | evidence/scores.json absent; no numeric mockup-diff scores. |
| H11 | NOT MEASURED (Claude measures) | Evidence has no first-paint network measurement. |

## Evidence

Sources checked for Claude-carried measurements:

- `project-documents/factory/status/JOB-072.md`: Claude intake records `PASS 4.2` and the build-fix intake note, but it does not record numeric H5, H6, H7, H8, H9, H10, or H11 measurements.
- `project-documents/factory/status/JOB-073.md`: Claude intake records `PASS` and the phone-art clipping fix, but it does not record numeric H5, H6, H7, H8, H9, H10, or H11 measurements.
- `visual-assets/v10_1/legacy/evidence/QA_SUMMARY.md`: not present on `factory/v1-wtt5ye`.
- `visual-assets/v10_1/legacy/evidence/scores.json`: not present on `factory/v1-wtt5ye`.

| Gate | Claude-carried result | Source |
| --- | --- | --- |
| H5 · phone scroll / primary visibility at each required size | NOT MEASURED (Claude measures) | No Claude measurement in `project-documents/factory/status/JOB-072.md` or `project-documents/factory/status/JOB-073.md`; `visual-assets/v10_1/legacy/evidence/QA_SUMMARY.md` absent |
| H6 · input font size / body-text contrast | NOT MEASURED (Claude measures) | No Claude measurement in the two intake status files; `visual-assets/v10_1/legacy/evidence/QA_SUMMARY.md` absent |
| H7 · reduced motion | NOT MEASURED (Claude measures) | No Claude measurement in the two intake status files; `visual-assets/v10_1/legacy/evidence/QA_SUMMARY.md` absent |
| H8 · keyboard reachability / focus | NOT MEASURED (Claude measures) | No Claude measurement in the two intake status files; `visual-assets/v10_1/legacy/evidence/QA_SUMMARY.md` absent |
| H9 · console errors / failed requests | NOT MEASURED (Claude measures) | No Claude measurement in the two intake status files; `visual-assets/v10_1/legacy/evidence/QA_SUMMARY.md` absent |
| H10 · mockup-diff scores | NOT MEASURED (Claude measures) | `visual-assets/v10_1/legacy/evidence/scores.json` absent; no numeric H10 scores in either intake status file |
| H11 · first-paint page weight | NOT MEASURED (Claude measures) | No Claude network-weight measurement in the two intake status files; `visual-assets/v10_1/legacy/evidence/QA_SUMMARY.md` absent |

Worker arithmetic and estimates already present in JOB-072/JOB-073 were not promoted to Claude measurements.

### Mockup differences · JOB-165

Reference opened directly: project Files `MOCKUP_LEGACY_V2.png`, 1672 × 941. Code inspected: `index.html`, `legacy.css`; product overrides checked against `TRUTH.md`. Coordinates below are source-image estimates or explicit CSS values, not rendered measurements. Runtime text/behaviour is deferred to the JS review.

| Element | Mockup value | Code value / truth decision |
| --- | --- | --- |
| Scene / managers | Daniel left (head about x 14–28%), hand at chin; Nik right (head about x 70–84%) | Shared registered plate and separate Daniel/Nik foreground/rim layers; no mirroring rule in screen CSS. Binary alignment and hands require Claude inspection. |
| Title | LEGACY brush art, x 570–1099, y 130–274 | WebP title plus hidden LEGACY heading; left 49.91%, top 13.82%, width 31.64%. Same nominal registration. |
| Eyebrow / crown | Crown above CAREER MODE SHOWDOWN 17, eyebrow around y 119 (12.65%) | Empty fixture-populated paragraph at 9.60%, lifted 3.05 percentage points by Claude intake. No separate crown node in HTML; asset pixels unverified. |
| Tagline | PAST SHOWDOWNS. A LASTING JOURNEY., y about 278 | Fixture-populated paragraph at 29.54%, width 25.6%, centered. Exact runtime wording awaits JS/fixtures. |
| Top brand / nav panel | Angular split top rail, CM17, HOME / CAREER / STANDINGS / STATS / RULES / ABOUT; search, settings, profile | Full-width gradient rail, height 6.9%, minimum 52px; fixture-populated brand/nav and Settings. ABOUT/search/profile removed per truth; 6.9% exceeds the 52px contract on taller desktop viewports. |
| More Than A Game | Handwritten slogan at upper right within the top band | Slogan element top 112% of nav, right 1.6%; deliberately below nav instead of inside its band. |
| Archive outer panel | Approximately x 58–1614, y 388–766 in the supplied V2 | CSS comments use x 57–1590, y 382–755; actual CSS left 3.41%, top 40.60%, width 91.69%, height 39.63%. Right edge about 24px inward and bottom about 11px higher at source size. |
| Side destination panel | About x 59–331, full archive height, five rows | Relative left .07%, top .5%, width 17.55%, height 99%; three destinations only, as truth requires. |
| LEGACY ARCHIVE button | Gold active first row | Dynamic button area; active selector gold fill, min-height 58px, 12px top margin. Retained. |
| TROPHY CABINET button | Second row | Truth requires TROPHY ROOM; dynamic menu has no static string in HTML. Phone visible pseudo-label TROPHIES differs from that exact label. |
| MANAGER RECORDS button | Third row | Truth requires RECORDS; phone pseudo-label RECORDS. |
| TRANSFER HISTORY / CHALLENGE TRACKER | Fourth and fifth rows | Omitted by truth because no supported route exists. No static controls in HTML. |
| Showdown cards | Four columns × two filled rows, eight cards | Four-column desktop grid; auto rows consume whole field with four cards per fixture page. Allowed truth override for eight records over two pages, but a visibly taller populated row. |
| Card bounds / gutters | Card field about x 340–1582, y 399–731, roughly 10px gaps | Relative left 18.13%, top 2.68%, right 2.02%, bottom 8.85%, 12px gap; comments use slightly inset bounds. |
| Card heading / score / metadata | Showdown number, variable manager order, real crests, real league logos, totals and completion dates | HTML grid starts empty; CSS supports heading, tabular score, left/right manager cells and footer. TRUTH requires Daniel then Nik, original marks and contracted season counts without dates; verify JS separately. |
| Selected card | First card bright gold perimeter and glow | data-selected=true uses gold border, inset edge and 18px gold glow. Preserved. |
| Pager buttons / dots | Outer left/right arrows plus three dots below cards | Pager inside archive content column; 32px arrows, 12px dots on desktop. Phone portrait overrides each button to 44px but the track remains 24px tall, creating overlap risk to resolve. |
| Bottom local-backup panel / Export | Backup status block and EXPORT BACKUP | Absent, as online-history truth requires. |
| Primary button | VIEW SEASON HISTORY amid the bottom controls | One centered primary at top 82.10%, minimum 280 × 52px; static hook and disclosure semantics preserved, text fixture-populated. |
| DELETE SHOWDOWN / DELETE ALL / RESET ALL | Three destructive controls across lower row | All absent as required. No destructive action introduced. |
| Footer panel / slogans | Full-width footer at y about 883 with repeated CM17 and slogans | Removed per truth; phone reserves 56px plus safe area for shared hub navigation. |
| Season-history panel | No open disclosure pictured | Hidden bounded .legacySeasonHistory sheet added for the retained real action; desktop max-height 31%, phone max-height min(62dvh,420px). Close control/focus behaviour requires JS inspection. |
| Loading / empty / unavailable | No state examples in reference | State banner and CSS hide cards/pager for those states; fixture logic must supply honest copy. |
| Partial / interim / completion pending / abandoned | No examples in reference | Compact state banner and status-card styles added; phone compact banner shares the card area (top 52px, bottom 32px), risking readable-card obstruction. |
| Preview label | None | Dedicated hidden-by-default Preview data hook, positioned above archive when populated; required fixture disclosure. |
| Phone manager areas | No phone reference supplied | Portrait WebP scene and two non-mirrored hero elements. Preserved Claude 55% art band, UI top 0, title below faces; final Daniel left 4%, Nik left 47%. |
| Phone title | Desktop-only reference | Title container 55% high; final eyebrow 50%, wordmark 57%, tagline 83% of that container. Claude's face-clearance fix retained. |
| Phone panels / action | Desktop-only reference | Tabs plus horizontal snap shelf; 48px primary above 56px navigation reserve. Cards use .67rem manager names, .54rem status and smaller optional labels; short-phone clipping/readability needs review. |
| Responsive boundary | No intermediate viewport reference | Desktop panel placement begins at min-width 1024px; phone ends at max-width 900px. Widths 901–1023 lack either archive placement system. |

No screen code, assets, strings or fixture values changed in this part. H5–H11 remain NOT MEASURED (Claude measures).

### Code audit · JOB-166

Scope: `legacy.js`, `fixtures.json`, `index.html`, `legacy.css`, compared with `TRUTH.md`. Static findings are distinct from unmeasured runtime gates.

| ID | Finding and evidence |
| --- | --- |
| A01 | PASS role order: `legacy.js renderCard()` iterates ["daniel","nik"], inserts score between them; `renderSeasonHistory() .legacyHistoryRow` appends Daniel, divider, Nik. All LG1–LG9 fixtures use role keys. |
| A02 | PASS recorded values: `fixtures.json frames.*.showdowns` supplies totals, accepted-season details and contracted statuses. No clean sheets, player stats, invented dates, transfer counts, local backup/reset/delete controls rendered. Fixture numbers unchanged in review. |
| A03 | PASS frame copy: `applyFrameState()` draws LG4 empty, LG6 unavailable, LG7 loading and LG8 coverage (2 of 3) separately. LG5 exact interim label and every frame's Preview data tag are present. |
| A04 | PASS status-only rows: `renderCard()` returns before totals/seasons for abandoned/unavailable; LG3 abandoned and LG8 unreadable fixtures have neither totals nor seasons. LG9 uses Completion pending. |
| A05 | FIX fixture text: `renderCard(), leagueLabel(), renderSeasonHistory(), renderArchive()` hard-code manager labels, Showdown/Season labels, league abbreviations, in-progress copy and pager accessible names rather than reading strings; phone CSS pseudo-content replaces real labels with ARCHIVE/TROPHIES. |
| A06 | FIX original identity: `renderCard() .legacyCrest/.legacyLeagueMark` uses generic initials shields and abbreviated text, not the required original getClubCrestSvg/getLeagueMark artwork. No prohibited real logo URLs appear, but specified identity art is absent. |
| A07 | FIX route controls: `renderSideMenu()` emits records instead of TRUTH's careerStatistics; top nav lowercases labels into home/career/stats/rules. `index.html` loads only stage/motion/legacy scripts; `legacy.js` binds no navigation click handler. Route buttons are inert in this standalone build, and the phone has only an empty nav-reserve. Use documented routes/working preview destinations, not invented routes. |
| A08 | FIX current selection: `renderArchive().paint()` changes pages without choosing a card on the new page; `viewSeasonHistory` remains tied to the off-page selection. Disabled state is computed only once in boot. Guard allowed statuses on every disclosure, not only season-array existence. |
| A09 | FIX keyboard focus: `paint()` destroys the focused card/pager button on selection or pagination without restoring focus. Browser tab order loses its place. Preserve stable nodes or explicitly restore the initiating/new selection control. |
| A10 | FIX phone swipe: `#legacyCardGrid` has scroll snap in CSS but no scroll/scrollend/keyboard synchronization with ui.selectedShowdown; swiping can show one card while the primary action opens another. Prev/next currently change a four-card page rather than the visible card. |
| A11 | FIX disclosure: `renderSeasonHistory() #legacySeasonHistory` creates heading and rows only; no close button, Escape handler, focus transfer or return. Phone sheet z-index 40 can cover the opener; retained action alone is not a reliable close mechanism. |
| A12 | FIX detail completeness: `renderSeasonHistory() .legacyHistoryRow` shows only season number and score; fixture-provided league position, league points and goals documented by TRUTH are missing from expanded history. Do not invent honours booleans absent from the contracted history model. |
| A13 | FIX winner name: `.legacyWinner` renders the same centered chess glyph for either winner with only a data-winner attribute; no visible or accessible winner text. Draw/in-progress should not imply a completed winner. |
| A14 | FIX failure visibility: `boot().catch()` places "Fixture load failed" only in visually hidden frame label and the hidden debug tree. A real fetch/map error leaves a blank archive instead of visible unavailable copy. |
| A15 | Target styles only, NOT MEASURED: `legacy.css` portrait ≤760px gives tabs/pager 44px and action 48px. Widths 761–900 still apply scale(.72) to 44px pager buttons (31.68px visual targets); portrait pager track is only 24px tall. Fix allocation, not just min-height. |
| A16 | PASS input code scope: `index.html` and `legacy.js` create no inputs. Defensive `.legacySeasonHistory input/select/textarea` declares 16px in the narrow portrait breakpoint; actual contrast H6 is NOT MEASURED. |
| A17 | Focus style intent: `legacy.css` declares focus-visible rings on menu, cards, pager, primary and desktop nav; H8 remains NOT MEASURED because keyboard traversal was not run and A09/A11 exist. |
| A18 | PASS source format scope: `index.html picture` and JS stage/foreground references end in .webp; no PNG master URL is loaded directly by these files. CSS hiding pictures does not guarantee no network download; shared stage may still load desktop assets on phone. H11 remains NOT MEASURED. |
| A19 | Data remains DOM: `renderCard(), renderSeasonHistory(), applyFrameState()` use textContent for changing fixture values. No dynamic raster generation. Plate/title binary contents were not inspected, so image-level H2/H3 are not independently certified. |
| A20 | FIX partial/interim placement: `legacy.css .legacyStateBanner[data-compact=true]` at phone top 52px/bottom 32px shares the card grid area and z-index 5; warning and readable records need distinct space. |
| A21 | FIX responsive range: `legacy.css @media(min-width:1024px)` leaves 901–1023 outside both layouts; topbar also uses 6.9% rather than exactly 52px. Preserve Claude's final phone band rules. |
| A22 | Preview-only boundary: `boot()` loads labelled fixtures and exposes LegacyFixture; it does not read provider/private or local-storage history. Wiring real provider history stays with Team G/integration. |

No browser, screenshots, visual score or fixture arithmetic validation claimed in this audit.

## Fix list

Exactly nine implementation changes, grouped for jobs 75 / 168 / 169. No missing browser measurements are fix items. Preserve the final Claude 55% phone-band/title rules and all fixture scores.

1. `visual-assets/v10_1/legacy/legacy.js`, `renderArchive()`: replace the fragmented selection flow with one synchronized selection controller. Target: page changes select a visible permitted record; phone swipe/previous/next select the visible card; ui.selectedShowdown and LegacyFixture agree; action disabled state updates; card/pager focus survives repaint; abandoned/unavailable never disclose.
2. `visual-assets/v10_1/legacy/legacy.js`, `renderSeasonHistory()`: replace the incomplete disclosure with a labelled, keyboard-accessible bounded season sheet. Target: sticky ≥44px close control, Escape closes, focus moves inside and returns, allowed-status guard, Daniel-first contracted position/points/goals and scores, no invented honours.
3. `visual-assets/v10_1/legacy/legacy.css`, phone archive layout: allocate non-overlapping space for tabs, warning, horizontal card shelf and a 44px pager. Target: exact DOM tab labels, no scale on targets, readable status-only cards and compact warnings without covering readable records at 393×660/360×640; primary stays pinned at 375×553; preserve Claude art/title rules.
4. `visual-assets/v10_1/legacy/legacy.js`, navigation setup: wire existing top/side/settings destinations and mount shared hub navigation through supported shared APIs. Target: documented route mapping including careerStatistics, working standalone preview links with host integration where available, no extra destinations, phone bottom bar above the existing reserve.
5. `visual-assets/v10_1/legacy/legacy.css`, desktop breakpoint/topbar: extend desktop placement to min-width 901px and make the desktop rail exactly 52px with a fitting 901–1023px layout. Target: no unstyled breakpoint interval, no offscreen nav, preserved 16:9 plate camera.
6. `visual-assets/v10_1/legacy/legacy.js`, `boot().catch()`: render a visible unavailable failure state. Target: retained shell, visible honest error copy, disabled primary and no fake cards/zero values after fixture/map load failure.
7. `visual-assets/v10_1/legacy/legacy.js`, `renderCard()`: use the existing original visual-identity module for club crests and league marks instead of generic initials/text. Target: supported original SVG API, lazy screen-only loading, no real logos or startup changes.
8. `visual-assets/v10_1/legacy/fixtures.json`, `strings`: add a renderer UI-copy dictionary for remaining hard-coded words. Target: manager names, card/season/pager templates, in-progress, close, unavailable fallback, and winner/draw messages; keep frames, checkSource and all numeric data byte-for-byte equivalent after JSON parse.
9. `visual-assets/v10_1/legacy/legacy.js`, label rendering: consume that dictionary throughout cards, season detail, pager and status UI, including a clear live winner label instead of an ambiguous centered glyph. Target: changing labels all fixture-driven; Daniel left/Nik right; no completed-winner claim for in-progress/abandoned/unavailable.

### Claude evidence still required

Per handbook, no worker screenshots or browser measurements were generated. Claude supplies H5–H11, the protected-region mockup diff and desktop/phone compare sheet using the committed screen; no numeric result is assumed. The review's source scores remain historical until re-review.

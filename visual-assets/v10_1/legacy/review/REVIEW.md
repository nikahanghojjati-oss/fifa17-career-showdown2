# Legacy (History) review

## Verdict

## Scorecard

## Hard gates

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

## Fix list

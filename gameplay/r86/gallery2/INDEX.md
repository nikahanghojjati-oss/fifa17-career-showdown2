# r86 gallery 2 — do not merge

Captured source: `claude-gameplay/r86-release` at **78968c3e85b0ca2bdfab583088a366605d91fe3f**, rechecked against the remote head. Comparison: [draft PR #1068](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1068), gallery source `fb38a6638d265859cc9433783fff11ef50d84e6c`.

Only this gallery directory is proposed. The gallery commit is based on `gameplay/r86` so the PR does not pull in release code, tests, Rules or workflows. The pictures themselves were all taken on the release head above.

Desktop **1440×900**, phone **390×844**; the same extra Home **440×956**, Select League **412×915**, and Rule Book **844×390** views as #1068. PNG palette compression preserves viewport dimensions. No old pictures were reused.

Method: repository static server and Gate screenshot helper for signed-out Home/Rules; repository CE2PG UI journey with Auth/Firestore emulators only (`demo-cms-browser-journey`, loopback). Local wrappers live outside the repository. Current composed Rules were built into scratch through redirected file access; no repository Rules file changed. Firebase SDK 12.17.0 was supplied locally. The primary run played all three seasons with the desktop and phone viewports, and disabled inter-season reloads. The extra one-season run supplied the long phone chip and lower published-review view. All close-state pictures were taken before the harness’s later storage-wipe/reload/fresh-browser phases. No production Firebase was used.

Special Player previews use local three.js r128 and the requested local Barlow Condensed / Big Shoulders Display fonts, Chrome for Testing 151.0.7922.34, and the shipped preview clock. Preview selectors are zero-based: index 0 is rank 1 Neymar, index 199 is rank 200 Bruma. White flash is intentionally washed out. Still frames do not prove the absence of transient flashes throughout gameplay.

Requested close inspection:

- **Rivalry Statistics, desktop and phone: PASS.** Both columns have the same name → SP → club order and matching row alignment. Both chips persist after automatic close without reload.
- **Season Results: PASS.** Each published manager card has that manager’s SP under the name. The lower phone picture comes from the extra one-season run (N. Fekir / K. Baldé Diao); the primary run uses A. Areola / A. Lacazette.
- **Standings after close: PASS on Career.** Both chips remain before reload; Standings was opened first, before other completed career pages. This Showdown correctly has no active Showdown after close; that empty tab is not evidence of chip persistence.
- **Career Statistics phone: PASS.** The extra run’s K. Baldé Diao wraps as `K. Baldé` / `Diao` inside the chip, without ellipsis or a mid-word split. This phone picture uses the extra completed one-season career; other career pictures use the primary three-season career.
- **Version: Settings PASS**, v1.9.10 / 1.9.10-r86. The footer DOM also reads v1.9.10; the shipped full-screen layout visually hides the footer, so no visible-footer screenshot is claimed and it was not forced into view.

Comparison with #1068:

- No product visual regression was identified in the matched settled screens. Different legal random SP draws, clubs, scores and winners are not regressions.
- Improved: symmetric Rivalry name/SP/club rows, chips under published review names, and long phone Career Statistics names wrap. The release version is now 1.9.10 rather than 1.9.9-r85. The lower phone Shared History panel is now included.
- Remaining limitations: Shared History manager text has no SP chips; desktop Career Statistics and compact Standings chips may abbreviate long names. These views are not covered by the phone Career Statistics wrapping fix. Phone published reviews require scrolling.
- Capture differences: settled preview timings and framing differ slightly from #1068; palette reduction can lose fine gradients. This is screenshot encoding, not a game change.

Uncaptured states: no SSJR strip / RELOAD NOW appeared; no image is fabricated. Live Rule Book manager-chip state was not retained; the Rule Book images show the real signed-out rules. The visually hidden version footer is checked as DOM text only.

Journey verification (separate from screenshot observations):

- Primary three-season run: **273/279, FAIL**, six desktop/phone full-text equality failures on Standings (`thisShowdownText` / `standingsCareerText`, including responsive headings and line breaks). No fatal error.
- Extra one-season run: **178/182, FAIL**, four equivalent Standings full-text equality failures. No fatal error.
- Both runs finished automatic close, storage-wipe/reload and fresh-browser checks. The numeric career/scoring checks pass; no test assertion was changed or weakened. This gallery does not claim a green test suite or production/physical acceptance.

| File | Size | Inspection / capture limit |
| --- | --- | --- |
| [career-start-desktop.png](career-start-desktop.png) | 1440×900 | Both real Special Players and their original FIFA 17 clubs. Phone modal continues below the viewport. |
| [career-start-phone.png](career-start-phone.png) | 390×844 | Both real Special Players and their original FIFA 17 clubs. Phone modal continues below the viewport. |
| [career-statistics-desktop.png](career-statistics-desktop.png) | 1440×900 | Completed career; manager SP chips. Desktop table may abbreviate a long name. |
| [career-statistics-phone.png](career-statistics-phone.png) | 390×844 | PASS: real K. Baldé Diao wraps onto two lines inside the chip, at a word boundary, with no ellipsis. Extra one-season run. |
| [final-winner-desktop.png](final-winner-desktop.png) | 1440×900 | Real three-season Showdown, automatically closed; winner and manager SP chips. |
| [final-winner-phone.png](final-winner-phone.png) | 390×844 | Real three-season Showdown, automatically closed; winner and manager SP chips. |
| [home-desktop.png](home-desktop.png) | 1440×900 | Fresh signed-out Home; seven tiles, no Showdown in progress; phone has no music strip. |
| [home-phone-440x956.png](home-phone-440x956.png) | 440×956 | Fresh signed-out Home; seven tiles, no Showdown in progress; phone has no music strip. |
| [home-phone.png](home-phone.png) | 390×844 | Fresh signed-out Home; seven tiles, no Showdown in progress; phone has no music strip. |
| [legacy-desktop.png](legacy-desktop.png) | 1440×900 | Completed three-season Showdown; manager SP chips. |
| [legacy-phone.png](legacy-phone.png) | 390×844 | Completed three-season Showdown; manager SP chips. |
| [rivalry-statistics-desktop.png](rivalry-statistics-desktop.png) | 1440×900 | PASS: both sides show manager name, then SP chip, then club on matching rows. Captured after final close, on the same page without reload; both chips remain. |
| [rivalry-statistics-phone.png](rivalry-statistics-phone.png) | 390×844 | PASS: both sides show manager name, then SP chip, then club on matching rows. Captured after final close, on the same page without reload; both chips remain. |
| [rule-book-desktop-section-03.png](rule-book-desktop-section-03.png) | 1440×900 | Shipped Rule Book, signed-out static capture. No live manager chips in these views; scrolled section views can omit the page title. |
| [rule-book-desktop-section-06.png](rule-book-desktop-section-06.png) | 1440×900 | Shipped Rule Book, signed-out static capture. No live manager chips in these views; scrolled section views can omit the page title. |
| [rule-book-desktop.png](rule-book-desktop.png) | 1440×900 | Shipped Rule Book, signed-out static capture. No live manager chips in these views; scrolled section views can omit the page title. |
| [rule-book-phone-landscape.png](rule-book-phone-landscape.png) | 844×390 | Shipped Rule Book, signed-out static capture. No live manager chips in these views; scrolled section views can omit the page title. |
| [rule-book-phone-section-02.png](rule-book-phone-section-02.png) | 390×844 | Shipped Rule Book, signed-out static capture. No live manager chips in these views; scrolled section views can omit the page title. |
| [rule-book-phone-section-03.png](rule-book-phone-section-03.png) | 390×844 | Shipped Rule Book, signed-out static capture. No live manager chips in these views; scrolled section views can omit the page title. |
| [rule-book-phone-section-04.png](rule-book-phone-section-04.png) | 390×844 | Shipped Rule Book, signed-out static capture. No live manager chips in these views; scrolled section views can omit the page title. |
| [rule-book-phone-section-06.png](rule-book-phone-section-06.png) | 390×844 | Shipped Rule Book, signed-out static capture. No live manager chips in these views; scrolled section views can omit the page title. |
| [rule-book-phone.png](rule-book-phone.png) | 390×844 | Shipped Rule Book, signed-out static capture. No live manager chips in these views; scrolled section views can omit the page title. |
| [season-results-desktop.png](season-results-desktop.png) | 1440×900 | PASS: published review cards have each manager’s own SP chip under the name. Desktop frames both cards; portrait opening frames Daniel; the separate lower phone view frames Nik too. |
| [season-results-phone-nik.png](season-results-phone-nik.png) | 390×844 | PASS: published review cards have each manager’s own SP chip under the name. Desktop frames both cards; portrait opening frames Daniel; the separate lower phone view frames Nik too. |
| [season-results-phone.png](season-results-phone.png) | 390×844 | PASS: published review cards have each manager’s own SP chip under the name. Desktop frames both cards; portrait opening frames Daniel; the separate lower phone view frames Nik too. |
| [select-league-desktop.png](select-league-desktop.png) | 1440×900 | Real paired emulator Showdown, before spinning. Tall phone also uses a real paired state. |
| [select-league-phone-412x915.png](select-league-phone-412x915.png) | 412×915 | Real paired emulator Showdown, before spinning. Tall phone also uses a real paired state. |
| [select-league-phone.png](select-league-phone.png) | 390×844 | Real paired emulator Showdown, before spinning. Tall phone also uses a real paired state. |
| [settings-desktop.png](settings-desktop.png) | 1440×900 | PASS: application v1.9.10, build 1.9.10-r86; SEASONS LEFT TODAY is the app’s current estimate. Phone content scrolls. |
| [settings-phone.png](settings-phone.png) | 390×844 | PASS: application v1.9.10, build 1.9.10-r86; SEASONS LEFT TODAY is the app’s current estimate. Phone content scrolls. |
| [shared-history-desktop.png](shared-history-desktop.png) | 1440×900 | Accepted season-two HISTORY UP TO DATE panel. Manager names in Shared History still have no SP chips, as in #1068. |
| [shared-history-phone.png](shared-history-phone.png) | 390×844 | Accepted season-two HISTORY UP TO DATE panel. Manager names in Shared History still have no SP chips, as in #1068. |
| [special-player-desktop-rank-1-ending.png](special-player-desktop-rank-1-ending.png) | 1440×900 | Standalone shipped reveal preview, actual __mq clock. Same-player preview pair is for tier comparison; a real game never draws the same player twice. Rank 1 Neymar; ending. |
| [special-player-desktop-rank-1-handover.png](special-player-desktop-rank-1-handover.png) | 1440×900 | Standalone shipped reveal preview, actual __mq clock. Same-player preview pair is for tier comparison; a real game never draws the same player twice. Rank 1 Neymar; handover. |
| [special-player-desktop-rank-1-hold.png](special-player-desktop-rank-1-hold.png) | 1440×900 | Standalone shipped reveal preview, actual __mq clock. Same-player preview pair is for tier comparison; a real game never draws the same player twice. Rank 1 Neymar; hold. |
| [special-player-desktop-rank-1-ladder.png](special-player-desktop-rank-1-ladder.png) | 1440×900 | Standalone shipped reveal preview, actual __mq clock. Same-player preview pair is for tier comparison; a real game never draws the same player twice. Rank 1 Neymar; ladder. |
| [special-player-desktop-rank-1-scouting-report.png](special-player-desktop-rank-1-scouting-report.png) | 1440×900 | Standalone shipped reveal preview, actual __mq clock. Same-player preview pair is for tier comparison; a real game never draws the same player twice. Rank 1 Neymar; report. |
| [special-player-desktop-rank-1-white-flash.png](special-player-desktop-rank-1-white-flash.png) | 1440×900 | Standalone shipped reveal preview, actual __mq clock. Same-player preview pair is for tier comparison; a real game never draws the same player twice. Rank 1 Neymar; flash. |
| [special-player-desktop-rank-200-ending.png](special-player-desktop-rank-200-ending.png) | 1440×900 | Standalone shipped reveal preview, actual __mq clock. Same-player preview pair is for tier comparison; a real game never draws the same player twice. Rank 200 Bruma; ending. |
| [special-player-desktop-rank-200-handover.png](special-player-desktop-rank-200-handover.png) | 1440×900 | Standalone shipped reveal preview, actual __mq clock. Same-player preview pair is for tier comparison; a real game never draws the same player twice. Rank 200 Bruma; handover. |
| [special-player-desktop-rank-200-hold.png](special-player-desktop-rank-200-hold.png) | 1440×900 | Standalone shipped reveal preview, actual __mq clock. Same-player preview pair is for tier comparison; a real game never draws the same player twice. Rank 200 Bruma; hold. |
| [special-player-desktop-rank-200-ladder.png](special-player-desktop-rank-200-ladder.png) | 1440×900 | Standalone shipped reveal preview, actual __mq clock. Same-player preview pair is for tier comparison; a real game never draws the same player twice. Rank 200 Bruma; ladder. |
| [special-player-desktop-rank-200-scouting-report.png](special-player-desktop-rank-200-scouting-report.png) | 1440×900 | Standalone shipped reveal preview, actual __mq clock. Same-player preview pair is for tier comparison; a real game never draws the same player twice. Rank 200 Bruma; report. |
| [special-player-desktop-rank-200-white-flash.png](special-player-desktop-rank-200-white-flash.png) | 1440×900 | Standalone shipped reveal preview, actual __mq clock. Same-player preview pair is for tier comparison; a real game never draws the same player twice. Rank 200 Bruma; flash. |
| [special-player-phone-rank-1-ending.png](special-player-phone-rank-1-ending.png) | 390×844 | Standalone shipped reveal preview, actual __mq clock. Same-player preview pair is for tier comparison; a real game never draws the same player twice. Rank 1 Neymar; ending. |
| [special-player-phone-rank-1-handover.png](special-player-phone-rank-1-handover.png) | 390×844 | Standalone shipped reveal preview, actual __mq clock. Same-player preview pair is for tier comparison; a real game never draws the same player twice. Rank 1 Neymar; handover. |
| [special-player-phone-rank-1-hold.png](special-player-phone-rank-1-hold.png) | 390×844 | Standalone shipped reveal preview, actual __mq clock. Same-player preview pair is for tier comparison; a real game never draws the same player twice. Rank 1 Neymar; hold. |
| [special-player-phone-rank-1-ladder.png](special-player-phone-rank-1-ladder.png) | 390×844 | Standalone shipped reveal preview, actual __mq clock. Same-player preview pair is for tier comparison; a real game never draws the same player twice. Rank 1 Neymar; ladder. |
| [special-player-phone-rank-1-scouting-report.png](special-player-phone-rank-1-scouting-report.png) | 390×844 | Standalone shipped reveal preview, actual __mq clock. Same-player preview pair is for tier comparison; a real game never draws the same player twice. Rank 1 Neymar; report. |
| [special-player-phone-rank-1-white-flash.png](special-player-phone-rank-1-white-flash.png) | 390×844 | Standalone shipped reveal preview, actual __mq clock. Same-player preview pair is for tier comparison; a real game never draws the same player twice. Rank 1 Neymar; flash. |
| [special-player-phone-rank-200-ending.png](special-player-phone-rank-200-ending.png) | 390×844 | Standalone shipped reveal preview, actual __mq clock. Same-player preview pair is for tier comparison; a real game never draws the same player twice. Rank 200 Bruma; ending. |
| [special-player-phone-rank-200-handover.png](special-player-phone-rank-200-handover.png) | 390×844 | Standalone shipped reveal preview, actual __mq clock. Same-player preview pair is for tier comparison; a real game never draws the same player twice. Rank 200 Bruma; handover. |
| [special-player-phone-rank-200-hold.png](special-player-phone-rank-200-hold.png) | 390×844 | Standalone shipped reveal preview, actual __mq clock. Same-player preview pair is for tier comparison; a real game never draws the same player twice. Rank 200 Bruma; hold. |
| [special-player-phone-rank-200-ladder.png](special-player-phone-rank-200-ladder.png) | 390×844 | Standalone shipped reveal preview, actual __mq clock. Same-player preview pair is for tier comparison; a real game never draws the same player twice. Rank 200 Bruma; ladder. |
| [special-player-phone-rank-200-scouting-report.png](special-player-phone-rank-200-scouting-report.png) | 390×844 | Standalone shipped reveal preview, actual __mq clock. Same-player preview pair is for tier comparison; a real game never draws the same player twice. Rank 200 Bruma; report. |
| [special-player-phone-rank-200-white-flash.png](special-player-phone-rank-200-white-flash.png) | 390×844 | Standalone shipped reveal preview, actual __mq clock. Same-player preview pair is for tier comparison; a real game never draws the same player twice. Rank 200 Bruma; flash. |
| [standings-desktop.png](standings-desktop.png) | 1440×900 | PASS: Career tab after automatic final close, same page without reload; both manager SP chips remain. This Showdown tab is empty after close. Compact chips can still shorten long names here. |
| [standings-phone.png](standings-phone.png) | 390×844 | PASS: Career tab after automatic final close, same page without reload; both manager SP chips remain. This Showdown tab is empty after close. Compact chips can still shorten long names here. |
| [trophy-room-desktop.png](trophy-room-desktop.png) | 1440×900 | Completed three-season Showdown; manager SP chips. Phone MORE is open and the view is scrolled. |
| [trophy-room-phone.png](trophy-room-phone.png) | 390×844 | Completed three-season Showdown; manager SP chips. Phone MORE is open and the view is scrolled. |

60 PNGs; largest 1,639,049 bytes.

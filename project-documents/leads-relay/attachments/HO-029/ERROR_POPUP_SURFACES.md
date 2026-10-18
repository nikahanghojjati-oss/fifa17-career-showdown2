# Career Mode Showdown: error / dialog / toast surfaces (HO-029, read-only audit)

Repo `/home/claude/repo`, working tree (== origin/gameplay/clean-start except js/settings.js). All paths relative to repo.
"Look" = what the CSS currently gives. Many surfaces already have a Team V dark/gold override layer (v10Shell.css, v10Setup.css, rulesSettingsV10.css); those are marked DARK. Anything marked OLD is still white/pale-blue "f17" style (css/app.css tokens `--f17-*`, panels #fff / #eef3f4 / #e6eef0, cyan or blue left border).
Note: `alert()` and `prompt()` are not used anywhere. `confirm()` is used in 12 places (section C).

## A. Full-screen error / unavailable states

| # | Surface (id / class) | Created / styled | Screen | Wording | Look |
|---|---|---|---|---|---|
| A1 | `#onlinePlayerIdentityOverlay` (role=dialog, full-viewport gate with `<section>` card, `h2#onlinePlayerIdentityTitle`, TRY AGAIN / SIGN IN WITH GOOGLE / DANIEL . PLAYER ONE buttons) | js/onlinePlayerIdentity.js:42 (overlay, inline style) and :48 (card, inline style) | Any gameplay entry while signed out / offline / error | "CONNECTION REQUIRED", "SIGN IN TO PLAY", "WHO ARE YOU?", "CONNECTION NEEDS ATTENTION", "ONLINE PLAY PAUSED FOR TODAY", "Connection required. Reconnect to continue." | Inline-styled JS: scrim rgba(3,8,15,.92)+blur, card #111820 with faint white border, generic `.menuButton`. Dark navy, NOT marble/gold. All styling is inline `Object.assign(el.style…)`, must be replaced in JS. |
| A2 | `#loadingScreen` startup splash (`#loadingText`) | index.html:17; css/app.css:54-91 | App start | "PREPARING CAREER MODE SHOWDOWN" (no failure variant) | DARK/gold already (#080909, gold streak). Startup failure does not swap this screen; it falls to the toast A/D1. |
| A3 | Career Statistics / Trophy Room / Standings / Rivalry Stats / Legacy "unavailable" state panels: `.statePanel.statePanel--unavailable` (+`.stateGlyph` "!"), `.fatalState`, `#statePanel`, `#legacyStateBanner .legacyStateCopy`, `#rvRead.unavailable` | visual-assets/v10_1/trophy-room/trophy-room.js:119-120; career-statistics/career-statistics.js:172; standings/standings.js:157; rivalry-statistics/rivalry-statistics.js:22; legacy/legacy.js:437,538-552; CSS in js/careerScreensV10.js:179-186,313-320,448-455,597-602,785,890; css/rivalryLegacyV10.css:1044-1051,1147; css/v10Shell.css:378-395 | Trophy Room, Career Statistics, Standings, Rivalry Stats, Legacy | "Career history is unavailable right now. Nothing is lost. Try again when you are reconnected." / "Standings are unavailable right now." / "Your Showdown history could not be loaded." / "Rivalry statistics are unavailable right now." | DARK Team V plate UI (strings in visual-assets/v10_1/*/strings.json, js/careerScreenSeam.js:10-19, careerScreensV10.js:20). Already black/gold; only needs marble pass. |
| A4 | Final Winner "Final result unavailable" (`#finalWinnerHeading`, `#finalWinnerMessage`, `root.dataset.status="unavailable"`) | visual-assets/v10_1/final-winner/final-winner.js:277-281; final-winner.css | Final Winner screen | "Final result unavailable" / "The shared Showdown result could not be read. Missing values are not zero." | Team V plate, dark. |
| A5 | Club Assignment unavailable (`#clubPackStatus` = UNAVAILABLE, `data-club-reveal-stage="unavailable"`, buttons hidden) | visual-assets/v10_1/club/club.js:820-840; css/v10Club.css | Club pack screen | "UNAVAILABLE" | Team V plate, dark. |
| A6 | "Update Career Mode Showdown" standalone page (`main.acceptanceCard`, `#appUpdateStatus`, button `.acceptanceButton`, "Return to game" link) built with `document.body.replaceChildren` | js/appUpdateBootstrap.js:1-45 (copy, errors at ~55-75); styles come from acceptance page CSS (production-authorization-acceptance.html) | Network-only update entry page (not inside the game) | "Update Career Mode Showdown", "UPDATE AND RETURN TO GAME", "The update service did not respond. Please try again.", "The latest version could not be reached. Check your connection and try again." | Plain unstyled/acceptance page style. Needs own styling. |
| A7 | `production-authorization-acceptance.html` + `.authorizationAcceptanceStatus` (also js/productionAuthorizationAcceptance.js, productionProviderAbuseAcceptance.js, stage5fProductionAuthenticatedNegatives.js, stage5fAcceptanceAccountChooser.js) | production-authorization-acceptance.html (11 hits), js files listed | Internal owner acceptance page, not player-facing | status/error lines for sign-in and provider checks | Developer page, plain. Probably out of scope; flag to Team V as internal. |
| A8 | `#connectPlayersScreen` (role=dialog layer, `.connectPlayersLayer`; `.pairRecoverySecondary` recovery buttons) | js/connectPlayersScreenV10.js:9; css/connectPlayersV10.css:717,1181 | Connect Players (pairing) | failure goes through `reportApplicationError("Unable to open Connect Players")` toast | DARK Team V plate. |

## B. Inline notes / banners / form errors

| # | Surface | file:line | Screen | Wording | Look |
|---|---|---|---|---|---|
| B1 | `.formError#transferChallengeError` (`.error-line.formError`, role=alert in Team V plate) | index.html:211 (old shell); css/app.css:194; css/v10Transfer.css:55,373-374,564; visual-assets/v10_1/tr2/slice-02-plate/plate.js:314,349,401-413 + plate.css (`.has-error`); strings js/transferScreenV10.js:35 | Transfer Challenge | "Complete signing {n} with player name, previous league and nationality." | Old: centred plain text #8e343b (css/app.css:194). In Team V plate: small red line over plate. |
| B2 | `.formError#seasonEntryError` + `#seasonReviewError.seasonReviewError` | index.html:258; js/seasonEngine.js:114; css/app.css:194; css/season.css:52; js/seasonFinalV10.js:362,448,693,901,988; visual-assets/v10_1/season-results/season-results.js:296-330 | Season Results entry + review | "Return to Edit Results and review it again.", "Complete the current season's Transfer Challenge before submitting results." (seasonEngine.js:557,745-760) | Mixed: red text; Team V override inside `.v10SeasonStage`. |
| B3 | `.seasonReviewWarning` (also `.sharedSeasonCommitStatus`, `.sharedMultiSeasonProgressionStatus`, `.seasonReviewStatusMeta`) | css/season.css:48-51; js/seasonEngine.js:36; js/productionSharedSeasonCommit.js:73; js/productionSharedMultiSeasonProgression.js:119; js/productionSharedSeasonResults.js:130-138; visual-assets/v10_1/season-results/app.css | Season review | "PUBLISHED . WAITING FOR YOUR RIVAL", "NOT PUBLISHED YET", commit failed template with `{ERROR_CODE}` | OLD: pink box #f3e2e3 with #b95e64 left bar, uppercase 10px (css/season.css:48). Team V app.css overrides some of it. |
| B4 | `.stateNote` family: `#leagueStateNote`, `#dashboardIntegrityStatus`, `p.stateNote` on New Showdown, `#sharedShowdownSeasonChoice > .stateNote`, `.stateNote` from `js/productionSharedShowdownPresentation.js:150` | index.html:114,141; js/leagueWheel.js:134,246; js/showdownUI.js:137-143; css/app.css (base), css/v10Shell.css:170 (DARK, gold left bar), css/v10Setup.css:155-169,228 (DARK, `.locked` brighter gold border), css/v10Club.css:145-173,432,606 | New Showdown, League Wheel, Club, Dashboard | "Daniel is Player One. Nik is Player Two.", league-locked notes, saved-showdown integrity warnings | DARK already (rgba(7,8,10,.9), gold border). |
| B5 | `#sharedJourneyReconnectStatus` ("SHARED JOURNEY RECOVERED" style top note) | js/productionSharedJourneyReconnect.js:9; css/v10Shell.css:160-170 comment | Home / shared journey | "SHARED JOURNEY RECOVERED" | DARK (shared with .stateNote). |
| B6 | `.analyticsEmpty` (+`.analyticsIdentityNotice`) | js/trophyRoom.js:189,253; js/statistics.js:359; js/careerScreenSeam.js:132 (role=status); css/analytics.css:85 | Trophy Room / Statistics fallback | "No completed showdowns yet", identity notices | OLD pale card (analytics.css), Team V screens replace most of it. |
| B7 | `.legacyEmpty`, `.legacyDataStatus`, `.legacyImportStatus`, `.legacyImportFileState`, `.legacyImportMessages.errors/.warnings`, `.legacyImportMigrationSummary`, `.legacyImportConflictList` | js/legacy.js:372,579; js/importAnalysis.js:853 (110 error/warn refs); css/legacy.css:67,340,450,500-510; css/v10Shell.css:217-227 | Settings > History & Backup / Legacy tools | "Analysis is read-only. Restore is intentionally unavailable in Candidate B." etc. | `html[data-v10-tools]` DARK gold override in v10Shell.css:217-230; base is OLD (errors #f8ecee/#a3444d, warnings #fbf8df/#b59d16). |
| B8 | Restore panel: `.careerRestoreStatus`, `.careerRestorePlan(.ready/.blocked)`, `.careerRestoreConflicts`, `.careerRestoreRecovery(.critical)`, `#careerRestoreRecoveryHost` | js/restoreUI.js:7,36,177,195,264; css/restore.css:5-27; css/v10Shell.css (5 refs) | Settings > History & Backup | "The selected file changed before Apply could start. Nothing was written." | Base OLD white (#fff, #fff9e8 amber, #f8e8e8 critical, cyan/green/red bars); v10-tools override DARK. |
| B9 | Save Library: `.saveLibraryEmptyState`, `.saveLibraryCompatibilityState`, `.saveLibraryBlockedState`, `.saveLibraryIdentityUnavailable`, `.saveLibraryStatusRow`, notice via `saveLibraryUIShowNotice` | js/saveLibraryUI.js (empty/blocked states, notice helper :18); css/saveLibrary.css:56-62,97 | Settings > Saves | "Single-Save deletion is unavailable in this session.", "That manager identity link is already current." | OLD: #eef3f4 pale box, 7px cyan left bar (blocked/identity: #81949f grey bar). Not yet restyled. |
| B10 | Settings notes: `.settingsOfflineNote` / `.settingsApplicationUpdateStatus` and offline panel text | js/settings.js:241; css/settings.css; css/rulesSettingsV10.css (4 refs) | Settings > Offline / updates | "Updates keep your current Showdown and player identity." | Settings is DARK (`#settingsOverlay.v10Settings`, black #050505). |
| B11 | Remote joining / shared setup status: `.remoteJoiningStatus`, `.remoteJoiningEmpty`, `.remoteJoiningMeta`, `.remoteJoiningCurrent`, `.remoteJoiningCode` | js/sparkRemoteJoining.js, js/sparkPrivatePairing.js:520,583 (role=status text e.g. "Automatic clipboard copy was unavailable. The full pairing code is selected; use your browser Copy command."), js/startJoinViewModel.js; css/remoteJoining.css (1 line, OLD) | The three overlays in D2 | pairing state messages | Base OLD pale (#e6eef0, cyan bar). Gold override only for 2 of 3 overlays (see D2). |
| B12 | Season entry hint `.seasonEntryHint` | css/season.css (pale #f5f8f8 + cyan bar); js/seasonEngine.js | Season Results | helper line | OLD. |
| B13 | Main-menu status lines `#menuMusicStatus` (role=status), Audius `statusError`, offline media line | index.html:89; js/offlineApp.js:120,133-148; js/homeScreensV10.js:21; visual-assets/v10_1/home/soundtrack.js:31,53,72 | Home | "STREAM UNAVAILABLE . TRY AGAIN OR PICK ANOTHER TRACK", "OFFLINE . YOUTUBE MEDIA REQUIRES A CONNECTION" | DARK Team V home. |
| B14 | Status lines on gameplay screens: `#selectedLeague` (role=status), `#clubPackStatus`, `#transferPhaseStatus`, `#dashboardStatus`, `#dashboardTransferStatus`, `#dashboardLastSeasonResult` | index.html:140,34,159,117-118,131 | League / Club / Transfer / Dashboard | "Spin to select league", "TWO SEALED CLUB PACKS READY", "READY" | Mostly state, not errors; styled in the v10 skins. |
| B15 | Firestore daily-quota note on Home (a repositioned toast, `#appRuntimeNotice[data-home-quota]`, duration 0 = stays) | js/homeScreensV10.js:134-146; css/homeV10.css:7-9 | Home | quota paused message from `CareerModeFirestoreBudget.quotaMessage()` | DARK (same as toast, section E1). |

## C. Native browser dialogs (cannot be styled; need replacing with a custom modal)

No `alert()`. No `prompt()`. All are `confirm()` (OK / Cancel). `offlineApp.js:302` `prompt.prompt()` is the browser PWA install prompt (also native, unstylable).

| # | file:line | Trigger / screen | Wording |
|---|---|---|---|
| C1 | js/legacy.js:307 | Legacy card, DELETE SHOWDOWN | `Delete "<name>" from Legacy? This cannot be undone.` (variant: "...and remove its active completed copy?") |
| C2 | js/legacy.js:432 | Settings > History: Delete all Legacy | "Delete every archived showdown from Legacy? ... Unfinished active saves are not affected. This cannot be undone." |
| C3 | js/legacy.js:447 | Settings > Reset everything | "Reset ALL Career Mode Showdown data? This deletes the active showdown and every Legacy record. This cannot be undone." |
| C4 | js/showdownUI.js:178 | Dashboard, delete active showdown | `Delete "<name>" and all of its unfinished progress? This cannot be undone.` (variant for completed) |
| C5 | js/saveLibraryUI.js:178 | Saves list, delete one save | `Delete only "<name>" from this device? Other local Saves, Local Profiles, Legacy history and app settings remain. This cannot be undone.` |
| C6 | js/saveLibraryUI.js:414 | Saves, link manager identity / mark unresolved | `Link "<manager>" in "<showdown>" to PROFILE ...? This changes stable manager identity only...` |
| C7 | js/restoreUI.js:195 | Restore panel APPLY | "Apply this exact restore plan? The selected file and browser data will be verified again before any write. Export Backup above now..." |
| C8 | js/productionSharedTransferChallenge.js:187 | Shared Transfer Challenge, lock partly filled | "Lock N of 3 signings/guesses? You can't change them after locking." |
| C9 | js/settings.js:598 (file differs from clean-start, see note) | Settings, delete current Showdown and start over | `Delete the current "<name>" Showdown and start over? This closes the current Showdown connection for both players...` |
| C10 | js/settings.js:831 (842 on clean-start) | Settings, START REAL CAREER | "Start your real career now? Finished test Showdowns stay saved but are hidden from History, Trophy Room and Legacy. Ask <other> to press this too." |
| C11 | js/persistentNikDanielPair.js:256 and :293 (`root.confirm?.`) | Pairing, stale connection reset (2 sites) | "Delete this old connection and start fresh? This closes the stale online test connection..." |
| C12 | js/productionSharedJourneyEntry.js:146 | Home New Showdown while a shared one exists | "Start a new Showdown? This will close the current Daniel vs Nik Showdown for both players..." |

Total native `confirm()` call sites: 13 (C11 counts 2). Each is guarded so a blocked/absent confirm never counts as consent (C8 is the exception: missing confirm = lock).
Replacement note for Team V/engineering: callers are synchronous (`if(!confirm(...)) return;`), so a custom modal needs an async wrapper and call-site edits in 9 files.

## D. Custom modals / overlays

| # | Surface | file:line | Screen | Look |
|---|---|---|---|---|
| D1 | App Runtime Notice is the toast, see E1 | | | |
| D2 | `.remoteJoiningOverlay` > `.remoteJoiningShell` > `.remoteJoiningHeader` / `.remoteJoiningBody` / `.remoteJoiningDismiss` (role=dialog, aria-modal). Three instances: `#sparkRemoteJoiningOverlay` ("Private Remote Joining"), `#productionSharedJourneyEntryOverlay` ("Career Mode Showdown entry", GET READY), shared setup / shared career start panels | js/sparkRemoteJoining.js:472; js/productionSharedJourneyEntry.js:307; js/productionSharedCareerStart.js:172; js/productionSharedShowdownSetup.js:287; css/remoteJoining.css (base), css/v10Setup.css:1043-1118 (gold override for Spark + JourneyEntry only) | Home > New Showdown / Join / Career start | Base OLD: scrim rgba(15,23,29,.74), shell gradient #edf2f3-#d7e1e4 with yellow top bar, dark slate header. v10Setup.css gives Spark and Journey Entry black+gold (`--v26-gold`). **Shared Career Start (`pcst`) and Shared Showdown Setup panels have no override; they stay pale.** |
| D3 | `#settingsOverlay` > `#settingsDialog.settingsDialog` (role=dialog) | js/settings.js:995-1030; css/settings.css:1-20,155-192 (OLD base); css/rulesSettingsV10.css:5-12,912 + visual-assets/v10_1/settings/settings.css (DARK `v10Settings`, full-screen #050505) | Home > Settings | DARK. Base file still holds old light version as fallback (#e7ecee, yellow left bar). |
| D4 | `#connectPlayersScreen` layer (role=dialog) | js/connectPlayersScreenV10.js:9 | Connect Players | DARK Team V plate. |
| D5 | Online identity gate | see A1 | | |
| D6 | Trophy Room phone sheet (`.trophyPhoneSheet`, `.trophyPhoneSheetHint`) | js/careerScreensV10.js:775,859,1325 | Trophy Room, phones | DARK; this is a bottom sheet, not an error. |
| D7 | Club "rivalry confirmation" panel `#clubRivalryConfirmation` ("CONFIRM RIVALRY & START SHOWDOWN", permanence note) | index.html:85-106; js/clubAssignment.js:447,462; css/v10Club.css | Club Assignment | in-page confirm, DARK Team V. |

## E. Toasts / status lines

| # | Surface | file:line | Look |
|---|---|---|---|
| E1 | **App toast `#appRuntimeNotice`** (classes `.error`, `.success`, none = info; children `.runtimeNoticeText`, close button "x", role=status). Created by `showAppNotice(message, type, duration)` / `reportApplicationError(context, error)` / the global error + unhandledrejection boundary | js/app.js (single-line file; fn `rn`/`showAppNotice`); CSS css/app.css:198 (OLD slate #303840, yellow bar), css/v10Shell.css:160-169 (DARK override: #0d0f13, gold 1px border, red/green left bar), css/homeV10.css:7-9 | Anywhere. Default 7 s, errors 9-10 s, success 3.5-6 s, quota note stays until cleared. **Single component, ~100 call sites; one restyle covers all.** Already black/gold in v10 mode; flat panel, no marble. |
| E2 | `.sd-nav-toast` ("Finish this step first", role=status) | visual-assets/v10_1/shared/navbar/navbar.js:14,52-54; navbar.css:55-61,86 | Bottom navbar tap on a locked item | DARK Team V. |
| E3 | Toast wording by area (all through E1): | | |
| | Storage failure | js/storage.js:15 | "<context>. Your browser may not have saved the latest change." |
| | Multi-tab conflict | js/saveLibraryRuntime.js:614 | "Save data changed in another tab. Reload or Continue again before making more changes." |
| | Save failure | js/saveLibraryRuntime.js:234 | "<message>. No data was accepted as saved." |
| | Startup/runtime | js/app.js | "The application could not finish initializing. <detail>", "An unexpected application error was detected", "A runtime error was detected" |
| | League/Club | js/leagueWheel.js:198,224,260,306; js/clubAssignment.js:400,422,447,462 | "The league is locked because clubs have already been assigned for this showdown.", "Assign two valid clubs before confirming the rivalry." |
| | Transfer | js/transferChallenge.js:327,396,530,690,749 | "Guesses locked. Signing Entry is now open.", "Transfer Challenge locked successfully." (success) |
| | Season | js/seasonEngine.js:294,538,813,821 | "Season N saved successfully." (success) |
| | Legacy / reset | js/legacy.js:225-474 (about 14 toasts) | "Legacy history was deleted successfully.", "The full reset did not complete..." |
| | Settings | js/settings.js:104-139,345,454,639-650,808-820 | "Reduced motion is enabled.", "Offline update support is unavailable in this session." |
| | Restore | js/restoreUI.js:177 | "Backup restore completed and verified successfully." |
| | Screens | js/screens.js:331,611,672,682 | "Saved showdown warning: ...", "The completed showdown is loaded, but its Legacy copy could not be refreshed." |
| | Shared journey | js/productionSharedJourneyGuard.js:38 | "Shared Showdown blocks local <action>..." |
| | Media | js/menuExperience.js:327 | "The selected YouTube media could not be loaded. Choose another track or try again." |
| | Rivalry stats | js/optionalModules.js:493 | "No active showdown is available for Rivalry Statistics." |
| E4 | Async `reportApplicationError` callers (all surface as E1) | js/productionShared{HistoryConvergence,MultiSeasonProgression,TerminalClose,CanonicalScoring,JourneyReconnect,SeasonResults}.js, js/v10Screens.js, js/careerScreensV10.js, js/optionalModules.js (2), js/diagnostics.js | |
| E5 | PWA install result messages (returned to Settings, shown as note/toast) | js/offlineApp.js:~295-310 | "Career Mode Showdown is already installed on this device.", "Installation was accepted...", "Installation was not completed..." |

## F. Offline / fallback pages (service worker)

- **There is no custom offline page.** `service-worker.js` has no HTML fallback response.
  - Navigation (service-worker.js:346): serves cached `index.html` for the chosen runtime revision; if no cache, `fetch(request)` runs, so offline with no cache shows the **browser's native "No internet" page** (cannot be themed).
  - Versioned asset not in cache (service-worker.js:349): `Response.error()` gives a failed asset load, no UI.
  - v10 images missing: `v10ImageResponse` (service-worker.js:333-340) falls back to a retained older revision, else network. No placeholder image.
  - Only synthetic Response: runtime-mode text file `__cms_runtime_mode__` (service-worker.js:300), never shown.
- `css/offline.css` is two comment lines (no rules). Offline UI lives in Settings (B10) and the media line (B13).
- Connectivity state is exposed through `js/offlineApp.js` (events + `recheckOfflineConnectivity`); the player-visible result is A1 "CONNECTION REQUIRED" and B13.
- Update page A6 (`appUpdateBootstrap.js`) is the only standalone fallback-style page.
- `<noscript>`: none in index.html. No `<dialog>` element, no `window.onerror` UI beyond E1.

## Counts and status

- Full-screen error states: 8 (A1 to A8; A7 is internal-only)
- Inline notes / banners / form errors: 15 (B1 to B15)
- Native dialogs: 13 `confirm()` call sites in 9 files (0 alert, 0 prompt); plus 1 browser install prompt
- Custom modals / overlays: 6 real ones (D2 x3 instances counted as one family, D3, D4, A1, D7, D6)
- Toasts / status lines: 1 toast component (E1) with ~100 call sites, plus 1 secondary toast (E2)
- Offline / fallback pages: 0 custom (native browser error only), 1 standalone update page (A6)

Still OLD (white / pale-blue) and in need of Team V work first: B3, B8 (base), B9 save library, B11, D2 shared career start + shared showdown setup panels, A6 update page, base `.formError` (B1/B2 outside Team V plate), A1 identity gate (dark navy, not gold).
Already DARK/gold but flat (needs marble): E1, E2, B4, B5, D3, A3 to A5.
js/settings.js note: working tree differs from clean-start (r78 settings-row branch), C9/C10 line numbers are from the working tree.

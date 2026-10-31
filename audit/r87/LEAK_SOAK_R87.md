# r87 leak soak: one tab per manager through a 10-season emulator Showdown

Base: gameplay/r87 73713d75b. Run: `CE2PG_PORT_BASE=9810 CE2PG_APP_PORT=4911 node tests/browser/ce2pg-leak-soak.cjs`
(firebase@12.17.0, emulator demo project, reloads off so each tab lives all 10 seasons, career pages every 3rd season as CE2PG does).
Journey result on the same run: PASS 465/465 checks, 0 problems, 1022 s. Raw numbers: audit/r87/LEAK_SOAK_R87_ce2pg-10.txt.

Samples are taken each time Transfer Challenge opens, after a forced GC, on both managers (14 samples each).

## Finding LK-1 (real, grows per career-page visit): Career Statistics / Trophy Room stage never destroyed
- Where: js/careerScreensV10.js v10Render (about line 1593-1626) rebuilds `host.innerHTML` and calls
  `ShowdownCareerStatisticsBoot()` / `ShowdownTrophyRoomBoot()` on every open. Each boot calls `ShowdownStage.mount`
  (visual-assets/v10_1/career-statistics/career-statistics.js:38, trophy-room/trophy-room.js:268), which adds a ResizeObserver
  and a window `orientationchange` listener (visual-assets/v10_1/shared/stage.js:119-121). Nobody calls the stage's
  `destroy()` (stage.js:185) for the old one, so window keeps every old stage, and with it the whole old screen tree.
- Measured (both managers alike): renderer DOM nodes 3,331 -> 11,282, detached nodes about +1,600 per career-page round;
  live listeners 606 -> 1,010; observers 38 -> 72; heap 12.6 -> 17.3 MB. Grows in steps exactly at the career-page checks.
  Growing sites: window orientationchange @ stage.js 0 -> 23, ResizeObserver @ stage.js 0 -> 23, click @ career-statistics.js 0 -> 69,
  click @ careerScreensV10.js:1575/1577 0 -> 23 each, ResizeObserver + click @ careerScreensV10.js:1631 (v10Render) 0 -> 7 / 0 -> 49.
- Fix suggestion (small): before rebuilding, `root.__careerStageEngine?.destroy?.()` for Career Statistics and the trophy room's
  `state.stage?.destroy?.()` (the same pattern js/seasonFinalV10.js:2093 and js/rulesSettingsV10.js:168 already use).
- Effect on play: none on flow or reads; memory and resize work grow on a phone that opens career pages often in one long session.

## Minor (watch, not per-season growth)
- element `error` {once} listeners @ js/v10Screens.js:202 (vsImageSettled): 14 -> 59. Images that load never fire `error`, so the
  once-listener stays until the image is collected; it follows LK-1 (old trees kept alive). Goes away with LK-1.
- pending timeouts @ visual-assets/v10_1/shared/motion.js: 0 -> 21 at the last sample; bounces 3..69 over the run, so not a leak.

## No leak (flat for 10 seasons)
- Firestore onSnapshot live listeners: 0-3 at every sample (rivalry, session, current season's transferChallenges doc;
  sparkPrivatePairing.js:1333 and :1471). Every season's old listener is closed. No extra billed listener reads from leaks.
- Intervals: 18-19 live all run (15 s / 3 s / 1 s / 800 ms polls in the production shared modules; constant, not growing;
  see the arch audit's L1/L2 for whether each should stop).
- requestAnimationFrame 0-1, iframes 0, canvases 0, Documents 13-14 after setup, localStorage +0.5 KB per season (8.6 KB at the end).

## Not proven by this run
- The roulette WebGL scene: no WebGL context was created at any sample in headless emulator play (webgl 0/0), so the
  roulette scene's GPU/iframe cleanup is not measured here. Needs a headed/GPU run or a roulette-only soak.
- Real phones (Safari/Chrome memory limits). Emulator proof only.

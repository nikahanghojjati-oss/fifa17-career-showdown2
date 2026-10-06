# Layout audit summary

Base URL: http://127.0.0.1:4391/  
Generated: 2026-10-06T04:35:15.331Z  
Findings: 168 across 200 screen captures.

## Findings per screen and size

| screen | 393x660 | 375x553 | 360x560 | 412x750 | 1440x900 | 1366x650 | 1280x620 | 1536x730 | total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| home-empty | 2 | 2 | 2 | 2 | 0 | 0 | 0 | 0 | 8 |
| rule-book | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| statistics-career | 0 | 11 | 11 | 0 | 0 | 0 | 0 | 0 | 22 |
| trophy-room | 0 | 0 | 0 | 2 | 2 | 2 | 2 | 2 | 10 |
| settings | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| settings-panel-daniel-nik | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| settings-panel-career-mode-showdown | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| settings-panel-motion-feedback | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| settings-panel-showdown-data | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| create-showdown | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| league-wheel-locked | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| league-wheel-selected | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| club-wheel | 3 | 1 | 1 | 3 | 1 | 0 | 0 | 1 | 10 |
| club-wheel-revealed | 3 | 1 | 1 | 3 | 1 | 0 | 0 | 1 | 10 |
| dashboard | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| transfer-war-window | 1 | 1 | 1 | 2 | 0 | 0 | 0 | 0 | 5 |
| transfer-war-guess | 1 | 1 | 1 | 2 | 0 | 0 | 0 | 0 | 5 |
| transfer-war-signing | 1 | 7 | 7 | 8 | 0 | 0 | 0 | 0 | 23 |
| transfer-war-completed | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 4 |
| season-results-entry | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 3 |
| season-results-review | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 3 |
| final-winner | 5 | 2 | 2 | 3 | 2 | 4 | 3 | 4 | 25 |
| statistics-rivalry | 1 | 1 | 1 | 3 | 1 | 2 | 2 | 2 | 13 |
| legacy-history | 3 | 3 | 3 | 3 | 0 | 1 | 1 | 1 | 15 |
| standings | 2 | 2 | 2 | 2 | 0 | 0 | 0 | 3 | 11 |
| **all** | 24 | 33 | 33 | 34 | 7 | 11 | 10 | 16 | 168 |

## Module and route per capture (393x660; same module at every size)

| capture | route (active screen) | module | DOM evidence |
|---|---|---|---|
| home-empty | mainMenu | js/homeScreensV10.js (Team V home) | .v10Home [data-v10-screen] |
| rule-book | ruleBook | js/rulesSettingsV10.js (Rule Book) | .sd-stage [data-v10-screen] |
| statistics-career | careerStatistics | js/careerScreensV10.js mount('careerStatistics', fixture model) | .sd-stage [data-v10-screen] |
| trophy-room | trophyRoom | js/careerScreensV10.js mount('trophyRoom', fixture model) | .sd-stage [data-v10-screen] |
| settings | mainMenu | js/rulesSettingsV10.js (Settings) | .sd-stage .v10Settings .v10Home [data-v10-screen] |
| settings-panel-daniel-nik | mainMenu | js/rulesSettingsV10.js (Settings) | .sd-stage .v10Settings .v10Home [data-v10-screen] |
| settings-panel-career-mode-showdown | mainMenu | js/rulesSettingsV10.js (Settings) | .sd-stage .v10Settings .v10Home [data-v10-screen] |
| settings-panel-motion-feedback | mainMenu | js/rulesSettingsV10.js (Settings) | .sd-stage .v10Settings .v10Home [data-v10-screen] |
| settings-panel-showdown-data | mainMenu | js/rulesSettingsV10.js (Settings) | .sd-stage .v10Settings .v10Home [data-v10-screen] |
| create-showdown | createShowdown | js/v10Setup.js (Start/Join) | .sd-stage [data-v10-screen] |
| league-wheel-locked | leagueWheelScreen | js/v10Setup.js (league wheel) | .sd-stage [data-v10-screen] |
| league-wheel-selected | leagueWheelScreen | js/v10Setup.js (league wheel) | .sd-stage [data-v10-screen] |
| club-wheel | clubWheelScreen | js/clubScreenV10.js (Club Assignment) | .sd-stage [data-v10-screen] |
| club-wheel-revealed | clubWheelScreen | js/clubScreenV10.js (Club Assignment) | .sd-stage [data-v10-screen] |
| dashboard | dashboard | app dashboard screen (js/screens.js route 'dashboard', v10 shell styling) | .sd-stage [data-v10-screen] |
| transfer-war-window | transferChallenge | js/transferScreenV10.js skin on js/productionSharedTransferChallenge.js (real module, fake Spark provider) | .sd-stage [data-v10-screen] |
| transfer-war-guess | transferChallenge | js/transferScreenV10.js skin on js/productionSharedTransferChallenge.js (real module, fake Spark provider) | .sd-stage [data-v10-screen] |
| transfer-war-signing | transferChallenge | js/transferScreenV10.js skin on js/productionSharedTransferChallenge.js (real module, fake Spark provider) | .sd-stage [data-v10-screen] |
| transfer-war-completed | transferChallenge | js/transferScreenV10.js skin on js/productionSharedTransferChallenge.js (real module, fake Spark provider) | .sd-stage [data-v10-screen] |
| season-results-entry | seasonEntry | js/seasonFinalV10.js season-results skin on js/productionSharedSeasonResults.js (shared marker on) | .sd-stage .v10SeasonStage .seasonScreenV10 [data-v10-screen] |
| season-results-review | seasonEntry | js/seasonFinalV10.js season-results skin on js/productionSharedSeasonResults.js (shared marker on) | .sd-stage .v10SeasonStage .seasonScreenV10 [data-v10-screen] |
| final-winner | seasonEntry | js/seasonFinalV10.js final-winner skin on route 'seasonEntry' (fixture reconciliation + terminal close) | .sd-stage .v10SeasonStage .v10FinalStage .seasonScreenV10 [data-v10-screen] |
| statistics-rivalry | statistics | js/rivalryLegacyV10.js (Rivalry Statistics) | .sd-stage .v10SeasonStage .seasonScreenV10 [data-v10-screen] |
| legacy-history | legacy | js/rivalryLegacyV10.js (Legacy) | .sd-stage .v10SeasonStage .seasonScreenV10 [data-v10-screen] |
| standings | standings | js/seasonFinalV10.js standings skin (route 'standings') | .sd-stage .v10SeasonStage .standingsScreenV10 .seasonScreenV10 [data-v10-screen] |

## Findings per rule

| rule | 393x660 | 375x553 | 360x560 | 412x750 | 1440x900 | 1366x650 | 1280x620 | 1536x730 | total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| text-clipped | 4 | 11 | 11 | 4 | 2 | 0 | 0 | 2 | 34 |
| art-clipped | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| duplicate-text | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 16 |
| edge-gap | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 4 |
| overlap | 8 | 13 | 13 | 21 | 3 | 7 | 6 | 10 | 81 |
| off-screen | 9 | 6 | 6 | 6 | 0 | 0 | 0 | 0 | 27 |
| page-scroll | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| stretched-image | 0 | 0 | 0 | 0 | 0 | 2 | 2 | 2 | 6 |
| tap-target | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## Top 30 worst findings

Same defect seen at several sizes is merged into one line (worst size shown). Full detail: findings.json.

1. **duplicate-text** On final-winner at 1440x900, the same text is drawn twice on top of itself (screen-reader-only text "SHOWDOWN CHAMPION" is painted on screen (288x27); its visually-hidden styling is not applied): #finalWinnerTitle > span.sd-visually-hidden. Seen at: 393x660, 375x553, 360x560, 412x750, 1440x900, 1366x650, 1280x620, 1536x730. Rect (x,y,w,h): 568.9, 195.1, 288, 27. Screenshot: screenshots/final-winner__1440x900.png
2. **overlap** On season-results-entry at 1280x620, two things sit on top of each other (card overlaps control by 7037.3px2): #daniel-entry-panel <-> #completeSeason. Seen at: 1366x650, 1280x620, 1536x730. Rect (x,y,w,h): 442.1, 532.7, 190.4, 37. Screenshot: screenshots/season-results-entry__1280x620.png
3. **overlap** On season-results-review at 1280x620, two things sit on top of each other (card overlaps control by 7037.3px2): #daniel-entry-panel <-> #completeSeason. Seen at: 1366x650, 1280x620, 1536x730. Rect (x,y,w,h): 442.1, 532.7, 190.4, 37. Screenshot: screenshots/season-results-review__1280x620.png
4. **overlap** On statistics-rivalry at 1536x730, two things sit on top of each other (heading overlaps card by 6518.3px2): #statisticsScreenTitle <-> #rvPanelTotals. Seen at: 1366x650, 1280x620, 1536x730. Rect (x,y,w,h): 463.9, 195.6, 614.4, 10.6. Screenshot: screenshots/statistics-rivalry__1536x730.png
5. **duplicate-text** On statistics-rivalry at 393x660, the same text is drawn twice on top of itself (screen-reader-only text "RIVALRY STATISTICS" is painted on screen (218.9x29); its visually-hidden styling is not applied): #statisticsScreenTitle > span.sd-visually-hidden. Seen at: 393x660, 375x553, 360x560, 412x750, 1440x900, 1366x650, 1280x620, 1536x730. Rect (x,y,w,h): 87, 208.7, 218.9, 29. Screenshot: screenshots/statistics-rivalry__393x660.png
6. **edge-gap** On legacy-history at 393x660, 16px strip of page background colour shows along the right edge (contrast with the content beside it 129). Seen at: 393x660, 375x553, 360x560, 412x750. Rect (x,y,w,h): 377, 0, 16, 660. Screenshot: screenshots/legacy-history__393x660.png
7. **stretched-image** On final-winner at 1536x730, an image is squashed or stretched: #stage-root > div.sd-stage__layer.sd-stage__layer--cutout > div.sd-stage__registered > img.finalWinnerCutout.finalWinnerCutout--daniel rendered 1536x643 (ratio 2.3890000000000002) vs natural 1672x941 (ratio 1.777), 34.4% off. Seen at: 1366x650, 1280x620, 1536x730. Rect (x,y,w,h): 0, 61, 1536, 643. Screenshot: screenshots/final-winner__1536x730.png
8. **stretched-image** On final-winner at 1536x730, an image is squashed or stretched: #stage-root > div.sd-stage__layer.sd-stage__layer--cutout > div.sd-stage__registered > img.finalWinnerCutout.finalWinnerCutout--nik rendered 1536x643 (ratio 2.3890000000000002) vs natural 1672x941 (ratio 1.777), 34.4% off. Seen at: 1366x650, 1280x620, 1536x730. Rect (x,y,w,h): 0, 61, 1536, 643. Screenshot: screenshots/final-winner__1536x730.png
9. **overlap** On transfer-war-signing at 375x553, two things sit on top of each other (card overlaps control by 2417.1px2): div.tw-host > div.stage.pv-mobile > div.world > section.panel.sealed <-> #refreshSharedTransferChallenge. Seen at: 375x553, 360x560, 412x750. Rect (x,y,w,h): 283.5, 457, 80.1, 30.2. Screenshot: screenshots/transfer-war-signing__375x553.png
10. **overlap** On transfer-war-signing at 375x553, two things sit on top of each other (card overlaps heading by 2389px2): div.tw-host > div.stage.pv-mobile > div.world > section.panel.sealed <-> #tw-transferChallengeTitle. Seen at: 375x553, 360x560, 412x750. Rect (x,y,w,h): 91.5, 463.5, 170.6, 14. Screenshot: screenshots/transfer-war-signing__375x553.png
11. **overlap** On transfer-war-signing at 375x553, two things sit on top of each other (card overlaps heading by 2389px2): div.stage.pv-mobile > div.world > section.panel.sealed > div.panel-title.reg <-> #tw-transferChallengeTitle. Seen at: 375x553, 360x560, 412x750. Rect (x,y,w,h): 91.5, 463.5, 170.6, 14. Screenshot: screenshots/transfer-war-signing__375x553.png
12. **text-clipped** On club-wheel at 1440x900, text ("CLUB ASSIGNMENT") in #clubWheelScreenScreenTitle > span.clubTitleFallback is cut off: hidden by the container #clubWheelScreenScreenTitle: 0px horizontal, 5px vertical hidden. Seen at: 1440x900, 1536x730. Rect (x,y,w,h): 368.3, 105.4, 662.6, 90. Screenshot: screenshots/club-wheel__1440x900.png
13. **text-clipped** On club-wheel-revealed at 1440x900, text ("CLUB ASSIGNMENT") in #clubWheelScreenScreenTitle > span.clubTitleFallback is cut off: hidden by the container #clubWheelScreenScreenTitle: 0px horizontal, 5px vertical hidden. Seen at: 1440x900, 1536x730. Rect (x,y,w,h): 368.3, 105.4, 662.6, 90. Screenshot: screenshots/club-wheel-revealed__1440x900.png
14. **overlap** On transfer-war-signing at 375x553, two things sit on top of each other (card overlaps control by 1957.7px2): div.stage.pv-mobile > div.world > section.panel.sealed > div.panel-title.reg <-> #refreshSharedTransferChallenge. Seen at: 375x553, 360x560, 412x750. Rect (x,y,w,h): 283.5, 457, 67.1, 29.2. Screenshot: screenshots/transfer-war-signing__375x553.png
15. **overlap** On final-winner at 1536x730, two things sit on top of each other (heading overlaps heading by 1953.4px2): #finalWinnerTitle <-> #finalWinnerHeading. Seen at: 1440x900, 1366x650, 1536x730. Rect (x,y,w,h): 641.4, 255.2, 253.1, 7.7. Screenshot: screenshots/final-winner__1536x730.png
16. **overlap** On transfer-war-signing at 375x553, two things sit on top of each other (card overlaps control by 1774.5px2): div.tw-host > div.stage.pv-mobile > div.world > section.panel.sealed <-> div.tw-host > div.stage.pv-mobile > footer.hud-footer.sd-entered > button.backButton.ghost. Seen at: 375x553, 360x560, 412x750. Rect (x,y,w,h): 11.4, 457, 58.8, 30.2. Screenshot: screenshots/transfer-war-signing__375x553.png
17. **overlap** On trophy-room at 1536x730, two things sit on top of each other (card overlaps heading by 580.9px2): div.shelfGlass > div.trophyGrid > article.trophyCard.sd-glint > picture.trophyCardPicture <-> div.shelfGlass > div.trophyGrid > article.trophyCard.sd-glint > h3. Seen at: 1440x900, 1366x650, 1280x620, 1536x730. Rect (x,y,w,h): 149.6, 531.8, 290.4, 2. Screenshot: screenshots/trophy-room__1536x730.png
18. **overlap** On trophy-room at 1536x730, two things sit on top of each other (image overlaps heading by 580.9px2): div.trophyGrid > article.trophyCard.sd-glint > picture.trophyCardPicture > img <-> div.shelfGlass > div.trophyGrid > article.trophyCard.sd-glint > h3. Seen at: 1440x900, 1366x650, 1280x620, 1536x730. Rect (x,y,w,h): 149.6, 531.8, 290.4, 2. Screenshot: screenshots/trophy-room__1536x730.png
19. **text-clipped** On statistics-career at 375x553, text ("TOGETHER") in #headlineTiles > article.headlineTile.sd-entered > div.headlineCopy > div.headlineTogether is cut off: hidden by the container #headlineTiles > article.headlineTile.sd-entered: 0px horizontal, 6px vertical hidden. Seen at: 375x553, 360x560. Rect (x,y,w,h): 44, 233.8, 25.5, 7. Screenshot: screenshots/statistics-career__375x553.png
20. **overlap** On standings at 1536x730, two things sit on top of each other (heading overlaps card by 3084.4px2): #sdgTitle <-> #standingsScreen > section.sdg-board.sd-panel. Seen at: 1536x730. Rect (x,y,w,h): 445.4, 274.5, 645.1, 4.8. Screenshot: screenshots/standings__1536x730.png
21. **overlap** On home-empty at 393x660, two things sit on top of each other (figure art overlaps figure art: 1532px2 of real pixels = 27.6% of the smaller figure): #mainMenu > div.v10HomeCutouts > picture.phoneHeroCutout.phoneHeroDaniel > img <-> div.fifaMenuShell > div.homeLockup > div.lockupWordmarkWrap.sd-title > img.lockupWordmark. Seen at: 393x660, 375x553, 360x560, 412x750. Rect (x,y,w,h): 110.5, 249.9, 104.1, 57. Screenshot: screenshots/home-empty__393x660.png
22. **overlap** On home-empty at 393x660, two things sit on top of each other (figure art overlaps figure art: 1652px2 of real pixels = 29.8% of the smaller figure): #mainMenu > div.v10HomeCutouts > picture.phoneHeroCutout.phoneHeroNik > img <-> div.fifaMenuShell > div.homeLockup > div.lockupWordmarkWrap.sd-title > img.lockupWordmark. Seen at: 393x660, 375x553, 360x560, 412x750. Rect (x,y,w,h): 141.1, 249.9, 141.4, 62.5. Screenshot: screenshots/home-empty__393x660.png
23. **overlap** On legacy-history at 393x660, two things sit on top of each other (figure art overlaps figure art: 4316px2 of real pixels = 62.2% of the smaller figure): #legacyHeading > picture.legacyWordmarkPicture.sd-glint > img.legacyWordmark <-> #stage-root > div.sd-stage__layer.sd-stage__layer--cutout > picture.legacyPhoneHero.legacyPhoneHero--daniel > img. Seen at: 393x660, 375x553, 360x560, 412x750. Rect (x,y,w,h): 75.4, 200.3, 166.3, 61.6. Screenshot: screenshots/legacy-history__393x660.png
24. **overlap** On legacy-history at 393x660, two things sit on top of each other (figure art overlaps figure art: 3452px2 of real pixels = 49.8% of the smaller figure): #legacyHeading > picture.legacyWordmarkPicture.sd-glint > img.legacyWordmark <-> #stage-root > div.sd-stage__layer.sd-stage__layer--cutout > picture.legacyPhoneHero.legacyPhoneHero--nik > img. Seen at: 393x660, 375x553, 360x560, 412x750. Rect (x,y,w,h): 177.3, 200.3, 124.5, 61.6. Screenshot: screenshots/legacy-history__393x660.png
25. **overlap** On standings at 393x660, two things sit on top of each other (figure art overlaps figure art: 3520px2 of real pixels = 60.1% of the smaller figure): #stage-root > div.sdg-phoneArt > picture.sdg-phoneHero.sdg-phoneHero--daniel > img <-> #sdgTitle > picture > img. Seen at: 393x660, 375x553, 360x560, 412x750. Rect (x,y,w,h): 82.1, 270.3, 158.9, 53.1. Screenshot: screenshots/standings__393x660.png
26. **overlap** On standings at 393x660, two things sit on top of each other (figure art overlaps figure art: 2312px2 of real pixels = 39.5% of the smaller figure): #stage-root > div.sdg-phoneArt > picture.sdg-phoneHero.sdg-phoneHero--nik > img <-> #sdgTitle > picture > img. Seen at: 393x660, 375x553, 360x560, 412x750. Rect (x,y,w,h): 188.6, 270.3, 122.3, 53.1. Screenshot: screenshots/standings__393x660.png
27. **overlap** On transfer-war-signing at 375x553, two things sit on top of each other (card overlaps control by 578px2): div.stage.pv-mobile > div.world > section.panel.sealed > div.panel-title.reg <-> div.tw-host > div.stage.pv-mobile > footer.hud-footer.sd-entered > button.backButton.ghost. Seen at: 375x553, 360x560, 412x750. Rect (x,y,w,h): 50.4, 457, 19.8, 29.2. Screenshot: screenshots/transfer-war-signing__375x553.png
28. **overlap** On legacy-history at 1280x620, two things sit on top of each other (card overlaps control by 149px2): #legacyCardGrid <-> #legacyPager > button. Seen at: 1366x650, 1280x620, 1536x730. Rect (x,y,w,h): 677.8, 470.2, 32, 4.7. Screenshot: screenshots/legacy-history__1280x620.png
29. **overlap** On standings at 1536x730, two things sit on top of each other (control overlaps heading by 181.3px2): #sdgViewShowdown <-> #sdgSection. Seen at: 1536x730. Rect (x,y,w,h): 652, 327.2, 141.5, 1.3. Screenshot: screenshots/standings__1536x730.png
30. **overlap** On standings at 1536x730, two things sit on top of each other (control overlaps heading by 113.3px2): #sdgViewCareer <-> #sdgSection. Seen at: 1536x730. Rect (x,y,w,h): 795.5, 327.2, 88.4, 1.3. Screenshot: screenshots/standings__1536x730.png

## Fix jobs estimate (one screen each, real defects only: not minor, not ignored)

- club-wheel: text-clipped x2
- final-winner: duplicate-text x8, overlap x3, stretched-image x6
- home-empty: overlap x8
- legacy-history: overlap x11, edge-gap x4
- season-results: overlap x6
- standings: overlap x11
- statistics-career: text-clipped x2
- statistics-rivalry: duplicate-text x8, overlap x5
- transfer-war: overlap x18
- trophy-room: overlap x8

Estimated separate fix jobs (screens with at least one non-minor finding): 10. Ignored findings kept in findings.json: 0.

## Screens not reached

- 393x660: connect-players (js/connectPlayersScreenV10.js does not exist on this branch (not on main) | visible screens: dashboard; overlays: overlay)
- 375x553: connect-players (js/connectPlayersScreenV10.js does not exist on this branch (not on main) | visible screens: dashboard; overlays: overlay)
- 360x560: connect-players (js/connectPlayersScreenV10.js does not exist on this branch (not on main) | visible screens: dashboard; overlays: overlay)
- 412x750: connect-players (js/connectPlayersScreenV10.js does not exist on this branch (not on main) | visible screens: dashboard; overlays: overlay)
- 1440x900: connect-players (js/connectPlayersScreenV10.js does not exist on this branch (not on main) | visible screens: dashboard; overlays: overlay)
- 1366x650: connect-players (js/connectPlayersScreenV10.js does not exist on this branch (not on main) | visible screens: dashboard; overlays: overlay)
- 1280x620: connect-players (js/connectPlayersScreenV10.js does not exist on this branch (not on main) | visible screens: dashboard; overlays: overlay)
- 1536x730: connect-players (js/connectPlayersScreenV10.js does not exist on this branch (not on main) | visible screens: dashboard; overlays: overlay)

## Not covered

- Screens that need a real Google sign-in or a live second device (connected rivalry, pairing, live Transfer War timers, Season Results from a real opponent) are shown only through the in-page fake provider fixtures, so their content is representative, not real.
- Settings sub-panels behind confirmation dialogs (restore, reset) are never confirmed; only what is visible without a destructive click is measured.

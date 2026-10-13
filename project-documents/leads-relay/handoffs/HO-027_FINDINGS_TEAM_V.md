# HO-027 findings (Team V, read-only search of origin/main 6610555b9, 12 Oct 2026)

VA = visual-assets/v10_1. None of these sit inside Reduce Motion / prefers-reduced-motion / data-motion rules. Signed out = no career model, so careerScreenSeam.js:46-50,108 puts Career Statistics, Trophy Room, Rivalry and Legacy into "unavailable", which triggers most of them.

## REMOVE (state filters on pictures or screens)
1. Career Statistics (VA/career-statistics/career-statistics.css), data-state empty|unavailable|loading (career-statistics.js:168, fed by js/careerScreensV10.js:74-88):
   - :93 `.headlineTiles {opacity:.34}`
   - :94 turns on `.stateBackdrop` (:19), a dark band up to rgba(4,5,7,.92) over the middle of the screen
   - :95 HIDES the manager cutout `.armCutout`, `.armRim`, `.contactShadow` (display:none). Managers must stay visible in the good look.
   - js/careerScreensV10.js:996-997 phone CSS hides tabs/panels in the same states (keep the words/state message; do not hide the managers).
2. Trophy Room (VA/trophy-room/trophy-room.css):
   - :8 and :45 `.heroCeremony.is-muted {opacity:.3; saturate(.6)}` (trophy-room.js:81-83, loading/unavailable)
   - :11 `.trophyCard.is-unwon` saturate(.3) + `.trophyCardPicture` opacity .26 + `.managerCounts` .42 (trophy-room.js:91,105); also js/careerScreensV10.js:910
3. Final Winner loser (VA/final-winner/final-winner.css; data-spotlight from final-winner.js:131 / js/seasonFinalV10.js:29):
   - :753-756 loser cutout opacity .70
   - :747-750 loser spotlight .06 vs winner .48 (:742-745), neutral .18 (:758): make both sides match the winner's good look
   - :1563-1567 and :1688-1692 phone loser opacity/brightness/saturate; :1569, :1694 neutral
   - js/seasonFinalV10.js:1483-1484 landscape-phone loser; :1481 every PhoneHero opacity .96
4. Final Winner empty states: :345-350 `.winnerTrophySlot` .34 + saturate(.35); :517-521 `.finalWinnerResultsPanel` .62
5. Legacy: VA/legacy/legacy.css:569-574 `.legacyCard[data-status=abandoned|unavailable]` opacity .62 + saturate(.45) (undone only at max-width:900px, :1354)
6. Home: VA/home/home.css:308 `.menuTile:disabled .tileArt` opacity .34 + grayscale(.35) (tile pictures); :307 tile opacity .76 + saturate(.72); css/app.css:118
7. Nav: css/v10Shell.css:107 locked gear image grayscale(.6) brightness(.8)

## KEEP unless Nik says otherwise (not picture/state dimming)
- Disabled buttons (showdown-ui.css:86,105,168,175; connectPlayersV10.css:38; app.css:97; season-results.css:211,614; club.css:282; css/legacy.css:335; navbar.css:49-50 locked tabs .72): a light cue that a button can't be pressed.
- Popup backdrops: Settings delete-confirm (settings.css:616-629), sign-in gate (v10Shell.css:111), remoteJoining.css:1, css/settings.css:8.
- Load-in fades tied to motion (v10Shell.css:17, 283, 300; shared/motion.css:24-40): they prevent the flash. Do not touch.
- Always-on contact shadows, rims, spotlights and plate side fills that are part of the good signed-in look.

## Safe-change checklist
- CSS only where possible; do not touch motion rules, reveal/pending fades or load order.
- Before/after screenshots signed in vs signed out, desktop + phone (393x852), for Career Statistics, Trophy Room, Legacy, Rivalry, Final Winner (both winners + draw), Home.
- The signed-in good look must be pixel-identical before and after.

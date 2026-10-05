# Career Mode Showdown — Version 2.0 polish from the owner's live review (v1.9.1 runtime r56)

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r56`  
Previous known-good runtime: `1.9.1-r55`

## What changed

No gameplay, scoring or Firestore Rules change.

- **Old screens no longer flash before the new look.** Settings, Rule Book, Career Statistics, Trophy Room, History and Rivalry keep the app's own screen invisible while Team V's look loads (`js/v10Screens.js` expect/settle). They show it again on any failure and after the loader timeout. Screen styles now switch on before the screen mounts.
- **Career Statistics opens Team V's screen the first time.** On the first visit the career seam was still loading, so the old screen stayed with its "Career history is unavailable" text. The opener now loads the seam and retries (`js/statistics.js`).
- **The old app header no longer squeezes Team V screens.** It becomes Home's two chips out of the page flow, which fixes the Trophy Room title and counts being cut off. The Trophy Room shelf also fits shorter desktop windows (`css/v10Shell.css`, `trophy-room.css`).
- **The mouse pointer no longer stutters or vanishes on stage screens.** The endless dust and flare animations under blurred panels kept the screen redrawing. They now pause while the pointer moves (`shared/stage.js`, `stage.css`).
- **The corner Settings button uses Team V's premium gear art.**
- **Start Showdown no longer shows the old James Rodriguez photo, and the player one / player two sentence appears once.** Continue Career uses Team V's player-17 tile instead of the cropped Reus cover (PR #369).
- The runtime revision moves to r56 so browsers on r55 receive the changed shell-cached files.

## What did not change

- No Firestore Rules change since r54.
- The scoring formula, canonical local storage behaviour, private Remote Joining (page-memory session only) and Candidate C Apply are unchanged.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r56, and r55 is retained for rollback.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r56.

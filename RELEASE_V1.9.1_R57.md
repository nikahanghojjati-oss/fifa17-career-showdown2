# Career Mode Showdown — Team V's Club Assignment (v1.9.1 runtime r57)

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r57`  
Previous known-good runtime: `1.9.1-r56`

## What changed

No gameplay, scoring or Firestore Rules change.

- **Club Assignment now uses Team V's approved design (frames CL1 to CL6).** Each manager holds a pack, and that manager's crest appears inside it. The screen also has the five-step rail, the VS badge and the matchup row. Daniel stays on the left and Nik on the right, on phone and desktop. The design is Team V's pinned source (`visual-assets/v10_1/club/`, 5e05a1f), mounted on the live `#clubWheelScreen` by `js/clubScreenV10.js` through the v10 screen loader. Styles switch on before mount, and the layout runs again after any size change and once the fonts load.
- **The animation only shows the result the product has already chosen.** Club names, reveal stage and button states come from the product's own screen, which reads the shared Setup provider. Every product id in `js/v10Setup.js` `SETUP_IDS` stays, and each device shows only its own pack action.
- **The old club skin is gone.** `js/v10Setup.js` no longer skins the club screen.
- The new script and styles load lazily when idle, and the startup files are unchanged. Club art is runtime-cached, while the script and CSS are in the shell cache.
- **The polished presentation audit no longer races on slow hosts.** It now holds the club write in flight until its repeat tap has landed. Before this, a slow host could finish the 180ms write before the repeat tap arrived. That failure reproduced on main under CPU throttling, so it was not caused by this change. The single-commit assertion now runs every time.
- The runtime revision moves to r57 so browsers on r56 receive the changed shell-cached files.

## What did not change

- No Firestore Rules change since r54.
- The scoring formula, canonical local storage behaviour, private Remote Joining (page-memory session only) and Candidate C Apply are unchanged.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r57, and r56 is retained for rollback.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r57.

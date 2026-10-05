# Career Mode Showdown — no old player photos, seven Home tiles (v1.9.1 runtime r60)

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r60`  
Previous known-good runtime: `1.9.1-r59`

## What changed

No gameplay, scoring or Firestore Rules change. Both changes are Nik's decisions of 2026-10-05.

- **No old player photo cards.** No screen shows a licensed player photo card any more. This covers League, Club Assignment, Showdown Home, the Transfer Window, Season Entry, Season Summary, Career Statistics, Trophy Room, History and Rule Book, and Start Showdown was already free of them.
  - `FOOTBALL_VISUAL_SCREEN_PLAN` is now empty, and those routes are in `FOOTBALL_VISUAL_FREE_SCREENS`, so they still open without fetching a photograph.
  - The licensed archive and its credits stay in the repository, unrouted.
  - The licensed-visual contract and the football visual audit now prove that no screen shows a photo card and that no photograph is fetched.
- **Home shows all seven of Team V's tiles:** Continue Career, Start a Showdown, Legacy, Statistics, Trophy Room, Rule Book and Settings.
  - The r43 rule in `css/app.css` that hid Legacy and Statistics is removed. Since job 28 these screens have read the shared career through the career screen seam, not retired local data.
  - The dashboard's local Rivalry Statistics button stays contained.
  - Trophy Room is a new Home tile (`#homeTrophyRoomButton`, because Career Statistics owns `#trophyRoomButton`). It carries Team V's league-title trophy art from the Home frame and opens the product's own Trophy Room route.
  - On phones the tiles follow Team V's frame: Continue on its own row, then two rows of three, then the soundtrack strip. On desktop they share one row, and narrow desktops use slightly smaller labels so every label fits.
- **Home soundtrack has 11 tracks (Nik, 2026-10-05).**
  - "What You Got" (Valentino Khan & NITTI) is removed. Its uploader deleted it on Audius (`is_delete=true`, `is_streamable=false`), so it failed on every device. Nasty is now first and the default track.
  - None of the six songs from the old FIFA 17 YouTube player is on Audius as an official upload. Instead there are six similar tracks, each checked by id as streamable, not deleted, not gated and not unlisted: Everything I Know (Speelburg), Tell Me What You Want (Weezer), Next To You (RAC ft. Emerson Leif), Hard Feelings (Miquela), silly boy (oshi) and Uproar (Mike Shinoda).
  - Two FIFA 17 songs come back in versions that are on Audius (Nik asked for them): Shelter (EFFUGIO remix, `DOpRe`) and a fan cover of High And Low (Aba, `W677j`). Both were checked by id as streamable.
  - The phone track sheet sizes its CLOSE button from the number of track rows. `js/homeScreensV10.js` sets `--track-rows` and `css/homeV10.css` uses it, so CLOSE stays in the sheet's top padding instead of covering a track. Track titles stay on one line.
- The runtime revision moves to r60 so browsers on r59 receive the changed shell-cached files.

## What did not change

- No Firestore Rules change since r54.
- The scoring formula, canonical local storage behaviour, private Remote Joining (page-memory session only) and Candidate C Apply are unchanged.
- The startup loading screen still shows its own Reus photo. That is the Team V loading screen job, which changes startup files.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r60, and r59 is retained for rollback.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r60.

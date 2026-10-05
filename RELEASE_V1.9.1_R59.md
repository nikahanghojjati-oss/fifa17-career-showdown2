# Career Mode Showdown — Team V screen fixes from the visual check (v1.9.1 runtime r59)

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r59`  
Previous known-good runtime: `1.9.1-r58`

## What changed

No gameplay, scoring or Firestore Rules change.

- **Header chips (Team V hand-off HO-003).** On desktop, the sign-in and season chips now sit in the top bar beside the Settings gear on every Team V screen, so they no longer touch titles or stage art. On phone stage screens the chips are visually hidden but stay available to screen readers, and they come back on keyboard focus. Home keeps its chips. On these screens the footer is visually hidden; the version is shown in Settings. `css/v10Shell.css` uses Team V's drop-in block and still has no `display:none` (contract F8).
- **Team V's visual check (HO-004), fixed rows:**
  - Career Statistics, Trophy Room, Rivalry and History fill the viewport instead of sitting in a 1510px box with black bands.
  - The Home tiles take Team V's cut-corner panel, and the soundtrack tile drops the old player box and white text.
  - On Rule Book, the old `css/rulebook.css` sheet is switched off while Team V's look is mounted. The hero text, eyebrow, tagline, section number chips, scoring table and back button now match the approved frame.
  - Settings now matches the frame:
    - the eyebrow is cream;
    - the light rule above DONE is gone;
    - UPDATE and OPEN HISTORY are auto-width buttons;
    - the "TWO MANAGERS. ONE LEGACY." tagline is added;
    - panel headings take Team V's size (an undefined token had left them at 16px).
  - Standings fits the whole head-to-head at 1920x910.
  - History's BACK TO MAIN MENU joins the action row instead of floating over the art.
- **Left for the owner or Team V:**
  - The football photo cards on Season Entry and League stay, because contract S9 and the "football imagery is required presentation" decision protect them.
  - Home keeps 4 tiles (the r43 containment).
  - The Team V loading screen would change startup files.
  - The local (non-shared) Transfer route is still unskinned.
- The runtime revision moves to r59 so browsers on r58 receive the changed shell-cached files.

## What did not change

- No Firestore Rules change since r54.
- The scoring formula, canonical local storage behaviour, private Remote Joining (page-memory session only) and Candidate C Apply are unchanged.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r59, and r58 is retained for rollback.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r59.

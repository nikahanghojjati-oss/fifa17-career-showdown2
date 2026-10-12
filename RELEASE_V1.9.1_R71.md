# Career Mode Showdown — smooth screens, new loading screen and desktop fixes (v1.9.1 runtime r71)

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r71`  
Previous known-good runtime: `1.9.1-r70`

## What changed

- Screen changes are smooth and nothing from the old game ever flashes (JOB-1635, PR #680): Team V screens reveal once
  their look and pictures are ready, Team V sheets are never fetched again on return, double taps start one navigation,
  and reduced motion swaps screens instantly. A frame-by-frame browser guard (`test:v10-flash`) protects it.
- New black-and-gold loading screen on phone and desktop (JOB-1647, PR #689). It keeps the Marco Reus photo and credit
  and every live word, and it is styled at first paint from `css/app.css` only.
- Desktop stadium plates with both managers show again (JOB-1657, PR #694): Select League no longer renders flat black,
  and Rivalry and Legacy keep their plate after Season Results was visited.
- Shared play fixes: a failed refresh after a good Season Results publish or Season Commit no longer looks like a
  failure (JOB-1606, JOB-1607), a background read no longer disables the Shared Setup buttons (JOB-1608), and a
  same-moment Season Results publish never strands one manager (JOB-1611).
- Layout fixes, each checked in a headless browser before and after:
  - Phone adoptions: Connect Players (JOB-1592), Club (JOB-1594 to 1596), Rivalry and Legacy (JOB-1593, 1600, 1601),
    Season Results entry (JOB-1597 to 1599).
  - Tablet and desktop sizes: Home (JOB-1066 to 1070), Connect Players (JOB-1095 to 1099), Select League
    (JOB-1124 to 1128) and Season Results (JOB-1211 to 1215).
- CI only: the Showdown Gate splits L3 and caches downloads (JOB-1581) and keeps screenshots of changed screens
  (JOB-1582).
- The runtime revision moves to r71.

## What did not change

- The scoring formula, canonical local storage, Remote Joining and Candidate C Apply stay as they were.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r71, and r70 is retained for rollback.

## Firestore Rules

- No Firestore Rules change. Production Rules stay as deployed with r67.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No
SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r71.

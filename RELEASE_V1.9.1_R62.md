# Career Mode Showdown — bug-hunt fixes (v1.9.1 runtime r62)

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r62`  
Previous known-good runtime: `1.9.1-r61`

## What changed

No scoring or Firestore Rules change.

- **Plain-language errors (BUG-1).** Setup, tap and signing errors now say what happened and what to tap next, instead of showing raw codes. If a name is missing, "Manager 1" and "Manager 2" are used. Signing names are capped at 80 characters.
- **Brief network hiccups no longer break the flow (BH-7).**
  - Setup holds a transient error for one poll before showing it.
  - Terminal Close retries at most once every 30 seconds, one attempt at a time.
  - A lost CLOSE race is re-read instead of reported as a failure.
- **The final winner shows automatically (BH-8, Nik 2026-10-05).** After the Showdown closes, the final preview loads on its own, with a 14-second throttle and one attempt at a time. Apply stays a tap and is never automatic.
- **Pairing and reconnect (BH-11).**
  - **After a reload:** a phone that still holds the old session can host or join a new one (HOST NEW SESSION / JOIN NEW SESSION), and the recovered banner offers NEW SESSION CODE. A phone with no session explains how to reconnect.
  - **Joining a pair:** CREATE and JOIN run one at a time. A join that committed despite an error is recognized. Raw Firebase errors become plain sentences with CHECK STATUS. A pasted message containing one code joins with it.
  - **Deleting:** delete and close actions need a real confirmation.
  - **Storage:** browser storage is asked to persist once a pair exists.
- **Phone Home layout (G-F15, G-F16).** On landscape phones, the music controls no longer cover the Settings, Rule Book and Trophy Room tiles. START A SHOWDOWN no longer touches its icon at 393px.
- **Showdown Home on Team V's screens (PR #384).** The Team V screens now carry the identity checks that the analytics audit requires.
- **Desktop Settings no longer clips its cards.** The card area scrolls, so UPDATE TO LATEST VERSION and all of Showdown Data are visible on desktop. Before this, a desktop browser could stay on an old build because the Update button was hidden. The status box under Update is readable and shows "Checking…" and then the result.
- **Steadier screens (G-F6, G-F6b).**
  - The Transfer and Club screens re-frame on the next animation frame instead of inside the resize callback.
  - The browser's harmless "ResizeObserver loop" notice no longer shows an error toast.
- The runtime revision moves to r62, so browsers on r61 receive the changed shell files.

## What did not change

- No Firestore Rules change since r54.
- These stay as they were: the scoring formula, canonical local storage behaviour, private Remote Joining (page-memory session only) and Candidate C Apply.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r62, and r61 is retained for rollback.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r62.

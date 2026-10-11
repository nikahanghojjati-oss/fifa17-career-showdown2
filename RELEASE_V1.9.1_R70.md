# Career Mode Showdown — soundtrack and phone fixes (v1.9.1 runtime r70)

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r70`  
Previous known-good runtime: `1.9.1-r69`

## What changed

- Home soundtrack is Nik's ten locked Audius songs, in his order (JOB-1591, PR #630): Business, Tabestoon Kootahe,
  Sarnevesht, Next to You, Hate It or Love It (MIKE GIP Jersey Club), Banafsh, Dideh o Del, Yakuza, Nasty and Chera
  Badi. Business is selected first, and nothing plays before Play. Only the track list changed; Team V's player is the
  same. An unplayable track shows the stream-unavailable message and never plays another song.
- Trophy Room has Team V's high-resolution trophy art (1536 px) for the four trophies (PR #624), with pinned hashes.
  The All grid still uses the 512 px files.
- Phone layout fixes (GPT trains, each checked in a headless browser before and after):
  - Season entry and Trophy Room on small phones (PR #596).
  - Home soundtrack sheet shows every track and CLOSE without its own scroll (PR #588, via #631).
  - Connect Players scrolls as one screen in landscape, so every pairing button can be reached (PR #590, via #631).
  - League wheel fits SPIN and BACK without a scroll at 360x640 (PR #593, via #631).
- The runtime revision moves to r70.

## What did not change

- The scoring formula, canonical local storage, Remote Joining and Candidate C Apply stay as they were.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r70, and r69 is retained for rollback.

## Firestore Rules

- No Firestore Rules change. Production Rules stay as deployed with r67.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No
SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r70.

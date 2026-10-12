# Career Mode Showdown — premium scenery, no old-design flash and bug fixes (v1.9.1 runtime r73)

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r73`  
Previous known-good runtime: `1.9.1-r72`

## What changed

- Premium scenery on every desktop screen: Team V's 14 clean scenery plates (plate V2, no people, no words) are wired
  in at the desktop picture range, each browser-checked by the Team G lead against the approved picture:
  - Home (PR #790), Connect Players (PR #794), Select League (PR #799, with #771), Club (PR #808),
    Transfer Challenge (PR #767), Season Results (PR #797), Standings (PR #816), Final Winner (PR #812),
    Rivalry Statistics (PR #813), Legacy (PR #804), Trophy Room (PR #810), Career Statistics (PR #805),
    Rule Book (PR #806) and Settings (PR #811).
  - Phones, sideways phones and tablets keep their adopted stadium designs.
- No old-design frame on open: Season Results, Final Winner and Standings are held behind the V10 cover from the first
  frame, like every other screen, and Setup's phone pictures decode before they show (PR #824). This was also on
  live r72. The screen-flash guard now covers Standings as a blocking journey.
- The flash test is now a normal blocking check on every pull request, at Nik's request (PR #826).
- Six layout flaws found in the r73 screen check are fixed (PRs #827 and #828): the Season Results phone bar, fonts
  and focus ring; the footer font; the Club confirmation block no longer slides across Nik's face on desktop; Rule Book
  cards 05/06 clear the Back bar at 1280x650; Final Winner sideways spacing; and no stray phone scroll on Club,
  Rivalry and Legacy.
- Transfer Challenge: on phones and sideways, LOCK MY GUESSES, REQUEST EARLY END and CONTINUE no longer jump while
  the panel enters, so the first tap always registers (PR #767).
- Screen jobs on every size: League (#771), Club (#764), Season Results (#759), Standings (#787), Final Winner (#793),
  Rivalry (#757), Legacy (#776), Trophy Room (#761), Career Statistics (#798), Rule Book (#762), Settings (#809),
  adopted studies 1727, 1728, 1730 and 1731 on sideways and tablet (#791), and four r72 visual flaws (#788).
- FULL MOTION now wins over a device that asks for reduced motion (PR #751).
- Home soundtrack: In Da Club (San Holo Remix) replaces Tabestoon Kootahe and Sijal - Fresh replaces Dideh o Del,
  at Nik's request (PR #823). The other eight songs and the order stay.
- Bug fixes from the GPT audits, each checked by the Team G lead (batches #814, #817, #820, plus #821 and #822):
  backup, restore, import analysis, save library, storage, screens, diagnostics, shared Transfer Challenge, season
  commit, canonical scoring, season results route, journey conflicts, final reconciliation, multi-season progression,
  Shared Setup session expiry, and Statistics loading errors that left a button busy. JOB-1780 was dropped because it
  broke the ten-season continuity rule.
- Startup bytes: 37428 gzip (budget 37495), after the JOB-1791 headroom work.
- The runtime revision moves to r73.

## What did not change

- The scoring formula, game rules, canonical local storage, Remote Joining and Candidate C Apply stay as they were.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r73, and r72 is retained for rollback.

## Firestore Rules

- No Firestore Rules change. Production Rules stay as deployed with r67.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is at `0/100` until a validated two-device production run is recorded. No
SSJR credit comes from this source, CI or deployment. No physical acceptance is claimed for r73.

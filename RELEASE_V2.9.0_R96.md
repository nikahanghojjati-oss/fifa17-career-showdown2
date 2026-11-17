# Career Mode Showdown 2.9.0 (r96): the short list fixed, namesakes, the final-season reopen, a level for every 3D screen (v2.9.0 runtime r96)

Application version: `v2.9.0`  
Runtime asset revision: `2.9.0-r96` (Nik's "OK version 2.9.0", 2026-11-17 23:25 UTC)  
Previous known-good runtime: `2.8.0-r95`

r96 is 2.9.0. On 17 November (19:45 UTC) Nik picked all six items left on the list when 2.8.0 went live, with one condition:
"fix these but no fable until i authorize". No Fable model worked on r96. Later that evening he asked for the 3D quality to
follow each screen's weight, and chose on a card that a hand-picked level becomes a ceiling. This file is the release record. The
list below is every pull request merged into gameplay/r96 since 2.8.0 went live (main 30b79695): the Rules re-pin f5808a4 (no
Rules change), #1540 to #1546 and #1548, and this release's version bump (the PR that adds this file). #1547 was closed, never
merged.

## What changed

- **Career Start faces clear on the smallest sideways phones** (#1541, item 1). At 568x320 the text panel covered both managers.
  The sideways-phone band layout (plate in a left band, panel on the right) now starts at 560 px wide instead of 600
  (`css/v10Club.css` and `SIDE_MQ` in `js/clubScreenV10.js`); the Ball Game at 568x320 uses the same band. The held crests are
  placed from the box-room plate's real position (`pcstStageFrames` in `js/productionSharedCareerStart.js`), so they stand on the
  counter instead of on Nik's chin, upright phones included; r95's `translateY(26%)` rule is gone. The 22 px title is 18 px on
  landscape screens up to 620 px wide. `career-start-b-fits-audit` now passes at 844x390 and 915x412 (failed before) and at
  568x320, 640x360, 667x375, 740x360 and 874x402.
- **Desktop captions at least 13 px** (#1543 and #1544, item 3). Chamber Men's PICK YOUR SHOT / PICK YOUR DIVE row captions go
  from 12 to 13 px at 900 px wide and up (#1543; the stage already used the width its height allows: 60 % at 1920x866, 66 % at
  1920x1035). #1544 raises every other desktop caption under 13 px to 13 px at 1024 px and up; phone floors are unchanged. Rules
  already in `css/app.css` were raised in place and the rest went into the lazy `css/r95-type.css`, so the startup bundle stays at
  33,988 of its 34,000 gzip bytes. The Career Statistics headline label takes 13 px only at 700 px high or more.
- **Connect Players: nothing under BACK** (#1545). On a desktop window the boxes of the PLAYER TWO and NIK · JOIN lines ran under
  the BACK corner button (the words never touched it). The two lines now end 64 px short of the card's right edge; the button did
  not move. Layout measure: OVERLAP 10 before, 0 after, every other count identical, at nine window sizes.
- **Namesakes: a shot bars only the shot man; the squad card shows each one's nation** (#1542, item 6). When the roulette shoots
  one of two signings who share a name (Tottenham's Mousa Dembélé, Belgium, and Celtic's Moussa Dembélé, France), the LOCK
  (`pstcSignedIds`) and the squad engine (`shotBar`) now bar only his player id when the shot man's window names one man; his
  namesake from another window can be signed again and joins as himself. Two men of the name in the hit's window, or any typed
  row of the name, keep the old wide bar. The squad card's existing Nation text line reads each signing's own nation from the
  Transfer War player list (a static site file); no flag images (Nik). Contract N9 fuzzes 300 careers (21,600 agreement checks)
  and a 2.8.0 squad engine (main 30b79695, vendored) builds the same boards.
- **A tab closed right after the final CONFIRM reopens on Final Winner** (#1546, item 2, hunt 2.8.0 F3, also in 2.7.0).
  Reproduced on demand first (3 of 3 failures with a local hook that holds the other phone's close and slows the reopened tab).
  Two causes: the reopened tab entering the still-live Showdown had no path to the Champion when the other phone closed it during
  the entry; and the "Champion due" note was written only after the season was accepted. Fix: the journey entry watches the pair
  and, if that Showdown closes before the entry got past Home (3 minutes, once per Showdown), opens the Showdown Champion through
  F1's existing reload-after-close routine; the final season's own CONFIRM tap writes the local note before any write. It never
  invents the other manager's action and opens the Champion only from a verified CLOSED terminal witness. After: forced runs 3/3
  pass, 3-season outage runs 3/3 pass with Final Winner 2.8 to 3.0 s after reopening. New contract
  `tests/contracts/r96-final-resume-contracts.cjs` (10 checks).
- **3D quality per screen; a picked level is a ceiling** (#1548, Nik 2026-11-17 21:43 to 21:45 UTC).
  - A hand-picked level is a ceiling: the governor walks its ladder (pixel ratio first, then heavy parts) only between beats, with
    a soft fade, and climbs back toward the pick, never above it. `?gfx=N` stays forced, the crash cap and the weak-device
    Ultra/8K gate still apply, and Settings still shows the pick.
  - Auto per screen: the Device check also times the Ball Game (new frame `device-check-ball.html`, staged by the Pages workflow,
    always from the network like the other Device check pages). Each screen saves its best level (`gfxMeasured.v2.scenes`);
    Chamber Men, the Roulette, the Special Player and the Ball Game each play at their own level; the lowest stays the device's
    level for 2D, `html[data-gfx]` and Settings. A 2.8.0 result applies to every screen. On a phone a screen's own raise stops at
    Extra (Ultra is over the 300 MB budget: Chamber Men 397 MB, Special Player 481 MB on the iPhone 17 profile).
  - A slow step is retried once in the same visit after three smooth beats and a timed frame with room; a second miss waits for
    the next visit and never sets the week-long floor.
  - Settings reads "Auto: Balanced to High by screen." when the screens differ (fits the 1366x640 plate on one line).
- **Chamber Men on a real graphics card** (item 5). A private preview page played the real scene for Nik: posts, crossbar, net,
  kits, run-up, stands, boards and pitch right; Extra holds 60 fps on a laptop and Ultra fell to 24 fps there, which led to the
  ceiling above. A per-taker shirt-number decal (#1547) was rejected on sight ("floating out of shirt"), closed and never merged:
  numbers stay one per club, as in 2.8.0.
- **Story** (#1540, this PR). #1540 says 2.8.0 is live and completes Volume 23. This PR adds Volume 24, "A Level for Every
  Screen" (chapters 205 to 209), the 2.9.0 dispatch (`#latest/r96`), Edition 21 labels, the newest-volume banner exemption on the
  new part, and revises chapter 204's "not fixed yet" line (those three items are fixed in 2.9.0). The live line is dateless
  ("Then Nik gives the word, and 2.9.0 goes live."). Counts measured in Chromium: 209 chapters, 93,128 words, 1,078 cited
  source URLs. The Story is its own site, outside the game's shell.

## Firestore Rules

- **Unchanged from 2.8.0.** No r96 pull request touches the Rules sources. The composed production Rules are
  `5b36d9d8e8dd54e213ffb7c7fba2a2b824cf5dc1572093fb8fec30a8f44a1678`, the same as main 30b79695 (2.8.0); the reviewed main delta
  (`tests/fixtures/composed-production-rules/main-delta.json`, re-pinned on gameplay/r96 at f5808a4 with Nik's "OK re-pin r96")
  lists 0 hunks. The Rules deploy on the release merge is a no-op re-deploy of the same Rules.

## Reads and writes

CE2PG single plan, 3 seasons, waits off, Firebase emulator only (no production reads), firebase@12.17.0, both managers and both
phones, run side by side on the same cloud container on 2026-11-17 (~23:45 to 00:05 UTC). 2.8.0 = main 30b79695; 2.9.0 = this
branch's bump commit af81d112 (gameplay/r96 a6924483 + the bump; #1544 is CSS only). Both use the same composed Rules
`5b36d9d8…`. Both runs PASS 296/296, 0 problems. Billed = the CE2PG meter's own definition (document reads plus Rules lookups on
reads and on writes). The harness Chromium has no WebGL2, so the 3D screens play their flat stand-ins (same reads and writes).

| Season | 2.8.0 billed / writes | 2.9.0 billed / writes | Change |
|---|---|---|---|
| 1 (START, pairing, setup) | 1,485 / 117 | 1,485 / 117 | 0 |
| 2 | 804 / 58 | 792 / 58 | -12 |
| 3 (final) | 567 / 28 | 566 / 28 | -1 |
| **Total** | **2,856 / 203** | **2,843 / 203** | **-13 (-0.5 %)** |

Detail (doc reads + Rules on reads + Rules on writes): 2.8.0 483+504+498, 256+301+247, 196+220+151; 2.9.0 482+505+498,
249+296+247, 195+220+151. Writes and Rules lookups on writes are identical every season, as designed: r96 adds no Firestore read
or write in play. The small difference is one run each and of normal run-to-run size; no saving is claimed, only no added cost.
The F3 fix (#1546) reads at most one Terminal Close (3 to 4 documents) only on the reopen-after-close path, which a normal game
never takes. Against the 2.8.0 hunt's 10-season figure (10,290 billed / 614 writes), nothing in r96 changes the per-season shape.

## Update safety

- The shell and service worker advance to 2.9.0-r96 in a fresh `career-mode-showdown-shell-2.9.0-r96` cache, and 2.8.0-r95 is
  retained for rollback, verified against its own 260 paths (`tests/fixtures/shell-paths/2.8.0-r95.json`, from main 30b79695).
  r96 adds and removes no shell path (the new `device-check-ball.html` is a standalone network page, never precached), so
  `SHELL_PATHS_ADDED_SINCE_PREVIOUS` and `SHELL_PATHS_REMOVED_SINCE_PREVIOUS` are both empty and `SHELL_PATHS` still holds 260
  paths. The hunt's `sw-sets.cjs` against main 30b79695: 0 truly added, 0 truly removed, none declared either way, no shell file
  missing on disk.
- Real service-worker update, measured with the hunt's update probe pattern (local only, no Firebase): a page installed on 2.8.0
(main 30b79695, offline pack filled) is served the 2.9.0 tree, reloads and takes 2.9.0 in 4.8 s (one explicit
`registration.update()` after the reload, which this container needs). The 2.9.0 worker reports its own shell complete (0 missing)
and the retained 2.8.0 shell verified against its 260 paths (0 missing), recovery revision 2.8.0-r95. Fonts: 0 missing on 2.9.0
online and offline. Rollback to 2.8.0 is accepted, the page comes back as 2.8.0-r95, and its fonts are all found online and
offline (0 of 4 missing). Log: gameplay/r96/threads/bump/probe-update.log (project files).
- `js/gfxTier.js` BUILD moves with the service worker's RUNTIME_REVISION, so a crash limit written by 2.8.0 is dropped once on the
  first 2.9.0 load. A 2.8.0 Device check result (one level) is read as that level for every screen until the next check.
- An installed phone takes the update on Home, never in the middle of a game screen.
- **Mixed versions.** 2.9.0 adds no Firestore key and no Rules change, so a 2.8.0 phone and a 2.9.0 phone can share a
  Showdown. The one place they part (#1542): a namesake who was away on loan and is signed again after the other was shot stands
  in his old window on a 2.8.0 phone, so the squad boards' versions differ and the roulette's existing version stop asks that
  phone to update (1 screen in 12,000 fuzzed). Release-day step anyway: both managers open Home once on 2.9.0 before the first
  2.9.0 Showdown.
- Finished and in-progress Showdowns are untouched. No saved Showdown is rewritten. Nothing in Firebase is deleted or edited.

## Version bump

- `2.9.0-r96` everywhere it is pinned (this PR): package files, `APP_VERSION` (Settings and backups), the footer `v2.9.0`,
  `app-asset-revision` and every `?v=` on Home's own files and the manifest icons, `js/menuExperience.js`, the service worker's
  `RUNTIME_REVISION` (PREVIOUS `2.8.0-r95`), and `js/gfxTier.js` BUILD. The version strings are the same length as 2.8.0's, so the
  startup budget is unchanged. `index.html` differs from 2.8.0's only in those version strings.
- Rollback shell fixture `tests/fixtures/shell-paths/2.8.0-r95.json` (260 paths, main 30b79695). Contracts moved on with it:
  r86 RR3/RR4, r87 UR3/UR5 and new UR15 (2.8.0 = 2.7.0 plus Instrument Sans, minus the 43 old font files), r78 R4c (sorted 2.8.0
  list sha `e0996bb2…`), r79 M, v10-club 4, v10-rules-settings RS9, v10-foundation F9/F9b and F10 (index.html with its 2.9.0-r96
  pins and footer).

## Release day

1. Nik types the merge word; the release merges into main; Rules (unchanged) and site deploy.
2. Nik checks the footer says **v2.9.0** on both phones and the Chromebook.
3. Both managers open Home once on 2.9.0 before starting a Showdown.
4. Nik runs a fresh **Device check** on the Chromebook (Settings > 3D QUALITY > Device check…) so each 3D screen gets its own
   Auto level. Until then the 2.8.0 result applies to every screen.

## What did not change

- No tiebreak anywhere. Scoring, season order, the Ball Game, Chamber Men, the roulette, Prime Pack and the Transfer War rules
  are unchanged. A shot player still never comes back.
- Pairing, joining and the Remote Joining protocol keep their rules. Setup is still 6 writes.
- The no-flash rules and the Reus Gate are unchanged.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.

## Moved to the next release

- The bounded season-end red team for Astra 6.2 and Sol 6.2 (packet `r96-redteam/SEASON_END_HUNT_R96.md` on audit-packets,
  pinned at gameplay/r96 93af7740): Nik hit the usage limit before Astra answered (23:24 UTC), so it runs against the next build
  after 2.9.0 ships, re-pinned.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is `100/100`, earned on r85 (`1.9.9-r85`). No SSJR credit comes from this
source, CI or deployment, and no new physical acceptance is claimed for 2.9.0. The final-season reopen fix (#1546) and the
per-screen levels (#1548) still need their real-device proof.

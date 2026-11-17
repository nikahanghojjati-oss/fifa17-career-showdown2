# Career Mode Showdown 2.7.0 (r94): a football you stop yourself (v2.7.0 runtime r94)

Application version: `v2.7.0`  
Runtime asset revision: `2.7.0-r94` (Nik's "OK version 2.7.0", 2026-11-16 23:46 UTC)  
Previous known-good runtime: `2.6.0-r93`

r94 is 2.7.0. Nik picked a new Club Assignment from a mock-up on 15 November: a real stitched football for each manager with
three clubs on it, and one STOP. The same day he approved image crests for all 98 clubs, and asked for the whole Story to be
retold as a novel to listen to. A Fable study looked for the next Firebase limit the game could hit. This file is the release
record. The list below is every pull request merged into gameplay/r94 since 2.6.0 went live (main 5c5472f6): #1487, #1489,
#1492, #1497 to #1503, and this release's items (the PR that adds this file). Up to gameplay/r94 9742fa70, plus #1503 when it merges.

## What changed

- **Club Assignment: spin and stop** (#1498 protocol and Rules, #1499 scene, #1500 wiring, #1502 Rule Book, #1503 look). After
  the league reveal each manager gets three random clubs from the drawn league (six different clubs in all) on their own stitched
  football. A slow first look shows all three crests, then the ball spins fast, and one tap on **STOP** on their own phone decides:
  the third the ball rests on is their club. Skill plus luck: a well-timed stop lands the aimed club about half the time (the grass
  adds up to 120 degrees either way), a blind tap one time in three. No second spin, no timer, no auto-stop.
  - Data: the six candidates are worked out from the Showdown's random id like the old draw (nothing new stored for them). Each
    manager's stop is one integer 0 to 359 in the new ledger key `stops`, carried inside that manager's existing confirm. A Showdown still
    makes **6 setup writes**; reads unchanged; `schemaVersion` stays 1.
  - First tap wins: the stop is saved on the phone before it is sent; a lost reply, reload, double tap or second tab sends the same
    stop again. The ball never rests before Firebase holds the stop. If the phone refuses to save, the stop is kept in memory and
    still sent ("Keep this screen open until it lands").
  - Finished and running Showdowns keep their clubs byte for byte: 120 old-draw vectors from the unchanged code plus 6 saved
    Showdowns are replayed by `tests/contracts/r94-club-draw-protocol-contracts.cjs`. A Setup opened before 2.7.0 (no `stops`) keeps
    the club packs.
  - Look (#1503, Nik's notes of 16 November): Showdown Home's marble black-and-gold language, all three crests fully visible in the
    slow first look, each club's own 2016-17 kit colours and pattern on its third (plain same-colour shirts in a league differ in at
    least two cues), sideways phones show both balls and STOP with no scroll, gold STOP when it can be pressed and muted while it
    waits, no CLUB DRAW status box, and Team V's new empty walnut-and-stone club lounge behind the scene (HO-094,
    `ENV_CLUB_PLATE_HC_V3_1X/2X`, `ENV_CLUB_PHONE_HC_V3`).
  - Without WebGL2 a flat stand-in shows the three crests per manager with the same rules and writes. The harness browsers have no
    WebGL2, so CE2PG and the Gate journeys play the stand-in; the 3D ball is proven only by the gallery and real devices.
  - Rule Book card 01 explains the spin and stop (#1502).
- **Image crests for all 98 clubs** (#1492; Team V HO-084 to HO-093) at 64 and 256 px, with the drawn crest kept as the fallback
  for an image that fails to load; a 512 px "ball" size for the 3D Club Assignment (#1497). The flat shirt on Squad Management and
  the roulette board is Team V's photographed master shirt, tinted with each club's kit (35 KB once per session). 15 clubs outside
  the game's leagues keep drawn crests. The Gazette front page (a pinned Team V file) keeps the drawn crest.
- **Red shirts on Squad Management** (#1487). A shirt that failed to paint (a phone short on canvas memory) was remembered for the
  whole session and every club was drawn in one red kit. Failures are no longer remembered, the stand-in wears the club's own kit
  colour, and the screen retries at 1.5, 4, 10 and 20 s (never mid-drag). One-colour kits get 2016-17 detailing.
- **Story: the whole Chronicle as a science-fiction audiobook** (#1489). All 194 chapters retold in Claude's first-person narrator
  voice, written for the Listen button (codes moved to each chapter's Notes & sources, which the voice skips); Listen on the Story's
  front page; a "More voices" list of every English voice on the device. Volume 22, "The ball and the voice" (chapters 195 to 199),
  tells r94 (this release's items PR). The Story is its own site, outside the game's shell.
- **Firebase limits guards** (#1501, from the R94-05 Fable study). Tests and tooling only: the Gate's Rules budget sweep also counts
  Rules lookups per write (fails within 1 of the cap); JOIN at a full 500-Showdown History index is tested; every client save is now
  measured, including single-document saves the meter used to miss (`tests/fixtures/rules-budget/write-sites.json`, contract S9,
  63 kinds from 17 flows). No game change.

## Firestore Rules

- Changed (R94-02 only). Composed production Rules SHA-256
  `4cb7b87855586000481c65a86663491a4bc74ec70d7f3530057200ce61e7bcb3` (194,269 bytes); 2.6.0 is `b3d46619…` (193,331 bytes). The
  reviewed main delta (`tests/fixtures/composed-production-rules/main-delta.json`) names main 5c5472f6 and lists 4 hunks, owner
  R94-02: `stops` is an allowed ledger key; create requires `stops == []` when present; after create the key can never be added
  or dropped; the first confirm writes one int 0..359 and the second keeps it and adds its own. Old-shape ledgers pass unchanged.
  Nik gave the Rules an OK in words ("OK rules r94", 2026-11-16 14:24 UTC) before #1498 merged into gameplay/r94.
- Rules budget sweep (Gate L5, `tests/fixtures/rules-budget/baseline.json`, of 1,000 expressions; bar 850): only the six setup
  kinds moved. Open 606 to 618, commit-league 680 to 708, commit-clubs 680 to 708, commit-length 689 to 717, first confirm 702 to
  761, second confirm 733 to **811**. Every other kind unchanged; no Rules lookup added. Worst writes overall are unchanged: JOIN
  ~904 and season commit create ~898 (knownOver, fixed-size), rivalry Terminal Progress with the sacked map ~866 (newly measured by
  #1501, not a change). Lookups: worst single document CONFIRM SEASON 8 of 10; worst request 9 of 20 (JOIN at a History page turn).
- Compile probe (measure-firestore-rules-compile, compile only, nothing published): run
  [43982537221](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/43982537221), alternating 2.7.0 and
  main, 3 compiles per entry, 9 each: 2.7.0 (gameplay/r94 9742fa70) 9/9 HTTP 200 in 1.95 to 2.85 s; main 5c5472f6 (2.6.0) 9/9
  in 1.58 to 2.49 s. Both report the same 12 compiler warnings. Well under the 5 s compile deadline. #1503 does not touch the Rules.

## Reads and writes

CE2PG single plan, 3 seasons, Firebase emulator only, firebase@12.17.0, both trees side by side on the same container on
2026-11-16 (~23:47 to 00:15 UTC). Both PASS (2.6.0 295/295, 2.7.0 296/296, 0 problems). Billed = document reads plus Rules lookups on reads and writes, both phones. The harness has
no WebGL2, so 2.7.0 plays the Club Assignment flat stand-in (same writes and stored stops as the 3D ball).

| Season | 2.6.0 (main 5c5472f6) billed / writes | 2.7.0 (gameplay/r94 9742fa70) billed / writes |
|---|---|---|
| 1 (START, pairing, setup) | 1,523 / 117 | 1,521 / 117 |
| 2 | 840 / 58 | 777 / 58 |
| 3 (final) | 566 / 28 | 541 / 28 |
| **Total** | **2,929 / 203** | **2,839 / 203** |

Writes are identical, as designed (the stop rides inside the existing confirm). Billed is 90 lower (-3.1 %), almost all in
season 2 (Nik's phone 331 against 395 billed: 30 fewer document reads and 34 fewer Rules lookups on reads); one run each, and
run-to-run noise of this size is normal (2.3.0 alone measured 746 to 838 for one season across runs), so this is no saving
claimed, only no added cost. Detail (doc reads + Rules on reads + Rules on writes): 2.6.0 501+524+498, 271+322+247, 195+220+151;
2.7.0 500+523+498, 242+288+247, 184+206+151. File: gameplay/r94/measure/READS_WRITES_2.7.0.md (project files). The R94-05 study
measured the same shape on gameplay/r94: one season 1,216 billed, 41 to 58 seasons a day against the 50,000 daily reads.

## Update safety

- The shell and service worker advance to 2.7.0-r94 in a fresh `career-mode-showdown-shell-2.7.0-r94` cache, and 2.6.0-r93 is
  retained for rollback, verified against its own 295 paths (`tests/fixtures/shell-paths/2.6.0-r93.json`, from main 5c5472f6).
  2.7.0 adds the club draw step, its 3D scene and its CSS (`js/clubDrawStep.js`, `js/clubDrawScene3d.js`, `css/clubDraw.css`)
  and removes none, so `SHELL_PATHS` holds 298 paths. The 98 image crests, the ball crests and the club lounge plates are not
  precached: each is runtime-cached when a screen first shows it.
- `js/gfxTier.js` BUILD moves with the service worker's RUNTIME_REVISION, so a crash limit written by 2.6.0 is dropped once on the
  first 2.7.0 load (#1473).
- An installed phone takes the update on Home, never in the middle of a game screen.
- **Mixed versions: update both phones before starting a new Showdown.** A Showdown started on 2.7.0 has the `stops` key in its
  setup ledger. A 2.6.0 phone checks the ledger's exact keys (`js/sparkSharedShowdownSetup.js`), so it cannot open that Setup and
  shows the Setup error until it reloads and takes 2.7.0; the same exact-key check sits in its History, season commit and results
  readers, so a 2.6.0 phone cannot play or replay a 2.7.0-started Showdown at all. It cannot write anything wrong: the Rules accept
  only the shapes above. The other way round is safe: a Setup opened by a 2.6.0 phone (no `stops`) keeps the club packs on a 2.7.0
  phone.
- Finished and in-progress Showdowns are untouched: no setup write happens after revision 6, and every old draw replays to the
  same league and clubs (golden vectors). No saved Showdown is rewritten. Nothing in Firebase is deleted or edited.

## Version bump

- `2.7.0-r94` everywhere it is pinned (#1505): package files, `APP_VERSION` (Settings and backups), the footer `v2.7.0`,
  `app-asset-revision` and every `?v=` on Home's own files and the manifest icons, `js/menuExperience.js`, the service worker's
  `RUNTIME_REVISION` (PREVIOUS `2.6.0-r93`), and `js/gfxTier.js` BUILD. The version strings are the same length as 2.6.0's, so the
  startup budget is unchanged.
- Rollback shell fixture `tests/fixtures/shell-paths/2.6.0-r93.json` (295 paths, main 5c5472f6). Contracts moved on with it:
  r86 RR3/RR4, r87 UR3/UR5 and new UR13 (2.6.0 = 2.5.1 plus HO-079, minus the V3 logo), r78 R4c (sorted 2.6.0 list sha
  `93901e04…`), r79 M, v10-club 4, v10-rules-settings RS9, v10-foundation F9/F9b and F10 (index.html sha `034c6010…`: the 2.6.0
  file with its 2.7.0-r94 pins and footer, nothing else). Local runs on the bump head: r86 6/6, r87 13/13, r78 8/8, r79 10/10,
  v10-club 9/9, v10-rules-settings 13/13, v10-foundation 20/20, shared-showdown-production-runtime PASS.
- Story: chapter 199's last line is the release line ("Then Nik gives the word, and 2.7.0 goes live."), Edition 18 labels say
  2.7.0 LIVE, Home counts measured in Chromium on the bump head: 199 chapters, 89,472 words, 1,050 sources.

## Deploy order

- This release changes the Firestore Rules. The Rules deploy runs first on main, and the Pages workflow deploys the site only
  after that Rules deploy succeeded. The new Rules accept every write 2.6.0 makes, so a 2.6.0 phone keeps working on old-shape
  Showdowns while the site deploys.

## What did not change

- No tiebreak anywhere. Scoring, season order, Chamber Men, the roulette, Prime Pack and the Transfer War are unchanged.
- Pairing, joining and the Remote Joining protocol keep their rules. Setup is still 6 writes.
- The no-flash rules and the Reus Gate are unchanged (the Club screen opens only once the draw is built).
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is `100/100`, earned on r85 (`1.9.9-r85`). No SSJR credit comes from this
source, CI or deployment, and no new physical acceptance is claimed for 2.7.0.

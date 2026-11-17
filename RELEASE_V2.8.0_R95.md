# Career Mode Showdown 2.8.0 (r95): the Ball Game, one typeface, the house look (v2.8.0 runtime r95)

Application version: `v2.8.0`  
Runtime asset revision: `2.8.0-r95` (Nik's "OK version 2.8.0", 2026-11-17 15:09 UTC)  
Previous known-good runtime: `2.7.0-r94`

r95 is 2.8.0. On 17 November Nik renamed Club Assignment the Ball Game, picked the Expert design (six clubs on each manager's
football, one STOP) and locked its spin, asked that nothing on the ball be blurry, and set one bar for the whole game: every
screen, pop-up, error and button should look as though it belongs to the clubhouse on Home. This file is the release record. The
list below is every pull request merged into gameplay/r95 since 2.7.0 went live (main 5f22a328): #1507 to #1535 (with #1513 and
#1517 merged into their parent branches), the hunt fixes #1536, and this release's version bump (the PR that adds this file).

## What changed

- **The Ball Game (was Club Assignment): six clubs a ball, one STOP** (#1507 rename, #1521 protocol and Rules, #1523 scene,
  #1524 screen, #1536 last wording).
  - After the league reveal each manager gets one football with **six** clubs from the drawn league. Both balls are dealt from one
    pool without replacement, so the two managers always see twelve different clubs and no club is on both balls (Nik's hard
    rule; 100,000 deals across 5 leagues with zero collisions in `tests/contracts/r95-ball-game-protocol-contracts.cjs`).
  - One tap on **STOP** on your own phone: the crest facing you when your football comes to rest (the 60 degree slice it lands
    in) is your club. No second spin, no timer, no auto-stop.
  - The spin Nik locked (2026-11-17 04:37 UTC, "1 ok"): forward only, 168 to 422 degrees a second in three speed waves that start
    at a fresh phase every spin; a slow first look holds each of the six crests; every own STOP ends in 3.4 to 6 s. No feints, no
    hop, and **no motion blur**: the shader reads one crest per pixel, so crests are always sharp.
  - Quality raise: every gfxTier level, Light included, now gets the stitched leather (stitches, grain, reflection band) and a
    second floodlight highlight, at 64x40 segments; Ultra gets 128x80 and 12,000 grass blades. Light stays at 4 draws and 3
    programs (the bar is 8 and 5).
  - Data: one new ledger key, `draw` (always 3, beside `stops`). A stop is still one int 0..359 inside the manager's existing
    confirm. A Showdown still makes **6 setup writes**, 14 transactions and 40 document reads per setup; `schemaVersion` stays 1.
  - The revealed status line reads **CLUBS LOCKED**. Rule Book card 01 explains six clubs a ball. The league wheel's button reads
    CONTINUE TO BALL GAME, and the error and notice lines say "Ball Game" (#1536).
  - Without WebGL2 the flat stand-in shows the six crests per manager with the same rules and writes. The harness browsers have no
    WebGL2, so CE2PG and the Gate journeys play the stand-in; the 3D ball is proven only by the gallery and real devices.
- **One typeface: Instrument Sans everywhere** (#1515 foundation, #1516 menus and pop-ups, #1518 framed pages, Club, Squad,
  device check and canvas text, #1519 the Story with a real italic, #1520 live screen titles, #1528 the whole game).
  - Self-hosted variable faces (`visual-assets/v10_1/shared/fonts/`): latin (57 KB, weights 400 to 700, widths 75 to 100), a
    `latin-ext` subset (19 KB, fetched only for names such as Beşiktaş or Łódź), and the real italic (32 KB), with
    `OFL_InstrumentSans.txt`. One sheet, `css/r95-type.css`: the 7-step scale, widths and weights by job, tabular figures.
  - The boot screen uses the same file with `font-display:block`, so no swapped text. The Touchline Gazette's headlines, body and
    captions use it too; only the masthead's blackletter wordmark keeps its own face.
  - Removed from the game (no use left): Cormorant SC, Barlow and Barlow Condensed (with `assets/fonts/`), Big Shoulders, Rye,
    Kaushan Script, Playfair Display, Old Standard TT and the Sqm Cond copies.
- **House look** (#1508, #1510, #1514, #1517, #1522, #1525 to #1527, #1529 to #1532, #1534, #1535). The sign-in dialog, error
  screens, the waiting pop-up, Settings and the Squad step join the clubhouse look; the sign-in body reads "Your Showdowns and
  History are kept with your Google account." Phone gutters and spacing on Home, Transfer War, Season Results, Select League, the
  Trophy Room, Rivalry and Career Statistics, Legacy and the Rule Book (16 px upright, 12 px sideways); sideways fixes at 568x320
  and 740x360; 44 px tap areas (Settings DETAILS, phone tabs), locked-tab contrast, Squad chip focus; the Squad Management title
  clear of the coaches on phones. A layout-measure tool for these checks (#1525).
- **Story** (#1509, #1511, #1512, #1513, #1533, this PR). The Story gets a first page in the clubhouse (a marble plate in a gold
  frame before Team V's lounge), a leather cover, a Making Of banner and a redrawn Home quill. 2.6.0's live date reads 16 November.
  Volume 23, "The Ball Game", and the 17 November dispatch tell r95; this PR sets the labels to 2.8.0 LIVE. The Story is its own
  site, outside the game's shell.
- **Hunt fixes** (#1536, from the Fable hunt of 2.8.0):
  - Fonts on a rolled-back page: the Gazette and the plate fonts that 2.8.0 removes are listed in the worker's unversioned shell
    asset paths, so a page still on 2.7.0 gets them from its own retained shell, then the offline pack, then the network.
  - Boot screen: the photo credit no longer shifts about 6 s in (its 44 px tap area kept), and the startup tagline
    ("TWO MANAGERS · ONE SHOWDOWN") starts in its final place.
  - The Special Player scouting card uses the real italic; the 17 of 305 headlines too wide for the plate step down, never under
    20 px.

## Firestore Rules

- Changed (R95-01 only, #1521). Composed production Rules SHA-256
  `5b36d9d8e8dd54e213ffb7c7fba2a2b824cf5dc1572093fb8fec30a8f44a1678` (194,922 bytes); 2.7.0 is `4cb7b878…` (194,269 bytes). The
  reviewed main delta (`tests/fixtures/composed-production-rules/main-delta.json`) names main 5f22a328 and lists 4 hunks, owner
  R95-01: `draw` is an allowed ledger key; at create it may appear only as 3 and only beside `stops`; after create it can never be
  added, dropped or changed, so a draw 2 (2.7.0) ledger can never gain it. The ledger stores no clubs, so the twelve-distinct rule
  lives in the protocol both phones replay, at zero Rules cost. Nik gave the Rules an OK in words ("OK rules r95") before #1521
  merged into gameplay/r95 (11:19 UTC).
- Rules budget sweep (Gate L5, of 1,000 expressions; bar 850): only the six setup kinds moved. Open 618 to 637, commit-league,
  commit-clubs 708 to 730, commit-length 717 to 739, first confirm 761 to 783, second confirm 811 to **829**. Every other kind and
  every Rules lookup count unchanged (4 per setup write, 5 for open).
- Compile probe (measure-firestore-rules-compile, compile only, nothing published): see the version bump PR body for the run on
  its head; #1521 measured 3/3 in 1.2 to 2.3 s against main's 1.0 to 1.8 s, same 12 warnings. Well under the 5 s compile deadline.

## Reads and writes

CE2PG single plan, 1 season on the real screens, Firebase emulator only, firebase@12.17.0, both managers and both phones, two
runs each (#1524). Before = gameplay/r95 fca3e40 (everything but the Ball Game); after = the Ball Game on six clubs a ball. Every
run 193/193 checks. Billed = document reads plus Rules lookups on reads and writes.

| Run | Play reads | Play writes | Lookups on reads | Lookups on writes | Billed |
|---|---|---|---|---|---|
| before 1 | 329 | 85 | 335 | 382 | 1,046 |
| before 2 | 329 | 85 | 333 | 382 | 1,044 |
| after 1 | 349 | 85 | 360 | 382 | 1,091 |
| after 2 | 321 | 85 | 327 | 382 | 1,030 |

Writes and lookups on writes are identical, as designed. Reads move with emulator write contention (transactions the SDK retried:
118 and 123 before, 138 and 111 after): the second after run reads less than either before run. Setup is 14 transaction reads
and 6 writes on sharedSetup in every run, and there is no new listener. Every run stays inside the per-season ceiling of 800
reads and 600 writes. The typeface and house look change no reads or writes. Raw results:
gameplay/r95/ball-game-pr3/ce2pg-{g1,g2,a1,a2}.json (project files).

## Update safety

- The shell and service worker advance to 2.8.0-r95 in a fresh `career-mode-showdown-shell-2.8.0-r95` cache, and 2.7.0-r94 is
  retained for rollback, verified against its own 298 paths (`tests/fixtures/shell-paths/2.7.0-r94.json`, from main 5f22a328).
  2.8.0 adds 5 paths (`css/r95-type.css`, the three Instrument Sans faces and `OFL_InstrumentSans.txt`) and removes 43 old font
  files and sheets, so `SHELL_PATHS` holds 260 paths. `tools/sw-sets.cjs` (hunt-2.8.0) proves both lists against 2.7.0's real
  shell: 43 truly removed, 43 declared, none missing either way; the 5 declared added are exactly the true additions.
- The install is smaller: the precache loses 780,509 bytes of old fonts and gains 121,974 bytes, net about 643 KB less (the
  essential install set alone, without the offline pack, about 118 KB less).
- A page still on 2.7.0 after the update (or rolled back to it) keeps its fonts: the removed font files are answered from its own
  retained shell, then the offline pack, then the network (#1536). Measured with the hunt's update probe: 0 font requests missed.
- `js/gfxTier.js` BUILD moves with the service worker's RUNTIME_REVISION, so a crash limit written by 2.7.0 is dropped once on the
  first 2.8.0 load.
- An installed phone takes the update on Home, never in the middle of a game screen.
- **Mixed versions: update both phones before starting a new Showdown.** A Showdown started on 2.8.0 has the `draw` key in its
  setup ledger (17 keys). A 2.7.0 phone checks the ledger's exact keys, so it shows the Setup error ("update the app") instead of
  mis-reading six clubs as three, until it reloads and takes 2.8.0; it cannot play or replay a 2.8.0-started Showdown. It cannot
  write anything wrong: the Rules accept only the shapes above. The other way round is safe: a Setup opened by a 2.7.0 phone (no
  `draw`) stays three clubs a ball on a 2.8.0 phone.
- Finished and in-progress Showdowns are untouched: draw 1 and draw 2 ledgers keep their exact shapes and hashes, and 120 draw 2
  vectors frozen from 2.7.0 replay to the same clubs. No saved Showdown is rewritten. Nothing in Firebase is deleted or edited.

## Version bump

- `2.8.0-r95` everywhere it is pinned (this PR): package files, `APP_VERSION` (Settings and backups), the footer `v2.8.0`,
  `app-asset-revision` and every `?v=` on Home's own files and the manifest icons, `js/menuExperience.js`, the service worker's
  `RUNTIME_REVISION` (PREVIOUS `2.7.0-r94`), and `js/gfxTier.js` BUILD. The version strings are the same length as 2.7.0's, so the
  startup budget is unchanged.
- The worker's added set is reset to what 2.8.0 adds to 2.7.0 (5 paths); the removed set stays the 43 old font files.
- Rollback shell fixture `tests/fixtures/shell-paths/2.7.0-r94.json` (298 paths, main 5f22a328). Contracts moved on with it:
  r86 RR3/RR4, r87 UR3/UR5 and new UR14 (2.7.0 = 2.6.0 plus the three club draw files), r78 R4c (sorted 2.7.0 list sha
  `2dc656af…`), r79 M, v10-club 4, v10-rules-settings RS9, v10-foundation F9/F9b and F10 (index.html with its 2.8.0-r95 pins and
  footer).
- Story: the Edition 19 labels and the 17 November dispatch say 2.8.0 is live, with no date ("2.8.0 went live later, on Nik's
  word.").

## Deploy order

- This release changes the Firestore Rules. The Rules deploy runs first on main, and the Pages workflow deploys the site only
  after that Rules deploy succeeded. The new Rules accept every write 2.7.0 makes, so a 2.7.0 phone keeps working on draw 2
  Showdowns while the site deploys.

## What did not change

- No tiebreak anywhere. Scoring, season order, Chamber Men, the roulette, Prime Pack and the Transfer War are unchanged.
- Pairing, joining and the Remote Joining protocol keep their rules. Setup is still 6 writes.
- The no-flash rules and the Reus Gate are unchanged (the Ball Game opens only once the draw is built).
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is `100/100`, earned on r85 (`1.9.9-r85`). No SSJR credit comes from this
source, CI or deployment, and no new physical acceptance is claimed for 2.8.0.

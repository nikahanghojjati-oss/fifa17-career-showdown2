# Career Mode Showdown 2.11.0 (r98): League Roulette, four balls and one league; Career Start fixes (v2.11.0 runtime r98)

Application version: `v2.11.0`  
Runtime asset revision: `2.11.0-r98` (Nik's "OK version 2.11.0", 2026-11-22 22:08 UTC)  
Previous known-good runtime: `2.10.0-r97`

r98 is 2.11.0. 2.10.0 went live on 20 November at 20:13 UTC (3:13 PM Boston). Eleven minutes later Nik asked for the league
wheel to become a 3D casino roulette (20:24 and 20:25 UTC). This file is the release record. The list below is every pull
request merged into gameplay/r98 since 2.10.0 went live (main 4353ab5a): #1562 to #1565, and this release's version bump (the
PR that adds this file).

## Release day: both phones update first

**Before the first 2.11.0 Showdown, BOTH phones must show `v2.11.0` in the footer** (Fable FJ13-01 and FJ12-01, verified in
gameplay/r98/fable/FINDINGS_LEDGER.md). A phone still on 2.10.0 does not know the roulette's `drops` key: when Daniel's phone
(the host) is on 2.11.0 and Nik's is on 2.10.0, Nik's phone refuses the new setup ledger and stops at Select League. Nothing is
lost and updating that phone clears it, but updates are only taken on Home when the manager accepts one, so a stale phone is
possible on release day.

1. Nik types the merge word; the release merges into main; the Rules (changed, see below) and then the site deploy.
2. Nik checks the footer says **v2.11.0** on both phones and the Chromebook. A phone that still says v2.10.0: open Home and take
   the update.
3. Both managers open Home once on 2.11.0 before starting a Showdown.
4. Nik runs the **Device check** again on the iPhone (Settings > 3D QUALITY > Device check…) and on the Chromebook.

## What changed

- **League Roulette replaces the 2D league wheel** (#1562 protocol and Rules, merged 4249e457; #1563 wiring, merged 10de3760;
  #1564 look, merged 3e716932). Nik's ask: a premium round casino roulette, five even sections (one per league, with its name,
  mark and colour), Daniel and Nik each dropping two glossy white balls; each ball knocks out the league it settles in, whose
  section splits and joins its neighbours, until the board is one colour.
  - **Who drops** (Nik's card, option A, 2026-11-20 22:04 UTC): each manager presses DROP BALL on his own phone for his own two
    balls, taking turns, Daniel, Nik, Daniel, Nik; both phones watch every drop. The other phone shows WAITING FOR DANIEL / NIK.
    After ball 4 the screen says CONTINUE TO BALL GAME and goes on by itself.
  - **The board never decides the league.** The shared draw (js/sharedShowdownSetup.js, checked by the Rules) still picks it.
    `plan(seed, winner)` in js/leagueRouletteScene3d.js is a pure function of the draw's answer and a seed both phones share:
    which leagues go out, in which order, into which pocket (5,000 seeds x 5 leagues checked: always ends on the winner, inside
    its run, never on an edge pocket). 120 frozen draw 3 Showdowns replay to the same league, clubs and contentHash with or
    without `drops`.
  - **Protocol** (#1562): a draw 3 setup ledger opened for the roulette carries `drops`: 0 at open, 1 with commit-league (Daniel's
    first ball is the league draw), 2 to 4 by plain one-field updates by the manager whose ball it is
    (`rouletteDropRole`: coordinator odd balls, rival even), commit-clubs needs 4. `drop()` is idempotent: a double tap or a retry
    on a stale copy is refused by the Rules and one transaction read sees the ball already landed (`replayed`); the wrong manager
    or an out-of-turn ball is refused before any write. Old ledgers without `drops` keep their exact shapes and can never gain it.
  - **Wiring** (#1563): js/leagueRouletteStep.js mounts the board in `#leagueWheel` after the first ledger sync. A ball the ledger
    gains while the screen is up rolls; a ball dropped before the screen opened (reload, late join, back from Home) is shown in
    its pocket at once and never rolls again; a finished roulette never replays. Reus Gate: js/v10Setup.js holds Select League
    until the board has drawn its first frame (15 s cap). No Firestore and no device storage in the board or the step.
  - **The 2D wheel is kept** as the no-WebGL / 3D-failure fallback (check-before-removing list
    gameplay/r98/threads/R98_01_2D_WHEEL_CHECK_BEFORE_REMOVING.md: the only loss would have been a phone with no 3D getting no
    wheel). Nothing was removed.
  - **Look** (#1564, Nik's rounds 2 and 3): title **LEAGUE ROULETTE**; black metal and gold on black marble, flat league colours
    with an engraved pattern, no shadows; bigger names and marks. Sharp board: js/gfxTier.js gives the `league` screen alone its
    device pixel ratio (up to 3x, within the 4K buffer; the governor still steps it down), 224/288-sided bowl and wheel, board
    texture 2048 from High (1024 on Light/Balanced), real metal gold via a metalness mask. Team V HO-097 rooms (Nik OK): desktop
    `ENV_BOX_PLATE_HC_V4` with the men further apart (+ a 1920 cut), phones and tablets men-free (`ENV_BOX_PHONE_HC_V4`, TALL,
    590W, `ENV_BOX_SIDEWAYS_HC_V4`), used only while the 3D board is on; the 2D wheel keeps the V3 rooms. Nik's "move the line
    up": the SPIN TO PICK THE LEAGUE line sits under the title on desktop. Against 2.10.0 the board is **+30% at 1920x866** and
    **+31% at 1920x1035**, clear of both men, both buttons reachable (checked at 14 sizes, see #1564).
  - **Phone memory** (iPhone 17 profile, textures + buffers + live 2D canvases): `league` 101.8 MB at High and Extra (CI run
    44986982145 on #1564's head), under the 300 MB phone budget. The first round's 409 MB was the lab page remounting the board,
    which the game never does.
  - Its own quality key `league` (a crash there holds only this screen). Reduce Motion: the board stands still and shows the
    result.
- **Career Start fixes from Fable FJ12** (#1565, merged f35bfd73):
  - FJ12-02: a second Showdown on the same page first drew the first Showdown's clubs, BOTH MANAGERS STARTED and an enabled
    CONTINUE until its own read landed, and the 15 s check never restarted. A view for another Setup is now forgotten (in memory,
    no read) and the check starts again. (A tap in that window was already refused by the Transfer War, so integrity was never at
    risk.)
  - FJ12-03: on CONTINUE CAREER, a long shootout plus roulette could give the Squad Sheet or Prime Pack a false "Career Start
    took too long". `CareerModeSquadSheetStep.active()` and `CareerModeIconGuessStep.active()` now pause the open limit too.
  - FJ12-04: the 15 s check is light (no Setup re-read) after a good Career Start read: about 5 fewer reads per check per phone
    while Career Start waits. After a failed read it is full again.
- **Rule Book** (this PR): the Showdown card's league line now describes League Roulette (five leagues, Daniel first, then Nik,
  Daniel and Nik, each ball knocks out the league it lands in, until one league is left).
- **Story** (this PR). Volume 26, "Four Balls, One League" (chapters 215 to 219, `chronicle/volume26-data.js` + `volume26.js`;
  builder gameplay/r98/threads/bump/v26.py in project files), the 2.11.0 dispatch (`#latest/r98`, R98 SPOT filled, R99 SPOT
  left), Edition 23 labels, the newest-volume banner exemption on the new part, Volume 26 on the Story home's volume list. The
  live line is dateless ("Then Nik gives the word, and 2.11.0 goes live."). Counts measured in Chromium: 219 chapters, 97,292
  words, SOURCES_COUNT cited source URLs. The Story is its own site, outside the game's shell.

## Firestore Rules: CHANGED this release

- **One change, the roulette's `drops` counter** (#1562, Nik's "OK rules r98"; owner R98-ROULETTE in the reviewed main delta
  `tests/fixtures/composed-production-rules/main-delta.json`, 7 hunks). `drops` is in the exact-keys list (create: 0, only beside
  `draw`); every step keeps `draw` (and `drops` except at commit-league) unchanged by one `affectedKeys()` diff; commit-league
  sets `drops` from 0 to 1; commit-clubs needs 4; `ssjrValidDropLedger` allows one ball at a time by its owner (same revision,
  phase LEAGUE_WHEEL_COMMITTED, only `drops`/`updatedAt`/`updatedByDeviceId`/`activeSessionId` change, same
  `ssjrValidLedgerBase` authority), judged inside `ssjrValidUpdateLedger`. **The update grant line is unchanged**; no new grant.
- Composed production Rules on this branch: `8eb561370649c928bf3560bc5523bf772203f1eaa2eb81c308d137a59671c2cf` (197,267 bytes);
  main 4353ab5a (2.10.0) deploys `5b36d9d8e8dd54e213ffb7c7fba2a2b824cf5dc1572093fb8fec30a8f44a1678` (194,922 bytes). The
  composed-production-rules contract passes on this branch (deterministic composition, reviewed delta from production main).
- Expressions (of the 1,000 per request): second confirm 839 (was 829; bar 850), a ball ~556, every other kind unchanged in the
  budget sweep (#1562).
- **Compile probe on this bump's head** (`measure-firestore-rules-compile.yml`, run 45076759855, commit 96653612; later commits on
  this branch touch no Rules source): **3/3, 1,729 / 2,741 / 2,012 ms**; main 3/3, 1,072 to 2,146 ms. Well under the 5 s deadline
  (rules-change playbook).
- Emulator proof `tests/firebase/r98-league-roulette-rules-emulator.cjs` (7 checks: raw Rules matrix, provider end to end, cost
  vs draw 3) runs in the Gate's setup lane and in the Rules budget sweep.
- The deploy happens on the main merge (Rules first, then the site, as RR2 pins).

## Reads and writes

READS_WRITES_SECTION

## Update safety

- The shell and service worker advance to 2.11.0-r98 in a fresh `career-mode-showdown-shell-2.11.0-r98` cache, and 2.10.0-r97 is
  retained for rollback, verified against its own 260 paths (`tests/fixtures/shell-paths/2.10.0-r97.json`, from main 4353ab5a;
  path for path 2.9.0's list, new contract r87 UR17). r98 adds two shell paths, `js/leagueRouletteStep.js` and
  `js/leagueRouletteScene3d.js` (also in the offline pack, now 107 files), and removes none, so `SHELL_PATHS_ADDED_SINCE_PREVIOUS`
  lists exactly those two, `SHELL_PATHS_REMOVED_SINCE_PREVIOUS` is empty, and `SHELL_PATHS` holds 262 paths. The Team V HO-097
  rooms are images, runtime-cached like every other plate.
- Real service-worker update (local only, no Firebase; probe gameplay/r98/threads/bump/probe-update.cjs with a switchable static
  server): a page installed on 2.10.0 (main 4353ab5a, offline pack filled) is served the 2.11.0 tree, reloads and takes 2.11.0 in
  **5.0 s** (one explicit `registration.update()` after the reload, which this container needs). The 2.11.0 worker reports its
  own shell complete (0 missing) and the retained 2.10.0 shell verified against its 260 paths (0 missing), recovery revision
  2.10.0-r97. Fonts: 0 missing on 2.11.0 online and offline. Rollback to 2.10.0 is accepted, the page comes back as 2.10.0-r97,
  and its fonts are all found online and offline (0 of 4 missing). Log: gameplay/r98/threads/bump/probe-update.log.
- `js/gfxTier.js` BUILD moves with RUNTIME_REVISION, so a hold written by 2.10.0 is dropped once on the first 2.11.0 load.
- An installed phone takes the update on Home, never in the middle of a game screen.
- **Mixed versions: not safe for the roulette.** See "Release day" above: a 2.10.0 rival stops at Select League against a 2.11.0
  host until it updates. A 2.11.0 phone still reads every older Showdown (ledgers without `drops` keep their shapes).
- Finished and in-progress Showdowns are untouched. No saved Showdown is rewritten. Nothing in Firebase is deleted or edited.

## Version bump

- `2.11.0-r98` everywhere it is pinned (this PR): package files, `APP_VERSION` (Settings and backups), the footer `v2.11.0`,
  `app-asset-revision` and every `?v=` on Home's own files and the manifest icons, `js/menuExperience.js`, the service worker's
  `RUNTIME_REVISION` (PREVIOUS `2.10.0-r97`), and `js/gfxTier.js` BUILD. `index.html` differs from gameplay/r98's only in those
  version strings (r98 itself changed only the league title to LEAGUE ROULETTE). The startup budget still passes: **33,980 of
  34,000** gzip bytes (2.10.0: 33,980; the version strings are the same length).
- Contracts moved on: r86 RR3/RR4, r87 UR3/UR5 and new UR17 (2.10.0 = 2.9.0, r98 adds only the two roulette files), r78 R4c (the
  sorted list sha `e0996bb2…` is unchanged because the list is), r79 M, v10-club 4, v10-rules-settings RS9, v10-foundation
  F9/F9b and F10 (index.html `ae906a6b…` with its 2.11.0-r98 pins, footer and LEAGUE ROULETTE title).
- Version comparison: no code compares versions as strings (`js/backup.js` and the contracts use `\d+`), so 2.11.0 parses.

## Tests on this branch

FULL_CONTRACTS_SECTION
- Bump contracts on 9665361: r86-release, r87-upgrade-rollback-list (17), r78-marble-confirm, r79-modes-settings, v10-club,
  v10-foundation, v10-rules-settings, r90-gfx-tier, reus-gate-startup, composed-production-rules: all pass.
- CE2PG 3 seasons on both builds, the real service-worker update probe and the Rules compile probe (above). Story pages checked in
  Chromium (book, `#volume/four-balls`, `#read/r98-eleven-minutes`, `#read/r98-live`, `#latest`, `#latest/r98`, `#latest/r97`,
  the Story home; no page errors).

## What did not change

- No tiebreak anywhere. Scoring, season order, the Ball Game, Chamber Men, Russian Roulette, Prime Pack and the Transfer War rules
  are unchanged. The league is still the shared draw's; the roulette only shows it. The phases still run SHARED_SETUP_OPEN →
  LEAGUE_WHEEL_COMMITTED → CLUB_ASSIGNMENTS_COMMITTED, never skipped or reordered.
- Pairing, joining and the Remote Joining protocol keep their rules.
- The no-flash rules and the Reus Gate are unchanged. No other 3D screen's quality profile changes (79 of 79 non-league gfx rows
  identical, #1564).
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.

## Red team

- Fable 5.2 jobs FJ12 (Career Start) and FJ13 (League Roulette) were verified against code (Opus high thread; ledger
  gameplay/r98/fable/FINDINGS_LEDGER.md). Fixed: FJ12-02, FJ12-03, FJ12-04 (#1565). Release step, no code: FJ12-01 = FJ13-01
  (mixed versions, above). Not a bug: FJ13-02, FJ13-05, FJ13-04 part 2. Listed, not fixed (P3, no effect on play): FJ13-03 (a
  refused drop surfaces `permission-denied`, mapped to "Check your connection and tap again") and FJ13-04 part 1 (a return without
  deactivation may roll missed balls instead of showing them at once; the final board and league are right).
- Codex was out of usage for #1564/#1565; under Nik's rule (2026-11-22) Claude reviews at high effort read the exact heads.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is `100/100`, earned on r85 (`1.9.9-r85`). No SSJR credit comes from this source,
CI or deployment, and no new physical acceptance is claimed for 2.11.0. The League Roulette has only been played by two
managers in emulator runs; its real-device proof is Nik and Daniel's first 2.11.0 Showdown, after both footers say v2.11.0.

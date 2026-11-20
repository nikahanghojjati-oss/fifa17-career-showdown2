# Career Mode Showdown 2.10.0 (r97): the Device check goes on, the Roulette fits a phone, a crash holds only its own screen (v2.10.0 runtime r97)

Application version: `v2.10.0`  
Runtime asset revision: `2.10.0-r97` (Nik's "Ok", 2026-11-20 13:42 UTC, in answer to "type OK version 2.10.0")  
Previous known-good runtime: `2.9.0-r96`

r97 is 2.10.0. 2.9.0 went live on 18 November at 12:36 UTC (7:36 AM Boston). That day Nik ran the Device check on his iPhone 17
and reported: "Device check on iphone closes my screen on rrr on high and doesnt continue the check for rest of screens." r97
follows that report to its causes, then adds two small fixes Nik accepted on a card (20 November, "Ok" to the recommended "Fix
fonts + heading, then ship"). This file is the release record. The list below is every pull request merged into gameplay/r97
since 2.9.0 went live (main 56642b8f): the Rules re-pin d3136004 (no Rules change), #1553 to #1557, and this release's version
bump (the PR that adds this file).

## What changed

- **The Device check goes on after a screen closes the tab** (#1553, merged 69eca9f7). Two causes on 2.9.0
  (`device-check.html`):
  - The run lived in the tab's `sessionStorage`, which iOS drops when it closes the whole tab or the home-screen app, so the
    reopened check showed nothing and every finished row was lost. The run is now kept in the saved data (`js/storage.js`) for
    30 minutes, stamped with the build; `sessionStorage` only names the tab. While a screen plays, the run beats every 5 s; a run
    whose tab still beats belongs to that tab and is left alone, and this page takes it over once the beat stops. Leaving the
    check (hidden tab, Back, pagehide) clears the run at once, so only a page that died leaves a screen open.
  - One tab-death cap stopped every screen, which undid r96's per-screen climb. A death now stops only the screen that was
    playing; the others keep climbing, each in a fresh page. The check says so: "The tab closed while Russian Roulette was
    playing at High. Going on with the other screens."
  - Contracts r92 D22 (Nik's run replayed, close-and-reopen and same-tab reload; fails both ways on the 2.9.0 page) and D23 (a
    live tab's run is left alone; stale and older-build runs are let go with no cap). Hand-run replay
    `tests/browser/r97-device-check-close-replay.cjs` (SIGKILL during Roulette at High, then reopen).
- **The Roulette frees its painted canvases on phones; the phone budget counts 2D canvases** (#1554, merged e7055f7f). Why
  the iPhone died: each painted Roulette picture was held twice on a phone, as a GPU texture and as its 2D canvas, and the
  300 MB phone budget test counted only the GPU half. On the iPhone 17 profile at High: ~342 MB (214.7 GPU + 128.4 canvases).
  - Phones only (`visual-assets/v10_1/roulette/index.html`, `freeCanvases`): once `warmUp()` has uploaded every texture, a
    canvas is let go when every texture drawn from it is on the GPU and it is never painted again. The scoreboards are kept
    (repainted in play). High: 29 canvases (76.4 MB) freed, 2 kept. Desktop untouched.
  - No look change: the three 2048 canvases are not capped at 1024. Pixel for pixel against the gameplay/r97 page (same seed,
    stepped clock, iPhone 15 Pro emulation at High), the WebGL canvas and the full page match exactly at five moments (spin,
    aim, shot, result, table after the turn).
  - Memory now (textures + buffers + live 2D canvases, iPhone 17 profile): Roulette High 266.7 MB, Extra 278.6; Chamber Men
    High 239.0, Extra 273.9; Special Player High 260.7, Extra 282.7.
  - Trade-off: a freed canvas cannot be uploaded again, so on such a phone a lost WebGL context that the browser gives back is
    handled like one that never comes back: the game's result card (embedded) or a reload, instead of an in-place rebuild.
    Two-manager proof in CE2PG with WebGL on (SwiftShader) and phone windows: context lost at spin, aim, shot and result
    across two runs; one `cms-rr-error` each, the result card in place, both phones' cards identical, one spins record per
    season. Contract `r97-rrr-phone-canvas` C1 to C6 (C6 runs the real `js/rosterRouletteStep.js`: the outcome is recorded
    exactly once).
  - `tests/browser/phone-memory-budget.cjs` adds live 2D canvases (`device-lab.cjs` hooks `getContext("2d")`); a run without the
    canvas count fails.
- **A crash in play holds only its own 3D screen** (#1555, merged 34d3a38c; Nik's card, option A, 2026-11-18 21:45 UTC).
  `js/gfxTier.js` keeps a list of holds `{caps:[{scene, level, reason, tab?, at, build}]}`, one per screen, lowest level wins.
  A screen that closes the tab or loses its GPU context holds only itself; a hold with no screen (scene `""`) still holds every
  screen. Each hold expires on its own: 7 days; 3 clean plays of its own screen (never for a closed tab's hold, as before); a new
  build drops it; a pick in Settings clears all holds. The device level (2D, `html[data-gfx]`, Settings' Auto row) follows only
  holds with no screen. A pre-r97 cap (one object) still reads as before. The Device check opens each screen up to its own hold
  and names the held screen ("Russian Roulette draws Balanced"). No change to how any screen looks in play. Contract
  `r97-gfx-hold-per-screen` H1 to H6.
- **The Roulette's painted labels in Instrument Sans on every load** (#1556, merged 3c63e0c2). "FIRES HERE" on the pointer and
  the gold plate under each board were painted while the script ran, before the font was asked for, and never painted again:
  Arial on every load, not only on slow ones. A label painted while `document.fonts.check` says the face is missing is now
  repainted once when it arrives (`loadingdone` / `fonts.ready`, and once more right after the wait, before warm-up uploads and
  frees canvases); boards are redrawn the same way only before a turn has begun. Those few canvases stay out of `freeCanvases`
  until repainted. The start waits up to 15 s (was 3 s) for fonts behind the loading screen and pings `cms-rr-loading` every
  2 s; a failing font file no longer stops the start. Proof: fonts held back 6 s, before Arial/serif, after Instrument Sans
  Narrow; fonts 25 s late, the scene starts and the labels repaint when the font lands. Visible change: the labels are now in
  the game font (gallery). Contract C7.
- **Career Start keeps its small heading; REFRESH is reachable on small upright phones** (#1557, merged ccef1668). At the
  tightest Career Start step the heading START YOUR FIFA 17 CAREER (`.pcstKicker`) was `display: none`, against the never-hide
  rule; it now shows (`css/remoteJoining.css`). Showing it made the panel taller than the screen at 360x640 and 393x660, and the
  r96 grown-panel rule assumed the page would scroll; on an upright phone the Club screen clips at 100svh, so REFRESH could not be
  reached (already true on 2.9.0 at 375x553). `pcstPillarGrow` now records the height the panel needs (`--pcst-need`,
  `data-career-start-reach`), and the Club screen keeps its height and plate while the room under it is margin, so `main`
  scrolls to the buttons. 375x553 scrolls 281 px, REFRESH ends at 537 of 553. Chromebook 1920x866 and 1920x1035 unchanged.
  Contract r87-career-start-b B6.
- **Story** (this PR). Volume 25, "One Screen at a Time" (chapters 210 to 214, `chronicle/volume25-data.js` +
  `volume25.js`; builder gameplay/r97/threads/bump/v25.py in project files), the 2.10.0 dispatch (`#latest/r97`, R97 SPOT
  filled, R98 SPOT left), Edition 22 labels, the newest-volume banner exemption on the new part, Volumes 23 to 25 added to the
  Story home's volume list. The live line is dateless ("Then Nik gives the word, and 2.10.0 goes live."). Counts measured in
  Chromium: 214 chapters, 95,265 words, 1,086 cited source URLs. The Story is its own site, outside the game's shell.

## Firestore Rules

- **Unchanged from 2.9.0.** No r97 pull request touches the Rules sources. The composed production Rules are
  `5b36d9d8e8dd54e213ffb7c7fba2a2b824cf5dc1572093fb8fec30a8f44a1678`, the same as main 56642b8f (2.9.0) and 30b79695 (2.8.0);
  the reviewed main delta (`tests/fixtures/composed-production-rules/main-delta.json`, re-pinned on gameplay/r97 at d3136004
  with Nik's "OK re-pin r97") lists 0 hunks. The Rules deploy on the release merge is a no-op re-deploy of the same Rules.

## Reads and writes

CE2PG single plan, 3 seasons, waits off, Firebase emulator only (no production reads), firebase@12.17.0, both managers and both
phones, run side by side on the same cloud container on 2026-11-20 (~13:44 to 14:01 UTC). 2.9.0 = main 56642b8f; 2.10.0 = this
branch's bump commit acdb6a85 (gameplay/r97 ccef1668 + the bump). Both use the same composed Rules `5b36d9d8…`. Both runs PASS
296/296, 0 problems. Billed = the CE2PG meter's own definition (document reads plus Rules lookups on reads and on writes). The
harness Chromium has no WebGL2, so the 3D screens play their flat stand-ins (same reads and writes).

| Season | 2.9.0 billed / writes | 2.10.0 billed / writes | Change |
|---|---|---|---|
| 1 (START, pairing, setup) | 1,512 / 117 | 1,442 / 117 | -70 |
| 2 | 848 / 58 | 842 / 58 | -6 |
| 3 (final) | 543 / 28 | 501 / 28 | -42 |
| **Total** | **2,903 / 203** | **2,785 / 203** | **-118 (-4.1 %)** |

Detail (doc reads + Rules on reads + Rules on writes): 2.9.0 496+518+498, 276+325+247, 182+210+151; 2.10.0 461+483+498,
273+322+247, 161+189+151. Writes and Rules lookups on writes are identical every season, as designed: r97 adds no Firestore
read or write in play (the Device check run, the per-screen holds and the Roulette's freed canvases all live on the device). The
difference is in listener and page-check reads, one run each; it is of the run-to-run size seen before (2.9.0 measured 2,843 on
2026-11-17 and 2,903 here), so no saving is claimed, only no added cost. Logs: gameplay/r97/threads/bump/m290-3s.log and
b2100-3s.log (project files).

## Update safety

- The shell and service worker advance to 2.10.0-r97 in a fresh `career-mode-showdown-shell-2.10.0-r97` cache, and 2.9.0-r96 is
  retained for rollback, verified against its own 260 paths (`tests/fixtures/shell-paths/2.9.0-r96.json`, from main 56642b8f).
  r97 adds and removes no shell path (`device-check.html` is a standalone network page; the Roulette frame, `js/gfxTier.js`,
  `js/productionSharedCareerStart.js` and `css/remoteJoining.css` were already in the shell), so
  `SHELL_PATHS_ADDED_SINCE_PREVIOUS` and `SHELL_PATHS_REMOVED_SINCE_PREVIOUS` are both empty and `SHELL_PATHS` still holds 260
  paths. The hunt's `sw-sets.cjs` against main 56642b8f: 0 truly added, 0 truly removed, none declared either way, no shell file
  missing on disk.
- Real service-worker update, measured with the hunt's update probe (local only, no Firebase): a page installed on 2.9.0 (main
  56642b8f, offline pack filled) is served the 2.10.0 tree, reloads and takes 2.10.0 in 4.8 s (one explicit
  `registration.update()` after the reload, which this container needs). The 2.10.0 worker reports its own shell complete (0
  missing) and the retained 2.9.0 shell verified against its 260 paths (0 missing), recovery revision 2.9.0-r96. Fonts: 0
  missing on 2.10.0 online and offline. Rollback to 2.9.0 is accepted, the page comes back as 2.9.0-r96, and its fonts are all
  found online and offline (0 of 4 missing). Log: gameplay/r97/threads/bump/probe-update.log (project files).
- `js/gfxTier.js` BUILD moves with the service worker's RUNTIME_REVISION, so a crash or lost-context cap written by 2.9.0 is
  dropped once on the first 2.10.0 load (caps carry their build). A 2.9.0 Device check
  result (per screen) is kept; a Device check run left open by 2.9.0 lived in `sessionStorage` and is not read by 2.10.0.
- An installed phone takes the update on Home, never in the middle of a game screen.
- **Mixed versions.** 2.10.0 adds no Firestore key and no Rules change, and the roulette's records and the season commit are
  written exactly as in 2.9.0, so a 2.9.0 phone and a 2.10.0 phone can share a Showdown. The per-screen holds and the Device
  check run are local to each device. Release-day step anyway: both managers open Home once on 2.10.0 before the first 2.10.0
  Showdown.
- Finished and in-progress Showdowns are untouched. No saved Showdown is rewritten. Nothing in Firebase is deleted or edited.

## Version bump

- `2.10.0-r97` everywhere it is pinned (this PR): package files, `APP_VERSION` (Settings and backups), the footer `v2.10.0`,
  `app-asset-revision` and every `?v=` on Home's own files and the manifest icons, `js/menuExperience.js`, the service worker's
  `RUNTIME_REVISION` (PREVIOUS `2.9.0-r96`), and `js/gfxTier.js` BUILD. `index.html` differs from 2.9.0's only in those version
  strings (r97 never changed it). Each version string is one character longer than 2.9.0's; F10's startup budget check still
  passes: 33,980 of 34,000 gzip bytes (2.9.0: 33,979).
- Rollback shell fixture `tests/fixtures/shell-paths/2.9.0-r96.json` (260 paths, main 56642b8f; path for path 2.8.0's list).
  Contracts moved on with it: r86 RR3/RR4, r87 UR3/UR5 and new UR16 (2.9.0 = 2.8.0), r78 R4c (the sorted list sha `e0996bb2…`
  is unchanged because the list is), r79 M, v10-club 4, v10-rules-settings RS9, v10-foundation F9/F9b and F10 (index.html
  `900455c5…` with its 2.10.0-r97 pins and footer).
- Version comparison: no code compares versions as strings; the patterns that read a revision (`js/backup.js`, two contracts) use
  `\d+`, so 2.10.0 parses.

## Tests on this branch

- Full product contracts at cf3e1492 (`node tests/support/run-selected-product-contracts.cjs --all`): **363/363 pass**, exit 0
  (frozen POS10 floor + POS20 supplements; r87-career-load-gate-edges G-06 passed this time). Ops `pos20-control-plane` passes.
  Log: gameplay/r97/threads/bump/full-contracts.log (project files).
- Bump contracts on acdb6a85: r86-release, r87-upgrade-rollback-list (16), r78-marble-confirm, r79-modes-settings, v10-club,
  v10-foundation, v10-rules-settings, r90-gfx-tier, r91-gfx-tab-crash, r91-device-check-verdict, r92-device-check-iphone,
  r96-quality-per-screen, r97-gfx-hold-per-screen: 13/13 pass.
- CE2PG 3 seasons on both builds (above) and the real service-worker update probe (above). Story counts and pages checked in
  Chromium (book, `#volume/one-screen-at-a-time`, `#read/r97-live`, `#latest`, `#latest/r97`; no page errors).

## Release day

1. Nik types the merge word; the release merges into main; Rules (unchanged) and site deploy.
2. Nik checks the footer says **v2.10.0** on both phones and the Chromebook.
3. Both managers open Home once on 2.10.0 before starting a Showdown.
4. Nik runs the **Device check** again on the iPhone (Settings > 3D QUALITY > Device check…), and on the Chromebook, so each 3D
   screen finds its own level on the build that keeps its run. The 2.9.0 result ("recommend Balanced") applies until then.

## What did not change

- No tiebreak anywhere. Scoring, season order, the Ball Game, Chamber Men, the roulette, Prime Pack and the Transfer War rules
  are unchanged. A shot player still never comes back. The roulette still records one spin and one trigger pull per season.
- Pairing, joining and the Remote Joining protocol keep their rules. Setup is still 6 writes.
- The no-flash rules and the Reus Gate are unchanged. No 3D screen's picture changes (Roulette pixel-identical on phones; desktop
  untouched); the only visible changes are the Roulette labels' typeface, the Career Start heading on small phones, the Device
  check's wording, and REFRESH reachable by scrolling.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.

## Red team

- Two bounded hunts were written and pinned to main 56642b8f on audit-packets (de34dd5; copies in gameplay/r97/redteam/):
  `r97-redteam/SEASON_END_HUNT_R97.md` for Astra 6.2 High (the r96 season-end packet re-pinned; SS-01 and the Boston date
  listed as fixed) and `r97-redteam/SEASON_START_HUNT_R97.md`, a new area for Sol 6.2 (roulette, Prime Pack award-once, Transfer
  War privacy, timers and reload, board rules, Rules at season 10). Nik chose to ship the small fixes first (card, 20 November);
  neither hunt ran for 2.10.0. They can run against 2.10.0 once it is live, re-pinned to the build that ships.

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is `100/100`, earned on r85 (`1.9.9-r85`). No SSJR credit comes from this
source, CI or deployment, and no new physical acceptance is claimed for 2.10.0. The iPhone Device check fix (#1553), the
phone memory fix (#1554) and the per-screen hold (#1555) still need their real-device proof: Nik's rerun of the Device check on
the iPhone.

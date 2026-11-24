# Career Mode Showdown 2.12.0 (r99): From a fan, for the fans; four clubhouses; the paper off the faces (v2.12.0 runtime r99)

Application version: `v2.12.0`  
Runtime asset revision: `2.12.0-r99` (Nik's "OK version 2.12.0", 2026-11-24 02:38 UTC)  
Previous known-good runtime: `2.11.0-r98`

r99 is 2.12.0. 2.11.0 went live on 23 November at 17:24 UTC (12:24 PM Boston). This file is the release record. The list below
is every pull request merged into gameplay/r99 since 2.11.0 went live (main fec8af69): #1570, #1571 and #1572, and this
release's version bump (the PR that adds this file).

## Release day: both footers first

Nothing in 2.12.0 changes what the two phones send each other (see "Mixed versions" below), so a phone left on 2.11.0 can still
play a Showdown with a phone on 2.12.0. The habit that kept 2.11.0 safe stays anyway:

1. Nik types the merge word; the release merges into main; the site deploys. **The Rules do not change** (see below).
2. Nik checks the footer says **v2.12.0** on both phones and the Chromebook. A phone that still says v2.11.0: open Home and take
   the update.
3. Both managers open Home once on 2.12.0 before starting a Showdown.
4. Optional: pick a clubhouse in Settings (CLUBHOUSE). Each phone or laptop keeps its own.

## What changed

- **Four clubhouses** (#1571, merged cbd4ddea; Nik's ask 2026-11-23 18:14 UTC, names and looks from his rounds that evening).
  Settings > CLUBHOUSE: **Wooden Clubhouse** (the default, the rooms as they were painted), **Silver Clubhouse**, **Metallic
  Black Clubhouse** (key `black`) and **Premium Matte Black Clubhouse** (key `matte`), each with one line on what the room is
  made of.
  - They are the same painted rooms recoloured (tools/clubhouse-themes). Daniel and Nik were cut out with masks and put back
    untouched, so their faces are pixel-identical in all four; balls, scarves, sofas and books keep their own colours, graded to
    the new light (Nik's round 1). Themed rooms live in `visual-assets/v10_1/plates-hc/{silver,black,matte}/` (bytes pinned
    by v10-foundation F9c); the panel marble has one black-and-gold copy, `css/r78-marble-tile-metal.webp` (4,492 bytes).
  - The loading room follows the pick too (`assets/loading/{silver,black,matte}/`, Nik: "any screen that has clubhouse art or
    clubhouse background should match").
  - **Per device, never Firebase.** The pick is kept in this browser (`localStorage` key `cmsClubhouseTheme`), applied by an
    inline script in `index.html` before any sheet or picture is asked for, so no room paints in the wrong colours first. It is
    never written to Firestore and never sent to the other phone. Wooden runs none of the recolouring (no observer, nothing
    rewritten). The 3D scenes are unchanged.
  - Proof on #1571: flash test PASS in all four clubhouses; board 21 screens x 4 clubhouses x 4 sizes = 336/336; r91 old-art
    audit per clubhouse (no plain room drawn or downloaded in a theme); contract `r99-clubhouse-themes`.
- **The Touchline Gazette paper clears both faces** (#1570, merged 79f339e6; Nik's report 2026-11-23 21:29 UTC: on live 2.11.0
  the final paper covered about 36% of Nik's face at 1920x866 and 1920x1035). `css/v10Gazette.css` only: the final and season
  papers stand clear of both faces at 11 desktop windows; CONTINUE stays in view without scrolling at both Chromebook sizes, and
  narrower windows scroll to it (the page scrolls, nothing is hidden). The title shrinks and wraps under 400 px of paper (Codex
  P2). The face audit now includes GAZETTE_FINAL and GAZETTE_SEASON.
  - Same PR: **Career Start** buttons off both jackets at 1920x866 (`css/remoteJoining.css`); on sideways phones (844x390,
    915x412) the held crest and club name stay inside their pack frame (`js/productionSharedCareerStart.js`, layout only); the
    Club screen's notice dismissal matches the generic "This screen could not load" only while the Club screen is in play.
- **Rules main-delta re-pin** (#1572, merged 4ac53446; Nik's "OK re-pin r99", 2026-11-23 23:17 UTC): the reviewed delta in
  `tests/fixtures/composed-production-rules/main-delta.json` now compares with the 2.11.0 main fec8af69; 0 hunks. No Rules
  change.
- **Rule Book** (this PR): one line in Connection & Recovery: "Settings also picks your clubhouse: Wooden, Silver, Metallic Black
  or Premium Matte Black. Each phone or laptop keeps its own; it changes only the look, never the game." (Nik's rule: every new
  feature goes in the Rule Book each release. `js/ruleBook.js` is lazy, outside the startup budget.)
- **Story** (this PR). Volume 27, **"From a fan, for the fans."** (chapters 220 to 223, `chronicle/volume27-data.js` +
  `volume27.js`; builder gameplay/r99/threads/bump/v27.py in project files). Nik asked (2026-11-24 02:44 and 02:46 UTC) for the
  next story to lead with him: he is just a big fan of Career Mode, and he built this for all the fans, all football fans; the
  headline is "From a fan, for the fans." It is the volume title, chapter 220, the 2.12.0 dispatch (`#latest/r99`, R99 SPOT
  filled, R100 SPOT left), the Current picture heading and the Story home's latest section. Nothing beyond his words is put in
  his mouth. Then the r99 truth: the four clubhouses, the paper that stepped aside, no Rules change, the rollback line. Edition
  24 labels, the newest-volume banner exemption on the new part, Volume 27 on the Story home's volume list. The live line is
  dateless ("Then Nik gives the word, and 2.12.0 goes live."). Counts measured in Chromium: 223 chapters, 98,620 words,
  1,095 cited source URLs (1,094 before this PR named itself). The Studio Small Axe dedication is unchanged. The Story is its own site, outside the game's
  shell.

## Firestore Rules: NO change this release

- Composed production Rules on this branch: `8eb561370649c928bf3560bc5523bf772203f1eaa2eb81c308d137a59671c2cf` (197,267 bytes),
  the same bytes main fec8af69 (2.11.0) deploys. `composed-production-rules` contract on this branch: deterministic composition
  8eb561370649, reviewed delta vs main fec8af69 **0 hunks, -0 +0 lines**. No Rules source file differs from fec8af69.
- The main merge runs the usual deploy path; it publishes the same Rules again.

## Reads and writes

CE2PG single plan, 3 seasons, waits off, Firebase emulator only (no production reads), firebase@12.17.0, both managers and both
phones, run side by side on the same cloud container on 2026-11-24 (~02:47 to 03:05 UTC). 2.11.0 = main fec8af69; 2.12.0 = this
branch's bump commit f61a7d7e (gameplay/r99 cbd4ddea + the bump). Both runs compose the same Rules (`8eb56137…`). Billed = the
CE2PG meter's own definition (document reads plus Rules lookups on reads and on writes). The harness Chromium has no WebGL, so
the 3D screens play their flat stand-ins. Both runs use the default Wooden clubhouse (a clubhouse never touches Firebase: the
picker and the head script use only this browser's storage, so no clubhouse can add a read or a write).

| Season | 2.11.0 billed / writes | 2.12.0 billed / writes | Change |
|---|---|---|---|
| 1 (START, pairing, setup) | 1,591 / 120 | 1,572 / 120 | -19 |
| 2 | 817 / 58 | 840 / 58 | +23 |
| 3 (final) | 553 / 28 | 502 / 28 | -51 |
| **Total** | **2,961 / 206** | **2,914 / 206** | **-47 (-1.6 %), writes equal** |

Detail (doc reads + Rules on reads + Rules on writes): 2.11.0 526+552+513, 262+308+247, 190+212+151; 2.12.0 516+543+513,
271+322+247, 163+188+151. Writes are identical season by season (120 / 58 / 28) and the Rules lookups on writes are identical
(513 / 247 / 151): the same writes, the same Rules. The reads differ by run-to-run listener and page-check timing in both
directions (2.11.0 measured 2,929 on 2026-11-22 and 2,961 here). So the release cost claimed is **zero**: r99 adds no Firestore
read or write. Nik's minimum of 14 seasons a day stays far inside Spark.

**Both runs: 252/296 checks, the same 44 failing on both builds.** All 44 are the `end.wiped.*` career-page checks taken after
the harness wipes each page's local storage at the end (Career Statistics says "Career history could not be loaded", Standings
"unavailable", Settings THIS DEVICE "Not ready"); every season check, every live career-page check on both phones and every
brand-new-browser check (`end.fresh.*`, `end.all.identical.*-fresh`) passes, as do zz.pageerrors / zz.network / zz.production /
zz.meter. The failure is identical on the live 2.11.0 tree (main fec8af69), so it does not come from r99; the 2.11.0 bump's run of
the same 2.11.0 code passed these checks on 2026-11-22. It is reported to the lead as a separate investigation (History/career,
sensitive), not fixed here. Logs: gameplay/r99/threads/bump/m2110-3s.log and b2120-3s.log (project files).

## Update safety

- The shell and service worker advance to 2.12.0-r99 in a fresh `career-mode-showdown-shell-2.12.0-r99` cache, and 2.11.0-r98 is
  retained for rollback, verified against its own **262** paths (`tests/fixtures/shell-paths/2.11.0-r98.json`, from main
  fec8af69; new contract r87 UR18: 2.10.0's 260 plus the two League Roulette files). This is the first bump since 2.8.0 whose
  PREVIOUS list has a different length, so r78 R4c's sorted-list sha moves from `e0996bb2…` to `0940986d…` and the counts in
  r86 RR3 / r78 R4c move from 260 to 262. r99 adds one shell path, `css/r78-marble-tile-metal.webp` (the themed panel marble,
  asked for by a relative url, so it is also an unversioned shell asset), and removes none: `SHELL_PATHS_ADDED_SINCE_PREVIOUS`
  lists exactly that file, `SHELL_PATHS_REMOVED_SINCE_PREVIOUS` is empty, and `SHELL_PATHS` holds 263 paths. The themed room
  plates and themed loading rooms are **never precached**: they are runtime-cached images (`V10_IMAGE_PATH`, and
  `THEMED_LOADING_PATH` for `assets/loading/{silver,black,matte}/`), fetched only by a phone that picked that clubhouse (UR18
  checks no themed folder is in `SHELL_PATHS`).
- Real service-worker update (local only, no Firebase; probe gameplay/r99/threads/bump/probe-update.cjs with the switchable
  static server hunt-server.cjs), three runs, 390x844: a page installed on 2.11.0 (main fec8af69, offline pack 107/107 filled) is
  served the 2.12.0 tree, reloads and takes 2.12.0 in **4.7 s** (Wooden 4,698 ms, Metallic Black 4,711 ms, Silver 4,718 ms; one
  explicit `registration.update()` after the reload, which this container needs). The 2.12.0 worker reports its own shell
  complete (0 missing) and the retained 2.11.0 shell verified against its **262** paths (0 missing), recovery revision
  2.11.0-r98. Fonts: 0 missing on 2.12.0 online and offline.
  - **Themed phone** (the pick stored in the browser before the update, as a phone that picked a clubhouse and was rolled back
    would have it): the first 2.12.0 frame already has `data-clubhouse` set and draws the themed loading room
    (`assets/loading/black/ENV_LOADING_PHONE_HC_590W.webp`, likewise silver), and Home draws the themed room. The only plain
    Wooden rooms in that run were asked for by the 2.11.0 page before the update took over (the Wooden run shows the same two,
    once per build). An **offline** reopen of the themed 2.12.0 page opens themed, 0 pictures failed, 0 plain rooms asked for (the
    themed loading room is runtime-cached once seen).
  - **Rollback** to 2.11.0 is accepted and the page comes back as 2.11.0-r98: Wooden rooms, no themed picture asked for, fonts 0 of
    4 missing online and offline, and the stored pick still there (`cmsClubhouseTheme` = black / silver). Clearing the rollback
    brings 2.12.0 back, and the phone opens straight in its clubhouse again (first frame themed, 0 plain rooms).
  Logs: gameplay/r99/threads/bump/probe-wooden.log, probe-black.log, probe-silver.log.
- `js/gfxTier.js` BUILD moves with RUNTIME_REVISION, so a hold written by 2.11.0 is dropped once on the first 2.12.0 load.
- An installed phone takes the update on Home, never in the middle of a game screen.
- **Mixed versions: safe.** r99 changes no Firestore document shape, no protocol step and no Rules: the only JavaScript changes
  are the clubhouse picker (`js/settings.js`, device storage only), Career Start layout and notice matching
  (`js/productionSharedCareerStart.js`), the Rule Book line and the version pins. A 2.11.0 phone and a 2.12.0 phone play the
  same Showdown.
- Finished and in-progress Showdowns are untouched. No saved Showdown is rewritten. Nothing in Firebase is deleted or edited.
- **Rollback to 2.11.0.**
  - **Showdowns:** nothing to say beyond "unaffected": 2.12.0 writes exactly what 2.11.0 writes, so every Showdown started on
    either build continues on the other.
  - **A chosen clubhouse:** 2.11.0 has no clubhouses, so a rolled-back phone that picked Silver, Metallic Black or Premium
    Matte Black shows the **Wooden** clubhouse (the 2.11.0 rooms). The pick itself stays in that browser's storage (2.11.0
    never reads or clears it), and the phone is back in its own clubhouse as soon as it runs 2.12.0 again. Proven in the probe
    above.

## Version bump

- `2.12.0-r99` everywhere it is pinned (this PR): package files, `APP_VERSION` (Settings and backups), the footer `v2.12.0`,
  `app-asset-revision` and every `?v=` on Home's own files and the manifest icons, `js/menuExperience.js`, the service worker's
  `RUNTIME_REVISION` (PREVIOUS `2.11.0-r98`), and `js/gfxTier.js` BUILD. `index.html` differs from gameplay/r99's only in those
  version strings (r99 itself added the clubhouse script and style in the head). The startup budget still passes: **33,981 of
  34,000** gzip bytes (2.11.0: 33,980; +1 from the version strings; the clubhouse script is inline in `index.html`, which the
  budget does not count: `index.html` is 10,356 gzip bytes, 6,666 at 2.11.0).
- Contracts moved on: r86 RR3/RR4, r87 UR3/UR5 and new UR18, r78 R4c (sha and 262), r79 M, v10-club 4, v10-rules-settings RS9,
  v10-foundation F9/F9b and F10 (index.html `75b6db05…` with its 2.12.0-r99 pins and footer).
- Version comparison: no code compares versions as strings (`js/backup.js` and the contracts use `\d+`), so 2.12.0 parses.

## Tests on this branch

- Full product contracts on a1dab071 (`node tests/support/run-selected-product-contracts.cjs --all`, 20 m 33 s, this record
  included): **365/366 pass**. The one miss, `r87-career-load-gate-edges` G-06 ("two tabs open the career at once": tab A's
  covered page lasted 1,235 ms against the gate's grace), is a timing check on a career page this release does not touch; run
  alone it failed once and passed once on this container, and it passes in the Gate's L1 on GitHub (the same flake was seen on
  #1571's local run). Log: gameplay/r99/threads/bump/full-contracts.log (project files).
- The Gate's L1 on a1dab071 found one real miss this local run had already absorbed: `r98-league-roulette-wiring` still asked for
  the two roulette files to be listed as added since PREVIOUS. From 2.12.0 they are in the retained 2.11.0 list, so that check now
  reads them from `tests/fixtures/shell-paths/2.11.0-r98.json` and requires that they are not added again (fixed on this branch;
  fails before the fix, passes after).
- Bump contracts on the bump commit: r86-release, r87-upgrade-rollback-list (18), r78-marble-confirm, r79-modes-settings,
  v10-club, v10-foundation, v10-rules-settings, r99-clubhouse-themes, composed-production-rules: all pass.
- CE2PG 3 seasons on both builds and the real service-worker update probe (above). Story pages checked in Chromium (Story home,
  `#latest`, `#latest/r99`, `#latest/r98`, `#volume/for-the-fans`, `#read/r99-for-the-fans` at desktop and phone,
  `#read/r99-live`, `#contents`; no page errors).
- Codex review on a1dab071: no major issues.

## What did not change

- No tiebreak anywhere. Scoring, season order, the League Roulette, the Ball Game, Chamber Men, Russian Roulette, Prime Pack and
  the Transfer War rules are unchanged. The phases still run SHARED_SETUP_OPEN → LEAGUE_WHEEL_COMMITTED →
  CLUB_ASSIGNMENTS_COMMITTED, never skipped or reordered.
- Pairing, joining and the Remote Joining protocol keep their rules.
- The no-flash rules and the Reus Gate are unchanged (the clubhouse is set before first paint; flash test PASS in all four).
- No 3D screen's look or quality profile changes.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.

## Red team

- Fable FJ1 to FJ11 (r99 packets, pin fec8af69) are being verified in their own thread against fec8af69; any fix goes into
  gameplay/r99 on its own PR. None is part of this bump.
- Codex reviews on #1570 and #1571 were handled; Claude (Opus, high) reviewed #1570's Career Start JS. This bump gets
  `@codex review`, or a Claude high review on the exact head if Codex is out of usage (Nik's rule, 2026-11-22).

## SSJR status

SSJR-1.1 remains frozen at `0/100`. SSJR-2.1 is `100/100`, earned on r85 (`1.9.9-r85`). No SSJR credit comes from this source,
CI or deployment, and no new physical acceptance is claimed for 2.12.0. The four clubhouses have only been seen on test screens;
their real-device proof is Nik and Daniel opening 2.12.0 on their own phones.

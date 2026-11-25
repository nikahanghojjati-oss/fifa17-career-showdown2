# Adding a material clubhouse: B7's pipeline (for DUET_P3_MATERIAL_CLUBHOUSES)

Written by B7 on 2026-11-25. Repository paths are relative to the repo root. The examples use LOOK=RUBY and key=ruby; do the same for EMERALD/emerald and LAPIS/lapis.
Hold every name a player reads until Nik's naming card lands, and don't use "Premium" in those names. Internal keys can be anything short, lower-case and a-z only.

## 1. Tickets (Team V, Astra, one asset per ticket)
B7's generators live in /mnt/project-files/gameplay/r100/threads/b7/. Copy them and add a LOOKS entry with the look's feel, walls, stone, metal, floor, ceiling, sofa, light and a colour lock (see mk_signin.py LOOKS["MATTE"] for the shape).
- **mk_full.py**
  - 8 desktop rooms: OFFICE HALL ARCHIVE BOX COACHES TUNNEL CLUB LOADING.
  - Material slab.
  - 10 phone bands: HOME BOARD OFFICE HALL ARCHIVE BOX COACHES TUNNEL CLUB LOADING.
- **mk_tickets.py (pilot)**: HOME and BOARD desktop. Do these first and get Nik's OK.
- **mk_lr.py**
  - League Roulette desktop (empty box, no men): ENV_BOX_PLATE_EMPTY_<LOOK>_P1_2X.
  - LR phone V4.
  - CLUB SIDEWAYS.
- **mk_signin.py**: the sign-in lounge. ENV_SIGNIN_PLATE_<LOOK>_P1_2X is 3072x1728. ENV_SIGNIN_PHONE_<LOOK>_P1 is 1179x2096.
- The total is about 24 paintings per clubhouse (Platinum/Black/Matte had 21+LR+sideways+sign-in).
- Phone tickets need a people-free swatch REF_<ROOM>_<LOOK>_SWATCH.webp cut from the finished desktop painting. Use scratchpad cut_swatch.py; the method is in memory r100-b7-premium-clubhouses-history: the widest mask-free column run of masks/ENV_<ROOM>_PLATE_HC_V3_1920.png, 12 px in, x1.6, WebP q90.
- Filing:
  - tickets go on leads/relay under project-documents/leads-relay/ with a FEED line;
  - delivery goes to project-documents/hc-art/ho-premium-full/<look>/.

## 2. Wiring paintings
1. Copy the masters into tools/clubhouse-themes/paintings/. The names must match these patterns:
   - desktop: ENV_<ROOM>_PLATE_<LOOK>_P1_2X.webp
   - phone: ENV_<ROOM>_PHONE_<LOOK>_P1.webp
   - other masters: see OTHER_MASTERS.
2. In paint.py, add the look to THEME (line 53), and to the NAME, PHONE and LOOKS regexes.
3. Run these in order:
   1. `python3 tools/clubhouse-themes/paint.py`. It writes plates-hc/<key>/ and assets/loading/<key>/, lays the Wooden men back through the masks, and checks face drift and size.
   2. `panel_tiles.py`. Add the key to BAND with a dark base→top band so light text keeps its contrast, or None to use the slab as painted.
   3. `pin.py`. Add the key to its theme loop.
   4. `manifest.py`. Add the key to its theme loop.
4. If Nik asks for a no-glint material, matte_check.py is the template: it compares against Black, counts hot spots outside the lit areas, and has an ACCEPTED list.
5. Delete build.py's recolour for a new key: never ship a recolour.

## 3. New theme key in the game (startup code: Opus high, flash x5)
- index.html theme script (around lines 15–48):
  - the P and LR regexes `(?:silver|black|matte)`;
  - `use()`'s key check;
  - BASE colour map;
  - the `html[data-clubhouse=...]` blocks: loading room CSS vars, startupRoom content rules, Trophy/Legacy ground colours, and the Silver-only ink rule if the room is light.
  - Then re-pin index.html in tests/contracts/v10-foundation-contracts.cjs (line ~1730, with a comment).
- service-worker.js:
  - precache css/r78-marble-tile-<key>.webp in SHELL_PATHS, UNVERSIONED_SHELL_ASSET_PATHS and SHELL_PATHS_ADDED_SINCE_PREVIOUS;
  - add the key to THEMED_LOADING_PATH (line 587).
  - Update r86 R99_ADDED and r87 w.added.
- js/settings.js SETTINGS_CLUBHOUSE_THEMES (line 1072): `["key","<Name> Clubhouse","<one short line of what it's made of>"]`. Update the r99 names check and js/ruleBook.js' clubhouse sentence.
- UI finish (panels, frames, buttons) per clubhouse: tools/clubhouse-themes/finish.py generates the end of css/r78-marble-surfaces.css (not startup).
- Tests that list the keys (add the new one everywhere):
  - r99-clubhouse-themes-contracts (theme lists, LOOK map, runtime fix checks);
  - flash-gate-always-contracts;
  - tests/browser/v10-screen-flash-audit.cjs and v10-screen-flash-clubhouses.cjs;
  - tests/browser/r91-old-art-audit.cjs (THEME, OTHER_LOADING);
  - pin.py, manifest.py and build.py THEMES.

## 4. Proof before ready
- Contracts: r99, v10-foundation (F9c and F10), r86, r87 rollback, reus-gate-startup, static-app-release and final-polish (startup gzip budget), v10-home.
- Flash in every clubhouse:
  `CMS_BASE_URL=http://127.0.0.1:4701/ CMS_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/real/chrome-linux64/chrome CMS_CLUBHOUSE=<key> npm run -s test:v10-flash`
  Start the server with `CMS_TEST_PORT=4701 setsid nohup node tests/support/static-server.cjs &`. It takes about 4–8 minutes per look.
- Old-art audit per key: `CMS_CLUBHOUSE=<key> node tests/browser/r91-old-art-audit.cjs`. It must PASS with no A4/A5.
- Board: add a section with the 5 screens x 4 sizes. Use B7's gridshot.cjs pattern: set localStorage cmsClubhouseTheme, use OA.openScreen(page,KEY), and shoot at 1920x866, 1920x1035, 390x844 and 844x390. Nik OKs the look on the board before merge.

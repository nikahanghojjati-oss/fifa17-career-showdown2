# CREST-V1 QA record (2026-09-30, owner-gate revision 2026-10-01)

Branch `claude-cloud/crest-v1`. Source: `claude/project-thread-ss6886` @ `3ec6f8c` plus plate-g, which had moved to `8fbda03` and was merged in. Production file: `js/visualIdentity.js` only (still lazy-loaded through `js/optionalModules.js`; `index.html` and the startup path are unchanged).

## Owner-gate revision (2026-10-01)
Started from `de515de` (brief commit on top of `21ff51a`). 14 crests redrawn per `claude/handoffs/CC_CREST_V1_OWNER_GATE_REV_BRIEF_2026-09-30.md`: Chelsea, Middlesbrough, Bayer Leverkusen, Lyon (new `lion` head in profile), West Ham United (new splayed `hammers`), and nine former star-only themes with new motifs: Alavés `raven`, Eibar `anvil`, Real Betis `olive`, RB Leipzig `linden`, Atalanta `apple`, Empoli `flask`, Sassuolo `tile`, Montpellier `sun`, Rennes `triskell`. Every other crest is unchanged. `CREST_REVIEW_STANDALONE.html` was regenerated (inlined `visualIdentity.js` block only, diff against the file is empty). Side-by-side evidence against the committed target: `qa/owner-gate-rev-14.png`. All measurements below were re-run on this revision.

## Measured results (owner-gate revision, 2026-10-01)
| Check | Result |
|---|---|
| Clubs in `data/clubs.js` | 98 |
| Recipes in `CLUB_CREST_RECIPES` | 98. Keys match the club names exactly, with no extras. |
| Unique crest drawings (SVG ids normalised) | 98 |
| Unique `identity.crest` data URIs | 98, all `url("data:image/svg+xml,…")` |
| League marks (`LEAGUE_MARK_RECIPES`) | 5: `premier_league, laliga, bundesliga, serie_a, ligue_1` |
| `getLeagueMark` shape | `{id, code, primary, svg, image}` for all 5; inherited keys (`constructor`, `__proto__`, `toString`, `hasOwnProperty`) and `""` return `null` |
| `<image`, `.png` or `href=` in generated production SVG | 0 of 206 outputs (98 clubs × raw SVG + decoded data URI, 5 marks × `svg` + decoded `image`) |
| `<image`, raster file extensions, `reference/` or `assets/logos/` in `js/visualIdentity.js` | 0 |
| `<text>` in club crests | 0. League marks carry only the country code (`ENG · I` and so on). |
| Club name inside any crest SVG or data URI | 0 of 98 |
| Shared-page id test (Arsenal ×3 including the `crestSvg` getter, Bayern ×3, PL mark ×3, FR mark ×1) | 28 ids, all unique, every `url(#…)` resolves |
| Unknown-name fallback | Palette lookup counts only own properties of `CLUB_IDENTITY_PALETTES`. The contract asserts 8 unknown inputs (`constructor`, `__proto__`, `toString`, `hasOwnProperty`, `valueOf`, `""`, `!!!---...???`, `Ünïcødé Ψ 足球 FC`): each gets hex primary/secondary/accent, the fallback recipe, a CSS-ready `identity.crest`, raw SVG starting `<svg`, no `undefined` and no `<image>`. Before the guard, `constructor` failed with `primary=undefined`. |
| League Keeps/Changes | Present on all 5 league cards in both `CREST_REVIEW.html` and `CREST_REVIEW_STANDALONE.html` (same `LEAGUE_NOTES` text in both; the crest contract checks both files). |
| `node tests/contracts/static-app-release-contracts.cjs` | exit 0; `PASS Dynamic static release contracts v1.9.1/1.9.1-r46; startup 162545/37457.` |
| `npm run test:contracts` | exit 0; 84 output lines start with `PASS` (the crest contract is not registered in this runner) |
| `node tests/contracts/crest-v1-identity-contracts.cjs` (additive, run separately) | exit 0; one `PASS` line |
| `npm run test:home-visual` | Not run. Needs `npm ci` (`tar-fs` plus packaged Chromium), which is a heavy install the brief excludes. |

## Browser run
Command: a scratch Playwright script (global `playwright@1.56.1`, Chromium at `/opt/pw-browsers/chromium`, `file://` URLs) that opened each page, collected `console` errors and `pageerror` events, counted cards, and took the shots below. The script itself is not committed. Result:

| Page / viewport | Club cards | League cards | Cards with Keeps + Changes | Console errors + page errors |
|---|---|---|---|---|
| `CREST_REVIEW.html` 1280×900 (full page) | 98 | 5 | 98 + 5 | 0 |
| `CREST_REVIEW.html?strip=1` 1280×900 | 98 | 5 | 98 + 5 | 0 |
| `CREST_REVIEW.html` 360×640 | 98 | 5 | 98 + 5 | 0 |
| `CREST_REVIEW.html` 375×553 | 98 | 5 | 98 + 5 | 0 |
| `CREST_REVIEW_STANDALONE.html` 1280×900 (in place) | 98 | 5 | 98 + 5 | 0 |
| `CREST_REVIEW_STANDALONE.html?strip=1` 1280×900 | 98 | 5 | 98 + 5 | 0 |
| `CREST_REVIEW_STANDALONE.html`, copied alone into an empty folder | 98 | 5 | — | 0 |

No rendered card container contained the text `undefined`.

If `CREST_REVIEW.html` is opened where `../../data/clubs.js` and `../../js/visualIdentity.js` cannot load, it shows a notice pointing to the standalone page and then deliberately throws `Error("crest review scripts not loaded")` to stop the render. That path was not part of the run above.

## Shots (`qa/`, regenerated in the owner-gate revision)
- `review-1280-full.png`: full review page at 1280 wide, 1280×4718 (was 1280×4703 before this revision)
- `small-size-strip-24-42-96.png`: every crest at 24, 42 and 96 px, 1248×2353 (element capture of `#strip`)
- `phone-360x640.png`, `phone-375x553.png`: phone viewport captures at those sizes
- `owner-gate-rev-14.png`: the 14 revised crests rendered from `js/visualIdentity.js` at 96, 42 and 24 px, with the committed target sheet below them

## Raster files in this folder
Production club crests and league marks are generated SVG. The only raster files under `visual-assets/crests/` are the five QA shots above the inherited `reference/CREST_PROOF_SHEET_V2.png` (1520×2176, present before CREST-V1 at `ec39ab4`) and the owner-gate target `reference/CREST_V1_OWNER_GATE_TARGETS.png` (2560×1552, added with the brief at `de515de`). The reference sheets are input material only; no runtime code refers to them.

## Closeness review (section 2 of the brief)
Every club recipe and every league mark records what it keeps and what it changes. These notes describe design intent; they are not a legal or provenance review. The 8 V2 clubs and the Italy and France marks carry over as drawn.

Judgement calls:
- **RB Leipzig:** bulls avoided entirely (corporate trademark risk). Owner-gate revision: a linden leaf (the city name) on white, red and blue.
- **Leicester City:** the fox mask is frontal like the real badge, so it is tilted and set on a shield with no petal ring.
- **Hamburg:** the single real rhombus becomes three small rhombuses in a row on a shield.
- **Milan:** the real roundel has the cross in a quarter. Ours is a shield with a small cross in a top band.
- **Eibar:** rifles avoided. Owner-gate revision: halves plus an anvil (the Armeros).
- **Lille and Nancy:** redrawn after the first render (the dog read as a blob, the thistle as a figure).
- Former star-only themes (Alavés, Eibar, Real Betis, Atalanta, Empoli, Sassuolo, Montpellier, Rennes, RB Leipzig) each received their own motif at the owner gate. Juventus keeps its star above by owner choice; Bordeaux keeps its chevron and star.
- **West Ham United:** two hammers splayed apart, never crossed; no castle.
- **Chelsea, Middlesbrough, Bayer Leverkusen, Lyon:** one shared lion head in profile (not a full lion), differentiated by shape, field and colours.

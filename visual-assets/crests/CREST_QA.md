# CREST-V1 QA record (2026-09-30)

Branch `claude-cloud/crest-v1`. Source: `claude/project-thread-ss6886` @ `3ec6f8c` plus plate-g, which had moved to `8fbda03` and was merged in. Production file: `js/visualIdentity.js` only (still lazy-loaded through `js/optionalModules.js`; `index.html` and the startup path are unchanged).

## Measured results
| Check | Result |
|---|---|
| Clubs in `data/clubs.js` | 98 |
| Recipes in `CLUB_CREST_RECIPES` | 98. Keys match the club names exactly, with no extras. |
| Unique crest drawings (SVG ids normalised) | 98 |
| Unique `identity.crest` data URIs | 98, all `url("data:image/svg+xml,…")` |
| League marks (`LEAGUE_MARK_RECIPES`) | 5: `premier_league, laliga, bundesliga, serie_a, ligue_1` |
| `getLeagueMark` shape | `{id, code, primary, svg, image}` for all 5 |
| `<image` in source or any generated SVG | 0 |
| `assets/logos/` in source | 0 |
| `<text>` in club crests | 0. League marks carry only the country code (`ENG · I` and so on). |
| Club name inside any crest SVG or data URI | 0 of 98 |
| Shared-page id test (Arsenal ×3 including the `crestSvg` getter, Bayern ×3, PL mark ×3, FR mark ×1) | 28 ids, all unique, every `url(#…)` resolves |
| Unknown-name fallback | valid identity (palette, recipe, crest, initials), no `<image>` |
| Review page browser errors | 0 |
| `node tests/contracts/static-app-release-contracts.cjs` | PASS (startup 162545/37457, unchanged) |
| `npm run test:contracts` | exit 0, 85 PASS lines |
| `node tests/contracts/crest-v1-identity-contracts.cjs` (new, additive) | PASS |
| `npm run test:home-visual` | Not run. Needs `npm ci` (`tar-fs` plus packaged Chromium), which is a heavy install the brief excludes. |

## Shots (`qa/`)
- `review-1280-full.png`: full review page at 1280 wide
- `small-size-strip-24-42-96.png`: every crest at 24, 42 and 96 px
- `phone-360x640.png`, `phone-375x553.png`: phone crops

## Closeness review (section 2 of the brief)
Every recipe records what it keeps (colours plus one theme) and what it changes (outline family, pose, layout, no text). The 8 V2 clubs and the Italy and France marks carry over as drawn.

Judgement calls:
- **RB Leipzig:** bulls avoided entirely (corporate trademark risk). Colours and a star only.
- **Leicester City:** the fox mask is frontal like the real badge, so it is tilted and set on a shield with no petal ring.
- **Hamburg:** the single real rhombus becomes three small rhombuses in a row on a shield.
- **Milan:** the real roundel has the cross in a quarter. Ours is a shield with a small cross in a top band.
- **Eibar:** rifles avoided; halves plus a star.
- **Lille and Nancy:** redrawn after the first render (the dog read as a blob, the thistle as a figure).
- Star-only themes (Alavés, Eibar, Real Betis, Atalanta, Empoli, Sassuolo, Montpellier, Rennes, RB Leipzig): colours and kit carry the likeness. These are candidates for a richer theme at the owner gate.

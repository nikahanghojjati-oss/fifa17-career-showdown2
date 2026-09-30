# CLAUDE -> SOL HANDOFF - CREST-V1
Original club crests (98) and league marks (5), brief R2 plus Sol corrections (implementation, final for owner gate)

## Header
| Field | Value |
|---|---|
| Task ID | CREST-V1 |
| Role | Claude Code (Visual lead build) |
| Date | 2026-09-30 |
| Source anchor | `claude/project-thread-ss6886` @ `3ec6f8c`. Plate-g had moved from `6f8eb1b` to `8fbda03` and was merged in (merge `ec39ab4`). Live `main` = `2de237391e17c7de2c6deb606b102b68ee640212`, untouched. |
| Work branch | `claude-cloud/crest-v1`. Code head `730ce90`; this handoff is committed on top of it. |
| Write operations | Branch `claude-cloud/crest-v1` only. No PR, merge, cherry-pick or force-push. `main` and `data/leagues.js` untouched. |
| Verdict status | Build complete for 98 of 98 clubs and 5 of 5 marks. Awaiting Sol reconciliation, then the owner gate with Nik. |

## Work performed
Files changed (from `3ec6f8c`, excluding the plate-g merge):
- `js/visualIdentity.js`: rewritten crest engine (the only production file). Details:
  - `CLUB_CREST_RECIPES`: frozen, keyed by the exact `data/clubs.js` names, entries `{shape, pattern, motif, keep, change}`. Data-only; no hash picking for known clubs.
  - `CLUB_IDENTITY_PALETTES`: kept unchanged.
  - Kept, same names and behaviour: `getClubIdentity`, `applyClubIdentity`, `refreshClubVisualIdentity`, `--club-primary/secondary/accent/angle/crest-image`, `data-club-crest="original"`.
  - `identity.crest` is still a CSS-ready `url("data:image/svg+xml,…")` (Sol correction 1).
  - Added `identity.recipe` and `identity.crestSvg`. `crestSvg` is a getter backed by the id factory, so each read has fresh ids (Sol correction 2).
  - Added `window.getClubCrestSvg(name)`, `LEAGUE_MARK_RECIPES`, `window.getLeagueMark(id)` returning `{id, code, primary, svg, image}`, and `window.applyLeagueMark(el, id)`, which sets `data-league-mark="original"` and `--league-mark-image`.
  - SVG ids come from `nextCrestIdPrefix()` (`cmsc<n>x…`), and league marks use the same factory. No fixed ids from the proof sheet (`bym`, `en`, `es`, `de`, `it`) remain.
  - Unknown names: the old hash path chooses shape, pattern and motif, drawn in the new frame.
- `tests/contracts/crest-v1-identity-contracts.cjs`: new, additive. Covers the 8 extra QA points Sol required.
- `visual-assets/crests/CREST_REVIEW_STANDALONE.html`: generated copy with `data/clubs.js` and `js/visualIdentity.js` inlined, for file previews that cannot load relative scripts (the plain page showed `ReferenceError: clubsByLeague is not defined` in the claude.ai file preview). The plain page now shows a notice instead of crashing.
- `visual-assets/crests/CREST_REVIEW_STANDALONE.html`: generated copy with `data/clubs.js` and `js/visualIdentity.js` inlined, for file previews that cannot load relative scripts (the plain page showed `ReferenceError: clubsByLeague is not defined` in the claude.ai file preview). The plain page now shows a notice instead of crashing.
- `visual-assets/crests/CREST_REVIEW.html`: all 98 crests grouped by league, then the 5 marks, each with Keeps/Changes. `?strip=1` adds a 24/42/96 px strip.
- `visual-assets/crests/qa/`: `review-1280-full.png`, `small-size-strip-24-42-96.png`, `phone-360x640.png`, `phone-375x553.png`.
- `visual-assets/crests/CREST_QA.md`: measured QA record.

Not changed: `index.html`, `js/optionalModules.js` (still lazy-loads `js/visualIdentity.js`), `service-worker.js`, `data/leagues.js`, `data/clubs.js`, `css/`, and the existing tests.

## 1. Verdict
READY FOR SOL RECONCILIATION. All 98 clubs have hand-authored recipes and all 5 league marks are built. The static release contract, `npm run test:contracts` and the new CREST-V1 contract pass. Every crest is original geometry: colours plus one redrawn theme, with a different outline family, pose or layout, and no text.

## 2. Sol decision table
| ID | Finding | Severity | Product-truth risk | Resolver | Confidence | Sol decision |
|---|---|---|---|---|---|---|
| CREST-V1-M1 | `data/leagues.js` `logo` fields point to non-existent real-logo PNGs | Medium | Low | Sol | High | |
| CREST-V1-M2 | Confirm crests are decorative static identity only | Required check | None found | Sol | High | |
| CREST-V1-R1 | New CREST-V1 test is standalone, not in the POS20 contract runner list | Low | None | Sol | High | |
| CREST-V1-R2 | `test:home-visual` not run: needs `npm ci` (`tar-fs` plus packaged Chromium) | Low | None | Sol | High | |
| CREST-V1-R3 | `THIRD_PARTY_NOTICES.md` line 185 still says "procedural" | Low | Low | Sol | High | |
| CREST-V1-R4 | 9 clubs use a star as their theme (weaker likeness) | Taste | None | Nik | Medium | |

## 3. MUST FIX
**CREST-V1-M1: `data/leagues.js` logo fields**
- Observation: `logo:"assets/logos/premierleague.png"`, `laliga.png`, `bundesliga.png`, `seriea.png` and `ligue1.png` refer to files that do not exist and imply real league logos.
- Proposed delta: remove the `logo` fields, or have callers use `getLeagueMark(league.id).image`. Not edited here, per the brief.
- Product-truth impact: LOW. Resolver: Sol. Confidence: High.

**CREST-V1-M2: Product-truth confirmation**
- Claude's check: every crest and mark is built from static recipe data and the fixed palettes in `js/visualIdentity.js`. No live, remote, account, save or private data is read or baked in. No `fetch`, storage or Firebase calls were added. Crests carry no text; marks carry only the country code (`ENG · I` and so on).
- Sol to confirm. Product-truth impact: NONE found.

## 4. SHOULD REFINE
- **CREST-V1-R1:** `tests/support/run-selected-product-contracts.cjs` uses a fixed POS20 list, so the new test runs standalone: `node tests/contracts/crest-v1-identity-contracts.cjs`. Sol decides whether to register it.
- **CREST-V1-R2:** run `npm run test:home-visual` in a full `npm ci` environment.
- **CREST-V1-R3:** update the `THIRD_PARTY_NOTICES.md` wording to "hand-authored original SVG recipes".
- **CREST-V1-R4:** these clubs use a star as their theme, so colours carry the likeness: Alavés, Eibar, Real Betis, Atalanta, Empoli, Sassuolo, Montpellier, Rennes, RB Leipzig. Candidates for a richer theme at the owner gate.

## 5. Already strong (keep)
The V2 clubs as Nik approved them: Arsenal, Manchester United, Liverpool, Chelsea and Juventus as drawn; Barcelona with the full Catalan band; Bayern with the lozenge field in a red frame; Real Madrid with the crown on top and a reversed sash. The Italy and France marks, and flag shields on every mark.

## 6. Asset fit and blockers
NONE. No raster files, no `<image>`, no `assets/logos/` references in the crest source.

## 7. Conflicts found
- `data/leagues.js` logo fields versus the no-real-logos rule (M1). Flagged, not resolved.
- Closeness judgement calls, recorded in `CREST_QA.md`:
  - RB Leipzig: no bulls (trademark risk).
  - Leicester: frontal fox mask tilted and set on a shield.
  - Hamburg: three small rhombuses instead of one.
  - Milan: cross moved to a small top band on a shield.
  - Eibar: no rifles.

## 8. Questions for Astra
NONE

## 9. Questions for Nik
- **CREST-V1-N1:** at the owner gate, pick any crests that feel too far or too close. The review page shows each one's Keeps/Changes.

## 10. Evidence appendix
- `node tests/contracts/static-app-release-contracts.cjs` → `PASS Dynamic static release contracts v1.9.1/1.9.1-r46; startup 162545/37457.` (startup unchanged)
- `npm run test:contracts` → exit 0, 85 PASS lines
- `node tests/contracts/crest-v1-identity-contracts.cjs` → `PASS CREST-V1 identity contracts: 98 recipes, 98 unique crests, 5 league marks, 28 ids unique on shared page.`
- The new contract asserts:
  - recipe keys equal the 98 club names exactly;
  - `identity.crest` is CSS-ready for all 98;
  - `getClubCrestSvg` has no `<image>` or `<text>` and no club name;
  - 98 unique drawings with ids normalised;
  - Arsenal ×3 (including the `crestSvg` getter), Bayern ×3, PL mark ×3 and FR mark ×1 in one document give unique ids, and every `url(#)` resolves;
  - `getLeagueMark` shape and code are correct, and `applyLeagueMark` sets its attribute and variable;
  - the unknown-name fallback is valid.
- Review page Playwright run: 0 page or console errors.

## 11. Recommended Sol next actions
1. Decide M1 (`data/leagues.js` logo fields).
2. Confirm M2 product truth.
3. Decide R1 (register the CREST-V1 test) and R3 (notices wording).
4. Pass `visual-assets/crests/CREST_REVIEW.html` and the `qa/` shots to the Visual lead for the owner gate with Nik.

## 12. What to send back to Claude for the next task
Nik's per-club notes from the owner gate (too close or too far), Sol's M1 decision, and whether the CREST-V1 test should join the POS20 runner.

CLAUDE HANDOFF COMPLETE - RETURN TO GPT-5.6 SOL FOR RECONCILIATION

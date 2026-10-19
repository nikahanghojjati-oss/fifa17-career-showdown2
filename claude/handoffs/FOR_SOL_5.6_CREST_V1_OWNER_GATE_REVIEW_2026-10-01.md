# FOR SOL 5.6: CREST-V1 owner-gate review (2026-10-01)

Branch `claude-cloud/crest-v1`. Revision under test: `c3e1834` (parent `de515de`). Verify brief: `claude/handoffs/CC_CREST_V1_OWNER_GATE_VERIFY_BRIEF_2026-10-01.md` (commit `f19a85e`). No fix commits were made in this session.

## 1. What changed and why
Nik's owner-gate picks, applied in `c3e1834` (`js/visualIdentity.js` + regenerated standalone page and QA):
- Lion head in profile (one head, no body, mane behind the face) for Chelsea, Middlesbrough, Bayer Leverkusen and Lyon (`lion` motif replaced).
- West Ham: two hammers splayed apart, never crossed (`hammers` motif replaced).
- Nine crests that only had a star now have real themes: Alavés raven, Eibar anvil, Real Betis olive, RB Leipzig linden, Atalanta apple, Empoli flask, Sassuolo tile, Montpellier sun, Rennes triskell.
- Four of these are toned down (flat, one colour, small): Sassuolo, Montpellier, Empoli, Atalanta.
- Juventus keeps its star by owner choice (not touched).

## 2. Per-crest verdicts (14)
Sheet: `qa/crest-v1/OWNER_GATE_VERIFY_SHEET.png` (live render at 96/42/24 px, 360 px phone row at the app's 42x48 crest size, target sheet embedded). Motif area = filled area in viewBox units² (motif rendered alone, alpha > 50%).

| Crest | Direction | Verdict | Evidence |
|---|---|---|---|
| Chelsea | lion head, profile | PASS | gold profile head facing right, mane behind, no body; matches target at all sizes |
| Middlesbrough | lion head, profile | PASS | white profile head on red roundel; matches target |
| Bayer Leverkusen | lion head, profile | PASS | white profile head on black/red split; matches target |
| Lyon | lion head, profile | PASS | red profile head on white/blue; matches target |
| West Ham United | two hammers, splayed apart | FAIL (minor) | handles do not intersect (gap at the base), but the two heads touch at one point on the centre line (x=60, y≈57; 2 overlapping px at 4x render). Reads as "heads touching" at 96 and 42 px. Matches target. Not fixed: geometry change |
| Alavés | raven | PASS | navy raven, wings spread, on blue/white stripes; matches target |
| Eibar | anvil | PASS | gold anvil on blue/red roundel; reads as anvil at 24 px |
| Real Betis | olive branch | PASS | olive branch with leaves and two olives on green/white stripes |
| RB Leipzig | linden leaf | PASS | red linden leaf with veins and stem on white shield |
| Atalanta | apple, toned down | FAIL (weight) | flat, one colour (gold), no gradient: PASS. But area 1935 vs raven 1565 (lion 4543), so it is not lighter than the raven. Matches target. Not fixed: needs resize |
| Empoli | flask, toned down | PASS | one colour (white), no gradient, area 1353 (< raven 1565, < lion 4543) |
| Sassuolo | tile, toned down | PASS | one colour + inner square only, no gradient, area 1020 |
| Montpellier | sun, toned down | PASS | one colour (white), no gradient, area 991 |
| Rennes | triskell | PASS | white triskell in a ring on black/red shield |

Note: every crest SVG (all 98) carries the shared frame gradients (gold rim and sheen, `visualIdentity.js:347-348`); the motifs above use no gradient.

## 3. Contract results
| Command | Exit | Key output |
|---|---|---|
| `node tests/contracts/crest-v1-identity-contracts.cjs` | 0 | PASS: 98 recipes, 98 unique crests, 5 league marks, 28 ids unique, 8 hostile names fall back |
| `node tests/contracts/static-app-release-contracts.cjs` | 0 | PASS v1.9.1/1.9.1-r46; startup 162545/37457 (no budget issue) |
| `npm run test:contracts` | 0 | POS10 selected deterministic census 94/94 PASS |
| Playwright `file://` load: `CREST_REVIEW.html`, `CREST_REVIEW_STANDALONE.html`, both with `?strip=1` | n/a | each: 98 club cards, 5 league cards, 0 console errors, 0 pageerror; strip view 98 strips |
| 14 crest SVGs | n/a | all start with `<svg`; no `<text`, `<image`, `undefined`, `data:`, external `href`, or club name |
| All 98 crest SVGs | n/a | 0 with `<image`, `data:` or external `href` |
| Standalone sync (2nd `<script>` block vs `js/visualIdentity.js`) | diff empty | identical |
| Raster files with "crest" in path | n/a | only `visual-assets/crests/qa/*` (5) and `visual-assets/crests/reference/*` (2), plus the new `qa/crest-v1/OWNER_GATE_VERIFY_SHEET.png` |

## 4. Byte-identical check vs `de515de`
- `CLUB_CREST_RECIPES`: 98 compared, 14 differ, exactly the 14 targeted (Chelsea, Middlesbrough, West Ham United, Alavés, Eibar, Real Betis, Bayer Leverkusen, RB Leipzig, Atalanta, Empoli, Sassuolo, Lyon, Montpellier, Rennes). 84 untouched, including Milan, Monaco, Barcelona and Juventus.
- `CREST_MOTIFS`: 60 old, 69 new; 12 differ: `lion`, `hammers`, `thistle` (trailing comma only, verified equal after stripping it) and 9 added (`raven`, `anvil`, `olive`, `linden`, `apple`, `flask`, `tile`, `sun`, `triskell`). 57 unchanged.
- `LEAGUE_MARK_RECIPES` and `LEAGUE_FLAGS`: identical.

## 5. Head
- Crest code last changed at `c3e1834`. This file and the sheet are committed together as the last commit, so the SHA named below is the commit just before it: `f19a85e` (brief-only commit on top of `c3e1834`; crest code is identical to `c3e1834`).
- Sheet: `qa/crest-v1/OWNER_GATE_VERIFY_SHEET.png`.

## 6. Larger defects (noted only, not fixed)
- West Ham United: hammer heads touch at the centre line. Suggested fix: move the groups out by about 1.5 units (`translate(40.5 58)` / `translate(79.5 58)`) so the heads clear. Nik's call, since the target shows the same contact.
- Atalanta: the apple is "toned down" in colour but by filled area it is heavier than the raven (1935 vs 1565). If Nik wants it lighter, scale the apple to about 0.85 around its centre. The target shows the current size.

## 7. Question
"OK to freeze ACCEPTED_CREST_SHA = f19a85e after Nik's final look?"

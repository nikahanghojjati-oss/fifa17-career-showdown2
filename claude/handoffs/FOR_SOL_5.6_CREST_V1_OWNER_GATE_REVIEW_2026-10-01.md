# FOR SOL 5.6: CREST-V1 owner-gate review (2026-10-01)

Branch `claude-cloud/crest-v1`. Revision under test: `f1cfff4` (two-fix commit, parent `f57944d`, which is the brief-only commit on top of `997f3f3`). Owner-gate revision: `c3e1834`. Briefs: `claude/handoffs/CC_CREST_V1_OWNER_GATE_VERIFY_BRIEF_2026-10-01.md` (commit `f19a85e`) and `claude/handoffs/CC_CREST_V1_TWO_FIX_BRIEF_2026-10-01.md` (commit `f57944d`).

Fix commit: `f1cfff4` `fix: CREST-V1 West Ham hammer gap, lighter Atalanta apple` changes only the `hammers` and `apple` entries of `CREST_MOTIFS` in `js/visualIdentity.js`, plus the resynced inlined copy in `visual-assets/crests/CREST_REVIEW_STANDALONE.html`.
- `hammers`: groups moved from `translate(42 58)` / `translate(78 58)` to `translate(38 58)` / `translate(82 58)`. Rotation (±14°) and size unchanged.
- `apple`: the same one-colour group (body, stem, leaf) now carries `transform="translate(60 76) scale(.76) translate(-60 -76)"`. No gradient, no highlight, no extra shape.

## 1. What changed and why
Nik's owner-gate picks, applied in `c3e1834` (`js/visualIdentity.js` + regenerated standalone page and QA):
- Lion head in profile (one head, no body, mane behind the face) for Chelsea, Middlesbrough, Bayer Leverkusen and Lyon (`lion` motif replaced).
- West Ham: two hammers splayed apart, never crossed (`hammers` motif replaced).
- Nine crests that only had a star now have real themes: Alavés raven, Eibar anvil, Real Betis olive, RB Leipzig linden, Atalanta apple, Empoli flask, Sassuolo tile, Montpellier sun, Rennes triskell.
- Four of these are toned down (flat, one colour, small): Sassuolo, Montpellier, Empoli, Atalanta.
- Juventus keeps its star by owner choice (not touched).

Then, in `f1cfff4`, the two FAIL rows from the first pass were fixed: the West Ham hammer heads no longer touch, and the Atalanta apple is now lighter than the raven. These two crests now deliberately differ from the owner-gate target sheet.

## 2. Per-crest verdicts (14)
Sheet: `qa/crest-v1/OWNER_GATE_VERIFY_SHEET.png`, regenerated at `f1cfff4` (live render at 96/42/24 px, 360 px phone row at the app's 42x48 crest size, target sheet embedded below). West Ham and Atalanta have an orange border and the label "changed after owner-gate target". Motif area = filled area in viewBox units² (motif rendered alone at 4x, alpha > 50%, divided by 16). Gap = empty columns between the left and right motif halves, minimum over all rows, at 4x, divided by 4.

| Crest | Direction | Verdict | Evidence |
|---|---|---|---|
| Chelsea | lion head, profile | PASS | gold profile head facing right, mane behind, no body; unchanged, matches target at all sizes |
| Middlesbrough | lion head, profile | PASS | white profile head on red roundel; unchanged, matches target |
| Bayer Leverkusen | lion head, profile | PASS | white profile head on black/red split; unchanged, matches target |
| Lyon | lion head, profile | PASS | red profile head on white/blue; unchanged, matches target |
| West Ham United | two hammers, splayed apart | PASS (fixed) | gap between heads: before 0 (touching at x=60, 12 rows at 4x); after 7.75 units = 6.5% of 120 (closest at y≈56.75), 0 rows touch the centre line. Handles still apart, not crossed; motif bbox x 17–102.75, inside the roundel. Reads as two separate hammers at 96, 42 and 24 px |
| Alavés | raven | PASS | navy raven, wings spread, on blue/white stripes; unchanged, matches target |
| Eibar | anvil | PASS | gold anvil on blue/red roundel; unchanged, reads as anvil at 24 px |
| Real Betis | olive branch | PASS | olive branch with leaves and two olives on green/white stripes; unchanged |
| RB Leipzig | linden leaf | PASS | red linden leaf with veins and stem on white shield; unchanged |
| Atalanta | apple, toned down | PASS (fixed) | flat, one colour (gold), no gradient. Area: before 1935, after 1120 = 71.6% of raven (1565), above sun (991). Reads as an apple (body, stem, leaf) at 42 px; still visible at 24 px |
| Empoli | flask, toned down | PASS | one colour (white), no gradient, area 1353 (< raven 1565, < lion 4543); unchanged |
| Sassuolo | tile, toned down | PASS | one colour + inner square only, no gradient, area 1020; unchanged |
| Montpellier | sun, toned down | PASS | one colour (white), no gradient, area 991; unchanged |
| Rennes | triskell | PASS | white triskell in a ring on black/red shield; unchanged |

Motif areas recomputed at `f1cfff4` (same method): raven 1565, lion 4543, flask 1353, tile 1020, sun 991, apple 1120 (was 1935). All unchanged values reproduce the first pass exactly.

Note: every crest SVG (all 98) carries the shared frame gradients (gold rim and sheen, `visualIdentity.js:347-348`); the motifs above use no gradient.

## 3. Contract results (at `f1cfff4`)
| Command | Exit | Key output |
|---|---|---|
| `node tests/contracts/crest-v1-identity-contracts.cjs` | 0 | PASS: 98 recipes, 98 unique crests, 5 league marks, 28 ids unique, 8 hostile names fall back |
| `node tests/contracts/static-app-release-contracts.cjs` | 0 | PASS v1.9.1/1.9.1-r46; startup 162545/37457 (no budget issue) |
| `npm run test:contracts` | 0 | POS10 selected deterministic census 94/94 PASS |
| Playwright `file://` load: `CREST_REVIEW.html`, `CREST_REVIEW_STANDALONE.html`, both with `?strip=1` | n/a | each: 98 club cards, 5 league cards, 0 console errors, 0 pageerror; strip view 98 strips |
| 14 crest SVGs | n/a | all start with `<svg`; no `<text`, `<image`, `undefined`, or club name |
| All 98 crest SVGs | n/a | 0 with `<image`, `data:` or external `href` |
| Standalone sync (2nd `<script>` block, wrapping newlines stripped, vs `js/visualIdentity.js`) | diff empty | identical |
| Raster files with "crest" in path | n/a | `qa/crest-v1/OWNER_GATE_VERIFY_SHEET.png`, `visual-assets/crests/qa/*` (5: `owner-gate-rev-14`, `phone-360x640`, `phone-375x553`, `review-1280-full`, `small-size-strip-24-42-96`) and `visual-assets/crests/reference/*` (2). No new raster files |

Not regenerated (per brief): the older QA shots in `visual-assets/crests/qa/` still show the pre-fix West Ham and Atalanta.

## 4. Byte-identical check vs `997f3f3`
Script: parse `CLUB_CREST_RECIPES` and `CREST_MOTIFS` from `git show 997f3f3:js/visualIdentity.js` and the working file (one entry per key) and list keys whose text differs; compare `LEAGUE_MARK_RECIPES` and `LEAGUE_FLAGS` as whole blocks. Output:

```
CLUB_CREST_RECIPES: old=98 new=98 differ=0 []
CREST_MOTIFS: old=69 new=69 differ=2 ['hammers', 'apple']
LEAGUE_MARK_RECIPES: identical=True
LEAGUE_FLAGS: identical=True
```

All 98 recipes are identical, including West Ham United and Atalanta, and Milan, Monaco, Barcelona and Juventus. `git diff 997f3f3 f1cfff4 -- js/visualIdentity.js` is 2 lines changed (the two motif lines).

## 5. Head
- Crest code last changed at `f1cfff4cc79278ac1f93cd4bff58700eadd58cf9` (`f1cfff4`). This file and the regenerated sheet are committed together as the final commit on top of it, so the SHA named below is the code-fix commit: a commit cannot contain its own SHA, and the final commit changes no crest code.
- Sheet: `qa/crest-v1/OWNER_GATE_VERIFY_SHEET.png`.

## 6. Larger defects (noted only, not fixed)
- None open. The West Ham hammer contact and the Atalanta apple weight from the first pass are fixed in `f1cfff4` (see section 2).
- New: West Ham and Atalanta now differ from `CREST_V1_OWNER_GATE_TARGETS.png` on purpose (hammers further apart, apple smaller). Nik's final look should confirm these two against the sheet.
- The older QA shots in `visual-assets/crests/qa/` were not regenerated and show the pre-fix versions of these two crests.

## 7. Question
"OK to freeze ACCEPTED_CREST_SHA = f1cfff4 after Nik's final look?"

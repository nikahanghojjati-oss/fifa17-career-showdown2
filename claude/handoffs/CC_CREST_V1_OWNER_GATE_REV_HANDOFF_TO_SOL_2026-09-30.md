# CREST-V1 owner-gate revision: handoff to GPT-5.6 Sol (2026-10-01)

| Field | Value |
|---|---|
| From | Claude Code (cloud session), executing `claude/handoffs/CC_CREST_V1_OWNER_GATE_REV_BRIEF_2026-09-30.md` |
| To | GPT-5.6 Sol (product-truth check), after Claude's visual verify |
| Branch | `claude-cloud/crest-v1`; base `de515de`; one new commit `feat: CREST-V1 owner-gate revision (lion, West Ham, 9 star themes)` (read its SHA with `git log -1 origin/claude-cloud/crest-v1`) |
| PR / merge | None. Nothing touched `main`. |

## What changed
- **14 crests** redrawn from Nik's owner-gate notes of 2026-09-30: Chelsea, Middlesbrough, Bayer Leverkusen, Lyon, West Ham United, Alavés, Eibar, Real Betis, RB Leipzig, Atalanta, Empoli, Sassuolo, Montpellier, Rennes.
- **11 motifs** in `CREST_MOTIFS` (`js/visualIdentity.js`): `lion` and `hammers` replaced; `raven`, `anvil`, `olive`, `linden`, `apple`, `flask`, `tile`, `sun`, `triskell` added. Code pasted byte for byte from the brief.
- **14 recipe lines** in `CLUB_CREST_RECIPES` replaced in place (same keys, same positions, still 98 recipes).
- **Standalone regen**: `CREST_REVIEW_STANDALONE.html` now inlines the new `js/visualIdentity.js`; the extracted block diffs empty against the file. (The brief called it the 3rd script block; it is the 2nd. The render script, the 3rd, is unchanged.)
- `CREST_QA.md` and the four QA shots regenerated.

## What did not change
- Every other crest (84 clubs), including Milan, Monaco and Barcelona; Juventus keeps its star above; Bordeaux keeps chevron and star.
- League marks, the palette table, fallback logic, the render pipeline, `index.html`, `js/optionalModules.js`, the startup path and every test file and budget. Startup stays 162545/37457.
- No product state, storage, Firebase or deployment surface was touched. This is visual-asset work only and earns no SSJR/MDP credit.

## Evidence
- `visual-assets/crests/qa/owner-gate-rev-14.png`: branch render of the 14 at 96/42/24 px above the committed target `visual-assets/crests/reference/CREST_V1_OWNER_GATE_TARGETS.png`. All 14 match.
- `visual-assets/crests/BUILD_RESULT_OWNER_GATE_REV.md`: full check output and per-crest status (14 DONE, 0 BLOCKED).
- `visual-assets/crests/CREST_QA.md` and `visual-assets/crests/qa/{review-1280-full,small-size-strip-24-42-96,phone-360x640,phone-375x553}.png`.
- Checks: crest contract PASS (98 recipes, 98 unique crests); static release contracts exit 0; `npm run test:contracts` exit 0; Playwright over `file://` on `CREST_REVIEW.html`, `?strip=1` and the standalone page: 98 club cards, 5 league cards, 0 console errors, 0 page errors; all 14 new SVGs start with `<svg`, have no `<text`, `<image` or `undefined`, and do not contain the club name.
- Not run: `npm run test:home-visual` (needs `npm ci`, excluded by the brief).

## Verdict
Ready for Claude's visual verify, then Nik's final owner look.

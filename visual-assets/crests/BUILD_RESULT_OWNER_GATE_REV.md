# CREST-V1 owner-gate revision: build result (2026-10-01)

| Field | Value |
|---|---|
| Brief | `claude/handoffs/CC_CREST_V1_OWNER_GATE_REV_BRIEF_2026-09-30.md` |
| Branch | `claude-cloud/crest-v1` |
| Started from | `de515de` (brief commit; parent `21ff51a`). No SOURCE_DRIFT: `origin/claude-cloud/crest-v1` was `de515de` at start. |
| My commit | The single commit `feat: CREST-V1 owner-gate revision (lion, West Ham, 9 star themes)` whose parent is `de515de`. A commit cannot contain its own SHA; read it with `git log -1 --format=%H origin/claude-cloud/crest-v1`. |

## Changed files
- `js/visualIdentity.js`: `lion` and `hammers` motifs replaced; 9 motifs added (`raven`, `anvil`, `olive`, `linden`, `apple`, `flask`, `tile`, `sun`, `triskell`) after `thistle` (comma added); 14 recipe lines replaced in place. Pasted byte for byte from the brief's code blocks by script (no hand edits). Diff: 26 insertions, 24 deletions (the old multi-line `lion` was 8 lines).
- `visual-assets/crests/CREST_REVIEW_STANDALONE.html`: only the inlined `visualIdentity.js` block replaced.
- `visual-assets/crests/CREST_QA.md` and the four shots in `visual-assets/crests/qa/` (regenerated).
- New: this file, `visual-assets/crests/qa/owner-gate-rev-14.png`, `claude/handoffs/CC_CREST_V1_OWNER_GATE_REV_HANDOFF_TO_SOL_2026-09-30.md`.

## Note on the standalone block number
The brief says the 2nd `<script>` block inlines `data/clubs.js` and the 3rd inlines `js/visualIdentity.js`. In the file the order is: 1st `data/clubs.js` (lines 26-53), 2nd `js/visualIdentity.js`, 3rd the page render script. I replaced the block that actually inlines `js/visualIdentity.js` (the 2nd), keeping its leading and trailing newline, and left the render script untouched. Before the change the block equalled `git show de515de:js/visualIdentity.js` wrapped in one newline each side.

## Check output
Standalone regen proof (extract inlined block, strip the wrapping newlines, diff against the file):
```
$ diff newblock.js js/visualIdentity.js && echo "DIFF EMPTY"
DIFF EMPTY
```

`node tests/contracts/crest-v1-identity-contracts.cjs`
```
PASS CREST-V1 identity contracts: 98 recipes, 98 unique crests, 5 league marks, 28 ids unique on shared page, 8 hostile/edge unknown names fall back cleanly, league Keeps/Changes in both review pages.
exit 0
```

`node tests/contracts/static-app-release-contracts.cjs` (startup numbers unchanged from the previous pass; no budget touched)
```
PASS Dynamic static release contracts v1.9.1/1.9.1-r46; startup 162545/37457.
exit 0
```

`npm run test:contracts`: exit 0; 84 output lines start with `PASS`. Lines mentioning errors are logged by deliberate negative-path storage tests and are present on the base too.

Scratch Playwright run (global `playwright@1.56.1`, `/opt/pw-browsers/chromium`, `file://`; script not committed):
```
CREST_REVIEW.html 1280x900: clubs=98 leagues=5 keeps+changes=103 undefinedText=false errors=0 shot=review-1280-full.png 1280x4718
CREST_REVIEW.html?strip=1 1280x900: clubs=98 leagues=5 keeps+changes=103 undefinedText=false errors=0
  strip shot 1248x2353
CREST_REVIEW.html 360x640: clubs=98 leagues=5 keeps+changes=103 undefinedText=false errors=0 shot=phone-360x640.png 360x640
CREST_REVIEW.html 375x553: clubs=98 leagues=5 keeps+changes=103 undefinedText=false errors=0 shot=phone-375x553.png 375x553
CREST_REVIEW_STANDALONE.html 1280x900: clubs=98 leagues=5 keeps+changes=103 undefinedText=false errors=0
STANDALONE alone in empty folder: clubs=98 leagues=5 errors=0
CREST_REVIEW_STANDALONE.html?strip=1 1280x900: clubs=98 leagues=5 keeps+changes=103 undefinedText=false errors=0
SVG Chelsea: OK (1897 chars)
SVG Middlesbrough: OK (1759 chars)
SVG Bayer Leverkusen: OK (1822 chars)
SVG Lyon: OK (1957 chars)
SVG West Ham United: OK (1645 chars)
SVG Alavés: OK (1784 chars)
SVG Eibar: OK (1388 chars)
SVG Real Betis: OK (2754 chars)
SVG RB Leipzig: OK (1551 chars)
SVG Atalanta: OK (1571 chars)
SVG Empoli: OK (1295 chars)
SVG Sassuolo: OK (1619 chars)
SVG Montpellier: OK (1987 chars)
SVG Rennes: OK (1840 chars)
```
"SVG … OK" means: starts with `<svg`, contains no `<text`, `<image` or `undefined`, and does not contain the club name.

## Visual match
`qa/owner-gate-rev-14.png` shows the 14 crests rendered from the branch at 96, 42 and 24 px above the committed target sheet. Each one matches its target (shape, field, motif, colours, small-size read). No paste fix was needed.

## Per-crest status
| Club | Motif | Status |
|---|---|---|
| Chelsea | lion (profile head) | DONE |
| Middlesbrough | lion | DONE |
| Bayer Leverkusen | lion | DONE |
| Lyon | lion | DONE |
| West Ham United | hammers (splayed) | DONE |
| Alavés | raven | DONE |
| Eibar | anvil | DONE |
| Real Betis | olive | DONE |
| RB Leipzig | linden | DONE |
| Atalanta | apple | DONE |
| Empoli | flask | DONE |
| Sassuolo | tile | DONE |
| Montpellier | sun | DONE |
| Rennes | triskell | DONE |

Not run: `npm run test:home-visual` (needs `npm ci`, excluded by the brief).

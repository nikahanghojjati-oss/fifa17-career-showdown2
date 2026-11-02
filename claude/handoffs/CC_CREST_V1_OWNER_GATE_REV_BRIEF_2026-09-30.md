# CC CREST-V1 OWNER-GATE REVISION BRIEF (2026-09-30)

| Field | Value |
|---|---|
| Surface | NEW Claude Code session (claude.ai/code), Nik's cloud credit |
| Repo | nikahanghojjati-oss/fifa17-career-showdown2 |
| Branch | `claude-cloud/crest-v1` (start and commit here; expected head `21ff51a` plus the commit that adds this brief) |
| Model / effort | Opus 5.5 / Medium (exact-delta revision) |
| STOP_BUDGET | 30 min / $6. At 80%, stop adding scope and commit. At 100%, stop. |
| Author | Claude (visual lead), from Nik's owner-gate notes of 2026-09-30 |

## Rules
- Write to `claude-cloud/crest-v1` only. No PR, merge, cherry-pick, rebase or force-push. Never touch `main`.
- Only change the files listed under "Files you may change". Make no heavy installs (no `npm ci`); global `playwright@1.56.1` and `/opt/pw-browsers/chromium` are enough.
- If `git log -1 origin/claude-cloud/crest-v1` shows a commit newer than this brief's commit that is not yours, stop and report SOURCE_DRIFT.
- Do not redesign anything beyond the 14 crests below. Milan, Monaco, Barcelona and every other crest stay exactly as they are (Nik approved them).

## Target
The visual target is `visual-assets/crests/reference/CREST_V1_OWNER_GATE_TARGETS.png`, committed with this brief. It shows the live crest next to the target at 96, 42 and 24 px. The code below reproduces it exactly, so paste it; do not redraw.

## Files you may change
1. `js/visualIdentity.js`
2. `visual-assets/crests/CREST_REVIEW_STANDALONE.html` (regenerated only, see step 3)
3. `visual-assets/crests/CREST_QA.md` and the four shots in `visual-assets/crests/qa/`
4. New files: `visual-assets/crests/BUILD_RESULT_OWNER_GATE_REV.md`, `visual-assets/crests/qa/owner-gate-rev-14.png`, `claude/handoffs/CC_CREST_V1_OWNER_GATE_REV_HANDOFF_TO_SOL_2026-09-30.md`

## Step 1: motifs in `js/visualIdentity.js`
In `const CREST_MOTIFS = Object.freeze({ ... })`:
- **Replace** the whole existing `lion:` entry and the whole existing `hammers:` entry with the new versions below. The names stay the same.
- **Add** the other nine entries (`raven`, `anvil`, `olive`, `linden`, `apple`, `flask`, `tile`, `sun`, `triskell`) inside the same object, just before the closing `});`. The current last entry, `thistle:`, has no trailing comma, so add one to it first.
- Keep the file's 4-space indent. Remove nothing else.

```js
    lion: (c, d) => `<path d="M64 28Q44 24 34 38L22 36L28 48L14 52L26 60L12 68L26 74L16 86L32 86L26 100L42 94L42 108L56 98Q66 106 76 98L70 60Z" fill="${c}"/><path d="M60 40Q80 34 90 50L101 60Q106 67 99 71H94Q97 79 88 83H80Q76 92 66 92Q52 88 50 70Q50 50 60 40Z" fill="${c}" stroke="${d}" stroke-width="3.5" stroke-linejoin="round"/><path d="M60 41Q64 31 72 37Q68 40 66 44Z" fill="${c}" stroke="${d}" stroke-width="2"/><path d="M73 55Q79 50 85 55Q79 58 73 55Z" fill="${d}"/><path d="M97 58L104 64L98 67Z" fill="${d}"/><path d="M94 72Q88 74 82 72" stroke="${d}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    raven: (c, d) => `<g fill="${c}"><path d="M14 62Q34 40 56 58L60 52L66 58Q88 40 108 60Q92 58 80 66Q70 72 66 78L72 96L62 90L56 98L54 78Q48 70 38 66Q26 62 14 62Z"/><path d="M60 52Q58 44 64 42L72 44L64 48Z"/></g><circle cx="64" cy="46" r="1.6" fill="${d}"/>`,
    anvil: c => `<g fill="${c}"><path d="M20 52H92Q102 52 106 44Q108 60 92 64H84Q80 72 76 76H86V88H34V76H44Q40 72 36 64H26Q18 60 20 52Z"/><rect x="30" y="92" width="60" height="10" rx="2"/></g><path d="M20 52H92" stroke="#fff4c4" stroke-width="2" opacity=".6"/>`,
    olive: (c, d) => { const L = [[46, 96, -40], [54, 84, -35], [62, 72, -30], [70, 60, -25], [78, 48, -20]]; let s = `<path d="M38 112Q60 80 84 34" fill="none" stroke="#6b4a1e" stroke-width="4" stroke-linecap="round"/>`; L.forEach(([x, y, a]) => { s += `<ellipse cx="${x - 10}" cy="${y + 2}" rx="11" ry="4.6" fill="${c}" stroke="${d}" stroke-width="1.2" transform="rotate(${a + 10} ${x - 10} ${y + 2})"/><ellipse cx="${x + 9}" cy="${y + 4}" rx="11" ry="4.6" fill="${c}" stroke="${d}" stroke-width="1.2" transform="rotate(${a - 30} ${x + 9} ${y + 4})"/>`; }); return s + `<circle cx="58" cy="94" r="5" fill="${d}"/><circle cx="72" cy="70" r="4.5" fill="${d}"/>`; },
    linden: (c, d) => `<path d="M60 26Q70 40 84 46Q98 54 94 72Q90 90 72 94Q64 94 60 88Q56 94 48 94Q30 90 26 72Q22 54 36 46Q50 40 60 26Z" fill="${c}"/><path d="M60 84V40M60 70L40 58M60 70L80 58M60 56L46 48M60 56L74 48" stroke="${d}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M60 88V112" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
    apple: c => `<g fill="${c}"><path d="M60 58Q72 50 81 59Q88 70 82 86Q76 100 65 98Q62 97 60 98Q58 97 55 98Q44 100 38 86Q32 70 39 59Q48 50 60 58Z"/><path d="M59 58Q59 50 62 46L64 47Q61 51 61 58Z"/><path d="M63 50Q71 41 79 45Q71 53 63 50Z"/></g>`,
    flask: c => `<path d="M55 38H65V56Q80 62 80 76Q80 90 60 90Q40 90 40 76Q40 62 55 56Z" fill="${c}"/><rect x="52" y="34" width="16" height="5" rx="2" fill="${c}"/>`,
    tile: (c, d) => `<g transform="rotate(45 60 70)"><rect x="44" y="54" width="32" height="32" rx="2" fill="${c}"/><rect x="53" y="63" width="14" height="14" fill="${d}"/></g>`,
    sun: c => { let s = `<g fill="${c}">`; for(let i = 0; i < 8; i += 1){ s += `<rect x="57.5" y="38" width="5" height="10" rx="2" transform="rotate(${i * 45} 60 70)"/>`; } return s + `<circle cx="60" cy="70" r="14"/></g>`; },
    triskell: (c, d) => `<circle cx="60" cy="70" r="37" fill="none" stroke="${d}" stroke-width="3"/>` + [0, 120, 240].map(a => `<path d="M60 70C60 54 70 42 82 44C94 46 96 62 86 66C78 69 74 61 80 57" transform="rotate(${a} 60 70)" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/>`).join("") + `<circle cx="60" cy="70" r="6" fill="${c}"/>`,
    hammers: c => { const h = `<rect x="-3.5" y="-2" width="7" height="46" rx="2.5" fill="${c}"/><path d="M-16 -14H12Q18 -14 18 -8V2Q18 6 14 6H-16Q-19 6 -19 2V-10Q-19 -14 -16 -14Z" fill="${c}"/>`; return `<g transform="translate(42 58) rotate(-14)">${h}</g><g transform="translate(78 58) rotate(14) scale(-1 1)">${h}</g>`; },
```

## Step 2: recipes in `CLUB_CREST_RECIPES`
Replace the existing line for each of these 14 clubs, in place (same key, same position), with exactly:

```js
    "Chelsea": crestRecipe("heater", "cap:s", "lion:a:p", "royal blue, white, gold; a lion", "shield not roundel, lion head in profile, no staff, roses or balls"),
    "Middlesbrough": crestRecipe("roundel", "foot:s", "lion:s:p", "red, white; a lion", "roundel not shield, lion head in profile not full lion, no text"),
    "Bayer Leverkusen": crestRecipe("hex", "halvesL:s", "lion:w:s", "red and black; a lion", "hex not roundel, lion head in profile not full lion, no cross, no text"),
    "Lyon": crestRecipe("heater", "field:w cap:s foot:s", "lion:a:w", "white, blue, red; a lion", "shield not roundel, lion head in profile, no monogram"),
    "West Ham United": crestRecipe("roundel", "foot:s rule:a", "hammers:a", "claret, sky blue, gold; hammers", "roundel not shield, two hammers splayed apart, never crossed, no castle"),
    "Alavés": crestRecipe("tall", "stripes:s foot:k", "raven:#0e1a2b:g", "blue and white stripes; a raven (Vitoria arms)", "tall shield, one raven in flight, no castle, tower, tree or text"),
    "Eibar": crestRecipe("roundel", "halves:s", "anvil:g", "blue and garnet halves; an anvil (the Armeros)", "roundel not shield, anvil not rifles, no text"),
    "Real Betis": crestRecipe("roundel", "stripes:s", "olive:#1f5c33:#f3d470", "green and white stripes; an olive branch", "roundel not shield, no crown, no monogram"),
    "RB Leipzig": crestRecipe("hex", "field:w base:a", "linden:s:w", "white, red, blue; a linden leaf (the city name)", "no bulls, no ball, no sponsor mark"),
    "Atalanta": crestRecipe("heater", "wide:s", "apple:g", "blue and black stripes; a golden apple (the myth)", "shield not roundel, no figure or head, no text"),
    "Empoli": crestRecipe("roundel", "foot:s", "flask:s", "blue and white; a glass flask (glass-making)", "roundel not shield, no lettering, no chevron"),
    "Sassuolo": crestRecipe("heater", "stripes:s", "tile:w:p", "green and black stripes; a ceramic tile", "shield not roundel, no text"),
    "Montpellier": crestRecipe("heater", "halves:s", "sun:w", "blue and orange halves; a sun", "shield not roundel, no figure, no text"),
    "Rennes": crestRecipe("hex", "halvesL:s", "triskell:w:g", "red and black halves; a Breton triskell", "hex not shield, spiral not ermine, no text"),
```

Result: still 98 recipes and the same keys. No star-only crests remain except Juventus (star above, kept by owner choice). Bordeaux keeps its chevron and star unchanged.

## Step 3: regenerate the standalone page
`CREST_REVIEW_STANDALONE.html` inlines `data/clubs.js` (2nd `<script>` block) and `js/visualIdentity.js` (3rd `<script>` block). Replace the 3rd block's content with the new `js/visualIdentity.js`, byte for byte. Change nothing else in that page. Prove it: extract the block and `diff` it against the file; the diff must be empty.

## Step 4: checks (all must pass; paste output into BUILD_RESULT)
- `node tests/contracts/crest-v1-identity-contracts.cjs` → one PASS line, 98 recipes, 98 unique crests.
- `node tests/contracts/static-app-release-contracts.cjs` → exit 0. If it fails only on a startup-size budget, stop and report the numbers; do not edit any budget.
- `npm run test:contracts` → exit 0.
- Scratch Playwright check of `CREST_REVIEW.html`, `CREST_REVIEW_STANDALONE.html` and `?strip=1` over `file://`: 98 club cards and 5 league cards, 0 console errors, 0 `pageerror`.
- Every one of the 14 new crest SVGs: starts with `<svg`, has no `<text`, `<image` or `undefined`, and does not contain the club name.

## Step 5: evidence
- Render the 14 revised crests at 96, 42 and 24 px, beside the committed target, into `qa/owner-gate-rev-14.png`. They must match the target. If any differs, fix the paste, not the drawing.
- Regenerate the four existing QA shots with the same method as before (see `CREST_QA.md`) and update `CREST_QA.md` numbers and heads.

## Step 6: result files and commit
- `BUILD_RESULT_OWNER_GATE_REV.md`: the head you started from, your commit SHA, the changed files, the check output, and a one-line status per crest (DONE / BLOCKED).
- The handoff to GPT-5.6 Sol: what changed (14 crests, 11 motifs, the standalone regen), what did not change, the evidence paths, and the verdict "ready for Claude's visual verify, then Nik's final owner look".
- Commit once: `feat: CREST-V1 owner-gate revision (lion, West Ham, 9 star themes)`, then `git push -u origin claude-cloud/crest-v1`.

## What comes back
Nik sends Claude the session link. Claude verifies the branch against the target sheet (Opus 5.5 High, project thread), then Sol does the product-truth check, then Nik takes a final look.

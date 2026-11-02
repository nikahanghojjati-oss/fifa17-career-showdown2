# CC CREST-V1 OWNER-GATE VERIFY BRIEF (2026-10-01)

| Field | Value |
|---|---|
| Surface | NEW Claude Code session (claude.ai/code), Nik's cloud credit |
| Repo | nikahanghojjati-oss/fifa17-career-showdown2 |
| Branch | `claude-cloud/crest-v1` (work and commit here only) |
| Revision head under test | `c3e1834` (`feat: CREST-V1 owner-gate revision (lion, West Ham, 9 star themes)`, parent `de515de`). The verify brief's own commit sits on top of it. |
| Model / effort | Opus 5.5 / Medium |
| STOP_BUDGET | 20 min / $4. At 80%, stop adding scope and commit what you have. At 100%, stop. |
| PRIORITY_ORDER | 1) contract and diff checks (a, c-untouched, c-vector); 2) contact sheet (b); 3) per-crest visual verdicts (c); 4) small local fixes (d); 5) Sol handoff (e); 6) commit and push (f). If time runs short, drop the phone row before dropping any check. |

## Rules
- Write to `claude-cloud/crest-v1` only. No PR, merge, rebase, cherry-pick or force-push. Never touch `main`.
- Clone is shallow-prone: run `git fetch --unshallow origin` if `git merge-base --is-ancestor de515de HEAD` fails.
- If `git log -1 origin/claude-cloud/crest-v1` is newer than this brief's commit and not by this brief, stop and report SOURCE_DRIFT.
- No `npm ci`, no `playwright install`. Chromium is pre-installed at `/opt/pw-browsers` (use global `playwright` with that executable; set `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`).
- Do not redesign. Fix only small, local defects (a wrong paste, a stray character, a stale number in a doc). Anything larger is noted in the Sol file, not fixed.
- Milan, Monaco, Barcelona and every other crest are Nik-approved and must not change.

## Context
Revision commit `c3e1834` changed `js/visualIdentity.js` (11 motifs: `lion` and `hammers` replaced; `raven`, `anvil`, `olive`, `linden`, `apple`, `flask`, `tile`, `sun`, `triskell` added; 14 recipe lines replaced), regenerated the standalone page, the QA shots and `CREST_QA.md`, and added `BUILD_RESULT_OWNER_GATE_REV.md` and a Sol handoff. The spec was `claude/handoffs/CC_CREST_V1_OWNER_GATE_REV_BRIEF_2026-09-30.md`; the visual target is `visual-assets/crests/reference/CREST_V1_OWNER_GATE_TARGETS.png` (live crest next to target at 96, 42 and 24 px).

The 14 targeted crests (recipe key: new motif):
1. Chelsea: lion head, profile
2. Middlesbrough: lion head, profile
3. Bayer Leverkusen: lion head, profile
4. Lyon: lion head, profile
5. West Ham United: two hammers, splayed apart
6. Alavés: raven
7. Eibar: anvil
8. Real Betis: olive branch
9. RB Leipzig: linden leaf
10. Atalanta: apple
11. Empoli: flask
12. Sassuolo: tile
13. Montpellier: sun
14. Rennes: triskell

## Tasks

### (a) Contracts
Run, from repo root, and keep the output:
- `node tests/contracts/crest-v1-identity-contracts.cjs` (expect one PASS line: 98 recipes, 98 unique crests, 5 league marks).
- Every check the revision brief names in its Step 4: `node tests/contracts/static-app-release-contracts.cjs` (exit 0; if it fails only on a startup-size budget, report the numbers, edit no budget); `npm run test:contracts` (exit 0); a scratch Playwright load of `visual-assets/crests/CREST_REVIEW.html`, `CREST_REVIEW_STANDALONE.html` and the `?strip=1` view over `file://` (98 club cards, 5 league cards, 0 console errors, 0 `pageerror`); for each of the 14 crest SVGs: starts with `<svg`, no `<text`, `<image` or `undefined`, does not contain the club name.
- Standalone sync: extract the inlined `js/visualIdentity.js` block from `CREST_REVIEW_STANDALONE.html` (it is the 2nd `<script>` block; strip the wrapping newlines) and `diff` it against `js/visualIdentity.js`. Must be empty.

### (b) Contact sheet
Render the 14 revised crests with headless Chromium (load `js/visualIdentity.js` in a page, or reuse the crest-render path in `CREST_REVIEW.html`). Build `qa/crest-v1/OWNER_GATE_VERIFY_SHEET.png` (create the folder): the revised crests side by side with the target sheet `CREST_V1_OWNER_GATE_TARGETS.png` (embed the target PNG beside or under the live render, labelled), at 96, 42 and 24 px, plus one 360px-wide phone-size row of all 14 at the size the app uses on phones. Label each cell with the club name. Open the PNG and look at it before judging.

### (c) Check each of the 14 against Nik's direction
Record PASS or FAIL with one line of evidence for each:
- Sassuolo tile, Montpellier sun, Empoli flask and Atalanta apple are toned down: flat, one colour, small (no gradient, no second colour except the tile's inner square, clearly lighter in weight than the lion and raven).
- West Ham has two hammers splayed apart, never crossed (heads apart, handles do not intersect).
- Chelsea, Middlesbrough, Leverkusen and Lyon have a profile lion head (one head in profile, no body, mane behind the face).
- New themes read as intended: Alavés raven, Eibar anvil, Betis olive, Leipzig linden, Rennes triskell.
- Untouched crests are byte-identical to `de515de`: compare every `CLUB_CREST_RECIPES` line and every other `CREST_MOTIFS` entry between `git show de515de:js/visualIdentity.js` and the working file (script it: parse both, list keys whose text differs). The only differing recipe keys must be the 14 above; the only differing motif keys must be `lion`, `hammers`, `thistle` (trailing comma only) and the nine added ones. Also confirm the league-mark recipes are unchanged.
- Production crest SVGs are self-contained vectors: generated SVG output has no `<image`, no `data:` and no external `href`; raster files (`.png`, `.jpg`, `.webp`) exist only under `visual-assets/crests/reference/` or a `qa/` folder (`visual-assets/crests/qa/` and the new top-level `qa/`). Check with `git ls-files | grep -Ei '\.(png|jpe?g|webp|gif)$' | grep -i crest`.

### (d) Fixes
If a small, local defect turns up, fix it, rerun (a) and the affected (c) checks, and make it its own commit (`fix: CREST-V1 owner-gate verify - <what>`). Anything larger (a crest that fails the direction, a redesign, a budget issue) is only noted in the Sol file with the crest name and the symptom.

### (e) File for GPT-5.6 Sol
Write ONE file: `claude/handoffs/FOR_SOL_5.6_CREST_V1_OWNER_GATE_REVIEW_2026-10-01.md`. Short and plain. Contents:
1. What changed and why: Nik's owner-gate picks (lion head in profile for four clubs, West Ham hammers splayed, nine star-only crests given real themes, four of them toned down, Juventus star kept by owner choice).
2. Per-crest PASS/FAIL table for the 14 (crest, direction, verdict, evidence).
3. Contract results (the command, exit code, key numbers).
4. Byte-identical check result (counts of recipes and motifs compared, differing keys).
5. Head SHA (the final pushed commit), and the path `qa/crest-v1/OWNER_GATE_VERIFY_SHEET.png`.
6. Any larger defects found, noted only.
7. The question, verbatim: "OK to freeze ACCEPTED_CREST_SHA = <sha> after Nik's final look?" with `<sha>` filled in with the head SHA.
A commit cannot contain its own SHA: if the file is committed last, use the SHA of the commit just before it and say so; if a fix commit comes after, update the file in a final commit and name the SHA of the last code change.

### (f) Commit and push
Stage only the files you wrote (the sheet, the Sol file, any fix files); never `git add .` or `-A`. Commit, then `git push -u origin claude-cloud/crest-v1`. If the push is rejected, fetch and rebase your own commits only; never force-push. End by printing the final SHA (`git rev-parse HEAD`).

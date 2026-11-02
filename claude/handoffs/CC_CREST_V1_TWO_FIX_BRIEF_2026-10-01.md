# CC CREST-V1 TWO-FIX BRIEF (2026-10-01)

| Field | Value |
|---|---|
| Surface | NEW Claude Code session (claude.ai/code), Nik's cloud credit |
| Repo | nikahanghojjati-oss/fifa17-career-showdown2 |
| Branch | `claude-cloud/crest-v1` (work and commit here only). Expected start head: `997f3f3` (verify sheet and Sol review) or a later brief-only commit on top of it. |
| Model / effort | Opus 5.5 / Medium |
| STOP_BUDGET | 15 min / $3. At 80%, stop adding scope and commit what you have. At 100%, stop. |
| PRIORITY_ORDER | 1) the two geometry fixes (1, 2); 2) byte-identical diff vs `997f3f3` (3); 3) contracts and verify checks (4a); 4) regenerate the sheet (4b); 5) update the Sol file (5); 6) commit and push (6). If time runs short, drop the phone row before dropping any check. |

## Rules
- Write to `claude-cloud/crest-v1` only. No PR, merge, rebase, cherry-pick or force-push. Never touch `main`.
- Run `git fetch origin`. If `997f3f3` is not an ancestor of `origin/claude-cloud/crest-v1`, or the remote has a newer commit that is not a brief-only commit, stop and report SOURCE_DRIFT.
- No `npm ci`, no `playwright install`. Chromium is pre-installed at `/opt/pw-browsers` (global `playwright`, set `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`).
- Do not redesign. Change only the two things below. Milan, Monaco, Barcelona, Juventus and every other crest are Nik-approved and must not change.

## Context
The owner-gate review (`claude/handoffs/FOR_SOL_5.6_CREST_V1_OWNER_GATE_REVIEW_2026-10-01.md`, built per `claude/handoffs/CC_CREST_V1_OWNER_GATE_VERIFY_BRIEF_2026-10-01.md`) passed 12 of 14 crests. Two FAIL rows remain. Both are geometry edits inside `js/visualIdentity.js` (`CREST_MOTIFS`). Read the review file first, sections 2 and 6.

- West Ham United (`hammers` motif): the two heads touch at the centre line (x=60, y about 57; 2 overlapping px at 4x render). The review suggested translating the groups to `translate(40.5 58)` / `translate(79.5 58)`; treat that as a starting point only.
- Atalanta (`apple` motif): flat and one colour already, but its filled area is 1935 viewBox units² against the raven's 1565, so it is heavier than the raven.

## Tasks

### 1. West Ham: separate the hammers
Move the two splayed hammers apart so the heads have a clear gap at the centre line of at least about 6% of crest width (viewBox is 120 wide, so a gap of about 7 or more units between the inner edges of the two heads at their closest point). Keep them splayed apart, never crossed, handles not intersecting, still inside the shield and readable at 42 and 24 px. Adjust translate and, only if needed, a small rotation or scale so nothing clips the frame. Measure the gap (render the motif alone at 4x, find the empty columns between the left and right head at the heads' rows; report the gap in units and as % of 120).

### 2. Atalanta: lighter apple
Shrink and simplify the `apple` motif: flat, one colour, no gradient, no highlight or second shape beyond the stem or leaf if it is part of the same single colour. Target filled area at most about 75% of the raven's (raven is 1565, so at most about 1175 units²). Measure the same way the verify step did: render the motif alone (the same crest-render path as the sheet, motif only, no frame), count pixels with alpha > 50%, convert to viewBox units². Report before (1935) and after, and the ratio to the raven. It must still read as an apple at 42 px and not fall below the area of Montpellier's sun (991) by so much that it vanishes at 24 px; aim for about 1000 to 1175.

### 3. Change nothing else
- The only recipe lines that may differ from `997f3f3` are none: the recipe lines should not change at all (the fixes are in the `hammers` and `apple` motifs). Prove it by script: parse `CLUB_CREST_RECIPES` and `CREST_MOTIFS` from `git show 997f3f3:js/visualIdentity.js` and the working file; list keys whose text differs. Expected: recipes differ for 0 keys (all 98 identical, in particular the other 96 recipes plus West Ham and Atalanta's own recipe lines); motifs differ for exactly `hammers` and `apple`. Also confirm `LEAGUE_MARK_RECIPES` and `LEAGUE_FLAGS` are identical. Paste the output in the Sol file.
- Any other file may change only as a mechanical consequence: the inlined copy of `js/visualIdentity.js` in `visual-assets/crests/CREST_REVIEW_STANDALONE.html` must be resynced (the same sync check as the verify brief: the 2nd `<script>` block must diff empty against `js/visualIdentity.js`), and the sheet and Sol file are rewritten. If regenerating other QA shots would be needed, do not; note it instead.
- `git diff --stat 997f3f3 HEAD` at the end must list only: `js/visualIdentity.js`, the standalone page, `qa/crest-v1/OWNER_GATE_VERIFY_SHEET.png`, the Sol file, and this brief if it is not yet in history.

### 4. Rerun checks and regenerate the sheet
a) From repo root, rerun and keep output:
- `node tests/contracts/crest-v1-identity-contracts.cjs` (expect PASS: 98 recipes, 98 unique crests, 5 league marks).
- Every check from the verify brief (a) and (c): `node tests/contracts/static-app-release-contracts.cjs`; `npm run test:contracts`; Playwright `file://` load of `CREST_REVIEW.html`, `CREST_REVIEW_STANDALONE.html` and both with `?strip=1` (98 club cards, 5 league cards, 0 console errors, 0 pageerror); the 14 crest SVGs start with `<svg`, no `<text`, `<image`, `undefined`, no club name; all 98 SVGs have no `<image`, `data:` or external `href`; standalone sync diff empty; the raster-file check (`git ls-files | grep -Ei '\.(png|jpe?g|webp|gif)$' | grep -i crest`).
- Recompute the motif areas of raven, lion, Empoli flask, Sassuolo tile, Montpellier sun and Atalanta apple with the same method, so the table stays comparable. Existing values: raven 1565, lion 4543, flask 1353, tile 1020, sun 991.
b) Regenerate `qa/crest-v1/OWNER_GATE_VERIFY_SHEET.png` the same way as before (14 crests at 96/42/24 px next to the embedded `CREST_V1_OWNER_GATE_TARGETS.png`, plus the 360 px phone row, club name labels), using headless Chromium from `/opt/pw-browsers`. Open the PNG and look at it. Label the West Ham and Atalanta cells as changed after the owner-gate target, since they now deliberately differ from the target.

### 5. Update the Sol file in place
Edit `claude/handoffs/FOR_SOL_5.6_CREST_V1_OWNER_GATE_REVIEW_2026-10-01.md` (do not create a new file):
- Recheck all 14 rows in section 2 against the new render and re-evidence each (one line each). The two fixed rows show before and after measurements (West Ham gap: 0 before, N units / N% after; Atalanta area: 1935 before, N after, N% of raven) and verdict PASS if met.
- Refresh sections 3 (contract results) and 4 (byte-identical check, now against `997f3f3`, with the exact differing keys) and section 6 (remove the two defects once fixed, list anything new).
- Update the "Revision under test" line, add a fix-commit note, and add the new head SHA in section 5.
- Section 7 question, verbatim, with the SHA filled in: "OK to freeze ACCEPTED_CREST_SHA = <new head sha> after Nik's final look?"
A commit cannot contain its own SHA: commit the code fix first, then update the Sol file naming that code SHA (or the sheet+file commit just before the final one) and say so, in a final commit.

### 6. Commit and push
Stage only the files you changed by name; never `git add .` or `-A`. Commit the code fix (`fix: CREST-V1 West Ham hammer gap, lighter Atalanta apple`) and then the sheet and Sol file. Push with `git push -u origin claude-cloud/crest-v1`. If rejected, fetch and rebase your own commits only; never force-push. End by printing the final SHA (`git rev-parse HEAD`).

# CLAUDE -> SOL HANDOFF - CREST-V1 REPAIR
Repair of gate precheck failures 3, 5, 14 and 20 (implementation, final for Sol re-precheck)

## Header
| Field | Value |
|---|---|
| Task ID | CREST-V1 (repair pass) |
| Role | Claude Code (Visual lead build) |
| Date | 2026-09-30 |
| Source anchor | Live `main` re-resolved with `git ls-remote`: `2de237391e17c7de2c6deb606b102b68ee640212`. SOURCE_DRIFT: no. |
| Branch | `claude-cloud/crest-v1`. Repair started from `7fe0d8e` (repair brief). Reviewed code/page/QA head: `8426d2d` (repair commit). Final branch head: the commit that adds this file. Its only parent is `8426d2d`, and it changes only this file and `CC_CREST_V1_HANDOFF_TO_SOL_2026-09-30.md`. Verify with `git log --oneline -3 origin/claude-cloud/crest-v1`. |
| Write operations | Branch `claude-cloud/crest-v1` only. No PR, merge, cherry-pick or force-push; `main` untouched. |
| Untouched (checked with `git diff --name-only ec39ab4 -- <path>`, all empty) | `data/leagues.js`, `THIRD_PARTY_NOTICES.md`, `index.html`, `service-worker.js`, `js/optionalModules.js`, `tests/support/run-selected-product-contracts.cjs`, `package.json` |
| Verdict status | Checks 5, 14 and 20 repaired; check 3 has evidence under Sol's clarified rule. Ready for Sol's fresh mechanical precheck. |

## Work performed

### Commits in this repair
- `8426d2d` fix: own-property palette/league lookup, league Keeps/Changes, regenerated QA
- (final head) handoff: this file, plus corrections to the original handoff

### Exact files changed in this repair (`7fe0d8e..final head`)
1. `js/visualIdentity.js`: 2 lines changed
2. `tests/contracts/crest-v1-identity-contracts.cjs`
3. `visual-assets/crests/CREST_REVIEW.html`
4. `visual-assets/crests/CREST_REVIEW_STANDALONE.html`
5. `visual-assets/crests/CREST_QA.md`
6. `visual-assets/crests/qa/review-1280-full.png`: regenerated, 1280×4703 (was 1280×4595)
7. `visual-assets/crests/qa/small-size-strip-24-42-96.png`: regenerated, 1248×2354
8. `visual-assets/crests/qa/phone-360x640.png`: regenerated, 360×640
9. `visual-assets/crests/qa/phone-375x553.png`: regenerated, 375×553
10. `claude/handoffs/CC_CREST_V1_HANDOFF_TO_SOL_2026-09-30.md`: corrected (see check 20)
11. `claude/handoffs/CC_CREST_V1_REPAIR_HANDOFF_TO_SOL_2026-09-30.md`: new, this file

### Exact crest-only file list for the whole branch (`ec39ab4..final head`), 12 paths, no duplicates
1. `js/visualIdentity.js` (M)
2. `tests/contracts/crest-v1-identity-contracts.cjs` (A)
3. `claude/handoffs/CC_CREST_V1_HANDOFF_TO_SOL_2026-09-30.md` (A)
4. `claude/handoffs/CC_CREST_V1_REPAIR_BRIEF_2026-09-30.md` (A, Nik's brief)
5. `claude/handoffs/CC_CREST_V1_REPAIR_HANDOFF_TO_SOL_2026-09-30.md` (A, this file)
6. `visual-assets/crests/CREST_QA.md` (A)
7. `visual-assets/crests/CREST_REVIEW.html` (A)
8. `visual-assets/crests/CREST_REVIEW_STANDALONE.html` (A)
9. `visual-assets/crests/qa/review-1280-full.png` (A)
10. `visual-assets/crests/qa/small-size-strip-24-42-96.png` (A)
11. `visual-assets/crests/qa/phone-360x640.png` (A)
12. `visual-assets/crests/qa/phone-375x553.png` (A)

This is the precheck's 10 paths plus the brief and this handoff.

## 1. Verdict
READY FOR SOL RE-PRECHECK. The four failed checks are addressed on `claude-cloud/crest-v1`. Check 14 was a real bug. The new contract fails on the pre-fix source with `AssertionError: "constructor" primary=undefined` and passes after the fix. Check 5 is fixed in both review pages, with shots regenerated. Check 20 is fixed in both handoffs. Check 3 now has evidence against the clarified production-vs-reference rule. The reference PNG was not deleted or moved.

## 2. Sol decision table
| ID | Finding | Severity | Product-truth risk | Resolver | Confidence | Sol decision |
|---|---|---|---|---|---|---|
| CREST-V1-FIX14 | Palette lookup accepted inherited keys; now own-property only | Was MUST FIX | None | Sol | High | |
| CREST-V1-FIX14b | Same inherited-key issue in `getLeagueMark` (`constructor` returned a non-null mark object); guarded the same way | Scope note | None | Sol | High | |
| CREST-V1-FIX5 | League Keeps/Changes added in both pages; QA shots and `CREST_QA.md` regenerated | Was MUST FIX | None | Sol | High | |
| CREST-V1-FIX20 | Original handoff corrected; this handoff records heads and exact file list | Was MUST FIX | None | Sol | High | |
| CREST-V1-FIX3 | Evidence for clarified rule; reference PNG kept | Gate definition | None | Sol | High | |

## 3. MUST FIX
NONE open. How each failed check was cleared:

**Check 14: unknown-name fallback**
- Change (`js/visualIdentity.js`, `getClubIdentity`): `CLUB_IDENTITY_PALETTES[name]` became `(Object.prototype.hasOwnProperty.call(CLUB_IDENTITY_PALETTES, name) && CLUB_IDENTITY_PALETTES[name])`. Known club names resolve exactly as before, so their outputs are unchanged. The recipe lookup already used `hasOwnProperty`.
- Same class of bug in `getLeagueMark`: `LEAGUE_MARK_RECIPES[id]` became an own-property lookup, so `constructor` and similar names return `null` like any unknown id. The valid-id return shape `{id, code, primary, svg, image}` is unchanged. Flagged as FIX14b in case Sol treats it as scope creep; it is 1 line.
- `CREST_REVIEW_STANDALONE.html` embeds `js/visualIdentity.js` verbatim, and the same two lines were applied there. It was checked afterwards: the full source text is still a substring of the standalone page.
- Contract additions (`tests/contracts/crest-v1-identity-contracts.cjs`):
  - Fallback names tested: `constructor`, `__proto__`, `toString`, `hasOwnProperty`, `valueOf`, `""`, `!!!---...???` and `Ünïcødé Ψ 足球 FC`.
  - Each name must be absent as an own key in the palettes and recipes.
  - Each must give hex `primary`, `secondary` and `accent` values, the fallback recipe, and a CSS-ready `identity.crest`.
  - The decoded data URI and the raw `getClubCrestSvg` output must start `<svg` and contain no `undefined` and no `<image>`.
  - `getLeagueMark` returns `null` for `constructor`, `__proto__`, `toString`, `hasOwnProperty` and `""`.
  - Known recipes: still 98, and each club's `identity.recipe` is the exact frozen recipe object.

**Check 5: league Keeps/Changes**
- Both pages now define the same `LEAGUE_NOTES` object and render `<b>Keeps</b> … <br><b>Changes</b> …` on each of the 5 league cards. The old `national flag shield` label, which was wrong for France, is gone.
- The contract parses `LEAGUE_NOTES` from both files. It asserts exactly the 5 league ids, with 2 non-trivial strings each, and that both the league and club card templates render Keeps/Changes.
- Browser run: both pages were checked for 98 club cards and 5 league cards, every card with Keeps and Changes (details in section 10).
- All 4 QA shots were regenerated from the repaired page. `CREST_QA.md` was rewritten with the measured results.

**Check 20: handoff accuracy**
- `CC_CREST_V1_HANDOFF_TO_SOL_2026-09-30.md`:
  - Removed the duplicate standalone-page entry.
  - Replaced "Code head `730ce90`" with the commit history and a pointer to `8426d2d` and this file.
  - Replaced "notice instead of crashing" with the actual behaviour: the page shows a notice, then deliberately throws `Error("crest review scripts not loaded")`.
  - Changed "flag shields on every mark": four marks use a flag shield, and France uses three rounded bars and a star.
  - Narrowed "No raster files" to production SVG and runtime code, naming the QA shots and the reference sheet.
  - Changed "85 PASS lines" to 84 lines from `npm run test:contracts`, plus one from the separately run crest contract.
  - Changed "original geometry" to "self-contained SVG … design intent, not a provenance or likeness guarantee".
  - Replaced the unlogged "0 errors" claim with a pointer to the logged re-run.
- `CREST_QA.md`: the same claims were corrected there.
- This file records the heads and the exact file lists above.

**Check 3: clarified rule** ("Production CREST-V1 club crests and league marks must be self-contained vector output. No production crest/mark SVG may embed raster `<image>` content, and production/runtime crest identity code must not depend on raster logo assets. Raster files are permitted only as non-runtime reference material under `visual-assets/crests/reference/` and QA evidence under `visual-assets/crests/qa/`.")
- Generated output: 206 SVG outputs checked (98 clubs × raw SVG + decoded `identity.crest`, and 5 marks × `svg` + decoded `image`). 0 contain `<image`, `.png` or `href=`.
- `js/visualIdentity.js`: 0 matches for `\.png|\.jpe?g|\.webp|reference/|assets/logos|<image`.
- `git grep CREST_PROOF_SHEET_V2` outside `claude/` and `*.md`: no matches, so no runtime reference.
- Raster files under `visual-assets/crests/`: 4 in `qa/` and `reference/CREST_PROOF_SHEET_V2.png`. That is all of them, and all are in permitted locations. The reference PNG was not touched.

## 4. SHOULD REFINE
Unchanged from Sol's decisions. Not done here, by instruction:
- R1: the crest test is not registered in the POS20 runner.
- R2: `test:home-visual` was not run, because it needs `tar-fs` and `npm ci`.
- R3: `THIRD_PARTY_NOTICES.md` wording is deferred.
- M1: `data/leagues.js` logo fields are deferred.

## 5. Already strong (keep)
The known-club identities are unchanged by the repair. The contract still asserts 98 unique drawings, 98 unique data URIs, and the exact frozen recipe per club.

## 6. Asset fit and blockers
NONE.

## 7. Conflicts found
NONE new. The review-page intro line still reads "Original artwork … outline, pose, layout and text differ from the real badge". That is page copy, not a gate claim, and was left as is. Sol may want it narrowed for the owner gate.

## 8. Questions for Astra
NONE

## 9. Questions for Nik
- CREST-V1-N1 (unchanged): at the owner gate, pick crests that feel too close or too far, including the nine star-theme clubs. League cards now have Keeps/Changes too.

## 10. Evidence appendix
All commands were run at `8426d2d`, the same tree as the final head except for handoff files.

```
$ node tests/contracts/static-app-release-contracts.cjs
PASS Dynamic static release contracts v1.9.1/1.9.1-r46; startup 162545/37457.
exit 0

$ npm run test:contracts
> career-mode-showdown@1.9.1 test:contracts
> node tests/support/run-selected-product-contracts.cjs --all
… (84 lines starting with PASS; last:)
PASS POS10 selected deterministic census (94/94 current blocking contracts: frozen POS10 floor + POS20 supplements).
exit 0

$ node tests/contracts/crest-v1-identity-contracts.cjs
PASS CREST-V1 identity contracts: 98 recipes, 98 unique crests, 5 league marks, 28 ids unique on shared page, 8 hostile/edge unknown names fall back cleanly, league Keeps/Changes in both review pages.
exit 0

# red check: js/visualIdentity.js restored from 7fe0d8e, new contract kept
$ node tests/contracts/crest-v1-identity-contracts.cjs
AssertionError [ERR_ASSERTION]: "constructor" primary=undefined
```

Browser run: a scratch Playwright script, not committed. It used global `playwright@1.56.1` with Chromium at `/opt/pw-browsers/chromium` on `file://` URLs. It collected `console` errors and `pageerror` events and counted `[data-club]` and `[data-league]` cards with both "Keeps" and "Changes" in `.k`.

```
["CREST_REVIEW.html 1280",{"clubs":98,"leagues":5,"clubNotes":98,"leagueNotes":5,"undef":false},[]]
["CREST_REVIEW.html?strip",{"clubs":98,"leagues":5,"clubNotes":98,"leagueNotes":5,"undef":false},[]]
["CREST_REVIEW.html 360x640",{"clubs":98,"leagues":5,"clubNotes":98,"leagueNotes":5,"undef":false},[]]
["CREST_REVIEW.html 375x553",{"clubs":98,"leagues":5,"clubNotes":98,"leagueNotes":5,"undef":false},[]]
["CREST_REVIEW_STANDALONE.html (alone in empty folder)",{"clubs":98,"leagues":5,"clubNotes":98,"leagueNotes":5,"undef":false},[]]
```

The trailing `[]` is the error list, empty on every run. `undef` checks the rendered `#clubs`, `#leagues` and `#strip` HTML only, because the inline script text legitimately contains `"undefined"`. The missing-scripts path of `CREST_REVIEW.html` was not exercised.

## 11. Recommended Sol next actions
1. Run the fresh mechanical precheck against the final `claude-cloud/crest-v1` head, using the clarified check-3 rule.
2. Accept or reject FIX14b (the `getLeagueMark` guard).
3. If all checks pass, send `CREST_REVIEW.html` (or `CREST_REVIEW_STANDALONE.html`) and the `qa/` shots to Nik for the owner visual gate.

## 12. What to send back to Claude for the next task
Sol's precheck result, and Nik's per-crest owner-gate notes (too close, too far, weak), including any direction for the nine star-theme clubs.

CLAUDE HANDOFF COMPLETE - RETURN TO GPT-5.6 SOL FOR RECONCILIATION

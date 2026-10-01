# CC BRIEF · HLC R3.2 patch, then plate intake · 2026-10-01

Repo: `nikahanghojjati-oss/fifa17-career-showdown2` · Branch: `claude-cloud/hlc-goals`
Model: **Opus 5.5** (if not offered, STOP and tell Nik; no fallback) · Effort: **Medium**
STOP_BUDGET: 45 min wall-clock / $9
PRIORITY_ORDER: Part A patch > Part A FOR_SOL file > Part B intake (Home > League > Club > wordmark) > report
Hard rules: never touch `main`, no force-push, no merges to main, no PR.

Setup: clone the repo, then `git fetch origin +refs/heads/claude-cloud/hlc-goals:refs/remotes/origin/claude-cloud/hlc-goals && git checkout -B claude-cloud/hlc-goals origin/claude-cloud/hlc-goals`.
All paths below are under `visual-assets/goals/`. "Four briefs" = `CLOUD_BRIEF_HOME_V1_R3.md`, `CLOUD_BRIEF_LEAGUE_V1_R3.md`, `CLOUD_BRIEF_CLUB_V1_R3.md`, `CLOUD_HLC_INTAKE_V1_R3.md`. Edit them in place (R3.2 keeps the `_R3` filenames).

## PART A · documents only (no intake, no build)

Read `SOL_HLC_R3_QUICK_CHECK_VERDICT_2026-10-01.md` (verdict A, R3.1-1..5, already applied at faa2c09; change log in `FOR_SOL_5.6_HLC_R3_1_CHANGED_LINES_2026-10-01.md`) and `SOL_HLC_R3_QUICK_CHECK_VERDICT_B_2026-10-01.md` (verdict B, D9-D11). Verdict B was written against the pre-R3.1 text, so find the current R3.1 text by grep, do not trust its "old" wording.

KEEP unchanged: R3.1-1 (C5.1 exception), R3.1-2 (`tools/intake_hlc.py` + `evidence/intake_*` + report in PASS branches), R3.1-3 (40 px chips), all of D1-D8, blank `ACCEPTED_CREST_SHA`.

### D9 (supersedes R3.1-5 fingertip wording; Home, League, Club common blocks must stay identical)
Exactly two exceptions remain: League fingertip layering and Club pack reveal. Do not broaden.
1. **C5.7** (rule 7): keep the sentence, and after "(the only such cases are the two bounded runtime exceptions in G8: League-only fingertip/hand layering and Club-only pack reveal)" append: ` League-only fingertip layering exception: on the League screen, the aria-hidden wheel/rim may geometrically pass beneath Daniel's pointing-hand protected region only where the registered OVL_DANIEL_FINGER_V1_* overlay restores the exact original plate pixels above the wheel. No wheel pixel may remain visually over the hand after compositing. No live text, control, or panel may enter the face/hand protected box. All other face/hand protected boxes retain the normal 8 px clearance rule.`
2. **G8, exception 1** (replace the R3.1-5 text "in League, the decorative wheel rim/background may pass beneath Daniel's original hand/fingertip overlay required by W2. No live text, ... Face boxes remain fully protected." with): `**1. League-only fingertip layering:** on the League screen, the aria-hidden wheel/rim may geometrically pass beneath Daniel's pointing-hand protected region only where the registered OVL_DANIEL_FINGER_V1_* overlay restores the exact original plate pixels above the wheel. No wheel pixel may remain visually over the hand after compositing. No live text, control, or panel may enter the face/hand protected box. All other face/hand protected boxes retain the normal 8 px clearance rule. Face boxes remain fully protected.` Keep exception 2 (Club pack reveal, D7) verbatim.
3. **G8 report line** (replace the R3.1-5 "For League QA, report separately: (a)...(d)..." sentence with): `For League, report the wheel/hand overlap region, verify that it is fully contained by the finger-overlay alpha coverage, and verify 0 px overlay registration error. Live text/control/panel intersection with the hand box remains zero. Also report face clearance.`
4. **League W2:** keep "0 px offset at 1X, measured"; replace the trailing "G8 exception: the wheel may sit under this hand; no live text may be under it." with "Governed by the League-only fingertip layering exception in C5.7/G8; QA per G8 (overlap contained by overlay alpha, 0 px registration)."
5. Home and Club briefs get the same C5.7 and G8 text (their League-specific W2 reference does not exist; just keep the common blocks identical). Confirm with a diff of the C5.7 and G8 lines across all three.

### D10 (supersedes R3.1-4 and the earlier CSS mask-image/currentColor hint; League only)
1. In **W1** "Wheel colour language" bullet: delete the entire "Implementation: render `getLeagueMark(id).svg` monochrome via CSS `mask-image` ... `currentColor` ..." sentence. Keep the state rules (unselected: dark wedge, mark and name in off-white / faded pale gold ~`#EFE6CF`; selected: gold wedge, mark and name near-black ~`#0B0D10`). Keep "The marks' own colours (`primary`) may still be used elsewhere, never on the wheel."
2. Replace the "League marks come only from the crest build" bullet's rule sentences (R3.1-4 text "Do not redraw league-mark geometry ... unless separately approved.") with: `League marks must come only from getLeagueMark(id) / applyLeagueMark at the pinned ACCEPTED_CREST_SHA. Preserve the exact source geometry and do not redraw, substitute, or invent any mark. The wheel is allowed and required to apply a presentation-only monochrome treatment. Preserve internal tonal separation so the mark motif and country code remain legible. Preferred methods are a deterministic CSS grayscale/tint/brightness/contrast treatment on the returned mark image, or a deterministic paint mapping of the returned SVG that maps its existing fills/strokes into tonal values inside the target monochrome family. Do not use a whole-mark alpha mask or one-flat-color fill replacement unless a visual assertion proves the internal mark remains legible.` Keep the remaining sentences (`data/leagues.js` untouched, missing mark -> name only + handoff). Outside the wheel, marks stay unrestyled.
3. Add to W1 QA (and the league-mark handoff/QA list): `Assertion: all five marks retain recognizable internal motif separation and legible country code after the monochrome treatment, in both unselected and selected states (crop evidence at 1X).`
4. Self-check: `grep -c "mask-image" CLOUD_BRIEF_LEAGUE_V1_R3.md` must be 0 (also no "currentColor" hint remaining).

### D11
1. **Intake step 6** replace with: `Export the untouched goal reference as REF_GOAL_<SCREEN>.jpg. If the source is already JPEG, copy or losslessly re-encode as appropriate. For Home, convert GOAL_HOME.png to a real JPEG file; do not rename PNG bytes to .jpg. This reference is evidence/composition-only and must not be shipped as product art. (League: the blurred one.)` Add an assertion in step 3's gate list: `REF_GOAL_*.jpg starts with bytes FF D8 FF (real JPEG)`.
2. Part 2 is covered by R3.1-2: verify the Branches paragraph lists `assets/`, `evidence/` (`intake_*`), `tools/intake_hlc.py` and the intake report location. Change nothing if so.

### Changelog and self-check
- Add to each of the four briefs' changelog line: `R3.2 2026-10-01: Sol verdict B D9–D11 merged with R3.1`.
- Self-check (record results): D1-D8 and R3.1-1..3 not regressed (re-grep each marker: C5.1 exception text; `PLATE_G_SOURCE_DRIFT` and `8fbda036`; 40 px chips; Audius four tracks; `plateToScreen` cover-fit; whole-turn-plus-offset L2; pack-box exception; 12 px floor); no "mask-image" in the League brief; `ACCEPTED_CREST_SHA=` still the blank placeholder in League and Club briefs; C5.7/G8 common blocks identical across Home/League/Club; exactly two G8 exceptions.
- Write `FOR_SOL_5.6_HLC_R3_2_FINAL_CHECK_2026-10-01.md` for GPT-5.6 Sol: compact change log of all items from both verdicts (R3.1-1..5 and D9-D11: file, old text, new text, which supersedes which: D9 over R3.1-5 fingertip wording, D10 over R3.1-4 and the mask-image hint, D11-2 already satisfied by R3.1-2), the self-check, diffstat, and the patch commit SHA (commit the briefs first, then write the FOR_SOL file with that SHA, then commit it as a second commit and report both SHAs).
- Commit (stage named files only) and `git push -u origin claude-cloud/hlc-goals`.
- Then STOP and print exactly: `PART A DONE. Send FOR_SOL_5.6_HLC_R3_2_FINAL_CHECK to GPT-5.6 Sol. When Sol says OK, type: continue to Part B.`

## PART B · intake (ONLY when the user types "continue to Part B")

1. `git fetch origin +refs/heads/claude-cloud/hlc-goals:refs/remotes/origin/claude-cloud/hlc-goals && git checkout -B claude-cloud/hlc-goals origin/claude-cloud/hlc-goals`.
2. Check that these 4 files exist in `visual-assets/goals/plates-in/`: `ENV_HOME_PLATE_V1.png`, `ENV_LEAGUE_PLATE_V1.png`, `ENV_CLUB_PLATE_V1.png`, `LOGO_CM17_WORDMARK_V1.png`. If any is missing, STOP and list which.
3. Otherwise follow `CLOUD_HLC_INTAKE_V1_R3.md` (now R3.2) exactly, including its Plate G drift STOP rule (`PLATE_G_SOURCE_DRIFT`).
4. End by printing: the intake PASS/FAIL per screen and the branches created (with head SHAs).

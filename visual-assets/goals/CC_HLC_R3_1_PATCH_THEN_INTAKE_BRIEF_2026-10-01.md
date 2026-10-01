# CC BRIEF · HLC R3.1 patch, then plate intake · 2026-10-01

Repo: `nikahanghojjati-oss/fifa17-career-showdown2` · Branch: `claude-cloud/hlc-goals`
Model: **Opus 5.5** (if not offered, STOP and tell Nik; no fallback) · Effort: **Medium**
STOP_BUDGET: 40 min wall-clock / $8
PRIORITY_ORDER: Part A patch > Part A FOR_SOL file > Part B intake (Home > League > Club > wordmark) > report
Hard rules: never touch `main`, no force-push, no merges to main, no PR.

Setup: clone the repo, then `git fetch origin claude-cloud/hlc-goals && git checkout -B claude-cloud/hlc-goals origin/claude-cloud/hlc-goals`.

## PART A · documents only

1. Read `visual-assets/goals/SOL_HLC_R3_QUICK_CHECK_VERDICT_2026-10-01.md`.
2. Apply exactly its five corrections R3.1-1 through R3.1-5, using Sol's replacement wording verbatim, to the four R3 briefs in `visual-assets/goals/`: `CLOUD_HLC_INTAKE_V1_R3.md`, `CLOUD_BRIEF_HOME_V1_R3.md`, `CLOUD_BRIEF_LEAGUE_V1_R3.md`, `CLOUD_BRIEF_CLUB_V1_R3.md`. Edit in place. Add a changelog line `R3.1 2026-10-01: Sol R3.1-1..5 applied` to each. Change nothing else.
3. Write `visual-assets/goals/FOR_SOL_5.6_HLC_R3_1_CHANGED_LINES_2026-10-01.md`: for each of the five items, the file, the old text and the new text, plus the commit SHA and `git diff --stat`.
4. Commit `HLC R3.1: Sol five line corrections (docs only)` and `git push -u origin claude-cloud/hlc-goals`. Record this SHA as the Part A SHA.

Do not run intake or any screen build before Part A is pushed.

## PART B · intake (only after Part A is pushed)

1. Check that the plate files named in `CLOUD_HLC_INTAKE_V1_R3.md` exist in `visual-assets/goals/plates-in/`: `ENV_HOME_PLATE_V1.png`, `ENV_LEAGUE_PLATE_V1.png`, `ENV_CLUB_PLATE_V1.png`, `LOGO_CM17_WORDMARK_V1.png` (4 files). If any is missing, STOP after Part A and report which are missing.
2. Otherwise follow `CLOUD_HLC_INTAKE_V1_R3.md` (now R3.1) exactly, including its Plate G drift STOP rule (`PLATE_G_SOURCE_DRIFT`).
3. End by printing: the Part A SHA, the path of the FOR_SOL changed-lines file, the intake PASS/FAIL per screen, and the screen branches created.

# CC BRIEF · HLC R3.1 patch, then plate intake · 2026-10-01

Repo: `nikahanghojjati-oss/fifa17-career-showdown2` · Branch: `claude-cloud/hlc-goals`
Model: **Opus 5.5** (if not offered, STOP and tell Nik; no fallback) · Effort: **Medium**
STOP_BUDGET: 40 min wall-clock / $8
PRIORITY_ORDER: Part A patch > Part A FOR_SOL file > Part B intake (Home > League > Club > wordmark) > report
Hard rules: never touch `main`, no force-push, no merges to main, no PR.

Setup: clone the repo, then `git fetch origin claude-cloud/hlc-goals && git checkout -B claude-cloud/hlc-goals origin/claude-cloud/hlc-goals`.

## PART A

ALREADY DONE at faa2c09. Only verify the R3.1 changelog line is present in all four R3 briefs, then go straight to Part B. Do not re-apply.

## PART B · intake (only after Part A is pushed)

1. Check that the plate files named in `CLOUD_HLC_INTAKE_V1_R3.md` exist in `visual-assets/goals/plates-in/`: `ENV_HOME_PLATE_V1.png`, `ENV_LEAGUE_PLATE_V1.png`, `ENV_CLUB_PLATE_V1.png`, `LOGO_CM17_WORDMARK_V1.png` (4 files). If any is missing, STOP after Part A and report which are missing.
2. Otherwise follow `CLOUD_HLC_INTAKE_V1_R3.md` (now R3.1) exactly, including its Plate G drift STOP rule (`PLATE_G_SOURCE_DRIFT`).
3. End by printing: the Part A SHA, the path of the FOR_SOL changed-lines file, the intake PASS/FAIL per screen, and the screen branches created.

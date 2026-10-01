Recipient: Claude Code Cloud session · Surface: claude.ai/code, repo `nikahanghojjati-oss/fifa17-career-showdown2`
Model: **Opus 5.5** · Effort: **Medium**. If Opus 5.5 is not offered, STOP and tell Nik. No automatic fallback.
Input branch: `claude-cloud/hlc-goals` · Output branches: `claude-cloud/home-v1`, `claude-cloud/league-v1`, `claude-cloud/club-v1`
Return to: GPT-5.6 Sol (via Nik), and Claude in the project chat.
Changelog: R3.1 2026-10-01: Sol R3.1-1..5 applied.

```
TASK_ID: CLOUD-HLC-INTAKE-V1-R3
STOP_BUDGET: 30 min wall-clock / $6 credit (asset intake mechanics)
PRIORITY_ORDER: Home plate > League plate > Club plate > wordmark > report
SCOPE: create the 3 screen branches; write only `visual-assets/v10_1/{home,league,club}/{assets,tools,evidence}/` plus that screen's `BUILD_RESULT` / intake report file if the chosen folder structure places it at screen root. Never main, no PR, no merge, no production files.
```

# CLOUD BRIEF · HLC plate intake (Home, League, Club) · R3

Revision: R3 (2026-10-01): D2 and D3 of SOL_HLC_R2_CONSISTENCY_VERDICT_2026-10-01 applied; R2 file kept untouched. R2: applies GPT-5.6 Sol verdict SOL_HLC_BRIEFS_PRODUCT_TRUTH_VERDICT_2026-09-30 (SOL-HLC-5, -6, -8). This Cloud session is the only place intake happens (SOL-HLC-6); the project thread only reviews your evidence.

Run only after Claude has committed Nik's plates to `visual-assets/goals/plates-in/` and Sol has OK'd R3.

## Inputs (`git fetch origin claude-cloud/hlc-goals`)
- Nik's ChatGPT edits, already committed by Claude to `visual-assets/goals/plates-in/` under the ticket file names: `ENV_HOME_PLATE_V1.png`, `ENV_LEAGUE_PLATE_V1.png`, `ENV_CLUB_PLATE_V1.png`, optional `LOGO_CM17_WORDMARK_V1.png`. Process the ones present; list the missing ones.
- Originals: `visual-assets/goals/GOAL_HOME.png` (1672×941), `GOAL_LEAGUE_LOGOS_BLURRED.jpg` (1536×864; the wheel interior is blurred, which is inside a remove zone), `GOAL_CLUB.jpg` (1536×864).
- Zones: `visual-assets/goals/handoffs/HLC_PLATE_ZONES_V1.json`: per screen `remove_rects`, `remove_circles_cx_cy_r`, `keep_rects`, `protected_boxes`, in goal px.
- Method reference: `visual-assets/v10_1/tr2/slice-02-plate/tools/lock_and_clean.py` and that folder's BUILD_RESULT.md.

## Per plate (script `tools/intake_hlc.py`, committed in each screen folder)
1. Resize the edit to the goal's exact size (Lanczos). If framing is off (aligned-crop error > 4 px), try ECC or phase-correlation alignment; if still off, mark the plate FAILED and continue with the next.
2. **Likeness lock (SOL-HLC-5):** `output = original everywhere`; edited pixels may enter **only** the remove zones (6 px feather inside the zone edge); then `keep_rects` **and every `protected_boxes` rect** are hard-restored from the original, overriding the edit and the feather.
3. Gate by assertions, written to `assets/intake_report.md` and `evidence/intake_<screen>.json`:
   - changed pixels outside the authorized remove zones = **0**;
   - changed pixels inside every protected box = **0** (one count per box: faces, hands, packs);
   - changed pixels inside every keep rect = **0**;
   - guide-colour pixels left (R>200, G<80, B>200, or G>200, R<80, B<80) within ±6 px of every zone border = **0**;
   - mean luminance inside each zone ≤ 1.15 × the 12 px ring just outside it.
   Also save `evidence/intake_<screen>.jpg` (original | locked, side by side, 1X). You do not judge likeness: faces are original pixels by construction.
4. Export `ENV_<SCREEN>_PLATE_V1_1X.{png,webp q92}` and `_2X` (Lanczos ×2 + light unsharp), with the SHA-256 of each.
5. `platemap.json`: that screen's zones and protected boxes, unchanged, in 1X plate px, plus plate sizes and SHA-256.
6. Copy the original as `REF_GOAL_<SCREEN>.jpg` (League: the blurred one).
7. Wordmark (Home only, if present): alpha present (≥ 30 % fully transparent pixels), trimmed to content + 8 px, PNG + WebP, SHA-256. Note "spelling to be checked by Nik".

## Branches (SOL-HLC-8)
Resolve `claude-cloud/transfer-tr2-plate-g`. Expected base is `8fbda036c1d1f7910631964e982705d0f25290c0`. If the live head differs, STOP and report `PLATE_G_SOURCE_DRIFT` with the expected SHA, live SHA, and changed-path list. Do not cut HLC branches from an unreviewed newer Plate G head. For each PASS screen, create `claude-cloud/<screen>-v1` from that base, add `visual-assets/v10_1/<screen>/assets/` (plates, `platemap.json`, `REF_GOAL_*`, `intake_report.md` with base SHA, sizes, SHA-256 values and the gate counts), `visual-assets/v10_1/<screen>/evidence/` (`intake_*`) and `visual-assets/v10_1/<screen>/tools/intake_hlc.py`; if `BUILD_RESULT.md` is emitted at screen root under the chosen structure, include it as well. Do not broaden write scope beyond the R3 intake scope. Commit `visual: <SCREEN>-V1 plate intake`, then `git push -u origin claude-cloud/<screen>-v1`. A FAILED plate gets no branch.

## Reply at the end
Per screen: PASS or FAILED with the gate counts, base SHA, branch head SHA, and the side-by-side JPG path so Nik can glance at it.

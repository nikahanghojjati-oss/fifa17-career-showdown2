Recipient: Claude Code Cloud session · Surface: claude.ai/code, repo `nikahanghojjati-oss/fifa17-career-showdown2`
Model: **Opus 5.5** · Effort: **Medium**. If Opus 5.5 is not offered, STOP and tell Nik.
Return to: GPT-5.6 Sol (via Nik), and Claude in the project chat.

```
TASK_ID: CLOUD-HLC-INTAKE-V1
STOP_BUDGET: 30 min wall-clock / $6 credit (asset intake mechanics)
PRIORITY_ORDER: Home plate > League plate > Club plate > wordmark > report
SCOPE: create branches claude-cloud/{home,league,club}-v1; write only visual-assets/v10_1/{home,league,club}/assets/. Never main.
```

# CLOUD BRIEF · HLC plate intake (Home, League, Club)

**Inputs** on branch `claude-cloud/hlc-goals` (`git fetch origin claude-cloud/hlc-goals`):
- Nik's ChatGPT edits in `visual-assets/goals/plates-in/`: `ENV_HOME_PLATE_V1.png`, `ENV_LEAGUE_PLATE_V1.png`, `ENV_CLUB_PLATE_V1.png`, optional `LOGO_CM17_WORDMARK_V1.png`. Process only the ones present; list the missing ones.
- Originals: `visual-assets/goals/GOAL_HOME.png` (1672×941), `GOAL_LEAGUE_LOGOS_BLURRED.jpg` (1536×864; wheel already blurred), `GOAL_CLUB.jpg` (1536×864).
- Zones: `visual-assets/goals/handoffs/HLC_PLATE_ZONES_V1.json` (remove rects/circles, keep rects, protected boxes, in goal px).
- Method reference: `visual-assets/v10_1/tr2/slice-02-plate/tools/lock_and_clean.py` and its BUILD_RESULT.md.

**Per plate (script `tools/intake_hlc.py`, committed in each screen folder):**
1. Resize the edit to the goal's exact size (Lanczos). If framing is off (aligned-crop error > 4 px), try ECC/phase-correlation alignment; if still off, mark the plate FAILED and continue.
2. **Likeness lock:** output = original pixels everywhere, ChatGPT pixels only inside the remove zones (6 px feather); inside `keep_rects` always original. Report 0 px changed outside zones.
3. Gate by assertions and one side-by-side JPG (`evidence/intake_<screen>.jpg`, original | locked): no magenta/green guide pixels left (count pixels with R>200,G<80,B>200 or G>200,R<80,B<80 inside zone borders ±6 px = 0); mean luminance inside each zone ≤ 1.15 × the zone ring outside it (no bright junk); report. You do not judge likeness (faces are original pixels by construction).
4. Export `ENV_<SCREEN>_PLATE_V1_1X.{png,webp q92}` and `_2X` (Lanczos ×2 + light unsharp), SHA-256 of each.
5. `platemap.json`: the zones and protected boxes for that screen from the JSON, unchanged units (1X px), plus plate sizes and SHA-256.
6. Copy the goal as `REF_GOAL_<SCREEN>.jpg` (League: the blurred one).
7. Wordmark (Home only, if present): check alpha exists (≥ 30 % fully transparent pixels), trim to content + 8 px, export PNG + WebP, SHA-256. OCR is not required; note "spelling to be checked by Nik".

**Branches:** for each processed screen, create `claude-cloud/<screen>-v1` from the current head of `claude-cloud/transfer-tr2-plate-g`, add `visual-assets/v10_1/<screen>/assets/` (plate files, `platemap.json`, `REF_GOAL_*`, `intake_report.md` with sizes, SHAs, gate numbers), commit `visual: <SCREEN>-V1 plate intake`, `git push -u origin claude-cloud/<screen>-v1`.

**Reply at the end:** per screen PASS/FAILED with the numbers, branch head SHAs, and the side-by-side JPG paths so Nik can glance at them.

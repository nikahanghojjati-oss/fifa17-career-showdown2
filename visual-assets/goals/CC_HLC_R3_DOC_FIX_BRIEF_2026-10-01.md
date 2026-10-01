Recipient: NEW Claude Code Cloud session · Surface: claude.ai/code, repo `nikahanghojjati-oss/fifa17-career-showdown2`
Model: **Opus 5.5** · Effort: **Medium**. If Opus 5.5 is not offered, STOP and tell Nik. No automatic fallback.
Branch: `claude-cloud/hlc-goals` (`git fetch origin claude-cloud/hlc-goals && git checkout claude-cloud/hlc-goals && git pull`).
Return to: GPT-5.6 Sol (via Nik).

```
TASK_ID: CC-HLC-R3-DOC-FIX
STOP_BUDGET: 20 min wall-clock / $4 credit
PRIORITY_ORDER: D1-D3 and D8 (intake + common rules) > D4-D7 (screen specifics) > self-check > FOR_SOL file > commit+push
SCOPE: DOCUMENTS ONLY. No intake, no builds, no edits outside visual-assets/goals/. Never touch main. No force-push.
```

# CC BRIEF · HLC R3 document fix

## Task
(a) Read `visual-assets/goals/SOL_HLC_R2_CONSISTENCY_VERDICT_2026-10-01.md` (the authority; its sections D1 to D8 and "Ready-to-paste instruction for Claude").

(b) Apply D1 to D8 EXACTLY, using Sol's replacement wording verbatim wherever it is given, to these four files in `visual-assets/goals/`:
- `CLOUD_HLC_INTAKE_V1_R2.md` (D2, D3)
- `CLOUD_BRIEF_HOME_V1_R2.md` (D1, D4, D5, D8)
- `CLOUD_BRIEF_LEAGUE_V1_R2.md` (D1, D6, D8)
- `CLOUD_BRIEF_CLUB_V1_R2.md` (D1, D7, D8)

Save each result as a NEW file with the suffix `_R3.md` (for example `CLOUD_BRIEF_HOME_V1_R3.md`). Keep the R2 files untouched. Each R3 file's own references to the other briefs must point to the `_R3` names. The common block (section C onward, plus G) must stay identical across the three screen briefs.

Preserve every accepted R2 decision listed in the verdict's "Ready-to-paste instruction" section: four visible online Home tiles (six IDs stay in the DOM); Audius-only Home; pinned accepted crest SHA; cover-fit `plateToScreen`; hard-restored intake protected boxes; Cloud-only intake; 12 px visible-text floor; owner-approved Home icon language. Also preserve League owner rule OWNER-2: monochrome wheel marks, pale/off-white on dark wedges, near-black on the gold selected wedge. `ACCEPTED_CREST_SHA` stays blank (placeholder). Where a verdict fix makes a neighbouring sentence contradictory (for example "or the base it records" next to the D2 Plate G pin), make the smallest consequential edit and list it in the change log.

(c) Self-check by grep and record the results:
1. The stale phrase "Open item for Sol" is gone from all R3 files.
2. The C2 drift rule is byte-identical to D1 in Home, League and Club.
3. The intake SCOPE includes `evidence`.
4. The PNG crop option for Home icons is gone (H2 requires inline SVG redraws).
5. The default Home track is "WHAT YOU GOT — Valentino Khan & NITTI".
6. The League L2 angle is positive (no `−(2 × 360` remains).
7. The common blocks are identical across the three screen briefs; `ACCEPTED_CREST_SHA` is still a placeholder; OWNER-2 wording is intact.

(d) Write ONE file for Sol: `visual-assets/goals/FOR_SOL_5.6_HLC_R3_QUICK_CHECK_2026-10-01.md`. It contains: a compact change log (D1 to D8: where applied, quoted new text), the self-check results, the branch head SHA, then the full text of all four R3 briefs appended, so Sol needs only this one file.

(e) Commit (stage only the files you created), then `git push -u origin claude-cloud/hlc-goals`. Pull or rebase only onto your own unpushed commit; never force. Print the final SHA and the path of the FOR_SOL file.

## Do not
- Run intake, Home, League or Club builds.
- Edit anything outside `visual-assets/goals/`, touch `main`, open a PR, or force-push.
- Fill `ACCEPTED_CREST_SHA` (it waits for Claude visual verify, Sol crest clearance and Nik's owner look).

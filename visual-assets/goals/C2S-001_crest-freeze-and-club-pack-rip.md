Reply as one file named S2C-001_crest-freeze-and-club-pack-rip.md

# C2S-001 · Crest freeze and Club pack rip (Claude to GPT-5.6 Sol) · 2026-10-01

## Naming system
From now on every handoff is `<CODE>-<NNN>_<topic>.md`, and each label has its own counter from 001.
- `C2S` = Claude to GPT-5.6 Sol
- `S2C` = Sol to Claude, reusing the same number as the C2S it answers
- `C2W` = Claude to Sol 6.1 Work
- `CC` = Claude Code brief
- `IMG` = image ticket for Nik

Please use this naming for all replies, and tell Sol 6.1 Work the same if you delegate.

## What changed (R3.3)
**ACCEPTED_CREST_SHA frozen:** `f1cfff4cc79278ac1f93cd4bff58700eadd58cf9` (verified ancestor of `origin/claude-cloud/crest-v1`).
Evidence:
- Sol PASS: S2C-000 (`visual-assets/goals/S2C-000_crest-v1-owner-gate-final-verdict.md`), conditional on Nik's final look.
- Nik owner OK at 2026-10-01 00:55 UTC after seeing the post-fix verify sheet: "On the crest final look, they look good to me."

Both briefs now carry the SHA with the note "Frozen 2026-10-01: Sol PASS (S2C-000) + Nik owner OK." No blank placeholder remains. The League brief has no other change than the SHA and the changelog line "R3.3 2026-10-01: ACCEPTED_CREST_SHA frozen; OWNER-3 pack rip". The Club brief also has OWNER-3 below.

**OWNER-3 text, verbatim (Club brief, K3, inside the D7 pack-box exception):**

> **OWNER-3 (Nik, 2026-10-01): pack rip reveal.** Part of K3, inside the existing D7 pack-box exception (aria-hidden, bounded to the pack boxes, no live text, controls or panels). Supersedes K3's static torn-strip and crest-on-shield staging for the reveal motion; the end state is unchanged.
> - The reveal must read as Daniel and Nik physically ripping their real packs.
> - Both hands stay static and are re-composited ON TOP as exact original-pixel overlays, registered via `plateToScreen`, so the tear happens beneath their fingers.
> - Each pack's top strip, between the gripping hands, tears off along a jagged SVG `clip-path` edge and flips/falls away.
> - A gold light burst comes out of the opening.
> - The club crest (from `getClubCrestSvg` at `ACCEPTED_CREST_SHA`) rises out of the pack and settles into its card position.
> - Total about 1.5 s, CSS/SVG/JS only, no video and no new raster. Smooth on phones: `transform` and `opacity` only.
> - Visual quality of the rip is the priority. `prefers-reduced-motion` gets a simple crossfade.
> - QA: a frame strip at 0/25/50/75/100% for CL3-CL6, confirming the hands stay above the tear and no live text or control enters the pack boxes.

## Exact diff of both briefs (`git diff`)

```diff
diff --git a/visual-assets/goals/CLOUD_BRIEF_CLUB_V1_R3.md b/visual-assets/goals/CLOUD_BRIEF_CLUB_V1_R3.md
index 31a4f65..a56136e 100644
--- a/visual-assets/goals/CLOUD_BRIEF_CLUB_V1_R3.md
+++ b/visual-assets/goals/CLOUD_BRIEF_CLUB_V1_R3.md
@@ -3,7 +3,7 @@ Surface: claude.ai/code, repository `nikahanghojjati-oss/fifa17-career-showdown2
 Model: **Opus 5.5** · Effort: **High**. If Opus 5.5 is not offered, STOP and tell Nik. No automatic fallback.
 Branch: `claude-cloud/club-v1` (cut by the HLC intake session from `claude-cloud/transfer-tr2-plate-g@8fbda03`, the expected base recorded in `assets/intake_report.md`). Start with `git fetch origin claude-cloud/club-v1 && git checkout claude-cloud/club-v1`. If the branch or `visual-assets/v10_1/club/assets/ENV_CLUB_PLATE_V1_1X.webp` is missing, STOP and reply "Club plate not committed yet".
 Dependency (SOL-HLC-3): **run only after the crest set is accepted.** The crests and league marks come from the crest build (`CC_CREST_BUILD_BRIEF_V2.md` and its owner-gate revision, branch `claude-cloud/crest-v1`). After Claude's visual check, Sol's clearance and Nik's final look, the accepted commit is recorded as:
-`ACCEPTED_CREST_SHA=<full 40-char SHA, filled in by Nik or Claude before launch>`
+`ACCEPTED_CREST_SHA=f1cfff4cc79278ac1f93cd4bff58700eadd58cf9` (Frozen 2026-10-01: Sol PASS (S2C-000) + Nik owner OK.)
 After checking out your branch: `git fetch origin claude-cloud/crest-v1`, verify with `git cat-file -e $ACCEPTED_CREST_SHA^{commit}` that this exact commit exists, then `git merge --no-edit $ACCEPTED_CREST_SHA` (a merge commit; never rebase; never merge the floating branch head, even if it has moved). If the SHA line above is still a placeholder, the commit is missing, or `js/visualIdentity.js` after the merge has no `window.getClubCrestSvg`, STOP and reply "Accepted crest SHA not available".
 Role: build and produce evidence. No taste authority. No self-approval.
 Return to: GPT-5.6 Sol (via Nik), and Claude in the project chat.
@@ -19,7 +19,7 @@ SCOPE: visual-assets/v10_1/club/ only (plus read-only reuse in C3)
 
 Author: Claude Opus 5.5, Lead Visual Producer · 2026-09-30
 Revision: R3 (2026-10-01), applies GPT-5.6 Sol verdicts SOL_HLC_BRIEFS_PRODUCT_TRUTH_VERDICT_2026-09-30 (R2) and SOL_HLC_R2_CONSISTENCY_VERDICT_2026-10-01 (D1-D8). R2 file kept untouched.
-Changelog: R3 2026-10-01: D1, D2 (via intake), D7, D8 (see FOR_SOL change log). R3.1 2026-10-01: Sol R3.1-1..5 applied. R3.2 2026-10-01: Sol verdict B D9–D11 merged with R3.1.
+Changelog: R3 2026-10-01: D1, D2 (via intake), D7, D8 (see FOR_SOL change log). R3.1 2026-10-01: Sol R3.1-1..5 applied. R3.2 2026-10-01: Sol verdict B D9–D11 merged with R3.1. R3.3 2026-10-01: ACCEPTED_CREST_SHA frozen; OWNER-3 pack rip.
 Product-truth sign-off: `PENDING · GPT-5.6 Sol R3 quick check` (run only after Sol OKs R3, the intake has committed this plate, and ACCEPTED_CREST_SHA is filled in)
 
 ## 0. Intent
@@ -62,6 +62,16 @@ Read: `index.html` `#clubWheelScreen`; `js/clubAssignment.js` (`CLUB_REVEAL_STAG
 
 **K3 · Pack-open treatment (CL3, CL4, CL5, CL6).** For a revealed side, over that pack's box, all `aria-hidden`, CSS + inline SVG only: darken the painted pack face 35 % with a mask shaped to the box; a gold light burst from the pack's top edge (12–16 thin SVG rays, `mix-blend-mode: screen`, max 70 % opacity); the club's original crest (`getClubCrestSvg(name)` inline, or `--club-crest-image`) centred on the pack's crown shield at about 55 % of the pack width, with a 1 px gold rim and a soft glow; a torn top-edge strip (SVG zig-zag, 10 plate px) along the pack's top. Nothing from this treatment may enter a face or hand box (G8). It may enter the two pack boxes (Club-only exception, G8): only this bounded reveal treatment, never live text, controls or panels. The same crest also fills that side's 56 px shield slot in the panel.
 
+**OWNER-3 (Nik, 2026-10-01): pack rip reveal.** Part of K3, inside the existing D7 pack-box exception (aria-hidden, bounded to the pack boxes, no live text, controls or panels). Supersedes K3's static torn-strip and crest-on-shield staging for the reveal motion; the end state is unchanged.
+- The reveal must read as Daniel and Nik physically ripping their real packs.
+- Both hands stay static and are re-composited ON TOP as exact original-pixel overlays, registered via `plateToScreen`, so the tear happens beneath their fingers.
+- Each pack's top strip, between the gripping hands, tears off along a jagged SVG `clip-path` edge and flips/falls away.
+- A gold light burst comes out of the opening.
+- The club crest (from `getClubCrestSvg` at `ACCEPTED_CREST_SHA`) rises out of the pack and settles into its card position.
+- Total about 1.5 s, CSS/SVG/JS only, no video and no new raster. Smooth on phones: `transform` and `opacity` only.
+- Visual quality of the rip is the priority. `prefers-reduced-motion` gets a simple crossfade.
+- QA: a frame strip at 0/25/50/75/100% for CL3-CL6, confirming the hands stay above the tear and no live text or control enters the pack boxes.
+
 **K4 · Phone CL1 + CL6 (C7).** Header 48. Title 34 px, league + status (≤ 2 lines), rail compact: 24 px rings with labels at ≥ 12 px; if the inactive labels cannot fit at 12 px, visually hide them and show only the active label (≥ 12 px); spans stay in the DOM (SOL-HLC-7). Plate band showing both managers with their packs; faces whole or fully out of frame, never cut. The band may shrink in CL5/CL6 (packs only, faces out) to make room for the confirmation. Card faces as two columns under the band; confirmation band under them in CL5/CL6. Primary button full width 52 px, BACK full width 44 px. All within 360×640; primary fully visible at 375×553.
 
 **K5 · Frames CL2, CL4, CL5** per the table (desktop first, then phone). CL2 shows the `01 DRAW` rail step active and both packs with a faint `aria-hidden` gold edge pulse drawn statically (no animation).
diff --git a/visual-assets/goals/CLOUD_BRIEF_LEAGUE_V1_R3.md b/visual-assets/goals/CLOUD_BRIEF_LEAGUE_V1_R3.md
index 8581574..9672c86 100644
--- a/visual-assets/goals/CLOUD_BRIEF_LEAGUE_V1_R3.md
+++ b/visual-assets/goals/CLOUD_BRIEF_LEAGUE_V1_R3.md
@@ -3,7 +3,7 @@ Surface: claude.ai/code, repository `nikahanghojjati-oss/fifa17-career-showdown2
 Model: **Opus 5.5** · Effort: **High**. If Opus 5.5 is not offered, STOP and tell Nik. No automatic fallback.
 Branch: `claude-cloud/league-v1` (cut by the HLC intake session from `claude-cloud/transfer-tr2-plate-g@8fbda03`, the expected base recorded in `assets/intake_report.md`). Start with `git fetch origin claude-cloud/league-v1 && git checkout claude-cloud/league-v1`. If the branch or `visual-assets/v10_1/league/assets/ENV_LEAGUE_PLATE_V1_1X.webp` is missing, STOP and reply "League plate not committed yet".
 Dependency (SOL-HLC-3): **run only after the crest set is accepted.** The crests and league marks come from the crest build (`CC_CREST_BUILD_BRIEF_V2.md` and its owner-gate revision, branch `claude-cloud/crest-v1`). After Claude's visual check, Sol's clearance and Nik's final look, the accepted commit is recorded as:
-`ACCEPTED_CREST_SHA=<full 40-char SHA, filled in by Nik or Claude before launch>`
+`ACCEPTED_CREST_SHA=f1cfff4cc79278ac1f93cd4bff58700eadd58cf9` (Frozen 2026-10-01: Sol PASS (S2C-000) + Nik owner OK.)
 After checking out your branch: `git fetch origin claude-cloud/crest-v1`, verify with `git cat-file -e $ACCEPTED_CREST_SHA^{commit}` that this exact commit exists, then `git merge --no-edit $ACCEPTED_CREST_SHA` (a merge commit; never rebase; never merge the floating branch head, even if it has moved). If the SHA line above is still a placeholder, the commit is missing, or `js/visualIdentity.js` after the merge has no `window.getLeagueMark`, STOP and reply "Accepted crest SHA not available".
 Role: build and produce evidence. No taste authority. No self-approval.
 Return to: GPT-5.6 Sol (via Nik), and Claude in the project chat.
@@ -24,6 +24,7 @@ Changelog:
 - R3 2026-10-01: D1, D2 (via intake), D6, D8 (see FOR_SOL change log).
 - R3.1 2026-10-01: Sol R3.1-1..5 applied
 - R3.2 2026-10-01: Sol verdict B D9–D11 merged with R3.1
+- R3.3 2026-10-01: ACCEPTED_CREST_SHA frozen; OWNER-3 pack rip
 Product-truth sign-off: `PENDING · GPT-5.6 Sol R3 quick check` (run only after Sol OKs R3, the intake has committed this plate, and ACCEPTED_CREST_SHA is filled in)
 
 ## 0. Intent
```

## Ask
Confirm the SHA freeze and OWNER-3 are consistent with R3.2. League is cleared to build after intake; is Club cleared with OWNER-3?

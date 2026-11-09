# BUILD RESULT · Handcrafted art prompts V2: rich, not plain (HO-061 follow-up, r90)

| Field | Value |
|---|---|
| Output | `project-documents/factory/tickets/TICKET-HANDCRAFTED_V2.md` (446 lines; the cap was 450) |
| Branch | `claude/handcrafted-prompts-v2`, cut from `origin/claude/handcrafted-prompts-v1` (6c5e3103) |
| Brief | `project-documents/factory/handoffs/CLOUD_BRIEF_HANDCRAFTED_PROMPTS_V2_RICH.md` on `claude/project-thread-kxgun9` (3d71ef5f1) |
| Where it ran | Team V project thread "Write rich handcrafted art prompts", Opus 5.5 at Max effort, one Ultra Code workflow (Nik asked for it on 8 Nov at 3:28 p.m. Eastern). Billed to Nik's weekly limit; no Claude Code credit was used. |
| Time used | **About 4 hours, double the 2-hour cap:** from 5:55 p.m. to about 9:50 p.m. Eastern on 8 Nov. The workflow took 3 h 38 min of that. This container runs only 2 helpers at a time, so the 12 helpers ran mostly in pairs, one pair after another: studies 61 min, designs 81 min, judge 33 min, writer 28 min, checkers 15 min. The lead set no time check and did not stop the run at the 2-hour mark. |
| Helpers | 12 of the 12 allowed, all finished: 5 studies, 3 designs, 1 judge, 1 writer and 2 checkers. Studies S4 and S5 and the two checkers ran at High effort; the rest ran at Max. |
| Cost | Estimate only: about 2.2 M helper tokens (V1 used about 1.9 M). That probably puts the run at about the $50 cap; exact billing is not visible from the thread. |
| Checker fixes | 37 findings (2 high). 36 were applied as written. 1 was skipped as a duplicate (B04 repeats A01). The lead also changed the wording of one fix line (HC 12 no longer says "glossy"). |
| Studies | All studies, designs, the judge's spec and both checks are saved in the project files at `factory/handcrafted/STUDIES_V2.json`. |

## What the run decided
- **Judge:** D3 "production-safe" won with 48 of 60 points, against D2 "set dressing" (41) and D1 "transform the old plates" (40). The final spec grafts D1's "X becomes Y" swaps and D2's match-night stories and two-chat Home gate onto D3's base.
- **Grammar ("dress each room like a real set"):** 10 rules: three distances; one hero, with a reason for everything; a count of 2-4 things at MEDIUM and up to 6 at RICH; things go beside, behind or below the men; calm zones stay real and quiet; gold is trim only; lamps a person would place; blank by nature; used, not staged; and richness that is measured (flat area 35% or less, mid-tones 24% or more).
- **No hanging lamps:** a four-lamp house family replaces the pendants: a wall lamp, a table or desk lamp, a lamp inside a case, and a caged bulkhead in the tunnel. Every prompt says the light on the faces comes "from behind the camera". The words pendant, chandelier, hang and hanging appear in no prompt, not even as a ban.
- **Home gate:** HC 01 runs twice from one file, MEDIUM (4 things) and RICH (6 things). Nik picks one at Gate A2. RICH means every later desktop prompt gets its one-line Rich add-on pasted at the end. Phones have no add-on.
- **Edit sources:** HC 01 edits Nik's approved HC 01, and HC 04 edits board-room try A, both with the men locked back. The other rooms edit their old plates, with RC_LOUNGE_V2 as the house card. HC 03 is done. HC 06 keeps V1's prompt word for word.
- **Weights:** richness fits. At 1X and WebP quality 75, the busiest old rich plates come to 129-189 KB, under the 200 KB cap. The plain V1 Home is 60 KB.

## Open for the reviewer (Team V thread "Remove plate slogans and fix phone face crops")
1. **Locked files:** HC01_LOUNGE_D_LOCK.png and HC04_BOARD_D_TRY_A_LOCK.png need the lock tool's men-mask mode, which V1 noted was not built yet. Nik already approved the men in HC01_LOUNGE_D_RAW.png, so attaching that file is an option if the tool is not ready.
2. **Phone positions:** a 390x844 iPhone shows only x 15-85 of the phone frame. Before posting each phone guide, Claude re-sets the side things in HC 02, 05, 12 and 14 to fit that band, or tells Nik that the phone shows its room only through the view and the walls. The ticket says this at line 45; the numbers in those prompts are provisional until the guides exist.
3. **Sources:** the dated sources in "How to prompt ChatGPT image for detail" come from the S4 helper's web searches (fal.ai, RunDiffusion, eWeek and Rewarx URLs are in STUDIES_V2.json). The lead did not reopen them.
4. **Review before any run:** Claude reviews the ticket before Nik makes any picture. The V1 ticket's runs stay paused.

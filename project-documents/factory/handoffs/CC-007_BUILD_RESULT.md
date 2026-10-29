# CC-007 build result: one number = one finished job

| Field | Value |
| --- | --- |
| Brief | `project-documents/factory/handoffs/CC-007_FABLE_ONE_TURN_JOBS.md` |
| Branch | `factory/v1-wtt5ye` |
| Date | 2026-10-04 |
| Commits | `7ae39a2` generator, board.py, check.py, jobs/, status/ · `ed1e844` handbook · this file |
| Jobs | **240** (was 140): 38 reshaped jobs keep their number as part 1 and **100 new numbers 140–239** are their later parts |
| Work mode | **0 jobs.** Every open job runs in a normal Sol chat in the project (see "Work mode" below) |
| BOOT box | **No re-paste needed.** `FACTORY_RULES.md` does not mention turns or "continue"; it is unchanged |

## Live state used

Status files with `State: NOT STARTED` at 2026-10-04 (re-checked before each commit; the remote moved 6 commits for job 95 meanwhile, all rebased in): 41 jobs. Left alone as the brief says: 108 (Codex), 118 (image ticket), 99–102 (Team G); 50 is done and 61, 83, 95, 114 are in progress, so they keep their old files. **Reshaped: 38 jobs** (51 52 53 64 65 66 68 69 70 71 73 74 75 76 78 79 80 81 85 86 88 89 90 91 97 103 104 105 106 107 109 110 117 119 120 125 127 128 129).

## What changed

- **Generator** (`tools/jobgen/gen_jobs.py`, block "One-turn jobs" before the numbering section): `split(key, parts)` keeps part 1 on the original number (title gets ` (part 1 of k)`), appends parts 2..k after the last `job()` call with key `<key>_p2`… (so they number 140+), each depending on the part before it, and rewires every job that depended on the original to its **last** part (103's list, each screen's next job, 108 → 233). The `look` flag and the finish line move to the last part. Part helpers regroup the existing v2 steps instead of rewriting them: `review_parts_v3` (4 parts), `fix_parts_v3` (3), `motion_parts_v3` (3), `phone_parts_v3` (3, the layout pass alone), `fixmotion_parts_v3` (4), `list_fix_parts_v3` (3, for the phone-pass and final-review fix lists), plus one-turn part lists for the showcase, binding, phone pass, motion pass, package, top bar, Standings build and the three recipe-only phone-art jobs. `_scrub` removes the v2 wording "two items per turn" and "saved parts 2a, 2b".
- **Job files of parts** carry the one-turn rule in their header (reads ≤ 5 other files, writes ≤ 3 work files plus the status file saved last, about 200 lines, one decision, idempotent resume from the branch's `Job N` commits, the paused line for a refused save) and end with `Job N done: <what>. Next: <numbers>.` where the numbers are computed from the dependency graph. The Steps intro says "Do them all in this turn". Old (started or done) jobs keep their old paragraph untouched.
- **Lanes:** every reshaped job's worker is "GPT-5.6 Sol, normal chat in the ChatGPT project Showdown visual (one new chat per number)" (lane `project (type number)`). No job has lane `work`.
- **Fix lists capped at 9:** every review part 4 (and the phone and motion passes) writes at most 9 items, highest impact first, one change in one file each; the fix round is three jobs (items 1–3, 4–6, 7–9). A part with no items sets DONE in one line; a passed review makes part 1 SKIPPED and parts 2–3 DONE in one line. Items past 9 go under `Left for pass 2`.
- **BOARD.json** rows carry `part_of` and `part`; **board.py** adds every part to its original's screen group automatically (no hand-kept number list for parts) and the "Where to run" line says one number is one turn. "Type next" lists part 1 only when its dependencies are done and later parts only when the earlier part is DONE or SKIPPED (the dependency chain does it: today it shows 51 and 64, not 140).
- **check.py:** a `FIX` verdict refuses more than 3 items (handbook §5b); longer lists become pass 2 after the recheck.
- **Handbook:** Pace rules 1–3 and 7 rewritten (one job = one turn; save as you go, status last; a new chat resumes from the branch; the one-turn size), rules 4–6, 8, 9 kept (9's reply line is now `Job N paused: GitHub refused a save. Type N in a new chat.`); §0, §4 lanes (Work mode dropped), §5b, §6 IN PROGRESS row, §11, §12 and §14 updated; 276 lines (was 281).
- **Fix found on the way:** the generator crashed at HEAD because job 121's system phone plate now exists and the old phone-art block tried to look it up; job 121 (done) is left out of that block, its files unchanged.

## Spot-checks (as a Sol chat, from the number alone)

- **51** (review part 1): reads QUALITY_BAR, two intake notes and the evidence folder; writes REVIEW.md and the status; ends in one turn with `Next: 140`.
- **154** (Rivalry phone, part 2 = the layout pass): reads css and html, writes css and html; the only step; `Next: 155`.
- **144** (Transfer War fix round, part 3): items 7–9 from REVIEW.md, check by reading, Fix round section; no-items and review-passed exits in one line; `Next: 53`.
- Automated audit of all 138 parts: reads ≤ 5 and writes ≤ 3 everywhere except parts **196 and 199** (fix-and-motion part 4 of Settings and Standings: entrance motion in html, js, css plus the BUILD_RESULT Motion section, a fourth small write). Left as is rather than making a number for one table.

## Work mode: studied, not used

Evidence: job 1 (2026-10-02) found Work mode has **no browser** while normal chats have Chromium; only job 12 ever ran there; Nik saw Work mode ask for Continue **every 10–20 seconds, 20–50 times per job**. That cadence is a property of the Work mode turn, not of job size: a one-turn job of about 200 lines would still be cut into 10–20 Continue turns there, so the Continue problem cannot be shaped away. Normal chats in the project use no meter, can run 5 at once and save text to the branch, which is all the remaining jobs need (no job needs a terminal: every script a job mentions runs in the chat's Python sandbox on JSON files, or is left to Claude as a MAKE_ASSETS recipe).

Answers to the four questions: (1) no job type is better off in Work mode; the mechanical multi-file candidates (103–107, 109–110, the phone pass) are now one-turn parts of ≤ 5 reads each, which a normal chat does without Continue. (2) A Work mode job that must not need Continue would have to fit in a 10–20 second turn, far below one useful part; no shape meets that. (3) No model pick is needed. (4) Usage plan: spend none of the two accounts' Work mode quota on factory jobs; keep it for Nik's own use. The board's "Start now (Sol Work mode)" line stays and shows `-`.

## Where to run

Every open job below runs in a **normal Sol chat in the ChatGPT project "Showdown visual" at High, one new chat per number** (lane `project (type number)`): 51 52 53 61 64 65 66 68 69 70 71 73 74 75 76 78 79 80 81 85 86 88 89 90 91 95 97 103 104 105 106 107 109 110 114 117 119 120 125 127 128 129 and every number 140–239. Exceptions: **108** Codex (review only); **118** image ticket in a Temporary Chat outside the project; **99–102** Team G tracking, never started. Work mode: none. Up to 5 chats at once; the board's "Type next" line says which numbers are ready.

## Per original job

| Original | Title | Old steps | Parts | Numbers | What each part does |
| --- | --- | --- | --- | --- | --- |
| 51 | Transfer War: review | 7 | 4 | 51, 140, 141, 142 | **51**: Set up the review; Carry Claude's measurements · **140**: Compare with the mockup by reading · **141**: Product truth and code audit · **142**: Hard gates table; Score the criteria; Verdict and fix list |
| 52 | Transfer War: fix round | 4 | 3 | 52, 143, 144 | **52**: Read the fix list; Fix items 1–3; Check by reading · **143**: Fix items 4–6; Check by reading · **144**: Fix items 7–9; Check by reading; Fix round section |
| 53 | Transfer War: motion | 5 | 3 | 53, 145, 146 | **53**: Motion plan; Standard entrance · **145**: Signature moments (heavy step: save after each moment) · **146**: Interaction feel and reduced motion; Timeline table and check by reading |
| 64 | Career Statistics: review | 7 | 4 | 64, 147, 148, 149 | **64**: Set up the review; Carry Claude's measurements · **147**: Compare with the mockup by reading · **148**: Product truth and code audit · **149**: Hard gates table; Score the criteria; Verdict and fix list |
| 65 | Career Statistics: fix round | 4 | 3 | 65, 150, 151 | **65**: Read the fix list; Fix items 1–3; Check by reading · **150**: Fix items 4–6; Check by reading · **151**: Fix items 7–9; Check by reading; Fix round section |
| 66 | Career Statistics: motion | 5 | 3 | 66, 152, 153 | **66**: Motion plan; Standard entrance · **152**: Signature moments (heavy step: save after each moment) · **153**: Interaction feel and reduced motion; Timeline table and check by reading |
| 68 | Rivalry Statistics: phone | 6 | 3 | 68, 154, 155 | **68**: Phone plan; Heroes on top · **154**: Phone layout (heavy step: this part is only this) · **155**: Controls and the pinned action; Height budget by arithmetic; Phone section and check by reading |
| 69 | Rivalry Statistics: review | 7 | 4 | 69, 156, 157, 158 | **69**: Set up the review; Carry Claude's measurements · **156**: Compare with the mockup by reading · **157**: Product truth and code audit · **158**: Hard gates table; Score the criteria; Verdict and fix list |
| 70 | Rivalry Statistics: fix round | 4 | 3 | 70, 159, 160 | **70**: Read the fix list; Fix items 1–3; Check by reading · **159**: Fix items 4–6; Check by reading · **160**: Fix items 7–9; Check by reading; Fix round section |
| 71 | Rivalry Statistics: motion | 5 | 3 | 71, 161, 162 | **71**: Motion plan; Standard entrance · **161**: Signature moments (heavy step: save after each moment) · **162**: Interaction feel and reduced motion; Timeline table and check by reading |
| 73 | Legacy (History): phone | 6 | 3 | 73, 163, 164 | **73**: Phone plan; Heroes on top · **163**: Phone layout (heavy step: this part is only this) · **164**: Controls and the pinned action; Height budget by arithmetic; Phone section and check by reading |
| 74 | Legacy (History): review | 7 | 4 | 74, 165, 166, 167 | **74**: Set up the review; Carry Claude's measurements · **165**: Compare with the mockup by reading · **166**: Product truth and code audit · **167**: Hard gates table; Score the criteria; Verdict and fix list |
| 75 | Legacy (History): fix round | 4 | 3 | 75, 168, 169 | **75**: Read the fix list; Fix items 1–3; Check by reading · **168**: Fix items 4–6; Check by reading · **169**: Fix items 7–9; Check by reading; Fix round section |
| 76 | Legacy (History): motion | 5 | 3 | 76, 170, 171 | **76**: Motion plan; Standard entrance · **170**: Signature moments (heavy step: save after each moment) · **171**: Interaction feel and reduced motion; Timeline table and check by reading |
| 78 | Season Results: phone | 6 | 3 | 78, 172, 173 | **78**: Phone plan; Heroes on top · **172**: Phone layout (heavy step: this part is only this) · **173**: Controls and the pinned action; Height budget by arithmetic; Phone section and check by reading |
| 79 | Season Results: review | 7 | 4 | 79, 174, 175, 176 | **79**: Set up the review; Carry Claude's measurements · **174**: Compare with the mockup by reading · **175**: Product truth and code audit · **176**: Hard gates table; Score the criteria; Verdict and fix list |
| 80 | Season Results: fix round | 4 | 3 | 80, 177, 178 | **80**: Read the fix list; Fix items 1–3; Check by reading · **177**: Fix items 4–6; Check by reading · **178**: Fix items 7–9; Check by reading; Fix round section |
| 81 | Season Results: motion | 5 | 3 | 81, 179, 180 | **81**: Motion plan; Standard entrance · **179**: Signature moments (heavy step: save after each moment) · **180**: Interaction feel and reduced motion; Timeline table and check by reading |
| 85 | Final Winner: fix round | 4 | 3 | 85, 181, 182 | **85**: Read the fix list; Fix items 1–3; Check by reading · **181**: Fix items 4–6; Check by reading · **182**: Fix items 7–9; Check by reading; Fix round section |
| 86 | Final Winner: motion | 5 | 3 | 86, 183, 184 | **86**: Motion plan; Standard entrance · **183**: Signature moments (heavy step: save after each moment) · **184**: Interaction feel and reduced motion; Timeline table and check by reading |
| 88 | Start / Join: phone | 6 | 3 | 88, 185, 186 | **88**: Phone plan; Heroes on top · **185**: Phone layout (heavy step: this part is only this) · **186**: Controls and the pinned action; Height budget by arithmetic; Phone section and check by reading |
| 89 | Start / Join: review | 7 | 4 | 89, 187, 188, 189 | **89**: Set up the review; Carry Claude's measurements · **187**: Compare with the mockup by reading · **188**: Product truth and code audit · **189**: Hard gates table; Score the criteria; Verdict and fix list |
| 90 | Start / Join: fix round | 4 | 3 | 90, 190, 191 | **90**: Read the fix list; Fix items 1–3; Check by reading · **190**: Fix items 4–6; Check by reading · **191**: Fix items 7–9; Check by reading; Fix round section |
| 91 | Start / Join: motion | 5 | 3 | 91, 192, 193 | **91**: Motion plan; Standard entrance · **192**: Signature moments (heavy step: save after each moment) · **193**: Interaction feel and reduced motion; Timeline table and check by reading |
| 97 | Settings: fix round and motion | 5 | 4 | 97, 194, 195, 196 | **97**: Read the fix list (this job never skips); Fix items 1–3; Check by reading · **194**: Fix items 4–6; Check by reading · **195**: Fix items 7–9; Check by reading; Fix round section · **196**: Standard entrance motion; Motion section and check by reading |
| 103 | Showcase: every screen in one place | 4 | 5 | 103, 210, 211, 212, 213 | **103**: Hub links: Home, League, Club Assignment, Transfer War · **210**: Hub links: Trophy Room, Career Statistics, Rivalry Statistics, Legacy (History) · **211**: Hub links: Season Results, Final Winner, Start / Join, Standings · **212**: Hub links: Loading, Rule Book, Settings; Router · **213**: Phone mode toggle; Check by reading |
| 104 | Showcase: screens read Team G's model-true fixtures | 4 | 8 | 104, 214, 215, 216, 217, 218, 219, 220 | **104**: Binding table: Home, Start / Join, Season Results · **214**: Binding table: Final Winner, Rivalry Statistics, Career Statistics · **215**: Binding table: Standings, Legacy (History), Trophy Room · **216**: Swap the sample numbers: Home, Start / Join, Season Results · **217**: Swap the sample numbers: Final Winner, Rivalry Statistics, Career Statistics · **218**: Swap the sample numbers: Standings, Legacy (History), Trophy Room · **219**: Top bar locks and the js renames · **220**: Consistency check |
| 105 | Full phone pass | 4 | 7 | 105, 221, 222, 223, 224, 225, 226 | **105**: Claude's phone measurements: Home, League, Club Assignment, Transfer War, Loading · **221**: Claude's phone measurements: Trophy Room, Career Statistics, Rivalry Statistics, Legacy (History), Season Results · **222**: Claude's phone measurements: Final Winner, Start / Join, Standings, Rule Book, Settings · **223**: Consistency between screens: Home, League, Club Assignment, Transfer War, Loading · **224**: Consistency between screens: Trophy Room, Career Statistics, Rivalry Statistics, Legacy (History), Season Results · **225**: Consistency between screens: Final Winner, Start / Join, Standings, Rule Book, Settings · **226**: Walk the flow by reading; Fix list |
| 106 | Full phone pass: fixes | 3 | 3 | 106, 227, 228 | **106**: Fix items 1–3; Check by reading · **227**: Fix items 4–6; Check by reading · **228**: Fix items 7–9; Check by reading; Fix round section |
| 107 | Motion and sound consistency pass | 4 | 6 | 107, 229, 230, 231, 232, 233 | **107**: Collect the timelines: Home, League, Club Assignment, Transfer War, Loading · **229**: Collect the timelines: Trophy Room, Career Statistics, Rivalry Statistics, Legacy (History), Season Results · **230**: Collect the timelines: Final Winner, Start / Join, Standings, Rule Book, Settings · **231**: Shared screen-to-screen transition · **232**: Align the outliers · **233**: Menu feedback sounds by reading; Write the pass |
| 109 | Final fixes | 3 | 3 | 109, 234, 235 | **109**: Fix items 1–3; Check by reading · **234**: Fix items 4–6; Check by reading · **235**: Fix items 7–9; Check by reading; Fix round section |
| 110 | Package for Nik and handoff to GPT-5.6 Sol | 3 | 5 | 110, 236, 237, 238, 239 | **110**: Approval page: Home, League, Club Assignment, Transfer War, Loading · **236**: Approval page: Trophy Room, Career Statistics, Rivalry Statistics, Legacy (History), Season Results · **237**: Approval page: Final Winner, Start / Join, Standings, Rule Book, Settings · **238**: Package list · **239**: Handoff |
| 117 | Phone art: Rivalry Statistics | 6 | 2 | 117, 207 | **117**: Cut-out polygons (recipe only) · **207**: Phone proof (recipe only); Weight and intake note |
| 119 | Phone art: Season Results | 6 | 2 | 119, 208 | **119**: Cut-out polygons (recipe only) · **208**: Phone proof (recipe only); Weight and intake note |
| 120 | Phone art: Start / Join | 6 | 2 | 120, 209 | **120**: Cut-out polygons (recipe only) · **209**: Phone proof (recipe only); Weight and intake note |
| 125 | Top bar and phone bottom bar | 6 | 3 | 125, 205, 206 | **125**: Contract; Desktop bar: markup and CSS · **205**: Desktop bar: behaviour; Phone bottom bar; README · **206**: Proof by text |
| 127 | Standings: build (desktop and phone) | 10 | 6 | 127, 200, 201, 202, 203, 204 | **127**: Scaffold; Stage · **200**: Title block; Scoreboard panel · **201**: Toggle and career view; States · **202**: Depth sandwich (recipe only) · **203**: Phone layout (heavy step: this part is only this) · **204**: Phone height budget by arithmetic; Check by reading and BUILD_RESULT |
| 129 | Standings: fix round and motion | 5 | 4 | 129, 197, 198, 199 | **129**: Read the fix list (this job never skips); Fix items 1–3; Check by reading · **197**: Fix items 4–6; Check by reading · **198**: Fix items 7–9; Check by reading; Fix round section · **199**: Standard entrance motion; Motion section and check by reading |

## Screen-to-number map (as board.py groups them now)

| Screen | Numbers |
| --- | --- |
| Home | 31, 32, 33, 34, 35, 36, 111, 122 |
| League | 37, 38, 39, 40, 41, 42, 112, 123 |
| Club | 43, 44, 45, 46, 47, 48, 113 |
| Transfer | 49, 50, 51, 52, 53, 114, 140, 141, 142, 143, 144, 145, 146 |
| Loading | 11, 54, 55, 56 |
| Trophy Room | 2, 23, 57, 58, 59, 60, 61, 115, 130, 136 |
| Career Stats | 3, 24, 62, 63, 64, 65, 66, 116, 131, 137, 147, 148, 149, 150, 151, 152, 153 |
| Rivalry | 4, 25, 67, 68, 69, 70, 71, 117, 135, 154, 155, 156, 157, 158, 159, 160, 161, 162, 207 |
| Legacy | 5, 26, 72, 73, 74, 75, 76, 118, 132, 138, 163, 164, 165, 166, 167, 168, 169, 170, 171 |
| Season Results | 6, 27, 77, 78, 79, 80, 81, 119, 133, 172, 173, 174, 175, 176, 177, 178, 179, 180, 208 |
| Final Winner | 7, 82, 83, 84, 85, 86, 134, 139, 181, 182, 183, 184 |
| Start/Join | 8, 28, 87, 88, 89, 90, 91, 120, 185, 186, 187, 188, 189, 190, 191, 192, 193, 209 |
| Standings | 126, 127, 128, 129, 197, 198, 199, 200, 201, 202, 203, 204 |
| Rule Book | 9, 92, 93, 94 |
| Settings | 10, 95, 96, 97, 194, 195, 196 |
| Setup | 0, 1 |
| Foundation | 12, 13, 14, 15, 16, 17, 18 |
| Art | 19, 20, 21, 22, 29, 30, 121, 124 |
| Top bar | 125, 205, 206 |
| Integration | 103, 104, 105, 106, 107, 108, 109, 110, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239 |

## Left undone

- Nothing from the brief. Not reshaped on purpose: 108 (its only change is `Depends on: 233`), 118, 99–102, 50, 61, 83, 95, 114 and every done job.
- Job 104 (binding) assumes one G-11 fixture file per screen group; if Team G ships a different shape, parts 214–220 need their read lists refreshed (generator only).

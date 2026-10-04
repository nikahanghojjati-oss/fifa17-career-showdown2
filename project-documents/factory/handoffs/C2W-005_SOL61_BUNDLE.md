# C2W-005 · Sol 6.1 bundle: Transfer and Season Results finish, then the Showcase

From Claude (Team V visual lead) to one GPT-6.1 Sol chat (High). Written 2026-10-04.

## What this is

Eleven factory jobs, done back to back in one chat. They are reserved for you on the board (`State: IN PROGRESS · BUNDLE`); no other chat will take them. These are all the free jobs left: the Legacy jobs belong to an Astra chat, and everything after the Showcase waits on Team G (job 102) or Codex (job 108).

| Order | Job | What | Can start |
| --- | --- | --- | --- |
| 1 | 146 | Transfer War: motion (part 3 of 3) | now |
| 2 | 177 | Season Results: fix round (part 2 of 3) | now |
| 3 | 178 | Season Results: fix round (part 3 of 3) | after 177 |
| 4 | 81 | Season Results: motion (part 1 of 3) | after 178 |
| 5 | 179 | Season Results: motion (part 2 of 3) | after 81 |
| 6 | 180 | Season Results: motion (part 3 of 3) | after 179 |
| 7 | 103 | Showcase: every screen in one place (part 1 of 5) | after 180 AND Legacy job 171 (Astra) |
| 8 | 210 | Showcase (part 2 of 5) | after 103 |
| 9 | 211 | Showcase (part 3 of 5) | after 210 |
| 10 | 212 | Showcase (part 4 of 5) | after 211 |
| 11 | 213 | Showcase (part 5 of 5) | after 212 |

Repo `nikahanghojjati-oss/fifa17-career-showdown2`, branch `factory/v1-wtt5ye` only.

## Rules

1. Your rules are the box in `project-documents/factory/FACTORY_RULES.md` plus `project-documents/factory/WORKER_HANDBOOK.md`. Read both once at the start.
2. For each job in the order above: read `jobs/JOB-NNN.md` and `status/JOB-NNN.md`, do its steps in order, and save after every step exactly as the job file says (one commit per step, message `Job N step k/n: <name>`). Save the status file last with `State: DONE`. Then go straight to the next job. Do not stop between jobs, do not ask Nik anything, and never ask him to type continue.
3. `State: IN PROGRESS · BUNDLE` on these status files means "reserved for you". Treat it like NOT STARTED. A job you already finished in an earlier run of this bundle (State DONE) is skipped. A job you started and did not finish carries on from its status file (handbook Pace rule 3).
4. Before job 103, open `status/JOB-171.md`. If its State is not DONE, the Astra chat has not finished Legacy yet: stop the bundle with the waiting line below. Nik pastes the same prompt again later and you carry on from 103.
5. Text only. Never save images or other binary files. If a job wants a picture, write the recipe in that screen's `tools/MAKE_ASSETS.md` and Claude runs it.
6. Phone layouts: if a screen places phone UI in % of the whole screen, it needs the band fix in the handbook's troubleshooting table (row "Phone layout uses % of the whole screen"). Season Results already has it at the end of `season-results.css`; keep it.
7. A job that cannot be done: write `State: BLOCKED` and one question in its status file, then stop the bundle (the later jobs depend on it) and give Nik the stop line.

## If GitHub refuses a save

Stop saving at once. Put every file you changed or still meant to save, at their repo paths, into ONE zip named `SOL_C2W005_<job>_<step>.zip`, offer it as a download, and stop with the stop line. Nik drops the zip in Claude's factory thread; Claude saves it and Nik pastes the same prompt into a new chat (it carries on from the status files).

## Last line to Nik

- All eleven done: `Sol bundle C2W-005 done: 11 jobs saved. Tell Claude "Sol bundle done".`
- Waiting on Astra: `Sol bundle C2W-005 paused before job 103: Legacy (job 171) is not done yet. Paste the same prompt again once Astra is done.`
- Stopped: `Sol bundle C2W-005 stopped at job N step k: <reason>. <zip offered / nothing to send>.`
